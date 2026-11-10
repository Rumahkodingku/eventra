# 09 — Implementation Roadmap

**Status:** Proposed baseline v1.0

## Phase 0 — Baseline

Capture current frontend build/typecheck/lint/unit/E2E, commit, routes, env and risks. Approve ADRs/data model.

**Exit:** reproducible frontend baseline and no high-impact architecture ambiguity.

## Phase 1 — Monorepo

Move current app into `apps/web`; root npm workspaces + Turbo; update configs/scripts/CI; preserve behavior.

**Exit:** same routes and tests pass from clean checkout; no product refactor.

## Phase 2 — API foundation

Pinned Go; Gin; config/logging/request ID/graceful shutdown; MySQL/Redis; health; Docker Compose; golang-migrate.

**Exit:** API starts cleanly; DB bootstrap and integration tests pass; no committed secrets.

## Phase 3 — Contract

OpenAPI 3.1, lint, generated TS client, compatibility checks.

**Exit:** generated client compiles and breaking changes are detected.

## Phase 4 — Identity and authorization

Login/register/logout/refresh, cookie/CSRF, rotation/revocation, RBAC, organization ownership, guest principal.

**Exit:** cross-tenant tests deny access; guest isolation; revocation works.

## Phase 5 — Catalog and organizer events

Categories, public discovery, event detail, venue, organizer CRUD/publish, image upload, cache.

**Exit:** ownership enforced and cache invalidation tested.

## Phase 6 — Ticketing inventory

GA quota, seat map, reserved reservation, hybrid support and expiry worker.

**Exit:** concurrency tests prove no oversell/duplicate seat; expiry releases once.

## Phase 7 — Checkout/payment

Server quote, promo, idempotent order, payment adapter/mock provider, verified webhook.

**Exit:** client cannot alter price; duplicate request/webhook does not duplicate order/fulfillment.

## Phase 8 — Ticket/check-in

Ticket issuance, opaque QR, wallet, attendee list, check-in.

**Exit:** correct ticket count; no PII in QR; concurrent duplicate check-in has one success.

## Phase 9 — Engagement/analytics

Notifications, email adapter if selected, reviews, analytics and export.

**Exit:** retries safe, analytics derived from persisted data, export authorized.

## Phase 10 — Production hardening

Security review, dependency/container scan, load/concurrency tests, observability, backup/restore, runbooks, staging and rollback rehearsal.

**Exit:** P0 security/transaction tests pass; restore verified; alerts tested; no unaccepted critical/high vulnerability.

## Definition of done per vertical slice

OpenAPI updated; authorization and domain invariants tested; migration upgrade tested; handler/repository integration tests pass; frontend adapter and error/loading states implemented; E2E passes; logs/metrics support diagnosis; docs updated.

## Release gate

Do not claim production-ready until security review, no-oversell concurrency proof, webhook idempotency, tenant isolation, backup restore, monitoring, rollback and production smoke tests are all verified.
