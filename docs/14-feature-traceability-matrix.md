# 14 — Feature Traceability Matrix

**Status:** FINAL — requirements coverage baseline v1.1

This matrix connects the approved feature scope to its primary route, data domain and QA coverage. It is the checklist for preventing features from disappearing between planning, design and implementation.

| Feature group      | Main features                                                             | Primary route(s)                  | Data/domain             | QA coverage                           |
| ------------------ | ------------------------------------------------------------------------- | --------------------------------- | ----------------------- | ------------------------------------- |
| Global shell       | Navigation, locale, theme, cart/wishlist badges, dialogs, toasts          | All routes                        | Preferences, session    | Shell, responsive, localization       |
| Discovery          | Hero, featured/trending/upcoming/recommended, categories, recently viewed | `/`                               | Event, Category         | Discovery                             |
| Search             | Autocomplete, recent queries, keyword search                              | `/search`, `/events`              | Event, Venue, Organizer | Search/filter                         |
| Listing            | Grid/list, filters, sort, pagination, empty state                         | `/events`                         | Event, Category, Venue  | Discovery                             |
| Category           | Category overview, subcategories, filtered events                         | `/categories/[slug]`              | Category, Event         | Category                              |
| Event detail       | Media, description, schedule, venue, organizer, terms, related events     | `/events/[slug]`                  | Event, Venue, Organizer | Event detail                          |
| Ticket selection   | Tier, benefits, quantity, sales window, availability                      | Event ticket flow                 | TicketType              | Ticket selection                      |
| Reserved seating   | Sections, rows, seats, legend, accessible seats, zoom/list alternative    | Seat selection flow               | VenueLayout, Seat       | Seat map                              |
| Hybrid             | GA + reserved items in one event/cart                                     | Event ticket flow                 | TicketType, Seat        | Hybrid                                |
| Cart               | Multi-event lines, update/remove, fee, discount, promo                    | `/cart`                           | CartItem, PromoCode     | Cart                                  |
| Checkout           | Guest/customer, buyer/attendee, validation, demo payment                  | `/checkout`                       | Order, OrderItem        | Checkout                              |
| Payment result     | Processing, success, failure, retry                                       | `/checkout/result/[orderId]`      | Order, Payment          | Payment result                        |
| Confirmation       | Order number, summary, generated tickets                                  | `/checkout/success/[orderId]`     | Order, Ticket           | Order success                         |
| Ticket wallet      | Upcoming/past/cancelled, QR, detail, print/download                       | `/tickets`, `/tickets/[ticketId]` | Ticket, Event           | Ticket                                |
| Orders             | History and order detail                                                  | `/orders`, `/orders/[orderId]`    | Order, OrderItem        | Orders                                |
| Wishlist           | Add/remove, persistence, empty state                                      | `/wishlist`                       | WishlistItem            | Wishlist                              |
| Authentication     | Guest, customer/organizer demo login, local registration/logout           | `/login`, `/register`             | User, Session           | Auth                                  |
| Profile            | Edit profile, avatar preview, preferences                                 | `/profile`, `/profile/settings`   | User, Preferences       | Profile                               |
| Notifications      | Inbox, unread count, read state, preferences                              | `/notifications`                  | Notification            | Notifications                         |
| Reviews            | Rating, comment, eligibility, sort/filter                                 | Event detail/reviews              | Review, Ticket          | Reviews                               |
| Organizer overview | KPIs, sales trend, top events, recent orders                              | `/organizer/dashboard`            | Analytics, Order, Event | Organizer dashboard                   |
| Event management   | CRUD, status, preview, image preview                                      | `/organizer/events/*`             | Event, Venue            | Event CRUD                            |
| Ticket management  | Tier CRUD, quota, price, sales window, layout                             | `/organizer/events/[id]/tickets`  | TicketType, VenueLayout | Ticket config                         |
| Order management   | Search, filter, detail, status, CSV                                       | `/organizer/orders/*`             | Order                   | Organizer orders                      |
| Attendees          | Attendee list/detail and ticket mapping                                   | `/organizer/attendees`            | Attendee, Ticket        | Attendees                             |
| Check-in           | Ticket lookup, check-in, duplicate prevention                             | `/organizer/check-in`             | Ticket                  | Check-in                              |
| Analytics          | Sales, revenue, tier/event comparison, attendance, export                 | `/organizer/analytics`            | Analytics               | Analytics                             |
| Organizer settings | Profile, contact, brand/social, demo payout UI                            | `/organizer/settings`             | Organizer               | Settings                              |
| Cross-cutting      | ID/EN, responsive, accessibility, theme, reset, states                    | All routes                        | Preferences             | Localization/accessibility/regression |

## Completion rule

A feature is not complete merely because it appears in this matrix. It must be implemented, tested, and assigned a status with evidence in the project QA tracker.
