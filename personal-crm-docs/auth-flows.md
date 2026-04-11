# Auth Flows

## Signup

Signup creates:

- User
- Workspace
- Owner membership
- Session
- Access token
- Refresh token

## Signin

Signin verifies the password hash and returns tokens plus workspace memberships.

## Session Model

Access tokens are short-lived JWTs. Refresh tokens are JWTs tied to a `session` row and stored hashed in the database. Signout revokes the session.

## Password Reset

Forgot password creates a hashed reset token and sends the raw token through the mail pipeline. Local development sends mail to MailHog.

## Workspace Roles

Roles are `OWNER`, `ADMIN`, and `MEMBER`. API guards enforce membership and role checks for sensitive routes.

