# 15 — Decision Log and Document Status

**Status:** FINAL — approved decisions baseline v1.1

## Approved decisions

| ID    | Decision             | Approved value                                        |
| ----- | -------------------- | ----------------------------------------------------- |
| D-001 | Brand name           | Eventra                                               |
| D-002 | Tagline              | Your Gateway to Every Experience.                     |
| D-003 | Visual direction     | Premium Event Editorial                               |
| D-004 | Primary accent       | Electric Violet `#7357F6`                             |
| D-005 | Dark foundation      | Deep Midnight `#171B2B`                               |
| D-006 | Light canvas         | Warm Off-white `#F7F6F2`                              |
| D-007 | Highlight accent     | Lime `#C7F36B`                                        |
| D-008 | Product scope        | Complete customer + organizer platform                |
| D-009 | Platforms            | Responsive desktop and mobile                         |
| D-010 | Ticketing modes      | General Admission, Reserved Seating, Hybrid           |
| D-011 | Access               | Guest mode + demo customer + demo organizer           |
| D-012 | Languages            | Indonesian and English                                |
| D-013 | Release architecture | Frontend-only, mock services and browser persistence  |
| D-014 | Payments             | Simulation only; no real payment processing           |
| D-015 | Inventory            | Local illustrative state; no real reservation/locking |
| D-016 | Locale and URL       | `next-intl` without locale prefix; locale from cookie/localStorage; all IA routes unchanged |
| D-017 | Event content        | UI bilingual ID/EN; event content single-language Indonesian seed |
| D-018 | Service fee          | 5% of subtotal, rounded to Rp100, capped at Rp25,000 per order |
| D-019 | Promo codes          | `EVENTRA10`, `HEMAT50K`, `EXPIRED10` |
| D-020 | Seed dates           | Relative to seed/reset, 7–120 days ahead, persisted |
| D-021 | Organizer scope      | One demo organizer owns all seed events; other profiles display-only |
| D-022 | Guest access         | Guest can access locally created orders/tickets in the same browser |
| D-023 | Payment simulation   | Failure toggle; demo login uses `demo12345`; password never stored |
| D-024 | Assets and QA        | Locally licensed photos, Eventra wordmark, Vitest + Playwright |
| D-025 | Canonical routes     | `/events` canonical; `/search` redirects; ticket selection at `/events/[slug]/tickets` |
| D-026 | Phase placement      | Reset data in Phase 0; theme switcher in Phase 6 |
| D-027 | Logo assets          | Use supplied light/dark wordmark and mark from `public/logo/`; organizer profiles use monogram initials |

## Document status

| File                                     | Status | Notes                                   |
| ---------------------------------------- | ------ | --------------------------------------- |
| `00-README.md`                           | FINAL  | Index, scope and product rules          |
| `01-product-brief.md`                    | FINAL  | Vision, audience, goals and scope       |
| `02-feature-specification.md`            | FINAL  | Feature inventory and business rules    |
| `03-design-brief.md`                     | FINAL  | Design objectives and required screens  |
| `04-design-direction.md`                 | FINAL  | Art direction and palette               |
| `05-design-system.md`                    | FINAL  | Tokens and component inventory          |
| `06-ui-ux-guidelines.md`                 | FINAL  | UX, accessibility and interaction rules |
| `07-information-architecture.md`         | FINAL  | Routes and navigation                   |
| `08-user-flows.md`                       | FINAL  | Primary and exception journeys          |
| `09-frontend-architecture.md`            | FINAL  | Technical architecture                  |
| `10-data-model-and-mock-data.md`         | FINAL  | Entities, relationships and invariants  |
| `11-implementation-roadmap.md`           | FINAL  | Phases and exit criteria                |
| `12-qa-and-acceptance-tests.md`          | FINAL  | Acceptance test baseline                |
| `13-brand-identity.md`                   | FINAL  | Brand identity rules                    |
| `14-feature-traceability-matrix.md`      | FINAL  | Feature-to-route-data-QA mapping        |
| `15-decision-log-and-document-status.md` | FINAL  | Approved decisions and status register  |
| `16-implementation-plan.md`              | IMPLEMENTED | Full implementation plan; QA pass recorded in the plan |

## Meaning of FINAL

FINAL means the planning/documentation baseline is approved and internally aligned for implementation. It does not mean:

- the frontend has been built;
- features have passed runtime QA;
- accessibility has been independently audited;
- brand name/domain/trademark has legal clearance;
- production payment, authentication or inventory exists.

## Change control

Any change to scope, brand, palette, role model, ticketing mode or payment simulation must update this decision log and all affected documents. Record the reason, affected files and migration impact. Do not silently contradict approved decisions.
