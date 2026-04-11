import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { recordAuditEvent } from "../../lib/audit";
import { serializeTag } from "../../lib/serializers";
import { toJsonSchema } from "../../lib/schemas";

const tagBodySchema = z.object({
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/),
  name: z.string().min(1).max(60)
});

export async function tagsModule(app: FastifyInstance) {
  app.get(
    "/tags",
    {
      preHandler: app.authorize()
    },
    async (request) => {
      const tags = await app.prisma.tag.findMany({
        where: {
          deletedAt: null,
          workspaceId: request.auth!.workspaceId
        },
        include: {
          _count: {
            select: {
              contacts: true
            }
          }
        },
        orderBy: {
          name: "asc"
        }
      });

      return tags.map(serializeTag);
    },
  );

  app.post(
    "/tags",
    {
      preHandler: app.authorize(),
      schema: {
        body: toJsonSchema("TagCreateBody", tagBodySchema)
      }
    },
    async (request) => {
      const body = tagBodySchema.parse(request.body);
      const tag = await app.prisma.tag.create({
        data: {
          color: body.color,
          name: body.name,
          workspaceId: request.auth!.workspaceId
        },
        include: {
          _count: {
            select: { contacts: true }
          }
        }
      });

      await recordAuditEvent(app, {
        action: "tag.created",
        actorType: "USER",
        actorUserId: request.auth!.userId,
        entityId: tag.id,
        entityType: "tag",
        workspaceId: request.auth!.workspaceId
      });

      return serializeTag(tag);
    },
  );
}
