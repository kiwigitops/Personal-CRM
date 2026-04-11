import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { recordAuditEvent } from "../../lib/audit";
import { serializeFollowup } from "../../lib/serializers";
import { toJsonSchema } from "../../lib/schemas";

const followupBodySchema = z.object({
  channel: z.enum(["EMAIL", "TEXT", "CALL", "MEETING", "NOTE"]).default("EMAIL"),
  contactId: z.string(),
  dueAt: z.coerce.date(),
  prompt: z.string().min(1).max(500),
  suggestedMessage: z.string().max(1000).nullable().optional()
});

const followupsQuerySchema = z.object({
  status: z.enum(["PENDING", "DONE", "SNOOZED", "CANCELED"]).optional()
});

const snoozeSchema = z.object({
  dueAt: z.coerce.date()
});

export async function followupsModule(app: FastifyInstance) {
  app.get(
    "/followups",
    {
      preHandler: app.authorize()
    },
    async (request) => {
      const query = followupsQuerySchema.parse(request.query);
      const followups = await app.prisma.followup.findMany({
        where: {
          deletedAt: null,
          status: query.status,
          workspaceId: request.auth!.workspaceId
        },
        include: {
          contact: true
        },
        orderBy: {
          dueAt: "asc"
        },
        take: 100
      });

      return followups.map(serializeFollowup);
    },
  );

  app.post(
    "/followups",
    {
      preHandler: app.authorize(),
      schema: {
        body: toJsonSchema("FollowupCreateBody", followupBodySchema)
      }
    },
    async (request, reply) => {
      const body = followupBodySchema.parse(request.body);
      const contact = await app.prisma.contact.findFirst({
        where: {
          deletedAt: null,
          id: body.contactId,
          workspaceId: request.auth!.workspaceId
        }
      });

      if (!contact) {
        reply.status(404).send({ message: "Contact not found." });
        return;
      }

      const followup = await app.prisma.followup.create({
        data: {
          channel: body.channel,
          contactId: contact.id,
          createdById: request.auth!.userId,
          dueAt: body.dueAt,
          prompt: body.prompt,
          suggestedMessage: body.suggestedMessage,
          workspaceId: request.auth!.workspaceId
        },
        include: {
          contact: true
        }
      });

      await app.prisma.reminder.create({
        data: {
          channel: "IN_APP",
          contactId: contact.id,
          followupId: followup.id,
          payload: {
            prompt: body.prompt
          },
          scheduledFor: body.dueAt,
          workspaceId: request.auth!.workspaceId
        }
      });

      await app.prisma.contact.update({
        where: { id: contact.id },
        data: {
          nextFollowupAt: body.dueAt
        }
      });

      await app.queueAgentJob({
        contactId: contact.id,
        enqueuedById: request.auth!.userId,
        payload: { contactId: contact.id, followupId: followup.id },
        type: "FOLLOWUP",
        workspaceId: request.auth!.workspaceId
      });

      await recordAuditEvent(app, {
        action: "followup.created",
        actorType: "USER",
        actorUserId: request.auth!.userId,
        entityId: followup.id,
        entityType: "followup",
        metadata: { contactId: contact.id },
        workspaceId: request.auth!.workspaceId
      });

      return serializeFollowup(followup);
    },
  );

  app.post(
    "/followups/:followupId/complete",
    {
      preHandler: app.authorize()
    },
    async (request, reply) => {
      const { followupId } = z.object({ followupId: z.string() }).parse(request.params);
      const followup = await app.prisma.followup.findFirst({
        where: {
          deletedAt: null,
          id: followupId,
          workspaceId: request.auth!.workspaceId
        },
        include: {
          contact: true
        }
      });

      if (!followup) {
        reply.status(404).send({ message: "Follow-up not found." });
        return;
      }

      const updated = await app.prisma.followup.update({
        where: { id: followup.id },
        data: {
          completedAt: new Date(),
          status: "DONE"
        },
        include: {
          contact: true
        }
      });

      await app.prisma.reminder.updateMany({
        where: {
          followupId: updated.id,
          workspaceId: request.auth!.workspaceId
        },
        data: {
          readAt: new Date()
        }
      });

      return serializeFollowup(updated);
    },
  );

  app.post(
    "/followups/:followupId/snooze",
    {
      preHandler: app.authorize(),
      schema: {
        body: toJsonSchema("FollowupSnoozeBody", snoozeSchema)
      }
    },
    async (request, reply) => {
      const body = snoozeSchema.parse(request.body);
      const { followupId } = z.object({ followupId: z.string() }).parse(request.params);
      const followup = await app.prisma.followup.findFirst({
        where: {
          deletedAt: null,
          id: followupId,
          workspaceId: request.auth!.workspaceId
        }
      });

      if (!followup) {
        reply.status(404).send({ message: "Follow-up not found." });
        return;
      }

      const updated = await app.prisma.followup.update({
        where: { id: followup.id },
        data: {
          dueAt: body.dueAt,
          status: "SNOOZED"
        },
        include: {
          contact: true
        }
      });

      await app.prisma.reminder.updateMany({
        where: {
          followupId: updated.id,
          workspaceId: request.auth!.workspaceId
        },
        data: {
          scheduledFor: body.dueAt
        }
      });

      return serializeFollowup(updated);
    },
  );
}
