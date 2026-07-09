---
phase: 21-experience-content-pipeline-collection
plan: 04
subsystem: content-pipeline
tags: [ci, docs, experience, drift-gate]
requires: [21-01, 21-03]
provides: [experience-ci-drift-gate, experience-pipeline-docs]
affects: [.github/workflows/sync-check.yml, docs/CONTENT-SCHEMA.md]
tech-stack:
  added: []
  patterns: [manual-sync-plus-ci-check, independent-drift-gates]
key-files:
  created: []
  modified:
    - .github/workflows/sync-check.yml
    - docs/CONTENT-SCHEMA.md
decisions:
  - "Experience CI drift gate is a separate, independent step from the projects gate (D-11) — not merged"
  - "CONTENT-SCHEMA.md documents experience bodies as freeform: H2-shape and word-count checks explicitly do NOT apply (D-07)"
  - "Authority preamble now names scripts/sync-experience.mjs as a code authority (review finding #4)"
metrics:
  duration: ~10m
  completed: 2026-07-09
  tasks: 2
  files: 2
status: complete
---

# Phase 21 Plan 04: Experience Pipeline CI Gate & Docs Summary

Wired the experience content sync into the CI drift gate and documented the full experience pipeline in CONTENT-SCHEMA.md, completing the manual-sync + CI-`--check` pattern (D-11) as an exact mirror of the projects pipeline. This closes the last seam of SC1 (drift enforcement lives in CI, not `build`) and finishes the EXP-01 pipeline contract.

## What Was Built

### Task 1: CI drift gate for experience (`.github/workflows/sync-check.yml`)
- Added three path globs under `on.pull_request.paths` mirroring the projects entries: `Experience/**`, `src/content/experience/**`, `scripts/sync-experience.mjs`. All existing path entries left intact.
- Added a new step `Verify Experience/ <-> MDX sync is clean` running `pnpm sync:experience:check`, placed immediately after the projects verify step and kept as an independent gate (D-11). Setup/install/projects/chat-context steps untouched.
- Commit: `2d170f4`

### Task 2: Experience pipeline documentation (`docs/CONTENT-SCHEMA.md`)
- Updated the authority preamble (:3-5) so the "code wins" statement additionally names `scripts/sync-experience.mjs` alongside `src/content.config.ts` and `scripts/sync-projects.mjs` (review finding #4).
- Added an "Experience Pipeline" section (§5–§8) mirroring the projects docs:
  - §5 Experience Frontmatter Schema — D-01 field table (role, company, location, startDate, endDate optional/omit-for-present, dateRange, techStack may-be-empty, summary, highlights max 5, engagementType enum, hasCaseStudy, chatSummary optional, source) with the same string-shape-only note.
  - §6 Experience Sync Contract — shared fence markers (D-08), explicitly noting the 5-H2-shape and 600–900-word checks do NOT apply (D-07); experience bodies are freeform.
  - §7 Experience Author Workflow — references `pnpm sync:experience` and the `pnpm sync:experience:check` CI gate.
  - §8 Experience Failure-Mode Matrix — repointed to `Experience/*.md`, exit-2 hard fails (missing/duplicate/out-of-order fence, missing `source:`, source not found, path escape) and exit-1 drift; the H2/word-count warning rows intentionally omitted.
- Commit: `fa41cf5`

## Verification

- `pnpm sync:experience:check` → exit 0 (unchanged: balfour-beatty.mdx, holloway.mdx) — proves the new CI step passes against synced state.
- Task 1 YAML token check (all 5 required strings present) → passed.
- Task 2 doc token check (preamble names sync-experience.mjs; experience/Experience//sync:experience/engagementType/hasCaseStudy present) → passed.
- `pnpm exec astro check` → 0 errors, 0 warnings, 1 pre-existing hint (`chat.ts:384` unused `button` param, unrelated to this plan). Doc/YAML change does not affect the build.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model

T-21-02 (Tampering — experience sync drift on PRs) mitigated: the new `Verify Experience/ <-> MDX sync is clean` CI step runs `pnpm sync:experience:check` (exit 1 on drift), blocking merges where an MDX body diverges from its fenced source. T-21-SC (npm installs) accepted — zero installs, CI + docs only.

No new threat surface introduced.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: .github/workflows/sync-check.yml
- FOUND: docs/CONTENT-SCHEMA.md
- FOUND: .planning/phases/21-experience-content-pipeline-collection/21-04-SUMMARY.md
- FOUND commit: 2d170f4 (Task 1)
- FOUND commit: fa41cf5 (Task 2)
