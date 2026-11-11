# Eventra

**Your Gateway to Every Experience.**

Eventra is a premium, responsive event discovery and ticketing demo for Rumah Kodingku. It includes a customer experience, simulated checkout, digital tickets, and a complete organizer workspace.

> Payments, email delivery, and QR validation are simulated. The catalog, identity, inventory, cart, orders, tickets, reviews, wishlist, notifications, analytics, and organizer settings are served by the Go API and MySQL.

## Stack

- Next.js `16.4.6` with App Router and Cache Components
- React `19.3.0` + TypeScript
- Go API with Gin, GORM, MySQL 8.4, Redis 8
- S3-compatible image upload adapter (MinIO in local compose)
- Tailwind CSS `4.3.3` via `@tailwindcss/turbopack`
- Radix UI primitives for dialogs, menus, tabs and switches
- Zustand for local UI preferences and mock-only test fixtures
- TanStack Query for API-backed data
- `next-intl` for Indonesian/English UI copy (no locale prefix)
- Recharts for organizer analytics
- Scalar API Reference for self-hosted interactive API docs
- `react-qr-code` for opaque demo ticket QR codes
- Sonner for toast feedback
- Vitest and Playwright for tests
- Biome for linting and formatting

## Getting started

```bash
npm install
MYSQL_PORT=3307 docker compose up -d mysql redis
cd apps/api
export APP_ENV=development
export DATABASE_URL='eventra:eventra@tcp(127.0.0.1:3307)/eventra?parseTime=true&charset=utf8mb4&loc=UTC'
export REDIS_URL='redis://127.0.0.1:6379/0'
export MIGRATIONS_DIR=./migrations
go run ./cmd/migrate up
go run ./cmd/seed
CATALOG_SEED_FILE=./seed/catalog.json go run ./cmd/seed-catalog
go run ./cmd/api
```

In another terminal:

```bash
cd apps/web
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1 npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API reference: [http://localhost:8080/docs](http://localhost:8080/docs). API mode is the default. For the local mock showcase, set `NEXT_PUBLIC_API_MODE=mock`.

Production build:

```bash
npm run build
npm start
```

## Demo accounts

| Role      | Email                  | Password    |
| --------- | ---------------------- | ----------- |
| Customer  | `customer@demo.local`  | `demo12345` |
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
npm run test:e2e:api
npm run docs:check
```

- API reference is served by the Go API at `/docs`; the contract is `/openapi.yaml`.
- `npm run docs:build` regenerates the committed Scalar asset from the pinned npm dependency.
- `API_DOCS_ENABLED=false` disables `/docs`, `/openapi.yaml`, and the asset.- Mock E2E starts Next.js with `NEXT_PUBLIC_API_MODE=mock`.
- API E2E resets `eventra_e2e`, seeds MySQL, starts the Go API, and covers discovery, organizer event CRUD, customer purchase, wallet, notifications, wishlist, reviews, settings, and check-in.
- Go integration tests require MySQL: `TEST_INVENTORY_DATABASE_URL` and `TEST_ENGAGEMENT_DATABASE_URL`.
- Firefox smoke/logo coverage is available with `npm run test:e2e:firefox`.
- Manual QA should still cover print layout, full bilingual content review, and long-session organizer flows.

## Local data

API mode stores customer and organizer data in MySQL. Browser storage keeps preferences such as locale, theme, recent views, and mock fixtures under `eventra-*` keys. The in-app reset action only clears browser-local preferences; it does not reset MySQL.

No real card number, CVV, bank credential, OTP or sensitive identity data is collected. QR codes contain only an opaque demo ticket code.

## Backup and restore

See [`docs/runbooks/backup-restore.md`](docs/runbooks/backup-restore.md). `scripts/backup-mysql.sh` writes a gzipped mysqldump; `scripts/restore-mysql.sh` restores into a separate database.

## Logo and assets

- Light wordmark: `apps/web/public/logo/eventra-light-mode-bg-transparent.png`
- Dark wordmark: `apps/web/public/logo/eventra-dark-mode-bg-transparent.png`
- Mark: `apps/web/public/logo/eventra-logo-mark.png`
- OG image: `apps/web/public/brand/og.png`

The header switches wordmark automatically for light/dark mode. Footer, organizer sidebar, and dark panels use the dark wordmark. Compact mobile contexts use the mark. Organizer profiles use monogram initials, not the Eventra wordmark.

Event photography is downloaded locally from Unsplash for this demonstration. See [`apps/web/public/images/events/ATTRIBUTION.md`](apps/web/public/images/events/ATTRIBUTION.md). Replace with client-approved licensed assets before a commercial launch.

The Eventra logo is a showcase brand asset and not a cleared commercial trademark.

## Known limitations

- Payment, email, and QR scanning hardware integration are simulated.
- Event checkout is single-event per order.
- Ticket-type editing is persisted through the event update endpoint; inventory quota cannot drop below sold plus reserved.
- Guest wishlist is browser-local and is not merged into the server wishlist on login.
- Event content remains in Indonesian while UI chrome is bilingual.
- Organizer payout fields are masked sample data only.
- MinIO is defined in compose, but the image could not be pulled in the development environment where this was verified; the S3 adapter is covered by unit tests.
- Offsite encrypted backups, staging deployment, and rollback drills depend on the deployment platform and are not implemented here.

## Documentation

The product and design baseline lives in [`docs/`](docs/). The full implementation plan is [`docs/16-implementation-plan.md`](docs/16-implementation-plan.md). The fullstack migration plan is [`docs/fullstack-architecture/11-implementation-plan.md`](docs/fullstack-architecture/11-implementation-plan.md).
