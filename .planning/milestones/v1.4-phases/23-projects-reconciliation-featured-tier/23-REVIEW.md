---
phase: 23-projects-reconciliation-featured-tier
reviewed: 2026-07-10T00:00:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - Projects/7 - MULTI-DEX CRYPTO TRADER.md
  - scripts/build-chat-context.mjs
  - src/components/primitives/WorkRow.astro
  - src/content/projects/clipify.mdx
  - src/content/projects/daytrade.mdx
  - src/content/projects/multi-chain-evm.mdx
  - src/content/projects/nfl-predict.mdx
  - src/content/projects/optimize-ai.mdx
  - src/content/projects/solsniper.mdx
  - src/data/about.ts
  - src/pages/index.astro
  - src/pages/projects.astro
  - src/scripts/chat.ts
  - tests/build/featured-tier-render.test.ts
  - tests/build/no-mdx-in-worker-bundle.test.ts
  - tests/content/case-studies-have-content.test.ts
  - tests/content/case-studies-shape.test.ts
  - tests/content/case-studies-wordcount.test.ts
  - tests/content/projects-collection.test.ts
  - tests/content/projects-ordering.test.ts
  - tests/content/voice-banlist.test.ts
  - tests/content/voice-em-dash.test.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 23: Code Review Report

**Reviewed:** 2026-07-10T00:00:00Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

Reviewed the Phase 23 "projects reconciliation / featured tier" change set: the D-15 slug-skip re-plumbing in `build-chat-context.mjs`, the featured/rest partition and continuous numbering in `projects.astro` and `index.astro`, the optional-tagline contract in `WorkRow.astro`, the two scoped fixes (`chat.ts` unused-param rename, `about.ts` em-dash removal), the seven MDX content files, and nine test files.

The logic-bearing changes are largely sound. The D-15 slug-skip is correct: `multi-chain-evm` is `continue`d before the try block, so neither the missing-`chatSummary` hard-fail nor the defensive MULTI-DEX regex hard-fail fires, and the two legitimate hard-fails still protect the other six MDX files. The `order`/`featured` frontmatter reconciliation is internally consistent (orders 1-7 contiguous and unique; featured occupy exactly orders 1-3), which the property tests pin directly. Voice and em-dash rules are honored: every MDX body is em-dash-free, all four residual em-dashes live in `chatSummary` frontmatter (chat-pipeline exempt), and the `about.ts` em-dash removal is a clean comma substitution. The `chat.ts` and `about.ts` scoped fixes are correct and side-effect-free. Most test additions carry real assertions.

No BLOCKER-level defects were found — the current data set produces correct behavior on both pages. Two WARNING-level issues concern fragile coupling and a tautological test, and two INFO items note a deliberate-but-visitor-facing knowledge gap and a soft test-skip pattern.

## Warnings

### WR-01: Homepage and projects page derive work-row numbers from two different sources

**File:** `src/pages/index.astro:64` and `src/pages/projects.astro:39`
**Issue:** The two pages number the featured rows using different derivations that only coincidentally agree.
- `index.astro:64` uses the array index: `number={String(i + 1).padStart(2, "0")}` (sequential position in the filtered `featured` list → 01, 02, 03).
- `projects.astro:39` uses the canonical order field: `number={String(p.data.order).padStart(2, "0")}`.

Today these match only because the three `featured` projects happen to occupy `order` values 1, 2, 3. The stated design intent in `projects.astro:8-10` is a "numbered-ledger grammar" where each project's number is tied to its `order`. If a future edit sets `featured: true` on a project with a higher `order` (or renumbers), the homepage would silently show `01/02/03` for projects whose canonical number on the projects page is different (e.g. an `order: 5` project shown as `03` on Home but `05` on /projects). No test guards agreement between the two surfaces — `featured-tier-render.test.ts` only asserts the /projects page numbering (it reads `dist/client/projects/index.html`), and `projects-ordering.test.ts` never asserts that featured orders equal exactly {1,2,3}.
**Fix:** Make the homepage use the same canonical source so the ledger stays honest regardless of which projects are featured:
```astro
{featured.map((p) => (
  <WorkRow
    number={String(p.data.order).padStart(2, "0")}
    ...
  />
))}
```
Optionally add a property assertion in `projects-ordering.test.ts` that `featured` slugs occupy the lowest contiguous `order` values, so the "featured 01-03" invariant is guarded rather than incidental.

### WR-02: case-studies-wordcount.test.ts is a tautology and provides no regression protection

**File:** `tests/content/case-studies-wordcount.test.ts:42-48`
**Issue:** Every `it()` block ends in `expect(true).toBe(true)` and only `console.warn`s when a body falls outside the 600-900 band. The test can never fail regardless of content, so it is a green check that verifies nothing — a false-confidence signal in the suite. This is documented as intentional ("soft warn only per D-16"), but a passing test that asserts a constant is indistinguishable from a broken test, and the `console.warn` output is invisible in normal CI summaries.
**Fix:** Either convert the soft-warn into a real (looser) gate, e.g. assert an absolute floor/ceiling that must never be crossed:
```ts
expect(words, `${slug}: ${words} words`).toBeGreaterThan(300);
expect(words, `${slug}: ${words} words`).toBeLessThan(1500);
```
or move the pure-warning logic out of the test suite into the `build:chat-context` script (which already emits threshold warnings) and delete the tautological spec so the suite count reflects only real gates.

## Info

### IN-01: The flagship featured project is absent from the chat knowledge corpus

**File:** `scripts/build-chat-context.mjs:449` (and `src/content/projects/multi-chain-evm.mdx`)
**Issue:** `multi-chain-evm` is rendered as featured project 02 on both the homepage and /projects, but the D-15 slug-skip excludes it from `portfolio-context.json`, so the chat widget has no knowledge of it until Phase 25 / CHAT-10. A recruiter who sees "Multi-Chain EVM Trader" prominently featured and then asks the chat about it will get a no-knowledge answer, which is a mild credibility risk for a portfolio whose core value is credibility. This is explicitly planned and documented (Phase 25 lifts the skip for the third-person voice split), so it is noted rather than flagged.
**Fix:** No code change required for Phase 23. Confirm the chat persona prompt gracefully deflects unknown-project questions to `/projects/multi-chain-evm` in the interim, and ensure Phase 25 removes the `continue` and adds a `chatSummary` to `multi-chain-evm.mdx`.

### IN-02: Build-dependent tests silently no-op when dist/ is absent

**File:** `tests/build/featured-tier-render.test.ts:46-64`, `tests/build/no-mdx-in-worker-bundle.test.ts:85-102`
**Issue:** The substantive assertions are guarded by `if (!distExists) return;`, so when `dist/` has not been built the real checks pass vacuously and only the first "dist exists" assertion fails. This is an intentional, documented pattern (the first `it` surfaces the dependency), but running the content-tier suite without a prior `pnpm build` yields mostly-green build-tier tests that exercised nothing.
**Fix:** Acceptable as-is given the documented gate ordering. If tighter coupling is wanted, promote the dist-existence guard into `beforeAll` with a hard failure, or gate the build-tier specs behind a separate vitest project that always runs after `pnpm build`.

---

_Reviewed: 2026-07-10T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
