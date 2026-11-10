# 10 — Data Model and Mock Data

**Status:** FINAL — approved documentation baseline v1.1

## 1. Core entities

### Event

- `id`
- `slug`
- `title`
- `categoryId`
- `subcategoryId?`
- `description`
- `coverImage`
- `gallery[]`
- `organizerId`
- `status`: DRAFT | PUBLISHED | PAUSED | ENDED | CANCELLED
- `ticketingMode`: GENERAL_ADMISSION | RESERVED_SEATING | HYBRID
- `startAt`
- `endAt`
- `timezone`
- `venueId`
- `tags[]`
- `highlights[]`
- `schedule[]`
- `terms[]`
- `createdAt`
- `updatedAt`

### Category

- `id`, `slug`, `name`, `description`, `image`, `icon`, `subcategories[]`

Suggested categories: Concert & Music, Sports, Festival, Conference & Seminar, Entertainment, Exhibition, Arts & Culture, Community.

### Venue

- `id`, `name`, `address`, `city`, `region`, `country`, `timezone`, `mapUrl?`, `layoutId?`

### TicketType

- `id`
- `eventId`
- `name`
- `description`
- `price`
- `currency`
- `quota`
- `soldCount`
- `minPerOrder`
- `maxPerOrder`
- `salesStartAt`
- `salesEndAt`
- `benefits[]`
- `status`
- `kind`: GENERAL_ADMISSION | SEATED

### VenueLayout / Seat

- `layoutId`, `sections[]`
- Section: `id`, `name`, `label`, `priceTierId`, `rows[]`
- Seat: `id`, `row`, `number`, `status`, `accessible?`
- Seat status: AVAILABLE | SELECTED | SOLD | BLOCKED
- `SELECTED` is client session state; do not persist it as authoritative inventory.

### User

- `id`, `name`, `email`, `phone?`, `avatar?`
- `role`: CUSTOMER | ORGANIZER
- `locale`
- `createdAt`
- Demo-only profile data; no real credentials.

### Organizer

- `id`, `displayName`, `description`, `logo`, `email`, `socialLinks[]`

### CartItem

- `id`, `eventId`, `ticketTypeId`, `quantity`, `seatIds[]`, `unitPriceSnapshot`, `addedAt`

### Order

- `id`, `orderNumber`, `userId?`, `buyer`, `items[]`
- `subtotal`, `serviceFee`, `discount`, `total`, `currency`
- `paymentMethod`, `paymentStatus`
- `orderStatus`
- `createdAt`, `paidAt?`
- Payment status: PENDING | PAID | FAILED | CANCELLED
- Order status: PENDING | CONFIRMED | CANCELLED

### Ticket

- `id`, `ticketCode`, `orderId`, `eventId`, `ticketTypeId`
- `attendee`, `seatId?`, `status`, `issuedAt`, `checkedInAt?`
- Status: VALID | USED | CANCELLED | EXPIRED

### WishlistItem

- `id`, `eventId`, `createdAt`

### Notification

- `id`, `type`, `title`, `message`, `readAt?`, `createdAt`, `targetUrl?`

### Review

- `id`, `eventId`, `userId`, `rating`, `comment`, `createdAt`

## 2. Relationships

- Category has many Events.
- Organizer has many Events.
- Event belongs to one Venue and one Category.
- Event has many TicketTypes.
- Event may reference one VenueLayout.
- Order has many OrderItems (model as embedded array in the frontend baseline).
- OrderItem references one Event and one TicketType and may contain multiple seat IDs.
- Order has many Tickets.
- Ticket references one attendee and optionally one Seat.
- User has many Orders, WishlistItems, Notifications and Reviews.

## 3. Data calculation rules

- `subtotal = sum(unitPriceSnapshot × quantity)`; for reserved seating, calculate from selected seat/tier mapping.
- `serviceFee` must be a deterministic configured rule (for example, fixed fee or percentage); show it before payment.
- `discount` comes from a validated demo promo rule.
- `total = subtotal + serviceFee - discount`.
- Never calculate final price independently in multiple UI components. Use one domain utility.
- Store monetary values as integer minor units or integer IDR values; do not use floating-point for currency arithmetic.

## 4. Seed data recommendation

Provide at least:

- 8 categories.
- 20–30 events across categories and cities.
- 2–3 organizer profiles.
- 3–5 ticket types for selected events.
- At least 2 general admission events.
- At least 2 reserved seating events.
- At least 2 hybrid events.
- 1–2 venue seat-map templates with varied sections.
- 2 demo users: customer and organizer.
- Example orders, tickets, notifications and reviews.

Use plausible fictional event names and clearly fictional demo organizer data. Avoid presenting actual event availability as current.

## 5. Demo account convention

Display demo credentials in the login UI or project README. Use non-sensitive fixed demo values, for example:

- Customer: `customer@demo.local`
- Organizer: `organizer@demo.local`
- Demo password: `demo12345`

These credentials are only for local showcase access and must never be reused in production.

## 6. Browser persistence

- Use namespaced keys such as `rk-ticketing:cart:v1`.
- Include a schema version.
- Handle missing, malformed or outdated values.
- Provide “Reset demo data”.
- Do not persist sensitive payment information.
- Avoid storing real personal data.

## 7. Mock service behavior

- Simulate small asynchronous delays for loading states.
- Return deterministic results for repeatable testing.
- Simulate payment success/failure using an explicit test control or deterministic demo scenario, not random failure.
- Simulate sold-out, invalid promo and invalid seat states.
- Keep seed data immutable; local organizer changes should be stored as overlays or copied records.

## 8. Additional model details

### OrderItem

Use an explicit `OrderItem` shape even if embedded in the frontend Order record:

- `id`, `orderId`, `eventId`, `ticketTypeId`, `ticketNameSnapshot`
- `quantity`, `seatIds[]`, `unitPriceSnapshot`, `lineSubtotal`
- `attendeeIds[]` or attendee assignment records
- `eventTitleSnapshot`, `eventStartAtSnapshot`, `venueNameSnapshot`

### Attendee

- `id`, `orderId`, `ticketId`, `fullName`, `email`
- `phone?`, `checkInStatus`, `checkedInAt?`
Only collect fields needed by the demo purchase flow.

### PromoCode

- `id`, `code`, `type` (FIXED | PERCENTAGE), `value`
- `startsAt`, `endsAt`, `minimumSpend?`, `maxDiscount?`
- `eligibleEventIds[]?`, `eligibleCategoryIds[]?`, `usageLimit?`, `isActive`

### Review eligibility

A review is permitted in the demo only when a local valid/used ticket for the event is associated with the demo customer. State this as a UI rule, not a secure entitlement.

## 9. Enumerations and invariants

- Event status: `DRAFT | PUBLISHED | PAUSED | ENDED | CANCELLED`.
- Ticketing mode: `GENERAL_ADMISSION | RESERVED_SEATING | HYBRID`.
- Order status: `PENDING_PAYMENT | CONFIRMED | PAYMENT_FAILED | CANCELLED`.
- Payment status: `UNPAID | PROCESSING | PAID | FAILED | CANCELLED`.
- Ticket status: `VALID | USED | CANCELLED | EXPIRED`.
- Seat status: `AVAILABLE | SELECTED | SOLD | BLOCKED`; `SELECTED` is transient client state.
- Quantity must be a positive integer within configured limits.
- Price, fee, discount and totals are non-negative integer IDR values.
- Each ticket has a unique demo ticket code.
- A reserved seat may belong to no more than one valid ticket in the local seed state.

## 10. Seed data content requirements

Include a balanced mix of concert, sports, festival, conference/seminar, entertainment, exhibition, arts/culture and community events. Include city and timezone metadata, varied sale windows, at least one sold-out example, one paused/cancelled example, and representative valid/invalid promo codes. Use fictional organizer names and clearly illustrative event information.
