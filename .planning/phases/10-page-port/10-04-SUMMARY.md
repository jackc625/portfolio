---
phase: 10-page-port
plan: 04
subsystem: ui
tags: [astro, pages, projects, mdx, editorial, content-collections]

# Dependency graph
requires:
  - phase: 10-page-port/01
    provides: Content schema year field, Shiki github-light theme, featured field
  - phase: 09-primitives
    provides: WorkRow, SectionHeader, Container, NextProject, ArticleImage primitives
provides:
  - Projects index page with all 6 numbered work rows from content collection
  - Project detail page with editorial case study layout (metadata, title, tagline, external links, MDX body, NextProject)
  - Prose-editorial scoped style system for MDX content rendering
  - ArticleImage wired in MDX components map (zero-cost when unused)
affects: [10-05, 10-06, 10-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prose-editorial wrapper: .prose-editorial with :global() selectors for MDX-rendered elements"
    - "Conditional external links: no empty wrapper when both githubUrl and demoUrl absent"
    - "Sort consistency: identical .sort((a, b) => a.data.order - b.data.order) across all 3 project pages"
    - "NextProject wrap-around via modular arithmetic: allProjects[(idx + 1) % allProjects.length]"

key-files:
  created: []
  modified:
    - src/pages/projects.astro
    - src/pages/projects/[id].astro

key-decisions:
  - "Used .prose-editorial as MDX wrapper class instead of bare .body to prevent global style bleed"
  - "External links div conditionally rendered only when githubUrl or demoUrl exists"
  - "Sort expression identical across index.astro, projects.astro, and [id].astro for deterministic ordering"

patterns-established:
  - "MDX scoped styling: .prose-editorial :global(element) pattern for styling MDX-rendered content without editing MDX files"
  - "Section-sign h2 labels via CSS ::before content for editorial mono section headers"

requirements-completed: [WORK-01, WORK-02, WORK-03]

# Metrics
duration: 4min
completed: 2026-04-13
---

# Phase 10 Plan 04: Projects Index and Detail Page Rewrite Summary

**Projects index with all 6 numbered work rows and editorial case study detail pages with mono metadata, prose-editorial MDX body, section-sign h2 labels, and NextProject wrap-around**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-13T02:57:14Z
- **Completed:** 2026-04-13T03:01:42Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Projects index page rewritten from stub to editorial composition: all 6 projects as numbered WorkRows (01-06) sorted by order ascending, SectionHeader with 6/6 count, tech stack middot-joined and uppercased, year field rendered
- Project detail page rewritten to full editorial case study layout: mono metadata header (YEAR + TECHSTACK), h1-section title, lead tagline, conditional external links row (GITHUB/LIVE DEMO arrows, no empty wrapper), MDX body in .prose-editorial wrapper with 13 scoped :global() style overrides, section-sign h2 labels via ::before, code block minimal box, ArticleImage in MDX components map, NextProject footer with order-ascending wrap-around
- Build passes with all 6 project static routes generated plus projects index
- Sort expression verified identical across all 3 consuming pages (homepage, projects index, project detail)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite projects index (projects.astro)** - `6943e34` (feat)
2. **Task 2: Rewrite project detail page (projects/[id].astro)** - `2b7c759` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `src/pages/projects.astro` - Projects index with all 6 numbered WorkRows, SectionHeader, content collection query with identical sort
- `src/pages/projects/[id].astro` - Editorial case study: mono metadata, h1-section title, lead tagline, conditional external links, .prose-editorial MDX body with scoped overrides, section-sign h2 labels, NextProject wrap-around

## Decisions Made
- Used .prose-editorial as the MDX wrapper class name instead of bare .body to prevent global style bleed (addresses Gemini MEDIUM + Codex MEDIUM review concerns)
- External links row wrapped in conditional `{(project.data.githubUrl || project.data.demoUrl) &&` so no empty div is emitted when both absent (addresses Codex MEDIUM review concern)
- Sort expression kept identical across all 3 pages per plan: `.sort((a, b) => a.data.order - b.data.order)` (addresses Codex HIGH review concern on consistency)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All project pages are live with editorial composition and real content collection data
- WORK-01 (projects index), WORK-02 (case study layout), WORK-03 (real content renders) all delivered
- Chat widget restyle (10-05, CHAT-01/02) is next in the wave sequence
- ArticleImage wiring is capability-ready for future content passes with project screenshots

## Self-Check: PASSED

All files verified present, all commit hashes verified in git log.

---
*Phase: 10-page-port*
*Completed: 2026-04-13*
