---
phase: 17-foundations-migration-dns-debt-sweep
fixed_at: 2026-05-10T21:01:00Z
review_path: .planning/phases/17-foundations-migration-dns-debt-sweep/17-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 17: Code Review Fix Report

**Fixed at:** 2026-05-10T21:01:00Z
**Source review:** `.planning/phases/17-foundations-migration-dns-debt-sweep/17-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope (Critical + Warning): 9
- Fixed: 9
- Skipped: 0

All Critical (1) and Warning (8) findings from 17-REVIEW.md were applied successfully. The 6 Info findings (IN-01..IN-06) are out of scope for this iteration and remain in REVIEW.md for the developer to address as time allows.

## Verification

**Test suite:** `npm test` (vitest run) — 382 passed, 0 new failures.
- Same 2 pre-existing failures present before and after fixes:
  - `tests/content/roadmap-amendment.test.ts` (Phase 13 ROADMAP.md issue, unrelated)
  - `tests/build/no-mdx-in-worker-bundle.test.ts` (requires `pnpm build` first, environment-only)

**Type check:** `npx astro check` — 2 errors, identical to baseline (both pre-existing implicit-any in `tests/client/listener-dedup.test.ts:161,164`). No errors reference any file modified by this iteration.

**Per-finding test suite results:**
- `tests/api/cache-hit-logs.test.ts` — 3/3 passed after CR-01 fix + mock update
- `tests/api/security.test.ts` — 17/17 passed after WR-04 fix (Vitest defaults `import.meta.env.DEV = true`, so localhost asserts still hold)
- `tests/client/scroll-depth.test.ts` — 8/8 passed after WR-06 + WR-07 fixes
- `tests/client/` (all 16 files, 133 tests) — passed after WR-01, WR-02, WR-03, WR-08 fixes
- `tests/build/worker-entrypoint.test.ts` — 5/5 passed after WR-05 fix

## Fixed Issues

### CR-01: `chat.cache_metrics` log line records misleading `output_tokens` from `message_start`

**Files modified:** `src/pages/api/chat.ts`, `tests/api/cache-hit-logs.test.ts`
**Commit:** `34ba297`
**Applied fix:** Capture cache-token fields (`cache_read_input_tokens`, `cache_creation_input_tokens`, `input_tokens`) at `message_start` into a local `cacheUsage` accumulator. Defer the `chat.cache_metrics` log emission until `message_delta` arrives carrying the final `output_tokens` in `event.usage`. Merge both into the log payload. Updated the test fixture mock to emit a proper Anthropic-shaped event sequence: `message_start` carries preamble `output_tokens: 1` (real Anthropic behavior), `message_delta` carries the final `output_tokens` in `usage`. Test assertions unchanged — the merged log payload still matches the expected token counts.

**Verification note (logic change):** This is a structural change to the observability seam. The mock now mirrors real Anthropic event shape and the three existing assertions still pass against the new shape, which is strong evidence the fix matches the spec. However, end-to-end validation against real Anthropic streaming responses (i.e., DEV mode against the production API) is recommended before relying on the new logs for cost dashboards.

### WR-01: `streamChat` AbortController timeout disarmed after fetch handshake

**Files modified:** `src/scripts/chat.ts`
**Commit:** `11dc7bd` (combined with WR-03)
**Applied fix:** Replaced single `const timeout` with `let timeout` + `resetTimeout()` helper. Removed the `clearTimeout(timeout)` immediately after fetch resolved. Call `resetTimeout()` after the handshake AND on every successful `reader.read()` so healthy streams refresh the deadline while stalled streams (no bytes for 30s) trip `controller.abort()` and surface as `"timeout"` to `onError`. Single `clearTimeout(timeout)` lives in `finally` to guarantee cleanup on all exit paths.

### WR-02: Live-stream copy button rewire drops COPY/COPIED transition

**Files modified:** `src/scripts/chat.ts`
**Commit:** `f58325d`
**Applied fix:** Replaced the `cloneNode(true)` + bare `addEventListener` rewire with `oldCopyBtn.replaceWith(createCopyButton(() => botContent))`. This invokes the canonical shared helper (DEBT-04) which attaches the full COPY/COPIED label transition handler. Both live-stream and replay paths now produce byte-identical button behavior.

### WR-03: `onToken` invoked with non-string parsed.text corrupts `botContent`

**Files modified:** `src/scripts/chat.ts`
**Commit:** `11dc7bd` (combined with WR-01)
**Applied fix:** Wrapped the `onToken(parsed.text)` call in a `typeof parsed.text === "string"` type guard. Unexpected frame shapes (`{}`, `{"text": null}`, `{"foo": 1}`) are now silently skipped in production and surfaced via `console.warn("[chat] unexpected SSE frame shape", parsed)` in DEV.

### WR-04: `isAllowedOrigin` allows localhost unconditionally in production

**Files modified:** `src/lib/validation.ts`
**Commit:** `dbdd461`
**Applied fix:** Added `const ALLOW_LOOPBACK = import.meta.env.DEV` module constant. Gated the loopback check (`localhost`, `127.0.0.1`, `[::1]`) on `ALLOW_LOOPBACK`. Vite/Astro tree-shakes the `DEV` branch in production builds so the bypass emits zero bytes in the deployed Worker bundle. Vitest defaults `DEV = true`, so existing `security.test.ts` assertions for localhost / 127.0.0.1 continue to pass. Added IPv6 loopback `[::1]` for consistency (mentioned in the review fix suggestion).

**Production-behavior change note:** This is a tightening of CORS in production. The current test suite cannot exercise the production-build branch (Vitest runs with `DEV = true`). A post-deploy smoke test should confirm that production requests from `localhost` Origin are now rejected with 403 — that is the intended behavior. Local development is unaffected because `astro dev` runs with `DEV = true`.

### WR-05: `scheduled` handler silent no-op stub

**Files modified:** `src/worker.ts`
**Commit:** `67c8ea4`
**Applied fix:** Added `console.warn("worker.scheduled.stub", { note, scheduledTime, cron })` inside the scheduled handler before `ctx.waitUntil(Promise.resolve())`. Accidental cron wiring will now show up in Workers Logs as a structured `worker.scheduled.stub` event. `tests/build/worker-entrypoint.test.ts` continues to pass (the test asserts handler shape, not log behavior, and `ctx.waitUntil` is still called).

### WR-06: `scroll-depth.ts` does not validate percent is finite

**Files modified:** `src/scripts/scroll-depth.ts`
**Commit:** `c7ba985` (combined with WR-07)
**Applied fix:** Added `if (!Number.isFinite(percent)) return;` immediately after `const percent = Number(percentAttr);`. Rejects `"25%"`, `"0.5x"`, `"abc"`, etc. before they reach `umami.track`.

### WR-07: `scroll-depth.ts` slug derivation falls to `"unknown"` for trailing-slash URLs

**Files modified:** `src/scripts/scroll-depth.ts`
**Commit:** `c7ba985` (combined with WR-06)
**Applied fix:** Replaced `pathname.split("/").pop() || "unknown"` with `pathname.split("/").filter(Boolean)` + `segments[segments.length - 1] ?? "unknown"`. Last non-empty segment now wins regardless of trailing-slash configuration.

### WR-08: `DOMPurify.addHook` at module top-level — duplicate hooks on HMR

**Files modified:** `src/scripts/chat.ts`
**Commit:** `d49fb86`
**Applied fix:** Added `DOMPurify.removeHooks("afterSanitizeAttributes")` immediately before `addHook(...)`. DOMPurify v3's `removeHooks(entryPoint)` clears the array for the given entry point (safe no-op when no hook is registered). On HMR / `vi.resetModules()` re-evaluation, the hook registry is reset to exactly one hook every time. Confirmed against `node_modules/dompurify/dist/purify.cjs.d.ts:389` — the API is stable in v3.x. (Note: I considered `removeHook` (no `s`) which only pops the last hook, but `removeHooks` is the idempotent "clear and rebuild" pattern that exactly matches the DEBT-04 remove-then-add invariant the reviewer cited.)

## Skipped Issues

None — all in-scope findings were fixed.

## Out-of-Scope (Info findings, left for developer)

The following Info-tier findings remain in REVIEW.md and were not addressed in this iteration:

- IN-01: structured-log envelope for `chat.cache_metrics` / `chat.truncated`
- IN-02: type-narrow `JSON.parse` result in chat.ts (note: WR-03's `typeof parsed.text === "string"` guard partially addresses this for the `text` field)
- IN-03: move `MAX_BODY_SIZE` constant from `validation.ts` to `api/chat.ts`
- IN-04: document `tests/fixtures/sse-snapshot-frames.bin` content
- IN-05: hoist focusable-elements selector to a module-scoped constant
- IN-06: document `STORAGE_VERSION` migration behavior

---

_Fixed: 2026-05-10T21:01:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
