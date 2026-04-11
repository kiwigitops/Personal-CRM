import { addDays } from "date-fns";

import type { AgentHandler } from "../context";
import { extractContactFacts } from "../skills/extract_contact_facts";
import { scoreContactWarmth } from "../skills/score_contact_warmth";
import { seedRealisticDemoData } from "../skills/seed_realistic_demo_data";
import { summarizeRelationshipHistory } from "../skills/summarize_relationship_history";

const tagColors: Record<string, string> = {
  Alumni: "#8b5cf6",
  Founder: "#0ea5e9",
  "Inner Circle": "#22c55e",
  Investor: "#f97316",
  Reactivation: "#ef4444",
  "Warm Intro": "#14b8a6"
};

export const seedDataAgent: AgentHandler = async (context, input) => {
  const owner = await context.prisma.membership.findFirstOrThrow({
    where: {
      workspaceId: input.workspaceId
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  const seed = seedRealisticDemoData();
  let contactsCreated = 0;

  for (const item of seed.contacts) {
    const company = await context.prisma.company.upsert({
      where: {
        workspaceId_name: {
          name: item.company,
          workspaceId: input.workspaceId
        }
      },
      update: {},
      create: {
        name: item.company,
        workspaceId: input.workspaceId
      }
    });
    const existing = await context.prisma.contact.findFirst({
      where: {
        email: item.email,
        workspaceId: input.workspaceId
      }
    });
    const lastInteractionAt = item.interactions[0]?.happenedAt ?? null;
    const warmth = scoreContactWarmth({
      lastInteractionAt,
      overdueFollowups: 0,
      relationshipStrength: item.relationshipStrength
    });
    const contact = existing
      ? await context.prisma.contact.update({
          where: { id: existing.id },
          data: {
            city: item.city,
            deletedAt: null,
            firstName: item.firstName,
            lastInteractionAt,
            lastName: item.lastName,
            relationshipStrength: item.relationshipStrength,
            staleDaysCache: warmth.staleDays,
            title: item.title,
            warmthScore: warmth.score
          }
        })
      : await context.prisma.contact.create({
          data: {
            city: item.city,
            email: item.email,
            firstName: item.firstName,
            lastInteractionAt,
            lastName: item.lastName,
            relationshipStrength: item.relationshipStrength,
            source: "seed-data-agent",
            staleDaysCache: warmth.staleDays,
            title: item.title,
            warmthScore: warmth.score,
            workspaceId: input.workspaceId
          }
        });

    contactsCreated += existing ? 0 : 1;

    await context.prisma.contactCompanyLink.upsert({
      where: {
        contactId_companyId: {
          companyId: company.id,
          contactId: contact.id
        }
      },
      update: {
        isPrimary: true,
        title: item.title
      },
      create: {
        companyId: company.id,
        contactId: contact.id,
        isPrimary: true,
        title: item.title,
        workspaceId: input.workspaceId
      }
    });

    await context.prisma.contactTag.deleteMany({
      where: {
        contactId: contact.id,
        workspaceId: input.workspaceId
      }
    });
    for (const tagName of item.tags) {
      const tag = await context.prisma.tag.upsert({
        where: {
          workspaceId_name: {
            name: tagName,
            workspaceId: input.workspaceId
          }
        },
        update: {
          color: tagColors[tagName] ?? "#0ea5e9"
        },
        create: {
          color: tagColors[tagName] ?? "#0ea5e9",
          name: tagName,
          workspaceId: input.workspaceId
        }
      });

      await context.prisma.contactTag.create({
        data: {
          contactId: contact.id,
          tagId: tag.id,
          workspaceId: input.workspaceId
        }
      });
    }

    await context.prisma.interaction.deleteMany({
      where: {
        contactId: contact.id,
        workspaceId: input.workspaceId
      }
    });
    await context.prisma.followup.deleteMany({
      where: {
        contactId: contact.id,
        workspaceId: input.workspaceId
      }
    });
    await context.prisma.reminder.deleteMany({
      where: {
        contactId: contact.id,
        workspaceId: input.workspaceId
      }
    });

    const interactions = [];
    for (const interactionSeed of item.interactions) {
      const interaction = await context.prisma.interaction.create({
        data: {
          contactId: contact.id,
          createdById: owner.userId,
          happenedAt: interactionSeed.happenedAt,
          notes: interactionSeed.notes,
          title: interactionSeed.title,
          type: interactionSeed.type,
          workspaceId: input.workspaceId
        }
      });
      interactions.push(interaction);
    }

    const facts = interactions.flatMap((interaction) =>
      extractContactFacts(`${interaction.title}. ${interaction.notes ?? ""}`),
    );
    const summary = summarizeRelationshipHistory({
      facts,
      firstName: contact.firstName,
      interactions,
      lastInteractionAt,
      overdueFollowups: 0,
      warmthScore: warmth.score
    });

    await context.memoryProvider.writeSummary({
      contactId: contact.id,
      keyFacts: summary.keyFacts,
      nextBestAction: summary.nextBestAction,
      summary: summary.brief,
      warmthScore: warmth.score,
      workspaceId: input.workspaceId
    });

    const followup = await context.prisma.followup.create({
      data: {
        channel: "EMAIL",
        contactId: contact.id,
        createdById: owner.userId,
        dueAt: addDays(new Date(), warmth.score > 70 ? 10 : 3),
        prompt: `Check in with ${contact.firstName} about ${item.company}`,
        suggestedMessage: `Hi ${contact.firstName}, I was thinking about our last conversation and wanted to see how things are moving at ${item.company}.`,
        workspaceId: input.workspaceId
      }
    });

    await context.prisma.reminder.create({
      data: {
        channel: "IN_APP",
        contactId: contact.id,
        followupId: followup.id,
        payload: { source: "seed-data-agent" },
        scheduledFor: followup.dueAt,
        workspaceId: input.workspaceId
      }
    });
  }

  return {
    contactsCreated,
    contactsSeeded: seed.contacts.length
  };
};
