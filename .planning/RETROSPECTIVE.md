# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-31
**Phases:** 6 | **Plans:** 27 | **Tasks:** 43

### What Was Built
- Complete portfolio website (Home, About, Projects, Resume, Contact) with generative canvas hero
- Design system with OKLCH tokens, dark/light themes, Inter + IBM Plex Mono typography
- Project system with content collections, card grid, and structured MDX case studies
- GSAP scroll animations, page transitions, hover micro-interactions with reduced-motion support
- JSON-LD structured data, SEO meta infrastructure, print stylesheet
- Production deployment on Cloudflare Pages (jackcutrara.com) with CI/CD

### What Worked
- **Research-driven stack selection**: Astro 6 + Tailwind v4 delivered zero-JS pages and Lighthouse 90+ without optimization heroics
- **Content collections with Zod schemas**: Type-safe project content with build-time validation caught errors early
- **Design reference (shiyunlu.com)**: Having a specific visual target eliminated the "generic AI portfolio" problem
- **Phase-based execution**: 6 clear phases with dependency chains kept scope controlled
- **GSAP dynamic imports**: Code-splitting via dynamic import() kept Performance scores high without manual chunk config
- **Milestone audit before completion**: Caught 6 tech debt items and verified all 45 requirements

### What Was Inefficient
- **Multiple failed design attempts (Phase 3)**: Plans 03-05 and 03-06 produced generic layouts repeatedly — Claude cannot visually verify its own output, leading to multiple rejected iterations before adopting the shiyunlu.com reference approach
- **Canvas hero mouse influence bug**: Required 3 attempts across 2 plans (05-05, 05-06) to fix a mathematically broken formula — the section overlay z-index issue masked the real bug
- **GSAP + View Transitions lifecycle**: Reinitializing animations on `astro:page-load` and cleaning up on `astro:before-preparation` required trial and error to get right
- **Worktree gitlinks leak**: Git worktree artifacts leaked into commits, requiring a cleanup commit

### Patterns Established
- `data-animate` attribute convention for separating animation concerns from styling
- `.theme-transitioning` class pattern for scoped theme transition CSS
- `astro:after-swap` (not `astro:page-load`) for theme restoration during View Transitions
- Asymmetric grid layout (mono label + content) as inner page pattern
- CSS `opacity:0` pre-animation state with 3s JS fallback for Safari protection
- Tiered canvas particles (200/600/1000 by breakpoint)

### Key Lessons
1. **Claude cannot design blind** — without a visual reference or user mockup, AI generates structurally identical layouts with different CSS. Always provide a design reference for visual work.
2. **Dynamic imports are the GSAP performance answer** — Vite's code-splitting handles chunk boundaries automatically; no manual `manualChunks` config needed.
3. **View Transitions require explicit lifecycle management** — every client-side script that manipulates DOM must reinitialize on `astro:page-load` and clean up on `astro:before-preparation`.
4. **OKLCH tokens + CSS vars = painless theming** — defining tokens once in `:root` (dark) and `[data-theme='light']` with `@theme` bridge made both themes work everywhere automatically.
5. **Milestone audit catches what phase-level verification misses** — cross-phase integration gaps (like orphaned components and dormant infra) only surface when checking the full picture.

### Cost Observations
- Model mix: Primarily opus for execution, sonnet for research agents
- Sessions: ~10 across 10 days
- Notable: 27 plans averaging ~4 minutes each; Phase 5 (animations) and Phase 6 (performance) took the most time due to debugging and manual verification

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Plans | Key Change |
|-----------|----------|--------|-------|------------|
| v1.0 | ~10 | 6 | 27 | Established GSD workflow, design reference pattern |

### Top Lessons (Verified Across Milestones)

1. Always provide a visual design reference — blind AI design iterations waste time
2. Dynamic imports solve GSAP bundle size without manual chunk config
3. Milestone-level audit catches cross-phase gaps that per-phase verification misses
