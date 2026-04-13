# Known Issues

Confirmed from code audit.

## Security

| Severity | Issue | Evidence |
| --- | --- | --- |
| Critical | API production image runs demo seed on startup | `personal-crm-api/Dockerfile` |
| High | Web stores access and refresh tokens in local storage | `personal-crm-clients/apps/web/src/components/auth-provider.tsx` |
| High | Default demo credentials are committed and prefilled | `prisma/seed.ts`, web/mobile/desktop sign-in screens |
| High | Local Compose exposes data/infra services with default credentials | `personal-crm-platform/docker-compose.yml` |
| Medium | CORS reflects all origins with credentials | `personal-crm-api/src/app.ts` |
| Medium | Metrics/docs are unauthenticated | API health module, Swagger UI, agents service |
| Medium | Attachment metadata route trusts client `contactId` and `storageKey` | `personal-crm-api/src/modules/files/index.ts` |
| Medium | Company link path does not verify `companyId` workspace | `personal-crm-api/src/modules/contacts/index.ts` |
| Medium | CSV export does not prevent spreadsheet formula injection | `contacts/export/csv` |
| Medium | Auth has no route-specific throttling or lockout | `auth` module plus global rate limit only |
| Medium | `nodemailer` production dependency audit reports command-injection advisories | `npm audit --omit=dev` in API |

## Bugs And Reliability

| Severity | Issue | Evidence |
| --- | --- | --- |
| High | Demo seed agent is destructive for matching contacts | `personal-crm-agents/src/agents/seed-data-agent.ts` |
| Medium | Contact search with `staleOnly` uses `OR`, not `AND` | `contacts` module filter construction |
| Medium | Snoozed follow-ups disappear from the main follow-up page | Web asks only for `PENDING`; API sets `SNOOZED` |
| Medium | Follow-up completion does not recompute `contact.nextFollowupAt` | `followups` module |
| Medium | Reset password API exists but UI/API client method is missing | API route exists, client/page missing |
| Medium | Invitation accept API exists but UI/API client method is missing | API route exists, client/page missing |
| Medium | Company search links route to a missing page | Search module returns `/companies/:id`, web lacks page |
| Medium | Import CSV has no row/size/domain validation and can enqueue expensive dedupe | `contacts/import/csv` |
| Low | Unique conflicts often return generic `500` | company/tag create paths |
| Low | Search has no pagination and no supporting indexes | search and contacts modules |

## Documentation

- No license file.
- No contribution guide.
- No security policy file.
- No issue/PR templates.
- Existing `personal-crm-docs` docs are useful but optimistic and not canonical after this audit.
