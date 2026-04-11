import { Worker } from "bullmq";
import type { Redis } from "ioredis";
import type pino from "pino";
import { z } from "zod";

import type { AgentJobType, Prisma, PrismaClient } from "../../generated/prisma";
import { agentRegistry } from "../agents";
import type { AgentContext } from "../context";
import type { MemoryProvider } from "../providers/memory-provider";

const queuePayloadSchema = z.object({
  agentJobId: z.string()
});

export function createCrmWorker(input: {
  logger: pino.Logger;
  memoryProvider: MemoryProvider;
  prisma: PrismaClient;
  redis: Redis;
}) {
  const context: AgentContext = {
    logger: input.logger,
    memoryProvider: input.memoryProvider,
    prisma: input.prisma
  };

  return new Worker(
    "crm-intelligence",
    async (job) => {
      const parsed = queuePayloadSchema.parse(job.data);
      const agentJob = await input.prisma.agentJob.findUniqueOrThrow({
        where: { id: parsed.agentJobId }
      });
      const handler = agentRegistry[agentJob.type as AgentJobType];

      await input.prisma.agentJob.update({
        where: { id: agentJob.id },
        data: {
          attempts: job.attemptsMade + 1,
          startedAt: new Date(),
          status: "RUNNING"
        }
      });

      try {
        const result = await handler(context, {
          agentJobId: agentJob.id,
          contactId: agentJob.contactId,
          payload: job.data as Record<string, unknown>,
          workspaceId: agentJob.workspaceId
        });

        await input.prisma.agentJob.update({
          where: { id: agentJob.id },
          data: {
            completedAt: new Date(),
            result: result as Prisma.InputJsonValue,
            status: "COMPLETED"
          }
        });

        input.logger.info({ agentJobId: agentJob.id, type: agentJob.type }, "agent job completed");
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown agent error";
        const nextStatus = job.opts.attempts && job.attemptsMade + 1 < job.opts.attempts ? "RETRYING" : "FAILED";

        await input.prisma.agentJob.update({
          where: { id: agentJob.id },
          data: {
            lastError: message,
            status: nextStatus
          }
        });

        input.logger.error({ agentJobId: agentJob.id, error }, "agent job failed");
        throw error;
      }
    },
    {
      concurrency: 4,
      connection: input.redis
    },
  );
}
