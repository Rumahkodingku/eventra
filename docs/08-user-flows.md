# 08 — User Flows

**Status:** FINAL — approved documentation baseline v1.1

## Flow 1: Guest discovers and buys a general admission ticket

1. Open homepage.
2. Browse featured events or search.
3. Open event detail.
4. Review date, venue, terms and ticket tiers.
5. Choose a general admission tier and quantity.
6. Add to cart.
7. Review cart and pricing.
8. Continue as guest.
9. Enter buyer and attendee details.
10. Select a demo payment method.
11. Review the simulation notice and confirm.
12. See simulated processing result.
13. On success, create local order and ticket.
14. Open ticket wallet or ticket detail.
15. View QR and print/download.

Success condition: order and ticket appear after refresh in the same browser.

## Flow 2: Guest selects reserved seats

1. Open a reserved-seating event.
2. Select a section/zone.
3. Review seat legend and price.
4. Select one or more available seats.
5. Confirm selected seat list and total.
6. Continue to cart.
7. Complete guest checkout.
8. Receive one digital ticket per seat (or per ticket unit, based on configured event rules).

Error/recovery:

- Unavailable seats cannot be selected.
- Removing a seat updates total.
- If local seat state conflicts, show a selection error and ask user to choose again.

## Flow 3: Hybrid event

1. Open event detail.
2. Choose between general admission and reserved seating.
3. If general admission, select tier and quantity.
4. If reserved, select section and seats.
5. Add selection to cart.
6. Continue through checkout.

## Flow 4: Customer demo account

1. Choose Login.
2. Select or enter customer demo credentials.
3. Sign in locally.
4. Open profile, orders and tickets.
5. Add/remove wishlist events.
6. Change profile preferences.
7. Sign out.

## Flow 5: Guest mode

1. Dismiss or bypass sign-in.
2. Browse events.
3. Maintain local cart and wishlist.
4. Complete checkout with contact details.
5. Access order/ticket confirmation through the current session and local browser storage.
6. Prompt account creation only as an optional future enhancement.

## Flow 6: Organizer creates an event

1. Sign in using organizer demo account.
2. Open organizer dashboard.
3. Open Events and choose Create event.
4. Enter event details and upload image preview.
5. Select ticketing mode: general admission, reserved seating or hybrid.
6. Configure ticket tiers and quotas.
7. If reserved seating is enabled, configure sections/seats using sample layouts.
8. Save as draft or publish locally.
9. Preview the public event page.

## Flow 7: Organizer manages orders and attendees

1. Open Orders.
2. Search/filter orders.
3. Open order detail.
4. Review buyer and ticket records.
5. Open Attendees.
6. Search attendee or enter demo ticket reference.
7. Simulate check-in.
8. See checked-in status and timestamp.

## Flow 8: Organizer analytics

1. Open Analytics.
2. Select date range.
3. Review simulated revenue and ticket sales charts.
4. Compare events or ticket categories.
5. Export CSV.

## Flow 9: Language switching

1. Open language selector.
2. Choose Indonesian or English.
3. Translate navigation, labels, validation, statuses and content UI.
4. Preserve current route and relevant UI state.
5. Ensure dates and currency follow the selected locale.

## Flow 10: Failure and recovery

- Invalid promo code: show inline error; preserve cart.
- Invalid checkout field: show field-level error; preserve valid fields.
- Simulated payment failure: retain order draft/cart and provide retry or return-to-cart path.
- Empty wishlist/tickets/orders: explain state and provide discovery CTA.
- Unknown route/entity: show not-found page and safe navigation.

## Flow 11: Promo code

1. Enter a promo code in cart or checkout.
2. Validate against deterministic demo rules.
3. Show applied/invalid/expired/ineligible state.
4. Recalculate discount and total centrally.
5. Allow removal and recalculation.

## Flow 12: Organizer configures reserved or hybrid seating

1. Create/edit event.
2. Select reserved or hybrid ticketing mode.
3. Choose a venue layout template.
4. Configure sections, seat rows, seat numbers and price tiers.
5. Mark accessible, blocked and unavailable sample seats.
6. Preview customer seat map.
7. Save locally and publish/draft.

## Flow 13: Ticket check-in

1. Organizer opens check-in.
2. Search ticket code or simulate QR lookup.
3. Display event, attendee, seat and ticket status.
4. Confirm check-in.
5. Mark ticket as used and store local timestamp.
6. Prevent repeated check-in and show already-used result.

## Flow 14: Reset showcase data

1. Open demo settings/reset action.
2. Explain that local demo changes will be removed.
3. Confirm destructive reset.
4. Restore original seed events, demo accounts, orders and preferences.
5. Show success feedback.
