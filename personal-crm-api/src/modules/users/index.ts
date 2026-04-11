import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { toJsonSchema } from "../../lib/schemas";

const updateProfileSchema = z.object({
  avatarUrl: z.string().url().nullable().optional(),
  fullName: z.string().min(2).max(100)
});

export async function usersModule(app: FastifyInstance) {
  app.get(
    "/users/me",
    {
      preHandler: app.authorize()
    },
    async (request) => {
      const user = await app.prisma.user.findUniqueOrThrow({
        where: { id: request.auth!.userId },
        include: {
          memberships: {
            where: { deletedAt: null },
            include: { workspace: true }
          }
        }
      });

      return {
        user: {
          avatarUrl: user.avatarUrl,
          currentWorkspaceId: user.currentWorkspaceId,
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
    },
  );

  app.patch(
    "/users/me",
    {
      preHandler: app.authorize(),
      schema: {
        body: toJsonSchema("UsersUpdateProfileBody", updateProfileSchema)
      }
    },
    async (request) => {
      const body = updateProfileSchema.parse(request.body);
      const user = await app.prisma.user.update({
        where: { id: request.auth!.userId },
        data: body
      });

      return {
        user: {
          avatarUrl: user.avatarUrl,
          email: user.email,
          fullName: user.fullName,
          id: user.id
        }
      };
    },
  );
}

