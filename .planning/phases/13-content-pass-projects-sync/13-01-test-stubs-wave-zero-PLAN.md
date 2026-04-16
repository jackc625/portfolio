---
phase: 13
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/scripts/sync-projects.test.ts
  - tests/scripts/sync-projects-idempotency.test.ts
  - tests/scripts/sync-projects-check.test.ts
  - tests/content/case-studies-have-content.test.ts
  - tests/content/case-studies-shape.test.ts
  - tests/content/case-studies-wordcount.test.ts
  - tests/content/voice-banlist.test.ts
  - tests/content/projects-collection.test.ts
  - tests/content/resume-asset.test.ts
  - tests/content/source-files-exist.test.ts
  - tests/content/docs-content-schema.test.ts
  - tests/content/docs-voice-guide.test.ts
  - tests/content/roadmap-amendment.test.ts
autonomous: true
requirements: [CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07]
must_haves:
  truths:
    - "All 13 new test files exist under tests/scripts/ and tests/content/"
    - "Every test file has at least one failing/skipped test that asserts the per-row VALIDATION.md contract"
    - "pnpm test discovers and runs all 13 new test files (vitest glob picks them up without config change)"
  artifacts:
    - path: "tests/scripts/sync-projects.test.ts"
      provides: "RED tests for parser, fence extractor, path-traversal guard (CONT-06)"
    - path: "tests/scripts/sync-projects-idempotency.test.ts"
      provides: "RED test for second-run-zero-write invariant (CONT-06 / S6)"
    - path: "tests/scripts/sync-projects-check.test.ts"
      provides: "RED tests for --check exit-code semantics (CONT-06)"
    - path: "tests/content/case-studies-have-content.test.ts"
      provides: "RED test asserting all 6 MDX bodies non-empty (CONT-01)"
    - path: "tests/content/case-studies-shape.test.ts"
      provides: "RED test asserting 5-H2 D-01 order on all 6 MDX (CONT-02)"
    - path: "tests/content/case-studies-wordcount.test.ts"
      provides: "RED test for 600-900 word soft band (CONT-02)"
    - path: "tests/content/voice-banlist.test.ts"
      provides: "RED test for D-11 banlist regex check (CONT-02)"
    - path: "tests/content/projects-collection.test.ts"
      provides: "RED test for 6-entry collection + 3 featured (CONT-04)"
    - path: "tests/content/resume-asset.test.ts"
      provides: "RED test for public/jack-cutrara-resume.pdf existence + size (CONT-04)"
    - path: "tests/content/source-files-exist.test.ts"
      provides: "RED test for source: field integrity (CONT-05)"
    - path: "tests/content/docs-content-schema.test.ts"
      provides: "RED test for CONTENT-SCHEMA.md four sections (CONT-07)"
    - path: "tests/content/docs-voice-guide.test.ts"
      provides: "RED test for VOICE-GUIDE.md four hard rules (CONT-07)"
    - path: "tests/content/roadmap-amendment.test.ts"
      provides: "RED test for ROADMAP.md 5-H2 amendment (D-02)"
  key_links:
    - from: "vitest.config.ts"
      to: "tests/scripts/*.test.ts and tests/content/*.test.ts"
      via: "include glob: tests/**/*.test.ts (S7)"
      pattern: "tests/(scripts|content)/.+\\.test\\.ts"
---

<objective>
Create the 13 Wave-0 test files that downstream plans must satisfy. Tests start RED for behaviors that do not yet exist (sync script, docs, ROADMAP amendment, case-study rewrites). Tests are written against the exact contracts in 13-VALIDATION.md row-for-row.

Purpose: Wave 0 of the validation strategy. Every CONT-XX requirement maps to at least one of these tests, and every subsequent plan's `<verify>` block points to one of these test files. Without this plan, downstream plans have no automated verification.

Output: 13 new `.test.ts` files following the exact patterns in 13-PATTERNS.md, runnable via `pnpm test`, and producing meaningful RED diagnostic output (not opaque "test failed").
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/13-content-pass-projects-sync/13-CONTEXT.md
@.planning/phases/13-content-pass-projects-sync/13-RESEARCH.md
@.planning/phases/13-content-pass-projects-sync/13-PATTERNS.md
@.planning/phases/13-content-pass-projects-sync/13-VALIDATION.md
@vitest.config.ts
@tests/client/about-data.test.ts
@tests/client/markdown.test.ts
@tests/client/contact-data.test.ts

<interfaces>
<!-- Vitest config (verified: tests/**/*.test.ts glob, environment: node, globals: on). -->
<!-- No config change needed; both new directories tests/scripts/ and tests/content/ are auto-included. -->

From vitest.config.ts:
```typescript
// include: ["tests/**/*.test.ts"]
// environment: "node"
// globals: true
```

Existing pattern from tests/client/about-data.test.ts:
```typescript
import { describe, it, expect } from "vitest";
import { ABOUT_INTRO, ABOUT_P1, ABOUT_P2, ABOUT_P3 } from "../../src/data/about";
describe("About page copy exports (ABOUT-02)", () => { ... });
```

Existing pattern from tests/client/markdown.test.ts (jsdom env directive only when needed):
```typescript
// @vitest-environment jsdom    ← OMIT for our pure-Node tests
import { describe, it, expect } from "vitest";
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create the 3 sync-script test files in tests/scripts/</name>
  <files>tests/scripts/sync-projects.test.ts, tests/scripts/sync-projects-idempotency.test.ts, tests/scripts/sync-projects-check.test.ts</files>
  <read_first>
    - tests/client/markdown.test.ts (closest existing analog for pure-function unit tests; copy the import + describe shape)
    - tests/api/chat.test.ts (only existing test that exercises a contract end-to-end via subprocess-like driving; for the --check test)
    - .planning/phases/13-content-pass-projects-sync/13-RESEARCH.md (RESEARCH §3 lines 515-699 contain the full sync-script skeleton — read so test names match the helper functions you assert against)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (PATTERNS §"tests/scripts/sync-projects.test.ts" and §"tests/scripts/sync-projects-check.test.ts" for exact patterns)
    - .planning/phases/13-content-pass-projects-sync/13-VALIDATION.md (VALIDATION rows for CONT-06 — these are the exact behaviors to assert)
    - vitest.config.ts (confirm environment: node default; no @vitest-environment directive needed)
  </read_first>
  <behavior>
    sync-projects.test.ts (8 RED tests, all importing from "../../scripts/sync-projects.mjs" which does not yet exist):
    - Test A: `readSourceField` returns the unquoted source string from a frontmatter block containing `source: "Projects/1 - SEATWATCH.md"`.
    - Test B: `readSourceField` returns the unquoted source string from a frontmatter block containing `source: Projects/1 - SEATWATCH.md` (no quotes).
    - Test C: `readSourceField` returns null when no `source:` field present.
    - Test D: `sliceFrontmatter` returns `{ frontmatterBlock, body }` correctly given a valid MDX string `---\ntitle: X\n---\n\nbody`.
    - Test E: `sliceFrontmatter` throws with message containing "missing opening frontmatter delimiter" when input does not start with `---\n`.
    - Test F: `sliceFrontmatter` throws with message containing "missing closing frontmatter delimiter" when no second `---` found.
    - Test G: `extractFence` returns trimmed text between `<!-- CASE-STUDY-START -->` and `<!-- CASE-STUDY-END -->`.
    - Test H: `extractFence` throws with message containing "missing &lt;!-- CASE-STUDY-START --&gt;" / "missing &lt;!-- CASE-STUDY-END --&gt;" / "must each appear exactly once" / "appears before" — one assertion per error condition (4 sub-tests).
    - Test I: `extractFence` rejects path-traversal — given a `source:` value resolving outside PROJECT_ROOT (e.g., `../../etc/passwd`), `syncOne` (or whichever helper enforces S3) throws with message containing "escapes project root". This may be a sync-level integration assertion; if helper-level not feasible, mark as integration test using fs-tmp setup.
    - Test J: `wordCount` ignores fenced code blocks (input "hello world ```code stuff```" → 2).

    sync-projects-idempotency.test.ts (1 RED test):
    - Sets up tmpdir with a fixture Projects/sample.md containing fenced block + a fixture src/content/projects/sample.mdx with `source:` pointing to it. Runs sync via execFileSync. Captures mtime. Runs again. Asserts mtime unchanged AND file contents unchanged.

    sync-projects-check.test.ts (2 RED tests):
    - Test A: `--check` exits 0 when source fence content matches MDX body. Uses execFileSync with `["scripts/sync-projects.mjs", "--check"]` against a tmpdir fixture; assert no throw.
    - Test B: `--check` exits 1 when source fence is mutated but MDX is not. Mutates source, runs check, asserts execFileSync throws with status 1.
  </behavior>
  <action>
    Create three files. All use `import { describe, it, expect } from "vitest";` and `import { readFile, writeFile, mkdtemp, rm, copyFile } from "node:fs/promises";` for fs-touching tests. The check test additionally uses `import { execFileSync } from "node:child_process";` and `import { tmpdir } from "node:os";`.

    For sync-projects.test.ts: import helpers from "../../scripts/sync-projects.mjs". This import WILL fail in RED state because the script does not yet exist — that is the desired starting state. Use the exact helper names from RESEARCH §3: `readSourceField`, `sliceFrontmatter`, `extractFence`, `wordCount`. Each `it(...)` gets exactly one `expect(...)` assertion; one behavior per test.

    Path-traversal test (Test I): write the assertion as an integration test driven through the script's `main()` flow OR a direct call to whatever helper the implementer exports for the guard. Acceptable form:
    ```typescript
    it("rejects source: path that escapes project root (S3 guard)", async () => {
      // Set up tmp project root with src/content/projects/bad.mdx
      // whose frontmatter contains: source: "../../escape.md"
      // Run sync; expect throw with message including "escapes project root"
    });
    ```
    If implementing as an integration test is too heavy for the RED state, leave a single `it.todo("...")` placeholder so the contract is recorded — the green-state implementer adds the body.

    For idempotency test: use `mkdtemp(join(tmpdir(), "sync-test-"))` for isolation. NEVER touch real `src/content/projects/`. Cleanup with `rm(tmpDir, { recursive: true, force: true })` in afterEach.

    For check test: same tmpdir pattern. Use `execFileSync("node", ["scripts/sync-projects.mjs", "--check"], { cwd: tmpDir })`. Wrap in try/catch to inspect `.status`.

    Replicate the test density and `describe(...)` naming from tests/client/markdown.test.ts (one describe per concern, each `it` describes one behavior in present tense).
  </action>
  <acceptance_criteria>
    - File `tests/scripts/sync-projects.test.ts` exists.
    - File `tests/scripts/sync-projects-idempotency.test.ts` exists.
    - File `tests/scripts/sync-projects-check.test.ts` exists.
    - All three files contain `import { describe, it, expect } from "vitest";` (verify with grep).
    - sync-projects.test.ts contains at least 10 `it(` invocations (Tests A-J = 10 minimum, Test H has 4 sub-asserts).
    - sync-projects.test.ts references all four helper names: `grep -c "readSourceField\|sliceFrontmatter\|extractFence\|wordCount" tests/scripts/sync-projects.test.ts` returns ≥ 8.
    - sync-projects-idempotency.test.ts uses `mkdtemp` (verify with grep `mkdtemp`).
    - sync-projects-check.test.ts uses `execFileSync` (verify with grep `execFileSync`).
    - Path-traversal test exists in sync-projects.test.ts: `grep -i "escapes project root\|path.*traversal\|S3 guard" tests/scripts/sync-projects.test.ts` returns ≥ 1.
    - `pnpm test 2>&1 | grep -E "tests/scripts/.*\.test\.ts"` shows all 3 files were discovered by vitest.
    - Tests are RED in expected ways (missing-import errors for sync-projects.mjs are acceptable; opaque "no such file" errors are also acceptable RED state).
  </acceptance_criteria>
  <verify>
    <automated>pnpm test 2>&1 | tee /tmp/13-01-task1.log; grep -c "tests/scripts/" /tmp/13-01-task1.log | awk '{ if ($1 >= 3) exit 0; else exit 1 }'</automated>
  </verify>
  <done>Three sync-script test files exist; vitest discovers them; each contains the required test bodies per behavior block; tests are RED in expected ways (script does not exist yet).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Create the 7 content/data test files in tests/content/</name>
  <files>tests/content/case-studies-have-content.test.ts, tests/content/case-studies-shape.test.ts, tests/content/case-studies-wordcount.test.ts, tests/content/voice-banlist.test.ts, tests/content/projects-collection.test.ts, tests/content/resume-asset.test.ts, tests/content/source-files-exist.test.ts</files>
  <read_first>
    - tests/client/about-data.test.ts (exact analog for non-empty + word-count assertions; copy import + describe + assertion shape)
    - tests/client/contact-data.test.ts (exact analog for asset-existence assertions; lines 21-23 reference the resume PDF path)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (PATTERNS §"tests/content/case-studies-*.test.ts" and §"tests/content/projects-collection.test.ts" for exact code patterns to copy)
    - .planning/phases/13-content-pass-projects-sync/13-VALIDATION.md (CONT-01, CONT-02, CONT-04, CONT-05 rows — exact behaviors)
    - .planning/phases/13-content-pass-projects-sync/13-CONTEXT.md (D-01 H2 order, D-11 banlist words, D-16 word band)
    - src/content/projects/seatwatch.mdx (current MDX shape — to understand what RED state will look like; current shape has 4-H2 NOT 5-H2 so case-studies-shape test will be RED)
  </read_first>
  <behavior>
    case-studies-have-content.test.ts: For each of the 6 slugs ["clipify","crypto-breakout-trader","nfl-predict","optimize-ai","seatwatch","solsniper"] (BEFORE rename — Task 4 of Plan 04 renames crypto-breakout-trader to daytrade; this test will be updated implicitly by the rename plan via the slug constant). Use the FINAL post-rename slug list ["clipify","daytrade","nfl-predict","optimize-ai","seatwatch","solsniper"] so test asserts the desired end-state. Initially RED: "daytrade.mdx" does not exist yet → ENOENT. Body must be non-empty (>0 chars after trimming the frontmatter slice).

    case-studies-shape.test.ts: For each of 6 slugs (post-rename list above), assert MDX H2 sequence equals exactly ["Problem","Approach & Architecture","Tradeoffs","Outcome","Learnings"]. Use the regex pattern from PATTERNS.md (`/^## (.+)$/gm`). Initially RED: current MDX bodies have 4 H2s in different order.

    case-studies-wordcount.test.ts: For each of 6 slugs, count whitespace-separated words in body (excluding fenced code blocks per the wordCount helper from RESEARCH §3 line 612). Per D-16 SOFT warning: assert `wordCount >= 600` AND `wordCount <= 900`. If outside band, use `console.warn` and DO NOT fail (D-16 is warn-only). To stay green at phase end, implement as `if (wordCount < 600 || wordCount > 900) { console.warn(`${slug}: ${wordCount} words (out of band)`); } expect(true).toBe(true);` — this preserves the soft contract while keeping CI green per D-16.

    voice-banlist.test.ts: For each of 6 slugs, read MDX body, assert NONE of these regexes match: /\brevolutionary\b/i, /\bseamless\b/i, /\bleverage\b/i, /\brobust\b/i, /\bdive deeper\b/i, /\belevate\b/i, /\bsupercharge\b/i, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u (emoji catch-all). "scalable" is NOT in regex banlist (D-11 carve-out: allowed if quantified — handled in human review).

    projects-collection.test.ts: Try-catch import of `getCollection` from "astro:content"; if it fails (likely in pure vitest), fall back to fs-glob `src/content/projects/*.mdx` and parse frontmatter for `featured:` field. Assert: exactly 6 entries; exactly 3 are featured (the homepage WorkRow count).

    resume-asset.test.ts: stat `public/jack-cutrara-resume.pdf`; assert isFile() && size > 10*1024 && size < 1*1024*1024.

    source-files-exist.test.ts: For each MDX in src/content/projects/, parse frontmatter `source:` field via the same regex `/^source:\s*"?([^"\n]+?)"?\s*$/m`, then `fs.access(absSource)` to verify the referenced Projects/<n>-<NAME>.md file exists. Initially RED: no MDX has source: field yet (Plan 04 adds them).
  </behavior>
  <action>
    Create seven test files. All use `import { describe, it, expect } from "vitest"; import { readFile, stat } from "node:fs/promises"; import { join } from "node:path";` (only what each test needs).

    Use this exact slug constant in all relevant tests (POST-rename, asserting end-state):
    ```typescript
    const PROJECTS = ["clipify", "daytrade", "nfl-predict", "optimize-ai", "seatwatch", "solsniper"];
    ```

    For body extraction, use the same logic as the sync script will:
    ```typescript
    const raw = await readFile(join("src", "content", "projects", `${slug}.mdx`), "utf8");
    const norm = raw.replace(/\r\n/g, "\n");  // CRLF→LF (S2)
    const fmCloseIdx = norm.indexOf("\n---\n", 4);
    const body = fmCloseIdx === -1 ? "" : norm.slice(fmCloseIdx + 5);
    ```

    For case-studies-shape.test.ts use:
    ```typescript
    const EXPECTED_H2S = ["Problem", "Approach & Architecture", "Tradeoffs", "Outcome", "Learnings"];
    const matches = body.match(/^## (.+)$/gm) ?? [];
    const actual = matches.map(s => s.slice(3).trim());
    expect(actual).toEqual(EXPECTED_H2S);
    ```

    For voice-banlist.test.ts use the BANLIST array verbatim from PATTERNS.md §"tests/content/voice-banlist.test.ts" (do not invent additional regexes — D-11 specifies these exact words plus the emoji range).

    For projects-collection.test.ts use the fallback fs-glob pattern (avoid astro:content import complications):
    ```typescript
    import { readdir, readFile } from "node:fs/promises";
    // ...
    const files = (await readdir("src/content/projects")).filter(f => f.endsWith(".mdx"));
    expect(files.length).toBe(6);
    let featured = 0;
    for (const f of files) {
      const raw = await readFile(join("src/content/projects", f), "utf8");
      if (/^featured:\s*true\b/m.test(raw)) featured++;
    }
    expect(featured).toBe(3);
    ```

    Each test is RED in a recognizable way at this point; downstream plans turn each one GREEN.
  </action>
  <acceptance_criteria>
    - All 7 files exist under tests/content/.
    - All 7 contain `import { describe, it, expect } from "vitest";` (verify with grep).
    - case-studies-shape.test.ts contains the literal string `"Approach & Architecture"` (verify: `grep -c "Approach & Architecture" tests/content/case-studies-shape.test.ts` returns ≥ 1).
    - voice-banlist.test.ts contains `revolutionary` AND `seamless` AND `dive deeper` (verify: `grep -c "revolutionary\|seamless\|dive deeper" tests/content/voice-banlist.test.ts` returns ≥ 3).
    - voice-banlist.test.ts does NOT include "scalable" in the regex banlist (verify: `grep -c "/\\\\bscalable\\\\b/i" tests/content/voice-banlist.test.ts` returns 0).
    - resume-asset.test.ts references `public/jack-cutrara-resume.pdf` (verify with grep).
    - case-studies-wordcount.test.ts uses `console.warn` not `expect().toBeLessThan` for the soft band (verify: `grep -c "console.warn" tests/content/case-studies-wordcount.test.ts` returns ≥ 1; D-16 compliance).
    - All files use the literal slug array `["clipify", "daytrade", "nfl-predict", "optimize-ai", "seatwatch", "solsniper"]` where applicable (verify: `grep -l "daytrade" tests/content/*.test.ts` returns at least 4 files).
    - `pnpm test 2>&1 | grep -c "tests/content/.*\.test\.ts"` returns ≥ 7.
  </acceptance_criteria>
  <verify>
    <automated>pnpm test 2>&1 | tee /tmp/13-01-task2.log; grep -c "tests/content/" /tmp/13-01-task2.log | awk '{ if ($1 >= 7) exit 0; else exit 1 }'</automated>
  </verify>
  <done>Seven content/data test files exist; vitest discovers them; each contains the assertions in the behavior block; soft tests (wordcount) compile green even when out of band per D-16.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Create the 3 docs/ROADMAP integrity test files in tests/content/</name>
  <files>tests/content/docs-content-schema.test.ts, tests/content/docs-voice-guide.test.ts, tests/content/roadmap-amendment.test.ts</files>
  <read_first>
    - tests/client/about-data.test.ts (analog shape: read file, assert content via regex)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (PATTERNS §"tests/content/docs-content-schema.test.ts" and §"tests/content/roadmap-amendment.test.ts" for exact patterns)
    - .planning/phases/13-content-pass-projects-sync/13-VALIDATION.md (CONT-07, D-02 cross-cutting rows)
    - .planning/phases/13-content-pass-projects-sync/13-CONTEXT.md (D-17 four sections of CONTENT-SCHEMA, D-11 four hard rules of VOICE-GUIDE, D-02 ROADMAP amendment text)
    - .planning/ROADMAP.md (line 69 — the exact text that must be amended; test asserts the AMENDED state)
  </read_first>
  <behavior>
    docs-content-schema.test.ts: read `docs/CONTENT-SCHEMA.md`. Assert all four required H2 sections present via regex:
    - `/^## 1\. Frontmatter Schema/m`
    - `/^## 2\. Sync Contract/m`
    - `/^## 3\. Author Workflow/m`
    - `/^## 4\. Failure-Mode Matrix/m`
    Plus one additional assertion: file contains the precedence disclaimer (regex /If anything here\s*disagrees/i — matches the "code wins" line from RESEARCH §6).

    docs-voice-guide.test.ts: read `docs/VOICE-GUIDE.md`. Assert all four hard-rule subsections present:
    - `/^### Rule 1: No hype/m`
    - `/^### Rule 2: Numbers or don't claim it/m`
    - `/^### Rule 3: Past tense for shipped work/m`
    - `/^### Rule 4: Named systems over abstractions/m`
    Plus one additional: file references `seatwatch.mdx` as the canonical example (regex /seatwatch\.mdx/).

    roadmap-amendment.test.ts: read `.planning/ROADMAP.md`. Extract the Phase 13 block (between `### Phase 13:` and `### Phase 14:`). Assert:
    - The amended text appears: `/Approach & Architecture/` matches.
    - The OLD text does NOT appear: `/Approach\s*→\s*Architecture/` does NOT match.
    - The success criterion #1 line specifically (the line beginning with "  1.") contains "Approach & Architecture".
  </behavior>
  <action>
    Create three test files following the standard vitest-node pattern:
    ```typescript
    import { describe, it, expect } from "vitest";
    import { readFile } from "node:fs/promises";
    ```

    For docs-content-schema.test.ts, this single test file with three describes:
    ```typescript
    describe("docs/CONTENT-SCHEMA.md exists with required structure (CONT-07 / D-17)", () => {
      it("contains all four section headings", async () => {
        const md = await readFile("docs/CONTENT-SCHEMA.md", "utf8");
        expect(md).toMatch(/^## 1\. Frontmatter Schema/m);
        expect(md).toMatch(/^## 2\. Sync Contract/m);
        expect(md).toMatch(/^## 3\. Author Workflow/m);
        expect(md).toMatch(/^## 4\. Failure-Mode Matrix/m);
      });
      it("includes the code-wins precedence disclaimer", async () => {
        const md = await readFile("docs/CONTENT-SCHEMA.md", "utf8");
        expect(md).toMatch(/If anything here\s*disagrees/i);
      });
    });
    ```

    For docs-voice-guide.test.ts mirror the shape with the four Rule subsections and the seatwatch.mdx canonical-example reference.

    For roadmap-amendment.test.ts use the block-extraction pattern from PATTERNS.md verbatim:
    ```typescript
    const md = await readFile(".planning/ROADMAP.md", "utf8");
    const block = md.split(/^### Phase 14:/m)[0].split(/^### Phase 13:/m)[1] ?? "";
    expect(block).toMatch(/Approach & Architecture/);
    expect(block).not.toMatch(/Approach\s*→\s*Architecture/);
    ```

    These start RED because none of the three files have been amended/created yet (docs/ doesn't exist; ROADMAP.md still has the old wording).
  </action>
  <acceptance_criteria>
    - File `tests/content/docs-content-schema.test.ts` exists.
    - File `tests/content/docs-voice-guide.test.ts` exists.
    - File `tests/content/roadmap-amendment.test.ts` exists.
    - docs-content-schema.test.ts asserts all four section regexes (verify: `grep -c "^## [1-4]\\\\\\\." tests/content/docs-content-schema.test.ts` returns ≥ 4).
    - docs-voice-guide.test.ts asserts all four Rule subsections (verify: `grep -c "Rule [1-4]:" tests/content/docs-voice-guide.test.ts` returns ≥ 4).
    - roadmap-amendment.test.ts contains BOTH the positive assertion (`Approach & Architecture`) and the negative assertion (`not.toMatch.*Architecture`) — verify with grep.
    - `pnpm test 2>&1 | grep -E "tests/content/(docs-|roadmap-)"` shows all 3 files discovered.
  </acceptance_criteria>
  <verify>
    <automated>pnpm test 2>&1 | tee /tmp/13-01-task3.log; grep -cE "tests/content/(docs-|roadmap-)" /tmp/13-01-task3.log | awk '{ if ($1 >= 3) exit 0; else exit 1 }'</automated>
  </verify>
  <done>Three docs/ROADMAP test files exist; vitest discovers them; tests are RED because none of the asserted files/states exist yet.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| filesystem→test runner | Test files read project files via `node:fs/promises`; all reads are inside project root |
| no untrusted input | All assertions are against author-controlled files; no network, no env, no user input |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-13-01 | Tampering | tests/scripts/sync-projects.test.ts (asserts S3 path-traversal guard) | mitigate | Path-traversal test stub (Test I) records the contract before Plan 02 implements it; Plan 02 acceptance criteria require the test to be GREEN |
| T-13-03 | Tampering | n/a (no CI workflow in this plan) | n/a | Plan 02 owns CI workflow; this plan only creates test files |

T-13-02 (sensitive content leak) deferred per RESEARCH §"Security Domain" — manual review during case-study authoring is the control.
</threat_model>

<verification>
After this plan runs, all 13 new test files exist under tests/scripts/ (3 files) and tests/content/ (10 files). Vitest discovers them via the existing glob `tests/**/*.test.ts` (S7). All tests are RED in expected ways (sync script doesn't exist; docs don't exist; ROADMAP is un-amended; case studies are 4-H2 not 5-H2). Subsequent plans turn each one GREEN.

Verification commands:
```bash
ls tests/scripts/*.test.ts   # 3 files
ls tests/content/*.test.ts   # 10 files (extended by this plan)
pnpm test 2>&1 | grep -c "tests/(scripts|content)/" # ≥ 13
```
</verification>

<success_criteria>
- [ ] 13 new `.test.ts` files exist at the documented paths
- [ ] Vitest discovers and runs all 13 files
- [ ] sync-projects.test.ts asserts all four helper names (readSourceField, sliceFrontmatter, extractFence, wordCount) plus path-traversal
- [ ] case-studies-shape.test.ts asserts exact 5-H2 D-01 sequence
- [ ] voice-banlist.test.ts asserts the D-11 banlist (without "scalable")
- [ ] case-studies-wordcount.test.ts is D-16-compliant (warn, don't fail)
- [ ] roadmap-amendment.test.ts has both positive and negative assertions
- [ ] docs tests assert all four required sections per file (CONTENT-SCHEMA = 4 H2s; VOICE-GUIDE = 4 Rule H3s)
- [ ] All test files use POST-rename slug list including "daytrade"
</success_criteria>

<output>
After completion, create `.planning/phases/13-content-pass-projects-sync/13-01-test-stubs-wave-zero-SUMMARY.md` with the standard SUMMARY.md template, including:
- Test file inventory (13 files)
- Initial RED state per file (which assertion is failing and why)
- Map of which downstream plan turns each file GREEN
</output>
