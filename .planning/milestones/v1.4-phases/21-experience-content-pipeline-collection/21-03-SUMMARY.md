---
phase: 21-experience-content-pipeline-collection
plan: 03
subsystem: content
tags: [astro, content-collections, mdx, zod, experience, sync, vitest]

# Dependency graph
requires:
  - phase: 21-01
    provides: scripts/sync-experience.mjs (fenced-block extraction, --check drift mode, exit-code contract)
  - phase: 21-02
    provides: experience collection + Zod schema in src/content.config.ts (endDate optional, techStack no .min(1))
provides:
  - Holloway experience entry (full deep-dive, hasCaseStudy true, endDate omitted)
  - Balfour Beatty experience entry (lightweight internship, techStack [], hasCaseStudy false)
  - Fenced Experience/*.md sources feeding the experience MDX bodies
  - Local pnpm-test assertion that experience source: paths resolve (finding #5)
affects: [22-experience-page-holloway-case-study, 25-chat-knowledge-refresh]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fenced-source → synced MDX body: author prose inside CASE-STUDY-START/END markers, sync overwrites body only, frontmatter preserved byte-for-byte"
    - "Optionality-edge entries double as schema fixtures: Holloway omits endDate (present role), Balfour uses techStack: [] (non-engineering)"

key-files:
  created:
    - Experience/BALFOUR_BEATTY.md
    - src/content/experience/holloway.mdx
    - src/content/experience/balfour-beatty.mdx
  modified:
    - Experience/HOLLOWAY_EXPERIENCE.md
    - tests/content/source-files-exist.test.ts

key-decisions:
  - "Holloway highlights: selected 5 headline bullets from the Themes-at-a-glance candidate list (tests 0→~1,400, RLS 223→1, 91 jobs recovered, idempotent time-clock, data-access consolidation)"
  - "Frontmatter summary/highlights strings avoid em-dashes (VOICE-GUIDE Rule 1); en-dash retained only in dateRange display strings"
  - "Balfour body authored first-person from resume PM-internship bullets; H1 sits above the fence so it is excluded from the synced body"

patterns-established:
  - "Experience source-existence mirrored in the local vitest content-integrity test, reusing the shared SOURCE_RE so projects + experience blocks share one matcher"

requirements-completed: [EXP-01, EXP-06]

coverage:
  - id: D1
    description: "Both experience entries created with D-01 typed frontmatter, bodies synced byte-for-byte from fenced Experience/*.md sources; sync is idempotent"
    requirement: "EXP-01"
    verification:
      - kind: integration
        ref: "pnpm sync:experience && pnpm sync:experience:check (exit 0, no drift)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Typed frontmatter for both entries passes astro check via pnpm build; Holloway omits endDate + hasCaseStudy true, Balfour techStack [] + engagementType internship; no new runtime deps (11/12)"
    requirement: "EXP-06"
    verification:
      - kind: integration
        ref: "pnpm build (astro check green) + node deps-count assertion (deps=11 devDeps=12)"
        status: pass
    human_judgment: false
  - id: D3
    description: "pnpm test independently asserts each experience source: path resolves to an existing file (finding #5)"
    verification:
      - kind: unit
        ref: "tests/content/source-files-exist.test.ts#Experience MDX source: frontmatter integrity (finding #5)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Synced holloway.mdx body opens with the Contract engagement lede, preserving the full deep-dive (Overview → Highlights → Themes) for Phase 22 (A2)"
    verification:
      - kind: integration
        ref: "node body-grep for /Contract engagement/ in holloway.mdx body (proxy for A2)"
        status: pass
    human_judgment: true
    rationale: "The grep proves the lede landed and the sync extracted a fence, but a human confirms the intended deep-dive content is what got fenced (A2 authoring judgment, the one Manual-Only check in 21-VALIDATION.md)"

# Metrics
duration: 4min
completed: 2026-07-09
status: complete
---

# Phase 21 Plan 03: Experience Entries (Holloway + Balfour) Summary

**Two real experience entries populated end-to-end — Holloway full deep-dive (endDate omitted, hasCaseStudy true) and Balfour lightweight internship (techStack [], hasCaseStudy false) — with MDX bodies synced byte-for-byte from fenced Experience/*.md sources, build green, and local pnpm-test source-existence coverage.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-09T08:46:11Z
- **Completed:** 2026-07-09T08:50:07Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Added CASE-STUDY-START/END fence markers to `Experience/HOLLOWAY_EXPERIENCE.md` (fence-start immediately after H1, before the `Contract engagement` blockquote so the full deep-dive falls inside the body — A2/D-08)
- Authored the new lightweight `Experience/BALFOUR_BEATTY.md` with a fenced first-person PM-internship body
- Created both `src/content/experience/*.mdx` entries with D-01 typed frontmatter exercising the real optionality edges (Holloway omits `endDate`; Balfour `techStack: []`), synced their bodies via `pnpm sync:experience`, and proved idempotency (`--check` exit 0), a green `pnpm build`, and an unchanged dependency graph (11/12)
- Extended `tests/content/source-files-exist.test.ts` with an experience describe block (reusing the shared `SOURCE_RE`) so `pnpm test` — not only CI — asserts both `source:` paths resolve (review finding #5)

## Task Commits

Each task was committed atomically:

1. **Task 1: Author the fenced Experience sources (Balfour new, Holloway fence)** - `0de9429` (feat)
2. **Task 2: Create the two MDX entries, run the sync, prove build + idempotency** - `c31320e` (feat)
3. **Task 3: Assert experience source: files exist locally in pnpm test** - `3bcdb9b` (test)

## Files Created/Modified
- `Experience/BALFOUR_BEATTY.md` - NEW lightweight fenced source (first-person PM-internship body)
- `Experience/HOLLOWAY_EXPERIENCE.md` - added fence markers (start after H1, end at EOF); body unchanged
- `src/content/experience/holloway.mdx` - NEW entry, D-01 frontmatter (endDate omitted, hasCaseStudy true), synced deep-dive body
- `src/content/experience/balfour-beatty.mdx` - NEW entry, D-10 frontmatter (techStack [], engagementType internship, hasCaseStudy false), synced 3-line body
- `tests/content/source-files-exist.test.ts` - added experience source-existence describe block

## Decisions Made
- Selected 5 Holloway `highlights` from the CONTEXT candidate list (0→~1,400 tests, RLS 223→1, 91 jobs recovered, idempotent geofenced time-clock, data-access consolidation).
- Kept em-dashes out of frontmatter `summary`/`highlights` strings per VOICE-GUIDE Rule 1 (en-dash retained only in the `dateRange` display strings, which is standard range notation).
- Left the Balfour H1 above the fence so only the 1–2 line description becomes the synced body.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. Both `Experience/*.md` sources existed with fences before the first `pnpm sync:experience`, so the sync avoided the exit-2 "source file not found" path (Pitfall 3).

## Known Stubs
None. Both entries carry real content; bodies are machine-synced from authored sources (hand-editing MDX bodies is forbidden per docs/CONTENT-SCHEMA.md).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The typed `experience` collection now carries the two real entries Phase 22's Experience page renders against: Holloway deep-dive (hasCaseStudy true) + Balfour lightweight entry.
- Ordering is Phase-22-ready: Holloway (2026) sorts above Balfour (2023) under startDate desc via the `sortExperienceEntries` helper from 21-01.
- `chatSummary` remains omitted on both entries by design (D-02) — third-person chat variants are authored in Phase 25.

## Self-Check: PASSED

All 5 plan files present on disk; all 3 task commits present in git history.

---
*Phase: 21-experience-content-pipeline-collection*
*Completed: 2026-07-09*
