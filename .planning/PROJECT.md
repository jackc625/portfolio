# Jack Cutrara — Portfolio Website

## What This Is

A polished multi-page personal portfolio website for Jack Cutrara built with Astro 6, Tailwind CSS v4, and Geist typography. The site showcases projects, technical ability, and professional polish — functioning as a living complement to his resume that positions him as a serious, capable junior software engineer worth interviewing. Live at jackcutrara.com.

## Core Value

Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing — the site must make him more credible than a resume alone.

## Current State

**Shipped:** v1.1 Editorial Redesign (2026-04-15)
**Live at:** jackcutrara.com (Cloudflare Pages)
**Tech stack:** Astro 6 + Tailwind CSS v4 + TypeScript + MDX + Cloudflare Workers (SSR) + Geist/Geist Mono typography
**Source LOC:** ~3,859 (src/ — astro, ts, css, mdx)
**Repo:** github.com/jackc625/portfolio (public)
**Lighthouse:** Performance 100 / Accessibility 95 / Best Practices 100 / SEO 100
**Design contract:** `design-system/MASTER.md` — locked editorial system, 6-hex palette, Geist/Geist Mono, restrained motion

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

(Requirements for v1.2 will be defined in REQUIREMENTS.md once roadmap is built.)

## Current Milestone: v1.2 Polish

**Goal:** Raise the bar on what already shipped — tasteful motion, real content everywhere, smarter chat, zero tech debt, measurable recruiter engagement.

**Target features:**

- Tasteful motion layer — page enter/transitions, scroll-reveal on sections, primitive microinteractions (WorkRow, chat bubble, MobileMenu, StatusDot). No signature hero moment; homepage hero stays as-is.
- Full content pass — replace 4 placeholder project MDX files with real case studies, audit About page narrative, verify homepage/resume copy is current, update `Projects/` folder docs as source-of-truth for project MDX.
- Chat widget upgrade — fine-tune `portfolio-context.json`, tune system prompt / persona / response quality, research stronger knowledge approaches (RAG, embeddings DB, feeding project MDX directly) before choosing an implementation.
- Resolve all 7 non-blocking tech debt items from the v1.1 audit.
- Analytics instrumentation — Plausible or Umami to measure recruiter engagement on live site.

**Key context:** MASTER.md is no longer a word-for-word contract in v1.2 — the design is locked, so motion layers on top intentionally without changing the editorial system. Content pass and chat knowledge work are coupled (chat gets better once real project content exists).

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

v1.1 Editorial Redesign shipped 2026-04-15. 4 phases (8-11), 27 plans, 63 tasks, ~150 commits over 9 days (2026-04-07 → 2026-04-15). Source LOC climbed from ~2,875 to ~3,859 across src/ after primitive library build-out. All 25 v1.1 requirements satisfied per milestone audit. Design contract locked at `design-system/MASTER.md`.

v1.0 MVP shipped 2026-03-31 with 6 phases, 27 plans, 43 tasks. Added Phase 7 (chatbot) 2026-04-04.

Known issues carried into v1.2:
- 4 of 6 project MDX files still have placeholder content — highest-priority content work
- 7 non-blocking tech debt items documented in `milestones/v1.1-MILESTONE-AUDIT.md` (lightning-css warnings, MobileMenu focus-trap middle-element edge case, OG URL builder latent bug, `--ink-faint` 2.5:1 contrast on decorative metadata, live vs replayed chat copy button inconsistency)

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
| Locked editorial design system (v1.1) | Restraint over motion — MASTER.md as single source of truth | ✓ Good — Lighthouse 100/95/100/100, distinctive visual identity |
| Flat hex tokens replacing OKLCH (v1.1) | Simpler mental model, single light theme eliminates theme machinery | ✓ Good — dead theme code removed, smaller surface area |
| localStorage chat persistence replacing transition:persist (v1.1) | ClientRouter removed with view transitions; localStorage survives the navigation model | ✓ Good — 50-msg cap + 24h TTL preserves UX without DOM persistence |
| MobileMenu container query (v1.1) | `@container (max-width: 380px)` on header-inner is the true signal, not viewport width | ✓ Good — hamburger appears when nav actually wraps, not at arbitrary breakpoint |

## Constraints

- **Design process**: All visual/UI/UX decisions routed through frontend-design skill — no ad-hoc design choices
- **Tech stack**: Astro 6 + Tailwind CSS v4 (GSAP removed in v1.1 — restrained motion)
- **Design system**: `design-system/MASTER.md` is the locked contract for v1.1+ — all visual work references it; six-hex palette; Geist + Geist Mono only
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
*Last updated: 2026-04-15 — milestone v1.2 Polish initialized. Next: define REQUIREMENTS.md and ROADMAP.md.*
