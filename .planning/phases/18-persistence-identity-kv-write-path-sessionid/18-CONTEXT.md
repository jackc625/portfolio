# Phase 18: Persistence + Identity — KV Write Path + sessionId - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 18 delivers the chat persistence and identity layer that Phase 19 (cron sweep) and Phase 20 (email render) read from:

1. **KV write path** — `src/lib/chat-transcripts.ts` exposes a pure `appendTurn(kv, sessionId, role, content, meta)` API that read-modify-writes `live:{sessionId}` keys in `CHAT_KV` (already bound in `wrangler.jsonc` with prod ID `eaa30fef259e4a6b9505b41bbf3f8f01` + preview ID `115f3c1b0f8a4a1da9fee78c48dcb749`). Schema `v: 1`. `expirationTtl: 30 * 24 * 3600` on every `put()`. KV `metadata` field carries `{ last_activity_at, msg_count }` so Phase 19 cron path can `list({prefix:'live:'})` without per-key `get()` round-trips. Transcripts bounded: 30-message cap with drop-oldest sliding window, `referrer`/`user_agent` truncated to 512 chars.

2. **sessionId identity** — Client mints UUIDv4 via `crypto.randomUUID()` on bubble click and persists in the existing `chat-history` localStorage blob with `STORAGE_VERSION` bumped 1→2 (atomic wipe). Sent in `/api/chat` request body (validation.ts `RequestSchema` extended with `sessionId: z.string().uuid()`). Server validates as UUIDv4 regex. **sessionId NEVER threaded into the Anthropic message payload** — lives on HTTP envelope only — preserves prompt cache hit rate locked by TEST-03 (Plan 17-05 forward-defense `tests/api/anthropic-payload-shape.test.ts`).

3. **Metadata capture per turn** — Each transcript records `started_at`, `last_activity_at`, `referrer`, `user_agent`, `country` (`request.cf.country`), `region` (`request.cf.region`), `colo` (`request.cf.colo`), `message_count`, `truncated`. Per assistant turn: `cache_read_input_tokens` / `cache_creation_input_tokens` recorded in transcript metadata — surfaces what the DEBT-02 Workers Log seam (Plan 17-05 commit `7c3827e` in `src/pages/api/chat.ts` at the `message_delta` branch) already exposes operationally.

4. **NEW per-sessionId write quota (KV-05)** — Plan-phase adds a new requirement to REQUIREMENTS.md for v1.3: per-sessionId `appendTurn` call count tracked in KV metadata (or sibling counter key), hard cap per hour, server rejects writes beyond cap with structured `console.error("chat.transcript.quota_exceeded", {...})` log. Distinct from the locked-deferred per-IP rate limit (STATE.md → v1.4+). Planner picks specific cap value from research.

**Phase exit gates (non-negotiable):**
- D-26 chat regression battery 117/117 GREEN at every chat-surface commit + phase-end (TEST-01 — cross-phase gate carried from Phase 17 with baseline 419 PASS / 0 FAIL / 2 SKIP). Phase 18 touches `chat.ts` / `api/chat.ts` / `validation.ts` so the gate is **blocking**.
- D-15 server byte-identical at `/api/chat` SSE — plan-time-authored amendment per REQUIREMENTS.md TEST-02 commentary: `ctx.waitUntil(appendTurn(...))` calls in `api/chat.ts` ARE the explicit, plan-time-authored D-15 amendment (NOT a silent regression). The sse-snapshot test (`tests/api/sse-snapshot.test.ts`) MUST continue to pass on the SSE bytes themselves; the `ctx.waitUntil` calls land off the controller-enqueue path.
- TEST-03 (Anthropic prompt cache integrity): existing forward-defense test extended with new assertions (sessionId IS on request body but NOT in `args.system` / `args.messages[0]`; system block byte-equal across sessionId-bearing vs no-sessionId calls). PLUS one-time manual UAT at phase close: 3× identical `/api/chat` POSTs within 5min against `*.workers.dev` preview (Workers Builds spins one per push), verify `chat.cache_metrics` log shows `cache_read_input_tokens > 0` on responses 2 and 3 via `wrangler tail`. Re-run against production after deploy. Cache miss = blocks phase close until root-caused.

**Out of scope for Phase 18 (handled by other phases or v1.4+):**
- Cron sweep `deliverDue` logic (Phase 19 — `scheduled()` stub still no-op in Phase 18)
- Two-keyspace partition `live:{sid}` → `delivered:{sid}` (Phase 19)
- Resend POST integration + email body rendering (Phase 20)
- Per-IP rate limiting (deferred to v1.4+ per STATE.md `/gsd-roadmap-phase` lock 2026-05-09)
- `/api/resend-webhook` with Svix HMAC (v1.4+)
- HTML email body (v1.4+, plaintext-only is the v1.3 contract)
- Workers Paid plan upgrade to bind `CHAT_RATE_LIMITER` (v1.4+, Free-tier acceptable per Plan 17-04 DEBT-01 closure)

</domain>

<decisions>
## Implementation Decisions

### A. sessionId lifecycle

- **D-01:** **Mint on bubble click.** Locks the literal IDENT-01 phrasing "on first chat open" to mean panel-bubble-click. On click, if no sessionId in localStorage chat-history blob, generate `crypto.randomUUID()` and persist BEFORE the panel becomes visible. Window-shoppers get a UUID materialized but no KV write fires (appendTurn only runs on real messages). Visitors returning within 24h get the same sessionId — their conversation continues against the same `live:{sid}` transcript. Rejected: mint-on-first-send (loses cross-visit continuity within 24h), mint-on-script-init (materializes UUIDs for every page-load including users who never look at the chat bubble).
- **D-02:** **sessionId lives in the existing chat-history localStorage blob.** Shape extends from `ChatStorage { version: 1, messages, lastActive }` to `ChatStorage { version: 2, sessionId, messages, lastActive }`. `STORAGE_VERSION` bumped 1→2 — the existing auto-clear path (chat.ts:104–106) wipes the old shape on next load per IDENT-01. One TTL clock (24h on `lastActive`), one version gate, atomic state. Rejected: separate `chat-session-id` localStorage key (sessionId outliving 24h chat-history TTL = confusing "transcript keeps accumulating but history wiped" UX); sessionStorage (per-tab fragmentation).
- **D-03:** **No special treatment for sessions whose client-side blob expired.** When same-blob 24h TTL fires and a fresh sessionId is minted, the previous `live:{old-sid}` sits in KV until either (a) Phase 19 cron sweep promotes it to `delivered:{sid}` after 2h inactivity (the canonical path), or (b) the 30d `expirationTtl` fires. Client has no knowledge of the old sid. Rejected: client-side `session-ended` signal (new endpoint surface for no operator value), cross-session merge (contradicts "each transcript is one logical conversation").
- **D-04:** **IDENT-02 amended — server tolerates missing sessionId.** If client cannot mint or persist (crypto.randomUUID absent / localStorage disabled / private browsing / quota exceeded), client omits the `sessionId` field from the `/api/chat` request body. Server-side branch in api/chat.ts: missing sessionId → SKIP `ctx.waitUntil(appendTurn(...))` calls entirely, still serve the Anthropic SSE stream (chat UX preserved — D-26 anti-regression invariant). Malformed sessionId (present but not UUIDv4) → 400 invalid_request (the original IDENT-02 contract holds for that branch). This is a SPEC AMENDMENT to IDENT-02 — planner adds to the requirement text. Rationale: chat surface ALWAYS wins per the milestone-level D-26 gate.

### B. 30-turn cap trim policy (KV-04 elaboration)

- **D-05:** **Drop-oldest sliding window at cap.** When `messages.length === 30` and a new turn arrives: `messages = [...messages.slice(-29), newTurn]`. Most-recent 30 always preserved. Recent context wins (typically more actionable for "what did they decide to ask in the end" — Jack reads every transcript). Opener gets lost only in genuinely-long conversations. Rejected: freeze-at-30 (loses recent context), hybrid preserve-first-5 (two trim modes to test, over-engineered for chat scale).
- **D-06:** **truncated=true is one-way.** Set the first time a drop happens during a session; never unset. Surfaces "this conversation went past the cap" durably even if final messages.length === 30.
- **D-07:** **30 = individual messages, not pairs.** `messages.length ≤ 30` where each entry is one role's content. Matches the existing `validation.ts` `RequestSchema` (`z.array(MessageSchema).min(1).max(30)`) and Anthropic's messages convention. 30 messages = ~15 exchanges. Rejected: 30 exchange-pairs (requires pair-aggregator invention, mismatches IDENT-01 phrasing), 30 visitor-messages-only (lopsided shape, cap loses protective intent).
- **D-08:** **truncated=true surfaces in Phase 20 email subject prefix.** Phase 20 subject becomes `[Portfolio chat] N turns from <country> via <referrer-host> (truncated)` when truncated=true; otherwise no parenthetical. Locks Phase 20's subject contract here so the planner of Phase 20 doesn't re-decide. Rejected: body-header-only (less visible in Gmail list view), server-only (loses the at-a-glance signal Jack wants).

### C. KV write failure handling

- **D-09:** **Silent + structured error log.** Wrap appendTurn body in try/catch. On failure: `console.error("chat.transcript.write_failed", { sessionId, role, error_class })` (flat-primitive fields, JSON-parseable by Workers Logs / `wrangler tail`). Chat surface byte-identical to current behavior — D-26 preserved. Phase 19 cron sweep finds nothing under `live:{sid}` for that failed turn → the visitor's conversation simply doesn't email. Acceptable: chat UX always wins. Rejected: SSE diagnostic frame (D-15 anchor forbids new SSE frame types without a plan-time TEST-02 amendment, and we have one already authored for the `ctx.waitUntil` wiring — but adding a transcript_warning frame would be a SECOND amendment with weaker justification), retry inside waitUntil (KV failures persisting past 200ms are typically systemic; single retry rarely flips them).
- **D-10:** **User turn fires `ctx.waitUntil(appendTurn(user, ...))` AFTER validation, BEFORE stream open (the durability anchor) — but does NOT block the stream.** Anthropic SSE proceeds in parallel; visitor sees their reply regardless of user-turn write success. If user-turn write fails AND assistant-turn write succeeds, KV transcript looks awkward (`messages[0].role === "assistant"`) but is recoverable in Phase 20 render. Rejected: blocking await on user-turn write (adds 5–50ms KV latency to TTFB on every turn; brief KV outage = visitor sees 500 instead of reply = D-26 regression), post-stream accumulator pattern (loses the durability anchor — stream crash mid-flight = losing both sides).
- **D-11:** **Assistant turn fires `ctx.waitUntil(appendTurn(assistant, ...))` AFTER `controller.close()` — accumulator strategy.** Token deltas accumulate in a local string during the for-await loop; the final concatenation is appended once. Per research SUMMARY (NEVER per-token — KV's 1-write/sec/key cap would 429 the transcript). On failure: same `chat.transcript.write_failed` shape but with extra `content_length` field for Workers Logs query power (helps spot whether failures cluster on long replies — informs whether to wire a value-size pre-check). No retry. Rejected: 1s retry inside waitUntil (transient-5xx-in-<1s is rare), in-memory dead-letter map (Worker invocations are short-lived; no persistent state between calls).
- **D-12:** **NEW REQUIREMENT KV-05 — per-sessionId write quota.** Planner adds an entry to REQUIREMENTS.md: per-sessionId `appendTurn` call count tracked in KV `metadata` (or sibling counter key — planner's call); hard cap per hour (planner picks specific value from research, likely 50–200/hour); server rejects writes beyond cap with `console.warn("chat.transcript.quota_exceeded", { sessionId, count_in_window })` and continues serving the stream silently (same UX posture as D-09). Distinct from the locked-deferred per-IP rate limit (per-sid forges a different defense surface — protects against scripted resubmits within an authenticated session, not anonymous flood). Plan-phase decides cap value + storage shape; this CONTEXT decision locks WHETHER the guard exists, not its parameters.
- **D-13:** **Concurrent-write race policy: last-writer-wins for v1.3.** KV is eventually consistent; within one Worker invocation the read-modify-write is sequential and safe. Cross-invocation races only happen if the visitor double-submits faster than Anthropic's stream completes (rare — one ongoing stream blocks the bubble). Mitigation: log `console.warn("chat.transcript.race_suspected", { sessionId, in_memory_tail_len, kv_read_len })` if the just-read `messages.length` is smaller than what the accumulator's previous-tail captured. Don't fight KV's consistency model at portfolio scale. Rejected: per-session in-memory mutex (only helps same-Worker race), optimistic-lock retry loop (doubles reads; meaningful only if races observed in practice — they won't be at v1.3 scale).

### D. TEST-03 cross-phase gate hardening

- **D-14:** **Manual UAT at phase close: 3× identical `/api/chat` POSTs within 5min, verify `chat.cache_metrics` log shows `cache_read_input_tokens > 0` on responses 2 and 3.** Performed against `*.workers.dev` preview FIRST (Workers Builds spins one per main-push), then re-run against production AFTER deploy. Mirrors Plan 17-02 "verify preview, then flip domain" two-touch pattern. Captured in `18-UAT.md` as a numbered manual step with `wrangler tail` command + expected log shape. Zero ongoing CI cost; relies on the DEBT-02 server-side log seam shipped in Plan 17-05 commit `7c3827e`. Rejected: automated vitest live test (every CI run pays Anthropic tokens; flaky on regional Anthropic cache misses; couples CI green to a third party's cache state), skip-and-trust-the-log (verification shifts to operational vigilance; a launch-time break wouldn't be caught at phase gate).
- **D-15:** **Cache miss = blocks phase close.** TEST-03 is a milestone-level cross-phase gate. If the 3× UAT shows `cache_read_input_tokens === 0` on responses 2 or 3, sessionId is leaking into the cached surface somewhere. Root-cause via `wrangler tail` byte-diff of the Anthropic system block between calls 1 and 2 BEFORE any other Phase 18 work merges to main. Forward-defense source-text test stays GREEN throughout — but a passing forward-defense test combined with a failing live test means the forward-defense test has a blind spot, and **closing that blind spot becomes a sub-task of the same plan**. Rejected: warn-and-continue (deferred-fix path tends to defer indefinitely; per-call cost increase is real even if small), client-banner surfacing (cosmetic, doesn't fix anything).
- **D-16:** **Extend `tests/api/anthropic-payload-shape.test.ts` with NEW assertions for the sessionId-on-envelope path.** Today the test asserts ABSENCE (no `sessionId` literal, no UUIDv4 pattern in system / messages[0], system byte-equal across calls with different messages). Phase 18 ADDS: (a) calling `buildChatRequestArgs(portfolioContext, messages)` where the request body that produced `messages` carried a sessionId returns args whose system block + messages[0] are byte-identical to a "no-sessionId" call; (b) the HTTP envelope (request body shape) DOES carry sessionId and `validateRequest` accepts it. Catches a future regression where someone accidentally threads sessionId into a system-block template string (which the pattern-grep would miss). Rejected: trust forward-defense alone + live UAT (template-string leak slips past pattern-grep), replace with runtime-mocked Anthropic SDK test (loses byte-equality-of-system-across-calls property per STATE.md line 127 retrospective pattern — "when defending a contract that downstream evaluates as byte-equality, the test must also evaluate byte-equality").

### Claude's Discretion

- Exact `src/lib/chat-transcripts.ts` shape (function signature `appendTurn(kv, sessionId, role, content, meta)` is locked; internal helper structure, named exports vs default export, JSDoc style — planner picks).
- Whether the per-sessionId quota (KV-05) lives in `live:{sid}` metadata (most cohesive) or a sibling `quota:{sid}` key (cleaner separation, costs one extra `put()` per turn) — planner researches and picks. CONTEXT locks that the guard exists, not its storage shape.
- KV-05 specific cap value + time window. Planner picks from research (suggestions in discussion: 50–200 appendTurn writes per sessionId per rolling 1-hour window). A round value (e.g., 100/hour) is fine; this is a guard, not a precise threshold.
- Where the per-turn token accumulator string lives inside the SSE `start(controller)` closure — concrete shape is planner's call as long as it doesn't introduce SSE-byte changes (D-15 anchor).
- Order of fields in the `chat.transcript.write_failed` / `chat.transcript.quota_exceeded` / `chat.transcript.race_suspected` log lines (flat primitives only per Plan 17-05 DEBT-02 pattern; field NAMES are locked above, ordering is presentational).
- Whether the metadata `referrer` is sourced from `request.headers.get("Referer")` (server, first-turn-only-then-pin) or client-side `document.referrer` passed in the request body (captures original external entry across subsequent internal-Referer turns). Both have trade-offs; planner picks based on what shows up cleanest in the eventual Phase 20 Gmail. If unclear, default to server-side first-turn-only-pin (no body shape change needed; simpler).
- Whether the metadata `user_agent` is captured at every turn or pinned on the first turn only (the latter is cleaner since UA shouldn't change mid-session; the former is trivially simple). Planner picks.
- Whether `8b0f7f1c-1234-...` style fixture sessionIds in tests are randomized per-test or hard-coded as constants. Hard-coded is fine — sessionIds carry no information, just need to be UUIDv4-shaped.
- D-26 chat regression battery EXPANSION targets — new tests Phase 18 ships in addition to existing 30+ chat-surface tests carried from Phase 17. Suggestions surfaced in discussion (planner picks final set):
  - sessionId UUIDv4 validation in validation.ts (positive + negative cases)
  - Missing sessionId tolerance branch in api/chat.ts (D-04)
  - chat-transcripts.ts unit tests (appendTurn with mock KV: schema versioning, expirationTtl, metadata field shape, 30-turn cap drop-oldest, truncated flag one-way, KV-05 quota reject)
  - Source-text test asserting `appendTurn` is called via `ctx.waitUntil` in api/chat.ts (forward-defense for D-10/D-11)
  - Test for STORAGE_VERSION 1→2 auto-clear path in chat.ts
  - sse-snapshot.test.ts re-verified GREEN (planner authors the explicit re-baseline if needed, per the plan-time-authored D-15 amendment commentary in REQUIREMENTS.md TEST-02 line)

### Folded Todos

None — no pending todos matched Phase 18 scope at discussion time. (Phase 17 already folded the cache-hit observability todo and the rate-limiter documentation todo per CONTEXT.md 17-CONTEXT.md "Folded Todos" section.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Requirements & roadmap

- `.planning/ROADMAP.md` — Phase 18 entry: goal statement, requirements list (KV-01..04, IDENT-01..02, META-01..02, TEST-01, TEST-03), 5 success criteria, depends-on Phase 17
- `.planning/REQUIREMENTS.md` — KV-01..04 (lines 25-28), IDENT-01..02 (lines 32-33), META-01..02 (lines 37-38), TEST-01 (line 74), TEST-03 (line 76); requirement traceability table lines 137-156. **Planner adds new requirement KV-05 (per-sessionId write quota) per D-12.**
- `.planning/STATE.md` — v1.3 architectural decisions lines 73-77 (Storage=KV, Resend, hourly cron + 2h, silent posture); v1.3 phase-shape decisions lines 81-85 (Phase 18 = Persistence + Identity); locked-deferred per-IP rate limit + Workers Paid + webhook (lines 207-212 — Phase 18 KV-05 is per-sid, NOT per-IP)
- `.planning/PROJECT.md` — v1.3 milestone summary, target features list, "Known issues / tech debt" section (CHAT_RATE_LIMITER documented + Free-tier acceptable)

### Prior phase context

- `.planning/phases/17-foundations-migration-dns-debt-sweep/17-CONTEXT.md` — Phase 17 foundation that Phase 18 builds on: D-13 two-mode dev story (`pnpm dev` + `pnpm dev:worker`), D-14 `WORKERS_PREVIEW_SUFFIX = ".jackcutrara.workers.dev"`, D-15 pages-compat retirement, exit gates locked at D-26 + D-15 + TEST-03 forward-defense
- `.planning/phases/17-foundations-migration-dns-debt-sweep/17-RETROSPECTIVE.md` — Phase 17 patterns Phase 18 should honor: explicit `pnpm exec astro check` gate at phase close (line 129 STATE.md retro), build-time source-text tests for canonical decisions (line 116), Rule 1 cap-bumping pattern when adding counted constructs (line 157), B6 sub-version changelog convention for amendments
- `.planning/phases/17-foundations-migration-dns-debt-sweep/17-PATTERNS.md` (if exists) — patterns mapping for Phase 17 reusable assets

### Research (v1.3-wide, authored at milestone gate)

- `.planning/research/SUMMARY.md` — "Phase 18 — Persistence + Identity" rationale (lines 155-165); KV data shape; ctx.waitUntil semantics; user-turn-before-stream-open / assistant-turn-after-controller-close pattern; "Never per-token" KV write rule
- `.planning/research/STACK.md` — Cloudflare KV table-stakes / differentiators (lines 38-40); `kv_namespaces` declaration shape
- `.planning/research/ARCHITECTURE.md` — `src/worker.ts` entrypoint shape; fetch + scheduled wiring; ctx.waitUntil semantics; KV append flow diagram
- `.planning/research/PITFALLS.md` — #2 KV eventual consistency (lines reflecting last-writer-wins acceptance); #5 D-26 must hold; #6 Anthropic prompt cache integrity (sessionId never in cached surface)

### Existing code surface (post-Phase-17 baseline)

- `wrangler.jsonc` — Phase 17 already binds CHAT_KV (prod ID `eaa30fef259e4a6b9505b41bbf3f8f01`, preview ID `115f3c1b0f8a4a1da9fee78c48dcb749`), declares `triggers.crons: []` (Phase 19 wires)
- `src/worker.ts` — `Env` interface already declares `CHAT_KV: KVNamespace`; `scheduled()` stub still no-op in Phase 18
- `src/pages/api/chat.ts` (200 LOC) — SSE streaming endpoint; D-15 byte-identical anchor; `message_delta` branch emits `chat.cache_metrics` log (DEBT-02, Plan 17-05 commit `7c3827e`); Phase 18 wires `ctx.waitUntil(appendTurn(user, ...))` after `validateRequest` (line ~84), `ctx.waitUntil(appendTurn(assistant, accumulator))` after `controller.close()` (line ~170)
- `src/scripts/chat.ts` (~1000 LOC) — `STORAGE_VERSION = 1` at line 81 (bumps to 2); `ChatStorage` interface at line 75 (extends with sessionId); `saveChatHistory` at line 85 (now writes sessionId); `loadChatHistory` at line 98 (now returns sessionId); chat-bubble click handler in `initChat` (line 572) — sessionId mint site per D-01
- `src/lib/validation.ts` — `RequestSchema` at line 31-33 (extends with `sessionId: z.string().uuid().optional()` per D-04); `validateRequest` exposes ValidatedRequest with sessionId
- `src/data/portfolio-context.json` — knowledge surface UNCHANGED by Phase 18 (TEST-03 byte-equality of system block requires it)
- `tests/api/anthropic-payload-shape.test.ts` — extended per D-16 (existing 5 forward-defense tests + new sessionId-on-envelope assertions)
- `tests/api/sse-snapshot.test.ts` — D-15 byte-identical anchor; re-verify GREEN post-Phase-18 (the `ctx.waitUntil` calls land off the controller-enqueue path, so the SSE bytes are unchanged — but planner authors an explicit re-baseline check if needed per TEST-02 plan-time-amendment language)
- `tests/api/cache-hit-logs.test.ts` — Plan 17-05 DEBT-02 log shape; Phase 18 EXTENDS to include the per-assistant-turn transcript metadata write path (META-02 closure)
- `tests/client/listener-dedup.test.ts` — Plan 17-08 Rule 3 typecheck-fix baseline; Phase 18 must keep `pnpm exec astro check` at 0/0/0 (Plan 17-08 hit zero for the first time since Plan 17-03 commit `0ad77b3`; do not regress)
- `package.json` `build` script — `pnpm build:chat-context && wrangler types && astro check && astro build` (pages-compat.mjs already retired in Phase 17); Phase 18 doesn't touch this chain

### Cloudflare-platform docs (external — researcher should fetch via Context7 / WebFetch as needed)

- Cloudflare Workers KV — `put()` with `expirationTtl` + `metadata`; `list({prefix})` returning `keys[]` with inline `metadata`; eventual consistency model; 25 MiB value cap; 1 write/sec/key cap
- Cloudflare Workers `ctx.waitUntil` — promise lifecycle; rejection handling (swallowed without explicit `.catch`); Worker invocation lifetime
- Cloudflare `request.cf` — country, region, colo fields; availability in local `wrangler dev` (mocked) vs production
- Anthropic prompt caching — `cache_control: ephemeral` TTL (~5min documented); `cache_read_input_tokens` / `cache_creation_input_tokens` fields in `message_start` / `message_delta` usage block

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **CHAT_KV binding already declared + ID-bound** in `wrangler.jsonc` (Phase 17 KV-01 closure). Both prod and preview IDs are live. Phase 18 reads `env.CHAT_KV` directly inside `api/chat.ts` — no wrangler config edits needed.
- **`Env` interface in `src/worker.ts`** already lists `CHAT_KV: KVNamespace` (line 14). Phase 18 just consumes it.
- **DEBT-02 cache_metrics log seam** in `api/chat.ts` `message_delta` branch (Plan 17-05 commit `7c3827e`) — Phase 18 META-02 surfaces these SAME cache token counts into the per-assistant-turn transcript metadata block. Source-of-truth-once: capture from the closure-scoped `cacheUsage` object that already exists for the log emission; pass into `appendTurn(assistant, ..., meta)`.
- **`crypto.randomUUID()`** is globally available in Workers runtime + modern browsers; the validation.ts UUIDv4 regex in Zod `z.string().uuid()` covers server-side. No polyfill needed (target is recent browsers per Astro 6 defaults; sessionId-less fallback covers the edge per D-04).
- **`ChatStorage` interface + `saveChatHistory` / `loadChatHistory` pair** in `chat.ts` (lines 75-120) — exact shape Phase 18 extends with sessionId. The auto-clear-on-version-mismatch path at line 104-106 IS the IDENT-01 wipe mechanism — no new code path.
- **`tests/api/anthropic-payload-shape.test.ts` (Plan 17-05 commit `19471fe`)** — exact pattern Phase 18 extends per D-16. The "system block byte-equal across calls with different messages" assertion (the cache-hit predicate) is already the canonical defense; Phase 18 adds the sessionId-on-envelope variant.
- **D-26 chat regression battery baseline carried from Phase 17** — 419 PASS / 0 FAIL / 2 SKIP (Plan 17-08 close); `pnpm exec astro check` at 0/0/0 (first clean since Plan 17-03). Phase 18 must hold both.

### Established Patterns

- **`ctx.waitUntil` for fire-and-forget side effects** in Workers — the canonical pattern for KV writes that shouldn't block the response stream. Phase 18 is the project's first use; planner should call out the rejection-handling rule (`.catch` inside the promise; outer `ctx.waitUntil` swallows otherwise) so D-09 silent-fail is enforced at the code level not just the convention level.
- **Structured `console.{log,warn,error}("event.name", { fields })` for Workers Logs** per Plan 17-05 DEBT-02 — flat-primitive fields only; second arg parsed as JSON by `wrangler tail` for query/filter. Phase 18 follows for `chat.transcript.write_failed` / `chat.transcript.quota_exceeded` / `chat.transcript.race_suspected`.
- **TDD pattern carried from Phase 17**: `tests/build/*` for source-text source-of-truth invariants (e.g., Plan 17-04 PROJECT.md DEBT-01 lock; Plan 17-08 no-inline-display-on-chat-panel); `tests/api/*` for SSR/SSE behavior; `tests/client/*` for DOM-mock assertions. Phase 18 adds: `tests/api/chat-transcripts.test.ts` (chat-transcripts.ts module behavior with mock KV), `tests/api/chat-session-id.test.ts` (validation.ts UUIDv4 + missing-sid tolerance), `tests/build/append-turn-call-site.test.ts` (source-text forward-defense that `ctx.waitUntil(appendTurn` appears at the right anchors in api/chat.ts).
- **Two-touch verification (preview → production)** per Plan 17-02 D-03 — Workers Builds spins a preview per main-push. Phase 18 D-14 applies the same pattern to the TEST-03 manual UAT.
- **Build-time source-text test pattern** for source-of-truth invariants per STATE.md retrospective line 116. Phase 18 adds source-text guards: `ctx.waitUntil(appendTurn` call sites; STORAGE_VERSION === 2 in chat.ts; UUIDv4 regex in validation.ts. Each guard is one assertion; failure surfaces the exact source-of-truth break.
- **Rule 1 cap-bumping pattern** per Plan 17-10 STATE.md retro line 157 — if Phase 18 adds new `is:inline` / counted-construct occurrences (none expected), bump the cap in the same task that introduces the occurrence.
- **Per-turn token accumulator pattern** — Anthropic SSE delivers `content_block_delta` events with `delta.text` per token. The accumulator string concatenates all `event.delta.text` in the for-await loop; final value is the assistant turn's content for `appendTurn(assistant, accumulator, ...)`. This is also where META-02 cache token capture occurs (read from the closure-scoped `cacheUsage` at the `message_delta` branch).

### Integration Points

- `wrangler.jsonc` — UNCHANGED. CHAT_KV binding from Phase 17 KV-01 closure already in place. Phase 18 doesn't edit.
- `src/worker.ts` — UNCHANGED. `Env.CHAT_KV: KVNamespace` already declared.
- `src/lib/chat-transcripts.ts` — **NEW FILE** (~80-120 LOC estimate). Exports `appendTurn(kv, sessionId, role, content, meta)`. Internal: read-modify-write of `live:{sid}` key; schema versioning; 30-turn drop-oldest trim; truncated-flag one-way set; KV-05 quota check; metadata field write with `last_activity_at` + `msg_count`; expirationTtl 30d. Pure module — no Anthropic SDK reach-in, no SSE knowledge. Unit-testable with mock KV.
- `src/pages/api/chat.ts` — wires `ctx.waitUntil(appendTurn(env.CHAT_KV, sessionId, "user", validated_user_content, ...))` AFTER `validateRequest` (line ~84) and BEFORE the Anthropic stream begins (line ~97). Wires `ctx.waitUntil(appendTurn(env.CHAT_KV, sessionId, "assistant", accumulator, { ...cacheUsage }))` AFTER `controller.close()` (line ~170). Adds the missing-sessionId branch per D-04. Captures `request.cf.country` / `request.cf.region` / `request.cf.colo` for first-turn metadata (per META-01).
- `src/scripts/chat.ts` — `STORAGE_VERSION` 1 → 2 (line 81); `ChatStorage` extends with `sessionId: string` (line 75); `saveChatHistory` + `loadChatHistory` thread sessionId through; bubble click handler in `initChat` (around line 572) mints sessionId via `crypto.randomUUID()` if not present, persists, then proceeds with normal panel-open animation; `streamChat` (line 153) includes `sessionId` in the POST body if present. Per D-04: if mint or persist throws, sessionId stays undefined and the field is OMITTED from the body — server's `z.string().uuid().optional()` accepts that.
- `src/lib/validation.ts` — `RequestSchema` (line 31-33) extends to `z.object({ sessionId: z.string().uuid().optional(), messages: z.array(MessageSchema).min(1).max(30) })`. `ValidatedRequest` type auto-updates. No CORS / origin / loopback logic touched.
- `tests/api/anthropic-payload-shape.test.ts` — extended per D-16 with sessionId-on-envelope assertions (existing 5 forward-defense tests stay).
- `tests/api/sse-snapshot.test.ts` — re-verified GREEN per TEST-02 plan-time-amendment language. If a re-baseline is needed (it shouldn't be — `ctx.waitUntil` doesn't touch SSE bytes), planner authors the explicit fixture update.
- `tests/api/cache-hit-logs.test.ts` — extended to assert `appendTurn(assistant, ...)` is called with `meta.cache_read_input_tokens` + `meta.cache_creation_input_tokens` populated from the same `cacheUsage` object the log line consumes (META-02 closure).
- `18-UAT.md` — **NEW FILE** at phase-end. Encodes the manual TEST-03 3× identical UAT step per D-14 + D-15. Subsequent phases inherit this artifact pattern from Phase 17 (`17-UAT.md`).

</code_context>

<specifics>
## Specific Ideas

- The `chat-transcripts.ts` API is **pure** (`appendTurn(kv, sessionId, role, content, meta)`) — no Anthropic SDK reach-in, no SSE knowledge, no `request` object. This isolation lets Phase 19 cron path consume the same module without dragging in chat-surface dependencies. Planner should treat the module as the project's first "infrastructure helper" carving and resist the temptation to add Anthropic-specific knowledge into it.
- The KV-05 per-sessionId write quota guards against the specific failure mode of a scripted resubmit forcing a known sessionId — NOT against anonymous high-volume traffic (per-IP rate limit, deferred to v1.4+ per STATE.md). The two defenses are orthogonal; v1.3 ships with one of them by design.
- "Bubble click" as the mint trigger means `initChat` in `chat.ts` (line ~572) needs a sessionId-mint sub-routine. The mint must happen BEFORE the panel-open animation begins so the first user-submit POST already carries the sessionId. The order is: click → check localStorage chat-history → if sessionId missing, mint + persist → THEN animate panel open.
- The "missing sessionId tolerance" branch (D-04) is the FIRST place in the project where server validation has a "missing-and-acceptable" code path. All prior validation has been "missing = invalid_request 400." Planner should call this out as a deliberate exception to the existing validation posture; researcher should look for whether Zod's `.optional()` versus `z.union([z.string().uuid(), z.literal(undefined)])` is the cleaner expression.
- Concurrent-write race detection (D-13 `chat.transcript.race_suspected` log) requires the in-memory accumulator to track the previous-tail length BEFORE the next read-modify-write. If the new read returns `messages.length < accumulator.previous_tail_len`, log the race. This is observability-only — the write proceeds last-writer-wins.
- The two-touch UAT (preview first, production second) leans on the fact that Workers Builds spins a preview per main-push (Phase 17 D-03 lock). Planner should encode the actual preview-URL pattern as the UAT command, not a generic placeholder — it's `https://{worker-name}-pr-{build-id}.jackcutrara.workers.dev` based on Phase 17 Plan 17-02 SUMMARY observations.
- META-01 fields are mostly "request-arrival snapshot" — server reads `request.cf.country` / `Referer` header / `User-Agent` header on the first turn and pins them as session-level metadata. Per-turn fields (`last_activity_at`, `msg_count`) update each call; per-turn assistant-only fields (cache tokens) attach to the assistant turn's content object inside `messages[]`, NOT the session-level metadata block.

</specifics>

<deferred>
## Deferred Ideas

- **Per-IP rate limit** (transcript spam prevention via Origin/IP throttling) — deferred to v1.4+ per STATE.md `/gsd-roadmap-phase` lock 2026-05-09. KV-05 (per-sessionId quota) is a different surface; it does NOT close the per-IP gap. v1.3 ships with neither defense formally; the 30-turn cap + KV-05 quota are the only transcript-write-side guards.
- **Workers Paid plan upgrade to bind `CHAT_RATE_LIMITER`** — v1.4+ per Plan 17-04 DEBT-01 closure ("Free-tier acceptable"). Trigger threshold: Anthropic spend or chat volume crossing $60/yr-justifying levels.
- **Automated vitest live test against real Anthropic for prompt-cache hits** — discussed, rejected for Phase 18 (per-CI-run cost; flaky on regional Anthropic cache misses; couples CI green to third-party state). One-time manual UAT (D-14) is the v1.3 verification. Revisit in v1.4+ if cache-hit health becomes operationally interesting enough to pay CI cost.
- **Per-session in-memory mutex / optimistic-lock retry for concurrent KV writes** — discussed, rejected as last-writer-wins is acceptable at v1.3 scale (D-13). Revisit if Workers Logs show clustered `chat.transcript.race_suspected` warnings post-launch.
- **Client-side `session-ended` signal at chat-history TTL boundary** — discussed, rejected (new endpoint surface, no operator value; Phase 19 cron sweep already handles cleanup at 2h inactivity).
- **Cross-session sessionId merge** (client passing old and new sid for one turn so server can merge transcripts) — discussed, rejected (contradicts "each transcript is one logical conversation"; introduces a merge code path Phase 19/20 has to honor).
- **Server-side mint fallback when client cannot mint** — discussed, rejected as "noisy KV + broken multi-turn for affected clients" (every turn becomes a one-turn transcript). D-04 silent-fail-no-transcript is cleaner.
- **HTML email body** — locked-deferred per STATE.md v1.3 roadmap. v1.3 ships plaintext-only.
- **`/api/resend-webhook` with Svix HMAC** — locked-deferred to v1.4+ per STATE.md v1.3 roadmap.
- **Phase 21 (Observability + Hardening) — Analytics Engine for transcript metrics, etc.** — locked-deferred to v1.4+ per STATE.md.

### Reviewed Todos (not folded)

None — no pending todos matched Phase 18 scope at discussion time. (The two pending todos in `.planning/todos/pending/` — mobile-menu-breakpoint and og-default-image — remain out-of-scope per v1.3 milestone-shape lock; reviewed at Phase 17 discussion, status unchanged.)

</deferred>

---

*Phase: 18-persistence-identity-kv-write-path-sessionid*
*Context gathered: 2026-05-11*
