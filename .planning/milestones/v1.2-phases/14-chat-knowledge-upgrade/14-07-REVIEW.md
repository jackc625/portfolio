---
phase: 14-07-chat-knowledge-upgrade-gap-closure
reviewed: 2026-04-23T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/prompts/chat-request-shape.ts
  - src/pages/api/chat.ts
  - tests/api/chat.test.ts
findings:
  critical: 0
  warning: 0
  info: 1
  total: 1
status: clean
---

# Plan 14-07: Code Review Report

**Reviewed:** 2026-04-23
**Depth:** standard
**Files Reviewed:** 3
**Status:** clean (1 info item, no critical/warning findings)

## Summary

Retrospective review of the four 14-07 gap-closure commits (d315863, 7726fb2, 1f49fb8, b1a4a9c) against diff base `a7d1141`. The code change is a surgical, additive fix that closes the UAT-3 truncation gap from Phase 14 UAT:

1. `max_tokens` raised 768 → 1500 in the request-shape helper.
2. A new `else if (event.type === "message_delta")` branch is added to the SSE stream loop that sets a local `truncated` flag, calls `console.warn("chat.truncated", { stop_reason: "max_tokens" })`, and emits a `data: {"truncated":true}\n\n` frame immediately before `[DONE]`.
3. Two new tests lock down the positive and negative truncation-signal branches.

**Invariant preservation verified** (all byte-identical to diff base `a7d1141`):
- CORS exact-origin check via `isAllowedOrigin` (chat.ts:18)
- Body-size guard using `Number()` strict validation (chat.ts:32-45)
- Rate-limiter binding wiring (chat.ts:49-61)
- `sanitizeMessages` invocation (chat.ts:84)
- SSE response headers: `Content-Type: text/event-stream`, `Content-Encoding: none`, `Cache-Control: no-cache, no-transform` (chat.ts:153-160)
- `content_block_delta` / `text_delta` branch (chat.ts:106-114) — byte-identical, diff confirms
- `cache_control.ephemeral` and system-as-array shape (chat-request-shape.ts:34-40)
- `model: "claude-haiku-4-5"` and `stream: true` literals — unchanged
- Mid-stream catch block (chat.ts:137-149) — byte-identical, diff confirms

**Threat-model dispositions re-verified** (per plan T-14-07-01..05):
- `console.warn` payload carries ONLY `{ stop_reason: "max_tokens" }` — no user text, no IP, no timestamp. PII leakage risk correctly mitigated.
- `max_tokens: 1500` is 6.5x under Haiku 4.5's 8192 ceiling; cost impact negligible per T-14-07-03 acceptance.
- Negative source-text guards (`not.toContain("max_tokens: 768")` and `not.toContain("max_tokens: 512")`) correctly lock the literal against accidental regression.
- `event.delta.stop_reason === "max_tokens"` uses the SDK's native `StopReason | null` type — no unsafe casts, no `as unknown as`. Any future SDK reshape surfaces at `pnpm check`, not at runtime.

No bugs, no security concerns, no quality issues beyond the single informational observation below.

## Info

### IN-01: Test replica mirrors production branching without a structural guard pinning SSE frame order

**File:** `tests/api/chat.test.ts:294-468`
**Issue:** The two new `message_delta` tests hand-build a local `ReadableStream` that replicates the chat.ts loop's branch logic (content_block_delta enqueue -> message_delta flag -> post-loop `if (truncated)` enqueue -> `[DONE]`). This is the correct pattern per repo convention (Plan 14-01 D-20 / CONTEXT.md L6 no-vi.mock landmine), and it's explicitly called out in the new describe-block comment at line 293: "Mirror of chat.ts stream-loop branching; if this drifts from chat.ts, the Plan 14-03 source-text regex guard (line 265+) fires."

The existing source-text guards (lines 265-273, 276-278) correctly pin:
- `buildChatRequestArgs(portfolioContext, messages)` call site
- Absence of `max_tokens: 512` and `max_tokens: 768`
- Presence of `"Content-Encoding": "none"` header
- CORS / rate-limiter / sanitize call sites

There is NO source-text guard that pins the new invariants in chat.ts (the `message_delta` branch, the `truncated` flag, the `truncated` frame appearing before `[DONE]`). A future refactor that e.g. moves the `{truncated:true}` enqueue to AFTER `[DONE]`, or drops the `console.warn`, or renames the log key, would not cause the replica-based test to fail because the replica is free to independently carry the correct behavior.

**Fix:** Optional — consider adding three source-text regression guards to the existing `describe("SDK request shape (CHAT-05 / CHAT-07)")` block (or a sibling block) that read `chatSource` and assert:
```ts
expect(chatSource).toContain('event.type === "message_delta"');
expect(chatSource).toContain('"chat.truncated"');
// Order guard: truncated frame enqueue must appear BEFORE the [DONE] enqueue in source.
const truncIdx = chatSource.indexOf('JSON.stringify({ truncated: true })');
const doneIdx = chatSource.indexOf('data: [DONE]');
expect(truncIdx).toBeGreaterThan(-1);
expect(doneIdx).toBeGreaterThan(-1);
expect(truncIdx).toBeLessThan(doneIdx);
```
This is the same "source-text mirror guard" pattern already used at chat.test.ts:265-290 for the CHAT-05 / D-26 invariants. The plan's success criteria are met without this addition — flagging as Info rather than Warning because (a) the threat model does not require it, (b) the plan explicitly accepts the mirror pattern, and (c) the current tests do fully cover runtime behavior of the replica.

---

_Reviewed: 2026-04-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
