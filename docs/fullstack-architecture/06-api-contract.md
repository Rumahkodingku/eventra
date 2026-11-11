# 06 — API Contract

**Status:** Proposed baseline v1.0

## Contract-first

OpenAPI 3.1 is canonical. Store source in `apps/api/openapi/`. CI lints/validates it, checks breaking changes and generates TypeScript client in `packages/api-client`. Never hand-edit generated client/types.

## Conventions

- Base `/api/v1`; JSON UTF-8; plural resource names.
- Opaque IDs; ISO 8601 UTC timestamps; event timezone separate.
- Money is integer amount + currency.
- Explicit filters/sort allowlists; cursor pagination for high-volume lists.
- Stable error codes and request IDs.
- `Idempotency-Key` on side-effecting retryable operations.
- Client totals never authoritative.

## Endpoint inventory (planning baseline)

Health: `GET /health/live`, `/health/ready`.

Auth: `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/logout-all`; `GET /auth/me`; future email verification/password recovery.

Public: `GET /categories`, `/events`, `/events/{slug}`, `/events/{eventId}/ticket-types`, `/venues/{venueId}`.

Organizer: `GET /organizer/dashboard`, `/organizer/events`; `POST /organizer/events`; `GET/PATCH /organizer/events/{eventId}`; action endpoints `/publish`, `/pause`, `/cancel`; ticket-type management; organizer orders, attendees and analytics.

Cart/checkout: `GET /cart`; `PUT/PATCH/DELETE /cart/items`; `POST /checkout/quote`, `/checkout/reservations`, `/checkout/orders`; `GET /checkout/reservations/{id}`.

Orders/payments: `GET /orders`, `/orders/{id}`, `/orders/{id}/tickets`; payment retry where supported; `POST /webhooks/payments/{provider}`.

Tickets/check-in: `GET /tickets`, `/tickets/{id}`; organizer event check-in create/list.

Account: profile, wishlist, notifications, reviews.

Guest wishlist is local-only in the browser. It is temporary and is not merged into the server wishlist on login; only an authenticated user's `/account/wishlist` is persisted.

Final schemas, permission requirements, status codes and examples must be specified in OpenAPI before endpoint implementation.

## Error envelope

```json
{
  "error": {
    "code": "INVENTORY_CONFLICT",
    "message": "One or more selected items are no longer available.",
    "request_id": "req_..."
  }
}
```

Do not leak stack traces, SQL, paths or provider secrets.

## Auth transport and versioning

Browser requests use cookies and `credentials: include`. No JWT in URLs/localStorage. Cross-origin deployment requires explicit credentialed CORS, exact origin allowlist, cookie attributes and CSRF. Additive changes stay in v1; breaking changes require migration plan/versioning. Deprecate before removal.

## Abuse controls

Rate-limit login, registration, password reset, guest claim, promo validation, reservation, checkout and check-in. Return 429 with safe retry guidance.
