---
phase: 18-persistence-identity-kv-write-path-sessionid
plan: 03
type: tdd
wave: 1
depends_on: [01]
files_modified:
  - src/lib/validation.ts
  - tests/api/chat-session-id.test.ts
autonomous: true
requirements: [IDENT-02]
must_haves:
  truths:
    - "`RequestSchema` accepts a valid UUIDv4 sessionId on the request body envelope"
    - "`RequestSchema` accepts absent sessionId (`sessionId` field omitted entirely from body) — D-04 missing-tolerance branch holds"
    - "`RequestSchema` rejects malformed sessionId (not-a-uuid, UUIDv5, empty string, integer) with `success: false`"
    - "`ValidatedRequest` TS type declares `sessionId?: string` (optional) so api/chat.ts has compile-time access to the field"
    - "`validateRequest(body)` signature unchanged; sessionId surfaces via `result.data.sessionId`"
  artifacts:
    - path: "src/lib/validation.ts"
      provides: "Extended RequestSchema with `sessionId: z.uuidv4().optional()` per Zod v4 version-specific match"
      contains: "z.uuidv4().optional()"
    - path: "tests/api/chat-session-id.test.ts"
      provides: "Schema-level unit tests for IDENT-02 + D-04 missing-tolerance branch"
      contains: "describe(\"IDENT-02"
      min_lines: 100
  key_links:
    - from: "src/lib/validation.ts RequestSchema sessionId field"
      to: "src/pages/api/chat.ts validateRequest call site (Plan 18-05 reads result.data.sessionId)"
      via: "Zod-inferred ValidatedRequest type"
      pattern: "sessionId\\?:\\s*string"
    - from: "Zod v4 z.uuidv4().optional()"
      to: "client-minted `crypto.randomUUID()` output (Plan 18-06)"
      via: "UUIDv4 standard format matched by Zod's version-specific regex"
      pattern: "z\\.uuidv4\\(\\)"
---

<objective>
Extend `src/lib/validation.ts` `RequestSchema` with a single optional UUIDv4 sessionId field per D-04 (missing-tolerance) and IDENT-02 (UUIDv4 specifically). Author `tests/api/chat-session-id.test.ts` covering the schema-level contract: valid UUIDv4 accepted, absent sessionId accepted, malformed sessionId rejected, UUIDv5 rejected (version-specificity).

This is the SIMPLEST plan in Phase 18 — one line of source change + one new test file — but it's the FIRST place in the project where server validation has a "missing-and-acceptable" code path per CONTEXT.md "Specifics". Capture that exception explicitly in tests so future revisions can't silently strip the `.optional()`.

Per RESEARCH § "Zod uuid() vs uuidv4() — version specificity": choose `z.uuidv4()` (not deprecated `z.string().uuid()`, not version-agnostic `z.uuid()`). Matches IDENT-02 "UUIDv4 regex" wording exactly. Zod 4.3.6 in `package.json:32` supports it natively — no version bump.

Purpose: Plan 18-05 (api/chat.ts wiring) reads `validation.data.sessionId` to gate `ctx.waitUntil(appendTurn(...))`. Plan 18-06 (client mint) sends the field via fetch body. Both depend on this plan landing. Plan 18-04 (D-16 forward-defense extension) reads from this plan's schema shape.

Output: One-line `RequestSchema` extension + Zod v4 z.uuidv4() usage. New test file with ≥5 tests covering all four contract bullets.
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
@src/lib/validation.ts
@tests/api/validation.test.ts
</context>

<interfaces>
<!-- Existing RequestSchema (verbatim from src/lib/validation.ts:31-33) -->

  export const RequestSchema = z.object({
    messages: z.array(MessageSchema).min(1).max(30),
  });

<!-- Target RequestSchema after Plan 18-03 -->

  export const RequestSchema = z.object({
    sessionId: z.uuidv4().optional(),  // IDENT-02 (D-04 missing-tolerant): UUIDv4-specific; absent acceptable
    messages: z.array(MessageSchema).min(1).max(30),
  });

<!-- ValidatedRequest TS-inferred type (auto-derives from schema) -->

  export type ValidatedRequest = z.infer<typeof RequestSchema>;
  // → { sessionId?: string; messages: ValidatedMessage[] }

<!-- validateRequest signature UNCHANGED -->

  export function validateRequest(
    body: unknown,
  ): { success: true; data: ValidatedRequest } | { success: false; error: string };

<!-- Zod v4 choice rationale -->
- `z.uuidv4()` — top-level v4 helper (Zod 4.3.6+). Version-specific: only `xxxxxxxx-xxxx-4xxx-[8-b]xxx-xxxxxxxxxxxx` shapes pass.
- `z.uuid()` — RFC 9562/4122 compliant but version-AGNOSTIC. UUIDv5/v6/v7 would pass. **REJECTED.**
- `z.string().uuid()` — deprecated v4 alias of `z.uuid()`. **REJECTED.**

Hard-coded fixture sessionIds (per CONTEXT.md Claude's Discretion — hard-coded is fine):
  - Valid UUIDv4: `"8b0f7f1c-1234-4567-8901-abcdef012345"`
  - UUIDv5 (must REJECT): `"8b0f7f1c-1234-5567-8901-abcdef012345"` (5 in the version-nybble position)
  - Malformed: `"not-a-uuid"`, `""`, `"12345"`, `"8b0f7f1c-1234-4567-8901"` (truncated)
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Author tests/api/chat-session-id.test.ts schema-level test suite (RED for the new schema field)</name>
  <files>tests/api/chat-session-id.test.ts</files>
  <read_first>
    - tests/api/validation.test.ts (analog import + describe + positive/negative case shapes at lines 8-72 — Plan 18-03 mirrors this style)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md (§ tests/api/chat-session-id.test.ts — Schema-level test pattern lines 223-264)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-RESEARCH.md (§ "Zod uuid() vs uuidv4() — version specificity" — UUIDv5 rejection rationale)
    - src/lib/validation.ts (current RequestSchema at lines 31-33; validateRequest at lines 38-46; ValidatedMessage type at line 35; MessageSchema at lines 6-29)
  </read_first>
  <behavior>
    Test file `tests/api/chat-session-id.test.ts` MUST contain ≥5 tests. Required cases:

    1. **Valid UUIDv4 accepted:** `validateRequest({ sessionId: "8b0f7f1c-1234-4567-8901-abcdef012345", messages: [{ role: "user", content: "Hi" }] })` returns `{ success: true, data: { sessionId: "8b0f...", messages: [...] } }`. Assert `result.data.sessionId` strictly equals the input UUID string.

    2. **D-04 missing-tolerance — absent sessionId accepted:** `validateRequest({ messages: [{ role: "user", content: "Hi" }] })` (NO sessionId key at all) returns `{ success: true }`. Assert `result.data.sessionId` is `undefined` (not null, not absent — TS type is `string | undefined`).

    3. **Malformed sessionId rejected — random string:** `validateRequest({ sessionId: "not-a-uuid", messages: [...] })` returns `{ success: false }`.

    4. **Malformed sessionId rejected — UUIDv5 (version-specificity, IDENT-02 wording):** `validateRequest({ sessionId: "8b0f7f1c-1234-5567-8901-abcdef012345", messages: [...] })` returns `{ success: false }`. Note the `5567` at the third group — version nybble is `5`, not `4`. This is the test that distinguishes `z.uuidv4()` from `z.uuid()` — the latter would PASS this, so the test forward-defends the version-specific choice.

    5. **Malformed sessionId rejected — empty string:** `validateRequest({ sessionId: "", messages: [...] })` returns `{ success: false }`.

    6. **Malformed sessionId rejected — non-string type:** `validateRequest({ sessionId: 12345, messages: [...] })` returns `{ success: false }`. (Zod's `z.uuidv4()` is a string subtype; numeric input fails first the string check.)

    7. **Type emission proof — TS-narrowed sessionId:** A test that exercises the TypeScript narrowing: after `if (result.success)`, `result.data.sessionId` is `string | undefined`, not `unknown`. This is more "TS compile-time" than runtime — encode it as a runtime test that asserts `typeof result.data.sessionId === "string" || typeof result.data.sessionId === "undefined"` for both the present and absent cases.

    All tests grouped under a single `describe("IDENT-02 — sessionId validation (D-04 missing-tolerant, UUIDv4-specific)")`.

    Imports mirror `tests/api/validation.test.ts:1-7`:
      import { describe, it, expect } from "vitest";
      import { validateRequest } from "../../src/lib/validation";
  </behavior>
  <action>
Create `tests/api/chat-session-id.test.ts`. File-header comment block citing IDENT-02 + D-04 + Plan 18-03. Import only `describe / it / expect` from vitest, `validateRequest` from `../../src/lib/validation`.

Author all 7 tests above inside `describe("IDENT-02 — sessionId validation (D-04 missing-tolerant, UUIDv4-specific)")`. Use the fixture sessionId constants from `<interfaces>` above declared at top-of-file as `const VALID_UUIDV4`, `const UUIDV5_SHAPE`, `const MALFORMED_STR` for readability.

For Test 4 (UUIDv5 rejection), include a one-line code comment: `// IDENT-02 + RESEARCH § "Zod uuid() vs uuidv4() — version specificity": z.uuidv4() rejects v5; z.uuid() would accept. This test forward-defends the version-specific choice.`

For Test 2 (D-04 missing tolerance), include a comment: `// D-04 amendment to IDENT-02 (Plan 18-01): absent sessionId is acceptable — server skips ctx.waitUntil(appendTurn(...)) entirely while still serving the SSE stream. This is the FIRST "missing-and-acceptable" code path in the project per CONTEXT.md "Specifics" — explicit test prevents future revisions from silently re-mandating the field.`

Run `pnpm exec vitest run tests/api/chat-session-id.test.ts` after writing. Expected: ALL 7 tests FAIL — test 1 fails because current RequestSchema doesn't accept the sessionId field (Zod's default behavior with `passthrough` not set is to STRIP unknown keys, so `result.data.sessionId` will be undefined for valid case — fail); tests 3-6 may PASS because current schema silently strips the field (no rejection); test 2 may PASS (current schema doesn't require sessionId so absence is fine).

RED-state behavior is mixed (some may pass because Zod strips unknown keys silently). The RED→GREEN transition is Test 1 and Test 4 specifically — Test 1 won't pass until the schema accepts and surfaces sessionId; Test 4 won't pass until the schema uses `z.uuidv4()` (not `z.uuid()` or `z.string().uuid()`).

DO NOT touch `src/lib/validation.ts` in this task.
  </action>
  <verify>
    <automated>node -e "const fs = require('fs'); const f = fs.readFileSync('tests/api/chat-session-id.test.ts', 'utf8'); const checks = [/8b0f7f1c-1234-4567-8901-abcdef012345/.test(f), /8b0f7f1c-1234-5567-8901-abcdef012345/.test(f), /D-04|missing-tolerant/i.test(f), /UUIDv4|uuidv4/.test(f), /describe\([\"']IDENT-02/.test(f), (f.match(/\bit\(/g) || []).length >= 5, /from\s+[\"']\.\.\/\.\.\/src\/lib\/validation[\"']/.test(f)]; const failed = checks.findIndex(c => !c); if (failed >= 0) { console.error('Check ' + failed + ' failed'); process.exit(1); } process.exit(0);" && pnpm exec vitest run tests/api/chat-session-id.test.ts 2>&1 | grep -E "(Tests:|passed|failed)" | tail -3</automated>
  </verify>
  <done>tests/api/chat-session-id.test.ts exists with ≥5 tests (target 7), all fixture sessionId values present, IDENT-02 + D-04 cited in describe + comments. `pnpm exec vitest run` reports at least Test 1 and Test 4 FAILING (RED — schema must change to pass them).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Extend RequestSchema with `sessionId: z.uuidv4().optional()` (GREEN)</name>
  <files>src/lib/validation.ts</files>
  <read_first>
    - src/lib/validation.ts (current line 31-33 — the exact text being amended; existing inline-comment style at lines 65-114 — mirror in the new field's comment)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md (§ src/lib/validation.ts — exact target shape lines 754-787; "Why z.uuidv4() not z.string().uuid() or z.uuid()" rationale lines 772-777)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-RESEARCH.md (§ "Zod uuid() vs uuidv4() — version specificity" — confirms Zod 4.3.6 has `z.uuidv4` natively)
    - tests/api/chat-session-id.test.ts (just-authored — Task 2 must turn it GREEN)
  </read_first>
  <behavior>
    All 7 tests in `tests/api/chat-session-id.test.ts` MUST GREEN. The amendment is a SINGLE-LINE addition to RequestSchema (no other source change beyond an inline comment citing IDENT-02 / D-04 / RESEARCH).

    No change to `validateRequest` function signature. No change to `MessageSchema`. No change to `sanitizeMessages`. No change to other exports.

    `ValidatedRequest` type emission updates automatically via `z.infer<typeof RequestSchema>` — runtime code paths in api/chat.ts that read `result.data.messages` continue to compile; the new `result.data.sessionId` becomes available to Plan 18-05.

    `pnpm exec astro check` must exit 0/0/0 (no new type errors introduced — Plan 18-05 reads sessionId AFTER this plan lands).

    Full chat-surface battery + sse-snapshot + anthropic-payload-shape tests MUST stay GREEN (validation.ts is a chat-surface file per CONTEXT.md exit-gate language — D-26 is BLOCKING on this commit).
  </behavior>
  <action>
Open `src/lib/validation.ts`. Locate the existing `RequestSchema` declaration at lines 31-33 (exact current text):

```
export const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
});
```

Replace it with this exact text (preserves byte-identical messages line; adds one sessionId field; one new inline comment line citing IDENT-02 / D-04 / Plan 18-03 / RESEARCH choice):

```
export const RequestSchema = z.object({
  // IDENT-02 (Plan 18-03 / D-04 missing-tolerant per REQUIREMENTS.md v1.3-B6):
  // sessionId is OPTIONAL on the request envelope — absent is acceptable
  // (server skips ctx.waitUntil(appendTurn(...)) and still serves the SSE
  // stream). z.uuidv4() locks the UUIDv4 version per IDENT-02's "UUIDv4
  // regex" wording — z.uuid() would also accept UUIDv5/v6/v7 (RESEARCH
  // § "Zod uuid() vs uuidv4() — version specificity"). sessionId NEVER
  // threads into buildChatRequestArgs / Anthropic payload (TEST-03 anchor).
  sessionId: z.uuidv4().optional(),
  messages: z.array(MessageSchema).min(1).max(30),
});
```

DO NOT change any other line in `src/lib/validation.ts`. The existing `validateRequest`, `sanitizeMessages`, `isAllowedOrigin`, `MAX_BODY_SIZE`, `MessageSchema`, `UserMessageSchema`, `AssistantMessageSchema`, `ValidatedMessage`, `ValidatedRequest` exports STAY byte-identical (the `ValidatedRequest` type derives from the schema — its TS-emitted shape changes implicitly, but the source line `export type ValidatedRequest = z.infer<typeof RequestSchema>;` does not change).

Run `pnpm exec vitest run tests/api/chat-session-id.test.ts` — all 7 tests GREEN.

Run `pnpm exec vitest run tests/api/validation.test.ts` — existing validation tests stay GREEN (no regression).

Run `pnpm exec astro check` — 0/0/0 (no new type errors). If `astro check` reports an error, it's most likely a downstream caller that destructures `result.data` and expected `{ messages }` exactly — since we ADD `sessionId` as optional, no existing call site breaks (TS optional fields are backward-compatible).

Commit shape (REFACTOR not needed — single-line additive): `feat(18-03): src/lib/validation.ts RequestSchema sessionId field — IDENT-02 + D-04 missing-tolerant per Plan 18-01 amendment`.
  </action>
  <verify>
    <automated>pnpm exec vitest run tests/api/chat-session-id.test.ts tests/api/validation.test.ts 2>&1 | tail -5 && pnpm exec astro check 2>&1 | tail -3 && node -e "const fs = require('fs'); const f = fs.readFileSync('src/lib/validation.ts', 'utf8'); const checks = [/sessionId\s*:\s*z\.uuidv4\(\)\.optional\(\)/.test(f), /IDENT-02|D-04|Plan 18-03/.test(f), !/z\.string\(\)\.uuid\(\)/.test(f), !/z\.uuid\(\)\.optional\(\)/.test(f), /messages:\s*z\.array\(MessageSchema\)\.min\(1\)\.max\(30\)/.test(f)]; const failed = checks.findIndex(c => !c); if (failed >= 0) { console.error('Source check ' + failed + ' failed'); process.exit(1); } process.exit(0);"</automated>
  </verify>
  <done>`src/lib/validation.ts` contains `sessionId: z.uuidv4().optional()` inside RequestSchema with IDENT-02 / D-04 / Plan 18-03 / RESEARCH citation in inline comment. `pnpm exec vitest run` on chat-session-id.test.ts + validation.test.ts shows ALL GREEN. `pnpm exec astro check` exits 0/0/0. Source does NOT contain `z.string().uuid()` or `z.uuid().optional()` (anti-patterns rejected per RESEARCH).</done>
</task>

<task type="auto">
  <name>Task 3: Plan-end gate — D-26 chat regression battery + astro check 0/0/0 + sse-snapshot</name>
  <files>(verification only — no files modified)</files>
  <read_first>
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md (critical constraint #3 — D-26 battery BLOCKING because Plan 18-03 touches validation.ts which is a chat-surface file)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-VALIDATION.md (Per-task verification map — IDENT-02 row)
  </read_first>
  <action>
Plan 18-03 touches a chat-surface file (`src/lib/validation.ts`), so the D-26 gate is BLOCKING per CONTEXT.md critical constraint #3.

Run THREE gate commands, in order:

1. `pnpm test` — full suite. Expected: 419 baseline + 16 (Plan 18-02 new) + 7 (Plan 18-03 new) = 442 PASS / 0 FAIL / 2 SKIP. Any new failure outside the 7 new IDENT-02 tests is a regression → STOP and root-cause.

2. `pnpm exec astro check` — 0/0/0 baseline carry-forward.

3. `pnpm exec vitest run tests/api/sse-snapshot.test.ts tests/api/anthropic-payload-shape.test.ts tests/api/cache-hit-logs.test.ts tests/api/validation.test.ts tests/client/listener-dedup.test.ts tests/client/chat-panel-display.test.ts tests/build/no-imperative-display-flip.test.ts tests/build/no-inline-display-on-chat-panel.test.ts` — chat-surface focused. Validation.ts is among these; sse-snapshot is the D-15 anchor; anthropic-payload-shape is the TEST-03 forward-defense.

The `validation.ts` source change is one line plus a comment block — there is no plausible regression vector for D-15 (SSE byte-identical, unchanged code path) or TEST-03 (Anthropic payload, unchanged code path). Plan 18-03 surfaces the FIELD on the validated request; reading it remains the caller's responsibility (Plan 18-05).

Record gate status in plan SUMMARY. If any chat-surface focused test fails (1-3 above), document the failure and DO NOT proceed to Plan 18-04 / 18-05 / 18-06 without fixing.
  </action>
  <verify>
    <automated>pnpm test 2>&1 | tail -3 && pnpm exec astro check 2>&1 | tail -3 && pnpm exec vitest run tests/api/sse-snapshot.test.ts tests/api/anthropic-payload-shape.test.ts tests/api/cache-hit-logs.test.ts tests/api/validation.test.ts tests/client/listener-dedup.test.ts tests/client/chat-panel-display.test.ts tests/build/no-imperative-display-flip.test.ts tests/build/no-inline-display-on-chat-panel.test.ts 2>&1 | tail -3</automated>
  </verify>
  <done>`pnpm test` ≥ 442 PASS / 0 FAIL / 2 SKIP. `pnpm exec astro check` 0/0/0. Chat-surface focused 8-file battery all GREEN — D-26 gate confirmed BLOCKING-clean for Plan 18-03's validation.ts edit. Plan SUMMARY records exact counts.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → /api/chat (HTTP request body) | Untrusted JSON input crosses into `validateRequest`. Plan 18-03 extends the trust contract with a new optional field; Zod parses-or-rejects ALL fields at this boundary. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-18-03-01 | Spoofing | Forged sessionId in request body | mitigate | sessionId is an opaque correlation ID, NOT a session-management or access-control token (per RESEARCH § Security Domain V3). Forging a sessionId only lets an attacker write into someone else's `live:{sid}` transcript IF they GUESS a valid UUIDv4 — 122 bits of v4 entropy makes brute-force infeasible. Plus, the only consequence is "their conversation gets recorded under your sid" — no privilege escalation. ACCEPT residual risk; KV-05 quota (Plan 18-02) caps abuse to 100 writes/hour even if a sid leaks. Per V3 partial. |
| T-18-03-02 | Tampering | Malformed sessionId triggering Zod-internal regex DoS | mitigate | `z.uuidv4()` uses Zod's compiled regex — bounded execution. No catastrophic-backtracking surface (UUIDv4 regex is anchored + literal-character-heavy). Per V5 + V13. |
| T-18-03-03 | Information Disclosure | Sensitive data smuggled into the sessionId field (e.g., PII concatenated into a fake UUIDv4 lookalike) | mitigate | UUIDv4 regex (`xxxxxxxx-xxxx-4xxx-[8-b]xxx-xxxxxxxxxxxx`) is too narrow to carry meaningful data. The 122 bits of randomness are exactly what `crypto.randomUUID()` produces; any string passing `z.uuidv4()` is structurally indistinguishable from a real UUID. Per V5. |
| T-18-03-04 | Repudiation | Absent sessionId triggers "missing-and-acceptable" branch | accept | Per D-04 explicit decision: chat surface ALWAYS wins (D-26). A visitor whose client cannot mint (private browsing, locked-down extension, etc.) still gets the chat reply; their conversation just doesn't end up in Jack's inbox. Documented as deliberate exception to the existing validation posture per CONTEXT.md "Specifics" + new IDENT-02 amendment text in REQUIREMENTS.md. Per V3 partial / V7. |

ASVS L1 mapping for this plan: V3 partial (sessionId is correlation only, not auth), V5 yes (Zod schema is the input validation surface), V13 yes (/api/chat is the API surface; new field validated at the boundary).
</threat_model>

<verification>
**Plan-end checks (all must pass):**

1. `pnpm exec vitest run tests/api/chat-session-id.test.ts` — 7/7 GREEN.
2. `pnpm exec vitest run tests/api/validation.test.ts` — existing tests GREEN (no regression).
3. `pnpm test` — full suite ≥ 442 PASS / 0 FAIL / 2 SKIP.
4. `pnpm exec astro check` — 0/0/0.
5. D-26 chat-surface focused 8-file battery (Task 3 command) — all GREEN.
6. Source diff confined to (a) one-line `sessionId: z.uuidv4().optional()` addition + inline comment block in `src/lib/validation.ts:31-33`, and (b) new file `tests/api/chat-session-id.test.ts`. `git diff --stat src/` should show ONLY `src/lib/validation.ts` modified.
</verification>

<success_criteria>
- `src/lib/validation.ts` contains `sessionId: z.uuidv4().optional()` inside RequestSchema (verbatim) with citation comment for IDENT-02 + D-04 + Plan 18-03 + RESEARCH version-specificity rationale.
- `tests/api/chat-session-id.test.ts` exists with ≥5 tests (target 7) GREEN — covers valid UUIDv4, absent sessionId (D-04), malformed string, UUIDv5 rejection (version-specific), empty string, non-string type, TS-narrowed type.
- `pnpm test` ≥ 442 PASS / 0 FAIL / 2 SKIP; `pnpm exec astro check` 0/0/0.
- D-26 chat-surface focused battery confirmed GREEN — the BLOCKING gate is clean for Plan 18-03's validation.ts edit.
- `git diff --exit-code src/scripts/chat.ts src/pages/api/chat.ts src/lib/chat-transcripts.ts wrangler.jsonc` exits 0 (Plan 18-03 does NOT touch any other source file).
</success_criteria>

<output>
After completion, create `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-03-SUMMARY.md` recording:
- Test count delta (Plan 18-02 close → Plan 18-03 close: ≥435 → ≥442 PASS)
- `astro check` status (0/0/0 preserved)
- D-26 chat-surface focused gate status (GREEN — BLOCKING gate clean)
- Anchor for Plan 18-05: `validateRequest(body).data.sessionId` is `string | undefined` at the call site in api/chat.ts (TypeScript-narrowed by `result.success` check)
- Anchor for Plan 18-06: client sends `{ sessionId: <uuidv4-or-omit>, messages: [...] }` body shape — server's optional field accepts the omit branch
</output>
