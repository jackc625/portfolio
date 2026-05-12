---
phase: 19
slug: cron-sweep-scheduling-idempotency-dry-run
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
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
| `triggers.crons` is `["0 * * * *"]` exactly | CRON-01 | source-text (build) | `pnpm exec vitest run tests/build/wrangler-cron-shape.test.ts` | ⬜ pending |
| `src/worker.ts` `scheduled()` calls `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch(...))` | CRON-01 | source-text (build) | `pnpm exec vitest run tests/build/worker-scheduled-call-site.test.ts` | ⬜ pending |
| `Env` interface declares `DRY_RUN: string` | CRON-01 | typecheck | `pnpm exec astro check` exits 0/0/0 | ⬜ pending |
| `vars.DRY_RUN: "1"` present in wrangler.jsonc | CRON-01 | source-text (build) | covered by wrangler-cron-shape.test.ts | ⬜ pending |
| `deliverDue` lists `live:` prefix and filters `last_activity_at < now − 2h` | CRON-02 | unit (mock KV) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "filters by inactivity"` | ⬜ pending |
| `delivered:{sid}` PUT happens BEFORE the (would-be) send call | CRON-02 | unit (mock KV + spy) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "ordering: PUT delivered before send"` | ⬜ pending |
| `live:{sid}` DELETE happens AFTER the dry-run success | CRON-02 | unit (mock KV + spy) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "ordering: DELETE live after success"` | ⬜ pending |
| `delivered:{sid}` value matches `{ v: 1, sid, delivered_at, dry_run: true, msg_count, truncated }` | CRON-02 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "envelope shape"` | ⬜ pending |
| `delivered:{sid}` PUT uses `expirationTtl: 24 * 3600` | CRON-02 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "24h TTL"` | ⬜ pending |
| DRY_RUN=1 emits `console.log("chat.delivery.dry_run", { ... })` and does NOT call any send | CRON-02 | unit (console spy) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "dry_run logs envelope"` | ⬜ pending |
| Second sweep over same KV state results in `sessions_promoted: 0` for already-delivered sids | CRON-02 / CRON-03 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "idempotency cursor skip"` | ⬜ pending |
| Per-tick batch cap enforced at 50 sessions | CRON-03 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "batch cap 50"` | ⬜ pending |
| Pagination hard-cap enforced at 50 pages | CRON-03 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "pagination cap 50 pages"` | ⬜ pending |
| Retry harness: 3-try loop; mock throwing on attempts 1+2+3 surfaces error after 3rd; per-session try/catch isolates the failure from other sessions | CRON-03 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "retry harness 3 attempts"` | ⬜ pending |
| Per-session try/catch — one bad session does not abort the sweep | CRON-03 | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "per-session isolation"` | ⬜ pending |
| `chat.delivery.tick` summary log emitted with `{ sessions_seen, sessions_due, sessions_promoted, errors, pages_scanned, elapsed_ms }` flat primitives | CRON-04 | unit (console spy) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "tick summary log"` | ⬜ pending |
| `chat.delivery.skipped_already_delivered` event logged when idempotency cursor hits | CRON-04 | unit (console spy) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "skipped log"` | ⬜ pending |
| Phase 18 D-26 chat regression battery PRESERVED at phase close (419 PASS / 0 FAIL / 2 SKIP baseline must hold or grow) | (forward-defense) | full battery | `pnpm exec vitest run` | ⬜ pending |
| `tests/api/sse-snapshot.test.ts` GREEN (D-15 anchor) | (forward-defense) | unit | `pnpm exec vitest run tests/api/sse-snapshot.test.ts` | ⬜ pending |
| `tests/api/anthropic-payload-shape.test.ts` GREEN (TEST-03 anchor) | (forward-defense) | unit | `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` | ⬜ pending |
| `pnpm exec astro check` exits 0/0/0 | (forward-defense) | typecheck | `pnpm exec astro check` | ⬜ pending |
| `pnpm build` clean (wrangler types regen + astro check + astro build) | (forward-defense) | build | `pnpm build` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No new framework install — vitest already configured per Phase 17/18
- [ ] `tests/api/chat-delivery.test.ts` does NOT exist yet — planner must include creation in the same plan that adds `src/lib/chat-delivery.ts` (TDD pairing)
- [ ] `tests/build/worker-scheduled-call-site.test.ts` and `tests/build/wrangler-cron-shape.test.ts` are OPTIONAL per CONTEXT.md Claude's Discretion but RECOMMENDED — planner should include them unless explicitly skipping

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (new test files paired with their modules)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
