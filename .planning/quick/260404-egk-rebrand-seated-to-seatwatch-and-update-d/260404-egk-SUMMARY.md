---
phase: quick
plan: 260404-egk
subsystem: content
tags: [astro, mdx, content-collections, rebrand]

# Dependency graph
requires: []
provides:
  - "SeatWatch branding across portfolio content (replaced Seated)"
  - "Live Demo link on SeatWatch project page (https://seat.watch)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - src/content/projects/seatwatch.mdx
    - Projects/1 - SEATWATCH.md
  modified: []

key-decisions:
  - "Canonical display form is SeatWatch (capital S, capital W); slug is all-lowercase seatwatch"

patterns-established: []

requirements-completed: [rebrand-seated-seatwatch, add-demourl]

# Metrics
duration: 4min
completed: 2026-04-04
---

# Quick Task 260404-egk: Rebrand Seated to SeatWatch Summary

**Renamed seated.mdx to seatwatch.mdx, updated all "Seated" references to "SeatWatch", and added demoUrl pointing to https://seat.watch**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-04T14:34:50Z
- **Completed:** 2026-04-04T14:39:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Renamed seated.mdx to seatwatch.mdx, automatically updating the URL from /projects/seated to /projects/seatwatch
- Updated project title from "Seated" to "SeatWatch" and replaced 2 body text occurrences
- Added demoUrl: "https://seat.watch" to frontmatter, rendering a "Live Demo" link on the project detail page
- Renamed untracked reference file from "1 - SEATED.md" to "1 - SEATWATCH.md" with 3 text updates

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename and update seated.mdx to seatwatch.mdx** - `a7d8842` (content)
2. **Task 2: Rename and update reference file Projects/1 - SEATED.md** - no commit (untracked file, not git-tracked)

## Files Created/Modified
- `src/content/projects/seatwatch.mdx` - Renamed from seated.mdx; title, demoUrl, and body text updated to SeatWatch branding
- `Projects/1 - SEATWATCH.md` - Renamed from "1 - SEATED.md"; heading, body text, and directory reference updated (untracked file)

## Decisions Made
None - followed plan as specified.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None.

## Verification Results
- Zero occurrences of "Seated"/"seated"/"SEATED" across all content files (src/ and Projects/)
- Zero occurrences of "Seated" in built output (dist/)
- Astro build passes (11 pages built in 5.93s)
- /projects/seatwatch/index.html generated with correct SeatWatch title
- "Live Demo" link rendered in built HTML pointing to https://seat.watch
- JSON-LD structured data includes seat.watch URL

## Self-Check: PASSED

- FOUND: src/content/projects/seatwatch.mdx
- FOUND: Projects/1 - SEATWATCH.md
- FOUND: commit a7d8842
- FOUND: 260404-egk-SUMMARY.md

---
*Quick task: 260404-egk*
*Completed: 2026-04-04*
