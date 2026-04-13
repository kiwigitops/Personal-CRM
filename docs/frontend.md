# Frontend

## Web App

The web app lives in `personal-crm-clients/apps/web`.

Confirmed pages:

- `/` landing page
- `/auth/sign-in`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/dashboard`
- `/contacts`
- `/contacts/[contactId]`
- `/followups`
- `/workspace`

Key components:

- `AuthProvider`: stores session in local storage and creates the API client.
- `RequireAuth`: redirects to sign-in when no access token exists.
- `AppShell`: desktop/mobile navigation, theme toggle, sign-out, command palette.
- `GlobalCommandPalette`: searches contacts, companies, notes, follow-ups.

## State And Data

The web app uses TanStack Query. Query keys are simple and local to pages. Mutations invalidate related keys after success.

Important gap: there is no automatic refresh-token flow. Any `401` triggers `onUnauthorized`, which clears the browser session.

## Mobile App

The Expo app lives in `personal-crm-clients/apps/mobile/App.tsx`. It supports sign-in, session persistence through Expo SecureStore, dashboard, contacts, follow-ups, and profile/sign-out. It is a thin shell and does not expose the full web feature set.

## Desktop App

The Tauri app lives in `personal-crm-clients/apps/desktop-linux`. It supports sign-in, API URL settings, dashboard, contacts, and sign-out. In Tauri it stores secrets through the Linux keyring. In browser fallback mode it uses local storage.

## UI Package

`personal-crm-clients/packages/ui` exports small primitives: avatar, badge, button, card, empty state, input, stat card, textarea, icons, theme tokens, and CSS variables.

## Known UX Gaps

- Reset password has a request page but no reset-token entry page.
- Invite acceptance has an API route but no web UI.
- Notifications API is not surfaced in the web UI.
- Company search results link to `/companies/:id`, but no company page exists.
- Member role editing and workspace rename are not exposed in the web UI.
