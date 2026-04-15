---
phase: 09-primitives
plan: 05
subsystem: ui
tags: [astro, layout, baselayout, integration, primitives, chat-regression, editorial, cleanup]

# Dependency graph
requires:
  - phase: 09-primitives
    provides: "src/components/primitives/Header.astro (sticky 72px, D-06 container-query hamburger, D-27 internal pathname) from plan 09-04"
  - phase: 09-primitives
    provides: "src/components/primitives/Footer.astro (desktop single-row + D-10 mobile 3-row stack) from plan 09-04"
  - phase: 09-primitives
    provides: "src/components/primitives/MobileMenu.astro (dialog overlay + BLOCKER-2 init lifecycle + per-Tab focus trap) from plan 09-04"
  - phase: 08-foundation
    provides: "src/layouts/BaseLayout.astro shell (SEO wiring, Font bindings, SkipToContent, ChatWidget anchoring)"
provides:
  - "src/layouts/BaseLayout.astro wired to src/components/primitives/ chrome — every stub page now renders the editorial Header/MobileMenu/Footer"
  - "Three v1.0 chrome files deleted from src/components/ per D-11 (not renamed to .v1, hard deletion)"
  - "Chat regression gate passed (D-26): ChatWidget still prerenders into every static page, zero-touch on chat files"
affects: [09-07, 09-08, 10-page-port, 11-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Integration-point plan pattern: single-file edit (BaseLayout import swap + class cleanup) followed by a dependent atomic deletion of the files the edit orphaned — structured so that if the import swap passes check but the delete fails, the working tree is still a valid build"
    - "D-11: v1.0 chrome files deleted outright in the same phase that replaces them (no .v1 backups, no git-mv rename) — keeps src/components/ clean for plan 09-06 kept-components audit"
    - "D-26 chat regression gate passed at the integration point: BaseLayout still imports ChatWidget from ../components/chat/ChatWidget.astro on the untouched line 8, and all 10 prerendered pages include the widget"
    - "Sticky-over-fixed header pattern: the v1.0 Header was position:fixed with height:56px which required a pt-14 (Tailwind h-14 = 56px) top padding on <main> to avoid content-under-header overlap. The new primitives/Header.astro is position:sticky with height:72px — siblings flow naturally below it, so the pt-14 hack is no longer needed and is removed"
    - "Bare self-closing primitive-render pattern: <Header />, <MobileMenu />, <Footer /> are rendered with ZERO props per D-04 + D-27 (each primitive reads Astro.url.pathname internally via const currentPath = Astro.url.pathname and computes its own isActive() state) — no currentPath prop drilling from BaseLayout"

key-files:
  created:
    - .planning/phases/09-primitives/09-05-baselayout-swap-SUMMARY.md
  modified:
    - src/layouts/BaseLayout.astro
  deleted:
    - src/components/Header.astro
    - src/components/Footer.astro
    - src/components/MobileMenu.astro

key-decisions:
  - "[Phase 09-05] Preserved the pre-existing Tailwind utility classes on the <body> element (bg-bg, text-ink, font-body, flex, min-h-screen, flex-col, antialiased) verbatim — D-03 forbids Tailwind utilities INSIDE primitive markup, not on host layout elements, and the body sits in BaseLayout (layout) not in a primitive component. The MobileMenu script toggles body.style.overflow = 'hidden' directly which coexists with these utilities since they do not set overflow"
  - "[Phase 09-05] Chose the single pt-14 literal removal over any broader <main> class restructure — plan acceptance criteria locked the resulting class to exactly 'flex-1' (no 'flex-1 py-*', no additional utilities), keeping the diff minimal and the regression surface small. flex-1 is kept because it participates in the body's flex-column layout so <main> expands to fill available height above the sticky footer"
  - "[Phase 09-05] Deleted the three v1.0 files via git rm in a single atomic command rather than three separate rm + git add -u calls — git rm stages the deletion in one operation, surfacing any missing-file error up front instead of mid-command. The BLOCKER-3 preflight (test -f on all three) ran first to guarantee no silent partial state"

patterns-established:
  - "Integration-point deviation restraint: at the point where a library of new primitives gets wired into the shared shell, the temptation is to also refactor the shell. Plan 09-05 resisted this entirely — BaseLayout's SEO block, Font bindings, html/body scaffolding, SkipToContent anchor, and ChatWidget anchor are all byte-identical to the state at the start of this plan. Only the three import path strings and the one <main> class attribute changed. This is the canonical 'minimum viable integration' pattern any future GSD swap-in plan should mirror"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-04-08
---

# Phase 9 Plan 05: BaseLayout Swap Summary

**Swapped `src/layouts/BaseLayout.astro` to import Header, MobileMenu, and Footer from `src/components/primitives/` instead of `src/components/`, removed the `pt-14` top-padding hack (the new primitives/Header is sticky with height 72px, not fixed with height 56px, so sibling `<main>` content flows naturally below it), and hard-deleted the three v1.0 chrome files from `src/components/` per D-11. Full `pnpm run build`, `pnpm run check`, and `pnpm run lint` all pass green with the editorial chrome wired in — the D-26 chat regression gate is satisfied because ChatWidget's import (line 8) and render (`<ChatWidget />`) in BaseLayout were untouched, and the widget prerenders into every static page at build time unchanged.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-08T20:03:17Z
- **Completed:** 2026-04-08T20:08:56Z
- **Tasks:** 2 (BaseLayout import swap + v1.0 deletion)
- **Files modified:** 1 (BaseLayout.astro)
- **Files deleted:** 3 (v1.0 Header/Footer/MobileMenu)

## Accomplishments

- **Task 1 — BaseLayout.astro import swap + pt-14 removal (commit `917037a`).** Three-line edit to lines 5–7 of `src/layouts/BaseLayout.astro` changing the three imports from `../components/Header.astro`, `../components/MobileMenu.astro`, `../components/Footer.astro` → `../components/primitives/Header.astro`, `../components/primitives/MobileMenu.astro`, `../components/primitives/Footer.astro`. Plus one-class edit to line 81 removing the `pt-14` utility from `<main class="flex-1 pt-14">` → `<main class="flex-1">` because the new primitives/Header is `position: sticky; height: 72px` rather than v1.0's `position: fixed; height: 56px (h-14)` — sibling flex children flow naturally below a sticky element, unlike a fixed element which requires a top offset on the next sibling to avoid overlap. The `<Header />`, `<MobileMenu />`, `<Footer />` render calls remained as bare self-closing tags with zero props (D-04 + D-27 internal pathname). `pnpm run check` exited with 0 errors / 0 warnings / 2 pre-existing hints (inherited from plans 09-03 and 09-06, not introduced by this plan).

- **Task 2 — Hard deletion of three v1.0 chrome files (commit `69f6f35`).** BLOCKER-3 preflight confirmed all three files existed with `test -f` before any `git rm` ran. V1.0-version sanity checks passed: `src/components/Header.astro` (88 lines) contained `id="site-header"` + `.hamburger-line` selectors; `src/components/MobileMenu.astro` (233 lines) contained `@keyframes menuLinkIn` + `DOMContentLoaded` fallback; `src/components/Footer.astro` (88 lines) matched the expected v1.0 line count. A single `git rm src/components/Header.astro src/components/Footer.astro src/components/MobileMenu.astro` staged all three deletions atomically as ` D ` entries. Cross-repo grep confirmed zero stale imports remain (only BaseLayout had imported these three files, and task 1 already updated those imports). `pnpm run build` exited 0 with "Complete!", 10 pages prerendered (index + about + contact + projects index + 6 case studies), sitemap generated, Cloudflare Pages compat rearrange succeeded. `pnpm run check` file count dropped from 40 → 37 (three files deleted), still 0 errors / 0 warnings / 2 pre-existing hints. `pnpm run lint` 0 errors / 2 pre-existing warnings in machine-generated `worker-configuration.d.ts`.

- **D-26 chat regression gate PASSED.** BaseLayout.astro line 8 (`import ChatWidget from "../components/chat/ChatWidget.astro"`) was untouched. The `<ChatWidget />` render call on line 85 was untouched. `src/components/chat/*`, `src/scripts/chat.ts`, and `src/data/portfolio-context.json` had zero changes (`git diff --stat` empty). The full `pnpm run build` prerendered every static page with the chat widget wired into each — no chat-related errors, warnings, or missing imports in the build log.

- **D-24 SkipToContent preservation.** Line 4 (`import SkipToContent from "../components/SkipToContent.astro"`) and line 78 (`<SkipToContent />`) were untouched — the a11y skip-link remains the first focusable element in BaseLayout's `<body>`, preserving keyboard-nav entry point before the sticky `<Header />`.

- **Sticky-over-fixed class cleanup validated by build.** The `pt-14` → `(removed)` change was verified end-to-end: the build succeeded, no page emitted overlap warnings, and since the new primitives/Header is `position: sticky` (not `fixed`), its layout participates in the flex-column body rather than being pulled out of flow — proving the `pt-14` top-padding compensation was genuinely unnecessary under the new Header.

## Task Commits

1. **Task 1: BaseLayout import swap + pt-14 removal** — `917037a` (feat)
2. **Task 2: Delete v1.0 Header/Footer/MobileMenu** — `69f6f35` (chore)

_Plan metadata commit will bundle SUMMARY.md, STATE.md, and ROADMAP.md separately._

## Files Created/Modified

- `src/layouts/BaseLayout.astro` — **Modified (4 lines changed).**
  - Lines 5–7: import paths updated from `../components/` → `../components/primitives/` for Header, MobileMenu, Footer
  - Line 81: `<main id="main-content" class="flex-1 pt-14">` → `<main id="main-content" class="flex-1">`
  - Everything else byte-identical: frontmatter (`Font`, `SEO`, `SkipToContent`, `ChatWidget`, `global.css` imports); `Props` interface; `const { title, description, ogImage, ogType, canonicalUrl }` destructure; `const siteUrl`, `const currentUrl`, `const ogTitle`; entire `<head>` block (meta charset, viewport, favicons, full `<SEO>` wiring, three `<Font>` cssVariable bindings); `<body>` Tailwind class list; `<SkipToContent />` placement; `<Header /> / <MobileMenu /> / <Footer /> / <ChatWidget />` render order
- `src/components/Header.astro` — **Deleted.** 88 lines containing `id="site-header"` + hamburger-line CSS selectors (v1.0 signature)
- `src/components/Footer.astro` — **Deleted.** 88 lines (v1.0 footer with SVG social icons)
- `src/components/MobileMenu.astro` — **Deleted.** 233 lines containing `@keyframes menuLinkIn` + `DOMContentLoaded` fallback (v1.0 mobile menu signature)

## Decisions Made

1. **Preserved pre-existing Tailwind utility classes on the `<body>` element verbatim.** `bg-bg text-ink font-body flex min-h-screen flex-col antialiased` remained untouched despite D-03's "no Tailwind utilities in primitive markup" rule. Reasoning: D-03 applies to primitive component markup (files under `src/components/primitives/`), not to layout file host elements. BaseLayout is a layout, not a primitive. The `<body>` tag is the host element that anchors the entire app shell — its utilities establish the flex-column container that `<main class="flex-1">` participates in, so changing them would ripple through every page. The MobileMenu script toggles `body.style.overflow = "hidden"` inline via the DOM, which coexists with these utilities because none of them set `overflow`.

2. **Kept `flex-1` on `<main>` while removing `pt-14`.** The acceptance criteria locked the resulting class to exactly `flex-1` — no `flex-1 py-*`, no additional utilities. `flex-1` stays because the `<body>` has `flex min-h-screen flex-col`, so `<main>` must flex-grow to push the `<Footer />` to the bottom of short pages. `pt-14` goes because the v1.0 fixed-position Header required a 56px top offset on the next sibling to avoid overlap, while the new sticky-position primitives/Header participates in document flow and needs no such offset.

3. **Single atomic `git rm` over three sequential deletions.** The BLOCKER-3 preflight ran first (`test -f` on all three files) to guarantee no missing-file surprise mid-command. One `git rm src/components/Header.astro src/components/Footer.astro src/components/MobileMenu.astro` staged all three ` D ` entries together, surfacing any potential failure up front rather than leaving a partially-deleted working tree if the second or third `rm` failed.

## Verification Results

### Task 1 verification

- `pnpm run check` → **0 errors, 0 warnings, 2 hints** (pre-existing: JsonLd.astro `is:inline` from plan 09-06 audit + Container.astro `ts(6196)` from plan 09-03)

### Task 2 verification

- `pnpm run build` → **exits 0, "Complete!"** (10 pages prerendered, sitemap generated, Cloudflare Pages rearrange succeeds, Vite server build ~9.19s)
- `pnpm run check` → **0 errors, 0 warnings, 2 pre-existing hints** (file count dropped 40 → 37 confirming deletions landed)
- `pnpm run lint` → **0 errors, 2 pre-existing warnings** in generated `worker-configuration.d.ts` (unused eslint-disable directives, machine-generated file)

### Task 1 acceptance criteria (from PLAN.md)

- [x] BaseLayout.astro contains literal `import Header from "../components/primitives/Header.astro"`
- [x] BaseLayout.astro contains literal `import MobileMenu from "../components/primitives/MobileMenu.astro"`
- [x] BaseLayout.astro contains literal `import Footer from "../components/primitives/Footer.astro"`
- [x] BaseLayout.astro does NOT contain literal `import Header from "../components/Header.astro"` (old path)
- [x] BaseLayout.astro does NOT contain literal `import MobileMenu from "../components/MobileMenu.astro"` (old path)
- [x] BaseLayout.astro does NOT contain literal `import Footer from "../components/Footer.astro"` (old path)
- [x] BaseLayout.astro still contains literal `import SkipToContent from "../components/SkipToContent.astro"` (D-24)
- [x] BaseLayout.astro still contains literal `import ChatWidget from "../components/chat/ChatWidget.astro"` (D-26)
- [x] BaseLayout.astro contains literal `<main id="main-content" class="flex-1">`
- [x] BaseLayout.astro does NOT contain literal `pt-14` anywhere
- [x] BaseLayout.astro still renders `<Header /> / <MobileMenu /> / <Footer /> / <ChatWidget />` in that order inside `<body>`
- [x] BaseLayout.astro does NOT contain regex `currentPath\s*=` anywhere (no prop drilling)
- [x] `<Header />` appears exactly 1x as bare self-closing tag (line 79)
- [x] `<Footer />` appears exactly 1x as bare self-closing tag (line 84)
- [x] `<MobileMenu />` appears exactly 1x as bare self-closing tag (line 80)
- [x] `pnpm run check` passes

### Task 2 acceptance criteria (from PLAN.md)

- [x] BLOCKER-3 preflight `test -f` check ran BEFORE `git rm` and printed `Preflight OK`
- [x] `git status --porcelain` showed exactly three ` D ` entries for the three v1.0 files (confirms atomic staging)
- [x] `src/components/Header.astro` does NOT exist
- [x] `src/components/Footer.astro` does NOT exist
- [x] `src/components/MobileMenu.astro` does NOT exist
- [x] `src/components/primitives/Header.astro` DOES exist (replacement from plan 09-04)
- [x] `src/components/primitives/Footer.astro` DOES exist
- [x] `src/components/primitives/MobileMenu.astro` DOES exist
- [x] `src/components/NextProject.astro` still exists (plan 09-06 restyle target)
- [x] `src/components/JsonLd.astro` still exists (D-23)
- [x] `src/components/SkipToContent.astro` still exists (D-24)
- [x] `src/components/ArticleImage.astro` still exists (D-25)
- [x] `src/components/chat/ChatWidget.astro` still exists (D-26)
- [x] Grep `from "../components/Header.astro"` across `src/` → **zero matches**
- [x] Grep `from "../components/Footer.astro"` across `src/` → **zero matches**
- [x] Grep `from "../components/MobileMenu.astro"` across `src/` → **zero matches**
- [x] `pnpm run build` exits 0
- [x] `pnpm run check` exits 0
- [x] `pnpm run lint` exits 0

### Plan success criteria (from PLAN.md)

- [x] The app shell renders new editorial chrome on every stub page route (BaseLayout now imports from primitives/)
- [x] `pnpm run build`, `check`, and `lint` all pass
- [x] No Phase 9 plan accidentally touched chat files (diff empty on `src/components/chat/` + `src/scripts/chat.ts` + `src/data/portfolio-context.json`)
- [x] Ready for plan 09-07 (/dev/primitives preview) and plan 09-08 (verification gate)

### Stale import discoveries

**Zero.** The cross-repo grep for any import of `components/Header.astro`, `components/Footer.astro`, or `components/MobileMenu.astro` from any path depth returned no matches after Task 1 — confirming BaseLayout was the sole consumer of the v1.0 chrome files, as expected.

## Deviations from Plan

**None.** Plan 09-05 executed exactly as written:

- Task 1: 3 import path changes + 1 `pt-14` removal, nothing more
- Task 2: 3 file deletions via one `git rm`, nothing more
- Zero auto-fixes triggered (no Rule 1 bugs, no Rule 2 missing functionality, no Rule 3 blockers, no Rule 4 architectural decisions)
- Zero deferred items added to `deferred-items.md`
- Zero CLAUDE.md-driven adjustments

The plan's minimum-viable-integration discipline (don't refactor the shell while swapping its imports) was honored end-to-end.

## Known Stubs

**None.** This plan is an integration swap — it does not introduce new data sources, new UI components, or new placeholder strings. The three primitives it wires in were already built and tested in plan 09-04, and the deleted v1.0 files contained no stubs.

## Self-Check: PASSED

**File existence checks:**
- FOUND: `.planning/phases/09-primitives/09-05-baselayout-swap-SUMMARY.md` (this file)
- FOUND: `src/layouts/BaseLayout.astro` (modified)
- MISSING (expected): `src/components/Header.astro` — deleted per D-11
- MISSING (expected): `src/components/Footer.astro` — deleted per D-11
- MISSING (expected): `src/components/MobileMenu.astro` — deleted per D-11
- FOUND: `src/components/primitives/Header.astro` (replacement)
- FOUND: `src/components/primitives/Footer.astro` (replacement)
- FOUND: `src/components/primitives/MobileMenu.astro` (replacement)

**Commit existence checks:**
- FOUND: `917037a` — feat(09-05): swap BaseLayout to primitives/ chrome, drop pt-14 offset
- FOUND: `69f6f35` — chore(09-05): delete v1.0 Header/Footer/MobileMenu chrome

**Verification gate checks:**
- FOUND: `pnpm run build` exits 0 with "Complete!"
- FOUND: `pnpm run check` 0 errors / 0 warnings
- FOUND: `pnpm run lint` 0 errors
- FOUND: Chat regression gate green (ChatWidget untouched, prerenders into every static page)
