---
phase: 22-experience-page-holloway-case-study
fixed_at: 2026-07-09T22:20:00Z
review_path: .planning/phases/22-experience-page-holloway-case-study/22-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 3
skipped: 2
status: partial
---

# Phase 22: Code Review Fix Report

**Fixed at:** 2026-07-09T22:20:00Z
**Source review:** .planning/phases/22-experience-page-holloway-case-study/22-REVIEW.md
**Iteration:** 1
**Fix scope:** all (Warning + Info)

**Summary:**
- Findings in scope: 5
- Fixed: 3 (WR-01, WR-02, IN-01)
- Skipped: 2 (IN-02, IN-03)

**Gate after every fix (all held green):**
- `pnpm test` — 623 passed / 0 failed (2 pre-existing skips)
- `pnpm exec astro check` — 0 errors / 0 warnings (1 pre-existing hint)
- `pnpm sync:experience:check` — exit 0 (holloway.mdx / balfour-beatty.mdx unchanged; frontmatter-only edit is body-compare-safe)
- `git diff --exit-code -- package.json pnpm-lock.yaml` — exit 0 (zero new dependencies)
- Zero em dashes (U+2014) introduced in any user-facing copy or meta string

## Fixed Issues

### WR-01: Copied scroll-depth sentinels silently activate `scroll_depth` analytics on `/experience/holloway`

**Files modified:** `src/scripts/scroll-depth.ts`, `tests/client/scroll-depth.test.ts`
**Commit:** c92416f
**Applied fix (keep + attribute path):** Kept the sentinels on the deep-dive (scroll depth is a meaningful engagement signal for a long-form case study). Added a `pageType` field to the `scroll_depth` payload, derived from the first path segment (`segments[0]` → `"experience" | "projects"`), so experience and project scroll events are attributable rather than indistinguishable by slug alone. Corrected the stale scope docstring (`scroll-depth.ts:1-6`) to state the tracker fires on both project case studies and the experience case study, and rewrote the misleading `// Not on a /projects/[id] route` scope-gate comment to `// No .scroll-sentinel elements on this route (scope gate)`. Updated the one exact-match unit assertion (`scroll-depth.test.ts:129`) to expect `{ percent, slug, pageType }` — the other assertions use `objectContaining` and were unaffected. This edits pre-existing shared code; the full scroll-depth test file stays green.

### WR-02: Detail page reused the full ~360-char first-person `summary` as the meta/OG/Twitter description

**Files modified:** `src/content.config.ts`, `src/content/experience/holloway.mdx`, `src/pages/experience/[id].astro`
**Commit:** 239165f
**Applied fix:** Added an optional `description: z.string().optional()` field to the `experience` collection schema (mirrors the `projects` pattern; kept optional so Balfour, which has no `description`, still validates). Added a concise 150-character recruiter-facing meta line to `holloway.mdx` frontmatter (em-dash-free). Changed the detail route to `description={entry.data.description ?? entry.data.summary}` so the meta/OG/Twitter description is the short line while the long first-person `summary` remains the on-page `.lead` tagline. Frontmatter-only content edit — `sync:experience:check` compares body only and reports the file unchanged.

### IN-01: MobileMenu View-Transitions re-init path did not tear down the document `keydown` listener or clear `inert`

**Files modified:** `src/components/primitives/MobileMenu.astro`
**Commit:** b682545
**Applied fix (attempted-and-safe):** Made `resetMobileMenuState` fully idempotent without hoisting/refactoring the focus-trap closure. Introduced a module-scoped `currentKeyDownHandler` reference that `bindMobileMenuListeners` publishes for the bound `handleKeyDown`; the reset now defensively `removeEventListener("keydown", currentKeyDownHandler)` and clears `inert` from `header/main/footer/.chat-widget` before rebind, so a re-init landing while the menu is open cannot leak a stale trap listener or leave the shell inert. The D-26 focus-trap battery (`no-imperative-display-flip`, `no-inline-display-on-chat-panel`, `chat-panel-display`, `focus-visible`) and the full suite stayed green, so this was applied rather than skipped. Dormant forward-compat today (no `<ClientRouter />`), so no runtime behavior change on the current site.

## Skipped Issues

### IN-02: Deep-dive link hardcodes `/experience/holloway` instead of deriving from the asserted id

**File:** `src/pages/experience.astro:65`
**Reason:** skipped — intentional and test-load-bearing. The Wave-0 guard `tests/content/experience-summary.test.ts` requires a quote-adjacent `href="/experience/"` literal (regex `/href=["'`]?\/experience\//`), and Astro's interpolation form `href={\`/experience/${holloway.id}\`}` does not match that regex, so applying the suggested "single source of truth" fix would turn that test RED. A build-time `holloway.id === "holloway"` invariant guard in `experience.astro:33-37` already fails the build loudly if the id ever diverges, making the string literal safe. No correctness impact.
**Original issue:** `href="/experience/holloway"` is a string literal while the build already asserts `holloway.id === "holloway"`; the DRY suggestion is to derive the href from the id.

### IN-03: Nav `isActive` uses prefix `startsWith` that would over-match sibling routes

**File:** `src/components/primitives/Header.astro:32-36` and `src/components/primitives/MobileMenu.astro:54-57`
**Reason:** skipped — the suggested tightening would turn a Wave-0 test RED. `tests/build/experience-nav.test.ts:57-58` asserts the literal substring `startsWith("/experience")` in BOTH nav primitives. The proposed boundary check `currentPath === "/experience" || currentPath.startsWith("/experience/")` replaces that exact substring with `startsWith("/experience/")` (trailing slash), which no longer contains the asserted literal, failing the test in both files. No sibling routes sharing the prefix exist today, and this mirrors the pre-existing projects/about/contact pattern, so impact is currently nil. Deferred until such a route is actually added (at which point the guard test would be updated alongside).
**Original issue:** `currentPath.startsWith("/experience")` would also match a hypothetical `/experience-report`; a boundary check was suggested for future route additions.

---

_Fixed: 2026-07-09T22:20:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
