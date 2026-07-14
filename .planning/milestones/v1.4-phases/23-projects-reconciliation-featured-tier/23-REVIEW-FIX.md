---
phase: 23-projects-reconciliation-featured-tier
fixed_at: 2026-07-10T00:00:00Z
review_path: .planning/phases/23-projects-reconciliation-featured-tier/23-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 2
skipped: 2
status: partial
---

# Phase 23: Code Review Fix Report

**Fixed at:** 2026-07-10
**Source review:** .planning/phases/23-projects-reconciliation-featured-tier/23-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (fix_scope = all)
- Fixed: 2 (WR-01, WR-02)
- Skipped: 2 (IN-01, IN-02 — both intentional design decisions, skipped per review guidance)

## Fixed Issues

### WR-01: Homepage and projects page derive work-row numbers from two different sources

**Files modified:** `src/pages/index.astro`, `tests/content/projects-ordering.test.ts`
**Commit:** ec2e57a
**Applied fix:** Changed the homepage featured-row numbering from the array index
(`String(i + 1).padStart(2, "0")`) to the canonical order field
(`String(p.data.order).padStart(2, "0")`), matching `src/pages/projects.astro:39`.
The unused index binding was dropped from the map callback (`(p, i) =>` -> `(p) =>`).
Both surfaces now number continuously off the same `order` field, so the
numbered-ledger grammar stays honest regardless of which projects are featured.

Additionally added the optional guard suggested by the review: a new property
assertion in `projects-ordering.test.ts` proving `featured` slugs occupy the
lowest contiguous `order` values (currently {1,2,3}). This converts the
"featured = 01-03" invariant from incidental to guarded — if a future edit
features a higher-order project, the test fails loudly instead of silently
desyncing Home from /projects. The assertion passes against current data.

### WR-02: case-studies-wordcount.test.ts is a tautology and provides no regression protection

**Files modified:** `tests/content/case-studies-wordcount.test.ts`
**Commit:** 7918909
**Applied fix:** Replaced the `expect(true).toBe(true)` tautology with a very-loose
absolute floor/ceiling: `toBeGreaterThan(300)` and `toBeLessThan(1500)` words.
The soft `console.warn` for the D-16 600-900 band was intentionally KEPT (D-16
deliberately kept that band a soft warn, not a hard gate). The hard 600-900 band
was NOT introduced. Bounds were verified against all seven current case-study
bodies before committing — actual word counts range 845-899, comfortably inside
(300, 1500). The spec now provides real regression protection (a stub or an
essay-length body would fail) without tightening the soft band.

## Skipped Issues

### IN-01: The flagship featured project is absent from the chat knowledge corpus

**File:** `scripts/build-chat-context.mjs:449` (and `src/content/projects/multi-chain-evm.mdx`)
**Reason:** Skipped — intentional, no code change required for Phase 23. The review
itself states "No code change required for Phase 23." The D-15 slug-skip excluding
`multi-chain-evm` from `portfolio-context.json` is a HARD, verified phase
requirement (PROJ-01): the corpus MUST remain exactly 6 projects with
`multi-chain-evm` absent until Phase 25 / CHAT-10 lifts the skip for the
third-person voice split. "Fixing" this would undo the phase's core deliverable.
Verified untouched: `pnpm build:chat-context:check` reports
`portfolio-context.json: unchanged`, `projects=6`, `multi-chain-evm` absent.
**Original issue:** `multi-chain-evm` is rendered as featured project 02 but excluded
from the chat corpus, so the chat widget cannot answer questions about it until
Phase 25 — a documented, deferred knowledge gap.

### IN-02: Build-dependent tests silently no-op when dist/ is absent

**File:** `tests/build/featured-tier-render.test.ts:46-64`, `tests/build/no-mdx-in-worker-bundle.test.ts:85-102`
**Reason:** Skipped — no change. The review classifies this as "Acceptable as-is given
the documented gate ordering." The `if (!distExists) return;` guard with a
leading dist-existence assertion is an intentional, documented pattern.
**Original issue:** Build-tier specs pass vacuously when `dist/` has not been built;
the first "dist exists" assertion surfaces the dependency.

## Verification Results

All four post-fix gates passed with the fixes applied:

1. `pnpm exec astro check` -> 129 files: **0 errors / 0 warnings / 0 hints**.
2. `pnpm build:chat-context:check` -> exit 0, `src/data/portfolio-context.json: unchanged`,
   `projects=6`, `multi-chain-evm` absent (confirms D-15 / IN-01 untouched).
3. `pnpm test` -> **72 test files passed / 1 skipped; 638 tests passed / 2 skipped; 0 failures.**
4. `git diff --exit-code -- package.json pnpm-lock.yaml` -> no diff (no new dependencies).

---

_Fixed: 2026-07-10_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
