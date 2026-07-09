---
phase: 21-experience-content-pipeline-collection
plan: 01
subsystem: content
tags: [content-pipeline, mdx, sync-script, vitest, ordering, path-traversal]

# Dependency graph
requires:
  - phase: 13-projects-content-pipeline
    provides: sync-projects.mjs fenced-block sync mechanism (the verbatim-lift analog)
provides:
  - scripts/sync-experience.mjs — fenced case-study sync for src/content/experience/*.mdx
  - src/lib/experience.ts — sortExperienceEntries reverse-chronological ordering helper (SC3 contract)
  - Wave 0 tests-first suite (unit + path-traversal exit-2 + --check drift + write-mode idempotency + ordering)
  - sync:experience / sync:experience:check npm scripts
affects: [21-02-schema-collection, 21-03-content-sources, 21-04-ci-drift-gate, phase-22-experience-render]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lift-and-strip sync script: mirror sync-projects.mjs, retarget MDX_GLOB, strip domain-specific validations (D-06/D-07)"
    - "Pure structural-generic ordering helper (no astro:content import) so it is Vitest-testable in node env and Phase-22-consumable"
    - "CLI guard (process.argv[1] === fileURLToPath(import.meta.url)) keeps main() from running on import so pure fns stay testable"

key-files:
  created:
    - scripts/sync-experience.mjs
    - src/lib/experience.ts
    - tests/scripts/sync-experience.test.ts
    - tests/scripts/sync-experience-check.test.ts
    - tests/scripts/sync-experience-idempotency.test.ts
  modified:
    - package.json

key-decisions:
  - "Shipped sortExperienceEntries helper (review finding #3, option a) rather than rewording SC3 — makes ordering a concrete Phase-22-consumable contract"
  - "Path-escape test asserts BOTH the message AND err.status === 2 (review finding #2) so the T-21-01 exit-2 mitigation is actually backed"
  - "Added write-mode idempotency test asserting contents + mtimeMs unchanged on 2nd run (review finding #1) — a --check drift test alone would not catch a script that rewrites identical bytes"
  - "sync not wired into build; stays manual sync + CI drift gate, matching the projects analog (D-11)"

patterns-established:
  - "Fenced-block source-of-truth sync with byte-for-byte frontmatter preservation, LF normalization, path-traversal guard, diff-then-write idempotency, and --check CI mode"
  - "Reusable ordering contract lives in src/lib/, unit-tested against the real exported helper (no throwaway inline comparators)"

requirements-completed: [EXP-01, EXP-06]

coverage:
  - id: D1
    description: "Pure sync functions (normalize, readSourceField, sliceFrontmatter, extractFence) are importable and behave per mirrored unit tests"
    requirement: "EXP-01"
    verification:
      - kind: unit
        ref: "tests/scripts/sync-experience.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "source: path escaping project root exits 2 (T-21-01 path-traversal guard, message + status asserted)"
    requirement: "EXP-01"
    verification:
      - kind: integration
        ref: "tests/scripts/sync-experience.test.ts#rejects a source: path that escapes project root (exit 2, status-asserted)"
        status: pass
    human_judgment: false
  - id: D3
    description: "--check exits 0 on clean tree, exits 1 when fenced source drifts from MDX"
    requirement: "EXP-01"
    verification:
      - kind: integration
        ref: "tests/scripts/sync-experience-check.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Second write-mode run over an unchanged entry does not rewrite the file (contents + mtimeMs unchanged)"
    requirement: "EXP-01"
    verification:
      - kind: integration
        ref: "tests/scripts/sync-experience-idempotency.test.ts#running twice in succession produces zero filesystem changes on second run"
        status: pass
    human_judgment: false
  - id: D5
    description: "sortExperienceEntries returns reverse-chronological order (Holloway 2026 before Balfour 2023), non-mutating"
    requirement: "EXP-06"
    verification:
      - kind: unit
        ref: "tests/scripts/sync-experience.test.ts#sortExperienceEntries (SC3 / EXP-06 / D-04)"
        status: pass
    human_judgment: false
  - id: D6
    description: "sync:experience and sync:experience:check npm scripts exist; deps unchanged (11 runtime / 12 dev)"
    verification:
      - kind: other
        ref: "node -e assertion on package.json scripts + dependency counts"
        status: pass
    human_judgment: false

# Metrics
duration: 4min
completed: 2026-07-09
status: complete
---

# Phase 21 Plan 01: Experience Content Pipeline (Sync Engine + Ordering Contract) Summary

**Lifted a parallel `scripts/sync-experience.mjs` fenced-block sync (path-traversal guard + `--check` drift + idempotent diff-then-write, H2/word-count validations stripped) and shipped the reusable `sortExperienceEntries` reverse-chronological helper, all backed by a 20-test Wave 0 suite.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-07-09T08:33:17Z
- **Completed:** 2026-07-09T08:36:56Z
- **Tasks:** 3
- **Files modified:** 6 (5 created, 1 modified)

## Accomplishments
- `scripts/sync-experience.mjs`: exact lift of the projects sync with MDX_GLOB retargeted to `src/content/experience/*.mdx`, the H2-shape and word-count validations stripped per D-07, and the T-21-01 path-traversal guard preserved verbatim.
- `src/lib/experience.ts`: pure, non-mutating, structural-generic `sortExperienceEntries` helper — the concrete SC3 ordering contract Phase 22 will consume via `getCollection("experience")`.
- Wave 0 tests-first suite (20 tests across 3 files) covering the pure functions, exit-2 path-escape (message + status), `--check` exit 0/1 drift, write-mode idempotency (contents + mtime), and reverse-chron ordering.
- `sync:experience` / `sync:experience:check` npm scripts added without touching `build` and without adding dependencies (SC4 held: 11 runtime / 12 dev).

## Task Commits

Each task was committed atomically:

1. **Task 1: Author the Wave 0 tests-first suite (RED)** - `e011563` (test)
2. **Task 2: Create sync-experience.mjs + src/lib/experience.ts (GREEN)** - `5144e1a` (feat)
3. **Task 3: Add the sync:experience npm scripts (D-11)** - `d341aee` (chore)

## Files Created/Modified
- `scripts/sync-experience.mjs` - Fenced case-study sync for the experience collection; exports normalize/readSourceField/sliceFrontmatter/extractFence, internal syncOne/main.
- `src/lib/experience.ts` - `sortExperienceEntries` reverse-chronological ordering helper (SC3/D-04).
- `tests/scripts/sync-experience.test.ts` - Pure-fn unit tests + strengthened exit-2 path-traversal test + ordering test against the real helper.
- `tests/scripts/sync-experience-check.test.ts` - `--check` drift contract (exit 0 clean / exit 1 drift) over freeform experience prose.
- `tests/scripts/sync-experience-idempotency.test.ts` - Write-mode idempotency (contents + mtimeMs unchanged on 2nd run).
- `package.json` - Added `sync:experience` and `sync:experience:check` scripts.

## Decisions Made
- Followed plan as specified. All three review-incorporated findings (#1 idempotency test, #2 exit-2 status assertion, #3 real ordering helper) were implemented as written.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Git warned `CRLF will be replaced by LF` when staging `package.json` — cosmetic line-ending normalization on Windows, not a content change. No action needed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The sync engine and ordering contract exist and are import-safe. Plan 21-02 (schema + collection) can register the `experience` collection and rely on `sortExperienceEntries`; 21-03 supplies content sources; 21-04 wires the CI drift gate around `sync:experience:check`.
- Full suite green (607 passed, 2 skipped) — no regression in the projects sync tests. Additive parallel script confirmed.

## Self-Check: PASSED

---
*Phase: 21-experience-content-pipeline-collection*
*Completed: 2026-07-09*
