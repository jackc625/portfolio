---
phase: 18-persistence-identity-kv-write-path-sessionid
plan: 02
type: tdd
wave: 1
depends_on: [01]
files_modified:
  - src/lib/chat-transcripts.ts
  - tests/api/chat-transcripts.test.ts
autonomous: true
requirements: [KV-02, KV-03, KV-04, KV-05, META-01]
must_haves:
  truths:
    - "`appendTurn(kv, sessionId, role, content, meta)` writes `live:{sessionId}` as JSON with `v: 1` schema versioning, `expirationTtl: 30 * 24 * 3600` on every put"
    - "KV `metadata` field on every put carries `{ last_activity_at, msg_count, window_started_at, window_count }` (≤1024 bytes serialized — Phase 19 cron path can list({prefix}) without per-key get)"
    - "30-turn drop-oldest sliding window cap enforced; `truncated: true` flag is one-way (set on first drop, never unset)"
    - "Per-sessionId quota: 100 writes per rolling 1-hour window enforced inline against metadata; 101st write logs `console.warn('chat.transcript.quota_exceeded', {...})` and returns without put"
    - "META-01 first-turn metadata (referrer, user_agent truncated to 512 chars; country/region/colo from request.cf) pinned at first turn and preserved on subsequent turns"
    - "`console.error('chat.transcript.write_failed', { sessionId, role, error_class })` shape verified at the catch boundary"
    - "`console.warn('chat.transcript.race_suspected', { sessionId, in_memory_tail_len, kv_read_len })` fires when a read returns a shorter messages.length than a prior put's msg_count (single-invocation scope per Pitfall 2 clarification)"
  artifacts:
    - path: "src/lib/chat-transcripts.ts"
      provides: "Pure KV write module — `appendTurn` + types + KV-05 quota guard + 30-turn trim"
      exports: ["appendTurn", "AppendTurnMeta", "ChatTranscript", "KVMetadata"]
      min_lines: 80
    - path: "tests/api/chat-transcripts.test.ts"
      provides: "Mock-KV unit test suite for chat-transcripts module"
      contains: "describe(\"chat-transcripts"
      min_lines: 200
  key_links:
    - from: "src/lib/chat-transcripts.ts appendTurn(kv, ...)"
      to: "env.CHAT_KV.put(live:{sid}, ..., { expirationTtl, metadata })"
      via: "Cloudflare KV put() with expirationTtl + metadata"
      pattern: "kv\\.put\\([\\s\\S]*?expirationTtl[\\s\\S]*?metadata"
    - from: "src/lib/chat-transcripts.ts"
      to: "no Anthropic / SSE / Request reach-in"
      via: "no imports from `@anthropic-ai/sdk`, `cloudflare:workers`, or request-handling modules"
      pattern: "^(?!import.*@anthropic-ai/sdk)(?!import.*cloudflare:workers)"
---

<objective>
Author the pure persistence module `src/lib/chat-transcripts.ts` and its full mock-KV unit-test suite `tests/api/chat-transcripts.test.ts`. The module owns the entire KV write contract for Phase 18: key naming (`live:{sid}`), schema versioning (`v: 1`), 30-day TTL, 30-turn drop-oldest trim, KV-05 per-sessionId quota guard, first-turn metadata pin, and structured-log observability for write-failure / quota-exceeded / race-suspected events.

This module is the FIRST infrastructure helper in the project — no prior `src/lib/*` module touches KV, Anthropic, or Workers internals. Build it with zero coupling to `api/chat.ts`, the Anthropic SDK, or SSE: signature is `appendTurn(kv: KVNamespace, sessionId: string, role: "user" | "assistant", content: string, meta: AppendTurnMeta): Promise<void>`. Caller (Plan 18-05) wraps with `ctx.waitUntil(...catch(...))`.

Purpose: Decoupling lets Plan 18-05 wire api/chat.ts with two simple `ctx.waitUntil(appendTurn(...))` calls (read patterns map and pitfall guides established in 18-PATTERNS.md / 18-RESEARCH.md). Decoupling also lets Phase 19 cron sweep consume the same metadata shape Plan 18-02 writes without dragging chat-surface deps. Phase-end exit gates D-15 / D-26 / TEST-03 stay structurally satisfiable.

Output: `src/lib/chat-transcripts.ts` (~120-160 LOC) with named exports + decision-ID inline comments mirroring `src/lib/validation.ts`. `tests/api/chat-transcripts.test.ts` (~250-350 LOC) with ≥12 tests covering every must-have truth above. RED-GREEN-REFACTOR cycle: tests authored first against missing module → module implemented → tests pass.
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
@src/lib/validation.ts
@tests/api/validation.test.ts
@tests/api/cache-hit-logs.test.ts
</context>

<interfaces>
<!-- Locked module API — Plan 18-05 imports these names verbatim -->

Module public surface (named exports only; no default export):

  export const KEY_PREFIX = "live:";
  export const TRANSCRIPT_TTL_SECONDS = 30 * 24 * 3600; // 30 days
  export const TURN_CAP = 30;
  export const REFERRER_MAX = 512;
  export const USER_AGENT_MAX = 512;
  export const QUOTA_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  export const QUOTA_CAP = 100;                  // KV-05 — locked per Plan 18-01

  export interface AppendTurnMeta {
    referrer: string | null;
    user_agent: string | null;
    country: string | null;
    region: string | null;
    colo: string | null;
    cache_read_input_tokens?: number;       // assistant turn only
    cache_creation_input_tokens?: number;   // assistant turn only
  }

  export interface StoredTurn {
    role: "user" | "assistant";
    content: string;
    ts: string;                              // ISO 8601
    cache_read_input_tokens?: number;        // assistant turn only
    cache_creation_input_tokens?: number;    // assistant turn only
  }

  export interface ChatTranscript {
    v: 1;
    sid: string;
    started_at: string;                      // ISO 8601
    last_activity_at: string;                // ISO 8601
    msg_count: number;
    truncated: boolean;                       // D-06 one-way
    meta: {
      referrer: string | null;
      user_agent: string | null;
      country: string | null;
      region: string | null;
      colo: string | null;
    };
    messages: StoredTurn[];                  // length ≤ TURN_CAP
  }

  export interface KVMetadata {
    last_activity_at: string;
    msg_count: number;
    window_started_at: string;
    window_count: number;
  }

  export async function appendTurn(
    kv: KVNamespace,
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    meta: AppendTurnMeta,
  ): Promise<void>;

Observability log namespace (Plan 17-05 DEBT-02 convention — first arg dotted-event-name; second arg flat-primitive object):

  console.error("chat.transcript.write_failed", { sessionId, role, error_class });
  console.warn("chat.transcript.quota_exceeded", { sessionId, count_in_window });
  console.warn("chat.transcript.race_suspected", { sessionId, in_memory_tail_len, kv_read_len });

Excluded imports (must not appear in chat-transcripts.ts):
  - `@anthropic-ai/sdk` (no SDK reach-in)
  - `cloudflare:workers` (caller passes kv directly)
  - Anything from `src/prompts/`, `src/pages/api/`, `src/scripts/`

Required imports (acceptable surface):
  - Types from `@cloudflare/workers-types` if needed for `KVNamespace` (auto-imported via `wrangler types` → `worker-configuration.d.ts`)
  - No third-party deps
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Author full mock-KV test suite (RED — no module yet)</name>
  <files>tests/api/chat-transcripts.test.ts</files>
  <read_first>
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md (§ tests/api/chat-transcripts.test.ts — verbatim mock-KV class, console-spy pattern, fixture sessionId convention, required test cases list 1-11)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-RESEARCH.md (§ Pitfall 6 — 30-turn off-by-one; § Pitfall 7 — KV-05 lossy increment; § Pitfall 4 — request.cf defensive reads; § Example 1 — KV put contract; § Example 2 — getWithMetadata)
    - tests/api/validation.test.ts (analog import + describe structure — lines 1-19, 8-72)
    - tests/api/cache-hit-logs.test.ts (analog console-spy pattern — lines 107-141; logSpy / warnSpy / errorSpy + beforeEach / afterEach)
    - src/lib/validation.ts (analog module-shape — comment style + named exports + decision-ID citations)
  </read_first>
  <behavior>
    Test file `tests/api/chat-transcripts.test.ts` MUST contain ≥12 tests covering all must-have truths. Required cases (one or more `it()` per bullet):

    1. **KV-02 — first-write seed shape:** appendTurn on empty KV produces a `put()` call whose value parses to `{ v: 1, sid, started_at, last_activity_at, msg_count: 1, truncated: false, meta: {...}, messages: [{ role: "user", content: "Hi", ts }] }`. Assert `put()` options include `expirationTtl: 30 * 24 * 3600` and `metadata.last_activity_at`, `metadata.msg_count: 1`, `metadata.window_started_at`, `metadata.window_count: 1`.
    2. **KV-02 — read-modify-write preserves schema version + started_at across writes:** Two consecutive appendTurns. First put writes `v: 1`, `started_at: T0`. Second put still has `v: 1`, `started_at: T0` (unchanged), `last_activity_at: T1 > T0`, `msg_count: 2`, `messages.length: 2`.
    3. **KV-03 — metadata fields populated on every put:** Spy on `kv.put`; assert option `metadata` is non-null on EVERY call and contains all four keys (`last_activity_at`, `msg_count`, `window_started_at`, `window_count`).
    4. **KV-03 — metadata payload ≤1024 bytes serialized:** Compute `JSON.stringify(metadata).length` for a representative call; assert `<= 1024`. (RESEARCH note: ~130 bytes typical.)
    5. **KV-04 — 30-turn cap drop-oldest (append 31 → length 30, truncated true):** Seed mock KV with a 30-turn transcript (`messages.length === 30`, `truncated: false`). Call appendTurn once more. Assert: `JSON.parse(put.value).messages.length === 30` AND `messages[0]` is the SECOND turn of the seeded transcript (oldest dropped) AND `truncated === true`.
    6. **KV-04 — off-by-one boundary (append 30 → length 30, truncated false):** Seed mock KV with a 29-turn transcript. Call appendTurn once. Assert: `messages.length === 30` AND `truncated === false`. (Pitfall 6 anti-off-by-one.)
    7. **D-06 — truncated one-way:** Seed mock KV with a 31-turn-trimmed transcript (`truncated: true`, `messages.length: 30`). Call appendTurn once (which would not require a drop). Assert: `truncated === true` (not unset).
    8. **KV-04 — referrer truncated to 512 chars:** Pass meta with `referrer: "x".repeat(1000)` on a first-write. Assert: stored `meta.referrer.length === 512`.
    9. **KV-04 — user_agent truncated to 512 chars:** Same shape with `user_agent: "y".repeat(800)`. Assert: stored `meta.user_agent.length === 512`.
    10. **META-01 — first-turn metadata pin:** First appendTurn with `meta: { referrer: "https://example.com/", user_agent: "Mozilla/5.0", country: "US", region: "TX", colo: "DFW", ... }`. Second appendTurn with DIFFERENT meta (`country: "GB"`, etc.). Assert: stored `meta` after second put EQUALS first-call meta (pinned, not overwritten). Read this assertion against `JSON.parse(secondPut.value).meta`.
    11. **META-01 — null defaults when request.cf absent:** First appendTurn with `meta: { referrer: null, user_agent: null, country: null, region: null, colo: null }`. Assert: stored value's `meta.country === null` (not undefined; not a placeholder string).
    12. **KV-05 — quota under cap proceeds:** Seed mock KV with metadata `{ window_started_at: now, window_count: 99 }`. Call appendTurn. Assert: `kv.put` IS called once. The new metadata's `window_count === 100`. No `console.warn` for `chat.transcript.quota_exceeded`.
    13. **KV-05 — quota at cap rejects + logs:** Seed mock KV with metadata `{ window_started_at: now, window_count: 100 }`. Call appendTurn. Assert: `kv.put` is NOT called (zero invocations). `warnSpy` was called with `("chat.transcript.quota_exceeded", { sessionId: SID, count_in_window: 100 })`.
    14. **KV-05 — window expiry resets counter:** Seed with `{ window_started_at: <2 hours ago>, window_count: 100 }`. Call appendTurn. Assert: `kv.put` IS called; new metadata has `window_started_at` near `now` and `window_count: 1`.
    15. **D-09 — write_failed log shape on kv.put throw:** Mock `kv.put` to reject with an `Error` named `KVError`. Call appendTurn. Either (a) test asserts appendTurn does NOT throw (caller is ctx.waitUntil; throw is silently swallowed — module catches internally) OR (b) test asserts appendTurn rejects with the original error AND `console.error("chat.transcript.write_failed", { sessionId, role, error_class })` is observable. **Pick (b) — the .catch chain is the CALLER's responsibility (Plan 18-05), and chat-transcripts.ts must surface the error so the caller's `.catch` shape (RESEARCH Pitfall 1) is exercised. The forward-defense test in Plan 18-07 verifies the call-site `.catch` is present.** Test asserts: `await expect(appendTurn(...)).rejects.toThrow()` AND a follow-up call shape — for the planner's reference: Plan 18-02 leaves the error-class-name log AT the call site in api/chat.ts (Plan 18-05), so this Task 1 test asserts only that appendTurn surfaces the throw (the log shape itself is tested in Plan 18-05's `tests/api/chat-session-id.test.ts` or `tests/api/cache-hit-logs.test.ts` D-09 extension).

       **Final test 15 specification:** `await expect(appendTurn(mockKV, SID, "user", "Hi", meta)).rejects.toBeInstanceOf(Error);` (verifies module-level error surfaces; .catch shape is the caller's concern per RESEARCH Pattern 1).
    16. **D-13 — race_suspected log on shorter read:** Mock `kv.getWithMetadata` to return a transcript with `msg_count: 3` BUT metadata reporting `msg_count: 5` (prior put recorded 5; current read shows only 3 — cross-POP stale read). Call appendTurn. Assert: `warnSpy` was called with `("chat.transcript.race_suspected", { sessionId: SID, in_memory_tail_len: <prior-msg_count-from-metadata: 5>, kv_read_len: <current-read-msg-count: 3> })`. Write proceeds (last-writer-wins per D-13 — assert `kv.put` IS called). **Note for module author:** "in_memory_tail_len" comes from the just-read metadata's `msg_count` field per CONTEXT.md critical constraint #11 resolution (b) — single-invocation prior-put tail vs current read length.

    Hard-coded fixture sessionId (per CONTEXT.md Claude's Discretion):
    `const SID = "8b0f7f1c-1234-4567-8901-abcdef012345";`
  </behavior>
  <action>
Create `tests/api/chat-transcripts.test.ts`. Header `// chat-transcripts.test.ts — unit tests for src/lib/chat-transcripts.ts`. Import structure mirrors `tests/api/validation.test.ts:1-19` and adds vitest helpers `vi`, `beforeEach`, `afterEach`. Import `describe, it, expect, vi, beforeEach, afterEach` from `vitest`. Import (will fail until Task 2): `appendTurn, KEY_PREFIX, TRANSCRIPT_TTL_SECONDS, TURN_CAP, QUOTA_CAP, type AppendTurnMeta, type ChatTranscript, type KVMetadata` from `../../src/lib/chat-transcripts`.

Embed the hand-rolled `MockKVNamespace` class verbatim from 18-PATTERNS.md § "Mock KV pattern (RESEARCH §Supporting — hand-rolled, ~30 LOC)" (lines 137-170 of PATTERNS.md). It must implement `get`, `getWithMetadata`, `put`, `list` against an internal `Map<string, { value: string; metadata: unknown; expirationTtl?: number }>`. Include the `MockKVPutOptions` helper type if needed.

Embed `logSpy / warnSpy / errorSpy` beforeEach/afterEach setup verbatim from `tests/api/cache-hit-logs.test.ts:107-141` (PATTERNS.md mirror shown lines 173-196). All three spies cleared in `afterEach(() => { vi.restoreAllMocks(); });`.

Author all 16 tests above as individual `it(...)` blocks. Group into describe blocks by requirement:
  - `describe("KV-02 — schema versioning + 30d TTL on every put (D-22 sibling pattern)")` — tests 1, 2
  - `describe("KV-03 — metadata field for Phase 19 list({prefix}) forward-compat")` — tests 3, 4
  - `describe("KV-04 — 30-turn cap drop-oldest + truncated one-way (D-05/D-06/D-07)")` — tests 5, 6, 7
  - `describe("KV-04 — referrer/user_agent truncation to 512 chars (log-poisoning defense)")` — tests 8, 9
  - `describe("META-01 — first-turn metadata pin (request.cf snapshot)")` — tests 10, 11
  - `describe("KV-05 — per-sessionId write quota (D-12)")` — tests 12, 13, 14
  - `describe("D-09 — appendTurn surfaces errors to caller's .catch (RESEARCH Pitfall 1)")` — test 15
  - `describe("D-13 — race_suspected log on shorter read (single-invocation scope per Pitfall 2)")` — test 16

Fixture SID: `const SID = "8b0f7f1c-1234-4567-8901-abcdef012345";` declared at the top of the file scope, NOT inside any `describe`.

Inline-comment style: cite decision IDs (D-05, D-06, D-07, D-09, D-12, D-13, KV-02..05, META-01) AND RESEARCH section ("RESEARCH § Pitfall 6", "RESEARCH § Pitfall 7", etc.) the test guards. Mirror the per-comment-line style of `src/lib/validation.ts:65-114`.

Run `pnpm exec vitest run tests/api/chat-transcripts.test.ts` after writing — all 16 tests MUST FAIL (RED) with an `import` resolution error (`src/lib/chat-transcripts.ts` does not exist yet). This is the RED phase of the TDD cycle. Do NOT proceed to Task 2 until vitest output shows `Test Files 1 failed (1) | Tests 0 passed | 16 expected` (or equivalent "cannot find module" surface).

DO NOT touch `src/lib/chat-transcripts.ts` in this task.
  </action>
  <verify>
    <automated>pnpm exec vitest run tests/api/chat-transcripts.test.ts --reporter=verbose 2>&1 | grep -E "Test Files.*failed|Cannot find module|Test Suites:|chat-transcripts" | head -10; node -e "const fs = require('fs'); const f = fs.readFileSync('tests/api/chat-transcripts.test.ts', 'utf8'); const checks = [/8b0f7f1c-1234-4567-8901-abcdef012345/.test(f), /MockKVNamespace/.test(f), /chat\.transcript\.write_failed|chat\.transcript\.quota_exceeded|chat\.transcript\.race_suspected/.test(f), /TURN_CAP|truncated/.test(f), /window_count/.test(f), /META-01/.test(f), (f.match(/\bit\(/g) || []).length >= 12, /from\s+["']\.\.\/\.\.\/src\/lib\/chat-transcripts["']/.test(f)]; const failed = checks.findIndex(c => !c); if (failed >= 0) { console.error('Check ' + failed + ' failed'); process.exit(1); } process.exit(0);"</automated>
  </verify>
  <done>tests/api/chat-transcripts.test.ts exists with ≥12 it() blocks (target 16), MockKVNamespace embedded, fixture SID declared, all three log spies wired, all chat.transcript.* namespaces referenced. `pnpm exec vitest run tests/api/chat-transcripts.test.ts` fails with "Cannot find module" or equivalent missing-import error — RED phase confirmed.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement src/lib/chat-transcripts.ts to pass all Task 1 tests (GREEN)</name>
  <files>src/lib/chat-transcripts.ts</files>
  <read_first>
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-RESEARCH.md (§ Pattern 2 — KV write contract; § Example 1 — put with expirationTtl + metadata; § Example 2 — getWithMetadata; § Pitfall 6 — 30-turn off-by-one exact implementation; § Pitfall 7 — KV-05 lossy increment acceptance)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md (§ src/lib/chat-transcripts.ts — module-shape pattern lines 27-108; KV-05 quota guard lines 80-83; race observability lines 86-96)
    - src/lib/validation.ts (analog module shape — named exports, decision-ID inline comments, no default export, line 1-46 + comment style at 65-114)
    - tests/api/chat-transcripts.test.ts (just-authored test contract — the module must satisfy every assertion)
  </read_first>
  <behavior>
    All 16 tests authored in Task 1 MUST GREEN. The module must:

    - Export the public surface declared in `<interfaces>` above — function `appendTurn`, constants `KEY_PREFIX / TRANSCRIPT_TTL_SECONDS / TURN_CAP / REFERRER_MAX / USER_AGENT_MAX / QUOTA_WINDOW_MS / QUOTA_CAP`, types `AppendTurnMeta / StoredTurn / ChatTranscript / KVMetadata`.
    - `appendTurn(kv, sid, role, content, meta)` flow:
      1. `key = KEY_PREFIX + sid`.
      2. `{ value: existing, metadata: existingMeta } = await kv.getWithMetadata<ChatTranscript, KVMetadata>(key, { type: "json" });`
      3. KV-05 quota check: if existingMeta exists, compute window_age_ms; if `window_age_ms < QUOTA_WINDOW_MS` AND `existingMeta.window_count >= QUOTA_CAP` → `console.warn("chat.transcript.quota_exceeded", { sessionId: sid, count_in_window: existingMeta.window_count }); return;` (no put, no throw — silent posture per D-09). If window expired (window_age_ms >= QUOTA_WINDOW_MS) → reset window_started_at to now-ISO; window_count starts at 1 (this put is the first of the new window).
      4. Race detection: if existingMeta exists and (existing?.messages.length ?? 0) < existingMeta.msg_count → `console.warn("chat.transcript.race_suspected", { sessionId: sid, in_memory_tail_len: existingMeta.msg_count, kv_read_len: existing?.messages.length ?? 0 });` (write proceeds last-writer-wins per D-13).
      5. Build the new turn: `{ role, content, ts: nowIso }`. For role === "assistant", attach `cache_read_input_tokens` / `cache_creation_input_tokens` if present in `meta`.
      6. Build/preserve session-level meta: if `existing?.meta` present, keep it byte-identical (first-turn pin per META-01 + CONTEXT.md Claude's Discretion default). Otherwise build fresh from `meta.referrer/user_agent/country/region/colo`, truncating referrer to `REFERRER_MAX` and user_agent to `USER_AGENT_MAX`.
      7. Append + trim: `next = [...(existing?.messages ?? []), newTurn]; let truncated = existing?.truncated ?? false; if (next.length > TURN_CAP) { next.splice(0, next.length - TURN_CAP); truncated = true; }` (RESEARCH § Pitfall 6 exact code).
      8. Compose updated transcript: `{ v: 1, sid, started_at: existing?.started_at ?? nowIso, last_activity_at: nowIso, msg_count: next.length, truncated, meta: sessionMeta, messages: next }`.
      9. Compose updated metadata: `{ last_activity_at: nowIso, msg_count: next.length, window_started_at: <reset or preserved>, window_count: <incremented or 1> }`.
      10. `await kv.put(key, JSON.stringify(updated), { expirationTtl: TRANSCRIPT_TTL_SECONDS, metadata: nextMetadata });`
    - NO try/catch in the appendTurn body — let kv.put throw bubble to caller (Plan 18-05 wraps with `.catch` per RESEARCH Pattern 1). Per Task 1 test 15 contract: appendTurn surfaces the error.
    - NO imports from `@anthropic-ai/sdk`, `cloudflare:workers`, or any chat-surface module. The only types crossing the module boundary are caller-supplied (KVNamespace from worker-configuration.d.ts auto-types) and the named exports declared above.
  </behavior>
  <action>
Create `src/lib/chat-transcripts.ts`. Module structure mirrors `src/lib/validation.ts` (named exports only, no default, decision-ID inline comments, optional Zod usage only for runtime validation — Phase 18 does not need Zod inside this module since the caller (validation.ts) has already validated sessionId/messages shape).

Header comment block citing decision IDs: `KV-02, KV-03, KV-04, KV-05, META-01, D-05 (drop-oldest), D-06 (one-way truncated), D-07 (30 individual messages), D-09 (silent posture), D-12 (per-sid quota), D-13 (last-writer-wins race policy)`. Each decision ID gets ONE inline comment in the body at the line implementing it. Mirror the comment density of `validation.ts:65-114`.

Constants declared at top of file (matching test imports):
  - `KEY_PREFIX = "live:"`, `TRANSCRIPT_TTL_SECONDS = 30 * 24 * 3600`, `TURN_CAP = 30`, `REFERRER_MAX = 512`, `USER_AGENT_MAX = 512`, `QUOTA_WINDOW_MS = 60 * 60 * 1000`, `QUOTA_CAP = 100`.

Type exports (full TS shapes from `<interfaces>` block above) declared immediately after constants.

`appendTurn` implementation follows the 10-step flow in `<behavior>` exactly. Use a single `nowIso = new Date().toISOString()` snapshot at the top of the function for deterministic timestamps within one invocation.

Helper functions (file-local, NOT exported): `truncate(value: string | null, max: number): string | null` for referrer/UA truncation. Inline if <5 LOC; extract if >5.

When iterating implementation: run `pnpm exec vitest run tests/api/chat-transcripts.test.ts` after each significant change. RED → GREEN cycle per test:
  1. Implement constants + types → 1-2 tests pass (import-resolution stops failing)
  2. Implement read + first-write path → tests 1, 8, 9, 11 pass
  3. Implement metadata composition → tests 2, 3, 4 pass
  4. Implement trim logic → tests 5, 6, 7 pass
  5. Implement first-turn pin → test 10 passes
  6. Implement KV-05 quota → tests 12, 13, 14 pass
  7. Verify error-surface contract → test 15 passes
  8. Implement race detection → test 16 passes

After all 16 tests GREEN, run `pnpm exec astro check` — MUST exit 0/0/0 (no new type errors introduced to the project). If astro check reports errors specific to chat-transcripts.ts, fix them in this task (typically: explicit return-type annotations, KVNamespace generic args, optional-chaining vs nullish coalesce).

Commit shape (REFACTOR optional): one commit `feat(18-02): src/lib/chat-transcripts.ts pure module — KV write path + KV-05 quota + 30-turn trim` for Task 2. If a REFACTOR pass is needed (extract helpers, dedupe), land it as a second commit `refactor(18-02): chat-transcripts module cleanup` with all 16 tests still GREEN.
  </action>
  <verify>
    <automated>pnpm exec vitest run tests/api/chat-transcripts.test.ts 2>&1 | tail -5 && pnpm exec astro check 2>&1 | tail -3 && node -e "const fs = require('fs'); const f = fs.readFileSync('src/lib/chat-transcripts.ts', 'utf8'); const checks = [/export\s+(async\s+)?function\s+appendTurn\(/.test(f), /KEY_PREFIX\s*=\s*[\"']live:[\"']/.test(f), /TRANSCRIPT_TTL_SECONDS\s*=\s*30\s*\*\s*24\s*\*\s*3600/.test(f), /TURN_CAP\s*=\s*30/.test(f), /QUOTA_CAP\s*=\s*100/.test(f), /QUOTA_WINDOW_MS\s*=\s*60\s*\*\s*60\s*\*\s*1000/.test(f), /interface\s+ChatTranscript|type\s+ChatTranscript/.test(f), /interface\s+KVMetadata|type\s+KVMetadata/.test(f), !/from\s+[\"']@anthropic-ai\/sdk[\"']/.test(f), !/from\s+[\"']cloudflare:workers[\"']/.test(f), /chat\.transcript\.quota_exceeded/.test(f), /chat\.transcript\.race_suspected/.test(f), /D-05|D-06|D-07|D-12|D-13|KV-02|KV-03|KV-04|KV-05|META-01/.test(f)]; const failed = checks.findIndex(c => !c); if (failed >= 0) { console.error('Source check ' + failed + ' failed'); process.exit(1); } process.exit(0);"</automated>
  </verify>
  <done>All 16 tests in `tests/api/chat-transcripts.test.ts` GREEN. `pnpm exec astro check` exits 0/0/0. Source file `src/lib/chat-transcripts.ts` exports `appendTurn` + all locked constants/types, contains no `@anthropic-ai/sdk` or `cloudflare:workers` imports, and includes decision-ID inline comments for D-05/D-06/D-07/D-12/D-13/KV-02..05/META-01.</done>
</task>

<task type="auto">
  <name>Task 3: Plan-end gate — full suite + astro check + D-26 chat battery</name>
  <files>(verification only — no files modified)</files>
  <read_first>
    - .planning/phases/17-foundations-migration-dns-debt-sweep/17-RETROSPECTIVE.md (D-10 gate cadence — `pnpm test && pnpm exec astro check` at every plan close)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md (critical constraint #3 — D-26 chat regression battery 117/117 GREEN at every chat-surface commit + phase end; Phase 17 baseline 419 PASS / 0 FAIL / 2 SKIP)
  </read_first>
  <action>
Run the D-26 gate cadence at plan close — Plan 18-02 adds NEW tests but touches NO chat-surface files (chat.ts / api/chat.ts / validation.ts unchanged), so the gate is informational here. Still, the new test file `tests/api/chat-transcripts.test.ts` SHIPS the test count forward; verify nothing else regressed.

Three commands, in order:

1. `pnpm test` — full suite. Expected: 419 PASS + 16 NEW (Task 1/2) = 435 PASS / 0 FAIL / 2 SKIP. If anything new fails outside the 16 new tests, STOP and investigate — Plan 18-02 should be additive only.

2. `pnpm exec astro check` — typecheck. Expected: 0 errors / 0 warnings / 0 hints. The Phase 17 baseline carries into Phase 18; do NOT regress.

3. `pnpm exec vitest run tests/api/sse-snapshot.test.ts tests/api/anthropic-payload-shape.test.ts tests/api/cache-hit-logs.test.ts tests/client/listener-dedup.test.ts tests/client/chat-panel-display.test.ts tests/build/no-imperative-display-flip.test.ts tests/build/no-inline-display-on-chat-panel.test.ts` — D-26 chat-surface focused (per VALIDATION.md "After every task commit: Quick run command — chat-surface focused"). Expected: all GREEN. These tests would fail if Plan 18-02 accidentally regressed an existing chat-surface invariant — they MUST stay green even though Plan 18-02 only adds a new pure module.

Record results in the plan SUMMARY (test counts before/after, astro check delta, D-26 sample status). If any gate fails, file the failure in Plan 18-02 retro section and either fix it within this plan OR roll back to the pre-Task-2 state.
  </action>
  <verify>
    <automated>pnpm test 2>&1 | tail -3 && pnpm exec astro check 2>&1 | tail -3 && pnpm exec vitest run tests/api/sse-snapshot.test.ts tests/api/anthropic-payload-shape.test.ts tests/api/cache-hit-logs.test.ts tests/client/listener-dedup.test.ts tests/client/chat-panel-display.test.ts tests/build/no-imperative-display-flip.test.ts tests/build/no-inline-display-on-chat-panel.test.ts 2>&1 | tail -3</automated>
  </verify>
  <done>`pnpm test` shows ≥435 PASS / 0 FAIL / 2 SKIP. `pnpm exec astro check` exits 0 with 0/0/0. The 7-file D-26 chat-surface sample exits all GREEN. Plan SUMMARY records the gate status with exact numbers.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| caller → chat-transcripts module | Caller (api/chat.ts) passes already-validated sessionId, role, content; module trusts the shape because validation.ts is the single source of validation truth (V5/V13). |
| module → KV namespace | KV namespace is Cloudflare-managed; trust at the platform boundary. Module enforces value-size bounds (referrer/UA truncation, 30-turn cap) to prevent runaway-storage abuse via long-running sessions (V14 config defense). |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-18-02-01 | Tampering | KV value shape (schema versioning) | mitigate | Module writes `v: 1` schema discriminator on every put. Future schema migrations gate on this field. Test 1 + 2 lock this. |
| T-18-02-02 | Information Disclosure | sessionId in logs | mitigate | Per RESEARCH § Anti-Patterns: "DON'T write sessionId to logs alongside IP + UA simultaneously" — Phase 18 logs `chat.transcript.*` events with sessionId but NOT alongside IP. The module's three log calls (`write_failed`, `quota_exceeded`, `race_suspected`) carry sessionId + functional fields ONLY — no IP, no UA in the same line. Per V7. |
| T-18-02-03 | Denial of Service | Unbounded transcript value | mitigate | 30-turn cap (KV-04 — D-05/D-06/D-07) bounds messages.length ≤ 30; referrer + user_agent truncated to 512 chars; worst-case ~120KiB value, well under KV's 25 MiB ceiling. Per V13. |
| T-18-02-04 | Denial of Service | Scripted resubmits forcing known sessionId | mitigate | KV-05 per-sessionId quota: 100 writes / rolling 1h. Inline-metadata lossy increment acceptable (RESEARCH Pitfall 7). Distinct from the locked-deferred per-IP rate limit (per-sid forges a different defense surface). Per V13. |
| T-18-02-05 | Repudiation | KV write failures invisible to operators | mitigate | D-09: `console.error("chat.transcript.write_failed", { sessionId, role, error_class })`. The .catch wrapper that emits this log lives in the CALLER (Plan 18-05 api/chat.ts) — Plan 18-02's appendTurn surfaces the error so the caller's .catch sees it. Without the explicit .catch chain (Plan 18-07 source-text guard), the rejection would be silently swallowed by ctx.waitUntil (RESEARCH Pitfall 1). Per V7. |
| T-18-02-06 | Tampering | Concurrent-write race | accept | Last-writer-wins per D-13. Cross-invocation races at v1.3 scale are vanishingly rare (one ongoing SSE stream blocks the bubble). Race-suspected log (test 16) provides observability without rewriting KV's consistency model. Per V13. |
| T-18-02-07 | Information Disclosure | referrer log-poisoning via injected control characters | mitigate | KV-04 truncation to 512 chars caps the attack surface size. Future v1.4+ MAIL-03 strips bidi overrides + CR/LF on render; Phase 18 stores raw fields per META-01 contract. Per V5. |

ASVS L1 mapping for this plan: V3 partial (sessionId carried but not a session-management token), V5 yes (KV-04 truncation), V6 partial (no crypto inside this module), V7 yes (D-09 / D-12 / D-13 structured-log surface), V13 yes (KV write path is the API/Web service surface for transcript persistence), V14 yes (KV namespace binding declared per Phase 17 FOUND-04).
</threat_model>

<verification>
**Plan-end checks (all must pass):**

1. `pnpm test` — full suite GREEN. Expected baseline 419 + 16 new = 435 PASS / 0 FAIL / 2 SKIP.
2. `pnpm exec astro check` — 0/0/0 (Phase 17 baseline preserved).
3. `pnpm exec vitest run tests/api/chat-transcripts.test.ts` — 16/16 GREEN (the new test file).
4. D-26 chat-surface focused sample (7 files in Task 3 command) all GREEN.
5. Source file ownership: only `src/lib/chat-transcripts.ts` + `tests/api/chat-transcripts.test.ts` changed; `git diff --exit-code src/scripts/chat.ts src/pages/api/chat.ts src/lib/validation.ts src/prompts/ wrangler.jsonc` exits 0 (no chat-surface touch).
</verification>

<success_criteria>
- `src/lib/chat-transcripts.ts` committed with named exports `appendTurn / KEY_PREFIX / TRANSCRIPT_TTL_SECONDS / TURN_CAP / QUOTA_CAP / QUOTA_WINDOW_MS / REFERRER_MAX / USER_AGENT_MAX / AppendTurnMeta / StoredTurn / ChatTranscript / KVMetadata`.
- `tests/api/chat-transcripts.test.ts` committed with ≥12 tests (target 16) GREEN.
- Decision-ID inline comments for D-05/D-06/D-07/D-09/D-12/D-13/KV-02..05/META-01 present in the module source.
- No imports from `@anthropic-ai/sdk` or `cloudflare:workers` in the module source.
- `pnpm test` ≥ 435 PASS / 0 FAIL / 2 SKIP; `pnpm exec astro check` 0/0/0.
- D-26 chat-surface focused sample GREEN.
- `git diff --exit-code src/scripts/chat.ts src/pages/api/chat.ts src/lib/validation.ts` exits 0 (Plan 18-02 does NOT touch chat-surface files — that's Plans 18-04 + 18-05 + 18-06).
</success_criteria>

<output>
After completion, create `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-02-SUMMARY.md` recording:
- Final test count delta (419 → ≥435 PASS)
- `astro check` status (0/0/0)
- D-26 chat-surface focused sample status (GREEN)
- Final module LOC + test file LOC
- Confirmation `git diff --exit-code` against chat-surface files exits 0
- Anchor for Plan 18-05 (api/chat.ts wiring): the `appendTurn` import path is `../../lib/chat-transcripts` from `src/pages/api/chat.ts`
</output>
