import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import slugify from "slugify";
import { z } from "zod";

import {
  hashSecret,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifySecret
} from "../../lib/auth";
import { createMailer } from "../../lib/mailer";
import { toJsonSchema } from "../../lib/schemas";

const signupSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  fullName: z.string().min(2).max(100),
  password: z.string().min(8).max(128),
  workspaceName: z.string().min(2).max(100)
});

const signinSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

const forgotPasswordSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase())
});

const resetPasswordSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  token: z.string().min(20)
});

function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function uniqueWorkspaceSlug(app: FastifyInstance, name: string) {
  const base = slugify(name, { lower: true, strict: true }) || "workspace";
  let slug = base;
  let counter = 1;

  while (await app.prisma.workspace.findUnique({ where: { slug } })) {
    counter += 1;
    slug = `${base}-${counter}`;
  }

  return slug;
}

async function buildAuthPayload(
  app: FastifyInstance,
  userId: string,
  sessionMeta?: {
    ipAddress?: string;
    userAgent?: string;
  },
) {
  const user = await app.prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      memberships: {
        where: { deletedAt: null },
        include: { workspace: true }
      }
    }
  });

  const session = await app.prisma.session.create({
    data: {
      expiresAt: new Date(Date.now() + app.config.refreshTokenTtlDays * 24 * 60 * 60 * 1000),
      ipAddress: sessionMeta?.ipAddress,
      refreshTokenHash: "pending",
      userAgent: sessionMeta?.userAgent,
      userId: user.id
    }
  });

  const refreshToken = signRefreshToken(
    {
      sessionId: session.id,
      userId: user.id
    },
    app.config.jwtRefreshSecret,
    app.config.refreshTokenTtlDays,
  );

  await app.prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: await hashSecret(refreshToken)
    }
  });

  const currentWorkspaceId = user.currentWorkspaceId ?? user.memberships[0]?.workspaceId ?? "";

  return {
    accessToken: signAccessToken(
      { userId: user.id },
      app.config.jwtAccessSecret,
      app.config.accessTokenTtlMinutes,
    ),
    refreshToken,
    user: {
      currentWorkspaceId,
      email: user.email,
      fullName: user.fullName,
      id: user.id,
      memberships: user.memberships.map((membership) => ({
        role: membership.role,
        workspaceId: membership.workspaceId,
        workspaceName: membership.workspace.name
      }))
    }
  };
}

export async function authModule(app: FastifyInstance) {
  app.post(
    "/auth/signup",
    {
      schema: {
        body: toJsonSchema("AuthSignupBody", signupSchema)
      }
    },
    async (request, reply) => {
      const body = signupSchema.parse(request.body);
      const existing = await app.prisma.user.findUnique({ where: { email: body.email } });

      if (existing) {
        reply.status(409).send({ message: "A user with that email already exists." });
        return;
      }

      const user = await app.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: body.email,
            fullName: body.fullName,
            passwordHash: await hashSecret(body.password)
          }
        });
        const workspace = await tx.workspace.create({
          data: {
            name: body.workspaceName,
            slug: await uniqueWorkspaceSlug(app, body.workspaceName)
          }
        });

        await tx.membership.create({
          data: {
            role: "OWNER",
            userId: createdUser.id,
            workspaceId: workspace.id
          }
        });

        await tx.user.update({
          where: { id: createdUser.id },
          data: {
            currentWorkspaceId: workspace.id
          }
        });

        return createdUser;
      });

      return buildAuthPayload(app, user.id, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"]
      });
    },
  );

  app.post(
    "/auth/signin",
    {
      schema: {
        body: toJsonSchema("AuthSigninBody", signinSchema)
      }
    },
    async (request, reply) => {
      const body = signinSchema.parse(request.body);
      const user = await app.prisma.user.findUnique({ where: { email: body.email } });

      if (!user || user.deletedAt || !(await verifySecret(body.password, user.passwordHash))) {
        reply.status(401).send({ message: "Invalid email or password." });
        return;
      }

      return buildAuthPayload(app, user.id, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"]
      });
    },
  );

  app.post(
    "/auth/refresh",
    {
      schema: {
        body: toJsonSchema("AuthRefreshBody", refreshSchema)
      }
    },
    async (request, reply) => {
      const body = refreshSchema.parse(request.body);

      try {
        const payload = verifyRefreshToken(body.refreshToken, app.config.jwtRefreshSecret);
        const session = await app.prisma.session.findUnique({ where: { id: payload.sessionId } });

        if (
          !session ||
          session.revokedAt ||
          session.expiresAt < new Date() ||
          !(await verifySecret(body.refreshToken, session.refreshTokenHash))
        ) {
          reply.status(401).send({ message: "Invalid refresh token." });
          return;
        }

        return {
          accessToken: signAccessToken(
            { userId: payload.userId },
            app.config.jwtAccessSecret,
            app.config.accessTokenTtlMinutes,
          )
        };
      } catch {
        reply.status(401).send({ message: "Invalid refresh token." });
      }
    },
  );

  app.post(
    "/auth/signout",
    {
      schema: {
        body: toJsonSchema("AuthSignoutBody", refreshSchema)
      }
    },
    async (request) => {
      const body = refreshSchema.parse(request.body);

      try {
        const payload = verifyRefreshToken(body.refreshToken, app.config.jwtRefreshSecret);
        await app.prisma.session.updateMany({
          where: {
            id: payload.sessionId,
            userId: payload.userId
          },
          data: {
            revokedAt: new Date()
          }
        });
      } catch {
        app.log.warn("Ignoring invalid refresh token during signout");
      }

      return { ok: true };
    },
  );

  app.post(
    "/auth/forgot-password",
    {
      schema: {
        body: toJsonSchema("AuthForgotPasswordBody", forgotPasswordSchema)
      }
    },
    async (request) => {
      const body = forgotPasswordSchema.parse(request.body);
      const user = await app.prisma.user.findUnique({ where: { email: body.email } });

      if (user && !user.deletedAt) {
        const token = randomToken();
        await app.prisma.passwordResetToken.create({
          data: {
            expiresAt: new Date(Date.now() + app.config.resetTokenTtlMinutes * 60 * 1000),
            tokenHash: await hashSecret(token),
            userId: user.id
          }
        });

        const mailer = createMailer({
          host: app.config.mailHost,
          mailFrom: app.config.mailFrom,
          port: app.config.mailPort
        });

        await mailer.sendMail({
          subject: "Reset your Personal CRM password",
          text: `Use this token to reset your password: ${token}`,
          to: user.email
        });
      }

      return {
        message: "If an account exists, a reset email has been sent."
      };
    },
  );

  app.post(
    "/auth/reset-password",
    {
      schema: {
        body: toJsonSchema("AuthResetPasswordBody", resetPasswordSchema)
      }
    },
    async (request, reply) => {
      const body = resetPasswordSchema.parse(request.body);
      const user = await app.prisma.user.findUnique({ where: { email: body.email } });

      if (!user) {
        reply.status(400).send({ message: "Invalid reset token." });
        return;
      }

      const candidates = await app.prisma.passwordResetToken.findMany({
        where: {
          expiresAt: { gt: new Date() },
          usedAt: null,
          userId: user.id
        }
      });

      const tokenRecord = (
        await Promise.all(
          candidates.map(async (candidate) =>
            (await verifySecret(body.token, candidate.tokenHash)) ? candidate : null,
          ),
        )
      ).find(Boolean);

      if (!tokenRecord) {
        reply.status(400).send({ message: "Invalid reset token." });
        return;
      }

      await app.prisma.$transaction([
        app.prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: await hashSecret(body.password)
          }
        }),
        app.prisma.passwordResetToken.update({
          where: { id: tokenRecord.id },
          data: {
            usedAt: new Date()
          }
        }),
        app.prisma.session.updateMany({
          where: { userId: user.id },
          data: {
            revokedAt: new Date()
          }
        })
      ]);

      return { ok: true };
    },
  );
}
