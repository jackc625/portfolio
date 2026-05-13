# Phase 20 Security Audit — SECURITY.md

**Phase:** 20 — email-render-resend-integration
**Audited:** 2026-05-13
**Auditor:** gsd-security-auditor
**Threats Closed:** 27/27
**ASVS Level:** L1
**block_on:** HIGH
**Register authored at plan time:** true

## Summary

All 27 threats in the Phase 20 threat register (T-20-01-01 through T-20-04-06) verified. 21 `mitigate` threats have code-level evidence; 6 `accept` threats are documented below as accepted risks.

No `## Threat Flags` sections were emitted in any of the four Phase 20 SUMMARY.md files (20-01..20-04), so there are no unregistered_flag entries to log.

---

## Plan 20-01 — Renderer (src/lib/email/render.ts)

### T-20-01-01 | Spoofing — Visitor fake provenance impersonation | CLOSED (mitigate)

**Evidence:**
- `src/lib/email/render.ts:68-69` — PROVENANCE literal locked.
- `src/lib/email/render.ts:370-380` (composeBody return) — `PROVENANCE` is emitted BEFORE the `turnLines` block (which contains all `>>> visitor:` markers).
- `tests/api/email-render.adversarial.test.ts:166-169` — universal invariant `firstProvenanceIdx >= 0` AND `firstProvenanceIdx < firstVisitorMarkerIdx` asserted on every adversarial row including the `social engineering provenance` row.
- `tests/api/email-render.adversarial.test.ts:260-275` — standalone "provenance literal appears exactly once across all adversarial payloads" with positional invariant.

### T-20-01-02 | Tampering — Visitor HTML/script/img injection | CLOSED (mitigate)

**Evidence:**
- `src/lib/email/render.ts:165-172` — `htmlEscape` function escapes `& < > " '`.
- `src/lib/email/render.ts:180-183` — `escapeBodyField` applies pipeline including `htmlEscape` last.
- `src/lib/email/render.ts:354-368` — every dynamic field flows through `escapeBodyField` (sid, country, region, referrer, user_agent, turn content).
- `tests/api/email-render.adversarial.test.ts:79-97` — `it.each` rows assert `&lt;script&gt;`, `&lt;/script&gt;`, `&lt;img src=x onerror=alert(1)&gt;` entity-encoded forms present.

### T-20-01-03 | Tampering — Bidi-override Unicode injection | CLOSED (mitigate)

**Evidence:**
- `src/lib/email/render.ts:148-159` — `stripBidiOverrides` covers all 9 codepoints: U+061C ALM, U+200E LRM, U+200F RLM, U+202A-U+202E, U+2066-U+2069.
- `src/lib/email/render.ts:182` — applied in `escapeBodyField`.
- `src/lib/email/render.ts:231` — applied in `sanitizeSubjectToken`.
- `tests/api/email-render.adversarial.test.ts:177-201` — "bidi strip" test iterates all 9 codepoints, asserts zero occurrence in output AND regex `/[‪-‮⁦-⁩]/u.test(text) === false`.
- `tests/api/email-render.adversarial.test.ts:208-217` — WR-03 `it.each` asserts ALM, LRM, RLM stripped (added per Phase 20 code review).

### T-20-01-04 | Tampering — Null byte injection | CLOSED (mitigate)

**Evidence:**
- `src/lib/email/render.ts:132-135` — `stripControlChars` strips `\x00-\x08, \x0B-\x0C, \x0E-\x1F, \x7F` (preserves `\t \n \r`).
- `src/lib/email/render.ts:182` — first stage of body sanitizer.
- `src/lib/email/render.ts:231` — first stage of subject sanitizer.
- `tests/api/email-render.adversarial.test.ts:117-124` — null-bytes it.each row.
- `tests/api/email-render.adversarial.test.ts:219-225` — "null byte strip" standalone test.

### T-20-01-05 | Tampering — CRLF in referrer for Subject header injection | CLOSED (mitigate)

**Evidence:**
- `src/lib/email/render.ts:140-143` — `stripCrLf` strips `/[\r\n]/g`.
- `src/lib/email/render.ts:229-233` — `sanitizeSubjectToken` applies `stripCrLf` (subject-only stage).
- `src/lib/email/render.ts:242-249` — `composeSubject` routes both country and referrer-host tokens through `sanitizeSubjectToken`.
- `tests/api/email-render.test.ts:540-544` — subject-level `\r` / `\n` absence assertions.

### T-20-01-06 | Information Disclosure — PII verbatim reproduction | ACCEPTED

**Accepted risk:** Verbatim reproduction of visitor content (including any PII) to Jack's Gmail is the product requirement (MAIL-02). No PII filtering at v1.3. Visitor messages flow under `>>> visitor:` markers so PII attribution is clear; html-escape sanitizer (T-20-01-02) still applies defensively for v1.4+ HTML migration.

### T-20-01-07 | Tampering — Non-determinism in renderer | CLOSED (mitigate)

**Evidence:**
- Source-text grep on `src/lib/email/render.ts` for `Date\.now|crypto\.randomUUID|process\.env` returns 3 matches, ALL in JSDoc/file-banner comments documenting their absence (lines 34, 35, 391). Zero runtime call sites.
- `src/lib/email/render.ts:399-411` — `renderEmail` body uses only the threaded `env` arg + `transcript` fields; no clock/UUID/env reads.
- `src/lib/email/render.ts:330-341` — timestamps via `Date.parse(transcript.started_at)` / `Date.parse(transcript.last_activity_at)`, sourced from transcript fields, not from runtime clock.
- `tests/api/email-render.test.ts:551-588` — "renderer purity" test asserts `renderEmail(ENV, t)` deep-equal `renderEmail(ENV, t)` across two invocations including identity-by-value on each field.

---

## Plan 20-02 — Resend wrapper (src/lib/email/resend.ts)

### T-20-02-01 | Information Disclosure — RESEND_API_KEY logged via headers | CLOSED (mitigate)

**Evidence:**
- Source-text grep on `src/lib/email/resend.ts` for `console\.(log|error).*headers|console\.(log|error).*RESEND_API_KEY|console\.(log|error).*Authorization` returns 0 matches.
- `src/lib/email/resend.ts:221-225` — `chat.delivery.sent` log emits only flat primitives (sid, resend_message_id, attempt).
- `src/lib/email/resend.ts:241-247` — `chat.delivery.retry` log emits flat primitives only.
- `src/lib/email/resend.ts:260-265` — `chat.delivery.failed` log emits flat primitives only.
- The `Authorization: Bearer ${env.RESEND_API_KEY}` header at line 185 is consumed by `fetch` only, never logged.

### T-20-02-02 | Tampering — idempotencyKey in body | CLOSED (mitigate)

**Evidence:**
- `src/lib/email/resend.ts:178` — `const { idempotency_key, ...body } = payload;` destructures idempotency_key OUT of body.
- `src/lib/email/resend.ts:190` — body passed to `JSON.stringify(body)`, not the full payload.
- `src/lib/email/resend.ts:187` — `Idempotency-Key` header gets the value separately.
- `tests/api/email-resend.test.ts:327-352` — "text field only" test asserts `Object.keys(parsed)` equals `["from", "to", "reply_to", "subject", "text"]` exactly, and `"idempotency_key" in parsed === false`.

### T-20-02-03 | Denial of Service — Hung connection consumes batch budget | CLOSED (mitigate)

**Evidence:**
- `src/lib/email/resend.ts:82` — `FETCH_TIMEOUT_MS = 10_000` constant.
- `src/lib/email/resend.ts:171-172` — `AbortController` + `setTimeout(controller.abort(), FETCH_TIMEOUT_MS)` at start of every `sendEmail` invocation.
- `src/lib/email/resend.ts:191` — `signal: controller.signal` passed to fetch.
- `src/lib/email/resend.ts:304-307` — `finally { clearTimeout(timeoutId); }` on every exit path (Landmine 2).
- `tests/api/email-resend.test.ts:258-296` — "abort timeout" test under `vi.useFakeTimers()` advances 11s, asserts `DOMException("AbortError")` flows to `failed_transient` result.

### T-20-02-04 | Repudiation — No audit trail | CLOSED (mitigate)

**Evidence:**
- `src/lib/email/resend.ts:221-225` — every 200-OK emits `chat.delivery.sent { sid, resend_message_id: data.id, attempt }`.
- `tests/api/email-resend.test.ts:138-156` — "200 sent" test asserts both `sid` and `resend_message_id` fields present in log line.
- Phase 20 forensics path: `wrangler tail --search "chat.delivery.sent" | grep <sid>` cross-references Resend Dashboard by the same `resend_message_id`.

### T-20-02-05 | Tampering — Resend 200 with malformed body | ACCEPTED (stronger than planned)

**Accepted risk superseded by CR-02 mitigation:** Plan-time disposition was `accept` with rationale "Layer 1 KV cursor still prevents duplicates". Phase 20 code review (CR-02) tightened the behavior beyond the accept disposition: `src/lib/email/resend.ts:205-220` validates `typeof data.id === "string" && data.id.length > 0` at runtime; missing/empty id returns `failed_transient` with `error_class: "resend_2xx_missing_id"` and emits `chat.delivery.retry`. `tests/api/email-resend.test.ts:165-195` exercises 4 malformed-body variants. The original accept stands as a documented residual risk (Resend documents successful sends always include an id; expected false-transient rate near zero).

### T-20-02-06 | Tampering — Global batch abort breaks per-session isolation | CLOSED (mitigate)

**Evidence:**
- Source-text grep on `src/lib/email/resend.ts` for `setTimeout.*abortBatch|abortBatch` returns 0 matches.
- `src/lib/email/resend.ts:46-50` — Landmine 8 banner explicitly cites "FETCH_TIMEOUT_MS is per-attempt; NO batch-level abort exists in this module".
- `src/lib/email/resend.ts:82` — `FETCH_TIMEOUT_MS = 10_000` is the only timeout constant.
- `src/lib/email/resend.ts:171-172` — `AbortController` is instantiated INSIDE the per-call `sendEmail` body, ensuring scope is per-attempt.

### T-20-02-07 | Information Disclosure — 409 vs 422 indistinguishable | CLOSED (mitigate)

**Evidence:**
- `src/lib/email/resend.ts:260-265` — `console.error("chat.delivery.failed", { sid, http_status: response.status, error_class, attempt })` includes the discriminating http_status field on every 4xx-except-429 path.
- `src/lib/email/resend.ts:266-271` — returned `failed_terminal` carries `http_status` field.
- `tests/api/email-resend.test.ts:228-254` — `it.each` row for status 409 (`idempotency_conflict`) asserts the `chat.delivery.failed` log carries `http_status: 409`, grep-distinguishable from 400/401/403/422 rows in the same it.each table.

---

## Plan 20-03 — Substitution (src/lib/chat-delivery.ts + wrangler.jsonc + src/worker.ts)

### T-20-03-01 | Tampering — DRY_RUN branch deleted as "dead code" | CLOSED (mitigate)

**Evidence:**
- `src/lib/chat-delivery.ts:211-237` — DRY_RUN === "1" branch preserved with explicit `ROLLBACK RUNWAY — DO NOT DELETE` comment block (lines 211-223).
- `src/lib/chat-delivery.ts:224` — `if (env.DRY_RUN === "1") {` regex-locked by test.
- `src/lib/chat-delivery.ts:226` — `console.log("chat.delivery.dry_run", ...)` log emission locked by test.
- `tests/build/chat-delivery-send-site.test.ts:49-54` — Invariant D regex-matches `/if\s*\(\s*env\.DRY_RUN\s*===\s*['"]1['"]\s*\)/`.
- `tests/build/chat-delivery-send-site.test.ts:56-61` — Invariant E asserts `chat.delivery.dry_run` source-text presence.

### T-20-03-02 | Tampering — metadata field added to delivered: kv.put | CLOSED (mitigate)

**Evidence:**
- `src/lib/chat-delivery.ts:401-406` — `env.CHAT_KV.put` options object literal is exactly `{ expirationTtl: DELIVERED_TTL_SECONDS }`. Inline comment cites Landmine 7 + D-11.
- `tests/api/chat-delivery.test.ts:1297-1329` — "delivered marker no metadata (Landmine 7)" test asserts `options` deep-equals `{ expirationTtl: DELIVERED_TTL_SECONDS }`, `Object.keys(options) === ["expirationTtl"]`, and `options.metadata === undefined`.

### T-20-03-03 | Tampering — UAT cron flip not reverted | CLOSED (mitigate)

**Evidence:**
- `wrangler.jsonc:28` — `"crons": ["0 * * * *"]` (hourly).
- `tests/build/wrangler-dry-run-shape.test.ts:32-34` — asserts `cfg.triggers.crons === ["0 * * * *"]`.
- `tests/build/wrangler-cron-shape.test.ts:41-51` — asserts the same on the Plan 19-04 attribution test.
- Two-file forward-defense; either file's CI failure catches the un-reverted state.

### T-20-03-04 | Tampering — Operator pushes with DRY_RUN === "1" | CLOSED (mitigate)

**Evidence:**
- `wrangler.jsonc:24` — `"DRY_RUN": "0"`.
- `tests/build/wrangler-dry-run-shape.test.ts:27-30` — Invariant 1 asserts `cfg.vars.DRY_RUN === "0"`.
- `tests/build/wrangler-cron-shape.test.ts:53-56` — Plan 19-04 attribution test asserts same.
- `DEPLOY-GATE.md` section 5 — operator pre-push checklist verifies `wrangler.jsonc` line 24 `"DRY_RUN": "0"` literal; CONFIRMED on 2026-05-13.

### T-20-03-05 | Information Disclosure — resend_message_id logged into tick summary | ACCEPTED

**Accepted risk:** `resend_message_id` is the canonical Resend send id (UUID-shape opaque). Not PII; not a secret. Designed to be shared between Resend dashboard and Workers Logs as the cross-system audit anchor. Confirmed: `chat.delivery.tick` summary at `src/lib/chat-delivery.ts:541-548` carries only flat aggregate counters (no per-session resend_message_id leakage by design).

### T-20-03-06 | Repudiation — No audit correlation between Workers Logs and Resend | CLOSED (mitigate)

**Evidence:**
- `src/lib/chat-delivery.ts:399` — `DeliveredMarker.resend_message_id: sendResult.message_id` populated from sendEmail Result.
- `src/lib/email/resend.ts:223` — `chat.delivery.sent` log carries `resend_message_id: data.id` (same Resend `data.id`).
- Cross-check forensics path: `wrangler tail --search "chat.delivery.sent" | grep <sid>` returns log line with the same `resend_message_id` that the Resend dashboard shows for the same send.
- `20-UAT.md` Step 3 PASS criterion 6 + 7 — operator verifies cross-system match.

### T-20-03-07 | Denial of Service — Retry burn × batch cap | ACCEPTED

**Accepted risk:** PER_TICK_BATCH_CAP=50 × MAX_SEND_ATTEMPTS=3 = 150 attempts/tick worst case. With 10s per-attempt timeout and Resend's 5 req/sec rate limit, the per-session try/catch isolation in `promoteOne` bounds blast radius. Operator monitoring via `chat.delivery.tick` `elapsed_ms` field; Phase 19 batch cap was sized for this contingency.

---

## Plan 20-04 — Deploy gate (20-UAT.md + DEPLOY-GATE.md)

### T-20-04-01 | Repudiation — No audit trail of pre-deploy verification | CLOSED (mitigate)

**Evidence:**
- `.planning/phases/20-email-render-resend-integration/DEPLOY-GATE.md` exists.
- Frontmatter: `status: confirmed`, `gate: CONFIRMED`, `operator: Jack Cutrara`, `confirmed: 2026-05-13`.
- 5-section pre-deploy checklist completed (lines 75-79).
- Operator signature on line 81 + audit-trail explanation on lines 84-91 (`approved — deploy gate cleared` chat-reply mechanism per Plan 17-08 precedent).

### T-20-04-02 | Tampering — UAT cron flip not reverted | CLOSED (mitigate)

**Evidence:** Same as T-20-03-03 — `tests/build/wrangler-dry-run-shape.test.ts` + `tests/build/wrangler-cron-shape.test.ts` both lock `triggers.crons === ["0 * * * *"]`. DEPLOY-GATE.md section 5 confirms cron pre-push.

### T-20-04-03 | Tampering — Operator pushes without DRY_RUN flip | CLOSED (mitigate)

**Evidence:** Same as T-20-03-04 — `tests/build/wrangler-dry-run-shape.test.ts` Invariant 1 + DEPLOY-GATE.md section 5 line 65. Plan 20-03 substitution and DRY_RUN flip shipped in the same commit `8bba4ef` per D-01 atomic-deploy lock.

### T-20-04-04 | Information Disclosure — Operator screenshots visitor PII in UAT result | ACCEPTED

**Accepted risk:** Test-uat-* sids are operator-controlled UUIDs (no PII) and Step 1-5 use synthetic seed content. Step 6 organic real-traffic UAT result block records evidence at operator's discretion; redaction is operator's responsibility per 20-UAT.md guidance.

### T-20-04-05 | Denial of Service — Push during high-traffic window hits Resend rate limit | ACCEPTED

**Accepted risk:** Resend default 5 req/sec per team is well above portfolio v1.3 traffic projection. Phase 19 PER_TICK_BATCH_CAP=50 with serialized per-session loop in `deliverDue` already bounds per-tick fetch rate. Operator may defer push to low-traffic window at their discretion.

### T-20-04-06 | Repudiation — First organic email lands in Spam | CLOSED (mitigate)

**Evidence:**
- Plan 17-06 enrolled Postmaster Tools + warmed domain (5/5 Inbox at warmup) — DKIM/SPF/DMARC live.
- `20-UAT.md` Step 6 provides 7-day soft cap fallback via `scripts/resend-warmup.mjs` proxy, allowing in-the-wild idempotency verification if no organic traffic arrives.
- Audit trail preserved either way (Step 6 result block).

---

## Accepted Risks Log

The following 6 threats carry `accept` disposition with documented rationale. No code-side action required; risks are bounded by product/operational context.

| Threat ID | Category | Rationale |
|-----------|----------|-----------|
| T-20-01-06 | Information Disclosure | Verbatim PII reproduction is MAIL-02 product requirement. Defense-in-depth html-escape still applies for v1.4+ HTML body. |
| T-20-02-05 | Tampering | Resend 200 with malformed body — Code Review CR-02 tightened beyond plan-time accept: runtime `typeof data.id === "string" && data.id.length > 0` validation returns `failed_transient` with `error_class: "resend_2xx_missing_id"`. Residual accept retained for documentation continuity; near-zero expected false-transient rate. |
| T-20-03-05 | Information Disclosure | resend_message_id is opaque Resend id; not PII / not a secret; designed cross-system audit anchor. |
| T-20-03-07 | Denial of Service | 50×3=150 attempt cap × 10s/attempt × Resend 5 req/sec rate limit absorbs worst case. Per-session try/catch isolation prevents single-bad-session starvation. |
| T-20-04-04 | Information Disclosure | UAT seed content is synthetic (no PII); organic Step 6 result block redaction is operator's discretion. |
| T-20-04-05 | Denial of Service | Resend default 5 req/sec >> portfolio v1.3 traffic projection. Operator may schedule push at low-traffic window. |

## Unregistered Flags

None. No SUMMARY.md in this phase (20-01..20-04) emitted a `## Threat Flags` section. No new attack surface appeared during implementation outside the plan-time threat register.

---

## Audit Verdict

**ALL 27 THREATS RESOLVED.** 21 mitigations verified by file:line evidence; 6 accepted risks documented above. No BLOCKER findings. No WARNING findings.

Phase 20 cleared for security audit.
