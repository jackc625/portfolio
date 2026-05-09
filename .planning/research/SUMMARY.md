# v1.3 Chat Visibility — Research Summary

**Synthesized:** 2026-05-09
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Confidence:** HIGH

---

## Headline Finding — Pages → Workers Migration is the #1 Architectural Decision

**Cloudflare Pages does NOT support Cron Triggers — only Cloudflare Workers does.**

The site today deploys as Cloudflare Pages (`jackcutrara.com` static assets + `/api/chat` as a Pages Function). v1.3's locked spec ("Cloudflare Cron Trigger — hourly scan; 2-hour inactivity threshold") is therefore impossible on the current deploy target. This is foundational and must be resolved before any feature code is written.

The Stack and Architecture researchers both implicitly converged on path **(a)** below — they each describe a custom Worker entrypoint (`src/worker.ts` re-exporting Astro's `handle` for fetch + adding `scheduled`) wired via a `wrangler.jsonc` `main` switch and an `[assets]` binding. That is Workers Static Assets, not Pages.

| # | Option | Pros | Cons | Recommendation |
|---|--------|------|------|----------------|
| **(a)** | **Migrate Pages → Workers Static Assets** (single Worker owns static assets, `/api/chat`, and cron) | Cloudflare's documented forward path; full Pages parity plus cron + Durable Objects; matches both Stack + Architecture research; single deploy target; same Worker reaches the same KV namespace | Largest blast radius — touches `astro.config.mjs` adapter, `wrangler.jsonc`, CI/CD, custom domain reconfiguration, env-binding rewiring | **RECOMMENDED — Phase 17** |
| (b) | Keep Pages, add a separate sweeper Worker (sharing KV via binding) | Smallest blast radius to chat endpoint; Pages deploy untouched; chat regression risk minimized | Two deploy targets, two `wrangler.jsonc` files, two CI flows; doesn't address Astro's deprecation trajectory | Acceptable fallback if (a) introduces unacceptable D-26 regression risk |
| (c) | External scheduler (GitHub Actions cron / uptime-monitor poke) hitting an authenticated endpoint | Zero Cloudflare-platform changes | Operationally fragile; non-Cloudflare moving piece; new auth surface | Not recommended |

**Implications of (a) — must be addressed in Phase 17:**

- `wrangler.jsonc` `main` switches from `@astrojs/cloudflare/entrypoints/server` → `./src/worker.ts`
- New `src/worker.ts` (~30 LOC) re-exports `handle()` for fetch + adds `scheduled()`
- `wrangler.jsonc` gains `[assets] binding="ASSETS" directory="./dist/client"`, `kv_namespaces`, `triggers.crons`, dev preview namespaces
- CI/CD: `wrangler pages deploy` → `wrangler deploy`; preview URLs move from `*.pages.dev` to Workers preview URLs
- DNS / custom domain: `jackcutrara.com` route reattaches to the Worker (1-click in dashboard)
- D-26 chat regression battery (117/117) and D-15 server byte-identical must hold across the migration

---

## Recommended Stack Additions

| Addition | Version / Source | Purpose | Why |
|----------|------------------|---------|-----|
| **Resend** (REST via `fetch`, NOT npm SDK) | Direct POST to `https://api.resend.com/emails` | Transactional email — one email per ended chat session | Officially documented for Workers. **REST over SDK** to avoid Node deps in Workers + zero new runtime deps. Idempotency-Key header for safe cron retries. Free tier covers v1.3. |
| **Cloudflare Workers KV** | Platform-native | Transcript persistence keyed by sessionId | Right scale fit. KV `metadata` (1024 bytes) lets `list()` filter without per-key `get()`. 1 write/sec/key cap mitigated by writing only at stream-close, not per-token. |
| **Cloudflare Cron Triggers** | Platform-native — `triggers.crons: ["0 * * * *"]` | Hourly inactivity scan | Free tier covers 5k/day vs our 24/day. Requires Workers (not Pages). |
| **Wrangler secrets** | `RESEND_API_KEY`, `CHAT_RECIPIENT_EMAIL`, `CHAT_SENDER_EMAIL` | Email config | Same pattern as existing `ANTHROPIC_API_KEY`. |
| **Resend domain DNS** | DNS records on chosen sender domain | SPF + DKIM + DMARC for deliverability | Required to avoid Gmail spam-foldering. DMARC at `p=none` minimum. Cloudflare Domain Connect auto-configures Resend records. |
| **Custom Worker entrypoint** | New `src/worker.ts` (~30 LOC) | Wraps Astro's `handle()` for fetch + adds `scheduled()` | Required because `@astrojs/cloudflare/entrypoints/server` only exports `fetch`. |

**Rejected:** Cloudflare Email Sending (public beta only since 2026-04-16, Workers Paid required), MailChannels (free Workers tier ended 2024-08-31), D1/R2/Durable Objects/Queues (KV is right shape — no aggregation/search), `react-email`/`nodemailer`/`node-cron` (wrong runtime/scope).

---

## Feature Categories — Table Stakes / Differentiators / Anti-Features

**Anchor:** Jack reads every email in entirety. No aggregation, no search, no admin UI, no dashboard. Every feature evaluated against "does Jack reading 10–50 emails/week need this?"

| Category | Table Stakes | Differentiators | Anti-Features |
|----------|--------------|-----------------|---------------|
| **A. Persistence (KV)** | KV namespace bound; per-turn append on stream close; sessionId-keyed; `expirationTtl` on every write; `last_activity_at` updated each turn; bounded transcript size | Schema versioning (`v: 1`); KV `metadata` for hot fields; compact storage shape | D1/SQL; per-message KV writes; client-side KV writes; encryption-at-rest |
| **B. Identity (sessionId)** | `crypto.randomUUID()` client-side; persist in localStorage (bump `STORAGE_VERSION` 1→2); send in `/api/chat` body; UUIDv4 server-side validation; new sessionId on TTL expiry | `crypto.getRandomValues()` fallback; server-side regex validation | Server-issued cookie sessionId; cross-device continuation; multi-tab merge |
| **C. Metadata Capture** | `started_at`, `last_activity_at`, `referrer`, `user_agent`, `country` (`request.cf.country`), `message_count`, `truncated` | `cf.region`, `cf.colo`, cache-hit token counts (closes DEBT-CHAT-CACHE-01) | Full IP capture; canvas/font fingerprinting; cross-reference with Umami |
| **D. Delivery (Resend)** | Verified sending domain; `RESEND_API_KEY`; **HTML-escape every dynamic segment**; **no markdown rendering of user input**; idempotency key per session; `delivered:` keyspace marker; plain-text only | Subject summary (`[Portfolio chat] N turns from <country> via <referrer-host>`); `Reply-To: jackcutrara@gmail.com`; metadata header block; truncation badge | Send-immediately on last turn; Workers Email binding (inbound only); render bot markdown as HTML; conditional emailing; AI summary; admin panel |
| **E. Scheduling (Cron)** | `crons = ["0 * * * *"]`; `scheduled` handler; `list({prefix:'live:'})` cursor pagination; metadata-based inactivity check; `ctx.waitUntil()`; per-session try/catch | Per-tick batch cap (50); send-attempt counter cap; structured JSON logs | Sub-hourly cron; Durable Objects; Queue-based fanout |
| **F. Tech Debt Sweep** | All 5: CHAT_RATE_LIMITER binding, cache-hit observability, `build:chat-context:check` CI, WR-01 listener dedup, `#chat-panel` display contract decoupling | None — pure debt | Refactoring chat into a framework |

---

## Architecture Summary

**Target architecture (post-Phase-17 Workers Static Assets migration):**

```
                Cloudflare Workers (single deployment)
                      jackcutrara.com
┌──────────────────────────────────────────────────────────────┐
│  src/worker.ts  ◄── NEW custom entrypoint                    │
│    fetch(req, env, ctx)     → handle(req, env, ctx) [Astro]  │
│    scheduled(controller, env, ctx)                           │
│       → ctx.waitUntil(deliverDue(env))                       │
└──────┬───────────────────────────────────┬───────────────────┘
       │ /api/chat (SSE — unchanged)       │ Cron: 0 * * * *
       ▼                                   ▼
[api/chat.ts]                       [chat-delivery.ts]
  ├── existing: CORS, body, RL,       ├── list live:* candidates
  │   validate, sanitize, SSE         ├── filter inactivity ≥ 2h
  ├── NEW: resolveSessionId           ├── for each:
  ├── NEW: ctx.waitUntil(             │     PUT delivered:{sid} (24h TTL)
  │   appendTurn(user))               │     POST Resend + Idempotency-Key
  ├── stream Anthropic SSE            │     DELETE live:{sid}
  └── NEW: ctx.waitUntil(             └── log summary
      appendTurn(assistant))
                                            │
                                            ▼
                env.CHAT_KV (NEW kv_namespaces binding)
                ────────────────────────────────────────
                live:{sid}      → transcript JSON  (30d TTL)
                delivered:{sid} → idempotency cursor (24h TTL,
                                  matches Resend window)
```

**KV data shape — single key per session, two-keyspace partition:**

- **Keys:** `live:{sid}` (cron-candidate, 30-day TTL); `delivered:{sid}` (idempotency marker, 24h TTL aligned with Resend window)
- **Value (JSON):** `{ v: 1, sid, started_at, last_activity_at, msg_count, meta: { referrer, user_agent, country, asn }, messages: [{ role, content, ts }] }` — content stored RAW; HTML-escape happens at email-render time
- **KV `metadata`:** `{ last_activity_at, msg_count }` — `list()` returns it inline, eliminating O(n) `get()` round-trips on cron path
- **Caps:** 30 messages / 120 KiB worst case (well under 25 MiB ceiling); 512 chars on `referrer`/`user_agent` to prevent log poisoning

**Send-once strategy — defense in depth:**

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| 1. Two-keyspace partition | Cron promotes `live:{sid}` → `delivered:{sid}` BEFORE calling Resend; deletes `live:{sid}` AFTER success. Crash-safe at every step. | Application-level idempotency; survives cron-double-fire and worker-restart-mid-loop |
| 2. Resend `Idempotency-Key` | `transcript/{sid}` header on every Resend POST. 24h window. | Authoritative cross-system dedupe; covers race between layer-1 PUT and Resend POST |

**Why not a `delivered: bool` flag inside the value:** KV does not support compare-and-swap; read-modify-write is racy; writes-per-key capped at 1/sec. Two-keyspace approach is strictly better.

**Where KV writes happen:**
- User turn: `ctx.waitUntil(appendTurn(user))` AFTER validation, BEFORE stream open (durability anchor)
- Assistant turn: `ctx.waitUntil(appendTurn(assistant))` AFTER `controller.close()` (accumulator strategy)
- **Never per-token** — KV's 1-write/sec/key cap would 429 the transcript
- `ctx.waitUntil` is mandatory — runs after response sent, never blocks SSE; without it the runtime can terminate before `kv.put()` resolves

---

## Top Pitfalls — Critical Defenses

| # | Pitfall | Prevention | Verify |
|---|---------|------------|--------|
| **0** | **Cloudflare Pages does NOT support Cron Triggers** | Phase 17: migrate to Workers Static Assets | Set cron temporarily to `* * * * *`; confirm Past Events shows ≥1 invocation within 90s |
| **1** | KV write inside SSE stream blocks/aborts on stream close | `ctx.waitUntil()` for both writes; never `await` inline; best-effort try/catch | D-26 timing test: `[DONE]` enqueued BEFORE any KV `put` resolves |
| **2** | KV is eventually consistent (~60s) | 2h threshold >> 60s consistency window (already correct); two-keyspace pattern; never have cron mutate transcripts | MockKV-with-delay unit test |
| **3** | HTML-render of user-typed content lets visitor inject HTML/links into Jack's inbox | **Send `text/plain` only for v1.3** (Resend `text` field; no `html` field); `escapeHtml` not DOMPurify; no auto-linkification; strip Unicode bidi overrides | Adversarial-payload unit suite; Gmail renders as literal text |
| **4** | Cron + KV — "send once" impossible without sentinel | Two-keyspace partition + Resend `Idempotency-Key`. PUT delivered BEFORE Resend; DELETE live AFTER success. | Run sweeper twice → exactly one Resend call (`idempotency_replay: true` on second) |
| **5** | D-26 chat regression battery 117/117 must not regress | Treat D-26 as cross-phase gate; Wave-0 RED stubs every phase touching chat surface; **no new SSE frame types** (D-15 amendment); diff-check at every phase end | Run full battery at end of every phase |
| **6** | Anthropic prompt cache invalidated by sessionId leaking into cached system block | sessionId stays on HTTP envelope, NEVER in Anthropic message payload; wire `cache_read_input_tokens` observability (closes DEBT-CHAT-CACHE-01) | Snapshot test: sessionId NOT inside `system`/`messages[0]`; live test: 3x same payload within 5min → response 2,3 show `cache_read_input_tokens > 0` |
| **7** | Gmail spam classification on brand-new From-domain | Phase 17 pre-roadmap: SPF + DKIM + MX + DMARC (`p=none`) before code; warm domain (5–10 manual sends + "Not Spam"); enroll Postmaster Tools; predictable subject prefix | `dig TXT _dmarc.<domain>` returns record; first 5 test sends land in Inbox |
| **8** | Resend SDK pulls Node deps in Workers | Use REST via `fetch()` not npm SDK | No new npm dep added |
| **9** | Missing `expirationTtl` → unbounded KV namespace growth | `expirationTtl` set on every `put()` from start | Code review checklist |
| **10** | Resend `email.delivered` webhook = SMTP-accepted (possibly to spam), NOT inbox-delivered | Optional `/api/resend-webhook` with Svix HMAC verification | Not required for v1.3 ship |

---

## Suggested Phase Ordering

**Continuing from v1.2's last phase (16) → starting at Phase 17.**

### Phase 17 — Foundations: Migration + DNS + Debt Sweep

**Rationale:** Every other phase assumes a working schedule mechanism (Critical-0), a deliverability-warmed sending domain (Critical-7), and a non-fragile chat foundation. Starting here de-risks all subsequent work.

**Delivers:**
- Migration Pages → Workers Static Assets (`wrangler.jsonc` rewrite, `src/worker.ts` with no-op `scheduled` handler, deploy command change in CI/CD, custom domain reconfiguration)
- KV namespace creation (`CHAT_KV`) for prod + preview; binding wired
- Resend account + verified sending domain — DNS records (SPF, DKIM, MX, DMARC `p=none`) live BEFORE any email-sending code
- Secrets: `RESEND_API_KEY`, `CHAT_RECIPIENT_EMAIL`, `CHAT_SENDER_EMAIL`
- All 5 carry-forward debt items closed: DEBT-CHAT-RL-01, DEBT-CHAT-CACHE-01, DEBT-CHAT-CTX-CI-01, DEBT-WR-01, DEBT-CHAT-DISPLAY-01
- D-26 117/117 GREEN at phase close; D-15 server byte-identical at `/api/chat`

### Phase 18 — Persistence + Identity: KV Write Path + sessionId

**Rationale:** Persistence enables delivery. Identity ships with persistence because both touch the same insertion points in `chat.ts`/`api/chat.ts`/`validation.ts`. Highest-D-26-risk phase — needs Wave-0 RED stubs.

**Delivers:**
- `src/lib/sessions.ts`: `resolveSessionId(request, headers)` — cookie-based, `crypto.randomUUID()` mint on absent
- `src/lib/chat-transcripts.ts`: pure module — `appendTurn()`, key naming (`live:{sid}`), schema versioning, `expirationTtl: 30d`
- `ctx.waitUntil(appendTurn(...))` calls in `api/chat.ts`: user turn before stream open, assistant turn after `controller.close()`
- Optional `X-Chat-Session` header fallback if cookie path proves brittle in UAT
- `validation.ts` extended for sessionId (UUIDv4 regex)
- Metadata capture written to KV `metadata` field

### Phase 19 — Cron Sweep: Scheduling + Idempotency

**Rationale:** Once persistence ships, the cron path can read live transcripts without sending email yet (DRY_RUN). Isolates schedule + filter + idempotency from email-render risk surface.

**Delivers:**
- `src/lib/chat-delivery.ts`: `deliverDue(env)` — list `prefix:"live:"`, filter `metadata.last_activity_at`, two-keyspace partition, per-session try/catch, batch cap
- `wrangler.jsonc` `triggers.crons: ["0 * * * *"]`; `src/worker.ts` `scheduled` handler wired
- DRY_RUN env flag — full loop runs but logs payload instead of POSTing
- Pagination loop on `list_complete`; hard-cap at 50 pages safety valve

### Phase 20 — Email Render + Resend Integration

**Rationale:** Highest content-security risk surface (Critical-3). Isolated to its own phase so adversarial-payload suite is exhaustive.

**Delivers:**
- `src/lib/email/resend.ts`: thin `fetch()` wrapper (NOT SDK); `Authorization: Bearer`, `Idempotency-Key: transcript/{sid}`, retry-with-same-key on 5xx
- Email template — **plaintext only**. Sender chrome opens with provenance; `>>> visitor:` / `<<< bot:` markers; server-controlled subject; `Reply-To: jackcutrara@gmail.com`
- HTML-escape on every dynamic field even in plaintext (defense in depth)
- Strip CR/LF from headers; strip Unicode bidi overrides (`U+202A..U+202E`, `U+2066..U+2069`)
- Adversarial-payload unit suite
- DRY_RUN flipped off at end

### Phase 21 (optional) — Observability + Hardening

**Rationale:** Post-launch operability. Only-if-budget-permits.

**Delivers:**
- `/api/resend-webhook` with Svix HMAC signature verification
- Per-IP session rate limit (prevent transcript spam from single visitor)
- Cloudflare Workers Analytics Engine integration
- Postmaster Tools 7-day spam-rate < 0.1% acceptance criterion

---

## Open Questions for the Requirements Writer

1. **Pages → Workers migration approach** — confirm option (a) Workers Static Assets
2. **Sending domain** — `transcripts@jackcutrara.com` (apex), `chat@jackcutrara.com` (apex), `transcripts@mail.jackcutrara.com` (subdomain)? Subdomain isolates sending reputation.
3. **HTML vs plaintext email body** — research strongly recommends plaintext only for v1.3
4. **`/api/resend-webhook` in v1.3 or v1.4?** — Phase 21 optional vs deferred entirely
5. **`live:` TTL** — 30d recommended; 7d alternative
6. **Worst-case latency communication** — confirm 2h 59min worst-case email delivery acceptable
7. **Bot turn rendering** — plaintext recommended for v1.3
8. **DEBT-CHAT-CACHE-01 surface** — structured logs only, or both logs + email metadata?
9. **`X-Chat-Session` header fallback** — cookie-only initially or include header from day one
10. **Workers Paid plan** — Free tier covers v1.3's traffic; CHAT_RATE_LIMITER (DEBT-CHAT-RL-01) requires Paid to actually bind. Decide: configure Paid for v1.3 (closes rate-limit gap properly) or keep Free and document defensive-skip code path as v1.3-acceptable.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Resend version verified npm; CF Email beta status verified Cloudflare changelog 2026-04-16; KV limits via Context7; custom-entrypoint pattern via Astro issue #13838 |
| Features | HIGH | Cloudflare/Resend mechanics from official docs; chat-transcript email patterns corroborated by multiple vendors |
| Architecture | HIGH | Existing surface fully mapped; two-keyspace partition is direct consequence of KV's documented constraints (no CAS, 1 write/sec/key) |
| Pitfalls | HIGH for platform mechanics; MEDIUM for Gmail spam-classification thresholds at low send volumes |

**Gaps to address in plan-time research:**
- Astro 6 `dist/_worker.js/index.js` build path stability when Wrangler `main` is overridden — Phase 17 spike
- `locals.runtime.ctx` vs `locals.cfContext` binding name in `@astrojs/cloudflare` 13.1.x — Phase 18 plan
- Cookie behavior on Workers preview URLs (post-migration re-verify)
- Gmail spam threshold at <30 emails/day (operational, not engineering — Phase 17 acceptance criteria)
