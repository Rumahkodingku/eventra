# 04 — Domain and Business Rules

**Status:** Proposed baseline v1.0

## Modules and entities

Identity: User, Credential, Session, RefreshToken. Authorization: Role, Permission, OrganizationMember. Catalog: Event, Category, Venue, VenueLayout, Section, Row, Seat, TicketType. Commerce: Cart, Promotion, Reservation, Order, OrderItem, Attendee, Payment, PaymentEvent. Fulfillment: Ticket, TicketCheckIn. Platform: GuestPrincipal, IdempotencyRecord, AuditLog, OutboxEvent, Notification, Review.

Use opaque UUID/ULID identifiers consistently; public slug/order number is separate from internal ID.

## Money and pricing

Store integer amounts and ISO currency. Server recalculates every quote. Persist immutable order snapshots (event/ticket name, price, quantity, seat, fees, discount). Never trust client totals. Define fee/discount rounding once in domain logic.

## State machines

Event: `DRAFT → PUBLISHED ↔ PAUSED → ENDED`; cancellation only through permitted policy.
Reservation: `ACTIVE → CONFIRMED | EXPIRED | RELEASED`.
Order: `PENDING_PAYMENT → CONFIRMED | PAYMENT_FAILED | CANCELLED`; refunds are separate explicit states/records when implemented.
Payment: `CREATED → PENDING → SUCCEEDED | FAILED | CANCELLED`; handle duplicate/out-of-order provider events.
Ticket: `VALID → USED | CANCELLED | EXPIRED`; used ticket cannot be checked in twice.

## General Admission

Finite quota per ticket type. Reserve and confirm transactionally. Expiry/release returns capacity exactly once. Enforce min/max quantity and non-negative capacity.

## Reserved Seating

Seat has stable ID and event/session context. Active reservation and confirmed ticket uniqueness enforced by DB locking/constraints. Reservation has expiry. Lock seats in deterministic order. If any seat unavailable, fail whole reservation unless partial selection is explicitly designed. UI selection is advisory only.

## Hybrid

GA and reserved-seat inventory share checkout/order lifecycle but have separate allocation rules. Each order item records its inventory source and seat mapping.

## Checkout and idempotency

Require idempotency key. Same principal/key/request returns original result; same key with different payload conflicts. Reservation/order/promo redemption are transactional. Provider calls occur after commit. Webhook handling checks provider, reference, amount, currency and allowed state transition.

## Guest ownership

Guest can checkout without account. Generate high-entropy random guest secret; store only hash server-side. Email is contact data, not proof of ownership. Secure cookie/claim mechanism scopes order access. Account linking requires proof of both guest order access and account ownership. Rate-limit and prevent enumeration.

## Check-in

QR contains opaque random token, no PII or raw IDs. Store token hash where feasible. Atomic `VALID → USED` transition prevents duplicate entry. Record operator/event/time and audit outcome.

## Audit

Audit role changes, organizer access, event publish/cancel, quota/price changes, checkout/order transitions, payment webhook decisions, refunds, guest claims and check-in. Never log secrets or raw tokens.
