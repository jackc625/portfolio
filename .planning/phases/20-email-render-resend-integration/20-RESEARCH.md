# Phase 20: Email Render + Resend Integration — Research

**Researched:** 2026-05-12
**Domain:** Resend REST email send + Cloudflare Workers fetch + AbortController + adversarial-payload renderer purity
**Confidence:** HIGH for Resend wire shape (Context7 + warmup-script oracle); HIGH for Workers AbortController semantics (Context7 official Cloudflare docs); HIGH for renderer purity (pure-module pattern verified against Phase 18/19 precedent); **MEDIUM-LOW for `idempotency_replay: true` body-flag — see Drift §1**.

> CONTEXT.md is exceptionally complete. This research **does not re-derive the 16 locked decisions**. It validates the externally-sourced assumptions those decisions ride on (Resend wire shape, Workers fetch + AbortController contract), surfaces drift where doc reality has shifted since v1.3 milestone-wide research, and feeds the planner the validation invariants + landmines it needs to write tight plans.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**A. Cutover strategy**
- **D-01:** Atomic single deploy commit ships Resend wrapper + renderer + `sendOne()` substitution + `wrangler.jsonc` DRY_RUN flip `"1"`→`"0"` + adversarial tests + `20-UAT.md` + `DEPLOY-GATE.md`. Wire was already proven by `scripts/resend-warmup.mjs` at Plan 17-06 (5/5 Inbox first try). Rejected: staged two-commit soak; preview-first via branch.
- **D-02:** Seed-then-cron + wait-for-real operator UAT — 6 steps in `20-UAT.md` (seed live: with stale `last_activity_at` → flip `triggers.crons` to `["* * * * *"]` + redeploy → verify Gmail Inbox + delivered marker + Workers Logs `chat.delivery.sent` → revert cron → backlog cleanup → wait for organic real-traffic).
- **D-03:** Rollback = single-line `wrangler.jsonc` revert (`"DRY_RUN": "0"` → `"1"`). The DRY_RUN=`"1"` code path in `chat-delivery.ts sendOne` STAYS in source as the rollback runway — do NOT delete it.
- **D-04:** DEPLOY-GATE.md required (Plan 17-08 posture). Executor commits all Phase 20 code locally, STOPS at the final metadata commit, writes DEPLOY-GATE.md `status=pending`. Operator runs UAT post-push, replies "approved — deploy gate cleared", THEN `git push origin main` themselves. Executor MUST NOT push.

**B. Subject edge cases**
- **D-05:** Null `request.cf.country` → literal `unknown` token in subject.
- **D-06:** Null `referrer` → literal `direct` token in subject.
- **D-07:** Strict charset enforcement + CR/LF stripping on subject interpolations (NOT a universal `sanitizeHeader()` helper). Country pinned to `[A-Z]{2}` regex or literal `unknown`. `referrer-host` is `new URL(referrer).hostname` + post-parse `[a-z0-9.-]+` regex with fallback to literal `direct`. CR/LF + Unicode bidi (`U+202A..U+202E`, `U+2066..U+2069`) + null-byte strip applied as defensive belt.
- **D-08:** Truncated suffix = ` (truncated)` (trailing space + parenthetical) at end of subject.

**C. Body shape**
- **D-09:** Cache-hit data surfaces as aggregate one-liner inside the metadata header block.
- **D-10:** Cache aggregate format = `Cache: 5/8 turns hit, 7,234 read / 1,221 created`. `hit` = count of assistant turns with `cache_read_input_tokens > 0`. Thousands separators via `Number.toLocaleString("en-US")`.
- **D-11:** Metadata header block = compact 7-line block with padded label column (12 chars suggested; planner picks final width). Then blank line, provenance line, blank line, turn markers.
- **D-12:** Turn-marker render = marker line then raw content, blank line between turns. HTML-escape applied to every dynamic field.

**D. Resend HTTP error policy**
- **D-13:** Three-class HTTP status taxonomy. 2xx → success. 5xx + 429 → retry with same Idempotency-Key (3-try budget; existing `retryWithBackoff`). 4xx-except-429 → no retry; emit `chat.delivery.failed`; return error from `sendOne`.
- **D-14:** Idempotency replay = treat as success; emit distinct `chat.delivery.idempotency_replay` log event. **NOTE: see § Drift Since v1.3 Milestone Research item 1 — explicit `idempotency_replay: true` response field is NOT documented by Resend; CONTEXT.md assumption needs adjustment.**
- **D-15:** `AbortController` with 10s timeout per fetch attempt; throws caught at retry-harness layer treated as 5xx-class.
- **D-16:** Four distinct Workers Logs event names: `chat.delivery.sent`, `chat.delivery.failed`, `chat.delivery.retry`, `chat.delivery.idempotency_replay`. Flat-primitive fields only.

### Claude's Discretion

- `src/lib/email/` directory shape — `render.ts` cohesive vs `render/{subject,body,escape}.ts` split (planner's call; suggestion split if >250 LOC).
- Exact retry-harness wiring inside `sendOne` — recommended: Resend wrapper returns typed Result; `sendOne` translates to throw (5xx/429 → caught by retryWithBackoff) vs returned `{ status: "failed_terminal" }` (4xx-except-429).
- Adversarial-payload fixture organization — recommended single `it.each` test file, one row per locked payload class.
- `20-UAT.md` step ordering matches success-criteria numbering (Phase 17/18/19 precedent).
- User-Agent + Referrer caps live in `chat-transcripts.ts` AT WRITE TIME (Phase 18 KV-04). Renderer reads truncated values; no second truncation.
- Provenance line placement — recommended: below the 7-line metadata block, separated by blank lines from both header and turn markers.
- Resend wrapper API shape — recommended: `sendEmail(env, payload)` accepts already-rendered envelope so renderer + HTTP wrapper are testable in isolation. `sendOne(env, transcript)` composes (render → fetch wrapper → result handling).
- `20-UAT.md` Step 6 organic real-traffic 7-day soft cap (planner's call).
- Optional `tests/build/chat-delivery-send-site.test.ts` source-text forward-defense (recommended).

### Deferred Ideas (OUT OF SCOPE)

- `/api/resend-webhook` with Svix HMAC for bounce/complaint/delivered events — v1.4+
- HTML email body — v1.4+
- Auto-linkification / Markdown rendering of user input — v1.4+
- Per-IP rate limit on chat surface — v1.4+
- Workers Paid plan upgrade to bind `CHAT_RATE_LIMITER` — v1.4+
- Cloudflare Workers Analytics Engine integration — v1.4+ Phase 21
- Configurable inactivity threshold via env var — locked at 2h
- Resend suppression-list audit + Jack's address removal — only relevant if Jack accidentally Spam-flags during UAT
- `tests/api/email-resend.test.ts` against Resend's `delivered@resend.dev` live sandbox — operational verification covers via `20-UAT.md`
- Cross-cron-tick coordination via `delivery_lock:{sid}` — Layers 1+2 cover at v1.3 scale
- Webhook + per-IP rate limiting + Analytics Engine — Phase 21 (v1.4+)

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **MAIL-01** | Thin `fetch()` wrapper to `https://api.resend.com/emails` (NOT npm SDK). `Authorization: Bearer ${RESEND_API_KEY}`. `Idempotency-Key: transcript/{sessionId}` header. Retry-with-same-key on 5xx with exponential backoff. | Wire shape verified VERIFIED via Context7 Resend docs + `scripts/resend-warmup.mjs` oracle (already 5/5 Inbox at Plan 17-06). Retry-with-same-key explicit in Resend best-practices doc. Existing `retryWithBackoff` in `chat-delivery.ts:128-149` reused unchanged. |
| **MAIL-02** | Plaintext-only body via Resend `text` field (no `html` field). `>>> visitor:` / `<<< bot:` markers per turn. Provenance opening line. Metadata header block (timestamps, country, referrer, msg count, cache-hit summary). | Resend API accepts `text` field as first-class alternative to `html` (Context7 confirms — at least one of html/text/react required). Body shape locked by D-11/D-12. Cache aggregate from Phase 18 META-02 fields already on `StoredTurn`. |
| **MAIL-03** | Every dynamic field HTML-escaped at render time even though body is plaintext. CR/LF stripped from headers. Unicode bidi overrides (`U+202A..U+202E`, `U+2066..U+2069`) stripped. | Pure renderer module pattern proven by `chat-transcripts.ts` / `chat-delivery.ts`. Bidi-strip + CR/LF-strip + null-byte-strip semantics validated by adversarial-payload unit test surface enumeration. |
| **MAIL-04** | Subject server-controlled. Format `[Portfolio chat] N turns from <country> via <referrer-host>`. From: `transcripts@mail.jackcutrara.com`. Reply-To: `jackcutrara@gmail.com`. To: `jackcutrara@gmail.com`. | All envelope fields locked. From + Reply-To literals already proven via `scripts/resend-warmup.mjs` lines 51-53 (5/5 Inbox warmup). `CHAT_SENDER_EMAIL` + `CHAT_RECIPIENT_EMAIL` Wrangler secrets in place since Plan 17-02; `CHAT_REPLY_TO_EMAIL` in `wrangler.jsonc vars` since Phase 19. |
| **MAIL-05** | Adversarial-payload unit suite covers `<script>`, `</p><img onerror>`, `javascript:` URLs, RTL/Unicode bidi (`U+202A..U+202E`, `U+2066..U+2069`), null bytes, social-engineering provenance prefixes. Gmail renders all as literal text. | Pure renderer is structurally testable; payload classes enumerated in CONTEXT.md `code_context` section. Vitest `it.each` pattern over fixtures matches Phase 17 chat-knowledge-voice test family precedent. |

</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

| Directive | Source | Phase 20 Application |
|-----------|--------|---------------------|
| Astro 6 + Tailwind v4 + TypeScript 5.9 + Cloudflare Workers + Anthropic Claude Haiku | Tech Stack | Phase 20 touches ZERO frontend surface; pure server-side modules. |
| Editorial design contract `design-system/MASTER.md` v1.1 lock; restrained motion; six-token palette | Conventions | NOT applicable — Phase 20 is server-only. |
| All UI/UX/visual decisions route through frontend-design skill | Conventions | NOT applicable — no UI surface. |
| Chat widget Phase 7 architecture preserved (SSE streaming, focus trap, XSS sanitization, rate limiting) | Conventions | D-26 chat regression battery is forward-defense; Phase 20 touches zero chat-surface files. |
| Type role classes in `global.css` | Conventions | NOT applicable — server-only. |
| **GSD Workflow Enforcement** — all edits go through GSD commands | Conventions | Planner emits PLANs; executor edits via `/gsd-execute-phase`. |
| Use Bash by default, NOT PowerShell despite Windows env | feedback memory | This research uses Bash via wrapper. |
| Do NOT prefix commands with `rtk` in this project — passthrough fails | feedback memory | All commands here are bare. |
| Recommend-first on non-visual technical decisions | feedback memory | Each landmine + drift item below leads with recommendation. |
| Read `.planning/config.json` directly; honor `workflow.use_worktrees: false` | feedback memory | Verified: `use_worktrees: false`. Planner must not create worktree. |
| Audit before/after merges; history of destructive merge commits | feedback memory | Phase 20 has no merge surface (single atomic commit; operator-pushed). |

---

## Drift Since v1.3 Milestone Research

The v1.3 milestone-wide research (`.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`) was authored 2026-05-09. Since then, two material drift points have surfaced from current Resend documentation:

### 1. Resend `idempotency_replay: true` response flag — NOT EXPLICITLY DOCUMENTED [VERIFIED: Context7 /websites/resend + WebFetch resend.com/docs/dashboard/emails/idempotency-keys, 2026-05-12]

**Drift:** CONTEXT.md D-14 + STATE.md Pitfall 4 warning-sign (`Same idempotencyKey appearing twice in Resend dashboard "Sent" log within a 24h window with idempotency_replay: true`) both assume Resend returns an explicit `idempotency_replay: true` field on replayed responses. **Current Resend documentation does NOT document this field.** The official docs (multiple sources) state only:

> "Duplicate payload — Returns original response without resending"
> "Different payload — Returns 409 error"

The replay is detectable two ways, both unverified-as-publicly-documented:
1. **Body-side comparison:** the returned `data.id` is the SAME as the original send's id. Caller compares against locally-stored prior id.
2. **Possible undocumented `idempotency_replay` boolean field on the response body** — present in Resend's older blog posts and in some community SDK fixtures, but no longer in the docs corpus we surveyed.

**Recommendation:** Plan around the body-id comparison path, not a guaranteed boolean field. The `delivered:{sid}` cursor (Layer 1, Phase 19 D-09) IS the application-side replay detector — it short-circuits via `chat.delivery.skipped_already_delivered` BEFORE the Resend call. The Resend Idempotency-Key (Layer 2) is the cross-system safety net for the rare case where Layer 1's KV cursor is stale (eventual-consistency race). In that rare case the cron still POSTs to Resend, Resend returns the original `data.id` instead of duplicating, and the wrapper records that `data.id` in `delivered:{sid}.resend_message_id`. Whether to emit `chat.delivery.idempotency_replay` distinctly from `chat.delivery.sent` depends on whether the wrapper can detect the replay at all — if it can't, conflate both into `chat.delivery.sent` and document this in 20-RETROSPECTIVE.

**Planner action:** Adopt Option A (recommended) — wrapper exposes `{ status: "sent", message_id, attempt }` only, drops the distinct `replayed` Result variant. The four-event-name model in D-16 collapses to three: `sent` / `failed` / `retry`. Ship a Phase 20 sub-decision (D-17) acknowledging the doc drift; this minor scope reduction does NOT block any acceptance criterion (success criterion 4 only requires "exactly one delivered email" — Layer 1 KV cursor delivers that). If the user prefers preservation of D-14's distinct event for forward-compat, Option B is to keep `replayed` as a Result variant and have the wrapper compare `data.id` against a locally-passed prior-id (which the renderer doesn't know — would require threading through `delivered:{sid}` lookup, adding coupling). Recommend Option A unless user objects.

### 2. Resend default rate limit — `5 requests/second per team` (NOT 2/sec) [VERIFIED: Context7 /websites/resend, "Rate Limit" section]

**Drift:** PITFALLS.md Minor Pitfall β + ARCHITECTURE.md line 538 + Context7's older "ai-onboarding" best-practices doc all reference `2 requests/second`. The current Resend `/api-reference/introduction` doc states **5 requests/second per team** is the default cap.

**Impact:** No plan-shape change required. Phase 19's `PER_TICK_BATCH_CAP = 50` + serialized per-session loop in `deliverDue` keeps cron well below either limit (50 sessions × ~1s each ≈ 50s, well below 5/sec sustained rate when serialized; the cron sweep is sequential, not concurrent). The retry-on-429 pattern is unchanged — both the older 2/sec and current 5/sec caps return 429 with the same retry semantics.

**Planner action:** None. This is documentation-only drift; the implementation contract is unchanged.

---

## Resend REST API — Current Surface [VERIFIED: Context7 /websites/resend + scripts/resend-warmup.mjs lines 41-64 oracle, 2026-05-12]

### Endpoint + Method

```
POST https://api.resend.com/emails
```

### Request Headers

| Header | Value | Notes |
|--------|-------|-------|
| `Authorization` | `Bearer ${RESEND_API_KEY}` | Wrangler secret, set via `wrangler secret put RESEND_API_KEY` (already in place since Plan 17-06) |
| `Content-Type` | `application/json` | Required |
| `Idempotency-Key` | `transcript/${sessionId}` | Pattern `<event-type>/<entity-id>` per Resend best-practices doc. 256-char max; 24-hour expiration window. Format example: `transcript/8b0f7f1c-1234-4567-8901-abcdef012345` (47 chars; well under cap). |
| `User-Agent` | `jack-cutrara-portfolio/1.0` (recommended) | Resend KB article 403-error-1010 documents that omitting User-Agent on Node `fetch` requests can trigger 403 errors with code 1010. The `scripts/resend-warmup.mjs` oracle does NOT set User-Agent and worked 5/5 — but the warmup ran from Node, not from Workers runtime. **RECOMMENDATION: set User-Agent defensively on the wrapper to prevent a Workers-runtime 403 surprise.** |

### Request Body (JSON)

```json
{
  "from": "\"Portfolio Chat\" <transcripts@mail.jackcutrara.com>",
  "to": "jackcutrara@gmail.com",
  "reply_to": "jackcutrara@gmail.com",
  "subject": "[Portfolio chat] 7 turns from US via linkedin.com",
  "text": "From: chat widget on jackcutrara.com — visitor message follows below this line.\n\n>>> visitor:\n..."
}
```

**Field semantics:**

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `from` | yes | string | Sender. "Friendly name <email>" format supported. Phase 17 D-06 lock. |
| `to` | yes | string \| string[] | Recipient(s). Single string OK; array max 50. |
| `subject` | yes | string | Server-controlled per MAIL-04. |
| `html` | conditional | string | At least one of `html` / `text` / `react` is required. **Phase 20 OMITS `html` entirely** per MAIL-02 lock. |
| `text` | conditional | string | Plaintext body. Phase 20's only body field. |
| `reply_to` | optional | string \| string[] | Phase 17 D-06 lock = `jackcutrara@gmail.com`. |
| `cc`, `bcc`, `headers`, `tags`, `attachments`, `scheduledAt` | optional | various | NOT used in Phase 20. |
| `idempotencyKey` | optional, body | string | **DO NOT USE in body.** Resend supports the key as either `Idempotency-Key` HTTP header OR `idempotencyKey` body field; the SDK uses body, the REST/curl path uses header. CONTEXT.md D-13 + warmup script use header — adopt that path consistently. Mixing both is undefined. |

### Response Shape

**Success (HTTP 200):**

```json
{
  "id": "49a3999c-..."
}
```

The `id` is the canonical Resend message id — Phase 20 stores this in `DeliveredMarker.resend_message_id` (Phase 19 D-09 additive extension lock).

**Error (HTTP 4xx/5xx):**

```json
{
  "name": "validation_error",
  "message": "to: This field is required.",
  "statusCode": 422
}
```

Error response shape is consistent across error classes; `name` is the machine-readable class, `message` is human, `statusCode` mirrors HTTP. **`name` is the field the wrapper should log as `resend_error` for D-16 `chat.delivery.failed.error_class` operational debugging.**

### Status Code Taxonomy [VERIFIED: Context7 /websites/resend "Best Practices > Error Handling" table]

| Status | Meaning | Phase 20 Action (D-13) | Retry? |
|--------|---------|------------------------|--------|
| 2xx (typically 200) | Success | `{ status: "sent", message_id: data.id, attempt }` → write `delivered:{sid}` with populated `resend_message_id` | N/A |
| 400 | Validation error (bad request shape) | `{ status: "failed_terminal", http_status: 400, resend_error: data.name }` → `chat.delivery.failed` | NO |
| 401 | Unauthorized (bad/missing API key) | `failed_terminal` | NO |
| 403 | Forbidden (domain not verified, or User-Agent missing per code 1010) | `failed_terminal` | NO |
| 409 | **Idempotency conflict** (same key + DIFFERENT payload) | `failed_terminal` — payload non-determinism bug | NO |
| 422 | Validation error (semantic, e.g. invalid email format) | `failed_terminal` | NO |
| 429 | Rate-limited | `{ status: "failed_transient", http_status: 429 }` → caught by retryWithBackoff | YES |
| 5xx | Server error | `failed_transient` | YES |
| 3xx | Unexpected for Resend | Treat as 4xx (`failed_terminal`) | NO |
| Network error / `AbortError` (timeout) | Subrequest failed | Throws — caught by retryWithBackoff as 5xx-class | YES |

**409 is its own semantic class.** CONTEXT.md D-13 says "4xx-except-429 → no retry" — this includes 409. The wrapper should still emit `failed_terminal` with `http_status: 409` so the `chat.delivery.failed` log is greppable. **Operational meaning of 409 in Phase 20:** the same `Idempotency-Key: transcript/{sid}` was reused with a payload that differs byte-for-byte. This signals a renderer bug (non-deterministic body composition) — a critical regression worth surfacing distinctly. **PLANNER ACTION:** consider adding 409 → distinct `chat.delivery.idempotency_conflict` event (extending D-16's family by one) for forward-defense visibility. If the planner skips this, the 4-event family stays stable.

### Idempotency Semantics [CITED: resend.com/docs/dashboard/emails/idempotency-keys + resend.com/docs/ai-onboarding "Best Practices"]

| Property | Value |
|----------|-------|
| Header name | `Idempotency-Key` |
| Max length | 256 characters |
| Expiration window | 24 hours (after which the same key can produce a fresh send) |
| Recommended format | `<event-type>/<entity-id>` — Phase 20 uses `transcript/{sessionId}` (47 chars) |
| Same key + same payload | Returns ORIGINAL response (HTTP 200, same `data.id`); no second send |
| Same key + different payload | Returns 409 |
| **Explicit `idempotency_replay: true` body flag** | **NOT documented in current Resend corpus** — see § Drift item 1. CONTEXT.md D-14 assumption needs revision. |

### Rate Limit [VERIFIED: Context7 /websites/resend "Rate Limit" section]

- **Default:** 5 requests/second per team. (Older docs reference 2/sec — see § Drift item 2.)
- Applies across all API keys for the same team.
- 429 returned on exceedance.
- Phase 20's serialized cron sweep (50 sessions × ~1s each) cannot exceed this rate.

---

## Workers Runtime — fetch + AbortController patterns [VERIFIED: Context7 /websites/developers_cloudflare_workers, 2026-05-12]

### Canonical Pattern

```ts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10_000);

try {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { /* Authorization, Content-Type, Idempotency-Key, User-Agent */ },
    body: JSON.stringify(payload),
    signal: controller.signal,  // ← canonical field name
  });
  clearTimeout(timeoutId);
  // ... handle response ...
} catch (err) {
  clearTimeout(timeoutId);
  if (err instanceof DOMException && err.name === "AbortError") {
    // 10s timeout fired
    throw err;  // re-throw so retryWithBackoff catches and retries
  }
  throw err;
}
```

### Key Workers-Runtime Contract Points

| Contract | Source | Notes |
|----------|--------|-------|
| `signal` is the canonical fetch option field name | Multiple Context7 doc rows | Single-word lowercase, on the init object passed as fetch's 2nd arg. |
| Aborted fetch throws `DOMException` with `name === "AbortError"` | Cloudflare scheduler/AbortSignal example | NOT a generic `Error`. Test mocks must replicate this shape — `throw Object.assign(new Error("abort"), { name: "AbortError" })` is a common-but-imperfect mock; prefer `throw new DOMException("aborted", "AbortError")` (DOMException constructor IS available in Workers + jsdom). |
| `clearTimeout` after both success AND failure paths | Idiomatic | Forgetting clearTimeout doesn't break in Workers (the runtime cleans up on context exit), but in Node-vitest jsdom mode the dangling setTimeout can keep the test process alive past `vitest run` — adopt `try { ... } finally { clearTimeout(...) }` or both branch-clears. |
| `request.signal` (incoming) is distinct from `new AbortController().signal` (outgoing) | Workers Request API | NOT relevant in `scheduled()` context (no incoming request). The wrapper's outgoing signal is purely the timeout mechanism. |
| `enable_request_signal` compat flag | Workers compat flags | NOT needed — that flag controls whether incoming-request abort propagates to subrequests in `fetch()` handler context. Phase 20's path is `scheduled() → ctx.waitUntil(deliverDue) → promoteOne → sendOne → sendEmail → fetch`; no incoming request. |
| `response.body.cancel()` for unconsumed bodies | Workers limits docs | When `!response.ok`, the wrapper should still consume `await response.json()` (to capture the error body for logging) — no `.cancel()` needed. Only matters when discarding the body, which Phase 20 doesn't do. |

### Scheduled Handler Budget — Reconciliation with CONTEXT.md D-15 [VERIFIED: Context7 /websites/developers_cloudflare_workers "Limits > CPU time" + "Wall time limits by invocation type", 2026-05-12]

**CONTEXT.md D-15 says:** "Workers cron-tick budget is 30s total." This conflates two distinct limits.

**Actual limits (Workers Paid plan):**

| Invocation Type | CPU Time | Wall Time |
|-----------------|----------|-----------|
| Cron Trigger interval < 1h | **30s** | 15 minutes |
| Cron Trigger interval ≥ 1h | **15min** | 15 minutes |
| HTTP request | 5 min default (configurable to 5 min max) | unlimited while client connected; +30s `waitUntil` post-disconnect |
| Queue consumer / DO alarm | 15 min CPU | 15 min wall |

**Phase 20 cron interval is `0 * * * *` (hourly = 1h interval) — so the binding limit is 15 MINUTES of CPU, NOT 30 seconds.** Wall-time is also 15 min. The fetch + AbortController pattern's worst-case wall-clock per session (10s timeout × 3 retries + ~7s cumulative backoff ≈ 37s/session) × 50 sessions = ~30 min worst case wall-clock — which DOES exceed the 15min cap if every session ran in serial timeout. In practice:
- CPU time (excludes fetch wait) is dominated by JSON parse + small loops; well under 1ms/session.
- Wall time is dominated by network — the wrapper's success-fast path is ~200-500ms/session; only sessions with full 3-retry timeout failure hit the worst case.
- 50 sessions × 500ms = 25s typical; 50 sessions × 30s worst = 25min (exceeds 15min wall cap).

**RECOMMENDATION (planner action):** Phase 19's CRON-03 batch cap (50 sessions/tick) + 3-retry budget per session is structurally correct for the typical case. For the pathological case where multiple sessions hit the full timeout retry budget, the wall-clock cap will kill the tick mid-batch — but per-session try/catch isolation already preserves Layer 1 (delivered: cursor) for sessions promoted before the kill. Next tick re-attempts the un-promoted sessions, which Layer 2 (Resend Idempotency-Key) deduplicates if any fetch DID land before the timeout. **No code change required** — but the planner should explicitly note this in PLAN-2X (the Resend wrapper plan) so the executor doesn't try to "fix" the wall-clock concern with a global timeout (which would break per-session isolation).

**The 30s reference in CONTEXT.md D-15 likely meant either (a) the older sub-1h-cron CPU budget assumption or (b) the `waitUntil` 30s post-response extension limit (which doesn't apply in scheduled context). Treat CONTEXT.md D-15's "30s ceiling" as an UPPER BOUND on per-tick CPU budget for safety, not the actual platform limit.**

### Subrequest Limit

Workers default subrequest cap is **50 per invocation** (Free plan) / **1,000 per invocation** (Paid plan). Phase 20's worst-case is 1 fetch per session × 3 retries × 50 sessions = 150 subrequests — well below the Paid plan cap, above the Free plan cap. **The Worker is on Paid plan (DEBT-01 CHAT_RATE_LIMITER deferral notes Free-tier acceptable, but cron with `triggers.crons` + KV requires Paid plan — verified by Phase 19 close).** No `wrangler.jsonc` `limits.subrequests` adjustment needed.

---

## Validation Architecture (Nyquist) [`workflow.nyquist_validation: true` in `.planning/config.json`]

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.x (already installed; Phase 17/18/19 baseline) |
| Config file | `vitest.config.ts` (existing) |
| Quick run command | `pnpm exec vitest run tests/api/email-render.test.ts tests/api/email-render.adversarial.test.ts tests/api/email-resend.test.ts tests/api/chat-delivery.test.ts` |
| Full suite command | `pnpm exec vitest run` |
| Estimated runtime | ~12s quick / ~35s full |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAIL-04 | Subject `[Portfolio chat] N turns from <country> via <referrer-host>` for happy path | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "subject happy path"` | ❌ Wave 0 |
| MAIL-04 / D-05 | Subject contains `unknown` token when `meta.country === null` | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "subject null country"` | ❌ Wave 0 |
| MAIL-04 / D-06 | Subject contains `direct` token when `meta.referrer === null` | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "subject null referrer"` | ❌ Wave 0 |
| MAIL-04 / D-07 | Subject country interpolation rejects non-`[A-Z]{2}` value (`unknown` fallback) | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "subject country regex"` | ❌ Wave 0 |
| MAIL-04 / D-07 | Subject referrer-host rejects non-`[a-z0-9.-]+` value (`direct` fallback); rejects malformed URLs (URL parser throws) | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "subject referrer regex"` | ❌ Wave 0 |
| MAIL-04 / D-08 | Subject ends with ` (truncated)` when `transcript.truncated === true` | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "subject truncated suffix"` | ❌ Wave 0 |
| MAIL-02 / D-11 | Body 7-line metadata header block with padded label column; padding count locked | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "body metadata header shape"` | ❌ Wave 0 |
| MAIL-02 / D-09 / D-10 | Cache aggregate one-liner format `Cache: {hit}/{total} turns hit, {read,localized} read / {created,localized} created`; `hit` = count of assistant turns with `cache_read_input_tokens > 0`; thousands separators present | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "cache aggregate"` | ❌ Wave 0 |
| MAIL-02 | Provenance line `From: chat widget on jackcutrara.com — visitor message follows below this line.` placed below metadata header, separated from header AND turn markers by blank lines | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "provenance placement"` | ❌ Wave 0 |
| MAIL-02 / D-12 | Turn markers `>>> visitor:` / `<<< bot:` on own line; raw content below; blank line between turns | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "turn marker shape"` | ❌ Wave 0 |
| MAIL-03 | HTML-escape converts `<`, `>`, `&`, `"`, `'` to entities in every dynamic field (visitor content, bot content, referrer, user-agent, country) | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "html escape"` | ❌ Wave 0 |
| MAIL-03 | CR/LF stripped from subject components | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "crlf strip subject"` | ❌ Wave 0 |
| MAIL-03 | Unicode bidi overrides (`U+202A..U+202E`, `U+2066..U+2069`) stripped from all dynamic fields | unit | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "bidi strip"` | ❌ Wave 0 |
| MAIL-03 | Null bytes (`\0`) stripped from all dynamic fields | unit | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "null byte strip"` | ❌ Wave 0 |
| MAIL-05 | Adversarial: `<script>alert(1)</script>` renders escape-encoded; no executable | unit (it.each row) | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "script tag"` | ❌ Wave 0 |
| MAIL-05 | Adversarial: `</p><img src=x onerror=alert(1)>` renders escape-encoded | unit (it.each row) | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "img onerror"` | ❌ Wave 0 |
| MAIL-05 | Adversarial: `javascript:alert(1)` URL renders as plain text (no auto-link) | unit (it.each row) | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "javascript url"` | ❌ Wave 0 |
| MAIL-05 | Adversarial: RTL/bidi override `\u202E` reversed-text payload renders with bidi chars stripped | unit (it.each row) | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "rtl bidi"` | ❌ Wave 0 |
| MAIL-05 | Adversarial: null bytes in visitor content stripped (no `\0` byte in output) | unit (it.each row) | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "null bytes"` | ❌ Wave 0 |
| MAIL-05 | Adversarial: visitor typing `From: chat widget on jackcutrara.com` as their actual message renders under `>>> visitor:` marker; the AUTHENTIC provenance line above the conversation block is byte-distinct (no spoofing) | unit (it.each row) | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "social engineering provenance"` | ❌ Wave 0 |
| MAIL-01 | `sendEmail()` returns `{ status: "sent", message_id, attempt }` on 200 with mocked fetch | unit (mocked fetch) | `pnpm exec vitest run tests/api/email-resend.test.ts -t "200 sent"` | ❌ Wave 0 |
| MAIL-01 / D-13 | `sendEmail()` returns `failed_transient` on 5xx | unit | `pnpm exec vitest run tests/api/email-resend.test.ts -t "5xx transient"` | ❌ Wave 0 |
| MAIL-01 / D-13 | `sendEmail()` returns `failed_transient` on 429 | unit | `pnpm exec vitest run tests/api/email-resend.test.ts -t "429 transient"` | ❌ Wave 0 |
| MAIL-01 / D-13 | `sendEmail()` returns `failed_terminal` with `http_status` + `resend_error` on 4xx-except-429 (test ≥ 422 + 401 + 403 + 409) | unit (it.each over status codes) | `pnpm exec vitest run tests/api/email-resend.test.ts -t "4xx terminal"` | ❌ Wave 0 |
| MAIL-01 / D-15 | AbortController fires at 10s timeout; thrown `DOMException` with `name === "AbortError"`; bubbled up so retryWithBackoff catches | unit (mocked fetch + fake timers) | `pnpm exec vitest run tests/api/email-resend.test.ts -t "abort timeout"` | ❌ Wave 0 |
| MAIL-01 | Idempotency-Key header literal `transcript/${sessionId}` is set on the fetch call | unit (mocked fetch + spy on init.headers) | `pnpm exec vitest run tests/api/email-resend.test.ts -t "idempotency key header"` | ❌ Wave 0 |
| MAIL-01 / MAIL-04 | `Authorization: Bearer ${env.RESEND_API_KEY}` literal set | unit | `pnpm exec vitest run tests/api/email-resend.test.ts -t "bearer auth header"` | ❌ Wave 0 |
| MAIL-02 | Request body has `text` field present + `html` field ABSENT | unit | `pnpm exec vitest run tests/api/email-resend.test.ts -t "text field only"` | ❌ Wave 0 |
| (D-14 simplified per § Drift item 1) | Wrapper does NOT differentiate `replayed` from `sent` (both are `{ status: "sent" }`) — Layer 1 KV cursor is the application-side replay detector | unit | `pnpm exec vitest run tests/api/email-resend.test.ts -t "replay treated as sent"` | ❌ Wave 0 (planner may keep distinct variant if user prefers) |
| Wiring | DRY_RUN=`"1"` branch in `sendOne` STILL emits `chat.delivery.dry_run` envelope (rollback runway preserved byte-identical) | unit (extend chat-delivery.test.ts) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "dry_run preserves runway"` | ✅ exists, EXTEND |
| Wiring | DRY_RUN=`"0"` branch in `sendOne` calls `sendEmail` with the rendered payload | unit (mock sendEmail; spy) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "live calls sendEmail"` | ✅ exists, EXTEND |
| Wiring | On `{ status: "sent", message_id }` → `delivered:{sid}` value has `dry_run: false` + populated `resend_message_id: string` matching message_id | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "delivered marker resend_message_id"` | ✅ exists, EXTEND |
| Wiring | On `{ status: "failed_transient" }` → retry harness fires (3-try budget) | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "failed_transient retries"` | ✅ exists, EXTEND |
| Wiring | On `{ status: "failed_terminal" }` → emits `chat.delivery.failed`; `live:{sid}` NOT deleted (next tick may handle); `delivered:{sid}` NOT written | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "failed_terminal logs and skips"` | ✅ exists, EXTEND |
| Source-text forward-defense (Claude's discretion, recommended) | `src/lib/chat-delivery.ts` `sendOne` imports the Resend wrapper and does NOT contain the Phase 19 throw stub `send_not_implemented_in_phase_19` | source-text (build) | `pnpm exec vitest run tests/build/chat-delivery-send-site.test.ts` | ❌ Wave 0 (optional) |
| Source-text forward-defense (Claude's discretion, recommended) | `wrangler.jsonc` `vars.DRY_RUN === "0"` at phase close + `triggers.crons === ["0 * * * *"]` (catches operator forgetting to revert UAT cron flip) | source-text (build) | `pnpm exec vitest run tests/build/wrangler-dry-run-shape.test.ts` | ❌ Wave 0 (optional) |
| D-26 chat-surface battery PRESERVED (forward-defense) | Phase 20 touches ZERO chat-surface files | full battery | `pnpm exec vitest run` — 498 PASS / 0 FAIL / 2 SKIP baseline must hold or grow | (verify) |
| D-15 SSE byte-identical anchor PRESERVED | `tests/api/sse-snapshot.test.ts` GREEN | unit | `pnpm exec vitest run tests/api/sse-snapshot.test.ts` | (verify) |
| TEST-03 Anthropic prompt-cache integrity PRESERVED | `tests/api/anthropic-payload-shape.test.ts` GREEN | unit | `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` | (verify) |
| `pnpm exec astro check` exits 0/0/0 | (forward-defense) | typecheck | `pnpm exec astro check` | (verify) |
| `pnpm build` clean | (forward-defense) | build | `pnpm build` | (verify) |
| `package.json` `dependencies` byte-identical phase-wide (zero new runtime deps — MAIL-01 lock) | (forward-defense) | source-text or visual diff | `git diff --stat package.json` shows `dependencies` unchanged | (verify at phase close) |

### Sampling Rate

- **Per task commit:** Run quick run command (the 4 affected test files): `pnpm exec vitest run tests/api/email-render.test.ts tests/api/email-render.adversarial.test.ts tests/api/email-resend.test.ts tests/api/chat-delivery.test.ts`
- **Per wave merge:** Full suite `pnpm exec vitest run` + `pnpm exec astro check`
- **Phase gate (before `/gsd-verify-work`):** Full suite GREEN; `pnpm build` clean; `package.json` deps byte-identical; `wrangler.jsonc vars.DRY_RUN === "0"`

### Wave 0 Gaps

- [ ] `tests/api/email-render.test.ts` — covers MAIL-02, MAIL-04, D-05..D-12 happy paths + edge cases
- [ ] `tests/api/email-render.adversarial.test.ts` — covers MAIL-03, MAIL-05 adversarial-payload `it.each`
- [ ] `tests/api/email-resend.test.ts` — covers MAIL-01, D-13..D-15 with mocked global `fetch`
- [ ] `tests/api/chat-delivery.test.ts` EXTEND — covers `sendOne` substitution wiring (NEW assertions on existing test file; not new file)
- [ ] `tests/build/chat-delivery-send-site.test.ts` — source-text forward-defense (OPTIONAL — recommended)
- [ ] `tests/build/wrangler-dry-run-shape.test.ts` — source-text forward-defense (OPTIONAL — recommended)
- [ ] No framework install required — vitest 4.x already configured
- [ ] No new test fixtures beyond inline literal `ChatTranscript` objects (built per-test from a fixture-builder helper similar to `tests/api/chat-delivery.test.ts:50-58`)

---

## Implementation Landmines

The planner should encode each of these as `read_first` references or `acceptance_criteria` checks in plan task specs.

### Landmine 1: AbortController throws DOMException, not Error

**Symptom if missed:** Test mock `throw new Error("aborted")` passes the test but the real wrapper code branch checking `err.name === "AbortError"` never fires in production. Result: aborted requests are mis-classified as terminal failures.

**Mitigation:**
- Wrapper code MUST check `err instanceof DOMException && err.name === "AbortError"` (per Workers official docs).
- Test mocks MUST throw `new DOMException("aborted", "AbortError")`, NOT `new Error("aborted")` — DOMException IS available in vitest's jsdom environment + in Workers runtime.
- Acceptance criterion: "test mock throws DOMException with name AbortError; wrapper's catch branch matches; assert that the wrapper returns `failed_transient` (or re-throws so retryWithBackoff catches as transient)."

### Landmine 2: clearTimeout on both success AND failure paths

**Symptom if missed:** A successful 200 fetch leaves a dangling 10s setTimeout. In Workers it's harmless (runtime cleans up); in vitest jsdom it can keep the test process alive past `vitest run` completion or cause cross-test bleed when fake timers are introduced (`vi.useFakeTimers()` + dangling real-timer = Heisenbug).

**Mitigation:**
- Use `try/finally`: `try { /* fetch + parse + return */ } finally { clearTimeout(timeoutId); }`. This works for both happy path AND error path. Recommended over branch-by-branch clearTimeout.
- Acceptance criterion: source-text test or unit test asserts `setTimeout` is paired with `clearTimeout` in the wrapper module.

### Landmine 3: `idempotency_replay: true` body flag is NOT documented (see § Drift item 1)

**Symptom if missed:** Wrapper code branches on `responseBody.idempotency_replay === true` and never matches in production. The "replayed" Result variant is dead code; the `chat.delivery.idempotency_replay` log event never fires.

**Mitigation (recommended):** Drop the `replayed` Result variant per § Drift item 1 Option A. Wrapper exposes `{ status: "sent", message_id, attempt }` only on 200. Layer 1 (`delivered:{sid}` cursor) is the application-side replay detector.

**Alternative (Option B):** Keep `replayed` variant; have the wrapper compare `data.id` against a `prior_message_id` arg passed in by `sendOne` (which would need to read `delivered:{sid}` first to populate it — adds coupling to `chat-delivery.ts`). NOT recommended — re-litigates a CONTEXT.md decision based on an assumption that's unsupported by current docs.

**Acceptance criterion:** PLAN documents which option was taken. If Option A, the planner emits a Phase 20 sub-decision (D-17) acknowledging doc drift + plan amendment. If Option B, the wrapper signature accepts `prior_message_id?: string` and tests cover the comparison branch.

### Landmine 4: Forgetting to set User-Agent header → 403 with code 1010

**Symptom if missed:** `scripts/resend-warmup.mjs` doesn't set User-Agent and worked 5/5 from Node — but the Workers runtime presents a different default User-Agent header. Resend KB article "403 with code 1010" documents this exact failure mode.

**Mitigation:** Set `User-Agent: jack-cutrara-portfolio/1.0` (or similar identifying string) on every Resend fetch. Cheap defense.

**Acceptance criterion:** unit test asserts the `User-Agent` header is present on the fetch call.

### Landmine 5: Renderer non-determinism → Resend 409

**Symptom if missed:** The renderer composes a body that contains a non-deterministic value (e.g., `new Date().toISOString()` for "rendered at" timestamp). Two cron retries within 24h produce byte-different bodies; Resend returns 409 ("idempotency conflict"). The send fails terminal even though the previous send succeeded.

**Mitigation:**
- Renderer MUST be a pure function of `ChatTranscript`. No `Date.now()`, no `crypto.randomUUID()`, no env reads beyond what's threaded through the transcript.
- All timestamps shown in the email body come from `transcript.started_at`, `transcript.last_activity_at`, `messages[i].ts` — already-recorded values.
- "Generated at" / "Sent at" type fields are FORBIDDEN.

**Acceptance criterion:** unit test calls `renderEmail(sameTranscript)` twice and asserts `result1 === result2` (deep equality on the rendered envelope). This is a regression-locked invariant.

### Landmine 6: HTML-escape vs CR/LF strip vs bidi-strip ordering

**Symptom if missed:** If escape runs BEFORE bidi-strip, then bidi-strip operates on the already-escaped string — but since HTML entities don't include bidi chars, this works. If bidi-strip runs BEFORE escape, then a payload like `<\u202Escript>` becomes `<script>` after strip, then `&lt;script&gt;` after escape — also works. **However**, if null-byte strip runs AFTER escape on a payload like `&` followed by `\0` followed by `lt;`, the unstripped `\0` could splice the entity. **Conservative ordering: strip CR/LF + bidi + null-bytes FIRST (input sanitization), THEN escape (output encoding).**

**Mitigation:** Renderer's helper applies in order:
1. `stripControlChars(s)` — null bytes, then CR/LF (subject only)
2. `stripBidiOverrides(s)` — `U+202A..U+202E`, `U+2066..U+2069`
3. `htmlEscape(s)` — `&` → `&amp;` first, then `<`, `>`, `"`, `'`

**Acceptance criterion:** adversarial test asserts that a payload combining all three classes (null-byte + bidi-override + script-tag) produces an output where: no `\0` bytes are present, no bidi codepoints are present, and `<script>` is rendered as `&lt;script&gt;` literally.

### Landmine 7: KV.put metadata field on `delivered:` writes (D-11 lock — Phase 19)

**Symptom if missed:** Phase 19 D-11 explicitly forbids a metadata field on `delivered:{sid}` writes. If Phase 20 accidentally adds one (e.g., copy-paste from `appendTurn` in `chat-transcripts.ts` which DOES use metadata), the cron's `list({ prefix: "delivered:" })` surface starts returning sortable indices and creates the temptation to refactor toward a list-driven idempotency check — at which point Layer 2 (Resend Idempotency-Key) becomes load-bearing instead of the simpler Layer 1 cursor check.

**Mitigation:** The Phase 19 `promoteOne` already encodes the locked behavior (lines 268-281: `kv.put(...)` with only `expirationTtl`, no `metadata`). Phase 20's edit ONLY adds the `resend_message_id` field to the value — does NOT change the `kv.put` options.

**Acceptance criterion:** unit test asserts `mockKV.put.calls[0][2]` equals `{ expirationTtl: DELIVERED_TTL_SECONDS }` exactly (no `metadata` key).

### Landmine 8: Workers cron wall-clock cap is 15 MIN, not 30s (CONTEXT.md D-15 reconciliation)

**Symptom if missed:** Future contributor reads CONTEXT.md D-15 "Workers cron-tick budget is 30s total" and tries to add a global timeout / abort the entire batch at 30s. Per-session try/catch isolation breaks; first batch gets killed before any session promotes; backlog grows.

**Mitigation:** No code change in Phase 20. Planner notes the reconciliation in PLAN-2X (Resend wrapper plan): per-session 10s × 3 retries = 30s worst case PER SESSION (not per batch). 50 sessions × 500ms typical = 25s typical; 50 × 30s worst = 25min worst (exceeds 15min wall cap). Layer 2 (Idempotency-Key) handles the wall-clock-kill mid-batch case; next tick re-attempts.

**Acceptance criterion:** PLAN includes a comment block citing this landmine + the reconciliation. No automated test required (the 15min cap can't be exercised in vitest).

### Landmine 9: `JSON.stringify` reliability with Idempotency-Key

**Symptom if missed:** Two retries within the 24h window send "the same payload" — but `JSON.stringify({a: 1, b: 2})` and `JSON.stringify({b: 2, a: 1})` produce DIFFERENT byte strings. If the renderer's body-composition order isn't deterministic (e.g., uses `Object.keys()` on a Map iteration), retries produce non-byte-identical bodies → Resend 409.

**Mitigation:**
- The Resend POST body is `{ from, to, reply_to, subject, text }` — five fixed keys in a literal object. Object literal key ordering is stable in V8 / Workers runtime per ES2015 spec for string keys.
- The renderer's output is a pure function of ChatTranscript; no Map iteration, no `Object.keys(arbitraryObj)`.
- Test (Landmine 5 acceptance) covers this via deep-equality of `renderEmail(sameTranscript)`.

**Acceptance criterion:** Same as Landmine 5. The deterministic-render test catches this.

### Landmine 10: 409 Conflict semantics — distinct event vs conflate with `failed`

**Symptom if missed:** A 409 from Resend means "same Idempotency-Key + DIFFERENT payload reused" — almost certainly a renderer bug (Landmine 5/9). Logging it as plain `chat.delivery.failed` makes it grep-indistinguishable from validation errors (400/422) which are usually content bugs (e.g., bad To: format).

**Mitigation (recommended):** The wrapper's `failed_terminal` Result includes `http_status`, so `chat.delivery.failed` log carries the discriminator. Greppable via `wrangler tail --search "chat.delivery.failed" | grep '"http_status":409'`. NO new event name needed (keeps D-16's 4-event family stable, modulo § Drift item 1's potential 3-event reduction).

**Alternative:** Add a 5th event `chat.delivery.idempotency_conflict` for forward-defense. NOT necessary at v1.3 scale (one bug surface; the `http_status` discriminator suffices).

**Acceptance criterion:** unit test asserts `chat.delivery.failed` log emitted with `http_status: 409` when wrapper sees 409 response.

---

## Pattern References

File:line analogs the planner should reference in PLAN task `read_first` lists.

### Renderer pure-module pattern

| Reference | Why |
|-----------|-----|
| `src/lib/chat-transcripts.ts:30-105` (locked constants block + interfaces + `truncate` helper) | Same shape Phase 20's `email/render.ts` should adopt: locked constants exported for test-side assertion; interfaces declared at file top; pure helpers below. |
| `src/lib/validation.ts:1-87` (request schema + sanitization helpers) | Pure-module helper pattern — the pure modules in this codebase consistently isolate the sanitization layer at module top. |
| `src/lib/chat-delivery.ts:108-115` (`hostnameOrNull` helper) | Existing helper for `new URL(referrer).hostname` extraction with try/catch + null fallback. Phase 20's renderer should reuse this pattern (and could re-export or duplicate; planner's call). |
| `src/lib/chat-delivery.ts:39-40` (re-imports `KEY_PREFIX` from sibling module) | Phase 20 renderer imports `ChatTranscript`, `StoredTurn`, `KVMetadata` types from `chat-transcripts.ts` as type-only. |

### Resend wrapper wire-shape oracle

| Reference | Why |
|-----------|-----|
| `scripts/resend-warmup.mjs:41-64` | EXACT wire shape: URL, method, headers (Authorization, Content-Type, Idempotency-Key), body JSON keys (from, to, reply_to, subject, text). Phase 20's `src/lib/email/resend.ts` is a Workers-runtime port of this with: (a) AbortController added; (b) discriminated Result return; (c) structured-log emission; (d) User-Agent header added (Landmine 4). The fetch shape itself is byte-identical. |
| `src/lib/chat-delivery.ts:128-149` (`retryWithBackoff` helper) | Already implements 3-try full-jitter exponential backoff. Phase 20 reuses unchanged. The Resend wrapper's `failed_transient` Result variant is the throw-trigger that this helper catches and retries. |
| `src/lib/chat-delivery.ts:163-184` (`sendOne` substitution target) | Phase 19 throw branch at line 183 (`throw new Error("send_not_implemented_in_phase_19")`) is the exact substitution point. The DRY_RUN=`"1"` branch above stays byte-identical as rollback runway. |
| `src/lib/chat-delivery.ts:66-73` (`DeliveredMarker` interface) | Additively extend with `resend_message_id: string`. Schema `v: 1` unchanged; `dry_run: false` when env.DRY_RUN === `"0"`. |
| `src/lib/chat-delivery.ts:268-281` (`promoteOne` step-4 PUT site) | Populate `resend_message_id` on the value. `kv.put` options stay `{ expirationTtl: DELIVERED_TTL_SECONDS }` — NO `metadata` field (Landmine 7). |

### Test patterns

| Reference | Why |
|-----------|-----|
| `tests/api/chat-delivery.test.ts:1-180` (header + MockKVNamespace) | MockKV pattern Phase 20's `email-resend.test.ts` extends with mock-`fetch` semantics. The test file is itself the EXTEND target for the wiring tests (D-PA-02 of Plan 19-04 already wires base behaviour; Phase 20 adds the Resend-call assertions). |
| `tests/api/cache-hit-logs.test.ts` | Mocked SSE event fixtures + console.log spy pattern for structured-log assertion. Phase 20's `email-resend.test.ts` uses the same console-spy shape for asserting D-16 event emission. |
| `tests/api/anthropic-payload-shape.test.ts` | Source-text forward-defense pattern. `tests/build/chat-delivery-send-site.test.ts` (optional Phase 20 forward-defense) follows the same shape. |
| `tests/build/wrangler-cron-shape.test.ts` | Source-text guard against unreverted `triggers.crons` — paired with `tests/build/wrangler-dry-run-shape.test.ts` (optional Phase 20 forward-defense) which guards against unreverted `vars.DRY_RUN`. |
| `tests/api/chat-voice-split.test.ts` | `it.each` over fixture rows — Phase 20's `email-render.adversarial.test.ts` adopts the same shape with one row per locked payload class. |
| `scripts/resend-warmup.mjs` | NOT a test, but the wire-shape acceptance reference — `email-resend.test.ts` mock-fetch assertions should match (URL, method, header keys, body field keys) byte-for-byte against this script's authored wire. |

### UAT + DEPLOY-GATE pattern

| Reference | Why |
|-----------|-----|
| `.planning/phases/19-cron-sweep-scheduling-idempotency-dry-run/19-UAT.md` | Numbered manual steps with `wrangler` commands, `expected:` / `result:` blocks, `*****` cron-flip-then-revert pattern. Phase 20's `20-UAT.md` mirrors. |
| `.planning/phases/17-foundations-migration-dns-debt-sweep/DEPLOY-GATE.md` | Operator-confirmed gate; executor-MUST-NOT-push rule; chat-reply audit trail. Phase 20's DEPLOY-GATE.md mirrors. |

---

## Architectural Responsibility Map

Single-tier (server / Cloudflare Worker scheduled handler). No browser tier touched.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rendering email subject + body from `ChatTranscript` | API / Backend (`src/lib/email/render.ts`) | — | Pure data transformation; testable in isolation. |
| HTML-escape + CR/LF strip + bidi strip + null-byte strip | API / Backend (`src/lib/email/render.ts` helpers) | — | Defense-in-depth applied at render time before payload leaves Worker. |
| HTTP POST to Resend REST API | API / Backend (`src/lib/email/resend.ts`) | — | Network I/O via Workers `fetch`; AbortController-bounded. |
| Idempotency-Key threading | API / Backend (`src/lib/email/resend.ts`) | — | Header injection in fetch init. |
| 3-retry backoff for transient failures | API / Backend (`src/lib/chat-delivery.ts retryWithBackoff` reused) | — | Existing pure helper from Phase 19. |
| `delivered:{sid}` write with `resend_message_id` | API / Backend (`src/lib/chat-delivery.ts promoteOne`) | KV (Cloudflare) | Existing Phase 19 site; additive field on the value. |
| `wrangler.jsonc vars.DRY_RUN` flip | Configuration (Wrangler config) | — | Single-line edit; deploy-time toggle. |
| Operator manual UAT (Gmail Inbox check) | Out-of-band (operator + Gmail) | API / Backend (Workers Logs surface) | Manual verification per `20-UAT.md`. |

---

## Standard Stack

### Core (UNCHANGED — phase-wide invariant)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Cloudflare Workers runtime | (platform) | `fetch()`, `AbortController`, `DOMException`, `crypto.randomUUID()`, KV bindings, scheduled handler | Native Workers — zero install. The `fetch` Standard Web API + AbortController are the canonical Workers HTTP-out + cancellation primitives. |
| TypeScript | 5.9.3 | Type checking | Existing; `wrangler types` regenerates `worker-configuration.d.ts` on every `pnpm build`. |
| vitest | 4.x | Test runner | Existing; same pattern as Phase 17/18/19 (`tests/api/*.test.ts` + `tests/build/*.test.ts`). |
| `@anthropic-ai/sdk`, `@astrojs/cloudflare`, `astro`, `dompurify`, `marked`, `tailwindcss`, `zod` | unchanged | Existing | NONE touched by Phase 20. |

### NEW for Phase 20

**ZERO new runtime dependencies.** MAIL-01 lock — `package.json dependencies` byte-identical phase-wide.

| Resource | Source | Notes |
|----------|--------|-------|
| `RESEND_API_KEY` | Wrangler secret (already set Plan 17-06) | Read in wrapper as `env.RESEND_API_KEY`. |
| `CHAT_RECIPIENT_EMAIL` | Wrangler secret (already set Plan 17-02) | Threaded via `DeliveryEnv` to the wrapper for `to` field. |
| `CHAT_SENDER_EMAIL` | Wrangler secret (already set Plan 17-02) | Threaded for `from` field. Value: `"Portfolio Chat" <transcripts@mail.jackcutrara.com>` (Phase 17 D-06 lock). |
| `CHAT_REPLY_TO_EMAIL` | `wrangler.jsonc vars` (already set Phase 19) | Threaded for `reply_to` field. Value: `jackcutrara@gmail.com`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff (why NOT in Phase 20) |
|------------|-----------|--------------------------------|
| Resend REST via `fetch()` | `resend` npm package (v6.12.3 verified on registry as of 2026-05-12) | npm SDK pulls Node deps that the Workers bundler tree-shakes but adds package.json surface. CONTEXT.md MAIL-01 + STATE.md "Out of Scope" both lock REST-only. Verified: warmup script proved REST works. |
| Plaintext-only `text` field | `html` field with full template | HTML rendering of user-typed text is a phishing-into-inbox surface. CONTEXT.md MAIL-02 + STATE.md "Out of Scope" both lock plaintext. v1.4+ re-evaluation only if Jack reports readability friction. |
| Distinct `chat.delivery.idempotency_replay` event | Conflate replays into `chat.delivery.sent` | See § Drift item 1 — the explicit `idempotency_replay: true` body flag is NOT documented; without it the wrapper cannot reliably distinguish a replay from a fresh send unless it's threaded a `prior_message_id`. Recommended: drop the variant. CONTEXT.md D-14 amendment may be needed. |

### Installation

**No installation required.** Verify zero-new-runtime-dep at phase close:

```bash
git diff origin/main..HEAD package.json | grep -E '^\+.*":' | grep -v '\-' | head -20
# Expected: no new lines under "dependencies" — only under "scripts" or none at all
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/lib/email/
├── resend.ts        # NEW — REST wrapper: sendEmail(env, payload) → Result
└── render.ts        # NEW — pure renderer: renderEmail(transcript) → ResendPayload
                     #   (planner may split into render/{subject,body,escape}.ts
                     #    if cohesive file grows past ~250 LOC per Claude's Discretion)
```

### Pattern 1: Pure renderer (composable; testable in isolation)

**What:** `renderEmail(transcript: ChatTranscript): { from, to, reply_to, subject, text, idempotency_key }`. Pure function of `ChatTranscript` — no env reads, no `Date.now()`, no I/O. Testable with literal-fixture transcripts.

**When to use:** Always for email body composition. The purity is what makes Layer 2 idempotency work (Landmine 5/9).

**Example:**

```typescript
// Pattern reference: src/lib/chat-transcripts.ts (pure module shape)
import type { ChatTranscript } from "../chat-transcripts";

const FROM_LITERAL = '"Portfolio Chat" <transcripts@mail.jackcutrara.com>';

export interface ResendPayload {
  from: string;
  to: string;
  reply_to: string;
  subject: string;
  text: string;
  idempotency_key: string;
}

export interface RenderEnv {
  CHAT_RECIPIENT_EMAIL: string;
  CHAT_SENDER_EMAIL: string;
  CHAT_REPLY_TO_EMAIL: string;
}

export function renderEmail(env: RenderEnv, transcript: ChatTranscript): ResendPayload {
  return {
    from: env.CHAT_SENDER_EMAIL,
    to: env.CHAT_RECIPIENT_EMAIL,
    reply_to: env.CHAT_REPLY_TO_EMAIL,
    subject: composeSubject(transcript),
    text: composeBody(transcript),
    idempotency_key: `transcript/${transcript.sid}`,
  };
}
```

### Pattern 2: REST wrapper with AbortController + discriminated Result

**What:** `sendEmail(env, payload): Promise<ResendResult>` where `ResendResult` is a discriminated union of success/transient/terminal variants. Wrapper owns: header injection, AbortController setup, status code parsing, structured log emission.

**When to use:** Always — the discriminated Result is what allows `sendOne` (consumer in `chat-delivery.ts`) to translate result → throw (for retry) vs returned-failure (for skip), without coupling the wrapper to the retry harness.

**Example:**

```typescript
// Pattern reference: scripts/resend-warmup.mjs (wire shape oracle)
//                  + src/lib/chat-delivery.ts:128-149 (existing retry harness)

export type ResendResult =
  | { status: "sent"; message_id: string; attempt: number }
  | { status: "failed_transient"; http_status?: number; error_class?: string; attempt: number }
  | { status: "failed_terminal"; http_status: number; resend_error?: string; attempt: number };

export interface ResendEnv {
  RESEND_API_KEY: string;
}

const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = "jack-cutrara-portfolio/1.0"; // Landmine 4 defense

export async function sendEmail(
  env: ResendEnv,
  payload: ResendPayload,
  attempt = 1, // wrapper is called from inside retryWithBackoff; attempt threaded for log fields
): Promise<ResendResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const { idempotency_key, ...body } = payload;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotency_key,
        "User-Agent": USER_AGENT, // Landmine 4
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (response.ok) {
      const data = await response.json() as { id: string };
      console.log("chat.delivery.sent", {
        sid: extractSidFromIdempotencyKey(idempotency_key),
        resend_message_id: data.id,
        attempt,
      });
      return { status: "sent", message_id: data.id, attempt };
    }

    // Parse error body (best-effort; tolerate malformed JSON)
    let errorClass: string | undefined;
    try {
      const errBody = await response.json() as { name?: string };
      errorClass = errBody.name;
    } catch { /* swallow */ }

    if (response.status === 429 || response.status >= 500) {
      // Transient — caller throws to trigger retryWithBackoff
      console.log("chat.delivery.retry", {
        sid: extractSidFromIdempotencyKey(idempotency_key),
        http_status: response.status,
        attempt,
        backoff_ms: null, // backoff happens in caller's retryWithBackoff; null here
      });
      return { status: "failed_transient", http_status: response.status, error_class: errorClass, attempt };
    }

    // Terminal — caller does NOT retry
    console.error("chat.delivery.failed", {
      sid: extractSidFromIdempotencyKey(idempotency_key),
      http_status: response.status,
      error_class: errorClass ?? "unknown",
      attempt,
    });
    return { status: "failed_terminal", http_status: response.status, resend_error: errorClass, attempt };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // Landmine 1 — DOMException check, not generic Error
      console.log("chat.delivery.retry", {
        sid: extractSidFromIdempotencyKey(payload.idempotency_key),
        http_status: null,
        error_class: "AbortError",
        attempt,
        backoff_ms: null,
      });
      return { status: "failed_transient", error_class: "AbortError", attempt };
    }
    // Network error — also transient
    return { status: "failed_transient", error_class: err instanceof Error ? err.constructor.name : "Error", attempt };
  } finally {
    // Landmine 2 — clearTimeout on every exit path
    clearTimeout(timeoutId);
  }
}
```

### Pattern 3: Substitution wiring in `sendOne`

**What:** `sendOne(env, transcript)` keeps the DRY_RUN=`"1"` branch byte-identical (rollback runway, D-03), substitutes the `throw new Error(...)` line at 183 with: render → call wrapper → translate Result.

**When to use:** Single substitution point in `chat-delivery.ts`.

**Example:**

```typescript
// File: src/lib/chat-delivery.ts (EDIT — replace lines 163-184)

async function sendOne(
  env: DeliveryEnv,
  transcript: ChatTranscript,
): Promise<{ message_id: string }> {  // ← return type widens from void to { message_id }
  if (env.DRY_RUN === "1") {
    // BYTE-IDENTICAL TO PHASE 19 — rollback runway per D-03. Do NOT delete.
    console.log("chat.delivery.dry_run", {
      sid: transcript.sid,
      to: env.CHAT_RECIPIENT_EMAIL ?? null,
      from: env.CHAT_SENDER_EMAIL ?? null,
      reply_to: env.CHAT_REPLY_TO_EMAIL ?? null,
      msg_count: transcript.msg_count,
      truncated: transcript.truncated,
      country: transcript.meta.country ?? null,
      referrer_host: hostnameOrNull(transcript.meta.referrer),
      dry_run: true,
    });
    return { message_id: "dry-run-no-id" }; // sentinel; promoteOne checks dry_run discriminator
  }

  // Phase 20 substitution — Resend wrapper call.
  const payload = renderEmail(env, transcript);
  const result = await sendEmail(env, payload);

  if (result.status === "sent") {
    return { message_id: result.message_id };
  }
  if (result.status === "failed_transient") {
    // Throw so retryWithBackoff catches and retries (per D-13)
    throw new Error(`resend_transient_${result.http_status ?? result.error_class ?? "unknown"}`);
  }
  // failed_terminal — propagate error WITHOUT throwing into retry; promoteOne's catch surfaces it
  // to chat.delivery.failed and returns error status. Use a distinct error class so the catch
  // can distinguish from transient-after-retries.
  throw new Error(`resend_terminal_${result.http_status}`);
  // NOTE: terminal errors also bubble through retryWithBackoff (which doesn't discriminate by
  // error name). 3 attempts will burn for a terminal error — but the FIRST attempt's
  // `failed_terminal` Result already emitted the structured log; subsequent retries will repeat
  // the same failed POST with the same Idempotency-Key (Resend's idempotency check returns the
  // SAME 4xx response). Net cost: 3x log noise on terminal errors. Acceptable at v1.3 scale.
  //
  // ALTERNATIVE: planner may bypass retryWithBackoff for terminal errors by hoisting the
  // Result-translation up to promoteOne (step 3 changes from `await retryWithBackoff(() =>
  // sendOne(...))` to a custom loop that branches on the Result). Adds coupling; not recommended.
}

// promoteOne step-4 PUT (lines 268-281) — additive change:
const value: DeliveredMarker = {
  v: 1,
  sid,
  delivered_at: new Date().toISOString(),
  dry_run: env.DRY_RUN === "1",
  msg_count: transcript.msg_count,
  truncated: transcript.truncated,
  resend_message_id: sendResult.message_id, // ← NEW field (Phase 19 D-09 additive lock)
};
```

**Refinement note (planner action):** The "3x log noise on terminal errors" trade-off above can be eliminated by changing `sendOne`'s return shape to a discriminated result and having `promoteOne` branch on it instead of going through retryWithBackoff. Recommended approach is in CONTEXT.md Claude's Discretion ("Recommended: the Resend wrapper returns a typed Result; sendOne translates Result to a thrown error (when 5xx or 429 — caught by retryWithBackoff and retried) vs a returned `{ status: "failed_terminal" }` (when 4xx-except-429 — propagated up through promoteOne's catch to log + return error status)"). The example above keeps the existing retry harness unchanged for minimum blast radius; a planner may choose the discretion-recommended path if they prefer cleaner terminal-error semantics.

### Anti-Patterns to Avoid

- **Don't** import `resend` npm package — REST via `fetch` is locked (MAIL-01).
- **Don't** add `html` field to the Resend request body — `text` only (MAIL-02).
- **Don't** delete the DRY_RUN=`"1"` branch in `sendOne` as "dead code" — it's the rollback runway (D-03).
- **Don't** echo any visitor-typed content into the metadata header block or pre-conversation area — provenance line is the structural anti-impersonation defense.
- **Don't** add `metadata` field to `kv.put` on `delivered:{sid}` writes — D-11 lock; idempotency cursor is a hint, not a list-surface (Landmine 7).
- **Don't** use `Date.now()` or `crypto.randomUUID()` inside the renderer — non-determinism breaks Idempotency-Key (Landmine 5).
- **Don't** use `new Error("AbortError")` in test mocks for AbortController — must be `DOMException` with `name === "AbortError"` (Landmine 1).
- **Don't** branch on `responseBody.idempotency_replay === true` — flag is undocumented in current Resend corpus (Drift item 1).
- **Don't** add a new event name like `chat.delivery.sent_v2` — extend the D-16 family in place if needed; cardinality minimization is the convention.
- **Don't** create a new module like `src/lib/email/sanitize.ts` separate from `render.ts` — D-07 explicitly REJECTED a universal `sanitizeHeader()` helper. Sanitization lives inline in render.ts at the interpolation point for the four-field interpolation surface.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotent email sending | Bespoke retry-and-track-state-in-KV layer | Resend `Idempotency-Key` header (24h window) + Layer 1 `delivered:{sid}` cursor (Phase 19 lock) | Two-layer defense already designed. Resend handles the cross-system case; KV cursor handles the intra-system case. |
| HTTP retry with backoff | New retry loop | Existing `retryWithBackoff` in `chat-delivery.ts:128-149` | Already implements 3-try full-jitter exponential backoff. Phase 20 reuses unchanged. |
| Fetch timeout | `Promise.race([fetch, sleep])` | `AbortController` with `signal` field on fetch init | `Promise.race` doesn't actually CANCEL the underlying fetch — the connection stays open and consumes subrequest budget. AbortController is the canonical Workers cancellation primitive. |
| HTML escape function | npm `escape-html` package | Inline 5-replacement function (`&` first, then `<`, `>`, `"`, `'`) | Adds 0 bytes to bundle vs ~600 bytes for the npm dep. Phase 20 zero-new-runtime-dep lock (MAIL-01). |
| Email body templating | Mustache / Handlebars / EJS | Template literals (string interpolation) + the `htmlEscape` helper | Templating engines are an XSS surface they DON'T solve (they typically auto-escape but the layer still adds cognitive load). Plaintext body composed via 7 lines + a per-turn loop fits trivially in template literals. |
| Subject sanitization | Universal `sanitizeHeader()` helper | Inline at the 4 interpolation sites (D-07 lock) | D-07 explicitly REJECTED the helper for being heavier-than-needed at the current 4-field surface. |
| Resend response parsing | npm SDK | `await response.json() as { id: string }` (success) or `{ name: string; message: string }` (error) | Two flat shapes; no SDK needed. |
| User-Agent header inference | Read from a `process.env` or detect | Hardcoded `jack-cutrara-portfolio/1.0` literal | Workers has no `process.env`; the User-Agent is a constant identifier (Landmine 4). |

**Key insight:** Phase 20 is structurally a wire-port of `scripts/resend-warmup.mjs` plus a pure-render module plus a discriminated Result type. The hardest engineering work (deliverability, DKIM/SPF/DMARC, domain warming, Idempotency-Key semantics) was completed in Phase 17; Phase 20 inherits a proven wire and adds the per-transcript composition + safety net.

---

## Common Pitfalls

(Synthesized from `.planning/research/PITFALLS.md` Critical 3 / 4 / 5 / 7, Moderate G, Minor β / δ — applied to Phase 20 specifically.)

### Pitfall 1: Renderer non-determinism breaks Idempotency-Key (Landmine 5)

**What goes wrong:** Renderer composes a body containing `new Date().toISOString()` (or some other call-time value). Two retries within 24h produce byte-different bodies; Resend returns 409 ("idempotency conflict"). Send fails terminal even though prior send succeeded.

**Why it happens:** Devs reach for "include rendered-at timestamp in the email" as a UX nicety. The Resend Idempotency-Key contract is silent about this — it only says "same payload returns original response."

**How to avoid:** Renderer is a PURE function of `ChatTranscript`. All timestamps come from `transcript.started_at`, `transcript.last_activity_at`, `messages[i].ts`. Test asserts `renderEmail(t) === renderEmail(t)` byte-equal across two invocations.

**Warning signs:** 409 in `chat.delivery.failed` log; same `transcript/{sid}` Idempotency-Key in Resend dashboard "Sent" log with payload diff.

### Pitfall 2: HTML-escape applied AFTER bidi-strip can be bypassed (Landmine 6)

**What goes wrong:** Adversarial payload combines null-byte + bidi-override + script-tag in a way that escape ordering matters: `<\u202E\0script>`. If null-byte strip runs after escape, the entity stream can be spliced.

**Why it happens:** Sanitization-vs-encoding ordering is subtle. "Defense in depth" implies multiple layers but the LAYERS MUST RUN IN ORDER (sanitize first, encode last).

**How to avoid:** Strict ordering: (1) strip control chars including null bytes, (2) strip CR/LF (subject only), (3) strip bidi overrides, (4) HTML-escape. Asserted by adversarial test.

**Warning signs:** Adversarial test fails on combined payload; output contains a stray `\0` byte or `\u202E` codepoint.

### Pitfall 3: Cron wall-clock cap is 15 MIN, not 30s (Landmine 8)

**What goes wrong:** CONTEXT.md D-15 conflates CPU and wall-clock budgets. Future contributor adds a global timeout / batch-abort at 30s; per-session try/catch isolation breaks; backlog grows.

**Why it happens:** Workers limits are nuanced (CPU ≠ wall, and varies by invocation type + cron interval).

**How to avoid:** No code change in Phase 20. Planner notes the reconciliation in PLAN-2X.

**Warning signs:** Future PR introduces `setTimeout(() => abortBatch(), 30000)` at the `deliverDue` top.

### Pitfall 4: Forgetting User-Agent → 403 with code 1010 (Landmine 4)

**What goes wrong:** `scripts/resend-warmup.mjs` worked from Node without User-Agent; Workers runtime presents a different default. Resend returns 403 code 1010 in production after deploy.

**Why it happens:** Wire shape was validated from Node, not Workers.

**How to avoid:** Set `User-Agent: jack-cutrara-portfolio/1.0` (or similar) explicitly. Defensive 5-second add.

**Warning signs:** Production `chat.delivery.failed` with `http_status: 403` + `error_class` containing "1010".

### Pitfall 5: Eventual-consistency skew makes Layer 2 load-bearing (Architecture § Pitfall 2 echo)

**What goes wrong:** KV is eventually consistent. Cron at POP A reads `live:{sid}` from POP B's recent write that hasn't propagated. Two crons (one at A, one at B) both see the live key as not-yet-delivered, both POST to Resend.

**Why it happens:** Documented KV behavior (writes propagate up to 60s globally).

**How to avoid:** Layer 2 (Idempotency-Key) covers this. Resend dedupes within 24h. The `delivered:{sid}` cursor is the optimization (skip the POST when possible); the Idempotency-Key is the safety net.

**Warning signs:** Two `chat.delivery.sent` logs with the same `sid`; if the wrapper had the (undocumented) `idempotency_replay: true` flag we could distinguish, but per Drift item 1 we cannot — relevant only as a known invisible failure mode at v1.3 scale (rare cron concurrency).

### Pitfall 6: Operator forgets to revert UAT cron flip (Phase 19 carryover)

**What goes wrong:** UAT Step 2 flips `triggers.crons` to `["* * * * *"]` for Past-Events verification. Step 4 reverts to `["0 * * * *"]`. If operator forgets Step 4, cron fires every minute → 1440 ticks/day instead of 24, burns CPU + Resend rate-limit + log volume.

**Why it happens:** Manual operator process; checklist drift.

**How to avoid:** `tests/build/wrangler-cron-shape.test.ts` (already in place from Phase 19) catches the unreverted state on next CI run. Phase 20 may add `tests/build/wrangler-dry-run-shape.test.ts` (optional) for an additional source-text check.

**Warning signs:** Workers Logs show `chat.delivery.tick` every minute for >5 min after UAT step 2; CPU usage spikes in Worker analytics.

---

## Code Examples

### Example 1: HTML escape helper (inline; zero deps)

```typescript
// Pattern reference: src/lib/chat-transcripts.ts:98-101 (truncate helper)
// Applied per Landmine 6 ordering: input sanitization (strip) BEFORE output encoding (escape)

function stripControlChars(s: string): string {
  // Strip null bytes + other C0 control chars EXCEPT \t \n \r (which are allowed in text bodies;
  // \r removed separately for subject by stripCrLf below)
  return s.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
}

function stripCrLf(s: string): string {
  // Subject-only: strip CR/LF entirely (header injection defense)
  return s.replace(/[\r\n]/g, "");
}

function stripBidiOverrides(s: string): string {
  // U+202A..U+202E (LRE/RLE/PDF/LRO/RLO) + U+2066..U+2069 (LRI/RLI/FSI/PDI)
  return s.replace(/[\u202A-\u202E\u2066-\u2069]/g, "");
}

function htmlEscape(s: string): string {
  // & MUST come first to avoid double-encoding
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Composition for body fields (visitor content, bot content, referrer, user-agent, country):
function escapeBodyField(raw: string | null): string {
  if (raw == null) return "";
  return htmlEscape(stripBidiOverrides(stripControlChars(raw)));
}

// Composition for subject components (country, referrer-host):
function escapeSubjectComponent(raw: string | null): string {
  if (raw == null) return "";
  return htmlEscape(stripCrLf(stripBidiOverrides(stripControlChars(raw))));
}
```

### Example 2: Subject derivation (D-05/D-06/D-07/D-08)

```typescript
const COUNTRY_PATTERN = /^[A-Z]{2}$/;
const HOST_PATTERN = /^[a-z0-9.-]+$/;

function deriveCountryToken(country: string | null): string {
  if (country && COUNTRY_PATTERN.test(country)) return country;
  return "unknown"; // D-05
}

function deriveReferrerHostToken(referrer: string | null): string {
  if (!referrer) return "direct"; // D-06
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "direct"; // D-06 fallback on malformed URL
  }
  if (!HOST_PATTERN.test(host)) return "direct"; // D-07 strict charset enforcement
  return host;
}

function composeSubject(transcript: ChatTranscript): string {
  const country = deriveCountryToken(transcript.meta.country);
  const referrerHost = deriveReferrerHostToken(transcript.meta.referrer);
  const truncatedSuffix = transcript.truncated ? " (truncated)" : ""; // D-08
  // Note: country + referrerHost already pass strict regex — no further escape needed.
  // CR/LF strip is defensive belt; would be a no-op for regex-validated tokens.
  return `[Portfolio chat] ${transcript.msg_count} turns from ${country} via ${referrerHost}${truncatedSuffix}`;
}
```

### Example 3: Cache aggregate one-liner (D-09/D-10)

```typescript
function deriveCacheLine(transcript: ChatTranscript): string {
  const assistantTurns = transcript.messages.filter(m => m.role === "assistant");
  const total = assistantTurns.length;
  const hits = assistantTurns.filter(m => (m.cache_read_input_tokens ?? 0) > 0).length;
  const totalRead = assistantTurns.reduce((sum, m) => sum + (m.cache_read_input_tokens ?? 0), 0);
  const totalCreated = assistantTurns.reduce((sum, m) => sum + (m.cache_creation_input_tokens ?? 0), 0);
  // Number.toLocaleString("en-US") works in Workers without external locale data
  return `${hits}/${total} turns hit, ${totalRead.toLocaleString("en-US")} read / ${totalCreated.toLocaleString("en-US")} created`;
}
```

### Example 4: Body composition (D-11/D-12)

```typescript
const LABEL_WIDTH = 12; // Padded label column suggested in D-11; planner may tune
const PROVENANCE = "From: chat widget on jackcutrara.com — visitor message follows below this line.";

function pad(label: string): string {
  return label.padEnd(LABEL_WIDTH);
}

function composeBody(transcript: ChatTranscript): string {
  const meta = transcript.meta;
  const startMs = Date.parse(transcript.started_at);
  const lastMs = Date.parse(transcript.last_activity_at);
  const durationMs = Math.max(0, lastMs - startMs);
  const durationLabel = formatDuration(durationMs); // helper: "8m 34s" etc.

  const headerLines = [
    `${pad("Session:")}${escapeBodyField(transcript.sid)}`,
    `${pad("Started:")}${transcript.started_at}`,
    `${pad("Last turn:")}${transcript.last_activity_at} (${durationLabel})`,
    `${pad("From:")}${escapeBodyField(meta.country)}${meta.region ? " · " + escapeBodyField(meta.region) : ""}`,
    `${pad("Referrer:")}${escapeBodyField(meta.referrer)}`,
    `${pad("User-agent:")}${escapeBodyField(meta.user_agent)}`,
    `${pad("Messages:")}${transcript.msg_count} turns`,
    `${pad("Cache:")}${deriveCacheLine(transcript)}`,
  ];

  const turnLines = transcript.messages.flatMap(m => [
    m.role === "user" ? ">>> visitor:" : "<<< bot:",
    escapeBodyField(m.content),
    "", // blank line between turns
  ]);

  return [
    ...headerLines,
    "",            // blank line between header and provenance
    PROVENANCE,
    "",            // blank line between provenance and turns
    ...turnLines,
  ].join("\n").trimEnd() + "\n";  // trailing newline; trim trailing blank lines
}
```

### Example 5: Adversarial test row shape (MAIL-05)

```typescript
// File: tests/api/email-render.adversarial.test.ts
// Pattern reference: tests/api/chat-voice-split.test.ts (it.each over fixture rows)

import { describe, it, expect } from "vitest";
import { renderEmail } from "../../src/lib/email/render";
import type { ChatTranscript } from "../../src/lib/chat-transcripts";

const ENV = {
  CHAT_RECIPIENT_EMAIL: "jackcutrara@gmail.com",
  CHAT_SENDER_EMAIL: '"Portfolio Chat" <transcripts@mail.jackcutrara.com>',
  CHAT_REPLY_TO_EMAIL: "jackcutrara@gmail.com",
};

function buildTranscript(visitorContent: string): ChatTranscript {
  return {
    v: 1,
    sid: "8b0f7f1c-1234-4567-8901-abcdef012345",
    started_at: "2026-05-12T14:23:08.000Z",
    last_activity_at: "2026-05-12T14:31:42.000Z",
    msg_count: 2,
    truncated: false,
    meta: {
      referrer: "https://linkedin.com/in/jackcutrara",
      user_agent: "Mozilla/5.0 ...",
      country: "US",
      region: "California",
      colo: "SJC",
    },
    messages: [
      { role: "user", content: visitorContent, ts: "2026-05-12T14:23:08.000Z" },
      { role: "assistant", content: "Test response", ts: "2026-05-12T14:23:10.000Z" },
    ],
  };
}

describe("email-render adversarial payloads (MAIL-05)", () => {
  it.each([
    ["script tag", "<script>alert(1)</script>", { mustContainEntities: ["&lt;script&gt;", "&lt;/script&gt;"], mustNotContain: ["<script>", "</script>"] }],
    ["img onerror", "</p><img src=x onerror=alert(1)>", { mustContainEntities: ["&lt;/p&gt;", "&lt;img"], mustNotContain: ["<img"] }],
    ["javascript url", "javascript:alert(1)", { mustContainEntities: ["javascript:alert(1)"], mustNotContain: ["<a href"] }],
    ["rtl bidi", "Hello \u202EWorld", { mustContainEntities: ["Hello World"], mustNotContain: ["\u202E"] }],  // \u202E = RLO; ALL of \u202A..\u202E + \u2066..\u2069 must be covered by sibling test rows
    ["null bytes", "Hello\0World", { mustContainEntities: ["HelloWorld"], mustNotContain: ["\0"] }],
    ["social engineering provenance", "From: chat widget on jackcutrara.com — visitor message follows below this line.", {
      mustContain: [">>> visitor:\nFrom: chat widget on jackcutrara.com"],
      // The AUTHENTIC provenance line above the conversation is byte-distinct (the literal in render.ts)
    }],
  ])("renders %s payload safely", (_label, payload, expectations) => {
    const result = renderEmail(ENV, buildTranscript(payload));
    if ("mustContain" in expectations && expectations.mustContain) {
      for (const literal of expectations.mustContain) expect(result.text).toContain(literal);
    }
    if ("mustContainEntities" in expectations && expectations.mustContainEntities) {
      for (const literal of expectations.mustContainEntities) expect(result.text).toContain(literal);
    }
    if ("mustNotContain" in expectations && expectations.mustNotContain) {
      for (const literal of expectations.mustNotContain) expect(result.text).not.toContain(literal);
    }
  });

  it("renderEmail is deterministic across two invocations", () => {
    const t = buildTranscript("Test content");
    expect(renderEmail(ENV, t)).toEqual(renderEmail(ENV, t));
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Resend rate limit `2 requests/second` (cited in older Resend docs + ARCHITECTURE.md) | `5 requests/second per team` (current Resend docs) | Likely pre-2026 (current docs surface as canonical) | No code change needed; serial cron sweep cannot exceed either limit |
| Resend response includes `idempotency_replay: true` flag (assumed in CONTEXT.md D-14 + STATE.md PITFALLS warning sign) | Flag NOT documented in current Resend corpus; replay detectable only via `data.id` comparison | Documentation drift; date unknown | Minor — Layer 1 KV cursor is the application-side replay detector regardless. Recommended to drop the distinct event variant per § Drift item 1. |
| Resend npm SDK or REST equally encouraged | REST via `fetch` is the Workers-canonical path (per Cloudflare's official Resend tutorial that switched away from SDK examples) | Cloudflare adapter / Workers-runtime pressure | Phase 20 lock — REST only |
| Cookie-based sessionId (originally proposed in `.planning/research/ARCHITECTURE.md`) | Client-minted UUIDv4 in localStorage, threaded as request body field | Phase 18 IDENT-01/02 | Already shipped; Phase 20 reads `transcript.sid` as the Idempotency-Key entity-id |

**Deprecated/outdated:**

- Original ARCHITECTURE.md table at line 161 showed "envelope log shape" for Phase 19 with `triggers.crons: ["0 * * * *"]` listed under Phase 18 — Phase 18 actually shipped with `triggers.crons: []` (Plan 19-01 added the binding; Plan 19-04 flipped the value). Phase 20 inherits the live cron.
- ARCHITECTURE.md line 432 mentions a "user returns after delivery → 409 conflict — need to mutate the idempotency-key on each delivery" edge case. With Phase 18's UUIDv4 sessionId minted client-side per-storage-version + Phase 19's `delivered:{sid}` 24h TTL alignment with Resend's 24h Idempotency-Key window, this edge case is structurally resolved (the same sid implies the same cursor → application-level skip; a NEW sid implies a new Idempotency-Key → no Resend conflict). No mid-key-mutation needed.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Resend's `idempotency_replay: true` body flag is undocumented in current corpus and likely absent (CONTEXT.md D-14 over-assumes) | Drift §1 + Landmine 3 | If the flag IS still in the response, Option A drops a useful distinction; only cost is grep-distinguishability of replay vs first-send in Workers Logs. Layer 1 KV cursor still prevents the duplicate POST in the common case. Mitigation: planner emits a sub-decision (D-17) or asks user during discuss-phase. |
| A2 | Workers Paid plan is active for this project (cron + KV are usable; subrequest cap is 1,000) | Workers Runtime § + Don't Hand-Roll | If the project is on Free plan, cron triggers wouldn't have shipped in Phase 19 — verified by Phase 19 close. Risk: low. |
| A3 | Setting User-Agent header defensively prevents the documented 403/1010 failure mode in the Workers runtime | Landmine 4 + Code Example 2 | If User-Agent is irrelevant in Workers, the defensive set adds 0 cost. If it's load-bearing and we don't set it, prod fails at first cron tick after DRY_RUN flip — UAT Step 3 would catch. |
| A4 | DOMException constructor is available in vitest's jsdom environment for test mocks | Landmine 1 | If unavailable, mocks fall back to `Object.assign(new Error("aborted"), { name: "AbortError" })` which still satisfies the `err.name === "AbortError"` predicate but fails the `err instanceof DOMException` check. Wrapper code MUST OR-condition: `if ((err instanceof DOMException && err.name === "AbortError") || (err instanceof Error && err.name === "AbortError"))`. Recommended: use the OR shape to be mock-friendly. |
| A5 | `Number.toLocaleString("en-US")` works in Workers runtime without external locale data | Code Example 3 | Workers V8 has built-in en-US locale support per docs; risk near-zero. |
| A6 | The 4-event D-16 family (sent / failed / retry / idempotency_replay) collapses to 3 (sent / failed / retry) per Drift item 1 — no operational visibility lost because Layer 1 cursor handles the typical replay case | Drift §1 | If user wants the distinct event for forward-compat, retain the variant + thread `prior_message_id` through (Option B). Risk is scope creep, not functional regression. |
| A7 | `it.each` over adversarial payload classes adequately covers the MAIL-05 surface; no need for snapshot tests against MIME bytes | Validation Architecture § + Code Example 5 | Adversarial payload coverage at v1.3 scale is "literal-text rendering preserved + injection vectors stripped/encoded." Snapshot tests over rendered MIME would add depth but at 6-8 row × 2-3 assertions each, the structural coverage suffices. |

---

## Open Questions

1. **Should the Resend wrapper drop the distinct `replayed` Result variant per § Drift item 1 (Option A) or keep it via threaded `prior_message_id` (Option B)?**
   - What we know: Resend's current docs do NOT document an explicit `idempotency_replay: true` body flag. Replay is detectable only via `data.id` comparison.
   - What's unclear: Whether the user wants Phase 20 to ship a 4-event log family (per CONTEXT.md D-16) or accept a 3-event family with explicit doc drift acknowledgement.
   - Recommendation: Adopt Option A (drop variant; emit Phase 20 sub-decision D-17 acknowledging drift). Lowest blast radius; preserves Layer 1 cursor as the load-bearing replay detector. Discuss-phase or planner-time sub-decision.

2. **Does the planner add the optional `tests/build/chat-delivery-send-site.test.ts` + `tests/build/wrangler-dry-run-shape.test.ts` source-text guards (Claude's Discretion items)?**
   - What we know: Plan 17-09 / Plan 18-07 / Plan 19-04 all added equivalent guards for their respective canonical surfaces.
   - What's unclear: Whether the cost (~30 LOC × 2 files; ~5 min author + maintain) is justified at v1.3 close.
   - Recommendation: Add both. Cheap forward-defense; matches the Phase 17/18/19 pattern; catches the operator-forgot-to-revert-cron-flip and dev-mistakenly-removed-rollback-runway failure modes.

3. **What is the operational cap on the `20-UAT.md` Step 6 organic-real-traffic wait window?**
   - What we know: Step 6 is gated on visitor traffic; could take days at low site traffic.
   - What's unclear: Whether milestone closes at Steps 1-5 (proven via seed-then-cron) + manual `scripts/resend-warmup.mjs` re-execution as Step 6 proxy, or whether Step 6 must wait for an organic visitor.
   - Recommendation: Set a 7-day soft cap (per CONTEXT.md Claude's Discretion). After 7 days with no organic visitor, milestone closes on Steps 1-5 + warmup-script re-execution. Document as `20-UAT.md` Step 6 acceptance criterion.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Cloudflare Workers runtime (cron + KV + fetch) | All Phase 20 code paths | ✓ (Paid plan, verified by Phase 19 cron close) | n/a | none — required |
| Wrangler CLI | UAT (`wrangler kv key put`, `wrangler deploy`, `wrangler tail`) | ✓ | 4.83.0 (per package.json devDependencies) | none — required |
| `RESEND_API_KEY` Wrangler secret | `sendEmail` wrapper | ✓ (set Plan 17-06) | n/a | none — UAT will fail without it |
| `CHAT_SENDER_EMAIL` Wrangler secret | renderer | ✓ (set Plan 17-02) | `"Portfolio Chat" <transcripts@mail.jackcutrara.com>` | none — required |
| `CHAT_RECIPIENT_EMAIL` Wrangler secret | renderer | ✓ (set Plan 17-02) | `jackcutrara@gmail.com` | none — required |
| `CHAT_REPLY_TO_EMAIL` wrangler.jsonc var | renderer | ✓ (set Phase 19) | `jackcutrara@gmail.com` | optional in DeliveryEnv; logs null if unset (per Phase 19 WR-02) |
| `mail.jackcutrara.com` Resend sending domain (DKIM/SPF/MX/DMARC) | Production sends | ✓ (verified Plan 17-06; 5/5 Inbox warmup) | live | none — required |
| Resend Postmaster Tools enrollment | Deliverability monitoring (post-launch) | ✓ (enrolled Plan 17-06) | data lag 24-48h post-volume | optional — observability only |
| vitest 4.x | All tests | ✓ | 4.1.0 (per package.json) | none — required |
| `node >= 22` | Test execution + build | ✓ (per package.json engines) | n/a | none — required |
| Internet access from Workers to api.resend.com | Production sends | ✓ (proven by warmup) | n/a | none — required |
| Internet access from local dev to api.resend.com | Optional — dev integration test | ✓ | n/a | n/a — no Wave 0 plan exercises this |

**Missing dependencies with no fallback:** none.

**Missing dependencies with fallback:** none.

---

## Sources

### Primary (HIGH confidence)

- **Context7 `/websites/resend`** [VERIFIED 2026-05-12] — fetched: POST /emails request shape, Idempotency-Key header semantics (256 chars, 24h, `<event-type>/<entity-id>` recommended format), error handling table with 400/401/403/409/422/429/5xx classes, retry strategy guidance, rate limit (5 req/sec/team), 403/1010 User-Agent KB article, idempotency conflict (409) semantics
- **Context7 `/websites/developers_cloudflare_workers`** [VERIFIED 2026-05-12] — fetched: `scheduled(controller, env, ctx)` handler signature, AbortController + scheduler.wait() + DOMException pattern, fetch() POST + JSON body shape, wall-time limits by invocation type (cron <1h = 30s CPU; cron ≥1h = 15min CPU; 15min wall), subrequest limits (50 Free / 1000 Paid), `response.body.cancel()` pattern
- **`scripts/resend-warmup.mjs:41-64`** [VERIFIED in repo, Plan 17-06 commit `0b9d5c5`] — wire-shape oracle proven 5/5 Inbox at Plan 17-06
- **`src/lib/chat-delivery.ts`** [VERIFIED in repo, Plan 19-02 close] — substitution target file, locked constants, `retryWithBackoff` reuse, `DeliveredMarker` interface, `promoteOne` flow
- **`src/lib/chat-transcripts.ts`** [VERIFIED in repo, Plan 18-02 close] — `ChatTranscript` + `KVMetadata` types consumed read-only by renderer
- **`wrangler.jsonc`** [VERIFIED in repo] — DRY_RUN flip target; current `vars.DRY_RUN === "1"`

### Secondary (MEDIUM confidence — research artifacts authored 2026-05-09)

- `.planning/research/ARCHITECTURE.md` lines 88-94, 287-298, 391, 538 — Layer 1 + Layer 2 idempotency design (cited; CONTEXT.md D-14 derives from line 391 which itself encodes the assumption A1)
- `.planning/research/PITFALLS.md` Critical 3 / 4 / 5 / 7, Moderate G, Minor β / δ — pitfall catalog (synthesized into Common Pitfalls §; rate-limit β line cites old 2/sec figure — see Drift §2)
- `.planning/research/STACK.md` lines 38, 41, 42 — Resend REST + Wrangler secrets + DNS verified
- `.planning/research/SUMMARY.md` lines 177-187 — Phase 20 rationale

### Tertiary (LOW confidence — needs validation)

- WebFetch `https://resend.com/docs/dashboard/emails/idempotency-keys` — confirmed absence of explicit `idempotency_replay` flag in body or response headers (the basis of Drift §1 / Landmine 3 / Open Question 1). Single source — recommend re-validation if user objects to Option A.

---

## Metadata

**Confidence breakdown:**
- Standard stack — HIGH — wire-shape oracle (warmup script) + Context7 verification + zero-new-runtime-dep lock
- Architecture — HIGH — pure-module + discriminated Result patterns directly mirror Phase 18/19 precedent
- Pitfalls / Landmines — HIGH for the 10 enumerated landmines (each grounded in a concrete docs-verified or repo-verified observation); MEDIUM-LOW for landmine 3's mitigation (Option A vs B) depending on user preference
- Validation Architecture — HIGH — vitest patterns + mocked-fetch shape match existing tests/api/* conventions
- Resend `idempotency_replay` flag semantics — MEDIUM-LOW — documentation drift; needs user-side decision before lock

**Research date:** 2026-05-12
**Valid until:** 2026-06-11 (30 days for stable Phase 20 scope; 7 days for Drift item 1's `idempotency_replay` flag observation given Resend's frequent doc updates)

---

*Phase: 20-email-render-resend-integration*
*Researcher: gsd-researcher*
