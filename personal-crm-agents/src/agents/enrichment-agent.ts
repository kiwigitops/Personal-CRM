import { z } from "zod";

import type { AgentHandler } from "../context";
import { classifyContactSegment } from "../skills/classify_contact_segment";

const payloadSchema = z.object({
  contactId: z.string().optional()
});

export const enrichmentAgent: AgentHandler = async (context, input) => {
  const payload = payloadSchema.parse(input.payload);
  const contacts = await context.prisma.contact.findMany({
    where: {
      deletedAt: null,
      id: payload.contactId,
      workspaceId: input.workspaceId
    },
    include: {
      tags: {
        include: {
          tag: true
        }
      }
    },
    take: payload.contactId ? 1 : 250
  });

  const segments = contacts.map((contact) => ({
    contactId: contact.id,
    segment: classifyContactSegment({
      relationshipStrength: contact.relationshipStrength,
      tags: contact.tags.map((entry) => entry.tag.name),
      warmthScore: contact.warmthScore
    })
  }));

  return { segments };
};

