---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: Chat Visibility
status: executing
last_updated: "2026-05-10T22:10:21Z"
last_activity: 2026-05-10 -- Plan 17-02 executed (Pages → Workers Static Assets migration COMPLETE). 3 task commits (54cc8e7 worker.ts+tests, e056619 wrangler.jsonc rewrite + pages-compat deletion, 792dd76 WORKERS_PREVIEW_SUFFIX rename). Production cutover live at https://jackcutrara.com on new Worker; D-15 byte-identical verified on jackcutrara.com + www.jackcutrara.com; D-26 117/117 GREEN; parking-page CNAME pitfall caught and resolved inline. Pages retirement PENDING 24h warm window. Plan 17-03 (Wave 2 -- DEBT-04 + DEBT-05) unblocked.
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 6
  completed_plans: 2
  percent: 33
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-09)

**Core value:** Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing
**Current focus:** v1.3 Chat Visibility — roadmap locked, Phase 17 awaiting plan

## Current Position

Phase: Phase 17 — Foundations: Migration + DNS + Debt Sweep (executing, 2/6)
Plan: 17-03 (Wave 2, ready to execute — DEBT-04 idempotent astro:page-load listeners + DEBT-05 CSS-only #chat-panel state machine)
Status: Plan 17-02 COMPLETE — Pages → Workers Static Assets migration shipped. Production live at https://jackcutrara.com (jack-cutrara-portfolio Worker, account subdomain `jackcutrara`). CHAT_KV provisioned (prod `eaa30fef259e4a6b9505b41bbf3f8f01`, preview `115f3c1b0f8a4a1da9fee78c48dcb749`). 3 secrets re-added (ANTHROPIC_API_KEY, CHAT_RECIPIENT_EMAIL, CHAT_SENDER_EMAIL); RESEND_API_KEY deferred to Plan 17-06. Workers Builds Git connection live. D-15 byte-identical verified on jackcutrara.com + www.jackcutrara.com post-flip. D-26 117/117 GREEN. Pages retirement pending 24h warm window per D-02. Plan 17-03 picks up against the live Worker.
Last activity: 2026-05-10T22:10:21Z — Plan 17-02 executed in ~33min implementation + ~2h manual checkpoints. 3 atomic commits (54cc8e7, e056619, 792dd76) + 2 PASSED human-action checkpoints. FOUND-01..04 + TEST-01 + TEST-02 marked implemented (FOUND-03 Pages-retired sub-goal pending warm window).

## Roadmap Snapshot

| Phase | Name | Requirements | Depends on |
|-------|------|--------------|------------|
| 17 | Foundations — Migration + DNS + Debt Sweep | FOUND-01..04, DNS-01..02, DEBT-01..05, TEST-01, TEST-02, TEST-03 | Phase 16 (v1.2 shipped) |
| 18 | Persistence + Identity — KV Write Path + sessionId | KV-01..04, IDENT-01..02, META-01..02, TEST-01, TEST-03 | Phase 17 |
| 19 | Cron Sweep — Scheduling + Idempotency (DRY_RUN) | CRON-01..04 | Phase 18 |
| 20 | Email Render + Resend Integration | MAIL-01..05 | Phase 19 |

**Coverage:** 31 / 31 requirements mapped (28 v1.3 requirements + 3 cross-phase TEST gates).

## Accumulated Context

### Decisions

All milestone-level decisions logged in PROJECT.md Key Decisions table. Full plan-level decision history retained in `.planning/milestones/v1.2-phases/*/SUMMARY.md` and `.planning/RETROSPECTIVE.md`.

v1.3 architectural decisions (locked at `/gsd-new-milestone` 2026-05-09):

- **Storage = Cloudflare KV** (not D1) — no aggregation/search needed; Jack reads every transcript in entirety
- **Delivery = Resend transactional email** — justified new runtime dep; v1.2 "zero new runtime deps preferred" rule overridden when there's real need
- **Cadence = hourly cron + 2-hour inactivity threshold** — generous; conversations virtually guaranteed not to fragment across emails
- **Posture = silent logging** — no in-UI disclosure; data never leaves Cloudflare → Gmail
- **Filter = none** — site traffic low enough to read every conversation; no recruiter-vs-visitor classification

v1.3 phase-shape decisions (locked at `/gsd-roadmap-phase` 2026-05-09):

- **4 phases (17-20)** — derived from natural delivery boundaries: Foundations (migration + DNS + debt) → Persistence + Identity (KV writes + sessionId) → Cron Sweep (scheduling under DRY_RUN) → Email Render (Resend + adversarial-payload hardening, DRY_RUN flipped off)
- **Phase 17 absorbs all 5 DEBT items** alongside the migration — they touch the same files (`chat.ts`, `api/chat.ts`, `BaseLayout.astro`, `global.css`), so coupling them with the migration minimizes the number of times we open the chat regression risk surface
- **Phase 21 (Observability + Hardening)** explicitly DEFERRED to v1.4+ — webhook + per-IP rate limiting + Analytics Engine all out of scope for this milestone
- **Pages → Workers Static Assets** chosen over "separate sweeper Worker" fallback (Option a vs Option b in research SUMMARY.md) — single deploy target; matches Cloudflare's documented forward path; Astro is now Cloudflare-owned

Plan 17-01 execution decisions (2026-05-10):

- **Day-1 D-04/D-11 ordering enforced at commit level**, not just plan level. Fixture committed as a standalone commit (`d6c2f0e`) BEFORE the test commit (`a4d5db6`). Fixture exists in git history independently of the test that consumes it.
- **Mock `cloudflare:workers` virtual module at the test seam**, not by refactoring `src/pages/api/chat.ts`. First time this seam is exercised in vitest; pattern documented in `.planning/phases/17-foundations-migration-dns-debt-sweep/17-01-SUMMARY.md` for reuse.
- **Canonical SSE bytes are 38, not 36** — plan arithmetic miscount corrected. `data: {"text":"Hello"}\n\n` is 24 bytes; `data: [DONE]\n\n` is 14 bytes. Fixture matches server output byte-for-byte; test asserts byte-equality against fixture file (no hardcoded length). Logged as Rule 1 deviation in SUMMARY.

Plan 17-02 execution decisions (2026-05-10) — Pages → Workers Static Assets migration:

- **Account-subdomain-scoped CORS captured AFTER first deploy.** WORKERS_PREVIEW_SUFFIX = `.jackcutrara.workers.dev` (NOT generic `.workers.dev`). The `jackcutrara` account subdomain is load-bearing — foreign Cloudflare accounts cannot register a colliding Worker name on the same suffix and bypass the allow-list. Future account-rename runbook must update `src/lib/validation.ts:WORKERS_PREVIEW_SUFFIX` constant in lockstep.
- **Parking-page CNAME pitfall caught inline (Rule 3 - Blocking).** Leftover `www → parkingpage.namecheap.com` CNAME from Namecheap's parking page blocked the `www.jackcutrara.com` Custom Domain attach with "domain already in use" error AND caused initial SSL 525 handshake fail. Deleted the parking-page CNAME → www attached cleanly → Cloudflare auto-provisioned SSL within seconds. **Future-migration pattern: BEFORE initiating any Cloudflare Custom Domain attach, audit ALL existing CNAMEs at apex AND every subdomain being flipped.** Parking-page residues are a known class of pitfall when migrating from registrars (Namecheap, GoDaddy, etc.) that enable parking pages by default.
- **Astro auto-provisions a SESSION KV namespace at build time** — `5d7c7a5749e24383a4eb256dd39a4ff4`, declared in `dist/server/wrangler.json` by the `@astrojs/cloudflare` adapter for its session-driver feature. NOT in our checked-in `wrangler.jsonc`. This is adapter-internal and invisible to FOUND-04 verification. **Future plans MUST NOT name their own KV binding `SESSION`** — would conflict with the adapter's auto-injected binding. CHAT_KV (Phase 18 KV-01) is safe; pattern: prefix custom bindings with `CHAT_*`.
- **Custom Worker entrypoint pattern (src/worker.ts) replaces `@astrojs/cloudflare/entrypoints/server`** — the bundled adapter entrypoint exports only `{ fetch }` and could not host a `scheduled()` handler. Phase 19 cron-sweep was blocked without this file. src/worker.ts re-exports Astro's `handle()` for fetch + Phase 19-ready scheduled() stub with `ctx.waitUntil(Promise.resolve())` placeholder + comment naming the `deliverDue` substitution target.
- **Pages-as-warm-rollback per D-02 — gated check, NOT a timer per CONTEXT.md A3.** Custom Domains detached from Pages FIRST, attached to Worker SECOND. Pages deployment stays live (domain-less) for 24h gated window starting ~2026-05-10 22:00 UTC. User retires manually after clean window AND no open regressions.
- **Cloudflare Access policy audit (Q2 RESOLVED) confirmed assumption** — Zero Trust was never enabled on this account, so 0 Access policies on `portfolio-5wl.pages.dev`. Worker preview URLs are public per Cloudflare default, matching prior Pages posture byte-identical. No policy replication needed before Custom Domain flip.
- **RESEND_API_KEY explicitly NOT re-added in Plan 17-02 per plan D-05.** Three secrets re-added: ANTHROPIC_API_KEY (re-keyed from Pages — secrets do NOT migrate per RESEARCH Pitfall 9), CHAT_RECIPIENT_EMAIL (`jackcutrara@gmail.com`), CHAT_SENDER_EMAIL (`"Portfolio Chat" <transcripts@mail.jackcutrara.com>`). RESEND_API_KEY lives in Plan 17-06 alongside Resend account creation.
- **Sharpened security.test.ts beyond plan minimum.** Added explicit `https://attacker.workers.dev REJECTED` test (Rule 2 - Missing Critical) guarding the foreign-account-subdomain attack vector (T-17-02). Logic unchanged (rename only per D-14); test surface now stronger than pre-migration.
- **Plan 17-06 DNS triage open: pre-existing Resend records on send.jackcutrara.com.** When auditing DNS pre-flip, observed existing records on the `send.` subdomain (MX `send.`, TXT `_dmarc`, TXT `resend._domainkey`, TXT `send "v=spf1 include:amazon..."`) — pre-existing Resend SES setup. But Plan 17-06 D-06 spec'd `mail.jackcutrara.com` as the canonical sending subdomain. **Mismatch flagged for triage at Plan 17-06 execution time** (re-use existing `send.*` records vs add fresh `mail.*` records). Out of scope for Plan 17-02.

### Open Blockers (carried into v1.3)

The following items move into v1.3 scope as the chat tech debt sweep (all close in Phase 17):

- `CHAT_RATE_LIMITER` Cloudflare binding never configured on Production or Preview (pre-existing Phase 7 carry-forward; rate-limiter code path defensively skips when binding absent — code path byte-identical from Phase 7). Tracked at `.planning/todos/pending/2026-04-23-configure-chat-rate-limiter-binding.md`. Closure path: documented + Free-tier acceptable per locked decision (DEBT-01).
- Chat cache-hit-rate observability not yet wired (Phase 14 deferred). Tracked at `.planning/todos/pending/2026-04-23-chat-cache-hit-rate-observability.md`. Closure path: structured log seams in chat-cache + content-snapshot + chat client (DEBT-02).
- `build:chat-context:check` not enforced in CI — deploy auto-regenerates so production never stale, but PRs cannot fail-fast on local drift. Closure path: parallel job in `.github/workflows/sync-check.yml` (DEBT-03).
- `#chat-panel` JS-coupled display contract — `animatePanelOpen` flips `style.display='flex'` directly while `.is-open` only animates. Closure path: CSS-only state machine, `.is-open` controls both display and animation (DEBT-05).
- WR-01 bootstrap listener registers without dedup (`analytics.ts:140-147`, `scroll-depth.ts:63-70`, `chat.ts:870-877`) — no observable double-count due to `*Initialized` guards, but long sessions could accumulate listeners. Closure path: idempotent `astro:page-load` guard (DEBT-04).

Carry-forwards NOT in v1.3 scope (out-of-scope for this milestone):

- Mobile menu breakpoint 380px → 768px UX revision (`.planning/todos/pending/2026-04-15-change-mobile-menu-breakpoint-from-380px-to-768px.md`).
- OG default image authoring (`.planning/todos/pending/2026-04-15-design-and-ship-og-default-image.md`).

## Deferred Items

Items deferred from v1.2 still applicable:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Chat | RAG / vector DB | Deferred (corpus too small) | v1.2 planning |
| Chat | Function-calling chat tools (`getProject`, `listProjects`) | Deferred (SSE complexity) | v1.2 planning |
| Chat | Keyword routing | Deferred (only if Anthropic spend > $5/mo) | v1.2 planning |
| Chat | 1-hour cache TTL | Current 5-minute TTL (D-14) sufficient | Phase 14 close-out 2026-04-23 |
| Chat | Live-API injection test suite automation | CI scheduling deferred | Phase 14 close-out 2026-04-23 |
| Chat | `Projects/7 — MULTI-DEX CRYPTO TRADER` inclusion | MDX conversion + relevance tagging deferred | Phase 14 close-out 2026-04-23 |
| Motion | Signature hero moment | User-excluded for v1.2 | v1.2 planning |
| Motion | Project → project view-transition-name morph | Deferred to v1.3+ | v1.2 planning |
| Analytics | ANAL-02 §7 preview-subdomain silence check | Deferred to next branch deploy | Phase 15 close-out 2026-04-26 |

Items deferred at v1.3 roadmap time (locked):

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Chat Visibility | `/api/resend-webhook` with Svix HMAC (bounce/complaint/delivered) | Deferred to v1.4+ | v1.3 roadmap 2026-05-09 |
| Chat Visibility | Per-IP session rate limit (transcript spam prevention) | Deferred to v1.4+ | v1.3 roadmap 2026-05-09 |
| Chat Visibility | HTML email body | Deferred — re-evaluate threat model only if plaintext friction reported | v1.3 roadmap 2026-05-09 |
| Chat Visibility | Workers Paid plan upgrade (binds `CHAT_RATE_LIMITER`) | Deferred — Free-tier acceptable; reconsider on traffic threshold | v1.3 roadmap 2026-05-09 |
| Chat Visibility | Cloudflare Workers Analytics Engine for transcript metrics | Deferred — anchor decision: Jack reads every email | v1.3 roadmap 2026-05-09 |
| Chat Visibility | Phase 21 Observability + Hardening (research SUMMARY.md optional phase) | Deferred to v1.4+ | v1.3 roadmap 2026-05-09 |

## Session Continuity

Last session: 2026-05-10T22:10:21Z
Stopped at: Plan 17-02 COMPLETE (Wave 1 -- Pages → Workers Static Assets migration shipped). 3 atomic task commits (54cc8e7 worker.ts + build tests, e056619 wrangler.jsonc rewrite + pages-compat deletion + no-mdx-bundle test, 792dd76 WORKERS_PREVIEW_SUFFIX rename + sharpened security tests) + 2 PASSED human-action checkpoints (KV provisioning, secret re-adds, first deploy + WB Git connection + Access audit, Custom Domain reattach with inline parking-page CNAME fix). Production live at https://jackcutrara.com. D-15 byte-identical + D-26 117/117 GREEN. Pages retirement pending 24h warm window.
Resume file: .planning/phases/17-foundations-migration-dns-debt-sweep/17-03-PLAN.md (Wave 2 -- DEBT-04 idempotent astro:page-load listeners + DEBT-05 CSS-only #chat-panel state machine)
Next command: Continue Phase 17 via `/gsd-execute-phase 17` (executor will pick up at Plan 17-03)
