# API Overview

Base URL:

- Docker/proxy: `http://localhost:8080/api/v1`
- Direct API: `http://localhost:4000/v1`

OpenAPI docs:

- Direct: `http://localhost:4000/docs`
- Through proxy: `http://localhost:8080/api/docs`

Auth headers:

```http
Authorization: Bearer <access-token>
X-Workspace-Id: <workspace-id>
```

Implemented route groups:

- `/auth`: signup, signin, refresh, signout, forgot password, reset password
- `/users`: current profile
- `/workspaces`: current workspace, dashboard, members, invitations, roles
- `/contacts`: CRUD, saved filters, dedupe, CSV import/export
- `/companies`: list/create/update
- `/tags`: list/create
- `/interactions`: create timeline items
- `/followups`: list/create/complete/snooze
- `/search`: global search
- `/memory`: contact summary and rebuild queueing
- `/agents`: seed demo and job status
- `/notifications`: in-app reminders
- `/files`: attachment metadata stub
- `/audit`: audit events
- `/health`: live, ready, metrics

