---
phase: 08-foundation
plan: 06
subsystem: foundation
tags: [redesign, tokens, stubs, cascade, dsgn-02]
requires:
  - 08-01 (design contract MASTER.md)
  - 08-03 (token rename map)
provides:
  - 5 minimal page stubs rendering on new --ink/--ink-muted tokens
  - 5 surviving components migrated to new Tailwind token classes
  - completes the token cascade for the page + component layer
affects:
  - src/pages/index.astro
  - src/pages/about.astro
  - src/pages/projects.astro
  - src/pages/contact.astro
  - src/pages/projects/[id].astro
  - src/components/Footer.astro
  - src/components/NextProject.astro
  - src/components/ArticleImage.astro
  - src/components/SkipToContent.astro
  - src/components/ContactChannel.astro
tech_stack:
  added: []
  patterns:
    - Inline style= with --ink/--ink-muted on stubs (no Tailwind class dependency)
    - Tailwind numeric scale replacing [var(--token-space-*)] arbitrary values
key_files:
  created: []
  modified:
    - src/pages/index.astro
    - src/pages/about.astro
    - src/pages/projects.astro
    - src/pages/contact.astro
    - src/pages/projects/[id].astro
    - src/components/Footer.astro
    - src/components/NextProject.astro
    - src/components/ArticleImage.astro
    - src/components/SkipToContent.astro
    - src/components/ContactChannel.astro
decisions:
  - "[Plan 08-06]: stubs use inline style= with raw CSS vars to render correctly even before Tailwind class rebuild lands"
  - "[Plan 08-06]: projects/[id].astro stub description is a hard-coded literal — no project.data.tagline coupling (WRN-3 resolution)"
  - "[Plan 08-06]: removed dead data-animate=section attribute from NextProject (D-13 cleanup) since the [data-animate] CSS was deleted in Plan 03"
metrics:
  duration: ~5min
  tasks: 2
  files: 10
  completed: 2026-04-07
requirements_completed: [DSGN-02]
---

# Phase 8 Plan 06: Page stubs + component token cascade — Summary

Replaced the 5 v1.0 page files with minimal ~15-line redesign stubs and renamed all Tailwind token classes in the 5 surviving components (Footer, NextProject, ArticleImage, SkipToContent, ContactChannel), completing the DSGN-02 token cascade across the surviving page and component layer.

## What Shipped

### Task 1 — Page stubs (commit 8c0ab5f)

Replaced 5 page files with minimal stubs that render against the new design tokens via inline `style=` attributes. All imports of v1.0-deleted components (CanvasHero, ProjectCard, FeaturedProjectItem, SkillGroup, etc.) are gone.

| File | Before | After | Notes |
|---|---|---|---|
| src/pages/index.astro | 43 lines | 16 lines | dropped CanvasHero + JsonLd imports |
| src/pages/about.astro | 171 lines | 16 lines | dropped SkillGroup + JsonLd imports |
| src/pages/projects.astro | 88 lines | 16 lines | dropped ProjectCard + FeaturedProjectItem + getCollection |
| src/pages/contact.astro | 110 lines | 16 lines | dropped ContactChannel imports + availability-dot CSS |
| src/pages/projects/[id].astro | 214 lines | 28 lines | **getStaticPaths preserved** — 6 routes still build |

`projects/[id].astro` retains the full `getStaticPaths` + `getCollection("projects")` + `props: { project }` contract. Description is a hard-coded literal string per the WRN-3 resolution — the stub references only `project.data.title` (guaranteed by any reasonable schema), not `project.data.tagline` (uncoupled from schema field assumptions).

### Task 2 — Component class renames (commit f59ae72)

Applied the Plan 02 token rename map + D-08 flat sizes to the 5 surviving components. All `text-text-*`, `bg-bg-*`, `border-border`, `[var(--token-space-*)]`, and `[length:var(--token-text-*)]` strings are gone.

**Footer.astro** — `border-border/40` → `border-rule/40`, `py-[var(--token-space-xl)]` → `py-8`, `text-text-muted` → `text-ink-faint`, three identical icon link class strings migrated `hover:text-text-primary` → `hover:text-ink`. D-13 motion survivor `hover:-translate-y-0.5` preserved (3 instances).

**NextProject.astro** — `bg-bg-secondary` → `bg-rule` (and dead `data-animate="section"` attribute removed since [data-animate] CSS was deleted in Plan 03), `py-[var(--token-space-section)]` → `py-24`, `mb-[var(--token-space-lg)]` → `mb-6`, `gap-[var(--token-space-lg)]` → `gap-6`, `text-text-primary` → `text-ink`, `text-[length:var(--token-text-heading)]` → `text-3xl`, `text-text-muted` → `text-ink-faint`. D-13 motion survivor `group-hover:translate-x-1` preserved.

**ArticleImage.astro** — `my-[var(--token-space-xl)]` → `my-8`, `text-text-muted mt-[var(--token-space-sm)] font-mono text-[length:var(--token-text-sm)]` → `text-ink-faint mt-2 font-mono text-sm`.

**SkipToContent.astro** — `focus:bg-bg-primary` → `focus:bg-bg` (only change needed; the rest of the focus utility chain was already on the unchanged token names).

**ContactChannel.astro** — `border-border/30` → `border-rule/30`, `gap-[var(--token-space-lg)]` → `gap-6`, `py-[var(--token-space-lg)]` → `py-6`, `text-text-muted` → `text-ink-faint` (3 instances), `text-text-primary` → `text-ink`, `text-[length:var(--token-text-base)]` → `text-base`, `text-[length:var(--token-text-sm)]` → `text-sm`.

**JsonLd.astro** — verified clean, no edits needed (server-side schema emission only, no styling).

## Verification

- `grep token-|bg-bg-primary|bg-bg-secondary|text-text-|border-border` against all 5 component files: **0 matches** (verified per-file)
- `grep token-` against all 5 stub files: **0 matches**
- `grep CanvasHero|ProjectCard|FeaturedProjectItem|SkillGroup|CTAButton|ResumeEntry|CaseStudySection|ThemeToggle` in stub files: **0** (the only remaining hits are in `src/pages/resume.astro`, which is out of scope — Plan 07 handles its deletion)
- `grep getStaticPaths src/pages/projects/[id].astro`: **1** (routing preserved)
- `grep data-animate src/components/NextProject.astro`: **0** (dead attribute removed)
- Stub line counts: index 16, about 16, projects 16, contact 16, [id] 28 — all well within ≤30 line acceptance

## Token Cascade Status

After this plan combined with Plans 04 and 05, the token cascade for the page + component layer is complete. The surviving editorial-ready surfaces (5 stubs + 5 components) are now expressed entirely in the new Tailwind v4 token vocabulary defined by `design-system/MASTER.md`. Phase 8's `npm run build` gate (Plan 08) can now run against a fully cascaded source tree.

`src/pages/resume.astro` is intentionally left untouched — it is Plan 07's responsibility (resume page deletion + PDF rename per CONTACT-03).

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|---|---|---|
| 1 | 8c0ab5f | feat(08-06): replace 5 page files with minimal redesign stubs |
| 2 | f59ae72 | feat(08-06): rename Tailwind token classes in 5 surviving components |

## Self-Check: PASSED

- FOUND: src/pages/index.astro
- FOUND: src/pages/about.astro
- FOUND: src/pages/projects.astro
- FOUND: src/pages/contact.astro
- FOUND: src/pages/projects/[id].astro
- FOUND: src/components/Footer.astro
- FOUND: src/components/NextProject.astro
- FOUND: src/components/ArticleImage.astro
- FOUND: src/components/SkipToContent.astro
- FOUND: src/components/ContactChannel.astro
- FOUND: commit 8c0ab5f
- FOUND: commit f59ae72
