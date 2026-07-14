---
phase: 25-chat-knowledge-refresh-milestone-verification
plan: 03
subsystem: ai
tags: [chat, portfolio-context, build-script, experience-array, education-ssot, voice-split, corpus-regen]

# Dependency graph
requires:
  - phase: 25 (Plan 01)
    provides: Wave-0 tests-first contract (14 RED-by-design), the green target for this regen
  - phase: 25 (Plan 02)
    provides: locked third-person chat copy (#7/Holloway/Balfour chatSummary), about-chat P2 cut, static.json additive skills + education removal, #7 topic-ban lifted
  - phase: 24-positioning-shift-home-teaser
    provides: education.ts SSoT (EDUCATION/CREDENTIALS)
  - phase: 21-experience-content-pipeline-collection
    provides: experience collection + Holloway/Balfour MDX entries
provides:
  - Corpus engine that ingests project #7 (multi-chain-evm) untruncated into the chat knowledge block
  - Structured reverse-chron experience array {role,company,dateRange,summary} read recursively from src/content/experience/**/*.mdx
  - Education single-sourced from src/data/education.ts via dep-free parseEducation (degree/school/graduation/transferredFrom/certifications)
  - Fail-closed experience reader (exit 2 on any missing required field) + 4-field first-person leak-walk
  - FIRST_PERSON_LEAK_RE extended (interned/coordinated) byte-identical across build script + two voice tests
affects: [25-04-capstone-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SSoT block-bounded regex reader: slice the EDUCATION/CREDENTIALS export blocks first, then run m-flag per-key regexes bounded to those blocks (never match comments/fragments)"
    - "Fail-closed collection reader: validate every schema-required field in a pure helper that throws named errors, caught by the caller's errorCount/exit-2 mechanism BEFORE the artifact is written"
    - "Atomic type+producer+artifact migration: astro check asserted only AFTER regeneration so new types are never checked against stale JSON"

key-files:
  created:
    - tests/build/parse-education.test.ts
  modified:
    - scripts/build-chat-context.mjs
    - src/prompts/portfolio-context-types.ts
    - src/data/portfolio-context.json
    - tests/build/chat-knowledge-voice.test.ts
    - tests/api/chat-voice-split.test.ts
    - tests/build/chat-context-integrity.test.ts

key-decisions:
  - "About sub-type in portfolio-context-types.ts dropped p2 (coupled to 25-02's chat P2 cut) — required for astro check 0/0/0 against the regenerated corpus; NON-gated file"
  - "chat-context-integrity.test.ts (nominally 25-01's) about.p2 assertion retired as a coupled edit — the regenerated corpus has exactly intro/p1/p3; asserted Object.keys sorted deep-equal instead of weakening the contract"
  - "parseEducation reads block-bounded per-key regexes (EDUCATION/CREDENTIALS slices) rather than the rejected --experimental-strip-types loader"

requirements-completed: [CHAT-10, CHAT-11, QA-02]  # CHAT-11 load-bearing half (corpus half); 25-04 runs the milestone verification battery

# Metrics
duration: ~20min
completed: 2026-07-14
status: complete
---

# Phase 25 Plan 03: Corpus Engine Migration (#7 + Experience Array + SSoT Education) Summary

**Rewired the chat corpus build to ingest project #7 untruncated, structure experience as a recursive reverse-chron array read fail-closed from the experience collection, and single-source education from education.ts — then regenerated and committed portfolio-context.json with the extended first-person leak guard byte-identical across all three sites, drift gate clean, astro check 0/0/0, and the entire 25-01 RED-by-design set flipped GREEN.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-14
- **Tasks:** 2 (both TDD)
- **Files modified:** 6 (1 created)

## Accomplishments

- **Task 1 — pure exported helpers (unit-tested first, RED→GREEN):** Added `parseEducation` (dep-free, block-bounded per-key regex reader of education.ts; named errors on missing keys), `parseExperienceEntry` (validates role/company/dateRange/chatSummary/startDate, throws named errors, returns summary=chatSummary), and `isReservedProjects7Source` (belt-and-suspenders #7 reservation predicate). Added `EDUCATION_TS_PATH` + recursive `EXPERIENCE_GLOB` consts. `tests/build/parse-education.test.ts` = 9 unit tests (SSoT deep-equal + malformed/missing-field + three reservation cases). main() and the artifact left untouched in Task 1.
- **Task 2 — ATOMIC engine migration:** interface flip (experience → array, education +transferredFrom/certifications, about drops p2), #7 exclusion lifted (slug-skip deleted, single `slug` binding moved above the reservation guard and reused, `isReservedProjects7Source` guard replacing the blanket MULTI-DEX throw), recursive fail-closed experience reader (globs `**/*.mdx`, `parseExperienceEntry` inside try/catch → errorCount → exit 2 before write, reverse-chron sort by startDate DESC, startDate dropped from emitted shape), structured experience array replacing the string synthesis, 4-field leak-walk (role/company/dateRange/summary of every entry, Array.isArray-guarded fallback), `FIRST_PERSON_LEAK_RE` extended with interned/coordinated byte-identical ×3, parseEducation wired into `merged`, corpus regenerated + committed.

## Regenerated corpus (recorded)

- **projects = 7** (breakdown): daytrade(9378, truncated), nfl-predict(8551), **multi-chain-evm(7356, truncated=no)**, seatwatch(7263), clipify(5684), solsniper(5168), optimize-ai(4063)
- **est_tokens = 48735** — above the 4,096 Haiku cache floor, under the 60k WARN threshold (crossed the 40k INFO threshold only)
- **experience** = 2-entry reverse-chron array: `[{company:"Holloway Company", dateRange:"May 2026 – Present"}, {company:"Balfour Beatty", dateRange:"May 2023 – Aug 2023"}]`
- **education** = `{degree:"B.S. Computer Science", school:"Western Governors University", graduation:"May 2026", transferredFrom:"Virginia Tech", certifications:["LPI Linux Essentials"]}` (single-sourced from education.ts)
- **about** keys = intro/p1/p3 (no p2)

## Gate results

- **`pnpm exec astro check`:** 0 errors / 0 warnings / 0 hints (140 files) — asserted AFTER regeneration.
- **Drift gate (`pnpm build:chat-context:check`):** exit 0 (committed corpus == fresh regen).
- **`checkFirstPersonLeaks`:** GREEN — build regenerated with no leak (exit 0).
- **25-01 RED-until-25-03 set:** GREEN — the targeted 5-file suite passes 102/102 (7 slugs, SSoT education, reverse-chron experience array, #7 untruncated, additive skills, extended regex catching interned/coordinated, `<security>` snapshot, count-7, #7 groundedQA).
- **Full suite (`pnpm exec vitest run`):** **692 passed / 2 skipped / 0 failed** (78 files passed, 1 skipped). No regressions outside the intended set.
- **FIRST_PERSON_LEAK regex byte-identical** across build-chat-context.mjs, chat-knowledge-voice.test.ts, chat-voice-split.test.ts (fixed-string fragment present exactly once in each).
- **`grep -c 'multi-chain-evm") continue'`** = 0 (slug-skip removed); single loop-body `slug` binding (buildProjectBlock keeps its own separate-scope binding — no duplicate declaration; build ran with no SyntaxError).

## Task Commits

1. **Task 1: exported parseEducation/parseExperienceEntry/isReservedProjects7Source + unit tests** — `d85a38e` (feat)
2. **Task 2: ATOMIC corpus migration — #7 ingested, experience array, SSoT education, regex ext, regen** — `30975ad` (feat)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] about sub-type + chat-context-integrity p2 assertion retired (coupled to 25-02 P2 cut)**
- **Found during:** Task 2, after regeneration (astro check reported `Property 'p2' is missing in type` against api/chat.ts, and the integrity suite's `toHaveProperty("p2")` would fail against the p2-less corpus).
- **Issue:** 25-02 cut chat about P2 from the source + build-extractor but deliberately did NOT regenerate; the committed corpus still carried about.p2 and both the `PortfolioContext.about` type and 25-01's `chat-context-integrity` p2 assertion still expected it. Regenerating drops about.p2, so the stale type broke astro check and the stale assertion would break the suite.
- **Fix:** Dropped `p2` from the `about` sub-type in portfolio-context-types.ts (NON-gated). Retired the `chat-context-integrity.test.ts` p2 assertion by asserting the about block has EXACTLY intro/p1/p3 (`Object.keys(about).sort()` deep-equal) — strengthening, not weakening, the contract. Dropped the `about.p2` entry from the chat-knowledge-voice leak-walk (in-plan-scope file).
- **Files modified:** src/prompts/portfolio-context-types.ts, tests/build/chat-context-integrity.test.ts, tests/build/chat-knowledge-voice.test.ts
- **Verification:** astro check 0/0/0; full suite 692 passed; the coupled p2 edits were pre-flagged by the plan's `<coupled_p2_test_edits>` block.
- **Committed in:** `30975ad` (atomic with the migration)

**Note (not a deviation):** Task 1's acceptance criterion expected `node scripts/build-chat-context.mjs --check` to exit 0. It exits 1 — but that drift is the PRE-EXISTING deliberate 25-02 cross-wave drift (static.json skills/education changed, corpus not yet regenerated), NOT a Task-1 change. `git status` confirmed portfolio-context.json was untouched by Task 1 (the real acceptance requirement: "main() and portfolio-context.json unchanged"). Task 2 regenerates and closes the drift (drift gate exit 0 after regen).

---

**Total deviations:** 1 auto-fixed (blocking, coupled p2 retirement — pre-flagged by the plan). No scope creep; no gated D-14 file touched (api/chat.ts/chat.ts/BaseLayout.astro/global.css untouched — api/chat.ts consumes the corpus only via JSON.stringify, serialization-safe with the array shape).

## Issues Encountered

None beyond the pre-flagged coupled p2 edits. The atomic ordering (regenerate → astro check → drift → tests) surfaced the stale p2 type immediately and it was fixed within the same task.

## Known Stubs

None — the corpus is fully wired; #7 ingested untruncated, experience and education read from live sources.

## User Setup Required

None — no external service configuration; zero packages installed (QA-02 holds).

## Next Phase Readiness

- **25-04 (milestone gate):** re-runs the prompt-injection battery + D-26/D-15 gates against the regenerated corpus. The corpus now carries #7, the experience array, and SSoT education; api/chat.ts and system-prompt `<security>` defenses are untouched (D-14).
- The 25-01 RED-by-design set is fully GREEN; the two Balfour B1 samples ("I interned"/"I coordinated") now match the extended regex.

## Self-Check: PASSED

- Created/modified files exist on disk: parse-education.test.ts, build-chat-context.mjs, portfolio-context-types.ts, portfolio-context.json, the three test files.
- Both task commits present in git history: `d85a38e` (Task 1), `30975ad` (Task 2).
- Corpus verified: projects=7 (multi-chain-evm present, truncated=no), experience is a 2-entry reverse-chron array (Holloway first), education 5-field from education.ts, about intro/p1/p3.

---
*Phase: 25-chat-knowledge-refresh-milestone-verification*
*Completed: 2026-07-14*
