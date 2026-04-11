# Personal CRM Workspace

Personal CRM is a production-minded, multi-repo workspace for a SaaS-style relationship intelligence platform. It includes:

- `personal-crm-clients`: web, mobile, desktop, and shared frontend packages
- `personal-crm-api`: versioned REST API, auth, Prisma schema, CRM modules, and tests
- `personal-crm-agents`: queue-driven CRM intelligence workers and memory providers
- `personal-crm-platform`: Docker-first local infrastructure, reverse proxy, observability, and deployment assets
- `personal-crm-docs`: architecture, operational docs, ADRs, and troubleshooting guidance

Use the docs in `personal-crm-docs` for the full architecture and local development guide. The root workspace also keeps a running build log in `BUILD_LOG.md`.

## Quick Start

Docker-first:

```bash
cd personal-crm-platform
cp .env.example .env
docker compose up --build
```

Seed rich demo data after the stack is up:

```bash
cd personal-crm-platform
./scripts/reset-demo.sh
```

Demo login:

- Email: `owner@personal-crm.local`
- Password: `password123`

Local app URLs:

- Web app: `http://localhost:8080`
- API docs: `http://localhost:8080/api/docs`
- MailHog: `http://localhost:8025`
- Grafana: `http://localhost:3001`
- Prometheus: `http://localhost:9090`

Direct Node development:

```bash
cd personal-crm-platform
docker compose up postgres redis mailhog minio prometheus grafana
```

```bash
cd personal-crm-api
npm install
npm run prisma:deploy
npm run seed
npm run dev
```

```bash
cd personal-crm-agents
npm install
npm run prisma:generate
npm run dev
```

```bash
cd personal-crm-clients
npm install
npm run dev:web
```

Mobile and desktop:

```bash
cd personal-crm-clients
npm run dev:mobile
npm run dev:desktop
```

## Verification

The workspace includes lint, typecheck, test, build, Prisma validation, and Docker Compose config checks. See `BUILD_LOG.md` for the latest verification status.

## Repo Map

See `personal-crm-docs/repo-map.md`.
