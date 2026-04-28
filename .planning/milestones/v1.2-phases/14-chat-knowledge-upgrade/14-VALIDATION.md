---
phase: 14
slug: chat-knowledge-upgrade
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-20
last_audit: 2026-04-23
---

# Phase 14 — Validation Strategy

> Per-phase validation contract. Reconciled 2026-04-23 against shipped work — 228/228 vitest GREEN across 27 files; 14-VERIFICATION.md signed off; gap-closure 14-07 folded in.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 (pinned in `package.json` devDependencies) |
| **Config file** | `vitest.config.ts` (repo root) — `include: tests/**/*.test.ts` |
| **Quick run command** | `pnpm test` (runs `vitest run`) |
| **Full suite command** | `pnpm test` (full suite is the default; no watch split) |
| **Measured runtime** | ~2.3s (post-audit: 228 tests / 27 files GREEN) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test` (full suite, ~2.3s).
- **After every plan wave:** Run `pnpm build` (chains `build:chat-context` → `wrangler types` → `astro check` → `astro build` → `pages-compat`) + `pnpm test`.
- **Before `/gsd-verify-work`:** Full suite green + Lighthouse on `/` and one `/projects/<slug>` hitting Performance 100 / Accessibility 95 / Best Practices 100 / SEO 100 (prod) / TBT ≤150ms / CLS ≤0.01 + `14-VERIFICATION.md` 9-item D-26 table fully signed off.
- **Max feedback latency:** ~2.3 seconds per commit.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Evidence | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|----------|--------|
| 14-01-01 | 01 | 0 | CHAT-08, CHAT-03, CHAT-04 | — | Wave 0 RED stubs landed; downstream test files now exist GREEN | scaffolding | `pnpm test` | Subsumed by 14-02/03/04/05 rows below | ✅ green |
| 14-02-01 | 02 | 1 | CHAT-03, CHAT-04 | T-14-BUILD | `build-chat-context.mjs` exits 0 on clean tree; `--check` exits 0 idempotent; banlist + token-floor enforced | build + unit | `pnpm build:chat-context && pnpm test -- chat-context-integrity` | `tests/build/chat-context-integrity.test.ts` (9 GREEN) + 49,005-token actual vs 4,096 floor | ✅ green |
| 14-02-02 | 02 | 1 | CHAT-04 | — | `portfolio-context.static.json` (D-08 identity keys) + merged `portfolio-context.json` both present; tech + description fields preserved | unit (integrity) | `pnpm test -- chat-context-integrity` | `chat-context-integrity.test.ts` D-08 keys + projects/experience/about generated keys + 6-project cardinality | ✅ green |
| 14-02-03 | 02 | 1 | CHAT-03 | — | Projects/7 (MULTI-DEX) excluded — `/MULTI[- ]?DEX/i` regex banned from merged output | unit | `pnpm test -- chat-context-integrity` | `chat-context-integrity.test.ts` line 49 banlist regex + `grep -c "MULTI-DEX" src/data/portfolio-context.json` = 0 | ✅ green |
| 14-03-01 | 03 | 2 | CHAT-05 | T-14-CACHE | `system: [{ type, text, cache_control: { type: "ephemeral" } }]` shape in `messages.create` call | unit | `pnpm test -- chat.test` | `tests/api/chat.test.ts:242` SDK-shape block (5 assertions) | ✅ green |
| 14-03-02 | 03 | 2 | CHAT-07 | — | `max_tokens: 1500` in `messages.create` call (raised 768→1500 by gap-closure 14-07) | unit | `pnpm test -- chat.test` | `tests/api/chat.test.ts:223` literal 1500 + L2 source-text guards on prior values 512 / 768 | ✅ green |
| 14-04-01 | 04 | 2 | CHAT-06 | T-14-PERSONA | `buildSystemPrompt()` output — XML section markers in order, third-person framing, D-16 tiered refusals verbatim, D-17 attack-pattern list, D-19 length guidance, D-15 breadcrumb cap, D-04 banlist | unit (substring + drift-guard) | `pnpm test -- prompt-injection` | `tests/api/prompt-injection.test.ts` block 3 (17 contract tests) + drift-guard block (8 tests) | ✅ green |
| 14-04-02 | 04 | 2 | CHAT-06 | — | Widget header literal `ASK ABOUT JACK` present in `ChatWidget.astro`; pre-rename `ASK JACK'S AI` absent; dialog aria-label `Chat with Jack's AI` preserved | unit (source-text) | `pnpm test -- chat-widget-header` | `tests/client/chat-widget-header.test.ts` (3 GREEN — added 2026-04-23 audit) | ✅ green |
| 14-05-01 | 05 | 2 | CHAT-08 | T-14-INJECTION | 10 attack vectors — required substrings present (RESUME_REFUSAL `/jack-cutrara-resume.pdf` for PII; OFFSCOPE_REFUSAL for off-scope/injection); banned substrings (`<role>`, `<knowledge>`, `<security>`, `<constraints>`, `<tone>`, `cache_control`, phone regex) absent | unit (mocked-LLM) + live-model sanity | `pnpm test -- prompt-injection` | `tests/api/prompt-injection.test.ts` 36 tests across 4 describe blocks + 14-VERIFICATION.md §4.2 8-vector live-model preview pass (5 PASS / 3 NOTE / 0 FAIL) | ✅ green |
| 14-06-01 | 06 | 3 | CHAT-09 | T-14-REGRESSION | Phase 7 D-26 9-item battery — 6 automated (XSS, CORS, focus-trap, localStorage shape, markdown, copy-button) + 3 manual (rate-limit binding gap documented; 30s AbortController; SSE streaming frames) on preview deploy | mix | `pnpm test` (rows 1/2/5/6/8/9) + DevTools (rows 4/7) + curl loop (row 3) | 14-VERIFICATION.md §3 — 6 automated PASS, 2 manual PASS by Jack 2026-04-23, 1 NOTE (binding gap, byte-identical to Phase 7) | ✅ green / ⚠ manual rows 3/4/7 |
| 14-06-02 | 06 | 3 | CHAT-09 | — | Lighthouse on `/` + `/projects/seatwatch` holds Perf 100 / A11y 95 / BP 100 / TBT ≤150ms / CLS ≤0.01 (SEO 100 prod, 66 preview noindex) | e2e (manual) | DevTools Lighthouse | 14-VERIFICATION.md §Lighthouse CI Gate — verified by Jack 2026-04-23 (TBT 0ms, CLS ≤0.002 both routes) | ⚠ Manual-Only |
| 14-06-03 | 06 | 3 | CHAT-09 | — | Voice banlist on case-study MDX (source-of-truth for chat-context generator) — no `delight`, `seamless`, `craft`, `journey`, `passionate`, etc. per `docs/VOICE-GUIDE.md` | unit | `pnpm test -- voice-banlist` | `tests/content/voice-banlist.test.ts` (per-slug banlist + `scalable` numeric-pair rule) | ✅ green |
| 14-07-01 | 07 | gap-closure | T-14-COMPLETENESS (UAT regression) | — | `max_tokens: 1500` literal asserted; `message_delta` stream branch emits `data: {"truncated":true}\n\n` before `[DONE]` when upstream `stop_reason === "max_tokens"`, suppresses on `end_turn` | unit (mocked SSE stream) | `pnpm test -- chat.test` | `tests/api/chat.test.ts:295` truncation positive branch + `:386` negative branch | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ manual / flaky*

---

## Wave 0 Requirements (status at close-out)

- [x] `scripts/build-chat-context.mjs` — generator script (CHAT-03, CHAT-04, D-09..D-11) — shipped Plan 14-02
- [x] `src/data/portfolio-context.static.json` — hand-curated identity file (CHAT-04, D-08) — shipped Plan 14-02
- [x] `tests/api/prompt-injection.test.ts` — mocked-LLM battery (CHAT-06, CHAT-08, D-20..D-22) — shipped Plan 14-01 / expanded 14-04 / 14-05
- [x] `tests/fixtures/chat-eval-dataset.ts` — 10 injection vectors + grounded-QA + voice spot-checks fixture (AI-SPEC §5)
- [x] `tests/build/chat-context-integrity.test.ts` — Projects/7 banlist + token-floor + 6-project presence (AI-SPEC §5.6)
- [x] `.planning/phases/14-chat-knowledge-upgrade/14-VERIFICATION.md` — D-26 9-item table + threat-retirement + Lighthouse gate + live-injection sanity (D-23)
- [x] `tests/content/voice-banlist.test.ts` — voice-banlist CI gate on case-study MDX
- [x] `tests/api/chat.test.ts` augmented — `system: [{ type, text, cache_control }]` shape + `max_tokens` literal + truncation diagnostic frame
- [x] `tests/client/chat-widget-header.test.ts` — header literal assertion (added 2026-04-23 audit, closes Row 14-04-02 gap)

*Framework install: none — Vitest 4.1.0 already pinned. Zero new devDependencies (v1.2 cross-phase gate honored).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Evidence |
|----------|-------------|------------|-------------------|----------|
| Cloudflare rate limit (5 messages / 60s) fires on 6th rapid request | CHAT-09 | `CHAT_RATE_LIMITER` Cloudflare binding does not exist in local dev or current deploy; pre-existing Phase 7 gap, code path byte-identical | Configure binding in CF Pages → curl loop → assert 6th returns 429 | 14-VERIFICATION.md §3 Row 3 — NOTE (binding gap deferred); follow-up todo `.planning/todos/pending/2026-04-23-configure-chat-rate-limiter-binding.md` |
| 30s client-side AbortController timeout fires on slow upstream | CHAT-09 | Requires simulating slow Anthropic upstream; mock is deterministic | DevTools Network → 1 kb/s + 30000ms latency → send chat → assert ~30s abort + UI recovers | 14-VERIFICATION.md §3 Row 4 — PASS verified by Jack 2026-04-23 |
| SSE streaming frames render line-by-line | CHAT-09 | Requires inspecting live EventSource payload | DevTools Network → filter `/api/chat` → EventStream tab + Headers tab on preview URL | 14-VERIFICATION.md §3 Row 7 — PASS, progressive `data: {"text":"..."}` frames + `Content-Type: text/event-stream` + `Content-Encoding: none` |
| Widget header `ASK ABOUT JACK` renders correctly on mobile + desktop | CHAT-06 | Visual smoke — automated test asserts source markup; uppercase/letter-spacing rendering needs eyes | Open `/` on Chrome desktop + Safari mobile → chat header visible → confirm case + spacing | 14-04-SUMMARY.md §Visual smoke — visually verified 2026-04-23 |
| Lighthouse CI gate (Perf 100 / A11y 95 / BP 100 / TBT ≤150ms / CLS ≤0.01) | CHAT-09 | No `pnpm lh:ci` script; run via DevTools or LH dashboard | DevTools Lighthouse on `/` + `/projects/seatwatch` against preview URL | 14-VERIFICATION.md §Lighthouse CI Gate — verified by Jack 2026-04-23 |
| Live-model injection sanity (8 prompts vs preview deploy) | CHAT-08 | Contract tests prove copy exists; cannot observe LLM behavior | Paste 8 prompts from `tests/fixtures/chat-eval-dataset.ts` injectionVectors[] → record verbatim response | 14-VERIFICATION.md §Live-Model Injection Sanity Check — 5 PASS / 3 NOTE / 0 FAIL by Jack 2026-04-23 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify OR Wave 0 dependency declared
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 complete: 9 deliverables shipped (8 originally planned + 1 added during audit)
- [x] No watch-mode flags in any automated command
- [x] Feedback latency < 5s (actual: ~2.3s for `pnpm test`)
- [x] `nyquist_compliant: true` set in frontmatter — flipped 2026-04-23 after gap-closure (Row 14-04-02 chat-widget-header.test.ts added)

**Approval:** signed off 2026-04-23 by validation audit. Phase 14 nyquist-compliant.

---

## Validation Audit 2026-04-23

| Metric | Count |
|--------|-------|
| Gaps found | 1 (Row 14-04-02 — widget header had no vitest assertion) |
| Resolved | 1 (added `tests/client/chat-widget-header.test.ts`, 3 tests GREEN) |
| Escalated | 0 |
| Test files added | 1 |
| Test count delta | 225 → 228 (+3) |
| Full-suite runtime | ~2.3s (unchanged) |
| Frontmatter changes | `status: draft` → `complete`; `nyquist_compliant: false` → `true`; `wave_0_complete: false` → `true`; `last_audit: 2026-04-23` added |
| Per-task map changes | All ⬜ pending → ✅ green / ⚠ manual; Row 14-03-02 max_tokens literal updated 768 → 1500 (gap-closure 14-07); Row 14-04-02 evidence flipped from manual `grep` to vitest file; Row 14-07-01 added for gap-closure 14-07 truncation diagnostic frame |
