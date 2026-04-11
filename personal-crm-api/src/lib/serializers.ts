import type {
  Company,
  Contact,
  Followup,
  Interaction,
  MemorySummary,
  Prisma,
  Tag,
  User
} from "@prisma/client";

import { calculateStaleDays } from "./relationship";

export const contactListInclude = {
  companies: {
    include: {
      company: true
    },
    orderBy: {
      isPrimary: "desc"
    },
    take: 1
  },
  followups: {
    orderBy: {
      dueAt: "asc"
    },
    take: 1,
    where: {
      deletedAt: null,
      status: "PENDING"
    }
  },
  tags: {
    include: {
      tag: true
    }
  }
} satisfies Prisma.ContactInclude;

export type ContactListPayload = Prisma.ContactGetPayload<{
  include: typeof contactListInclude;
}>;

export const contactDetailInclude = {
  companies: {
    include: {
      company: true
    }
  },
  followups: {
    include: {
      contact: true
    },
    orderBy: {
      dueAt: "asc"
    },
    where: {
      deletedAt: null
    }
  },
  interactions: {
    include: {
      createdBy: true
    },
    orderBy: {
      happenedAt: "desc"
    }
  },
  memorySummaries: {
    orderBy: {
      updatedAt: "desc"
    },
    take: 1
  },
  tags: {
    include: {
      tag: true
    }
  }
} satisfies Prisma.ContactInclude;

export type ContactDetailPayload = Prisma.ContactGetPayload<{
  include: typeof contactDetailInclude;
}>;

export function serializeTag(tag: Tag & { _count?: { contacts: number } }) {
  return {
    color: tag.color,
    id: tag.id,
    name: tag.name,
    usageCount: tag._count?.contacts ?? 0
  };
}

export function serializeCompany(company: Company) {
  return {
    description: company.description,
    id: company.id,
    industry: company.industry,
    name: company.name,
    website: company.website
  };
}

export function serializeFollowup(
  followup: Followup & {
    contact: Pick<Contact, "firstName" | "lastName">;
  },
) {
  return {
    channel: followup.channel,
    contactId: followup.contactId,
    contactName: `${followup.contact.firstName} ${followup.contact.lastName}`,
    dueAt: followup.dueAt.toISOString(),
    id: followup.id,
    prompt: followup.prompt,
    status: followup.status,
    suggestedMessage: followup.suggestedMessage
  };
}

export function serializeInteraction(
  interaction: Interaction & {
    createdBy: Pick<User, "fullName">;
  },
) {
  return {
    createdByName: interaction.createdBy.fullName,
    happenedAt: interaction.happenedAt.toISOString(),
    id: interaction.id,
    notes: interaction.notes,
    outcome: interaction.outcome,
    title: interaction.title,
    type: interaction.type
  };
}

export function serializeMemorySummary(summary: MemorySummary | null) {
  if (!summary) {
    return null;
  }

  return {
    brief: summary.brief,
    contactId: summary.contactId,
    id: summary.id,
    keyFacts: Array.isArray(summary.keyFacts) ? (summary.keyFacts as string[]) : [],
    nextBestAction: summary.nextBestAction,
    updatedAt: summary.updatedAt.toISOString()
  };
}

export function serializeContactListItem(contact: ContactListPayload) {
  return {
    avatarUrl: contact.avatarUrl,
    city: contact.city,
    companyName: contact.companies[0]?.company.name ?? null,
    email: contact.email,
    firstName: contact.firstName,
    id: contact.id,
    lastInteractionAt: contact.lastInteractionAt?.toISOString() ?? null,
    lastName: contact.lastName,
    nextFollowupAt: contact.followups[0]?.dueAt.toISOString() ?? contact.nextFollowupAt?.toISOString() ?? null,
    phone: contact.phone,
    relationshipStrength: contact.relationshipStrength,
    staleDays: calculateStaleDays(contact.lastInteractionAt),
    tags: contact.tags.map((entry) => serializeTag(entry.tag)),
    title: contact.title,
    warmthScore: contact.warmthScore
  };
}

export function serializeContactDetail(contact: ContactDetailPayload) {
  return {
    ...serializeContactListItem(contact),
    companies: contact.companies.map((entry) => serializeCompany(entry.company)),
    followups: contact.followups.map(serializeFollowup),
    interactions: contact.interactions.map(serializeInteraction),
    notes: contact.notes,
    summary: serializeMemorySummary(contact.memorySummaries[0] ?? null)
  };
}
