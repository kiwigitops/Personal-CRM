# personal-crm-platform

Infrastructure and local orchestration for the Personal CRM workspace.

## Local Stack

- Nginx reverse proxy on `http://localhost:8080`
- Web app
- API
- Agents worker
- PostgreSQL
- Redis
- MailHog on `http://localhost:8025`
- MinIO on `http://localhost:9001`
- Prometheus on `http://localhost:9090`
- Grafana on `http://localhost:3001`

## Commands

- `./scripts/bootstrap.sh`
- `./scripts/dev-up.sh`
- `./scripts/dev-down.sh`
- `./scripts/reset-demo.sh`

Windows users can run `scripts/bootstrap.ps1`, then use `docker compose up --build`.

