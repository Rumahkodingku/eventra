# Eventra

**Your Gateway to Every Experience.**

Eventra is a premium, responsive event discovery and ticketing showcase for Rumah Kodingku. It includes a customer experience, simulated checkout, digital tickets, and a complete organizer workspace.

> This is a frontend-only showcase. There is no real payment, inventory lock, authentication, email delivery, or QR validation. All data lives in the browser.

## Stack

- Next.js `16.4.6` with App Router and Cache Components
- React `19.3.0` + TypeScript
- Tailwind CSS `4.3.3` via `@tailwindcss/turbopack`
- Radix UI primitives for dialogs, menus, tabs and switches
- Zustand for local session, cart, wishlist and demo data
- `next-intl` for Indonesian/English UI copy (no locale prefix)
- Recharts for organizer analytics
- `react-qr-code` for demo ticket QR codes
- Sonner for toast feedback
- Vitest and Playwright for tests
- Biome for linting and formatting

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm start
```

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Customer | `customer@demo.local` | `demo12345` |
| Organizer | `organizer@demo.local` | `demo12345` |

The login page also has one-click demo buttons. These are public showcase credentials. Never reuse them in a real application.

## Main routes

### Customer

- `/` — homepage and curated collections
- `/events` — discovery, search, filters and sorting
- `/events/[slug]` — event detail
- `/events/[slug]/tickets` — general admission, reserved seat map, or hybrid selection
- `/categories/[slug]` — category page
- `/cart` — cart, fees and promo codes
- `/checkout` — guest or customer checkout with simulated payment
- `/checkout/result/[orderId]` — failure/retry result
- `/checkout/success/[orderId]` — success and generated tickets
- `/tickets` — digital ticket wallet
- `/tickets/[ticketId]` — QR ticket, attendee, seat and print layout
- `/orders`, `/orders/[orderId]` — order history and detail
- `/wishlist` — saved events
- `/notifications` — simulated customer notifications
- `/profile`, `/profile/settings` — profile, preferences and demo reset
- `/login`, `/register` — local demo authentication

### Organizer

- `/organizer/dashboard` — KPIs, sales trend and ticket mix
- `/organizer/events` — event list
- `/organizer/events/new` — create event
- `/organizer/events/[eventId]` — event overview
- `/organizer/events/[eventId]/edit` — edit event
- `/organizer/events/[eventId]/tickets` — ticket configuration
- `/organizer/orders`, `/organizer/orders/[orderId]` — orders and CSV export
- `/organizer/attendees` — attendees
- `/organizer/check-in` — demo ticket check-in
- `/organizer/analytics` — analytics and event comparison
- `/organizer/settings` — organizer profile, branding and payout demo

## Product behavior

- **Three ticketing modes:** general admission, reserved seating, and hybrid.
- **Guest checkout:** guest can browse, build a cart, buy, and access locally created orders and tickets.
- **Persistence:** cart, wishlist, session, orders, tickets, reviews and organizer changes use versioned `localStorage` keys.
- **Reset:** Settings → **Reset data demo** clears local keys and restores seed data.
- **Simulation:** payment is clearly labeled as a simulation. A failure toggle is available in checkout for testing the recovery path.
- **Promo codes:** `EVENTRA10` (10%, min Rp250k, max Rp100k), `HEMAT50K` (Rp50k, min Rp500k), `EXPIRED10` (invalid state).
- **Service fee:** 5% of subtotal, rounded to Rp100, capped at Rp25,000.
- **Locale:** Indonesian and English UI; event content is seeded in Indonesian. Locale is stored in browser preferences, with no URL prefix.
- **Theme:** light, dark and system modes.

## Testing

```bash
npm run typecheck
npm run lint
npm run test:run
npm run test:e2e
```

- Unit tests cover pricing, fees, promo validation, ticket availability, seat layouts, IDs and CSV escaping.
- Playwright covers discovery, guest cart, logo light/dark rendering, organizer event editor and seat inventory, attendee detail, search keyboard navigation, seat zoom, event pagination, organizer demo login, and WCAG serious/critical checks on public and organizer pages.
- Firefox smoke/logo coverage is available with `npm run test:e2e:firefox`.
- Manual QA should still cover print layout, full bilingual content review, and long-session organizer flows.

## Local data

Keys are namespaced with `eventra-` and are validated by the client stores. The reset action removes the relevant browser keys and reloads the seed state.

No real card number, CVV, bank credential, OTP or sensitive identity data is collected. QR codes contain only a demo ticket code.

## Logo and assets

- Light wordmark: `public/logo/eventra-light-mode-bg-transparent.png`
- Dark wordmark: `public/logo/eventra-dark-mode-bg-transparent.png`
- Mark: `public/logo/eventra-logo-mark.png`
- OG image: `public/brand/og.png`

The header switches wordmark automatically for light/dark mode. Footer, organizer sidebar, and dark panels use the dark wordmark. Compact mobile contexts use the mark. Organizer profiles use monogram initials, not the Eventra wordmark.

Event photography is downloaded locally from Unsplash for this demonstration. See [`public/images/events/ATTRIBUTION.md`](public/images/events/ATTRIBUTION.md). Replace with client-approved licensed assets before a commercial launch.

The Eventra logo is a showcase brand asset and not a cleared commercial trademark.

## Known limitations

- No backend, real payment gateway, real inventory authority or secure authorization.
- Availability and seat state are illustrative and can be changed by clearing browser data.
- Setting `next dev` uses public demo credentials; role guards are UX only.
- Event content remains in Indonesian while UI chrome is bilingual.
- Reviews are demo-only and gated by a locally owned ticket.
- Organizer payout fields are masked sample data only.

## Documentation

The product and design baseline lives in [`docs/`](docs/). The full implementation plan is [`docs/16-implementation-plan.md`](docs/16-implementation-plan.md).
