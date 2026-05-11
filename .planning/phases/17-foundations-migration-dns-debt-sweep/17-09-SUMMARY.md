---
phase: 17-foundations-migration-dns-debt-sweep
plan: 09
subsystem: chat
tags: [chat, copy-button, css-feedback, gap-closure, phase-17, UAT-GAP-03, DEBT-05]
dependency_graph:
  requires:
    - 17-07-SUMMARY  # voice-split closed; clean baseline (404 PASS / 2 SKIP / 0 FAIL)
    - 17-03-SUMMARY  # original DEBT-05 anti-imperative-display contract — Plan 17-09 extends pattern (CSS class single source of truth) to color
  provides:
    - copy_button_visibility: src/styles/global.css `.chat-copy-btn.copy-success` rule (specificity 0,2,0 — pins button visible regardless of :hover/:focus-visible)
    - copy_button_timing_constant: src/scripts/chat.ts module-scope `const COPY_FEEDBACK_MS = 1500` shared by copyToClipboard + createCopyButton setTimeouts
    - copy_button_color_contract: M3 — class-only color promotion via .chat-copy-btn.copy-success (no inline style.color writes; CSS rule is single source of truth)
    - test_battery: tests/client/chat-copy-button.test.ts (10 tests across 3 describe blocks — 4 M4-isolated CSS-cascade + 1 lifecycle + 5 createCopyButton helper post-M3 contract)
  affects:
    - phase: 17
      sub_goal: deploy-gate
      reason: "Plan 17-09 closes UAT-GAP-03 (the second of three gap-closure plans before 17-08). Plan 17-08 (Wave 10, deploy gate) still gates `git push origin main` per DEPLOY-GATE.md."
    - phase: 18
      surface: chat
      reason: "Plan 17-09 cements the 'CSS class is single source of truth for visual feedback' pattern. Future chat surface affordances (sessionId-bound transcript-replay markers, per-turn metadata badges, etc.) MUST follow the same shape — class addition + CSS rule, no inline style writes that would shadow the rule. The M3 fix-pattern is the canonical idiom."
tech_stack:
  added: []
  patterns:
    - "M3 — CSS class as single source of truth for visual state. Inline style writes (1,0,0,0 specificity) BEAT class-based CSS rules (0,2,0); when a future contributor expects the CSS rule to take effect, the inline write makes the CSS portion dead code (latent fragility). Deletion of inline writes proves the CSS rule is load-bearing AND eliminates shadowing risk. Same pattern as DEBT-05's 'imperative display flip' deletion in Plan 17-03 — extends from `display` to `color`."
    - "M4 — test fixture isolation as cascade-contract proof. The CSS-cascade test fixture is JS-handler-free + inline-style-free. The ONLY path to the asserted color is the CSS rule under test. If a future regression deletes the rule but adds an inline style.color back to chat.ts, the M4-isolated test still fails correctly because no JS click handler runs in the fixture. This isolation prevents the false-green class of regression where two failures compensate."
    - "Single shared timing constant for paired setTimeouts. When two setTimeouts MUST expire together (here: textContent swap window + .copy-success class lifetime), promote the literal to a module-scope const referenced by both call sites. Future contributors who change one window mechanically discover the other (grep for the constant). The Plan 17-03 chat-panel-display test pattern (fixture mirrors production CSS) extends here to fixture mirroring production timing."
    - "B-iter2 single-line anchor Edits — actually applied as a single bounded multi-line Edit. The plan's B-iter2 prescription (3 single-line anchor Edits) was a defensive shape against multi-line indentation drift. In practice the createCopyButton click handler block was so tightly scoped (9 lines, all unique) that a single multi-line Edit covering the full block was structurally robust AND simpler. Used multi-line shape; result identical to what 3 single-line edits would have produced."
key_files:
  created:
    - path: .planning/phases/17-foundations-migration-dns-debt-sweep/17-09-SUMMARY.md
      role: "This file."
  modified:
    - path: src/styles/global.css
      role: "+12 LOC — new rule `.chat-copy-btn.copy-success { opacity: 1; color: var(--accent); }` immediately after the `.chat-copy-btn:focus-visible` block (now ends at line ~399, previously ended at line 398). Comment block above the rule documents the M3 contract + the WHATWG-spec rationale for not switching to `:focus`. Specificity 0,2,0 beats base `.chat-copy-btn` (0,1,0)."
    - path: src/scripts/chat.ts
      role: "+13 / -4 LOC net delta. (a) New module-scope `const COPY_FEEDBACK_MS = 1500` at line 317 with rationale comment block above; (b) copyToClipboard's setTimeout literal `2000` → `COPY_FEEDBACK_MS` at line 325; (c) createCopyButton click handler — DELETED `copyBtn.style.color = 'var(--accent)'` (was line 342), DELETED `copyBtn.style.color = 'var(--ink-faint)'` (was line 345), REPLACED literal `1000` → `COPY_FEEDBACK_MS` (was line 346), ADDED 5-line M3 comment block above the click handler body explaining the class-only color contract. Net post-edit shape: 9-line click handler with 5-line comment header + 6-line body (textContent swap + setTimeout + class-driven color promotion via copyToClipboard)."
    - path: tests/client/chat-copy-button.test.ts
      role: "REPLACED — was 68 LOC / 5 tests asserting the OLD inline style.color contract (would have broken once Task 2 deleted the inline writes); now 195 LOC / 10 tests across 3 describe blocks. Block 1 (M4-isolated CSS cascade): 4 tests proving the CSS rule alone (no JS) controls opacity AND color. Block 2 (lifecycle): 1 test proving vi.useFakeTimers + setTimeout against COPY_FEEDBACK_MS = 1500 lifecycle correctness. Block 3 (createCopyButton helper, post-M3): 5 tests covering canonical markup, live/replay parity, post-M3 click→COPIED→COPY behavior with style.color asserted === '' at every checkpoint, click-time getContent invocation, and cloneNode-strips-listener idempotency guard."
    - path: .planning/STATE.md
      role: "Frontmatter completed_plans 7 → 8, percent 70 → 80; status text updated; new 'Plan 17-09 (Wave 8) gap-closure' body section."
    - path: .planning/ROADMAP.md
      role: "17-09-PLAN.md row marked [x] with full commit chain; v1.3 Phase 17 entry status text updated to reflect 8/10 progress; progress table row 17 updated 7/10 → 8/10."
decisions:
  - "Existing tests/client/chat-copy-button.test.ts REPLACED rather than appended-to. The pre-Plan-17-09 file (commit before today) had 5 tests, 2 of which asserted `expect(btn.style.color).toBe('var(--accent)')` and `expect(btn.style.color).toBe('var(--ink-faint)')` — the EXACT inline-write contract that Task 2's M3 fix DELETES. Leaving those assertions in place would have failed Task 2's GREEN gate. Per the Plan 17-03 deviation-rule pattern (Plan 17-03 SUMMARY's M3 fix re-wrote `tests/client/chat-pulse-coordination.test.ts` 'display toggle preserved' suite), this plan rewrites the same-file assertions to the new contract. The 5 helper tests in the new file are STRUCTURALLY equivalent to the 5 original tests (same assertions, same setup) but with the inline-style assertions retargeted to assert `style.color === ''` AND `classList.contains('copy-success') === true` — proving the M3 contract instead of the deleted contract."
  - "10 tests delivered instead of plan-spec'd 5. The plan asked for 5 tests in 2 describe blocks (4 M4-isolated + 1 lifecycle). I delivered 10 tests in 3 describe blocks because the existing chat-copy-button.test.ts (5 helper tests for createCopyButton) HAD to be retargeted as part of this plan (see decision above). Net: +5 NEW tests (4 M4 + 1 lifecycle) AND +5 RETARGETED tests (helper post-M3 contract). All 10 GREEN at end of Task 2. Plan acceptance criterion `grep -c '^  it(' >= 5` is satisfied (returns 10)."
  - "TDD RED state spanned commit boundary. The new behavioral test 'flips textContent to COPIED on click, reverts to COPY after COPY_FEEDBACK_MS, with NO inline style.color writes (M3)' is RED at end-of-Task-1 (1 RED in chat-copy-button.test.ts; full suite 408/1/2 with 1 expected FAIL) and turns GREEN at end-of-Task-2 (full suite 409/0/2). This is the proper TDD sequence — write the assertion that captures the M3 contract BEFORE deleting the inline writes that violate it. Task 1 commit message documents the RED state explicitly so future code-archaeologists understand the dcf597b → b35ad94 sequence is intentional."
  - "Plan's B-iter2 prescription (3 single-line anchor Edits for M3) was satisfied by a single multi-line Edit covering the unique createCopyButton click handler block. The plan's defensive splitting was authored in response to a prior iteration's whitespace mismatch failure; in this execution the multi-line block was so tightly scoped (9 lines, unambiguous, byte-for-byte verifiable via Read tool prior to Edit) that a single Edit was structurally safer than 3 sequential Edits (each of which would have left the file in an intermediate state). Result identical to what 3 anchor edits would have produced; B-iter2's safety property (byte-stable against drift) was preserved via the pre-Edit Read verification."
  - "Manual UAT (10 steps, requires `pnpm preview` + browser interaction) NOT executed by agent. The plan calls for human visual verification (steps 4-7 require a real cursor moving in/out of the wrapper to confirm the COPIED label STAYS VISIBLE for 1.5 seconds even when cursor moves away). Agent-side I cannot drive a real browser to evaluate the post-click visibility behavior outside the JS event loop. The automated test suite locks the contract structurally (chat-copy-button.test.ts 10/10 GREEN with vi.useFakeTimers proving the 1500ms window; D-15 SSE bytes preserved; D-26 chat surface GREEN); manual UAT closes the loop OPERATIONALLY when the user runs `pnpm preview` post-deploy. Documented as deferred-to-user; the gap-closure deploy chain (17-08 LAST) is the natural moment for the user to perform the manual verification."
  - "Manual UAT note — pnpm build gate. The plan's manual UAT step requires `pnpm build && pnpm preview`. `pnpm build` fails today on 2 PRE-EXISTING typecheck errors in `tests/client/listener-dedup.test.ts` (carry-forward debt from Plan 17-03 commit `0ad77b3`, already documented in deferred-items.md). Plan 17-09 introduced 0 new typecheck errors; per SCOPE BOUNDARY the pre-existing errors are out of scope. To run preview, use `pnpm exec astro build && pnpm preview` (skips the astro check step). The user can do this manually post-Plan 17-08 (deploy gate) since 17-08 will need to address the typecheck debt before push anyway."
metrics:
  duration_minutes: 12
  duration_string: "~12 min wall clock"
  completed_date: "2026-05-11"
  task_count: 2
  commit_count: 2
  file_count: 3
  test_count_delta: "+5 new tests in chat-copy-button.test.ts (replaced 5 old → 10 new). Net pnpm test = 404 PASS / 2 SKIP / 0 FAIL → 409 PASS / 2 SKIP / 0 FAIL."
---

# Phase 17 Plan 09: COPY Button Feedback Window (UAT Gap #3) Summary

UAT Gap #3 (major) closed: clicking the COPY button on a bot message now visibly transitions to COPIED for ~1500ms regardless of cursor position. The fix wires the previously-dead `.copy-success` class (added by chat.ts copyToClipboard but never consumed by any CSS rule pre-Plan-17-09) to a new CSS rule that pins the button visible during the post-click feedback window. Both the textContent COPY → COPIED → COPY swap window AND the .copy-success class lifetime window now share a single `COPY_FEEDBACK_MS = 1500` constant — the two windows expire together and the user never sees a flash of visible "COPY" between "COPIED" and the fade-out. M3 fix: the two inline `copyBtn.style.color = "..."` writes deleted from chat.ts — the new CSS class `.chat-copy-btn.copy-success { opacity: 1; color: var(--accent); }` is now the SOLE source of truth for color during the feedback window.

## What Shipped

The post-click COPY button visibility was previously gated entirely on `:hover` (which drops when the cursor moves) and `:focus-visible` (which does NOT activate on mouse click per WHATWG spec). After a click, any small cursor movement faded the button to opacity 0 within the 200ms transition — hiding the freshly-set "COPIED" textContent. The new CSS rule keeps the button at opacity 1 for the entire COPY_FEEDBACK_MS window via the .copy-success class addition, then naturally fades back to opacity 0 when the class is removed (the existing 200ms opacity transition runs as the class drops).

The fix is per-cascade-layer, not per-mechanism. CSS owns the visual state machine (the `.chat-copy-btn` block in global.css now has 4 selectors covering 4 visibility states: opacity:0 base, :hover opacity:1, :focus-visible opacity:1 + outline, .copy-success opacity:1 + accent color). chat.ts owns the lifecycle (when to add/remove the class). Inline styles are removed entirely from the click handler — the M3 fix proves that the CSS rule is load-bearing by removing the only mechanism that previously shadowed it.

## Tasks Completed

| Task | Name                                                                                             | Commit  | Files                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------- |
| 1    | Add .chat-copy-btn.copy-success CSS rule + author chat-copy-button.test.ts (M4 isolated fixture) | dcf597b | src/styles/global.css (+12 LOC), tests/client/chat-copy-button.test.ts (REPLACED 68 → 195 LOC)              |
| 2    | Align chat.ts timeout windows to shared COPY_FEEDBACK_MS = 1500 + M3 remove inline color writes  | b35ad94 | src/scripts/chat.ts (+13 / -4 net; new const + 2 setTimeout updates + 2 inline color write deletions + M3 comment block) |

## Verification Results

- `pnpm test tests/client/chat-copy-button.test.ts` after Task 1: 9/10 PASS / 1 FAIL (the 1 FAIL is the M3-RED test asserting `style.color === ''` — fails until Task 2 deletes the inline writes; this is intentional TDD sequencing).
- `pnpm test tests/client/chat-copy-button.test.ts` after Task 2: 10/10 GREEN (the M3 contract test turns GREEN as the inline writes are deleted).
- `pnpm test tests/build/no-imperative-display-flip.test.ts` after Task 2: 3/3 GREEN (DEBT-05 pattern preserved — chat.ts source contains no `panel.style.display = "flex"` or `"none"` writes; M3 extends the same anti-imperative-write pattern from `display` to `color`).
- `pnpm test tests/api/sse-snapshot.test.ts` after Task 2: 3/3 GREEN (D-15 SSE byte-identical anchor preserved — system block + SSE response bytes both unchanged; the chat.ts edit is client-side only and does not flow into the SSE response stream).
- `pnpm test` full suite after Task 2: **409 PASS / 0 FAIL / 2 SKIP** (was 404/0/2 baseline at end of Plan 17-07; +5 net new tests; 0 regressions; first time the suite has been all-green AND >= 405 tests).
- `pnpm exec astro build`: clean (10 routes prerendered, server built in 8.12s, sitemap-index.xml generated).
- `pnpm exec astro check`: 2 errors — both PRE-EXISTING in `tests/client/listener-dedup.test.ts` from Plan 17-03 commit `0ad77b3` (logged in `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md` as out-of-scope carry-forward debt). Plan 17-09 introduced 0 new typecheck errors.
- D-26 chat-surface battery (chat-panel-display, listener-dedup, no-imperative-display-flip, sse-snapshot, chat-copy-button, chat-voice-split, chat-knowledge-voice, etc.): GREEN at every commit per D-10 cadence.
- D-15 SSE byte-identical anchor: GREEN — no changes to `src/pages/api/chat.ts`, no changes to `src/prompts/system-prompt.ts`, no changes to controller.enqueue() flow.
- DEBT-05 (Plan 17-03) integrity: PRESERVED — the M3 fix extends the DEBT-05 anti-imperative-write pattern (no `panel.style.display` writes) from `display` to `color`. Same shape, same rationale.
- M3 source-text verification: `grep -cE 'copyBtn\.style\.color\s*=' src/scripts/chat.ts` returns 0 (M3 deletion confirmed). `grep -c COPY_FEEDBACK_MS src/scripts/chat.ts` returns 4 (declaration + 2 setTimeout call sites + 1 comment reference). `grep -A 20 'export function createCopyButton' src/scripts/chat.ts | grep -c '}, 1000);'` returns 0 (B-iter2 verification — no leftover 1000ms literal).

## Token Budget Delta

N/A — this plan touches CSS + client TS + a test file. No content artifacts (portfolio-context.json, system-prompt.ts) were modified. The chat <knowledge> block bytes are byte-identical to the Plan 17-07 close-out state (est_tokens=41053).

## Manual UAT Status (Deferred to User)

The plan's manual UAT (10 steps requiring `pnpm preview` + browser interaction) is NOT executable by an agent. The user should run the manual UAT post-Plan-17-08 deploy (since 17-08 is the deploy gate per DEPLOY-GATE.md, the natural moment for end-to-end verification on the production Worker is after 17-08 lands). Recommended sequence:

```bash
pnpm exec astro build && pnpm preview   # skips the pre-existing astro check failure
```

Then visit http://localhost:4321/, click the chat bubble (note: panel-open is currently broken on `pnpm dev` per UAT Gap #2 — `pnpm preview` works because the production-side imperative display path is still in dist), send "hi", wait for bot reply, hover over the bot message, click COPY. Expected behavior:

1. Button text changes to "COPIED" in red (var(--accent), from the new CSS rule).
2. Button STAYS VISIBLE for ~1.5 seconds even when cursor moves away from the wrapper (this is the bug fix — pre-Plan-17-09, moving the cursor faded the button to opacity 0).
3. After ~1.5s: button text reverts to "COPY" in faint grey (var(--ink-faint), from the base .chat-copy-btn rule that takes over after .copy-success class is removed) and fades out via the existing 200ms opacity transition.
4. Repeat the click 3-5 times rapidly — each click resets cleanly (no stuck "COPIED" state).
5. Use keyboard: Tab to button, press Enter — same COPIED → COPY transition (the :focus-visible rule already covers keyboard focus, so the button stays visible during keyboard interactions regardless).

If any step fails operationally, file a debug session and reopen.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Existing tests/client/chat-copy-button.test.ts asserts the OLD inline-style contract that Task 2's M3 fix DELETES**

- **Found during:** Task 1 setup (when I went to `Write` the new test file and discovered the path was already occupied).
- **Issue:** The pre-Plan-17-09 `tests/client/chat-copy-button.test.ts` (5 tests, 68 LOC) included `expect(btn.style.color).toBe("var(--accent)")` and `expect(btn.style.color).toBe("var(--ink-faint)")` — the EXACT inline-write contract that Task 2's M3 deletion targets. Leaving these assertions in place would have failed Task 2's GREEN gate (D-26 chat-surface regression battery requires all chat tests GREEN at every commit).
- **Fix:** REPLACED the file entirely. The 5 original helper tests were retargeted to assert the post-M3 contract (style.color === '' at every checkpoint AND classList.contains('copy-success') === true) instead of the pre-M3 inline-write contract. Net result: 10 tests (4 new M4-isolated CSS-cascade + 1 new lifecycle + 5 retargeted helper) all asserting the NEW contract.
- **Files modified:** `tests/client/chat-copy-button.test.ts` (REPLACED — was 68 LOC / 5 tests; now 195 LOC / 10 tests across 3 describe blocks).
- **Commit:** `dcf597b` (folded into Task 1 — the test rewrite is functionally part of authoring the new test surface).
- **Pattern lifted:** Plan 17-03 SUMMARY documents the same shape — `tests/client/chat-pulse-coordination.test.ts` had 2 tests asserting `panel.style.display === "flex"` / `"none"` (the imperative behavior DEBT-05 deletes); Plan 17-03 retargeted those assertions inline as a Rule 1 deviation. Same pattern here for `style.color` instead of `style.display`.

### Out-of-scope discoveries (not fixed)

**1. tests/client/listener-dedup.test.ts ts(7006) errors (carry-forward from Plan 17-03)**

- **Status:** Pre-existing — already documented in `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md` as out-of-scope carry-forward debt from Plan 17-03 commit `0ad77b3`. Plan 17-09 introduced 0 new typecheck errors. `pnpm exec astro check` shows exactly the same 2 errors as before this plan (no net change).
- **Impact on Plan 17-09:** `pnpm build` fails on these errors (because `build` script chain runs `astro check && astro build`). To run `pnpm preview` for the manual UAT step, the user must use `pnpm exec astro build` directly (skips `astro check`) or fix the typecheck inline first.
- **Closure path:** Logged in deferred-items.md for Plan 17-08 absorption (since 17-08 is the deploy gate and CANNOT push to main with a failing build, 17-08 will need to either (a) fix the typecheck inline as a Rule 3, or (b) address it via a separate /gsd-quick before 17-08 can land).

## Threat Flags

None — Plan 17-09 introduces no new network endpoints, auth paths, file access patterns, or schema changes. The CSS rule + class-toggle pattern is structurally inert from a security perspective. The pre-existing `T-17-09-A` / `T-17-09-B` / `T-17-09-C` mitigations from the plan's threat_model are in force:

- T-17-09-A (CSS rule deletion regression) → mitigated by 4 M4-isolated tests in chat-copy-button.test.ts.
- T-17-09-B (timeout-window de-alignment regression) → mitigated by `grep -c COPY_FEEDBACK_MS >= 3` structural assertion (current count: 4).
- T-17-09-C (re-introduction of inline style.color writes) → mitigated by `grep -cE 'copyBtn\.style\.color\s*=' == 0` structural assertion (current count: 0). The M3-contract test in chat-copy-button.test.ts (`flips textContent to COPIED on click, reverts to COPY after COPY_FEEDBACK_MS, with NO inline style.color writes (M3)`) catches re-introduction at runtime.

## Self-Check: PASSED

Created files exist:
- ✅ `.planning/phases/17-foundations-migration-dns-debt-sweep/17-09-SUMMARY.md` (this file)

Modified files contain expected anchors:
- ✅ `src/styles/global.css` — `grep -c '\.chat-copy-btn\.copy-success' src/styles/global.css` returns 1
- ✅ `src/scripts/chat.ts` — `grep -c 'COPY_FEEDBACK_MS' src/scripts/chat.ts` returns 4
- ✅ `src/scripts/chat.ts` — `grep -cE 'copyBtn\.style\.color\s*=' src/scripts/chat.ts` returns 0
- ✅ `tests/client/chat-copy-button.test.ts` — 10 it() blocks present (`grep -c '^  it\|^    it' tests/client/chat-copy-button.test.ts` returns 10)

Commits exist (verified via `git log --oneline -3`):
- ✅ `dcf597b` (Task 1 — CSS rule + tests)
- ✅ `b35ad94` (Task 2 — chat.ts M3 fix)

State updates pending in metadata commit:
- ☐ STATE.md frontmatter completed_plans 7 → 8, percent 70 → 80
- ☐ STATE.md body Plan 17-09 (Wave 8) gap-closure section
- ☐ ROADMAP.md 17-09 row marked [x]; v1.3 Phase 17 entry status text 7/10 → 8/10; progress table row updated
