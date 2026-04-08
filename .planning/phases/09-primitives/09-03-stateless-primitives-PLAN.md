---
phase: 09-primitives
plan: 03
type: execute
wave: 3
depends_on: [09-02]
files_modified:
  - src/components/primitives/Container.astro
  - src/components/primitives/MetaLabel.astro
  - src/components/primitives/StatusDot.astro
  - src/components/primitives/SectionHeader.astro
autonomous: true
requirements: []

must_haves:
  truths:
    - "Container.astro renders as an `as=` dynamic tag wrapper applying the global .container class, forwarding an optional additional class"
    - "MetaLabel.astro renders a span with the .label-mono global class and a color variant (ink/ink-muted/ink-faint)"
    - "StatusDot.astro renders an inline-flex wrapper with a 6px accent dot followed by a MetaLabel, per MASTER §5.7"
    - "SectionHeader.astro renders the flex-baseline `§ NN — TITLE` label + optional count pair followed by a .section-rule divider, per MASTER §5.4"
    - "Each primitive is self-contained and uses ONLY editorial classes (.label-mono, .meta-mono, .container, .section-rule) plus scoped <style> blocks — no raw Tailwind utilities in markup, no new color tokens"
  artifacts:
    - path: src/components/primitives/Container.astro
      provides: Global horizontal padding wrapper for every page region
      min_lines: 18
    - path: src/components/primitives/MetaLabel.astro
      provides: Uppercase mono caption with color variant prop
      min_lines: 15
    - path: src/components/primitives/StatusDot.astro
      provides: 6px accent dot + label composition (consumes MetaLabel)
      min_lines: 20
    - path: src/components/primitives/SectionHeader.astro
      provides: Numbered section opener with label + count + rule divider
      min_lines: 25
  key_links:
    - from: src/components/primitives/StatusDot.astro
      to: src/components/primitives/MetaLabel.astro
      via: import default from '../primitives/MetaLabel.astro' and compose as child
      pattern: "import MetaLabel"
    - from: src/components/primitives/SectionHeader.astro
      to: src/styles/global.css .section-rule
      via: SectionHeader renders a `<div class="section-rule">` after the label row
      pattern: "section-rule"
---

<objective>
Create the four stateless low-level primitives that have no cross-dependencies (Container, MetaLabel, StatusDot consumes MetaLabel, SectionHeader). These four are parallel-safe with plan 06's kept-component audit and must land before plan 04's composite primitives (Header, Footer, WorkRow, MobileMenu) which use Container and MetaLabel internally.

**Purpose:** Build the bottom of the primitive stack first so composite primitives in plan 04 can import them. Every primitive here is pure-props, pure-layout, no runtime behavior, no client JS.

**Output:** Four new `.astro` files under `src/components/primitives/` that render verbatim to the mockup.html class shapes, using scoped `<style>` blocks only for component-local layout (per D-14) and editorial named classes only (per D-03).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/09-primitives/09-CONTEXT.md
@design-system/MASTER.md
@mockup.html
@src/styles/global.css

<interfaces>
<!-- Primitive prop contracts per MASTER §5.3, §5.4, §5.6, §5.7 -->

Container.astro (MASTER §5.3):
```ts
interface Props {
  as?: keyof HTMLElementTagNameMap; // default "div"
  class?: string;                   // appended after .container
}
```

MetaLabel.astro (MASTER §5.6):
```ts
interface Props {
  text: string;                                      // displayed text
  color?: "ink" | "ink-muted" | "ink-faint";         // default "ink"
  class?: string;
}
```

StatusDot.astro (MASTER §5.7):
```ts
interface Props {
  label: string;                                     // e.g., "AVAILABLE FOR WORK"
}
```

SectionHeader.astro (MASTER §5.4):
```ts
interface Props {
  number: string;                                    // e.g., "01"
  title: string;                                     // e.g., "WORK"
  count?: string;                                    // e.g., "4 / 4"
}
```

Global classes from plan 09-02 that these primitives consume (already in src/styles/global.css):
- .label-mono — Geist Mono 500, 0.75rem, uppercase, 0.12em letter-spacing
- .meta-mono — Geist Mono 400, 0.8125rem, 0.02em letter-spacing
- .tabular — font-variant-numeric tabular-nums
- .container — max-width 1200px, responsive padding
- .section-rule — 1px var(--rule) divider with 16px/24px margins
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Container.astro (MASTER §5.3)</name>
  <files>src/components/primitives/Container.astro</files>
  <read_first>
    - design-system/MASTER.md lines 369–406 (§5.3 Container spec)
    - mockup.html lines 43–48 (.container CSS values — already in global.css from plan 02)
    - src/styles/global.css (confirm .container selector exists after plan 02)
    - .planning/phases/09-primitives/09-CONTEXT.md D-02, D-03, D-04, D-14
  </read_first>
  <action>
CREATE a new file at `src/components/primitives/Container.astro` with the following content:

**Astro frontmatter script (write between `---` fences at top of the .astro file):**

```ts
/**
 * Container — MASTER §5.3
 *
 * Horizontal padding wrapper for every page region (header, main sections,
 * footer). Applies the global .container class which resolves to
 * max-width: var(--container-max) (1200px) with responsive padding
 * (48px / 32px / 24px) defined in src/styles/global.css.
 *
 * Per D-02: primitive lives in src/components/primitives/
 * Per D-03: no Tailwind utilities inside primitive markup
 * Per D-04: props stay as MASTER §5.3 specifies (as? + class?)
 */
interface Props {
  as?: keyof HTMLElementTagNameMap;
  class?: string;
}

const { as: Tag = "div", class: className } = Astro.props;
```

**Astro template markup (write BELOW the closing `---` frontmatter fence):**

```astro

<Tag class:list={["container", className]}>
  <slot />
</Tag>
```

Notes on implementation:

- The `as` prop uses the rename pattern `{ as: Tag = "div" }` so the JSX-style `<Tag>` opening tag works — Astro requires capital-letter variable names for dynamic tags
- `class:list` is Astro's built-in helper; it handles undefined gracefully, so passing `className` when the caller didn't pass `class` is safe
- No scoped `<style>` block — all styling comes from the global `.container` class in `src/styles/global.css`
- No client `<script>` — zero runtime behavior
- No import of other primitives — Container is leaf-level
  </action>
  <verify>
    <automated>rtk pnpm run check</automated>
  </verify>
  <acceptance_criteria>
    - File `src/components/primitives/Container.astro` exists
    - File contains the literal string `interface Props`
    - File contains the literal string `as?: keyof HTMLElementTagNameMap`
    - File contains the literal string `class?: string`
    - File contains the literal string `{ as: Tag = "div", class: className } = Astro.props`
    - File contains the literal string `class:list={["container", className]}`
    - File contains `<slot />`
    - File does NOT contain any `import` statement (no dependencies)
    - File does NOT contain a `<style>` block (all CSS is global)
    - File does NOT contain a `<script>` block (no runtime behavior)
    - File does NOT contain any Tailwind utility class like `bg-`, `text-`, `p-`, `m-`, `flex`, `grid` in the markup (D-03 no raw Tailwind inside primitives)
    - `rtk pnpm run check` passes with the new file in place
  </acceptance_criteria>
  <done>Container.astro exists, matches MASTER §5.3 prop signature, uses global .container class, astro check passes</done>
</task>

<task type="auto">
  <name>Task 2: Create MetaLabel.astro (MASTER §5.6)</name>
  <files>src/components/primitives/MetaLabel.astro</files>
  <read_first>
    - design-system/MASTER.md lines 522–557 (§5.6 MetaLabel spec)
    - mockup.html lines 86–92 (.label-mono CSS values — already in global.css from plan 02)
    - .planning/phases/09-primitives/09-CONTEXT.md D-02, D-03, D-04, D-14, D-16
  </read_first>
  <action>
CREATE a new file at `src/components/primitives/MetaLabel.astro` with the following content:

**Astro frontmatter script (write between `---` fences at top of the .astro file):**

```ts
/**
 * MetaLabel — MASTER §5.6
 *
 * Small uppercase mono caption used for status labels, contact labels,
 * hero metadata, section counts. Typography comes from the global
 * .label-mono class (Geist Mono 500, 0.75rem, uppercase, 0.12em).
 *
 * Per D-02: primitive lives in src/components/primitives/
 * Per D-03: no Tailwind utilities inside primitive markup
 * Per D-04: props stay as MASTER §5.6 specifies (text + color? + class?)
 * Per D-16: no new color tokens — only --ink, --ink-muted, --ink-faint
 */
interface Props {
  text: string;
  color?: "ink" | "ink-muted" | "ink-faint";
  class?: string;
}

const { text, color = "ink", class: className } = Astro.props;
```

**Astro template markup (write BELOW the closing `---` frontmatter fence):**

```astro

<span class:list={["label-mono", `meta-label--${color}`, className]}>
  {text}
</span>

<style>
  .meta-label--ink {
    color: var(--ink);
  }
  .meta-label--ink-muted {
    color: var(--ink-muted);
  }
  .meta-label--ink-faint {
    color: var(--ink-faint);
  }
</style>
```

Notes on implementation:

- The scoped `<style>` block only declares color variants — typography comes entirely from the global `.label-mono` class (plan 02 landed it in global.css)
- Color token references stay on the locked six-color palette (D-16): --ink, --ink-muted, --ink-faint
- The `meta-label--${color}` class is scoped (Astro auto-scopes it) so it cannot collide with anything else
- No client `<script>`, no imports — leaf-level primitive
  </action>
  <verify>
    <automated>rtk pnpm run check</automated>
  </verify>
  <acceptance_criteria>
    - File `src/components/primitives/MetaLabel.astro` exists
    - File contains the literal string `interface Props`
    - File contains the literal string `text: string`
    - File contains the literal string `color?: "ink" | "ink-muted" | "ink-faint"`
    - File contains the literal string `class?: string`
    - File contains the literal string `color = "ink"` (default value)
    - File contains the literal string `class:list={["label-mono"`
    - File contains the literal string `meta-label--${color}`
    - File contains a `<style>` block with `.meta-label--ink`, `.meta-label--ink-muted`, `.meta-label--ink-faint` selectors
    - File contains `color: var(--ink)`, `color: var(--ink-muted)`, `color: var(--ink-faint)` — the only color references allowed
    - File does NOT contain any `<script>` block
    - File does NOT contain any Tailwind utility class in markup (D-03)
    - File does NOT contain any color token other than `var(--ink)`, `var(--ink-muted)`, `var(--ink-faint)` (D-16 six-token lock)
    - `rtk pnpm run check` passes
  </acceptance_criteria>
  <done>MetaLabel.astro exists, supports three color variants, uses .label-mono global class, astro check passes</done>
</task>

<task type="auto">
  <name>Task 3: Create StatusDot.astro (MASTER §5.7)</name>
  <files>src/components/primitives/StatusDot.astro</files>
  <read_first>
    - design-system/MASTER.md lines 558–595 (§5.7 StatusDot spec)
    - mockup.html lines 171–183 (.status-line, .status-dot, .accent-dot CSS values — these are the source of truth for the scoped styles)
    - src/components/primitives/MetaLabel.astro (from task 2 in this plan — StatusDot composes it)
    - .planning/phases/09-primitives/09-CONTEXT.md D-02, D-03, D-04, D-14
  </read_first>
  <action>
CREATE a new file at `src/components/primitives/StatusDot.astro` with the following content:

**Astro frontmatter script (write between `---` fences at top of the .astro file):**

```ts
/**
 * StatusDot — MASTER §5.7
 *
 * 6px accent-red circle paired with an uppercase mono label.
 * Used for "AVAILABLE FOR WORK" indicator on the homepage hero.
 *
 * Per D-02: primitive lives in src/components/primitives/
 * Per D-03: no Tailwind utilities inside primitive markup
 * Per D-04: props stay as MASTER §5.7 specifies (label only)
 * Composes MetaLabel for the text portion.
 */
import MetaLabel from "./MetaLabel.astro";

interface Props {
  label: string;
}

const { label } = Astro.props;
```

**Astro template markup (write BELOW the closing `---` frontmatter fence):**

```astro

<span class="status-line">
  <span class="status-dot" aria-hidden="true"></span>
  <MetaLabel text={label} color="ink" />
</span>

<style>
  .status-line {
    display: inline-flex;
    align-items: center;
  }
  .status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    margin-right: 8px;
  }
</style>
```

Notes on implementation:

- Scoped `<style>` transcribes mockup.html lines 171–183 `.status-line` and `.status-dot` exactly
- The dot is `aria-hidden="true"` because it's decorative — the label text conveys the status semantically
- Composes `MetaLabel.astro` rather than duplicating the span + label-mono class manually — this is the first time the primitive library composes primitives internally
- Color `var(--accent)` is the only new color reference, and it is already in the Phase 8 token layer (line 14 of global.css)
  </action>
  <verify>
    <automated>rtk pnpm run check</automated>
  </verify>
  <acceptance_criteria>
    - File `src/components/primitives/StatusDot.astro` exists
    - File contains the literal string `import MetaLabel from "./MetaLabel.astro"`
    - File contains the literal string `label: string`
    - File contains `<MetaLabel text={label} color="ink" />`
    - File contains `class="status-line"`
    - File contains `class="status-dot"`
    - File contains `aria-hidden="true"` on the dot span
    - File contains a `<style>` block with `.status-line` and `.status-dot` selectors
    - File contains the literal string `width: 6px`
    - File contains the literal string `height: 6px`
    - File contains the literal string `background: var(--accent)`
    - File contains the literal string `margin-right: 8px`
    - File contains the literal string `border-radius: 50%`
    - File contains the literal string `display: inline-flex`
    - File does NOT contain a `<script>` block
    - File does NOT contain any Tailwind utility class in markup (D-03)
    - File does NOT contain any color token other than `var(--accent)` (D-16 — no new tokens; --ink/--ink-muted/etc. not needed here)
    - `rtk pnpm run check` passes
  </acceptance_criteria>
  <done>StatusDot.astro exists, renders 6px accent dot + MetaLabel composition, astro check passes</done>
</task>

<task type="auto">
  <name>Task 4: Create SectionHeader.astro (MASTER §5.4)</name>
  <files>src/components/primitives/SectionHeader.astro</files>
  <read_first>
    - design-system/MASTER.md lines 407–449 (§5.4 SectionHeader spec)
    - mockup.html lines 188–203 (.section, .section-header, .section-rule — .section-rule is already in global.css from plan 02; .section-header is component-local and must be scoped here per D-14)
    - src/styles/global.css (confirm .section-rule selector exists from plan 02)
    - .planning/phases/09-primitives/09-CONTEXT.md D-02, D-03, D-04, D-13, D-14
  </read_first>
  <action>
CREATE a new file at `src/components/primitives/SectionHeader.astro` with the following content:

**Astro frontmatter script (write between `---` fences at top of the .astro file):**

```ts
/**
 * SectionHeader — MASTER §5.4
 *
 * The `§ NN — TITLE` mono label + optional count + 1px rule divider
 * that opens every numbered section (§ 01 — WORK, § 02 — ABOUT, etc.).
 *
 * Per D-02: primitive lives in src/components/primitives/
 * Per D-03: no Tailwind utilities inside primitive markup
 * Per D-04: props stay as MASTER §5.4 specifies (number + title + count?)
 * Per D-13: .section-rule is a global helper (landed in plan 09-02)
 * Per D-14: .section-header flex row is component-local (scoped here)
 */
interface Props {
  number: string;
  title: string;
  count?: string;
}

const { number, title, count } = Astro.props;
```

**Astro template markup (write BELOW the closing `---` frontmatter fence):**

```astro

<div class="section-header">
  <span class="label-mono section-label">§ {number} — {title}</span>
  {count && <span class="meta-mono tabular section-count">{count}</span>}
</div>
<div class="section-rule"></div>

<style>
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .section-label {
    color: var(--ink);
  }
  .section-count {
    color: var(--ink-faint);
  }
</style>
```

Notes on implementation:

- `.section-header` is the flex baseline row (component-local per D-14) — scoped inside this primitive
- `.section-rule` is rendered as a sibling `<div>` using the global class from plan 02 (not inside the flex row — it needs to break to its own line under the label)
- `.label-mono`, `.meta-mono`, `.tabular` are all global classes from plan 02 — the primitive applies them to its spans without redefining them
- The `§ NN — TITLE` string is composed in markup; CSS uppercase from `.label-mono` takes care of casing
- Count is conditionally rendered via `{count && ...}` — the optional prop is honored
- No client JS, no imports — leaf-level primitive
  </action>
  <verify>
    <automated>rtk pnpm run check</automated>
  </verify>
  <acceptance_criteria>
    - File `src/components/primitives/SectionHeader.astro` exists
    - File contains the literal string `number: string`
    - File contains the literal string `title: string`
    - File contains the literal string `count?: string`
    - File contains the literal string `§ {number} — {title}` (or `§ ${number} — ${title}` depending on interpolation style — either is acceptable; the rendered markup must equal `§ 01 — WORK` when `number="01", title="WORK"`)
    - File contains `class="section-header"`
    - File contains `class="section-rule"`
    - File contains the literal string `class="label-mono section-label"` (or equivalent class:list with both classes)
    - File contains the literal string `class="meta-mono tabular section-count"` (or equivalent)
    - File contains a `<style>` block with `.section-header`, `.section-label`, `.section-count` selectors
    - File contains `display: flex`
    - File contains `justify-content: space-between`
    - File contains `align-items: baseline`
    - File contains `color: var(--ink)` (section-label)
    - File contains `color: var(--ink-faint)` (section-count)
    - File does NOT contain any `<script>` block
    - File does NOT contain any Tailwind utility class in markup (D-03)
    - File does NOT contain any color token other than `var(--ink)` and `var(--ink-faint)` (D-16)
    - `rtk pnpm run check` passes
  </acceptance_criteria>
  <done>SectionHeader.astro exists, renders label + optional count + section-rule divider, astro check passes</done>
</task>

</tasks>

<verification>
- All 4 primitive files exist under src/components/primitives/
- `rtk pnpm run check` passes (astro type-check green)
- `rtk pnpm run build` passes (full build including these primitives as orphan files — BaseLayout doesn't import them yet; that happens in plan 09-05)
- Negative regression: `rtk grep -n "import.*tailwindcss" src/components/primitives/*.astro` returns no matches (primitives must not import Tailwind directly)
- Negative regression: `rtk grep -n "oklch\\|#FAFAF7\\|#0A0A0A\\|#52525B\\|#A1A1AA\\|#E4E4E7\\|#E63946" src/components/primitives/*.astro` returns no matches (primitives must use tokens, not inline hex values)
</verification>

<success_criteria>
- 4 new primitive files exist
- Each uses the correct prop signature from MASTER §5.3, §5.4, §5.6, §5.7
- Each relies on global classes from plan 02 plus scoped styles only where MASTER §5 places component-local layout
- `rtk pnpm run build` and `rtk pnpm run check` pass
- Zero Tailwind utility classes in primitive markup
- Zero inline hex color values in primitive files
</success_criteria>

<output>
After completion, create `.planning/phases/09-primitives/09-03-SUMMARY.md` recording:
- Files created
- Prop signatures implemented
- Any choices made in the discretion areas (e.g., Container `as` rename pattern)
- Confirmation that no Tailwind utilities or inline hex colors landed in any primitive
- Commit SHA
</output>
