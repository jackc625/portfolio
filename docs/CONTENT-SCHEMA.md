# Content Schema

Authoritative reference for the project content pipeline. If anything here
disagrees with `src/content.config.ts` or `scripts/sync-projects.mjs`, code wins
and this doc is wrong; file an issue.

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
