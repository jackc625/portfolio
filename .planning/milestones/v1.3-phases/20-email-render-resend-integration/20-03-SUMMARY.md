---
phase: 20-email-render-resend-integration
plan: 03
subsystem: email

tags: [email, resend, wiring, sendone-substitution, dry-run-flip, atomic-deploy, d-01, d-03, d-09, d-11, d-17, landmine-7, mail-01..05]

# Dependency graph
requires:
  - plan: 20-01-renderer
    provides: "renderEmail + RenderEnv + ResendPayload — pure renderer consumed in sendOne's live-send branch"
  - plan: 20-02-resend-wrapper
    provides: "sendEmail + ResendEnv + ResendResult — pure REST wrapper consumed after renderEmail; discriminated 3-variant Result translated to thrown errors per RESEARCH § Pattern 3"
  - phase: 19-cron-sweep-scheduling-idempotency-dry-run
    provides: "DeliveryEnv + DeliveredMarker + retryWithBackoff + promoteOne 5-step flow — Plan 20-03 substitutes sendOne body and additively extends DeliveredMarker; everything else byte-identical"
provides:
  - "src/lib/chat-delivery.ts sendOne — Phase 20 live-send branch wired (renderEmail -> sendEmail -> Result translation)"
  - "DeliveredMarker interface — additive resend_message_id field (D-09/D-10 additive-extension lock; schema v: 1 unchanged)"
  - "wrangler.jsonc vars.DRY_RUN === '0' — Phase 20 live-mail toggle (D-01 atomic-deploy commit per RESEARCH § Pattern 3)"
  - "tests/build/chat-delivery-send-site.test.ts — 5 source-text invariants locking sendOne substitution + D-03 rollback runway preservation"
  - "tests/build/wrangler-dry-run-shape.test.ts — 2 source-text invariants locking DRY_RUN='0' phase-close + Pitfall 6 cron-revert defense"
  - "tests/api/chat-delivery.test.ts GROUP I — 6 new wiring tests per D-17 collapsed 3-variant Result + Landmine 7 metadata guard"
affects: [20-04-uat-deploy-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Substitution-via-discriminated-Result-translation pattern (Phase 19 sendOne throw stub -> Phase 20 sendOne renderEmail+sendEmail+Result-translation)"
    - "Single-line wrangler.jsonc value flip with comment-preserved rollback rationale (D-03)"
    - "Env-narrowing guard at substitution entry to close unsafe `as` cast gap (closes the runtime TypeError surface on missing env vars under DRY_RUN='0')"
    - "Source-text forward-defense for rollback runway preservation (tests/build/chat-delivery-send-site.test.ts Invariants D + E lock the DRY_RUN branch as un-deletable)"

key-files:
  created:
    - "tests/build/chat-delivery-send-site.test.ts (62 LOC, 5 invariants)"
    - "tests/build/wrangler-dry-run-shape.test.ts (39 LOC, 2 invariants)"
  modified:
    - "src/lib/chat-delivery.ts (6 distinct edits: import block, DeliveryEnv, DeliveredMarker, sendOne substitution + return-type widen, promoteOne step-3 capture, promoteOne step-4 value-additive; net +60 LOC)"
    - "wrangler.jsonc (1-line value flip + comment rationale update; 3 lines net)"
    - "src/worker.ts (Rule 3 carry-forward: DRY_RUN literal '1' -> '0' to match wrangler-regenerated Cloudflare.Env literal; 1 line + comment rationale)"
    - "tests/build/wrangler-cron-shape.test.ts (1-line assertion update + test-name + header JSDoc; ~10 lines net)"
    - "tests/api/chat-delivery.test.ts (3 surgical updates + 1 new describe block GROUP I with 6 it() rows + 2 vi.mock setups + buildEnv RESEND_API_KEY threading; net +280 LOC)"

key-decisions:
  - "D-03 rollback runway preserved structurally + lexically. The DRY_RUN==='1' branch in sendOne stays byte-identical to Phase 19 EXCEPT for the bare `return;` becoming `return { message_id: 'dry-run-no-id' };` (sentinel for the widened return type). A multi-line comment block above the branch explicitly states ROLLBACK RUNWAY — DO NOT DELETE. tests/build/chat-delivery-send-site.test.ts Invariants D + E lock the branch + the chat.delivery.dry_run log lexically."
  - "Env-narrowing guard at sendOne entry under DRY_RUN === '0' — emits chat.delivery.failed (structured) + throws resend_terminal_env_missing BEFORE the unsafe `as RenderEnv` / `as ResendEnv` cast. Closes the gap where a missing env var at runtime would surface as a raw TypeError instead of a structured failure log. Operationally greppable via `wrangler tail --search 'resend_terminal_env_missing'`."
  - "DeliveryEnv.RESEND_API_KEY is optional in the type — the env-guard handles missing at runtime. Keeps Phase 19 mockEnv shapes byte-compatible (existing tests don't have to add the field) while still emitting a structured failure log when production env is misconfigured."
  - "promoteOne step-4 kv.put options stay { expirationTtl: DELIVERED_TTL_SECONDS } BYTE-IDENTICAL. No metadata field added (Landmine 7 / D-11). The new GROUP I 'delivered marker no metadata' test asserts `Object.keys(options)` is exactly ['expirationTtl'] — adding any metadata key would fail equality + Object.keys checks."
  - "src/worker.ts literal DRY_RUN: '1' -> '0' is a Rule 3 (blocking) carry-forward. The pre-Plan-20-02 source had narrowed the local Env interface to the wrangler-regenerated literal `'1'`. `pnpm build` regenerates the wrangler.jsonc-driven types as `DRY_RUN: '0'` after the flip, and the pre-flip literal `'1'` becomes unassignable at the handle(req, env, ctx) call site (ts(2345)). Fix is part of the atomic commit; the new comment block documents that a future D-03 revert must update both files at the same commit."

patterns-established:
  - "Atomic single-commit substitution + flip pattern — src/lib/chat-delivery.ts substitution + wrangler.jsonc value flip + paired build-test assertion update + paired src/worker.ts literal update all ship in the same commit per D-01. Per-task git commits at the granular level for incremental review + rollback granularity, but the operator-side `git push origin main` ships them as one push event."
  - "Source-text forward-defense for un-deletable code — tests/build/chat-delivery-send-site.test.ts Invariants D + E pattern locks the D-03 rollback runway lexically. A future PR proposing to remove the DRY_RUN==='1' branch as 'unreachable in production' would fail the next CI run."
  - "Sentinel-value-as-discriminator pattern — DeliveredMarker.resend_message_id carries 'dry-run-no-id' under DRY_RUN==='1' (rollback runway) and the real Resend data.id under DRY_RUN==='0' (live mail). Combined with dry_run: boolean (which flips with env.DRY_RUN === '1') the marker self-describes whether it represents a real send or a dry-run envelope log."

requirements-completed: [MAIL-01, MAIL-02, MAIL-03, MAIL-04, MAIL-05]

# Metrics
duration: 18min
completed: 2026-05-13
---

# Phase 20 Plan 03: sendOne Substitution + DRY_RUN Flip Summary

**Wave 2 atomic substitution of `src/lib/chat-delivery.ts` `sendOne` Phase 19 throw stub with renderEmail (Plan 20-01) -> sendEmail (Plan 20-02) -> discriminated-Result-translation flow, paired with the single-line `wrangler.jsonc` `vars.DRY_RUN` flip from `"1"` to `"0"` (D-01 atomic-deploy commit). DeliveredMarker extended additively with `resend_message_id` field (schema v: 1 unchanged per D-09/D-10 lock). DRY_RUN='1' branch preserved byte-identical as the D-03 rollback runway with structural + lexical forward-defense. Two new source-text build tests + 6 new GROUP I wiring tests + 2 pre-existing GROUP D/G tests rewritten + 1 pre-existing GROUP C envelope-shape assertion updated for the additive field.**

## Performance

- **Duration:** ~18 min (Task 1 RED scaffold + Task 2 substitution + flip + worker.ts carry-forward fix + envelope-shape test update + retry/dry_run rewrite)
- **Started:** 2026-05-12T23:48:00Z
- **Completed:** 2026-05-13T00:00:00Z
- **Tasks:** 2 (Wave 0 scaffold + Wave 2 substitution, both atomically committed on `main`)
- **Files modified:** 5 modified, 2 created (zero chat-surface impact per D-15 / D-26)

## Accomplishments

- **sendOne substitution complete** — Phase 19 `throw new Error("send_not_implemented_in_phase_19")` GONE. Live-send branch wires renderEmail (Plan 20-01) -> sendEmail (Plan 20-02) -> Result translation per RESEARCH § Pattern 3.
- **DeliveredMarker schema-versioned additive extension** — `resend_message_id: string` field appended; schema `v: 1` unchanged per D-09/D-10 additive lock. Existing Phase 19 cursor-short-circuit at promoteOne step 1 continues to parse the marker cleanly.
- **promoteOne step-4 populates resend_message_id** — `sendResult.message_id` flows from sendOne return through retryWithBackoff capture to the value-literal. kv.put options stay BYTE-IDENTICAL `{ expirationTtl: DELIVERED_TTL_SECONDS }` (Landmine 7 / D-11 lock preserved; the new GROUP I "delivered marker no metadata" test asserts `Object.keys(options)` is exactly `['expirationTtl']`).
- **wrangler.jsonc DRY_RUN flip** — single-line `"1"` -> `"0"` per D-01 atomic-deploy commit. Inline comment updated with rollback rationale referencing D-03 + Plan 20-03 timestamp.
- **D-03 rollback runway preservation** — DRY_RUN === "1" branch stays in source as the instant-rollback mechanism. Structural defense: explicit ROLLBACK RUNWAY comment block above the branch. Lexical defense: tests/build/chat-delivery-send-site.test.ts Invariants D + E lock the regex + the chat.delivery.dry_run envelope log at build time.
- **Env-narrowing guard at sendOne entry** — closes the unsafe `as RenderEnv` / `as ResendEnv` cast gap. Under DRY_RUN === "0", missing RESEND_API_KEY / CHAT_RECIPIENT_EMAIL / CHAT_SENDER_EMAIL / CHAT_REPLY_TO_EMAIL surfaces as a structured `chat.delivery.failed` log with `error_class: "resend_terminal_env_missing"` and a thrown Error that promoteOne's existing catch translates into the standard failure path. No raw TypeError leaks.
- **6 new GROUP I wiring tests** in tests/api/chat-delivery.test.ts per D-17 collapsed 3-variant Result: dry_run preserves runway, live calls sendEmail, delivered marker resend_message_id, failed_transient retries, failed_terminal logs and skips, delivered marker no metadata (Landmine 7).
- **2 pre-existing tests rewritten** — GROUP D "dry_run gate" (now asserts sendEmail call under DRY_RUN='0') and GROUP G "retry harness 3 attempts" (now mocks sendEmail to return failed_transient on every call). Pre-Phase-19 throw-stub coverage replaced by Plan 20-03 substitution-call coverage at the same test names.
- **2 new build-time source-text guards** — tests/build/chat-delivery-send-site.test.ts (5 invariants) + tests/build/wrangler-dry-run-shape.test.ts (2 invariants).
- **D-26 chat regression battery preserved** — Phase 20 touched ZERO chat-surface files (chat.ts / api/chat.ts / validation.ts / ChatWidget.astro / global.css). The cross-phase D-15 SSE byte-identical anchor + TEST-03 Anthropic prompt-cache shape anchor stay GREEN.

## Task Commits

Each task committed atomically on `main` (no worktrees per `workflow.use_worktrees: false`):

1. **Task 1: Wave 0 RED scaffold** — `e8daef0` (test): GROUP I 6-test extension + 2 new build-test files. Astro check 0/0/0; 8 expected REDs in build + GROUP I tests pending substitution.
2. **Task 2: Substitute sendOne + flip wrangler.jsonc + paired updates** — `8bba4ef` (feat): 6 src/lib/chat-delivery.ts edits + wrangler.jsonc 1-line flip + src/worker.ts literal carry-forward + tests/build/wrangler-cron-shape.test.ts assertion update + tests/api/chat-delivery.test.ts surgical edits.

**Plan metadata commit:** (this commit — docs: complete 20-03 plan)

## Files Created/Modified

### Created

- **`tests/build/chat-delivery-send-site.test.ts`** (62 LOC) — Plan 18-07 source-text guard pattern mirrored. 5 invariants:
  - A: sendOne imports sendEmail from ./email/resend
  - B: sendOne imports renderEmail from ./email/render
  - C: Phase 19 throw stub `send_not_implemented_in_phase_19` is GONE
  - D (D-03 rollback runway): `if (env.DRY_RUN === "1")` branch STILL PRESENT
  - E (D-03 rollback runway): `chat.delivery.dry_run` envelope log STILL PRESENT
- **`tests/build/wrangler-dry-run-shape.test.ts`** (39 LOC) — Plan 19-04 wrangler-cron-shape pattern mirrored. 2 invariants:
  - D-01 / D-17: `cfg.vars.DRY_RUN === "0"` (Phase 20 live-mail toggle)
  - Pitfall 6: `cfg.triggers.crons === ["0 * * * *"]` (operator-revert forward defense for the UAT temporary `* * * * *` cron flip)

### Modified

- **`src/lib/chat-delivery.ts`** — 6 distinct edits per the plan's Edit 1-6 spec:
  1. IMPORT additions — `import { renderEmail, type RenderEnv } from "./email/render"` and `import { sendEmail, type ResendEnv } from "./email/resend"`. File-banner "NO imports from" block updated to remove the Phase 19 `src/lib/email/` constraint line.
  2. DeliveryEnv interface — added `RESEND_API_KEY?: string` (optional; runtime narrowing at sendOne entry per Edit 4).
  3. DeliveredMarker interface — APPENDED `resend_message_id: string` field; JSDoc updated to reflect "Phase 20 ADDED ... per D-09 additive lock + 20-03 close" and the dry-run-no-id sentinel rationale.
  4. sendOne substitution — return type widened to `Promise<{ message_id: string }>`. DRY_RUN === "1" branch preserved byte-identical (NAMES + ORDER per D-05) except sentinel return; multi-line ROLLBACK RUNWAY comment block prepended explaining the D-03 mechanism. DRY_RUN !== "1" branch implements renderEmail -> sendEmail -> Result-translation per RESEARCH § Pattern 3 with explicit env-narrowing guard above the `as` casts.
  5. promoteOne step-3 capture — `await retryWithBackoff(...)` -> `const sendResult = await retryWithBackoff(...)`.
  6. promoteOne step-4 additive — value-literal extended with `resend_message_id: sendResult.message_id`. kv.put OPTIONS stay BYTE-IDENTICAL `{ expirationTtl: DELIVERED_TTL_SECONDS }` (NO metadata field per Landmine 7 / D-11).
- **`wrangler.jsonc`** — single-line value flip: `"DRY_RUN": "1"` -> `"DRY_RUN": "0"`. Inline comment block updated with Plan 20-03 timestamp + D-03 rollback rationale. NO other keys touched (kv_namespaces, assets, triggers.crons, observability all UNCHANGED).
- **`src/worker.ts`** — Rule 3 (blocking) carry-forward: the local `Env` interface literal `DRY_RUN: "1"` updated to `DRY_RUN: "0"` to match the wrangler-regenerated `Cloudflare.Env` literal after the wrangler.jsonc flip. Inline comment block rewritten to document the bidirectional lock — a future D-03 revert MUST update both files at the same commit to preserve type assignability. Without this fix `pnpm build` fails ts(2345) at the `handle(request, env, ctx)` call site.
- **`tests/build/wrangler-cron-shape.test.ts`** — single-line assertion update: `.toBe("1")` -> `.toBe("0")`. Test name updated to "vars.DRY_RUN === '0' (Phase 20 live-mail toggle per D-01)". File-header JSDoc updated with Plan 20-03 (2026-05-12) invariant flip rationale.
- **`tests/api/chat-delivery.test.ts`** — 3 surgical updates + 1 new describe block (GROUP I):
  1. Two `vi.mock` setups at file top (hoisted) — mock `../../src/lib/email/resend` (sendEmail spy) and `../../src/lib/email/render` (renderEmail returning a fixed ResendPayload).
  2. GROUP C "envelope shape" test — `Object.keys` assertion extended to include `resend_message_id`; new field asserted as `"dry-run-no-id"` sentinel under DRY_RUN='1'.
  3. GROUP D "dry_run gate" test — REWRITTEN: under DRY_RUN='0' with sendEmail mocked to return `sent`, deliverDue succeeds; assert sendEmail called + tick log reports promoted: 1 + no chat.delivery.failed emitted.
  4. GROUP E "idempotency cursor skip" fixture — pre-seeded DeliveredMarker extended with the additive `resend_message_id: "dry-run-no-id"` field (TypeScript `satisfies` constraint).
  5. GROUP G "retry harness 3 attempts" test — REWRITTEN: mock sendEmail to return failed_transient on every call; assert MAX_SEND_ATTEMPTS-count sendEmail calls before chat.delivery.failed emission.
  6. buildEnv helper extended with `RESEND_API_KEY` default ("test-resend-api-key") so the env-narrowing guard passes by default in every test.
  7. NEW GROUP I describe block with 6 it() rows per 20-VALIDATION.md rows 90-94 + 98.

## Decisions Made

All decisions enumerated in frontmatter `key-decisions:` field above. Most consequential:

1. **D-03 rollback runway is preserved structurally (comment block) + lexically (build-test invariants)**. A future cleanup PR proposing to remove the DRY_RUN === "1" branch as "dead code unreachable in production" fails Invariants D + E of tests/build/chat-delivery-send-site.test.ts at build time. The instant-rollback mechanism (single-line wrangler.jsonc revert from "0" to "1" + wrangler deploy ~60s) survives.
2. **Env-narrowing guard closes the unsafe `as` cast gap**. The plan's Edit 4 spec called for an explicit guard above the renderEmail / sendEmail calls. Implemented as a structured `console.warn("chat.delivery.failed", {...})` + `throw new Error("resend_terminal_env_missing")` so missing env vars surface as the same operational failure-log surface as other terminal failures, not as a raw TypeError.
3. **src/worker.ts literal carry-forward is a Rule 3 blocker, not a deviation**. The pre-Phase-20 narrowing was a Phase 19 absorption (Plan 19-03 deferred-items.md closure path option 2); `pnpm build` regenerates the Cloudflare.Env type from wrangler.jsonc on every build, so the local literal must mirror the current wrangler-generated literal. The atomic-deploy commit ships both at once per D-01.
4. **buildEnv defaults RESEND_API_KEY to "test-resend-api-key"** — keeps every pre-existing Phase 19 test passing without manual threading. Tests that want to assert env-missing behavior would set `RESEND_API_KEY: undefined` explicitly (no such test in Plan 20-03; deferred to Plan 20-04 UAT or future hardening).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] src/worker.ts DRY_RUN literal carry-forward required for pnpm build**
- **Found during:** Task 2 (pnpm build run post-substitution)
- **Issue:** The Phase 19 carry-forward absorption narrowed `src/worker.ts` Env interface literal `DRY_RUN: "1"` to mirror the wrangler-regenerated Cloudflare.Env literal. After flipping wrangler.jsonc to `"DRY_RUN": "0"`, `pnpm build`'s wrangler-types regen produced `DRY_RUN: "0"` in Cloudflare.Env, and the pre-flip literal `"1"` became unassignable at the `handle(request, env, ctx)` call site (ts(2345) at worker.ts:55).
- **Fix:** Updated the local Env literal `DRY_RUN: "1"` to `DRY_RUN: "0"` in src/worker.ts; rewrote the surrounding inline comment block to document the bidirectional lock — a future D-03 revert MUST update both wrangler.jsonc AND src/worker.ts at the same commit to preserve type assignability.
- **Files modified:** `src/worker.ts`
- **Verification:** `pnpm build` exits 0 cleanly.
- **Committed in:** `8bba4ef` (Task 2 atomic commit)

**2. [Rule 1 - Bug] GROUP C envelope-shape test had hardcoded 6-key set; new additive field breaks the equality**
- **Found during:** Task 2 (pnpm exec vitest run tests/api/chat-delivery.test.ts after the DeliveredMarker extension)
- **Issue:** The pre-existing GROUP C "envelope shape" test asserted `Object.keys(value).sort()` equals a specific 6-element set. Plan 20-03 adds `resend_message_id` as the 7th additive key (D-09 lock), causing the equality assertion to fail with "received 7-element vs expected 6-element".
- **Fix:** Extended the expected key set to 7 elements including `resend_message_id`. Also added an explicit assertion that `value.resend_message_id === "dry-run-no-id"` under DRY_RUN='1' — verifies the sentinel value flows correctly at the value level (not just at the interface level).
- **Files modified:** `tests/api/chat-delivery.test.ts`
- **Verification:** `pnpm exec vitest run tests/api/chat-delivery.test.ts` → 25/25 GREEN.
- **Committed in:** `8bba4ef` (Task 2 atomic commit)

**3. [Rule 1 - Bug] GROUP E pre-seeded DeliveredMarker fixture didn't include the new additive field**
- **Found during:** Task 2 (astro check post-DeliveredMarker extension)
- **Issue:** The pre-existing GROUP E "idempotency cursor skip" test pre-seeds a DeliveredMarker fixture with `satisfies DeliveredMarker`. After extending the interface with `resend_message_id: string`, TypeScript correctly rejected the fixture for missing the required field.
- **Fix:** Added `resend_message_id: "dry-run-no-id"` to the fixture; matches the sentinel value pattern for a dry-run-era marker. The test logic is unaffected — the cursor-skip behavior only reads `delivered_at` from the existing marker, not `resend_message_id`.
- **Files modified:** `tests/api/chat-delivery.test.ts`
- **Verification:** `pnpm exec astro check` → 0/0/0.
- **Committed in:** `8bba4ef` (Task 2 atomic commit)

**4. [Rule 1 - Bug] buildEnv helper didn't accept RESEND_API_KEY; new env-narrowing guard caused 4 GROUP I tests + the GROUP D rewrite to fail with "sendEmail called 0 times"**
- **Found during:** Task 2 (post-substitution vitest run; 6 failures observed)
- **Issue:** Plan 20-03 added an env-narrowing guard at sendOne entry under DRY_RUN === "0" that throws `resend_terminal_env_missing` if any of RESEND_API_KEY / CHAT_RECIPIENT_EMAIL / CHAT_SENDER_EMAIL / CHAT_REPLY_TO_EMAIL is undefined. Pre-existing buildEnv didn't accept RESEND_API_KEY; tests that set DRY_RUN='0' tripped the guard before ever calling sendEmail (the mocked spy reported 0 calls).
- **Fix:** Extended buildEnv to accept `RESEND_API_KEY?: string` with a default `"test-resend-api-key"`. Now every test under DRY_RUN='0' has a valid env shape and can exercise the substitution path. Tests that want to assert the env-missing path can set the field to undefined explicitly (none do in Plan 20-03; deferred to Plan 20-04 UAT).
- **Files modified:** `tests/api/chat-delivery.test.ts`
- **Verification:** `pnpm exec vitest run tests/api/chat-delivery.test.ts` → 25/25 GREEN (was 19 PASS / 6 FAIL).
- **Committed in:** `8bba4ef` (Task 2 atomic commit)

### Naming Deviation (informational, non-bug)

**Group letter "GROUP I" instead of plan-specified "GROUP F"**
- **Found during:** Task 1 RED scaffold (reading existing test file)
- **Issue:** The plan's `<action>` block called the new describe block "GROUP F — Phase 20 sendOne substitution wiring". The existing chat-delivery.test.ts file already uses GROUP A through H (GROUP F is "CRON-03 batch cap + pagination"). Re-using "GROUP F" would conflict.
- **Resolution:** Renamed to "GROUP I" (the next free letter after the existing GROUP H observability block). The letter is presentational; what matters is the 6 named wiring cases per 20-VALIDATION.md rows 90-94 + 98 all exist and are GREEN. Documented in the test file's GROUP I header comment block.
- **Files modified:** `tests/api/chat-delivery.test.ts` (new describe block uses "GROUP I" everywhere; no functional impact).

---

**Total deviations:** 4 auto-fixed (1 Rule 3 blocker + 3 Rule 1 test-fixture corrections) + 1 informational naming deviation. All caught during the GREEN sweep; zero changes to the substitution semantics or D-decision compliance. The plan's substitution-shape spec held byte-for-byte.

## Issues Encountered

- **buildEnv was the load-bearing test-side gap** — 4 of the 6 GROUP I tests + the 2 rewritten tests all failed initially with "sendEmail called 0 times" because the env-narrowing guard short-circuited before reaching the renderEmail/sendEmail call. Adding RESEND_API_KEY to buildEnv's default object fixed all 6 at once. The lesson: when introducing a runtime env-check at a previously-unguarded substitution site, the test-fixture builder is the place to absorb the new env-field default — not the per-test `as` cast (the latter only suppresses TypeScript noise; it doesn't actually inject the field).
- **wrangler types regen feedback loop** — `pnpm build` runs `wrangler types` before `astro check`, regenerating Cloudflare.Env from wrangler.jsonc on every build. The `astro check` standalone (without the build step) reads the previously-generated `worker-configuration.d.ts`, so the post-substitution astro check passed cleanly even before I noticed the worker.ts literal mismatch. Only the full `pnpm build` surfaced the ts(2345). For future Wrangler-typed-literal flips: always run `pnpm build` (not just astro check) as part of the verification gate.

## User Setup Required

None — no external service configuration. `RESEND_API_KEY` was already set as a Wrangler secret during Plan 17-06. Phase 20 only adds the consuming code path. The next operator step is Plan 20-04's UAT + DEPLOY-GATE.md.

## Cross-Phase Anchors (Forward Defense)

- **D-15 SSE byte-identical anchor:** `tests/api/sse-snapshot.test.ts` 3/3 GREEN — Phase 20 Plan 20-03 touched zero chat-surface files (chat.ts / api/chat.ts / validation.ts / ChatWidget.astro / global.css all UNTOUCHED).
- **TEST-03 Anthropic prompt-cache integrity:** `tests/api/anthropic-payload-shape.test.ts` 8/8 GREEN.
- **D-26 chat regression battery:** Full suite went 547 PASS / 2 SKIP → 560 PASS / 2 SKIP (net +13 GREEN: 6 GROUP I + 5 chat-delivery-send-site + 2 wrangler-dry-run-shape). D-26 anchor preserved byte-identically by exclusion.
- **Zero new runtime dep (MAIL-01 phase-wide lock):** `git diff --stat package.json` between pre-plan and post-plan shows empty output — `dependencies` byte-identical. REST via global fetch (Plan 20-02) continues to be the wire — no SDK pulled in.
- **astro check 0/0/0:** confirmed post-Task 1 (with scaffolding) and post-Task 2 (with full substitution + flip + worker.ts carry-forward).
- **pnpm build clean:** wrangler types regen + astro check + astro build all OK.
- **Phase 19 5-step promoteOne flow preserved:** ordering invariants (PUT delivered: BEFORE delete live:) GREEN via pre-existing GROUP B tests; per-session try/catch isolation GREEN via pre-existing GROUP G "per-session isolation" test; idempotency cursor short-circuit (Layer 1) GREEN via pre-existing GROUP E "idempotency cursor skip" test; the cursor short-circuit happens BEFORE sendOne is ever called, so D-17's "Layer 1 is the sole application-side replay detector" decision continues to hold.

## Test Suite Drift

| State | PASS | FAIL | SKIP | Notes |
|-------|------|------|------|-------|
| Pre-Plan-20-03 baseline | 547 | 0 | 2 | Plan 20-02 close (498 Phase 19 + 36 Plan 20-01 + 13 Plan 20-02) |
| Post-Task 1 (Wave 0 RED scaffold) | 552 | 8 | 2 | 8 expected REDs: 4 GROUP I + 3 chat-delivery-send-site invariants A/B/C + 1 wrangler-dry-run-shape D-01 |
| Post-Task 2 (substitution + flip + paired updates, full suite) | 560 | 0 | 2 | +13 GREEN net (6 GROUP I + 5 chat-delivery-send-site + 2 wrangler-dry-run-shape); the 8 previously RED tests now GREEN |

## Acceptance Grep Verification (Plan Task 2 line 281-294)

| Grep target | File | Expected | Actual | Result |
|-------------|------|----------|--------|--------|
| `send_not_implemented_in_phase_19` | src/lib/chat-delivery.ts | 0 | 0 | ✅ Phase 19 throw stub GONE |
| `import { sendEmail` | src/lib/chat-delivery.ts | ≥ 1 | 1 | ✅ Plan 20-02 import wired |
| `import { renderEmail` | src/lib/chat-delivery.ts | ≥ 1 | 1 | ✅ Plan 20-01 import wired |
| `chat.delivery.dry_run` | src/lib/chat-delivery.ts | ≥ 1 | 3 | ✅ Rollback runway log preserved |
| `ROLLBACK RUNWAY` | src/lib/chat-delivery.ts | ≥ 1 | 1 | ✅ D-03 comment block in place |
| `resend_terminal_env_missing` | src/lib/chat-delivery.ts | ≥ 2 | 2 | ✅ Env-narrowing guard (throw + structured-log error_class) |
| `resend_message_id` | src/lib/chat-delivery.ts | ≥ 2 | 7 | ✅ DeliveredMarker field + step-4 PUT site value-literal + JSDoc + banner |
| `"DRY_RUN": "0"` | wrangler.jsonc | = 1 | 1 | ✅ Phase 20 live-mail toggle |
| `"DRY_RUN": "1"` | wrangler.jsonc | = 0 | 0 | ✅ Flip complete |

All grep gates pass at Plan 20-03 close.

## Next Phase Readiness

**Plan 20-04 (UAT + DEPLOY-GATE.md) is unblocked.** It can immediately:

- Author `.planning/phases/20-email-render-resend-integration/20-UAT.md` per D-02's 6-step operator UAT spec (seed live:test-uat-* with stale last_activity_at → flip cron to `* * * * *` → verify Gmail Inbox + delivered marker.resend_message_id + Workers Logs chat.delivery.sent → revert cron → cleanup → wait for organic real-traffic).
- Author `.planning/phases/20-email-render-resend-integration/DEPLOY-GATE.md` per D-04 (Plan 17-08 posture mirrored — status=pending, 6-step UAT checklist, operator-confirmation slot, executor MUST NOT push).
- The substitution + flip + flip-acknowledgment-tests are all live in the repo's main branch (commits e8daef0 + 8bba4ef + this doc commit). The deploy gate is the operator-side push decision; everything code-side is complete.

**Rollback runway is preserved structurally:**
- Source comment: ROLLBACK RUNWAY block in src/lib/chat-delivery.ts sendOne (multi-line, explicit, cites D-03 + 60s recovery + sentinel-value flow).
- Lexical defense: tests/build/chat-delivery-send-site.test.ts Invariants D + E (both regex-locked + log-string-locked).
- Single-line revert mechanism: `wrangler.jsonc vars.DRY_RUN: "0"` → `"1"` + `wrangler deploy`. The local Env literal in src/worker.ts must also revert to `"1"` at the same commit (documented in the new inline comment block); both are 1-line changes.

**No blockers or concerns.** Plan 20-03 ships clean: atomic substitution + flip + carry-forward type fix in one Task 2 commit, full test battery 560/562 GREEN, package.json byte-identical, all cross-phase anchors preserved, D-03 rollback runway lexically locked.

---
*Phase: 20-email-render-resend-integration*
*Completed: 2026-05-13*

## Self-Check: PASSED

- FOUND: src/lib/chat-delivery.ts (Phase 20 substitution wired)
- FOUND: wrangler.jsonc (DRY_RUN === "0")
- FOUND: src/worker.ts (Env literal carry-forward DRY_RUN: "0")
- FOUND: tests/build/chat-delivery-send-site.test.ts (62 LOC, 5 invariants)
- FOUND: tests/build/wrangler-dry-run-shape.test.ts (39 LOC, 2 invariants)
- FOUND: tests/build/wrangler-cron-shape.test.ts (DRY_RUN assertion updated to "0")
- FOUND: tests/api/chat-delivery.test.ts (GROUP I 6 new + GROUP D/G rewrites + GROUP C/E fixture updates + vi.mock setups)
- FOUND: .planning/phases/20-email-render-resend-integration/20-03-SUMMARY.md
- FOUND: commit e8daef0 (Task 1 — test scaffold)
- FOUND: commit 8bba4ef (Task 2 — feat substitution + flip)
