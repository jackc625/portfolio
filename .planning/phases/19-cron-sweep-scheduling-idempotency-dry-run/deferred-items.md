# Phase 19 — Deferred Items

Items discovered during Phase 19 plan execution that are OUT OF SCOPE per
the SCOPE BOUNDARY rule (only auto-fix issues DIRECTLY caused by the
current task's changes).

## Plan 19-02 — chat-delivery module + tests

### 2026-05-12: Pre-existing typecheck error in `src/worker.ts:25`

**Symptom (from `pnpm exec astro check`):**

```
src/worker.ts:25:28 - error ts(2345): Argument of type
'import("C:/Users/jackc/Code/portfolio/src/worker").Env' is not assignable
to parameter of type 'Env'.
```

**Origin:** Carried in from Plan 19-01 (commit `5233ebe`) — Plan 19-01
added `DRY_RUN: string` to the `Env` interface in `src/worker.ts`, while
`wrangler types` regenerated `Cloudflare.Env.DRY_RUN: "1"` (literal).
The two `Env` interfaces (`src/worker.ts`'s declared one and the merged
`Env extends Cloudflare.Env { DRY_RUN: "1" }` global one) clash at the
`handle(request, env, ctx)` call site inside `fetch`.

**Why deferred from Plan 19-02:**

- SCOPE BOUNDARY: Plan 19-02 does NOT touch `src/worker.ts`. The error
  pre-exists on `main` at Plan 19-02 baseline.
- Verified pre-existing: with all Plan 19-02 files temporarily moved aside,
  `pnpm exec astro check` still reports the same error from `src/worker.ts:25`.
- Plan 19-01 SUMMARY claimed `pnpm exec astro check` was 0/0/0 — the
  wrangler-types regeneration that produced this conflict likely happened
  after the Plan 19-01 close-out commit, OR the SUMMARY's `astro check`
  was run against a different `worker-configuration.d.ts` state than
  what's currently on disk.

**Closure path:**

- Plan 19-03 (which DOES modify `src/worker.ts` to wire `deliverDue`)
  is the natural absorption point. The fix is likely one of:
  1. Drop `DRY_RUN: string` from `src/worker.ts` Env entirely — let it
     come from `Cloudflare.Env` only (via the `Env extends Cloudflare.Env`
     merge).
  2. Narrow the `src/worker.ts` Env declaration to `DRY_RUN: "1"` (matches
     wrangler-generated literal) — couples the source-of-truth to wrangler.
  3. Use a type assertion at the `handle(request, env, ctx)` call site
     (`handle(request, env as Env, ctx)`) — last resort.
- Plan 19-02 acceptance criteria stated "no new ts errors; structural-type
  compatibility with worker.ts Env holds" — satisfied (Plan 19-02 introduces
  zero new errors; the pre-existing error is not new).

**Status:** ABSORBED by Plan 19-03 (2026-05-12, commit `e87b513`).

Resolution chose **closure path option 2** from the candidate list above:
narrowed `src/worker.ts` Env from `DRY_RUN: string` to `DRY_RUN: "1"`
(matches wrangler-generated literal). Trade-off accepted: source-of-truth
is now coupled to the wrangler-generated type, which is the intended
source of truth (the value lives in `wrangler.jsonc` vars and only ever
equals `"1"` in Phase 19). `DeliveryEnv.DRY_RUN: string` in
`src/lib/chat-delivery.ts` still accepts the `"1"` literal because `"1"`
is a subtype of `string` — no chat-delivery module change required.

Confirmation: `pnpm exec astro check` returns 0 errors / 0 warnings /
0 hints after the Plan 19-03 Task 1 commit. The error is gone from the
diagnostics output.
