# v1.3 Chat Visibility — Requirements

**Milestone:** v1.3 Chat Visibility
**Goal:** Capture every visitor conversation with the chatbot and surface them to Jack's inbox, while closing all outstanding chat-related tech debt.
**Created:** 2026-05-09

---

## v1.3 Requirements

### Foundations — Pages → Workers Migration (FOUND-)

- [ ] **FOUND-01** — Site deploys as a single Cloudflare Worker via Workers Static Assets (`wrangler deploy`), serving static HTML, `/api/chat`, and a `scheduled` cron handler from one binding. Pages deployment retired.
- [ ] **FOUND-02** — Custom worker entrypoint at `src/worker.ts` re-exports Astro's `handle()` for fetch + adds `scheduled()` that delegates to the cron sweep module. `wrangler.jsonc` `main` switches from `@astrojs/cloudflare/entrypoints/server` → `./src/worker.ts`.
- [ ] **FOUND-03** — Production custom domain `jackcutrara.com` reattached to Worker; preview URLs migrate from `*.pages.dev` to `*.workers.dev`; CI/CD deploy command updated to `wrangler deploy`; rollback path documented.
- [ ] **FOUND-04** — `wrangler.jsonc` declares `[assets] binding="ASSETS" directory="./dist/client"`, `kv_namespaces`, `triggers.crons`, dev/preview namespace IDs. Astro `output` mode and per-route `prerender` settings verified to NOT bundle MDX content collections into the Worker bundle.

### Domain & Deliverability (DNS-)

- [ ] **DNS-01** — Sending subdomain `mail.jackcutrara.com` verified on Resend with SPF, DKIM, MX, and DMARC (`p=none` minimum) records live in Cloudflare DNS. Verified via `dig TXT _dmarc.mail.jackcutrara.com`.
- [ ] **DNS-02** — Domain warmed via 5–10 manual sends from `transcripts@mail.jackcutrara.com` to Jack's Gmail with "Not Spam" feedback before the cron path is enabled in production. Postmaster Tools enrolled for `mail.jackcutrara.com`.

### Persistence — KV Write Path (KV-)

- [ ] **KV-01** — Cloudflare KV namespace `CHAT_KV` bound on production AND preview; declared in `wrangler.jsonc` `kv_namespaces`. Distinct from the auto-injected `SESSION` binding (which is reserved by the Astro Cloudflare adapter).
- [ ] **KV-02** — `src/lib/chat-transcripts.ts` provides a pure `appendTurn(kv, sessionId, role, content, meta)` API. Key naming `live:{sessionId}`. Schema versioned (`v: 1`). `expirationTtl: 30 * 24 * 3600` (30 days) on every `put()`.
- [ ] **KV-03** — KV `metadata` field carries `{ last_activity_at, msg_count }` so cron `list({prefix:'live:'})` filters without per-key `get()`. Eliminates O(n) round-trips on cron path.
- [ ] **KV-04** — Transcript values bounded: hard message-count cap (30 turns), `referrer` / `user_agent` truncated to 512 chars to prevent log poisoning. Worst-case value size well under KV's 25 MiB ceiling.

### Identity — sessionId (IDENT-)

- [ ] **IDENT-01** — Client mints sessionId via `crypto.randomUUID()` on first chat open. Persisted in localStorage with `STORAGE_VERSION` bumped 1→2 (leverages existing auto-clear path). Sent in `/api/chat` request body.
- [ ] **IDENT-02** — Server validates sessionId as UUIDv4 regex in `src/lib/validation.ts`. Rejects malformed. **sessionId is NEVER threaded into the Anthropic message payload** — preserves prompt cache hit rate. Lives on the HTTP envelope only.

### Metadata Capture (META-)

- [ ] **META-01** — Each transcript captures `started_at`, `last_activity_at`, `referrer`, `user_agent`, `country` (`request.cf.country`), `region`, `colo`, `message_count`, `truncated` boolean.
- [ ] **META-02** — Anthropic prompt-cache token counts (`cache_read_input_tokens`, `cache_creation_input_tokens`) recorded per assistant turn in transcript metadata. Closes DEBT-02.

### Cron Sweep — Scheduling + Idempotency (CRON-)

- [ ] **CRON-01** — `wrangler.jsonc` `triggers.crons: ["0 * * * *"]` (hourly). Worker `scheduled()` handler delegates to `deliverDue(env)` via `ctx.waitUntil()`.
- [ ] **CRON-02** — `src/lib/chat-delivery.ts` `deliverDue` lists `prefix: "live:"` with cursor pagination; filters via `metadata.last_activity_at < now - 2h`. Two-keyspace partition: PUT `delivered:{sid}` (24h TTL) BEFORE Resend POST; DELETE `live:{sid}` AFTER Resend success. Crash-safe at every step boundary.
- [ ] **CRON-03** — Per-session try/catch isolates failures; per-tick batch cap (50 sessions); send-attempt counter cap (3 retries); pagination hard-cap (50 pages safety valve); structured JSON logs.
- [ ] **CRON-04** — `DRY_RUN` env flag — full sweep loop runs but logs Resend payload instead of POSTing. Used to validate Phase 19 sweep mechanics before Phase 20 flips delivery on.

### Email Delivery — Resend Integration (MAIL-)

- [ ] **MAIL-01** — `src/lib/email/resend.ts` thin `fetch()` wrapper to `https://api.resend.com/emails` (NOT the npm SDK — REST avoids Node deps in Workers and adds zero new runtime dependencies). `Authorization: Bearer ${RESEND_API_KEY}`. `Idempotency-Key: transcript/{sessionId}` header on every POST (24h Resend-side window). Retry-with-same-key on 5xx with exponential backoff.
- [ ] **MAIL-02** — Email body is **plaintext only** — Resend `text` field, no `html` field. Block format: `>>> visitor: ...` / `<<< bot: ...` markers per turn. Opening line declares provenance (`From: chat widget on jackcutrara.com — visitor message follows below this line.`). Metadata header block at top (timestamps, country, referrer, msg count, cache-hit summary).
- [ ] **MAIL-03** — Every dynamic field (user content, bot content, referrer, user-agent, country) HTML-escaped at render time even though body is plaintext (defense in depth for any future v1.4+ HTML migration). CR/LF stripped from all header components. Unicode bidi overrides (`U+202A..U+202E`, `U+2066..U+2069`) stripped from all dynamic fields.
- [ ] **MAIL-04** — Email subject server-controlled; format `[Portfolio chat] N turns from <country> via <referrer-host>`. From: `transcripts@mail.jackcutrara.com`. Reply-To: `jackcutrara@gmail.com`. To: `jackcutrara@gmail.com` (via `CHAT_RECIPIENT_EMAIL` Wrangler secret).
- [ ] **MAIL-05** — Adversarial-payload unit suite covers `<script>` injection, `</p><img onerror=...>` injection, `javascript:` URL injection, RTL override, null bytes, social-engineering provenance prefixes (e.g. user typing "From: chat widget on jackcutrara.com"). Gmail renders all payloads as literal text.

### Tech Debt Sweep (DEBT-)

- [ ] **DEBT-01** — `CHAT_RATE_LIMITER` Wrangler binding documented for Workers Paid plan upgrade path. Code-level: defensive-skip code path retained as v1.3-acceptable on Workers Free tier (per locked decision). PROJECT.md "Known issues / tech debt" entry rewritten to reflect "documented + Free-tier acceptable" rather than "carry-forward gap."
- [ ] **DEBT-02** — Cache-hit-rate observability wired. Log seams in `src/lib/chat-cache.ts` / `src/lib/content-snapshot.ts` / `src/scripts/chat.ts` emit structured logs containing `cache_read_input_tokens` / `cache_creation_input_tokens` from the Anthropic response. Metadata also surfaces in transcript email per META-02.
- [ ] **DEBT-03** — `build:chat-context:check` enforced in CI via parallel job in `.github/workflows/sync-check.yml`. PRs fail-fast on local drift between `Projects/*.md` and `portfolio-context.json`.
- [ ] **DEBT-04** — WR-01 bootstrap listener dedup applied at `src/scripts/analytics.ts:140-147`, `src/scripts/scroll-depth.ts:63-70`, `src/scripts/chat.ts:870-877`. `astro:page-load` listeners registered once with idempotent guard; long sessions can no longer accumulate listeners.
- [ ] **DEBT-05** — `#chat-panel` JS-coupled display contract decoupled. `.is-open` class controls BOTH display AND animation; `animatePanelOpen` no longer flips `style.display='flex'` directly. CSS-only display state machine.

### Cross-Phase Gates (TEST-)

- [ ] **TEST-01** — D-26 chat regression battery (117/117 GREEN) MUST hold at the end of every phase that touches `BaseLayout.astro` / `global.css` / `chat.ts` / `api/chat.ts` / `validation.ts`. Milestone-level cross-phase gate.
- [ ] **TEST-02** — D-15 server byte-identical at `/api/chat` after Phase 17 migration. No new SSE frame types unless explicitly authored as a D-15 amendment in plan-time.
- [ ] **TEST-03** — Anthropic prompt cache integrity verified — sessionId NEVER inside `system` block or `messages[0]` payload (snapshot test). Live verification: 3x identical payload within 5min → response 2,3 show `cache_read_input_tokens > 0`.

---

## Future Requirements (deferred to v1.4+)

- HTML email body with rich rendering — deferred. Trigger: if Jack reports plaintext readability friction. Re-evaluate threat model at that time (HTML rendering of user-typed text is a phishing-into-inbox surface).
- `/api/resend-webhook` with Svix HMAC for bounce / complaint / delivered events — deferred per locked decision. Without it, deliverability monitoring relies on inbox checks + Postmaster Tools.
- Per-IP session rate limit (transcript spam prevention from single visitor) — deferred. Currently mitigated by existing Phase 7 rate limit + KV TTL bounds.
- Workers Paid plan upgrade to actually bind `CHAT_RATE_LIMITER` — deferred. Free-tier acceptable per locked decision. Reconsider if Anthropic spend or chat volume crosses thresholds that justify $60/yr.
- Cloudflare Workers Analytics Engine for transcript metrics — deferred (anchor decision: Jack reads every email in entirety, no aggregation needed).

---

## Out of Scope

Explicit exclusions — design decisions made at milestone planning:

- **Admin UI / dashboard / list view of transcripts** — anchor decision: Jack reads every email in entirety; no UI to maintain
- **Transcript search / aggregation / NLP summarization** — same anchor
- **AI summarization of transcripts** — same anchor; defeats the purpose of reading them
- **Conditional emailing (e.g. only if ≥3 turns)** — Jack wants every conversation
- **D1 / SQL persistence** — KV is right shape; no aggregation need
- **Resend npm SDK** — REST via `fetch()` avoids Node-runtime deps in Workers
- **Cloudflare Email Sending service** — public beta only since 2026-04-16, Workers Paid required, no deliverability track record
- **MailChannels** — free Workers tier ended 2024-08-31 (dead path)
- **Per-token KV writes** — exceeds KV's 1 write/sec/key cap, fatal
- **Server-issued cookie sessionId** — client-mint preserves existing localStorage compatibility, simpler upgrade path
- **Cross-device session continuation** — corner case, no clear value
- **Multi-tab session merging** — last-write-wins acceptable
- **HTML rendering of user-typed text** — phishing-into-inbox surface
- **Markdown rendering of user input in email** — same surface
- **Auto-linkification of URLs in email** — same surface
- **Push notifications / Slack / SMS delivery** — email is sufficient at portfolio scale
- **Cron interval shorter than 1 hour** — locked
- **Inactivity threshold other than 2 hours** — locked
- **Encryption-at-rest for transcripts** — Cloudflare KV is encrypted at rest by default; YAGNI
- **Visitor disclosure of logging in chat UI** — silent logging chosen; data never leaves Cloudflare → Jack's Gmail
- **Recruiter-vs-visitor classification** — no filtering needed; site traffic low enough that Jack reads everything

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 17 | Pending |
| FOUND-02 | Phase 17 | Pending |
| FOUND-03 | Phase 17 | Pending |
| FOUND-04 | Phase 17 | Pending |
| DNS-01 | Phase 17 | Pending |
| DNS-02 | Phase 17 | Pending |
| DEBT-01 | Phase 17 | Pending |
| DEBT-02 | Phase 17 | Pending |
| DEBT-03 | Phase 17 | Pending |
| DEBT-04 | Phase 17 | Pending |
| DEBT-05 | Phase 17 | Pending |
| KV-01 | Phase 18 | Pending |
| KV-02 | Phase 18 | Pending |
| KV-03 | Phase 18 | Pending |
| KV-04 | Phase 18 | Pending |
| IDENT-01 | Phase 18 | Pending |
| IDENT-02 | Phase 18 | Pending |
| META-01 | Phase 18 | Pending |
| META-02 | Phase 18 | Pending |
| CRON-01 | Phase 19 | Pending |
| CRON-02 | Phase 19 | Pending |
| CRON-03 | Phase 19 | Pending |
| CRON-04 | Phase 19 | Pending |
| MAIL-01 | Phase 20 | Pending |
| MAIL-02 | Phase 20 | Pending |
| MAIL-03 | Phase 20 | Pending |
| MAIL-04 | Phase 20 | Pending |
| MAIL-05 | Phase 20 | Pending |
| TEST-01 | Phases 17, 18 (cross-phase gate) | Pending |
| TEST-02 | Phase 17 | Pending |
| TEST-03 | Phases 17, 18 (cross-phase gate) | Pending |

**Coverage:** 31 / 31 requirements mapped (28 v1.3 requirements + 3 cross-phase TEST gates). Zero orphans.

**Cross-phase gate notes:**
- **TEST-01** (D-26 chat regression battery) applies to Phases 17 and 18 — both touch `BaseLayout.astro` / `global.css` / `chat.ts` / `api/chat.ts` / `validation.ts`. Phases 19 and 20 touch new modules (`chat-delivery.ts`, `email/resend.ts`) and the `worker.ts` `scheduled` handler only — no chat-surface mutations — so the D-26 gate is informational rather than blocking there. Plan-phase may re-run it as a smoke check.
- **TEST-02** (D-15 server byte-identical at `/api/chat`) is Phase 17 specific per the milestone spec. Phase 18 will introduce `ctx.waitUntil(appendTurn(...))` calls in `api/chat.ts`, which is an explicit, plan-time-authored D-15 amendment — not a regression. Phases 19 and 20 do not touch `api/chat.ts`.
- **TEST-03** (Anthropic prompt cache integrity — sessionId never in `system` / `messages[0]`) applies to Phase 17 (when DEBT-02 wires the cache-token observability) and Phase 18 (when IDENT-01/02 introduce the sessionId — the highest-risk moment for accidental Anthropic-payload leakage and when META-02 records the cache token counts per turn).

---

*Last updated: 2026-05-09 — roadmap traceability filled by gsd-roadmap-phase agent*
