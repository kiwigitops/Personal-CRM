import type { FastifyInstance } from "fastify";

import { metricsRegistry } from "../../lib/metrics";

export async function healthModule(app: FastifyInstance) {
  app.get("/health/live", async () => ({ ok: true, status: "live" }));

  app.get("/health/ready", async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    await app.redis.ping();

    return { ok: true, status: "ready" };
  });

  app.get("/health/metrics", async (_request, reply) => {
    reply.header("Content-Type", metricsRegistry.contentType);
    return metricsRegistry.metrics();
  });
}

