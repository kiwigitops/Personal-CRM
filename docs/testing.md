# Testing

## Verified Commands

Latest audit verification:

```powershell
cd personal-crm-api
npm run test
npm run lint
npm run typecheck
npm run build

cd ../personal-crm-agents
npm run test
npm run lint
npm run typecheck
npm run build

cd ../personal-crm-clients
npm run lint
npm run typecheck
npm run build --workspace @personal-crm/web

cd ../personal-crm-platform
docker compose config
```

## Current Tests

- API unit tests for JWT helper behavior and relationship scoring.
- Agents unit tests for deterministic skills.
- Web API client smoke test.
- Mobile/desktop test scripts pass with no tests.

## Missing Tests

- API integration tests with Postgres and Redis.
- Auth workflow tests for signup, signin, refresh, signout, reset password, invitations.
- Authorization tests for every workspace-scoped route.
- Tenant isolation tests for related ids.
- CSV import/export tests, including formula escaping.
- Browser E2E tests for core web flows.
- Agents worker tests with a real queue or test queue.
- Deployment smoke tests.

## Priority Test Additions

1. Auth and authorization integration suite.
2. Contacts CRUD/import/export/search suite.
3. Follow-up lifecycle suite.
4. Agent job lifecycle suite.
5. Web Playwright happy path.
