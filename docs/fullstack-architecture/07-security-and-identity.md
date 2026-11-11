# 07 — Security and Identity

**Status:** Proposed baseline v1.0

## JWT cookies

- Short-lived access JWT in HttpOnly cookie.
- Rotating refresh token in HttpOnly cookie; store only token hash/server-side session.
- `Secure` on HTTPS; `HttpOnly`; `SameSite=Lax` where same-site topology supports it; narrow domain/path.
- Rotate refresh token on use; detect reuse and revoke token family/session.
- Support current-session and all-session logout.
- Minimal claims: subject, session ID, issuer, audience, issued/expiry. Do not rely on stale role claims as sole authorization.
- Never log tokens.

## CSRF/CORS/browser

Cookie auth requires CSRF defense (synchronizer or reviewed double-submit pattern), Origin validation for mutations, SameSite defense-in-depth and exact CORS allowlist. Never use wildcard origin with credentials. Add HSTS, nosniff, frame restrictions, referrer policy and suitable CSP.

## Credentials

Use Argon2id or reviewed bcrypt cost. Rate-limit login/recovery. Avoid account enumeration. Password reset tokens are one-time, short-lived and stored hashed. Verify email where needed. Never log credentials.

## RBAC and tenant isolation

Roles may include `platform_admin`, `customer`, `organizer_owner`, `organizer_admin`, `organizer_staff`, `checkin_staff`. Permissions are action-based (`event:publish`, `order:read`, `checkin:write`, etc.). Authorization = principal + permission + organization membership + resource scope. Every organizer query/mutation must be scoped; guessing an event ID must not expose another organizer's data.

## Guest

High-entropy secret, hash at rest, secure HttpOnly transport, principal-scoped order access, non-enumerable recovery, rate limits. Email alone is not authorization. Account linking requires proof of guest access and account ownership.

## Payment

Verify webhook signature, provider account, merchant reference, amount, currency and expected state. Deduplicate provider event IDs. Handle duplicate/out-of-order callbacks safely. Frontend redirect never confirms payment. Use hosted/tokenized provider flows; do not collect raw card/CVV/bank credentials/OTP.

## Uploads

Allowlist type and extension; inspect actual content; size/dimension limits; server-generated object keys; private bucket/presigned URLs; scan where feasible; strip metadata when appropriate; sanitize SVG or disallow it.

## Audit and privacy

Audit role changes, organizer actions, price/quota changes, order/payment transitions, guest claims and check-in. Redact PII/secrets. Define retention/deletion policy and encrypt traffic/backups. Dependency/container scanning and incident response are release requirements.
