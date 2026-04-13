# Jobs And Automation

## Queue

Queue name: `crm-intelligence`

API enqueue helper: `personal-crm-api/src/lib/queue.ts`

Worker: `personal-crm-agents/src/queue/worker.ts`

Durable status table: `AgentJob`

## Job Types

| Type | Handler | Current Behavior |
| --- | --- | --- |
| `SEED_DATA` | `seed-data-agent` | Creates/updates deterministic demo CRM data, deletes seeded contacts' existing interactions/follow-ups/reminders |
| `FOLLOWUP` | `followup-agent` | Generates suggested follow-up data and may create one if no pending follow-ups exist |
| `MEMORY` | `memory-agent` | Extracts facts, updates warmth/stale cache, writes memory summary |
| `DEDUPE` | `dedupe-agent` | Returns duplicate suggestions in job result only |
| `ENRICHMENT` | `enrichment-agent` | Returns segment classifications in job result only |
| `TIMELINE_SUMMARY` | `timeline-summary-agent` | Delegates to memory agent |
| `RELATIONSHIP_HEALTH` | `relationship-health-agent` | Updates warmth/stale cache and existing summaries |

## Memory Providers

- `native`: writes `MemorySummary` rows directly.
- `mempalace`: posts summaries to `${MEMPALACE_ENDPOINT}/memory/summaries` with bearer auth.

## Risks

- Demo seed is destructive for existing matching contacts.
- Some agent outputs are not persisted beyond `agentJob.result`.
- Redis is exposed in local Compose with no auth.
- Agents share direct DB access with the API; enforce tenant checks in every handler.

## Operational Notes

Agents expose:

- `GET /health/live`
- `GET /health/ready`
- `GET /metrics`

These endpoints are unauthenticated and should remain private.
