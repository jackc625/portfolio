---
phase: 13-content-pass-projects-sync
plan: 04
subsystem: content-structural-wiring
tags: [rename, source-field, frontmatter, chat-context-lockstep, d18-annotations, tdd-green]

requires:
  - phase: 13-content-pass-projects-sync
    plan: 01
    provides: 4 RED vitest files (source-files-exist, case-studies-have-content, projects-collection test 1, projects-collection test 2)
  - phase: 13-content-pass-projects-sync
    plan: 02
    provides: Zod schema with source: z.string() requirement + sync script --check expecting source: field
provides:
  - src/content/projects/daytrade.mdx — renamed from crypto-breakout-trader.mdx; Zod-valid with source: "Projects/6 - DAYTRADE.md"
  - src/content/projects/{seatwatch,nfl-predict,solsniper,optimize-ai,clipify}.mdx — each now has source: field pointing to its Projects/*.md (CONT-05)
  - src/data/portfolio-context.json — daytrade entry replaces crypto-breakout-trader entry; description + tech byte-identical to daytrade.mdx frontmatter (D-26 lockstep)
  - src/data/about.ts — 4 /* Verified: 2026-04-19 */ annotations, one above each export const (D-18)
affects: [13-05-case-studies-batch-a, 13-06-case-studies-batch-b, 13-07-case-studies-batch-c, 13-08-uat-and-about-audit, 13-09-phase-gate-d26-and-build]

tech-stack:
  added: []
  patterns:
    - "git mv for MDX rename preserves history (git log output: 'rename src/content/projects/{crypto-breakout-trader.mdx => daytrade.mdx} (99%)')"
    - "Frontmatter edits strictly additive (5 files) or surgical 2-line field-only changes (daytrade.mdx + portfolio-context.json) — S1 byte-range preservation rule upheld"
    - "source: field placement consistent across all 6 MDX — always last frontmatter line before closing ---"
    - "Description and tech fields in portfolio-context.json copied byte-for-byte from daytrade.mdx frontmatter (D-26 chat-context lockstep; chat.ts imports this JSON)"

key-files:
  renamed:
    - src/content/projects/crypto-breakout-trader.mdx -> src/content/projects/daytrade.mdx
  modified:
    - src/content/projects/daytrade.mdx (post-rename: title + source: added)
    - src/content/projects/seatwatch.mdx (source: added)
    - src/content/projects/nfl-predict.mdx (source: added)
    - src/content/projects/solsniper.mdx (source: added)
    - src/content/projects/optimize-ai.mdx (source: added)
    - src/content/projects/clipify.mdx (source: added)
    - src/data/portfolio-context.json (daytrade block replaces crypto-breakout block)
    - src/data/about.ts (4 dated Verified annotations)
    - .planning/STATE.md
    - .planning/ROADMAP.md

key-decisions:
  - "daytrade.mdx description kept byte-identical to the pre-rename value. The plan allowed refinement against Projects/6 - DAYTRADE.md ('refine if DAYTRADE.md disagrees'). DAYTRADE.md confirms every phrase in the existing description ('momentum breakout detection on 5-minute candles with composable signal filters, risk-based position sizing, and atomic state persistence') is a real feature. DAYTRADE.md ADDS a second dimension — the walk-forward validation / promotion-gate pipeline — that the existing description omits. Choice: leave the description alone in Plan 04 (structural layer) because (a) Plan 07 body rewrite is where case-study prose gets the second-dimension story, (b) keeping description byte-stable guarantees zero churn for the portfolio-context.json D-26 lockstep in Task 3 (description preserved byte-for-byte across the two files)."
  - "git mv recorded the rename at 99% similarity (git commit output: 'rename src/content/projects/{crypto-breakout-trader.mdx => daytrade.mdx} (99%)'). Git's rename detection survived the post-move frontmatter edit (2 lines changed out of 46). History is preserved; git blame on the body still resolves to the original authoring commits."
  - "source: field placed as the LAST frontmatter line before closing --- in all 6 MDX. Zod is order-agnostic so any position works, but picking one consistent placement (per PATTERNS.md Pattern 1 / consistency) minimizes future diff noise and makes hand-authored frontmatters predictable. For seatwatch.mdx this meant source: AFTER demoUrl: (its previous last line); for the other 5 it meant source: AFTER year: (their previous last lines)."
  - "portfolio-context.json diff is exactly 2+2 (two deletions, two insertions) — only name and page fields changed; description and tech preserved byte-for-byte. This is the minimum possible diff satisfying D-26 lockstep: the chat context JSON can be byte-identical to the MDX description/tech at the field level, so the chat system prompt serialization is deterministic across the rename."
  - "about.ts diff is pure-additive (4 insertions, 0 deletions, 0 content modifications). The comment placement (/* Verified: 2026-04-19 */ on its own line immediately above each export const) matches PATTERNS.md's canonical form. Date is the actual phase-execution date (2026-04-19, captured via date +%Y-%m-%d at execute time), not the planning date (2026-04-16) — per D-18 'git blame on the annotation is the durable evidence' the timestamp must reflect when verification happened."
  - "D-26 early-warning chat smoke check DEFERRED to orchestrator / Plan 09 per plan text. Rationale: subagent cannot drive a manual browser smoke; the plan's embedded checkpoint:human-verify sub-step was explicitly labeled advisory-only ('This is an early-warning smoke check ONLY. The binding D-26 regression gate lives in Plan 09 Task 1'). The authoritative Phase 7 regression battery runs in Plan 09. This is NOT a deviation — the plan itself authorizes the deferral."

requirements-completed: [CONT-04, CONT-05]

duration: ~12min
completed: 2026-04-19
---

# Phase 13 Plan 04: Daytrade Rename + Anchors Summary

**Crypto Breakout Trader -> Daytrade rename propagated across every runtime surface — MDX file renamed via `git mv` (history preserved at 99% similarity), frontmatter rewritten, source: field added to all 6 MDX (closing the Zod RED state from Plan 02), portfolio-context.json patched in D-26 lockstep with daytrade.mdx, and D-18 dated annotations landed on all four about.ts exports. 4 test files flipped RED -> GREEN (source-files-exist, case-studies-have-content, projects-collection both tests). Phase-level RED boundary moved from "missing source:" to "missing CASE-STUDY-START fence" — exactly the Wave-4 handoff contract.**

## Performance

- **Duration:** ~12 min (inline execution)
- **Tasks:** 3 (rename + frontmatter rewrite, 5-file source: addition, chat-context + about.ts)
- **Files renamed:** 1 (crypto-breakout-trader.mdx -> daytrade.mdx, 99% similarity)
- **Files modified:** 8 (6 MDX + portfolio-context.json + about.ts)
- **Total diff:** 2+1 (Task 1) + 5+0 (Task 2) + 6+2 (Task 3) = 13 insertions / 3 deletions across 8 files
- **Dependencies added:** 0 (S8 zero-new-deps gate holds)

## Accomplishments

- **Task 1 (`43b0514`):** `git mv` rename recorded at 99% similarity. daytrade.mdx frontmatter updated in 2 lines: `title: "Crypto Breakout Trader"` -> `title: "Daytrade"` + new `source: "Projects/6 - DAYTRADE.md"` line. Body content (46 lines, 5 H2 sections) preserved byte-for-byte. `pnpm check` proves daytrade.mdx is now Zod-valid (Zod errors now point at the other 5 MDX, not daytrade).
- **Task 2 (`906c5d2`):** Five pure-additive edits, one per remaining MDX. Each adds exactly one `source: "Projects/<n>-<NAME>.md"` line as the new last frontmatter line before closing `---`. All 5 Projects/*.md target files verified present on disk (`test -f` + `source-files-exist.test.ts` GREEN). `pnpm check` now returns 0 errors, 0 warnings, 0 hints — all 6 MDX pass Zod. `sync-projects.mjs --check` boundary moved from "missing source" to "missing fence" (Wave-4 hand-off contract established).
- **Task 3 (`4b66390`):** portfolio-context.json 2+2 surgical diff — only name and page changed (description and tech preserved byte-for-byte in D-26 lockstep). JSON validity verified via `node -e "JSON.parse(...)"`. about.ts 4+0 pure-additive diff — 4 `/* Verified: 2026-04-19 */` comments added, one above each `export const`; all four string values byte-identical to pre-edit. `tests/client/about-data.test.ts` 5/5 GREEN (no regression). D-26 chat smoke deferred to Plan 09 per plan text (see Deviations -> D-26 Smoke Deferral).
- **4 test files flipped RED -> GREEN:**
  - `tests/content/source-files-exist.test.ts`: 1/1 GREEN (every MDX source: points to existing Projects/*.md)
  - `tests/content/case-studies-have-content.test.ts`: 6/6 GREEN (all 6 body-non-empty checks pass; daytrade.mdx ENOENT resolved)
  - `tests/content/projects-collection.test.ts` test 1: GREEN (slug list = ["clipify","daytrade","nfl-predict","optimize-ai","seatwatch","solsniper"])
  - `tests/content/projects-collection.test.ts` test 2: GREEN (exactly 3 featured=true — seatwatch, nfl-predict, solsniper; no frontmatter pinning needed in Plan 04 because pre-rename featured flags were already correct)
- **Clean production build:** `pnpm build` produced `dist/client/projects/daytrade/index.html`; `dist/client/projects/crypto-breakout-trader/` absent. All 6 project routes render.
- **Zero residual crypto-breakout references in runtime surfaces:** `git grep -i "crypto-breakout-trader\|crypto breakout trader" -- ':!.planning/' ':!milestones/'` returns zero matches. Historical references inside `.planning/milestones/` (v1.0 verification docs, v1.1 plans) and `.planning/phases/13-*` (this phase's own planning docs) are intentional — git-blame evidence for the rename paper trail.

## Task Commits

1. **Task 1: Rename via git mv + rewrite daytrade.mdx frontmatter (D-04, D-15)** — `43b0514` (refactor)
2. **Task 2: Add source: to 5 remaining MDX files (D-15)** — `906c5d2` (feat)
3. **Task 3: Patch portfolio-context.json + annotate about.ts (D-18, D-26)** — `4b66390` (feat)

## Test Counts

```
$ pnpm test tests/scripts tests/content/source-files-exist.test.ts tests/content/case-studies-have-content.test.ts tests/content/projects-collection.test.ts tests/content/docs-content-schema.test.ts tests/content/docs-voice-guide.test.ts tests/content/roadmap-amendment.test.ts tests/client/about-data.test.ts
 Test Files  10 passed (10)
      Tests  36 passed (36)

$ pnpm test   # full suite
 Test Files  1 failed | 22 passed (23)
      Tests  6 failed | 143 passed (149)
```

Full suite before Plan 04: 23 files, 5 failed / 18 passed (149 tests, 10 failed / 139 passed).
Full suite after Plan 04: 23 files, 1 failed / 22 passed (149 tests, 6 failed / 143 passed).

- Net: +4 test files GREEN (the 4 Plan-04-owned tests flipped), +4 tests passing.
- Remaining RED: `tests/content/case-studies-shape.test.ts` (6 tests, one per slug) — all fail because every MDX body still has the Phase-4 legacy 4-H2 shape ("Solution & Approach", "Tech Stack Detail", "Challenges & Lessons", "Results") instead of the D-01 5-H2 shape ("Problem", "Approach & Architecture", "Tradeoffs", "Outcome", "Learnings"). This is the Plan 05/06/07 case-study body rewrite scope — exactly the expected Wave-4 handoff boundary.

## RED -> GREEN Mapping (this plan's tests)

| Plan 01 test file | Before Plan 04 | After Plan 04 | Closed by |
|---|---|---|---|
| `tests/content/source-files-exist.test.ts` | RED (6 MDX missing source: field) | GREEN (1/1) | Tasks 1 + 2 (commits `43b0514`, `906c5d2`) |
| `tests/content/case-studies-have-content.test.ts` | RED (daytrade.mdx ENOENT) | GREEN (6/6) | Task 1 commit `43b0514` |
| `tests/content/projects-collection.test.ts` test 1 | RED (slug list had crypto-breakout-trader, not daytrade) | GREEN | Task 1 commit `43b0514` |
| `tests/content/projects-collection.test.ts` test 2 | RED (indirectly — test 1 failure short-circuited the file) | GREEN (3 featured=true verified) | Task 1 commit `43b0514` |

## Slug -> Source Mapping (Post-Plan-04 End State)

| MDX slug | source: value | Target file size |
|---|---|---|
| seatwatch | `"Projects/1 - SEATWATCH.md"` | 28,848 bytes |
| nfl-predict | `"Projects/2 - NFL_PREDICT.md"` | 32,908 bytes |
| solsniper | `"Projects/3 - SOLSNIPER.md"` | 20,274 bytes |
| optimize-ai | `"Projects/4 - OPTIMIZE_AI.md"` | 16,278 bytes |
| clipify | `"Projects/5 - CLIPIFY.md"` | 24,444 bytes |
| daytrade (renamed from crypto-breakout-trader) | `"Projects/6 - DAYTRADE.md"` | 46,593 bytes |

## Frontmatter Diff Summary per MDX

| File | Fields added | Fields changed | Fields removed |
|---|---|---|---|
| daytrade.mdx (was crypto-breakout-trader.mdx) | `source: "Projects/6 - DAYTRADE.md"` | `title: "Crypto Breakout Trader"` -> `"Daytrade"` | none |
| seatwatch.mdx | `source: "Projects/1 - SEATWATCH.md"` | none | none |
| nfl-predict.mdx | `source: "Projects/2 - NFL_PREDICT.md"` | none | none |
| solsniper.mdx | `source: "Projects/3 - SOLSNIPER.md"` | none | none |
| optimize-ai.mdx | `source: "Projects/4 - OPTIMIZE_AI.md"` | none | none |
| clipify.mdx | `source: "Projects/5 - CLIPIFY.md"` | none | none |

## portfolio-context.json Daytrade Entry (Post-Edit)

```json
    {
      "name": "Daytrade",
      "description": "An automated cryptocurrency day-trading system implementing momentum breakout detection on 5-minute candles with composable signal filters, risk-based position sizing, and atomic state persistence.",
      "tech": ["Python", "CCXT", "pandas", "pandas-ta", "Pydantic"],
      "page": "/projects/daytrade"
    }
```

D-26 lockstep verified: `description` and `tech` fields above are byte-identical to daytrade.mdx frontmatter lines 4 and 5 respectively. No unexpected drift in techStack between old portfolio-context.json and new daytrade.mdx (both kept `["Python", "CCXT", "pandas", "pandas-ta", "Pydantic"]`).

## about.ts Annotation Date

Actual execute-time date used: **2026-04-19** (`date +%Y-%m-%d` at execute time). All four `/* Verified: 2026-04-19 */` comments share this date. Git blame on each comment line is the durable D-18 evidence going forward — any future copy audit re-runs the workflow and updates the date in place.

## Initial State -> End State

| Contract | State at Plan 04 start | State at Plan 04 end |
|---|---|---|
| `src/content/projects/crypto-breakout-trader.mdx` | exists (title "Crypto Breakout Trader", no source:) | ABSENT (renamed) |
| `src/content/projects/daytrade.mdx` | absent | EXISTS (title "Daytrade", source: "Projects/6 - DAYTRADE.md", body preserved from pre-rename) |
| Source: field across 6 MDX | 0 of 6 | 6 of 6 |
| `pnpm check` | errors on all 6 MDX ("Required: source") | 0 errors / 0 warnings / 0 hints |
| `node scripts/sync-projects.mjs --check` | errors on 6 MDX ("missing source:") | errors on 6 MDX ("missing CASE-STUDY-START" — Wave-4 handoff boundary) |
| `pnpm build` | fails at Zod validation | produces `dist/client/projects/daytrade/` and 5 others; NO `dist/client/projects/crypto-breakout-trader/` |
| `src/data/portfolio-context.json` crypto-breakout refs | 2 (name + page) | 0 |
| `src/data/about.ts` dated annotations | 0 | 4 |
| 4 Plan-01 test files (source-files-exist, case-studies-have-content, projects-collection x2) | RED | GREEN |
| CONT-04 requirement (rename + homepage/work list) | partial (tests red) | closed (build produces daytrade route, old route gone, chat JSON reflects rename) |
| CONT-05 requirement (source: -> Projects/*.md integrity) | open | closed (all 6 source: values point at existing files) |

## Deviations from Plan

**None material.** Two procedural notes documented for the audit trail:

### D-26 Smoke Deferral (authorized by plan text)

**1. [Planned deferral] D-26 early-warning chat smoke check deferred to Plan 09**
- **Found during:** Task 3 (portfolio-context.json edit triggers the D-26 gate)
- **Context:** The plan's Task 3 `<action>` block contains an embedded `checkpoint:human-verify` sub-step instructing a manual dev-server smoke ("start `pnpm dev`, open chat widget, ask 'What did Jack build for Daytrade?', confirm response mentions Daytrade and not Crypto Breakout Trader, Ctrl-C to stop").
- **Plan-authorized deferral:** The plan text itself labels this smoke advisory-only and names Plan 09 as the authoritative gate — verbatim quote: *"This is an early-warning smoke check ONLY. The binding D-26 regression gate lives in Plan 09 Task 1 — that is where the full Phase 7 chat regression battery runs. If this smoke fails, surface the failure but continue toward Plan 09; the Plan 09 gate is the authoritative D-26 signoff."*
- **Why deferred here:** The executor is a subagent without a browser and cannot drive the manual smoke (can't click UI, can't read the chat widget response). The Plan 09 orchestrator runs the full Phase 7 chat regression battery (tests/api/chat.test.ts + security.test.ts + validation.test.ts + manual widget smoke) as the binding signoff.
- **Impact:** none — Plan 09 Task 1 owns the authoritative D-26 gate; no smoke-result signal needed here for Plan 04 acceptance.
- **Files modified:** none (pure deferral note)
- **Commit:** recorded in `4b66390` commit body + this SUMMARY's Deviations section

### Auto-applied surgical choices (Rule 2-adjacent — frontmatter byte-preservation)

**2. [Rule-2-adjacent] daytrade.mdx description kept byte-identical across the rename**
- **Found during:** Task 1 authoring
- **Plan said:** "description: a 1-2-sentence accurate summary derived from Projects/6 - DAYTRADE.md (the actual project README), NOT from the old AI-drafted description. Acceptable starter form (verify against DAYTRADE.md before committing)... the existing description is approximately right; refine if Projects/6 - DAYTRADE.md disagrees."
- **Verification:** Read Projects/6 - DAYTRADE.md lines 1-60. Every phrase in the existing description ("momentum breakout detection on 5-minute candles", "composable signal filters", "risk-based position sizing", "atomic state persistence") is a confirmed real feature in DAYTRADE.md. DAYTRADE.md additionally describes a walk-forward validation / promotion-gate pipeline that the description omits — but this is case-study body content (Plan 07 scope), not structural frontmatter content.
- **Reason for byte-preservation:** (a) description is accurate as-is per the plan's "approximately right" standard; (b) keeping it byte-stable eliminates any risk of D-26 lockstep drift in Task 3 (description preserved byte-for-byte across daytrade.mdx and portfolio-context.json); (c) body rewrite (Plan 07) is where the fuller story lands — Plan 04 is the structural layer.
- **Impact:** none — description still accurate, D-26 lockstep trivially satisfied.
- **Files modified:** `src/content/projects/daytrade.mdx` (title + source: only)
- **Commit:** `43b0514`

**Total deviations:** 1 planned deferral (D-26 smoke) + 1 Rule-2-adjacent byte-preservation choice. **Impact:** none — plan acceptance criteria all met or documented-deferred.

## Self-Check: PASSED

- [x] `src/content/projects/crypto-breakout-trader.mdx` does NOT exist: `test ! -f src/content/projects/crypto-breakout-trader.mdx` returns 0
- [x] `src/content/projects/daytrade.mdx` exists: `test -f src/content/projects/daytrade.mdx` returns 0
- [x] daytrade.mdx contains `title: "Daytrade"`: `grep -c '^title: "Daytrade"$' src/content/projects/daytrade.mdx` = 1
- [x] daytrade.mdx contains `source: "Projects/6 - DAYTRADE.md"`: `grep -c '^source: "Projects/6 - DAYTRADE.md"$' src/content/projects/daytrade.mdx` = 1
- [x] daytrade.mdx does NOT contain "Crypto Breakout Trader": `grep -c "Crypto Breakout Trader" src/content/projects/daytrade.mdx` = 0
- [x] Git recorded the rename at 99% similarity: `git log --oneline --diff-filter=R --find-renames -3` shows `rename src/content/projects/{crypto-breakout-trader.mdx => daytrade.mdx} (99%)` in commit `43b0514`
- [x] All 6 MDX have `source: "Projects/` as the frontmatter last line before closing `---`: `grep -c '^source: "Projects/' src/content/projects/*.mdx` = 6 (1 per file)
- [x] Per-file source: values correct:
  - seatwatch.mdx: `"Projects/1 - SEATWATCH.md"` -> verified
  - nfl-predict.mdx: `"Projects/2 - NFL_PREDICT.md"` -> verified
  - solsniper.mdx: `"Projects/3 - SOLSNIPER.md"` -> verified
  - optimize-ai.mdx: `"Projects/4 - OPTIMIZE_AI.md"` -> verified
  - clipify.mdx: `"Projects/5 - CLIPIFY.md"` -> verified
  - daytrade.mdx: `"Projects/6 - DAYTRADE.md"` -> verified
- [x] `pnpm check` exits 0: `Result (60 files): 0 errors, 0 warnings, 0 hints`
- [x] `pnpm test tests/content/source-files-exist.test.ts` = 1/1 GREEN
- [x] `pnpm test tests/content/case-studies-have-content.test.ts` = 6/6 GREEN
- [x] `pnpm test tests/content/projects-collection.test.ts` = 2/2 GREEN (slugs + featured=3)
- [x] `pnpm test tests/client/about-data.test.ts` = 5/5 GREEN (no regression from about.ts annotations)
- [x] `pnpm build` exits 0; produces `dist/client/projects/daytrade/index.html` (verified: `test -f dist/client/projects/daytrade/index.html` returns 0)
- [x] `pnpm build` does NOT produce `dist/client/projects/crypto-breakout-trader/` (verified: `test ! -d dist/client/projects/crypto-breakout-trader` returns 0)
- [x] portfolio-context.json contains `"name": "Daytrade"`: `grep -c '"name": "Daytrade"' src/data/portfolio-context.json` = 1
- [x] portfolio-context.json contains `"page": "/projects/daytrade"`: `grep -c '"page": "/projects/daytrade"' src/data/portfolio-context.json` = 1
- [x] portfolio-context.json does NOT contain crypto-breakout refs: `grep -ic "crypto-breakout\|Crypto Breakout" src/data/portfolio-context.json` = 0
- [x] portfolio-context.json is valid JSON: `node -e "JSON.parse(...)"` prints "valid JSON"
- [x] portfolio-context.json daytrade description byte-identical to daytrade.mdx frontmatter description (D-26 lockstep verified by inspection; both strings start "An automated cryptocurrency day-trading system implementing momentum..." and end "...and atomic state persistence.")
- [x] about.ts has 4 `Verified:` comments: `grep -c "/\* Verified:" src/data/about.ts` = 4
- [x] about.ts Verified comments use a real date (YYYY-MM-DD, not literal "MM-DD"): `grep -cE "/\* Verified: 2026-[0-9]{2}-[0-9]{2} \*/" src/data/about.ts` = 4
- [x] about.ts string values unchanged: diff is 4 pure-additive `Verified:` lines, 0 content modifications, 0 deletions
- [x] Task commit hashes exist in git log: `43b0514`, `906c5d2`, `4b66390` (confirmed via `git log --oneline -5`)
- [x] Grep sweep zero residual runtime refs: `git grep -i "crypto-breakout-trader\|crypto breakout trader" -- ':!.planning/' ':!milestones/'` returns zero matches
- [x] D-26 smoke deferral recorded in Task 3 commit body + Deviations section (per plan text authorization)
- [x] S8 zero-new-deps: `git diff HEAD~3 -- package.json pnpm-lock.yaml` returns nothing

Ready for Wave 4 (Plan 13-05 case-study bodies batch A — first group of MDX bodies rewritten to 5-H2 shape using the structural source: anchors this plan landed).
