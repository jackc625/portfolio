---
phase: quick-260513-hqk-v1-3-closeout
plan: 01
status: complete
subsystem: testing
tags: [chat-widget, copy-button, voice-split, view-transitions, regex-hardening, structural-locks]

# Dependency graph
requires:
  - phase: 17-foundations-migration-dns-debt-sweep
    provides: 5 Warnings in 17-REVIEW-GAPS.md (WR-01 UX regression on clipboard-failure path, WR-02 first-person leak regex token allow-list, WR-03 readStringField escaped-quote silent truncation, WR-04 latent TypeError on pageswap, WR-05 brittle no-inline-display test anchor)
provides:
  - Clipboard-failure path now renders accent-red COPIED label for full 1500ms feedback window
  - FIRST_PERSON_LEAK_RE catches curly apostrophes, British spelling, 10 additional verbs, 5 additional possessives across all 3 lockstep sites
  - readStringField throws explicit error on `\"` rather than silently truncating chatSummary
  - pageswap handler defensive against early-Chromium ViewTransition shims missing .finished
  - no-inline-display-on-chat-panel test tolerant of attribute reordering + catches duplicate panel elements
affects: [chat-widget-future-work, content-authoring-workflow, structural-lock-test-pattern]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single class-driver site for transient UI feedback (click handler at t=0, single setTimeout combining dual reverts)"
    - "Triplicated regex literal across build script + test files, byte-identical enforcement noted in comments"
    - "Mirror-the-comma-in-array-guard pattern for explicit-throw rather than silent regex bypass"
    - "matchAll-based structural lock tests tolerant of attribute order + duplicate-detection assertion"

key-files:
  created: []
  modified:
    - src/scripts/chat.ts
    - scripts/build-chat-context.mjs
    - tests/build/chat-knowledge-voice.test.ts
    - tests/api/chat-voice-split.test.ts
    - tests/client/chat-copy-button.test.ts
    - src/layouts/BaseLayout.astro
    - tests/build/view-transition-handler.test.ts
    - tests/build/no-inline-display-on-chat-panel.test.ts

key-decisions:
  - "WR-02 fix option (b) — extend token allow-list rather than switch to structural pattern; triplication of regex literal across 3 sites accepted (shared-module extraction deferred per REVIEW-GAPS.md)"
  - "WR-03 mirrors the comma-in-array guard at readArrayField (explicit throw rather than upgrading regex to handle \\\" escapes); 0 current chatSummary values use embedded quotes"
  - "WR-01 click-handler-drives-class pattern: classList.add(\"copy-success\") at t=0 BEFORE clipboard write; copyToClipboard becomes pure I/O with no DOM side effects"
  - "WR-04 test regex relaxed to `\\?\\.finished\\??\\.catch\\(` (accepts both pre- and post-fix forms) rather than tightened to exclusive double optional-chain — more forgiving for future contributors"
  - "Retain `button: HTMLElement` parameter in copyToClipboard signature for API stability despite ts(6133) hint — keeps the door open for future retry/feedback wiring without breaking callers"

patterns-established:
  - "Synchronous UI feedback at t=0 in click handler, async I/O fired-and-forgotten: ensures visible confirmation renders regardless of I/O outcome"
  - "Byte-identical regex literal across N call sites with explicit comment warning to maintainers"
  - "Hard-fail-with-diagnostic vs silent-truncation: latent-defect hardening at parse boundaries"
  - "matchAll + exactly-one-match assertion for structural locks on singleton elements"

requirements-completed: [WR-01, WR-02, WR-03, WR-04, WR-05]

# Metrics
duration: ~10min
completed: 2026-05-13
---

# Quick Task 260513-hqk: v1.3 Closeout — Close Phase 17 Review Warnings Summary

**Closed all 5 Warnings from 17-REVIEW-GAPS.md (WR-01 clipboard-failure accent restoration, WR-02 broadened first-person leak regex, WR-03 explicit-throw on escaped quotes, WR-04 double optional-chain on pageswap, WR-05 matchAll structural lock with duplicate detection) — 0 open Warnings remain.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-13T12:53:00Z (approximate)
- **Completed:** 2026-05-13T13:03:00Z
- **Tasks:** 6 (5 fix + 1 verification)
- **Files modified:** 8
- **Tests added:** 1 (`WR-01: .copy-success class added even when clipboard.writeText rejects`)
- **KNOWN_LEAKS expanded:** 16 → 35 positive cases

## Accomplishments

- **WR-01** Real UX regression closed: the clipboard-failure path (non-HTTPS preview, denied permission, focus loss) now renders the accent-red COPIED label for the full COPY_FEEDBACK_MS window. Previously the button text changed to "COPIED" but the color stayed at default `--ink-faint` with no chromatic confirmation.
- **WR-02** First-person voice tripwire hardened: curly apostrophes (U+2019), British "favourite", 10 additional verbs (made, created, developed, implemented, designed, think, learned, noticed, tried, tested), and 5 additional possessives (implementation, solution, design, team, experience) now blocked at build time across all 3 lockstep sites.
- **WR-03** Silent truncation in chatSummary readString upgraded to explicit Error throw — parallel to the existing comma-in-array guard in readArrayField.
- **WR-04** One-byte defensive optional-chain added to BaseLayout pageswap handler — prevents TypeError propagation if any browser ships a partial ViewTransition shim missing `.finished`.
- **WR-05** no-inline-display-on-chat-panel test now uses `matchAll` (tolerates `id` and `style` attribute reordering) and asserts exactly one `#chat-panel` div (catches accidental duplicates that would let inline display slip past per-match assertions).

## Task Commits

Each WR fix was committed atomically:

1. **Task 1: WR-01 sync .copy-success class in click handler** — `de781dd` (fix)
2. **Task 2: WR-02 extend FIRST_PERSON_LEAK_RE allow-list** — `029ffc5` (fix)
3. **Task 3: WR-03 reject escaped quotes in chatSummary** — `2101d92` (fix)
4. **Task 4: WR-04 optional-chain .finished in pageswap handler** — `de96a00` (fix)
5. **Task 5: WR-05 use matchAll in no-inline-display test** — `61a359b` (fix)

Task 6 (verification + this SUMMARY) is committed by the orchestrator.

## Files Created/Modified

- `src/scripts/chat.ts` — Moved `classList.add("copy-success")` from `copyToClipboard` success branch into `createCopyButton` click handler (synchronous at t=0); consolidated dual setTimeouts into single setTimeout combining textContent + class reverts; copyToClipboard now pure clipboard I/O.
- `tests/client/chat-copy-button.test.ts` — Updated existing "flips textContent..." test to assert class present BEFORE microtask drain; added new "WR-01: class added even when clipboard.writeText rejects" test using `vi.fn().mockRejectedValue(new Error("denied"))`.
- `scripts/build-chat-context.mjs` — Extended FIRST_PERSON_LEAK_RE with curly apostrophe, British spelling, 10 verbs, 5 possessives (WR-02); added explicit `throw new Error(...)` in readStringField when captured group includes `\"` (WR-03).
- `tests/build/chat-knowledge-voice.test.ts` — Byte-identical regex update (WR-02); expanded KNOWN_LEAKS from 16 → 35 cases covering every new token plus 3 curly-apostrophe forms.
- `tests/api/chat-voice-split.test.ts` — Byte-identical regex update (WR-02).
- `src/layouts/BaseLayout.astro` — Added second `?.` on `viewTransition?.finished?.catch(() => {})` (WR-04).
- `tests/build/view-transition-handler.test.ts` — Relaxed regex from `/viewTransition\?\.finished\.catch\(/` to `/viewTransition\?\.finished\??\.catch\(/` (accepts both forms).
- `tests/build/no-inline-display-on-chat-panel.test.ts` — Replaced single-anchor `src.match(...)` with `[...src.matchAll(/<div\s[^>]*\bid="chat-panel"[^>]*>/g)]` loop + exactly-one-match structural assertion (WR-05).

## Verification

### Full Test Battery

| Command | Result |
|---|---|
| `pnpm test` | **587 PASS / 2 skipped / 0 fail** (63 test files; 1 file with all skipped) |
| `pnpm exec astro check` | **0 errors, 0 warnings, 1 hint** (116 files; hint is pre-existing-by-design ts(6133) on `copyToClipboard(text, button)` — `button` retained for API stability) |
| `pnpm build:chat-context` | **`src/data/portfolio-context.json: unchanged`** (broadened guard caught nothing new — current authored content is already clean) |

### Cross-Phase Anchor Verification

| Anchor | Test Command | Tests | Status |
|---|---|---|---|
| **D-15 sse-snapshot** | `pnpm test tests/api/sse-snapshot.test.ts` | 3 | GREEN |
| **D-26 chat-surface battery** | `pnpm test tests/client/ tests/api/chat-voice-split.test.ts tests/build/no-inline-display-on-chat-panel.test.ts` | 154 | GREEN |
| **TEST-03 anthropic-payload-shape** | `pnpm test tests/api/` | 223 | GREEN |

All three anchors preserved through every task commit.

### Git Log Verification

```
61a359b fix(quick-260513-hqk): WR-05 use matchAll in no-inline-display test
de96a00 fix(quick-260513-hqk): WR-04 optional-chain .finished in pageswap handler
2101d92 fix(quick-260513-hqk): WR-03 reject escaped quotes in chatSummary
029ffc5 fix(quick-260513-hqk): WR-02 extend FIRST_PERSON_LEAK_RE allow-list
de781dd fix(quick-260513-hqk): WR-01 sync .copy-success class in click handler
```

5 atomic `fix(quick-260513-hqk): WR-NN ...` commits landed in order WR-01 → WR-05.

## Decisions Made

- **WR-02 took option (b) not option (a):** Per 17-REVIEW-GAPS.md, option (a) was a structural pattern `\bI(['’]|\s+)\S+|\bMy\s+\S+\b` with allow-list exceptions; option (b) was an extended token allow-list. The plan locked option (b). Rationale: option (a)'s false-positive surface is too wide and would require maintaining an acronym allow-list (FBI, I/O, IBM, etc.) — token allow-list keeps the regex behavior predictable and the negative-control test (Jack's approach, His favorite, etc.) trivially passes.
- **Triplication accepted, shared module deferred:** All 3 sites (build-chat-context.mjs:81, chat-knowledge-voice.test.ts:33, chat-voice-split.test.ts:31) carry byte-identical regex literals. A shared module extraction would couple the build pipeline to the test fixture and complicate CI; the explicit comment "MUST stay BYTE-IDENTICAL" in each file is sufficient for the v1.3 closeout.
- **WR-03 hard-fail not soft-fix:** The alternative was upgrading the regex to `"((?:[^"\\\n]|\\.)*)"` to support `\"` escapes. The plan chose the explicit-throw path to mirror the comma-in-array guard pattern at readArrayField. 0 current chatSummary values use embedded quotes, so this is forward-compatibility hardening, not a live-bug fix.
- **WR-04 test regex relaxed not tightened:** The plan accepts both `\.finished\.catch\(` (old) and `\.finished\?\.catch\(` (new) via `\?\?\.catch`. This is intentional — future contributors are unlikely to remove the second optional-chain, but if they do (for any reason — e.g., spec compliance hardening), the test won't false-fail.
- **copyToClipboard signature retained:** The `button: HTMLElement` parameter is now unused (astro check reports `ts(6133) hint`). Kept for API stability — keeps the signature stable if a future change needs to wire a retry/feedback path through the button reference. The hint is not an error or warning.

## Deviations from Plan

**None — plan executed exactly as written.**

All 5 WR fixes applied per the exact patches in 17-REVIEW-GAPS.md and the corresponding task `<action>` blocks. No auto-fixes (Rule 1/2/3) and no architectural changes (Rule 4) were required. Cross-phase anchors held through every task boundary on the first run.

## Issues Encountered

None. The only diagnostic emitted during execution was the pre-existing astro check hint on `copyToClipboard`'s unused `button` parameter, which is a Decision Made (see above) — kept for signature stability.

## User Setup Required

None — this is a pure code-fix closeout. No environment variables, dashboard configuration, or external services touched.

## v1.3 Milestone Audit Closeout

This quick task addresses the **17-REVIEW-GAPS.md Warnings bucket** from `.planning/v1.3-MILESTONE-AUDIT.md`. After this closeout:

- **Warnings count in 17-REVIEW-GAPS.md:** 5 → 0 (effective — the source file itself is not edited; the closure is recorded via the 5 landed commits and this SUMMARY)
- **Critical findings:** 0 (unchanged — there were none)
- **Info findings:** 6 (unchanged — info-tier deferrals are out of scope per the plan)

The v1.3 milestone tech-debt sweep flagged in `.planning/v1.3-MILESTONE-AUDIT.md` is now drained for the Phase 17 review-Warnings bucket.

## Self-Check: PASSED

**Files Modified — verified present:**

- `src/scripts/chat.ts` — FOUND (modified at lines 377-431)
- `scripts/build-chat-context.mjs` — FOUND (regex at line ~89; readStringField guard at line ~155-160)
- `tests/build/chat-knowledge-voice.test.ts` — FOUND (regex at line ~38; 35 KNOWN_LEAKS entries)
- `tests/api/chat-voice-split.test.ts` — FOUND (regex at line ~33)
- `tests/client/chat-copy-button.test.ts` — FOUND (11 tests, 1 new)
- `src/layouts/BaseLayout.astro` — FOUND (handler at line ~113)
- `tests/build/view-transition-handler.test.ts` — FOUND (relaxed regex at line ~42)
- `tests/build/no-inline-display-on-chat-panel.test.ts` — FOUND (matchAll loop + exactly-one assertion)

**Commits — verified present:**

- `de781dd` (WR-01) — FOUND
- `029ffc5` (WR-02) — FOUND
- `2101d92` (WR-03) — FOUND
- `de96a00` (WR-04) — FOUND
- `61a359b` (WR-05) — FOUND

All artifacts and commits verified.

---

*Quick task: 260513-hqk-v1-3-closeout-close-phase-17-review-warn*
*Completed: 2026-05-13*
