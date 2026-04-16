---
phase: 13
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified:
  - scripts/sync-projects.mjs
  - src/content.config.ts
  - package.json
  - .gitattributes
  - .github/workflows/sync-check.yml
autonomous: true
requirements: [CONT-05, CONT-06]
must_haves:
  truths:
    - "scripts/sync-projects.mjs exists, is executable Node ESM, and exports the four helper functions tested in Plan 01"
    - "Running `pnpm sync:projects` from project root extracts each fenced block (when present) and writes the MDX body, preserving frontmatter byte-for-byte"
    - "Running `pnpm sync:check` exits 0 when MDX bodies match source fences and exits 1 when drift is detected"
    - "src/content.config.ts requires `source: z.string()` on every project entry (Zod fails build if absent)"
    - "package.json scripts block contains `sync:projects` and `sync:check` entries; no new dependencies added"
    - ".gitattributes ensures LF line endings repo-wide so CRLF/LF noise cannot poison sync output"
    - ".github/workflows/sync-check.yml runs `pnpm sync:check` on every relevant PR and on push to main"
    - "Sync script enforces the S3 path-traversal guard — source: paths escaping PROJECT_ROOT throw a clear error"
    - "All 5 sync-related tests from Plan 01 (Tasks 1-2) PASS GREEN after this plan"
  artifacts:
    - path: "scripts/sync-projects.mjs"
      provides: "Idempotent sync + --check mode; named exports of readSourceField, sliceFrontmatter, extractFence, wordCount"
      min_lines: 150
    - path: "src/content.config.ts"
      provides: "Extended Zod schema with `source: z.string()` (D-15)"
      contains: "source: z.string()"
    - path: "package.json"
      provides: "scripts.sync:projects and scripts.sync:check entries"
      contains: "\"sync:projects\""
    - path: ".gitattributes"
      provides: "Repo-wide LF normalization (S2)"
      contains: "* text=auto eol=lf"
    - path: ".github/workflows/sync-check.yml"
      provides: "First GitHub Actions workflow; CI drift gate on PRs + push to main"
      contains: "pnpm sync:check"
  key_links:
    - from: "scripts/sync-projects.mjs"
      to: "Projects/<n>-<NAME>.md and src/content/projects/*.mdx"
      via: "Frontmatter source: field → fence extraction → MDX body write"
      pattern: "readFile.*Projects.*indexOf.*CASE-STUDY-START"
    - from: "package.json"
      to: "scripts/sync-projects.mjs"
      via: "scripts.sync:projects = node scripts/sync-projects.mjs"
      pattern: "node scripts/sync-projects\\.mjs"
    - from: ".github/workflows/sync-check.yml"
      to: "pnpm sync:check"
      via: "CI step Verify Projects/ <-> MDX sync is clean"
      pattern: "pnpm sync:check"
---

<objective>
Build the entire sync pipeline infrastructure: the hand-rolled Node ESM sync script, the Zod schema extension, the package.json wiring, the .gitattributes file, and the GitHub Actions CI workflow. Zero new dependencies (runtime or dev).

Purpose: This plan owns CONT-05 (Projects/ as source of truth, enforced by `source:` field) and CONT-06 (sync script + idempotency + --check + Zod). It is the technical foundation that Wave 3 case-study plans depend on.

Output: A working `pnpm sync:projects` and `pnpm sync:check` pair, validated end-to-end against the sync test files from Plan 01. The script handles all error cases per the D-17 §4 failure-mode matrix.
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
@scripts/pages-compat.mjs
@src/content.config.ts
@package.json

<interfaces>
<!-- The sync script's public surface — these helpers MUST be named exports because Plan 01's tests import them. -->

```javascript
// scripts/sync-projects.mjs — public exports (consumed by tests)
export function readSourceField(frontmatterBlock: string): string | null;
export function sliceFrontmatter(mdx: string): { frontmatterBlock: string, body: string };
export function extractFence(sourceContent: string, sourceLabel: string): string;
export function wordCount(body: string): number;
// main() is internal side-effect entry point invoked at module bottom.
```

```javascript
// CLI surface
// node scripts/sync-projects.mjs           → write mode (D-13); exit 0 on success, 2 on hard error
// node scripts/sync-projects.mjs --check   → CI mode (D-14); exit 0 if clean, 1 if drift, 2 on hard error
```

```typescript
// src/content.config.ts — schema after extension
schema: ({ image }) => z.object({
  // ... existing 12 fields (preserve byte-for-byte) ...
  source: z.string(), // D-15: file existence validated by sync script, not Zod (Pitfall 7)
})
```

```yaml
# .github/workflows/sync-check.yml — CI gate
on:
  pull_request:
    paths: ["Projects/**", "src/content/projects/**", "scripts/sync-projects.mjs"]
  push:
    branches: [main]
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Author scripts/sync-projects.mjs from RESEARCH §3 skeleton with named exports</name>
  <files>scripts/sync-projects.mjs</files>
  <read_first>
    - .planning/phases/13-content-pass-projects-sync/13-RESEARCH.md (RESEARCH §3 lines 515-699 — full skeleton; copy verbatim then add named exports + S3 path-traversal guard)
    - scripts/pages-compat.mjs (existing analog; copy header docblock style, import style, run-from-project-root assumption)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (PATTERNS §"scripts/sync-projects.mjs" + Shared Patterns S1, S2, S3, S6 — all four shared patterns this script implements)
    - tests/scripts/sync-projects.test.ts (the contract this script must satisfy — read all `it(...)` names so every assertion has implementation backing)
    - tests/scripts/sync-projects-idempotency.test.ts (idempotency invariant)
    - tests/scripts/sync-projects-check.test.ts (--check exit-code semantics)
    - .planning/phases/13-content-pass-projects-sync/13-CONTEXT.md (D-12, D-13, D-14, D-15, D-16 — script behavior contract)
  </read_first>
  <behavior>
    Implement the script per RESEARCH §3 skeleton with these MUST-HAVES:
    - Named exports: `export function readSourceField`, `export function sliceFrontmatter`, `export function extractFence`, `export function wordCount`. Plus the H2-shape helper `export function checkH2Shape` (so it's testable separately).
    - S1 (frontmatter byte-range): `sliceFrontmatter` returns the frontmatter block as raw bytes; never re-serialize via gray-matter or YAML.
    - S2 (CRLF→LF): `normalize(s) = s.replace(/\r\n/g, "\n")` called immediately after every readFile.
    - S3 (path-traversal guard): after resolving `absSource = join(PROJECT_ROOT, sourcePath)`, verify `absSource.startsWith(PROJECT_ROOT + path.sep) || absSource === PROJECT_ROOT`; throw `Error(`${slug}.mdx: source path escapes project root: ${sourcePath}`)` if not.
    - S6 (idempotent diff-then-write): compare `mdxRaw === newMdx` BEFORE writeFile. In --check mode, the only branch difference is `process.exit(1)` vs `await writeFile(...)`.
    - D-13: default mode = write + leave for human review; exit 0 always (unless error).
    - D-14: `--check` mode (`process.argv.includes("--check")`) = no writes, exit 1 on drift, exit 0 if clean.
    - D-16 (soft word-count): print `${slug}.mdx: ${verb}, ${words} words (${tag})` where tag is "OK" / "under 600" / "exceeds 900". NEVER fail on word-count.
    - Pattern 4 (heading shape lint): print stderr warning if H2 sequence ≠ expected; do NOT fail.
    - Three exit codes: 0 (success), 1 (drift in --check), 2 (error / hard failure).
    - Hand-rolled frontmatter parsing only — zero new deps.
  </behavior>
  <action>
    Create `scripts/sync-projects.mjs`. Start from the verbatim skeleton in RESEARCH.md §3 (lines 515-699). Make these 4 explicit modifications:

    1. **Add `export` to all helper functions.** The skeleton currently declares them as bare `function readSourceField(...)`. Change to `export function readSourceField(...)` for: `readSourceField`, `sliceFrontmatter`, `extractFence`, `wordCount`, `checkH2Shape`. The `normalize` constant and `syncOne` / `main` stay non-exported (internal).

    2. **Add S3 path-traversal guard inside `syncOne`.** After the line `const absSource = join(PROJECT_ROOT, sourcePath);` and BEFORE the `await access(absSource);` call, insert:
    ```javascript
    // S3 / T-13-01: path traversal guard
    const sep = (await import("node:path")).sep;
    if (!absSource.startsWith(PROJECT_ROOT + sep) && absSource !== PROJECT_ROOT) {
      throw new Error(`${slug}.mdx: source path escapes project root: ${sourcePath}`);
    }
    ```
    Note: prefer importing `sep` at the top with `import { join, basename, sep } from "node:path";` to avoid the dynamic import — cleaner. Use that form.

    3. **Replace the bottom-of-file `await main();` with a CLI guard** so tests can import the helpers without triggering main():
    ```javascript
    // Run main only when invoked as CLI, not when imported as a module.
    import { fileURLToPath } from "node:url";
    if (process.argv[1] === fileURLToPath(import.meta.url)) {
      await main();
    }
    ```

    4. **Header docblock** — match scripts/pages-compat.mjs lines 1-15 style (one-sentence purpose first line, then contract paragraph, then usage). Use the exact text from RESEARCH §3 lines 517-532 — it already follows this shape.

    Imports to use (combine cleanly at top):
    ```javascript
    import { readFile, writeFile, access } from "node:fs/promises";
    import { glob } from "node:fs/promises";  // Node 22+ stable
    import { join, basename, sep } from "node:path";
    import { fileURLToPath } from "node:url";
    ```

    Do NOT add any external dependency. Do NOT use gray-matter, js-yaml, or any other parser library (S1, S8).

    After writing, run `pnpm test` and confirm all sync-projects.test.ts cases pass GREEN. If a path-traversal sub-test was a placeholder (`it.todo`) in Plan 01, replace it now with a working assertion.
  </action>
  <acceptance_criteria>
    - File `scripts/sync-projects.mjs` exists.
    - File contains `export function readSourceField` AND `export function sliceFrontmatter` AND `export function extractFence` AND `export function wordCount` (verify: `grep -c "^export function " scripts/sync-projects.mjs` returns ≥ 4).
    - S3 path-traversal guard present: `grep "escapes project root" scripts/sync-projects.mjs` returns ≥ 1 match.
    - S2 CRLF normalization present: `grep "\\\\r\\\\n" scripts/sync-projects.mjs` returns ≥ 1 match (the normalize fn).
    - S6 idempotent comparison present: `grep "mdxRaw === newMdx" scripts/sync-projects.mjs` returns ≥ 1 match (or equivalent equality compare on the assembled string).
    - CLI guard present: `grep "fileURLToPath(import.meta.url)" scripts/sync-projects.mjs` returns ≥ 1 match.
    - File uses `node:fs/promises` glob (Node 22 stable): `grep "from \"node:fs/promises\"" scripts/sync-projects.mjs` returns ≥ 1 match.
    - File does NOT import gray-matter / js-yaml / commander / yargs: `grep -E "gray-matter|js-yaml|commander|yargs" scripts/sync-projects.mjs` returns 0.
    - `pnpm test tests/scripts/sync-projects.test.ts` exits 0 (all parser/extractor/guard tests pass).
    - Three exit codes documented in docblock or comments: `grep -E "exit (0|1|2)|process\\.exit" scripts/sync-projects.mjs` returns ≥ 3.
  </acceptance_criteria>
  <verify>
    <automated>pnpm test tests/scripts/sync-projects.test.ts 2>&1 | tail -30</automated>
  </verify>
  <done>scripts/sync-projects.mjs exists with named helper exports, all 10+ sync-projects.test.ts assertions pass GREEN, S1/S2/S3/S6 patterns visible in code, no new dependencies added.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Extend Zod schema, wire package.json scripts, add .gitattributes</name>
  <files>src/content.config.ts, package.json, .gitattributes</files>
  <read_first>
    - src/content.config.ts (current 12-field schema; one-line addition only)
    - package.json (current scripts block lines 9-20; add 2 entries)
    - .planning/phases/13-content-pass-projects-sync/13-RESEARCH.md (RESEARCH §1 verbatim Zod addition; RESEARCH §4 verbatim package.json addition; RESEARCH "Open Question 3" .gitattributes need)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (PATTERNS §"src/content.config.ts" exact one-line addition; PATTERNS §"package.json" two-line addition; Shared Pattern S2 .gitattributes context, S8 zero-deps gate)
  </read_first>
  <behavior>
    src/content.config.ts: insert exactly one line `source: z.string(),` after the existing `year: z.string().regex(/^\\d{4}$/),` line, with comment `// D-15. File existence validated by sync script, not Zod (Pitfall 7).` Preserve all other lines byte-for-byte.

    package.json: append two new entries to the scripts block AFTER the `"astro": "astro"` entry (the new last entry — add a trailing comma to "astro"):
    ```json
    "sync:projects": "node scripts/sync-projects.mjs",
    "sync:check": "node scripts/sync-projects.mjs --check"
    ```
    Preserve existing scripts byte-for-byte. NO changes to dependencies / devDependencies (S8).

    .gitattributes: create the file at repo root with this single line:
    ```
    * text=auto eol=lf
    ```
    Plus a brief header comment:
    ```
    # Repo-wide LF line endings (S2 — Phase 13). Prevents CRLF/LF churn between Windows authoring + Linux CI.
    ```

    After all three writes, `pnpm check` (which runs `astro check`) MUST PASS — but with a known caveat: every existing MDX file lacks the `source:` field, so Zod will reject all 6. That is the desired RED-state-of-Plan-04 boundary. To keep this plan internally green, run `pnpm check` and confirm the failure is exactly "missing source field" (i.e., the schema is enforcing what we want); document that Plan 04 will close this by adding source: fields. Do not add source: fields here — that is Plan 04's responsibility.
  </behavior>
  <action>
    File 1 — src/content.config.ts: open the file, locate the line `      year: z.string().regex(/^\\d{4}$/),` (line 20). Add immediately after it (becoming the new line 21):
    ```typescript
          source: z.string(), // D-15. File existence validated by sync script, not Zod (Pitfall 7).
    ```
    Verify the closing `}),` of `z.object({...})` is now line 22. Save.

    File 2 — package.json: open the file, locate the scripts block (lines 9-20). Find the line `    "astro": "astro"` (the last entry, no trailing comma). Make two changes in one edit:
    - Add a trailing comma to the "astro" line.
    - Insert two new lines after it (preserve 4-space indent + double-quote style):
    ```json
        "astro": "astro",
        "sync:projects": "node scripts/sync-projects.mjs",
        "sync:check": "node scripts/sync-projects.mjs --check"
    ```
    Confirm `dependencies` and `devDependencies` blocks are byte-identical to the pre-edit state (S8).

    File 3 — .gitattributes: create new file at `C:/Users/jackc/Code/portfolio/.gitattributes` (project root) with content:
    ```
    # Repo-wide LF line endings (S2 — Phase 13). Prevents CRLF/LF churn between Windows authoring + Linux CI.
    * text=auto eol=lf
    ```

    After all three edits, run `pnpm check` to confirm the schema is now enforcing source: (expect: failure for missing source on all 6 MDX files; that is correct).

    Run `node scripts/sync-projects.mjs --check` from project root: expect failure with messages like `<slug>.mdx: frontmatter missing required \`source:\` field` per D-17 §4 failure-mode matrix. This is the correct error shape.
  </action>
  <acceptance_criteria>
    - src/content.config.ts contains exactly one new line `source: z.string()` (verify: `grep -c "source: z.string" src/content.config.ts` returns 1).
    - src/content.config.ts has 13 schema fields total (verify: `grep -cE "^\\s+(title|tagline|description|techStack|featured|status|githubUrl|demoUrl|thumbnail|category|order|year|source):" src/content.config.ts` returns ≥ 13).
    - package.json scripts block contains both new entries (verify: `grep -c "\"sync:projects\"\\|\"sync:check\"" package.json` returns ≥ 2).
    - package.json `dependencies` and `devDependencies` blocks unchanged from pre-plan state (verify: `git diff package.json` shows ONLY the scripts block touched — `git diff package.json | grep -E "^[+-]" | grep -vE "^[+-]{3}|sync:|astro\":" | wc -l` returns 0; only the comma-addition + two new sync lines).
    - .gitattributes exists at project root with `* text=auto eol=lf` line (verify: `grep -c "text=auto eol=lf" .gitattributes` returns 1).
    - `pnpm check` produces an expected schema failure mentioning "source" (verify: `pnpm check 2>&1 | grep -i "source" | wc -l` returns ≥ 1; this is the GREEN signal that Zod is enforcing the new field — Plan 04 will fix the data).
    - `node scripts/sync-projects.mjs --check 2>&1 | grep -i "missing required" | wc -l` returns ≥ 1 (script enforces source: presence).
  </acceptance_criteria>
  <verify>
    <automated>node scripts/sync-projects.mjs --check 2>&1 | grep -ci "missing required\|source" | awk '{ if ($1 >= 1) exit 0; else exit 1 }'</automated>
  </verify>
  <done>Zod schema requires `source:`; package.json wires `sync:projects` and `sync:check`; .gitattributes prevents CRLF noise; no new dependencies added; both Zod and the sync script enforce the missing-source error correctly (Plan 04 closes the data side).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Create .github/workflows/sync-check.yml CI gate</name>
  <files>.github/workflows/sync-check.yml</files>
  <read_first>
    - .planning/phases/13-content-pass-projects-sync/13-RESEARCH.md (RESEARCH §5 lines 735-770 verbatim YAML; "Open Questions" item 1 confirms pnpm-lock.yaml IS committed → use pnpm)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (PATTERNS §".github/workflows/sync-check.yml" — no analog in repo; first GH Actions workflow)
    - .planning/phases/13-content-pass-projects-sync/13-CONTEXT.md (D-14: CI drift gate, exit 1 if diff would be produced)
    - package.json (confirm `sync:check` script entry exists from Task 2)
  </read_first>
  <behavior>
    Create the project's first GitHub Actions workflow. Triggers on PR (path-filtered to sync-relevant files) and push to main. Uses pnpm 10 + Node 22 (matching repo's tech stack). Runs `pnpm sync:check` as the single verification step. Workflow file must be valid YAML (parseable by GitHub Actions schema).

    Security mitigation T-13-03: use `pull_request` event (NOT `pull_request_target`) so untrusted PR fork code cannot abuse repo secrets.
  </behavior>
  <action>
    Create directory `.github/workflows/` (does not exist). Then create `.github/workflows/sync-check.yml` with the EXACT content from RESEARCH.md §5 (verbatim — no modifications):

    ```yaml
    name: Sync Drift Check

    on:
      pull_request:
        paths:
          - "Projects/**"
          - "src/content/projects/**"
          - "scripts/sync-projects.mjs"
      push:
        branches:
          - main

    jobs:
      check:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4

          - name: Setup pnpm
            uses: pnpm/action-setup@v4
            with:
              version: 10

          - name: Setup Node.js
            uses: actions/setup-node@v4
            with:
              node-version: 22
              cache: pnpm

          - name: Install dependencies
            run: pnpm install --frozen-lockfile

          - name: Verify Projects/ <-> MDX sync is clean
            run: pnpm sync:check
    ```

    Confirm:
    - Event is `pull_request` (NOT `pull_request_target`) — T-13-03 mitigation.
    - All actions pinned to `@v4`.
    - pnpm version pinned to `10`.
    - Node version pinned to `22`.
    - `--frozen-lockfile` honors S8 (no opportunistic dep updates).

    Validate YAML is well-formed by parsing locally:
    ```bash
    node -e "const yaml = require('js-yaml'); /* fail */" 2>&1
    ```
    If js-yaml not installed (likely — would violate S8), use a Python one-liner: `python -c "import yaml; yaml.safe_load(open('.github/workflows/sync-check.yml'))"`. If neither available, manual visual inspection vs the RESEARCH §5 reference is sufficient — file is 30 lines.

    Do NOT install any tooling for YAML parsing (S8). Manual diff vs reference is fine.
  </action>
  <acceptance_criteria>
    - File `.github/workflows/sync-check.yml` exists.
    - File contains `pull_request:` (verify: `grep -c "^  pull_request:" .github/workflows/sync-check.yml` returns 1).
    - File does NOT contain `pull_request_target` (verify: `grep -c "pull_request_target" .github/workflows/sync-check.yml` returns 0; T-13-03 mitigation).
    - All actions pinned to @v4 (verify: `grep -E "@v[0-9]+" .github/workflows/sync-check.yml | grep -vc "@v4" | awk '{ if ($1 == 0) exit 0; else exit 1 }'` returns 0 lines that are not @v4).
    - pnpm version pinned to 10 (verify: `grep -c "version: 10" .github/workflows/sync-check.yml` returns ≥ 1).
    - Node version pinned to 22 (verify: `grep -c "node-version: 22" .github/workflows/sync-check.yml` returns ≥ 1).
    - --frozen-lockfile present (verify: `grep -c "frozen-lockfile" .github/workflows/sync-check.yml` returns ≥ 1).
    - The single CI step invokes `pnpm sync:check` (verify: `grep -c "pnpm sync:check" .github/workflows/sync-check.yml` returns ≥ 1).
    - Path filter contains all three required paths (verify: `grep -cE "Projects/\\*\\*|src/content/projects/\\*\\*|scripts/sync-projects\\.mjs" .github/workflows/sync-check.yml` returns ≥ 3).
  </acceptance_criteria>
  <verify>
    <automated>test -f .github/workflows/sync-check.yml && grep -c "pnpm sync:check" .github/workflows/sync-check.yml | awk '{ if ($1 >= 1) exit 0; else exit 1 }'</automated>
  </verify>
  <done>.github/ directory created; first GitHub Actions workflow committed; all version pins match tech stack lock; T-13-03 mitigated via `pull_request` (not `_target`); workflow ready to enforce CI drift gate on next PR.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| filesystem→sync script | Script reads Projects/*.md and src/content/projects/*.mdx; writes only inside src/content/projects/ |
| author→source: field | Authors set source: in MDX frontmatter; script must defensively check the resolved path stays inside PROJECT_ROOT |
| GitHub PR fork→CI workflow | Untrusted PR code could exploit pull_request_target's elevated permissions; we use plain pull_request (no secrets exposure) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-13-01 | Tampering | scripts/sync-projects.mjs reading the path in `source:` field | mitigate | S3 path-traversal guard (Task 1): `if (!absSource.startsWith(PROJECT_ROOT + sep) && absSource !== PROJECT_ROOT) throw …`. Verified by tests/scripts/sync-projects.test.ts Test I. |
| T-13-03 | Tampering | .github/workflows/sync-check.yml | mitigate | Use `on: pull_request:` (NOT `pull_request_target`). Workflow file is on the base branch ref; PR fork code cannot modify it for the CI run. Verified in Task 3 acceptance criteria (`grep -c pull_request_target` returns 0). |
| T-13-02 | Information Disclosure | n/a (no API keys / secrets in this plan) | n/a | Manual review during case-study authoring is the control (RESEARCH §"Security Domain"); deferred. |
</threat_model>

<verification>
After this plan runs:
- All 10+ tests in tests/scripts/sync-projects.test.ts pass GREEN
- tests/scripts/sync-projects-idempotency.test.ts and tests/scripts/sync-projects-check.test.ts pass GREEN
- `pnpm check` correctly enforces the Zod source: requirement (will fail until Plan 04 adds source: to all 6 MDX files — that is the desired contract)
- `pnpm sync:check` correctly identifies the missing source: field and exits non-zero with a clear message
- `.github/workflows/sync-check.yml` is a valid GH Actions workflow that will trigger on the next PR

Verification commands:
```bash
pnpm test tests/scripts/                    # 3 files, all pass
node scripts/sync-projects.mjs --check     # Exits ≠ 0 with clear "missing required source" message (correct RED for Plan 04 boundary)
pnpm check 2>&1 | grep -i source           # Confirms Zod enforcement
ls .github/workflows/sync-check.yml         # File exists
ls .gitattributes                           # File exists
```
</verification>

<success_criteria>
- [ ] scripts/sync-projects.mjs exists with all four named helper exports + path-traversal guard
- [ ] All sync-script tests from Plan 01 are GREEN
- [ ] src/content.config.ts has the new `source: z.string()` field on the projects schema
- [ ] package.json has `sync:projects` and `sync:check` scripts; dependencies/devDependencies unchanged
- [ ] .gitattributes exists at root with LF normalization rule
- [ ] .github/workflows/sync-check.yml exists with the verified-secure trigger and pinned action versions
- [ ] Zero new runtime or dev dependencies added (S8 holds — `git diff package.json` shows only the scripts block changed)
</success_criteria>

<output>
After completion, create `.planning/phases/13-content-pass-projects-sync/13-02-sync-infra-SUMMARY.md` documenting:
- Final sync script LOC count (target ≤ 200)
- Test pass counts (sync-projects.test.ts: N passed; idempotency: N; check: N)
- Confirmation that S1/S2/S3/S6/S8 patterns are in place
- Known-RED state at end of plan: Zod / sync rejects all 6 MDX files (closed by Plan 04)
</output>
