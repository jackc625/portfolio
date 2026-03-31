---
phase: 05-dark-mode-animations-polish
plan: 05
subsystem: ui
tags: [astro, view-transitions, canvas, theme, mousemove, bug-fix]

# Dependency graph
requires:
  - phase: 05-01
    provides: "Theme toggle system with localStorage and data-theme attribute"
  - phase: 05-02
    provides: "CanvasHero component with simplex-noise flow field and mouse influence"
provides:
  - "Theme persistence across View Transition client-side navigations"
  - "Working mouse influence on canvas hero despite z-10 overlay"
affects: [06-deployment-launch]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "astro:after-swap for restoring HTML attributes lost during View Transition swap"
    - "Attach pointer event listeners to parent container instead of obscured child"

key-files:
  created: []
  modified:
    - "src/layouts/BaseLayout.astro"
    - "src/components/CanvasHero.astro"

key-decisions:
  - "Use astro:after-swap (not astro:page-load) to avoid flash of wrong theme"
  - "Attach mousemove to parent section instead of adding pointer-events:none to overlay"

patterns-established:
  - "View Transition attribute restoration: use astro:after-swap in is:inline scripts"
  - "Pointer event passthrough: listen on shared ancestor, not obscured element"

requirements-completed: [DSGN-02, ANIM-02]

# Metrics
duration: 2min
completed: 2026-03-30
---

# Phase 5 Plan 5: Gap Closure Summary

**Two UAT bug fixes -- theme persistence across View Transitions via astro:after-swap, and canvas mouse influence via section-level mousemove listener**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T02:50:38Z
- **Completed:** 2026-03-31T02:52:46Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Theme selection now persists when navigating between pages using View Transitions (fixes UAT test 1)
- Canvas hero particles respond to mouse cursor movement despite z-10 overlay (fixes UAT test 12)
- Both fixes are minimal, targeted, and introduce no new features or scope

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix theme persistence across View Transition navigation** - `371ef35` (fix)
2. **Task 2: Fix canvas hero mouse influence by targeting correct element** - `395c456` (fix)

## Files Created/Modified
- `src/layouts/BaseLayout.astro` - Added astro:after-swap event listener to restore data-theme from localStorage before paint during View Transition navigations
- `src/components/CanvasHero.astro` - Moved mousemove listener from canvas element to parent section element, updated cleanup accordingly

## Decisions Made
- Used `astro:after-swap` instead of `astro:page-load` because after-swap fires before paint, preventing a flash of the wrong theme. Page-load fires after paint, which would cause a visible flicker.
- Moved mousemove to parent section instead of adding `pointer-events: none` to the overlay div, because the overlay contains slotted content (CTAs, links) that must remain clickable.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - both changes are complete bug fixes with no placeholder behavior.

## Next Phase Readiness
- Phase 5 gap closure complete, all 16 UAT tests should now pass
- Phase 5 can be marked complete, clearing the path for Phase 6 (deployment and launch)

## Self-Check: PASSED

- FOUND: src/layouts/BaseLayout.astro
- FOUND: src/components/CanvasHero.astro
- FOUND: .planning/phases/05-dark-mode-animations-polish/05-05-SUMMARY.md
- FOUND: commit 371ef35
- FOUND: commit 395c456

---
*Phase: 05-dark-mode-animations-polish*
*Completed: 2026-03-30*
