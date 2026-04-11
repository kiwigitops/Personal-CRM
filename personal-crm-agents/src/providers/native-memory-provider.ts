import type { Prisma, PrismaClient } from "../../generated/prisma";

import type { MemoryProvider, MemoryWriteInput } from "./memory-provider";

export class NativeMemoryProvider implements MemoryProvider {
  name = "native";

  constructor(private readonly prisma: PrismaClient) {}

  async writeSummary(input: MemoryWriteInput) {
    await this.prisma.memorySummary.upsert({
      where: {
        contactId: input.contactId
      },
      update: {
        brief: input.summary,
        keyFacts: input.keyFacts as Prisma.InputJsonValue,
        nextBestAction: input.nextBestAction,
        warmthScore: input.warmthScore
      },
      create: {
        brief: input.summary,
        contactId: input.contactId,
        keyFacts: input.keyFacts as Prisma.InputJsonValue,
        nextBestAction: input.nextBestAction,
        staleDays: 0,
        warmthScore: input.warmthScore,
        workspaceId: input.workspaceId
      }
    });
  }
}
