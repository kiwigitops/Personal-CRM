import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import slugify from "slugify";
import { endOfDay, startOfDay, startOfMonth, subDays } from "date-fns";
import { z } from "zod";

import { hashSecret, verifySecret } from "../../lib/auth";
import { createMailer } from "../../lib/mailer";
import { recordAuditEvent } from "../../lib/audit";
import {
  contactListInclude,
  serializeContactListItem,
  serializeFollowup,
  serializeInteraction
} from "../../lib/serializers";
import { toJsonSchema } from "../../lib/schemas";

const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100)
});

const inviteSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  role: z.enum(["ADMIN", "MEMBER"])
});

const acceptInviteSchema = z.object({
  token: z.string().min(20)
});

const roleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"])
});

async function uniqueWorkspaceSlug(app: FastifyInstance, name: string, workspaceId: string) {
  const base = slugify(name, { lower: true, strict: true }) || "workspace";
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await app.prisma.workspace.findUnique({ where: { slug } });
    if (!existing || existing.id === workspaceId) {
      return slug;
    }
    counter += 1;
    slug = `${base}-${counter}`;
  }
}

export async function workspacesModule(app: FastifyInstance) {
  app.get(
    "/workspaces/current",
    {
      preHandler: app.authorize()
    },
    async (request) => {
      return app.prisma.workspace.findUniqueOrThrow({
        where: {
          id: request.auth!.workspaceId
        }
      });
    },
  );

  app.patch(
    "/workspaces/current",
    {
      preHandler: app.authorize(["OWNER", "ADMIN"]),
      schema: {
        body: toJsonSchema("WorkspaceUpdateBody", updateWorkspaceSchema)
      }
    },
    async (request) => {
      const body = updateWorkspaceSchema.parse(request.body);
      const workspace = await app.prisma.workspace.update({
        where: { id: request.auth!.workspaceId },
        data: {
          name: body.name,
          slug: await uniqueWorkspaceSlug(app, body.name, request.auth!.workspaceId)
        }
      });

      await recordAuditEvent(app, {
        action: "workspace.updated",
        actorType: "USER",
        actorUserId: request.auth!.userId,
        entityId: workspace.id,
        entityType: "workspace",
        workspaceId: request.auth!.workspaceId
      });

      return workspace;
    },
  );

  app.get(
    "/workspaces/members",
    {
      preHandler: app.authorize()
    },
    async (request) => {
      const members = await app.prisma.membership.findMany({
        where: {
          deletedAt: null,
          workspaceId: request.auth!.workspaceId
        },
        include: {
          user: true
        },
        orderBy: {
          createdAt: "asc"
        }
      });

      return members.map((membership) => ({
        email: membership.user.email,
        fullName: membership.user.fullName,
        id: membership.id,
        role: membership.role
      }));
    },
  );

  app.post(
    "/workspaces/invitations",
    {
      preHandler: app.authorize(["OWNER", "ADMIN"]),
      schema: {
        body: toJsonSchema("WorkspaceInviteBody", inviteSchema)
      }
    },
    async (request) => {
      const body = inviteSchema.parse(request.body);
      const token = crypto.randomBytes(32).toString("hex");
      const invitation = await app.prisma.workspaceInvitation.create({
        data: {
          email: body.email,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invitedById: request.auth!.userId,
          role: body.role,
          tokenHash: await hashSecret(token),
          workspaceId: request.auth!.workspaceId
        }
      });

      const mailer = createMailer({
        host: app.config.mailHost,
        mailFrom: app.config.mailFrom,
        port: app.config.mailPort
      });
      await mailer.sendMail({
        subject: "You have been invited to Personal CRM",
        text: `Use this invitation token after signing in: ${token}`,
        to: body.email
      });

      await recordAuditEvent(app, {
        action: "workspace.invitation.created",
        actorType: "USER",
        actorUserId: request.auth!.userId,
        entityId: invitation.id,
        entityType: "workspace_invitation",
        metadata: { email: body.email, role: body.role },
        workspaceId: request.auth!.workspaceId
      });

      return { inviteToken: token };
    },
  );

  app.post(
    "/workspaces/invitations/accept",
    {
      preHandler: app.authorize(),
      schema: {
        body: toJsonSchema("WorkspaceAcceptInviteBody", acceptInviteSchema)
      }
    },
    async (request, reply) => {
      const body = acceptInviteSchema.parse(request.body);
      const user = await app.prisma.user.findUniqueOrThrow({ where: { id: request.auth!.userId } });
      const invitations = await app.prisma.workspaceInvitation.findMany({
        where: {
          email: user.email,
          expiresAt: { gt: new Date() },
          status: "PENDING"
        }
      });
      const invitation = (
        await Promise.all(
          invitations.map(async (candidate) =>
            (await verifySecret(body.token, candidate.tokenHash)) ? candidate : null,
          ),
        )
      ).find(Boolean);

      if (!invitation) {
        reply.status(400).send({ message: "Invalid invitation token." });
        return;
      }

      const membership = await app.prisma.$transaction(async (tx) => {
        const created = await tx.membership.upsert({
          where: {
            workspaceId_userId: {
              userId: user.id,
              workspaceId: invitation.workspaceId
            }
          },
          update: {
            deletedAt: null,
            role: invitation.role
          },
          create: {
            role: invitation.role,
            userId: user.id,
            workspaceId: invitation.workspaceId
          }
        });

        await tx.workspaceInvitation.update({
          where: { id: invitation.id },
          data: {
            acceptedAt: new Date(),
            status: "ACCEPTED"
          }
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            currentWorkspaceId: invitation.workspaceId
          }
        });

        return created;
      });

      return membership;
    },
  );

  app.patch(
    "/workspaces/members/:membershipId/role",
    {
      preHandler: app.authorize(["OWNER"]),
      schema: {
        body: toJsonSchema("WorkspaceMemberRoleBody", roleSchema)
      }
    },
    async (request, reply) => {
      const body = roleSchema.parse(request.body);
      const { membershipId } = z.object({ membershipId: z.string() }).parse(request.params);
      const membership = await app.prisma.membership.findFirst({
        where: {
          id: membershipId,
          workspaceId: request.auth!.workspaceId
        }
      });

      if (!membership || membership.role === "OWNER") {
        reply.status(404).send({ message: "Editable membership not found." });
        return;
      }

      return app.prisma.membership.update({
        where: { id: membership.id },
        data: {
          role: body.role
        }
      });
    },
  );

  app.get(
    "/workspaces/dashboard",
    {
      preHandler: app.authorize()
    },
    async (request) => {
      const workspaceId = request.auth!.workspaceId;
      const now = new Date();
      const [overdueFollowups, todaysFollowups, recentInteractions, contacts, totalContacts, warmContacts, overdueCount, interactionsThisMonth] =
        await Promise.all([
          app.prisma.followup.findMany({
            where: {
              deletedAt: null,
              dueAt: { lt: now },
              status: "PENDING",
              workspaceId
            },
            include: { contact: true },
            orderBy: { dueAt: "asc" },
            take: 6
          }),
          app.prisma.followup.findMany({
            where: {
              deletedAt: null,
              dueAt: {
                gte: startOfDay(now),
                lte: endOfDay(now)
              },
              status: "PENDING",
              workspaceId
            },
            include: { contact: true },
            orderBy: { dueAt: "asc" },
            take: 6
          }),
          app.prisma.interaction.findMany({
            where: { workspaceId },
            include: { createdBy: true },
            orderBy: { happenedAt: "desc" },
            take: 8
          }),
          app.prisma.contact.findMany({
            where: {
              deletedAt: null,
              OR: [
                { lastInteractionAt: null },
                { lastInteractionAt: { lt: subDays(now, 45) } }
              ],
              workspaceId
            },
            include: contactListInclude,
            orderBy: { updatedAt: "desc" },
            take: 8
          }),
          app.prisma.contact.count({ where: { deletedAt: null, workspaceId } }),
          app.prisma.contact.count({ where: { deletedAt: null, warmthScore: { gte: 65 }, workspaceId } }),
          app.prisma.followup.count({
            where: {
              deletedAt: null,
              dueAt: { lt: now },
              status: "PENDING",
              workspaceId
            }
          }),
          app.prisma.interaction.count({
            where: {
              happenedAt: { gte: startOfMonth(now) },
              workspaceId
            }
          })
        ]);

      const staleContacts = contacts.map(serializeContactListItem);
      const suggestedActions = [
        ...overdueFollowups.slice(0, 2).map((followup) => ({
          contactId: followup.contactId,
          description: followup.prompt,
          id: `overdue-${followup.id}`,
          priority: "HIGH" as const,
          title: `Resolve overdue follow-up with ${followup.contact.firstName}`
        })),
        ...staleContacts.slice(0, 3).map((contact) => ({
          contactId: contact.id,
          description: "This relationship has not had a logged touchpoint recently.",
          id: `stale-${contact.id}`,
          priority: "MEDIUM" as const,
          title: `Rewarm ${contact.firstName} ${contact.lastName}`
        }))
      ];

      return {
        metrics: {
          interactionsThisMonth,
          overdueCount,
          totalContacts,
          warmContacts
        },
        overdueFollowups: overdueFollowups.map(serializeFollowup),
        recentInteractions: recentInteractions.map(serializeInteraction),
        staleContacts,
        suggestedActions,
        todaysFollowups: todaysFollowups.map(serializeFollowup)
      };
    },
  );
}
