# Phase 6: Performance Audit & Deployment - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Optimize the site for production-readiness: achieve Lighthouse 90+ across all categories on all pages, sub-2s LCP, CLS <0.1, lazy-load GSAP for faster initial paint, verify responsive design across breakpoints, audit accessibility in both themes, close out pending requirements from earlier phases, inspect build output, and do a final deploy verification on jackcutrara.com. The site goes from "feature-complete" to "production-grade."

</domain>

<decisions>
## Implementation Decisions

### Canvas & GSAP Performance Budget
- **D-01:** **Optimize first, then decide** on tradeoffs — try lazy-loading GSAP, reducing mobile particles, and other optimizations before accepting any score concession.
- **D-02:** **Lazy-load GSAP** — defer GSAP + ScrollTrigger + SplitText until after LCP. Animations kick in slightly later but initial page load feels instant.
- **D-03:** **Reduce canvas particle count on mobile** — keep the canvas hero but with fewer particles on smaller screens. Maintains visual identity while being lighter.
- **D-04:** **Lighthouse 90+ is the guardrail** — no explicit JS budget in KB. If all pages score 90+ Performance, the bundle size is implicitly acceptable.
- **D-05:** **Completely disable animations on prefers-reduced-motion** — all GSAP animations and canvas particles fully off. Content shows statically. Cleanest accessibility story.

### Image Optimization
- **D-06:** **Infrastructure only** — ensure ArticleImage and ProjectCard components are configured for WebP/AVIF, srcset, lazy loading, and correct dimensions. No real images to add now; when real screenshots are added later, they'll be optimized automatically.
- **D-07:** **Keep current og-default.png** — no new OG image for v1.

### Accessibility Audit
- **D-08:** **Lighthouse 90+ is sufficient** for accessibility depth — no axe-core or manual screen reader testing for v1.
- **D-09:** **Verify both themes independently** for color contrast — run Lighthouse in both dark and light mode to confirm WCAG AA (4.5:1+) compliance.

### Pending Requirements Cleanup
- **D-10:** **Verify and close all 5 pending Phase 2 requirements** as part of Phase 6:
  - SEOA-01: Unique title tag and meta description per page
  - SEOA-02: Open Graph tags for link previews
  - SEOA-06: Skip-to-content link
  - SEOA-07: Alt text on all images
  - CNTC-02: Contact links accessible from every page (footer)
  Most appear already implemented — Phase 6 formally verifies and marks complete.
- **D-11:** **Full deploy verification** after all fixes — push final changes, confirm CI/CD builds, verify live site on jackcutrara.com over HTTPS, spot-check key pages.

### Responsive Testing
- **D-12:** **Lighthouse mobile + 3 specific breakpoints** — run Lighthouse in mobile mode on all pages, plus manually verify layout at 375px (phone), 768px (tablet), 1440px (desktop).

### Font Loading
- **D-13:** **Audit fonts and use font-display: swap** — verify Astro's Fonts API self-hosts correctly, confirm no external font CDN requests, ensure font-display: swap is set for immediate text rendering with fallback.

### Build Output Verification
- **D-14:** **Inspect dist/ output** — run a production build, check total JS shipped, verify static pages have zero or minimal JS, confirm GSAP only loads where needed, check asset sizes.

### Claude's Discretion
- Specific Lighthouse optimization techniques beyond what's decided above
- Exact mobile particle count reduction (within "reduced" direction)
- GSAP lazy-loading implementation approach (dynamic import vs script defer)
- Order of audit passes (performance first vs accessibility first)
- Fix priority when multiple issues found
- Font fallback sizing details
- Any additional performance wins discovered during audit

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Phase 6 requirements: PERF-01 through PERF-05, plus pending: SEOA-01, SEOA-02, SEOA-06, SEOA-07, CNTC-02
- `.planning/ROADMAP.md` — Phase 6 success criteria and dependencies

### Project definition
- `.planning/PROJECT.md` — Core value proposition, constraints, performance expectations

### Prior phase context
- `.planning/phases/01-foundation-design-system/01-CONTEXT.md` — Token architecture, Cloudflare Pages deployment, content collection schema
- `.planning/phases/05-dark-mode-animations-polish/05-CONTEXT.md` — GSAP setup (D-07 through D-13), theme system (D-01 through D-06), canvas hero refinements (D-24), reduced-motion handling (D-13)

### Tech stack
- `CLAUDE.md` §Technology Stack — Complete stack spec (Astro 6, Tailwind CSS v4, GSAP, Cloudflare Pages)

### Critical implementation files
- `src/scripts/animations.ts` — Centralized GSAP animations (target for lazy-loading)
- `src/components/CanvasHero.astro` — Particle system (target for mobile optimization)
- `src/layouts/BaseLayout.astro` — Layout shell with SEO, fonts, theme detection, GSAP import
- `src/styles/global.css` — Design tokens with dark/light theme values
- `astro.config.mjs` — Astro 6 config with sitemap, MDX, Tailwind, Fonts API
- `src/components/ArticleImage.astro` — Image component (verify optimization config)
- `src/components/ProjectCard.astro` — Card with optional thumbnail (verify fallback + future image readiness)

### Deployment
- `public/robots.txt` — Already configured with sitemap reference
- `public/og-default.png` — Current OG image (keeping as-is)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **SEO component** (`BaseLayout.astro`): astro-seo with per-page title, description, OG tags already wired. Pending requirements may already be satisfied.
- **SkipToContent** (`SkipToContent.astro`): Already in BaseLayout. SEOA-06 likely complete.
- **Footer** (`Footer.astro`): Has contact links. CNTC-02 likely complete.
- **Sitemap integration** (`astro.config.mjs`): @astrojs/sitemap configured with site URL.
- **Theme detection** (`BaseLayout.astro`): Inline script for no-flash theme + astro:after-swap handler.
- **ArticleImage** (`ArticleImage.astro`): Image component used in case studies — needs optimization verification.
- **Fonts API** (`astro.config.mjs`): Self-hosted Inter and IBM Plex Mono via Astro 6 Fonts API.

### Established Patterns
- GSAP imported via `src/scripts/animations.ts` — single entry point for lazy-loading refactor
- Canvas hero already has viewport-based particle count adjustment
- All pages pass title/description to BaseLayout which feeds SEO component
- Dark-first tokens with `[data-theme="light"]` override

### Integration Points
- **GSAP lazy-loading**: Refactor `animations.ts` import in BaseLayout to dynamic import or deferred script
- **Canvas mobile optimization**: Modify particle count logic in CanvasHero.astro
- **Lighthouse audit**: Run against `astro preview` or deployed site
- **Build inspection**: Check `dist/` after `astro build`
- **Deploy verification**: Push to main, check Cloudflare Pages build, verify jackcutrara.com

</code_context>

<specifics>
## Specific Ideas

- Optimize first, decide later — don't preemptively cut visual quality before seeing actual scores
- GSAP lazy-loading is the biggest expected performance win (defer ~80KB from initial load)
- Canvas particle reduction on mobile is a targeted mobile performance win, not a global change
- Both themes must be audited independently for contrast compliance
- Pending Phase 2 requirements are likely already done — Phase 6 is the formal verification gate
- Build output inspection is a sanity check that Astro's zero-JS architecture is working as expected

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-performance-audit-deployment*
*Context gathered: 2026-03-31*
