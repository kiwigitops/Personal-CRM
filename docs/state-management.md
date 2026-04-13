# State Management

## Web

The web app uses:

- React local component state for forms, filters, modals, tabs, and UI toggles.
- TanStack Query for server data.
- `AuthProvider` context for session state and API client callbacks.
- Browser local storage for persisted auth session.

## Query Patterns

Examples:

- Dashboard: `["dashboard"]`
- Contacts: `["contacts", query, staleOnly]`
- Contact detail: `["contact", contactId]`
- Follow-ups: `["followups", "PENDING"]`
- Workspace members: `["workspace-members"]`

Mutations manually invalidate related keys.

## Sharp Edges

- No automatic token refresh.
- `AuthProvider` creates a new API client object each render.
- Some mutations invalidate only local page queries, not dashboard/follow-up aggregate queries.
- Follow-up completion does not update all stale contact state immediately.
- Mobile and desktop each maintain their own session logic instead of sharing a session abstraction.

## Recommended Direction

Keep TanStack Query. Add:

- A shared refresh-aware API client wrapper.
- Central query key helpers.
- Workspace-switch invalidation policy if workspace switching is added.
- Browser E2E tests for auth expiry and mutation refresh flows.
