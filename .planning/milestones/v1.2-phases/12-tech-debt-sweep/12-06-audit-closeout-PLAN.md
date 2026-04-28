---
phase: 12-tech-debt-sweep
plan: 06
type: execute
wave: 2
depends_on:
  - 01
  - 02
  - 03
  - 04
  - 05
files_modified:
  - .planning/milestones/v1.1-MILESTONE-AUDIT.md
autonomous: true
requirements:
  - DEBT-06
user_setup: []
tags:
  - audit
  - milestone
  - docs
  - closeout
must_haves:
  truths:
    - "`.planning/milestones/v1.1-MILESTONE-AUDIT.md` shows all 7 v1.1 carried items as either `closed` (with commit link) or `accepted trade-off` (with MASTER.md §2.4 anchor link)"
    - "WR-04 `/dev/primitives.astro` is annotated as `closed by Phase 11` (route deleted — moot)"
    - "WR-01 MobileMenu focus-trap middle-element is closed by Phase 12 DEBT-02 (plan 12-02)"
    - "WR-03 OG URL builder is closed by Phase 11 (resolveOg guard) and verified by Phase 12 DEBT-03 (plan 12-04)"
    - "`--ink-faint` contrast and IN-06 print `#666` are annotated as `accepted trade-off` with MASTER.md §2.4 anchor"
    - "Live-bot copy button inconsistency is closed by Phase 12 DEBT-04 (plan 12-03)"
    - "4 lightning-css warnings item is annotated as `closed by Phase 9 @source not directive` with Phase-12 verification evidence"
  artifacts:
    - path: ".planning/milestones/v1.1-MILESTONE-AUDIT.md"
      provides: "All 7 carried tech-debt bullets annotated with closing-commit SHA or MASTER.md §2.4 anchor link"
      contains: "**closed** in Phase 12"
  key_links:
    - from: "v1.1-MILESTONE-AUDIT.md carried items"
      to: "closing commits in Phase 12 (SHAs from 12-01 through 12-05)"
      via: "inline `— **closed** in Phase 12 (DEBT-NN, commit &lt;sha&gt;)` annotation"
      pattern: "\\*\\*closed\\*\\* in Phase 12"
    - from: "v1.1-MILESTONE-AUDIT.md accepted items"
      to: "design-system/MASTER.md §2.4"
      via: "markdown anchor link"
      pattern: "MASTER.md#24|MASTER.md §2.4"
---

<objective>
Close DEBT-06 by updating `.planning/milestones/v1.1-MILESTONE-AUDIT.md` so each of the 7 carried non-blocking audit items is annotated in-place with its closing status: either `**closed** in Phase 12 (DEBT-NN, commit <sha>)` for implementation fixes, or `**accepted trade-off** (MASTER.md §2.4, Phase 12 DEBT-05)` for documented permanent exceptions, or `**closed by Phase 11** (route deleted)` for the moot WR-04 entry. This plan runs LAST in the phase because it needs the commit SHAs produced by plans 12-01 through 12-05.

Purpose: The v1.1 milestone audit catalogued 7 carried tech-debt items. Phase 12 exists to close or document them. Without an updated audit doc, the milestone's "closed" state is only discoverable by grepping commit messages — this plan makes the close-out grep'able from a single source.

Output: v1.1-MILESTONE-AUDIT.md with 7 annotated bullets and a top-of-file "Phase 12 close-out" paragraph summarising the sweep. No frontmatter keys mutated (per PATTERNS.md).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/milestones/v1.1-MILESTONE-AUDIT.md
@.planning/phases/12-tech-debt-sweep/12-CONTEXT.md
@.planning/phases/12-tech-debt-sweep/12-PATTERNS.md
@.planning/phases/12-tech-debt-sweep/12-01-SUMMARY.md
@.planning/phases/12-tech-debt-sweep/12-02-SUMMARY.md
@.planning/phases/12-tech-debt-sweep/12-03-SUMMARY.md
@.planning/phases/12-tech-debt-sweep/12-04-SUMMARY.md
@.planning/phases/12-tech-debt-sweep/12-05-SUMMARY.md

<interfaces>
<!-- Current per-phase bullets (to be amended) — PATTERNS.md source (v1.1-MILESTONE-AUDIT.md:161-171) -->
```markdown
### Phase 9: Primitives
- **4 lightning-css warnings** (`Unexpected token Delim('*')`) from literal `var(--token-*)` example strings in template detection surface. Build exits 0. Tracked in `.planning/phases/09-primitives/deferred-items.md`. Originally deferred to Phase 11 but not closed.
- **WR-01:** MobileMenu focus trap catches only first/last tab boundary — middle elements behind backdrop remain in tab order.
- **WR-03:** `BaseLayout.astro:49,67` OG image URL builder corrupts already-absolute URLs. No current call site hits this path.
- **IN-06:** `#666` hex in `global.css:174` print stylesheet outside the 6-token palette (print-only).

### Phase 10: Page Port
- **Live bot copy button inconsistency:** `chat.ts:302` assigns `copyBtn.innerHTML = '<svg…>'` for live streaming messages while history replay at `chat.ts:555` uses `copyBtn.textContent = "COPY"`. …

### Phase 11: Polish
- **`--ink-faint` contrast (2.5:1 on `--bg`)** fails WCAG AA 4.5:1 for normal text. Intentionally accepted for tertiary/decorative metadata only …
```

<!-- Annotation pattern per PATTERNS.md "Audit close-out annotation" + D-19 -->
```markdown
- **WR-01:** MobileMenu focus trap … — **closed** in Phase 12 (DEBT-02, commit &lt;sha-12-02&gt;).
- **WR-03:** `BaseLayout.astro:49,67` OG image URL builder … — **closed** in Phase 11 (resolveOg guard at `BaseLayout.astro:38-39`); verified in Phase 12 (DEBT-03, plan 12-04).
- **WR-04:** `/dev/primitives.astro` `previewYears[i]` — **closed by Phase 11** (route deleted).
- **IN-06:** `#666` hex in print stylesheet — **accepted trade-off** (MASTER.md §2.4, Phase 12 DEBT-05, commit &lt;sha-12-05&gt;).
- **--ink-faint contrast** — **accepted trade-off** (MASTER.md §2.4, Phase 12 DEBT-05, commit &lt;sha-12-05&gt;).
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Gather closing commit SHAs from plans 12-01 through 12-05</name>
  <read_first>
    - .planning/phases/12-tech-debt-sweep/12-01-SUMMARY.md (final wrangler + lint close-out commits)
    - .planning/phases/12-tech-debt-sweep/12-02-SUMMARY.md (inert extension commit)
    - .planning/phases/12-tech-debt-sweep/12-03-SUMMARY.md (createCopyButton commits — RED and GREEN)
    - .planning/phases/12-tech-debt-sweep/12-04-SUMMARY.md (OG verification commit, docs only)
    - .planning/phases/12-tech-debt-sweep/12-05-SUMMARY.md (MASTER.md §2.4 commit)
  </read_first>
  <action>
    Collect the final HEAD SHA after each predecessor plan merged. Use `git log` to identify commits by message convention (e.g., `feat(12-03):`, `docs(12-05):`, `chore(12-01):`). If the plans committed per-task, collect the final commit per plan (the one that closes it).

    Run:
    ```bash
    git log --oneline --grep="(12-01)" -n 5
    git log --oneline --grep="(12-02)" -n 5
    git log --oneline --grep="(12-03)" -n 5
    git log --oneline --grep="(12-04)" -n 5
    git log --oneline --grep="(12-05)" -n 5
    ```

    Record the final 7-character SHA per plan in a temporary note (for Task 2 substitution):
    ```
    sha-12-01 = <7-char>   # DEBT-01 close-out (build warnings)
    sha-12-02 = <7-char>   # DEBT-02 close-out (inert extension)
    sha-12-03 = <7-char>   # DEBT-04 close-out (createCopyButton)
    sha-12-04 = <7-char>   # DEBT-03 close-out (OG verification — VALIDATION.md update)
    sha-12-05 = <7-char>   # DEBT-05 close-out (MASTER.md §2.4)
    ```

    These SHAs plug into the annotations in Task 2.
  </action>
  <verify>
    <automated>git log --oneline --grep="(12-01)" -n 1 | wc -l</automated>
    <automated>git log --oneline --grep="(12-02)" -n 1 | wc -l</automated>
    <automated>git log --oneline --grep="(12-03)" -n 1 | wc -l</automated>
    <automated>git log --oneline --grep="(12-05)" -n 1 | wc -l</automated>
  </verify>
  <acceptance_criteria>
    - All 5 plan SHAs identified (12-04 may be a docs-only commit; if no code change, use the VALIDATION.md-update commit SHA)
    - Each SHA is 7+ characters and resolves via `git rev-parse`
    - SHAs recorded in task SUMMARY for audit trail
  </acceptance_criteria>
  <done>5 closing-commit SHAs identified and ready for substitution in the audit doc.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Annotate all 7 carried items in v1.1-MILESTONE-AUDIT.md</name>
  <read_first>
    - .planning/milestones/v1.1-MILESTONE-AUDIT.md (full file — especially frontmatter :1-14, existing Tech Debt per-phase bullets :161-171, any other location carried items appear)
    - .planning/phases/12-tech-debt-sweep/12-PATTERNS.md "Audit close-out annotation" shared pattern section
    - .planning/phases/12-tech-debt-sweep/12-CONTEXT.md D-19
  </read_first>
  <action>
    Open `.planning/milestones/v1.1-MILESTONE-AUDIT.md`. Locate each of the 7 carried items. Apply an inline trailing annotation per the PATTERNS.md pattern ("append only — do not delete the original bullet text"). Substitute the real SHAs from Task 1.

    **The 7 carried items and their annotations:**

    1. **4 lightning-css warnings** (Phase 9 section) — APPEND:
       ```
        — **closed** by Phase 9 `@source not` directive in `src/styles/global.css:32-46` (already in effect); re-verified zero-warning status in Phase 12 DEBT-01 (commit &lt;sha-12-01&gt;).
       ```

    2. **WR-01: MobileMenu focus trap middle-element** (Phase 9 section) — APPEND:
       ```
        — **closed** in Phase 12 (DEBT-02, plan 12-02, commit &lt;sha-12-02&gt;). Extended inert set/remove to `.chat-widget` in openMenu/closeMenu; focus-trap keydown handler preserved as D-10 belt-and-suspenders.
       ```

    3. **WR-03: OG image URL builder** (Phase 9 section) — APPEND:
       ```
        — **closed** in Phase 11 (resolveOg guard at `src/layouts/BaseLayout.astro:38-39`); **verified** in production in Phase 12 (DEBT-03, plan 12-04, commit &lt;sha-12-04&gt; — see 12-VALIDATION.md §DEBT-03).
       ```

    4. **WR-04: `/dev/primitives.astro` `previewYears[i]`** (wherever it lives — Phase 9 or 10 section) — APPEND:
       ```
        — **closed by Phase 11** (route deleted in Phase 11 Polish — moot).
       ```

    5. **IN-06: `#666` hex in print stylesheet** (Phase 9 section) — APPEND:
       ```
        — **accepted trade-off** in Phase 12 (MASTER.md §2.4 "Print stylesheet `#666`", DEBT-05, commit &lt;sha-12-05&gt;). Permanent-accepted — will not be addressed in v1.x.
       ```

    6. **Live bot copy button inconsistency** (Phase 10 section) — APPEND:
       ```
        — **closed** in Phase 12 (DEBT-04, plan 12-03, commit &lt;sha-12-03&gt;). New `createCopyButton(getContent)` helper exported from `src/scripts/chat.ts` drives both live-stream and replay paths; vitest parity test at `tests/client/chat-copy-button.test.ts` enforces byte-equal markup.
       ```

    7. **`--ink-faint` contrast (2.5:1 on `--bg`)** (Phase 11 section) — APPEND:
       ```
        — **accepted trade-off** in Phase 12 (MASTER.md §2.4 "`--ink-faint` contrast exception", DEBT-05, commit &lt;sha-12-05&gt;). Permanent-accepted — will not be addressed in v1.x.
       ```

    **Preserve original bullet text.** Append ONLY — do not rewrite, do not re-order, do not delete.

    **Top-of-file summary paragraph.** Add a new paragraph to the narrative body (NOT to frontmatter keys — per PATTERNS.md "do not mutate frontmatter keys; append prose to the narrative body instead"). Insert immediately after the frontmatter closing `---` but before the existing opening prose (or at the start of a new section titled `## Phase 12 Close-out`). Text:

    ```markdown
    ## Phase 12 Close-out — 2026-04-15

    All 7 carried tech-debt items from the v1.1 milestone audit are annotated below as either **closed** (with closing commit reference) or **accepted trade-off** (with MASTER.md §2.4 anchor). Evidence:

    - Build/lint zero-warning pipeline — plan 12-01 (DEBT-01, commit &lt;sha-12-01&gt;)
    - MobileMenu + ChatWidget inert coverage — plan 12-02 (DEBT-02, commit &lt;sha-12-02&gt;)
    - OG URL production verification — plan 12-04 (DEBT-03, commit &lt;sha-12-04&gt; — see 12-VALIDATION.md §DEBT-03)
    - Chat copy-button parity — plan 12-03 (DEBT-04, commit &lt;sha-12-03&gt;)
    - Accepted exceptions documented in MASTER.md §2.4 — plan 12-05 (DEBT-05, commit &lt;sha-12-05&gt;)

    The milestone-level Phase 7 chat regression battery (D-26 gate) passed at the close of each plan that touched chat-adjacent surfaces. Lighthouse CI held 99/95/100/100 on homepage + one project detail throughout the phase.
    ```

    **DO NOT mutate frontmatter keys** at v1.1-MILESTONE-AUDIT.md:1-14. Append only.

    **Final check:** after all edits, run:
    ```bash
    grep -c "closed" .planning/milestones/v1.1-MILESTONE-AUDIT.md
    grep -c "accepted trade-off" .planning/milestones/v1.1-MILESTONE-AUDIT.md
    ```
    Expect `closed` ≥ 5 occurrences (5 items marked closed) and `accepted trade-off` ≥ 2 occurrences (2 items).

    Commit as:
    ```
    docs(12-06): close v1.1 milestone audit — 7 carried items annotated
    ```
  </action>
  <verify>
    <automated>grep -cE "\\*\\*closed\\*\\* in Phase 12" .planning/milestones/v1.1-MILESTONE-AUDIT.md</automated>
    <automated>grep -cE "\\*\\*closed\\*\\* by Phase (9|11)" .planning/milestones/v1.1-MILESTONE-AUDIT.md</automated>
    <automated>grep -cE "\\*\\*accepted trade-off\\*\\*" .planning/milestones/v1.1-MILESTONE-AUDIT.md</automated>
    <automated>grep -c "Phase 12 Close-out" .planning/milestones/v1.1-MILESTONE-AUDIT.md</automated>
    <automated>grep -c "MASTER.md §2.4" .planning/milestones/v1.1-MILESTONE-AUDIT.md</automated>
  </verify>
  <acceptance_criteria>
    - `grep -E "\\*\\*closed\\*\\* in Phase 12" .planning/milestones/v1.1-MILESTONE-AUDIT.md` returns ≥ 3 matches (WR-01, Live copy button, + lightning-css re-verification)
    - `grep -E "\\*\\*closed\\*\\* by Phase (9|11)" .planning/milestones/v1.1-MILESTONE-AUDIT.md` returns ≥ 2 matches (lightning-css closed by Phase 9, WR-04 closed by Phase 11, WR-03 closed by Phase 11)
    - `grep -E "\\*\\*accepted trade-off\\*\\*" .planning/milestones/v1.1-MILESTONE-AUDIT.md` returns exactly 2 matches (IN-06 + `--ink-faint`)
    - `grep "Phase 12 Close-out" .planning/milestones/v1.1-MILESTONE-AUDIT.md` returns exactly 1 match (the new summary section)
    - `grep "MASTER.md §2.4" .planning/milestones/v1.1-MILESTONE-AUDIT.md` returns ≥ 2 matches (IN-06 + `--ink-faint` anchor references)
    - All 5 commit SHA placeholders `&lt;sha-12-NN&gt;` are replaced with real 7+ character SHAs — `grep "&lt;sha-12-" .planning/milestones/v1.1-MILESTONE-AUDIT.md` returns 0 matches
    - Frontmatter (v1.1-MILESTONE-AUDIT.md:1-14) byte-unchanged — `git diff` shows only additions in body prose
    - Each of the 7 original bullets still contains its original prose (append-only invariant)
    - `pnpm build` exits 0
  </acceptance_criteria>
  <done>DEBT-06 closed: all 7 v1.1 carried items annotated in v1.1-MILESTONE-AUDIT.md with closing SHA or MASTER.md §2.4 anchor; frontmatter untouched; close-out summary paragraph added.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

N/A — docs-only change to an audit ledger file inside `.planning/milestones/`. No code surface, no runtime surface, no build impact. No new attack surface introduced.

The only discipline-level risk is commit-SHA drift: if a SHA annotated here refers to a commit that later gets force-pushed away, the audit pointer breaks. Mitigation: this plan runs LAST in Phase 12, SHAs are collected fresh from the merged tree, and the audit file itself is committed immediately after — any future force-push to main would require a project-level decision outside this phase's scope.

No STRIDE register applies to a docs-only audit update.
</threat_model>

<verification>
Plan-level sign-off: diff of v1.1-MILESTONE-AUDIT.md shows only ADDITIONS (per-bullet append annotations + new "Phase 12 Close-out" summary section at top of body). Frontmatter keys (schema-version, dates, etc.) byte-unchanged. All SHA placeholders resolved. All 7 carried items reachable via grep for either "closed" or "accepted trade-off" in Phase-12 context. `pnpm build` exits 0.
</verification>

<success_criteria>
- 7 carried items annotated with closing status
- 5 Phase-12 commit SHAs substituted (no `<sha-12-NN>` placeholders remain)
- "Phase 12 Close-out" summary paragraph present at top of body
- Frontmatter unchanged
- Each original bullet preserved byte-identical to pre-plan, with trailing annotation only
- `grep "MASTER.md §2.4"` returns ≥ 2 matches (accepted items anchor correctly)
- No code files modified
- `pnpm build` exits 0
</success_criteria>

<output>
After completion, create `.planning/phases/12-tech-debt-sweep/12-06-SUMMARY.md` with:
- The 5 closing SHAs collected from predecessor plans
- Mapping of SHA to carried item
- Copy of the "Phase 12 Close-out" summary section (as inserted)
- `git diff --stat .planning/milestones/v1.1-MILESTONE-AUDIT.md` showing only additions
- Confirmation that frontmatter is byte-unchanged
- Net Phase 12 sweep summary: 6 plans shipped, DEBT-01..06 all closed or documented, milestone audit ledger current
</output>
