---
phase: 02-site-shell-navigation
plan: 01
subsystem: ui
tags: [astro, seo, astro-seo, view-transitions, accessibility]

requires:
  - phase: 01-foundation-design-system
    provides: BaseLayout, design tokens, global CSS, Astro project scaffolding
provides:
  - SEO meta infrastructure via astro-seo (title templates, OG, Twitter cards)
  - SkipToContent accessibility component
  - Footer with GitHub/LinkedIn/email icon links
  - 5 stub pages with unique SEO meta
  - ClientRouter for view transitions
  - OG placeholder image
affects: [02-02, 03-home-hero]

tech-stack:
  added: [astro-seo, ClientRouter]
  patterns: [SEO props via BaseLayout, titleTemplate for consistent branding]

key-files:
  created:
    - src/components/SkipToContent.astro
    - src/components/Footer.astro
    - src/pages/about.astro
    - src/pages/projects.astro
    - src/pages/resume.astro
    - src/pages/contact.astro
    - public/og-default.png
  modified:
    - src/layouts/BaseLayout.astro
    - src/pages/index.astro

key-decisions:
  - "Empty title on home page triggers titleDefault for 'Jack Cutrara | Software Engineer' avoiding double-wrap"
  - "OG placeholder generated as minimal PNG — visual design deferred"

patterns-established:
  - "SEO pattern: pages pass title + description to BaseLayout, which renders astro-seo with titleTemplate"
  - "Accessibility: SkipToContent is always first focusable element in body"

requirements-completed: [CNTC-02, SEOA-01, SEOA-02, SEOA-04, SEOA-06, SEOA-07]

duration: 10min
completed: 2026-03-23
---

# Plan 02-01: Site Shell Structure Summary

**SEO infrastructure via astro-seo with title templates, OG/Twitter cards, SkipToContent link, Footer with social icons, and 5 stub pages with unique meta**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-23T15:20:00Z
- **Completed:** 2026-03-23T15:34:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- BaseLayout rewritten with full SEO meta infrastructure (astro-seo, OG tags, Twitter cards, canonical URLs)
- SkipToContent accessibility link as first focusable element
- Footer with GitHub, LinkedIn, email icon links and proper aria-labels
- All 5 pages (Home, About, Projects, Resume, Contact) with unique titles and descriptions
- ClientRouter enabled for site-wide view transitions
- Placeholder OG image at public/og-default.png

## Task Commits

1. **Task 1: SkipToContent, Footer, OG image, BaseLayout rewrite** - `a03777d` (feat)
2. **Task 2: Create 5 stub pages with SEO meta** - `8e229af` (feat)

## Files Created/Modified
- `src/components/SkipToContent.astro` - Skip-to-content accessibility link
- `src/components/Footer.astro` - Footer with GitHub/LinkedIn/email SVG icons
- `src/layouts/BaseLayout.astro` - SEO, ClientRouter, SkipToContent, Footer composition
- `public/og-default.png` - Placeholder OG image (1200x630)
- `src/pages/index.astro` - Home page with empty title for titleDefault
- `src/pages/about.astro` - About stub page
- `src/pages/projects.astro` - Projects stub page
- `src/pages/resume.astro` - Resume stub page
- `src/pages/contact.astro` - Contact stub page

## Decisions Made
- Used empty title on home page to trigger `titleDefault="Jack Cutrara | Software Engineer"` avoiding "Jack Cutrara | Jack Cutrara" double-wrap
- Footer SVGs use `currentColor` for theme-aware icon colors
- All external links (GitHub, LinkedIn) use `target="_blank" rel="noopener noreferrer"`

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- BaseLayout has `<!-- Header will be added in Plan 02 -->` placeholder ready for Header integration
- All 5 pages use BaseLayout, so Header/MobileMenu will automatically appear on all pages
- body uses `flex flex-col` with `pt-16` on main for fixed header offset

---
*Phase: 02-site-shell-navigation*
*Completed: 2026-03-23*
