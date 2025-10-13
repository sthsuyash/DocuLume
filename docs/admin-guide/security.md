# Admin Security Guide

Security controls and operational hardening for platform operators.

## Access Controls

- Only users with `is_superuser=true` can access admin endpoints.
- Admin role changes are audit-logged and require superuser privileges.
- Enforce least privilege for service accounts and API keys.

## Authentication and Session Controls

- JWT tokens are issued as httpOnly, SameSite=Lax cookies — not accessible to JavaScript.
- CSRF token validation is enforced on all state-changing requests.
- Rate limiting is applied on all HTTP endpoints and WebSocket connections.
- Failed login attempts are audit-logged with IP address.

## Document Upload Security

- Magic-byte MIME validation is applied to every upload. The declared file extension must match the file's actual content type. Uploads that fail validation are rejected with 400.
- Allowed types: PDF, plain text, DOCX, Markdown.
- Request size is checked before the body is read — oversized requests receive 413 immediately.

## Security Headers

The following headers are set on all responses:

- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (via nginx in production)

## Audit Logging

All security-relevant events are written to stdout as structured JSON under the `audit` logger:

| Event | Trigger |
|-------|---------|
| `login_success` / `login_failure` | Every login attempt |
| `logout` | Session termination |
| `register` | New account creation |
| `oauth_login` | OAuth sign-in |
| `document_upload` / `document_delete` | Document lifecycle events |
| `admin_role_change` | Superuser changes another user's role |
| `admin_user_delete` | Superuser deletes a user account |
| `admin_document_delete` | Superuser deletes a document |

Each record includes `user_id`, `ip`, `timestamp`, and event-specific fields. Route audit logs to your SIEM or log aggregator.

## Secret Management

- All secrets are loaded from environment variables — never hard-coded.
- Copy `backend/.env.production.example` as the canonical reference for required secrets.
- Generate strong values: `openssl rand -hex 32` for JWT/encryption keys.
- Rotate secrets on a regular schedule and after any suspected exposure.
- Use a secrets manager (Vault, AWS Secrets Manager, etc.) for production.

## Backup Security

- Database backups are stored in the `db_backups` Docker volume.
- Restrict access to the volume host path in production.
- Consider encrypting backup files before off-site transfer.

## Operational Checks

- Verify audit logs are flowing to your log aggregator.
- Confirm Prometheus alert rules are active — see [Monitoring Guide](../guides/MONITORING.md).
- Test backup restore quarterly — see [Database Recovery runbook](../runbooks/database-recovery.md).
- Review Sentry for unhandled errors after every deploy.
