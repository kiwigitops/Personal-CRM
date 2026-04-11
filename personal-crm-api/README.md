# personal-crm-api

Central REST API for Personal CRM. This service owns authentication, workspace RBAC, CRM entities, search, audit logs, queue-backed agent jobs, memory summaries, notifications, health checks, and OpenAPI docs.

## Commands

- `npm install`
- `npm run prisma:generate`
- `npm run dev`
- `npm run test`
- `npm run build`

Swagger UI is served from `/docs`; all product routes are versioned under `/v1`.

