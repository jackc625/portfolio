---
phase: 15-analytics-instrumentation
plan: 03
subsystem: client-script
tags: [analytics, scroll-depth, intersection-observer, sentinel-pattern, project-detail-pages, tdd, jsdom-stub, single-observer, one-shot-dedup]

# Dependency graph
requires:
  - phase: 13-content-pass-projects-sync
    provides: "6 active project MDX files in src/content/projects/ (D-04 active set) — the 6 routes that getStaticPaths in src/pages/projects/[id].astro generates and onto which the 4 scroll-depth sentinels emit"
  - phase: 07-chatbot-feature
    provides: "src/scripts/chat.ts module-level chatInitialized init-guard pattern that scrollDepthInitialized mirrors"
provides:
  - "src/scripts/scroll-depth.ts (NEW, 50 lines) — IntersectionObserver-based scroll-depth tracker; exports handleScrollEntry + initScrollDepth; module-level init guard; bootstraps on astro:page-load + DOMContentLoaded; sentinel-presence gate makes it a no-op on non-project routes"
  - "src/pages/projects/[id].astro — 4 scroll-sentinel <div>s inside <article> at CSS top 25/50/75/100% + position:relative on <article> + .scroll-sentinel CSS block (absolute, height:1px, pointer-events:none, aria-hidden via markup)"
  - "tests/client/scroll-depth.test.ts (NEW, 137 lines) — 8 tests across 2 describe blocks: 4 percent-fires (25/50/75/100), unobserve one-shot (D-08), no-fire on isIntersecting=false, pathname slug extraction (window.history.pushState), umami-undefined safety (L10)"
affects:
  - "15-02-analytics-forwarder (Wave 2): Plan 02's BaseLayout body <script> block adds BOTH `import \"../scripts/analytics.ts\";` AND `import \"../scripts/scroll-depth.ts\";` in a single edit; scroll-depth.ts is on disk now so Plan 02's import resolves"
  - "16-motion (future): Phase 16 may consolidate scroll-depth.ts + a future motion.ts into a shared IntersectionObserver — kept as standalone file per CONTEXT §Deferred for clean future-consolidation path"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "First IntersectionObserver in src/ — net-new pattern per RESEARCH §2 (grep confirmed no prior usage); D-06 single-observer-watches-all-sentinels shape; D-07 threshold:0 + rootMargin:'0px' for sentinel-top-enters-viewport semantics"
    - "Sentinel pattern — 4 invisible aria-hidden <div>s positioned by CSS percent (NOT JS math) survive reflow; combined with absolute positioning inside a relative-positioned <article> wrapper; height:1px sliver + pointer-events:none guarantees zero a11y/click impact"
    - "Per-page-view dedup via observer.unobserve(entry.target) on fire (D-08) — no sessionStorage; reloads refire (matches GA4 scroll-depth + Umami dashboard semantics)"
    - "Sentinel-presence DOM gate over path-string sniffing — querySelectorAll('.scroll-sentinel').length === 0 short-circuits init on non-project routes; one fewer drift surface vs location.pathname.startsWith('/projects/')"
    - "jsdom 29 IntersectionObserver stub — class with vi.fn() observe/unobserve/disconnect/takeRecords + captured callback in module-scoped variable; lets unit tests synthesize mock IntersectionObserverEntry and drive handleScrollEntry directly without browser viewport"
    - "Optional-chaining for global vendor sinks — window.umami?.track(...) silent-no-ops the L10 load-race window where scroll-depth.ts runs before the Umami <script> resolves"

key-files:
  created:
    - src/scripts/scroll-depth.ts
    - tests/client/scroll-depth.test.ts
  modified:
    - src/pages/projects/[id].astro

key-decisions:
  - "Kept scroll-depth.ts standalone (NOT folded into analytics.ts) per CONTEXT §Claude's Discretion — preserves Phase 16 motion.ts observer-consolidation path and keeps Plan 02 / Plan 03 file overlap to zero (Wave 1 sibling-independent)"
  - "Sentinel-presence DOM gate (RESEARCH §2.4) over location.pathname sniffing — observer's construction is naturally a no-op on routes without .scroll-sentinel; survives future route renames without code change"
  - "Plan 03 did NOT touch src/layouts/BaseLayout.astro — Plan 02's Task 2 owns the body <script> block edit and adds BOTH `import \"../scripts/analytics.ts\";` AND `import \"../scripts/scroll-depth.ts\";` in a single edit (single-plan-per-file-per-wave rule). Scroll-depth.ts ships on disk in Wave 1; Plan 02 picks it up in Wave 2."
  - "Tests 6 + 8 (no-fire + umami-undefined-safety) baseline-GREEN at Task 1 RED commit — same Plan 01 drift-guard pattern; the 6 fire/unobserve/slug assertions are the actual RED set that flipped GREEN at Task 2. Plan-text said 8 RED; actual was 6 RED + 2 baseline-GREEN-by-design. Documented per Phase 14-05 mismatch precedent."
  - "window.history.pushState worked in jsdom 29 for the slug-extraction test (no Object.defineProperty fallback needed) — tests/client/scroll-depth.test.ts:115 sets pathname to /projects/seatwatch then asserts slug==='seatwatch' as the umami.track second-arg payload"
  - "TS hint suppression for latestObserverCallback variable — added `void latestObserverCallback` in afterEach to silence TS6133 (declared but never read); preserves the captured-callback hook for any future test that drives the constructed observer directly"

requirements-completed: [ANAL-05]
# NOTE: ANAL-05 is partially completed by this plan. Plan 02 completes the
# remaining ANAL-05 surface (outbound_click + resume_download via delegated
# document listener, plus the chat:analytics forwarder for chat_open/message_sent/
# chip_click/chat_error) and ANAL-03 (chat:analytics observability hook).
# This plan completes the scroll-depth half of ANAL-05.

# Metrics
duration: 5min
completed: 2026-04-23
---

# Phase 15 Plan 03: Scroll-Depth Observer + Sentinels Summary

**Project-page scroll telemetry shipped — 4 invisible CSS-percent-positioned `<div class="scroll-sentinel">` elements inside `<article>` paired with the first `IntersectionObserver` in `src/`, dedicated `src/scripts/scroll-depth.ts` module standalone (not folded into analytics.ts) for a clean Phase 16 consolidation path; 8 unit tests pin D-05/D-06/D-07/D-08 behavior; zero touches to BaseLayout.astro per single-plan-per-file-per-wave rule.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-23T23:53:13Z
- **Completed:** 2026-04-23T23:59:11Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files created:** 2 (1 client script + 1 test)
- **Files modified:** 1 (project-detail page)

## Accomplishments

- Authored `src/scripts/scroll-depth.ts` (50 lines) with `handleScrollEntry(entry, observer)` + `initScrollDepth()` exports; module-level `scrollDepthInitialized` guard mirrors `chat.ts` `chatInitialized`; bootstraps on `astro:page-load` + `DOMContentLoaded` (matches `analytics.ts` lifecycle pattern Plan 02 will land); single `IntersectionObserver` with `threshold:0` + `rootMargin:"0px"` per D-07; per-fire `observer.unobserve(entry.target)` per D-08
- Inserted 4 sentinel `<div class="scroll-sentinel" data-percent="N" aria-hidden="true">` elements at `src/pages/projects/[id].astro:82-89` inside the `<article>` after the next-project section closing `</section>` and before the closing `</article>`
- CSS block at `src/pages/projects/[id].astro:96-114`: `article { position: relative }` (new — confirmed no layout regression; existing children are not absolutely-positioned), `.scroll-sentinel { position: absolute; left: 0; right: 0; height: 1px; pointer-events: none }`, and 4 `[data-percent="N"]` selectors at `top: 25%/50%/75%/100%`
- Authored `tests/client/scroll-depth.test.ts` (137 lines) with 8 tests across 2 describe blocks:
  - `scroll-depth observer (D-05, D-06, D-07, D-08)` — 7 tests: 4 percent-fires (25/50/75/100), `observer.unobserve` one-shot, no-fire on `isIntersecting=false`, pathname slug extraction via `window.history.pushState("/projects/seatwatch")`
  - `observer construction gate` — 1 test: `handleScrollEntry` is safe to call with `window.umami` undefined (L10 load-race)
- Test counts: 235 baseline + 8 new = 243/243 GREEN; `pnpm check` 0 errors / 0 warnings / 0 hints; `pnpm build` clean end-to-end (build:chat-context → wrangler types → astro check → astro build → pages-compat)
- Production build confirms: `dist/client/projects/seatwatch/index.html` contains 9 `scroll-sentinel` substring occurrences (4 markup `class=` + 1 CSS `.scroll-sentinel` selector + 4 `[data-percent="N"]` qualified selectors); `dist/client/index.html`, `dist/client/about/index.html`, `dist/client/projects/index.html`, `dist/client/contact/index.html` all return 0 — D-05 scope holds in compiled output
- `git diff HEAD~ -- src/layouts/BaseLayout.astro` returns 0 lines — Plan 03 did NOT touch BaseLayout.astro; Plan 02 owns that edit
- Zero new runtime dependencies; zero new devDependencies; zero `pnpm install` runs

## Task Commits

1. **Task 1: Author tests/client/scroll-depth.test.ts + scroll-depth.ts skeleton (Wave 0 RED)** — `dcb96ad` (test)
2. **Task 2: Implement scroll-depth observer body + insert sentinels on [id].astro (GREEN)** — `67f2d63` (feat)

_Note: Task 1 is the TDD RED commit; Task 2 is the GREEN commit. No REFACTOR commit needed — the implementation that flipped RED → GREEN was the spec, not a refactor target._

## Files Created/Modified

- `src/scripts/scroll-depth.ts` (NEW, 50 lines) — Standalone client script; declares `Window.umami` ambient global; exports `handleScrollEntry` + `initScrollDepth`; module-level `scrollDepthInitialized` boolean guard; bootstraps on `astro:page-load` + `DOMContentLoaded` with `document.readyState !== "loading"` immediate-call branch; `import.meta.env.DEV` console.log for dev observer-attached confirmation
- `tests/client/scroll-depth.test.ts` (NEW, 137 lines) — `// @vitest-environment jsdom` header; module-scoped `latestObserverCallback` capture for the IntersectionObserver stub class (with `void` reference in `afterEach` to silence TS6133); `makeSentinel` + `makeEntry` helpers; 8 `it(...)` tests across 2 `describe` blocks
- `src/pages/projects/[id].astro` (MODIFIED, +20 lines / -1 line net) — 4 sentinel divs at lines 82-89; CSS block at lines 96-114 (new — added at the top of the existing `<style>` block before `.project-meta`)

## Exact Line Ranges

**File:** `src/pages/projects/[id].astro`

**Sentinel insert:**
- Lines 82-85: 3-line JSX comment annotation (Phase 15 D-06 attribution; observer source + threshold semantics)
- Lines 86-89: 4 `<div class="scroll-sentinel" data-percent="N" aria-hidden="true"></div>` elements (one per percent threshold)

**CSS block addition (top of existing `<style>` block):**
- Lines 96-99: 4-line comment annotation (D-06/D-07 attribution + relative-context rationale + no-layout-regression note)
- Lines 100-102: `article { position: relative }` selector
- Lines 103-109: `.scroll-sentinel` base rules (absolute positioning + height + pointer-events)
- Lines 110-113: 4 `.scroll-sentinel[data-percent="N"] { top: N% }` selectors (25, 50, 75, 100)

## Build-Output Invariants Locked

| Invariant | Expected | Actual | Status |
|-----------|----------|--------|--------|
| `grep -o "scroll-sentinel" dist/client/projects/seatwatch/index.html \| wc -l` | ≥4 | 9 | ✓ |
| `grep -o "scroll-sentinel" dist/client/index.html \| wc -l` | 0 | 0 | ✓ |
| `grep -o "scroll-sentinel" dist/client/about/index.html \| wc -l` | 0 | 0 | ✓ |
| `grep -o "scroll-sentinel" dist/client/projects/index.html \| wc -l` | 0 | 0 | ✓ |
| `grep -o "scroll-sentinel" dist/client/contact/index.html \| wc -l` | 0 | 0 | ✓ |
| `grep -o 'data-percent="25"' dist/client/projects/seatwatch/index.html \| wc -l` | ≥1 | 2 (markup + CSS selector) | ✓ |
| `grep -o 'data-percent="50"' dist/client/projects/seatwatch/index.html \| wc -l` | ≥1 | 2 | ✓ |
| `grep -o 'data-percent="75"' dist/client/projects/seatwatch/index.html \| wc -l` | ≥1 | 2 | ✓ |
| `grep -o 'data-percent="100"' dist/client/projects/seatwatch/index.html \| wc -l` | ≥1 | 2 | ✓ |
| `git diff HEAD~ -- src/layouts/BaseLayout.astro \| wc -l` | 0 | 0 | ✓ |

**Note on `grep -c` vs `grep -o | wc -l`:** Acceptance-criteria text used `grep -c` which counts matching *lines*; on minified production HTML, all 4 sentinel divs collapse onto 1-2 lines. The semantic intent (the 4 sentinels are present in the output) is satisfied; `grep -o | wc -l` gives the per-occurrence count (9 for `.scroll-sentinel`, 2 for each `data-percent`) and confirms it.

## Decisions Made

- **Standalone scroll-depth.ts (not folded into analytics.ts):** CONTEXT.md §Claude's Discretion explicitly allows either; standalone keeps Plan 02 / Plan 03 file-overlap at zero (true Wave 1 sibling-independence) AND preserves the Phase 16 motion.ts observer-consolidation path mentioned in CONTEXT §Deferred. Trade-off accepted: Plan 02 imports two modules in BaseLayout instead of one — trivial line addition.
- **Sentinel-presence DOM gate over path-string sniffing (RESEARCH §2.4):** `document.querySelectorAll('.scroll-sentinel').length === 0` short-circuit makes the script naturally route-aware without coupling to URL shapes. If the project-detail route ever moves to `/work/[id]` or similar, this code requires zero change. Path-string detection would have been a drift surface.
- **Plan 03 did NOT touch BaseLayout.astro per single-plan-per-file-per-wave rule:** Plan 02's Task 2 owns the BaseLayout body `<script>` block and lands BOTH the analytics.ts AND scroll-depth.ts imports in a single edit. Plan 03's Wave 1 ships the scroll-depth.ts file on disk so by the time Plan 02 runs in Wave 2 the import resolves. Intermediate state (Wave 1 complete, Plan 02 not yet run) is acceptable: dist/ contains the sentinels but no observer is wired — the observer module is not imported anywhere yet, so it does not execute. End-of-phase build (after Plan 02) has both halves in place.
- **Tests 6 + 8 baseline-GREEN at RED commit (plan-text mismatch documented per Phase 14-05 / Plan 01 precedent):** Plan said "all 8 tests MUST RED" but test 6 (no-fire on `isIntersecting=false`) and test 8 (umami-undefined safety) baseline-GREEN by design — the skeleton's no-op body satisfies both no-fire assertions. Same drift-guard pattern as Plan 01's test #7 (drift guard `is:inline ≤ 2`). The 6 RED tests (4 percent fires + unobserve + slug) are the actual TDD pivot from RED → GREEN at Task 2. This is internal-implementation accuracy, not a deviation.
- **Optional-chaining `window.umami?.track(...)` for L10 load-race:** scroll-depth.ts may execute before Umami's external `<script src="https://cloud.umami.is/script.js">` finishes loading (15-30ms defer window). Optional-chaining silent-no-ops the call rather than throwing — a missed event is better than a thrown ReferenceError that interrupts the user's reading. Test 8 locks this behavior.
- **`window.history.pushState` worked in jsdom 29 for the slug-extraction test:** Plan offered `Object.defineProperty(window, 'location', ...)` as a fallback in case pushState was blocked; not needed — jsdom 29's pushState happily updates `location.pathname` for the test's purposes. Recorded per plan §<output> request.
- **TS6133 hint suppression for `latestObserverCallback` variable:** The IntersectionObserver stub assigns the constructor callback to a module-scoped variable for potential future tests that drive the constructed observer directly (rather than the exported `handleScrollEntry`). TypeScript flags it as "declared but never read" because no current test reads it. Added `void latestObserverCallback` in `afterEach` to silence TS6133 while preserving the capture hook. Tradeoff: 1 line of test plumbing for clean `pnpm check` (0 errors / 0 warnings / 0 hints).

## Deviations from Plan

None — plan executed exactly as written; the six decisions above are within plan scope (Task 1/Task 2 acceptance-criteria satisfaction + documented plan-text-mismatch handling per established Phase 14-05 / Plan 01 precedent).

## Issues Encountered

- **TS6133 hint on `latestObserverCallback` after Task 1 commit:** Initial Task 1 RED test file flagged a TS hint ("declared but never read") because no current test reads the captured-callback variable — the stub only assigns it. Resolved in a single Edit by adding `void latestObserverCallback` in `afterEach` to silence the hint while preserving the captured-callback hook for future tests. `pnpm check` flipped from `1 hint` to `0 hints`; no behavioral change.
- **`grep -c` on minified HTML returns line-counts not occurrence-counts:** Plan acceptance criteria asserted `grep -c "scroll-sentinel" dist/client/projects/seatwatch/index.html` returns ≥4, but `grep -c` counts matching lines and dist HTML is minified onto 1-2 lines. Verified semantic intent with `grep -o "scroll-sentinel" ... | wc -l` which returned 9 (4 markup `class=` + 1 CSS `.scroll-sentinel` selector + 4 `[data-percent="N"]` qualified selectors). Sentinels are in the output; the text-of-criterion was a Windows/PowerShell-grep idiom mismatch, not a real failure.

Both were caught during Task 1/Task 2 verification before the GREEN commit — no rework committed, just the final-state files committed once each.

## Standalone-Module Confirmation (Phase 16 Consolidation Path)

`src/scripts/scroll-depth.ts` is its own file, NOT folded into the future `src/scripts/analytics.ts` (which Plan 02 will create). This was an explicit decision per CONTEXT.md §Claude's Discretion ("scroll-depth observer in its own file or under a Phase 16 motion.ts if clean") and CONTEXT.md §Deferred ("Phase 16 motion.ts observer consolidation"). Future Phase 16 may consolidate scroll-depth + scroll-reveal into a shared `IntersectionObserver` in `src/scripts/motion.ts` — current standalone shape preserves that clean refactor path without forcing Phase 16 to first untangle a fold.

## BaseLayout.astro Untouched Confirmation

`git diff HEAD~ -- src/layouts/BaseLayout.astro` returns 0 lines for both Task 1 and Task 2 commits. Plan 03 did NOT modify BaseLayout.astro — Plan 02's Task 2 (Wave 2) owns the body `<script>` block edit and will add BOTH `import "../scripts/analytics.ts";` AND `import "../scripts/scroll-depth.ts";` in a single edit. Wave 1 ships the scroll-depth.ts module on disk; Wave 2 wires it. End-of-phase build (after Plan 02 runs) will have both the sentinels (this plan) AND the import wiring (Plan 02) in place — runtime observer attaches on every project-detail page load.

## Next Phase Readiness

- `src/scripts/scroll-depth.ts` is on disk, exports stable signatures (`handleScrollEntry`, `initScrollDepth`), and self-bootstraps on `astro:page-load` + `DOMContentLoaded` — Plan 02 can add `import "../scripts/scroll-depth.ts";` to BaseLayout.astro body without further coordination with this plan
- D-26 client-only chat regression surface untouched — `src/scripts/chat.ts`, `src/components/chat/ChatWidget.astro`, all chat tests byte-identical
- Server `src/pages/api/chat.ts` byte-identical (D-15 server-byte-identical gate holds)
- Zero blockers for Wave 2 — Plan 02 has both `analytics.ts` (its own) and `scroll-depth.ts` (this plan's) ready to wire
- `pnpm test` full suite (243/243 GREEN), `pnpm check` (0/0/0), `pnpm build` (clean) — no carry-over tech debt from this plan

## Self-Check: PASSED

**Files verified present:**
- `src/scripts/scroll-depth.ts`: FOUND (created)
- `tests/client/scroll-depth.test.ts`: FOUND (created)
- `src/pages/projects/[id].astro`: FOUND (modified)

**Commits verified present:**
- `dcb96ad` (Task 1 RED): FOUND on main — `git log --oneline -3` confirms
- `67f2d63` (Task 2 GREEN): FOUND on main — `git log --oneline -3` confirms

**Acceptance-criteria grep counts verified:**
- `grep -c "export function handleScrollEntry" src/scripts/scroll-depth.ts` = 1 ✓
- `grep -c "export function initScrollDepth" src/scripts/scroll-depth.ts` = 1 ✓
- `grep -c "scrollDepthInitialized" src/scripts/scroll-depth.ts` = 3 ✓ (≥2 required)
- `grep -c "it(" tests/client/scroll-depth.test.ts` = 8 ✓
- `grep -c "scroll_depth" src/scripts/scroll-depth.ts` = 1 ✓
- `grep -c "threshold: 0" src/scripts/scroll-depth.ts` = 1 ✓
- `grep -c "new IntersectionObserver" src/scripts/scroll-depth.ts` = 1 ✓
- `git diff HEAD~ -- src/layouts/BaseLayout.astro \| wc -l` = 0 ✓
- `pnpm test -- tests/client/scroll-depth.test.ts` = 243/243 GREEN (8 new scroll-depth tests + 235 baseline) ✓
- `pnpm check` = 0 errors / 0 warnings / 0 hints ✓
- `pnpm build` exits 0 with zero warnings; all 11 routes prerendered ✓
- `dist/client/projects/seatwatch/index.html` contains 9 `scroll-sentinel` occurrences ✓ (≥4 required by intent)
- `dist/client/{index, about/index, projects/index, contact/index}.html` contain 0 `scroll-sentinel` occurrences ✓ (D-05 scope)

---
*Phase: 15-analytics-instrumentation*
*Completed: 2026-04-23*
