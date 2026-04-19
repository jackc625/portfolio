# Phase 13: Content Pass + Projects/ Sync — Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 31 (3 created scripts/docs + 1 created CI workflow + 13 created test files + 14 modified content/config/data files)
**Analogs found:** 28 / 31 (3 files have no in-repo analog and rely on RESEARCH.md skeletons instead — see "No Analog Found")

> **Read order for the planner:**
> 1. `## File Classification` — full inventory of new + modified files with role + flow.
> 2. `## Pattern Assignments` — per-file analog excerpts (copy from these).
> 3. `## Shared Patterns` — cross-cutting conventions every plan in Phase 13 must respect.
> 4. `## No Analog Found` — three files where RESEARCH.md skeletons are the source of truth.

---

## File Classification

### Created files (18)

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `scripts/sync-projects.mjs` | build script (Node ESM, hand-rolled parser) | file-I/O + transform | `scripts/pages-compat.mjs` | role-match (both are post-action Node ESM scripts; sync is read+write while pages-compat is copy+write) |
| `docs/CONTENT-SCHEMA.md` | doc (reference/contract) | n/a (doc) | `design-system/MASTER.md` (referenced in CLAUDE.md as "locked visual contract") | role-match (both are authoritative reference docs that code defers to) |
| `docs/VOICE-GUIDE.md` | doc (style guide) | n/a (doc) | `design-system/MASTER.md` | role-match (visual contract ↔ voice contract symmetry) |
| `.github/workflows/sync-check.yml` | CI config | event-driven (PR/push trigger) | none in repo (first GitHub Actions workflow) | **no analog** — see RESEARCH.md §5 |
| `.planning/phases/13-content-pass-projects-sync/13-UAT.md` | manual UAT checklist | n/a (planning doc) | `.planning/phases/12-tech-debt-sweep/12-UAT.md` | exact (same intra-phase artifact type) |
| `tests/scripts/sync-projects.test.ts` | test (unit, fs+parser) | request-response | `tests/client/markdown.test.ts` (pure-function unit shape) | role-match (no fs-touching test exists yet — closest is markdown sanitization which is also pure I/O of strings) |
| `tests/scripts/sync-projects-idempotency.test.ts` | test (unit, idempotency invariant) | request-response | `tests/client/markdown.test.ts` | role-match |
| `tests/scripts/sync-projects-check.test.ts` | test (unit, exit-code mode) | request-response | `tests/client/markdown.test.ts` | role-match |
| `tests/content/case-studies-have-content.test.ts` | test (content collection assertion) | request-response | `tests/client/about-data.test.ts` | exact (both assert exported strings are non-empty) |
| `tests/content/case-studies-shape.test.ts` | test (regex-on-content) | request-response | `tests/client/about-data.test.ts` | role-match (different invariant, same fs+regex shape) |
| `tests/content/case-studies-wordcount.test.ts` | test (word-count invariant) | request-response | `tests/client/about-data.test.ts` | exact (about-data already does word-count assertions) |
| `tests/content/voice-banlist.test.ts` | test (regex banlist) | request-response | `tests/client/about-data.test.ts` | role-match |
| `tests/content/projects-collection.test.ts` | test (Astro `getCollection` integration) | request-response | none — first test that imports from `astro:content` | **no analog** — see RESEARCH.md Wave 0 Gaps |
| `tests/content/resume-asset.test.ts` | test (binary asset existence/size) | file-I/O | `tests/client/contact-data.test.ts` | role-match (both assert a contract about a public asset; contact-data asserts the path string, this asserts the file) |
| `tests/content/source-files-exist.test.ts` | test (frontmatter `source:` integrity) | file-I/O | `tests/client/contact-data.test.ts` | role-match |
| `tests/content/docs-content-schema.test.ts` | test (doc structure regex) | file-I/O | `tests/client/about-data.test.ts` | role-match |
| `tests/content/docs-voice-guide.test.ts` | test (doc structure regex) | file-I/O | `tests/client/about-data.test.ts` | role-match |
| `tests/content/roadmap-amendment.test.ts` | test (regex on .planning/ROADMAP.md) | file-I/O | `tests/client/about-data.test.ts` | role-match |

### Modified files (14)

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `src/content.config.ts` | config (Zod schema) | transform (build-time validation) | itself (one-line addition) | exact |
| `src/content/projects/seatwatch.mdx` | content (MDX case study) | transform (frontmatter + body) | `src/content/projects/seatwatch.mdx` (current file as reference voice) | exact (this IS the canonical voice — D-10) |
| `src/content/projects/nfl-predict.mdx` | content (MDX case study) | transform | `src/content/projects/seatwatch.mdx` | role-match (target = seatwatch shape) |
| `src/content/projects/solsniper.mdx` | content (MDX case study) | transform | `src/content/projects/seatwatch.mdx` | role-match |
| `src/content/projects/optimize-ai.mdx` | content (MDX case study) | transform | `src/content/projects/seatwatch.mdx` | role-match |
| `src/content/projects/clipify.mdx` | content (MDX case study) | transform | `src/content/projects/seatwatch.mdx` | role-match |
| `src/content/projects/crypto-breakout-trader.mdx` → `daytrade.mdx` (rename + rewrite) | content (MDX case study) | transform | `src/content/projects/seatwatch.mdx` | role-match |
| `src/data/about.ts` | data (exported string constants) | transform (annotation comments added) | `src/data/about.ts` itself + `src/data/portfolio-context.json` block-comment style | exact (own pattern; just add `/* Verified: 2026-MM-DD */` adjacent to each export) |
| `src/data/portfolio-context.json` | data (JSON, imported by chat.ts) | transform (3-field patch in 1 block) | `src/data/portfolio-context.json` lines 19–26 (SeatWatch block as canonical shape) | exact (replace lines 51–56 with the same shape) |
| `src/pages/index.astro` | page (Astro homepage) | request-response | itself (verification-only — no behavior change unless old slug appears in inline copy) | exact |
| `package.json` | manifest (npm scripts) | transform | `package.json` lines 9–20 (existing `scripts` block) | exact |
| `.planning/ROADMAP.md` | planning doc | transform (line 69 amendment) | `.planning/ROADMAP.md` line 69 itself | exact |
| `Projects/<n>-<NAME>.md` (×6) | content (Markdown source-of-truth + fence) | file-I/O (sync read source) | `Projects/1 - SEATWATCH.md` (current technical README; fence is added above existing H1+intro) | role-match (no current file has the fence — fence is the new convention) |
| `Projects/6 - DAYTRADE.md` (rename target awareness) | content | file-I/O | itself | exact (file already exists with correct name; just add fence) |

---

## Pattern Assignments

### `scripts/sync-projects.mjs` (build script, file-I/O + transform)

**Analog:** `scripts/pages-compat.mjs` — the only existing in-repo Node ESM build script. Same shape (top-of-file docblock, `node:fs` imports, top-level `await`, `process.exit` on early-return, single-purpose, run via `package.json` script entry).

**Header docblock pattern** (`scripts/pages-compat.mjs` lines 1-15):

```javascript
/**
 * Post-build script: restructure Astro Cloudflare adapter output for Pages.
 *
 * The @astrojs/cloudflare v13 adapter outputs:
 *   dist/client/  — static assets (HTML, CSS, JS)
 *   dist/server/  — worker entry + chunks
 *
 * Cloudflare Pages expects a single output directory with:
 *   _worker.js    — the worker entry (enables SSR)
 *   _routes.json  — tells Pages which routes hit the worker vs static
 *   ...static files
 *
 * This script copies the server worker into dist/client/ so Pages
 * can find it when the build output directory is set to "dist/client".
 */
```

→ **New script's docblock** must follow this exact shape: first line is one-sentence purpose, then the contract (inputs/outputs), then usage examples. RESEARCH.md §3 supplies a ready-to-use replacement (lines 517-532 of RESEARCH).

**Imports pattern** (`scripts/pages-compat.mjs` lines 17-18):

```javascript
import { cpSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
```

→ **New script imports** swap the sync `node:fs` calls for the async `node:fs/promises` API and add `glob` (Node 22 stable). Per RESEARCH.md §3 line 534-536:

```javascript
import { readFile, writeFile, access } from "node:fs/promises";
import { glob } from "node:fs/promises";  // Node 22+ has fs.glob
import { join, basename } from "node:path";
```

**Early-return guard pattern** (`scripts/pages-compat.mjs` lines 23-26):

```javascript
if (!existsSync(SERVER) || !existsSync(CLIENT)) {
  console.log("pages-compat: dist/server or dist/client missing, skipping");
  process.exit(0);
}
```

→ **New script's per-file try/catch** (RESEARCH.md §3 lines 686-690) follows the same one-message-then-exit shape, but uses `process.stderr.write` for errors and reserves `process.exit(2)` for hard failures (vs `pages-compat`'s benign `exit 0` skip).

**Run-from-project-root assumption** (`scripts/pages-compat.mjs` lines 20-21):

```javascript
const CLIENT = join("dist", "client");
const SERVER = join("dist", "server");
```

→ **New script does the same** with `const PROJECT_ROOT = process.cwd();` (RESEARCH.md §3 line 539). Both scripts are launched via `node scripts/<name>.mjs` from project root by `package.json` script entries; this is the established convention.

**Final log line pattern** (`scripts/pages-compat.mjs` line 56):

```javascript
console.log("pages-compat: restructured dist/client/ for Cloudflare Pages");
```

→ **New script's per-file output** matches D-16's `seatwatch.mdx: 847 words (OK)` format. Use `process.stdout.write` (not `console.log`) to control trailing newlines and keep stderr clean.

**Full skeleton:** RESEARCH.md §3 (lines 515-699) — copy verbatim, adjust docblock per new purpose. Patterns 1, 2, 3, 4 from RESEARCH.md §"Architecture Patterns" govern the internal logic.

---

### `docs/CONTENT-SCHEMA.md` (doc, reference/contract)

**Analog:** `design-system/MASTER.md` — the project's existing "locked contract" doc that all visual decisions defer to (per CLAUDE.md `## Conventions`: "Editorial design system contract at `design-system/MASTER.md` — all visual decisions reference this spec"). CONTENT-SCHEMA stands in the same relationship to content/sync as MASTER stands to visual design.

**Pattern to copy from MASTER.md:** the **"code wins, doc is wrong"** disclaimer at the top + **table-driven reference** (field → type → constraint → example) for normative content. RESEARCH.md §6 already supplies the complete skeleton (lines 781-869) including:

- Section 1: Frontmatter Schema table (matches the Zod schema in `src/content.config.ts` line-for-line)
- Section 2: Sync Contract (fence convention, 5-H2 order, 600–900 word target)
- Section 3: Author Workflow (5-step procedure ending in "commit both files together")
- Section 4: Failure-Mode Matrix (every error → where emitted → fix)

**Verbatim opening to use** (RESEARCH.md §6 lines 783-786):

```markdown
# Content Schema

Authoritative reference for the project content pipeline. If anything here
disagrees with `src/content.config.ts` or `scripts/sync-projects.mjs`, code wins
and this doc is wrong; file an issue.
```

This single sentence establishes the same precedence MASTER.md uses (CLAUDE.md says "design-system/MASTER.md is the locked visual contract").

---

### `docs/VOICE-GUIDE.md` (doc, style guide)

**Analog:** `design-system/MASTER.md` for shape; `src/content/projects/seatwatch.mdx` (current file) for the **canonical voice example** (D-10).

**Pattern to copy:** RESEARCH.md §7 (lines 873-953) supplies the full skeleton with the four hard rules from D-11 already laid out as do/don't tables. The skeleton's "Reference: `src/content/projects/seatwatch.mdx` post-Phase 13 rewrite is the canonical example" line is the contract — any rewriter who needs voice guidance reads VOICE-GUIDE.md, then opens seatwatch.mdx.

**Voice excerpts to copy from the canonical seatwatch.mdx** (`src/content/projects/seatwatch.mdx` lines 26-26 — the "named systems" exemplar):

```markdown
High-demand restaurants release reservations at specific times, and the window to book one is measured in seconds. … When fifty users are monitoring simultaneously, the system needs distributed coordination to prevent double-bookings, handle upstream API changes gracefully, and avoid detection by the reservation platform.
```

→ **What VOICE-GUIDE.md showcases:** concrete numbers ("fifty users", "seconds"), named systems ("the dual-strategy booking engine" line 32), past tense for shipped behavior, no banned hype words. Cite this exact paragraph in VOICE-GUIDE.md §"Engineering-Journal Tone" as the reference.

---

### `.github/workflows/sync-check.yml` (CI config, event-driven)

**Analog:** **none in repo.** This is the project's first GitHub Actions workflow (verified: `ls .github/` returns no such directory). Source the entire file from RESEARCH.md §5 (lines 735-770) as-is.

**Critical excerpts to copy verbatim** (RESEARCH.md §5):

```yaml
on:
  pull_request:
    paths:
      - "Projects/**"
      - "src/content/projects/**"
      - "scripts/sync-projects.mjs"
  push:
    branches:
      - main
```

→ **Why path-filter matters:** keeps the workflow off the critical path for unrelated PRs; only runs when sync-relevant files change. RESEARCH.md confirms this matches v1.2 "minimal CI surface" gate.

**Job step pattern** (RESEARCH.md §5):

```yaml
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

→ **Pin to known versions** (`@v4` for both actions, `pnpm version: 10`, `node-version: 22`) per CLAUDE.md tech stack lock. `--frozen-lockfile` honors v1.2 zero-new-deps gate.

**Open question (planner must resolve):** RESEARCH.md §"Open Questions" item 1 — verify `pnpm-lock.yaml` is committed before assuming pnpm in CI. Glob check: `pnpm-lock.yaml` is in the repo root per `ls -la` (verified line: `-rw-r--r-- 1 jackc 197609 225945 Apr 15 14:55 pnpm-lock.yaml`). **Resolved: use pnpm.**

---

### `.planning/phases/13-content-pass-projects-sync/13-UAT.md` (manual UAT checklist)

**Analog:** `.planning/phases/12-tech-debt-sweep/12-UAT.md` — exact intra-phase artifact type. Same orchestrator emits both.

**Frontmatter pattern** (`12-UAT.md` lines 1-13):

```markdown
---
status: complete
phase: 12-tech-debt-sweep
source:
  - 12-01-build-warnings-sweep-SUMMARY.md
  - 12-02-mobilemenu-chatwidget-inert-SUMMARY.md
  - …
started: 2026-04-15T00:00:00Z
updated: 2026-04-15T06:00:00Z
---
```

→ **13-UAT.md frontmatter** follows the same shape; `status: pending` initially, source list = the 13-NN-…-SUMMARY.md files that exist when UAT runs.

**Per-test block pattern** (`12-UAT.md` lines 21-33 — Test 1):

```markdown
### 1. Cold Start Smoke Test
expected: Kill any running dev server. Run `pnpm dev` from clean shell. Server boots without errors/warnings, http://localhost:4321 renders hero+nav+chat bubble, no console errors.
result: fixed
reported: "It boots and renders fine, but first the console throws an error. Read the file LOGS.txt for context."
severity: minor
evidence: |
  LOGS.txt captured: …
fix: |
  Diagnosed in .planning/debug/vite-dep-optimizer-cold-start.md as a …
```

→ **13-UAT.md tests** follow the same `### N. Title / expected: / result: / reported: / severity: / evidence: / fix:` shape. Each test corresponds to one row from RESEARCH.md §"Manual UAT (per D-18)" enumeration:

1. Homepage display hero ("JACK CUTRARA" + lead) — exact copy match
2. Homepage status dot ("AVAILABLE FOR WORK") — exact copy match
3. Homepage meta label ("EST. 2026 · NORTHERN VA") — exact copy match
4. Homepage 3 work-list rows — titles + tech stacks for SeatWatch, NFL Prediction, SolSniper
5. Homepage about strip — `ABOUT_INTRO` + `ABOUT_P1` rendered match
6. About page full narrative — all four exports
7. Each of 6 project detail pages — title, tagline, year, tech stack, body, links
8. Resume PDF page-by-page — content matches Jack's current resume
9. Contact section links — email mailto:, GitHub URL, LinkedIn URL, X null

**Summary block pattern** (`12-UAT.md` lines 68-75):

```markdown
## Summary

total: 5
passed: 2
issues: 1
fixed: 1
pending: 0
skipped: 1
```

→ **13-UAT.md summary** uses the same yaml-in-markdown counter shape.

**Gap log pattern** (`12-UAT.md` lines 77-101): each unmet truth becomes a `- truth: / status: / reason: / severity: / test: / artifacts: / missing: / resolution:` block. Use this verbatim shape for any failed verification.

---

### `tests/scripts/sync-projects.test.ts` (test, unit/parser)

**Analog:** `tests/client/markdown.test.ts` — the closest existing test that exercises pure-function parsing. Same `vitest` import shape, same `describe/it/expect` structure, same per-rule assertion granularity.

**Imports + describe pattern** (`tests/client/markdown.test.ts` lines 1-5):

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../../src/scripts/chat";

describe("Markdown Rendering + XSS Sanitization (D-21, D-25)", () => {
```

→ **New test imports**:

```typescript
import { describe, it, expect } from "vitest";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
// Import internal helpers from sync-projects.mjs (export them or test via subprocess)
```

→ **No `@vitest-environment jsdom` directive** — sync-projects tests are pure node (vitest.config.ts default `environment: "node"` from line 6 already covers this).

**Per-invariant test block pattern** (`tests/client/markdown.test.ts` lines 6-9):

```typescript
  it("renders bold markdown to strong tags", () => {
    const result = renderMarkdown("**bold**");
    expect(result).toContain("<strong>bold</strong>");
  });
```

→ **Replicate this density** for every parser invariant: `it("extracts fenced block from happy-path source", …)`, `it("throws when fence start marker missing", …)`, `it("throws when fence end marker appears twice", …)`, `it("preserves frontmatter byte-for-byte", …)`, `it("normalizes CRLF to LF", …)`. One assertion per `it`.

**Decision required:** sync-projects.mjs needs to **export its parser helpers** (`readSourceField`, `sliceFrontmatter`, `extractFence`, `wordCount`, `checkH2Shape`) so the test file can import them — OR tests must spawn the script as a subprocess. **Recommendation:** export the helpers (named exports), keep `main()` as the only side-effect. This matches RESEARCH.md §3's structure where each helper is already a pure function.

---

### `tests/scripts/sync-projects-idempotency.test.ts` (test, idempotency invariant)

**Analog:** `tests/client/markdown.test.ts` (shape) + RESEARCH.md "Pattern 2: Idempotent Diff-then-Write" for the invariant.

**Test pattern (write your own, but follow this contract):**

```typescript
import { describe, it, expect } from "vitest";
import { readFile, writeFile, mkdtemp, rm, copyFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

describe("sync-projects.mjs idempotency", () => {
  it("running twice in succession produces zero filesystem changes on second run", async () => {
    // 1. Set up a tmp project root with one Projects/*.md + one mdx pointing at it
    // 2. Run sync once — capture mtime of mdx
    // 3. Run sync again — assert mtime unchanged
  });
});
```

→ **Do NOT touch real `src/content/projects/*.mdx`** in the idempotency test. Use `mkdtemp` per RESEARCH.md "Don't Hand-Roll" guidance.

---

### `tests/scripts/sync-projects-check.test.ts` (test, exit-code mode)

**Analog:** `tests/api/chat.test.ts` lines 90-130 — the only existing test that exercises a contract end-to-end via a `ReadableStream` mock. Same idea applies: drive the sync script's main() with controlled inputs and assert on exit code + stderr.

**Subprocess invocation pattern (write your own):**

```typescript
import { execFileSync } from "node:child_process";

describe("sync-projects.mjs --check mode", () => {
  it("exits 0 when no drift", () => {
    // copy Projects/*.md and src/content/projects/*.mdx into tmpdir
    // chdir tmpdir
    // expect(() => execFileSync("node", ["scripts/sync-projects.mjs", "--check"])).not.toThrow();
  });
  it("exits 1 when drift would be produced", () => {
    // mutate the source fence content but NOT the mdx body
    // expect execFileSync to throw with status === 1
  });
});
```

→ **Exit-code semantics from RESEARCH.md §3 line 703:** `0` = success, `1` = drift in --check, `2` = error / hard failure.

---

### `tests/content/case-studies-have-content.test.ts` (test, content collection assertion)

**Analog:** `tests/client/about-data.test.ts` — exact match. Same "exported strings are non-empty" invariant, just applied to MDX bodies instead of about.ts exports.

**Imports + describe pattern** (`tests/client/about-data.test.ts` lines 1-9):

```typescript
import { describe, it, expect } from "vitest";
import {
  ABOUT_INTRO,
  ABOUT_P1,
  ABOUT_P2,
  ABOUT_P3,
} from "../../src/data/about";

describe("About page copy exports (ABOUT-02)", () => {
```

→ **New test reads MDX bodies via fs** (cannot import .mdx in vitest without astro:content runtime). Pattern:

```typescript
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const PROJECTS = ["seatwatch", "nfl-predict", "solsniper", "optimize-ai", "clipify", "daytrade"];

describe("Case-study MDX bodies have real content (CONT-01)", () => {
  for (const slug of PROJECTS) {
    it(`${slug}.mdx body is non-empty after frontmatter`, async () => {
      const raw = await readFile(join("src", "content", "projects", `${slug}.mdx`), "utf8");
      const body = raw.split(/\n---\n/)[1] ?? "";
      expect(body.trim().length).toBeGreaterThan(0);
    });
  }
});
```

**Word-count assertion pattern** (`tests/client/about-data.test.ts` lines 22-25):

```typescript
  it("ABOUT_P1 has 80 words or fewer", () => {
    const wordCount = ABOUT_P1.trim().split(/\s+/).length;
    expect(wordCount).toBeLessThanOrEqual(80);
  });
```

→ **Replicate verbatim** in `case-studies-wordcount.test.ts` with the 600–900 target band per D-16. Use `expect(wordCount).toBeGreaterThanOrEqual(600)` + `expect(wordCount).toBeLessThanOrEqual(900)` — but per D-16 the test is **soft** (warning only). Implement as `console.warn` + `expect(true).toBe(true)` to keep CI green, OR scope the strict assertion to D-16's policy by skipping with `it.skip` past 900.

---

### `tests/content/case-studies-shape.test.ts` (test, regex-on-content)

**Analog:** `tests/client/about-data.test.ts` shape; the regex pattern itself comes from `scripts/sync-projects.mjs` `checkH2Shape()` function (RESEARCH.md §3 lines 619-629).

**Pattern:**

```typescript
const EXPECTED_H2S = [
  "Problem", "Approach & Architecture", "Tradeoffs", "Outcome", "Learnings",
];

describe("Case-study MDX H2 shape (CONT-02 / D-01)", () => {
  for (const slug of PROJECTS) {
    it(`${slug}.mdx has exactly 5 H2s in the locked order`, async () => {
      const raw = await readFile(join("src", "content", "projects", `${slug}.mdx`), "utf8");
      const matches = raw.match(/^## (.+)$/gm) ?? [];
      const actual = matches.map(s => s.slice(3).trim());
      expect(actual).toEqual(EXPECTED_H2S);
    });
  }
});
```

---

### `tests/content/voice-banlist.test.ts` (test, regex banlist)

**Analog:** `tests/client/about-data.test.ts` shape + D-11 Rule 1 banlist (CONTEXT.md decisions).

**Banlist constant** (lift directly from D-11 / VOICE-GUIDE.md §"Rule 1"):

```typescript
const BANLIST = [
  /\brevolutionary\b/i,
  /\bseamless\b/i,
  /\bleverage\b/i,
  /\brobust\b/i,
  /\bdive deeper\b/i,
  /\belevate\b/i,
  /\bsupercharge\b/i,
  // emoji catch-all (BMP supplementary planes)
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
];
```

→ **Note:** "scalable" is conditionally banned (allowed if quantified). Skip from regex banlist; document the exemption in VOICE-GUIDE.md instead. Em-dash limit (D-11 Rule 1 final bullet) is also context-sensitive — skip from regex.

---

### `tests/content/projects-collection.test.ts` (test, Astro getCollection integration)

**Analog:** **none.** No existing test imports from `astro:content`. RESEARCH.md Wave 0 Gap notes this is the first.

**Pattern (write fresh, anchor to Astro 6 docs):**

```typescript
import { describe, it, expect } from "vitest";
import { getCollection } from "astro:content";

describe("Projects content collection (CONT-04)", () => {
  it("contains exactly 6 entries with expected slugs", async () => {
    const projects = await getCollection("projects");
    const slugs = projects.map(p => p.id).sort();
    expect(slugs).toEqual([
      "clipify", "daytrade", "nfl-predict", "optimize-ai", "seatwatch", "solsniper",
    ]);
  });

  it("exactly 3 entries are featured: true (homepage WorkRow count)", async () => {
    const projects = await getCollection("projects");
    const featured = projects.filter(p => p.data.featured);
    expect(featured).toHaveLength(3);
  });
});
```

→ **Risk:** `astro:content` may not resolve in plain vitest without an Astro dev/build env. **Mitigation:** if import fails, fall back to fs-glob-based assertion (read frontmatter via the same hand-rolled regex from sync-projects.mjs).

---

### `tests/content/resume-asset.test.ts` (test, binary asset)

**Analog:** `tests/client/contact-data.test.ts` lines 21-23 — already references `/jack-cutrara-resume.pdf`:

```typescript
  it("resume equals /jack-cutrara-resume.pdf", () => {
    expect(CONTACT.resume).toBe("/jack-cutrara-resume.pdf");
  });
```

→ **New test extends this** to assert the file exists on disk and is reasonable size:

```typescript
import { describe, it, expect } from "vitest";
import { stat } from "node:fs/promises";
import { join } from "node:path";

describe("Resume PDF asset (CONT-04 / D-19)", () => {
  it("public/jack-cutrara-resume.pdf exists", async () => {
    const s = await stat(join("public", "jack-cutrara-resume.pdf"));
    expect(s.isFile()).toBe(true);
  });
  it("is between 10KB and 1MB", async () => {
    const s = await stat(join("public", "jack-cutrara-resume.pdf"));
    expect(s.size).toBeGreaterThan(10 * 1024);
    expect(s.size).toBeLessThan(1 * 1024 * 1024);
  });
});
```

---

### `tests/content/source-files-exist.test.ts` (test, frontmatter source: integrity)

**Analog:** `tests/client/contact-data.test.ts` shape. Reuses the hand-rolled `readSourceField` regex from `sync-projects.mjs` (RESEARCH.md §3 lines 558-561).

**Pattern:** glob `src/content/projects/*.mdx`, parse `source:` field, assert `Projects/<n>-<NAME>.md` exists.

---

### `tests/content/docs-content-schema.test.ts` and `tests/content/docs-voice-guide.test.ts` (tests, doc structure regex)

**Analog:** `tests/client/about-data.test.ts` shape (read file, assert content).

**Pattern:**

```typescript
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";

describe("docs/CONTENT-SCHEMA.md exists with all four sections (CONT-07 / D-17)", () => {
  it("contains all four section headings", async () => {
    const md = await readFile("docs/CONTENT-SCHEMA.md", "utf8");
    expect(md).toMatch(/^## 1\. Frontmatter Schema/m);
    expect(md).toMatch(/^## 2\. Sync Contract/m);
    expect(md).toMatch(/^## 3\. Author Workflow/m);
    expect(md).toMatch(/^## 4\. Failure-Mode Matrix/m);
  });
});
```

→ **Same pattern** for VOICE-GUIDE.md asserting the four hard-rule subsections per D-11.

---

### `tests/content/roadmap-amendment.test.ts` (test, regex on planning doc)

**Analog:** `tests/client/about-data.test.ts` shape.

**Pattern:**

```typescript
describe("ROADMAP.md Phase 13 success criterion #1 reflects D-02 5-H2 amendment", () => {
  it("does NOT mention 'Architecture' as a separate H2 in Phase 13 SC#1", async () => {
    const md = await readFile(".planning/ROADMAP.md", "utf8");
    // grab the Phase 13 block
    const block = md.split(/^### Phase 14:/m)[0].split(/^### Phase 13:/m)[1];
    // SC#1 should mention 5 sections, not 6 — assert "Architecture" appears within "Approach & Architecture" only
    expect(block).toMatch(/Approach & Architecture/);
    expect(block).not.toMatch(/Approach\s+→\s+Architecture/);
  });
});
```

---

### `src/content.config.ts` (config, Zod schema)

**Analog:** itself — single-line addition. Existing schema (lines 7-21):

```typescript
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string().max(80),
      description: z.string(),
      techStack: z.array(z.string()).min(1),
      featured: z.boolean().default(false),
      status: z.enum(["completed", "in-progress"]),
      githubUrl: z.url().optional(),
      demoUrl: z.url().optional(),
      thumbnail: image().optional(),
      category: z.enum(["web-app", "cli-tool", "library", "api", "other"]),
      order: z.number().int().min(1),
      year: z.string().regex(/^\d{4}$/),
    }),
```

→ **Add one line** before the closing `}),`:

```typescript
      source: z.string(), // D-15. File existence validated by sync script, not Zod.
```

→ **Comment style:** match existing schema's comment-free style; the inline comment is justified because D-15 explicitly forbids `.refine(fs.existsSync)` (Pitfall 7). Future contributors need to see why.

---

### `src/content/projects/seatwatch.mdx` (content, MDX case study — canonical voice)

**Analog:** itself (lines 1-22 frontmatter, lines 24-56 body). Structural rewrite required: current body is **4-H2 shape** (Problem / Solution & Approach / Tech Stack Detail / Challenges & Lessons / Results) — see existing file lines 24, 28, 38, 46, 54. Target body is **5-H2 shape** per D-01 (Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings).

**Frontmatter pattern** (`src/content/projects/seatwatch.mdx` lines 1-22):

```yaml
---
title: "SeatWatch"
tagline: "Automated restaurant reservations with dual-strategy booking"
description: "A multi-service SaaS platform that monitors restaurant availability and books reservations automatically, with a dual-strategy booking engine, distributed locking, and browser identity fingerprinting across a Turborepo monorepo."
techStack:
  [
    "TypeScript",
    "React",
    "Express",
    "BullMQ",
    "PostgreSQL",
    "Redis",
    "Prisma",
    "Stripe",
  ]
featured: true
status: "completed"
category: "web-app"
order: 1
year: "2025"
demoUrl: "https://seat.watch"
---
```

→ **Add** `source: "Projects/1 - SEATWATCH.md"` between `year:` and `demoUrl:`. Preserve everything else byte-for-byte (hand-edited multi-line techStack array etc.) per Pattern 1 (RESEARCH.md "Frontmatter-Preserving Body Replacement").

**Body voice exemplar — Problem H2** (current `seatwatch.mdx` line 26):

```markdown
High-demand restaurants release reservations at specific times, and the window to book one is measured in seconds. I wanted to build a system that could monitor availability across multiple users, detect openings the moment they appeared, and execute bookings faster than a person could click through a website. The challenge was not just speed — it was reliability at scale. When fifty users are monitoring simultaneously, the system needs distributed coordination to prevent double-bookings, handle upstream API changes gracefully, and avoid detection by the reservation platform.
```

→ **Match this density and shape** in all 6 case studies: opening sentence sets the constraint, second sets the goal, third surfaces the non-obvious challenge, fourth quantifies scale.

**Body voice exemplar — Approach & Architecture H2** (current `seatwatch.mdx` lines 30-36, currently labeled "Solution & Approach" + "Tech Stack Detail"):

The current file's lines 30-36 + 38-44 must be **merged** into one Approach & Architecture H2 per D-01. Named systems used in the existing prose ("dual-strategy booking engine", "distributed booking locks using Redis SET NX EX", "per-user circuit breaker", "Poisson-distributed stagger offsets") are the gold standard — keep them.

**Body voice exemplar — Tradeoffs H2** (no analog in current file; new section per D-01):

→ **Use the dual-strategy fallback's hidden cost** as the canonical Tradeoff illustration: "The dual-strategy fallback adds latency on the rare paths but…". Pattern from RESEARCH.md §"Code Examples §2" line 484.

**Body voice exemplar — Outcome H2** (current `seatwatch.mdx` line 56, currently labeled "Results"):

```markdown
SeatWatch handles approximately fifty parallel user sessions across three deployed services on Railway. The monitoring system processes thousands of availability checks daily with jittered scheduling that keeps request patterns indistinguishable from organic traffic. The sniping mode lands first-poll attempts within milliseconds of reservation release times. The codebase spans 48,000 lines of TypeScript across 329 files with 90+ test files. The billing system has processed real transactions through all four plan tiers without a race condition or double-charge.
```

→ **This is the canonical "numbers or don't claim it" demonstration** (D-11 Rule 2). Every claim has a number: "fifty parallel user sessions", "48,000 lines", "329 files", "90+ test files", "all four plan tiers", "milliseconds", "thousands of availability checks daily".

**Body voice exemplar — Learnings H2** (current `seatwatch.mdx` lines 48-52 Challenges & Lessons):

```markdown
The hardest problem was the distributed booking lock. … The fix was atomic nonce-checked deletion via a Lua script — a textbook distributed systems problem that I had to encounter firsthand to fully understand.
```

→ **Pattern:** "The hardest problem was X. The first attempt did Y. The fix was Z. The lesson was [what changed in your head]." This shape per D-11 Rule 4 ("Lessons surfaced. Every case study ends on what changed in your head, not what shipped.").

---

### `src/content/projects/{nfl-predict,solsniper,optimize-ai,clipify,daytrade}.mdx` (content, MDX case studies)

**Analog:** post-rewrite `seatwatch.mdx` is the canonical example for all 5 (D-10).

**Per-file process (D-07):**
1. Read `Projects/<n>-<NAME>.md` for source material (technical README).
2. Author 600–900 words of case-study prose **inside** the source file between `<!-- CASE-STUDY-START -->` and `<!-- CASE-STUDY-END -->` markers above the existing H1.
3. Run `pnpm sync:projects` to extract the fence into the MDX body.
4. Add `source:` field to MDX frontmatter (one-time, before first sync).
5. Jack redlines the MDX body or the source fence — sync re-extracts on next run.

**Frontmatter changes per file (read each existing MDX to preserve the rest):**
- `nfl-predict.mdx` — add `source: "Projects/2 - NFL_PREDICT.md"`
- `solsniper.mdx` — add `source: "Projects/3 - SOLSNIPER.md"`
- `optimize-ai.mdx` — add `source: "Projects/4 - OPTIMIZE_AI.md"`
- `clipify.mdx` — add `source: "Projects/5 - CLIPIFY.md"`

---

### `src/content/projects/crypto-breakout-trader.mdx` → `daytrade.mdx` (rename + rewrite)

**Analog:** `seatwatch.mdx` post-rewrite for body; rename mechanics from RESEARCH.md "Runtime State Inventory" lines 375-383.

**Rename mechanics (RESEARCH.md lines 376-383):**
1. `git mv src/content/projects/crypto-breakout-trader.mdx src/content/projects/daytrade.mdx` (preserves history).
2. Edit `daytrade.mdx` frontmatter: `title: "Daytrade"`, new `description:`, add `source: "Projects/6 - DAYTRADE.md"`.
3. Patch `src/data/portfolio-context.json` (next entry).
4. Run `pnpm check` → triggers `astro check` → regenerates `.astro/data-store.json`.
5. Run `pnpm test` → defense-in-depth grep.
6. Run `pnpm build` → confirm `dist/client/projects/daytrade/` exists, `…/crypto-breakout-trader/` does not.
7. **Trigger D-26 Chat Regression Gate** (see "Shared Patterns" below).

---

### `src/data/about.ts` (data, exported strings)

**Analog:** itself — file is 16 lines, simple pattern. Just **add `/* Verified: 2026-MM-DD */` annotations** adjacent to each export per D-18.

**Existing pattern** (`src/data/about.ts` lines 6-7):

```typescript
export const ABOUT_INTRO =
  "I'm Jack \u2014 a junior software engineer who likes building systems that don't break at 3\u00a0a.m.";
```

→ **Annotated form:**

```typescript
/* Verified: 2026-MM-DD */
export const ABOUT_INTRO =
  "I'm Jack \u2014 a junior software engineer who likes building systems that don't break at 3\u00a0a.m.";
```

→ Place comment **above** each `export const`. Use the actual phase-completion date (not the planning date). Git blame on the comment line is the durable evidence per D-18.

**File header comment pattern** (`src/data/about.ts` lines 1-5):

```typescript
/**
 * About page copy -- single source of truth.
 * Consumed by: index.astro (ABOUT_INTRO + ABOUT_P1), about.astro (all four).
 * Text matches mockup.html lines 445-448 verbatim per D-26.
 */
```

→ **Optionally update** the header comment with a "Last verified: 2026-MM-DD" line if Jack wants a single date stamp; the per-export comments are still required by D-18.

---

### `src/data/portfolio-context.json` (data, JSON imported by chat.ts)

**Analog:** `src/data/portfolio-context.json` lines 19-26 — the SeatWatch entry is the canonical block shape.

**Block to replace** (`src/data/portfolio-context.json` lines 51-56):

```json
    {
      "name": "Crypto Breakout Trader",
      "description": "An automated cryptocurrency day-trading system implementing momentum breakout detection on 5-minute candles with composable signal filters, risk-based position sizing, and atomic state persistence.",
      "tech": ["Python", "CCXT", "pandas", "pandas-ta", "Pydantic"],
      "page": "/projects/crypto-breakout-trader"
    }
```

→ **Replacement shape** (match the SeatWatch block format byte-for-byte; preserve the trailing comma if needed by JSON sequence):

```json
    {
      "name": "Daytrade",
      "description": "<NEW description matching daytrade.mdx frontmatter description field>",
      "tech": [<tech list matching daytrade.mdx techStack>],
      "page": "/projects/daytrade"
    }
```

→ **Critical:** the `description` and `tech` fields here MUST stay in lockstep with the MDX frontmatter (Phase 14 CHAT-03 will read both). For Phase 13, copy the new MDX values verbatim.

→ **D-26 trigger:** `src/pages/api/chat.ts` imports this file. Edit triggers Chat Regression Gate (see "Shared Patterns" below).

---

### `src/pages/index.astro` (page, Astro homepage)

**Analog:** itself — verification-only unless old slug appears in inline copy. The page reads from `getCollection("projects")` per `src/pages/projects/[id].astro` lines 8-12 (same `getCollection` pattern):

```typescript
  const allProjects = (await getCollection("projects")).sort(
    (a, b) => a.data.order - b.data.order
  );
```

→ **Action:** read `src/pages/index.astro` for any hardcoded `/projects/crypto-breakout-trader` or `"Crypto Breakout Trader"` strings. If absent (likely — RESEARCH.md grep only flagged portfolio-context.json), no change needed. If present, swap to `/projects/daytrade` / `"Daytrade"`.

---

### `package.json` (manifest, scripts block)

**Analog:** itself — `scripts` block lines 9-20. Existing pattern:

```json
  "scripts": {
    "dev": "astro dev",
    "build": "wrangler types && astro check && astro build && node scripts/pages-compat.mjs",
    "types": "wrangler types",
    "preview": "astro preview",
    "check": "astro check",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "test": "vitest run",
    "astro": "astro"
  },
```

→ **Add two lines** after `"astro"` (per RESEARCH.md §4):

```json
    "astro": "astro",
    "sync:projects": "node scripts/sync-projects.mjs",
    "sync:check": "node scripts/sync-projects.mjs --check"
```

→ **Note:** `astro` line gets a trailing comma. Match existing two-space indent + double-quote style. Do not touch any other field in package.json (zero new deps per v1.2 gate).

---

### `.planning/ROADMAP.md` (planning doc, line 69 amendment)

**Analog:** itself — `.planning/ROADMAP.md` line 69 currently reads:

```
  1. A visitor opening any of the 6 project detail pages reads a real 600–900 word case study structured Problem → Approach → Architecture → Tradeoffs → Outcome → Learnings — no placeholder prose remains
```

→ **Amend to D-02 5-H2 shape**:

```
  1. A visitor opening any of the 6 project detail pages reads a real 600–900 word case study structured Problem → Approach & Architecture → Tradeoffs → Outcome → Learnings — no placeholder prose remains
```

→ **Single change:** `Approach → Architecture` becomes `Approach & Architecture` (one separator removed; same character count − 3). Preserve every other character of the line.

---

### `Projects/<n>-<NAME>.md` (content, source-of-truth + fence) — 6 files

**Analog:** `Projects/1 - SEATWATCH.md` (current file lines 1-7) for the pre-fence opening:

```markdown
# SeatWatch

An automated restaurant reservation platform that monitors a third-party booking system for availability and secures reservations on behalf of its users. The codebase is a production-minded Turborepo monorepo spanning four applications, a shared TypeScript package, 16 database migrations, and 118 test files across unit, integration, and end-to-end suites.

What makes the project technically substantial is not the automation itself, but the engineering required to make it reliable, undetectable, and horizontally scalable: deterministic per-user browser fingerprinting backed by a 26-profile identity pool, …

## Architecture
```

→ **New shape (fence inserted between intro paragraphs and `## Architecture`):**

```markdown
# SeatWatch

<intro paragraphs — KEEP>

<!-- CASE-STUDY-START -->

## Problem

<600–900 words of case-study prose>

## Approach & Architecture

…

## Tradeoffs

…

## Outcome

…

## Learnings

…

<!-- CASE-STUDY-END -->

## Architecture (FULL TECHNICAL REFERENCE)

<existing technical README content — KEEP, possibly relabel H2 to disambiguate from the case-study Approach & Architecture H2>
```

→ **Convention rules (RESEARCH.md §2):**
- Fence MUST appear before any code fence in the file (Pitfall 3 mitigation).
- Both markers each appear exactly once.
- The 5 H2s inside the fence MUST match D-01 order verbatim.

→ **Per-file source files:**
- `Projects/1 - SEATWATCH.md` — case study above existing technical README
- `Projects/2 - NFL_PREDICT.md` — same
- `Projects/3 - SOLSNIPER.md` — same
- `Projects/4 - OPTIMIZE_AI.md` — same
- `Projects/5 - CLIPIFY.md` — same
- `Projects/6 - DAYTRADE.md` — same (file already exists with correct name; just add fence)

---

## Shared Patterns

These cross-cutting concerns apply to multiple plans in Phase 13. Plans should reference this section rather than re-stating the contract.

### S1. Frontmatter-Preserving Byte-Range Slicing

**Source:** RESEARCH.md "Architecture Patterns" — Pattern 1 (lines 271-286).
**Apply to:** every plan that touches `src/content/projects/*.mdx` (rename, frontmatter add, sync run).

**Rule:** Treat MDX frontmatter as an opaque byte range. Never round-trip through a YAML parser. Read `mdx.slice(0, fmEnd)`, write the slice back verbatim.

**Anti-pattern (banned):** `gray-matter`, `yaml.parse → yaml.stringify`, any string→object→string transformation on the frontmatter block.

**Why it's shared:** sync-projects.mjs enforces this; manual frontmatter edits (e.g., adding `source:`) must also preserve byte-for-byte everything else.

---

### S2. CRLF→LF Normalization on Read

**Source:** RESEARCH.md Pitfall 4 (lines 406-410).
**Apply to:** every Node script that reads markdown/MDX/source files (sync-projects.mjs primarily; tests that fs.readFile too).

**Rule:** `content.replace(/\r\n/g, "\n")` immediately after every `await readFile(path, "utf8")`. Write LF unconditionally (default for `\n`-joined strings; never use `\r\n` in code).

**Why it's shared:** Windows authoring environment (per CLAUDE.md `Platform: win32`) means CRLF is a constant background risk. Without this, CI on Linux will see endless churn diffs.

**Recommended addition:** create `.gitattributes` with `* text=auto eol=lf` (RESEARCH.md Open Question 3) — file does not currently exist (verified: `ls .gitattributes` → no such file).

---

### S3. Path Traversal Guard for `source:` Field

**Source:** RESEARCH.md "Security Domain" lines 1101-1107.
**Apply to:** `scripts/sync-projects.mjs` only.

**Rule:** Resolve `source` relative to `process.cwd()`, then verify the absolute path stays inside project root before reading:

```javascript
if (!absSource.startsWith(PROJECT_ROOT + path.sep) && absSource !== PROJECT_ROOT) {
  throw new Error(`${slug}.mdx: source path escapes project root: ${sourcePath}`);
}
```

**Why it's shared:** even though `source:` is author-controlled (no user input), defensive coding here is one line and prevents future accidents (a typo'd `../../node_modules/foo.md` would otherwise read arbitrary files).

---

### S4. D-26 Chat Regression Gate (cross-phase)

**Source:** CONTEXT.md `## Conventions` D-26 reference; RESEARCH.md "Runtime State Inventory" lines 382-384.
**Apply to:** any plan that edits `src/data/portfolio-context.json` (the daytrade rename plan + chat-context patch task).

**Rule:** After any edit to `portfolio-context.json`, the Phase 7 chat regression battery applies. Manual smoke test minimum: chat widget answers `"what did Jack build for Daytrade?"` correctly. Full battery includes the existing `tests/api/chat.test.ts` suite + `tests/api/security.test.ts` + `tests/api/validation.test.ts` (all already exist; just ensure they pass).

**Why it's shared:** `src/pages/api/chat.ts` imports `portfolio-context.json` (verified by RESEARCH.md). Any edit there is a chat surface change, even though chat.ts itself is untouched.

---

### S5. `pnpm check` After Any Content Collection Change

**Source:** RESEARCH.md "Common Pitfalls" Pitfall 1 (lines 388-392) + CLAUDE.md "Established Patterns".
**Apply to:** every plan that edits `src/content.config.ts`, `src/content/projects/*.mdx`, or renames an MDX file.

**Rule:** Run `pnpm check` (which runs `astro check`) immediately after the edit. If `.astro/data-store.json` (~37 KB) caches stale entries, also run `rm -rf .astro/` before re-running. This regenerates the content collection cache.

**Why it's shared:** the rename triggers it; every MDX edit benefits from it; CI runs it via `pnpm build` (line 11 of package.json: `"build": "wrangler types && astro check && astro build && node scripts/pages-compat.mjs"`).

---

### S6. Idempotent Diff-then-Write for Sync

**Source:** RESEARCH.md "Architecture Patterns" Pattern 2 (lines 288-304).
**Apply to:** `scripts/sync-projects.mjs` core loop and any test asserting idempotency.

**Rule:** Compare assembled new content to existing bytes BEFORE calling `writeFile`. Only write if `existing !== newMdx`. `--check` mode shares the same comparison; only the action differs (writeFile vs exit 1).

**Why it's shared:** D-13 (write mode default) + D-14 (CI --check mode) require this; idempotency test (`tests/scripts/sync-projects-idempotency.test.ts`) verifies it.

---

### S7. Test File Layout Convention

**Source:** `vitest.config.ts` line 7 (`include: ["tests/**/*.test.ts"]`) + existing `tests/api/`, `tests/client/` structure.
**Apply to:** all 13 new test files.

**Rule:** Phase 13 introduces two new top-level test directories: `tests/scripts/` (3 files) and `tests/content/` (10 files). Both are picked up by the existing vitest glob — no config change needed.

**Why it's shared:** prevents accidental test config changes; documents the directory expansion explicitly.

---

### S8. v1.2 Zero-New-Deps Gate

**Source:** CLAUDE.md tech-stack lock + RESEARCH.md "Standard Stack" line 127 ("**No `npm install` step required.**").
**Apply to:** every plan; reject any change that adds a runtime or devDep.

**Rule:** `package.json` `dependencies` and `devDependencies` blocks must stay byte-identical to their current state at phase end. The only allowed `package.json` mutation is the two-line `scripts` addition.

**Why it's shared:** part of v1.2 milestone gate; any new dep proposal needs explicit re-discussion (none should arise — RESEARCH.md confirms hand-rolled approaches cover everything).

---

## No Analog Found

These three files have no close in-repo match. Plans should consume the RESEARCH.md skeletons directly:

| File | Role | Data Flow | Reason | Source to Use |
|------|------|-----------|--------|---------------|
| `.github/workflows/sync-check.yml` | CI config | event-driven | First GitHub Actions workflow in repo (`.github/` directory does not exist). | RESEARCH.md §5 (lines 735-770) — full skeleton; copy verbatim, swap pnpm version if `pnpm-lock.yaml` audit (Open Question 1) flips to npm. **Lockfile verified present**, use pnpm. |
| `tests/content/projects-collection.test.ts` | test (Astro `getCollection`) | request-response | No existing test imports from `astro:content`. | Pattern in this PATTERNS.md §"tests/content/projects-collection.test.ts" above; fall back to fs-based glob if `astro:content` import fails in vitest. |
| `tests/scripts/sync-projects-check.test.ts` | test (subprocess execFileSync) | request-response | No existing test spawns Node subprocesses. | Pattern in this PATTERNS.md §"tests/scripts/sync-projects-check.test.ts" above. Vitest 4.1 supports child_process imports cleanly. |

For all three, **lean on RESEARCH.md as the source-of-truth pattern**, not on hallucination. Both PATTERNS.md and RESEARCH.md were authored from the same shipped-code inspection; they agree.

---

## Metadata

**Analog search scope:** `scripts/`, `src/`, `tests/`, `Projects/`, `.planning/phases/12-tech-debt-sweep/`, `docs/` (verified absent), `.github/` (verified absent), root config files (`package.json`, `vitest.config.ts`, `astro.config.mjs`, `eslint.config.mjs`, `wrangler.jsonc`).

**Files scanned:** 28 read in full; 14 read partially (frontmatter + first body sections); directory listings for `scripts/`, `src/`, `tests/api/`, `tests/client/`, `Projects/`, `src/content/projects/`, `.planning/phases/12-tech-debt-sweep/`.

**Pattern extraction date:** 2026-04-16

**Cross-references with RESEARCH.md:**
- §3 Sync script skeleton → S1, S2, S6 shared patterns
- §4 package.json wiring → `package.json` pattern
- §5 GitHub Actions YAML → `.github/workflows/sync-check.yml` (no analog)
- §6 CONTENT-SCHEMA.md skeleton → `docs/CONTENT-SCHEMA.md` pattern
- §7 VOICE-GUIDE.md skeleton → `docs/VOICE-GUIDE.md` pattern
- "Runtime State Inventory" rename checklist → daytrade rename pattern + S4 (D-26 gate)
- "Common Pitfalls" → S2, S3, S5 shared patterns
- "Security Domain" → S3 shared pattern

**Confidence:** HIGH for all in-repo analogs (every excerpt verified against shipped code). MEDIUM for the three "No Analog Found" files (RESEARCH.md skeletons are well-specified but not yet exercised in this codebase).
