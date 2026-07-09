---
phase: 22-experience-page-holloway-case-study
plan: 01
subsystem: testing
tags: [vitest, tests-first, content-collections, astro, experience, red-green]

# Dependency graph
requires:
  - phase: 21-experience-content-pipeline-collection
    provides: "experience content collection (holloway.mdx, balfour-beatty.mdx) + sortExperienceEntries ordering helper"
provides:
  - "Wave 0 tests-first validation suite encoding SC1-SC5e observable contracts before implementation"
  - "experience-nav.test.ts — RED guard for D-03 experience-FIRST nav ordering in Header + MobileMenu"
  - "experience-summary.test.ts — RED guard for D-08 company normalization + listing page shape"
  - "experience-detail.test.ts — GREEN content contract + RED source-shape guard for /experience/[id] route"
  - "experience-voice-em-dash.test.ts — GREEN em-dash guard for experience mdx bodies + future page meta"
affects: [22-02 nav edit, 22-03 listing page + D-08 normalization, 22-04 detail route, 22-05 build-output gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tests-first RED/GREEN guards: assertions transcribed from locked D-01..D-11 decisions, each RED test proves it discriminates pre-implementation"
    - "readOrNull(path) helper: absent source files fail RED cleanly instead of throwing ENOENT that aborts the suite"
    - "Multiline flow-style YAML counting: slice a frontmatter block key-to-next-top-level-key and count quoted-string lines (never assume single-line arrays)"

key-files:
  created:
    - tests/build/experience-nav.test.ts
    - tests/content/experience-summary.test.ts
    - tests/content/experience-detail.test.ts
    - tests/content/experience-voice-em-dash.test.ts
  modified: []

key-decisions:
  - "Did NOT mark EXP-02..05 requirements complete: this tests-first plan encodes the contracts but does not satisfy them (3 of 4 files are intentionally RED). Wave 2 (22-02/03/04) turns them GREEN and closes the requirements."
  - "New experience-voice-em-dash.test.ts authored rather than editing the locked/cross-phase-fragile voice-em-dash.test.ts (STATE flag)."
  - "Zero new dependencies: Vitest 4.1.0 already present; package.json + pnpm-lock.yaml byte-identical (QA-02)."

patterns-established:
  - "readOrNull graceful-absence pattern for source-shape assertions on not-yet-built files"
  - "Block-scoped multiline-YAML entry counting tolerant of flow-style arrays split across lines (REVIEWS 22-01)"

requirements-completed: []

coverage:
  - id: D1
    description: "experience-nav.test.ts collects cleanly and RED-asserts href /experience precedes href /projects + startsWith(/experience) isActive branch in Header.astro and MobileMenu.astro (SC1 / EXP-02 / D-03)"
    requirement: "EXP-02"
    verification:
      - kind: unit
        ref: "tests/build/experience-nav.test.ts (collects, 4 assertions RED pre-impl by design)"
        status: pass
    human_judgment: false
  - id: D2
    description: "experience-summary.test.ts RED-asserts holloway company === Holloway Company (D-08), 5 multiline-YAML highlights + role/dateRange/non-empty techStack, and experience.astro uses sortExperienceEntries + /experience/ deep link (SC2 / EXP-03)"
    requirement: "EXP-03"
    verification:
      - kind: unit
        ref: "tests/content/experience-summary.test.ts (collects; techStack+highlights GREEN, company+page RED pre-impl)"
        status: pass
    human_judgment: false
  - id: D3
    description: "experience-detail.test.ts GREEN content contract (hasCaseStudy-true ids === [holloway], balfour excluded) + RED source-shape guard requiring [id].astro to .filter on hasCaseStudy and carry exactly two /experience back links (SC3/SC4 / EXP-04/EXP-05)"
    requirement: "EXP-04"
    verification:
      - kind: unit
        ref: "tests/content/experience-detail.test.ts (collects; content contract GREEN, source shape RED pre-impl)"
        status: pass
    human_judgment: false
  - id: D4
    description: "experience-voice-em-dash.test.ts GREEN — zero U+2014 in holloway + balfour mdx bodies (en dashes allowed); page-source assertions skip gracefully until pages ship (SC5e)"
    requirement: "EXP-05"
    verification:
      - kind: unit
        ref: "tests/content/experience-voice-em-dash.test.ts (4 passed GREEN)"
        status: pass
    human_judgment: false

# Metrics
duration: 4min
completed: 2026-07-09
status: complete
---

# Phase 22 Plan 01: Experience Wave 0 Tests-First Validation Suite Summary

**Four Vitest guards encoding the Experience surface's SC1-SC5e contracts before implementation: nav-ordering, D-08 company normalization + listing shape, and detail-route filter are RED by design; the em-dash guard is GREEN now.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-09T21:01:32Z
- **Completed:** 2026-07-09T21:05:00Z
- **Tasks:** 4
- **Files modified:** 4 (all created)

## Accomplishments
- Authored `tests/build/experience-nav.test.ts` — RED guard asserting, for both Header.astro and MobileMenu.astro, that `href: "/experience"` precedes `href: "/projects"` (D-03 experience-FIRST) and that a `startsWith("/experience")` isActive branch exists. Turns GREEN when 22-02 edits the nav.
- Authored `tests/content/experience-summary.test.ts` — RED on `company === "Holloway Company"` (D-08 drops the leading "The") and on the `experience.astro` listing source (`sortExperienceEntries` + `/experience/` deep link); GREEN already on the 5-highlight count (multiline flow-YAML) and role/dateRange/non-empty techStack presence.
- Authored `tests/content/experience-detail.test.ts` — GREEN content contract (`hasCaseStudy`-true ids === `["holloway"]`, balfour-beatty excluded), RED source-shape guard requiring `[id].astro` to `.filter` on `hasCaseStudy` in getStaticPaths and carry exactly TWO `href="/experience"` back links (D-02 top + bottom, REVIEWS 22-01).
- Authored `tests/content/experience-voice-em-dash.test.ts` — GREEN now; zero U+2014 across both experience mdx bodies (en dashes allowed), with page-source assertions that skip gracefully until 22-03/22-04 ship and then tighten. Left the locked `voice-em-dash.test.ts` untouched.
- Confirmed all four files collect with no syntax/collection errors and that `package.json` + `pnpm-lock.yaml` remain byte-identical (zero new deps, QA-02).

## Task Commits

Each task was committed atomically:

1. **Task 1: Nav-shape test (experience-nav.test.ts)** - `03a3d0e` (test)
2. **Task 2: Holloway summary + D-08 test (experience-summary.test.ts)** - `5b2fbf6` (test)
3. **Task 3: Detail filter test (experience-detail.test.ts)** - `a0aab05` (test)
4. **Task 4: Experience em-dash guard (experience-voice-em-dash.test.ts)** - `ce0793c` (test)

**Plan metadata:** _final docs commit (this SUMMARY + STATE + ROADMAP)_

## Files Created/Modified
- `tests/build/experience-nav.test.ts` - RED nav-ordering guard (SC1 / EXP-02 / D-03)
- `tests/content/experience-summary.test.ts` - RED D-08 company + listing shape guard, GREEN highlights/techStack (SC2 / EXP-03)
- `tests/content/experience-detail.test.ts` - GREEN content contract + RED source-shape filter guard (SC3/SC4 / EXP-04/EXP-05)
- `tests/content/experience-voice-em-dash.test.ts` - GREEN em-dash guard for experience mdx bodies + future page meta (SC5e)

## Decisions Made
- **Requirements not marked complete.** EXP-02..05 are listed in the plan frontmatter, but this plan only authors the machine-checkable contracts; 3 of the 4 test files are intentionally RED because the pages/nav/D-08 normalization do not exist yet. Marking the requirements complete now would be a false-complete. They will be closed when Wave 2 (22-02/03/04) turns these tests GREEN and 22-05 confirms at the build-output gate.
- **New file over editing the locked guard.** Created a separate `experience-voice-em-dash.test.ts` rather than extending `tests/content/voice-em-dash.test.ts`, which STATE flags as cross-phase-fragile (hardcodes the 6 project slugs).
- **Graceful-absence pattern.** Source-shape assertions use a `readOrNull` helper so a not-yet-built page fails RED with a clear message instead of throwing ENOENT and aborting the suite.

## Deviations from Plan

None - plan executed exactly as written. All four files were authored per their `<action>` blocks; the RED/GREEN split matches the plan's `must_haves.truths` exactly (nav RED, summary company+page RED / highlights+techStack GREEN, detail content GREEN / source RED, em-dash GREEN).

## Issues Encountered
- `state.record-metric` and `state.add-decision` required flag-style args (`--phase/--plan/--duration/--tasks/--files`, `--summary`) rather than positional; re-invoked with flags. No impact on artifacts.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Wave 2 has its `<automated>` verify targets ready: 22-02 turns `experience-nav.test.ts` GREEN; 22-03 turns the company/listing halves of `experience-summary.test.ts` GREEN; 22-04 turns the source-shape half of `experience-detail.test.ts` GREEN. 22-05 confirms all four plus the build-output HTML assertions.
- No blockers. Zero new dependencies; lockfile byte-identical.

## Self-Check: PASSED

All 4 test files and the SUMMARY exist on disk; all 4 task commits (03a3d0e, 5b2fbf6, a0aab05, ce0793c) are present in git history.

---
*Phase: 22-experience-page-holloway-case-study*
*Completed: 2026-07-09*
