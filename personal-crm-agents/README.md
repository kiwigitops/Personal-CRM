# personal-crm-agents

Queue-driven CRM intelligence workers for Personal CRM.

## Agents

- `seed-data-agent`
- `followup-agent`
- `memory-agent`
- `dedupe-agent`
- `enrichment-agent`
- `timeline-summary-agent`
- `relationship-health-agent`

## Skills

- `extract_contact_facts`
- `summarize_relationship_history`
- `generate_followup_suggestions`
- `score_contact_warmth`
- `dedupe_possible_duplicates`
- `suggest_next_best_action`
- `classify_contact_segment`
- `seed_realistic_demo_data`

## Commands

- `npm install`
- `npm run prisma:generate`
- `npm run dev`
- `npm run test`
- `npm run build`

The default memory provider is app-native and writes to the API-owned Prisma schema. A MemPalace adapter is present behind the `MEMORY_PROVIDER=mempalace` flag but is not a hard dependency.

