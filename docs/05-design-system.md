# 05 — Design System

**Status:** FINAL — approved documentation baseline v1.1

## 1. Foundations

Use semantic tokens rather than hard-coded values inside components. Keep Eventra brand values centralized so approved brand assets and tokens remain consistent across the application.

## 2. Color tokens

Approved light-theme baseline:

| Semantic token               | Value     |
| ---------------------------- | --------- |
| `color.background`           | `#F7F6F2` |
| `color.surface`              | `#FFFFFF` |
| `color.surface.subtle`       | `#F0F0ED` |
| `color.text.primary`         | `#111318` |
| `color.text.secondary`       | `#737987` |
| `color.text.inverse`         | `#FFFFFF` |
| `color.brand.primary`        | `#7357F6` |
| `color.brand.primary-hover`  | `#6245E8` |
| `color.brand.primary-subtle` | `#EEEAFE` |
| `color.border.default`       | `#E5E5E2` |
| `color.status.success`       | `#16845B` |
| `color.status.warning`       | `#B7791F` |
| `color.status.danger`        | `#C44545` |
| `color.status.info`          | `#2768B2` |

Dark theme must define semantic equivalents, not simply invert every color. Verify WCAG contrast for text and controls before finalizing.

## 2A. Dark theme semantic tokens

| Semantic token               | Value     |
| ---------------------------- | --------- |
| `color.background`           | `#111318` |
| `color.surface`              | `#171B2B` |
| `color.surface.subtle`       | `#222638` |
| `color.text.primary`         | `#F7F6F2` |
| `color.text.secondary`       | `#B6BAC5` |
| `color.text.inverse`         | `#111318` |
| `color.brand.primary`        | `#8B78FF` |
| `color.brand.primary-hover`  | `#A092FF` |
| `color.brand.primary-subtle` | `#30295B` |
| `color.border.default`       | `#343849` |
| `color.status.success`       | `#45B88A` |
| `color.status.warning`       | `#E2B45B` |
| `color.status.danger`        | `#F07878` |
| `color.status.info`          | `#78A9E8` |

Lime `#C7F36B` is a limited highlight/accent, not a default text color on white. Use dark ink text on lime surfaces. Do not assume all palette combinations pass contrast; validate each semantic pairing.

## 3. Typography

Suggested font pairing:

- UI/body: Inter or another highly legible sans-serif.
- Display: use the same family with expressive weights initially; introduce a second family only if it improves the brand.

Type scale:

| Token          |    Size | Typical use                   |
| -------------- | ------: | ----------------------------- |
| `text-xs`      |    12px | Helper text, compact metadata |
| `text-sm`      |    14px | Secondary UI                  |
| `text-base`    |    16px | Body and controls             |
| `text-lg`      |    18px | Emphasized body               |
| `text-xl`      |    20px | Card/subsection title         |
| `text-2xl`     |    24px | Section heading               |
| `text-3xl`     |    30px | Page heading                  |
| `text-4xl`     |    36px | Hero heading                  |
| `text-display` | 48–64px | Large editorial headline      |

Use responsive clamp values for display text. Body line height should generally be 1.45–1.65.

## 4. Spacing and layout

Use a 4px base scale:
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`.

- Main content max width: approximately 1280px–1440px.
- Desktop page gutters: 32px–48px.
- Tablet gutters: 24px.
- Mobile gutters: 16px–20px.
- Form field vertical spacing: 16px–20px.
- Section spacing: 48px–80px desktop; 32px–48px mobile.

## 5. Radius, border and elevation

- `radius-sm`: 8px
- `radius-md`: 12px
- `radius-lg`: 16px
- `radius-xl`: 24px
- `radius-pill`: 999px
- Use 1px borders for separation.
- Use subtle shadows only where elevation improves hierarchy (menus, dialogs, floating panels).
- Avoid stacking multiple heavy shadows.

## 6. Breakpoints

Suggested responsive breakpoints:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

Treat these as layout thresholds, not device definitions. Test intermediate widths.

## 7. Component inventory

### Global

- Button: primary, secondary, outline, ghost, destructive, link.
- IconButton.
- Input, Textarea, Select, Combobox.
- Checkbox, Radio, Switch.
- Badge, StatusBadge, Tooltip.
- Tabs, Breadcrumbs, Pagination.
- DropdownMenu, Popover, Dialog, Drawer, AlertDialog.
- Toast/Sonner.
- Skeleton, Spinner, EmptyState, ErrorState.
- Avatar, AvatarGroup.

### Customer

- EventCard, FeaturedEventCard, CategoryTile.
- EventMeta, OrganizerMiniProfile.
- TicketTierCard, QuantityStepper.
- SeatMap, Seat, SeatLegend, SectionSelector.
- PriceBreakdown, PromoCodeInput.
- CartItem, OrderSummary.
- PaymentMethodOption.
- DigitalTicket, QRCodePanel.
- ReviewCard, NotificationItem.

### Organizer

- DashboardSidebar, DashboardTopbar.
- StatCard, ChartPanel.
- DataTable, FilterBar, SearchToolbar.
- EventStatusBadge.
- EventForm, TicketTypeForm.
- AttendeeRow, CheckInStatus.
- ExportMenu.

## 8. Component states

Every interactive component must define:

- Default
- Hover (where applicable)
- Focus-visible
- Active/pressed
- Selected
- Disabled
- Loading
- Error/invalid (where applicable)

Seat-specific states:

- Available
- Selected
- Unavailable/sold
- Restricted
- Accessible (with icon/label)
- Hover/focus preview

## 9. Iconography

Use one consistent icon family (Lucide recommended). Icons should be paired with labels when the meaning is not universally clear. Do not use icon-only controls without accessible names.

## 10. Imagery

- Event card landscape ratio: approximately 16:9 or 4:3 depending on layout.
- Portrait promotional artwork may use 3:4.
- Ticket artwork must preserve legibility and QR quiet zone.
- Use object-position metadata where different event imagery needs specific crops.

## 11. Motion tokens

- Fast: 120ms
- Standard: 180–220ms
- Emphasis: 280–360ms
- Use ease-out for entrances and ease-in for exits.
- Disable or simplify non-essential motion when reduced motion is requested.

## 12. Brand tokens

- Brand name: `Eventra`.
- Tagline: `Your Gateway to Every Experience.`
- Primary accent: Electric Violet `#7357F6`.
- Premium dark surface: Deep Midnight `#171B2B`.
- Main light canvas: Warm Off-white `#F7F6F2`.
- Highlight: Lime `#C7F36B`, used sparingly.
- Logo light: `public/logo/eventra-light-mode-bg-transparent.png`.
- Logo dark: `public/logo/eventra-dark-mode-bg-transparent.png`.
- Logo mark: `public/logo/eventra-logo-mark.png`.
- OG image: `public/brand/og.png`.
- Centralize these values in `src/config/brand.ts`.

Logo rules:

- Header uses the wordmark with automatic light/dark switching.
- Footer and organizer sidebar use the dark wordmark.
- Compact contexts use the mark only.
- Organizer profiles use monogram initials, not the Eventra wordmark.

## 13. Governance

- Tokens are the source of truth.
- Avoid one-off values unless documented.
- New components must reuse foundations.
- Check light and dark themes.
- Test Indonesian and English content for wrapping and truncation.
- Run contrast and keyboard checks before accepting a component.
