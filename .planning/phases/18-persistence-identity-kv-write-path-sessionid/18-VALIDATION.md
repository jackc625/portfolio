---
phase: 18
slug: persistence-identity-kv-write-path-sessionid
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-11
audited: 2026-05-11
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
| KV-01 | `wrangler.jsonc` declares `CHAT_KV` (prod + preview IDs) | build-time source-text | `pnpm exec vitest run tests/build/wrangler-shape.test.ts` | ✅ GREEN (6/6 — Phase 17 FOUND-04 carried, re-verified) |
| KV-02 | `appendTurn` writes `live:{sid}` with `v: 1`, `expirationTtl: 30 * 24 * 3600` on every put | unit (mock KV) | `pnpm exec vitest run tests/api/chat-transcripts.test.ts -t "writes live:"` | ✅ GREEN (KV-02 describe — 2/2; Plan 18-02) |
| KV-02 | Schema versioning — value carries `v: 1` | unit (mock KV) | same file, test "schema v: 1" | ✅ GREEN (covered by KV-02 describe block) |
| KV-03 | `metadata.last_activity_at` + `metadata.msg_count` written on every put | unit (mock KV) | same file, test "metadata fields populated" | ✅ GREEN (KV-03 describe — 2/2; Plan 18-02) |
| KV-04 | 30-turn cap drop-oldest sliding window; `truncated=true` one-way | unit (mock KV) | same file, tests "30-turn cap" + "truncated one-way" | ✅ GREEN (KV-04 describe — 3/3 incl D-07 off-by-one; Plan 18-02) |
| KV-04 | `referrer` truncated to ≤512 chars; `user_agent` truncated to ≤512 chars | unit (mock KV) | same file, tests "referrer truncation" + "UA truncation" | ✅ GREEN (KV-04 truncation describe — 2/2; Plan 18-02) |
| KV-05 | Per-sessionId quota: 100 writes / rolling 1h rejected with `chat.transcript.quota_exceeded` warn | unit (mock KV) | same file, tests "quota under cap" + "quota over cap rejects + logs" + "window expires resets count" | ✅ GREEN (KV-05 describe — 3/3; Plan 18-02) |
| IDENT-01 | Client mints sessionId via `crypto.randomUUID()` on bubble click + persists to localStorage v2 | jsdom client test | `pnpm exec vitest run tests/client/chat-sessionid-mint.test.ts` | ✅ GREEN (8/8 — 4 source-text + 4 behavioral; Plan 18-06; +WR-03a/b review-fix tests) |
| IDENT-01 | `STORAGE_VERSION` 1→2 auto-clear path wipes old shape | jsdom client test | same file, test "v1 blob auto-cleared on load" | ✅ GREEN (Test 6 v1→v2 auto-clear; Plan 18-06) |
| IDENT-02 | UUIDv4 valid → 200; UUIDv5 / random string → 400; absent → 200 (D-04 tolerance branch) | API unit (mock fetch / mock SDK) | `pnpm exec vitest run tests/api/chat-session-id.test.ts` | ✅ GREEN (7/7 — UUIDv5 rejection forward-defends version-specificity; Plan 18-03) |
| IDENT-02 | sessionId NEVER appears in `args.system` or `args.messages[0]`; sessionId-bearing call vs no-sessionId call yields byte-identical system block | source-text + structural | `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` (EXTENDED per D-16) | ✅ GREEN (8/8 — 5 legacy + 3 D-16 byte-equality; Plan 18-04) |
| META-01 | First-turn metadata captures `referrer`, `user_agent`, `country`, `region`, `colo`, `message_count`, `truncated`; subsequent turns preserve pinned fields | unit (mock KV + synthetic Request w/ cf stub) | `pnpm exec vitest run tests/api/chat-transcripts.test.ts -t "META-01"` | ✅ GREEN (META-01 describe — 2/2 first-turn pin + null defaults; Plan 18-02) |
| META-02 | `appendTurn(assistant, ...)` receives `meta.cache_read_input_tokens` + `meta.cache_creation_input_tokens` from the same `cacheUsage` the log line consumes | API integration (mock Anthropic SSE + mock KV) | `pnpm exec vitest run tests/api/cache-hit-logs.test.ts -t "META-02"` | ✅ GREEN (cache-hit-logs:214 META-02 closure test; Plan 18-07) |
| TEST-01 | D-26 chat regression battery 117/117 GREEN at every chat-surface commit | full suite + chat-surface filter | `pnpm test` (per D-10 cadence) | ✅ GREEN (461 PASS / 0 FAIL / 2 SKIP at phase close; 13-file D-26 battery 97/97 — REQUIREMENTS.md "117" was forward-looking estimate) |
| TEST-01 | `pnpm exec astro check` 0/0/0 at phase end | typecheck | `pnpm exec astro check` | ✅ GREEN (Phase 17 baseline preserved through all 8 plans) |
| TEST-03 | Forward-defense source-text test stays GREEN | source-text | `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` | ✅ GREEN (8/8 incl D-16 extension; Plan 18-04) |
| TEST-03 | 3× identical POST UAT — `cache_read_input_tokens > 0` on responses 2 & 3 (preview, then production) | **manual UAT** (`wrangler tail`) | numbered manual step in `18-UAT.md` | ✅ MANUAL-PASS (`18-UAT.md` Step 2 GREEN: prod 23:47:08-23:47:37Z, cache_read=48527 on calls 2+3; preview collapsed per D-UAT-02 — see Manual-Only) |
| TEST-03 | D-15 SSE byte-identical anchor preserved | byte-snapshot | `pnpm exec vitest run tests/api/sse-snapshot.test.ts` | ✅ GREEN (3/3 re-verified post-Plan-18-05 wiring) |
| TEST-03 | Source-text forward-defense — `ctx.waitUntil(appendTurn` call sites at right anchors in api/chat.ts | source-text | `pnpm exec vitest run tests/build/append-turn-call-site.test.ts` | ✅ GREEN (7/7 — Invariants A/B/C/D/E + D-15 + observability; Plan 18-07) |
| D-09 | `ctx.waitUntil(promise.catch(handler))` pattern enforced — both call sites have explicit `.catch` | source-text | `pnpm exec vitest run tests/build/append-turn-call-site.test.ts -t "explicit .catch"` | ✅ GREEN (Invariant D — exactly 2 ctx.waitUntil calls, both with .catch; Plan 18-07) |

*Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/api/chat-transcripts.test.ts` — KV-02, KV-03, KV-04, KV-05, META-01 (landed Plan 18-02; 16 tests, all GREEN — exceeded 12–15 target)
- [x] `tests/api/chat-session-id.test.ts` — IDENT-02 server-side validation (landed Plan 18-03; 7 tests including UUIDv5-shape rejection forward-defense — exceeded 5–6 target)
- [x] `tests/client/chat-sessionid-mint.test.ts` — IDENT-01 client-side mint + STORAGE_VERSION 1→2 auto-clear (landed Plan 18-06; 8 tests across source-text + behavioral prongs; +2 WR-03a/b review-fix tests)
- [x] `tests/build/append-turn-call-site.test.ts` — source-text forward-defense for D-10/D-11/D-09 anchors (landed Plan 18-07; 7 tests — exceeded 4-test target; includes anti-destructure + D-15 + observability invariants)
- [x] EXTEND `tests/api/anthropic-payload-shape.test.ts` per D-16 with sessionId-on-envelope byte-equality (landed Plan 18-04; +3 tests under D-16 describe block; 8/8 total)
- [x] EXTEND `tests/api/cache-hit-logs.test.ts` with META-02 closure (landed Plan 18-07; +1 META-02 test on line 214; +CR-01 review-fix tests; 4 → 7 total)
- [x] Re-verify `tests/api/sse-snapshot.test.ts` GREEN (3/3 across all 8 plans; no re-baseline needed — `ctx.waitUntil` writes land OFF the controller.enqueue path per D-15 anchor)
- [x] `18-UAT.md` — authored Plan 18-08 (`9688d3e`); operator-executed against production 2026-05-11T23:47Z — 7/8 steps pass, 1/8 n/a per D-UAT-02 platform-isolation deviation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 3× identical `/api/chat` POSTs within 5min show `cache_read_input_tokens > 0` on responses 2 & 3 | TEST-03 / D-14 / D-15 | Couples CI green to Anthropic regional cache state; per-CI-run Anthropic token cost; D-15 demands real-wire verification | (1) Push to main, wait for Workers Builds preview at `https://{worker}-pr-{build}.jackcutrara.workers.dev`. (2) Open `wrangler tail` filtered to `chat.cache_metrics`. (3) POST identical payload 3× within 5 min. (4) Assert calls 2 & 3 log `cache_read_input_tokens > 0`. (5) Re-run against production after deploy. Cache miss → block phase close, root-cause via `wrangler tail` byte-diff of system block. |
| Workers Logs surface for `chat.transcript.write_failed` / `chat.transcript.quota_exceeded` / `chat.transcript.race_suspected` is parseable | D-09 / D-12 / D-13 | Requires `wrangler tail --format pretty` against live preview after KV outage / quota trip; cannot synthesize in unit test | Operational check — covered by D-26 source-text + unit tests for the call sites; surface verification noted in `18-UAT.md` step 2 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (every Per-Task Verification Map row resolves to a vitest command or the documented manual-only TEST-03 D-14 step)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (each plan's task list carries its own `<verify>` block per executor protocol)
- [x] Wave 0 covers all MISSING references (all 8 Wave 0 items landed in-phase; no carry-forward gaps)
- [x] No watch-mode flags (quick-run + full-suite commands run vitest `run`, not `watch`)
- [x] Feedback latency < 10s quick / 45s full (measured 2.76s quick-run for 63 tests across 8 files on 2026-05-11)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** GREEN (audited 2026-05-11)

---

## Validation Audit 2026-05-11

| Metric | Count |
|--------|-------|
| Requirements in map | 20 (19 automated + 1 manual-only) |
| COVERED (test exists, GREEN) | 19 |
| PARTIAL | 0 |
| MISSING | 0 |
| MANUAL-ONLY | 1 (TEST-03 D-14 3× POST UAT — executed in Plan 18-08, recorded passing in 18-UAT.md) |
| Gaps found | 0 |
| Resolved | 0 (none to resolve) |
| Escalated | 0 |
| Quick-run battery result | 63/63 GREEN in 2.76s |
| Wave 0 completion | 8/8 items landed in-phase |
| nyquist_compliant flip | false → true |

**Audit method:** Cross-referenced VALIDATION.md Per-Task Verification Map against the 8 vitest test files on disk; confirmed each named test case is present via `grep '^\s*(describe|it)\('` scans; ran the VALIDATION.md quick-run command and recorded 63/63 PASS. Phase 18's static test surface evolved from the original Wave 0 spec (target: 12 tests in chat-transcripts, 5–6 in chat-session-id, 5–6 in chat-sessionid-mint, 4 in append-turn-call-site) to a final shape that exceeded all of those targets and absorbed 5 review-time additions (WR-01 Content-Length filter, WR-03a/b localStorage shape guards, CR-01 trailing-assistant negative-control, T-18-XSS XSS-via-HTML payload regression) without re-touching this contract.

**Strengthening beyond the original spec (informational):**
- `cache-hit-logs.test.ts` grew from 4 (Plan 18-07 close) to 7 tests via Plan 18 code-review fixes (CR-01 trailing-assistant role + observability log)
- `chat-sessionid-mint.test.ts` added WR-03a/b (review-fix) covering v2 blob with missing/empty sessionId — auto-clear + fresh mint
- `append-turn-call-site.test.ts` includes 3 optional invariants beyond the Plan 18-07 spec minimum of 4 (D-15 anti-SSE-frame + D-09 observability surface + anti-destructure pattern)

No remediation needed. Phase 18 is Nyquist-compliant.
