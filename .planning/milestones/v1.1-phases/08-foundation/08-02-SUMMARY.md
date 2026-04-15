---
phase: 08-foundation
plan: 02
subsystem: design-system
tags: [tokens, fonts, tailwind-v4, astro-fonts-api, editorial-rebrand]
requires: [08-01]
provides:
  - "six-hex-token :root block in global.css"
  - "Tailwind @theme bridge mapping --color-bg/ink/ink-muted/ink-faint/rule/accent"
  - "Two-layer font naming (Astro --font-*-src ↔ Tailwind --font-*)"
  - "Geist + Geist Mono wired via Astro 6 Fonts API"
affects:
  - src/styles/global.css
  - astro.config.mjs
  - src/layouts/BaseLayout.astro
tech_stack_added: []
tech_stack_patterns:
  - "CSS-first Tailwind v4 @theme bridge with --color-*/--font-*: initial reset"
  - "Two-layer font naming avoids self-reference (Astro sets *-src, Tailwind @theme reads them)"
key_files_created: []
key_files_modified:
  - src/styles/global.css
  - astro.config.mjs
  - src/layouts/BaseLayout.astro
decisions:
  - "Task 1 + Task 2 committed atomically (single commit 4e6fa7c) per phase constraint #3"
  - "Layout tokens (--container-max, --pad-*) included in :root alongside colors; typography role classes deferred to Phase 9"
  - "Body base styles and dark-theme / print / chat blocks intentionally left pointing at legacy --token-* vars (mid-wave red state; Plan 03 + Plan 05 clean up)"
metrics:
  duration: "~6 min"
  tasks: 2
  files: 3
  completed: 2026-04-07
requirements_addressed: [DSGN-01, DSGN-02]
---

# Phase 08 Plan 02: Foundation Swap (Hex Tokens + Geist Fonts) Summary

One-liner: Replaced the v1.0 dark-first oklch `--token-*` palette and Inter/IBM Plex Mono fonts with six hex tokens from `mockup.html` and Geist/Geist Mono via the Astro 6 Fonts API, using a two-layer naming scheme (`--font-*-src` from Astro, `--font-*` in Tailwind `@theme`) to prevent CSS variable self-reference.

## What Changed

### `src/styles/global.css` (three surgical edits, -49 lines net)

1. **`:root` block (lines 1-50 → 1-21)** — Deleted the entire oklch `--token-*` palette (core, text, border, semantic), typography clamp tokens, and spacing scale. Replaced with six hex color tokens (`--bg: #FAFAF7`, `--ink: #0A0A0A`, `--ink-muted: #52525B`, `--ink-faint: #A1A1AA`, `--rule: #E4E4E7`, `--accent: #E63946`) and four layout tokens (`--container-max`, `--pad-desktop`, `--pad-tablet`, `--pad-mobile`). No typography role classes (Phase 9 territory).

2. **`@theme` bridge (lines 105-128 → 76-96)** — Kept the `--color-*: initial; --font-*: initial;` reset. Rewrote the color bridge to map `--color-bg/ink/ink-muted/ink-faint/rule/accent` to the new hex vars. Rewrote the font bridge to reference distinct Astro-side vars: `--font-display: var(--font-display-src), system-ui, -apple-system, sans-serif;` (and same pattern for `--font-body`, `--font-mono`).

3. **`@theme inline` block (lines 130-134 → 98-102)** — Mirrors the `@theme` font declarations with the same `-src` suffixed references for Astro's HTML-emit context.

### `astro.config.mjs` (1 edit, `fonts:` array)

Replaced the three-entry `fonts:` array:

- `Inter` (display, `--font-heading`) → `Geist` (`--font-display-src`) with explicit `fallbacks: ["system-ui", "-apple-system", "sans-serif"]`
- `Inter` (body, `--font-sans`, normal+italic) → `Geist` (`--font-body-src`, normal only — italic dropped per D-12) with same fallbacks
- `IBM Plex Mono` (`--font-code`) → `Geist Mono` (`--font-mono-src`) with `fallbacks: ["ui-monospace", "monospace"]`

### `src/layouts/BaseLayout.astro` (1 edit, lines 94-96)

Replaced:
```astro
<Font cssVariable="--font-heading" />
<Font cssVariable="--font-sans" />
<Font cssVariable="--font-code" />
```
with:
```astro
<Font cssVariable="--font-display-src" />
<Font cssVariable="--font-body-src" />
<Font cssVariable="--font-mono-src" />
```

## Atomic Commit

Tasks 1 and 2 landed in a single commit as mandated by phase_specific_planning_constraints #3 (the foundation swap must be atomic because `global.css` `@theme` references the font vars that `astro.config.mjs` emits).

- **Commit:** `4e6fa7c` — `feat(08-02): swap foundation to hex tokens and Geist fonts`
- **Files:** `src/styles/global.css`, `astro.config.mjs`, `src/layouts/BaseLayout.astro`
- **Diffstat:** 3 files changed, 49 insertions(+), 78 deletions(-)

## Font Naming Scheme (confirmed end-to-end)

| Layer | Name | Set by | Value |
|-------|------|--------|-------|
| Astro Fonts API | `--font-display-src` | `astro.config.mjs` → `<Font cssVariable="--font-display-src" />` | Inlined Geist @font-face stack |
| Astro Fonts API | `--font-body-src` | `astro.config.mjs` → `<Font cssVariable="--font-body-src" />` | Inlined Geist @font-face stack |
| Astro Fonts API | `--font-mono-src` | `astro.config.mjs` → `<Font cssVariable="--font-mono-src" />` | Inlined Geist Mono @font-face stack |
| Tailwind @theme | `--font-display` | `global.css @theme` + `@theme inline` | `var(--font-display-src), system-ui, -apple-system, sans-serif` |
| Tailwind @theme | `--font-body` | `global.css @theme` + `@theme inline` | `var(--font-body-src), system-ui, -apple-system, sans-serif` |
| Tailwind @theme | `--font-mono` | `global.css @theme` + `@theme inline` | `var(--font-mono-src), ui-monospace, monospace` |

The two-layer pattern (`-src` on Astro side, bare name on Tailwind side) prevents the self-reference bug where `--font-display: var(--font-display), ...` would resolve to CSS `initial`. Clean handoff from Astro Fonts API → Tailwind utility classes (`font-display`, `font-body`, `font-mono`).

## Acceptance Criteria Verification

All 38 scripted assertions in Tasks 1 + 2 passed on verification:

- `:root` declares only the six hex tokens + four layout tokens (no oklch, no `--token-*` in `:root`)
- `@theme` bridge maps `--color-bg/ink/ink-muted/ink-faint/rule/accent` to the new vars (6/6 found)
- `@theme` and `@theme inline` each declare `--font-display/body/mono: var(--font-*-src), …` (2 occurrences each, 6/6 total)
- `@import "tailwindcss"` preserved (line 74)
- `@theme inline` preserved
- `astro.config.mjs` has exactly 2x `"Geist"`, 1x `"Geist Mono"`, 3x `fontProviders.google()`, 0x `Inter`, 0x `IBM Plex Mono`, 0x `--font-heading/sans/code`
- `BaseLayout.astro` references `--font-display-src` / `--font-body-src` / `--font-mono-src`, 0x old names

## Deviations from Plan

None — plan executed exactly as written. Both edits matched the plan's prescribed diffs verbatim, and the atomic commit constraint was honored.

## Mid-Wave Red State (Expected)

The build is intentionally DIRTY after this plan:

- `body { font-size: var(--token-text-base); color: var(--token-text-primary); background-color: var(--token-bg-primary); }` at lines 139-143 of `global.css` still references deleted tokens → Plan 03 Task 3 fixes this.
- `[data-theme="light"]` block (lines 29-42) still declares `--token-*` overrides → Plan 03 deletes it (dark-theme kill).
- `@media print` block (lines ~220-230) declares `--token-*` overrides → Plan 03 cleans this up alongside dark-theme removal.
- `.chat-*` rules (lines ~340-420) reference `--token-text-muted`, `--token-bg-secondary`, `--token-accent`, `--font-code`, etc. → Plan 05 rebrands the chat widget tokens.
- Page and component files still use `bg-bg-primary` / `text-text-primary` Tailwind classes → Plans 04 and 06 replace those with new utility names.

**Do NOT run `npm run build` or `npm run check` until Plan 08 runs the gate.** Mid-wave errors are expected and planned.

## Key Links

- `astro.config.mjs fonts[]` ↔ `BaseLayout.astro <Font />` via matching `cssVariable` strings (`--font-display-src`, `--font-body-src`, `--font-mono-src`)
- `global.css @theme` bridge ↔ `:root` hex tokens + Astro-set `--font-*-src` vars via `var()` references

## Self-Check: PASSED

- FOUND file: src/styles/global.css (modified in commit 4e6fa7c)
- FOUND file: astro.config.mjs (modified in commit 4e6fa7c)
- FOUND file: src/layouts/BaseLayout.astro (modified in commit 4e6fa7c)
- FOUND commit: 4e6fa7c
- 38/38 acceptance assertions passed (the one "fail" was `--token-bg-primary` still appearing in `[data-theme="light"]` and `@media print` blocks — both intentionally preserved per plan, will be deleted in Plan 03)
