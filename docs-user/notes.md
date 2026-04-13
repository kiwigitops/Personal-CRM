# Notes And Timeline

Notes are stored as interactions on a contact timeline.

Supported interaction types:

- Call
- Text
- Email
- Meeting
- Note
- Task

## Log A Note

1. Open a contact.
2. Use Log interaction.
3. Pick a type.
4. Add a title, notes, and optional outcome.
5. Submit.

Logging an interaction updates the timeline, may update `lastInteractionAt`, creates a memory entry, and queues a timeline summary job.

## Limitations

There is no edit/delete UI for interactions yet. Treat timeline entries as append-only from the current UI.
