import type { FastifyInstance } from "fastify";

export async function auditModule(app: FastifyInstance) {
  app.get(
    "/audit/events",
    {
      preHandler: app.authorize(["OWNER", "ADMIN"])
    },
    async (request) => {
      return app.prisma.auditEvent.findMany({
        where: {
          workspaceId: request.auth!.workspaceId
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 100
      });
    },
  );
}

