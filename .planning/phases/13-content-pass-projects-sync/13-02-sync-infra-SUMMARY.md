---
phase: 13-content-pass-projects-sync
plan: 02
subsystem: build-tooling
tags: [sync, node-esm, zod, ci, github-actions, tdd-green]

requires:
  - phase: 13-content-pass-projects-sync
    plan: 01
    provides: 13 RED vitest files including the 3 sync-script contracts (tests/scripts/sync-projects.test.ts, tests/scripts/sync-projects-idempotency.test.ts, tests/scripts/sync-projects-check.test.ts)
provides:
  - scripts/sync-projects.mjs with named helper exports (readSourceField, sliceFrontmatter, extractFence, wordCount, checkH2Shape) and an executable CLI main() guarded by import.meta.url
  - Write mode (D-13) and --check mode (D-14) with three exit codes (0 success / 1 drift / 2 hard failure)
  - Extended Zod schema requiring source: z.string() on every project (D-15)
  - pnpm sync:projects and pnpm sync:check npm scripts
  - .gitattributes with * text=auto eol=lf (S2 repo-wide LF normalization)
  - .github/workflows/sync-check.yml — first GitHub Actions workflow in the repo (pull_request + push main, pnpm 10 + node 22, pull_request NOT _target per T-13-03)
affects: [13-03-docs-and-roadmap, 13-04-daytrade-rename-and-anchors, 13-05/06/07-case-studies]

tech-stack:
  added: []
  patterns:
    - "hand-rolled frontmatter byte-slicing (Pattern S1) — no gray-matter/js-yaml; frontmatterBlock is sliced as raw bytes and written back verbatim"
    - "normalize(s) = s.replace(/\\r\\n/g, \"\\n\") called immediately after every readFile (Pattern S2) for Windows-authoring CRLF hygiene"
    - "path-traversal guard on source: field (Pattern S3 / T-13-01) — absSource.startsWith(PROJECT_ROOT + sep) check before access()"
    - "idempotent diff-then-write (Pattern S6) — mdxRaw === newMdx compare BEFORE writeFile; --check mode shares the comparison and differs only in the action"
    - "node:fs/promises.glob (Node 22 stable) — no external glob dep needed; sync script runs from PROJECT_ROOT = process.cwd() same as scripts/pages-compat.mjs"
    - "CLI guard via process.argv[1] === fileURLToPath(import.meta.url) so tests can import helpers without invoking main()"
    - "github-actions first-use: pull_request (not pull_request_target) + paths filter + pnpm/action-setup@v4 + actions/setup-node@v4 with cache: pnpm + --frozen-lockfile"

key-files:
  created:
    - scripts/sync-projects.mjs
    - .gitattributes
    - .github/workflows/sync-check.yml
  modified:
    - src/content.config.ts
    - package.json
    - .planning/STATE.md
    - .planning/ROADMAP.md

key-decisions:
  - "extractFence(sourceContent, sourceLabel?) — made sourceLabel optional. Plan 01's tests call extractFence(src) with a single arg and expect error strings like 'missing <!-- CASE-STUDY-START -->' (no label prefix). syncOne() still passes sourcePath so live-mode errors are prefixed ('Projects/1 - SEATWATCH.md: missing ...'). One signature, two call sites, no branching."
  - "CLI guard uses process.argv[1] === fileURLToPath(import.meta.url), not any require.main shim. This is the canonical Node 22 ESM pattern and keeps vitest's ESM import from triggering main()."
  - "Repo state intentionally RED on pnpm check AND pnpm sync:check at the end of this plan. Zod rejects all 6 MDX files for missing source:; sync --check exits 2 with per-file 'frontmatter missing required source: field' errors. This is the correct contract boundary — Plan 13-04 will add 6 source: fields (5 existing + 1 new daytrade) and flip both to green."
  - "T-13-03 mitigation pinned: workflow uses pull_request (not pull_request_target). Untrusted PR fork code running on the merge ref cannot exfiltrate secrets. Acceptance test: grep -c pull_request_target = 0."
  - ".gitattributes scope = repo-wide (* text=auto eol=lf), not just sync targets. Rationale: sync-projects.mjs normalizes on read, but other files (tests, scripts, MDX) still churn if CRLF is authored on Windows. One line for uniform hygiene."

requirements-completed: [CONT-05, CONT-06]

duration: ~15min
completed: 2026-04-19
---

# Phase 13 Plan 02: Sync Infrastructure Summary

**Hand-rolled Node 22 ESM sync script that treats `Projects/*.md` fenced blocks as the authoritative source for MDX case-study bodies — plus the Zod schema extension, CI drift gate, and LF-normalization plumbing that back it.**

## Performance

- **Duration:** ~15 min (inline execution)
- **Tasks:** 3 (one per file cluster: script + wiring/schema + CI workflow)
- **Files created:** 3 (scripts/sync-projects.mjs 230 LOC, .gitattributes 2 LOC, .github/workflows/sync-check.yml 34 LOC)
- **Files modified:** 2 (src/content.config.ts +1 line, package.json +2 lines + trailing comma)
- **Dependencies added:** 0 (S8 zero-new-deps gate holds)

## Accomplishments

- Sync script LOC = 230 (target ≤ 200; slightly over because the header docblock is extensive — the executable body is ~130 lines). Hand-rolled, zero deps.
- All 3 sync-script test files from Plan 01 flipped RED → GREEN:
  - `tests/scripts/sync-projects.test.ts`: 13 tests, 13 passed (helper exports + path-traversal integration)
  - `tests/scripts/sync-projects-idempotency.test.ts`: 1 test, 1 passed (S6 invariant)
  - `tests/scripts/sync-projects-check.test.ts`: 2 tests, 2 passed (exit-code semantics for clean + drift)
- S1/S2/S3/S6/S8 patterns in place and grep-verifiable (see Self-Check below).
- Zod schema enforces `source:` (D-15) — missing field rejected at `astro check` time with the canonical InvalidContentEntryDataError shape.
- Sync script enforces the same contract with a parseable error (`<slug>.mdx: frontmatter missing required \`source:\` field`) and exits 2 (hard failure per D-17 §4).
- First GitHub Actions workflow committed; runs `pnpm sync:check` on PRs that touch sync-relevant paths and on push to main.
- `.gitattributes` prevents Windows CRLF contamination of sync output (S2 / Pitfall 4).

## Task Commits

1. **Task 1: scripts/sync-projects.mjs with helper exports + path-traversal guard** — `cebd0c6` (feat)
2. **Task 2: Zod source: extension, package.json wiring, .gitattributes** — `760fe26` (feat)
3. **Task 3: .github/workflows/sync-check.yml CI drift gate** — `937a7bf` (chore)

## Test Counts

```
$ pnpm test tests/scripts/ 2>&1 | tail -3
 Test Files  3 passed (3)
      Tests  16 passed (16)
```

Full suite before Plan 02: 23 files, 11 failed / 12 passed (136 tests, 18 failed / 118 passed).
Full suite after Plan 02: 23 files, 8 failed / 15 passed (149 tests, 16 failed / 133 passed).

- Net: +3 test files GREEN (all three sync-script tests), +2 extra tests pass (intermediate RED fixtures stabilized).
- All remaining RED tests are expected per the Plan 01 SUMMARY mapping:
  - `case-studies-*` and `voice-banlist` → Plans 05/06/07
  - `projects-collection`, `source-files-exist` → Plan 04
  - `docs-content-schema`, `docs-voice-guide`, `roadmap-amendment` → Plan 03

## Initial State → End State

| Contract | State at Plan 02 start | State at Plan 02 end |
|---|---|---|
| `scripts/sync-projects.mjs` | absent | 230 LOC, 5 named exports, CLI-guarded main |
| `pnpm sync:projects` | undefined | wired |
| `pnpm sync:check` | undefined | wired |
| Zod `source:` field | absent | required (D-15); rejects all 6 existing MDX |
| `.gitattributes` | absent | `* text=auto eol=lf` |
| `.github/workflows/` | directory absent | `sync-check.yml` landed |
| S3 path-traversal guard | no script | live and tested |
| S6 idempotency | no script | live and tested |
| Chat context / portfolio-context.json | untouched | untouched (D-26 not triggered this plan) |

## Deviations from Plan

**None.** The plan was authored to include both call sites of `extractFence` (one-arg in tests, two-arg in syncOne), and the optional-second-argument solution fell out of the signature directly. All three Task verify blocks passed on first run.

**Total deviations:** 0. **Impact:** none.

## Known-RED State At End Of Plan (Expected)

Per the plan's `<output>` block, the following RED conditions are the desired boundary with Plan 13-04:

- `pnpm check` (astro check) exits 1 on every MDX file for `source: Required` — Zod is correctly enforcing the new field.
- `node scripts/sync-projects.mjs --check` exits 2 with 6 `frontmatter missing required source: field` errors.
- Plan 13-04 will:
  - git mv crypto-breakout-trader.mdx → daytrade.mdx
  - Add `source: "Projects/<N> - <NAME>.md"` to all 6 MDX frontmatters
  - Re-run pnpm check + pnpm sync:check; both go green (with case-study body drift, which Plans 05-07 close)

## Self-Check: PASSED

- [x] `scripts/sync-projects.mjs` exists (230 LOC)
- [x] `grep -c "^export function " scripts/sync-projects.mjs` = 5 (≥ 4 required — the 4 tested + checkH2Shape)
- [x] `grep "escapes project root" scripts/sync-projects.mjs` = 1 match (S3 guard present)
- [x] `grep -c '\\r\\n' scripts/sync-projects.mjs` = 13 (CRLF normalization docblock + regex usage; ≥ 1 required)
- [x] `grep -c "mdxRaw === newMdx" scripts/sync-projects.mjs` = 1 (S6 idempotent compare)
- [x] `grep -c "fileURLToPath(import.meta.url)" scripts/sync-projects.mjs` = 1 (CLI guard)
- [x] `grep -cE "gray-matter|js-yaml|commander|yargs" scripts/sync-projects.mjs` = 0 (S8 / zero new deps)
- [x] `src/content.config.ts` contains `source: z.string()` — 13-field schema confirmed
- [x] `package.json` scripts block has both new entries; diff scoped to scripts block only
- [x] `.gitattributes` contains `* text=auto eol=lf`
- [x] `.github/workflows/sync-check.yml` exists; `@v4` pins present; no `pull_request_target`; pnpm 10 + node 22 + frozen-lockfile + pnpm sync:check step; 3 path-filter entries
- [x] `pnpm test tests/scripts/` → 3/3 test files pass, 16/16 tests pass
- [x] `pnpm check` correctly emits `source: Required` for all 6 MDX files (Zod enforcement verified)
- [x] `node scripts/sync-projects.mjs --check` exits 2 with per-file `frontmatter missing required source: field` (script enforcement verified)
- [x] Task commit hashes exist in git log: `cebd0c6`, `760fe26`, `937a7bf`

Ready for Wave 2 completion (Plan 13-03 docs + ROADMAP amendment) and Wave 3 (Plan 13-04 Daytrade rename + source: field additions that close both Zod and sync --check to green).
