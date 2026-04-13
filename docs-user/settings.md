# Settings

The Workspace page currently includes:

- Member list
- Invite member form
- Demo seed job button
- Current profile summary

## Invites

Owners/admins can generate an invite token. Local development sends invite mail to MailHog and the API returns a token.

Accepting invites is not fully implemented in the web UI.

## Demo Seed

The demo seed button queues a seed-data agent job.

Warning: seed data can overwrite/delete interactions, reminders, and follow-ups for contacts whose emails match the seed data. Use only in demo workspaces.

## Missing Settings

- Workspace rename UI
- Member role editing UI
- Notification preferences
- Account/profile edit UI
- Data export/delete settings
