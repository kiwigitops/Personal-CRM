# Architecture

## System Shape

```text
Next.js web app
Expo mobile app
Tauri desktop app
        |
        v
@personal-crm/api-client
        |
        v
Fastify API at /v1
        |
        +--> PostgreSQL via Prisma
        +--> Redis/BullMQ queue
        +--> SMTP through Nodemailer
        |
        v
Agents worker consumes crm-intelligence jobs
        |
        +--> Prisma writes memory/job/contact updates
        +--> optional MemPalace HTTP provider
```

## Main Decisions Visible In Code

- The API owns all workspace authorization checks through `app.authorize()` in `personal-crm-api/src/lib/auth.ts`.
- Clients pass `Authorization: Bearer <token>` and `X-Workspace-Id` headers.
- The access token contains `userId`; workspace access is checked against `membership`.
- CRM records are workspace-scoped in Prisma. There is no database row-level security.
- Agents share the API database schema and update durable `agentJob` rows.
- Local Docker uses Nginx to proxy `/api/*` to the API and everything else to the web app.

## Important Flows

Auth:

1. `/auth/signup` creates user, workspace, owner membership, session, access token, refresh token.
2. `/auth/signin` verifies `passwordHash` and creates a new session.
3. `/auth/refresh` verifies the refresh token and session row, then returns a new access token.
4. Web currently does not call refresh; it clears session on `401`.

Contact creation:

1. Web posts to `/contacts`.
2. API validates input, creates contact, syncs tags/company, enqueues `MEMORY`, records audit.
3. Agents rebuild memory summary asynchronously.

Interaction creation:

1. Web posts to `/interactions`.
2. API validates contact ownership, creates timeline entry, updates `lastInteractionAt`, creates `memoryEntry`, enqueues `TIMELINE_SUMMARY`.

Follow-up creation:

1. Web posts to `/followups`.
2. API validates contact ownership, creates follow-up and in-app reminder, updates `contact.nextFollowupAt`, enqueues `FOLLOWUP`.

## Production Boundaries

The included Compose file exposes many services to the host and includes local credentials. Treat it as local-only.

The API Dockerfile runs `npm run seed` at start. That creates `owner@personal-crm.local` with `password123`; remove this before production.

See [Security](security.md), [Deployment](deployment.md), and [Known Issues](known-issues.md).
