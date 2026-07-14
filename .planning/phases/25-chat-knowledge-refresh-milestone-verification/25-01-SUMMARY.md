---
phase: 25-chat-knowledge-refresh-milestone-verification
plan: 01
subsystem: testing
tags: [chat, prompt-injection, voice-split, vitest, tests-first, portfolio-context, security-snapshot]

# Dependency graph
requires:
  - phase: 24-positioning-shift-home-teaser
    provides: education.ts SSoT (EDUCATION/CREDENTIALS), new-grad/full-time positioning, about-chat.ts P3
  - phase: 23-projects-reconciliation-featured-tier
    provides: multi-chain-evm project (#7) synced site-side; chat-side D-15 exclusion left dormant
  - phase: 21-experience-content-pipeline-collection
    provides: experience collection + Holloway/Balfour entries feeding the future chat experience array
provides:
  - Retargeted Wave-0 tests-first contract for the Phase 25 chat corpus (4 test/fixture files)
  - Machine-verifiable definition of "7 projects + structured experience array + SSoT education + additive D-08 skills"
  - Byte-intact <security>-block snapshot that permits EXACTLY the #7-ban-sentence removal
  - REFUSAL_RESPONSE_BANNED_REGEXES rename (response-scoped, not corpus-global)
affects: [25-02-copy, 25-03-build-script, 25-04-capstone-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tests-first Wave-0 gate: author RED assertions that define the target before the build/copy change lands (mirrors 22-01)"
    - "SSoT-relationship assertion: compare generated object against imported source exports, not hard-pinned literals (defeats a hard-coded build script)"
    - "Byte-intact normalized snapshot to bound a sensitive security edit to exactly one sentence"

key-files:
  created: []
  modified:
    - tests/build/chat-context-integrity.test.ts
    - tests/build/chat-knowledge-voice.test.ts
    - tests/api/prompt-injection.test.ts
    - tests/fixtures/chat-eval-dataset.ts

key-decisions:
  - "Imported education.ts extension-less (../../src/data/education) matching repo convention (education-module.test.ts) instead of the plan's literal .ts, to avoid a TS 'import path cannot end with .ts' error under the later astro-check gate; same SSoT-import intent"
  - "Chose 'a secured local control plane with a SPA and WebSocket feed' (## Summary, 2nd-to-last paragraph) as the distinctive late-source anchor proving #7's extendedReference is untruncated end-to-end; no apostrophe/backtick to avoid substring-match fragility"

patterns-established:
  - "Pattern: RED-until-later-wave assertions are enumerated exactly in the SUMMARY so the regen plan has a precise green target"

requirements-completed: []  # CHAT-10/CHAT-11 are only PARTIALLY advanced here (contract authored, RED); they complete when 25-02/25-03 turn the suite green.

coverage:
  - id: D1
    description: "chat-context-integrity retargeted to 7 slugs + SSoT education + experience array + full-#7-untruncated + additive D-08 skills (RED-by-design)"
    requirement: CHAT-10
    verification:
      - kind: unit
        ref: "tests/build/chat-context-integrity.test.ts (6 RED-by-design / 6 GREEN)"
        status: fail
    human_judgment: false
    rationale: ""
  - id: D2
    description: "chat-knowledge-voice walks all four experience fields + I/My-lead guard + Balfour interned/coordinated B1 samples (RED-by-design)"
    requirement: CHAT-10
    verification:
      - kind: unit
        ref: "tests/build/chat-knowledge-voice.test.ts (3 RED-by-design / 38 GREEN)"
        status: fail
    human_judgment: false
    rationale: ""
  - id: D3
    description: "prompt-injection asserts #7 ban absent + byte-intact <security> snapshot + count 7 + full-time anchor + Multi-Chain EVM groundedQA; fixture regex renamed REFUSAL_RESPONSE_BANNED_REGEXES (RED-by-design)"
    requirement: CHAT-11
    verification:
      - kind: unit
        ref: "tests/api/prompt-injection.test.ts (5 RED-by-design / 33 GREEN)"
        status: fail
    human_judgment: false
    rationale: ""

# Metrics
duration: 12min
completed: 2026-07-14
status: complete
---

# Phase 25 Plan 01: Chat Test Retarget (Wave-0 Tests-First Gate) Summary

**Retargeted the four chat-side test/fixture files to define the Phase 25 corpus target (7 projects, structured experience array, SSoT education, additive D-08 skills, #7 ban lifted) as 14 RED-by-design assertions plus a byte-intact `<security>`-block snapshot, all GREEN once 25-02/25-03 land.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-14T18:39Z
- **Completed:** 2026-07-14T18:51Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- **chat-context-integrity** now targets 7 slugs (adds `multi-chain-evm`), removes the `PROJECTS_7_REGEXES` const + the no-#7-leak test (D-04 exclusion lifted), and adds four new machine-checks: SSoT-education (imports `EDUCATION`/`CREDENTIALS`), reverse-chron experience-array (Holloway-first, Balfour present), full-#7-untruncated ingestion (late-source tail anchor + `truncated === false`), and additive D-08 skills presence (Deno/TanStack Query/Vitest/Ethers.js).
- **chat-knowledge-voice** leak test now asserts `Array.isArray(ctx.experience)` and walks ALL FOUR serialized fields (role/company/dateRange/summary), adds a `/^\s*(I|My|We|Our)\b/` never-begins-first-person guard, and adds two Balfour B1 counterexamples (`I interned…`, `I coordinated…`) that force 25-03 to extend the regex. The `FIRST_PERSON_LEAK` literal was left byte-identical (25-03 owns the triplicated extension).
- **prompt-injection** inverts the #7 test to assert the ban directive is ABSENT (scoped regex, no whole-prompt `MULTI-DEX` false-match), adds a normalized `<security>`-block byte-intact snapshot proving the sensitive edit is EXACTLY the one #7-ban sentence (diff-confirmed sole delta), bumps `projectPages.size` to 7, and renames the fixture regex export to `REFUSAL_RESPONSE_BANNED_REGEXES`.
- **chat-eval-dataset** updated the "current" anchors to `["looking for","full-time"]`, added a `Multi-Chain EVM trader` groundedQA entry (CHAT-11 positive coverage), renamed `GLOBAL_BANNED_REGEXES` → `REFUSAL_RESPONSE_BANNED_REGEXES` with corrected response-scoped comments, and refreshed the cosmetic voiceSpotChecks gold line.

## Task Commits

Each task was committed atomically:

1. **Task 1: Retarget chat-context-integrity (7 slugs, drop #7-leak block, add education + experience + #7 + skills)** — `678cbef` (test)
2. **Task 2: chat-knowledge-voice — walk all 4 experience fields, add Balfour B1 counterexamples, guard I/My leads** — `b357b3a` (test)
3. **Task 3: prompt-injection + eval-dataset — #7 ban absent, `<security>` snapshot, count 7, positioning anchors, fixture rename** — `9389878` (test)

## Files Created/Modified
- `tests/build/chat-context-integrity.test.ts` — 7 slugs; deleted `PROJECTS_7_REGEXES` + no-#7-leak test; added SSoT-education / experience-array / full-#7-untruncated / skills-presence tests
- `tests/build/chat-knowledge-voice.test.ts` — 4-field array walk + never-begins-I/My guard; two RED Balfour B1 KNOWN_LEAKS samples
- `tests/api/prompt-injection.test.ts` — #7-ban-absent + `<security>` byte-intact snapshot + count-7 + regex import/use-site rename
- `tests/fixtures/chat-eval-dataset.ts` — full-time anchors + Multi-Chain EVM groundedQA + `REFUSAL_RESPONSE_BANNED_REGEXES` rename + comment corrections

## RED-until-25-02/25-03 set (precise green target for the regen)

**Total: 14 RED-by-design / 77 GREEN across the three suites** (context-integrity 6/6, voice 3/38, prompt-injection 5/33).

**tests/build/chat-context-integrity.test.ts (6 RED):**
1. `contains the 7 expected project slugs` — corpus still ships 6 (25-03 regen)
2. `projects[] has exactly 7 entries` — 25-03 regen
3. `education is wired to src/data/education.ts SSoT` — corpus ships stale 3-field `{degree,school,graduation:"2026"}` (25-03 `parseEducation`)
4. `experience is a reverse-chron structured array` — `experience` is currently a string (25-03 experience reader)
5. `Projects/7 (multi-chain-evm) is ingested fully untruncated` — #7 absent (25-03 lifts exclusion)
6. `corpus skills include the four additive D-08 skills` — static.json lacks Deno/TanStack Query/Vitest/Ethers.js (25-02 adds + 25-03 regen)
GREEN (6): caseStudy, extendedReference.content, token floor, D-08 static keys, D-08 generated keys, Daytrade truncation.

**tests/build/chat-knowledge-voice.test.ts (3 RED):**
1. `regex catches: "I interned in project management"` — regex lacks `interned` (25-03 extends `FIRST_PERSON_LEAK` byte-identically across all three sites)
2. `regex catches: "I coordinated deliverables"` — regex lacks `coordinated` (25-03)
3. `no first-person leak in about.{...} or any experience field` — `Array.isArray(ctx.experience)` false (string today; 25-03 emits array)
GREEN (38): full existing B1 self-test allowlist + SAFE negative control + about.intro third-person + per-project caseStudy leak sweep.

**tests/api/prompt-injection.test.ts (5 RED):**
1. `the #7 topic-ban directive is ABSENT` — ban still present (25-02 removes the sentence)
2. `<security> block permits EXACTLY the #7-ban-sentence removal` — #7 sentence present; the failing diff confirmed the SOLE delta between golden and actual is `Never discuss "MULTI-DEX CRYPTO TRADER"…those are out of scope.` (all dashes/tiers/anchors byte-match) — flips GREEN once 25-02 makes that exact one-sentence edit
3. `knowledge block carries grounded-QA anchors for: What does Jack do currently?` — needs `full-time` in ABOUT_CHAT_P3 (25-02)
4. `knowledge block carries grounded-QA anchors for: Tell me about the Multi-Chain EVM trader` — needs `Multi-Chain EVM` in corpus (25-03)
5. `exactly 7 generated-context projects` — `projectPages.size` still 6 (25-03)
GREEN (33): all 10 injection vectors, tiered-refusal copy, attack-pattern list, third-person framing, length/breadcrumb rules, all drift-guards, section-tag banlist, cardinality — the rename is name-only.

## Decisions Made
- **education.ts import extension:** Used `../../src/data/education` (no `.ts`) to match the established repo convention (`tests/content/education-module.test.ts`, `24-PATTERNS.md`) and avoid a TS "import path cannot end with a '.ts' extension" error under the later `astro check` gate. Same SSoT-import intent as the plan's `.ts` spelling.
- **#7 late-source anchor:** Picked `a secured local control plane with a SPA and WebSocket feed` (verbatim, `## Summary` 2nd-to-last paragraph of `Projects/7 - MULTI-DEX CRYPTO TRADER.md`, line 426) — distinctive, near the tail, and free of apostrophes/backticks so the `.toContain` substring match stays robust.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] education.ts import spelled extension-less instead of `.ts`**
- **Found during:** Task 1 (chat-context-integrity education-wiring test)
- **Issue:** The plan literally specified `import { EDUCATION, CREDENTIALS } from "../../src/data/education.ts";`. A `.ts` import extension raises a TypeScript error under the repo's `moduleResolution` and would break the phase-25 `astro check` gate (25-04); the existing repo convention (`education-module.test.ts`) imports extension-less.
- **Fix:** Imported from `"../../src/data/education"` (no extension), preserving the SSoT-import intent and acceptance criterion ("imports EDUCATION/CREDENTIALS from src/data/education").
- **Files modified:** tests/build/chat-context-integrity.test.ts
- **Verification:** File parses and runs under vitest (6 RED / 6 GREEN); no TS extension error.
- **Committed in:** `678cbef` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Reworded fixture rename comment to satisfy the literal grep-0 acceptance criterion**
- **Found during:** Task 3 (chat-eval-dataset rename)
- **Issue:** The acceptance/verification criterion is `grep -c "GLOBAL_BANNED_REGEXES" tests/fixtures/chat-eval-dataset.ts == 0`. My initial rename comment ("Renamed from GLOBAL_BANNED_REGEXES…") left the literal token in a comment, making the count 1.
- **Fix:** Reworded to "Renamed from the old \"global banned regexes\" export" so the literal token count is truly 0 while preserving the rename rationale.
- **Files modified:** tests/fixtures/chat-eval-dataset.ts
- **Verification:** `grep -c "GLOBAL_BANNED_REGEXES" tests/fixtures/chat-eval-dataset.ts` == 0; repo-wide grep finds no live references.
- **Committed in:** `9389878` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing-critical/criterion-compliance)
**Impact on plan:** Both preserve plan intent exactly; no scope creep. The extension-less import protects the downstream astro-check gate.

## Issues Encountered
None — the three suites parse and run; every failure is an intended RED-by-design assertion. The `<security>`-block snapshot diff was inspected to confirm byte-identity (the sole delta is the #7-ban sentence), guaranteeing 25-02's one-sentence edit turns it GREEN.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- 25-02 (copy) must: add Deno/TanStack Query/Vitest/Ethers.js to `portfolio-context.static.json` skills; rewrite `about-chat.ts` P3 to lock `looking for` + `full-time`; remove the `Never discuss "MULTI-DEX CRYPTO TRADER"…` sentence from `system-prompt.ts` (keeping the preceding `Never pivot to projects…` sentence) — the `<security>` snapshot bounds this to exactly one sentence.
- 25-03 (build-script) must: lift the `multi-chain-evm` exclusion (7 projects, `truncated:false`); emit `experience` as a reverse-chron `{role,company,dateRange,summary}` array (Holloway first); read education from `education.ts` (`graduation`/`transferredFrom`/`certifications`); extend `FIRST_PERSON_LEAK` with `interned`/`coordinated` byte-identically across `build-chat-context.mjs`, `chat-knowledge-voice.test.ts`, and `chat-voice-split.test.ts`.
- No production/source file was touched this plan (test + fixture only — D-14 allows).

## Self-Check: PASSED

All four modified files + SUMMARY.md exist on disk; all three task commits (`678cbef`, `b357b3a`, `9389878`) present in git history.

---
*Phase: 25-chat-knowledge-refresh-milestone-verification*
*Completed: 2026-07-14*
