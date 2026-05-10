---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: Chat Visibility
status: ready_to_execute
last_updated: "2026-05-10T00:00:00Z"
last_activity: 2026-05-10 -- Phase 17 planned via /gsd-plan-phase 17. 6 plans authored across 6 sequential waves (D-09 ordering preserved). Plan checker verification passed (1 blocker + 6 warnings → all 7 fixed in 1 revision iteration). Ready for /gsd-execute-phase 17.
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 6
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-09)

**Core value:** Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing
**Current focus:** v1.3 Chat Visibility — roadmap locked, Phase 17 awaiting plan

## Current Position

Phase: Phase 17 — Foundations: Migration + DNS + Debt Sweep (planned, 0/6)
Plan: 17-01 (Wave 0, ready to execute)
Status: 6 plans authored at `.planning/phases/17-foundations-migration-dns-debt-sweep/17-{01..06}-PLAN.md`; RESEARCH.md, PATTERNS.md, VALIDATION.md committed; plan-checker verification passed; awaiting `/gsd-execute-phase 17`
Last activity: 2026-05-10 — Phase 17 plan-phase complete (6 plans, 6 waves, sequential D-09 ordering, all 14 reqs covered, all 15 CONTEXT decisions referenced, threat models in all plans)

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

Last session: 2026-05-10T00:00:00Z
Stopped at: Phase 17 planned. 6 plans + RESEARCH.md + PATTERNS.md + VALIDATION.md committed. Plan-checker verification PASSED (iteration 2 of 3 max — all blocker + warning fixes from iteration 1 applied correctly).
Resume file: .planning/phases/17-foundations-migration-dns-debt-sweep/17-01-PLAN.md (Wave 0 entry point)
Next command: `/gsd-execute-phase 17`
