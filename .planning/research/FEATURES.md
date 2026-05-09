# Feature Research — v1.3 Chat Visibility

**Domain:** Conversation logging + per-session inactivity-triggered email delivery for a personal portfolio chat widget
**Researched:** 2026-05-09
**Confidence:** HIGH (Cloudflare KV / Cron / Resend mechanics — official docs); HIGH (chat-transcript email patterns — multiple vendor sources agree); MEDIUM (sessionId edge cases — synthesized from web platform docs + audit of current `chat.ts`)

---

## Scope Reminder

v1.3 is a **subsequent milestone** layered on the shipped v1.2 chat widget. The widget already has: SSE streaming, Claude Haiku, prompt caching, localStorage persistence (50-msg cap, 24h TTL), rate limiting, full Phase 7 security posture. What is **net-new** in v1.3:

1. **Persistence** — write each turn to Cloudflare KV (no current server-side write path)
2. **Identity** — generate + propagate a `sessionId` (no current concept of session identity beyond per-request)
3. **Delivery** — Resend integration sending one email per ended session
4. **Scheduling** — Cloudflare Cron Trigger scanning KV hourly for inactive sessions
5. **Posture** — silent (no UI disclosure), Jack-as-only-reader, no aggregation/admin UI
6. **Tech-debt sweep** — 5 carry-forwards from Phase 7/14/16 (rate-limiter binding, cache-hit observability, `build:chat-context:check` CI, WR-01 listener dedup, `#chat-panel` display contract)

Features already shipped (markdown rendering, DOMPurify, focus trap, CORS, 5/60s rate-limit code path, 30s timeout, localStorage chat history, truncation observability, Umami events) are **not re-researched** — they are referenced as inputs/constraints.

---

## Anchor Constraint (Re-state Before Anything Else)

**Jack reads every email in entirety. There is no aggregation, no search, no admin UI, no dashboard, no "recruiter intent detection," no NLP summarization.** This eliminates an entire class of features that would be table stakes in a SaaS chat-transcript product. Treat this as a hard ceiling on scope creep — every feature below was evaluated against "does Jack reading 10–50 emails/week need this?"

---

## Categories

Features are organized into five non-overlapping categories. Cross-references in the Dependencies section.

| # | Category | What It Covers |
|---|----------|----------------|
| A | **Persistence** | Writing, reading, expiring transcripts in KV |
| B | **Identity & Lifecycle** | sessionId generation, propagation, "session ended" detection |
| C | **Metadata Capture** | What we record alongside the message stream (referrer, UA, country, timestamps) |
| D | **Delivery** | Resend email — envelope, body, formatting, idempotency, retries |
| E | **Scheduling & Reliability** | Cron Trigger, idempotency on the worker side, failure modes |
| F | **Tech Debt Sweep** | Five carry-forwards bundled into v1.3 |

---

## A. Persistence (Cloudflare KV)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| KV namespace bound to Worker | Required to read/write at all | S | Bind in `wrangler.toml`, e.g. `CHAT_TRANSCRIPTS`. Local dev uses `--local` flag for KV simulation. |
| Per-turn append on assistant completion | Must capture both sides of conversation in arrival order | M | Server already terminates SSE — append `{role:'user', text, ts}` and `{role:'bot', text, ts}` after the stream completes successfully. Append on error too (with `error: true` flag) so partial conversations are not lost. |
| sessionId-keyed write | One transcript per visit, not one per message | S | Key shape `transcript:{sessionId}` recommended. Prefix enables `list({prefix:'transcript:'})` for the cron sweep. |
| `expirationTtl` on every write | Prevent KV bloat from abandoned sessions and post-email cleanup | S | Cloudflare KV minimum is 60s. Recommended: write with TTL = 7 days. After successful email delivery, **rewrite key with shorter TTL** (e.g. 24h) rather than `delete()` — keeps a brief audit window and avoids race with in-flight Cron retries. |
| `last_activity_at` updated every turn | Required for the 2-hour inactivity rule | S | Update inline with the append; store as ISO 8601 string for human-readable debugging. |
| Bounded transcript size | Single user can otherwise exhaust KV value limit (25 MiB) and Resend body limits | M | Cap at e.g. 100 turns or 50KB serialized. On overflow, write a `truncated_at` marker and stop appending content (still update `last_activity_at`). Email body documents truncation. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Schema versioning (`schema_version: 1`) | Future-proofs reads if format changes | S | Pattern matches existing `chat-history` localStorage versioning (chat.ts:62). Trivial cost, high optionality. |
| KV `metadata` field for hot fields | List-only sweep can read `last_activity_at` without `get()` per key (KV docs explicitly recommend this) | S | Store `{last_activity_at, started_at, sent: false}` in metadata. Cron loop reads only `list({prefix})` — no per-key fetch unless ready to email. Order-of-magnitude fewer KV reads. |
| Compact storage shape | Smaller writes = lower cost + faster reads | S | Store messages as `[{r:'u', t:'...', a:1715250000}, ...]` (single-letter keys). Cosmetic but free. |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Use D1 (SQL) instead of KV | "Real database" feels more correct | No aggregation/search needed; D1 is overkill, adds migrations, adds a binding | KV is the right primitive for this access pattern |
| Per-message KV writes (one key per turn) | Granular | KV `list()` cost balloons; reconstruction requires sort | Single key per session, replace-on-write |
| Write to KV from the browser | "Skip the server roundtrip" | Cannot enforce auth, content security, or PII redaction; exposes binding | Server-side append in `/api/chat` after stream completes |
| Server-side encryption-at-rest with custom key | Sounds responsible | KV is already encrypted at rest; adds key-management burden with no threat model justification | Trust Cloudflare's at-rest encryption; document the choice |

---

## B. Identity & Lifecycle (sessionId)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Client-generated `sessionId` | No current concept exists in `chat.ts`; must be added | S | Use `crypto.randomUUID()` (HTTPS-secure-context only — site is already HTTPS). RFC-4122 v4. Generate **once on first message send**, not on widget mount, to avoid empty-session keys. |
| Persist `sessionId` in localStorage alongside existing `chat-history` | Survive page navigations within the same browser session | S | Extend existing `ChatStorage` interface. Bump `STORAGE_VERSION` from 1 → 2 (existing version-check logic at `chat.ts:91` will auto-clear stale entries). |
| Send `sessionId` in `/api/chat` request body | Server needs it to key KV writes | S | Add to existing JSON request body. Add to `validateRequest()` schema (`src/lib/validation.ts`). UUIDv4 regex check is sufficient — reject malformed strings as 400. |
| sessionId reuse across turns | Single conversation = single transcript | S | Falls out of "persist in localStorage" |
| New sessionId on TTL expiry / clear | Don't graft yesterday's session onto today's new conversation | S | Existing 24h localStorage TTL logic (`chat.ts:96`) already handles this. When `loadChatHistory()` returns `null`, sessionId is also regenerated on next send. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| `crypto.getRandomValues()` fallback | `crypto.randomUUID()` requires modern browser + secure context (Chrome 92+) | S | Site is HTTPS-only and analytics already gates on modern browsers; fallback is defensive but cheap. Generate v4 manually from 16 random bytes. |
| Server-side sessionId validation (UUID v4 regex) | Rejects malformed/fabricated IDs before they hit KV | S | One-line zod refinement. Prevents key-injection (e.g. `transcript:foo/../bar`). |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Server-issued sessionId via cookie | "More secure" | Adds Set-Cookie surface, breaks the cookie-free analytics promise (Phase 15 commitment), creates GDPR considerations | Client-generated UUIDv4 in localStorage — no cookie, same uniqueness guarantee |
| Session continuation across devices | "Power-user" | No login surface; no value for Jack's read-only use case; would require server-side identity | Per-device session is correct |
| Multi-tab single-session merge | "Avoid duplicate emails for one person" | Unsolvable cleanly without a shared SharedWorker / BroadcastChannel; tabs in same browser **already** share localStorage so this is largely free; cross-browser-window-same-person is rare and benign | Accept that two browsers = two sessions = two emails. Document in PITFALLS. |
| Detect "session ended" via beacon/visibilitychange | Avoid 2-hour delay | Unreliable — Safari often skips `unload`, `pagehide` fires on tab-discard; would create false positives | 2-hour inactivity threshold is the simple, correct primitive |

### Edge Cases (sessionId handling)

| Scenario | Behavior | Rationale |
|----------|----------|-----------|
| Two tabs open simultaneously, same browser | Single sessionId via shared localStorage; both tabs append to same transcript | localStorage is shared per-origin per-browser. `storage` event can sync UI but messages routing to one transcript is correct. |
| User opens widget, types nothing, closes tab | No KV write happens | sessionId only generated on first send → no orphan transcripts |
| User refreshes page mid-conversation | Same sessionId loaded from localStorage; conversation continues in same KV record | Falls out of localStorage persistence |
| User clears localStorage between turns | Next message generates new sessionId; original transcript orphaned, eventually expires via 7d TTL | Tolerable; cron sweep can email partial transcript at 2h-of-no-activity threshold |
| User abandons mid-stream (closes tab while bot streaming) | Server still completes stream and writes both turns IF `ctx.waitUntil()` keeps the worker alive past the disconnect; OR last user turn captured but no bot reply | Use `ctx.waitUntil()` to attempt completion. If bot reply truncates, write what was generated with `truncated:true` flag. |
| sessionId collision (UUIDv4) | Astronomically unlikely (~1 in 2^122) | Documented; not engineered against |
| Malformed sessionId in request | Server rejects 400 before any KV interaction | UUIDv4 regex in validation layer |
| User sends 1000 messages in one session | Capped at e.g. 100 turns or 50KB; later turns metadata-only | KV value limit is 25 MiB but Resend has its own body limit; cap conservatively |

---

## C. Metadata Capture

### Table Stakes

| Field | Source | Why Captured | Complexity |
|-------|--------|--------------|------------|
| `started_at` | Set on first KV write | Email subject context ("conversation started 2h ago") | S |
| `last_activity_at` | Updated each turn | Required for 2h inactivity gate | S |
| `referrer` | `request.headers.get('Referer')` on first turn | Did they come from LinkedIn / GitHub / direct? Highest-signal recruiter context. | S |
| `user_agent` | `request.headers.get('User-Agent')` on first turn | Mobile vs desktop, browser — useful but secondary | S |
| `country` | `request.cf?.country` (Cloudflare-injected) | Cheap geographic context; helpful for filtering noise | S |
| `message_count` | `messages.length` | Email subject summary | S |
| `truncated` | Boolean from existing Phase 14 truncation observability | Surfaces hit max_tokens vs natural completion | S |

### Differentiators

| Field | Value Proposition | Complexity |
|-------|-------------------|------------|
| `cf.city` / `cf.region` | Finer geo than country alone, free from Cloudflare | S |
| `cf.colo` (Cloudflare datacenter) | Latency debugging when an email is suspiciously slow | S |
| `cache_read_input_tokens` / `cache_creation_input_tokens` per turn | Hits the v1.2 Phase 14 cache-hit observability tech debt at the same time | M |
| `entry_path` | Did they land on `/projects/foo` and chat there, or `/`? | S |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Capture full IP address | "Useful for fraud" | PII; cookie-free analytics commitment broken; not actionable for read-only use case | Cloudflare-derived country/region is sufficient |
| Fingerprinting (canvas, fonts, etc.) | "Identify repeat visitors" | Privacy hostile; complex; no value | Don't |
| Captured analytics events from Umami | "Cross-reference with chat" | Umami is opaque-by-design (no per-user attribution); requires cookies/IDs to join | Keep them parallel; reference Umami dashboard separately |
| Capturing chat-context cache key | "Detect when knowledge base changed mid-session" | Already covered by `cache_read_input_tokens=0` indicator | Don't double-record |

### Edge Cases (metadata)

| Scenario | Behavior |
|----------|----------|
| Referrer header absent (privacy mode, direct nav) | Store `null`; email shows "(direct / unknown)" |
| User-Agent spoofed | Stored as-is; not validated |
| `cf` object missing in local dev | Default to `country: 'XX'`, `city: null` — wrap reads in optional chain |
| First-turn metadata vs subsequent-turn drift | Lock first-turn values; ignore drift (e.g. user switching networks) |

---

## D. Delivery (Resend)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Resend account + verified sending domain | Required to send from anything other than `onboarding@resend.dev` | S | Use `transcripts@jackcutrara.com` or similar. Add SPF/DKIM/DMARC DNS records. Verify in Resend dashboard. |
| `RESEND_API_KEY` as Worker secret | Cannot be in source | S | `wrangler secret put RESEND_API_KEY`. Both production and preview environments. |
| Resend SDK call from Worker | `@anthropic-ai/sdk` precedent shows SDK works in Workers runtime; Resend SDK same shape | S | `import { Resend } from 'resend'` in cron handler. |
| HTML-escape user-typed message text in body | XSS / HTML injection — emails rendered in Gmail web client | S | Use a simple escape function (Resend has no built-in escape). User text → `&` `<` `>` `"` `'` escaped. **Critical** — emails are sent from a domain Jack controls; injection here = phishing-as-Jack. |
| No markdown rendering of user input | Same threat — Markdown can construct links and HTML | S | User turns: pre-formatted plain text inside `<pre>` tag. Bot turns: ALSO escaped (already DOMPurify-clean for the widget, but the email is a fresh untrusted-rendering surface). |
| Idempotency key per session | Re-running cron must not double-email | S | Use `Idempotency-Key` header = `sessionId`. Resend retains keys for 24h. After 24h, our `sent:true` KV metadata is the durable guard. |
| `sent: true` flag in KV metadata after success | Prevents resend on subsequent cron tick | S | Update KV with metadata flag + extend TTL down to e.g. 24h post-send. |
| Plain-text alternative (`text` field) | Email clients render text part if HTML blocked; better deliverability | S | Resend accepts both `html` and `text`. Generate text version via simple newline-joined formatting. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Subject-line summary | At-a-glance triage in Jack's inbox | S | Format: `Chat (<msgcount> turns) from <country> via <referrer-host> — <first-user-message-truncated-30-chars>` |
| Reply-to set to a no-reply | Jack hits reply by accident → contained | S | `reply_to: 'noreply@jackcutrara.com'` |
| Conversation rendered as alternating speech blocks | Easier reading than raw JSON dump | S | `<div>` per turn with role label, monospace timestamp, escaped content in `<pre style="white-space:pre-wrap">` |
| Metadata block at top (referrer, country, started_at, msg_count) | Triage without scrolling | S | Definition list `<dl>` or table |
| Inline link to `/api/transcripts/<sessionId>` | "Open this in browser" — but **only if** authenticated; otherwise omit | M | Probably skip — adds an auth surface for marginal UX gain. **Anti-feature candidate.** |
| Truncation badge in subject when `truncated=true` | Signal that bot hit max_tokens for at least one turn | S | E.g. `Chat (5 turns ⚠ truncated) from US — How do I…` |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Send the email immediately on `last user turn` | Faster | "Last turn" is ambiguous — there's no end-of-conversation signal; users alt-tab and come back; would generate 3-4 emails per real conversation | 2-hour inactivity gate (already locked) |
| Use Workers' built-in `Email` binding | "Native Cloudflare integration" | Email Workers send TO routed addresses, not OUTBOUND; not a sending API | Use Resend (locked) or AWS SES; Resend is locked |
| Webhooks from Resend back to Worker for delivery confirmation | "Audit trail" | Adds an inbound endpoint, signature verification, no actionable purpose for read-only use case | Trust Resend's API response; failure goes to KV `last_send_error` |
| Render bot markdown as HTML in email | "Looks nicer" | The widget already sanitizes via DOMPurify with a strict allowlist — re-doing this in a different rendering context (email) is duplicate trust boundary work; small risk of escape bypass; minimal value over `<pre>` | Plain `<pre>` blocks for both roles. Optionally, restrict bot-side to a subset of markdown rendered with marked + DOMPurify if value is justified; default = plain. |
| Conditional emailing ("only email if 3+ turns") | Reduce noise | Suppresses signal; one-turn questions (e.g. "is Jack open to remote?") may be the most valuable | Email every conversation that completes ≥1 turn |
| AI summary at top of email | "Save reading time" | Latency, cost, hallucination risk; user said they read every email in entirety | Don't |
| In-app admin panel / dashboard | "View all transcripts" | Out of scope — Jack reads emails | Don't |
| Search across transcripts | "Find that one conversation about React" | Out of scope — Gmail search is the search | Don't |

### Edge Cases (delivery)

| Scenario | Behavior |
|----------|----------|
| Resend API returns 5xx | Retry once with exponential backoff inside cron tick. Don't set `sent:true`. Next hour's cron retries. |
| Resend API returns 409 (idempotency key collision with different payload) | Likely a transcript-grew-since-last-attempt edge case → log to KV `last_send_error`, mark `sent:true` (assume prior send went through), don't double-email |
| Resend rate limit hit (10 req/sec by default) | Cron processes batches sequentially with small delay; or use `p-limit` style throttle. For a portfolio this is unlikely to fire. |
| RESEND_API_KEY missing/invalid | Log error, do NOT mark sent, keep retrying on subsequent cron ticks. Surface via Cloudflare logs. |
| Empty transcript (sessionId in KV but no messages) | Skip; don't email. Should be impossible given "sessionId only generated on first send" rule. |
| Email exceeds Resend body size limit (~10MB) | Capped via 100-turn / 50KB transcript cap upstream — won't hit |
| User's content contains an email-injection payload (e.g. `\nBcc: …`) | Strip CR/LF from anything used in headers (subject, reply-to). User text only ever in body, not headers, so low risk. |
| Bot reply contained tool-use / structured output | N/A — current chat returns plain text only. If this changes, treat as user-controlled and escape. |

---

## E. Scheduling & Reliability (Cron Trigger)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Cron Trigger registered in `wrangler.toml` | Required to fire scheduled handler | S | `crons = ["0 * * * *"]` (top of every hour). |
| `scheduled` handler in Worker | Entry point for cron | S | Astro 6 supports custom handlers via `_worker.js` adapter or via the platform's astro adapter; verify Astro Cloudflare adapter exposes `scheduled` (may need a small workaround — flag in PITFALLS). |
| KV `list({prefix:'transcript:'})` with cursor pagination | Iterate all candidate sessions | S | Cloudflare docs confirm cursor-based pagination; loop until `list_complete: true`. |
| Inactivity check via metadata | `now - last_activity_at >= 2h` AND `sent !== true` | S | Read metadata via list (no per-key get) — major perf win documented by Cloudflare |
| `ctx.waitUntil()` to extend post-response work | Allow async sends to complete | S | Standard Workers pattern |
| Per-session try/catch | One bad send must not abort the whole batch | S | Wrap each send; on error, write `last_send_error` to KV metadata and continue |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Cap batch size per cron tick | Bound CPU time on free/paid Workers (CPU time is the binding constraint, not wall time) | S | E.g. process at most 50 sessions per tick. Realistic load is ≤5/day for a portfolio. |
| Send-attempt counter with cap | Avoid infinite retry on a poison-pill payload | S | After N=5 failed sends, mark `dead:true`, surface in next-cron log, stop retrying |
| Structured logs (JSON) for failures | Cloudflare Logs / observability | S | `console.log(JSON.stringify({event:'email_send_failure', sessionId, error}))` |
| Self-heartbeat | "Did the cron run last hour?" — emits a no-op log every tick | S | Minimal; Cloudflare dashboard shows cron history natively, so this is optional |

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Sub-hourly cron (`*/15 * * * *`) | Faster delivery | Worst-case latency is already 3h (1h cron interval + 2h inactivity); 15-min ticks add cost/noise without business value for this volume | Hourly is correct |
| Durable Objects for stronger consistency | "Eventually consistent KV is scary" | KV's eventual consistency window (60s) is irrelevant against a 2-hour threshold + hourly cron; DO adds complexity, cost, and a new failure mode | Accept KV eventual consistency, document in PITFALLS |
| Queue-based fanout to a separate "send" Worker | "Decouple cron from sending" | Adds a Queue binding, a second Worker, and inter-Worker semantics for ≤5 sends/day | One Worker, sequential sends, idempotent retry |
| Track every cron run in KV | "Audit trail" | Cloudflare Dashboard already shows cron execution history | Don't duplicate |

### Edge Cases (scheduling)

| Scenario | Behavior |
|----------|----------|
| Cron tick overruns CPU budget | Worker terminates; unsent sessions picked up next tick (idempotent) |
| Two cron ticks somehow overlap | Idempotency key on Resend deduplicates; KV `sent:true` flag prevents re-attempt |
| KV write delay propagation (eventual consistency) | A `sent:true` write from prior tick may not be visible at all edges within 60s — but cron runs in **one** location per tick, so it sees its own writes immediately; cross-region staleness is moot |
| Cloudflare incident skips a cron tick | Next successful tick catches up — sessions stay in KV per their TTL |
| Session with `last_activity_at` exactly at 2h boundary | Off-by-one handled via `>=` in inequality |
| Session that **never** ends (continuous activity) | Never emailed (correct); falls off via 7-day max TTL eventually |
| TTL expiry races with cron pickup | If transcript expires before cron, no email sent. Mitigation: write with **TTL ≥ inactivity_threshold + cron_interval + safety margin** = at least 4h, recommend 7 days |

---

## F. Tech Debt Sweep (Five Carry-Forwards)

These are pre-existing items with full v1.2 audit context. Bundling into v1.3 because each touches files (`chat.ts`, `api/chat.ts`, `wrangler.toml`, CI) that v1.3 will modify anyway. Not feature work in the user-facing sense — operational maturity.

### Table Stakes

| Item | Status | Complexity | Notes |
|------|--------|------------|-------|
| **DEBT-CHAT-RL-01** — Configure `CHAT_RATE_LIMITER` binding on Production + Preview | Code path exists; binding never bound | S | Add to `wrangler.toml`. Test fires in production. Existing defensive skip-when-absent guard (`api/chat.ts:49-52`) becomes dead code path — still keep for local dev. |
| **DEBT-CHAT-CACHE-01** — Cache-hit-rate observability | Anthropic returns `cache_read_input_tokens` / `cache_creation_input_tokens` per `message_delta`; we don't surface them | M | Easiest landing: emit a structured log line per request; optionally include in v1.3 transcript metadata (Category C differentiator). Bonus: surfaces in same email Jack already reads. |
| **DEBT-CHAT-CTX-CI-01** — `build:chat-context:check` in CI | `package.json` script exists; no CI invocation | S | Add a step to GitHub Actions `ci.yml`. Fails PR if local context is stale relative to MDX content. Build-time deploy regenerates so production never stale, but PR-time fail-fast is the gap. |
| **DEBT-WR-01** — `astro:page-load` listener dedup | Three listeners (`analytics.ts`, `scroll-depth.ts`, `chat.ts`) register without removeEventListener; long sessions accumulate | S | Add `{once:false}` removal pattern, or guard via module-level `bound` boolean. Existing `*Initialized` guards prevent double-execution but listener leak still grows. Touches three files. |
| **DEBT-CHAT-DISPLAY-01** — `#chat-panel` JS-coupled display contract | `animatePanelOpen` flips `style.display='flex'` directly; `.is-open` class only animates | S | Move display state to CSS via `[data-state="open"]` attribute. JS toggles attribute, CSS controls `display`. Decouples motion from visibility. |

### Differentiators

None — these are pure debt. The "differentiator" is not carrying them into v1.4.

### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Refactoring chat into a framework (React island, etc.) while we're touching it | "Since we're in here anyway" | Phase 7 vanilla architecture is a deliberate constraint; reintroducing a framework violates "zero new runtime deps preferred" | Stay vanilla |
| Adding tests for every edge case enumerated above | "Comprehensive" | TDD applies to v1.3 net-new code per project convention. Existing carry-forward fixes get focused tests for the fix, not exhaustive coverage of the whole module | Targeted regression tests per debt item |

---

## Feature Dependencies

```
[A. Persistence] ─────── prerequisite for ──> [D. Delivery]
       ▲                                            ▲
       │                                            │
[B. Identity (sessionId)] ───── keys ──────────────┘
       ▲
       │
[C. Metadata Capture] ──── enriches ──> [D. Delivery] (subject + body)
                                              ▲
                                              │
[E. Scheduling (Cron)] ───── triggers ────────┘
       │
       └─── reads ──> [A. Persistence]
       └─── reads ──> [B. Identity]
       └─── reads ──> [C. Metadata]

[F. Tech Debt Sweep] ──── parallel ──── (no dependency on A-E; can land any phase)
   └─ except DEBT-CHAT-CACHE-01 which can ride [C. Metadata Capture] for lower marginal cost
```

### Dependency Notes

- **D requires A:** Resend cannot send what was never persisted. Persistence must ship before delivery.
- **A requires B:** KV writes need a key; key is `transcript:{sessionId}`. sessionId machinery must ship first or alongside.
- **E requires A, B, C:** Cron reads KV, filters by `last_activity_at` (C), keys by sessionId (B).
- **C enriches D:** Email is much more useful with metadata; metadata is not strictly required for delivery to work.
- **DEBT-CHAT-CACHE-01 enhances C:** Both work the cache-hit observability surface; landing them together avoids redundant pass over `api/chat.ts`.
- **F is parallel:** None of the debt items block the v1.3 feature path. They CAN ship in any order; bundling is convenience, not requirement.

---

## MVP Definition

### Launch With (v1.3 ship)

Minimum to deliver "Jack sees what visitors are asking":

- [x] B1 — sessionId generated client-side, persisted in localStorage, sent in request
- [x] B2 — sessionId validated server-side
- [x] A1 — KV namespace bound, write per turn, sessionId-keyed
- [x] A2 — `last_activity_at` updated each turn, TTL ≥ 7 days, schema versioned
- [x] A3 — Bounded transcript size (100 turns / 50KB)
- [x] C1 — `started_at`, `last_activity_at`, `referrer`, `user_agent`, `country`, `message_count`, `truncated` captured
- [x] D1 — Resend domain verified, API key bound, SDK integrated
- [x] D2 — HTML escape on every user-typed and bot-emitted segment
- [x] D3 — Idempotency-Key = sessionId on Resend send
- [x] D4 — `sent:true` flag in KV metadata after success; TTL trimmed post-send
- [x] D5 — Subject line: `Chat (N turns) from <country> via <referrer-host> — <first-msg-30c>`
- [x] D6 — Plain-text + HTML body parts; alternating turn blocks; metadata header
- [x] E1 — `crons = ["0 * * * *"]` registered
- [x] E2 — Scheduled handler iterates KV via `list()` cursor pagination, reads metadata to filter, sends via Resend
- [x] E3 — Per-session try/catch; structured-log on failure; send-attempt counter cap
- [x] F1–F5 — All five tech debt items closed

### Add After Validation (v1.4+)

- [ ] **C-diff** — Cloudflare `cf.region` / `cf.colo` if Jack reports country alone is insufficient
- [ ] **D-diff** — Cache-hit-rate metadata in email body (only if F2's separate observability surface proves insufficient)
- [ ] **E-diff** — Self-heartbeat / health check (only if a missed cron is observed; dashboard already shows runs)

### Future Consideration (deferred, may never ship)

- [ ] Aggregation / search / dashboard — **explicitly out of scope** per the anchor constraint
- [ ] Sub-hourly cron — only if email latency complaints emerge
- [ ] Cross-device session continuity — requires login surface, not aligned with portfolio identity
- [ ] AI summary in email — user reads everything, summary is anti-value
- [ ] Webhook from Resend for delivery audit — no actionable need
- [ ] Multi-recipient distribution — single user (Jack) is the only consumer

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| KV writes per turn (A) | HIGH | LOW | P1 |
| sessionId machinery (B) | HIGH | LOW | P1 |
| Resend integration + escape (D) | HIGH | MEDIUM | P1 |
| Cron Trigger + sweep (E) | HIGH | MEDIUM | P1 |
| Core metadata: referrer, country, timestamps, msg_count (C) | HIGH | LOW | P1 |
| Idempotency key + `sent:true` flag | HIGH | LOW | P1 |
| Schema versioning + bounded transcript (A) | MEDIUM | LOW | P1 |
| DEBT-CHAT-RL-01 (rate-limiter binding) | MEDIUM | LOW | P1 |
| DEBT-CHAT-CTX-CI-01 (CI check) | MEDIUM | LOW | P1 |
| DEBT-WR-01 (listener dedup) | LOW | LOW | P2 |
| DEBT-CHAT-DISPLAY-01 (#chat-panel decouple) | LOW | LOW | P2 |
| DEBT-CHAT-CACHE-01 (cache observability) | MEDIUM | MEDIUM | P2 |
| Cache-hit metadata in email (C-diff) | LOW | LOW | P3 |
| Send-attempt counter cap (E) | LOW | LOW | P3 |

**Priority key:**
- P1: Required for v1.3 ship
- P2: In-milestone if budget permits, otherwise carry-forward to v1.4
- P3: Defer

---

## Privacy & Security Quick Reference

| Concern | Treatment |
|---------|-----------|
| User-typed PII (email, phone if visitor pastes them) | Stored in KV (encrypted at rest by Cloudflare); transmitted to Gmail (TLS in transit); retained 7 days, post-send trimmed to 24h |
| Email body XSS / HTML injection | HTML-escape EVERY user-controlled string (user turns, bot turns, referrer, UA) before HTML interpolation. Escape function: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&#39;` |
| Email header injection (CR/LF in subject) | Strip `\r\n` from subject components (referrer-host, first-message-30c snippet) |
| GDPR / data subject rights | Single-actor (Jack) read-only consumption + 7d transient retention + cookie-free posture is below the threshold for most practical concerns. No data sale, no profiling, no automated decision-making. Document the data flow in CLAUDE.md/PROJECT.md. |
| In-UI disclosure | None (silent logging is locked). Risk: if a user notices network tab and asks. Mitigation: no analytics surface, no tracking pixel, only the existing chat API call enriched with a sessionId field. |
| Resend domain SPF/DKIM/DMARC | Required for deliverability; required to prevent spoofing of `transcripts@jackcutrara.com` |
| API-key exposure | `RESEND_API_KEY` and `ANTHROPIC_API_KEY` as Worker secrets, never logged, never returned in responses |
| sessionId disclosure | Sent in request body; not sensitive (random UUID, no identity binding); fine to log |

---

## Sources

### Cloudflare KV (HIGH confidence — official docs)
- [Workers KV: Write key-value pairs](https://developers.cloudflare.com/kv/api/write-key-value-pairs/) — `expirationTtl` semantics, 60s minimum
- [Workers KV: List keys](https://developers.cloudflare.com/kv/api/list-keys/) — cursor pagination, metadata field for hot-data optimization
- [Workers KV: How KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/) — eventual consistency, ~60s propagation
- [Workers KV: FAQ](https://developers.cloudflare.com/kv/reference/faq/) — suitability for sessions with caveats
- [Workers Storage Options](https://developers.cloudflare.com/workers/platform/storage-options/) — KV vs D1 vs Durable Objects decision matrix

### Cloudflare Cron Triggers (HIGH confidence — official docs)
- [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) — registration, scheduled handler entry point
- [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) — CPU vs wall time, 5-min paid CPU cap
- [Scheduled Handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) — `ctx.waitUntil()` pattern

### Resend (HIGH confidence — official docs)
- [Resend: Idempotency Keys changelog](https://resend.com/changelog/idempotency-keys) — 256 char max, 24h retention, 409 on payload mismatch
- [Resend: Send Email API](https://resend.com/docs/api-reference/emails/send-email) — request shape, html/text dual parts
- [Resend: Engineering Idempotency Keys](https://resend.com/blog/engineering-idempotency-keys) — duplicate-prevention mechanics

### Web Platform (HIGH confidence — MDN / specs)
- [Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) — secure context requirement, RFC 4122 v4
- [Can I use: randomUUID](https://caniuse.com/mdn-api_crypto_randomuuid) — browser support matrix

### Email Security (HIGH confidence — security advisories + OWASP)
- [Papra HTML Injection in Transactional Emails](https://github.com/papra-hq/papra/security/advisories/GHSA-6f8x-2rc9-vgh4) — concrete CVE pattern: unescaped user display name → phishing-as-domain
- [TrustedSec: Crafting Emails with HTML Injection](https://trustedsec.com/blog/crafting-emails-with-html-injection) — attack patterns for transactional email
- [OWASP: XSS](https://owasp.org/www-community/attacks/xss/) — escape strategy fundamentals
- [OpenStack: Escape user input to prevent XSS](https://security.openstack.org/guidelines/dg_cross-site-scripting-xss.html) — escape character set

### Chat Transcript Patterns (MEDIUM confidence — vendor docs, multiple agreeing sources)
- [Provide Support: Live Chat Transcripts](https://www.providesupport.com/live-chat-transcripts) — auto-delivery on chat end, 5-min post-survey delay
- [Provide Support: How to Manage Chat Transcripts](https://www.providesupport.com/how-to/manage-chat-transcripts) — multi-level delivery (company/dept/operator) — informs anti-feature for our single-recipient case
- [WhosOn: Chat Transcript Etiquette](https://www.whoson.com/live-chat-best-practice/a-quick-note-re-live-chat-transcript-etiquette/) — when to share, what to redact
- [Tidio: Chat Transcript Best Practices](https://www.tidio.com/blog/chat-transcript/) — typical body structure
- [Microsoft Dynamics: Download and Email Chat Transcripts](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/download-email-chat-transcripts) — enterprise pattern reference

### Internal Inputs (HIGH confidence — direct file read)
- `.planning/PROJECT.md` lines 75–105 — milestone scope, locks, anchor constraints
- `src/scripts/chat.ts` lines 1–110 — current localStorage persistence schema, version-bumping pattern, no current sessionId
- `src/pages/api/chat.ts` lines 1–100 — current API shape, validation pipeline, rate-limit defensive skip, environment binding pattern

---
*Feature research for: chat conversation logging + per-session inactivity-triggered email delivery on a personal portfolio*
*Researched: 2026-05-09*
