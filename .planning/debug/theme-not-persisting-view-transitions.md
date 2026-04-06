---
status: diagnosed
trigger: "Theme selection doesn't persist when navigating between pages. Works on reload but resets during View Transitions navigation."
created: 2026-03-30T00:00:00Z
updated: 2026-03-30T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — Astro View Transitions replaces the entire <html> element's attributes with those from the new page's static HTML during swap. The new page's HTML has no data-theme attribute (dark is default, no attribute). The is:inline script in <head> does NOT re-execute during View Transition navigation. No code listens to astro:after-swap to restore theme.
test: Verified via Astro docs, GitHub issue #7765, and codebase grep for astro:after-swap (zero results)
expecting: n/a — confirmed
next_action: Report root cause

## Symptoms

expected: Theme choice persists when clicking nav links to other pages
actual: Navigating to another page resets theme back to dark (default). Theme persists across full page reloads (localStorage works).
errors: No error messages — visual bug only
reproduction: 1) Visit site 2) Click theme toggle to switch to light mode 3) Click a nav link to another page 4) Theme resets to dark
started: Since View Transitions were added (ClientRouter)

## Eliminated

## Evidence

- timestamp: 2026-03-30T00:01:00Z
  checked: BaseLayout.astro inline theme script (lines 39-46)
  found: Script uses is:inline and runs IIFE that reads localStorage and sets data-theme on documentElement. This runs synchronously on initial parse.
  implication: On full reload this works. During View Transition navigation, is:inline scripts in head are NOT re-executed because Astro merges head content rather than replacing it.

- timestamp: 2026-03-30T00:02:00Z
  checked: ThemeToggle.astro script (lines 76-117)
  found: Uses document.addEventListener('astro:page-load', initThemeToggle) — correctly reinitializes toggle button listeners after View Transition. Toggle writes to localStorage AND sets data-theme on html.
  implication: The toggle re-binding is correct. The issue is not about the toggle failing to reinitialize — it's about the html data-theme attribute being reset during navigation.

- timestamp: 2026-03-30T00:03:00Z
  checked: global.css theme architecture
  found: Dark is default (:root), light requires [data-theme="light"] on html. If data-theme attribute disappears, site reverts to dark.
  implication: If View Transitions swap resets the html element's attributes, theme will revert to dark.

- timestamp: 2026-03-30T00:04:00Z
  checked: Astro View Transitions swap behavior (docs + GitHub issue #7765)
  found: During ClientRouter navigation, Astro fetches the new page and swaps the DOM. The <html> element's attributes are replaced with those from the new page's static HTML. Since the static HTML has no data-theme attribute (dark is the default with no attribute), any client-side data-theme="light" attribute is lost.
  implication: This is the root cause. The swap replaces html attributes, removing data-theme="light".

- timestamp: 2026-03-30T00:05:00Z
  checked: Codebase for astro:after-swap or astro:before-swap listeners
  found: Zero results. No code in the project listens to either swap lifecycle event. The only lifecycle events used are astro:page-load (ThemeToggle, animations, CanvasHero, MobileMenu) and astro:before-preparation (animations, CanvasHero).
  implication: There is no mechanism to restore theme state during the swap. The is:inline script in <head> only runs on initial page load, not during View Transition navigation. By the time astro:page-load fires (which ThemeToggle listens to), the page has already rendered with wrong theme — causing a flash.

- timestamp: 2026-03-30T00:06:00Z
  checked: BaseLayout.astro inline script (lines 39-46)
  found: The is:inline script correctly reads localStorage and sets data-theme, but it only executes on full page loads. During View Transition navigation, Astro merges <head> content but does NOT re-execute is:inline scripts that are already present.
  implication: The existing prevention-of-flash mechanism is correct for full page loads but completely bypassed during View Transition navigation.

## Resolution

root_cause: |
  Astro's View Transitions (ClientRouter) replaces the <html> element's attributes during
  page swap with those from the new page's static HTML. Since the static HTML never includes
  data-theme="light" (dark is the default, requiring no attribute), the client-side
  data-theme="light" attribute set by the toggle is lost on every navigation.

  The is:inline theme detection script in BaseLayout <head> (line 39-46) correctly prevents
  flash on full page loads, but does NOT re-execute during View Transition navigation because
  Astro merges head content rather than re-parsing it.

  No code in the project listens to the astro:after-swap event, which is the correct lifecycle
  hook for restoring html attributes before the new page is painted.

  Files involved:
  - src/layouts/BaseLayout.astro lines 39-46: inline script only handles initial load
  - src/components/ThemeToggle.astro line 116: listens to astro:page-load (too late — page
    already painted with wrong theme, would cause flash even if it restored theme)

  The fix requires adding an astro:after-swap listener that reads localStorage and restores
  data-theme on the html element BEFORE the new page is painted. This should be an is:inline
  script in the <head> of BaseLayout.astro alongside the existing theme detection script.

fix:
verification:
files_changed: []
