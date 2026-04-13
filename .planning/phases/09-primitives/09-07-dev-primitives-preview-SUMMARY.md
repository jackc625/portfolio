---
phase: 09-primitives
plan: 07
subsystem: ui
tags: [astro, primitives, preview, dev-route, seo, sitemap, robots, noindex, slot-injection]

# Dependency graph
requires:
  - phase: 09-primitives
    provides: "src/components/primitives/{Container,MetaLabel,StatusDot,SectionHeader,WorkRow}.astro from plan 09-03/04"
  - phase: 09-primitives
    provides: "src/layouts/BaseLayout.astro post-plan-09-05 (primitives/ chrome imports + pt-14 removed) as the layout the preview page extends"
  - phase: 08-foundation
    provides: "src/content.config.ts projects collection (title, techStack, order) for WorkRow sample data"
provides:
  - "src/layouts/BaseLayout.astro: named <slot name='head' /> positioned immediately before </head> for per-page head injection (BLOCKER 1 fix, additive)"
  - "src/pages/dev/primitives.astro: 8-section living catalog of every Phase 9 primitive rendered in isolation with sample data (survives through Phase 10, deleted in Phase 11 cleanup per D-20)"
  - "astro.config.mjs: @astrojs/sitemap filter function excluding any URL containing '/dev/' (catches future /dev/* routes automatically)"
  - "public/robots.txt: Disallow: /dev/ directive under Allow: /"
affects: [09-08, 10-page-port, 11-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Named <slot name='head' /> in BaseLayout for per-page <head> injection via <Fragment slot='head'>child content</Fragment> — the canonical Astro pattern for injecting meta tags into a layout's head from a child page. Additive: pages that do not use the slot get no-op behavior"
    - "D-18: Preview route renders Container, MetaLabel, StatusDot, SectionHeader, and WorkRow in isolation with sample data. Header, Footer, MobileMenu are NOT re-imported because BaseLayout already renders them globally — the §01/§02 sections are documentation callouts pointing at the live chrome above/below"
    - "D-19: Belt-and-suspenders indexing defense — (1) sitemap filter via @astrojs/sitemap integration option, (2) Disallow: /dev/ in robots.txt, (3) per-page <meta name='robots' content='noindex, nofollow'> via the slot"
    - "D-21 (MobileMenu preview strategy): no manual trigger button on the preview page — instead, documentation callout explains to shrink viewport below ~427px to engage the Header's D-06 container query (max-width: 380px) which swaps inline nav for the hamburger trigger"
    - "WorkRow sample data pulls real projects from the content collection via await getCollection('projects') sorted by .data.order ascending — not hardcoded placeholder titles. Year is hardcoded per row because the projects schema has no year field (previewYears = ['2026','2025','2025','2024'])"
    - "Container as='main' pattern demonstrates the dynamic-tag prop from MASTER §5.3 in actual use — the preview page's single root element IS a Container-wrapped <main>, proving the { as: Tag = 'div' } rename pattern works at render time"

key-files:
  created:
    - src/pages/dev/primitives.astro
    - .planning/phases/09-primitives/09-07-dev-primitives-preview-SUMMARY.md
  modified:
    - src/layouts/BaseLayout.astro
    - astro.config.mjs
    - public/robots.txt
  deleted: []

key-decisions:
  - "[Phase 09-07] Slot-based noindex injection over client-side document.head.appendChild or an optional noindex prop on BaseLayout — the plan explicitly mandated slot injection as the only sanctioned path (BLOCKER 1 fix). Task 0 added <slot name='head' /> to BaseLayout so Task 1 can use <Fragment slot='head'><meta name='robots' content='noindex, nofollow' /></Fragment> at the page level"
  - "[Phase 09-07] MobileMenu preview strategy chose the container-query-engagement approach over a manual 'Open mobile menu' button — the planner-offered choice between (a) manual trigger or (b) 375px container-query wrapper resolved to neither: instead a documentation callout tells the reviewer to shrink viewport width, which exercises the Header's actual D-06 container query (@container max-width: 380px) in its live state. Adding a manual trigger would have bypassed the Header's container query gating, which is itself part of what needs to be previewed"
  - "[Phase 09-07] WorkRow 'stack' prop composition chose the first 3 techStack entries joined with ' · ' and uppercased (p.data.techStack.slice(0, 3).join(' · ').toUpperCase()) — mimics the mockup.html stack display grammar and keeps row width consistent across projects with different stack lengths. Real Phase 10 WorkList rendering on the homepage is free to make a different choice; the preview is a catalog, not canonical"
  - "[Phase 09-07] Preview page uses Container as='main' so the Container primitive's dynamic-tag prop gets exercised in actual use, not just in contrived examples. This was a free opportunity to prove the { as: Tag = 'div' } rename pattern works at render time against BaseLayout's main slot — if Container as='main' had broken, the preview would not have rendered"
  - "[Phase 09-07] previewYears hardcoded in frontmatter (not injected via a primitive prop) because projects schema has no year field — this is acknowledged in the comment block as a preview-only concession. Phase 10's homepage WorkList will decide how to derive year for real rendering (possibly from git commit metadata, or by adding a year field to the schema)"
  - "[Phase 09-07] Rule-2-adjacent discovery: astro-seo's <SEO> component in BaseLayout emits <meta name='robots' content='index, follow'> by default whenever noindex prop is absent. After the slot injection lands, the built HTML contains TWO robots meta tags — 'index, follow' at byte 459 (SEO default) and our 'noindex, nofollow' at byte 7648 (slot injection). Both are inside <head>. The plan's acceptance criteria explicitly forbid adding an optional noindex prop to BaseLayout ('the slot is the only sanctioned injection mechanism'), so the clean fix (passing noindex through to SEO) was unavailable. Google's documented behavior for conflicting robots directives is 'follow the most restrictive rule' → noindex wins, but this is ambiguous HTML. Defense-in-depth remains intact: sitemap exclusion + robots.txt disallow + most-restrictive noindex meta all reinforce non-indexing. Flagged for Phase 11 polish reconciliation — see Issues Encountered"

patterns-established:
  - "Named-slot head injection pattern: BaseLayout exposes <slot name='head' /> immediately before </head>, child pages inject via <Fragment slot='head'>...</Fragment>. Generalizes beyond the preview page — any future page needing per-page head content (JSON-LD, canonical override, hreflang, structured data, page-specific OG) uses the same slot"
  - "Dev-route preview pattern: an /dev/<library> route that imports every primitive in the library and renders each with sample data inside a numbered SectionHeader catalog, protected by triple indexing defense (sitemap filter + robots.txt disallow + noindex meta). Use for any future component library that needs an isolation surface"
  - "Global-chrome-aware preview pattern: the preview page does NOT re-render primitives that BaseLayout already renders globally (Header, Footer, MobileMenu). §01/§02 sections are documentation callouts pointing at the live global chrome above/below. Preserves single source of truth — no risk of the preview rendering a stale-prop clone of the live Header"

requirements-completed: []

# Metrics
duration: 9min
completed: 2026-04-08
---

# Phase 9 Plan 07: Dev Primitives Preview Summary

**Created the `/dev/primitives` isolation preview route per D-18, added a named `<slot name="head" />` to `BaseLayout.astro` for per-page head injection (BLOCKER 1 fix), excluded the entire `/dev/` subtree from `sitemap-index.xml` via an `@astrojs/sitemap` filter function, and appended `Disallow: /dev/` to `public/robots.txt` per D-19. The preview page is an 8-section living catalog rendering every Phase 9 primitive with sample data (WorkRow uses 4 real projects from the content collection sorted by `order`), injects `<meta name="robots" content="noindex, nofollow">` through the new head slot, and reaches a 38-file clean `pnpm check` + `pnpm build`. Belt-and-suspenders triple defense against search indexing (sitemap filter + robots.txt + noindex meta) is now in place, and the route will survive through Phase 10 as the neutral ground for comparing canonical primitive renders against real-use renders before being deleted in Phase 11 cleanup alongside `mockup.html` per D-20.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-04-08T20:16:27Z
- **Completed:** 2026-04-08T20:25:36Z
- **Tasks:** 3 (slot addition + preview route + sitemap/robots exclusion)
- **Files modified:** 3 (BaseLayout.astro, astro.config.mjs, robots.txt)
- **Files created:** 1 (src/pages/dev/primitives.astro, 173 lines)

## Accomplishments

- **Task 0 — `<slot name="head" />` added to BaseLayout.astro (commit `28abb76`).** Single-line insertion immediately before `</head>` on line 74 (post-insertion), positioned after the three `<Font cssVariable>` bindings. Total change: +1 line. BaseLayout now has exactly 2 `<slot`  declarations: the new named head slot (line 74) and the existing default slot inside `<main>` (line 83). All other structure byte-identical:
  - Line 5 `import Header from "../components/primitives/Header.astro"` (plan 09-05 swap preserved, BLOCKER-1 regression guard)
  - Line 8 `import ChatWidget from "../components/chat/ChatWidget.astro"` (D-26 hands-off preserved)
  - Line 82 `<main id="main-content" class="flex-1">` (plan 09-05 `pt-14` removal preserved)
  - `<SEO>` component wiring, three `<Font>` tags, meta charset/viewport/icon links, `<SkipToContent />`, `<Header /> <MobileMenu /> ... <Footer /> <ChatWidget />` render order — all untouched
  - `pnpm run check`: 0 errors, 0 warnings, 2 pre-existing hints
  - `pnpm run build`: exits 0, "Complete!", 10 pages prerendered (pre-Task-1 stub state)

- **Task 1 — /dev/primitives preview route created (commit `599ab5e`).** New file `src/pages/dev/primitives.astro` (173 lines) containing:
  - **Frontmatter script:** imports `BaseLayout`, `Container`, `MetaLabel`, `StatusDot`, `SectionHeader`, `WorkRow`, and `getCollection` from `astro:content`; fetches projects collection sorted by `.data.order` ascending and sliced to the first 4; declares `previewYears = ["2026", "2025", "2025", "2024"]`. Critically does NOT import `Header`, `Footer`, or `MobileMenu` — those three are rendered globally by BaseLayout and importing them here would cause double-render.
  - **Root render:** `<BaseLayout title="Primitives Preview (dev)" description="...">` wraps everything. The `<Fragment slot="head">` block injects `<meta name="robots" content="noindex, nofollow">` via Task 0's head slot. The single page body element is `<Container as="main" class="dev-primitives-main">` — this exercises the Container primitive's dynamic-tag prop at render time.
  - **8 numbered sections** via `<SectionHeader>`:
    1. **§ 01 — HEADER** (count="live above"): documentation callout pointing at the globally-rendered Header, explaining the D-06 container-query hamburger swap at 380px header-inner width
    2. **§ 02 — FOOTER** (count="live below"): documentation callout pointing at the globally-rendered Footer, explaining the D-10 mobile 3-row stack at <768px
    3. **§ 03 — CONTAINER**: prose explaining the page itself is wrapped in a Container
    4. **§ 04 — METALABEL** (count="3 variants"): renders three `<MetaLabel>` instances with `color="ink"`, `color="ink-muted"`, `color="ink-faint"` stacked vertically
    5. **§ 05 — STATUSDOT**: renders `<StatusDot label="AVAILABLE FOR WORK" />` — the canonical mockup.html hero indicator
    6. **§ 06 — SECTIONHEADER** (count="with / without count"): renders two self-referential `<SectionHeader>` instances, one with `count="4 / 4"` and one without, demonstrating the optional count prop
    7. **§ 07 — WORKROW** (count=`${projects.length} / ${projects.length}`): maps the 4 real projects into `<WorkRow>` instances with `number={String(i+1).padStart(2,"0")}`, `title={p.data.title}`, `stack={p.data.techStack.slice(0,3).join(" · ").toUpperCase()}`, `year={previewYears[i]}`, `href={`/projects/${p.id}`}`. Wrapped in `<div class="work-list">` so the scoped `:last-child` border-bottom:none rule applies
    8. **§ 08 — MOBILEMENU** (count="hamburger above"): documentation callout explaining how to preview the MobileMenu — shrink viewport so header-inner container width drops below 380px (~427px viewport at desktop padding), then click the hamburger; verification points listed (focus trap, Escape, backdrop click, × button, focus return)
  - **Scoped `<style>` block:** `.dev-primitives-main { padding-top: 48px; padding-bottom: 96px }`, `.dev-primitives-h1 { margin-bottom: 16px }`, `.dev-inline-stack { display: flex; flex-direction: column; gap: 12px; margin-top: 16px }`, `.dev-sectionheader-demo { margin-top: 24px }`, `.work-list .work-row:last-child { border-bottom: none }` (list-level concern, lives on the preview page not inside WorkRow.astro because `:last-child` is a list-level selector)
  - `pnpm run check`: 0 errors, 0 warnings, 2 pre-existing hints (file count 37→38, confirming the new file landed and type-checked)
  - `pnpm run build`: exits 0, prerenders 11 pages (the 10 existing + new `/dev/primitives/index.html`), sitemap generated, Cloudflare Pages rearrange succeeds

- **Task 2 — Sitemap filter + robots.txt disallow (commit `038783f`).** Two-file edit:
  - `astro.config.mjs`: `integrations: [mdx(), sitemap()]` → `integrations: [\n    mdx(),\n    sitemap({\n      filter: (page) => !page.includes("/dev/"),\n    }),\n  ]`. The filter function receives each candidate sitemap URL (full URL form like `https://jackcutrara.com/dev/primitives`) and returns `false` (exclude) for any URL containing `/dev/`, catching current and future `/dev/*` routes automatically
  - `public/robots.txt`: appended `Disallow: /dev/` on line 3 directly under `Allow: /`, with the `Sitemap:` line pushed to line 5
  - `pnpm run build` exits 0, 11 pages prerendered, the /dev/primitives HTML lands at `dist/client/dev/primitives/index.html`
  - **Built sitemap verification:** `dist/client/sitemap-0.xml` contains 0 matches for `/dev/`; `dist/client/sitemap-index.xml` contains 0 matches for `/dev/`. The filter works correctly
  - **Built robots.txt verification:** `dist/client/robots.txt` contains the literal line `Disallow: /dev/` on line 3

- **Belt-and-suspenders indexing defense verified end-to-end:**
  1. Sitemap filter excludes `/dev/primitives` from `sitemap-0.xml` (search engines crawling the sitemap never discover the URL)
  2. `Disallow: /dev/` in robots.txt (well-behaved crawlers that find the URL via another route still respect the disallow)
  3. `<meta name="robots" content="noindex, nofollow">` rendered INSIDE the built `<head>` block of `dist/client/dev/primitives/index.html` (any crawler that crawls the page anyway — including test queries, link submissions, or crawlers that ignore robots.txt — still sees the noindex directive)

- **Full-plan verification green:**
  - `pnpm run check`: 0 errors, 0 warnings, 2 pre-existing hints (JsonLd.astro `is:inline` advisory + Container.astro `ts(6196)` Props-unused hint — both inherited from plans 09-06 and 09-03, neither caused by this plan)
  - `pnpm run build`: exits 0, "Complete!", 11 pages prerendered, sitemap generated with zero `/dev/` URLs, Cloudflare Pages rearrange succeeds, Vite server build ~8.5s
  - `pnpm run lint`: 0 errors, 2 pre-existing warnings in generated `worker-configuration.d.ts` (unused eslint-disable directives, machine-generated file) — unrelated to this plan

## Task Commits

1. **Task 0: Add `<slot name="head" />` to BaseLayout.astro** — `28abb76` (feat)
2. **Task 1: Create /dev/primitives preview route** — `599ab5e` (feat)
3. **Task 2: Exclude /dev/ from sitemap + robots.txt** — `038783f` (feat)

_Plan metadata commit will bundle SUMMARY.md, STATE.md, and ROADMAP.md separately._

## Files Created/Modified

- `src/layouts/BaseLayout.astro` — **Modified (+1 line).** Added `<slot name="head" />` immediately before the closing `</head>` tag, after the three `<Font cssVariable>` tags (Task 0). All other content byte-identical to post-plan-09-05 state. Slot count is now exactly 2 (named `head` slot + default slot inside `<main>`)
- `src/pages/dev/primitives.astro` — **New file, 173 lines.** 8-section primitive catalog with `<Fragment slot="head">` noindex injection. Imports `BaseLayout`, `Container`, `MetaLabel`, `StatusDot`, `SectionHeader`, `WorkRow`, and `getCollection`. Does NOT import Header, Footer, or MobileMenu (those three are rendered globally by BaseLayout)
- `astro.config.mjs` — **Modified (+4 lines, -1 line).** `integrations:` array expanded from single-line `[mdx(), sitemap()]` to multi-line form with `sitemap({ filter: (page) => !page.includes("/dev/") })`. `mdx()`, `fontProviders.google()`, `adapter: cloudflare()`, Vite tailwindcss() plugin, and all three font config blocks untouched
- `public/robots.txt` — **Modified (+1 line).** Added `Disallow: /dev/` on line 3 under `Allow: /`. `User-agent: *`, `Allow: /`, and `Sitemap: https://jackcutrara.com/sitemap-index.xml` all preserved verbatim

## Decisions Made

1. **Slot-based noindex injection is the only sanctioned mechanism.** The plan explicitly forbade client-side `document.head.appendChild` and an optional `noindex` prop on BaseLayout. `<Fragment slot="head"><meta name="robots" content="noindex, nofollow" /></Fragment>` pipes the meta tag through Task 0's new `<slot name="head" />` at render time, which Astro's HTML serializer emits as `<meta name="robots" content="noindex, nofollow">` (double-quoted form) inside the built `<head>`. Task 0 is a hard prerequisite for Task 1 — the sequencing matters.

2. **MobileMenu preview strategy chose documentation-callout-to-container-query over manual trigger button.** The planner offered two options: (a) a manual "Open mobile menu" button on the preview page, or (b) a 375px container-query wrapper. I picked neither — instead, the §08 section contains a documentation callout telling the reviewer to shrink viewport width below ~427px to engage the Header's actual D-06 container query (`@container (max-width: 380px)` on `.header-inner`). Reasoning: (a) a manual trigger button on the preview page would bypass the Header's container query gating, which is itself part of what needs to be previewed — a reviewer would click the button and see the overlay without ever verifying that the D-06 query fires correctly; (b) a 375px container-query wrapper on the preview would hide the other 7 primitives at that viewport width, defeating the purpose of an 8-section catalog.

3. **WorkRow sample data pulls real projects from the content collection via `getCollection("projects")`.** The plan's must-haves require at least 4 real projects by title + techStack, and the schema has 6 projects with `order` values. I sort by `.data.order` ascending and slice to the first 4, which gives a deterministic preview (same 4 rows in the same order every build) and exercises WorkRow against actual production data shapes (title, techStack strings, id for href). Year is hardcoded per row in `previewYears` because the schema has no year field — this is a preview-only concession acknowledged in the comment block.

4. **`Container as="main"` over nested `<main><Container>` wrapping.** The Container primitive has a MASTER §5.3 `as` prop that renders it as any HTML tag via the `{ as: Tag = "div" }` rename pattern. The preview page uses this prop so the single root element IS a Container-wrapped `<main>`, simultaneously proving (a) the dynamic-tag pattern works at render time and (b) the Container primitive is semantically composable with the HTML main element. If `Container as="main"` had broken, the preview would not have rendered — it's a live smoke test for the §5.3 prop contract.

5. **`.work-list .work-row:last-child { border-bottom: none }` lives on the preview page, not inside WorkRow.astro.** The WorkRow primitive sets `border-bottom: 1px solid var(--rule)` on every row because a row is a standalone primitive and does not know whether it's the last row in a list. `:last-child` is a list-level concern — the list (or preview page) is the only place that can know which row is last. Putting this rule inside WorkRow.astro would couple the primitive to list context and violate the "primitives are context-free" principle from Phase 9.

## Verification Results

### Task 0 acceptance criteria (from PLAN.md)

- [x] src/layouts/BaseLayout.astro contains the literal string `<slot name="head" />`
- [x] The `<slot name="head" />` line number (74) is LESS THAN the `</head>` line number (75) — slot sits INSIDE the `<head>` block before its closing tag
- [x] src/layouts/BaseLayout.astro still contains `<slot />` (the default slot inside `<main>` at line 83)
- [x] Exactly 2 `<slot` occurrences in BaseLayout.astro (1 named, 1 default)
- [x] src/layouts/BaseLayout.astro still contains the literal `import Header from "../components/primitives/Header.astro"` (plan 09-05 swap preserved, D-26 regression guard)
- [x] src/layouts/BaseLayout.astro still contains the literal `import ChatWidget from "../components/chat/ChatWidget.astro"` (D-26 hands-off)
- [x] src/layouts/BaseLayout.astro still contains the literal `<main id="main-content" class="flex-1">` (plan 09-05 `pt-14` removal preserved)
- [x] `pnpm run check` passes (0 errors, 0 warnings, 2 pre-existing hints)
- [x] `pnpm run build` passes (10 pages prerendered at this task boundary)

### Task 1 acceptance criteria (from PLAN.md)

- [x] File `src/pages/dev/primitives.astro` exists (173 lines)
- [x] Contains `import BaseLayout from "../../layouts/BaseLayout.astro"`
- [x] Contains `import Container from "../../components/primitives/Container.astro"`
- [x] Contains `import MetaLabel from "../../components/primitives/MetaLabel.astro"`
- [x] Contains `import StatusDot from "../../components/primitives/StatusDot.astro"`
- [x] Contains `import SectionHeader from "../../components/primitives/SectionHeader.astro"`
- [x] Contains `import WorkRow from "../../components/primitives/WorkRow.astro"`
- [x] Contains `import { getCollection } from "astro:content"`
- [x] Contains `await getCollection("projects")`
- [x] Contains the literal string `noindex, nofollow` inside a `<Fragment slot="head">` block
- [x] Contains the literal string `<Fragment slot="head">`
- [x] Does NOT contain `import Header from` (INFO 2 negative check — Header rendered globally by BaseLayout)
- [x] Does NOT contain `import Footer from` (INFO 2 negative check)
- [x] Does NOT contain `import MobileMenu from` (INFO 2 negative check)
- [x] `dist/client/dev/primitives/index.html` exists after build
- [x] `dist/client/dev/primitives/index.html` contains the literal `<meta name="robots" content="noindex, nofollow">` (at byte 7648)
- [x] The noindex meta tag is INSIDE the `<head>` block — byte position 7648 < `</head>` byte position 10032 (verified via node script)
- [x] Contains `number="01" title="HEADER"` (SectionHeader renders `§ 01 — HEADER` at runtime)
- [x] Contains `number="02" title="FOOTER"`
- [x] Contains `number="03" title="CONTAINER"`
- [x] Contains `number="04" title="METALABEL"`
- [x] Contains `number="05" title="STATUSDOT"`
- [x] Contains `number="06" title="SECTIONHEADER"`
- [x] Contains `number="07" title="WORKROW"`
- [x] Contains `number="08" title="MOBILEMENU"`
- [x] Contains `<StatusDot label="AVAILABLE FOR WORK" />`
- [x] Contains exactly 3 `<MetaLabel` usages with `color="ink"`, `color="ink-muted"`, `color="ink-faint"` (verified via node script)
- [x] Contains `<WorkRow` inside a `<div class="work-list">` wrapper
- [x] Contains the literal `Container as="main"`
- [x] `pnpm run check` passes (0 errors, 0 warnings, 2 pre-existing hints, file count 37→38)
- [x] `pnpm run build` passes (11 pages prerendered, /dev/primitives landed)

### Task 2 acceptance criteria (from PLAN.md)

- [x] astro.config.mjs contains the literal string `filter:`
- [x] astro.config.mjs contains the literal string `!page.includes("/dev/")`
- [x] astro.config.mjs still contains `mdx()`
- [x] astro.config.mjs still contains `fontProviders.google()` (font config unchanged, 3 occurrences)
- [x] astro.config.mjs still contains `adapter: cloudflare()`
- [x] public/robots.txt contains the literal `Disallow: /dev/`
- [x] public/robots.txt still contains `User-agent: *`
- [x] public/robots.txt still contains `Allow: /`
- [x] public/robots.txt still contains `Sitemap: https://jackcutrara.com/sitemap-index.xml`
- [x] `pnpm run build` passes and generates `dist/client/sitemap-index.xml` with zero `/dev/` URL matches (verified via node script — both `sitemap-0.xml` and `sitemap-index.xml` return `/dev/ matches=0`)
- [x] `dist/client/robots.txt` contains `Disallow: /dev/` on line 3 (verified via Read tool)

### Plan verification block (from PLAN.md)

- [x] `src/layouts/BaseLayout.astro` exposes `<slot name="head" />` positioned BEFORE `</head>` (Task 0)
- [x] `src/pages/dev/primitives.astro` exists and renders without errors
- [x] `astro.config.mjs` sitemap filter excludes `/dev/*`
- [x] `public/robots.txt` disallows `/dev/`
- [x] Preview page uses `<Fragment slot="head">` to inject the noindex meta (slot-based, NOT client-side appendChild)
- [x] `dist/client/dev/primitives/index.html` contains `<meta name="robots" content="noindex, nofollow">` INSIDE the `<head>` block (byte position verified, not just line-number assumption)
- [x] Preview page does NOT import Header, Footer, or MobileMenu (they render globally from BaseLayout — INFO 2)
- [x] `pnpm run build` passes
- [x] `pnpm run check` passes
- [x] Built sitemap does not list `/dev/primitives`

### Plan success criteria (from PLAN.md)

- [x] Navigating to `/dev/primitives` in dev mode renders the 8-section catalog (confirmed by successful build prerender at `dist/client/dev/primitives/index.html`)
- [x] Every primitive is visible with representative sample data (8 sections, 5 imported primitives + 3 documentation callouts for the globally-rendered chrome)
- [x] WorkRow sample rows use real project titles and tech stacks from the content collection (4 real projects via `getCollection("projects")` sorted by order)
- [x] Route is hidden from sitemap and robots.txt (verified post-build)
- [x] Build passes

## Deviations from Plan

### Rule 2 discovery (NOT fixed — plan explicitly forbids the clean fix)

**1. [Rule 2 - Missing Functionality Discovered But Forbidden Fix] Duplicate conflicting robots meta tags in built HTML**

- **Found during:** Task 1 post-build verification
- **Issue:** astro-seo's `<SEO>` component in BaseLayout emits `<meta name="robots" content="index, follow">` by default whenever the `noindex` prop is absent. After the slot-injected `<meta name="robots" content="noindex, nofollow">` lands, `dist/client/dev/primitives/index.html` contains TWO robots meta tags: one `index, follow` (byte 459, from SEO) and one `noindex, nofollow` (byte 7648, from slot). Both sit inside `<head>` before `</head>` at byte 10032. The plan's acceptance criteria explicitly require the `noindex, nofollow` literal to be present, which it is — criterion met. But the duplicate conflicting directive is ambiguous HTML.
- **Why not fixed:** The plan's action block explicitly forbids the clean fix: "do NOT attempt client-side `document.head.appendChild`, do NOT add an `optional noindex prop` to BaseLayout — the slot is the only sanctioned injection mechanism (BLOCKER 1 fix)." The `noindex` prop on astro-seo's `<SEO>` component is the canonical way to suppress the default `index, follow` emission, but wiring it requires either (a) passing a new `noindex?: boolean` prop from the page through BaseLayout to SEO, or (b) having BaseLayout detect the noindex case from another signal. Both are forbidden refactors per the plan.
- **Effective behavior (belt-and-suspenders holds):** Google's documented behavior for conflicting robots meta tags is "err on the side of caution and follow the most restrictive rule" ([source](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#combining-noindex-and-nofollow)) — `noindex, nofollow` is the more restrictive directive, so the effective behavior is noindex. Combined with the sitemap filter exclusion (Task 2) and the robots.txt `Disallow: /dev/` directive (Task 2), the route is NOT indexed in practice.
- **Files affected:** None modified (discovery only)
- **Commit:** N/A (no fix applied)
- **Reconciliation flag:** Phase 11 polish should add a `noindex?: boolean` prop to BaseLayout and wire it to astro-seo's SEO component — this eliminates the duplicate robots meta tag cleanly and gives any future /dev/* route a single source of truth for indexing directives. Alternative path: delete `/dev/primitives.astro` entirely in Phase 11 cleanup per D-20, which makes the issue moot.

### Other deviations

**None.** Plan 09-07 executed exactly as written:

- Task 0: 1-line insertion of `<slot name="head" />` before `</head>` — exactly as specified
- Task 1: 173-line new file with imports, 8 sections, style block — exactly matches the action block content
- Task 2: 2-file edit (astro.config.mjs integrations array + robots.txt Disallow line) — exactly matches the action block content

Zero Rule 1 bugs encountered (no broken behavior in any primitive, no build errors, no type errors).
Zero Rule 3 blockers encountered (no missing dependencies, no circular imports, no environment issues).
Zero Rule 4 architectural decisions required (all three tasks were surgical edits within the existing shell).
Zero CLAUDE.md-driven adjustments.
Zero deferred items added to `deferred-items.md` (the duplicate-robots-meta finding is documented here and flagged for Phase 11, not pushed to the deferred queue).

## Known Stubs

**None.** The preview page does not introduce stubs — WorkRow sample data pulls real projects from the content collection, MetaLabel / StatusDot / SectionHeader render with sample prop values that are the canonical mockup.html strings (`AVAILABLE FOR WORK`, `DEFAULT INK`, `§ NN — TITLE`), and Header/Footer/MobileMenu sections are documentation callouts pointing at the globally-rendered live chrome.

The `previewYears` array (`["2026", "2025", "2025", "2024"]`) is hardcoded because the projects schema has no year field — this is a preview-only concession acknowledged in the frontmatter comment, NOT a stub that needs future wiring. Phase 10's homepage WorkList will decide how to derive year for real rendering (possibly from git commit metadata, or by adding a year field to the projects schema in Phase 11). The preview is a catalog, not canonical data.

## Issues Encountered

**1. Duplicate conflicting robots meta tags in built HTML (documented above as Rule 2 discovery).** The astro-seo `<SEO>` component's default `index, follow` emission conflicts with the slot-injected `noindex, nofollow`. Belt-and-suspenders holds (Google uses the more restrictive directive, plus sitemap exclusion plus robots.txt disallow), and the clean fix is forbidden by the plan's BLOCKER-1 constraints. Flagged for Phase 11 polish reconciliation. See Deviations → Rule 2 discovery for full detail.

**2. Pre-existing `worker-configuration.d.ts` lint warnings.** `pnpm run lint` reports 2 unused eslint-disable directive warnings in the machine-generated Cloudflare worker types file. These are pre-existing (plan 09-05 inherited them too) and are out of scope for Phase 9 per GSD scope boundary rule.

**3. Pre-existing `ts(6196)` hint on Container.astro.** `pnpm run check` reports "'Props' is declared but never used" on Container.astro line 14 — inherited from plan 09-03. The `interface Props` declaration is required by plan 09-03's acceptance criteria, and the hint is cosmetic (Astro's type checker picks up the interface via implicit Astro.props declaration merging). No action.

**4. Pre-existing JsonLd.astro `is:inline` hint.** Inherited from plan 09-06 audit. No action.

## Build Observations

- **File count grew 37 → 38.** `pnpm run check` reports 38 files after Task 1 landed. The single new file is `src/pages/dev/primitives.astro`. No other files were created.
- **Prerender count grew 10 → 11 pages.** `pnpm run build` now prerenders `/dev/primitives/index.html` in addition to the existing 10 pages (index, about, contact, projects index, 6 case studies). Build time unchanged (~8.5s total, within normal variance).
- **Sitemap excludes `/dev/primitives`.** Verified post-build: `dist/client/sitemap-0.xml` and `dist/client/sitemap-index.xml` both contain zero `/dev/` matches. The filter function works correctly — it receives full URL strings (like `https://jackcutrara.com/dev/primitives`) and returns false for any string containing `/dev/`.
- **robots.txt deploys with the new Disallow.** `dist/client/robots.txt` contains the expected line 3 `Disallow: /dev/` — Astro/Vite passes `public/robots.txt` through to the dist output unchanged.
- **BaseLayout regression surface zero.** Task 0's single-line slot addition caused no regressions in any existing page — the named slot is ignored by pages that don't use it, so the 10 non-preview pages render byte-identically to the pre-Task-0 state.
- **Zero new client-side JS.** The preview page has no `<script>` block. All interactivity (the globally-rendered Header hamburger / MobileMenu dialog) is inherited from BaseLayout and its primitives, which were built in prior plans. The preview itself adds zero runtime surface.

## User Setup Required

**None.** Pure `.astro` file creation + config edits + static robots.txt edit. No environment variables, no new dependencies, no external configuration, no package changes, no runtime changes. `pnpm run dev` will serve the preview at `http://localhost:4321/dev/primitives` after a dev server restart.

## Next Phase Readiness

- **Ready for 09-08 (verification gate):** The preview route is now the verification surface for Phase 9's primitive correctness. Plan 09-08's verification gate can open `/dev/primitives` in dev mode, visually inspect each of the 8 sections, and confirm every primitive renders correctly with its sample data. The route also serves as the comparison surface for Phase 10's page port — any drift between a primitive's canonical render (on /dev/primitives) and its real-use render (on the homepage) is now visible side-by-side.
- **Ready for 10-page-port:** Phase 10 plans can import primitives into actual page templates with confidence that the primitives render correctly in isolation. The preview route survives through Phase 10 as the neutral ground.
- **Ready for 11-polish (D-20 cleanup):** Phase 11 will delete `src/pages/dev/primitives.astro` alongside `mockup.html` per D-20. At that time, Phase 11 should ALSO delete the named `<slot name="head" />` from BaseLayout.astro (it's no longer needed if no page uses it) OR convert it to a first-class `noindex?: boolean` prop that fixes the duplicate-robots-meta issue flagged above — see the Rule 2 discovery note for the cleanup path.
- **No blockers.** Wave 6 is complete; wave 7 (09-08 verification gate) is unblocked.

## Threat Flags

None. This plan introduces a dev-only preview route protected by triple indexing defense (sitemap filter + robots.txt disallow + noindex meta). It does not introduce new authentication paths, new network endpoints, new file access patterns, or new schema changes at trust boundaries.

## Self-Check: PASSED

**File existence checks:**
- FOUND: `src/layouts/BaseLayout.astro` (modified, +1 line)
- FOUND: `src/pages/dev/primitives.astro` (new, 173 lines)
- FOUND: `astro.config.mjs` (modified, +4 -1 lines)
- FOUND: `public/robots.txt` (modified, +1 line)
- FOUND: `.planning/phases/09-primitives/09-07-dev-primitives-preview-SUMMARY.md` (this file)
- FOUND: `dist/client/dev/primitives/index.html` (post-build artifact)
- FOUND: `dist/client/sitemap-0.xml` (zero `/dev/` matches)
- FOUND: `dist/client/sitemap-index.xml` (zero `/dev/` matches)
- FOUND: `dist/client/robots.txt` (contains `Disallow: /dev/` on line 3)

**Commit existence checks:**
- FOUND: `28abb76` — feat(09-07): add named <slot name="head" /> to BaseLayout (BLOCKER 1 fix)
- FOUND: `599ab5e` — feat(09-07): add /dev/primitives isolation preview route (D-18)
- FOUND: `038783f` — feat(09-07): exclude /dev/ from sitemap + robots.txt (D-19)

**Verification gate checks:**
- FOUND: `pnpm run check` → 0 errors, 0 warnings, 2 pre-existing hints
- FOUND: `pnpm run build` → exits 0, "Complete!", 11 pages prerendered
- FOUND: `pnpm run lint` → 0 errors, 2 pre-existing worker-configuration.d.ts warnings
- FOUND: slot name="head" positioned at line 74, </head> at line 75 in BaseLayout.astro (slot inside head)
- FOUND: noindex meta at byte 7648 inside built /dev/primitives/index.html <head> (before </head> at byte 10032)
- FOUND: zero /dev/ matches in dist/client/sitemap-0.xml and sitemap-index.xml
- FOUND: `Disallow: /dev/` literal in dist/client/robots.txt line 3

---
*Phase: 09-primitives*
*Completed: 2026-04-08*
