---
phase: 25-chat-knowledge-refresh-milestone-verification
plan: 00
subsystem: testing
tags: [invariant-baseline, sha256, node-builtins, dep-lock, chat-surface, D-14]

# Dependency graph
requires:
  - phase: 24-positioning-shift-home-teaser
    provides: verify-phase24-invariants.mjs / 24-BASELINE.json pattern (phase-start hashed fingerprint + dep-free verifier)
provides:
  - scripts/verify-phase25-invariants.mjs — dep-free Node verifier (verify + --record modes) over the four D-14 gated chat-surface files + package.json dependencies
  - 25-BASELINE.json — phase-start SHA-256 fingerprint (4 gated-file hashes + 11 normalized dependencies) that 25-04 runs its capstone drift proof against
affects: [25-04, chat-knowledge-refresh, milestone-verification, QA-01, QA-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phase-start hashed invariant baseline + dep-free capstone verifier (mirrors Phase 24), narrowed to the four untouchable chat-surface files so chat-knowledge sources edited this phase are not false-flagged"

key-files:
  created:
    - scripts/verify-phase25-invariants.mjs
    - .planning/phases/25-chat-knowledge-refresh-milestone-verification/25-BASELINE.json
  modified: []

key-decisions:
  - "PROTECTED_FILES narrowed to EXACTLY the four D-14 gated files (BaseLayout.astro, global.css, chat.ts, api/chat.ts); deliberately excludes about-chat.ts / portfolio-context*.json / build-chat-context.mjs which Phase 25 legitimately edits — including them would false-fail the 25-04 capstone"
  - "Baseline captured as the phase's FIRST plan (Wave 1, plan 00, worktrees off => plan-number serialization runs it before mutating plans); regardless, the protected set is never mutated by any Phase-25 plan, so the captured bytes equal the phase-start bytes"
  - "normDeps sorts dependency keys before stringify so a benign reorder does not false-fail; QA-02 detects ADDED deps, not key order (same rationale as verify-phase24-invariants.mjs)"

patterns-established:
  - "Committed hashed baseline > working-tree git diff: a file committed-then-reverted in an earlier task looks clean in the final tree but its committed drift is still caught by the phase-start fingerprint"

requirements-completed: [QA-01, QA-02]

coverage:
  - id: D1
    description: "verify-phase25-invariants.mjs authored dep-free with PROTECTED_FILES = exactly the four D-14 gated files (excludes build-chat-context.mjs / about-chat.ts / portfolio-context JSONs); exports verifyInvariants/recordBaseline/PROTECTED_FILES/sha256File/currentDependencies"
    requirement: "QA-02"
    verification:
      - kind: automated
        ref: "node -e import('./scripts/verify-phase25-invariants.mjs') — PROTECTED_FILES equality + exports + grep -c 'from \"node:' == 4, no non-node import"
        status: pass
    human_judgment: false
  - id: D2
    description: "25-BASELINE.json recorded with 4 gated-file SHA-256 hashes + 11 normalized dependencies; verifier exits 0 immediately after --record against the clean phase-start tree"
    requirement: "QA-01"
    verification:
      - kind: automated
        ref: "node scripts/verify-phase25-invariants.mjs --record && node scripts/verify-phase25-invariants.mjs (exit 0)"
        status: pass
    human_judgment: false

# Metrics
duration: 3min
completed: 2026-07-14
status: complete
---

# Phase 25 Plan 00: Invariant Baseline Summary

**Phase-start SHA-256 fingerprint of the four D-14 gated chat-surface files + package.json dependencies, plus a dep-free Node verifier (verify + --record) that 25-04 runs as the authoritative phase-wide untouched proof.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-07-14T18:36:02Z
- **Completed:** 2026-07-14T18:39:00Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- Authored `scripts/verify-phase25-invariants.mjs` using Node built-ins only (node:fs, node:crypto, node:path, node:url) — zero new dependencies (QA-02). `PROTECTED_FILES` is EXACTLY the four D-14 gated files and deliberately excludes the chat-knowledge sources Phase 25 edits.
- Added a `recordBaseline()` (via `--record`) alongside `verifyInvariants()`, so the same script both captures and later checks the fingerprint.
- Recorded `25-BASELINE.json` capturing the four gated-file SHA-256 hashes + the 11-entry normalized dependencies object from the clean phase-start tree.
- Confirmed the verifier exits 0 immediately after `--record` (fresh baseline matches current tree), proving the capstone anchor is valid.

## Captured Baseline

**Four D-14 gated-file SHA-256 hashes:**

| File | SHA-256 |
|------|---------|
| src/layouts/BaseLayout.astro | 38973d84a7ad0780981df5630b6d9396dec36ea67293c3806bb74c980169c020 |
| src/styles/global.css | d923fdc85e5cd893bd5a72b407651121f07781e472d23818d9e55a7ef46ad33e |
| src/scripts/chat.ts | d4b7b2a1c89b89b1d7281b3a4111c58bfa41677c2673e2b107fb3b809a04c87f |
| src/pages/api/chat.ts | 6b59a02b0b60701dda53ae0953be311bc4702be55e7cf2091df63ab8dff7dd6f |

**Dependencies captured:** 11 (byte-identical to package.json `dependencies` — @anthropic-ai/sdk, @astrojs/cloudflare, @astrojs/mdx, @astrojs/sitemap, @tailwindcss/vite, astro, astro-seo, dompurify, marked, tailwindcss, zod).

The protected set is never mutated by any Phase-25 plan, so these bytes equal the phase-start bytes regardless of wave ordering. The baseline is committed so 25-04's capstone hash comparison catches drift COMMITTED in any task of 25-01..25-03, not only uncommitted working-tree edits.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author scripts/verify-phase25-invariants.mjs** - `d523de5` (feat)
2. **Task 2: Record + commit the Phase-25 baseline; sanity-verify exit 0** - `df8d6e6` (feat)

_Plan metadata commit follows this SUMMARY._

## Files Created/Modified
- `scripts/verify-phase25-invariants.mjs` - Dep-free Node verifier; `PROTECTED_FILES` = four gated files; `sha256File`, `currentDependencies`, `normDeps`, `recordBaseline`, `verifyInvariants` exports; CLI `--record` writes baseline / default verifies and exits 1 on drift.
- `.planning/phases/25-chat-knowledge-refresh-milestone-verification/25-BASELINE.json` - `{ protected_file_hashes: {4 files}, dependencies: {11} }` phase-start fingerprint.

## Decisions Made
- Narrowed `PROTECTED_FILES` to the four gated files only (not the Phase-24 eight). The chat-knowledge sources (about-chat.ts, portfolio-context*.json, build-chat-context.mjs) are legitimately edited this phase; protecting them would false-fail the capstone. This narrower set is the entire point of D-14 discipline for Phase 25.
- Retained `normDeps` key-sorting so a benign dependency reorder does not false-fail — QA-02 detects ADDED deps, not key order.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None.

## Threat Flags
None - this plan only adds a verification script + baseline JSON; no new runtime surface, endpoints, auth paths, or schema changes.

## Next Phase Readiness
- 25-04 can import/run `scripts/verify-phase25-invariants.mjs` as the phase-wide D-14 untouched proof and the QA-02 no-new-dep lock.
- No gated file, package.json, or src/ runtime file was touched by this plan (verified: git diff over both commits touches only the new script + baseline JSON).

## Self-Check: PASSED

- scripts/verify-phase25-invariants.mjs — FOUND
- 25-BASELINE.json — FOUND
- 25-00-SUMMARY.md — FOUND
- Commit d523de5 — FOUND
- Commit df8d6e6 — FOUND

---
*Phase: 25-chat-knowledge-refresh-milestone-verification*
*Completed: 2026-07-14*
