---
phase: 19
slug: cron-sweep-scheduling-idempotency-dry-run
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-12
updated: 2026-05-12
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.x (already installed; Phase 17/18 baseline) |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `pnpm exec vitest run tests/api/chat-delivery.test.ts` |
| **Full suite command** | `pnpm exec vitest run` |
| **Estimated runtime** | ~6s quick / ~30s full |

---

## Sampling Rate

- **After every task commit:** Run quick run command for the file under test
- **After every plan wave:** Run `pnpm exec vitest run` (full battery)
- **Before `/gsd-verify-work`:** Full suite GREEN — 419 PASS / 0 FAIL / 2 SKIP baseline must hold or grow
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

> Filled by planner during `/gsd-plan-phase`. The table below enumerates the Phase 19 invariants that every plan must satisfy — each `<automated>` block in PLAN.md tasks must map to one of these rows or extend the table.

| Invariant | Requirement | Test Type | Automated Command | Status |
|-----------|-------------|-----------|-------------------|--------|
| `triggers.crons` is `["0 * * * *"]` exactly | CRON-01 | source-text (build) | `pnpm exec vitest run tests/build/wrangler-cron-shape.test.ts` | ✅ green |
| `src/worker.ts` `scheduled()` calls `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch(...))` | CRON-01 | source-text (build) | `pnpm exec vitest run tests/build/worker-scheduled-call-site.test.ts` | ✅ green |
| `Env` interface declares `DRY_RUN: string` | CRON-01 | typecheck | `pnpm exec astro check` exits 0/0/0 | ✅ green |
| `vars.DRY_RUN: "1"` present in wrangler.jsonc | CRON-01 | source-text (build) | covered by wrangler-cron-shape.test.ts | ✅ green |
| `deliverDue` lists `live:` prefix and filters `last_activity_at < now − 2h` | CRON-02 | unit (mock KV) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "filters by inactivity"` | ✅ green |
| `delivered:{sid}` PUT happens BEFORE the (would-be) send call | CRON-02 | unit (mock KV + spy) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "ordering: PUT delivered before send"` | ✅ green |
| `live:{sid}` DELETE happens AFTER the dry-run success | CRON-02 | unit (mock KV + spy) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "ordering: DELETE live after success"` | ✅ green |
| `delivered:{sid}` value matches `{ v: 1, sid, delivered_at, dry_run: true, msg_count, truncated }` | CRON-02 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "envelope shape"` | ✅ green |
| `delivered:{sid}` PUT uses `expirationTtl: 24 * 3600` | CRON-02 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "24h TTL"` | ✅ green |
| DRY_RUN=1 emits `console.log("chat.delivery.dry_run", { ... })` and does NOT call any send | CRON-02 | unit (console spy) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "dry_run logs envelope"` | ✅ green |
| Second sweep over same KV state results in `sessions_promoted: 0` for already-delivered sids | CRON-02 / CRON-03 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "idempotency cursor skip"` | ✅ green |
| Per-tick batch cap enforced at 50 sessions | CRON-03 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "batch cap 50"` | ✅ green |
| Pagination hard-cap enforced at 50 pages | CRON-03 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "pagination cap 50 pages"` | ✅ green |
| Retry harness: 3-try loop; mock throwing on attempts 1+2+3 surfaces error after 3rd; per-session try/catch isolates the failure from other sessions | CRON-03 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "retry harness 3 attempts"` | ✅ green |
| Per-session try/catch — one bad session does not abort the sweep | CRON-03 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "per-session isolation"` | ✅ green |
| `chat.delivery.tick` summary log emitted with `{ sessions_seen, sessions_due, sessions_promoted, errors, pages_scanned, elapsed_ms }` flat primitives | CRON-04 | unit (console spy) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "tick summary log"` | ✅ green |
| `chat.delivery.skipped_already_delivered` event logged when idempotency cursor hits | CRON-04 | unit (console spy) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "idempotency cursor skip"` (skipped-log assertion co-located, lines 630–636) | ✅ green |
| Phase 18 D-26 chat regression battery PRESERVED at phase close (419 PASS / 0 FAIL / 2 SKIP baseline must hold or grow) | (forward-defense) | full battery | `pnpm exec vitest run` — 498 PASS / 0 FAIL / 2 SKIP at audit | ✅ green |
| `tests/api/sse-snapshot.test.ts` GREEN (D-15 anchor) | (forward-defense) | unit | `pnpm exec vitest run tests/api/sse-snapshot.test.ts` | ✅ green |
| `tests/api/anthropic-payload-shape.test.ts` GREEN (TEST-03 anchor) | (forward-defense) | unit | `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` | ✅ green |
| `pnpm exec astro check` exits 0/0/0 | (forward-defense) | typecheck | `pnpm exec astro check` | ✅ green |
| `pnpm build` clean (wrangler types regen + astro check + astro build) | (forward-defense) | build | `pnpm build` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] No new framework install — vitest already configured per Phase 17/18
- [x] `tests/api/chat-delivery.test.ts` landed alongside `src/lib/chat-delivery.ts` (Plan 19-02) — 19/19 GREEN
- [x] `tests/build/worker-scheduled-call-site.test.ts` (6/6 GREEN, Plan 19-03) and `tests/build/wrangler-cron-shape.test.ts` (2/2 GREEN, Plan 19-04) both landed

*Existing infrastructure covers all phase requirements once the three new test files are added.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `*****` Past-Events verification | CRON-01 (success criterion 1) | Cloudflare dashboard "Past Events" tab is a production-side surface; verification requires `wrangler deploy` which DEPLOY-GATE.md establishes is operator-only | `19-UAT.md` Step 1: operator edits `triggers.crons` to `["* * * * *"]`, `wrangler deploy`, waits 90s, dashboard Past Events tab shows ≥1 invocation, screenshots, reverts to `["0 * * * *"]`, `wrangler deploy` |
| Seed-and-sweep end-to-end against preview KV | CRON-02 (success criterion 2) | Requires `wrangler kv key put live:test-uat-<sid>` against remote KV with stale `last_activity_at`, then `curl /__scheduled` against preview deploy + `wrangler tail` verification | `19-UAT.md` Step 2 |
| Idempotency double-tap | CRON-02 (success criterion 3) | Same as Step 2 — re-invoke and verify `sessions_promoted: 0` for seeded sid | `19-UAT.md` Step 3 |
| Pagination/batch-cap stress | CRON-03 (success criterion 4) | Requires seeding 60 stale keys via bash loop against preview KV; environmental | `19-UAT.md` Step 4 |
| Backlog cleanup | (operational hygiene) | Operator deletes `live:test-uat-*` + `delivered:test-uat-*` keys via `wrangler kv key delete`; verified empty via `wrangler kv key list --prefix test-uat-` | `19-UAT.md` Step 5 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (new test files paired with their modules)
- [x] No watch-mode flags
- [x] Feedback latency < 30s (full suite runs in ~11s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-12 — Nyquist-compliant

---

## Validation Audit 2026-05-12

| Metric | Count |
|--------|-------|
| Total invariants | 22 |
| COVERED | 22 |
| PARTIAL | 0 |
| MISSING | 0 |
| Gaps found | 1 (validation-doc only) |
| Resolved | 1 |
| Escalated | 0 |

**Findings:**

1. **Doc-only fix:** Row "`chat.delivery.skipped_already_delivered` event logged when idempotency cursor hits" pointed at `-t "skipped log"`, a test name that does not exist. The assertion (`findLog(logSpy, "chat.delivery.skipped_already_delivered")` + matchObject on `{ sid, delivered_at_existing }`) lives inside the existing `GROUP E > idempotency cursor skip` test (tests/api/chat-delivery.test.ts:630-636). Repointed the row's filter to `-t "idempotency cursor skip"` with co-location note. No test code changed — the invariant was already verified.

**Live audit measurements:**

- `pnpm exec vitest run tests/api/chat-delivery.test.ts tests/build/wrangler-cron-shape.test.ts tests/build/worker-scheduled-call-site.test.ts tests/api/sse-snapshot.test.ts tests/api/anthropic-payload-shape.test.ts` — 38/38 GREEN
- `pnpm exec vitest run` (full suite) — 498 PASS / 0 FAIL / 2 SKIP (grew from 419-baseline by +79)
- `pnpm exec astro check` — 0 errors / 0 warnings / 0 hints across 109 files
- `pnpm build` — clean (wrangler types regen + astro check + astro build all green)
- All 5 UAT Steps recorded as PASS in `19-UAT.md` (2026-05-12 → 2026-05-13)
- All 4 ROADMAP success criteria checked in UAT Phase Exit Gates

**Verdict:** Phase 19 is Nyquist-compliant. All requirements have automated verification at the source level; production-side behavior is verified by the operator-controlled UAT (Steps 1-5 all PASS).
