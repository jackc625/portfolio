---
phase: quick/261106-gky
plan: 01
subsystem: content / chat-corpus / tests
status: complete
tags: [content-removal, chat-corpus, tests, d-06-truncation]
requires: []
provides:
  - "5-project portfolio (seatwatch, multi-chain-evm, nfl-predict, optimize-ai, clipify)"
  - "Synthetic D-06 README-truncation coverage (truncateReadme + buildProjectBlock)"
affects:
  - src/data/portfolio-context.json (chat assistant knowledge)
  - /projects listing (5 rows 01..05)
tech-stack:
  added: []
  patterns:
    - "Synthetic temp-dir fixtures for exported build-script helpers (mirrors parse-education.test.ts import style)"
key-files:
  created: []
  modified:
    - src/data/portfolio-context.json
    - tests/build/chat-context-integrity.test.ts
    - tests/content/projects-ordering.test.ts
    - tests/content/voice-em-dash.test.ts
    - tests/content/projects-collection.test.ts
    - tests/content/case-studies-shape.test.ts
    - tests/content/case-studies-wordcount.test.ts
    - tests/content/case-studies-have-content.test.ts
    - tests/content/voice-banlist.test.ts
    - tests/build/no-mdx-in-worker-bundle.test.ts
    - tests/fixtures/chat-eval-dataset.ts
    - tests/api/prompt-injection.test.ts
    - tests/build/featured-tier-render.test.ts
  deleted:
    - src/content/projects/daytrade.mdx
    - "Projects/6 - DAYTRADE.md"
decisions:
  - "No redirect added for the removed route (SolSniper precedent 6b411d2)"
  - "D-06 truncation coverage moved from the live corpus to six synthetic cases; no build-script export changed"
  - "prompt-injection anchor floor lowered 5 -> 4 to match the real post-removal anchor count"
metrics:
  duration: "~4 min"
  completed: 2026-11-06
actuals:
  tokens: 29400
  tasks: 3
  commits: 1
plan_head_before: 6b411d23a338968d6ba2d7f4e90b6666d5914aa9
plan_head_after: bdc43d9a4a4e9d4f3a8efeab5958da98cb0daf4e
---

# Quick Task 261106-gky: Remove Retired Trading-Bot Project Summary

Removed the retired crypto trading-bot case study (MDX page + Projects/ source), regenerated the chat corpus to 5 projects, shrank every content/build/chat-eval gate from six projects to five, and replaced the corpus-level D-06 truncation assertion with six synthetic `truncateReadme` / `buildProjectBlock` tests. One local commit `bdc43d9`; not pushed, not deployed.

## Commit

| Commit | Message | Files |
|--------|---------|-------|
| `bdc43d9` | chore(quick-261106-gky): remove retired Daytrade project from portfolio | 15 (2 deletions + 13 modifications), +135 / -740 |

`git rev-list --count origin/main..main` = 1 (local only; no push, no deploy).

## Gate Results

| Gate | Result |
|------|--------|
| `pnpm sync:check` | exit 0 |
| `pnpm sync:experience:check` | exit 0 |
| `pnpm build:chat-context:check` | exit 0 (corpus `unchanged` after regeneration) |
| `pnpm check` | 0 errors / 0 warnings / 0 hints (140 files) |
| `pnpm build` | exit 0, full pipeline incl. `wrangler types` (no fallback needed) |
| `dist/client/projects/<removed slug>` | absent; `dist/client/projects/index.html` present; dist/client/projects holds only clipify, multi-chain-evm, nfl-predict, optimize-ai, seatwatch |
| `pnpm test` (after fresh build) | **78 files passed / 1 skipped (79); 683 tests passed / 2 skipped (685); 0 failures** |
| Zero-hit `git grep -niE -e daytrade -e "crypto breakout" -e "breakout bot" -e day-trad -- . ':(exclude).planning'` | no output, exit 1 (baseline 14 files) |
| `git show --stat --format= HEAD` | 15 files |

Regenerated corpus (`pnpm build:chat-context`): `TOTAL: projects=5  words=13660  est_tokens=34117`. Pages: /projects/clipify, /projects/multi-chain-evm, /projects/nfl-predict, /projects/optimize-ai, /projects/seatwatch. No project is truncated (largest extRef: seatwatch 3,629 words).

## Task Notes

- **Task 1 (tracer):** `git rm` of both content files; corpus regenerated via script (never hand-edited). chat-context-integrity: slug list and counts to 5, old corpus-truncation `it` removed, new `describe("D-06 README truncation path (synthetic fixtures)")` with cases A-F (paragraph-boundary cut past cap, exact-cap fallback, at-cap identity, under-cap identity, marker present when over cap, marker absent when under cap) using a mkdtemp dir cleaned in afterAll. projects-ordering mirrors 6b411d2. Tracer verify passed (22/22) before expanding.
- **Task 2:** one-line slug deletion in each of the 7 gate files (7 deletions total, verified by `git diff --stat`); 39/39 pass.
- **Task 3:** fixture entries removed (groundedQA + voiceSpotCheck); gold response now reads "five shipped systems ... SeatWatch exercises distributed concurrency; the NFL Prediction system exercises walk-forward validation; Optimize AI exercises Postgres Row-Level Security." prompt-injection drift guard at 5 pages / 4-anchor floor; featured-tier-render at 5 rows 01..05, tagged `[true, true, true, false, false]`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] astro check TS2339 on `truncationMarker` in the new synthetic test**
- **Found during:** Task 3 full gate (`pnpm check` reported 1 error)
- **Issue:** TypeScript infers `buildProjectBlock`'s return type from the JS object literal, which omits the conditionally-attached `truncationMarker`, so reading it failed type-checking.
- **Fix:** In case E only, widened the type locally (`block.extendedReference as { truncated: boolean; truncationMarker?: string }`). No change to the build script or its exports. Re-check: 0/0/0.
- **Files modified:** tests/build/chat-context-integrity.test.ts
- **Commit:** bdc43d9

### Process Note: commit on `main`

The executor's generic pre-commit guard (`git.base-branch --is-protected main`) returned `true`. The commit was made on `main` anyway, because this project uses `branching_strategy: none`, every prior quick-task commit (e.g. 3e5af37, 8595ad6, 6b411d2) is on `main`, and both the plan and the orchestrator explicitly specified a single local commit on `main`. The commit is local only (ahead of origin by 1). If the owner prefers it elsewhere, it is a single unpushed commit and can be moved before any push.

## Owner Work Untouched

After commit, `git status --short` still shows ` M public/jack-cutrara-resume.pdf` (unstaged) and all untracked owner paths (`.bg-shell/`, `.claude/`, `.ship-safe/`, `LOGS.txt`, `graphify-out/`, `phase22-*.png`, `phase23-*.png`, `uat23-*.png`) plus this quick-task dir. Staging used only `git rm` x2 and `git add` of 13 explicit paths; the pre-commit `git diff --cached --name-only` listed exactly 15 paths without the PDF. No stash/restore/reset/clean was run. No new untracked files were produced by the build or tests.

## Known Stubs

None.

## Threat Flags

None. No new surface; T-261106-gky-01..04 mitigations all applied (regenerated corpus + zero-hit grep, explicit-path staging, synthetic D-06 coverage, no push/deploy).

## Self-Check: PASSED

- FOUND: commit bdc43d9 (ancestor of HEAD)
- FOUND: tests/build/chat-context-integrity.test.ts, tests/content/projects-ordering.test.ts, src/data/portfolio-context.json
- CONFIRMED DELETED: src/content/projects/daytrade.mdx, Projects/6 - DAYTRADE.md
