---
phase: 18-persistence-identity-kv-write-path-sessionid
plan: 05
subsystem: api
tags: [chat-api, kv-write-path, ctx-waituntil, persistence, d-04-missing-tolerance, meta-01, meta-02, ident-02, d-15-byte-identical, test-03-forward-defense, d-26-chat-surface]

# Dependency graph
requires:
  - phase: 18-persistence-identity-kv-write-path-sessionid
    plan: 01
    provides: "SPIKE-ctx-access-path.md — verified Astro v6 / @astrojs/cloudflare 13.1.7 path is locals.cfContext; defensive cast pattern for test-compat"
  - phase: 18-persistence-identity-kv-write-path-sessionid
    plan: 02
    provides: "src/lib/chat-transcripts.ts — appendTurn + AppendTurnMeta named exports + the verbatim D-10 / D-11 call shape in 18-02-SUMMARY § Anchor for Plan 18-05"
  - phase: 18-persistence-identity-kv-write-path-sessionid
    plan: 03
    provides: "src/lib/validation.ts RequestSchema sessionId field — Plan 18-05 reads validation.data.sessionId at the D-04 missing-tolerance branch"
  - phase: 18-persistence-identity-kv-write-path-sessionid
    plan: 04
    provides: "tests/api/anthropic-payload-shape.test.ts 8/8 — Plan 18-04 D-16 forward-defense (sessionId-not-in-cacheable-surface guard) holds across Plan 18-05's wiring"
provides:
  - "src/pages/api/chat.ts — D-10 user-turn ctx.waitUntil(appendTurn(...)) call site at line 126 (post-validateRequest, pre-Anthropic-stream); D-11 assistant-turn ctx.waitUntil(appendTurn(...)) call site at line 240 (post-controller.close, inside start(controller) closure)"
  - "Token accumulator pattern locked: let accumulator = '' at top of start(controller); accumulator += event.delta.text inside content_block_delta branch; single flush at controller.close — NEVER per-token"
  - "captureRequestMeta(request) helper exported-by-position above POST — META-01 first-turn snapshot with defensive request.cf null fallbacks per RESEARCH Pitfall 4"
  - "Defensive ctx access pattern: const ctx = (locals as { cfContext?: ... } | undefined)?.cfContext ?? { waitUntil: noop } — production Workers populates locals.cfContext, vitest test-env falls through to the no-op stub keeping D-26 chat-surface tests GREEN without test changes"
affects: [18-06-client-sessionid-mint, 18-07-forward-defense-and-meta02, 18-08-uat-and-test03-live, phase-19, phase-20]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ctx.waitUntil(appendTurn(...).catch(...)) — .catch chained BEFORE waitUntil per RESEARCH Pitfall 1 (silent-swallow rule); ctx is NEVER destructured (would lose this binding → 'Illegal invocation' runtime error)"
    - "Defensive cast pattern for Astro v6 locals.cfContext access — keeps unit tests that invoke POST({ request } as never) without a locals arg GREEN via no-op waitUntil fallback (D-26 anti-regression)"
    - "Accumulator strategy for SSE-streamed assistant content — single KV write at controller.close() instead of per-token (KV 1-write/sec/key cap per RESEARCH Pitfall 6)"
    - "META-02 source-of-truth-once: cacheUsage closure object passed BYTE-IDENTICAL into appendTurn meta — same fields the chat.cache_metrics log line consumes"
    - "Behavior-preserving deviation: comment-text adjusted from 'ctx.waitUntil(appendTurn(...))' to 'fire-and-forget appendTurn writes' to keep the source-text regex 'exactly 2 ctx.waitUntil( occurrences' clean for Plan 18-07 forward-defense"

key-files:
  created: []
  modified:
    - "src/pages/api/chat.ts (279 LOC; +52 net additive — 33 lines in Task 1, 53 lines in Task 2, -1 in Task 2 comment-text adjustment)"

key-decisions:
  - "D-10 user-turn anchor placed AFTER sanitizeMessages(validation.data.messages) (line 116) and BEFORE the existing 'D-08/D-11: Stream response from Claude Haiku' comment block (line 137) — sequential code path keeps the write firing after validation success but before client.messages.create opens the stream. Per the SPIKE-ctx-access-path.md anchor section."
  - "D-11 assistant-turn anchor placed AFTER controller.close() (line 225) and BEFORE the closing brace of the try block (line 255) — inside start(controller) so the accumulator closure is in scope. The waitUntil call lands OFF the controller.enqueue path (it enqueues nothing into the SSE byte stream) → D-15 sse-snapshot 3/3 holds."
  - "D-04 missing-tolerance branch implemented at both call sites via if (validation.data.sessionId) gate — when sessionId is absent the SSE stream still serves normally, no appendTurn fires. Assistant-turn additionally gated on && accumulator to handle the zero-token-reply edge."
  - "Comment-text adjustment in Task 2: the Task 1 comment that originally read 'for ctx.waitUntil(appendTurn(...))' was edited to 'for fire-and-forget appendTurn writes' to keep the verification regex (f.match(/ctx\\.waitUntil\\(/g).length === 2) precise — exactly 2 call sites in source, zero textual matches in comments. This anchors Plan 18-07's source-text forward-defense to count call sites cleanly."

requirements-completed: [KV-02, KV-03, KV-04, KV-05, IDENT-02, META-01, META-02, TEST-01, TEST-03]
# KV-01 (binding verification — env.CHAT_KV reach) and the full IDENT-02 read-path are exercised here;
# the actual KV-01 binding live-verify happens at Plan 18-08 UAT against the preview deployment.
# TEST-03 (forward-defense for sessionId-not-in-cacheable-surface) is now load-bearing: this plan
# imports nothing into buildChatRequestArgs that mentions sessionId, and the 8/8 Plan 18-04 suite
# verifies the source-text + runtime invariants hold across the new waitUntil wiring.

# Metrics
duration: ~6.6 minutes
completed: 2026-05-11
---

# Phase 18 Plan 05: API Chat waitUntil Wiring Summary

**Persistence layer wired: two `ctx.waitUntil(appendTurn(...).catch(...))` call sites land at the D-10 / D-11 anchors in `src/pages/api/chat.ts` — KV-02..05 + META-01 + META-02 + IDENT-02 read + D-04 missing-tolerance + TEST-01 D-26 hold + TEST-03 forward-defense all confirmed. `pnpm test` 445/0/2 (zero regressions from Plan 18-04 close baseline), `astro check` 0/0/0, sse-snapshot 3/3 GREEN (D-15 byte-identical anchor preserved across the highest-D-26-risk commit in Phase 18).**

## Performance

- **Duration:** ~6.6 minutes (397 seconds)
- **Tasks:** 3 / 3 completed (Task 1 setup + helper, Task 2 three wiring blocks, Task 3 plan-end gate)
- **Files created:** 0
- **Files modified:** 1 (`src/pages/api/chat.ts`)
- **LOC delta:** +85 / -2 net (196 → 279) — Task 1: +33 / -1 (import + captureRequestMeta + locals destructure + ctx extraction), Task 2: +53 / -1 (three wiring blocks + comment-text adjustment)
- **Plan 18-05 expectation was ~30 LOC additive — actual is +85 because of decision-ID inline comments and JSDoc on captureRequestMeta. Comment-to-code ratio matches `validation.ts` density.**

## Accomplishments

- **`src/pages/api/chat.ts` wired with two `ctx.waitUntil(appendTurn(...))` call sites** at the locked anchors:
  - **Line 126 (D-10 user-turn):** Fires AFTER `validateRequest` succeeds, AFTER `sanitizeMessages`, BEFORE the Anthropic stream opens. The `.catch` chains BEFORE `waitUntil` (Pitfall 1 rule) and emits `chat.transcript.write_failed { sessionId, role: "user", error_class }`.
  - **Line 240 (D-11 assistant-turn):** Fires AFTER `controller.close()` INSIDE the `start(controller)` closure (closure scope required to capture the accumulator). Passes `captureRequestMeta(request)` snapshot + `cacheUsage?.cache_read_input_tokens ?? 0` + `cacheUsage?.cache_creation_input_tokens ?? 0` (META-02 source-of-truth-once — the same closure object the existing `chat.cache_metrics` log line at line 200 consumes). The `.catch` emits `chat.transcript.write_failed { sessionId, role: "assistant", content_length, error_class }`.
- **Token accumulator strategy implemented:** `let accumulator = ""` declared at top of `start(controller)` (line 153); `accumulator += event.delta.text` appended inline at the existing `content_block_delta` branch (line 180), immediately after the existing `controller.enqueue(...)` call. Single KV flush at `controller.close()` — NEVER per-token (RESEARCH § Pitfall 6: KV's 1-write/sec/key cap would 429 every transcript otherwise).
- **`captureRequestMeta(request)` helper introduced** above the POST export (lines 16-34). Defensively reads `request.cf?.country / region / colo` with `null` fallbacks per RESEARCH § Pitfall 4 (wrangler dev mock concern). Snapshots `Referer` + `User-Agent` headers. The same snapshot is passed to BOTH the user-turn and assistant-turn writes — `appendTurn` is idempotent on meta (first-turn pin from Plan 18-02 preserves existing values; passing the snapshot on assistant-turn ensures META-01 fields land correctly even if the user-turn write failed per D-09 silent posture).
- **Defensive `ctx` access pattern wired** at the top of POST body (lines 45-46): `const ctx = (locals as { cfContext?: { waitUntil: (p: Promise<unknown>) => void } } | undefined)?.cfContext ?? { waitUntil: (_p: Promise<unknown>) => {} };`. Production Workers runtime populates `locals.cfContext` per the adapter handler (`@astrojs/cloudflare/dist/utils/handler.js:64-66`). Vitest test environment that calls `POST({ request } as never)` without a `locals` arg falls through to the no-op `waitUntil` stub — keeps `tests/api/sse-snapshot.test.ts` + `tests/api/cache-hit-logs.test.ts` GREEN with zero test-file edits (D-26 anti-regression).
- **D-04 missing-tolerance branch correctly gated** at both call sites: `if (validation.data.sessionId)` on user-turn write, `if (validation.data.sessionId && accumulator)` on assistant-turn write. When sessionId is absent (Plan 18-06 client mint hasn't landed yet, or browser cleared sessionStorage), neither `waitUntil` fires and the SSE stream still serves normally — chat UX preserved per D-26.
- **D-15 byte-identical anchor preserved:** Both `ctx.waitUntil` calls land OFF the `controller.enqueue` path. Neither writes any SSE byte to the controller. `tests/api/sse-snapshot.test.ts` continues to be 3/3 GREEN — the plan-time-authored D-15 amendment in REQUIREMENTS.md TEST-02 commentary is validated.
- **TEST-03 forward-defense holding:** `buildChatRequestArgs(portfolioContext, messages)` UNTOUCHED — sessionId is read from `validation.data.sessionId` and passed ONLY to `appendTurn(env.CHAT_KV, sid, ...)`. `src/prompts/chat-request-shape.ts` is byte-identical (last touched Apr 23, 2026 — Plan 14-07, completely unrelated). The 8/8 Plan 18-04 anthropic-payload-shape suite (including the 3 D-16 source-text + runtime assertions) is GREEN at commit close.
- **`pnpm test` 445/0/2** (matches Plan 18-04 close baseline EXACTLY — zero net delta; Plan 18-05 adds NO new tests itself per the plan spec; Plan 18-07 will add the append-turn-call-site source-text suite).
- **`pnpm exec astro check` 0/0/0** — Phase 17 baseline preserved through Plan 18-05. The defensive cast pattern keeps TS strict-mode clean without depending on an Astro adapter ambient type.

## Task Commits

Each task committed atomically. No TDD cycle (plan `type: execute`, not `type: tdd`); per-task verification of existing tests + astro check + plan-specified source-text checks.

1. **Task 1: appendTurn import + locals destructure + captureRequestMeta helper + ctx extraction** — `0f5f09c` (refactor). Adds 33 lines, removes 1 (the original POST destructure line replaced). At commit close: `pnpm exec astro check` 0/0/3 hints (the `appendTurn` unused-binding hint was expected since Task 2 wires it); `tests/api/sse-snapshot.test.ts` 3/3 GREEN; full suite 445/0/2.
2. **Task 2: three wiring blocks (D-10 user, accumulator, D-11 assistant) + comment-text adjustment** — `dad27c1` (feat). Adds 53 lines, removes 1 (the Task 1 comment-text adjustment to avoid the literal `ctx.waitUntil(` in non-code text — kept the source-text regex precise). At commit close: `pnpm exec astro check` 0/0/0 (the Task 1 unused-binding hint resolved); full suite 445/0/2; 13/13 plan-specified wiring structure checks PASSED.
3. **Task 3: plan-end gate** — verification-only, no commit. Confirmed `pnpm test` 445/0/2, `pnpm exec astro check` 0/0/0, 10-file D-26 chat-surface focused battery 71/71 GREEN (10 test files), sse-snapshot in isolation 3/3 GREEN, anthropic-payload-shape in isolation 8/8 GREEN, `git diff --exit-code` against 5 untouched chat-surface files exits 0.

**Plan metadata commit:** will land as the final commit after this SUMMARY (per executor protocol's `<final_commit>` step).

## Files Created/Modified

- **`src/pages/api/chat.ts`** — MODIFIED (+85 / -2 lines; 196 → 279). Five additive edits:
  1. Lines 14: new `import { appendTurn, type AppendTurnMeta } from "../../lib/chat-transcripts";`
  2. Lines 16-34: new `captureRequestMeta(request: Request): AppendTurnMeta` helper with JSDoc citing META-01 + D-08 + Pitfall 4
  3. Line 36: `export const POST: APIRoute = async ({ request, locals }) => {` (widened destructure)
  4. Lines 37-46: defensive `ctx` extraction with full RESEARCH-cited comment + no-op fallback for test-env
  5. Lines 118-135 + 151-153 + 180 + 227-254: the three D-10 / accumulator / D-11 wiring blocks

## Decisions Made

### D-PA-01: Comment-text adjustment to keep the source-text regex precise

**Decision:** The Task 1 comment originally read `// Plan-time-resolved path to Workers ExecutionContext for ctx.waitUntil(appendTurn(...)).` — this literal string in non-code tripped the Task 2 verification regex `(f.match(/ctx\.waitUntil\(/g) || []).length === 2`, which was reporting 3 matches (2 actual call sites + 1 comment textual match). Edited the comment in Task 2 to `// Plan-time-resolved path to Workers ExecutionContext for fire-and-forget appendTurn writes.` — same semantic, no literal `ctx.waitUntil(` in non-code.

**Rationale:** The Plan 18-05 verification spec line `EXACTLY 2 ctx.waitUntil( occurrences` is downstream-load-bearing for Plan 18-07's `tests/build/append-turn-call-site.test.ts` source-text guard. Keeping textual matches at exactly 2 means Plan 18-07's regex can count call sites without false positives from comment text. The comment's information density is preserved — the rest of the comment still cites RESEARCH § Pitfall 1, the adapter source file path, and the no-op fallback rationale.

**Implementation:** Single-line edit during Task 2 (committed together with the wiring blocks under `dad27c1`). No test impact.

### D-PA-02: Both user-turn and assistant-turn writes pass `captureRequestMeta(request)` (not nulls on assistant-turn)

**Decision:** The plan PATTERNS.md and the 18-02-SUMMARY § Anchor for Plan 18-05 BOTH show `captureRequestMeta(request)` on the user-turn write. The 18-02 anchor specifically passes `{ referrer: null, user_agent: null, country: null, region: null, colo: null, cache_*: ... }` as a placeholder on the assistant-turn write. However, the plan must-have truth #4 specifies "Assistant-turn meta passes the same captureRequestMeta(request) snapshot as the user-turn write (NOT nulls)" — to preserve META-01 if the user-turn write failed per D-09 silent posture. Followed the must-have over the 18-02 illustrative shape.

**Rationale:** `appendTurn` is idempotent on meta — the first surviving write to KV is the one that pins the metadata. If the user-turn write fails (D-09 surfaces the rejection to the `.catch`, which logs `chat.transcript.write_failed`), the assistant-turn write is the FIRST surviving write to KV. Passing the real `captureRequestMeta(request)` snapshot ensures META-01 fields (country, region, colo, referrer, user_agent) land correctly even on that failure path. On the normal happy path, the user-turn write pins meta first; the assistant-turn write's meta arg is preserved-but-ignored per the module's first-turn pin logic.

**Implementation:** Line 239: `const assistantMeta = captureRequestMeta(request);` then spread `{ ...assistantMeta, cache_read_input_tokens, cache_creation_input_tokens }` into the appendTurn meta argument. No test impact at Plan 18-05 close (Plan 18-07 Task 2 META-02 closure test will cover this surface).

### D-PA-03: Defensive cast keeps existing chat-surface tests GREEN with zero test-file edits

**Decision:** Per the SPIKE resolution, the defensive cast `(locals as { cfContext?: ... } | undefined)?.cfContext ?? { waitUntil: noop }` is the preferred ctx access path because it keeps the existing chat-surface unit tests passing without requiring a `mockLocals` shape in every test invocation. `tests/api/sse-snapshot.test.ts` (line 82-84 + 99-101) and `tests/api/cache-hit-logs.test.ts` (line 129 + 153 + 177) all call `POST({ request: buildRequest() } as never)` with NO `locals` arg.

**Rationale:** The cleaner production-only form `const ctx = locals.cfContext` would require widening all 6 existing POST invocations across those 2 test files to pass a `mockLocals` shape — and any FUTURE chat-surface test that follows the existing pattern would also need to pass mockLocals, creating ongoing friction. The defensive cast costs ~30 chars of code (single line) and ZERO test edits. Plan 18-07 Task 2 will add a META-02 closure test that DOES pass a real `mockLocals` (so it can observe `appendTurn` invocation via a spy) — but that's a Plan 18-07 concern; Plan 18-05's defensive cast does not block or complicate it.

**Implementation:** Line 45-46. The narrowed type `(locals as { cfContext?: { waitUntil: (p: Promise<unknown>) => void } } | undefined)` keeps TS strict-mode clean. The `_p: Promise<unknown>` parameter in the fallback (`{ waitUntil: (_p: Promise<unknown>) => {} }`) uses the underscore-prefix convention to suppress no-unused-vars without disabling the rule.

## Deviations from Plan

### Comment-text adjustment for verification-regex compatibility (Task 2)

**Found during:** Task 2 verification step.

**Issue:** The verification regex `(f.match(/ctx\.waitUntil\(/g) || []).length === 2` reported a count of 3 because the Task 1 comment included the literal string `ctx.waitUntil(appendTurn(...))` in non-code text. The regex was specified by the plan and is downstream-load-bearing for Plan 18-07.

**Fix:** Edited the Task 1 comment in Task 2 from `for ctx.waitUntil(appendTurn(...))` to `for fire-and-forget appendTurn writes` — same semantic, zero literal regex matches in non-code.

**Files modified:** `src/pages/api/chat.ts` (1 line replaced as part of the Task 2 commit).

**Commit:** `dad27c1` (included in the Task 2 feat commit).

This is a Rule 3 auto-fix (blocking issue caused by current-task changes — the verification regex from the plan would not pass without it). Not a Rule 4 architectural change.

## Verification

All success criteria from `18-05-PLAN.md` met:

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Two `ctx.waitUntil(appendTurn(...))` call sites (one user, one assistant) | YES | Line 126 (user, after sanitizeMessages); line 240 (assistant, after controller.close()). Grep for `ctx\.waitUntil\(` returns exactly 2 source matches. |
| Both wrap `appendTurn(...).catch(...)` with .catch BEFORE waitUntil | YES | `.catch((err: unknown) => {...})` chains inside both waitUntil calls before the promise is passed to waitUntil — RESEARCH Pitfall 1 satisfied. |
| Accumulator declared at top of start(controller); updated inline | YES | Line 153 `let accumulator = "";`; line 180 `accumulator += event.delta.text;` inside the existing content_block_delta branch. |
| captureRequestMeta helper extracts referrer/user_agent/country/region/colo defensively | YES | Lines 16-34. Defensive `request.cf?.country ?? null` (etc.) per Pitfall 4. `request.headers.get("Referer")` + `request.headers.get("User-Agent")`. |
| D-04 missing-tolerance: both waitUntil calls gated on `if (validation.data.sessionId)` | YES | Line 122 (user); line 231 (assistant, additionally gated on `&& accumulator` for zero-token-reply edge). |
| META-02 source-of-truth-once: assistant-turn meta passes `cacheUsage?.cache_read_input_tokens ?? 0` + `cacheUsage?.cache_creation_input_tokens ?? 0` | YES | Lines 243-244. Same `cacheUsage` closure object the existing `console.log("chat.cache_metrics", ...)` at line 200 consumes. |
| `tests/api/sse-snapshot.test.ts` 3/3 GREEN — D-15 byte-identical preserved | YES | 3 passed. Both isolation run AND full-suite run. D-15 anchor holds across the highest-D-26-risk commit in Phase 18. |
| `tests/api/anthropic-payload-shape.test.ts` 8/8 GREEN — TEST-03 + D-16 forward-defense | YES | 8 passed. The Plan 18-04 D-16 source-text + runtime assertions catch any accidental sessionId reference in `src/prompts/chat-request-shape.ts`; none exists. |
| `pnpm test` ≥ 445 PASS / 0 FAIL / 2 SKIP | YES | EXACTLY 445 PASS / 0 FAIL / 2 SKIP — matches Plan 18-04 close baseline; zero net delta (Plan 18-05 adds no new tests; Plan 18-07 will). |
| `pnpm exec astro check` 0/0/0 | YES | 0 errors / 0 warnings / 0 hints. |
| 10-file D-26 chat-surface focused battery all GREEN | YES | 10 test files / 71 tests / all GREEN: sse-snapshot, anthropic-payload-shape, cache-hit-logs, validation, chat-session-id, chat-transcripts, listener-dedup, chat-panel-display, no-imperative-display-flip, no-inline-display-on-chat-panel. |
| No other source file modified | YES | `git diff --exit-code src/scripts/chat.ts src/lib/validation.ts src/lib/chat-transcripts.ts src/prompts/chat-request-shape.ts wrangler.jsonc` exits 0. `src/prompts/chat-request-shape.ts` last touched Apr 23, 2026 (Plan 14-07) — completely unrelated to Phase 18. |

## Plan-End Gate

Commands run per Task 3 spec:

1. **`pnpm test`** → 445 PASS / 0 FAIL / 2 SKIP (test files: 53 passed, 1 skipped; tests: 445 passed, 2 skipped). **No regression from Plan 18-04 close baseline.**
2. **`pnpm exec astro check`** → 0 errors / 0 warnings / 0 hints. **Phase 17 baseline preserved through Plan 18-05.**
3. **10-file D-26 chat-surface focused battery** → 71/71 GREEN.
4. **`pnpm exec vitest run tests/api/sse-snapshot.test.ts` in isolation** → 3/3 GREEN. **D-15 byte-identical anchor preserved across the highest-D-26-risk commit in Phase 18.**
5. **`pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` in isolation** → 8/8 GREEN. **TEST-03 forward-defense + D-16 source-text + runtime guards intact.**
6. **`git diff --exit-code` against 5 untouched chat-surface files** → EXIT=0. **`src/pages/api/chat.ts` is the ONLY file modified in Plan 18-05.**

## Threat Flags

No new security-relevant surface introduced beyond what the plan's `<threat_model>` already enumerates (T-18-05-01..08). Specifically:

- **T-18-05-01 (sessionId leak into Anthropic cacheable surface):** sessionId is read from `validation.data.sessionId` (line 122 + 231) and passed ONLY to `appendTurn(env.CHAT_KV, sid, ...)` (lines 127 + 241). `buildChatRequestArgs(portfolioContext, messages)` at line 167 receives ONLY `portfolioContext` and `messages` — no sessionId. The Plan 18-04 D-16 forward-defense suite (8/8) catches any future regression at the source-text + runtime level.
- **T-18-05-02 (KV write rejection silently swallowed):** Both `ctx.waitUntil` call sites chain `.catch((err: unknown) => { console.error("chat.transcript.write_failed", {...}); })` BEFORE passing the promise to `waitUntil`. The error_class field is `err instanceof Error ? err.constructor.name : "unknown"` (typed error-class capture). Plan 18-07 source-text forward-defense will lock the `.catch` chain.
- **T-18-05-03 (D-15 SSE byte-stream regression):** Both waitUntil calls land OFF the controller-enqueue path. `tests/api/sse-snapshot.test.ts` 3/3 GREEN at commit close.
- **T-18-05-06 (sessionId logged alongside IP/UA fingerprint):** The `chat.transcript.write_failed` log line carries `{ sessionId, role, error_class, [content_length] }` — functional fields only. No IP, no UA. The rate-limit branch at line 85 logs IP separately (`CF-Connecting-IP`) — distinct log seam, no co-occurrence.
- **T-18-05-07 (request.cf undefined in wrangler dev):** `captureRequestMeta` defensively reads `cf?.country ?? null` etc. Schema accepts null per META-01 contract.

## Anchor for Plan 18-06 (client sessionId mint)

The server is now persistence-ready: any POST that arrives with a valid UUIDv4 `sessionId` in the JSON body will trigger the user-turn + assistant-turn KV writes. Plan 18-06 wires `src/scripts/chat.ts` to mint a sessionId in sessionStorage on first chat-panel open and include it in every POST envelope. The server-side D-04 missing-tolerance branch means Plan 18-06 can land in ANY order relative to Plan 18-05 — the server is forward-compatible.

## Anchor for Plan 18-07 (source-text forward-defense + META-02 closure test)

Two call-site line numbers for Plan 18-07's `tests/build/append-turn-call-site.test.ts` regex tests to lock against:

- **D-10 user-turn:** `src/pages/api/chat.ts:126` — `ctx.waitUntil(` literal; full call shape `ctx.waitUntil(appendTurn(env.CHAT_KV, sid, "user", userContent, sessionMeta).catch(...))`.
- **D-11 assistant-turn:** `src/pages/api/chat.ts:240` — `ctx.waitUntil(` literal; full call shape `ctx.waitUntil(appendTurn(env.CHAT_KV, sid, "assistant", accumulator, { ...assistantMeta, cache_read_input_tokens, cache_creation_input_tokens }).catch(...))`.

Both have `.catch(` chained BEFORE the closing `)` of `ctx.waitUntil(` — Plan 18-07's Pitfall 1 source-text guard can match the literal `.catch(` inside both `ctx.waitUntil(` calls.

Plan 18-07 Task 2 META-02 closure test will need to pass a real `mockLocals = { cfContext: { waitUntil: spy } }` to observe the `appendTurn` invocation — the defensive cast in Plan 18-05 supports this: when `mockLocals.cfContext` exists, the spy is wired; when it doesn't (existing tests), the no-op fallback applies.

## Anchor for Plan 18-08 (UAT + TEST-03 live verification)

The operator can now post sessionId-bearing requests against `*.workers.dev` preview / production and observe `live:{sid}` keys via `wrangler kv key get`. Specifically:

- Post a request with `{ sessionId: "<UUIDv4>", messages: [{ role: "user", content: "test" }] }` to the chat endpoint.
- Wait for the SSE stream to complete (data: [DONE] + EOF).
- Run `wrangler kv key get "live:<sid>" --binding CHAT_KV --remote` and verify a JSON value with `v: 1`, `sid: "<UUIDv4>"`, `messages: [{ role: "user", content: "test", ts: ... }, { role: "assistant", content: "...", ts: ..., cache_read_input_tokens, cache_creation_input_tokens }]`, `meta: { referrer, user_agent, country, region, colo }`.
- Repeat 3× to confirm META-02 cache fields populate correctly on responses 2-3 (cache hit) per TEST-03 live verification.

## Self-Check: PASSED

- `src/pages/api/chat.ts` exists at the expected path (FOUND).
- Commit `0f5f09c` exists in `git log` (FOUND — Task 1).
- Commit `dad27c1` exists in `git log` (FOUND — Task 2).
- Two `ctx.waitUntil(` source-text occurrences at lines 126 + 240 (CONFIRMED via Grep).
- `pnpm test` 445/0/2, `astro check` 0/0/0, sse-snapshot 3/3 GREEN, anthropic-payload-shape 8/8 GREEN at commit close (CONFIRMED).
- `src/prompts/chat-request-shape.ts` byte-identical (last touched commit `d315863` from Apr 23, 2026 — Plan 14-07, completely unrelated to Phase 18).
