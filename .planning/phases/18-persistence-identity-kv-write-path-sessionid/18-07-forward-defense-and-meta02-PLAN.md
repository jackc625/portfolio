---
phase: 18-persistence-identity-kv-write-path-sessionid
plan: 07
type: tdd
wave: 3
depends_on: [05]
files_modified:
  - tests/build/append-turn-call-site.test.ts
  - tests/api/cache-hit-logs.test.ts
autonomous: true
requirements: [TEST-01, TEST-03, META-02]
must_haves:
  truths:
    - "tests/build/append-turn-call-site.test.ts source-text forward-defense locks: (a) appendTurn import from chat-transcripts in api/chat.ts; (b) D-10 user-turn ctx.waitUntil(appendTurn(... \"user\" ...)) appears AFTER validateRequest; (c) D-11 assistant-turn ctx.waitUntil(appendTurn(... \"assistant\" ...)) appears AFTER controller.close(); (d) D-09 .catch chain present on BOTH waitUntil calls; (e) anti-pattern: no `const { waitUntil } = ctx` destructure"
    - "tests/api/cache-hit-logs.test.ts META-02 extension: assistant-turn appendTurn invocation receives `meta` object with `cache_read_input_tokens` + `cache_creation_input_tokens` matching the SAME values the chat.cache_metrics log emits (source-of-truth-once verified)"
    - "tests/api/sse-snapshot.test.ts re-verified GREEN against final post-Plan-18-05 wired source (D-15 byte-identical anchor holding across the plan-time-authored D-15 amendment for waitUntil insertions)"
    - "Full D-26 chat regression battery GREEN at end of Wave 3 — sets up Plan 18-08 UAT against clean test surface"
  artifacts:
    - path: "tests/build/append-turn-call-site.test.ts"
      provides: "Source-text forward-defense for D-10 / D-11 / D-09 ctx.waitUntil(appendTurn(...).catch(...)) anchors"
      contains: "describe(\"D-10"
      min_lines: 80
    - path: "tests/api/cache-hit-logs.test.ts"
      provides: "Extended cache-metrics test file with META-02 source-of-truth-once assertion (cacheUsage → appendTurn meta)"
      contains: "META-02"
  key_links:
    - from: "tests/build/append-turn-call-site.test.ts D-10 anchor regex"
      to: "src/pages/api/chat.ts user-turn ctx.waitUntil(appendTurn(... \"user\" ...)) after validateRequest"
      via: "readFileSync + src.search(/validateRequest\\(/) < src.search(/ctx\\.waitUntil\\(\\s*appendTurn\\([^)]*[\"']user[\"']/)"
      pattern: "ctx\\.waitUntil\\(\\s*appendTurn\\([^)]*[\"']user[\"']"
    - from: "tests/api/cache-hit-logs.test.ts META-02 spy"
      to: "src/pages/api/chat.ts assistant-turn appendTurn invocation"
      via: "vi.spyOn(transcripts, 'appendTurn') + mockAnthropicWithUsage SSE fixture"
      pattern: "appendTurnSpy.*calls.*\"assistant\""
---

<objective>
Land Phase 18's last test-only safety net BEFORE the manual UAT (Plan 18-08). Two new/extended files:

1. **NEW `tests/build/append-turn-call-site.test.ts`** — source-text forward-defense covering the four D-10/D-11/D-09 invariants in `src/pages/api/chat.ts`. If a future revision drops the `.catch` chain, destructures `ctx`, moves the user-turn waitUntil before validateRequest, or removes the assistant-turn waitUntil's anchor at controller.close(), this test fails AT commit time. Mirrors `tests/build/worker-entrypoint.test.ts` (Phase 17 FOUND-02 forward-defense pattern).

2. **EXTEND `tests/api/cache-hit-logs.test.ts`** — adds META-02 closure assertion that `appendTurn(assistant, ..., meta)` receives `cache_read_input_tokens` + `cache_creation_input_tokens` BYTE-IDENTICAL to the values the `chat.cache_metrics` log line consumes (source-of-truth-once verified at runtime, not just at source-text).

Plan 18-07 is the LAST opportunity to catch a Plan-18-05 wiring drift before the manual UAT in Plan 18-08 spends Anthropic tokens on a 3× identical POST. If META-02 source-of-truth-once is broken (e.g., cacheUsage is read in two different places that diverge), or if the .catch chain disappears in a future maintenance pass, Phase 18 ships with silent observability gaps. Plan 18-07 plugs all of those.

Re-verify `tests/api/sse-snapshot.test.ts` GREEN against the post-Plan-18-05 wired source — TEST-02 plan-time-amendment language in REQUIREMENTS.md anticipated this re-verification. No fixture re-baseline expected (waitUntil calls land off the controller-enqueue path) — Plan 18-07 confirms this expectation holds.

Purpose: Closes the static-test side of TEST-03 / D-15 / D-26 BEFORE the operator runs the live UAT. After Plan 18-07 commits, the test surface for Phase 18 is COMPLETE — Plan 18-08 is operational verification only.

Output: New `tests/build/append-turn-call-site.test.ts` with ≥4 tests; extended `tests/api/cache-hit-logs.test.ts` with ≥1 new META-02 test (existing 3 stay GREEN). All chat-surface tests + sse-snapshot GREEN.
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
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-05-SUMMARY.md
@tests/build/worker-entrypoint.test.ts
@tests/api/cache-hit-logs.test.ts
@src/pages/api/chat.ts
@src/lib/chat-transcripts.ts
</context>

<interfaces>
<!-- Plan 18-07 ONLY touches test files. Sources are read-only forward-defense targets. -->

Source file under guard: `src/pages/api/chat.ts` (post-Plan-18-05 wired state). The forward-defense tests read this file via `readFileSync` and assert source-text invariants via regex.

D-10 / D-11 / D-09 invariants (locked by `tests/build/append-turn-call-site.test.ts`):

  Invariant A — appendTurn imported from chat-transcripts:
    regex: /import\s*\{[^}]*\bappendTurn\b[^}]*\}\s*from\s*["']\.\.\/\.\.\/lib\/chat-transcripts["']/

  Invariant B — D-10 user-turn waitUntil AFTER validateRequest:
    indices: src.search(/validateRequest\(/) < src.search(/ctx\.waitUntil\(\s*appendTurn\([^)]*["']user["']/)
    BOTH > -1

  Invariant C — D-11 assistant-turn waitUntil AFTER controller.close():
    indices: src.search(/controller\.close\(\)/) < src.search(/ctx\.waitUntil\(\s*appendTurn\([^)]*["']assistant["']/)
    BOTH > -1

  Invariant D — D-09 .catch chain on BOTH waitUntil calls:
    regex match all: /ctx\.waitUntil\(\s*appendTurn\([\s\S]*?\)\s*\)/g
    each match contains ".catch("
    expected match count: 2

  Invariant E — anti-destructure (Pitfall 1):
    regex: /const\s*\{\s*waitUntil\s*\}\s*=\s*ctx\b/
    expected: NOT to match (no destructure)

META-02 closure assertion (lands in `tests/api/cache-hit-logs.test.ts`):

  Setup: vi.spyOn(transcripts, "appendTurn") + mockAnthropicWithUsage SSE fixture
  Drive: POST handler with sessionId in body
  Assertion: appendTurnSpy.mock.calls.find(c => c[2] === "assistant") returns a call whose
             c[4] (meta arg) contains cache_read_input_tokens + cache_creation_input_tokens
             equal to the mocked usage values (e.g., 80 + 0)
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Author tests/build/append-turn-call-site.test.ts source-text forward-defense (verify Plan 18-05 wiring stays present)</name>
  <files>tests/build/append-turn-call-site.test.ts</files>
  <read_first>
    - tests/build/worker-entrypoint.test.ts (analog pattern — verbatim readFileSync + describe + regex assertions; this is THE forward-defense template Plan 18-07 copies)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md (§ tests/build/append-turn-call-site.test.ts — verbatim full canonical idiom lines 411-468)
    - src/pages/api/chat.ts (verify the Plan-18-05-wired source — confirm the regex patterns match the actual post-Plan-18-05 source-text shape)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-05-SUMMARY.md (the two waitUntil call sites' exact line numbers — Plan 18-07 doesn't depend on line numbers per se, but the SUMMARY confirms the source shape Plan 18-07 forward-defends)
  </read_first>
  <behavior>
    Test file `tests/build/append-turn-call-site.test.ts` MUST contain ≥4 tests:

    1. **appendTurn imported correctly**: src matches `/import\s*\{[^}]*\bappendTurn\b[^}]*\}\s*from\s*["']\.\.\/\.\.\/lib\/chat-transcripts["']/`. This guards against the import path drifting (e.g., someone refactoring src/lib/ → src/server/lib/ would break this test).

    2. **D-10 anchor**: `const validateIdx = src.search(/validateRequest\(/);` AND `const userWaitIdx = src.search(/ctx\.waitUntil\(\s*appendTurn\([^)]*["']user["']/);` AND `expect(validateIdx).toBeGreaterThan(-1); expect(userWaitIdx).toBeGreaterThan(-1); expect(userWaitIdx).toBeGreaterThan(validateIdx);`

    3. **D-11 anchor**: `const closeIdx = src.search(/controller\.close\(\)/);` AND `const assistantWaitIdx = src.search(/ctx\.waitUntil\(\s*appendTurn\([^)]*["']assistant["']/);` AND `expect(closeIdx).toBeGreaterThan(-1); expect(assistantWaitIdx).toBeGreaterThan(-1); expect(assistantWaitIdx).toBeGreaterThan(closeIdx);`

    4. **D-09 .catch chain on BOTH waitUntil calls** (RESEARCH Pitfall 1 silent-swallow rule): `const matches = src.match(/ctx\.waitUntil\(\s*appendTurn\([\s\S]*?\)\s*\)/g) ?? [];` AND `expect(matches.length).toBe(2); for (const match of matches) { expect(match).toContain(".catch("); }`. This is the MOST IMPORTANT test in the file — without `.catch` chained BEFORE waitUntil, KV failures are silently swallowed and D-09 structured-error-log invisible.

    5. **Anti-destructure pattern** (RESEARCH Pitfall 1 illegal-invocation rule): `expect(src).not.toMatch(/const\s*\{\s*waitUntil\s*\}\s*=\s*ctx\b/);`. Without this guard, `const { waitUntil } = ctx` would lose the `this` binding → runtime "Illegal invocation".

    Optional but recommended:

    6. **No new SSE frame types** (D-15 anchor — chat-transcripts log emission stays out of the SSE stream): `expect(src).not.toMatch(/data:\s*\$\{\s*JSON\.stringify\(\{\s*persistence/);` — guards against accidentally enqueuing a `data: {persistence:"saved"}\n\n` SSE frame.

    7. **chat-transcripts log namespace** present (provides operator surface): `expect(src).toMatch(/chat\.transcript\.write_failed/);` AND `expect(src).toMatch(/error_class/);`.

    All tests grouped under `describe("D-10 / D-11 / D-09: ctx.waitUntil(appendTurn(...).catch(...)) call sites in api/chat.ts (Plan 18-07 forward-defense)")`.

    Imports + file structure mirror `tests/build/worker-entrypoint.test.ts:1-44` verbatim. The describe and test bodies mirror PATTERNS.md § "tests/build/append-turn-call-site.test.ts" lines 411-468.
  </behavior>
  <action>
Create `tests/build/append-turn-call-site.test.ts` following the verbatim pattern from `tests/build/worker-entrypoint.test.ts` + PATTERNS.md lines 411-468.

File-header docblock (verbatim from PATTERNS.md lines 413-426):

```
/**
 * D-10 / D-11 — appendTurn call-site forward defense.
 *
 * Two ctx.waitUntil(appendTurn(…).catch(…)) calls must appear in api/chat.ts:
 *   1. AFTER validateRequest, BEFORE the Anthropic stream begins (D-10).
 *   2. AFTER controller.close(), inside the start(controller) closure (D-11).
 *
 * Pattern follows tests/build/worker-entrypoint.test.ts — readFileSync the
 * source file, assert source-text invariants via regex. This is the anti-
 * regression invariant: future edits that drop the waitUntil wrapper, the
 * .catch chain, or the call-site anchor would silently break the durability
 * contract (D-09 silent-fail without the .catch; D-15 byte-identical SSE if
 * waitUntil is replaced with await).
 *
 * Source: 18-PATTERNS.md lines 411-468 + 18-RESEARCH.md § Pitfall 1.
 */
```

Imports:
```
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
```

Body — single top-level describe `D-10 / D-11 / D-09: ctx.waitUntil(appendTurn(...).catch(...)) call sites in api/chat.ts`. Inside the describe:
```
const src = readFileSync(join(process.cwd(), "src/pages/api/chat.ts"), "utf8");
```

Then author the 5 tests (the 4 must-have + the anti-destructure) per the `<behavior>` block. Use the exact regex patterns from PATTERNS.md lines 432-468 — they have been verified against the wiring shape Plan 18-05 produces.

After writing, run `pnpm exec vitest run tests/build/append-turn-call-site.test.ts`. Expected: ALL ≥5 tests GREEN (Plan 18-05 has already shipped the correct source-text shape; Plan 18-07 just locks it). If ANY test FAILS:
  - Test 1 failure → import path drifted (Plan 18-05 used a different relative path). Verify by reading the import block of api/chat.ts; if path is correct, fix the regex to match. If path is wrong, regenerate Plan 18-05's import.
  - Test 2 failure → user-turn waitUntil missing or before validateRequest. Plan 18-05 wiring is broken; STOP and fix Plan 18-05.
  - Test 3 failure → assistant-turn waitUntil missing or before controller.close(). Plan 18-05 wiring is broken; STOP and fix.
  - Test 4 failure → at least one waitUntil lacks `.catch`. Plan 18-05 wiring violates RESEARCH Pitfall 1; STOP and fix.
  - Test 5 failure → someone destructured ctx. Plan 18-05 wiring violates Pitfall 1; STOP and fix.

The intended outcome is ALL GREEN immediately after Task 1 — Plan 18-07 is forward-defense, not bug-find. Failures here mean Plan 18-05 has a wiring defect that must be repaired BEFORE Plan 18-07 closes.

Commit shape: `test(18-07): tests/build/append-turn-call-site.test.ts NEW source-text forward-defense for D-10 / D-11 / D-09 anchors`.
  </action>
  <verify>
    <automated>pnpm exec vitest run tests/build/append-turn-call-site.test.ts 2>&1 | tail -5 && node -e "const fs = require('fs'); const f = fs.readFileSync('tests/build/append-turn-call-site.test.ts', 'utf8'); const checks = [/readFileSync/.test(f), /src\/pages\/api\/chat\.ts/.test(f), /describe\([\"']D-10/.test(f), /validateRequest/.test(f), /controller\.close/.test(f), /\.catch\(/.test(f), /not\.toMatch/.test(f), !/const\s*\{\s*waitUntil\s*\}\s*=\s*ctx\b/.test(f), (f.match(/\bit\(/g) || []).length >= 4]; const failed = checks.findIndex(c => !c); if (failed >= 0) { console.error('Source check ' + failed + ' failed'); process.exit(1); } process.exit(0);"</automated>
  </verify>
  <done>tests/build/append-turn-call-site.test.ts exists with ≥4 tests (target 5-7), all GREEN. readFileSync against src/pages/api/chat.ts. Invariants A-E from `<interfaces>` covered. Anti-destructure pattern explicitly asserted.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Extend tests/api/cache-hit-logs.test.ts with META-02 closure assertion (appendTurn meta = cacheUsage source-of-truth-once)</name>
  <files>tests/api/cache-hit-logs.test.ts</files>
  <read_first>
    - tests/api/cache-hit-logs.test.ts (existing 3 cache-metrics tests — Plan 17-05 DEBT-02 shape; existing imports + describe block; existing mockAnthropicWithUsage helper if present)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md (§ tests/api/cache-hit-logs.test.ts MODIFY — META-02 NEW test lines 887-924; mockLocals shape lines 928-936)
    - src/pages/api/chat.ts (post-Plan-18-05 — confirm cacheUsage closure object is read into appendTurn(assistant, ..., meta) inside the start(controller) closure)
    - src/lib/chat-transcripts.ts (confirm appendTurn signature accepts meta as 5th arg with cache_read_input_tokens / cache_creation_input_tokens optional fields)
  </read_first>
  <behavior>
    Add at least ONE new test to `tests/api/cache-hit-logs.test.ts` covering META-02 source-of-truth-once. Existing 3 tests stay byte-identical.

    Required test (META-02 closure):

    Setup:
      - Mock Anthropic SDK to produce an SSE response with usage `{ input_tokens: 100, cache_read_input_tokens: 80, cache_creation_input_tokens: 0, output_tokens: 50 }`.
      - Mock CHAT_KV in the cloudflare:workers virtual module env (or via mockLocals.runtime — use whatever shape Plan 18-05's wiring expects; per PATTERNS.md mockLocals is the recommended shape).
      - vi.spyOn(transcripts, "appendTurn") — import * as transcripts from "../../src/lib/chat-transcripts" first.
      - Mock ctx.waitUntil to be a no-op that immediately resolves the promise (lets appendTurn's spy resolve so the assertion can observe the call args).

    Drive:
      - Build a POST Request with body `{ sessionId: VALID_UUIDV4, messages: [{ role: "user", content: "Hi" }] }`.
      - Pass mockLocals as the second `locals` field per Plan 18-05's signature change.
      - `await POST({ request, locals: mockLocals } as never);` then `await drain(response);` to wait for the SSE stream + the post-close waitUntil resolution.

    Assertion:
      - Find the assistant-turn appendTurn call: `const assistantCall = appendTurnSpy.mock.calls.find(c => c[2] === "assistant");`
      - Assert it exists: `expect(assistantCall).toBeDefined();`
      - Extract meta (5th argument, index 4): `const meta = assistantCall![4] as Record<string, unknown>;`
      - Assert META-02 fields: `expect(meta.cache_read_input_tokens).toBe(80); expect(meta.cache_creation_input_tokens).toBe(0);` — these values MUST match the mocked Anthropic usage values, proving source-of-truth-once (cacheUsage → log + appendTurn use the same values).

    Test name: `it("META-02: appendTurn(assistant, ...) receives meta with the same cache_read/cache_creation tokens as the chat.cache_metrics log line")` — placed inside the existing describe block `describe("DEBT-02: chat.cache_metrics structured log seam")`.

    Hard-coded fixture: `const VALID_UUIDV4 = "8b0f7f1c-1234-4567-8901-abcdef012345";` declared in the test or imported from a shared fixture if one exists in the file.
  </behavior>
  <action>
Open `tests/api/cache-hit-logs.test.ts`. Read the entire file to understand:
  - Existing imports (vitest, vi, request shape helpers)
  - Existing mockAnthropicWithUsage helper (or equivalent — note its signature)
  - Existing describe block + the 3 cache-metrics tests
  - Existing drain helper

Add the following modifications:

1. **Add a new import** at the top (after existing imports):
   ```
   import * as transcripts from "../../src/lib/chat-transcripts";
   ```

2. **Declare mockLocals constant** at file scope (after existing fixture constants). Shape matches Plan 18-05's defensive ctx access — Astro v6 path is `locals.cfContext` per RESEARCH § Open Questions (RESOLVED) Q1 (verified against `node_modules/@astrojs/cloudflare/dist/utils/handler.js`):
   ```
   const mockLocals = {
     cfContext: {
       waitUntil: (p: Promise<unknown>) => { void p; },  // immediate no-op; appendTurn spy captures the call synchronously when waitUntil's argument is built
       passThroughOnException: () => {},
     },
   };
   ```
   Plan 18-05 reads `(locals as { cfContext?: { waitUntil: ... } } | undefined)?.cfContext` and falls back to a no-op stub when absent. Either shape allows the META-02 test to pass (spy captures call synchronously), but matching the locked path keeps PATTERNS.md, Plan 18-05, and Plan 18-07 consistent.

3. **Add the META-02 test** inside the existing top-level describe block (after the existing 3 tests, before the closing `})` of the describe). The new test goes inside the `describe("DEBT-02: chat.cache_metrics structured log seam")` block (the existing describe — confirm its exact name when reading the file).

   Test body — verbatim from PATTERNS.md § "META-02 NEW test" lines 889-924 with minor adaptations to match the file's actual helper functions:

   ```
   it("META-02: appendTurn(assistant, ...) receives meta with the same cache_read/cache_creation tokens as the chat.cache_metrics log line", async () => {
     const VALID_UUIDV4 = "8b0f7f1c-1234-4567-8901-abcdef012345";
     const appendTurnSpy = vi.spyOn(transcripts, "appendTurn").mockResolvedValue(undefined);
     vi.doMock("@anthropic-ai/sdk", () =>
       mockAnthropicWithUsage({
         input_tokens: 100,
         cache_read_input_tokens: 80,
         cache_creation_input_tokens: 0,
         output_tokens: 50,
       })
     );
     const { POST } = await import("../../src/pages/api/chat");
     const request = new Request("https://jackcutrara.com/api/chat", {
       method: "POST",
       headers: { "Content-Type": "application/json", Origin: "https://jackcutrara.com" },
       body: JSON.stringify({
         sessionId: VALID_UUIDV4,
         messages: [{ role: "user", content: "Hi" }],
       }),
     });
     const response = await POST({ request, locals: mockLocals } as never);
     await drain(response);

     // META-02 source-of-truth-once: assistant-turn appendTurn meta carries the SAME
     // cache token fields the chat.cache_metrics log line consumes (per 18-PATTERNS.md).
     // Both reads come from the closure-scoped cacheUsage object set at message_start.
     const assistantCall = appendTurnSpy.mock.calls.find((c) => c[2] === "assistant");
     expect(assistantCall).toBeDefined();
     const meta = assistantCall![4] as Record<string, unknown>;
     expect(meta.cache_read_input_tokens).toBe(80);
     expect(meta.cache_creation_input_tokens).toBe(0);

     appendTurnSpy.mockRestore();
   });
   ```

   If the file's existing test helpers use different names (e.g., `mockAnthropic({ usage })` rather than `mockAnthropicWithUsage({...})`), adapt the test to use the local helper while preserving the same usage values.

4. **If existing 3 tests fail because Plan 18-05's `locals` destructure now requires the mockLocals shape**, add `locals: mockLocals` to each existing POST drive. Read the existing tests first; if they currently call `POST({ request } as never)`, change to `POST({ request, locals: mockLocals } as never)`. This is an additive adjustment — same test logic, additional context arg. Existing assertions stay byte-identical.

After writing:
1. `pnpm exec vitest run tests/api/cache-hit-logs.test.ts` — ALL tests GREEN (existing 3 + new META-02 = ≥4 total).
2. `pnpm exec astro check` — 0/0/0.
3. `pnpm test` — full suite. Expected: 453 (Plan 18-06 close) + 5 (Task 1) + 1 (Task 2) = 459 PASS / 0 FAIL / 2 SKIP.

Commit shape: `test(18-07): tests/api/cache-hit-logs.test.ts +META-02 source-of-truth-once + mockLocals shape for Plan 18-05 locals`.
  </action>
  <verify>
    <automated>pnpm exec vitest run tests/api/cache-hit-logs.test.ts 2>&1 | tail -5 && pnpm exec astro check 2>&1 | tail -3 && node -e "const fs = require('fs'); const f = fs.readFileSync('tests/api/cache-hit-logs.test.ts', 'utf8'); const checks = [/META-02/.test(f), /import\s*\*\s*as\s+transcripts\s+from\s+[\"']\.\.\/\.\.\/src\/lib\/chat-transcripts[\"']/.test(f), /vi\.spyOn\(transcripts\s*,\s*[\"']appendTurn[\"']\)/.test(f), /mockLocals[\s\S]{0,100}cfContext/.test(f), /cache_read_input_tokens.*\.toBe\(80\)|toBe\(80\).*cache_read/.test(f) || /cache_read_input_tokens[\s\S]{0,50}80/.test(f)]; const failed = checks.findIndex(c => !c); if (failed >= 0) { console.error('Source check ' + failed + ' failed'); process.exit(1); } process.exit(0);"</automated>
  </verify>
  <done>tests/api/cache-hit-logs.test.ts has ≥4 total tests (existing 3 + new META-02). META-02 test asserts appendTurn assistant-turn meta carries cache_read_input_tokens: 80 + cache_creation_input_tokens: 0 from mocked usage. mockLocals shape supports Plan 18-05's locals destructure. `pnpm exec astro check` 0/0/0. All tests in this file GREEN.</done>
</task>

<task type="auto">
  <name>Task 3: Plan-end gate — re-verify sse-snapshot (D-15 anchor) + FULL D-26 chat regression battery + astro check 0/0/0</name>
  <files>(verification only — no files modified)</files>
  <read_first>
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md (critical constraints #1 #3 — D-15 SSE byte-identical, D-26 chat battery 117/117 GREEN; #2 — TEST-03 cross-phase gate)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-VALIDATION.md (Before /gsd-verify-work: full suite green + astro check 0/0/0 + sse-snapshot 3/3 GREEN + D-26 chat-surface battery 30/30+ GREEN)
  </read_first>
  <action>
This is the FINAL plan before the operator runs the manual UAT (Plan 18-08). Plan 18-07 closes the test surface and re-verifies D-15 explicitly.

Five commands, in order:

1. `pnpm test` — full suite. Expected: 453 (Plan 18-06 close) + 5 (Plan 18-07 Task 1) + 1 (Plan 18-07 Task 2) = 459 PASS / 0 FAIL / 2 SKIP. If any new failure, STOP and root-cause before Plan 18-08.

2. `pnpm exec astro check` — 0/0/0 baseline carry-forward.

3. `pnpm exec vitest run tests/api/sse-snapshot.test.ts` — **D-15 byte-identical re-verify**. 3/3 GREEN. If a snapshot mismatch surfaces, Plan 18-05's wiring has accidentally affected the SSE byte stream — this is a phase-blocking regression. STOP, fix, and re-run. The plan-time-authored D-15 amendment in REQUIREMENTS.md TEST-02 commentary anticipates the two waitUntil calls land OFF the controller-enqueue path; this gate confirms that anticipation holds.

4. `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` — TEST-03 forward-defense + D-16 = 8/8 GREEN.

5. **Full D-26 chat-surface focused battery** (Plan 18-08 UAT will rely on this surface being GREEN):
   ```
   pnpm exec vitest run tests/api/sse-snapshot.test.ts tests/api/anthropic-payload-shape.test.ts tests/api/cache-hit-logs.test.ts tests/api/validation.test.ts tests/api/chat-session-id.test.ts tests/api/chat-transcripts.test.ts tests/client/listener-dedup.test.ts tests/client/chat-panel-display.test.ts tests/client/chat-sessionid-mint.test.ts tests/client/chat-copy-button.test.ts tests/build/no-imperative-display-flip.test.ts tests/build/no-inline-display-on-chat-panel.test.ts tests/build/append-turn-call-site.test.ts
   ```
   All GREEN.

Record gate status in Plan 18-07 SUMMARY. Note explicitly:
  - D-15: `tests/api/sse-snapshot.test.ts` 3/3 GREEN — SSE byte-identical preserved across the Plan 18-05 ctx.waitUntil amendment.
  - TEST-03 static: `tests/api/anthropic-payload-shape.test.ts` 8/8 GREEN.
  - TEST-01 / D-26: 13-file chat-surface focused battery all GREEN.
  - Total Phase 18 new tests landed: chat-transcripts (16) + chat-session-id (7) + anthropic-payload-shape D-16 (3) + chat-sessionid-mint (8) + append-turn-call-site (5) + cache-hit-logs META-02 (1) = ~40 new tests.

If ANY gate fails, do NOT proceed to Plan 18-08 — fix the regression first. The manual UAT in Plan 18-08 is the LIVE counterpart of these static gates; running it against broken static gates wastes Anthropic tokens.
  </action>
  <verify>
    <automated>pnpm test 2>&1 | tail -3 && pnpm exec astro check 2>&1 | tail -3 && pnpm exec vitest run tests/api/sse-snapshot.test.ts 2>&1 | tail -3 && pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts 2>&1 | tail -3 && pnpm exec vitest run tests/api/cache-hit-logs.test.ts tests/api/validation.test.ts tests/api/chat-session-id.test.ts tests/api/chat-transcripts.test.ts tests/client/listener-dedup.test.ts tests/client/chat-panel-display.test.ts tests/client/chat-sessionid-mint.test.ts tests/build/no-imperative-display-flip.test.ts tests/build/no-inline-display-on-chat-panel.test.ts tests/build/append-turn-call-site.test.ts 2>&1 | tail -3</automated>
  </verify>
  <done>`pnpm test` ≥ 459 PASS / 0 FAIL / 2 SKIP. `pnpm exec astro check` 0/0/0. sse-snapshot 3/3 GREEN (D-15 explicit re-verify). anthropic-payload-shape 8/8 GREEN (TEST-03). 13-file D-26 chat-surface focused battery all GREEN. Plan SUMMARY records gate counts and notes Phase 18 ready for UAT (Plan 18-08).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| test → source (read-only) | Plan 18-07 reads source via readFileSync for forward-defense. No runtime trust boundary affected; this is build-time regression guarding. |
| test → mocked Anthropic SDK | META-02 test mocks the SDK; cache-token values are test-controlled, not platform-state-dependent. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-18-07-01 | Repudiation | Future revision drops .catch chain on waitUntil → KV failures invisible | mitigate | tests/build/append-turn-call-site.test.ts Test 4 asserts every ctx.waitUntil(appendTurn(...)) match contains ".catch(". RESEARCH § Pitfall 1 says rejections are silently swallowed without the explicit .catch — this test is THE invariant lock preventing that drift. Per V7. |
| T-18-07-02 | Tampering | Future revision destructures ctx → "Illegal invocation" runtime | mitigate | tests/build/append-turn-call-site.test.ts Test 5 asserts source does NOT match the destructure pattern. Per V13. |
| T-18-07-03 | Information Disclosure | Future revision adds an SSE diagnostic frame (e.g., persistence_warning) → D-15 byte-identical breaks | mitigate | tests/build/append-turn-call-site.test.ts Test 6 (optional) asserts no `data: ${JSON.stringify({persistence...})}\n\n` pattern. PLUS sse-snapshot 3/3 GREEN at every chat-surface commit catches the runtime side. Two-layer defense per V13. |
| T-18-07-04 | Tampering | cacheUsage drift — two different reads of cache_read_input_tokens diverging | mitigate | tests/api/cache-hit-logs.test.ts META-02 closure asserts appendTurn(assistant, ..., meta).cache_read_input_tokens equals the value the chat.cache_metrics log line emits — proves the same closure-scoped cacheUsage object feeds both consumers. Per V7. |

ASVS L1 mapping for this plan: V7 yes (forward-defense for the structured-error-log shape + cache token observability surface), V13 yes (TEST-03 + D-15 static verification). V3/V5/V6/V14 — NOT EXERCISED (test-only plan).
</threat_model>

<verification>
**Plan-end checks (all must pass):**

1. `pnpm test` — full suite ≥ 459 PASS / 0 FAIL / 2 SKIP.
2. `pnpm exec astro check` — 0/0/0.
3. `pnpm exec vitest run tests/build/append-turn-call-site.test.ts` — all new tests GREEN (target ≥5).
4. `pnpm exec vitest run tests/api/cache-hit-logs.test.ts` — existing 3 + new META-02 = ≥4 GREEN.
5. **`pnpm exec vitest run tests/api/sse-snapshot.test.ts` — 3/3 GREEN — D-15 byte-identical anchor re-verified post-Plan-18-05 wiring.**
6. `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` — 8/8 GREEN (TEST-03 + D-16).
7. 13-file D-26 chat-surface focused battery GREEN.
8. Source diff confined to test files: `git diff --exit-code src/` exits 0 (Plan 18-07 touches NO source code).
</verification>

<success_criteria>
- `tests/build/append-turn-call-site.test.ts` exists with ≥4 tests (target 5-7) covering D-10 + D-11 + D-09 anchors + anti-destructure.
- `tests/api/cache-hit-logs.test.ts` extended with META-02 closure test (≥4 total tests in file).
- All chat-surface focused tests GREEN — phase ready for UAT.
- `pnpm exec vitest run tests/api/sse-snapshot.test.ts` 3/3 GREEN — D-15 byte-identical anchor explicitly re-verified.
- `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` 8/8 GREEN — TEST-03 forward-defense holding.
- `pnpm test` ≥ 459 PASS / 0 FAIL / 2 SKIP; `pnpm exec astro check` 0/0/0.
- `git diff --exit-code src/` exits 0 — Plan 18-07 is test-only.
</success_criteria>

<output>
After completion, create `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-07-SUMMARY.md` recording:
- Test count delta (Plan 18-06 close → Plan 18-07 close: 453 → ≥459 PASS)
- New tests added: append-turn-call-site (5) + cache-hit-logs META-02 (1) = 6 net new
- `astro check` 0/0/0 preserved
- D-15 sse-snapshot status: 3/3 GREEN — re-verified post-waitUntil wiring; the plan-time-authored D-15 amendment in REQUIREMENTS.md TEST-02 commentary is confirmed safe
- TEST-03 forward-defense status: anthropic-payload-shape 8/8 GREEN
- 13-file D-26 chat-surface focused battery all GREEN
- Anchor for Plan 18-08: the operator can now run the manual TEST-03 UAT against `*.workers.dev` preview (then production) with confidence that every STATIC gate is green
- Phase 18 total new tests: ~40 (chat-transcripts 16 + chat-session-id 7 + anthropic-payload-shape D-16 3 + chat-sessionid-mint 8 + append-turn-call-site 5 + cache-hit-logs META-02 1)
</output>
