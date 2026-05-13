---
phase: 18-persistence-identity-kv-write-path-sessionid
plan: 03
subsystem: api
tags: [astro-v6, zod-v4, validation, identity, sessionid, tdd, ident-02, d-04, d-26]

# Dependency graph
requires:
  - phase: 18
    plan: 01
    provides: "IDENT-02 amended with D-04 missing-tolerance branch language in REQUIREMENTS.md (v1.3-B6, 2026-05-11) — exact Zod v4 expression z.uuidv4().optional() locked"
provides:
  - "src/lib/validation.ts RequestSchema extended with sessionId: z.uuidv4().optional() — version-specific (rejects UUIDv5/v6/v7) per IDENT-02 wording"
  - "ValidatedRequest TS type now exposes sessionId?: string field — Plan 18-05 reads result.data.sessionId at the api/chat.ts ctx.waitUntil gating point"
  - "tests/api/chat-session-id.test.ts — 7 schema-level tests forward-defending IDENT-02 + D-04 missing-tolerance + UUIDv4 version-specificity + TS-narrowed type"
  - "D-04 missing-tolerance branch is now testable at the schema layer — server-side branch wiring (api/chat.ts skip-appendTurn-when-absent) lands in Plan 18-05"
affects: [18-04-anthropic-payload-forward-defense, 18-05-api-chat-waituntil-wiring, 18-06-client-sessionid-mint, 18-07-forward-defense-and-meta02, 18-08-uat-and-test03-live]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod v4 version-specific UUID helpers (z.uuidv4 vs z.uuid) — version-specific match for IDENT-02 'UUIDv4 regex' wording; rejects deprecated z.string().uuid() alias of z.uuid()"
    - "Schema-level TDD pattern with hard-coded fixture UUIDs — UUIDv5-shape fixture (8b0f7f1c-1234-5567-8901-abcdef012345) forward-defends z.uuidv4() vs z.uuid() choice"
    - "First 'missing-and-acceptable' validation code path in the project — D-04 explicit test (Test 2) prevents future revisions from silently re-mandating sessionId"

key-files:
  created:
    - "tests/api/chat-session-id.test.ts"
  modified:
    - "src/lib/validation.ts"

key-decisions:
  - "z.uuidv4().optional() chosen — version-specific, locks IDENT-02 'UUIDv4 regex' wording exactly; rejects UUIDv5/v6/v7 by design"
  - "z.uuid() rejected — version-agnostic (RFC 9562/4122), would silently accept UUIDv5/v6/v7"
  - "z.string().uuid() rejected — deprecated v4 alias of z.uuid(), inherits the version-agnostic flaw"
  - "Test count: 7 (target ≥5) — covers all four contract bullets in PLAN.md must_haves.truths plus version-specificity proof + TS-narrowed type guard"
  - "All 7 fixture sessionIds hard-coded as top-of-file constants (VALID_UUIDV4, UUIDV5_SHAPE, MALFORMED_STR) per CONTEXT.md Claude's Discretion + readability convention"

requirements-completed: [IDENT-02]

# Metrics
duration: 4min
completed: 2026-05-11
---

# Phase 18 Plan 03: Validation Schema sessionId Summary

**RequestSchema extended with `sessionId: z.uuidv4().optional()` — IDENT-02 server-side UUIDv4 validation + D-04 missing-tolerance branch landed at schema layer; 7 schema-level tests GREEN; D-26 chat-surface 8-file gate clean; 442/0/2 (+7 from Plan 18-03) full suite carry-forward.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-11T19:44:25Z
- **Completed:** 2026-05-11T19:48:45Z
- **Tasks:** 3 / 3 completed (Task 1 RED, Task 2 GREEN, Task 3 verify-only)
- **Files modified:** 1 modified (`src/lib/validation.ts`) + 1 created (`tests/api/chat-session-id.test.ts`); zero other source / test / config edits

## Accomplishments

- **IDENT-02 server-side validation surface landed** — `RequestSchema` in `src/lib/validation.ts` now accepts `sessionId: z.uuidv4().optional()`. Valid UUIDv4 surfaces verbatim on `result.data.sessionId`; absent sessionId acceptable (D-04 missing-tolerance); malformed string / UUIDv5 / empty string / non-string all rejected with `success: false` + `error: "invalid_request"`.
- **D-04 missing-tolerance branch testable at the schema layer** — Test 2 (`accepts request with sessionId field absent`) explicitly captures the FIRST "missing-and-acceptable" code path in the project per CONTEXT.md "Specifics". Future revisions cannot silently strip the `.optional()` without breaking this test.
- **Version-specificity proven by UUIDv5-shape rejection** — Test 4 uses fixture `8b0f7f1c-1234-5567-8901-abcdef012345` (UUIDv5: `5` in the version nybble position). This test FORWARD-DEFENDS the `z.uuidv4()` choice — if the schema is ever loosened to `z.uuid()` (which accepts v5/v6/v7), Test 4 will FAIL at the source-of-truth.
- **TS-narrowed type contract encoded as runtime assertion** — Test 7 asserts `typeof result.data.sessionId === "string"` (present case) or `=== "undefined"` (absent case). Catches a regression where the schema field becomes `z.unknown()` or `z.union([z.string(), z.null()])`.
- **Plan 18-05 unblocked** — `validateRequest(body).data.sessionId` is now `string | undefined` at the call site in `src/pages/api/chat.ts`. The defensive cast pattern from Plan 18-01's SPIKE-ctx-access-path.md (`(locals as { cfContext?: ... } | undefined)?.cfContext`) combines with this schema field to give Plan 18-05 the exact gating expression: `if (sessionId && ctx) ctx.waitUntil(appendTurn(...))`.
- **Plan 18-06 unblocked** — Client sends `{ sessionId: <uuidv4-or-omit>, messages: [...] }` body shape; server's optional field accepts the omit branch (D-04). Test 2 forward-defends the contract from the server side.
- **Plan 18-04 anchor verified** — IDENT-02 retains the `sessionId NEVER threads into Anthropic message payload` invariant in the inline comment (`sessionId NEVER threads into buildChatRequestArgs / Anthropic payload (TEST-03 anchor)`). Plan 18-04 extends `tests/api/anthropic-payload-shape.test.ts` to assert byte-equality of system block across sessionId-bearing vs no-sessionId calls.

## Task Commits

Each task committed atomically per executor protocol's per-task commit rule:

1. **Task 1: tests/api/chat-session-id.test.ts schema-level suite (RED)** — `ddd764c` (test)
2. **Task 2: src/lib/validation.ts RequestSchema sessionId field (GREEN)** — `4fa17d1` (feat)
3. **Task 3: D-26 chat-surface focused 8-file battery + astro check + pnpm test (verify-only — no commit)** — verification-only, no files modified

**Plan metadata commit:** lands as the final commit after this SUMMARY (per executor protocol's `<final_commit>` step) — includes this SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md updates.

## Files Created/Modified

- `tests/api/chat-session-id.test.ts` — **NEW** (138 lines). 7 schema-level tests under `describe("IDENT-02 — sessionId validation (D-04 missing-tolerant, UUIDv4-specific)")`. Hard-coded fixture sessionIds (`VALID_UUIDV4`, `UUIDV5_SHAPE`, `MALFORMED_STR`) at top-of-file. File-header comment cites IDENT-02, D-04, Plan 18-01 amendment, RESEARCH version-specificity rationale, and the "first missing-and-acceptable code path in the project" framing.
- `src/lib/validation.ts` — **MODIFIED** (+8 lines, -0 lines). Single-field addition to `RequestSchema` (the `messages` line is byte-identical; only the new `sessionId: z.uuidv4().optional()` line + 7-line citation comment block is added). No other line changed. `validateRequest`, `sanitizeMessages`, `isAllowedOrigin`, `MAX_BODY_SIZE`, `MessageSchema`, `UserMessageSchema`, `AssistantMessageSchema`, `ValidatedMessage`, `ValidatedRequest` exports all byte-identical at the source level (the `ValidatedRequest` TS-emitted shape derives from the schema — auto-updates with `sessionId?: string` field).

## Decisions Made

### D-VAL-01: `z.uuidv4().optional()` is the canonical schema expression

**Decision:** `RequestSchema` uses `z.uuidv4().optional()` for the sessionId field. The version-specific helper rejects UUIDv5/v6/v7 by design — matching IDENT-02's "UUIDv4 regex" wording exactly. `.optional()` is the canonical Zod expression for D-04 missing-tolerance (Zod v4 marks the inferred TS type as `string | undefined`).

**Rationale:** Zod 4.3.6 in `package.json:37` supports `z.uuidv4` natively — no version bump needed. The version-specific helper is a 6-character difference from `z.uuid()` but the semantic gap is large: `z.uuid()` accepts UUIDv5/v6/v7 (RFC 9562/4122 version-agnostic). For IDENT-02 — which exists specifically to anchor the sessionId to UUIDv4 entropy (122 bits, per RESEARCH § Security Domain V3) — version-agnostic acceptance would let a future regression silently accept UUIDv1 (time-based, predictable) or UUIDv5 (deterministic from namespace + name) and weaken the entropy guarantee.

**Rejected alternatives:** `z.uuid().optional()` (version-agnostic — Test 4 forward-defends against this), `z.string().uuid().optional()` (deprecated v4 alias of `z.uuid()` — inherits the version-agnostic flaw), `z.union([z.uuidv4(), z.literal(undefined)])` (more verbose; `.optional()` is the canonical Zod idiom and emits the same TS type).

### D-VAL-02: Test 4 (UUIDv5 rejection) is the cap test for version-specificity

**Decision:** The test suite includes a UUIDv5-shaped fixture (`8b0f7f1c-1234-5567-8901-abcdef012345` — `5` in the third group's first hex) and asserts rejection. This is the ONE test that distinguishes `z.uuidv4()` from `z.uuid()` — both accept UUIDv4-shaped strings, but `z.uuid()` would PASS this UUIDv5 string and `z.uuidv4()` rejects it.

**Rationale:** Test 4 forward-defends the version-specific choice at the source-of-truth. Without it, a future revision could swap `z.uuidv4()` for `z.uuid()` and all other tests would still pass — the regression would only surface in operational data (cross-version sessionId collisions, weakened entropy). Per CONTEXT.md "build-time source-text test pattern for source-of-truth invariants", this is the canonical defense shape: one test, one assertion, one regression vector.

**Rejected alternatives:** Only positive UUIDv4 tests (provably insufficient — would pass under `z.uuid()`), regex-grep on source for `uuidv4` literal (already covered by Task 2 source-text verify, but doesn't catch a comment-only swap; runtime test is the stronger guard).

### D-VAL-03: Test 2 (absent sessionId) explicitly captures the FIRST "missing-and-acceptable" code path

**Decision:** Test 2 (`accepts request with sessionId field absent — D-04 missing-tolerance branch`) is decorated with an inline comment block that names this as "the FIRST 'missing-and-acceptable' code path in the project per CONTEXT.md 'Specifics'." The test exists primarily to prevent future revisions from silently re-mandating the field.

**Rationale:** All prior validation in `src/lib/validation.ts` has been "missing = invalid_request 400" (e.g., missing `messages` field, missing `role` on a message). D-04 is a deliberate exception driven by the milestone-level D-26 invariant: chat surface always wins. If a future contributor sees `sessionId: z.uuidv4().optional()` and thinks "wait, we want sessionId to be required for traceability," they will run the tests, see Test 2 fail, and read the comment block explaining why the field is intentionally optional.

**Rejected alternatives:** Implicit-only (rely on `.optional()` being self-documenting — fails under code review pressure to "tighten" validation), separate test file for D-04 alone (over-segmented — IDENT-02 and D-04 are the same plan's contract).

## Deviations from Plan

None — plan executed exactly as written.

The plan specified two RED tests as canonical (Test 1 surfacing the field + Test 4 UUIDv5 rejection) and ≥5 tests overall (target 7). Outcome: 7 tests authored, 6/7 RED at Task 1 commit (only the absent-sessionId case passes trivially under the pre-schema-change state — current schema strips unknown keys silently, so absent === undefined is the trivial path), all 7 GREEN after Task 2 schema extension. The RED→GREEN transition aligned exactly with the plan's predicted shape.

No auto-fixes (Rules 1-3) triggered. No architectural questions (Rule 4) needed. No authentication gates (this is a pure schema + unit-test plan). No deferred items.

**Total deviations:** 0
**Impact on plan:** None — plan landed verbatim per PLAN.md `<tasks>` block.

## TDD Gate Compliance

Plan type: `tdd` (per PLAN.md frontmatter line 4). Plan-level TDD gate sequence verified in git log:

1. **RED gate (test commit):** `ddd764c — test(18-03): add failing schema-level suite for IDENT-02 sessionId (RED)` — 7 tests authored, 6/7 failing as expected
2. **GREEN gate (feat commit):** `4fa17d1 — feat(18-03): src/lib/validation.ts RequestSchema sessionId field (GREEN)` — 7/7 GREEN after schema extension

REFACTOR gate intentionally omitted — single-line additive change to `RequestSchema` with no cleanup opportunity. Per `tdd_execution`: "REFACTOR (if needed)... Commit only if changes." No changes to commit.

TDD compliance: ✅ PASS.

## Issues Encountered

None.

## Verification Results

### Task 1 automated verify

```bash
node -e "/* 7 checks: fixture UUIDs present, D-04 cited, UUIDv4 cited, describe shape, ≥5 it() blocks, correct import path */"
# → ALL 7 SOURCE CHECKS PASS

pnpm exec vitest run tests/api/chat-session-id.test.ts
# → Test Files 1 failed; Tests 6 failed | 1 passed (7 total) — RED confirmed
# → Test 2 (absent sessionId) trivially passes; Tests 1/3/4/5/6/7 fail because
#   current RequestSchema strips unknown keys silently (no rejection, no surface).
```

### Task 2 automated verify

```bash
pnpm exec vitest run tests/api/chat-session-id.test.ts tests/api/validation.test.ts
# → Test Files 2 passed (2); Tests 22 passed (22) — GREEN

pnpm exec astro check
# → 0 errors / 0 warnings / 0 hints

node -e "/* 5 checks: z.uuidv4().optional() present, IDENT-02/D-04/Plan 18-03 cited,
         no z.string().uuid(), no z.uuid().optional(), messages line byte-identical */"
# → ALL 5 SOURCE CHECKS PASS
```

### Task 3 — D-26 chat-surface focused 8-file battery (BLOCKING gate)

```bash
pnpm test
# → Test Files 53 passed | 1 skipped (54); Tests 442 passed | 2 skipped (444)
# → +7 from Plan 18-03 over Plan 18-02 close (435 → 442)

pnpm exec astro check
# → 0/0/0

pnpm exec vitest run \
  tests/api/sse-snapshot.test.ts \
  tests/api/anthropic-payload-shape.test.ts \
  tests/api/cache-hit-logs.test.ts \
  tests/api/validation.test.ts \
  tests/client/listener-dedup.test.ts \
  tests/client/chat-panel-display.test.ts \
  tests/build/no-imperative-display-flip.test.ts \
  tests/build/no-inline-display-on-chat-panel.test.ts
# → Test Files 8 passed (8); Tests 45 passed (45) — D-26 BLOCKING gate CLEAN
```

### Plan-end checks

```bash
git diff --exit-code src/scripts/chat.ts src/pages/api/chat.ts src/lib/chat-transcripts.ts wrangler.jsonc
# → exit 0 — Plan 18-03 did NOT touch any other source file (scope honored)

git diff --stat HEAD~2 src/
# → src/lib/validation.ts | 8 ++++++++ (1 file, 8 insertions, 0 deletions)

git log --oneline -2
# → 4fa17d1 feat(18-03): src/lib/validation.ts RequestSchema sessionId field (GREEN)
# → ddd764c test(18-03): add failing schema-level suite for IDENT-02 sessionId (RED)
```

## Test Count Delta

| Snapshot | Plan close → Plan close | Tests | Diff |
|----------|-------------------------|-------|------|
| Plan 18-01 close (planning-doc-only) | 419 PASS / 0 FAIL / 2 SKIP | 419 | — |
| Plan 18-02 close (chat-transcripts module) | 435 PASS / 0 FAIL / 2 SKIP | 435 | +16 |
| **Plan 18-03 close (this plan)** | **442 PASS / 0 FAIL / 2 SKIP** | **442** | **+7** |

Plan 18-03 contributes exactly 7 new tests — matches the `chat-session-id.test.ts` test count (one per `it()` block). All 7 are schema-level unit tests on `validateRequest`; zero new tests for `src/pages/api/chat.ts` (the handler-level missing-tolerance branch lands in Plan 18-05's wiring tests).

## Astro Check Status

`pnpm exec astro check` exits 0/0/0 — UNCHANGED from Plan 18-01 / 18-02 close. The schema change is additive (new optional field) so no downstream `.astro` or `.ts` caller breaks. `ValidatedRequest` TS-emitted shape gains `sessionId?: string` automatically via `z.infer<typeof RequestSchema>` — Plan 18-05's eventual `validateRequest(body).data.sessionId` access compiles cleanly at that future commit.

## D-26 Chat-Surface Focused Gate Status

**BLOCKING gate CLEAN.** All 8 chat-surface focused files GREEN (45/45 tests):

| File | Tests | Status | Anchor |
|------|-------|--------|--------|
| `tests/api/sse-snapshot.test.ts` | 1 | ✅ | D-15 SSE byte-identical |
| `tests/api/anthropic-payload-shape.test.ts` | 5 | ✅ | TEST-03 forward-defense (Plan 18-04 extends) |
| `tests/api/cache-hit-logs.test.ts` | 2 | ✅ | Plan 17-05 DEBT-02 cache_metrics log seam |
| `tests/api/validation.test.ts` | 15 | ✅ | Plan 18-03 baseline regression check (no break) |
| `tests/client/listener-dedup.test.ts` | 2 | ✅ | Plan 17-08 typecheck-fix baseline |
| `tests/client/chat-panel-display.test.ts` | 11 | ✅ | Plan 17-08 chat-panel display invariants |
| `tests/build/no-imperative-display-flip.test.ts` | 3 | ✅ | Plan 17-08 source-text guard |
| `tests/build/no-inline-display-on-chat-panel.test.ts` | 6 | ✅ | Plan 17-08 source-text guard |

The validation.ts source change is one-line + a 7-line citation comment — there is no plausible regression vector for D-15 (SSE byte-identical, unchanged code path: `validateRequest` is called BEFORE the SSE controller opens; the new `.optional()` field changes only the trust-contract surface, not the response bytes) or TEST-03 (Anthropic payload, unchanged code path: `validateRequest` runs at the trust boundary; `buildChatRequestArgs` reads from `result.data.messages` only — `result.data.sessionId` is read by Plan 18-05's future wiring, not by 18-03).

D-26 is the milestone-level cross-phase gate and the BLOCKING-clean status flows forward to Plans 18-04 / 18-05 / 18-06 / 18-07 / 18-08.

## Anchors for downstream plans

- **Plan 18-04 (anthropic-payload forward-defense extension):** `tests/api/anthropic-payload-shape.test.ts` currently asserts ABSENCE — no `sessionId` literal, no UUIDv4 pattern in `args.system` / `args.messages[0]`. Plan 18-04 ADDS: (a) calling `buildChatRequestArgs(portfolioContext, messages)` where the request body that produced `messages` carried a sessionId returns args whose system block + messages[0] are byte-identical to a "no-sessionId" call; (b) the HTTP envelope (request body shape) DOES carry sessionId and `validateRequest` accepts it. Schema is ready at this commit — call `validateRequest({ sessionId: "8b0f7f1c-1234-4567-8901-abcdef012345", messages: [...] })` in the new test setup; the data shape is documented in Plan 18-03's TS-narrowed type contract (Test 7 above).
- **Plan 18-05 (api/chat.ts ctx.waitUntil wiring):** `validateRequest(body).data.sessionId` is `string | undefined` at the call site in `src/pages/api/chat.ts` (TypeScript-narrowed by `result.success` check). The gating expression is `if (sessionId && ctx) ctx.waitUntil(appendTurn(env.CHAT_KV, sessionId, "user", validated_user_content, { ...meta }).catch((err) => console.error("chat.transcript.write_failed", { ... })))`. The defensive cast for `ctx` from Plan 18-01 SPIKE-ctx-access-path.md is `const ctx = (locals as { cfContext?: { waitUntil: (p: Promise<unknown>) => void } } | undefined)?.cfContext`. Both gates (sessionId present + ctx present) MUST be checked — D-04 makes sessionId absence a normal path, and the chat-surface test pattern `POST({ request } as never)` leaves ctx undefined.
- **Plan 18-06 (client sessionId mint):** Client sends `{ sessionId: <crypto.randomUUID()>, messages: [...] }` body shape; server's `z.uuidv4().optional()` accepts it. Per D-04: if `crypto.randomUUID()` or `localStorage.setItem` throws, client OMITS the `sessionId` field from the body — server's optional field accepts the omit branch (Test 2 forward-defends). The `chat-history` localStorage `STORAGE_VERSION` 1→2 atomic wipe path lives in 18-06's chat.ts edits, not here.

## User Setup Required

None.

## Next Plan Readiness

- **Plan 18-04 (anthropic-payload-forward-defense extension)** — unblocked. `validateRequest` accepts sessionId on the envelope; Plan 18-04 can author the new assertions for sessionId-on-envelope path + byte-equality of system block across sessionId-bearing vs no-sessionId calls.
- **Plan 18-05 (api/chat.ts waitUntil wiring)** — unblocked. `result.data.sessionId` is `string | undefined`; Plan 18-05 wires the `ctx.waitUntil(appendTurn(...))` gating with the D-04 absent-sessionId branch.
- **Plan 18-06 (client sessionId mint)** — unblocked. Server contract for both branches (present UUIDv4 / absent) is forward-defended at the schema layer.
- **Plan 18-07 / 18-08** — unblocked (both downstream of 18-05 wiring; 18-03 contributes the schema anchor only).

No blockers carry forward.

## Self-Check: PASSED

- File `tests/api/chat-session-id.test.ts` — FOUND
- File `src/lib/validation.ts` — FOUND (modified; `sessionId: z.uuidv4().optional()` present at line 32 + 7-line citation comment)
- Commit `ddd764c` (Task 1 RED) — FOUND in `git log --oneline -5`
- Commit `4fa17d1` (Task 2 GREEN) — FOUND in `git log --oneline -5`
- TDD sequence verified: test() commit precedes feat() commit in git log
- 442/0/2 full suite — VERIFIED via `pnpm test`
- 0/0/0 astro check — VERIFIED via `pnpm exec astro check`
- D-26 chat-surface 8-file focused battery (45/45 GREEN) — VERIFIED
- Scope honored: `git diff --exit-code src/scripts/chat.ts src/pages/api/chat.ts src/lib/chat-transcripts.ts wrangler.jsonc` exits 0

---
*Phase: 18-persistence-identity-kv-write-path-sessionid*
*Completed: 2026-05-11*
