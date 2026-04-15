---
phase: 12-tech-debt-sweep
plan: 05
type: execute
wave: 1
depends_on: []
files_modified:
  - design-system/MASTER.md
autonomous: true
requirements:
  - DEBT-05
user_setup: []
tags:
  - design-system
  - master-md
  - docs
  - tokens
  - contrast
must_haves:
  truths:
    - "MASTER.md contains a new `### 2.4 Accepted token exceptions` subsection immediately after §2.3 Lock contract"
    - "§2.4 documents TWO entries in `| Property | Value |` two-column tables: `--ink-faint` contrast exception, and print stylesheet `#666`"
    - "§11 Changelog has a new Phase-12-dated bullet recording the §2.4 amendment"
    - "NO inline CSS comments are added at usage sites — single source of truth is MASTER.md (D-15)"
    - "§2 intro, §2.1, §2.2, §2.3, and §8 anti-patterns are byte-unchanged"
  artifacts:
    - path: "design-system/MASTER.md"
      provides: "§2.4 Accepted token exceptions + §11 Changelog entry"
      contains: "### 2.4 Accepted token exceptions"
  key_links:
    - from: "MASTER.md §2.4"
      to: "--ink-faint token and print #666 usage sites"
      via: "centralised exception documentation (no inline CSS duplication)"
      pattern: "Permanent-accepted — will not be addressed in v1.x"
---

<objective>
Close DEBT-05 by inserting a new `### 2.4 Accepted token exceptions` subsection into `design-system/MASTER.md` immediately after §2.3 Lock contract. Two documented entries: (1) `--ink-faint` 2.5:1 contrast on `--bg` scoped to tertiary/decorative metadata only, and (2) print-stylesheet `#666` literal at `src/styles/global.css:199` (print-only, outside the 6-hex palette). Both marked **Permanent-accepted — will not be addressed in v1.x** per D-16. No inline CSS comments are added at usage sites (D-15). Append a Phase-12-dated bullet to §11 Changelog.

Purpose: v1.1 milestone audit carried the `--ink-faint` contrast and print `#666` items as known, deliberate trade-offs, but without a single grep'able home any future auditor had to reconstruct the rationale. §2.4 closes this — one place to look, symmetric with the existing §10 Chat Bubble Exception pattern.

Output: MASTER.md grows by one subsection + one changelog line. No code files touched. No runtime impact.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/12-tech-debt-sweep/12-CONTEXT.md
@.planning/phases/12-tech-debt-sweep/12-RESEARCH.md
@.planning/phases/12-tech-debt-sweep/12-PATTERNS.md
@design-system/MASTER.md

<interfaces>
<!-- §2.4 skeleton — paste immediately after §2.3 (after line 84 in current MASTER.md, before the `---` separator on line 86). -->
<!-- Source: 12-RESEARCH.md §Q6, lines 291-320. -->

```markdown
### 2.4 Accepted token exceptions

These are the only documented exceptions to the six-hex palette. Each entry is a deliberate, permanently-accepted trade-off — re-evaluation is deferred to any future milestone that revisits the editorial color system (§2.1). No inline CSS comments duplicate this documentation; MASTER.md is the single source of truth.

#### `--ink-faint` contrast exception

| Property  | Value                                                                                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Token     | `--ink-faint` (`#A1A1AA`) on `--bg` (`#FAFAF7`)                                                                                                                                                        |
| Contrast  | 2.5:1 — below WCAG AA 4.5:1 for normal text; passes AA 3:1 for non-text UI and Large Text                                                                                                              |
| Scope     | Tertiary / decorative metadata only — `SectionHeader` section counts, `WorkRow` stack labels and year labels, footer copy, next-project label, contact separator, chat character count                 |
| Rationale | Editorial hierarchy requires a visually-quieter tertiary text tone than 4.5:1 permits. Primary body text uses `--ink` (18.9:1) and secondary text uses `--ink-muted` (7.4:1); both pass AA comfortably. |
| Impact    | Lighthouse Accessibility lands at 95/100 (not 100). QUAL-01 threshold (≥90) is still met.                                                                                                              |
| Status    | Permanent-accepted — will not be addressed in v1.x                                                                                                                                                     |

#### Print stylesheet `#666`

| Property  | Value                                                                                                                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token     | `#666` literal at `src/styles/global.css:199` inside `a[href^="http"]::after` URL annotations                                                                                                        |
| Scope     | Print media query only (`@media print { ... }`) — never reaches the screen                                                                                                                           |
| Rationale | The editorial color system applies to the screen cascade. Print stylesheets annotate external links with their URLs for readability on paper; the specific grey chosen here is outside palette scope. |
| Status    | Permanent-accepted — will not be addressed in v1.x                                                                                                                                                   |

---
```

<!-- §11 Changelog entry — prepend as the newest entry at top of the changelog bullet list (around MASTER.md:791-794) -->
```markdown
- 2026-04-15 — Phase 12 amendment: §2.4 Accepted token exceptions added (`--ink-faint` contrast + print `#666`)
```

<!-- Existing §11 lines for reference (MASTER.md:793-794) -->
```markdown
- 2026-04-13 — Phase 10 head-of-phase amendment: §6.1 typing-dot carve-out, §5.2/§5.8 X drop from social rows, §10 chat bubble exception
- 2026-04-07 — v1.1 initial lock (Phase 8)
```

<!-- Existing §10 Chat Bubble Exception — structural reference only, do NOT edit (MASTER.md:783-787) -->
```markdown
## 10. Chat Bubble Exception

The round accent chat bubble (48x48px, background: var(--accent), border-radius: 50%) is the only round surface in the editorial system. This is a deliberate exception to the flat-rectangle grammar -- the bubble serves as the accent-red beacon signaling the chatbot exists.

Every other surface in the system uses `border-radius: 0` (work rows, chat panel, chips, textarea, send button). The bubble's roundness is a functional signal — it communicates "this is a different kind of UI element" at a glance. Without it, the chat entry point would be indistinguishable from the editorial chrome.
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Insert §2.4 Accepted token exceptions into MASTER.md</name>
  <read_first>
    - design-system/MASTER.md (full file — focus on §2.1 table shape at ~:32-50, §2.3 Lock contract end at ~:84, the `---` separator at ~:86, §10 Chat Bubble Exception at ~:783-787, §11 Changelog at ~:791-794)
    - .planning/phases/12-tech-debt-sweep/12-RESEARCH.md §Q6 (lines 279-331) — skeleton source of truth
    - .planning/phases/12-tech-debt-sweep/12-PATTERNS.md "design-system/MASTER.md" section
    - .planning/phases/12-tech-debt-sweep/12-CONTEXT.md D-13, D-14, D-15, D-16
  </read_first>
  <action>
    **Step 1 — Locate insertion point.** Open `design-system/MASTER.md`. Find the end of §2.3 Lock contract (the last line of §2.3 content). Immediately below §2.3's final line, before the first `---` horizontal-rule separator that precedes §3, INSERT the §2.4 skeleton from the `<interfaces>` block above VERBATIM. Do NOT modify a single character of the skeleton — it has been approved by RESEARCH.md §Q6 and the user accepted D-14 locked.

    **Step 2 — §2.4 content = exactly the markdown in the skeleton.** Header line: `### 2.4 Accepted token exceptions`. Opening paragraph: the one sentence about "only documented exceptions" + deferral reference. Two `####` sub-headers (`#### \`--ink-faint\` contrast exception` and `#### Print stylesheet \`#666\``) each followed by a `| Property | Value |` two-column markdown table with the six / four rows respectively. Close with the `---` horizontal rule.

    **Step 3 — §11 Changelog entry.** Navigate to the §11 Changelog bullet list. The current top-of-list entry is `2026-04-13 — Phase 10 head-of-phase amendment…`. PREPEND a new bullet as the newest entry:
    ```markdown
    - 2026-04-15 — Phase 12 amendment: §2.4 Accepted token exceptions added (`--ink-faint` contrast + print `#666`)
    ```
    (Use today's actual date if different from 2026-04-15 — check `date +%Y-%m-%d`.)

    **Step 4 — DO NOT TOUCH these sections (byte-equal invariant):**
    - §2 intro sentence at ~:30 ("The **entire** color palette is six hex values…") — per Q6 note
    - §2.1 table (the 6-hex palette)
    - §2.2 (whatever it is)
    - §2.3 Lock contract
    - §8 Anti-patterns (per ROADMAP.md Cross-Phase Constraints: §8 stays intact, no subtractive amendments)
    - §10 Chat Bubble Exception (reference only; no edit)
    - Any table or token definition elsewhere

    **Step 5 — DO NOT add inline CSS comments at usage sites (D-15).** Specifically: do NOT edit `src/styles/global.css` to add `/* see MASTER.md §2.4 */` at the `#666` line or at any `--ink-faint` consumer. Single source of truth is MASTER.md. This is enforced by the automated verify: `grep -rE "contrast exception|--ink-faint.*WCAG" src/` must return 0 matches.

    **Step 6 — Sanity check:** run `pnpm exec prettier --check design-system/MASTER.md` if the project has MD prettier config; if it reports style violations in the new section, fix them WITHOUT changing the content (e.g., table column alignment whitespace — prettier may re-align).
  </action>
  <verify>
    <automated>grep -c "### 2.4 Accepted token exceptions" design-system/MASTER.md</automated>
    <automated>grep -c "#### \`--ink-faint\` contrast exception" design-system/MASTER.md</automated>
    <automated>grep -c "#### Print stylesheet \`#666\`" design-system/MASTER.md</automated>
    <automated>grep -cE "2026-04-.. — Phase 12 amendment" design-system/MASTER.md</automated>
    <automated>grep -c "Permanent-accepted — will not be addressed in v1.x" design-system/MASTER.md</automated>
    <automated>grep -c "^## 10. Chat Bubble Exception" design-system/MASTER.md</automated>
    <automated>grep -c "^## 2.3" design-system/MASTER.md</automated>
    <automated>grep -rE "contrast exception|--ink-faint.*WCAG" src/styles/ 2&gt;/dev/null | wc -l</automated>
    <automated>pnpm build</automated>
  </verify>
  <acceptance_criteria>
    - `grep "### 2.4 Accepted token exceptions" design-system/MASTER.md` returns exactly 1 match
    - `grep "#### \`--ink-faint\` contrast exception" design-system/MASTER.md` returns exactly 1 match
    - `grep "#### Print stylesheet \`#666\`" design-system/MASTER.md` returns exactly 1 match
    - `grep "Permanent-accepted — will not be addressed in v1.x" design-system/MASTER.md` returns exactly 2 matches (once per entry)
    - `grep -E "2026-04-.. — Phase 12 amendment" design-system/MASTER.md` returns exactly 1 match
    - `grep -rE "contrast exception|--ink-faint.*WCAG" src/styles/` returns 0 matches (D-15 enforcement — NO inline CSS comment duplication)
    - §10 Chat Bubble Exception prose is byte-unchanged (compare via `git diff design-system/MASTER.md` — only additions in §2.4 insertion point + §11 changelog prepend; no deletions anywhere in §10, §8, §2.1, §2.2, §2.3, or §2 intro)
    - `pnpm build` exits 0 (markdown change does not break any build step)
    - The §2.4 section ends with a `---` horizontal rule separator
  </acceptance_criteria>
  <done>DEBT-05 closed: MASTER.md §2.4 exists with both entries, §11 changelog updated, zero inline CSS comment duplication, all other sections byte-unchanged.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

N/A — this plan touches a documentation file only. No code surface, no runtime dependency, no build config, no user-facing behavior. The §2.4 section records a trade-off decision already shipped in the color token scale.

If this plan were to leak inline CSS comments at usage sites (violating D-15), a future edit could drift out of sync with MASTER.md. Task 1 acceptance criteria explicitly grep-enforce "zero inline CSS comment duplication" — this is the only enforced invariant.

No STRIDE register applies to a docs-only change.
</threat_model>

<verification>
Plan-level sign-off: MASTER.md diff shows ONLY additions (new §2.4 section at the post-§2.3 insertion site + new §11 Changelog bullet at top of list). Zero deletions anywhere in the file. Zero new inline CSS comments at usage sites. `pnpm build` exits 0 with zero new warnings (no Tailwind detection impact — the `@source not "../../design-system/**"` directive already excludes MASTER.md from the class graph).
</verification>

<success_criteria>
- `design-system/MASTER.md` grows by exactly one new subsection (§2.4) and one new changelog bullet
- Both §2.4 entries use the `| Property | Value |` two-column table shape
- Both entries have `Status: Permanent-accepted — will not be addressed in v1.x`
- §11 Changelog has a Phase-12-dated bullet as the newest entry
- No code files (including `src/styles/global.css`) are modified
- No inline CSS comments about `--ink-faint` or `#666` contrast/exception anywhere in `src/`
- §8 Anti-patterns, §10 Chat Bubble Exception, and §2 intro remain byte-unchanged
- `pnpm build` exits 0
</success_criteria>

<output>
After completion, create `.planning/phases/12-tech-debt-sweep/12-05-SUMMARY.md` with:
- Full §2.4 section text (as inserted)
- §11 Changelog line (as prepended)
- `git diff design-system/MASTER.md --stat` showing only additions
- Confirmation that `grep -rE "contrast exception|--ink-faint.*WCAG" src/` returns 0 matches
- Confirmation that §10 Chat Bubble Exception text is byte-unchanged
</output>
