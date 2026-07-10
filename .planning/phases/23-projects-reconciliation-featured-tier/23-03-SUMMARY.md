---
phase: 23-projects-reconciliation-featured-tier
plan: 03
subsystem: projects-ui
status: complete
tags: [projects, featured-tier, workrow, two-tier, home-teaser, frontend-design]
requirements: [PROJ-02, PROJ-03, PROJ-04]
dependency_graph:
  requires:
    - src/components/primitives/WorkRow.astro (MASTER §5.5 numbered-row primitive)
    - src/pages/projects.astro (flat ordered listing)
    - src/pages/index.astro (Home 3-featured teaser)
    - src/content.config.ts (tagline field, featured/order — finalized Plan 01)
    - src/pages/experience.astro (Phase 22 earlier-divider + read-more idioms)
  provides:
    - optional `tagline?: string` prop + `.work-tagline` on WorkRow.astro
    - two-tier FEATURED / MORE WORK layout on /projects
    - Home featured taglines + `.see-all-work` link to /projects
    - tests/build/featured-tier-render.test.ts (SC2 render gate)
  affects:
    - 24 (positioning shift / Home Holloway teaser reads the same WORK section)
    - 23-04 (phase capstone gate runs the SC2 render gate against fresh dist/)
tech_stack:
  added: []
  patterns:
    - optional-prop extension of a shared primitive (reuse-over-invention, one row treatment everywhere)
    - structural next-sibling :has() gap override (no modifier class, byte-identical when absent)
    - featured-boolean partition + order-sort as the single distinction (D-12), shared by both pages
    - tier sub-label + trailing hairline mirroring the Phase 22 earlier-divider idiom
    - DOM-parse render gate (element count, not substring) to exclude scoped-style false positives
key_files:
  created:
    - tests/build/featured-tier-render.test.ts
  modified:
    - src/components/primitives/WorkRow.astro
    - src/pages/projects.astro
    - src/pages/index.astro
decisions:
  - "WorkRow extended in place with an optional tagline (no FeaturedRow fork) — one primitive, one row treatment on /projects and Home"
  - "title→tagline 8px gap applied via structural .work-title:has(+ .work-tagline), not a modifier class — no-tagline row stays byte-identical"
  - "tier markers are sub-labels + hairline (experience.astro idiom), never numbered SectionHeaders; single page-level 01 WORK numbering preserved (D-09)"
  - "SC2 gate parses built HTML and counts .work-tagline ELEMENTS (jsdom-env DOMParser, no new dep) so the scoped-style block cannot satisfy it (F7)"
metrics:
  tasks_completed: 3
  files_touched: 4
  duration: ~9min
  completed: 2026-07-10
---

# Phase 23 Plan 03: Projects Reconciliation & Featured Tier Summary

Rendered the finalized data model as UI: extended the WorkRow primitive with one optional tagline line, built the asymmetric two-tier FEATURED / MORE WORK layout on /projects, and enriched the Home teaser with the same tagline treatment plus a See all work link — all page/primitive-scoped so the chat surface stayed out of scope. Every pixel decision was routed through the frontend-design skill (SC5) against the locked MASTER.md contract and the phase UI-SPEC.

## What Was Built

**Task 1 — WorkRow optional tagline (commit e07cdcc)**
Added `tagline?: string` to the WorkRow Props and rendered `<p class="body work-tagline">{tagline}</p>` between the title and the mono stack only when set (`{tagline && ...}`), so a tagline-less row is byte-identical to the pre-Phase-23 primitive. Scoped style adds `.work-tagline { color: var(--ink-muted); margin-bottom: 12px; }`. The title→tagline 8px tightening uses a structural next-sibling selector `.work-title:has(+ .work-tagline) { margin-bottom: 8px; }` — the frontend-design call chose this over a modifier class because it needs no extra class threaded through the markup and simply does not match when no tagline follows, keeping the default 12px byte-identical. The tagline takes no hover state (only the title carries the accent underline — MASTER §7 single-signal). Hover/focus + prefers-reduced-motion blocks untouched. astro check 0 errors / 0 warnings; the 43-test motion/focus battery (work-arrow-motion + motion-css-rules + focus-visible) stayed green.

**Task 2 — Two-tier /projects + SC2 render gate (commit a046206)**
Reworked projects.astro to a single ordered collection read partitioned into `featured` / `rest` by the `featured` boolean (D-12). One SectionHeader (01 WORK, count `7 / 7`), then a FEATURED tier sub-label + trailing hairline sitting tight under the section rule, the 3 featured WorkRows with `tagline={p.data.tagline}`, a MORE WORK sub-label opening the break at `margin-top: 48px`, then the 4 rest rows without a tagline. Both tier markers mirror the Phase 22 `earlier-divider` idiom (flex row, `.label-mono --ink-faint` label + 12px gap + 1px `--rule` hairline) and are sub-labels, not numbered SectionHeaders (D-09). Every row numbers off `String(p.data.order).padStart(2, "0")`, so the two tiers read 01→07 continuously (featured 01-03, rest 04-07). Page-scoped `<style>` only. Authored tests/build/featured-tier-render.test.ts: reads the built /projects HTML from `dist/client/projects/index.html`, parses it with the jsdom-env `DOMParser` (no new dependency), and asserts exactly 3 `p.work-tagline` ELEMENTS, 7 `.work-num` columns reading 01-07, and that the first 3 rows are the tagged ones (F7 — element count, not substring, so the scoped-style block cannot satisfy it).

**Task 3 — Home taglines + See all work link (commit e93de07)**
Added `tagline={p.data.tagline}` to each featured WorkRow on Home so the teaser uses the same richer treatment as /projects (D-14); the partition/count logic is unchanged (still `3 / 7`). Added a `See all work →` link after the WORK work-list mirroring the ABOUT `.read-more` idiom (`.label-mono`, inline-block, 24px top, `--ink-muted` → `--accent` hover) plus the experience.astro deep-link arrow opacity reveal, with a paired `prefers-reduced-motion` neutralizer that keeps the color affordance and drops the reveal. Accent lands only on the link (MASTER §7). Refreshed the stale featured-set comment ("SeatWatch, NFL Prediction, SolSniper" → "SeatWatch, Multi-Chain EVM Trader, NFL Prediction"), comment only. Page-scoped `<style>` only.

## Verification Results

- `pnpm exec astro check`: 0 errors / 0 warnings / 1 hint (128 files). The single hint is the pre-existing, unrelated unused-`button` param in `src/scripts/chat.ts:384` (a Phase 7 file untouched by this plan; logged out-of-scope by Plan 01).
- `pnpm exec vitest run tests/build/work-arrow-motion.test.ts tests/build/motion-css-rules.test.ts tests/client/focus-visible.test.ts`: 43/43 passed — WorkRow motion/focus contract preserved; rest rows byte-identical (F1).
- `pnpm build`: succeeded; /projects + Home + all 7 project detail pages emitted under dist/client/.
- `pnpm exec vitest run tests/build/featured-tier-render.test.ts`: 4/4 passed against fresh dist/ — 3 tagline elements, 7 rows 01-07, featured-first ordering confirmed. (Runtime-validated now; re-validated at the Plan 04 phase gate.)
- `pnpm exec vitest run tests/content`: 66 passed / 2 skipped.
- Full targeted suite (motion/focus + render gate + content): 113 passed / 2 skipped.
- Scope invariant: `git diff --name-only` across all three task commits touches only WorkRow.astro, projects.astro, index.astro, and the new render test. `src/styles/global.css` and `src/layouts/BaseLayout.astro` untouched.

## Success Criteria

- SC2 / PROJ-02: /projects renders a distinct FEATURED tier (3 rows with tagline, 01-03) above a MORE WORK tier (4 compact rows, 04-07), numbered continuously. PASS
- SC3 / PROJ-03: SolSniper, Optimize-AI, Clipify, DayTrade remain reachable in the rest tier. PASS
- SC4 / PROJ-04: Home shows the 3-featured teaser with taglines + a See all work link; both pages derive from the same featured/order partition (D-12). PASS
- SC5: all visual decisions routed through frontend-design; astro check stays 0/0 (errors/warnings); no shared-file / chat-surface edit. PASS

## Frontend-Design Skill Calls (SC5)

The frontend-design skill was invoked before editing to finalize the three open pixel decisions, all confirmed inside the locked six-token / no-card / restrained-motion contract:

1. **Tagline gap selector:** use the structural next-sibling `.work-title:has(+ .work-tagline)` over a modifier class — minimal markup, purely structural, guarantees the no-tagline row is byte-identical.
2. **Tier dividers:** mirror the shipped `experience.astro` `.earlier-divider` idiom exactly; FEATURED tight under the SectionHeader rule, MORE WORK at a 48px break; sub-labels, not numbered headers.
3. **See all work link:** mirror the `.read-more` shape/placement and add the deep-link arrow opacity reveal with a paired reduced-motion neutralizer; accent only on the clickable link.

## Deviations from Plan

None — plan executed as written. No auto-fixes (Rules 1-3) were required; no architectural decisions (Rule 4) arose. Zero package installs (QA-02 honored; `package.json` untouched). The SC2 gate was authored to use the jsdom vitest-environment `DOMParser` global rather than a direct `JSDOM` import, because `@types/jsdom` is not installed and the established test pattern in this repo uses the `// @vitest-environment jsdom` pragma — this keeps astro check at 0 errors with no new dependency, satisfying the plan's "lightweight DOM approach already available in the test environment" instruction.

## Threat Model Notes

- T-23-03 (Tampering, shared style surface): mitigated — all tier/tagline/link styling is page-scoped (projects.astro / index.astro) or primitive-scoped (WorkRow.astro); global.css and BaseLayout.astro are untouched, verified by the git diff, so the D-26 chat-surface battery and D-15 SSE anchor stay out of scope.
- T-23-SC (installs): mitigated / accept — zero package installs; no package-manager surface touched.

## Self-Check: PASSED

- src/components/primitives/WorkRow.astro (tagline prop + .work-tagline) — FOUND
- src/pages/projects.astro (two-tier FEATURED / MORE WORK) — FOUND
- src/pages/index.astro (taglines + .see-all-work link) — FOUND
- tests/build/featured-tier-render.test.ts — FOUND
- commit e07cdcc (Task 1) — FOUND
- commit a046206 (Task 2) — FOUND
- commit e93de07 (Task 3) — FOUND
