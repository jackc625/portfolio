---
phase: 23-projects-reconciliation-featured-tier
plan: 02
subsystem: content-gates
status: complete
tags: [projects, content-gates, voice, worker-bundle, chat-exclusion]
requirements: [PROJ-01]
dependency_graph:
  requires:
    - src/content/projects/multi-chain-evm.mdx (synced by 23-01)
    - tests/content/projects-collection.test.ts (canonical sorted-array idiom)
  provides:
    - multi-chain-evm covered by all six site-side content gates
    - chat-side pins verified untouched (chat stays 6 until Phase 25)
  affects:
    - 23-04 (phase-gate build validates the no-MDX-in-worker bundle assertion on a fresh dist/)
    - 25 (chat knowledge refresh lifts the D-15 exclusion)
tech_stack:
  added: []
  patterns:
    - hard-coded sorted slug arrays as per-file content-gate registries (D-16)
    - site-side arrays updated, chat-side pins deliberately left unchanged
key_files:
  created: []
  modified:
    - tests/content/case-studies-have-content.test.ts
    - tests/content/case-studies-shape.test.ts
    - tests/content/case-studies-wordcount.test.ts
    - tests/content/voice-banlist.test.ts
    - tests/content/voice-em-dash.test.ts
    - tests/build/no-mdx-in-worker-bundle.test.ts
decisions:
  - "D-16 exhaustiveness: multi-chain-evm added to six site-side gate arrays in alphabetical position (between daytrade and nfl-predict); zero chat-side pins touched"
  - "wordcount gate left as soft-warn only (not strengthened to hard-fail) per F2 / D-16; the 600-900 floor is enforced by the Plan 04 human sign-off (D-02)"
  - "no-mdx-in-worker mdxStems updated only; its runtime bundle assertion is validated at the Plan 04 fresh-dist build (F8)"
metrics:
  tasks_completed: 2
  files_touched: 6
  duration: ~2min
  completed: 2026-07-10
---

# Phase 23 Plan 02: Projects Reconciliation & Featured Tier Summary

Pulled the synced Multi-Chain EVM case study (#7) under all six site-side content gates by adding its `multi-chain-evm` slug to each gate's hard-coded array, while leaving every chat-side pin untouched so chat stays at exactly six projects until Phase 25.

## What Was Built

**Task 1 — case-study content gates (commit 112c884)**
Added `multi-chain-evm` in alphabetical position (between `daytrade` and `nfl-predict`) to the `PROJECTS` arrays in `tests/content/case-studies-have-content.test.ts`, `case-studies-shape.test.ts`, and `case-studies-wordcount.test.ts`. Each array grew 6→7; nothing else changed. #7 is now enforced for a non-empty body (have-content) and the five-H2 shape in order — Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings (shape). The wordcount gate reports/soft-warns the word count and always passes; per F2 / D-16 it was NOT strengthened to hard-fail below 600 (the 600-900 floor is enforced by the Plan 04 human sign-off, D-02). All 21 tests (7 projects × 3 files) green — #7 already carries a 870-word compliant body from 23-01, so no warning fired.

**Task 2 — voice gates + no-MDX-in-worker gate (commit 681191c)**
Added `multi-chain-evm` in the same alphabetical position to the `PROJECTS` arrays in `tests/content/voice-banlist.test.ts` and `voice-em-dash.test.ts`, and to the `mdxStems` array in `tests/build/no-mdx-in-worker-bundle.test.ts`. Both voice gates pass — the #7 body has zero banned marketing words and zero em dashes per paragraph (21 tests green). The `mdxStems` array was updated only; its runtime assertion that compiled #7 MDX never leaks into the Cloudflare Worker bundle requires a fresh `dist/` and is validated at the Plan 04 `pnpm build` (F8), not in this Wave-2 plan. The four chat-side pins (`chat-context-integrity`, `chat-knowledge-voice`, `chat-eval-dataset`, `prompt-injection`) were left byte-identical.

## Verification Results

- `pnpm exec vitest run` over the five content gates (`case-studies-have-content`, `case-studies-shape`, `case-studies-wordcount`, `voice-banlist`, `voice-em-dash`): 5 files / 42 tests passed.
- `git diff --name-only 112c884~1 HEAD` over the four chat-side pins: empty — no chat-side pin was modified by this plan.
- `git status --short`: only the six site-side test files were staged/committed across the two task commits (pre-existing `public/jack-cutrara-resume.pdf` change and untracked scratch files are out of scope and were not touched).

## Success Criteria

- SC1 / PROJ-01 (exhaustiveness): #7 is now covered by every site-side content gate — has-content, shape, wordcount, voice-banlist, voice-em-dash, and no-MDX-in-worker. PASS
- Chat stays 6: all four chat-side pins remain unchanged; chat corpus exclusion of #7 holds until Phase 25. PASS

## Deviations from Plan

None. Plan executed exactly as written.

## Threat Model Notes

- T-23-02 (Tampering, chat-side pins): mitigated — the six site-side arrays were updated and the four chat-side pins were left unchanged, verified by an empty `git diff` over the pin files. Editing a pin would silently ingest #7 into the chat corpus (a D-15 violation); leaving them untouched is the mitigation.
- T-23-SC (installs): N/A — zero packages installed (QA-02 honored; no `package.json` change).

## Self-Check: PASSED

- commit 112c884 (Task 1) — FOUND
- commit 681191c (Task 2) — FOUND
- multi-chain-evm present in all six site-side arrays — VERIFIED (5 gate files green; mdxStems updated)
- chat-side pins unchanged — VERIFIED (empty diff)
