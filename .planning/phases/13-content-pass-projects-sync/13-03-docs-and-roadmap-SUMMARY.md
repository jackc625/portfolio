---
phase: 13-content-pass-projects-sync
plan: 03
subsystem: docs-and-planning
tags: [docs, voice-contract, content-schema, roadmap-amendment, tdd-green]

requires:
  - phase: 13-content-pass-projects-sync
    plan: 01
    provides: 3 RED vitest files (tests/content/docs-content-schema.test.ts, tests/content/docs-voice-guide.test.ts, tests/content/roadmap-amendment.test.ts)
provides:
  - docs/CONTENT-SCHEMA.md — authoritative 4-section contract for Zod schema + sync fence + author workflow + failure modes (CONT-07)
  - docs/VOICE-GUIDE.md — voice-by-surface table + four hard rules (D-11) + seatwatch.mdx canonical-example reference (CONT-07)
  - .planning/ROADMAP.md Phase 13 SC#1 amended from 6-H2 "Approach → Architecture" to 5-H2 "Approach & Architecture" (D-02)
affects: [13-04-daytrade-rename-and-anchors, 13-05/06/07-case-studies, 13-08-uat-and-about-audit]

tech-stack:
  added: []
  patterns:
    - "locked-contract doc shape mirrors design-system/MASTER.md — 'code wins, doc is wrong' precedence disclaimer at top (PATTERNS.md analog match)"
    - "docs/ directory first created in this plan — ls docs/ returned empty at plan start; mkdir -p docs before writing CONTENT-SCHEMA.md"
    - "ROADMAP amendment kept as a single 1+1 diff (one insertion, one deletion) — every other character preserved byte-for-byte per PATTERNS.md 'single character-range edit' rule"

key-files:
  created:
    - docs/CONTENT-SCHEMA.md
    - docs/VOICE-GUIDE.md
  modified:
    - .planning/ROADMAP.md
    - .planning/STATE.md

key-decisions:
  - "Resume PDF external-source location (D-19) left abstract in docs/CONTENT-SCHEMA.md. The plan's threat register (T-13-DOC-01) explicitly flags 'executor is instructed to NOT invent one' — Jack can fill in the real URL later if he wants a paper trail inside the repo. Current wording: 'Jack maintains the actual source separately (Google Doc / LaTeX template).'"
  - "docs/CONTENT-SCHEMA.md Section 1 heading is '## 1. Frontmatter Schema' (not '## 1. Frontmatter Schema (Zod)' as the RESEARCH.md skeleton had it). Reason: the test regex is /^## 1\\. Frontmatter Schema/m which matches both forms, but the PATTERNS.md acceptance grep pins the exact prefix. Stripped the parenthetical to keep the heading line flush with the test's minimal assertion and avoid future regex drift."
  - "Added one extra H3-style paragraph in CONTENT-SCHEMA.md Section 2 ('Fence conventions:') that is not in the RESEARCH.md skeleton. It enumerates the four fence invariants (literal HTML comments, each marker once, markers before any code fence, start before end) explicitly so a reader landing on Section 2 without reading sync-projects.mjs knows the full contract. No test assertion forced this; it's Rule 2 territory (missing critical functionality in a reference doc)."
  - "VOICE-GUIDE.md includes TWO references to seatwatch.mdx — the skeleton's 'Reference: src/content/projects/seatwatch.mdx post-Phase 13 rewrite is the canonical example' line plus the plan-mandated 'See src/content/projects/seatwatch.mdx — its 5 H2s ...' cross-reference after the bullets. Both match /seatwatch\\.mdx/. Test assertion is satisfied either way; kept both because they answer different questions (which file vs. what to study in it)."
  - "Phase 13 SC#1 amendment in ROADMAP.md preserved the em-dashes (' — ') and en-dashes ('600–900') as non-ASCII Unicode characters. Copied the OLD string from the file's current bytes via Edit tool (no retyping) per PATTERNS.md instruction, so the amendment is a pure substring replacement of 'Approach → Architecture' → 'Approach & Architecture' with zero collateral drift."

requirements-completed: [CONT-07]

duration: ~8min
completed: 2026-04-19
---

# Phase 13 Plan 03: Docs + ROADMAP Amendment Summary

**Two new reference contracts — docs/CONTENT-SCHEMA.md (Zod + sync) and docs/VOICE-GUIDE.md (voice + four hard rules) — plus the single-line ROADMAP amendment that collapses 6 H2s into 5 per D-01, closing the Phase 13 paper-trail discrepancy D-02 flagged at phase kickoff.**

## Performance

- **Duration:** ~8 min (inline execution)
- **Tasks:** 3 (one per file)
- **Files created:** 2 (docs/CONTENT-SCHEMA.md 124 LOC, docs/VOICE-GUIDE.md 83 LOC)
- **Files modified:** 1 (.planning/ROADMAP.md, single 1+1 line diff)
- **Dependencies added:** 0 (S8 zero-new-deps gate holds)

## Accomplishments

- `docs/CONTENT-SCHEMA.md` = 124 LOC (target 80–180, plan min 80 satisfied). Four H2s match the test regex contract exactly. 13-row Zod table enumerates every post-Plan-02 field. 12-row failure-mode matrix covers every sync + Zod exit path. Code-wins precedence disclaimer at top mirrors `design-system/MASTER.md` convention.
- `docs/VOICE-GUIDE.md` = 83 LOC (target 60–140, plan min 60 satisfied). Voice-by-surface table covers all 5 surfaces. Four hard rules each have exact test-matching subsection headings. `seatwatch.mdx` referenced twice as canonical example. D-11 banlist includes the "scalable (unless paired with a number)" carve-out verbatim.
- `.planning/ROADMAP.md` Phase 13 SC#1 amendment is a surgical 1+1 diff (one inserted line, one deleted line; every other character preserved byte-for-byte). "Approach → Architecture" is gone; "Approach & Architecture" is in. Phase 13 + Phase 14 headers untouched.
- All 3 docs/ROADMAP test files from Plan 01 flipped RED → GREEN:
  - `tests/content/docs-content-schema.test.ts`: 2 tests, 2 passed
  - `tests/content/docs-voice-guide.test.ts`: 2 tests, 2 passed
  - `tests/content/roadmap-amendment.test.ts`: 2 tests, 2 passed
- Zero regressions: `pnpm test tests/scripts tests/content/docs-content-schema.test.ts tests/content/docs-voice-guide.test.ts tests/content/roadmap-amendment.test.ts` = 6 files / 22 tests all pass (3 Plan 02 files + 3 Plan 03 files).

## Task Commits

1. **Task 1: docs/CONTENT-SCHEMA.md per D-17 four-section spec** — `173ac6e` (feat)
2. **Task 2: docs/VOICE-GUIDE.md per D-09/D-10/D-11 spec** — `c222dee` (feat)
3. **Task 3: ROADMAP.md Phase 13 SC#1 amended to 5-H2 per D-02** — `32d5630` (docs)

## Test Counts

```
$ pnpm test tests/content/docs-content-schema.test.ts tests/content/docs-voice-guide.test.ts tests/content/roadmap-amendment.test.ts
 Test Files  3 passed (3)
      Tests  6 passed (6)

$ pnpm test tests/scripts tests/content/docs-content-schema.test.ts tests/content/docs-voice-guide.test.ts tests/content/roadmap-amendment.test.ts
 Test Files  6 passed (6)
      Tests  22 passed (22)
```

Full suite before Plan 03: 23 files, 8 failed / 15 passed (149 tests, 16 failed / 133 passed).
Full suite after Plan 03: 23 files, 5 failed / 18 passed (149 tests, 10 failed / 139 passed).

- Net: +3 test files GREEN (the 3 docs/ROADMAP contracts this plan owns), +6 tests passing.
- All remaining RED tests are expected per the Plan 01 SUMMARY mapping:
  - `projects-collection`, `source-files-exist`, `resume-asset`, `case-studies-have-content` → Plan 04 (source: field additions + daytrade rename)
  - `case-studies-shape`, `case-studies-wordcount`, `voice-banlist` → Plans 05/06/07 (case-study bodies)

## RED → GREEN Mapping (this plan's tests)

| Plan 01 test file | Before Plan 03 | After Plan 03 | Closed by |
|---|---|---|---|
| `tests/content/docs-content-schema.test.ts` | RED (file absent) | GREEN (2/2) | Task 1 commit `173ac6e` |
| `tests/content/docs-voice-guide.test.ts` | RED (file absent) | GREEN (2/2) | Task 2 commit `c222dee` |
| `tests/content/roadmap-amendment.test.ts` | RED (matched "Approach → Architecture") | GREEN (2/2) | Task 3 commit `32d5630` |

## Initial State → End State

| Contract | State at Plan 03 start | State at Plan 03 end |
|---|---|---|
| `docs/` directory | absent | exists with 2 files |
| `docs/CONTENT-SCHEMA.md` | absent | 124 LOC, 4 sections, 13-row schema table, 12-row failure matrix |
| `docs/VOICE-GUIDE.md` | absent | 83 LOC, voice-by-surface table, 4 hard rules, seatwatch.mdx canonical ref |
| ROADMAP Phase 13 SC#1 | 6-H2 "Approach → Architecture" | 5-H2 "Approach & Architecture" (D-02 closed) |
| 3 docs/ROADMAP Plan-01 test files | RED | GREEN |
| CONT-07 requirement | pending | closed |
| D-02 paper-trail deliverable | open | closed |

## Deviations from Plan

**None material.** Two micro-adjustments documented as deviations for the audit trail:

### Auto-applied clarifications (Rule 2 — critical documentation functionality)

**1. [Rule 2] Added explicit "Fence conventions:" subsection to CONTENT-SCHEMA.md Section 2**
- **Found during:** Task 1 authoring
- **Gap:** The RESEARCH.md skeleton Section 2 named the 5 H2s and the 600–900 word target but left the fence invariants (literal markers, each-once, before-code-fence, order) implicit in the sync script behavior.
- **Fix:** Added a 4-bullet "Fence conventions:" subsection between the skeleton example block and the "Five H2s required" list. Makes the full contract grep-visible to a reader who lands on Section 2 without also reading `scripts/sync-projects.mjs`.
- **Files modified:** `docs/CONTENT-SCHEMA.md`
- **Commit:** `173ac6e`

**2. [Rule 2] Removed parenthetical "(Zod)" from CONTENT-SCHEMA.md Section 1 heading**
- **Found during:** Task 1 authoring
- **Skeleton said:** `## 1. Frontmatter Schema (Zod)`
- **Reason for change:** The test regex `/^## 1\. Frontmatter Schema/m` matches both forms, but the acceptance-criteria grep in the plan pins the exact prefix `^## [1-4]\. (Frontmatter Schema|Sync Contract|Author Workflow|Failure-Mode Matrix)` — parentheticals would drift from that enumeration. Stripped to keep the heading flush with the enumerated pattern.
- **Files modified:** `docs/CONTENT-SCHEMA.md`
- **Commit:** `173ac6e`

**Total deviations:** 2 micro-clarifications (both additive/corrective, no semantic shift). **Impact:** none — acceptance criteria all still pass.

## Self-Check: PASSED

- [x] `docs/CONTENT-SCHEMA.md` exists (124 LOC, plan target 80–180 met)
- [x] `grep -cE "^## [1-4]\\. (Frontmatter Schema|Sync Contract|Author Workflow|Failure-Mode Matrix)" docs/CONTENT-SCHEMA.md` = 4
- [x] Code-wins precedence disclaimer present and test-matching: `pnpm test tests/content/docs-content-schema.test.ts` = 2/2 GREEN
- [x] 13-row Zod table present (`source` field included: `grep -c "| source |" docs/CONTENT-SCHEMA.md` = 1)
- [x] Fence markers documented: `grep -c "CASE-STUDY-START\\|CASE-STUDY-END" docs/CONTENT-SCHEMA.md` = 7 (≥ 2 required)
- [x] "Do NOT edit" warning in Section 3: `grep -ci "Do NOT edit" docs/CONTENT-SCHEMA.md` = 1
- [x] Resume PDF workflow subsection in Section 3: `grep -ci "Resume PDF workflow" docs/CONTENT-SCHEMA.md` = 1
- [x] Failure-mode matrix has 12 rows per RESEARCH.md §6 lines 857-868
- [x] `docs/VOICE-GUIDE.md` exists (83 LOC, plan target 60–140 met)
- [x] `grep -cE "^### Rule [1-4]:" docs/VOICE-GUIDE.md` = 4
- [x] Each Rule subsection exact heading match (Rule 1/2/3/4 all return 1)
- [x] `grep -c "seatwatch\\.mdx" docs/VOICE-GUIDE.md` = 2 (≥ 1 required)
- [x] `grep -cE "(About page|Homepage hero|MDX case studies|Resume PDF|Chat widget)" docs/VOICE-GUIDE.md` = 5
- [x] Banlist hits D-11 words: `grep -cE "(revolutionary|seamless|leverage|robust|dive deeper)" docs/VOICE-GUIDE.md` = 5
- [x] `pnpm test tests/content/docs-voice-guide.test.ts` = 2/2 GREEN
- [x] ROADMAP amendment verified: `grep -c "Approach & Architecture" .planning/ROADMAP.md` = 1; `grep -c "Approach → Architecture" .planning/ROADMAP.md` = 0
- [x] ROADMAP amendment diff is 1+1 (`git diff --numstat .planning/ROADMAP.md` = `1\t1`)
- [x] Phase 13 and Phase 14 headers unchanged in ROADMAP.md
- [x] `pnpm test tests/content/roadmap-amendment.test.ts` = 2/2 GREEN
- [x] Task commit hashes exist in git log: `173ac6e`, `c222dee`, `32d5630`
- [x] Full regression sweep GREEN across Plan 02 + Plan 03 tests: 6 files / 22 tests all pass
- [x] S8 zero-new-deps: `git diff HEAD~3 -- package.json` returns nothing (no package.json changes in this plan)

Ready for Wave 3 (Plan 13-04 Daytrade rename + add `source:` to all 6 MDX frontmatters — unblocks Zod + `pnpm sync:check` going GREEN, and feeds Plans 05/06/07 case-study authoring).
