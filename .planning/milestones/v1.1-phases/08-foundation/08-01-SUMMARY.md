---
phase: 08-foundation
plan: 01
subsystem: design-system
tags: [design-system, contract, foundation, editorial-redesign, v1.1]
requires: [mockup.html, .planning/phases/08-foundation/08-CONTEXT.md]
provides: [design-system/MASTER.md]
affects: []
tech_stack:
  added: []
  patterns: [spec-first-primitives, locked-design-contract, hex-token-palette, role-class-typography]
key_files:
  created:
    - design-system/MASTER.md
  modified: []
decisions:
  - "MASTER.md placed at repo root design-system/ (D-02) — visible to recruiters cloning the repo"
  - "Pragmatic motion line (D-13) documented with explicit Dead and Allowed-to-survive lists"
  - "All 7 Phase 9 primitives front-loaded with full specs (D-04) to make Phase 9's no-requirement-mappings sequencing scaffold workable"
  - "Chat widget token map (D-19 + D-27 + D-28) included in §9 so Phase 10 CHAT-02 inherits a clean target"
metrics:
  duration_min: 8
  tasks_completed: 1
  files_created: 1
  files_modified: 0
  line_count: 749
  section_count: 10
completed: 2026-04-07
commit: 45cdf93
---

# Phase 8 Plan 1: Author design-system/MASTER.md Summary

Created `design-system/MASTER.md` as the locked design contract for milestone v1.1 (Editorial Redesign). The file is 749 lines, comprehensively documents tokens, typography, layout, primitives, motion, accent rules, anti-patterns, and the chat widget token map, and is the single source of truth Phase 9 reads to build primitives without re-interpreting `mockup.html`.

## What Was Built

A single new file at the repo root: `design-system/MASTER.md` (749 lines, 10 numbered top-level sections, no other files touched).

### Section breakdown

| § | Section | Content |
|---|---------|---------|
| 1 | Overview | Locked-contract framing, milestone scope, read-only rule |
| 2 | Tokens | 6 color tokens + 4 layout tokens transcribed verbatim from mockup.html lines 14-25; explicit lock contract; Tailwind `@theme` bridge example |
| 3 | Typography | All 7 role classes (`.display`, `.h1-section`, `.h2-project`, `.lead`, `.body`, `.label-mono`, `.meta-mono`) with exact clamp/size/weight/letter-spacing, plus fluid sizing rule and `.tabular` utility |
| 4 | Layout | Container spec, section rhythm (160/96/72px), hero grid (12-col), section header pattern, hero padding ramp |
| 5 | Components | Full specs for all 7 Phase 9 primitives (Header, Footer, Container, SectionHeader, WorkRow, MetaLabel, StatusDot) with Name/Purpose/Props/Sizing/Colors/Typography/States/Mobile/HTML sketch — plus §5.8 deferring the MobileMenu keep-or-delete to Phase 9 |
| 6 | Motion | Pragmatic motion line (D-13): Dead list (GSAP, view transitions, canvas, scroll-trigger, chat GSAP, theme transitions) and Allowed-to-survive list (Tailwind transition-colors, nav-link-hover, footer translate, chat-copy-btn opacity, work-arrow 120ms, prefers-reduced-motion respect) with explicit "why this matters" rationale |
| 7 | Accent usage | Where accent IS allowed table, where accent is NEVER allowed list, the signal rule ("if a user can't click it, it can't be accent") |
| 8 | Anti-patterns | 16 forbidden v1.0 patterns with one-sentence rationales each (oklch, theme toggle, GSAP, ClientRouter, cards, canvas hero, skill icons, contact form, Inter/IBM Plex, `--token-*` namespace, fluid size variables, theme-transitioning, semantic aliases, view transitions, silent color additions) |
| 9 | Chat Widget Token Map | D-19 + D-27 + D-28 mapping table (12 rows), Phase 8 vs Phase 10 chat scope, cross-page persistence regression note (D-29), chat as regression gate (D-26 verification gate restated) |
| 10 | Changelog | Single line: `2026-04-07 — v1.1 initial lock (Phase 8)` |

## Acceptance Criteria — All Pass

| Check | Required | Actual |
|-------|----------|--------|
| `test -f design-system/MASTER.md` | exit 0 | pass |
| `wc -l design-system/MASTER.md` | ≥ 400 | 749 |
| `grep -c "#FAFAF7"` | ≥ 1 | 2 |
| `grep -c "#0A0A0A"` | ≥ 1 | 2 |
| `grep -c "#52525B"` | ≥ 1 | 2 |
| `grep -c "#A1A1AA"` | ≥ 1 | 2 |
| `grep -c "#E4E4E7"` | ≥ 1 | 4 |
| `grep -c "#E63946"` | ≥ 1 | 3 |
| `grep -c "Geist Mono"` | ≥ 2 | 14 |
| `grep -E "^## [0-9]+\." \| wc -l` | ≥ 10 | 10 |
| `grep -c "WorkRow"` | ≥ 1 | 5 |
| `grep -c "SectionHeader"` | ≥ 1 | 3 |
| `grep -c "Container"` | ≥ 1 | 10 |
| `grep -c "StatusDot"` | ≥ 1 | 4 |
| `grep -c "MetaLabel"` | ≥ 1 | 5 |
| `grep -c "Header"` | ≥ 1 | 5 |
| `grep -c "Footer"` | ≥ 1 | 2 |
| `grep -c "pragmatic motion"` | ≥ 1 | 4 |
| `grep -ci "anti-pattern"` | ≥ 1 | 2 |
| `grep -c "ClientRouter"` | ≥ 1 | 4 |
| `grep -cE "token-destructive\|token-warning"` | ≥ 1 | 3 |

## Sections Elaborated Beyond Minimum Spec

A few sections went deeper than the plan's bare minimum because the locked-contract role of MASTER.md rewards explicitness:

1. **§2.3 Lock contract** — added an explicit "no `--color-primary`, no `--color-surface`, no rgba/hsla" enumeration plus a Tailwind `@theme` bridge code example. The plan only required the callout sentence, but the lock contract is the entire purpose of the file, so spelling out the prohibited semantic aliases prevents Phase 9 from inventing `--color-primary` as a shortcut.
2. **§5 primitives** — every primitive includes an HTML sketch transcribed from `mockup.html` (not just an ASCII outline). This makes Phase 9 a copy-modify exercise rather than an interpretation exercise.
3. **§5.5 WorkRow** — flagged the letter-spacing override on `.work-stack` (0.12em instead of `.meta-mono`'s 0.02em) explicitly with a mockup line reference. This is a subtle inconsistency in the mockup that Phase 9 would otherwise miss; documenting it now prevents a "should we use 0.02 or 0.12?" deviation later.
4. **§6.4 Why this matters** — added a paragraph explaining the temptation Phase 9 will face (read mockup.html prefers-reduced-motion comment and conclude the system is motionless) and the explicit answer (state transitions stay; orchestrated motion goes). The plan only required the Dead and Allowed lists; adding the rationale makes the rule self-defending.
5. **§7 Accent usage** — added a "where accent is NEVER allowed" subsection beyond the plan's "what accent is for" requirement, plus the explicit "signal rule" one-liner. The negative space is as important as the positive.
6. **§8 Anti-patterns** — expanded from the plan's 11 explicit items to 16 by adding: no fluid sizing variables, no `.theme-transitioning` class, no semantic color aliases, no view transition keyframes, no silent color additions. Each is a v1.0 pattern that could plausibly leak back in.

## Judgment Calls

A few mockup ambiguities required a documented judgment call rather than blind transcription:

1. **Header wordmark size** — mockup uses **0.875rem** for `.wordmark` (line 120) but the standard `.label-mono` role class is 0.75rem. I documented this in §5.1 explicitly as "wordmark uses a slightly larger mono than `.label-mono`" with both values shown, rather than treating wordmark as `.label-mono` (which would silently shrink it) or inventing a new role class. Phase 9 must use 0.875rem for the wordmark.
2. **`.work-stack` letter-spacing** — mockup uses `0.12em` for `.work-stack` (line 234) but `.meta-mono` is `0.02em`. I documented in §5.5 that the `.work-stack` selector overrides `.meta-mono` letter-spacing in this one case, with a mockup line reference. Phase 9 should treat work-stack as a labeled exception, not invent a new role.
3. **`.work-num` font-size and weight** — mockup uses `font-size: 1rem; font-weight: 500;` for `.work-num` (lines 220-224), which is bigger and bolder than the standard `.meta-mono` 0.8125rem/400. Documented in §5.5 typography as "slightly bigger and bolder than the rest of the meta-mono usage" so Phase 9 doesn't apply `.meta-mono` directly.
4. **`StatusDot` ARIA** — the mockup marks the dot with `aria-hidden="true"` (line 374). I preserved this in the §5.7 HTML sketch — the dot is decorative; the label conveys the status, so screen readers should not announce a "bullet point."
5. **Mobile nav decision** — Phase 9's call per ROADMAP success criterion #4. I documented in §5.1 (Header mobile behavior) and §5.8 that Phase 9 either keeps the desktop nav at all breakpoints (only 3 links — they fit on mobile) or rebuilds a hamburger pattern. Both are valid; I did not pre-decide.
6. **Footer mobile stack** — mockup keeps both spans flex space-between at all breakpoints. I noted in §5.2 that Phase 9 may add a `flex-direction: column` fallback at very narrow widths if the right span overflows, but the default is single-row. This is a small affordance for Phase 9 without overriding the spec.
7. **Hero `padding-top` ramp** — mockup has it at 96/72/48 (lines 149, 333, 342). I added §4.5 explicitly because it sits between layout and hero-specific concerns and §4 layout otherwise omits hero. Without this, Phase 9 might over-pad the homepage hero to match the section margin.
8. **`prefers-reduced-motion` stub** — left as Claude's discretion (per 08-CONTEXT.md). I documented in §6.3 that the stub may be retained or deleted, since most motion is already gone and the surviving transitions are sub-200ms color changes that pose no vestibular risk.

## Files Created

- `design-system/MASTER.md` — 749 lines, 10 sections, the locked v1.1 design contract

## Files Modified

None. This plan touches exactly one file as specified.

## Threat Flags

None. This is a documentation-only plan with no security surface.

## Self-Check: PASSED

- `design-system/MASTER.md` exists at repo root: FOUND
- 749 lines (≥ 400): FOUND
- All 6 hex tokens transcribed: FOUND
- All 7 Phase 9 primitives specced: FOUND (Header, Footer, Container, SectionHeader, WorkRow, MetaLabel, StatusDot)
- Pragmatic motion line documented with Dead and Allowed lists: FOUND
- Chat widget token map (D-19 + D-27 + D-28) present: FOUND
- All 21 acceptance criteria checks pass: FOUND
- Commit `45cdf93` exists: FOUND
- No other files modified: FOUND (only design-system/MASTER.md staged and committed)
