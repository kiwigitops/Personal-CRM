# AI_README

Purpose: compact repo context for future AI work. Stable facts only unless marked implementation detail.

## If You Only Read One Thing

Personal CRM is a TypeScript monorepo MVP. Core path: Next.js web -> shared API client -> Fastify `/v1` API -> Prisma/Postgres + Redis/BullMQ -> agents worker. It tracks workspace-scoped contacts, companies, tags, interactions, follow-ups, reminders, memory summaries, agent jobs, and audit events. It is local-dev ready but not production hardened.

## Canonical Truths

- API owns auth, RBAC, validation, CRM writes, audit, and queue enqueueing.
- Prisma schema is canonical: `personal-crm-api/prisma/schema.prisma`.
- Tenant boundary is `workspaceId` plus `membership`; no DB RLS.
- Protected API requests require `Authorization: Bearer <access>` and `X-Workspace-Id`.
- Agents read/write the same DB through generated Prisma client and consume BullMQ queue `crm-intelligence`.
- Web auth session is persisted in local storage.
- Docker Compose is local-only.
- API Dockerfile currently seeds demo credentials on startup. Do not ignore this.

## Load Order

1. `AI_README.md`
2. `docs/known-issues.md`
3. `personal-crm-api/prisma/schema.prisma`
4. `personal-crm-api/src/app.ts`
5. `personal-crm-api/src/lib/auth.ts`
6. `personal-crm-api/src/modules/auth/index.ts`
7. Relevant API module in `personal-crm-api/src/modules/*`
8. `personal-crm-clients/packages/api-client/src/index.ts`
9. Relevant web page in `personal-crm-clients/apps/web/src/app`
10. `personal-crm-agents/src/queue/worker.ts` and relevant agent
11. `personal-crm-platform/docker-compose.yml`

## Key Folders

- `personal-crm-api`: Fastify API, Prisma, auth, CRM modules, tests.
- `personal-crm-agents`: BullMQ worker, deterministic agents/skills, memory providers.
- `personal-crm-clients/apps/web`: Next.js app.
- `personal-crm-clients/apps/mobile`: Expo shell.
- `personal-crm-clients/apps/desktop-linux`: Tauri shell.
- `personal-crm-clients/packages/api-client`: fetch wrapper.
- `personal-crm-clients/packages/types`: Zod/type contracts, not runtime-validated by API client.
- `personal-crm-clients/packages/ui`: shared primitives/icons/theme.
- `personal-crm-platform`: local Docker/infra.
- `docs`: current canonical developer docs.
- `docs-user`: current user docs.

## Main Routes

Auth: signup, signin, refresh, signout, forgot/reset password.
Workspace: current, update, members, invitations, accept invitation, role update, dashboard.
CRM: contacts CRUD/import/export/saved filters/dedupe; companies list/create/update; tags list/create.
Activity: interactions create; followups list/create/complete/snooze.
Other: search, memory summary/rebuild, agents seed/jobs, notifications, file attachment metadata, audit events, health.

## Main Entities

`User` -> `Membership` -> `Workspace`.
`Workspace` owns `Contact`, `Company`, `Tag`, `Interaction`, `Followup`, `Reminder`, `MemoryEntry`, `MemorySummary`, `AgentJob`, `AuditEvent`, `Attachment`, `SavedFilter`, `WorkspaceInvitation`.
`Contact` links to companies/tags and owns interactions/follow-ups/memory/reminders.

## Auth Model

Access JWT: `{ userId, type: "access" }`.
Refresh JWT: `{ userId, sessionId, type: "refresh" }`; hashed token in `Session`.
Roles: `OWNER`, `ADMIN`, `MEMBER`.
Important implementation detail: token payload type is cast after verify, not schema-validated; refresh rotation is missing.

## Security-Sensitive Areas

- `personal-crm-api/Dockerfile`: seed-on-start.
- `personal-crm-clients/apps/web/src/components/auth-provider.tsx`: localStorage tokens.
- `personal-crm-api/src/app.ts`: permissive CORS, global rate limit.
- `personal-crm-api/src/modules/files/index.ts`: unverified attachment metadata.
- `personal-crm-api/src/modules/contacts/index.ts`: company id linking, CSV import/export, search filters.
- `personal-crm-platform/docker-compose.yml`: exposed services/default credentials.
- `personal-crm-agents/src/agents/seed-data-agent.ts`: destructive demo seeding.

## Known Sharp Edges

- No web token refresh.
- No reset password completion UI.
- No invite accept UI.
- No notifications UI.
- No company detail page despite search links.
- Snoozed follow-ups disappear from pending board.
- Contact `query + staleOnly` uses OR semantics.
- Attachments are metadata-only.
- Audit coverage is partial.
- Tests are mostly unit tests; no DB/Redis integration suite.

## Code Conventions

- TypeScript, Zod for request validation, Prisma for DB access.
- Keep API route logic inside `src/modules/<domain>/index.ts`.
- Use `app.authorize()` on protected routes.
- Always filter by `request.auth!.workspaceId`.
- Verify related entity ownership before connecting ids.
- Use existing serializers in `personal-crm-api/src/lib/serializers.ts`.
- Keep docs concise; link canonical files instead of repeating schema/routes everywhere.

## Do Not Change Casually

- Prisma schema relationships and enum names.
- Auth token shape and membership checks.
- Queue name `crm-intelligence`.
- Shared API client method names without updating web/mobile/desktop.
- Demo seed behavior without adding safety gates and docs.

## Fastest Productive Path

Run tests/typecheck first. For API work, inspect schema, module, serializer, API client, then page. For agent work, inspect job enqueue site, worker, handler, and skill. For security work, start with `docs/known-issues.md`.
