import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { ZodError } from "zod";

import { getConfig } from "./config";
import { authPlugin } from "./lib/auth";
import { httpRequestCounter } from "./lib/metrics";
import { prismaPlugin } from "./lib/prisma";
import { queuePlugin } from "./lib/queue";
import { redisPlugin } from "./lib/redis";
import { agentsModule } from "./modules/agents";
import { auditModule } from "./modules/audit";
import { authModule } from "./modules/auth";
import { companiesModule } from "./modules/companies";
import { contactsModule } from "./modules/contacts";
import { filesModule } from "./modules/files";
import { followupsModule } from "./modules/followups";
import { healthModule } from "./modules/health";
import { interactionsModule } from "./modules/interactions";
import { memoryModule } from "./modules/memory";
import { notificationsModule } from "./modules/notifications";
import { searchModule } from "./modules/search";
import { tagsModule } from "./modules/tags";
import { usersModule } from "./modules/users";
import { workspacesModule } from "./modules/workspaces";

export async function createApp() {
  const config = getConfig();
  const app = Fastify({
    logger: config.nodeEnv === "development" ? { transport: { target: "pino-pretty" } } : true
  });

  app.decorate("config", config);

  await app.register(cors, {
    credentials: true,
    origin: true
  });
  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: "1 minute"
  });
  await app.register(swagger, {
    openapi: {
      info: {
        description: "Personal CRM REST API",
        title: "Personal CRM API",
        version: "1.0.0"
      }
    }
  });
  await app.register(swaggerUi, {
    routePrefix: "/docs"
  });
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(authPlugin);
  await app.register(queuePlugin);

  app.addHook("onResponse", async (request, reply) => {
    httpRequestCounter.inc({
      method: request.method,
      route: request.routeOptions.url ?? "unknown",
      statusCode: reply.statusCode.toString()
    });
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({
        issues: error.issues,
        message: "Validation failed"
      });
      return;
    }

    app.log.error(error);
    reply.status(500).send({
      message: "Unexpected server error"
    });
  });

  await app.register(
    async (v1) => {
      await v1.register(healthModule);
      await v1.register(authModule);
      await v1.register(usersModule);
      await v1.register(workspacesModule);
      await v1.register(contactsModule);
      await v1.register(companiesModule);
      await v1.register(interactionsModule);
      await v1.register(followupsModule);
      await v1.register(tagsModule);
      await v1.register(searchModule);
      await v1.register(memoryModule);
      await v1.register(agentsModule);
      await v1.register(filesModule);
      await v1.register(notificationsModule);
      await v1.register(auditModule);
    },
    { prefix: "/v1" },
  );

  return app;
}

