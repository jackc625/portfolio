# Roadmap: Jack Cutrara Portfolio

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7 (shipped 2026-03-31) | [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Editorial Redesign** — Phases 8-11 (shipped 2026-04-15) | [Archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 Polish** — Phases 12-16 (shipped 2026-04-27) | [Archive](milestones/v1.2-ROADMAP.md)

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
