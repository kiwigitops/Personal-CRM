import fp from "fastify-plugin";
import Redis from "ioredis";

export const redisPlugin = fp(async (app) => {
  const redis = new Redis(app.config.redisUrl, {
    maxRetriesPerRequest: null
  });

  app.decorate("redis", redis);

  app.addHook("onClose", async () => {
    await redis.quit();
  });
});

