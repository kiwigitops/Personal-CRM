# Architecture Overview

Personal CRM is split into independent repos with one local orchestration layer.

The web, mobile, and desktop clients call the centralized API through a typed SDK. The API owns authentication, workspace membership, RBAC, validation, audit logging, migrations, CRM data, search, and job enqueueing. Agents consume BullMQ jobs from Redis, read/write the API-owned Postgres schema through Prisma, and update `agent_job` rows with status, results, retries, and errors.

Local development runs behind Nginx so the browser uses `/api/v1` and avoids CORS surprises. Postgres is the source of truth. Redis backs queues and can later be used for cache/idempotency expansion. MailHog captures local auth/invite/reset mail. MinIO is wired as the future object storage target for attachments.

## Request Flow

1. Client signs in and receives access and refresh tokens.
2. Client sends `Authorization: Bearer` plus `X-Workspace-Id`.
3. API validates JWT and membership role.
4. API mutates CRM data and writes audit events.
5. API enqueues agent jobs for memory, follow-ups, dedupe, seed data, and relationship health.
6. Agents process jobs, write memory summaries and job results, then clients refresh via TanStack Query.

