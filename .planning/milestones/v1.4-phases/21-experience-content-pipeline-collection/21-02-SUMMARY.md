---
phase: 21-experience-content-pipeline-collection
plan: 02
subsystem: content
tags: [astro, content-collections, zod, typescript, experience, schema]

# Dependency graph
requires:
  - phase: 21-01
    provides: sync-experience.mjs pipeline + sortExperienceEntries() ordering helper
provides:
  - "`experience` content collection registered with the full D-01 Zod schema"
  - "Extended `collections` export ({ projects, experience }) — build-time frontmatter validation gate for experience entries"
  - "Sortable `startDate` field + display-only `dateRange` + bounded `highlights[]` typed render contract (EXP-06)"
affects: [21-03, phase-22-experience-surface, phase-25-chat-experience]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Self-extended content.config.ts: additive experience collection alongside projects"
    - "Plain-object schema form (z.object) for image-less collections vs projects' function form"
    - "Optionality-edge schema: optional endDate, unbounded techStack, highlights.max(5) no-min"

key-files:
  created: []
  modified:
    - src/content.config.ts

key-decisions:
  - "techStack: z.array(z.string()) with NO .min(1) so Balfour's empty [] validates (Pitfall 4)"
  - "highlights: z.array(z.string()).max(5) with no hard minimum so 0-2-highlight entries validate (A1/D-03)"
  - "endDate optional (absence ⇒ present role, D-01); chatSummary optional (content deferred to Phase 25, D-02)"
  - "source: z.string() only — existence validated by sync script, not a Zod filesystem refinement (D-15 convention)"

patterns-established:
  - "Additive self-extend of collections export ({ projects, experience }) — never replace (Pitfall 6)"
  - "Plain-object z.object schema for collections without an image() field (A3)"

requirements-completed: [EXP-01, EXP-06]

coverage:
  - id: D1
    description: "experience content collection registered and exported alongside projects with the full D-01 schema; astro check validates frontmatter at build time and an empty (no-entries) collection passes"
    requirement: EXP-01
    verification:
      - kind: automated
        ref: "pnpm exec astro check (0 errors, 0 warnings)"
        status: pass
    human_judgment: false
  - id: D2
    description: "sortable startDate + display-only dateRange + bounded highlights[] typed render contract available for reverse-chron Experience surface"
    requirement: EXP-06
    verification:
      - kind: automated
        ref: "grep acceptance criteria (endDate optional, highlights.max(5), engagementType enum, no second .min(1))"
        status: pass
    human_judgment: false

# Metrics
duration: 6min
completed: 2026-07-09
status: complete
---

# Phase 21 Plan 02: Experience Content Collection Summary

**Registered a forward-compatible `experience` content collection in `src/content.config.ts` with the full D-01 Zod schema (optional endDate, unbounded techStack, highlights.max(5)-no-min, deferred chatSummary), extending the collections export so Phase 22/25 need no later schema change.**

## Performance

- **Duration:** ~6 min
- **Completed:** 2026-07-09
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added the `experience` `defineCollection` block using the plain-object `z.object({...})` schema form (A3 — no image field) with the `glob({ pattern: "**/*.mdx", base: "./src/content/experience" })` loader (D-09).
- Encoded the two optionality edges that would break if copied from `projects`: `techStack: z.array(z.string())` with NO `.min(1)` (Balfour's `[]`, Pitfall 4) and `highlights: z.array(z.string()).max(5)` with no hard minimum (A1/D-03).
- Extended the export to `export const collections = { projects, experience };` — additive, `projects` preserved byte-unchanged (Pitfall 6).
- `pnpm exec astro check` is green (0 errors, 0 warnings) with the empty experience collection valid — the SC2 build-time validation gate is live.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the experience collection schema (D-01)** - `9b03b73` (feat)

**Plan metadata:** committed with STATE.md + ROADMAP.md + REQUIREMENTS.md (docs)

## Files Created/Modified
- `src/content.config.ts` - Added `experience` defineCollection block (D-01 schema) and extended the `collections` export to include both `projects` and `experience`.

## Decisions Made
- Followed plan as specified. Schema types locked exactly per D-01 / 21-PATTERNS.md.
- Kept `source: z.string()` with no filesystem refinement — existence is enforced by `scripts/sync-experience.mjs`, matching the projects D-15 convention.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `astro check` emitted a `[glob-loader]` WARN that the base directory `src/content/experience/` does not exist. This is expected and intentional — no entries have been authored yet (Plan 03 adds holloway.mdx / balfour-beatty.mdx). The check result is 0 errors / 0 warnings; the empty collection is valid.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Typed contract is live. Plan 03 can author `holloway.mdx` (omit `endDate`, `hasCaseStudy: true`, 3-5 highlights) and `balfour-beatty.mdx` (`techStack: []`, `hasCaseStudy: false`, `engagementType: "internship"`, 0-2 highlights) — both will validate against this schema, doubling as its optionality-edge fixtures.
- Phase 22 consumes `sortExperienceEntries(await getCollection("experience"))` against the sortable `startDate` field defined here.

## Self-Check: PASSED

- `src/content.config.ts` exists (modified)
- `21-02-SUMMARY.md` exists
- Task 1 commit `9b03b73` present in git log

---
*Phase: 21-experience-content-pipeline-collection*
*Completed: 2026-07-09*
