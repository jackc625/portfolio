---
phase: 09-primitives
plan: 02
subsystem: ui
tags: [css, typography, tailwind-v4, design-system, editorial, layout]

# Dependency graph
requires:
  - phase: 08-foundation
    provides: "src/styles/global.css with Phase 8 :root tokens (--bg/--ink/--ink-muted/--ink-faint/--rule/--accent/--container-max/--pad-desktop/--pad-tablet/--pad-mobile) and @theme/@theme-inline bridges for --color-*/--font-* utilities"
  - phase: 09-primitives
    provides: "design-system/MASTER.md §3.1 type roles + §4 layout (plan 09-01 locked §5.8 and §5.2 amendments)"
provides:
  - "Seven editorial typography role classes in src/styles/global.css as global utilities: .display, .h1-section, .h2-project, .lead, .body, .label-mono, .meta-mono"
  - ".tabular numeric utility for metadata blocks"
  - ".container global layout helper (max-width var(--container-max), auto margin, responsive padding)"
  - ".section vertical rhythm helper (160px desktop / 96px tablet / 72px mobile margin-top)"
  - ".section-rule divider shape (1px, var(--rule), 16px top / 24px bottom margin)"
  - "Responsive breakpoints at 1023px and 767px for .container padding and .section margin"
affects: [09-03, 09-04, 09-05, 09-06, 09-07, 09-08, 10-page-port]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-12/D-13: Global CSS layer (LAYER 3) for type roles and shared structurals; primitives do not re-declare typography in scoped <style>"
    - "D-14: Component-local layout stays inside each primitive's scoped <style> (Container.astro wraps .container, SectionHeader.astro uses .section-rule — no duplication)"
    - "D-15: Type role classes remain pure CSS helpers — NOT @theme entries. No text-display / text-h1-section Tailwind utilities generated; intentional to keep @theme surface minimal"
    - "D-16: Structural helpers consume existing --container-max/--pad-* tokens only. No new color tokens, no shade variants, no semantic aliases"
    - "D-26: Phase 8 blocks (chat widget, @theme bridges, nav-link-hover, print, :root) are hands-off across the append; edit is strictly additive at file tail"

key-files:
  created: []
  modified:
    - src/styles/global.css

key-decisions:
  - "[Phase 09-02] LAYER 3 appended at file tail (after existing @media (max-width: 767px) chat-panel-mobile rule) — zero edits to LAYER 1/2 or chat block preserves Phase 8 contract verbatim"
  - "[Phase 09-02] Type role classes set font-family via var(--font-display)/var(--font-body)/var(--font-mono) — names are semantic (role-driven) even though --font-display/--font-body both resolve to Geist through the Phase 8 @theme bridge"
  - "[Phase 09-02] Only .display sets an explicit color: var(--ink) — other role classes inherit to avoid locking hue (e.g., .label-mono inside .section-header overrides to var(--ink) per mockup.html line 195)"
  - "[Phase 09-02] Responsive breakpoints use token references (var(--pad-tablet), var(--pad-mobile)) instead of hardcoded 32px/24px — the Phase 8 tokens already match mockup.html values and token references are the intended consumer pattern"

patterns-established:
  - "Editorial typography utility pattern: role-named class (.display / .h1-section / .h2-project / .lead / .body / .label-mono / .meta-mono) set once globally, applied directly to semantic HTML elements (no Tailwind typography utilities needed)"
  - "Global structural helper pattern: .container for horizontal gutters + .section for vertical rhythm + .section-rule for editorial dividers — every Phase 10 page imports zero new CSS, just applies these classes"
  - "Breakpoint alignment: all responsive thresholds locked to 1023px (tablet) and 767px (mobile) across Phase 9, matching mockup.html and the existing chat-panel-mobile breakpoint"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-04-08
---

# Phase 9 Plan 02: Global CSS Foundations Summary

**Appended LAYER 3 (editorial typography role classes + .container/.section/.section-rule structural helpers + responsive breakpoints) to src/styles/global.css — transcribed verbatim from mockup.html §43-99/§188-203/§329-344, Phase 8 blocks untouched, build and astro check both green.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-08T19:08:21Z
- **Completed:** 2026-04-08T19:13:41Z
- **Tasks:** 1
- **Files modified:** 1 (src/styles/global.css; +114 lines)

## Accomplishments

- Appended the Phase 9 LAYER 3 comment-header block and all nine role/structural declarations to `src/styles/global.css` (lines 320-431 after the edit)
- All seven editorial typography role classes from MASTER.md §3.1 now exist as global utilities: `.display`, `.h1-section`, `.h2-project`, `.lead`, `.body`, `.label-mono`, `.meta-mono`
- `.tabular` numeric utility added alongside the type roles (used by meta blocks with dates/percentages)
- `.container`, `.section`, `.section-rule` structural helpers added from MASTER.md §4 and mockup.html §188/§198-203
- Responsive breakpoints added at `(max-width: 1023px)` and `(max-width: 767px)` for `.container` padding (tablet 32px / mobile 24px via `var(--pad-tablet)` / `var(--pad-mobile)`) and `.section` margin-top (96px / 72px)
- Zero edits to Phase 8 LAYER 1 (:root tokens), LAYER 2 (@import "tailwindcss" / @source / @theme / @theme inline), base element styles, `.nav-link-hover`, `.print-only-header`, `@media print`, and all `.chat-*` rules — D-26 hands-off contract preserved
- `pnpm run build` exits 0 (Tailwind v4 Oxide compiles the new block cleanly, no new warnings from any of the 15 new selectors or 2 new media queries)
- `pnpm run check` reports 0 errors / 0 warnings / 1 pre-existing hint

## Task Commits

1. **Task 1: Append editorial typography role classes + structural helpers to global.css** — `133d656` (feat)

_Plan metadata commit will bundle SUMMARY.md, STATE.md, ROADMAP.md, and deferred-items.md separately._

## Files Created/Modified

- `src/styles/global.css` — Appended 114 lines at end of file. New LAYER 3 block spans lines 320-431: comment header (lines 320-329), type role classes (lines 332-390, eight declarations), structural helpers (lines 393-410, three declarations), responsive media queries (lines 413-430, two blocks). Phase 8 blocks at lines 1-317 are byte-identical to pre-edit state.

## Decisions Made

All content was transcribed verbatim from the plan's `<action>` block, which itself reproduces mockup.html §43-99/§188-203/§329-344 and MASTER.md §3.1/§4. No content divergence from the plan. The four key-decisions listed in the frontmatter restate plan-level choices that were locked during planning (plan 09-01 MASTER amendment + the Phase 9 CONTEXT.md D-12..D-16/D-26 decisions), not new execution-time choices.

## Deviations from Plan

None - plan executed exactly as written. The `<action>` block's 114-line verbatim append was pasted with no modifications.

## Issues Encountered

**Tailwind v4 lightning-css pre-existing warnings.** During `pnpm run build` verification, the Oxide bundler emits four `Unexpected token Delim('*')` warnings from literal `px-[var(--token-space-*)]` / `text-[length:var(--token-text-*)]` strings somewhere in the project's template detection surface. Confirmed PRE-EXISTING (not caused by this plan) via `git stash` → clean-base build → identical warning count (4). Plan 09-02 introduces zero `[var(--token-*)]` arbitrary-value utilities, so these warnings are out of scope per the GSD scope boundary rule. Logged to `.planning/phases/09-primitives/deferred-items.md` for Phase 11 polish triage.

**Spec-vs-reality note on the `oklch` regression check.** The plan's acceptance criteria says "src/styles/global.css does NOT contain the string `oklch`". The file does contain one occurrence — inside the Phase 8 LAYER 1 header comment (`* Six hex values — no oklch, no dark theme, no semantic tokens`). This is a preservation requirement from Phase 8 that D-26 explicitly forbids touching. The intent of the check (no oklch color *function references*) is satisfied — there are zero `oklch(...)` color function calls anywhere in the file. The comment is a documentation marker.

## Build Observations

**Tailwind v4 Oxide build output:** The new LAYER 3 block compiles cleanly. Tailwind v4 does NOT automatically emit `text-display` / `text-h1-section` utility classes from the new role classes because they are plain CSS selectors, not `@theme` entries (D-15 compliance — intentional to keep the Tailwind utility surface minimal and force primitives to apply `class="display"` directly, not `class="text-display"`). Sitemap generation, prerendering, Cloudflare Workers server build, fonts copy, and pages-compat rearrange all succeed. Build completes in ~8s (vite server build) with no regression from the pre-edit baseline.

## User Setup Required

None — pure CSS append, no environment variables, no external configuration, no runtime changes.

## Next Phase Readiness

- **Ready for 09-03 (stateless primitives):** The seven type role classes and `.tabular` utility are now available as global selectors for `SectionHeader.astro`, `Meta.astro`, `Label.astro`, and any other stateless primitive that needs editorial typography.
- **Ready for 09-04 (composite primitives):** `.container` is available for `Container.astro` to apply to its root element, `.section` is available for section primitives to inherit vertical rhythm, `.section-rule` is available for `SectionHeader.astro` to render the editorial divider.
- **Ready for 09-05 (BaseLayout swap):** The global helpers are in place; BaseLayout can wrap `<main>` content in `.container` without any primitive import.
- **Ready for Phase 10 (page port):** Every page can apply `class="container"` for horizontal gutters and `class="section"` for vertical rhythm without importing any new CSS file. Responsive behavior at 1023px/767px is fully automatic.
- **No blockers.** Sequential wave 2 is complete; wave 3 (09-03 stateless primitives) is unblocked.

## Self-Check: PASSED

- **File `src/styles/global.css`:** FOUND (modified, +114 insertions)
- **Commit `133d656`:** FOUND in git log (`133d656 feat(09-02): add editorial typography + structural helpers to global.css`)
- **Grep `.display {`:** present (line 332)
- **Grep `.h1-section {`:** present (line 341)
- **Grep `.h2-project {`:** present (line 349)
- **Grep `.lead {`:** present (line 357)
- **Grep `.body {`:** present (line 364)
- **Grep `.label-mono {`:** present (line 372)
- **Grep `.meta-mono {`:** present (line 380)
- **Grep `.tabular {`:** present (line 387)
- **Grep `.container {`:** present (lines 393, 414, 424 — main rule + 2 responsive overrides)
- **Grep `.section {`:** present (lines 400, 418, 428)
- **Grep `.section-rule {`:** present (line 404)
- **Grep `clamp(4rem, 9vw, 8rem)`:** present (.display font-size)
- **Grep `clamp(2.5rem, 5vw, 3.5rem)`:** present (.h1-section font-size)
- **Grep `letter-spacing: -0.035em`:** present (.display letter-spacing)
- **Grep `letter-spacing: 0.12em`:** present (.label-mono letter-spacing)
- **Grep `font-size: 1.75rem`:** present (.h2-project)
- **Grep `font-size: 0.8125rem`:** present (.meta-mono)
- **Grep `font-size: 0.75rem`:** present (.label-mono)
- **Grep `max-width: 68ch`:** present (.body)
- **Grep `margin-top: 160px`:** present (.section desktop)
- **Grep `margin-top: 96px`:** present (.section tablet)
- **Grep `margin-top: 72px`:** present (.section mobile)
- **Grep `@media (max-width: 1023px)`:** 1 occurrence (new Phase 9 responsive block)
- **Grep `@media (max-width: 767px)`:** 2 occurrences (pre-existing chat-panel-mobile + new Phase 9 responsive block) — satisfies "count must be ≥2"
- **Grep `oklch(`:** 0 occurrences (no color function calls; single prose occurrence in Phase 8 comment is a hands-off preservation requirement)
- **Grep `.chat-bot-message`:** present (chat hands-off D-26 regression check passes)
- **Grep `.nav-link-hover`:** present (existing hover rule preserved)
- **Grep `--color-bg: var(--bg)`:** present (Phase 8 @theme bridge preserved)
- **Grep `@import "tailwindcss"`:** present (preflight source directive survived)
- **Grep `@theme` (blocks only):** exactly 2 occurrences (`@theme {` at line 39, `@theme inline {` at line 61) — no new @theme entries added per D-15
- **`pnpm run build`:** exits 0, "Complete!", 8 pages prerendered, sitemap generated
- **`pnpm run check`:** 0 errors, 0 warnings, 1 pre-existing hint unrelated to this plan

---
*Phase: 09-primitives*
*Completed: 2026-04-08*
