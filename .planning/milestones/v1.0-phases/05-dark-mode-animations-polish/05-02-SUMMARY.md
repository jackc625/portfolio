---
phase: 05-dark-mode-animations-polish
plan: 02
subsystem: animation
tags: [gsap, scroll-trigger, split-text, view-transitions, hover, animations, canvas, parallax, reduced-motion]

# Dependency graph
requires:
  - phase: 05-dark-mode-animations-polish
    provides: "Theme system with data-theme attribute and canvas theme awareness"
    plan: 01
provides:
  - "GSAP scroll-triggered section reveals on all pages"
  - "SplitText line-by-line heading animations on all display headings"
  - "Staggered card and item reveal animations"
  - "View transition crossfade CSS"
  - "Hover micro-interactions (card shadow-lift, nav underline, footer icon lift)"
  - "Canvas hero mouse influence, parallax depth, parameter tuning"
affects:
  - "src/scripts/animations.ts"
  - "src/styles/global.css"
  - "src/layouts/BaseLayout.astro"
  - "src/components/CanvasHero.astro"
  - "All page files (index, about, projects, [id], resume, contact)"
  - "src/components/ProjectCard.astro"
  - "src/components/Header.astro"
  - "src/components/Footer.astro"
  - "src/components/NextProject.astro"

# Tech stack changes
tech-stack:
  added: []
  patterns:
    - "GSAP gsap.context() for View Transitions lifecycle management"
    - "data-animate attribute convention for animation targeting"
    - "SplitText.create() with autoSplit and onSplit callback"
    - "CSS background-image technique for animated underline hover"

# Key files
key-files:
  created:
    - "src/scripts/animations.ts"
  modified:
    - "src/styles/global.css"
    - "src/layouts/BaseLayout.astro"
    - "src/pages/index.astro"
    - "src/pages/about.astro"
    - "src/pages/projects.astro"
    - "src/pages/projects/[id].astro"
    - "src/pages/resume.astro"
    - "src/pages/contact.astro"
    - "src/components/CanvasHero.astro"
    - "src/components/ProjectCard.astro"
    - "src/components/Header.astro"
    - "src/components/Footer.astro"
    - "src/components/NextProject.astro"

# Key decisions
decisions:
  - "Centralized animations.ts script imported in BaseLayout rather than per-page imports"
  - "GSAP gsap.context() used for lifecycle cleanup on astro:before-preparation"
  - "data-animate attributes on elements (not CSS classes) to separate animation from styling"
  - "Per-particle strokeStyle in canvas draw loop (acceptable at 400-1000 particles)"
  - "Mouse influence only on hover-capable devices via matchMedia('(hover: hover)')"

# Metrics
metrics:
  duration: "13min"
  completed: "2026-03-30"
---

# Phase 5 Plan 02: GSAP Animations, Scroll Reveals & Canvas Enhancements Summary

GSAP ScrollTrigger section reveals, SplitText heading animations, staggered card effects, view transition crossfade, hover micro-interactions, and canvas hero depth/interactivity across all pages.

## What Changed

### Task 1: GSAP Animation Infrastructure (a2c5beb)

Created `src/scripts/animations.ts` as the centralized GSAP animation system with ScrollTrigger and SplitText plugins registered. The script implements three animation types: section fade-in/slide-up reveals triggered at 85% viewport entry, staggered container reveals with 100ms inter-item delay, and SplitText line-by-line heading reveals with clip masking. All animations are scoped in `gsap.context()` for clean View Transitions lifecycle management -- init on `astro:page-load`, cleanup via `ctx.revert()` on `astro:before-preparation`.

Added view transition CSS to `global.css` with 200ms crossfade keyframes (`vt-fade-out`/`vt-fade-in`). Added `.nav-link-hover` CSS class implementing animated underline from left to right using `background-image` + `background-size` transition technique.

All animations and transitions include `prefers-reduced-motion: reduce` overrides.

### Task 2: Data Attributes & Hover Micro-Interactions (33fadd0)

Added animation script import to `BaseLayout.astro` via inline `<script>` with TypeScript import (Astro's Vite pipeline bundles it).

Applied `data-animate="split-text"` to every page `<h1>` display heading (index, about, projects, [id], resume, contact). Applied `data-animate="section"` to all below-fold sections across all pages. Applied `data-animate-container="stagger"` and `data-animate="stagger-item"` wrappers to: project cards grid on /projects, skill groups grid on /about, contact channels on /contact.

Enhanced `ProjectCard.astro` with `hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]` and `hover:-translate-y-0.5` shadow-lift effect. Added `nav-link-hover` class to non-active nav links in `Header.astro`. Added `hover:-translate-y-0.5` lift to all Footer social icon links. All hover transforms disabled via `@media (prefers-reduced-motion: reduce)` scoped styles.

### Task 3: Canvas Hero Enhancements (ba1b853)

Added mouse/cursor influence to the particle flow field: `mousemove` listener tracks cursor position, particles within 150px radius receive angular offset toward cursor (max 0.3 radians, linear falloff). Mouse tracking only activates on hover-capable devices.

Implemented three-layer parallax depth system: each particle assigned random depth (0.5, 0.75, or 1.0). Deeper particles move slower (`speed * depth`), have fainter strokes (`0.18 * depth` opacity), and thinner lines (0.3/0.4/0.6px). Creates visual depth without 3D rendering.

Tuned parameters: `noiseScale` 0.003 -> 0.0025 (smoother curves), `speed` 1.5 -> 1.2 (calmer feel). Static frame for reduced-motion also uses depth-varied opacity.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] NextProject component data-animate attribute**
- **Found during:** Task 2
- **Issue:** Plan only mentioned adding `data-animate="section"` to NextProject's "wrapping element" in [id].astro, but NextProject renders its own `<section>` root element.
- **Fix:** Added `data-animate="section"` directly to the `<section>` in NextProject.astro component.
- **Files modified:** src/components/NextProject.astro
- **Commit:** 33fadd0

## Decisions Made

1. **Centralized animation script** -- Single `animations.ts` imported once in BaseLayout rather than per-page GSAP imports. Avoids duplicate plugin registration and multiple event listeners.
2. **gsap.context() scoping** -- All animations wrapped in `gsap.context()` with `ctx.revert()` on cleanup. This is the GSAP-recommended pattern for Astro View Transitions.
3. **Per-particle strokeStyle** -- Canvas draw loop sets strokeStyle per particle (for depth-varied opacity) rather than batching by depth group. At 400-1000 particles, the performance cost is negligible on modern hardware.
4. **Mouse influence guard** -- `matchMedia('(hover: hover)')` prevents mouse tracking on touch devices for performance.

## Known Stubs

None -- all animations are fully wired to real data attributes and live page elements.

## Self-Check: PASSED

All created files verified on disk. All 3 task commits verified in git log.
