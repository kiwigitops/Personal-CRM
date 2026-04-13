# Personal CRM Audit Report

Audit date: 2026-04-13

Scope: local repository review, code inspection, dependency audit, tests, lint, typecheck, builds, and documentation generation.

## Repository Map

| Area | Confirmed Contents |
| --- | --- |
| Top level | `README.md`, `.github/workflows/ci.yml`, `assets`, `scripts`, `personal-crm-api`, `personal-crm-agents`, `personal-crm-clients`, `personal-crm-platform`, `personal-crm-docs` |
| API entry points | `personal-crm-api/src/server.ts`, `personal-crm-api/src/app.ts` |
| Auth entry points | `personal-crm-api/src/lib/auth.ts`, `personal-crm-api/src/modules/auth/index.ts`, web `AuthProvider`, sign-in/sign-up/forgot pages |
| DB schema | `personal-crm-api/prisma/schema.prisma`; generated agents client uses the same schema |
| API routes | `/v1/auth`, `/v1/users`, `/v1/workspaces`, `/v1/contacts`, `/v1/companies`, `/v1/interactions`, `/v1/followups`, `/v1/tags`, `/v1/search`, `/v1/memory`, `/v1/agents`, `/v1/files`, `/v1/notifications`, `/v1/audit`, `/v1/health` |
| Web pages | `/`, `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`, `/dashboard`, `/contacts`, `/contacts/[contactId]`, `/followups`, `/workspace` |
| Agents | `memory`, `timeline-summary`, `relationship-health`, `followup`, `dedupe`, `enrichment`, `seed-data` |
| Config | package manifests, TS configs, ESLint configs, Dockerfiles, Compose, Nginx, Kubernetes starters, env examples |
| Tests | API unit tests, agents unit tests, web API client smoke test; no DB/Redis integration or E2E tests |
| Docs | New canonical `docs`, user `docs-user`, compact `AI_README.md`; old `personal-crm-docs` marked legacy |

## Section 1 - Executive Summary

The app appears to be a multi-client personal CRM with workspace-scoped auth, contacts, timeline notes, follow-ups, CSV import/export, deterministic relationship agents, and local Docker infrastructure.

Overall code health: promising MVP, clean TypeScript style, passing tests/lint/build, but thin tests and several incomplete client/API flows.

Overall security posture: not production-ready. The biggest risks are seeded known credentials in the production-mode API image, localStorage refresh tokens, permissive CORS, exposed local infrastructure, unauthenticated metrics/docs, incomplete tenant ownership checks, and weak auth abuse controls.

Overall documentation quality: improved by this pass. Existing docs were optimistic and scattered; new docs are canonical, more honest, and AI-efficient.

Top problems:

1. API image seeds `owner@personal-crm.local/password123` at startup.
2. Web stores access and refresh tokens in localStorage.
3. Docker Compose exposes sensitive services with defaults.
4. CORS accepts every origin.
5. Auth lacks endpoint-specific throttling/lockout and refresh rotation.
6. Attachment metadata route trusts arbitrary client storage/contact ids.
7. Contact company linking can create cross-workspace relationships if a foreign `companyId` is known.
8. Demo seed agent can destructively replace real contact timelines.
9. Reset/invite/notification/company flows are partially implemented.
10. Tests do not cover real auth, tenant isolation, or DB/queue flows.

Highest-value improvements:

1. Remove seed-on-start and demo credential prefills from production paths.
2. Add CORS allowlist, security headers, and private metrics/docs.
3. Implement refresh-token rotation and browser refresh handling.
4. Add auth-specific rate limits and reset throttling.
5. Fix related-id ownership checks.
6. Add CSV formula escaping and import row limits.
7. Add integration tests with Postgres/Redis.
8. Gate demo seed to empty/demo workspaces.
9. Complete missing user flows.
10. Add repo hygiene files and keep `AI_README.md` canonical.

## Section 2 - Security Findings

| Severity | Finding | Status | Evidence | Fix |
| --- | --- | --- | --- | --- |
| Critical | Production-mode API image runs demo seed and creates known credentials | Definitely present | `personal-crm-api/Dockerfile`, `personal-crm-api/prisma/seed.ts` | Remove `npm run seed` from container CMD; make demo seed an explicit local-only command |
| High | Browser stores access and refresh tokens in localStorage | Definitely present | `personal-crm-clients/apps/web/src/components/auth-provider.tsx` | Move to BFF/httpOnly cookie model or hardened storage with refresh rotation and CSP |
| High | Demo credentials are committed and prefilled in clients | Definitely present | seed script, web/mobile/desktop sign-in screens | Gate demo defaults by local demo mode or remove prefills |
| High | Local platform exposes DB/cache/admin/metrics services with default credentials | Definitely present | `personal-crm-platform/docker-compose.yml` | Bind to localhost/private network, remove defaults, separate dev/prod configs |
| Medium | Permissive CORS with credentials | Definitely present | `personal-crm-api/src/app.ts` | Configure explicit origin allowlist from env |
| Medium | Metrics and Swagger docs are unauthenticated | Definitely present | API health module, Swagger UI, agents `/metrics` | Keep private or protect with auth/internal network |
| Medium | Attachment metadata accepts arbitrary `contactId` and `storageKey` | Definitely present | `personal-crm-api/src/modules/files/index.ts` | Verify contact belongs to workspace; replace storageKey trust with signed upload/download flow |
| Medium | Company linking does not verify `companyId` workspace | Definitely present | `syncPrimaryCompany` in contacts module | Fetch company by `id` and `workspaceId` before linking |
| Medium | CSV export can trigger spreadsheet formula injection | Definitely present | contacts CSV export | Prefix dangerous cells starting with `=`, `+`, `-`, `@`, tab, or CR |
| Medium | Auth abuse controls are too broad | Definitely present | global rate limit only | Add per-route signin/reset/signup limits, lockouts, and token invalidation monitoring |
| Medium | Refresh tokens are not rotated | Definitely present | `/auth/refresh` returns only access token | Rotate refresh tokens and revoke reuse |
| Medium | Nodemailer advisory in production dependency audit | Definitely present | `npm audit --omit=dev` | Upgrade to fixed version and retest |
| Low | JWT payload type/issuer/audience are not schema-validated | Definitely present | `personal-crm-api/src/lib/auth.ts` | Validate decoded payload, pin algorithms, add issuer/audience, require distinct secrets |
| Low | Audit trail is partial | Definitely present | selected `recordAuditEvent` calls only | Add audit for auth security events, role changes, imports/exports, file operations, destructive seed |

## Section 3 - Bugs And Reliability Findings

| Severity | Finding | Reproduction / Cause | Fix |
| --- | --- | --- | --- |
| High | Demo seed agent deletes existing data for matching contacts | Queue seed demo in a workspace with matching emails | Restrict to demo workspace, require confirmation, never delete real timelines |
| Medium | Contacts `query + staleOnly` uses OR semantics | Search with stale-only returns unrelated stale contacts | Build `AND` conditions around search/stale/tag filters |
| Medium | Snoozed follow-ups disappear from main page | Snooze via API, web lists `PENDING` only | Add snoozed view or convert snooze back to pending after date |
| Medium | `contact.nextFollowupAt` becomes stale after completion | Complete only marks follow-up/reminder | Recompute next pending follow-up on complete/snooze/delete |
| Medium | Missing reset password completion UI | Forgot password sends token only | Add reset page and API client method |
| Medium | Missing invite acceptance UI/API client method | Invite route exists; no client flow | Add accept-invite page/method |
| Medium | Company search links to missing route | Global search returns `/companies/:id` | Add company detail page or route companies to contacts/search |
| Medium | CSV import has no row limit, no transaction, weak numeric parsing | Paste huge or invalid CSV | Add size/row limits, validation, transaction/batching, error report |
| Low | Duplicate company/tag creates return 500 | Create duplicate name | Catch Prisma unique errors and return 409 |
| Low | Search lacks pagination/indexing | Larger datasets | Add cursors and indexes |

## Section 4 - Feature Inventory

Core CRM: dashboard, contacts, companies, interactions, follow-ups, saved filters, CSV import/export, search, relationship scoring. Status: working/partial depending on flow.

Contact/person management: create/list/detail/update/delete contacts; company link by name; tags display/import. Status: working, with partial tag/company UI and ownership bugs.

Notes/memory: interaction timeline, memory entries, summaries, rebuild job. Status: working async path, deterministic summaries.

Tasks/follow-ups: schedule, list pending, complete, API snooze. Status: partial; snooze/UI/state issues.

Communication tracking: interaction types for call/text/email/meeting/note/task. Status: create-only.

Tags/categories: tags list/create API, import-created tags, display badges. Status: partial UI.

Search/filter/reporting: command palette, contacts search, dashboard metrics. Status: working with semantic and route gaps.

Automation: BullMQ agents and deterministic skills. Status: working but demo seed dangerous and some results not persisted.

Import/export: pasted CSV import and CSV export. Status: working but unsafe/fragile.

Auth/user management: signup/signin/refresh/signout/forgot/reset API, membership, invites, roles. Status: partial client coverage.

Settings/preferences: workspace members/invite/demo/profile card, theme toggle. Status: partial.

Integrations: SMTP/MailHog, Redis, Postgres, optional MemPalace, MinIO placeholder, Prometheus/Grafana. Status: mixed.

Analytics: dashboard counts and stale/warm metrics. Status: basic.

Developer/admin tools: Swagger, health, metrics, audit events, publish script, Compose/K8s starters. Status: useful but needs hardening.

## Section 5 - GitHub / Repo UX Review

Quick wins: keep new README, add screenshots, add `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, PR template, issue templates, badges that reflect actual CI, and a docs index.

Medium effort: migrate or delete legacy `personal-crm-docs`, add sample `.env` guidance per service, add architecture diagram, add API examples, add troubleshooting for auth expiry/reset/invites.

High impact: root workspace scripts, integration-test harness, release/versioning policy, deployment guide with production blockers, demo-data safety model, changelog strategy.

## Section 6 - Generated README.md

Generated at `README.md`.

## Section 7 - Generated Developer Wiki

Generated under `docs/`: overview, architecture, domain model, backend, frontend, database, API, authentication, security, state management, jobs/automation, search, integrations, testing, deployment, troubleshooting, known issues, roadmap.

## Section 8 - Generated User Wiki

Generated under `docs-user/`: getting started, dashboard, contacts, notes, tasks, search, tags, import/export, settings, troubleshooting, FAQ.

## Section 9 - Generated AI_README.md

Generated at `AI_README.md`.

## Section 10 - Token Minimization Plan

- Treat `AI_README.md` as the first-load context file.
- Treat `docs/known-issues.md`, `docs/security.md`, and `docs/overview.md` as canonical summaries.
- Keep route inventory in `docs/api.md`; do not repeat every route in every doc.
- Keep schema truth in Prisma; docs summarize relationships only.
- Mark `personal-crm-docs` as legacy until migrated/deleted.
- Add an "AI handoff" note to future PRs with changed files, behavioral changes, tests run, and unresolved risks.
- Keep volatile data like commands and env vars in README/docs, not scattered comments.
- Keep code comments for non-obvious logic only.

## Section 11 - Prioritized Action Plan

Do immediately:

- Remove seed-on-start.
- Remove/gate demo login prefills.
- Add CORS allowlist.
- Protect metrics/docs.
- Upgrade Nodemailer.
- Fix company/attachment ownership checks.
- Escape CSV export.

Do this week:

- Implement refresh rotation and web refresh handling.
- Add auth rate limits and reset throttling.
- Add reset/invite UI.
- Add integration tests for auth and tenant isolation.
- Gate demo seed to demo-only workspaces.
- Add GitHub hygiene files.

Do this later:

- Signed attachments.
- Notifications UI.
- Company/tag management.
- Full-text search and pagination.
- Production deployment manifests.
- Data retention/export/delete workflows.
