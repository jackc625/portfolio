---
phase: 19-cron-sweep-scheduling-idempotency-dry-run
fixed_at: 2026-05-12T00:00:00Z
review_path: .planning/phases/19-cron-sweep-scheduling-idempotency-dry-run/19-REVIEW.md
iteration: 1
findings_in_scope: 10
fixed: 10
skipped: 0
status: all_fixed
---

# Phase 19: Code Review Fix Report

**Fixed at:** 2026-05-12
**Source review:** `.planning/phases/19-cron-sweep-scheduling-idempotency-dry-run/19-REVIEW.md`
**Iteration:** 1

## Summary

- Findings in scope: 10 (2 critical CR-* + 8 warning WR-*)
- Fixed: 10
- Skipped: 0

All 10 critical-and-warning findings from `19-REVIEW.md` were applied. WR-05 and WR-06 share root cause (duplicated `parseJsonc` helper + naive regex) and were fixed in a single combined commit. Final test count: 497 / 500 pass (1 pre-existing failure unrelated to fixes — `no-mdx-in-worker-bundle.test.ts` requires `pnpm build` artifacts that do not exist in the fresh review-fix worktree; the test self-reports "dist/ does not exist — run `pnpm build` first"; 2 skips were pre-existing per Phase 18 close baseline).

## Findings Table

| ID    | Severity | Status | Files Modified | Commit  | Notes |
|-------|----------|--------|----------------|---------|-------|
| CR-01 | Critical | fixed  | `src/lib/chat-delivery.ts` | `f7af453` | Wrap `delivered:{sid}` short-circuit read in try/catch per CRON-03 isolation invariant |
| CR-02 | Critical | fixed: requires human verification | `src/lib/chat-delivery.ts` | `2284757` | Add `Number.isNaN(lastActiveMs)` guard before threshold check; logic-bug flag per fixer protocol (defensive change, no test exercises NaN path yet) |
| WR-01 | Warning  | fixed  | `src/lib/chat-delivery.ts` | `e0d01d9` | Switch batch cap from `sessionsPromoted` to new `sessionsProcessed` counter; happy-path test (60 stale -> 50+10) still green |
| WR-02 | Warning  | fixed  | `src/lib/chat-delivery.ts`, `src/worker.ts`, `wrangler.jsonc`, `tests/api/chat-delivery.test.ts` | `ea5d558` | Add `CHAT_REPLY_TO_EMAIL` to `DeliveryEnv` + `Env`; bind in wrangler.jsonc vars; thread through test buildEnv helper |
| WR-03 | Warning  | fixed  | `src/lib/chat-delivery.ts` | `975b515` | Gated best-effort `live:` GC on `deliveredWritten` flag so pre-PUT failures still preserve `live:` for retry |
| WR-04 | Warning  | fixed  | `src/worker.ts` | `63a997b` | Mark `RESEND_API_KEY`, `CHAT_RECIPIENT_EMAIL`, `CHAT_SENDER_EMAIL` optional; matches existing `DeliveryEnv` optional-binding posture |
| WR-05 | Warning  | fixed  | `tests/build/_helpers/parse-jsonc.ts` (NEW), `tests/build/wrangler-shape.test.ts`, `tests/build/wrangler-cron-shape.test.ts` | `e17e053` | Combined with WR-06 — replaced naive regex with string-literal-aware tokenizer in shared helper |
| WR-06 | Warning  | fixed  | (same as WR-05) | `e17e053` | Combined with WR-05 — extracted duplicated `parseJsonc` to shared `_helpers/parse-jsonc.ts` so a single source of truth governs both wrangler tests |
| WR-07 | Warning  | fixed  | `tests/build/worker-scheduled-call-site.test.ts` | `2b87a4e` | Broaden Invariant D anti-destructure regex: now catches let/var, aliased destructures, rest spreads, and bare function-reference extraction |
| WR-08 | Warning  | fixed  | `tests/build/wrangler-cron-shape.test.ts` | `dbfa413` | Replaced censored `anti-*****-leak` with `anti-wildcard-cron-leak` plain-English description |

## Fixed Issues

### CR-01: `delivered:{sid}` short-circuit read not wrapped in try/catch — CRON-03 isolation violated

**Files modified:** `src/lib/chat-delivery.ts`
**Commit:** `f7af453`
**Applied fix:** Wrapped the step-1 idempotency cursor read in a try/catch matching the existing step-2 transcript-load pattern. On KV failure, emits `chat.delivery.failed { sid, error_class, msg_count: 0 }` and returns `{ status: "error" }` so the outer caller's loop continues to the next session. Preserves CRON-03 per-session isolation invariant against transient KV blips.

### CR-02: `Date.parse` NaN result silently promotes malformed `last_activity_at`

**Files modified:** `src/lib/chat-delivery.ts`
**Commit:** `2284757`
**Applied fix:** Added `if (Number.isNaN(lastActiveMs)) continue;` immediately after `Date.parse(metadata.last_activity_at)`. Malformed-ISO sessions are now skipped defensively rather than flowing through to `promoteOne` as falsely-due. Marked `fixed: requires human verification` in the findings table because the existing 19-test suite does not exercise the NaN path explicitly — a developer should manually confirm the guard semantics before Phase 20 flips DRY_RUN to "0".

### WR-01: `PER_TICK_BATCH_CAP` semantics drift between doc and code

**Files modified:** `src/lib/chat-delivery.ts`
**Commit:** `e0d01d9`
**Applied fix:** Added a parallel `sessionsProcessed` counter and bound both the inner-loop and page-boundary cap guards on it instead of `sessionsPromoted`. Each due session that enters `promoteOne` consumes a slot regardless of outcome (promoted, already_delivered, missing_live, error). Existing happy-path test (60 stale -> 50+10) still passes because in all-success runs `processed == promoted`. Constant comment + `deliverDue` docstring updated to reflect new semantics.

### WR-02: Hardcoded `reply_to` magic string

**Files modified:** `src/lib/chat-delivery.ts`, `src/worker.ts`, `wrangler.jsonc`, `tests/api/chat-delivery.test.ts`
**Commit:** `ea5d558`
**Applied fix:** Added optional `CHAT_REPLY_TO_EMAIL?: string` to both `DeliveryEnv` (chat-delivery.ts) and `Env` (worker.ts). Bound `"CHAT_REPLY_TO_EMAIL": "jackcutrara@gmail.com"` in `wrangler.jsonc` vars block alongside DRY_RUN. Envelope log line now reads `env.CHAT_REPLY_TO_EMAIL ?? null` instead of the hardcoded literal. Test helper `buildEnv` extended to thread the same default so the existing D-05 envelope-shape assertion still passes.

### WR-03: Partial-failure window can leave orphan `live:` keys

**Files modified:** `src/lib/chat-delivery.ts`
**Commit:** `975b515`
**Applied fix:** Added `deliveredWritten` flag set to `true` only after the `delivered:{sid}` PUT awaits successfully. In the catch block, if the marker was written, attempt a single best-effort `kv.delete(live:{sid})` wrapped in its own try/catch (fire-and-forget; main error already logged). Gated on `deliveredWritten` so pre-PUT failures (send throws, delivered: PUT fails) leave `live:` in place — preserves the existing "retry harness 3 attempts" test contract that a failed send keeps `live:` retriable.

### WR-04: Optional runtime secrets declared as required

**Files modified:** `src/worker.ts`
**Commit:** `63a997b`
**Applied fix:** Marked `RESEND_API_KEY`, `CHAT_RECIPIENT_EMAIL`, `CHAT_SENDER_EMAIL` optional (`?:`) on the `Env` interface. Aligns to the existing `DeliveryEnv` optional-binding posture and surfaces missing-binding bugs at the access site rather than letting TypeScript silently lie. `ANTHROPIC_API_KEY` remains required (augmented in `src/types/env.d.ts`); `CHAT_KV`/`ASSETS` remain required (wrangler.jsonc bindings); `DRY_RUN` stays narrowed to literal `"1"` per Plan 19-03's compatibility absorption.

### WR-05 + WR-06: `parseJsonc` regex fragility + duplication (combined)

**Files modified:** `tests/build/_helpers/parse-jsonc.ts` (NEW), `tests/build/wrangler-shape.test.ts`, `tests/build/wrangler-cron-shape.test.ts`
**Commit:** `e17e053`
**Applied fix:** Extracted `parseJsonc` to a new shared helper at `tests/build/_helpers/parse-jsonc.ts`. Replaced the regex-based stripping with a ~30-LOC per-character state machine that tracks string-literal boundaries with backslash-escape handling before considering `//` or `/*` comment starts. Both wrangler-shape tests now import from the shared helper. Deliberately avoided adding the `jsonc-parser` npm dep per the zero-new-runtime-deps preferred path in CLAUDE.md project conventions.

### WR-07: Anti-destructure regex too narrow

**Files modified:** `tests/build/worker-scheduled-call-site.test.ts`
**Commit:** `2b87a4e`
**Applied fix:** Broadened Invariant D's regex to use `(?:const|let|var)` and a permissive `[^}]*` class around the `waitUntil` identifier so `let { waitUntil } = ctx`, `const { waitUntil: alias } = ctx`, `var { waitUntil, ...rest } = ctx`, etc. all match. Added a second pattern `/\bctx\s*\.\s*waitUntil\s*(?!\()/` to catch bare function-reference extraction (`const w = ctx.waitUntil`), with comment-line filtering to avoid false positives from prose mentions in JSDoc.

### WR-08: Censored placeholder in test description

**Files modified:** `tests/build/wrangler-cron-shape.test.ts`
**Commit:** `dbfa413`
**Applied fix:** Replaced `anti-*****-leak` with `anti-wildcard-cron-leak`. The `*****` was the literal every-minute cron expression (`* * * * *` with spaces stripped); the new term plainly describes the intent: prevent the wildcard cron pattern (UAT Step 1's temporary flip) from leaking into production where it would burn Free-tier quota. Added an inline comment documenting the rename for archaeology.

## Skipped Issues

None.

## Post-Fix Test Run

`pnpm test` exits with 1 failed test (pre-existing, environmental):

```
× tests/build/no-mdx-in-worker-bundle.test.ts > dist contains some Worker bundle JS to inspect
   AssertionError: dist/ does not exist — run `pnpm build` first
```

Root cause: the test asserts that `dist/` contains built worker JS to inspect for MDX leakage. The review-fix worktree has no `dist/` because no build was run. The main repo's `dist/` exists from a prior build. This failure is not caused by any of the 10 fixes — running `pnpm build` before `pnpm test` would clear it. Test counts: **497 pass / 1 fail / 2 skip out of 500** (the 2 skips were already present at Phase 18 close per STATE.md baseline of 419 PASS / 0 FAIL / 2 SKIP, expanded by Phase 19 to ~500 tests).

No follow-up `fix(19): post-fix test failures` commit needed — the failure is not a regression introduced by any fix.

## Commit Sequence

In application order (newest last):

1. `f7af453` — fix(19): CR-01 wrap delivered:{sid} short-circuit read in try/catch
2. `2284757` — fix(19): CR-02 add Number.isNaN guard before INACTIVITY_THRESHOLD_MS check
3. `e0d01d9` — fix(19): WR-01 cap PER_TICK_BATCH_CAP on sessions processed, not promoted
4. `ea5d558` — fix(19): WR-02 source envelope reply_to from CHAT_REPLY_TO_EMAIL env var
5. `975b515` — fix(19): WR-03 best-effort GC for orphan live: key when delivered: PUT succeeded
6. `63a997b` — fix(19): WR-04 mark Phase 17 secrets/vars optional in worker.ts Env
7. `e17e053` — fix(19): WR-05+WR-06 extract parseJsonc to shared helper with string-aware tokenizer
8. `2b87a4e` — fix(19): WR-07 broaden Invariant D anti-destructure pattern coverage
9. `dbfa413` — fix(19): WR-08 replace censored anti-*****-leak placeholder in test description

---

_Fixed: 2026-05-12_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
