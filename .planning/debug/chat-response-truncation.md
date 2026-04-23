---
status: diagnosed
trigger: "Chat reply about SeatWatch is grounded and accurate but ends mid-section at the heading 'Why It Matters' with no body content; SSE stream simply terminates early."
created: 2026-04-23T00:00:00Z
updated: 2026-04-23T00:00:00Z
---

## Current Focus

hypothesis: Anthropic returned `stop_reason: "max_tokens"` mid-generation; chat.ts ignores `message_delta`/`message_stop` events so the truncation is silently dropped and the client renders the partial reply as if it were complete.
test: Read chat.ts stream consumer; confirm only `content_block_delta` is handled. Read chat-request-shape.ts; confirm `max_tokens: 768`. Estimate output tokens of the user-reported reply against that budget.
expecting: max_tokens=768 in shape file, only content_block_delta handled in stream loop, observed reply length consistent with hitting the cap right after emitting "Why It Matters".
next_action: Write findings to debug file and return ROOT CAUSE FOUND.

## Symptoms

expected: Chat reply about SeatWatch uses real MDX content AND completes coherently end-to-end (no mid-section truncation). UAT 14-UAT.md test 3.
actual: Reply is project-grounded and accurate (correct stack, dual-strategy architecture, distributed locking, fingerprinting details from seatwatch.mdx) but ends with the literal heading "Why It Matters" and no body — last lines: "...handled approximately fifty parallel user sessions with zero observed double-books and no race condition double-charges.\n\nWhy It Matters". No period, no closing, model hit a ceiling mid-generation.
errors: None in console. SSE stream terminates cleanly (client receives `data: [DONE]\n\n` from the catch-not-triggered happy path).
reproduction: Open chat widget on local dev, send "Tell me about SeatWatch.", observe response truncates at the "Why It Matters" heading.
started: Discovered during Phase 14 UAT, 2026-04-23. Phase 14 raised max_tokens from 512 (Phase 7) to 768 (Plan 14-03).

## Eliminated

- hypothesis: Client-side AbortController firing at 30s
  evidence: src/scripts/chat.ts:147 sets a 30s controller; if it fired, the catch block would dispatch an error event and the UI would surface an error state. User explicitly reported no console errors and no error UI — the stream ended cleanly with `[DONE]`. The catch in chat.ts:119-131 also enqueues `{error: true}`; client never received it.
  timestamp: 2026-04-23

- hypothesis: SSE proxy/edge buffer dropped final frames
  evidence: chat.ts:140 sets `Content-Encoding: none` and `Cache-Control: no-cache, no-transform` (per Phase 7 D-26 invariant in 14-VERIFICATION.md). Cloudflare would not buffer or rewrite. Also, a buffer drop would cut off mid-token, not land cleanly on a heading boundary that happens to be exactly where the budget ran out.
  timestamp: 2026-04-23

- hypothesis: DOMPurify sanitization stripped the trailing content
  evidence: Sanitization runs on already-rendered output; it would strip tags, not stop content mid-stream. Stripping would also leave the closing paragraph text visible (just without tags). User received raw text ending at "Why It Matters" — the model never emitted more tokens.
  timestamp: 2026-04-23

- hypothesis: System prompt instructs the model to truncate ("be brief", char limit)
  evidence: Read src/prompts/system-prompt.ts lines 21-26. <constraints> block specifies "1–3 short paragraphs for biographical or career questions" and "2–4 paragraphs for detailed technical questions" but gives no character/token cap and explicitly says "Only the depth needed. Never padding. Stop when the question is answered." The model was clearly mid-detailed-answer (had emitted ~6 paragraphs and started a new section header) — this is hitting an external budget, not voluntarily stopping.
  Bonus finding: line 25 forbids headings ("NEVER headings (# or ##)") but the model emitted "Why It Matters" as a heading anyway. That's a separate prompt-adherence issue, NOT the truncation cause.
  timestamp: 2026-04-23

## Evidence

- timestamp: 2026-04-23
  checked: src/prompts/chat-request-shape.ts
  found: Line 33 sets `max_tokens: 768` (CHAT-07). This is the literal output-token ceiling the Anthropic Messages API enforces — when the model has emitted 768 output tokens, generation stops with `stop_reason: "max_tokens"`.
  implication: The cap is real and is hit by verbose project answers.

- timestamp: 2026-04-23
  checked: src/pages/api/chat.ts lines 97-118 (stream consumer)
  found: The for-await loop only handles `event.type === "content_block_delta" && event.delta.type === "text_delta"`. It does NOT inspect `message_delta` (which carries `delta.stop_reason`) or `message_stop` events. All non-content events are silently discarded. After the loop drains, the server emits `data: [DONE]\n\n` regardless of why the stream ended.
  implication: Truncation due to max_tokens is invisible to both the server and the client. The user gets a partial response framed as a successful completion. Root cause: missing observability + insufficient budget.

- timestamp: 2026-04-23
  checked: node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts
  found: `RawMessageDeltaEvent` (type 'message_delta', line 744) carries `usage` and `delta` containing `stop_reason: StopReason | null` (line 775). `RawMessageStopEvent` (line 783) closes the stream. `StopReason` includes "max_tokens" as a discriminator value. Stream emits in order: `message_start`, `content_block_start`, `content_block_delta`*, `content_block_stop`, `message_delta`, `message_stop`.
  implication: The information needed to detect truncation is being sent by the SDK. The server is choosing to ignore it.

- timestamp: 2026-04-23
  checked: src/data/portfolio-context.json (SeatWatch entry, lines 138-158)
  found: SeatWatch caseStudy field is the full mdx body content (~3,629 words extracted, per 14-02-SUMMARY.md). Plus extendedReference.content with ~24KB of additional architecture/feature inventory/data model material. Total per-project token footprint for SeatWatch: 8,516 tokens (per 14-02-SUMMARY.md line 114).
  implication: The model is being asked to summarize an extremely rich source. A "Tell me about SeatWatch" prompt naturally produces a long answer because there is a lot of grounded material to draw on. 768 output tokens corresponds to roughly 575 English words (rule-of-thumb 0.75 words/token). The user-reported reply is approximately 600+ words of dense prose ending at a section header — consistent with hitting the cap right as the model began the next section.

- timestamp: 2026-04-23
  checked: src/scripts/chat.ts AbortController behavior (lines 135-155)
  found: 30-second AbortController is set up but did not fire in this case (no error event reached client). The Anthropic stream returned cleanly within 30s; the [DONE] marker was emitted by the server.
  implication: Confirms the truncation was server-side budget exhaustion, not client-side timeout.

- timestamp: 2026-04-23
  checked: .planning/phases/14-chat-knowledge-upgrade/14-UAT.md lines 49-51, 131-133
  found: UAT itself anticipated this exact failure mode. Quote from gap definition: "Likely the max_tokens: 768 ceiling raised in Plan 14-03 is clipping verbose project answers (SeatWatch MDX is one of the longer entries)."
  implication: Independent confirmation of the hypothesis from the UAT author.

## Resolution

root_cause: |
  Two compounding defects:
  (1) `max_tokens: 768` in src/prompts/chat-request-shape.ts:33 is too low for verbose project answers grounded in the rich MDX + extendedReference context. SeatWatch alone is 8,516 input tokens of source material; producing a multi-paragraph technical answer reliably exceeds 768 output tokens.
  (2) src/pages/api/chat.ts:104-118 only handles `content_block_delta` events from the Anthropic stream and ignores `message_delta` events (which carry `stop_reason`). When generation hits `max_tokens`, the server has no visibility into the truncation and emits `[DONE]` as if the response completed normally — so the UI shows a partial reply with no indication anything went wrong.

  Defect (1) is the proximate cause of this specific symptom; defect (2) is why it is silent and was not caught earlier.

fix: |
  Direction (not implementing per goal=find_root_cause_only):
  1. Raise `max_tokens` in src/prompts/chat-request-shape.ts:33 to ~1500 (Haiku 4.5 supports up to 8192). 1500 ≈ 1100 English words — comfortably covers a 4-paragraph deep-dive without padding the response. Update the corresponding shape-invariant test in tests/api/chat.test.ts (which currently asserts `max_tokens === 768`).
  2. In src/pages/api/chat.ts, add a `message_delta` handler that captures `event.delta.stop_reason`. If the final stop_reason is "max_tokens", either:
     (a) emit an SSE diagnostic event so the client can append a "[response was truncated — ask a follow-up for the rest]" note, OR
     (b) at minimum log it server-side for observability and surface it via Sentry once wired.
  3. Optional: tighten the system prompt's response-length guidance — current "2–4 paragraphs for detailed technical questions" can balloon. Consider "≤ 4 paragraphs and ≤ 1000 words; if the answer requires more, point to the project page."
  4. Separately (not the truncation bug, but adjacent): the model emitted a markdown heading ("Why It Matters") in violation of the explicit constraint at system-prompt.ts:25 ("NEVER headings"). Worth a Plan 15 follow-up to re-prompt or add a post-process strip.

verification: |
  After fix, re-run the UAT 14 test 3 reproduction: send "Tell me about SeatWatch." Reply must (a) be grounded in seatwatch.mdx, (b) end in a complete sentence with terminal punctuation, (c) not contain markdown headings. Server logs should show `stop_reason: "end_turn"` (not "max_tokens"). Repeat with the other long projects (daytrade, nfl-predict) to confirm the new budget covers them too.

files_changed: []
