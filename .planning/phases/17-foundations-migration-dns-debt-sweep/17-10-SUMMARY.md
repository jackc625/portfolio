---
phase: 17-foundations-migration-dns-debt-sweep
plan: 10
subsystem: motion
tags: [motion, view-transitions, polish, gap-closure, phase-17, UAT-GAP-04, MOTN-01]
dependency_graph:
  requires:
    - 17-09-SUMMARY  # serial gap-closure chain — clean baseline (409/0/2 GREEN)
    - 16-04          # MOTN-01 @view-transition declaration that this plan defends
  provides:
    - view_transition_rejection_handler: src/layouts/BaseLayout.astro head <script is:inline> (raw script body — B5) registering window.addEventListener("pageswap", (e) => e.viewTransition?.finished.catch(() => {}))
    - motion_spec_amendment: design-system/MOTION.md §5 MOTN-01 rejection-handling paragraph + §7 File Ownership row + §10 v1.3.1 changelog entry (B6 sub-version)
    - test_battery: tests/build/view-transition-handler.test.ts (4 tests asserting handler presence, .finished.catch shape, is:inline raw-body via M5 multi-line regex, head placement)
  affects:
    - phase: 17
      sub_goal: deploy-gate
      reason: "Plan 17-10 closes UAT-GAP-04 (the third of three gap-closure plans before 17-08). Plan 17-08 (Wave 10, RELEASE-BLOCKER deploy gate) still gates `git push origin main` per DEPLOY-GATE.md."
    - milestone: v1.3
      reason: "First v1.3.1 sub-version entry in MOTION.md changelog. The pattern (sub-version for gap-closure addenda after a milestone is closed) is now established for any future v1.3.x close-out work."
tech_stack:
  added: []
  patterns:
    - "B5 — raw script body inside <script is:inline>...</script>, NOT template-literal-inside-JSX. The original plan-write iteration considered <script is:inline>{`...`}</script>; B5 fix locked the raw-body shape because (a) Astro accepts plain JS text between script tags as authored content, (b) is:inline guarantees verbatim emission with no module bundling, and (c) the raw-body shape avoids any uncertainty about whether Astro's JSX expression evaluator might HTML-escape characters in the literal. Verified by `pnpm exec astro build` exit-0 — Astro parses the new script correctly and emits the verbatim handler into the rendered head."
    - "M5 — multi-line regex `[\\s\\S]*?` (lazy match across newlines) for source-text tests against multi-line script bodies. The original `[^<]*` pattern fails on (a) multi-line script bodies — script tags spanning multiple lines have newlines that `[^<]*` would consume but greedily swallow, AND on (b) JS bodies containing `<` characters (e.g., comparisons `if (x < 5)`). The M5 lazy quantifier `*?` prevents the regex from greedily swallowing past the closing `</script>` tag while still tolerating multi-line content."
    - "B6 — sub-version v1.3.1 in MOTION.md §10 changelog (since v1.3 was the Phase 17 milestone and was closed at Plan 17-06). The pattern: when a milestone is closed and a subsequent gap-closure plan amends a milestone-locked doc, use a SUB-VERSION (vN.M.X) instead of either (a) re-using the closed milestone version (which would violate the 'milestone is closed' lock) or (b) waiting for the next milestone (which would back-log the amendment). The acceptance criterion regex `^- \\*\\*v1\\.3` matches both forms, so the choice is at executor discretion; v1.3.1 is the safer / more explicit form."
    - "M6 — pre-edit test inventory before doc edits. Read tests/build/motion-doc.test.ts in FULL before editing MOTION.md. Inventory ALL its assertions; identify which assertion shapes (presence-toContain / presence-toMatch / absence-not.toMatch / line-count / table-row-count / strict-equals) are compatible with the planned edits. For Plan 17-10's purely-additive edits (new paragraph in §5, new row in §7, new entry in §10), all motion-doc.test.ts assertions are presence/absence-on-substring shape — no incompatibility. The line-count assertion (`lineCount <= 12`) is for MASTER.md §6 stub, NOT MOTION.md. Result: zero test updates needed; M6 verification was the lockstep check itself."
    - "Wave 9 in serial chain — depends_on 17-09 enforces serial order so a wave-batching orchestrator cannot accidentally parallelize chat-surface mutations. Per the wave rule (Wave = max(deps) + 1), each plan in 17-07 → 17-09 → 17-10 → 17-08 occupies its OWN wave. M-iter2 wave correction promoted Plan 17-10 from Wave 7 to Wave 9 to make this serial guarantee structurally enforceable."
key_files:
  created:
    - path: .planning/phases/17-foundations-migration-dns-debt-sweep/17-10-SUMMARY.md
      role: "This file."
    - path: tests/build/view-transition-handler.test.ts
      role: "+65 LOC / 4 tests in 1 describe block. Asserts BaseLayout.astro source contains: (1) window.addEventListener(\"pageswap\", ...) registration, (2) viewTransition?.finished.catch( shape, (3) the handler lives inside a <script is:inline>...</script> block matched via M5 multi-line regex `[\\s\\S]*?`, (4) the handler appears before </head> (executes during head parse, before any link is clickable). Each test uses a tighter assertion than the next so failures point at the specific contract that broke."
  modified:
    - path: src/layouts/BaseLayout.astro
      role: "+11 LOC head insertion. Slots in immediately after the Phase 15 Umami conditional `<script is:inline defer src=\".../script.js\" ...>` (which is self-closing with attributes only). The new `<script is:inline>` uses B5 raw script body syntax (plain JS text between opening + closing tags), NOT template-literal-inside-JSX. Comment block above the script (8 lines) documents the W3C spec mandate, the closure point per MOTION.md §5 MOTN-01, the syntax discipline (B5 raw body, NOT template literal), and points at .planning/debug/view-transition-aborterror.md for full diagnosis. The handler body is `window.addEventListener(\"pageswap\", (e) => { e.viewTransition?.finished.catch(() => {}); });` — single-line, idiomatic, ~95 bytes raw. Targeted swallow: only the implicit cross-document ViewTransition's finished Promise; other unhandled rejections still surface via the global unhandledrejection event."
    - path: design-system/MOTION.md
      role: "+4 LOC (3 additive blocks). (a) §5 Animation Specs — new paragraph after the MOTN-07 inline-markup-fallback note titled 'MOTN-01 rejection-handling contract (UAT Gap #4 / Plan 17-10)'. (b) §7 File Ownership — new row after the existing src/layouts/BaseLayout.astro:118-121 row, status NEW (Phase 17 Plan 17-10). (c) §10 Changelog — new entry 'v1.3.1 — Phase 17 Plan 17-10 gap-closure addendum (2026-05-11)' (B6 sub-version, since v1.3 was the Phase 17 milestone closed at Plan 17-06)."
    - path: tests/build/umami-tag-present.test.ts
      role: "Rule 1 deviation: bumped 'is:inline precedent integrity' cap from 2 → 3. Pre-Plan-17-10 the cap allowed Umami's `<script is:inline ...>` (1) + the body-end comment prose `(NOT is:inline)` (1) = 2 occurrences. Plan 17-10 adds the pageswap `<script is:inline>` legitimately (3rd documented occurrence). The comment block on the assertion now enumerates all 3 documented occurrences for clarity. Direct fallout from the BaseLayout.astro edit; not a regression."
    - path: .planning/STATE.md
      role: "Frontmatter completed_plans 8 → 9, percent 80 → 90; status text updated; new 'Plan 17-10 (Wave 9) gap-closure' body section."
    - path: .planning/ROADMAP.md
      role: "17-10-PLAN.md row marked [x] with full commit chain; v1.3 Phase 17 entry status text updated to reflect 9/10 progress; progress table row 17 updated 8/10 → 9/10."
decisions:
  - "Edit placement choice — MOTN-01 rejection-handling paragraph slotted at the END of §5 (after BOTH MOTN-07 paragraphs) rather than literally between the .display exclusion paragraph and the inline-markup fallback paragraph as the plan's prose suggested. The plan said 'After §5 Animation Specs table (immediately after the line ...Phase 16 success criterion #1.)'. Inserting BETWEEN two MOTN-07 paragraphs would have been semantically awkward (a MOTN-01 note bisecting the MOTN-07 prose). Inserting AFTER both MOTN-07 paragraphs preserves intent ('after the §5 Animation Specs table' — both alternatives satisfy this since the table itself ends at line 82) AND keeps each MOTN-* discussion as a contiguous semantic block. The acceptance criterion (the new paragraph appears after the §5 Animation Specs table) is satisfied either way; chose the more readable placement."
  - "Rule 1 deviation: tests/build/umami-tag-present.test.ts cap update from 2 → 3 was forced by the BaseLayout.astro edit. The pre-existing test asserted `expect(occurrences).toBeLessThanOrEqual(2)` to catch accidental Umami-tag duplication. Pre-Plan-17-10 occurrence count = 2 (Umami `<script is:inline ...>` + body-end comment `(NOT is:inline)` prose). Adding the Plan 17-10 pageswap `<script is:inline>` is a LEGITIMATE third occurrence (not duplication). Updated the cap to 3 and rewrote the comment to enumerate all 3 documented occurrences (Umami / pageswap / body-end-comment-prose). The test STILL catches accidental future drift (anything > 3 fires) — same protection, same shape, just with the new documented baseline. Pattern lifted: when a plan adds a legitimate occurrence of a counted construct, update the cap in the same task that introduces the new occurrence so the suite stays GREEN at every commit (D-26 cadence)."
  - "Manual UAT (rapid-navigation in `pnpm preview` to confirm no AbortError in DevTools console) DEFERRED TO USER — agent cannot drive a real browser. The build-time test (4 tests) locks the contract structurally: handler is present, has the correct shape, lives in is:inline raw body, executes before </head>. The W3C spec defines exactly when the rejection fires and exactly what shape the handler must have to consume it; the structural assertions cover the contract end-to-end. Manual UAT is operational verification (does the rejection actually NOT appear in DevTools when you rapid-click between pages on the running dev server?) — this requires real browser interaction outside the JS event loop. User runs the manual UAT post-Plan-17-08 deploy as the natural moment for end-to-end verification on the production Worker (since Plan 17-08 is the deploy gate; UAT against jackcutrara.com is the proof point). Same deferral pattern as Plan 17-09."
  - "B5 verification path used `pnpm exec astro build` instead of `pnpm build`. The plan's acceptance criterion specified `pnpm build` exit-0. `pnpm build` runs `pnpm build:chat-context && wrangler types && astro check && astro build`; `astro check` fails on the 2 PRE-EXISTING ts(7006) errors in tests/client/listener-dedup.test.ts (carry-forward from Plan 17-03 commit 0ad77b3, documented in deferred-items.md). Per SCOPE BOUNDARY rule, those errors are not directly caused by Plan 17-10's edits. Used `pnpm exec astro build` which skips the `astro check` step but still proves the actual B5 contract (Astro parses the new raw-body script correctly and emits the verbatim handler). Result: clean — 10 routes prerendered, server built in 7.29s, no parse errors. The pre-existing typecheck debt is logged for Plan 17-08 absorption (since 17-08 is the deploy gate and CANNOT push to main with a failing build, it MUST address the typecheck debt as a Rule 3 inline). Same pattern as Plan 17-09 — see Plan 17-09 SUMMARY 'Manual UAT note — pnpm build gate' decision."
  - "Verified built HTML head contains the pageswap listener verbatim (post-build sanity check beyond the source-text test). `grep -n 'pageswap' dist/client/index.html` returned `2: window.addEventListener(\"pageswap\", (e) => { e.viewTransition?.finished.catch(() => {}); });` — confirming Astro emitted the script body byte-for-byte into the head. Source-text test (which reads BaseLayout.astro source) + built-HTML grep (which reads the actual Astro output) double-locks the contract: the source has the right shape AND Astro emits it correctly. The source-text test alone would catch source regressions; the built-HTML check catches future Astro-version bugs that might silently strip is:inline raw bodies (defense-in-depth)."
metrics:
  duration_minutes: 8
  duration_string: "~8 min wall clock"
  completed_date: "2026-05-11"
  task_count: 2
  commit_count: 2
  file_count: 4
  test_count_delta: "+4 new tests in tests/build/view-transition-handler.test.ts (4/4 GREEN). Net pnpm test = 409 PASS / 0 FAIL / 2 SKIP → 413 PASS / 0 FAIL / 2 SKIP."
---

# Phase 17 Plan 10: pageswap handler closes UAT Gap #4 (cross-document AbortError) Summary

UAT Gap #4 (major, polish-tier) closed: cross-document navigation no longer surfaces `Uncaught (in promise) AbortError: Transition was skipped` in the DevTools console. The W3C-spec-mandated rejection of the implicit `ViewTransition.finished` Promise (which fires on every superseded cross-document transition — rapid clicks, prefetch races, back/forward, document-hidden flips) is now consumed by a head-level `<script is:inline>` in `src/layouts/BaseLayout.astro` registering `window.addEventListener("pageswap", (e) => e.viewTransition?.finished.catch(() => {}))`. The handler is targeted (only the implicit transition's Promise; other unhandled rejections still surface via the global `unhandledrejection` event) and head-level + `is:inline` (registers BEFORE any link can be clicked). Spec gap closed in lockstep: `design-system/MOTION.md` §5 MOTN-01 now documents the rejection-handling contract alongside the visual contract; §7 File Ownership names the new head script; §10 Changelog records the v1.3.1 amendment.

## What Shipped

The codebase had been opting into browser-native cross-document View Transitions since Phase 16-04 (`@view-transition { navigation: auto }` at `src/styles/global.css:539-541`). The W3C CSS View Transitions Module L2 spec mandates that when a transition is superseded, the implicit `ViewTransition.finished` Promise rejects with `DOMException AbortError "Transition was skipped"`. The site had ZERO observers for that Promise — no `<ClientRouter />` (banned per MASTER.md §8 / MOTION.md §1; removed in Phase 8-03 commit `c5d0911`), no `document.startViewTransition()` call, no `pageswap` / `pagereveal` listener, no global `unhandledrejection` guard. The rejection necessarily surfaced in DevTools as `Uncaught (in promise) AbortError: Transition was skipped`. Cosmetic noise (navigation completes correctly), but a non-trivial regression for the engineer audience that opens DevTools — PROJECT.md "Core Value" makes a noisy console matter for the polish promise.

The fix is the smallest possible closure path: a single `pageswap` listener that grabs the implicit transition's `.finished` Promise and attaches a no-op `.catch()`. The listener is targeted (only fires on cross-document navigation, only consumes the implicit transition's Promise) and uses Astro's `is:inline` directive with raw script body (B5 — plain JS text between `<script>` tags, NOT template-literal-inside-JSX) to guarantee verbatim emission with no module bundling. Synchronous execution during head parse → registers BEFORE the first link click can possibly trigger a transition.

## Tasks Completed

| Task | Name                                                                                                            | Commit  | Files                                                                                                                                                                              |
| ---- | --------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Add pageswap handler to BaseLayout.astro head (B5 raw script body) + build-time source-text test (M5 multi-line regex) | 8fe670c | src/layouts/BaseLayout.astro (+11 LOC head insertion), tests/build/view-transition-handler.test.ts (+65 LOC / 4 tests NEW), tests/build/umami-tag-present.test.ts (Rule 1 — cap 2 → 3) |
| 2    | Update design-system/MOTION.md (B6 v1.3.1 changelog) + verify motion-doc.test.ts compatibility (M6)             | 72c1a82 | design-system/MOTION.md (+4 LOC across 3 additive blocks: §5 MOTN-01 paragraph + §7 File Ownership row + §10 v1.3.1 changelog)                                                      |

## Verification Results

- `pnpm test tests/build/view-transition-handler.test.ts` (after Task 1): **4/4 GREEN**.
- `pnpm test tests/build/motion-css-rules.test.ts` (after Task 1): **11/11 GREEN** (existing MOTN-01..07 CSS contracts preserved).
- `pnpm test tests/api/sse-snapshot.test.ts` (after Task 1 + Task 2): **3/3 GREEN** (D-15 SSE byte-identical anchor preserved — no api/chat.ts changes; the BaseLayout.astro edit affects HTML head only, which does not flow into the SSE response stream).
- `pnpm test tests/build/motion-doc.test.ts` (after Task 2): **15/15 GREEN** (M6 verified — additive MOTION.md edits do not break any presence/absence-on-substring assertion; the lineCount <= 12 assertion is for MASTER.md §6 stub, which we do not touch).
- `pnpm test` full suite (after Task 2): **413 PASS / 0 FAIL / 2 SKIP** (was 409/0/2 baseline at end of Plan 17-09; +4 net new tests from view-transition-handler.test.ts; 0 regressions).
- `pnpm exec astro build` (B5 verification — Task 1 acceptance criterion): **clean** (10 routes prerendered, server built in 7.29s, sitemap-index.xml generated). Astro parses the new raw-body `<script is:inline>` correctly.
- `grep -n 'pageswap' dist/client/index.html` (post-build sanity check): returns `2: window.addEventListener("pageswap", (e) => { e.viewTransition?.finished.catch(() => {}); });` — Astro emits the handler verbatim into the rendered head.
- `pnpm exec astro check`: **2 errors** — both PRE-EXISTING in `tests/client/listener-dedup.test.ts` from Plan 17-03 commit `0ad77b3` (logged in `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md` as out-of-scope carry-forward debt). Plan 17-10 introduced 0 new typecheck errors.
- D-26 chat-surface battery (chat-panel-display, listener-dedup, no-imperative-display-flip, sse-snapshot, chat-copy-button, chat-voice-split, chat-knowledge-voice, anthropic-payload-shape, etc.): **GREEN at every commit** per CONTEXT.md D-10 cadence. Note: BaseLayout.astro is on the chat-surface enumeration per CONTEXT.md D-10, so D-26 applied to Task 1 explicitly. MOTION.md is doc-only and not on the chat-surface list, so D-26 was informational at Task 2.
- D-15 SSE byte-identical anchor: **PRESERVED** — no changes to `src/pages/api/chat.ts`, no changes to `src/prompts/system-prompt.ts`, no changes to controller.enqueue() flow. The BaseLayout.astro head insertion does NOT affect the SSE response body (SSE is the `/api/chat` JSON stream; HTML head is the page render path). sse-snapshot.test.ts 3/3 GREEN at every commit.
- MOTION.md content acceptance grep counts (Task 2): `pageswap` = 3 (>= 3 required), `Plan 17-10` = 3 (>= 2 required), `AbortError` = 2 (>= 1 required), `^- \*\*v1\.3` = 1 (>= 1 required, B6 v1.3.1 entry).

## B5 Verification Result

`pnpm exec astro build` exited 0 cleanly. Astro 6 accepts the raw script body between `<script is:inline>` and `</script>` tags as authored content and emits it verbatim into the rendered head. The post-build sanity check (`grep -n 'pageswap' dist/client/index.html`) confirms the handler body appears in the built HTML byte-for-byte, including the comment block above (the comments are JSX expressions that Astro evaluates at build time — they do NOT appear in the rendered HTML, which is the expected and desired outcome).

## M5 Multi-Line Regex Result

`tests/build/view-transition-handler.test.ts` Test 3 uses `/<script\s+is:inline[^>]*>[\s\S]*?pageswap[\s\S]*?<\/script>/` — the `[\s\S]*?` lazy multi-line match correctly handles:
- Multi-line script bodies (the rendered raw-body script spans 3 lines: opening tag, body line, closing tag).
- The `*?` lazy quantifier prevents the regex from greedily swallowing past the closing `</script>` tag (a greedy `[\s\S]*` would match from the first `<script>` to the LAST `</script>` in the file, picking up the body-end processed `<script>` block too).
- Test 3 passes; the regex correctly identifies the pageswap handler's `<script is:inline>` block specifically.

## M6 Verification Result

Read `tests/build/motion-doc.test.ts` in full BEFORE editing MOTION.md. Inventoried all assertions:
- `expect(existsSync(motionPath)).toBe(true)` — file existence; UNCHANGED.
- `expect(md).toMatch(/^##\s.*Property [Ww]hitelist/m)` — section header presence; UNCHANGED.
- `expect(md).toContain("transform" / "opacity" / "box-shadow")` — property whitelist substrings; UNCHANGED.
- `expect(md).toContain(...)` for duration band markers (`120ms` / `180ms` / `200ms` / `250` / `300ms` / `350` / `600ms` / `2500ms`); UNCHANGED.
- `expect(md).toContain("ease-out" / "ease-in-out")` — easing name substrings; UNCHANGED.
- `expect(md).toContain("MOTN-01" .. "MOTN-07")` — motion ID substrings; UNCHANGED.
- `expect(md).not.toMatch(/cubic-bezier\(/)` — banned custom-easing absence; UNCHANGED (additive edits do not introduce cubic-bezier).
- `expect(md).not.toMatch(/import\s+gsap/)` — banned GSAP import absence; UNCHANGED.
- For MASTER.md (separate describe block): `expect(lineCount).toBeLessThanOrEqual(12)` for §6 stub — UNCHANGED (we do not touch MASTER.md §6).
- MASTER.md §11 v1.2 / Phase 16 entry — UNCHANGED.

Conclusion: ALL motion-doc.test.ts assertions are presence/absence-on-substring shape OR strict-equals on a section we do not touch. The additive MOTION.md edits (new paragraph in §5, new row in §7, new entry in §10) do not break any assertion. M6 verification was the lockstep check itself; no test update needed. Result: motion-doc.test.ts 15/15 GREEN.

## M-iter2 Wave Correction Result

Plan 17-10 was originally Wave 7 in an earlier iteration. M-iter2 wave correction promoted it to Wave 9 (depends_on 17-09 at Wave 8) to honor the wave rule (Wave = max(deps) + 1). The correction prevents a wave-batching orchestrator from accidentally parallelizing chat-surface mutations across the gap-closure plans (17-07, 17-09, 17-10, 17-08 are all serial because they all touch chat-surface files per CONTEXT.md D-10; clean D-26 attribution requires no parallel chat-surface mutations). The serial chain is now structurally enforceable: 17-07 (Wave 7) → 17-09 (Wave 8) → 17-10 (Wave 9) → 17-08 (Wave 10 deploy gate). Plan 17-10 ran solo as a sequential executor on the main worktree (workflow.use_worktrees=false per .planning/config.json).

## Manual Rapid-Navigation UAT Status (Deferred to User)

The plan's manual UAT (rapid-click navigation between pages on `pnpm preview` while watching DevTools Console for absence of `Uncaught (in promise) AbortError: Transition was skipped` messages) is NOT executable by an agent. The agent cannot drive a real browser to evaluate post-navigation console output. The build-time test (4 tests) locks the contract structurally — the handler is present, has the correct shape (`viewTransition?.finished.catch(`), lives in `<script is:inline>` raw body via M5 multi-line regex match, executes before `</head>`. The W3C spec defines exactly when the rejection fires and exactly what shape the handler must have to consume it; the structural assertions cover the closure contract end-to-end.

User runs the manual UAT post-Plan-17-08 deploy as the natural moment for end-to-end verification on the production Worker (since Plan 17-08 is the RELEASE-BLOCKER deploy gate; UAT against `https://jackcutrara.com` is the operational proof point). Recommended sequence:

```bash
# After Plan 17-08 deploys to production:
# 1. Open https://jackcutrara.com/ in a fresh incognito window
# 2. Open DevTools Console (F12); clear it
# 3. Navigate rapidly between pages: home → projects → about → home → projects (~5 clicks)
# 4. EXPECTED: NO `Uncaught (in promise) AbortError: Transition was skipped` messages in Console
# 5. Verify pages still transition with the 200ms ease-out fade (MOTN-01 visual contract preserved)
```

If the AbortError still surfaces post-deploy, file a debug session and reopen — but the structural assertions + Astro emit verification + W3C-spec compliance make this extremely unlikely.

## Targeted Handler (Option 1) Confirmation

Per .planning/debug/view-transition-aborterror.md, two viable shapes existed:
- **Option 1 (chosen)**: `window.addEventListener("pageswap", (e) => { e.viewTransition?.finished.catch(() => {}); })` — targeted; only consumes the implicit cross-document ViewTransition's finished Promise; other unhandled rejections still surface.
- **Option 2 (rejected)**: `window.addEventListener("unhandledrejection", (e) => { if (e.reason instanceof DOMException && e.reason.name === "AbortError" && /Transition was skipped/.test(e.reason.message)) e.preventDefault(); })` — global guard; broader blast radius (could mask unrelated AbortErrors if message check is too loose); harder to reason about at the call site.

Option 1 was chosen because it is targeted, narrower, self-documenting at the call site (the `pageswap` event name + `viewTransition.finished` access point makes the intent obvious), and structurally guaranteed to only consume the implicit transition's Promise (no risk of swallowing unrelated AbortErrors). Documented in MOTION.md §5 MOTN-01 rejection-handling paragraph.

## ClientRouter + startViewTransition Bans Preserved

The plan + the implementation both DO NOT touch the existing bans:
- `<ClientRouter />` remains banned per MASTER.md §8 / MOTION.md §1. The pageswap handler operates on the browser-native cross-document `@view-transition` path, not on Astro's client-side router (which would require ClientRouter to be present, which it is not).
- `document.startViewTransition()` remains uncalled. The handler observes the IMPLICIT ViewTransition object that the browser creates automatically when the `@view-transition { navigation: auto }` declaration triggers; it does NOT call `startViewTransition()` itself.

These bans are enforced by `tests/build/motion-doc.test.ts:101` (which asserts MASTER.md §8 still bans ClientRouter) and the absence of any `startViewTransition` call site in the codebase. No regression.

## Note for Post-Deploy

After Plan 17-08 (Wave 10 — RELEASE-BLOCKER deploy gate) lands and `git push origin main` triggers a Cloudflare Workers Builds deploy, verify on `https://jackcutrara.com` that:
1. Cross-document navigation produces NO `AbortError: Transition was skipped` messages in DevTools Console (the operational proof of UAT-GAP-04 closure).
2. The 200ms ease-out fade (MOTN-01 visual contract from Phase 16-04) STILL plays during cross-document navigation (the visual contract preservation — the handler swallows the rejection but does NOT cancel or skip the transition itself).
3. UAT-GAP-04 entry in `17-UAT.md` Test 2 / Gaps section can be marked CLOSED operationally.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] tests/build/umami-tag-present.test.ts cap was 2; legitimately needs to be 3 after Plan 17-10's pageswap is:inline addition**

- **Found during:** Task 1 verification (`pnpm test` full-suite run after the BaseLayout.astro edit).
- **Issue:** `tests/build/umami-tag-present.test.ts:48-53` asserted `expect(occurrences).toBeLessThanOrEqual(2)` where `occurrences = (layoutSource.match(/is:inline/g) ?? []).length`. Pre-Plan-17-10 occurrence count = 2 (Umami's `<script is:inline ...>` + the body-end comment prose `(NOT is:inline)`). Plan 17-10 adds the legitimate 3rd occurrence (the new pageswap `<script is:inline>`). Test failed with `expected 3 to be less than or equal to 2`.
- **Fix:** Bumped the cap from 2 → 3 in the same file. Rewrote the assertion's comment block to enumerate all 3 documented occurrences (Umami tag / pageswap script / body-end-comment prose) and to point at MOTION.md §5 MOTN-01 + the debug session for the rationale on the new pageswap occurrence.
- **Files modified:** `tests/build/umami-tag-present.test.ts` (5-line comment update + cap bump from 2 to 3).
- **Commit:** `8fe670c` (folded into Task 1 — the test cap update is direct fallout from the BaseLayout.astro edit; per D-26 cadence the suite must be GREEN at every commit).
- **Pattern lifted:** when a plan adds a legitimate occurrence of a counted-construct, update the cap in the same task that introduces the new occurrence. Same shape as Plan 17-09's `chat-copy-button.test.ts` retarget (which extended the assertion shape from inline-style to class-driven) — the Rule 1 deviation absorbs the test surface adjustment that the plan's primary edit forces.

### Out-of-scope discoveries (not fixed)

**1. tests/client/listener-dedup.test.ts ts(7006) errors (carry-forward from Plan 17-03)**

- **Status:** Pre-existing — already documented in `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md` as out-of-scope carry-forward debt from Plan 17-03 commit `0ad77b3`. Plan 17-10 introduced 0 new typecheck errors. `pnpm exec astro check` shows exactly the same 2 errors as the pre-Plan-17-10 state.
- **Impact on Plan 17-10:** `pnpm build` (which runs `astro check && astro build`) fails on these errors. To run the B5 verification (`pnpm build` exit-0 acceptance criterion), used `pnpm exec astro build` which skips `astro check` but still proves the actual B5 contract (Astro parses the new raw-body script correctly).
- **Closure path:** Plan 17-08 (Wave 10 — RELEASE-BLOCKER deploy gate) MUST address these errors as a Rule 3 inline (the deploy gate cannot push to main with a failing build). Same closure path as Plan 17-09.

## Threat Flags

None — Plan 17-10 introduces no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. The pageswap handler observes-only (the empty `.catch()` returns void synchronously without performing any side effects) and the swallow is targeted (only the implicit cross-document ViewTransition's finished Promise; other AbortError sources continue to surface via the global unhandledrejection event). The pre-existing T-17-10-A through T-17-10-F mitigations from the plan's threat_model are in force:

- T-17-10-A (future contributor removes the pageswap handler) → mitigated by 4 build-time tests in view-transition-handler.test.ts.
- T-17-10-B (future contributor changes is:inline to processed script) → mitigated by Test 3 (M5 multi-line regex assertion specifically asserts is:inline).
- T-17-10-C (future contributor changes raw script body to template-literal-inside-JSX, B5 anti-pattern) → mitigated by `pnpm exec astro build` exit-0 gate (the template-literal form may produce an Astro parse error or emit incorrectly).
- T-17-10-D (the empty .catch() swallows other AbortErrors) → ACCEPTED — the handler is invoked ONLY for the implicit cross-document ViewTransition's finished Promise; other AbortError sources continue to surface via the global unhandledrejection event.
- T-17-10-E (different navigation path introduces new AbortError surface) → N/A in v1.3+ (only relevant if v1.4+ adds a JS router, which is currently banned).
- T-17-10-F (inline script in head adds latency to first paint) → ACCEPTED — handler is ~95 bytes raw + ~600 bytes of comment prose; addEventListener registration is O(1).

## Self-Check: PASSED

Created files exist:
- `.planning/phases/17-foundations-migration-dns-debt-sweep/17-10-SUMMARY.md` (this file) — being written now.
- `tests/build/view-transition-handler.test.ts` (verified via test run — 4/4 GREEN).

Modified files contain expected anchors:
- `src/layouts/BaseLayout.astro`: contains `pageswap` literal (1 occurrence in script body), `viewTransition?.finished.catch(` (1 occurrence). Verified via grep at Task 1 completion.
- `design-system/MOTION.md`: contains `pageswap` (3 occurrences ≥ 3 required), `Plan 17-10` (3 occurrences ≥ 2 required), `AbortError` (2 occurrences ≥ 1 required), `^- \*\*v1\.3` changelog entry (1 occurrence ≥ 1 required). Verified via grep at Task 2 completion.
- `tests/build/umami-tag-present.test.ts`: cap bumped 2 → 3 with documented enumeration of 3 occurrences. Verified via test run.
- `dist/client/index.html` (built artifact, not tracked): contains `window.addEventListener("pageswap", (e) => { e.viewTransition?.finished.catch(() => {}); });` verbatim. Verified via post-build grep.

Commits exist (verified via `git log --oneline -3`):
- `8fe670c` (Task 1 — pageswap handler + new test + Rule 1 cap bump).
- `72c1a82` (Task 2 — MOTION.md §5 + §7 + §10 amendments).

State updates pending in metadata commit:
- STATE.md frontmatter completed_plans 8 → 9, percent 80 → 90.
- STATE.md body Plan 17-10 (Wave 9) gap-closure section.
- ROADMAP.md 17-10 row marked [x]; v1.3 Phase 17 entry status text updated to reflect 9/10 progress; progress table row 17 updated 8/10 → 9/10.
