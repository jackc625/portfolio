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

- [x] **Phase 17: Foundations — Migration + DNS + Debt Sweep** — CLOSED 2026-05-11 (6/6 baseline plans, all 14 requirements GREEN). RE-OPENED 2026-05-11 for gap closure (Wave 7-10 serial: UAT 17-UAT.md surfaced 4 blockers + 1 release blocker). Gap closure COMPLETE 2026-05-11 (10/10 plans, 100%): Wave 7 (Plan 17-07) closed UAT-GAP-01 chat voice-split regression via about-chat.ts + per-MDX chatSummary + broadened leak guard + system-prompt.ts hardening + 21 voice-split tests; Wave 8 (Plan 17-09) closed UAT-GAP-03 COPY button feedback window via new .chat-copy-btn.copy-success CSS rule + chat.ts shared COPY_FEEDBACK_MS = 1500 const + M3 inline-color-write deletion (CSS class single source of truth) + 10-test chat-copy-button.test.ts; Wave 9 (Plan 17-10) closed UAT-GAP-04 cross-document AbortError via head-level <script is:inline> pageswap handler in BaseLayout.astro (B5 raw script body) + MOTION.md §5 MOTN-01 rejection-handling spec amendment (B6 v1.3.1 changelog) + 4 build-time source-text tests using M5 multi-line regex; Wave 10 (Plan 17-08) closed UAT-GAP-02 #chat-panel inline display:none removal via single Edit on ChatWidget.astro + 5-test chat-panel-display.test.ts fixture rewrite + new tests/build/no-inline-display-on-chat-panel.test.ts source-text guard + Rule 3 inline deviation (commit 7af2841) closing late-surfacing dev-403 regression via WR-04 ALLOW_LOOPBACK three-signal disjunction (regression-locked by tests/build/validation-loopback-source.test.ts) + Rule 3 cleanup absorbing 4-plan-deep tests/client/listener-dedup.test.ts ts(7006) typecheck debt (pnpm exec astro check now 0/0/0 cleanly for first time since Plan 17-03 commit 0ad77b3) + DEPLOY-GATE.md operator-signed status=confirmed gate=CONFIRMED by Jack Cutrara 2026-05-11 (all six manual UAT checks PASSED against post-fix HEAD 7af2841 via chat-reply "approved — deploy gate cleared" as durable audit trail per option 2). Phase-end pnpm test = 419 PASS / 0 FAIL / 2 SKIP. pnpm exec astro check = 0/0/0. pnpm build = clean. D-26 chat-surface regression battery 30/30 GREEN. D-15 SSE byte-identical anchor PRESERVED. Local main 38 commits ahead of origin/main at HEAD 7af2841 (39 after Plan 17-08 metadata commit). DEPLOY-GATE.md operator-cleared next `git push origin main` — user controls actual push. After deploy: Pages retirement (FOUND-03 sub-task) unblocks via 24h warm window per D-02; user retires Pages manually via Cloudflare dashboard once jackcutrara.com on Worker is observed clean.
- [x] **Phase 18: Persistence + Identity — KV Write Path + sessionId** — Bind `CHAT_KV` namespace, mint UUIDv4 sessionIds, append turns to KV without leaking sessionId into Anthropic payload, capture metadata + cache-token counts per turn (completed 2026-05-11)
- [x] **Phase 19: Cron Sweep — Scheduling + Idempotency (DRY_RUN)** — Wire hourly cron trigger, two-keyspace partition (`live:` → `delivered:`), batch caps + structured logs, DRY_RUN flag validates sweep mechanics before email goes live (completed 2026-05-12)
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
**Plans**: 6 plans + 4 gap-closure plans (UAT 17-UAT.md identified 4 gaps; planned via /gsd-plan-phase --gaps)

Plans:

**Wave 0** *(no dependencies — Day 1 gate)*
- [x] 17-01-PLAN.md — Capture D-15 SSE byte-identical snapshot fixture against live Pages BEFORE any migration code (TEST-02 / Day 1 gate) — *COMPLETE 2026-05-10; commits `d6c2f0e` (fixture) + `a4d5db6` (test); see [17-01-SUMMARY.md](phases/17-foundations-migration-dns-debt-sweep/17-01-SUMMARY.md)*

**Wave 1** *(blocked on Wave 0)*
- [x] 17-02-PLAN.md — Migrate Pages → Workers Static Assets: src/worker.ts, wrangler.jsonc rewrite, pages-compat.mjs delete, custom domain reattach (FOUND-01..04, TEST-01, TEST-02) — *COMPLETE 2026-05-10; commits `54cc8e7` (worker.ts + build tests) + `e056619` (wrangler.jsonc + pages-compat delete + no-mdx-bundle test) + `792dd76` (WORKERS_PREVIEW_SUFFIX rename); production live at https://jackcutrara.com on jack-cutrara-portfolio Worker; Pages retirement pending 24h warm window per D-02; see [17-02-SUMMARY.md](phases/17-foundations-migration-dns-debt-sweep/17-02-SUMMARY.md)*

**Wave 2** *(blocked on Wave 1)*
- [x] 17-03-PLAN.md — Chat-surface tech debt: DEBT-04 idempotent astro:page-load listeners + DEBT-05 CSS-only #chat-panel state machine — *COMPLETE 2026-05-10; commits `0ad77b3` (DEBT-04 across analytics/scroll-depth/chat with listener-dedup test) + `1c148c9` (DEBT-05 global.css + chat.ts no-op animatePanel stubs + chat-panel-display test + no-imperative-display-flip test); D-26 145/145 GREEN; full suite 369/370 (1 pre-existing); +16 tests; see [17-03-SUMMARY.md](phases/17-foundations-migration-dns-debt-sweep/17-03-SUMMARY.md)*

**Wave 3** *(blocked on Wave 2)*
- [x] 17-04-PLAN.md — Docs/CI tech debt: DEBT-01 PROJECT.md reframe + DEBT-03 build:chat-context:check in sync-check.yml — *COMPLETE 2026-05-10; commits `65c2749` (DEBT-01 PROJECT.md Known issues entry reframed to "documented + Free-tier acceptable" per v1.3 milestone-shape lock + STATE.md audit + new tests/build/project-md-debt-01.test.ts 6/6 GREEN) + `e46aa2d` (DEBT-03 sync-check.yml step + 7-path trigger surface); plan touched NO chat surface — D-26 cadence informational; full suite 375 PASS / 1 FAIL (pre-existing roadmap-amendment carry-forward); +6 additive tests; see [17-04-SUMMARY.md](phases/17-foundations-migration-dns-debt-sweep/17-04-SUMMARY.md)*

**Wave 4** *(blocked on Waves 2 + 3)*
- [x] 17-05-PLAN.md — Observability: DEBT-02 chat.cache_metrics log seams (server + client) + TEST-03 Anthropic payload-shape forward-defense — *COMPLETE 2026-05-10; commits `7c3827e` (DEBT-02 server seam — `else if (event.type === "message_start")` branch in api/chat.ts emits structured `chat.cache_metrics` log with 4 flat-primitive token fields; new tests/api/cache-hit-logs.test.ts 3/3 GREEN; D-15 SSE-snapshot anchor preserved — no controller.enqueue() touched) + `e54f09d` (DEBT-02 client seam — `chat.response_metrics_client` DEV-only log in chat.ts streamChat() finally-block emits `elapsed_ms` as cache-hit proxy; Vite tree-shakes under `import.meta.env.DEV`; Rule 3 auto-fix: typecheck-annotate find() callbacks in cache-hit-logs.test.ts; pre-existing listener-dedup.test.ts implicit-any errors documented as out-of-scope in deferred-items.md) + `19471fe` (TEST-03 forward-defense — new tests/api/anthropic-payload-shape.test.ts asserts no `sessionId` literal + no UUIDv4 in system block or messages[0] + system block byte-identical across calls; 5/5 GREEN on Phase 17 source; locks state forward for Phase 18 IDENT-02); D-26 chat-surface regression battery 383 PASS / 1 FAIL pre-existing GREEN at every commit per D-10 cadence; +8 additive tests; planner reconciled chat-cache.ts / content-snapshot.ts absences — seams inlined per CLAUDE.md "Don't add abstractions beyond what the task requires"; see [17-05-SUMMARY.md](phases/17-foundations-migration-dns-debt-sweep/17-05-SUMMARY.md)*

**Wave 5** *(blocked on Waves 1 + 4 — runs LAST against all-GREEN surface)*
- [x] 17-06-PLAN.md — DNS-01 Resend domain records (SPF/DKIM/MX/DMARC) + DNS-02 warmup sends (5x) + Postmaster Tools enrollment — *COMPLETE 2026-05-11; commit `0b9d5c5` (Task 1 — scripts/resend-warmup.mjs Phase 20 fetch() dry-run) + 4 human-action/verify checkpoints PASSED (Resend account add-domain → DNS authoring in Cloudflare → wrangler secret put RESEND_API_KEY → Postmaster Tools enrollment → 5 warmup sends 5/5 Inbox FIRST TRY with ZERO Not-Spam feedback needed; second round NOT executed per D-08 cap honored). Resend message IDs: a61430df / 9b316537 / 8f83ba2b / de2bc127 / 652bc168. Worker secret list at phase close: 4 entries (ANTHROPIC_API_KEY, RESEND_API_KEY, CHAT_RECIPIENT_EMAIL, CHAT_SENDER_EMAIL) — all Phase 20 prereqs in place. Phase-end pnpm test = 383 PASS / 1 FAIL (pre-existing roadmap-amendment.test.ts from Plan 17-01; NOT a regression). Pre-existing Resend DNS dust on send.* + root left untouched (no conflict with mail.* scope); cleanup scheduled as low-priority /gsd-quick task post-phase. Phase 17 CLOSED for execution; Pages retirement (FOUND-03 sub-goal) pending 24h-warm-window per D-02. See [17-06-SUMMARY.md](phases/17-foundations-migration-dns-debt-sweep/17-06-SUMMARY.md) + [17-RETROSPECTIVE.md](phases/17-foundations-migration-dns-debt-sweep/17-RETROSPECTIVE.md)*

**Wave 6 → Wave 7-10 GAP CLOSURE** *(M-iter2 wave correction — serial chain occupies one wave per plan so a wave-batching orchestrator cannot accidentally parallelize chat-surface mutations; chat-surface mutations cannot run parallel without muddying D-26 attribution per CONTEXT.md D-10. Plan 17-08 is gated LAST as the deploy gate per DEPLOY-GATE.md.)*

**Wave 7** *(blocked on 17-06 for clean baseline; planned via /gsd-plan-phase --gaps from 17-UAT.md)*
- [x] 17-07-PLAN.md — UAT Gap #1 (BLOCKER) — chat voice-split regression: third-person about-chat.ts variants + per-MDX chatSummary frontmatter + build-chat-context.mjs broadened leak guard + system-prompt.ts <role> hardening + 21 voice-split tests across 2 new files (CHAT-06) — *COMPLETE 2026-05-11; 4 atomic commits: `ad9fdad` (Task 0/M8 — skip pre-existing roadmap-amendment.test.ts; pnpm test exits 0 cleanly for first time in 6 plans), `537a0e6` (Task 1 — about-chat.ts + 6 MDX chatSummary; about.ts BYTE-IDENTICAL; MDX bodies BYTE-IDENTICAL above CASE-STUDY-END), `05bf93d` (Task 2 — build-chat-context.mjs reads about-chat.ts + chatSummary, B1 broadened leak guard hard-fails on first-person, sync-check.yml triggers cover about-chat.ts; portfolio-context.json regenerated, est_tokens=41053), `2aa627d` (Task 3 — system-prompt.ts <role> defense-in-depth + tests/build/chat-knowledge-voice.test.ts B1 self-test 16/16 + tests/api/chat-voice-split.test.ts live-system-block tripwire 2/2). Final pnpm test: 404 PASS / 2 SKIP / 0 FAIL. D-15 sse-snapshot 3/3 GREEN, D-26 chat surface GREEN at every commit. See [17-07-SUMMARY.md](phases/17-foundations-migration-dns-debt-sweep/17-07-SUMMARY.md).*

**Wave 8** *(blocked on Wave 7 for chat-surface serial gate)*
- [x] 17-09-PLAN.md — UAT Gap #3 (major) — wire .chat-copy-btn.copy-success CSS rule + align chat.ts COPY/COPIED timeout windows to shared 1500ms + chat-copy-button jsdom test (DEBT-05 polish) — *COMPLETE 2026-05-11; 2 atomic commits: `dcf597b` (Task 1 — src/styles/global.css new rule .chat-copy-btn.copy-success { opacity: 1; color: var(--accent); } added immediately after :focus-visible block, wires the previously-dead .copy-success class set by chat.ts copyToClipboard for the 1500ms feedback window; tests/client/chat-copy-button.test.ts REPLACED 5-test old-contract assertions with 10-test new contract — 4 M4-isolated CSS-cascade tests + 1 vi.useFakeTimers lifecycle test + 5 retargeted createCopyButton helper tests asserting post-M3 contract; 9/10 GREEN at end of Task 1, 1 RED was the M3-contract test waiting for Task 2's deletion of inline style.color writes — intentional TDD RED across commit boundary), `b35ad94` (Task 2 — src/scripts/chat.ts new module-scope const COPY_FEEDBACK_MS = 1500 + copyToClipboard setTimeout literal 2000 -> COPY_FEEDBACK_MS + createCopyButton click handler M3 fix: deleted both `copyBtn.style.color = 'var(--accent)'` and `copyBtn.style.color = 'var(--ink-faint)'` inline writes, replaced 1000 -> COPY_FEEDBACK_MS, added M3 rationale comment block; CSS class is now SOLE source of truth for color during feedback window; M3-contract test turned GREEN; B-iter2 prescription's 3-anchor split satisfied by single multi-line Edit since byte-for-byte verified via Read tool prior to Edit). Final pnpm test = 409 PASS / 0 FAIL / 2 SKIP (was 404/0/2; +5 net new tests). chat-copy-button.test.ts 10/10 GREEN; no-imperative-display-flip.test.ts 3/3 GREEN; sse-snapshot.test.ts 3/3 GREEN (D-15 anchor preserved). pnpm exec astro build clean. Manual UAT (10 steps requiring browser interaction) deferred to user — closes operationally post-Plan-17-08 deploy. See [17-09-SUMMARY.md](phases/17-foundations-migration-dns-debt-sweep/17-09-SUMMARY.md).*

**Wave 9** *(blocked on Wave 8)*
- [x] 17-10-PLAN.md — UAT Gap #4 (major / cosmetic-noise) — pageswap handler in BaseLayout.astro head swallows implicit @view-transition AbortError + MOTION.md §5 MOTN-01 rejection-handling spec + 4 build-time tests (MOTN-01 closure) — *COMPLETE 2026-05-11; 2 atomic commits: `8fe670c` (Task 1 — src/layouts/BaseLayout.astro head new <script is:inline> with B5 raw script body registering window.addEventListener('pageswap', (e) => e.viewTransition?.finished.catch(() => {})), slotted after Phase 15 Umami conditional, before Font components, with 8-line comment block above documenting the W3C spec mandate + closure point per MOTION.md §5 MOTN-01 + B5 syntax discipline + .planning/debug/view-transition-aborterror.md pointer; tests/build/view-transition-handler.test.ts NEW 4-test build-time source-text suite using M5 multi-line regex [\\s\\S]*? to lock handler presence + .finished.catch shape + is:inline raw body via M5 regex + head placement; tests/build/umami-tag-present.test.ts Rule 1 deviation — 'is:inline precedent integrity' cap bumped 2 → 3 to absorb the legitimate new pageswap occurrence + rewrote enumeration comment), `72c1a82` (Task 2 — design-system/MOTION.md +4 LOC across 3 additive blocks: §5 Animation Specs new MOTN-01 rejection-handling paragraph + §7 File Ownership new row for the head <script is:inline> + §10 Changelog new v1.3.1 entry per B6 sub-version since v1.3 was the closed Phase 17 milestone; M6 verified motion-doc.test.ts compatibility — all 15 assertions are presence/absence-on-substring shape, no incompatibility with additive edits, no test update needed). Final pnpm test = 413 PASS / 0 FAIL / 2 SKIP (was 409/0/2 baseline at end of Plan 17-09; +4 net new tests). view-transition-handler.test.ts 4/4 GREEN; motion-css-rules.test.ts 11/11 GREEN; motion-doc.test.ts 15/15 GREEN; sse-snapshot.test.ts 3/3 GREEN (D-15 anchor preserved). pnpm exec astro build = clean (B5 verification — Astro parses the raw-body script correctly; 10 routes prerendered, server built in 7.29s); post-build grep on dist/client/index.html confirms handler emitted verbatim. Manual rapid-navigation UAT (browser-based) deferred to user — closes operationally post-Plan-17-08 deploy. ClientRouter + startViewTransition bans preserved. Targeted swallow (Option 1) chosen over global unhandledrejection guard (Option 2). See [17-10-SUMMARY.md](phases/17-foundations-migration-dns-debt-sweep/17-10-SUMMARY.md).*

**Wave 10** *(blocked on Wave 9 — runs LAST as RELEASE BLOCKER deploy gate)*
- [x] 17-08-PLAN.md — UAT Gap #2 (BLOCKER, RELEASE-BLOCKER for next deploy) — remove inline display:none from #chat-panel in ChatWidget.astro + update chat-panel-display test fixture to mirror real markup + new build-time no-inline-display test (DEBT-05 integration) — *COMPLETE 2026-05-11; 4 commits: `ce0d2af` (Task 1 — tests/client/chat-panel-display.test.ts REPLACED bare-div fixture with 5-test fixture mirroring real ChatWidget.astro markup verbatim sans display:none; forward-defense lock against the false-green coverage gap that hid the original DEBT-05 regression for 2 plans), `7f529a0` (Task 2 — src/components/chat/ChatWidget.astro single Edit removing `display: none; ` (15 chars including trailing space) from inline style on #chat-panel; every other declaration preserved byte-identically; tests/build/no-inline-display-on-chat-panel.test.ts NEW 1-test source-text guard greps ChatWidget.astro for any `display:` substring inside the inline style attribute; tests/client/listener-dedup.test.ts Rule 3 inline cleanup — 4-plan-deep carry-forward ts(7006) implicit-any errors absorbed via one-line callback-param annotations so pnpm exec astro check exits 0/0/0 cleanly for first time since Plan 17-03 commit 0ad77b3), `7af2841` (Task 2-ALPHA Rule 3 inline deviation — WR-04 ALLOW_LOOPBACK broadened from single-signal `import.meta.env.DEV` to three-signal disjunction `(import.meta.env.DEV === true) || (import.meta.env.MODE === "development") || (process.env.NODE_ENV === "development")` because @astrojs/cloudflare adapter does NOT statically replace import.meta.env.DEV in SSR routes under astro dev the way Vite does in client bundles; root cause of dev-403 regression discovered AT the deploy gate by the gate itself when POST /api/chat from http://localhost:4321 returned 403 Forbidden under pnpm dev; production CORS posture UNCHANGED — each operand statically tree-shakes to literal false in production-bundle so the entire ALLOW_LOOPBACK branch emits zero bytes in deployed Worker; verified post-build via grep on dist/server/chunks/chat_CqagseDb.mjs showing isAllowedOrigin() skipping directly from URL parsing to WORKERS_PREVIEW_SUFFIX with zero localhost/loopback references; tests/build/validation-loopback-source.test.ts NEW 3-assertion regression-lock asserts the disjunction stays present in source forever), [metadata commit] (Task 3 — 17-08-SUMMARY.md NEW + DEPLOY-GATE.md operator-signed status=confirmed gate=CONFIRMED operator=Jack Cutrara date=2026-05-11 all six manual UAT checks PASSED against post-fix HEAD 7af2841 via chat-reply "approved — deploy gate cleared" as durable audit trail per option 2 + STATE/ROADMAP/REQUIREMENTS planning-state advancement). Final pnpm test = 419 PASS / 0 FAIL / 2 SKIP (was 413/0/2 at end of Plan 17-10; +6 net new tests). pnpm exec astro check = 0/0/0 (FIRST TIME the typecheck passes cleanly on main since Plan 17-03 commit 0ad77b3). pnpm build = clean (10 routes prerendered, 7.90s). D-26 chat-surface regression battery 30/30 GREEN. D-15 SSE byte-identical anchor PRESERVED at every commit. Local main 38 commits ahead of origin/main at HEAD 7af2841 (39 after metadata commit). DEPLOY-GATE.md operator-cleared next `git push origin main` — user controls actual push (executor MUST NOT push). After deploy: Pages retirement (FOUND-03 sub-task) unblocks. See [17-08-SUMMARY.md](phases/17-foundations-migration-dns-debt-sweep/17-08-SUMMARY.md) + [DEPLOY-GATE.md](phases/17-foundations-migration-dns-debt-sweep/DEPLOY-GATE.md).*

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
**Plans**: 8 plans across 4 waves (KV-05 added to REQUIREMENTS.md per Plan 18-01 / D-12)

Plans:

**Wave 0** *(no dependencies — Day 1 gate)*
- [x] 18-01-bootstrap-spike-and-requirements-PLAN.md — REQUIREMENTS.md KV-05 amendment + IDENT-02 D-04 amendment (v1.3-B6 changelog) + SPIKE-ctx-access-path.md resolving Pitfall 8 Astro APIRoute locals.runtime.ctx binding path

**Wave 1** *(depends on Wave 0 — parallel branches by file ownership)*
- [x] 18-02-chat-transcripts-module-PLAN.md — NEW pure module src/lib/chat-transcripts.ts (KV-02..05 + META-01) with 16-test mock-KV suite tests/api/chat-transcripts.test.ts (TDD RED -> GREEN)
- [x] 18-03-validation-schema-sessionid-PLAN.md — src/lib/validation.ts RequestSchema sessionId: z.uuidv4().optional() (IDENT-02 + D-04) + 7-test tests/api/chat-session-id.test.ts (TDD)
- [x] 18-04-anthropic-payload-forward-defense-PLAN.md — tests/api/anthropic-payload-shape.test.ts +3 D-16 assertions (TEST-03 hardening) — byte-equality across sessionId-bearing vs no-sessionId calls + source-text guard for buildChatRequestArgs signature

**Wave 2** *(depends on Waves 0+1 — parallel by file ownership)*
- [x] 18-05-api-chat-waituntil-wiring-PLAN.md — src/pages/api/chat.ts wire two ctx.waitUntil(appendTurn(...).catch(...)) calls at D-10 + D-11 anchors + captureRequestMeta helper + accumulator wiring (KV-01..05 + IDENT-02 + META-01 + META-02 + TEST-01 + TEST-03)
- [x] 18-06-client-sessionid-mint-PLAN.md — src/scripts/chat.ts STORAGE_VERSION 1->2 + ChatStorage sessionId + ensureSessionId on bubble click + streamChat body emission (IDENT-01 + D-01 + D-04 silent fail) + 8-test tests/client/chat-sessionid-mint.test.ts (TDD)

**Wave 3** *(depends on Wave 2)*
- [x] 18-07-forward-defense-and-meta02-PLAN.md — NEW tests/build/append-turn-call-site.test.ts source-text forward-defense for D-10/D-11/D-09 anchors + tests/api/cache-hit-logs.test.ts +META-02 source-of-truth-once + sse-snapshot D-15 re-verify

**Wave 4** *(depends on Wave 3 — operational verification)*
- [x] 18-08-uat-and-test03-live-PLAN.md — Author 18-UAT.md (8 numbered manual steps) + operator runs against preview + production (D-14 3x identical POST verifies cache_read_input_tokens > 0 on responses 2 + 3; D-15 cache-miss-blocks-close; ROADMAP success criteria 1-5 verified live)

### Phase 19: Cron Sweep — Scheduling + Idempotency (DRY_RUN)

**Goal**: An hourly Cloudflare cron trigger lists `live:` transcripts, filters by `metadata.last_activity_at < now − 2h`, and runs the full two-keyspace promotion loop (`live:{sid}` → `delivered:{sid}`) under DRY_RUN — exercising every code path Phase 20 will rely on, without yet POSTing to Resend.
**Depends on**: Phase 18 (KV transcripts must exist for the sweep to find candidates)
**Requirements**: CRON-01, CRON-02, CRON-03, CRON-04
**Success Criteria** (what must be TRUE):
  1. Setting `triggers.crons` to `* * * * *` temporarily produces ≥1 invocation visible in the Worker's Past Events tab within 90 seconds, confirming the `scheduled()` handler is actually wired through `src/worker.ts` and `ctx.waitUntil(deliverDue(env))` runs without throwing.
  2. With `DRY_RUN=1`, a session whose `last_activity_at` is older than 2h is detected by the sweep, its Resend payload is logged (not POSTed), `delivered:{sid}` is PUT with 24h TTL BEFORE the would-be POST, and `live:{sid}` is DELETE'd AFTER the dry-run "success" — the same crash-safe sequencing Phase 20 will rely on.
  3. Running the sweep twice over the same KV state results in exactly one would-be Resend payload logged per session: the second run skips already-delivered candidates because `delivered:{sid}` is present (application-level idempotency holds even before Resend's idempotency key joins the defense).
  4. Per-tick batch cap of 50 sessions, send-attempt counter cap of 3 retries, and pagination hard-cap of 50 pages all enforced; per-session try/catch isolates failures so one bad session never aborts the sweep; structured JSON logs surface per-tick summary (sessions_seen, sessions_due, sessions_promoted, errors).
**Plans**: 4 plans

Plans:

**Wave 0** *(no dependencies — pre-flight scaffolding; zero runtime behavior change)*
- [x] 19-01-PLAN.md — `pnpm dev:cron` npm script + `wrangler.jsonc` `vars.DRY_RUN = "1"` + `src/worker.ts` `Env.DRY_RUN: string` (CRON-01 partial — config + type scaffolding)

**Wave 1** *(depends on 19-01 — TDD-aware pure-module + unit tests)*
- [x] 19-02-PLAN.md — NEW `src/lib/chat-delivery.ts` (pure module: `deliverDue` + two-keyspace promotion loop + DRY_RUN gate + retry harness + 50-session batch cap + 50-page pagination cap) + NEW `tests/api/chat-delivery.test.ts` 19-case unit test battery against mock KV (CRON-02, CRON-03, CRON-04)

**Wave 2** *(depends on 19-02 — wiring + source-text forward-defense)*
- [x] 19-03-PLAN.md — `src/worker.ts` `scheduled()` body replaced with `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch(...))` per Phase 18 D-09 pattern + NEW `tests/build/worker-scheduled-call-site.test.ts` 6-invariant source-text guard (CRON-01)

**Wave 3** *(depends on 19-03 — cron flip + UAT; NON-autonomous — operator checkpoint)*
- [x] 19-04-PLAN.md — `wrangler.jsonc` `triggers.crons` flipped `[]` → `["0 * * * *"]` + NEW `tests/build/wrangler-cron-shape.test.ts` + tightened `wrangler-shape.test.ts` cron assertion + NEW `19-UAT.md` 5-step manual operator UAT spec (CRON-01..04 closure) — *COMPLETE 2026-05-12 (executor side); commits `46d8d42` (feat — cron flip + 2-invariant build test + tightened FOUND-04 cron assertion) + `ff6549c` (docs — 19-UAT.md 5-step operator runbook, 452 LOC). Task 3 operator UAT (Cloudflare Dashboard Past Events screenshot + PROD KV seed-and-sweep + idempotency double-tap + batch-cap stress + test-uat-* cleanup) pending operator execution per D-12 / DEPLOY-GATE.md posture — executor MUST NOT run `wrangler deploy`. Phase-end pnpm test = 498 PASS / 0 FAIL / 2 SKIP (beats >=446 plan minimum). astro check 0/0/0. D-26 / D-15 / TEST-03 cross-cutting anchors PRESERVED. CRON-01..04 closed-by-design at executor side; operator UAT closes residual operational confidence. See [19-04-SUMMARY.md](phases/19-cron-sweep-scheduling-idempotency-dry-run/19-04-SUMMARY.md) + [19-UAT.md](phases/19-cron-sweep-scheduling-idempotency-dry-run/19-UAT.md).*

**Cross-cutting constraints** *(must hold across all Phase 19 plans):*
- D-26 chat regression battery PRESERVED (Phase 19 touches ZERO chat-surface files; forward-defense informational)
- D-15 SSE byte-identical anchor PRESERVED (Phase 19 doesn't touch `/api/chat` SSE surface)
- TEST-03 Anthropic prompt-cache integrity PRESERVED (Phase 19 doesn't touch Anthropic surface)
- `pnpm exec astro check` exits 0/0/0 at every commit (Phase 17 Plan 17-08 baseline)
- `pnpm test` PASS count grows from 419 (Phase 18 close baseline) to ~446+ at Phase 19 close (Plan 19-02 +19, Plan 19-03 +6, Plan 19-04 +2)

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
**Plans**: 4 plans across 3 waves

Plans:

**Wave 1** *(no dependencies — parallel branches by file ownership)*
- [ ] 20-01-PLAN.md — Email Renderer (Pure Module + Adversarial Tests): NEW src/lib/email/render.ts pure ChatTranscript -> ResendPayload renderer (subject D-05/06/07/08 + body D-09/10/11/12 + sanitizer pipeline Landmine 6) + NEW tests/api/email-render.test.ts (~13 happy + edge tests) + NEW tests/api/email-render.adversarial.test.ts (it.each over 6 MAIL-05 payload classes). Closes MAIL-02 + MAIL-03 + MAIL-04 + MAIL-05.
- [ ] 20-02-PLAN.md — Resend HTTP Wrapper (Pure Module + Mocked-Fetch Tests): NEW src/lib/email/resend.ts pure REST wrapper (POST + Authorization Bearer + Idempotency-Key + AbortController 10s + 3-variant Result per D-17 + 3-event structured logging per D-16+D-17) + NEW tests/api/email-resend.test.ts (mocked fetch + DOMException AbortError mock per Landmine 1). Closes MAIL-01.

**Wave 2** *(depends on 20-01 + 20-02)*
- [ ] 20-03-PLAN.md — Wire sendOne Substitution + Wrangler Flip + Forward-Defense: src/lib/chat-delivery.ts sendOne substitution + DeliveredMarker.resend_message_id additive extension + promoteOne step-4 PUT site populates field + wrangler.jsonc DRY_RUN "1" -> "0" (single-line atomic flip per D-01) + EXTEND tests/api/chat-delivery.test.ts (GROUP F 6 wiring tests per D-17 collapsed Result + GROUP D rewrite for new contract) + NEW tests/build/chat-delivery-send-site.test.ts (5 invariants source-text-locking sendEmail + renderEmail wired AND throw stub gone AND DRY_RUN=='1' rollback runway preserved per D-03) + NEW tests/build/wrangler-dry-run-shape.test.ts (2 invariants — DRY_RUN=='0' + cron==['0 * * * *'] Pitfall 6 defense) + UPDATE tests/build/wrangler-cron-shape.test.ts existing DRY_RUN=='1' assertion to '0'.

**Wave 3** *(depends on 20-03 — autonomous: false; operator-driven deploy gate)*
- [ ] 20-04-PLAN.md — UAT + Deploy Gate (Phase Closure): NEW 20-UAT.md (6 numbered manual operator steps mapping 1:1 to ROADMAP success criteria 1-5 + Step 6 organic real-traffic 7-day soft cap) + NEW DEPLOY-GATE.md (mirrors Plan 17-08 template; status=pending at first commit; 5-section pre-deploy checklist + executor-MUST-NOT-push prohibition + ROLLBACK PROCEDURE per D-03). Task 2 is a checkpoint:human-verify pausing for operator UAT + chat-reply 'approved — deploy gate cleared' + git push origin main (operator-controlled).

**Cross-cutting constraints** *(must hold across all Phase 20 plans):*
- D-26 chat-surface battery PRESERVED at every commit (Phase 20 touches ZERO chat-surface files: chat.ts / api/chat.ts / validation.ts / ChatWidget.astro / global.css UNTOUCHED)
- D-15 SSE byte-identical anchor PRESERVED (`tests/api/sse-snapshot.test.ts` GREEN at every commit; informational forward-defense)
- TEST-03 Anthropic prompt-cache integrity PRESERVED (`tests/api/anthropic-payload-shape.test.ts` GREEN at every commit)
- `pnpm exec astro check` exits 0/0/0 at every commit (Plan 17-08 baseline)
- `package.json` `dependencies` BYTE-IDENTICAL phase-wide (MAIL-01 zero-new-runtime-dep lock — REST via global fetch, no SDK install)
- DRY_RUN=='1' branch in `src/lib/chat-delivery.ts` sendOne PRESERVED in source as the rollback runway (D-03 — do NOT remove as 'dead code'; tests/build/chat-delivery-send-site.test.ts Invariants D + E source-text-lock its presence)
- D-17 supersedes D-14/D-16: ResendResult is a 3-variant discriminated union (sent / failed_transient / failed_terminal) — NO replayed variant; 3 log events (chat.delivery.sent / .failed / .retry) — NO chat.delivery.idempotency_replay event; Layer 1 (`delivered:{sid}` cursor + Phase 19 chat.delivery.skipped_already_delivered log) IS the application-side replay detector

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
| 17. Foundations — Migration + DNS + Debt Sweep | v1.3 | 10/10 | Complete    | 2026-05-11 |
| 18. Persistence + Identity — KV Write Path + sessionId | v1.3 | 8/8 | Complete   | 2026-05-11 |
| 19. Cron Sweep — Scheduling + Idempotency (DRY_RUN) | v1.3 | 4/4 | Complete    | 2026-05-12 |
| 20. Email Render + Resend Integration | v1.3 | 0/0 | Not started | - |
