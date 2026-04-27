---
phase: 16-motion-layer
plan: 05
subsystem: motion
tags: [motion, chat, phase-16, tdd-green, d26-gate, d15-ordering]

# Dependency graph
requires:
  - phase: 16-motion-layer
    plan: 01
    provides: Wave 0 RED test stubs (chat-pulse-coordination.test.ts D-15 ordering + .is-open assertions; motion-css-rules.test.ts MOTN-04/MOTN-05 chat-pulse + scale-in assertions; reduced-motion.test.ts MOTN-04/MOTN-05 reduce-pairing assertions)
  - phase: 16-motion-layer
    plan: 04
    provides: src/styles/global.css Plan 04 motion block (lines 526-617) — chat-pulse + scale-in additions append adjacent to it; existing typing-bounce + .typing-dot rules at lines 260-280 byte-identical
provides:
  - src/scripts/chat.ts startPulse/stopPulse implementing data-pulse-paused attribute toggling; openPanel/closePanel managing .is-open class on #chat-panel; D-15 ordering invariants (pause-before-focus-trap on open + resume-after-focus on close)
  - src/styles/global.css extended with @keyframes chat-pulse + #chat-bubble unconditional animation + pause selectors + paired reduce neutralizer + MOTN-06 typing-dot reduce parity + @keyframes chat-panel-scale-in + #chat-panel.is-open inside @media no-preference
  - REQUIREMENTS.md MOTN-04, MOTN-05, MOTN-06, MOTN-08 closed (Plan 16-05)
affects:
  - 16-06 (WorkRow arrow MOTN-03) — independent of chat surface; remaining 3 RED tests are work-arrow-motion territory
  - 16-07 (Lighthouse + close-out) — D-15 server byte-identical preserved (api/chat.ts diff = 0); D-26 chat regression battery 117/117 GREEN; will-change=0, cubic-bezier=0 stress-locks held; Phase 7 client invariants (panel.style.display = 'flex'/'none', focus-trap re-query, localStorage persistence, SSE async:false, DOMPurify markdown, clipboard idempotency) all preserved

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure-CSS pulse loop with attribute-driven pause state — `animation-play-state: paused` on `:hover, :focus-visible, [data-pulse-paused]` lets CSS handle hover/focus signals natively while JS only manages the panel-open case via setAttribute/removeAttribute on #chat-bubble (D-15 paired pause/resume)"
    - "D-15 ordering invariants locked by call-order spy assertions — chat-pulse-coordination.test.ts spies on bubble.setAttribute / panel.addEventListener / bubble.focus / bubble.removeAttribute and asserts integer index ordering. Without these spy assertions, ordering would be a comment-level convention; with them it's a CI-enforced contract."
    - "Paired-reduce-override pattern (D-24) — unconditional `#chat-bubble { animation: chat-pulse 2500ms ... }` rule co-located with `@media (prefers-reduced-motion: reduce) { #chat-bubble { animation: none; } }` neutralizer. Reviewability: reading the rule and its neutralizer in adjacent CSS lines is more obvious than wrapping the rule in `@media (prefers-reduced-motion: no-preference)`. Used for LOOPS only; entrances (Plan 04) wrap in no-preference instead."
    - "Phase 7 invariant additivity — `.is-open` class is added/removed at runtime alongside the existing `panel.style.display = 'flex'/'none'` toggle inside animatePanelOpen/Close. The class is an additive entrance hook, NOT a replacement for the display-toggle semantics. ChatWidget.astro's inline `style=\"display: none; ...\"` initial state stays untouched — no markup change."
    - "hasAttribute guard on startPulse — keeps the initial init-time `startPulse($bubble)` call (line 521, fired once during initChat) a true DOM no-op so test spies on removeAttribute don't record a phantom invocation pre-cycle. This was discovered via Rule 1 inline self-correction during Task 1 verification (the closePanel-removes-AFTER-focus call-order assertion failed without the guard because the order array recorded the initial removeAttribute before bubble.click() opened the panel)."
    - "Comment-prose drift-guard — 4th application across Phase 15-02 / 16-02 / 16-04 / 16-05. When an acceptance grep counts a substring's exact occurrence (`=== 1` or `=== 0`), comment text must avoid the matched substring while preserving documented intent. This plan reworded a CSS comment from 'animation-play-state: paused freezes the keyframe' to 'The pause declaration below freezes the keyframe' to honor `grep -c 'animation-play-state: paused' === 1`."

key-files:
  created:
    - .planning/phases/16-motion-layer/16-05-SUMMARY.md
  modified:
    - src/scripts/chat.ts (+25 -5 lines; startPulse/stopPulse no-op stubs replaced with data-pulse-paused toggling; stopPulse signature `()` -> `(bubble: HTMLElement)`; openPanel adds `.is-open` class + updated stopPulse call site; closePanel removes `.is-open` class near top + startPulse call site unchanged signature)
    - src/styles/global.css (+91 lines append-only; @keyframes chat-pulse + #chat-bubble unconditional animation rule + pause selectors + paired reduce neutralizer + MOTN-06 typing-dot reduce parity + @keyframes chat-panel-scale-in + #chat-panel.is-open inside @media no-preference)
    - .planning/REQUIREMENTS.md (MOTN-04, MOTN-05, MOTN-06 marked Complete; MOTN-08 marked Complete; traceability table updated)
    - .planning/ROADMAP.md (16-05-PLAN.md row marked complete with 2026-04-27; Phase 16 progress 4/7 -> 5/7 In progress)
    - .planning/STATE.md (will be updated post-SUMMARY)

key-decisions:
  - "startPulse uses `if (bubble.hasAttribute('data-pulse-paused')) bubble.removeAttribute(...)` guard so the initial init-time call (line 521) is a true DOM no-op. Without this guard the chat-pulse-coordination 'closePanel removes data-pulse-paused AFTER focus' call-order test went RED on the first run because the order-tracking spy on removeAttribute recorded the initial startPulse invocation BEFORE bubble.click() opened the panel and BEFORE bubble.focus() ran on close, causing focusIdx > removeIdx. Discovered via Rule 1 inline self-correction during Task 1 verification — folded into 09284d3, no separate fix commit."
  - "stopPulse signature changed from `()` to `(bubble: HTMLElement)`. Single existing call site at openPanel:527 was updated to pass `$bubble`. The Plan 8 D-27 carryover note in MASTER.md §6.1 about deferred chat motion is now released — Plan 16-05 closes that carryover."
  - "D-15 ordering invariants: openPanel calls `stopPulse($bubble)` (setAttribute) AND `$panel.classList.add('is-open')` BEFORE the existing `cleanupFocusTrap = setupFocusTrap(...)` call ~58 lines later (line 588). closePanel calls `$panel.classList.remove('is-open')` near the top (next to the existing `chat-panel-mobile` removal at line 598), then inside `animatePanelClose($panel).then()` calls `$bubble.focus()` THEN `startPulse($bubble)` (which removeAttribute's data-pulse-paused). Both orderings locked by chat-pulse-coordination.test.ts call-order spy assertions."
  - "Phase 7 panel.style.display = 'flex'/'none' invariant byte-identical inside animatePanelOpen/Close bodies; `.is-open` is the additive entrance hook only. ChatWidget.astro untouched — the inline `style='display: none; ...'` initial state stays as-is. Verified by `grep -c 'panel.style.display = \"flex\"'` and `'... = \"none\"'` returning 1 each."
  - "global.css extension is purely append-only — 91 lines added adjacent to Plan 04's motion block (lines 619-709 approximately). Existing scroll-behavior block (74-81), nav-link-hover reduce block (126-133), typing-bounce + .typing-dot rules (260-280), and Plan 04 view-transition + reveal/word-stagger blocks (526-617) all byte-identical."
  - "@keyframes chat-pulse uses 3 stops per D-14: 0% box-shadow `0 0 0 0 rgba(230, 57, 70, 0.4)` + transform `scale(1.0)`; 50% box-shadow `0 0 0 16px rgba(230, 57, 70, 0)` + transform `scale(1.02)`; 100% box-shadow `0 0 0 0 rgba(230, 57, 70, 0)` + transform `scale(1.0)`. Accent token `#E63946` converted to rgba at the keyframe site only — `--accent` remains a pure hex token (no rgba alias introduced in :root)."
  - "Pause selectors compound into one rule: `#chat-bubble:hover, #chat-bubble:focus-visible, #chat-bubble[data-pulse-paused] { animation-play-state: paused; }` per D-15. The attribute selector `[data-pulse-paused]` matches when the attribute is present (any value, including empty string `''`). chat.ts stopPulse calls `bubble.setAttribute('data-pulse-paused', '')` which sets the empty-string value; the selector matches. No need for a value-equality test."
  - "Paired @media (prefers-reduced-motion: reduce) { #chat-bubble { animation: none; } } neutralizer is the loop-side D-24 paired-override pattern. Unconditional rule + reduce neutralizer co-located in adjacent lines for reviewability. MOTN-06 typing-dot reduce-override added as a sibling block (also paired pattern) for parity — the original @keyframes typing-bounce + .typing-dot rule at lines 260-280 stays byte-identical; the override is purely additive."
  - "@keyframes chat-panel-scale-in declared OUTSIDE any media query — keyframes have no media gating; only the rules that REFERENCE them are gated. Same pattern as the existing typing-bounce + Plan 04's view-transition keyframes. Inside @media (prefers-reduced-motion: no-preference) the rules are: `#chat-panel { transform-origin: bottom right; }` + `#chat-panel.is-open { animation: chat-panel-scale-in 180ms ease-out forwards; }`. Under reduce, the rules don't match and the panel renders without animation."
  - "Comment-prose drift-guard during Task 2 (4th application) — initial draft of the pause-states block had a comment ending with '...animation-play-state: paused freezes the keyframe...' which made `grep -c 'animation-play-state: paused' src/styles/global.css` return 2 (one in the rule + one in the comment), failing the acceptance grep `=== 1`. Fix: rewrote the comment to 'The pause declaration below freezes the keyframe at its current position' — same documented intent, zero literal substring collision. Folded into c98a87d before commit."
  - "D-26 chat regression gate satisfied — battery 117/117 GREEN across 8 test files (chat.test.ts 8 + security.test.ts 33 + prompt-injection.test.ts 36 + markdown.test.ts 8 + chat-copy-button.test.ts 11 + sse-truncation.test.ts 4 + focus-visible.test.ts 5 + chat-widget-header.test.ts 12). Verified: src/pages/api/chat.ts byte-identical (`git diff HEAD~2 -- src/pages/api/chat.ts | wc -l` returns 0 across both task commits); src/components/chat/ChatWidget.astro untouched. Battery run after Task 1 (chat.ts edits) AND after Task 2 (CSS edits) — neither edit regressed any Phase 7 invariant."
  - "Test count delta: 320 GREEN / 18 RED / 338 → 335 GREEN / 3 RED / 338. Net +15 GREEN: 9 motion-css-rules.test.ts (chat-pulse rgba 0.4 starting ring + chat-pulse 16px rgba 0 + chat-pulse scale 1.0 → 1.02 + #chat-bubble runs chat-pulse 2500ms ease-in-out infinite + pulse-pause selectors :hover/:focus-visible/[data-pulse-paused] + paired reduce neutralizer animation:none + chat-panel.is-open 180ms ease-out + scale 0.96 + transform-origin bottom right) + 4 chat-pulse-coordination.test.ts (openPanel sets data-pulse-paused BEFORE keydown + openPanel adds .is-open + closePanel removes data-pulse-paused AFTER focus + closePanel removes .is-open) + 2 reduced-motion.test.ts (MOTN-04 chat-pulse paired reduce + MOTN-05 chat-panel scale-in inside no-preference). Remaining 3 RED all Plan 06 work-arrow-motion territory (MOTN-03)."

requirements-completed: [MOTN-04, MOTN-05, MOTN-06, MOTN-08]

# Metrics
duration: 8min
completed: 2026-04-27
---

# Phase 16 Plan 05: Chat motion (chat.ts D-15 + chat-pulse + chat-panel scale-in + MOTN-06 reduce parity) Summary

**Wired src/scripts/chat.ts D-15 pulse coordination (data-pulse-paused attribute toggling on #chat-bubble + .is-open class on #chat-panel with strict before-focus-trap / after-focus-restoration ordering) and extended src/styles/global.css with @keyframes chat-pulse + #chat-bubble unconditional animation + pause selectors + paired reduce neutralizer + MOTN-06 typing-dot reduce parity + @keyframes chat-panel-scale-in + #chat-panel.is-open inside no-preference — closing MOTN-04, MOTN-05, MOTN-06, and the loop side of MOTN-08 while holding the D-26 chat regression battery at 117/117 GREEN and the D-15 server byte-identical gate at 0 lines diff.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-27T20:21:53Z
- **Completed:** 2026-04-27T20:30:19Z
- **Tasks:** 2 (all autonomous, no checkpoints)
- **Files created:** 0 source + 1 SUMMARY (this file)
- **Files modified:** 2 source (src/scripts/chat.ts +25/-5; src/styles/global.css +91 append-only) + 3 planning docs (REQUIREMENTS.md, ROADMAP.md, STATE.md)

## Accomplishments

- 15 RED → GREEN flips: 9 motion-css-rules.test.ts (MOTN-04 chat-pulse x6 + MOTN-05 chat-panel scale-in x3) + 4 chat-pulse-coordination.test.ts (D-15 ordering x3 + .is-open x1) + 2 reduced-motion.test.ts (MOTN-04 + MOTN-05 reduce gating)
- D-26 chat regression battery 117/117 GREEN across 8 test files (verified after BOTH task commits, not just initial Task 1 wiring)
- D-15 server byte-identical held: `git diff HEAD~2 -- src/pages/api/chat.ts | wc -l` returns 0 across both task commits
- Phase 7 panel.style.display = 'flex'/'none' invariant preserved byte-identical (animatePanelOpen/Close bodies untouched); `.is-open` is the additive entrance hook only
- Lighthouse stress guards held: will-change=0, cubic-bezier=0 (after CSS comment stripping per motion-css-rules test)
- pnpm check 0/0/0 (82 files; same count as 16-04) and pnpm build clean (11 routes prerendered) at every commit
- Existing global.css blocks preserved byte-identical: scroll-behavior (74-81), nav-link-hover reduce (126-133), typing-bounce + .typing-dot (260-280), Plan 04 view-transition + reveal/word-stagger (526-617)
- ChatWidget.astro untouched — inline `style='display: none; ...'` initial state stays as-is; no markup change
- 2 Rule 1 inline self-corrections folded into the appropriate task commits (no separate fix commits)

## Task Commits

1. **Task 1: Wire chat.ts D-15 pulse coordination + .is-open class hooks** — `09284d3` (feat)
   - Replaced startPulse/stopPulse no-op stubs (lines 451-457) with data-pulse-paused attribute toggling
   - openPanel: pause pulse + add .is-open class BEFORE setupFocusTrap (D-15 ordering)
   - closePanel: remove .is-open early; resume pulse inside .then() AFTER bubble.focus() (D-15 ordering)
   - hasAttribute guard on startPulse (Rule 1 inline self-correction) — keeps initial init-time call a true no-op
   - 4 chat-pulse-coordination.test.ts D-15 ordering + .is-open RED → GREEN; D-26 battery 117/117 GREEN

2. **Task 2: Extend global.css with chat-pulse + chat-panel scale-in + MOTN-06 reduce parity** — `c98a87d` (feat)
   - +91 lines append-only adjacent to Plan 04's motion block
   - @keyframes chat-pulse (D-14 box-shadow + transform combined effect, 2500ms ease-in-out infinite)
   - #chat-bubble unconditional animation + pause selectors (:hover, :focus-visible, [data-pulse-paused] → animation-play-state: paused)
   - Paired @media (prefers-reduced-motion: reduce) #chat-bubble animation: none neutralizer (D-24)
   - MOTN-06 typing-dot reduce-override parity (existing typing-bounce + .typing-dot rules byte-identical)
   - @keyframes chat-panel-scale-in (transform scale 0.96 → 1.0 + opacity 0 → 1) + #chat-panel.is-open inside @media no-preference (180ms ease-out forwards, transform-origin: bottom right per MOTN-05)
   - Comment-prose drift-guard (Rule 1 inline self-correction) on `animation-play-state: paused` to honor grep === 1 acceptance criterion
   - 9 motion-css-rules.test.ts + 2 reduced-motion.test.ts RED → GREEN; D-26 battery 117/117 GREEN

**Plan metadata commit:** TBD (lands after STATE.md + ROADMAP.md updates)

## Files Created/Modified

### Modified

| Path | Diff | Purpose |
|------|------|---------|
| src/scripts/chat.ts | +25 / -5 | startPulse/stopPulse no-op stubs replaced with data-pulse-paused toggling; openPanel adds .is-open class + updated stopPulse call site; closePanel removes .is-open class near top + startPulse call site signature unchanged; hasAttribute guard keeps initial call a no-op |
| src/styles/global.css | +91 / -0 | Append-only adjacent to Plan 04's motion block — @keyframes chat-pulse + #chat-bubble unconditional animation + pause selectors + paired reduce neutralizer + MOTN-06 typing-dot reduce parity + @keyframes chat-panel-scale-in + #chat-panel.is-open inside @media no-preference |
| .planning/REQUIREMENTS.md | +6 / -6 | MOTN-04 / MOTN-05 / MOTN-06 / MOTN-08 marked Complete (Plan 16-05); traceability table updated |
| .planning/ROADMAP.md | +2 / -2 | 16-05-PLAN.md row marked complete with 2026-04-27; Phase 16 progress 4/7 → 5/7 In progress |

### Untouched (D-26 chat regression gate verification)

| Path | Verification |
|------|--------------|
| src/pages/api/chat.ts | `git diff HEAD~2 -- src/pages/api/chat.ts \| wc -l` returns 0 (D-15 server byte-identical) |
| src/components/chat/ChatWidget.astro | Untouched — inline `style="display: none; ..."` initial state stays as-is |
| tests/api/chat.test.ts | 8/8 GREEN |
| tests/api/security.test.ts | 33/33 GREEN |
| tests/api/prompt-injection.test.ts | 36/36 GREEN |
| tests/client/markdown.test.ts | 8/8 GREEN |
| tests/client/chat-copy-button.test.ts | 11/11 GREEN |
| tests/client/sse-truncation.test.ts | 4/4 GREEN |
| tests/client/focus-visible.test.ts | 5/5 GREEN |
| tests/client/chat-widget-header.test.ts | 12/12 GREEN |

D-26 chat regression battery total: 117/117 GREEN across 8 test files (verified after BOTH task commits).

## Decisions Made

See frontmatter `key-decisions` section above for the full list. Headlines:

- **hasAttribute guard on startPulse** — initial init-time call must be a true DOM no-op so test spies on removeAttribute don't record a phantom invocation pre-cycle. Without this guard, the closePanel-removes-AFTER-focus call-order assertion failed because the order array recorded the initial removeAttribute before bubble.click()/bubble.focus(). Rule 1 inline self-correction during Task 1 verification.
- **D-15 ordering invariants** — openPanel pauses pulse + adds .is-open BEFORE setupFocusTrap (~58 lines apart in the actual file, but the order is what matters for the call-order spy assertion). closePanel removes .is-open early, then resumes pulse inside .then() AFTER bubble.focus(). Both locked by call-order spy assertions on bubble.setAttribute / panel.addEventListener / bubble.focus / bubble.removeAttribute.
- **Phase 7 panel.style.display invariant preserved** — `.is-open` is purely additive; animatePanelOpen/Close bodies are byte-identical inside the function. ChatWidget.astro untouched.
- **Append-only global.css extension** — 91 lines added adjacent to Plan 04's motion block. All existing CSS rules byte-identical (verified by grep counts and the motion-css-rules.test.ts `typing-bounce byte-equivalence` regex still GREEN).
- **Paired-reduce-override pattern (D-24)** — unconditional `#chat-bubble { animation: chat-pulse ... }` co-located with `@media (prefers-reduced-motion: reduce) { #chat-bubble { animation: none; } }` neutralizer in adjacent lines. MOTN-06 typing-dot reduce-override added as a sibling block for parity.
- **Comment-prose drift-guard (4th application)** — rewrote 'animation-play-state: paused freezes the keyframe' to 'The pause declaration below freezes the keyframe' to honor `grep -c 'animation-play-state: paused' === 1` acceptance criterion. Same lesson as Plan 15-02 / 16-02 / 16-04 (innerHTML, observer.unobserve, cubic-bezier prose drift-guards).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added hasAttribute guard to startPulse to prevent phantom spy invocation**
- **Found during:** Task 1 verification (initial test run)
- **Issue:** The plan's Edit 1 specified `bubble.removeAttribute("data-pulse-paused");` unconditionally inside startPulse. With this implementation, the initial init-time `startPulse($bubble)` call at chat.ts:521 (fired once during initChat) records a removeAttribute invocation on the test spy even though the bubble has never had the attribute set — DOM-wise it's a no-op, but spy-wise it's recorded. The chat-pulse-coordination test "closePanel removes data-pulse-paused AFTER bubble.focus() is called" uses `order.indexOf(...)` which finds the FIRST occurrence; the initial startPulse call was recorded BEFORE bubble.click() opened the panel and BEFORE bubble.focus() ran on close, so focusIdx > removeIdx and the assertion `expect(focusIdx).toBeLessThan(removeIdx)` failed.
- **Fix:** Wrapped removeAttribute in `if (bubble.hasAttribute("data-pulse-paused"))` guard. Now the initial call is a true DOM no-op (no method invocation at all on a fresh bubble), and the spy only records the removeAttribute when there's actually an attribute to remove (i.e., during the closePanel resume-pulse path inside the .then() callback after focus).
- **Files modified:** src/scripts/chat.ts (3 added lines: the if check + closing brace)
- **Verification:** `pnpm vitest run tests/client/chat-pulse-coordination.test.ts --reporter=dot` → 8/8 GREEN.
- **Committed in:** 09284d3 (Task 1 commit, alongside the main D-15 wiring)

**2. [Rule 1 - Comment-prose drift-guard] Reworded `animation-play-state: paused` comment in global.css**
- **Found during:** Task 2 acceptance grep-count verification
- **Issue:** Initial draft of the pause-states block had a multi-line comment ending with "...animation-play-state: paused freezes the keyframe at its current position without resetting (resume picks up where it left off). */" which made `grep -c 'animation-play-state: paused' src/styles/global.css` return 2 (one in the actual `animation-play-state: paused;` declaration + one in the comment text), failing the acceptance grep `=== 1`.
- **Fix:** Reworded the comment to "The pause declaration below freezes the keyframe at its current position without resetting (resume picks up where it left off)." — same documented intent (the pause declaration is the very next line of CSS), zero literal substring collision.
- **Files modified:** src/styles/global.css (1 line of comment text reworded)
- **Verification:** `grep -c 'animation-play-state: paused' src/styles/global.css` → 1; tests/build/motion-css-rules.test.ts still 22/22 GREEN (the test uses regex `/animation-play-state:\s*paused/` which only requires a match, not exact count).
- **Committed in:** c98a87d (Task 2 commit, same edit folded together)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 bug + 1 Rule 1 comment-prose drift-guard).
**Impact on plan:** Both folded into the appropriate task commits (09284d3 and c98a87d) — no separate fix commits needed. #1 is a defensive correction to plan's Edit 1 spec — the plan implicitly required passing the test which couldn't pass without the guard. #2 follows the established Plan 15-02 / 16-02 / 16-04 pattern of reconciling acceptance grep counts with comment-driven self-documentation.

## Authentication Gates

None — no auth surfaces touched.

## Issues Encountered

### Plan-text mismatch — `cleanupFocusTrap = setupFocusTrap` count

Plan acceptance criterion: `grep -c 'cleanupFocusTrap = setupFocusTrap' src/scripts/chat.ts` returns 1. Actual: returns 2. The pre-edit (HEAD before this plan) count was already 2: line 482 (initChat re-attach branch when navigating to a page where the panel is open via transition:persist) + line 588 (openPanel). Plan-text was a planner miscount.

**Resolution:** Plan-text mismatch accepted per Phase 14-05 / 15-01..04 / 16-01..04 precedent. The actual gate the plan cared about — that the focus-trap setup IS preserved (D-26 invariant) — is satisfied by both call sites being byte-identical to pre-edit. Drift signal preserved (count rises if a contributor adds another `cleanupFocusTrap = setupFocusTrap` site, which is what the gate is designed to catch).

## Final State

| Metric | Value |
|--------|-------|
| pnpm test (full suite) | 335 GREEN / 3 RED / 338 total (was 320 GREEN / 18 RED / 338 pre-plan) |
| Net delta | +15 GREEN / -15 RED |
| pnpm check (astro check + tsc) | 0 errors / 0 warnings / 0 hints (82 files, same count as pre-plan) |
| pnpm build | clean end-to-end (build:chat-context → wrangler types → astro check → astro build → pages-compat); all 11 routes prerendered |
| D-26 chat regression battery | 117/117 GREEN across 8 test files (post-Task 1 AND post-Task 2) |
| src/pages/api/chat.ts byte-identical | `git diff HEAD~2 -- src/pages/api/chat.ts \| wc -l` returns 0 |
| Lighthouse stress guards | will-change=0, cubic-bezier=0 (after CSS comment stripping); MOTN-10 lock held |
| Files committed | 0 created + 2 source modified across 2 atomic task commits |
| Existing CSS rules byte-identical | scroll-behavior (74-81), nav-link-hover reduce (126-133), typing-bounce + .typing-dot (260-280), Plan 04 view-transition + reveal/word-stagger (526-617) |

### RED → GREEN flips (15 total)

| File | Pre-plan | Post-plan | Net |
|------|----------|-----------|-----|
| tests/build/motion-css-rules.test.ts | 13 GREEN / 9 RED | 22 GREEN / 0 RED | +9 |
| tests/client/chat-pulse-coordination.test.ts | 4 GREEN / 4 RED | 8 GREEN / 0 RED | +4 |
| tests/client/reduced-motion.test.ts | 8 GREEN / 2 RED | 10 GREEN / 0 RED | +2 |

### Remaining 3 RED (all Plan 06 work-arrow territory)

| Test | Owner |
|------|-------|
| work-arrow-motion: `.work-arrow` declares transition opacity 120ms ease, transform 180ms ease-out | 16-06 |
| work-arrow-motion: hover/focus rule applies transform translateX(4px) and opacity 1 | 16-06 |
| work-arrow-motion: @media (prefers-reduced-motion: reduce) block neutralizes arrow translateX + keeps opacity 0 | 16-06 |

## Next Phase Readiness

- **Plan 16-06 (Wave 3, last remaining):** WorkRow arrow upgrade — adds `.work-arrow` transition rule (opacity 120ms + transform 180ms ease-out) + hover/focus translateX 4px + paired reduce override. Closes MOTN-03. Will flip 3 work-arrow-motion tests RED → GREEN. Independent of chat surface — D-26 gate does NOT apply (touches WorkRow.astro scoped style only).
- **Plan 16-07 (Wave 4):** Lighthouse CI run + final D-26 sweep + close-out. Will close MOTN-10 and Phase 16 entirely.

No blockers. Plan 05 lands cleanly with all D-26 chat client surface byte-identical and the loop side of the motion contract in production. Plan 06's WorkRow arrow upgrade is independent and can land in parallel with 16-07's planning.

## Self-Check: PASSED

Verified each created file exists at the recorded path:
- .planning/phases/16-motion-layer/16-05-SUMMARY.md: FOUND (this file)

Verified each commit hash exists in `git log`:
- 09284d3 (Task 1: chat.ts D-15 wiring): FOUND
- c98a87d (Task 2: global.css MOTN-04/05/06 extensions): FOUND

---
*Phase: 16-motion-layer*
*Completed: 2026-04-27*
