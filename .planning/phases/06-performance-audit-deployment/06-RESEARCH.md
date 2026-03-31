# Phase 6: Performance Audit & Deployment - Research

**Researched:** 2026-03-31
**Domain:** Web performance optimization, Lighthouse auditing, image optimization, GSAP lazy-loading, Cloudflare Pages deployment
**Confidence:** HIGH

## Summary

Phase 6 transforms the portfolio from feature-complete to production-grade. The primary technical challenge is GSAP lazy-loading: the current build ships a 121KB (48KB gzipped) JavaScript bundle containing GSAP + ScrollTrigger + SplitText + simplex-noise on **every page**, including pages that only use simple scroll animations. This is the single biggest performance lever -- deferring this bundle after LCP will dramatically improve initial load metrics across all pages.

The second major workstream is an audit-fix-verify loop: run Lighthouse on all 11 pages (5 top-level + 6 project case studies) in both themes, fix issues discovered, re-audit to confirm 90+ scores. Based on the current build output analysis, the site already has strong foundations -- fonts are self-hosted with `font-display: swap`, images use Astro's `<Image>` component with lazy loading, there are no external CDN requests, and the CSS is a single 42KB file (8KB gzipped). The main performance risks are the eager GSAP bundle and the canvas hero's particle system on mobile.

The third workstream is verifying pending requirements from earlier phases (SEOA-01, SEOA-02, SEOA-06, SEOA-07, CNTC-02) and doing a final deployment verification on jackcutrara.com. Code inspection shows most of these are already implemented -- Phase 6 is the formal verification gate.

**Primary recommendation:** Lazy-load GSAP via dynamic `import()` in animations.ts, reduce mobile canvas particles to ~200, run Lighthouse per-page in both themes, fix issues to 90+ thresholds, verify live deployment.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Optimize first, then decide on tradeoffs -- try lazy-loading GSAP, reducing mobile particles, and other optimizations before accepting any score concession.
- **D-02:** Lazy-load GSAP -- defer GSAP + ScrollTrigger + SplitText until after LCP. Animations kick in slightly later but initial page load feels instant.
- **D-03:** Reduce canvas particle count on mobile -- keep the canvas hero but with fewer particles on smaller screens. Maintains visual identity while being lighter.
- **D-04:** Lighthouse 90+ is the guardrail -- no explicit JS budget in KB. If all pages score 90+ Performance, the bundle size is implicitly acceptable.
- **D-05:** Completely disable animations on prefers-reduced-motion -- all GSAP animations and canvas particles fully off. Content shows statically. Cleanest accessibility story.
- **D-06:** Infrastructure only for images -- ensure ArticleImage and ProjectCard components are configured for WebP/AVIF, srcset, lazy loading, and correct dimensions. No real images to add now.
- **D-07:** Keep current og-default.png -- no new OG image for v1.
- **D-08:** Lighthouse 90+ is sufficient for accessibility depth -- no axe-core or manual screen reader testing.
- **D-09:** Verify both themes independently for color contrast -- run Lighthouse in both dark and light mode to confirm WCAG AA (4.5:1+) compliance.
- **D-10:** Verify and close all 5 pending Phase 2 requirements as part of Phase 6 (SEOA-01, SEOA-02, SEOA-06, SEOA-07, CNTC-02).
- **D-11:** Full deploy verification after all fixes -- push final changes, confirm CI/CD builds, verify live site on jackcutrara.com over HTTPS, spot-check key pages.
- **D-12:** Lighthouse mobile + 3 specific breakpoints -- run Lighthouse in mobile mode on all pages, plus manually verify layout at 375px (phone), 768px (tablet), 1440px (desktop).
- **D-13:** Audit fonts and use font-display: swap -- verify Astro's Fonts API self-hosts correctly, confirm no external font CDN requests, ensure font-display: swap is set.
- **D-14:** Inspect dist/ output -- run a production build, check total JS shipped, verify static pages have zero or minimal JS, confirm GSAP only loads where needed, check asset sizes.

### Claude's Discretion
- Specific Lighthouse optimization techniques beyond what's decided above
- Exact mobile particle count reduction (within "reduced" direction)
- GSAP lazy-loading implementation approach (dynamic import vs script defer)
- Order of audit passes (performance first vs accessibility first)
- Fix priority when multiple issues found
- Font fallback sizing details
- Any additional performance wins discovered during audit

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERF-01 | Mobile-first responsive design tested across breakpoints (mobile, tablet, desktop) | D-12 defines test breakpoints (375px, 768px, 1440px). Lighthouse mobile mode provides automated mobile testing. Manual visual verification needed at each breakpoint. |
| PERF-02 | Sub-2-second Largest Contentful Paint (LCP) on all pages | GSAP lazy-loading (D-02) is the primary lever -- deferring 48KB gzipped JS from initial load. Fonts already use swap. Canvas hero is below the fold on non-home pages. Home page LCP is the hero text (rendered server-side). |
| PERF-03 | Lighthouse 90+ across Performance, Accessibility, Best Practices, SEO categories | Lighthouse CLI available via npx (v13.0.3). Chrome installed at standard Windows path. Build output shows good foundations. GSAP lazy-loading + mobile canvas optimization should achieve Performance 90+. |
| PERF-04 | Optimized images with lazy loading, responsive srcset, and modern formats (WebP/AVIF) | ArticleImage uses Astro `<Image>` component (auto WebP/AVIF, lazy loading). ProjectCard uses `<Image>` for thumbnails. Currently no real images in use (solid-color fallbacks). Infrastructure verification only per D-06. |
| PERF-05 | Zero layout shift (CLS < 0.1) during page load | Fonts use `font-display: swap` with Astro-generated fallback metrics (size-adjust, ascent-override, descent-override). Images have aspect-ratio via CSS. Canvas is full-viewport. Main CLS risk is GSAP SplitText reflow -- needs investigation. |
| SEOA-01 | Unique title tag and meta description per page | Already implemented: each page passes unique `title` and `description` to BaseLayout, which feeds astro-seo. Verified in build output. |
| SEOA-02 | Open Graph tags for link previews | Already implemented: BaseLayout renders og:title, og:type, og:image, og:url, og:description, og:site_name, plus Twitter card tags. Verified in build output. |
| SEOA-06 | Skip-to-content link for screen reader users | Already implemented: SkipToContent.astro renders `<a href="#main-content">` with sr-only + focus styles. Included in BaseLayout. |
| SEOA-07 | Alt text on all images | Infrastructure ready: ArticleImage requires `alt` prop. ProjectCard generates alt from project title. No real images currently in use. Canvas is `aria-hidden="true"`. SVG icons use `aria-hidden="true"` with aria-label on parent links. |
| CNTC-02 | Contact links accessible from every page (footer) | Already implemented: Footer.astro renders GitHub, LinkedIn, and email links on every page via BaseLayout. |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase uses existing tools for auditing and optimization.

### Audit Tools
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Lighthouse CLI | 13.0.3 | Performance, accessibility, SEO, best practices auditing | Google's official audit tool. Available via `npx lighthouse`. Industry standard for web performance measurement. |
| Chrome | installed | Lighthouse rendering engine | Required by Lighthouse. Installed at `C:\Program Files\Google\Chrome\Application\chrome.exe`. |
| Astro Preview | built-in | Local production server for auditing | `pnpm preview` serves the `dist/` folder identically to production. Better than auditing dev server. |

### Existing Stack (no changes)
| Library | Current | Purpose | Phase 6 Impact |
|---------|---------|---------|----------------|
| GSAP | 3.14.2 | Animation | Refactor to dynamic import for lazy-loading |
| Astro | 6.0.8 | Framework | Build + preview commands for auditing |
| Tailwind CSS | 4.2.2 | Styling | No changes needed |
| astro-seo | 1.1.0 | Meta tags | Already configured per-page |

## Architecture Patterns

### Current Build Output Analysis (KEY FINDING)

```
dist/_astro/
  BaseLayout.astro_astro_type_script_index_0_lang.BZrHJzYi.js  — 121,732 bytes (48,260 gzipped)
  ClientRouter.astro_astro_type_script_index_0_lang.DmQZLfuR.js — 15,834 bytes (5,515 gzipped)
  BaseLayout._S0tVNBP.css                                      — 42,371 bytes (8,213 gzipped)
  fonts/ (4 woff2 files)                                       — ~120 KB total

Total JS shipped: ~137 KB raw / ~54 KB gzipped (on every page)
Total CSS: 42 KB raw / 8 KB gzipped (single file, every page)
```

**Critical issue:** The 121KB BaseLayout JS bundle contains GSAP core (~46KB min), ScrollTrigger (~14KB min), SplitText (~12KB min), simplex-noise, animations.ts logic, canvas hero code, theme toggle script, mobile menu script, and header scroll behavior. This all loads eagerly on every page, blocking LCP.

### Pattern 1: GSAP Lazy-Loading via Dynamic Import
**What:** Replace the static `import '../scripts/animations.ts'` in BaseLayout with a dynamic import that fires after the page has rendered.
**When to use:** Exactly this situation -- GSAP animations are non-critical for initial paint. Content is server-rendered HTML.
**Implementation approach:**

```typescript
// src/scripts/animations.ts — refactored to export init function
export async function initAnimations() {
  // Check reduced motion FIRST, before importing GSAP
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Show content in final state without loading GSAP at all
    document.querySelectorAll('[data-animate]').forEach(el => {
      (el as HTMLElement).style.opacity = '1';
    });
    return;
  }

  // Dynamic import — Vite will code-split this into a separate chunk
  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  const { SplitText } = await import('gsap/SplitText');

  gsap.registerPlugin(ScrollTrigger, SplitText);

  // ... rest of animation setup
}
```

```typescript
// In BaseLayout.astro <script> tag or a thin loader script
document.addEventListener('astro:page-load', async () => {
  const { initAnimations } = await import('../scripts/animations.ts');
  initAnimations();
});
```

**Key insight:** With dynamic imports, Vite automatically code-splits GSAP into a separate chunk that only loads when `initAnimations()` is called. On pages where `prefers-reduced-motion` is set, GSAP never loads at all -- saving the full 48KB transfer.

**Caveat:** The canvas hero script in CanvasHero.astro is currently inlined into the page HTML by Astro (verified in build output). It imports `simplex-noise` but NOT GSAP, so it is independent of the GSAP lazy-loading. It will continue to load eagerly on the home page only, which is correct behavior.

### Pattern 2: CSS Visibility for Pre-Animation State
**What:** Elements with `data-animate` need an initial hidden state (opacity: 0) so content doesn't flash before GSAP animates them. This must be set via CSS, not JS, to avoid FOUC.
**Implementation:**

```css
/* In global.css */
[data-animate] {
  opacity: 0;
}

/* Fallback: if JS fails or is disabled, content should still be visible */
@media (prefers-reduced-motion: reduce) {
  [data-animate] {
    opacity: 1 !important;
  }
}
```

**Warning:** This pattern requires careful handling. If GSAP fails to load (network error, Safari import bug), content stays invisible. Add a timeout fallback:

```typescript
// Fallback: show content after 3 seconds even if GSAP fails
setTimeout(() => {
  document.querySelectorAll('[data-animate]').forEach(el => {
    if ((el as HTMLElement).style.opacity === '0' ||
        getComputedStyle(el).opacity === '0') {
      (el as HTMLElement).style.opacity = '1';
    }
  });
}, 3000);
```

### Pattern 3: Mobile Canvas Optimization
**What:** Reduce particle count on mobile to improve frame rate and reduce CPU usage.
**Current:** 400 particles on mobile (< 768px), 1000 on desktop.
**Recommendation:** Reduce mobile to 150-200 particles. The visual effect remains clear but CPU load drops significantly. Also consider reducing frame rate on mobile if needed.

```typescript
const isMobile = window.innerWidth < 768;
const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
const particleCount = isMobile ? 200 : isTablet ? 600 : 1000;
```

### Pattern 4: Lighthouse Audit Workflow
**What:** Systematic per-page audit using Lighthouse CLI against local preview server.
**Workflow:**

```bash
# 1. Build
pnpm build

# 2. Start preview server (background)
pnpm preview &

# 3. Run Lighthouse against each page
npx lighthouse http://localhost:4321/ --output=json --output-path=./lighthouse-home.json --chrome-flags="--headless"
npx lighthouse http://localhost:4321/about/ --output=json --output-path=./lighthouse-about.json --chrome-flags="--headless"
# ... etc for all pages

# 4. Check scores
```

**Mobile vs Desktop:** Lighthouse defaults to mobile simulation (Moto G Power with throttled CPU/network). Add `--preset=desktop` for desktop scores. Per D-12, run mobile mode on all pages.

### Anti-Patterns to Avoid
- **Loading GSAP synchronously in `<head>`:** Blocks rendering. Use dynamic import in `<body>` after page load event.
- **Adding `loading="eager"` to below-fold images:** Astro defaults to `loading="lazy"` which is correct.
- **Using `<img>` tags directly instead of Astro `<Image>`/`<Picture>`:** Loses automatic optimization pipeline.
- **Auditing the dev server:** Dev server includes HMR code, unoptimized assets. Always audit `pnpm preview` or the deployed site.
- **Running Lighthouse only once:** Scores vary by 5-10 points between runs. Run 3 times and take the median, or use `--runs=3` flag.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization | Custom Sharp pipeline | Astro `<Image>` / `<Picture>` components | Built-in: auto WebP/AVIF, srcset, lazy loading, width/height, CLS prevention |
| Font optimization | Manual font-face declarations | Astro 6 Fonts API | Already configured: self-hosts, generates fallback metrics, adds preload links, sets font-display: swap |
| Meta tags | Manual `<meta>` tag management | `astro-seo` component | Already configured: handles title templates, OG tags, Twitter cards, canonical URLs |
| Sitemap | Manual XML generation | `@astrojs/sitemap` | Already configured: auto-generates from all static routes |
| Performance scoring | Custom metrics collection | Lighthouse CLI | Industry standard, measures LCP/CLS/FID/TBT with consistent methodology |
| Code splitting | Manual chunk configuration | Vite dynamic `import()` | Vite automatically code-splits dynamic imports into separate chunks during build |

## Common Pitfalls

### Pitfall 1: SplitText Causing CLS
**What goes wrong:** GSAP SplitText wraps text in `<div>` elements at runtime, which can cause layout shifts if the text reflows into a different number of lines than the original.
**Why it happens:** SplitText operates on rendered text and creates wrapper elements that may have slightly different dimensions.
**How to avoid:** Set explicit `min-height` or use `autoSplit: true` (already configured). The `mask: 'lines'` option in the current code helps contain shifts. Test CLS specifically on pages with split-text animations.
**Warning signs:** CLS > 0.1 on pages with `data-animate="split-text"` elements.

### Pitfall 2: Dynamic Import Causing Flash of Unstyled Content
**What goes wrong:** If animated elements start visible and GSAP hasn't loaded yet, content appears in final position, then jumps to start position when GSAP initializes, then animates to final position.
**Why it happens:** Network latency between page load and GSAP chunk download.
**How to avoid:** Set `opacity: 0` via CSS on `[data-animate]` elements. GSAP's `from()` tweens will set initial state and then animate to visible. Include a JS timeout fallback to reveal content if GSAP fails.
**Warning signs:** Content "jumping" on slow connections.

### Pitfall 3: Lighthouse Score Variance
**What goes wrong:** Lighthouse scores fluctuate 5-10 points between runs, especially on Performance.
**Why it happens:** CPU throttling simulation, network conditions, background processes.
**How to avoid:** Run 3+ times and take median. Close other Chrome windows. Use `--only-categories=performance` for focused testing. On Windows, ensure no heavy background processes.
**Warning signs:** Score of 89 on one run, 94 on another for the same page.

### Pitfall 4: Canvas Hero Blocking Main Thread on Mobile
**What goes wrong:** The requestAnimationFrame loop in CanvasHero draws 400 particles per frame. On low-end mobile devices, this can push Total Blocking Time (TBT) above thresholds.
**Why it happens:** Canvas draw operations run on the main thread. 400 particles with noise calculations, mouse influence, and depth-scaled rendering is CPU-intensive.
**How to avoid:** Reduce mobile particle count to 150-200. Consider using `OffscreenCanvas` for worker-thread rendering if scores are still low (but this adds complexity). The `prefers-reduced-motion` path already completely skips animation.
**Warning signs:** TBT > 200ms on Lighthouse mobile, janky scrolling on real mobile devices.

### Pitfall 5: Font Loading Causing LCP Delay
**What goes wrong:** If fonts block rendering, LCP is delayed until fonts finish loading.
**Why it happens:** Missing or incorrect `font-display` setting.
**How to avoid:** Already mitigated -- Astro 6 Fonts API sets `font-display: swap` and generates fallback font metrics (size-adjust, ascent-override, descent-override, line-gap-override). Verified in build output. No action needed unless Lighthouse flags font-related issues.
**Warning signs:** "Ensure text remains visible during webfont load" Lighthouse audit failing.

### Pitfall 6: Safari Dynamic Import Failures
**What goes wrong:** Dynamic import of ES modules fails for 3-5% of Safari users with "Importing a module script failed" error.
**Why it happens:** Safari has known bugs with dynamic module imports under certain conditions (race conditions, service workers, etc.).
**How to avoid:** Include a fallback that reveals content even if the GSAP dynamic import fails. The timeout fallback (Pattern 2) handles this. Content should always be accessible even without animations.
**Warning signs:** Invisible content on Safari. Monitor browser console for import errors.

### Pitfall 7: Theme-Specific Contrast Failures
**What goes wrong:** Lighthouse passes in dark mode but fails in light mode (or vice versa) due to different contrast ratios.
**Why it happens:** Color token values differ between themes. One theme may have borderline contrast that passes in one direction but fails in the other.
**How to avoid:** Per D-09, run Lighthouse independently in each theme. Check both `text-secondary` on `bg-primary` and `text-muted` on `bg-secondary` in both themes.
**Warning signs:** Accessibility score drops when switching themes.

## Code Examples

### GSAP Dynamic Import Implementation

```typescript
// src/scripts/animations.ts — refactored for lazy loading
let ctx: any = null;

export async function initAnimations() {
  // Check reduced motion FIRST — avoid loading GSAP entirely
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-animate]').forEach(el => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.transform = 'none';
    });
    return;
  }

  // Dynamic imports — Vite code-splits these into separate chunks
  const gsapModule = await import('gsap');
  const gsap = gsapModule.gsap || gsapModule.default;
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  const { SplitText } = await import('gsap/SplitText');

  gsap.registerPlugin(ScrollTrigger, SplitText);

  ctx = gsap.context(() => {
    // Section reveals
    gsap.utils.toArray<HTMLElement>('[data-animate="section"]').forEach((el) => {
      gsap.from(el, {
        opacity: 0, y: 24, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });

    // Stagger items
    gsap.utils.toArray<HTMLElement>('[data-animate-container="stagger"]').forEach((container) => {
      const items = container.querySelectorAll('[data-animate="stagger-item"]');
      if (items.length === 0) return;
      gsap.from(items, {
        opacity: 0, y: 24, duration: 0.6, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: container, start: 'top 85%', once: true },
      });
    });

    // SplitText headings
    gsap.utils.toArray<HTMLElement>('[data-animate="split-text"]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit(self: any) {
          return gsap.from(self.lines, {
            y: '100%', opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out',
          });
        },
      });
    });
  });
}

export function cleanupAnimations() {
  ctx?.revert();
  ctx = null;
}
```

### Lighthouse CLI Command (per-page audit)

```bash
# Build and preview
pnpm build && pnpm preview &

# Audit specific page (mobile, default)
npx lighthouse http://localhost:4321/ \
  --output=json \
  --output-path=./lighthouse-results/home.json \
  --chrome-flags="--headless" \
  --only-categories=performance,accessibility,best-practices,seo

# Audit with desktop preset
npx lighthouse http://localhost:4321/ \
  --output=json \
  --output-path=./lighthouse-results/home-desktop.json \
  --chrome-flags="--headless" \
  --preset=desktop \
  --only-categories=performance,accessibility,best-practices,seo
```

### Astro Picture Component (for future real images)

```astro
---
import { Picture } from 'astro:assets';
import screenshot from '../assets/project-screenshot.png';
---
<Picture
  src={screenshot}
  formats={['avif', 'webp']}
  widths={[400, 800, 1200]}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
  alt="Project screenshot showing the dashboard view"
  class="w-full rounded aspect-video object-cover"
/>
```

### CSS Pre-Animation State

```css
/* Hide animated elements before GSAP loads */
[data-animate],
[data-animate="section"],
[data-animate="stagger-item"],
[data-animate="split-text"] {
  opacity: 0;
}

/* Ensure content visible if prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  [data-animate],
  [data-animate="section"],
  [data-animate="stagger-item"],
  [data-animate="split-text"] {
    opacity: 1 !important;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Synchronous GSAP `<script>` in head | Dynamic `import()` after page load | Standard since ES2020 / Vite 3+ | GSAP code-split into separate chunk, loaded after LCP |
| `loading="lazy"` manual attribute | Astro `<Image>` auto lazy loading | Astro 3.0+ (2023) | Automatic: no manual attribute needed |
| Google Fonts CDN `<link>` | Astro 6 Fonts API self-hosting | Astro 6 (March 2026) | Eliminates third-party requests, auto fallback metrics |
| Custom `@font-face` with manual metrics | Astro auto-generated fallback metrics | Astro 6 (March 2026) | size-adjust, ascent-override generated automatically for CLS prevention |
| Manual OG meta tags | astro-seo component | astro-seo stable | Single component handles all meta, OG, Twitter tags |

## Pending Requirements Verification (Pre-Audit)

Based on code inspection, here is the current status of pending requirements:

| Requirement | Code Evidence | Status |
|-------------|--------------|--------|
| SEOA-01 (unique title/description per page) | Every page passes unique `title` and `description` props to BaseLayout. Home: `""` (uses titleDefault). About: `"About"`. Projects: `"Projects"`. Resume: `"Resume"`. Contact: `"Contact"`. Each has unique description. | LIKELY COMPLETE -- verify in Lighthouse |
| SEOA-02 (OG tags) | BaseLayout renders full OG tags via astro-seo: og:title, og:type, og:image, og:url, og:description, og:site_name, plus Twitter card. Verified in build output HTML. | LIKELY COMPLETE -- verify with OG preview tool |
| SEOA-06 (skip-to-content) | SkipToContent.astro renders `<a href="#main-content" class="sr-only focus:not-sr-only ...">Skip to content</a>`. Included in BaseLayout. Target `#main-content` exists on `<main>` element. | LIKELY COMPLETE -- verify with Tab key |
| SEOA-07 (alt text on images) | ArticleImage requires `alt` prop. ProjectCard generates alt from `project.data.title`. Canvas uses `aria-hidden="true"`. All SVG icons use `aria-hidden="true"`. No `<img>` tags without alt found. | LIKELY COMPLETE -- no real images yet |
| CNTC-02 (contact links in footer) | Footer.astro renders GitHub, LinkedIn, email links with proper aria-labels. Footer is in BaseLayout, present on all pages. | LIKELY COMPLETE -- verify footer renders on all pages |

## Open Questions

1. **Canvas hero LCP interaction**
   - What we know: The canvas is full-viewport on the home page. The hero text ("Jack Cutrara") is the LCP element. It renders server-side as HTML, so it should paint before canvas JS executes.
   - What's unclear: Whether the canvas initialization (simplex-noise import, particle setup) delays main thread enough to affect LCP measurement.
   - Recommendation: Run Lighthouse on home page first. If LCP is borderline, consider adding `fetchpriority="high"` to hero text or deferring canvas init with `requestIdleCallback`.

2. **Build output CSS warnings**
   - What we know: Build produces 3 CSS optimization warnings about `var(--token-*)` wildcards: `Unexpected token Delim('*')`.
   - What's unclear: Whether these warnings affect the compiled CSS output or just indicate unused wildcard utilities generated by Tailwind.
   - Recommendation: Inspect the relevant CSS rules in the built file. These are likely harmless Tailwind-generated utility patterns that are never used and should be pruned by the CSS optimizer.

3. **Vite code-splitting behavior with GSAP**
   - What we know: Vite should automatically code-split dynamic imports into separate chunks.
   - What's unclear: Whether Vite will create one chunk for GSAP core + plugins or separate chunks per import. Need to verify post-refactor.
   - Recommendation: After implementing lazy-loading, rebuild and inspect `dist/_astro/` to confirm GSAP is in a separate chunk, not bundled into the main file.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build/preview | Yes | 22.x LTS | -- |
| Chrome | Lighthouse CLI | Yes | Installed at `C:\Program Files\Google\Chrome\Application\chrome.exe` | -- |
| Lighthouse CLI | Performance auditing | Yes (via npx) | 13.0.3 | Chrome DevTools Lighthouse tab |
| pnpm | Package management | Yes | (project dependency) | -- |
| Cloudflare Pages | Deployment | Yes | Already configured | -- |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | none -- vitest.config.* not found. package.json has `"test": "vitest run"` |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

### Phase Requirements to Test Map

Most Phase 6 requirements are audit-based (run Lighthouse, verify scores) rather than unit-testable. The validation approach is different from previous phases:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-01 | Responsive design at 375/768/1440px | manual | Visual inspection at breakpoints | N/A |
| PERF-02 | LCP < 2s on all pages | lighthouse | `npx lighthouse URL --only-categories=performance --chrome-flags="--headless"` | N/A |
| PERF-03 | Lighthouse 90+ all categories | lighthouse | `npx lighthouse URL --chrome-flags="--headless"` | N/A |
| PERF-04 | Optimized image infrastructure | unit | `pnpm build` (build succeeds with Image components) | N/A |
| PERF-05 | CLS < 0.1 | lighthouse | `npx lighthouse URL --only-categories=performance --chrome-flags="--headless"` | N/A |
| SEOA-01 | Unique title/description per page | build | `pnpm build` + grep dist HTML for unique titles | N/A |
| SEOA-02 | OG tags present | build | `pnpm build` + grep dist HTML for og: tags | N/A |
| SEOA-06 | Skip-to-content link | manual | Tab key test on live site | N/A |
| SEOA-07 | Alt text on images | lighthouse | Lighthouse accessibility audit catches missing alt | N/A |
| CNTC-02 | Footer contact links on all pages | build | Grep all dist HTML files for footer contact links | N/A |

### Sampling Rate
- **Per task commit:** `pnpm build` (ensures no build errors)
- **Per wave merge:** `pnpm build && pnpm preview` + Lighthouse on key pages
- **Phase gate:** Full Lighthouse audit on all 11 pages in both themes

### Wave 0 Gaps
- [ ] No vitest.config.* file exists -- framework installed but not configured
- [ ] No project-level test files exist

Note: For this phase, Lighthouse audits serve as the primary validation mechanism rather than unit tests. The build itself (`pnpm build`) is the most important automated check -- it validates content collections, TypeScript types, image processing, and static page generation.

## Project Constraints (from CLAUDE.md)

- **RTK prefix:** All bash commands must use `rtk` prefix per CLAUDE.md
- **Design process:** All visual/UI/UX decisions routed through frontend-design skill -- but Phase 6 involves no visual changes, only performance optimization
- **Tech stack:** Astro 6 + Tailwind CSS v4 + GSAP + Cloudflare Pages (locked)
- **Content:** Project details are placeholder for v1 -- image optimization is infrastructure-only (D-06)
- **GSD workflow:** Must use GSD commands for any repo edits

## Sources

### Primary (HIGH confidence)
- Build output analysis (`dist/_astro/` inspection) -- actual asset sizes, script loading patterns, font configuration
- Source code inspection (`BaseLayout.astro`, `animations.ts`, `CanvasHero.astro`, `ArticleImage.astro`, `ProjectCard.astro`, `global.css`) -- current implementation details
- [Astro Docs: Images](https://docs.astro.build/en/guides/images/) -- Image/Picture component API, lazy loading, srcset
- [Astro Docs: Fonts](https://docs.astro.build/en/guides/fonts/) -- Fonts API, font-display, fallback metrics
- [Lighthouse CLI npm](https://www.npmjs.com/package/lighthouse) -- CLI usage, flags, output formats
- [Cloudflare Pages Custom Domains](https://developers.cloudflare.com/pages/configuration/custom-domains/) -- Domain configuration, HTTPS

### Secondary (MEDIUM confidence)
- [GSAP + Astro Forum](https://gsap.com/community/forums/topic/39684-gsap-astro/) -- Integration patterns
- [Astro Tips: How to add GSAP](https://astro-tips.dev/tips/how-to-add-gsap/) -- Import patterns
- [Lighthouse Headless Chrome docs](https://github.com/GoogleChrome/lighthouse/blob/main/docs/headless-chrome.md) -- Windows Chrome path, headless flags
- [Lighthouse CI Configuration](https://googlechrome.github.io/lighthouse-ci/docs/configuration.html) -- staticDistDir option

### Tertiary (LOW confidence)
- [Astro dynamic import issue #14775](https://github.com/withastro/astro/issues/14775) -- Safari dynamic import failures (3-5% affected)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, existing tools verified
- Architecture: HIGH -- GSAP lazy-loading pattern well-established with Vite dynamic imports; build output inspected directly
- Pitfalls: HIGH -- based on actual code inspection and known GSAP/Astro interaction patterns
- Pending requirements: HIGH -- verified by reading actual source code and build output

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable stack, no moving targets)
