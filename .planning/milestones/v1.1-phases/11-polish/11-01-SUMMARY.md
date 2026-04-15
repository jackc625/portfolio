---
phase: 11-polish
plan: 01
subsystem: ui
tags: [css, accessibility, focus-visible, wcag, tailwind, lightning-css, astro-check]

# Dependency graph
requires:
  - phase: 09-primitives
    provides: "Editorial primitives with scoped styles, deferred tech debt items"
  - phase: 10-page-port
    provides: "Page compositions using primitives, chat widget restyle"
provides:
  - "Warning-free build (0 lightning-css warnings)"
  - "Hint-free astro check (0 errors, 0 warnings, 0 hints)"
  - "Comprehensive focus-visible coverage across all interactive elements"
  - "WCAG AA contrast-safe accent usage for chat bot message links"
  - "BaseLayout noindex prop for clean dev page control"
  - "Clean repo with no temporary artifacts (mockup.html, /dev/primitives deleted)"
affects: [11-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Global focus-visible catch-all in global.css for a, button, textarea, input, select, [role=button], summary"
    - "@source not directive pattern to exclude non-source directories from Tailwind detection"
    - "Accent color restricted to large text, UI indicators, and hover states for WCAG AA compliance"

key-files:
  created: []
  modified:
    - "src/styles/global.css"
    - "src/layouts/BaseLayout.astro"
    - "src/components/JsonLd.astro"
    - "src/components/primitives/Container.astro"
    - "src/components/primitives/WorkRow.astro"
    - "src/components/ContactSection.astro"
    - "src/components/primitives/Footer.astro"
    - "astro.config.mjs"

key-decisions:
  - "Used @source not directives to exclude .planning/ and design-system/ from Tailwind detection instead of scrubbing source files"
  - "Container Props hint fixed via explicit type annotation on Astro.props intermediate variable (type alias and @ts-ignore insufficient)"
  - "Chat bot message links changed from accent text to ink text with accent underline for WCAG AA normal-text compliance"
  - "Global focus-visible catch-all placed at global level (not @layer) since Astro scoped styles naturally override via data attributes"

patterns-established:
  - "Focus-visible pattern: 2px solid var(--accent), offset 2px, matching Header/NextProject"
  - "@source not pattern: exclude non-source directories from Tailwind v4 auto-detection"

requirements-completed: [QUAL-03, QUAL-05]

# Metrics
duration: 17min
completed: 2026-04-13
---

# Phase 11 Plan 01: Tech Debt Cleanup Summary

**Warning-free build, hint-free astro check, comprehensive focus-visible keyboard accessibility, WCAG AA accent contrast fix, and repo artifact cleanup**

## Performance

- **Duration:** 17 min
- **Started:** 2026-04-13T20:20:18Z
- **Completed:** 2026-04-13T20:37:51Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Eliminated all 4 lightning-css "Unexpected token Delim" build warnings via @source not directives
- Achieved 0 errors / 0 warnings / 0 hints in astro check (was 1 hint from Container Props)
- Added comprehensive focus-visible keyboard accessibility: global catch-all for 7 element types + scoped rules for WorkRow, ContactSection, Footer, and chat controls
- Fixed WCAG AA contrast failure for chat bot message links (accent #E63946 at ~4.0:1 replaced with ink #0A0A0A at ~18.5:1 for text, accent retained as decorative underline)
- Added noindex prop to BaseLayout replacing the slot-based workaround from Phase 9
- Deleted mockup.html and /dev/primitives page, cleaned sitemap filter

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix build warnings, astro check hints, and add noindex prop** - `84ab79c` (fix)
2. **Task 2: Add comprehensive focus-visible styles, address accent contrast, delete artifacts** - `db02511` (feat)

## Files Created/Modified
- `src/styles/global.css` - Added @source not directives, global focus-visible catch-all, chat focus styles, chat link contrast fix
- `src/layouts/BaseLayout.astro` - Added noindex optional prop with conditional meta tag
- `src/components/JsonLd.astro` - Added is:inline directive to script tag
- `src/components/primitives/Container.astro` - Fixed Props ts(6196) hint via explicit type annotation
- `src/components/primitives/WorkRow.astro` - Added outline ring on .work-row:focus-visible
- `src/components/ContactSection.astro` - Added focus-visible rules for .contact-email and .contact-link
- `src/components/primitives/Footer.astro` - Added focus-visible rule for .footer-social-link
- `astro.config.mjs` - Removed sitemap dev filter (page deleted)
- `mockup.html` - Deleted (parity verified in Phase 10)
- `src/pages/dev/primitives.astro` - Deleted (development-only preview page)

## Accent Contrast Audit (QUAL-05)

| Usage | Context | Default Color | Ratio vs #FAFAF7 | WCAG AA | Status |
|-------|---------|---------------|-------------------|---------|--------|
| .chat-starter-chip:hover | Hover state | --ink-muted | N/A (hover) | N/A | Acceptable (progressive enhancement) |
| .contact-link:hover | Hover state | --ink-muted | N/A (hover) | N/A | Acceptable (progressive enhancement) |
| .footer-social-link:hover | Hover state | --ink-muted | N/A (hover) | N/A | Acceptable (progressive enhancement) |
| .chat-bot-message a | Default text (was) | --accent (#E63946) | ~4.0:1 | FAIL (normal text) | FIXED: now --ink with accent underline |
| Focus rings (outline) | UI component | --accent | ~4.0:1 | PASS (3:1 for UI per 1.4.11) | Acceptable |
| .work-arrow | Decorative indicator | --accent | N/A (icon) | N/A | Acceptable |

## Decisions Made
- Used @source not directives to exclude .planning/ and design-system/ from Tailwind detection instead of scrubbing offending strings from source files -- cleaner, maintainable, and prevents future regressions
- Container Props hint required explicit type annotation on intermediate variable (`const _props: Props = Astro.props`) -- neither `type Props` alias nor `// @ts-ignore` suppressed astro check's hint
- Chat bot message links changed from accent text to ink text with accent underline decoration -- accent at ~4.0:1 fails WCAG AA 4.5:1 for normal text, ink at ~18.5:1 passes easily
- Global focus-visible catch-all placed at global level without @layer since Astro's scoped styles naturally override via data-attribute specificity

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Container Props ts(6196) required different fix than planned**
- **Found during:** Task 1
- **Issue:** Plan suggested changing `interface Props` to `type Props` and using `// @ts-ignore` as fallback. Neither approach suppressed astro check's ts(6196) hint.
- **Fix:** Used explicit type annotation on intermediate variable: `const _props: Props = Astro.props` then destructured from `_props`. This consumes the Props type in a way astro check recognizes.
- **Files modified:** src/components/primitives/Container.astro
- **Verification:** `npx astro check` reports 0 errors, 0 warnings, 0 hints
- **Committed in:** 84ab79c (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minimal -- alternative approach to same goal. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Build is warning-free and hint-free, ready for Plan 02 quality audit
- Focus-visible coverage is comprehensive -- Plan 02 tab-through audit should find all elements covered
- Accent contrast audit table above provides input for Plan 02 WCAG contrast verification
- Repo is clean with no temporary artifacts

## Self-Check: PASSED

- All 9 modified/created files verified present on disk
- Both deleted files (mockup.html, src/pages/dev/primitives.astro) confirmed absent
- Task 1 commit `84ab79c` verified in git log
- Task 2 commit `db02511` verified in git log
- Build exits 0 with 0 lightning-css warnings
- astro check reports 0 errors, 0 warnings, 0 hints

---
*Phase: 11-polish*
*Completed: 2026-04-13*
