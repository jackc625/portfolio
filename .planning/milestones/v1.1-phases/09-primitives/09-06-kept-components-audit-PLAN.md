---
phase: 09-primitives
plan: 06
type: execute
wave: 3
depends_on: [09-02]
files_modified:
  - src/components/NextProject.astro
autonomous: true
requirements: []

must_haves:
  truths:
    - "NextProject.astro is restyled to a single editorial row — no bg-rule panel, no py-24, no group-hover:translate-x-1, no full-bleed wrapper"
    - "NextProject.astro public API is unchanged: still accepts { project: CollectionEntry<'projects'> }"
    - "NextProject.astro uses the .h2-project global class + opacity-only hover arrow (matching WorkRow's 120ms transition) + .section rhythm top margin"
    - "JsonLd.astro, SkipToContent.astro, and ArticleImage.astro are audited with no edits — any deviation requires reopening the audit decision (D-23/D-24/D-25)"
    - "No new design tokens are introduced, no inline hex colors, no oklch, no GSAP"
  artifacts:
    - path: src/components/NextProject.astro
      provides: Editorial next-project link row (not a card-CTA panel)
      contains: "h2-project"
  key_links:
    - from: src/components/NextProject.astro
      to: src/styles/global.css .h2-project class from plan 02
      via: NextProject title uses the global .h2-project typography class
      pattern: "h2-project"
    - from: src/components/NextProject.astro hover transition
      to: src/components/primitives/WorkRow.astro .work-arrow opacity pattern
      via: Same 120ms ease opacity 0→1 transition on the arrow, no translate
      pattern: "transition: opacity 120ms"
---

<objective>
Audit the four kept components per D-22…D-25. Three (`JsonLd`, `SkipToContent`, `ArticleImage`) are verify-only — read, confirm clean, no edits. One (`NextProject`) is restyled from the v1.0 card-CTA panel shape into an editorial next-row primitive that matches `WorkRow`'s hover grammar.

**Purpose:** `NextProject.astro` currently uses `bg-rule` (full-bleed panel), `py-24` (card-sized padding), and `group-hover:translate-x-1` (translated arrow) — all contradict the editorial system. Restyling it now (Phase 9) keeps the "primitives own the grammar" discipline; deferring to Phase 10 would mean adding visual work on top of the page port.

**Output:** One commit that rewrites `src/components/NextProject.astro` to the editorial row shape, with the public API (`{ project: CollectionEntry<'projects'> }`) unchanged so Phase 10 project detail pages can still consume it without modification.

This plan runs in parallel with plan 09-03 (stateless primitives) because neither touches overlapping files. Both depend on plan 09-02 (global CSS foundations) landing `.h2-project` and related global helpers.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/09-primitives/09-CONTEXT.md
@src/components/NextProject.astro
@src/components/JsonLd.astro
@src/components/SkipToContent.astro
@src/components/ArticleImage.astro
@src/styles/global.css
@design-system/MASTER.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restyle NextProject.astro to editorial row (D-22)</name>
  <files>src/components/NextProject.astro</files>
  <read_first>
    - src/components/NextProject.astro (entire current file — 45 lines — before rewriting; you must see the current Props import and Astro.props destructuring so the public API stays stable)
    - src/components/primitives/WorkRow.astro (from plan 04 task 3 — the source of the opacity-only arrow hover pattern; the NextProject hover arrow must match)
    - src/styles/global.css (confirm `.h2-project` exists from plan 02)
    - mockup.html lines 69–74 (.h2-project spec — the class NextProject's title text uses)
    - .planning/phases/09-primitives/09-CONTEXT.md D-22 (NextProject restyle specifics) and D-13 (.section rhythm)
  </read_first>
  <action>
REPLACE the entire contents of `src/components/NextProject.astro` with the following:

**Astro frontmatter script (write between `---` fences at top of the .astro file):**

```ts
/**
 * NextProject — editorial next-project link row (D-22 Phase 9 restyle)
 *
 * Rendered at the foot of project detail pages. Editorial grammar:
 *   - § NEXT — mono label (matching SectionHeader style)
 *   - .h2-project title (Geist 500, 1.75rem) — sans-serif editorial
 *   - accent arrow that hover-reveals via opacity 0 → 1 over 120ms
 *     (matching WorkRow.astro .work-arrow pattern — NO translate)
 *   - .section top margin for vertical rhythm (160/96/72px per breakpoint)
 *   - 1px --rule bottom border to separate from the footer
 *
 * Public API unchanged per D-22: still accepts { project } — Phase 10
 * consumers do not need to update call sites.
 *
 * Per D-22: no bg-rule panel, no py-24, no group-hover:translate-x-1
 * Per D-16: only --ink, --ink-faint, --rule, --accent tokens
 * Per D-03: no Tailwind utility classes in the new markup (exception for
 *           the :focus-visible outline which uses the token-driven var colors)
 */
import type { CollectionEntry } from "astro:content";

interface Props {
  project: CollectionEntry<"projects">;
}

const { project } = Astro.props;
```

**Astro template markup (write BELOW the closing `---` frontmatter fence):**

```astro

<a class="next-project section" href={`/projects/${project.id}`}>
  <div class="container next-project-inner">
    <span class="label-mono next-project-label">§ NEXT —</span>
    <div class="next-project-body">
      <h2 class="h2-project next-project-title">{project.data.title}</h2>
      <span class="next-project-arrow" aria-hidden="true">→</span>
    </div>
  </div>
</a>

<style>
  .next-project {
    display: block;
    color: inherit;
    text-decoration: none;
    padding-top: 48px;
    padding-bottom: 48px;
    border-top: 1px solid var(--rule);
  }

  .next-project-inner {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .next-project-label {
    color: var(--ink-faint);
  }

  .next-project-body {
    display: flex;
    align-items: baseline;
    gap: 16px;
  }

  .next-project-title {
    color: var(--ink);
  }

  .next-project-arrow {
    color: var(--accent);
    opacity: 0;
    transition: opacity 120ms ease;
    font-size: 1.5rem;
    line-height: 1;
  }

  .next-project:hover .next-project-title,
  .next-project:focus-visible .next-project-title {
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-decoration-thickness: 1.5px;
    text-underline-offset: 4px;
  }

  .next-project:hover .next-project-arrow,
  .next-project:focus-visible .next-project-arrow {
    opacity: 1;
  }

  .next-project:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
  }
</style>
```

Notes on implementation:

- The root `<a>` element gets BOTH `.next-project` (scoped layout) AND `.section` (global rhythm from plan 02). The `.section` class provides the `margin-top: 160px / 96px / 72px` responsive ladder.
- **Total whitespace above NextProject (WARNING 3 documentation):** `.section` margin-top (160px desktop / 96px tablet / 72px mobile) PLUS `.next-project` scoped `padding-top: 48px` = **208px / 144px / 120px** of editorial breathing room before the `§ NEXT —` mono label appears. This combined spacing is INTENTIONAL per D-13 (`.section` rhythm lives globally) + D-22 (NextProject is a row primitive with its own internal padding). It is NOT a stacking bug. The 48px padding-top gives the `§ NEXT —` label additional vertical headroom INSIDE the row before the title, independent of the rhythmic gap BETWEEN the preceding section and the row boundary.
- A 1px `border-top: 1px solid var(--rule)` sits above the content to separate from the preceding page body. D-22 says "1px --rule bottom border to separate from footer"; using `border-top` on NextProject accomplishes the same visual divider since NextProject sits ABOVE the footer — the rule renders just above its content. If Phase 10 wiring places NextProject directly above Footer, this border is the only divider needed.
- `padding-top: 48px; padding-bottom: 48px;` gives the row breathing room. D-22 did not specify an exact padding value; 48px matches the `.container` horizontal padding and reads well with the `.h2-project` 1.75rem type size.
- The arrow is NOT wrapped in an `<svg>` — it's a unicode `→` character to match `WorkRow.astro` (opacity-only hover reveal). No translate-x. `font-size: 1.5rem` makes the arrow visually proportional to the 1.75rem title.
- `:focus-visible` is honored on both the title underline and the arrow reveal for keyboard users
- Public API `{ project: CollectionEntry<"projects"> }` unchanged — no new props, no renamed props. Phase 10 project detail pages import `NextProject` and pass `project` exactly as before.
- No `text-accent`, `bg-rule`, `font-mono`, `py-24`, `group`, `group-hover:*` — these are all v1.0 patterns killed by the restyle
- No `translate-x-1` or any transform on hover — opacity only (D-22 explicit)
  </action>
  <verify>
    <automated>rtk pnpm run check</automated>
  </verify>
  <acceptance_criteria>
    - src/components/NextProject.astro contains the literal string `interface Props`
    - src/components/NextProject.astro contains the literal string `project: CollectionEntry<"projects">` (public API unchanged)
    - src/components/NextProject.astro contains the literal string `const { project } = Astro.props`
    - src/components/NextProject.astro contains the literal string `href={\`/projects/${project.id}\`}`
    - src/components/NextProject.astro contains the literal string `class="next-project section"` (both the scoped class and the global .section class)
    - src/components/NextProject.astro contains the literal string `padding-top: 48px` (WARNING 3 — documents the intentional 208/144/120px total stack above the row, composed of `.section` margin-top + scoped padding-top)
    - src/components/NextProject.astro contains the literal string `§ NEXT —` (or equivalent where the render output equals `§ NEXT —`)
    - src/components/NextProject.astro contains the literal string `class="h2-project next-project-title"` (or equivalent class:list with both classes)
    - src/components/NextProject.astro contains the literal string `transition: opacity 120ms` (matching WorkRow)
    - src/components/NextProject.astro contains the literal string `opacity: 0` on the arrow
    - src/components/NextProject.astro contains the literal string `text-decoration-color: var(--accent)` for the title underline
    - src/components/NextProject.astro contains the literal string `text-decoration-thickness: 1.5px`
    - src/components/NextProject.astro contains the literal string `text-underline-offset: 4px`
    - src/components/NextProject.astro contains `:focus-visible` (keyboard parity)
    - src/components/NextProject.astro does NOT contain the literal string `bg-rule`
    - src/components/NextProject.astro does NOT contain the literal string `py-24`
    - src/components/NextProject.astro does NOT contain the literal string `translate-x-1`
    - src/components/NextProject.astro does NOT contain the literal string `group-hover:`
    - src/components/NextProject.astro does NOT contain the literal string `group\b` (the old v1.0 `class="group"` pattern)
    - src/components/NextProject.astro does NOT contain any `<svg>` element (unicode arrow only)
    - src/components/NextProject.astro does NOT contain the literal string `px-6`, `md:px-10`, `lg:px-16` (v1.0 hardcoded paddings)
    - src/components/NextProject.astro does NOT contain any inline hex color value
    - `rtk pnpm run check` passes
    - `rtk pnpm run build` passes
  </acceptance_criteria>
  <done>NextProject.astro restyled to editorial row, public API stable, hover matches WorkRow pattern</done>
</task>

<task type="auto">
  <name>Task 2: Verify-only audit of JsonLd.astro, SkipToContent.astro, ArticleImage.astro</name>
  <files>src/components/JsonLd.astro, src/components/SkipToContent.astro, src/components/ArticleImage.astro</files>
  <read_first>
    - src/components/JsonLd.astro (entire file — 8 lines — should be plain script tag with no tokens)
    - src/components/SkipToContent.astro (entire file — 6 lines — should use focus:bg-bg focus:text-accent focus:ring-accent)
    - src/components/ArticleImage.astro (entire file — 37 lines — should use text-ink-faint font-mono)
    - .planning/phases/09-primitives/09-CONTEXT.md D-23 (JsonLd verify-only), D-24 (SkipToContent verify-only), D-25 (ArticleImage verify-only)
  </read_first>
  <action>
This task is a **READ-ONLY audit**. You make ZERO edits to these three files. You record observations in the plan SUMMARY written by task 1's output step.

For each file, confirm:

**JsonLd.astro:**
- File is 8 lines or fewer
- File contains `<script type="application/ld+json"`
- File takes `schema: Record<string, unknown>` as a prop
- File does NOT contain any color token reference (no `var(--`, no hex color, no `oklch`)
- File does NOT contain any Tailwind utility class
- File does NOT contain any `import gsap` or GSAP reference
- **Audit result: PASS if all checks pass, no edits needed**

**SkipToContent.astro:**
- File is around 6 lines
- File contains a single `<a>` with `href="#main-content"`
- File uses `focus:bg-bg`, `focus:text-accent`, `focus:ring-accent` Tailwind utilities (note: these are on an APP-SHELL utility component, NOT inside a primitive — D-03's "no Tailwind in primitives" does NOT apply because this file lives at `src/components/SkipToContent.astro`, not `src/components/primitives/`)
- File contains `sr-only` and `focus:not-sr-only` for accessibility
- File does NOT contain any legacy v1.0 token like `bg-background`, `text-primary`, `ring-primary`
- File does NOT contain any oklch value
- **Audit result: PASS if all checks pass, no edits needed**

**ArticleImage.astro:**
- File is around 37 lines
- File accepts `src: string | ImageMetadata` and `alt: string` props
- File uses `text-ink-faint` and `font-mono` Tailwind utilities for the figcaption
- File does NOT contain any legacy v1.0 token like `text-text-muted`, `text-text-faint`
- File does NOT contain any oklch value
- File does NOT contain any GSAP import
- **Audit result: PASS if all checks pass, no edits needed**

If ANY audit check fails for any file, STOP and report the failure. Do NOT make edits. The D-23/D-24/D-25 contract is "verify-only, zero edits expected" — an unexpected finding requires re-opening the decision with the user.

After the audit, proceed to the done step for this task. Record the audit results in 09-06-SUMMARY.md in a table:

| File | Audit Result | Notes |
|------|--------------|-------|
| JsonLd.astro | PASS | 8 lines, no tokens, no changes |
| SkipToContent.astro | PASS | Uses focus:bg-bg focus:text-accent focus:ring-accent as expected |
| ArticleImage.astro | PASS | Uses text-ink-faint font-mono as expected |

If any row is not PASS, write the task result as BLOCKED and escalate before continuing.
  </action>
  <verify>
    <automated>rtk grep -l "focus:bg-bg" src/components/SkipToContent.astro</automated>
  </verify>
  <acceptance_criteria>
    - File `src/components/JsonLd.astro` is unchanged (git diff --stat returns no changes for this file in this task)
    - File `src/components/SkipToContent.astro` is unchanged
    - File `src/components/ArticleImage.astro` is unchanged
    - JsonLd.astro still contains `<script type="application/ld+json"`
    - JsonLd.astro does NOT contain the literal string `oklch`
    - SkipToContent.astro contains the literal string `focus:bg-bg`
    - SkipToContent.astro contains the literal string `focus:text-accent`
    - SkipToContent.astro contains the literal string `focus:ring-accent`
    - SkipToContent.astro contains `sr-only`
    - SkipToContent.astro does NOT contain `oklch`
    - ArticleImage.astro contains the literal string `text-ink-faint`
    - ArticleImage.astro contains the literal string `font-mono`
    - ArticleImage.astro does NOT contain the literal string `text-text-muted` (legacy v1.0 token)
    - ArticleImage.astro does NOT contain the literal string `text-text-faint` (legacy v1.0 token)
    - ArticleImage.astro does NOT contain the literal string `oklch`
  </acceptance_criteria>
  <done>Three kept components audited, no edits required, audit PASS recorded in SUMMARY</done>
</task>

</tasks>

<verification>
- NextProject.astro rewritten to editorial row shape, public API stable
- JsonLd, SkipToContent, ArticleImage unchanged
- `rtk pnpm run build`, `check`, `lint` all pass
- Negative regression: `rtk grep -nP "bg-rule|py-24|group-hover:translate-x|translate-x-1" src/components/NextProject.astro` returns no matches
</verification>

<success_criteria>
- NextProject.astro is an editorial row, not a card-CTA panel
- NextProject.astro hover matches WorkRow.astro (opacity 0→1 over 120ms, underline on title, no translate)
- NextProject.astro public API `{ project: CollectionEntry<"projects"> }` is stable
- Verify-only audit recorded for JsonLd, SkipToContent, ArticleImage
- build + check + lint all pass
</success_criteria>

<output>
After completion, create `.planning/phases/09-primitives/09-06-SUMMARY.md` recording:
- NextProject restyle summary (what was removed, what replaced it)
- Kept-component audit table (3 rows, PASS/FAIL per file)
- Any deviations from the audit expectations (should be zero)
- Commit SHA
</output>
