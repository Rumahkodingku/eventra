# 10 — Frontend Integration

**Status:** Proposed baseline v1.0

## Preserve existing UI

Keep routes, customer/organizer flows, GA/reserved/hybrid UX, checkout, ticket wallet, organizer surfaces, themes, ID/EN localization, brand assets and current Vitest/Playwright coverage. Replace data sources behind repository interfaces; avoid page rewrites.

## State ownership

Zustand remains for transient UI/client state: selected seats before reservation, dialogs, wizard state, local preferences and optimistic UI. API/server state includes events, ticket availability, profile, orders, tickets, organizer data, notifications and analytics. Never trust localStorage for price, stock, payment, ticket validity or permissions.

## Generated client

`packages/api-client` generated from OpenAPI. Central base URL, cookie credentials, typed errors, request ID, abort support. No token read/write in JS; generated files not manually edited.

## Adapter pattern

```text
Feature/Page
   -> domain repository interface
      -> mock adapter (explicit demo mode)
      -> API adapter -> generated client
```

Production API mode must fail clearly when API is unavailable; never silently switch to mock data.

## Suggested repositories

Event, Category, Ticket, Inventory, Cart, Checkout, Order, TicketWallet, User, Organizer, Notification and Review.

Keep frontend domain/view models separate from OpenAPI DTOs; map at adapter boundary.

## Auth

Browser sends cookies. Session bootstrap calls `/auth/me`. Zustand may hold non-sensitive user view model, never JWT. Handle one refresh attempt without loops; on failure clear session view and route to login. Consider cross-tab logout. Server enforces every permission.

## Checkout

Client sends ticket type, quantity, seat IDs, promo and idempotency key. API recalculates all totals and reserves inventory. UI displays authoritative quote and expiry. Success appears only after server confirms order/tickets. Redirect is not payment confirmation.

## Seat selection

Layout metadata may be cached; availability comes from API. Client selection is provisional. API reservation returns expiry; conflicts refresh seat map. Expired reservations release server-side.

## Localization

API returns stable codes/structured data; UI maps codes to Indonesian/English. Store timestamps UTC; render using event timezone and locale. Keep formatting centralized.

## Tests

Adapter mapping/error tests; mocked client component tests; OpenAPI contract/client compile; E2E with test DB and mock payment provider. Add cases for 401 refresh, 403 ownership, 409 inventory conflict, delayed payment webhook and reservation expiry.
