---
phase: 23-projects-reconciliation-featured-tier
plan: 01
subsystem: content-pipeline
status: complete
tags: [projects, content-collection, chat-context, featured-tier, sync-pipeline]
requirements: [PROJ-01, PROJ-03, PROJ-04]
dependency_graph:
  requires:
    - scripts/sync-projects.mjs (fence contract)
    - scripts/build-chat-context.mjs (chat corpus build)
    - src/content.config.ts (projects Zod schema)
  provides:
    - src/content/projects/multi-chain-evm.mdx (7th project, slug multi-chain-evm)
    - fenced case study in Projects/7 - MULTI-DEX CRYPTO TRADER.md
    - D-15 multi-chain-evm slug-skip in build-chat-context.mjs
    - tests/content/projects-ordering.test.ts (SC4 property gate)
    - contiguous order {1..7} with exactly 3 featured
  affects:
    - 23-02/23-03 (two-tier projects UI reads this collection)
    - 25 (chat knowledge refresh lifts the D-15 skip)
tech_stack:
  added: []
  patterns:
    - top-of-loop slug-skip before hard-fails (D-15 chat exclusion)
    - hand-authored MDX frontmatter + machine-synced body (D-01/D-05)
    - featured-boolean partition + order sort as single distinction (D-12)
key_files:
  created:
    - src/content/projects/multi-chain-evm.mdx
    - tests/content/projects-ordering.test.ts
    - .planning/phases/23-projects-reconciliation-featured-tier/deferred-items.md
  modified:
    - scripts/build-chat-context.mjs
    - Projects/7 - MULTI-DEX CRYPTO TRADER.md
    - tests/content/projects-collection.test.ts
    - src/content/projects/nfl-predict.mdx
    - src/content/projects/solsniper.mdx
    - src/content/projects/optimize-ai.mdx
    - src/content/projects/clipify.mdx
    - src/content/projects/daytrade.mdx
decisions:
  - "D-15 exclusion re-plumbed: #7 now skipped by explicit multi-chain-evm slug-continue at the top of the chat-context loop, not the old unreferenced-source mechanism; Phase 25 lifts it"
  - "SolSniper demoted to featured:false but kept in the collection at order 4"
  - "Fenced case study is 870 words, first-person, zero em dashes; the below-fence Crypto Snipe Bot README left verbatim (D-04)"
metrics:
  tasks_completed: 3
  files_touched: 11
  duration: ~14min
  completed: 2026-07-10
---

# Phase 23 Plan 01: Projects Reconciliation & Featured Tier Summary

Synced the Multi-Chain EVM trader (#7) onto the site as a full case-study MDX, applied the featured/order distinction so exactly three projects are featured with a contiguous 1-7 order, and kept #7 out of the chat corpus via an explicit D-15 slug-skip so `pnpm build` never goes red.

## What Was Built

**Task 1 — D-15 chat-context slug-skip (commit 7fc8cc1)**
Added `if (basename(mdxPath, ".mdx") === "multi-chain-evm") continue;` at the top of the `main()` MDX loop in `scripts/build-chat-context.mjs`, placed before the `try`/`buildProjectBlock` and before the defensive MULTI-DEX source-path regex. This single `continue` sidesteps both hard-fails (#7 has no `chatSummary` per D-05, and its `source:` points at `Projects/7`). The defensive regex was retained as dormant defense-in-depth (never fires now). The stale header comment was refreshed (F5) to describe the slug-skip as the current exclusion mechanism, noting Phase 25 / CHAT-10 lifts it. `src/data/portfolio-context.json` re-emits byte-identical at exactly 6 projects.

**Task 2 — Author + sync #7 (commit 83af140)**
Prepended a fenced first-person case study to `Projects/7 - MULTI-DEX CRYPTO TRADER.md`: an H1 `# Multi-Chain EVM Trader`, then `CASE-STUDY-START`/`END` wrapping the five-H2 shape (Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings), 870 words, zero em dashes. The existing `# Crypto Snipe Bot` README is left verbatim below the END marker (D-04). Created `src/content/projects/multi-chain-evm.mdx` with hand-authored frontmatter only (featured: true, order: 2, category: other, source: Projects/7, no chatSummary/githubUrl/demoUrl); `pnpm sync:projects` filled the body from the fence. Extended `projects-collection.test.ts` EXPECTED_SLUGS to 7 and the entry-count title to 7.

**Task 3 — Featured/order reassignment + SC4 gate (commit 9280c81)**
Edited only the `featured:`/`order:` frontmatter lines across five siblings: nfl-predict order 2->3 (featured stays true); solsniper featured true->false, order 3->4; optimize-ai 4->5; clipify 5->6; daytrade 6->7. Bodies and titles left byte-identical (D-10/D-11). Created `tests/content/projects-ordering.test.ts` proving order = {1,2,3,4,5,6,7} (unique, contiguous), featured slugs exactly {seatwatch, multi-chain-evm, nfl-predict}, and the D-12 featured-then-order partition.

## Verification Results

- `pnpm exec astro check`: 0 errors / 0 warnings / 1 hint (128 files). The single hint is pre-existing and unrelated (unused `button` param in `src/scripts/chat.ts:384`, a Phase 7 file untouched by this plan) — logged to `deferred-items.md`.
- `pnpm sync:check`: exit 0, all 7 MDX in-sync, no drift.
- `pnpm build:chat-context:check`: exit 0, exactly 6 projects (multi-chain-evm absent); `git diff --exit-code src/data/portfolio-context.json` shows NO diff (byte-identical re-emit).
- `pnpm exec vitest run tests/content`: 60 passed / 2 skipped — projects-collection (7 entries, exactly 3 featured) + projects-ordering (new SC4 gate) green.
- `tests/build/chat-context-integrity.test.ts`: 9/9 passed (6 slugs, banned source absent, chat pins unchanged).

## Success Criteria

- SC1 / PROJ-01: #7 is a synced case-study MDX (frontmatter hand-authored, body machine-synced) with a fenced source. PASS
- SC3 / PROJ-03: exactly 3 featured; SolSniper demoted to featured:false but present; all 7 projects in the collection. PASS
- SC4 / PROJ-04: one featured/order distinction, order contiguous 1-7, proven by the ordering gate. PASS
- D-15: chat stays exactly 6 projects; build passes end-to-end because the slug-skip preceded the #7 MDX. PASS

## Deviations from Plan

None affecting scope. One out-of-scope discovery documented (not fixed per SCOPE BOUNDARY):

**[Out-of-scope] Pre-existing astro-check hint in src/scripts/chat.ts**
- **Found during:** Task 2 (`pnpm exec astro check`)
- **Issue:** `ts(6133): 'button' is declared but its value is never read` at `src/scripts/chat.ts:384`. Prevents a strict 0/0/0 astro-check result.
- **Why not fixed:** `chat.ts` was not modified by this plan (`git diff` empty); the hint pre-exists Phase 23 and belongs to the Phase 7 chat widget. Errors and warnings are clean.
- **Follow-up:** Logged to `.planning/phases/23-projects-reconciliation-featured-tier/deferred-items.md`; recommend a low-priority `/gsd-quick` before the 23-04 capstone gate if that gate asserts strict 0/0/0.

## Threat Model Notes

- T-23-01 (Tampering, slug-skip): mitigated — skip is scoped to the exact slug `multi-chain-evm`; byte-identical re-emit verified by `build:chat-context:check` + chat-context-integrity (6 slugs). Defensive source-path regex retained.
- T-23-01-INT (Information Disclosure, chat corpus): mitigated — #7 stays out of `portfolio-context.json` until Phase 25; chat-side pins left unchanged and actively verify the exclusion.
- T-23-SC (installs): N/A — zero packages installed (QA-02 honored; `package.json` untouched).

## Self-Check: PASSED

- src/content/projects/multi-chain-evm.mdx — FOUND
- tests/content/projects-ordering.test.ts — FOUND
- fenced case study in Projects/7 - MULTI-DEX CRYPTO TRADER.md — FOUND (1 START / 1 END, README below)
- commit 7fc8cc1 (Task 1) — FOUND
- commit 83af140 (Task 2) — FOUND
- commit 9280c81 (Task 3) — FOUND
