# 07 — Information Architecture

**Status:** FINAL — approved documentation baseline v1.1

## 1. Application areas

1. Public discovery
2. Customer account and ticket wallet
3. Purchase journey
4. Organizer workspace

## 2. Public and customer routes

| Route                         | Page                     | Access                       |
| ----------------------------- | ------------------------ | ---------------------------- |
| `/`                           | Homepage                 | Guest                        |
| `/events`                     | Event discovery          | Guest                        |
| `/events/[slug]`              | Event detail             | Guest                        |
| `/categories/[slug]`          | Category page            | Guest                        |
| `/search`                     | Search results           | Guest                        |
| `/cart`                       | Cart                     | Guest                        |
| `/checkout`                   | Checkout                 | Guest                        |
| `/checkout/result/[orderId]`  | Simulated payment result | Guest/session                |
| `/checkout/success/[orderId]` | Order success            | Guest/session                |
| `/tickets`                    | My tickets               | Guest empty state / customer |
| `/tickets/[ticketId]`         | Ticket detail            | Ticket owner/demo            |
| `/orders`                     | Order history            | Customer                     |
| `/orders/[orderId]`           | Order detail             | Customer                     |
| `/wishlist`                   | Wishlist                 | Guest/customer               |
| `/notifications`              | Notification center      | Customer                     |
| `/login`                      | Login                    | Guest                        |
| `/register`                   | Register                 | Guest                        |
| `/profile`                    | Profile                  | Customer                     |
| `/profile/settings`           | Settings                 | Customer                     |

## 3. Organizer routes

| Route                                 | Page                  | Access         |
| ------------------------------------- | --------------------- | -------------- |
| `/organizer`                          | Redirect to dashboard | Organizer demo |
| `/organizer/dashboard`                | Overview              | Organizer      |
| `/organizer/events`                   | Event list            | Organizer      |
| `/organizer/events/new`               | Create event          | Organizer      |
| `/organizer/events/[eventId]`         | Event overview        | Organizer      |
| `/organizer/events/[eventId]/edit`    | Edit event            | Organizer      |
| `/organizer/events/[eventId]/tickets` | Ticket configuration  | Organizer      |
| `/organizer/orders`                   | Orders                | Organizer      |
| `/organizer/orders/[orderId]`         | Order detail          | Organizer      |
| `/organizer/attendees`                | Attendees             | Organizer      |
| `/organizer/check-in`                 | Check-in simulation   | Organizer      |
| `/organizer/analytics`                | Analytics             | Organizer      |
| `/organizer/settings`                 | Organizer settings    | Organizer      |

## 4. Navigation structure

### Public header

- Discover
- Categories
- Search
- Wishlist
- Cart
- Language
- Theme
- Account / Login

### Customer account navigation

- Overview
- My tickets
- Orders
- Wishlist
- Notifications
- Profile and settings

### Organizer sidebar

- Overview
- Events
- Tickets
- Orders
- Attendees / Check-in
- Analytics
- Settings

## 5. Page responsibilities

- Homepage inspires discovery and routes users into event collections.
- Listing/search supports narrowing and comparing events.
- Event detail explains the event and starts ticket selection.
- Selection configures ticket quantity or seats.
- Cart reviews chosen items and pricing.
- Checkout collects only necessary contact/attendee information and confirms demo payment.
- Success creates a local order and ticket records.
- Ticket wallet provides retrieval and print/download actions.
- Organizer dashboard summarizes simulated business performance.
- Organizer management pages provide local CRUD flows.

## 6. Route and state conventions

- Use URL query parameters for shareable discovery state: `q`, `category`, `city`, `dateFrom`, `dateTo`, `minPrice`, `maxPrice`, `sort`, `view`.
- Use stable slugs for public event URLs.
- Use IDs for private/demo record routes.
- Unknown IDs should show a useful not-found state.
- Do not put personal data, payment details or secrets in URLs.
- Route protection is for UX only; it is not security.

## 7. Route coverage notes

- Ticket selection is an event-detail subflow and may be represented by a dedicated route such as `/events/[slug]/tickets` or an anchored section; choose one implementation pattern consistently and preserve event context.
- Seat selection may use `/events/[slug]/seats` when a full-screen interactive map is needed, especially on mobile.
- Cart and checkout must support multiple cart line items.
- Ticket and order detail routes must handle unknown IDs and guest ownership/session limitations.
- Organizer check-in is a distinct operational route, not merely an attendee table action.
- Add a global not-found route and a recoverable error route for invalid mock records.

## 8. Route-to-feature coverage

| Feature group             | Primary routes                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discovery/search          | `/`, `/events`, `/search`, `/categories/[slug]`                                                                                                                    |
| Event information         | `/events/[slug]`                                                                                                                                                   |
| Ticket and seat selection | Event detail ticket flow; optional `/events/[slug]/tickets`, `/events/[slug]/seats`                                                                                |
| Cart and purchase         | `/cart`, `/checkout`, `/checkout/result/[orderId]`, `/checkout/success/[orderId]`                                                                                  |
| Customer ticket wallet    | `/tickets`, `/tickets/[ticketId]`, `/orders`, `/orders/[orderId]`                                                                                                  |
| Customer account          | `/login`, `/register`, `/profile`, `/profile/settings`, `/wishlist`, `/notifications`                                                                              |
| Organizer operations      | `/organizer/dashboard`, `/organizer/events/*`, `/organizer/orders/*`, `/organizer/attendees`, `/organizer/check-in`, `/organizer/analytics`, `/organizer/settings` |
