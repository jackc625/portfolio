---
phase: 18-persistence-identity-kv-write-path-sessionid
plan: 04
type: tdd
wave: 1
depends_on: [01, 03]
files_modified:
  - tests/api/anthropic-payload-shape.test.ts
autonomous: true
requirements: [TEST-03, IDENT-02]
must_haves:
  truths:
    - "Existing 5 forward-defense tests (Plan 17-05 commit 19471fe) stay GREEN — the legacy contract is preserved"
    - "NEW assertion (D-16-a): byte-identical system block + messages[0] when buildChatRequestArgs is invoked with the SAME messages — sessionId-bearing vs no-sessionId request body produces structurally identical Anthropic args"
    - "NEW assertion (D-16-b — source-text guard): src/prompts/chat-request-shape.ts buildChatRequestArgs signature does NOT name a `sessionId` parameter (catches a template-string concatenation leak that pattern-grep would miss)"
    - "NEW assertion (D-16-c): validateRequest accepts a request body carrying sessionId on the envelope — closes the loop with Plan 18-03"
  artifacts:
    - path: "tests/api/anthropic-payload-shape.test.ts"
      provides: "Extended 5+3 forward-defense tests covering D-16 sessionId-on-envelope path"
      contains: "D-16"
      min_lines: 100
  key_links:
    - from: "tests/api/anthropic-payload-shape.test.ts D-16-b source-text guard"
      to: "src/prompts/chat-request-shape.ts buildChatRequestArgs(context, messages)"
      via: "readFileSync + regex on function signature"
      pattern: "buildChatRequestArgs\\s*\\([^)]*\\)"
    - from: "tests/api/anthropic-payload-shape.test.ts D-16-a byte-equality"
      to: "Anthropic prompt cache hit predicate (system + messages[0] byte-identical)"
      via: "JSON.stringify equality across sessionId-bearing vs no-sessionId calls"
      pattern: "expect\\(JSON\\.stringify\\(.*\\.system\\)\\)\\.toBe\\(JSON\\.stringify"
---

<objective>
Extend `tests/api/anthropic-payload-shape.test.ts` (Plan 17-05 commit `19471fe`) with three new assertions covering the D-16 sessionId-on-envelope contract. The existing 5 forward-defense tests stay byte-identical; Plan 18-04 ADDS to the file without modifying any existing test.

The three new assertions catch a regression class that the existing 5 tests miss: a template-string concatenation that smuggles sessionId into the system block. Pattern-grep against `args.system` for literal "sessionId" would miss `\`session ${sid}\`` constructions; pattern-grep against UUIDv4 regex catches some leaks but misses synthetic IDs. The byte-equality assertion across sessionId-bearing vs no-sessionId calls catches BOTH cases — if sessionId leaks into the cacheable surface via any route, the byte-equality breaks.

Per CONTEXT.md D-16: "Today the test asserts ABSENCE (no sessionId literal, no UUIDv4 pattern in system / messages[0], system byte-equal across calls with different messages). Phase 18 ADDS: (a) calling buildChatRequestArgs(portfolioContext, messages) where the request body that produced messages carried a sessionId returns args whose system block + messages[0] are byte-identical to a no-sessionId call; (b) the HTTP envelope (request body shape) DOES carry sessionId and validateRequest accepts it."

This plan is BEFORE Plan 18-05 (api/chat.ts wiring) — it forward-defends the wiring choice. If Plan 18-05 author accidentally threads sessionId into buildChatRequestArgs's parameters, Plan 18-04's assertions catch it AT api/chat.ts commit time.

Purpose: Closes RESEARCH § Pitfall 3 (Anthropic prompt cache invalidated by sessionId leakage) at the test-suite level so Plan 18-05's wiring is structurally safe. TEST-03 manual UAT (Plan 18-08) still validates LIVE cache hits; this plan validates the STATIC payload shape.

Output: tests/api/anthropic-payload-shape.test.ts extended with ≥3 new tests inside a new describe block. All ≥8 tests in the file GREEN.
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
@tests/api/anthropic-payload-shape.test.ts
@src/prompts/chat-request-shape.ts
@src/lib/validation.ts
</context>

<interfaces>
<!-- Plan 17-05 forward-defense — existing 5 tests stay byte-identical -->

Existing assertions (verbatim from `tests/api/anthropic-payload-shape.test.ts:31-69`):
  1. system block does not contain literal 'sessionId'
  2. system block does not contain a UUIDv4 pattern
  3. messages[0].content does not contain literal 'sessionId'
  4. messages[0].content does not contain a UUIDv4 pattern
  5. system block is byte-identical across calls with different messages (cacheable)

<!-- NEW tests Plan 18-04 ADDS — grouped in a new describe block -->

D-16 additions (per CONTEXT.md + 18-PATTERNS.md § "D-16 NEW assertions"):

  describe("D-16: sessionId-on-envelope path (Plan 18-04 extension)") {
    it("(a) byte-identical system + messages[0] regardless of sessionId presence on envelope", ...);
    it("(b) buildChatRequestArgs signature does NOT name a sessionId param (source-text forward-defense)", ...);
    it("(c) validateRequest accepts a body carrying sessionId on the HTTP envelope", ...);
  }

<!-- Required imports for Plan 18-04 additions -->

  import { readFileSync } from "node:fs";   // already imported? if not, ADD
  import { join } from "node:path";         // already imported? if not, ADD
  import { validateRequest } from "../../src/lib/validation";  // NEW import — wires Plan 18-03 contract
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Extend tests/api/anthropic-payload-shape.test.ts with D-16 forward-defense assertions</name>
  <files>tests/api/anthropic-payload-shape.test.ts</files>
  <read_first>
    - tests/api/anthropic-payload-shape.test.ts (EXISTING 5 tests at lines 31-69 — Plan 17-05 commit 19471fe; file header docblock at lines 1-19 mentions Phase 18 as the consumer of the extension)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md (§ tests/api/anthropic-payload-shape.test.ts MODIFY — lines 790-862 with exact assertion code)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-RESEARCH.md (§ Pitfall 3 — Anthropic prompt cache invalidated by sessionId leakage; § Pattern 4 — HTTP envelope isolation)
    - src/prompts/chat-request-shape.ts (current buildChatRequestArgs signature — verify it accepts `(context, messages)` and not sessionId)
    - src/lib/validation.ts (Plan 18-03 just-added `sessionId: z.uuidv4().optional()` — Test (c) reads from here)
  </read_first>
  <behavior>
    Three new tests appended INSIDE a new top-level describe block. Existing 5 tests remain byte-identical (verified with `git diff`).

    **Test (a) — byte-identical system + messages[0] across sessionId-bearing vs no-sessionId calls:**
    Since `buildChatRequestArgs` does not accept a sessionId parameter, calling it with the same `(context, messages)` is structurally byte-identical regardless of what other fields appeared on the HTTP envelope upstream. The test SIMULATES the api/chat.ts code path: build a `ValidatedRequest` with sessionId (via the runtime — call `validateRequest({ sessionId: "8b0f7f1c-1234-4567-8901-abcdef012345", messages: [...] })`), build another WITHOUT sessionId, extract `result.data.messages` from each, pass each `messages` array to `buildChatRequestArgs(portfolioContext, messages)`, then `JSON.stringify(args1.system) === JSON.stringify(args2.system)` AND `JSON.stringify(args1.messages[0]) === JSON.stringify(args2.messages[0])`.

    Use IDENTICAL `messages` content in both branches — the same content array. This is the cache-hit predicate at the test level: same content → same args. Any change in the future that smuggles sessionId into buildChatRequestArgs's body (e.g., reading `result.data.sessionId` and concatenating into the system template) would break this test.

    **Test (b) — source-text guard: buildChatRequestArgs signature has no sessionId param:**
    `const src = readFileSync(join(process.cwd(), "src/prompts/chat-request-shape.ts"), "utf8");` then assert `expect(src).toMatch(/export\s+function\s+buildChatRequestArgs\s*\(/)` AND extract the parameter list via a regex: `const sigMatch = src.match(/buildChatRequestArgs\s*\(([^)]*)\)/);` — assert `expect(sigMatch).not.toBeNull(); expect(sigMatch![1]).not.toContain("sessionId");`.

    Plus a related guard: assert the function body (anything between `buildChatRequestArgs(` and the next top-level `}` — practical approach: read the full file content and assert `expect(src).not.toMatch(/sessionId/)` because chat-request-shape.ts has zero legitimate reason to mention sessionId. If a future revision adds sessionId as a parameter or template-string interpolation, this test fails.

    **Test (c) — validateRequest accepts a body with sessionId on the envelope:**
    `const result = validateRequest({ sessionId: "8b0f7f1c-1234-4567-8901-abcdef012345", messages: [{ role: "user", content: "Hi" }] });` assert `result.success === true` AND `result.data.sessionId === "8b0f7f1c-1234-4567-8901-abcdef012345"`. This wires Plan 18-03's schema contract into the forward-defense surface — if a future revision strips `.optional()` or changes UUIDv4 to UUIDv5 or removes the sessionId field, this test catches it AT the cache-integrity test file (not just at the validation.ts test file).
  </behavior>
  <action>
Open `tests/api/anthropic-payload-shape.test.ts`. Read the current contents top to bottom to identify:
  - The file's existing imports (around lines 1-25 — `vitest`, `buildChatRequestArgs`, `portfolioContext`, `PortfolioContext` type)
  - The end of the existing `describe("TEST-03: ...")` block

Make the following changes (NO modification to the existing 5 tests):

1. **Add three imports** to the top of the file (after any existing imports). If `readFileSync` and `join` are not already imported, add them. ALWAYS add `validateRequest`:

```
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateRequest } from "../../src/lib/validation";
```

If any of these are already present, skip the duplicate.

2. **Add a new top-level describe block** at the bottom of the file (after the closing `})` of the existing TEST-03 describe). Place it INSIDE the same file scope, not nested. Exact structure:

```
describe("D-16: sessionId-on-envelope path (Plan 18-04 extension — TEST-03 hardening)", () => {
  // Plan 18-03 extended RequestSchema with sessionId: z.uuidv4().optional().
  // The cacheable Anthropic surface (system + messages[0]) MUST stay byte-identical
  // regardless of whether sessionId appears on the HTTP envelope (D-16 + RESEARCH § Pitfall 3).

  const VALID_SID = "8b0f7f1c-1234-4567-8901-abcdef012345";
  const FIXED_MESSAGES = [{ role: "user" as const, content: "Hi" }];

  it("(a) buildChatRequestArgs produces byte-identical system + messages[0] regardless of sessionId on envelope", () => {
    // Simulate api/chat.ts code path: validate two bodies — one with sessionId, one without.
    const withSid = validateRequest({ sessionId: VALID_SID, messages: FIXED_MESSAGES });
    const withoutSid = validateRequest({ messages: FIXED_MESSAGES });

    expect(withSid.success).toBe(true);
    expect(withoutSid.success).toBe(true);

    if (!withSid.success || !withoutSid.success) return; // narrow TS

    // Both bodies surface the same messages[] to buildChatRequestArgs.
    // sessionId NEVER threads in — and this test forward-defends that promise.
    const ctx = portfolioContext as unknown as PortfolioContext;
    const argsWithSid = buildChatRequestArgs(ctx, withSid.data.messages);
    const argsWithoutSid = buildChatRequestArgs(ctx, withoutSid.data.messages);

    expect(JSON.stringify(argsWithSid.system)).toBe(JSON.stringify(argsWithoutSid.system));
    expect(JSON.stringify(argsWithSid.messages[0])).toBe(JSON.stringify(argsWithoutSid.messages[0]));
  });

  it("(b) buildChatRequestArgs source-text contains zero sessionId references (no template-string leak)", () => {
    // RESEARCH § Pitfall 3: a template-string concatenation `${sid}` would slip past
    // the literal/UUIDv4-pattern greps in the legacy 5 tests. Source-text forward-defense
    // asserts chat-request-shape.ts has no legitimate reason to mention sessionId at all.
    const src = readFileSync(join(process.cwd(), "src/prompts/chat-request-shape.ts"), "utf8");
    expect(src).toMatch(/export\s+function\s+buildChatRequestArgs\s*\(/);
    const sigMatch = src.match(/buildChatRequestArgs\s*\(([^)]*)\)/);
    expect(sigMatch).not.toBeNull();
    expect(sigMatch![1]).not.toContain("sessionId");
    expect(src).not.toMatch(/sessionId/);
  });

  it("(c) validateRequest accepts a request body carrying sessionId on the HTTP envelope", () => {
    // Closes the loop with Plan 18-03 RequestSchema extension. If the schema later
    // strips .optional() or changes to z.uuid()/z.string().uuid(), this test catches it
    // at the cache-integrity test file (an additional surface beyond Plan 18-03's
    // dedicated tests/api/chat-session-id.test.ts).
    const result = validateRequest({
      sessionId: VALID_SID,
      messages: FIXED_MESSAGES,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionId).toBe(VALID_SID);
    }
  });
});
```

Do NOT modify the existing 5 forward-defense tests. Do NOT modify the file's existing imports beyond the three additions above. Do NOT change the file's existing describe block structure or string text.

Run `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts`. Expected: 5 existing tests GREEN + 3 new tests GREEN = 8/8 GREEN. If test (b) FAILS, inspect `src/prompts/chat-request-shape.ts` for an unexpected `sessionId` reference (there should be none — file hasn't been touched since Plan 17-05). If test (a) FAILS, sessionId is leaking into buildChatRequestArgs somehow — this would be a SHIPPED regression caught by Plan 18-04.

Commit shape: `test(18-04): tests/api/anthropic-payload-shape.test.ts +3 D-16 forward-defense assertions — TEST-03 hardening for Plan 18-05 wiring`.
  </action>
  <verify>
    <automated>pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts 2>&1 | tail -5 && node -e "const fs = require('fs'); const f = fs.readFileSync('tests/api/anthropic-payload-shape.test.ts', 'utf8'); const checks = [/D-16:\s*sessionId-on-envelope path/.test(f), /import\s*\{\s*readFileSync\s*\}/.test(f), /import\s*\{\s*join\s*\}/.test(f), /import\s*\{\s*validateRequest\s*\}/.test(f), /buildChatRequestArgs\\s\*\\\(/.test(f) || /buildChatRequestArgs\\\\s\*\\\\\(/.test(f) || /buildChatRequestArgs/.test(f), /JSON\.stringify\(.*\.system\)\)\.toBe\(JSON\.stringify/.test(f), /not\.toContain\([\"']sessionId[\"']\)/.test(f), (f.match(/\bit\(/g) || []).length >= 8]; const failed = checks.findIndex(c => !c); if (failed >= 0) { console.error('Source check ' + failed + ' failed'); process.exit(1); } process.exit(0);"</automated>
  </verify>
  <done>`tests/api/anthropic-payload-shape.test.ts` has 8+ tests (5 legacy + 3 new). All GREEN. New describe block titled "D-16: sessionId-on-envelope path (Plan 18-04 extension — TEST-03 hardening)" contains the three D-16 tests with the exact (a)/(b)/(c) structure. `validateRequest`, `readFileSync`, `join` imports added. Existing 5 forward-defense tests unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: Plan-end gate — D-26 chat regression battery + astro check + full suite</name>
  <files>(verification only — no files modified)</files>
  <read_first>
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md (critical constraint #3 — D-26 battery; constraint #8 — D-16 extension)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-VALIDATION.md (TEST-03 row — forward-defense source-text stays GREEN)
  </read_first>
  <action>
Plan 18-04 touches ONLY a test file (no source change), so the D-26 gate is informational. But the test extension forward-defends TEST-03 + IDENT-02 + D-16, so the suite must show the gain.

Three commands:

1. `pnpm test` — full suite. Expected: 442 (after Plan 18-03) + 3 new = 445 PASS / 0 FAIL / 2 SKIP.

2. `pnpm exec astro check` — 0/0/0 baseline preserved.

3. `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts tests/api/sse-snapshot.test.ts tests/api/cache-hit-logs.test.ts tests/api/validation.test.ts tests/api/chat-session-id.test.ts` — anthropic + TEST-03 + D-15 + IDENT-02 cluster all GREEN.

Record gate status in SUMMARY. If test (b) fails because someone added a sessionId reference to chat-request-shape.ts between Plan 17-05 and now — STOP and investigate; that's a TEST-03-blocking regression.
  </action>
  <verify>
    <automated>pnpm test 2>&1 | tail -3 && pnpm exec astro check 2>&1 | tail -3 && pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts tests/api/sse-snapshot.test.ts tests/api/cache-hit-logs.test.ts tests/api/validation.test.ts tests/api/chat-session-id.test.ts 2>&1 | tail -3</automated>
  </verify>
  <done>`pnpm test` ≥ 445 PASS / 0 FAIL / 2 SKIP. `pnpm exec astro check` 0/0/0. The TEST-03 / D-16 / IDENT-02 / D-15 / DEBT-02 cluster (5 test files) all GREEN. SUMMARY records exact counts.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| test → source (read-only) | Plan 18-04 reads source via `readFileSync` for the source-text guard. No runtime trust boundary affected; this is a build-time regression guard. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-18-04-01 | Information Disclosure | Future regression leaking sessionId into the Anthropic cacheable surface | mitigate | Test (a) byte-equality across sessionId-bearing vs no-sessionId calls catches ANY leak vector (literal substring, UUIDv4 pattern, template-string interpolation, synthetic substitution). Test (b) source-text guard catches static signature/source-text leaks. Combined with Plan 17-05's existing 5 tests, the forward-defense surface covers: (1) literal sessionId substring, (2) UUIDv4 regex pattern, (3) byte-equality with different messages (legacy), (4) byte-equality with vs without sessionId on envelope (NEW), (5) signature-level no-sessionId-param (NEW), (6) total source-text no-sessionId-reference (NEW). Per V13. |
| T-18-04-02 | Tampering | Test (b) defaults to over-broad rejection — what if chat-request-shape.ts legitimately needs to reference sessionId in a comment? | accept | At Plan 18-04 close, chat-request-shape.ts has zero legitimate need for sessionId (verified by direct file read). If a future plan needs to reference sessionId in this file (e.g., a comment explaining why it's omitted from the Anthropic surface), the test must be updated explicitly — and the update is a deliberate, traceable revision rather than a silent regression. Strictness IS the feature here. Per V13. |
| T-18-04-03 | Repudiation | TEST-03 manual UAT (Plan 18-08) might catch a runtime leak that the static tests don't | mitigate | Plan 18-04 is the STATIC half of TEST-03 hardening; Plan 18-08 is the LIVE half (3× identical POST UAT against preview + production). Both layers required per CONTEXT.md "Specifics" + D-15 (cache miss = blocks phase close). Per V13 + operational verification. |

ASVS L1 mapping for this plan: V13 yes (forward-defense for the cacheable API surface). V3/V5/V6/V7/V14 — NOT EXERCISED (test-only plan, no runtime code).
</threat_model>

<verification>
**Plan-end checks (all must pass):**

1. `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` — 8/8 GREEN (5 legacy + 3 new).
2. `pnpm test` — full suite ≥ 445 PASS / 0 FAIL / 2 SKIP.
3. `pnpm exec astro check` — 0/0/0 preserved.
4. `git diff --stat` shows ONLY `tests/api/anthropic-payload-shape.test.ts` modified. Specifically: `git diff --exit-code src/ wrangler.jsonc tests/api/sse-snapshot.test.ts tests/api/validation.test.ts tests/api/cache-hit-logs.test.ts tests/api/chat-transcripts.test.ts tests/api/chat-session-id.test.ts` exits 0.
5. Existing 5 forward-defense tests in `tests/api/anthropic-payload-shape.test.ts` byte-identical with Plan 17-05 baseline — diff confined to imports + new describe block at end of file.
</verification>

<success_criteria>
- `tests/api/anthropic-payload-shape.test.ts` extended with new describe block `D-16: sessionId-on-envelope path (Plan 18-04 extension — TEST-03 hardening)` containing exactly 3 new tests.
- All 8 tests in the file GREEN.
- Existing 5 forward-defense tests byte-identical to Plan 17-05 baseline (commit `19471fe`) — only additions are at the END of the file plus 3 import lines.
- `pnpm test` ≥ 445 PASS / 0 FAIL / 2 SKIP.
- `pnpm exec astro check` 0/0/0.
- No source-tree file other than `tests/api/anthropic-payload-shape.test.ts` modified.
</success_criteria>

<output>
After completion, create `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-04-SUMMARY.md` recording:
- Test count delta (Plan 18-03 close → Plan 18-04 close: ≥442 → ≥445 PASS)
- Test count breakdown in `tests/api/anthropic-payload-shape.test.ts` (5 legacy + 3 new D-16 = 8 total GREEN)
- `astro check` status (0/0/0 preserved)
- Anchor for Plan 18-05: if api/chat.ts wiring accidentally threads sessionId into buildChatRequestArgs, Plan 18-04 Test (b) source-text guard fails AT Plan 18-05 commit time
- Anchor for Plan 18-08 (UAT): TEST-03 LIVE verification is the operational counterpart; static + live both required per D-15 cache-miss-blocks-close
</output>
