---
phase: 16-motion-layer
plan: 03
subsystem: design-system
tags: [documentation, design-system, motion, phase-16, tdd-green, motion-md, master-md]

# Dependency graph
requires:
  - phase: 16-motion-layer
    provides: Plan 16-01 motion-doc.test.ts RED stub (13 RED / 2 GREEN baseline) — 8 MOTION.md tests + 7 MASTER.md §6/§8/§11 tests
  - phase: 8-foundation
    provides: design-system/MASTER.md v1.1 lock — preserved for §1-§5, §7, §9, §10 byte-identical; only §6 / §8 single bullet / §11 single line modified
provides:
  - design-system/MOTION.md as the v1.2 motion canonical doc — 178 LOC, 10 numbered sections, third-person spec voice
  - Property whitelist (transform / opacity / box-shadow only), duration bands (120/180/200/250-350/600/2500ms), easing defaults (ease-out / ease-in-out), 7 motion specs MOTN-01..MOTN-07 with full From->To / Duration / Easing / Reduced-motion data
  - Reduced-motion contract documenting wrap-in-no-preference vs paired-reduce-override patterns
  - MASTER.md §6 stub pointing to MOTION.md (33 lines collapsed to 9)
  - MASTER.md §8 view-transition carve-out language permitting MOTN-01 cross-document fade (single-bullet amendment; all other §8 anti-patterns byte-identical)
  - MASTER.md §11 v1.2 / Phase 16 changelog entry
  - 13 RED tests in tests/build/motion-doc.test.ts -> 13 GREEN (full motion-doc.test.ts: 15/15 GREEN)
affects:
  - 16-04 (motion.ts + global.css) — consumes MOTION.md as the source of truth for keyframe / IO opts / one-shot semantics
  - 16-05 (chat.ts pulse + scale-in) — consumes MOTN-04 / MOTN-05 specs verbatim
  - 16-06 (WorkRow arrow) — consumes MOTN-03 spec verbatim
  - 16-07 (Lighthouse gate + close-out) — verifies MOTN-10 thresholds documented in MOTION.md §8
  - All future v1.2+ motion work — MOTION.md is the canonical reference; MASTER.md §6 stub redirects readers there

# Tech tracking
tech-stack:
  added: []  # zero new dependencies — pure documentation
  patterns:
    - "v1.2 motion canonical doc supersedes v1.1 §6 lock via stub-pointer pattern (MASTER.md still authoritative for non-motion concerns; MOTION.md is the motion-only delta)"
    - "Anti-pattern reconciliation via single-bullet amendment + carve-out language (§8 view-transition entry kept in §8 for visibility, but explicitly permits MOTION.md authorization to avoid orphan rule)"
    - "Test-driven doc authoring (Plan 01 wrote 15 source-text invariants; Plan 03 satisfies them by writing prose that contains every asserted token)"
    - "Avoid grep collisions in prose: rephrased 'cubic-bezier()' to 'the cubic-bezier CSS function' (no parenthesis) so motion-doc.test.ts `not.toMatch(/cubic-bezier\\(/)` assertion passes"

key-files:
  created:
    - design-system/MOTION.md (178 LOC NEW — v1.2 motion canonical doc)
  modified:
    - design-system/MASTER.md (819 -> 793 LOC; -26 net; 3 hunks: §6 -24 lines / §8 1 bullet rewritten / §11 +1 line)
    - .planning/REQUIREMENTS.md (MOTN-09 marked complete + traceability table updated)

key-decisions:
  - "cubic-bezier rephrasing: motion-doc.test.ts asserts `expect(md).not.toMatch(/cubic-bezier\\(/)` — the prohibited substring is the literal `cubic-bezier(`. Wrote `cubic-bezier` as a bare token in §4 ('Custom curves via the `cubic-bezier` CSS function are prohibited') and §9 ('Custom CSS easing curves — named easings only; the `cubic-bezier` CSS function is prohibited') without the open parenthesis. Same prohibition communicated; assertion passes."
  - "§6 stub kept the §6.1 anti-pattern stance summary line (referencing GSAP / ClientRouter / canvas hero / scroll-trigger bans) so a reader of MASTER.md alone still understands the motion locks even if MOTION.md is mid-update — the stub is self-contained for the locks-not-carve-outs case."
  - "§8 view-transition bullet kept in §8 (not removed) — preserves the §8 anti-pattern format and the test assertion `grep -c 'view-transition' >= 1` inside §8. The amendment is `except as authorized by MOTION.md` + a sentence enumerating the MOTN-01 carve-out shape (cross-document `@view-transition { navigation: auto; }` + `::view-transition-old(root)` / `::view-transition-new(root)` opacity-only). The v1.3 named-element morph is explicitly called out as a Future Requirement to head off a Phase 17 reader from reauthorizing it inadvertently."
  - "§11 changelog entry placed at the TOP of the changelog list (most-recent-first ordering, mirrors existing 2026-04-15 / 2026-04-13 / 2026-04-07 entries which are reverse-chronological). Format mirrors prior entries: bold version label + colon + prose body. Date 2026-04-27 substituted for the placeholder 2026-04-XX in the plan."
  - "Voice rule: every paragraph in MOTION.md uses third-person spec voice — 'This document is the canonical contract', 'Animations may move only', 'motion.ts reads matchMedia... once at init time'. Zero first-person ('I built'), zero third-person-about-Jack ('Jack designed'). Per project_voice_split.md, design-system docs use neutral spec voice."

patterns-established:
  - "Stub-pointer pattern for superseding a locked-doc section: replace the section body with a 1-line blockquote linking to the new authoritative doc + a 1-paragraph summary of which locks survive vs which carve-outs apply. Reader can navigate from MASTER.md §6 to MOTION.md without losing the v1.1 lock context."
  - "Anti-pattern reconciliation via inline carve-out language: 'No X except as authorized by Y' + a sentence enumerating the carve-out shape. Preserves the anti-pattern's discoverability (still in §8) while permitting the new authorized use site. Avoids the alternative pattern of removing-and-re-adding-elsewhere which loses the audit trail."
  - "Grep-collision-avoidance in prose: when a doc must talk ABOUT a prohibited substring without containing the substring (the test asserts `not.toMatch`), rephrase to omit the matched character. e.g., '`cubic-bezier()` curves' -> 'the `cubic-bezier` CSS function'. Same semantic content; passes the assertion."

requirements-completed:
  - MOTN-09  # MASTER.md §5/§6 amended with additive motion carve-outs (property whitelist, duration bands, easing defaults). Closed by Plan 16-03.

# Metrics
duration: 6min
completed: 2026-04-27
---

# Phase 16 Plan 03: design-system/MOTION.md (NEW) + MASTER.md §6/§8/§11 surgical edits Summary

**Authored design-system/MOTION.md as the v1.2 motion canonical doc (178 LOC, 10 sections, all 7 MOTN specs); replaced MASTER.md §6 with a 9-line stub pointing to it; added MOTN-01 view-transition carve-out to §8 anti-pattern list; appended v1.2/Phase 16 changelog entry to §11. Test-doc invariants from Plan 16-01: 13 RED -> 13 GREEN (full motion-doc.test.ts now 15/15 GREEN). Zero source code changes; zero new dependencies.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-27T19:43:12Z
- **Completed:** 2026-04-27T19:48:53Z
- **Tasks:** 2 (both autonomous, no checkpoints)
- **Files created:** 1 (design-system/MOTION.md, 178 LOC)
- **Files modified:** 2 (design-system/MASTER.md −26 LOC; .planning/REQUIREMENTS.md MOTN-09 closed)

## Accomplishments

- **MOTION.md authored** — 178 LOC, 10 numbered sections (Overview / Property Whitelist / Duration Bands / Easing Defaults / Animation Specs / Reduced-Motion Contract / File Ownership / Lighthouse Gate / Anti-Patterns / Changelog). All 7 motion IDs MOTN-01..MOTN-07 specified with full From→To / Duration / Easing / Reduced-motion data. Reduced-motion contract documents both the wrap-in-no-preference pattern (entrances) and the paired-reduce-override pattern (loops).
- **MASTER.md §6 collapsed to stub** — 33 lines (660-693) → 9 lines pointing to `design-system/MOTION.md`. Stub is self-contained: a reader who lands on §6 alone learns (1) v1.1 motion lock is superseded, (2) MOTION.md is the v1.2 canonical doc, (3) §6.1 anti-pattern stance summary survives in §8 except where MOTION.md carves out an exception.
- **MASTER.md §8 view-transition bullet amended** — single-bullet rewrite of line 747 to `No view transition ::view-transition-* keyframes except as authorized by MOTION.md`, followed by a sentence enumerating the MOTN-01 carve-out shape (cross-document `@view-transition { navigation: auto; }` + `::view-transition-old(root)`/`::view-transition-new(root)` opacity-only fades; v1.3 named-element morph remains a Future Requirement).
- **MASTER.md §11 changelog appended** — new top entry: `**v1.2 / Phase 16 (2026-04-27):** §6 replaced with stub pointer to design-system/MOTION.md...`. Format mirrors existing reverse-chronological entries (2026-04-15 / 2026-04-13 / 2026-04-07 untouched).
- **All 13 motion-doc.test.ts RED tests flipped GREEN** — full file now 15/15 GREEN (8 MOTION.md + 7 MASTER.md tests). Total suite delta: 283 GREEN → 296 GREEN (+13); 55 RED → 42 RED (−13). Remaining 42 RED are Wave 0 stubs awaiting Plans 04/05/06.
- **MOTN-09 closed** in REQUIREMENTS.md (line 63 `[ ]` → `[x]`; traceability table line 127 `Pending` → `Complete (16-03)`).
- **Zero source code changes; zero `package.json` changes; zero `src/**` edits.** Pure documentation.
- **`pnpm check` 0/0/0** (81 files); test suite passes for all motion-doc.test.ts cases; no regressions in pre-existing 296 GREEN tests.

## Task Commits

Each task was committed atomically per the executor protocol:

1. **Task 1: Author design-system/MOTION.md (NEW — v1.2 motion canonical doc)** — `f9a1f82` (docs)
2. **Task 2: Rewrite MASTER.md §6 stub + amend §8 view-transition reconciliation + append §11 changelog** — `031cf36` (docs)

**Plan metadata commit:** TBD (lands after this SUMMARY + STATE.md + ROADMAP.md updates)

## Files Created/Modified

### Created (1 file, 178 LOC)

| Path | LOC | Sections | Tokens locked | Voice |
|------|-----|----------|---------------|-------|
| design-system/MOTION.md | 178 | 10 numbered (Overview, Property Whitelist, Duration Bands, Easing Defaults, Animation Specs, Reduced-Motion Contract, File Ownership, Lighthouse Gate, Anti-Patterns, Changelog) | 3 properties (transform/opacity/box-shadow), 6 duration bands (120/180/200/250-350/600/2500ms), 2 easings (ease-out/ease-in-out), 7 motion specs MOTN-01..MOTN-07, MOTN-08 reduced-motion contract, MOTN-10 Lighthouse gate | Third-person spec voice throughout |

### Modified (2 files)

| Path | Diff | Purpose |
|------|------|---------|
| design-system/MASTER.md | +5 / -31 (net -26; total 819 → 793 LOC) | 3 hunks: §6 (lines 660-693, 33 lines → 9 lines stub); §8 (line 747, single-bullet view-transition amendment); §11 (1 line appended at top of changelog list). All non-motion sections (§1, §2, §3, §4, §5, §7, §9, §10) byte-identical. |
| .planning/REQUIREMENTS.md | +2 / -2 | MOTN-09 line 63 `[ ]` → `[x]`; traceability table line 127 `Pending` → `Complete (16-03)`. |

### Untouched (verified byte-identical)

| Path | Verification |
|------|--------------|
| All `src/**` files | Plan is documentation-only; no source edits. `git diff HEAD~2 -- src/ | wc -l` returns 0. |
| All `tests/**` files | Plan does not modify tests; the existing motion-doc.test.ts assertions flip from RED to GREEN as a side effect of the doc edits. |
| `package.json` / `pnpm-lock.yaml` | Zero new dependencies. |
| design-system/MASTER.md §1 (Overview), §2 (Tokens), §3 (Typography), §4 (Layout), §5 (Primitives), §7 (Accent usage), §9 (Chat Widget Token Map), §10 (Chat Bubble Exception) | `git diff HEAD~2 -- design-system/MASTER.md` shows only 3 hunks at §6 / §8 / §11 — all other sections byte-identical. |

## Decisions Made

See frontmatter `key-decisions` section above for full list. Headlines:

- **`cubic-bezier` rephrasing without parenthesis** — motion-doc.test.ts asserts the literal substring `cubic-bezier(` is absent. Wrote `cubic-bezier` as a bare token (no open paren) in §4 and §9 to communicate the same prohibition while satisfying the test. Documented as a "grep-collision-avoidance" pattern for future doc authoring.
- **§6 stub keeps §6.1 anti-pattern summary line** — even though §8 is the authoritative anti-pattern list, the §6 stub repeats a 1-paragraph summary so a reader who lands on §6 alone (e.g., via a deep link or an external reference) gets the locks-vs-carve-outs context without having to scroll to §8.
- **§8 view-transition bullet kept in §8** — preserves the anti-pattern's discoverability and the test assertion `grep -c 'view-transition' >= 1` inside §8. Amendment is inline (`except as authorized by MOTION.md` + carve-out shape sentence), not a remove-and-re-add. Audit trail preserved.
- **§11 entry at TOP of changelog list** — mirrors existing reverse-chronological ordering (2026-04-15 / 2026-04-13 / 2026-04-07 are top-down most-recent-first). Date `2026-04-27` substituted for the plan's `2026-04-XX` placeholder.
- **Voice: third-person spec voice throughout MOTION.md** — per project_voice_split.md, design-system docs are neutral spec voice. Zero first-person ("I designed"), zero third-person-about-Jack ("Jack designed"). Sentences are subject-verb declarative: "Animations may move only the following CSS properties", "motion.ts reads matchMedia(...) once at init time", "The site's motion philosophy is tasteful and quiet".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 / Rule 3 - Test-Assertion Conflict] Avoided literal `cubic-bezier(` substring in MOTION.md prose**
- **Found during:** Task 1 verification (running motion-doc.test.ts -t "MOTION.md")
- **Issue:** The plan's draft action block had MOTION.md §4 containing the sentence `cubic-bezier() custom curves are prohibited in v1.2.` which would have matched the test assertion `expect(md).not.toMatch(/cubic-bezier\(/)` and turned that test RED. The plan authors recognized this conflict — note in the plan §<action> says "Token budget guard: no instances of `cubic-bezier(`, no `import gsap` references except inside the §9 anti-patterns list (banned context only)." But the §9 anti-patterns example in the plan still had `cubic-bezier()` literal which would have failed the assertion.
- **Fix:** Rephrased both occurrences (§4 and §9) to use bare `cubic-bezier` without the open parenthesis. Section 4: "Custom curves via the `cubic-bezier` CSS function are prohibited in v1.2." Section 9: "Custom CSS easing curves — named easings only (§4); the `cubic-bezier` CSS function is prohibited." Same prohibition communicated; the test assertion `not.toMatch(/cubic-bezier\(/)` passes.
- **Files modified:** design-system/MOTION.md (2 occurrences rephrased before commit)
- **Verification:** `grep -c 'cubic-bezier(' design-system/MOTION.md` returns 0; `pnpm vitest run tests/build/motion-doc.test.ts -t "MOTION.md"` passes 8/8.
- **Committed in:** f9a1f82 (Task 1 commit; fix folded into the original draft, no separate fix commit)

### Other (not deviations — cosmetic)

- **Commit message §-character escaping** — Bash heredoc-style `\\xa7` escapes did not interpolate to `§` in the commit subject lines for `f9a1f82` and `031cf36`. Subject lines contain literal `\xa76 stub + \xa78 view-transition carve-out + \xa711 v1.2 entry` instead of `§6 stub + §8 view-transition carve-out + §11 v1.2 entry`. The body of each commit message is correct (no escapes attempted there). Not re-amending — content of the diff is correct, hash is committed, downstream consumers (git log readers, plan-checker, gh PR descriptions) tolerate the escape sequence as readable shorthand. Documented here for the record.

---

**Total deviations:** 1 auto-fixed (Rule 1 / Rule 3 test-assertion conflict, folded into Task 1 commit before landing).
**Impact on plan:** No scope creep. The fix is contained inside MOTION.md prose, satisfies the existing motion-doc.test.ts assertion verbatim, and produces semantically equivalent doc text.

## Issues Encountered

### gsd-sdk query subcommand not available locally

The `execute-plan` workflow recommends `gsd-sdk query state.load`, `gsd-sdk query state.advance-plan`, etc., but the locally-installed `gsd-sdk` (v1.x at `C:/Users/jackc/AppData/Roaming/npm/gsd-sdk`) only supports `run`, `auto`, and `init` subcommands — no `query` subcommand. Same for `commit` and `commit-to-subrepo` handlers. Worked around by:
- Reading STATE.md / config.json directly via Read tool instead of `gsd-sdk query state.load`
- Running `git add` + `git commit` directly (single-repo project; no sub_repos configured)
- Updating STATE.md / ROADMAP.md / REQUIREMENTS.md via Edit tool directly

This matches the Phase 16-01 / 16-02 precedent — both prior plans executed without `gsd-sdk query` and produced clean SUMMARY → STATE → ROADMAP updates.

## Final State

| Metric | Value |
|--------|-------|
| pnpm test (full suite) | 296 GREEN / 42 RED / 338 total (was 283 / 55 / 338 — net +13 GREEN, −13 RED) |
| pnpm check (astro check + tsc) | 0 errors / 0 warnings / 0 hints (81 files) |
| motion-doc.test.ts | 15 GREEN / 0 RED (was 2 GREEN / 13 RED — net +13 GREEN, −13 RED) |
| MOTION.md (NEW) | 178 LOC; 10 numbered sections; third-person spec voice |
| MASTER.md | 819 → 793 LOC (−26 net); 3 hunks at §6 / §8 / §11; non-motion sections byte-identical |
| Files committed | 1 created (MOTION.md) + 1 modified (MASTER.md) across 2 atomic task commits |
| New runtime dependencies | 0 |
| Source code changes | 0 (pure documentation plan) |
| Requirements closed | MOTN-09 (1 of 10 MOTN requirements) |

### RED → GREEN flip count per file

| File | Pre-plan RED | Post-plan GREEN | Net delta |
|------|--------------|-----------------|-----------|
| tests/build/motion-doc.test.ts | 13 RED + 2 GREEN | 0 RED + 15 GREEN | −13 RED, +13 GREEN |
| All other test files | unchanged | unchanged | 0 |

## Next Phase Readiness

- **Plan 16-04 (Wave 2):** `src/scripts/motion.ts` module + global.css view-transition + reveal-rise + word-rise keyframes + BaseLayout integration. Reads MOTION.md as the source of truth for keyframe values, IO opts, easing names, and one-shot semantics. motion.test.ts target: 12 RED → 12 GREEN. motion-css-rules.test.ts: 8-ish flips (view-transition + scroll-reveal + word-stagger + reduce-motion negation).
- **Plan 16-05 (Wave 3):** chat.ts D-15 + chat-pulse + scale-in + .is-open class. Reads MOTION.md MOTN-04 (chat bubble pulse) and MOTN-05 (chat panel scale-in) verbatim. chat-pulse-coordination.test.ts target: 4 RED → 4 GREEN.
- **Plan 16-06 (Wave 3, parallel with 16-05):** WorkRow arrow upgrade. Reads MOTION.md MOTN-03 verbatim. work-arrow-motion.test.ts target: 3 RED → 3 GREEN.
- **Plan 16-07 (Wave 4):** Lighthouse + D-26 battery + close-out. Verifies MOTN-10 thresholds documented in MOTION.md §8. Full Wave 0 GREEN; reduced-motion.test.ts target: 5 RED → 5 GREEN.

No blockers. MOTION.md is now the canonical reference — Plans 04/05/06 should grep MOTION.md for any value before hard-coding it from UI-SPEC.md.

## Threat Surface Scan

No new security-relevant surface introduced. Pure documentation; no network endpoints, no auth paths, no file access patterns at trust boundaries. Threat register T-16-03-01 / T-16-03-02 (drift mitigations) honored — motion-doc.test.ts catches both:
- T-16-03-01 (MOTION.md drift from UI-SPEC) — every duration / property / easing / motion ID asserted; 8 GREEN tests lock the contract
- T-16-03-02 (MASTER.md silent removal of GSAP / ClientRouter ban) — assertions still match `No GSAP` and `ClientRouter` inside §8; 2 GREEN tests lock the bans

## Self-Check: PASSED

Verified each created/modified file exists at the recorded path:
- design-system/MOTION.md: FOUND (178 lines)
- design-system/MASTER.md: FOUND (793 lines, modified)
- .planning/REQUIREMENTS.md: FOUND (MOTN-09 marked complete)

Verified each commit hash exists in `git log`:
- f9a1f82 (Task 1: MOTION.md): FOUND
- 031cf36 (Task 2: MASTER.md edits): FOUND

Verified test contract:
- `pnpm vitest run tests/build/motion-doc.test.ts --reporter=dot` → 15 passed / 0 failed
- `pnpm check` → 0 errors / 0 warnings / 0 hints

---
*Phase: 16-motion-layer*
*Completed: 2026-04-27*
