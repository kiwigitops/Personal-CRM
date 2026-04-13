# Troubleshooting

## API Will Not Start

Check:

- `DATABASE_URL`
- `REDIS_URL`
- Postgres health
- Redis health
- Prisma generated client

Commands:

```powershell
cd personal-crm-platform
docker compose logs api postgres redis

cd ../personal-crm-api
npm run prisma:generate
npm run typecheck
```

## Web Signs Out Unexpectedly

Access tokens expire and the web client does not call `/auth/refresh`. A `401` clears the session. Sign in again or implement refresh handling in the API client/AuthProvider.

## Forgot Password Has No Completion UI

The forgot-password page sends an email/token. The API supports `/auth/reset-password`, but the web app has no reset-token page yet.

## Invite Token Has No Accept UI

The API supports `/workspaces/invitations/accept`, but the web app does not expose it.

## Company Search Result 404

Global search returns company links like `/companies/:id`. The web app does not implement that route.

## Demo Seed Removed Data

The seed-data agent deletes interactions, follow-ups, reminders, and tags for existing contacts whose emails match seed contacts. Restore from database backup if this happened in a real workspace.

## Docker Compose Port Conflicts

Change published ports in `personal-crm-platform/docker-compose.yml` or stop local services using `3001`, `4000`, `4100`, `5432`, `6379`, `8025`, `9000`, `9001`, or `9090`.
