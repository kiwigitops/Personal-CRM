# Integrations

## Confirmed Integrations

| Integration | Where | Status |
| --- | --- | --- |
| SMTP/MailHog | API mailer and Compose | Working for local reset/invite email |
| Redis/BullMQ | API queue and agents worker | Working for background jobs |
| PostgreSQL/Prisma | API and agents | Working core data store |
| MemPalace | Agents memory provider | Optional adapter, environment-driven, not enabled by default |
| MinIO | Compose only | Provisioned but not wired to attachment upload/download |
| Prometheus | API/agents metrics and Compose | Exposes unauthenticated metrics locally |
| Grafana | Compose | Local dashboard shell, default admin password |
| GitHub publish script | `scripts/publish-github.ps1` | Helper script, not runtime |

## Not Implemented

- OAuth contacts/calendar/email import
- Real email sending provider config beyond generic SMTP host/port
- Push notifications
- Webhooks
- Object storage signed URLs
- Calendar sync
- CRM imports beyond pasted CSV

## Privacy Warning

MemPalace mode sends memory summaries and key facts to an external endpoint. Treat this as a data processor integration and document it before enabling.
