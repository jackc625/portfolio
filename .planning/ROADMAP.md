# Roadmap: Jack Cutrara Portfolio

## Overview

This roadmap delivers a polished multi-page portfolio website that positions Jack Cutrara as a serious, capable junior software engineer worth interviewing. The journey moves from infrastructure (Astro 6 + Tailwind v4 foundation, design tokens) through the site shell and content pages, into the core differentiator (project case studies with dual reading modes), then adds visual polish (dark mode, animations), and closes with performance auditing and production deployment on Cloudflare Pages. Every phase delivers a coherent, verifiable capability that builds on the previous one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Design System** - Scaffold Astro 6 project with Tailwind v4, design tokens, content collection schemas, and deployment infrastructure
- [ ] **Phase 2: Site Shell & Navigation** - Build layouts, navigation, mobile menu, footer, and SEO meta infrastructure that wraps every page
- [ ] **Phase 3: Core Pages** - Full visual rebuild cloning shiyunlu.com's design language across all pages
- [ ] **Phase 4: Project System & Case Studies** - Build project card grid, case study template, placeholder content, and at least 2 fully written case studies
- [ ] **Phase 5: Dark Mode, Animations & Polish** - Add dark/light mode, scroll animations, page transitions, hover states, print styles, and structured data
- [ ] **Phase 6: Performance Audit & Deployment** - Optimize performance, audit accessibility, deploy to Cloudflare Pages with custom domain

## Phase Details

### Phase 1: Foundation & Design System
**Goal**: The project is scaffolded with all tooling configured, design tokens defined, and content schemas ready so that every subsequent phase builds on a solid, consistent foundation
**Depends on**: Nothing (first phase)
**Requirements**: DSGN-01, IDNV-04
**Success Criteria** (what must be TRUE):
  1. Running `dev` server renders a blank page with no errors, confirming Astro 6 + Tailwind v4 + TypeScript are correctly wired
  2. CSS custom properties for color tokens, typography scale, and spacing are defined and usable in any component
  3. A content collection schema for projects exists with Zod validation, and a sample MDX file passes schema validation at build time
  4. Site builds and can be previewed over HTTPS (local or staging) on the custom domain path
**Plans**: 5 plans

Plans:
- [x] 01-01-PLAN.md -- Scaffold Astro 6 project with all dependencies and build tooling
- [x] 01-02-PLAN.md -- Create design token system (colors, typography, spacing) and BaseLayout
- [x] 01-03-PLAN.md -- Create projects content collection schema and sample MDX
- [x] 01-04-PLAN.md -- Git init, deployment config, GitHub repo, and Cloudflare Pages setup
- [x] 01-05-PLAN.md -- Fix Font import path and add favicon link (UAT gap closure)
**UI hint**: yes

### Phase 2: Site Shell & Navigation
**Goal**: Every page on the site is wrapped in a consistent layout with working navigation, semantic HTML structure, and SEO meta tags so that visitors can move between pages and search engines can index them
**Depends on**: Phase 1
**Requirements**: IDNV-01, IDNV-02, IDNV-03, CNTC-02, SEOA-01, SEOA-02, SEOA-04, SEOA-05, SEOA-06, SEOA-07
**Success Criteria** (what must be TRUE):
  1. Visitor sees Jack's name, role, and value proposition above the fold within 3 seconds of any page loading
  2. Sticky navigation with labeled links (Home, About, Projects, Resume, Contact) is visible and functional on all pages at desktop and mobile sizes
  3. Mobile hamburger menu opens, closes, and navigates correctly across all breakpoints
  4. Every page has a unique title tag, meta description, and Open Graph tags visible in page source
  5. A keyboard-only user can navigate the entire site using Tab, Enter, and Escape, with visible focus indicators and a skip-to-content link
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md -- BaseLayout with SEO meta, Footer with contact links, SkipToContent, OG image, and 5 stub pages
- [x] 02-02-PLAN.md -- Header with scroll-reveal nav, desktop links, hamburger trigger, and full-screen mobile menu overlay
- [x] 02-03-PLAN.md -- Human verification of complete site shell at desktop and mobile
**UI hint**: yes

### Phase 3: Core Pages
**Goal**: Full visual rebuild cloning shiyunlu.com's design language — updated design tokens (colors, fonts, spacing), reworked site shell (header, footer, mobile menu), and rebuilt Home (with canvas hero), About, Resume, and Contact pages within the cloned design system
**Depends on**: Phase 2
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, ABUT-01, ABUT-02, ABUT-03, RESM-01, RESM-02, CNTC-01
**Success Criteria** (what must be TRUE):
  1. Home page displays a generative canvas hero with Jack's name, role, and brief intro overlaid; navigation provides discovery of all other pages
  2. About page presents Jack's background, education, path into engineering, and skills grouped by context (not progress bars) in first-person conversational tone
  3. Resume page renders viewable content on-page with a PDF download button visible above the fold
  4. Contact page displays direct email, LinkedIn, and GitHub links that open correctly, with availability indicator
  5. All pages visually match shiyunlu.com's design language (colors, fonts, spacing, grid, navigation) and are responsive across mobile, tablet, and desktop
**Plans**: 6 plans

Plans:
- [x] 03-01-PLAN.md -- Update design tokens (colors, typography, spacing) and font stack to match shiyunlu.com
- [x] 03-02-PLAN.md -- Rewrite site shell (Header, Footer, MobileMenu) to match shiyunlu.com navigation patterns
- [ ] 03-03-PLAN.md -- Home page with generative canvas hero (simplex-noise) and shiyunlu.com spatial structure
- [ ] 03-04-PLAN.md -- About page with narrative and skills in new design system
- [ ] 03-05-PLAN.md -- Resume and Contact pages rebuilt within new design system
- [ ] 03-06-PLAN.md -- Human visual verification of complete design overhaul
**UI hint**: yes

### Phase 4: Project System & Case Studies
**Goal**: Visitors can browse projects in a scan-friendly card grid and drill into structured case studies that demonstrate Jack's technical depth, problem-solving, and initiative
**Depends on**: Phase 3
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04, CASE-01, CASE-02, CASE-03, CASE-04, CASE-05
**Success Criteria** (what must be TRUE):
  1. Projects page displays 5-6 project cards in a clean grid, each showing title, one-line description, tech stack tags, and a thumbnail
  2. Clicking a project card navigates to an individual case study page with the structured template: Problem, Solution, Tech Stack, Challenges, Results, Lessons Learned
  3. Case study pages support embedded screenshots/media and include links to GitHub repo and/or live demo where available
  4. Case study pages use progressive disclosure: overview/summary visible first, technical depth revealed on scroll
  5. At least 2 case studies contain fully written, non-placeholder content ready for production
**Plans**: 4 plans

Plans:
- [ ] 04-01-PLAN.md -- Update content schema (optional thumbnail) and create 6 project MDX files with 2 full case studies
- [x] 04-02-PLAN.md -- Create ProjectCard, ArticleImage, CaseStudySection, and NextProject components
- [ ] 04-03-PLAN.md -- Rebuild projects page (hybrid layout) and create dynamic case study route
- [ ] 04-04-PLAN.md -- Human visual verification of complete project system
**UI hint**: yes

### Phase 5: Dark Mode, Animations & Polish
**Goal**: The site feels premium and polished with dark/light mode, subtle animations, smooth transitions, and structured data, elevating Jack's perceived professionalism
**Depends on**: Phase 4
**Requirements**: DSGN-02, DSGN-03, DSGN-04, ANIM-01, ANIM-02, ANIM-03, ANIM-04, RESM-03, SEOA-03
**Success Criteria** (what must be TRUE):
  1. Site detects OS color scheme preference and renders the correct theme on first load with no flash of wrong theme; manual toggle switches themes and persists the choice across sessions
  2. Both dark and light themes independently pass WCAG AA contrast ratios (4.5:1+) on all text
  3. Page sections animate in with subtle scroll-triggered reveals, and route changes use smooth page transitions
  4. Interactive elements (buttons, cards, links) have visible hover states and micro-interactions
  5. Resume page prints cleanly via browser print with a dedicated @media print stylesheet, and JSON-LD structured data (Person + CreativeWork schemas) is present in page source
**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md -- Theme system: light tokens, no-flash detection, ThemeToggle component, Header integration, canvas theme awareness
- [x] 05-02-PLAN.md -- GSAP scroll animations, page transitions, hover micro-interactions, canvas hero enhancements
- [x] 05-03-PLAN.md -- Resume print stylesheet and JSON-LD structured data (Person + CreativeWork)
- [x] 05-04-PLAN.md -- Human visual verification of complete Phase 5 implementation
- [ ] 05-05-PLAN.md -- UAT gap closure: theme persistence across navigation and canvas mouse influence fix
**UI hint**: yes

### Phase 6: Performance Audit & Deployment
**Goal**: The site is production-ready with verified performance, accessibility, and image optimization, deployed to Cloudflare Pages on Jack's custom domain
**Depends on**: Phase 5
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, PERF-05
**Success Criteria** (what must be TRUE):
  1. Lighthouse scores 90+ across Performance, Accessibility, Best Practices, and SEO on all pages
  2. Largest Contentful Paint (LCP) is under 2 seconds on all pages, and Cumulative Layout Shift (CLS) is under 0.1
  3. All images use optimized formats (WebP/AVIF), responsive srcset, lazy loading, and proper dimensions
  4. Site is live on Jack's custom domain over HTTPS with working CI/CD (git push triggers deploy)
  5. Mobile-first responsive design verified across mobile, tablet, and desktop breakpoints with no layout issues
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 > 2 > 3 > 4 > 5 > 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Design System | 5/5 | Complete | - |
| 2. Site Shell & Navigation | 3/3 | Complete | - |
| 3. Core Pages | 2/6 | In Progress|  |
| 4. Project System & Case Studies | 1/4 | In Progress|  |
| 5. Dark Mode, Animations & Polish | 4/5 | In Progress|  |
| 6. Performance Audit & Deployment | 0/? | Not started | - |
