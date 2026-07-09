---
phase: 21
reviewers: [codex]
reviewed_at: 2026-07-09T04:34:43Z
plans_reviewed: [21-01-PLAN.md, 21-02-PLAN.md, 21-03-PLAN.md, 21-04-PLAN.md]
reviewer_notes: "gemini CLI unavailable this run (per user); claude skipped for reviewer independence (executing inside Claude Code). Single external reviewer: codex (codex-cli 0.142.2, source-grounded against the working tree)."
---

# Cross-AI Plan Review — Phase 21

## Codex Review

**Summary**
The plans are strong overall and closely follow the existing projects pipeline. The architecture is additive, uses proven repo patterns, and keeps sync out of `build`, which matches `package.json:13` and the existing scripts at `package.json:24-25`. I found no high-severity blocker. The main risks are verification gaps: write-mode idempotency is not fully mirrored, the path-escape test may not actually assert exit code 2, and SC3's "query returns reverse-chronological order" is only tested as a mock comparator, not implemented as a reusable query contract.

**Strengths**
- 21-01 correctly mirrors the real sync mechanism: frontmatter parsing and fence extraction are exported in `scripts/sync-projects.mjs:63-119`, the path guard is at `scripts/sync-projects.mjs:163-170`, diff/check behavior is at `scripts/sync-projects.mjs:181-198`, and exit codes are centralized at `scripts/sync-projects.mjs:233-235`.
- The D-07 strip is well scoped: project-only `wordCount` / `checkH2Shape` live at `scripts/sync-projects.mjs:121-144` and are invoked at `scripts/sync-projects.mjs:184-185`, so removing them for experience is straightforward.
- 21-02 matches the actual Astro content pattern in `src/content.config.ts:1-7` and extends the existing export at `src/content.config.ts:25`. Avoiding `.min(1)` on experience `techStack` is correct because projects currently enforce that at `src/content.config.ts:12`.
- 21-03's Holloway fence placement is correct against the source: the H1 is at `Experience/HOLLOWAY_EXPERIENCE.md:1`, the contract lede is at `Experience/HOLLOWAY_EXPERIENCE.md:3`, and the body continues through Overview, Highlights, and Themes at `Experience/HOLLOWAY_EXPERIENCE.md:5-53`.
- 21-04 follows the existing CI/docs shape: path filters are already in `.github/workflows/sync-check.yml:5-13`, the projects sync gate is `.github/workflows/sync-check.yml:38-39`, and the docs already define schema, sync, workflow, and failure-mode sections at `docs/CONTENT-SCHEMA.md:7-124`.

**Concerns**
- MEDIUM - 21-01 omits the third existing sync test analog. The repo has a dedicated write-mode idempotency test in `tests/scripts/sync-projects-idempotency.test.ts:26-113`, including the important "second run does not rewrite" mtime assertion at `tests/scripts/sync-projects-idempotency.test.ts:103-112`. `--check` drift tests alone would not catch a script that rewrites unchanged files every run.
- MEDIUM - 21-01 says the path-traversal test proves exit 2, but mirroring the current test verbatim would only prove the message. The existing test checks `escapes project root` at `tests/scripts/sync-projects.test.ts:110-123` and never asserts `err.status === 2`, while exit 2 is part of the script contract at `scripts/sync-projects.mjs:233-235`.
- MEDIUM - SC3 is under-specified as implementation. Existing collection consumers explicitly sort at query sites, for example `src/pages/index.astro:14-16`, `src/pages/projects.astro:8-11`, and `src/pages/projects/[id].astro:8-12`. A mock comparator test proves the comparator, but it does not make `getCollection("experience")` return sorted entries or give Phase 22 a reusable ordering API.
- LOW - 21-04 should update the docs authority preamble. It currently says code wins against `src/content.config.ts` or `scripts/sync-projects.mjs` only at `docs/CONTENT-SCHEMA.md:3-5`; after this phase it should also name `scripts/sync-experience.mjs`.
- LOW - The existing source-existence content test is project-only: `tests/content/source-files-exist.test.ts:5-11`. CI sync will catch bad experience sources if it runs, but `pnpm test` will not independently assert the new collection's `source:` files exist.

**Suggestions**
- Add `tests/scripts/sync-experience-idempotency.test.ts`, mirroring `tests/scripts/sync-projects-idempotency.test.ts`, with freeform experience prose instead of the 5-H2 project body.
- In the path-escape test, capture the thrown process status and assert `status === 2` in addition to matching `escapes project root`.
- Make SC3 concrete by adding a tiny helper such as `getExperienceEntries()` / `sortExperienceEntries()` for Phase 22 to consume, or explicitly defer the production query implementation to Phase 22 and reword Phase 21's SC3 as "sortable field contract exists."
- Update `docs/CONTENT-SCHEMA.md:3-5` to include `scripts/sync-experience.mjs` in the "code wins" authority statement.
- Consider extending `tests/content/source-files-exist.test.ts` for `src/content/experience/*.mdx` once the entries exist.

**Risk Assessment**
Overall risk: MEDIUM. The implementation itself is low-risk because it mirrors proven code and adds no runtime dependencies. The medium rating comes from verification and contract precision: idempotency, exit-code enforcement, and reverse-chronological ordering need slightly stronger tests or clearer phase boundaries to fully satisfy the success criteria.

---

## Consensus Summary

Only one external reviewer ran this pass (codex — gemini unavailable, claude self-skipped for independence), so there is no cross-model consensus to triangulate. Instead, the orchestrator (Claude) **independently verified codex's two sharpest findings against the working tree** before recording them; both held up. Codex's review is source-grounded with concrete `file:line` citations and found **no HIGH-severity blocker** — the phase is safe to execute, with three MEDIUM refinements worth folding in first.

### Verified Findings (independently confirmed against source)

1. **Omitted third test analog (MEDIUM) — CONFIRMED.** `tests/scripts/sync-projects-idempotency.test.ts` exists in the repo (2,736 bytes), but 21-01 only mirrors `sync-projects.test.ts` and `sync-projects-check.test.ts`. The idempotency test's "second write-mode run does not rewrite an unchanged file" (mtime) assertion is a distinct guarantee from the `--check` drift test — a script that rewrites identical bytes every run would pass `--check` but fail idempotency. 21-RESEARCH.md's "Sync Mechanism Replication" table and Wave 0 gap list both reference only the two files, so this omission propagated from research → plan.
2. **Path-escape test asserts message, not exit 2 (MEDIUM) — CONFIRMED.** `tests/scripts/sync-projects.test.ts:99-127` asserts only `threwWithExpectedMessage` via `/escapes project root/`; it never inspects `err.status`. 21-01's acceptance criterion says "assert the `escapes project root` message (V12 guard, exit 2)" and instructs a verbatim mirror — so as written it will prove the message but **not** the exit-2 contract at `scripts/sync-projects.mjs:233-235`. The T-21-01 threat mitigation claims exit-2 coverage that the mirrored test would not actually deliver.

### Agreed Strengths (single reviewer)
- The lift-and-strip approach (D-06/D-07) maps cleanly onto real, cited line ranges in `sync-projects.mjs` — mechanism replication is low-risk and well-scoped.
- Schema plan (21-02) correctly avoids the projects `.min(1)` on `techStack` and extends rather than overwrites the `collections` export — the two failure modes research flagged (Pitfall 4, Pitfall 6) are addressed.
- Holloway fence placement (21-03, A2) is correct against the actual source line layout.

### Agreed Concerns (highest priority first)
1. **[MEDIUM] Idempotency test gap** — add `tests/scripts/sync-experience-idempotency.test.ts` mirroring the projects idempotency test (freeform body, no 5-H2 shape).
2. **[MEDIUM] Exit-code assertion gap** — in the S3 path-escape mirror, additionally assert the thrown status is `2`, not just the message, so the T-21-01 exit-2 claim is genuinely covered.
3. **[MEDIUM] SC3 comparator-vs-query ambiguity** — the mock-comparator unit test proves the sort function but not that `getCollection("experience")` returns sorted entries. Either ship a tiny reusable `sortExperienceEntries()`/`getExperienceEntries()` helper for Phase 22 to consume, or reword Phase 21's SC3 to "sortable field contract exists" and explicitly hand the production query to Phase 22.
4. **[LOW] Docs authority preamble** — add `scripts/sync-experience.mjs` to the "code wins" statement at `docs/CONTENT-SCHEMA.md:3-5` in 21-04.
5. **[LOW] Source-existence test** — optionally extend `tests/content/source-files-exist.test.ts` to cover `src/content/experience/*.mdx` so `pnpm test` (not just CI) asserts the `source:` files resolve.

### Divergent Views
None — single reviewer.

### Orchestrator note on SC3 (concern #3)
Worth weighing against phase boundaries: 21-CONTEXT explicitly scopes the Experience **page/route/query render** to Phase 22 and keeps Phase 21 to "the field + reverse-chronological ordering **contract**." Codex's stronger option (a reusable helper) is a small, sensible add that de-risks Phase 22; the lighter option (reword SC3) is defensible given the deliberate scope split. This is a judgment call for planning, not a defect.
