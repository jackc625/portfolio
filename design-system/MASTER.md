# Jack Cutrara Portfolio — Design System (MASTER.md)

> **Milestone:** v1.1 Editorial Redesign
> **Phase:** 8 (Foundation)
> **Status:** Locked at Phase 8 sign-off — read-only for Phases 9, 10, 11
> **Source visual reference:** `mockup.html` at repo root (transcribed below — do not re-derive)

---

## 1. Overview

This file is the **single source of truth** for the editorial design system that drives the v1.1 portfolio. It is the contract Phase 9 implements primitives against and Phase 10 composes pages from. Once Phase 8 ships, this document is read-only — Phases 9, 10, and 11 quote it and follow it but cannot revise it. If a primitive surfaces a rule conflict during Phase 9, it must be filed as a deviation back to Phase 8 scope rather than silently editing the spec.

The design system is intentionally **small**: six hex tokens, seven typography roles, four layout values, seven primitives, one accent color, one motion line. There is no dark theme, no token-vs-utility ambiguity, no fluid sizing variables, no decorative motion. Every value below is transcribed verbatim from `mockup.html` (lines 14-348). When `mockup.html` and this document disagree, **this document wins** — Phase 9 reads MASTER.md, not the mockup.

The mockup is preserved at repo root through Phases 8-10 as a visual reference and is deleted in Phase 11 polish after homepage parity is signed off. After that, this file alone defines the system.

A reader cloning this repo on GitHub should be able to open `design-system/MASTER.md` and use it to:

- Understand the entire color, type, and layout vocabulary in five minutes
- Build any of the seven primitive components without referring to `mockup.html`
- Know exactly which v1.0 patterns are forbidden in this milestone (anti-patterns section)
- Know exactly what motion is allowed to survive (the pragmatic motion line)
- Reuse the chat widget token map when restyling chat in Phase 10

---

## 2. Tokens

The **entire** color palette is six hex values. The **entire** layout token set is four pixel values. There are no other CSS custom properties in this design system. No `oklch()`, no semantic aliases (`--color-primary`, `--color-on-surface`), no dark-mode overrides, no gradient stops, no rgba alpha tokens.

### 2.1 Color tokens

| Token         | Value     | Usage                                                            |
| ------------- | --------- | ---------------------------------------------------------------- |
| `--bg`        | `#FAFAF7` | Page background (warm off-white)                                 |
| `--ink`       | `#0A0A0A` | Primary text (near-black) — body, headings, hovered nav links   |
| `--ink-muted` | `#52525B` | Secondary text (grey) — inactive nav, contact label, work nums  |
| `--ink-faint` | `#A1A1AA` | Tertiary text (light grey) — footer, work meta, section count   |
| `--rule`      | `#E4E4E7` | Dividers, borders, subtle surface tints — section rule, work-row border-bottom, header border-bottom |
| `--accent`    | `#E63946` | Signal red — interactive + attention signal only (see §7)       |

### 2.2 Layout tokens

| Token             | Value    | Usage                                                            |
| ----------------- | -------- | ---------------------------------------------------------------- |
| `--container-max` | `1200px` | Content max-width on `.container`                                |
| `--pad-desktop`   | `48px`   | Horizontal page padding at ≥1024px                               |
| `--pad-tablet`    | `32px`   | Horizontal page padding at <1024px                               |
| `--pad-mobile`    | `24px`   | Horizontal page padding at <768px                                |

### 2.3 Lock contract

> **These six hex values are the ENTIRE color palette.** No `oklch()`, no dark-theme overrides, no gradients, no additional semantic tokens, no rgba/hsla. There is no `--color-primary`, `--color-surface`, `--color-on-bg`, `--color-warning`, `--color-success`, `--color-error`. If a new color is needed in Phase 9, 10, or 11, it must be added to this table first via a Phase 8 amendment commit (which is itself locked, so adding a color requires sign-off).

**Source declaration site:** `:root` in `src/styles/global.css`.

**Tailwind bridge pattern:** map raw vars into Tailwind utilities via the `@theme` directive in `src/styles/global.css`:

```css
:root {
  --bg: #FAFAF7;
  --ink: #0A0A0A;
  --ink-muted: #52525B;
  --ink-faint: #A1A1AA;
  --rule: #E4E4E7;
  --accent: #E63946;
  --container-max: 1200px;
  --pad-desktop: 48px;
  --pad-tablet: 32px;
  --pad-mobile: 24px;
}

@theme {
  --color-bg: var(--bg);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-ink-faint: var(--ink-faint);
  --color-rule: var(--rule);
  --color-accent: var(--accent);
}
```

Components consume either raw `var(--ink)` or Tailwind utilities like `text-ink-muted` and `bg-bg`. Both are equivalent. There is no third option.

---

## 3. Typography

Two font families. Loaded via the **Astro 6 Fonts API**, Google provider, self-hosted. Variables exposed by the `<Font />` component.

- **Geist** — sans serif, weights `400 / 500 / 600 / 700`
- **Geist Mono** — monospaced, weights `400 / 500`

CSS variables:

| Variable          | Value           | Astro Fonts API `cssVariable` |
| ----------------- | --------------- | ----------------------------- |
| `--font-display`  | Geist           | `--font-display`              |
| `--font-body`     | Geist           | `--font-body`                 |
| `--font-mono`     | Geist Mono      | `--font-mono`                 |

> Note: `--font-display` and `--font-body` both resolve to Geist; the variable names exist for semantic clarity in component code. There is no separate display family.

### 3.1 Type roles

The type system is a **fixed ramp of seven role classes**. Every text element on the site uses exactly one role class. There are no ad-hoc font sizes, weights, or line heights.

#### `.display`

Homepage hero wordmark **only**. Used once on the entire site.

| Property        | Value                       |
| --------------- | --------------------------- |
| Font family     | Geist                       |
| Weight          | 700                         |
| Size            | `clamp(4rem, 9vw, 8rem)`    |
| Line height     | `0.92`                      |
| Letter-spacing  | `-0.035em`                  |
| Color           | `var(--ink)`                |

#### `.h1-section`

Page-level section titles (e.g., About page intro headline if used at h1 weight).

| Property        | Value                          |
| --------------- | ------------------------------ |
| Font family     | Geist                          |
| Weight          | 600                            |
| Size            | `clamp(2.5rem, 5vw, 3.5rem)`   |
| Line height     | `1.05`                         |
| Letter-spacing  | `-0.02em`                      |

#### `.h2-project`

Project titles inside the work list. Used inside `WorkRow.astro` and the projects index.

| Property        | Value         |
| --------------- | ------------- |
| Font family     | Geist         |
| Weight          | 500           |
| Size            | `1.75rem`     |
| Line height     | `1.2`         |
| Letter-spacing  | `-0.01em`     |

#### `.lead`

Homepage lead role statement, About page intro line.

| Property        | Value                              |
| --------------- | ---------------------------------- |
| Font family     | Geist                              |
| Weight          | 400                                |
| Size            | `clamp(1.25rem, 2vw, 1.625rem)`    |
| Line height     | `1.4`                              |

#### `.body`

Long-form paragraphs (About page paragraphs, project case study prose).

| Property        | Value         |
| --------------- | ------------- |
| Font family     | Geist         |
| Weight          | 400           |
| Size            | `1.125rem`    |
| Line height     | `1.6`         |
| Max-width       | `68ch`        |

#### `.label-mono`

Section labels, navigation links, header wordmark, contact "GET IN TOUCH" label, status line text.

| Property        | Value         |
| --------------- | ------------- |
| Font family     | Geist Mono    |
| Weight          | 500           |
| Size            | `0.75rem`     |
| Text transform  | `uppercase`   |
| Letter-spacing  | `0.12em`      |

#### `.meta-mono`

Metadata captions: dates, locations, work stack lists, footer copy, work-row year, work-row number.

| Property        | Value          |
| --------------- | -------------- |
| Font family     | Geist Mono     |
| Weight          | 400            |
| Size            | `0.8125rem`    |
| Letter-spacing  | `0.02em`       |

### 3.2 Fluid sizing rule

Fluid `clamp()` sizing lives **inside** the role classes, not as CSS custom properties. There is no `--font-size-display` token. Phase 9 primitives must apply role classes (`class="display"`, `class="label-mono"`) rather than re-declaring sizes inline. This is intentional: it keeps the type ramp in one place and makes `grep` for `.display` find every hero on the site.

### 3.3 Tabular numerics

Use the `.tabular` utility (`font-variant-numeric: tabular-nums`) on any meta-mono element that displays numbers — work row numbers (`01`, `02`...), section count (`4 / 4`), year (`2026`), copyright year. This makes columns align cleanly across rows.

---

## 4. Layout

### 4.1 Container

The `Container.astro` primitive wraps every page section. It is the **only** horizontal-padding mechanism on the site.

- `max-width: var(--container-max)` (1200px)
- `margin: 0 auto`
- `padding-left` / `padding-right` is the responsive tier:
  - ≥1024px: `var(--pad-desktop)` (48px)
  - <1024px: `var(--pad-tablet)` (32px)
  - <768px: `var(--pad-mobile)` (24px)

There is no separate `<Section>` or `<Wrapper>` component. Padding is applied **once** at the Container level. Inner elements use grid/flex at 100% width.

### 4.2 Section rhythm (vertical spacing)

| Breakpoint | `.section` `margin-top` |
| ---------- | ----------------------- |
| ≥1024px    | `160px`                 |
| <1024px    | `96px`                  |
| <768px     | `72px`                  |

Section margins are applied via a `.section` utility class, not via the Container. Hero is exempt — it uses its own `padding-top` ramp (`96px → 72px → 48px`).

### 4.3 Hero grid (homepage)

The homepage hero uses a **12-column CSS grid** with a 24px gap, breaking to single column at <1024px:

| Element       | Desktop columns | Mobile          |
| ------------- | --------------- | --------------- |
| `.hero-content` | `1 / span 8`  | full width      |
| `.hero-meta`    | `9 / span 4`  | full width, 32px top margin |

This is the **only** grid layout in the editorial system. Work rows use their own row-level grid (see §5.5).

### 4.4 Section header pattern

Every numbered section opens with a section header: a mono `§ NN — TITLE` label on the left, an optional count on the right (e.g., `4 / 4`), separated by space-between, baseline-aligned. Followed by a 1px `--rule` divider with `16px` top margin and `24px` bottom margin.

```
┌────────────────────────────────────────────────────────┐
│ § 01 — WORK                                    4 / 4   │
│ ────────────────────────────────────────────────────── │
│ (section content here)                                 │
└────────────────────────────────────────────────────────┘
```

This is built by `SectionHeader.astro` (see §5.4).

### 4.5 Hero vertical padding ramp

| Breakpoint | Hero `padding-top` |
| ---------- | ------------------ |
| ≥1024px    | `96px`             |
| <1024px    | `72px`             |
| <768px     | `48px`             |

Hero `padding-bottom` is always `0` — the section margin handles the gap to the next section.

---

## 5. Components (Phase 9 primitive specs — spec-first per D-04)

These are the **seven primitives** Phase 9 must build. Every primitive specs out: Name, Purpose, Props, Sizing, Colors, Typography, Hover/focus states, Mobile behavior, and an HTML sketch. Phase 9 must implement to spec **without modifying this file**.

### 5.1 `Header.astro`

**Purpose:** The sticky 72px-tall site header containing the JACK CUTRARA mono wordmark on the left and a 3-link mono nav on the right. Active link is underlined in accent red.

**Props:**

```ts
interface HeaderProps {
  currentPath: string; // e.g., "/about" — used to compute the active nav link
}
```

**Sizing:**

- `position: sticky; top: 0; z-index: 50;`
- `height: 72px;`
- `background: var(--bg);`
- `border-bottom: 1px solid var(--rule);`
- Inner: flex, `justify-content: space-between`, `align-items: center`, `height: 100%`, wrapped in a `Container.astro`

**Colors:**

- Background: `var(--bg)`
- Border: `var(--rule)`
- Wordmark text: `var(--ink)`
- Inactive nav link: `var(--ink-muted)`
- Active nav link: `var(--ink)` text, `var(--accent)` underline

**Typography:**

- Wordmark uses a **slightly larger** mono than `.label-mono`: Geist Mono 500, **0.875rem**, uppercase, letter-spacing 0.12em (note: bigger than the standard `.label-mono` 0.75rem)
- Nav links use `.label-mono` (Geist Mono 500, 0.75rem, uppercase, letter-spacing 0.12em)
- Nav links are: `works`, `about`, `contact` — exactly three, lowercase in markup, uppercase via CSS

**Hover/focus states:**

- Inactive nav link hover: color transitions to `var(--ink)` (Tailwind `transition-colors`, allowed per §6)
- Active nav link: `text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 1.5px; text-underline-offset: 6px;`
- Focus: visible focus ring on every link (browser default + accent outline acceptable)

**Mobile behavior:**

- Desktop nav (`.site-nav`) is visible at all breakpoints in the mockup
- The Phase 9 primitive **may** hide the desktop nav and reveal a hamburger at <768px, OR keep all three links visible (only 3 links — they fit on mobile)
- Decision recorded in this file in §5.8 once Phase 9 makes the call

**HTML sketch:**

```html
<header class="site-header">
  <div class="container header-inner">
    <span class="wordmark">JACK CUTRARA</span>
    <nav class="site-nav">
      <a href="/works" class="nav-link is-active">works</a>
      <a href="/about" class="nav-link">about</a>
      <a href="/contact" class="nav-link">contact</a>
    </nav>
  </div>
</header>
```

### 5.2 `Footer.astro`

**Purpose:** A 64px-tall footer containing the copyright on the left and a `BUILT WITH ASTRO · TAILWIND · GEIST` mono caption on the right. Sits 96px below the last section.

**Props:** None (the `BUILT WITH` caption is hardcoded; copyright year is computed at build time).

**Sizing:**

- `margin-top: 96px;`
- `border-top: 1px solid var(--rule);`
- `height: 64px;`
- Inner: flex, `justify-content: space-between`, `align-items: center`, `height: 100%`, wrapped in a `Container.astro`

**Colors:**

- Border-top: `var(--rule)`
- Copy text (left): `var(--ink-faint)`
- Built text (right): `var(--ink-faint)`

**Typography:**

- Both spans use `.meta-mono` (Geist Mono 400, 0.8125rem, letter-spacing 0.02em)
- Right span has `text-transform: uppercase` (the `.footer-built` class)
- Left span has `.tabular` for the year

**Hover/focus states:** None (no interactive elements in the footer baseline). If footer adds icon links in a later phase, the `hover:-translate-y-0.5` translate is allowed (see §6).

**Mobile behavior:** Same layout at all breakpoints — flex space-between, both spans visible. If the right span overflows at very narrow widths, Phase 9 may stack vertically with `flex-direction: column; gap: 8px;` but the default is single-row.

**HTML sketch:**

```html
<footer class="site-footer">
  <div class="container footer-inner">
    <span class="meta-mono footer-copy tabular">© 2026 JACK CUTRARA</span>
    <span class="meta-mono footer-built">BUILT WITH ASTRO · TAILWIND · GEIST</span>
  </div>
</footer>
```

**Mobile stack — Phase 9 D-10 amendment.** At <768px viewport the footer becomes a 3-row vertical stack instead of the single-row default. This extends the "single-row default, optional flex-column stack" latitude already granted in the Mobile behavior paragraph above with a concrete Phase 9 decision: the mobile footer inserts a mono social link row between the copyright and the "BUILT WITH" caption.

Mobile stack (3 rows, centered horizontally, `gap: 12px` between rows, applied via a `@media (max-width: 767px)` rule inside `Footer.astro`'s scoped `<style>`):

1. `© 2026 JACK CUTRARA` — `.meta-mono` + `.tabular`, color `var(--ink-faint)`
2. `GITHUB · LINKEDIN · X · EMAIL` — `.label-mono` color `var(--ink-muted)`, each link hovers to `var(--accent)` (identical shape to the contact section's `.contact-links` and identical content to the MobileMenu overlay bottom row per §5.8)
3. `BUILT WITH ASTRO · TAILWIND · GEIST` — `.meta-mono` uppercase, color `var(--ink-faint)`

At ≥768px the default MASTER §5.2 single-row layout applies unchanged — the social row is hidden via `display: none` on desktop to avoid duplicating information that the Phase 10 contact section already presents.

The social row uses pure mono text (no SVG icons) consistent with §8 anti-icon stance. Rationale: mobile users who skip the contact section still have social links within reach in the footer; users who never open `MobileMenu.astro` still see them without scrolling.

### 5.3 `Container.astro`

**Purpose:** The single horizontal-padding wrapper used by every page region (header, main sections, footer). Applies `max-width: 1200px` and the responsive padding tier.

**Props:**

```ts
interface ContainerProps {
  as?: keyof HTMLElementTagNameMap; // default "div" — allows <main>, <section>, etc.
  class?: string;                   // additional utility classes appended after .container
}
```

**Sizing:**

- `max-width: var(--container-max)` (1200px)
- `margin: 0 auto`
- `padding-left` / `padding-right`:
  - default: `var(--pad-desktop)` (48px)
  - `@media (max-width: 1023px)`: `var(--pad-tablet)` (32px)
  - `@media (max-width: 767px)`: `var(--pad-mobile)` (24px)

**Colors:** None — Container is structural only.

**Typography:** None — Container is structural only.

**Hover/focus states:** None.

**Mobile behavior:** Padding tier shrinks per breakpoint as above. No other behavior.

**HTML sketch:**

```html
<div class="container">
  <!-- children render at up to 1200px wide, padded responsively -->
</div>
```

### 5.4 `SectionHeader.astro`

**Purpose:** The `§ NN — TITLE` mono label + optional count + 1px rule divider that opens every numbered section.

**Props:**

```ts
interface SectionHeaderProps {
  number: string;        // e.g., "01"
  title: string;         // e.g., "WORK"
  count?: string;        // optional, e.g., "4 / 4"
}
```

**Sizing:**

- Inner flex container: `display: flex; justify-content: space-between; align-items: baseline;`
- Section rule divider: `height: 1px; background: var(--rule); margin-top: 16px; margin-bottom: 24px;`

**Colors:**

- Label text: `var(--ink)`
- Count text: `var(--ink-faint)`
- Rule divider: `var(--rule)`

**Typography:**

- Label: `.label-mono` (Geist Mono 500, 0.75rem, uppercase, 0.12em)
- Count: `.meta-mono.tabular` (Geist Mono 400, 0.8125rem, 0.02em, tabular-nums)

**Hover/focus states:** None.

**Mobile behavior:** Same layout at all breakpoints. The count may wrap to a second line at extremely narrow widths but should fit at ≥320px.

**HTML sketch:**

```html
<div class="section-header">
  <span class="label-mono">§ 01 — WORK</span>
  <span class="meta-mono count tabular">4 / 4</span>
</div>
<div class="section-rule"></div>
```

### 5.5 `WorkRow.astro`

**Purpose:** A single numbered row in the work list — number column on the left (56px wide), title + stack column in the middle (1fr), year + arrow on the right (auto). Hover reveals the accent arrow and underlines the title in accent red.

**Props:**

```ts
interface WorkRowProps {
  number: string;        // e.g., "01"
  title: string;         // e.g., "Portfolio System"
  stack: string;         // e.g., "ASTRO · TAILWIND · GEIST" — uppercase already
  year: string;          // e.g., "2026"
  href: string;          // link target — case study URL or external repo
}
```

**Sizing:**

- `display: grid; grid-template-columns: 56px 1fr auto;`
- `gap: 24px;`
- `padding: 28px 0;`
- `border-bottom: 1px solid var(--rule);`
- `:last-child` removes the border-bottom (handled by parent `.work-list`)
- `align-items: start;`

**Colors:**

- Number column: `var(--ink-muted)`
- Title (default): `var(--ink)`
- Stack: `var(--ink-faint)`
- Year: `var(--ink-faint)`
- Arrow (default): `var(--accent)`, `opacity: 0`
- Arrow (hover): `var(--accent)`, `opacity: 1` (transition: `opacity 120ms ease`)
- Title underline (hover): `text-decoration-color: var(--accent); text-decoration-thickness: 1.5px; text-underline-offset: 4px;`

**Typography:**

- Number: `.meta-mono.tabular`, font-size **1rem**, font-weight 500 (slightly bigger and bolder than the rest of the meta-mono usage)
- Title: `.h2-project` (Geist 500, 1.75rem, line-height 1.2, letter-spacing -0.01em)
- Stack: Geist Mono 400, **0.8125rem**, uppercase, letter-spacing 0.12em (note: this overrides the standard `.meta-mono` letter-spacing of 0.02em — the `.work-stack` selector wins in the mockup, lines 230-235)
- Year: `.meta-mono.tabular`
- Arrow: inherits parent font

**Hover/focus states:**

- Hover on the entire row: title gets the accent underline, arrow opacity transitions from 0 to 1 over 120ms
- Focus on the row's anchor: same visual treatment as hover (Phase 9 may apply via `.work-row:focus-within` or `:focus`)
- Title gets `margin-bottom: 12px;` between title and stack

**Mobile behavior:**

- The 56px / 1fr / auto grid holds at all breakpoints — the columns are narrow enough to fit
- Row padding stays at `28px 0`
- Touch interaction: tap reveals nothing extra (the arrow is decorative); the entire row is the link target

**HTML sketch:**

```html
<a class="work-row" href="/projects/portfolio-system">
  <span class="work-num meta-mono tabular">01</span>
  <div class="work-body">
    <h2 class="h2-project work-title">Portfolio System</h2>
    <div class="work-stack">ASTRO · TAILWIND · GEIST</div>
  </div>
  <div class="work-meta">
    <span class="meta-mono tabular work-year">2026</span>
    <span class="work-arrow" aria-hidden="true">→</span>
  </div>
</a>
```

### 5.6 `MetaLabel.astro`

**Purpose:** A small uppercase mono caption used for status text, contact labels, hero metadata, and any other "label-like" element.

**Props:**

```ts
interface MetaLabelProps {
  text: string;          // displayed text — case-insensitive, CSS uppercases it
  color?: "ink" | "ink-muted" | "ink-faint"; // default "ink"
  class?: string;
}
```

**Sizing:** Inline element, no inherent box dimensions. Use inside flex containers or as inline content.

**Colors:**

- Default: `var(--ink)`
- `color="ink-muted"`: `var(--ink-muted)` (used for status line label, contact "GET IN TOUCH")
- `color="ink-faint"`: `var(--ink-faint)` (used for section count)

**Typography:**

- `.label-mono` (Geist Mono 500, 0.75rem, uppercase, letter-spacing 0.12em)

**Hover/focus states:** None (it's a label, not a control).

**Mobile behavior:** No change.

**HTML sketch:**

```html
<span class="label-mono">AVAILABLE FOR WORK</span>
```

### 5.7 `StatusDot.astro`

**Purpose:** A 6px accent-red circle paired with a `MetaLabel` text — used for the homepage `AVAILABLE FOR WORK` indicator.

**Props:**

```ts
interface StatusDotProps {
  label: string;         // e.g., "AVAILABLE FOR WORK"
}
```

**Sizing:**

- Outer wrapper: `display: inline-flex; align-items: center;`
- Dot: `display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 8px;`

**Colors:**

- Dot: `var(--accent)`
- Label: inherits from MetaLabel default (`var(--ink)`)

**Typography:**

- Label uses `.label-mono` via `MetaLabel.astro`

**Hover/focus states:** None.

**Mobile behavior:** No change.

**HTML sketch:**

```html
<div class="status-line">
  <span class="status-dot" aria-hidden="true"></span>
  <span class="label-mono">AVAILABLE FOR WORK</span>
</div>
```

### 5.8 Mobile nav (Phase 9 rebuild decision)

Phase 9 **rebuilds** `MobileMenu.astro` as a full-screen overlay primitive rather than deleting it in favor of always-visible nav links. The rebuild lives at `src/components/primitives/MobileMenu.astro`. The v1.0 `src/components/MobileMenu.astro` (233 lines, hamburger + fullscreen overlay + focus trap + staggered link reveal + SVG social icons) is deleted in the same plan that wires BaseLayout to the new primitive. This takes the Phase 9 primitive library from 7 to 8 components.

**Hamburger visibility — container query, not viewport media query.** `Header.astro` sets `container-type: inline-size` on its inner flex container and uses a `@container (max-width: 380px)` rule to hide the inline `.site-nav` links and reveal the hamburger trigger. Threshold 380px is chosen because at a 375px viewport minus the 2 × 24px mobile `.container` padding, the header-inner element measures ≈ 327px wide — below 380px — so standard phones (320–414px viewport) see the hamburger while tablets and desktops keep the inline nav. Container queries have ~95% browser support in 2026 and react to the header's actual rendered width, not the viewport. The rationale for 380px specifically is that the mono wordmark `JACK CUTRARA` (Geist Mono 500, 0.875rem, 0.12em letter-spacing) plus three uppercase mono nav links (`works·about·contact` ≈ 22 characters separated by two 32px gaps) cramps visibly at that width.

**Overlay contents.** The rebuilt `MobileMenu.astro` renders:

1. A close button pinned top-right of the overlay (matching the v1.0 × icon pattern — planner's choice between SVG or mono `×` character)
2. Three mono nav links (`works`, `about`, `contact`) stacked vertically and centered, rendered at a prominent editorial size (planner selects between `.h2-project` 1.75rem and `.lead` clamp — whichever reads better). The active link receives the accent underline treatment from `.nav-link.is-active` defined inside `Header.astro` (text-decoration-color var(--accent), text-decoration-thickness 1.5px, text-underline-offset 6px).
3. A small `GITHUB · LINKEDIN · X · EMAIL` mono link row at the bottom of the overlay, using the same shape as the contact section's `.contact-links` (Geist Mono 500, 0.75rem, uppercase, 0.12em letter-spacing, `var(--ink-muted)` default, `var(--accent)` on hover). This row intentionally duplicates the mobile footer social row so contact links are always one tap away while the menu is open.

**A11y treatment.** Reuses the v1.0 shape plus the Phase 7 ChatWidget focus-trap pattern:

- `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation menu"`
- Focus trap: Tab cycles within the overlay, Shift+Tab reverse-cycles, focus is **re-queried on every keypress** (matches Phase 7 `src/scripts/chat.ts` `setupFocusTrap` — see STATE.md "Focus trap re-queries focusable elements on every Tab keypress")
- Escape closes the overlay
- Click-outside on the backdrop closes the overlay
- Close button (top-right ×) closes the overlay
- `body { overflow: hidden }` while open
- Focus returns to the hamburger trigger on close
- Close on any nav-link click (so tapping a link dismisses the menu before the page navigates)

**Motion stance — no entrance animation.** The v1.0 `@keyframes menuLinkIn` 60ms-stepped staggered link reveal does **not** survive into the new `MobileMenu.astro`. The overlay opens instantly via display toggle only. Per §6.1, orchestrated entrance animations are dead. The only transition allowed inside the overlay is functional hover/focus color change on the link rows and the social row (consistent with §6.2 Tailwind `transition-colors` allowance). No translation, no opacity fade-in, no stagger delay.

**Props.** The new `MobileMenu.astro` takes no props; it reads `Astro.url.pathname` internally (matching Header per §5.1 / Phase 9 D-27) to compute the active link.

---

## 6. Motion (the pragmatic motion line)

The editorial system is **mostly motionless**. The mockup is a deliberately quiet, monk-mode visual contract. But Phase 8's user explicitly chose a **pragmatic motion line** rather than mockup.html's strict zero-motion posture (D-13). This section documents that line so Phase 9 does **not** second-guess and strip out the surviving Tailwind state transitions thinking they are leftover v1.0 noise.

### 6.1 Dead — removed in Phase 8, never reintroduced

- **GSAP** — `gsap` is uninstalled from `package.json`. No `import gsap from "gsap"` anywhere. No GSAP plugins (ScrollTrigger, SplitText, etc.). The `npm uninstall gsap` step is permanent.
- **Scroll-trigger animations** — every scroll-driven reveal, parallax effect, pin-to-viewport animation is gone. No `[data-animate]` opacity stub. No IntersectionObserver wiring for fade-in.
- **Canvas hero** — `CanvasHero.astro` is deleted. No `<canvas>`, no simplex noise, no requestAnimationFrame loop, no WebGL.
- **View transitions** — `<ClientRouter />` is removed from `BaseLayout.astro`. No `::view-transition-*` `@keyframes`. No `astro:before-preparation` listener. No cross-page morph animations. Every page navigation is a full reload.
- **`[data-animate]` machinery** — the entire opacity-stub system is gone from `global.css`.
- **`.theme-transitioning` rules** — the dark-mode flicker-prevention CSS is gone (because dark mode is gone).
- **Chat bubble GSAP motion** — `chat.ts` GSAP call sites are no-op'd: `animatePanelOpen`, `animatePanelClose`, `animateMessageAppear`, `startPulse`, `startTypingDots` (D-27). The chat panel opens/closes instantly. The bubble does not pulse. The typing dots do not bounce. **Chat motion is a known visible regression scoped to Phase 10 (CHAT-02 restyle) for restoration via CSS `@keyframes` if desired.**

### 6.2 Allowed to survive — functional hover/focus state only

- **Tailwind `transition-colors` utility classes** — used on nav links, contact links, anywhere a hover state changes color
- **`.nav-link-hover` underline animation** — the existing `global.css` rule that animates the underline of hovered nav links is kept
- **Footer icon hover `hover:-translate-y-0.5`** — if Footer ever gains social-icon links, the existing 0.5-unit translate on hover is allowed
- **`.chat-copy-btn` opacity transition** — the chat widget's "copy code block" button fades in/out on hover; this CSS opacity transition is kept
- **All CSS `transition` declarations on state changes** (`:hover`, `:focus`, `:active`) — kept on a case-by-case basis. Phase 9 should not blanket-strip them.
- **`work-arrow` opacity 120ms ease transition** — the WorkRow hover arrow reveal is part of the spec (§5.5), not a survivor — it is **required**.
- **Active nav-link accent underline** — not a transition, but a static text-decoration. Required.

### 6.3 `prefers-reduced-motion`

`prefers-reduced-motion: reduce` is **respected** trivially: most motion is already gone, and the surviving transitions are all sub-200ms color/opacity/translate state changes that pose no vestibular risk. The `@media (prefers-reduced-motion: reduce) { /* stub */ }` block in `global.css` may be retained as a no-op stub or deleted at Claude's discretion (08-CONTEXT.md Claude's discretion list).

### 6.4 Why this matters

If Phase 9 reads the mockup.html `@media (prefers-reduced-motion: reduce)` comment ("No animations in this mockup — stub retained intentionally") and concludes "the system is motionless, I should delete `transition-colors` from every nav link," it will produce a worse site. Hover state without a 120ms color transition feels broken on desktop. The pragmatic motion line is the explicit answer to that temptation: **state transitions stay; orchestrated motion goes.**

---

## 7. Accent usage

`--accent` (`#E63946`) is the **only** non-neutral color in the system. It is used for **signal** — to direct the eye to interactive elements and status — never for decoration.

### 7.1 Where accent IS allowed

| Use                                          | Mockup line(s)        |
| -------------------------------------------- | --------------------- |
| Active nav-link underline (1.5px, offset 6px) | 137-143               |
| Trailing dot on homepage display wordmark (`·`) | 170, 368            |
| `StatusDot` 6px circle (`AVAILABLE FOR WORK`) | 175-182, 374         |
| `WorkRow` hover title underline + arrow reveal | 244-254, 397-399    |
| Email hover underline on contact page         | 293-298               |
| Contact mono link hover color (`GitHub` etc.) | 309                   |
| Chat bubble background (Phase 8 carryover, restyled in Phase 10) | D-19         |
| Chat focus ring                                | (Phase 10 restyle)    |

### 7.2 Where accent is NEVER allowed

- **Large surfaces** — no accent backgrounds on full-bleed sections, no accent banners, no accent panels
- **Body text** — `.body` paragraphs are always `var(--ink)`, never accent
- **Decorative flourishes** — no accent borders around images, no accent dividers between sections (the `--rule` color is the divider)
- **Icon fills for non-interactive elements** — if an icon is decorative (not a link), it is `--ink-muted` or `--ink-faint`, never accent
- **Gradients** — no `linear-gradient(--accent, ...)`, no radial gradients, no SVG fills with accent stops
- **Hover states for non-interactive text** — only links/buttons get accent on hover

### 7.3 The signal rule

> **If a user can't click it, it can't be accent.** The only exceptions are the homepage trailing dot (`·`) which is a wordmark flourish and the `StatusDot` which is a status indicator for `AVAILABLE FOR WORK`.

---

## 8. Anti-patterns

These are things Phase 9, 10, and 11 must **not reintroduce**. Each entry lists the rule and a one-sentence rationale.

- **No `oklch()` values** — locked to flat hex per DSGN-02. The six-token palette is the entire color system; `oklch()` would break the locked-token rule.
- **No theme toggle** — single light theme per DSGN-03. There is no `<ThemeToggle />` component anywhere. The user has explicitly chosen one theme.
- **No `localStorage.theme` reads/writes** — dead per DSGN-03. The FOUC inline script in `BaseLayout.astro` is gone; no `astro:after-swap` listener re-applies theme.
- **No GSAP import anywhere** — `npm uninstall gsap` is permanent. Re-adding GSAP requires reverting Phase 8 sign-off, which is a milestone-level decision.
- **No `<ClientRouter />`** — view transitions are removed. Phase 10 may re-evaluate for chat cross-page persistence, but must reconcile with CHAT-01 (D-29) rather than silently re-adding the router.
- **No card layouts or shadows for project/work listings** — the editorial format is **numbered rows only**. No `box-shadow`, no `border-radius` larger than `0`, no card backgrounds. The work list is rows with rule borders.
- **No canvas hero / WebGL / Three.js** — `CanvasHero.astro` is gone. No `<canvas>` element on the homepage. No WebGL contexts anywhere on the site.
- **No skill icons, progress bars, or narrative graphics on About** — the About page is intro line + 3 paragraphs, no SVG illustrations, no skill grids, no progress meters, no `<img>` tags rendering tech logos.
- **No contact form** — direct links only (`mailto:`, GitHub, LinkedIn, X). There is no `<form>` on the contact section. CTA buttons are also forbidden — only inline mono links.
- **No Inter or IBM Plex Mono references** — Geist / Geist Mono only. The Astro Fonts API config has zero references to `Inter` or `IBM Plex Mono`. CSS does not reference them either.
- **No `--token-*` CSS variable names** — use `--bg`, `--ink`, `--ink-muted`, `--ink-faint`, `--rule`, `--accent`. The v1.0 prefix `--token-` is dead. Every chat widget reference is rewritten to the new names (see §9).
- **No fluid sizing variables** — `clamp()` lives inside the role classes (`.display`, `.h1-section`, `.lead`) only. There is no `--font-size-display: clamp(...)` token. Phase 9 primitives apply role classes, not inline `clamp()`.
- **No `.theme-transitioning` class anywhere** — the v1.0 flicker-prevention CSS is gone. Phase 10 must not re-add it under any name.
- **No semantic color aliases** — there is no `--color-primary`, `--color-on-bg`, `--color-warning`, `--color-success`. The six tokens are it.
- **No view transition `::view-transition-*` keyframes** — they were removed with `<ClientRouter />`. Do not re-add CSS for view transitions in any form.
- **No new color additions without amending this file** — if Phase 9, 10, or 11 wants a 7th color, it must amend §2 first via a tracked commit. Silent additions are forbidden.

---

## 9. Chat Widget Token Map

This subsection captures the **D-19 + D-27 + D-28** chat widget token mapping table verbatim. The chat widget (Phase 7) was built against a v1.0 `--token-*` namespace; Phase 8 refactors every chat reference to the new editorial token names so there is **one** naming system in the codebase. Phase 10's CHAT-02 restyle then inherits a clean target.

### 9.1 Token mapping table

| Old v1.0 token         | New editorial token | Notes                                                              |
| ---------------------- | ------------------- | ------------------------------------------------------------------ |
| `--token-bg-primary`   | `--bg`              | warm off-white                                                     |
| `--token-bg-secondary` | `--rule`            | divider tint `#E4E4E7` — closest "subtle surface tint" available  |
| `--token-text-primary` | `--ink`             | black                                                              |
| `--token-text-secondary` | `--ink-muted`     | grey                                                               |
| `--token-text-muted`   | `--ink-faint`       | light grey                                                         |
| `--token-accent`       | `--accent`          | signal red                                                         |
| `--token-accent-hover` | `--accent`          | no separate hover variant; chat hover uses the same accent        |
| `--token-border`       | `--rule`            | `#E4E4E7`                                                          |
| `--token-border-hover` | `--ink-muted`       | stronger borders on hover                                          |
| `--token-success`      | `--accent`          | copy-success signal-positive (no green in this palette; D-19)     |
| `--token-destructive`  | `--accent`          | chat 500-char limit color (D-28)                                   |
| `--token-warning`      | `--accent`          | chat 450-char limit color (D-28)                                   |

### 9.2 Phase 8 chat scope vs Phase 10 chat scope

**Phase 8 only** does the token name refactor:

- `src/components/chat/ChatWidget.astro` — inline `style="background: var(--token-accent)"` on the floating bubble updates to `var(--accent)`
- `src/styles/global.css` `.chat-*` rules (~100 lines) — find-replace token names to mockup names
- `src/scripts/chat.ts` — char-count warning code references update from `--token-destructive` / `--token-warning` to `--accent`
- `src/scripts/chat.ts` GSAP call sites are no-op'd (D-27): `animatePanelOpen`, `animatePanelClose`, `animateMessageAppear`, `startPulse`, `startTypingDots`. The `gsap.core.Tween` type annotation and `pulseAnimation` module-level variable are also removed. **The `npm uninstall gsap` step MUST land in the same commit as the chat.ts edit, or the build is red.**

**Phase 10 (CHAT-02)** does the full visual restyle:

- No cards, no shadows, no gradients on the chat panel
- Monochrome surfaces using only `--bg`, `--ink`, `--ink-muted`, `--ink-faint`, `--rule`, `--accent`
- Typography updated to Geist / Geist Mono
- Optional restoration of CSS `@keyframes`-based motion to replace the killed GSAP animations (bubble pulse, panel scale-in, typing-dot bounce) — Phase 10's call

### 9.3 Cross-page chat persistence regression (D-29)

Removing `<ClientRouter />` makes Phase 7's `transition:persist` directive a no-op. Every page navigation is a full reload, and the chat panel resets. **REQUIREMENTS.md CHAT-01 ("conversation persistence across page navigation") cannot be honored in Phase 8.** Phase 8 explicitly descopes cross-page persistence. The Phase 8 smoke test (D-26) is single-page only — multi-page navigation tests are **not** part of the gate.

Phase 10 (CHAT-02) will restore cross-page persistence via localStorage-backed message restore. CHAT-01 needs reconciliation when Phase 10 plans this work — either rewrite to match the localStorage restore model or add a CHAT-01.1 sub-requirement.

### 9.4 Chat as the regression gate

The chat widget is **the** regression gate for every Phase 8 plan. Every plan that touches `BaseLayout.astro`, `global.css`, or any shared CSS must verify chat still functions before being marked complete. The Phase 8 verification gate (D-26) requires:

1. `npm run build` succeeds with zero errors
2. `npm run lint` clean
3. `npm run check` (astro check) passes
4. **Manual chat smoke test** — start `npm run dev`, open the chat bubble on at least one stub page, send a message that triggers the Anthropic API, confirm SSE streaming response renders with Geist Mono in `<code>` blocks, confirm focus trap works on Tab, confirm the bubble closes cleanly
5. `npm run test` (vitest) — all existing tests remain green

---

## 10. Changelog

- 2026-04-07 — v1.1 initial lock (Phase 8)
