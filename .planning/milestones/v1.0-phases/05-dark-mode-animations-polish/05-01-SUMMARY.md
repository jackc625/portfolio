---
phase: 05-dark-mode-animations-polish
plan: 01
subsystem: ui
tags: [dark-mode, light-theme, theme-toggle, oklch, localStorage, prefers-color-scheme, canvas]

# Dependency graph
requires:
  - phase: 01-foundation-design-system
    provides: "Token architecture with :root dark default and [data-theme='light'] placeholder"
provides:
  - "Light theme OKLCH color tokens under [data-theme='light'] selector"
  - "No-flash theme detection inline script in BaseLayout head"
  - "ThemeToggle component with sun/moon icon morph animation"
  - "Header integration with toggle on desktop and mobile"
  - "Canvas hero theme-aware trail colors with reinit on theme-changed event"
  - "Theme transition CSS scoped to .theme-transitioning class"
affects: [05-02, 05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns: ["data-theme attribute toggling", "inline head script for no-flash theme", "theme-transitioning class for scoped transitions", "theme-changed CustomEvent for cross-component communication"]

key-files:
  created:
    - "src/components/ThemeToggle.astro"
  modified:
    - "src/styles/global.css"
    - "src/layouts/BaseLayout.astro"
    - "src/components/Header.astro"
    - "src/components/CanvasHero.astro"

key-decisions:
  - "Used class-based selector (.theme-toggle) instead of id for toggle buttons to support desktop + mobile instances without duplicate IDs"
  - "Theme transitions scoped to .theme-transitioning class (added/removed during toggle) rather than always-on to prevent layout thrash"

patterns-established:
  - "Theme toggle pattern: class-based multi-instance buttons with shared event handler"
  - "Canvas theme reinit: listen for 'theme-changed' CustomEvent, cleanup and reinitialize"
  - "No-flash pattern: inline script before SEO/Font in head sets data-theme from localStorage or OS preference"

requirements-completed: [DSGN-02, DSGN-03, DSGN-04]

# Metrics
duration: 9min
completed: 2026-03-30
---

# Phase 5 Plan 1: Theme System Summary

**Dark/light theme system with warm cream OKLCH light tokens, no-flash OS detection, sun/moon toggle in header, and canvas hero theme awareness**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-30T23:09:55Z
- **Completed:** 2026-03-30T23:18:58Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Light theme with 12 warm cream OKLCH color tokens that automatically propagate through Tailwind via the @theme bridge
- Zero-flash theme detection using inline head script that checks localStorage then OS preference before CSS renders
- ThemeToggle component with CSS-driven sun/moon icon morph animation (opacity crossfade + 180deg rotation + scale)
- Toggle visible in both desktop nav and mobile header bar without opening the mobile menu
- Canvas hero reinitializes with theme-appropriate trail colors on theme switch

## Task Commits

Each task was committed atomically:

1. **Task 1: Light theme tokens, no-flash script, and theme transition CSS** - `f5819bf` (feat)
2. **Task 2: ThemeToggle component, Header integration, and canvas theme awareness** - `dbae2a6` (feat)

## Files Created/Modified
- `src/components/ThemeToggle.astro` - New component: sun/moon icon toggle with CSS morph animation and localStorage persistence
- `src/styles/global.css` - Added [data-theme="light"] token overrides and .theme-transitioning scoped transition CSS
- `src/layouts/BaseLayout.astro` - Added inline no-flash theme detection script in head before SEO
- `src/components/Header.astro` - Integrated ThemeToggle in desktop nav (last li) and mobile header (3-column grid)
- `src/components/CanvasHero.astro` - Added getTrailColor()/getOpaqueTrailColor() functions and theme-changed event listener

## Decisions Made
- Used class-based selector (.theme-toggle) instead of id="theme-toggle" because the component renders twice (desktop + mobile), and duplicate IDs are invalid HTML that breaks getElementById
- Scoped theme transition CSS to .theme-transitioning class per RESEARCH Pitfall 4 guidance to prevent always-on transitions causing layout thrash on lower-powered devices

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed duplicate ID on theme toggle buttons**
- **Found during:** Task 2 (ThemeToggle component creation)
- **Issue:** Plan specified `id="theme-toggle"` but the component renders in both desktop nav and mobile header, creating duplicate IDs. `getElementById` would only find the first, breaking the other toggle.
- **Fix:** Changed from `id="theme-toggle"` to `class="theme-toggle"` and updated script to use `querySelectorAll('.theme-toggle')` with shared click handler
- **Files modified:** src/components/ThemeToggle.astro
- **Verification:** Build succeeds, both toggle instances appear in built HTML
- **Committed in:** dbae2a6 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for correct multi-instance behavior. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all theme tokens are real OKLCH values, toggle is fully functional, canvas adaptation is wired.

## Next Phase Readiness
- Theme system is complete and all subsequent Phase 5 plans (animations, print, JSON-LD) can build on both themes
- All pages automatically switch between dark and light via the token architecture
- Canvas hero correctly reinitializes on theme change

## Self-Check: PASSED

All 5 created/modified files verified present. Both task commit hashes (f5819bf, dbae2a6) found in git log.

---
*Phase: 05-dark-mode-animations-polish*
*Plan: 01*
*Completed: 2026-03-30*
