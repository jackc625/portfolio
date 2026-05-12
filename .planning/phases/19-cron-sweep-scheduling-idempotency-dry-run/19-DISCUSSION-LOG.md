# Phase 19: Cron Sweep — Scheduling + Idempotency (DRY_RUN) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 19-cron-sweep-scheduling-idempotency-dry-run
**Areas discussed:** DRY_RUN flag plumbing, Phase 19 / Phase 20 boundary, delivered:{sid} value shape, Cron verification strategy

---

## DRY_RUN flag plumbing

### Where the flag lives

| Option | Description | Selected |
|--------|-------------|----------|
| wrangler.jsonc `vars` block | Declare `"vars": { "DRY_RUN": "1" }`; flip in Phase 20 is a single-line wrangler.jsonc edit committed alongside the renderer + adversarial-payload work; visible in git diff; requires redeploy | ✓ |
| Worker secret via `wrangler secret put` | Add to `Env` interface; set via `wrangler secret put DRY_RUN`; flip via CLI without config commit; no source-tree audit trail at flip moment | |
| Hardcoded const in chat-delivery.ts | `const DRY_RUN = true;` at top of `src/lib/chat-delivery.ts`; flip via source-code edit + commit + deploy | |

**User's choice:** Recommended path (wrangler `vars`)
**Notes:** Initial confusion about the question framing — clarified what DRY_RUN means in plain English (cron does everything except the actual Resend POST in Phase 19; Phase 20 flips the switch). User then chose the recommended path across all four sub-questions in one shot.

### Name + type contract

| Option | Description | Selected |
|--------|-------------|----------|
| `DRY_RUN = '1' / '0'` | Terse name; string-'1'/'0' contract; checked via `env.DRY_RUN === "1"`; canonical Workers convention | ✓ |
| `CHAT_DELIVERY_DRY_RUN = '1' / '0'` | Namespaced name; same contract; pays off only if more dry-run flags appear later | |
| `DRY_RUN` = presence-check (any value = on) | Variable presence enables dry-run; absence enables live | |

**User's choice:** Recommended path

### Phase 20 flip mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Single wrangler.jsonc value edit | Phase 20 commits `"DRY_RUN": "0"` as part of the atomic deploy commit alongside the new Resend POST call | ✓ |
| `wrangler secret delete` | Phase 20 runs CLI command; no source-tree change marking the flip moment | |
| Source-code const edit | Phase 20 edits `const DRY_RUN = true;` to `false` | |

**User's choice:** Recommended path

### Test-environment override seam

| Option | Description | Selected |
|--------|-------------|----------|
| No test seam — same posture everywhere | Production and preview both honor DRY_RUN identically; matches Phase 17 two-touch verification pattern | ✓ |
| Per-environment override via wrangler env.preview block | Allows post-Phase-20 preview environments to NOT send real emails | |
| `DRY_RUN_OVERRIDE` env in dev | Mirrors WR-04 ALLOW_LOOPBACK three-signal pattern | |

**User's choice:** Recommended path

---

## Phase 19 / Phase 20 boundary

### Render scope

| Option | Description | Selected |
|--------|-------------|----------|
| Envelope only (Path B) | Phase 19 logs structured fields { sid, to, from, reply_to, subject_skeleton, msg_count, truncated, country, referrer_host }; no body text rendered; Phase 20 ships the entire email-body renderer + HTML-escape + adversarial-payload suite as one tight unit | ✓ |
| Full renderer (Path A) | Phase 19 ships `src/lib/email/render.ts` with full text-body renderer + escape helpers + subject builder; Phase 20 only adds adversarial-payload tests + retry | |
| Subject + body skeleton, no escape | Middle ground: Phase 19 renders subject + body shell with raw user content; Phase 20 wraps in `escapeHtml()` + adversarial suite | |

**User's choice:** Envelope only (Path B) — matches roadmap intent that Phase 19 = scheduling + idempotency, Phase 20 = email render

### Envelope log line shape

| Option | Description | Selected |
|--------|-------------|----------|
| Flat fields per Workers-Logs convention | Single `console.log("chat.delivery.dry_run", { sid, to, from, reply_to, subject_skeleton, msg_count, truncated, country, referrer_host })`; flat primitives only matching DEBT-02 / Phase 18 transcript-log conventions | ✓ |
| Nested structure mirroring eventual Resend body | Log the actual JSON shape Phase 20's POST body will use | |
| Both — flat metrics + serialized envelope blob | Two log lines per session | |

**User's choice:** Flat fields per Workers-Logs convention

### `src/lib/email/resend.ts` existence in Phase 19

| Option | Description | Selected |
|--------|-------------|----------|
| No — fully deferred to Phase 20 | Phase 19 has NO Resend POST code path; DRY_RUN branch returns synthetic success directly; smallest Phase 19 footprint | ✓ |
| Yes — stub file with throw-on-call body | Phase 19 creates the file with a sendEmail that throws if called; locks signature now | |
| Yes — functional fetch wrapper never called | Phase 19 ships working fetch wrapper but DRY_RUN gates the call | |

**User's choice:** No — fully deferred to Phase 20

### Retry path location

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 19 ships retry harness with no real failure source | 3-try loop with exponential backoff wrapped around the (would-be) send call; unit-tested with mock that throws on attempts 1+2+3; production retries never fire under DRY_RUN | ✓ |
| Defer the retry path entirely to Phase 20 | Phase 19 single-attempt 'send'; CRON-03 retry-cap moves to Phase 20 | |
| Retry only the IDEMPOTENT internal steps | Retry KV `put(delivered:)` + `delete(live:)` but not the Resend POST | |

**User's choice:** Phase 19 ships retry harness with no real failure source

### Subject derivation scope

| Option | Description | Selected |
|--------|-------------|----------|
| No — subject also deferred to Phase 20 | Envelope log records `country`, `referrer_host`, `msg_count`, `truncated` as raw fields; Phase 20 composes the subject string | ✓ |
| Yes — subject skeleton lives in Phase 19 | Phase 19 derives `[Portfolio chat] N turns from <country> via <referrer-host>[ (truncated)]` server-side; Phase 20 adds adversarial-payload hardening (CR/LF stripping, bidi-override stripping) | |
| Just the prefix `[Portfolio chat]` and msg_count | Phase 19 logs half-rendered subject; Phase 20 appends the rest | |

**User's choice:** No — subject deferred to Phase 20

---

## delivered:{sid} value shape

### Marker shape

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal envelope with versioning | `{ v: 1, sid, delivered_at: ISO, dry_run: true, msg_count, truncated }`; Phase 20 extends additively to `{ v: 1, sid, delivered_at, dry_run: false, msg_count, truncated, resend_message_id }`; audit-useful | ✓ |
| Presence-only marker | Value: `'1'` literal; cheapest KV value; auditing requires inferring from key existence alone | |
| Full transcript copy from live:{sid} | Doubles KV storage for 24h; gives true 'sent transcript' archive | |
| Empty value (`''`) | Operationally identical to `'1'` marker | |

**User's choice:** Minimal envelope with versioning

### Schema versioning

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — versioned shape (`v: 1`) | Matches Phase 18 ChatTranscript.v: 1 pattern; any future shape change is explicitly versioned | ✓ |
| No — unversioned plain object | Saves 8 bytes per value; versioning a 24h-TTL value is arguably overkill | |

**User's choice:** Yes — versioned shape

### KV metadata field on delivered: writes

| Option | Description | Selected |
|--------|-------------|----------|
| Skip metadata on delivered: writes | No metadata field; cron sweep never lists `delivered:` prefix so metadata-on-list isn't needed; value itself is the idempotency-check read target | ✓ |
| Mirror the live: metadata shape | Include `{ metadata: { delivered_at, msg_count } }` on the put | |

**User's choice:** Skip metadata on delivered: writes

---

## Cron verification strategy

### Success criterion 1 verification method

| Option | Description | Selected |
|--------|-------------|----------|
| Operator-controlled manual UAT in 19-UAT.md | Codify as numbered step: operator edits wrangler.jsonc to `["* * * * *"]`, deploys, watches Past Events, reverts; matches Phase 17/18 UAT cadence | ✓ |
| Plan task with executor doing wire + revert + verify | Executor automates the wire + deploy + revert; conflicts with DEPLOY-GATE.md 'executor MUST NOT push' posture | |
| `wrangler dev --test-scheduled` local invocation only | Doesn't satisfy roadmap success criterion 1 (Past Events tab is a production-side surface) | |

**User's choice:** Operator-controlled manual UAT in 19-UAT.md

### Local-invocation tooling

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add `pnpm dev:cron` script | `"dev:cron": "wrangler dev --test-scheduled"` to package.json + `curl http://localhost:8787/__scheduled?cron=*+*+*+*+*` in 19-UAT.md as pre-flight check | ✓ |
| No — production UAT only | Skip local tooling; handler-wiring regressions surface only at deploy time | |
| Yes, but as a one-time SPIKE doc | Document the invocation pattern once without committing a package.json script | |

**User's choice:** Yes — add pnpm dev:cron script

### 19-UAT.md scope beyond `*****` verification (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| Seed-and-sweep — wrangler kv key put a stale live: + invoke cron + verify promotion | Closes CRON-02 success criterion 2 end-to-end | ✓ |
| Idempotency double-tap — invoke sweep twice, verify second pass `sessions_promoted: 0` | Closes success criterion 3 | ✓ |
| Pagination/batch-cap stress — seed >50 live: keys + verify batch boundary holds | Closes CRON-03 batch-cap success criterion 4 | ✓ |
| Backlog cleanup — verify the seeded UAT keys do not pollute production KV after revert | Operational hygiene | ✓ |

**User's choice:** All four UAT steps selected (5 total steps including the `*****` verification)

---

## Claude's Discretion

Areas where Claude has flexibility (not explicitly asked, but agreed by user's "ready for context" advancement):

- Internal `chat-delivery.ts` module shape — function signature locked, internal helper structure planner's call
- Pagination batching strategy specifics — inside-batch fill vs page-per-tick; locked invariants are per-tick batch cap 50 + pagination hard-cap 50 pages
- Retry backoff curve specifics — exponential / linear / full-jitter / constant; only max-3-attempts is locked
- Per-tick log summary field set — recommended `{ sessions_seen, sessions_due, sessions_promoted, errors, pages_scanned, elapsed_ms }`; planner may extend
- Log line field ordering — names locked, order presentational
- D-26 forward-defense test additions — optional `tests/build/worker-scheduled-call-site.test.ts` and `tests/build/wrangler-cron-shape.test.ts`
- Whether `chat-delivery.ts` imports types from `chat-transcripts.ts` — recommended for type-safety but planner picks

---

## Deferred Ideas

(See CONTEXT.md `<deferred>` block for the canonical list. Highlights:)

- Real Resend `fetch()` wrapper + adversarial-payload suite + retry-on-5xx live verification — Phase 20
- Subject derivation + email body rendering — Phase 20
- `Idempotency-Key: transcript/<sid>` Resend-layer idempotency — Phase 20 (Layer 2; Phase 19's `delivered:{sid}` is Layer 1)
- `/api/resend-webhook` with Svix HMAC + Cloudflare Workers Analytics Engine — v1.4+ per STATE.md
- Per-IP rate limit + Workers Paid plan + HTML email body — v1.4+
- Cross-cron-tick coordination via `delivery_lock:{sid}` — explicitly skipped per RESEARCH § Pitfall 4 Layer 3 recommendation
- Configurable inactivity threshold via env var — 2h is locked
