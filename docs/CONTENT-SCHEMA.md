# Content Schema

Authoritative reference for the project and experience content pipelines. If anything here
disagrees with `src/content.config.ts`, `scripts/sync-projects.mjs`, or
`scripts/sync-experience.mjs`, code wins and this doc is wrong; file an issue.

## 1. Frontmatter Schema

Every `src/content/projects/*.mdx` file has frontmatter validated by Zod at
build time via `astro check`. Fields:

| Field | Type | Constraint | Example |
|-------|------|------------|---------|
| title | string | required | "SeatWatch" |
| tagline | string | required, max 80 chars | "Automated restaurant reservations with dual-strategy booking" |
| description | string | required | "A multi-service SaaS platform that monitors restaurant availability..." |
| techStack | string[] | required, min 1 item | ["TypeScript", "React", "Express", "BullMQ"] |
| featured | boolean | default false | true |
| status | enum | "completed" \| "in-progress" | "completed" |
| githubUrl | URL | optional | "https://github.com/jackcutrara/seatwatch" |
| demoUrl | URL | optional | "https://seat.watch" |
| thumbnail | image() | optional | (image asset) |
| category | enum | "web-app" \| "cli-tool" \| "library" \| "api" \| "other" | "web-app" |
| order | integer | required, >= 1 | 1 |
| year | string | required, regex /^\d{4}$/ | "2025" |
| source | string | required (D-15) | "Projects/1 - SEATWATCH.md" |

The `source` field is validated for **string shape only** at build time. File
existence is verified by `scripts/sync-projects.mjs` at sync time (different
working directory guarantees — see Pitfall 7).

## 2. Sync Contract

`Projects/<n>-<NAME>.md` is the authoritative source for every case-study body.
The case study lives in a fenced block at the top of the file:

```markdown
# SeatWatch

<intro paragraphs — KEEP>

<!-- CASE-STUDY-START -->

## Problem
...

## Approach & Architecture
...

## Tradeoffs
...

## Outcome
...

## Learnings
...

<!-- CASE-STUDY-END -->

## Architecture (FULL TECHNICAL REFERENCE)
<existing technical README content — KEEP>
```

**Fence conventions:**

- Markers are literal HTML comments: `<!-- CASE-STUDY-START -->` and `<!-- CASE-STUDY-END -->`.
- Each marker must appear exactly once in the source file.
- Both markers must appear before any code fence (triple-backtick block) in the file — a code fence containing the marker text would confuse the parser.
- The `<!-- CASE-STUDY-START -->` marker must appear before the `<!-- CASE-STUDY-END -->` marker.

**Five H2s required, in this exact order:**

1. Problem
2. Approach & Architecture
3. Tradeoffs
4. Outcome
5. Learnings

**Target length:** 600–900 words per case study (soft target; warning only — D-16).

**What sync writes:** the MDX body (everything after the closing `---` of frontmatter).

**What sync leaves alone:** the entire frontmatter block, preserved byte-for-byte.

## 3. Author Workflow

1. Edit `Projects/<n>-<NAME>.md` between the fence markers. Edit nothing else inside the fence range.
2. Run `pnpm sync:projects`.
3. Run `git diff` — review only the body change in the affected `.mdx` file.
4. Run `pnpm check` — confirms `astro check` still passes (Zod intact).
5. Commit `Projects/<n>-<NAME>.md` and `src/content/projects/<slug>.mdx` together.

**Do NOT edit `src/content/projects/*.mdx` body content directly.** Hand-edits
will be silently overwritten on the next sync. The CI drift gate
(`pnpm sync:check` on PR) catches cases where the MDX body diverges from the
source. Frontmatter edits ARE allowed and persist (sync preserves frontmatter
byte-for-byte).

**Resume PDF workflow (D-19):** The resume source document lives EXTERNAL to
this repo — Jack maintains the actual source separately (Google Doc / LaTeX
template). Update by re-exporting and overwriting the PDF. Steps:

1. Edit in the external source doc.
2. Export to PDF.
3. Replace `public/jack-cutrara-resume.pdf` with the new export.
4. Commit the binary; verify file size hasn't ballooned unexpectedly (typical: 50–150 KB).

## 4. Failure-Mode Matrix

| Error | Where Emitted | Fix |
|-------|---------------|-----|
| `MDX missing opening frontmatter delimiter` | sync, exit 2 | Ensure file starts with `---\n` |
| `MDX missing closing frontmatter delimiter` | sync, exit 2 | Ensure frontmatter has matching closing `---\n` |
| `<slug>.mdx: frontmatter missing required \`source:\` field` | sync, exit 2 | Add `source: "Projects/<n>-<NAME>.md"` to frontmatter |
| `<slug>.mdx: source file not found at <path>` | sync, exit 2 | Either the `source:` value is wrong or the source file was renamed. Fix one. |
| `<source>: missing <!-- CASE-STUDY-START -->` | sync, exit 2 | Add fence start marker to source file |
| `<source>: missing <!-- CASE-STUDY-END -->` | sync, exit 2 | Add fence end marker to source file |
| `<source>: fence markers must each appear exactly once` | sync, exit 2 | Source has nested or duplicate markers; clean up |
| `<source>: <!-- CASE-STUDY-END --> appears before <!-- CASE-STUDY-START -->` | sync, exit 2 | Markers are out of order; reorder |
| `<slug>.mdx: H2 shape mismatch` | sync, stderr (warning, exit 0) | Adjust H2 headings inside the fence to match D-01 (do not fail build) |
| `<slug>.mdx: <N> words (under 600 \| exceeds 900)` | sync, stdout (warning, exit 0) | Tighten or expand prose; soft target only |
| `drift detected in <slug>.mdx` | sync --check, exit 1 | Run `pnpm sync:projects` locally and commit the result |
| Zod validation error | `astro check`, build fails | Fix the failing field per Zod error message |

---

# Experience Pipeline

The experience pipeline mirrors the projects pipeline exactly (same fence markers,
same manual-sync + CI-`--check` pattern, D-11) with one deliberate difference:
experience bodies are **freeform** — the H2-shape and word-count checks do NOT
apply (D-07). `Experience/<NAME>.md` is the authoritative source;
`src/content/experience/<slug>.mdx` is the generated collection entry.

## 5. Experience Frontmatter Schema

Every `src/content/experience/*.mdx` file has frontmatter validated by Zod at
build time via `astro check`. Fields:

| Field | Type | Constraint | Example |
|-------|------|------------|---------|
| role | string | required | "Software Engineer" |
| company | string | required | "Holloway Connect" |
| location | string | required | "Remote" |
| startDate | date | required (coerced) | "2024-06" |
| endDate | date | optional — **omit entirely** for present roles (D-01); do not use `""` | "2025-03" |
| dateRange | string | required, display-only, decoupled from sort (D-05) | "Jun 2024 – Present" |
| techStack | string[] | required, **may be empty** — no `.min(1)` (D-10) | ["TypeScript", "Node.js"] |
| summary | string | required, first-person site voice | "I built and shipped..." |
| highlights | string[] | max 5, no hard min (A1) | ["Shipped X", "Led Y"] |
| engagementType | enum | "contract" \| "internship" | "contract" |
| hasCaseStudy | boolean | required | true |
| chatSummary | string | optional — content deferred to Phase 25 (D-02) | "..." |
| source | string | required | "Experience/HOLLOWAY_EXPERIENCE.md" |

As with projects, the `source` field is validated for **string shape only** at
build time. File existence is verified by `scripts/sync-experience.mjs` at sync
time (see Pitfall 7).

**Frontmatter is independently authored — NOT synced (IN-03 / D-10, A1):** The
single-source-of-truth guarantee covers **only the MDX body**. Metadata fields
(`summary`, `techStack`, `highlights`, `dateRange`, etc.) are hand-authored
directly in the `.mdx` frontmatter and are **not** derived from, nor checked
against, the `Experience/<NAME>.md` source. The same facts may appear in the
source prose (e.g. "0 → ~1,400 checks"), but nothing keeps the frontmatter
numbers in step with the body — the drift gate does **not** cover frontmatter.
When you update a figure in the source prose, update the corresponding
frontmatter field by hand.

**`source:` value syntax (WR-02):** the sync parser accepts a double-quoted,
single-quoted, or bare `source:` value. It does **not** support an inline YAML
comment after a bare value (`source: Experience/X.md # note`) — quote the value
or drop the comment.

## 6. Experience Sync Contract

`Experience/<NAME>.md` is the authoritative source for every experience body.
The body lives in a fenced block, using the **same markers as projects** (D-08):
`<!-- CASE-STUDY-START -->` and `<!-- CASE-STUDY-END -->`. Intro prose above the
fence is not synced.

```markdown
# Holloway Connect — Engineering Experience

<intro prose — KEEP, not synced>

<!-- CASE-STUDY-START -->

<freeform body — Overview, Highlights, Themes, etc.>

<!-- CASE-STUDY-END -->
```

**Fence conventions** (identical to projects §2):

- Markers are literal HTML comments: `<!-- CASE-STUDY-START -->` and `<!-- CASE-STUDY-END -->`.
- Each marker must appear exactly once in the source file.
- Both markers must appear before any code fence (triple-backtick block).
- The start marker must appear before the end marker.

**Freeform bodies (D-07):** Unlike projects, experience bodies have **no required
H2 shape** and **no 600–900-word target**. The 5-H2 order check and the word-count
warnings do NOT apply — an experience body may contain any headings and any length.

**MDX escaping (WR-04):** The synced body is written verbatim into an `.mdx`
file, and MDX compiles it. A bare `<` followed by a word is parsed as JSX
(`<Word>`) and a bare `{` is parsed as a JS expression. Any such token that
appears **outside** an inline-code span (backticks) or fenced code block will
break `astro build`. When writing freeform prose:

- Wrap hazardous tokens in backticks: `` `if (n < 3)` ``, `` `{config}` ``.
- Or escape them: `&lt;` for `<`, and `\{` for `{`.

The sync script does not escape these for you. The CI `astro check` step
(WR-01) now compiles the collection, so an unescaped hazard fails the PR check
rather than only the deploy build.

**What sync writes:** the MDX body (everything after the closing `---` of frontmatter).

**What sync leaves alone:** the entire frontmatter block, preserved byte-for-byte.

## 7. Experience Author Workflow

1. Edit `Experience/<NAME>.md` between the fence markers. Edit nothing else inside the fence range.
2. Run `pnpm sync:experience`.
3. Run `git diff` — review only the body change in the affected `.mdx` file.
4. Run `pnpm check` — confirms `astro check` still passes (Zod intact).
5. Commit `Experience/<NAME>.md` and `src/content/experience/<slug>.mdx` together.

**Do NOT edit `src/content/experience/*.mdx` body content directly.** Hand-edits
will be silently overwritten on the next sync. The CI drift gate
(`pnpm sync:experience:check` on PR) catches cases where the MDX body diverges
from the source. Frontmatter edits ARE allowed and persist (sync preserves
frontmatter byte-for-byte).

## 8. Experience Failure-Mode Matrix

| Error | Where Emitted | Fix |
|-------|---------------|-----|
| `MDX missing opening frontmatter delimiter` | sync, exit 2 | Ensure file starts with `---\n` |
| `MDX missing closing frontmatter delimiter` | sync, exit 2 | Ensure frontmatter has matching closing `---\n` |
| `<slug>.mdx: frontmatter missing required \`source:\` field` | sync, exit 2 | Add `source: "Experience/<NAME>.md"` to frontmatter |
| `<slug>.mdx: source file not found at <path>` | sync, exit 2 | Either the `source:` value is wrong or the source file was renamed. Fix one. |
| `<source>: missing <!-- CASE-STUDY-START -->` | sync, exit 2 | Add fence start marker to source file |
| `<source>: missing <!-- CASE-STUDY-END -->` | sync, exit 2 | Add fence end marker to source file |
| `<source>: fence markers must each appear exactly once` | sync, exit 2 | Source has nested or duplicate markers; clean up |
| `<source>: <!-- CASE-STUDY-END --> appears before <!-- CASE-STUDY-START -->` | sync, exit 2 | Markers are out of order; reorder |
| path escape (`source:` resolves outside repo) | sync, exit 2 | Fix the `source:` path so it stays within the repo |
| `drift detected in <slug>.mdx` | sync --check, exit 1 | Run `pnpm sync:experience` locally and commit the result |
| Zod validation error | `astro check`, build fails | Fix the failing field per Zod error message |

Note: the projects-only H2-shape and word-count **warning** rows are intentionally
absent here — those checks do not run for experience bodies (D-07).
