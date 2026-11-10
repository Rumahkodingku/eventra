# 04 — Design Direction

**Status:** FINAL — approved documentation baseline v1.1

## Creative direction

**Premium Event Editorial** — a refined digital ticketing experience that combines editorial event storytelling with a clear, high-confidence commerce interface.

The product should feel curated rather than crowded. Event imagery provides emotional impact; typography, spacing and restrained surfaces provide clarity.

## Brand personality

- Confident
- Curated
- Contemporary
- Energetic, but not chaotic
- Trustworthy
- Inclusive

## Visual principles

1. **Image-led discovery:** Large, high-quality event photography creates desire and context.
2. **Editorial hierarchy:** Strong display typography for event titles; restrained typography for utility content.
3. **Quiet commerce UI:** Checkout and account flows use calm surfaces and minimal decoration.
4. **Purposeful contrast:** Accent colors indicate action, selection and important status.
5. **Consistent geometry:** Use a consistent radius scale and spacing rhythm.
6. **Motion with meaning:** Motion clarifies state changes, hierarchy and transitions; avoid decorative overload.

## Proposed visual palette

The following values are the approved brand palette baseline. Contrast pairings still require implementation-level WCAG verification before release.

| Token | Suggested value | Usage |
| --- | --- | --- |
| Ink / near-black | `#111318` | Primary text, dark surfaces |
| Deep midnight | `#171B2B` | Premium dark sections |
| Warm off-white | `#F7F6F2` | Main light canvas |
| Pure white | `#FFFFFF` | Cards and form surfaces |
| Muted slate | `#737987` | Secondary text |
| Electric violet | `#7357F6` | Primary brand accent |
| Soft violet | `#EEEAFE` | Selected subtle surfaces |
| Lime highlight | `#C7F36B` | Rare promotional/highlight accent |
| Success | `#16845B` | Success state |
| Warning | `#B7791F` | Warning state |
| Danger | `#C44545` | Error/destructive state |
| Border | `#E5E5E2` | Light-mode dividers |

Do not use the full palette everywhere. The accent should remain distinctive and functional.

## Typography direction

- Display: modern grotesk or geometric sans with expressive large headings.
- UI/body: highly legible sans-serif with clear Indonesian glyph support.
- Use tabular numerals for prices, order IDs and analytics.
- Avoid overly thin weights for small text.
- Use responsive type scales with controlled line lengths.

## Layout direction

### Customer application

- Wide editorial hero and featured-event modules.
- Consistent event card aspect ratios.
- Clear filter controls and compact result metadata.
- Sticky booking summary only when it does not obscure content.
- Checkout with a focused, distraction-reduced layout.

### Organizer dashboard

- Neutral canvas, compact navigation and high information density.
- KPI cards with clear labels and comparison periods.
- Charts with readable axes and legends.
- Tables that transform into cards or horizontally scroll on narrow screens.

## Imagery

- Use authentic-looking event photography with varied event types and audience representation.
- Maintain consistent image treatment and cropping.
- Avoid text baked into event artwork where possible.
- Provide fallback imagery and meaningful alt text.
- Use curated local assets or verified image sources; do not depend on unstable remote image URLs for core UI.

## Motion direction

- Short transitions for hover, focus and selection.
- Subtle entrance transitions for major content sections.
- Seat selection should have clear selected/unavailable feedback.
- Cart updates may use a restrained count transition.
- Respect `prefers-reduced-motion`.
- Avoid scroll hijacking, excessive parallax and long blocking animations.

## Avoid

- Generic marketplace clutter.
- Excessive gradients and glassmorphism.
- Too many competing accent colors.
- Tiny low-contrast metadata.
- Over-animated checkout.
- Seat maps that rely on color alone.
- Inconsistent card radii or arbitrary spacing.
- Dashboard charts without labels or context.

## Brand identity

- Brand: **Eventra**.
- Tagline: **Your Gateway to Every Experience.**
- Brand name is approved for this showcase project.
- Domain and trademark clearance have not been performed as part of this documentation work; complete those checks before commercial/public launch.
- Centralize brand name, tagline and logo assets in brand configuration rather than scattering literals through components.
