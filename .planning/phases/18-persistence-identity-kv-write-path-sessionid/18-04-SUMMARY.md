---
phase: 18-persistence-identity-kv-write-path-sessionid
plan: 04
subsystem: api
tags: [tdd, forward-defense, test-03, d-16, ident-02, anthropic-prompt-cache, source-text-guard]

# Dependency graph
requires:
  - phase: 18
    plan: 01
    provides: "D-16 contract locked in 18-CONTEXT.md (sessionId NEVER threads into Anthropic cacheable surface; HTTP envelope DOES carry sessionId; validateRequest accepts it); 18-PATTERNS.md § tests/api/anthropic-payload-shape.test.ts MODIFY (lines 790-862) with exact assertion code"
  - phase: 18
    plan: 03
    provides: "src/lib/validation.ts RequestSchema sessionId: z.uuidv4().optional() — ValidatedRequest.sessionId is string|undefined at the call site; Test (a) consumes withSid.data.messages + withoutSid.data.messages; Test (c) consumes result.data.sessionId"
provides:
  - "tests/api/anthropic-payload-shape.test.ts extended with new describe block 'D-16: sessionId-on-envelope path (Plan 18-04 extension — TEST-03 hardening)' containing 3 new forward-defense tests"
  - "Forward-defense surface for Plan 18-05 wiring: if api/chat.ts accidentally threads sessionId into buildChatRequestArgs's parameters or system template, Test (b) source-text guard FAILS at Plan 18-05 commit time"
  - "Byte-equality predicate at the test level: any future regression that smuggles sessionId into the cacheable surface (literal substring, UUIDv4 pattern, template-string interpolation, synthetic substitution) breaks Test (a)"
  - "Operational anchor for Plan 18-08 TEST-03 LIVE UAT: static + live verification together close the D-15 cache-miss-blocks-close gate"
affects: [18-05-api-chat-waituntil-wiring, 18-07-forward-defense-and-meta02, 18-08-uat-and-test03-live]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Source-text guard via readFileSync + regex on function signature — catches template-string concatenation leaks that pattern-grep against UUIDv4 regex would miss (RESEARCH § Pitfall 3)"
    - "Byte-equality across two validateRequest paths (sessionId-bearing vs no-sessionId) — locks the Anthropic prompt-cache hit predicate at the test level (system + messages[0] byte-identical regardless of envelope shape)"
    - "Test-only TDD plan pattern — forward-defense for a contract whose source already satisfies it; RED phase is degenerate (tests immediately GREEN), so a single test() commit suffices per the executor TDD contract's 'commit only if changes' clause"

key-files:
  created: []
  modified:
    - "tests/api/anthropic-payload-shape.test.ts"

key-decisions:
  - "Existing 5 forward-defense tests (Plan 17-05 commit 19471fe) preserved BYTE-IDENTICAL — verified via awk-extracted describe block diff against baseline. Only additions are at the END of the file (new describe block) + 3 import lines at the top."
  - "Plan 18-04 is purely additive — Task 1 ADDS 3 tests to the file; Task 2 is verification-only (no commit). Single test() commit per the executor's 'commit only if changes' TDD clause (no separate RED→GREEN cycle because the source code already satisfied the assertions before this plan ran)."
  - "Test (b) is the strictest source-text guard in the project — asserts `expect(src).not.toMatch(/sessionId/)` against chat-request-shape.ts. Per threat T-18-04-02 (accept), strictness IS the feature: any future plan that needs to reference sessionId in this file must update Test (b) deliberately rather than silently regress."

requirements-completed: []
requirements-progressed:
  - "TEST-03 (cross-phase gate) — STATIC half closed (forward-defense test suite extended with sessionId-on-envelope assertions); LIVE half (3× POST UAT + wrangler tail for cache_read_input_tokens > 0) remains open for Plan 18-08. Requirement stays [~] in REQUIREMENTS.md until 18-08 closes the LIVE half per D-14/D-15."
  - "IDENT-02 — already marked complete by Plan 18-03 (commit 4fa17d1, schema layer). Plan 18-04 ADDS a forward-defense surface guaranteeing IDENT-02's 'sessionId NEVER threads into Anthropic message payload' invariant at the test-suite level — but does not re-complete the requirement."

# Metrics
duration: 4min
completed: 2026-05-11
---

# Phase 18 Plan 04: Anthropic Payload Forward-Defense Summary

**`tests/api/anthropic-payload-shape.test.ts` extended with 3 D-16 forward-defense assertions — TEST-03 cache-integrity contract now covers the sessionId-on-envelope path; existing 5 Plan 17-05 tests preserved byte-identical; 8/8 GREEN; full suite 445/0/2 (+3); D-26 + astro check clean.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-11T19:55:13Z
- **Completed:** 2026-05-11T19:58:32Z
- **Tasks:** 2 / 2 completed (Task 1 test extension committed; Task 2 verification-only — no commit)
- **Files modified:** 1 modified (`tests/api/anthropic-payload-shape.test.ts`, +66 lines / -0 lines); zero source / config / sibling-test edits

## Accomplishments

- **D-16 sessionId-on-envelope contract locked at the test surface** — Three new forward-defense assertions added under `describe("D-16: sessionId-on-envelope path (Plan 18-04 extension — TEST-03 hardening)")`. Closes the regression class that the legacy 5 tests miss (template-string concatenation smuggling sessionId into the system block).
- **Test (a): byte-equality of system + messages[0] across sessionId-bearing vs no-sessionId calls** — Builds two `ValidatedRequest` objects via `validateRequest` (one with `sessionId: VALID_SID`, one without), passes each `result.data.messages` to `buildChatRequestArgs(portfolioContext, messages)`, asserts `JSON.stringify(argsWithSid.system) === JSON.stringify(argsWithoutSid.system)` AND same for `messages[0]`. This is the cache-hit predicate evaluated at the test level. Any future leak (literal substring, UUIDv4 pattern, synthetic ID, template-string interpolation) breaks the assertion.
- **Test (b): source-text guard — buildChatRequestArgs signature + body has zero sessionId references** — Reads `src/prompts/chat-request-shape.ts` via `readFileSync + join(process.cwd(), ...)`, asserts (1) `export function buildChatRequestArgs(` matches, (2) the parameter list extracted via `/buildChatRequestArgs\s*\(([^)]*)\)/` does NOT contain `"sessionId"`, (3) the ENTIRE source file does NOT match `/sessionId/`. The third guard catches template-string interpolations like `` `session ${sid}` `` that pattern-grep against literal `"sessionId"` would miss but that would still break the Anthropic cache.
- **Test (c): validateRequest accepts a request body with sessionId on the envelope** — Wires Plan 18-03's `RequestSchema` extension into the cache-integrity test file (an additional surface beyond the dedicated `tests/api/chat-session-id.test.ts`). Asserts `result.success === true` AND `result.data.sessionId === VALID_SID`. If a future revision strips `.optional()` from the schema or swaps `z.uuidv4()` for `z.uuid()`, Test (c) fails here in addition to Plan 18-03's dedicated suite.
- **Forward-defense surface ready for Plan 18-05 wiring** — When Plan 18-05 author wires `ctx.waitUntil(appendTurn(env.CHAT_KV, sessionId, "user", ...))` in `src/pages/api/chat.ts`, any accidental thread of sessionId into `buildChatRequestArgs(ctx, messages)` (e.g., adding a third param, mutating the messages array to embed sessionId, or concatenating sessionId into the system template) will FAIL Test (a) or Test (b) AT Plan 18-05's commit time — before any LIVE Anthropic call.
- **Operational anchor preserved for Plan 18-08 TEST-03 UAT** — Plan 18-04 closes the STATIC half of the D-15 cache-miss-blocks-close gate. The LIVE half (3× identical POST against `*.workers.dev` preview + production, `wrangler tail` for `cache_read_input_tokens > 0` on calls 2 and 3) remains a manual UAT step in Plan 18-08. Static + live both required per CONTEXT.md "Specifics" + D-14 + D-15.

## Task Commits

Each task committed atomically per executor protocol's per-task commit rule:

1. **Task 1: tests/api/anthropic-payload-shape.test.ts +3 D-16 forward-defense assertions** — `44fa02c` (test)
2. **Task 2: Plan-end gate — D-26 chat regression battery + astro check + 5-file cluster (verify-only — no commit)** — verification-only, no files modified

**Plan metadata commit:** lands as the final commit after this SUMMARY (per executor protocol's `<final_commit>` step) — includes this SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md updates.

## Files Created/Modified

- `tests/api/anthropic-payload-shape.test.ts` — **MODIFIED** (+66 lines, -0 lines). Three additions: (1) three import lines after the existing `vitest` import — `readFileSync` from `node:fs`, `join` from `node:path`, `validateRequest` from `../../src/lib/validation`; (2) one new top-level describe block at the end of the file titled `"D-16: sessionId-on-envelope path (Plan 18-04 extension — TEST-03 hardening)"` containing exactly 3 `it()` blocks. The file-header docblock (lines 1-19) and the existing `describe("TEST-03: Anthropic payload shape — no per-session fields in cacheable surface")` block (lines 31-69 in the baseline) are preserved BYTE-IDENTICAL — verified via `awk`-extracted block diff against `git show 19471fe:tests/api/anthropic-payload-shape.test.ts`.

## Decisions Made

### D-FD-01: Single test() commit covers the entire plan — RED→GREEN sequence is degenerate for a forward-defense test-only plan

**Decision:** Plan 18-04 lands as a single `test(18-04): ...` commit (`44fa02c`) rather than the canonical `test(...): RED` → `feat(...): GREEN` two-commit TDD cycle.

**Rationale:** The three new tests assert state that the source code already satisfies before this plan ran. `src/prompts/chat-request-shape.ts` has zero `sessionId` references (verified by direct file read in the Task 1 read_first step). `src/lib/validation.ts` already accepts `sessionId: z.uuidv4().optional()` (delivered by Plan 18-03 commit `4fa17d1`). So the three new tests immediately go GREEN at the test() commit — there is no implementation gap to close with a feat() commit. Per the executor TDD contract's REFACTOR clause ("Commit only if changes"), the same logic applies to GREEN: a forward-defense plan that locks an already-satisfied contract has no GREEN-phase code change to commit. The PLAN.md frontmatter `type: tdd` + `tdd="true"` on Task 1 is satisfied by the test commit itself — RED→GREEN is encoded as "test asserts a contract; contract was already true; commit lands tests as new regression guard."

**Rejected alternatives:** Two-commit sequence with a no-op feat() commit (creates a misleading "implementation" commit with zero source changes — confuses future bisect / blame), inline `git revert` dance to manufacture a RED state and then re-introduce the GREEN state (manufactured failure / theater — doesn't reflect actual development history), skip the `tdd="true"` declaration entirely (would weaken the plan's typed contract — the tests ARE TDD-style by structure, just RED-phase-degenerate).

### D-FD-02: Test (b) over-strict regex `/sessionId/` against full source is the feature, not a bug

**Decision:** Test (b) asserts `expect(src).not.toMatch(/sessionId/)` against the ENTIRE contents of `src/prompts/chat-request-shape.ts` — not just the function signature, not just the function body, the whole file including comments.

**Rationale:** The threat model (T-18-04-02) explicitly accepts that this is over-broad — a future plan that needs to reference sessionId in a comment (e.g., "this function intentionally does NOT receive sessionId because TEST-03") would also fail. That is the design: strictness IS the defense. If a future plan needs to reference sessionId in this file, the test update is a deliberate, traceable revision rather than a silent regression. The cost of over-strict (occasional explicit test update with citation) is dramatically smaller than the cost of under-strict (silent regression of the Anthropic cache hit rate, +10x latency and token spend invisible at the application layer).

**Rejected alternatives:** Regex-grep only against the function signature line (misses template-string interpolations in the function body), regex-grep against `args.system` or `args.messages[0]` runtime payload (already covered by Test (a) byte-equality), allow comments to reference sessionId (weakens the source-text guard — a future contributor could "document" the addition of sessionId in a comment as a stepping-stone to adding it to the code).

### D-FD-03: Hard-coded UUIDv4 fixture `8b0f7f1c-1234-4567-8901-abcdef012345`

**Decision:** The constant `VALID_SID = "8b0f7f1c-1234-4567-8901-abcdef012345"` is hard-coded at the top of the new describe block. Matches the same UUIDv4 fixture format used by Plan 18-03's `tests/api/chat-session-id.test.ts` (also `8b0f7f1c-1234-4567-8901-abcdef012345`).

**Rationale:** Per CONTEXT.md "Claude's Discretion" — sessionId fixtures carry no information beyond UUIDv4 shape; hard-coded is fine. Using the same fixture across Plan 18-03 + 18-04 makes the test suite searchable for the constant (`grep -r 8b0f7f1c .planning .test`) and aligns the cache-integrity test file's fixture with the schema test file's fixture.

**Rejected alternatives:** `crypto.randomUUID()` per test (introduces test flakiness if a future contributor sees `randomUUID` and "improves" it to a deterministic seeded RNG; sessionIds in fixtures should be opaque constants), separate fixture per test in the new describe (duplication without benefit — all three new tests use the same value).

## Deviations from Plan

None — plan executed exactly as written.

The PLAN.md `<tasks>` block specified Task 1's `<action>` with verbatim code (lines 137-193). Outcome: code authored matches the plan's specification character-for-character with two micro-edits within the latitude of the plan's "Open the file. Read the current contents top to bottom" instruction: (1) the three new imports were inserted IMMEDIATELY after the existing `vitest` import (rather than mixed into a single line) for readability; (2) the new describe block was placed at the END of the file, immediately after the closing `});` of the existing TEST-03 describe (per the plan's "Add a new top-level describe block at the bottom of the file"). Both edits are explicitly within the plan's described shape.

No auto-fixes (Rules 1-3) triggered. No architectural questions (Rule 4) needed. No authentication gates (this is a pure test extension). No deferred items.

**Total deviations:** 0
**Impact on plan:** None — plan landed verbatim per PLAN.md `<tasks>` block.

## TDD Gate Compliance

Plan type: `tdd` (per PLAN.md frontmatter line 4). Task 1 has `tdd="true"`. Per the executor TDD contract's "commit only if changes" clause applied to the GREEN phase:

1. **RED phase:** Degenerate — the source code already satisfies the assertions before the test() commit lands. No RED-phase failing tests exist because there is no implementation gap to close.
2. **Test phase (commit landed):** `44fa02c — test(18-04): tests/api/anthropic-payload-shape.test.ts +3 D-16 forward-defense assertions — TEST-03 hardening for Plan 18-05 wiring` — 8/8 GREEN immediately (5 legacy + 3 new).
3. **GREEN phase:** No commit — the contract was already true; no source change needed.
4. **REFACTOR phase:** No commit — additive test extension; no cleanup opportunity.

**TDD compliance interpretation:** Per the executor contract, "GREEN: Read `<implementation>`, write minimal code to pass, run (MUST pass), commit" — for a forward-defense plan whose contract is already satisfied, the minimal code is ZERO and no commit is needed. The TDD pattern is honored at the structural level (tests authored first as a regression guard against a future leak) even though the temporal RED→GREEN sequence collapses.

**SUMMARY warning:** The PLAN.md's frontmatter type:tdd combined with the single-test-commit shape may surface as a TDD gate trip in automated post-execution checks if the checker enforces strict RED→GREEN→REFACTOR commit sequencing. The decision rationale above (D-FD-01) is the explicit annotation per the executor's "If RED or GREEN gate commits are missing, add a warning to SUMMARY.md under a `## TDD Gate Compliance` section."

## Issues Encountered

None.

## Verification Results

### Task 1 automated verify

```bash
pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts
# → Test Files 1 passed (1); Tests 8 passed (8)
#   — 5 legacy forward-defense tests + 3 new D-16 forward-defense tests; all GREEN

node -e "/* 8 checks: D-16 describe text, readFileSync import, join import,
         validateRequest import, buildChatRequestArgs() call, system byte-equality
         pattern, sessionId-not-contained pattern, ≥8 it() blocks */"
# → All 8 source checks PASS
```

### Byte-identical preservation of Plan 17-05 baseline

```bash
git show 19471fe:tests/api/anthropic-payload-shape.test.ts > /tmp/baseline.test.ts

# Extract file-header docblock (TEST-03 / * ... / */) — both files
awk '/^ \* TEST-03/,/^ \*\//' /tmp/baseline.test.ts > /tmp/baseline-header.txt
awk '/^ \* TEST-03/,/^ \*\//' tests/api/anthropic-payload-shape.test.ts > /tmp/current-header.txt
diff /tmp/baseline-header.txt /tmp/current-header.txt
# → no output (byte-identical)

# Extract TEST-03 describe block — both files
awk '/^describe\("TEST-03/,/^}\);$/' /tmp/baseline.test.ts > /tmp/baseline-block.txt
awk '/^describe\("TEST-03/,/^}\);$/' tests/api/anthropic-payload-shape.test.ts > /tmp/current-block.txt
diff /tmp/baseline-block.txt /tmp/current-block.txt
# → no output (byte-identical) — existing 5 tests preserved verbatim
```

### Task 2 plan-end gates

```bash
pnpm test
# → Test Files 53 passed | 1 skipped (54); Tests 445 passed | 2 skipped (447)
# → +3 from Plan 18-04 over Plan 18-03 close (442 → 445)

pnpm exec astro check
# → 0 errors / 0 warnings / 0 hints (UNCHANGED from Plan 18-03 close)

pnpm exec vitest run \
  tests/api/anthropic-payload-shape.test.ts \
  tests/api/sse-snapshot.test.ts \
  tests/api/cache-hit-logs.test.ts \
  tests/api/validation.test.ts \
  tests/api/chat-session-id.test.ts
# → Test Files 5 passed (5); Tests 36 passed (36)
# → anthropic-payload (8) + sse-snapshot (1) + cache-hit-logs (2) + validation (15) + chat-session-id (7) → 33 expected, vitest reports 36 (3 additional sub-cases)
```

### Plan-end scope check

```bash
git status --short
# → M tests/api/anthropic-payload-shape.test.ts (only modified file)
# → ?? .bg-shell/, .claude/, .ship-safe/, LOGS.txt, Projects/  (untracked, pre-existing, out-of-scope)

git diff --exit-code src/ wrangler.jsonc tests/api/sse-snapshot.test.ts tests/api/validation.test.ts tests/api/cache-hit-logs.test.ts tests/api/chat-transcripts.test.ts tests/api/chat-session-id.test.ts
# → exit 0 — Plan 18-04 did NOT touch any other source/test/config file

git diff --stat tests/api/anthropic-payload-shape.test.ts
# → tests/api/anthropic-payload-shape.test.ts | 66 +++++++++++++++++++++++++++++++
# → 1 file changed, 66 insertions(+), 0 deletions
# → purely additive — no existing lines removed or modified
```

## Test Count Delta

| Snapshot | Plan close → Plan close | Tests | Diff |
|----------|-------------------------|-------|------|
| Plan 18-01 close (planning-doc-only) | 419 PASS / 0 FAIL / 2 SKIP | 419 | — |
| Plan 18-02 close (chat-transcripts module) | 435 PASS / 0 FAIL / 2 SKIP | 435 | +16 |
| Plan 18-03 close (validation schema sessionId) | 442 PASS / 0 FAIL / 2 SKIP | 442 | +7 |
| **Plan 18-04 close (this plan)** | **445 PASS / 0 FAIL / 2 SKIP** | **445** | **+3** |

Plan 18-04 contributes exactly 3 new tests — matches the new D-16 describe block test count (one per `it()` block). Test count breakdown in `tests/api/anthropic-payload-shape.test.ts`: **5 legacy + 3 new D-16 = 8 total GREEN**.

## Astro Check Status

`pnpm exec astro check` exits 0/0/0 — UNCHANGED from Plan 18-03 close. The test extension is additive with three new imports from already-installed packages (`node:fs`, `node:path`, `src/lib/validation`); no type changes, no new TS surfaces, no `.astro` template touches.

## D-26 Chat-Surface Focused Gate Status

The plan adds only test code — no source-file edits — so D-26 chat regression coverage is preserved by construction. The focused 5-file cluster gate from Task 2 (anthropic-payload + sse-snapshot + cache-hit-logs + validation + chat-session-id = 36/36 GREEN) is the BLOCKING anchor for TEST-03 + D-16 + IDENT-02 + D-15. All five files GREEN.

## Threat Flags

None — Plan 18-04 introduces no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. Test (b)'s `readFileSync` is a build-time guard against regression, not a runtime trust boundary touch (per the `<threat_model>` § Trust Boundaries table — "test → source (read-only) ... No runtime trust boundary affected").

## Anchors for downstream plans

- **Plan 18-05 (api/chat.ts ctx.waitUntil wiring):** Plan 18-04's Test (a) byte-equality assertion and Test (b) source-text guard are the forward-defense surface that catches the most likely regression in Plan 18-05 — accidental threading of sessionId into `buildChatRequestArgs(context, messages)` parameters or template strings. The plan author of 18-05 will write `if (sessionId && ctx) ctx.waitUntil(appendTurn(env.CHAT_KV, sessionId, "user", ...))` and MUST NOT touch `buildChatRequestArgs(context, messages)` to pass sessionId. If they do, Plan 18-04's Test (a) breaks (byte-equality fails) or Test (b) breaks (sessionId appears in chat-request-shape.ts source).
- **Plan 18-07 (forward-defense extension + META-02):** Plan 18-07 may add additional source-text guards (e.g., a `tests/build/append-turn-call-site.test.ts` asserting `ctx.waitUntil(appendTurn` appears at specific anchors in api/chat.ts per the D-10/D-11 wiring rules). Plan 18-04 establishes the source-text-guard pattern at the test-suite level (`readFileSync + join + regex`); 18-07 reuses the pattern.
- **Plan 18-08 (UAT + TEST-03 LIVE):** Plan 18-04 is the STATIC half of TEST-03 hardening; Plan 18-08 is the LIVE half (3× identical POST UAT against `*.workers.dev` preview + production, `wrangler tail` for `cache_read_input_tokens > 0` on responses 2 and 3 per D-14). The static (this plan) + live (18-08) layers together close the D-15 cache-miss-blocks-close gate per CONTEXT.md "Specifics".

## User Setup Required

None.

## Next Plan Readiness

- **Plan 18-05 (api/chat.ts waitUntil wiring)** — unblocked. Forward-defense for the cacheable Anthropic surface is locked at the test level. Plan 18-05 author can wire `ctx.waitUntil(appendTurn(...))` with confidence that any accidental threading of sessionId into `buildChatRequestArgs` will be caught at commit time.
- **Plan 18-06 (client sessionId mint)** — unblocked. (Plan 18-04 doesn't affect 18-06's path; both are downstream of 18-03's schema landing.)
- **Plan 18-07 (forward-defense + META-02)** — unblocked. The source-text-guard pattern (`readFileSync + join + regex`) is established.
- **Plan 18-08 (UAT + TEST-03 LIVE)** — unblocked. Plan 18-04 closes the STATIC half of TEST-03 hardening; 18-08 closes the LIVE half.

No blockers carry forward.

## Self-Check: PASSED

- File `tests/api/anthropic-payload-shape.test.ts` — FOUND (modified; `D-16: sessionId-on-envelope path` describe block present at line 71-145; 3 new `it()` blocks)
- File `src/prompts/chat-request-shape.ts` — FOUND (unchanged; zero sessionId references confirmed by Test (b))
- File `src/lib/validation.ts` — FOUND (unchanged; `sessionId: z.uuidv4().optional()` from Plan 18-03 still in place — confirmed by Test (c))
- Commit `44fa02c` (Task 1 test extension) — FOUND in `git log --oneline -5`
- 445/0/2 full suite — VERIFIED via `pnpm test`
- 0/0/0 astro check — VERIFIED via `pnpm exec astro check`
- 5-file cluster (TEST-03 + D-15 + D-16 + IDENT-02) 36/36 GREEN — VERIFIED
- Scope honored: `git diff --exit-code src/ wrangler.jsonc tests/api/sse-snapshot.test.ts tests/api/validation.test.ts tests/api/cache-hit-logs.test.ts tests/api/chat-transcripts.test.ts tests/api/chat-session-id.test.ts` exits 0
- Existing 5 forward-defense tests byte-identical to Plan 17-05 commit 19471fe baseline — VERIFIED via awk-extracted describe block diff

---
*Phase: 18-persistence-identity-kv-write-path-sessionid*
*Completed: 2026-05-11*
