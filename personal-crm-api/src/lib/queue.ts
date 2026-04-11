import type { AgentJobType, Prisma } from "@prisma/client";
import { Queue } from "bullmq";
import fp from "fastify-plugin";

const QUEUE_NAME = "crm-intelligence";

export const queuePlugin = fp(async (app) => {
  const queue = new Queue(QUEUE_NAME, {
    connection: app.redis
  });

  app.decorate(
    "queueAgentJob",
    async (input: {
      contactId?: string;
      enqueuedById?: string;
      payload: Record<string, unknown>;
      type: AgentJobType;
      workspaceId: string;
    }) => {
      const agentJob = await app.prisma.agentJob.create({
        data: {
          contactId: input.contactId,
          enqueuedById: input.enqueuedById,
          payload: input.payload as Prisma.InputJsonValue,
          queueName: QUEUE_NAME,
          type: input.type,
          workspaceId: input.workspaceId
        }
      });

      const externalJob = await queue.add(
        input.type,
        {
          ...input.payload,
          agentJobId: agentJob.id
        },
        {
          attempts: 3,
          backoff: {
            delay: 2000,
            type: "exponential"
          },
          removeOnComplete: 100,
          removeOnFail: 100
        },
      );

      await app.prisma.agentJob.update({
        where: { id: agentJob.id },
        data: {
          externalJobId: externalJob.id?.toString() ?? null
        }
      });

      return {
        externalJobId: externalJob.id?.toString() ?? "",
        jobId: agentJob.id
      };
    },
  );

  app.addHook("onClose", async () => {
    await queue.close();
  });
});
