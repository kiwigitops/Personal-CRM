import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { toJsonSchema } from "../../lib/schemas";

const fileBodySchema = z.object({
  contactId: z.string().optional(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().min(1),
  storageKey: z.string().min(1)
});

export async function filesModule(app: FastifyInstance) {
  app.post(
    "/files/attachments",
    {
      preHandler: app.authorize(),
      schema: {
        body: toJsonSchema("FilesCreateAttachmentBody", fileBodySchema)
      }
    },
    async (request) => {
      const body = fileBodySchema.parse(request.body);

      return app.prisma.attachment.create({
        data: {
          ...body,
          contactId: body.contactId ?? null,
          workspaceId: request.auth!.workspaceId
        }
      });
    },
  );
}

