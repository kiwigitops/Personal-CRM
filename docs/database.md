# Database

## Canonical Files

- Schema: `personal-crm-api/prisma/schema.prisma`
- Migration: `personal-crm-api/prisma/migrations/20260410164500_init/migration.sql`
- Seed: `personal-crm-api/prisma/seed.ts`

## Provider

PostgreSQL through Prisma Client. The platform init script enables `pg_trgm`, but the migration does not create trigram or full-text indexes.

## Local Setup

With Docker Compose:

```powershell
cd personal-crm-platform
docker compose up --build -d postgres
```

Direct API setup:

```powershell
cd personal-crm-api
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

## Migration Policy

Use `npm run prisma:migrate` for development and `npm run prisma:deploy` for deployment. Do not let a production container create demo users automatically.

## Risk Areas

- No RLS. Tenant isolation depends on API filters.
- Some cross-workspace foreign-key combinations are structurally possible.
- Search uses `contains` queries without supporting indexes.
- Soft-deleted rows still occupy unique keys.
- Tests do not currently run against Postgres.
