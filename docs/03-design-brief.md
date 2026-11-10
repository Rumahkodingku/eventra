# 03 — Design Brief

**Status:** FINAL — approved documentation baseline v1.1

## Project

Premium multi-category event ticketing platform — Rumah Kodingku showcase.

## Background

The project demonstrates a complete ticketing experience rather than a static marketing website. It must accommodate event discovery, different ticketing formats, checkout, digital ticket management and organizer operations.

## Design challenge

Create a visual system that feels exciting enough for concerts and festivals, trustworthy enough for sports and conferences, and structured enough for transactional flows and administrative work. The same platform must handle visually diverse event categories without losing brand consistency.

## Objectives

1. Make event discovery intuitive and visually engaging.
2. Make ticket type, price, fees, seat selection and availability easy to understand.
3. Reduce friction across selection, cart and checkout.
4. Make digital tickets easy to retrieve and present.
5. Give organizers a clear, data-oriented management workspace.
6. Maintain a premium brand expression across desktop and mobile.
7. Support Indonesian and English without layout breakage.

## Primary users

- Guests exploring events.
- Registered/demo attendees purchasing and managing tickets.
- Organizers managing event operations.
- Portfolio reviewers testing the full experience.

## Required design deliverables

- Customer desktop and mobile layouts.
- Organizer dashboard desktop and responsive layouts.
- Design tokens and component library.
- Navigation and page hierarchy.
- Key user-flow prototypes.
- Ticket selection and seat-map interaction states.
- Checkout and digital ticket states.
- Form, table, chart, dialog, toast and empty-state patterns.
- Indonesian and English content examples.

## Key screens

1. Homepage.
2. Event listing/search.
3. Category listing.
4. Event detail.
5. Ticket tier selection.
6. Reserved seat map.
7. Cart.
8. Checkout.
9. Payment simulation result.
10. Order success.
11. Digital ticket detail.
12. My tickets.
13. Wishlist.
14. Login/register.
15. Profile/settings.
16. Notification center.
17. Organizer dashboard.
18. Event list/create/edit.
19. Ticket configuration.
20. Order list/detail.
21. Attendee/check-in.
22. Analytics/reports.

## Experience requirements

- Every page has a clear primary action.
- Critical purchase information is visible before confirmation.
- Selection state is never communicated by color alone.
- Seat map includes a legend and keyboard-accessible alternative.
- Mobile checkout avoids excessive multi-column layouts.
- Destructive organizer actions require confirmation.
- Demo/simulated features are labeled honestly.

## Constraints

- Frontend-only; no real payment or backend.
- Use local mock data and browser storage.
- Must be responsive.
- Must support Indonesian and English.
- Use reusable components and consistent design tokens.

## Design success measures

- Users can identify event date, venue and ticket price quickly.
- Users can distinguish ticket tiers and seat states.
- Users can complete the simulated purchase without dead ends.
- Organizer tasks are discoverable and forms provide useful validation.
- Screens remain readable at narrow mobile widths and with longer translations.

## Design principles and constraints by journey

- Discovery: emotion-led imagery with scannable event metadata.
- Event detail: ticket price, date, venue, timezone and terms must be easy to find.
- Selection: ticket tiers and seats must have clear, distinct states.
- Cart: itemized totals and fees must be visible before checkout.
- Checkout: low-distraction layout, guest path, clear simulation disclaimer.
- Ticket wallet: ticket code and QR remain legible on mobile and in print.
- Organizer: operational clarity, readable data density and safe destructive actions.

## Required responsive states

For each key screen, document desktop, tablet and mobile behavior. The seat map, checkout summary, organizer tables, navigation drawer and sticky CTAs require explicit responsive decisions.
