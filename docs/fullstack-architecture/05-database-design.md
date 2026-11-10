# 05 — Database Design

**Status:** Proposed baseline v1.0

## Principles

MySQL InnoDB; normalized transactional entities; JSON only for bounded flexible metadata; UTC timestamps; integer money; foreign keys and unique constraints for invariants. Index from actual query patterns. No production AutoMigrate.

## Table groups

- Identity/access: `users`, `user_credentials`, `sessions`, `refresh_tokens`, `roles`, `permissions`, `role_permissions`, `user_roles`, `organizations`, `organization_members`.
- Catalog: `categories`, `venues`, `venue_layouts`, `venue_sections`, `venue_rows`, `seats`, `events`, `event_tags`, `ticket_types`.
- Inventory/commerce: `inventory_buckets`, `inventory_reservations`, `seat_reservations`, `carts`, `cart_items`, `promotions`, `promotion_redemptions`, `orders`, `order_items`, `attendees`.
- Payment/fulfillment: `payments`, `payment_events`, `tickets`, `ticket_checkins`, `guest_principals`, `guest_order_access`, `notifications`, `reviews`.
- Platform: `idempotency_records`, `audit_logs`, `outbox_events`.

## Critical constraints

- `users.email_normalized` unique.
- `events` indexed by `(status, starts_at)` and `(organization_id, status)`.
- `ticket_types` indexed by `(event_id, status)`.
- `inventory_buckets` unique per ticket type; invariant `reserved + sold <= capacity`.
- Reservations indexed by `(status, expires_at)` and principal.
- MySQL has no general partial unique index: design active seat claim uniqueness using transactional locking/current-claim rows or another explicit MySQL-compatible approach. Do not assume partial indexes.
- `orders.order_number` unique; owner is registered user OR guest principal under agreed policy.
- `order_items` store immutable price/name snapshots and explicit seat relations (no comma-separated IDs).
- `payments` unique provider reference; `payment_events` deduplicate provider event ID.
- `tickets.ticket_code` and QR token hash unique.

## Query indexes

Event discovery by status/date/category/city; organizer list by organization/status; order lookup by owner/date; organizer orders by event/status; tickets by owner/event/status; check-in by token hash/event; expiry sweeper by status/expiry; idempotency by principal/key.

## Migration policy

Use golang-migrate versioned `.up.sql` and `.down.sql`. Applied migrations are immutable. Correct through new migration. Test empty bootstrap and upgrade path. Destructive changes/data backfills reviewed separately. Run migrations as controlled release step, not from every API replica. Back up before production schema changes. Do not use GORM AutoMigrate in production.

## Data and privacy

Define retention for sessions, payment events, audit logs, guest access and notifications. Minimize PII; redact logs. Do not store card numbers, CVV, bank passwords or OTP.
