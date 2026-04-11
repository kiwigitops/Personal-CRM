# Local Development

## Docker Path

```bash
cd personal-crm-platform
cp .env.example .env
docker compose up --build
```

Open:

- Web: `http://localhost:8080`
- API docs: `http://localhost:8080/api/docs`
- MailHog: `http://localhost:8025`
- Grafana: `http://localhost:3001`
- Prometheus: `http://localhost:9090`

Demo login:

- Email: `owner@personal-crm.local`
- Password: `password123`

Seed richer demo data:

```bash
cd personal-crm-platform
./scripts/reset-demo.sh
```

## Local Node Path

Start dependencies:

```bash
cd personal-crm-platform
docker compose up postgres redis mailhog minio prometheus grafana
```

Run services:

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

Mobile:

```bash
cd personal-crm-clients
npm run dev:mobile
```

Desktop:

```bash
cd personal-crm-clients
npm run dev:desktop
```

