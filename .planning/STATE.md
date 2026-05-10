---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: Chat Visibility
status: executing
last_updated: "2026-05-10T22:35:00Z"
last_activity: 2026-05-10 -- Plan 17-03 executed (DEBT-04 idempotent astro:page-load listener registration + DEBT-05 CSS-only #chat-panel display state machine, both closed under the new Worker). 2 task commits (0ad77b3 DEBT-04 across analytics/scroll-depth/chat, 1c148c9 DEBT-05 global.css + chat.ts no-op animatePanel stubs). D-26 117/117+ GREEN at every commit; full suite 354 → 370 tests (+16 additive: 9 listener-dedup + 3 chat-panel-display + 4 no-imperative-display-flip). 1 Rule-1 deviation (chat-pulse-coordination.test.ts rewrite — Phase 7 assertions contradicted DEBT-05 closure). Plan 17-04 (Wave 3 -- DEBT-01 PROJECT.md reframe + DEBT-03 build:chat-context:check CI job) unblocked.
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 6
  completed_plans: 3
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-09)

**Core value:** Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing
**Current focus:** v1.3 Chat Visibility — roadmap locked, Phase 17 awaiting plan

## Current Position

Phase: Phase 17 — Foundations: Migration + DNS + Debt Sweep (executing, 3/6)
Plan: 17-04 (Wave 3, ready to execute — DEBT-01 PROJECT.md "Known issues" reframe + DEBT-03 build:chat-context:check parallel job in .github/workflows/sync-check.yml)
Status: Plan 17-03 COMPLETE — DEBT-04 + DEBT-05 chat-surface tech debt closed under the new Worker. analytics.ts / scroll-depth.ts / chat.ts all use idempotent astro:page-load registration (remove-then-add at document level replaces module-level *Bootstrapped flags). #chat-panel display contract is CSS-only via `.is-open` class in global.css; animatePanelOpen / animatePanelClose are no-op async stubs preserving await semantics. D-26 chat-surface battery 145/145 GREEN; full suite 369/370 (1 pre-existing roadmap-amendment failure carried forward from 17-01). Plan 17-04 (docs/CI debt — DEBT-01 + DEBT-03) is next; does NOT touch the chat surface so D-26 cadence is informational rather than blocking there.
Last activity: 2026-05-10T22:35:00Z — Plan 17-03 executed in ~7min implementation (clean TDD, no checkpoints). 2 atomic commits (0ad77b3 DEBT-04, 1c148c9 DEBT-05). Test count delta 354 → 370 (+16 additive: 9 listener-dedup + 3 chat-panel-display + 4 no-imperative-display-flip). 1 Rule-1 deviation auto-fixed (chat-pulse-coordination.test.ts Phase 7 "display toggle preserved" suite rewritten to assert .is-open class toggle, not inline style.display — the previous assertions contradicted DEBT-05 closure and would have failed the TEST-01 D-26 GREEN gate). DEBT-04 + DEBT-05 marked implemented in REQUIREMENTS.md.

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

Plan 17-03 execution decisions (2026-05-10) — DEBT-04 + DEBT-05 chat-surface tech debt closure:

- **Idempotent astro:page-load listener pattern adopted across the chat surface.** Three modules (`src/scripts/analytics.ts`, `src/scripts/scroll-depth.ts`, `src/scripts/chat.ts`) now use remove-then-add at the document level instead of module-level `*Bootstrapped` flags. Browser's internal (target, type, handler) registry dedups by reference equality, so `removeEventListener` BEFORE `addEventListener` is a safe identity operation that converges to "this handler reference is in the registry exactly once." `typeof document !== "undefined"` guard added to chat.ts for HMR/test parity with the other two files. **Future chat-surface modules that register an astro:page-load listener MUST follow this pattern** — the listener-dedup test extends trivially via the `CHAT_SURFACE_MODULES` constant + it.each. This is the canonical idiom per RESEARCH §"Pattern 3 — Don't Hand-Roll".
- **CSS-only chat-panel display state machine adopted (DEBT-05).** `src/styles/global.css` now declares `display: none` on the base `#chat-panel` rule and `display: flex` on `#chat-panel.is-open` — both outside the `@media (prefers-reduced-motion: no-preference)` block, so the display contract applies equally to reduce-motion users. The keyframe `chat-panel-scale-in` rule is unchanged. `animatePanelOpen` / `animatePanelClose` in chat.ts are no-op async stubs (`async function animatePanel*(_panel: HTMLElement): Promise<void> { /* no-op */ }`) — call sites that `await` them for keyframe-completion timing do not change shape. **Future view-toggle UI in this codebase (mobile menu, modal overlay, etc.) should follow the same shape**: base-rule display:none + `.is-open` display:flex, animation gated under the no-preference media query. The Phase 7 chat panel was the last imperative-display holdout in the codebase.
- **Source-text anti-regression test pattern adopted.** `tests/build/no-imperative-display-flip.test.ts` greps `src/scripts/chat.ts` for forbidden imperative patterns (`panel.style.display = "flex"` / `"none"`). Cheap to write; catches regressions that would pass behavioral tests but reintroduce the imperative path. Already used at `tests/api/chat.test.ts:259-289` for prompt-cache integrity; now also for DEBT-05.
- **chat-pulse-coordination.test.ts assertion rewrite was unavoidable (Rule 1 deviation).** The Phase 7 "display toggle preserved" suite (2 tests) asserted `panel.style.display === "flex"` / `"none"` — the exact behavior DEBT-05 removes. Leaving the assertions untouched would have failed the TEST-01 D-26 GREEN gate. Rewrote the assertions to the new contract (`.is-open` class toggle + `panel.style.display !== "flex"`). **Future plan-authoring pattern: any plan that removes an imperative behavior must audit existing tests that assert the imperative behavior and list them in `files_modified` at plan-time.** The 17-03 plan frontmatter under-counted the test files by 1.
- **Plan-spec'd `vi.resetModules() + re-import N` behavioral test approach has a fundamental vitest-jsdom constraint that surfaced cleanly during Task 1.** Each re-evaluation creates a new handler reference; the new evaluation's `removeEventListener` does not remove the prior evaluation's registration because the references differ. Strengthened the test surface beyond the plan minimum with source-level pattern assertions (Rule 2 deviation) — the canonical anti-regression invariant is the source-text pattern, not the runtime behavioral consequence. Production behavior is unchanged because Astro re-runs astro:page-load WITHOUT re-evaluating the module (stable handler reference from the original evaluation).

### Open Blockers (carried into v1.3)

The following items move into v1.3 scope as the chat tech debt sweep (all close in Phase 17):

- `CHAT_RATE_LIMITER` Cloudflare binding never configured on Production or Preview (pre-existing Phase 7 carry-forward; rate-limiter code path defensively skips when binding absent — code path byte-identical from Phase 7). Tracked at `.planning/todos/pending/2026-04-23-configure-chat-rate-limiter-binding.md`. Closure path: documented + Free-tier acceptable per locked decision (DEBT-01) — scheduled for Plan 17-04.
- Chat cache-hit-rate observability not yet wired (Phase 14 deferred). Tracked at `.planning/todos/pending/2026-04-23-chat-cache-hit-rate-observability.md`. Closure path: structured log seams in chat-cache + content-snapshot + chat client (DEBT-02) — scheduled for Plan 17-05.
- `build:chat-context:check` not enforced in CI — deploy auto-regenerates so production never stale, but PRs cannot fail-fast on local drift. Closure path: parallel job in `.github/workflows/sync-check.yml` (DEBT-03) — scheduled for Plan 17-04.
- ~~`#chat-panel` JS-coupled display contract — `animatePanelOpen` flips `style.display='flex'` directly while `.is-open` only animates.~~ **CLOSED 2026-05-10 in Plan 17-03 (commit `1c148c9`)** — DEBT-05 closed. `.is-open` class in global.css now controls both display (display:none base → display:flex on .is-open) AND the existing keyframe scale-in animation. animatePanelOpen / animatePanelClose are no-op async stubs preserving await semantics.
- ~~WR-01 bootstrap listener registers without dedup (`analytics.ts:140-147`, `scroll-depth.ts:63-70`, `chat.ts:870-877`) — no observable double-count due to `*Initialized` guards, but long sessions could accumulate listeners.~~ **CLOSED 2026-05-10 in Plan 17-03 (commit `0ad77b3`)** — DEBT-04 closed. All three modules use remove-then-add at document level; browser API contract makes the registration idempotent regardless of module re-evaluation.

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

Last session: 2026-05-10T22:35:00Z
Stopped at: Plan 17-03 COMPLETE (Wave 2 -- DEBT-04 idempotent astro:page-load listener registration + DEBT-05 CSS-only #chat-panel display state machine, both closed under the new Worker). 2 atomic task commits (0ad77b3 DEBT-04 across analytics/scroll-depth/chat with new listener-dedup test, 1c148c9 DEBT-05 global.css + chat.ts no-op animatePanel stubs + 2 new tests + chat-pulse-coordination assertion rewrite). D-26 chat-surface battery 145/145 GREEN; full vitest suite 369/370 (1 pre-existing roadmap-amendment failure carried forward from 17-01). Test count delta 354 → 370 (+16 additive).
Resume file: .planning/phases/17-foundations-migration-dns-debt-sweep/17-04-PLAN.md (Wave 3 -- DEBT-01 PROJECT.md "Known issues" reframe + DEBT-03 build:chat-context:check parallel job in .github/workflows/sync-check.yml)
Next command: Continue Phase 17 via `/gsd-execute-phase 17` (executor will pick up at Plan 17-04 — docs/CI debt; does NOT touch chat surface)
