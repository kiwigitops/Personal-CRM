import { z } from "zod";

import type { AgentHandler } from "../context";
import { generateFollowupSuggestions } from "../skills/generate_followup_suggestions";

const payloadSchema = z.object({
  contactId: z.string()
});

export const followupAgent: AgentHandler = async (context, input) => {
  const payload = payloadSchema.parse(input.payload);
  const contact = await context.prisma.contact.findFirstOrThrow({
    where: {
      deletedAt: null,
      id: payload.contactId,
      workspaceId: input.workspaceId
    },
    include: {
      followups: {
        where: {
          status: "PENDING"
        }
      },
      interactions: {
        orderBy: {
          happenedAt: "desc"
        },
        take: 1
      }
    }
  });
  const suggestion = generateFollowupSuggestions({
    firstName: contact.firstName,
    lastInteractionTitle: contact.interactions[0]?.title,
    warmthScore: contact.warmthScore
  });

  if (contact.followups.length === 0) {
    const creator = await context.prisma.membership.findFirstOrThrow({
      where: {
        workspaceId: input.workspaceId
      },
      orderBy: {
        createdAt: "asc"
      }
    });
    const followup = await context.prisma.followup.create({
      data: {
        channel: "EMAIL",
        contactId: contact.id,
        createdById: creator.userId,
        dueAt: suggestion.suggestedDate,
        prompt: suggestion.prompt,
        suggestedMessage: suggestion.suggestedMessage,
        workspaceId: input.workspaceId
      }
    });

    await context.prisma.reminder.create({
      data: {
        channel: "IN_APP",
        contactId: contact.id,
        followupId: followup.id,
        payload: { angle: suggestion.angle },
        scheduledFor: suggestion.suggestedDate,
        workspaceId: input.workspaceId
      }
    });
  }

  return {
    angle: suggestion.angle,
    suggestedDate: suggestion.suggestedDate.toISOString(),
    suggestedMessage: suggestion.suggestedMessage
  };
};

