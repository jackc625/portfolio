# Jack Cutrara — Portfolio Website

## What This Is

A polished multi-page personal portfolio website for Jack Cutrara that helps him secure junior/entry-level software engineering interviews. The site showcases projects, technical ability, and professional polish in a way a static resume cannot — functioning as a living complement to his resume that positions him as a serious, capable candidate.

## Core Value

Recruiters and hiring managers who visit this site should immediately see Jack as someone worth interviewing — the site must make him more credible than a resume alone.

## Requirements

### Validated

- [x] Modern, high-performance tech stack (research-driven selection) — Validated in Phase 1: Astro 6 + Tailwind v4 + TypeScript strict
- [x] Custom domain support — Validated in Phase 1: Cloudflare Pages with jackcutrara.com configured
- [x] Placeholder content system for project details to be filled in later — Validated in Phase 1: Content collection schema with sample MDX
- [x] Multi-page site with Home, About, Projects, Resume, and Contact pages — Validated in Phase 3: All four core pages built
- [x] Home page that communicates who Jack is within seconds and drives exploration — Validated in Phase 3: Hero + featured projects + about teaser + quick links
- [x] About page with background, education, interests, and path into engineering — Validated in Phase 3: First-person narrative + 4-group skills grid
- [x] Resume page with viewable content and PDF download — Validated in Phase 3: Styled summary + PDF download CTA
- [x] Contact page with email, LinkedIn, GitHub links — Validated in Phase 3: Channel cards + availability badge
- [x] Responsive design across desktop and mobile — Validated in Phase 3: Human-verified at mobile/desktop widths
- [x] Projects page displaying 5-6 projects in scan-friendly format — Validated in Phase 4: Hybrid featured cards + editorial list layout
- [x] Project detail/case study pages with technical depth — Validated in Phase 4: Structured MDX case studies with Problem/Solution/Challenges/Results sections
- [x] Two reading modes: fast scan (recruiters) and deep review (engineers) — Validated in Phase 4: Card grid for scanning, case study pages for deep dives

### Active
- [ ] Professional, high-end visual design (all design decisions via frontend-design skill)
- [ ] SEO/meta structure for discoverability
- [ ] Accessibility best practices

### Out of Scope

- Blog / writing section — not needed for v1, deferred
- Testimonials — no content source for v1
- CMS — static content is sufficient for a personal portfolio
- Analytics dashboards — can add basic analytics post-launch
- Extra branding experiments — finalize branding through the site itself
- Real-time chat / interactive features — unnecessary complexity
- Contact form — direct links (email, LinkedIn) are more professional for this audience

## Context

- Jack is a junior/entry-level software engineer targeting SWE roles
- Target audience: recruiters (fast scan), hiring managers (medium depth), engineers (deep review)
- Site must position Jack as someone who builds real projects, has initiative, and is polished/employable
- Content for 5-6 projects will be added after site structure is built — use placeholder content initially
- Jack has a custom domain available
- Deployed on Cloudflare Pages with push-to-deploy CI/CD
- Tech stack should prioritize modern tooling and best performance — explicitly NOT optimized for code simplicity
- All UI/UX/visual/design decisions must be routed through the frontend-design skill

## Constraints

- **Design process**: All visual/UI/UX decisions routed through frontend-design skill — no ad-hoc design choices
- **Tech stack**: Must be modern with best-in-class performance — research will determine specific choices
- **Content**: Project details are placeholder for v1 — structure must support easy content replacement
- **Audience**: Must serve both 30-second recruiter scans and 10-minute engineer deep dives

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Research-driven tech stack | Jack wants modern + best performance, not simplicity-optimized | Astro 6 + Tailwind v4 + TypeScript (Phase 1) |
| 5-6 projects with placeholder content | Build structure first, fill details later | Content collection schema + sample MDX (Phase 1) |
| All design via frontend-design skill | Ensures consistent, high-quality visual decisions | UI-SPEC produced, design tokens implemented (Phase 1) |
| Custom domain (available) | Professional presence | jackcutrara.com on Cloudflare Pages (Phase 1) |
| Deployment platform: Cloudflare Pages | Unlimited bandwidth, fastest edge, Astro-owned | Live at portfolio-5wl.pages.dev (Phase 1) |
| Hybrid project layout | Serve both fast-scan recruiters and deep-dive engineers | Featured card grid + editorial list (Phase 4) |
| Optional thumbnail with solid-color fallback | Avoid fake images, keep builds fast | thumbnail: image().optional() in schema (Phase 4) |
| 2 complete case studies for v1 | Demonstrate writing quality before production deploy | Portfolio Website + TaskFlow API fully written (Phase 4) |

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
*Last updated: 2026-03-30 after Phase 4 completion*
