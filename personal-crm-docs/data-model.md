# Data Model

The API owns the Prisma schema and migrations.

Core tables:

- `user`, `session`, `password_reset_token`
- `workspace`, `membership`, `workspace_invitation`
- `contact`, `company`, `contact_company_link`
- `tag`, `contact_tag`
- `interaction`
- `followup`, `reminder`
- `memory_entry`, `memory_summary`
- `agent_job`
- `audit_event`
- `attachment`
- `saved_filter`

Design principles:

- Workspace-scoped records for multi-tenancy.
- Soft delete on user-visible CRM entities.
- Membership role checks before workspace access.
- Indexes on workspace, search-adjacent fields, due dates, and job statuses.
- Agent job table is the durable status source for queue processing.

