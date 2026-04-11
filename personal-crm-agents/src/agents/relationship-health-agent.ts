import { z } from "zod";

import type { AgentHandler } from "../context";
import { scoreContactWarmth } from "../skills/score_contact_warmth";
import { suggestNextBestAction } from "../skills/suggest_next_best_action";

const payloadSchema = z.object({
  contactId: z.string().optional()
});

export const relationshipHealthAgent: AgentHandler = async (context, input) => {
  const payload = payloadSchema.parse(input.payload);
  const contacts = await context.prisma.contact.findMany({
    where: {
      deletedAt: null,
      id: payload.contactId,
      workspaceId: input.workspaceId
    },
    include: {
      followups: true
    },
    take: payload.contactId ? 1 : 500
  });

  let updated = 0;

  for (const contact of contacts) {
    const overdueFollowups = contact.followups.filter(
      (followup) => followup.status === "PENDING" && followup.dueAt < new Date(),
    ).length;
    const warmth = scoreContactWarmth({
      lastInteractionAt: contact.lastInteractionAt,
      overdueFollowups,
      relationshipStrength: contact.relationshipStrength
    });
    const action = suggestNextBestAction({
      lastInteractionAt: contact.lastInteractionAt,
      overdueFollowups,
      warmthScore: warmth.score
    });

    await context.prisma.contact.update({
      where: { id: contact.id },
      data: {
        staleDaysCache: warmth.staleDays,
        warmthScore: warmth.score
      }
    });

    await context.prisma.memorySummary.updateMany({
      where: {
        contactId: contact.id,
        workspaceId: input.workspaceId
      },
      data: {
        nextBestAction: action,
        staleDays: warmth.staleDays,
        warmthScore: warmth.score
      }
    });

    updated += 1;
  }

  return { updated };
};

