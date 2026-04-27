# Roadmap: Jack Cutrara Portfolio

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7 (shipped 2026-03-31) | [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Editorial Redesign** — Phases 8-11 (shipped 2026-04-15) | [Archive](milestones/v1.1-ROADMAP.md)
- 🚧 **v1.2 Polish** — Phases 12-16 (in progress)

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

### 🚧 v1.2 Polish (In Progress)

**Milestone Goal:** Raise the bar on what already shipped — tasteful motion, real content everywhere, smarter chat, zero tech debt, measurable recruiter engagement. Additive on top of the shipped v1.1 editorial system; zero new runtime dependencies on the preferred path; MASTER.md §8 anti-pattern list stays intact.

- [x] **Phase 12: Tech Debt Sweep** — Close all v1.1 audit items; zero build warnings; stable base for every subsequent phase (completed 2026-04-15)
- [x] **Phase 13: Content Pass + Projects/ Sync** — Real case studies on all 6 projects; About/home/resume copy verified; `Projects/` → MDX sync tooling (completed 2026-04-19)
- [x] **Phase 14: Chat Knowledge Upgrade** — Build-time context generation, Anthropic prompt caching, tuned persona, prompt-injection hardening (completed 2026-04-23)
- [x] **Phase 15: Analytics Instrumentation** — Umami + CF Web Analytics in production; recruiter-engagement events visible in dashboard (completed 2026-04-26)
- [ ] **Phase 16: Motion Layer** — Tasteful native motion (View Transitions + IntersectionObserver reveal + CSS microinteractions); Lighthouse gate holds

## Phase Details

### Phase 12: Tech Debt Sweep
**Goal**: Every v1.1 non-blocking audit item closed or explicitly documented as an accepted trade-off, producing a clean base that every subsequent v1.2 phase layers on top of.
**Depends on**: Phase 11 (v1.1 shipped)
**Requirements**: DEBT-01, DEBT-02, DEBT-03, DEBT-04, DEBT-05, DEBT-06
**Success Criteria** (what must be TRUE):
  1. `pnpm build` emits zero warnings — lightning-css, `astro check`, and ESLint all clean on the shipped tree
  2. With the mobile menu open, all background UI is inert — keyboard users cannot Tab into page content behind the overlay, and the middle-element focus-trap edge case is gone
  3. Production Open Graph / social previews resolve the correct absolute URL on every page (homepage, about, projects index, project detail, contact)
  4. Chat copy-to-clipboard button markup and behavior are identical between live-streamed bot messages and messages rehydrated from localStorage after page reload
  5. `milestones/v1.1-MILESTONE-AUDIT.md` shows all 7 carried items as closed or annotated as accepted trade-offs with rationale referenced in MASTER.md
**Plans**: 6 plans
- [x] 12-01-build-warnings-sweep-PLAN.md — Wrangler upgrade + rate_limits schema fix + ESLint/CSS clean-up (DEBT-01)
- [x] 12-02-mobilemenu-chatwidget-inert-PLAN.md — Extend inert to .chat-widget in MobileMenu openMenu/closeMenu (DEBT-02)
- [x] 12-03-chat-copy-button-parity-PLAN.md — createCopyButton helper + vitest parity test + D-26 gate (DEBT-04)
- [x] 12-04-og-url-production-verify-PLAN.md — 5-URL curl sweep against prod, record in 12-VALIDATION.md (DEBT-03)
- [x] 12-05-master-token-exceptions-PLAN.md — MASTER.md §2.4 Accepted token exceptions + §11 changelog (DEBT-05)
- [x] 12-06-audit-closeout-PLAN.md — Annotate all 7 carried items in v1.1-MILESTONE-AUDIT.md (DEBT-06)

### Phase 13: Content Pass + Projects/ Sync
**Goal**: Every page a recruiter or engineer reads reflects Jack's real work — six real case studies, an accurate About narrative, verified homepage and resume copy, and a diff-reviewable sync pipeline that keeps `Projects/` as the single source of truth.
**Depends on**: Phase 12
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07
**Success Criteria** (what must be TRUE):
  1. A visitor opening any of the 6 project detail pages reads a real 600–900 word case study structured Problem → Approach & Architecture → Tradeoffs → Outcome → Learnings — no placeholder prose remains
  2. The About page narrative, homepage display hero, work list entries, and resume PDF copy all reflect Jack's current status and have been explicitly verified as of the milestone date
  3. `Projects/*.md` files are the authoritative source for project case-study bodies; `src/content/projects/*.mdx` frontmatter stays human-authored; `docs/CONTENT-SCHEMA.md` and `docs/VOICE-GUIDE.md` document both contracts
  4. `scripts/sync-projects.mjs` runs idempotently on manual trigger, writes only MDX body content, preserves frontmatter, and produces a reviewable `git diff` that `astro check` validates against the Zod schema
**Plans**: 9 plans
- [x] 13-01-test-stubs-wave-zero-PLAN.md — Author 13 RED test stubs (3 sync-script + 7 content/data + 3 docs/ROADMAP) covering every CONT-XX validation row (2026-04-19)
- [x] 13-02-sync-infra-PLAN.md — sync-projects.mjs (named exports, S1/S2/S3/S6) + Zod source: extension + package.json scripts + .gitattributes + first GH Actions workflow (CONT-05, CONT-06) (2026-04-19)
- [x] 13-03-docs-and-roadmap-PLAN.md — docs/CONTENT-SCHEMA.md + docs/VOICE-GUIDE.md authored; ROADMAP.md success criterion #1 amended per D-02 (CONT-07) (2026-04-19)
- [x] 13-04-daytrade-rename-and-anchors-PLAN.md — git mv crypto-breakout-trader.mdx → daytrade.mdx; source: field added to all 6 MDX; portfolio-context.json patched; about.ts dated annotations (CONT-04, CONT-05) (2026-04-19)
- [x] 13-05-case-studies-batch-a-PLAN.md — Case studies for SeatWatch + NFL Prediction (Projects/*.md fenced blocks + sync) (CONT-01, CONT-02) (2026-04-19)
- [x] 13-06-case-studies-batch-b-PLAN.md — Case studies for SolSniper + Optimize AI (CONT-01, CONT-02) (2026-04-19)
- [x] 13-07-case-studies-batch-c-PLAN.md — Case studies for Clipify + Daytrade body (CONT-01, CONT-02) (2026-04-19)
- [x] 13-08-uat-and-about-audit-PLAN.md — 13-UAT.md authored + Jack's manual UAT signoff for CONT-03 + CONT-04 (2026-04-19)
- [x] 13-09-phase-gate-d26-and-build-PLAN.md — D-26 chat regression battery + Lighthouse CI gate + final test sweep + phase close-out SUMMARY (2026-04-19)

### Phase 14: Chat Knowledge Upgrade
**Goal**: The chat widget answers project-specific questions from the real MDX content shipped in Phase 13, speaks in a tuned third-person persona, refuses off-scope and injection attempts, and preserves every Phase 7 security/streaming/a11y guarantee.
**Depends on**: Phase 13 (real content must exist before it becomes the knowledge base)
**Requirements**: CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, CHAT-08, CHAT-09
**Success Criteria** (what must be TRUE):
  1. A visitor asking a project-specific question (e.g., "what did Jack build for SeatWatch?") gets a grounded third-person answer sourced from the real MDX case studies, not placeholder boilerplate
  2. The chat refuses attempts to leak the resume PDF, expose PII, dump the system prompt, ignore prior instructions, or pivot to off-scope topics — verified by a committed prompt-injection test battery
  3. `portfolio-context.json` is regenerated at build time from MDX + About + Resume, split cleanly between static-authored and generated inputs, and cached via Anthropic `cache_control: ephemeral` on the knowledge block
  4. The full Phase 7 regression battery passes on production after the upgrade — XSS, CORS, rate limit, 30s timeout, focus trap, localStorage persistence, SSE streaming, markdown rendering, and copy-to-clipboard all behave identically to pre-upgrade baseline
**Plans**: 7 plans (6 shipped + 1 gap-closure from UAT)
- [x] 14-01-PLAN.md — RED test stubs + eval fixture (Wave 0) (2026-04-23)
- [x] 14-02-PLAN.md — Generator + static/generated split + build-chain (CHAT-03, CHAT-04) (2026-04-23)
- [x] 14-03-PLAN.md — SDK wire-up: cache_control + max_tokens (CHAT-05, CHAT-07) (2026-04-23)
- [x] 14-04-PLAN.md — System prompt rewrite + widget header rename (CHAT-06) (2026-04-23)
- [x] 14-05-PLAN.md — Injection battery GREEN + drift-guard (CHAT-08) (2026-04-23)
- [x] 14-06-PLAN.md — D-26 regression + Lighthouse CI + phase close-out (CHAT-09) (2026-04-23)
- [x] 14-07-PLAN.md — Gap closure: raise max_tokens 768 → 1500 + message_delta truncation observability (CHAT-07, CHAT-09; UAT test 3) (2026-04-23)

### Phase 15: Analytics Instrumentation
**Goal**: Jack can observe recruiter engagement on the live site — resume downloads, chat opens, outbound link clicks, and project scroll depth — via a Umami dashboard that fires only on production, uses zero cookies, and requires no consent banner.
**Depends on**: Phase 14 (ships before motion so Phase 16's impact can be measured against a real content + chat baseline)
**Requirements**: ANAL-01, ANAL-02, ANAL-03, ANAL-04, ANAL-05, ANAL-06
**Success Criteria** (what must be TRUE):
  1. The Umami dashboard receives pageview and custom events from `jackcutrara.com` only — local dev, preview deploys, and non-production hostnames emit nothing
  2. Recruiter-engagement events are visible end-to-end in the dashboard: resume PDF download, chat widget open, outbound social/mailto link clicks, and project-page scroll depth
  3. The existing `chat:analytics` CustomEvent (content-free per Phase 7 D-36) forwards to Umami via `src/scripts/analytics.ts` with no new PII exposure and no change to Phase 7 streaming semantics
  4. Cloudflare Web Analytics is live as the secondary Core Web Vitals source, and the site ships without a cookie-consent banner because Umami + CF Web Analytics are cookie-free by design
**Plans**: 5 plans
- [x] 15-01-PLAN.md — Umami `<script is:inline>` in BaseLayout with PROD gate + build-output tag-presence test + CF Web Analytics pre-deploy checklist (ANAL-01, ANAL-02, ANAL-06) (2026-04-23)
- [x] 15-02-PLAN.md — `src/scripts/analytics.ts` forwarder + delegated outbound listener + resume-download dedup + 15 client tests + BaseLayout body wires analytics.ts AND scroll-depth.ts (ANAL-03, ANAL-04, ANAL-05) (2026-04-24)
- [x] 15-03-PLAN.md — Scroll-depth observer `src/scripts/scroll-depth.ts` + 4 sentinels in `/projects/[id].astro` + 8 observer tests (ANAL-05) (2026-04-23)
- [x] 15-04-PLAN.md — chat.ts SSE truncated-frame parser (8-line additive diff at lines 195-202) + streamChat export + sse-truncation.test.ts (4 tests) + D-26 client-only re-run (ANAL-05, D-14, D-15) (2026-04-24)
- [x] 15-05-PLAN.md — 15-VERIFICATION.md scaffold (D-26 client-only + Umami dashboard checks + CF verification + cookie audit) + cache-hit-rate backlog todo + Umami UUID commit (orchestrator-applied via human-action checkpoint) (ANAL-01, ANAL-05, ANAL-06; ANAL-02 pending /gsd-verify-work CF dashboard toggle confirmation) (2026-04-24)
**UI hint**: yes

### Phase 16: Motion Layer
**Goal**: Tasteful motion layers on top of the locked editorial system — page-enter fade, scroll-reveal, WorkRow arrow, chat bubble pulse, chat panel scale-in, typing-dot bounce, `.h1-section` word-stagger — fully respecting reduced-motion, adding zero new runtime dependencies, and holding the Lighthouse 99/95/100/100 bar.
**Depends on**: Phase 15 (motion lands on a stable system: debt gone, real content in, chat upgraded, analytics already measuring baseline so motion's impact is visible)
**Requirements**: MOTN-01, MOTN-02, MOTN-03, MOTN-04, MOTN-05, MOTN-06, MOTN-07, MOTN-08, MOTN-09, MOTN-10
**Success Criteria** (what must be TRUE):
  1. A visitor with default motion preferences sees tasteful motion across scroll (section reveal), hover/focus (WorkRow arrow, chat bubble pulse), and page-enter (cross-document View Transition fade + chat panel scale-in + typing-dot bounce during SSE) — and the homepage `.display` hero is untouched
  2. A visitor with `prefers-reduced-motion: reduce` sees no entrance animations, no pulse, no stagger, no scale-in — every new motion is either gated by `@media (prefers-reduced-motion: no-preference)` or paired with an explicit `reduce` override
  3. Lighthouse CI on homepage + one project detail page holds Performance ≥99 / Accessibility ≥95 / Best Practices 100 / SEO 100 after the motion layer ships
  4. `design-system/MASTER.md` §5/§6 are amended with additive motion carve-outs (property whitelist, duration bands, easing defaults); §8 anti-pattern list is unchanged and no runtime dependency has been added to `package.json`
**Plans**: 7 plans

**Wave 0** *(RED test stubs land first; baseline for all subsequent waves)*
- [ ] 16-01-PLAN.md — Wave 0 RED test stubs (8 test files spanning MOTN-01..MOTN-10)

**Wave 1** *(blocked on Wave 0; 16-02 ‖ 16-03 run in parallel)*
- [ ] 16-02-PLAN.md — observer factory + scroll-depth refactor (D-17, D-19)
- [ ] 16-03-PLAN.md — design-system/MOTION.md authored + MASTER.md §6 stub + §8 reconciliation (MOTN-09)

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 16-04-PLAN.md — motion.ts + global.css scroll-reveal/word-stagger/view-transition + BaseLayout import (MOTN-01, MOTN-02, MOTN-07, MOTN-08)

**Wave 3** *(blocked on Wave 2; 16-05 ‖ 16-06 run in parallel)*
- [ ] 16-05-PLAN.md — chat.ts D-15 ordering + global.css chat-pulse + chat-panel scale-in + typing-dot reduce parity (MOTN-04, MOTN-05, MOTN-06; D-26 gate)
- [ ] 16-06-PLAN.md — WorkRow arrow upgrade (MOTN-03)

**Wave 4** *(blocked on Wave 3; phase gate, contains human-verify checkpoint)*
- [ ] 16-07-PLAN.md — phase gate: Lighthouse CI + D-26 + final test sweep + close-out (MOTN-10)

**Cross-cutting constraints** *(appear in 2+ plans' `must_haves.truths`):*
- D-26 chat regression gate (16-04, 16-05, 16-07) — Phase 7 battery runs on every chat-touching plan
- Reduced-motion contract MOTN-08 (16-01, 16-04, 16-05, 16-06) — every new motion gated by `no-preference` or paired with `reduce` override; first test in every motion feature is the reduced-motion negative case
- Lighthouse CI 99/95/100/100 + TBT≤150ms + CLS≤0.01 (16-07 enforces; 16-04/05 must not regress)
- Zero new `package.json` runtime deps (16-07 verifies; all plans honor)
**UI hint**: yes

## Cross-Phase Constraints

These milestone-level gates apply to multiple phases and must be documented in every plan that touches the listed surfaces.

### D-26 Chat Regression Gate
Any phase that touches `src/layouts/BaseLayout.astro`, `src/styles/global.css`, `src/scripts/chat.ts`, or `src/pages/api/chat.ts` must run the Phase 7 regression battery before merging — XSS sanitization, exact-origin CORS, 5/60s rate limit, 30s AbortController timeout, focus trap re-query on every Tab, localStorage persistence (50-msg cap / 24h TTL), SSE streaming with `async:false` marked parse, markdown rendering via DOMPurify strict whitelist, and clipboard idempotency (JS boolean + DOM data-attribute).

Applies to:
- **Phase 12** — DEBT-02 (MobileMenu `inert`, affects BaseLayout-adjacent surface), DEBT-04 (chat.ts copy button normalization)
- **Phase 14** — all of CHAT-03..CHAT-09 (api/chat.ts + chat.ts direct surface)
- **Phase 15** — ANAL-01, ANAL-03 (BaseLayout `<script>` injection + chat.ts event forwarding)
- **Phase 16** — MOTN-04, MOTN-05, MOTN-06 (chat.ts microinteractions and CSS in global.css)

### Lighthouse CI Gate
Every phase ends with Lighthouse CI on the homepage plus one project detail page. Acceptable thresholds: Performance ≥99 / Accessibility ≥95 / Best Practices 100 / SEO 100 / TBT ≤150ms / CLS ≤0.01. A phase cannot be marked complete if Lighthouse regresses below these thresholds. Phase 16 Motion must hold this bar under stress — any new `will-change` that sticks, 30+ observer targets, or unintended runtime dep is a blocker.

### Zero New Runtime Dependencies (Preferred Path)
All five v1.2 phases target zero `package.json` runtime additions. Any proposed addition must be justified in writing at plan-time with: (1) what native 2026 platform capability is insufficient, (2) transferred bundle size, (3) impact on Lighthouse CI gate, (4) fallback if the addition breaks. Optional `motion` (~5 kB) and `gray-matter` fallbacks live in Requirements Future — they are not defaults.

### Reduced-Motion Contract
Every new animation introduced in Phase 16 is wrapped in `@media (prefers-reduced-motion: no-preference)` or paired with a `reduce` override. The first test in every motion feature is the reduced-motion negative case.

### No Subtractive MASTER.md Amendments
Motion additions in Phase 16 are additive carve-outs in §5/§6 only. §8 anti-pattern list stays intact. GSAP, `<ClientRouter />`, and `transition:persist` remain prohibited.

## Progress

**Execution Order:**
Phases execute in numeric order: 12 → 13 → 14 → 15 → 16

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
| 12. Tech Debt Sweep | v1.2 | 6/6 | Complete   | 2026-04-15 |
| 13. Content Pass + Projects/ Sync | v1.2 | 7/9 | In progress | - |
| 14. Chat Knowledge Upgrade | v1.2 | 6/6 | Complete | 2026-04-23 |
| 15. Analytics Instrumentation | v1.2 | 5/5 | Complete | 2026-04-26 |
| 16. Motion Layer | v1.2 | 0/7 | Not started | - |
