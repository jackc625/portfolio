# Roadmap: Jack Cutrara Portfolio

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7 (shipped 2026-03-31) | [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Editorial Redesign** — Phases 8-11 (shipped 2026-04-15) | [Archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 Polish** — Phases 12-16 (shipped 2026-04-27) | [Archive](milestones/v1.2-ROADMAP.md)
- ✅ **v1.3 Chat Visibility** — Phases 17-20 (shipped 2026-05-13) | [Archive](milestones/v1.3-ROADMAP.md)
- 🚧 **v1.4 Professional Experience** — Phases 21-25 (in progress, started 2026-07-08)

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

<details>
<summary>✅ v1.3 Chat Visibility (Phases 17-20) — SHIPPED 2026-05-13</summary>

- [x] Phase 17: Foundations — Migration + DNS + Debt Sweep (10/10 plans) — completed 2026-05-11 — Cloudflare Pages → Workers Static Assets migration with single binding for static + API + cron; `mail.jackcutrara.com` DNS-verified + warmed on Resend; all 5 v1.2 chat debt items closed (DEBT-01..05); 4 UAT gap-closure plans (UAT-GAP-01..04) closed in serial waves; DEPLOY-GATE.md operator-confirmed by Jack Cutrara
- [x] Phase 18: Persistence + Identity — KV Write Path + sessionId (8/8 plans) — completed 2026-05-11 — `CHAT_KV` namespace bound; client-minted UUIDv4 sessionId via `crypto.randomUUID()`; per-turn append to versioned `live:{sid}` transcripts (30-day TTL, 30-turn cap); rich metadata + cache-token counts per turn; sessionId on HTTP envelope only (TEST-03 prompt-cache integrity PRESERVED); live 3x cache test `cache_read=48527` on Calls 2+3
- [x] Phase 19: Cron Sweep — Scheduling + Idempotency (DRY_RUN) (4/4 plans) — completed 2026-05-12 — Hourly cron `["0 * * * *"]` wired; `scheduled()` handler delegates to `deliverDue` via rejection-safe `ctx.waitUntil(...).catch(...)`; two-keyspace promotion (`live:` → `delivered:`) under DRY_RUN with per-session try/catch isolation, 50-session batch cap, retry harness, and structured Workers Logs; 19-UAT.md operator runbook authored
- [x] Phase 20: Email Render + Resend Integration (4/4 plans) — completed 2026-05-13 — Pure renderer (`src/lib/email/render.ts`) + Resend REST wrapper (`src/lib/email/resend.ts`); 3-variant discriminated Result per D-17; `wrangler.jsonc DRY_RUN "1"` → `"0"` atomic flip; first live transcript email delivered to Jack's Gmail Inbox confirmed (resend_message_id `16bc7812-011d-4fea-87a6-b4cecd7ed71b`); SC4 organic-traffic 7-day soft cap closure 2026-05-20

</details>

### 🚧 v1.4 Professional Experience (Phases 21-25) — IN PROGRESS

- [x] **Phase 21: Experience Content Pipeline & Collection** — Typed `experience` collection fed from `Experience/*.md` via a sync script mirroring the projects pipeline (completed 2026-07-09)
- [x] **Phase 22: Experience Page & Holloway Case Study** — Dedicated Experience page + nav; Holloway scannable summary → full deep-dive; Balfour Beatty lightweight entry (completed 2026-07-09)
- [x] **Phase 23: Projects Reconciliation & Featured Tier** — Sync Multi-Chain EVM (#7); feature SeatWatch / Multi-Chain EVM / NFL Prediction; keep the rest accessible below (completed 2026-07-10)
- [ ] **Phase 24: Positioning Shift & Home Teaser** — New-grad-with-production-experience framing across Core Value, About, education status, metadata; Home Holloway teaser
- [ ] **Phase 25: Chat Knowledge Refresh & Milestone Verification** — Regenerate `portfolio-context.json` with experience + project #7 (third-person voice split); hold D-26/D-15/astro-check/Lighthouse gates

## Phase Details

### Phase 21: Experience Content Pipeline & Collection

**Goal**: A typed, Zod-validated `experience` content collection exists, fed from `Experience/*.md` through a sync pipeline mirroring `scripts/sync-projects.mjs`, carrying the fields and ordering contract the Experience surface will render.
**Depends on**: Nothing new (builds on the live v1.3 site and its established content-collection + sync-pipeline pattern)
**Requirements**: EXP-01, EXP-06
**Success Criteria** (what must be TRUE):

  1. `Experience/*.md` sources (Holloway, Balfour Beatty) sync into a Zod-validated `experience` collection through a script that mirrors `scripts/sync-projects.mjs`; the sync is idempotent (a `--check` re-run reports no drift).
  2. Each experience entry exposes role, company, dates, and tech/skills as typed frontmatter validated at build time (`astro check` passes on the new collection).
  3. Querying the collection returns entries in reverse-chronological order (most recent engagement first), establishing the ordering + field contract the Experience page renders against.
  4. `pnpm build` succeeds with the new collection wired in and no new runtime dependencies are added.

**Plans**: 4/4 plans complete
**Wave 1**

- [x] 21-01-PLAN.md — Sync mechanism: `sync-experience.mjs` (lift + D-07 strip) + Wave 0 tests-first suite + npm scripts
- [x] 21-02-PLAN.md — `experience` Zod schema registered in `content.config.ts` (D-01 fields, A1 highlights bound)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 21-03-PLAN.md — Author fenced sources (Holloway fence + new Balfour) + both MDX entries + run sync + build gate

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 21-04-PLAN.md — CI drift gate step + `docs/CONTENT-SCHEMA.md` experience documentation

### Phase 22: Experience Page & Holloway Case Study

**Goal**: Visitors can reach a dedicated Experience page from the primary nav that presents Holloway as a scannable summary opening into a full deep-dive, alongside a lightweight Balfour Beatty entry — all rendered from the Phase 21 collection.
**Depends on**: Phase 21
**Requirements**: EXP-02, EXP-03, EXP-04, EXP-05
**Success Criteria** (what must be TRUE):

  1. A visitor can navigate to a dedicated Experience page from the primary navigation (new route + nav entry present site-wide).
  2. The Experience page shows the Holloway engagement as a scannable summary of headline highlights, with role, company, dates, and stack visible at a glance.
  3. A visitor can open a full Holloway deep-dive case study in its own detail view (Problem→Approach→Outcome depth drawn from `HOLLOWAY_EXPERIENCE.md`) and navigate back to the summary.
  4. The Balfour Beatty 2023 internship appears as a lightweight earlier-work-history entry (role, dates, 1–2 lines) with no full case study.
  5. All visual/layout decisions were routed through the frontend-design skill against `design-system/MASTER.md`; `astro check` stays 0/0/0 and the D-26 chat-surface battery holds through any `BaseLayout.astro`/`global.css` change.

**Plans**: 5/5 plans complete
**UI hint**: yes

**Wave 1** *(tests-first)*

- [x] 22-01-PLAN.md — Wave 0 validation suite: experience-nav / experience-summary / experience-detail / experience-voice-em-dash tests (mirror case-studies-shape / voice-em-dash / projects-collection)

**Wave 2** *(blocked on Wave 1; no file overlap — parallel)*

- [x] 22-02-PLAN.md — Primary nav entry `experience` FIRST in Header.astro + MobileMenu.astro (D-03); focus-trap/inert script untouched (D-26)
- [x] 22-03-PLAN.md — `/experience` listing page (asymmetric two-tier D-04/D-05/D-06, frontend-design-composed) + D-08 company normalization in holloway.mdx
- [x] 22-04-PLAN.md — `/experience/[id]` Holloway deep-dive (hasCaseStudy filter D-01, D-07 header, D-02 back links, D-11 scroll sentinels, page-scoped prose CSS)

**Wave 3** *(blocked on Wave 2)*

- [x] 22-05-PLAN.md — Phase gate: full suite (D-26 battery) + build route set + drift + QA-02 dep lock + frontend-design human visual sign-off (SC5d)

### Phase 23: Projects Reconciliation & Featured Tier

**Goal**: The résumé-aligned project set is reconciled — the Multi-Chain EVM trader is synced onto the site, three projects are featured in a top tier, and the remaining four stay accessible below, with one data-model distinction driving ordering everywhere.
**Depends on**: Nothing new (reuses the existing `sync-projects.mjs` pipeline and the `featured`/`order` schema fields already in `src/content.config.ts`)
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04
**Success Criteria** (what must be TRUE):

  1. The Multi-Chain EVM / Multi-Dex Crypto Trader project (`Projects/7 - MULTI-DEX CRYPTO TRADER.md`) renders as a full case-study page, synced through the existing `sync-projects.mjs` pipeline.
  2. SeatWatch, Multi-Chain EVM, and NFL Prediction appear in a visually distinct featured tier at the top of the project listing(s).
  3. The remaining four projects (SolSniper, Optimize-AI, Clipify, DayTrade) stay reachable below the featured tier — nothing is deleted.
  4. A single data-model distinction (`featured` flag / `order` field) drives the same featured-then-rest ordering on both the Projects page and the Home work list.
  5. The featured-tier visual treatment was routed through the frontend-design skill; `astro check` stays 0/0/0 and no new runtime dependencies are added.

**Plans**: 4/4 plans complete
**UI hint**: yes

**Wave 1**

- [x] 23-01-PLAN.md — #7 sync + fenced case study + D-15 chat-skip + featured/order reconciliation + SC4 ordering gate

**Wave 2** *(blocked on Wave 1; parallel — zero file overlap)*

- [x] 23-02-PLAN.md — Content-gate coverage: add #7 to the six site-side pinned arrays (D-16); chat-side pins left unchanged
- [x] 23-03-PLAN.md — Two-tier featured UI (WorkRow tagline prop, projects.astro FEATURED/MORE WORK, Home taglines + See all work link), frontend-design routed + SC2 render gate

**Wave 3** *(blocked on Wave 2)*

- [x] 23-04-PLAN.md — Phase gate: full `pnpm build` + `pnpm test` + drift + dep lock (QA-02) + human sign-off (#7 copy D-02/D-03 + frontend-design SC5)

### Phase 24: Positioning Shift & Home Teaser

**Goal**: The site reads as a new-grad engineer with shipped production experience — Core Value framing, About narrative, education status, and metadata all updated in an honest new-grad (not senior) register — with a Home teaser surfacing the Holloway highlight for the 30-second recruiter scan.
**Depends on**: Phase 22 (the Home teaser links through to the Experience page)
**Requirements**: POS-01, POS-02, POS-03, POS-04, HOME-01
**Success Criteria** (what must be TRUE):

  1. Home and About copy present Jack as a new-grad engineer with production experience (first-person site voice), no longer "a student building side projects."
  2. The About narrative reflects the professional experience and graduation while keeping an honest new-grad (not senior) register.
  3. Education status shows the completed WGU B.S. Computer Science (May 2026), the Virginia Tech transfer, and the LPI Linux Essentials certification wherever education is surfaced.
  4. Site metadata (SEO title/description and the JSON-LD Person schema) reflects the updated positioning and job title.
  5. The Home page surfaces a concise Holloway experience teaser that links through to the Experience page.

**Plans**: 3/4 plans executed
**UI hint**: yes

**Wave 1** *(foundation — education module + Nyquist Wave 0 gates)*

- [x] 24-01-PLAN.md — `src/data/education.ts` SSoT (facts + DERIVED alumniOf/hasCredential fragments) + Gate D (education module) + strengthened Gate E (chat-surface tripwire) + phase-start invariant baseline (protected-file hashes + deps + og placeholder) for the capstone; both gates GREEN at this boundary (review: Gate A→24-04, Gate B/C→24-02)

**Wave 2** *(blocked on 24-01; parallel — zero file overlap)*

- [x] 24-02-PLAN.md — Home `index.astro`: 01 EXPERIENCE Holloway teaser (frontend-design, id-guarded query) + renumber 01/02/03/04 (incl `ContactSection.astro` literal + strip its em-dash comments) + enrich personSchema (jobTitle/alumniOf/hasCredential) + sharpen SEO description + author Gate B/C (home-teaser render + JSON-LD parse), GREEN at this boundary
- [x] 24-03-PLAN.md — About: `about.ts` copy revision (intro/P1/P3, P2 verbatim) + `/about` Education block (frontend-design) fed by `education.ts` + description sharpen + author `about-education-render` POS-03 regression test

**Wave 3** *(blocked on 24-02, 24-03)*

- [ ] 24-04-PLAN.md — Real 1200x630 `og-default.png` (frontend-design, ONE deterministic fail-closed path + PNG-signature/size/hash-diff verifier) + author Gate A (site-copy em-dash/register) + capstone gate (build + full suite incl D-26/sse-snapshot + astro-check 0/0/0 + phase-start baseline comparison for protected files/deps) + human sign-off (copy review + 6-pillar at 375px/1440px with focus/reduced-motion/overflow + Schema Markup Validator)

### Phase 25: Chat Knowledge Refresh & Milestone Verification

**Goal**: The chat's grounded knowledge includes the new Experience content and project #7 in third-person voice, and the milestone's cross-cutting quality gates are verified green end-to-end before ship.
**Depends on**: Phase 22, Phase 23, Phase 24 (needs the Experience content, the synced project #7, and the finalized positioning in place before regenerating chat knowledge and running the milestone verification pass)
**Requirements**: CHAT-10, CHAT-11, QA-01, QA-02
**Success Criteria** (what must be TRUE):

  1. Build-time `portfolio-context.json` regeneration ingests the Experience content and the synced project #7 (the `Projects/7` D-04 exclusion in `build-chat-context.mjs` is lifted deliberately), so the chat's grounded knowledge includes the Holloway engagement and the Multi-Chain EVM trader.
  2. The chat widget accurately answers questions about the Holloway engagement and the updated positioning in third person, with the CHAT-06 voice-split leak guard passing (the build hard-fails on any first-person leakage into chat-bound fields).
  3. The D-26 chat-surface regression battery and the D-15 SSE byte-identical anchor hold across every change touching `BaseLayout.astro` / `global.css` / `chat.ts` / `api/chat.ts`.
  4. `pnpm exec astro check` is 0/0/0, Lighthouse holds at or above prior scores on the production-on-Cloudflare-edge canonical gate, and no new runtime dependencies were added across the milestone.

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
| 17. Foundations — Migration + DNS + Debt Sweep | v1.3 | 10/10 | Complete | 2026-05-11 |
| 18. Persistence + Identity — KV Write Path + sessionId | v1.3 | 8/8 | Complete | 2026-05-11 |
| 19. Cron Sweep — Scheduling + Idempotency (DRY_RUN) | v1.3 | 4/4 | Complete | 2026-05-12 |
| 20. Email Render + Resend Integration | v1.3 | 4/4 | Complete | 2026-05-13 |
| 21. Experience Content Pipeline & Collection | v1.4 | 4/4 | Complete    | 2026-07-09 |
| 22. Experience Page & Holloway Case Study | v1.4 | 5/5 | Complete    | 2026-07-09 |
| 23. Projects Reconciliation & Featured Tier | v1.4 | 4/4 | Complete    | 2026-07-10 |
| 24. Positioning Shift & Home Teaser | v1.4 | 3/4 | In Progress|  |
| 25. Chat Knowledge Refresh & Milestone Verification | v1.4 | 0/TBD | Not started | - |
