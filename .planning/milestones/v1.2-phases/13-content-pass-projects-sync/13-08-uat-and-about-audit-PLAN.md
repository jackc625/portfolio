---
phase: 13
plan: 08
type: execute
wave: 5
depends_on: [03, 04, 05, 06, 07]
files_modified:
  - .planning/phases/13-content-pass-projects-sync/13-UAT.md
  - src/data/about.ts
  - src/pages/about.astro
  - src/pages/index.astro
autonomous: false
requirements: [CONT-01, CONT-02, CONT-03, CONT-04]
must_haves:
  truths:
    - ".planning/phases/13-content-pass-projects-sync/13-UAT.md exists with the documented per-surface checklist (D-18 enumeration)"
    - "Each surface in 13-UAT.md has a result field initialized to 'pending' awaiting Jack's manual verification"
    - "Jack's manual UAT signoff is captured in 13-UAT.md (each pending row updated to passed | issue | fixed)"
    - "If About page narrative needs edits per Jack's UAT, src/data/about.ts is updated WITH new dated /* Verified: YYYY-MM-DD */ annotations reflecting the new edit date"
    - "If homepage display hero / status dot / meta label / work-list copy needs edits per Jack's UAT, the relevant Astro file is updated"
    - "All 13 case-study tests + 4 docs/data tests + ROADMAP test from Plan 01 are GREEN at end of plan"
  artifacts:
    - path: ".planning/phases/13-content-pass-projects-sync/13-UAT.md"
      provides: "Manual UAT checklist signed off by Jack covering CONT-03 + CONT-04 surfaces"
      min_lines: 80
      contains: "## Summary"
  key_links:
    - from: ".planning/phases/13-content-pass-projects-sync/13-UAT.md"
      to: "src/data/about.ts and src/pages/index.astro and src/pages/about.astro and public/jack-cutrara-resume.pdf"
      via: "Per-surface verification rows pointing to specific file:line references"
      pattern: "src/data/about\\.ts|src/pages/(index|about)\\.astro|jack-cutrara-resume\\.pdf"
---

<objective>
Author the manual UAT checklist (`13-UAT.md`) covering every surface enumerated by D-18 (homepage display hero, status dot, meta label, 3 work-list rows, about strip, About page full narrative, each of 6 project detail pages, resume PDF page-by-page), then run the manual UAT with Jack and capture the signoff. Apply any required edits to `src/data/about.ts`, `src/pages/about.astro`, or `src/pages/index.astro` based on UAT findings, refreshing dated `/* Verified: */` annotations to reflect the new edit date.

Purpose: Closes CONT-03 (About narrative verified) and CONT-04 (homepage / work list / resume copy verified) at the human-verification layer. CONT-01 and CONT-02 already passed automated tests in Wave 4; this plan adds the human quality gate per D-07 redline cycle and D-18 dated-annotation evidence mechanism.

Output: A signed-off `13-UAT.md` documenting every surface's pass/issue/fix status. Possibly minor edits to about.ts / index.astro / about.astro based on UAT findings. Resume PDF re-export workflow (D-19) — Jack performs externally and replaces the asset.

**Checkpoint nature:** This plan contains a `checkpoint:human-verify` task (Task 2) — Jack must run the UAT manually. The plan is `autonomous: false`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/13-content-pass-projects-sync/13-CONTEXT.md
@.planning/phases/13-content-pass-projects-sync/13-RESEARCH.md
@.planning/phases/13-content-pass-projects-sync/13-PATTERNS.md
@.planning/phases/13-content-pass-projects-sync/13-VALIDATION.md
@.planning/phases/12-tech-debt-sweep/12-UAT.md
@docs/CONTENT-SCHEMA.md
@docs/VOICE-GUIDE.md
@src/data/about.ts
@src/pages/about.astro
@src/pages/index.astro
@public/jack-cutrara-resume.pdf

<interfaces>
<!-- 13-UAT.md frontmatter shape (mirror 12-UAT.md exactly): -->
```yaml
---
status: pending     # → in-progress → complete
phase: 13-content-pass-projects-sync
source:
  - 13-01-test-stubs-wave-zero-SUMMARY.md
  - 13-02-sync-infra-SUMMARY.md
  - 13-03-docs-and-roadmap-SUMMARY.md
  - 13-04-daytrade-rename-and-anchors-SUMMARY.md
  - 13-05-case-studies-batch-a-SUMMARY.md
  - 13-06-case-studies-batch-b-SUMMARY.md
  - 13-07-case-studies-batch-c-SUMMARY.md
started: <ISO date>
updated: <ISO date>
---
```

<!-- Per-test block shape (mirror 12-UAT.md): -->
```markdown
### N. <Surface Name>
expected: <what Jack should verify; specific file:line and exact copy expected>
result: pending | passed | issue | fixed | skipped
reported: "<Jack's words if issue>"
severity: trivial | minor | major | blocker
evidence: |
  <screenshot path or transcript>
fix: |
  <what was changed and where, if fix applied in this plan>
```

<!-- Required UAT rows (D-18 enumeration): -->
1. Homepage display hero (`JACK CUTRARA` + lead) — exact copy match against current src/pages/index.astro
2. Homepage status dot ("AVAILABLE FOR WORK") — exact copy match
3. Homepage meta label ("EST. 2026 · NORTHERN VA") — exact copy match
4. Homepage 3 work-list rows — titles + tech stacks for SeatWatch / NFL Prediction / SolSniper (the 3 featured: true entries)
5. Homepage about strip — ABOUT_INTRO + ABOUT_P1 rendered match (compare to src/data/about.ts)
6. About page full narrative — all four ABOUT_* exports
7-12. Each of 6 project detail pages — title, tagline, year, tech stack, body (against the new 5-H2 case study), demoUrl/githubUrl links
13. Resume PDF page-by-page — content matches Jack's current resume / status / projects
14. Contact section links — email mailto:, GitHub URL, LinkedIn URL, X null

<!-- Summary block (D-18 evidence aggregation): -->
```markdown
## Summary

total: 14
passed: <N>
issues: <N>
fixed: <N>
pending: 0
skipped: <N>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author 13-UAT.md from 12-UAT.md template + D-18 enumeration</name>
  <files>.planning/phases/13-content-pass-projects-sync/13-UAT.md</files>
  <read_first>
    - .planning/phases/12-tech-debt-sweep/12-UAT.md (exact format/frontmatter/per-test-block/summary template — mirror byte-for-byte for shape)
    - .planning/phases/13-content-pass-projects-sync/13-CONTEXT.md (D-18 enumeration; D-19 resume PDF workflow)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (PATTERNS §".planning/phases/13-content-pass-projects-sync/13-UAT.md" — exact pattern to copy)
    - src/pages/index.astro (homepage — capture EXACT current copy for the display hero, status dot, meta label, work-list entries; UAT rows must contain the exact strings to verify against)
    - src/pages/about.astro (about page — capture surface to verify)
    - src/data/about.ts (current ABOUT_* string values — UAT rows reference these exactly)
    - src/data/portfolio-context.json (canonical project descriptions — work-list UAT references these tech stacks)
    - src/content/projects/*.mdx (post-Plans-04-07 state; project detail UAT rows reference each frontmatter)
    - public/jack-cutrara-resume.pdf (existence verified by Plan 01 resume-asset.test.ts; Jack verifies content during UAT)
  </read_first>
  <behavior>
    Create `.planning/phases/13-content-pass-projects-sync/13-UAT.md` mirroring the structure of `.planning/phases/12-tech-debt-sweep/12-UAT.md` exactly.

    Frontmatter:
    - status: pending (will progress to in-progress, then complete after Task 2)
    - phase: 13-content-pass-projects-sync
    - source: list of all 7 SUMMARY.md files (13-01 through 13-07)
    - started: today's ISO date (executor uses `date -Iseconds`)
    - updated: same as started

    Body has 14 numbered tests in this exact order, each as an `### N. <Title>` block with the standard fields (expected / result / reported / severity / evidence / fix). Initial state of every result field = "pending".

    Per-row content (read each UAT row carefully — the `expected:` field MUST contain the exact strings Jack will compare against, sourced from the current files):

    1. Homepage display hero — expected: navigate to http://localhost:4321; verify the .display element shows "JACK CUTRARA" (read exact string from src/pages/index.astro); verify the lead paragraph reads exactly as in src/pages/index.astro
    2. Homepage status dot — expected: shows "AVAILABLE FOR WORK" (or whatever current copy is — verify against index.astro before writing UAT row)
    3. Homepage meta label — expected: shows "EST. 2026 · NORTHERN VA" (or current value)
    4. Homepage 3 work-list rows — expected: 3 rows, in the order set by featured: true + order field (currently SeatWatch / NFL Prediction / SolSniper); each row's title and tech-stack chip list matches the corresponding MDX frontmatter
    5. Homepage about strip — expected: shows ABOUT_INTRO + ABOUT_P1 verbatim from src/data/about.ts; quote both strings in the expected: field
    6. About page full narrative — expected: open /about; verify ABOUT_INTRO + ABOUT_P1 + ABOUT_P2 + ABOUT_P3 render verbatim; quote all four strings
    7-12. Six project detail pages — for each (clipify, daytrade, nfl-predict, optimize-ai, seatwatch, solsniper): open /projects/<slug>; verify title matches MDX frontmatter; tagline matches; year matches; tech stack chips match; body has 5 H2s in D-01 order; body word count is in 600-900 band (info from sync output); links (githubUrl/demoUrl) work and don't 404
    13. Resume PDF — expected: open public/jack-cutrara-resume.pdf in viewer; verify name + title + dates + contact + projects list + tech list match Jack's current resume as of today; if outdated, re-export per D-19 (Google Docs / LaTeX → PDF → overwrite + commit)
    14. Contact section links — expected: email mailto: works, GitHub URL resolves, LinkedIn URL resolves, X handle is null/absent (verify against src/data/contact.ts)

    Summary block at end (initial counts):
    ```markdown
    ## Summary

    total: 14
    passed: 0
    issues: 0
    fixed: 0
    pending: 14
    skipped: 0
    ```

    Use the same yaml-in-markdown counter shape as 12-UAT.md.
  </behavior>
  <action>
    Step 1 — Read `.planning/phases/12-tech-debt-sweep/12-UAT.md` end-to-end to copy the exact format (frontmatter shape, test-block shape, summary block shape).

    Step 2 — Read each "current state" file to capture exact strings for the `expected:` fields:
    - `src/pages/index.astro` — display hero, status dot, meta label, about strip wiring
    - `src/data/about.ts` — all four ABOUT_* values
    - `src/pages/about.astro` — render structure
    - `src/data/contact.ts` — contact link values
    - All 6 `src/content/projects/*.mdx` — frontmatter (title, tagline, year, techStack, githubUrl, demoUrl)

    Step 3 — Write `.planning/phases/13-content-pass-projects-sync/13-UAT.md` with the 14 numbered tests in the order documented in the behavior block. Initial state: every `result: pending`. Initial summary counts: total=14, pending=14, others=0.

    Use today's ISO date for `started` and `updated` (executor reads `date -Iseconds` at execute time).

    Step 4 — Verify the file is structurally sound:
    ```bash
    grep -c "^### [0-9]\\+\\." .planning/phases/13-content-pass-projects-sync/13-UAT.md   # 14
    grep -c "^result: pending" .planning/phases/13-content-pass-projects-sync/13-UAT.md   # 14
    grep -c "^## Summary" .planning/phases/13-content-pass-projects-sync/13-UAT.md         # 1
    ```
  </action>
  <acceptance_criteria>
    - File `.planning/phases/13-content-pass-projects-sync/13-UAT.md` exists.
    - File has frontmatter with `status: pending`, `phase: 13-content-pass-projects-sync`, `source:` listing 7 SUMMARY files, `started` and `updated` with today's date.
    - File has exactly 14 `### N.` test blocks (verify: `grep -c "^### [0-9]" .planning/phases/13-content-pass-projects-sync/13-UAT.md` returns 14).
    - File has 14 `result: pending` initial values (verify with grep).
    - Test 5 quotes the exact ABOUT_INTRO + ABOUT_P1 strings (verify: file contains substring "I'm Jack" — the start of ABOUT_INTRO).
    - Test 6 quotes all four ABOUT_* strings (verify: file contains substring "I reach for the boring tool first" — start of ABOUT_P2 — and "Right now I'm looking for" — start of ABOUT_P3).
    - Tests 7-12 cover all 6 project slugs (verify: file contains `clipify`, `daytrade`, `nfl-predict`, `optimize-ai`, `seatwatch`, `solsniper` each at least once — `for s in clipify daytrade nfl-predict optimize-ai seatwatch solsniper; do grep -c "$s" .planning/phases/13-content-pass-projects-sync/13-UAT.md; done` returns ≥ 1 each).
    - Test 13 references the resume PDF and D-19 re-export workflow (verify: file contains `jack-cutrara-resume.pdf` and references "D-19" or "Google Docs").
    - Summary block present with initial counts (verify: file contains `total: 14` and `pending: 14`).
  </acceptance_criteria>
  <verify>
    <automated>test -f .planning/phases/13-content-pass-projects-sync/13-UAT.md && grep -c "^### [0-9]" .planning/phases/13-content-pass-projects-sync/13-UAT.md | awk '{ if ($1 == 14) exit 0; else exit 1 }'</automated>
  </verify>
  <done>13-UAT.md authored with 14 pending test rows, frontmatter mirroring 12-UAT.md, exact-copy assertions for each surface; ready for Jack's manual UAT in Task 2.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Run manual UAT with Jack — verify all 14 surfaces, capture results, apply fixes</name>
  <what-built>
    All Phase 13 automation has completed: sync infrastructure (Plan 02), docs + ROADMAP amendment (Plan 03), Daytrade rename (Plan 04), all 6 case-study rewrites (Plans 05-07), and the 13-UAT.md checklist (Task 1 above). Every CONT-XX automated test is GREEN. The remaining quality gate is Jack's manual verification of every surface a recruiter or engineer will read on the live site.
  </what-built>
  <how-to-verify>
    Step 1 — Boot the dev server:
    ```bash
    pnpm dev
    ```
    Wait for "Local: http://localhost:4321".

    Step 2 — For each of the 14 tests in `.planning/phases/13-content-pass-projects-sync/13-UAT.md`:
    1. Read the `expected:` field — it states the exact surface and the exact copy/behavior to verify.
    2. Perform the verification (open the URL, read the surface, compare against the expected strings).
    3. Update the test block's `result:` field to `passed` if it matches, or `issue` if it doesn't.
    4. If `issue`, fill in `reported:` (your description), `severity:` (trivial/minor/major/blocker), `evidence:` (screenshot or transcript snippet).

    Step 3 — Apply fixes for any `issue` rows during this UAT cycle (do NOT defer to a follow-up plan if the fix is small):
    - About page narrative needs edits → update `src/data/about.ts` strings AND refresh the `/* Verified: YYYY-MM-DD */` annotation lines to today's date (the prior date now reflects the previous verified state; the new date marks this re-verification).
    - Homepage display hero / status dot / meta label needs edits → update `src/pages/index.astro` directly.
    - Work-list copy needs edits → update either the MDX frontmatter (preferred — preserves the work-list source-of-truth) OR src/pages/index.astro if the issue is template-side.
    - Project detail page copy needs edits → update the MDX BODY by re-editing the corresponding `Projects/<n>-<NAME>.md` fenced block and re-running `pnpm sync:projects`. (Do NOT hand-edit the MDX body directly per CONTENT-SCHEMA §3 author workflow.)
    - Resume PDF needs update → re-export from external source per D-19 and replace `public/jack-cutrara-resume.pdf`.
    - Contact links broken → update `src/data/contact.ts`.

    For each fix, fill in the test block's `fix:` field with what was changed and where (file:line reference).

    Step 4 — After all 14 tests are non-pending, update the `## Summary` block:
    ```yaml
    total: 14
    passed: <count>
    issues: <count of result: issue (unfixed)>
    fixed: <count of result: fixed>
    pending: 0
    skipped: <count of result: skipped, e.g., resume PDF if Jack chooses not to re-export this round>
    ```
    Update the frontmatter `status:` to `complete` and `updated:` to today's ISO date.

    Step 5 — Re-run all automated tests to confirm no regression:
    ```bash
    pnpm test                      # all suites pass
    pnpm check                     # exit 0
    pnpm sync:check                # exit 0
    pnpm build                     # all 6 routes emit
    ```

    Step 6 — Stop the dev server (`pkill -f "astro dev"` or Ctrl-C in the dev terminal).
  </how-to-verify>
  <action>This is a checkpoint:human-verify task. Jack performs the verification interactively per the &lt;how-to-verify&gt; block above. Claude does NOT execute the verification; Claude pauses and waits for Jack's resume-signal. After resume, Claude commits the updated 13-UAT.md plus any file edits Jack applied during the UAT cycle.</action>
  <verify><automated>grep -c "^result: pending" .planning/phases/13-content-pass-projects-sync/13-UAT.md | awk '{ if ($1 == 0) exit 0; else exit 1 }'</automated></verify>
  <done>13-UAT.md has zero pending result rows; status frontmatter is complete; updated date is today; any UAT-applied edits are in working tree (committed by Plan 09 phase orchestrator).</done>
  <resume-signal>Type "approved" when 13-UAT.md status is "complete" and all 14 tests have non-pending results, OR describe any blocker you encountered (e.g., "all UI checks passed but the resume PDF needs re-export which I'll do tomorrow — set test 13 to skipped").</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| dev server→browser→Jack | Visual + interactive UAT; Jack is the trust anchor |
| any edits→git working tree | Fixes applied during UAT must be staged + committed by Plan 09 phase-gate |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-13-06 | Repudiation | UAT signoff | mitigate | Each test row's result/reported/evidence/fix fields are committed to git; git blame on 13-UAT.md is the durable record of who-verified-what-when (D-18 evidence mechanism) |

T-13-01..05 not in scope here — sync script, CI workflow, portfolio-context.json, and case-study authoring are owned by earlier plans.
</threat_model>

<verification>
After this plan runs:
- 13-UAT.md status: complete; all 14 tests have non-pending results
- Any UAT-discovered issues either fixed in this plan or annotated as blockers
- All automated tests still GREEN after fixes (no regression)
- src/data/about.ts annotations reflect any new edit dates if About copy was touched

Verification commands:
```bash
grep -c "^result: pending" .planning/phases/13-content-pass-projects-sync/13-UAT.md   # 0
grep -c "^status: complete" .planning/phases/13-content-pass-projects-sync/13-UAT.md  # 1
pnpm test && pnpm check && pnpm sync:check && pnpm build
```
</verification>

<success_criteria>
- [ ] 13-UAT.md exists with 14 test rows + summary block
- [ ] Every test row has a non-pending result (passed | issue | fixed | skipped) with evidence
- [ ] Frontmatter status is "complete"; updated date is today
- [ ] Any About copy edits in src/data/about.ts have refreshed `/* Verified: YYYY-MM-DD */` annotations
- [ ] All automated tests still GREEN after any fixes
- [ ] CONT-03 + CONT-04 closed at human-verification layer (CONT-01 + CONT-02 already closed at automated layer)
</success_criteria>

<output>
After completion, create `.planning/phases/13-content-pass-projects-sync/13-08-uat-and-about-audit-SUMMARY.md` documenting:
- UAT counts (passed / issues / fixed / skipped) and any open blockers
- List of files edited during UAT (per row's fix: field) with file:line references
- Confirmation that all automated tests still pass after fixes
- Resume PDF re-export status (done / deferred / not-needed)
- Any issues escalated for Jack's follow-up
</output>
