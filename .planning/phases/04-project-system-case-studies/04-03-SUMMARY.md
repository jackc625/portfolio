---
phase: 04-project-system-case-studies
plan: 03
subsystem: ui
tags: [astro, pages, routing, mdx, content-collections, tailwind, design-tokens]

# Dependency graph
requires:
  - phase: 04-project-system-case-studies
    plan: 01
    provides: "6 project MDX files with typed frontmatter, optional thumbnail schema"
  - phase: 04-project-system-case-studies
    plan: 02
    provides: "ProjectCard, ArticleImage, CaseStudySection, NextProject components"
  - phase: 01-foundation-design-system
    provides: "BaseLayout, design tokens, content collection schema"
provides:
  - "Projects page with hybrid featured cards grid and editorial list layout at /projects"
  - "Dynamic case study route generating 6 static pages at /projects/[id]"
  - "MDX prose styling with editorial design language (mono H2 labels, themed paragraphs)"
  - "Next project navigation cycling through all projects"
affects: [04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getCollection + sort + featured/editorial split for hybrid page layout"
    - "getStaticPaths with entry.id for Astro 6 Content Layer dynamic routing"
    - "render() function import for MDX compilation (not entry.render() method)"
    - "Scoped :global() styles for MDX-rendered prose content"
    - "Conditional external link rendering based on optional frontmatter fields"

key-files:
  created:
    - src/pages/projects/[id].astro
  modified:
    - src/pages/projects.astro

key-decisions:
  - "Used scoped .case-study-prose :global() styles instead of Tailwind prose plugin for MDX rendering"
  - "Single constrained-width column (max-w-3xl) for MDX body rather than asymmetric grid per RESEARCH.md recommendation"
  - "Next project wraps cyclically using modulo arithmetic in getStaticPaths"

patterns-established:
  - "Content collection query pattern: getCollection > sort by order > split by featured boolean"
  - "Dynamic route pattern: getStaticPaths returns params.id + props.project + props.nextProject"
  - "MDX prose styling: scoped parent class with :global() selectors for rendered HTML elements"

requirements-completed: [PROJ-01, PROJ-02, PROJ-04, CASE-01, CASE-02, CASE-04]

# Metrics
duration: 4min
completed: 2026-03-30
---

# Phase 4 Plan 3: Projects Page & Case Study Route Summary

**Hybrid projects page with featured card grid and editorial list, plus dynamic MDX case study pages with hero sections, styled prose, and next-project navigation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-30T18:10:43Z
- **Completed:** 2026-03-30T18:14:47Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- Rebuilt projects.astro from stub into hybrid layout with 3 featured project cards in responsive grid and 3 editorial list items below a divider
- Created dynamic case study route at src/pages/projects/[id].astro generating 6 static pages with hero, MDX prose, and next project navigation
- Styled MDX-rendered content with editorial design language (mono uppercase H2 labels, secondary text paragraphs, accent-colored links)
- All routes build successfully: /projects plus 6 /projects/[id] pages (11 total pages)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rebuild projects page with hybrid featured cards + editorial list layout** - `42e5792` (feat)
2. **Task 1b: Remove old placeholder MDX files** - `83a4c37` (chore)
3. **Task 2: Create dynamic case study route with hero, MDX rendering, and next project navigation** - `e0155f8` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `src/pages/projects.astro` - Hybrid layout with featured card grid (3-col responsive) and editorial list with divider
- `src/pages/projects/[id].astro` - Dynamic case study route with hero section, MDX body with prose styles, and next project navigation

## Decisions Made

- Used scoped `.case-study-prose :global()` CSS styles for MDX content rather than a Tailwind prose plugin, keeping styling explicit and token-based
- Chose single constrained-width column (`max-w-3xl`) for MDX body content per RESEARCH.md Open Question 2 recommendation, rather than asymmetric grid for each section
- Conditional rendering of GitHub/demo links row only when at least one URL exists in frontmatter
- Conditional hero image rendering only when thumbnail is present (all current projects omit it, using solid-color fallback on cards)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cherry-picked prerequisite commits from parallel agents**
- **Found during:** Pre-task setup
- **Issue:** This worktree only had Phase 1 commits. Plans 01 and 02 (dependencies) were executed by parallel agents on other worktrees and their commits were not present.
- **Fix:** Cherry-picked commits 77ca56f (Plan 02 components), 682c0c8 (Plan 01 content schema), 8e229af (Phase 2 stub pages), and 474e9cf (FeaturedProjectItem component) into this worktree.
- **Files modified:** Multiple component and content files brought into worktree
- **Verification:** All prerequisite components and content files present, build succeeds
- **Committed in:** Cherry-picked commits (not new work)

**2. [Rule 3 - Blocking] Removed orphaned placeholder MDX files**
- **Found during:** Task 1 (after cherry-picking)
- **Issue:** Old placeholder-api.mdx and placeholder-devtools.mdx files from Phase 3 existed alongside the new Plan 01 project files, which could cause duplicate content collection entries
- **Fix:** Deleted both files
- **Files modified:** src/content/projects/placeholder-api.mdx (deleted), src/content/projects/placeholder-devtools.mdx (deleted)
- **Verification:** Build passes with only 6 project files
- **Committed in:** 83a4c37

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for worktree to have prerequisite files. No scope creep.

## Issues Encountered

- RTK `pnpm build` misrouted as `next build` -- used direct `pnpm build` instead (RTK configuration issue, not a project issue)

## Known Stubs

None. Both pages are fully implemented with real logic wired to content collections.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All project pages fully functional: /projects hub and 6 individual case study pages
- Plan 04 (animations, polish, and verification) can proceed with all routes in place
- Case study prose styling established for MDX content -- any future MDX formatting adjustments can build on the .case-study-prose pattern

## Self-Check: PASSED

All files verified:
- src/pages/projects.astro: FOUND
- src/pages/projects/[id].astro: FOUND
- Commit 42e5792 (Task 1): FOUND
- Commit 83a4c37 (cleanup): FOUND
- Commit e0155f8 (Task 2): FOUND
- Build: PASSED (11 pages generated)

---
*Phase: 04-project-system-case-studies*
*Completed: 2026-03-30*
