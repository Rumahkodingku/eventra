# 02 — Feature Specification

**Status:** FINAL — approved documentation baseline v1.1

## Priority definitions

- **P0 — Must have:** Required for a credible end-to-end showcase.
- **P1 — Should have:** Important for completeness and quality.
- **P2 — Could have:** Enhancement after core journeys are stable.

## A. Public and customer application

### A1. Global shell and navigation

- Responsive header with brand, primary navigation, search entry, language switcher, theme switcher (P1), wishlist/cart indicators and account menu. [P0]
- Mobile navigation drawer or bottom-friendly menu. [P0]
- Footer with company links, help, legal links and social links. [P1]
- Breadcrumbs on nested pages. [P1]
- Toasts, dialogs, drawers and confirmation patterns. [P0]

### A2. Homepage and discovery

- Hero/featured campaign with clear CTA. [P0]
- Search input with autocomplete suggestions and recent searches. [P0]
- Browse by event category. [P0]
- Featured, trending, upcoming and recommended event collections. [P0]
- Location-based collection using a manually selected city; do not request precise location by default. [P1]
- Limited availability and early-bird campaign labels driven by seed data. [P1]
- Recently viewed events. [P1]
- Newsletter UI with local success state only. [P2]

### A3. Event listing and search

- Keyword search over event title, venue, city, organizer and category. [P0]
- Filters: category, date range, city, price range, event type and ticket availability. [P0]
- Sorting: recommended, soonest, newest, price low-high, price high-low, popularity. [P0]
- Grid/list presentation. [P1]
- Active filter chips, clear-all, result count and URL query synchronization. [P1]
- Pagination or load-more behavior. [P1]
- Empty, no-results and error states. [P0]

### A4. Category pages

- Category overview and description. [P1]
- Category-specific hero and event list. [P1]
- Subcategory chips and relevant filters. [P1]

### A5. Event detail

- Cover image, title, category, organizer and event status. [P0]
- Date, time, venue, city and location preview. [P0]
- Description, highlights, schedule/lineup/participants and organizer profile. [P0]
- Ticket types, prices, benefits, sales window and availability. [P0]
- Ticketing mode indicator and relevant selection experience. [P0]
- Terms and conditions, age/accessibility notes where relevant. [P1]
- Wishlist, share and copy-link actions. [P1]
- Related events. [P1]
- Sticky booking summary on desktop; mobile sticky CTA where appropriate. [P1]

### A6. Ticket selection

- Support `GENERAL_ADMISSION`, `RESERVED_SEATING` and `HYBRID` event modes. [P0]
- Ticket tier cards with price, benefit, quota status and sale period. [P0]
- Quantity controls with min/max constraints. [P0]
- Interactive seat map for reserved seating. [P0]
- Seat states: available, selected, unavailable, restricted/view-only. [P0]
- Section/zone selection and accessible-seat indicator. [P1]
- Selection summary and live price calculation. [P0]
- Local reservation countdown as a visual simulation only. [P1]
- Prevent duplicate seat selection in the current browser session. [P0]

### A7. Cart

- View selected event/ticket/seat details. [P0]
- Update quantities and remove items. [P0]
- Show subtotal, service fee, discount and total transparently. [P0]
- Apply valid/invalid demo promo codes. [P1]
- Validate sale window and local stock assumptions. [P0]
- Persist cart locally. [P0]
- Handle empty cart and expired/invalid selection states. [P0]

### A8. Checkout

- Guest checkout and signed-in checkout. [P0]
- Buyer contact details and attendee details. [P0]
- Option to use buyer details for attendee details where suitable. [P1]
- Field validation and clear error messages. [P0]
- Order summary with itemized fee and discount. [P0]
- Demo payment choices: bank transfer, e-wallet, QRIS and card. [P0]
- Explicit “simulation only” notice before completing payment. [P0]
- Terms acceptance. [P0]
- Simulated processing and success/failure result states. [P0]
- Do not collect real card numbers, bank credentials, OTP or sensitive payment data. [P0]

### A9. Confirmation and digital tickets

- Order reference, status and event summary. [P0]
- Generate local ticket records after simulated successful payment. [P0]
- QR code containing a non-sensitive demo ticket identifier only. [P0]
- Ticket download/print layout. [P1]
- Add-to-calendar file/link simulation. [P2]
- Share ticket details without exposing personal information. [P1]
- Failed/cancelled simulation state with retry path. [P1]

### A10. My tickets and order history

- Upcoming, past and cancelled/expired ticket tabs. [P0]
- Ticket detail with QR, seat, attendee and event details. [P0]
- Order history and order detail. [P1]
- Download/print ticket. [P1]
- Search and filter tickets. [P1]
- Clear empty state for guests and new accounts. [P0]

### A11. Wishlist and recently viewed

- Add/remove event from wishlist. [P0]
- Persist wishlist locally for guest and demo user. [P0]
- Recently viewed list. [P1]
- Empty state and browse CTA. [P0]

### A12. Account and authentication

- Guest mode available from first visit. [P0]
- Demo login for customer and organizer. [P0]
- Registration UI with validation and local demo account creation. [P1]
- Logout and role-aware navigation. [P0]
- Profile view/edit, avatar preview and preferences. [P1]
- Password-change UI only; do not imply secure password storage. [P2]
- Demo authentication must display a clear demo/non-production notice. [P0]

### A13. Notifications

- Notification center and unread count. [P1]
- Demo notifications for order, ticket and event updates. [P1]
- Mark one/all as read. [P1]
- Notification preferences UI. [P2]

### A14. Reviews

- Event rating and written review UI. [P2]
- Review list, average score and sort/filter. [P2]
- Demo eligibility check based on locally stored ticket. [P2]

## B. Organizer application

### B1. Organizer shell

- Dedicated sidebar/topbar, responsive collapse and role-aware access. [P0]
- Organizer profile and navigation. [P0]

### B2. Overview dashboard

- KPI cards: gross simulated sales, tickets sold, active events, attendees. [P0]
- Sales trend chart and ticket-category breakdown. [P0]
- Recent orders and upcoming events. [P0]
- Date-range selector with deterministic mock data. [P1]

### B3. Event management

- List, search, filter and sort organizer events. [P0]
- Create/edit event form with validation. [P0]
- Upload image preview (local only). [P0]
- Draft, published, paused and ended statuses. [P0]
- Delete with confirmation. [P0]
- Event preview. [P1]

### B4. Ticket management

- Create/edit/delete ticket tiers. [P0]
- Set ticket type, price, quota, sale period and benefits. [P0]
- Configure event ticketing mode. [P0]
- Configure seat sections and sample seat inventory for reserved events. [P1]
- Validation for overlapping sales windows and invalid quotas. [P1]

### B5. Orders

- Order table with search, filters and status. [P0]
- Order detail and buyer/attendee summary. [P0]
- Simulated payment status. [P0]
- CSV export. [P1]

### B6. Attendees and check-in

- Attendee table and detail. [P0]
- Check-in status and timestamp. [P0]
- Simulated QR lookup/check-in interaction. [P1]
- Check-in history and attendance summary. [P1]

### B7. Analytics and reports

- Sales/revenue trend. [P0]
- Ticket sales by tier. [P0]
- Event performance comparison. [P1]
- Attendance/check-in rate. [P1]
- Export CSV. [P1]
- Clear indication that all figures are demo data. [P0]

### B8. Organizer settings

- Organizer profile and contact fields. [P1]
- Branding/social links. [P2]
- Notification preferences. [P2]
- Demo payout settings with masked sample data only; no real bank data. [P2]

## C. Cross-cutting requirements

- Bilingual Indonesian/English content. [P0]
- Responsive layouts. [P0]
- Accessible focus, keyboard navigation, labels and contrast. [P0]
- Consistent loading, empty, error, success and disabled states. [P0]
- Currency display in IDR for Indonesian locale and suitable formatting for English locale. [P0]
- Date/time display based on event timezone; avoid ambiguous date formats. [P0]
- Theme switcher. [P1]
- Reduced-motion support. [P0]
- Reset demo data control. [P1]

## Functional constraints

- No network call is required for core functionality.
- Browser localStorage is the persistence layer for this showcase.
- Mock services must simulate asynchronous latency where it improves realism.
- Simulated payment must never be described as a real transaction.
- Organizer changes affect only local demo data.

## D. Detailed business rules and feature behavior

### D1. Event lifecycle

- `DRAFT`: organizer-only preview; not shown in public discovery.
- `PUBLISHED`: visible to customers when event dates and ticket sales permit.
- `PAUSED`: public page may remain visible, but purchase is disabled with an explanation.
- `ENDED`: event has ended; purchase is disabled and tickets move to past-event views.
- `CANCELLED`: prominently show cancellation status; no new purchase is allowed.
- Event publication requires title, category, event date/time/timezone, venue, cover image, description, ticketing mode and at least one valid ticket option.

### D2. Ticket lifecycle and availability

- Ticket sales must respect configured sales start/end timestamps.
- `SOLD_OUT` is derived when available quota reaches zero; it should not be manually contradicted by a positive remaining count.
- Quantity selection must respect per-order minimum/maximum and local remaining quota.
- General admission quantity and reserved seats cannot be double-counted.
- Cart prices use a price snapshot so later organizer edits do not silently change an existing cart item.
- The frontend may show local availability but must label it as demo inventory.

### D3. Reserved seating rules

- A seat belongs to exactly one venue section, row and seat number.
- Seat IDs are stable within a venue layout.
- A seat can be selected only when its local status is `AVAILABLE`.
- A selected seat cannot be selected twice in the same cart/session.
- Each reserved seat maps to one ticket price tier.
- Accessible seats must be labeled and remain discoverable through a list alternative.
- Section, row and seat identifiers must appear in cart, order and digital ticket.
- Seat selection is illustrative; it is not a real reservation or inventory lock.

### D4. Hybrid ticketing rules

- A hybrid event contains at least one general-admission tier and one reserved-seating section/tier.
- Customer must choose the ticketing path for each cart line.
- Cart supports mixed line items from the same or different events.
- Price calculation must preserve the correct price source for every line item.
- UI must make it clear which tickets have assigned seats and which do not.

### D5. Cart, promotion and fee rules

- Cart can contain tickets for multiple events unless an event-specific checkout constraint is later introduced.
- Each line item stores event ID, ticket type ID, quantity, selected seat IDs, unit price snapshot and attendee mapping.
- Promo validation checks code, active window, minimum spend, eligible event/category and usage cap using deterministic mock rules.
- Service fee calculation is centralized and itemized.
- Discount cannot reduce total below zero.
- Removing a line item recalculates subtotal, fee and discount.
- Expired sales windows or invalid seat states must be surfaced before checkout.

### D6. Checkout and order states

- Order states: `PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `PAYMENT_FAILED`.
- Payment states: `UNPAID`, `PROCESSING`, `PAID`, `FAILED`, `CANCELLED`.
- Ticket states: `VALID`, `USED`, `CANCELLED`, `EXPIRED`.
- Only a simulated successful payment creates valid digital tickets.
- Failed/cancelled payment creates no valid ticket and offers a retry/recovery route.
- A completed checkout stores a snapshot of buyer, attendee, ticket name, price, event and seat details.
- Never store card number, CVV, bank password, OTP or other real payment credentials.

### D7. Digital ticket and check-in

- Issue one ticket record per attendee/seat unit.
- Each ticket has a unique demo ticket code.
- QR payload contains only the demo ticket code or opaque non-sensitive identifier.
- Check-in changes ticket state from `VALID` to `USED` and stores a local timestamp.
- Repeated check-in must return an already-used state, not silently create another check-in.
- This QR/check-in flow is a UI simulation and cannot validate tickets outside this browser dataset.

### D8. Demo account and role behavior

- Guest can browse, wishlist, cart and checkout.
- Customer demo can access profile, orders, tickets and notifications.
- Organizer demo can access organizer tools.
- Registration creates a local demo user only.
- Role-aware navigation and route guards improve UX but do not provide security.
- Reset demo data returns seed content and demo accounts to their initial state.

### D9. Localization and formatting

- Translation coverage includes content chrome, controls, form labels, validation, empty/error/success messages, status labels, tooltips and accessibility names.
- Event time is displayed in the event's configured timezone, with timezone abbreviation or city context.
- Use `id-ID` and `en` locale formatting; keep currency as IDR for this Indonesian showcase unless an event explicitly defines another currency.
- Do not concatenate translated sentence fragments.

### D10. Feature completion rule

Every P0 feature must have a visible entry point, a working interaction, persistence behavior where specified, all relevant UI states, bilingual copy, responsive behavior and at least one acceptance test. P1/P2 items may be staged by roadmap phase but must remain explicitly listed.
