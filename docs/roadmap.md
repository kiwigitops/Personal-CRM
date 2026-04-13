# Roadmap

## Immediate

- Remove seed-on-start from API Dockerfile.
- Remove prefilled demo credentials from client login screens or gate them by dev-only demo mode.
- Add CORS allowlist and protected metrics.
- Upgrade `nodemailer`.
- Add auth-specific rate limits.
- Fix tenant ownership checks for `companyId` and attachment `contactId`.
- Escape CSV export cells.

## This Week

- Implement web token refresh.
- Add reset password completion UI.
- Add invite acceptance UI.
- Add integration tests for auth, contacts, follow-ups, and workspace isolation.
- Fix contact `query + staleOnly` semantics.
- Restrict demo seed to empty/demo workspaces with explicit confirmation.
- Add GitHub repo hygiene files: `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, issue templates, PR template.

## Later

- Signed attachment upload/download.
- Full notification UI.
- Company detail and tag management pages.
- Member role editing and workspace rename UI.
- Search indexes and pagination.
- Production deployment manifests with ingress, secrets, network policies, backups, and resource limits.
- Privacy controls for retention, hard-delete, and export.
