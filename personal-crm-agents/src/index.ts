import Fastify from "fastify";
import Redis from "ioredis";
import pino from "pino";
import { Registry, collectDefaultMetrics } from "prom-client";
import { z } from "zod";

import { PrismaClient } from "../generated/prisma";
import { createMemoryProvider } from "./providers";
import { createCrmWorker } from "./queue/worker";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  MEMORY_PROVIDER: z.string().default("native"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4100),
  REDIS_URL: z.string().min(1)
});

async function main() {
  const env = envSchema.parse(process.env);
  const logger = pino({ level: env.NODE_ENV === "development" ? "debug" : "info" });
  const prisma = new PrismaClient();
  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const memoryProvider = createMemoryProvider(prisma);
  const metrics = new Registry();
  collectDefaultMetrics({ register: metrics });

  await prisma.$connect();
  const worker = createCrmWorker({ logger, memoryProvider, prisma, redis });
  const app = Fastify({ loggerInstance: logger });

  app.get("/health/live", async () => ({
    memoryProvider: memoryProvider.name,
    ok: true,
    status: "live"
  }));
  app.get("/health/ready", async () => {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    return {
      ok: true,
      status: "ready"
    };
  });
  app.get("/metrics", async (_request, reply) => {
    reply.header("Content-Type", metrics.contentType);
    return metrics.metrics();
  });

  const shutdown = async () => {
    logger.info("Shutting down agents service");
    await worker.close();
    await redis.quit();
    await prisma.$disconnect();
    await app.close();
  };

  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());

  await app.listen({ host: "0.0.0.0", port: env.PORT });
  logger.info({ memoryProvider: memoryProvider.name }, "agents service started");
}

void main();
