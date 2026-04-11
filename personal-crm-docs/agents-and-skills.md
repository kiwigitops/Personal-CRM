# Agents And Skills

Agents run through BullMQ on the `crm-intelligence` queue.

Agents:

- `seed-data-agent`
- `followup-agent`
- `memory-agent`
- `dedupe-agent`
- `enrichment-agent`
- `timeline-summary-agent`
- `relationship-health-agent`

Skills:

- `extract_contact_facts`
- `summarize_relationship_history`
- `generate_followup_suggestions`
- `score_contact_warmth`
- `dedupe_possible_duplicates`
- `suggest_next_best_action`
- `classify_contact_segment`
- `seed_realistic_demo_data`

Every queued job has a durable `agent_job` row with status, attempts, result, timestamps, and error details.

