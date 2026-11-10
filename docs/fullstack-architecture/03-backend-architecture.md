# 03 — Backend Architecture

**Status:** Proposed baseline v1.0

## Stack

Go latest stable (pin exact version), Gin, GORM, MySQL/InnoDB, Redis, golang-migrate, OpenAPI 3.1, structured JSON logging, standard Go tests and integration tests against real MySQL/Redis containers.

## Modular monolith

One API binary and deployment unit, internally divided by domain:

- `identity`, `authorization`, `organization`
- `event`, `venue`, `ticket`, `inventory`
- `cart`, `promotion`, `order`, `payment`
- `attendee`, `checkin`, `notification`, `review`, `analytics`

Suggested Go layout:

```text
apps/api/
  cmd/api/main.go
  internal/
    app/                 # dependency wiring
    platform/
      config/ database/ cache/ httpserver/ logger/ security/ storage/
    modules/
      identity/{domain,application,infrastructure,transport/http}/
      event/{domain,application,infrastructure,transport/http}/
      ...
  migrations/
  openapi/
  go.mod
```

Use layers where they clarify ownership; do not create empty abstractions mechanically.

## Dependency direction

HTTP handler → application use case → domain. Application depends on repository/provider interfaces. Infrastructure implements those interfaces. Domain must not import Gin, GORM, Redis or provider SDKs. HTTP DTOs must not be GORM models.

## Transaction boundaries

Use case owns transaction scope through a transaction manager/unit of work. Checkout:

1. Validate principal, request and idempotency key.
2. Recalculate prices from DB.
3. Lock/check inventory.
4. Create reservation and pending order.
5. Snapshot prices/fees/discount.
6. Commit.
7. Initiate payment outside DB transaction.
8. Process verified webhook in a new idempotent transaction.
9. Confirm order and issue tickets exactly once.

Never hold DB locks during provider calls.

## HTTP conventions

- `/api/v1`, JSON, request validation and payload limits.
- Request/correlation ID on every request.
- Timeouts and graceful shutdown.
- Exact CORS allowlist; no wildcard with credentials.
- Rate limits on auth, guest claim, checkout and check-in.
- Separate liveness and readiness endpoints.
- Stable error envelope with machine code and request ID; never expose SQL/stack traces.

## GORM conventions

Explicit table names/indexes; context on every query; inspect critical locking SQL; no direct serialization of ORM models; integer money; UTC timestamps. Do not use AutoMigrate in production.

## Background jobs

Introduce worker command only when needed for expiry, email or reconciliation. Jobs must be retryable/idempotent. Use DB outbox for durable event publication; Redis Pub/Sub alone is not durable.

## Testing

Unit domain tests; handler tests via `httptest`; repository integration tests on MySQL; Redis TTL/invalidation tests; parallel purchase tests; OpenAPI lint/client compile; browser E2E.
