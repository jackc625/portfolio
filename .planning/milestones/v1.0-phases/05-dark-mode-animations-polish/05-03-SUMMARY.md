---
phase: 05-dark-mode-animations-polish
plan: 03
subsystem: seo, print
tags: [json-ld, structured-data, schema-org, print-stylesheet, resume, seo]

# Dependency graph
requires:
  - phase: 05-02
    provides: "GSAP animations, canvas hero, data-animate attributes on pages"
  - phase: 03-core-pages
    provides: "Resume, About, and project case study pages"
provides:
  - "@media print stylesheet for resume page with black-on-white output"
  - "Print-only contact header for resume"
  - "JsonLd.astro reusable component for structured data"
  - "Person JSON-LD schema on home and about pages"
  - "CreativeWork JSON-LD schema on all project case study pages"
affects: [06-launch-seo-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns: ["JsonLd component pattern for structured data injection", "print-only-header CSS pattern for screen-hidden content"]

key-files:
  created:
    - src/components/JsonLd.astro
  modified:
    - src/styles/global.css
    - src/pages/resume.astro
    - src/pages/index.astro
    - src/pages/about.astro
    - src/pages/projects/[id].astro

key-decisions:
  - "JSON-LD placed in body slot (valid per Google docs) rather than head slot for simplicity"
  - "Print-only header uses dedicated .print-only-header CSS class instead of Tailwind print: variant"
  - "CreativeWork uses codeRepository for GitHub URL (Schema.org SoftwareSourceCode property)"

patterns-established:
  - "JsonLd component: pass schema object as prop, renders script type=application/ld+json"
  - "Print-only elements: use .print-only-header class with display:none default, display:block in @media print"
  - "data-no-print attribute: add to any element that should be hidden when printing"

requirements-completed: [RESM-03, SEOA-03]

# Metrics
duration: 7min
completed: 2026-03-30
---

# Phase 5 Plan 3: Print Stylesheet and JSON-LD Structured Data Summary

**Resume print stylesheet with black-on-white output and JSON-LD Person/CreativeWork schemas across home, about, and project pages**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-30T23:45:36Z
- **Completed:** 2026-03-30T23:52:41Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Resume page prints professionally with black text on white background, no nav/footer/chrome visible
- Print-only contact header shows Jack Cutrara name, email, GitHub, LinkedIn when printing
- External link URLs displayed inline after links in print output
- Person JSON-LD structured data on home and about pages for Google rich results
- CreativeWork JSON-LD on all 6 project case study pages with dynamic title, keywords, and conditional GitHub/demo URLs
- Reusable JsonLd.astro component created for future structured data needs

## Task Commits

Each task was committed atomically:

1. **Task 1: Print stylesheet for resume page** - `fa12ddd` (feat)
2. **Task 2: JSON-LD structured data (Person + CreativeWork schemas)** - `a058ef7` (feat)

## Files Created/Modified
- `src/components/JsonLd.astro` - Reusable component rendering JSON-LD script tags from schema prop
- `src/styles/global.css` - @media print rules: hide chrome, force black-on-white, show link URLs, page break control
- `src/pages/resume.astro` - Print-only header with contact info, data-no-print on download button
- `src/pages/index.astro` - Person JSON-LD schema with name, jobTitle, url, sameAs
- `src/pages/about.astro` - Person JSON-LD schema (same as home page)
- `src/pages/projects/[id].astro` - CreativeWork JSON-LD with dynamic project data

## Decisions Made
- JSON-LD placed in body content slot rather than head slot -- valid per Google documentation and simpler to implement with Astro's slot system
- Used dedicated CSS class `.print-only-header` with display:none/display:block pattern instead of Tailwind's `print:` variant for reliability
- CreativeWork schema uses `codeRepository` property (from Schema.org SoftwareSourceCode) for GitHub URLs, which is more specific than generic URL properties
- Skill tags in print styled as comma-separated plain text instead of bordered chips

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Worktree was behind main branch by multiple phases -- resolved by merging main into worktree branch before starting work
- Node modules not installed in worktree -- resolved by running pnpm install

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all data is wired from content collections or hardcoded personal info (name, email, social links) which is appropriate for a personal portfolio.

## Next Phase Readiness
- Print stylesheet and JSON-LD complete, ready for Phase 5 Plan 4 (verification)
- JSON-LD schemas validated by build output presence checks
- Print styles will need manual browser print preview verification during UAT

## Self-Check: PASSED

All 6 files verified present. Both task commits (fa12ddd, a058ef7) verified in git log.

---
*Phase: 05-dark-mode-animations-polish*
*Completed: 2026-03-30*
