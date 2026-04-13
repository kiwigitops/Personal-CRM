# API

Base URLs:

- Direct local API: `http://localhost:4000/v1`
- Docker proxy: `http://localhost:8080/api/v1`

Swagger UI:

- Direct: `http://localhost:4000/docs`
- Docker proxy: `http://localhost:8080/api/docs`

## Auth Headers

Protected routes expect both headers:

```http
Authorization: Bearer <access-token>
X-Workspace-Id: <workspace-id>
```

## Route Inventory

### Auth

- `POST /auth/signup`
- `POST /auth/signin`
- `POST /auth/refresh`
- `POST /auth/signout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Users

- `GET /users/me`
- `PATCH /users/me`

### Workspaces

- `GET /workspaces/current`
- `PATCH /workspaces/current`
- `GET /workspaces/members`
- `POST /workspaces/invitations`
- `POST /workspaces/invitations/accept`
- `PATCH /workspaces/members/:membershipId/role`
- `GET /workspaces/dashboard`

### CRM

- `GET /contacts`
- `POST /contacts`
- `GET /contacts/:contactId`
- `PATCH /contacts/:contactId`
- `DELETE /contacts/:contactId`
- `GET /contacts/export/csv`
- `POST /contacts/import/csv`
- `GET /contacts/saved-filters`
- `POST /contacts/saved-filters`
- `GET /contacts/dedupe-suggestions`
- `GET /companies`
- `POST /companies`
- `PATCH /companies/:companyId`
- `GET /tags`
- `POST /tags`

### Timeline And Follow-Ups

- `POST /interactions`
- `GET /followups`
- `POST /followups`
- `POST /followups/:followupId/complete`
- `POST /followups/:followupId/snooze`

### Search, Memory, Agents

- `GET /search/global`
- `GET /memory/contacts/:contactId/summary`
- `POST /memory/contacts/:contactId/rebuild`
- `POST /agents/seed-demo`
- `GET /agents/jobs/:jobId`
- `GET /agents/jobs`

### Notifications, Files, Audit, Health

- `GET /notifications/in-app`
- `POST /notifications/in-app/:reminderId/read`
- `POST /files/attachments`
- `GET /audit/events`
- `GET /health/live`
- `GET /health/ready`
- `GET /health/metrics`

## Client Coverage

The shared API client does not cover every route. Missing or incomplete client methods include reset password, refresh token, invitation accept, follow-up snooze, notifications, file attachments, audit events, agent job list/detail, current workspace read/update, company create/update, and tag create.
