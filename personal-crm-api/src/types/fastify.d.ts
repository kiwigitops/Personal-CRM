import type { AgentJobType, MembershipRole, PrismaClient } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { Redis } from "ioredis";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (
      roles?: MembershipRole[],
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    config: {
      accessTokenTtlMinutes: number;
      appUrl: string;
      databaseUrl: string;
      internalApiKey: string;
      jwtAccessSecret: string;
      jwtRefreshSecret: string;
      mailFrom: string;
      mailHost: string;
      mailPort: number;
      nodeEnv: "development" | "test" | "production";
      port: number;
      redisUrl: string;
      refreshTokenTtlDays: number;
      resetTokenTtlMinutes: number;
    };
    prisma: PrismaClient;
    queueAgentJob: (input: {
      contactId?: string;
      enqueuedById?: string;
      payload: Record<string, unknown>;
      type: AgentJobType;
      workspaceId: string;
    }) => Promise<{ externalJobId: string; jobId: string }>;
    redis: Redis;
  }

  interface FastifyRequest {
    auth: {
      role: MembershipRole;
      userId: string;
      workspaceId: string;
    } | null;
  }
}

