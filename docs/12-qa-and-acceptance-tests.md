# 12 — QA and Acceptance Tests

**Status:** FINAL — approved documentation baseline v1.1

## 1. Test environments

Test at minimum:

- Mobile narrow: 360px–390px.
- Mobile wide: 414px–430px.
- Tablet: 768px–1024px.
- Desktop: 1280px–1440px.
- Wide desktop: 1536px+.

Test current Chrome and at least one additional major browser where practical.

## 2. Core customer acceptance tests

### Discovery

- Homepage renders featured and categorized events.
- Search returns matching events by title/category/city.
- Filters can be combined and cleared.
- Sorting changes order correctly.
- No-result state offers a recovery action.
- Event cards navigate to correct event detail.

### Event detail

- Date, timezone, venue and ticket information are clear.
- Wishlist toggles and persists.
- Share/copy action provides feedback.
- Ticket CTA navigates to correct selection flow.

### Ticket selection

- General admission quantity respects min/max.
- Reserved seat map displays legend and section names.
- Sold/blocked seats cannot be selected.
- Selected seats are visibly distinct beyond color.
- Accessible alternative exists.
- Hybrid events allow both applicable selection modes.
- Summary and total update correctly.

### Cart

- Add, update and remove items work.
- Cart persists after refresh.
- Fee, discount and total calculations are correct.
- Invalid promo code displays a clear message.
- Empty cart has a discovery CTA.

### Checkout

- Guest checkout works.
- Customer checkout works.
- Required fields validate.
- Invalid form preserves valid values.
- Payment simulation is clearly labeled.
- No real card/bank/OTP information is requested.
- Success creates order and tickets.
- Failure state has a retry/recovery path.

### Tickets and account

- Ticket wallet lists generated tickets.
- Ticket detail displays correct event/attendee/seat.
- QR encodes demo ID only.
- Print view hides unrelated UI.
- Wishlist and profile states persist as expected.
- Guest empty states are understandable.

## 3. Organizer acceptance tests

- Organizer demo account can open dashboard.
- Customer demo account cannot access organizer UX routes (UX guard only).
- Dashboard KPIs and charts render with labels and demo-data notice.
- Create/edit/delete event works locally.
- Draft/publish/pause status updates.
- Ticket type configuration validates quota, price and sale period.
- Order filters and search work.
- Attendee list is searchable.
- Check-in changes status and records local timestamp.
- CSV export contains expected columns and no unrelated personal data.
- Reset demo data restores seed state.

## 4. Localization tests

- All navigation, controls, validation and status labels translate.
- Language switch preserves current route and state where possible.
- Long English and Indonesian strings do not overflow.
- Currency and date formats are locale-aware.
- Document language metadata updates.

## 5. Accessibility checks

- Keyboard can reach all interactive controls.
- Focus is visible.
- Dialogs manage focus and close appropriately.
- Forms have labels and associated error text.
- Seat map has keyboard and list-based alternative.
- Status is not communicated by color alone.
- Text and controls meet WCAG 2.2 AA contrast targets.
- Reduced motion is respected.
- Images have appropriate alt behavior.

## 6. Visual and responsive checks

- No clipped content at target widths.
- No unintended horizontal scrolling.
- Sticky actions do not cover content.
- Tables have mobile behavior.
- Seat map remains usable on touch devices.
- Checkout remains readable and focused.
- Event imagery uses consistent crop behavior.
- Empty/loading/error/success states are visually complete.

## 7. Performance and reliability

- No avoidable layout shift from images.
- Heavy modules are loaded only when needed.
- No repeated localStorage parsing on every render.
- Corrupted local storage does not crash the app.
- Browser refresh preserves intended state.
- Reset demo data works.
- Console has no critical runtime errors.

## 8. Definition of done

A feature is done only when:

1. Requirements are implemented.
2. Loading, empty, error and success states are considered.
3. Keyboard and responsive behavior are checked.
4. Indonesian and English content is verified.
5. Acceptance tests pass.
6. No dead-end buttons or misleading real-world claims remain.
7. Documentation is updated if behavior or scope changed.

## 9. Feature traceability checklist

Use the Feature Specification IDs below as the canonical test coverage references:

- A1–A5: shell, homepage, listing/search, category and event detail.
- A6–A7: ticket selection, seat map, hybrid mode and cart.
- A8–A10: checkout, simulated payment, order, QR ticket and ticket wallet.
- A11–A14: wishlist, account, notifications and reviews.
- B1–B8: organizer shell, dashboard, event/ticket/order/attendee/check-in/analytics/settings.
- C: localization, responsive, accessibility, states, theme and reset behavior.

For each feature, record implementation status (`NOT STARTED`, `IN PROGRESS`, `PASS`, `FAIL`, `DEFERRED`), test evidence, browser/viewport and known issue. A documented requirement is not evidence that the feature has been implemented or passed.
