# 09 — Frontend Architecture

**Status:** FINAL — approved documentation baseline v1.1

## 1. Recommended stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- shadcn/ui (Radix primitives where appropriate)
- Zustand for client-side shared state
- React Hook Form + Zod for forms
- Motion for React for purposeful UI motion
- Recharts for dashboard charts
- Lucide React for icons
- date-fns for date utilities
- QR code package for demo ticket QR
- next-intl or an equivalent structured i18n solution

Use TanStack Query only if the app introduces asynchronous repository calls that benefit from query caching. It is not required for static local seed data.

## 2. Architecture principles

- Separate UI from data access.
- Use feature-based modules.
- Keep domain types independent of components.
- Centralize translations, design tokens and brand config.
- Treat mock services as replaceable adapters.
- Keep browser-only APIs inside client-side utilities/hooks.
- Avoid direct localStorage access during server rendering.
- Use deterministic seed data and a reset mechanism.

## 3. Suggested project structure

```text
src/
  app/
    (public)/
      page.tsx
      events/
      categories/
      search/
      cart/
      checkout/
    (account)/
      tickets/
      orders/
      wishlist/
      notifications/
      profile/
    (auth)/
      login/
      register/
    organizer/
      dashboard/
      events/
      orders/
      attendees/
      analytics/
      settings/
    layout.tsx
    globals.css
  components/
    ui/
    shared/
    layouts/
  features/
    discovery/
    events/
    ticket-selection/
    seat-map/
    cart/
    checkout/
    tickets/
    wishlist/
    account/
    notifications/
    organizer/
    analytics/
  domain/
    event/
    ticket/
    order/
    user/
    organizer/
  data/
    seed/
    factories/
  services/
    repositories/
    mock/
  stores/
  hooks/
  i18n/
    messages/
      id.json
      en.json
  lib/
    currency.ts
    dates.ts
    validation.ts
    storage.ts
    ids.ts
  config/
    brand.ts
    navigation.ts
  types/
```

## 4. Data flow

Page/route → feature component → domain/use-case function → repository interface → mock repository → seed/local persistence.

Components should not import seed JSON directly except in isolated presentation/demo contexts.

## 5. State ownership

### URL state

Search query, filters, sorting, pagination and selected view where shareable.

### Local component state

Open dialogs, current form step, hover state, temporary seat-map viewport.

### Global Zustand state

- Session/demo user.
- Cart.
- Wishlist.
- Recently viewed.
- Notifications.
- Locale/theme preference if not managed by a dedicated provider.

### Persistent browser state

Persist only necessary state: cart, wishlist, demo session, orders, tickets, organizer edits and preferences. Version the storage schema and handle corrupted data safely.

## 6. Domain service boundaries

Define interfaces such as:

- `EventRepository`: list, getBySlug, create, update, delete.
- `TicketRepository`: listByEvent, update local availability.
- `CartRepository`: get, save, clear.
- `OrderRepository`: create, getById, list.
- `TicketWalletRepository`: list, getById.
- `UserRepository`: demo login, register, update profile.
- `OrganizerRepository`: dashboard metrics, event management, attendees.
- `NotificationRepository`: list, markRead.

Implement mock adapters first. A future API adapter should implement the same interfaces.

## 7. Checkout use case

1. Validate cart and event/ticket references.
2. Validate quantities and selected seats against current local state.
3. Validate buyer and attendee fields.
4. Calculate subtotal, service fee, discount and total in one domain utility.
5. Create a local pending order.
6. Run a clearly labeled payment simulation.
7. On success, update order state and create ticket records.
8. Clear purchased cart items.
9. Add local notification.
10. Route to success page.

Do not treat client-side calculations as authoritative for real commerce.

## 8. Seat map model

Represent venue layout as sections containing rows and seats. Seat IDs must be stable. Each seat has section, row, number, price tier and status. Selection state is separate from immutable venue layout. Provide an accessible list alternative for selecting seats.

## 9. Authentication model

Demo auth is a UI simulation only. Use seeded demo users and a local session indicator. Never store real passwords or claim that local role checks secure organizer data. A production backend must re-implement authentication and authorization server-side.

## 10. Performance

- Use optimized image loading and responsive image sizes.
- Lazy-load non-critical sections and heavy dashboard charts.
- Keep seat-map rendering efficient; avoid excessive DOM nodes for very large venues.
- Avoid unnecessary global state subscriptions.
- Use stable keys and memoization only where profiling supports it.
- Provide skeletons for simulated async operations where useful.

## 11. Error handling

- Typed domain errors for not found, invalid selection, sold-out, invalid promo and validation.
- User-friendly localized messages.
- Logging may be console-based for the showcase, but avoid personal data.
- Provide reset-demo-data control for recovery.

## 12. Backend integration readiness

- Keep IDs and timestamps in consistent formats.
- Use repository interfaces.
- Define DTO/domain mapping boundaries.
- Do not couple UI to localStorage structure.
- Document fields that will require server authority: stock, pricing, payment, seat locking, ticket validity and permissions.

## 13. Domain state machines

### Event

`DRAFT → PUBLISHED → PAUSED → PUBLISHED → ENDED`; `CANCELLED` may be entered from a valid pre-completion state. Validate allowed transitions in a domain function.

### Order/payment

`PENDING_PAYMENT → CONFIRMED` on simulated success; `PENDING_PAYMENT → PAYMENT_FAILED` on failure; cancellation is explicit. Payment and order status are related but distinct.

### Ticket

`VALID → USED` on check-in; `VALID → CANCELLED` on cancellation; `VALID → EXPIRED` after event expiry. Used tickets cannot be checked in again.

## 14. Persistence and hydration

- Do not read `window` or localStorage during server component rendering.
- Hydrate persisted Zustand state on the client and avoid rendering misleading defaults before hydration completes.
- Validate persisted payloads with schemas and migrate by version.
- Provide fallback to seed data if parsing or migration fails.
- Avoid storing image binary data in localStorage; use temporary object URLs for previews and document that previews are not durable across sessions.

## 15. Security and privacy boundaries

- No real authentication, authorization, payment processing or inventory control exists in this release.
- Demo credentials are public showcase credentials and must not be reused.
- Never store real payment credentials or sensitive personal data.
- Keep QR payloads opaque and non-sensitive.
- Organizer route guards are presentation controls only.
