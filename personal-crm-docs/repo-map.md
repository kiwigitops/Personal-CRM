# Repo Map

## `personal-crm-clients`

Client monorepo with:

- `apps/web`: Next.js SaaS app with dashboard, contacts, detail timeline, follow-up board, workspace settings, command palette, dark mode, and CSV flows.
- `apps/mobile`: Expo app with secure session storage and native-feeling dashboard/contact/follow-up/profile tabs.
- `apps/desktop-linux`: Tauri shell with Linux keyring storage, API URL settings, notification fallback, and shared API access.
- `packages/ui`: design tokens, shared primitives, icons, and mobile theme tokens.
- `packages/types`: shared TypeScript and Zod CRM contracts.
- `packages/api-client`: typed REST SDK.
- `packages/config`: shared TypeScript, Tailwind, lint, and env helpers.
- `packages/utils`: shared formatting and relationship utilities.

## `personal-crm-api`

Fastify + Prisma API with versioned REST routes under `/v1`, OpenAPI docs at `/docs`, auth, RBAC, CRM modules, memory, queue job creation, notifications, audit trail, health checks, metrics, migrations, seeds, and tests.

## `personal-crm-agents`

BullMQ worker service with required agents, required skills, native memory provider, optional MemPalace adapter, job status updates, deterministic seeding, health checks, metrics, and tests.

## `personal-crm-platform`

Docker Compose, reverse proxy, Postgres, Redis, MailHog, MinIO, Prometheus, Grafana, scripts, env templates, and Kubernetes starter manifests.

## `personal-crm-docs`

Architecture, setup, operations, API, data model, memory, agents, ADRs, troubleshooting, and backlog docs.

