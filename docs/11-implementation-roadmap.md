# 11 — Implementation Roadmap

**Status:** FINAL — approved documentation baseline v1.1

## Delivery strategy

Build vertically: each phase should result in a working, testable slice. Do not begin advanced animation or decorative polish while core flows are incomplete.

## Phase 0 — Foundation and project setup

**Deliverables**

- Next.js App Router + TypeScript project.
- Tailwind and component primitives.
- Font, icon and global style setup.
- Folder structure and lint/type-check scripts.
- Brand configuration and semantic tokens.
- Localization foundation (ID/EN).
- Responsive app shell.
- Seed data and mock repository interfaces.

**Exit criteria**

- App runs cleanly.
- Shared tokens and layouts are in place.
- Locale switching works on shell.
- No critical TypeScript or lint errors.

## Phase 1 — Customer discovery

**Deliverables**

- Homepage.
- Event cards and category tiles.
- Event listing and search.
- Filters and sorting.
- Category pages.
- Event detail.
- Wishlist and recently viewed.

**Exit criteria**

- Users can browse/search/filter/open events.
- URL state is shareable where appropriate.
- Empty/loading/error states exist.
- Responsive layouts work.

## Phase 2 — Ticket selection and cart

**Deliverables**

- Ticket tier selection.
- Quantity controls.
- General admission flow.
- Reserved seating map.
- Hybrid event flow.
- Cart and price breakdown.
- Promo code simulation.

**Exit criteria**

- All three ticketing modes work.
- Seat and quantity constraints are enforced locally.
- Cart persists after refresh.
- Price calculation is consistent.

## Phase 3 — Checkout and digital tickets

**Deliverables**

- Guest and customer checkout.
- Buyer/attendee forms.
- Demo payment selection and explicit simulation.
- Success/failure result.
- Order creation.
- Ticket generation and QR.
- My tickets, order history, print/download.

**Exit criteria**

- A complete purchase simulation works.
- No real payment data is collected.
- Ticket/order records persist locally.
- Failure path is recoverable.

## Phase 4 — Customer account

**Deliverables**

- Demo login/register.
- Customer profile.
- Account settings.
- Notifications.
- Customer navigation and role-aware states.

**Exit criteria**

- Guest and customer journeys are clear.
- Demo account can access tickets and orders.
- Localization covers account UI.

## Phase 5 — Organizer dashboard

**Deliverables**

- Organizer shell.
- Dashboard KPIs and charts.
- Event CRUD and preview.
- Ticket configuration.
- Order list/detail.
- Attendee list and check-in simulation.
- Analytics and CSV export.
- Organizer settings.

**Exit criteria**

- Organizer can create/edit/publish local demo events.
- Ticket configuration reflects selected ticketing mode.
- Orders and attendee records are inspectable.
- Analytics are clearly labeled demo data.

## Phase 6 — Advanced experience

**Deliverables**

- Theme switching.
- Advanced search/autocomplete.
- Calendar and event reminders.
- Reviews and ratings.
- Enhanced seat-map interactions.
- Additional motion and micro-interactions.

**Exit criteria**

- Enhancements do not regress core flows.
- Reduced-motion behavior works.
- No decorative feature compromises usability.

## Phase 7 — QA, responsive polish and showcase readiness

**Deliverables**

- Full regression test.
- Mobile/tablet/desktop visual QA.
- Accessibility review.
- Performance review.
- Seed data quality pass.
- Demo account and reset-data instructions.
- README and portfolio presentation content.

**Exit criteria**

- All P0 acceptance tests pass.
- No broken primary actions.
- No horizontal overflow on core mobile pages.
- Demo can be evaluated without backend setup.
- Known limitations are documented.

## Execution rules

- Finish the current phase and verify its exit criteria before moving forward.
- Do not silently skip failing requirements.
- If a requirement is ambiguous, identify the ambiguity and recommend a default before implementation.
- Keep a decision log for scope changes.
- After each phase, update the checklist and report completed, deferred and blocked items.
- Do not claim a feature is complete until it has been exercised in the running app.

## Phase-to-document traceability

- Phase 0: README, Product Brief, Design System, Frontend Architecture, Data Model.
- Phase 1: Feature Specification A1–A5, IA public routes, User Flows 1/4/5/9, QA discovery/event-detail tests.
- Phase 2: Feature Specification A6–A7, seat/cart data model, User Flows 2/3/11, QA ticket/cart tests.
- Phase 3: Feature Specification A8–A10, order/ticket state machines, User Flows 1/2/5/10, QA checkout/ticket tests.
- Phase 4: Feature Specification A11–A14, customer routes, User Flows 4/5/9, QA account/localization tests.
- Phase 5: Feature Specification B1–B8, organizer routes, User Flows 6/7/8/12/13, QA organizer tests.
- Phase 6: Feature Specification P1/P2, Design Direction motion, QA reduced-motion and regression tests.
- Phase 7: all P0 requirements and all QA sections.

## Release gate

Do not label the application showcase-ready until all P0 acceptance criteria pass. P1/P2 can remain deferred only when the README or release notes explicitly identify them as deferred.
