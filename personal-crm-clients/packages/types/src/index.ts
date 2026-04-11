import { z } from "zod";

export const membershipRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER"]);

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  currentWorkspaceId: z.string(),
  memberships: z.array(
    z.object({
      workspaceId: z.string(),
      workspaceName: z.string(),
      role: membershipRoleSchema
    }),
  )
});

export const authPayloadSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: authUserSchema
});

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  website: z.string().nullable(),
  industry: z.string().nullable(),
  description: z.string().nullable()
});

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  usageCount: z.number().default(0)
});

export const relationshipHealthSchema = z.object({
  score: z.number(),
  warmthLabel: z.enum(["Cold", "Cooling", "Warm", "Strong"]),
  staleDays: z.number(),
  nextBestAction: z.string(),
  suggestedFollowupDate: z.string().nullable()
});

export const interactionSchema = z.object({
  id: z.string(),
  type: z.enum(["CALL", "TEXT", "EMAIL", "MEETING", "NOTE", "TASK"]),
  title: z.string(),
  notes: z.string().nullable(),
  happenedAt: z.string(),
  outcome: z.string().nullable(),
  createdByName: z.string()
});

export const followupSchema = z.object({
  id: z.string(),
  dueAt: z.string(),
  status: z.enum(["PENDING", "DONE", "SNOOZED", "CANCELED"]),
  channel: z.enum(["EMAIL", "TEXT", "CALL", "MEETING", "NOTE"]),
  prompt: z.string(),
  suggestedMessage: z.string().nullable(),
  contactId: z.string(),
  contactName: z.string()
});

export const memorySummarySchema = z.object({
  id: z.string(),
  contactId: z.string(),
  brief: z.string(),
  keyFacts: z.array(z.string()),
  nextBestAction: z.string(),
  updatedAt: z.string()
});

export const contactListItemSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  title: z.string().nullable(),
  city: z.string().nullable(),
  relationshipStrength: z.number(),
  warmthScore: z.number(),
  staleDays: z.number(),
  companyName: z.string().nullable(),
  lastInteractionAt: z.string().nullable(),
  nextFollowupAt: z.string().nullable(),
  tags: z.array(tagSchema),
  avatarUrl: z.string().nullable()
});

export const contactDetailSchema = contactListItemSchema.extend({
  notes: z.string().nullable(),
  summary: memorySummarySchema.nullable(),
  interactions: z.array(interactionSchema),
  followups: z.array(followupSchema),
  companies: z.array(companySchema)
});

export const dashboardSchema = z.object({
  overdueFollowups: z.array(followupSchema),
  todaysFollowups: z.array(followupSchema),
  recentInteractions: z.array(interactionSchema),
  staleContacts: z.array(contactListItemSchema),
  suggestedActions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      contactId: z.string().nullable(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH"])
    }),
  ),
  metrics: z.object({
    totalContacts: z.number(),
    warmContacts: z.number(),
    overdueCount: z.number(),
    interactionsThisMonth: z.number()
  })
});

export const savedFilterSchema = z.object({
  id: z.string(),
  name: z.string(),
  query: z.string().nullable(),
  tagIds: z.array(z.string()),
  staleOnly: z.boolean()
});

export const searchResultSchema = z.object({
  type: z.enum(["contact", "company", "note", "followup"]),
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  href: z.string()
});

export type MembershipRole = z.infer<typeof membershipRoleSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthPayload = z.infer<typeof authPayloadSchema>;
export type Company = z.infer<typeof companySchema>;
export type Tag = z.infer<typeof tagSchema>;
export type Interaction = z.infer<typeof interactionSchema>;
export type Followup = z.infer<typeof followupSchema>;
export type MemorySummary = z.infer<typeof memorySummarySchema>;
export type ContactListItem = z.infer<typeof contactListItemSchema>;
export type ContactDetail = z.infer<typeof contactDetailSchema>;
export type Dashboard = z.infer<typeof dashboardSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type SavedFilter = z.infer<typeof savedFilterSchema>;
export type RelationshipHealth = z.infer<typeof relationshipHealthSchema>;

