---
phase: 19-cron-sweep-scheduling-idempotency-dry-run
plan: 01
subsystem: worker-config
tags: [scaffolding, env-typing, cloudflare-vars, additive-config, plan-wave-0]
type: execute
wave: 0
status: complete
completed: 2026-05-12
dependency_graph:
  requires:
    - "Phase 17 src/worker.ts custom entrypoint (FOUND-02 lands the file shape Plan 19-01 extends)"
    - "Phase 17 wrangler.jsonc Workers Static Assets shape (FOUND-04 lands the kv_namespaces + triggers blocks Plan 19-01 inserts between)"
    - "Phase 17 D-13 dev:worker script (canonical sibling pattern for new dev:cron script)"
  provides:
    - "DRY_RUN string var declared in wrangler.jsonc vars block (consumed by Plan 19-02 chat-delivery.ts env.DRY_RUN === '1' check)"
    - "Env.DRY_RUN: string field on src/worker.ts ExportedHandler<Env> contract (consumed by Plan 19-02 structural-type compat on DeliveryEnv)"
    - "dev:cron npm script for local cron handler-wiring proof (consumed by Plan 19-04 UAT Step 1 pre-flight)"
  affects:
    - "Plan 19-02 (chat-delivery.ts) type-imports Env shape structurally on DRY_RUN: string — green typecheck baseline established"
    - "Plan 19-03 (scheduled handler body replacement) inherits Env interface extended at this plan"
    - "Plan 19-04 (triggers.crons flip to ['0 * * * *']) builds on the vars block already in place; optional wrangler-cron-shape.test.ts adds DRY_RUN === '1' assertion at that plan"
tech_stack:
  added: []
  patterns:
    - "additive-config: vars block inserted between kv_namespaces and triggers without disturbing existing structure"
    - "ungated env-field-extension: new non-optional Env field added before optional CHAT_RATE_LIMITER to preserve grouping"
    - "wrangler-types-roundtrip: pnpm exec wrangler types regenerates worker-configuration.d.ts; DRY_RUN appears in Cloudflare.Env and surfaces into NodeJS.ProcessEnv via StringifyValues<Pick<..., 'DRY_RUN' | ...>>"
key_files:
  created: []
  modified:
    - "package.json (1-line addition: scripts.dev:cron = 'wrangler dev --test-scheduled')"
    - "wrangler.jsonc (4-line addition: top-level vars block declaring DRY_RUN: '1' between kv_namespaces and triggers; trailing JSONC line comment documents D-01/D-02 lineage)"
    - "src/worker.ts (1-line addition: DRY_RUN: string field in Env interface between CHAT_SENDER_EMAIL and CHAT_RATE_LIMITER; inline trailing comment documents the wrangler.jsonc binding source)"
decisions:
  - "Plan 19-01 stays 100% additive — zero deletions, zero replacements. The scheduled() body's worker.scheduled.stub log + ctx.waitUntil(Promise.resolve()) stay byte-identical per plan spec (Plan 19-03 owns substitution)."
  - "triggers.crons stays [] at this plan (Plan 19-04 flips to ['0 * * * *']). vars.DRY_RUN is BOUND but UNREAD until Plan 19-02 wires chat-delivery.ts."
  - "Wrangler-generated worker-configuration.d.ts surfaces DRY_RUN as Cloudflare.Env.DRY_RUN: '1' (literal) not Cloudflare.Env.DRY_RUN: string — wrangler-types narrows to the literal value declared in wrangler.jsonc. The src/worker.ts Env interface still declares DRY_RUN: string, which is the structural-compat shape Plan 19-02's DeliveryEnv needs."
metrics:
  duration_minutes: 14
  files_modified: 3
  files_created: 0
  tests_added: 0
  net_loc_added: 6
  tests_pass: 471
  tests_fail: 0
  tests_skip: 2
  typecheck_errors: 0
  typecheck_warnings: 0
  typecheck_hints: 0
---

# Phase 19 Plan 01: Wave 0 Pre-flight Scaffolding Summary

Wave 0 pre-flight scaffolding for Phase 19 cron sweep — three additive edits across three files (`package.json`, `wrangler.jsonc`, `src/worker.ts`) land the npm script + Cloudflare vars binding + Env interface field that Plans 19-02/03/04 build on. Zero runtime behavior change at this plan; production deploy would be a no-op (cron disabled, scheduled handler still runs Phase 17 stub, DRY_RUN var bound but unread).

## One-liner

`dev:cron` npm script + `vars.DRY_RUN = "1"` in wrangler.jsonc + `Env.DRY_RUN: string` in src/worker.ts — additive scaffolding only, runtime behavior unchanged.

## What Changed

Three files modified, byte-identical to plan spec.

### Edit 1 — `package.json` (1 line added)

```diff
     "dev": "astro dev",
     "dev:worker": "wrangler dev",
+    "dev:cron": "wrangler dev --test-scheduled",
     "build": "pnpm build:chat-context && wrangler types && astro check && astro build",
```

Matches the Phase 17 D-13 `dev:worker` precedent stylistically. Operator pattern (per 19-PATTERNS.md):

```bash
pnpm dev:cron
# In a separate terminal:
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

### Edit 2 — `wrangler.jsonc` (4 lines added)

```diff
   "kv_namespaces": [ ... ],
+  // Phase 19 D-01/D-02 — DRY_RUN gate. "1" = dry-run active (default); Phase 20 flips to "0" alongside the Resend POST landing.
+  "vars": {
+    "DRY_RUN": "1"
+  },
   "triggers": {
     "crons": []
   },
```

`triggers.crons` stays `[]` (Plan 19-04 flips to `["0 * * * *"]`). The new `vars` block is the only new top-level key.

### Edit 3 — `src/worker.ts` (1 line added)

```diff
   CHAT_SENDER_EMAIL: string;      // Phase 17 D-06 — added during cutover
+  DRY_RUN: string;                // Phase 19 D-01/D-02 — set in wrangler.jsonc vars block; chat-delivery.ts checks env.DRY_RUN === "1"
   // Phase 7 carry-forward (DEBT-01: Free-tier acceptable; Workers Paid v1.4+).
   CHAT_RATE_LIMITER?: RateLimit;
```

Field positioned between non-optional `CHAT_SENDER_EMAIL` and the optional `CHAT_RATE_LIMITER` so non-optional Env fields stay grouped. The `scheduled()` handler body is **untouched** — Plan 19-03 owns the stub-body replacement.

## Verification Results

| Gate | Result | Notes |
|------|--------|-------|
| `pnpm exec astro check` | 0 errors / 0 warnings / 0 hints | Phase 18 baseline preserved (STATE.md Plan 17-08 line 168 — `astro check` first hit 0/0/0 in Plan 17-08 after the listener-dedup typecheck-debt absorption; Plan 19-01 holds the line) |
| `pnpm test` full battery | 471 PASS / 0 FAIL / 2 SKIP (56 test files, 1 skipped) | Above plan baseline of >= 419 (Phase 18 added more tests since Plan 19-01 was authored) |
| `pnpm exec wrangler types` round-trip | DRY_RUN visible in `worker-configuration.d.ts` | line 11: `DRY_RUN: "1";` in `Cloudflare.Env`; line 20: surfaced into `NodeJS.ProcessEnv` via `StringifyValues<Pick<Cloudflare.Env, "DRY_RUN" \| "ANTHROPIC_API_KEY">>` |
| `tests/build/worker-entrypoint.test.ts` | 5 PASS | FOUND-02 source-text test still GREEN after Env extension |
| `tests/build/wrangler-shape.test.ts` | 5 PASS | FOUND-04 source-text test still GREEN after vars block insert |
| `node -e "JSON.parse(...)"` on package.json | Exit 0 | JSON parses cleanly |
| Stub log line preserved | `grep -c 'worker.scheduled.stub' src/worker.ts` = 1 | Plan 19-03 will remove it; preserved byte-identical at this plan |
| Cron disabled | `grep -c '"crons":\s*\[\]' wrangler.jsonc` = 1 | Plan 19-04 will flip to `["0 * * * *"]`; preserved at this plan |
| `vars.DRY_RUN === "1"` declared | `grep -c '"DRY_RUN": "1"' wrangler.jsonc` = 1 | New binding present |
| No file deletions in commit | `git diff --diff-filter=D --name-only HEAD~1 HEAD` empty | Confirms purely additive change (3 files changed, 6 insertions(+), 0 deletions(-)) |

## Wrangler Types Roundtrip Detail

`pnpm exec wrangler types` regenerated `worker-configuration.d.ts` (gitignored build artifact). Key excerpt:

```ts
declare namespace Cloudflare {
    interface Env {
        ASSETS: Fetcher;
        CHAT_KV: KVNamespace;
        DRY_RUN: "1";                 // ← Phase 19 D-01 wires up here
    }
}
interface Env extends Cloudflare.Env {}
declare namespace NodeJS {
    interface ProcessEnv extends StringifyValues<Pick<Cloudflare.Env, "DRY_RUN" | "ANTHROPIC_API_KEY">> {}
}
```

Two observations relevant to Plan 19-02 consumption:

1. **`Cloudflare.Env.DRY_RUN` is typed as literal `"1"`** (wrangler narrows to the declared value), but `src/worker.ts` declares `Env.DRY_RUN: string` (wider). TypeScript's structural compatibility accepts both: the wider `string` declaration is what Plan 19-02's `DeliveryEnv { DRY_RUN: string }` will structurally match against — exactly the foundation Plan 19-01 must lay.

2. **`StringifyValues<Pick<..., "DRY_RUN" | ...>>` surfaces `DRY_RUN` into `NodeJS.ProcessEnv`** as a widened `string`. This is the Cloudflare-native idiom for vars binding flow-through. No additional plumbing needed.

The `pnpm test` battery exercises the regenerated types implicitly via `astro check` — and the 0/0/0 result confirms no implicit-any or assignability regressions slipped in.

## Test Suite Drift

| Metric | Before Plan 19-01 | After Plan 19-01 | Delta |
|--------|-------------------|------------------|-------|
| PASS | 471 (Phase 18 close baseline) | 471 | 0 |
| FAIL | 0 | 0 | 0 |
| SKIP | 2 | 2 | 0 |
| Test files | 56 | 56 | 0 |
| Test files skipped | 1 | 1 | 0 |

No tests added at this plan (per plan spec — 0 new tests). The forward-defense tests (`worker-entrypoint`, `wrangler-shape`) absorbed the additive changes without regression. The Plan-19-01-portion of the FOUND-04 anchor at `wrangler-shape.test.ts:47-52` (currently asserts only `Array.isArray(triggers.crons)`) accepts the new `vars` top-level key trivially — no current assertion forbids extra top-level keys.

## Deviations from Plan

None — plan executed exactly as written.

All three edits were purely additive as specified. No Rule 1 bugs (the new edits introduced zero new behavior to break), no Rule 2 missing functionality (the plan explicitly scoped scaffolding-only — Plans 19-02/03/04 own the actual cron sweep wiring), no Rule 3 blocking issues (test/typecheck infrastructure was clean post-Plan-17-08 listener-dedup absorption), no Rule 4 architectural changes.

The only minor execution-time observation: the initial Edit-tool attempt on `src/worker.ts` used a 3-space gap between `string;` and `// Phase 17 D-06 ...` instead of the actual 6-space gap in the source. Caught immediately by the Edit-tool's exact-match contract; corrected on the next attempt with byte-verified whitespace. This is the kind of tool-correctness signal the Edit tool is designed to surface (per CLAUDE.md / the workflow's emphasis on exact-string matching).

## Authentication Gates

None encountered. All edits are local file-write operations + local pnpm/wrangler invocations.

## Unblocks

- **Plan 19-02** (`src/lib/chat-delivery.ts` + `tests/api/chat-delivery.test.ts`) — type-imports the `Env` shape structurally on `DRY_RUN: string`; the green typecheck baseline established at this plan is the precondition for the `DeliveryEnv { DRY_RUN: string; CHAT_KV: KVNamespace; ... }` structural match.
- **Plan 19-03** (replace `scheduled()` stub body with `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch(...))`) — inherits the extended `Env` interface at this plan; the stub body's `worker.scheduled.stub` log + `ctx.waitUntil(Promise.resolve())` are preserved byte-identical here so Plan 19-03's commit shows a clean stub-to-real-handler diff.
- **Plan 19-04** (flip `triggers.crons` to `["0 * * * *"]` + optional `tests/build/wrangler-cron-shape.test.ts`) — builds on the `vars` block already in place; the optional Pitfall-6 build-test at that plan can assert both `crons === ["0 * * * *"]` AND `vars.DRY_RUN === "1"` in a single test file.

## Confirmation Plan 19-02 is Unblocked

`Env.DRY_RUN: string` is now structurally available on the `src/worker.ts` `Env` interface that Plan 19-02's `DeliveryEnv` will match against. The wrangler-generated `Cloudflare.Env.DRY_RUN: "1"` is structurally compatible with `string`. Build artifacts are clean. No new dependencies, no test breakage, no migration surface.

## Self-Check: PASSED

Files verified to exist:
- `package.json` line containing `"dev:cron": "wrangler dev --test-scheduled"` — FOUND
- `wrangler.jsonc` line containing `"DRY_RUN": "1"` — FOUND
- `src/worker.ts` line containing `DRY_RUN: string;` — FOUND

Commit verified:
- `5233ebe` (feat(19-01): add dev:cron script + DRY_RUN var + Env.DRY_RUN field) — FOUND in `git log --oneline -5`

All claims in this SUMMARY backed by `pnpm exec astro check 0/0/0` + `pnpm test 471/0/2` output captured at execution time.
