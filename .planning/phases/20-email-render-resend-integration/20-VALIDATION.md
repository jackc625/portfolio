---
phase: 20
slug: email-render-resend-integration
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-12
validated: 2026-05-13
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `20-RESEARCH.md` § Validation Architecture (Nyquist).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x (already installed; Phase 17/18/19 baseline) |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `pnpm exec vitest run tests/api/email-render.test.ts tests/api/email-render.adversarial.test.ts tests/api/email-resend.test.ts tests/api/chat-delivery.test.ts` |
| **Full suite command** | `pnpm exec vitest run` |
| **Estimated runtime** | ~12s quick / ~35s full |
| **Typecheck command** | `pnpm exec astro check` (target 0/0/0 — Plan 17-08 / Phase 19 baseline) |
| **Build command** | `pnpm build` |

---

## Sampling Rate

- **After every task commit:** Run quick run command (4 affected test files) — feedback latency ~12s
- **After every plan wave:** Run `pnpm exec vitest run` (full suite) + `pnpm exec astro check`
- **Before `/gsd-verify-work`:** Full suite GREEN; `pnpm build` clean; `package.json` `dependencies` byte-identical phase-wide; `wrangler.jsonc vars.DRY_RUN === "0"`
- **Max feedback latency:** 12s (quick) / 35s (full suite)

---

## Per-Task Verification Map

> Filled in by the planner after PLAN.md files exist. Each task in PLAN.md must have a row here.
> Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 20-01-T1 | 20-01 | 1 | MAIL-02, MAIL-03, MAIL-04, MAIL-05 | T-20-01-01..07 | Wave 0 scaffold: 2 NEW test files with stubs covering all renderer + adversarial test names from VALIDATION.md | unit (RED stubs) | pnpm exec astro check | ✅ exists | ✅ green |
| 20-01-T2 | 20-01 | 1 | MAIL-02, MAIL-03, MAIL-04, MAIL-05 | T-20-01-01..07 | Author src/lib/email/render.ts pure renderer (subject + body + sanitizer pipeline + cache aggregate); turn RED tests GREEN | unit | pnpm exec vitest run tests/api/email-render.test.ts tests/api/email-render.adversarial.test.ts | ✅ exists | ✅ green |
| 20-02-T1 | 20-02 | 1 | MAIL-01 | T-20-02-01..07 | Wave 0 scaffold: tests/api/email-resend.test.ts with mocked-fetch + AbortController + 3-variant Result stubs | unit (RED stubs) | pnpm exec astro check | ✅ exists | ✅ green |
| 20-02-T2 | 20-02 | 1 | MAIL-01 | T-20-02-01..07 | Author src/lib/email/resend.ts pure REST wrapper (POST + headers + AbortController + Result + 3-event logging); turn RED tests GREEN | unit | pnpm exec vitest run tests/api/email-resend.test.ts | ✅ exists | ✅ green |
| 20-03-T1 | 20-03 | 2 | MAIL-01, MAIL-02, MAIL-03, MAIL-04, MAIL-05 | T-20-03-01..07 | Wave 0 scaffold: extend chat-delivery.test.ts GROUP I + author 2 NEW build tests (chat-delivery-send-site + wrangler-dry-run-shape) as RED | unit + build (RED stubs) | pnpm exec astro check | ✅ exists | ✅ green |
| 20-03-T2 | 20-03 | 2 | MAIL-01, MAIL-02, MAIL-03, MAIL-04, MAIL-05 | T-20-03-01..07 | sendOne substitution + DeliveredMarker.resend_message_id additive + promoteOne step-4 PUT site populates field + wrangler.jsonc DRY_RUN "1" -> "0" + update existing wrangler-cron-shape DRY_RUN assertion + rewrite GROUP D throw-stub test | unit + build | pnpm exec vitest run tests/api/chat-delivery.test.ts tests/build/chat-delivery-send-site.test.ts tests/build/wrangler-dry-run-shape.test.ts tests/build/wrangler-cron-shape.test.ts | ✅ exists | ✅ green |
| 20-04-T1 | 20-04 | 3 | MAIL-01, MAIL-02, MAIL-03, MAIL-04, MAIL-05 | T-20-04-01..06 | Author 20-UAT.md (6 numbered operator steps) + DEPLOY-GATE.md (mirrors Plan 17-08; status=pending) | docs (no source) | pnpm exec vitest run tests/build/wrangler-dry-run-shape.test.ts tests/build/chat-delivery-send-site.test.ts tests/build/wrangler-cron-shape.test.ts | ✅ exists | ✅ green |
| 20-04-T2 | 20-04 | 3 | MAIL-01, MAIL-02, MAIL-03, MAIL-04, MAIL-05 | T-20-04-01..06 | Operator-controlled checkpoint: pre-deploy checklist + UAT runbook + chat-reply approval + git push origin main (executor MUST NOT push) | manual operator UAT | (manual; resume-signal: "approved — deploy gate cleared") | n/a (operator-driven) | ✅ Steps 1-5 PASS; Step 6 7-day soft cap open (closure 2026-05-20) |

### Requirements → Test Coverage (from RESEARCH § Validation Architecture)

| Req ID | Behavior | Test Type | Automated Command | File Exists |
|--------|----------|-----------|-------------------|-------------|
| MAIL-04 | Subject `[Portfolio chat] N turns from <country> via <referrer-host>` happy path | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "subject happy path"` | ✅ exists, GREEN |
| MAIL-04 / D-05 | Subject contains `unknown` token when `meta.country === null` | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "subject null country"` | ✅ exists, GREEN |
| MAIL-04 / D-06 | Subject contains `direct` token when `meta.referrer === null` | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "subject null referrer"` | ✅ exists, GREEN |
| MAIL-04 / D-07 | Subject country interpolation rejects non-`[A-Z]{2}` value (`unknown` fallback) | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "subject country regex"` | ✅ exists, GREEN |
| MAIL-04 / D-07 | Subject referrer-host rejects non-`[a-z0-9.-]+` value (`direct` fallback); URL parser throws on malformed | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "subject referrer regex"` | ✅ exists, GREEN |
| MAIL-04 / D-08 | Subject ends with ` (truncated)` when `transcript.truncated === true` | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "subject truncated suffix"` | ✅ exists, GREEN |
| MAIL-02 / D-11 | Body 7-line metadata header block with padded label column; padding count locked | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "body metadata header shape"` | ✅ exists, GREEN |
| MAIL-02 / D-09 / D-10 | Cache aggregate one-liner `Cache: {hit}/{total} turns hit, {read,localized} read / {created,localized} created`; `hit` = `messages.filter(m => m.role === "assistant" && (m.cache_read_input_tokens ?? 0) > 0).length`; thousands separators present | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "cache aggregate"` | ✅ exists, GREEN |
| MAIL-02 | Provenance line `From: chat widget on jackcutrara.com — visitor message follows below this line.` placed below metadata header, separated by blank lines | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "provenance placement"` | ✅ exists, GREEN |
| MAIL-02 / D-12 | Turn markers `>>> visitor:` / `<<< bot:` on own line; raw content below; blank line between turns | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "turn marker shape"` | ✅ exists, GREEN |
| MAIL-03 | HTML-escape converts `<`, `>`, `&`, `"`, `'` to entities in every dynamic field | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "html escape"` | ✅ exists, GREEN |
| MAIL-03 | CR/LF stripped from subject components | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "crlf strip subject"` | ✅ exists, GREEN |
| MAIL-03 | Unicode bidi overrides (`U+202A..U+202E`, `U+2066..U+2069`) stripped from all dynamic fields | unit | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "bidi strip"` | ✅ exists, GREEN |
| MAIL-03 | Null bytes (`\0`) stripped from all dynamic fields | unit | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "null byte strip"` | ✅ exists, GREEN |
| MAIL-05 | Adversarial: `<script>alert(1)</script>` renders escape-encoded; no executable content | unit (it.each) | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "script tag"` | ✅ exists, GREEN |
| MAIL-05 | Adversarial: `</p><img src=x onerror=alert(1)>` renders escape-encoded | unit (it.each) | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "img onerror"` | ✅ exists, GREEN |
| MAIL-05 | Adversarial: `javascript:alert(1)` URL renders as plain text (no auto-link) | unit (it.each) | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "javascript url"` | ✅ exists, GREEN |
| MAIL-05 | Adversarial: RTL/bidi `U+202E` reversed-text payload renders with bidi chars stripped | unit (it.each) | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "rtl bidi"` | ✅ exists, GREEN |
| MAIL-05 | Adversarial: null bytes in visitor content stripped (no `\0` byte in output) | unit (it.each) | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "null bytes"` | ✅ exists, GREEN |
| MAIL-05 | Adversarial: visitor typing `From: chat widget on jackcutrara.com` renders under `>>> visitor:` marker; AUTHENTIC provenance line above is byte-distinct (no spoofing) | unit (it.each) | `pnpm exec vitest run tests/api/email-render.adversarial.test.ts -t "social engineering provenance"` | ✅ exists, GREEN |
| MAIL-01 | `sendEmail()` returns `{ status: "sent", message_id, attempt }` on 200 with mocked fetch | unit | `pnpm exec vitest run tests/api/email-resend.test.ts -t "200 sent"` | ✅ exists, GREEN |
| MAIL-01 / D-13 | `sendEmail()` returns `failed_transient` on 5xx | unit | `pnpm exec vitest run tests/api/email-resend.test.ts -t "5xx transient"` | ✅ exists, GREEN |
| MAIL-01 / D-13 | `sendEmail()` returns `failed_transient` on 429 | unit | `pnpm exec vitest run tests/api/email-resend.test.ts -t "429 transient"` | ✅ exists, GREEN |
| MAIL-01 / D-13 | `sendEmail()` returns `failed_terminal` with `http_status` + `resend_error` on 4xx-except-429 (test 422 + 401 + 403 + 409) | unit (it.each) | `pnpm exec vitest run tests/api/email-resend.test.ts -t "4xx terminal"` | ✅ exists, GREEN |
| MAIL-01 / D-15 | AbortController fires at 10s timeout; thrown `DOMException` with `name === "AbortError"`; bubbled up | unit (mocked fetch + fake timers) | `pnpm exec vitest run tests/api/email-resend.test.ts -t "abort timeout"` | ✅ exists, GREEN |
| MAIL-01 | Idempotency-Key header literal `transcript/${sessionId}` is set | unit (spy on init.headers) | `pnpm exec vitest run tests/api/email-resend.test.ts -t "idempotency key header"` | ✅ exists, GREEN |
| MAIL-01 / MAIL-04 | `Authorization: Bearer ${env.RESEND_API_KEY}` literal set | unit | `pnpm exec vitest run tests/api/email-resend.test.ts -t "bearer auth header"` | ✅ exists, GREEN |
| MAIL-01 | `User-Agent` header set (Landmine 4 mitigation) | unit | `pnpm exec vitest run tests/api/email-resend.test.ts -t "user-agent header"` | ✅ exists, GREEN |
| MAIL-02 | Request body has `text` field present + `html` field ABSENT | unit | `pnpm exec vitest run tests/api/email-resend.test.ts -t "text field only"` | ✅ exists, GREEN |
| D-17 | Wrapper has NO `replayed` Result variant and NO `idempotency_replay` log event; both source-text greps return 0 (Layer 1 KV cursor is the sole application-side replay detector) | source-text | `grep -c 'replayed' src/lib/email/resend.ts` returns 0 AND `grep -c 'idempotency_replay' src/lib/email/resend.ts` returns 0 (negative-coverage assertion is structurally orthogonal to the `200 sent` vitest filter — that filter only verifies the sent variant works, NOT that the replayed variant is absent; the source-text grep is the load-bearing D-17 gate per Plan 20-02 Task 2 acceptance criteria) | ✅ exists, GREEN |
| Wiring | DRY_RUN=`"1"` branch in `sendOne` STILL emits `chat.delivery.dry_run` (rollback runway preserved byte-identical) | unit (extend chat-delivery.test.ts) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "dry_run preserves runway"` | ✅ extended, GREEN |
| Wiring | DRY_RUN=`"0"` branch in `sendOne` calls `sendEmail` with rendered payload | unit (mock + spy) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "live calls sendEmail"` | ✅ extended, GREEN |
| Wiring | On `{ status: "sent", message_id }` → `delivered:{sid}` value has `dry_run: false` + populated `resend_message_id: string` matching message_id; emits `chat.delivery.sent` | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "delivered marker resend_message_id"` | ✅ extended, GREEN |
| Wiring | On `{ status: "failed_transient" }` → retry harness fires (3-try budget); emits `chat.delivery.retry` | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "failed_transient retries"` | ✅ extended, GREEN |
| Wiring | On `{ status: "failed_terminal" }` → emits `chat.delivery.failed`; `live:{sid}` NOT deleted; `delivered:{sid}` NOT written | unit | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "failed_terminal logs and skips"` | ✅ extended, GREEN |
| Source-text fwd-defense (recommended) | `src/lib/chat-delivery.ts` `sendOne` imports the Resend wrapper and does NOT contain `send_not_implemented_in_phase_19` | source-text (build) | `pnpm exec vitest run tests/build/chat-delivery-send-site.test.ts` | ✅ exists, GREEN |
| Source-text fwd-defense (recommended) | `wrangler.jsonc` `vars.DRY_RUN === "0"` at phase close + `triggers.crons === ["0 * * * *"]` | source-text (build) | `pnpm exec vitest run tests/build/wrangler-dry-run-shape.test.ts` | ✅ exists, GREEN |
| Renderer purity (Landmine 5) | `renderEmail(sameTranscript)` called twice returns deeply equal results (no `Date.now()`, no `crypto.randomUUID()`) | unit | `pnpm exec vitest run tests/api/email-render.test.ts -t "renderer purity"` | ✅ exists, GREEN |
| KV write shape (Landmine 7) | `mockKV.put.calls[0][2]` equals `{ expirationTtl: DELIVERED_TTL_SECONDS }` exactly (no `metadata` key) | unit (extend chat-delivery.test.ts) | `pnpm exec vitest run tests/api/chat-delivery.test.ts -t "delivered marker no metadata"` | ✅ extended, GREEN |
| D-26 chat-surface battery PRESERVED (forward-defense) | Phase 20 touches ZERO chat-surface files | full battery | `pnpm exec vitest run` — 498 PASS / 0 FAIL / 2 SKIP baseline must hold or grow | ✅ verified 2026-05-13 |
| D-15 SSE byte-identical anchor PRESERVED | `tests/api/sse-snapshot.test.ts` GREEN | unit | `pnpm exec vitest run tests/api/sse-snapshot.test.ts` | ✅ verified 2026-05-13 |
| TEST-03 Anthropic prompt-cache integrity PRESERVED | `tests/api/anthropic-payload-shape.test.ts` GREEN | unit | `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` | ✅ verified 2026-05-13 |
| Build cleanliness | `pnpm exec astro check` exits 0/0/0 | typecheck | `pnpm exec astro check` | ✅ verified 2026-05-13 |
| Build cleanliness | `pnpm build` clean (wrangler types regen + astro check + astro build) | build | `pnpm build` | ✅ verified 2026-05-13 |
| Zero-new-runtime-dep (MAIL-01 lock) | `package.json` `dependencies` byte-identical phase-wide | source-text or visual diff | `git diff --stat package.json` shows `dependencies` unchanged | (verify at phase close) |

---

## Wave 0 Requirements

> All test files below must exist (with stubs covering all rows above) before plan tasks claim `<automated>` references against them. Plans that introduce new tests are responsible for creating their target file in Wave 0 of their plan.

- [x] `tests/api/email-render.test.ts` — covers MAIL-02, MAIL-04, D-05..D-12, renderer purity (Landmine 5) — 25 tests GREEN
- [x] `tests/api/email-render.adversarial.test.ts` — covers MAIL-03, MAIL-05 adversarial-payload `it.each` — 11 tests GREEN (6-row it.each + 5 standalone)
- [x] `tests/api/email-resend.test.ts` — covers MAIL-01, D-13..D-15, D-17 with mocked global `fetch`; uses `vi.useFakeTimers()` for AbortController timeout test; throws `new DOMException("aborted", "AbortError")` (Landmine 1) — 13 tests GREEN
- [x] `tests/api/chat-delivery.test.ts` — EXTEND (existing file). Covers `sendOne` substitution wiring + KV write shape (Landmine 7) — GROUP I 6/6 GREEN; suite 25/25 GREEN
- [x] `tests/build/chat-delivery-send-site.test.ts` — source-text forward-defense — 5 invariants GREEN
- [x] `tests/build/wrangler-dry-run-shape.test.ts` — source-text forward-defense — 2 invariants GREEN
- [x] No framework install required — vitest 4.x already configured
- [x] No new test fixtures beyond inline literal `ChatTranscript` objects (built per-test via fixture-builder helper modeled on `tests/api/chat-delivery.test.ts:50-58`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real chat session lands in Jack's Gmail Inbox (NOT Spam) within 90s of cron tick | Success Criterion 1 | Requires live Resend POST + Gmail render + Postmaster Tools spam-classification verdict | `20-UAT.md` Step 1-3 (seed `live:test-uat-<sid>` with stale `last_activity_at`; flip `triggers.crons` to `["* * * * *"]`; redeploy; verify Gmail Inbox arrival + `delivered:test-uat-<sid>` value + Workers Logs `chat.delivery.sent`) |
| `triggers.crons` reverted to `["0 * * * *"]` post-UAT | Operational hygiene | UAT temporarily flips cron to `["* * * * *"]` for fast-cycle verification | `20-UAT.md` Step 4 (revert + redeploy; the `tests/build/wrangler-dry-run-shape.test.ts` source-text guard is the automated forward-defense) |
| Test seed cleanup (`live:test-uat-*` + `delivered:test-uat-*`) | Operational hygiene | Avoids audit-debt of test seeds in production KV | `20-UAT.md` Step 5 (`wrangler kv key delete live:test-uat-<sid>` + `wrangler kv key delete delivered:test-uat-<sid>`) |
| Organic real-traffic email arrives in Inbox + Resend message ID + arrival time recorded | Success Criterion 4 (idempotency in the wild) | Requires actual visitor traffic post-deploy | `20-UAT.md` Step 6 (wait for first organic visitor conversation; record Resend message ID + arrival time + Gmail screenshot + Workers Logs screenshot in `result:` block; 7-day soft cap before falling back to `scripts/resend-warmup.mjs` re-execution as proxy) |
| Operator approves `DEPLOY-GATE.md` before `git push origin main` | Phase 20 D-04 deploy-gate posture | Mirrors Plan 17-08; executor MUST NOT push | DEPLOY-GATE.md `status=pending` → operator runs UAT → operator replies "approved — deploy gate cleared" → operator pushes |

---

## Validation Sign-Off

- [x] All planned tasks have `<automated>` verify (per Per-Task Verification Map) or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (4 NEW test files + 1 EXTEND) — all 6 files scaffolded + populated
- [x] No watch-mode flags (no `--watch`; vitest run only)
- [x] Feedback latency < 12s (quick) / < 35s (full) — measured 940ms quick / 10.63s full
- [x] Manual-only verifications routed to `20-UAT.md` (5 steps + 1 organic step) and `DEPLOY-GATE.md`
- [x] `nyquist_compliant: true` set in frontmatter (after planner populates Per-Task Verification Map)

**Approval:** planner-signed 2026-05-12 (8 task rows populated; nyquist_compliant true; wave_0_complete false until 20-01-T1 + 20-02-T1 + 20-03-T1 scaffold the test files at execute-time).
**Validated:** /gsd-validate-phase 2026-05-13 — wave_0_complete flipped true; all 8 task rows ✅ green; all Requirements → Test Coverage rows ✅ exists, GREEN; cross-phase anchors verified; D-17 grep gates clean.

---

## Validation Audit 2026-05-13

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Manual-only (pre-existing) | 4 (operator UAT steps) + 1 (organic real-traffic — 7-day soft cap to 2026-05-20) |

### Verification Summary

| Check | Result |
|-------|--------|
| Phase 20 quick-run battery (`email-render` + `email-render.adversarial` + `email-resend` + `chat-delivery` + `chat-delivery-send-site` + `wrangler-dry-run-shape` + `wrangler-cron-shape`) | 7 files / **90 tests PASS** in 940ms |
| Full vitest suite | **567 PASS / 2 SKIP / 64 files** in 10.63s (Phase 19 baseline 498 + Phase 20 net +69 = 567) |
| `pnpm exec astro check` | **0 errors / 0 warnings / 0 hints** across 116 files |
| D-17 grep gate `replayed` in `src/lib/email/resend.ts` | **0 occurrences** ✅ |
| D-17 grep gate `idempotency_replay` in `src/lib/email/resend.ts` | **0 occurrences** ✅ |
| Phase 19 throw stub `send_not_implemented_in_phase_19` in `src/lib/chat-delivery.ts` | **0 occurrences** ✅ (substitution complete) |
| D-01 toggle `"DRY_RUN": "0"` in `wrangler.jsonc` | **1 occurrence** ✅ |
| D-03 rollback artifact `ROLLBACK RUNWAY` in `src/lib/chat-delivery.ts` | **1 occurrence** ✅ |
| Env-narrowing guard `resend_terminal_env_missing` | **2 occurrences** ✅ (throw + structured-log error_class) |
| D-15 SSE byte-identical anchor (`tests/api/sse-snapshot.test.ts`) | 3/3 GREEN ✅ |
| TEST-03 Anthropic prompt-cache anchor (`tests/api/anthropic-payload-shape.test.ts`) | 8/8 GREEN ✅ |

### Outcome

Phase 20 is **NYQUIST-COMPLIANT**. Every requirement in the Per-Task Verification Map and Requirements → Test Coverage table is automated, present in the repo, and green. The remaining manual-only items are operator UAT steps already executed (Steps 1–5 PASS per STATE.md) and the 7-day soft-cap organic real-traffic Step 6 (closure 2026-05-20) — both routed to `20-UAT.md` + `DEPLOY-GATE.md` by design, not gaps.

No auditor spawn required; no test files generated.
