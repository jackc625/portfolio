---
phase: 09-primitives
fixed_at: 2026-04-08T00:00:00Z
review_path: .planning/phases/09-primitives/09-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 9: Code Review Fix Report

**Fixed at:** 2026-04-08
**Source review:** `.planning/phases/09-primitives/09-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (WR-01 through WR-5)
- Fixed: 5
- Skipped: 0
- Info items (IN-01 through IN-06): out of scope for this run

Verification: `npm run build` succeeded end-to-end. All 11 static routes prerendered, including `/dev/primitives/`. Pre-existing lightning-css warnings about `var(--token-*)` tokens were already present before these changes and are unrelated to the fixes (noted as the existing `@source` scoping issue in `src/styles/global.css`).

## Fixed Issues

### WR-01: Mobile menu focus trap only catches first↔last; rest of page remains in tab order

**Files modified:** `src/components/primitives/MobileMenu.astro`
**Commit:** `4d71b4d`
**Applied fix:** Added `inert` attribute to `header`, `main`, and `footer` inside `openMenu()` and removed it inside `closeMenu()`. This is the canonical modal-dialog pattern — the rest of the page is removed from both the tab order and the accessibility tree while the dialog is open, so keyboard users (and screen-reader quick-keys / rotor navigation) cannot silently escape the dialog. Complements the existing re-querying focus trap rather than replacing it.

### WR-02: `prefers-reduced-motion` not honored for `scroll-behavior: smooth`

**Files modified:** `src/styles/global.css`
**Commit:** `8263377`
**Applied fix:** Wrapped `html { scroll-behavior: smooth; }` in `@media (prefers-reduced-motion: no-preference)`. Users with OS-level reduce-motion set (WCAG 2.3.3 / vestibular safety) now get instant anchor navigation. Matches the existing `prefers-reduced-motion` guard on `.nav-link-hover` lower in the same file.

### WR-03: `BaseLayout` OG image URL builder corrupts already-absolute URLs

**Files modified:** `src/layouts/BaseLayout.astro`
**Commit:** `af2625b`
**Applied fix:** Added a `resolveOg(img)` helper that passes absolute `http(s)://` URLs through unchanged and only prepends `siteUrl` for root-relative paths. Replaced both `${siteUrl}${ogImage}` interpolations (OpenGraph basic and Twitter image) with the resolved value stored in `resolvedOgImage`. Current call sites (which all pass root-relative paths) are unaffected; future pages can now pass CDN URLs without corruption.

### WR-4: `previewYears` can feed `undefined` into a typed `year: string` prop

**Files modified:** `src/pages/dev/primitives.astro`
**Commit:** `418809c`
**Applied fix:** Zipped `previewYears` into the projects derivation at the `.map()` step so every derived entry carries `{ project, year }`. The fallback `?? "2024"` keeps the type contract intact even if the content collection shrinks or `previewYears` is shortened. The consumer `.map()` was updated to destructure `{ project, year }` and reference `project.data.*` / `project.id`. WorkRow's `year: string` prop is now statically guaranteed to receive a string.

### WR-5: `.menu-trigger`, `.nav-link`, and `.wordmark` have no focus-visible outline

**Files modified:** `src/components/primitives/Header.astro`
**Commit:** `f4a13d1`
**Applied fix:** Added `:focus-visible` rule with `outline: 2px solid var(--accent)`, `outline-offset: 4px`, and `border-radius: 2px` for `.wordmark`, `.nav-link`, and `.menu-trigger`. Matches the existing focus-ring pattern used in `NextProject.astro` and `MobileMenu.astro`, bringing the header to parity with the rest of the site's keyboard affordances.

---

_Fixed: 2026-04-08_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
