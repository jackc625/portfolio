# Phase 5: Dark Mode, Animations & Polish - Research

**Researched:** 2026-03-30
**Domain:** Dark/light theming, GSAP scroll animations (ScrollTrigger + SplitText), Astro View Transitions, print stylesheets, JSON-LD structured data
**Confidence:** HIGH

## Summary

Phase 5 transforms a functional portfolio into a premium, polished experience through six workstreams: (1) dark/light mode theming with OS detection and manual toggle, (2) GSAP ScrollTrigger-based scroll-reveal animations, (3) GSAP SplitText line-by-line heading reveals, (4) hover micro-interactions, (5) resume print stylesheet, and (6) JSON-LD structured data.

The codebase is well-prepared for all six workstreams. The token architecture in `global.css` was designed from Phase 1 with theme switching in mind -- light theme values are commented out at lines 52-69, and all Tailwind utilities reference `var(--token-*)` through the `@theme` bridge, meaning theme switching will propagate automatically. GSAP 3.14.2 is installed with ScrollTrigger and SplitText available (both now free after Webflow acquisition). The CanvasHero already demonstrates the correct View Transitions lifecycle pattern (`astro:page-load` / `astro:before-preparation`). ClientRouter is already configured in BaseLayout.

**Primary recommendation:** Implement in dependency order -- theme system first (all subsequent work must look correct in both themes), then GSAP animation infrastructure, then page-specific animations, then print/structured data. Use `gsap.context()` for all animation scoping with cleanup on `astro:before-preparation`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Theme toggle lives in the header nav bar -- visible on all pages
- **D-02:** Sun/moon icon button as the toggle form
- **D-03:** Smooth morph animation on the icon when toggling -- sun morphs into moon with rotation/scale transition
- **D-04:** Smooth cross-fade (~200-400ms) on all page colors when switching themes
- **D-05:** Always visible in mobile header -- toggle stays in the header bar alongside the hamburger, not hidden inside the mobile menu
- **D-06:** OS preference detection on first load (prefers-color-scheme), manual toggle persists choice to localStorage, no flash of wrong theme on page load (inline script in head)
- **D-07:** Subtle & elegant animation intensity -- gentle fade-ins and slight slide-ups
- **D-08:** All page sections get scroll-triggered reveal animations using GSAP ScrollTrigger
- **D-09:** Staggered reveal for project cards -- cards appear one by one with ~100ms delays
- **D-10:** Enhanced but restrained hover micro-interactions -- subtle shadow lifts, gentle underline animations, slight icon shifts
- **D-11:** Slide-up per-line text animation on hero/display headings only using GSAP SplitText
- **D-12:** Animations replay every visit -- scroll-triggered animations run each time a page is loaded/navigated to
- **D-13:** All animations respect prefers-reduced-motion
- **D-14:** Smooth crossfade between pages (~200-300ms) using Astro View Transitions API
- **D-15:** Scroll-triggered animations replay on navigation
- **D-16:** Warm off-white / cream background feel for light theme
- **D-17:** Deeper / richer blue accent in light mode -- more saturated than dark theme's muted blue
- **D-18:** Canvas hero adapts colors for light mode
- **D-19:** Both themes independently pass WCAG AA contrast ratios (4.5:1+)
- **D-20:** Resume page only gets @media print treatment
- **D-21:** Clean version of on-screen layout -- strip nav/footer/backgrounds but keep structure
- **D-22:** Person schema on home/about pages
- **D-23:** CreativeWork schema on each project/case study page
- **D-24:** Subtle enhancements to existing particle flow field -- mouse influence, parallax depth, parameter tuning

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

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DSGN-02 | Dark/light mode with OS preference detection and manual toggle | Theme system architecture: inline head script for no-flash, data-theme attribute on html, localStorage persistence, CSS custom property overrides |
| DSGN-03 | Theme preference persisted in localStorage with no flash of wrong theme | Inline script pattern in `<head>` before CSS renders, localStorage cascade (stored > OS > dark default) |
| DSGN-04 | Both themes independently pass WCAG AA contrast ratios (4.5:1+) | OKLCH color values from UI-SPEC calibrated for AA; verification with contrast checker tools recommended |
| ANIM-01 | Subtle scroll-triggered reveal animations on page sections | GSAP ScrollTrigger with `data-animate="section"` markers, gsap.context() for lifecycle management |
| ANIM-02 | Smooth page transitions between routes | Astro View Transitions API via ClientRouter (already configured), CSS `::view-transition-old/new` animations |
| ANIM-03 | Hover states and micro-interactions on interactive elements | CSS transitions for card shadow lift, nav underline animation, footer icon lift, theme toggle rotation |
| ANIM-04 | Animations respect prefers-reduced-motion and do not degrade performance | Check `window.matchMedia('(prefers-reduced-motion: reduce)')` before GSAP init; show content in final state |
| RESM-03 | Print-friendly @media print stylesheet that produces clean output | `@media print` rules: hide nav/footer, force black-on-white, page-break control, show link URLs |
| SEOA-03 | JSON-LD structured data (Person + CreativeWork schemas) | `<script type="application/ld+json">` in head per page, auto-generated from content collection data |
</phase_requirements>

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GSAP | 3.14.2 | ScrollTrigger, SplitText, animation engine | Industry standard for scroll-driven animations. All plugins now free (Webflow acquisition April 2025). Already installed in project. |
| Astro View Transitions | built-in (v6) | Page-to-page crossfade transitions | Built into Astro via ClientRouter. Already configured in BaseLayout.astro. Zero additional JS. |
| Astro Content Collections | built-in (v6) | Typed project data for JSON-LD generation | Already configured with Zod schemas. Project data (title, techStack, githubUrl) drives CreativeWork schema generation. |

### Supporting (no new dependencies)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| GSAP ScrollTrigger | 3.14.2 (bundled) | Scroll-triggered reveal animations | Import from `gsap/ScrollTrigger`. Register with `gsap.registerPlugin()`. |
| GSAP SplitText | 3.14.2 (bundled) | Line-by-line text reveal on display headings | Import from `gsap/SplitText`. Use `SplitText.create()` static method with `autoSplit: true` and `onSplit` callback. |

### No New Dependencies Required

This phase requires zero new npm packages. Everything needed is either built into Astro or bundled with the already-installed `gsap` package. The GSAP package at 3.14.2 includes ScrollTrigger and SplitText in `node_modules/gsap/dist/` -- confirmed via filesystem inspection.

**Import paths (verified):**
```typescript
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
```

## Architecture Patterns

### Recommended File Structure for Phase 5 Changes

```
src/
├── components/
│   ├── Header.astro          # MODIFIED: add ThemeToggle
│   ├── ThemeToggle.astro     # NEW: sun/moon toggle button
│   ├── JsonLd.astro          # NEW: JSON-LD script renderer
│   ├── CanvasHero.astro      # MODIFIED: mouse influence, depth, theme-aware
│   └── ...existing...
├── layouts/
│   └── BaseLayout.astro      # MODIFIED: inline theme script, view transition CSS, JsonLd support
├── pages/
│   ├── index.astro           # MODIFIED: add data-animate attributes
│   ├── about.astro           # MODIFIED: add data-animate attributes, JsonLd Person
│   ├── projects.astro        # MODIFIED: add data-animate attributes
│   ├── projects/[id].astro   # MODIFIED: add data-animate attributes, JsonLd CreativeWork
│   ├── resume.astro          # MODIFIED: add data-animate attributes
│   └── contact.astro         # MODIFIED: add data-animate attributes
├── scripts/
│   └── animations.ts         # NEW: centralized GSAP animation initialization + cleanup
└── styles/
    └── global.css            # MODIFIED: light theme tokens, view transitions CSS, print styles
```

### Pattern 1: Theme System (No-Flash Architecture)

**What:** Inline script in `<head>` that sets `data-theme` attribute before CSS renders, preventing flash of wrong theme.

**When to use:** Always -- this is the foundation for all theming.

**Implementation:**
```html
<!-- In BaseLayout.astro <head>, BEFORE any <link> or <style> tags -->
<script is:inline>
  (function() {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || (!stored && window.matchMedia('(prefers-color-scheme: light)').matches)) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    // Dark is default (no attribute needed) per token architecture
  })();
</script>
```

**CSS token override:**
```css
[data-theme="light"] {
  --token-bg-primary: oklch(0.975 0.008 85);
  --token-bg-secondary: oklch(0.94 0.01 85);
  --token-text-primary: oklch(0.13 0.01 270);
  --token-text-secondary: oklch(0.38 0.015 270);
  --token-text-muted: oklch(0.52 0.01 270);
  --token-accent: oklch(0.48 0.18 250);
  --token-accent-hover: oklch(0.40 0.20 250);
  --token-border: oklch(0.88 0.006 85);
  --token-border-hover: oklch(0.78 0.008 85);
  --token-destructive: oklch(0.55 0.22 25);
  --token-success: oklch(0.50 0.15 155);
  --token-warning: oklch(0.55 0.15 85);
}
```

**Why this pattern:** The `@theme` bridge in `global.css` already maps all `var(--token-*)` to Tailwind utilities. Overriding the tokens on `[data-theme="light"]` automatically propagates to every component using `bg-bg-primary`, `text-text-primary`, etc. Zero component changes needed for color switching.

### Pattern 2: GSAP + View Transitions Lifecycle (gsap.context)

**What:** Use `gsap.context()` to scope all animations, with cleanup on `astro:before-preparation` and re-init on `astro:page-load`.

**When to use:** Every page that has GSAP animations.

**Critical insight from GSAP forum (Rodrigo, GSAP admin):** Use `astro:before-preparation` for cleanup (not `astro:after-swap`), and `astro:page-load` for initialization. This matches the existing CanvasHero pattern.

**Implementation:**
```typescript
// src/scripts/animations.ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

let ctx: gsap.Context | null = null;

function initAnimations() {
  // Check reduced motion first
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set('[data-animate]', { opacity: 1, y: 0 });
    return;
  }

  ctx = gsap.context(() => {
    // Section reveals
    gsap.utils.toArray<HTMLElement>('[data-animate="section"]').forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 24,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      });
    });

    // Stagger items
    gsap.utils.toArray<HTMLElement>('[data-animate-container="stagger"]').forEach((container) => {
      const items = container.querySelectorAll('[data-animate="stagger-item"]');
      gsap.from(items, {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: container,
          start: 'top 85%',
          once: true,
        },
      });
    });

    // SplitText display headings
    gsap.utils.toArray<HTMLElement>('[data-animate="split-text"]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            y: '100%',
            opacity: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power2.out',
          });
        },
      });
    });
  });
}

function cleanupAnimations() {
  ctx?.revert();
  ctx = null;
}

document.addEventListener('astro:page-load', initAnimations);
document.addEventListener('astro:before-preparation', cleanupAnimations);
```

### Pattern 3: Theme Toggle Component

**What:** Astro server component with client-side script for toggling `data-theme` attribute and persisting to localStorage.

**Key constraints:**
- Must be a `<button>` with dynamic `aria-label`
- Must be 40x40px touch target matching hamburger dimensions
- Desktop: inside nav `<ul>` as last `<li>`
- Mobile: in header bar between logo and hamburger (grid-cols-[1fr_auto_auto])
- Icon morph: CSS opacity crossfade + rotation on two overlapping SVGs

**Theme transition CSS:**
```css
/* Smooth color transition when theme toggles */
html:not([data-no-transition]) *,
html:not([data-no-transition]) *::before,
html:not([data-no-transition]) *::after {
  transition: background-color 300ms ease, color 300ms ease,
              border-color 300ms ease, box-shadow 300ms ease;
}

/* Disable transitions during page load to prevent flash */
@media (prefers-reduced-motion: reduce) {
  html *,
  html *::before,
  html *::after {
    transition-duration: 0ms !important;
  }
}
```

**Important caveat:** The broad `*` transition rule must be carefully managed. It should only be active during theme toggles, not during normal page interactions. One approach: add a transient class to `<html>` during toggle, remove after 300ms.

### Pattern 4: Canvas Hero Theme Awareness

**What:** CanvasHero reads accent and background colors from computed CSS at init time. On theme toggle, the canvas must reinitialize to pick up new colors.

**Implementation approach:**
1. Canvas already reads `--token-accent` via computed style
2. Trail color (`rgba(10, 10, 14, 0.03)`) must change for light mode
3. On theme toggle, dispatch a custom event or use MutationObserver on `data-theme` attribute
4. Canvas cleanup + reinit picks up new computed colors

**Light mode trail color:** `rgba(246, 243, 235, 0.03)` (warm cream equivalent)

### Pattern 5: Data Attribute Convention for Animations

**What:** All animatable elements are marked with `data-animate` attributes. This keeps animation concerns separate from structure.

| Attribute | Value | Applied To |
|-----------|-------|------------|
| `data-animate` | `"section"` | Every `<section>` element on every page |
| `data-animate` | `"stagger-item"` | Each project card, skill group, contact channel |
| `data-animate` | `"split-text"` | Display-sized headings (page titles, hero text) |
| `data-animate-container` | `"stagger"` | Parent grid/container of stagger items |

**Why data attributes over classes:** Separates animation concerns from styling. GSAP selectors target `[data-animate="section"]` while Tailwind classes handle layout. No collision. Clean cleanup via `gsap.context()`.

### Anti-Patterns to Avoid

- **Importing GSAP per-component:** Creates multiple registrations and duplicate listeners. Use a single centralized `animations.ts` script imported once.
- **Using `astro:after-swap` for cleanup:** `astro:before-preparation` is the correct event per GSAP admin guidance -- cleanup should happen BEFORE the DOM swap, not after.
- **Animating with CSS `@keyframes` for scroll-triggered content:** CSS has no scroll-trigger equivalent. Use GSAP ScrollTrigger. Reserve CSS animations for always-running effects (pulse dot, hover transitions).
- **Setting initial `opacity: 0` in CSS for animated elements:** If GSAP fails to load, content is permanently hidden. Set initial state via GSAP (`gsap.set()`) or use `autoAlpha` which handles visibility.
- **Using `new SplitText()` instead of `SplitText.create()`:** The `create()` static method is the modern API that supports `autoSplit` and `onSplit` callback. Constructor still works but misses responsive re-splitting.
- **Broad `transition: all` on theme toggle:** Transitions will fire on every property change including layout shifts. Be specific: `background-color`, `color`, `border-color`, `box-shadow` only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll-triggered animations | IntersectionObserver + custom animation state machine | GSAP ScrollTrigger | Handles edge cases: fast scrolling, resize, dynamic content, cleanup. Battle-tested. |
| Text splitting for line reveals | Manual DOM manipulation to wrap lines | GSAP SplitText with `autoSplit: true` | Font loading, resize, emoji handling, accessibility (aria-label), nested elements -- all solved. |
| Theme persistence + no-flash | Custom service worker or cookie-based theme | Inline `<script>` in `<head>` + localStorage | The inline script pattern is universally accepted as the standard approach. Simple, reliable, works with static sites. |
| Color contrast verification | Manual OKLCH math | OddContrast or Atmos contrast checker | OKLCH perceptual lightness makes contrast somewhat predictable but tool verification catches edge cases. |
| Page transitions | Custom DOM diffing or Turbolinks | Astro View Transitions (ClientRouter) | Already configured. Zero-JS implementation using browser-native API. |
| Structured data validation | Manual JSON-LD review | Google Rich Results Test | Catches schema errors, validates all required fields, shows preview of search appearance. |

**Key insight:** This phase has zero new npm dependencies because GSAP is already installed with all needed plugins, View Transitions are built into Astro, and print/structured data are pure CSS/HTML patterns. The entire phase is about using what's already available.

## Common Pitfalls

### Pitfall 1: Flash of Wrong Theme (FOWT)

**What goes wrong:** User sees dark theme flash before light theme applies (or vice versa), creating a jarring experience.
**Why it happens:** Theme detection script runs after CSS renders, or script is `defer`/`async` instead of inline.
**How to avoid:** Place theme detection as an inline `<script>` in `<head>` BEFORE any `<link>` or `<style>` tags. Must not use `is:inline` in Astro if it defers -- verify the script runs synchronously. In Astro, `<script is:inline>` outputs the script without bundling, which is what we need.
**Warning signs:** Flicker visible on page refresh, especially noticeable on slow connections.

### Pitfall 2: GSAP ScrollTrigger Breaks on Second Navigation

**What goes wrong:** ScrollTrigger animations work on first page load but break on subsequent navigations via View Transitions.
**Why it happens:** ScrollTrigger instances from the previous page are not cleaned up before the DOM swap. Old triggers reference stale DOM elements.
**How to avoid:** Use `gsap.context()` and call `ctx.revert()` on `astro:before-preparation`. This kills all ScrollTrigger instances, reverts SplitText, and cancels all tweens within the context.
**Warning signs:** Animations don't play on second visit to a page, or multiple animation instances stack.

### Pitfall 3: SplitText Breaks on Font Load

**What goes wrong:** Text is split into lines before web fonts load. When fonts load, line breaks change but split wrapper elements don't update.
**Why it happens:** SplitText measures line positions at creation time. Font-swap changes text metrics.
**How to avoid:** Use `SplitText.create()` with `autoSplit: true`. This uses a `loadingdone` event on `document.fonts` and a `ResizeObserver` to automatically re-split when fonts load or container resizes.
**Warning signs:** Partially visible text, words cut off at wrong positions, especially on slower connections where fonts load late.

### Pitfall 4: Theme Transition CSS Causes Layout Thrash

**What goes wrong:** The `transition: background-color 300ms` applied to all elements causes jank during theme toggle on lower-powered devices.
**Why it happens:** Transitioning colors on hundreds of DOM elements simultaneously triggers massive paint operations.
**How to avoid:** Apply the transition rule only during the toggle action. Add a class like `theme-transitioning` to `<html>`, apply transitions, toggle theme, then remove the class after 300ms. Alternatively, use `will-change: background-color` judiciously on key elements only.
**Warning signs:** Dropped frames during theme toggle, noticeable on mobile Safari.

### Pitfall 5: Canvas Hero Doesn't Adapt to Theme Change

**What goes wrong:** Canvas continues showing dark-theme colors after switching to light mode (or vice versa).
**Why it happens:** Canvas reads accent/background colors at initialization time. Theme change updates CSS tokens but canvas doesn't re-read them.
**How to avoid:** On theme toggle, call the canvas cleanup function and reinitialize. The existing View Transitions lifecycle pattern already supports this -- emit a reinit signal from the toggle handler.
**Warning signs:** Dark particle trails on cream background, or light trails on dark background.

### Pitfall 6: Print Stylesheet Inherits Theme Colors

**What goes wrong:** Printing the resume in dark mode produces light text on dark background (unreadable when printed).
**Why it happens:** `@media print` rules don't automatically override theme tokens.
**How to avoid:** In print styles, explicitly override all color tokens to black-on-white values using high-specificity rules that beat both `:root` and `[data-theme="light"]`.
**Warning signs:** Print preview shows theme colors instead of black and white.

### Pitfall 7: Animated Content Invisible if GSAP Fails

**What goes wrong:** Content marked with `data-animate` starts at `opacity: 0` (set by GSAP) and stays invisible if the GSAP script errors out.
**Why it happens:** GSAP sets initial state but never runs the animation to reveal content.
**How to avoid:** Do NOT set `opacity: 0` in CSS. Let GSAP set initial state via `gsap.from()` or `gsap.set()` at runtime. If GSAP never runs, content appears normally. Additionally, add a CSS fallback: if no JS, content shows.
**Warning signs:** Blank sections on page when JavaScript is disabled or GSAP CDN fails.

## Code Examples

### Theme Detection Inline Script (No-Flash)
```html
<!-- BaseLayout.astro <head> - MUST be before CSS -->
<script is:inline>
  (function() {
    var stored = localStorage.getItem('theme');
    if (stored === 'light' || (!stored && window.matchMedia('(prefers-color-scheme: light)').matches)) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();
</script>
```
Source: Established best practice for static sites, verified across multiple sources.

### Theme Toggle Handler
```typescript
// Inside ThemeToggle.astro <script>
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'light' ? null : 'light';

  // Add transition class
  html.classList.add('theme-transitioning');

  if (next) {
    html.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  } else {
    html.removeAttribute('data-theme');
    localStorage.setItem('theme', 'dark');
  }

  // Update aria-label
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.setAttribute('aria-label', next ? 'Switch to dark mode' : 'Switch to light mode');
  }

  // Remove transition class after animation completes
  setTimeout(() => html.classList.remove('theme-transitioning'), 350);
}
```

### View Transition CSS
```css
/* Crossfade page transition */
::view-transition-old(root) {
  animation: vt-fade-out 200ms ease-in forwards;
}
::view-transition-new(root) {
  animation: vt-fade-in 200ms ease-out forwards;
}
@keyframes vt-fade-out {
  to { opacity: 0; }
}
@keyframes vt-fade-in {
  from { opacity: 0; }
}

/* Reduced motion: instant swap */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
}
```
Source: Astro View Transitions documentation.

### GSAP SplitText with autoSplit
```typescript
// SplitText.create() with autoSplit handles font loading and resize automatically
SplitText.create(element, {
  type: 'lines',
  mask: 'lines',        // Wraps each line in a clip container for reveal effect
  autoSplit: true,       // Re-splits on font load and resize
  aria: 'auto',          // Built-in screen reader support
  onSplit(self) {
    // Return the animation so SplitText can manage it during re-splits
    return gsap.from(self.lines, {
      y: '100%',
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: 'power2.out',
    });
  },
});
```
Source: GSAP SplitText docs (gsap.com/docs/v3/Plugins/SplitText), verified in installed module.

### Print Stylesheet Core Rules
```css
@media print {
  /* Hide non-content elements */
  header, footer, #mobile-menu, .skip-to-content,
  [data-no-print] {
    display: none !important;
  }

  /* Force black on white */
  :root, [data-theme="light"] {
    --token-bg-primary: white;
    --token-bg-secondary: white;
    --token-text-primary: black;
    --token-text-secondary: #333;
    --token-text-muted: #666;
    --token-accent: #0066cc;
    --token-border: #ccc;
  }

  body {
    font-size: 11pt;
    line-height: 1.4;
    color: black;
    background: white;
  }

  /* Page break control */
  h2, h3 { break-after: avoid; }
  section { break-inside: avoid; }

  /* Show link URLs */
  a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 9pt;
    color: #666;
  }
}
```

### JSON-LD Person Schema
```astro
---
// JsonLd.astro
interface Props {
  schema: Record<string, unknown>;
}
const { schema } = Astro.props;
---
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

Usage on about page:
```astro
<JsonLd schema={{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Jack Cutrara",
  "jobTitle": "Software Engineer",
  "url": "https://jackcutrara.com",
  "sameAs": [
    "https://github.com/jackc625",
    "https://linkedin.com/in/jackcutrara"
  ]
}} />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `new SplitText()` constructor | `SplitText.create()` static method with `autoSplit` + `onSplit` | GSAP 3.13.0+ | Handles font loading, resize, and animation state automatically |
| Manual SplitText resize handling | `autoSplit: true` with `ResizeObserver` + `document.fonts` | GSAP 3.13.0+ | No manual revert/re-split code needed |
| SplitText paid plugin | SplitText free (included in gsap package) | April 2025 (Webflow acquisition) | All premium plugins now free -- no license concerns |
| Custom theme flash prevention | Inline `<head>` script pattern | Established ~2020+ | Universal standard for static sites |
| CSS `page-break-*` properties | `break-before`, `break-after`, `break-inside` | CSS Fragmentation spec | Modern properties, but old aliases still work and have broader support |
| View Transitions polyfill | Native browser API (85%+ support) | 2024-2025 | Astro's ClientRouter provides fallback for unsupported browsers |

**Deprecated/outdated:**
- `@astrojs/tailwind` integration: Use `@tailwindcss/vite` instead (already done in this project)
- `SplitText` via separate package or CDN: Now bundled with `gsap` npm package
- `ViewTransitions` component name: Renamed to `ClientRouter` in Astro (already using correct name)
- `page-break-before/after/inside`: Still works but `break-before/after/inside` is the modern equivalent

## Open Questions

1. **Light theme OKLCH contrast verification**
   - What we know: UI-SPEC provides calibrated OKLCH values targeting AA compliance. Lightness values are set to achieve theoretical 4.5:1+ ratios.
   - What's unclear: Actual rendered contrast ratios depend on browser OKLCH implementation. Some browsers may round differently.
   - Recommendation: After implementing light theme, verify every text-on-background combination with OddContrast (oddcontrast.com) or browser DevTools contrast checker. Adjust if any pair falls below 4.5:1.

2. **Theme transition performance on mobile**
   - What we know: Transitioning colors on all `*` elements simultaneously could cause jank.
   - What's unclear: Actual performance impact on target mobile devices.
   - Recommendation: Use the `theme-transitioning` class approach (add class, toggle, remove after 300ms) rather than always-on transitions. Test on mobile Safari/Chrome.

3. **GSAP bundle size impact**
   - What we know: GSAP core + ScrollTrigger + SplitText is significant (~80KB minified).
   - What's unclear: Impact on Astro's build size since these are client-side scripts.
   - Recommendation: GSAP loads as a client-side module. Astro's island architecture means it only loads on pages that need it. For a portfolio targeting impressiveness, the tradeoff is acceptable.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (installed as devDependency) |
| Config file | none -- see Wave 0 |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DSGN-02 | Theme toggle sets data-theme attribute and respects OS preference | manual (DOM interaction) | Manual: toggle in browser, verify attribute | N/A |
| DSGN-03 | Theme persists in localStorage, no FOWT | manual (visual) | Manual: set theme, reload, verify no flash | N/A |
| DSGN-04 | Both themes pass WCAG AA | manual (tool) | Manual: OddContrast / DevTools contrast check | N/A |
| ANIM-01 | Scroll-triggered reveals on sections | manual (visual) | Manual: scroll down, observe animations | N/A |
| ANIM-02 | Smooth page transitions | manual (visual) | Manual: click nav links, observe crossfade | N/A |
| ANIM-03 | Hover micro-interactions on interactive elements | manual (visual) | Manual: hover cards/links/toggle | N/A |
| ANIM-04 | Animations respect prefers-reduced-motion | manual | Manual: enable reduced-motion in OS, reload | N/A |
| RESM-03 | Resume prints cleanly | manual | Manual: Ctrl+P on resume page, check preview | N/A |
| SEOA-03 | JSON-LD structured data present | smoke | `npx astro build && grep -l "application/ld+json" dist/**/*.html` | No |

### Sampling Rate
- **Per task commit:** `npx astro build` (verifies no build errors)
- **Per wave merge:** Full build + manual visual verification in both themes
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- This phase is primarily visual/interactive -- most requirements require manual verification (theme switching, scroll animations, hover interactions, print output). Automated testing is limited to build success and static checks.
- A smoke test for JSON-LD presence in built HTML is achievable with grep.
- No vitest config exists; if adding build verification tests, create `vitest.config.ts` first.

## Sources

### Primary (HIGH confidence)
- GSAP SplitText docs (https://gsap.com/docs/v3/Plugins/SplitText/) -- API reference, autoSplit, onSplit, mask, create() method
- GSAP ScrollTrigger docs (https://gsap.com/docs/v3/Plugins/ScrollTrigger/) -- Configuration, lifecycle, cleanup
- GSAP Forum: Astro ViewTransitions breaks ScrollTrigger (https://gsap.com/community/forums/topic/41197-astro-viewtransitions-breaks-scrolltrigger-the-second-time-i-enter-a-page/) -- Rodrigo (GSAP admin) confirmed: use astro:before-preparation for cleanup, gsap.context() for scoping
- GSAP Forum: ScrollTrigger + Astro View Transitions compatibility (https://gsap.com/community/forums/topic/40950-compatibility-with-gsap-scrolltrigger-astro-view-transitiosn-api/) -- Known issues and mitigations
- Webflow blog: GSAP becomes free (https://webflow.com/blog/gsap-becomes-free) -- License change, all plugins free including SplitText
- Webflow blog: SplitText rewrite (https://webflow.com/blog/gsap-splittext-rewrite) -- 50% smaller, TypeScript rewrite, autoSplit, deepSlice, accessibility
- Astro View Transitions docs (https://docs.astro.build/en/guides/view-transitions/) -- ClientRouter API, lifecycle events, CSS customization
- Filesystem verification: `node_modules/gsap/dist/SplitText.js` and `node_modules/gsap/dist/ScrollTrigger.js` confirmed present at GSAP 3.14.2

### Secondary (MEDIUM confidence)
- Vasko Pavic blog: Enhancing Astro View Transitions with GSAP (https://vaskopavic.com/blog/enhancing-astro-view-transitions-with-gsap-animations/) -- gsap.context() pattern, event lifecycle
- Google Structured Data docs (https://developers.google.com/search/docs/appearance/structured-data/sd-policies) -- JSON-LD format preference, validation guidelines
- Schema.org CreativeWork (https://schema.org/CreativeWork) -- Field definitions
- OddContrast (https://www.oddcontrast.com/) -- OKLCH contrast verification tool
- WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/) -- WCAG AA ratio tool

### Tertiary (LOW confidence)
- None -- all critical findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- GSAP 3.14.2 confirmed installed with all needed plugins. Zero new dependencies.
- Architecture: HIGH -- GSAP + Astro View Transitions lifecycle pattern verified by GSAP admin on forums and matches existing CanvasHero pattern in codebase.
- Theme system: HIGH -- Inline head script + data-attribute + localStorage is universally established pattern. Token architecture designed for this from Phase 1.
- Pitfalls: HIGH -- All identified pitfalls are well-documented in GSAP forums and dark mode implementation guides.
- SplitText features: HIGH -- autoSplit, onSplit, create() confirmed in installed source code (node_modules/gsap/SplitText.js line 204+315).

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable -- all libraries are mature and installed)
