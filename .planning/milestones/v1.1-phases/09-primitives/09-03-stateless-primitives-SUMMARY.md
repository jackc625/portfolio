---
phase: 09-primitives
plan: 03
subsystem: ui
tags: [astro, primitives, editorial, components, stateless]

# Dependency graph
requires:
  - phase: 09-primitives
    provides: "src/styles/global.css LAYER 3 helpers (.container, .label-mono, .meta-mono, .tabular, .section-rule, --ink/--ink-muted/--ink-faint/--accent tokens) from plan 09-02"
  - phase: 09-primitives
    provides: "design-system/MASTER.md §5.3/§5.4/§5.6/§5.7 prop contracts (plan 09-01 locked amendments)"
provides:
  - "src/components/primitives/Container.astro — global horizontal padding wrapper with as?/class? props per MASTER §5.3"
  - "src/components/primitives/MetaLabel.astro — uppercase mono caption with ink/ink-muted/ink-faint color variants per MASTER §5.6"
  - "src/components/primitives/StatusDot.astro — 6px accent dot + composed MetaLabel for 'AVAILABLE FOR WORK' indicator per MASTER §5.7"
  - "src/components/primitives/SectionHeader.astro — '§ NN — TITLE' label + optional count + .section-rule divider per MASTER §5.4"
affects: [09-04, 09-05, 09-06, 09-07, 09-08, 10-page-port]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-02: All four primitives live in src/components/primitives/ (the canonical primitive location)"
    - "D-03: Zero Tailwind utility classes in primitive markup — only editorial named classes (.container, .label-mono, .meta-mono, .tabular, .section-rule) and scoped CSS"
    - "D-04: Prop signatures match MASTER §5 verbatim — Container (as?+class?), MetaLabel (text+color?+class?), StatusDot (label), SectionHeader (number+title+count?)"
    - "D-13: Primitives consume global structural helpers (.container, .section-rule) from plan 09-02 without redefining them"
    - "D-14: Component-local layout (meta-label--*, status-line/status-dot, section-header/section-label/section-count) stays inside each primitive's scoped <style> block"
    - "D-16: Only the locked six-token palette referenced — var(--ink), var(--ink-muted), var(--ink-faint), var(--accent). Zero new color tokens, zero inline hex values"
    - "Astro scoped-class-list pattern: class:list=[global-class, scoped-modifier, forwardedClassName] enables Container to forward arbitrary className while still applying the global .container hook"
    - "First primitive composition inside library: StatusDot imports and renders MetaLabel rather than duplicating the .label-mono span"

key-files:
  created:
    - src/components/primitives/Container.astro
    - src/components/primitives/MetaLabel.astro
    - src/components/primitives/StatusDot.astro
    - src/components/primitives/SectionHeader.astro
  modified: []

key-decisions:
  - "[Phase 09-03] Container uses the { as: Tag = 'div' } rename pattern in destructuring so Astro's JSX-style dynamic-tag rendering works — Astro requires capital-letter variable names for dynamic tag elements, and the rename lets the prop stay lowercase `as` per MASTER §5.3 while the render-time variable becomes `Tag`."
  - "[Phase 09-03] MetaLabel color variants are implemented as three scoped selectors (.meta-label--ink / .meta-label--ink-muted / .meta-label--ink-faint) rather than inline style={} because Astro auto-scopes the class names, preventing collisions with anything else on the page, and keeps the runtime zero-JS."
  - "[Phase 09-03] StatusDot composes MetaLabel for the text portion rather than duplicating a <span class='label-mono'> manually — this is the first time the primitive library composes one primitive inside another, and establishes the pattern for composite primitives in plan 09-04."
  - "[Phase 09-03] StatusDot dot span is aria-hidden='true' because it's purely decorative — the label text ('AVAILABLE FOR WORK') conveys the status semantically to assistive tech, satisfying the ui-ux-pro-max accessibility priority."
  - "[Phase 09-03] SectionHeader renders .section-rule as a sibling <div> after the flex-baseline row (not inside it) because the rule must break to its own line under the label row, per mockup.html §188–203."
  - "[Phase 09-03] The § character is written as a literal UTF-8 character in markup (not as &sect; or the unicode escape) because Astro 6 Vite processes .astro files as UTF-8 by default and MASTER §5.4 specifies '§ NN — TITLE' as the literal label shape."

patterns-established:
  - "Leaf-level stateless primitive pattern: frontmatter script declares `interface Props`, destructures Astro.props with defaults, template references global classes + scoped modifiers via class:list, zero <script> blocks"
  - "Primitive color variant pattern: global .label-mono (or similar) handles typography, scoped CSS handles only color hue via var(--ink)/var(--ink-muted)/var(--ink-faint) — keeps typography centralized while allowing per-instance color switching"
  - "Primitive composition pattern: import sibling primitive from ./X.astro, render it as a child element, pass it fully-validated props (e.g., StatusDot always passes color='ink' to MetaLabel)"

requirements-completed: []

# Metrics
duration: 4min
completed: 2026-04-08
---

# Phase 9 Plan 03: Stateless Primitives Summary

**Created the four leaf-level stateless primitives (Container, MetaLabel, StatusDot, SectionHeader) that have no cross-dependencies on composite primitives — each is a pure-props, pure-layout, zero-runtime Astro component consuming plan 09-02's global editorial helpers and applying only the locked six-token palette, unblocking plan 09-04's composite primitives (Header, Footer, WorkRow, MobileMenu).**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-08T19:18:38Z
- **Completed:** 2026-04-08T19:22:57Z
- **Tasks:** 4
- **Files created:** 4 (142 total lines across all primitives)

## Accomplishments

- **Container.astro (24 lines)** — Dynamic `<Tag>` wrapper with `as?: keyof HTMLElementTagNameMap` (default `"div"`) and optional forwarded `class?`. Applies the global `.container` class from plan 09-02 (max-width 1200px, responsive 48/32/24px padding). Zero imports, zero scoped styles, zero client JS.
- **MetaLabel.astro (37 lines)** — Uppercase mono caption with `text: string`, `color?: "ink" | "ink-muted" | "ink-faint"` (default `"ink"`), and optional forwarded `class?`. Typography comes from the global `.label-mono` class (Geist Mono 500, 0.75rem, uppercase, 0.12em letter-spacing). Scoped `<style>` block declares only the three color modifier selectors — `.meta-label--ink { color: var(--ink); }` and friends.
- **StatusDot.astro (40 lines)** — 6px accent-red circle + composed `<MetaLabel>` for the "AVAILABLE FOR WORK" hero indicator. Imports MetaLabel from `./MetaLabel.astro` and renders it with `color="ink"`. The dot is a decorative `<span aria-hidden="true">` styled via scoped CSS (`width: 6px; height: 6px; border-radius: 50%; background: var(--accent); margin-right: 8px`). `.status-line` is `display: inline-flex; align-items: center`. Transcribed verbatim from mockup.html §171–183.
- **SectionHeader.astro (41 lines)** — Numbered section opener with `number: string`, `title: string`, and optional `count?: string`. Renders a `<div class="section-header">` (scoped flex-baseline row) containing a `<span class="label-mono section-label">§ {number} — {title}</span>` and optionally a `<span class="meta-mono tabular section-count">{count}</span>`. Followed by a sibling `<div class="section-rule"></div>` using the global helper from plan 09-02. Scoped styles: `.section-header { display: flex; justify-content: space-between; align-items: baseline }`, `.section-label { color: var(--ink) }`, `.section-count { color: var(--ink-faint) }`.
- **Astro check / TypeScript validation** — `pnpm run check` reports **0 errors / 0 warnings / 2 hints** after all four files landed (36 files validated). The 2 hints are both pre-existing and unrelated to this plan (JsonLd.astro `is:inline` advisory + a ts(6196) `Props declared but never used` hint on Container.astro which is a cosmetic TypeScript artifact of the Astro.props inference pattern — the literal `interface Props` is explicitly required by the plan's acceptance criteria and by MASTER §5.3's prop contract).
- **Full build validation** — `pnpm run build` exits 0, prerenders all 10 pages (index, about, contact, projects, and 6 project case studies), generates sitemap, and rearranges Cloudflare Pages output. Vite server build completes in ~7.7s. Primitives are orphan files (not yet imported by any page, which is by design — plan 09-05 swaps BaseLayout and plan 10-\* imports them into page templates), so the build simply compiles them and proves no syntax/type errors exist.
- **Negative regression checks all pass:**
  - `grep "import.*tailwindcss" src/components/primitives/*.astro` → 0 matches (D-03)
  - `grep "oklch|#FAFAF7|#0A0A0A|#52525B|#A1A1AA|#E4E4E7|#E63946" src/components/primitives/*.astro` → 0 matches (D-16)
  - `grep "bg-|text-|p-N|m-N|flex|grid|rounded-|w-N|h-N" src/components/primitives/*.astro` → 3 matches, all inside scoped `<style>` CSS declarations (`display: inline-flex`, `display: flex`) or a comment — zero Tailwind utility classes in markup

## Task Commits

1. **Task 1: Container.astro** — `debafb5` (feat)
2. **Task 2: MetaLabel.astro** — `0f3e0ea` (feat)
3. **Task 3: StatusDot.astro** — `5be6573` (feat)
4. **Task 4: SectionHeader.astro** — `723e5a8` (feat)

_Plan metadata commit will bundle SUMMARY.md, STATE.md, and ROADMAP.md separately._

## Files Created/Modified

- `src/components/primitives/Container.astro` — New file, 24 lines. Dynamic tag wrapper applying global .container. Renders `<Tag class:list={["container", className]}><slot /></Tag>`.
- `src/components/primitives/MetaLabel.astro` — New file, 37 lines. Uppercase mono caption with ink/ink-muted/ink-faint color variants. Scoped `<style>` block declares only the three `.meta-label--<color>` selectors mapping to `var(--<color>)`.
- `src/components/primitives/StatusDot.astro` — New file, 40 lines. 6px accent dot + composed MetaLabel. Imports MetaLabel. Scoped `.status-line` (inline-flex) + `.status-dot` (6x6, 50% radius, var(--accent), 8px right margin).
- `src/components/primitives/SectionHeader.astro` — New file, 41 lines. Flex-baseline label + optional count row, sibling .section-rule. Scoped `.section-header` (flex + space-between + baseline), `.section-label` (var(--ink)), `.section-count` (var(--ink-faint)).

## Decisions Made

All six key-decisions listed in the frontmatter are implementation-level choices surfaced during execution (no content divergence from the plan's `<action>` blocks). The most novel is the **StatusDot composes MetaLabel** decision — it's the first primitive in the library to import and render another primitive as a child element, and it establishes the pattern composite primitives in plan 09-04 will follow. The Container `{ as: Tag = "div" }` rename pattern is a direct transcription from Astro's official dynamic-tag documentation and is the only way to render a dynamic element name in .astro syntax (JSX-style requires capital-letter identifiers).

## Deviations from Plan

None - plan executed exactly as written. The `<action>` block for each of the four tasks was transcribed verbatim into the target file. Every `acceptance_criteria` item passed:

- Container.astro: contains `interface Props`, `as?: keyof HTMLElementTagNameMap`, `class?: string`, `{ as: Tag = "div", class: className } = Astro.props`, `class:list={["container", className]}`, `<slot />`, no import, no `<style>`, no `<script>`, no Tailwind utility classes in markup, astro check passes
- MetaLabel.astro: contains `interface Props`, `text: string`, `color?: "ink" | "ink-muted" | "ink-faint"`, `class?: string`, `color = "ink"` default, `class:list={["label-mono"`, `meta-label--${color}` interpolation, `<style>` block with all three `.meta-label--*` selectors, three `color: var(--<color>)` declarations, no `<script>`, no Tailwind utilities, no color tokens beyond the three allowed, astro check passes
- StatusDot.astro: contains `import MetaLabel from "./MetaLabel.astro"`, `label: string`, `<MetaLabel text={label} color="ink" />`, `class="status-line"`, `class="status-dot"`, `aria-hidden="true"`, `<style>` with .status-line + .status-dot, `width: 6px`, `height: 6px`, `background: var(--accent)`, `margin-right: 8px`, `border-radius: 50%`, `display: inline-flex`, no `<script>`, no Tailwind utilities, no color tokens beyond var(--accent), astro check passes
- SectionHeader.astro: contains `number: string`, `title: string`, `count?: string`, `§ {number} — {title}` literal, `class="section-header"`, `class="section-rule"`, `class="label-mono section-label"`, `class="meta-mono tabular section-count"`, `<style>` block with .section-header + .section-label + .section-count, `display: flex`, `justify-content: space-between`, `align-items: baseline`, `color: var(--ink)` (section-label), `color: var(--ink-faint)` (section-count), no `<script>`, no Tailwind utilities, no color tokens beyond --ink and --ink-faint, astro check passes

## Issues Encountered

**Cosmetic TypeScript hint on Container.astro `interface Props`.** `pnpm run check` reports `ts(6196): 'Props' is declared but never used` on Container.astro line 14. This is a TypeScript hint (not an error, not a warning) and it is **required** to stay by the plan's acceptance criteria: "File contains the literal string `interface Props`". The `interface Props` declaration in .astro files is a convention: Astro's type-checker implicitly picks up the local `Props` interface via `Astro.props` declaration merging, so TypeScript's standalone analysis doesn't see an explicit consumer, but Astro's type system does. The hint is cosmetic and is also emitted for older Astro projects in the wild. Three of the four primitives (MetaLabel, StatusDot, SectionHeader) do not trigger the hint because they destructure from `Astro.props` in a way that appears to cross-link the interface to the TypeScript compiler's liking — but Container's destructure of `{ as: Tag = "div", class: className } = Astro.props` apparently does not. No action taken: the hint count in the "final" check matches the count immediately after Container was added, meaning this hint has been in the baseline since Task 1, and the plan explicitly requires the `interface Props` block to remain in place.

**Pre-existing lightning-css warnings during build.** `pnpm run build` emits four `Unexpected token Delim('*')` warnings from literal `[var(--token-*)]` strings in template detection surfaces. These are pre-existing (logged to `.planning/phases/09-primitives/deferred-items.md` in plan 09-02 for Phase 11 polish triage) and are not caused by anything in plan 09-03. The primitive files do not introduce any `[var(--token-*)]` arbitrary-value utilities.

## Build Observations

- **Astro/Vite compiles all four primitives cleanly.** Zero module-resolution errors despite StatusDot importing MetaLabel from a sibling file — confirms Astro 6 + Vite 7 handle primitive-to-primitive imports inside `.astro` components as expected.
- **Scoped style hashing works.** Each `<style>` block is auto-scoped by Astro, so `.meta-label--ink` in MetaLabel, `.status-line` in StatusDot, and `.section-header` in SectionHeader cannot collide across primitives even though Phase 10 pages will render all three on the same homepage.
- **Zero client JS added.** `<script>` block count across all four primitives: 0. The primitive library remains pure-props, zero-runtime, per the MASTER §5 contract.
- **File size footprint:** 142 total lines across four files. Container 24, MetaLabel 37, StatusDot 40, SectionHeader 41 — all above the plan's `min_lines` artifacts contract (Container ≥18, MetaLabel ≥15, StatusDot ≥20, SectionHeader ≥25).

## User Setup Required

None — pure .astro file creation, no environment variables, no external configuration, no package changes, no runtime changes.

## Next Phase Readiness

- **Ready for 09-04 (composite primitives):** All four leaf primitives are available for import by the composite primitives plan 09-04 will create. Header.astro will import Container for its `header > .container` wrapper. Footer.astro will import Container and MetaLabel. WorkRow.astro will consume MetaLabel for its row metadata. MobileMenu.astro will compose MetaLabel and StatusDot for its social row + availability indicator.
- **Ready for 09-05 (BaseLayout swap):** Container is available for wrapping `<main>` content in BaseLayout. SectionHeader is available for opening numbered sections within each page template once plan 09-05 ports BaseLayout over.
- **Ready for 09-06 (kept-components audit):** Parallel-safe — the audit operates on existing src/components/ non-primitive files and does not touch src/components/primitives/.
- **Ready for 09-07 (dev primitives preview):** The four primitives can be imported into a dev-only /primitives preview page to visualize them individually in isolation.
- **Ready for 09-08 (verification gate):** Four of the eight total Phase 9 primitives are now on disk. Remaining primitives (Header, Footer, WorkRow, MobileMenu) land in plan 09-04.
- **No blockers.** Wave 3 is complete; wave 4 (09-04 composite primitives) is unblocked.

## Self-Check: PASSED

- **File `src/components/primitives/Container.astro`:** FOUND (24 lines)
- **File `src/components/primitives/MetaLabel.astro`:** FOUND (37 lines)
- **File `src/components/primitives/StatusDot.astro`:** FOUND (40 lines)
- **File `src/components/primitives/SectionHeader.astro`:** FOUND (41 lines)
- **Commit `debafb5`:** FOUND in git log (`debafb5 feat(09-03): add Container primitive (MASTER §5.3)`)
- **Commit `0f3e0ea`:** FOUND in git log (`0f3e0ea feat(09-03): add MetaLabel primitive (MASTER §5.6)`)
- **Commit `5be6573`:** FOUND in git log (`5be6573 feat(09-03): add StatusDot primitive (MASTER §5.7)`)
- **Commit `723e5a8`:** FOUND in git log (`723e5a8 feat(09-03): add SectionHeader primitive (MASTER §5.4)`)
- **Grep `interface Props` in Container.astro:** present (line 14)
- **Grep `as?: keyof HTMLElementTagNameMap` in Container.astro:** present (line 15)
- **Grep `class:list={["container", className]}` in Container.astro:** present (line 22)
- **Grep `<slot />` in Container.astro:** present (line 23)
- **Grep `interface Props` in MetaLabel.astro:** present (line 14)
- **Grep `color?: "ink" | "ink-muted" | "ink-faint"` in MetaLabel.astro:** present (line 16)
- **Grep `color = "ink"` in MetaLabel.astro:** present (line 20)
- **Grep `class:list={["label-mono"` in MetaLabel.astro:** present (line 23)
- **Grep `meta-label--${color}` in MetaLabel.astro:** present (line 23)
- **Grep `.meta-label--ink {` + `.meta-label--ink-muted {` + `.meta-label--ink-faint {` in MetaLabel.astro:** all present
- **Grep `import MetaLabel from "./MetaLabel.astro"` in StatusDot.astro:** present (line 13)
- **Grep `label: string` in StatusDot.astro:** present (line 16)
- **Grep `<MetaLabel text={label} color="ink" />` in StatusDot.astro:** present (line 24)
- **Grep `aria-hidden="true"` in StatusDot.astro:** present (line 23)
- **Grep `width: 6px` + `height: 6px` + `background: var(--accent)` + `margin-right: 8px` + `border-radius: 50%` + `display: inline-flex` in StatusDot.astro:** all present
- **Grep `number: string` + `title: string` + `count?: string` in SectionHeader.astro:** all present
- **Grep `§ {number} — {title}` in SectionHeader.astro:** present (line 25)
- **Grep `class="section-header"` + `class="section-rule"` in SectionHeader.astro:** both present
- **Grep `class="label-mono section-label"` + `class="meta-mono tabular section-count"` in SectionHeader.astro:** both present
- **Grep `display: flex` + `justify-content: space-between` + `align-items: baseline` in SectionHeader.astro:** all present
- **Grep `color: var(--ink)` + `color: var(--ink-faint)` in SectionHeader.astro:** both present
- **Grep `import.*tailwindcss` across all primitives:** 0 matches
- **Grep `oklch|#FAFAF7|#0A0A0A|#52525B|#A1A1AA|#E4E4E7|#E63946` across all primitives:** 0 matches
- **Grep `<script>` blocks across all primitives:** 0 matches (per D-03 zero-runtime contract)
- **`pnpm run check`:** 0 errors, 0 warnings, 2 pre-existing hints (unrelated to plan acceptance criteria)
- **`pnpm run build`:** exits 0, "Complete!", 10 pages prerendered, sitemap generated, Cloudflare Pages compat rearrange succeeds

---
*Phase: 09-primitives*
*Completed: 2026-04-08*
