# Security

This page documents observed behavior from the codebase. It is not a guarantee of safety.

## Current Controls

- Passwords and refresh/reset tokens are hashed with bcryptjs.
- Access and refresh tokens use separate configured secrets.
- Protected API routes require bearer access token plus `X-Workspace-Id`.
- Workspace membership is checked before protected route access.
- Some routes require `OWNER` or `ADMIN`.
- Zod validates request bodies and queries.
- Prisma query builders reduce SQL injection risk.
- React rendering avoids obvious raw HTML injection; no `dangerouslySetInnerHTML` was found.
- Audit events exist for selected workspace/contact/company/tag/interaction/follow-up actions.

## High-Risk Gaps

- `personal-crm-api/Dockerfile` runs `npm run seed` on startup, creating known local credentials in production-mode images.
- Web stores access and refresh tokens in local storage.
- CORS is configured with `origin: true` and `credentials: true`.
- `/v1/health/metrics`, `/docs`, and the agents `/metrics` endpoint are unauthenticated.
- Docker Compose exposes Postgres, Redis, API, agents, MailHog, MinIO, Prometheus, and Grafana to the host with local defaults.
- `POST /files/attachments` accepts arbitrary storage metadata and does not verify contact ownership.
- `contacts` company linking can connect a contact to a `companyId` without verifying the company belongs to the workspace.
- CSV export does not escape spreadsheet formulas.
- Auth routes lack route-specific throttling or account lockout.
- `nodemailer` has a production dependency advisory in the current lockfile audit.

## Privacy Notes

The app stores relationship notes, personal facts, emails, phones, reminders, and memory summaries. Agents may derive personal facts from notes. Optional MemPalace mode sends memory summaries to an external endpoint.

Before real use:

- Document data retention.
- Add hard-delete/export workflows.
- Audit agent-derived personal facts.
- Disable or review external memory providers.

## Minimum Production Checklist

- Remove seed-on-start from the API Dockerfile.
- Replace local credentials and secrets.
- Add CORS allowlist.
- Move tokens to hardened storage or BFF/httpOnly cookie architecture.
- Rotate refresh tokens.
- Add auth-specific rate limits.
- Protect metrics/docs or keep them private.
- Add security headers and TLS.
- Add tenant-safe ownership checks for every related id.
- Add CSV formula escaping.
- Upgrade vulnerable dependencies.
