---
phase: 13
plan: 03
type: execute
wave: 2
depends_on: [01]
files_modified:
  - docs/CONTENT-SCHEMA.md
  - docs/VOICE-GUIDE.md
  - .planning/ROADMAP.md
autonomous: true
requirements: [CONT-07]
must_haves:
  truths:
    - "docs/CONTENT-SCHEMA.md exists with the four required sections (D-17): Frontmatter Schema, Sync Contract, Author Workflow, Failure-Mode Matrix"
    - "docs/VOICE-GUIDE.md exists with the four hard rules (D-11): banlist, numbers-required, past-tense, named-systems — and references seatwatch.mdx as the canonical voice exemplar"
    - ".planning/ROADMAP.md Phase 13 success criterion #1 is amended from 6-H2 (Approach → Architecture) to 5-H2 (Approach & Architecture) per D-02"
    - "All 3 docs/ROADMAP tests from Plan 01 Task 3 PASS GREEN after this plan"
  artifacts:
    - path: "docs/CONTENT-SCHEMA.md"
      provides: "Authoritative content/sync contract reference (CONT-07)"
      min_lines: 80
      contains: "## 4. Failure-Mode Matrix"
    - path: "docs/VOICE-GUIDE.md"
      provides: "Voice + tone + four hard rules (CONT-07)"
      min_lines: 60
      contains: "### Rule 4: Named systems over abstractions"
    - path: ".planning/ROADMAP.md"
      provides: "Phase 13 success criterion #1 reflects locked 5-H2 D-01 shape"
      contains: "Approach & Architecture"
  key_links:
    - from: "docs/CONTENT-SCHEMA.md"
      to: "src/content.config.ts and scripts/sync-projects.mjs"
      via: "Code-wins precedence disclaimer (RESEARCH §6)"
      pattern: "code wins"
    - from: "docs/VOICE-GUIDE.md"
      to: "src/content/projects/seatwatch.mdx"
      via: "Canonical voice exemplar reference (D-10)"
      pattern: "seatwatch\\.mdx"
---

<objective>
Author the two new reference docs (`docs/CONTENT-SCHEMA.md`, `docs/VOICE-GUIDE.md`) and amend ROADMAP.md success criterion #1 to reflect the locked 5-H2 D-01 shape. The docs are the durable contracts that prevent future content drift; the ROADMAP amendment closes a planning paper-trail discrepancy that D-02 explicitly identifies as a Phase 13 deliverable.

Purpose: CONT-07 is fully owned here. D-02 is fully owned here (the amendment is an explicit deliverable, not a drive-by edit, per CONTEXT.md). This plan has no dependency on the sync script itself — the docs DESCRIBE the contract; they don't run it.

Output: Three files, all with grep-verifiable content matching the test assertions from Plan 01 Task 3. After this plan, those 3 tests are GREEN.
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
@design-system/MASTER.md
@src/content/projects/seatwatch.mdx

<interfaces>
<!-- The exact regex assertions Plan 01 Task 3 tests apply to these docs. -->
<!-- Implementation MUST satisfy all of these regexes. -->

```typescript
// tests/content/docs-content-schema.test.ts asserts:
expect(md).toMatch(/^## 1\. Frontmatter Schema/m);
expect(md).toMatch(/^## 2\. Sync Contract/m);
expect(md).toMatch(/^## 3\. Author Workflow/m);
expect(md).toMatch(/^## 4\. Failure-Mode Matrix/m);
expect(md).toMatch(/If anything here\s*disagrees/i);

// tests/content/docs-voice-guide.test.ts asserts:
expect(md).toMatch(/^### Rule 1: No hype/m);
expect(md).toMatch(/^### Rule 2: Numbers or don't claim it/m);
expect(md).toMatch(/^### Rule 3: Past tense for shipped work/m);
expect(md).toMatch(/^### Rule 4: Named systems over abstractions/m);
expect(md).toMatch(/seatwatch\.mdx/);

// tests/content/roadmap-amendment.test.ts asserts:
expect(block).toMatch(/Approach & Architecture/);
expect(block).not.toMatch(/Approach\s*→\s*Architecture/);
```

ROADMAP.md line 69 (current text — must be amended):
```
  1. A visitor opening any of the 6 project detail pages reads a real 600–900 word case study structured Problem → Approach → Architecture → Tradeoffs → Outcome → Learnings — no placeholder prose remains
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Author docs/CONTENT-SCHEMA.md per D-17 four-section spec</name>
  <files>docs/CONTENT-SCHEMA.md</files>
  <read_first>
    - .planning/phases/13-content-pass-projects-sync/13-RESEARCH.md (RESEARCH §6 lines 779-869 — verbatim skeleton with all four sections; copy as starting point)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (PATTERNS §"docs/CONTENT-SCHEMA.md" — analog is design-system/MASTER.md "code wins" precedence pattern)
    - .planning/phases/13-content-pass-projects-sync/13-CONTEXT.md (D-17 four sections required; D-15 Zod + sync split; D-19 resume external-source workflow note)
    - design-system/MASTER.md (analog for "locked contract" doc shape; copy the precedence disclaimer pattern)
    - tests/content/docs-content-schema.test.ts (the regex contract this doc must satisfy — read all assertions)
    - src/content.config.ts (current Zod fields — schema reference must enumerate all 13 post-Plan-02 fields)
    - scripts/sync-projects.mjs (already exists by this wave's parallel plan — read for failure-mode matrix accuracy; if not yet present, use RESEARCH §3 as reference)
  </read_first>
  <behavior>
    Author docs/CONTENT-SCHEMA.md with these exact sections in order:

    Header + precedence disclaimer:
    ```markdown
    # Content Schema

    Authoritative reference for the project content pipeline. If anything here
    disagrees with `src/content.config.ts` or `scripts/sync-projects.mjs`, code wins
    and this doc is wrong; file an issue.
    ```

    ## 1. Frontmatter Schema (Zod)
    Table of all 13 fields (12 existing + source). Columns: Field, Type, Constraint, Example. Include the explicit note: "The `source` field is validated for **string shape only** at build time. File existence is verified by `scripts/sync-projects.mjs` at sync time (different working directory guarantees — see Pitfall 7)."

    ## 2. Sync Contract
    Document the fenced-block convention: literal `<!-- CASE-STUDY-START -->` / `<!-- CASE-STUDY-END -->` markers; both must each appear exactly once; must appear before any code fence in the source file. Five H2s required, in exact order: Problem, Approach & Architecture, Tradeoffs, Outcome, Learnings. Target length: 600–900 words (soft target; warning only — D-16). What sync writes (MDX body) vs what it leaves alone (frontmatter byte-for-byte).

    ## 3. Author Workflow
    Five-step procedure ending in "commit both files together":
    1. Edit `Projects/<n>-<NAME>.md` between fence markers. Edit nothing else inside the fence range.
    2. Run `pnpm sync:projects`.
    3. Run `git diff` — review only the body change in the affected `.mdx` file.
    4. Run `pnpm check` — confirms `astro check` still passes (Zod intact).
    5. Commit `Projects/<n>-<NAME>.md` and `src/content/projects/<slug>.mdx` together.

    Plus an explicit DO-NOT block: "Do NOT edit `src/content/projects/*.mdx` body content directly. Hand-edits will be silently overwritten on the next sync. The CI drift gate (`pnpm sync:check` on PR) catches cases where the MDX body diverges from the source. Frontmatter edits ARE allowed and persist (sync preserves frontmatter byte-for-byte)."

    Plus the Resume PDF subsection per D-19:
    ```markdown
    **Resume PDF workflow (D-19):** The resume source document lives EXTERNAL to this repo (Google Doc / LaTeX template — Jack maintains the actual location). To update:
    1. Edit in the source doc.
    2. Export to PDF.
    3. Replace `public/jack-cutrara-resume.pdf` with the new export.
    4. Commit the binary; verify file size hasn't ballooned unexpectedly (typical: 50–150 KB).
    ```

    ## 4. Failure-Mode Matrix
    Table with columns: Error, Where Emitted, Fix. Include all 12 rows from RESEARCH §6 (lines 853-868) covering: missing opening/closing frontmatter delimiters, missing source field, source file not found, missing/duplicate/out-of-order fence markers, H2 shape mismatch (warning), word count out of band (warning), drift detected (--check exit 1), Zod validation error.
  </behavior>
  <action>
    Create `docs/` directory if it does not exist. Then create `docs/CONTENT-SCHEMA.md` using the verbatim skeleton from RESEARCH.md §6 (lines 781-869). Do NOT modify the section headings — they must match the regex assertions in tests/content/docs-content-schema.test.ts exactly: `## 1. Frontmatter Schema`, `## 2. Sync Contract`, `## 3. Author Workflow`, `## 4. Failure-Mode Matrix` (period after the digit; one space; "Frontmatter Schema" / etc.).

    Modifications to the verbatim skeleton:

    1. **Section 1 — Frontmatter Schema table:** populate all 13 rows. The skeleton has them. Verify the `source | string | required (D-15) | "Projects/1 - SEATWATCH.md"` row is present. Verify the explicit "string shape only" note follows the table.

    2. **Section 2 — Sync Contract:** Replace the placeholder `…(fence convention from §2 Code Examples)…` with the explicit fence convention text:
    ```markdown
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
    ```

    3. **Section 3 — Resume PDF:** Replace `<external location — Google Doc URL>` with `<EXTERNAL — Jack maintains source separately (Google Doc / LaTeX). Update by re-exporting and overwriting the PDF.>`. Do NOT invent a fake URL. The actual location is Jack's call to record (or omit) at execution time.

    4. **Section 4 — Failure-Mode Matrix:** keep all 12 rows verbatim from the skeleton.

    Total file length: target 100–180 lines.
  </action>
  <acceptance_criteria>
    - File `docs/CONTENT-SCHEMA.md` exists.
    - File contains all four required sections (verify: `grep -cE "^## [1-4]\\. (Frontmatter Schema|Sync Contract|Author Workflow|Failure-Mode Matrix)" docs/CONTENT-SCHEMA.md` returns 4).
    - File contains the precedence disclaimer (verify: `grep -ci "If anything here\\s*disagrees" docs/CONTENT-SCHEMA.md` returns ≥ 1).
    - Section 1 enumerates `source` field (verify: `grep -c "| source |" docs/CONTENT-SCHEMA.md` returns ≥ 1).
    - Section 1 has 13 schema field rows (verify: `grep -cE "^\\| (title|tagline|description|techStack|featured|status|githubUrl|demoUrl|thumbnail|category|order|year|source) \\|" docs/CONTENT-SCHEMA.md` returns ≥ 13).
    - Section 2 documents the literal fence markers (verify: `grep -c "CASE-STUDY-START\\|CASE-STUDY-END" docs/CONTENT-SCHEMA.md` returns ≥ 2).
    - Section 2 lists all 5 H2s in D-01 order (verify: `grep -cE "(Problem|Approach & Architecture|Tradeoffs|Outcome|Learnings)" docs/CONTENT-SCHEMA.md` returns ≥ 5).
    - Section 3 contains the "Do NOT edit" warning (verify: `grep -ci "Do NOT edit" docs/CONTENT-SCHEMA.md` returns ≥ 1).
    - Section 3 has the Resume PDF workflow subsection (verify: `grep -ci "Resume PDF workflow" docs/CONTENT-SCHEMA.md` returns ≥ 1).
    - Section 4 has at least 10 failure-mode rows (verify: `grep -cE "^\\| (\\\\\`|MDX|Zod|drift|<)" docs/CONTENT-SCHEMA.md` returns ≥ 10).
    - `pnpm test tests/content/docs-content-schema.test.ts` passes GREEN.
  </acceptance_criteria>
  <verify>
    <automated>pnpm test tests/content/docs-content-schema.test.ts 2>&1 | tail -10</automated>
  </verify>
  <done>docs/CONTENT-SCHEMA.md authored with all four required sections, precedence disclaimer, complete schema table, fence convention, author workflow including resume PDF, and 12-row failure-mode matrix. Plan 01 Task 3 docs-content-schema.test.ts is GREEN.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Author docs/VOICE-GUIDE.md per D-09/D-10/D-11 spec</name>
  <files>docs/VOICE-GUIDE.md</files>
  <read_first>
    - .planning/phases/13-content-pass-projects-sync/13-RESEARCH.md (RESEARCH §7 lines 871-953 — verbatim skeleton)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (PATTERNS §"docs/VOICE-GUIDE.md" — analog is MASTER.md for shape; seatwatch.mdx for canonical voice example)
    - .planning/phases/13-content-pass-projects-sync/13-CONTEXT.md (D-09 voice-by-surface table; D-10 engineering-journal tone; D-11 four hard rules)
    - design-system/MASTER.md (style-contract analog)
    - src/content/projects/seatwatch.mdx (canonical voice exemplar — current file is the reference per D-10)
    - tests/content/docs-voice-guide.test.ts (regex contract this doc must satisfy)
  </read_first>
  <behavior>
    Author docs/VOICE-GUIDE.md with these sections:

    Header:
    ```markdown
    # Voice Guide

    The site speaks in Jack's voice. The chat widget speaks ABOUT Jack.
    ```

    ## Voice by Surface
    Table mapping surface → person → tense → tone, with rows: About page (1st, present + past, direct), Homepage hero / lead (1st, present, confident restrained), MDX case studies (1st, past, engineering-journal), Resume PDF (1st, past, standard resume), Chat widget (3rd, past + present, helpful third-party — see Phase 14).

    ## Engineering-Journal Tone (Case Studies)
    State that `src/content/projects/seatwatch.mdx` post-Phase 13 rewrite is the canonical example. Bullet list:
    - Concrete numbers, not adjectives (with 48,000 LOC vs "large codebase" example).
    - Named systems (with "dual-strategy booking engine" vs "advanced booking system" example).
    - Tradeoffs visible.
    - Lessons surfaced.

    ## The Four Hard Rules (D-11)
    Each rule as an ### subsection with the exact heading text the test asserts:
    - `### Rule 1: No hype / AI-tells banlist` — list the banned words: revolutionary, seamless, leverage (verb), robust, scalable (with caveat: allowed if quantified per D-11), "dive deeper", "elevate", "supercharge", emoji of any kind in body prose, em-dash abuse (max one per paragraph).
    - `### Rule 2: Numbers or don't claim it` — table of don't/do examples: lightning fast → sub-second p99; highly available → 99.9% uptime over 6 months; etc. (4 rows minimum).
    - `### Rule 3: Past tense for shipped work` — table of don't/do examples (3 rows minimum) + carve-out for present tense (active work, timeless system descriptions).
    - `### Rule 4: Named systems over abstractions` — table of don't/do examples (4 rows minimum) + the "proper noun appears in code so readers can grep" rationale.
  </behavior>
  <action>
    Create `docs/VOICE-GUIDE.md` using the verbatim skeleton from RESEARCH.md §7 (lines 873-953). The skeleton already satisfies every test assertion. Make these explicit modifications:

    1. **Section heading exactness:** the four Rule subsections MUST start with `### Rule 1: No hype` / `### Rule 2: Numbers or don't claim it` / `### Rule 3: Past tense for shipped work` / `### Rule 4: Named systems over abstractions` (verbatim — that's what the test regexes match). Do not abbreviate, reorder, or stylize.

    2. **Engineering-Journal Tone section** must contain the exact string `seatwatch.mdx` (the test asserts /seatwatch\\.mdx/). The skeleton has "src/content/projects/seatwatch.mdx" — keep it.

    3. **No invented examples.** Use the don't/do tables from the skeleton verbatim. Rule 1 banlist matches D-11 verbatim including the "scalable (unless paired with a number)" carve-out.

    4. **Cross-reference to seatwatch.mdx:** add a single sentence after the Engineering-Journal Tone bullets:
    ```markdown
    See `src/content/projects/seatwatch.mdx` — its 5 H2s (Problem, Approach & Architecture, Tradeoffs, Outcome, Learnings) and named-systems prose are the structural and stylistic standard for every case study.
    ```

    Total file length: target 80–140 lines.
  </action>
  <acceptance_criteria>
    - File `docs/VOICE-GUIDE.md` exists.
    - All four Rule subsections present with exact heading text (verify: `grep -cE "^### Rule [1-4]:" docs/VOICE-GUIDE.md` returns 4).
    - Rule 1 heading matches the test regex (verify: `grep -c "^### Rule 1: No hype" docs/VOICE-GUIDE.md` returns 1).
    - Rule 2 heading matches (verify: `grep -c "^### Rule 2: Numbers or don" docs/VOICE-GUIDE.md` returns 1).
    - Rule 3 heading matches (verify: `grep -c "^### Rule 3: Past tense for shipped work" docs/VOICE-GUIDE.md` returns 1).
    - Rule 4 heading matches (verify: `grep -c "^### Rule 4: Named systems over abstractions" docs/VOICE-GUIDE.md` returns 1).
    - File references seatwatch.mdx (verify: `grep -c "seatwatch\\.mdx" docs/VOICE-GUIDE.md` returns ≥ 1).
    - Voice-by-surface table contains all 5 surfaces (verify: `grep -cE "(About page|Homepage hero|MDX case studies|Resume PDF|Chat widget)" docs/VOICE-GUIDE.md` returns ≥ 5).
    - Banlist contains the D-11 words (verify: `grep -cE "(revolutionary|seamless|leverage|robust|dive deeper)" docs/VOICE-GUIDE.md` returns ≥ 5).
    - `pnpm test tests/content/docs-voice-guide.test.ts` passes GREEN.
  </acceptance_criteria>
  <verify>
    <automated>pnpm test tests/content/docs-voice-guide.test.ts 2>&1 | tail -10</automated>
  </verify>
  <done>docs/VOICE-GUIDE.md authored with voice-by-surface table, engineering-journal tone bullets, all four hard rules with don't/do tables, and seatwatch.mdx canonical-example reference. Plan 01 Task 3 docs-voice-guide.test.ts is GREEN.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Amend ROADMAP.md Phase 13 success criterion #1 to 5-H2 D-01 shape</name>
  <files>.planning/ROADMAP.md</files>
  <read_first>
    - .planning/ROADMAP.md (current file; success criterion #1 is at line 69 of the Phase 13 entry — confirm exact line with `grep -n` first)
    - .planning/phases/13-content-pass-projects-sync/13-CONTEXT.md (D-02 — explicit deliverable status; not a drive-by edit)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (PATTERNS §".planning/ROADMAP.md" — single character-range edit, preserve all other characters)
    - tests/content/roadmap-amendment.test.ts (the regex contract that must hold after the edit)
  </read_first>
  <behavior>
    Locate the Phase 13 success criterion #1 in `.planning/ROADMAP.md`. Current text:
    ```
      1. A visitor opening any of the 6 project detail pages reads a real 600–900 word case study structured Problem → Approach → Architecture → Tradeoffs → Outcome → Learnings — no placeholder prose remains
    ```
    Replace with:
    ```
      1. A visitor opening any of the 6 project detail pages reads a real 600–900 word case study structured Problem → Approach & Architecture → Tradeoffs → Outcome → Learnings — no placeholder prose remains
    ```
    Single substitution: `Approach → Architecture` becomes `Approach & Architecture` (one ` → ` separator removed; ampersand inserted). Every other character of the line preserved. No other lines in ROADMAP.md change.
  </behavior>
  <action>
    Use the Edit tool on `.planning/ROADMAP.md` with these exact strings:

    OLD (find this exact string):
    ```
      1. A visitor opening any of the 6 project detail pages reads a real 600–900 word case study structured Problem → Approach → Architecture → Tradeoffs → Outcome → Learnings — no placeholder prose remains
    ```

    NEW (replace with):
    ```
      1. A visitor opening any of the 6 project detail pages reads a real 600–900 word case study structured Problem → Approach & Architecture → Tradeoffs → Outcome → Learnings — no placeholder prose remains
    ```

    Important: copy the OLD string from the actual ROADMAP.md (use Read first to verify the exact byte sequence, including the en-dashes `–` in "600–900" and the right-arrows `→` between H2 names — these are special Unicode characters, not ASCII). Do not retype them.

    After the edit, run the roadmap test (`pnpm test tests/content/roadmap-amendment.test.ts`) and confirm GREEN. If RED, the test extraction logic split on Phase 14: header — verify Phase 14 entry still exists with `### Phase 14:` header; if so the test is correct and the edit must be re-checked.

    Do NOT change any other part of ROADMAP.md. Do NOT add a "this was amended on date X" annotation in the body of the doc — git history is the audit trail per the project's existing convention. The phase-end SUMMARY.md will note the amendment.
  </action>
  <acceptance_criteria>
    - The literal string `Approach & Architecture` appears in ROADMAP.md (verify: `grep -c "Approach & Architecture" .planning/ROADMAP.md` returns ≥ 1).
    - The literal string `Approach → Architecture` does NOT appear (verify: `grep -c "Approach → Architecture" .planning/ROADMAP.md` returns 0).
    - The Phase 13 entry header is unchanged (verify: `grep -c "^### Phase 13: Content Pass" .planning/ROADMAP.md` returns 1).
    - The Phase 14 entry header is unchanged (verify: `grep -c "^### Phase 14: Chat Knowledge Upgrade" .planning/ROADMAP.md` returns 1).
    - Only one line changed in the diff (verify: `git diff --numstat .planning/ROADMAP.md | awk '{print $1"+"$2}'` shows 1+1 — one insertion, one deletion).
    - `pnpm test tests/content/roadmap-amendment.test.ts` passes GREEN.
  </acceptance_criteria>
  <verify>
    <automated>pnpm test tests/content/roadmap-amendment.test.ts 2>&1 | tail -10</automated>
  </verify>
  <done>ROADMAP.md Phase 13 success criterion #1 reads "Approach & Architecture" (5-H2); old "Approach → Architecture" (6-H2) is gone; only one line changed in the diff; Plan 01 Task 3 roadmap-amendment.test.ts is GREEN.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| n/a | This plan only authors documentation and amends a planning doc. No code, no scripts, no CI. No untrusted input crosses any boundary. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-13-DOC-01 | Information Disclosure | docs/CONTENT-SCHEMA.md (resume external-source location) | accept | Section 3 deliberately leaves the external resume source location as a placeholder for Jack to fill in (or omit). No risk of leaking a private URL inadvertently because executor is instructed to NOT invent one. |

T-13-01, T-13-02, T-13-03 do not apply — this plan touches no code paths and no CI workflow.
</threat_model>

<verification>
After this plan runs, all 3 docs/ROADMAP tests from Plan 01 Task 3 are GREEN. Two new files exist under docs/. ROADMAP.md success criterion #1 reflects the locked 5-H2 D-01 shape.

Verification commands:
```bash
pnpm test tests/content/docs-content-schema.test.ts
pnpm test tests/content/docs-voice-guide.test.ts
pnpm test tests/content/roadmap-amendment.test.ts
ls docs/                                          # CONTENT-SCHEMA.md and VOICE-GUIDE.md present
git diff .planning/ROADMAP.md                     # One-line diff: Approach → Architecture became Approach & Architecture
```
</verification>

<success_criteria>
- [ ] docs/CONTENT-SCHEMA.md authored with all four sections + precedence disclaimer + 13-row schema table + 12-row failure matrix
- [ ] docs/VOICE-GUIDE.md authored with voice-by-surface table + engineering-journal tone + four hard rules + seatwatch.mdx reference
- [ ] .planning/ROADMAP.md success criterion #1 amended (single-line diff) per D-02
- [ ] All 3 docs/ROADMAP tests from Plan 01 Task 3 are GREEN
- [ ] No other ROADMAP.md content modified
</success_criteria>

<output>
After completion, create `.planning/phases/13-content-pass-projects-sync/13-03-docs-and-roadmap-SUMMARY.md` documenting:
- File sizes (CONTENT-SCHEMA.md and VOICE-GUIDE.md line counts)
- Confirmation that 3 Plan 01 Task 3 tests are GREEN
- Single-line ROADMAP.md diff captured for audit trail
- Resume external-source location: noted as Jack's call (or recorded if Jack supplied it during execution)
</output>
