# Troubleshooting

## API cannot connect to database

Check `DATABASE_URL`, verify Postgres health, and run `docker compose logs postgres api`.

## Web cannot call API

Use the proxy URL `http://localhost:8080` and verify `NEXT_PUBLIC_API_URL=/api/v1`.

## Demo login missing

Run:

```bash
cd personal-crm-platform
docker compose exec api npm run seed
```

## Agent jobs remain queued

Check Redis and the agents worker:

```bash
docker compose logs redis agents
```

## Password reset email missing

Open MailHog at `http://localhost:8025`.

