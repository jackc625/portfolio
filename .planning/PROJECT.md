# Jack Cutrara — Portfolio Website

## What This Is

A polished multi-page personal portfolio website for Jack Cutrara built with Astro 6, Tailwind CSS v4, and Geist typography. The site showcases projects, technical ability, and professional polish — functioning as a living complement to his resume that positions him as a serious, capable junior software engineer worth interviewing. Live at jackcutrara.com.

## Core Value

Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing — the site must make him more credible than a resume alone.

## Current State

**Shipped:** v1.1 Editorial Redesign (2026-04-13)
**Live at:** jackcutrara.com (Cloudflare Pages)
**Tech stack:** Astro 6 + Tailwind CSS v4 + TypeScript + MDX + Cloudflare Workers (SSR) + Geist/Geist Mono typography
**Source LOC:** ~2,875 (Astro, TS, CSS, MDX) + chatbot feature
**Repo:** github.com/jackc625/portfolio (public)

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
- ✓ Structured case study pages — v1.0 (2 fully written)
- ✓ Dual reading modes (recruiter scan + engineer deep dive) — v1.0
- ✓ Dark/light theme with persistent toggle — v1.0 (removed in v1.1)
- ✓ GSAP scroll animations and page transitions — v1.0 (removed in v1.1)
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

- ✓ Editorial design system with locked MASTER.md contract -- v1.1
- ✓ Geist + Geist Mono typography via Astro 6 Fonts API -- v1.1
- ✓ Warm off-white #FAFAF7 + signal red #E63946 hex palette -- v1.1
- ✓ Single light theme (dark mode removed) -- v1.1
- ✓ Numbered editorial work list replacing card grid -- v1.1
- ✓ Restrained motion (GSAP/scroll animations removed) -- v1.1
- ✓ Chat widget restyled to editorial chrome -- v1.1
- ✓ Lighthouse 90+ maintained after redesign -- v1.1
- ✓ WCAG AA contrast verified -- v1.1
- ✓ Full keyboard accessibility with visible focus rings -- v1.1

### Active

See REQUIREMENTS.md for milestone v1.1 requirements (Editorial Redesign).

## Current Milestone: v1.1 Editorial Redesign

**Goal:** Replace the v1.0 shiyunlu-clone visual system with a locked editorial design system (Geist + Geist Mono, warm off-white + signal red, restrained motion) across every page, while preserving all functional capabilities (chat widget, content collections, deployment, performance, a11y).

**Target features:**
- New design system: Geist + Geist Mono typography, warm off-white #FAFAF7 base + signal red #E63946 accent, single light theme (dark mode killed)
- Editorial homepage with display hero, mono metadata block, "available for work" status, numbered work list
- Editorial about page (intro line + 3 paragraphs, no skill icons)
- Editorial projects index and case study layout using real project content
- Minimal contact section with résumé PDF download (resume page removed — PDF is single source of truth)
- Chat widget restyle (all functionality preserved, visuals integrated)
- Polish sweep: a11y, Lighthouse 90+ retained, responsive QA

**Key context:**
- Visual direction is locked via mockup.html (repo root) and design-system/MASTER.md (to be written as first artifact)
- Phase numbering continues: v1.1 starts at Phase 8 (v1.0 ended at Phase 7 — chatbot)
- Many v1.0 design requirements will be invalidated by this milestone (canvas hero, dark/light theme, GSAP scroll animations, project card grid, resume page) and moved to Out of Scope with reason "replaced by editorial redesign v1.1"

### Validated in Phase 10

- ✓ Editorial homepage with display hero, numbered work list, about preview, contact section — Phase 10 (HOME-01..04)
- ✓ Editorial about page (intro + 3 paragraphs, no icons) — Phase 10 (ABOUT-01..02)
- ✓ Projects index with numbered work list + editorial case study detail pages — Phase 10 (WORK-01..03)
- ✓ Minimal contact section with résumé PDF download, X dropped (no account exists) — Phase 10 (CONTACT-01..02)
- ✓ Chat widget restyled to editorial system (flat-rectangle chrome, mono labels) — Phase 10 (CHAT-02)
- ✓ Chat persistence restored via localStorage (50-msg cap, 24h TTL) — Phase 10 (CHAT-01)

### Validated in Phase 7

- ✓ AI chatbot widget with streaming responses — Phase 7 (Claude Haiku via SSE)
- ✓ Chat persistence across page navigation — Phase 7 (transition:persist → Phase 10 localStorage)
- ✓ Full keyboard accessibility and focus trapping — Phase 7
- ✓ Defense-in-depth security (CORS whitelist, rate limiting, input validation, prompt injection resistance) — Phase 7
- ✓ Mobile full-screen chat overlay — Phase 7
- ✓ Markdown rendering with XSS sanitization — Phase 7 (marked + DOMPurify)

### Out of Scope

- Blog / writing section — not needed unless Jack commits to regular writing
- Testimonials — no content source yet
- CMS — static content is sufficient for a personal portfolio
- Contact form — direct links (email, LinkedIn) are more professional for this audience
- 3D/Three.js hero — bloats bundle, kills mobile performance
- Skills progress bars — meaningless self-assessment, looks amateurish
- GitHub contribution graph — inconsistent graphs raise questions
- Real-time chat — chatbot covers interactive Q&A; full real-time chat unnecessary
- Background audio — universally disliked, accessibility violation
- Custom loading screens — fast static site doesn't need them

## Context

Shipped v1.0 MVP with 2,875 LOC across Astro, TypeScript, CSS, and MDX. 6 phases executed over 10 days (2026-03-22 to 2026-03-31), 195 commits, 27 plans. Design language cloned from shiyunlu.com with generative canvas hero, OKLCH color tokens, and Inter/IBM Plex Mono typography. All 45 requirements satisfied per milestone audit. 6 tech debt items remain (all non-critical).

Phase 7 (2026-04-04): Added AI chatbot feature — Claude Haiku-powered chat widget with streaming SSE responses, markdown rendering, full accessibility, defense-in-depth security, and mobile support. Site now uses hybrid SSR via Cloudflare Workers adapter for the chat API endpoint.

Known issues:
- `CaseStudySection.astro` is dead code (safe to delete)
- 4 of 6 project MDX files have placeholder content
- `ArticleImage.astro` wiring is dormant (no MDX uses embedded images yet)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro 6 + Tailwind v4 + TypeScript | Modern + best performance, research-driven | ✓ Good — zero-JS pages, fast builds |
| Cloudflare Pages deployment | Unlimited bandwidth, fastest edge, Astro-owned | ✓ Good — live at jackcutrara.com |
| GSAP for animations (not CSS-only) | ScrollTrigger + SplitText provide premium feel | ✓ Good — dynamic import keeps bundle lean |
| Clone shiyunlu.com design language | Need specific reference to avoid generic AI designs | ✓ Good — distinctive visual identity |
| Canvas hero with simplex noise | Unique first impression, differentiator | ✓ Good — responsive particles, theme-aware |
| Dark-first OKLCH token system | Modern color space, theme-switchable via CSS vars | ✓ Good — both themes pass WCAG AA |
| Content collections + MDX | Type-safe project content with component support | ✓ Good — placeholder-friendly workflow |
| Hybrid project layout | Featured cards + editorial list serves both audiences | ✓ Good — scan-friendly and deep-dive ready |
| Theme transitions via .theme-transitioning class | Prevents layout thrash on initial load | ✓ Good — no flash of wrong theme |
| Dynamic import() for GSAP | Code-splitting without manual chunk config | ✓ Good — Lighthouse 90+ Performance |

## Constraints

- **Design process**: All visual/UI/UX decisions routed through frontend-design skill — no ad-hoc design choices
- **Tech stack**: Astro 6 + Tailwind CSS v4 + GSAP (locked for v1)
- **Content**: 4 of 6 project MDX files still have placeholder content — fill before active job applications
- **Audience**: Must serve both 30-second recruiter scans and 10-minute engineer deep dives

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
*Last updated: 2026-04-13 — Phase 10 (Page Port) complete. All 5 pages rewritten to editorial compositions over Phase 9 primitives. Chat widget restyled to flat-rectangle chrome with localStorage persistence restored. 13/13 requirements delivered (HOME-01..04, ABOUT-01..02, WORK-01..03, CONTACT-01..02, CHAT-01..02). Phase 11 (Polish) unblocked.*
