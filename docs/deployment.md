# Deployment

## Current Assets

- Dockerfiles for API, agents, and web.
- Docker Compose local stack in `personal-crm-platform/docker-compose.yml`.
- Nginx reverse proxy in `personal-crm-platform/proxy/default.conf`.
- Starter Kubernetes manifests in `personal-crm-platform/k8s`.

## Local Only Warnings

The current Compose file is local-development oriented. It exposes:

- API on `4000`
- Agents on `4100`
- Postgres on `5432`
- Redis on `6379`
- MailHog on `8025`
- MinIO on `9000/9001`
- Prometheus on `9090`
- Grafana on `3001`

It also includes default passwords/secrets. Do not deploy it as-is.

## Production Blockers

- API Dockerfile runs `npm run seed` on startup.
- No TLS/ingress manifest.
- No Kubernetes Secret example.
- No network policies.
- No HPA/resources/limits.
- No backup/PITR documentation.
- No protected metrics.
- No image tag/versioning policy.
- No migration rollback plan.

## Minimum Production Shape

- Managed Postgres with backups and restore testing.
- Private Redis with persistence appropriate for BullMQ.
- Secret manager for JWT secrets, DB URL, SMTP credentials, and external provider keys.
- API and agents on private networks.
- Public ingress only to the web app and intended API path.
- TLS and security headers.
- Observability behind auth or private network.
- CI-built, pinned image tags.
- Manual or pipeline-controlled migrations.

## Deployment Checklist

1. Remove automatic seed from API image.
2. Rotate all credentials.
3. Set `NODE_ENV=production`.
4. Configure CORS allowlist.
5. Protect `/docs`, metrics, Grafana, Prometheus, MailHog, MinIO.
6. Run smoke tests.
7. Verify backups.
8. Document rollback.
