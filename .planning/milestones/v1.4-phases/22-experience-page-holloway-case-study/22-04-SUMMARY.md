---
phase: 22-experience-page-holloway-case-study
plan: 04
subsystem: experience-surface
tags: [astro, content-collections, experience, detail-page, case-study, frontend-design]
requires:
  - "src/lib/experience.ts::sortExperienceEntries (Phase 21)"
  - "experience content collection (holloway.mdx hasCaseStudy true; balfour-beatty.mdx false)"
  - "src/pages/projects/[id].astro (structural analog)"
  - "src/scripts/scroll-depth.ts (Phase 15 sentinel observer)"
provides:
  - "GET /experience/[id] — Holloway deep-dive detail route; builds /experience/holloway ONLY (EXP-04)"
  - "EXP-05 structural guarantee: getStaticPaths filters hasCaseStudy so NO /experience/balfour-beatty route exists"
  - "Verbatim Holloway case study (blockquote lead-in + Overview + 9 numbered highlights + Themes) via page-scoped .prose-editorial"
affects:
  - "22-05 (visual sign-off checkpoint + built-HTML no-balfour-route / no-em-dash gates verify against this route + the two frontend-design rulings recorded below)"
tech-stack:
  added: []
  patterns:
    - "getStaticPaths = sortExperienceEntries(getCollection('experience')).filter(e => e.data.hasCaseStudy) — the filter IS the EXP-05 structural gate"
    - "header class names (.project-meta/.project-title/.project-tagline) reused verbatim from the projects analog so copied header CSS applies with zero orphaned selectors (REVIEWS 22-04 option a)"
    - "page-scoped <style>, six design tokens only; global.css untouched (Pitfall 4 / T-22-05)"
    - "leading breadcrumb arrow is persistent (not opacity-revealed) — color-only hover, no translate"
key-files:
  created:
    - src/pages/experience/[id].astro
  modified: []
decisions:
  - "Back link (D-02) does NOT copy the forward 'Read the full case study ->' opacity-reveal idiom: a leading breadcrumb glyph must be legible at rest, so the arrow is persistent and color-only (--ink-muted -> --accent), no reveal, no translate"
  - "Top + bottom back links are the identical affordance; only the container differs — top is a quiet cue under the header (margin only), bottom inherits NextProject's structural closure (1px --rule top border + 48px top padding) but not its card weight"
  - "h3 highlight subheads differentiate by weight + margin asymmetry (28px above / 8px below binds title to paragraph), NOT a new size — stays on the body ramp (1.125rem/500/--ink), avoids competing with the mono § section markers"
  - "blockquote = quiet framing aside (border-left 1px --rule, --ink-muted, no bg, no italic); hr = hairline --rule divider (margin 48px 0 collapses to a clean 48px each side)"
  - "External-links row OMITTED (D-07 — confidential contract, no githubUrl/demoUrl on the experience schema); NextProject dropped in favor of the D-02 bottom back link"
metrics:
  duration: "~12 min"
  completed: 2026-07-09
  tasks: 2
  files_changed: 1
status: complete
---

# Phase 22 Plan 04: Holloway Deep-Dive Detail Route Summary

Built `src/pages/experience/[id].astro`, the Holloway case-study deep-dive, by mirroring `src/pages/projects/[id].astro` and adapting it for the experience collection: `getStaticPaths` filters `hasCaseStudy` so ONLY `/experience/holloway` builds and Balfour is structurally excluded (EXP-05), the header shows a `dateRange · techStack` mono eyebrow / "Holloway Company" H1 / first-person `summary` lead with NO external-links row, the full verbatim MDX body (blockquote lead-in + Overview + 9 numbered highlights + Themes) renders through a page-scoped `.prose-editorial`, and two `← Back to experience` links (top + bottom) replace the meaningless NextProject card. Turns the source-shape half of `tests/content/experience-detail.test.ts` GREEN; keeps `experience-voice-em-dash.test.ts` green.

## What Shipped

- **`src/pages/experience/[id].astro`** (240 lines, both tasks in one file):
  - **getStaticPaths (Task 1, EXP-05 gate):** `sortExperienceEntries(await getCollection("experience")).filter((entry) => entry.data.hasCaseStudy)` mapped to `{ params: { id: entry.id }, props: { entry } }`. Balfour (`hasCaseStudy: false`) yields no path; only `holloway.mdx` → `/experience/holloway`. `Props = { entry: CollectionEntry<"experience"> }`; `const { Content } = await render(entry)`.
  - **Header (Task 1, D-07):** TOP back link, then mono eyebrow `{dateRange} · {techStack.join(" · ").toUpperCase()}` (dateRange, NOT year — Pitfall 2 avoided), `.h1-section` H1 = `entry.data.company` ("Holloway Company"), `.lead` tagline = `entry.data.summary`. External-links row omitted entirely. Header elements reuse `.project-meta` / `.project-title` / `.project-tagline` class names VERBATIM (REVIEWS 22-04 option a) so the copied header CSS applies with zero orphaned selectors. `BaseLayout` title = company, description = summary (D-10 basic metadata; no JSON-LD).
  - **Body + closure (Task 2):** MDX rendered via `<div class="prose-editorial"><Content components={{ img: ArticleImage }} /></div>` (both the `ArticleImage` import and the `img` mapping kept together — Pitfall 5; inert but forward-compatible). BOTTOM back link occupies the former NextProject `.section` slot; NextProject import/component fully dropped. Four `.scroll-sentinel` divs (data-percent 25/50/75/100, `aria-hidden`) as direct `<article>` children feed `scroll-depth.ts` (DOM-presence-gated, no JS wiring).
  - **Page-scoped `<style>`:** copied verbatim from the projects analog EXCEPT the `.project-links` rules (dropped — no links row). Includes `article { position: relative }` + the four `.scroll-sentinel[data-percent]` rules (Pitfall 3), and the full `.prose-editorial` + `:global(h2/p/ul/li/a/code/pre)` block with the `§`-prefixed `:global(h2)::before`. Three new page-scoped rules added for the Holloway-body-only elements (see attribution 2). `global.css` untouched (Pitfall 4 / T-22-05 held).

## Frontend-Design Attribution (SC5)

Both decisions were routed through the **frontend-design skill** against `design-system/MASTER.md` + `22-UI-SPEC.md` (six tokens only, Geist fonts, restrained/locked motion). The 22-05 checkpoint verifies against these.

1. **D-02 back link — persistent leading arrow, color-only, NOT the forward reveal idiom.** The listing page's forward "Read the full case study →" uses a *trailing* arrow that reveals opacity 0→1 on hover (a bonus flourish; the label reads complete at rest). That idiom does NOT transfer to a *leading* breadcrumb glyph: hiding `←` at rest would leave a hanging gap and make the line read " Back to experience" — broken, not restrained. Ruling: the `←` is **persistent** and `color: inherit` so it flows `--ink-muted → --accent` with the label; motion is **color-only** at 120ms ease (matching the forward link's timing and the locked "no translate" contract); reduced-motion drops only the ease. The honest parallel between the two links is the shared color + focus grammar, not a forced animation. **Top and bottom are the identical affordance** (same type/color/hover/focus — consistency is signposting); only the container differs: the **top** instance is a quiet wayfinding cue grouped under the header (`margin-bottom: 24px`, no border), the **bottom** instance inherits NextProject's *structural* closure (`border-top: 1px solid var(--rule)` + `padding-top: 48px`) to close the article and hold the footer off, but NOT its card weight (no `.h2-project` title, no oversized arrow). Focus ring reconciled to `outline: 2px solid var(--accent); outline-offset: 2px` (the phase constraint; NextProject's 4px is dropped with the component), giving a single consistent offset on the page.

2. **Three prose rules extending the copied `.prose-editorial` block (REVIEWS 22-04 prose-CSS gap), six tokens only, no new treatments.** The Holloway body uses a blockquote, nine `### ` H3 numbered-highlight headings, and `---` rules that the projects prose block never styled. Ruling — hierarchy on this page is **§ MONO section marker (h2) › highlight subhead (h3) › body**:
   - **h3** (`:global(h3)`): a readable Geist subhead subordinate to the tiny-but-loud mono h2, with NO `§` prefix. Differentiated by **weight + margin asymmetry, not a new size** — `1.125rem/500/--ink` (stays on the body ramp) with `margin-top: 28px` (loose, xl) and `margin-bottom: 8px` (tight, xs) so each title binds to its explanatory paragraph. The numeric "1." / "2." prefixes already in the copy plus the asymmetry carry the heading signal without overpowering the § markers.
   - **blockquote** (`:global(blockquote)`): a quiet framing aside — `border-left: 1px solid var(--rule)`, `padding-left: 16px`, `color: var(--ink-muted)`, no background, no italic. `margin: 0 0 16px` (it's the first element — no space above; the following `## Overview` h2's 48px top margin makes the section gap).
   - **hr** (`:global(hr)`): a hairline divider — `border: none; border-top: 1px solid var(--rule); margin: 48px 0`. Adjacent-margin collapsing resolves it to a symmetric 48px each side against neighboring body/h2, a deliberate major-section break with no doubled stack.
   All three stay INSIDE `.prose-editorial :global(...)` (page-scoped), never in global.css (Pitfall 4).

## Deviations from Plan

None. The plan executed exactly as written. Both tasks landed in a single route file; both frontend-design rulings were made before implementation and applied verbatim. No auto-fixes (Rules 1-3) were needed; no architectural decisions (Rule 4) arose; no authentication gates.

## Known Stubs

None. The route renders live collection data verbatim from `holloway.mdx`; no placeholders, no hardcoded empties.

## Threat Flags

None. No new network endpoints, auth paths, or trust-boundary surface. Rendering is build-time SSG over Zod-validated first-party content with no user input; `params.id` comes from `entry.id` (filename stem), never a request (T-22-06 accepted). External-links row omitted so no confidential URLs surface (T-22-03 mitigation held). The `.prose-editorial` + sentinel CSS is page-scoped; `global.css` / chat surface untouched (T-22-05 mitigation held).

## Verification Results

- `pnpm exec vitest run tests/content/experience-detail.test.ts` → **2/2 pass** (content contract: hasCaseStudy ids === ["holloway"], balfour excluded; source shape: `.filter(...hasCaseStudy)` present + EXACTLY two `href="/experience"` back links).
- `pnpm exec vitest run tests/content/experience-voice-em-dash.test.ts` → **4/4 pass** (zero em dashes in the new route source + MDX body prose).
- `pnpm exec astro check` → **0 errors / 0 warnings** (1 pre-existing hint in `src/scripts/chat.ts:384`, out of scope — untouched by this plan).
- `pnpm exec astro build` → **success**; `dist/client/experience/holloway/index.html` generated; `dist/client/experience/balfour-beatty` **ABSENT** (EXP-05 structural exclusion confirmed).
- `git diff --exit-code -- package.json pnpm-lock.yaml` → **unchanged** (QA-02: zero new deps).
- `git diff --exit-code -- src/styles/global.css` → **unchanged** (Pitfall 4 / T-22-05).

## Requirements Satisfied

- **EXP-04** — Holloway deep-dive reachable at `/experience/holloway` with the full case study and top+bottom return links to `/experience`.
- **EXP-05 (structural)** — `getStaticPaths` filters `hasCaseStudy`; no `/experience/balfour-beatty` route is built.

## Self-Check: PASSED

- FOUND: src/pages/experience/[id].astro
- FOUND: dist/client/experience/holloway/index.html (build output)
- CONFIRMED ABSENT: dist/client/experience/balfour-beatty
- FOUND commit 088cd2e (feat: implementation)
