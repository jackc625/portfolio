# Roadmap: Jack Cutrara Portfolio

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7 (shipped 2026-03-31) | [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Editorial Redesign** — Phases 8-11 (shipped 2026-04-15) | [Archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 Polish** — Phases 12-16 (shipped 2026-04-27) | [Archive](milestones/v1.2-ROADMAP.md)
- 🚧 **v1.3 Chat Visibility** — Phases 17-20 (in progress, started 2026-05-09)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-7) — SHIPPED 2026-03-31</summary>

- [x] Phase 1: Foundation & Design System (5/5 plans) — Astro 6 + Tailwind v4 + design tokens + content schemas
- [x] Phase 2: Site Shell & Navigation (3/3 plans) — Layouts, nav, mobile menu, footer, SEO meta
- [x] Phase 3: Core Pages (6/6 plans) — Visual rebuild with canvas hero, cloning shiyunlu.com design language
- [x] Phase 4: Project System & Case Studies (4/4 plans) — Card grid, case study template, 2 full case studies
- [x] Phase 5: Dark Mode, Animations & Polish (6/6 plans) — Theme system, GSAP animations, transitions, JSON-LD
- [x] Phase 6: Performance Audit & Deployment (3/3 plans) — Lighthouse 90+, Cloudflare Pages production deploy
- [x] Phase 7: Chatbot Feature (5/5 plans) — Claude Haiku chat widget with SSE streaming, focus trap, defense-in-depth security

</details>

<details>
<summary>✅ v1.1 Editorial Redesign (Phases 8-11) — SHIPPED 2026-04-15</summary>

- [x] Phase 8: Foundation (8/8 plans) — completed 2026-04-08 — MASTER.md contract, hex palette, Geist fonts, killed dark mode/GSAP/motion, deleted dead components and /resume route
- [x] Phase 9: Primitives (8/8 plans) — completed 2026-04-11 — New primitive library (Header, Footer, Container, SectionHeader, WorkRow, MetaLabel, StatusDot, MobileMenu) wired through BaseLayout
- [x] Phase 10: Page Port (8/8 plans) — completed 2026-04-13 — Every page ported to editorial compositions, chat widget restyled with localStorage persistence
- [x] Phase 11: Polish (3/3 plans) — completed 2026-04-13 — Lighthouse 100/95/100/100, WCAG AA verified, merged to main and deployed

</details>

<details>
<summary>✅ v1.2 Polish (Phases 12-16) — SHIPPED 2026-04-27</summary>

- [x] Phase 12: Tech Debt Sweep (6/6 plans) — completed 2026-04-15 — All 7 v1.1 audit items closed; zero `pnpm build` warnings; MobileMenu inert extends to `.chat-widget`; chat copy-button parity; OG URLs verified production-correct; MASTER.md §2.4 token exceptions documented
- [x] Phase 13: Content Pass + Projects/ Sync (9/9 plans) — completed 2026-04-19 — All 6 case studies real (600–900 words, Problem→Approach→Architecture→Tradeoffs→Outcome→Learnings); `Projects/*.md` as authoritative source; idempotent `scripts/sync-projects.mjs`; CONTENT-SCHEMA + VOICE-GUIDE docs
- [x] Phase 14: Chat Knowledge Upgrade (7/7 plans) — completed 2026-04-23 — Build-time `portfolio-context.json` + Anthropic prompt caching; third-person persona; prompt-injection battery GREEN; `max_tokens` 768→1500 + truncation observability; D-26 117/117 GREEN
- [x] Phase 15: Analytics Instrumentation (5/5 plans) — completed 2026-04-26 — Umami Cloud + Cloudflare Web Analytics live; recruiter-engagement events (resume download, chat open, outbound clicks, scroll depth, `chat_truncated`); cookie-free, no consent banner
- [x] Phase 16: Motion Layer (7/7 plans) — completed 2026-04-27 — Tasteful native motion (`@view-transition` fade + IntersectionObserver reveal + WorkRow arrow + chat pulse + chat panel scale-in + typing-dot bounce + word-stagger); reduced-motion contract held; zero new runtime deps; D-15 server byte-identical; D-26 117/117 GREEN; manual UAT 13/13 PASS

</details>

### v1.3 Chat Visibility (Phases 17-20) — IN PROGRESS

- [ ] **Phase 17: Foundations — Migration + DNS + Debt Sweep** — Migrate Cloudflare Pages → Workers Static Assets, verify Resend sending domain DNS, close all 5 chat tech-debt carry-forwards
- [ ] **Phase 18: Persistence + Identity — KV Write Path + sessionId** — Bind `CHAT_KV` namespace, mint UUIDv4 sessionIds, append turns to KV without leaking sessionId into Anthropic payload, capture metadata + cache-token counts per turn
- [ ] **Phase 19: Cron Sweep — Scheduling + Idempotency (DRY_RUN)** — Wire hourly cron trigger, two-keyspace partition (`live:` → `delivered:`), batch caps + structured logs, DRY_RUN flag validates sweep mechanics before email goes live
- [ ] **Phase 20: Email Render + Resend Integration** — Plaintext-only email body via Resend REST, adversarial-payload suite hardening, idempotency-key send-once, DRY_RUN flipped off — visitor conversations land in Jack's Gmail

## Phase Details

### Phase 17: Foundations — Migration + DNS + Debt Sweep

**Goal**: A single Cloudflare Worker deployment serves the static site, `/api/chat`, and a (currently no-op) `scheduled` handler from one binding; the Resend sending domain is DNS-verified and warmed; all five chat carry-forward debt items are closed — producing a non-fragile foundation for KV writes (Phase 18), cron scheduling (Phase 19), and email delivery (Phase 20).
**Depends on**: Phase 16 (v1.2 shipped)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, DNS-01, DNS-02, DEBT-01, DEBT-02, DEBT-03, DEBT-04, DEBT-05, TEST-01, TEST-02, TEST-03
**Success Criteria** (what must be TRUE):
  1. `wrangler deploy` ships the entire site as a single Worker, `jackcutrara.com` resolves to the new Worker, and the live chat widget at `/api/chat` continues streaming with byte-identical SSE frames vs. pre-migration (D-15 holds).
  2. `dig TXT _dmarc.mail.jackcutrara.com` returns a valid DMARC record (`p=none` minimum), SPF + DKIM + MX are live in Cloudflare DNS, and 5–10 manual sends from `transcripts@mail.jackcutrara.com` to Jack's Gmail land in the Inbox after "Not Spam" feedback (Postmaster Tools enrolled).
  3. The D-26 chat regression battery is 117/117 GREEN at phase close; the `#chat-panel` display state machine is CSS-only (`.is-open` controls both display and animation, `style.display='flex'` removed from `animatePanelOpen`); `astro:page-load` listeners in `analytics.ts`, `scroll-depth.ts`, and `chat.ts` register exactly once across navigations (idempotent guard verified).
  4. PRs fail-fast on local drift between `Projects/*.md` and `portfolio-context.json` via the `build:chat-context:check` job in `.github/workflows/sync-check.yml`; structured cache-hit logs (`cache_read_input_tokens` / `cache_creation_input_tokens`) emit from chat-cache + content-snapshot + chat client seams; PROJECT.md "Known issues" entry for `CHAT_RATE_LIMITER` rewritten as "documented + Free-tier acceptable."
  5. Anthropic prompt-cache integrity verified: `system` block and `messages[0]` payload do NOT contain any session identifier (snapshot test); 3x identical-payload live test within 5min returns `cache_read_input_tokens > 0` on responses 2 and 3.
**Plans**: 6 plans

Plans:

**Wave 0** *(no dependencies — Day 1 gate)*
- [ ] 17-01-PLAN.md — Capture D-15 SSE byte-identical snapshot fixture against live Pages BEFORE any migration code (TEST-02 / Day 1 gate)

**Wave 1** *(blocked on Wave 0)*
- [ ] 17-02-PLAN.md — Migrate Pages → Workers Static Assets: src/worker.ts, wrangler.jsonc rewrite, pages-compat.mjs delete, custom domain reattach (FOUND-01..04, TEST-01, TEST-02)

**Wave 2** *(blocked on Wave 1)*
- [ ] 17-03-PLAN.md — Chat-surface tech debt: DEBT-04 idempotent astro:page-load listeners + DEBT-05 CSS-only #chat-panel state machine

**Wave 3** *(blocked on Wave 2)*
- [ ] 17-04-PLAN.md — Docs/CI tech debt: DEBT-01 PROJECT.md reframe + DEBT-03 build:chat-context:check in sync-check.yml

**Wave 4** *(blocked on Waves 2 + 3)*
- [ ] 17-05-PLAN.md — Observability: DEBT-02 chat.cache_metrics log seams (server + client) + TEST-03 Anthropic payload-shape forward-defense

**Wave 5** *(blocked on Waves 1 + 4 — runs LAST against all-GREEN surface)*
- [ ] 17-06-PLAN.md — DNS-01 Resend domain records (SPF/DKIM/MX/DMARC) + DNS-02 warmup sends (5–10x) + Postmaster Tools enrollment

**Cross-cutting constraints** *(must hold across all chat-surface plans):*
- D-26 chat regression battery 117/117 GREEN — gates 17-01, 17-02, 17-03, 17-05 (every chat-surface plan; cadence per CONTEXT.md D-10: every commit + phase end)
- D-15 SSE byte-identical at `/api/chat` — fixture captured by 17-01, validated through 17-02 cutover, preserved by 17-05 DEBT-02 edit
- TEST-03 Anthropic prompt-cache integrity — `system` block and `messages[0]` payload contain NO session identifier (snapshot test in 17-05)
- D-09 locked execution order — wave dependencies enforce step 1 → 7 sequential progression

### Phase 18: Persistence + Identity — KV Write Path + sessionId

**Goal**: Every chat turn (visitor and assistant) is appended to a versioned KV transcript keyed by a client-minted UUIDv4 sessionId, with rich metadata and cache-token counts captured per turn — without leaking the sessionId into the Anthropic message payload and without regressing the D-26 chat surface.
**Depends on**: Phase 17 (Workers Static Assets target + `CHAT_KV` namespace bound)
**Requirements**: KV-01, KV-02, KV-03, KV-04, IDENT-01, IDENT-02, META-01, META-02, TEST-01, TEST-03
**Success Criteria** (what must be TRUE):
  1. After a real visitor session, `wrangler kv key get --namespace-id <prod> live:<sid>` returns a JSON value with `v: 1`, both visitor and assistant turns under `messages[]`, `started_at` / `last_activity_at`, capped at 30 turns, with `referrer` and `user_agent` truncated to ≤512 chars; the value carries `expirationTtl: 30 days` from every `put()`.
  2. `wrangler kv key list --namespace-id <prod> --prefix live:` returns each key with inline `metadata.last_activity_at` and `metadata.msg_count` (set on every put), so the cron path can filter inactive sessions without per-key `get()` round-trips.
  3. The chat client mints a sessionId via `crypto.randomUUID()` on first chat open, persists it in localStorage with `STORAGE_VERSION` bumped 1→2 (existing auto-clear path triggers), and includes it in every `/api/chat` request body; the server rejects non-UUIDv4 sessionIds at validation time.
  4. Anthropic prompt-cache integrity preserved: snapshot test confirms sessionId is absent from both the `system` block and `messages[0]` payload; live 3x identical-payload test within 5min still shows `cache_read_input_tokens > 0` on responses 2 and 3 (sessionId lives on the HTTP envelope only).
  5. Each transcript metadata block records `started_at`, `last_activity_at`, `referrer`, `user_agent`, `country` (`request.cf.country`), `region`, `colo`, `message_count`, `truncated`, plus `cache_read_input_tokens` / `cache_creation_input_tokens` per assistant turn — and the D-26 chat regression battery is 117/117 GREEN at phase close.
**Plans**: TBD

### Phase 19: Cron Sweep — Scheduling + Idempotency (DRY_RUN)

**Goal**: An hourly Cloudflare cron trigger lists `live:` transcripts, filters by `metadata.last_activity_at < now − 2h`, and runs the full two-keyspace promotion loop (`live:{sid}` → `delivered:{sid}`) under DRY_RUN — exercising every code path Phase 20 will rely on, without yet POSTing to Resend.
**Depends on**: Phase 18 (KV transcripts must exist for the sweep to find candidates)
**Requirements**: CRON-01, CRON-02, CRON-03, CRON-04
**Success Criteria** (what must be TRUE):
  1. Setting `triggers.crons` to `* * * * *` temporarily produces ≥1 invocation visible in the Worker's Past Events tab within 90 seconds, confirming the `scheduled()` handler is actually wired through `src/worker.ts` and `ctx.waitUntil(deliverDue(env))` runs without throwing.
  2. With `DRY_RUN=1`, a session whose `last_activity_at` is older than 2h is detected by the sweep, its Resend payload is logged (not POSTed), `delivered:{sid}` is PUT with 24h TTL BEFORE the would-be POST, and `live:{sid}` is DELETE'd AFTER the dry-run "success" — the same crash-safe sequencing Phase 20 will rely on.
  3. Running the sweep twice over the same KV state results in exactly one would-be Resend payload logged per session: the second run skips already-delivered candidates because `delivered:{sid}` is present (application-level idempotency holds even before Resend's idempotency key joins the defense).
  4. Per-tick batch cap of 50 sessions, send-attempt counter cap of 3 retries, and pagination hard-cap of 50 pages all enforced; per-session try/catch isolates failures so one bad session never aborts the sweep; structured JSON logs surface per-tick summary (sessions_seen, sessions_due, sessions_promoted, errors).
**Plans**: TBD

### Phase 20: Email Render + Resend Integration

**Goal**: Visitor conversations actually land in Jack's Gmail — every adversarial payload renders as literal text, every send is idempotent, every header is server-controlled, the body is plaintext-only, and DRY_RUN is flipped off in production with confidence.
**Depends on**: Phase 19 (cron sweep mechanics validated under DRY_RUN)
**Requirements**: MAIL-01, MAIL-02, MAIL-03, MAIL-04, MAIL-05
**Success Criteria** (what must be TRUE):
  1. After DRY_RUN is flipped off, a real ended chat session results in exactly one email landing in Jack's Gmail Inbox (not Spam) within 3 hours of last activity — From: `transcripts@mail.jackcutrara.com`, Reply-To: `jackcutrara@gmail.com`, Subject: `[Portfolio chat] N turns from <country> via <referrer-host>` — body opens with the provenance line, contains a metadata header block (timestamps, country, referrer, msg count, cache-hit summary), then `>>> visitor:` / `<<< bot:` turn markers.
  2. Email body uses the Resend `text` field only — `html` field is absent — and every dynamic field (user content, bot content, referrer, user-agent, country) is HTML-escaped at render time even though the body is plaintext (defense in depth for any future v1.4+ HTML migration).
  3. Adversarial-payload unit suite covers `<script>` injection, `</p><img onerror=...>`, `javascript:` URLs, RTL/Unicode bidi overrides (`U+202A..U+202E`, `U+2066..U+2069`), null bytes, and social-engineering provenance prefixes (e.g. visitor typing "From: chat widget on jackcutrara.com") — Gmail renders all payloads as literal text and CR/LF stripped from every header component.
  4. Resend idempotency holds: every POST carries `Idempotency-Key: transcript/{sessionId}`; running the sweep twice over the same delivered session results in exactly one delivered email (Resend returns `idempotency_replay: true` on the second attempt); 5xx errors retry with the same key under exponential backoff.
  5. `src/lib/email/resend.ts` is a thin `fetch()` wrapper to `https://api.resend.com/emails` — zero new npm dependencies introduced (`package.json` `dependencies` byte-identical phase-wide); no Node-runtime APIs called.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order within each milestone.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Design System | v1.0 | 5/5 | Complete | 2026-03-22 |
| 2. Site Shell & Navigation | v1.0 | 3/3 | Complete | 2026-03-23 |
| 3. Core Pages | v1.0 | 6/6 | Complete | 2026-03-25 |
| 4. Project System & Case Studies | v1.0 | 4/4 | Complete | 2026-03-27 |
| 5. Dark Mode, Animations & Polish | v1.0 | 6/6 | Complete | 2026-03-31 |
| 6. Performance Audit & Deployment | v1.0 | 3/3 | Complete | 2026-03-31 |
| 7. Chatbot Feature | v1.0 | 5/5 | Complete | 2026-04-04 |
| 8. Foundation | v1.1 | 8/8 | Complete | 2026-04-08 |
| 9. Primitives | v1.1 | 8/8 | Complete | 2026-04-11 |
| 10. Page Port | v1.1 | 8/8 | Complete | 2026-04-13 |
| 11. Polish | v1.1 | 3/3 | Complete | 2026-04-13 |
| 12. Tech Debt Sweep | v1.2 | 6/6 | Complete | 2026-04-15 |
| 13. Content Pass + Projects/ Sync | v1.2 | 9/9 | Complete | 2026-04-19 |
| 14. Chat Knowledge Upgrade | v1.2 | 7/7 | Complete | 2026-04-23 |
| 15. Analytics Instrumentation | v1.2 | 5/5 | Complete | 2026-04-26 |
| 16. Motion Layer | v1.2 | 7/7 | Complete | 2026-04-27 |
| 17. Foundations — Migration + DNS + Debt Sweep | v1.3 | 0/6 | Not started | - |
| 18. Persistence + Identity — KV Write Path + sessionId | v1.3 | 0/0 | Not started | - |
| 19. Cron Sweep — Scheduling + Idempotency (DRY_RUN) | v1.3 | 0/0 | Not started | - |
| 20. Email Render + Resend Integration | v1.3 | 0/0 | Not started | - |
