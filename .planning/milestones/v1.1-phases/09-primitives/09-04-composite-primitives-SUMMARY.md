---
phase: 09-primitives
plan: 04
subsystem: ui
tags: [astro, primitives, editorial, components, composite, header, footer, work-row, mobile-menu, a11y, focus-trap]

# Dependency graph
requires:
  - phase: 09-primitives
    provides: "src/styles/global.css LAYER 3 helpers (.container, .label-mono, .meta-mono, .tabular, .h2-project) and six-token palette (--bg/--ink/--ink-muted/--ink-faint/--rule/--accent) from plan 09-02"
  - phase: 09-primitives
    provides: "design-system/MASTER.md §5.1/§5.2/§5.5/§5.8 prop contracts (plan 09-01 locked amendments including D-06 container query, D-10 mobile footer stack, D-27 internal pathname)"
  - phase: 09-primitives
    provides: "NextProject.astro hover grammar forward contract from plan 09-06 (opacity-only accent arrow reveal, 120ms ease) that WorkRow.astro must honor"
  - phase: 07
    provides: "src/scripts/chat.ts setupFocusTrap pattern (lines 318-350) + init lifecycle pattern (lines 733-742 — DOMContentLoaded + astro:page-load pair)"
provides:
  - "src/components/primitives/Header.astro — sticky 72px editorial header with JACK CUTRARA mono wordmark + 3-link mono nav (works/about/contact) + active-link accent underline, container query at 380px swaps inline nav for hamburger trigger"
  - "src/components/primitives/Footer.astro — 64px single-row desktop footer / 3-row vertical stack (copy · social row · built) at <768px per D-10"
  - "src/components/primitives/WorkRow.astro — 56px/1fr/auto grid numbered row with opacity-only accent arrow reveal on hover + :focus-visible"
  - "src/components/primitives/MobileMenu.astro — full-screen role=dialog overlay with per-Tab focus trap, Escape/backdrop close, scroll lock, focus return, BLOCKER 2-compliant init lifecycle (reset before guard + DOMContentLoaded + astro:page-load)"
affects: [09-05, 09-07, 09-08, 10-page-port]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-02: All four composite primitives live in src/components/primitives/"
    - "D-03: Zero Tailwind utility classes in primitive markup — only editorial named classes (.container, .label-mono, .meta-mono, .tabular, .h2-project) plus component-scoped modifiers"
    - "D-04 + D-27: Header and MobileMenu take NO props — both read Astro.url.pathname internally and compute active nav state via isActive() helpers with identical /projects/about/contact logic"
    - "D-06: Container query (@container max-width: 380px) on Header's .header-inner swaps inline nav ↔ hamburger at the header's actual rendered width, not viewport width. container-type: inline-size on .header-inner establishes the query context"
    - "D-07: Hamburger trigger (#menu-trigger) lives INSIDE Header.astro. MobileMenu.astro queries it from the DOM — no cross-component prop wiring"
    - "D-08: MobileMenu focus trap selector matches src/scripts/chat.ts:335 verbatim (`button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])`) and re-queries on EVERY Tab keypress — confirmed by grep across src/"
    - "D-09: NO staggered entrance animation in MobileMenu (@keyframes menuLinkIn from v1.0 is intentionally absent). Display toggle only — .is-open class flips display:none → display:flex"
    - "D-10: Footer mobile stack at <768px inserts GITHUB·LINKEDIN·X·EMAIL mono social row between copyright and BUILT WITH caption via display: inline-flex inside a flex-direction: column parent"
    - "D-14: Component-local layout lives in each primitive's scoped <style> block — .site-header/.header-inner/.nav-link/.menu-trigger in Header; .site-footer/.footer-inner/.footer-social/* in Footer; .work-row/.work-num/.work-title/.work-stack/.work-meta/.work-arrow in WorkRow; .mobile-menu/.mobile-menu-panel/.mobile-menu-nav/.mobile-menu-link/.mobile-menu-social/* in MobileMenu"
    - "D-16: Only six-token palette referenced (--bg, --ink, --ink-muted, --ink-faint, --rule, --accent). Zero inline hex values, zero new tokens, zero oklch() calls anywhere in the four new files"
    - "D-22 forward contract honored: WorkRow's .work-arrow { opacity: 0; transition: opacity 120ms ease; } + .work-row:hover/:focus-visible .work-arrow { opacity: 1; } matches the hover grammar NextProject.astro canonically demonstrates from plan 09-06 — identical timing, identical property, no transform"
    - "BLOCKER 2 pattern: MobileMenu init lifecycle is decomposed into three functions (resetMobileMenuState → bindMobileMenuListeners → initMobileMenu orchestrator) so the unconditional state reset ALWAYS runs BEFORE the `menuInitialized === \"true\"` double-bind guard — critical for View Transitions re-init on navigation (astro:page-load re-runs initMobileMenu which resets state even if listeners are already bound)"

key-files:
  created:
    - src/components/primitives/Header.astro
    - src/components/primitives/Footer.astro
    - src/components/primitives/WorkRow.astro
    - src/components/primitives/MobileMenu.astro
  modified: []

key-decisions:
  - "[Phase 09-04] MobileMenu link font-size chosen: 1.75rem (INFO 1 discretion range was {1.75rem | clamp(1.25rem, 2vw, 1.625rem)}) — picked 1.75rem for tighter visual rhythm with the 3-link stack and cadence parity with the sans-serif body .h2-project title size. The clamp() alternative was lead-text-sized and would have felt anemic in the full-screen dialog context"
  - "[Phase 09-04] MobileMenu close button uses a literal '×' glyph (Unicode U+00D7) inside a 40x40px button rather than an SVG line-cross — matches D-07/D-10 anti-icon stance, keeps runtime surface zero-JS, and inherits --ink color via currentColor. The v1.0 MobileMenu's 18x18 SVG cross was intentionally NOT ported"
  - "[Phase 09-04] MobileMenu backdrop uses a dedicated <div class='mobile-menu-backdrop' data-menu-close> rather than binding the click handler to the root .mobile-menu element — this ensures clicks inside the .mobile-menu-panel (which sits ABOVE the backdrop with position: relative) do not close the menu, while clicks on the exposed backdrop edge do. The data-menu-close attribute is the DOM hook the script queries rather than a class selector, matching Phase 7 chat.ts attribute-hook patterns"
  - "[Phase 09-04] Header's active-link underline threshold matches MobileMenu's verbatim (text-decoration-color var(--accent), text-decoration-thickness 1.5px, text-underline-offset 6px) so a mobile user switching between the inline nav (at container width ≥381px) and the hamburger overlay (at ≤380px) sees the same active-state treatment on both surfaces — cross-primitive consistency at the design-token level"
  - "[Phase 09-04] WorkRow intentionally declares its own font-family/size/letter-spacing for .work-stack instead of composing .meta-mono because MASTER §5.5 specifies letter-spacing: 0.12em (uppercase like .label-mono) while the standard .meta-mono is 0.02em — this is a documented deliberate override, not a missed composition opportunity"
  - "[Phase 09-04] Footer.astro separates .footer-social from the desktop layout via display: none by default + @media (max-width: 767px) { display: inline-flex } rather than via two separate element trees — single source of truth for the links, mobile-only visibility handled purely in CSS with zero JS or Astro conditionals"

patterns-established:
  - "Composite primitive internal-pathname pattern: Header and MobileMenu both declare a const navLinks array and an isActive(href) helper with identical /projects/about/contact startsWith logic — when a page ships a new nav destination, BOTH files get updated together (documented as a paired-edit contract for plan 09-05)"
  - "Dialog overlay DOM sibling pattern: MobileMenu renders a single <div class='mobile-menu'> with fixed positioning and a backdrop-sibling inside. The trigger (#menu-trigger) lives in Header.astro. Both components sit as siblings in BaseLayout per plan 09-05. Script lookup uses document.querySelector('.mobile-menu') + document.getElementById('menu-trigger') — no prop passing, no client:* directives"
  - "BLOCKER-2-compliant init lifecycle (ALWAYS reset + guarded bind): split init into resetState() [idempotent, runs every call] + bindListeners() [guarded via dataset flag, runs once per element] + initOrchestrator() [calls reset first, then guard, then bind]. Register BOTH DOMContentLoaded and astro:page-load as entry points. This is the canonical pattern any View-Transitions-aware primitive should use"
  - "Opacity-only arrow reveal hover grammar: all editorial row/link primitives that show a hover arrow (WorkRow, NextProject) use { opacity: 0; transition: opacity 120ms ease; } on the arrow + { opacity: 1 } on .row:hover .arrow AND .row:focus-visible .arrow — zero transform, zero translate, identical timing. WorkRow now CANONICALLY establishes this pattern that plan 09-06 forward-committed to"

requirements-completed: []

# Metrics
duration: 7min
completed: 2026-04-08
---

# Phase 9 Plan 04: Composite Primitives Summary

**Created the four composite primitives (Header, Footer, WorkRow, MobileMenu) that cover every piece of visible chrome in mockup.html — sticky 72px editorial header with container-query hamburger at 380px, 64px footer with mobile 3-row stack, numbered work-list row with opacity-only accent arrow reveal, and full-screen dialog overlay with BLOCKER-2-compliant init lifecycle + per-Tab focus-trap re-query that matches src/scripts/chat.ts verbatim. The primitive library is now complete; plan 09-05 can swap BaseLayout to consume these new primitives and delete the old v1.0 chrome.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-08T19:45:01Z
- **Completed:** 2026-04-08T19:52:29Z
- **Tasks:** 4
- **Files created:** 4 (734 total lines across all four composite primitives)

## Accomplishments

- **Header.astro (162 lines)** — Sticky 72px editorial header with JACK CUTRARA mono wordmark on the left and a 3-link mono nav on the right (`/projects` → works, `/about` → about, `/contact` → contact). Active link gets the accent-red underline (text-decoration-color var(--accent), 1.5px thickness, 6px offset) via a scoped `.nav-link.is-active` selector. Below 380px rendered container width (NOT viewport width — `container-type: inline-size` on `.header-inner` + `@container (max-width: 380px)` rule), the inline `.site-nav` hides and a hamburger trigger (`#menu-trigger`) reveals. D-27 compliance: no `currentPath` prop — `const currentPath = Astro.url.pathname` internally. Header has NO `<script>` block; the hamburger click wiring lives in MobileMenu.astro, which queries `#menu-trigger` by ID.

- **Footer.astro (116 lines)** — Desktop (≥768px): single-row 64px flex with `© {year} JACK CUTRARA` on the left, `BUILT WITH ASTRO · TAILWIND · GEIST` on the right, and the `.footer-social` nav hidden via `display: none`. Mobile (<768px): 3-row vertical stack (D-10 amendment) — `.site-footer` switches to `height: auto; padding-top: 20px; padding-bottom: 20px`, `.footer-inner` switches to `flex-direction: column; gap: 12px`, and `.footer-social` flips to `display: inline-flex` so it presents the `GITHUB · LINKEDIN · X · EMAIL` mono link row between the copyright and built caption. Copyright year computed at build time via `new Date().getFullYear()`. External social links get `target="_blank"` + `rel="noopener noreferrer"`; `mailto:` does not. Zero SVG icons anywhere.

- **WorkRow.astro (99 lines)** — Single numbered row in the editorial work list with a three-column grid (`grid-template-columns: 56px 1fr auto`, `gap: 24px`, `padding: 28px 0`, `border-bottom: 1px solid var(--rule)`). Number column uses `.meta-mono .tabular .work-num` with a deliberate `font-size: 1rem; font-weight: 500` override of the standard 0.8125rem/400 per MASTER §5.5. Title column composes `.h2-project .work-title` with a scoped `margin-bottom: 12px`. Stack column redeclares its own font (`0.8125rem`, `letter-spacing: 0.12em`, uppercase mono) because MASTER §5.5 uses the .label-mono spacing not the .meta-mono spacing. Meta column has the year and a `.work-arrow` (unicode `→`) that transitions `opacity: 0 → 1` over 120ms on `.work-row:hover` AND `.work-row:focus-visible`. Title gets an underline (accent color, 1.5px thickness, 4px offset) on the same hover/focus pair. NO translate, NO transform, NO color shift — opacity-only arrow reveal honors the NextProject forward contract from plan 09-06 exactly.

- **MobileMenu.astro (357 lines)** — Full-screen dialog overlay (`role="dialog"`, `aria-modal="true"`, `aria-label="Navigation menu"`) that is always in the DOM (`display: none` by default) and toggles to `display: flex` via a `.is-open` class. Contains: (1) a top-right close button with a literal `×` glyph inside a 40x40px button, (2) three stacked `.mobile-menu-link` nav links (1.75rem mono, 0.08em letter-spacing, active-link accent underline matching Header's), and (3) a `.mobile-menu-social` bottom row with the `GITHUB · LINKEDIN · X · EMAIL` mono link row. Backdrop (`<div class="mobile-menu-backdrop" data-menu-close>`) sits under the panel with `position: absolute; inset: 0; background: var(--bg)` so clicks on the exposed backdrop edge close the menu but clicks inside `.mobile-menu-panel` (which has `position: relative`) do not. Client script is decomposed into three functions per BLOCKER 2: `resetMobileMenuState(menu)` (unconditional idempotent state cleanup — removes `.is-open`, sets `aria-hidden="true"`, unlocks body scroll, resets trigger aria state), `bindMobileMenuListeners(menu)` (event-listener binding — trigger click toggle, close-button click, backdrop click, nav-link click close-before-navigate, keydown handler), and `initMobileMenu()` (orchestrator that calls `resetMobileMenuState(menu)` FIRST then early-returns on the `menu.dataset.menuInitialized === "true"` guard then calls `bindMobileMenuListeners(menu)`). Init is registered BOTH via `DOMContentLoaded` (or direct call if `document.readyState !== "loading"`) AND via `astro:page-load` — the latter is forward-compat insurance for Phase 10 ClientRouter reintroduction. Focus trap handler re-queries focusable elements on EVERY Tab keypress using a selector string verbatim-matching src/scripts/chat.ts line 335: `'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'`. Escape closes. Close button receives focus on open; `#menu-trigger` gets focus back on close. NO `@keyframes menuLinkIn`, NO `animation:`, NO `translateY`, NO SVG icons.

- **All verification passes:**
  - `pnpm run check`: 0 errors, 0 warnings, 2 pre-existing hints (the JsonLd `is:inline` hint + the Container.astro `ts(6196)` hint inherited from plan 09-03 — neither caused by this plan)
  - `pnpm run build`: exits 0, "Complete!", 10 pages prerendered (index, about, contact, projects, 6 case studies), sitemap generated, Cloudflare Pages compat rearrange succeeds, Vite server build in ~7.1s
  - `pnpm run lint`: 0 errors, 2 pre-existing warnings in generated `worker-configuration.d.ts` (unused eslint-disable directives) — unrelated to this plan

- **All negative regression checks pass (per plan verification block):**
  - D-03 Tailwind-utility grep (`class="[^"]*\b(bg-|text-ink|flex |grid |px-|py-|mx-|my-|md:|lg:)`) across `src/components/primitives/*.astro` → **0 matches**
  - D-16 inline-hex grep (`#(FAFAF7|0A0A0A|52525B|A1A1AA|E4E4E7|E63946)`) across `src/components/primitives/*.astro` → **0 matches**
  - MASTER §6.1 GSAP-import grep (`import gsap|from "gsap"|from 'gsap'`) across `src/components/primitives/*.astro` → **0 matches**
  - D-26 chat hands-off: `git diff --stat src/components/chat/ src/scripts/chat.ts src/data/portfolio-context.json` → **empty** (no changes)
  - Focus-trap selector parity: grep of the verbatim selector string across `src/` returns exactly 2 files (`src/components/primitives/MobileMenu.astro` + `src/scripts/chat.ts`) — confirms byte-identical match with the chat.ts setupFocusTrap selector

## Task Commits

1. **Task 1: Header.astro** — `6b62b9e` (feat)
2. **Task 2: Footer.astro** — `10f676b` (feat)
3. **Task 3: WorkRow.astro** — `262f15d` (feat)
4. **Task 4: MobileMenu.astro** — `e9fb4fe` (feat)

_Plan metadata commit will bundle SUMMARY.md, STATE.md, and ROADMAP.md separately._

## Files Created/Modified

- `src/components/primitives/Header.astro` — New file, 162 lines. Sticky editorial header with internal pathname, container-query hamburger, scoped styles. Contains: frontmatter script with `currentPath = Astro.url.pathname`, `navLinks` array, `isActive()` helper; markup with `<header class="site-header">` → `<div class="container header-inner">` → wordmark anchor + `<nav class="site-nav">` + `<button id="menu-trigger" aria-controls="mobile-menu">`; scoped `<style>` block with `.site-header`, `.header-inner` (container-type: inline-size), `.wordmark`, `.site-nav`, `.nav-link`, `.nav-link.is-active`, `.menu-trigger`, `.menu-trigger-bars`, and the `@container (max-width: 380px)` rule.
- `src/components/primitives/Footer.astro` — New file, 116 lines. Desktop single-row + mobile 3-row stack footer. Contains: frontmatter script with `year` and `socialLinks` array; markup with `<footer class="site-footer">` → `<div class="container footer-inner">` → copy span + `<nav class="footer-social">` + built span; scoped `<style>` block with `.site-footer`, `.footer-inner`, `.footer-copy`, `.footer-built`, `.footer-social`, `.footer-social-link`, `.footer-social-sep`, and `@media (max-width: 767px)` mobile-stack override.
- `src/components/primitives/WorkRow.astro` — New file, 99 lines. Numbered work-row with opacity-only accent arrow. Contains: frontmatter script with `interface Props { number, title, stack, year, href }` and destructure; markup with `<a class="work-row">` → `.work-num` + `.work-body` (title + stack) + `.work-meta` (year + arrow); scoped `<style>` block with `.work-row` (56px/1fr/auto grid), `.work-num`, `.work-title`, `.work-stack`, `.work-meta`, `.work-arrow`, plus `:hover`/`:focus-visible` compound selectors for the title underline and arrow reveal.
- `src/components/primitives/MobileMenu.astro` — New file, 357 lines. Full-screen dialog overlay with BLOCKER-2 init lifecycle + per-Tab focus trap. Contains: frontmatter script with `currentPath = Astro.url.pathname`, `navLinks` + `socialLinks` arrays, `isActive()` helper; markup with `<div id="mobile-menu" class="mobile-menu" role="dialog" aria-modal="true" aria-hidden="true">` containing `.mobile-menu-backdrop` + `.mobile-menu-panel` → `.mobile-menu-top` (close button) + `.mobile-menu-nav` (3 links) + `.mobile-menu-social` (4 links); scoped `<style>` block with all overlay/panel/link/social selectors; `<script>` block with `resetMobileMenuState()`, `bindMobileMenuListeners()` (containing `openMenu`, `closeMenu`, `handleKeyDown` closures), `initMobileMenu()` orchestrator, `DOMContentLoaded` initial-load path, and `astro:page-load` forward-compat listener.

## Decisions Made

All six key-decisions in the frontmatter are implementation-level surfaces from executing the plan's `<action>` blocks verbatim. The most novel are:

**MobileMenu link font-size 1.75rem (INFO 1 discretion).** The plan allowed `{1.75rem | clamp(1.25rem, 2vw, 1.625rem)}` and I picked 1.75rem — it matches `.h2-project` body font size for tighter cadence with the editorial type scale and gives the 3-link stack the visual weight the full-screen dialog needs.

**Close button glyph: literal `×` (U+00D7) inside a 40x40 button.** The v1.0 MobileMenu used an 18x18 SVG line-cross; this rebuild intentionally does NOT port that per D-07/D-10 (no SVG icons). `currentColor` + `var(--ink)` means the glyph inherits the right hue without an extra token reference.

**Backdrop via dedicated sibling div with `data-menu-close` attribute.** Rather than binding the click handler to `.mobile-menu` root, the backdrop is its own `<div class="mobile-menu-backdrop" data-menu-close>` positioned absolutely under the `.mobile-menu-panel` (which has `position: relative`). This guarantees clicks inside the panel do NOT close the menu. The `data-menu-close` attribute — not a class — is the DOM hook the script queries, matching Phase 7 chat.ts attribute-hook patterns.

**Paired-edit contract documented for Header + MobileMenu.** Both files declare their own `navLinks` array and their own `isActive()` helper with identical `/projects`/`/about`/`/contact` startsWith logic. When a page ships a new nav destination, BOTH files must be updated together. This is a deliberate duplication trade (vs. lifting to a shared module) — keeps each primitive a zero-import self-contained unit at the cost of a paired-edit hazard that is documented here.

**WorkRow's `.work-stack` redeclares its own font rather than composing `.meta-mono`.** MASTER §5.5 specifies `letter-spacing: 0.12em` (the `.label-mono` spacing) but `.meta-mono` uses `0.02em`. This is a documented override in the mockup and MASTER — the redundant declaration is intentional, not a missed composition opportunity.

## Deviations from Plan

**None.** Plan executed exactly as written. The `<action>` block for each of the four tasks was transcribed verbatim into the target file with zero content modifications. Every positive `acceptance_criteria` check passes:

- **Header.astro**: `const currentPath = Astro.url.pathname` ✓, `JACK CUTRARA` ✓, all three nav href+label pairs ✓, `id="menu-trigger"` ✓, `aria-controls="mobile-menu"` ✓, `aria-expanded="false"` ✓, `<style>` block ✓, `position: sticky` ✓, `height: 72px` ✓, `container-type: inline-size` ✓, `@container (max-width: 380px)` ✓, `text-decoration-color: var(--accent)` ✓, `text-decoration-thickness: 1.5px` ✓, `text-underline-offset: 6px` ✓, `letter-spacing: 0.12em` ✓, `font-size: 0.875rem` ✓, `font-size: 0.75rem` ✓. Zero `<script>` block. Zero Tailwind utilities. Zero inline hex values. Zero `import gsap`.

- **Footer.astro**: `const year = new Date().getFullYear()` ✓, `BUILT WITH ASTRO · TAILWIND · GEIST` ✓, `© {year} JACK CUTRARA` ✓, all four social links ✓, `class="site-footer"` ✓, `class="container footer-inner"` ✓, `class="meta-mono footer-copy tabular"` ✓, `class="meta-mono footer-built"` ✓, `<style>` block ✓, `margin-top: 96px` ✓, `height: 64px` ✓, `border-top: 1px solid var(--rule)` ✓, `@media (max-width: 767px)` ✓, `flex-direction: column` inside mobile media query ✓, `color: var(--ink-faint)` for footer-copy/built ✓, `color: var(--ink-muted)` for footer-social-link ✓, `color: var(--accent)` on hover ✓. Zero SVG. Zero Tailwind. Zero inline hex. Zero `hover:-translate-y-0.5`. Zero `<script>`.

- **WorkRow.astro**: `interface Props` ✓, all five prop types ✓, all seven `class="..."` strings ✓, `aria-hidden="true"` on arrow ✓, `grid-template-columns: 56px 1fr auto` ✓, `gap: 24px` ✓, `padding: 28px 0` ✓, `border-bottom: 1px solid var(--rule)` ✓, `opacity: 0` on .work-arrow ✓, `transition: opacity 120ms ease` ✓, `text-decoration-color: var(--accent)` ✓, `text-decoration-thickness: 1.5px` ✓, `text-underline-offset: 4px` ✓, `:focus-visible` ✓, `font-size: 1rem` (work-num) ✓, `font-size: 0.8125rem` (work-stack) ✓, `letter-spacing: 0.12em` (work-stack) ✓. Zero Tailwind. Zero `translate-x-` / `transform:.*translate`. Zero inline hex. Zero `<script>`.

- **MobileMenu.astro**: `const currentPath = Astro.url.pathname` ✓, `id="mobile-menu"` ✓, `role="dialog"` ✓, `aria-modal="true"` ✓, `aria-label="Navigation menu"` ✓, `id="menu-close"` ✓, `data-menu-close` ✓, `class:list={["mobile-menu-link"` ✓, all four social link labels including `label: "X"` ✓, `mailto:jackcutrara@gmail.com` ✓, `<style>` block ✓, `z-index: 60` ✓, `position: fixed` ✓, `.mobile-menu.is-open` ✓, `font-size: 1.75rem` on mobile-menu-link ✓, `text-decoration-color: var(--accent)` on is-active ✓, `<script>` block ✓, `function initMobileMenu` ✓, `function resetMobileMenuState` ✓, `function bindMobileMenuListeners` ✓, `astro:page-load` ✓, **BLOCKER 2 line-order invariant: `resetMobileMenuState(menu)` on line 336 precedes `menuInitialized === "true"` check on line 340 ✓** (verified by grep -n), `document.getElementById("menu-trigger")` ✓, `document.getElementById("menu-close")` ✓, `document.querySelector<HTMLElement>(".mobile-menu")` ✓, `addEventListener("keydown"` ✓, `if (e.key === "Escape")` ✓, `if (e.key !== "Tab") return` ✓, `querySelectorAll<HTMLElement>(` inside handleKeyDown Tab branch ✓, `document.body.style.overflow = "hidden"` inside openMenu ✓, `document.body.style.overflow = ""` count = 2 ✓ (closeMenu + resetMobileMenuState), `trigger!.focus()` inside closeMenu ✓, `menuInitialized` ✓, `DOMContentLoaded` ✓. Zero `@keyframes menuLinkIn`. Zero `animation:` / `animation-delay:`. Zero `translateY` on mobile-menu-link. Zero Tailwind. Zero inline hex. Zero `<svg>`. Zero `import gsap` / `import.*motion`.

## Issues Encountered

**Pre-existing astro-check hints (2).** `pnpm run check` reports 2 hints, both inherited from earlier Phase 9 plans and unrelated to 09-04:
1. `src/components/JsonLd.astro:8:9` — `astro(4000)`: script tag treated as `is:inline`. Pre-existing since Phase 9 baseline. D-23 verify-only contract forbids edits to JsonLd.astro.
2. `src/components/primitives/Container.astro:14:11` — `ts(6196)`: `'Props' is declared but never used`. Inherited from plan 09-03 and documented in its SUMMARY as a cosmetic artifact the plan explicitly requires to stay in place.

**Pre-existing lint warnings (2).** `pnpm run lint` reports 2 warnings in `worker-configuration.d.ts` (generated Cloudflare Workers types file) — unused eslint-disable directives. Pre-existing, unrelated to this plan, and outside the source surface this plan modifies.

**Pre-existing lightning-css warnings during build.** `pnpm run build` continues to emit four `Unexpected token Delim('*')` warnings from template detection surfaces (first logged to `.planning/phases/09-primitives/deferred-items.md` in plan 09-02). Plan 09-04 introduces zero `[var(--token-*)]` arbitrary-value utilities, so these warnings remain out of scope per the GSD scope boundary rule.

**CRLF line-ending warnings on all four new files.** Git reported `LF will be replaced by CRLF the next time Git touches it` for each commit. This is standard Windows behavior under the repo's `core.autocrlf=true` default and does not affect the committed content — files are stored with LF in the index per .gitattributes, and checked out with CRLF in the working tree. No action needed.

## Build Observations

- **Astro/Vite compiles all four composite primitives cleanly.** Zero module-resolution errors. The MobileMenu `<script>` block is TypeScript and processed by the Astro/Vite pipeline (no `is:inline` directive), so the `HTMLElement`, `KeyboardEvent`, `HTMLAnchorElement` generic types all type-check during astro check.
- **Scoped style hashing works across all four files.** Each `<style>` block is auto-scoped by Astro, so `.mobile-menu-link` in MobileMenu, `.nav-link` in Header, `.footer-social-link` in Footer, and `.work-title` in WorkRow cannot collide when multiple primitives render on the same page in Phase 10.
- **Orphan files (for now).** None of the four new composite primitives are imported by any existing page or layout — plan 09-05 handles the BaseLayout swap that replaces `src/components/Header.astro` + `src/components/Footer.astro` + `src/components/MobileMenu.astro` imports with the new `primitives/` versions. The build simply compiles them and proves no syntax/type errors exist. Build time unchanged from baseline (~7.1s server build).
- **MobileMenu is the ONLY primitive in the library with a `<script>` block.** All other primitives (Container, MetaLabel, StatusDot, SectionHeader, Header, Footer, WorkRow) are pure-props, zero-runtime .astro components. This keeps the zero-JS-by-default Astro architecture intact while concentrating the dialog behavior in exactly one file.
- **File size footprint:** 734 total lines across four files. Header 162 (min was 80), Footer 116 (min was 60), WorkRow 99 (min was 60), MobileMenu 357 (min was 150) — all substantially above the plan's `min_lines` artifact contracts.

## User Setup Required

None — pure .astro file creation, no environment variables, no external configuration, no package changes, no runtime changes. The primitives are orphan files until plan 09-05 wires them into BaseLayout.

## Next Phase Readiness

- **Ready for 09-05 (BaseLayout swap):** All eight Phase 9 primitives are now on disk (4 stateless from 09-03 + 4 composite from 09-04). Plan 09-05 can replace the BaseLayout imports to consume `primitives/Header.astro`, `primitives/Footer.astro`, and `primitives/MobileMenu.astro` in place of the current `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/MobileMenu.astro`. The old files can be deleted as part of the swap.
- **Ready for 09-07 (dev primitives preview):** The four composite primitives can be imported into a `/dev/primitives` preview page alongside the four stateless primitives from 09-03, visualizing the complete editorial primitive surface in isolation.
- **Ready for 09-08 (verification gate):** All eight primitives are on the new editorial token system with the locked six-token palette, zero Tailwind utilities in markup, zero GSAP imports, zero inline hex values, and all D-02..D-27 decisions honored.
- **Ready for Phase 10 (page port):** The HOME-01..04 / ABOUT-01..02 / WORK-01..03 / CONTACT-01..02 / CHAT-01..02 requirements can consume these primitives directly. Header, Footer, WorkRow, and MobileMenu will be imported into page templates (Header + Footer in BaseLayout at plan 09-05, WorkRow in the homepage work list, MobileMenu sibling to Header in BaseLayout).
- **Forward contract paid down:** WorkRow's opacity-only accent arrow reveal (120ms ease) now canonically implements the grammar NextProject.astro (from plan 09-06) forward-committed to on behalf of plan 09-04. Cross-primitive hover consistency is preserved — the editorial row grammar has a single source of truth.
- **No blockers.** Wave 4 is complete; waves 5+ (09-05/09-07/09-08) are unblocked.

## Self-Check: PASSED

- **File `src/components/primitives/Header.astro`:** FOUND (162 lines)
- **File `src/components/primitives/Footer.astro`:** FOUND (116 lines)
- **File `src/components/primitives/WorkRow.astro`:** FOUND (99 lines)
- **File `src/components/primitives/MobileMenu.astro`:** FOUND (357 lines)
- **Commit `6b62b9e`:** FOUND in git log (`6b62b9e feat(09-04): add Header primitive (MASTER §5.1 + D-06 container query)`)
- **Commit `10f676b`:** FOUND in git log (`10f676b feat(09-04): add Footer primitive (MASTER §5.2 + D-10 mobile stack)`)
- **Commit `262f15d`:** FOUND in git log (`262f15d feat(09-04): add WorkRow primitive (MASTER §5.5)`)
- **Commit `e9fb4fe`:** FOUND in git log (`e9fb4fe feat(09-04): add MobileMenu primitive (MASTER §5.8 + dialog a11y)`)
- **Grep `const currentPath = Astro.url.pathname` in Header.astro:** present (line 21)
- **Grep `JACK CUTRARA` in Header.astro:** present (inside wordmark anchor)
- **Grep `id="menu-trigger"` in Header.astro:** present
- **Grep `aria-controls="mobile-menu"` in Header.astro:** present
- **Grep `container-type: inline-size` in Header.astro:** present
- **Grep `@container (max-width: 380px)` in Header.astro:** present
- **Grep `const year = new Date().getFullYear()` in Footer.astro:** present
- **Grep `BUILT WITH ASTRO · TAILWIND · GEIST` in Footer.astro:** present
- **Grep `@media (max-width: 767px)` in Footer.astro:** present
- **Grep `flex-direction: column` in Footer.astro:** present (inside mobile media query)
- **Grep `<svg` in Footer.astro:** 0 matches (D-10 anti-icon)
- **Grep `grid-template-columns: 56px 1fr auto` in WorkRow.astro:** present
- **Grep `transition: opacity 120ms ease` in WorkRow.astro:** present (forward contract from 09-06)
- **Grep `text-decoration-color: var(--accent)` in WorkRow.astro:** present
- **Grep `:focus-visible` in WorkRow.astro:** present (keyboard parity with :hover)
- **Grep `translate-x-` or `transform:.*translate` in WorkRow.astro:** 0 matches
- **Grep `role="dialog"` in MobileMenu.astro:** present
- **Grep `aria-modal="true"` in MobileMenu.astro:** present
- **Grep `function initMobileMenu` in MobileMenu.astro:** present
- **Grep `function resetMobileMenuState` in MobileMenu.astro:** present (BLOCKER 2 fix)
- **Grep `function bindMobileMenuListeners` in MobileMenu.astro:** present (BLOCKER 2 fix)
- **Grep `astro:page-load` in MobileMenu.astro:** present (forward-compat listener)
- **Grep `DOMContentLoaded` in MobileMenu.astro:** present
- **BLOCKER 2 line-order invariant:** `resetMobileMenuState(menu)` on line 336 precedes `menuInitialized === "true"` check on line 340 — reset runs BEFORE double-bind guard ✓
- **Grep `document.body.style.overflow = ""` count in MobileMenu.astro:** 2 matches (closeMenu + resetMobileMenuState)
- **Grep verbatim focus-trap selector across src/:** exactly 2 files matched (`src/components/primitives/MobileMenu.astro` + `src/scripts/chat.ts`) — parity confirmed
- **Grep `@keyframes menuLinkIn` in MobileMenu.astro:** 0 matches (D-09)
- **Grep `animation:` or `animation-delay:` in MobileMenu.astro:** 0 matches (D-09)
- **Grep `translateY` on mobile-menu-link in MobileMenu.astro:** 0 matches (D-09)
- **Grep `import gsap|from "gsap"|from 'gsap'` across all primitives:** 0 matches
- **Grep `#(FAFAF7|0A0A0A|52525B|A1A1AA|E4E4E7|E63946)` across all primitives:** 0 matches (D-16)
- **Grep `class="[^"]*\b(bg-|text-ink|flex |grid |px-|py-|mx-|my-|md:|lg:)` across all primitives:** 0 matches (D-03)
- **`git diff --stat src/components/chat/ src/scripts/chat.ts src/data/portfolio-context.json`:** empty (D-26 chat hands-off preserved)
- **`pnpm run check`:** 0 errors, 0 warnings, 2 pre-existing hints
- **`pnpm run build`:** exits 0, "Complete!", 10 pages prerendered, sitemap generated
- **`pnpm run lint`:** 0 errors, 2 pre-existing warnings (worker-configuration.d.ts, unrelated)

---
*Phase: 09-primitives*
*Completed: 2026-04-08*
