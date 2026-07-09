# Phase 21: Experience Content Pipeline & Collection - Research

**Researched:** 2026-07-08
**Domain:** Astro 6 content collections + a Node sync script mirroring an existing in-repo pipeline
**Confidence:** HIGH — this phase replicates verified, working in-repo code (`scripts/sync-projects.mjs`, `src/content.config.ts`) on Astro 6.0.8; the mechanism is proven, not novel.

## Summary

Phase 21 is a near-verbatim replication of an existing, working pipeline. The repo already runs a projects content collection (`src/content.config.ts`) fed by a fenced-block sync script (`scripts/sync-projects.mjs`) with a `--check` CI drift gate, unit + integration tests, and a documented failure-mode contract. Phase 21 stands up a second `experience` collection and a parallel `scripts/sync-experience.mjs` by lifting four pure functions verbatim, dropping the two projects-specific validations (H2-shape + word-count) per D-07, and re-pointing the MDX glob. No new runtime dependencies are required (the sync uses only `node:fs/promises`, `node:path`, `node:url`).

The Astro 6 collection API in use is confirmed both by the working in-repo config and the current official docs: `defineCollection` + `glob` from `astro/loaders` + `z` from `astro/zod`, exported via a `collections` object; `z.coerce.date()` for sortable dates with `.optional()` on `endDate`; reverse-chronological ordering via `(await getCollection("experience")).sort((a, b) => b.data.startDate.valueOf() - a.data.startDate.valueOf())`. This idiom is unchanged from Astro 5.

**Primary recommendation:** Copy `sync-projects.mjs` → `sync-experience.mjs`, delete `EXPECTED_H2S`/`WORD_TARGET_*`/`checkH2Shape`/`wordCount`, change one glob constant, add the plain-object `experience` schema to `content.config.ts`, author `Experience/BALFOUR_BEATTY.md`, add fence markers to Holloway, mirror the two test files and the two npm scripts, and extend `sync-check.yml`. Nothing here is exploratory.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Prose source of truth | Human-authored `Experience/*.md` | — | Same split as projects: prose lives in fenced block in the `.md` source |
| Metadata / typed contract | Content config (`content.config.ts` Zod schema) | Build-time (`astro check`) | Frontmatter typing + validation is a build-tier concern |
| Fence→body sync | Node CLI script (`sync-experience.mjs`) | CI drift gate | Deterministic file transform; not a build step (manual `pnpm sync:*` + CI `--check`) |
| Reverse-chron ordering | Query-time (`getCollection` + sort) | — | Defined here (SC3), consumed by Phase 22 render tier |
| Drift enforcement | CI (`sync-check.yml`) | — | `--check` exit-1 gate, independent of `build` |

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Rich, forward-compatible `experience` schema with fields: `role`, `company`, `location`, `startDate` (`z.coerce.date()`), `endDate` (`z.coerce.date().optional()`, absence ⇒ present), `dateRange` (display string, separate from sort keys), `techStack` (`z.array(z.string())`, may be empty), `summary` (first-person site voice), `highlights` (`z.array(z.string())`, 3–5 headline bullets), `engagementType` (enum `contract | internship`), `hasCaseStudy` (boolean), `chatSummary` (optional, third-person, content deferred), `source` (string, existence validated by script not Zod).
- **D-02:** `chatSummary` optional; content deferred to Phase 25. Field defined now, stays empty.
- **D-03:** `highlights: string[]` included as typed frontmatter (3–5 bullets).
- **D-04:** Reverse-chron via real sortable dates (no manual `order`). `z.coerce.date()` + `startDate` descending sort.
- **D-05:** Separate `dateRange` display string decoupled from sort keys.
- **D-06:** New `scripts/sync-experience.mjs` **mirrors** `sync-projects.mjs` mechanism (fenced extraction, byte-for-byte frontmatter preservation, LF normalization, path-traversal guard, idempotent diff-then-write, `--check` exit-1 on drift). Parallel script, not a refactor.
- **D-07:** Drop projects-specific validation: 5-H2 shape + 600–900 word target removed/relaxed to no-op for experience.
- **D-08:** Reuse fence markers `<!-- CASE-STUDY-START -->` / `<!-- CASE-STUDY-END -->`. Must be **added** to `Experience/*.md`. Holloway fence wraps everything below the H1 (Overview → Highlights → Themes). Balfour fence wraps its 1–2 lines.
- **D-09:** Sources at `Experience/*.md`; collection files at `src/content/experience/*.mdx`. Suggested slugs `holloway.mdx`, `balfour-beatty.mdx`.
- **D-10:** Author lightweight `Experience/BALFOUR_BEATTY.md` during execution. `engagementType: internship`, `hasCaseStudy: false`, `techStack: []`.
- **D-11:** Separate npm scripts (`sync:experience`, `sync:experience:check`) + a separate CI step in `sync-check.yml` (add paths `Experience/**`, `src/content/experience/**`, `scripts/sync-experience.mjs`). Do NOT add sync to `build`.

### Claude's Discretion

- Exact Zod types/refinements, optionality edges, enum literal spelling (within D-01 field list).
- Collection file slugs/filenames and internal script structure (within D-06/D-09).
- Whether to keep any relaxed soft-warning in the sync (D-07).
- Whether Balfour dates use month precision (`2023-05` / `2023-08`) vs full ISO — either sorts correctly.

### Deferred Ideas (OUT OF SCOPE)

- Third-person `chatSummary` content → Phase 25.
- Balfour full case study (EXP-FUT-01).
- Metrics/impact visualizations for highlights (EXP-FUT-02).
- Company logo/thumbnail image field.
- The Experience page/route/nav/UI → Phase 22. Chat wiring → Phase 25.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXP-01 | `experience` collection with Zod schema (role, company, dates, stack/skills, summary) sourced from `Experience/*.md` via a sync pipeline mirroring `sync-projects.mjs` | Schema recommendation (this doc §Schema) + verbatim-lift mechanism (§Sync Mechanism Replication). Both `content.config.ts` and `sync-projects.mjs` are proven in-repo. |
| EXP-06 | Entries render reverse-chronologically with role, company, dates, tech/skills at a glance | `z.coerce.date()` + descending sort idiom confirmed vs Astro 6 docs (§Ordering). `highlights[]` (D-03) supplies the at-a-glance data. Ordering contract defined here; Phase 22 renders it. |

## Standard Stack

No new packages. Everything is already installed and version-locked in `package.json`.

### Core (existing, verified in package.json)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^6.0.8 | Content collections + `astro check` build gate | `[VERIFIED: package.json]` In-repo, running |
| zod | ^4.3.6 | Frontmatter schema (`astro/zod` re-export) | `[VERIFIED: package.json]` Astro 6 requires Zod 4 |
| @astrojs/mdx | ^5.0.2 | MDX collection loader consumes bodies | `[VERIFIED: package.json]` Already loads projects MDX |
| vitest | ^4.1.0 | Unit + integration tests for the sync script | `[VERIFIED: package.json]` Existing sync tests use it |
| node | >=22 | Runtime for `sync-experience.mjs` (`node:*` builtins only) | `[VERIFIED: package.json engines]` |

**Installation:** None. Standing v1.2+ constraint: no new runtime dependencies. `sync-experience.mjs` imports only `node:fs/promises`, `node:path`, `node:url` — same as `sync-projects.mjs`.

## Package Legitimacy Audit

Not applicable — this phase installs **zero** external packages. All code uses already-installed dependencies and Node builtins.

## Architecture Patterns

### System Data Flow

```
Experience/HOLLOWAY_EXPERIENCE.md        (human-authored prose + fence markers)
Experience/BALFOUR_BEATTY.md   ──┐
                                 │  [fenced block: CASE-STUDY-START..END]
                                 ▼
        scripts/sync-experience.mjs  ──(write mode)──►  src/content/experience/*.mdx body
          │  reads `source:` from MDX frontmatter                    ▲
          │  extractFence(source) → newBody                          │ frontmatter preserved
          │  diff-then-write (idempotent)                            │ byte-for-byte
          │
          └──(--check mode)──► exit 1 on drift  ──►  .github/workflows/sync-check.yml (CI gate)

src/content/experience/*.mdx  ──►  content.config.ts (Zod schema, `astro check`)  ──►  getCollection("experience")
                                                                                        .sort(desc by startDate)  ──►  Phase 22 render
```

### Recommended Structure
```
Experience/
├── HOLLOWAY_EXPERIENCE.md   # add fence markers below H1
└── BALFOUR_BEATTY.md        # NEW — author lightweight stub with fence
src/content/experience/
├── holloway.mdx             # NEW — frontmatter + synced body
└── balfour-beatty.mdx       # NEW — frontmatter + synced 1–2 line body
scripts/sync-experience.mjs  # NEW — copy of sync-projects.mjs, stripped per D-07
tests/scripts/
├── sync-experience.test.ts        # NEW — mirror sync-projects.test.ts
└── sync-experience-check.test.ts  # NEW — mirror sync-projects-check.test.ts
```

### Pattern 1: Second collection, plain-object schema
The projects collection uses the **function form** `schema: ({ image }) => z.object({...})` only because it needs `image()`. Experience has no image field, so use the simpler **plain-object form** (matches the official Astro 6 docs `blog` example):

```typescript
// Source: src/content.config.ts (in-repo) + docs.astro.build/en/guides/content-collections
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const experience = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/experience" }),
  schema: z.object({
    role: z.string(),
    company: z.string(),
    location: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),      // absence ⇒ present (D-01)
    dateRange: z.string(),                     // display-only, decoupled from sort (D-05)
    techStack: z.array(z.string()),            // NO .min(1) — Balfour is [] (D-10)
    summary: z.string(),                       // first-person site voice
    highlights: z.array(z.string()).max(5),    // see Optionality Edges re: min bound
    engagementType: z.enum(["contract", "internship"]),
    hasCaseStudy: z.boolean(),
    chatSummary: z.string().optional(),        // content deferred (D-02)
    source: z.string(),                        // existence validated by script, not Zod
  }),
});

export const collections = { projects, experience };
```

### Pattern 2: Reverse-chronological query (the SC3/EXP-06 contract)
```typescript
// Source: docs.astro.build/en/guides/content-collections (Astro 6) + CONTEXT D-04
import { getCollection } from "astro:content";
const entries = (await getCollection("experience")).sort(
  (a, b) => b.data.startDate.valueOf() - a.data.startDate.valueOf(),
);
// Holloway (2026-05) sorts above Balfour (2023-05) — deep-dive-first.
```

### Anti-Patterns to Avoid
- **Adding the sync to `build`:** Projects sync is NOT in `build` (`package.json` `build` = `build:chat-context && wrangler types && astro check && astro build`). Keep experience the same: manual `pnpm sync:experience` + CI `--check` gate only.
- **`techStack: z.array(z.string()).min(1)`:** The projects schema uses `.min(1)`, but Balfour has an empty stack (D-10). Copying `.min(1)` will fail `astro check`.
- **Function-form schema with unused `image`:** Don't copy `schema: ({ image }) =>` — experience has no image field.
- **Refactoring `sync-projects.mjs` to share code:** D-06 mandates a parallel script, not a refactor. Two legible, independent scripts + gates.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frontmatter parsing | A YAML parser or regex soup | Lift `sliceFrontmatter` + `readSourceField` verbatim | Already handles quoted/unquoted `source:`, mismatched-quote rejection, delimiter errors |
| Fence extraction | New marker logic | Lift `extractFence` verbatim | Handles missing/duplicate/out-of-order markers with clear errors |
| CRLF handling | Manual `.split` | Lift `normalize` verbatim | Repo is `eol=lf` (`.gitattributes`); `normalize` is the second guard |
| Path-traversal safety | Nothing (skip it) | Lift the `PROJECT_ROOT + sep` guard verbatim | `source:` is author-controlled; guard is one block, prevents arbitrary reads |
| Idempotency | Always-write | Lift the `mdxRaw === newMdx` diff-then-write | Enables the `--check` drift contract for free |

**Key insight:** Every hard part of this phase is already solved and tested in `sync-projects.mjs`. The work is deletion (H2/word-count) and re-pointing (glob), not construction.

## Sync Mechanism Replication (D-06 / D-07)

`sync-projects.mjs` exports six functions. Disposition for `sync-experience.mjs`:

| Function | Action | Notes |
|----------|--------|-------|
| `normalize` | **Lift verbatim** | CRLF→LF |
| `readSourceField` | **Lift verbatim** | Parses `source:` frontmatter field |
| `sliceFrontmatter` | **Lift verbatim** | Splits `{ frontmatterBlock, body }` |
| `extractFence` | **Lift verbatim** | Same fence markers (D-08) |
| `wordCount` | **Drop** | D-07 removes word-count target |
| `checkH2Shape` | **Drop** | D-07 removes the 5-H2 shape check |

**Constants:** keep `FENCE_START`/`FENCE_END` verbatim (D-08). Delete `EXPECTED_H2S`, `WORD_TARGET_MIN`, `WORD_TARGET_MAX`. Change `MDX_GLOB` to `"src/content/experience/*.mdx"`.

**`syncOne` changes:** remove the two lines `const words = wordCount(newBody); checkH2Shape(newBody, slug);` and drop `words` from the returned object. Everything else (source read, path-traversal guard, `access` existence check, `newMdx` assembly `frontmatterBlock + "\n" + newBody + "\n"`, diff-then-write, CHECK_MODE drift branch) lifts verbatim.

**`main` changes:** remove the `wordTag` computation; simplify the stdout line to `${r.slug}.mdx: ${verb}`. Keep the `errorCount`→exit 2, `driftFound`→exit 1, else exit 0 logic **verbatim**.

**Exit-code contract (unchanged):** `0` = success / no drift; `1` = drift in `--check`; `2` = hard failure (missing/duplicate fence, missing `source:`, path escape, source not found).

**CLI guard (verbatim):** keep `if (process.argv[1] === fileURLToPath(import.meta.url)) await main();` so the pure functions remain importable by tests without running `main`.

**Header comment:** update the docblock to reference `Experience/*.md` → `src/content/experience/*.mdx` and drop the word-count/H2 lines.

## Schema Field Types & Optionality Edges (D-01)

See Pattern 1 for the full schema. Notable edges (Claude's-discretion calls to lock in planning):

| Field | Recommended type | Edge / rationale |
|-------|------------------|------------------|
| `endDate` | `z.coerce.date().optional()` | **Omit entirely** from Holloway frontmatter (present role). Do not use empty string — `z.coerce.date()` on `""` yields Invalid Date and fails `astro check`. `[VERIFIED: in-repo z.coerce pattern]` |
| `techStack` | `z.array(z.string())` (no `.min`) | Balfour is `[]` (D-10). `.min(1)` would fail. `[VERIFIED: CONTEXT D-10]` |
| `highlights` | `z.array(z.string()).max(5)` | **Optionality edge — flag for planner.** D-03 says "3–5 bullets," but Balfour is a lightweight 1–2 line entry (EXP-05) that plausibly has 0–2 highlights. A hard `.min(3)` would force padding Balfour or fail validation. Recommend `.max(5)` with **no min** (or `.min(1)`), enforcing the 3–5 richness by authoring on Holloway only. `[ASSUMED]` — needs confirmation. |
| `engagementType` | `z.enum(["contract", "internship"])` | Exact lowercase literals per D-01/D-10. `[VERIFIED: CONTEXT D-01]` |
| `chatSummary` | `z.string().optional()` | Omit from both entries now (D-02). Optional means build stays green empty. `[VERIFIED: CONTEXT D-02]` |
| `source` | `z.string()` | String-shape only; file existence validated by the sync script (matches projects D-15). Do NOT add a refinement checking the filesystem — build runs in a different CWD context. `[VERIFIED: docs/CONTENT-SCHEMA.md §1]` |
| `startDate` / `dateRange` | `z.coerce.date()` / `z.string()` | Kept separate per D-05: `startDate` sorts, `dateRange` displays (`"May 2026 – Present"`). `[VERIFIED: CONTEXT D-04/D-05]` |

## Runtime State Inventory

Not a rename/refactor phase (greenfield additive). No stored data, live-service config, OS-registered state, secrets, or build artifacts carry a to-be-changed identifier. **None — verified: this phase only adds new files and one CI step; it renames nothing.**

## Common Pitfalls

### Pitfall 1: Holloway fence placement (the blockquote ambiguity)
**What goes wrong:** D-08 says the fence wraps "everything below the H1 title (Overview → Highlights → Themes)." Holloway's `# Holloway Connect — Engineering Experience` H1 is immediately followed by a `> **Contract engagement.** …` blockquote **before** `## Overview`. It is ambiguous whether the blockquote goes inside the fence.
**How to avoid:** Put the fence-start **immediately after the H1 line**, so the blockquote + Overview + Highlights + Themes all land in the body (that blockquote is part of the deep-dive Phase 22 renders). This matches "everything below the H1." Confirm during authoring. `[ASSUMED]` — logged in Assumptions.
**Warning signs:** Synced `holloway.mdx` body missing the "Contract engagement" lede, or the lede stranded above the fence and lost.

### Pitfall 2: MDX body must not contain raw `<` or `{` interpreted as JSX
**What goes wrong:** MDX parses `<word` as a JSX tag and `{` as an expression. The Holloway body uses `→` arrows (`0 → ~1,400`, `223 → 1`, `28 → 119`) and backticked identifiers — all safe — but any literal `<` (e.g., `<600`) or stray `{` in future edits will break the MDX build.
**How to avoid:** Scan the fenced body for bare `<`/`{`. The seatwatch body proves the pattern works; keep new prose arrow-based (`→`) not `<`/`>`.
**Warning signs:** `astro check` / `astro build` MDX parse error pointing at the experience file.

### Pitfall 3: Balfour stub must exist before first sync (D-10)
**What goes wrong:** `Experience/BALFOUR_BEATTY.md` does not exist yet. `balfour-beatty.mdx`'s `source:` will point at a missing file → sync exits 2 ("source file not found").
**How to avoid:** Author `Experience/BALFOUR_BEATTY.md` (with fence wrapping the 1–2 line résumé description) **before** running `pnpm sync:experience`. Content is in CONTEXT §Specific Ideas.
**Warning signs:** `ERROR balfour-beatty.mdx: source file not found`.

### Pitfall 4: `techStack: []` vs projects `.min(1)`
Covered above — do not copy `.min(1)`.

### Pitfall 5: LF/CRLF on Windows
**Mitigation already in place:** `.gitattributes` sets `* text=auto eol=lf` repo-wide, and `normalize()` is the runtime guard. Author new files with LF. Low risk, but keep `normalize` in the lifted script.

### Pitfall 6: Two collections, one config export
`export const collections = { projects, experience };` — a common mistake is redefining/overwriting `collections` or omitting `projects`. Add `experience` to the existing object; do not replace it.

## Code Examples

### Full sync-experience.mjs shape (after strip)
```javascript
// Source: derived verbatim from scripts/sync-projects.mjs, per D-06/D-07
import { readFile, writeFile, access, glob } from "node:fs/promises";
import { join, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";

const CHECK_MODE = process.argv.includes("--check");
const PROJECT_ROOT = process.cwd();
const MDX_GLOB = "src/content/experience/*.mdx";   // <-- only glob change
const FENCE_START = "<!-- CASE-STUDY-START -->";     // <-- reused (D-08)
const FENCE_END = "<!-- CASE-STUDY-END -->";

export const normalize = (s) => s.replace(/\r\n/g, "\n");
export function readSourceField(fm) { /* verbatim */ }
export function sliceFrontmatter(mdx) { /* verbatim */ }
export function extractFence(src, label) { /* verbatim */ }
// wordCount + checkH2Shape + EXPECTED_H2S + WORD_TARGET_* DELETED (D-07)

async function syncOne(mdxPath) {
  const slug = basename(mdxPath, ".mdx");
  const mdxRaw = normalize(await readFile(mdxPath, "utf8"));
  const { frontmatterBlock } = sliceFrontmatter(mdxRaw);
  const sourcePath = readSourceField(frontmatterBlock);
  if (!sourcePath) throw new Error(`${slug}.mdx: missing \`source:\``);
  const absSource = join(PROJECT_ROOT, sourcePath);
  if (!absSource.startsWith(PROJECT_ROOT + sep) && absSource !== PROJECT_ROOT)
    throw new Error(`${slug}.mdx: source path escapes project root: ${sourcePath}`);
  try { await access(absSource); }
  catch { throw new Error(`${slug}.mdx: source file not found at ${sourcePath}`); }
  const newBody = extractFence(normalize(await readFile(absSource, "utf8")), sourcePath);
  const newMdx = frontmatterBlock + "\n" + newBody + "\n";
  if (mdxRaw === newMdx) return { slug, changed: false };
  if (CHECK_MODE) { process.stderr.write(`drift detected in ${slug}.mdx\n`); return { slug, changed: true, drift: true }; }
  await writeFile(mdxPath, newMdx, "utf8");
  return { slug, changed: true };
}
// main(): glob → syncOne loop → errorCount?exit2 : (CHECK_MODE&&drift?exit1:exit0). Verbatim minus wordTag.
```

### package.json scripts to add
```json
"sync:experience": "node scripts/sync-experience.mjs",
"sync:experience:check": "node scripts/sync-experience.mjs --check"
```

### sync-check.yml additions
```yaml
# add under on.pull_request.paths:
- "Experience/**"
- "src/content/experience/**"
- "scripts/sync-experience.mjs"
# add as a new step after the projects verify step:
- name: Verify Experience/ <-> MDX sync is clean
  run: pnpm sync:experience:check
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Legacy `src/content/config.ts` + folder-based collections | `src/content.config.ts` + `glob()` loader from `astro/loaders` | Astro 5→6 (Content Layer API) | Already adopted in-repo; new collection must use the loader form (not legacy) |
| `output: "hybrid"` | static default + per-route `prerender=false` | Astro 6 | Noted in `astro.config.mjs`; irrelevant to this phase (no SSR route added) |

**Deprecated/outdated:** none affecting this phase. The in-repo config is already Astro-6-current.

## Validation Architecture

Nyquist validation is enabled (`config.json workflow.nyquist_validation: true`). Test framework and infra already exist.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 |
| Config file | `vitest.config.ts` (`include: ["tests/**/*.test.ts"]`, node env, globals) |
| Quick run command | `pnpm test` (`vitest run`) |
| Full suite command | `pnpm test` then `pnpm build` (build = `astro check && astro build` gate) |

### Success Criteria → Validation Map
| SC | Behavior | Test Type | Automated Command | Exists? |
|----|----------|-----------|-------------------|---------|
| SC1 | Idempotent sync; `--check` reports no drift | Integration (execFileSync in tmpdir) + unit (pure fns) | `pnpm sync:experience:check` exits 0; new `tests/scripts/sync-experience-check.test.ts` | ❌ Wave 0 |
| SC1 | Lifted pure fns behave (fence/frontmatter/source parsing) | Unit | new `tests/scripts/sync-experience.test.ts` mirroring `sync-projects.test.ts` | ❌ Wave 0 |
| SC1 | Path-traversal + missing-fence hard-fail (exit 2) | Integration | assert exit code 2 in tmpdir test | ❌ Wave 0 |
| SC2 | Typed frontmatter validated at build | Build gate | `pnpm exec astro check` (part of `pnpm build`) | ✅ (gate exists) |
| SC3 | Reverse-chron ordering (Holloway before Balfour) | Unit (comparator on mock entries) | new test asserting the sort comparator; no Astro runtime needed | ❌ Wave 0 |
| SC4 | `pnpm build` green, no new deps | Build gate + assertion | `pnpm build`; assert `package.json` dependencies unchanged | ✅ (gate) / ❌ dep-diff |

### What a build gate already covers vs. what needs a test
- **Build gate covers (no bespoke test needed):** SC2 typed-frontmatter validation (`astro check` runs Zod against every entry) and SC4 build-green. The two real entries double as edge-case fixtures: Holloway exercises **omitted `endDate`** (optional works) and Balfour exercises **empty `techStack`** — if either optionality edge is wrong, `astro check` fails.
- **Needs a bespoke test:** SC1 sync idempotency/drift/hard-fail (mirror the two existing sync-projects test files) and SC3 ordering (the comparator, tested on two mock `{ data: { startDate } }` objects — no Astro runtime).

### Nyquist minimum-fidelity edge samples
- **Missing `endDate` ⇒ still valid** — Holloway entry itself (build gate).
- **Empty `techStack` ⇒ still valid** — Balfour entry itself (build gate).
- **Drift detection** — mutate the fenced source, assert `--check` exits 1 (integration test, mirror `sync-projects-check.test.ts`).
- **Path-traversal rejection** — `source: "../../escape.md"` exits 2 (mirror the S3 guard test in `sync-projects.test.ts`).
- **Ordering** — comparator returns Holloway(2026) before Balfour(2023) on mock data (unit).

### Wave 0 Gaps
- [ ] `tests/scripts/sync-experience.test.ts` — unit tests for lifted `readSourceField`/`sliceFrontmatter`/`extractFence`/`normalize` + path-traversal integration (mirror `sync-projects.test.ts`).
- [ ] `tests/scripts/sync-experience-check.test.ts` — `--check` no-drift (exit 0) and drift (exit 1) integration (mirror `sync-projects-check.test.ts`).
- [ ] Ordering unit test — sort comparator on mock entries (SC3). Can live in either new test file.
- [ ] (Optional) dep-diff assertion for SC4 — or rely on CI/`git diff package.json`.
- Framework install: none — Vitest present.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | sync script + tests | ✓ (repo runs on it) | >=22 (engines) | — |
| pnpm | npm scripts / CI | ✓ | 10 (CI pin) | — |
| Vitest | Wave 0 tests | ✓ | ^4.1.0 | — |
| astro CLI (`astro check`) | SC2/SC4 build gate | ✓ | ^6.0.8 | — |

No external services, network, or new binaries. **No missing dependencies.**

## Security Domain

`security_enforcement` not explicitly set → treat as enabled. Surface is a build-time file transform with author-controlled input.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Zod schema (`content.config.ts`) validates all frontmatter at build; `source:` string-shape-checked. `extractFence` rejects missing/duplicate/out-of-order markers. |
| V12 File Handling | yes | Path-traversal guard (`PROJECT_ROOT + sep` check) on the author-controlled `source:` path — **lift verbatim**; do not drop it during the strip. |
| V6 Cryptography | no | — |
| V2/V3/V4 Auth/Session/Access | no | Static content pipeline, no auth surface |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `source:` path escaping repo root | Information Disclosure | Lifted path-traversal guard (exit 2) |
| Malformed frontmatter silently accepted | Tampering | `readSourceField` mismatched-quote rejection + `sliceFrontmatter` delimiter errors |
| Untyped/invalid frontmatter reaching render | Tampering | Zod schema + `astro check` build gate |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `highlights` should be `.max(5)` with **no hard min** (not `.min(3)`) so the lightweight Balfour entry validates | Schema / Optionality Edges | If planner enforces `.min(3)`, Balfour must be padded to 3 bullets or `astro check` fails — a schema-vs-content mismatch surfaces at build |
| A2 | Holloway fence-start goes immediately after the H1, including the `> Contract engagement` blockquote in the body | Pitfall 1 | Blockquote lede lost from the Phase 22 deep-dive, or stranded above the fence and dropped by sync |
| A3 | Plain-object `schema: z.object({...})` (not the `({ image }) =>` function form) is correct since experience has no image field | Pattern 1 | None functionally — both forms valid; function form just carries an unused `image` param |

**Note:** A1 and A2 are genuine authoring/decision points the planner should resolve explicitly (or defer to a `checkpoint:human-verify`). A3 is stylistic only.

## Open Questions

1. **`highlights` min bound (A1).**
   - Known: D-03 wants 3–5 bullets; Balfour is a 1–2 line lightweight entry.
   - Unclear: whether Balfour carries highlights at all.
   - Recommendation: `.max(5)` no min; author 3–5 on Holloway, 0–2 on Balfour. Lock in planning.
2. **Balfour date precision (Claude's discretion, D-noted).**
   - Either `2023-05`/`2023-08` (month) or full ISO both `z.coerce.date()` correctly and sort correctly. Recommend month precision for honesty; `dateRange: "May 2023 – Aug 2023"`.

## Sources

### Primary (HIGH confidence)
- `src/content.config.ts` (in-repo, running Astro 6.0.8) — exact working collection API, `glob` loader, `z.coerce`, `collections` export.
- `scripts/sync-projects.mjs` (in-repo) — the verbatim mechanism to mirror; exported pure functions, path guard, exit codes.
- `tests/scripts/sync-projects.test.ts` + `sync-projects-check.test.ts` (in-repo) — the test patterns to mirror.
- `package.json`, `vitest.config.ts`, `astro.config.mjs`, `.gitattributes` (in-repo) — versions, test config, LF policy.
- `docs.astro.build/en/guides/content-collections/` — Astro 6 multi-collection, `glob` loader, `getCollection` + reverse-chron sort, `z.coerce.date()` — CITED, matches in-repo.

### Secondary (MEDIUM confidence)
- `docs/CONTENT-SCHEMA.md`, `docs/VOICE-GUIDE.md` (in-repo) — schema doc pattern, first/third-person voice split.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — everything already installed and version-pinned; zero new deps.
- Architecture / mechanism: HIGH — verbatim replication of proven in-repo code; Astro 6 API cross-confirmed against official docs.
- Schema optionality edges: MEDIUM — A1 (`highlights` min) and A2 (Holloway fence) are authoring decisions, not technical unknowns.
- Pitfalls: HIGH — derived from the actual source files and existing tests.

**Research date:** 2026-07-08
**Valid until:** ~2026-08-07 (30 days; stable stack, no fast-moving dependency).
