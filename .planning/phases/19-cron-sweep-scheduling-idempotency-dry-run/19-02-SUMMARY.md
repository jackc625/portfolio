---
phase: 19-cron-sweep-scheduling-idempotency-dry-run
plan: 02
subsystem: cron-delivery
tags: [cron-sweep, pure-module, two-keyspace, dry-run, tdd, kv-list, wave-1]
type: tdd
wave: 1
status: complete
completed: 2026-05-12
dependency_graph:
  requires:
    - "Plan 19-01 (Wave 0 scaffolding — Env.DRY_RUN: string + vars.DRY_RUN + dev:cron script)"
    - "Phase 18 src/lib/chat-transcripts.ts (KEY_PREFIX, ChatTranscript, KVMetadata source-of-truth)"
  provides:
    - "src/lib/chat-delivery.ts public surface: deliverDue + DeliveredMarker + 7 locked constants"
    - "tests/api/chat-delivery.test.ts: 19-case unit-test battery (8 describe groups A-H)"
    - "MockKVNamespace pattern extended with delete + cursor-paginated list — reusable in Phase 19/20 sibling tests"
  affects:
    - "Plan 19-03 (worker.ts scheduled() body replacement) — imports deliverDue, structural Env compat via DeliveryEnv interface"
    - "Plan 19-04 (triggers.crons flip) — unit-tested module ready for cron tick dispatch"
    - "Phase 20 (Resend integration) — sendOne 'send_not_implemented_in_phase_19' throw is the substitution target"
tech_stack:
  added: []
  patterns:
    - "pure-module-sibling: src/lib/chat-delivery.ts mirrors src/lib/chat-transcripts.ts file shape byte-for-byte (header docblock with decision-ID groups, locked-constants block, public types, internal helpers, inline decision-ID citations, NO cloudflare:workers virtual-module import)"
    - "two-keyspace-promotion: 5-step ordering (read delivered → load live → send → PUT delivered → DELETE live) with PUT-before-DELETE invariant locked at the test level via MockKV operation-log"
    - "exponential-full-jitter-backoff: retryWithBackoff with base 250ms / cap 5000ms / 3 attempts (OQ-2 recommendation)"
    - "cursor-paginated mock KV: MockKVNamespace.list returns { keys, list_complete, cursor } with numeric-string cursor indexing the sorted entries array; pageSize defaults 1000; listOverride hook enables infinite-pages + missing-live tests"
    - "DRY_RUN strict-equals-string gate: env.DRY_RUN === \"1\" — Boolean coercion explicitly rejected at decision time (D-02) to prevent \"false\" → truthy"
    - "structured workers logs: chat.delivery.{tick,dry_run,skipped_already_delivered,failed} flat-primitive convention preserves the Plan 17-05 DEBT-02 + Phase 18 chat.transcript.* observability surface convention"
key_files:
  created:
    - "src/lib/chat-delivery.ts (364 LOC, 9 named exports — DeliveredMarker + 8 constants + deliverDue)"
    - "tests/api/chat-delivery.test.ts (964 LOC, 19 it() cases across 8 describe groups)"
    - ".planning/phases/19-cron-sweep-scheduling-idempotency-dry-run/deferred-items.md (logs pre-existing worker.ts:25 ts(2345) carry-forward for Plan 19-03 absorption)"
  modified: []
decisions:
  - "Plan 19-02 D-PA-01 — full-jitter exponential backoff (vs equal-jitter or fixed): Math.floor(Math.random() * Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt)) chosen per OQ-2 recommendation. Trade-off accepted: slightly higher latency variance vs substantially reduced thundering-herd risk when many sessions retry simultaneously."
  - "Plan 19-02 D-PA-02 — MockKVNamespace cursor implementation: numeric-string indices into sorted entries array; pageSize defaults 1000; list_complete = (cursor + pageSize >= total). Production KV cursor opacity isn't under test; pagination CONTROL FLOW is what matters."
  - "Plan 19-02 D-PA-03 — listOverride hook on MockKVNamespace enables the pagination-hard-cap (infinite-pages) test AND the missing-live race test without polluting the default list() with branching logic. Each describe block that needs custom list semantics installs its own listOverride; other tests use the default snapshot-of-storage list() path."
  - "Plan 19-02 D-PA-04 — multi-page batch drain test uses a snapshot of live: keys captured at sweep start (NOT live storage reads on each list call) because promoteOne's kv.delete(live:{sid}) would shrink the storage map mid-sweep and break paged iteration. Production KV's list() returns a point-in-time view; the mock mirrors that semantics."
  - "Plan 19-02 D-PA-05 — promoteOne's step-2 KV read is wrapped in try/catch (in addition to the steps-3-5 outer try/catch) so a malformed-JSON or KV-read failure on a single session does not abort the per-tick sweep loop. Per-session isolation test (Group G case 18) exercises this path directly."
  - "Plan 19-02 D-PA-06 — pre-existing src/worker.ts:25 ts(2345) error left untouched per SCOPE BOUNDARY. Plan 19-01's SUMMARY claimed astro check 0/0/0; verified the error is pre-Plan-19-02 by temporarily moving aside Plan 19-02 files. Logged for Plan 19-03 absorption (which is the next plan to touch worker.ts)."
metrics:
  duration_minutes: 15
  files_modified: 0
  files_created: 2
  tests_added: 19
  net_loc_added: 1334
  tests_pass: 490
  tests_fail: 0
  tests_skip: 2
  typecheck_errors: 1
  typecheck_errors_new_in_this_plan: 0
  typecheck_warnings: 0
  typecheck_hints: 0
---

# Phase 19 Plan 02: chat-delivery module + 19-case test battery Summary

TDD-driven implementation of `src/lib/chat-delivery.ts` — the heart of Phase 19's cron sweep. Pure module with zero new runtime dependencies, zero chat-surface imports, zero modified files. RED → GREEN cycle in two commits with all 19 unit tests passing against an extended `MockKVNamespace` that the Phase 18 sibling pattern naturally generalizes.

## One-liner

`deliverDue(env, scheduledTime?)` with two-keyspace promotion (live: → delivered:), DRY_RUN-gated envelope log harness, 50-session batch cap + 50-page pagination hard-cap + 3-try exponential-full-jitter retry harness, per-session try/catch isolation, four structured `chat.delivery.*` Workers Logs — fully unit-tested with 19 cases across 8 describe groups.

## What Changed

Two new files, zero modifications.

### Created — `src/lib/chat-delivery.ts` (364 LOC)

Pure module mirroring `src/lib/chat-transcripts.ts` byte-for-byte structurally. Imports `ChatTranscript` + `KVMetadata` as types and `KEY_PREFIX` as value from `./chat-transcripts` (single source-of-truth for the `"live:"` prefix string).

**Public surface (9 named exports):**

| Symbol | Type | Purpose |
|--------|------|---------|
| `deliverDue(env, scheduledTime?)` | `function` | Top-level cron entry; pagination loop + per-key dispatch |
| `DeliveredMarker` | `interface` | D-09/D-10 schema-versioned envelope written to `delivered:{sid}` |
| `INACTIVITY_THRESHOLD_MS` | `const` | `2 * 60 * 60 * 1000` (2h) |
| `PER_TICK_BATCH_CAP` | `const` | `50` |
| `PAGINATION_PAGE_HARDCAP` | `const` | `50` |
| `MAX_SEND_ATTEMPTS` | `const` | `3` |
| `DELIVERED_TTL_SECONDS` | `const` | `24 * 3600` (24h marker) |
| `BACKOFF_BASE_MS` | `const` | `250` (full-jitter base) |
| `BACKOFF_CAP_MS` | `const` | `5000` (full-jitter ceiling) |

**Internal helpers:**

| Function | Owns |
|----------|------|
| `promoteOne(env, sid)` | 5-step two-keyspace promotion with PUT-before-DELETE ordering invariant; outer try/catch (steps 3-5) + step-2 inner try/catch for KV-read failures; per-session isolation |
| `sendOne(env, transcript)` | DRY_RUN gate (`env.DRY_RUN === "1"`); emits `chat.delivery.dry_run` log with locked D-05 field names; throws `"send_not_implemented_in_phase_19"` under any other value |
| `retryWithBackoff(fn, maxAttempts)` | OQ-2 exponential full-jitter; `Math.floor(Math.random() * Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt))` per inter-attempt sleep |
| `hostnameOrNull(url?)` | `referrer_host` envelope-log field; try-catch around `new URL(url).hostname`; returns null for missing/malformed |

**Internal interface (not exported):**

```typescript
interface DeliveryEnv {
  CHAT_KV: KVNamespace;
  DRY_RUN: string;
  CHAT_RECIPIENT_EMAIL?: string;
  CHAT_SENDER_EMAIL?: string;
}
```

NOT imported from `src/worker.ts` (cyclic-import avoidance); callers pass the real `Env` which structurally matches.

### Created — `tests/api/chat-delivery.test.ts` (964 LOC)

19 it() cases across 8 describe blocks (one per requirement group A-H):

| Group | Tests | Anchors |
|-------|-------|---------|
| A: CRON-02 list + inactivity filter | 3 | 2h threshold; live: prefix-only list |
| B: CRON-02 ordering invariant | 2 | D-09 — PUT delivered BEFORE DELETE live |
| C: D-09/D-10/D-11 envelope value shape | 3 | Exact key set; 24h TTL; no metadata |
| D: CRON-04 DRY_RUN gate | 2 | D-01/D-02 strict-equals-string; D-05 field names |
| E: CRON-02 idempotency cursor | 2 | skipped_already_delivered log; missing-live graceful skip |
| F: CRON-03 batch cap + pagination | 3 | 50-session cap; 50-page hard-cap; multi-page drain |
| G: CRON-03 retry harness + isolation | 3 | 3-try retry; per-session try/catch |
| H: observability tick summary | 1 | chat.delivery.tick log shape |

**MockKVNamespace extension** (vs Phase 18 single-page mock):

- `async delete(key)` — required by promoteOne step 5
- Cursor-paginated `list({ prefix, cursor, limit })` returning `{ keys, list_complete, cursor }` — numeric-string cursor indexes into sorted entries
- `operations: Array<{op, key, ts}>` log — captures KV touch ordering for the PUT-before-DELETE invariant tests
- `listOverride: ((opts) => Promise<...>) | null` hook — enables infinite-pages (pagination-cap test) and missing-live (race test) without polluting default behavior

**Hard-coded fixtures (Phase 18 sibling pattern reused):**

- `SID = "8b0f7f1c-1234-4567-8901-abcdef012345"` (Phase 18 fixture verbatim)
- `SCHEDULED_NOW = Date.parse("2026-05-12T12:00:00.000Z")` — deterministic
- `STALE_3H` / `FRESH_30M` — relative to SCHEDULED_NOW for tick-as-batch consistency

### Created — `.planning/phases/19-cron-sweep-scheduling-idempotency-dry-run/deferred-items.md`

Logs the pre-existing `src/worker.ts:25 ts(2345)` carry-forward from Plan 19-01 for Plan 19-03 absorption (Plan 19-03 is the next plan to touch `src/worker.ts`).

## Verification Results

| Gate | Result | Notes |
|------|--------|-------|
| `pnpm exec vitest run tests/api/chat-delivery.test.ts` | 19/19 PASS, 0 FAIL | All 8 groups GREEN |
| `pnpm test` full battery | 490 PASS / 0 FAIL / 2 SKIP (57 files, 1 skipped) | = 471 Phase 18 baseline + 19 new |
| `pnpm exec astro check` (Plan 19-02 contribution) | 0 NEW errors, 0 warnings, 0 hints | 1 pre-existing error from Plan 19-01 verified out-of-scope (see deferred-items.md) |
| `tests/api/sse-snapshot.test.ts` (D-15 anchor) | 3/3 GREEN | Plan 19-02 doesn't touch SSE surface |
| `tests/api/anthropic-payload-shape.test.ts` (TEST-03 anchor) | 8/8 GREEN | Plan 19-02 doesn't touch Anthropic surface |
| Forbidden-import grep | 0 matches in actual import statements | `@anthropic-ai/sdk`, `cloudflare:workers`, `src/prompts/`, `src/pages/`, `src/scripts/`, `src/lib/email/` all absent |
| Required source-text checks (per plan acceptance) | All PASS | `env.DRY_RUN === "1"` (4 occurrences), `expirationTtl: DELIVERED_TTL_SECONDS` present, `"send_not_implemented_in_phase_19"` present, type-only `ChatTranscript`/`KVMetadata` import present, value `KEY_PREFIX` import present |
| Line counts | `chat-delivery.ts`: 364 (>= 150 min); `chat-delivery.test.ts`: 964 (>= 350 min) | Both above plan minimums |
| `it()` count in test file | 19 (exact) | Plan-spec'd cap met |
| `describe()` count in test file | 8 (one per Group A-H) | Plan-spec'd structure met |

## TDD RED → GREEN Cycle

| Commit | SHA | Phase | What landed |
|--------|-----|-------|-------------|
| Task 1 RED | `2cc80bd` | test failing | `tests/api/chat-delivery.test.ts` (19 cases against missing module) — `Cannot find module '../../src/lib/chat-delivery'` |
| Task 2 GREEN | `67552fc` | test passing | `src/lib/chat-delivery.ts` (364 LOC implementation) + Rule 3 test-fixture fix + Rule 3 type-annotation fix + deferred-items.md |

Between RED and GREEN, the test file's 19 import-resolution failures inverted to 19 PASSes in a single GREEN commit.

## Deviations from Plan

### Rule 3 inline fixes (auto-resolved blocking issues directly caused by this plan)

**Rule 3 #1 — MockKVNamespace.list() snapshot semantics**

- **Found during:** Task 2 verification — Group F test "multi-page batch drain"
- **Issue:** The test override read `kv.storage.entries()` on each `list()` call. Once `promoteOne` deleted live: keys mid-sweep, subsequent list pages returned shrunken results, breaking `pages_scanned: 3` expectation.
- **Fix:** Captured a snapshot of `live:` keys at sweep start; listOverride paginates over the snapshot, mirroring production KV's point-in-time list() semantics.
- **Files modified:** `tests/api/chat-delivery.test.ts`
- **Commit:** Bundled into `67552fc`

**Rule 3 #2 — Implicit-any on `page` self-reference**

- **Found during:** Task 2 `pnpm exec astro check`
- **Issue:** `src/lib/chat-delivery.ts:321` — `const page = await env.CHAT_KV.list<KVMetadata>({...})` triggered `ts(7022): 'page' implicitly has type 'any'` because TypeScript couldn't resolve the type through `cursor` flow-back (assigned later from `page.cursor`).
- **Fix:** Added explicit `KVNamespaceListResult<KVMetadata>` annotation on the `page` declaration.
- **Files modified:** `src/lib/chat-delivery.ts`
- **Commit:** Bundled into `67552fc`

**Rule 3 #3 — Unused warnSpy/errorSpy declarations (6 ts(6133) hints)**

- **Found during:** Task 2 `pnpm exec astro check`
- **Issue:** Several describe blocks declared `let warnSpy: ReturnType<typeof vi.spyOn>;` (and a few `errorSpy`) without ever referencing the spy variable later — only the spy registration (`vi.spyOn(console, "warn")`) is needed in those blocks. astro check reported 6 ts(6133) implicit-any hints.
- **Fix:** Replaced unused `let warnSpy = vi.spyOn(...)` patterns with bare `vi.spyOn(...)` calls (no variable binding). Variable bindings retained only where the spy is read later (e.g., `expect(warnSpy).not.toHaveBeenCalled()`).
- **Files modified:** `tests/api/chat-delivery.test.ts`
- **Commit:** Bundled into `67552fc`

### Planner's-discretion decisions (D-PA-01..06)

Documented in this SUMMARY's `decisions:` frontmatter:

1. **D-PA-01 — Full-jitter exponential backoff** chosen per OQ-2 recommendation
2. **D-PA-02 — Numeric-string cursor in MockKV** (production opacity not under test)
3. **D-PA-03 — listOverride hook** in MockKV instead of branching the default list()
4. **D-PA-04 — Snapshot semantics for multi-page test** to mirror production KV
5. **D-PA-05 — Step-2 KV read wrapped in try/catch** (in addition to outer try/catch) for kv.get failure isolation
6. **D-PA-06 — Pre-existing worker.ts error deferred** per SCOPE BOUNDARY — Plan 19-03 absorption

## Authentication Gates

None encountered. All work was local file-write + local `pnpm exec vitest` + `pnpm exec astro check`.

## Unblocks

- **Plan 19-03** (replace `scheduled()` stub body with `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch(...))`) — `deliverDue` is exported, type-safe, and unit-tested in isolation. The `DeliveryEnv` interface structurally matches Plan 19-01's `Env { DRY_RUN: string; CHAT_KV: KVNamespace; CHAT_RECIPIENT_EMAIL: string; CHAT_SENDER_EMAIL: string; }`. Plan 19-03 also absorbs the pre-existing `worker.ts:25` ts(2345) error per `deferred-items.md`.
- **Plan 19-04** (flip `triggers.crons` to `["0 * * * *"]`) — the cron handler will dispatch to a unit-tested module; runtime behavior is now provable structurally before the cron is enabled.
- **Phase 20** (Resend integration) — `sendOne`'s `throw new Error("send_not_implemented_in_phase_19")` is the substitution target. Plan 20-XX replaces that branch with the real Resend POST + Idempotency-Key.

## Confirmation Plan 19-03 is Unblocked

`deliverDue` is structurally available at `src/lib/chat-delivery.ts` with the exact signature `deliverDue(env: DeliveryEnv, scheduledTime?: number): Promise<void>` that Plan 19-03's wiring needs. The 19-case unit-test battery locks every CRON-02/03/04 invariant the wiring will rely on. `pnpm exec astro check` returns 0 NEW errors (1 pre-existing carry-forward already logged in deferred-items.md for Plan 19-03's natural absorption). Forward-defense gates D-15 (sse-snapshot) and TEST-03 (anthropic-payload-shape) GREEN.

## Threat Flags

None — Plan 19-02 introduces no new security-relevant surface outside the threat register documented in `19-02-PLAN.md`. The 8 STRIDE entries (T-19-02-01..08) all map to mitigations enforced by the unit tests committed in this plan (DRY_RUN gate locked by Group D; race observability + last-writer-wins by Group E; pagination + batch caps by Group F; per-session isolation by Group G; pure-module discipline by forbidden-import grep at acceptance).

## Self-Check: PASSED

Files verified to exist:
- `src/lib/chat-delivery.ts` (364 LOC) — FOUND
- `tests/api/chat-delivery.test.ts` (964 LOC) — FOUND
- `.planning/phases/19-cron-sweep-scheduling-idempotency-dry-run/deferred-items.md` — FOUND

Commits verified in `git log --oneline -5`:
- `2cc80bd` (test(19-02): RED — add 19 chat-delivery test cases against missing module) — FOUND
- `67552fc` (feat(19-02): GREEN — implement deliverDue two-keyspace + DRY_RUN harness) — FOUND

All claims in this SUMMARY backed by `pnpm exec vitest run tests/api/chat-delivery.test.ts: 19/19 PASS` and `pnpm test: 490 PASS / 0 FAIL / 2 SKIP` output captured at execution time.
