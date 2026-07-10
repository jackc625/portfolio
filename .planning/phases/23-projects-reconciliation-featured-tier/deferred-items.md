# Phase 23 — Deferred Items (out-of-scope discoveries)

Logged by the plan executor. These are NOT fixed here (SCOPE BOUNDARY: only
issues directly caused by the current task's changes are auto-fixed).

## Pre-existing astro-check hint in src/scripts/chat.ts (unrelated to Phase 23)

- **Found during:** Plan 23-01 Task 2 (`pnpm exec astro check`)
- **File:** `src/scripts/chat.ts:384`
- **Hint:** `ts(6133): 'button' is declared but its value is never read` in
  `copyToClipboard(text: string, button: HTMLElement)`.
- **Scope:** `chat.ts` was NOT modified by this plan (`git diff` empty). The
  hint pre-exists Phase 23 and lives in the Phase 7 chat widget.
- **Impact:** `astro check` reports `0 errors / 0 warnings / 1 hint`. Errors and
  warnings are clean; the single hint is the only deviation from a strict
  0/0/0 target and is unrelated to the projects data model this plan touches.
- **Recommendation:** Clear with a low-priority `/gsd-quick` (drop the unused
  `button` param or prefix `_button`) before the Phase 23 capstone gate (23-04)
  if that gate asserts a strict 0/0/0.
