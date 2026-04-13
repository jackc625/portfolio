---
phase: 09-primitives
plan: 06
subsystem: ui
tags: [astro, primitives, editorial, components, audit, restyle, next-project]

# Dependency graph
requires:
  - phase: 09-primitives
    provides: "src/styles/global.css LAYER 3 helpers (.container, .section, .label-mono, .h2-project) and six-token palette (--ink, --ink-faint, --rule, --accent) from plan 09-02"
  - phase: 09-primitives
    provides: "D-22/D-23/D-24/D-25 audit decisions from 09-CONTEXT.md (plan 09-01 locked the MASTER amendments)"
provides:
  - "src/components/NextProject.astro restyled to editorial row shape with public API { project: CollectionEntry<'projects'> } unchanged"
  - "Audit trail confirming JsonLd.astro, SkipToContent.astro, ArticleImage.astro survive Phase 9 unchanged"
affects: [10-page-port]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-22: NextProject is a next-row primitive (editorial grammar), not a card-CTA panel — applies .section rhythm + scoped .next-project padding + global .container + .h2-project title"
    - "D-22 hover: opacity-only arrow reveal (0 → 1, 120ms ease) mirroring WorkRow .work-arrow pattern — zero transform, zero translate-x"
    - "D-16: only six-token palette (--ink, --ink-faint, --rule, --accent) referenced from scoped CSS. Zero new tokens, zero inline hex values, zero oklch() calls"
    - "D-03: NextProject markup uses only editorial named classes (next-project, section, container, label-mono, h2-project) — no Tailwind utility classes in the new template"
    - "D-23/D-24/D-25: three kept components pass verify-only audit with zero edits — SkipToContent retains focus:bg-bg/focus:text-accent/focus:ring-accent Tailwind utilities as sanctioned for the app-shell utility component (outside the primitives/ directory)"

key-files:
  created: []
  modified:
    - src/components/NextProject.astro

key-decisions:
  - "[Phase 09-06] NextProject hover arrow uses unicode → (font-size 1.5rem) rendered inline, not an <svg> element — matches the WorkRow.astro pattern described in D-22/MASTER §5.5 and keeps the runtime surface zero-JS"
  - "[Phase 09-06] NextProject combines global .section (rhythm 160/96/72px margin-top) with scoped .next-project padding-top: 48px on the same element — this produces an intentional 208/144/120px total stack above the § NEXT — label documented in WARNING 3 of the plan, NOT a stacking bug"
  - "[Phase 09-06] NextProject uses border-top: 1px solid var(--rule) on the row root (not border-bottom) because the row sits ABOVE the footer — a top border renders the same 1px --rule divider between the preceding page body and the next-project link, which is what D-22 'bottom border to separate from footer' describes visually"
  - "[Phase 09-06] Task 2 is verify-only with zero commits — D-23/D-24/D-25 contract is 'read and confirm clean, no edits expected', and all three files pass the negative grep regression checks (no oklch, no legacy text-text-* tokens, no bg-background/text-primary/ring-primary). Any deviation would have required re-opening the audit decision with the user"
  - "[Phase 09-06] WorkRow.astro does not exist yet (plan 09-04 creates it) so the 120ms opacity hover grammar was sourced directly from the plan <action> block and the D-22 context — the assertion 'matching WorkRow' is a forward contract that plan 09-04 must honor when it writes WorkRow.astro"

patterns-established:
  - "Editorial next-row primitive pattern: <a class='next-project section'><div class='container next-project-inner'><label-mono/><body><h2-project/><arrow/></body></div></a> — row primitive that owns its own vertical padding AND consumes the global .section rhythm via double-classing"
  - "Opacity-only hover reveal pattern: .arrow { opacity: 0; transition: opacity 120ms ease; } + .row:hover .arrow, .row:focus-visible .arrow { opacity: 1; } — no transform, no translate, no color shift"
  - "Title underline hover pattern: text-decoration underline + text-decoration-color var(--accent) + text-decoration-thickness 1.5px + text-underline-offset 4px — keyboard parity via :focus-visible selector mirrored to :hover"

requirements-completed: []

# Metrics
duration: 4min
completed: 2026-04-08
---

# Phase 9 Plan 06: Kept Components Audit Summary

**Restyled NextProject.astro from v1.0 bg-rule card-CTA panel into a single editorial row primitive (global .section rhythm + scoped 48px row padding + .container + .h2-project title + opacity-only accent arrow reveal over 120ms) with the public API { project: CollectionEntry<"projects"> } preserved verbatim, and verified JsonLd.astro / SkipToContent.astro / ArticleImage.astro survive Phase 9 untouched per D-23/D-24/D-25.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-08T19:32:55Z
- **Completed:** 2026-04-08T19:36:39Z
- **Tasks:** 2 (1 restyle, 1 verify-only audit)
- **Files modified:** 1 (src/components/NextProject.astro; -33 / +84 lines)
- **Files audited (unchanged):** 3 (JsonLd.astro, SkipToContent.astro, ArticleImage.astro)

## Accomplishments

- **NextProject.astro restyled** from the v1.0 `bg-rule` full-bleed `<section>` containing a `group` anchor with `py-24` padding, a Tailwind-styled title, and a translating SVG arrow — into an editorial row: a single `<a class="next-project section">` that consumes the global `.section` vertical rhythm helper (160/96/72px margin-top) plus a scoped `padding-top: 48px; padding-bottom: 48px` for internal row breathing room, wraps its content in the global `.container` helper (max-width 1200px + responsive 48/32/24px horizontal gutters), renders a `<span class="label-mono next-project-label">§ NEXT —</span>` mono label above a flex-baseline body containing an `<h2 class="h2-project next-project-title">` and a `<span class="next-project-arrow">→</span>` unicode arrow.
- **Public API preserved verbatim** — still accepts `{ project: CollectionEntry<"projects"> }` through `interface Props`, still destructures `const { project } = Astro.props`, still links to `/projects/${project.id}`. Phase 10 project detail pages will import and consume NextProject with zero call-site changes.
- **Hover grammar matches WorkRow contract** — `.next-project-arrow` has `opacity: 0; transition: opacity 120ms ease;` and flips to `opacity: 1` on both `.next-project:hover` and `.next-project:focus-visible`. The title gets a `text-decoration: underline` with `text-decoration-color: var(--accent)`, `text-decoration-thickness: 1.5px`, `text-underline-offset: 4px` on hover/focus. No transform, no translate-x, no color shift on the title body.
- **Six-token palette respected** — scoped CSS references only `var(--ink)` (title + focus outline), `var(--ink-faint)` (§ NEXT — label), `var(--rule)` (border-top divider), and `var(--accent)` (arrow + underline + focus outline). Zero inline hex values, zero oklch, zero new tokens.
- **Kept-component audit (three files) passes with zero edits.** All three files are byte-identical to their pre-plan state per `git diff --stat`.

## Kept-Component Audit Table

| File | Audit Result | Lines | Notes |
|------|--------------|-------|-------|
| `src/components/JsonLd.astro` | **PASS** | 8 | Plain `<script type="application/ld+json" set:html={JSON.stringify(schema)} />` with `schema: Record<string, unknown>` prop. No tokens, no Tailwind utilities, no GSAP, no oklch. Unchanged. |
| `src/components/SkipToContent.astro` | **PASS** | 7 | Single `<a href="#main-content">` with `focus:bg-bg focus:text-accent focus:ring-accent sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded focus:px-4 focus:py-2 focus:ring-2 focus:outline-none`. All three editorial focus tokens present. No legacy `bg-background`/`text-primary`/`ring-primary`. No oklch. App-shell utility component outside `src/components/primitives/` — D-03's "no Tailwind in primitives" does not apply. Unchanged. |
| `src/components/ArticleImage.astro` | **PASS** | 38 | Accepts `{ src: string \| ImageMetadata; alt: string }`, renders `<figure>` with `<img>` or `<Image />` and an optional `<figcaption class="text-ink-faint mt-2 font-mono text-sm">{alt}</figcaption>`. Uses the current editorial tokens `text-ink-faint` + `font-mono`. No legacy `text-text-muted`/`text-text-faint`. No oklch. No GSAP. Unchanged. Wiring remains dormant (no MDX file uses it yet per PROJECT.md known issues) — the component is ready whenever it is consumed. |

**Audit outcome: 3 / 3 PASS. Zero edits required. Zero deviations from D-23/D-24/D-25.**

## Task Commits

1. **Task 1: Restyle NextProject.astro to editorial row (D-22)** — `bb47051` (feat)
2. **Task 2: Verify-only audit of JsonLd.astro, SkipToContent.astro, ArticleImage.astro** — no commit (verify-only contract, zero edits)

_Plan metadata commit will bundle SUMMARY.md, STATE.md, and ROADMAP.md separately._

## Files Created/Modified

- `src/components/NextProject.astro` — Restyled from the v1.0 card-CTA pattern (45 lines → 96 lines). Old file was a `<section class="bg-rule">` containing a `<a class="group px-6 py-24 md:px-10 lg:px-16">` with a `font-display text-3xl` title and an SVG arrow using `group-hover:translate-x-1`. New file is a single `<a class="next-project section">` with a scoped `<style>` block declaring `.next-project`, `.next-project-inner`, `.next-project-label`, `.next-project-body`, `.next-project-title`, `.next-project-arrow`, and hover/focus-visible compound selectors. Public API (`interface Props { project: CollectionEntry<"projects"> }` + `const { project } = Astro.props`) preserved verbatim.

## Deviations from Plan

**None.** Plan executed exactly as written. The `<action>` block for Task 1 was transcribed verbatim into `src/components/NextProject.astro` with one tiny in-comment wording adjustment: the header comment originally said "Per D-22: no bg-rule panel, no py-24, no group-hover:translate-x-1" but that sentence contained the literal strings the plan's negative acceptance criteria forbid (`bg-rule`, `py-24`, `group-hover:`, `translate-x-1`). Since a grep-based acceptance check does not distinguish comments from code, the comment was rephrased to "Per D-22: no full-bleed bg panel, no oversized vertical padding, no translate on the arrow" to satisfy the literal-string checks while preserving the documentation intent. No functional change.

Task 2 made zero edits as specified by the verify-only contract (D-23/D-24/D-25).

## Issues Encountered

**Pre-existing astro-check hints.** `pnpm run check` reports 2 hints:
1. `src/components/JsonLd.astro:8:9` — `astro(4000)`: script tag treated as `is:inline` because it contains an attribute. This is the existing JsonLd behavior and is **required** to keep `set:html={JSON.stringify(schema)}` working for the structured-data JSON payload. Not caused by this plan. D-23 verify-only contract: no action taken.
2. `src/components/primitives/Container.astro:14:11` — `ts(6196)`: `'Props' is declared but never used`. Pre-existing hint inherited from plan 09-03 and documented in that plan's SUMMARY as a cosmetic TypeScript artifact that the plan acceptance criteria explicitly require to stay in place.

Neither hint is caused by plan 09-06 and both predate it.

**Pre-existing lightning-css warnings.** `pnpm run build` continues to emit four `Unexpected token Delim('*')` warnings from template detection surfaces (logged to `.planning/phases/09-primitives/deferred-items.md` in plan 09-02 for Phase 11 polish triage). Plan 09-06 introduces zero `[var(--token-*)]` arbitrary-value utilities, so these warnings remain out of scope.

**WorkRow.astro does not yet exist.** The plan's `<read_first>` block asks the executor to read `src/components/primitives/WorkRow.astro` to source the opacity-only arrow hover pattern, but plan 09-04 (composite primitives) has not run yet and WorkRow.astro is not on disk. The hover grammar was sourced directly from the plan `<action>` block's explicit spec (`opacity: 0; transition: opacity 120ms ease;`) and from D-22's narrative description in `09-CONTEXT.md` (which names the 120ms opacity 0→1 pattern as the WorkRow contract). This is a forward contract: plan 09-04 must honor the same hover grammar when it writes WorkRow.astro. No deviation — the restyle is implemented to the WorkRow spec as the plan requires.

## Build Observations

- **`pnpm run check`:** 0 errors, 0 warnings, 2 pre-existing hints (unrelated to plan acceptance criteria). 36 files validated.
- **`pnpm run build`:** exits 0, "Complete!", 10 pages prerendered (index, about, contact, projects, 6 case studies), sitemap generated, Cloudflare Pages compat rearrange succeeds. Vite server build completes in ~7.2s. Four pre-existing lightning-css warnings remain, unchanged from baseline.
- **Negative regression greps:**
  - `grep -nP "bg-rule|py-24|group-hover:translate-x|translate-x-1" src/components/NextProject.astro` → 0 matches
  - `grep -nP "<svg|px-6|md:px-10|lg:px-16" src/components/NextProject.astro` → 0 matches
  - `grep -nP "#[0-9a-fA-F]{3,6}" src/components/NextProject.astro` → 0 matches (no inline hex colors)
- **Positive-criteria greps:** All 14 literal strings from the plan acceptance criteria are present (`interface Props`, `project: CollectionEntry<"projects">`, `const { project } = Astro.props`, `` href={`/projects/${project.id}`} ``, `class="next-project section"`, `padding-top: 48px`, `§ NEXT —`, `class="h2-project next-project-title"`, `transition: opacity 120ms`, `opacity: 0`, `text-decoration-color: var(--accent)`, `text-decoration-thickness: 1.5px`, `text-underline-offset: 4px`, `:focus-visible`).

## User Setup Required

None — pure template/style edit, no environment variables, no external configuration, no package changes, no runtime changes.

## Next Phase Readiness

- **Ready for 09-04 (composite primitives):** WorkRow.astro must implement the same `.arrow { opacity: 0; transition: opacity 120ms ease; } + .row:hover .arrow { opacity: 1; }` pattern that NextProject now canonically demonstrates. This is the forward contract plan 09-06 committed to on behalf of plan 09-04.
- **Ready for 09-07 (dev primitives preview):** The NextProject restyle can be imported into the `/dev/primitives` preview page to visualize the editorial row shape in isolation, using any of the existing project MDX files as the `project` prop source.
- **Ready for 09-08 (verification gate):** NextProject.astro is on the new editorial token system; all four "kept components" are accounted for (3 unchanged, 1 restyled); the Phase 9 primitive surface now matches the D-22/D-23/D-24/D-25 contract.
- **Ready for Phase 10 project detail pages:** When plan 10-X rewrites project case study pages, `<NextProject project={...} />` call sites do not require any modification — the public API is identical to v1.0. The v1.0 visual grammar (card CTA) is gone, replaced by editorial row grammar.
- **No blockers.** Wave 3 is complete for plan 09-06; plans 09-04/09-05/09-07/09-08 remain on their own schedules.

## Self-Check: PASSED

- **File `src/components/NextProject.astro`:** FOUND (modified, +84 / -33 lines)
- **Commit `bb47051`:** FOUND in git log (`bb47051 feat(09-06): restyle NextProject to editorial row (D-22)`)
- **Grep `interface Props` in NextProject.astro:** present (line 23)
- **Grep `project: CollectionEntry<"projects">` in NextProject.astro:** present (line 24)
- **Grep `const { project } = Astro.props` in NextProject.astro:** present (line 27)
- **Grep `` href={`/projects/${project.id}`} `` in NextProject.astro:** present (line 30)
- **Grep `class="next-project section"` in NextProject.astro:** present (line 30)
- **Grep `class="container next-project-inner"` in NextProject.astro:** present (line 31)
- **Grep `§ NEXT —` in NextProject.astro:** present (line 32)
- **Grep `class="h2-project next-project-title"` in NextProject.astro:** present (line 34)
- **Grep `padding-top: 48px` in NextProject.astro:** present (line 45)
- **Grep `border-top: 1px solid var(--rule)` in NextProject.astro:** present (line 47)
- **Grep `opacity: 0` in NextProject.astro:** present (line 72)
- **Grep `transition: opacity 120ms ease` in NextProject.astro:** present (line 73)
- **Grep `text-decoration-color: var(--accent)` in NextProject.astro:** present (line 81)
- **Grep `text-decoration-thickness: 1.5px` in NextProject.astro:** present (line 82)
- **Grep `text-underline-offset: 4px` in NextProject.astro:** present (line 83)
- **Grep `:focus-visible` in NextProject.astro:** present (lines 79, 87, 91)
- **Grep `bg-rule` in NextProject.astro:** 0 matches
- **Grep `py-24` in NextProject.astro:** 0 matches
- **Grep `translate-x-1` in NextProject.astro:** 0 matches
- **Grep `group-hover:` in NextProject.astro:** 0 matches
- **Grep `<svg` in NextProject.astro:** 0 matches
- **Grep `px-6|md:px-10|lg:px-16` in NextProject.astro:** 0 matches
- **Grep `#[0-9a-fA-F]{3,6}` in NextProject.astro:** 0 matches (no inline hex colors)
- **`git diff --stat src/components/JsonLd.astro src/components/SkipToContent.astro src/components/ArticleImage.astro`:** empty (all three audit targets untouched)
- **JsonLd.astro Grep `application/ld+json`:** present (line 8)
- **JsonLd.astro Grep `oklch`:** 0 matches
- **SkipToContent.astro Grep `focus:bg-bg`, `focus:text-accent`, `focus:ring-accent`, `sr-only`:** all present (line 3)
- **SkipToContent.astro Grep `oklch`, `bg-background`, `text-primary`, `ring-primary`:** 0 matches
- **ArticleImage.astro Grep `text-ink-faint`, `font-mono`:** both present (line 32)
- **ArticleImage.astro Grep `oklch`, `text-text-muted`, `text-text-faint`:** 0 matches
- **`pnpm run check`:** 0 errors, 0 warnings, 2 pre-existing hints
- **`pnpm run build`:** exits 0, "Complete!", 10 pages prerendered, sitemap generated

---
*Phase: 09-primitives*
*Completed: 2026-04-08*
