import { z } from "zod";

import type { AgentHandler } from "../context";
import { extractContactFacts } from "../skills/extract_contact_facts";
import { scoreContactWarmth } from "../skills/score_contact_warmth";
import { summarizeRelationshipHistory } from "../skills/summarize_relationship_history";

const payloadSchema = z.object({
  contactId: z.string()
});

export const memoryAgent: AgentHandler = async (context, input) => {
  const payload = payloadSchema.parse(input.payload);
  const contact = await context.prisma.contact.findFirstOrThrow({
    where: {
      deletedAt: null,
      id: payload.contactId,
      workspaceId: input.workspaceId
    },
    include: {
      followups: true,
      interactions: {
        orderBy: {
          happenedAt: "desc"
        }
      }
    }
  });

  const overdueFollowups = contact.followups.filter(
    (followup) => followup.status === "PENDING" && followup.dueAt < new Date(),
  ).length;
  const warmth = scoreContactWarmth({
    lastInteractionAt: contact.lastInteractionAt,
    overdueFollowups,
    relationshipStrength: contact.relationshipStrength
  });
  const facts = contact.interactions.flatMap((interaction) =>
    extractContactFacts(`${interaction.title}. ${interaction.notes ?? ""}`),
  );
  const summary = summarizeRelationshipHistory({
    facts,
    firstName: contact.firstName,
    interactions: contact.interactions,
    lastInteractionAt: contact.lastInteractionAt,
    overdueFollowups,
    warmthScore: warmth.score
  });

  await context.prisma.memoryEntry.deleteMany({
    where: {
      contactId: contact.id,
      kind: "extracted_fact",
      workspaceId: input.workspaceId
    }
  });

  if (facts.length > 0) {
    await context.prisma.memoryEntry.createMany({
      data: facts.map((fact) => ({
        confidence: fact.confidence,
        contactId: contact.id,
        content: fact.value,
        factKey: fact.factKey,
        kind: "extracted_fact",
        workspaceId: input.workspaceId
      }))
    });
  }

  await context.prisma.contact.update({
    where: { id: contact.id },
    data: {
      staleDaysCache: warmth.staleDays,
      warmthScore: warmth.score
    }
  });

  await context.memoryProvider.writeSummary({
    contactId: contact.id,
    keyFacts: summary.keyFacts,
    nextBestAction: summary.nextBestAction,
    summary: summary.brief,
    warmthScore: warmth.score,
    workspaceId: input.workspaceId
  });

  return {
    keyFactCount: facts.length,
    nextBestAction: summary.nextBestAction,
    warmthScore: warmth.score
  };
};

