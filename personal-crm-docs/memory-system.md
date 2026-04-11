# Memory System

The memory layer summarizes relationship history per contact.

Default provider:

- `NativeMemoryProvider`
- Writes to `memory_entry` and `memory_summary`
- Stable, app-native, and self-hostable

Optional provider:

- `MemPalaceMemoryProvider`
- Enabled with `MEMORY_PROVIDER=mempalace`
- Requires `MEMPALACE_ENDPOINT` and `MEMPALACE_API_KEY`
- Pluggable and not required for core app behavior

Memory jobs are queued when contacts, interactions, and manual rebuilds occur. The agents service extracts facts, scores warmth, summarizes timeline history, and writes the latest relationship brief.

