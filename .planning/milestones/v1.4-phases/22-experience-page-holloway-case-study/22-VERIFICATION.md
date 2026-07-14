---
phase: 22-experience-page-holloway-case-study
verified: 2026-07-09T18:05:00Z
status: passed
score: 9/9 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 22: Experience Page + Holloway Case Study Verification Report

**Phase Goal:** Dedicated Experience page + nav; Holloway scannable summary that leads to a full deep-dive; Balfour Beatty lightweight entry. Requirements EXP-02 (Experience page reachable from nav), EXP-03 (Holloway scannable summary), EXP-04 (Holloway full case-study deep-dive with a way back), EXP-05 (Balfour lightweight, structurally excluded from a detail route).
**Verified:** 2026-07-09T18:05:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `experience` nav link appears FIRST (experience · works · about · contact) in both Header.astro and MobileMenu.astro, reachable from every page | ✓ VERIFIED | Read `src/components/primitives/Header.astro:23-28` and `MobileMenu.astro:38-43` — `navLinks[0] = { href: "/experience", label: "experience" }` precedes `/projects` in both files. `tests/build/experience-nav.test.ts` (2 files x 2 assertions) independently confirms this and passes: `pnpm exec vitest run tests/build/experience-nav.test.ts` → 4/4 pass. |
| 2 | `/experience` and `/experience/[id]` show the nav entry in active state | ✓ VERIFIED | `isActive()` in both primitives (Header.astro:30-38, MobileMenu.astro:53-59) has `if (href === "/experience") return currentPath.startsWith("/experience")` branch, wired to `class:list`/`aria-current` in the render loop (Header.astro:48-52, MobileMenu.astro:86-91). SUMMARY reports human+orchestrator browser-verified `aria-current` active state on `/experience`. |
| 3 | `/experience` renders Holloway as a rich scannable summary (meta + first-person summary + all 5 highlights + deep-dive link) | ✓ VERIFIED | Read `src/pages/experience.astro:50-69` — renders `role`/`dateRange`/`company`/`techStack`/`summary`/all `highlights.map()`/link to `/experience/holloway`. Built HTML (`dist/client/experience/index.html`) independently confirmed to contain all 5 distinctive highlight phrases (`payroll math to the penny`, `cross-tenant data leak`, `wrongly-archived production jobs`, `idempotent geofenced payroll time-clock`, `query-factory`) — verified directly by this verifier, not taken from SUMMARY. |
| 4 | Company renders as "Holloway Company" (no leading "The") | ✓ VERIFIED | `src/content/experience/holloway.mdx:3` reads `company: "Holloway Company"`. `tests/content/experience-summary.test.ts` asserts this exact string and passes. |
| 5 | Balfour renders as a visibly lighter, non-linked "Earlier" entry, no case-study link | ✓ VERIFIED | `src/pages/experience.astro:71-89` renders Balfour via `<div class="earlier-entry">` (no `<a>`, mono/muted classes only). Verified directly: built `dist/client/experience/index.html` does NOT contain the string `experience/balfour-beatty`. |
| 6 | `/experience/holloway` renders the full deep-dive (Overview + 9 highlights + Themes) with a way back | ✓ VERIFIED | `src/pages/experience/[id].astro` renders `<Content />` inside `.prose-editorial` (verbatim MDX body render) plus top (`back-top`) and bottom (`back-bottom`) `href="/experience"` links. Verified directly: built `dist/client/experience/holloway/index.html` contains the label `Back to experience` exactly 2 times (counted by this verifier via node script, not SUMMARY). |
| 7 | Balfour is structurally excluded from a detail route (no `/experience/balfour-beatty`) | ✓ VERIFIED | `getStaticPaths` in `src/pages/experience/[id].astro:8-19` filters `.filter((entry) => entry.data.hasCaseStudy)`; `balfour-beatty.mdx` has `hasCaseStudy: false`. Verified directly: `pnpm build` output has no `dist/client/experience/balfour-beatty` directory (`ls` confirms "No such file or directory") — this is a structural (build-time route enumeration) guarantee, not a runtime check, so it fully satisfies EXP-05's "structurally excluded" wording. |
| 8 | No em dashes in visible Experience-surface copy | ✓ VERIFIED | Read both MDX bodies and both `.astro` page sources — zero `—`. Verified directly in built HTML: the only `—` occurrences in both `dist/client/experience/index.html` and `.../holloway/index.html` are inside pre-existing BaseLayout chat-widget HTML comments (shared across every page site-wide, explicitly exempted per project convention — "chat pipeline exempt"), not phase-22 authored copy. |
| 9 | All four requirement IDs (EXP-02..05) are satisfied and none are orphaned | ✓ VERIFIED | REQUIREMENTS.md maps exactly EXP-02, EXP-03, EXP-04, EXP-05 to Phase 22 (checked `[x]` and "Complete" in the traceability table); all four appear in the `requirements:` frontmatter across the five phase PLAN files (22-01 through 22-05); no orphaned IDs found. |

**Score:** 9/9 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/pages/experience.astro` | Listing route, two-tier | ✓ VERIFIED | Exists, 234 lines, substantive (no stubs), imports/uses `sortExperienceEntries`, renders both tiers, builds `dist/client/experience/index.html` |
| `src/pages/experience/[id].astro` | Detail route, hasCaseStudy-filtered | ✓ VERIFIED | Exists, substantive, `getStaticPaths` filter verified, builds only `dist/client/experience/holloway/index.html` |
| `src/components/primitives/Header.astro` | experience-first nav | ✓ VERIFIED | Modified, navLinks + isActive branch present, `astro check` 0/0 |
| `src/components/primitives/MobileMenu.astro` | experience-first nav (mobile) | ✓ VERIFIED | Modified, navLinks + isActive branch present; focus-trap `<script>` block byte-unchanged (diff hunks confined to lines 13/39/54 per 22-02-SUMMARY, independently plausible given script content read here matches the documented D-26 pattern) |
| `src/content/experience/holloway.mdx` | company normalized | ✓ VERIFIED | `company: "Holloway Company"` (frontmatter-only edit), body untouched, `sync:experience:check` exits 0 |
| `tests/build/experience-nav.test.ts` | Nav-shape guard | ✓ VERIFIED | Exists, substantive (2 real assertions per primitive), passes |
| `tests/content/experience-summary.test.ts` | Summary/D-08 guard | ✓ VERIFIED | Exists, substantive, passes |
| `tests/content/experience-detail.test.ts` | Detail filter guard | ✓ VERIFIED | Exists, substantive (content contract + source-shape assertions), passes |
| `tests/content/experience-voice-em-dash.test.ts` | Em-dash guard | ✓ VERIFIED | Exists, substantive, passes |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| Header.astro / MobileMenu.astro `navLinks[0]` | `/experience` route | static href | WIRED | `href: "/experience"` first element, render loop maps to `<a>` |
| `isActive()` | `currentPath.startsWith("/experience")` | active-state branch | WIRED | Confirmed in both primitives; feeds `class:list` + `aria-current` |
| `experience.astro` | `experience/[id].astro` | `href="/experience/holloway"` + build-time `if (holloway.id !== "holloway") throw` guard | WIRED | Guard makes the static literal href safe against drift; both files independently confirm `holloway` is the only `hasCaseStudy: true` entry |
| `experience/[id].astro` `getStaticPaths` | experience content collection | `.filter((entry) => entry.data.hasCaseStudy)` | WIRED | Verified against actual frontmatter (`holloway.mdx: true`, `balfour-beatty.mdx: false`); build output confirms only one route generated |

### Behavioral Spot-Checks (performed directly by this verifier, not read from SUMMARY)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Phase-specific test suite | `pnpm exec vitest run tests/build/experience-nav.test.ts tests/content/experience-summary.test.ts tests/content/experience-detail.test.ts tests/content/experience-voice-em-dash.test.ts` | 4 files / 14 tests passed | ✓ PASS |
| Type/content check | `pnpm exec astro check` | 127 files: 0 errors, 0 warnings, 1 pre-existing unrelated hint (`chat.ts:384`) | ✓ PASS |
| Full regression suite | `pnpm test` | 70 files passed / 1 skipped, 623 tests passed / 2 skipped | ✓ PASS (matches SUMMARY claim, independently reproduced) |
| Drift gate | `pnpm sync:experience:check` | `balfour-beatty.mdx: unchanged`, `holloway.mdx: unchanged`, exit 0 | ✓ PASS |
| Production build | `pnpm build` | Success; emitted `/experience/index.html` and `/experience/holloway/index.html` | ✓ PASS |
| Route absence (EXP-05) | `ls dist/client/experience/balfour-beatty` | "No such file or directory" | ✓ PASS |
| Built-HTML highlight content | node script grepping 5 distinctive phrases in `dist/client/experience/index.html` | all 5/5 present | ✓ PASS |
| Built-HTML back-link count | node script counting "Back to experience" in `dist/client/experience/holloway/index.html` | exactly 2 | ✓ PASS |
| Dependency lock (QA-02) | `git diff --exit-code -- package.json pnpm-lock.yaml` | exit 0 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| EXP-02 | 22-02, 22-03 | Experience page reachable from nav | ✓ SATISFIED | Nav entry verified in code; route builds; REQUIREMENTS.md marks Complete |
| EXP-03 | 22-01, 22-03 | Holloway scannable summary | ✓ SATISFIED | Listing renders meta/summary/5 highlights/link; built HTML confirms |
| EXP-04 | 22-01, 22-04 | Holloway full case-study deep-dive with a way back | ✓ SATISFIED | Detail route renders full body via `.prose-editorial`; 2 back links confirmed in built HTML |
| EXP-05 | 22-01, 22-03, 22-04 | Balfour lightweight, structurally excluded from detail route | ✓ SATISFIED | Listing has no Balfour link; build emits no `/experience/balfour-beatty` route |

No orphaned requirements found — REQUIREMENTS.md's Phase 22 row (EXP-02..05) matches exactly the `requirements:` frontmatter declared across the 5 phase plans.

### Anti-Patterns Found

None blocking. A grep for debt markers (`TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER`) across all phase-modified files returned one match: `XXX` inside `src/content/experience/holloway.mdx:68`, which is part of the prose string `C-XXXX-YYYY` (a job-number format description in the case-study body) — not a debt marker, false positive, no action needed.

The independent code review (`22-REVIEW.md`, 0 critical / 2 warnings / 3 info) flagged two non-blocking items worth carrying forward as advisory notes (explicitly scoped as advisory/non-blocking by the task instructions, not phase-blocking for this verification):
- WR-01: copied scroll-depth sentinels now also fire `scroll_depth` analytics on `/experience/holloway`, which the tracker's own code comment says is "project detail pages only" — a documentation/scope drift, not a functional break.
- WR-02: the ~360-char first-person `summary` is reused verbatim as the meta/OG/Twitter description on the detail page, which will truncate awkwardly in search results.

Neither affects EXP-02..05 goal achievement; both are quality/SEO polish items outside this phase's stated success criteria.

### Human Verification Required

None outstanding. SC5d (visual sign-off — six-token conformance, four-item nav at 768px/1024px, frontend-design attribution) was already completed and approved this session per the orchestrator's note and the 22-05-SUMMARY.md record (human typed "approved"; orchestrator additionally browser-verified all 9 how-to-verify steps). No new human-verification items were identified during this independent re-check.

### Gaps Summary

None. All 9 derived observable truths (roadmap goal + all 4 requirement IDs) are verified directly against the codebase: source code was read (not just SUMMARY claims), the phase-specific and full test suites were re-run by this verifier and matched the claimed pass counts, `astro check` and `pnpm build` were re-run independently, and the build-output HTML was inspected directly (highlight phrases, back-link count, balfour-beatty route absence, em-dash scope) rather than trusting the SUMMARY's reported figures. Every check reproduced the SUMMARY's claims exactly.

---

_Verified: 2026-07-09T18:05:00Z_
_Verifier: Claude (gsd-verifier)_
