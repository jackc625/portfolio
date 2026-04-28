---
phase: 12-tech-debt-sweep
plan: 05
subsystem: design-system
tags:
  - design-system
  - master-md
  - docs
  - tokens
  - contrast
requirements:
  - DEBT-05
dependency-graph:
  requires: []
  provides:
    - "MASTER.md §2.4 Accepted token exceptions (grep'able home for future auditors)"
  affects:
    - "DEBT-06 milestone audit close-out (reference link target for v1.1-MILESTONE-AUDIT.md annotations)"
tech-stack:
  added: []
  patterns:
    - "Centralised exception documentation — symmetric with §10 Chat Bubble Exception pattern"
key-files:
  created: []
  modified:
    - "design-system/MASTER.md (+25 lines: §2.4 subsection + §11 changelog bullet)"
decisions:
  - "D-13/D-14: New §2.4 subsection placed immediately after §2.3 Lock contract with two | Property | Value | entries"
  - "D-15: No inline CSS comments at usage sites — MASTER.md is single source of truth (verified grep returns 0 matches in src/)"
  - "D-16: Both entries marked 'Permanent-accepted — will not be addressed in v1.x'"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-15"
  tasks_completed: 1
  files_modified: 1
  lines_added: 25
  lines_deleted: 0
---

# Phase 12 Plan 05: MASTER.md Token Exceptions Summary

**One-liner:** Closes DEBT-05 by inserting §2.4 "Accepted token exceptions" into design-system/MASTER.md with two permanent-accepted trade-offs (`--ink-faint` 2.5:1 contrast scoped to tertiary metadata; print-stylesheet `#666` at global.css:199) plus a Phase-12-dated §11 changelog bullet. Zero inline CSS comments added — MASTER.md is the single source of truth.

## What Shipped

### §2.4 Accepted token exceptions (inserted after §2.3 Lock contract)

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
```

### §11 Changelog (prepended as newest entry)

```markdown
- 2026-04-15 — Phase 12 amendment: §2.4 Accepted token exceptions added (`--ink-faint` contrast + print `#666`)
```

## Diff Stat

```
 design-system/MASTER.md | 25 +++++++++++++++++++++++++
 1 file changed, 25 insertions(+)
```

**Pure additions, zero deletions.** §2.1, §2.2, §2.3, §8, §10, §11 pre-existing bullets, and §2 intro are byte-unchanged.

## Verification Results

| Check | Result |
|-------|--------|
| `grep "### 2.4 Accepted token exceptions" design-system/MASTER.md` | 1 match (expected 1) |
| `grep "#### \`--ink-faint\` contrast exception" design-system/MASTER.md` | 1 match (expected 1) |
| `grep "#### Print stylesheet \`#666\`" design-system/MASTER.md` | 1 match (expected 1) |
| `grep "Permanent-accepted — will not be addressed in v1.x" design-system/MASTER.md` | 2 matches (expected 2) |
| `grep -E "2026-04-.. — Phase 12 amendment" design-system/MASTER.md` | 1 match (expected 1) |
| `grep -rE "contrast exception\|--ink-faint.*WCAG" src/` | 0 matches (D-15 enforced: zero inline CSS comment duplication) |
| §10 Chat Bubble Exception byte-equality | Confirmed via `git diff` — no deletions in that section |
| `pnpm build` | exit 0 (clean build, 11 static routes prerendered, Wrangler + Astro both silent) |
| `pnpm lint` | exit 0 (ESLint clean) |
| Diff shape | 25 insertions, 0 deletions |

## Deviations from Plan

None — plan executed exactly as written. Plan's suggested Prettier sanity check step (Step 6) was skipped because the repo's ESLint run passed clean and no Prettier config violations emerged from `pnpm build` / `pnpm lint`.

## Known Stubs

None. Documentation-only change; no runtime or rendering surface touched.

## Threat Flags

None. Plan touches a single markdown documentation file. No trust boundary, no network surface, no auth path, no schema change.

## Commits

- `ab39c08` — `docs(12-05): add MASTER.md §2.4 Accepted token exceptions`

## Self-Check: PASSED

- FOUND: design-system/MASTER.md (modified, 25 insertions)
- FOUND: commit ab39c08 (`git log` confirms)
- FOUND: §2.4 header, both `####` sub-entries, §11 changelog bullet
- CONFIRMED: 0 inline CSS comment duplications in src/
- CONFIRMED: §10 Chat Bubble Exception byte-unchanged
- CONFIRMED: `pnpm build` exits 0
- CONFIRMED: `pnpm lint` exits 0
