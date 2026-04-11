import type { MembershipRole } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcryptjs";
import fp from "fastify-plugin";
import jwt from "jsonwebtoken";

type AccessTokenPayload = {
  type: "access";
  userId: string;
};

type RefreshTokenPayload = {
  sessionId: string;
  type: "refresh";
  userId: string;
};

export async function hashSecret(value: string) {
  return bcrypt.hash(value, 10);
}

export async function verifySecret(value: string, hash: string) {
  return bcrypt.compare(value, hash);
}

export function signAccessToken(
  payload: Omit<AccessTokenPayload, "type">,
  secret: string,
  expiresInMinutes: number,
) {
  return jwt.sign({ ...payload, type: "access" }, secret, {
    expiresIn: `${expiresInMinutes}m`
  });
}

export function signRefreshToken(
  payload: Omit<RefreshTokenPayload, "type">,
  secret: string,
  expiresInDays: number,
) {
  return jwt.sign({ ...payload, type: "refresh" }, secret, {
    expiresIn: `${expiresInDays}d`
  });
}

export function verifyAccessToken(token: string, secret: string) {
  return jwt.verify(token, secret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string, secret: string) {
  return jwt.verify(token, secret) as RefreshTokenPayload;
}

async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  const workspaceId = request.headers["x-workspace-id"];

  if (!header?.startsWith("Bearer ") || typeof workspaceId !== "string") {
    reply.status(401).send({ message: "Missing bearer token or workspace header." });
    return;
  }

  try {
    const payload = verifyAccessToken(header.replace("Bearer ", ""), request.server.config.jwtAccessSecret);
    const membership = await request.server.prisma.membership.findFirst({
      where: {
        deletedAt: null,
        userId: payload.userId,
        workspaceId
      }
    });

    if (!membership) {
      reply.status(403).send({ message: "Workspace membership not found." });
      return;
    }

    request.auth = {
      role: membership.role,
      userId: payload.userId,
      workspaceId
    };
  } catch {
    reply.status(401).send({ message: "Invalid access token." });
  }
}

async function authorize(
  roles: MembershipRole[] | undefined,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  await request.server.authenticate(request, reply);

  if (reply.sent) {
    return;
  }

  if (roles && request.auth && !roles.includes(request.auth.role)) {
    reply.status(403).send({ message: "Insufficient role." });
  }
}

export const authPlugin = fp(async (app) => {
  app.decorate("authenticate", authenticate);
  app.decorate("authorize", (roles?: MembershipRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => authorize(roles, request, reply);
  });

  app.addHook("onRequest", async (request) => {
    request.auth = null;
  });
});

