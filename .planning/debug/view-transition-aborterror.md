---
status: diagnosed
trigger: "Got this error message in the console: Uncaught (in promise) AbortError: Transition was skipped"
created: 2026-05-10T00:00:00Z
updated: 2026-05-10T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — the rejection comes from the browser-native cross-document View Transition (`@view-transition { navigation: auto }` in `src/styles/global.css:539-541`). When a navigation supersedes an in-flight transition (rapid clicks, prefetch races, or back/forward), the spec mandates the previous `ViewTransition.finished` Promise reject with `AbortError: "Transition was skipped"`. The site has zero JS code that observes that Promise (no `pageswap`/`pagereveal` handler, no `startViewTransition` call), so the rejection is necessarily unhandled.
test: Exhaustive grep of `src/**/*.{astro,ts,tsx,js,mjs}` for every View Transitions API surface
expecting: confirmed
next_action: Report root cause; do NOT apply fix (per task scope)

## Symptoms

expected: Clean cross-page navigation on https://jackcutrara.com (apex, post-Phase-17 Workers cutover) should produce no console errors. Even fast/interrupted navigations should be silently caught.
actual: Console shows `Uncaught (in promise) AbortError: Transition was skipped` while navigating between pages in production.
errors: |
  Uncaught (in promise) AbortError: Transition was skipped
reproduction: Navigate between pages on https://jackcutrara.com (production). Trigger pattern not yet 100% pinned (see Severity), but consistent with supersession — rapid clicks, link prefetch racing user click, or back/forward navigation while the prior fade is still running.
started: Surfaced after Phase 17 Pages → Workers cutover for the apex domain. Logged as 17-UAT.md Test 2 (severity major).

## Eliminated

- hypothesis: Astro's `<ClientRouter />` swallowing the rejection in 6.0.x
  evidence: `BaseLayout.astro` does not render `<ClientRouter />` or `<ViewTransitions />`. Codebase grep returns zero runtime usages — only historical comments and a test (`tests/build/motion-doc.test.ts:101`) asserting MASTER.md §8 still BANS ClientRouter. Phase 8-03 commit `c5d0911 feat(08-03): remove GSAP, ClientRouter, motion machinery (atomic)` removed it. So this is not Astro's wrapper at all — it is the raw browser API.
  timestamp: 2026-05-10T00:01:00Z

- hypothesis: A direct `document.startViewTransition(...)` call somewhere in client scripts (`chat.ts`, `analytics.ts`, `scroll-depth.ts`, `motion.ts`, `MobileMenu.astro`, `ChatWidget.astro`)
  evidence: Grep across `src/**/*.{astro,ts,tsx,js,mjs,mts}` for `startViewTransition`, `pageswap`, `pagereveal`, `viewTransition.finished`, `viewTransition.ready` returns zero matches. The codebase never touches the JS surface of the API.
  timestamp: 2026-05-10T00:02:00Z

- hypothesis: GSAP / animation library awaiting a transition Promise without try/catch
  evidence: GSAP was removed in Phase 8-03 (`c5d0911`). No `motion` package, no Lenis, no JS animation library — confirmed by `MOTION.md §1` ("Native platform only … zero `package.json` runtime dependencies for motion") and `tests/build/motion-doc.test.ts` enforcement. There is no JS layer that could be holding the Promise.
  timestamp: 2026-05-10T00:03:00Z

- hypothesis: Page-specific `transition:animate` / `transition:name` directive interaction
  evidence: Codebase grep for `transition:animate` and `transition:name` returns zero matches across `src/`. Those Astro directives only function with `<ClientRouter />` anyway, which is not present.
  timestamp: 2026-05-10T00:04:00Z

## Evidence

- timestamp: 2026-05-10T00:05:00Z
  checked: src/styles/global.css lines 535-573 (Phase 16-04 motion stack)
  found: `@view-transition { navigation: auto; }` declared at line 539-541 with `::view-transition-old(root)` / `::view-transition-new(root)` 200ms ease-out fade keyframes inside `@media (prefers-reduced-motion: no-preference)` at lines 568-573. Header comment (lines 536-538) explicitly notes: "Native cross-document `@view-transition`. Astro 6 ships HTML pages; the browser runs the transition automatically on cross-document navigation when the navigation: auto descriptor is set. No `<ClientRouter />`, no JS router."
  implication: Every cross-document navigation between pages is upgraded by the browser to a View Transition. The browser internally creates a `ViewTransition` object whose `finished` Promise the site never observes.

- timestamp: 2026-05-10T00:06:00Z
  checked: src/layouts/BaseLayout.astro (full file, 124 lines)
  found: No `<ClientRouter />`, no `<ViewTransitions />`, no `<script>` block touching the View Transitions API. Body-end `<script>` only imports `analytics.ts`, `scroll-depth.ts`, `motion.ts`. No `pageswap` / `pagereveal` listener registered anywhere in the layout or its children.
  implication: There is no application-level Promise consumer. The unhandled rejection lives entirely between the browser's spec-mandated rejection and the global `unhandledrejection` event.

- timestamp: 2026-05-10T00:07:00Z
  checked: Web spec — MDN ViewTransition.finished + Chrome cross-document docs (Google I/O 2024 update)
  found: For cross-document transitions, the browser creates the ViewTransition implicitly. When supersession happens (new navigation starts before fade completes, document visibility flips to hidden, or another transition is scheduled), the spec requires `ViewTransition.finished` to reject with `AbortError: "Transition was skipped"`. No browser API auto-attaches a `.catch()` to that Promise — the site is responsible for it via `pageswap` (which receives `event.viewTransition`) or via a global `unhandledrejection` handler.
  implication: The error message is exactly the spec-defined wording. This is normal browser behavior — not an Astro 6 regression and not a Cloudflare Workers regression.

- timestamp: 2026-05-10T00:08:00Z
  checked: Phase 17 Pages → Workers cutover (commits 11dc7bd through 18fcee1) and `.planning/phases/17-foundations-migration-dns-debt-sweep/17-UAT.md` Test 2
  found: 17-UAT.md captures this exact symptom (line 22, 92) as Phase 17 Test 2 / Gap "Site navigation between pages on jackcutrara.com completes without uncaught console errors". The CSS rule itself is unchanged across the cutover (Phase 16-04 commit `995f5b2`); what changed is hosting (Pages → Workers) and possibly cache headers / prefetch behavior. Workers Static Assets may serve `<link rel="prefetch">` (Astro default for in-viewport `<a>`) with different timing than Pages CDN, increasing the odds that a prefetched destination is ready before the user click, which lets a transition start and then immediately get superseded by a follow-up nav. The error existed pre-cutover (latent, low-frequency); it became noticeable post-cutover.
  implication: Cutover did not introduce the bug — it raised its visibility. Severity remains "cosmetic noise on a polished portfolio" rather than "functional navigation failure".

- timestamp: 2026-05-10T00:09:00Z
  checked: Astro version + transitions config — `astro.config.mjs` and `package.json`
  found: `astro@^6.0.8`, no `experimental.viewTransitions` flag, no `viewTransitions:` adapter config. The cross-document API path bypasses Astro entirely — Astro is just a static-HTML emitter here. The browser handles everything.
  implication: There is no Astro upstream bug to file. Astro 6 is doing exactly what it's supposed to do: emit HTML and stay out of the way. The behavior is in the browser, governed by the W3C CSS View Transitions Module Level 2.

## Resolution

root_cause: |
  The site uses native cross-document View Transitions via `@view-transition { navigation: auto; }` declared at `src/styles/global.css:539-541` (added Phase 16-04, commit 995f5b2). When the browser supersedes an in-flight transition — any navigation that starts before the prior 200ms `::view-transition-old(root)` fade completes, plus document-hidden visibility flips and back/forward races — the W3C spec requires the implicit `ViewTransition.finished` Promise to reject with a `DOMException` named `AbortError` and message "Transition was skipped".

  The codebase has zero handlers for that Promise:
  - No `<ClientRouter />` (MASTER.md §8 / MOTION.md §1 explicitly ban it; Phase 8-03 commit `c5d0911` removed it).
  - No `document.startViewTransition(...)` call site.
  - No `window.addEventListener("pageswap", ...)` or `pagereveal` handler that could grab `event.viewTransition.finished` and attach a `.catch()`.
  - No global `unhandledrejection` handler in `BaseLayout.astro`, `analytics.ts`, `scroll-depth.ts`, `motion.ts`, or `chat.ts`.

  Because no application code observes the implicitly-created ViewTransition object, the spec-mandated rejection has nowhere to be caught and surfaces in DevTools as `Uncaught (in promise) AbortError: Transition was skipped`.

  The Phase 17 Pages → Workers cutover did not introduce the rule (it has been live since 16-04, 2026-04-27). What likely changed visibility is cache/prefetch timing on the Workers Static Assets path, which makes supersessions more frequent. Logged as 17-UAT.md Test 2 / Gap entry (severity: major; classification on revisit: cosmetic console noise — see Severity).

  Affected artifacts (paths + what's wrong):
  - `src/styles/global.css:539-541` — the `@view-transition { navigation: auto }` declaration that opts the site into browser-native cross-document transitions. Working as designed (MOTN-01 spec, MOTION.md §5). Not the bug.
  - `src/layouts/BaseLayout.astro` head/body — missing the listener that would consume the implicit ViewTransition Promise. This is the actual gap.
  - `design-system/MOTION.md §5 (MOTN-01 row)` — locks the visual contract but does not specify the unhandled-rejection contract. Latent gap in the spec, not a bug per se.

  Missing pieces (conceptual — no code yet):
  - A single registration that observes the implicit cross-document ViewTransition object and attaches a no-op `.catch()` that swallows `AbortError` (and only `AbortError` — other errors should still surface). Two viable shapes:
    1. `window.addEventListener("pageswap", (e) => { e.viewTransition?.finished.catch(() => {}); })` in an `is:inline` head script in `BaseLayout.astro`. Targeted, reads as exactly what it does, runs on every cross-document nav, no module-eval timing concerns.
    2. A `window.addEventListener("unhandledrejection", (e) => { if (e.reason instanceof DOMException && e.reason.name === "AbortError" && /Transition was skipped/.test(e.reason.message)) e.preventDefault(); })` global guard. Catches the same error from any future code path too, slightly broader blast radius (could mask unrelated AbortErrors if not narrowed by the message check).

  Closure path (what a fix plan would do):
  - Decide between the two shapes above (recommend Option 1: targeted, narrower, self-documenting at the call site).
  - Add the listener as an `is:inline` `<script>` in `BaseLayout.astro` head (must be `is:inline` because no module-bundling overhead is acceptable for a 60-byte handler that needs to register before the first cross-document nav can possibly begin).
  - Amend `design-system/MOTION.md §5 (MOTN-01)` to spec the rejection-handling contract alongside the visual contract, so future motion changes do not silently regress this.
  - Add a Vitest assertion (build-time string-grep on the built `BaseLayout` HTML) that the handler script is present, mirroring the existing MOTN gating tests in `tests/client/reduced-motion.test.ts` and `tests/build/motion-css-rules.test.ts`.
  - Optionally close the Phase 17 Gap entry in `17-UAT.md` Test 2 once the fix lands and a manual reproduction confirms the console is clean across rapid-click navigation.

  Severity assessment: COSMETIC NOISE, not a functional navigation failure. The browser still completes the navigation correctly — the new page renders, all content is intact, the chat widget remains functional. The only impact is DevTools console output. However, the project's value contract (PROJECT.md "Core Value": recruiters/engineers should "immediately see Jack as someone worth interviewing") makes a noisy console a non-trivial regression for the audience that opens DevTools — engineers evaluating technical polish. Phase 17 UAT correctly flagged it as "major" rather than "minor" for that reason. It is not a blocker for navigation, but it is a blocker for the polish promise.

fix:
verification:
files_changed: []
