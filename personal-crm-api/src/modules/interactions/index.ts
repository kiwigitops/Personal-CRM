import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { recordAuditEvent } from "../../lib/audit";
import { serializeInteraction } from "../../lib/serializers";
import { toJsonSchema } from "../../lib/schemas";

const interactionBodySchema = z.object({
  contactId: z.string(),
  happenedAt: z.coerce.date().default(() => new Date()),
  notes: z.string().max(5000).nullable().optional(),
  outcome: z.string().max(500).nullable().optional(),
  title: z.string().min(1).max(200),
  type: z.enum(["CALL", "TEXT", "EMAIL", "MEETING", "NOTE", "TASK"])
});

export async function interactionsModule(app: FastifyInstance) {
  app.post(
    "/interactions",
    {
      preHandler: app.authorize(),
      schema: {
        body: toJsonSchema("InteractionCreateBody", interactionBodySchema)
      }
    },
    async (request, reply) => {
      const body = interactionBodySchema.parse(request.body);
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

      const interaction = await app.prisma.interaction.create({
        data: {
          contactId: contact.id,
          createdById: request.auth!.userId,
          happenedAt: body.happenedAt,
          notes: body.notes,
          outcome: body.outcome,
          title: body.title,
          type: body.type,
          workspaceId: request.auth!.workspaceId
        },
        include: {
          createdBy: true
        }
      });

      await app.prisma.contact.update({
        where: { id: contact.id },
        data: {
          lastInteractionAt:
            !contact.lastInteractionAt || body.happenedAt > contact.lastInteractionAt
              ? body.happenedAt
              : contact.lastInteractionAt
        }
      });

      await app.prisma.memoryEntry.create({
        data: {
          confidence: body.type === "NOTE" ? 0.7 : 0.8,
          contactId: contact.id,
          content: `${body.title}${body.notes ? `: ${body.notes}` : ""}`,
          factKey: "interaction",
          kind: "interaction_note",
          sourceInteractionId: interaction.id,
          workspaceId: request.auth!.workspaceId
        }
      });

      await app.queueAgentJob({
        contactId: contact.id,
        enqueuedById: request.auth!.userId,
        payload: { contactId: contact.id, interactionId: interaction.id },
        type: "TIMELINE_SUMMARY",
        workspaceId: request.auth!.workspaceId
      });

      await recordAuditEvent(app, {
        action: "interaction.created",
        actorType: "USER",
        actorUserId: request.auth!.userId,
        entityId: interaction.id,
        entityType: "interaction",
        metadata: { contactId: contact.id, type: body.type },
        workspaceId: request.auth!.workspaceId
      });

      return serializeInteraction(interaction);
    },
  );
}

