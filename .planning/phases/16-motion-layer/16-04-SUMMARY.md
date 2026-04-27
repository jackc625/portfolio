---
phase: 16-motion-layer
plan: 04
subsystem: motion
tags: [motion, scroll-reveal, word-stagger, view-transition, intersection-observer, reduced-motion, phase-16, tdd-green, d26-adjacent]

# Dependency graph
requires:
  - phase: 16-motion-layer
    plan: 01
    provides: Wave 0 RED test stubs (motion.test.ts, motion-css-rules.test.ts, reduced-motion.test.ts Phase 16 describe block)
  - phase: 16-motion-layer
    plan: 02
    provides: src/scripts/lib/observer.ts makeRevealObserver factory consumed by motion.ts
  - phase: 16-motion-layer
    plan: 03
    provides: design-system/MOTION.md as the source of truth for keyframe values, easing names, one-shot semantics
provides:
  - src/scripts/motion.ts (NEW, 121 LOC) — initMotion / handleRevealEntry / wrapWordsInPlace / shouldReduceMotion exports
  - src/styles/global.css extended with @view-transition + view-transition keyframes + reveal-rise + word-rise + .reveal-on + .word rules inside @media (prefers-reduced-motion: no-preference)
  - src/layouts/BaseLayout.astro body script block extended with `import "../scripts/motion.ts"` (third import line)
  - tests/client/motion.test.ts importMotion() helper repaired (Plan 01 infinite-recursion bug fixed via Rule 1 inline self-correction)
affects:
  - 16-05 (chat.ts D-15 + chat-pulse + chat-panel scale-in + MOTN-06 reduce extension) — adjacent CSS at end of global.css preserved as anchor for Plan 05's chat-pulse + scale-in keyframe additions
  - 16-06 (WorkRow arrow upgrade — MOTN-03) — independent of motion.ts; landing order with 16-05 is parallel
  - 16-07 (Lighthouse + close-out) — will-change=0 + cubic-bezier=0 stress-locks held; performance budget guardrails preserved

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-document `@view-transition { navigation: auto; }` at-rule + `::view-transition-old(root)` / `::view-transition-new(root)` pseudo-element animations gated by `prefers-reduced-motion: no-preference` (MOTN-01 / D-20 / D-21) — pure native browser API, zero runtime JS"
    - "Word-stagger DOM mutation via textContent-only span-wrap — XSS safe (no innerHTML, no template-literal HTML); idempotency via data-stagger-split attribute (D-13)"
    - "Defensive .display selector check in handleRevealEntry — belt-and-suspenders for D-08 (homepage hero never word-wrapped) even though REVEAL_SELECTOR already excludes it"
    - "matchMedia init-time read (no `change` event listener) — cross-document navigation re-reads the media query on next page load; mid-session edge case is acceptable per Plan 16-03 decisions section"
    - "Bootstrap pattern mirrors src/scripts/scroll-depth.ts:67-76 verbatim — astro:page-load + DOMContentLoaded + readyState !== 'loading' immediate-call branch + module-level motionInitialized + motionBootstrapped guards"

key-files:
  created:
    - src/scripts/motion.ts
    - .planning/phases/16-motion-layer/16-04-SUMMARY.md
  modified:
    - src/styles/global.css (+92 lines, append-only)
    - src/layouts/BaseLayout.astro (+1 import line, +5/-5 comment lines)
    - tests/client/motion.test.ts (+1 added import call, -1 recursive call, +3 comment lines, -1 @ts-expect-error directive)
    - .planning/REQUIREMENTS.md (MOTN-01, MOTN-02, MOTN-07 marked Complete; MOTN-08 marked Partial)
    - .planning/ROADMAP.md (16-04 marked complete; Phase 16 progress 0/7 -> 4/7)
    - .planning/STATE.md (will be updated post-SUMMARY)

key-decisions:
  - "Plan 01 authored tests/client/motion.test.ts importMotion() helper with infinite recursion (line 89: `return importMotion()` called itself instead of `import('../../src/scripts/motion')`). Rule 1 inline self-correction during Task 1: replaced recursive call with `await import('../../src/scripts/motion')`. Without this fix, every motion test would have stack-overflowed regardless of motion.ts existence — the entire RED → GREEN flip was blocked. Fix folded into Task 1 commit (1020ffd) alongside motion.ts creation."
  - "Removed `// @ts-expect-error` directive on the import line because motion.ts now exists. Plan 16-01 SUMMARY explicitly documented this as a drift signal: 'directive flips to ts(2578) when 16-04 lands the module so the executor of 16-04 must remove this helper or the directive in the same diff as src/scripts/motion.ts.' Acted on as designed; preserves pnpm check 0/0/0."
  - "src/scripts/motion.ts is 121 LOC (within 60-130 budget). Mirrors scroll-depth.ts shape: module-level state guards (motionInitialized, motionBootstrapped), exported pure handlers (handleRevealEntry, wrapWordsInPlace, shouldReduceMotion) for unit testing, single bootstrap block at end. Imports makeRevealObserver factory from ./lib/observer (Plan 02). REVEAL_SELECTOR = '.h1-section, .work-row, .prose-editorial p, .about-body p' per D-04; .display deliberately absent."
  - "wrapWordsInPlace uses textContent + createElement + appendChild (XSS safe). Test 'wraps text with no leakage of `<` characters' confirms `<script>alert(1)</script>` text appears as literal text inside span.textContent and never as a parsed `<script>` child element. Idempotency via `if (el.dataset.staggerSplit === 'true') return;` guard (D-13). After successful wrap, sets `el.dataset.staggerSplit = 'true'` so a re-init on the same heading is a no-op."
  - "handleRevealEntry calls `observer.unobserve(entry.target)` itself, mirroring scroll-depth.ts handleScrollEntry. The factory's oneShot is omitted (defaults to false) to avoid double-unobserve. Per D-19 byte-equivalence pattern from Plan 16-02: caller-managed unobserve preserves authority over per-target dedup semantics. Defensive `.display` exclusion check guards against a future widening of REVEAL_SELECTOR that accidentally adds `.display` (D-08 homepage hero protection)."
  - "shouldReduceMotion reads matchMedia at init time only — no `change` event listener. Cross-document navigation re-reads the media query on each page load; user toggling OS-level reduce-motion mid-session sees the change on next route change. Decision recorded in Plan 16-03 / MOTION.md §6. Test 'reduce reads matchMedia(\"(prefers-reduced-motion: reduce)\")' pins the exact query string at the spelling motion.ts emits."
  - "global.css extension is purely append-only (lines 526-617, 92 lines added). Existing scroll-behavior block (lines 74-81), nav-link-hover reduce block (lines 126-133), and typing-bounce + .typing-dot rules (lines 260-280) are all byte-identical. Verified by sed-extracting each block and visual diff against pre-edit baseline. D-26 chat regression gate satisfied: src/pages/api/chat.ts byte-identical (git diff = 0 lines); chat regression battery 117/117 GREEN across 8 test files."
  - "Defined `.reveal-init, .reveal-on` as a comma-separated rule (one selector list, one animation declaration) inside @media no-preference. The motion-css-rules.test.ts assertion 'lives inside no-preference, run reveal-rise 300ms ease-out' uses the regex `\\.reveal-init[\\s\\S]*?\\.reveal-on[\\s\\S]*?animation: reveal-rise 300ms ease-out` which matches `.reveal-init, .reveal-on { ... }` shape. motion.ts only ever adds .reveal-on (never .reveal-init); .reveal-init is reserved for future progressive-enhancement opt-in (out of scope for Plan 04). Documented in inline CSS comment."
  - "Comment-prose drift-guard pattern (third application this phase): rewrote 'never innerHTML' to 'never raw HTML assignment' in src/scripts/motion.ts to honor `grep -c 'innerHTML' === 0` acceptance criterion. Same Plan 15-02 / Plan 16-02 lesson: when an acceptance criterion grep-counts a substring's absence, the comment text must avoid the matched substring. Documented as a recurring pattern."
  - "BaseLayout.astro `is:inline` count is 2 (umami line 94 + comment line 114 'NOT is:inline'), pre-existing baseline. Plan acceptance criterion `grep -c 'is:inline' === 1` was a planner miscount — the comment-text reference was already in the pre-edit file. Plan-text mismatch accepted per Phase 14-05 / 15-01..04 / 16-01..03 precedent. Drift signal preserved (count rises if a contributor adds another `is:inline` directive — natural baseline of 2 = 1 umami + 1 comment)."
  - "Test count delta: pre-plan 296 GREEN / 42 RED / 338 total -> post-plan 320 GREEN / 18 RED / 338 total (+24 GREEN, -24 RED). The 24 GREEN flips: 12 motion.test.ts + 9 motion-css-rules.test.ts (MOTN-01 view-transition x4, MOTN-02 scroll-reveal x2, MOTN-07 word-stagger x3) + 3 reduced-motion.test.ts Phase 16 describe (MOTN-01, MOTN-02, MOTN-07 gating). Remaining 18 RED: 9 motion-css-rules (MOTN-04 chat-pulse x6, MOTN-05 chat-panel scale-in x3) + 3 work-arrow-motion (MOTN-03) + 4 chat-pulse-coordination (D-15 ordering x3 + .is-open x1) + 2 reduced-motion (MOTN-04, MOTN-05). All 18 are Plan 05 (chat-pulse + scale-in) or Plan 06 (WorkRow arrow) territory, exactly as plan §<acceptance_criteria> predicted."

requirements-completed: [MOTN-01, MOTN-02, MOTN-07]
requirements-partial: [MOTN-08]

# Metrics
duration: 13min
completed: 2026-04-27
---

# Phase 16 Plan 04: motion.ts + global.css view-transition/reveal/word-stagger + BaseLayout wiring Summary

**Created src/scripts/motion.ts (121 LOC) consuming the Plan 02 makeRevealObserver factory, extended src/styles/global.css with native cross-document @view-transition + reveal-rise + word-rise keyframes + reveal-on/.word rules gated by prefers-reduced-motion: no-preference, and wired motion.ts into BaseLayout.astro's body script block — landing MOTN-01 (page-enter fade) + MOTN-02 (scroll-reveal) + MOTN-07 (word-stagger) and the entrance side of MOTN-08 (reduced-motion gate).**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-04-27T19:57:18Z
- **Completed:** 2026-04-27T20:10:30Z
- **Tasks:** 3 (all autonomous, no checkpoints)
- **Files created:** 1 (src/scripts/motion.ts) + 1 SUMMARY
- **Files modified:** 3 (src/styles/global.css, src/layouts/BaseLayout.astro, tests/client/motion.test.ts) + 2 planning docs (REQUIREMENTS.md, ROADMAP.md)

## Accomplishments

- Plan 01 RED test stub (tests/client/motion.test.ts) flipped fully GREEN — 12/12 tests passing including the reduced-motion-first negative case
- 9 motion-css-rules.test.ts assertions flipped GREEN (MOTN-01 view-transition x4 + MOTN-02 scroll-reveal x2 + MOTN-07 word-stagger x3)
- 3 reduced-motion.test.ts Phase 16 assertions flipped GREEN (MOTN-01, MOTN-02, MOTN-07 gating)
- Lighthouse stress guards preserved: will-change=0, cubic-bezier=0 (after CSS comment stripping)
- D-26 chat regression battery 117/117 GREEN across 8 test files (no chat surface regressed)
- src/pages/api/chat.ts byte-identical (D-15 server byte-equivalence preserved)
- pnpm check 0/0/0 (82 files, +1 motion.ts) and pnpm build clean (11 routes prerendered) at every commit
- Existing global.css blocks preserved byte-identical: scroll-behavior (74-81), nav-link-hover reduce (126-133), typing-bounce + .typing-dot (260-280), all chat-related rules
- Reusable Rule 1 self-correction documented (test-file infinite-recursion bug from Plan 01 fixed inline; pattern captured in decisions for future Wave 0 RED stub authoring)

## Task Commits

1. **Task 1: Create src/scripts/motion.ts (scroll-reveal + word-stagger + reduced-motion gate)** — `1020ffd` (feat)
   - Created src/scripts/motion.ts (121 LOC) with 4 exports (initMotion, handleRevealEntry, wrapWordsInPlace, shouldReduceMotion)
   - Fixed tests/client/motion.test.ts importMotion() infinite-recursion bug + removed @ts-expect-error directive (drift signal)
   - 12 motion.test.ts RED -> 12 GREEN; 8 observer-factory.test.ts STILL GREEN

2. **Task 2: Extend src/styles/global.css with view-transition + reveal + word-stagger** — `995f5b2` (feat)
   - Append-only addition (92 lines) at end of file
   - @view-transition at-rule + view-transition-fade-out/in keyframes + reveal-rise + word-rise keyframes + .reveal-init,.reveal-on + .word rules
   - All entrance rules inside @media (prefers-reduced-motion: no-preference)
   - 9 motion-css-rules.test.ts RED -> GREEN; 3 reduced-motion.test.ts RED -> GREEN

3. **Task 3: Wire motion.ts into BaseLayout.astro body script block** — `a6f326a` (feat)
   - Added third import line `import "../scripts/motion.ts";` after analytics.ts + scroll-depth.ts
   - Updated comment annotation block to mention Phase 15-16 + all three modules
   - Verified motion module bundled into dist/client/_astro JS

**Plan metadata commit:** TBD (lands after STATE.md + ROADMAP.md updates)

## Files Created/Modified

### Created (1 source file)

| Path | LOC | Purpose |
|------|-----|---------|
| src/scripts/motion.ts | 121 | Scroll-reveal observer + word-stagger DOM mutation + reduced-motion gate; consumes makeRevealObserver factory |

### Modified

| Path | Diff | Purpose |
|------|------|---------|
| src/styles/global.css | +92 / -0 | Append-only CSS additions for view-transition + reveal-rise + word-rise + .reveal-on + .word rules; existing rules byte-identical |
| src/layouts/BaseLayout.astro | +6 / -5 | One import line added; comment block updated; `<script>` block stays processed (NOT is:inline); umami `is:inline` block at line 94 untouched |
| tests/client/motion.test.ts | +3 / -3 | Rule 1 self-correction: replaced infinite-recursion `return importMotion()` with `return await import("../../src/scripts/motion")`; removed @ts-expect-error directive (drift signal) |
| .planning/REQUIREMENTS.md | +6 / -6 | MOTN-01 / MOTN-02 / MOTN-07 marked Complete (16-04); MOTN-08 marked Partial (entrance side closed; loop side in 16-05) |
| .planning/ROADMAP.md | +2 / -2 | 16-04-PLAN.md row marked complete with 2026-04-27; Phase 16 progress 0/7 -> 4/7 In progress |

### Untouched (D-26 chat regression gate verification)

| Path | Verification |
|------|--------------|
| src/pages/api/chat.ts | `git diff HEAD~3 -- src/pages/api/chat.ts \| wc -l` returns 0 |
| src/scripts/chat.ts | `git diff HEAD~3 -- src/scripts/chat.ts \| wc -l` returns 0 |
| src/components/chat/ChatWidget.astro | Untouched |
| tests/api/chat.test.ts | 8/8 GREEN |
| tests/api/security.test.ts | 33/33 GREEN |
| tests/api/prompt-injection.test.ts | 36/36 GREEN |
| tests/client/markdown.test.ts | 8/8 GREEN |
| tests/client/chat-copy-button.test.ts | 11/11 GREEN |
| tests/client/sse-truncation.test.ts | 4/4 GREEN |
| tests/client/focus-visible.test.ts | 5/5 GREEN |
| tests/client/chat-widget-header.test.ts | 12/12 GREEN |

D-26 chat regression battery total: 117/117 GREEN across 8 test files.

## Decisions Made

See frontmatter `key-decisions` section above for the full list. Headlines:

- **Plan 01 infinite-recursion bug repair** — tests/client/motion.test.ts importMotion() helper was authored with `return importMotion()` (recursive), which would have stack-overflowed every test regardless of motion.ts existence. Rule 1 inline self-correction during Task 1 replaced with `return await import("../../src/scripts/motion")`. Without this fix, the entire RED -> GREEN flip was blocked.
- **Drift-signal directive removal** — `@ts-expect-error` directive on the dynamic import line was already documented in Plan 16-01 SUMMARY as a drift signal that flips to ts(2578) once motion.ts exists. Removed in the same Task 1 commit; acted on as designed.
- **Append-only global.css extension** — 92 lines added at end of file (lines 526-617). Existing scroll-behavior, nav-link-hover, typing-bounce, and all chat rules byte-identical. Verified visually + by sed-extraction. D-26 chat regression gate satisfied.
- **handleRevealEntry caller-managed unobserve** — handleRevealEntry calls `observer.unobserve(entry.target)` itself; factory's oneShot is omitted (defaults false). Avoids double-unobserve while preserving caller authority. Mirrors scroll-depth.ts D-19 byte-equivalence pattern.
- **Defensive .display exclusion** — handleRevealEntry checks `target.matches(".h1-section") && !target.matches(".display")` before word-wrapping. The REVEAL_SELECTOR string already excludes .display, but the defensive check guards against a future selector edit that accidentally widens scope (D-08 homepage hero protection).
- **Comment-prose drift-guard (third application)** — rewrote 'never innerHTML' to 'never raw HTML assignment' in motion.ts to honor `grep -c 'innerHTML' === 0` acceptance criterion. Recurring pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed infinite-recursion in tests/client/motion.test.ts importMotion() helper**
- **Found during:** Task 1 verification (initial test run)
- **Issue:** Plan 16-01 authored the importMotion() helper with `return (importMotion()) as MotionModule;` (line 89). This calls importMotion() recursively, producing `RangeError: Maximum call stack size exceeded` on every test. Without this fix, no motion.test.ts test could ever flip GREEN regardless of motion.ts implementation.
- **Fix:** Replaced the recursive call with `return (await import("../../src/scripts/motion")) as MotionModule;` — what Plan 01 evidently intended. Verified by re-running motion.test.ts (12/12 GREEN after motion.ts created).
- **Files modified:** tests/client/motion.test.ts (3 lines changed)
- **Verification:** `pnpm vitest run tests/client/motion.test.ts --reporter=dot` -> 12/12 GREEN.
- **Committed in:** 1020ffd (Task 1 commit, alongside src/scripts/motion.ts creation)

**2. [Rule 1 - Type Error] Removed @ts-expect-error directive that flipped to ts(2578) once motion.ts existed**
- **Found during:** Task 1 verification (`pnpm check`)
- **Issue:** Plan 16-01 placed `// @ts-expect-error — module created in Plan 16-04` on the dynamic import line. After motion.ts existed, the import resolved cleanly and the directive flipped to ts(2578) "Unused '@ts-expect-error' directive." This was documented in Plan 16-01 SUMMARY as a drift signal: "directive flips to ts(2578) when 16-04 lands the module so the executor of 16-04 must remove this helper or the directive in the same diff as src/scripts/motion.ts."
- **Fix:** Removed the directive; replaced with a plain comment block documenting that Plan 04 has landed the module.
- **Files modified:** tests/client/motion.test.ts (3 lines changed, same edit as #1)
- **Verification:** `pnpm check` -> 0 errors / 0 warnings / 0 hints (82 files).
- **Committed in:** 1020ffd (Task 1 commit, same edit folded together)

**3. [Rule 1 - Comment-prose drift-guard] Reworded 'never innerHTML' comment in motion.ts**
- **Found during:** Task 1 acceptance grep-count verification
- **Issue:** Initial draft had `span.textContent = word; // textContent — never innerHTML, XSS safe` which made `grep -c 'innerHTML' src/scripts/motion.ts` return 1, failing the `=== 0` acceptance criterion.
- **Fix:** Reworded to `// textContent only — never raw HTML assignment, XSS safe`. Same documented intent (XSS safety pattern); zero literal `innerHTML` substring.
- **Files modified:** src/scripts/motion.ts (1 line)
- **Verification:** `grep -c 'innerHTML' src/scripts/motion.ts` -> 0; tests still GREEN (12/12).
- **Committed in:** 1020ffd (Task 1 commit, same edit folded together)

---

**Total deviations:** 3 auto-fixed (1 Rule 1 bug + 1 Rule 1 type error + 1 Rule 1 comment-prose drift-guard).
**Impact on plan:** All three folded into Task 1 commit (1020ffd) — none required rewinding a commit. Both #1 and #2 were prerequisite Plan 01 cleanup that the plan implicitly required (drift signal documented; recursion bug clearly unintended). #3 follows the established Plan 15-02 / Plan 16-02 lesson on comment-prose drift-guards.

## Authentication Gates

None — no auth surfaces touched.

## Issues Encountered

### Plan-text mismatch — BaseLayout `is:inline` count

Plan acceptance criterion: `grep -c 'is:inline' src/layouts/BaseLayout.astro` returns 1. Actual: returns 2. The pre-edit (HEAD before this plan) count was already 2 — line 94 has the umami `<script is:inline ...>` directive (1 match) + line 114 has a JSX comment text `(NOT is:inline)` (1 match). Plan-text was a planner miscount.

**Resolution:** Plan-text mismatch accepted per Phase 14-05 / 15-01..04 / 16-01..03 precedent. Drift signal preserved — count rises from 2 if a future contributor adds another `is:inline` directive, which is what the gate is designed to catch.

### Plan-text mismatch — chat-pulse-coordination 4 GREEN baseline

Plan §<acceptance_criteria> footnoted that chat-pulse-coordination.test.ts shows "2 display-toggle GREEN + remaining RED". Actual at end of Plan 04: 4 RED / 4 GREEN. The 4 GREEN are: 2 display-toggle Phase 7 invariant tests + 2 short-circuit assertions where the order array is empty so `pulseIdx === -1`. The 4 RED are 2 ordering tests (pulseIdx >= 0 expected) + 1 .is-open class test + 1 set-data-pulse-paused test — all Plan 05 territory. Plan §<output> remains accurate: chat-pulse-coordination flips fully on Plan 05 landing.

## Final State

| Metric | Value |
|--------|-------|
| pnpm test (full suite) | 320 GREEN / 18 RED / 338 total (was 296 GREEN / 42 RED / 338 pre-plan) |
| Net delta | +24 GREEN / -24 RED |
| pnpm check (astro check + tsc) | 0 errors / 0 warnings / 0 hints (82 files, +1 motion.ts vs 81 pre-plan) |
| pnpm build | clean end-to-end (build:chat-context -> wrangler types -> astro check -> astro build -> pages-compat); all 11 routes prerendered |
| D-26 chat regression battery | 117/117 GREEN across 8 test files |
| src/pages/api/chat.ts byte-identical | `git diff HEAD~3 -- src/pages/api/chat.ts \| wc -l` returns 0 |
| Lighthouse stress guards | will-change=0, cubic-bezier=0 (CSS comments stripped); MOTN-10 lock held |
| Files committed | 1 created + 3 modified across 3 atomic task commits |
| Existing CSS rules byte-identical | scroll-behavior (lines 74-81), nav-link-hover reduce (lines 126-133), typing-bounce + .typing-dot (lines 260-280), all chat-* rules |

### RED -> GREEN flips (24 total)

| File | Pre-plan | Post-plan | Net |
|------|----------|-----------|-----|
| tests/client/motion.test.ts | 0 GREEN / 12 RED (suite-failing on infinite recursion at start of Plan 04; technically RED at module-load) | 12 GREEN / 0 RED | +12 |
| tests/build/motion-css-rules.test.ts | 4 GREEN / 18 RED | 13 GREEN / 9 RED | +9 |
| tests/client/reduced-motion.test.ts | 5 GREEN / 5 RED (existing 5 + new 5 from Plan 01-extended) | 8 GREEN / 2 RED | +3 |

### Remaining 18 RED (all Plan 05 / Plan 06 territory)

| Test | Owner |
|------|-------|
| motion-css-rules: chat-pulse rgba 0.4 starting ring | 16-05 |
| motion-css-rules: chat-pulse 0 0 0 16px rgba 0 | 16-05 |
| motion-css-rules: chat-pulse scale 1.0->1.02->1.0 | 16-05 |
| motion-css-rules: #chat-bubble runs chat-pulse 2500ms ease-in-out infinite | 16-05 |
| motion-css-rules: pulse pause selectors :hover/:focus-visible/[data-pulse-paused] | 16-05 |
| motion-css-rules: chat-pulse paired reduce neutralizer animation:none | 16-05 |
| motion-css-rules: chat-panel scale-in 180ms ease-out | 16-05 |
| motion-css-rules: chat-panel scale-in keyframe scale 0.96->1.0 | 16-05 |
| motion-css-rules: chat-panel scale-in inside no-preference | 16-05 |
| work-arrow-motion: .work-arrow transition opacity 120ms + transform 180ms | 16-06 |
| work-arrow-motion: hover/focus translateX 4px + opacity 1 | 16-06 |
| work-arrow-motion: reduce neutralizes translateX | 16-06 |
| chat-pulse-coordination: openPanel sets data-pulse-paused BEFORE keydown | 16-05 |
| chat-pulse-coordination: openPanel sets data-pulse-paused | 16-05 |
| chat-pulse-coordination: closePanel removes data-pulse-paused AFTER focus | 16-05 |
| chat-pulse-coordination: openPanel adds .is-open class | 16-05 |
| reduced-motion: MOTN-04 chat-pulse paired reduce | 16-05 |
| reduced-motion: MOTN-05 chat-panel scale-in inside no-preference | 16-05 |

## Next Phase Readiness

- **Plan 16-05 (Wave 3, parallel with 16-06):** chat.ts D-15 ordering edits + global.css chat-pulse keyframe + chat-panel scale-in keyframe + .is-open class + paired reduce overrides. Closes MOTN-04, MOTN-05, MOTN-06 (typing-dot reduce parity), and the loop side of MOTN-08. Will flip 6 motion-css-rules pulse tests + 3 motion-css-rules scale-in tests + 4 chat-pulse-coordination tests + 2 reduced-motion tests = 15 RED -> GREEN. **D-26 chat regression gate APPLIES** (touches chat.ts + global.css + ChatWidget.astro).
- **Plan 16-06 (Wave 3, parallel with 16-05):** WorkRow arrow upgrade — adds `.work-arrow` transition rule (opacity 120ms + transform 180ms) + hover/focus translateX 4px + paired reduce override. Closes MOTN-03. Will flip 3 work-arrow-motion tests RED -> GREEN.
- **Plan 16-07 (Wave 4):** Lighthouse CI run + final D-26 sweep + close-out. Will close MOTN-10 and Phase 16 entirely.

No blockers. Plan 04 lands cleanly with all D-26 chat client surface byte-identical and the entrance-side motion contract in production. Plan 05's chat-pulse + scale-in additions can append to global.css safely as anchored on Plan 04's append-block end.

## Self-Check: PASSED

Verified each created file exists at the recorded path:
- src/scripts/motion.ts: FOUND
- .planning/phases/16-motion-layer/16-04-SUMMARY.md: FOUND (this file)

Verified each commit hash exists in `git log`:
- 1020ffd (Task 1: motion.ts + test fix): FOUND
- 995f5b2 (Task 2: global.css): FOUND
- a6f326a (Task 3: BaseLayout): FOUND

---
*Phase: 16-motion-layer*
*Completed: 2026-04-27*
