---
phase: 24-positioning-shift-home-teaser
plan: 01
subsystem: content
tags: [education, schema.org, json-ld, ssot, vitest, invariant-baseline]

requires:
  - phase: 23-projects-reconciliation
    provides: stable chat-surface + dependency set to fingerprint as the phase-start baseline
provides:
  - src/data/education.ts single source of truth (facts + DERIVED schema.org fragments)
  - Gate D (education-module) GREEN unit gate
  - Gate E (chat-surface-untouched) strengthened D-19 tripwire, GREEN
  - 24-BASELINE.json phase-start invariant fingerprint + scripts/verify-phase24-invariants.mjs
affects: [24-02-home-personSchema, 24-03-about-education-block, 24-04-capstone, phase-25-chat]

tech-stack:
  added: []
  patterns:
    - "Data module SSoT: facts + schema.org fragments DERIVED from those facts (no re-hardcoded literals)"
    - "Phase-scoped invariant baseline: SHA-256 fingerprint of protected files + dependencies, verified by a Node-built-ins-only script at the capstone"

key-files:
  created:
    - src/data/education.ts
    - tests/content/education-module.test.ts
    - tests/build/chat-surface-untouched.test.ts
    - scripts/verify-phase24-invariants.mjs
    - .planning/phases/24-positioning-shift-home-teaser/24-BASELINE.json
  modified: []

key-decisions:
  - "alumniOfSchema + hasCredentialSchema derive from EDUCATION/CREDENTIALS; WGU/VT literals live in exactly one place (review fix, LOW single-source)"
  - "EDUCATION carries schema-only degreeSchemaName + dateISO so fragments derive without expanding abbreviations at read time"
  - "VT appears in alumniOfSchema only, never in hasCredentialSchema (D-10: attended is honest, no VT credential implied)"
  - "Gate E strengthened beyond four SEO anchors to also pin ChatWidget import+render, pageswap .finished?.catch, and three client-script imports (review fix #6)"
  - "Phase-start baseline recorded so 24-04 proves phase-wide D-19/D-17 invariants across committed tasks, not just the working tree (review fix #4)"

patterns-established:
  - "Pattern 1: derived schema.org fragments with unit-asserted derivation linkage"
  - "Pattern 2: Node-built-ins-only SHA-256 invariant verifier consuming a committed baseline JSON"

requirements-completed: [POS-03, POS-04]

coverage:
  - id: D1
    description: "education.ts SSoT: EDUCATION display facts + CREDENTIALS + DERIVED alumniOfSchema/hasCredentialSchema; VT alumniOf only"
    requirement: "POS-03"
    verification:
      - kind: unit
        ref: "tests/content/education-module.test.ts#education.ts display facts + derivation"
        status: pass
    human_judgment: false
  - id: D2
    description: "Zero em dashes in education.ts (D-11 / D-18)"
    requirement: "POS-04"
    verification:
      - kind: other
        ref: "test \"$(grep -c '—' src/data/education.ts)\" -eq 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Gate E strengthened chat-surface tripwire over BaseLayout.astro (11 anchors)"
    requirement: "POS-04"
    verification:
      - kind: unit
        ref: "tests/build/chat-surface-untouched.test.ts#BaseLayout.astro chat surface untouched"
        status: pass
    human_judgment: false
  - id: D4
    description: "Phase-start invariant baseline + verifier (8 protected files + dependencies)"
    requirement: "POS-04"
    verification:
      - kind: other
        ref: "node scripts/verify-phase24-invariants.mjs (exit 0)"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-07-14
status: complete
---

# Phase 24 Plan 01: Positioning Foundation Summary

**src/data/education.ts SSoT (display facts + schema.org fragments DERIVED from them), two GREEN gates (Gate D education-module, strengthened Gate E chat-surface tripwire), and a committed phase-start invariant baseline the 24-04 capstone verifies against.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-14T03:53:10Z
- **Completed:** 2026-07-14T03:57:30Z
- **Tasks:** 2
- **Files modified:** 5 (all created)

## Accomplishments
- `src/data/education.ts` is the single source of truth: EDUCATION display facts + schema-only fields (degreeSchemaName, dateISO), CREDENTIALS, and `alumniOfSchema`/`hasCredentialSchema` DERIVED from those facts so display copy and JSON-LD can never drift. VT is alumniOf only, never a credential (D-10).
- Gate D (`tests/content/education-module.test.ts`) is GREEN (10 assertions) including the derivation-linkage checks that prove the fragments are not independently hardcoded.
- Gate E (`tests/build/chat-surface-untouched.test.ts`) strengthened to 11 anchors: the four SEO anchors PLUS ChatWidget import+render, the pageswap `.finished?.catch` handler, and all three client-script import specifiers.
- Phase-start invariant fingerprint captured: `24-BASELINE.json` (phase_base_sha, 8 protected-file hashes, og_placeholder_hash, verbatim dependencies) + `scripts/verify-phase24-invariants.mjs` (Node built-ins only) that the capstone runs to prove nothing drifted across committed tasks.
- Zero new dependencies; `astro check` stays 0/0/0.

## Task Commits

Each task was committed atomically:

1. **Task 1 (TDD RED): Gate D failing test** - `a06e3f5` (test)
2. **Task 1 (TDD GREEN): education.ts SSoT + derived fragments** - `8647202` (feat)
3. **Task 2: strengthen Gate E + capture invariant baseline** - `2e8012b` (feat)

**Plan metadata:** (docs: complete plan — see final commit)

## Files Created/Modified
- `src/data/education.ts` - SSoT for education facts + DERIVED schema.org fragments (alumniOfSchema, hasCredentialSchema)
- `tests/content/education-module.test.ts` - Gate D: import-and-assert unit gate incl. derivation linkage + D-10
- `tests/build/chat-surface-untouched.test.ts` - Gate E: strengthened D-19 source tripwire over BaseLayout.astro
- `scripts/verify-phase24-invariants.mjs` - Node-built-ins-only SHA-256 verifier; exports ogPlaceholderHash/currentOgHash
- `.planning/phases/24-positioning-shift-home-teaser/24-BASELINE.json` - phase-start invariant fingerprint

## Decisions Made
- Kept the schema-only fields (`degreeSchemaName`, `dateISO`) on the EDUCATION object so the fragments derive from one source without expanding "B.S." at read time.
- `hasCredentialSchema` typed via a `CredentialSchemaEntry` interface so the degree entry and the `CREDENTIALS.map(...)` certificate entries share one shape and stay astro-check clean.
- `phase_base_sha` recorded as the Task-1 commit (baseline generated after Task 1); the protected files themselves are untouched, so their hashes are the true phase-start state that 24-02/24-03 must preserve.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed three em dashes from education.ts doc comments**
- **Found during:** Task 1 (GREEN step)
- **Issue:** The initial `education.ts` doc comments used U+2014 em dashes in three JSDoc lines, tripping the plan's `grep -c '—'` == 0 gate (project-wide zero-em-dash rule extends to data-module copy, not just MDX).
- **Fix:** Rewrote the three comment fragments to use a semicolon / comma / colon instead of an em dash; no code change.
- **Files modified:** src/data/education.ts
- **Verification:** `test "$(grep -c '—' src/data/education.ts)" -eq 0` exits 0; Gate D 10/10; astro check 0/0/0.
- **Committed in:** `8647202` (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary to satisfy the zero-em-dash gate the plan itself mandates. No scope creep.

## Issues Encountered
None beyond the em-dash fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `education.ts` exports (`EDUCATION`, `CREDENTIALS`, `alumniOfSchema`, `hasCredentialSchema`, `Credential`) are ready for 24-02 (Home personSchema) and 24-03 (/about education block).
- `24-BASELINE.json` + `verify-phase24-invariants.mjs` are ready for the 24-04 capstone to prove phase-wide D-19/D-17 + QA-02 invariants.
- No intentionally-RED gate left at this boundary (review fix #1): Gate A is authored in 24-04, Gate B/C in 24-02.

## Self-Check: PASSED

All created files verified present on disk and all three task commits verified in git history.

---
*Phase: 24-positioning-shift-home-teaser*
*Completed: 2026-07-14*
