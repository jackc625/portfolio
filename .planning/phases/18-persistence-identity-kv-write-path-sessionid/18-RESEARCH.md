# Phase 18: Persistence + Identity — KV Write Path + sessionId — Research

**Researched:** 2026-05-11
**Domain:** Cloudflare KV writes from a Workers SSR SSE endpoint; client-minted UUIDv4 identity threaded through HTTP envelope only; Anthropic prompt-cache integrity preservation
**Confidence:** HIGH (all platform mechanics verified against Cloudflare + Anthropic + Zod official docs via Context7; existing code surface verified via direct file read; D-15 / D-26 / TEST-03 invariants verified against Phase 17 baseline)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### A. sessionId lifecycle

- **D-01:** **Mint on bubble click.** On bubble click, if no sessionId in localStorage chat-history blob, generate `crypto.randomUUID()` and persist BEFORE the panel becomes visible. Window-shoppers get a UUID materialized but no KV write fires (appendTurn only runs on real messages). Visitors returning within 24h get the same sessionId.
- **D-02:** **sessionId lives in the existing chat-history localStorage blob.** Shape extends from `ChatStorage { version: 1, messages, lastActive }` to `ChatStorage { version: 2, sessionId, messages, lastActive }`. `STORAGE_VERSION` bumped 1→2 — existing auto-clear path wipes the old shape on next load.
- **D-03:** **No special treatment for sessions whose client-side blob expired.** When same-blob 24h TTL fires and a fresh sessionId is minted, the previous `live:{old-sid}` sits in KV until Phase 19 cron sweep promotes it or the 30d `expirationTtl` fires.
- **D-04:** **IDENT-02 amended — server tolerates missing sessionId.** If client cannot mint or persist (crypto.randomUUID absent / localStorage disabled / private browsing / quota exceeded), client omits the `sessionId` field. Server: missing sessionId → SKIP `ctx.waitUntil(appendTurn(...))` calls entirely, still serve the Anthropic SSE stream. Malformed sessionId (present but not UUIDv4) → 400 invalid_request. **SPEC AMENDMENT to IDENT-02** — planner adds to the requirement text.

#### B. 30-turn cap trim policy

- **D-05:** **Drop-oldest sliding window at cap.** When `messages.length === 30` and a new turn arrives: `messages = [...messages.slice(-29), newTurn]`. Most-recent 30 always preserved.
- **D-06:** **truncated=true is one-way.** Set the first time a drop happens during a session; never unset.
- **D-07:** **30 = individual messages, not pairs.** Matches existing `validation.ts` `RequestSchema` (`z.array(MessageSchema).min(1).max(30)`) and Anthropic's messages convention.
- **D-08:** **truncated=true surfaces in Phase 20 email subject prefix.** Phase 20 subject becomes `[Portfolio chat] N turns from <country> via <referrer-host> (truncated)` when truncated=true.

#### C. KV write failure handling

- **D-09:** **Silent + structured error log.** Wrap appendTurn body in try/catch. On failure: `console.error("chat.transcript.write_failed", { sessionId, role, error_class })` (flat-primitive fields). Chat surface byte-identical.
- **D-10:** **User turn fires `ctx.waitUntil(appendTurn(user, ...))` AFTER validation, BEFORE stream open** (the durability anchor) — but does NOT block the stream. Anthropic SSE proceeds in parallel.
- **D-11:** **Assistant turn fires `ctx.waitUntil(appendTurn(assistant, ...))` AFTER `controller.close()` — accumulator strategy.** Token deltas accumulate in a local string; final concatenation appended once. NEVER per-token.
- **D-12:** **NEW REQUIREMENT KV-05 — per-sessionId write quota.** Per-sessionId appendTurn call count tracked in KV `metadata` (or sibling counter key — planner's call); hard cap per hour; server rejects writes beyond cap with `console.warn("chat.transcript.quota_exceeded", { sessionId, count_in_window })` and continues serving the stream silently. Plan-phase picks cap value + storage shape.
- **D-13:** **Concurrent-write race policy: last-writer-wins for v1.3.** Within one Worker invocation the read-modify-write is sequential and safe. Cross-invocation races only happen if visitor double-submits faster than Anthropic's stream completes. Mitigation: log `console.warn("chat.transcript.race_suspected", { sessionId, in_memory_tail_len, kv_read_len })` if the just-read messages.length is smaller than what the accumulator's previous-tail captured.

#### D. TEST-03 cross-phase gate hardening

- **D-14:** **Manual UAT at phase close: 3× identical `/api/chat` POSTs within 5min, verify `chat.cache_metrics` log shows `cache_read_input_tokens > 0` on responses 2 and 3.** Performed against `*.workers.dev` preview FIRST, then re-run against production AFTER deploy.
- **D-15:** **Cache miss = blocks phase close.** Root-cause via `wrangler tail` byte-diff of the Anthropic system block between calls 1 and 2 BEFORE any other Phase 18 work merges to main.
- **D-16:** **Extend `tests/api/anthropic-payload-shape.test.ts` with NEW assertions for the sessionId-on-envelope path.** Adds (a) calling `buildChatRequestArgs(portfolioContext, messages)` where the request body carried a sessionId returns args whose system block + messages[0] are byte-identical to a "no-sessionId" call; (b) the HTTP envelope (request body shape) DOES carry sessionId and `validateRequest` accepts it.

### Claude's Discretion

- Exact `src/lib/chat-transcripts.ts` shape (function signature `appendTurn(kv, sessionId, role, content, meta)` is locked; internal helper structure, named exports vs default export, JSDoc style — planner picks).
- Whether the per-sessionId quota (KV-05) lives in `live:{sid}` metadata (most cohesive) or a sibling `quota:{sid}` key (cleaner separation, costs one extra `put()` per turn) — planner researches and picks.
- KV-05 specific cap value + time window. Planner picks from research (50–200 appendTurn writes per sessionId per rolling 1-hour window).
- Where the per-turn token accumulator string lives inside the SSE `start(controller)` closure — concrete shape is planner's call as long as it doesn't introduce SSE-byte changes.
- Order of fields in the `chat.transcript.write_failed` / `chat.transcript.quota_exceeded` / `chat.transcript.race_suspected` log lines (flat primitives only per Plan 17-05 DEBT-02 pattern).
- Whether the metadata `referrer` is sourced from `request.headers.get("Referer")` (server, first-turn-only-then-pin) or client-side `document.referrer` (captures original external entry across subsequent internal-Referer turns). Default to server-side first-turn-only-pin if unclear.
- Whether the metadata `user_agent` is captured at every turn or pinned on the first turn only.
- Whether fixture sessionIds in tests are randomized per-test or hard-coded as constants.
- D-26 chat regression battery EXPANSION targets — new tests Phase 18 ships in addition to existing 30+ chat-surface tests carried from Phase 17.

### Deferred Ideas (OUT OF SCOPE)

- **Per-IP rate limit** (deferred to v1.4+).
- **Workers Paid plan upgrade to bind `CHAT_RATE_LIMITER`** (v1.4+; Free-tier acceptable).
- **Automated vitest live test against real Anthropic for prompt-cache hits** (per-CI cost, flaky on regional Anthropic cache misses).
- **Per-session in-memory mutex / optimistic-lock retry for concurrent KV writes** (last-writer-wins acceptable at v1.3 scale).
- **Client-side `session-ended` signal at chat-history TTL boundary** (no operator value).
- **Cross-session sessionId merge** (contradicts "each transcript is one logical conversation").
- **Server-side mint fallback when client cannot mint** (noisy KV + broken multi-turn).
- **HTML email body** (v1.4+).
- **`/api/resend-webhook` with Svix HMAC** (v1.4+).
- **Phase 21 — Analytics Engine for transcript metrics** (v1.4+).
- **Cron sweep `deliverDue` logic, `live:` → `delivered:` partition, Resend POST** (Phase 19/20).

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **KV-01** | Cloudflare KV namespace `CHAT_KV` bound on production AND preview; declared in `wrangler.jsonc kv_namespaces` | Already done in Phase 17 FOUND-04 — prod id `eaa30fef259e4a6b9505b41bbf3f8f01`, preview `115f3c1b0f8a4a1da9fee78c48dcb749`. Verification-only requirement. See §"KV-01 — already-closed verification" |
| **KV-02** | `src/lib/chat-transcripts.ts` provides pure `appendTurn(kv, sessionId, role, content, meta)`; key naming `live:{sessionId}`; schema versioned `v: 1`; `expirationTtl: 30 * 24 * 3600` (30 days) on every `put()` | KV `put(value, { expirationTtl })` semantics verified via Context7 — minimum TTL is 60s, "expirationTtl sets the expiration time in seconds from current moment". See §"KV write API contract" |
| **KV-03** | KV `metadata` field carries `{ last_activity_at, msg_count }` so cron `list({prefix:'live:'})` filters without per-key `get()` | KV list-response shape verified — `keys[].metadata` is returned inline per `list()` docs. Max metadata size 1024 bytes. See §"KV list-with-inline-metadata" |
| **KV-04** | Transcript values bounded: 30-turn cap, `referrer`/`user_agent` truncated to 512 chars | Drop-oldest sliding-window trim (D-05), one-way truncated flag (D-06). Mirrors existing `RequestSchema.messages.max(30)`. See §"30-turn trim algorithm" |
| **KV-05** (planner-added per D-12) | Per-sessionId `appendTurn` call count tracked; hard cap per rolling 1-hour window; server rejects writes beyond cap with `console.warn("chat.transcript.quota_exceeded", ...)` and continues serving stream silently | Recommended: **100 writes per sessionId per rolling 1-hour window**, stored inline in KV metadata as `{ window_started_at, window_count }`. See §"KV-05 quota storage shape recommendation" |
| **IDENT-01** | Client mints sessionId via `crypto.randomUUID()` on first chat open; persisted in localStorage with `STORAGE_VERSION` bumped 1→2; sent in `/api/chat` request body | `crypto.randomUUID()` is globally available in Workers + modern browsers (no polyfill). Auto-clear at chat.ts:104-106 fires on version mismatch. See §"sessionId mint + persistence" |
| **IDENT-02** (amended per D-04) | Server validates sessionId as UUIDv4 (or accepts ABSENT field); malformed sessionId → 400. **sessionId NEVER threaded into Anthropic message payload.** | Zod v4 has THREE candidates: `z.string().uuid()` (deprecated alias, version-agnostic), `z.uuid()` (top-level, RFC 9562/4122 — version-agnostic, validates variant bits), **`z.uuidv4()`** (top-level, version-specific). Recommendation: `z.uuidv4().optional()`. See §"Zod uuid() vs uuidv4() — version specificity" |
| **META-01** | Transcript captures `started_at`, `last_activity_at`, `referrer`, `user_agent`, `country`, `region`, `colo`, `message_count`, `truncated` | `request.cf.country` / `region` / `colo` available in production via `IncomingRequestCfProperties`; mocked in `wrangler dev` (some properties undefined locally). See §"request.cf field availability" |
| **META-02** | Anthropic `cache_read_input_tokens` / `cache_creation_input_tokens` recorded per assistant turn in transcript metadata. Closes DEBT-02. | Same source as Plan 17-05's `chat.cache_metrics` log seam — the `cacheUsage` closure-scoped object at api/chat.ts:107-111 already captures both fields from `message_start`. Source-of-truth-once: pass the same object into `appendTurn(assistant, …, meta)`. See §"META-02 cache token source-of-truth-once" |
| **TEST-01** | D-26 chat regression battery 117/117 GREEN at every chat-surface commit + phase close | Baseline from Phase 17: 419 PASS / 0 FAIL / 2 SKIP (Plan 17-08 close); `pnpm exec astro check` at 0/0/0. Phase 18 touches chat.ts / api/chat.ts / validation.ts so gate is BLOCKING. See §"D-26 expansion targets" |
| **TEST-03** | Anthropic prompt cache integrity: sessionId NEVER in `system` / `messages[0]`; 3× identical UAT shows `cache_read_input_tokens > 0` on responses 2 and 3 | Anthropic cache: **default 5-minute TTL** (verified via Anthropic docs); cache hit predicate is "100% identical prefix" up to and including the `cache_control` boundary; usage block returns `cache_read_input_tokens` + `cache_creation_input_tokens` on every response. See §"Anthropic prompt cache — cache hit predicate" |

</phase_requirements>

## Summary

Phase 18 is the highest-D-26-risk phase in v1.3 — every requirement Phase 18 implements writes to (or reads from) at least one of the three protected chat-surface files (`src/scripts/chat.ts`, `src/pages/api/chat.ts`, `src/lib/validation.ts`), and the D-26 gate carried from Phase 17 (419/0/2) is **blocking** at every commit. The work breaks into four cleanly-separable layers: (1) a pure `chat-transcripts.ts` module that owns key naming + KV semantics + 30-turn trim + KV-05 quota + metadata shape with zero Anthropic/SSE coupling; (2) two `ctx.waitUntil(appendTurn(...))` insertion points in `api/chat.ts` per the D-10/D-11 ordering contract; (3) a STORAGE_VERSION 1→2 bump + sessionId mint sub-routine in `chat.ts` keyed off bubble-click per D-01; (4) `validation.ts` `RequestSchema` extension for the new envelope field — with the critical invariant that sessionId stays on the HTTP envelope and NEVER threads into `buildChatRequestArgs`.

The architectural locks are unforgiving: D-15 (SSE bytes byte-identical), D-26 (regression battery), and TEST-03 (Anthropic cache integrity) form a triangle that any naive implementation will break. The `ctx.waitUntil` call sites land off the controller-enqueue path so SSE bytes stay byte-identical, the source-text forward-defense test in `tests/api/anthropic-payload-shape.test.ts` is extended per D-16 to catch a template-string leak (which a pattern-grep would miss), and the manual TEST-03 UAT at phase close is the only operational verifier of the live cache hit.

**Primary recommendation:** Build `chat-transcripts.ts` as a pure module (no SDK imports beyond `KVNamespace`), use `z.uuidv4().optional()` for the validation schema (version-specific + missing-tolerant per D-04), store the KV-05 quota inline in metadata as `{ window_started_at, window_count }` with a 100-writes-per-1h rolling window, and capture `request.cf.*` + `Referer` + `User-Agent` at first-turn-only (pin to session-level metadata, don't re-read every turn). The plan-time-authored D-15 amendment for the two `ctx.waitUntil` calls is the canonical wiring; nothing in Phase 18 should add new SSE frame types or new `controller.enqueue` calls.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| sessionId mint | Browser / Client | — | Per IDENT-01, client mints via `crypto.randomUUID()` on bubble click; D-04 server-tolerates-missing means there is no server-mint fallback. Client owns identity issuance. |
| sessionId persistence (cross-tab, 24h TTL) | Browser / Client (localStorage) | — | Existing `chat-history` blob; STORAGE_VERSION gate is the auto-clear contract. No server-side cookie/header alternative considered for v1.3. |
| sessionId validation (shape) | API / Backend (validation.ts) | — | UUIDv4 regex + missing-tolerance per D-04. Zod schema is the single source of truth. |
| Transcript persistence | API / Backend | Storage (KV) | `appendTurn` is a server-side write to `env.CHAT_KV`. Client never reads KV; client never writes KV directly. |
| Transcript metadata capture (country/region/colo) | API / Backend | — | Sourced from `request.cf.*` — Cloudflare-injected at the edge before the SSR handler runs. Browser cannot see these accurately. |
| Transcript metadata capture (referrer/user_agent) | API / Backend | — | Sourced from `request.headers.get("Referer")` / `request.headers.get("User-Agent")` on the first-turn server-side. Default to first-turn-only pin per discretion bullet. |
| Anthropic prompt cache integrity | API / Backend (chat-request-shape.ts) | — | Cacheable surface is the `system` block built by `buildChatRequestArgs`. sessionId stays on HTTP envelope; never threaded into the SDK call args. |
| KV-05 per-sessionId quota | API / Backend (chat-transcripts.ts) | Storage (KV) | Quota lives inline in KV metadata. Server-side enforcement; client never sees the quota. |
| D-15 SSE byte-identical preservation | API / Backend (api/chat.ts) | Test infrastructure | `ctx.waitUntil` calls land off the controller-enqueue path. Both the sse-snapshot fixture and the anti-regression source-text test in api/chat.ts (line 117-127 of sse-snapshot.test.ts) are the structural guard. |
| TEST-03 cache hit verification | API / Backend (operational) | DEBT-02 log seam | Live UAT uses `wrangler tail` to read the `chat.cache_metrics` log line emitted from the `message_delta` branch — the seam shipped in Plan 17-05 commit `7c3827e`. No new instrumentation needed; just an operational verification step. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Cloudflare Workers KV | platform-native (binding already in `wrangler.jsonc`) | Transcript persistence keyed by sessionId | `[VERIFIED: wrangler.jsonc lines 11-17]` Prod id `eaa30fef259e4a6b9505b41bbf3f8f01`, preview `115f3c1b0f8a4a1da9fee78c48dcb749`. `[CITED: developers.cloudflare.com/kv/api/write-key-value-pairs]` Native put/get/list with metadata + expirationTtl. Same pattern across all 4 Phase 18-20 phases. |
| `crypto.randomUUID()` | Web Crypto (global in Workers + modern browsers) | sessionId mint (client-side per D-01; never server-side per deferred-list) | `[CITED: developers.cloudflare.com/workers/runtime-apis/web-crypto]` v4 UUID, 122 bits entropy — collision-free at portfolio scale forever. No polyfill required. |
| Zod | `^4.3.6` | `RequestSchema` extension with sessionId validation | `[VERIFIED: package.json line 32]` Already in use. **Zod v4 has three uuid candidates — see §"Zod uuid() vs uuidv4() — version specificity" for the planner-time decision.** |
| `@astrojs/cloudflare/handler` | `^13.1.7` (existing) | Astro request handling already routed through `src/worker.ts` | `[VERIFIED: src/worker.ts line 9]` Phase 17 FOUND-02 already retired the bundled adapter entrypoint in favor of a custom entrypoint that hosts `fetch + scheduled`. Phase 18 does NOT modify `src/worker.ts`. |
| Vitest | `^4.1.0` | Test framework | `[VERIFIED: package.json line 47]` Already in use. Phase 18 expands the suite per D-16 + D-26 expansion targets. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vi.mock("cloudflare:workers")` | bundled with Vitest | Mock the virtual `env` module so `api/chat.ts` reaches the SSE branch in unit tests | Already in use at `tests/api/sse-snapshot.test.ts` lines 27-31. Re-use pattern for any Phase 18 test that exercises `api/chat.ts` against a mock `env.CHAT_KV`. |
| Plain `Map`-based mock KV | hand-rolled (no library) | `chat-transcripts.ts` unit tests | A 30-line `MockKVNamespace { storage = new Map(); async get(); async put(); async list(); async getWithMetadata(); }` is sufficient. No `@cloudflare/workers-types` install needed — types come from `wrangler types` per existing build chain. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `z.uuidv4().optional()` | `z.string().uuid().optional()` (deprecated alias) | Deprecated in v4 per docs but still works — accepts any UUID version. **Risk:** v5+ UUIDs would pass validation, contradicting IDENT-02's explicit "UUIDv4 regex" wording. Choose `z.uuidv4()` to lock the version. |
| `z.uuidv4().optional()` | `z.uuid().optional()` | Top-level `z.uuid()` is RFC 9562/4122 compliant (validates variant bits) but version-agnostic. **Risk:** same as above. Choose `z.uuidv4()` for explicit version match. |
| `z.uuidv4().optional()` | Hand-rolled regex `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i` | Same accept criteria as `z.uuidv4()` but bypasses Zod's error-shape consistency. Choose Zod's built-in. |
| KV `metadata` inline quota counter | Sibling `quota:{sid}` KV key | Inline metadata = one `put()` per turn (already happening); sibling key = TWO `put()`s per turn (doubles writes against the 1-write/sec/key cap **on a different key**, so no rate-limit conflict, but doubles cost). Inline is more cohesive. **Recommended: inline.** |
| 100 writes/hour quota | 50 or 200 writes/hour | 50 = tight for a real long conversation that happens to span the trim cap; 200 = generous, less protective. **100 = round value, fits "guard, not precise threshold" intent per Claude's-discretion bullet.** |
| First-turn-only metadata pin (referrer / UA) | Per-turn re-read | UA never changes mid-session; referrer changes (internal navigation between pageviews would update `Referer` header from `/` to `/projects/foo`). First-turn pin captures the external entry point; per-turn would be noisy. **Recommended: first-turn-only.** |

**Installation:** No new dependencies. Phase 18 is pure additive code against the existing stack.

**Version verification:**
- `zod` 4.3.6 verified at `package.json:32` (no need to fetch from npm registry — version is locked).
- `@astrojs/cloudflare` 13.1.7 verified at `package.json:23`.
- `crypto.randomUUID` verified as Workers runtime global per Context7-fetched Cloudflare docs.

## Architecture Patterns

### System Architecture Diagram

```
                    Browser / Client (chat.ts, ChatStorage v2)
                    ┌────────────────────────────────────────┐
                    │ Bubble click handler:                  │
                    │  ├── if !storage.sessionId             │
                    │  │     → sid = crypto.randomUUID()     │
                    │  │     → storage.sessionId = sid       │
                    │  │     → saveChatHistory(...)          │
                    │  └── animate panel open                │
                    │                                        │
                    │ streamChat():                          │
                    │  └── fetch /api/chat                   │
                    │      body: { sessionId?, messages }    │
                    └──────────────────┬─────────────────────┘
                                       │
                                       │ POST /api/chat
                                       ▼
                  API / Backend (api/chat.ts — D-15 SSE byte-identical)
                  ┌───────────────────────────────────────────────────┐
                  │ 1. CORS / body / rate-limit (UNCHANGED)           │
                  │ 2. JSON parse                                     │
                  │ 3. validateRequest(body)  ◄── RequestSchema +     │
                  │       sessionId: z.uuidv4().optional()            │
                  │ 4. sanitizeMessages                               │
                  │                                                   │
                  │ 5. D-10: USER TURN write (before stream open)     │
                  │    if (sid) ctx.waitUntil(                        │
                  │      appendTurn(env.CHAT_KV, sid, "user",         │
                  │                 userContent, sessionMeta)         │
                  │        .catch(err => console.error(...)))         │
                  │                                                   │
                  │ 6. Open Anthropic stream                          │
                  │      buildChatRequestArgs(ctx, messages)          │
                  │      ◄── sessionId IS NOT PASSED HERE (TEST-03)   │
                  │                                                   │
                  │ 7. for-await SSE deltas:                          │
                  │      accumulator += event.delta.text              │
                  │      controller.enqueue(...)                      │
                  │      (cache token capture at message_start →      │
                  │       merge at message_delta — Plan 17-05 seam)   │
                  │                                                   │
                  │ 8. controller.enqueue("data: [DONE]\n\n")         │
                  │ 9. controller.close()                             │
                  │                                                   │
                  │ 10. D-11: ASSISTANT TURN write (after close)      │
                  │     if (sid) ctx.waitUntil(                       │
                  │       appendTurn(env.CHAT_KV, sid, "assistant",   │
                  │                  accumulator,                     │
                  │                  { ...cacheUsage })               │
                  │         .catch(err => console.error(...)))        │
                  └─────────────────────┬─────────────────────────────┘
                                        │
                                        │ appendTurn(...)
                                        ▼
                  Pure module (src/lib/chat-transcripts.ts — NEW)
                  ┌───────────────────────────────────────────────────┐
                  │ appendTurn(kv, sid, role, content, meta):         │
                  │  1. read live:{sid} via getWithMetadata           │
                  │  2. KV-05 quota check:                            │
                  │     window_started_at + window_count from metadata│
                  │     - if window expired (>1h): reset to 0         │
                  │     - if window_count >= 100: log warn, RETURN    │
                  │  3. if absent: seed { v: 1, sid, started_at, … }  │
                  │  4. truncate referrer/UA to 512 chars (META-01)   │
                  │  5. apply 30-turn drop-oldest (D-05/D-06/D-07)    │
                  │  6. update last_activity_at, msg_count            │
                  │  7. kv.put(live:{sid}, JSON.stringify(value), {   │
                  │       expirationTtl: 30 * 24 * 3600,              │
                  │       metadata: { last_activity_at, msg_count,    │
                  │                   window_started_at,              │
                  │                   window_count }                  │
                  │     })                                            │
                  └─────────────────────┬─────────────────────────────┘
                                        │
                                        ▼
                  env.CHAT_KV (Workers KV namespace)
                  ─────────────────────────────────
                  live:{sid} → {                              30d TTL
                    v: 1,
                    sid,
                    started_at,                       // ISO 8601
                    last_activity_at,                 // ISO 8601
                    msg_count,
                    truncated,                        // boolean (D-06)
                    meta: { referrer, user_agent,
                            country, region, colo },  // first-turn pin
                    messages: [ { role, content, ts }, … ≤30 ]
                  }
                  metadata: { last_activity_at, msg_count,
                              window_started_at, window_count }
```

### Component Responsibilities

| Component | File | Status | Responsibility |
|-----------|------|--------|----------------|
| Custom Worker entrypoint | `src/worker.ts` | UNCHANGED | Routes fetch → Astro handler, scheduled → Phase 19 stub. Already declares `CHAT_KV: KVNamespace` (line 14). |
| Wrangler config | `wrangler.jsonc` | UNCHANGED | CHAT_KV binding already present (lines 11-17). |
| SSE chat endpoint | `src/pages/api/chat.ts` | TOUCH (+~30 LOC) | Inserts two `ctx.waitUntil(appendTurn(...))` calls per D-10/D-11; reads `request.cf.*` for first-turn metadata; passes `cacheUsage` into assistant-turn write per META-02. D-15 byte-identical SSE bytes preserved. |
| Request validator | `src/lib/validation.ts` | TOUCH (+2 LOC) | Add `sessionId: z.uuidv4().optional()` to `RequestSchema`. Existing `validateRequest` signature unchanged. |
| Transcript persistence module | `src/lib/chat-transcripts.ts` | **NEW** (~80-120 LOC) | Pure module — `appendTurn(kv, sid, role, content, meta)` with read-modify-write of `live:{sid}`, schema versioning, 30-turn trim, KV-05 quota, metadata field write. NO Anthropic / SSE / request reach-in. Unit-testable with mock KV. |
| Client chat widget | `src/scripts/chat.ts` | TOUCH (+~15 LOC) | `STORAGE_VERSION` 1→2 (line 81); extend `ChatStorage` with `sessionId: string` (line 75); `saveChatHistory` / `loadChatHistory` thread sessionId; bubble click handler (line ~572) mints `crypto.randomUUID()` if absent; `streamChat` (line ~188) includes sessionId in POST body if present. Per D-04: if mint/persist throws, field omitted. |
| Anthropic request builder | `src/prompts/chat-request-shape.ts` | UNCHANGED — DEFENSIVELY | The system block + messages[0] surface that Anthropic caches MUST NOT receive sessionId. The D-16 forward-defense test extension covers this. |

### Pattern 1: `ctx.waitUntil()` for fire-and-forget KV writes off the SSE response path

**What:** Use `ctx.waitUntil(promise.catch(handler))` to perform KV writes after the response has been sent to the client. The Worker runtime continues executing the promise even after the response is returned, up to a 30-second limit.

**When to use:** Both Phase 18 KV writes (user turn + assistant turn) — they MUST NOT block the SSE byte stream (D-15 anchor) and MUST survive past `controller.close()`.

**Example:**
```ts
// Source: developers.cloudflare.com/workers/best-practices/workers-best-practices
// (verified via Context7 — "Perform Background Work with waitUntil in Cloudflare Workers")

// User turn (D-10): fires AFTER validation, BEFORE Anthropic stream open
if (validation.data.sessionId) {
  const sid = validation.data.sessionId;
  const userContent = messages[messages.length - 1].content;
  ctx.waitUntil(
    appendTurn(env.CHAT_KV, sid, "user", userContent, sessionMeta)
      .catch((err: unknown) => {
        console.error("chat.transcript.write_failed", {
          sessionId: sid,
          role: "user",
          error_class: err instanceof Error ? err.constructor.name : "unknown",
        });
      })
  );
}

// Assistant turn (D-11): fires AFTER controller.close() — accumulator strategy
// (NEVER per-token — KV's 1-write/sec/key cap would 429 the transcript)
let accumulator = "";
const stream = new ReadableStream({
  async start(controller) {
    // ... existing SSE loop accumulates accumulator += event.delta.text ...
    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    controller.close();

    // POST-close ctx.waitUntil — NOTE: must reach ctx, not a closure-local variable
    if (validation.data.sessionId && accumulator) {
      const sid = validation.data.sessionId;
      ctx.waitUntil(
        appendTurn(env.CHAT_KV, sid, "assistant", accumulator, {
          cache_read_input_tokens: cacheUsage?.cache_read_input_tokens ?? 0,
          cache_creation_input_tokens: cacheUsage?.cache_creation_input_tokens ?? 0,
        }).catch((err: unknown) => {
          console.error("chat.transcript.write_failed", {
            sessionId: sid,
            role: "assistant",
            content_length: accumulator.length,
            error_class: err instanceof Error ? err.constructor.name : "unknown",
          });
        })
      );
    }
  },
});
```

**Critical rule (verified via Cloudflare best-practices docs):** `ctx.waitUntil` rejections are silently swallowed unless caught explicitly. **Always wrap the promise in `.catch(...)` BEFORE passing to `ctx.waitUntil`** — `ctx.waitUntil(p.catch(h))`, never `ctx.waitUntil(p)` with rejection handling elsewhere. This is the code-level enforcement of D-09's silent-fail contract — without the explicit `.catch`, the failure is invisible to operators because `ctx.waitUntil` does not surface the rejection.

**Astro adapter wiring — verified gap to resolve at plan-time:** The existing `api/chat.ts` uses `APIRoute = async ({ request }) =>`. To reach `ctx.waitUntil`, the handler must accept `locals` and read `locals.runtime.ctx` (the `@astrojs/cloudflare` 13.1.x adapter exposes `ctx` via `locals.runtime.ctx`). Planner verifies the exact binding name at plan-time by reading `@astrojs/cloudflare`'s d.ts or by exercising it in a spike. The architectural research doc names it `locals.cfContext` but Astro's current adapter version may have renamed it — this is the one explicit "Phase 18 plan-time spike" item.

### Pattern 2: KV write contract for persistence

**What:** Write the full transcript JSON via `env.CHAT_KV.put(key, JSON.stringify(value), options)` where `options` carries `expirationTtl` (renews every put) and `metadata` (renews every put, max 1024 bytes serialized).

**When to use:** Every `appendTurn` call.

**Example:**
```ts
// Source: developers.cloudflare.com/kv/api/write-key-value-pairs
// (verified via Context7 — "Workers KV put() Method")

const KEY_PREFIX = "live:";
const TRANSCRIPT_TTL_SECONDS = 30 * 24 * 3600; // 30 days
const KV_MAX_REFERRER_LEN = 512;
const KV_MAX_USER_AGENT_LEN = 512;

export async function appendTurn(
  kv: KVNamespace,
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  meta: AppendTurnMeta
): Promise<void> {
  const key = KEY_PREFIX + sessionId;
  const { value: existing, metadata: existingMeta } =
    await kv.getWithMetadata<ChatTranscript, KVMetadata>(key, { type: "json" });

  // ... apply 30-turn trim (D-05), KV-05 quota check, etc. ...

  const updated: ChatTranscript = { /* ... */ };
  const nextMetadata: KVMetadata = {
    last_activity_at: nowIso,
    msg_count: updated.msg_count,
    window_started_at: quotaState.window_started_at,
    window_count: quotaState.window_count,
  };

  await kv.put(key, JSON.stringify(updated), {
    expirationTtl: TRANSCRIPT_TTL_SECONDS,
    metadata: nextMetadata,
  });
}
```

**KV write semantics (verified via Context7):**
- `expirationTtl` minimum is 60 seconds. 30 days = 2,592,000 seconds — well above floor.
- `expirationTtl` is **relative** ("seconds from now"). Every `put()` renews the TTL — so an actively-conversing session is never evicted prematurely.
- `metadata` object serializes to JSON; max **1024 bytes serialized**. The proposed metadata shape `{ last_activity_at: "2026-05-11T...", msg_count: N, window_started_at: "2026-05-11T...", window_count: N }` ≈ 130 bytes — comfortable margin.
- Value max 25 MiB. Worst-case 30-turn transcript at 4 KiB/turn = 120 KiB — 4+ orders of magnitude under the cap.
- **1 write/sec/key cap.** Per-turn writes happen at most once per Anthropic stream cycle (multi-second); KV-05 quota is the per-sessionId-per-hour throttle, but the per-key/sec rate-limit is structurally fine.

### Pattern 3: KV `list({prefix})` with inline metadata for Phase 19 forward-compat

**What:** Phase 19 cron sweep will call `env.CHAT_KV.list({ prefix: "live:" })` and receive each key's metadata inline without per-key `get()` round-trips.

**When to use:** Phase 18 does NOT call `list()` — but the metadata shape written by `appendTurn` must support Phase 19's filter without re-design.

**Example:**
```ts
// Source: developers.cloudflare.com/kv/api/list-keys
// (verified via Context7 — "List Keys API")
// Phase 19 will execute this; Phase 18 just authors the metadata producer.

const result = await env.CHAT_KV.list<KVMetadata>({ prefix: "live:" });
for (const key of result.keys) {
  // key.name      = "live:8b0f7f1c-..."
  // key.metadata  = { last_activity_at, msg_count, window_started_at, window_count }
  // key.expiration = unix epoch when this key expires
  const inactiveMs = Date.now() - new Date(key.metadata.last_activity_at).getTime();
  if (inactiveMs >= 2 * 3600 * 1000) {
    // candidate for delivery (Phase 19 picks up from here)
  }
}
```

**Phase 18 obligation:** Always write `metadata.last_activity_at` and `metadata.msg_count`. Phase 19 reads exclusively from `list()` metadata for the inactivity filter — full-value reads happen only for sessions selected for delivery.

### Pattern 4: Anthropic prompt cache integrity preserved via HTTP envelope isolation

**What:** sessionId travels on the request body (HTTP envelope) and is read by `api/chat.ts` for KV write keying — but is NEVER passed into `buildChatRequestArgs()` and therefore NEVER appears in `args.system` or `args.messages[0]`.

**When to use:** Always. The cacheable surface is `system: [{ type: "text", text: buildSystemPrompt(context), cache_control: { type: "ephemeral" } }]` — anything in `args.system` (or `args.messages[0]`) up to the cache_control boundary participates in the cache hash.

**Example (verified at chat-request-shape.ts:27-44):**
```ts
// args.system is built ONLY from portfolioContext — no sessionId reach-in
const args = buildChatRequestArgs(portfolioContext, messages);
// args.system   = [{ type: "text", text: <portfolio context>, cache_control: {…} }]
// args.messages = [{ role: "user", content: "What's your favorite project?" }, …]
// NEITHER carries sessionId.
```

**Anthropic cache hit predicate (verified via platform.claude.com docs):**
- Default TTL: **5 minutes**. (Optional `ttl: "1h"` at 2× input token price; not used here.)
- "Cache hits require **100% identical prompt segments**, including all text and images **up to and including the block marked with cache control**."
- Hierarchy: tools → system → messages. Changes at each level invalidate that level and all subsequent levels.
- Cache hit fields in `usage` block on response: `cache_read_input_tokens` (read from cache), `cache_creation_input_tokens` (written to cache), `input_tokens` (tokens after the last cache breakpoint).
- **3× identical UAT predicate:** call 1 has `cache_creation_input_tokens > 0, cache_read_input_tokens = 0` (first write). Calls 2 and 3 (same body, within 5 minutes) have `cache_read_input_tokens > 0, cache_creation_input_tokens = 0`. **TEST-03 is structurally verifiable.**

### Anti-Patterns to Avoid

- **DON'T thread sessionId into `buildChatRequestArgs` as a "request context hint."** Breaks the cache; every request becomes `cache_creation` rather than `cache_read`. The forward-defense test at `tests/api/anthropic-payload-shape.test.ts` catches the obvious shape; D-16 adds the byte-equality across sessionId-bearing-vs-not test for template-string leakage.
- **DON'T `await` the KV `put` inline in the SSE loop.** Blocks `controller.close()` past stream completion and (a) measurably lengthens user-perceived stream latency on slow KV writes, (b) on browser-close-mid-stream the in-flight `put` is orphaned and silently dropped per the documented "The script will never generate a response" failure mode.
- **DON'T `ctx.waitUntil(promise)` without a `.catch(handler)` chained first.** Rejections are silently swallowed; D-09's structured error log requires the explicit `.catch` per the Cloudflare best-practices doc.
- **DON'T destructure `ctx` (`const { waitUntil } = ctx`).** Loses the `this` binding → "Illegal invocation" at runtime per the verified Cloudflare best-practices warning.
- **DON'T add new SSE frame types in Phase 18.** D-15 forbids it. The `ctx.waitUntil(appendTurn(...))` calls are the plan-time-authored D-15 amendment — they land off the controller-enqueue path so SSE bytes stay byte-identical. Adding a `data: {persistence:"saved"}\n\n` frame would be a SECOND amendment with no justification.
- **DON'T write the transcript per-token.** KV's 1-write/sec/key cap would 429 the transcript on the very first multi-token stream. Accumulator pattern is mandatory.
- **DON'T mutate `accumulator` outside the `start(controller)` closure.** Local-string accumulator inside the closure is the safest shape (no shared state between concurrent requests).
- **DON'T write sessionId to `wrangler tail` logs alongside IP + UA simultaneously.** Per PITFALLS Moderate-D, the trio creates a fingerprint trail. Phase 18 logs `sessionId` (in `chat.transcript.*` events) but NOT alongside IP. Existing `chat.cache_metrics` log already keeps fields cleanly separated.
- **DON'T look at `chat.cache_metrics` for first-call cache hits.** The Anthropic 5-minute TTL means a "cold conversation" is always a `cache_creation` — that's expected, not a regression. TEST-03 reads the delta on call 2/3 within 5 minutes, not absolute hit rate on call 1.
- **DON'T enable Astro's default `SESSION` KV binding for transcripts.** Per Plan 17-02 SUMMARY, the `@astrojs/cloudflare` adapter auto-injects a `SESSION` namespace ID `5d7c7a5749e24383a4eb256dd39a4ff4`. **Phase 18 uses `CHAT_KV` (already bound).** Do not touch `SESSION` — it's adapter-internal.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom random-string + format | `crypto.randomUUID()` | Web Crypto API global in Workers + modern browsers per verified Cloudflare docs; 122 bits of v4 entropy — collision-free at portfolio scale forever. |
| UUIDv4 regex validation | Hand-rolled regex | `z.uuidv4()` (Zod v4 top-level) | Already in stack at `zod@^4.3.6`. Version-specific; consistent with `z.email()` / `z.url()` ecosystem. |
| KV CAS (compare-and-swap) for concurrent writes | Read-then-CAS loop | Last-writer-wins per D-13 + `console.warn("chat.transcript.race_suspected", ...)` observability log | **KV does NOT support CAS** — verified per Pitfall 2. Cross-invocation races are vanishingly rare at v1.3 scale (one ongoing SSE stream blocks the bubble UI). |
| Idempotency for cron-side delivery | New idempotency mechanism in chat-transcripts.ts | (Phase 19 owns this) | Phase 18 writes only `live:{sid}` and never deletes. Phase 19's two-keyspace partition (`live:` → `delivered:`) + Resend `Idempotency-Key` does the dedupe. Phase 18 is append-only from the chat side. |
| Per-message KV writes per token | Per-token `put` | Accumulator + single end-of-stream `put` | KV's 1 write/sec/key cap is fatal otherwise per verified Pitfall 1. |
| Cookie/header sessionId mint server-side | Server-mint fallback | Client-side `crypto.randomUUID()` per D-01 + missing-tolerance per D-04 | Server-mint fallback explicitly REJECTED in deferred ideas — would create one-turn transcripts for affected clients. |
| Stream completion detection | Custom timer / promise race | Existing for-await loop natural end + `controller.close()` | Already proven over Phase 7. Phase 18 hooks in at `controller.close()` boundary only. |

**Key insight:** Phase 18's "newness" is structurally just **two `ctx.waitUntil` insertions + one pure module + one client field + one validator extension**. Every other concern — UUID generation, UUIDv4 validation, KV semantics, prompt-cache integrity, byte-identical SSE — is **already a solved upstream contract** that Phase 18 must not break. Resist the temptation to over-engineer chat-transcripts.ts (e.g., adding a "transcript repair" path, a "stale read detector", or a "cross-session merge"); each is in deferred-ideas for a reason.

## Common Pitfalls

### Pitfall 1: `ctx.waitUntil` rejections silently swallowed without explicit `.catch`

**What goes wrong:** Writing `ctx.waitUntil(appendTurn(...))` without a `.catch` chained on the promise. Any rejection (KV control-plane failure, value-too-large, network blip) is silently consumed by the Worker runtime. D-09's silent-error-log contract is "structured error log," not "no log at all" — without explicit `.catch`, there is zero observability for KV failures.

**Why it happens:** The pattern looks complete. The `.catch` requirement is non-obvious — most async patterns either propagate errors or have a calling-function `try/catch`. `ctx.waitUntil` is neither: it terminates the promise chain on the runtime side.

**How to avoid:** Always wrap the promise in a `.catch(handler)` BEFORE passing to `ctx.waitUntil`. Pattern:
```ts
ctx.waitUntil(
  appendTurn(kv, sid, role, content, meta).catch((err) => {
    console.error("chat.transcript.write_failed", { sessionId: sid, role, error_class: err?.constructor?.name ?? "unknown" });
  })
);
```

**Warning signs:** Source-text test: assert `ctx.waitUntil(` is followed by an open-paren containing a `.catch(` substring within the same call expression. (Forward-defense test for D-09.)

---

### Pitfall 2: KV eventual consistency — same-Worker reads are fast, cross-POP reads can be stale up to ~60s

**What goes wrong:** `appendTurn` reads `live:{sid}`, sees `messages.length === N`, appends, writes back. A concurrent invocation in a different POP also reads `messages.length === N` (stale view), appends, writes back. Both writes have the new turn, but they overwrite each other's state — losing one turn.

**Why it happens:** KV is "eventually consistent globally" — writes propagate up to 60 seconds across edge POPs. Two concurrent writes to the same key are last-write-wins.

**How to avoid:** Accept last-writer-wins per D-13 (locked decision). Don't engineer around this — KV scale fit is correct; the failure mode is vanishingly rare for one human-driven chat session (the bubble UI prevents concurrent in-flight sends).

**Observability:** D-13's `chat.transcript.race_suspected` warn log fires when the just-read `messages.length` is smaller than the accumulator's previously-captured tail-length. This is OBSERVABILITY-ONLY — the write still proceeds last-writer-wins. The math:

```ts
// inside appendTurn, AFTER reading existing transcript:
const previousTailLen = /* captured from a prior call's just-written state — see below */;
const currentReadLen  = existing?.messages.length ?? 0;
if (previousTailLen !== null && currentReadLen < previousTailLen) {
  console.warn("chat.transcript.race_suspected", {
    sessionId: sid,
    in_memory_tail_len: previousTailLen,
    kv_read_len: currentReadLen,
  });
}
```

**Important clarification on the D-13 accumulator semantic:** In a stateless Worker, there is NO in-memory state between invocations. The "in-memory accumulator's previous-tail-len" can only be captured WITHIN A SINGLE INVOCATION between the user-turn write and the assistant-turn write. The cross-invocation race-suspected case (two simultaneous user submissions from different Worker invocations) cannot be detected from within `appendTurn` because there is no in-memory state shared between them. **Planner reconciles this at plan-time:** either (a) the race detection runs only within the same invocation (user-turn → assistant-turn boundary on the SAME invocation), or (b) it compares the read's `msg_count` (from the prior put's metadata) vs the accumulated count — but this requires `appendTurn` to remember the prior put's count, which only works if both puts happen in the same invocation. **Recommended (a):** keep the race-detection scope to single-invocation only; cross-invocation races at v1.3 scale do not justify the design cost.

---

### Pitfall 3: Anthropic prompt cache invalidated by sessionId leakage

**What goes wrong:** sessionId is threaded into the system block "for debugging" (e.g., concatenated into the system prompt's template string somewhere upstream of `buildChatRequestArgs`). Every request becomes `cache_creation` rather than `cache_read`. Anthropic latency rises 200-500ms per request, token spend doubles, and the v1.2 Phase 14 cache win silently evaporates.

**Why it happens:** sessionId is a useful key on the *transcript* path. The mental shortcut "let me also send it to the model so it knows which session this is" is tempting and looks harmless to a code reviewer who doesn't think about Anthropic's cache hash.

**How to avoid:**
1. **D-16 extension to `tests/api/anthropic-payload-shape.test.ts`** — adds the byte-equality test across sessionId-bearing vs no-sessionId calls. This catches the template-string-concatenation case that a literal-substring grep would miss.
2. **TEST-03 manual UAT at phase close** — 3× identical POST, verify `cache_read_input_tokens > 0` on responses 2 and 3 via `wrangler tail`. The structural test catches static leakage; the UAT catches runtime leakage that a static test cannot see.

**Warning signs:**
- `cache_read_input_tokens: 0` on UAT calls 2 and 3 → blocks phase close (D-15 cache-miss-blocks-close).
- Anthropic spend doubles overnight post-deploy.
- p50 first-token latency rises 200ms+.

---

### Pitfall 4: `request.cf` properties missing or stubbed in `wrangler dev`

**What goes wrong:** `META-01` requires capturing `request.cf.country`, `request.cf.region`, `request.cf.colo`. In production these are populated by Cloudflare's edge. In **local `wrangler dev`** they are mocked, and some properties may be `undefined` or constant test values. Tests against the local dev server would either flake or assert on dev-only stub values.

**Why it happens:** `request.cf` is injected by Cloudflare's edge infrastructure (real geo-IP lookup at the POP). Local Workers runtime (`workerd`) has no edge layer, so it mocks the values.

**How to avoid:**
1. **Defensive reads:** `const country = (request.cf as IncomingRequestCfProperties | undefined)?.country ?? null` — never assume `request.cf` is populated. Schema accepts `null` for all three fields per META-01 contract.
2. **Unit tests mock `request.cf` directly:** construct synthetic Request objects with `{ cf: { country: "US", region: "Texas", colo: "DFW" } }` or `{ cf: undefined }` to exercise both branches.
3. **Integration verification at preview deploy:** the TEST-03 UAT at phase close already deploys to `*.workers.dev` preview — verify `country` is non-null in the persisted transcript before flipping to production.

**Warning signs:** Local `pnpm dev:worker` chat session lands a transcript with `country: null, region: null, colo: null` — that's expected locally; verify at preview-deploy.

---

### Pitfall 5: STORAGE_VERSION bump (1→2) without atomic migration breaks active sessions

**What goes wrong:** Phase 18 bumps `STORAGE_VERSION` from 1 to 2. The existing auto-clear path at `chat.ts:104-106` wipes the old shape on next load — but if a user has the chat panel open at deploy time, the in-memory `chatLog` array still references the v1 shape; the localStorage on next chat-history save will be re-written as v2 BUT the user's open panel loaded under v1 has no sessionId mid-conversation.

**Why it happens:** The version gate fires on `loadChatHistory()`, but `loadChatHistory` is called only on first panel open (chat.ts:649-650). If the user's panel is already open at deploy time, the load path doesn't re-run.

**How to avoid:**
- D-01's "mint on bubble click" semantics inherently solve this: the next bubble click after deploy will re-enter `initChat` → `openPanel` → `loadChatHistory` → version mismatch → auto-clear → fresh sessionId mint. The in-flight session loses continuity (acceptable per D-03's "no special treatment for expired sessions").
- For users whose panel is open at deploy, the active conversation continues against v1 in-memory state; the next localStorage write will fail the version check on the NEXT bubble-open, triggering the auto-clear. No data corruption — just a session boundary at deploy.
- **Test the auto-clear path** at plan-time: load a v1 blob into localStorage, then call `loadChatHistory()`, assert it returns null AND `localStorage.getItem("chat-history")` is null.

**Warning signs:** Post-deploy, users report "my chat session restarted" — expected and acceptable per D-03. NOT a regression.

---

### Pitfall 6: `messages.length` 30-cap calculated wrong because trim happens AFTER the new turn is appended

**What goes wrong:** Trim logic written naively as "if messages.length > 30 after append, slice to last 30." Correct under D-05's "drop-oldest sliding window at cap" — but the **truncated** flag must be set BEFORE the slice if and only if the slice would actually drop something. Off-by-one: trim only when `existing.length === 30 && new turn arrives`, NOT when `existing.length === 29 && new turn arrives` (which results in 30, no drop).

**Why it happens:** "Cap of 30" is ambiguous — it can mean "max 30 in storage" or "drop after 30th addition". D-07 clarifies: `messages.length <= 30` is the contract (matching `RequestSchema.messages.max(30)`).

**How to avoid:**
```ts
// D-05 + D-06 + D-07 — exact implementation
const TURN_CAP = 30;
const next = [...existing.messages, newTurn];
let truncated = existing.truncated ?? false;
if (next.length > TURN_CAP) {
  // Drop-oldest sliding window: keep most-recent 30
  next.splice(0, next.length - TURN_CAP);
  truncated = true; // D-06: one-way set
}
```

**Warning signs:** Test: append 31 turns to a fresh transcript, assert `messages.length === 30` AND `truncated === true`. Append 30 turns to a fresh transcript, assert `messages.length === 30` AND `truncated === false`.

---

### Pitfall 7: KV-05 quota counter races across concurrent invocations

**What goes wrong:** If KV-05's `{ window_started_at, window_count }` lives inline in metadata, two concurrent `appendTurn` invocations read the same `window_count`, both increment, both write back N+1 (lossy). The quota effectively double-counts every concurrent write — making the quota tighter than spec.

**Why it happens:** Same root cause as Pitfall 2 — KV has no atomic counter primitive.

**How to avoid:** Accept lossy increment per D-13 last-writer-wins. The quota is a guard, not a precise threshold (per CONTEXT.md). 100 writes per rolling hour is loose enough that ±10% inaccuracy from races does not affect the protection goal (block scripted resubmits, not human conversations).

**Alternative (rejected):** Use Durable Objects for the counter. Requires Workers Paid, adds infra. Out of scope for v1.3.

**Warning signs:** None — by design, lossy counter is acceptable.

---

### Pitfall 8: Astro APIRoute `locals.runtime.ctx` binding name versions across `@astrojs/cloudflare` releases

**What goes wrong:** Architectural research doc names the binding `locals.cfContext`; existing pre-Phase-18 `api/chat.ts` reads `env` from `cloudflare:workers` virtual module, NOT from locals. Phase 18 needs `ctx.waitUntil` access, which requires `locals.runtime.ctx` (the current adapter convention) — but the exact path may be `locals.runtime` vs `locals.cfContext` vs something else depending on the 13.1.7 adapter shape.

**Why it happens:** `@astrojs/cloudflare` 13.1.x is the third generation of this adapter; binding-path conventions have moved across the versions. Architectural research from 2026-05-09 lists `locals.cfContext` but the v1.2 SUMMARY notes the existing `api/chat.ts` reads `env` via the virtual-module import pattern (which provides `env` but not `ctx`).

**How to avoid:** Plan-time spike — read `node_modules/@astrojs/cloudflare/dist/index.d.ts` or write a 5-line dev-only `console.log(Object.keys(locals.runtime ?? {}))` against `astro dev` to confirm the exact path. This is the ONE explicit "Phase 18 plan-time spike" item.

**Warning signs:** `locals.runtime` is undefined or `ctx` is undefined → planner picks alternative path (e.g., adapter's `executionContext` export from `cloudflare:workers`, or wraps the existing virtual-module `env` import to also surface `ctx`).

## Runtime State Inventory

> Phase 18 is greenfield-additive (new module + new code paths), NOT a rename/refactor. This section enumerates explicitly for the audit trail.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | KV namespace `CHAT_KV` (prod `eaa30fef259e4a6b9505b41bbf3f8f01`, preview `115f3c1b0f8a4a1da9fee78c48dcb749`) currently EMPTY of `live:*` keys — Phase 18 creates the first writes. localStorage `chat-history` key holds v1-shape blobs in active visitor browsers — Phase 18's STORAGE_VERSION bump triggers the auto-clear path on next load. | Phase 18 is the FIRST writer to `live:*`. No migration needed — the keyspace is empty. localStorage auto-clear is the documented IDENT-01 wipe mechanism — no code path beyond the version gate. |
| **Live service config** | None — verified by reviewing `wrangler.jsonc`, `src/worker.ts`, Cloudflare Workers configuration. No external service has a stored reference to "Phase 18" or any sessionId concept. | None. |
| **OS-registered state** | None — no Windows Task Scheduler / launchd / systemd / pm2 registrations reference Phase 18 surfaces. | None. |
| **Secrets and env vars** | Existing Worker secrets at Phase 17 close: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `CHAT_RECIPIENT_EMAIL`, `CHAT_SENDER_EMAIL`. Phase 18 introduces NO new secrets. | None. |
| **Build artifacts / installed packages** | `dist/server/chunks/chat_*.mjs` (built Worker bundle) contains existing chat handler; rebuilt on every deploy. `node_modules` includes `zod@4.3.6` already — no new dependency. | None — `wrangler types` re-emits `worker-configuration.d.ts` on every build per existing chain. |

**Nothing found in category:** All categories explicitly verified.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Cloudflare Workers KV | KV-01..05 | ✓ | platform-native (binding declared at `wrangler.jsonc:11-17`) | — |
| `crypto.randomUUID()` | IDENT-01 client mint | ✓ | Workers runtime + modern browsers | Per D-04: client omits sessionId field if crypto.randomUUID throws (private browsing / extension blocks Web Crypto) — server gracefully accepts the missing field |
| `request.cf.*` (country/region/colo) | META-01 | ✓ in production; **mocked in `wrangler dev`** | `IncomingRequestCfProperties` | Schema accepts `null` for all three fields; verify non-null at preview-deploy UAT before production |
| `ctx.waitUntil` | D-10, D-11 | ✓ via `locals.runtime.ctx` (Astro 6 + @astrojs/cloudflare 13.1.x — exact path verified at plan-time per Pitfall 8) | Workers runtime API | None — required dependency; if path resolution fails, Phase 18 cannot ship |
| Zod | IDENT-02 | ✓ | `^4.3.6` in package.json | — |
| `chat.cache_metrics` Workers Logs seam | META-02 | ✓ (Plan 17-05 commit `7c3827e`) | Server-side log line at api/chat.ts:144-148 | — |
| `pnpm exec astro check` 0/0/0 | TEST-01 | ✓ baseline at Phase 17 close | — | — |
| Vitest `vi.mock("cloudflare:workers")` pattern | D-26 expansion tests | ✓ (Plan 17-01 fixture, sse-snapshot.test.ts:27-31) | — | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** `request.cf.*` mocked locally — fallback via preview-deploy UAT (already part of TEST-03 D-14).

## Code Examples

Verified patterns from official sources.

### Example 1: KV `put()` with `expirationTtl` + `metadata` (KV-02, KV-03, KV-04)

```ts
// Source: developers.cloudflare.com/kv/api/write-key-value-pairs
// (verified via Context7 — "Workers KV put() Method")
//
// expirationTtl minimum is 60 seconds.
// metadata serializes to JSON, maximum 1024 bytes serialized.

const TRANSCRIPT_TTL_SECONDS = 30 * 24 * 3600; // 30 days

await env.CHAT_KV.put(
  "live:" + sessionId,
  JSON.stringify({
    v: 1,
    sid: sessionId,
    started_at: "2026-05-11T17:42:00.000Z",
    last_activity_at: "2026-05-11T17:45:23.000Z",
    msg_count: 7,
    truncated: false,
    meta: {
      referrer: "https://www.google.com/",
      user_agent: "Mozilla/5.0 ...",
      country: "US",
      region: "Texas",
      colo: "DFW",
    },
    messages: [
      { role: "user", content: "Hi", ts: "2026-05-11T17:42:00.000Z" },
      // ... more turns ...
    ],
  }),
  {
    expirationTtl: TRANSCRIPT_TTL_SECONDS,
    metadata: {
      last_activity_at: "2026-05-11T17:45:23.000Z",
      msg_count: 7,
      window_started_at: "2026-05-11T17:42:00.000Z",
      window_count: 7,
    },
  }
);
```

### Example 2: KV `getWithMetadata` for read-modify-write (KV-02 internal helper)

```ts
// Source: developers.cloudflare.com/kv/api/read-key-value-pairs
// (verified via Context7 — "KV Namespace Operations with Cloudflare Workers")

interface KVMetadata {
  last_activity_at: string;
  msg_count: number;
  window_started_at: string;
  window_count: number;
}

const { value, metadata } = await env.CHAT_KV.getWithMetadata<ChatTranscript, KVMetadata>(
  "live:" + sessionId,
  { type: "json" }
);

// value === null if key absent (first turn of new session)
// metadata === null if key absent
// If both are non-null: caller has the previous transcript + last metadata snapshot.
```

### Example 3: `ctx.waitUntil` for fire-and-forget KV write (D-10, D-11)

```ts
// Source: developers.cloudflare.com/workers/best-practices/workers-best-practices
// (verified via Context7 — "Perform Background Work with waitUntil in Cloudflare Workers")
//
// ⚠️ Always chain .catch() BEFORE passing to ctx.waitUntil — rejections
//    are silently swallowed otherwise.
// ⚠️ Never destructure ctx — loses `this` binding ("Illegal invocation" at runtime).

ctx.waitUntil(
  appendTurn(env.CHAT_KV, sid, "user", userContent, sessionMeta).catch((err) => {
    console.error("chat.transcript.write_failed", {
      sessionId: sid,
      role: "user",
      error_class: err instanceof Error ? err.constructor.name : "unknown",
    });
  })
);
```

### Example 4: Zod v4 `uuidv4` validator (IDENT-02)

```ts
// Source: zod.dev/v4 (verified via Context7 — "Use top-level Zod string format functions")
import { z } from "zod";

// ✅ Recommended — version-specific (matches IDENT-02 "UUIDv4 regex" wording)
const sessionIdSchema = z.uuidv4().optional();

// ⚠️ Avoid — deprecated in v4, accepts ANY UUID version
// z.string().uuid()

// ⚠️ Avoid — top-level but version-agnostic (RFC 9562/4122; validates variant bits only)
// z.uuid()

// Integrated into RequestSchema:
export const RequestSchema = z.object({
  sessionId: z.uuidv4().optional(), // D-04: missing-tolerant
  messages: z.array(MessageSchema).min(1).max(30),
});
```

### Example 5: Reading `request.cf.*` defensively (META-01)

```ts
// Source: developers.cloudflare.com/workers/runtime-apis/request#incomingrequestcfproperties
// (verified via Context7)

interface SessionMeta {
  referrer: string | null;
  user_agent: string | null;
  country: string | null;
  region: string | null;
  colo: string | null;
}

function captureRequestMeta(request: Request): SessionMeta {
  const cf = (request as unknown as { cf?: IncomingRequestCfProperties }).cf;
  return {
    referrer: truncate(request.headers.get("Referer"), 512),
    user_agent: truncate(request.headers.get("User-Agent"), 512),
    country: cf?.country ?? null,
    region: cf?.region ?? null,
    colo: cf?.colo ?? null,
  };
}

function truncate(s: string | null, max: number): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}
```

### Example 6: Source-text forward-defense test for `ctx.waitUntil(appendTurn` call sites (D-26 expansion)

```ts
// Source: pattern from tests/build/no-imperative-display-flip.test.ts (Plan 17-03)
// and tests/api/anthropic-payload-shape.test.ts (Plan 17-05)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

describe("Phase 18 D-10/D-11: ctx.waitUntil(appendTurn) call sites", () => {
  const src = readFileSync(
    join(process.cwd(), "src/pages/api/chat.ts"),
    "utf8"
  );

  it("imports appendTurn from chat-transcripts", () => {
    expect(src).toMatch(/from\s+"\.\.\/\.\.\/lib\/chat-transcripts"/);
    expect(src).toMatch(/\bappendTurn\b/);
  });

  it("D-10: user-turn appendTurn call is wrapped in ctx.waitUntil(...).catch(...)", () => {
    // Multiline regex tolerating formatting variations
    expect(src).toMatch(
      /waitUntil\(\s*appendTurn\([\s\S]*?,\s*"user"[\s\S]*?\)\.catch\(/
    );
  });

  it("D-11: assistant-turn appendTurn call is wrapped in ctx.waitUntil(...).catch(...)", () => {
    expect(src).toMatch(
      /waitUntil\(\s*appendTurn\([\s\S]*?,\s*"assistant"[\s\S]*?\)\.catch\(/
    );
  });
});
```

### Example 7: KV `list({ prefix })` with inline metadata (Phase 19 forward-compat — Phase 18 producer side)

```ts
// Source: developers.cloudflare.com/kv/api/list-keys
// (verified via Context7 — "List Keys API")
// Phase 18 writes metadata so Phase 19 can list-without-get; this is the
// CONSUMER side that Phase 18 must support.

const result = await env.CHAT_KV.list<KVMetadata>({ prefix: "live:" });
for (const key of result.keys) {
  // key.name      = "live:8b0f7f1c-1234-..."
  // key.metadata  = { last_activity_at, msg_count, window_started_at, window_count }
  const inactiveMs = Date.now() - new Date(key.metadata!.last_activity_at).getTime();
  if (inactiveMs >= 2 * 3600 * 1000) {
    // Phase 19: candidate for cron delivery
  }
}
// list_complete: false + cursor: <opaque-string> → loop with cursor for next page.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `z.string().uuid()` | `z.uuidv4()` (top-level, version-specific) | Zod v4 (2025-2026 stable) | Method form deprecated in v4 per docs ("z.string().email() etc. is deprecated"); top-level form is tree-shakable + faster + version-explicit. Use top-level. |
| `z.uuid()` | `z.uuidv4()` for IDENT-02 specifically | n/a — both available in v4 | `z.uuid()` is RFC 9562/4122 (version-agnostic, validates variant bits). `z.uuidv4()` is version-specific. IDENT-02's "UUIDv4 regex" wording matches `z.uuidv4()` semantically. |
| `@astrojs/cloudflare/entrypoints/server` (fetch-only entrypoint) | `src/worker.ts` re-exporting `handle()` from `@astrojs/cloudflare/handler` + adding `scheduled()` | Phase 17 FOUND-02 (Plan 17-02, 2026-05-10) | Phase 18 inherits this — does NOT modify the entrypoint. The `scheduled()` stub is in place for Phase 19. |
| `@astrojs/tailwind` integration | `@tailwindcss/vite` plugin | Tailwind CSS v4 / Astro 6 | Not Phase 18 concern (no styling work). Carried-forward locked decision from `CLAUDE.md`. |
| Cookie-based server-issued sessionId | Client-minted UUIDv4 via `crypto.randomUUID()` per D-01 | v1.3 milestone-shape lock (2026-05-09) | Simpler upgrade path, no CORS Set-Cookie complexity, no preview-domain cookie surprises. Locked. |

**Deprecated/outdated:**
- `z.string().uuid()` — still works in v4, but deprecated for next major; use `z.uuidv4()` (or `z.uuid()` for version-agnostic).
- Direct manipulation of `panel.style.display` in `chat.ts` — closed in Phase 17 DEBT-05 + Plan 17-08; do NOT regress.
- Adding new SSE frame types to `/api/chat` without an explicit plan-time D-15 amendment — closed in Phase 17 (D-15 anchor); the Phase 18 `ctx.waitUntil(appendTurn)` calls ARE the plan-time amendment but land OFF the controller-enqueue path, so SSE bytes stay byte-identical.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` / `vitest.config.mjs` (existing — Phase 17 cadence) |
| Quick run command | `pnpm exec vitest run tests/api/chat-transcripts.test.ts tests/api/anthropic-payload-shape.test.ts` |
| Full suite command | `pnpm test` |
| Typecheck command | `pnpm exec astro check` (must hold 0/0/0 — Phase 17 close baseline) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KV-01 | `wrangler.jsonc` declares `CHAT_KV` with prod + preview IDs | build-time source-text | `pnpm exec vitest run tests/build/wrangler-shape.test.ts` | ✅ (Phase 17 FOUND-04 — re-verify GREEN at Phase 18 close) |
| KV-02 | `appendTurn` writes `live:{sid}` with `v: 1`, expirationTtl 30d on every put | unit (mock KV) | `pnpm exec vitest run tests/api/chat-transcripts.test.ts -t "writes live:\\\\{sid\\\\}"` | ❌ Wave 0 — `tests/api/chat-transcripts.test.ts` |
| KV-02 | Schema versioning — value carries `v: 1` | unit (mock KV) | same file, test "schema v: 1" | ❌ Wave 0 |
| KV-03 | `metadata.last_activity_at` + `metadata.msg_count` written on every put | unit (mock KV) | same file, test "metadata fields populated" | ❌ Wave 0 |
| KV-04 | 30-turn cap drop-oldest sliding window; `truncated=true` one-way | unit (mock KV) | same file, tests "30-turn cap" + "truncated one-way" | ❌ Wave 0 |
| KV-04 | `referrer` truncated to 512 chars; `user_agent` truncated to 512 chars | unit (mock KV) | same file, tests "referrer truncation" + "UA truncation" | ❌ Wave 0 |
| KV-05 | Per-sessionId quota: 100 writes/hour rejected with `chat.transcript.quota_exceeded` warn | unit (mock KV) | same file, tests "quota under cap" + "quota over cap rejects + logs" + "quota window expires resets count" | ❌ Wave 0 |
| IDENT-01 | Client mints sessionId via `crypto.randomUUID()` on bubble click + persists to localStorage v2 | jsdom client test | `pnpm exec vitest run tests/client/chat-sessionid-mint.test.ts` | ❌ Wave 0 |
| IDENT-01 | `STORAGE_VERSION` 1→2 auto-clear path wipes old shape | jsdom client test | same file, test "v1 blob auto-cleared on load" | ❌ Wave 0 |
| IDENT-02 | UUIDv4 valid → 200; UUIDv5 / random string → 400; absent → 200 (D-04) | API unit (mock fetch / mock SDK) | `pnpm exec vitest run tests/api/chat-session-id.test.ts` | ❌ Wave 0 |
| IDENT-02 | sessionId NEVER appears in `args.system` or `args.messages[0]` (snapshot — sessionId-bearing call vs no-sessionId call yields byte-identical system block) | source-text + structural | `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` (EXTENDED per D-16) | ✅ Plan 17-05 — extend with D-16 additions |
| META-01 | First-turn metadata captures `referrer`, `user_agent`, `country`, `region`, `colo`, `message_count`, `truncated`; subsequent turns preserve the pinned fields | unit (mock KV + synthetic Request with cf stub) | `pnpm exec vitest run tests/api/chat-transcripts.test.ts -t "META-01"` | ❌ Wave 0 (covered in chat-transcripts.test.ts) |
| META-02 | `appendTurn(assistant, ...)` is called with `meta.cache_read_input_tokens` + `meta.cache_creation_input_tokens` populated from the same `cacheUsage` object the log line consumes | API integration (mock Anthropic SSE + mock KV) | `pnpm exec vitest run tests/api/cache-hit-logs.test.ts -t "META-02"` | ✅ extend Plan 17-05 file (`tests/api/cache-hit-logs.test.ts`) |
| TEST-01 | D-26 chat regression battery 117/117 GREEN at every chat-surface commit | full suite + chat-surface filter | `pnpm test` (every commit per D-10 cadence) | ✅ existing Phase 17 battery (419 PASS / 0 FAIL / 2 SKIP baseline) |
| TEST-01 | `pnpm exec astro check` 0/0/0 at phase end | typecheck | `pnpm exec astro check` | ✅ existing Phase 17 baseline |
| TEST-03 | Forward-defense source-text test stays GREEN | source-text | `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` | ✅ Plan 17-05 + D-16 extension |
| TEST-03 | 3× identical POST UAT — cache_read_input_tokens > 0 on responses 2 & 3 | **manual UAT** (`wrangler tail`) | encoded as numbered manual step in `18-UAT.md` | ❌ Wave N — `18-UAT.md` (NEW at phase close) |
| TEST-03 | D-15 SSE byte-identical anchor preserved | byte-snapshot | `pnpm exec vitest run tests/api/sse-snapshot.test.ts` | ✅ Plan 17-01 fixture — re-verify GREEN |
| TEST-03 | Source-text forward-defense — `ctx.waitUntil(appendTurn` call sites at the right anchors in api/chat.ts | source-text | `pnpm exec vitest run tests/build/append-turn-call-site.test.ts` | ❌ Wave 0 — `tests/build/append-turn-call-site.test.ts` |
| D-09 (implementation contract) | `ctx.waitUntil(promise.catch(handler))` pattern enforced — appendTurn callsites have explicit `.catch` | source-text | `pnpm exec vitest run tests/build/append-turn-call-site.test.ts -t "explicit .catch"` | ❌ Wave 0 (covered in same file) |

### Sampling Rate

- **Per task commit:** `pnpm exec vitest run tests/api/chat-transcripts.test.ts tests/api/chat-session-id.test.ts tests/api/anthropic-payload-shape.test.ts tests/api/sse-snapshot.test.ts tests/api/cache-hit-logs.test.ts tests/build/append-turn-call-site.test.ts tests/build/wrangler-shape.test.ts tests/client/chat-sessionid-mint.test.ts` (chat-surface focused — ~8 files, completes in <10s on warm node_modules cache)
- **Per wave merge:** `pnpm test && pnpm exec astro check` (full suite + typecheck — D-26 cadence per Phase 17 D-10 pattern)
- **Phase gate:** Full suite green + `astro check` 0/0/0 + sse-snapshot 3/3 GREEN + D-26 chat-surface battery 30/30+ GREEN + manual TEST-03 UAT executed against preview AND production with `cache_read_input_tokens > 0` on responses 2 & 3

### Wave 0 Gaps

- [ ] `tests/api/chat-transcripts.test.ts` — covers KV-02, KV-03, KV-04, KV-05, META-01 (mock KV; pure module exercised in isolation; ~12-15 tests)
- [ ] `tests/api/chat-session-id.test.ts` — covers IDENT-02 server-side validation (UUIDv4 accepted, malformed rejected with 400, absent accepted with 200 per D-04); ~5-6 tests
- [ ] `tests/client/chat-sessionid-mint.test.ts` — covers IDENT-01 client-side mint on bubble click + STORAGE_VERSION 1→2 auto-clear (jsdom + mocked `crypto.randomUUID`); ~5-6 tests
- [ ] `tests/build/append-turn-call-site.test.ts` — source-text forward-defense that `ctx.waitUntil(appendTurn(...).catch(...))` appears at the D-10 + D-11 anchors in api/chat.ts; ~4 tests
- [ ] Existing `tests/api/anthropic-payload-shape.test.ts` — EXTEND per D-16 with sessionId-on-envelope byte-equality assertions (2-3 new tests)
- [ ] Existing `tests/api/cache-hit-logs.test.ts` — EXTEND with META-02 closure asserting `appendTurn(assistant, …, meta)` receives the cacheUsage object (2-3 new tests)
- [ ] `tests/api/sse-snapshot.test.ts` — re-verify GREEN; if a re-baseline is needed (it should not be — `ctx.waitUntil` doesn't touch SSE bytes), planner authors the explicit re-baseline check
- [ ] `18-UAT.md` — NEW at phase close, encodes the manual TEST-03 D-14 3× identical-POST step with `wrangler tail` command + expected log shape

*(D-09 source-text guard for explicit `.catch` is bundled into `tests/build/append-turn-call-site.test.ts` — not a separate file.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 18 introduces no auth surface. Identity is anonymous sessionId — no credential. |
| V3 Session Management | partial | sessionId is **not** a session-management token in the V3 sense (no privilege, no access control). It's an opaque correlation ID. v4 UUID via Web Crypto provides sufficient entropy (122 bits) to prevent enumeration / guessing. |
| V4 Access Control | no | Phase 18 has no access-control surface — KV writes are server-side only, no API endpoint exposes the transcript to a client. |
| V5 Input Validation | yes | Zod `RequestSchema` extension validates sessionId shape; existing user/assistant message validation unchanged. Referrer / User-Agent truncated to 512 chars per KV-04 (log-poisoning defense). |
| V6 Cryptography | partial | `crypto.randomUUID()` (Web Crypto) for sessionId — never hand-rolled. No other crypto surface in Phase 18. |
| V7 Error Handling & Logging | yes | D-09 silent-fail with structured `console.error("chat.transcript.write_failed", {…})` log. D-13 `console.warn("chat.transcript.race_suspected", {…})`. D-12 `console.warn("chat.transcript.quota_exceeded", {…})`. Per Pitfall 8 in PITFALLS.md, do NOT log sessionId + IP + UA in a single line (fingerprint trail). |
| V13 API & Web Service | yes | `/api/chat` is the API surface. Phase 18 ADDS a new field (sessionId) to RequestSchema but does not change CORS / origin / rate-limit / body-size logic. |
| V14 Configuration | yes | KV namespace IDs bound in `wrangler.jsonc` (already in place from Phase 17 FOUND-04). No new secrets introduced. |

### Known Threat Patterns for Astro 6 + Cloudflare Workers + KV

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Anthropic prompt cache invalidation via sessionId leakage into `system` block (silently doubles spend) | Tampering (with cache hash) / Denial of Service (via cost) | D-16 byte-equality forward-defense test + TEST-03 D-14 manual UAT (3× identical POST, verify `cache_read_input_tokens > 0` on 2 and 3) |
| KV write storm via scripted resubmits against a known sessionId | Denial of Service | KV-05 per-sessionId quota (100 writes/hour rolling window) → reject with structured warn log + continue serving stream |
| Cross-Worker-invocation KV race losing turns | Tampering (silent state corruption) | Accept last-writer-wins per D-13 (locked); observability via `chat.transcript.race_suspected` warn log. v1.3 scale does not justify Durable Objects. |
| Log poisoning via overlong Referer / User-Agent | Tampering (logs) | KV-04 truncates both to 512 chars before write. |
| Fingerprint exposure via combined sessionId + IP + UA in one log line | Information Disclosure | Pattern: log sessionId in chat.transcript.* events WITHOUT IP. IP appears only in CHAT_RATE_LIMITER context (separate log path, separate operator query). |
| Adversarial UUID supplied by visitor (e.g., reusing another visitor's sessionId to append to their transcript) | Spoofing | sessionId has 122 bits entropy — guessing is computationally infeasible. Mitigation: ACCEPT the risk; transcript collision would just append to whoever's transcript happens to match, and Phase 19/20 surfaces the transcript to Jack's inbox where the impact is visible. v1.3-acceptable. v1.4+ could add HMAC-signed sessionId if needed. |
| KV value-size DoS (oversized turn content) | Denial of Service (against KV's 25 MiB ceiling) | Existing user message cap of 500 chars + assistant message cap of 4096 chars (from validation.ts:7-24) means a 30-turn transcript is at most ~140 KiB — 0.6% of the 25 MiB ceiling. No new check needed. |
| Browser private-browsing / quota-exceeded localStorage breakage | Denial of Service (chat persistence) | D-04 fallback: client omits sessionId from POST body; server skips appendTurn entirely; chat UX preserved. NEW first-of-its-kind "missing-and-acceptable" validation branch in the project. |

## Sources

### Primary (HIGH confidence)

- [Cloudflare Workers KV — Write key-value pairs](https://developers.cloudflare.com/kv/api/write-key-value-pairs/) `[VERIFIED via Context7]` — `put()` semantics with `expirationTtl` (min 60s) + `metadata` (max 1024 bytes serialized) + 25 MiB value cap
- [Cloudflare Workers KV — List keys](https://developers.cloudflare.com/kv/api/list-keys/) `[VERIFIED via Context7]` — `list({ prefix })` returns `keys[]` with inline `metadata`, `list_complete`, `cursor` pagination
- [Cloudflare Workers — scheduled() handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) `[VERIFIED via Context7]` — `(controller, env, ctx)` signature, ctx.waitUntil semantics
- [Cloudflare Workers — Best Practices (waitUntil + handle promises)](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) `[VERIFIED via Context7]` — `ctx.waitUntil(promise)` 30s lifetime; rejection swallowing without `.catch`; destructuring-ctx anti-pattern
- [Cloudflare Workers — request.cf properties](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties) `[VERIFIED via Context7]` — country / region / regionCode / colo / timezone / city / postalCode fields; null when geo-IP unknown
- [Anthropic — Prompt Caching docs (platform.claude.com)](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) `[VERIFIED via WebFetch]` — 5-min default TTL (1h extended option); `cache_read_input_tokens` / `cache_creation_input_tokens` fields in usage block; "100% identical prompt segments up to and including cache_control block" predicate; hierarchy tools→system→messages
- [Zod v4 docs — uuid + uuidv4 validators](https://zod.dev/v4) `[VERIFIED via Context7]` — `z.uuid()` is RFC 9562/4122 (version-agnostic, validates variant bits); `z.uuidv4()` is version-specific; `z.string().uuid()` deprecated in v4
- `wrangler.jsonc` (lines 11-17) `[VERIFIED via direct file read]` — CHAT_KV binding already present prod `eaa30fef259e4a6b9505b41bbf3f8f01` + preview `115f3c1b0f8a4a1da9fee78c48dcb749`
- `src/worker.ts` (line 14) `[VERIFIED via direct file read]` — Env.CHAT_KV: KVNamespace declared
- `src/pages/api/chat.ts` (lines 97-185) `[VERIFIED via direct file read]` — existing SSE structure; line 107-111 `cacheUsage` closure; line 144-148 `chat.cache_metrics` log seam (Plan 17-05 commit 7c3827e)
- `src/scripts/chat.ts` (line 75, 81, 104-106, 572-660) `[VERIFIED via direct file read]` — existing ChatStorage shape; STORAGE_VERSION = 1; auto-clear path; bubble click handler
- `src/lib/validation.ts` (lines 31-33) `[VERIFIED via direct file read]` — RequestSchema shape

### Secondary (MEDIUM confidence)

- [`.planning/research/SUMMARY.md`](../../research/SUMMARY.md) `[CITED]` — Phase 18 rationale lines 155-165; pre-Phase-17 KV data shape; "Never per-token" rule; user-turn-before / assistant-turn-after pattern
- [`.planning/research/ARCHITECTURE.md`](../../research/ARCHITECTURE.md) `[CITED]` — Worker entrypoint shape + KV append flow diagram (Phase 17 has since landed the entrypoint; Phase 18 inherits)
- [`.planning/research/PITFALLS.md`](../../research/PITFALLS.md) `[CITED]` — Critical Pitfalls 1, 2, 5, 6 directly informed Phase 18 design (KV eventual consistency, ctx.waitUntil rejection swallowing, D-26 hold, prompt-cache integrity)
- [`.planning/research/STACK.md`](../../research/STACK.md) `[CITED]` — Cloudflare KV table-stakes / kv_namespaces declaration shape
- `tests/api/anthropic-payload-shape.test.ts` `[VERIFIED via direct file read]` — Phase 17 Plan 17-05 5-test forward-defense battery; D-16 extension target
- `tests/api/sse-snapshot.test.ts` `[VERIFIED via direct file read]` — D-15 byte-identical anchor
- 18-CONTEXT.md `[VERIFIED via direct file read]` — all 16 locked decisions D-01..D-16

### Tertiary (LOW confidence)

- None — Phase 18 research did not rely on unverified web sources.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `locals.runtime.ctx` is the path to `ExecutionContext` in `@astrojs/cloudflare` 13.1.7 SSR routes | Pattern 1 + Pitfall 8 | If wrong, plan-time spike needs to discover the correct binding name. Resolved via 5-minute spike — read `node_modules/@astrojs/cloudflare/dist/index.d.ts` OR a one-shot `console.log(Object.keys(locals.runtime ?? {}))` against dev. |
| A2 | KV-05 quota inline in metadata is preferred over sibling `quota:{sid}` key | KV-05 storage shape | Both work; metadata is the lower-cost path. Inline metadata still grows under 1024-byte cap (130 bytes used). User confirms or planner picks. |
| A3 | 100 writes per sessionId per rolling 1-hour window is the right cap value | KV-05 cap | This is a guard, not a precise threshold per CONTEXT discretion. Wrong cap means either too-loose (no defense) or too-tight (cuts off real conversations); user confirms specific value before plan-time. |
| A4 | First-turn-only metadata pin (referrer + UA) is preferred over per-turn refresh | META-01 referrer/UA capture | Per-turn refresh would update Referer mid-session as user navigates internally; first-turn-only preserves the external-entry signal Jack wants. Confirm at plan-time with operator. |
| A5 | `z.uuidv4().optional()` (version-specific + missing-tolerant) is preferred over `z.string().uuid().optional()` or `z.uuid().optional()` | Zod schema choice | Version-specific matches IDENT-02 wording "UUIDv4 regex"; missing-tolerant matches D-04. Risk if wrong: visitors who somehow ship a v7/v8 UUID would be rejected with 400. At v1.3 scale this is the safest contract — v4 is the only UUID version the client mints. |
| A6 | D-13 cross-invocation race detection should be scoped to single-invocation only (not literal cross-invocation in-memory state) | Pitfall 2 + D-13 | Workers are stateless across invocations — there is no in-memory state to compare against. Cross-invocation race detection would require reading the prior put's metadata.msg_count and comparing to the current read's messages.length. Planner reconciles the exact mechanism at plan-time. |
| A7 | Anthropic prompt cache 5-minute default TTL still holds at v1.3 ship time | TEST-03 UAT predicate | Verified via platform.claude.com docs 2026-05-11. **Time-sensitive:** Anthropic silently changed this from 1h → 5min in March 2026 (per Pitfall 6); a future change could invalidate the UAT's "within 5 minutes" window assertion. Planner verifies the TTL at phase close before running the manual UAT. |

## Open Questions

1. **What is the exact `ExecutionContext` access path in `@astrojs/cloudflare` 13.1.7 SSR routes?**
   - What we know: Architectural research from 2026-05-09 names it `locals.cfContext`; existing api/chat.ts uses the `cloudflare:workers` virtual-module import for `env` but doesn't currently reach `ctx`.
   - What's unclear: Is `ctx` exposed via `locals.runtime.ctx` (Astro convention) or `locals.cfContext` (older adapter) or via some other path?
   - Recommendation: 5-minute plan-time spike — read `node_modules/@astrojs/cloudflare/dist/index.d.ts` OR write a one-shot dev probe. Cheap to resolve; blocks the D-10/D-11 wiring otherwise.

2. **Is `request.cf` reachable from Astro's `APIRoute` request param, or does it require a different access path on `@astrojs/cloudflare` 13.1.7?**
   - What we know: `request.cf` is the canonical Workers-native API; Cloudflare docs verify the shape.
   - What's unclear: Astro wraps the underlying Request — sometimes the cf properties are accessible via `request.cf` directly, sometimes via `locals.runtime.cf`.
   - Recommendation: Same spike as Q1 — verify both `request.cf` and `locals.runtime.cf` paths in dev preview, pick whichever is populated.

3. **What is the exact log-line field-ordering convention for `chat.transcript.write_failed` / `chat.transcript.quota_exceeded` / `chat.transcript.race_suspected`?**
   - What we know: CONTEXT D-09/D-12/D-13 lock the field NAMES; CONTEXT's Claude's-Discretion bullet says ordering is presentational.
   - What's unclear: Should the ordering match the existing `chat.cache_metrics` log shape (Plan 17-05)?
   - Recommendation: Match the existing `console.log("chat.cache_metrics", { cache_read_input_tokens, cache_creation_input_tokens, input_tokens, output_tokens })` shape — sessionId first, then role / count, then error_class. Trivial to align at plan-time.

4. **Does the manual TEST-03 UAT against `*.workers.dev` preview need to use a different sessionId than production, or can the same sessionId be reused?**
   - What we know: Anthropic's prompt cache is account-keyed (the project's ANTHROPIC_API_KEY is the cache namespace); same API key + same payload = same cache entry across deploys.
   - What's unclear: Does the preview deploy share the same API key as production, or has Plan 17-02 / DEPLOY-GATE caused a re-key that creates different cache namespaces?
   - Recommendation: Plan 17-02 SUMMARY notes "ANTHROPIC_API_KEY (re-keyed from Pages — secrets do NOT migrate)" — so the new Worker has its own key. Preview vs production share that key. Same sessionId is fine; the cache namespace is the same. Confirm at UAT-time by reading `wrangler tail` for both preview and production calls and asserting equivalent cache hit behavior.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Cloudflare KV semantics, Zod uuid validators, Anthropic prompt cache all verified via Context7 + WebFetch + direct file read.
- Architecture: HIGH — existing Phase 17 baseline (entrypoint + KV binding + DEBT-02 seam) is in place and verified.
- Pitfalls: HIGH for the eight enumerated patterns — all sourced from official docs or Phase 17 retrospective evidence.
- Open questions: MEDIUM — three of four are 5-minute plan-time spikes (Q1, Q2, Q3); Q4 is a UAT-time confirmation.

**Research date:** 2026-05-11
**Valid until:** 2026-06-10 (30 days for stable Cloudflare KV / Anthropic / Zod surfaces; re-verify the Anthropic 5-min TTL at phase close before running TEST-03 UAT — TTL is the one time-sensitive value per Pitfall 6).
