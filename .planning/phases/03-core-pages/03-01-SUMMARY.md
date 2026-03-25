---
phase: 03-core-pages
plan: 01
subsystem: ui
tags: [design-tokens, oklch, tailwind, inter, ibm-plex-mono, simplex-noise, astro-fonts]

# Dependency graph
requires:
  - phase: 01-foundation-design-system
    provides: "CSS custom property token architecture with @theme bridge"
provides:
  - "Updated color tokens matching shiyunlu.com dark palette (near-black bg, muted blue accents)"
  - "Updated font stack: Inter (heading/body) + IBM Plex Mono (code)"
  - "simplex-noise 4.0.3 installed for canvas hero generative art"
  - "Updated typography scale with generous editorial sizing"
  - "Updated spacing section token for more generous whitespace"
affects: [03-core-pages, 04-projects, 05-animations]

# Tech tracking
tech-stack:
  added: [simplex-noise@4.0.3, Inter (Google Fonts), IBM Plex Mono (Google Fonts)]
  patterns: ["Token value swap without architecture change -- only :root values updated, @theme bridge untouched"]

key-files:
  created: []
  modified:
    - src/styles/global.css
    - astro.config.mjs
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "Inter chosen as free equivalent for Graphik/Wotfard geometric sans from shiyunlu.com"
  - "IBM Plex Mono replaces JetBrains Mono to match shiyunlu.com's mono font"
  - "Font-display fallback updated from serif to sans-serif for Inter"
  - "Color hue shifted from 260 to 270 with muted blue accent at hue 250"

patterns-established:
  - "Design token value swap: change :root values only, never touch @theme bridge or component class names"

requirements-completed: [HOME-01, ABUT-01, RESM-01, CNTC-01]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 03 Plan 01: Design Token + Font Stack Update Summary

**Updated design tokens to shiyunlu.com dark palette (near-black bg, muted blue accents) and swapped font stack to Inter + IBM Plex Mono via Astro Fonts API**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T16:36:05Z
- **Completed:** 2026-03-25T16:40:49Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Updated all color tokens in global.css `:root` to match shiyunlu.com's dark design language (near-black backgrounds, muted blue accents)
- Swapped font stack from Instrument Serif/Sans + JetBrains Mono to Inter + IBM Plex Mono
- Installed simplex-noise 4.0.3 for canvas hero generative art (upcoming Plan 03)
- Preserved the entire @theme bridge architecture -- only values changed, not the system

## Task Commits

Each task was committed atomically:

1. **Task 1: Update design tokens and install simplex-noise** - `539348b` (feat)
2. **Task 2: Swap font stack via Astro Fonts API** - `6bf29da` (feat)

## Files Created/Modified
- `src/styles/global.css` - Updated :root color tokens (near-black bg, muted accents), typography scale, spacing, and font-display fallback to sans-serif
- `astro.config.mjs` - Replaced Instrument Serif/Sans with Inter, JetBrains Mono with IBM Plex Mono
- `package.json` - Added simplex-noise 4.0.3 dependency
- `pnpm-lock.yaml` - Updated lockfile

## Decisions Made
- **Inter as Graphik/Wotfard equivalent:** Inter is the closest free geometric sans-serif to the commercial fonts used on shiyunlu.com. Same font used for both heading and body variables with different weight ranges.
- **IBM Plex Mono exact match:** shiyunlu.com uses IBM Plex Mono which is freely available on Google Fonts -- direct replacement for JetBrains Mono.
- **Muted blue accent (hue 250):** Shifted accent color from teal (hue 178) to a muted blue (hue 250) to match shiyunlu.com's cooler color treatment.
- **Generous section spacing:** Increased section spacing token from `clamp(4rem, ..., 8rem)` to `clamp(5rem, ..., 10rem)` to match shiyunlu.com's spacious layout feel.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - this plan updates token values and installs dependencies only. No UI stubs created.

## Next Phase Readiness
- Design tokens are ready for all subsequent plans in Phase 3
- Font stack is active and builds successfully
- simplex-noise is installed and importable for Plan 03 (canvas hero)
- All existing pages build and render with the updated tokens

## Self-Check: PASSED

All files verified present, all commit hashes found in git log.

---
*Phase: 03-core-pages*
*Completed: 2026-03-25*
