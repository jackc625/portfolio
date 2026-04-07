---
phase: quick/260407-hop
plan: 01
subsystem: design-mockup
tags: [mockup, html, css, design-validation, portfolio]
one_liner: "Standalone static HTML+CSS mockup of the locked portfolio design for pre-implementation visual review"
requires: []
provides:
  - "mockup.html (self-contained design reference at repo root)"
affects: []
tech_stack:
  added: []
  patterns:
    - "Inline <style> design tokens via :root CSS variables (--bg, --ink, --accent, --rule, etc.)"
    - "Geist + Geist Mono loaded via Google Fonts CDN (mockup-only — real build will use Astro Fonts API)"
    - "12-column CSS grid for hero, single-column collapse at ≤1023px"
    - "No-JS sticky header, native scroll-behavior: smooth"
key_files:
  created:
    - "mockup.html"
  modified: []
decisions:
  - "Literal markup for all 4 work rows (no templating) — this is a static mockup, not a component"
  - "Google Fonts CDN used instead of self-hosted fonts to keep the file truly standalone (one file, no asset pipeline)"
  - "Single border-radius declaration enforced on .status-dot only — matches spec's brutalist/editorial aesthetic"
metrics:
  duration: "~4 minutes"
  tasks_completed: 1
  files_changed: 1
  completed: "2026-04-07"
---

# Quick Task 260407-hop: Static HTML/CSS Portfolio Mockup Summary

## What Was Built

A single self-contained file — `mockup.html` at the repository root — that renders the locked portfolio design direction in any modern browser, with zero dependencies on the existing Astro codebase. The file is 477 lines:

- `<head>`: charset, viewport, title, Google Fonts preconnect + stylesheet link (Geist 400/500/600/700 + Geist Mono 400/500), one inline `<style>` block with design tokens, reset, typography, and all component CSS.
- `<body>`:
  - **Sticky `<header>`** — JACK CUTRARA wordmark (Geist Mono) left, three nav links (works/about/contact) right, with "works" marked active via red accent underline.
  - **`#hero` section** — 12-col grid: `JACK / CUTRARA·` display text (clamp-scaled, red accent dot after CUTRARA) in cols 1–8, status line (red CSS-drawn dot + "AVAILABLE FOR WORK" mono label) and "EST. 2024 · OAKLAND, CA" meta in cols 9–12.
  - **`#works` section** — `§ 01 — WORK` header with `4 / 4` count, 1px rule, then 4 work rows (Portfolio System 2026, Distributed Cache 2025, Compiler Toy 2025, Notes Sync Engine 2024) with mono stack lines and hover-revealed red arrows.
  - **`#about` section** — `§ 02 — ABOUT` header, 1px rule, intro + 3 body paragraphs, constrained to 68ch.
  - **`#contact` section** — `§ 03 — CONTACT` header, 1px rule, "GET IN TOUCH" label, `jack@cutrara.dev` email link, "GitHub · LinkedIn · X" mono row.
  - **`<footer>`** — 1px top rule, `© 2026 JACK CUTRARA` left, `BUILT WITH ASTRO · TAILWIND · GEIST` right.
- Three responsive breakpoints: ≥1024px (desktop 48px padding, 12-col grid), 768–1023px (tablet 32px padding, single-col hero, 96px section gaps), <768px (mobile 24px padding, 72px section gaps).

## Hard-Rule Compliance

Every rule from Task 1 §13 was verified by the plan's automated verify script:

- Zero `<script>`, `<img>`, `<svg>`, `<picture>` tags — confirmed
- Zero `linear-gradient(`, `radial-gradient(`, `box-shadow` — confirmed
- Zero `●` pictograph/bullet character in markup (status dot is a CSS `.status-dot` element) — confirmed
- Exactly one `<style>` block — confirmed
- Exactly one `border-radius` declaration (on `.status-dot`, 50%) — confirmed
- Google Fonts href matches the spec exactly — confirmed
- All required content strings present: doctype, `lang="en"`, exact `<title>`, display text, all four project titles/years/stacks, all three section headers with em-dashes, `jack@cutrara.dev`, `© 2026 JACK CUTRARA`, `BUILT WITH ASTRO · TAILWIND · GEIST`, `AVAILABLE FOR WORK`, `EST. 2024 · OAKLAND, CA`, `id="works"`, `id="about"`, `id="contact"` — confirmed

Automated verify output: `mockup.html OK`.

## Deviations from Plan

**None.** The plan was executed exactly as written. Every design token, typography rule, component, section gap, responsive breakpoint, and hard rule was implemented to spec. The only judgment calls were where the spec offered alternatives:

1. **Section rule spacing** — Spec said "give the first `.work-row` `margin-top: 24px` OR add `margin-bottom: 24px` on `.section-rule`." Chose `margin-bottom: 24px` on `.section-rule` so the rule applies uniformly to all three sections (works, about, contact) instead of having to style the first child of each differently.
2. **`.tabular` helper usage** — Spec said to apply `font-variant-numeric: tabular-nums` to number/year/count elements "use a `.tabular` helper or apply directly." Implemented as a reusable `.tabular { font-variant-numeric: tabular-nums; }` helper and applied it to `.count`, `.work-num`, `.work-year`, `.meta-location`, and `.footer-copy`.
3. **Section-header color disambiguation** — Added scoped rules `.section-header .label-mono { color: var(--ink); }` and `.section-header .count { color: var(--ink-faint); }` to match the spec's "left = label mono var(--ink), right = meta mono var(--ink-faint)" description without overriding the base `.label-mono` / `.meta-mono` utility classes elsewhere.

None of these are semantic changes — they are implementation details that match the spec's intent.

## Commit

| Task | Commit | Files |
| --- | --- | --- |
| Task 1: Write mockup.html and commit | `700d5ad` | `mockup.html` (+477 lines) |

Commit message: `feat(mockup): add static HTML/CSS portfolio design mockup`
Branch: `feat/ui-redesign`

## Next Step

**User review.** Open `mockup.html` in a browser (double-click the file, or `start mockup.html` on Windows / `open mockup.html` on macOS) and visually evaluate the locked design at three widths:

1. **Desktop (≥1024px)** — Full 12-col hero grid, 160px section gaps, 48px container padding.
2. **Tablet (768–1023px)** — Single-col hero with meta stacked below, 32px padding, 96px section gaps.
3. **Mobile (<768px)** — 24px padding, 72px section gaps.

If the mockup looks right, the next step is to translate it into the real Astro codebase (components, content collections, Astro Fonts API, Tailwind v4 tokens, and GSAP scroll animations on top). If something looks off, iterate on `mockup.html` first — it's faster to tune one HTML file than to re-do an Astro component tree.

## Self-Check: PASSED

- FOUND: `C:/Users/jackc/Code/portfolio/mockup.html`
- FOUND: commit `700d5ad` in git log
- FOUND: automated verify script output `mockup.html OK` (all required strings present, all forbidden patterns absent, exactly one `<style>` block, exactly one `border-radius` declaration)
- FOUND: commit touches only `mockup.html` (no Astro files, no package.json, no config files)
