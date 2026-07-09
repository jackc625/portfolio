---
phase: 21-experience-content-pipeline-collection
reviewed: 2026-07-09T11:37:34Z
depth: deep
files_reviewed: 13
files_reviewed_list:
  - .github/workflows/sync-check.yml
  - docs/CONTENT-SCHEMA.md
  - Experience/BALFOUR_BEATTY.md
  - Experience/HOLLOWAY_EXPERIENCE.md
  - scripts/sync-experience.mjs
  - src/content.config.ts
  - src/content/experience/balfour-beatty.mdx
  - src/content/experience/holloway.mdx
  - src/lib/experience.ts
  - tests/content/source-files-exist.test.ts
  - tests/scripts/sync-experience.test.ts
  - tests/scripts/sync-experience-check.test.ts
  - tests/scripts/sync-experience-idempotency.test.ts
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-07-09T11:37:34Z
**Depth:** deep
**Files Reviewed:** 13
**Status:** issues_found

## Summary

I traced the full pipeline end-to-end: `Experience/*.md` source → `scripts/sync-experience.mjs` fence extraction → generated `src/content/experience/*.mdx` → Zod schema in `src/content.config.ts` → `src/lib/experience.ts` consumer → the `.github/workflows/sync-check.yml` drift gate, plus all four test files.

The core mechanics are sound: the fence extractor validates marker presence/count/order, the path-traversal guard correctly contains author-controlled `source:` values (it uses `path.join`, which neutralizes absolute paths, and rejects anything not prefixed by `PROJECT_ROOT + sep`), the diff-then-write idempotency is genuinely idempotent (body is `.trim()`-normalized and trailing newline is fixed), and the `--check` byte comparison catches body drift in both directions. No injectable shell surface, no hardcoded secrets, no true critical defects.

However, deep cross-file analysis surfaced several gaps where the *claimed* guarantees are not actually enforced:

1. **The Zod schema is never run in CI.** `.github/workflows/sync-check.yml` is the only workflow, and it runs only the three `sync:*:check` scripts. `astro check` (the thing that actually validates the Zod schema) is never invoked in CI. So Zod-invalid frontmatter passes every PR check and only fails at the Cloudflare deploy build.
2. **The sync script parses YAML frontmatter with hand-rolled regex** rather than a YAML parser, so it disagrees with how Astro actually parses the same file (single-quoted values, inline comments).
3. **The sync/drift glob is single-level (`*.mdx`) while the collection loader is recursive (`**/*.mdx`)** — a nested MDX file is validated and shipped but never drift-checked.
4. **No escaping** is applied when arbitrary source prose is written into `.mdx`, and the tests never validate a generated file against the real schema (fixtures even use a Zod-invalid enum value).

Details below.

## Warnings

### WR-01: Zod validation is never enforced in CI — the schema guard is absent from the gate

**File:** `.github/workflows/sync-check.yml:41-48` (and by omission, the whole `.github/workflows/` dir — this is the only workflow)
**Issue:** The phase's stated architecture is "generated MDX validated by a Zod schema in `src/content.config.ts`." Zod only runs when `astro check`/`astro build` runs. The CI workflow runs `pnpm sync:check`, `pnpm sync:experience:check`, and `pnpm build:chat-context:check` — none of which invoke `astro check`. `package.json` defines `"check": "astro check"` but nothing in `.github/workflows/` calls it. Consequently a Zod-invalid frontmatter (e.g. a typo'd `engagementType`, a missing required `location`, or `endDate: ""` instead of omitting it — the exact mistakes the schema comments warn about) will pass every PR check and only surface as a failed production deploy build on Cloudflare. The drift gate proves body↔source parity but proves nothing about schema validity.
**Fix:** Add a step to the `check` job (or a separate workflow triggered on `src/content/**` and `src/content.config.ts`):
```yaml
      - name: Type-check content collections (Zod)
        run: pnpm check
```
This makes the schema an actual pre-merge gate rather than a deploy-time surprise.

### WR-02: `readSourceField` parses YAML with regex and diverges from real YAML parsing

**File:** `scripts/sync-experience.mjs:52-57`
**Issue:** `source:` is read via two regexes that only understand a bare value or a double-quoted value. Astro/gray-matter parse the same frontmatter as real YAML. The two disagree on valid YAML:
- `source: 'Experience/HOLLOWAY_EXPERIENCE.md'` (single-quoted — valid YAML) → the unquoted branch `([^"\n]+?)` captures the literal string *including the single quotes*, yielding path `'Experience/HOLLOWAY_EXPERIENCE.md'`, which fails with a misleading `source file not found`. Astro would read it correctly.
- `source: Experience/X.md # note` (inline YAML comment) → captured as `Experience/X.md # note` → "not found".

So a file Astro accepts can make the sync/drift gate hard-fail (exit 2), and the error message points at the wrong cause. The current two `.mdx` files use double quotes so it works today, but the parser divergence is a latent trap.
**Fix:** Parse frontmatter with a real YAML parser (Astro already depends on one) instead of regex, e.g. read the `source` key from `yaml.parse(frontmatterBlock.replace(/^---\n|\n---\n$/g, ""))`. If keeping regex, at minimum document "double-quoted or bare only" as a hard constraint and reject single-quoted values with a clear message rather than a "not found".

### WR-03: Drift glob is single-level but the collection loader is recursive — nested MDX bypasses the gate

**File:** `scripts/sync-experience.mjs:30` (`MDX_GLOB = "src/content/experience/*.mdx"`) vs `src/content.config.ts:26` (`pattern: "**/*.mdx"`)
**Issue:** The sync script only walks `src/content/experience/*.mdx` (one level). The Astro collection loader walks `**/*.mdx` (recursive). A file at `src/content/experience/archive/old-role.mdx` would be loaded into the collection, Zod-validated, and rendered on the site, but would **never be synced or drift-checked** — its body could silently diverge from its `source:` forever, defeating the entire single-source-of-truth guarantee for that entry. The same latent mismatch exists in the projects pipeline (`sync-projects.mjs`) but is out of scope here.
**Fix:** Make the sync glob recursive to match the loader:
```js
const MDX_GLOB = "src/content/experience/**/*.mdx";
```
Note that `basename(mdxPath, ".mdx")` for the slug is then non-unique across subdirs — acceptable since slug is only used for log/error labels, not for resolution.

### WR-04: Arbitrary source prose is written into `.mdx` with no escaping — a stray `<` or `{` breaks the build

**File:** `scripts/sync-experience.mjs:143-146`
**Issue:** `newBody` is the raw fenced source text, dropped verbatim into an `.mdx` file. MDX interprets `{...}` as JS expressions and `<Word>` as JSX. The current Holloway/Balfour bodies happen to keep every hazardous token inside backticks (`["jobs"]`, `asServiceRole`), so they build. But the pipeline advertises "freeform bodies — any content" (D-07) and provides zero protection: a future edit adding, say, `if (n < 3)` or `use the {config} object` *outside* backticks will produce a generated `.mdx` that fails `astro build` with an opaque MDX compiler error, and — because WR-01 means Zod/MDX compilation isn't in CI — it won't be caught until deploy. This is a robustness/build-safety defect (source is author-controlled, so not a security issue).
**Fix:** Either (a) add a validation pass in the sync script that MDX-compiles the generated body and warns/fails on error, or (b) document in `docs/CONTENT-SCHEMA.md §6` that experience bodies must escape bare `<` and `{` (currently the freeform section makes no mention of MDX hazards), or (c) run `astro check` in CI (WR-01) so at least the failure is caught pre-merge.

### WR-05: Test coverage gap — no test validates a generated MDX against the real schema, and fixtures use a Zod-invalid enum

**File:** `tests/scripts/sync-experience-check.test.ts:56`, `tests/scripts/sync-experience-idempotency.test.ts:66`
**Issue:** Both fixtures write `engagementType: "full-time"`, which is **not** a member of `z.enum(["contract", "internship"])` in `src/content.config.ts:37`. The tests pass only because the sync script never validates against Zod — which precisely illustrates the WR-01 blind spot: the pipeline is exercised end-to-end *without* the schema ever being applied. Missing coverage overall:
- No test asserts the two committed real files (`balfour-beatty.mdx`, `holloway.mdx`) are actually in sync with their sources (the drift tests use synthetic fixtures only).
- No test covers `syncOne`'s "missing `source:` field" (exit 2) or "source file not found" (exit 2) branches, or the *allow* side of the path guard (only rejection is tested).
- No test feeds generated frontmatter through the Zod schema.
**Fix:** (1) Change fixtures to a valid `engagementType` (`"contract"` or `"internship"`) so they don't encode an invalid schema state. (2) Add a test that runs `sync:experience:check` against the real repo root and asserts exit 0 (guards the committed files). (3) Add a Zod round-trip test importing the `experience` schema and parsing a representative frontmatter object.

## Info

### IN-01: `normalize` handles CRLF but not lone CR

**File:** `scripts/sync-experience.mjs:37`
**Issue:** `s.replace(/\r\n/g, "\n")` leaves classic-Mac lone `\r` line endings intact, which would then be embedded in the MDX body and could defeat the idempotent byte comparison on an odd editor. Extremely rare in practice.
**Fix:** `s.replace(/\r\n?/g, "\n")` to collapse both `\r\n` and lone `\r`.

### IN-02: An emptied fence silently wipes the MDX body with no warning

**File:** `scripts/sync-experience.mjs:143-158`
**Issue:** If an author deletes everything between the markers, `extractFence` returns `""` (valid — markers still present and ordered), and write mode replaces the body with an empty string with no warning. The projects pipeline at least emits a word-count warning; the experience pipeline deliberately removed length checks (D-07), so accidental full-content deletion is indistinguishable from an intentional empty body. Low likelihood but silent.
**Fix:** Emit a `stderr` warning (non-fatal, exit 0) when the extracted body is empty, e.g. `WARN <slug>.mdx: extracted body is empty`.

### IN-03: Frontmatter metadata is authored independently of the source prose — "single source of truth" is body-only

**File:** `src/content/experience/holloway.mdx:19-26` vs `Experience/HOLLOWAY_EXPERIENCE.md:18-44`
**Issue:** `summary`, `techStack`, and `highlights` are hand-authored in the MDX frontmatter and are **not** derived from or checked against the source `.md`. The same facts appear in prose in both files (e.g. "0 → ~1,400 checks", "223 → 1"), but nothing keeps the frontmatter numbers in step with the case-study body. The pipeline's single-source-of-truth guarantee covers only the body; frontmatter can silently drift from the prose it summarizes. This is a documented design choice (D-10 / A1), noted for maintainers.
**Fix:** Document explicitly in `docs/CONTENT-SCHEMA.md §5` that frontmatter metadata is independently authored and NOT synced, so future maintainers don't assume the drift gate covers it.

### IN-04: `sliceFrontmatter` closing-delimiter detection can misfire on a `---` value line

**File:** `scripts/sync-experience.mjs:64-77`
**Issue:** The frontmatter close is found via the first `\n---\n` after index 4. A frontmatter that legitimately contains a line whose value is exactly `---` (e.g. a YAML block scalar) would be truncated early, splitting mid-frontmatter. Not reachable with the current simple frontmatter, but the heuristic is fragile versus real YAML parsing (see WR-02).
**Fix:** Tie frontmatter slicing to the same YAML-aware parse recommended in WR-02, or document the "no bare `---` line inside frontmatter" constraint.

---

_Reviewed: 2026-07-09T11:37:34Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
