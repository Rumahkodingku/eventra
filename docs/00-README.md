# Eventra — Project Documentation

**Rumah Kodingku Showcase Project**  
**Status:** FINAL — Product and design baseline v1.1  
**Brand:** Eventra (approved project brand name; domain/trademark clearance is outside this documentation audit)  
**Scope:** Complete frontend-only ticketing platform  
**Languages:** Bahasa Indonesia and English  
**Platforms:** Responsive desktop and mobile

## 1. Project overview

A multi-category event discovery and ticket purchasing platform for concerts, sports matches, festivals, conferences, exhibitions, theatre, comedy, and other ticketed experiences. The showcase includes customer and organizer experiences, realistic interactions, demo authentication, simulated checkout, digital tickets, and an organizer dashboard.

This is a frontend showcase. No real payment, inventory reservation, identity verification, email delivery, or server-side authorization is performed.

## 2. Documentation index

| File                                     | Purpose                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `01-product-brief.md`                    | Product vision, goals, audience, scope and success criteria        |
| `02-feature-specification.md`            | Complete feature inventory and functional requirements             |
| `03-design-brief.md`                     | Design problem, objectives, deliverables and constraints           |
| `04-design-direction.md`                 | Visual concept, art direction, brand personality and UI principles |
| `05-design-system.md`                    | Tokens, typography, color, spacing, components and states          |
| `06-ui-ux-guidelines.md`                 | UX, accessibility, responsive and interaction rules                |
| `07-information-architecture.md`         | Sitemap, routes, navigation and page responsibilities              |
| `08-user-flows.md`                       | Primary customer and organizer journeys                            |
| `09-frontend-architecture.md`            | Recommended stack, structure, state and mock-service boundaries    |
| `10-data-model-and-mock-data.md`         | Frontend entities, relationships, seed data and persistence        |
| `11-implementation-roadmap.md`           | Phases, dependencies, deliverables and definition of done          |
| `12-qa-and-acceptance-tests.md`          | Test scenarios and acceptance criteria                             |
| `13-brand-identity.md`                   | Approved Eventra brand identity                                    |
| `14-feature-traceability-matrix.md`      | Feature-to-route-data-QA coverage                                  |
| `15-decision-log-and-document-status.md` | Approved decisions and document status register                    |
| `16-implementation-plan.md`              | Full implementation plan, WBS, gates, QA and release criteria      |

## 3. Locked decisions

- Complete scope: customer application plus organizer dashboard.
- Premium Event Editorial visual direction.
- Brand name: Eventra.
- Brand tagline: Your Gateway to Every Experience.
- Final brand palette: Ink Black `#111318`, Deep Midnight `#171B2B`, Warm Off-white `#F7F6F2`, Pure White `#FFFFFF`, Muted Slate `#737987`, Electric Violet `#7357F6`, Soft Violet `#EEEAFE`, Lime Highlight `#C7F36B`, Border `#E5E5E2`.
- Desktop and mobile responsive.
- Both ticket-category selection and interactive seat selection, depending on event configuration.
- Both guest mode and demo authentication.
- Indonesian and English language support.
- Frontend-only implementation using mock data and browser storage.
- Architecture should allow future backend integration without redesigning the entire application.

## 4. Important product rules

1. Events can be configured as `GENERAL_ADMISSION`, `RESERVED_SEATING`, or `HYBRID`.
2. General admission events sell ticket quantities without assigning seats.
3. Reserved seating events require users to select available seats from a seat map.
4. Hybrid events can offer both standing/general-admission ticket tiers and reserved seats.
5. Guest users can discover events and build a cart. Checkout requires attendee/contact details; account creation is optional unless a future product decision changes this.
6. Demo accounts unlock customer or organizer experiences. These roles are simulated and are not secure authorization.
7. Checkout creates a simulated order and digital ticket. No real payment is processed.
8. Browser storage is not a reliable inventory source. Seat availability and stock are illustrative only.
9. All important user-facing flows must support loading, empty, error, success, and disabled states.
10. All user-facing copy must be available in Indonesian and English.

## 5. Non-goals for this release

- Production backend, database, server APIs or real-time synchronization.
- Real payment gateway or refunds.
- Real QR ticket validation or gate hardware integration.
- Real email, SMS, push notifications or identity verification.
- Secure role-based access control.
- Real organizer payouts, tax invoicing or financial reconciliation.
- Guaranteed inventory locking across devices.

## 6. Documentation status

Documents `00`–`15` are finalized as the approved product/design specification baseline v1.1. `16-implementation-plan.md` is the executed implementation plan; its execution summary records QA evidence and known limitations. “Final” means the scope, decisions and requirements are documented and internally aligned; it does not mean the application has been implemented, tested, legally cleared, or deployed.

## 7. How to use this documentation

Treat the locked decisions and product rules as the source of truth. If implementation reveals ambiguity, document the decision before changing scope. Keep feature requirements, route definitions, data models and acceptance tests aligned.
