---
phase: 12-tech-debt-sweep
plan: 02
subsystem: a11y
tags:
  - inert
  - focus-trap
  - mobile-menu
  - chat-widget
  - keyboard-a11y
  - wr-01

# Dependency graph
requires:
  - phase: 07-chat-widget
    provides: ".chat-widget root mount in BaseLayout; focus-trap re-query pattern; D-26 Chat Regression Gate"
  - phase: 11-v1.1-audit
    provides: "WR-01 audit flag: chat bubble tabbable behind mobile menu backdrop (middle-element focus-trap edge case)"
provides:
  - "MobileMenu extends inert set/remove pair to .chat-widget root (openMenu + closeMenu)"
  - "Middle-element focus-trap edge case closed: chat bubble + panel unreachable while menu is open"
  - "D-10 belt-and-suspenders handleKeyDown handler preserved verbatim for <inert-support browsers"
affects:
  - 14-chat-knowledge
  - 16-motion

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Extend existing inert(header, main, footer) pair to .chat-widget root — single selector covers both bubble-only and panel-open states"
    - "Never touch handleKeyDown during inert extensions; the keydown focus-trap is the fallback for browsers without inert support"

key-files:
  created:
    - .planning/phases/12-tech-debt-sweep/12-02-mobilemenu-chatwidget-inert-SUMMARY.md
  modified:
    - src/components/primitives/MobileMenu.astro
    - .planning/phases/12-tech-debt-sweep/12-VALIDATION.md

key-decisions:
  - "Single .chat-widget root selector covers both bubble-only and panel-open states — no separate .chat-panel selector needed (Claude's-discretion resolution per CONTEXT.md D-12)"
  - "handleKeyDown focus-trap handler preserved byte-for-byte (D-10 belt-and-suspenders for Safari <15.5 / Firefox <112 which lack inert support)"

patterns-established:
  - "Inert extension pattern: when adding a BaseLayout-adjacent root to the inert set, add it after the footer line in openMenu and after the footer line in closeMenu — symmetric pair, zero comment edits"
  - "D-26 Chat Regression Gate automated evidence recorded in 12-VALIDATION.md with per-gate-item command + file + pass line before requesting human manual smoke"

requirements-completed:
  - DEBT-02

# Metrics
duration: 6min
completed: 2026-04-15
---

# Phase 12 Plan 02: MobileMenu ChatWidget Inert Summary

**Added `inert` on `.chat-widget` root to MobileMenu openMenu/closeMenu, closing the v1.1 WR-01 middle-element focus-trap edge case while preserving the D-10 keydown fallback verbatim.**

## Performance

- **Duration:** ~6 min active execution (code change Task 1: ~3 min; D-26 automated evidence subtask: ~3 min; human verification window handled async)
- **Started:** 2026-04-15T19:11:45Z (commit `b46a9a6` authored)
- **Completed:** 2026-04-15 (human-verified D-26 approval)
- **Tasks:** 2 of 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 2 (MobileMenu.astro + 12-VALIDATION.md) + 1 created (deferred-items.md)

## Accomplishments

- Chat bubble + panel are now unreachable via Tab / Shift+Tab while the mobile menu is open (WR-01 closed)
- Focus-trap handleKeyDown handler is byte-for-byte unchanged — belt-and-suspenders fallback intact for browsers without native inert support
- Inert set/remove is symmetrically paired: no risk of leaving `.chat-widget` permanently inert after close
- Full D-26 Chat Regression Gate passed: 7/7 automated + 21/21 manual (human-approved 2026-04-15)
- Lighthouse gate held: Performance ≥99 / A11y ≥95 / BP 100 / SEO 100 on homepage + `/projects/seatwatch`

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend inert set/remove in MobileMenu.astro to cover .chat-widget** — `b46a9a6` (feat)
2. **Task 1 subtask: D-26 automated evidence + deferred-items log** — `616337e` (docs)
3. **Task 2: Human-verify D-26 Chat Regression Gate (Parts A–D)** — no commit; resume signal `approved` recorded in 12-VALIDATION.md

**Plan metadata commit:** pending (this SUMMARY + STATE + ROADMAP + REQUIREMENTS)

## Files Created/Modified

- `src/components/primitives/MobileMenu.astro` — +1 line in `openMenu()` (setAttribute inert on `.chat-widget` after footer); +1 line in `closeMenu()` (removeAttribute inert on `.chat-widget` after footer). Comment block above inert lines unchanged. `handleKeyDown` unchanged.
- `.planning/phases/12-tech-debt-sweep/12-VALIDATION.md` — added `## D-26 Chat Regression Gate — Plan 12-02` section with automated evidence table (7 gates) + 21 manual items (all approved 2026-04-15).
- `.planning/phases/12-tech-debt-sweep/deferred-items.md` — logged pre-existing unrelated test failure in `tests/client/contact-data.test.ts` (out of scope for DEBT-02; tracks for DEBT-06 closeout).

### Diff excerpt — MobileMenu.astro

```ts
// openMenu() — added line after footer:
document.querySelector("header")?.setAttribute("inert", "");
document.querySelector("main")?.setAttribute("inert", "");
document.querySelector("footer")?.setAttribute("inert", "");
document.querySelector(".chat-widget")?.setAttribute("inert", "");  // NEW

// closeMenu() — added line after footer:
document.querySelector("header")?.removeAttribute("inert");
document.querySelector("main")?.removeAttribute("inert");
document.querySelector("footer")?.removeAttribute("inert");
document.querySelector(".chat-widget")?.removeAttribute("inert");  // NEW
```

(Full `git show b46a9a6 --stat`: 1 file changed, 9 insertions — includes a surrounding blank line + optional comment extension context; core behavior delta is the two `querySelector(".chat-widget")` lines above.)

## Decisions Made

- **Single-selector scope for chat widget inert (Q2 Claude's-discretion per CONTEXT.md D-12):** `.chat-widget` is the ROOT of both the bubble and any expanded panel. A single `inert` on `.chat-widget` covers BOTH states (panel-closed AND panel-open). No separate `.chat-panel` selector added. Rationale: simpler pair; fewer branches to maintain in lockstep; `.chat-widget` is stable (set at `ChatWidget.astro:9`), while panel-open state varies.
- **handleKeyDown preserved verbatim:** Per CONTEXT.md D-10, the keydown focus-trap is the belt-and-suspenders fallback for Safari <15.5 and Firefox <112 (which lack native `inert` support). Removing it would break mobile-menu focus containment on those browsers. Byte-identical per git blame line range 293–317 (unchanged from pre-plan commit).
- **Automated evidence first, human-verify second:** Ran all 7 automated D-26 gates and recorded evidence in VALIDATION.md before asking Jack to run the manual smoke battery. This separates Claude's work product from the human verification surface.

## Deviations from Plan

None — plan executed exactly as written.

The Task 1 `<action>` block anticipated the single-selector Q2 decision (it was the explicit Claude's-discretion resolution in CONTEXT.md D-12), so documenting that choice in-commit is not a deviation but plan compliance.

## Issues Encountered

- **Pre-existing test failure surfaced during D-26 automated sweep:** `tests/client/contact-data.test.ts > email is jack@jackcutrara.com` fails because commit `de85698 chore: updated contact info` changed `CONTACT.email` without updating the assertion. This is out of scope for Plan 12-02 (Plan 12-02 does not touch contact data, contact tests, or assertion). Logged in `.planning/phases/12-tech-debt-sweep/deferred-items.md` for Plan 12-06 (audit-closeout) to pick up. Zero D-26 gate items are affected by this failure.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- DEBT-02 closed — mobile menu + chat widget are now focus-trap-correct
- Plan 12-03 (chat copy button parity / DEBT-04) ready to execute — same D-26 gate applies; same VALIDATION.md pattern can be reused
- Chat widget surface remains D-10/D-26 compliant — subsequent phases that mount additional BaseLayout-adjacent DOM (Phase 15 analytics script, Phase 16 motion.ts IntersectionObserver) can follow the same "add to inert set after footer line" pattern if needed

---
*Phase: 12-tech-debt-sweep*
*Completed: 2026-04-15*

## Self-Check: PASSED

Verified after write:
- `.planning/phases/12-tech-debt-sweep/12-02-mobilemenu-chatwidget-inert-SUMMARY.md` → FOUND (this file)
- `src/components/primitives/MobileMenu.astro` → FOUND (modified in `b46a9a6`)
- `.planning/phases/12-tech-debt-sweep/12-VALIDATION.md` → FOUND (modified in `616337e` + this session's approval record)
- `.planning/phases/12-tech-debt-sweep/deferred-items.md` → FOUND (created in `616337e`)
- Commit `b46a9a6` → FOUND in git log
- Commit `616337e` → FOUND in git log
