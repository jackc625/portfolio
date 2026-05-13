---
phase: 17-foundations-migration-dns-debt-sweep
plan: 05
subsystem: chat-observability
tags: [chat, observability, prompt-cache, tech-debt, debt-02, test-03, phase-17]

# Dependency graph
requires:
  - phase: 17-03
    provides: DEBT-04 + DEBT-05 chat-surface tech debt CLOSED — D-26 chat-surface regression battery 145/145 GREEN at HEAD of Plan 17-05 baseline. Without 17-03's listener-dedup + CSS-only display state machine, the chat surface would have had structural debt that DEBT-02's `message_start` branch edit could have surfaced as a regression. Plan 17-05 had to TOUCH chat-surface files (api/chat.ts + chat.ts) so the D-26 cadence per CONTEXT.md D-10 was BLOCKING — full suite ran after every commit.
  - phase: 17-04
    provides: DEBT-01 + DEBT-03 docs/CI tech debt CLOSED — PROJECT.md "Known issues" entry reframed; build:chat-context:check CI gate live. The decision in REQUIREMENTS.md DEBT-02 wording referenced `src/lib/chat-cache.ts` + `src/lib/content-snapshot.ts` as seam locations — Plan 17-PATTERNS verified these files do not exist; Plan 17-05 reconciles per CLAUDE.md "Don't add abstractions beyond what the task requires" — seams inlined into actual cache-touching files.
  - decision: D-09 (CONTEXT.md step 5)
    provides: Plan 17-05 is the LAST code-change plan in Phase 17 before DNS work (Plan 17-06). Per D-08 phase ordering, observability seams land BEFORE DNS warmup sends so any chat-surface regression is debuggable on an all-GREEN code surface before email-deliverability variables enter the picture.
provides:
  - DEBT-02 server-side `chat.cache_metrics` structured log seam at the `else if (event.type === "message_start")` branch of the SSE stream loop in src/pages/api/chat.ts. Emits flat-primitive fields `{ cache_read_input_tokens, cache_creation_input_tokens, input_tokens, output_tokens }` per Anthropic response; defaults to 0 when fields omitted; routes to Cloudflare Workers Logs / wrangler tail for query/filter.
  - DEBT-02 client-side DEV-only `chat.response_metrics_client` log line at the finally-block of streamChat() in src/scripts/chat.ts. Gated on `import.meta.env.DEV` so Vite tree-shakes the block from production dist bundles; surfaces `elapsed_ms` as a cache-hit proxy since the client cannot read cache tokens through SSE (D-15 anchor).
  - TEST-03 forward-defense snapshot test at tests/api/anthropic-payload-shape.test.ts. 5 assertions on buildChatRequestArgs() output: no `sessionId` literal in `system` block, no UUIDv4 in `system` block, no `sessionId` literal in `messages[0]`, no UUIDv4 in `messages[0]`, `system` block byte-identical across two calls with different `messages` payloads (Anthropic's prompt-cache hit predicate). GREEN on current Phase 17 source (no sessionId yet); locks the contract forward for Phase 18 IDENT-02.
  - D-15 SSE byte-identical anchor PRESERVED end-to-end (TEST-02 sse-snapshot 3/3 GREEN after both chat-surface commits). The DEBT-02 server seam adds NO bytes to the SSE response body — `console.log()` only, never `controller.enqueue()`.
  - Pre-existing typecheck-error documentation: 2 ts(7006) implicit-any errors in tests/client/listener-dedup.test.ts (Plan 17-03 commit `0ad77b3`) logged in deferred-items.md as out-of-scope for Plan 17-05. Closure path: 2-line annotation fix; candidate for /gsd-quick or Phase 18 first plan as a Rule 3 prerequisite.
affects: [17-06, 18-*]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline observability seams over factored modules. When REQUIREMENTS.md references a seam location that doesn't exist in the repo (Plan 17-05 case: `src/lib/chat-cache.ts` / `src/lib/content-snapshot.ts` referenced but not created), reconcile by inlining the seam at the actual cache-touching site rather than creating empty wrapper modules. Per CLAUDE.md 'Don't add abstractions beyond what the task requires' — the seam is 10 LOC; a dedicated module would be over-abstraction."
    - "Structured JSON logs route to Workers Logs / wrangler tail, NEVER to the SSE response body. The SSE body is consumer contract (chat client UI rendering); logs are operator contract (observability + debugging). The two surfaces have different consumers, different lifecycles, different SLAs — mechanically separate is non-negotiable. The DEBT-02 server seam emits `console.log(\"chat.cache_metrics\", {...})` — Cloudflare Workers Logs parses the second arg as JSON for query/filter (flat-primitive fields only)."
    - "Distinct event names for related-but-distinct measurements in different observability tiers. Plan 17-05's server seam emits `chat.cache_metrics` (Workers Logs) and the client seam emits `chat.response_metrics_client` (DevTools Console). Same event name would imply same measurement; the client measures `elapsed_ms` (cache-hit proxy) while the server measures token counts (canonical). Distinct names → unambiguous grep / filter behavior across Workers Logs vs DevTools Console."
    - "`finally`-block instrumentation for functions with N early-return + catch paths. streamChat() in src/scripts/chat.ts has 5 distinct exit paths (3 onError early returns, 1 onDone early return, 1 natural loop end, 1 catch); inserting the log line at all 5 sites is error-prone. Hoisting `t0` outside the try and the log line into the outer `finally` block ensures the seam fires on every exit by language contract. Closure-capture cost is one variable; correctness benefit is by construction."
    - "Byte-equality assertion over substring-presence assertion for cache-integrity tests. Anthropic's prompt-cache hit predicate evaluates `system` array bytes for exact equality across calls; the TEST-03 snapshot mirrors that exact predicate with `JSON.stringify(args1.system) === JSON.stringify(args2.system)` rather than just 'no sessionId substring'. A future regression that threads sessionId via template concatenation into the system prompt text would slip past substring checks but fail byte-equality."
    - "Forward-defense snapshot tests in Phase N for contracts that Phase N+1 will introduce. Plan 17-05's TEST-03 snapshot has no sessionId to test against — Phase 17 source has none. The test asserts the CURRENT clean state and locks it forward: Phase 18 IDENT-02 implementation MUST keep these tests GREEN. Future plan-authoring pattern: when a future phase will introduce a new identifier into a contract that downstream evaluates as byte-equality, author the snapshot test in the current phase so the regression-bar is locked BEFORE the implementation lands."

key-files:
  created:
    - tests/api/cache-hit-logs.test.ts
    - tests/api/anthropic-payload-shape.test.ts
  modified:
    - src/pages/api/chat.ts
    - src/scripts/chat.ts
    - .planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md
    - .planning/PROJECT.md (none — no edit)
    - .planning/STATE.md
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "REQUIREMENTS.md DEBT-02 wording referenced `src/lib/chat-cache.ts` + `src/lib/content-snapshot.ts` as seam locations — these files do not exist in the repo. Plan 17-PATTERNS surfaced the gap; Plan 17-05 reconciled by inlining the seams into the actual cache-touching files (src/pages/api/chat.ts message_start branch + src/scripts/chat.ts streamChat finally-block). Per CLAUDE.md 'Don't add abstractions beyond what the task requires' — creating empty wrapper modules would have been over-abstraction. REQUIREMENTS.md DEBT-02 row updated post-execution to reflect the actual seam locations."
  - "Client-side log uses a distinct event name `chat.response_metrics_client` (NOT `chat.cache_metrics`). Server emits `chat.cache_metrics` with token counts to Workers Logs; client emits `chat.response_metrics_client` with `elapsed_ms` to DevTools Console. The client cannot read cache token fields through the SSE stream (D-15 anchor forbids the server from enqueueing them), so the client measurement is structurally different from the server's. Distinct event names prevent ambiguity when filtering Workers Logs vs DevTools Console — same name would imply same measurement."
  - "Client seam placed in a `finally` block at the outer try/catch of streamChat(), NOT inserted at each of the 5 exit paths. The function has 3 onError early returns (status 429, !response.ok, !response.body), 1 onDone early return (`[DONE]` frame), 1 natural loop end, 1 catch (abort + api_error). Insertion at each site would be error-prone (forget one → biased metrics; introduce a new early return in a future plan → break the seam). The finally-block covers every exit by language contract; the closure-capture of `t0` is one variable cost. Per Plan 17-05 §'Pattern: finally-block instrumentation'."
  - "TEST-03 snapshot test asserts byte-equality on `JSON.stringify(args.system)` across two calls with different messages, in addition to no-sessionId-substring and no-UUIDv4-pattern. The first two are necessary; byte-equality is sufficient (and the actual cache-hit predicate Anthropic evaluates). A future regression could thread sessionId via template concatenation into the system prompt text — the substring checks would miss it but the byte-equality check would catch it. The 5-test surface is intentionally redundant: cheap to maintain, defends against multiple regression shapes."
  - "Rule 3 auto-fix (typecheck-annotation in Task 1 test file) bundled into Task 2's commit, NOT amended into Task 1's commit. Per Git Safety Protocol 'Always create NEW commits rather than amending' — Task 1's commit `7c3827e` stays unchanged; Task 2's commit `e54f09d` includes both the client-seam edit AND the one-line typecheck fix. The annotation `(c: unknown[])` is the canonical pattern; pre-existing similar errors in tests/client/listener-dedup.test.ts (Plan 17-03 commit `0ad77b3`) are out-of-scope and logged in deferred-items.md."
  - "deferred-items.md append documents the broader silent-typecheck-regression pattern: no plan since Plan 17-03 has run `pnpm build` / `astro check` on `main`. The 2 listener-dedup.test.ts errors have been on `main` for 3 plan close-outs (17-03 → 17-04 → 17-05 baseline). `pnpm test` (vitest) doesn't run `astro check`; `pnpm build` does. Phase 17 close-out (Plan 17-06 metadata commit OR a /gsd-quick task) should retire `astro check` to zero. Logged as a closure-path candidate for Phase 18 first plan as a Rule 3 prerequisite — Phase 18 WILL touch chat surface and run `pnpm build` during normal development."

patterns-established:
  - "Inline observability seams over factored modules — when a planned seam location doesn't exist in the repo, reconcile by inlining the seam at the actual touching site rather than creating empty wrapper modules. Decision-tree: if the seam is < 20 LOC AND has a single call site, inline it; if it's > 20 LOC OR has multiple call sites, factor it. DEBT-02 server seam is ~10 LOC at a single call site → inline; client seam is ~5 LOC at a single call site → inline."
  - "Distinct event names for related-but-distinct measurements across observability tiers — Plan 17-05 establishes `chat.cache_metrics` (server / Workers Logs / token counts) vs `chat.response_metrics_client` (client / DevTools / elapsed_ms proxy). Future cross-tier observability seams (e.g., Phase 18 META-02 transcript-email surfacing of the same cache token counts) should follow the pattern: name the event by where it emits, not just what it measures."
  - "Forward-defense snapshot tests in Phase N for contracts Phase N+1 will introduce — Plan 17-05 establishes the pattern of authoring a snapshot test BEFORE the implementation that risks regression lands. Phase 18 IDENT-02 (sessionId introduction) is the highest-risk moment for accidental Anthropic-payload leakage; the TEST-03 snapshot at tests/api/anthropic-payload-shape.test.ts locks the regression bar in Phase 17 so Phase 18 cannot accidentally regress without a failing test."
  - "`finally`-block instrumentation for streamChat()-shaped functions — when a function has multiple early-return + catch exit paths and an instrumentation seam must fire on every path, hoist the timer/sink outside the try and the log line into the outer `finally` block. The pattern is composable with the existing AbortController + timeout cleanup at clearTimeout(timeout) in catch — both leverage 'cleanup runs on every exit' semantics."
  - "Byte-equality assertion for cache-integrity tests — when defending a contract that downstream evaluates as byte-equality (Anthropic prompt-cache hit predicate), the test must also evaluate byte-equality. Substring-presence checks are strictly weaker. Combine both for layered defense: substring-presence catches the obvious threading shape; byte-equality catches the non-obvious threading (template concatenation, conditional injection)."

requirements-completed: [DEBT-02, TEST-03]

# Metrics
duration: ~11min (start 2026-05-10T22:55:44Z, end 2026-05-10T23:07:00Z)
completed: 2026-05-10
---

# Phase 17 Plan 05: DEBT-02 Cache-Hit Observability + TEST-03 Anthropic Payload-Shape Forward-Defense Summary

**Both DEBT-02 (chat cache-hit-rate observability — Phase 14 deferred for 17 days, scheduled into Phase 17 by D-09 ordering) and TEST-03 (Anthropic prompt-cache integrity forward-defense) closed in 3 atomic commits. The server-side `chat.cache_metrics` structured log now fires per Anthropic response at the `message_start` SSE event in src/pages/api/chat.ts; the client-side `chat.response_metrics_client` DEV-only log fires per streamChat() invocation in src/scripts/chat.ts gated on `import.meta.env.DEV` (Vite tree-shakes it from production dist bundles). The TEST-03 snapshot at tests/api/anthropic-payload-shape.test.ts locks the current clean state forward — Phase 18 IDENT-02 (sessionId introduction) cannot regress the Anthropic prompt-cache without a failing test. D-15 SSE byte-identical anchor preserved end-to-end (TEST-02 sse-snapshot 3/3 GREEN after both chat-surface commits — the seam is `console.log` only, never `controller.enqueue`). Full vitest suite went from 376 → 384 tests (+8 additive: 3 cache-hit-logs + 5 anthropic-payload-shape). D-26 chat regression battery 383 PASS / 1 FAIL pre-existing GREEN at every commit per CONTEXT.md D-10 cadence. 1 Rule-3 deviation auto-fixed (typecheck-annotation on Task 1's test file bundled into Task 2's commit per Git Safety Protocol "never amend"). 1 pre-existing typecheck-error class surfaced and documented in deferred-items.md as out-of-scope (2 ts(7006) implicit-any in tests/client/listener-dedup.test.ts from Plan 17-03 commit `0ad77b3` — no plan since has run `pnpm build` / `astro check` to catch them).**

## Performance

- **Implementation duration:** ~11 min (Task 1 commit 22:57 UTC → Task 3 commit 23:06 UTC)
- **Started:** 2026-05-10T22:55:44Z (post-baseline verification)
- **Closed out:** 2026-05-10T23:07:00Z (this metadata commit)
- **Tasks:** 3 autonomous TDD commits (no checkpoints — RED → GREEN on Task 1 clean, finally-block edit on Task 2, snapshot test on Task 3)
- **Files created:** 2 (tests/api/cache-hit-logs.test.ts, tests/api/anthropic-payload-shape.test.ts)
- **Files modified:** 2 source (src/pages/api/chat.ts, src/scripts/chat.ts) + 1 planning meta (.planning/phases/.../deferred-items.md)

## Accomplishments

- **DEBT-02 (server-side `chat.cache_metrics` log seam):** Added an `else if (event.type === "message_start")` branch to the SSE stream loop in src/pages/api/chat.ts. When Anthropic's streaming response yields a `message_start` event, the handler emits a single `console.log("chat.cache_metrics", { cache_read_input_tokens, cache_creation_input_tokens, input_tokens, output_tokens })` line — flat-primitive fields only, defaulting to 0 when omitted. Cloudflare Workers Logs / wrangler tail parse the second arg as JSON for query/filter. NO new SSE frame type added; no `controller.enqueue()` call touched (D-15 anchor preserved — TEST-02 sse-snapshot 3/3 GREEN post-edit).
- **DEBT-02 (client-side `chat.response_metrics_client` DEV-only log seam):** Added a `t0 = performance.now()` capture before the fetch + a `finally`-block log line at the end of streamChat() in src/scripts/chat.ts. The log fires on every exit path (3 onError early returns, 1 onDone early return, 1 natural loop end, 1 catch) by `finally`-block contract. Gated on `import.meta.env.DEV` per the existing `[chat:analytics]` debug-log pattern at chat.ts:392-395; Vite tree-shakes the entire block from production dist bundles. Emits `elapsed_ms` as a cache-hit proxy (the client cannot read cache token fields through SSE — D-15 anchor — so total-stream duration is the canonical client-tier signal). Event name is intentionally distinct from the server's `chat.cache_metrics` so grep against Workers Logs (server emissions) vs DevTools Console (client emissions) stays unambiguous.
- **TEST-03 forward-defense snapshot:** Authored tests/api/anthropic-payload-shape.test.ts — 5 tests asserting (1) `system` block does not contain literal `sessionId`, (2) `system` block does not contain a UUIDv4 pattern, (3) `messages[0]` does not contain literal `sessionId`, (4) `messages[0]` does not contain a UUIDv4 pattern, (5) `system` block is byte-identical across two calls with different messages payloads (Anthropic's prompt-cache hit predicate). All 5/5 GREEN on the current Phase 17 source tree (no sessionId yet — Phase 18 IDENT-02 introduces it). Test 5 (byte-equality) is the load-bearing assertion: substring checks (Tests 1-4) catch the obvious threading shape, but byte-equality catches non-obvious threading (template concatenation, conditional injection). Layered defense for one-time-cheap snapshot test cost.
- **TEST-01 (D-26 chat regression battery):** Plan 17-05 TOUCHED chat-surface files (api/chat.ts + chat.ts) so the D-26 cadence per CONTEXT.md D-10 was **blocking**, not informational. Full vitest suite ran after every commit; result 383 PASS / 1 FAIL pre-existing GREEN at each checkpoint. Cross-phase gate remains open for Phase 18 IDENT-01/02 + META-02.
- **TEST-02 (D-15 SSE byte-identical anchor):** Preserved end-to-end. The DEBT-02 server seam is `console.log` only — no `controller.enqueue()` call modified. tests/api/sse-snapshot.test.ts 3/3 GREEN after the Task 1 server-seam edit and again after the Task 2 client-seam edit. The fixture at tests/fixtures/sse-snapshot-frames.bin remains byte-identical to the response body of /api/chat for the canonical 1-token "Hello" response.
- **Rule 3 auto-fix (Task 1 test file typecheck-annotation):** Task 1's `tests/api/cache-hit-logs.test.ts` introduced 2 `ts(7006)` errors under `astro check` (implicit-any on the `find()` callback param). Per Git Safety Protocol "never amend" — fixed in Task 2's commit via one-line annotation `(c: unknown[])` matching the canonical pattern. astro check error count: 4 at HEAD~1 of Plan 17-05 (2 pre-existing in listener-dedup.test.ts + 2 my Task 1 errors) → 2 at HEAD of Plan 17-05 (only the pre-existing listener-dedup ones remain).
- **Pre-existing typecheck-error documentation in deferred-items.md:** Tests/client/listener-dedup.test.ts:161 + :164 have implicit-any errors that landed on `main` via Plan 17-03 commit `0ad77b3` (2026-05-10). No plan since (17-03 → 17-04 → 17-05 baseline) has run `pnpm build` / `astro check` — only `pnpm test` (vitest) which doesn't typecheck. The errors silently accumulated. Logged as out-of-scope for Plan 17-05; closure path is a 2-line annotation fix (candidate for /gsd-quick OR Phase 18 first plan as a Rule 3 prerequisite — Phase 18 WILL run `pnpm build` during normal development).

## Task Commits

Each task was committed atomically per the plan's `<done>` blocks:

1. **Task 1: DEBT-02 server-side log seam + cache-hit-logs test** — `7c3827e` (feat)
   - Commit message: `feat(17-05): DEBT-02 — server-side chat.cache_metrics log seam (api/chat.ts)`
   - Files: `src/pages/api/chat.ts` (+15/-0), `tests/api/cache-hit-logs.test.ts` (+162, new)
   - TDD: RED phase confirmed (2/3 fail before seam) → GREEN phase confirmed (3/3 pass after seam).
   - State at commit: 378 PASS / 1 FAIL pre-existing; D-15 sse-snapshot 3/3 GREEN; D-26 chat regression battery GREEN.
2. **Task 2: DEBT-02 client-side dev observability seam + Rule-3 auto-fix + deferred-items append** — `e54f09d` (feat)
   - Commit message: `feat(17-05): DEBT-02 — client-side dev observability seam (chat.ts)`
   - Files: `src/scripts/chat.ts` (+25/-1), `tests/api/cache-hit-logs.test.ts` (+2/-2 — typecheck annotation), `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md` (+59/-0)
   - State at commit: 378 PASS / 1 FAIL pre-existing (no new tests; Task 2 is a DEV-only observability seam with manual verification only per plan); D-15 sse-snapshot 3/3 GREEN; D-26 chat regression battery GREEN; `astro check` 2 errors (pre-existing listener-dedup.test.ts only, down from 4).
3. **Task 3: TEST-03 forward-defense snapshot** — `19471fe` (test)
   - Commit message: `test(17-05): TEST-03 — Anthropic payload shape snapshot (no sessionId in cacheable surface)`
   - Files: `tests/api/anthropic-payload-shape.test.ts` (+69, new)
   - State at commit: 383 PASS / 1 FAIL pre-existing (5 new tests in the snapshot file, all GREEN); D-15 sse-snapshot 3/3 GREEN; D-26 chat regression battery GREEN.

**Plan metadata commit:** *(this commit — SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md)*

## Files Created/Modified

| Path | Status | Purpose |
|------|--------|---------|
| `src/pages/api/chat.ts` | modified (+15/-0) | Added `else if (event.type === "message_start")` branch to the SSE stream loop. Emits `console.log("chat.cache_metrics", { cache_read_input_tokens, cache_creation_input_tokens, input_tokens, output_tokens })` per Anthropic response. Flat-primitive fields default to 0 when omitted. NO controller.enqueue() touched — D-15 anchor preserved. |
| `src/scripts/chat.ts` | modified (+25/-1) | Added `const t0 = performance.now()` capture before fetch + `finally`-block DEV-only log line `console.log("chat.response_metrics_client", { elapsed_ms })`. Gated on `import.meta.env.DEV` so Vite tree-shakes the block from production dist bundles. Mirrors the existing `[chat:analytics]` debug-log gating idiom at chat.ts:392-395. |
| `tests/api/cache-hit-logs.test.ts` | created (+162) | DEBT-02 server-seam tests (3 tests, all GREEN): populated-usage emits expected JSON shape; missing-field defaults to 0; SSE-byte-clean anti-regression (no `cache_*` substrings in response body — D-15 anchor double-lock). Mocks `cloudflare:workers` virtual module + `@anthropic-ai/sdk` async-iterable yielding `message_start` with usage + `content_block_delta`. |
| `tests/api/anthropic-payload-shape.test.ts` | created (+69) | TEST-03 forward-defense snapshot (5 tests, all GREEN): no `sessionId` literal in `system`; no UUIDv4 in `system`; no `sessionId` literal in `messages[0]`; no UUIDv4 in `messages[0]`; `system` block byte-identical across calls with different messages (Anthropic's prompt-cache hit predicate). Locks Phase 17 clean state forward for Phase 18 IDENT-02. |
| `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md` | modified (+59/-0) | New "Discovered during Plan 17-05" section documenting the pre-existing tests/client/listener-dedup.test.ts implicit-any errors (Plan 17-03 commit `0ad77b3`). Out-of-scope for Plan 17-05; closure path is a 2-line annotation fix candidate for /gsd-quick or Phase 18 first plan as a Rule 3 prerequisite. |
| `.planning/STATE.md` | modified | Plan position 17-04 → 17-05; progress 4/6 → 5/6 (67% → 83%); Open Blockers cache-hit observability bullet marked CLOSED with full closure detail; new "Plan 17-05 execution decisions" section in Accumulated Context > Decisions; Session Continuity stopped-at + resume-file + next-command updated for Plan 17-06. |
| `.planning/ROADMAP.md` | modified | Phase 17 progress 4/6 → 5/6; Wave 4 17-05-PLAN.md bullet marked complete with full commit + result summary. |
| `.planning/REQUIREMENTS.md` | modified | DEBT-02 unchecked → checked (`[x]`) with full closure detail; TEST-03 unchecked → forward-defense-implemented (`[~]`) with full snapshot-test description; traceability table DEBT-02 + TEST-01 + TEST-03 rows updated; "Last updated" footer refreshed. |

## Decisions Made

- **REQUIREMENTS.md DEBT-02 wording referenced `src/lib/chat-cache.ts` + `src/lib/content-snapshot.ts` as seam locations — these files do not exist in the repo.** Plan 17-PATTERNS surfaced the gap at plan-time; Plan 17-05 reconciled by inlining the seams into the actual cache-touching files. Per CLAUDE.md "Don't add abstractions beyond what the task requires" — the seams are 10 LOC (server) + 5 LOC (client); a dedicated module would be over-abstraction. REQUIREMENTS.md DEBT-02 row updated post-execution to reflect the actual seam locations. Future plan-authoring pattern: when a plan's `files_modified` lists a file that doesn't exist, the planner MUST resolve the gap at plan-time (either create the file as a new artifact OR reconcile the file reference to an existing inline seam) — leaving it to executor discretion risks scope drift.
- **Client-side log uses a distinct event name `chat.response_metrics_client` (NOT `chat.cache_metrics`).** The client cannot read `cache_read_input_tokens` through the SSE stream (D-15 anchor forbids the server from enqueueing it). So the client measurement is structurally different from the server's — `elapsed_ms` is a cache-hit PROXY (faster TTFB / total-stream → likely cache hit). Same event name would imply same measurement. Distinct names → unambiguous grep / filter behavior across Workers Logs (server emissions) vs DevTools Console (client emissions).
- **Client seam placed in a `finally` block at the outer try/catch of streamChat(), NOT inserted at each of the 5 exit paths.** streamChat() has 3 onError early returns + 1 onDone early return + 1 natural loop end + 1 catch — inserting the log line at each site would be error-prone (forget one → biased metrics; introduce a new early return in a future plan → break the seam). The finally-block covers every exit by language contract; the closure-capture of `t0` outside the try is one variable cost. Pattern composes with the existing AbortController + timeout cleanup at `clearTimeout(timeout)` in catch — both leverage "cleanup runs on every exit" semantics.
- **TEST-03 snapshot test asserts byte-equality on `JSON.stringify(args.system)` across two calls with different messages, in addition to no-sessionId-substring and no-UUIDv4-pattern.** Substring-presence checks are necessary; byte-equality is sufficient (and the actual cache-hit predicate Anthropic evaluates). A future regression that threads sessionId via template concatenation into the system prompt text would slip past substring checks but fail byte-equality. The 5-test surface is intentionally redundant: cheap to maintain, defends against multiple regression shapes. Layered defense for one-time-cheap snapshot test cost.
- **Rule 3 auto-fix bundled into Task 2's commit, NOT amended into Task 1's commit.** Per Git Safety Protocol "Always create NEW commits rather than amending" — Task 1's commit `7c3827e` stays unchanged; Task 2's commit `e54f09d` includes both the client-seam edit AND the one-line typecheck fix. The annotation `(c: unknown[])` is the canonical pattern (matches what tests/client/listener-dedup.test.ts SHOULD have used). Pre-existing similar errors in listener-dedup.test.ts are out-of-scope and logged in deferred-items.md.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Typecheck-annotate `(c)` to `(c: unknown[])` in Task 1's test file find() callbacks**

- **Found during:** Task 2 verification (post `pnpm build` invocation, after the client-seam edit landed in chat.ts)
- **Issue:** Task 1's commit `7c3827e` introduced `tests/api/cache-hit-logs.test.ts` with two `logSpy.mock.calls.find((c) => c[0] === "chat.cache_metrics")` callbacks. Under `tsconfig.json extends astro/tsconfigs/strict`, the implicit `any` type of `c` triggered `ts(7006)` errors. `pnpm build` runs `astro check` which exits non-zero on the errors, blocking production deploys.
- **Why it matters:** Rule 3 applies — directly caused by Task 1's commit; blocks deploys; the plan must not add new typecheck errors to `main`. Pre-existing similar errors in `tests/client/listener-dedup.test.ts` (Plan 17-03 commit `0ad77b3`) DO exist on `main` — but those are not Plan 17-05's responsibility.
- **Fix:** Annotated both callbacks as `(c: unknown[]) => c[0] === "chat.cache_metrics"`. The `vi.spyOn(console, "log").mock.calls` array is typed as `any[][]` under vitest's MockInstance — `unknown[]` is the safe narrowing that lets the index access `c[0]` proceed (still requires `cacheMetricsCall![1] as Record<string, number>` cast on the second arg, which the test already has).
- **Files modified:** `tests/api/cache-hit-logs.test.ts` (+2/-2 — both `find()` callback signatures).
- **Verification:** `pnpm exec astro check` post-fix reports 2 errors (down from 4) — only the pre-existing listener-dedup.test.ts errors remain. `pnpm test tests/api/cache-hit-logs.test.ts` GREEN (3/3); full suite GREEN.
- **Committed in:** `e54f09d` (Task 2 commit — bundled with the client-seam edit per Git Safety Protocol "never amend").

**2. [Out-of-scope discovery] Pre-existing implicit-any errors in tests/client/listener-dedup.test.ts logged to deferred-items.md**

- **Found during:** Task 2 verification (same `pnpm build` invocation that surfaced Deviation §1)
- **Issue:** `astro check` reports 4 ts(7006) errors at HEAD~1 of Plan 17-05 — 2 in my new cache-hit-logs.test.ts (Deviation §1) and 2 in tests/client/listener-dedup.test.ts at lines 161 and 164. The listener-dedup ones landed on `main` via Plan 17-03 commit `0ad77b3` (2026-05-10) and have been there for 3 plan close-outs.
- **Root cause:** No plan since 17-03 has run `pnpm build` / `astro check`. `pnpm test` (vitest) doesn't typecheck. The errors silently accumulated because the CI workflow (sync-check.yml) doesn't run `astro check` either — only `pnpm sync:check` + `pnpm build:chat-context:check`. Production deploys via `wrangler deploy` run `pnpm build` end-to-end and would have caught this if anyone deployed since Plan 17-03 — but Plan 17-02's production cutover predates 17-03, so the live site is unaffected.
- **Plan 17-05 scope decision:** Per execution deviation rules — "Only auto-fix issues DIRECTLY caused by the current task's changes" — out of scope for Plan 17-05 (DEBT-02 + TEST-03). Logged in `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md` (new "Discovered during Plan 17-05" section).
- **Closure path:** 2-line annotation fix at listener-dedup.test.ts:161 + :164 — change `(c)` to `(c: unknown[])`. Candidate for `/gsd-quick` OR fold into Phase 18 first plan as a Rule 3 auto-fix prerequisite (Phase 18 WILL touch chat surface and run `pnpm build` during normal development).
- **Impact:** Production deploys via `wrangler deploy` will fail until the closure-path fix lands. Live site is unaffected (last deploy predates the errors). Plan 17-06 (DNS warmup, no source touches) will not run `pnpm build` so won't be blocked.

---

**Total deviations:** 1 auto-fixed (Rule 3 — typecheck-annotation on Task 1's test file, bundled into Task 2 per Git Safety Protocol) + 1 out-of-scope discovery (pre-existing listener-dedup.test.ts implicit-any errors, logged in deferred-items.md). Plus the 1 pre-existing deferred `roadmap-amendment.test.ts` failure carried forward from 17-01 (unchanged in nature; NOT caused by Plan 17-05).

**Impact on plan:** The Rule 3 deviation was a 2-line typecheck-annotation fix on a test file Plan 17-05 itself introduced — the simplest possible auto-fix. The out-of-scope discovery is documented but unaddressed; closure-path is queued for Phase 18 first plan. Neither affects the substantive DEBT-02 + TEST-03 closure that Plan 17-05 is contracted to deliver.

## Test Count Delta

- **Before Plan 17-05:** 376 tests (post-Plan 17-04 close-out commit `84c6493`).
- **After Plan 17-05:** 384 tests (post-this metadata commit).
- **Net delta:** +8 tests (additive — 3 new tests in `tests/api/cache-hit-logs.test.ts` + 5 new tests in `tests/api/anthropic-payload-shape.test.ts`).
  - cache-hit-logs (DEBT-02 server): populated-usage emits expected JSON shape; missing-field defaults to 0; SSE-byte-clean anti-regression (D-15 anchor).
  - anthropic-payload-shape (TEST-03 forward-defense): no sessionId literal in system; no UUIDv4 in system; no sessionId literal in messages[0]; no UUIDv4 in messages[0]; system byte-identical across calls (Anthropic prompt-cache hit predicate).

**Pre-existing failure carried forward:** `tests/content/roadmap-amendment.test.ts` (1/1 RED), documented in `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md`. Unrelated to chat-surface or to Plan 17-05 scope; carried forward from 17-01. Full suite is 383/384 GREEN at plan close.

## D-26 Chat Regression Battery

Plan 17-05 TOUCHED chat-surface files (src/pages/api/chat.ts + src/scripts/chat.ts) so the D-26 cadence per CONTEXT.md D-10 was **blocking**, not informational. Full `pnpm test` ran after every commit; result GREEN at every checkpoint.

| Checkpoint | Battery State | Notes |
|------------|---------------|-------|
| Pre-Task 1 (HEAD = `84c6493`) | 375/376 GREEN (1 pre-existing FAIL) | Baseline at HEAD of Plan 17-04 close-out. |
| Post-Task 1 (`7c3827e`) | 378/379 GREEN (1 pre-existing FAIL) | Server seam in api/chat.ts + 3 new cache-hit-logs tests all GREEN. D-15 sse-snapshot 3/3 GREEN. |
| Post-Task 2 (`e54f09d`) | 378/379 GREEN (1 pre-existing FAIL) | Client seam in chat.ts (no new vitest tests — DEV-only observability seam; plan spec'd manual verification only). D-15 sse-snapshot 3/3 GREEN. |
| Post-Task 3 (`19471fe`) | 383/384 GREEN (1 pre-existing FAIL) | TEST-03 snapshot test 5/5 GREEN. D-15 sse-snapshot 3/3 GREEN. |
| Phase-end (post this metadata commit) | 383/384 GREEN expected | Metadata commit touches only `.planning/**` — no chat-surface mutation. |

## Manual DEV Verification (Task 2 Client Seam)

Per the Task 2 `<action>` spec, the client-side DEV-only log line is verified observationally rather than via vitest (it's a debug aid, not behavior). The plan spec'd:

```bash
pnpm dev
# Open http://localhost:4321/, click chat bubble, send a message
# DevTools Console MUST show one chat.response_metrics_client log line per response,
# with shape { elapsed_ms: <int>, ... }
```

**Status:** Manual verification deferred to next user-driven DEV session. The structural guarantee is in place — `if (import.meta.env.DEV)` is the canonical Vite/Astro tree-shaking gate; `performance.now()` is universally available in browsers; the log line is structurally identical to the existing `[chat:analytics]` pattern at chat.ts:392-395 that's been in production since Phase 15. The `finally`-block placement ensures the seam fires on every exit path of streamChat() by language contract. Risk of the manual verification surfacing a behavioral regression is minimal; risk of structural regression is zero (vitest suite GREEN, `astro check` clean for this file).

**Future closure:** Next time the user runs `pnpm dev` for any reason (Phase 18 planning, OG image authoring, mobile-menu breakpoint review), open chat panel + send a message and visually confirm the log line. If not present, raise as a Phase 18 Rule 1 deviation (bug — instrumentation seam doesn't fire).

## Issues Encountered

- **Pre-existing typecheck regression in tests/client/listener-dedup.test.ts surfaced during Task 2 `pnpm build`.** 2 ts(7006) implicit-any errors landed on `main` via Plan 17-03 commit `0ad77b3` (2026-05-10) and accumulated through Plans 17-03 → 17-04 → 17-05 baseline because no plan ran `astro check`. Caught when Task 2's `pnpm build` invocation surfaced 4 total errors (2 mine in cache-hit-logs.test.ts, 2 pre-existing). My 2 fixed inline (Rule 3 deviation); the pre-existing 2 logged in deferred-items.md as out-of-scope. The broader pattern (no plan since 17-03 has run `pnpm build`) is documented in STATE.md Accumulated Context > Decisions > Plan 17-05 execution decisions as a future plan-authoring lesson: phase-end close-out gates should include `pnpm exec astro check` explicitly, not just `pnpm test`. Phase 17 close-out (Plan 17-06 metadata commit OR a /gsd-quick task) should retire `astro check` to zero.
- **Pre-existing roadmap-amendment.test.ts failure remained.** Carried forward from 17-01's deferred-items.md per the carry-forward pattern. Unrelated to Plan 17-05 scope. Final count: 383 PASS / 1 FAIL (pre-existing).

## Threat Flags

*(No new security surface introduced. DEBT-02 is observability seams — structured log emission only, no inbound trust boundary changes. TEST-03 is forward-defense — strengthens an existing cache-integrity contract. The threat register from Plan 17-05 frontmatter `<threat_model>` is closed in full: T-17-06 mitigated by Task 1 Test 3 — SSE response body asserts no `cache_*` substrings, double-locked with TEST-02 byte-identical snapshot; T-17-L accepted as documented; T-17-M mitigated by Task 3's 5-test surface; T-17-N mitigated by `import.meta.env.DEV` gating + Vite tree-shaking; T-17-O mitigated by TEST-03 forward-defense — Phase 18 IDENT-02 cannot regress without a failing test.)*

## Self-Check

Verifications performed before recording PASS:

- File `.planning/phases/17-foundations-migration-dns-debt-sweep/17-05-SUMMARY.md` — EXISTS (this file).
- Commit `7c3827e` (Task 1 — DEBT-02 server seam + cache-hit-logs test): `git log --oneline --all | grep 7c3827e` → FOUND.
- Commit `e54f09d` (Task 2 — DEBT-02 client seam + Rule-3 auto-fix + deferred-items append): `git log --oneline --all | grep e54f09d` → FOUND.
- Commit `19471fe` (Task 3 — TEST-03 forward-defense snapshot): `git log --oneline --all | grep 19471fe` → FOUND.
- File `tests/api/cache-hit-logs.test.ts` EXISTS (created in Task 1, 162 lines including the Rule-3 typecheck-annotation update from Task 2's commit).
- File `tests/api/anthropic-payload-shape.test.ts` EXISTS (created in Task 3, 69 lines).
- `src/pages/api/chat.ts`: contains `event.type === "message_start"` branch; contains `console.log("chat.cache_metrics"`; does NOT contain `controller.enqueue` call referencing cache (verified via grep — only comment mentions remain at chat.ts:151, :238).
- `src/scripts/chat.ts`: contains `chat.response_metrics_client`; contains `import.meta.env.DEV` gating; contains `performance.now()` capture + `finally` block log line; does NOT enqueue any new SSE frame related to cache.
- `tests/api/anthropic-payload-shape.test.ts`: contains imports from `../../src/prompts/chat-request-shape`; contains UUIDv4 regex check pattern; contains 5 tests under a single describe block.
- `pnpm test tests/api/cache-hit-logs.test.ts` GREEN (3/3).
- `pnpm test tests/api/anthropic-payload-shape.test.ts` GREEN (5/5).
- `pnpm test tests/api/sse-snapshot.test.ts` GREEN (3/3 — D-15 anchor preserved, TEST-02).
- `pnpm test` — 383 PASS / 1 FAIL (the 1 FAIL is pre-existing `tests/content/roadmap-amendment.test.ts`, carried forward from 17-01).
- `pnpm exec astro check` — 2 errors (down from 4 at HEAD~1 of Plan 17-05; 2 remaining are pre-existing listener-dedup.test.ts errors logged in deferred-items.md as out-of-scope).
- STATE.md: completed_plans=5, percent=83, Current Position references Plan 17-06 as next, Open Blockers cache-hit observability bullet marked CLOSED, new Plan 17-05 execution decisions section in Accumulated Context.
- ROADMAP.md: Phase 17 progress bar 5/6 (was 4/6); Wave 4 17-05-PLAN.md bullet marked complete.
- REQUIREMENTS.md: DEBT-02 row checked `[x]` with full closure detail; TEST-03 row forward-defense-implemented `[~]`; traceability table DEBT-02 row updated.

## Self-Check: PASSED

## Next Phase Readiness

- **Plan 17-06 (Wave 5 — DNS-01 Resend domain records + DNS-02 warmup sends + Postmaster Tools enrollment) is unblocked.** Per CONTEXT.md D-08, Plan 17-06 runs LAST in Phase 17 against an all-GREEN code surface so a malformed warmup send isn't debugged simultaneously with chat regressions. Plan 17-05 (final code-change plan) closed all chat-surface mutations for Phase 17; the surface is now stable for DNS work.
- **DEBT-02 closed end-to-end.** Cache-hit-rate observability wired at server (Workers Logs) and client (DevTools Console DEV-only) tiers. The Phase 14 deferred observability gap (17 days, since 2026-04-23) is resolved.
- **TEST-03 forward-defense in place.** Phase 18 IDENT-02 implementation MUST keep the 5-test snapshot at tests/api/anthropic-payload-shape.test.ts GREEN. If it regresses, fix at the source (route sessionId through the HTTP envelope — request header or non-cached body field), not by editing the test.
- **TEST-01 cross-phase gate still holding.** D-26 383 PASS / 1 FAIL pre-existing GREEN at phase point (Plan 17-05 close). Will re-validate at end of Plan 17-06 (informational — no source touches) and again at Phase 17 close. Phase 18 will re-validate it as a blocking gate on every chat-surface commit.
- **`astro check` regression closure path queued.** 2 pre-existing implicit-any errors in tests/client/listener-dedup.test.ts logged in deferred-items.md. Phase 17 close-out OR Phase 18 first plan should retire `astro check` to zero. Production deploys via `wrangler deploy` will fail until then; live site is unaffected (last deploy predates the errors).
- **`chat-cache.ts` / `content-snapshot.ts` reconciliation documented.** REQUIREMENTS.md DEBT-02 row updated to reflect actual seam locations (inline in api/chat.ts + chat.ts) rather than the originally-spec'd non-existent files. Future plans referencing those locations should be updated; the canonical pattern is now "inline observability seams over factored modules" per Plan 17-05 patterns-established.

---
*Phase: 17-foundations-migration-dns-debt-sweep*
*Plan: 17-05*
*Completed: 2026-05-10*
