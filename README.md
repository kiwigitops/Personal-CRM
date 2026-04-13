# Personal CRM

A personal relationship workspace for tracking contacts, companies, notes, follow-ups, reminders, and lightweight relationship intelligence across web, mobile, desktop, API, and background agents.

This repository is a working MVP, not a production-ready SaaS. The core web/API path is functional, but several features are partial and the platform defaults are local-development only. See [Known Issues](docs/known-issues.md) before deploying or adding real personal data.

## Demo

Screenshot or demo GIF placeholder:

```text
Add screenshots of the dashboard, contacts page, and contact detail timeline here.
```

## Features

Confirmed from code:

- Workspace-scoped email/password auth with JWT access tokens, refresh-token session rows, password reset tokens, and role-based workspace membership.
- Contacts with companies, tags, notes, relationship strength, warmth score, stale-contact detection, CSV import/export, saved filters, and duplicate suggestions.
- Interactions/timeline entries for calls, texts, emails, meetings, notes, and tasks.
- Follow-ups with channels, due dates, in-app reminders, completion, and snooze endpoints.
- Dashboard metrics for contacts, warm contacts, overdue follow-ups, monthly interactions, stale contacts, and suggested actions.
- Background BullMQ agents for memory summaries, relationship health, follow-up suggestions, dedupe suggestions, enrichment classification, timeline summaries, and demo seeding.
- Next.js web app, Expo mobile shell, Tauri Linux desktop shell, shared UI/types/utils/API client packages.
- Docker Compose platform with Nginx, API, web, agents, PostgreSQL, Redis, MailHog, MinIO, Prometheus, and Grafana.

Partial or incomplete:

- Attachments store metadata only. There is no signed upload/download flow yet.
- Mobile and desktop apps are read-heavy shells compared with the web app.
- Notifications API exists, but the web UI does not render/read in-app reminders.
- Invitation acceptance, password reset completion, member role editing, and workspace rename have API support but incomplete client UI coverage.
- Production hardening is incomplete.

## Architecture

```text
web/mobile/desktop clients
        |
        v
shared API client package
        |
        v
Fastify API (/v1) ---- PostgreSQL via Prisma
        |
        v
BullMQ queue on Redis ---- agents worker ---- memory summaries/job results
```

The API owns authentication, authorization, validation, CRM writes, audit events, and job enqueueing. Agents consume `crm-intelligence` jobs, read/write the same Prisma schema, and update `agent_job` status/result fields. The web app uses TanStack Query and stores the current browser session in local storage.

Start with [docs/overview.md](docs/overview.md), [docs/architecture.md](docs/architecture.md), and [AI_README.md](AI_README.md).

## Tech Stack

- TypeScript, Node.js 22, npm workspaces
- API: Fastify, Prisma, PostgreSQL, Zod, JWT, bcryptjs, BullMQ, Redis, Nodemailer
- Agents: BullMQ worker, Prisma generated client, native memory provider, optional MemPalace provider
- Web: Next.js App Router, React 19, TanStack Query, React Hook Form, Tailwind CSS, shared UI package
- Mobile: Expo/React Native, Expo SecureStore
- Desktop: Tauri 2, React/Vite, Linux keyring fallback wrapper
- Platform: Docker Compose, Nginx, MailHog, MinIO, Prometheus, Grafana, starter Kubernetes manifests

## Local Setup

Recommended local path:

```powershell
cd personal-crm-platform
Copy-Item .env.example .env
docker compose up --build -d
node .\scripts\reset-demo.mjs
```

Open:

- Web app: http://localhost:8080
- API docs through proxy: http://localhost:8080/api/docs
- API health: http://localhost:8080/api/v1/health/ready
- MailHog: http://localhost:8025
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090
- MinIO console: http://localhost:9001

Demo login for local development only:

```text
Email: owner@personal-crm.local
Password: password123
```

Do not expose the Compose stack to the public internet. It publishes Postgres, Redis, API, agents, MailHog, MinIO, Prometheus, and Grafana to the host with local defaults.

## Environment Variables

API (`personal-crm-api/.env.example`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | yes | `development`, `test`, or `production` |
| `PORT` | yes | API port, default `4000` |
| `APP_URL` | yes | Base app URL used in auth/invite flows |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `REDIS_URL` | yes | Redis connection string for queues |
| `JWT_ACCESS_SECRET` | yes | Access token signing secret |
| `JWT_REFRESH_SECRET` | yes | Refresh token signing secret |
| `ACCESS_TOKEN_TTL_MINUTES` | no | Access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | no | Refresh token lifetime |
| `RESET_TOKEN_TTL_MINUTES` | no | Password reset token lifetime |
| `MAIL_FROM` | yes | Sender address |
| `MAIL_HOST` | yes | SMTP host |
| `MAIL_PORT` | yes | SMTP port |
| `INTERNAL_API_KEY` | currently unused | Reserved but not enforced in code |

Agents (`personal-crm-agents/.env.example`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | yes | Runtime environment |
| `PORT` | yes | Agents health/metrics port |
| `DATABASE_URL` | yes | Same PostgreSQL database used by API |
| `REDIS_URL` | yes | Same Redis used by API queue |
| `MEMORY_PROVIDER` | no | `native` or `mempalace` |
| `MEMPALACE_ENDPOINT` | if mempalace | External memory API endpoint |
| `MEMPALACE_API_KEY` | if mempalace | External memory API bearer token |

Web/client:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API base URL for the web app, default `http://localhost:4000/v1` or `/api/v1` in Docker |
| `EXPO_PUBLIC_API_URL` | API base URL for mobile |
| `VITE_API_URL` | API base URL for desktop |

## Scripts

API:

```powershell
cd personal-crm-api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
npm run test
npm run lint
npm run typecheck
npm run build
```

Agents:

```powershell
cd personal-crm-agents
npm install
npm run prisma:generate
npm run dev
npm run test
npm run lint
npm run typecheck
npm run build
```

Clients:

```powershell
cd personal-crm-clients
npm install
npm run dev:web
npm run test
npm run lint
npm run typecheck
npm run build
```

Platform:

```powershell
cd personal-crm-platform
docker compose up --build -d
docker compose logs -f api agents web
docker compose down
```

## Database Setup

The Prisma schema lives at [personal-crm-api/prisma/schema.prisma](personal-crm-api/prisma/schema.prisma). The first migration is in [personal-crm-api/prisma/migrations](personal-crm-api/prisma/migrations).

For local Docker, Postgres starts automatically. For direct API development:

```powershell
cd personal-crm-api
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/personal_crm"
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

The seed script creates the local demo owner account. The API Dockerfile currently runs `npm run seed` at container start; remove that before production image use.

## Tests, Lint, And Builds

Verified during the latest audit:

```text
personal-crm-api: npm run test, lint, typecheck, build
personal-crm-agents: npm run test, lint, typecheck, build
personal-crm-clients: npm run lint, typecheck
@personal-crm/web: npm run build
personal-crm-platform: docker compose config
```

Current tests are mostly unit tests. There are no API integration tests with real Postgres/Redis and no browser end-to-end tests.

## Deployment Overview

The included Docker Compose and Kubernetes files are starters, not production infrastructure.

Before production:

- Remove automatic demo seeding from the API image.
- Replace all default secrets and passwords with secret-manager values.
- Put the API, agents, Redis, Postgres, metrics, MailHog, MinIO, Grafana, and Prometheus behind private networks.
- Add TLS, security headers, CORS allowlists, protected metrics, backups, migrations policy, and image tag pinning.
- Add integration tests and a deployment rollback plan.

See [docs/deployment.md](docs/deployment.md).

## Common Problems

- Sign-in fails after 60 minutes: the web client does not call `/auth/refresh`; it clears the session on `401`.
- Reset password email is sent, but there is no web reset form yet. Use the API directly until UI is implemented.
- Invites generate a token, but there is no full accept-invite UI.
- Command palette company results link to `/companies/:id`, but no company detail page exists.
- SNOOZED follow-ups are hidden from the main follow-up board because the board asks for `PENDING` only.

See [docs/troubleshooting.md](docs/troubleshooting.md) and [docs/known-issues.md](docs/known-issues.md).

## Roadmap

Near term:

- Security hardening: CORS allowlist, token rotation, auth rate limits, protected metrics, security headers.
- Remove demo credentials and seed-on-start behavior from production images.
- Add API integration tests with Postgres/Redis and browser tests for the web app.
- Complete reset password, invite acceptance, notifications, member role editing, and workspace settings UI.
- Implement signed attachment upload/download or remove the attachment API until ready.

Later:

- Full-text search indexes and better query semantics.
- Safer CSV import/export, duplicate merge workflow, and conflict resolution.
- Production deployment templates with ingress, secrets, network policies, and backups.
- Better privacy controls, retention policy, and data export/delete workflows.

## Contributing

This is currently a personal project. Keep changes small, grounded in existing module boundaries, and covered by tests when behavior changes.

Suggested workflow:

1. Read [AI_README.md](AI_README.md) and [docs/overview.md](docs/overview.md).
2. Run the relevant package tests and typecheck.
3. Update docs when changing routes, schema, auth behavior, agent behavior, or setup steps.

## License

No `LICENSE` file is currently present. Treat the code as private unless a license is added.

## Security Disclosure

Do not open a public issue with secrets, real personal data, exploit details, or tenant data examples. Document suspected issues privately and include affected files, routes, impact, reproduction steps, and suggested remediation. Start with [docs/security.md](docs/security.md) for the current security model and known risks.
