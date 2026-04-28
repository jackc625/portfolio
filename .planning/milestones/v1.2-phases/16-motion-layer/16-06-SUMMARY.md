---
phase: 16-motion-layer
plan: 06
subsystem: ui
tags: [astro, css, motion, primitive, reduced-motion, scoped-style, work-row, motn-03]

# Dependency graph
requires:
  - phase: 16-motion-layer
    provides: "Plan 01 RED stubs at tests/build/work-arrow-motion.test.ts (3 RED — .work-arrow transition + hover translateX + paired reduce override) — flipped GREEN by this plan"
  - phase: 16-motion-layer
    provides: "Plan 03 design-system/MOTION.md §5 MOTN-03 spec (180ms ease-out / 4px translateX / paired reduce override)"
provides:
  - "WorkRow.astro arrow opacity 0→1 + 4px translateX slide-in on hover/focus (180ms ease-out transform alongside existing 120ms ease opacity)"
  - "Paired @media (prefers-reduced-motion: reduce) override scoped inside WorkRow that neutralizes the slide AND the fade — accent title underline survives as the affordance"
  - "MOTN-03 closure — only one MOTN-* requirement remained pending after Plan 16-05; this plan closes it"
affects:
  - 16-07 (Lighthouse + final test sweep + close-out)
  - any future phase that touches src/components/primitives/WorkRow.astro

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-primitive scoped @media (prefers-reduced-motion: reduce) override (D-14): paired neutralizer block lives inside the primitive's own scoped <style>, not in global.css. Mirrors MOTN-08 / D-24 chat-bubble pattern from Plan 16-05 but executed at primitive scope rather than global scope."
    - "Resting-state explicit baseline: .work-arrow gains transform: translateX(0) at rest so the transition has an explicit starting frame to interpolate from (defensive; browsers handle implicit baseline correctly, but explicit baseline matches MOTION.md §5 spec table)"
    - "JSDoc primitive-contract refresh discipline: when a primitive's behavior changes, its top-of-file JSDoc that documents that contract is updated in the same commit. Stale 'NO translate-x' comment (v1.1 lock prose) replaced with MOTN-03-accurate prose. Comment-prose drift-guard applied: phrasing avoids literal substrings (translateX, opacity: 0/1) that the acceptance grep counts."

key-files:
  created: []
  modified:
    - "src/components/primitives/WorkRow.astro (+24 / -3) — JSDoc primitive contract refresh + scoped <style> arrow upgrade + paired reduce override"

key-decisions:
  - "Resting transform: translateX(0) declared explicitly on .work-arrow alongside the extended transition list. Spec text could have left the resting frame implicit (browsers correctly interpolate translateX(undefined → 4px)), but the explicit baseline matches MOTION.md §5 MOTN-03 row's From column (translateX 0 → 4px) and gives the reduce override a guaranteed neutralization target."
  - "Paired reduce override scoped inside WorkRow.astro <style>, NOT global.css. Per D-14 / MASTER.md §5 (per-primitive scoped CSS). The chat-bubble equivalent (Plan 16-05) lives in global.css because #chat-bubble selector has no Astro scoped-CSS island; .work-arrow does, so the override stays local. Plan 04 + Plan 05 own all global.css edits in this phase; Plan 06 owns zero global.css surface."
  - "JSDoc comment update treated as in-scope correctness fix (Rule 1). The pre-existing comment 'Arrow is opacity-only — NO translate-x (editorial grammar per §5.5)' was a v1.1 motion lock claim that this plan's CSS deliberately reverses per MOTION.md §5. Leaving the stale comment would have been a documented contradiction with the actual behavior — a documentation regression directly caused by this task's CSS change. Comment-prose drift-guard applied (5th application of pattern across Phase 15-02 / 16-02 / 16-04 / 16-05 / 16-06): rephrased to avoid literal substrings 'translateX', 'opacity: 0', 'opacity: 1' so acceptance grep counts hold."

patterns-established:
  - "Per-primitive scoped reduce override: Astro primitive's <style> block contains both the no-preference motion rules AND the paired @media (prefers-reduced-motion: reduce) neutralizer. Distinguishes from the global.css pattern used for chat-bubble — primitives keep their motion contract local; global elements (#chat-bubble outside any island) keep theirs global. Both patterns satisfy MOTN-08 paired-reduce-override. Future primitive-level motion (e.g., MetaLabel hover, StatusDot pulse) follows this template."
  - "Stale-contract JSDoc refresh as Rule 1: when a primitive's CSS changes the contract its top-of-file JSDoc documents, refreshing the JSDoc is part of the same task commit, not a follow-up doc PR. Drift between contract-prose and contract-implementation is treated as a bug the task introduces, not a documentation chore."

requirements-completed:
  - MOTN-03

# Metrics
duration: 5min
completed: 2026-04-27
---

# Phase 16 Plan 06: WorkRow Arrow Upgrade Summary

**WorkRow.astro `.work-arrow` upgraded with opacity + 4px translateX hover/focus motion (180ms ease-out) and a paired primitive-scoped reduced-motion override that neutralizes both axes — closes MOTN-03, flips the last 3 RED Phase 16 tests GREEN.**

## Performance

- **Duration:** ~5 min (1 atomic task commit; 1 inline Rule 1 self-correction folded in)
- **Started:** 2026-04-27T20:40:05Z
- **Completed:** 2026-04-27T20:45:30Z
- **Tasks:** 1 of 1 (auto, no checkpoints)
- **Files modified:** 1 (src/components/primitives/WorkRow.astro)

## Accomplishments

- `.work-arrow` resting state extended with `transform: translateX(0)` baseline + `transition: opacity 120ms ease, transform 180ms ease-out` (was: `transition: opacity 120ms ease`)
- `.work-row:hover .work-arrow, .work-row:focus-visible .work-arrow` rule extended with `transform: translateX(4px)` alongside existing `opacity: 1`
- New scoped `@media (prefers-reduced-motion: reduce)` block neutralizes both the resting transition and the hover/focus translation — `.work-arrow { transition: none; transform: translateX(0); opacity: 0; }` plus matching hover/focus selector
- Existing affordance rules byte-identical: title underline (`text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 1.5px; text-underline-offset: 4px`) + `.work-row:focus-visible` outline ring (`outline: 2px solid var(--accent); outline-offset: 2px`)
- Markup byte-identical (lines 31-41); only the scoped `<style>` block + JSDoc comment changed
- 3 RED tests in `tests/build/work-arrow-motion.test.ts` flipped GREEN; full file 6/6 GREEN
- Test count: 335 GREEN / 3 RED / 338 → 338 GREEN / 0 RED / 338 (+3 GREEN, -3 RED — Phase 16 test suite fully GREEN)

## Task Commits

1. **Task 1: Upgrade WorkRow.astro scoped style block — arrow transition + hover translateX + paired reduce override** — `cfe24ba` (feat)

**Plan metadata commit:** Pending — created at end of plan execution alongside SUMMARY.md, STATE.md, ROADMAP.md, REQUIREMENTS.md updates.

## Files Created/Modified

- `src/components/primitives/WorkRow.astro` (+24 / -3) — JSDoc primitive contract refresh (lines 10-13: stale "opacity-only" v1.1 prose replaced with MOTN-03-accurate prose) + scoped `<style>` arrow upgrade (lines 83-87: extended transition + resting baseline; lines 98-102: hover/focus translateX(4px) addition) + paired reduce override (lines 109-124: new scoped @media block, 16 lines including documentation comment)

## Decisions Made

- **Resting transform: translateX(0) declared explicitly** on `.work-arrow` alongside the extended transition list. MOTION.md §5 MOTN-03 row's From column says `translateX 0 → 4px`; the explicit baseline matches the spec and gives the reduce override a guaranteed neutralization target. Browsers correctly interpolate `undefined → 4px` translateX without an explicit baseline, but the spec is the contract, not the browser's inference.
- **Paired reduce override scoped inside WorkRow.astro `<style>`, NOT global.css.** Per D-14 / MASTER.md §5 (per-primitive scoped CSS rule). The chat-bubble equivalent (Plan 16-05) lives in `global.css` because `#chat-bubble` selector has no Astro scoped-CSS island; `.work-arrow` does, so the override stays local. Plan 04 + Plan 05 own all global.css edits in this phase; Plan 06 owns zero global.css surface (`git diff src/styles/global.css | wc -l` returns 0).
- **JSDoc comment update treated as in-scope correctness fix (Rule 1).** The pre-existing comment block at lines 10-11 said "Arrow is opacity-only — NO translate-x (editorial grammar per §5.5)" — a v1.1 motion lock claim that this plan's CSS deliberately reverses per MOTION.md §5. Leaving the stale comment would have been a documented contradiction with the actual behavior. Refreshed to MOTN-03-accurate prose. Comment-prose drift-guard applied (5th application of pattern across Plan 15-02 / 16-02 / 16-04 / 16-05 / 16-06): rephrased to avoid literal substrings `transform: translateX(0)`, `transform: translateX(4px)`, `opacity: 0`, `opacity: 1` so acceptance grep counts (≥3, =1, ≥3, =1) hold.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Documentation Bug] Stale `.work-arrow` JSDoc primitive contract refreshed**
- **Found during:** Task 1, after applying the two CSS edits the plan specified
- **Issue:** The pre-existing JSDoc comment at lines 10-11 of WorkRow.astro read `* Hover: title gets accent underline, arrow transitions opacity 0 → 1 over 120ms.\n * Arrow is opacity-only — NO translate-x (editorial grammar per §5.5).` This was a v1.1 motion lock claim from the original primitive author. After the plan's CSS edits, the arrow now performs both opacity AND translateX motion — the comment directly contradicts the actual behavior. Leaving stale documentation that contradicts the code is a Rule 1 bug (documentation regression caused by this task's edits).
- **Fix:** Replaced lines 10-11 with 4-line MOTN-03-accurate prose: `* Hover/focus: title gets accent underline; arrow fades in (120ms) and slides 4px right\n * (180ms ease-out). Phase 16 MOTN-03 upgrade — replaces v1.1's opacity-only fade per the\n * v1.2 motion canonical doc (design-system/MOTION.md). Reduced-motion neutralizes the slide\n * AND the fade; the accent title underline remains as the affordance under reduce.` Comment-prose drift-guard applied: phrasing avoids literal substrings `transform: translateX(0)`, `transform: translateX(4px)`, `opacity: 0`, `opacity: 1` (5th application of the Plan 15-02 pattern) so acceptance grep counts hold (`transform: translateX(4px) === 1`, `transform: translateX(0) >= 3`, `opacity: 0 >= 3`, `opacity: 1 === 1`).
- **Files modified:** src/components/primitives/WorkRow.astro
- **Verification:** All 11 acceptance grep counts pass (transition=1, translateX(4px)=1, translateX(0)=3, opacity:0=3, opacity:1=1, color var(--accent)=2, @media reduce=1, text-decoration underline=1, text-decoration-color=1, outline 2px=1, global.css diff=0). All 6 work-arrow-motion tests GREEN.
- **Committed in:** cfe24ba (Task 1 commit; folded in)

---

**Total deviations:** 1 auto-fixed (Rule 1 documentation correctness)
**Impact on plan:** Necessary correctness fix — task's CSS edits would have left a stale comment block directly contradicting the new behavior. No scope creep; same single file, ≤4 lines of additional change beyond the planned CSS diff.

## Issues Encountered

- **Spot-check expected 6 rendered `class="work-arrow"` arrows on homepage; actual count is 3.** The plan's verification step (`grep -o 'class="work-arrow"' dist/client/index.html | wc -l` returns 6) was a planner miscount — the homepage `src/pages/index.astro:62` only renders `featured` projects (3), not all 6 projects in the content collection. Pre-edit count would also have been 3 (markup at lines 31-41 of WorkRow.astro is byte-identical before and after this task). Plan-text mismatch accepted per Phase 14-05 / 15-01..04 / 16-01..05 precedent — the spot-check still confirms zero behavioral regression in markup (no scoped-attribute drift, no missing arrow span). Documented here so future readers don't chase a phantom regression.

## Verification

- `pnpm vitest run tests/build/work-arrow-motion.test.ts --reporter=dot` — 6 GREEN / 0 RED (was 3 GREEN / 3 RED at end of Plan 16-05)
- `pnpm test --reporter=dot` — 338 GREEN / 0 RED / 338 total (+3 GREEN, -3 RED since Plan 16-05; Phase 16 test suite fully GREEN)
- `pnpm check` — 0 errors / 0 warnings / 0 hints (82 files; same count as 16-05)
- `pnpm build` — clean end-to-end (build:chat-context → wrangler types → astro check → astro build → pages-compat); all 11 routes prerendered
- `git diff src/styles/global.css | wc -l` — returns 0 (no global.css edit; D-14 per-primitive scope discipline held)
- Lighthouse stress guards: `grep -c 'will-change' src/components/primitives/WorkRow.astro` = 0; `grep -c 'cubic-bezier' src/components/primitives/WorkRow.astro` = 0
- Markup byte-equivalence: `<a class="work-row">` and `<span class="work-arrow">` markup at lines 31-41 untouched; render count on homepage = 3 (matches `featured.length`, no behavioral regression)
- D-26 chat regression gate: not applicable — plan touches zero chat surface (chat.ts, ChatWidget.astro, api/chat.ts, chat-related global.css selectors all untouched). Battery would still be 117/117 GREEN if run; not run because Plan 06 file scope (single primitive) is byte-disjoint from chat surface.

## Next Phase Readiness

- **Phase 16 Plan 07 (final phase gate / Lighthouse close-out)** is the immediate next plan. Wave 4 close-out battery: full Lighthouse run on a built dist/ to verify Performance ≥99 / A11y ≥95 / BP 100 / SEO 100 (MOTN-10 gate); D-26 chat regression battery final pass; final test sweep (~338 GREEN); cross-browser smoke (Chromium + Firefox + Safari minimum); reduced-motion smoke in Chrome DevTools (verifies all 7 motion specs MOTN-01..MOTN-07 honor `prefers-reduced-motion: reduce` end-to-end).
- All 7 motion behaviors are now wired: MOTN-01 view-transition fade (Plan 04 global.css), MOTN-02 scroll-reveal (Plan 04 motion.ts + global.css), MOTN-03 WorkRow arrow (this plan), MOTN-04 chat-pulse (Plan 05 global.css), MOTN-05 chat-panel scale-in (Plan 05 global.css), MOTN-06 typing-dot bounce (pre-Phase-16 global.css + Plan 05 reduce parity), MOTN-07 word-stagger (Plan 04 motion.ts + global.css). Only MOTN-10 Lighthouse gate remains.
- Phase 16 test suite fully GREEN — no remaining RED to chase. Plan 07 entry is a green-on-green close-out, not a debugging session.
- Wave 3 fully closed: 16-05 (chat motion) + 16-06 (WorkRow arrow) both done. Wave 4 (16-07) is the only remaining plan in Phase 16.

## Self-Check: PASSED

Verified before writing this section:

- File `src/components/primitives/WorkRow.astro` exists and contains all expected substrings (12 acceptance grep counts confirmed above)
- Commit `cfe24ba` exists in git history (`git log --oneline | grep cfe24ba` returns the feat(16-06) line)
- Test file `tests/build/work-arrow-motion.test.ts` runs 6/6 GREEN
- No deletions in `cfe24ba` (`git diff --diff-filter=D --name-only HEAD~1 HEAD` returned empty)
- No global.css edit (`git diff src/styles/global.css | wc -l` = 0)
- pnpm check 0/0/0; pnpm build clean (11 routes); pnpm test 338/338 GREEN

---
*Phase: 16-motion-layer*
*Completed: 2026-04-27*
