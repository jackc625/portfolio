# Roadmap: Jack Cutrara Portfolio

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7 (shipped 2026-03-31) | [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Editorial Redesign** — Phases 8-11 (shipped 2026-04-15) | [Archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 Polish** — Phases 12-16 (shipped 2026-04-27) | [Archive](milestones/v1.2-ROADMAP.md)
- ✅ **v1.3 Chat Visibility** — Phases 17-20 (shipped 2026-05-13) | [Archive](milestones/v1.3-ROADMAP.md)
- ✅ **v1.4 Professional Experience** — Phases 21-25 (shipped 2026-07-14) | [Archive](milestones/v1.4-ROADMAP.md)

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

<details>
<summary>✅ v1.4 Professional Experience (Phases 21-25) — SHIPPED 2026-07-14</summary>

- [x] Phase 21: Experience Content Pipeline & Collection (4/4 plans) — completed 2026-07-09 — Typed `experience` collection fed from `Experience/*.md` via a sync script mirroring the projects pipeline
- [x] Phase 22: Experience Page & Holloway Case Study (5/5 plans) — completed 2026-07-09 — Dedicated Experience page + nav; Holloway scannable summary → full deep-dive; Balfour Beatty lightweight entry
- [x] Phase 23: Projects Reconciliation & Featured Tier (4/4 plans) — completed 2026-07-10 — Sync Multi-Chain EVM (#7); feature SeatWatch / Multi-Chain EVM / NFL Prediction; keep the rest accessible below
- [x] Phase 24: Positioning Shift & Home Teaser (4/4 plans) — completed 2026-07-14 — New-grad-with-production-experience framing across Core Value, About, education status, metadata; Home Holloway teaser
- [x] Phase 25: Chat Knowledge Refresh & Milestone Verification (5/5 plans) — completed 2026-07-14 — Regenerate `portfolio-context.json` with experience + project #7 (third-person voice split); hold D-26/D-15/astro-check/Lighthouse gates

</details>

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
| 24. Positioning Shift & Home Teaser | v1.4 | 4/4 | Complete    | 2026-07-14 |
| 25. Chat Knowledge Refresh & Milestone Verification | v1.4 | 5/5 | Complete    | 2026-07-14 |
