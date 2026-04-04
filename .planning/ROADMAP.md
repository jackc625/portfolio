# Roadmap: Jack Cutrara Portfolio

## Milestones

- **v1.0 MVP** — Phases 1-6 (shipped 2026-03-31) | [Archive](milestones/v1.0-ROADMAP.md)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-6) — SHIPPED 2026-03-31</summary>

- [x] Phase 1: Foundation & Design System (5/5 plans) — Astro 6 + Tailwind v4 + design tokens + content schemas
- [x] Phase 2: Site Shell & Navigation (3/3 plans) — Layouts, nav, mobile menu, footer, SEO meta
- [x] Phase 3: Core Pages (6/6 plans) — Visual rebuild with canvas hero, cloning shiyunlu.com design language
- [x] Phase 4: Project System & Case Studies (4/4 plans) — Card grid, case study template, 2 full case studies
- [x] Phase 5: Dark Mode, Animations & Polish (6/6 plans) — Theme system, GSAP animations, transitions, JSON-LD
- [x] Phase 6: Performance Audit & Deployment (3/3 plans) — Lighthouse 90+, Cloudflare Pages production deploy

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Design System | v1.0 | 5/5 | Complete | 2026-03-22 |
| 2. Site Shell & Navigation | v1.0 | 3/3 | Complete | 2026-03-23 |
| 3. Core Pages | v1.0 | 6/6 | Complete | 2026-03-25 |
| 4. Project System & Case Studies | v1.0 | 4/4 | Complete | 2026-03-27 |
| 5. Dark Mode, Animations & Polish | v1.0 | 6/6 | Complete | 2026-03-31 |
| 6. Performance Audit & Deployment | v1.0 | 3/3 | Complete | 2026-03-31 |

### Phase 7: chatbot feature

**Goal:** Add an AI-powered chatbot widget that answers questions about Jack's background, projects, and experience using Claude Haiku, with streaming responses, full accessibility, and defense-in-depth security.
**Requirements**: D-01 through D-38 (from 07-CONTEXT.md)
**Depends on:** Phase 6
**Plans:** 5 plans

Plans:
- [ ] 07-01-PLAN.md — Infrastructure: hybrid SSR, Cloudflare adapter, dependencies, test scaffold
- [ ] 07-02-PLAN.md — Backend: streaming API endpoint, system prompt, portfolio context, validation
- [ ] 07-03-PLAN.md — Frontend: chat widget markup, client-side controller, markdown rendering, animations
- [ ] 07-04-PLAN.md — Integration: BaseLayout wiring, focus trap, keyboard accessibility, analytics
- [ ] 07-05-PLAN.md — Checkpoint: human verification of complete chatbot feature
