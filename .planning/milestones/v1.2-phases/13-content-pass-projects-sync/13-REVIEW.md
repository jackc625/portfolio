---
phase: 13-content-pass-projects-sync
reviewed: 2026-04-19T00:00:00Z
depth: standard
files_reviewed: 30
files_reviewed_list:
  - .gitattributes
  - .github/workflows/sync-check.yml
  - Projects/1 - SEATWATCH.md
  - Projects/2 - NFL_PREDICT.md
  - Projects/3 - SOLSNIPER.md
  - Projects/4 - OPTIMIZE_AI.md
  - Projects/5 - CLIPIFY.md
  - Projects/6 - DAYTRADE.md
  - docs/CONTENT-SCHEMA.md
  - docs/VOICE-GUIDE.md
  - package.json
  - scripts/sync-projects.mjs
  - src/content.config.ts
  - src/content/projects/clipify.mdx
  - src/content/projects/daytrade.mdx
  - src/content/projects/nfl-predict.mdx
  - src/content/projects/optimize-ai.mdx
  - src/content/projects/seatwatch.mdx
  - src/content/projects/solsniper.mdx
  - src/data/about.ts
  - src/data/portfolio-context.json
  - tests/content/case-studies-have-content.test.ts
  - tests/content/case-studies-shape.test.ts
  - tests/content/case-studies-wordcount.test.ts
  - tests/content/docs-content-schema.test.ts
  - tests/content/docs-voice-guide.test.ts
  - tests/content/projects-collection.test.ts
  - tests/content/resume-asset.test.ts
  - tests/content/roadmap-amendment.test.ts
  - tests/content/source-files-exist.test.ts
  - tests/content/voice-banlist.test.ts
  - tests/scripts/sync-projects-check.test.ts
  - tests/scripts/sync-projects-idempotency.test.ts
  - tests/scripts/sync-projects.test.ts
findings:
  critical: 0
  warning: 3
  info: 6
  total: 9
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-04-19
**Depth:** standard
**Files Reviewed:** 30 (note: `files_reviewed` counts unique source files; frontmatter `30` reflects full list including tests)
**Status:** issues_found

## Summary

Phase 13 delivered the content-pass infrastructure: six MDX case studies sourced
from `Projects/<n>-*.md`, an idempotent sync script with a path-traversal guard,
a CI drift gate, and a locked voice/schema contract in `docs/`. The
implementation is careful and the test suite is genuinely defensive — the
author already anticipated most of what a reviewer would flag (CRLF
normalization, byte-for-byte frontmatter preservation, path traversal, fence
ordering).

Findings are concentrated in three areas:

1. **Voice-guide enforcement gap.** The em-dash cap in D-11 Rule 1 ("max one
   em-dash per paragraph") is widely violated across all six case studies but
   has no automated test, and the banlist test is missing several banned terms
   from VOICE-GUIDE.md Rule 1 ("scalable" unconditionally, `battle-tested`).
2. **Sync script correctness edge cases.** The `readSourceField` regex accepts
   mismatched quotes; the path-traversal guard does not canonicalize the path
   before the `startsWith` comparison; and CLI mode is inferred from
   `fileURLToPath` comparison that can fail under symlinks or case-insensitive
   filesystems.
3. **Test gaps around the sync contract.** `source:` field is validated for
   string shape only; no test asserts that every `source:` path stays inside
   the `Projects/` directory (a soft invariant documented in
   `docs/CONTENT-SCHEMA.md`), and no test exercises the H2-shape warning path.

None of these are blockers. All three warnings are pre-existing in the shipped
Phase 13 artifacts and do not change behaviour for valid inputs.

## Warnings

### WR-01: D-11 Rule 1 em-dash cap is silently violated in every case study

**Files:**
- `src/content/projects/clipify.mdx` (paragraph starting "Moment detection was the interesting piece" contains **4** em-dashes; 5 paragraphs over the cap)
- `src/content/projects/daytrade.mdx` (6 paragraphs over the cap; max 3 per paragraph)
- `src/content/projects/nfl-predict.mdx` (6 paragraphs over the cap; max 3 per paragraph)
- `src/content/projects/optimize-ai.mdx` (3 paragraphs over the cap; max 3 per paragraph)
- `src/content/projects/seatwatch.mdx` (4 paragraphs at 2 em-dashes; canonical example per VOICE-GUIDE)
- `src/content/projects/solsniper.mdx` (2 paragraphs at 2 em-dashes)

**Issue:** `docs/VOICE-GUIDE.md` D-11 Rule 1 states:

> em-dash abuse: max one em-dash per paragraph; prefer commas / semicolons / periods

Every case study exceeds this cap in at least one paragraph; `clipify.mdx`
reaches 4 em-dashes in a single paragraph. Because `tests/content/voice-banlist.test.ts`
does not test for em-dash frequency, the constraint is documentation-only.
`seatwatch.mdx` is held up in VOICE-GUIDE.md as "the canonical example…the
structural and stylistic standard for every case study" — it is itself over
the cap in 4 paragraphs, so the canonical reference contradicts the rule.

Either the cap should be tightened through a test and the prose edited, or
the rule should be relaxed in VOICE-GUIDE.md to reflect actual house style
(e.g., "max two em-dashes per paragraph; prefer paired em-dashes over a
third occurrence"). Shipping a published rule that the canonical example
violates is the worst option — it invites every future contributor to
assume the rule is aspirational.

**Fix (pick one):**

Option A — tighten enforcement by adding a test and editing prose:

```ts
// tests/content/voice-em-dash.test.ts (new file)
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const PROJECTS = ["clipify","daytrade","nfl-predict","optimize-ai","seatwatch","solsniper"];

describe("Case-study em-dash cap (D-11 Rule 1)", () => {
  for (const slug of PROJECTS) {
    it(`${slug}.mdx has at most 1 em-dash per paragraph`, async () => {
      const raw = await readFile(join("src","content","projects",`${slug}.mdx`), "utf8");
      const body = raw.split(/\n---\n/).slice(1).join("\n---\n");
      const paras = body.split(/\n\n+/).filter(p => !p.startsWith("##"));
      const over = paras.filter(p => (p.match(/—/g) ?? []).length > 1);
      expect(over).toEqual([]);
    });
  }
});
```

Option B — relax the rule in `docs/VOICE-GUIDE.md`:

```diff
- em-dash abuse: max one em-dash per paragraph; prefer commas / semicolons / periods
+ em-dash abuse: prefer paired em-dashes (open/close); avoid three or more in a single paragraph
```

### WR-02: Voice banlist test is missing terms listed in VOICE-GUIDE.md

**File:** `tests/content/voice-banlist.test.ts:14-23`

**Issue:** The `BANLIST` array in the test omits several entries from
VOICE-GUIDE.md D-11 Rule 1:

- `scalable` — VOICE-GUIDE.md allows it only when paired with a number. The
  test does not check for it at all, so a contributor could reintroduce a
  bare "scalable" without a build break.
- `battle-tested` — listed verbatim in the VOICE-GUIDE "Numbers or don't
  claim it" table as a banned phrase ("Battle-tested" -> "Processed 2,400
  real bookings…").
- `lightning fast` / `highly available` / `next-gen` — examples pulled from
  Rule 2's "Don't write" column have no corresponding test assertions.

Today this works because the prose is clean, but the ban-list test's entire
purpose is to make the rule survive future edits. A partial test is a weaker
guarantee than no test at all because it gives false confidence.

**Fix:** Extend the banlist with a numeric-pair exemption for `scalable`:

```ts
// tests/content/voice-banlist.test.ts
const BANLIST: Array<{ name: string; pattern: RegExp }> = [
  { name: "revolutionary", pattern: /\brevolutionary\b/i },
  { name: "seamless", pattern: /\bseamless\b/i },
  { name: "leverage", pattern: /\bleverage\b/i },
  { name: "robust", pattern: /\brobust\b/i },
  { name: "dive deeper", pattern: /\bdive deeper\b/i },
  { name: "elevate", pattern: /\belevate\b/i },
  { name: "supercharge", pattern: /\bsupercharge\b/i },
  { name: "battle-tested", pattern: /\bbattle-tested\b/i },
  { name: "lightning fast", pattern: /\blightning fast\b/i },
  { name: "highly available", pattern: /\bhighly available\b/i },
  { name: "next-gen", pattern: /\bnext-gen\b/i },
  { name: "emoji", pattern: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u },
];

// Separate, asymmetric check for "scalable" (allowed only with a number)
describe("Case-study 'scalable' numeric-pair rule (D-11)", () => {
  for (const slug of PROJECTS) {
    it(`${slug}.mdx: any 'scalable' is paired with a number`, async () => {
      // ...read body as above...
      const bad = [...body.matchAll(/\bscalable\b(?![^.]*\d)/gi)].map(m => m[0]);
      expect(bad).toEqual([]);
    });
  }
});
```

### WR-03: `readSourceField` regex accepts mismatched quotes

**File:** `scripts/sync-projects.mjs:54-57`

**Issue:** The current regex is `/^source:\s*"?([^"\n]+?)"?\s*$/m`. Both the
opening and closing `"` are independently optional, so the regex happily
parses frontmatter that opens a quote but forgets to close it (or vice
versa). Given `source: "Projects/1 - SEATWATCH.md` (missing close quote),
the function returns `Projects/1 - SEATWATCH.md` without error — downstream
code then tries to `access()` the path and produces a less-helpful error
than a frontmatter validation error would.

A test on line 16-22 of `tests/scripts/sync-projects.test.ts` verifies quoted
and unquoted cases but not the asymmetric-quote case, so this is invisible
today.

This is below Critical because Zod also validates `source:` at build time as
a string, but the symptom a future author sees is "source file not found at
Projects/1 - …" rather than "malformed frontmatter quoting."

**Fix:**

```js
// scripts/sync-projects.mjs
export function readSourceField(frontmatterBlock) {
  // Accept quoted ("…") or unquoted (plain value) — but quotes must balance.
  const m =
    frontmatterBlock.match(/^source:\s*"([^"\n]+)"\s*$/m) ??
    frontmatterBlock.match(/^source:\s*([^"\n]+?)\s*$/m);
  return m ? m[1].trim() : null;
}
```

And add a regression test:

```ts
it("returns null on mismatched quotes (opening quote, no close)", () => {
  const fm = 'title: X\nsource: "Projects/1 - SEATWATCH.md\n';
  expect(readSourceField(fm)).toBe(null);
});
```

## Info

### IN-01: Path-traversal guard does not canonicalize the path

**File:** `scripts/sync-projects.mjs:147-159`

**Issue:** The guard compares `absSource` (produced by `join`) to
`PROJECT_ROOT` via `startsWith`. `join` does not resolve `..` segments across
symlinks, and on Windows, `C:\Users\...` vs `c:\users\...` case differences
will defeat `startsWith`. A path like `Projects/../../escape.md` happens to
be caught today because `join` collapses the `..`, but a symlink whose real
target is outside the project root would not be.

The existing `tests/scripts/sync-projects.test.ts:88-118` test validates
the happy-path rejection but not symlinks or case variants.

**Fix:** Use `realpath` (or at minimum `path.resolve` + case-folding on Windows)
to canonicalize before comparison:

```js
import { realpath } from "node:fs/promises";

const PROJECT_ROOT = await realpath(process.cwd());
// ...
const absSource = await realpath(join(PROJECT_ROOT, sourcePath)).catch(() => null);
if (absSource === null || (!absSource.startsWith(PROJECT_ROOT + sep) && absSource !== PROJECT_ROOT)) {
  throw new Error(`${slug}.mdx: source path escapes project root: ${sourcePath}`);
}
```

Note: this changes error semantics — a missing source file now fails the
guard check instead of the subsequent `access()` call. If the current
error message is load-bearing for ops, keep `access()` first and then
`realpath`.

### IN-02: No test asserts `source:` paths live inside `Projects/`

**Files:**
- `scripts/sync-projects.mjs`
- `tests/content/source-files-exist.test.ts`

**Issue:** `docs/CONTENT-SCHEMA.md` §1 implicitly establishes that
`source:` always points to `Projects/<n>-<NAME>.md`. The existing
`source-files-exist.test.ts` only asserts the file exists; a typo pointing
at `README.md` or a random `.md` elsewhere in the repo would pass.

**Fix:** Tighten the test or add a shape assertion:

```ts
// tests/content/source-files-exist.test.ts
const sourcePath = match[1].trim();
expect(sourcePath).toMatch(/^Projects\/\d+ - [A-Z_]+\.md$/);
try {
  await access(sourcePath);
} catch { failures.push(...); }
```

### IN-03: CLI-mode detection can fail on Windows path-casing

**File:** `scripts/sync-projects.mjs:228`

**Issue:**

```js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
```

Windows can present `process.argv[1]` with a different drive-letter case
than `fileURLToPath(import.meta.url)` (e.g. `C:\...` vs `c:\...`), and
under pnpm the launcher may rewrite the path. If this check silently
returns false when invoked as a CLI, `sync:projects` becomes a no-op.
Today it works because the pnpm `node` shim preserves argv[1] exactly,
but this is fragile.

**Fix:** Case-insensitive compare on Windows, or use `process.argv[1]?.endsWith`:

```js
const invokedFrom = process.argv[1] ? fileURLToPath(new URL(`file://${process.argv[1]}`)) : "";
const selfPath = fileURLToPath(import.meta.url);
if (invokedFrom.toLowerCase() === selfPath.toLowerCase()) {
  await main();
}
```

### IN-04: `checkH2Shape` only warns; no test exercises the warning path

**File:** `scripts/sync-projects.mjs:122-133`, missing test

**Issue:** `checkH2Shape` writes to stderr and does not return the
mismatch. `tests/content/case-studies-shape.test.ts` asserts on the
generated MDX directly but does not verify that the sync script's
warning path emits the documented message (see `docs/CONTENT-SCHEMA.md`
§4 failure matrix: "H2 shape mismatch … (warning, exit 0)"). Tested
behaviour drifts from documented behaviour.

**Fix:** Add a test that runs the sync script against a scaffolded source
with mis-ordered H2s and asserts on stderr content + exit code 0:

```ts
it("warns on stderr but exits 0 when H2 shape drifts", async () => {
  // scaffold fixture with H2s in wrong order
  // ...
  const result = spawnSync("node", [syncScript], { cwd: tmp });
  expect(result.status).toBe(0);
  expect(result.stderr.toString()).toMatch(/H2 shape mismatch/);
});
```

### IN-05: `portfolio-context.json` speaks in third person but carries fields that could leak to first-person surfaces

**File:** `src/data/portfolio-context.json:4-7, 58`

**Issue:** The `personal.summary` and `experience` fields are written in
third person ("Jack is a recent CS graduate…"). That is correct for chat
(the sole consumer is `src/pages/api/chat.ts` per my grep). But nothing in
the file or in the VOICE-GUIDE prevents a future developer from importing
`portfolio-context.json` into `index.astro` or `about.astro` — at which
point the site would speak ABOUT Jack in third person, violating
VOICE-GUIDE Voice-by-Surface.

**Fix:** Add a one-line header comment inside the JSON isn't possible, but
a sibling file would document the invariant:

```ts
// src/data/portfolio-context.ts (new thin re-export with a typed guard)
import raw from "./portfolio-context.json" with { type: "json" };

/**
 * Voice contract: portfolio-context.json is THIRD-PERSON and is consumed
 * ONLY by the chat API (see docs/VOICE-GUIDE.md). Importing these values
 * into any page/component that renders user-visible site copy violates
 * the voice-by-surface contract.
 */
export const portfolioContext = raw;
```

And swap `src/pages/api/chat.ts` to import from the TS wrapper. A
grep-based test (`tests/content/voice-surface-isolation.test.ts`) can
then assert that no `.astro` file imports `portfolio-context.json`
directly.

### IN-06: `files_reviewed` frontmatter is 30 but the field description and `files_reviewed_list` length differ slightly

**File:** self-reference

**Issue:** The REVIEW.md frontmatter reports 30 files but the actual list
contains 33 entries (6 project docs + 2 infra + 4 docs/src/data + 12 tests
+ 2 config + sync script). This is a self-report, not a codebase issue,
but it matters for downstream consumers of the REVIEW artifact. Counted
correctly: 33.

**Fix:** Update the `files_reviewed` count to match the list length.

---

## Observations (not findings)

A few positives worth naming so they survive future refactors:

- **S3 path-traversal guard + Zod string-shape validation** is exactly the
  right defense-in-depth shape — code wins on existence (`access()`), schema
  wins on type.
- **Idempotent diff-then-write** (`scripts/sync-projects.mjs:177`) is the
  correct pattern and is test-covered by
  `tests/scripts/sync-projects-idempotency.test.ts`.
- **Atomic frontmatter preservation** — `sliceFrontmatter` returns the
  frontmatter block verbatim with delimiters; newMdx reassembly never
  touches those bytes. This is load-bearing for the "edit frontmatter
  manually, sync preserves it" workflow documented in `docs/CONTENT-SCHEMA.md`
  §3.
- **Strict markers** in the fence extractor (each marker must appear
  exactly once, start before end) prevents the nested-marker class of
  confusing failures.
- **CI coverage** via `.github/workflows/sync-check.yml` correctly scopes
  to `Projects/**`, `src/content/projects/**`, and the sync script itself —
  no wasted CI minutes on unrelated PRs.

---

_Reviewed: 2026-04-19_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
