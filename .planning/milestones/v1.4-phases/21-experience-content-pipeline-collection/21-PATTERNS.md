# Phase 21: Experience Content Pipeline & Collection - Pattern Map

**Mapped:** 2026-07-08
**Files analyzed:** 9 (5 new, 4 modified)
**Analogs found:** 9 / 9 (100% — deliberate verbatim mirror of the projects pipeline)

> This phase is a near-verbatim replication of the in-repo **projects** pipeline. Every excerpt below is pulled from CURRENT source so the planner references real code, not assumptions. Where D-07 mandates deletion (H2/word-count), the deletable lines are called out explicitly.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/sync-experience.mjs` (NEW) | script / CLI | file-I/O transform | `scripts/sync-projects.mjs` | exact (verbatim-lift) |
| `src/content.config.ts` (MODIFY) | config | schema/validation | its own `projects` collection block | exact (self-extend) |
| `src/content/experience/holloway.mdx` (NEW) | content | data (frontmatter+body) | `src/content/projects/seatwatch.mdx` | exact |
| `src/content/experience/balfour-beatty.mdx` (NEW) | content | data | `src/content/projects/seatwatch.mdx` | exact |
| `Experience/HOLLOWAY_EXPERIENCE.md` (MODIFY) | content source | fenced prose source | `Projects/1 - SEATWATCH.md` | exact |
| `Experience/BALFOUR_BEATTY.md` (NEW) | content source | fenced prose source | `Projects/1 - SEATWATCH.md` | exact |
| `.github/workflows/sync-check.yml` (MODIFY) | CI config | drift gate | its own projects verify step | exact (self-extend) |
| `tests/scripts/sync-experience.test.ts` (NEW) | test | unit + integration | `tests/scripts/sync-projects.test.ts` | exact |
| `tests/scripts/sync-experience-check.test.ts` (NEW) | test | integration | `tests/scripts/sync-projects-check.test.ts` | exact |
| `package.json` scripts (MODIFY) | config | — | `sync:projects` / `sync:check` lines | exact |
| `docs/CONTENT-SCHEMA.md` (MODIFY) | docs | — | its existing projects section | exact |

## Pattern Assignments

### `scripts/sync-experience.mjs` (script, file-I/O transform)

**Analog:** `scripts/sync-projects.mjs`

**Imports + constants block** (lines 26–43) — LIFT lines 26–34 verbatim; **DELETE** lines 35–43 (`EXPECTED_H2S`, `WORD_TARGET_MIN`, `WORD_TARGET_MAX`); change `MDX_GLOB` to experience path:
```javascript
import { readFile, writeFile, access, glob } from "node:fs/promises";
import { join, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";

const CHECK_MODE = process.argv.includes("--check");
const PROJECT_ROOT = process.cwd();
const MDX_GLOB = "src/content/experience/*.mdx";   // <-- ONLY glob change (was src/content/projects/*.mdx)
const FENCE_START = "<!-- CASE-STUDY-START -->";     // <-- reused verbatim (D-08)
const FENCE_END = "<!-- CASE-STUDY-END -->";
// DELETE per D-07: EXPECTED_H2S (35-41), WORD_TARGET_MIN (42), WORD_TARGET_MAX (43)
```

**`normalize` — LIFT VERBATIM** (line 48):
```javascript
const normalize = (s) => s.replace(/\r\n/g, "\n");
```

**`readSourceField` — LIFT VERBATIM** (lines 63–68). Handles quoted/unquoted `source:` and mismatched-quote rejection:
```javascript
export function readSourceField(frontmatterBlock) {
  const m =
    frontmatterBlock.match(/^source:\s*"([^"\n]+)"\s*$/m) ??
    frontmatterBlock.match(/^source:\s*([^"\n]+?)\s*$/m);
  return m ? m[1].trim() : null;
}
```
Note: analog does NOT `export` `normalize` (const, line 48). For experience, **add `export`** to `normalize` so the test file can import it (research §Wave 0 lists `normalize` among imported pure fns).

**`sliceFrontmatter` — LIFT VERBATIM** (lines 75–88):
```javascript
export function sliceFrontmatter(mdx) {
  if (!mdx.startsWith("---\n")) throw new Error("MDX missing opening frontmatter delimiter");
  const closeIdx = mdx.indexOf("\n---\n", 4);
  if (closeIdx === -1) throw new Error("MDX missing closing frontmatter delimiter");
  const fmEnd = closeIdx + 5; // include "\n---\n"
  return { frontmatterBlock: mdx.slice(0, fmEnd), body: mdx.slice(fmEnd) };
}
```

**`extractFence` — LIFT VERBATIM** (lines 98–119). Handles missing/duplicate/out-of-order markers:
```javascript
export function extractFence(sourceContent, sourceLabel) {
  const prefix = sourceLabel ? `${sourceLabel}: ` : "";
  const startCount = sourceContent.split(FENCE_START).length - 1;
  const endCount = sourceContent.split(FENCE_END).length - 1;
  if (startCount === 0) throw new Error(`${prefix}missing ${FENCE_START}`);
  if (endCount === 0) throw new Error(`${prefix}missing ${FENCE_END}`);
  if (startCount > 1 || endCount > 1)
    throw new Error(`${prefix}fence markers must each appear exactly once (found start=${startCount} end=${endCount})`);
  const startIdx = sourceContent.indexOf(FENCE_START) + FENCE_START.length;
  const endIdx = sourceContent.indexOf(FENCE_END);
  if (endIdx < startIdx) throw new Error(`${prefix}${FENCE_END} appears before ${FENCE_START}`);
  return sourceContent.slice(startIdx, endIdx).trim();
}
```

**`wordCount` (lines 124–127) + `checkH2Shape` (lines 133–144) — DELETE per D-07.** Do not carry over.

**`syncOne` body** (lines 146–199) — LIFT VERBATIM **except** remove word-count/H2 usage. Delete lines 184–185 (`const words = wordCount(newBody); checkH2Shape(newBody, slug);`) and drop `words` from the three returned objects (lines 189, 194, 198 → `{ slug, changed: false }`, `{ slug, changed: true, drift: true }`, `{ slug, changed: true }`). Everything else lifts:
```javascript
async function syncOne(mdxPath) {
  const slug = basename(mdxPath, ".mdx");
  const mdxRaw = normalize(await readFile(mdxPath, "utf8"));
  const { frontmatterBlock } = sliceFrontmatter(mdxRaw);
  const sourcePath = readSourceField(frontmatterBlock);
  if (!sourcePath) throw new Error(`${slug}.mdx: frontmatter missing required \`source:\` field`);
  const absSource = join(PROJECT_ROOT, sourcePath);
  // path-traversal guard (S3) — LIFT VERBATIM (lines 163-170), V12 File Handling control:
  if (!absSource.startsWith(PROJECT_ROOT + sep) && absSource !== PROJECT_ROOT)
    throw new Error(`${slug}.mdx: source path escapes project root: ${sourcePath}`);
  try { await access(absSource); }
  catch { throw new Error(`${slug}.mdx: source file not found at ${sourcePath}`); }
  const sourceContent = normalize(await readFile(absSource, "utf8"));
  const newBody = extractFence(sourceContent, sourcePath);
  const newMdx = frontmatterBlock + "\n" + newBody + "\n";
  // DELETE lines 184-185 (wordCount + checkH2Shape)
  if (mdxRaw === newMdx) return { slug, changed: false };            // was { ..., words }
  if (CHECK_MODE) { process.stderr.write(`drift detected in ${slug}.mdx\n`); return { slug, changed: true, drift: true }; }
  await writeFile(mdxPath, newMdx, "utf8");
  return { slug, changed: true };
}
```

**`main()` exit-code logic** (lines 201–236) — LIFT VERBATIM **except** remove the `wordTag` block (lines 212–217) and simplify the stdout line (lines 223–225) to `${r.slug}.mdx: ${verb}`. Keep the errorCount→exit 2 / drift→exit 1 / else exit 0 logic unchanged:
```javascript
async function main() {
  const mdxFiles = [];
  for await (const f of glob(MDX_GLOB)) mdxFiles.push(f);
  mdxFiles.sort();
  let driftFound = false, errorCount = 0;
  for (const mdxPath of mdxFiles) {
    try {
      const r = await syncOne(mdxPath);
      const verb = r.changed ? (CHECK_MODE ? "would update" : "updated") : "unchanged";
      process.stdout.write(`${r.slug}.mdx: ${verb}\n`);   // simplified — no word count
      if (r.drift) driftFound = true;
    } catch (err) {
      process.stderr.write(`ERROR ${basename(mdxPath)}: ${err.message}\n`);
      errorCount += 1;
    }
  }
  if (errorCount > 0) process.exit(2);
  if (CHECK_MODE && driftFound) process.exit(1);
  process.exit(0);
}
```

**CLI guard — LIFT VERBATIM** (lines 239–241) so pure fns stay importable without running `main`:
```javascript
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
```

**Header docblock** (lines 1–24) — rewrite to reference `Experience/*.md` → `src/content/experience/*.mdx`; drop the word-count line (21) and the "600-900 word" mention (9).

**Exit-code contract (unchanged):** `0` = success / no drift; `1` = drift in `--check`; `2` = hard failure (missing/duplicate fence, missing `source:`, path escape, source not found).

---

### `src/content.config.ts` (config, schema/validation)

**Analog:** its own existing `projects` collection block (lines 1–25). MODIFY: keep all existing lines, ADD an `experience` collection, and EXTEND the export line.

**Existing imports (lines 1–3) — already present, reuse as-is:**
```typescript
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
```

**Existing `projects` block (lines 5–23) — DO NOT MODIFY.** Note the patterns to parallel: `glob({ pattern, base })` loader (line 6), the `source: z.string()` script-validated field convention (line 21), `z.enum` usage (lines 15,18), `z.array(z.string()).min(1)` (line 12 — **do NOT copy `.min(1)`**, Balfour is `[]`). Projects uses the **function form** `schema: ({ image }) =>` (line 7) only for `image()`; experience has no image → use plain-object form.

**New `experience` block to add** (per D-01 / research Pattern 1):
```typescript
const experience = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/experience" }),
  schema: z.object({
    role: z.string(),
    company: z.string(),
    location: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),      // absence ⇒ present (D-01); OMIT from Holloway, do not use ""
    dateRange: z.string(),                     // display-only, decoupled from sort (D-05)
    techStack: z.array(z.string()),            // NO .min(1) — Balfour is [] (D-10)
    summary: z.string(),                       // first-person site voice
    highlights: z.array(z.string()).max(5),    // .max(5), NO hard min (A1) so Balfour validates
    engagementType: z.enum(["contract", "internship"]),
    hasCaseStudy: z.boolean(),
    chatSummary: z.string().optional(),        // content deferred to Phase 25 (D-02)
    source: z.string(),                        // existence validated by script, not Zod
  }),
});
```

**Export line (line 25) — EXTEND the existing object, do not replace** (Pitfall 6):
```typescript
// current:  export const collections = { projects };
export const collections = { projects, experience };
```

---

### `src/content/experience/holloway.mdx` + `balfour-beatty.mdx` (content, data)

**Analog:** `src/content/projects/seatwatch.mdx` (lines 1–24 frontmatter).

**Frontmatter shape to parallel** (note `---` delimiters, quoted strings, array formatting, and the `source:` field on line 23):
```yaml
---
title: "SeatWatch"
tagline: "..."
description: "..."
techStack:
  [
    "TypeScript",
    "React",
  ]
featured: true
status: "completed"
category: "web-app"
order: 1
year: "2025"
source: "Projects/1 - SEATWATCH.md"
---
```
Experience frontmatter uses the D-01 field set instead (role/company/location/startDate/dateRange/techStack/summary/highlights/engagementType/hasCaseStudy/source; chatSummary omitted). Body below the closing `---` is machine-written by the sync (do not hand-author). `source:` values: `"Experience/HOLLOWAY_EXPERIENCE.md"` and `"Experience/BALFOUR_BEATTY.md"`.

**Holloway edges:** omit `endDate` entirely (present role); `hasCaseStudy: true`; 3–5 `highlights`. **Balfour edges:** `techStack: []`; `hasCaseStudy: false`; `engagementType: "internship"`; 0–2 `highlights`.

---

### `Experience/HOLLOWAY_EXPERIENCE.md` (MODIFY) + `BALFOUR_BEATTY.md` (NEW)

**Analog:** `Projects/1 - SEATWATCH.md` fenced-source shape.

**Fence pattern from the projects source** (SEATWATCH.md): intro prose sits ABOVE the fence (not synced); the case-study body is wrapped:
```markdown
# SeatWatch

[intro paragraphs — NOT synced, live above the fence]

<!-- CASE-STUDY-START -->

## Problem
...body...
<!-- CASE-STUDY-END -->
```

**Holloway modification (D-08 / Pitfall 2 A2):** Holloway (`Experience/HOLLOWAY_EXPERIENCE.md`) currently has **no fence markers**. Insert `<!-- CASE-STUDY-START -->` immediately AFTER the H1 line (`# Holloway Connect — Engineering Experience`, line 1) so the `> **Contract engagement.**` blockquote (line 3) + Overview + Highlights + Themes all land inside the body. Insert `<!-- CASE-STUDY-END -->` at end of file. Body uses `→` arrows (safe in MDX); scan for bare `<`/`{` per Pitfall 2.

**Balfour (NEW) — author lightweight source** (D-10, Pitfall 3 — must exist before first `pnpm sync:experience`):
```markdown
# Balfour Beatty — Project Management Internship

<!-- CASE-STUDY-START -->

Tracked deliverables and subcontractor timelines across active construction
workstreams... [1–2 lines from résumé, CONTEXT §Specific Ideas]
<!-- CASE-STUDY-END -->
```

---

### `.github/workflows/sync-check.yml` (MODIFY, CI drift gate)

**Analog:** its own `on.pull_request.paths` block (lines 5–13) + the projects verify step (lines 38–39).

**Existing paths block — ADD three entries** (mirror lines 6–7,12):
```yaml
on:
  pull_request:
    paths:
      - "Projects/**"
      - "src/content/projects/**"
      # ... existing entries ...
      - "scripts/sync-projects.mjs"
      # ADD:
      - "Experience/**"
      - "src/content/experience/**"
      - "scripts/sync-experience.mjs"
```

**Existing projects verify step (lines 38–39) — ADD a parallel step after it:**
```yaml
      - name: Verify Projects/ <-> MDX sync is clean
        run: pnpm sync:check
      # ADD:
      - name: Verify Experience/ <-> MDX sync is clean
        run: pnpm sync:experience:check
```

---

### `tests/scripts/sync-experience.test.ts` (NEW, unit + integration)

**Analog:** `tests/scripts/sync-projects.test.ts`.

**Import pattern (lines 1–11) — mirror, but import from the experience script and DROP `wordCount`** (deleted per D-07); optionally add `normalize`:
```typescript
import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import {
  readSourceField,
  sliceFrontmatter,
  extractFence,
  normalize,          // add (verify it's exported in the .mjs)
} from "../../scripts/sync-experience.mjs";
```

**Unit describe blocks — mirror** `readSourceField` (lines 13–38), `sliceFrontmatter` (lines 40–59), `extractFence` (lines 61–89) VERBATIM (same fence markers, same assertions). **Omit the `wordCount` describe block (lines 91–96)** — that fn is deleted.

**Path-traversal integration test (lines 98–128) — mirror VERBATIM**, repointing the script name and mdx dir to `experience`:
```typescript
describe("sync-experience.mjs S3 path-traversal guard", () => {
  it("rejects a source: path that escapes project root", async () => {
    const tmp = await mkdtemp(join(tmpdir(), "sync-escape-"));
    try {
      await mkdir(join(tmp, "src", "content", "experience"), { recursive: true });
      await mkdir(join(tmp, "scripts"), { recursive: true });
      await writeFile(
        join(tmp, "src", "content", "experience", "bad.mdx"),
        '---\nrole: Bad\nsource: "../../escape.md"\n---\n\nbody\n',
        "utf8",
      );
      const repoRoot = join(__dirname, "..", "..");
      let threwWithExpectedMessage = false;
      try {
        execFileSync("node", [join(repoRoot, "scripts/sync-experience.mjs")], { cwd: tmp, stdio: "pipe" });
      } catch (err) {
        const stderr = String((err as { stderr?: Buffer }).stderr ?? "");
        const message = String((err as Error).message ?? "");
        if (/escapes project root/.test(stderr) || /escapes project root/.test(message)) threwWithExpectedMessage = true;
      }
      expect(threwWithExpectedMessage).toBe(true);
    } finally { await rm(tmp, { recursive: true, force: true }); }
  });
});
```

**SC3 ordering unit test (NEW — no projects analog).** Assert the comparator on two mock `{ data: { startDate } }` objects, Holloway(2026) before Balfour(2023). No Astro runtime:
```typescript
const cmp = (a, b) => b.data.startDate.valueOf() - a.data.startDate.valueOf();
// expect [balfour(2023), holloway(2026)].sort(cmp)[0] === holloway
```

---

### `tests/scripts/sync-experience-check.test.ts` (NEW, integration)

**Analog:** `tests/scripts/sync-projects-check.test.ts`.

**Scaffold + afterEach pattern (lines 1–78) — mirror**, but the `scaffold()` `body` (lines 26–47) must **DROP the 5-H2 structure** (no longer validated) — use freeform experience prose. Repoint dirs to `Experience`/`experience` and the mdx frontmatter to experience fields:
```typescript
const repoRoot = join(__dirname, "..", "..");
const syncScript = join(repoRoot, "scripts/sync-experience.mjs");
// scaffold(): mkdir tmp/Experience + tmp/src/content/experience
//   source .md: "# Sample\n\n<!-- CASE-STUDY-START -->\n\n<body>\n<!-- CASE-STUDY-END -->\n"
//   mdx: frontmatter with role/company/startDate/dateRange/summary/source + body
```

**The two `--check` cases (lines 80–108) — mirror VERBATIM:**
```typescript
it("exits 0 when source fence matches MDX body", async () => {
  await scaffold();
  expect(() => execFileSync("node", [syncScript, "--check"], { cwd: tmp!, stdio: "pipe" })).not.toThrow();
});
it("exits 1 when source fence is mutated but MDX is not", async () => {
  const { sourcePath } = await scaffold();
  const mutated = (await readFile(sourcePath, "utf8")).replace("<needle>", "DRIFTED");
  await writeFile(sourcePath, mutated, "utf8");
  let status = null;
  try { execFileSync("node", [syncScript, "--check"], { cwd: tmp!, stdio: "pipe" }); }
  catch (err) { status = (err as { status?: number }).status ?? null; }
  expect(status).toBe(1);
});
```

---

### `package.json` scripts (MODIFY)

**Analog:** existing lines 24–25.
```json
"sync:projects": "node scripts/sync-projects.mjs",
"sync:check": "node scripts/sync-projects.mjs --check",
```
**ADD (parallel, per D-11):**
```json
"sync:experience": "node scripts/sync-experience.mjs",
"sync:experience:check": "node scripts/sync-experience.mjs --check",
```
Do NOT add sync to the `build` script (anti-pattern; projects sync isn't in `build` either).

---

### `docs/CONTENT-SCHEMA.md` (MODIFY)

**Analog:** its existing projects sections — §1 Frontmatter Schema (field table w/ `source | string | required (D-15)` row, line 26 + the string-shape-only note lines 28–30), §2 Sync Contract (fence-marker rules, lines 32–68), §3 Author Workflow (lines 86–97), §4 Failure-Mode Matrix (lines 109–123). Parallel each for experience: an experience frontmatter table (D-01 fields), the shared fence contract (note H2/word-count checks do NOT apply to experience per D-07), an author workflow referencing `pnpm sync:experience`, and the same failure-mode rows (exit 2 hard-fails, exit 1 drift) repointed to `Experience/*.md`.

## Shared Patterns

### Path-traversal guard (V12 File Handling)
**Source:** `scripts/sync-projects.mjs` lines 163–170
**Apply to:** `sync-experience.mjs` `syncOne` — LIFT VERBATIM, do NOT drop during the strip. `source:` is author-controlled; guard exits 2 on escape.

### Fence markers (D-08 parity)
**Source:** `scripts/sync-projects.mjs` lines 33–34 (`FENCE_START`/`FENCE_END`)
**Apply to:** the sync script, both `Experience/*.md` sources, and both test files — the exact strings `<!-- CASE-STUDY-START -->` / `<!-- CASE-STUDY-END -->` are reused so the mechanism is identical.

### Exit-code / diff-then-write idempotency contract
**Source:** `scripts/sync-projects.mjs` lines 188–198 (diff-then-write) + 233–235 (exit codes)
**Apply to:** `sync-experience.mjs` — enables the `--check` drift gate for free; `0`/`1`/`2` semantics unchanged.

### CLI-guard export pattern (testability)
**Source:** `scripts/sync-projects.mjs` line 239
**Apply to:** `sync-experience.mjs` — `main()` runs only as CLI so pure fns stay importable by the mirrored test files.

### `z.coerce.date()` + descending sort (SC3 / EXP-06)
**Source:** research Pattern 2 (confirmed against Astro 6 docs); no in-repo experience analog yet
**Apply to:** the ordering unit test now, Phase 22 render later: `(a,b) => b.data.startDate.valueOf() - a.data.startDate.valueOf()`.

## No Analog Found

| File / concern | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| SC3 ordering comparator unit test | test | — | Projects has no date-sort test (uses manual `order: number`); this comparator is net-new but trivial (research Pattern 2). Everything else in the phase has an exact analog. |

## Metadata

**Analog search scope:** `scripts/`, `src/content.config.ts`, `src/content/projects/`, `Projects/`, `tests/scripts/`, `.github/workflows/`, `package.json`, `docs/CONTENT-SCHEMA.md`
**Files scanned:** 8 analogs read in full or targeted
**Pattern extraction date:** 2026-07-08
</content>
</invoke>
