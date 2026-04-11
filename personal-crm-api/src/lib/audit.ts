import type { AuditActorType, Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";

export async function recordAuditEvent(
  app: FastifyInstance,
  input: {
    action: string;
    actorType: AuditActorType;
    actorUserId?: string;
    entityId: string;
    entityType: string;
    metadata?: Record<string, unknown>;
    workspaceId: string;
  },
) {
  await app.prisma.auditEvent.create({
    data: {
      action: input.action,
      actorType: input.actorType,
      actorUserId: input.actorUserId,
      entityId: input.entityId,
      entityType: input.entityType,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      workspaceId: input.workspaceId
    }
  });
}
