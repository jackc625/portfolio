---
phase: 17-foundations-migration-dns-debt-sweep
plan: 04
subsystem: docs-ci
tags: [docs, ci, tech-debt, debt-01, debt-03, phase-17]

# Dependency graph
requires:
  - phase: 17-03
    provides: DEBT-04 + DEBT-05 chat-surface tech debt CLOSED — PROJECT.md "Known issues" block can shed those 2 bullets in DEBT-01 reframe. Plan 17-04 closes the docs/CI half of the v1.3 chat tech-debt sweep per CONTEXT.md D-09 step 4.
  - milestone: v1.3 milestone-shape lock 2026-05-09
    provides: Locked decision that CHAT_RATE_LIMITER binding upgrade (Workers Paid plan) is v1.4+ scope — Phase 17 closure for DEBT-01 is documentation-only, not infra. STATE.md Open Blockers + REQUIREMENTS.md DEBT-01 row already named "documented + Free-tier acceptable" as the closure path.
provides:
  - PROJECT.md "Known issues / tech debt" entry rewritten to reflect locked v1.3 decision — CHAT_RATE_LIMITER documented + Free-tier acceptable; Workers Paid v1.4+ trigger path; code path defensively skips when binding absent (byte-identical from Phase 7).
  - 4 Phase-17-closed DEBT bullets removed from the Known issues block: cache-hit observability (closed by Plan 17-05), build:chat-context:check CI (closed by Task 2 below), WR-01 listener dedup (closed by Plan 17-03), #chat-panel JS-coupled display (closed by Plan 17-03). Block heading retitled "Known issues / tech debt:" (dropped "carried into v1.3" qualifier).
  - STATE.md Open Blockers CHAT_RATE_LIMITER bullet marked CLOSED with same framing.
  - tests/build/project-md-debt-01.test.ts — 6 source-text assertions on PROJECT.md (Free-tier acceptable wording present, carry-forward gap framing absent within 600 chars of CHAT_RATE_LIMITER, Workers Paid / v1.4 upgrade-path reference present, renamed heading without v1.3 qualifier, 4 Phase-17-closed DEBT bullets absent from the Known issues block).
  - .github/workflows/sync-check.yml — new step "Verify portfolio-context.json is in sync with sources" runs `pnpm build:chat-context:check` after the existing `pnpm sync:check` step. Single-job two-step pattern (saves ~30s on cold runs vs separate parallel job by reusing checkout + pnpm install). PRs fail-fast on local drift between Projects/*.md / src/data/about.ts / src/data/portfolio-context.static.json and the generated portfolio-context.json.
  - Expanded pull_request path triggers covering ALL sources that affect portfolio-context.json: Projects/**, src/content/projects/**, src/data/about.ts (NEW), src/data/portfolio-context.static.json (NEW), src/data/portfolio-context.json (NEW — the generated artifact itself), scripts/sync-projects.mjs, scripts/build-chat-context.mjs (NEW).
affects: [17-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Build-time source-text anti-regression test on canonical decision-bearing docs: readFileSync(.planning/PROJECT.md) + slice 600-char window around an anchor token (CHAT_RATE_LIMITER) + assert presence/absence of locked-decision wording. Mirrors the pattern used at tests/build/no-imperative-display-flip.test.ts (Plan 17-03) for chat.ts source-text invariants. Cheap to write; catches future doc edits that accidentally revert the framing."
    - "Single-job two-step CI workflow pattern: when a new check is cheap (~5s on warm node_modules cache) and shares the same checkout + pnpm install prerequisites, append it as a sequential step on the existing job rather than splitting into a parallel job. Saves the second `actions/checkout@v4` + `pnpm install --frozen-lockfile` cycle (~30s cold-run cost). Per RESEARCH §\"DEBT-03 CI Job Shape\" recommendation."
    - "Path-trigger surface expansion for generated artifacts: when a CI check verifies that a generated artifact is in sync with its sources, the path triggers MUST include BOTH the source files AND the generated artifact itself. A PR that only modifies the generated file (e.g., manually edited) would otherwise slip past the trigger — adding the generated path ensures the check runs on any drift, in either direction."

key-files:
  created:
    - tests/build/project-md-debt-01.test.ts
  modified:
    - .planning/PROJECT.md
    - .planning/STATE.md
    - .github/workflows/sync-check.yml

key-decisions:
  - "Updated the v1.3 milestone Target features bullet at PROJECT.md:85 in addition to the Known issues block at lines 115-122. The first occurrence of CHAT_RATE_LIMITER in the file is in the Target features section ('Chat tech debt sweep (all 5 carry-forwards)'). The test's `src.indexOf(\"CHAT_RATE_LIMITER\") + slice 600` searches from that first occurrence and requires the Workers Paid / v1.4 reference to be present within the window. Added 'documented + Free-tier acceptable; Workers Paid v1.4+ upgrade path' inline next to the CHAT_RATE_LIMITER mention in the milestone description — this is the most truthful and minimally-invasive doc edit (matches the locked decision wording without inventing a new framing)."
  - "STATE.md Open Blockers section kept structurally intact per plan guidance ('Phase 17 isn't fully closed until all 6 plans land; only fix the CHAT_RATE_LIMITER framing'). The CHAT_RATE_LIMITER bullet got strike-through + CLOSED marker matching the pattern Plan 17-03 used for DEBT-04 + DEBT-05 bullets. The remaining 2 active bullets (cache-hit observability, build:chat-context:check CI) stay as-is — they will get the same strike-through treatment in their respective close-out plans (17-05 and the metadata commit below for build:chat-context:check)."
  - "RETROSPECTIVE.md audit returned zero hits for CHAT_RATE_LIMITER — no audit edit needed (acceptable per Plan 17-04 'Claude's Discretion' clause)."
  - "Single-job two-step pattern adopted for sync-check.yml per RESEARCH §\"DEBT-03 CI Job Shape\" — the existing `pnpm sync:check` step and the new `pnpm build:chat-context:check` step run sequentially in the same `check` job. Second step only runs if first passes (failure surfaced via job-level GitHub Actions failure indicator). Saves the second `actions/checkout@v4` + `pnpm install --frozen-lockfile` cycle (~30s cold-run cost) vs splitting into separate parallel jobs."
  - "Path-trigger surface expanded to 7 paths (from 3): added src/data/about.ts, src/data/portfolio-context.static.json, src/data/portfolio-context.json, scripts/build-chat-context.mjs. The generated portfolio-context.json IS in the trigger list — a PR that manually edited the generated file without rerunning the build script would otherwise slip past the gate; including the generated path ensures the check runs on any drift, in either direction."

patterns-established:
  - "Build-time source-text test on canonical decision-bearing docs — when a milestone-shape lock changes the wording of a doc (e.g., Free-tier acceptable vs carry-forward gap), add a test that asserts the locked-decision wording is present and the stale wording is absent. Cheap to write; future doc edits that accidentally revert the framing will fail at the test seam. This is the third application of the source-text anti-regression pattern in Phase 17 (after tests/build/no-imperative-display-flip.test.ts and tests/api/chat.test.ts:259-289 for prompt-cache integrity)."
  - "Single-job two-step CI workflow expansion — when a new check is cheap and shares prerequisites with an existing check, append it as a sequential step rather than splitting into a parallel job. Saves cold-run time and reduces YAML duplication. Reserve parallel-job splitting for checks that genuinely don't share prerequisites or that need different runner shapes."
  - "Path-trigger surface for generated-artifact drift checks — include BOTH the source files AND the generated artifact in the trigger paths. A PR that modifies only the generated file slips past source-only triggers; including the generated path catches drift in either direction."

requirements-completed: [DEBT-01, DEBT-03]

# Metrics
duration: ~4min (Task 1 commit 18:43 EDT → Task 2 commit 18:43 EDT)
completed: 2026-05-10
---

# Phase 17 Plan 04: DEBT-01 + DEBT-03 Docs/CI Tech Debt Sweep Summary

**Both DEBT-01 (PROJECT.md "Known issues" entry reframe — CHAT_RATE_LIMITER documented + Free-tier acceptable per v1.3 milestone-shape lock 2026-05-09) and DEBT-03 (build:chat-context:check parallel step in .github/workflows/sync-check.yml — PRs now fail-fast on local drift between Projects/*.md / src/data/about.ts / src/data/portfolio-context.static.json and the generated portfolio-context.json) closed in 2 atomic commits. Plan touches NO chat-surface files — D-26 cadence informational rather than blocking here. Full vitest suite went from 370 → 376 tests (+6 additive: the 6 new tests in tests/build/project-md-debt-01.test.ts). The single pre-existing `tests/content/roadmap-amendment.test.ts` failure carried forward from 17-01's deferred-items.md remained the only red test post-plan, unchanged in nature.**

## Performance

- **Implementation duration:** ~4 min (Task 1 commit 2026-05-10T22:43:?? → Task 2 commit 2026-05-10T22:43:??)
- **Started:** 2026-05-10T22:43Z (Task 1 commit `65c2749`)
- **Closed out:** 2026-05-10 (this metadata commit)
- **Tasks:** 2 autonomous code commits (no checkpoints — TDD pattern executed cleanly on Task 1; Task 2 was a direct CI workflow edit with verified local exit-0 from `pnpm build:chat-context:check`)
- **Files created:** 1 (tests/build/project-md-debt-01.test.ts)
- **Files modified:** 3 (.planning/PROJECT.md, .planning/STATE.md, .github/workflows/sync-check.yml)

## Accomplishments

- **DEBT-01 (PROJECT.md "Known issues" entry reframe):** Rewrote the Known issues block at PROJECT.md:115-122 from "carry-forward gap" framing to "documented + Free-tier acceptable" per v1.3 milestone-shape lock 2026-05-09. The CHAT_RATE_LIMITER bullet now reads: "Cloudflare binding documented + Free-tier acceptable (per v1.3 milestone-shape lock 2026-05-09). Code path defensively skips when binding absent — byte-identical from Phase 7. Workers Paid plan upgrade is v1.4+ trigger; reconsider if Anthropic spend or chat volume crosses thresholds that justify $60/yr." Block heading retitled "Known issues / tech debt:" (dropped "carried into v1.3" qualifier — those items are closing in this phase). 4 Phase-17-closed DEBT bullets removed: cache-hit observability (closing in Plan 17-05), build:chat-context:check CI (closed by Task 2 below), WR-01 listener dedup (closed by Plan 17-03), #chat-panel JS-coupled display (closed by Plan 17-03). Lighthouse Performance ≥99 localhost bullet retained — it's not a v1.3 chat-tech-debt item; it's a separate accepted carry-forward from Phase 16 per the Phase 15 §9 production-on-Cloudflare-edge canonical-gate precedent.
- **DEBT-01 milestone-features list updated in lockstep:** PROJECT.md:85 "Chat tech debt sweep (all 5 carry-forwards)" bullet got the inline qualifier "(documented + Free-tier acceptable; Workers Paid v1.4+ upgrade path)" appended to CHAT_RATE_LIMITER. This satisfies the build-time test's Workers Paid / v1.4 regex within the 600-char window starting at the first CHAT_RATE_LIMITER mention (which is in the Target features section, not the Known issues block).
- **DEBT-01 STATE.md audit:** STATE.md:94 Open Blockers CHAT_RATE_LIMITER bullet got strike-through + **CLOSED 2026-05-10 in Plan 17-04** marker, matching the pattern Plan 17-03 used for DEBT-04 + DEBT-05 bullets. Remaining 2 active bullets (cache-hit observability, build:chat-context:check CI) stay as-is — they get the same treatment in their respective close-out plans (17-05 and the metadata commit below for build:chat-context:check).
- **DEBT-01 RETROSPECTIVE.md audit:** `grep -n CHAT_RATE_LIMITER .planning/RETROSPECTIVE.md` returned zero hits — no edit needed (acceptable per Plan 17-04 "Claude's Discretion" clause).
- **DEBT-01 build-time test:** `tests/build/project-md-debt-01.test.ts` (6 tests, all GREEN) asserts the locked-decision wording is present, the stale framing is absent within the 600-char window around CHAT_RATE_LIMITER, Workers Paid / v1.4 upgrade path is referenced, the renamed heading is in place, and the 4 Phase-17-closed DEBT bullets are absent from the Known issues block. The reframed CHAT_RATE_LIMITER bullet IS still allowed in the Known issues list — it's not closed by code, just reframed. The CHAT_RATE_LIMITER bullet stays as the canonical "documented" entry per locked decision.
- **DEBT-03 sync-check.yml expansion:** Added "Verify portfolio-context.json is in sync with sources" step running `pnpm build:chat-context:check` after the existing `pnpm sync:check` step. Single-job two-step pattern per RESEARCH §"DEBT-03 CI Job Shape" (saves ~30s on cold runs vs separate parallel job by reusing checkout + pnpm install). Path triggers expanded from 3 paths to 7 paths to cover ALL sources that affect portfolio-context.json plus the generated artifact itself.
- **DEBT-03 local verification:** `pnpm build:chat-context:check` exits 0 cleanly on the current tree ("src/data/portfolio-context.json: unchanged"). End-to-end CI gate verification (induce drift → PR fails) deferred to a future PR — manually verifiable; not Phase 17 scope to test the test.
- **TEST-01 (D-26 chat regression battery):** Per plan acceptance criteria, this plan touches NO chat surface (`BaseLayout.astro` / `global.css` / `chat.ts` / `api/chat.ts` / `validation.ts` all unchanged). D-26 cadence per CONTEXT.md D-10 is informational rather than blocking. Full vitest suite 375/376 GREEN — the single pre-existing failure is `tests/content/roadmap-amendment.test.ts`, documented in `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md` and unrelated to the chat surface or this plan.

## Task Commits

Each task was committed atomically per the plan's `<done>` blocks:

1. **Task 1: DEBT-01 — Rewrite PROJECT.md Known issues entry + audit STATE.md + add build-time test** — `65c2749` (docs)
   - Commit message: `docs(17-04): DEBT-01 — reframe CHAT_RATE_LIMITER as Free-tier acceptable`
   - Files: `.planning/PROJECT.md` (+3/-7), `.planning/STATE.md` (+1/-1), `tests/build/project-md-debt-01.test.ts` (+63, new)
   - State at commit: 6/6 new tests GREEN; full suite 375 PASS / 1 FAIL (1 pre-existing roadmap-amendment failure).
2. **Task 2: DEBT-03 — Add build:chat-context:check step to sync-check.yml** — `e46aa2d` (ci)
   - Commit message: `ci(17-04): DEBT-03 — enforce build:chat-context:check on PRs (sync-check.yml)`
   - Files: `.github/workflows/sync-check.yml` (+7/-0)
   - State at commit: `pnpm build:chat-context:check` exits 0 locally; full suite 375 PASS / 1 FAIL (same pre-existing roadmap-amendment failure).

**Plan metadata commit:** *(this commit — SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md)*

## Files Created/Modified

| Path | Status | Purpose |
|------|--------|---------|
| `.planning/PROJECT.md` | modified (+3/-7) | Two edits: (1) line 85 Target features — append "documented + Free-tier acceptable; Workers Paid v1.4+ upgrade path" qualifier inline next to CHAT_RATE_LIMITER, satisfying the build-time test's Workers Paid/v1.4 regex within the 600-char window. (2) lines 115-122 Known issues block — retitle from "Known issues / tech debt carried into v1.3:" to "Known issues / tech debt:"; reframe CHAT_RATE_LIMITER bullet to "documented + Free-tier acceptable" with Workers Paid v1.4+ upgrade path; remove 4 Phase-17-closed bullets (cache-hit obs, build:chat-context:check CI, WR-01 dedup, #chat-panel JS-coupled display); retain Lighthouse Performance ≥99 localhost bullet (not a v1.3 chat-tech-debt item). |
| `.planning/STATE.md` | modified (+1/-1) | Open Blockers section line 94 — strike-through CHAT_RATE_LIMITER bullet + **CLOSED 2026-05-10 in Plan 17-04** marker with the same "documented + Free-tier acceptable" framing. Pattern matches Plan 17-03's DEBT-04 + DEBT-05 close-out lines. Remaining 2 active bullets (cache-hit observability, build:chat-context:check CI) untouched — those close in their respective plans. |
| `tests/build/project-md-debt-01.test.ts` | created (+63) | DEBT-01 build-time source-text assertions on PROJECT.md (6 tests, all GREEN): contains CHAT_RATE_LIMITER (entry exists), contains "Free-tier acceptable" (locked decision wording), does NOT retain "carry-forward gap" framing within 600 chars of CHAT_RATE_LIMITER, references Workers Paid / v1.4 upgrade path within the same window, uses the renamed heading "Known issues / tech debt:" without "carried into v1.3" qualifier, does NOT list 4 Phase-17-closed DEBT items in the Known issues block. Pattern mirrors tests/build/no-imperative-display-flip.test.ts (Plan 17-03) for chat.ts source-text invariants. |
| `.github/workflows/sync-check.yml` | modified (+7/-0) | Two edits: (1) expand pull_request `paths:` from 3 entries to 7 — add `src/data/about.ts`, `src/data/portfolio-context.static.json`, `src/data/portfolio-context.json`, `scripts/build-chat-context.mjs` (the generated artifact itself IS in the trigger list — a PR that manually edited the generated file slips past source-only triggers; including the generated path catches drift in either direction). (2) Add "Verify portfolio-context.json is in sync with sources" step running `pnpm build:chat-context:check` after the existing `pnpm sync:check` step. Single-job two-step pattern per RESEARCH §"DEBT-03 CI Job Shape" — saves ~30s on cold runs vs separate parallel job. |

## Decisions Made

- **Updated the v1.3 milestone Target features bullet at PROJECT.md:85 in addition to the Known issues block at lines 115-122.** The first occurrence of CHAT_RATE_LIMITER in the file is in the Target features section ('Chat tech debt sweep (all 5 carry-forwards)'). The test's `src.indexOf("CHAT_RATE_LIMITER") + slice 600` searches from that first occurrence and requires the Workers Paid / v1.4 reference to be present within the window. Added 'documented + Free-tier acceptable; Workers Paid v1.4+ upgrade path' inline next to the CHAT_RATE_LIMITER mention in the milestone description — this is the most truthful and minimally-invasive doc edit (matches the locked decision wording without inventing a new framing). The plan-spec'd action focused on lines 115-122 but the test's semantics required updating the FIRST CHAT_RATE_LIMITER occurrence too. Logged as a minor execution refinement: future plan-authoring should note "test searches from first occurrence" or constrain the test to a specific section anchor.
- **STATE.md Open Blockers section kept structurally intact per plan guidance** ('Phase 17 isn't fully closed until all 6 plans land; only fix the CHAT_RATE_LIMITER framing'). The CHAT_RATE_LIMITER bullet got strike-through + CLOSED marker matching the pattern Plan 17-03 used for DEBT-04 + DEBT-05 bullets. The remaining 2 active bullets (cache-hit observability, build:chat-context:check CI) stay as-is — they will get the same strike-through treatment in their respective close-out plans (17-05 and the metadata commit below for build:chat-context:check).
- **RETROSPECTIVE.md audit returned zero hits for CHAT_RATE_LIMITER** — no audit edit needed (acceptable per Plan 17-04 "Claude's Discretion" clause).
- **Single-job two-step pattern adopted for sync-check.yml** per RESEARCH §"DEBT-03 CI Job Shape" — the existing `pnpm sync:check` step and the new `pnpm build:chat-context:check` step run sequentially in the same `check` job. Second step only runs if first passes (failure surfaced via job-level GitHub Actions failure indicator). Saves the second `actions/checkout@v4` + `pnpm install --frozen-lockfile` cycle (~30s cold-run cost) vs splitting into separate parallel jobs.
- **Path-trigger surface expanded to 7 paths (from 3): added src/data/about.ts, src/data/portfolio-context.static.json, src/data/portfolio-context.json, scripts/build-chat-context.mjs.** The generated portfolio-context.json IS in the trigger list — a PR that manually edited the generated file without rerunning the build script would otherwise slip past the gate; including the generated path ensures the check runs on any drift, in either direction.
- **End-to-end CI gate verification (induce drift → PR fails) deferred to a future PR.** Manually verifiable on a test branch later by editing Projects/*.md without running `pnpm build:chat-context` and confirming the PR fails. Not Phase 17 scope to test the test.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test surface gap] Updated PROJECT.md:85 (Target features section) in addition to the lines 115-122 Known issues block**

- **Found during:** Task 1 GREEN-phase verification (post first `pnpm test tests/build/project-md-debt-01.test.ts` run after the Known issues block edit)
- **Issue:** After rewriting the Known issues block at lines 115-122, 5/6 tests passed but the "references Workers Paid v1.4+ as upgrade path" test failed. The test does `src.indexOf("CHAT_RATE_LIMITER")` then slices the next 600 chars and asserts the slice contains Workers Paid or v1.4. But the FIRST CHAT_RATE_LIMITER occurrence in PROJECT.md is at line 85 in the Target features section ("Chat tech debt sweep (all 5 carry-forwards): CHAT_RATE_LIMITER binding, ..."), NOT the Known issues block. The 600-char window from line 85 did not contain Workers Paid or v1.4.
- **Why it matters:** The plan-spec'd action focused on lines 115-122 but the test's semantics required updating the FIRST CHAT_RATE_LIMITER occurrence too. Leaving the Target features section unchanged would have failed the test at commit time. Rule 1 applies: a test assertion that the implementation does not satisfy is a bug in the implementation (or the test's anchor); updating the implementation to satisfy the test is the cheapest fix.
- **Fix:** Appended "(documented + Free-tier acceptable; Workers Paid v1.4+ upgrade path)" inline next to the CHAT_RATE_LIMITER mention in the milestone Target features bullet at PROJECT.md:85. This is the most truthful and minimally-invasive doc edit — it matches the locked decision wording without inventing a new framing, and keeps the rest of the milestone description's "all 5 carry-forwards" structure intact.
- **Files modified:** `.planning/PROJECT.md` (+1 token inline append on line 85, in addition to the lines 115-122 edits).
- **Verification:** `pnpm test tests/build/project-md-debt-01.test.ts` GREEN post-edit (6/6); full suite 375 PASS / 1 FAIL (pre-existing).
- **Committed in:** `65c2749` (Task 1 commit — bundled with the DEBT-01 doc rewrite since the Target features update is part of the same atomic DEBT-01 closure).

---

**Total deviations:** 1 auto-fixed (Rule 1 — Target features bullet update at PROJECT.md:85 to satisfy the test's slice-from-first-occurrence semantics). Plus the 1 pre-existing deferred `roadmap-amendment.test.ts` failure carried forward from 17-01's deferred-items.md (unchanged in nature; NOT caused by Plan 17-04).

**Impact on plan:** The deviation was a minor execution refinement, not scope creep — the Target features bullet legitimately needed the same "Free-tier acceptable" framing for internal consistency with the Known issues block. Future plan-authoring note: when a build-time test searches for a token via `indexOf` and slices a window from the FIRST occurrence, the plan's action steps must enumerate ALL occurrence sites that need to fall within the slice, not just the canonical site. Alternatively, the test could anchor on a stricter pattern (e.g., search for CHAT_RATE_LIMITER specifically within the Known issues block) — but the broader test is cheaper to maintain and catches more potential staleness.

## Test Count Delta

- **Before Plan 17-04:** 370 tests (post-Plan 17-03 commit `2b31994`).
- **After Plan 17-04:** 376 tests (post-this metadata commit).
- **Net delta:** +6 tests (additive — the 6 new tests in `tests/build/project-md-debt-01.test.ts`).
  - 6 source-text assertions on PROJECT.md: CHAT_RATE_LIMITER present, Free-tier acceptable wording present, carry-forward gap framing absent within 600 chars of CHAT_RATE_LIMITER, Workers Paid / v1.4 upgrade path referenced within same window, renamed heading "Known issues / tech debt:" without "carried into v1.3", 4 Phase-17-closed DEBT bullets absent from Known issues block.

**Pre-existing failure carried forward:** `tests/content/roadmap-amendment.test.ts` (1/1 RED), documented in `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md`. Unrelated to chat-surface or to Plan 17-04 scope; carried forward from 17-01. Full suite is 375/376 GREEN at plan close.

## D-26 Chat Regression Battery

Plan 17-04 touches NO chat-surface files (`BaseLayout.astro` / `global.css` / `chat.ts` / `api/chat.ts` / `validation.ts` all unchanged). D-26 cadence per CONTEXT.md D-10 is **informational** rather than blocking. Per the plan's `<success_criteria>`: TEST-01 cross-phase gate continues **holding** at phase point — chat-surface battery state is structurally unchanged from Plan 17-03 close (145/145 GREEN). The remaining Phase 17 plan (17-05 — observability with DEBT-02) WILL touch the chat surface and will re-validate the gate at its phase-end.

| Checkpoint | Battery State | Notes |
|------------|---------------|-------|
| Pre-Task 1 | 145/145 GREEN | Baseline at HEAD of Plan 17-03 close-out (`2b31994`). No chat-surface mutation in this plan. |
| Post-Task 1 (`65c2749`) | 145/145 GREEN | No chat-surface mutation — only `.planning/PROJECT.md`, `.planning/STATE.md`, `tests/build/project-md-debt-01.test.ts` modified. |
| Post-Task 2 (`e46aa2d`) | 145/145 GREEN | No chat-surface mutation — only `.github/workflows/sync-check.yml` modified. |
| Phase-end (post this metadata commit) | 145/145 GREEN expected | Metadata commit touches only `.planning/**` — no chat-surface mutation. |

## Issues Encountered

- **Test anchor breadth caught a doc inconsistency.** The plan's build-time test slices a 600-char window from the FIRST `indexOf("CHAT_RATE_LIMITER")` and asserts Workers Paid / v1.4 is in the window. The first occurrence is in the v1.3 milestone Target features list (line 85), not the Known issues block (lines 115-122). The original plan action focused on the Known issues block alone, but the test would have failed without updating line 85 too. Logged as Deviation §1 — minor execution refinement, not a real issue. Future plan-authoring should either (a) enumerate ALL occurrence sites that need to fall within the slice or (b) anchor the test on a stricter section pattern.
- **Pre-existing roadmap-amendment.test.ts failure remained.** Carried forward from 17-01's deferred-items.md per the carry-forward pattern established in Plan 17-03. Unrelated to Plan 17-04 scope. Final count: 375 PASS / 1 FAIL (pre-existing).

## Threat Flags

*(No new security surface introduced. DEBT-01 is a documentation rewrite; DEBT-03 is a CI workflow expansion. Threat register from Plan 17-04 frontmatter `<threat_model>` is closed in full: T-17-H mitigated by tests/build/project-md-debt-01.test.ts asserting locked-decision wording is present and stale wording is absent; T-17-I mitigated by `pnpm build:chat-context:check` step + expanded path triggers covering ALL source files + the generated artifact; T-17-J + T-17-K accepted as documented per the threat register dispositions.)*

## Self-Check

Verifications performed before recording PASS:

- File `.planning/phases/17-foundations-migration-dns-debt-sweep/17-04-SUMMARY.md` — EXISTS (this file).
- Commit `65c2749` (Task 1 — DEBT-01 PROJECT.md reframe): `git log --oneline --all | grep 65c2749` → FOUND.
- Commit `e46aa2d` (Task 2 — DEBT-03 sync-check.yml expansion): `git log --oneline --all | grep e46aa2d` → FOUND.
- File `tests/build/project-md-debt-01.test.ts` EXISTS (created in Task 1, 63 lines).
- `.planning/PROJECT.md`: contains "Free-tier acceptable"; does NOT contain "carry-forward gap"; contains "Workers Paid" and "v1.4" within 600 chars of first CHAT_RATE_LIMITER occurrence; does NOT contain "carried into v1.3" in any heading; does NOT contain "Chat cache-hit-rate observability not yet wired" / "build:chat-context:check.*not enforced" / "WR-01.*without dedup" / "#chat-panel.*JS-coupled" as Known issues.
- `.planning/STATE.md`: CHAT_RATE_LIMITER Open Blockers bullet has strike-through + **CLOSED 2026-05-10 in Plan 17-04** marker; "documented + Free-tier acceptable" framing present.
- `.github/workflows/sync-check.yml`: contains "Verify portfolio-context.json is in sync with sources" step name; contains `pnpm build:chat-context:check`; path triggers include `src/data/about.ts`, `scripts/build-chat-context.mjs`, `src/data/portfolio-context.json`, `src/data/portfolio-context.static.json`.
- `pnpm build:chat-context:check` exits 0 locally on clean tree ("src/data/portfolio-context.json: unchanged").
- `pnpm test tests/build/project-md-debt-01.test.ts` GREEN (6/6).
- `pnpm test` — 375 PASS / 1 FAIL (the 1 FAIL is pre-existing `tests/content/roadmap-amendment.test.ts`, carried forward from 17-01).

## Self-Check: PASSED

## Next Phase Readiness

- **Plan 17-05 (Wave 4 — Observability: DEBT-02 chat.cache_metrics log seams + TEST-03 Anthropic payload-shape forward-defense) is unblocked.** Plan 17-05 WILL touch chat-surface files (chat.ts, chat-cache.ts, content-snapshot.ts, api/chat.ts) and will re-validate the D-26 117/117+ GREEN gate at its phase-end. Per CONTEXT.md D-09 step 5, this is the last code-change plan in Phase 17 before DNS work (Plan 17-06).
- **Plan 17-06 (Wave 5 — DNS-01 Resend domain records + DNS-02 warmup sends + Postmaster Tools enrollment) remains gated on Plans 17-01 through 17-05 all being all-GREEN.** Per CONTEXT.md D-08, warming sends happen LAST in Phase 17 ordering against an all-GREEN surface so a malformed warmup send isn't debugged simultaneously with chat regressions.
- **DEBT-01 + DEBT-03 closed end-to-end.** The docs/CI tech debt items per CONTEXT.md D-09 step 4 are fully resolved. The remaining tech debt item (DEBT-02) lives in Plan 17-05.
- **TEST-01 cross-phase gate still holding.** D-26 145/145 GREEN at phase point (Plan 17-04 close — chat-surface battery structurally unchanged by this plan); will re-validate at end of Plan 17-05 and again at Phase 17 close.
- **CI gate live on next push to main + every subsequent PR.** This metadata commit will trigger the Sync Drift Check workflow on push to main, which will exercise both `pnpm sync:check` and the new `pnpm build:chat-context:check` step end-to-end for the first time. Subsequent PRs that touch any of the 7 trigger paths will fail-fast on local drift.

---
*Phase: 17-foundations-migration-dns-debt-sweep*
*Plan: 17-04*
*Completed: 2026-05-10*
