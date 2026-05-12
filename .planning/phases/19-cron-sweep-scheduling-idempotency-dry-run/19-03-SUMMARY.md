---
phase: 19-cron-sweep-scheduling-idempotency-dry-run
plan: 03
subsystem: cron-delivery
tags: [cron-sweep, worker-entrypoint, scheduled-handler, wiring, forward-defense, wave-2]
type: execute
wave: 2
status: complete
completed: 2026-05-12
dependency_graph:
  requires:
    - "Plan 19-01 (Wave 0 — Env.DRY_RUN + vars.DRY_RUN + dev:cron script scaffolding)"
    - "Plan 19-02 (Wave 1 — src/lib/chat-delivery.ts pure module + 19-case test battery)"
  provides:
    - "src/worker.ts scheduled() handler wired to deliverDue via ctx.waitUntil(.catch INSIDE)"
    - "tests/build/worker-scheduled-call-site.test.ts — 6-invariant source-text forward-defense"
    - "Closed carry-forward: pre-existing worker.ts:25 ts(2345) Plan 19-01 leak ABSORBED"
  affects:
    - "Plan 19-04 (final wave — wrangler.jsonc triggers.crons flip + UAT doc; only the cron declaration remains)"
tech_stack:
  added: []
  patterns:
    - "ctx.waitUntil(promise.catch(...)) — .catch chained INSIDE per Phase 18 D-09 / D-10 / D-11 (RESEARCH § Pattern 1); rejection surfaces as worker.scheduled.failed catastrophic log"
    - "source-text forward-defense sibling — append-turn-call-site.test.ts idiom applied to scheduled() with deviations: drop count assertion (1 call site), drop ordering assertion (no controller.close), add anti-stub-log-line + Env.DRY_RUN invariants"
    - "dynamic-RegExp anti-destructure — string-concatenated RegExp source so the test file itself does NOT self-match Invariant D"
    - "DRY_RUN literal narrowing — local Env.DRY_RUN narrowed from `string` to `\"1\"` to satisfy wrangler-generated global `Env extends Cloudflare.Env` (DRY_RUN: \"1\") at handle() call site; DeliveryEnv.DRY_RUN: string still accepts \"1\" (subtype)"
key_files:
  created:
    - "tests/build/worker-scheduled-call-site.test.ts (89 LOC, 6 invariants A-F)"
  modified:
    - "src/worker.ts (scheduled() body replacement + deliverDue import + DRY_RUN narrowing)"
    - ".planning/phases/19-cron-sweep-scheduling-idempotency-dry-run/deferred-items.md (marked ts(2345) carry-forward ABSORBED)"
decisions:
  - "Plan 19-03 D-PA-01 — DRY_RUN narrowed to literal \"1\" (vs option 1 drop-field or option 3 type-assertion): chose closure path option 2 from deferred-items.md candidate list. Trade-off accepted: couples worker.ts Env declaration to wrangler-generated type. Justified because DRY_RUN's source of truth IS the wrangler.jsonc vars block (only ever \"1\" in Phase 19); the literal type matches reality. Option 1 (drop the field) failed because the local exported Env interface is module-scoped and does NOT merge with the global `Env extends Cloudflare.Env` — leaving the field out broke the structural assignment to DeliveryEnv. Option 3 (type assertion at handle() call site) was a last-resort hack that obscures intent."
metrics:
  duration_minutes: 5
  files_modified: 2
  files_created: 1
  tests_added: 6
  net_loc_added: 105
  tests_pass: 496
  tests_fail: 0
  tests_skip: 2
  typecheck_errors: 0
  typecheck_errors_new_in_this_plan: -1
  typecheck_warnings: 0
  typecheck_hints: 0
---

# Phase 19 Plan 03: Wire scheduled() to deliverDue + Source-Text Forward Defense Summary

Two-task execute plan that plugs Plan 19-02's unit-tested `deliverDue` into `src/worker.ts`'s `scheduled()` handler via `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch(...))` with the `.catch` chained INSIDE per Phase 18 D-09. Locks the call-site shape with 6 source-text invariants in a new build-tier test. Absorbs the pre-existing `worker.ts:25` ts(2345) carry-forward from Plan 19-01 by narrowing `Env.DRY_RUN` from `string` to the wrangler-generated literal `"1"`.

## One-liner

`scheduled()` handler dispatches to `deliverDue` with rejection-safe `.catch` INSIDE the `ctx.waitUntil` promise + 6-invariant source-text forward-defense locked at the build-test tier; pre-existing carry-forward ts(2345) error absorbed (1 → 0 typecheck errors).

## What Changed

### Modified — `src/worker.ts` (lines 1-58, was 1-45)

**Before (Phase 17 stub, lines 27-44 of pre-edit file):**
- 5-line WR-05 comment block about "structured warn line" + "accidental cron wiring breadcrumb"
- `console.warn("worker.scheduled.stub", { note, scheduledTime, cron })`
- `ctx.waitUntil(Promise.resolve())`
- 2-line forward-compat comment "Phase 19 will replace with: ctx.waitUntil(deliverDue(_env, _controller.scheduledTime))"
- `_controller` + `_env` underscore-prefixed args
- `DRY_RUN: string` in Env interface

**After (Plan 19-03 wire, lines 35-57 of post-edit file):**
- 14-line comment block citing Phase 18 D-09 / D-10 / D-11 + RESEARCH § Pattern 1 + the literal substring `Phase 19 CRON-01 — scheduled() dispatch` (so `worker-entrypoint.test.ts:40-43` keeps matching `src.toContain("Phase 19")`)
- `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch((err: unknown) => { console.error("worker.scheduled.failed", { error_class: err instanceof Error ? err.constructor.name : "Error" }); }))`
- Underscore prefixes dropped — both `controller.scheduledTime` and `env` actively used
- `DRY_RUN: "1"` in Env interface (literal narrowing)
- Added top-level `import { deliverDue } from "./lib/chat-delivery";` (line 10)

### Created — `tests/build/worker-scheduled-call-site.test.ts` (89 LOC)

Single `describe` block titled `"CRON-01: ctx.waitUntil(deliverDue(...).catch(...)) call site in src/worker.ts"`. Six `it(...)` invariants:

| Invariant | Locked behavior |
|-----------|-----------------|
| A | `import { deliverDue } from "./lib/chat-delivery"` — path-drift defense |
| B | `ctx.waitUntil(deliverDue(...))` wrap present in scheduled() body |
| C | `.catch(` chained INSIDE the promise (Phase 18 D-09 inheritance) |
| D | NO `const { waitUntil } = ctx` destructure (anti-`Illegal invocation`) |
| E | `worker.scheduled.stub` REMOVED + `worker.scheduled.failed` + `error_class` present |
| F | `Env.DRY_RUN` field exists (accepts either `"1"` literal or `string` width) |

**Anti-self-match technique** (Invariant D): the destructure pattern is built via `new RegExp([...].join(""))` so this test file itself contains no literal occurrence of the anti-pattern. Verified by `grep -c "new RegExp(" tests/build/worker-scheduled-call-site.test.ts → 1` and absence of the literal `const { waitUntil } = ctx` in the file.

### Modified — `deferred-items.md`

Updated the Plan 19-02 carry-forward entry to status `ABSORBED by Plan 19-03 (commit e87b513)` with the chosen closure path (option 2: literal narrowing) and post-fix `astro check` 0/0/0 confirmation.

## Pre-existing Carry-Forward Absorbed

**`src/worker.ts:25` ts(2345)** — `Argument of type 'import("...").Env' is not assignable to parameter of type 'Env'. Types of property 'DRY_RUN' are incompatible. Type 'string' is not assignable to type '"1"'.`

**Origin:** Plan 19-01 added `DRY_RUN: string` to the local exported `Env` interface in `src/worker.ts`. Wrangler types regenerated `Cloudflare.Env.DRY_RUN: "1"` (literal). The global `Env extends Cloudflare.Env` (in `worker-configuration.d.ts:15`) inherits `DRY_RUN: "1"`. The local exported `Env` is module-scoped — it does NOT merge with the global. At `handle(request, env, ctx)`, `env` was typed against the wider local declaration; the wider `string` cannot pass through to the global `Env`'s `"1"` literal — ts(2345).

**Resolution:** Narrowed the local `Env.DRY_RUN` to `"1"` to match. Option 2 from `deferred-items.md` closure path candidates. Tried option 1 first (drop the field entirely) — that produced a fresh error because the module-scoped exported `Env` does NOT inherit from the global, and `DeliveryEnv.DRY_RUN: string` then complained the field was missing on the passed-in `env`. Option 2 is the cleanest: the local and global declarations now agree on `"1"`; `DeliveryEnv.DRY_RUN: string` still accepts `"1"` (subtype relation).

**Confirmation:** `pnpm exec astro check` reports `0 errors / 0 warnings / 0 hints` — the only diagnostic on the repo at Plan 19-02's close-out is gone after the Task 1 commit.

## Verification Results

| Gate | Result | Notes |
|------|--------|-------|
| `pnpm exec astro check` | 0 errors / 0 warnings / 0 hints | Carry-forward ts(2345) absorbed (1 → 0) |
| `pnpm exec vitest run tests/build/worker-scheduled-call-site.test.ts` | 6 / 6 PASS | All 6 invariants A-F GREEN |
| `pnpm exec vitest run tests/build/worker-entrypoint.test.ts` | 5 / 5 PASS | Phase 17 FOUND-02 baseline preserved — `Phase 19` substring matched via new comment line; `deliverDue` substring matched via new import + call site |
| `pnpm exec vitest run tests/api/chat-delivery.test.ts` | 19 / 19 PASS | Plan 19-02 unit tests unaffected |
| `pnpm test` full battery | 496 PASS / 0 FAIL / 2 SKIP (58 files, 1 file skipped) | = 490 Plan 19-02 baseline + 6 new |
| `tests/api/sse-snapshot.test.ts` (D-15 anchor) | 3 / 3 PASS | scheduled() change doesn't touch SSE surface |
| `tests/api/anthropic-payload-shape.test.ts` (TEST-03 anchor) | 8 / 8 PASS | scheduled() change doesn't touch Anthropic surface |
| Line count (`tests/build/worker-scheduled-call-site.test.ts`) | 89 LOC | >= 60 plan minimum |
| `it()` count in new test file | 6 (exact) | Plan-spec match |
| Dynamic-RegExp pattern present (`new RegExp([...].join(""))`) | 1 match | Self-matching anti-pattern avoided |
| Forbidden substring `worker.scheduled.stub` in `src/worker.ts` | 0 matches | Substitution semantic honored |
| Forbidden substring `_controller` in `src/worker.ts` | 0 matches | Underscore prefix dropped |
| Forbidden substring `_env` in `src/worker.ts` | 0 matches | Underscore prefix dropped |
| Forbidden substring `const { waitUntil } = ctx` in `src/worker.ts` | 0 matches | Anti-destructure (Pitfall 1) clean |
| Forbidden substring `switch (controller.cron)` in `src/worker.ts` | 0 matches | Single-cron unconditional dispatch (Pitfall 3) |
| Required substring `import { deliverDue } from "./lib/chat-delivery"` | 1 match | Invariant A anchor present |
| Required regex `ctx\.waitUntil\(\s*deliverDue\(\s*env\s*,\s*controller\.scheduledTime\s*\)\s*\.catch\(` | 1 match | .catch INSIDE the promise per Phase 18 D-09 |
| Required substring `worker.scheduled.failed` | 1 match | Catastrophic-only observability surface present |
| Required substring `Phase 19` in `src/worker.ts` | 1 match | worker-entrypoint.test.ts:40-43 anchor preserved |

## Two-Commit Sequence

| Commit | SHA | Type | What landed |
|--------|-----|------|-------------|
| Task 1 | `e87b513` | feat | scheduled() body replacement + deliverDue import + DRY_RUN narrowing + carry-forward absorption |
| Task 2 | `2936023` | test | tests/build/worker-scheduled-call-site.test.ts 6-invariant source-text forward-defense |

## Deviations from Plan

### Rule 3 inline fix #1 — DRY_RUN narrowing absorbed the carry-forward

- **Found during:** Task 1 `pnpm exec astro check` — after writing the scheduled() body replacement
- **Issue:** Pre-existing ts(2345) at `worker.ts:25` (carry-forward from Plan 19-01 logged in deferred-items.md). The plan anticipated absorption via the natural Plan 19-03 worker.ts touch; this is the absorption.
- **First attempt:** Dropped `DRY_RUN: string` from local Env entirely, expecting interface-merge from `Cloudflare.Env`. FAILED — local exported Env is module-scoped and does NOT merge with the global `Env extends Cloudflare.Env`. Produced a fresh "Property 'DRY_RUN' is missing" error.
- **Second attempt (kept):** Narrowed `DRY_RUN: string` to `DRY_RUN: "1"` (literal matching the wrangler-generated type). Trade-off accepted per Plan 19-03 D-PA-01.
- **Files modified:** `src/worker.ts` (Env interface) — bundled into commit `e87b513`
- **Status:** Resolved. astro check 0/0/0. deferred-items.md updated with closure marker.

No other deviations. No Rule 1 / Rule 2 / Rule 4 triggers encountered.

## Authentication Gates

None encountered. All work was local file-write + local `pnpm exec vitest` + `pnpm exec astro check`.

## Confirmation Plan 19-04 is the Final Wave

Plan 19-03 delivered the wiring. Remaining for Phase 19 close:
- Plan 19-04: flip `wrangler.jsonc` `triggers.crons` from `[]` to `["0 * * * *"]`, ship 19-UAT.md, update ROADMAP.md / STATE.md / REQUIREMENTS.md metadata.

After Plan 19-04 the cron will fire hourly against production KV under DRY_RUN gate, sweeping live: transcripts older than 2h, writing delivered:{sid} markers, emitting `chat.delivery.dry_run` envelope logs — all per the unit-tested deliverDue contract Plan 19-02 sealed and Plan 19-03 wired.

## Threat Flags

None — Plan 19-03 introduces no new security-relevant surface outside the threat register documented in `19-03-PLAN.md`. The 4 STRIDE entries (T-19-03-01..04) all map to mitigations enforced by:
- **T-19-03-01 (Repudiation):** `.catch` chained INSIDE the promise — locked by Invariant C
- **T-19-03-02 (Tampering — contributor removes .catch / destructures ctx):** Invariants C + D fail at build-test time
- **T-19-03-03 (DoS — handler exceeds wall-clock):** Bounded by Plan 19-02's inner caps (50-session batch, 50-page pagination, 3-try retry); DRY_RUN no-op send under Phase 19; accepted in threat register
- **T-19-03-04 (Information Disclosure):** Only `error_class` (constructor name) logged — no message, no stack — locked by Invariant E `error_class` substring assertion

## Self-Check: PASSED

Files verified to exist:
- `src/worker.ts` (58 LOC, modified) — FOUND
- `tests/build/worker-scheduled-call-site.test.ts` (89 LOC, created) — FOUND
- `.planning/phases/19-cron-sweep-scheduling-idempotency-dry-run/deferred-items.md` (modified — ABSORBED marker) — FOUND

Commits verified in `git log --oneline -3`:
- `e87b513` (feat(19-03): wire scheduled() to deliverDue with ctx.waitUntil(.catch INSIDE)) — FOUND
- `2936023` (test(19-03): add worker-scheduled-call-site.test.ts source-text forward-defense) — FOUND

All claims in this SUMMARY backed by `pnpm test: 496 PASS / 0 FAIL / 2 SKIP` and `pnpm exec astro check: 0 errors / 0 warnings / 0 hints` output captured at execution time.
