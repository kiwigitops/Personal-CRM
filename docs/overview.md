# Developer Overview

Personal CRM is a TypeScript monorepo for a personal relationship manager. The working path is the Next.js web app plus Fastify API plus PostgreSQL/Redis plus a BullMQ agents worker.

The repo is not production-ready. Local development is functional, but security and deployment hardening are incomplete. Read [known issues](known-issues.md) before using real personal data.

## Top-Level Map

| Path | Purpose |
| --- | --- |
| `personal-crm-api` | Fastify REST API, auth, RBAC, Prisma schema/migrations/seed, API tests |
| `personal-crm-agents` | BullMQ worker, deterministic CRM agents, memory providers, agent tests |
| `personal-crm-clients` | Next.js web app, Expo mobile app, Tauri desktop app, shared packages |
| `personal-crm-platform` | Docker Compose, Nginx proxy, Postgres, Redis, MailHog, MinIO, Prometheus, Grafana, starter Kubernetes |
| `personal-crm-docs` | Older docs folder kept for now |
| `docs` | Canonical developer wiki generated from the current audit |
| `docs-user` | User-facing CRM usage docs |
| `AI_README.md` | Compact context file for future AI sessions |

## Entry Points

- API server: `personal-crm-api/src/server.ts`
- API app wiring: `personal-crm-api/src/app.ts`
- Prisma schema: `personal-crm-api/prisma/schema.prisma`
- Agents service: `personal-crm-agents/src/index.ts`
- Agents worker: `personal-crm-agents/src/queue/worker.ts`
- Web root layout: `personal-crm-clients/apps/web/src/app/layout.tsx`
- Web protected layout: `personal-crm-clients/apps/web/src/app/(app)/layout.tsx`
- Shared API client: `personal-crm-clients/packages/api-client/src/index.ts`

## Confirmed User-Facing Areas

- Landing, sign-up, sign-in, forgot password
- Dashboard
- Contacts list and contact detail
- CSV import/export
- Saved filters
- Duplicate suggestions
- Interaction logging
- Follow-up scheduling and completion
- Workspace members, invites, and demo seed action
- Global command palette
- Thin mobile/desktop dashboards and contact/follow-up views

## Start Here

1. [Architecture](architecture.md)
2. [Domain Model](domain-model.md)
3. [API](api.md)
4. [Authentication](authentication.md)
5. [Known Issues](known-issues.md)
6. [AI context](../AI_README.md)
