# 06 — UI/UX Guidelines

**Status:** FINAL — approved documentation baseline v1.1

## 1. Navigation

- Keep primary navigation predictable across public pages.
- Preserve search access on desktop and mobile.
- Use a clear active state for current navigation.
- Keep organizer navigation visually distinct from customer navigation.
- Avoid placing every route in the top-level navigation.

## 2. Event discovery

- Make title, date, city, venue (where useful) and starting price scannable.
- Use consistent card image ratios.
- Filters must show active state and allow clear-all.
- On mobile, use a filter drawer or full-screen sheet with an explicit apply action.
- Preserve filters when navigating back from event detail.
- Empty results should explain how to recover.

## 3. Event detail

- Place date, venue and ticket CTA near the top.
- Distinguish event date from ticket sale end date.
- Clearly communicate timezone when event location differs from the user's locale.
- Explain ticket benefits and restrictions before selection.
- Do not fabricate scarcity; only show “limited” labels when seed data explicitly marks them.

## 4. Ticket selection and seating

- Show ticket price and fee policy before users commit.
- Quantity controls must enforce minimum and maximum values.
- A seat map must include a legend and section labels.
- Use more than color to distinguish seat states (shape, icon, text or pattern).
- Provide an accessible list-based seat selection alternative.
- Keep selected seat count and total price synchronized.
- Explain when a seat is unavailable.
- A local countdown is a simulation and must not imply a real server-side reservation.

## 5. Cart and checkout

- Keep itemized pricing visible.
- Clearly separate ticket subtotal, service fee, discount and total.
- Do not add fees unexpectedly at the final step.
- Validate inline and summarize errors when useful.
- Preserve valid form entries after validation errors.
- Avoid asking for unnecessary personal information.
- Offer guest checkout.
- Clearly label payment as a demo simulation.
- Never request real card credentials, banking passwords or OTP.

## 6. Digital ticket

- Make event name, date, venue, ticket holder, ticket type and seat easy to locate.
- Ensure QR code has adequate size and quiet zone.
- QR content should contain only a random demo ticket ID, not personal data.
- Provide a text ticket reference as a fallback.
- Print layout must hide navigation and non-ticket controls.

## 7. Authentication and guest mode

- Explain the value of signing in without blocking exploration.
- Make guest mode easy to find.
- Provide demo account access for reviewers.
- Clearly state that demo credentials and local data are not secure production authentication.
- Do not represent client-side route guards as security.

## 8. Organizer dashboard

- Prioritize actionable information over decorative charts.
- Every KPI must have a clear label, unit and date range.
- Charts require axes/legends and useful empty states.
- Tables need search, sort and filters where appropriate.
- Confirm destructive actions.
- Show save, validation and failure feedback.
- Keep forms grouped into logical sections and support draft state.

## 9. Responsive behavior

### Mobile

- Single-column primary content.
- Sticky CTA only when it does not cover content.
- Bottom sheet/drawer for filters and secondary actions.
- Tables may become cards or use deliberate horizontal scrolling.
- Seat maps support pan/zoom or section-by-section selection.
- Tap targets should generally be at least 44×44 CSS pixels.

### Tablet

- Use two-column layouts only where content remains readable.
- Collapse side navigation when space is constrained.
- Preserve key actions and summary panels.

### Desktop

- Use whitespace and multi-column layouts to improve scanning.
- Keep content within a controlled max width.
- Avoid overly wide text paragraphs.
- Use sticky side summaries only where helpful.

## 10. Accessibility

- Target WCAG 2.2 AA.
- Semantic headings and landmarks.
- Keyboard-accessible navigation, dialogs, menus and seat selection.
- Visible focus indicators.
- Proper labels and error associations for forms.
- Do not rely on color alone.
- Provide alt text for meaningful event imagery; decorative images use empty alt.
- Maintain readable contrast and scalable text.
- Respect reduced motion.
- Announce asynchronous status updates to assistive technology.
- Ensure language changes update document language metadata.

## 11. Localization

- Use translation keys, not inline conditional text scattered through components.
- Avoid concatenating sentence fragments.
- Format IDR using locale-aware formatting.
- Use explicit timezone-aware event dates.
- Indonesian and English strings may have different lengths; test both.
- Translate status labels, validation errors, empty states and accessibility labels.

## 12. Feedback and system states

Every page should consider:

- Loading
- Empty
- Error
- Success
- Disabled
- Offline/local-only informational state
- Permission/role-limited state

## 13. Content tone

- Clear, warm, concise and confident.
- Avoid exaggerated urgency.
- Use explicit labels such as “Simulasi pembayaran / Payment simulation”.
- Use consistent terms for event, ticket, order, attendee, organizer and check-in.

## 14. Interaction specifications

- Buttons show hover, focus, pressed, disabled and loading states as applicable.
- Form submission prevents duplicate local actions while processing.
- Dialogs trap focus, close with Escape where appropriate, and return focus to the trigger.
- Toasts are supplementary feedback; important errors must also appear inline or in page content.
- Search supports Enter submission, clear action, suggestions keyboard navigation and no-result feedback.
- Filters provide apply/reset behavior on mobile and immediate or explicit apply behavior on desktop consistently.
- Seat selection updates both the visual seat and the textual selected-seat summary.
- Checkout confirmation requires an explicit action after the simulation notice is visible.
- Destructive organizer actions require a confirmation dialog and success/failure feedback.

## 15. Content and data integrity

- Do not invent live availability, real event status, verified organizer identities or payment completion.
- Seed data must be clearly fictional or marked as demo content.
- “Limited”, “selling fast” and similar urgency labels may appear only when supported by explicit seed fields.
- A payment success screen must say it is a simulation.
- Do not expose buyer personal data in share URLs, QR payloads or analytics exports.
