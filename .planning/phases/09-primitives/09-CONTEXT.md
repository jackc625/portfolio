# Phase 9: Primitives - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 9 delivers the **editorial primitive component library** that Phase 10 consumes. Every component from `design-system/MASTER.md` §5 is built as a single-file `.astro` primitive, scoped styles hold component-local layout, and shared typography/structural helpers land in `src/styles/global.css`. The old v1.0 chrome (`Header.astro`, `Footer.astro`, `MobileMenu.astro`) is deleted and replaced by new primitives wired into `BaseLayout.astro`. A temporary `/dev/primitives` preview route renders every primitive in isolation as the SC#3 verification surface.

**In scope:**
- Build 8 primitives (Header, Footer, Container, SectionHeader, WorkRow, MetaLabel, StatusDot, **MobileMenu** — MASTER §5.8 deferred decision resolved in favor of rebuild)
- Land typography role classes + shared structural helpers in `global.css` (hybrid architecture)
- Swap `BaseLayout.astro` to import new primitives and delete old `Header`/`Footer`/`MobileMenu` files
- Create `/dev/primitives` preview route
- Audit & restyle `NextProject.astro` to editorial grammar; verify-only audit of `JsonLd`, `SkipToContent`, `ArticleImage`
- Amend MASTER.md §5.8 with the Phase 9 mobile-nav decision and amend §5.2 with the mobile-footer social-row stack extension

**Out of scope (belongs to Phase 10 or later):**
- Any page rewrite (`index.astro`, `about.astro`, `projects.astro`, `contact.astro`, `projects/[id].astro`) — stub pages keep their placeholder bodies; only the surrounding chrome changes
- Chat widget visual restyle (CHAT-02, Phase 10)
- `.chat-*` class migration to editorial helpers (Phase 10 owns the chat visual pass)
- Real content population (`WORK-03` — Phase 10)
- A11y sweep, Lighthouse, responsive QA (Phase 11)
- Deleting `/dev/primitives` and `mockup.html` (Phase 11 cleanup)

**Regression gate (SC#7):** `npm run build` succeeds and chat widget still functions. Repeat of the Phase 8 gate mechanism. MobileMenu integration is tested via the new primitive since Phase 9 touches BaseLayout.

</domain>

<decisions>
## Implementation Decisions

### Primitive library shape (8 primitives, not 7)

- **D-01: Build 8 primitives, not 7.** MASTER §5.8 explicitly handed the `MobileMenu` keep-or-delete decision to Phase 9. The decision is **rebuild** as a full-screen overlay primitive, so the library count goes from 7 to 8. MASTER §5.8 must be amended in this phase to record the rebuild decision (see D-17).
- **D-02: Primitives live in `src/components/primitives/`.** All 8 primitives (`Header.astro`, `Footer.astro`, `Container.astro`, `SectionHeader.astro`, `WorkRow.astro`, `MetaLabel.astro`, `StatusDot.astro`, `MobileMenu.astro`) live in a new `src/components/primitives/` subfolder. Kept components (`JsonLd.astro`, `SkipToContent.astro`, `ArticleImage.astro`, `NextProject.astro`, `chat/ChatWidget.astro`) stay flat in `src/components/`. Clear visual separation: editorial library vs app-shell components. Phase 10 import paths: `import Header from '~/components/primitives/Header.astro'`.
- **D-03: Primitive markup uses editorial classes only — no raw Tailwind utilities inside primitive markup.** Each primitive uses the editorial named classes (`.work-row`, `.label-mono`, `.section-header`, `.container`, etc.) plus `class:list` for variant toggles (e.g., `is-active`). Primitive markup reads verbatim against mockup.html. Phase 10 consumers may still use Tailwind utilities for one-off layout adjustments **outside** the primitives, but primitives themselves stay pure. Rationale: every primitive has a single canonical rendering; utility-class sprawl in primitive files makes drift easy.
- **D-04: Primitive props stay exactly as MASTER §5 specifies.** `Header` takes `currentPath: string`, `Container` takes `as?` + `class?`, `SectionHeader` takes `number/title/count?`, etc. Primitives do NOT accept arbitrary `...rest` attribute spread. Exception: `Container.astro` forwards `class?` per MASTER §5.3 so Phase 10 can add per-section modifiers. Any other API extension surfaces as a deviation back to Phase 8 scope, not a silent edit.

### Mobile nav resolution (ROADMAP SC#4, MASTER §5.8 deferred decision)

- **D-05: `MobileMenu.astro` is rebuilt, not deleted.** The v1.0 `MobileMenu.astro` (233 lines, hamburger + fullscreen overlay + focus trap + staggered link reveal + SVG social icons) is deleted from `src/components/` and replaced by a new editorial primitive at `src/components/primitives/MobileMenu.astro`.
- **D-06: Hamburger visibility is driven by a container query on the Header inner, threshold 380px.** Instead of a viewport media query, `Header.astro` sets `container-type: inline-size` on its inner element and uses a `@container (max-width: 380px)` rule to hide the inline nav links and show the hamburger. Rationale: at 375px viewport minus 2×24px mobile padding, Header inner is ~327px wide, which is below 380px, so standard modern phones (320–414px viewport) see the hamburger while tablets and desktops show inline nav. Container queries have ~95% browser support in 2026 and react to the Header's actual rendered width, not the viewport. Threshold 380px is chosen so the wordmark `JACK CUTRARA` (mono, 0.875rem, 0.12em letter-spacing) plus 3 uppercase mono nav links (`works·about·contact` ≈ 22 chars + 2×32px gap) don't visibly cramp.
- **D-07: Overlay contents — 3 mono nav links + small mono social row at bottom.** The rebuilt `MobileMenu.astro` overlay contains:
  1. A close button (top-right, matching current pattern)
  2. Three mono nav links (`works`, `about`, `contact`) stacked vertically, rendered in a prominent editorial size (planner's call between `.h2-project` 1.75rem and `.lead` clamp — whichever reads better), with the active link getting the accent underline treatment from `.nav-link.is-active` in mockup.html §103–143
  3. A small `GITHUB · LINKEDIN · X · EMAIL` mono link row at the bottom (same shape as the contact section's `.contact-links`, accent on hover) — **duplicates** the mobile footer social row on purpose so contact links are always one tap away while the menu is open
- **D-08: Full a11y treatment on the overlay.** Reuses the v1.0 pattern plus ChatWidget's focus-trap shape:
  - `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation menu"`
  - Focus trap: Tab cycles within the overlay, Shift+Tab reverse-cycles, focus re-queried on every keypress (matches Phase 7 ChatWidget — see STATE.md "Focus trap re-queries focusable elements on every Tab keypress")
  - Escape closes the overlay
  - Click-outside on the backdrop closes the overlay
  - Close button (top-right `×`) closes the overlay
  - `body { overflow: hidden }` while open
  - Focus returns to the hamburger trigger on close
  - Close on any nav-link click (so tapping a link dismisses the menu before the page navigates)
- **D-09: NO staggered link reveal animation.** MASTER §6.1 lists orchestrated entrance animations as dead. The v1.0 `@keyframes menuLinkIn` 60ms-stepped cascade does NOT survive into the new MobileMenu. The overlay opens instantly (display toggle only). No MASTER deviation needed. Rationale: per MASTER §6.4, the pragmatic motion line preserves state transitions only, not orchestrated entrance animations.
- **D-10: Mobile footer vertical stack with social-row insertion (<768px).** At desktop, `Footer.astro` is the MASTER §5.2 single-row default: left `© 2026 JACK CUTRARA` + right `BUILT WITH ASTRO · TAILWIND · GEIST`. At <768px the footer becomes a 3-row vertical stack:
  1. `© 2026 JACK CUTRARA` (meta-mono, `--ink-faint`, tabular)
  2. `GITHUB · LINKEDIN · X · EMAIL` mono link row (label-mono, `--ink-muted`, accent on hover — matches contact section pattern)
  3. `BUILT WITH ASTRO · TAILWIND · GEIST` (meta-mono, `--ink-faint`, uppercase)

  This extends MASTER §5.2 beyond the "single-row default, optional flex-column stack" latitude already granted there. MASTER §5.2 must be amended in this phase to record the social-row insertion (see D-17). Rationale: mobile users who skip the contact section still have social links within reach in the footer; the social row is pure mono text (no SVG icons), consistent with the editorial anti-icon stance.
- **D-11: Old `Header.astro`, `Footer.astro`, `MobileMenu.astro` are deleted in Phase 9, not carried through Phase 10.** `BaseLayout.astro` is updated to import `Header`, `MobileMenu`, and `Footer` from `src/components/primitives/`. The old files at `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/MobileMenu.astro` are deleted in the same plan that creates the new primitives. Rationale: catches integration bugs immediately (stub pages render with new chrome right away), prevents Phase 10 from having to do the swap on top of content rewrites, satisfies SC#1/SC#2 which describe a rebuilt Header and Footer — keeping old files around as `.v1` backups is unnecessary clutter.

### CSS architecture (hybrid global + scoped)

- **D-12: Typography role classes live in `global.css` as global helpers.** The seven role classes from MASTER §3.1 plus `.tabular` are defined as global classes in `src/styles/global.css`:
  - `.display` — Geist 700, clamp(4rem, 9vw, 8rem), line-height 0.92, letter-spacing -0.035em
  - `.h1-section` — Geist 600, clamp(2.5rem, 5vw, 3.5rem), line-height 1.05, letter-spacing -0.02em
  - `.h2-project` — Geist 500, 1.75rem, line-height 1.2, letter-spacing -0.01em
  - `.lead` — Geist 400, clamp(1.25rem, 2vw, 1.625rem), line-height 1.4
  - `.body` — Geist 400, 1.125rem, line-height 1.6, max-width 68ch
  - `.label-mono` — Geist Mono 500, 0.75rem, uppercase, letter-spacing 0.12em
  - `.meta-mono` — Geist Mono 400, 0.8125rem, letter-spacing 0.02em
  - `.tabular` — font-variant-numeric: tabular-nums
- **D-13: Shared structural helpers live in `global.css`.** `.container` (MASTER §5.3) and `.section` (vertical rhythm, 160px default, 96px tablet, 72px mobile per MASTER §4.2 + mockup §331–344) are defined globally because every primitive and every Phase 10 page section consumes them. `.section-rule` divider is also global (1px, `--rule`, 16px/24px margins) because SectionHeader uses it and Phase 10 may reuse it outside SectionHeader contexts.
- **D-14: Component-local layout lives in scoped `<style>` blocks.** Classes like `.work-row`, `.work-list`, `.work-num`, `.work-title`, `.work-stack`, `.work-meta`, `.work-arrow` (MASTER §5.5) live inside `WorkRow.astro`'s `<style>` block (Astro auto-scopes them). Similarly: `.site-header`, `.header-inner`, `.wordmark`, `.site-nav`, `.nav-link`, `.nav-link.is-active` scoped inside `Header.astro`. `.site-footer`, `.footer-inner`, `.footer-copy`, `.footer-built` scoped inside `Footer.astro`. `.section-header` (the flex+baseline row, not the divider) scoped inside `SectionHeader.astro`. `.status-line`, `.status-dot` scoped inside `StatusDot.astro`. Rationale: these classes are consumed by exactly one primitive; scoping prevents name collision and keeps the primitive file self-contained.
- **D-15: Keep `font-display` / `font-body` / `font-mono` Tailwind utilities in `@theme`.** The existing `@theme { --font-display: var(--font-display-src), ... }` bridge stays intact. They're consumed by `ChatWidget.astro`, `SkipToContent.astro`, `ArticleImage.astro`, `NextProject.astro`, and potentially Phase 10 one-offs. New primitives don't rely on them (they get fonts via editorial role classes), but removing them would cascade into chat widget changes that Phase 9 explicitly doesn't own. No `text-display` / `text-h1-section` Tailwind text-role utilities are added — the role classes are the only typography surface for new primitives.
- **D-16: No new design tokens. Six-color palette stays locked.** Per MASTER §8 anti-pattern "No new color additions without amending this file" and DSGN-02. Phase 9 primitives consume exactly `--bg`, `--ink`, `--ink-muted`, `--ink-faint`, `--rule`, `--accent`. No semantic aliases, no shade variants, no state colors beyond what these six can express via opacity/composition.

### MASTER.md amendments (two, both this phase)

- **D-17: Amend MASTER.md §5.8 (mobile nav decision) AND §5.2 (mobile footer stack).** Phase 8 explicitly locked MASTER.md at sign-off (D-03 from Phase 8 CONTEXT) but reserved §5.8 as a placeholder for the Phase 9 mobile-nav decision — this is the only sanctioned amendment path. Both amendments are made in the **first plan of Phase 9**, before any primitives are built, so the rest of Phase 9 references the amended spec. Amendments:
  - **§5.8** — Replace the "deferred" paragraph with the full D-05…D-10 rebuild decision, container-query approach, threshold, overlay contents, a11y treatment, and motion stance.
  - **§5.2** — Add a subsection documenting the <768px vertical stack with the `GITHUB · LINKEDIN · X · EMAIL` mono social row insertion (D-10), noting that this extends but does not contradict the "single-row default, optional flex-column stack" latitude already granted in the Mobile behavior paragraph.
  - Both amendments are committed as a discrete "docs(09-01): amend MASTER.md §5.2 and §5.8 with Phase 9 decisions" commit. After this commit, MASTER.md is locked again for the rest of Phase 9.

### Isolation preview surface (SC#3)

- **D-18: Create `/dev/primitives` preview route.** A new Astro page at `src/pages/dev/primitives.astro` imports every primitive and renders it with sample data. Each primitive is rendered inside a labeled section (using `SectionHeader` itself: `§ 01 — HEADER`, `§ 02 — FOOTER`, etc.) so the preview page is also a live self-demonstration. Sample data: for `WorkRow`, use 4 rows with varied tech stacks and years drawn from the content collection's real project frontmatter; for `StatusDot`, use `AVAILABLE FOR WORK`; for `MetaLabel`, show all three color variants (`ink`, `ink-muted`, `ink-faint`); for `SectionHeader`, show with and without count.
- **D-19: `/dev/primitives` is excluded from sitemap, nav, and `robots.txt`.** The `@astrojs/sitemap` integration filters `dev/*` routes. `robots.txt` adds `Disallow: /dev/` as a belt-and-suspenders measure. No `<nav>` link from the main site points to `/dev/primitives`. The page is reachable only by typing the URL.
- **D-20: `/dev/primitives` lifecycle: survives Phase 9 → 10 → 11, deleted in Phase 11 cleanup.** Acts as a living catalog during the Phase 10 page port so Phase 10 can compare "canonical primitive render" against "primitive in real use". Deleted in the Phase 11 polish sweep alongside `mockup.html` when the milestone signs off. Tracked in `<deferred>` below.
- **D-21: MobileMenu is previewed by triggering the hamburger manually.** Since the container-query threshold (380px) is driven by Header's own width, the `/dev/primitives` preview page can force the MobileMenu open state by a dedicated "Open mobile menu" trigger at the top of the page, OR by embedding a 375px-wide iframe/container around a mini-Header to force the container query to trip. Planner's call at implementation time. Goal: let a reviewer eyeball the mobile menu overlay without resizing their browser to 375px.

### Kept-component audit (SC#6)

- **D-22: `NextProject.astro` is restyled to a single editorial row in Phase 9, not deferred.** The current implementation (bg-rule full-bleed section + `group-hover:text-accent` + `group-hover:translate-x-1` arrow) is a v1.0 card-CTA pattern that contradicts the editorial grammar. Phase 9 restyles it to:
  - Root: single full-width anchor (no `bg-rule` panel, no full-bleed section wrapper, no py-24)
  - Content: `§ NEXT —` mono label + `.h2-project` project title (left-aligned) + accent arrow on hover (matching `WorkRow.astro`'s hover pattern — opacity 0→1 over 120ms)
  - Spacing: top margin matching `.section` rhythm (160px desktop / 96px tablet / 72px mobile)
  - Bottom border: 1px `--rule` to separate from footer
  - Public API unchanged: still accepts `project: CollectionEntry<'projects'>`
  - No `translate-x-1` hover on the arrow (the editorial arrow only changes opacity, not position — per MASTER §5.5 WorkRow spec)
- **D-23: `JsonLd.astro` is verify-only, zero edits expected.** 8 lines, no token usage, just a `<script type="application/ld+json">` tag. Audit action: read the file, confirm no leftover v1.0 tokens, move on.
- **D-24: `SkipToContent.astro` is verify-only, zero edits expected.** 6 lines, already uses `focus:bg-bg focus:text-accent focus:ring-accent`. All three are current editorial tokens from Phase 8. Audit action: read, confirm, move on.
- **D-25: `ArticleImage.astro` is verify-only, zero edits expected.** 37 lines, uses `text-ink-faint font-mono` — both current tokens/utilities. Audit action: read, confirm, move on. Wiring is still dormant (no MDX uses it yet per PROJECT.md known issues) but the component itself is on the new token system.
- **D-26: ChatWidget is explicitly hands-off in Phase 9.** Phase 10 (CHAT-02) owns the chat visual restyle. Phase 9 does NOT touch:
  - `src/components/chat/ChatWidget.astro`
  - `src/scripts/chat.ts`
  - `.chat-*` rules in `src/styles/global.css` (the ~100 lines Phase 8 refactored)
  - `src/data/portfolio-context.json`

  The SC#7 regression gate (chat still functions) is verified by running the existing chat smoke test after Phase 9 lands, not by Phase 9 editing chat. If a chat bug surfaces because of a global.css change (e.g., a new editorial class collides with a `.chat-*` name), that's a Phase 9 bug to fix; but the fix is "rename the editorial class", not "restyle chat".

### Header active-link computation

- **D-27: Header reads `Astro.url.pathname` internally (not via `currentPath` prop).** MASTER §5.1 shows `currentPath: string` as the prop signature, but the existing `src/components/Header.astro` already reads `Astro.url.pathname` directly. That pattern works for all static pages and is simpler for `BaseLayout.astro` consumers (no prop passing). Phase 9 keeps the internal read. The MASTER §5.1 prop signature is "documentation" — the implementation may skip the prop as long as the active-link computation is correct. If Phase 10 finds a route where `Astro.url.pathname` is wrong (e.g., a rewritten route), we can re-introduce the prop then. This is a minor deviation from MASTER §5.1 that's worth noting but does NOT require a MASTER amendment.

### Execution ordering within the phase

- **D-28: Plan ordering (6-wave shape suggested, not locked).** Phase 9 has natural sequencing that the planner should preserve:
  1. **Amend MASTER.md §5.2 + §5.8** (single docs commit, no code) — unblocks all subsequent work by committing the rebuild decision to the locked spec
  2. **Land editorial CSS foundations in `global.css`** (typography roles + `.container` + `.section` + `.section-rule`) — prerequisite for every primitive
  3. **Build stateless low-level primitives** (`Container`, `MetaLabel`, `StatusDot`, `SectionHeader`) — no dependencies on each other, can parallelize
  4. **Build composite primitives** (`WorkRow` uses `MetaLabel`-like patterns; `Header` uses `Container`; `Footer` uses `Container`; `MobileMenu` uses `MetaLabel` patterns)
  5. **Swap `BaseLayout.astro` imports + delete old `Header`/`Footer`/`MobileMenu`** (integration point, chat regression verified here)
  6. **Restyle `NextProject.astro` + audit `JsonLd`/`SkipToContent`/`ArticleImage`** (kept components, independent of primitive work) — can parallelize with wave 3
  7. **Create `/dev/primitives` preview route** (consumes all primitives) — must be last
  8. **Run verification gate** (build + lint + check + test + manual chat smoke test) — SC#7

  Planner may merge/split waves, but the MASTER amendment MUST be wave 1 and the verification gate MUST be wave 8.

### Verification gate (SC#7)

- **D-29: Phase 9 ships only when ALL FIVE pass:**
  1. `pnpm run build` succeeds with zero errors (the project uses pnpm per Phase 8 STATE.md entry; same gate as Phase 8)
  2. `pnpm run lint` clean (ESLint)
  3. `pnpm run check` (astro check — catches `.astro` type errors)
  4. `pnpm run test` (vitest) — all existing tests remain green
  5. **Manual chat smoke test** — same shape as Phase 8 D-26: `pnpm run dev`, open chat bubble on at least one stub page, send a message that triggers the Anthropic API, confirm SSE streaming response renders with Geist Mono in code blocks, confirm focus trap works on Tab, confirm the bubble closes cleanly. Single-page only (cross-page chat persistence is still a known regression per Phase 8 D-29).
- **D-30: Additional Phase 9 manual verification — /dev/primitives visual check.** Beyond the chat smoke test, the gate includes loading `/dev/primitives` in the dev server and eyeballing each primitive against `mockup.html` at desktop (1440px) and mobile (375px) widths. This isn't a Lighthouse-grade pass (Phase 11 owns that) — it's a "does Header look like mockup.html §103–143? does WorkRow look like §207–254? is MobileMenu's container query kicking in at 380px?" sanity check.

### Claude's Discretion

- Exact pixel/em values for editorial role classes inside scoped styles (must match mockup §55–99 numbers, but whitespace/order is up to the planner)
- Whether `Container.astro` uses an `<Element>` dynamic-tag pattern or a single `<div>` + `class:list` composition (both work; MASTER §5.3 shows `as?` prop)
- The exact font size choice for mobile menu nav links (between `.h2-project` 1.75rem and `.lead` clamp) — planner picks whichever reads better
- Whether the mobile-menu close button uses the existing SVG `×` icon pattern or a mono `×` character
- Whether `/dev/primitives` uses an iframe trick or a scoped container-query wrapper to demonstrate the MobileMenu responsive state
- How `NextProject.astro`'s "NEXT" label is spelled (`§ NEXT —` vs `NEXT →` vs `§ NEXT — [title]`) — planner matches the SectionHeader pattern where possible
- Whether the `/dev/primitives` page gets its own minimal meta tags or inherits from BaseLayout's SEO defaults (with a `noindex` added)
- Whether `.chat-*` class name audit surfaces any accidental collisions with new editorial classes (unlikely, but planner should grep for `.chat-label-mono`, `.chat-body`, etc. and rename new classes if a collision appears)
- Whether the container-query syntax uses `@container (max-width: 380px)` or a named container (`container-name: site-header`) — both work, named container is slightly more explicit

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Contract (the source of truth for every primitive)
- `design-system/MASTER.md` — Single source of truth for tokens, typography, layout, components, motion, accent usage, and anti-patterns. **Phase 9 reads this to build primitives to spec, and amends §5.8 and §5.2 per D-17.**
  - §2 (Tokens) — Six-color palette + layout tokens
  - §3.1 (Type roles) — `.display`, `.h1-section`, `.h2-project`, `.lead`, `.body`, `.label-mono`, `.meta-mono` specs (Phase 9 lands these as global classes per D-12)
  - §4 (Layout) — Container, section rhythm, hero grid, section header pattern
  - §5.1–5.7 (Components) — Per-primitive spec with props, sizing, colors, typography, hover/focus, mobile, HTML sketch
  - §5.8 (Mobile nav decision) — Phase 9's amendment target for D-05…D-10
  - §5.2 (Footer) — Phase 9's amendment target for D-10 mobile stack
  - §6 (Motion) — Pragmatic motion line: what survives and what's dead
  - §7 (Accent usage) — Where accent IS and is NEVER allowed
  - §8 (Anti-patterns) — 16 anti-patterns Phase 9 must not reintroduce
  - §9 (Chat Widget Token Map) — Documents the D-26 hands-off scope

### Visual Contract (the pixel-accurate reference)
- `mockup.html` (repo root) — Hand-built HTML/CSS mockup. Phase 9 transcribes its class structure into scoped `<style>` blocks and global helpers per D-12/D-13/D-14.
  - Lines 14–25 — Token definitions (already in `src/styles/global.css` from Phase 8)
  - Lines 55–99 — Type roles (Phase 9 transcribes these into global.css per D-12)
  - Lines 103–143 — `.site-header`, `.header-inner`, `.wordmark`, `.site-nav`, `.nav-link`, `.nav-link.is-active` (Phase 9 transcribes into `Header.astro` scoped style per D-14)
  - Lines 147–184 — Hero + status line + status dot (Phase 9 uses these for StatusDot per D-14; the hero layout itself is Phase 10)
  - Lines 188–203 — `.section`, `.section-header`, `.section-rule` (Phase 9 lands `.section` + `.section-rule` as globals per D-13, `.section-header` scoped inside SectionHeader per D-14)
  - Lines 207–254 — `.work-row`, `.work-list`, `.work-num`, `.work-title`, `.work-stack`, `.work-meta`, `.work-arrow` (Phase 9 transcribes into `WorkRow.astro` scoped style per D-14)
  - Lines 259–277 — `.about-body`, `.about-intro` (Phase 10's territory — Phase 9 doesn't transcribe these)
  - Lines 282–309 — `.contact-*` (Phase 10's territory — Phase 9 doesn't transcribe these except `.contact-link` hover pattern reused in MobileMenu + Footer mobile stack)
  - Lines 313–326 — `.site-footer`, `.footer-inner`, `.footer-copy`, `.footer-built` (Phase 9 transcribes into `Footer.astro` scoped style per D-14)
  - Lines 330–348 — Responsive breakpoints (Phase 9 transcribes into `.container` + `.section` globals per D-13)

### Project Definition
- `.planning/PROJECT.md` — Milestone v1.1 goal and key decisions; note that "Design process: all visual/UI/UX decisions routed through frontend-design skill" constraint still applies
- `.planning/REQUIREMENTS.md` — Phase 9 has no requirement mappings (sequencing scaffold); the traceability table at the bottom confirms this
- `.planning/ROADMAP.md` §"Phase 9: Primitives" — Goal, depends-on, 7 success criteria (SC#1 through SC#7)
- `.planning/STATE.md` — Phase 8 carry-over decisions, pnpm vs npm note, Tailwind v4 @source scoping, ESLint argsIgnorePattern for no-op stubs

### Phase 8 Context (what Phase 9 inherits)
- `.planning/phases/08-foundation/08-CONTEXT.md` — Phase 8 D-01…D-30, especially:
  - D-03 (MASTER.md locked at Phase 8 sign-off — §5.8 + §5.2 are the only sanctioned amendment paths)
  - D-04 (MASTER.md documents Phase 9 primitives up front — spec-first discipline)
  - D-09 (CSS-vars-then-Tailwind-bridge architecture that Phase 9 keeps intact)
  - D-16 (`MobileMenu.astro` left wired with DOMContentLoaded fallback — Phase 9 deletes and replaces it)
  - D-17 (`Header.astro` left with minimum surgery — Phase 9 rewrites entirely)
  - D-19–D-21 (Chat token mapping — Phase 9 does NOT re-touch chat)
  - D-26 (Phase 8 verification gate shape — Phase 9 reuses)
  - D-29 (Cross-page chat persistence regression — remains known, Phase 10 fixes)
  - D-30 (MobileMenu.astro DOMContentLoaded fallback — Phase 9 deletes this along with the file)
- `.planning/phases/08-foundation/VERIFICATION.md` — Phase 8 verification report (gate pass record)
- `.planning/phases/08-foundation/08-UAT.md` — Phase 8 UAT results (9 passed, 0 issues)
- `.planning/phases/08-foundation/08-DISCUSSION-LOG.md` — Phase 8 discussion log for precedent on decisions

### Files Phase 9 Touches (read before editing)
- `src/layouts/BaseLayout.astro` — Import swap (D-11): `../components/Header` → `../components/primitives/Header`, same for Footer and MobileMenu
- `src/styles/global.css` — Add typography role classes (D-12), `.container` (D-13), `.section` (D-13), `.section-rule` (D-13). Do NOT touch `.chat-*` block (D-26)
- `src/components/Header.astro` — DELETE (D-11)
- `src/components/Footer.astro` — DELETE (D-11)
- `src/components/MobileMenu.astro` — DELETE (D-11)
- `src/components/NextProject.astro` — RESTYLE per D-22 (public API stable)
- `src/components/JsonLd.astro` — VERIFY-ONLY (D-23)
- `src/components/SkipToContent.astro` — VERIFY-ONLY (D-24)
- `src/components/ArticleImage.astro` — VERIFY-ONLY (D-25)
- `src/components/chat/ChatWidget.astro` — DO NOT TOUCH (D-26)
- `src/scripts/chat.ts` — DO NOT TOUCH (D-26)
- `src/data/portfolio-context.json` — DO NOT TOUCH (D-26)
- `design-system/MASTER.md` — AMEND §5.8 and §5.2 per D-17 (the only sanctioned amendment this phase)
- `public/robots.txt` — Add `Disallow: /dev/` (D-19)
- `astro.config.mjs` — Update `@astrojs/sitemap` config to filter `dev/*` routes (D-19)

### Files Phase 9 Creates
- `src/components/primitives/Header.astro` (D-02)
- `src/components/primitives/Footer.astro` (D-02)
- `src/components/primitives/Container.astro` (D-02)
- `src/components/primitives/SectionHeader.astro` (D-02)
- `src/components/primitives/WorkRow.astro` (D-02)
- `src/components/primitives/MetaLabel.astro` (D-02)
- `src/components/primitives/StatusDot.astro` (D-02)
- `src/components/primitives/MobileMenu.astro` (D-02, D-05–D-09)
- `src/pages/dev/primitives.astro` (D-18)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`mockup.html` at repo root** — Every primitive's layout, spacing, and hover state is already worked out. Phase 9 transcribes, doesn't redesign.
- **`design-system/MASTER.md` §5** — Already documents every primitive's Props, Sizing, Colors, Typography, Hover/focus, Mobile behavior, and HTML sketch. Spec-first discipline means Phase 9 implements against this and cannot silently amend (§5.8 and §5.2 are the only exceptions per D-17).
- **`src/styles/global.css` @theme bridge + token declarations** — Phase 8 already established `:root { --bg, --ink, ... }` and the `@theme { --color-* }` Tailwind mapping. Phase 9 just appends typography role classes and structural helpers without touching the bridge.
- **Existing `nav-link-hover` global rule** — 23 lines in `global.css` (lines 86–107) implements the animated underline pattern that the new `Header.astro` may reuse for its inactive nav links. Already honors `prefers-reduced-motion`.
- **Phase 7 ChatWidget focus-trap pattern** — The new `MobileMenu.astro` per D-08 reuses this shape: `aria-modal`, re-query focusable elements on every Tab, Escape closes, focus return. Phase 7 STATE.md notes capture the gotchas.
- **v1.0 `MobileMenu.astro` a11y shape** — 233 lines to reference for DOMContentLoaded fallback, `aria-expanded` toggle, `body { overflow: hidden }` lock. The new primitive reimplements these without the staggered reveal animation.
- **`src/content/projects/*.mdx` + Zod schema** — 6 real projects with titles, stacks, years, and descriptions. The `/dev/primitives` WorkRow sample (D-18) pulls 4 of these rather than hardcoding placeholder data; Phase 10 will render all 6 in the actual homepage and projects index.

### Established Patterns
- **Single-file `.astro` with inline `<style>` and `<script>`** — Phase 7 convention, Phase 8 preserved, Phase 9 primitives follow. Astro auto-scopes `<style>` per component (D-14).
- **Tailwind `@theme` bridge for color tokens** — Phase 8 established. Phase 9 adds no new Tailwind token utilities (D-15 keeps font-* alive, nothing new).
- **`feat/ui-redesign` branch isolation** — Production stays frozen on v1.0 at jackcutrara.com through Phase 10. Phase 9 merges to main eventually but not before Phase 10 achieves visual parity.
- **`pnpm` as the package manager** — Phase 8 Plan 08-03 discovered this. All Phase 9 gate commands use `pnpm run build/lint/check/test`, not `npm run *`.
- **Tailwind v4 `@source` scoping** — Phase 8 Plan 08-08 established `@source "../**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"` in global.css to prevent `.planning/` markdown from polluting the class scan. Phase 9 preserves this.
- **ESLint `argsIgnorePattern: ^_` for no-op stubs** — Phase 8 Plan 08-08 established. Phase 9 may leave unused function parameters if they came from a removed API surface.

### Integration Points
- **`BaseLayout.astro` ↔ new primitives** — Tightest coupling in Phase 9. The import swap (D-11) is the moment the live site flips from v1.0 chrome to editorial chrome. Every stub page inherits the new chrome automatically. Chat smoke test must pass after this swap.
- **Header ↔ container query ↔ CSS scoping** — `Header.astro` must set `container-type: inline-size` on its inner container element so the `@container (max-width: 380px)` rule works. This is a scoped CSS mechanism, not a global one.
- **MobileMenu ↔ Header** — The hamburger trigger lives inside `Header.astro`; the overlay lives inside `MobileMenu.astro`. They coordinate via a shared element ID or data attribute. Planner chooses the mechanism, but both components render into the BaseLayout, not inside each other.
- **`/dev/primitives` ↔ content collection** — The preview page imports from `src/content/projects` for WorkRow sample data (D-18). Content collection schema unchanged from Phase 8.
- **Sitemap / robots.txt ↔ /dev/ exclusion** — `astro.config.mjs` sitemap config filters, `public/robots.txt` disallows. Both change together (D-19).
- **Primitives ↔ Phase 10** — Phase 10 imports primitives from `src/components/primitives/` and composes them into page templates. The import paths are the contract; D-04 says primitive props are fixed. Phase 10 can add layout around primitives but cannot modify primitive internals.

</code_context>

<specifics>
## Specific Ideas

- **The user explicitly chose to rebuild MobileMenu rather than delete it**, turning the 7-primitive library into 8. Rationale: mobile nav overlay is a real UX need even if the inline nav fits at most mobile widths, and the rebuilt overlay can match the editorial system without the v1.0 noise (SVG icons, staggered reveals). This is a deliberate expansion of Phase 9 scope beyond MASTER.md §5.1–5.7.
- **The user explicitly chose container queries over viewport media queries** for the hamburger fallback (D-06). This is a deliberate commitment to component-level responsive design rather than global breakpoints — more robust, reacts to Header's actual width, and aligns with the "each primitive is a self-contained contract" philosophy.
- **The user explicitly chose 380px as the threshold** knowing it means most standard modern phones see the hamburger. The reasoning is "wordmark + 3 mono links cramps at ~330px header-inner width" — better to gracefully fall back than to let the nav visibly tighten.
- **The user explicitly chose to duplicate the social link row** in both the mobile menu overlay (D-07) and the mobile footer (D-10). Rationale: users shouldn't have to close the menu to reach contact links, and users who never open the menu should still see social links without scrolling to the contact section.
- **The user explicitly chose editorial-only markup** for primitives (D-03) — no Tailwind utility escape hatches inside primitive `<style>`/markup. This is a commitment to "primitives are canonical, not customizable" and prevents Phase 10 consumers from drifting into utility-sprawl.
- **The user explicitly chose the hybrid CSS architecture** (D-12 + D-13 + D-14): typography globals + shared structurals + component-local scoped. This is a deliberate rejection of "everything global" (which matches mockup.html exactly but bloats one file) and "everything scoped" (which duplicates shared role classes).
- **The user explicitly chose to delete old Header/Footer/MobileMenu in Phase 9**, not carry them through Phase 10 (D-11). This is a deliberate integration-risk-front-loading choice: catch BaseLayout swap bugs now, while the scope is still small, rather than on top of a page rewrite.
- **The user explicitly chose to restyle NextProject.astro in Phase 9** (D-22), not defer it to Phase 10 where the project detail page rewrite happens. Rationale: Phase 9 owns the primitive grammar, and NextProject becoming a "next-row-shaped primitive" fits that theme better than adding visual work to Phase 10's page port.
- **The user explicitly chose `/dev/primitives` as a living catalog** surviving until Phase 11 (D-18–D-20), not a Phase 9 throwaway. Rationale: during Phase 10 page port, comparing "canonical primitive render" against "primitive in real use" is valuable; losing the preview page at the Phase 9 boundary forfeits that.
- **The user explicitly chose to drop the staggered link reveal animation** from the rebuilt MobileMenu (D-09), treating it as orchestrated entrance motion (dead per MASTER §6.1) rather than a state transition. No MASTER deviation needed — this honors the locked spec.

</specifics>

<deferred>
## Deferred Ideas

- **`/dev/primitives` preview page deletion** — Phase 11 polish, deleted alongside `mockup.html` after homepage parity is signed off.
- **`mockup.html` deletion** — Phase 11 polish (already on the Phase 8 deferred list, re-noted here for completeness).
- **Chat widget visual restyle (CHAT-02)** — Phase 10. Phase 9 explicitly hands-off.
- **Chat motion restoration via CSS @keyframes** — Phase 10 (CHAT-02). Phase 9 does not re-introduce chat motion.
- **Cross-page chat persistence regression** — Phase 10 (CHAT-02) restores via localStorage-backed message restore. Carried forward from Phase 8 D-29.
- **Homepage hero layout transcription** (`.hero`, `.hero-grid`, `.hero-content`, `.hero-meta`, `.hero-lead`, `.accent-dot`) — Phase 10 owns the homepage rewrite. Phase 9 primitives (StatusDot, MetaLabel) will be consumed there; the hero grid layout itself is not a primitive.
- **About page layout transcription** (`.about-body`, `.about-intro`) — Phase 10 owns the about page rewrite.
- **Contact section layout transcription** (`.contact-body`, `.contact-label`, `.contact-email`, `.contact-links`, `.contact-link`) — Phase 10 owns the contact section rewrite. Phase 9 reuses the `.contact-link` hover pattern inside MobileMenu's social row and Footer's mobile stack, which may mean defining the class shape early in global.css or scoped inside those primitives at the planner's discretion.
- **REQUIREMENTS.md CHAT-01 reconciliation** — Phase 10 planning. Carried from Phase 8.
- **REQUIREMENTS.md CONTACT-02 "placeholder PDF" wording** — Phase 10 planning. Carried from Phase 8.
- **`CLAUDE.md` Technology Stack milestone-end update** — End of v1.1, drop GSAP + Inter/IBM Plex Mono. Carried from Phase 8.
- **Phase 10 WorkRow data wiring** — Phase 9's WorkRow is stateless (pure props). Phase 10 decides whether the homepage wraps WorkRow in a `map()` over the content collection or introduces a thin `WorkList.astro` wrapper. Not Phase 9's call.
- **Lighthouse / a11y / contrast / responsive QA of the new primitives** — Phase 11 polish (QUAL-01 through QUAL-06). Phase 9's isolation preview is a sanity check, not an audit.

</deferred>

---

*Phase: 09-primitives*
*Context gathered: 2026-04-08*
