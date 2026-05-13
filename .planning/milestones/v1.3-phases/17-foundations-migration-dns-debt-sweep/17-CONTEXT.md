# Phase 17: Foundations — Migration + DNS + Debt Sweep - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 17 produces a non-fragile foundation for the rest of v1.3 by doing three coupled things in one milestone:

1. **Migrate the live deploy from Cloudflare Pages to Cloudflare Workers Static Assets.** A single Worker binding owns static HTML, the streaming `/api/chat` endpoint, and a (currently no-op) `scheduled()` handler. New custom entrypoint at `src/worker.ts` re-exports Astro's `handle()` for fetch + adds `scheduled()` that delegates to Phase 19's cron sweep module (stubbed in this phase). `wrangler.jsonc` `main` switches `@astrojs/cloudflare/entrypoints/server` → `./src/worker.ts`; `[assets] binding="ASSETS" directory="./dist/client"` declared; `kv_namespaces` and `triggers.crons` declared but not yet bound to live targets (Phase 18 binds `CHAT_KV`, Phase 19 sets the hourly cron). Production custom domain `jackcutrara.com` reattaches to the Worker; preview URLs migrate `*.portfolio-5wl.pages.dev` → `*.workers.dev`.

2. **DNS-verify and warm the Resend sending domain `mail.jackcutrara.com`.** Resend account creation is part of this phase. SPF + DKIM + MX + DMARC (`p=none` minimum) records land in Cloudflare DNS. `dig TXT _dmarc.mail.jackcutrara.com` returns a valid record. 5–10 manual sends from `transcripts@mail.jackcutrara.com` to `jackcutrara@gmail.com` are executed from a throwaway `scripts/resend-warmup.mjs` that reuses the production `fetch()` pattern Phase 20 will rely on; user marks each as "Not Spam" if Gmail buckets them. Postmaster Tools enrolled.

3. **Close all 5 chat tech-debt carry-forwards** (DEBT-01..05) absorbed into this phase per v1.3 milestone-shape lock. Touches `chat.ts`, `api/chat.ts`, `BaseLayout.astro`, `global.css`, `chat-cache.ts`, `content-snapshot.ts`, `analytics.ts`, `scroll-depth.ts`, `.github/workflows/sync-check.yml`, `PROJECT.md`. Coupling these with the migration minimizes the number of times the chat regression risk surface is opened in v1.3.

**Phase exit gates (non-negotiable):**
- D-15 server byte-identical at `/api/chat` (TEST-02). Verified via captured SSE-byte snapshot test (`tests/api/sse-snapshot.test.ts`) authored against the live Pages deploy on Day 1, before any migration code lands.
- D-26 chat regression battery 117/117 GREEN (TEST-01). Run after every commit that touches the chat surface (`chat.ts` / `api/chat.ts` / `global.css` / `BaseLayout.astro` / `validation.ts`) AND at phase-end.
- Anthropic prompt-cache integrity verified (TEST-03). Snapshot test confirms no sessionId in `system` or `messages[0]` (sessionId doesn't even exist yet in this phase — but DEBT-02 cache-token observability lands here).

**Out of scope for Phase 17 (handled by other phases or v1.4+):**
- KV writes / `appendTurn` (Phase 18)
- sessionId minting and validation (Phase 18)
- Cron sweep logic / `deliverDue` (Phase 19) — `scheduled()` is a no-op stub here
- Resend POST integration / email body rendering (Phase 20)
- `CHAT_RATE_LIMITER` actual binding upgrade — DEBT-01 is documentation-only ("Free-tier acceptable" per locked decision); binding upgrade is v1.4+
- `/api/resend-webhook` with Svix HMAC (v1.4+)

</domain>

<decisions>
## Implementation Decisions

### A. Migration cutover & rollback

- **D-01:** **Parallel deploy + flip-domain cutover.** Deploy the new Worker as a separate Cloudflare Worker first — validates against its `*.workers.dev` preview URL with full D-15 SSE snapshot diff and full D-26 117/117 — then reattach the `jackcutrara.com` custom domain from the Pages project to the Worker. One-shot cutover and canary-with-traffic-split both rejected (canary is overkill for portfolio scale; one-shot has no fast rollback).
- **D-02:** **Pages stays warm 24h post-flip as instant rollback.** After 24h of clean production traffic on the Worker, retire the Pages project. Phase 18 depends on Workers (KV bindings + future cron), so we cannot keep Pages alive indefinitely.
- **D-03:** **Replace Pages "connect to Git" auto-deploy with Cloudflare Workers Builds.** Same dashboard Git-integration UX as today — push to main → Cloudflare builds + ships — but pointed at the Worker. No GitHub Actions deploy workflow added. Avoids new CI infra (no `CLOUDFLARE_API_TOKEN` secret to rotate). Mirrors current DX.
- **D-04:** **D-15 byte-identical proven via SSE snapshot test.** Capture canonical SSE byte stream from the live Pages deploy at `/api/chat` against a known-fixture request body on Day 1, commit as `tests/api/sse-snapshot.test.ts` fixture. The migration plan asserts the new Worker's SSE output matches the fixture byte-for-byte. Fixture commit must precede any migration code commit.

### B. DNS warming execution

- **D-05:** **Resend account creation is part of this phase.** Phase 17 includes the manual one-time account setup as a plan task; the wrangler secret `RESEND_API_KEY` gets added to both production and preview environments alongside.
- **D-06:** **Sender = `"Portfolio Chat" <transcripts@mail.jackcutrara.com>`.** Display name surfaces source at-a-glance in Gmail's sender column. Address is locked by REQUIREMENTS.md MAIL-04. `Reply-To: jackcutrara@gmail.com` per MAIL-04 (already locked) so replies don't bounce back to the unmonitored sending address.
- **D-07:** **Throwaway `scripts/resend-warmup.mjs` executes the warming sends.** ~30 LOC, reuses the same `fetch()` pattern Phase 20's `src/lib/email/resend.ts` will use. Pre-validates `Authorization: Bearer ${RESEND_API_KEY}` + `Idempotency-Key` header shape early. Optionally retired post-warmup (Claude's discretion — keep if useful for future re-warming).
- **D-08:** **Warming sends happen LAST in Phase 17 ordering** — after migration is GREEN, after all 5 DEBT items GREEN, after D-26 117/117 verified at the post-DEBT phase-end gate. Manual "Not Spam" feedback loop runs against a known-good chat surface so a malformed warmup send isn't debugged simultaneously with chat regressions.

### C. Internal task ordering

- **D-09:** **Execution order is fixed:**
  1. Day 1 — capture D-15 SSE snapshot fixture against live Pages, commit as test
  2. Migration (FOUND-01..04) — wrangler.jsonc rewrite, `src/worker.ts` author, `astro.config.mjs` adapter check, parallel-deploy to Worker preview, full D-15 + D-26 verification on `*.workers.dev` preview, flip `jackcutrara.com` custom domain, retire Pages after 24h
  3. Chat-surface DEBT under the new deploy: DEBT-04 (`astro:page-load` listener dedup at `analytics.ts:140-147` / `scroll-depth.ts:63-70` / `chat.ts:870-877`) + DEBT-05 (`#chat-panel` CSS-only display contract, `style.display='flex'` removed from `animatePanelOpen`)
  4. Docs/CI DEBT: DEBT-01 (PROJECT.md "Known issues" entry rewrite for `CHAT_RATE_LIMITER` to "documented + Free-tier acceptable") + DEBT-03 (`build:chat-context:check` parallel job in `.github/workflows/sync-check.yml`)
  5. Observability DEBT: DEBT-02 (cache-hit log seams in `src/lib/chat-cache.ts` / `src/lib/content-snapshot.ts` / `src/scripts/chat.ts` emitting `cache_read_input_tokens` / `cache_creation_input_tokens` from Anthropic responses)
  6. DNS verification (DNS-01) — SPF, DKIM, MX, DMARC records in Cloudflare DNS; `dig TXT _dmarc.mail.jackcutrara.com` validates
  7. DNS warming (DNS-02) — execute `scripts/resend-warmup.mjs` 5–10 times; mark as "Not Spam" in Gmail; enroll Postmaster Tools
  Migration-first locks the deploy target so chat-surface DEBT lands once on the canonical surface. Observability lands last among code changes because DEBT-02 touches the most files. DNS warming terminates the phase against an all-GREEN surface.
- **D-10:** **D-26 cadence: every commit that touches the chat surface + final phase-end gate.** Chat surface = `chat.ts` / `api/chat.ts` / `global.css` / `BaseLayout.astro` / `validation.ts` per REQUIREMENTS.md TEST-01. Battery is fast (mocked LLM); cost is trivial. Coarser cadence rejected — a regression introduced in commit N+1 must not silently survive until commit N+M.
- **D-11:** **SSE snapshot fixture captured BEFORE migration** — Day 1 task. Captures pre-migration ground truth that the new Worker must match. Committing it as a test artifact ensures reproducible verification across the cutover and immunizes future phases (especially Phase 18 which adds `ctx.waitUntil(appendTurn(...))` calls — a planned D-15 amendment) against silent SSE-shape drift.
- **D-12:** **Plan granularity is plan-phase's call** — let `gsd-planner` group tasks via dependency analysis rather than pre-committing to a 5-plan / 3-plan / monolithic split. Hard ordering constraint above (D-09) plus the phase exit gates (D-04, D-10) give plan-phase enough structure; sub-plan boundaries should fall out of the dependency graph naturally.

### D. Local dev workflow

- **D-13:** **Two-mode dev story:** `pnpm dev` stays = `astro dev` (fast HMR for Astro pages + chat client iteration); add `pnpm dev:worker` = `wrangler dev` for end-to-end verification of the new entrypoint, scheduled handler, and (Phase 18+) KV bindings. Matches Cloudflare's documented Workers Static Assets pattern. Single-mode `wrangler dev` rejected (slower HMR); `concurrently` rejected (new dev dep).
- **D-14:** **Use Cloudflare-assigned `*.workers.dev` preview URLs** — Workers Builds gives each main-push and PR a preview URL automatically. Update `src/lib/validation.ts:72` `PAGES_PREVIEW_SUFFIX = ".portfolio-5wl.pages.dev"` → the new Worker's `*.workers.dev` suffix (rename constant accordingly: `WORKERS_PREVIEW_SUFFIX`). Update `tests/api/security.test.ts:79–97` allow-list tests to match. Custom subdomain rejected (overkill); disabling previews rejected (loses pre-merge review affordance).
- **D-15:** **Retire `scripts/pages-compat.mjs` entirely.** Workers Static Assets uses `[assets] binding="ASSETS" directory="./dist/client"` pointing at Astro's adapter output directly — the `_worker.js` + `_routes.json` restructure that `pages-compat.mjs` performs is a Pages-only concept. Remove the script's invocation from the `build` script in `package.json`. Delete the file. Surfaces any hidden Pages-coupling early.

### Claude's Discretion

- Exact `src/worker.ts` shape (line count, comment style, import ordering) — research SUMMARY.md describes ~30 LOC re-exporting Astro's `handle()` plus a `scheduled()` stub; planner picks final form
- Whether `WORKERS_PREVIEW_SUFFIX` lives in `validation.ts` (current location) or moves to a dedicated `src/lib/cors.ts` (organic refactor decision)
- Final `scripts/resend-warmup.mjs` arg shape (`--to`, `--count`, etc.) — keep simple; the script is throwaway-leaning
- Whether `scripts/resend-warmup.mjs` is committed to the repo or stays untracked — leaning committed (low cost, useful for re-warming if deliverability degrades)
- Naming of the SSE snapshot test (`tests/api/sse-snapshot.test.ts` is suggested; planner may rename if clearer)
- Exact log-line shape for DEBT-02 cache-hit observability — research PITFALLS.md #6 calls for `cache_read_input_tokens` / `cache_creation_input_tokens` to be visible at the chat-cache + content-snapshot + chat client seams; structured JSON log fields are at planner's discretion
- Whether DEBT-01 PROJECT.md edit also touches STATE.md or RETROSPECTIVE.md mentions of `CHAT_RATE_LIMITER` (likely yes — planner audits)
- Postmaster Tools enrollment timing (during DNS-01 or after first warmup send) — operational sequencing decision

### Folded Todos

- **`.planning/todos/pending/2026-04-23-chat-cache-hit-rate-observability.md`** — Folded into DEBT-02. Phase 14 deferred this; v1.3 milestone-shape lock pulled it into Phase 17. Closure path: structured log seams in `chat-cache.ts` / `content-snapshot.ts` / `chat.ts` per REQUIREMENTS.md DEBT-02.
- **`.planning/todos/pending/2026-04-23-configure-chat-rate-limiter-binding.md`** — Folded into DEBT-01 as a documentation-only close-out. The binding itself is NOT being configured (Workers Paid plan upgrade is v1.4+ per v1.3 milestone lock); the todo is closed by rewriting PROJECT.md "Known issues" to "documented + Free-tier acceptable" rather than "carry-forward gap." User confirmed v1.3 milestone shape via `/gsd-roadmap-phase` 2026-05-09.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Requirements & roadmap

- `.planning/ROADMAP.md` — Phase 17 entry: goal statement, requirements list, 5 success criteria, depends-on Phase 16
- `.planning/REQUIREMENTS.md` — Phase 17 reqs: FOUND-01..04 (migration), DNS-01..02 (deliverability), DEBT-01..05 (tech debt sweep), TEST-01..03 (cross-phase gates). Out-of-scope list, Future Requirements, Traceability table
- `.planning/STATE.md` — v1.3 architectural decisions locked at `/gsd-new-milestone` (storage=KV, delivery=Resend, cadence=hourly+2h, posture=silent, filter=none) + v1.3 phase-shape decisions locked at `/gsd-roadmap-phase` (4 phases 17-20, Phase 17 absorbs all 5 DEBT items, Phase 21 deferred to v1.4+)
- `.planning/PROJECT.md` — v1.3 milestone summary, current state, target features list

### Research

- `.planning/research/SUMMARY.md` — synthesized v1.3 research; "Headline Finding — Pages → Workers Migration is the #1 Architectural Decision"; Option (a) Workers Static Assets recommended path; target architecture diagram; KV data shape; send-once defense in depth
- `.planning/research/STACK.md` — Workers Static Assets stack additions; rejected alternatives (Resend SDK, Cloudflare Email Sending, MailChannels)
- `.planning/research/ARCHITECTURE.md` — `src/worker.ts` entrypoint shape; fetch + scheduled wiring; `ctx.waitUntil` semantics
- `.planning/research/PITFALLS.md` — #0 Pages doesn't support cron triggers; #2 KV eventual consistency; #5 D-26 must hold; #6 Anthropic prompt cache integrity; #7 Gmail spam classification on new From-domain
- `.planning/research/FEATURES.md` — table-stakes / differentiators / anti-features per category

### Prior phase context (v1.2)

- `.planning/milestones/v1.2-phases/14-chat-knowledge-upgrade/14-CONTEXT.md` — chat surface contract that DEBT-02 cache-hit observability extends; D-12 single `cache_control: ephemeral` breakpoint context
- `.planning/milestones/v1.2-phases/15-analytics-instrumentation/15-CONTEXT.md` — analytics observer behavior; `astro:page-load` lifecycle pattern that DEBT-04 dedup applies to
- `.planning/milestones/v1.2-phases/16-motion-layer/16-CONTEXT.md` — D-26 chat regression battery as cross-phase gate; `chat.ts` line-anchor map (`startPulse`/`stopPulse` at 451–457; bootstrap listener at 870–877)

### Existing code surface (informational, not a spec)

- `wrangler.jsonc` — current 11-line config; `main` switches `@astrojs/cloudflare/entrypoints/server` → `./src/worker.ts`; gains `kv_namespaces`, `triggers.crons`
- `astro.config.mjs` — Astro 6 + Tailwind v4 + Cloudflare adapter; verify per-route `prerender` settings don't bundle MDX into the Worker bundle (per FOUND-04)
- `src/pages/api/chat.ts` (161 LOC) — SSE streaming endpoint; D-15 byte-identical anchor; SSE snapshot fixture captured against this surface
- `src/scripts/chat.ts` (904 LOC) — `astro:page-load` bootstrap at L870–877 (DEBT-04); `animatePanelOpen` at L?? flips `style.display='flex'` (DEBT-05 removes this)
- `src/scripts/analytics.ts` (153 LOC) — `astro:page-load` listener at L140–147 (DEBT-04 dedup)
- `src/scripts/scroll-depth.ts` (83 LOC) — `astro:page-load` listener at L63–70 (DEBT-04 dedup); already consumes `src/scripts/lib/observer.ts` factory from Phase 16
- `src/lib/validation.ts:66–87` — `PAGES_PREVIEW_SUFFIX = ".portfolio-5wl.pages.dev"` constant; CORS allow-list logic; rename + retarget to `*.workers.dev`
- `tests/api/security.test.ts:79–97` — preview-subdomain CORS tests; update suffix constant
- `scripts/pages-compat.mjs` — Pages-specific post-build restructure; **DELETE** (D-15)
- `scripts/build-chat-context.mjs` — generator referenced by DEBT-03 CI job
- `scripts/sync-projects.mjs` — current `sync-check.yml` job pattern; DEBT-03 adds a parallel `build:chat-context:check` job
- `.github/workflows/sync-check.yml` — current 35-line workflow; DEBT-03 amendment adds parallel job
- `package.json` — `build` script chain `pnpm build:chat-context && wrangler types && astro check && astro build && node scripts/pages-compat.mjs`; remove `pages-compat.mjs` invocation per D-15
- `design-system/MASTER.md` / `design-system/MOTION.md` — design contract; not modified by Phase 17 but binds for any chat-surface visual change

### Cloudflare-platform docs (external — researcher should fetch via Context7 / WebFetch as needed)

- Cloudflare Workers Static Assets — `[assets]` binding shape, build output directory expectations
- Cloudflare Workers Builds — dashboard Git-integration setup (D-03)
- Cloudflare Cron Triggers — `triggers.crons` schema (Phase 19 binds; Phase 17 declares)
- Cloudflare KV — `kv_namespaces` declaration (Phase 18 binds; Phase 17 declares the section)
- Resend domain verification — SPF / DKIM / MX / DMARC record expectations
- Gmail Postmaster Tools — enrollment for `mail.jackcutrara.com`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/lib/validation.ts` CORS allow-list pattern — rename `PAGES_PREVIEW_SUFFIX` → `WORKERS_PREVIEW_SUFFIX`, retarget; tests at `tests/api/security.test.ts:79–97` update in lockstep
- `scripts/sync-projects.mjs --check` mode + `pnpm sync:check` script — exact pattern DEBT-03's `build:chat-context:check` mirrors (script already exists in `package.json`; just needs the CI wiring)
- `src/scripts/lib/observer.ts` (Phase 16 factory) — DEBT-04 dedup pattern can lift the `astro:page-load` guard pattern from how this factory is consumed
- `@astrojs/cloudflare` adapter `handle()` export — re-exported by the new `src/worker.ts`; no shim authoring needed

### Established Patterns

- `astro:page-load` lifecycle as the chat init hook — already the convention; DEBT-04 makes the listener registration idempotent without changing the lifecycle contract
- Component-scoped `<style>` in `.astro` primitives + global animation keyframes in `global.css` — DEBT-05 lives in `global.css` (the `#chat-panel` rules) and `chat.ts` (removing the imperative `style.display` flip)
- TDD pattern: `tests/build/*` for source-text assertions, `tests/api/*` for SSR/SSE behavior, `tests/client/*` for DOM-mock assertions — D-15 SSE snapshot belongs in `tests/api/`; DEBT-04 dedup belongs in `tests/client/`
- Wrangler secrets management mirrors `ANTHROPIC_API_KEY` — `RESEND_API_KEY`, `CHAT_RECIPIENT_EMAIL`, `CHAT_SENDER_EMAIL` follow the same pattern (CHAT_SENDER_EMAIL = `"Portfolio Chat" <transcripts@mail.jackcutrara.com>` per D-06)
- Build chain pattern in `package.json` — `pnpm build:chat-context && wrangler types && astro check && astro build` — Phase 17 removes the trailing `&& node scripts/pages-compat.mjs`

### Integration Points

- `wrangler.jsonc` — full rewrite: `main` switch, `[assets]` binding, `kv_namespaces` declaration (unbound IDs in this phase), `triggers.crons` declaration (no schedule yet — Phase 19 sets `["0 * * * *"]`)
- `src/worker.ts` — NEW file (~30 LOC); re-exports Astro `handle()` for fetch; adds `scheduled()` no-op stub that delegates to a Phase 19 module (Phase 17 ships the import path; Phase 19 fills in the body)
- `astro.config.mjs` — verify `output` mode + per-route `prerender = false` for `/api/chat`; verify MDX content collections don't bundle into the Worker bundle (per FOUND-04)
- `src/pages/api/chat.ts` — D-15 byte-identical anchor; UNCHANGED in this phase
- `src/scripts/chat.ts` — DEBT-04 (L870–877 listener dedup) + DEBT-05 (`animatePanelOpen` no longer flips `style.display`) + DEBT-02 (cache-hit log seam at the response-handling site)
- `src/scripts/analytics.ts:140–147` + `src/scripts/scroll-depth.ts:63–70` — DEBT-04 listener dedup
- `src/styles/global.css` — DEBT-05 `.is-open` rule on `#chat-panel` controls both display AND animation (CSS-only state machine)
- `src/lib/chat-cache.ts` + `src/lib/content-snapshot.ts` — DEBT-02 structured log seams
- `.github/workflows/sync-check.yml` — DEBT-03 parallel job for `pnpm build:chat-context:check`
- `PROJECT.md` "Known issues / tech debt" section — DEBT-01 documentation rewrite
- `package.json` `build` script — remove `&& node scripts/pages-compat.mjs`
- DELETE: `scripts/pages-compat.mjs`

</code_context>

<specifics>
## Specific Ideas

- The 24-hour Pages-as-rollback window is a **calendar window, not a guarantee** — if a regression surfaces at hour 23, retire-Pages slips. Plan-phase should not write the retire-Pages task as a hard timer ("retire after 24h") but as a gated check ("retire after 24h of clean traffic AND no open regressions").
- The throwaway warmup script intentionally exercises the **same `fetch()` shape** Phase 20's `src/lib/email/resend.ts` will use. It's an early-return on Phase 20's REST-vs-SDK decision (REST locked at v1.3 milestone) — the warmup script is the first time we exercise that decision in code. If the warmup script can't get a 200 from Resend's REST endpoint, Phase 20 won't either.
- `mail.jackcutrara.com` (subdomain) is the sending domain, not `jackcutrara.com` (apex). This is the standard Resend pattern to keep transactional sending isolated from the apex domain's reputation. DMARC `p=none` on the subdomain doesn't propagate up to the apex — keeps recruiter outreach (if any) from being gated by transactional reputation.
- The `*.workers.dev` preview suffix is per-Worker, not per-account — once the new Worker name is set in `wrangler.jsonc`, the suffix is `${worker_name}.${account_subdomain}.workers.dev`. Plan-phase needs to capture the actual suffix to wire into `validation.ts` (D-14) — this can't be hardcoded until the Worker is deployed once.
- Cloudflare Workers Builds is the documented forward path that mirrors today's Pages "connect to Git" UX. This was the explicit reason for choosing Workers Static Assets over a separate-sweeper-Worker fallback at v1.3 roadmap time.

</specifics>

<deferred>
## Deferred Ideas

- **Canary-with-traffic-split rollout** — discussed and rejected; revisit only if portfolio traffic crosses thresholds where N% rollout becomes meaningful (not foreseeable at junior-SWE-portfolio scale).
- **GitHub Actions deploy workflow** — Cloudflare Workers Builds chosen as the dashboard equivalent. If Workers Builds proves insufficient (e.g., needing custom pre-build steps Cloudflare can't run), revisit with a `wrangler deploy` workflow.
- **Custom preview subdomain (`preview.jackcutrara.com`)** — discussed and rejected for portfolio scale; revisit if `*.workers.dev` URLs become a sharing-friction point.
- **Single-mode dev (`wrangler dev` only)** — discussed and rejected for HMR speed; revisit if the two-mode story produces parity bugs that bite in production.
- **Custom `workers-compat.mjs` post-build script** — Workers Static Assets handles output shape natively via the `[assets]` binding. If a future phase needs post-build glue for Workers, this is where it'd land.
- **`/api/resend-webhook` with Svix HMAC** — explicitly v1.4+ per v1.3 milestone lock; deliverability monitoring relies on inbox checks + Postmaster Tools for v1.3.
- **Workers Paid plan upgrade to bind `CHAT_RATE_LIMITER`** — v1.4+ per v1.3 milestone lock; DEBT-01 is documentation-only here.

### Reviewed Todos (not folded)

- **`.planning/todos/pending/2026-04-15-change-mobile-menu-breakpoint-from-380px-to-768px.md`** — Out of scope per v1.3 milestone-shape lock. UX revision unrelated to chat visibility; revisit in v1.4+.
- **`.planning/todos/pending/2026-04-15-design-and-ship-og-default-image.md`** — Out of scope per v1.3 milestone-shape lock. SEO/visual asset unrelated to chat visibility; revisit in v1.4+.

</deferred>

---

*Phase: 17-foundations-migration-dns-debt-sweep*
*Context gathered: 2026-05-09*
