---
phase: 18
slug: persistence-identity-kv-write-path-sessionid
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-11
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `18-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.ts` (existing — Phase 17 cadence) |
| **Quick run command** | `pnpm exec vitest run tests/api/chat-transcripts.test.ts tests/api/chat-session-id.test.ts tests/api/anthropic-payload-shape.test.ts tests/api/sse-snapshot.test.ts tests/api/cache-hit-logs.test.ts tests/build/append-turn-call-site.test.ts tests/build/wrangler-shape.test.ts tests/client/chat-sessionid-mint.test.ts` |
| **Full suite command** | `pnpm test` |
| **Typecheck command** | `pnpm exec astro check` (must hold 0/0/0 — Phase 17 baseline) |
| **Estimated runtime** | ~10s quick (warm cache), ~45s full suite, ~15s astro check |

---

## Sampling Rate

- **After every task commit:** Quick run command (chat-surface focused — ~8 files, <10s warm)
- **After every plan wave:** `pnpm test && pnpm exec astro check` (full suite + typecheck — D-26 cadence per Phase 17 D-10 pattern)
- **Before `/gsd-verify-work`:** Full suite green + `astro check` 0/0/0 + sse-snapshot 3/3 GREEN + D-26 chat-surface battery 30/30+ GREEN + manual TEST-03 UAT executed against preview AND production with `cache_read_input_tokens > 0` on responses 2 & 3
- **Max feedback latency:** 10 seconds (quick) / 45 seconds (full)

---

## Per-Task Verification Map

> Plan IDs are placeholder; planner finalizes plan_id → task_id mapping. The Req ID / Test Type / Command columns are locked.

| Req ID | Behavior | Test Type | Automated Command | File Exists |
|--------|----------|-----------|-------------------|-------------|
| KV-01 | `wrangler.jsonc` declares `CHAT_KV` (prod + preview IDs) | build-time source-text | `pnpm exec vitest run tests/build/wrangler-shape.test.ts` | ✅ Phase 17 FOUND-04 — re-verify GREEN |
| KV-02 | `appendTurn` writes `live:{sid}` with `v: 1`, `expirationTtl: 30 * 24 * 3600` on every put | unit (mock KV) | `pnpm exec vitest run tests/api/chat-transcripts.test.ts -t "writes live:"` | ❌ W0 — `tests/api/chat-transcripts.test.ts` |
| KV-02 | Schema versioning — value carries `v: 1` | unit (mock KV) | same file, test "schema v: 1" | ❌ W0 |
| KV-03 | `metadata.last_activity_at` + `metadata.msg_count` written on every put | unit (mock KV) | same file, test "metadata fields populated" | ❌ W0 |
| KV-04 | 30-turn cap drop-oldest sliding window; `truncated=true` one-way | unit (mock KV) | same file, tests "30-turn cap" + "truncated one-way" | ❌ W0 |
| KV-04 | `referrer` truncated to ≤512 chars; `user_agent` truncated to ≤512 chars | unit (mock KV) | same file, tests "referrer truncation" + "UA truncation" | ❌ W0 |
| KV-05 | Per-sessionId quota: 100 writes / rolling 1h rejected with `chat.transcript.quota_exceeded` warn | unit (mock KV) | same file, tests "quota under cap" + "quota over cap rejects + logs" + "window expires resets count" | ❌ W0 |
| IDENT-01 | Client mints sessionId via `crypto.randomUUID()` on bubble click + persists to localStorage v2 | jsdom client test | `pnpm exec vitest run tests/client/chat-sessionid-mint.test.ts` | ❌ W0 |
| IDENT-01 | `STORAGE_VERSION` 1→2 auto-clear path wipes old shape | jsdom client test | same file, test "v1 blob auto-cleared on load" | ❌ W0 |
| IDENT-02 | UUIDv4 valid → 200; UUIDv5 / random string → 400; absent → 200 (D-04 tolerance branch) | API unit (mock fetch / mock SDK) | `pnpm exec vitest run tests/api/chat-session-id.test.ts` | ❌ W0 — `tests/api/chat-session-id.test.ts` |
| IDENT-02 | sessionId NEVER appears in `args.system` or `args.messages[0]`; sessionId-bearing call vs no-sessionId call yields byte-identical system block | source-text + structural | `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` (EXTENDED per D-16) | ✅ Plan 17-05 — extend per D-16 |
| META-01 | First-turn metadata captures `referrer`, `user_agent`, `country`, `region`, `colo`, `message_count`, `truncated`; subsequent turns preserve pinned fields | unit (mock KV + synthetic Request w/ cf stub) | `pnpm exec vitest run tests/api/chat-transcripts.test.ts -t "META-01"` | ❌ W0 (in chat-transcripts.test.ts) |
| META-02 | `appendTurn(assistant, ...)` receives `meta.cache_read_input_tokens` + `meta.cache_creation_input_tokens` from the same `cacheUsage` the log line consumes | API integration (mock Anthropic SSE + mock KV) | `pnpm exec vitest run tests/api/cache-hit-logs.test.ts -t "META-02"` | ✅ Plan 17-05 — extend |
| TEST-01 | D-26 chat regression battery 117/117 GREEN at every chat-surface commit | full suite + chat-surface filter | `pnpm test` (per D-10 cadence) | ✅ Phase 17 baseline (419 PASS / 0 FAIL / 2 SKIP) |
| TEST-01 | `pnpm exec astro check` 0/0/0 at phase end | typecheck | `pnpm exec astro check` | ✅ Phase 17 baseline |
| TEST-03 | Forward-defense source-text test stays GREEN | source-text | `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` | ✅ Plan 17-05 + D-16 extension |
| TEST-03 | 3× identical POST UAT — `cache_read_input_tokens > 0` on responses 2 & 3 (preview, then production) | **manual UAT** (`wrangler tail`) | numbered manual step in `18-UAT.md` | ❌ W-N — `18-UAT.md` (NEW at phase close) |
| TEST-03 | D-15 SSE byte-identical anchor preserved | byte-snapshot | `pnpm exec vitest run tests/api/sse-snapshot.test.ts` | ✅ Plan 17-01 fixture — re-verify GREEN |
| TEST-03 | Source-text forward-defense — `ctx.waitUntil(appendTurn` call sites at right anchors in api/chat.ts | source-text | `pnpm exec vitest run tests/build/append-turn-call-site.test.ts` | ❌ W0 — `tests/build/append-turn-call-site.test.ts` |
| D-09 | `ctx.waitUntil(promise.catch(handler))` pattern enforced — both call sites have explicit `.catch` | source-text | `pnpm exec vitest run tests/build/append-turn-call-site.test.ts -t "explicit .catch"` | ❌ W0 (bundled in same file) |

*Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/api/chat-transcripts.test.ts` — KV-02, KV-03, KV-04, KV-05, META-01 (mock KV; pure module in isolation; ~12–15 tests)
- [ ] `tests/api/chat-session-id.test.ts` — IDENT-02 server-side validation (UUIDv4 accepted, malformed → 400, absent → 200 per D-04); ~5–6 tests
- [ ] `tests/client/chat-sessionid-mint.test.ts` — IDENT-01 client-side mint on bubble click + STORAGE_VERSION 1→2 auto-clear (jsdom + mocked `crypto.randomUUID`); ~5–6 tests
- [ ] `tests/build/append-turn-call-site.test.ts` — source-text forward-defense that `ctx.waitUntil(appendTurn(...).catch(...))` appears at D-10 + D-11 anchors in api/chat.ts; ~4 tests (includes the D-09 `.catch` assertion)
- [ ] EXTEND `tests/api/anthropic-payload-shape.test.ts` per D-16 with sessionId-on-envelope byte-equality assertions (~2–3 new tests)
- [ ] EXTEND `tests/api/cache-hit-logs.test.ts` with META-02 closure asserting `appendTurn(assistant, …, meta)` receives the cacheUsage object (~2–3 new tests)
- [ ] Re-verify `tests/api/sse-snapshot.test.ts` GREEN; if re-baseline is needed (shouldn't be — `ctx.waitUntil` doesn't touch SSE bytes), planner authors the explicit fixture update
- [ ] `18-UAT.md` — NEW at phase close, encodes the manual TEST-03 D-14 3× identical-POST step with `wrangler tail` command + expected log shape

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 3× identical `/api/chat` POSTs within 5min show `cache_read_input_tokens > 0` on responses 2 & 3 | TEST-03 / D-14 / D-15 | Couples CI green to Anthropic regional cache state; per-CI-run Anthropic token cost; D-15 demands real-wire verification | (1) Push to main, wait for Workers Builds preview at `https://{worker}-pr-{build}.jackcutrara.workers.dev`. (2) Open `wrangler tail` filtered to `chat.cache_metrics`. (3) POST identical payload 3× within 5 min. (4) Assert calls 2 & 3 log `cache_read_input_tokens > 0`. (5) Re-run against production after deploy. Cache miss → block phase close, root-cause via `wrangler tail` byte-diff of system block. |
| Workers Logs surface for `chat.transcript.write_failed` / `chat.transcript.quota_exceeded` / `chat.transcript.race_suspected` is parseable | D-09 / D-12 / D-13 | Requires `wrangler tail --format pretty` against live preview after KV outage / quota trip; cannot synthesize in unit test | Operational check — covered by D-26 source-text + unit tests for the call sites; surface verification noted in `18-UAT.md` step 2 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s quick / 45s full
- [ ] `nyquist_compliant: true` set in frontmatter (set during planning when planner ties task IDs to this map)

**Approval:** pending
