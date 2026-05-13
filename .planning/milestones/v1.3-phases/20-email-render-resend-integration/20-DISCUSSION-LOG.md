# Phase 20: Email Render + Resend Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 20-email-render-resend-integration
**Areas discussed:** Cutover strategy, Subject edge cases, Cache-hit summary in body, Resend HTTP error policy

---

## Cutover strategy

### Q1: DRY_RUN flip mode

| Option | Description | Selected |
|--------|-------------|----------|
| Atomic single deploy (Recommended) | One commit ships `src/lib/email/resend.ts` + `sendOne()` substitution + `wrangler.jsonc` DRY_RUN="0" + adversarial-payload tests together. Cleanest audit trail per Phase 19 D-03; the wire was already proven by Plan 17-06's `scripts/resend-warmup.mjs` (5/5 Inbox first try). Operator UAT runs immediately post-deploy. | ✓ |
| Staged: ship Resend with DRY_RUN="1" first, soak, then flip | Commit 1: ships the Resend wrapper + adversarial tests + sendOne substitution, but DRY_RUN stays "1" (existing dry-run log path still wins). Soak for one production cron tick (worst-case ~1h), inspect Workers Logs, then commit 2 flips DRY_RUN="0". Two deploy gates; slower but recoverable without a code revert. | |
| Preview-first: DRY_RUN="0" via preview URL, manual UAT, then merge to main | Push to a branch, Workers Builds spins a preview URL with DRY_RUN="0". Jack manually invokes `__scheduled` on preview, verifies the real email lands, then merges to main. Conflicts with Phase 19 D-04 (no test-environment override seam). Adds branch-shape complexity. | |

**User's choice:** Atomic single deploy
**Notes:** Locks the Resend POST landing visible in a single git diff per Phase 19 D-03; warmup script already proved the wire end-to-end.

---

### Q2: Operator UAT sequence

| Option | Description | Selected |
|--------|-------------|----------|
| Seed-then-cron + wait-for-real (Recommended) | 20-UAT.md Step 1: operator `wrangler kv key put live:test-uat-<sid>` with stale `last_activity_at` (Phase 19 Step 2 pattern). Step 2: invoke `__scheduled` against production via Cloudflare dashboard temporary `* * * * *` flip. Step 3: verify Gmail Inbox within 90s + `delivered:test-uat-<sid>` value + Workers Logs. Step 4: revert cron. Catches both the wire and inbox-delivery. | ✓ |
| Wait-for-organic | Deploy with DRY_RUN="0", then wait for a real visitor conversation to flow through. No seeded test transcript. Cleaner audit trail but UAT closure is gated on real traffic which may take days. | |
| Sandbox-then-prod | Phase 20 plan first wires Resend POST to `delivered@resend.dev`. Operator verifies via Workers Logs. Then a second commit swaps to `jackcutrara@gmail.com`. Conflicts with the Atomic decision — implicitly two commits. | |

**User's choice:** Seed-then-cron + wait-for-real

---

### Q3: Rollback posture

| Option | Description | Selected |
|--------|-------------|----------|
| Single-line revert of wrangler.jsonc (Recommended) | If something breaks: operator edits `wrangler.jsonc` `"DRY_RUN": "0"` back to `"1"`, runs `wrangler deploy`. Resend POST is now unreachable behind the dry-run gate; cron sweep continues logging envelopes. ~60s recovery. Resend wrapper + adversarial tests stay in main. | ✓ |
| Git revert of the entire deploy commit | Operator `git revert <sha> && git push origin main`. Larger blast radius (the Resend wrapper + tests disappear from main); harder to re-ship cleanly afterward. | |
| Cron disable via empty triggers.crons | Set `triggers.crons` to `[]`, redeploy. Heavier but bounds blast radius if the bug is in the sweep loop rather than the send path. | |

**User's choice:** Single-line revert of wrangler.jsonc

---

### Q4: DEPLOY-GATE.md posture

| Option | Description | Selected |
|--------|-------------|----------|
| DEPLOY-GATE.md required (Recommended) | Phase 20 mirrors Plan 17-08 posture: executor commits all Phase 20 code locally, STOPS, writes DEPLOY-GATE.md with status=pending + manual UAT checklist. Operator runs UAT, replies "approved", then `git push origin main` themselves. | ✓ |
| Standard executor completion | Executor commits + pushes per Phase 18/19 pattern (no DEPLOY-GATE.md). Faster but the gate-before-push lever is gone if a pre-push concern surfaces. | |
| Lightweight gate (operator confirms in chat reply only) | No DEPLOY-GATE.md file artifact; executor commits all changes locally, pauses, asks for chat-reply confirmation, then pushes when confirmed. Same gate semantics but no file-tree audit trail. | |

**User's choice:** DEPLOY-GATE.md required

---

## Subject edge cases

### Q1: Null country

| Option | Description | Selected |
|--------|-------------|----------|
| Literal "unknown" (Recommended) | `[Portfolio chat] 7 turns from unknown via stackoverflow.com`. Explicit, scannable, tells you at-a-glance whether `request.cf.country` resolved. | ✓ |
| Omit the `from <country>` segment entirely | `[Portfolio chat] 7 turns via stackoverflow.com` when country is null. Shorter, but loses missing-vs-present signal. | |
| Use country code `??` literal | `[Portfolio chat] 7 turns from ?? via stackoverflow.com`. Two-char preserves alignment with ISO codes. | |

**User's choice:** Literal "unknown"

---

### Q2: Null referrer

| Option | Description | Selected |
|--------|-------------|----------|
| Literal "direct" (Recommended) | `[Portfolio chat] 7 turns from US via direct`. Mirrors UTM-style `(direct)` convention. Tells you the visitor didn't arrive from a referring site. | ✓ |
| Omit the `via <host>` segment entirely | Shorter; loses the direct-vs-referred signal. Subject lines become inconsistent length. | |
| Literal "unknown" | Symmetric with country fallback but conflates "data missing" with "direct visit" which are operationally different. | |

**User's choice:** Literal "direct"

---

### Q3: Header sanitization scope

| Option | Description | Selected |
|--------|-------------|----------|
| Strict charset + CR/LF strip (Recommended) | Country pinned to `[A-Z]{2}` or `unknown` literal. `referrer-host` pinned to `[a-z0-9.-]+`. CR/LF + bidi-override + null-byte strip as defensive belt over the suspenders. Smallest attack surface. | ✓ |
| Universal `sanitizeHeader()` helper | All header interpolations go through one helper. Heavier defense; field set is currently small. | |
| Inline sanitize at the interpolation point | Subject template calls `safeCountry(country)` + `safeHost(referrer)` inline. Spreads sanitization logic across call sites. | |

**User's choice:** Strict charset + CR/LF strip

---

### Q4: Truncated-suffix placement

| Option | Description | Selected |
|--------|-------------|----------|
| Trailing space + parenthetical (Recommended) | `[Portfolio chat] 30 turns from US via direct (truncated)`. Phase 18 D-08 literal. Visually distinct. | ✓ |
| Bracketed prefix | `[TRUNCATED][Portfolio chat] 30 turns from US via direct`. Sorts together in Gmail but conflicts with D-08 wording. | |
| Inline after turn count | `[Portfolio chat] 30+ turns from US via direct`. Tighter but loses the discrete signal Jack chose at Phase 18. | |

**User's choice:** Trailing space + parenthetical

---

## Cache-hit summary in body

### Q1: Cache surfacing location

| Option | Description | Selected |
|--------|-------------|----------|
| Aggregate one-liner in body header (Recommended) | One line at the bottom of the metadata header block. Quick at-a-glance health check without polluting per-turn read flow. | ✓ |
| Per-turn inline notation | Each `<<< bot:` line ends with `[cache: 1234r / 0c]`. Higher information density; heavier visual noise. | |
| Omit entirely — grep Workers Logs | Don't put cache fields in the email. Loses at-rest persistence — Workers Logs retention is short. | |

**User's choice:** Aggregate one-liner in body header

---

### Q2: Aggregate format

| Option | Description | Selected |
|--------|-------------|----------|
| "Cache: 5/8 turns hit, 7,234 read / 1,221 created" (Recommended) | Compact + scannable. `hit` count is the human signal; raw token totals are the diagnostic. Thousands separators since these numbers can run into 5+ digits. | ✓ |
| "Anthropic cache: 5 of 8 turns hit cache; 7234 tokens read from cache, 1221 created" | Verbose but unambiguous. Longer line, less scannable in monospace plaintext. | |
| "Cache hits 5/8 (read 7234 / create 1221)" | Terser. Drops thousands separator and comma. Loses scannability for non-zero-padded numbers. | |

**User's choice:** "Cache: 5/8 turns hit, 7,234 read / 1,221 created"

---

### Q3: Metadata header block shape

| Option | Description | Selected |
|--------|-------------|----------|
| Compact 7-line block (Recommended) | 7 lines (Session/Started/Last turn/From/Referrer/User-agent/Messages/Cache) with padded label column. Then provenance line, then turn markers. | ✓ |
| Compact pipe-separated header | Single line: `US · LinkedIn · 8 turns · 8m 34s · cache 5/8 · sid=<id>`. Tight; loses per-field discoverability. | |
| Sectioned: "Context" + "Metadata" + "Conversation" | Three labeled sections with `===` rule lines between. More vertical real estate before the conversation. | |

**User's choice:** Compact 7-line block

---

### Q4: Turn-marker render shape

| Option | Description | Selected |
|--------|-------------|----------|
| Marker line then raw content, blank line between turns (Recommended) | Marker on its own line; content verbatim below (no indent, no wrapping). Blank line separates turns. HTML-escape applied to content even though body is plaintext (MAIL-03 defense-in-depth). | ✓ |
| Inline marker with content on same line | `>>> visitor: Does Jack have multi-DEX trading experience?`. Compact for short messages; visually disconnects from multi-line continuation. | |
| Indented content + blank line | Marker on its own line; content indented 2 or 4 spaces. Risk: visitor pasting code with leading spaces gets ambiguous indentation. | |

**User's choice:** Marker line then raw content, blank line between turns

---

## Resend HTTP error policy

### Q1: HTTP status taxonomy

| Option | Description | Selected |
|--------|-------------|----------|
| Three-class taxonomy (Recommended) | 2xx → success. 5xx + 429 → retry with same Idempotency-Key (within 3-try budget). 4xx-except-429 → no retry, emit `chat.delivery.failed`, return error. 3xx → treat as 4xx. | ✓ |
| Two-class: retry-all-failures vs success | Anything non-2xx → retry with same key up to 3 times. Risk: a bad-payload 422 burns full retry budget. | |
| Retry-on-5xx only; treat 429 separately | 5xx → retry. 429 → emit `chat.delivery.rate_limited` log, do NOT retry within this tick, leave `live:` in place for next-tick natural retry. | |

**User's choice:** Three-class taxonomy

---

### Q2: Idempotency replay handling

| Option | Description | Selected |
|--------|-------------|----------|
| Treat replay as success; record same as first send (Recommended) | 200 with `idempotency_replay: true` → same `data.id`, same downstream behavior. Optional distinct `chat.delivery.idempotency_replay` log event. | ✓ |
| Treat replay as success but log a warning | Same KV path; emit `console.warn` instead of `console.log`. Replay is expected at v1.3 idempotency-by-design, so warning level is technically wrong. | |
| Detect replay and skip the KV writes | If `idempotency_replay: true` and `delivered:{sid}` doesn't exist locally, that's a data-integrity bug — option 1's "same as first send" preserves visibility. | |

**User's choice:** Treat replay as success; record same as first send

---

### Q3: Fetch-level error handling

| Option | Description | Selected |
|--------|-------------|----------|
| AbortController with 10s timeout per attempt, treat throws as 5xx-class (Recommended) | Each `fetch()` wrapped in AbortController with 10s signal. Network/timeout errors throw and are caught at retry-harness layer. Bounds worst-case wall-clock per session. | ✓ |
| No timeout; rely on Resend's own response time | Cleaner code. Risk: a hung Resend connection consumes the entire 30s scheduled-handler budget on one session. | |
| Timeout per tick, not per attempt | Single AbortController shared across all 3 retries; total send-budget cap of 15s. Conflicts with full-jitter exponential backoff. | |

**User's choice:** AbortController with 10s timeout per attempt

---

### Q4: Log shape for failure paths

| Option | Description | Selected |
|--------|-------------|----------|
| Four distinct event names (Recommended) | `chat.delivery.sent`, `chat.delivery.failed`, `chat.delivery.retry`, `chat.delivery.idempotency_replay`. Tight greppability — each name maps to one operational question. | ✓ |
| Two events: `chat.delivery.sent` + `chat.delivery.failed` | Retries log only on terminal failure. Retry decisions invisible mid-flight. Smaller log surface. | |
| Single `chat.delivery.outcome` with `status` field | One event name; `status: "sent" | "failed" | "replay"` discriminator. Less grep friction but pollutes the index. | |

**User's choice:** Four distinct event names

---

## Claude's Discretion

Areas where Claude has flexibility (captured in CONTEXT.md `<decisions>` "Claude's Discretion" subsection):

- `src/lib/email/` directory shape (single `render.ts` vs split into `render/subject.ts` + `render/body.ts` + `render/escape.ts`)
- Exact retry-harness wiring inside `sendOne` (Resend wrapper calls retryWithBackoff internally vs returns Result and lets `sendOne` decide)
- Adversarial-payload unit-test fixture set + organization (single `it.each` file vs one fixture per payload class)
- `20-UAT.md` step ordering inside the 6-step set (presentational; recommended traceability-to-success-criteria mapping)
- Where User-Agent + Referrer length caps are applied (already truncated at write-time per Phase 18 KV-04; no second truncation at render time)
- Provenance line placement (inside metadata block as final line vs above as preamble banner vs below as transition)
- Resend wrapper API shape (thin `sendEmail(env, payload)` vs richer `sendTranscript(env, transcript)`)
- `20-UAT.md` Step 6 organic real-traffic 7-day soft cap (operational documentation, not a hard requirement)
- Whether to extend `tests/build/*-call-site.test.ts` family with `chat-delivery-send-site.test.ts` (forward-defense optional)

## Deferred Ideas

Captured in CONTEXT.md `<deferred>` section. Summary:

- `/api/resend-webhook` with Svix HMAC — v1.4+
- HTML email body / markdown rendering / auto-linkification — v1.4+ (phishing surface)
- Per-IP rate limit — v1.4+ (KV-05 per-sessionId is v1.3-acceptable)
- Workers Paid plan / `CHAT_RATE_LIMITER` binding — v1.4+
- Workers Analytics Engine — v1.4+ Phase 21
- Live integration testing against `delivered@resend.dev` sandbox — deferred to operational verification via 20-UAT.md
- Cross-cron-tick coordination via `delivery_lock:{sid}` — Phase 19 deferred; Phase 20 inherits

Reviewed-but-not-folded todos: 4 todos matched at the cross-reference step (mobile-menu-breakpoint, og-default-image, chat-cache-hit-rate, chat-rate-limiter) — none folded; first two are out of v1.3 scope per milestone lock; last two are already closed by Phase 17 DEBT-01/02.
