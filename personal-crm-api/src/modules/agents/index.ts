import type { FastifyInstance } from "fastify";
import { z } from "zod";

export async function agentsModule(app: FastifyInstance) {
  app.post(
    "/agents/seed-demo",
    {
      preHandler: app.authorize(["OWNER", "ADMIN"])
    },
    async (request) => {
      return app.queueAgentJob({
        enqueuedById: request.auth!.userId,
        payload: {
          deterministic: true,
          requestedBy: request.auth!.userId
        },
        type: "SEED_DATA",
        workspaceId: request.auth!.workspaceId
      });
    },
  );

  app.get(
    "/agents/jobs/:jobId",
    {
      preHandler: app.authorize()
    },
    async (request, reply) => {
      const { jobId } = z.object({ jobId: z.string() }).parse(request.params);
      const job = await app.prisma.agentJob.findFirst({
        where: {
          id: jobId,
          workspaceId: request.auth!.workspaceId
        }
      });

      if (!job) {
        reply.status(404).send({ message: "Agent job not found." });
        return;
      }

      return job;
    },
  );

  app.get(
    "/agents/jobs",
    {
      preHandler: app.authorize()
    },
    async (request) => {
      return app.prisma.agentJob.findMany({
        where: {
          workspaceId: request.auth!.workspaceId
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 50
      });
    },
  );
}

