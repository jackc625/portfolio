---
phase: 09-primitives
plan: 02
type: execute
wave: 2
depends_on: [09-01]
files_modified:
  - src/styles/global.css
autonomous: true
requirements: []

must_haves:
  truths:
    - "All seven typography role classes from MASTER §3.1 exist as global utilities in src/styles/global.css"
    - ".container, .section, .section-rule global helpers exist with the responsive padding/rhythm values from mockup.html"
    - "The existing Phase 8 token layer, @theme bridge, nav-link-hover rule, print block, and chat block are all unchanged"
    - "No new color tokens are introduced and no oklch references appear anywhere"
  artifacts:
    - path: src/styles/global.css
      provides: Type role classes (.display, .h1-section, .h2-project, .lead, .body, .label-mono, .meta-mono, .tabular), .container, .section, .section-rule
      contains: ".label-mono"
  key_links:
    - from: src/styles/global.css .container
      to: Plan 03 Container.astro primitive
      via: Global class that Container.astro applies to its root element
      pattern: "\\.container\\s*\\{"
    - from: src/styles/global.css .section + .section-rule
      to: Plan 03 SectionHeader.astro primitive
      via: SectionHeader references .section-rule divider shape; Phase 10 uses .section for vertical rhythm
      pattern: "\\.section-rule\\s*\\{"
---

<objective>
Land the editorial CSS foundations in `src/styles/global.css`: the seven typography role classes from MASTER §3.1 plus the shared structural helpers `.container`, `.section`, and `.section-rule` from MASTER §4 and mockup.html §55–99, §188–203, §331–344. These are the global helpers every Phase 9 primitive and every Phase 10 page will consume.

**Purpose:** Without these classes in place, every primitive would need to redefine its own typography/layout inside scoped `<style>` blocks, duplicating mockup.html values across files. Per D-12 and D-13, typography roles and shared structurals live globally; per D-14, component-local layout stays scoped. This plan lands the global half.

**Output:** One commit that appends a new `Editorial Typography & Structural Helpers (Phase 9)` block to `src/styles/global.css`, with zero edits to the existing Phase 8 token layer, @theme bridge, nav-link-hover rule, print block, or chat block (D-26 hands-off).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/09-primitives/09-CONTEXT.md
@src/styles/global.css
@mockup.html
@design-system/MASTER.md

<interfaces>
<!-- Current global.css structure Phase 9 must preserve -->

Phase 8 blocks in src/styles/global.css that MUST be untouched:
- Lines 1–21: :root token declarations (--bg, --ink, --ink-muted, --ink-faint, --rule, --accent, --container-max, --pad-desktop, --pad-tablet, --pad-mobile)
- Lines 30–65: @import "tailwindcss", @source scoping, @theme + @theme inline bridges for --color-* and --font-*
- Lines 71–83: html and body base styles
- Lines 88–107: .nav-link-hover underline animation rule (reused by Header.astro per plan 04)
- Lines 112–218: .print-only-header and @media print block
- Lines 221–317: Chat widget styles (.typing-dot, .chat-textarea, .chat-bot-message, .chat-starter-chip, .hover-text-primary, .chat-copy-btn, .copy-success, .chat-panel-mobile) — ALL of these are D-26 hands-off; do NOT touch

Values to transcribe from mockup.html (exact lines):
- Lines 55–62: .display — Geist 700, clamp(4rem, 9vw, 8rem), line-height 0.92, letter-spacing -0.035em, color var(--ink)
- Lines 63–68: .h1-section — 600, clamp(2.5rem, 5vw, 3.5rem), line-height 1.05, letter-spacing -0.02em
- Lines 69–74: .h2-project — 500, 1.75rem, line-height 1.2, letter-spacing -0.01em
- Lines 75–79: .lead — 400, clamp(1.25rem, 2vw, 1.625rem), line-height 1.4
- Lines 80–85: .body — 400, 1.125rem, line-height 1.6, max-width 68ch
- Lines 86–92: .label-mono — Geist Mono 500, 0.75rem, uppercase, letter-spacing 0.12em
- Lines 93–98: .meta-mono — Geist Mono 400, 0.8125rem, letter-spacing 0.02em
- Line 50: .tabular — font-variant-numeric: tabular-nums
- Lines 43–48: .container — max-width var(--container-max), margin 0 auto, padding-left/right var(--pad-desktop)
- Lines 188: .section — margin-top 160px
- Lines 198–203: .section-rule — height 1px, background var(--rule), margin-top 16px, margin-bottom 24px
- Lines 331–338: @media (max-width: 1023px) — .container padding 32px, .section margin-top 96px
- Lines 340–344: @media (max-width: 767px) — .container padding 24px, .section margin-top 72px
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Append editorial typography role classes + structural helpers to global.css</name>
  <files>src/styles/global.css</files>
  <read_first>
    - src/styles/global.css lines 1–317 ENTIRE FILE — you must see the current structure so the new block is appended at a safe position and does not collide with existing rules
    - mockup.html lines 43–99 (typography role declarations — these are the verbatim values you copy)
    - mockup.html lines 188–203 (.section, .section-header, .section-rule)
    - mockup.html lines 329–348 (responsive breakpoints for .container and .section)
    - design-system/MASTER.md §3.1 (type roles — confirm values match mockup.html)
    - design-system/MASTER.md §4 (layout — confirm .container and .section specs match mockup.html)
    - .planning/phases/09-primitives/09-CONTEXT.md D-12, D-13, D-15, D-16, D-26
  </read_first>
  <action>
APPEND the following block to `src/styles/global.css` at the END of the file (after the closing `}` of the `@media (max-width: 767px)` chat-panel-mobile rule around line 317). Add two blank lines between the end of the existing file and the new block comment header.

DO NOT modify any existing block. DO NOT rename, reorder, or delete any existing rule. DO NOT touch any `.chat-*` rule (D-26 chat hands-off). DO NOT touch the `@theme` or `@theme inline` bridges (D-15 keep them intact). DO NOT add new `@theme` entries for type-role text utilities (D-15 explicitly forbids `text-display` / `text-h1-section` Tailwind utilities).

Append this block verbatim:

```css
/* ============================================
 * LAYER 3: Editorial Typography & Structural Helpers (Phase 9)
 * Source of truth: design-system/MASTER.md §3.1 + §4
 *                   mockup.html lines 43–99 and 188–203 and 329–344
 * Per D-12 and D-13: type role classes and shared structurals live here as
 * global helpers. Per D-14: component-local layout stays inside each
 * primitive's scoped <style> block, not here.
 * Per D-16: no new color tokens, no semantic aliases, no shade variants.
 * ============================================ */

/* -- Typography role classes (MASTER §3.1 / mockup.html §55–99) -- */

.display {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(4rem, 9vw, 8rem);
  line-height: 0.92;
  letter-spacing: -0.035em;
  color: var(--ink);
}

.h1-section {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
}

.h2-project {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.lead {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: clamp(1.25rem, 2vw, 1.625rem);
  line-height: 1.4;
}

.body {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 1.125rem;
  line-height: 1.6;
  max-width: 68ch;
}

.label-mono {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.meta-mono {
  font-family: var(--font-mono);
  font-weight: 400;
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
}

.tabular {
  font-variant-numeric: tabular-nums;
}

/* -- Structural helpers (MASTER §4 / mockup.html §43–48, §188, §198–203) -- */

.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding-left: var(--pad-desktop);
  padding-right: var(--pad-desktop);
}

.section {
  margin-top: 160px;
}

.section-rule {
  height: 1px;
  background: var(--rule);
  margin-top: 16px;
  margin-bottom: 24px;
}

/* -- Responsive breakpoints for .container + .section (mockup.html §329–344) -- */

@media (max-width: 1023px) {
  .container {
    padding-left: var(--pad-tablet);
    padding-right: var(--pad-tablet);
  }
  .section {
    margin-top: 96px;
  }
}

@media (max-width: 767px) {
  .container {
    padding-left: var(--pad-mobile);
    padding-right: var(--pad-mobile);
  }
  .section {
    margin-top: 72px;
  }
}
```

IMPORTANT notes on values:

- `.display`, `.h1-section`, `.h2-project` use `var(--font-display)` (not `var(--font-body)`) because `--font-display` and `--font-body` both resolve to Geist in the Phase 8 @theme bridge; using `--font-display` matches the role-name semantics
- `.lead` and `.body` use `var(--font-body)`
- `.label-mono` and `.meta-mono` use `var(--font-mono)`
- All three `var(--font-*)` references resolve through the existing @theme bridge — Phase 8 already declares them — so NO new @theme entries are needed
- The 8 color-token `var(--*)` references inside the new block (`var(--ink)`, `var(--rule)` in `.section-rule`, `var(--container-max)`, `var(--pad-desktop)`, `var(--pad-tablet)`, `var(--pad-mobile)`) already exist in the Phase 8 :root block (lines 7–21). No new token definitions.
- NO `color:` declaration on `.h1-section`, `.h2-project`, `.lead`, `.body`, `.label-mono`, `.meta-mono`, `.tabular` — they inherit from parent. Only `.display` sets `color: var(--ink)` because it ships as the hero display and benefits from the explicit lock (matching mockup.html line 61).
  </action>
  <verify>
    <automated>rtk pnpm run build</automated>
  </verify>
  <acceptance_criteria>
    - src/styles/global.css contains the literal string `.display {` in a selector
    - src/styles/global.css contains the literal string `.h1-section {`
    - src/styles/global.css contains the literal string `.h2-project {`
    - src/styles/global.css contains the literal string `.label-mono {`
    - src/styles/global.css contains the literal string `.meta-mono {`
    - src/styles/global.css contains the literal string `.tabular {`
    - src/styles/global.css contains the literal string `.container {`
    - src/styles/global.css contains the literal string `.section {`
    - src/styles/global.css contains the literal string `.section-rule {`
    - src/styles/global.css contains `clamp(4rem, 9vw, 8rem)` — exact .display font-size
    - src/styles/global.css contains `clamp(2.5rem, 5vw, 3.5rem)` — exact .h1-section font-size
    - src/styles/global.css contains `letter-spacing: -0.035em` — exact .display letter-spacing
    - src/styles/global.css contains `letter-spacing: 0.12em` — exact .label-mono letter-spacing
    - src/styles/global.css contains `font-size: 1.75rem` — exact .h2-project font-size
    - src/styles/global.css contains `font-size: 0.8125rem` — exact .meta-mono font-size
    - src/styles/global.css contains `font-size: 0.75rem` — exact .label-mono font-size
    - src/styles/global.css contains `max-width: 68ch` — exact .body max-width
    - src/styles/global.css contains `margin-top: 160px` — exact .section margin (desktop)
    - src/styles/global.css contains `margin-top: 96px` — tablet .section margin
    - src/styles/global.css contains `margin-top: 72px` — mobile .section margin
    - src/styles/global.css contains `@media (max-width: 1023px)` inside the new block
    - src/styles/global.css contains `@media (max-width: 767px)` inside the new block (note: the existing chat-panel-mobile block also uses this — grep count must be ≥2 after edit)
    - src/styles/global.css does NOT contain the string `oklch` (regression check — Phase 8 removed all oklch)
    - src/styles/global.css does NOT contain any new `@theme` block (D-15 — only the two existing @theme and @theme inline bridges should remain)
    - src/styles/global.css still contains the literal `.chat-bot-message` (chat hands-off regression check — D-26)
    - src/styles/global.css still contains the literal `.nav-link-hover` (existing hover rule preserved)
    - src/styles/global.css still contains the literal `--color-bg: var(--bg)` from the Phase 8 @theme bridge
    - src/styles/global.css still contains the literal `@import "tailwindcss"` (preflight regression check — `.container`/`.section` rely on Tailwind v4 preflight `box-sizing: border-box`; the Tailwind source directive MUST survive the append)
    - `rtk pnpm run build` exits 0 (Tailwind v4 compiles the new block without warnings)
    - `rtk pnpm run check` exits 0 (astro check still green)
  </acceptance_criteria>
  <done>Global editorial typography + structural helpers exist in global.css, Phase 8 blocks untouched, build passes</done>
</task>

</tasks>

<verification>
- `rtk grep -c "\\.display \\|\\.h1-section \\|\\.h2-project \\|\\.lead \\|\\.body \\|\\.label-mono \\|\\.meta-mono \\|\\.tabular \\|\\.container \\|\\.section \\|\\.section-rule " src/styles/global.css` — at least 11 role/helper selectors present
- `rtk grep -c "oklch" src/styles/global.css` returns 0 (regression)
- `rtk grep -c "\\.chat-" src/styles/global.css` returns the same count as before this plan ran (D-26 regression)
- `rtk pnpm run build` passes
- `rtk pnpm run check` passes
</verification>

<success_criteria>
- Every typography role class from MASTER §3.1 exists in global.css with the exact mockup.html values
- .container / .section / .section-rule exist with their responsive breakpoints at 1023px and 767px
- No chat rules touched, no @theme modified, no new color tokens introduced
- build + check both pass
</success_criteria>

<output>
After completion, create `.planning/phases/09-primitives/09-02-SUMMARY.md` recording:
- The new `LAYER 3` block added to global.css (line range)
- Confirmation that Phase 8 blocks are untouched (chat, @theme, nav-link-hover, print)
- Any observations about Tailwind v4 Oxide build output (warnings, new utilities generated, etc.)
- Commit SHA
</output>
