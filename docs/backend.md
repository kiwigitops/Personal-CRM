# Backend

## Runtime

The API is a Fastify app created in `personal-crm-api/src/app.ts` and started by `personal-crm-api/src/server.ts`.

Registered plugins:

- `@fastify/cors` with `origin: true` and `credentials: true`
- `@fastify/rate-limit` with global `200/min`
- Swagger and Swagger UI
- Prisma plugin
- Redis plugin
- Auth plugin
- Queue plugin

## Modules

| Module | Routes |
| --- | --- |
| `auth` | `/auth/signup`, `/auth/signin`, `/auth/refresh`, `/auth/signout`, `/auth/forgot-password`, `/auth/reset-password` |
| `users` | `/users/me` GET/PATCH |
| `workspaces` | current workspace, dashboard, members, invitations, member role changes |
| `contacts` | list/create/read/update/delete, CSV import/export, saved filters, dedupe suggestions |
| `companies` | list/create/update |
| `tags` | list/create |
| `interactions` | create timeline entry |
| `followups` | list/create/complete/snooze |
| `search` | global search |
| `memory` | contact summary and rebuild |
| `agents` | seed demo and job status |
| `files` | attachment metadata create only |
| `notifications` | in-app reminders list/read |
| `audit` | admin audit events |
| `health` | live, ready, metrics |

## Validation

Routes use local Zod schemas and `toJsonSchema()` for Swagger schema generation. Many string IDs are only validated as non-empty strings, not as existing workspace-scoped records. Always verify ownership before connecting related records.

## Error Handling

Zod errors return `400`. Other errors are logged and returned as generic `500`. This prevents raw stack leaks but means duplicate-name and constraint failures often surface as `500` instead of conflict responses.

## Queueing

`queueAgentJob()` creates an `agentJob` row, enqueues a BullMQ job on `crm-intelligence`, stores the external job id, and returns both ids.

See [Jobs And Automation](jobs-automation.md).
