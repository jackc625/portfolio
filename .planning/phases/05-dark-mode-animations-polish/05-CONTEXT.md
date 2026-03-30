# Phase 5: Dark Mode, Animations & Polish - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Add dark/light mode theming with OS detection and manual toggle, GSAP scroll-triggered reveal animations, smooth page transitions, hover micro-interactions, print styles for resume, JSON-LD structured data, and canvas hero refinements. The site goes from functional to premium — elevating Jack's perceived professionalism.

</domain>

<decisions>
## Implementation Decisions

### Theme Toggle Design
- **D-01:** Theme toggle lives in the **header nav bar** — visible on all pages, most discoverable placement.
- **D-02:** **Sun/moon icon button** as the toggle form — minimal footprint, universally understood, fits editorial aesthetic.
- **D-03:** **Smooth morph animation** on the icon when toggling — sun morphs into moon with rotation/scale transition. GSAP or CSS.
- **D-04:** **Smooth cross-fade** (~200-400ms) on all page colors when switching themes — feels intentional and premium.
- **D-05:** **Always visible in mobile header** — toggle stays in the header bar alongside the hamburger, not hidden inside the mobile menu.
- **D-06:** OS preference detection on first load (`prefers-color-scheme`), manual toggle persists choice to `localStorage`, no flash of wrong theme on page load (inline script in `<head>`).

### Animation Personality
- **D-07:** **Subtle & elegant** animation intensity — gentle fade-ins and slight slide-ups as sections enter viewport. Content appears calmly, like shiyunlu.com. Animations enhance but don't dominate.
- **D-08:** **All page sections** get scroll-triggered reveal animations — consistent rhythm across all pages using GSAP ScrollTrigger.
- **D-09:** **Staggered reveal** for project cards — cards appear one by one with ~100ms delays, creating a cascading waterfall effect.
- **D-10:** **Enhanced but restrained** hover micro-interactions — add subtle shadow lifts on cards, gentle underline animations on links, slight icon shifts on buttons. Beyond current color-change hovers but not over-engineered.
- **D-11:** **Slide-up per-line text animation** on hero/display headings only — large display-sized headings (page titles, hero text) get line-by-line slide-up reveals using GSAP SplitText. Body section headings fade normally with their parent section.
- **D-12:** **Animations replay every visit** — scroll-triggered animations run each time a page is loaded/navigated to. No first-visit-only tracking.
- **D-13:** All animations **respect `prefers-reduced-motion`** — disable all motion, show content statically. Canvas hero already handles this.

### Page Transitions
- **D-14:** **Smooth crossfade** between pages (~200-300ms) — old page fades out, new page fades in. Uses Astro's built-in View Transitions API with ClientRouter (already set up). Zero extra JS.
- **D-15:** Scroll-triggered animations **replay on navigation** — consistent with D-12.

### Light Theme Aesthetic
- **D-16:** **Warm off-white / cream** background feel — slightly warm backgrounds (ivory/cream tint), softer and more approachable than stark white.
- **D-17:** **Deeper / richer blue** accent in light mode — more saturated than the dark theme's muted blue to stand out on light backgrounds. Must pass WCAG AA contrast (4.5:1+).
- **D-18:** **Canvas hero adapts colors** for light mode — particles and trails shift to darker tones on warm off-white. The canvas already reads accent color from CSS tokens, which should enable automatic adaptation.
- **D-19:** Both themes **independently pass WCAG AA** contrast ratios (4.5:1+) on all text.

### Print Stylesheet
- **D-20:** **Resume page only** gets @media print treatment — other pages aren't typically printed.
- **D-21:** **Clean version of on-screen layout** — strip nav/footer/backgrounds but keep the page's structure and typography. Not a traditional resume reformat.

### Structured Data (JSON-LD)
- **D-22:** **Person schema** on home/about pages — name, job title, URL, sameAs (GitHub, LinkedIn). Basics only, no education/skills fields.
- **D-23:** **CreativeWork schema** on each project/case study page — title, description, tech stack, links. Auto-generated from content collection data.

### Canvas Hero Refinements
- **D-24:** **Subtle enhancements** to the existing particle flow field (not a rewrite):
  - Mouse/cursor influence — particles gently respond to cursor position
  - Parallax depth — particles at different "depths" move at different speeds
  - Speed/density tuning — adjust parameters for a more polished feel

### Claude's Discretion
- Specific GSAP ScrollTrigger configuration (trigger offsets, animation durations, easing curves)
- Exact light theme OKLCH color values (within warm off-white direction, must pass AA)
- Sun/moon icon design and morph animation implementation details
- Specific hover animation parameters (shadow sizes, transition timings)
- SplitText configuration (line splitting, stagger values, easing)
- Print stylesheet color adjustments and element visibility
- JSON-LD schema field completeness beyond specified minimums
- Canvas particle parameter tuning values
- GSAP cleanup/reinitialization for View Transitions lifecycle

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Phase 5 requirements: DSGN-02, DSGN-03, DSGN-04, ANIM-01, ANIM-02, ANIM-03, ANIM-04, RESM-03, SEOA-03
- `.planning/ROADMAP.md` — Phase 5 success criteria and dependencies

### Project definition
- `.planning/PROJECT.md` — Core value proposition, constraints, design process constraint

### Prior phase context
- `.planning/phases/01-foundation-design-system/01-CONTEXT.md` — Token architecture (CSS custom properties -> @theme bridge), dark-first default, restrained palette, reference inspiration sites
- `.planning/phases/03-core-pages/03-CONTEXT.md` — shiyunlu.com clone as global design language, inner page pattern (mono uppercase label + asymmetric grid)
- `.planning/phases/04-project-system-case-studies/04-CONTEXT.md` — Project card layout, case study template, component patterns

### Tech stack
- `CLAUDE.md` §Technology Stack — Complete stack spec (Astro 6, Tailwind CSS v4, GSAP, View Transitions, Content Collections)

### Existing code (critical for animation integration)
- `src/styles/global.css` — Token architecture with commented-out light theme values at lines 52-69
- `src/layouts/BaseLayout.astro` — ClientRouter setup, SEO component, font loading
- `src/components/CanvasHero.astro` — Existing particle animation with View Transitions lifecycle handling
- `src/components/Header.astro` — Navigation bar where theme toggle will be added
- `src/components/MobileMenu.astro` — Mobile menu with staggered animation pattern
- `src/pages/resume.astro` — Resume page that needs print styles

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Token architecture** (`global.css`): Dark-first tokens with commented light theme override using `[data-theme="light"]`. Tailwind @theme bridge maps tokens to utilities. Ready to uncomment and refine.
- **Canvas hero** (`CanvasHero.astro`): 186-line simplex-noise particle animation. Already handles `prefers-reduced-motion`, View Transitions lifecycle, responsive particle counts, and dynamic accent color extraction from CSS tokens.
- **Mobile menu animations** (`MobileMenu.astro`): Staggered `menuLinkIn` keyframes with `--link-index` CSS variable pattern. Reusable stagger approach.
- **Pulse ring animation** (`contact.astro`): `@keyframes pulse-ring` with reduced-motion support. Pattern can be extended for other micro-interactions.
- **ClientRouter** (`BaseLayout.astro`): Already set up for View Transitions. Smooth crossfade just needs CSS animation configuration.
- **SEO component** (`BaseLayout.astro`): `astro-seo` with OG/Twitter meta. JSON-LD scripts can be added alongside.
- **GSAP** (`package.json`): v3.14.2 installed but unused. ScrollTrigger and SplitText now free.

### Established Patterns
- All components are `.astro` server components (no React/Vue)
- Tailwind utility classes with `var(--token-*)` fallbacks
- `group-hover:` based interaction patterns on cards and links
- `transition-colors duration-200` as standard transition
- View Transitions lifecycle: `astro:page-load` for init, `astro:before-preparation` for cleanup
- Focus-visible rings with accent color for accessibility

### Integration Points
- **Theme toggle**: Add to `Header.astro` nav bar (desktop) — icon button next to nav links
- **Theme script**: Inline `<script>` in `BaseLayout.astro` `<head>` for no-flash theme detection
- **GSAP animations**: Initialize in `<script>` blocks per page/component, cleanup on `astro:before-preparation`
- **JSON-LD**: Add `<script type="application/ld+json">` in `BaseLayout.astro` or per-page layouts
- **Print styles**: Add `@media print` rules in `global.css` or separate `print.css` imported in resume layout
- **Canvas enhancements**: Modify `CanvasHero.astro` script — add mouse tracking, depth layers, parameter tuning

</code_context>

<specifics>
## Specific Ideas

- Light theme should feel **warm off-white / cream** — not stark white, not cool gray
- Light mode accent is a **deeper, richer blue** than dark mode's muted blue — more saturated to pop on light backgrounds
- Hero/display headings get **GSAP SplitText line-by-line slide-up** reveals — a touch of craft reserved for high-impact moments
- Canvas hero gets **mouse influence + parallax depth + parameter tuning** — interactive without being distracting
- Theme toggle icon should **morph smoothly** between sun and moon states

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-dark-mode-animations-polish*
*Context gathered: 2026-03-30*
