---
phase: 19
slug: cron-sweep-scheduling-idempotency-dry-run
status: verified
threats_open: 0
asvs_level: 1
created: 2026-05-12
---

# Phase 19 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Verified retroactively from Plan 19-01..19-04 `<threat_model>` blocks against the live implementation. Register authored at plan time; auditor verified mitigations exist.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| operator → wrangler.jsonc / package.json | Pre-deploy config edit and UAT-time cron-string flips | Public config (cron schedule, DRY_RUN toggle); no secrets |
| build pipeline → worker-configuration.d.ts | wrangler types regeneration after Env interface extension | Type definitions only; no runtime data |
| Cloudflare cron scheduler → src/worker.ts scheduled() | Hourly cron invocation; `controller.scheduledTime` is platform-supplied | Platform-controlled timestamp |
| scheduled() handler → ctx.waitUntil | Promise lifecycle boundary; `.catch` chained INSIDE per Phase 18 D-09 | Promise/error propagation |
| chat-delivery.ts → env.CHAT_KV | KV list/get/put/delete on `live:` and `delivered:` keyspaces | Transcripts already validated by Phase 18 KV-04 (30-turn cap, 512-char referrer/UA truncation) |
| chat-delivery.ts → console.log/warn/error → Workers Logs | Log ingestion surface; flat-primitive convention enforced | Envelope-only fields: sid, country (ISO), referrer_host (hostname), msg_count, dry_run |
| operator → production KV via wrangler CLI | UAT seeding of `test-uat-*` keys + Step 5 cleanup | Test data only; production KV stays clean post-UAT |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-19-01-01 | Tampering | wrangler.jsonc vars.DRY_RUN | mitigate | Strict-equals-string at `src/lib/chat-delivery.ts:167, 272`; build test `tests/build/wrangler-cron-shape.test.ts:47-50` source-text-locks `vars.DRY_RUN === "1"` | closed |
| T-19-01-02 | Information Disclosure | Env.DRY_RUN typed as plain string | accept | DRY_RUN is a public toggle, not a secret; Cloudflare `vars` block is the documented home for non-sensitive env vars (`wrangler.jsonc:20-23`) | closed |
| T-19-01-03 | Repudiation | dev:cron local npm script | accept | Local dev convenience only (`package.json:12`); no production state mutation possible | closed |
| T-19-02-01 | Spoofing | DRY_RUN env value misread | mitigate | Strict-equals `env.DRY_RUN === "1"` at `src/lib/chat-delivery.ts:167, 272`; `Boolean(env.DRY_RUN)` rejected at decision time per D-02; locked by Group D cases 9+10 at `tests/api/chat-delivery.test.ts:507-583` | closed |
| T-19-02-02 | Tampering | delivered:{sid} marker overwritten | accept | Last-writer-wins per KV semantics; idempotency cursor is a hint, not a lock. 24h TTL bounds blast radius (`src/lib/chat-delivery.ts:53, 277`). Cryptographic-grade dedupe deferred to Phase 20 Resend `Idempotency-Key` | closed |
| T-19-02-03 | Repudiation | failed send not logged | mitigate | Per-attempt `console.error("chat.delivery.failed")` at `src/lib/chat-delivery.ts:219, 244, 292`; per-tick summary log emits `errors` count; Group G case 16 at `tests/api/chat-delivery.test.ts:819-851` | closed |
| T-19-02-04 | Information Disclosure | DRY_RUN envelope log fields | accept | `country` = `request.cf.country` (ISO-3166 code); `referrer_host` derived via `hostnameOrNull` helper at `src/lib/chat-delivery.ts:108-115` (strips path/query). Phase 20 will touch actual message content | closed |
| T-19-02-05 | Denial of Service | unbounded pagination loop | mitigate | `PAGINATION_PAGE_HARDCAP = 50` at `src/lib/chat-delivery.ts:49, 365`; loop exits on `list_complete` OR 50 pages OR `PER_TICK_BATCH_CAP`; Group F case 14 at `tests/api/chat-delivery.test.ts:727-760` | closed |
| T-19-02-06 | Denial of Service | one bad session aborts entire sweep | mitigate | Per-session try/catch in promoteOne at `src/lib/chat-delivery.ts:214-225, 238-250, 261-317`; Group G case 18 at `tests/api/chat-delivery.test.ts:877-922` | closed |
| T-19-02-07 | Denial of Service | retry harness amplifies inner failure | mitigate | `MAX_SEND_ATTEMPTS = 3` cap at `src/lib/chat-delivery.ts:50`; `BACKOFF_CAP_MS = 5000` ceiling at `:52`; locked by assertion at `tests/api/chat-delivery.test.ts:850` | closed |
| T-19-02-08 | Elevation of Privilege | chat-delivery.ts reaches into chat surface | mitigate | Pure-module discipline locked by forbidden-import grep — zero matches for `@anthropic-ai/sdk`, `cloudflare:workers`, `src/pages/`, `src/scripts/`, `src/prompts/`, `src/lib/email/` in `chat-delivery.ts` | closed |
| T-19-03-01 | Repudiation | scheduled() failure silently swallowed by ctx.waitUntil | mitigate | `.catch` chained INSIDE the promise per Phase 18 D-09 at `src/worker.ts:72-78`; Invariant C source-text guard at `tests/build/worker-scheduled-call-site.test.ts:42-53` | closed |
| T-19-03-02 | Tampering | future contributor removes `.catch` or destructures ctx | mitigate | Invariants C+D at `tests/build/worker-scheduled-call-site.test.ts:42-105` (broadened anti-destructure assertion) fail at build time | closed |
| T-19-03-03 | Denial of Service | deliverDue blocks scheduled() past wall-clock | accept | Bounded by Plan 19-02 caps: 50-session batch + 50-page pagination + 3-try retry → ~50s worst case under Cloudflare's scheduled() budget. DRY_RUN no-op send under Phase 19 dominates wall time with KV latency only | closed |
| T-19-03-04 | Information Disclosure | worker.scheduled.failed log leaks stack | mitigate | Only `error_class` (constructor name) logged at `src/worker.ts:75` — no message, no stack; grep returns zero matches for `err.message` / `err.stack`; Invariant E at `tests/build/worker-scheduled-call-site.test.ts:107-115` | closed |
| T-19-04-01 | Tampering | operator forgets to revert `* * * * *` after UAT | mitigate | `tests/build/wrangler-cron-shape.test.ts:44` exact-array `.toEqual(["0 * * * *"])`; `tests/build/wrangler-shape.test.ts:48` lockstep; UAT Step 1 REVERT CHECK; UAT 5/5 PASS per commit `cc45734` | closed |
| T-19-04-02 | Tampering | DRY_RUN accidentally set to "0" before Phase 20 ships | mitigate | `tests/build/wrangler-cron-shape.test.ts:47-50` Invariant 2 source-text-locks `vars.DRY_RUN === "1"`; Phase 20 will invert wrangler.jsonc value AND test's expected value in a single visible PR diff | closed |
| T-19-04-03 | Information Disclosure | test-uat-* keys left in production KV after UAT | mitigate | `19-UAT.md` Step 5 operator cleanup prescribed and PASSED per commit `cc45734`; `test-uat-*` prefix discipline ensures greppable cleanup via `wrangler kv key list --prefix test-uat-` | closed |
| T-19-04-04 | Denial of Service | `* * * * *` UAT flip not reverted → 60× cron load | mitigate | Build test `wrangler-cron-shape.test.ts:44` locks correct cron string; Free tier 5,000 cron invocations/day cap; `*****` = 1,440/day worst case for 1 day before CI catches | closed |
| T-19-04-05 | Repudiation | Phase 19 cron-runs silent in production logs | accept | `chat.delivery.tick` summary log emits on every cron firing at `src/lib/chat-delivery.ts:416-423` (visible via `wrangler tail` / Workers Logs); DRY_RUN-driven mechanics validation is the design intent until Phase 20 ships | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-19-01 | T-19-01-02 | DRY_RUN is a public toggle, not a secret. Cloudflare `vars` block is the documented home for non-sensitive env vars. No PII or credentials in the value | Jack Cutrara | 2026-05-12 |
| AR-19-02 | T-19-01-03 | `dev:cron` is local-only convenience (`wrangler dev --test-scheduled`); no production state mutation possible | Jack Cutrara | 2026-05-12 |
| AR-19-03 | T-19-02-02 | KV last-writer-wins semantics accepted as design; the `delivered:{sid}` marker is an idempotency hint, not a cryptographic lock. 24h TTL bounds blast radius. Phase 20 Resend `Idempotency-Key` provides cryptographic-grade dedupe | Jack Cutrara | 2026-05-12 |
| AR-19-04 | T-19-02-04 | Envelope log fields are non-PII by construction: `country` is the ISO-3166 code from `request.cf.country`; `referrer_host` strips path/query via `new URL(...).hostname`. Phase 20 is the surface that will handle actual message content | Jack Cutrara | 2026-05-12 |
| AR-19-05 | T-19-03-03 | Wall-clock DoS bounded by Plan 19-02 caps (50-session batch × 50-page pagination × 3-try retry); under DRY_RUN the inner send is a no-op log line, so actual wall time is dominated by KV latency only — well under Cloudflare's scheduled() budget | Jack Cutrara | 2026-05-12 |
| AR-19-06 | T-19-04-05 | Silent-in-PROD-logs accepted by design — the `chat.delivery.tick` summary log line emits on every cron firing (visible via `wrangler tail`); DRY_RUN-driven mechanics validation IS the design intent until Phase 20 enables the Resend send | Jack Cutrara | 2026-05-12 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-12 | 20 | 20 | 0 | gsd-security-auditor (opus, ASVS L1) |

### Security Audit 2026-05-12

| Metric | Count |
|--------|-------|
| Threats found | 20 |
| Closed | 20 |
| Open | 0 |
| Mitigated | 14 |
| Accepted | 6 |
| ASVS level | 1 |
| Block-on | high |

Register origin: `register_authored_at_plan_time: true` (all 4 plans 19-01..19-04 carried `<threat_model>` blocks). Auditor ran in verification mode — checked each claimed mitigation exists in the implementation; did not scan for new threats.

Implementation files verified read-only:
- `src/worker.ts`
- `src/lib/chat-delivery.ts`
- `wrangler.jsonc`
- `package.json`
- `tests/api/chat-delivery.test.ts`
- `tests/build/worker-scheduled-call-site.test.ts`
- `tests/build/wrangler-cron-shape.test.ts`
- `tests/build/wrangler-shape.test.ts`
- `tests/build/worker-entrypoint.test.ts`

Unregistered flags surfaced: none. SUMMARY `## Threat Flags` sections for Plans 19-02, 19-03, 19-04 all state "None"; Plan 19-01 was config-only scaffolding with no new runtime attack surface.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-12
