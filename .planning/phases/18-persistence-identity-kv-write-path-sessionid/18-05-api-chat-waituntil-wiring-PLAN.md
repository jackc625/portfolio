---
phase: 18-persistence-identity-kv-write-path-sessionid
plan: 05
type: execute
wave: 2
depends_on: [01, 02, 03, 04]
files_modified:
  - src/pages/api/chat.ts
autonomous: true
requirements: [KV-01, KV-02, KV-03, KV-04, KV-05, IDENT-02, META-01, META-02, TEST-01, TEST-03]
must_haves:
  truths:
    - "api/chat.ts imports `appendTurn` from `../../lib/chat-transcripts` (KV-02 module wired)"
    - "Plan 18-01-verified `ctx` access expression (`locals.runtime.ctx` or alternative) is the SOLE path to `ExecutionContext.waitUntil` — no destructure (loses `this` binding per RESEARCH Pitfall 1)"
    - "USER-TURN write fires AFTER `validateRequest` succeeds, BEFORE Anthropic stream open (D-10 durability anchor) — `ctx.waitUntil(appendTurn(env.CHAT_KV, sid, \"user\", userContent, sessionMeta).catch(...))`"
    - "ASSISTANT-TURN write fires AFTER `controller.close()`, INSIDE the start(controller) closure (D-11 — accumulator strategy) — `ctx.waitUntil(appendTurn(env.CHAT_KV, sid, \"assistant\", accumulator, { cache_read_input_tokens, cache_creation_input_tokens }).catch(...))`"
    - "Token-accumulator pattern: `let accumulator = \"\"` declared at top of `start(controller)`; updated inline at the existing `content_block_delta` branch via `accumulator += event.delta.text`. Per-token KV writes NEVER happen (KV's 1-write/sec/key cap)"
    - "D-04 missing-tolerance branch: if `validation.data.sessionId` is undefined, NEITHER waitUntil call fires; SSE stream still serves normally"
    - "Both waitUntil calls chain `.catch((err) => { console.error(\"chat.transcript.write_failed\", { sessionId, role, error_class, [content_length for assistant] }) })` BEFORE the promise is passed to waitUntil (rejection-safe per RESEARCH Pitfall 1)"
    - "META-02: assistant-turn meta carries `cache_read_input_tokens` + `cache_creation_input_tokens` sourced from the SAME `cacheUsage` closure object the `chat.cache_metrics` log line consumes (source-of-truth-once)"
    - "META-01: first-turn metadata captures `referrer` from `request.headers.get(\"Referer\")`, `user_agent` from `request.headers.get(\"User-Agent\")`, `country`/`region`/`colo` from defensive read of `request.cf` (null if absent per Pitfall 4). Truncation to 512 chars happens inside `appendTurn` (Plan 18-02 module owns it — caller passes raw)"
    - "D-15 SSE bytes BYTE-IDENTICAL to pre-Plan-18-05 baseline: `tests/api/sse-snapshot.test.ts` 3/3 GREEN. The two waitUntil calls land OFF the controller-enqueue path"
    - "TEST-03 forward-defense: `tests/api/anthropic-payload-shape.test.ts` 8/8 GREEN (5 legacy + 3 D-16 — including Test (b) source-text guard catching any accidental sessionId reference in src/prompts/chat-request-shape.ts)"
    - "D-26 chat regression battery FULL suite GREEN at commit close — Plan 18-05 is the highest-D-26-risk commit in Phase 18 because it touches the most-protected file"
  artifacts:
    - path: "src/pages/api/chat.ts"
      provides: "Two ctx.waitUntil(appendTurn(...)) call sites + sessionMeta capture helper + accumulator wiring"
      contains: "appendTurn"
      min_lines: 230
  key_links:
    - from: "src/pages/api/chat.ts validateRequest call site"
      to: "USER-TURN ctx.waitUntil(appendTurn(...)) (D-10 anchor)"
      via: "sequential code path — waitUntil fires AFTER validateRequest succeeds AND BEFORE client.messages.create"
      pattern: "ctx\\.waitUntil\\(\\s*appendTurn\\([^)]*[\"']user[\"']"
    - from: "src/pages/api/chat.ts controller.close()"
      to: "ASSISTANT-TURN ctx.waitUntil(appendTurn(...)) (D-11 anchor)"
      via: "sequential code path — waitUntil fires immediately AFTER controller.close() inside start(controller)"
      pattern: "controller\\.close\\(\\)[\\s\\S]*?ctx\\.waitUntil\\(\\s*appendTurn\\([^)]*[\"']assistant[\"']"
    - from: "src/pages/api/chat.ts cacheUsage closure object (line 107-111)"
      to: "appendTurn(assistant, ..., { cache_read_input_tokens, cache_creation_input_tokens })"
      via: "META-02 source-of-truth-once — pass the SAME closure object the chat.cache_metrics log line consumes"
      pattern: "cache_read_input_tokens.*cacheUsage|cacheUsage.*cache_read_input_tokens"
---

<objective>
Wire `src/pages/api/chat.ts` to call `appendTurn` (Plan 18-02 module) at two anchors per D-10 / D-11:
  - USER-TURN write: `ctx.waitUntil(appendTurn(env.CHAT_KV, sid, "user", userContent, sessionMeta).catch(...))` immediately AFTER `validateRequest` succeeds, BEFORE the Anthropic stream begins.
  - ASSISTANT-TURN write: `ctx.waitUntil(appendTurn(env.CHAT_KV, sid, "assistant", accumulator, { cache_read_input_tokens, cache_creation_input_tokens }).catch(...))` immediately AFTER `controller.close()`, INSIDE the start(controller) closure. Accumulator concatenated from `event.delta.text` in the existing `content_block_delta` branch.

Add the APIRoute `locals` destructure to access `ctx` via the path verified in Plan 18-01 SPIKE (typically `const ctx = locals.runtime.ctx;`). Add a `captureRequestMeta(request)` helper that defensively reads `request.cf.country/region/colo` (null fallbacks per Pitfall 4) and `request.headers.get("Referer")/"User-Agent"` for the first-turn metadata.

Apply D-04 missing-tolerance branch: if `validation.data.sessionId` is undefined, NEITHER waitUntil call fires. SSE stream still serves normally — chat UX preserved per D-26.

Apply META-02 source-of-truth-once: the existing closure-scoped `cacheUsage` object (api/chat.ts:107-111) that `console.log("chat.cache_metrics", ...)` reads from is passed BYTE-IDENTICAL into the assistant-turn `appendTurn` call's `meta` argument.

This is the HIGHEST-D-26-RISK commit in Phase 18 — it touches the most-protected file in the chat surface. Every existing test must stay GREEN at commit close. The D-15 SSE byte-identical anchor is non-negotiable: the two waitUntil calls land OFF the controller-enqueue path so `tests/api/sse-snapshot.test.ts` continues to pass.

Purpose: Wires the persistence layer from `chat-transcripts.ts` (Plan 18-02) into the actual request-handling code path. Every requirement in Phase 18 except IDENT-01 (client mint — Plan 18-06) flows through this plan. KV-01 (binding verification — env.CHAT_KV reach), KV-02..05 (appendTurn invocation), IDENT-02 (sessionId read from validation), META-01 (request.cf + Referer + UA captured here), META-02 (cacheUsage passed through), TEST-01 (D-26 hold at commit), TEST-03 (forward-defense + UAT) — all touch this plan.

Output: `src/pages/api/chat.ts` extended (~30 LOC additive) with the two waitUntil call sites + locals destructure + meta capture helper + accumulator wiring. Full test suite GREEN. D-15 byte-identical preserved.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/REQUIREMENTS.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-RESEARCH.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-VALIDATION.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-01-SUMMARY.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/SPIKE-ctx-access-path.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-02-SUMMARY.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-03-SUMMARY.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-04-SUMMARY.md
@src/pages/api/chat.ts
@src/lib/chat-transcripts.ts
@src/lib/validation.ts
</context>

<interfaces>
<!-- Locked import + access patterns Plan 18-05 uses -->

  // NEW imports at top of file (after existing imports):
  import { appendTurn, type AppendTurnMeta } from "../../lib/chat-transcripts";

  // APIRoute destructure change (line 15):
  // FROM: export const POST: APIRoute = async ({ request }) => {
  // TO:   export const POST: APIRoute = async ({ request, locals }) => {

  // ctx access — copy literal from SPIKE-ctx-access-path.md (Plan 18-01 verified):
  //   const ctx = locals.runtime.ctx;          // primary expected
  //   const ctx = (locals as any).runtime.ctx; // if TS narrowing requires a cast — confirm at task time
  //   // OR alternative path per SPIKE if locals.runtime.ctx unavailable

<!-- USER-TURN call site (D-10 — AFTER validateRequest succeeds at line ~81, BEFORE client.messages.create at line ~112) -->

  // The exact insertion point is between line 84 (`const messages = sanitizeMessages(...)`)
  // and line 87 (`const apiKey = env.ANTHROPIC_API_KEY;`).
  //
  // D-10 wiring (verbatim shape — comment cites the decision IDs the source-text test forward-defends):
  //
  //   // D-10 / D-04: user-turn KV write — fire-and-forget AFTER validation, BEFORE stream open.
  //   // .catch chains BEFORE waitUntil per RESEARCH § Pitfall 1 (silent-swallow rule).
  //   // Skipped entirely when sessionId absent per D-04 missing-tolerance branch — SSE stream still serves.
  //   if (validation.data.sessionId) {
  //     const sid = validation.data.sessionId;
  //     const userContent = messages[messages.length - 1].content;
  //     const sessionMeta = captureRequestMeta(request);
  //     ctx.waitUntil(
  //       appendTurn(env.CHAT_KV, sid, "user", userContent, sessionMeta).catch((err: unknown) => {
  //         console.error("chat.transcript.write_failed", {
  //           sessionId: sid,
  //           role: "user",
  //           error_class: err instanceof Error ? err.constructor.name : "unknown",
  //         });
  //       }),
  //     );
  //   }

<!-- ACCUMULATOR wiring (inside start(controller) — top of closure + content_block_delta branch) -->

  // Top of start(controller), BEFORE the existing `let truncated = false;` line (currently line 100):
  //   let accumulator = "";  // D-11: per-token assistant text concatenated; flushed once at controller.close.

  // Inside the content_block_delta branch (currently line 117-125), BETWEEN the controller.enqueue (line 121-125)
  // and the closing `}` of the branch:
  //   accumulator += event.delta.text;  // D-11 / META-02: source-of-truth-once for the assistant turn's KV write.

<!-- ASSISTANT-TURN call site (D-11 — AFTER controller.close() at line ~170, INSIDE start(controller)) -->

  // The insertion point is immediately AFTER `controller.close();` (currently line 170) and BEFORE the
  // existing closing brace of the try block (currently line 171).
  //
  // D-11 wiring (verbatim shape):
  //
  //   // D-11 / D-04 / META-02: assistant-turn KV write AFTER controller.close() — accumulator strategy
  //   // (NEVER per-token — KV's 1-write/sec/key cap would 429 the transcript).
  //   // Skipped entirely when sessionId absent (D-04) OR accumulator empty (edge: zero-token reply).
  //   // .catch chains BEFORE waitUntil per RESEARCH § Pitfall 1.
  //   if (validation.data.sessionId && accumulator) {
  //     const sid = validation.data.sessionId;
  //     ctx.waitUntil(
  //       appendTurn(env.CHAT_KV, sid, "assistant", accumulator, {
  //         referrer: null,        // META-01 first-turn pin honored inside appendTurn — passing null preserves
  //         user_agent: null,      // existing meta if the user-turn already pinned it.
  //         country: null,
  //         region: null,
  //         colo: null,
  //         cache_read_input_tokens: cacheUsage?.cache_read_input_tokens ?? 0,
  //         cache_creation_input_tokens: cacheUsage?.cache_creation_input_tokens ?? 0,
  //       }).catch((err: unknown) => {
  //         console.error("chat.transcript.write_failed", {
  //           sessionId: sid,
  //           role: "assistant",
  //           content_length: accumulator.length,
  //           error_class: err instanceof Error ? err.constructor.name : "unknown",
  //         });
  //       }),
  //     );
  //   }

<!-- captureRequestMeta helper -->

  // Declare ABOVE the POST export (after the existing imports + before line 15):
  //
  // function captureRequestMeta(request: Request): AppendTurnMeta {
  //   // META-01: first-turn metadata snapshot. Plan 18-02 appendTurn pins these on first turn
  //   // and preserves on subsequent turns; subsequent passes here are no-ops in the stored value.
  //   // RESEARCH § Pitfall 4: defensive read of request.cf — null fallback when wrangler dev mocks fields.
  //   const cf = (request as unknown as { cf?: { country?: string; region?: string; colo?: string } }).cf;
  //   return {
  //     referrer: request.headers.get("Referer"),
  //     user_agent: request.headers.get("User-Agent"),
  //     country: cf?.country ?? null,
  //     region: cf?.region ?? null,
  //     colo: cf?.colo ?? null,
  //   };
  // }
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Read SPIKE-ctx-access-path.md and apply locals destructure + captureRequestMeta helper + appendTurn import to api/chat.ts</name>
  <files>src/pages/api/chat.ts</files>
  <read_first>
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/SPIKE-ctx-access-path.md (Plan 18-01 output — the verified `ctx` access expression to copy verbatim)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-01-SUMMARY.md (Plan 18-01 summary confirming the spike resolution)
    - src/pages/api/chat.ts (current line 1-14 — existing imports; line 15 — current APIRoute destructure)
    - src/lib/chat-transcripts.ts (Plan 18-02 — confirm `appendTurn` is exported and named export path is `../../lib/chat-transcripts` from `src/pages/api/chat.ts`)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md (§ src/pages/api/chat.ts MODIFY — lines 520-613 covering target signature, anchors, anti-pattern callouts)
  </read_first>
  <action>
Open `.planning/phases/18-persistence-identity-kv-write-path-sessionid/SPIKE-ctx-access-path.md` and copy the verified TypeScript expression from `## Verified path` section. Throughout this task, refer to the SPIKE-confirmed expression as `<SPIKE-PATH>` — the literal you actually paste in source.

Open `src/pages/api/chat.ts`. Make these THREE additions, in this order:

1. **Add the appendTurn import** to the existing import block (after line 13, before line 14 — the existing `} from "../../lib/validation";` line). Add a new import block immediately following the validation import:

   ```
   import { appendTurn, type AppendTurnMeta } from "../../lib/chat-transcripts";
   ```

2. **Add the captureRequestMeta helper** between the import block (top of file) and the `export const POST: APIRoute = ...` line (currently line 15). Place it AT THE TOP of executable code so it's hoisted above POST. Use this exact shape (CONTEXT.md Claude's Discretion: default to server-side first-turn-only-pin for referrer + user_agent):

   ```
   /**
    * META-01 first-turn metadata snapshot — Plan 18-05 / D-08 / Pitfall 4.
    *
    * Snapshots referrer + user_agent (HTTP headers) and country + region + colo
    * (Cloudflare request.cf injection at the edge — null in `wrangler dev` per
    * RESEARCH § Pitfall 4). chat-transcripts.appendTurn pins these on the first
    * turn and preserves them on subsequent turns (META-01 first-turn-only-pin
    * convention per CONTEXT.md Claude's Discretion default).
    */
   function captureRequestMeta(request: Request): AppendTurnMeta {
     const cf = (request as unknown as { cf?: { country?: string; region?: string; colo?: string } }).cf;
     return {
       referrer: request.headers.get("Referer"),
       user_agent: request.headers.get("User-Agent"),
       country: cf?.country ?? null,
       region: cf?.region ?? null,
       colo: cf?.colo ?? null,
     };
   }
   ```

3. **Amend the POST signature** at the current line 15 to accept `locals`. The current line reads:

   ```
   export const POST: APIRoute = async ({ request }) => {
   ```

   Replace ONLY this destructure with (preserve the `async`, `=>`, and arrow-body opening brace exactly):

   ```
   export const POST: APIRoute = async ({ request, locals }) => {
   ```

4. **Add the `ctx` extraction line** AT THE TOP of the POST body, BEFORE the existing `// S9: CORS check` comment block (currently line 16). Insert this as the first statement in the POST body:

   ```
     // Plan 18-01 SPIKE-verified path to Workers ExecutionContext for ctx.waitUntil(appendTurn(...)).
     // RESEARCH § Pitfall 1: never destructure ctx — loses `this` binding ("Illegal invocation" runtime error).
     const ctx = <SPIKE-PATH>;
   ```

   Replace `<SPIKE-PATH>` with the exact TypeScript expression from the SPIKE file (e.g., `locals.runtime.ctx`). If the SPIKE recorded a TS narrowing requirement (e.g., the type of `locals.runtime` is `unknown`), include the cast verbatim from the SPIKE's "## Plan 18-05 import & destructure pattern" section.

DO NOT make any other changes in this task. The rate-limit branch, JSON parse, validateRequest call, sanitizeMessages, Anthropic stream setup, content_block_delta branch, message_delta cache_metrics log, controller.close, ReadableStream wrapper, and Response construction ALL stay byte-identical.

After the four edits:
- Run `pnpm exec astro check` — MUST exit 0/0/0. If `locals.runtime.ctx` produces a type error (locals not typed; runtime is `unknown`), use the cast pattern from SPIKE-ctx-access-path.md "## Verified path" section. If the SPIKE recommends a fallback (e.g., import from `cloudflare:workers`), apply the fallback verbatim.
- Run `pnpm test` — full suite. Plan 18-05 Task 1 expectation: same number as Plan 18-04 close (≥445 PASS), no regression. Some existing tests may import `POST` from api/chat.ts via dynamic import (e.g., `tests/api/cache-hit-logs.test.ts:82-105`) — those tests may need a `mockLocals` shape to keep the suite green. Check VALIDATION.md and PATTERNS.md `mockLocals` shape; if a downstream test breaks because the new `locals` destructure requires a shape, that test's fix is part of Task 1.
- Run `pnpm exec vitest run tests/api/sse-snapshot.test.ts` — 3/3 GREEN. The D-15 byte-identical anchor MUST hold here even though Plan 18-05 has not yet wired the appendTurn calls.

Commit shape: `refactor(18-05): src/pages/api/chat.ts add appendTurn import + locals destructure + captureRequestMeta helper — no behavior change`.
  </action>
  <verify>
    <automated>pnpm exec astro check 2>&1 | tail -3 && pnpm exec vitest run tests/api/sse-snapshot.test.ts 2>&1 | tail -3 && node -e "const fs = require('fs'); const f = fs.readFileSync('src/pages/api/chat.ts', 'utf8'); const checks = [/import\s*\{\s*appendTurn[\s\S]*from\s*[\"']\.\.\/\.\.\/lib\/chat-transcripts[\"']/.test(f), /function\s+captureRequestMeta\s*\(\s*request\s*:\s*Request\s*\)/.test(f), /request\.headers\.get\([\"']Referer[\"']\)/.test(f), /request\.headers\.get\([\"']User-Agent[\"']\)/.test(f), /\(\s*\{\s*request\s*,\s*locals\s*\}\s*\)/.test(f), /const\s+ctx\s*=/.test(f), !/const\s*\{\s*waitUntil\s*\}\s*=\s*ctx/.test(f), /AppendTurnMeta/.test(f)]; const failed = checks.findIndex(c => !c); if (failed >= 0) { console.error('Source check ' + failed + ' failed'); process.exit(1); } process.exit(0);"</automated>
  </verify>
  <done>api/chat.ts has the appendTurn import, captureRequestMeta helper declared above POST, POST destructure includes `locals`, `const ctx = <SPIKE-PATH>;` appears at the top of POST body, `ctx` is NOT destructured. `pnpm exec astro check` 0/0/0. `pnpm exec vitest run tests/api/sse-snapshot.test.ts` 3/3 GREEN. Full suite ≥445 PASS / 0 FAIL.</done>
</task>

<task type="auto">
  <name>Task 2: Insert D-10 USER-TURN waitUntil call site + D-11 accumulator wiring + D-11 ASSISTANT-TURN waitUntil call site</name>
  <files>src/pages/api/chat.ts</files>
  <read_first>
    - src/pages/api/chat.ts (current state after Task 1 — confirm Task 1 edits applied)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md (§ "D-10 insertion anchor" lines 538-555; "D-11 insertion anchor" lines 558-581; "Accumulator wiring" lines 584-589)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-RESEARCH.md (§ Pitfall 1 — `.catch` BEFORE waitUntil; § Pitfall 6 — accumulator not per-token)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md (critical constraints #4 #5 #6 #7 — D-04 missing tolerance, D-09 silent log, D-10/D-11 anchors, D-12 KV-05 quota fires in chat-transcripts not here)
  </read_first>
  <action>
With Task 1 edits in place, add the THREE wiring blocks. Apply in this order:

**Block 1 (D-10 user-turn waitUntil):** Insert AFTER the existing `const messages = sanitizeMessages(validation.data.messages);` line (currently line 84 in pre-Plan-18-05 source — may have shifted by Task 1). Locate it by Grep for `sanitizeMessages(validation.data.messages);`. Insert IMMEDIATELY after that statement, BEFORE the existing `// D-08/D-11: Stream response from Claude Haiku` comment block (currently line 86):

```
  // D-10 / D-04: USER-TURN KV write — fire-and-forget AFTER validation succeeds, BEFORE Anthropic stream
  // opens (durability anchor). Per D-04 (REQUIREMENTS.md v1.3-B6 amendment): absent sessionId skips
  // appendTurn entirely; SSE stream still serves. Per RESEARCH § Pitfall 1: .catch chains BEFORE waitUntil
  // — rejections silently swallowed otherwise. Plan 18-07 source-text test forward-defends this shape.
  if (validation.data.sessionId) {
    const sid = validation.data.sessionId;
    const userContent = messages[messages.length - 1].content;
    const sessionMeta = captureRequestMeta(request);
    ctx.waitUntil(
      appendTurn(env.CHAT_KV, sid, "user", userContent, sessionMeta).catch((err: unknown) => {
        console.error("chat.transcript.write_failed", {
          sessionId: sid,
          role: "user",
          error_class: err instanceof Error ? err.constructor.name : "unknown",
        });
      }),
    );
  }

```

**Block 2 (accumulator wiring inside start(controller)):** Two sub-edits inside the existing `async start(controller) { try { ... } }` closure.

  Sub-edit 2a — Declare the accumulator at top of start(controller). Locate the existing `let truncated = false;` line (currently line 100). Insert IMMEDIATELY BEFORE that line:

```
        // D-11 / META-02: per-token assistant text accumulator. Single flush at controller.close()
        // — NEVER per-token (KV's 1 write/sec/key cap would 429 the transcript per RESEARCH § Pitfall 6).
        let accumulator = "";
```

  Sub-edit 2b — Append `event.delta.text` to the accumulator inside the existing `content_block_delta` branch. Locate the existing block at line 117-125 starting `if (event.type === "content_block_delta" && event.delta.type === "text_delta")` ending with the closing `}`. Inside this block, AFTER the existing `controller.enqueue(...)` call and BEFORE the closing brace, insert:

```
            accumulator += event.delta.text;
```

**Block 3 (D-11 assistant-turn waitUntil):** Insert AFTER the existing `controller.close();` line (currently line 170) and BEFORE the closing brace of the try block (currently line 171). Locate by Grep for `controller.close();` and find the one INSIDE start(controller) (NOT the one inside the catch block at line 179):

```

        // D-11 / D-04 / META-02: ASSISTANT-TURN KV write AFTER controller.close() — accumulator strategy.
        // Per D-04: skipped when sessionId absent. Skipped when accumulator empty (zero-token reply edge).
        // META-02 source-of-truth-once: cacheUsage closure object passed BYTE-IDENTICAL into appendTurn's
        // meta — same fields the chat.cache_metrics log line consumes. .catch BEFORE waitUntil per Pitfall 1.
        if (validation.data.sessionId && accumulator) {
          const sid = validation.data.sessionId;
          ctx.waitUntil(
            appendTurn(env.CHAT_KV, sid, "assistant", accumulator, {
              referrer: null,
              user_agent: null,
              country: null,
              region: null,
              colo: null,
              cache_read_input_tokens: cacheUsage?.cache_read_input_tokens ?? 0,
              cache_creation_input_tokens: cacheUsage?.cache_creation_input_tokens ?? 0,
            }).catch((err: unknown) => {
              console.error("chat.transcript.write_failed", {
                sessionId: sid,
                role: "assistant",
                content_length: accumulator.length,
                error_class: err instanceof Error ? err.constructor.name : "unknown",
              });
            }),
          );
        }
```

DO NOT change anything else. The CORS check, content-length guard, rate-limit branch, JSON parse, validateRequest call, Anthropic client creation, response handling, message_delta cache_metrics log line, error branch (catch), and Response construction stay byte-identical.

After all three blocks land:
1. `pnpm exec astro check` — 0/0/0.
2. `pnpm test` — full suite GREEN. Expected: 445 (Plan 18-04 close) + 0 new tests = 445 PASS / 0 FAIL / 2 SKIP. Plan 18-05 adds NO new tests itself (Plan 18-07 will). All existing tests must still GREEN — including `tests/api/cache-hit-logs.test.ts` (DEBT-02), `tests/api/anthropic-payload-shape.test.ts` (TEST-03 + D-16), `tests/api/sse-snapshot.test.ts` (D-15), and the entire chat-surface battery.
3. **D-15 byte-identical sse-snapshot check** — `pnpm exec vitest run tests/api/sse-snapshot.test.ts` MUST be 3/3 GREEN. If snapshot mismatch surfaces, the waitUntil calls have somehow leaked into the SSE byte stream (which they shouldn't — they're off the controller-enqueue path). STOP and investigate before continuing.
4. **TEST-03 forward-defense** — `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` MUST be 8/8 GREEN (5 legacy + 3 D-16). If Test (b) source-text fails, you've accidentally referenced sessionId in `src/prompts/chat-request-shape.ts` — which Plan 18-05 should NOT touch.

If a downstream test like `tests/api/cache-hit-logs.test.ts` fails because the POST signature now expects `locals`, that's a test-side fix needed in Plan 18-07 (the META-02 extension). Per VALIDATION.md the META-02 closure adds a mockLocals shape — Plan 18-07 owns adding it. If the existing 3 cache-hit-logs tests now require mockLocals to pass, the FIX belongs in Plan 18-07, not Plan 18-05. If they pass without mockLocals (because the existing dynamic import shape is already permissive), proceed.

Commit shape: `feat(18-05): src/pages/api/chat.ts wire ctx.waitUntil(appendTurn(...)) at D-10 + D-11 anchors — KV-02..05 + META-01 + META-02 + IDENT-02 + D-04 + TEST-01 + TEST-03 wiring`.
  </action>
  <verify>
    <automated>pnpm exec astro check 2>&1 | tail -3 && pnpm exec vitest run tests/api/sse-snapshot.test.ts tests/api/anthropic-payload-shape.test.ts 2>&1 | tail -3 && node -e "const fs = require('fs'); const f = fs.readFileSync('src/pages/api/chat.ts', 'utf8'); const validateIdx = f.search(/validateRequest\(/); const closeIdx = f.search(/controller\.close\(\)/); const userWaitIdx = f.search(/ctx\.waitUntil\(\s*appendTurn\([^)]*[\"']user[\"']/); const assistantWaitIdx = f.search(/ctx\.waitUntil\(\s*appendTurn\([^)]*[\"']assistant[\"']/); const checks = [validateIdx > 0, closeIdx > 0, userWaitIdx > validateIdx, assistantWaitIdx > closeIdx, /accumulator\s*\+=\s*event\.delta\.text/.test(f), /let\s+accumulator\s*=\s*[\"']{2}/.test(f), /\.catch\(/.test(f), /chat\.transcript\.write_failed/.test(f), !/const\s*\{\s*waitUntil\s*\}\s*=\s*ctx/.test(f), /cacheUsage\?\.cache_read_input_tokens/.test(f), /cacheUsage\?\.cache_creation_input_tokens/.test(f), (f.match(/ctx\.waitUntil\(/g) || []).length === 2, (f.match(/\.catch\(/g) || []).length >= 2]; const failed = checks.findIndex(c => !c); if (failed >= 0) { console.error('Wiring check ' + failed + ' failed'); process.exit(1); } process.exit(0);"</automated>
  </verify>
  <done>Two `ctx.waitUntil(appendTurn(...))` call sites present in api/chat.ts: one for "user" role AFTER validateRequest, one for "assistant" role AFTER controller.close(). Both wraps `appendTurn(...).catch(...)` (rejection-safe per Pitfall 1). Accumulator declared at top of start(controller) and updated `+= event.delta.text` inside the content_block_delta branch. `pnpm exec astro check` 0/0/0. `tests/api/sse-snapshot.test.ts` 3/3 GREEN (D-15 byte-identical preserved). `tests/api/anthropic-payload-shape.test.ts` 8/8 GREEN (TEST-03 forward-defense).</done>
</task>

<task type="auto">
  <name>Task 3: Plan-end gate — FULL D-26 chat regression battery + astro check 0/0/0 + sse-snapshot + anthropic-payload-shape + cache-hit-logs</name>
  <files>(verification only — no files modified)</files>
  <read_first>
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md (critical constraints #1 #3 — D-15 byte-identical, D-26 chat battery 117/117 GREEN at every chat-surface commit + phase end; #2 — TEST-03 cross-phase gate)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-VALIDATION.md (sampling rate after every plan wave)
  </read_first>
  <action>
This plan is the HIGHEST-D-26-RISK commit in Phase 18 — it touches the most-protected file (`src/pages/api/chat.ts`). The D-26 gate is BLOCKING.

Run the FULL D-26 sampling cadence per VALIDATION.md "After every plan wave: pnpm test && pnpm exec astro check (full suite + typecheck)":

1. `pnpm test` — full suite. Expected: 445 PASS / 0 FAIL / 2 SKIP (Plan 18-05 adds NO new tests itself). Any new failure → STOP.

2. `pnpm exec astro check` — 0/0/0 baseline carry-forward.

3. `pnpm exec vitest run tests/api/sse-snapshot.test.ts tests/api/anthropic-payload-shape.test.ts tests/api/cache-hit-logs.test.ts tests/api/validation.test.ts tests/api/chat-session-id.test.ts tests/api/chat-transcripts.test.ts tests/client/listener-dedup.test.ts tests/client/chat-panel-display.test.ts tests/build/no-imperative-display-flip.test.ts tests/build/no-inline-display-on-chat-panel.test.ts` — chat-surface focused 10-file battery. Every file MUST be GREEN.

4. **D-15 byte-identical spot check** — run sse-snapshot in isolation: `pnpm exec vitest run tests/api/sse-snapshot.test.ts`. 3/3 GREEN. If a fixture mismatch surfaces (rare — the waitUntil calls are off the controller-enqueue path), the wiring has accidentally added an SSE frame. Investigate before phase progresses.

5. **TEST-03 forward-defense spot check** — `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts`. 8/8 GREEN. If Test (b) source-text fails, someone added a sessionId reference to chat-request-shape.ts — Plan 18-05 should NOT have touched that file.

Record results in Plan 18-05 SUMMARY with explicit test counts. Note specifically:
  - sse-snapshot: 3/3 GREEN (D-15 byte-identical preserved post-waitUntil-wiring — the plan-time-authored D-15 amendment in REQUIREMENTS.md TEST-02 commentary is validated)
  - anthropic-payload-shape: 8/8 GREEN (TEST-03 forward-defense including 3 D-16 assertions)
  - cache-hit-logs: existing 3 tests GREEN (META-02 extension test will land in Plan 18-07)

If ANY chat-surface focused test fails, this is a D-26 BLOCK. Plan 18-05 must be reverted OR fixed in-place before Plan 18-06 / 18-07 / 18-08 proceed.
  </action>
  <verify>
    <automated>pnpm test 2>&1 | tail -3 && pnpm exec astro check 2>&1 | tail -3 && pnpm exec vitest run tests/api/sse-snapshot.test.ts tests/api/anthropic-payload-shape.test.ts tests/api/cache-hit-logs.test.ts tests/api/validation.test.ts tests/api/chat-session-id.test.ts tests/api/chat-transcripts.test.ts tests/client/listener-dedup.test.ts tests/client/chat-panel-display.test.ts tests/build/no-imperative-display-flip.test.ts tests/build/no-inline-display-on-chat-panel.test.ts 2>&1 | tail -3</automated>
  </verify>
  <done>`pnpm test` ≥ 445 PASS / 0 FAIL / 2 SKIP. `pnpm exec astro check` 0/0/0. 10-file D-26 chat-surface focused battery all GREEN. sse-snapshot 3/3 (D-15 preserved). anthropic-payload-shape 8/8 (TEST-03 forward-defense including D-16). Plan SUMMARY records exact counts.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → /api/chat | Untrusted POST body crosses; Plan 18-03 sessionId Zod check ALREADY applied at line 75 (validateRequest). Plan 18-05 reads `validation.data.sessionId` ONLY after a successful validation. |
| api/chat.ts → env.CHAT_KV | Server-side write to Cloudflare KV via the Plan 17-04 FOUND-04-bound namespace. KV is platform-managed; trust at the binding boundary. |
| api/chat.ts → Anthropic SDK | Cacheable Anthropic surface MUST NOT see sessionId (TEST-03). Plan 18-05 forward-defends via static (Plan 18-04 tests) + dynamic (no sessionId in buildChatRequestArgs argument list). |
| api/chat.ts → ctx.waitUntil | Worker runtime crosses; rejection-handling boundary lives on the caller side (the `.catch` chain). |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-18-05-01 | Information Disclosure | sessionId leaking into the Anthropic cacheable surface (Pitfall 3) | mitigate | Static: Plan 18-04 D-16 forward-defense (8/8 in `tests/api/anthropic-payload-shape.test.ts`). Dynamic: Plan 18-08 manual UAT (3× identical POST + `wrangler tail`). Source-text: `src/prompts/chat-request-shape.ts` not touched in Plan 18-05 (verify via git diff). sessionId READ from `validation.data.sessionId` and PASSED only to `appendTurn(env.CHAT_KV, sid, ...)` — never to `buildChatRequestArgs(portfolioContext, messages)`. Per V13. |
| T-18-05-02 | Repudiation | KV write rejection silently swallowed by ctx.waitUntil (Pitfall 1) | mitigate | Both waitUntil call sites chain `.catch((err: unknown) => { console.error("chat.transcript.write_failed", { sessionId, role, error_class, [content_length] }); })` BEFORE passing to waitUntil. Plan 18-07 source-text forward-defense (`tests/build/append-turn-call-site.test.ts`) asserts the `.catch` chain stays present across future revisions. Per V7. |
| T-18-05-03 | Tampering | D-15 SSE byte-stream regression from waitUntil mis-placement | mitigate | waitUntil calls placed OFF the controller-enqueue path (USER-TURN before `client.messages.create`; ASSISTANT-TURN inside start(controller) but AFTER `controller.close()`). Test gate: `tests/api/sse-snapshot.test.ts` 3/3 GREEN at commit close. The plan-time-authored D-15 amendment in REQUIREMENTS.md TEST-02 commentary explicitly authorizes the waitUntil insertion shape. Per V13. |
| T-18-05-04 | Denial of Service | Stalled appendTurn promise blocking Worker invocation past 30s | accept | ctx.waitUntil promises have a documented 30s runtime ceiling. KV `put()` typical latency < 100ms; pathological cases (control-plane outage) caught by the .catch + logged via `chat.transcript.write_failed`. SSE stream completes regardless because waitUntil is fire-and-forget. Per V13. |
| T-18-05-05 | Spoofing | Forged sessionId in POST body | accept | Per T-18-03-01: sessionId is an opaque correlation ID, not a session-management token. 122 bits of UUIDv4 entropy makes brute-force infeasible; KV-05 quota caps abuse to 100 writes/hour per sid even if a sid leaks. Per V3 partial. |
| T-18-05-06 | Information Disclosure | sessionId logged alongside IP / User-Agent (fingerprint trail per RESEARCH § Anti-Patterns) | mitigate | Plan 18-05 `console.error("chat.transcript.write_failed", { sessionId, role, error_class, content_length? })` carries sessionId + functional fields ONLY. No IP, no UA in the same line. The existing rate-limit branch at api/chat.ts:53 logs IP separately (`request.headers.get("CF-Connecting-IP")`) — distinct log seam. Per V7. |
| T-18-05-07 | Tampering | request.cf undefined in `wrangler dev` causing null-pointer (Pitfall 4) | mitigate | captureRequestMeta defensively reads `request.cf?.country ?? null` etc. Schema accepts null for all three fields per META-01 contract (Plan 18-02 chat-transcripts.ts AppendTurnMeta type). Per V13. |
| T-18-05-08 | Repudiation | Phase 18 production deploy without TEST-03 live verification | mitigate | D-15 cache-miss-blocks-close. Plan 18-08 (UAT) authors 18-UAT.md with the 3× identical POST against `*.workers.dev` preview THEN production. If preview shows `cache_read_input_tokens === 0` on response 2 or 3, phase blocks until root-caused via `wrangler tail` byte-diff of the system block. Per operational verification. |

ASVS L1 mapping for this plan: V3 partial (sessionId correlation), V5 yes (validation.ts at line 75 — schema enforcement), V6 partial (no crypto inside api/chat.ts), V7 yes (D-09 structured-log shape + Pitfall 1 .catch enforcement), V13 yes (the /api/chat surface itself + KV write path + Anthropic boundary), V14 yes (CHAT_KV binding consumed via env per FOUND-04).
</threat_model>

<verification>
**Plan-end checks (all must pass):**

1. `pnpm test` — full suite ≥ 445 PASS / 0 FAIL / 2 SKIP.
2. `pnpm exec astro check` — 0/0/0.
3. `pnpm exec vitest run tests/api/sse-snapshot.test.ts` — 3/3 GREEN. **D-15 byte-identical anchor preserved post-Plan-18-05 wiring.**
4. `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` — 8/8 GREEN. **TEST-03 forward-defense including D-16 source-text guard.**
5. `pnpm exec vitest run tests/api/cache-hit-logs.test.ts` — existing 3 tests GREEN (META-02 extension lands in Plan 18-07).
6. 10-file D-26 chat-surface focused battery — all GREEN.
7. Source diff confined to `src/pages/api/chat.ts` ONLY: `git diff --exit-code src/scripts/chat.ts src/lib/validation.ts src/lib/chat-transcripts.ts src/prompts/chat-request-shape.ts wrangler.jsonc` exits 0.
8. `src/pages/api/chat.ts` has EXACTLY 2 `ctx.waitUntil(` occurrences (one user, one assistant); EXACTLY 2 `.catch(` occurrences inside those waitUntil calls; NO `const { waitUntil } = ctx` destructure.
</verification>

<success_criteria>
- api/chat.ts wires two `ctx.waitUntil(appendTurn(...).catch(...))` calls at the D-10 + D-11 anchors.
- Accumulator string declared at top of start(controller); updated `+= event.delta.text` inside content_block_delta branch.
- captureRequestMeta helper extracts referrer / user_agent / country / region / colo defensively per META-01 + Pitfall 4.
- D-04 missing-tolerance branch: both waitUntil calls gated on `if (validation.data.sessionId)`; assistant-turn additionally gated on `&& accumulator`.
- META-02 source-of-truth-once: assistant-turn meta passes `cacheUsage?.cache_read_input_tokens ?? 0` + `cacheUsage?.cache_creation_input_tokens ?? 0`.
- D-15 SSE byte-identical: `tests/api/sse-snapshot.test.ts` 3/3 GREEN.
- TEST-03 forward-defense: `tests/api/anthropic-payload-shape.test.ts` 8/8 GREEN.
- D-26 chat-surface focused 10-file battery GREEN; `pnpm test` ≥ 445; `astro check` 0/0/0.
- No other source file modified.
</success_criteria>

<output>
After completion, create `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-05-SUMMARY.md` recording:
- Final test count (Plan 18-04 close → Plan 18-05 close: 445 → 445 PASS — Plan 18-05 adds no new tests; Plan 18-07 will)
- `astro check` 0/0/0 preserved
- sse-snapshot 3/3 GREEN — explicitly note "D-15 byte-identical preserved across the plan-time-authored D-15 amendment (two ctx.waitUntil(appendTurn(...)) calls)"
- anthropic-payload-shape 8/8 GREEN — TEST-03 forward-defense + D-16 holding
- 10-file chat-surface focused battery status
- The two waitUntil call sites' exact line numbers in the final source (Grep result for `ctx\.waitUntil\(`)
- Confirmation that `src/prompts/chat-request-shape.ts` is byte-identical (`git log -1 --stat src/prompts/chat-request-shape.ts` shows no Plan 18-05 commit touching it)
- Anchor for Plan 18-07 (source-text forward-defense): the two call-site line numbers Plan 18-07's regex tests can lock against
- Anchor for Plan 18-08 (UAT): operator can now post sessionId-bearing requests against preview / production and observe `live:{sid}` keys via `wrangler kv key get`
</output>
