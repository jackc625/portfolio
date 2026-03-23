# Project Research Summary

**Project:** Jack Cutrara Portfolio Website
**Domain:** Personal portfolio website for junior SWE candidate (static, content-driven, multi-page)
**Researched:** 2026-03-22
**Confidence:** HIGH

## Executive Summary

This is a static, content-driven personal portfolio whose primary job is to get Jack Cutrara software engineering interviews. The research is unambiguous about approach: Astro 6 with zero-JS-by-default Islands Architecture, Tailwind CSS v4, and deployment on Cloudflare Pages. This stack delivers the performance scores that both signal engineering competence and satisfy recruiter expectations. The framework choice is not experimental — Astro is the #1 satisfaction/interest framework for content sites in State of JS 2025 and is now Cloudflare-owned, providing long-term backing. Every other plausible alternative (Next.js, Gatsby, SPA frameworks) ships unnecessary JavaScript for a primarily static content site, degrading the very metric — Core Web Vitals — that this portfolio should be showcasing.

The feature research draws a sharp line between what gets Jack hired and what wastes build time. The core product is the project case study system: a dual-mode design that serves recruiter 30-second scans (project cards with title, one-liner, tech tags) and engineer 10-minute deep dives (structured case studies with Problem > Approach > Tech > Challenges > Results). Nearly every other feature is either table-stakes infrastructure (nav, responsive design, SEO, resume page) or a v2 deferral. The biggest time traps — Three.js heroes, skill percentage bars, contact forms, embedded analytics — are explicitly anti-features that hurt the portfolio's effectiveness. Dark mode and subtle animations are legitimate v1.x additions, but only after the content foundation is solid.

The critical risk is not technical. It is that the site ships with beautiful infrastructure and empty case studies. Research identifies this as the most common junior portfolio failure mode: developers spend time on animations while project pages have two sentences each. The mitigation strategy is structural — treat content writing as a separate milestone with a hard deployment gate, not something to fill in "later." The architecture (Astro Content Collections with MDX files and Zod schemas) directly supports this by making content-first development natural: placeholder MDX files can be swapped for real content without touching a single component.

## Key Findings

### Recommended Stack

Astro 6 (released March 10, 2026) is the clear choice for a portfolio. Its zero-JS-by-default Islands Architecture produces the best Core Web Vitals scores of any JS meta-framework and requires near-zero JavaScript for a static content site. The Cloudflare acquisition (January 2026) provides long-term backing. Tailwind CSS v4 (Oxide engine, 5-100x faster builds, CSS-first configuration) pairs cleanly via the `@tailwindcss/vite` plugin. GSAP is the animation standard — now fully free after the Webflow acquisition — and ScrollTrigger is unmatched for scroll-driven portfolio animations. Cloudflare Pages is the natural deployment choice: unlimited bandwidth on the free tier, 300+ edge locations, and Astro as the parent company.

**Core technologies:**
- Astro 6.0.x: Framework / SSG — zero-JS default, best-in-class portfolio performance, built-in Content Collections, Fonts API, View Transitions, image optimization
- Tailwind CSS 4.2.x: Styling — Oxide engine (5-100x faster), CSS-first config via `@theme`, integrate via `@tailwindcss/vite` (NOT deprecated `@astrojs/tailwind`)
- GSAP 3.x: Scroll animations — now free, ScrollTrigger unmatched for scroll-driven effects; reinitialize on `astro:page-load`, kill on `astro:before-preparation`
- Astro View Transitions: Page transitions — built-in, browser-native, zero additional JS
- Astro Content Collections + MDX: Content management — Zod-validated frontmatter schemas, type-safe project data, build-time error catching
- TypeScript 5.9.x: Type safety — strict mode, first-class Astro support
- Node.js 22.x LTS: Runtime — required by Astro 6 (dropped Node 18/20)
- Cloudflare Pages: Hosting — unlimited bandwidth free tier, fastest edge network, Astro-owned

**Critical version note:** Astro 6 requires Node 22+. Tailwind v4 requires `@tailwindcss/vite`, not `@astrojs/tailwind`. These are breaking changes from prior setups.

### Expected Features

**Must have (table stakes — v1 launch blockers):**
- Hero/identity section with name, role, one-liner, and CTA above the fold
- Sticky navigation with Home, About, Projects, Resume, Contact
- Projects card grid with title, one-line description, tech stack tags, thumbnail
- Project detail/case study pages (at minimum 2 fully written at launch)
- About page (background, education, path into engineering)
- Resume page with viewable content and PDF download above the fold
- Contact links (email, LinkedIn, GitHub) in header and footer
- Responsive/mobile-first design (60%+ of portfolio views are mobile)
- Sub-2-second LCP and Lighthouse 90+ across all categories
- Per-page SEO meta tags, Open Graph tags, sitemap, robots.txt
- HTTPS with custom domain
- Accessibility baseline: semantic HTML, keyboard navigation, color contrast 4.5:1+, alt text
- Design system with CSS custom properties for colors, typography, spacing (prerequisite for dark mode)

**Should have (v1.x — add after launch, before job applications intensify):**
- Dark/light mode with OS preference detection and localStorage persistence
- Scroll-triggered entrance animations (GSAP ScrollTrigger)
- Real project screenshots and GIFs of interactive features
- Structured data / JSON-LD (Person schema, CreativeWork schema)
- Print-friendly resume (`@media print` stylesheet)
- Remaining case studies fully written (all 5-6 projects)
- Live demo links for select projects

**Defer (v2+):**
- Blog section — only if Jack commits to writing regularly; empty blogs hurt more than help
- Analytics integration — Plausible or Umami post-launch
- Testimonials — only when real, credible ones exist
- Embedded interactive project demos

**Explicit anti-features (do not build):**
- Three.js / WebGL hero (kills mobile performance, alienates non-technical recruiters)
- Skill percentage bars (meaningless, universally mocked by engineers)
- Contact form (adds backend complexity; direct links are more professional for this audience)
- GitHub contribution graph embed (inconsistent graphs raise questions)
- Custom loading screens (masks slow performance; a fast site needs no loading screen)

### Architecture Approach

The architecture is Islands Architecture via Astro — the entire site generates as static HTML at build time, with JavaScript hydrated only for explicitly interactive elements. For this portfolio, that means approximately three islands: mobile menu toggle (`client:media`), theme toggle (`client:load`), and optionally a project filter (`client:visible`). Everything else — hero, project cards, case study pages, about page, resume — is pure static HTML. Pages are composed from section components (Hero, ProjectGrid, Timeline, etc.) that receive data as props. Project content lives in Astro Content Collections as MDX files with Zod-validated frontmatter, making the entire content layer type-safe and swappable without touching components.

**Major components:**
1. Layouts (BaseLayout, ProjectLayout) — page shells providing HTML structure, meta tags, header/footer, View Transitions
2. Pages (src/pages/*.astro) — route definitions, build-time data fetching, section composition
3. Sections (Hero, ProjectGrid, SkillsList, Timeline, ContactLinks) — full-width, self-contained page blocks receiving data as props
4. UI Components (Button, Card, Tag, Badge, SectionHeading) — atomic design-system building blocks
5. Content Collections (src/content/projects/*.mdx) — Zod-validated project data with frontmatter schema
6. Data files (src/data/site.ts, resume.ts, skills.ts, navigation.ts) — TypeScript files for non-collection structured data
7. Islands (MobileMenu.tsx, ThemeToggle) — the only JavaScript-hydrated components

**Key architectural rules:**
- Pages fetch data, sections render data (never the reverse)
- Content lives in MDX files, never hardcoded in components
- No CSS-in-JS (use Tailwind utilities and Astro scoped `<style>` blocks)
- Start with zero islands; add JavaScript only when a component genuinely requires interactivity

### Critical Pitfalls

1. **Over-engineering over content** — Set an animation budget (max 2-3 subtle transitions) before any UI work. Every interactive element must answer: "Does this help a recruiter understand Jack's capabilities faster?" If not, cut it. Time-box visual polish to a fixed percentage of total effort; content and structure get the majority.

2. **Placeholder content shipping to production** — Make placeholders visually distinct (e.g., `[PLACEHOLDER: Add project description]`). Require at least 2 fully written case studies before the first production deploy. Add a CI check or build-time warning for placeholder markers. This is the most common junior portfolio failure mode.

3. **Project showcases without narrative** — A title, screenshot, and tech list do not differentiate. Every project case study needs: Problem > Approach > Implementation > Outcome > Lessons. Include at least one explicit "decision I made and why" — this is the signal engineers and hiring managers are looking for.

4. **Font loading causing layout shift** — Self-host WOFF2 files via Astro's Fonts API (built into v6). Limit to 2 font families. Use `font-display: optional` for non-critical weights. Preload critical fonts. Target CLS < 0.1.

5. **Unoptimized images destroying LCP** — Use Astro's `<Image />` component (Sharp-backed, generates WebP/AVIF, responsive srcset, lazy loading, proper dimensions). No image served over 200KB. Hero image must have `fetchpriority="high"`. Target LCP < 2.5s on mobile.

## Implications for Roadmap

Based on combined research, the architecture's explicit build-order dependencies and pitfall prevention strategies strongly suggest six phases:

### Phase 1: Foundation and Project Scaffolding
**Rationale:** Every other component depends on the stack being configured, the design system being established, and the content schema being defined. Building these first prevents the "inline styles everywhere" and "hardcoded content in components" technical debt patterns identified in pitfalls research. The animation policy and performance budget must be locked in here, before any UI work begins.
**Delivers:** Configured Astro 6 + Tailwind v4 project, CSS custom properties for the design system (colors, typography, spacing), Zod content collection schema for projects, global styles, site/navigation data files, and TypeScript config.
**Addresses:** Design system (P1), HTTPS + custom domain setup, performance budget policy
**Avoids:** Inline styles anti-pattern, hardcoded content anti-pattern, over-engineering pitfall (set animation policy here)

### Phase 2: Site Shell (Layouts and Navigation)
**Rationale:** The shell — BaseLayout, Head/SEO component, Header, Footer, View Transitions — wraps every page. It must exist before any pages can be built. This phase also establishes SEO infrastructure (meta tags, OG tags) at the layout level, preventing the "missing SEO bolted on later" pitfall.
**Delivers:** BaseLayout with ClientRouter (View Transitions), Head component with meta/OG tag system, Header with navigation links, Footer with contact links, mobile menu island
**Addresses:** Navigation (P1), basic SEO/meta tags (P1), HTTPS + custom domain
**Avoids:** SPA SEO trap (OG tags baked into server-rendered HTML from day one), missing navigation on mobile

### Phase 3: Core Pages (Home, About, Resume, Contact)
**Rationale:** These are the primary "table stakes" pages that make the site feel complete to a recruiter. The Home page hero section, in particular, must pass the 10-second recruiter test — which requires validated information hierarchy before any visual polish begins. Building these before the project system gives a shippable skeleton.
**Delivers:** Home page (Hero, FeaturedProjects preview, SkillsOverview, CTA sections), About page, Resume page with PDF download, Contact section with direct links
**Addresses:** Hero/identity (P1), about page (P1), resume page (P1), contact links (P1), responsive design (P1)
**Avoids:** Failed 10-second recruiter test, buried contact info, missing resume PDF

### Phase 4: Project System (Cards and Case Studies)
**Rationale:** This is the core product. The dual-mode design — scan-friendly cards on the listing page, structured case studies on detail pages — is the primary differentiator. The content collection schema from Phase 1 makes this straightforward: create MDX files, query with `getCollection()`, render with the project layout. Placeholder content is acceptable here with the hard gate that at least 2 must be fully written before any production deploy.
**Delivers:** Projects listing page with card grid, dynamic `[slug].astro` route, ProjectLayout component, placeholder MDX files for all 5-6 projects, at least 2 fully written case studies
**Addresses:** Projects card grid (P1), project detail/case study pages (P1), dual reading modes (differentiator), GitHub/demo links
**Avoids:** Flat project showcases without narrative (ensure case study template enforces Problem/Approach/Outcome structure), placeholder content shipping to production

### Phase 5: Polish, Accessibility, and Performance
**Rationale:** Polish and QA come after all pages exist, not before. This phase adds the v1.x differentiators (dark mode, animations, screenshots) and performs the full audit against the "Looks Done But Isn't" checklist from pitfalls research. Performance optimization is validated here with Lighthouse scores as evidence.
**Delivers:** Dark/light mode with OS preference and localStorage persistence, GSAP scroll-triggered entrance animations, real project screenshots optimized via Astro Image, print-friendly resume, JSON-LD structured data, favicon, 404 page, accessibility audit (Lighthouse 95+ target), Lighthouse performance 95+ target
**Addresses:** Dark/light mode (P2), subtle animations (P2), project visuals (P2), structured data (P2), print styles (P2), accessibility baseline (P1 verified)
**Avoids:** Font loading layout shift, image performance trap, accessibility failures, animation performance regression

### Phase 6: Deployment and Launch
**Rationale:** DNS, SSL, and CI/CD configuration happen last. This phase also includes the pre-launch content gate (verify no placeholder content in production), social preview testing, and Search Console setup. Cloudflare Pages deployment is straightforward with Astro's official adapter.
**Delivers:** Cloudflare Pages deployment with custom domain, HTTPS, git-push CI/CD, `robots.txt` and `sitemap.xml` verified, social preview testing, Google Search Console submission
**Addresses:** Custom domain + HTTPS (P1), sitemap and SEO verification
**Avoids:** DNS misconfiguration delays, placeholder content in production, broken social previews

### Phase Ordering Rationale

- **Foundation before shell before pages:** Astro's architecture file explicitly maps this dependency chain — you cannot build layouts without global styles, cannot build pages without layouts.
- **Core pages before project system:** Provides a shippable skeleton and validates the site shell. Project system is the most complex component; building it on top of a proven shell reduces debugging.
- **Polish after all pages exist:** Adding dark mode to half-built pages creates rework. Animations added after content is final don't need to be re-tuned when content changes.
- **Deployment last with content gate:** The pitfall research is clear — the most common failure mode is deploying before content is ready. Making deployment its own explicit phase with content verification prevents this.

### Research Flags

Phases with well-documented patterns (skip per-phase research):
- **Phase 1 (Foundation):** Astro + Tailwind v4 setup is directly documented by both teams. Follow STACK.md installation instructions exactly.
- **Phase 2 (Shell):** Astro View Transitions and SEO patterns are in official Astro docs. Follow ARCHITECTURE.md patterns.
- **Phase 3 (Core Pages):** Standard Astro section composition, no novel patterns.
- **Phase 6 (Deployment):** Cloudflare Pages + Astro deployment is documented with official adapter.

Phases that may benefit from deeper research during planning:
- **Phase 4 (Project System):** The Astro Content Layer API (v6 only, legacy collections removed) has specific behavior worth verifying against current docs before implementation. Content schema design for the dual-mode feature deserves careful planning.
- **Phase 5 (Polish):** GSAP + Astro View Transitions interaction has known issues requiring the `astro:page-load` / `astro:before-preparation` cleanup pattern. Worth verifying current GSAP community guidance before implementation. Dark mode CSS custom property strategy with Tailwind v4's `@theme` system is also worth confirming.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All major decisions verified against official docs and multiple independent sources. Only caveat: Astro 6 is 12 days old (March 10, 2026) — fallback to Astro 5.18 is trivial if fresh bugs emerge. |
| Features | HIGH | Based on multiple portfolio review studies, recruiter surveys, and analysis of exemplary portfolios (Brittany Chiang gold standard). Feature prioritization is well-grounded. |
| Architecture | HIGH | Directly based on official Astro documentation and established Islands Architecture patterns. Build order reflects actual component dependency graph. |
| Pitfalls | HIGH | Sourced from first-hand portfolio review articles (40+ portfolio reviews, 150+ portfolio reviews), specific technical documentation (web.dev performance, WCAG guidelines). All mitigation strategies are actionable. |

**Overall confidence:** HIGH

### Gaps to Address

- **Astro 6 stability:** Released 12 days ago. If unexpected bugs arise during Phase 1 scaffolding, fallback path is Astro 5.18 with Fontsource substituting for the new Fonts API. All other stack decisions remain identical.
- **Content writing timeline:** The research defines the structure of case studies but cannot generate the content. Jack's ability to write 2+ complete case studies before launch is the primary non-technical risk. This should be flagged as a milestone in the roadmap, not treated as a development task.
- **Design aesthetic:** Research covers architecture and performance thoroughly but does not prescribe a specific visual direction. Color palette, typography choices, and overall aesthetic are decisions for the planning phase. The constraint is: it must be clean, professional, and load under 2 seconds — not any specific look.
- **GSAP + View Transitions compatibility:** The interaction between GSAP ScrollTrigger and Astro View Transitions has known issues with documented mitigations. The mitigation pattern (reinitialize on `astro:page-load`, kill on `astro:before-preparation`) is the current community consensus but should be verified against latest GSAP docs during Phase 5 planning.

## Sources

### Primary (HIGH confidence)
- Astro 6.0 Release Announcement — features, breaking changes, Node 22 requirement
- Astro Official Docs: View Transitions, Content Collections, Fonts, Islands Architecture, Project Structure
- Tailwind CSS v4.0 Release + Astro Integration Guide — Oxide engine, CSS-first config, `@tailwindcss/vite`
- GSAP Standard License — Webflow acquisition, all plugins now free
- TypeScript 5.9 Release Notes
- WebAIM Contrast Guidelines — WCAG AA thresholds
- web.dev Image Performance — srcset, fetchpriority, LCP optimization

### Secondary (MEDIUM confidence)
- State of JS 2025 / Astro Year in Review 2025 — framework satisfaction rankings
- GSAP + Astro View Transitions Forum — ScrollTrigger lifecycle cleanup pattern
- Vercel vs Netlify vs Cloudflare Pages 2026 — deployment platform comparison
- "What I learned after reviewing 40+ developer portfolios" (DEV Community)
- "6 Mistakes I Saw in 150+ Portfolio Reviews" (Open Doors Careers)
- Brittany Chiang Portfolio — gold standard reference for junior SWE portfolio structure
- Pingdom / Tooltester / Hostinger — bounce rate and load time statistics
- DebugBear — web font layout shift mechanics
- Lumar — SPA SEO crawling issues

### Tertiary (LOW confidence — use as directional only)
- Vercel/Cloudflare edge performance benchmarks (third-party, methodology unclear)
- Motion.dev vs GSAP comparison (source is Motion's own docs — inherent bias)

---
*Research completed: 2026-03-22*
*Ready for roadmap: yes*
