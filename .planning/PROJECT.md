# Jack Cutrara — Portfolio Website

## What This Is

A polished multi-page personal portfolio website for Jack Cutrara built with Astro 6, Tailwind CSS v4, and GSAP. The site showcases projects, technical ability, and professional polish — functioning as a living complement to his resume that positions him as a serious, capable junior software engineer worth interviewing. Live at jackcutrara.com.

## Core Value

Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing — the site must make him more credible than a resume alone.

## Current State

**Shipped:** v1.0 MVP (2026-03-31)
**Live at:** jackcutrara.com (Cloudflare Pages)
**Tech stack:** Astro 6 + Tailwind CSS v4 + TypeScript + GSAP + MDX
**Source LOC:** ~2,875 (Astro, TS, CSS, MDX)
**Repo:** github.com/jackc625/portfolio (public)

## Requirements

### Validated

- ✓ Modern, high-performance tech stack — v1.0 (Astro 6 + Tailwind v4 + TypeScript strict)
- ✓ Custom domain with HTTPS — v1.0 (jackcutrara.com on Cloudflare Pages)
- ✓ Content collection system for projects — v1.0 (Zod schema + MDX)
- ✓ Multi-page site (Home, About, Projects, Resume, Contact) — v1.0
- ✓ Home page with generative canvas hero — v1.0
- ✓ About page with narrative and skills — v1.0
- ✓ Resume page with PDF download — v1.0
- ✓ Contact page with email/LinkedIn/GitHub — v1.0
- ✓ Responsive design across breakpoints — v1.0
- ✓ Project card grid with 6 projects — v1.0
- ✓ Structured case study pages — v1.0 (2 fully written)
- ✓ Dual reading modes (recruiter scan + engineer deep dive) — v1.0
- ✓ Dark/light theme with persistent toggle — v1.0
- ✓ GSAP scroll animations and page transitions — v1.0
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

### Active

(None — next milestone will define new requirements via `/gsd:new-milestone`)

### Out of Scope

- Blog / writing section — not needed unless Jack commits to regular writing
- Testimonials — no content source yet
- CMS — static content is sufficient for a personal portfolio
- Contact form — direct links (email, LinkedIn) are more professional for this audience
- 3D/Three.js hero — bloats bundle, kills mobile performance
- Skills progress bars — meaningless self-assessment, looks amateurish
- GitHub contribution graph — inconsistent graphs raise questions
- Real-time chat — unnecessary complexity
- Background audio — universally disliked, accessibility violation
- Custom loading screens — fast static site doesn't need them

## Context

Shipped v1.0 MVP with 2,875 LOC across Astro, TypeScript, CSS, and MDX. 6 phases executed over 10 days (2026-03-22 to 2026-03-31), 195 commits, 27 plans. Design language cloned from shiyunlu.com with generative canvas hero, OKLCH color tokens, and Inter/IBM Plex Mono typography. All 45 requirements satisfied per milestone audit. 6 tech debt items remain (all non-critical).

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
*Last updated: 2026-03-31 after v1.0 milestone*
