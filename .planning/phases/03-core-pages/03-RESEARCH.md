# Phase 3: Core Pages - Research (REPLAN)

**Researched:** 2026-03-25
**Domain:** Design system overhaul (shiyunlu.com clone), HTML5 Canvas generative art, Astro 6 page composition
**Confidence:** MEDIUM-HIGH (see assessment)

## Summary

This is a REPLAN of Phase 3. The original Phase 3 built four core pages with an "editorial" design, but the home/about pages were rejected as generic. The new direction is a near-exact clone of shiyunlu.com's design language -- spatial layout, grid system, color treatment, font stack, and navigation patterns -- applied to Jack's portfolio content. The reference site IS the design spec; no separate UI-SPEC is needed.

The phase scope has expanded significantly from the original: it now includes updating design tokens (colors, fonts, spacing), reworking the entire site shell (header, footer, mobile menu), and rebuilding all four core pages within the cloned design system. The canvas hero with generative art adds client-side JavaScript for the first time. Animations (GSAP scroll-triggered) remain deferred to Phase 5 -- this phase builds the static layout with basic CSS hover transitions only.

**Critical limitation:** shiyunlu.com is an Astro site that renders entirely client-side, making it impossible to scrape via WebFetch. The implementor MUST visit shiyunlu.com in a browser, inspect it with DevTools, and extract exact CSS values (colors, fonts, grid, spacing) before writing any code. This research provides the technical patterns and architecture for implementation, but the pixel-level design extraction requires human browser inspection.

**Primary recommendation:** Structure implementation in layers: (1) extract design tokens from shiyunlu.com via browser DevTools, (2) update global.css token values and astro.config.mjs fonts, (3) rebuild site shell (header/nav/footer/mobile menu), (4) build home page with canvas hero, (5) build about/resume/contact within the new design system. The canvas hero uses vanilla JS with simplex-noise (4.0.3) in an Astro `<script>` tag -- no framework island needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Near-exact clone of shiyunlu.com as the global design language for the entire portfolio -- not just this phase. Every current and future page follows this design system.
- **D-02:** Clone scope includes: spatial layout/grid system, color treatment (muted gradient accents), font stack (or closest free equivalents to shiyunlu.com's typography), and navigation patterns.
- **D-03:** Animations are deferred to Phase 5. This phase builds the static layout clone. Basic CSS transitions/hovers for interactivity are acceptable, but no GSAP scroll-triggered animations yet.
- **D-04:** Bypass the frontend-design skill -- the reference site IS the design spec. Analyze shiyunlu.com directly and implement. No separate UI-SPEC or design interpretation layer.
- **D-05:** Update color tokens to match shiyunlu.com's color treatment -- muted gradient accents, near-black backgrounds. Replace existing oklch palette.
- **D-06:** Update font stack to match shiyunlu.com's typography (or closest freely available equivalents). Replace Instrument Serif / Instrument Sans / JetBrains Mono.
- **D-07:** Existing design token architecture (CSS custom properties to Tailwind @theme bridge) remains -- only the values change, not the system.
- **D-08:** Rework header/nav/footer to match shiyunlu.com's navigation pattern (asymmetric grid nav, etc.). The Phase 2 scroll-reveal sticky nav is replaced.
- **D-09:** Mobile menu also reworked to match shiyunlu.com's mobile navigation pattern.
- **D-10:** Clone shiyunlu.com's home page spatial structure as closely as possible.
- **D-11:** Canvas hero with abstract/generative art -- procedural visuals (particles, gradients, geometric shapes) similar to shiyunlu.com. Unique on every page load.
- **D-12:** No featured projects on the home page. Projects are accessed via the projects page through navigation. HOME-02 requirement is relaxed.
- **D-13:** Requirements are flexible -- HOME-01 through HOME-04 describe WHAT info should be accessible, not WHERE it must live. If the cloned layout doesn't naturally have room for something, visitors find it through nav. Update requirements to match what the layout actually delivers.
- **D-14:** Follow shiyunlu.com's design system rules (fonts, colors, grid, spacing) but compose the about page layout freely within those rules. Not a direct clone of a specific shiyunlu.com inner page.
- **D-15:** Same content flexibility as home -- requirements (ABUT-01 through ABUT-03) are flexible. If the skills grid or narrative doesn't fit naturally, reshape or relocate.
- **D-16:** Keep the current first-person conversational tone for copy. Visual design changes but writing style stays.
- **D-17:** Resume and Contact pages get the full design system treatment -- rebuilt to follow shiyunlu.com's design system (grid, spacing, composition), not just a color/font swap.
- **D-18:** Resume hybrid approach (styled summary + PDF download) still valid -- just rebuilt within the new design system.
- **D-19:** Contact page (email, LinkedIn, GitHub + availability status) still valid -- rebuilt within the new design system.

### Claude's Discretion
- Specific canvas/generative art implementation details (algorithm, visual style within "abstract/generative")
- How to adapt shiyunlu.com's specific sections for a SWE portfolio context
- About page layout composition within the design system rules
- Resume and Contact page layout composition within the design system
- All copy/content drafting (user will revise later)
- Exact font selections (closest free equivalents to shiyunlu.com's type)
- Navigation rework details within shiyunlu.com's pattern

### Deferred Ideas (OUT OF SCOPE)
- GSAP scroll-triggered animations -- Phase 5 (D-03 explicitly defers)
- Dark/light mode toggle -- Phase 5 (token architecture preserved for this)
- Featured projects on home page -- Revisit in Phase 4 if the projects page design suggests it. Currently dropped (D-12).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-01 | Hero section with name, role positioning, brief intro, and primary CTA (view projects) | Canvas hero with generative art + name/role overlay. CTA may be navigation-based rather than explicit button, per D-13 flexibility. |
| HOME-02 | Featured projects preview section highlighting 2-3 top projects | RELAXED per D-12. No featured projects on home. Projects accessed via nav. |
| HOME-03 | Brief intro/about teaser that drives visitors to the About page | Flexible -- may be integrated into hero text or nav structure per D-13. |
| HOME-04 | Prominent links to resume and contact information | Flexible -- navigation provides discovery per D-13. |
| ABUT-01 | Background narrative covering education, path into engineering, and interests | About page composed freely within design system (D-14). First-person conversational tone preserved (D-16). |
| ABUT-02 | Professional but human tone -- shows personality without being unprofessional | Tone preserved from previous iteration. Copy can be adapted. |
| ABUT-03 | Technology/skills presentation grouped by context (not progress bars) | Flexible per D-15. Skills presentation adapted to fit design system naturally. |
| RESM-01 | Resume page with viewable content rendered on-page | Hybrid styled summary rebuilt within new design system (D-18). |
| RESM-02 | PDF download button above the fold | Still required. Rebuilt within new design system. |
| CNTC-01 | Contact section with direct email, LinkedIn, and GitHub links | Email, LinkedIn, GitHub + availability status rebuilt within design system (D-19). |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies for pages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 6.0.8 | Framework / static pages | Already installed. Pages are `.astro` files in `src/pages/`. |
| Tailwind CSS | 4.2.2 | Styling via utilities + design tokens | Already installed via `@tailwindcss/vite`. All styling uses `var(--token-*)` bridge. |
| TypeScript | 5.9.3 | Type safety in frontmatter scripts | Already installed. |
| GSAP | 3.14.2 | Already installed but NOT USED in Phase 3 | Deferred to Phase 5 per D-03. |

### New Dependencies

| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| simplex-noise | 4.0.3 | Noise generation for canvas generative art | Lightweight (2KB gzipped), zero dependencies, tree-shakeable. Provides 2D/3D/4D simplex noise for flow fields, particle systems, and gradient generation. The standard library for this in JS ecosystem (300K+ weekly npm downloads). |

**Installation:**
```bash
pnpm add simplex-noise
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| simplex-noise | p5.js | p5.js is 800KB+ and provides a full creative coding framework. Massive overkill for a single canvas hero. simplex-noise is 2KB. |
| simplex-noise | Hand-rolled Perlin noise | Reinventing tested math. simplex-noise is well-tested, fast, and tiny. |
| Vanilla JS canvas | React island with canvas | Adds React runtime (~40KB) for a single non-interactive canvas. Vanilla JS in an Astro `<script>` tag is zero-framework overhead. |

## Architecture Patterns

### Project Structure for Phase 3 (REPLAN)

```
src/
├── components/
│   ├── Header.astro              # REWRITE: match shiyunlu.com nav pattern
│   ├── Footer.astro              # REWRITE: match shiyunlu.com footer
│   ├── MobileMenu.astro          # REWRITE: match shiyunlu.com mobile menu
│   ├── CanvasHero.astro          # NEW: generative art canvas component
│   ├── SkillGroup.astro          # RESTYLE: within new design system
│   ├── ResumeEntry.astro         # RESTYLE: within new design system
│   ├── ContactChannel.astro      # RESTYLE: within new design system
│   ├── CTAButton.astro           # RESTYLE: within new design system (may be removed if layout doesn't use buttons)
│   ├── FeaturedProjectItem.astro # KEEP: not used on home page (D-12), but still useful for Phase 4
│   └── SkipToContent.astro       # KEEP: accessibility component unchanged
├── pages/
│   ├── index.astro               # REWRITE: clone shiyunlu.com home structure + canvas hero
│   ├── about.astro               # REWRITE: new design system, free composition
│   ├── resume.astro              # REWRITE: new design system
│   ├── contact.astro             # REWRITE: new design system
│   └── projects.astro            # KEEP: stub for Phase 4
├── layouts/
│   └── BaseLayout.astro          # UPDATE: new fonts, possibly new shell structure
├── styles/
│   └── global.css                # UPDATE: new color tokens, spacing tokens, font refs
└── content.config.ts             # UNCHANGED
public/
└── resume.pdf                    # EXISTS or placeholder needed
astro.config.mjs                  # UPDATE: new font configuration
```

### Pattern 1: Design Token Update (Preserve Architecture, Change Values)

**What:** Update the existing CSS custom property system with new color and spacing values cloned from shiyunlu.com, without changing the architecture.
**When to use:** First step of the replan -- everything else builds on updated tokens.
**Key detail:** The three-layer architecture is preserved:
1. `:root` CSS custom properties (Layer 1) -- VALUES change
2. `@theme` bridge (Layer 2) -- UNCHANGED (still maps `var(--token-*)` to Tailwind utilities)
3. Tailwind utility classes in components (Layer 3) -- class names stay the same, values auto-update

```css
/* BEFORE (current tokens) */
:root {
  --token-bg-primary: oklch(0.13 0.005 260);
  --token-accent: oklch(0.72 0.12 178);
  /* ... */
}

/* AFTER (shiyunlu.com-cloned tokens -- exact values TBD from DevTools inspection) */
:root {
  --token-bg-primary: /* extracted from shiyunlu.com */;
  --token-accent: /* extracted from shiyunlu.com */;
  /* ... */
}
```

### Pattern 2: Font Stack Swap via Astro Fonts API

**What:** Change font families by updating `astro.config.mjs` font configuration and CSS variable references.
**When to use:** When swapping the entire font stack to match shiyunlu.com.
**Key insight:** The font system uses CSS variables (`--font-heading`, `--font-sans`, `--font-code`) that are referenced throughout the codebase. Changing the fonts in `astro.config.mjs` automatically propagates everywhere.

```javascript
// astro.config.mjs -- BEFORE
fonts: [
  { provider: fontProviders.google(), name: "Instrument Serif", cssVariable: "--font-heading", weights: [400] },
  { provider: fontProviders.google(), name: "Instrument Sans", cssVariable: "--font-sans", weights: [400, 600] },
  { provider: fontProviders.google(), name: "JetBrains Mono", cssVariable: "--font-code", weights: [400] },
]

// AFTER (example -- exact fonts TBD from shiyunlu.com inspection)
fonts: [
  { provider: fontProviders.google(), name: "NewDisplayFont", cssVariable: "--font-heading", weights: [400, 700] },
  { provider: fontProviders.google(), name: "NewBodyFont", cssVariable: "--font-sans", weights: [400, 500, 600] },
  { provider: fontProviders.google(), name: "NewMonoFont", cssVariable: "--font-code", weights: [400] },
]
```

**Font recommendation based on known shiyunlu.com typography:**
Phase 1 context (D-04) documents that shiyunlu.com uses "Graphik/Wotfard/IBM Plex Mono." These are the reference fonts:
- **Graphik** -- A geometric sans-serif by Commercial Type. NOT free. Closest free alternatives: **Inter** (very close geometric proportions), **Plus Jakarta Sans** (warm geometric), or **DM Sans** (clean geometric).
- **Wotfard** -- A geometric sans-serif by Atipo. NOT free. Closest free alternatives: Same as above -- Inter or Plus Jakarta Sans.
- **IBM Plex Mono** -- FREE. Available on Google Fonts. Use directly.

**Recommended free equivalents:**
- Display/Heading: **Inter** (Google Fonts) -- clean geometric sans, excellent weight range, widely used in premium dark portfolios
- Body: **Inter** (same family, different weights) or **Plus Jakarta Sans** if wanting visual distinction between heading and body
- Mono: **IBM Plex Mono** (Google Fonts) -- exact match to shiyunlu.com

### Pattern 3: Canvas Generative Art in Astro (Vanilla JS)

**What:** An Astro component that renders a full-viewport `<canvas>` element with procedural generative visuals using vanilla JavaScript and the simplex-noise library.
**When to use:** Home page hero (D-11).
**Architecture:** The canvas is a static HTML element; the generative art logic runs in a `<script>` tag. No framework island (React/Vue) needed.

```astro
---
// src/components/CanvasHero.astro
// No frontmatter logic needed -- all rendering is client-side
---

<section class="relative w-full h-screen overflow-hidden" aria-label="Introduction">
  <canvas id="hero-canvas" class="absolute inset-0 w-full h-full" aria-hidden="true"></canvas>
  <div class="relative z-10 flex flex-col justify-center h-full px-[var(--token-space-md)]">
    <!-- Name, role, intro text overlay -->
    <slot />
  </div>
</section>

<script>
  import { createNoise2D } from 'simplex-noise';

  function initCanvas() {
    const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const noise2D = createNoise2D();
    let animationId: number;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function draw(time: number) {
      // Generative art rendering logic here
      // Use noise2D(x, y) for flow fields, particle movement, gradient generation
      animationId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw(0);

    // Cleanup for View Transitions
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }

  // Initialize on page load and re-initialize after View Transitions
  let cleanup: (() => void) | undefined;

  document.addEventListener('astro:page-load', () => {
    cleanup?.();
    cleanup = initCanvas() || undefined;
  });

  document.addEventListener('astro:before-preparation', () => {
    cleanup?.();
    cleanup = undefined;
  });
</script>
```

**Key details:**
- `simplex-noise` is imported directly in the `<script>` tag. Astro bundles it automatically (no `is:inline` needed).
- Canvas is `aria-hidden="true"` -- it's decorative, not content.
- Content overlays the canvas with `relative z-10`.
- Cleanup function cancels animation frame and removes event listeners on View Transition navigation.
- The `astro:page-load` / `astro:before-preparation` lifecycle pattern matches the existing Header/MobileMenu scripts.

### Pattern 4: Navigation Pattern (shiyunlu.com-style)

**What:** Asymmetric grid navigation as observed from Phase 1 context (D-04: "asymmetric grid nav").
**When to use:** Header component rewrite.
**Key insight:** shiyunlu.com uses a navigation layout that is NOT a conventional centered flex row. It uses an asymmetric grid positioning. The exact layout must be extracted from the live site via DevTools.

**General pattern:**
```astro
<header class="fixed top-0 left-0 right-0 z-50">
  <nav class="grid grid-cols-[auto_1fr_auto] items-center h-16 px-6">
    <!-- Left: Logo/name -->
    <a href="/" class="font-display">Jack Cutrara</a>
    <!-- Center: spacer or content -->
    <div></div>
    <!-- Right: nav links -->
    <ul class="flex gap-6">
      <!-- links -->
    </ul>
  </nav>
</header>
```

The actual grid pattern depends on the DevTools inspection of shiyunlu.com. The implementor must adapt this based on what they observe.

### Pattern 5: View Transitions Lifecycle for Canvas

**What:** The canvas animation must properly initialize and clean up during Astro View Transitions.
**When to use:** Any page with client-side animations or canvas rendering.
**Why critical:** Without cleanup, navigating away from the home page leaves an orphaned animation frame loop running. Navigating back creates a second loop.

The established pattern from Phase 2 (Header.astro, MobileMenu.astro) is:
```javascript
document.addEventListener('astro:page-load', initFunction);
```

For canvas, we also need cleanup on navigation:
```javascript
document.addEventListener('astro:before-preparation', cleanupFunction);
```

### Anti-Patterns to Avoid

- **Extracting colors from screenshots instead of DevTools:** Screenshots compress colors and gamma-correct. Always use DevTools computed styles for exact values.
- **Using React/Vue island for the canvas:** The canvas is non-interactive (decorative) and uses vanilla JS APIs. A framework island adds 40KB+ of runtime for zero benefit.
- **Changing the token architecture:** D-07 says the architecture stays. Only change VALUES in `:root`, never restructure the `@theme` bridge or Tailwind utility mapping.
- **Hardcoding colors instead of using tokens:** Every color must still use `text-{token}`, `bg-{token}`, `border-{token}` Tailwind utilities. The token values change, not the class names.
- **Keeping the old scroll-reveal header logic:** D-08 says the Phase 2 scroll-reveal sticky nav is replaced. Remove the scroll listener and `.header-scrolled` / `.header-hidden` classes.
- **Building complex animation sequences:** D-03 defers GSAP animations to Phase 5. Only CSS transitions/hovers are acceptable in this phase.
- **Force-fitting requirements into the layout:** D-13 says requirements are flexible. If the cloned layout doesn't have room for something, visitors find it through nav. Do NOT add extra sections just to satisfy requirements.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Noise generation | Custom Perlin/simplex implementation | `simplex-noise` npm package (4.0.3) | Battle-tested, 2KB, tree-shakeable, supports seeded PRNG |
| Font loading | Manual @font-face declarations | Astro 6 Fonts API in `astro.config.mjs` | Handles download, cache, self-host, fallback generation, preload injection |
| Meta tags / SEO | Custom `<head>` meta management | `astro-seo` via BaseLayout props | Already wired. |
| PDF embedding | Custom PDF viewer / iframe | Simple `<a download>` link | Resume is styled summary + download, not embedded PDF |
| Color/gradient math | Manual oklch calculations | Browser DevTools color picker on shiyunlu.com | Extract exact values, don't approximate |

## Common Pitfalls

### Pitfall 1: Cannot Scrape shiyunlu.com Programmatically
**What goes wrong:** WebFetch and similar tools return only the Astro framework shell, not the rendered content or styles. The site is a client-rendered Astro application.
**Why it happens:** Astro's island architecture with client-side hydration means the HTML is empty until JavaScript executes.
**How to avoid:** The implementor MUST open shiyunlu.com in a real browser and use DevTools to inspect: computed styles, font-family declarations, grid/flexbox layout, color values, spacing, and overall structure. Document findings before writing code.
**Warning signs:** Attempting to automate the design extraction process will produce empty/incomplete results.

### Pitfall 2: Canvas Performance on Mobile
**What goes wrong:** Generative art animation runs at low frame rate on mobile devices, draining battery.
**Why it happens:** Full-viewport canvas with complex particle systems or noise calculations is computationally expensive.
**How to avoid:**
- Reduce particle count on mobile (check `window.innerWidth < 768`)
- Use `requestAnimationFrame` (already planned) not `setInterval`
- Consider reducing canvas resolution on mobile: `canvas.width = window.innerWidth * (isMobile ? 0.5 : 1)` with CSS `image-rendering: auto`
- Keep noise calculations simple (2D noise, not 3D/4D)
- Respect `prefers-reduced-motion`: disable animation entirely, show static frame
**Warning signs:** Choppy animation, device heating up, high CPU usage in DevTools Performance tab.

### Pitfall 3: Canvas Sizing and DPI
**What goes wrong:** Canvas appears blurry on retina/HiDPI displays, or has incorrect dimensions.
**Why it happens:** Canvas pixel dimensions must account for `devicePixelRatio`. CSS sizing alone is not enough.
**How to avoid:**
```javascript
const dpr = window.devicePixelRatio || 1;
canvas.width = window.innerWidth * dpr;
canvas.height = window.innerHeight * dpr;
canvas.style.width = window.innerWidth + 'px';
canvas.style.height = window.innerHeight + 'px';
ctx.scale(dpr, dpr);
```
**Warning signs:** Blurry canvas on MacBook/iPhone, or canvas not filling viewport.

### Pitfall 4: View Transitions Break Canvas State
**What goes wrong:** Navigating away from home page and back causes duplicate animation loops, memory leaks, or blank canvas.
**Why it happens:** Astro's ClientRouter swaps page content but scripts persist. Without cleanup, the old animation frame loop keeps running.
**How to avoid:** Implement the cleanup pattern (Pattern 5 above). Use `astro:before-preparation` to cancel animation frames and remove resize listeners. Re-initialize on `astro:page-load`.
**Warning signs:** Memory usage increases with each page navigation, multiple overlapping animations.

### Pitfall 5: Font Cache After Font Swap
**What goes wrong:** Old fonts persist after changing `astro.config.mjs` font configuration.
**Why it happens:** Astro caches downloaded font files in `.astro/fonts/`.
**How to avoid:** Delete the cache directory after changing fonts:
```bash
rm -rf .astro/fonts/ node_modules/.astro/fonts/
```
Then restart the dev server.
**Warning signs:** Old fonts still rendering despite config change.

### Pitfall 6: Contrast Violations After Color Token Update
**What goes wrong:** New color tokens break WCAG AA contrast ratios for existing text.
**Why it happens:** shiyunlu.com's color palette may have different contrast characteristics than the current palette.
**How to avoid:** After updating tokens, verify all text/background combinations meet 4.5:1 for normal text and 3:1 for large text. Use browser DevTools Accessibility panel or a contrast checker.
**Warning signs:** Lighthouse accessibility audit flags contrast issues.

### Pitfall 7: Tailwind Fluid Typography Syntax
**What goes wrong:** Custom CSS property values don't work in Tailwind utility classes.
**Why it happens:** Tailwind v4 requires the `[length:]` prefix for CSS custom properties that resolve to length values.
**How to avoid:** Always use `text-[length:var(--token-text-display)]`, not `text-[var(--token-text-display)]`.
**Warning signs:** Font sizes not applying, Tailwind silently ignoring the class.

## Code Examples

### Simplex Noise Flow Field (Generative Art Foundation)

```javascript
// Core generative art pattern for the canvas hero
import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D(); // Uses Math.random by default

// Flow field particle system
class Particle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.prevX = this.x;
    this.prevY = this.y;
  }

  update(width: number, height: number, time: number, scale: number) {
    this.prevX = this.x;
    this.prevY = this.y;
    const angle = noise2D(this.x * scale, this.y * scale + time) * Math.PI * 2;
    this.x += Math.cos(angle) * 1.5;
    this.y += Math.sin(angle) * 1.5;

    // Wrap around edges
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D, color: string) {
    ctx.beginPath();
    ctx.moveTo(this.prevX, this.prevY);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}
```

Source: Based on simplex-noise documentation + standard flow field technique

### Astro Fonts API Configuration (Font Swap)

```javascript
// astro.config.mjs -- updated font configuration
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  // ... other config
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Inter",  // Closest free equivalent to Graphik
      cssVariable: "--font-heading",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
    },
    {
      provider: fontProviders.google(),
      name: "Inter",  // Same family for body (shiyunlu.com uses geometric sans for both)
      cssVariable: "--font-sans",
      weights: [400, 500, 600],
      styles: ["normal", "italic"],
    },
    {
      provider: fontProviders.google(),
      name: "IBM Plex Mono",  // Exact match to shiyunlu.com
      cssVariable: "--font-code",
      weights: [400, 500],
      styles: ["normal"],
    },
  ],
});
```

### prefers-reduced-motion for Canvas

```javascript
// Respect user motion preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // Draw a single static frame instead of animating
  drawStaticFrame(ctx, noise2D, canvas.width, canvas.height);
} else {
  // Start animation loop
  requestAnimationFrame(draw);
}
```

### Design Token Update Pattern

```css
/* global.css -- only VALUES change, architecture preserved */
:root {
  /* === COLOR TOKENS (updated to match shiyunlu.com) === */
  /* IMPORTANT: Exact values must be extracted from shiyunlu.com DevTools */
  /* These are placeholders illustrating the pattern */

  --token-bg-primary: oklch(/* near-black from shiyunlu.com */);
  --token-bg-secondary: oklch(/* slightly lighter from shiyunlu.com */);
  --token-accent: oklch(/* muted gradient accent from shiyunlu.com */);
  --token-accent-hover: oklch(/* hover variant */);

  --token-text-primary: oklch(/* light text on dark */);
  --token-text-secondary: oklch(/* muted text */);
  --token-text-muted: oklch(/* very muted text */);

  --token-border: oklch(/* subtle border */);
  --token-border-hover: oklch(/* hover border */);
}

/* The @theme bridge below is UNCHANGED -- it still maps var(--token-*) */
```

## State of the Art

| Old Approach (Phase 3 v1) | New Approach (Phase 3 v2) | Why Changed | Impact |
|---------------------------|---------------------------|-------------|--------|
| UI-SPEC as design authority | shiyunlu.com as design authority (D-04) | Original editorial designs were generic/rejected | Implementor inspects live site instead of reading spec document |
| frontend-design skill for visual decisions | Direct clone from reference site | Bypasses design interpretation layer | Faster, more predictable results |
| Featured projects on home page | No featured projects on home (D-12) | Simplifies home, projects via nav | FeaturedProjectItem.astro unused on home (kept for Phase 4) |
| Standard stacked section layout | Asymmetric grid layout cloned from reference | Previous layouts were "generic AI portfolio" | Requires careful grid/flexbox composition |
| Static hero (text only) | Canvas hero with generative art (D-11) | Adds visual distinctiveness | New dependency (simplex-noise), client-side JS |
| Instrument Serif / Instrument Sans / JetBrains Mono | New font stack matching shiyunlu.com | Design overhaul | astro.config.mjs + global.css update |
| Current color palette | shiyunlu.com-cloned palette | Design overhaul | global.css token values update |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | none -- needs creation (Wave 0 from original research still applies) |
| Quick run command | `npx astro build` |
| Full suite command | `npx astro build && npx astro preview` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-01 | Hero has name, role, canvas, intro text | smoke (build) | `npx astro build` | N/A -- build-time |
| HOME-02 | RELAXED -- no featured projects on home | N/A | N/A | N/A |
| HOME-03 | About teaser / navigation discovery | smoke | Build + visual check | N/A |
| HOME-04 | Resume/contact discovery via nav | smoke | Build + visual check | N/A |
| ABUT-01 | Narrative with education, journey, interests | manual-only | Visual review of content | N/A |
| ABUT-02 | Professional but human tone | manual-only | Copywriting review | N/A |
| ABUT-03 | Skills grouped by context, no progress bars | manual-only | Visual review | N/A |
| RESM-01 | Resume content rendered on-page | smoke | Build succeeds + visual check | N/A |
| RESM-02 | PDF download button above fold | manual-only | Visual review | N/A |
| CNTC-01 | Email, LinkedIn, GitHub links present | smoke | Build + check link targets | N/A |

### Sampling Rate

- **Per task commit:** `npx astro build` (catches TypeScript errors, broken imports, Zod schema errors)
- **Per wave merge:** `npx astro build && npx astro preview` (visual check all pages in browser)
- **Phase gate:** Full build green + visual audit comparing output to shiyunlu.com in split screen

### Wave 0 Gaps

- [ ] Browser DevTools inspection of shiyunlu.com to extract: exact colors, fonts, grid measurements, spacing values, navigation structure, footer structure
- [ ] `public/resume.pdf` -- placeholder PDF (if not already present)
- [ ] Clear font cache after font swap: `rm -rf .astro/fonts/ node_modules/.astro/fonts/`

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro 6 runtime | Yes | 22.x | -- |
| Astro | Framework | Yes | 6.0.8 | -- |
| Tailwind CSS | Styling | Yes | 4.2.2 | -- |
| simplex-noise | Canvas generative art | No (needs install) | 4.0.3 (npm) | Hand-rolled noise (not recommended) |
| pnpm | Package management | Yes | (in use) | npm |
| Browser with DevTools | Design extraction from shiyunlu.com | Yes (human step) | -- | -- |

**Missing dependencies with no fallback:**
- `simplex-noise` package -- must be installed via `pnpm add simplex-noise`
- Browser inspection of shiyunlu.com -- cannot be automated, requires human DevTools session

**Missing dependencies with fallback:**
- `public/resume.pdf` -- use placeholder during development

## Open Questions

1. **Exact font stack from shiyunlu.com**
   - What we know: Phase 1 context documents "Graphik/Wotfard/IBM Plex Mono" as shiyunlu.com's fonts. These were identified in March 2026.
   - What's unclear: Whether the site has changed fonts since. Graphik and Wotfard are commercial fonts that need free alternatives.
   - Recommendation: Use Inter (heading + body) + IBM Plex Mono. Verify by inspecting shiyunlu.com computed styles in DevTools before implementing. If the site now uses different fonts, adapt accordingly.
   - Confidence: MEDIUM

2. **Exact color palette from shiyunlu.com**
   - What we know: Phase 1 context describes "near-black with muted gradient accents." The Netlify archive (old Gatsby version) had `#111d33` dark navy, orange/yellow/green accents, but the current Astro site may be completely different.
   - What's unclear: Exact oklch/hex values for current site.
   - Recommendation: Extract via DevTools. The colors MUST come from the current live site, not the old Netlify version.
   - Confidence: LOW (requires human verification)

3. **Canvas hero visual style**
   - What we know: D-11 specifies "abstract/generative art -- procedural visuals (particles, gradients, geometric shapes) similar to shiyunlu.com." Phase 1 context mentions "canvas hero" on shiyunlu.com.
   - What's unclear: Exact visual style on shiyunlu.com's current canvas. Could be flow field particles, noise gradient, geometric shapes, or something else.
   - Recommendation: Inspect shiyunlu.com's canvas in DevTools (check for `<canvas>` element, view source, identify the visual approach). Then implement a similar approach using simplex-noise. Claude's discretion covers the specific algorithm (D-11 notes in Claude's Discretion).
   - Confidence: MEDIUM (algorithm is Claude's discretion, but should match reference site style)

4. **Navigation grid pattern specifics**
   - What we know: Phase 1 context says "asymmetric grid nav." D-08 says rework to match shiyunlu.com's pattern.
   - What's unclear: Exact grid template, spacing, link arrangement.
   - Recommendation: Extract from DevTools. The nav is likely a CSS grid or flexbox with non-symmetric column widths.
   - Confidence: LOW (requires human verification)

5. **Scope of font weight changes**
   - What we know: Current fonts use weights 400 and 600 (Instrument Sans). New fonts may need different weight ranges.
   - What's unclear: Which weights shiyunlu.com uses for headings, body, and accents.
   - Recommendation: Install fonts with a broad weight range (400-700) initially. Trim after DevTools inspection confirms which weights are actually used.
   - Confidence: MEDIUM

## Project Constraints (from CLAUDE.md)

- **Design process:** D-04 OVERRIDES the normal frontend-design skill routing. The reference site IS the design spec for this phase.
- **Tech stack:** Astro 6 + Tailwind CSS v4 + simplex-noise for canvas. GSAP installed but NOT USED (Phase 5).
- **Content:** Project details are placeholder for v1 -- structure must support easy content replacement.
- **Audience:** Must serve both 30-second recruiter scans and 10-minute engineer deep dives.
- **Token architecture:** All colors via `var(--token-*)` through Tailwind `@theme` bridge -- never use literal colors. Architecture preserved, values change (D-07).
- **Font system:** CSS variables `--font-heading`, `--font-sans`, `--font-code` -- names preserved, underlying fonts change (D-06).
- **Fluid typography:** Use `--token-text-*` custom properties with `[length:]` Tailwind prefix.
- **Dark-first:** `:root` = dark theme. No light theme until Phase 5.
- **View Transitions:** ClientRouter active. Scripts must handle `astro:page-load` and `astro:before-preparation` lifecycle.
- **RTK prefix:** All shell commands must use `rtk` prefix per global CLAUDE.md.

## Sources

### Primary (HIGH confidence)
- Project codebase: `astro.config.mjs`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`, all component files -- existing patterns and token architecture
- Phase 3 CONTEXT.md: `.planning/phases/03-core-pages/03-CONTEXT.md` -- 19 locked design decisions, Claude's discretion areas, deferred items
- Phase 1 CONTEXT.md: `.planning/phases/01-foundation-design-system/01-CONTEXT.md` -- original design direction, reference site analysis (D-04 lists shiyunlu.com fonts/features)
- [Astro Docs: Client-Side Scripts](https://docs.astro.build/en/guides/client-side-scripts/) -- script tag bundling, npm imports in scripts, inline vs hoisted
- [Astro Docs: Fonts API](https://docs.astro.build/en/guides/fonts/) -- Font provider configuration, CSS variable integration, cache management
- [simplex-noise npm](https://www.npmjs.com/package/simplex-noise) -- v4.0.3, API documentation, createNoise2D usage

### Secondary (MEDIUM confidence)
- [Particles in Simplex Noise Flow Field](https://codepen.io/DonKarlssonSan/post/particles-in-simplex-noise-flow-field) -- Flow field particle technique
- [Generative Art for Website Backgrounds](https://blog.semicolonsoftware.de/generative-art-for-website-backgrounds/) -- SVG/canvas generative background patterns
- Phase 1 CONTEXT.md font analysis: "Graphik/Wotfard/IBM Plex Mono" for shiyunlu.com -- documented during initial research but may be outdated
- [Generative Art with Vanilla JS](https://dev.to/andyfitz/generative-art-with-vanilla-js-bn5) -- SVG generative approach, constraint-based randomization

### Tertiary (LOW confidence)
- shiyunlu.com design details -- CANNOT BE VERIFIED programmatically. Site renders client-side. All design claims about the current site require human browser verification. The Netlify archive (shiyun-portfolio.netlify.app) is the OLD Gatsby version with different design.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- simplex-noise is well-established, Astro/Tailwind already proven in Phase 1/2
- Architecture: HIGH -- token update pattern and canvas-in-Astro pattern are straightforward
- Design extraction: LOW -- shiyunlu.com cannot be scraped, requires human browser inspection
- Font recommendations: MEDIUM -- based on Phase 1 context documentation of shiyunlu.com fonts, but site may have changed
- Pitfalls: HIGH -- identified from direct codebase analysis and canvas development experience

**Research date:** 2026-03-25
**Valid until:** 2026-04-10 (14 days -- design extraction from live site adds time pressure; site could change)
