---
phase: 13-content-pass-projects-sync
fixed_at: 2026-04-19T20:52:00Z
review_path: .planning/phases/13-content-pass-projects-sync/13-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 13: Code Review Fix Report

**Fixed at:** 2026-04-19T20:52:00Z
**Source review:** `.planning/phases/13-content-pass-projects-sync/13-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (WR-01, WR-02, WR-03)
- Fixed: 3
- Skipped: 0
- Test suite before: 149 passing. Test suite after: 163 passing (+14 new assertions).

All three Warning findings were applied cleanly. Info findings (IN-01 through IN-06) were out of scope for this iteration (`fix_scope: critical_warning`) and left for a later pass.

## Fixed Issues

### WR-01: D-11 Rule 1 em-dash cap is silently violated in every case study

**Files modified:**
- `docs/VOICE-GUIDE.md`
- `tests/content/voice-em-dash.test.ts` (new)
- `src/content/projects/clipify.mdx`
- `src/content/projects/daytrade.mdx`
- `src/content/projects/nfl-predict.mdx`
- `src/content/projects/optimize-ai.mdx`
- `Projects/5 - CLIPIFY.md`
- `Projects/6 - DAYTRADE.md`
- `Projects/2 - NFL_PREDICT.md`
- `Projects/4 - OPTIMIZE_AI.md`

**Commit:** `5ba5f5e`

**Applied fix:** Option B (relax the rule) plus the prose trimming needed to make the relaxed rule enforceable.

1. **VOICE-GUIDE.md rule change.** Replaced "max one em-dash per paragraph; prefer commas / semicolons / periods" with "prefer paired em-dashes (open/close); avoid three or more in a single paragraph". This matches the shipped canonical example (`seatwatch.mdx`) which uses paired em-dashes cleanly and never exceeds 2 per paragraph.

2. **Prose trims — 5 paragraphs across 4 case studies.** Each paragraph that carried 3-4 em-dashes was reduced to ≤2 via the lightest-touch substitution that preserved voice and sentence boundaries:
   - `clipify.mdx` P5: FFmpeg codec-spec em-dash pair -> parenthesis pair (kept the "energy peaks..speaker-change dynamics" paired em-dashes).
   - `daytrade.mdx` P1: trailing "— and the whole promotion pipeline..." -> ", and the whole promotion pipeline...".
   - `nfl-predict.mdx` P1: trailing "— a Friday 18:00 ET snapshot..." -> ": a Friday 18:00 ET snapshot...".
   - `nfl-predict.mdx` P8: "`cachetools.TTLCache` — multi-worker gunicorn..." -> "`cachetools.TTLCache`; multi-worker gunicorn...".
   - `optimize-ai.mdx` P13 (Learnings closer): "made new tables cheap — authorization became..." -> "made new tables cheap. Authorization became...".

3. **Upstream source parity.** The corresponding `Projects/*.md` source files were edited in lockstep so that `pnpm sync:check` (the CI drift gate) stays clean. Both MDX and upstream trees now contain the same prose.

4. **New test.** `tests/content/voice-em-dash.test.ts` asserts ≤2 em-dashes per paragraph across all six case studies. Six assertions, all green.

**Verification:**
- `pnpm test`: 163 passing (was 149; +6 em-dash tests + 6 scalable tests + 2 mismatched-quote tests across all three fixes).
- `pnpm check`: 0 errors / 0 warnings / 0 hints.
- `pnpm sync:check`: all six MDX files `unchanged`.
- Re-scan: zero paragraphs across six case studies exceed 2 em-dashes.

### WR-02: Voice banlist test is missing terms listed in VOICE-GUIDE.md

**Files modified:**
- `tests/content/voice-banlist.test.ts`

**Commit:** `6bf41fd`

**Applied fix:** Extended the `BANLIST` array with the four Rule 2 "Don't write" terms — `battle-tested`, `lightning fast`, `highly available`, `next-gen` — each as a case-insensitive word-boundary regex. Added a separate `describe` block asserting that any occurrence of `scalable` is paired with a digit before the next sentence boundary, implementing Rule 1's asymmetric "allowed only when paired with a number" exemption. Factored the frontmatter-stripping into a shared `loadBody(slug)` helper.

**Content impact:** Zero. A pre-edit scan confirmed none of the four new banned terms appear in any of the six case studies (or their upstream `Projects/*.md` sources), so no MDX prose changes were needed. The test serves as the regression floor for future edits.

**Verification:**
- `pnpm test`: all six case studies pass the extended banlist and the scalable numeric-pair rule.
- `pnpm check`: clean.

### WR-03: `readSourceField` regex accepts mismatched quotes

**Files modified:**
- `scripts/sync-projects.mjs`
- `tests/scripts/sync-projects.test.ts`

**Commit:** `c0d674c`

**Applied fix:** Replaced the single regex `/^source:\s*"?([^"\n]+?)"?\s*$/m` — which treated each quote as independently optional — with two anchored alternatives tried in order:

1. Fully quoted: `/^source:\s*"([^"\n]+)"\s*$/m`
2. Fully unquoted: `/^source:\s*([^"\n]+?)\s*$/m`

Because `[^"\n]` excludes the double-quote character from the unquoted variant, inputs with an opening-only or closing-only quote no longer match either pattern and the function returns `null`. Callers now see a clearer "frontmatter missing required `source:` field" error instead of a misleading downstream "source file not found".

Added two regression tests: one for the open-no-close case and one for the close-no-open case. The existing quoted, unquoted, and missing-field tests still pass unchanged.

**Verification:**
- Manual harness confirmed: quoted -> ok, unquoted -> ok, missing -> null, open-no-close -> null, close-no-open -> null, embedded-quote -> null.
- `pnpm test`: 163/163 passing.
- `pnpm check`: clean.
- `pnpm sync:check`: all six MDX files `unchanged` — real frontmatter is well-formed and the tightened parser accepts it.

---

## Per-fix notes and caveats

- **WR-01 content edits were surgical.** Per the project memory note on `project_voice_split.md` and the brief's guidance to avoid restructuring paragraphs, every change was a single-punctuation substitution. No sentences were added, removed, or re-ordered. The upstream `Projects/*.md` files were edited with the same substitutions so the sync contract remains source-of-truth and deterministic.
- **WR-02 does not touch MDX.** The banlist terms were not present in the shipped prose. If a future edit introduces one, the test will red-light CI with the term name.
- **WR-03's error-message change is downstream-visible.** Malformed frontmatter quotes now produce the "frontmatter missing required `source:` field" error path rather than the "source file not found" path. This is an intentional error-quality improvement, not a behaviour change for valid inputs.

---

_Fixed: 2026-04-19T20:52:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
