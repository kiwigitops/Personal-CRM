# Authentication And Authorization

## Session Model

Signup and signin return:

- `accessToken`
- `refreshToken`
- `user` with memberships and `currentWorkspaceId`

Access tokens are JWTs signed with `JWT_ACCESS_SECRET` and include `userId` and `type: "access"`. Refresh tokens are JWTs signed with `JWT_REFRESH_SECRET`, include `userId`, `sessionId`, and `type: "refresh"`, and are stored hashed in `Session.refreshTokenHash`.

## Authorization

Protected routes call `app.authorize()`. The auth plugin:

1. Reads `Authorization` and `X-Workspace-Id`.
2. Verifies the access token.
3. Looks for a non-deleted membership for `userId` and workspace.
4. Sets `request.auth`.
5. Optionally checks required roles.

Roles:

- `OWNER`
- `ADMIN`
- `MEMBER`

## Password Reset

`/auth/forgot-password` creates a random reset token, stores a bcrypt hash, and sends the raw token by email. `/auth/reset-password` verifies the token, updates password hash, marks the token used, and revokes sessions.

The web app has a forgot-password request page but no reset-token completion page.

## Known Security Gaps

- Browser tokens are stored in local storage.
- Refresh tokens are not rotated.
- Web client does not call `/auth/refresh`.
- Auth routes use only the global rate limit.
- JWT payloads are cast, not schema-validated after verification.
- JWT issuer/audience/algorithm options are not pinned.
- Demo credentials are seeded automatically by the API image.

See [Security](security.md) and [Known Issues](known-issues.md).
