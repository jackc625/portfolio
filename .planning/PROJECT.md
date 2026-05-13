# Jack Cutrara — Portfolio Website

## What This Is

A polished multi-page personal portfolio website for Jack Cutrara built with Astro 6, Tailwind CSS v4, and Geist typography deployed as a single Cloudflare Worker. The site showcases six real project case studies, technical ability, and professional polish — functioning as a living complement to his resume that positions him as a serious, capable junior software engineer worth interviewing. Live at jackcutrara.com.

After v1.3 the site ships with a tasteful motion layer, a knowledge-grounded chat widget powered by Anthropic prompt caching, privacy-respecting analytics measuring recruiter engagement, end-to-end conversation visibility (KV transcript persistence + hourly cron sweep + Resend email delivery to Jack's Gmail), and a locked editorial design system documented in `design-system/MASTER.md` + `design-system/MOTION.md`.

## Core Value

Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing — the site must make him more credible than a resume alone.

## Current State

**Shipped:** v1.3 Chat Visibility (2026-05-13)
**In flight:** None — planning next milestone (v1.4+)
**Live at:** jackcutrara.com (single Cloudflare Worker `jack-cutrara-portfolio`, version `ede1431f-e92a-4fda-af54-4f8f57781d3b`; hourly cron `["0 * * * *"]` ACTIVE; Pages project retired 2026-05-13)
**Tech stack:** Astro 6 + Tailwind CSS v4 + TypeScript (strict) + MDX + Cloudflare Workers Static Assets (`src/worker.ts` re-exports Astro `handle()` for `fetch` + adds `scheduled()` delegating to `deliverDue`) + Cloudflare KV (`CHAT_KV`) + Resend REST + Geist/Geist Mono typography
**Source LOC:** ~6,802 (src/ — astro, ts, css, mdx, md; +44% from v1.2 close)
**Repo:** github.com/jackc625/portfolio (public)
**Lighthouse (production-on-Cloudflare-edge canonical gate):** Performance 100 / Accessibility 95 / Best Practices 100 / SEO 100; motion-specific TBT=0ms / CLS≈0.0016
**Design contract:** `design-system/MASTER.md` (locked editorial system) + `design-system/MOTION.md` (v1.3.1 amendment adds MOTN-01 rejection-handling spec for pageswap handler); 6-hex palette, Geist/Geist Mono, restrained motion respecting `prefers-reduced-motion`
**Chat:** Claude Haiku via Anthropic SDK with `cache_control: ephemeral`; `portfolio-context.json` regenerated at build time from MDX + About + Resume + third-person `chatSummary`/`about-chat.ts` variants per CHAT-06 voice-split contract; D-26 regression battery preserved phase-wide; D-15 server byte-identical anchor preserved through Workers migration; TEST-03 Anthropic prompt-cache integrity verified (live 3x cache test `cache_read=48527` on Calls 2+3); `pnpm test` 560 PASS / 0 FAIL / 2 SKIP; `pnpm exec astro check` 0/0/0 (116 files)
**Chat persistence + delivery:** Every chat turn appended to KV `live:{sid}` transcript keyed by client-minted UUIDv4 sessionId (30-day TTL, 30-turn cap, inline metadata `{ last_activity_at, msg_count }`); hourly cron sweeps stale (≥2h inactive) sessions → renderEmail → Resend REST POST with `Idempotency-Key: transcript/{sid}` (24h window) → `delivered:{sid}` 24h TTL marker → `live:{sid}` DELETE; first live transcript email delivered to Jack's Gmail Inbox confirmed 2026-05-13 (resend_message_id `16bc7812-011d-4fea-87a6-b4cecd7ed71b`)
**Analytics:** Umami Cloud + Cloudflare Web Analytics live in production; cookie-free, no consent banner; recruiter-engagement events visible end-to-end

## Requirements

### Validated

- ✓ Modern, high-performance tech stack — v1.0 (Astro 6 + Tailwind v4 + TypeScript strict)
- ✓ Custom domain with HTTPS — v1.0 (jackcutrara.com on Cloudflare Pages)
- ✓ Content collection system for projects — v1.0 (Zod schema + MDX)
- ✓ Multi-page site (Home, About, Projects, Resume, Contact) — v1.0
- ✓ Home page with generative canvas hero — v1.0 (replaced in v1.1 by editorial display hero)
- ✓ About page with narrative and skills — v1.0
- ✓ Resume page with PDF download — v1.0 (replaced in v1.1 by inline download link)
- ✓ Contact page with email/LinkedIn/GitHub — v1.0
- ✓ Responsive design across breakpoints — v1.0
- ✓ Project card grid with 6 projects — v1.0 (replaced in v1.1 by numbered work list)
- ✓ Structured case study pages — v1.0 (2 fully written; remaining 4 filled in v1.2)
- ✓ Dual reading modes (recruiter scan + engineer deep dive) — v1.0
- ✓ Dark/light theme with persistent toggle — v1.0 (removed in v1.1)
- ✓ GSAP scroll animations and page transitions — v1.0 (removed in v1.1; replaced by native motion in v1.2)
- ✓ Hover micro-interactions — v1.0
- ✓ Print-friendly resume — v1.0
- ✓ JSON-LD structured data — v1.0
- ✓ SEO meta (title, description, OG tags) per page — v1.0
- ✓ Semantic HTML with accessibility — v1.0
- ✓ Keyboard navigation with focus indicators — v1.0
- ✓ Lighthouse 90+ all categories — v1.0
- ✓ Sub-2s LCP, CLS < 0.1 — v1.0
- ✓ Optimized images with lazy loading — v1.0
- ✓ prefers-reduced-motion respect — v1.0

- ✓ Editorial design system with locked MASTER.md contract — v1.1
- ✓ Geist + Geist Mono typography via Astro 6 Fonts API — v1.1
- ✓ Warm off-white #FAFAF7 + signal red #E63946 hex palette — v1.1
- ✓ Single light theme (dark mode removed) — v1.1
- ✓ Numbered editorial work list replacing card grid — v1.1
- ✓ Restrained motion (GSAP/scroll animations removed) — v1.1
- ✓ Chat widget restyled to editorial chrome — v1.1
- ✓ Lighthouse 90+ maintained after redesign — v1.1
- ✓ WCAG AA contrast verified — v1.1
- ✓ Full keyboard accessibility with visible focus rings — v1.1

- ✓ Zero v1.1 audit items outstanding — DEBT-01..06 closed (zero `pnpm build` warnings, MobileMenu inert extends to `.chat-widget`, OG URLs production-correct, chat copy-button parity, MASTER.md §2.4 token exceptions, all 7 carry-forward items annotated) — v1.2 (Phase 12)
- ✓ Real case studies on all 6 projects + `Projects/` → MDX sync pipeline — CONT-01..07 closed (600–900 word case studies, Problem→Approach→Architecture→Tradeoffs→Outcome→Learnings, idempotent `scripts/sync-projects.mjs`, CONTENT-SCHEMA + VOICE-GUIDE published) — v1.2 (Phase 13)
- ✓ Chat knowledge upgrade — build-time `portfolio-context.json`, Anthropic prompt caching, third-person persona, prompt-injection hardening, max_tokens 768→1500 + truncation observability — CHAT-03..09 closed — v1.2 (Phase 14)
- ✓ Privacy-respecting analytics — Umami Cloud + Cloudflare Web Analytics live in production with cookie-free recruiter-engagement events (resume download, chat open, outbound clicks, project scroll depth, `chat_truncated`) — ANAL-01..06 closed — v1.2 (Phase 15)
- ✓ Tasteful motion layer — cross-document `@view-transition` fade, IntersectionObserver scroll-reveal, WorkRow arrow, chat bubble pulse, chat panel scale-in, typing-dot bounce, `.h1-section` word-stagger — reduced-motion contract held, zero new runtime deps, Lighthouse motion-specific gate PASS (TBT=0ms / CLS≈0.0016), D-26 117/117 GREEN, manual UAT 13/13 PASS — MOTN-01..10 closed — v1.2 (Phase 16)

- ✓ Cloudflare Pages → Workers Static Assets migration — single Worker binding serves static + `/api/chat` + hourly `scheduled()` cron from one deployment; custom domain `jackcutrara.com` reattached; CI/CD via Workers Builds; D-15 SSE byte-identical anchor PRESERVED through cutover — FOUND-01..04 closed — v1.3 (Phase 17)
- ✓ Resend sending domain `mail.jackcutrara.com` DNS-verified + warmed — full 4-record family in Cloudflare DNS (SPF + DKIM 3x + MX feedback-smtp.us-east-1 + DMARC `p=none`); 5/5 warmup sends in Gmail Inbox first-try; Postmaster Tools enrolled — DNS-01..02 closed — v1.3 (Phase 17)
- ✓ All five v1.2 chat carry-forward debt items closed — PROJECT.md "Known issues" reframed to "Free-tier acceptable"; `chat.cache_metrics` server + DEV-only client log seams; CI `build:chat-context:check` gate; idempotent `astro:page-load` listener dedup; CSS-only `#chat-panel` state machine structurally enforced at BOTH specificity tiers — DEBT-01..05 closed — v1.3 (Phase 17)
- ✓ Phase 17 UAT gap closure — chat voice-split (CHAT-06) holds at chat surface; inline `display:none` removed from ChatWidget.astro; COPY button `.copy-success` CSS rule + `COPY_FEEDBACK_MS = 1500` const; head-level `<script is:inline>` pageswap handler swallows AbortError; DEPLOY-GATE.md operator-confirmed before push — UAT-GAP-01..04 closed — v1.3 (Phase 17 Waves 7-10)
- ✓ KV transcript persistence — every chat turn appended to versioned `live:{sessionId}` keyed by client-minted UUIDv4 sessionId via `crypto.randomUUID()`; 30-day TTL; 30-turn cap; inline metadata `{ last_activity_at, msg_count }` eliminates O(n) cron round-trips; sessionId NEVER threaded into Anthropic payload (TEST-03 prompt-cache integrity PRESERVED — live `cache_read=48527`); per-sessionId 100-writes/hr quota — KV-01..05, IDENT-01..02, META-01..02 closed — v1.3 (Phase 18)
- ✓ Hourly cron sweep with two-keyspace promotion — `wrangler.jsonc triggers.crons: ["0 * * * *"]`; `scheduled()` delegates to `deliverDue` via rejection-safe `ctx.waitUntil(...).catch(...)`; crash-safe ordering (PUT delivered → POST → DELETE live); per-session try/catch isolation; 50-session batch cap; 50-page pagination cap; DRY_RUN gate validated mechanics before delivery flip; structured JSON logs per tick — CRON-01..04 closed — v1.3 (Phase 19)
- ✓ Resend REST email delivery — pure `fetch()` wrapper to `https://api.resend.com/emails` with `Idempotency-Key: transcript/{sessionId}` 24h window; AbortController 10s timeout; 3-variant discriminated `Result` per D-17; plaintext-only body with sanitizer pipeline stripping bidi overrides + null bytes + HTML-escaping every dynamic field; adversarial-payload suite covers `<script>` / `</p><img onerror=...>` / `javascript:` / RTL override / null bytes / social-engineering prefixes; first live transcript email delivered to Jack's Gmail Inbox confirmed 2026-05-13 — MAIL-01..05 closed — v1.3 (Phase 20)
- ✓ Cross-phase gates HELD phase-wide — D-15 SSE byte-identical anchor + D-26 chat-surface regression battery + TEST-03 Anthropic prompt-cache integrity all PRESERVED; `pnpm test` 560 PASS / 0 FAIL / 2 SKIP; `pnpm exec astro check` 0/0/0 (116 files); `package.json dependencies` byte-identical phase-wide (MAIL-01 zero-new-runtime-dep lock) — TEST-01..03 closed — v1.3 (cross-phase)

### Active

(v1.4 milestone requirements TBD — to be defined via `/gsd-new-milestone`.)

### Out of Scope

- Blog / writing section — not committed to writing cadence
- Testimonials — no content source
- CMS — static content sufficient
- Contact form — direct links (email, LinkedIn) more professional for this audience
- 3D / Three.js / canvas — bloats bundle, kills mobile performance
- Skills progress bars / GitHub contribution graph — amateurish signals
- Real-time chat / voice — chatbot covers Q&A sufficiently
- Background audio / custom loading screens — accessibility + performance anti-patterns
- Reintroducing GSAP — removed in v1.1 for a reason; native 2026 platform covered v1.2 motion needs without runtime deps
- Reintroducing `<ClientRouter />` — collides with Phase 7 localStorage chat persistence; v1.2 Phase 16 used cross-document `@view-transition` CSS at-rule instead

## Context

**v1.3 Chat Visibility (2026-05-09 → 2026-05-13, 4 days):** 4 phases (17-20), 26 plans, 195 commits, 195 files changed (+48,069 / −1,684 LOC repo-wide; src/ alone 26 files +2,239 / −152). Source LOC climbed from ~4,715 to ~6,802 (+44%). 36/36 v1.3 requirements satisfied. 4/4 cross-phase wiring chains WIRED end-to-end (visitor turn → KV write; cron tick → sweep; sweep → Resend → KV mark; D-26 cross-phase chat-surface invariant). All cross-phase gates HELD (D-15 SSE byte-identical, D-26 chat regression battery, TEST-03 Anthropic prompt-cache integrity, MAIL-01 zero-new-runtime-dep). Production deployment active at jackcutrara.com on single Worker (version `ede1431f-e92a-4fda-af54-4f8f57781d3b`); live email delivery confirmed (Gmail Inbox arrival 2026-05-13T14:00:53Z). 1 deferred item at close: SC4 organic-traffic idempotency-in-the-wild 7-day soft cap closure 2026-05-20.

**v1.2 Polish (2026-04-15 → 2026-04-27, 12 days):** 5 phases (12-16), 34 plans, 213 commits, 132 code/config files (+5946 / -470 LOC). Source LOC climbed from ~3,859 to ~4,715. All 36 v1.2 requirements satisfied per milestone audit. 5/5 phases verified, 5/5 E2E recruiter flows pass, 31/33 cross-phase integration points wired.

**v1.1 Editorial Redesign (2026-04-07 → 2026-04-15):** 4 phases (8-11), 27 plans, 63 tasks, ~150 commits over 9 days. Source LOC ~2,875 → ~3,859. Design contract locked at `design-system/MASTER.md`.

**v1.0 MVP (2026-03-22 → 2026-04-04):** 6 phases + Phase 7 chatbot, 27 plans + 5 plans, 43 tasks. Initial Astro 6 + Tailwind v4 + TypeScript foundation deployed to Cloudflare Pages.

**Known issues / tech debt:**

- `CHAT_RATE_LIMITER` Cloudflare binding documented + Free-tier acceptable. Code path defensively skips when binding absent — byte-identical from Phase 7. Workers Paid plan upgrade is v1.4+ trigger; reconsider if Anthropic spend or chat volume crosses thresholds that justify $60/yr.
- Lighthouse Performance ≥99 on localhost not held (Phase 16 home 80 / project 81); accepted per Phase 15 §9 production-on-Cloudflare-edge canonical-gate precedent. Motion-specific TBT=0 / CLS≈0 PASS comfortably.
- SC4 organic-traffic idempotency-in-the-wild closure pending 2026-05-20 (7-day soft cap from Phase 20 deploy); Layer 1 (`delivered:{sid}` cursor) + Layer 2 (Resend Idempotency-Key 24h window) structurally unit-locked at both layers; first organic visitor session post-deploy closes SC4.
- Cross-phase test fragility — `tests/build/worker-scheduled-call-site.test.ts` Invariant F regex `/DRY_RUN\s*:\s*(?:"1"|string)/` now passes via comment match in `worker.ts:46` after Phase 20 DRY_RUN flip. Functional wiring unaffected; lock fidelity degraded. Fix: broaden regex to accept `"0"` literal.
- `CHAT_SENDER_EMAIL` + `CHAT_RECIPIENT_EMAIL` live exclusively as Wrangler dashboard secrets with no in-repo `.dev.vars` fallback documented. Operationally correct (sendOne env-narrowing guard catches missing values) but creates invisible deployment dependency on fresh Workers.
- Frontmatter attribution gaps — Phase 17 plans 17-07/08/09/10 + Phase 19 plans 19-01..04 omit `requirements-completed:` field. Requirements still covered by VERIFICATION.md + traceability table — documentation hygiene only.
- Pre-existing Resend DNS dust on `send.*` + root left untouched (no conflict with `mail.*` scope); scheduled as low-priority `/gsd-quick` cleanup.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro 6 + Tailwind v4 + TypeScript | Modern + best performance, research-driven | ✓ Good — zero-JS pages, fast builds |
| Cloudflare Pages deployment | Unlimited bandwidth, fastest edge, Astro-owned | ✓ Good — live at jackcutrara.com |
| GSAP for animations (v1.0) | ScrollTrigger + SplitText premium feel | — Replaced in v1.1 by restrained motion; v1.2 used native CSS/IntersectionObserver instead |
| Clone shiyunlu.com design language | Need specific reference to avoid generic AI designs | ✓ Good — distinctive visual identity |
| Canvas hero with simplex noise (v1.0) | Unique first impression, differentiator | — Replaced in v1.1 by editorial display hero |
| Dark-first OKLCH token system (v1.0) | Modern color space, theme-switchable via CSS vars | — Replaced in v1.1 by flat 6-hex palette |
| Content collections + MDX | Type-safe project content with component support | ✓ Good — placeholder-friendly workflow + sync-pipeline source-of-truth |
| Locked editorial design system (v1.1) | Restraint over motion — MASTER.md as single source of truth | ✓ Good — Lighthouse 100/95/100/100, distinctive visual identity |
| Flat hex tokens replacing OKLCH (v1.1) | Simpler mental model, single light theme eliminates theme machinery | ✓ Good — dead theme code removed, smaller surface area |
| localStorage chat persistence replacing transition:persist (v1.1) | ClientRouter removed; localStorage survives the navigation model | ✓ Good — 50-msg cap + 24h TTL preserves UX without DOM persistence |
| MobileMenu container query (v1.1) | `@container (max-width: 380px)` is true signal, not viewport width | ✓ Good — hamburger appears when nav actually wraps |
| `Projects/*.md` as authoritative source for case-study bodies (v1.2) | Single source of truth + reviewable diff pipeline | ✓ Good — idempotent `sync-projects.mjs`, MDX frontmatter human-authored, Zod-validated |
| Anthropic `cache_control: ephemeral` on chat knowledge block (v1.2) | Hit cache-read pricing for repeated context | ✓ Good — build-time generation + cached system block |
| Native motion stack (v1.2) — `@view-transition` + IntersectionObserver + CSS keyframes | Zero new runtime deps, native reduced-motion support | ✓ Good — Phase 16 shipped tasteful motion without reintroducing GSAP |
| Per-primitive scoped reduce-overrides D-14 (v1.2) | Confines motion contract to primitive boundary; neutralizers live in primitive's own `<style>` | ✓ Good — WorkRow scoped, chat-bubble globally scoped (no scoped-island available) |
| Production-on-Cloudflare-edge as canonical Lighthouse gate (v1.2) | Localhost simulated-throttled-4G LCP/FCP is upstream artifact, not motion regression | ✓ Good — Phase 15 §9 precedent carried into Phase 16 |
| Umami Cloud + CF Web Analytics, no consent banner (v1.2) | Cookie-free by design; privacy-respecting; recruiter-engagement event surface end-to-end | ✓ Good — production dashboard live, zero PII exposure |
| Anthropic `max_tokens` 768 → 1500 (v1.2 Phase 14 gap-closure) | UAT test 3 surfaced truncation; richer answers needed | ✓ Good — paired with `message_delta` truncation observability |
| TDD with Wave 0 RED stubs every v1.2 phase | Goal-backward verification; nyquist coverage upstream not retroactive | ✓ Good — applied Phases 13/14/15/16; all 5 phases NYQUIST-COMPLIANT |
| Cloudflare Pages → Workers Static Assets migration (v1.3 Phase 17) | Single binding for static + API + cron handlers; eliminate Pages/Worker hybrid complexity | ✓ Good — D-15 SSE byte-identical preserved through cutover; D-15 + D-26 cross-phase gates HELD |
| KV (`CHAT_KV`) over D1 for transcripts (v1.3 Phase 18) | Jack reads every transcript in entirety; no aggregation/search need; KV's 1 write/sec/key cap acceptable at portfolio scale | ✓ Good — sweep cost stays O(N) where N is sessions due, not turns |
| Client-minted UUIDv4 sessionId via `crypto.randomUUID()` (v1.3 Phase 18) | Preserves localStorage compatibility; simpler upgrade path; no server-issued cookie complexity | ✓ Good — STORAGE_VERSION 1→2 auto-clear path triggered cleanly |
| sessionId on HTTP envelope only, NEVER in Anthropic payload (v1.3 Phase 18) | Anthropic prompt-cache hit rate preservation; TEST-03 cross-phase gate | ✓ Good — live 3x cache test `cache_read=48527` on Calls 2+3 (2026-05-11) |
| Two-keyspace partition `live:` → `delivered:` with PUT-before-POST (v1.3 Phase 19) | Crash-safe ordering at every step boundary; application-level idempotency before Resend's | ✓ Good — Step 3 live UAT verified `delivered:{sid}` populated before `live:{sid}` deleted |
| DRY_RUN flag with rollback runway PRESERVED BYTE-IDENTICAL (v1.3 Phase 19 D-03) | Every Phase 20 step has same-line rollback; build guard `chat-delivery-send-site.test.ts` source-text-locks runway presence | ✓ Good — single-line wrangler.jsonc flip restores DRY_RUN posture |
| Resend REST via `fetch()` not SDK (v1.3 Phase 20 MAIL-01) | Zero new runtime deps in Workers; no Node-runtime APIs | ✓ Good — `package.json dependencies` byte-identical phase-wide |
| Plaintext email body only — no `html` field (v1.3 Phase 20 MAIL-02) | No HTML rendering of user-typed text = no phishing-into-inbox surface | ✓ Good — adversarial-payload suite confirms Gmail renders all payloads as literal text |
| 3-variant discriminated `ResendResult` (sent / failed_transient / failed_terminal) per D-17 (v1.3 Phase 20) | No `replayed` variant — Layer 1 `delivered:{sid}` cursor IS the application-side replay detector | ✓ Good — 3 log events (`chat.delivery.sent` / `.retry` / `.failed`) cover all paths |
| M-iter2 serial gap-closure wave correction (v1.3 Phase 17 Waves 7-10) | Chat-surface mutations cannot run parallel without muddying D-26 attribution; deploy-blocker plan gated LAST | ✓ Good — DEPLOY-GATE.md operator-confirmed cleanly before push |
| WR-04 `ALLOW_LOOPBACK` three-signal disjunction (Rule 3 deviation, v1.3 Phase 17 Plan 17-08) | @astrojs/cloudflare adapter doesn't statically replace `import.meta.env.DEV` in SSR routes under `astro dev` | ✓ Good — production CORS posture UNCHANGED via tree-shaking; locally `pnpm dev` works |

## Constraints

- **Design process**: All visual/UI/UX decisions routed through frontend-design skill — no ad-hoc design choices
- **Tech stack**: Astro 6 + Tailwind CSS v4 (GSAP removed in v1.1; native motion only in v1.2+)
- **Design system**: `design-system/MASTER.md` is the locked contract; `design-system/MOTION.md` is the additive motion carve-out from v1.2 Phase 16; six-hex palette; Geist + Geist Mono only
- **Chat**: Phase 7 architecture preserved (SSE streaming, focus trap, XSS sanitization, CORS, 5/60s rate limit, 30s timeout, localStorage persistence) — D-26 regression battery is a milestone-level gate for any phase touching `BaseLayout.astro` / `global.css` / `chat.ts` / `api/chat.ts`
- **Audience**: Must serve both 30-second recruiter scans and 10-minute engineer deep dives
- **Zero new runtime dependencies preferred path** — established in v1.2; honor in future phases unless justified at plan-time

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-13 after v1.3 Chat Visibility milestone. 4 phases (17-20), 26 plans, 195 commits over 4 days. 36/36 v1.3 requirements satisfied. Live deployment at jackcutrara.com on single Cloudflare Worker; first live transcript email delivered to Jack's Gmail Inbox confirmed (resend_message_id `16bc7812-011d-4fea-87a6-b4cecd7ed71b`). `pnpm test` 560 PASS / 0 FAIL / 2 SKIP; `pnpm exec astro check` 0/0/0 (116 files). Next milestone: TBD via `/gsd-new-milestone`.*
