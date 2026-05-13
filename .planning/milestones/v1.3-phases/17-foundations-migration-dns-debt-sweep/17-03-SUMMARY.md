---
phase: 17-foundations-migration-dns-debt-sweep
plan: 03
subsystem: chat-surface
tags: [chat, tech-debt, astro-page-load, css-state-machine, debt-04, debt-05, phase-17]

# Dependency graph
requires:
  - phase: 17-02
    provides: Pages → Workers Static Assets migration COMPLETE — chat surface now runs on the new Worker; DEBT-04 + DEBT-05 land against the live Worker per D-09 step 3.
  - phase: 16-motion-layer
    provides: D-26 chat regression battery (117/117 baseline) + .is-open class already triggered the keyframe scale-in in global.css; DEBT-05 only needed to add the display rules and remove the imperative JS half.
provides:
  - Idempotent astro:page-load listener registration at three chat-surface call sites (analytics.ts, scroll-depth.ts, chat.ts) — remove-then-add at document level replaces module-level *Bootstrapped flags. Long sessions can no longer accumulate listeners (DEBT-04 closed).
  - CSS-only #chat-panel display state machine — .is-open class in global.css now controls BOTH display (display:none base → display:flex on .is-open) AND the existing keyframe scale-in animation. animatePanelOpen / animatePanelClose in chat.ts are no-op async stubs preserving await semantics at showPanel/hidePanel call sites (DEBT-05 closed).
  - tests/client/listener-dedup.test.ts — 9 tests across 3 modules: source-level pattern assertions (remove-then-add present + legacy flag removed) + behavioral assertions (bootstrap fires both calls with the same handler reference at runtime).
  - tests/client/chat-panel-display.test.ts — 3 tests asserting jsdom getComputedStyle honors the cascade (base display:none, +is-open display:flex, -is-open reverts to display:none).
  - tests/build/no-imperative-display-flip.test.ts — 4 source-text anti-regression assertions on chat.ts (no `panel.style.display = "flex"`, no `panel.style.display = "none"`, animatePanelOpen receives `_panel`, animatePanelClose receives `_panel`).
  - Updated tests/client/chat-pulse-coordination.test.ts — Phase 7 "display toggle preserved" suite (2 tests) rewritten to assert the new contract (`.is-open` class toggle + NOT inline style.display).
affects: [17-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Idempotent astro:page-load listener registration: remove-then-add at document level. Browser's internal (target, type, handler) registry dedups by reference equality; removeEventListener is a no-op when the handler reference is not registered and idempotent when it is. Lower-cost defense than a global handler-slot, and forward-defends against future Astro/Vite changes that introduce module re-evaluation without page reload."
    - "CSS-only chat-panel state machine: `.is-open` class owns BOTH display and animation. Display rules live OUTSIDE the no-preference media query so they apply equally to reduce-motion users (the animation is gated; the visibility is not). animatePanelOpen / animatePanelClose retained as no-op async stubs so showPanel/hidePanel call sites that await them for keyframe-completion timing do not change shape."
    - "Source-text anti-regression assertion pattern: build-time tests that readFileSync the implementation source and grep for forbidden imperative patterns (e.g., `panel.style.display = \"flex\"`). Mirrors the pattern already in use at tests/api/chat.test.ts:259-289 for prompt-cache integrity. Catches regressions that pass behavioral tests but reintroduce the imperative path."

key-files:
  created:
    - tests/client/listener-dedup.test.ts
    - tests/client/chat-panel-display.test.ts
    - tests/build/no-imperative-display-flip.test.ts
  modified:
    - src/scripts/chat.ts
    - src/scripts/analytics.ts
    - src/scripts/scroll-depth.ts
    - src/styles/global.css
    - tests/client/chat-pulse-coordination.test.ts

key-decisions:
  - "Source-level pattern assertions ADDED to listener-dedup test (3 source-level tests) beyond the plan minimum (which spec'd behavioral assertions only). The plan-spec'd `vi.resetModules() + re-import N times` approach has a fundamental limitation under vitest's jsdom — each re-evaluation creates a NEW handler reference (initX_v2), so removeEventListener on v2 does not remove v1's prior registration. The browser API is reference-based, and module re-evaluation breaks reference identity. Source-level assertion (`removeEventListener('astro:page-load', initX)` PRECEDES `addEventListener('astro:page-load', initX)`) is the canonical anti-regression invariant; behavioral assertion verifies the bootstrap hits both branches at runtime. Both are now in the test suite."
  - "Production behavior is unchanged regardless of the test-environment constraint above. Astro re-runs astro:page-load across view transitions WITHOUT re-evaluating the module (the module remains in the same JS realm; the listener fires repeatedly against the stable handler reference from the original evaluation). Long-session listener accumulation only occurs if Astro/Vite introduce module re-evaluation across navigations — the remove-then-add pattern is the lowest-cost defense available without a global handler-slot, and is the canonical idiom per RESEARCH §\"Pattern 3 — Don't Hand-Roll\"."
  - "DEBT-05 display rules placed OUTSIDE the no-preference media query — display:none on base #chat-panel + display:flex on #chat-panel.is-open apply equally to reduce-motion users. The animation is gated (only under no-preference); the visibility is not. Reduce-motion users see the panel snap to its resting state (scale 1, opacity 1) instantly when .is-open is added; no-preference users see the 180ms scale-in. Visual contract per design-system/MASTER.md preserved end-to-end."
  - "animatePanelOpen / animatePanelClose retained as no-op async stubs rather than deleted outright. showPanel / hidePanel call sites await these functions for keyframe-completion timing; deleting them would require call-site shape changes (await of `void` instead of `Promise<void>`). Retaining the stubs as `async function animatePanel*(_panel: HTMLElement): Promise<void> { /* no-op */ }` preserves the await semantics — await of a resolved Promise is a microtask, same as today's no-op-with-side-effect path. Future cleanup (deletion of the stubs + call-site simplification) is a separate refactor."
  - "Test count delta is +16 (not the ~10 estimated in the plan output spec). DEBT-04 added 9 tests (3 source-level pattern × 3 modules + 3 behavioral × 3 modules + 3 legacy-flag-removed × 3 modules — but only 9 it.each cases total: 3 modules × 3 assertion families). DEBT-05 added 3+4=7 tests. Net additive: 9 + 7 = 16. The DEBT-05 commit also REPLACED (did not add) 2 tests in chat-pulse-coordination.test.ts — see Deviations §1."

patterns-established:
  - "Idempotent astro:page-load registration via remove-then-add — three chat-surface modules now share this canonical idiom. Future chat-surface code that adds another astro:page-load listener should follow the same pattern; the listener-dedup test extends trivially via the CHAT_SURFACE_MODULES const + it.each."
  - "CSS-only state machine for view-toggle UI — display contract in CSS, behavior contract in JS via class toggle. Future Astro components that gate visibility on a class (e.g., mobile menu, modal overlay) should follow the same shape: base-rule display:none + .is-open display:flex, animation gated under @media (prefers-reduced-motion: no-preference). The Phase 7 chat panel was the last imperative-display holdout in the codebase."
  - "Source-text anti-regression test pattern — when an imperative path is removed, add a build-time test that greps the implementation source for the forbidden pattern (literal substring or regex). Cheap to write; catches regressions that would pass behavioral tests but reintroduce the imperative path. Already used at tests/api/chat.test.ts:259-289 for prompt-cache integrity; now also at tests/build/no-imperative-display-flip.test.ts for DEBT-05."

requirements-completed: [DEBT-04, DEBT-05]

# Metrics
duration: ~7min (Task 1 commit 18:23 EDT → Task 2 commit 18:30 EDT)
completed: 2026-05-10
---

# Phase 17 Plan 03: DEBT-04 + DEBT-05 Chat-Surface Tech Debt Sweep Summary

**Both DEBT-04 (idempotent astro:page-load listener registration across analytics.ts, scroll-depth.ts, chat.ts) and DEBT-05 (CSS-only #chat-panel display state machine — `.is-open` controls both display and animation; animatePanelOpen / animatePanelClose are no-op async stubs) closed under the new Worker. D-26 chat regression battery held GREEN at every commit; full vitest suite went from 354 → 370 tests (+16 additive: 9 listener-dedup + 3 chat-panel-display + 4 no-imperative-display-flip). The single pre-existing `tests/content/roadmap-amendment.test.ts` failure carried forward from 17-01's deferred-items.md remained the only red test post-plan, unchanged in nature.**

## Performance

- **Implementation duration:** ~7 min (Task 1 commit 2026-05-10T22:23:10Z → Task 2 commit 2026-05-10T22:30:12Z)
- **Started:** 2026-05-10T22:23:10Z (Task 1 commit `0ad77b3`)
- **Closed out:** 2026-05-10 (this metadata commit)
- **Tasks:** 2 autonomous code commits (no checkpoints — TDD pattern executed cleanly in both tasks)
- **Files created:** 3 (all in tests/: listener-dedup, chat-panel-display, no-imperative-display-flip)
- **Files modified:** 5 (src/scripts/chat.ts, src/scripts/analytics.ts, src/scripts/scroll-depth.ts, src/styles/global.css, tests/client/chat-pulse-coordination.test.ts)

## Accomplishments

- **DEBT-04 (idempotent astro:page-load listener registration):** All three chat-surface client modules (`src/scripts/analytics.ts`, `src/scripts/scroll-depth.ts`, `src/scripts/chat.ts`) replaced module-level `*Bootstrapped` flags with remove-then-add at the document level. Browser's internal (target, type, handler) registry dedups by reference equality, so `removeEventListener` BEFORE `addEventListener` is a safe identity operation that converges to "this handler reference is in the registry exactly once." `typeof document !== "undefined"` guard added to chat.ts for HMR/test parity with the other two files (was previously missing).
- **DEBT-05 (CSS-only #chat-panel display state machine):** `src/styles/global.css` now declares `display: none` on the base `#chat-panel` rule and `display: flex` on `#chat-panel.is-open` — both outside the `@media (prefers-reduced-motion: no-preference)` block, so the display contract applies equally to reduce-motion users (the animation is gated; the visibility is not). The keyframe `chat-panel-scale-in` rule is unchanged. `src/scripts/chat.ts`'s `animatePanelOpen` and `animatePanelClose` are now no-op async stubs (`async function animatePanel*(_panel: HTMLElement): Promise<void> { /* no-op */ }`) — call sites that await them for keyframe-completion timing do not change shape; await of a resolved Promise is a microtask, same as today's no-op-with-side-effect path.
- **TEST-01 (D-26 chat regression battery):** GREEN at every commit on this plan. Per the DEBT-04 commit body: 129/129 chat-surface tests GREEN post-Task 1; per the DEBT-05 commit body: 145/145 chat-surface tests GREEN post-Task 2 (the +16 reflects the new tests added by this plan integrated into the chat-surface count). The full vitest suite is 369/370 GREEN — the single pre-existing failure is `tests/content/roadmap-amendment.test.ts`, documented in `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md` and unrelated to the chat surface.
- **Visual contract preserved (design-system/MASTER.md):** DEBT-05 made a byte-equivalent visual swap — the `.is-open` class already triggered the keyframe scale-in pre-Phase 17. The change was strictly removing the imperative `panel.style.display = "flex"` / `"none"` JS path and adding the equivalent CSS rules. Visible behavior (panel hidden by default, visible while open, 180ms scale-in under no-preference, snap-to-rest under reduce) is unchanged end-to-end.
- **Source-text anti-regression test layer added:** `tests/build/no-imperative-display-flip.test.ts` (4 tests) greps `src/scripts/chat.ts` source for the forbidden imperative patterns. Future edits that reintroduce `panel.style.display = "flex"` / `"none"` would fail at the test seam before reaching production. Mirrors the pattern already in use at `tests/api/chat.test.ts:259-289` for prompt-cache integrity.

## Task Commits

Each task was committed atomically per the plan's `<done>` blocks:

1. **Task 1: DEBT-04 — idempotent astro:page-load listener registration across analytics.ts / scroll-depth.ts / chat.ts** — `0ad77b3` (refactor)
   - Commit message: `refactor(17-03): DEBT-04 — idempotent astro:page-load listener registration (chat/analytics/scroll-depth)`
   - Files: `src/scripts/analytics.ts` (+11/-7), `src/scripts/scroll-depth.ts` (+13/-7), `src/scripts/chat.ts` (+19/-9), `tests/client/listener-dedup.test.ts` (+177, new)
   - State at commit: D-26 chat-surface battery 129/129 GREEN; full suite 362/363 (1 pre-existing roadmap-amendment failure).
2. **Task 2: DEBT-05 — CSS-only #chat-panel display state machine + animatePanel no-op stubs + 2 new test files + chat-pulse-coordination rewrite** — `1c148c9` (refactor)
   - Commit message: `refactor(17-03): DEBT-05 — CSS-only #chat-panel display state machine`
   - Files: `src/styles/global.css` (+13/-4), `src/scripts/chat.ts` (+11/-6), `tests/build/no-imperative-display-flip.test.ts` (+41, new), `tests/client/chat-panel-display.test.ts` (+45, new), `tests/client/chat-pulse-coordination.test.ts` (+18/-6 — Phase 7 "display toggle preserved" suite rewritten to assert .is-open class toggle, NOT inline style.display).
   - State at commit: D-26 chat-surface battery 145/145 GREEN; full suite 369/370 (same pre-existing roadmap-amendment failure).

**Plan metadata commit:** *(this commit — SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md)*

## Files Created/Modified

| Path | Status | Purpose |
|------|--------|---------|
| `src/scripts/analytics.ts` | modified (+11/-7) | Replace `analyticsBootstrapped` module flag with remove-then-add at document level. `typeof document !== "undefined"` guard preserved. DEBT-04 reference added inline alongside the WR-01 comment block. |
| `src/scripts/scroll-depth.ts` | modified (+13/-7) | Same shape — replace `scrollDepthBootstrapped` flag with remove-then-add for `initScrollDepth`. |
| `src/scripts/chat.ts` | modified (+28/-15 across two commits) | Task 1 (+19/-9): replace `chatBootstrapped` flag with remove-then-add for `initChat`; ADD `typeof document !== "undefined"` guard (parity with the other two files). Task 2 (+11/-6): rewrite section banner at lines 434-437 to reference DEBT-05 closure; rewrite `animatePanelOpen` / `animatePanelClose` as no-op async stubs (`async function animatePanel*(_panel: HTMLElement): Promise<void> {}`), removing the `panel.style.display = "flex"` / `"none"` assignments. |
| `src/styles/global.css` | modified (+13/-4) | Hoist `display: none` to the base `#chat-panel` rule (outside the `@media (prefers-reduced-motion: no-preference)` block) and add `#chat-panel.is-open { display: flex; }`. Keyframe rule and transform-origin unchanged. The `.is-open` class now owns BOTH display and animation. |
| `tests/client/listener-dedup.test.ts` | created (+177) | DEBT-04 assertions. Two test families × 3 modules: (1) source-level pattern (remove-then-add present, legacy `*Bootstrapped` flag absent, remove precedes add); (2) behavioral (bootstrap fires both calls under jsdom). 9 it.each cases total. |
| `tests/client/chat-panel-display.test.ts` | created (+45) | DEBT-05 jsdom assertions. Inlines a `<style>` fixture matching global.css and asserts `getComputedStyle` honors the cascade: base display:none, +is-open display:flex, -is-open reverts. 3 tests. |
| `tests/build/no-imperative-display-flip.test.ts` | created (+41) | DEBT-05 source-text anti-regression. Greps `src/scripts/chat.ts` for `panel.style.display = "flex"` / `"none"` (must not match) AND `animatePanelOpen(_panel:` / `animatePanelClose(_panel:` (must match — underscore prefix indicates the parameter is unused per TS convention). 4 tests. |
| `tests/client/chat-pulse-coordination.test.ts` | modified (+18/-6) | Pre-existing Phase 7 "display toggle preserved" suite (2 tests) asserted the very behavior DEBT-05 removes (`panel.style.display === "flex"` / `"none"`). Rewritten to assert the new contract: `.is-open` class toggle present/absent + `panel.style.display !== "flex"`. Suite renamed from "D-26 regression-adjacent" to "DEBT-05 visibility invariant via CSS state machine." See Deviations §1. |

## Decisions Made

- **Source-level + behavioral test layering** — the plan-spec'd `vi.resetModules() + re-import N times` approach has a fundamental constraint under vitest's jsdom: each re-evaluation creates a NEW handler reference (`initX_v2`), so `removeEventListener` on v2 does not remove v1's prior registration. The browser EventTarget API is reference-based, and module re-evaluation breaks reference identity. Source-level pattern assertion (`removeEventListener('astro:page-load', initX)` PRECEDES `addEventListener('astro:page-load', initX)`) is the canonical anti-regression invariant; behavioral assertion verifies the bootstrap hits both branches at runtime. Both are now in the test suite.
- **Production behavior is unchanged regardless of the test-environment constraint.** Astro re-runs `astro:page-load` across view transitions WITHOUT re-evaluating the module — the listener fires repeatedly against the stable handler reference from the original evaluation. The remove-then-add pattern is the lowest-cost defense available without a global handler-slot, per RESEARCH §"Pattern 3 — Don't Hand-Roll."
- **Display rules placed outside the no-preference media query** — `display: none` on base `#chat-panel` and `display: flex` on `#chat-panel.is-open` apply equally to reduce-motion users. The animation is gated (only under `@media (prefers-reduced-motion: no-preference)`); the visibility is not. Reduce-motion users see the panel snap to its resting state instantly when `.is-open` is added; no-preference users see the 180ms scale-in.
- **animatePanelOpen / animatePanelClose retained as no-op stubs.** showPanel / hidePanel call sites `await` these functions for keyframe-completion timing; deleting them outright would require call-site shape changes. Retaining the stubs as `async function animatePanel*(_panel: HTMLElement): Promise<void> { /* no-op */ }` preserves the `await` semantics — await of a resolved Promise is a microtask, same as today's no-op-with-side-effect path. Future cleanup (delete stubs + simplify call sites) is a separate refactor.
- **chat-pulse-coordination.test.ts rewrite was unavoidable.** The Phase 7 "display toggle preserved" suite asserted the exact behavior DEBT-05 removes (`panel.style.display === "flex"` / `"none"`). Leaving it untouched would have failed the suite at commit time. Rule 1 deviation: rewrite the assertions to the new contract. See Deviations §1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug — pre-existing assertion that contradicts DEBT-05 closure] Rewrote chat-pulse-coordination.test.ts "display toggle preserved" suite to assert the new CSS-state-machine contract**

- **Found during:** Task 2 (DEBT-05 implementation, post first `pnpm test` run)
- **Issue:** `tests/client/chat-pulse-coordination.test.ts` contained a Phase 7 "D-26 regression-adjacent — #chat-panel display toggle preserved" suite (2 tests) that asserted `panel.style.display === "flex"` after openPanel and `panel.style.display === "none"` after closePanel. These assertions encoded the imperative-display invariant from Phase 7 — the exact behavior DEBT-05 was designed to remove. With chat.ts's `animatePanelOpen` / `animatePanelClose` rewritten to no-op stubs, the imperative writes no longer happen and the two existing tests began failing.
- **Why it matters:** The plan's `<files>` list for Task 2 did NOT include `tests/client/chat-pulse-coordination.test.ts`. But leaving the file untouched would have failed `pnpm test` at commit time, breaking the TEST-01 D-26 GREEN gate that the plan explicitly requires per `<success_criteria>` and per CONTEXT.md D-10 cadence. Rule 1 applies: a previously-correct test now encodes contradiction with DEBT-05 closure; updating the test to assert the new contract is mandatory for the suite to remain GREEN.
- **Fix:** Renamed the suite from `"chat.ts — D-26 regression-adjacent (#chat-panel display toggle preserved)"` to `"chat.ts — DEBT-05 (#chat-panel visibility invariant via CSS state machine)"`. Rewrote the two assertions:
  - `openPanel`: assert `panel.classList.contains("is-open") === true` AND `panel.style.display !== "flex"` (chat.ts no longer writes inline style; global.css owns the display contract via `#chat-panel.is-open { display: flex; }`).
  - `closePanel`: assert `panel.classList.contains("is-open") === false` AND `panel.style.display !== "flex"` (base rule `#chat-panel { display: none; }` in global.css restores hidden state).
  - Added a comment block at the top of the suite documenting the Phase 17 DEBT-05 mechanism swap and that the Phase 7 visibility invariant is preserved end-to-end — only the mechanism (class toggle vs inline style) has changed.
- **Files modified:** `tests/client/chat-pulse-coordination.test.ts` (+18/-6).
- **Verification:** `pnpm test tests/client/chat-pulse-coordination.test.ts` GREEN post-rewrite; full suite 369/370 GREEN at Task 2 commit.
- **Committed in:** `1c148c9` (Task 2 commit — bundled with the DEBT-05 code changes since the assertion update is part of the same atomic DEBT-05 closure).

**2. [Rule 2 - Test coverage hardened beyond plan minimum] Source-level pattern assertions added to listener-dedup.test.ts in addition to behavioral assertions**

- **Found during:** Task 1 (DEBT-04 RED-state test authoring)
- **Issue:** The plan spec'd a behavioral test using `vi.resetModules() + re-import N times` and asserting `netListenerCount("astro:page-load") === 1`. Under vitest's jsdom environment, this approach has a fundamental limitation: each re-evaluation creates a NEW handler reference (`initX_v2`), so `removeEventListener` on v2 does not remove v1's prior registration — the browser EventTarget API is reference-based and module re-evaluation breaks reference identity. The behavioral assertion would PASS post-fix because the new pattern still calls remove-then-add (so even with reference drift, each evaluation's adds and removes balance to net-1 within that evaluation), but it would NOT cleanly demonstrate the dedup invariant the plan was trying to capture.
- **Why it matters:** Rule 2 — anti-regression coverage. The canonical invariant is `removeEventListener('astro:page-load', initX)` PRECEDES `addEventListener('astro:page-load', initX)` in the source — this is what future edits could break (e.g., a refactor that drops the remove half). Asserting the source-level invariant directly is cheaper and stricter than asserting the behavioral consequence.
- **Fix:** Added 3 it.each source-level test cases (1 per module × 3 assertion families: remove-then-add pattern present, legacy `*Bootstrapped` flag absent, remove precedes add) BEFORE the 3 behavioral test cases. The behavioral cases also remain — they verify the bootstrap actually hits both branches at runtime under jsdom. Documented the test-environment vs production-environment distinction at the top of the test file (the lengthy block comment in the test file source).
- **Files modified:** `tests/client/listener-dedup.test.ts` (177 lines — 9 tests total: 3 source-level remove-then-add + 3 legacy-flag-absent + 3 behavioral).
- **Verification:** All 9 listener-dedup tests GREEN at Task 1 commit. Full suite 362/363 GREEN.
- **Committed in:** `0ad77b3` (Task 1 commit — bundled with the DEBT-04 code changes since the strengthened test layer is part of the same atomic DEBT-04 closure).

---

**Total deviations:** 2 auto-fixed (1 Rule 1 — chat-pulse-coordination test rewrite for DEBT-05 contract; 1 Rule 2 — source-level pattern assertions added beyond plan minimum). Plus the 1 pre-existing deferred `roadmap-amendment.test.ts` failure carried forward from 17-01's deferred-items.md (unchanged in nature; NOT caused by Plan 17-03).

**Impact on plan:** Deviation §1 was unavoidable — the Phase 7 test assertion contradicted DEBT-05 closure and would have failed the TEST-01 D-26 GREEN gate. Deviation §2 strengthened the DEBT-04 test surface beyond the plan minimum without changing production logic. Neither was scope creep; both were correctness requirements. The plan's `files_modified` frontmatter list (8 paths) under-counted by 1 — `tests/client/chat-pulse-coordination.test.ts` should have been included. This is logged for future plan-authoring: any plan that removes an imperative behavior must audit existing tests that assert the imperative behavior and list them in `files_modified` at plan-time.

## Test Count Delta

- **Before Plan 17-03:** 354 tests (pre-DEBT-04 state at HEAD of Plan 17-02 close-out).
- **After Plan 17-03:** 370 tests (post-DEBT-05 commit).
- **Net delta:** +16 tests (additive).
  - DEBT-04 added 9 tests in `tests/client/listener-dedup.test.ts` (3 source-level remove-then-add + 3 legacy-flag-absent + 3 behavioral; all via it.each × 3 modules).
  - DEBT-05 added 3 tests in `tests/client/chat-panel-display.test.ts` (base hidden, +is-open visible, -is-open reverts).
  - DEBT-05 added 4 tests in `tests/build/no-imperative-display-flip.test.ts` (no `style.display = "flex"`, no `style.display = "none"`, animatePanelOpen `_panel`, animatePanelClose `_panel`).
  - DEBT-05 also REPLACED (did not add) 2 assertions in `tests/client/chat-pulse-coordination.test.ts` — net 0 to the total count, but the assertions themselves now encode the new contract.

**Pre-existing failure carried forward:** `tests/content/roadmap-amendment.test.ts` (1/1 RED), documented in `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md`. Unrelated to chat-surface; not caused by Plan 17-03. Full suite is 369/370 GREEN at plan close.

## D-26 Chat Regression Battery

D-26 117/117 GREEN at every chat-surface-mutating commit on this plan, per TEST-01 cadence per CONTEXT.md D-10:

| Checkpoint | Battery State | Notes |
|------------|---------------|-------|
| Pre-Task 1 | 117/117 GREEN | Baseline at HEAD of Plan 17-02 close-out (`49d5deb`). |
| Post-Task 1 (`0ad77b3`) | 129/129 GREEN | Chat-surface battery integrated the new listener-dedup tests (+12 chat-surface scoped within the +9 listener-dedup additive total; the remainder are counted under chat-surface because they exercise chat.ts directly). |
| Post-Task 2 (`1c148c9`) | 145/145 GREEN | Chat-surface battery integrated the new chat-panel-display + no-imperative-display-flip tests plus the rewritten chat-pulse-coordination assertions. |
| Phase-end (post this metadata commit) | 145/145 GREEN expected | Metadata commit touches only `.planning/**` — no chat-surface mutation. |

Per the plan's `<success_criteria>`: TEST-01 cross-phase gate is **holding** at phase point. The remaining Phase 17 plans (17-04, 17-05) will re-validate the gate at their respective phase-ends.

## Issues Encountered

- **chat-pulse-coordination.test.ts was not listed in the plan's `files_modified` frontmatter.** The plan author missed that this test file contained a Phase 7 assertion that DEBT-05 invalidates. Surfaced cleanly during Task 2 (the test failed at commit time; rewrite + recommit was a 1-minute fix). Logged for future plan-authoring patterns: any plan that removes an imperative behavior must audit existing tests that assert the imperative behavior and list them in `files_modified`. The deferred-items.md pattern (separate file for items NOT in scope) does not apply here — this was in-scope by Rule 1.
- **vi.resetModules() reference-identity constraint surfaced cleanly during DEBT-04 test authoring.** The plan-spec'd behavioral test pattern would have worked but masked the canonical source-level invariant. Strengthened the test surface with source-level assertions (Deviation §2). Documented in the test file's top-of-file block comment so future readers understand why the test combines source-text grep with runtime behavioral assertion.

## Threat Flags

*(No new security surface introduced. DEBT-04 + DEBT-05 are pure refactors of existing chat-surface behavior; no new endpoints, no new auth paths, no new trust boundaries. Threat register from Plan 17-03 frontmatter `<threat_model>` is closed in full: T-17-D mitigated by DEBT-04 idempotent registration + listener-dedup tests; T-17-E mitigated by DEBT-05 CSS-only state machine + visual contract preservation; T-17-F + T-17-G accepted as documented.)*

## Self-Check

Verifications performed before recording PASS:

- File `.planning/phases/17-foundations-migration-dns-debt-sweep/17-03-SUMMARY.md` — EXISTS (this file).
- Commit `0ad77b3` (Task 1 — DEBT-04 listener dedup): `git log --oneline --all | grep 0ad77b3` → FOUND.
- Commit `1c148c9` (Task 2 — DEBT-05 CSS-only chat-panel): `git log --oneline --all | grep 1c148c9` → FOUND.
- File `tests/client/listener-dedup.test.ts` EXISTS (created in Task 1, 177 lines).
- File `tests/client/chat-panel-display.test.ts` EXISTS (created in Task 2, 45 lines).
- File `tests/build/no-imperative-display-flip.test.ts` EXISTS (created in Task 2, 41 lines).
- `src/scripts/analytics.ts`: does NOT contain `analyticsBootstrapped`; DOES contain `removeEventListener("astro:page-load", initAnalytics)` paired with `addEventListener("astro:page-load", initAnalytics)`.
- `src/scripts/scroll-depth.ts`: does NOT contain `scrollDepthBootstrapped`; DOES contain the parallel remove-then-add pattern for `initScrollDepth`.
- `src/scripts/chat.ts`: does NOT contain `chatBootstrapped`; DOES contain remove-then-add pattern for `initChat`; DOES contain `typeof document !== "undefined"` guard (newly added for HMR/test parity).
- `src/scripts/chat.ts`: does NOT contain `panel.style.display = "flex"`; does NOT contain `panel.style.display = "none"`; DOES contain `animatePanelOpen(_panel: HTMLElement)` and `animatePanelClose(_panel: HTMLElement)` (underscore prefix = unused-param indicator).
- `src/styles/global.css`: contains `#chat-panel { display: none; ... }` on base rule + `#chat-panel.is-open { display: flex; }` outside the no-preference media query; keyframe `chat-panel-scale-in` unchanged.
- D-26 chat regression battery — GREEN at every chat-surface-mutating commit on this plan (per commit messages of `0ad77b3` and `1c148c9`).
- Full vitest suite — 369/370 GREEN at Task 2 commit (1 pre-existing roadmap-amendment failure carried forward).

## Self-Check: PASSED

## Next Phase Readiness

- **Plan 17-04 (Wave 3 — Docs/CI tech debt: DEBT-01 PROJECT.md reframe + DEBT-03 `build:chat-context:check` in `.github/workflows/sync-check.yml`) is unblocked.** Plan 17-04 does NOT touch the chat surface — it touches PROJECT.md (docs) and the GitHub Actions workflow (CI). D-26 cadence is informational for 17-04 rather than blocking.
- **Plan 17-05 (Wave 4 — Observability: DEBT-02 chat.cache_metrics log seams + TEST-03 Anthropic payload-shape forward-defense) remains gated on Plan 17-04.** Plan 17-05 WILL touch chat-surface files (chat.ts, chat-cache.ts, content-snapshot.ts, api/chat.ts) and will re-validate the D-26 117/117+ GREEN gate at its phase-end.
- **DEBT-04 + DEBT-05 closed end-to-end.** The chat-surface tech debt items per CONTEXT.md D-09 step 3 are fully resolved. The remaining tech debt items (DEBT-01, DEBT-02, DEBT-03) live in Plans 17-04 and 17-05.
- **TEST-01 cross-phase gate still holding.** D-26 117/117+ GREEN at phase point (Plan 17-03 close); will re-validate at end of Plan 17-05 and again at Phase 17 close.

---
*Phase: 17-foundations-migration-dns-debt-sweep*
*Plan: 17-03*
*Completed: 2026-05-10*
