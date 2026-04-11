import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { serializeMemorySummary } from "../../lib/serializers";

export async function memoryModule(app: FastifyInstance) {
  app.get(
    "/memory/contacts/:contactId/summary",
    {
      preHandler: app.authorize()
    },
    async (request, reply) => {
      const { contactId } = z.object({ contactId: z.string() }).parse(request.params);
      const summary = await app.prisma.memorySummary.findFirst({
        where: {
          contactId,
          workspaceId: request.auth!.workspaceId
        }
      });

      if (!summary) {
        reply.status(404).send({ message: "Memory summary not found." });
        return;
      }

      return serializeMemorySummary(summary);
    },
  );

  app.post(
    "/memory/contacts/:contactId/rebuild",
    {
      preHandler: app.authorize()
    },
    async (request, reply) => {
      const { contactId } = z.object({ contactId: z.string() }).parse(request.params);
      const contact = await app.prisma.contact.findFirst({
        where: {
          deletedAt: null,
          id: contactId,
          workspaceId: request.auth!.workspaceId
        }
      });

      if (!contact) {
        reply.status(404).send({ message: "Contact not found." });
        return;
      }

      const job = await app.queueAgentJob({
        contactId: contact.id,
        enqueuedById: request.auth!.userId,
        payload: { contactId: contact.id, reason: "manual.rebuild" },
        type: "MEMORY",
        workspaceId: request.auth!.workspaceId
      });

      return job;
    },
  );
}

