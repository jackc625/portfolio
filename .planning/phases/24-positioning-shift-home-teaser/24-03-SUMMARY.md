---
phase: 24-positioning-shift-home-teaser
plan: 03
subsystem: ui
tags: [astro, copy, content-collections, positioning, education, jsdom, render-gate]

# Dependency graph
requires:
  - phase: 24-01
    provides: src/data/education.ts (EDUCATION + CREDENTIALS SSoT)
  - phase: 24-02
    provides: index.astro renders ABOUT_INTRO + ABOUT_P1 from about.ts (revision propagates to Home)
provides:
  - Revised first-person About copy (INTRO/P1/P3) in honest new-grad-with-production-experience register
  - Dedicated compact /about Education/credentials block fed by education.ts (WGU B.S. CS May 2026, VT transfer sub-note, LPI Linux Essentials)
  - POS-03 rendered-output regression test (tests/build/about-education-render.test.ts)
  - Sharpened /about description prop (self-applied seniority qualifier dropped)
affects: [24-04, 25-chat-knowledge-refresh]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Education block clones the experience.astro .earlier-rule hairline divider idiom (page-scoped, quiet mono register, no accent)"
    - "POS-03 render gate clones the featured-tier-render.test.ts jsdom dist-render idiom (existsSync guard + DOMParser on dist/client/about/index.html)"

key-files:
  created:
    - tests/build/about-education-render.test.ts
  modified:
    - src/data/about.ts
    - src/pages/about.astro

key-decisions:
  - "Education block: weight-500 degree line leads, institution/date + VT transfer sub-note + credential in muted/faint mono; VT rendered as transfer sub-note only, never a credential (D-10)"
  - "All four visible facts sourced from education.ts (no re-hardcoded WGU/VT literals); VT sub-note composed as `Transferred from {EDUCATION.transferredFrom}`"
  - "Degree/institution/date joined with a middot (U+00B7) separator, not an em dash, to hold the zero-U+2014 rule"
  - "about.ts kept ASCII-source + non-breaking space convention in ABOUT_INTRO; ABOUT_P2 source and value kept byte-identical (D-06)"

patterns-established:
  - "Compact editorial credentials block on /about: label-mono group label + 1px --rule hairline + minimal mono entries, page-scoped, no accent (MASTER 7/8)"

requirements-completed: [POS-01, POS-02, POS-03]

coverage:
  - id: D1
    description: "About copy presents Jack as a software engineer with shipped production experience in an honest new-grad register (no self-diminishing/senior label)"
    requirement: POS-01
    verification:
      - kind: unit
        ref: "tests/client/about-data.test.ts (all four exports truthy; P1/P2/P3 <=80 words)"
        status: pass
      - kind: build
        ref: "tests/build/about-education-render.test.ts#renders the POS-01/02 positive claims in the About body"
        status: pass
    human_judgment: true
    rationale: "Register/tone is Jack's copy-review call at the 24-04 gate; automation proves the banned words are absent and positive claims render, but final wording is a human judgment (drafts pending review)."
  - id: D2
    description: "Revised intro + P1 propagate to the Home ABOUT preview via the shared about.ts source of truth"
    requirement: POS-02
    verification:
      - kind: build
        ref: "pnpm build (index.astro imports ABOUT_INTRO + ABOUT_P1 from about.ts; no index.astro edit)"
        status: pass
    human_judgment: false
  - id: D3
    description: "/about shows a dedicated compact Education/credentials block with all four visible facts (WGU B.S. CS May 2026, VT transfer sub-note, LPI Linux Essentials), non-interactive (no accent)"
    requirement: POS-03
    verification:
      - kind: build
        ref: "tests/build/about-education-render.test.ts#renders all four visible education facts"
        status: pass
      - kind: build
        ref: "tests/build/about-education-render.test.ts#the Education block carries no accent affordance (non-interactive)"
        status: pass
    human_judgment: false

# Metrics
duration: 6min
completed: 2026-07-14
status: complete
---

# Phase 24 Plan 03: About Positioning Shift + /about Education Block Summary

**Revised first-person About copy to an honest new-grad-with-production-experience register (P2 verbatim) and added a page-scoped /about Education block fed by education.ts, guarded by a new POS-03 jsdom render regression.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-14T04:15:55Z
- **Completed:** 2026-07-14T04:21:48Z
- **Tasks:** 2
- **Files modified:** 3 (2 modified, 1 created)

## Accomplishments
- Reworked ABOUT_INTRO / ABOUT_P1 / ABOUT_P3 to drop the self-applied seniority qualifier and carry production positioning, present-tense Holloway framing, a completed B.S. nod, and a full-time-search availability close (POS-01, POS-02); ABOUT_P2 kept byte-identical (D-06). Because about.ts is the shared SSoT, the intro + P1 revision propagates to the Home ABOUT preview with no index.astro edit.
- Added a dedicated compact Education/credentials block to /about (inside the existing Container, page-scoped CSS): label-mono `EDUCATION`, a 1px `--rule` hairline cloned from experience.astro, a weight-500 degree line, `institution · date` and the VT transfer sub-note in muted/faint mono, and the LPI credential line. All facts read from education.ts; no accent, no GPA/honors/graphics (MASTER 7/8).
- Authored tests/build/about-education-render.test.ts (POS-03 render regression): asserts all four visible facts from dist/client/about/index.html, that the block carries no interactive/accent target, and two positive POS-01/02 body claims.
- Sharpened the /about description prop, dropping the self-applied seniority qualifier (D-07).

## Task Commits

Each task was committed atomically:

1. **Task 1: Revise src/data/about.ts copy (intro / P1 / P3; P2 verbatim)** - `81170f2` (feat)
2. **Task 2: Add the /about Education block + sharpen description + author the POS-03 render gate** - `4046491` (feat)

**Plan metadata:** committed with SUMMARY/STATE/ROADMAP.

## Files Created/Modified
- `src/data/about.ts` - ABOUT_INTRO/P1/P3 revised for the positioning shift; ABOUT_P2 byte-identical; zero em dashes; first person
- `src/pages/about.astro` - Education block markup + page-scoped CSS reading EDUCATION + CREDENTIALS; sharpened description prop
- `tests/build/about-education-render.test.ts` - new jsdom POS-03 render regression gate

## Decisions Made
- Lead the education block with the completed WGU degree; render VT strictly as a `Transferred from Virginia Tech` sub-note (never a credential, D-10), composing the string from `EDUCATION.transferredFrom` so the VT literal is not re-hardcoded.
- Joined degree/institution/date facts with a middot (U+00B7) rather than an em dash to hold the zero-U+2014 discipline that the automated MDX gates do not cover for these unscanned files.
- Kept about.ts ASCII-source convention with the non-breaking space in ABOUT_INTRO; verified ABOUT_P2's compiled value is byte-identical to its pre-revision value.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. Both task verifications were green on first run (about-data 5/5, POS-03 render gate 4/4, astro check 0/0/0). The manual em-dash + register self-checks on both about.ts and about.astro returned zero for U+2014, `junior`, `senior`, and `5+ years`. D-19 protected files (global.css, BaseLayout.astro) were not touched.

## User Setup Required
None - no external service configuration required. The revised About strings are drafts pending Jack's copy review at the 24-04 gate.

## Next Phase Readiness
- 24-04 (phase capstone) can now author the cross-file site-copy Gate A across all five scanned files (index.astro / about.astro / about.ts / education.ts / ContactSection.astro), all now em-dash-clean and register-clean, plus the phase-wide D-19 baseline hash comparison.
- POS-01/02/03 are satisfied at rendered output; the final About wording remains a human copy-review item for 24-04.

## Self-Check: PASSED
- FOUND: src/data/about.ts
- FOUND: src/pages/about.astro
- FOUND: tests/build/about-education-render.test.ts
- FOUND commit: 81170f2 (Task 1)
- FOUND commit: 4046491 (Task 2)

---
*Phase: 24-positioning-shift-home-teaser*
*Completed: 2026-07-14*
