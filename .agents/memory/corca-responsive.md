---
name: CORCA Responsive Implementation
description: Approach used to make the CORCA website fully responsive; critical pitfalls and solutions
---

## Approach

All pages use inline `style=""` with no CSS classes — responsive overrides use `!important` in media queries and add new classes to HTML.

Breakpoints: 1024px (tablet), 768px (mobile), 480px (small)

## Critical pitfalls fixed

**Sticky sidebar overlay**: Sections with a 2-col grid (intro | content) had `position: sticky; top: 100px` on the left column div. When the grid collapses to 1 col on mobile, the sticky element stays fixed and overlaps the content column below.
**Fix**: Add class `cw-sticky-col` to those divs; CSS rule `position: static !important; top: auto !important` at ≤768px.

**class= inside style= (malformed HTML)**: The Python transformation script that replaced substrings like `"border-top: 1px solid..."` added `class="cw-footer-bottom"` INSIDE the style attribute value instead of as a separate HTML attribute. Must replace the full opening tag including `<div`, not just the style value.
**Why**: `html.replace(STYLE_VALUE, 'class="X" ' + STYLE_VALUE)` when STYLE_VALUE is a substring of `style="..."` puts the class declaration inside style, breaking both the CSS class and the style.

**data-reveal divs**: Many grid container divs have `data-reveal=""` BEFORE `style=`. Regex patterns matching `<div style=` miss these. Must match `<div [^>]*?style=` or target the style content string specifically.

**Carousel JS + CSS conflict**: The flex carousel uses `translateX(calc(-i * ((100% - 60px) / 4 + 20px)))` set via DC template JS as an inline style. CSS `transform: none !important` breaks the JS buttons. The correct fix is to modify the JS itself to detect mobile and use pixel-based calculations rather than overriding with CSS.
**Fix**: `const isMobile = window.innerWidth <= 768; const perView = isMobile ? 1 : 4;` Then calculate `containerW = window.innerWidth - 64` (64 = 32px padding each side) and use `translateX(-iSafe * (containerW + 16)px)`. Add resize handler via `componentDidMount/componentWillUnmount`.

**cw-nav check in HTML**: Checking `'cw-nav' not in html` to conditionally add `class="cw-nav"` fails because the HTML already contains `id="cw-nav-check"` which includes the substring `cw-nav`. Use `'class="cw-nav"' not in html` instead.

## Classes added to HTML (all source + public copies)

- `cw-header` — header inner flex div (for mobile height/padding override)
- `cw-nav` — header `<nav>` (hide on mobile, show on checkbox check)
- `cw-cta-btn` — header CTA button (hide on mobile)
- `cw-menu-toggle` — hamburger label (show on mobile)
- `cw-footer-inner` — footer main flex div
- `cw-footer-bottom` — footer bottom bar
- `cw-sticky-col` — sticky sidebar heading divs in 2-col sections
- `cw-carousel-outer` — carousel overflow wrapper (Manufactura)
- `cw-carousel-track` — carousel flex track (Manufactura)
- `rg-hero` — hero 2-col grids
- `rg-stats` — 4-col stats bar
- `rg-2/3/4/5` — content grids
- `rg-brand` — 300px+1fr brand card (Distribución)
- `rg-brand-prods` — nested 4-col within brand cards
- `rg-step` — timeline step rows (84px 20px 1fr)
- `rg-form-row` — form field pairs (Contacto)

## File structure

- `assets/responsive.css` (source) — always edit here then copy to `public/assets/`
- 14 HTML files total: 7 source (root) + 7 public/
- Build: `PORT=23517 BASE_PATH=/ pnpm --filter @workspace/corca-website run build`
