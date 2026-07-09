---
phase: 22-experience-page-holloway-case-study
reviewed: 2026-07-09T21:59:31Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/components/primitives/Header.astro
  - src/components/primitives/MobileMenu.astro
  - src/pages/experience.astro
  - src/pages/experience/[id].astro
  - src/content/experience/holloway.mdx
  - tests/build/experience-nav.test.ts
  - tests/content/experience-summary.test.ts
  - tests/content/experience-detail.test.ts
  - tests/content/experience-voice-em-dash.test.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-07-09T21:59:31Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Phase 22 adds a two-tier `/experience` listing (Holloway rich summary + Balfour lightweight entry), a `/experience/holloway` deep-dive route with a `getStaticPaths` `hasCaseStudy` filter, an experience-first nav entry in Header/MobileMenu, the D-08 company normalization, and a tests-first validation suite. The implementation faithfully mirrors the established `projects.astro` / `projects/[id].astro` patterns and adds strong build-time invariant guards (throws on missing `hasCaseStudy` owner, empty `earlier` set, and id/slug mismatch) that fail the build loudly rather than shipping a broken route.

No blockers were found. This is a static, author-controlled content surface: all dynamic values are interpolated through Astro `{}` expressions (auto-escaped) and MDX `<Content />` (compiled at build), with no `set:html`, no user input, no secrets, and no dangerous sinks — so there is no XSS or injection surface. The em-dash convention holds: `grep` for U+2014 across the phase content and page sources found matches only inside code comments (not user-facing copy), and the two MDX bodies are em-dash-free (en dashes in date ranges are permitted).

The two warnings are a silent analytics scope expansion (copied scroll-depth sentinels now fire on the experience route) and a poor-quality meta description on the detail page (the full ~360-char first-person summary is reused verbatim as the SEO/OG/Twitter description). The info items are latent/forward-compat hardening and DRY nits.

## Warnings

### WR-01: Copied scroll-depth sentinels silently activate `scroll_depth` analytics on `/experience/holloway`, contradicting the tracker's documented "project detail pages only" scope

**File:** `src/pages/experience/[id].astro:70-73` (sentinel markup) + `src/scripts/scroll-depth.ts:1-6,55-77` + `src/scripts/lib/observer.ts:28-29`
**Issue:** `experience/[id].astro` copies the four `<div class="scroll-sentinel" data-percent="…">` elements and the `article { position: relative }` CSS verbatim from `projects/[id].astro`. The scroll-depth tracker is documented as firing "on project detail pages only (D-05 scope)" and its comment on `scroll-depth.ts:70` claims `if (!observer) return; // Not on a /projects/[id] route`. But the actual scope gate is element presence, not pathname: `makeRevealObserver` returns `null` only when `document.querySelectorAll(".scroll-sentinel").length === 0` (`observer.ts:28-29`). Because the experience detail page now contains those sentinels, the observer constructs and `handleScrollEntry` fires `window.umami.track("scroll_depth", { percent, slug })` on `/experience/holloway`. The payload is slug-only (`slug = "holloway"`), carrying no page-type context, so experience scroll events are indistinguishable in analytics from any project route sharing that slug, and the "project detail pages only" documentation is now false. This is either an unintended side effect of copy-pasting the sentinel block or an intentional expansion that was never documented.
**Fix:** Decide the intent explicitly. If scroll-depth on the case study is desired, update the scope documentation in `scroll-depth.ts:1-6` and the misleading `// Not on a /projects/[id] route` comment on line 70, and add route/page-type context to the event payload so experience and project scroll depth are attributable, e.g.:
```ts
const pageType = segments[0] ?? "unknown"; // "experience" | "projects"
window.umami?.track("scroll_depth", { percent, slug, pageType });
```
If it is not desired, remove the four `.scroll-sentinel` divs (and the now-unused `article { position: relative }` / sentinel CSS) from `experience/[id].astro`.

### WR-02: Detail page reuses the full ~360-character first-person `summary` as the meta/OG/Twitter description

**File:** `src/pages/experience/[id].astro:29`
**Issue:** `<BaseLayout title={entry.data.company} description={entry.data.summary}>` passes the Holloway `summary` straight through to `astro-seo`, which emits it as the `<meta name="description">`, the Open Graph `description`, and the Twitter `description` (`BaseLayout.astro:60,71,83`). That summary is a single ~360-character first-person paragraph ("I'm the solo contract engineer on Holloway Connect… making every change non-destructively against live production data."). Search engines truncate meta descriptions around 155-160 characters, so the SERP snippet is cut mid-sentence, and the first-person voice reads oddly as a third-party search snippet. This also diverges from the established projects pattern: `projects/[id].astro:32` uses a dedicated `project.data.description` field distinct from the on-page tagline, whereas the experience schema has no `description` field, so the long on-page lead is doing double duty. For a portfolio whose stated goal is recruiters finding Jack via search, a truncated/awkward snippet is a real quality regression.
**Fix:** Add an optional short `description` (or `metaDescription`) field to the `experience` collection schema in `src/content.config.ts` (mirroring `projects`), populate a ~150-char recruiter-facing line in `holloway.mdx` frontmatter, and reference it here: `description={entry.data.description ?? entry.data.summary}`. Keep the long `summary` for the on-page `.lead` tagline only.

## Info

### IN-01: MobileMenu View-Transitions re-init path does not tear down the document `keydown` listener or clear `inert`

**File:** `src/components/primitives/MobileMenu.astro:242-254,354-369,381`
**Issue:** The script deliberately wires `astro:page-load` for forward-compat with a future `<ClientRouter />` (lines 236-240, 378-381). On that event `initMobileMenu` runs `resetMobileMenuState`, which clears `is-open`, resets ARIA, and restores `body.overflow`, but does **not** `document.removeEventListener("keydown", handleKeyDown)` nor remove the `inert` attributes applied in `openMenu` (`header/main/footer/.chat-widget`). If a client-side navigation occurs while the menu is open (without a nav-link click, e.g. programmatic route change), the `keydown` handler bound to `document` in `openMenu` survives the DOM swap while still closing over the now-detached menu/trigger. Under repeated navigations these stale listeners accumulate. This is dormant today because there is no `<ClientRouter />` (cross-document navigation does a full reload that clears everything), and the code is explicitly forward-compat, so severity is low — but the reset is incomplete for the very scenario it is written to support.
**Fix:** In `resetMobileMenuState`, defensively remove the trap listener and inert flags before rebinding, e.g. `document.removeEventListener("keydown", handleKeyDown)` (requires hoisting the handler reference) and clear `inert` from `header/main/footer/.chat-widget`, so a re-init from an open state is fully idempotent.

### IN-02: Deep-dive link hardcodes `/experience/holloway` instead of deriving from the asserted id

**File:** `src/pages/experience.astro:65`
**Issue:** `href="/experience/holloway"` is a string literal, while line 33-37 already asserts `holloway.id === "holloway"` at build time. The assertion makes the literal safe (the build fails if the id ever diverges), so this is not a correctness bug — but it keeps two copies of the slug in sync manually rather than deriving one from the other.
**Fix:** Use `href={`/experience/${holloway.id}`}` so the listing link is structurally tied to the entry the detail route is generated from — single source of truth, and the existing id assertion still guards the route name.

### IN-03: Nav `isActive` uses prefix `startsWith` that would over-match sibling routes

**File:** `src/components/primitives/Header.astro:32-36` and `src/components/primitives/MobileMenu.astro:54-57`
**Issue:** `currentPath.startsWith("/experience")` (and the `/projects`, `/about`, `/contact` branches) marks the nav item active for any path that merely begins with the segment, so a hypothetical `/experience-report` or `/projects-archive` route would also light up the tab. No such sibling routes exist today, and this mirrors the pre-existing projects/about/contact pattern, so impact is currently nil — noting only for future route additions.
**Fix:** If additional top-level routes sharing a prefix are ever added, tighten to a boundary check, e.g. `currentPath === "/experience" || currentPath.startsWith("/experience/")`.

---

_Reviewed: 2026-07-09T21:59:31Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
