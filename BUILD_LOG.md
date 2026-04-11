# Build Log

## 2026-04-10

- Initialized the Personal CRM workspace and root git repository.
- Created the required multi-repo folder layout for clients, API, agents, platform, and docs.
- Chose an npm workspace plus Turbo setup for the frontend monorepo and a modular Fastify + Prisma API.
- Started adding repo-level standards, documentation, and scaffolding assets.
- Implemented the API with auth, RBAC, workspace membership, contacts, companies, tags, interactions, follow-ups, search, memory, agents, notifications, audit, health, Prisma schema, migration SQL, seed script, tests, linting, and Dockerfile.
- Implemented the agents worker with BullMQ processing, all required agents and skills, deterministic demo seeding, native memory provider, optional MemPalace adapter, job status tracking, tests, linting, and Dockerfile.
- Implemented the clients monorepo with shared UI/types/api-client/config/utils packages, polished Next.js web app, Expo mobile app, Tauri Linux desktop shell, tests, linting, typechecks, and production web build.
- Added platform orchestration with Docker Compose, reverse proxy, Postgres, Redis, MailHog, MinIO, Prometheus, Grafana, scripts, env templates, and Kubernetes starter manifests.
- Added documentation repo with architecture, repo map, local development, deployment, data model, API, auth, memory, agents, ADRs, troubleshooting, and backlog docs.
- Added root CI workflow, third-party notices, docker ignore, editor config, and startup documentation.
- Verification completed: API lint/typecheck/test/build, agents lint/typecheck/test/build, clients lint/typecheck/test, web production build, Prisma validate/generate, and Docker Compose config validation. Docker daemon was not running locally, so full container boot was not executed in this session.

## 2026-04-11

- Recovered Docker Desktop/WSL enough to run the local containerized stack.
- Fixed container runtime startup issues: corrected compiled API and agents entrypoints, removed the Prisma migration UTF-8 BOM, copied generated Prisma clients into runtime images, and updated the agents Fastify logger wiring.
- Rebuilt and started the local Docker stack with reverse proxy, web app, API, agents worker, PostgreSQL, Redis, MailHog, MinIO, Prometheus, and Grafana.
- Verified deployed health endpoints through the proxy, API docs, the web app, and the agents readiness endpoint.
- Ran the demo seed flow through the API and agents queue; confirmed the dashboard returns seeded CRM data for `owner@personal-crm.local`.
- Committed the runtime deployment fix locally as `eb6de74 Fix container runtime startup`.
- GitHub publishing remains blocked until GitHub authentication or a repository remote is available on this machine.
