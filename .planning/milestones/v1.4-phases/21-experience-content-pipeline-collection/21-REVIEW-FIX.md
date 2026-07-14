---
phase: 21-experience-content-pipeline-collection
fixed_at: 2026-07-09T11:52:00Z
review_path: .planning/phases/21-experience-content-pipeline-collection/21-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 21: Code Review Fix Report

**Fixed at:** 2026-07-09T11:52:00Z
**Source review:** .planning/phases/21-experience-content-pipeline-collection/21-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9 (5 warning + 4 info; `fix_scope: all`)
- Fixed: 9
- Skipped: 0

## Fixed Issues

### WR-01: Zod validation is never enforced in CI

**Files modified:** `.github/workflows/sync-check.yml`
**Commit:** c70aca8
**Applied fix:** Added two steps to the `check` job — `pnpm types` (`wrangler types`) followed by `pnpm check` (`astro check`). Verified the fix does not land a red gate: ran `npx astro check` against the committed content — **0 errors, 0 warnings, 1 hint**, so all committed `.mdx` frontmatter passes the Zod schema. `wrangler types` is run first because `worker-configuration.d.ts` is gitignored/untracked and `astro check` needs the Cloudflare `Env` bindings (mirrors the ordering in the existing `build` script `wrangler types && astro check`).

### WR-02: `readSourceField` parses YAML with regex and diverges from real YAML

**Files modified:** `scripts/sync-experience.mjs`
**Commit:** 6dfcbbb
**Applied fix:** Added an explicit single-quoted branch to `readSourceField` so `source: 'Experience/X.md'` resolves the same as double-quoted/bare (matching Astro/gray-matter), and tightened the bare branch to exclude both quote characters (`[^"'\n]`) so a stray quote is no longer silently captured into the path. Verified all three quoting styles resolve to `Experience/X.md` and absent returns `null`. **Note:** the reviewer's preferred fix (parse with a real `yaml` parser) was not used because `yaml`/`js-yaml`/`gray-matter` are not resolvable dependencies in this project (only Astro's bundled parser exists); adding a dependency would be out of scope. The reviewer's stated fallback (handle the quoting divergence + document the constraint) was applied instead. Inline-YAML-comment support remains out of scope and is now documented (see IN-03 commit).

### WR-03: Drift glob is single-level but the loader is recursive

**Files modified:** `scripts/sync-experience.mjs`
**Commit:** 3575f98
**Applied fix:** Changed `MDX_GLOB` from `src/content/experience/*.mdx` to `src/content/experience/**/*.mdx` to match the collection loader's `**/*.mdx`. Verified `--check` still finds both real files and exits 0. Added a comment noting slugs may be non-unique across subdirs (acceptable — slug is only a log/error label).

### WR-04: Arbitrary source prose written into `.mdx` with no escaping

**Files modified:** `docs/CONTENT-SCHEMA.md`
**Commit:** 0dcea31
**Applied fix:** Applied reviewer option (b) — documented in §6 that experience bodies must escape/backtick bare `<` and `{` (MDX JSX/expression hazards), with concrete examples. This pairs with WR-01 (option c): the newly-added CI `astro check` step now compiles the collection, so an unescaped hazard fails the PR check instead of only the deploy build. A code-level MDX-compile validation pass (option a) was intentionally not added — it would duplicate what `astro check` in CI now covers and add compiler coupling to the sync script.

### WR-05: Test coverage gap — fixtures use a Zod-invalid enum

**Files modified:** `tests/scripts/sync-experience-check.test.ts`, `tests/scripts/sync-experience-idempotency.test.ts`
**Commit:** acaf5b4
**Applied fix:** Changed both fixtures' `engagementType: "full-time"` → `"contract"` (a valid member of `z.enum(["contract", "internship"])`). Confirmed against the real committed content: `holloway.mdx` uses `"contract"` and `balfour-beatty.mdx` uses `"internship"` — both already valid, so the **schema was left untouched** (not broadened). Added reviewer sub-item (2): a new test that runs `sync:experience:check` against the real repo root and asserts exit 0, guarding the committed files against future drift. All 4 tests in the two files pass. Reviewer sub-item (3) (a Zod round-trip test) was **not** added: `src/content.config.ts` imports `astro:content`/`astro/loaders`, which cannot be imported from a plain vitest context without duplicating the schema — a duplicated schema would itself drift and give false assurance, so it was deliberately omitted.

### IN-01: `normalize` handles CRLF but not lone CR

**Files modified:** `scripts/sync-experience.mjs`
**Commit:** 0261498
**Applied fix:** Changed `s.replace(/\r\n/g, "\n")` to `s.replace(/\r\n?/g, "\n")` so both `\r\n` and lone `\r` collapse to `\n`. Verified `normalize("a\r\nb\rc\n")` === `"a\nb\nc\n"`.

### IN-02: An emptied fence silently wipes the MDX body with no warning

**Files modified:** `scripts/sync-experience.mjs`
**Commit:** c9d11f9
**Applied fix:** Added a non-fatal `stderr` warning `WARN <slug>.mdx: extracted body is empty` in `syncOne` when `extractFence` returns `""`. Exit code behavior unchanged (still 0); real-repo `--check` still exits 0.

### IN-03: Frontmatter metadata authored independently — single-source-of-truth is body-only

**Files modified:** `docs/CONTENT-SCHEMA.md`
**Commit:** 6202cf0
**Applied fix:** Documented in §5 that `summary`, `techStack`, `highlights`, `dateRange`, etc. are hand-authored in frontmatter and are NOT synced or drift-checked, so maintainers must update figures by hand. Also documented the WR-02 `source:` value-syntax constraint (double/single/bare accepted; no inline YAML comment) in the same section.

### IN-04: `sliceFrontmatter` closing-delimiter detection can misfire on a `---` value line

**Files modified:** `docs/CONTENT-SCHEMA.md`
**Commit:** 7dddf43
**Applied fix:** Documented in §6 the "no bare `---` line inside frontmatter" constraint (quote the value as `field: "---"` if needed), since frontmatter slicing uses first-`\n---\n` detection. Chose the documentation option over re-architecting `sliceFrontmatter` around a YAML parser (same unavailable-dependency reason as WR-02).

## Skipped Issues

None — all 9 in-scope findings were fixed.

---

_Fixed: 2026-07-09T11:52:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
