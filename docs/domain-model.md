# Domain Model

The canonical schema is [personal-crm-api/prisma/schema.prisma](../personal-crm-api/prisma/schema.prisma).

## Core Entities

| Entity | Purpose | Key Relationships |
| --- | --- | --- |
| `User` | Account with email/password profile | Sessions, memberships, interactions, follow-ups, reset tokens |
| `Session` | Hashed refresh-token session | Belongs to user |
| `PasswordResetToken` | Hashed reset token | Belongs to user |
| `Workspace` | Tenant/workspace boundary | Memberships, CRM data, audit, jobs |
| `Membership` | User role in workspace | `OWNER`, `ADMIN`, `MEMBER` |
| `WorkspaceInvitation` | Email invite token | Workspace, inviter, invited email |
| `Contact` | Person in CRM | Companies, tags, interactions, follow-ups, memory, reminders, attachments |
| `Company` | Organization | Linked to contacts through `ContactCompanyLink` |
| `Tag` | Label/segment | Linked to contacts through `ContactTag` |
| `Interaction` | Timeline event | Contact, creator, optional memory source |
| `Followup` | Scheduled next touch | Contact, creator, reminders |
| `Reminder` | In-app/email/push reminder row | Follow-up and contact |
| `MemoryEntry` | Extracted fact or interaction note | Contact, optional source interaction |
| `MemorySummary` | Latest generated relationship summary | Unique per contact |
| `AgentJob` | Durable queue/job status | Workspace, optional contact |
| `AuditEvent` | Audit trail event | Workspace, optional user actor |
| `Attachment` | File metadata stub | Workspace, optional contact |
| `SavedFilter` | User-saved contact filter | Workspace and user |

## Workspace Scoping

Most user-visible tables include `workspaceId`. API queries usually filter by `request.auth.workspaceId`.

Sharp edge: the database does not enforce composite tenant-safe foreign keys. Some routes can create cross-workspace links if given a known foreign id, especially `ContactCompanyLink` through `companyId` and `Attachment.contactId`. Fix this at the API level and, where possible, with composite constraints.

## Soft Delete

Soft delete fields exist on users, workspaces, memberships, companies, contacts, tags, and follow-ups. Unique constraints still apply to soft-deleted rows, so recreating a company/tag with the same name after deletion may fail unless restore or partial unique-index behavior is added.

## Data Retention

Deleting a contact sets `contact.deletedAt`. It does not hard-delete interactions, follow-ups, memory entries, reminders, attachments, or audit events. This is acceptable for audit/history only if documented and paired with a real purge/export policy.
