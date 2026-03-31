---
phase: 06-performance-audit-deployment
plan: 01
subsystem: performance
tags: [gsap, code-splitting, lazy-loading, dynamic-import, canvas, prefers-reduced-motion, vite]

# Dependency graph
requires:
  - phase: 05-dark-mode-animations-polish
    provides: animations.ts with GSAP ScrollTrigger + SplitText, CanvasHero with particle system
provides:
  - GSAP lazy-loaded via dynamic import (98.5% initial JS reduction)
  - CSS pre-animation states for [data-animate] elements
  - Tiered mobile/tablet/desktop canvas particle counts (200/600/1000)
  - 3-second content visibility fallback if GSAP fails
  - Reduced-motion users never load GSAP at all
affects: [06-02-lighthouse-audit, 06-03-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns: [dynamic-import-lazy-loading, css-pre-animation-states, tiered-particle-counts, gsap-fallback-timeout]

key-files:
  created: []
  modified:
    - src/scripts/animations.ts
    - src/layouts/BaseLayout.astro
    - src/styles/global.css
    - src/components/CanvasHero.astro

key-decisions:
  - "Dynamic import() for GSAP code-splitting rather than script defer -- Vite automatically creates separate chunks"
  - "CSS opacity:0 pre-animation state with 3s JS fallback timeout for Safari import bug protection"
  - "200 particles on mobile, 600 on tablet, 1000 on desktop -- tiered based on viewport width breakpoints"

patterns-established:
  - "Dynamic import pattern: check prefers-reduced-motion BEFORE importing heavy JS libraries"
  - "CSS pre-animation + JS fallback: elements hidden via CSS, revealed by JS animation or timeout"
  - "Tiered resource allocation: device-class-based resource counts (mobile/tablet/desktop)"

requirements-completed: [PERF-02, PERF-05]

# Metrics
duration: 4min
completed: 2026-03-31
---

# Phase 6 Plan 01: JS Optimization Summary

**GSAP lazy-loaded via dynamic import reducing initial BaseLayout JS from 121KB to 1.8KB, with tiered mobile canvas particles and CSS pre-animation fallbacks**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-31T15:55:15Z
- **Completed:** 2026-03-31T16:00:09Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Reduced initial page JS from 121KB to 1.8KB (98.5% reduction) by code-splitting GSAP into separate chunks via dynamic import
- Added CSS pre-animation states so content is hidden before GSAP loads but visible within 3s even if GSAP fails
- Reduced mobile canvas particles from 400 to 200 with new tablet tier at 600, keeping desktop at 1000
- Reduced-motion users skip GSAP loading entirely -- zero animation JS downloaded

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor GSAP to dynamic imports and add CSS pre-animation states** - `a6cd08e` (feat)
2. **Task 2: Reduce mobile canvas particles and verify build output code-splitting** - `7f710ad` (feat)

## Files Created/Modified
- `src/scripts/animations.ts` - Refactored to async function with dynamic GSAP imports, prefers-reduced-motion gate
- `src/layouts/BaseLayout.astro` - Replaced static import with dynamic import loader + 3s fallback timeout
- `src/styles/global.css` - Added [data-animate] opacity:0 pre-animation states + reduced-motion override
- `src/components/CanvasHero.astro` - Tiered particle counts: 200 mobile, 600 tablet, 1000 desktop

## Build Output Verification

| File | Size (bytes) | Purpose |
|------|-------------|---------|
| BaseLayout.astro_...js | 1,834 | Thin loader (was 121,732) |
| animations.wXTFANwl.js | 1,400 | Animation init logic |
| index.Crpphvpt.js | 69,976 | GSAP core (separate chunk) |
| ScrollTrigger.Heh74mPD.js | 43,218 | ScrollTrigger plugin (separate chunk) |
| SplitText.CVByrjox.js | 7,195 | SplitText plugin (separate chunk) |
| ClientRouter.astro_...js | 15,834 | View Transitions (unchanged) |

**Initial page load JS: 17,668 bytes** (BaseLayout + ClientRouter only) vs previous 137,566 bytes. All GSAP chunks load asynchronously after page render.

## Decisions Made
- Used dynamic `import()` for GSAP (Vite auto code-splits) rather than manual chunk configuration or `<script defer>`
- Added CSS `opacity: 0` on `[data-animate]` elements as pre-animation hidden state, with `!important` override for reduced-motion
- 3-second timeout fallback reveals content by checking `getComputedStyle(el).opacity === '0'` to protect against Safari dynamic import failures

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Known Stubs
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- GSAP lazy-loading complete, ready for Lighthouse audit (Plan 02) to verify scores
- Code-splitting confirmed in dist output -- Plan 02 can audit against production build
- Pre-animation CSS ensures zero CLS from GSAP initialization

## Self-Check: PASSED
- All 4 modified files exist
- Both task commits verified (a6cd08e, 7f710ad)

---
*Phase: 06-performance-audit-deployment*
*Completed: 2026-03-31*
