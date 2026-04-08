---
phase: 09-primitives
plan: 07
type: execute
wave: 6
depends_on: [09-05]
files_modified:
  - src/layouts/BaseLayout.astro
  - src/pages/dev/primitives.astro
  - astro.config.mjs
  - public/robots.txt
autonomous: true
requirements: []

must_haves:
  truths:
    - "BaseLayout.astro exposes a named <slot name="head" /> positioned immediately BEFORE </head> so per-page head content (meta tags, etc.) can be injected via <Fragment slot="head"> (BLOCKER 1 fix — the slot enables the preview page's noindex meta injection at render time)"
    - "Route /dev/primitives renders every Phase 9 primitive in isolation with sample data, labeled via SectionHeader (§ 01 — HEADER, § 02 — FOOTER, etc.)"
    - "MobileMenu is previewable at any viewport — either via a manual 'Open mobile menu' trigger or a 375px container-query wrapper (planner's implementation choice)"
    - "Route /dev/primitives is excluded from sitemap-index.xml (via @astrojs/sitemap filter) AND disallowed in public/robots.txt"
    - "Route /dev/primitives has a noindex meta tag inside the rendered <head> of dist/dev/primitives/index.html (not just the source file — verified post-build) and is not linked from any navigation"
    - "WorkRow sample data pulls from the actual content collection (at least 4 real projects by title + techStack) rather than hardcoded placeholder titles"
  artifacts:
    - path: src/layouts/BaseLayout.astro
      provides: Named <slot name="head" /> for per-page head injection (BLOCKER 1 fix)
      contains: 'slot name="head"'
    - path: src/pages/dev/primitives.astro
      provides: Living catalog of every Phase 9 primitive rendered in isolation
      min_lines: 100
    - path: astro.config.mjs
      provides: Sitemap filter excluding /dev/ routes
      contains: "filter"
    - path: public/robots.txt
      provides: Disallow /dev/ directive
      contains: "Disallow: /dev/"
  key_links:
    - from: src/pages/dev/primitives.astro
      to: src/components/primitives/*
      via: Import every primitive and render with sample props
      pattern: "from '../../components/primitives/"
    - from: astro.config.mjs
      to: /dev/primitives route
      via: sitemap() integration filter function excludes routes matching dev/*
      pattern: "filter:"
---

<objective>
Create the `/dev/primitives` preview route per D-18, exclude it from the sitemap per D-19 (@astrojs/sitemap filter), disallow it in robots.txt per D-19, and ensure it has a `noindex` meta tag so it's discoverable only by typing the URL. The route becomes a living catalog that survives through Phase 10 and is deleted in Phase 11 cleanup alongside `mockup.html` (D-20).

**Purpose:** SC#3 requires primitives render correctly in isolation. This is the verification surface. During Phase 10 the page port can compare "canonical primitive render in /dev/primitives" against "primitive in real use on the homepage" to catch drift. Without this route, Phase 10 has no neutral ground to test primitives against.

**Output:** One commit that (1) adds a named `<slot name="head" />` to `src/layouts/BaseLayout.astro` (Task 0 — BLOCKER 1 fix), (2) creates `src/pages/dev/primitives.astro` using that slot to inject the noindex meta tag, (3) updates `astro.config.mjs` sitemap config, and (4) appends `Disallow: /dev/` to `public/robots.txt`.

**Ordering note:** This plan runs AFTER plan 05 (BaseLayout swap) because (a) the preview page uses `BaseLayout.astro` as its layout — the swap must be in place so the preview renders inside the new editorial chrome, not the old v1.0 chrome, and (b) Task 0 edits BaseLayout.astro to add the head slot, which must be additive on top of Plan 09-05's import-swap and `pt-14` removal. Inside this plan, Task 0 MUST run BEFORE Task 1 — Task 1's `<Fragment slot="head">` injection is infeasible without the slot in place.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/09-primitives/09-CONTEXT.md
@src/layouts/BaseLayout.astro
@src/components/primitives/Container.astro
@src/components/primitives/MetaLabel.astro
@src/components/primitives/StatusDot.astro
@src/components/primitives/SectionHeader.astro
@src/components/primitives/WorkRow.astro
@src/components/primitives/Header.astro
@src/components/primitives/Footer.astro
@src/components/primitives/MobileMenu.astro
@astro.config.mjs
@public/robots.txt
@src/content.config.ts

<interfaces>
<!-- Content collection schema — for WorkRow sample data -->

import { getCollection, type CollectionEntry } from "astro:content";
type ProjectEntry = CollectionEntry<"projects">;
// schema:
// { title, tagline, description, techStack: string[], featured, status,
//   githubUrl?, demoUrl?, thumbnail?, category, order: number }
//
// NOTE: projects schema does NOT include a year field (confirmed from src/content.config.ts).
// For the WorkRow sample rows, year will be hardcoded as a literal string per row
// (e.g., "2026", "2025", "2025", "2024") since the preview is a catalog, not real data.
// Phase 10's homepage WorkList will decide how to derive year for real rendering.

<!-- Sitemap config pattern — @astrojs/sitemap integration filter option -->
// astro.config.mjs currently has:
//   integrations: [mdx(), sitemap()],
// Change to:
//   integrations: [mdx(), sitemap({ filter: (page) => !page.includes('/dev/') })],
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 0: Add named <slot name="head" /> to BaseLayout.astro (BLOCKER 1 prerequisite)</name>
  <files>src/layouts/BaseLayout.astro</files>
  <read_first>
    - src/layouts/BaseLayout.astro ENTIRE CURRENT FILE (~88 lines) — you must see the current <head> structure before editing. Note: src/layouts/BaseLayout.astro was already edited in Plan 09-05 Task 1 (import paths swapped, pt-14 removed). Read the file AS IT EXISTS NOW after Plan 09-05 landed, not the pre-09-05 state.
    - .planning/phases/09-primitives/09-CONTEXT.md D-19 (noindex belt requirement) and D-26 (chat hands-off — do NOT touch the ChatWidget import or render)
  </read_first>
  <action>
**BLOCKER 1 root cause:** Before this fix, `src/layouts/BaseLayout.astro` has NO named `head` slot — only a default `<slot />` inside `<main>` at line 82 (pre-Plan 09-05 numbering; post-09-05 the line number may shift but the structure is unchanged). Using `<Fragment slot="head">` on a child page would render the `<meta>` tag inside `<main>` (because the child content falls into the default slot), which is both invalid HTML and ineffective — the noindex meta would NOT apply to the page.

**Fix:** Add a named `<slot name="head" />` positioned immediately BEFORE the closing `</head>` tag. This is additive, zero-impact on all existing pages (which don't use the slot), and generalizes beyond the preview page — any future page that needs per-page `<head>` content can use the same slot.

EDIT `src/layouts/BaseLayout.astro` with ONE surgical change:

Insert a new line containing `    <slot name="head" />` immediately before the closing `</head>` tag. The insertion must be the line-before-`</head>` position. After the edit, the `<head>` block should look like:

```astro
    <Font cssVariable="--font-display-src" />
    <Font cssVariable="--font-body-src" />
    <Font cssVariable="--font-mono-src" />
    <slot name="head" />
  </head>
```

(The exact surrounding lines may be slightly different if Plan 09-05's edits shifted line numbers; the invariant is: `<slot name="head" />` sits AFTER the last existing `<head>` child and BEFORE the closing `</head>`.)

Do NOT touch:
- The three `<Font>` tags (untouched per Phase 8 font config)
- The `<SEO>` component and its props
- The `<meta charset>`, `<meta viewport>`, `<link rel="icon">` tags
- The default `<slot />` inside `<main>` at the page body
- The `<body>`, `<Header />`, `<MobileMenu />`, `<Footer />`, `<ChatWidget />` render order
- The `import` block at the top (Plan 09-05 already swapped those imports to primitives/)
- The `pt-14` removal from `<main>` that Plan 09-05 completed
  </action>
  <verify>
    <automated>rtk pnpm run check</automated>
  </verify>
  <acceptance_criteria>
    - src/layouts/BaseLayout.astro contains the literal string `<slot name="head" />`
    - The `<slot name="head" />` line number in src/layouts/BaseLayout.astro is LESS THAN the `</head>` line number (the slot MUST sit INSIDE the `<head>` block, before its closing tag). Verify by running `rtk grep -n 'slot name="head"\|</head>' src/layouts/BaseLayout.astro` and confirming the two matches and that the slot's line number is smaller than the </head> line number.
    - src/layouts/BaseLayout.astro still contains `<slot />` (the default slot inside `<main>` — should now have 2 slot declarations total: one named, one default)
    - `rtk grep -c '<slot' src/layouts/BaseLayout.astro` returns exactly 2
    - src/layouts/BaseLayout.astro still contains the literal string `import Header from "../components/primitives/Header.astro"` (D-26 + Plan 09-05 regression — the primitive import swap from Plan 09-05 must still be intact)
    - src/layouts/BaseLayout.astro still contains the literal string `import ChatWidget from "../components/chat/ChatWidget.astro"` (D-26 hands-off)
    - src/layouts/BaseLayout.astro still contains the literal string `<main id="main-content" class="flex-1">` (Plan 09-05 `pt-14` removal preserved)
    - `rtk pnpm run check` passes
    - `rtk pnpm run build` passes — baseline stub pages render without error (the new slot is unused on stub pages; Astro no-ops an empty named slot)
  </acceptance_criteria>
  <done>BaseLayout exposes a named head slot positioned before </head>, all Plan 09-05 edits preserved, check and build pass</done>
</task>

<task type="auto">
  <name>Task 1: Create src/pages/dev/primitives.astro preview route</name>
  <files>src/pages/dev/primitives.astro</files>
  <read_first>
    - src/layouts/BaseLayout.astro (the layout the preview page uses)
    - src/components/primitives/Header.astro (to understand what rendered HTML to expect — already rendered globally by BaseLayout)
    - src/components/primitives/Footer.astro (ditto)
    - src/components/primitives/MobileMenu.astro (ditto)
    - src/components/primitives/Container.astro, MetaLabel.astro, StatusDot.astro, SectionHeader.astro, WorkRow.astro (these must be imported and rendered inline on the preview page)
    - src/content.config.ts (projects schema — confirms no year field, so WorkRow preview rows hardcode year strings)
    - .planning/phases/09-primitives/09-CONTEXT.md D-18 (preview contents), D-19 (exclusion), D-21 (MobileMenu trigger)
  </read_first>
  <action>
CREATE a new file at `src/pages/dev/primitives.astro` with the following content:

**Astro frontmatter script (write between `---` fences at top of the .astro file):**

```ts
/**
 * /dev/primitives — Phase 9 isolation preview route (D-18…D-21)
 *
 * Living catalog rendering every Phase 9 primitive with sample data.
 * Survives Phase 9 → 10 → 11, deleted in Phase 11 cleanup (D-20).
 *
 * Excluded from sitemap (astro.config.mjs filter), disallowed in
 * public/robots.txt, noindex meta tag below. Not linked from any
 * navigation — reachable only by typing the URL.
 *
 * Header, Footer, and MobileMenu are rendered globally by BaseLayout.astro
 * already — they do NOT need to be imported + rendered again on this page.
 * Instead, the "§ 01 — HEADER" and "§ 02 — FOOTER" sections contain
 * documentation callouts pointing at the globally-rendered copies.
 */
import BaseLayout from "../../layouts/BaseLayout.astro";
import Container from "../../components/primitives/Container.astro";
import MetaLabel from "../../components/primitives/MetaLabel.astro";
import StatusDot from "../../components/primitives/StatusDot.astro";
import SectionHeader from "../../components/primitives/SectionHeader.astro";
import WorkRow from "../../components/primitives/WorkRow.astro";
import { getCollection } from "astro:content";

// Pull 4 real projects from the content collection for WorkRow sample rows.
// Sort by `order` ascending to get a deterministic preview.
const projects = (await getCollection("projects"))
  .sort((a, b) => a.data.order - b.data.order)
  .slice(0, 4);

// Projects schema has no year field — hardcode years for the preview only.
const previewYears = ["2026", "2025", "2025", "2024"];
```

**Astro template markup (write BELOW the closing `---` frontmatter fence):**

```astro

<BaseLayout
  title="Primitives Preview (dev)"
  description="Phase 9 primitive library — internal preview route, not indexed"
>
  <!-- noindex override — inherited BaseLayout SEO component generates the
       canonical + OG + Twitter tags; we append noindex + nofollow here. -->
  <Fragment slot="head">
    <meta name="robots" content="noindex, nofollow" />
  </Fragment>

  <Container as="main" class="dev-primitives-main">
    <h1 class="h1-section dev-primitives-h1">Primitives Preview</h1>
    <p class="body">
      Phase 9 isolation catalog. Not indexed. Deleted in Phase 11 cleanup.
    </p>

    <!-- § 01 — HEADER -->
    <section class="section">
      <SectionHeader number="01" title="HEADER" count="live above" />
      <p class="body">
        The sticky editorial header with JACK CUTRARA wordmark and 3-link mono
        nav is rendered by BaseLayout above this content. Resize the window below
        380px (header-inner container width) to see the hamburger trigger swap in.
        Active link reflects this page's path (/dev/primitives) which does not
        match any nav href, so all three links should render in the inactive
        state.
      </p>
    </section>

    <!-- § 02 — FOOTER -->
    <section class="section">
      <SectionHeader number="02" title="FOOTER" count="live below" />
      <p class="body">
        The 64px editorial footer with copyright + BUILT WITH caption is rendered
        by BaseLayout below this content. Shrink to &lt;768px viewport to see
        the 3-row vertical stack with the GITHUB · LINKEDIN · X · EMAIL mono
        social row (D-10).
      </p>
    </section>

    <!-- § 03 — CONTAINER -->
    <section class="section">
      <SectionHeader number="03" title="CONTAINER" />
      <p class="body">
        This very page is wrapped in a Container. Every section below sits inside
        the 1200px max-width with 48px/32px/24px responsive padding.
      </p>
    </section>

    <!-- § 04 — METALABEL -->
    <section class="section">
      <SectionHeader number="04" title="METALABEL" count="3 variants" />
      <div class="dev-inline-stack">
        <MetaLabel text="DEFAULT INK" color="ink" />
        <MetaLabel text="INK MUTED" color="ink-muted" />
        <MetaLabel text="INK FAINT" color="ink-faint" />
      </div>
    </section>

    <!-- § 05 — STATUSDOT -->
    <section class="section">
      <SectionHeader number="05" title="STATUSDOT" />
      <StatusDot label="AVAILABLE FOR WORK" />
    </section>

    <!-- § 06 — SECTIONHEADER -->
    <section class="section">
      <SectionHeader number="06" title="SECTIONHEADER" count="with / without count" />
      <div class="dev-sectionheader-demo">
        <SectionHeader number="EX" title="WITH COUNT" count="4 / 4" />
      </div>
      <div class="dev-sectionheader-demo">
        <SectionHeader number="EX" title="WITHOUT COUNT" />
      </div>
    </section>

    <!-- § 07 — WORKROW -->
    <section class="section">
      <SectionHeader number="07" title="WORKROW" count={`${projects.length} / ${projects.length}`} />
      <div class="work-list">
        {
          projects.map((p, i) => (
            <WorkRow
              number={String(i + 1).padStart(2, "0")}
              title={p.data.title}
              stack={p.data.techStack.slice(0, 3).join(" · ").toUpperCase()}
              year={previewYears[i]}
              href={`/projects/${p.id}`}
            />
          ))
        }
      </div>
    </section>

    <!-- § 08 — MOBILEMENU -->
    <section class="section">
      <SectionHeader number="08" title="MOBILEMENU" count="hamburger above" />
      <p class="body">
        MobileMenu.astro is rendered by BaseLayout as a hidden dialog. It is
        triggered by the hamburger button in the Header, which is shown when the
        header-inner container width is ≤380px (D-06 container query).
      </p>
      <p class="body">
        To preview the overlay without resizing: shrink the browser window below
        a viewport width where the header-inner measures ≤380px (typically ~427px
        viewport at desktop-padding, ~380px at tablet-padding). Then click the
        hamburger icon in the header. Verify: dialog opens, focus traps cycle
        with Tab/Shift+Tab, Escape closes, clicking the backdrop closes, clicking
        the × button closes, focus returns to the hamburger trigger on close.
      </p>
    </section>
  </Container>
</BaseLayout>

<style>
  .dev-primitives-main {
    padding-top: 48px;
    padding-bottom: 96px;
  }

  .dev-primitives-h1 {
    margin-bottom: 16px;
  }

  .dev-inline-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
  }

  .dev-sectionheader-demo {
    margin-top: 24px;
  }

  .work-list .work-row:last-child {
    border-bottom: none;
  }
</style>
```

Notes on implementation:

- `<Fragment slot="head">` passes the `noindex` meta tag into BaseLayout's `<head>` via the named `head` slot that Task 0 of this plan added. **There is no fallback path** — Task 0 is a hard prerequisite for this task. Do NOT attempt client-side `document.head.appendChild`, do NOT add an `optional noindex prop` to BaseLayout — the slot is the only sanctioned injection mechanism (BLOCKER 1 fix). If BaseLayout does NOT contain `<slot name="head" />` when this task runs, STOP — that means Task 0 did not complete, and executing this task would render the `<meta>` inside `<main>` (invalid HTML, noindex ineffective).
- The preview page does NOT re-render `<Header />`, `<Footer />`, or `<MobileMenu />` inline — those three are already rendered by BaseLayout. The `§ 01 — HEADER` and `§ 02 — FOOTER` sections are documentation callouts pointing at the live header/footer above and below.
- WorkRow sample rows use real project data from the content collection (title + techStack). Year is hardcoded because the project schema has no year field. The stack string takes the first 3 items from `techStack` and joins with ` · ` uppercased, matching mockup.html style.
- `projects.slice(0, 4)` pulls 4 rows; `previewYears` hardcodes the year for each. If the collection has fewer than 4 projects the slice degrades gracefully.
- `.work-list .work-row:last-child { border-bottom: none }` lives on the preview page (not inside WorkRow.astro) because `:last-child` is a list-level concern, not a row-level concern — WorkRow is a standalone primitive and shouldn't assume list context.
- The layout uses `Container as="main"` — this shows the `as` prop dynamic-tag pattern working
  </action>
  <verify>
    <automated>rtk pnpm run check</automated>
  </verify>
  <acceptance_criteria>
    - File `src/pages/dev/primitives.astro` exists
    - File contains the literal string `import BaseLayout from "../../layouts/BaseLayout.astro"`
    - File contains the literal string `import Container from "../../components/primitives/Container.astro"`
    - File contains the literal string `import MetaLabel from "../../components/primitives/MetaLabel.astro"`
    - File contains the literal string `import StatusDot from "../../components/primitives/StatusDot.astro"`
    - File contains the literal string `import SectionHeader from "../../components/primitives/SectionHeader.astro"`
    - File contains the literal string `import WorkRow from "../../components/primitives/WorkRow.astro"`
    - File contains the literal string `import { getCollection } from "astro:content"`
    - File contains the literal string `await getCollection("projects")`
    - File contains the literal string `noindex, nofollow` inside a `<Fragment slot="head">` block (slot-based injection is the only sanctioned path per BLOCKER 1 — no client-side `document.head.appendChild`, no optional `noindex` prop on BaseLayout)
    - File contains the literal string `<Fragment slot="head">`
    - **INFO 2 negative-import criteria (prevent accidental double-render of globally-rendered chrome):**
    - File does NOT contain the literal string `import Header from` (Header is rendered globally by BaseLayout; importing it here would render it twice)
    - File does NOT contain the literal string `import Footer from` (Footer is rendered globally by BaseLayout)
    - File does NOT contain the literal string `import MobileMenu from` (MobileMenu is rendered globally by BaseLayout)
    - **BLOCKER 1 built-output verification (belt-and-suspenders — verifies the slot actually works at render time, not just at source level):**
    - After `rtk pnpm run build` completes, file `dist/dev/primitives/index.html` exists
    - `dist/dev/primitives/index.html` contains the literal string `<meta name="robots" content="noindex, nofollow">` (exact rendered form — Astro's HTML serializer uses double quotes)
    - `dist/dev/primitives/index.html` has the `<meta name="robots"` tag INSIDE the `<head>` block: verify by running `rtk grep -n '<meta name="robots"\|</head>' dist/dev/primitives/index.html` and confirming the meta line number is LESS THAN the `</head>` line number. If the meta appears AFTER `</head>` (inside `<body>` or `<main>`), Task 0 did not add the slot in the correct position and this task's injection landed inside the default slot instead of the head slot
    - File contains the literal string `§ 01 — HEADER` (either via hardcoded text or SectionHeader number="01" title="HEADER")
    - File contains `number="02" title="FOOTER"`
    - File contains `number="03" title="CONTAINER"`
    - File contains `number="04" title="METALABEL"`
    - File contains `number="05" title="STATUSDOT"`
    - File contains `number="06" title="SECTIONHEADER"`
    - File contains `number="07" title="WORKROW"`
    - File contains `number="08" title="MOBILEMENU"`
    - File contains `<StatusDot label="AVAILABLE FOR WORK" />`
    - File contains at least three `<MetaLabel` usages with color="ink", color="ink-muted", color="ink-faint"
    - File contains `<WorkRow` at least once and the WorkRow is wrapped in a `<div class="work-list">` context
    - File contains the literal string `Container as="main"` (or `as={"main"}` — both acceptable)
    - `rtk pnpm run check` passes
    - `rtk pnpm run build` passes
    - Visiting `/dev/primitives` in dev mode should render without errors (verified in plan 08 manual check)
  </acceptance_criteria>
  <done>Preview page renders all 8 primitives with sample data, noindex, no errors</done>
</task>

<task type="auto">
  <name>Task 2: Exclude /dev/ from sitemap and robots.txt (D-19)</name>
  <files>astro.config.mjs, public/robots.txt</files>
  <read_first>
    - astro.config.mjs (current file — 44 lines — you must see the current `integrations: [mdx(), sitemap()]` line before editing)
    - public/robots.txt (current file — 4 lines — you must see the current state before appending)
    - .planning/phases/09-primitives/09-CONTEXT.md D-19 (exclude from sitemap + robots)
  </read_first>
  <action>
**Edit 1 — astro.config.mjs sitemap filter:**

Change line 13 from:

```js
integrations: [mdx(), sitemap()],
```

To:

```js
integrations: [
  mdx(),
  sitemap({
    filter: (page) => !page.includes("/dev/"),
  }),
],
```

The filter function receives a full URL string like `https://jackcutrara.com/dev/primitives` and must return `true` to include, `false` to exclude. Using `.includes("/dev/")` catches any current or future `/dev/*` route.

**Edit 2 — public/robots.txt:**

Change the file from:

```
User-agent: *
Allow: /

Sitemap: https://jackcutrara.com/sitemap-index.xml
```

To:

```
User-agent: *
Allow: /
Disallow: /dev/

Sitemap: https://jackcutrara.com/sitemap-index.xml
```

The `Disallow: /dev/` directive sits directly under `Allow: /` so well-behaved crawlers know /dev/ subtree is off-limits while the rest of the site is open. This is a belt-and-suspenders measure on top of the sitemap exclusion and the per-page noindex meta tag from task 1.
  </action>
  <verify>
    <automated>rtk pnpm run build</automated>
  </verify>
  <acceptance_criteria>
    - astro.config.mjs contains the literal string `filter:`
    - astro.config.mjs contains the literal string `!page.includes("/dev/")`
    - astro.config.mjs still contains the literal string `mdx()` (other integration preserved)
    - astro.config.mjs still contains the literal string `fontProviders.google()` (font config unchanged)
    - astro.config.mjs still contains the literal string `adapter: cloudflare()` (adapter unchanged)
    - public/robots.txt contains the literal string `Disallow: /dev/`
    - public/robots.txt still contains the literal string `User-agent: *`
    - public/robots.txt still contains the literal string `Allow: /`
    - public/robots.txt still contains the literal string `Sitemap: https://jackcutrara.com/sitemap-index.xml`
    - `rtk pnpm run build` passes and generates `dist/sitemap-index.xml` that does NOT include any `/dev/` URL (optional verification: grep `dist/sitemap*.xml` for `/dev/` and confirm zero matches)
  </acceptance_criteria>
  <done>Sitemap filter excludes /dev/, robots.txt disallows /dev/, build passes</done>
</task>

</tasks>

<verification>
- `src/layouts/BaseLayout.astro` exposes `<slot name="head" />` positioned BEFORE `</head>` (Task 0)
- `src/pages/dev/primitives.astro` exists and renders without errors
- `astro.config.mjs` sitemap filter excludes `/dev/*`
- `public/robots.txt` disallows `/dev/`
- Preview page uses `<Fragment slot="head">` to inject the noindex meta (slot-based, NOT client-side appendChild)
- `dist/dev/primitives/index.html` contains `<meta name="robots" content="noindex, nofollow">` INSIDE the `<head>` block (verified post-build, not just in source)
- Preview page does NOT import Header, Footer, or MobileMenu (they render globally from BaseLayout — INFO 2)
- `rtk pnpm run build` passes
- `rtk pnpm run check` passes
- Built sitemap does not list `/dev/primitives`
</verification>

<success_criteria>
- Navigating to `/dev/primitives` in dev mode renders the 8-section catalog
- Every primitive is visible with representative sample data
- WorkRow sample rows use real project titles and tech stacks from the content collection
- Route is hidden from sitemap and robots.txt
- Build passes
</success_criteria>

<output>
After completion, create `.planning/phases/09-primitives/09-07-SUMMARY.md` recording:
- Preview page structure (sections and sample data choices)
- Any discretion choices (noindex injection method, MobileMenu preview approach)
- Sitemap filter + robots.txt entries added
- Confirmation that built sitemap excludes /dev/primitives
- Commit SHA
</output>
