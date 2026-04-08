# Roadmap: Jack Cutrara Portfolio

## Milestones

- **v1.0 MVP** — Phases 1-6 (shipped 2026-03-31) | [Archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Editorial Redesign** — Phases 8-11 (started 2026-04-07)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-6) — SHIPPED 2026-03-31</summary>

- [x] Phase 1: Foundation & Design System (5/5 plans) — Astro 6 + Tailwind v4 + design tokens + content schemas
- [x] Phase 2: Site Shell & Navigation (3/3 plans) — Layouts, nav, mobile menu, footer, SEO meta
- [x] Phase 3: Core Pages (6/6 plans) — Visual rebuild with canvas hero, cloning shiyunlu.com design language
- [x] Phase 4: Project System & Case Studies (4/4 plans) — Card grid, case study template, 2 full case studies
- [x] Phase 5: Dark Mode, Animations & Polish (6/6 plans) — Theme system, GSAP animations, transitions, JSON-LD
- [x] Phase 6: Performance Audit & Deployment (3/3 plans) — Lighthouse 90+, Cloudflare Pages production deploy
- [x] Phase 7: Chatbot Feature (5/5 plans) — Claude Haiku chat widget with SSE streaming, focus trap, defense-in-depth security

</details>

### v1.1 Editorial Redesign

- [x] **Phase 8: Foundation** — Write design-system/MASTER.md, replace tokens with hex palette, wire Geist fonts via Astro Fonts API, kill dark mode + theme toggle + GSAP/scroll animations, delete dead components and /resume page (completed 2026-04-08)
- [ ] **Phase 9: Primitives** — Build new component library (Header, Footer, Container, SectionHeader, WorkRow, MetaLabel, StatusDot) that the page port phase consumes
- [ ] **Phase 10: Page Port** — Port all pages to the new editorial system in order: homepage, about, contact, projects index, project detail, then ChatWidget restyle
- [ ] **Phase 11: Polish** — A11y/perf/responsive sweep, real content pass, validate Lighthouse 90+, delete mockup.html, sign-off

## Phase Details

### Phase 8: Foundation
**Goal**: The design system is captured as a written contract and the codebase is stripped of every v1.0 visual assumption that contradicts it — leaving an empty shell ready for new components.
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05, CONTACT-03
**Success Criteria** (what must be TRUE):
  1. `design-system/MASTER.md` exists and documents tokens, typography, layout, components, motion, accent usage, and anti-patterns — written as task 1 before any code changes
  2. The hex token palette (`#FAFAF7`, `#0A0A0A`, `#52525B`, `#A1A1AA`, `#E4E4E7`, `#E63946`) is the only color source in the codebase — no oklch tokens, no theme variables, no dark mode classes remain
  3. Geist and Geist Mono are loaded via Astro 6 Fonts API (self-hosted) and applied as the default sans/mono families — Inter and IBM Plex Mono references removed
  4. Dark mode is dead: `ThemeToggle.astro` deleted, `BaseLayout.astro` stripped of theme transition logic and FOUC scripts, `prefers-color-scheme` handling removed, no theme persistence in localStorage
  5. Motion is dead: `CanvasHero.astro` deleted, GSAP imports removed from all pages, scroll-trigger animations gone, view transitions removed — only functional hover/focus color transitions remain
  6. Dead components removed: `CTAButton.astro`, `FeaturedProjectItem.astro`, `ProjectCard.astro`, `SkillGroup.astro`, `CanvasHero.astro`, `ResumeEntry.astro`, `CaseStudySection.astro`, `ThemeToggle.astro`
  7. `/resume` route returns 404 — `src/pages/resume.astro` deleted from the project
  8. `npm run build` succeeds and the chat widget (Phase 7) still functions when the dev server is started — Phase 7 functionality is the regression gate for this phase
**Plans**: 8 plans
- [x] 08-01-PLAN.md — Author design-system/MASTER.md as the locked design contract (DSGN-05)
- [x] 08-02-PLAN.md — Swap foundation: hex tokens + Tailwind @theme bridge + Geist fonts (DSGN-01, DSGN-02)
- [x] 08-03-PLAN.md — Demolish dark mode, GSAP, ClientRouter, motion machinery; add MobileMenu fallback (DSGN-03, DSGN-04)
- [x] 08-04-PLAN.md — Delete 8 dead components; strip ThemeToggle + /resume from Header + MobileMenu nav (DSGN-04)
- [x] 08-05-PLAN.md — Refactor chat widget to new tokens; audit portfolio-context.json for v1.0 design refs (DSGN-02, DSGN-04)
- [x] 08-06-PLAN.md — Replace 5 pages with stubs; rename Tailwind tokens in 5 surviving components (DSGN-02)
- [x] 08-07-PLAN.md — Delete /resume route and rename public/resume.pdf → jack-cutrara-resume.pdf (CONTACT-03)
- [x] 08-08-PLAN.md — Run automated gate (build + lint + check + test) and manual chat smoke test (all REQs)
**UI hint**: yes

### Phase 9: Primitives
**Goal**: The new editorial component library exists in `src/components/` and matches the mockup.html visual contract, ready to be composed into pages.
**Depends on**: Phase 8
**Requirements**: (none — sequencing phase that enables Phase 10)
**Success Criteria** (what must be TRUE):
  1. Rebuilt `Header.astro` renders sticky 72px-tall header with `JACK CUTRARA` mono wordmark and three-link nav (works / about / contact), with active-link state styled via accent-red underline as in mockup.html
  2. Rebuilt `Footer.astro` renders 64px-tall footer with copyright on the left and `BUILT WITH ASTRO · TAILWIND · GEIST` mono caption on the right
  3. New primitive components exist and render correctly in isolation: `Container.astro` (max-width 1200px with responsive padding), `SectionHeader.astro` (mono `§ NN — TITLE` label with optional count), `WorkRow.astro` (numbered row with title, mono stack, year, hover arrow), `MetaLabel.astro` (uppercase mono caption), `StatusDot.astro` (accent dot with mono label)
  4. The mobile navigation question is resolved: either `MobileMenu.astro` is rebuilt to match the editorial system, or it is deleted in favor of always-visible nav links — decision recorded in `design-system/MASTER.md`
  5. Every primitive uses only the Phase 8 hex tokens, Geist/Geist Mono, and the rule weights from mockup.html — no inline colors, no leftover oklch references, no GSAP imports
  6. Kept components (`JsonLd.astro`, `SkipToContent.astro`, `ArticleImage.astro`, `NextProject.astro`) are audited and updated to use the new tokens where applicable, but their public APIs remain stable
  7. `npm run build` succeeds and the chat widget still functions
**Plans**: 8 plans
- [x] 09-01-master-amendment-PLAN.md — Amend MASTER.md §5.2 (mobile footer stack) and §5.8 (MobileMenu rebuild decision) as a docs-only commit
- [x] 09-02-global-css-foundations-PLAN.md — Land editorial typography role classes + .container/.section/.section-rule structural helpers in src/styles/global.css
- [x] 09-03-stateless-primitives-PLAN.md — Create Container, MetaLabel, StatusDot, SectionHeader primitives under src/components/primitives/
- [x] 09-04-composite-primitives-PLAN.md — Create Header (container-query hamburger), Footer (mobile 3-row stack), WorkRow, MobileMenu (focus-trap dialog) primitives
- [x] 09-05-baselayout-swap-PLAN.md — Swap BaseLayout.astro to import new primitives and delete old v1.0 Header/Footer/MobileMenu files
- [x] 09-06-kept-components-audit-PLAN.md — Restyle NextProject.astro to editorial row; verify-only audit of JsonLd, SkipToContent, ArticleImage
- [x] 09-07-dev-primitives-preview-PLAN.md — Create /dev/primitives preview route + sitemap/robots.txt exclusion for /dev/*
- [ ] 09-08-verification-gate-PLAN.md — Run 5-point verification gate (build/lint/check/test + manual chat smoke + /dev/primitives visual check)
**UI hint**: yes

### Phase 10: Page Port
**Goal**: Every visible page is rewritten to compose the Phase 9 primitives into the editorial layout, real project content from the content collection renders in the new templates, and the chat widget visuals match the new system without losing any Phase 7 functionality.
**Depends on**: Phase 9
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, ABOUT-01, ABOUT-02, WORK-01, WORK-02, WORK-03, CONTACT-01, CONTACT-02, CHAT-01, CHAT-02
**Success Criteria** (what must be TRUE):
  1. Homepage (`/`) renders the display hero with `JACK CUTRARA·` wordmark, mono metadata block (`AVAILABLE FOR WORK` status dot + `EST. 2024 · OAKLAND, CA` line), lead role statement, `§ 01 — WORK` numbered list, `§ 02 — ABOUT` preview, and `§ 03 — CONTACT` section — and visually matches mockup.html when viewed at desktop, tablet, and mobile widths
  2. About page (`/about`) renders the editorial structure: intro line in larger weight, three short paragraphs (≤80 words each) covering "what I build / how I think / where I'm headed", no skill icons, no progress bars, no narrative graphics
  3. Projects index (`/projects`) renders the same numbered work list pattern as the homepage section — every project from the content collection appears as a row, no card grid remains
  4. Project detail pages (`/projects/[id]`) render the editorial case study layout: mono metadata header, large sans title, long-form column body, optional inline images, and a rebuilt "next project" link at the foot — all six projects from the existing collection render without errors
  5. Contact section renders minimal layout: `GET IN TOUCH` mono label + email + inline `GITHUB · LINKEDIN · X · RÉSUMÉ` mono links, no icons, no contact form, no CTA buttons, and the résumé link uses `<a download>` pointing to `/jack-cutrara-resume.pdf` (placeholder PDF shipped in `public/`)
  6. Chat widget (Phase 7) is visually restyled to the new system — no cards, no shadows, no gradients, monochrome surfaces with accent for active state and links only — and every Phase 7 capability still works: SSE streaming, focus trap, rate limiting, conversation persistence across page navigation, mobile full-screen overlay, markdown rendering with XSS sanitization
  7. Real project titles, stacks, and years from the existing content collection render in both the homepage list and the projects index — no placeholder titles like "Project One" appear in the shipped HTML
  8. Header active-link state correctly highlights the current page on every route, and `npm run build` succeeds
**Plans**: TBD
**UI hint**: yes

### Phase 11: Polish
**Goal**: The redesigned site meets every quality bar from v1.0 — performance, accessibility, contrast, responsiveness — and the temporary mockup.html artifact is retired.
**Depends on**: Phase 10
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05, QUAL-06
**Success Criteria** (what must be TRUE):
  1. Lighthouse scores measured on the homepage and a project detail page are ≥90 across Performance, Accessibility, Best Practices, and SEO — captured as a checked-in audit artifact
  2. Homepage and project detail page measure LCP < 2s and CLS < 0.1 in the Lighthouse run
  3. Every interactive element (nav links, work rows, contact links, chat widget controls, résumé download) has a visible focus ring and is reachable by keyboard, verified via tab-through of every page
  4. Site is verified at 375px, 768px, 1024px, and 1440px viewport widths with no horizontal scroll, readable type at every width, and no broken layouts
  5. WCAG AA color contrast verified on every text/background combination — body text on `#FAFAF7`, muted text on `#FAFAF7`, accent links, status labels — using a contrast checker, results documented
  6. `prefers-reduced-motion` is verified to either have no effect (because there is no motion) or to disable any incidental transitions, with a brief verification note
  7. `mockup.html` is deleted from the repo root after homepage parity is signed off
  8. Final build passes type-check and lint, chat widget functions in production build, and the milestone is ready for `/gsd:complete-milestone`
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Design System | v1.0 | 5/5 | Complete | 2026-03-22 |
| 2. Site Shell & Navigation | v1.0 | 3/3 | Complete | 2026-03-23 |
| 3. Core Pages | v1.0 | 6/6 | Complete | 2026-03-25 |
| 4. Project System & Case Studies | v1.0 | 4/4 | Complete | 2026-03-27 |
| 5. Dark Mode, Animations & Polish | v1.0 | 6/6 | Complete | 2026-03-31 |
| 6. Performance Audit & Deployment | v1.0 | 3/3 | Complete | 2026-03-31 |
| 7. Chatbot Feature | v1.0 | 5/5 | Complete | 2026-04-04 |
| 8. Foundation | v1.1 | 8/8 | Complete   | 2026-04-08 |
| 9. Primitives | v1.1 | 0/8 | Planned     | — |
| 10. Page Port | v1.1 | 0/? | Not started | — |
| 11. Polish | v1.1 | 0/? | Not started | — |
