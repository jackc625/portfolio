# Phase 19: Cron Sweep — Scheduling + Idempotency (DRY_RUN) - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 19 wires the cron-driven half of the transcript pipeline that Phase 18 fed and Phase 20 will complete. Everything except the actual Resend POST ships in this phase, all under a DRY_RUN flag:

1. **Hourly cron trigger** — `wrangler.jsonc` `triggers.crons: ["0 * * * *"]` (locked); `src/worker.ts` `scheduled()` handler replaces its current breadcrumb stub with `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch((err) => console.error("worker.scheduled.failed", { error_class: err?.name ?? "Error" })))` — the `.catch()` chained INSIDE the promise (per Phase 18 D-09 pattern; `ctx.waitUntil` swallows rejections without it).

2. **NEW module `src/lib/chat-delivery.ts`** — exports `deliverDue(env, scheduledTime?)`. Internal pipeline: `list({ prefix: "live:" })` with cursor pagination → filter `metadata.last_activity_at < now − 2h` → for each due session: read `live:{sid}` value → check `delivered:{sid}` absence (idempotency cursor) → call the would-be-send harness (DRY_RUN-gated) → PUT `delivered:{sid}` (24h TTL) BEFORE the would-be POST → DELETE `live:{sid}` AFTER dry-run "success" — the same crash-safe sequence Phase 20 will rely on byte-for-byte. Per-session try/catch isolates failures. Per-tick batch cap of 50 sessions, send-attempt counter cap of 3 retries, pagination hard-cap of 50 pages (all locked numerically by CRON-03).

3. **DRY_RUN flag** — `wrangler.jsonc` `vars.DRY_RUN = "1"`; checked via `env.DRY_RUN === "1"` in `chat-delivery.ts`. Under DRY_RUN, the inner "send" is a flat-field structured log line (`console.log("chat.delivery.dry_run", { sid, to, from, reply_to, msg_count, truncated, country, referrer_host, ... })`) that always "succeeds." NO `src/lib/email/resend.ts` exists in Phase 19 — fully deferred to Phase 20. NO subject derivation happens in Phase 19 — `subject` field is absent or null in the envelope log; Phase 20 derives `[Portfolio chat] N turns from <country> via <referrer-host>[ (truncated)]` server-side. NO retry actually fires in production (the inner call always succeeds under DRY_RUN), but the retry harness STRUCTURE exists and is unit-tested with a mock that throws on attempts 1+2+3.

4. **`delivered:{sid}` value shape (locked)** — `{ v: 1, sid, delivered_at: ISO8601, dry_run: true, msg_count, truncated }`. Schema-versioned (matches Phase 18 `ChatTranscript.v: 1` convention). 24h `expirationTtl`. NO KV `metadata` field on `delivered:` writes (the cron sweep never lists `delivered:` prefix — `live:` is the only prefix listed; the value itself is the idempotency-check read target). Phase 20 will extend additively to the same shape — adds `resend_message_id` field, flips `dry_run` to `false`.

5. **Structured JSON per-tick summary log** — `console.log("chat.delivery.tick", { sessions_seen, sessions_due, sessions_promoted, errors, pages_scanned, elapsed_ms })` emitted at end of `deliverDue`. Flat primitives only per the Phase 17/18 Workers-Logs convention (DEBT-02 pattern from Plan 17-05 commit `7c3827e`).

6. **Local-invocation tooling** — Phase 19 adds `"dev:cron": "wrangler dev --test-scheduled"` to package.json scripts. Operator invokes via `curl http://localhost:8787/__scheduled?cron=*+*+*+*+*` to exercise the handler against local KV state. Documented in 19-UAT.md as a pre-flight check before the production `*****` verification.

7. **`19-UAT.md`** — manual operator UAT spec matching the Phase 17 / Phase 18 UAT precedent. Five numbered steps, each with `wrangler` commands + expected log/KV-shape + `result:` block for operator to fill in:
   - Step 1: `*****` Past-Events verification (success criterion 1 closure)
   - Step 2: Seed-and-sweep end-to-end — operator `wrangler kv key put live:test-uat-<sid>` with stale `last_activity_at`, invokes cron, verifies `delivered:test-uat-<sid>` exists with versioned envelope, `live:test-uat-<sid>` is null, `wrangler tail` shows `chat.delivery.dry_run` + `chat.delivery.tick` log lines
   - Step 3: Idempotency double-tap — re-invoke sweep, verify `sessions_promoted: 0` for the seeded sid (delivered: marker present)
   - Step 4: Pagination/batch-cap stress — bash loop seeds 60 stale `live:test-uat-*` keys, invokes cron, verifies first tick `sessions_due: 60` but `sessions_promoted: 50`, re-invokes for remaining 10
   - Step 5: Backlog cleanup — operator deletes all `live:test-uat-*` + `delivered:test-uat-*` keys via `wrangler kv key delete`, verified empty via `wrangler kv key list --prefix test-uat-`

**Phase exit gates (non-negotiable):**

- **CRON-01..04 GREEN** — wrangler `triggers.crons: ["0 * * * *"]` declared; `scheduled()` handler delegates to `deliverDue(env, controller.scheduledTime)`; `src/lib/chat-delivery.ts` exports `deliverDue` with the full two-keyspace + batch-cap + retry-harness + DRY_RUN-gated structure; `DRY_RUN` env flag wired and toggles the inner send call.
- **D-26 chat regression battery GREEN at phase close** — Phase 19 touches ZERO chat-surface files (`chat.ts` / `api/chat.ts` / `validation.ts` / `ChatWidget.astro` / `global.css` are all UNTOUCHED). Run as forward-defense: the battery is expected to be byte-identical from Phase 18 close (419 PASS / 0 FAIL / 2 SKIP per STATE.md).
- **D-15 SSE byte-identical anchor PRESERVED** — `scheduled()` runs as an independent surface from the fetch path; `api/chat.ts` is UNTOUCHED. `tests/api/sse-snapshot.test.ts` re-verified GREEN at phase close.
- **TEST-03 Anthropic prompt-cache integrity PRESERVED** — Phase 19 does not touch Anthropic-related code. `tests/api/anthropic-payload-shape.test.ts` re-verified GREEN at phase close.
- **`pnpm exec astro check` exits 0/0/0** — same standard Phase 17 Plan 17-08 established; Phase 19 must not regress the clean typecheck.
- **`pnpm build` clean** — wrangler types regeneration + astro check + astro build all clean.

**Out of scope for Phase 19 (handled by other phases or v1.4+):**

- The actual `src/lib/email/resend.ts` `fetch()` wrapper — Phase 20 creates this file from scratch.
- The email body renderer (`text` field, provenance line, `>>> visitor:` / `<<< bot:` markers, HTML-escape helpers) — Phase 20.
- The subject derivation (`[Portfolio chat] N turns from <country> via <referrer-host>[ (truncated)]`) — Phase 20.
- The adversarial-payload test suite (`<script>`, RTL/bidi overrides, `javascript:` URLs, null bytes, social-engineering prefixes) — Phase 20.
- The `Idempotency-Key: transcript/<sid>` header threading — Phase 20 (idempotency at the Resend API layer; Phase 19's `delivered:{sid}` is the KV-layer idempotency cursor; the two layers are designed to coexist per RESEARCH § Pitfall 4 Layer 1 + Layer 2).
- Real retry-on-5xx behavior — Phase 19 harness has the structure (3-try loop with backoff) but no real failure source under DRY_RUN; Phase 20 wires the real `fetch()` and exercises retries live.
- `/api/resend-webhook` with Svix HMAC — v1.4+ per STATE.md locked-deferred.
- Workers Paid plan upgrade to bind `CHAT_RATE_LIMITER` — v1.4+ per Plan 17-04 DEBT-01 closure.

</domain>

<decisions>
## Implementation Decisions

### A. DRY_RUN flag plumbing

- **D-01:** **DRY_RUN lives in `wrangler.jsonc` `vars` block.** Declaration: `"vars": { "DRY_RUN": "1" }` adjacent to the existing `kv_namespaces` + `triggers.crons` declarations. The toggle lives in the same config that already governs cron schedule and KV bindings — one place to audit deployment shape. Phase 20 flips with a single-line wrangler.jsonc edit (`"1"` → `"0"`) committed alongside the renderer + adversarial-payload work; the flip is visible in git diff. Requires redeploy to take effect (acceptable — Phase 20 ships a single atomic deploy commit anyway). Rejected: Worker secret (overkill for a non-sensitive boolean; leaves no source-tree audit trail at flip moment); hardcoded const in chat-delivery.ts (couples toggle to source edit in a module that should be otherwise stable; every future deploy would need a code review to spot accidental flips).
- **D-02:** **Name = `DRY_RUN`; value = string `"1"` (dry-run active) or `"0"` (live).** Checked via `env.DRY_RUN === "1"` in `chat-delivery.ts`. Strict-equals-string is the canonical Cloudflare Workers convention; `Boolean(env.DRY_RUN)` is bug-prone (`"false"` is truthy). Name is terse because only one DRY_RUN flag exists in v1.3; namespacing (`CHAT_DELIVERY_DRY_RUN`) pays off only if future phases add other dry-run flags (not currently planned). Rejected: presence-check (variable existence = on, removal = off — harder to set DRY_RUN=on intentionally in staging/preview without lighting it up everywhere); namespaced name (verbose, no current payoff).
- **D-03:** **Phase 20 flips with a single-line wrangler.jsonc edit (`"DRY_RUN": "1"` → `"0"`).** The DRY_RUN edit is part of the Phase 20 atomic deploy commit alongside the new Resend POST call + adversarial-payload suite. Matches the existing project pattern where deploy-affecting config lives in wrangler.jsonc; audit trail clearest at the flip moment. Rejected: `wrangler secret delete DRY_RUN` (no source-tree change at flip; requires source-tree to handle 'secret absent' as 'production posture' with an extra fallback code path); source-code const edit (couples flip to whoever does the renderer; deploy-time accidents most catastrophic).
- **D-04:** **No test-environment override seam.** Production and preview both honor DRY_RUN identically. Plan-time UAT for cron mechanics happens against preview with DRY_RUN=1 (same as production through Phase 19). When Phase 20 flips production, preview also flips (Workers Builds spins one preview per push). Smallest surface; matches the Phase 17 two-touch verification pattern. The Phase-19-to-Phase-20 transition is a one-shot, not a gradual rollout. Rejected: per-environment override via wrangler `env.preview` block (useful only if post-Phase-20 preview environments need to NOT send real emails — not a current need); `DRY_RUN_OVERRIDE` env in dev (mirrors WR-04 ALLOW_LOOPBACK three-signal pattern but adds surface for a problem we don't have — `pnpm dev` doesn't trigger the cron path through `wrangler dev --test-scheduled` unless the operator explicitly invokes the `__scheduled` endpoint, so the "dev sends real email" accident is not in the failure surface).

### B. Phase 19 / Phase 20 boundary — envelope-only

- **D-05:** **DRY_RUN logs a flat-field structured log line per Workers-Logs convention.** Single `console.log("chat.delivery.dry_run", { sid, to, from, reply_to, msg_count, truncated, country, referrer_host, dry_run: true })` — flat primitives only, matching the Plan 17-05 DEBT-02 `chat.cache_metrics` and Phase 18 `chat.transcript.write_failed` log conventions. Greppable in `wrangler tail`; queryable in Workers Logs. Field NAMES are locked here; field ORDER is presentational and is planner's discretion. Rejected: nested structure mirroring eventual Resend body (more work to query in Workers Logs; nested fields aren't first-class); both flat metrics + serialized envelope blob (over-engineered for v1.3 scale).
- **D-06:** **`src/lib/email/resend.ts` does NOT exist in Phase 19.** Phase 19 has NO Resend POST code path — not even a stub-that-throws. The DRY_RUN branch in `chat-delivery.ts` logs the envelope and returns synthetic success directly. Phase 20 creates `src/lib/email/resend.ts` from scratch and threads it through `chat-delivery.ts`. Smallest Phase 19 footprint; cleanest scope boundary; matches the envelope-only contract. Rejected: stub file with throw-on-call body (locks signature now but Phase 20's diff isn't that much smaller; one extra file to track); functional fetch wrapper never called in Phase 19 (contradicts envelope-only — pulls the entire Resend integration review surface into Phase 19 without exercising it).
- **D-07:** **Retry harness with 3-try cap + exponential backoff structure lives in Phase 19, unit-tested with a mock that throws on attempts 1+2+3.** `chat-delivery.ts` wraps the (would-be) send call in a 3-try loop with backoff. Under DRY_RUN the inner call is the envelope log line, which always "succeeds" — so retries never fire in production, but the structure exists and is unit-tested by passing a mock `sendOne` that throws synthetically. Closes CRON-03 retry-cap obligation within Phase 19 scope; Phase 20 just swaps the inner call. Specific backoff curve (constant 500ms vs exponential 100/500/2500ms vs full jitter) is planner's discretion based on research — the only locked invariant is: **max 3 attempts** + **per-session try/catch isolates failures** per CRON-03. Rejected: defer retry path entirely to Phase 20 (CRON-03 requirement closure shifts; cleaner if both Phase 19 and Phase 20 own a defined piece of CRON-03); retry only the IDEMPOTENT internal steps (conflates the requirement — CRON-03 specifies send-attempt retries, not KV-write retries).
- **D-08:** **Subject derivation deferred to Phase 20.** Phase 19's envelope log line records `country`, `referrer_host`, `msg_count`, `truncated` as raw fields. Phase 20 composes the subject string server-side. Keeps Phase 19's renderer surface to exactly zero — strictly matches the envelope-only contract; pure data fields with no formatting. The `(truncated)` suffix contract locked in Phase 18 D-08 stays a Phase 20 obligation. Rejected: subject skeleton in Phase 19 (`[Portfolio chat] N turns from <country> via <referrer-host>[ (truncated)]` derivation) — small renderer creep with no operational payoff under DRY_RUN; half-rendered subject (`[Portfolio chat] N turns`) — splits subject derivation across two phases, worst of both.

### C. `delivered:{sid}` value shape

- **D-09:** **Value = `{ v: 1, sid, delivered_at: ISO8601, dry_run: true, msg_count, truncated }`.** Minimum-required-data + timestamp + dry-run discriminator. Audit-useful — Jack can `wrangler kv key get delivered:<sid>` to see when a session was promoted and whether it went through the DRY_RUN path or live. Phase 20 extends additively to `{ v: 1, sid, delivered_at, dry_run: false, msg_count, truncated, resend_message_id: <id> }` — same `v: 1` schema, additive `resend_message_id` field, flips `dry_run` discriminator. Rejected: presence-only marker (`'1'` literal — auditing requires inferring from key existence alone; Phase 20 has to use parallel mechanism for "what was actually sent"); full transcript copy from `live:{sid}` (doubles KV storage for 24h; conflicts with Phase 20 plan where the email itself is the durable record); empty value (`''`) (operationally identical to `'1'` marker but less idiomatic to inspect).
- **D-10:** **Schema-versioned with `v: 1` discriminator.** Matches the Phase 18 `ChatTranscript.v: 1` pattern. Any future shape change (Phase 20's `resend_message_id` addition is additive so stays `v: 1`; v1.4+ Resend webhook event refs might bump to `v: 2`) is then explicitly versioned. Cheap forward-defense. Rejected: unversioned plain object (saves 8 bytes per value; versioning a 24h-TTL value is arguably overkill, but the Phase 18 pattern symmetry is operationally cleaner than a one-off shape).
- **D-11:** **No KV `metadata` field on `delivered:` writes.** `env.CHAT_KV.put('delivered:' + sid, JSON.stringify(value), { expirationTtl: 24 * 3600 })` — no metadata field. Phase 19's cron sweep never lists the `delivered:` prefix (it only lists `live:`), so metadata-on-list isn't needed; the value itself is the read target on the next sweep's idempotency check (`getWithMetadata` or `get` of `delivered:{sid}` — presence implies skip). Rejected: mirror the live: metadata shape (`{ metadata: { delivered_at, msg_count } }` on the put) — useful only if a future phase wants to `list({ prefix: 'delivered:' })` for analytics / audit (none planned in v1.3+); symmetry-for-symmetry's-sake.

### D. Cron verification strategy

- **D-12:** **Success criterion 1 closure via operator-controlled manual UAT in `19-UAT.md` (Step 1 — `*****` Past-Events verification).** Operator edits `wrangler.jsonc` `triggers.crons` to `["* * * * *"]`, runs `wrangler deploy`, waits 90s, opens Cloudflare dashboard → Workers → jack-cutrara-portfolio → Cron → Past Events, confirms ≥1 successful invocation, reverts `wrangler.jsonc` to `["0 * * * *"]`, redeploys. Evidence captured as a Past Events tab screenshot in `19-UAT.md` `result:` block. Operator-controlled because the verification requires watching a dashboard humans see + executes deploy commands that DEPLOY-GATE.md establishes are operator-only ('executor MUST NOT push'). Matches Phase 17 / Phase 18 UAT cadence. Rejected: plan task with executor doing wire + revert + verify (conflicts with established deploy-gate posture); `wrangler dev --test-scheduled` local invocation only (does NOT satisfy roadmap success criterion 1 — Past Events tab is a production-side surface).
- **D-13:** **`pnpm dev:cron` script added to package.json — local handler-wiring proof.** Adds `"dev:cron": "wrangler dev --test-scheduled"` to `scripts` block. Documents the `curl http://localhost:8787/__scheduled?cron=*+*+*+*+*` invocation pattern in `19-UAT.md` as a pre-flight check BEFORE the production `*****` UAT. Catches handler-wiring regressions before deploy (zero-cost dev loop). Matches Phase 17 D-13 two-mode dev story pattern. Rejected: production UAT only (handler-wiring regressions surface only at deploy time — slower feedback loop); one-time SPIKE doc (less ergonomic for future regression catches).
- **D-14:** **`19-UAT.md` includes 5 numbered steps:** Step 1 `*****` Past-Events verification (closes CRON-01 success criterion 1); Step 2 seed-and-sweep end-to-end (operator `wrangler kv key put live:test-uat-<sid>` with stale `last_activity_at`, invokes cron, verifies `delivered:test-uat-<sid>` exists with versioned envelope + `live:test-uat-<sid>` is null + `wrangler tail` shows `chat.delivery.dry_run` + `chat.delivery.tick` log lines — closes CRON-02 success criterion 2); Step 3 idempotency double-tap (re-invoke sweep within 24h window, verify second-tick `sessions_promoted: 0` for the seeded sid because `delivered:` is present — closes success criterion 3); Step 4 pagination/batch-cap stress (bash loop seeds 60 stale `live:test-uat-*` keys, invokes cron, verifies first-tick `sessions_due: 60` but `sessions_promoted: 50`, re-invokes for remaining 10 — closes CRON-03 batch-cap success criterion 4); Step 5 backlog cleanup (operator deletes all `live:test-uat-*` + `delivered:test-uat-*` via `wrangler kv key delete`, verified empty via `wrangler kv key list --prefix test-uat-` — operational hygiene). All five steps have `wrangler` commands + expected log/KV-shape + operator-filled `result:` blocks per the Phase 17 / Phase 18 UAT precedent.

### Claude's Discretion

- **Internal `chat-delivery.ts` module shape** — function signature `deliverDue(env, scheduledTime?)` is locked (matches `src/worker.ts` stub call site); internal helper structure (single file vs split `listLiveCandidates` / `deliverOne` / `processBatch` helpers), named exports vs default export, JSDoc style — planner picks. Phase 18's `chat-transcripts.ts` is the natural sibling/analog (pure-module pattern, named exports, inline decision-ID citations).
- **Pagination batching strategy** — two interpretations of the CRON-03 batch-cap + pagination contracts: (a) inside-batch pagination — one tick processes up to 50 due sessions, paginating through `list_complete=false` until the batch fills or the 50-page safety valve fires; (b) page-per-tick — one tick processes one `list()` page (≤1000 keys), filters for due sessions (≤50 cap on processed), defers leftovers to next tick. Planner picks based on research; affects how long a backlog takes to drain after an outage. The locked invariants are: per-tick batch cap **50 sessions**, pagination hard-cap **50 pages safety valve**, both enforced.
- **Retry backoff curve specifics** — exponential (100/500/2500ms), linear (500ms each), full-jitter, or constant — planner picks from research. Only locked: **max 3 attempts** per send-attempt counter (CRON-03), per-session try/catch isolation, retries fire only on the inner send call (NOT on KV writes).
- **`chat.delivery.tick` per-tick summary log field set** — `{ sessions_seen, sessions_due, sessions_promoted, errors, pages_scanned, elapsed_ms }` is suggested; planner may add fields like `batch_capped: true/false` if useful for Workers Logs filtering. Flat primitives only per the established convention.
- **`chat.delivery.dry_run` envelope field ordering** — field NAMES are locked in D-05; field ORDER inside the object is presentational.
- **`chat.delivery.skipped_already_delivered` log shape** — when the sweep encounters a due session whose `delivered:{sid}` is already present, structured-log skip event recommended (`{ sid, delivered_at_existing }`). Field shape is planner's discretion.
- **Where the 2h inactivity threshold lives as a constant** — `INACTIVITY_THRESHOLD_MS = 2 * 60 * 60 * 1000` at module scope is conventional. Planner picks name; the value 2h is locked.
- **`19-UAT.md` step ordering inside the five-step set** — D-14 enumerates the steps but their exact ordering inside 19-UAT.md is presentational. Per Phase 17 / Phase 18 precedent, ordering should match the success-criteria numbering for traceability.
- **D-26 forward-defense test additions** — Phase 19 touches ZERO chat-surface files, so D-26 expansion is OPTIONAL. Planner may add `tests/build/worker-scheduled-call-site.test.ts` (source-text guard that `src/worker.ts` `scheduled()` body calls `ctx.waitUntil(deliverDue(...).catch(...))` — extends the existing Phase 18 `tests/build/append-turn-call-site.test.ts` pattern). Recommended but discretionary.
- **Whether `chat-delivery.ts` reuses any types from `chat-transcripts.ts`** (e.g., `ChatTranscript` for the `get(live:)` shape) — planner picks; sharing the type via `export type` from `chat-transcripts.ts` keeps the schema source-of-truth pinned to one module.

### Folded Todos

None — no pending todos matched Phase 19 scope at discussion time. The two pending todos in `.planning/todos/pending/` (mobile-menu-breakpoint and og-default-image) remain out-of-scope per v1.3 milestone-shape lock; previously reviewed at Phase 17 / Phase 18 discussions, status unchanged.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Requirements & roadmap

- `.planning/ROADMAP.md` — Phase 19 entry: goal statement, requirements list (CRON-01..04), 4 success criteria, depends-on Phase 18
- `.planning/REQUIREMENTS.md` — CRON-01..04 (lines 43-46); requirement traceability table lines 147-150
- `.planning/STATE.md` — v1.3 architectural decisions lines 73-77 (hourly cron + 2h inactivity threshold lock); v1.3 phase-shape decisions line 83 (Phase 19 = Cron Sweep under DRY_RUN); src/worker.ts scheduled() stub commentary line 99
- `.planning/PROJECT.md` — v1.3 milestone summary, "Known issues / tech debt" section (CHAT_RATE_LIMITER documented + Free-tier acceptable)

### Prior phase context

- `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md` — Phase 18 KV write contract: schema `v: 1`, 30-day TTL on `live:`, KV `metadata` field producer (Phase 19 IS the consumer per Pattern 3 in Phase 18 RESEARCH); D-09 silent + structured error log posture (`chat.transcript.write_failed`); D-10/D-11 `ctx.waitUntil` rejection-handling pattern (`.catch()` chained INSIDE before pass to waitUntil)
- `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md` — Phase 18 pattern map: `src/lib/chat-transcripts.ts` is the canonical sibling/analog for `src/lib/chat-delivery.ts` (pure-module, named exports, inline decision-ID citations); `tests/build/append-turn-call-site.test.ts` is the source-text forward-defense analog for any Phase 19 `scheduled()` / `deliverDue` call-site test
- `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md` — Phase 18 UAT precedent: numbered manual steps with `wrangler` commands + `expected:` / `result:` blocks (Phase 19's `19-UAT.md` mirrors this shape per D-14)
- `.planning/phases/17-foundations-migration-dns-debt-sweep/17-CONTEXT.md` — Phase 17 foundation: D-13 two-mode dev story (`pnpm dev` + `pnpm dev:worker`; Phase 19 adds `pnpm dev:cron` matching the same pattern); D-14 `WORKERS_PREVIEW_SUFFIX = ".jackcutrara.workers.dev"`
- `.planning/phases/17-foundations-migration-dns-debt-sweep/17-UAT.md` — Phase 17 UAT precedent that established the numbered-steps-with-result-blocks pattern
- `.planning/phases/17-foundations-migration-dns-debt-sweep/DEPLOY-GATE.md` — deploy-gate posture: 'executor MUST NOT push'; informs D-12 decision that the `*****` cron verification is operator-controlled, not executor-driven

### Research (v1.3-wide, authored at milestone gate)

- `.planning/research/SUMMARY.md` — "Phase 19 — Cron Sweep: Scheduling + Idempotency" rationale (lines 167-175); DRY_RUN env flag mechanic; pagination loop on `list_complete`; hard-cap 50 pages safety valve
- `.planning/research/STACK.md` — Cloudflare Cron Triggers configuration (`triggers.crons` array, cron-expression syntax, `--test-scheduled` for local testing); free-tier limit 5,000 cron invocations/day (hourly = 24/day, well under cap)
- `.planning/research/ARCHITECTURE.md` — `src/worker.ts` entrypoint shape (lines 179-200); two-keyspace partition flow diagram (lines 102-130); sequence diagram for hourly cron path (lines 280-298); §6 KV data shape rationale (two-keyspace partition mechanics); §7 layered defenses (Layer 1 KV two-keyspace + Layer 2 Resend Idempotency-Key); §7.2 ordering invariant (PUT delivered BEFORE Resend POST; DELETE live AFTER success)
- `.planning/research/PITFALLS.md` — Critical Pitfall 0 (Pages doesn't support cron — closed by Phase 17 migration); Critical Pitfall 2 (KV eventual consistency — 2h threshold >> 60s consistency window absorbs this); Critical Pitfall 4 (cron + KV idempotency — two-key sentinel pattern + `delivered:{sid}` cursor); Critical Pitfall 5 (D-26 must hold cross-phase); Critical Pitfall 6 (Anthropic prompt cache — Phase 19 doesn't touch Anthropic code so forward-defense only); Moderate Pitfall B (KV list 1000-key default + cursor pagination); Moderate Pitfall C (cron handler CPU/wall-time limits — bounded batch + per-session waitUntil); Moderate Pitfall F (cron schedule expression character-exact match — run sweep unconditionally for v1.3's single cron); Moderate Pitfall H (`expirationTtl` on every put — 24h on delivered:); Moderate Pitfall J (2h threshold + hourly cron = worst-case 3h latency, by-design tradeoff)

### Existing code surface (post-Phase-18 baseline)

- `wrangler.jsonc` — Phase 19 EDITS: add `vars.DRY_RUN = "1"` (D-01); change `triggers.crons` from `[]` to `["0 * * * *"]` (CRON-01). CHAT_KV binding (Phase 17/18) UNCHANGED.
- `src/worker.ts` — Phase 19 EDITS the `scheduled()` body: replace the current `console.warn("worker.scheduled.stub", ...)` + `ctx.waitUntil(Promise.resolve())` breadcrumb with `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch((err) => console.error("worker.scheduled.failed", { error_class: err?.name ?? "Error" })))`. `Env` interface already declares `CHAT_KV` (line 14); add `DRY_RUN: string` to `Env`.
- `src/lib/chat-delivery.ts` — **NEW FILE** (~150-250 LOC estimate). Exports `deliverDue(env, scheduledTime?)` + internal helpers (planner picks split). Pure module — NO imports from `@anthropic-ai/sdk`, `cloudflare:workers`, `src/prompts/`, `src/pages/`, `src/scripts/chat.ts`. May import types from `src/lib/chat-transcripts.ts` (`ChatTranscript`, `KEY_PREFIX`, `KVMetadata`). Unit-testable with mock KV.
- `src/lib/chat-transcripts.ts` — UNCHANGED. Phase 19 may import `ChatTranscript` / `KVMetadata` / `KEY_PREFIX` for type-safety; the module itself is read-only from Phase 19's POV.
- `src/pages/api/chat.ts` — UNCHANGED. D-15 SSE byte-identical anchor PRESERVED. Phase 19 touches ZERO chat-surface files.
- `src/scripts/chat.ts` — UNCHANGED.
- `src/lib/validation.ts` — UNCHANGED.
- `src/styles/global.css` — UNCHANGED.
- `package.json` — Phase 19 ADDS `"dev:cron": "wrangler dev --test-scheduled"` to `scripts` (D-13). Other scripts UNCHANGED.
- `tests/api/sse-snapshot.test.ts` — D-15 anchor; re-verify GREEN at phase close (forward-defense — Phase 19 should not affect SSE bytes).
- `tests/api/anthropic-payload-shape.test.ts` — TEST-03 anchor; re-verify GREEN at phase close (forward-defense — Phase 19 doesn't touch Anthropic code).
- `tests/api/cache-hit-logs.test.ts` — DEBT-02 anchor; re-verify GREEN at phase close.

### NEW test surface (Phase 19 authors)

- `tests/api/chat-delivery.test.ts` — **NEW** unit tests for `deliverDue` with mock KV: list-with-pagination, inactivity filter, idempotency-cursor skip, two-keyspace ordering (PUT delivered BEFORE log; DELETE live AFTER), batch-cap enforcement at 50, retry-harness with 3-try mock-failure path, per-session try/catch isolation, structured log emission.
- `tests/build/worker-scheduled-call-site.test.ts` — **NEW** (optional per Claude's Discretion) source-text forward-defense that `src/worker.ts` `scheduled()` body calls `ctx.waitUntil(deliverDue(...).catch(...))` with the `.catch()` chained INSIDE per Phase 18 D-09 / D-10 pattern.
- `tests/build/wrangler-cron-shape.test.ts` — **NEW** (optional) build-time source-text guard that `wrangler.jsonc` `triggers.crons` is `["0 * * * *"]` exactly (forward-defense against the success-criterion-1 `*****` UAT operator forgetting to revert).
- `19-UAT.md` — **NEW** manual operator UAT spec with 5 numbered steps per D-14.

### Cloudflare-platform docs (external — researcher should fetch via Context7 / WebFetch as needed)

- Cloudflare Workers Cron Triggers — `triggers.crons` array syntax; `scheduled(controller, env, ctx)` handler signature; `controller.cron` / `controller.scheduledTime` fields; Past Events tab semantics; 5,000 invocations/day Free-tier cap
- Cloudflare Workers KV `list({prefix, cursor, limit})` — pagination via `list_complete` + cursor; metadata-on-list field shape (1024 byte cap); default limit 1000
- Cloudflare Workers `ctx.waitUntil` — promise lifecycle; rejection handling (`.catch()` chained INSIDE before pass to waitUntil per Phase 18 D-09 pattern); 30s ceiling after response close
- Cloudflare `wrangler dev --test-scheduled` — local cron invocation via `curl http://localhost:8787/__scheduled?cron=<expr>`
- Wrangler `vars` block — public env vars vs secrets distinction; redeploy-required-to-flip semantics

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`src/worker.ts` `scheduled()` stub** (Plan 17-02 commit `54cc8e7`, Plan 18-XX kept the same shape per STATE.md line 99) — Phase 19 replaces the stub body. The forward-compat comment naming `deliverDue(env, controller.scheduledTime)` is the exact substitution target; replace the `console.warn("worker.scheduled.stub", ...)` + `ctx.waitUntil(Promise.resolve())` lines with `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch((err) => console.error("worker.scheduled.failed", { error_class: err?.name ?? "Error" })))`. The `.catch()` is mandatory per Phase 18 D-09 / D-10 lesson — `ctx.waitUntil` swallows rejections without it.
- **`src/lib/chat-transcripts.ts`** (Plan 18-02) — pure module with named exports + inline decision-ID citations. `KEY_PREFIX = "live:"`, `TRANSCRIPT_TTL_SECONDS = 30 * 24 * 3600`, types `ChatTranscript` + `KVMetadata` exported. Phase 19 may import any of these for type-safety / constant-reuse. The module itself is read-only from Phase 19's POV (no edits).
- **`getWithMetadata<ChatTranscript, KVMetadata>(key, { type: 'json' })`** pattern from `chat-transcripts.ts` (Plan 18-02) — Phase 19 `deliverDue` uses `list({ prefix: "live:" })` which returns `keys[].metadata` inline; the type parameter shape matches what `chat-transcripts.ts` writes via the KV `metadata` field option on `put`. Same `KVMetadata` shape: `{ last_activity_at, msg_count, window_started_at, window_count }` — the `last_activity_at` field is the inactivity filter input.
- **Structured Workers-Logs convention** — Plan 17-05 DEBT-02 (`chat.cache_metrics`) + Plan 18-XX (`chat.transcript.write_failed` / `chat.transcript.quota_exceeded` / `chat.transcript.race_suspected`) established the `console.log("event.name", { flat_primitive_fields })` pattern. Phase 19 follows for `chat.delivery.dry_run` / `chat.delivery.tick` / `chat.delivery.skipped_already_delivered` / `worker.scheduled.failed`.
- **`tests/build/worker-entrypoint.test.ts`** (Plan 17-02) — forward-defense source-text test for the `scheduled()` handler shape. Phase 19's optional `tests/build/worker-scheduled-call-site.test.ts` follows the exact same pattern: `readFileSync('src/worker.ts')` + `expect(src).toMatch(/ctx\.waitUntil\(deliverDue\(.*\)\.catch\(/)`.
- **`tests/build/append-turn-call-site.test.ts`** (Plan 18-07) — call-site forward-defense pattern. Phase 19 may extend with `worker-scheduled-call-site.test.ts` for the `deliverDue` call site in `src/worker.ts`.
- **D-26 chat regression battery baseline** carried from Phase 18 close: 419 PASS / 0 FAIL / 2 SKIP. Phase 19 should add to PASS count (new `tests/api/chat-delivery.test.ts` cases) without changing FAIL count.

### Established Patterns

- **`ctx.waitUntil(promise.catch(...))` rejection-handling rule** — Phase 18 D-09 / D-10 / D-11 established that `ctx.waitUntil` swallows rejections without an explicit `.catch()` chained INSIDE the promise. Phase 19's `scheduled()` handler MUST use this pattern: `ctx.waitUntil(deliverDue(env, scheduledTime).catch(handler))`. Forward-defense test recommended.
- **Pure-module helper pattern** — `src/lib/validation.ts` (Phase 7 v1.0) → `src/lib/chat-transcripts.ts` (Plan 18-02). Phase 19's `src/lib/chat-delivery.ts` is the third pure helper module. Named exports, no default; inline decision-ID citations; zero non-stdlib deps beyond CF Workers types (`KVNamespace`, etc.).
- **TDD pattern carried from Phases 17/18**: `tests/build/*` for source-text source-of-truth invariants; `tests/api/*` for unit tests of pure modules + SSR behavior; `tests/client/*` for DOM-mock assertions (Phase 19 doesn't add client-side surface so no `tests/client/*` additions).
- **Two-touch verification (preview → production)** per Plan 17-02 D-03 — Workers Builds spins a preview per main-push. Phase 19's `19-UAT.md` Step 1 (`*****` Past-Events verification) inherits this: operator runs UAT against preview FIRST, then promotes to production via the cron-config flip + redeploy.
- **Build-time source-text test pattern** for source-of-truth invariants per STATE.md retrospective line 116. Phase 19 adds (optional): source-text guards on `src/worker.ts` `scheduled()` body + `wrangler.jsonc` `triggers.crons` shape.
- **Numbered manual UAT spec** per Plan 17-06 (17-UAT.md) + Plan 18-08 (18-UAT.md) — `19-UAT.md` mirrors this exactly: numbered steps, `wrangler` commands, `expected:` / `result:` blocks. D-14 enumerates the 5 steps.
- **DEPLOY-GATE.md operator-controlled deploy posture** (Plan 17-08) — Phase 19's `*****` UAT Step 1 is operator-controlled deploy + revert per this posture. Executor MUST NOT run `wrangler deploy` for the `*****` flip; operator owns the verification + revert cycle.

### Integration Points

- `wrangler.jsonc` — EDITS: `vars.DRY_RUN = "1"` added; `triggers.crons` flipped from `[]` to `["0 * * * *"]`. CHAT_KV / assets / nodejs_compat / observability blocks UNCHANGED.
- `src/worker.ts` — EDITS the `scheduled()` body to replace stub with `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch(...))`. `Env` interface EXTENDS with `DRY_RUN: string`. The fetch handler is UNCHANGED. Imports `deliverDue` from `./lib/chat-delivery`.
- `src/lib/chat-delivery.ts` — **NEW FILE**. Imports types from `chat-transcripts.ts` (`ChatTranscript`, `KVMetadata`, `KEY_PREFIX`) for type-safety. Exports `deliverDue(env: Env, scheduledTime?: number): Promise<void>` + internal helpers (planner picks split). NO Anthropic SDK / CF Workers import (uses `Env.CHAT_KV` directly). NO `src/lib/email/*` imports (those don't exist yet — Phase 20 creates them).
- `package.json` — ADDS `"dev:cron": "wrangler dev --test-scheduled"` to `scripts`. Other scripts UNCHANGED.
- `tests/api/chat-delivery.test.ts` — **NEW**. Unit tests for `deliverDue` with mock KV (vitest); covers list-with-pagination, inactivity filter, idempotency-cursor skip, two-keyspace ordering, batch-cap, retry-harness mock-failure, per-session try/catch, structured log emission (via `vi.spyOn(console, "log")` per Phase 18 pattern).
- `tests/build/worker-scheduled-call-site.test.ts` — **NEW** (optional). Source-text forward-defense on `src/worker.ts` `scheduled()` body.
- `tests/build/wrangler-cron-shape.test.ts` — **NEW** (optional). Source-text guard on `wrangler.jsonc` `triggers.crons` shape (forward-defense against UAT Step 1 operator forgetting to revert).
- `19-UAT.md` — **NEW** at phase-end. Encodes the 5 manual UAT steps per D-14.

</code_context>

<specifics>
## Specific Ideas

- The `chat-delivery.ts` API is **pure** in the same way `chat-transcripts.ts` is pure — no Anthropic SDK reach-in, no SSE knowledge, no `request` object, no `src/pages/*` coupling. This isolation lets Phase 20 swap in the real Resend client without re-architecting the module's outer shape. Planner should treat the module as the project's second "infrastructure helper" carving (after Phase 18's `chat-transcripts.ts`) and resist Anthropic-specific knowledge bleeding in.
- The `chat.delivery.tick` per-tick summary log is the operational ground truth for Phase 19. Jack should be able to `wrangler tail --format json --search "chat.delivery.tick"` and see one line per cron firing showing `sessions_seen` / `sessions_due` / `sessions_promoted` / `errors` / `pages_scanned` / `elapsed_ms`. This is how Phase 19 surfaces "the cron is healthy" without needing a separate observability surface.
- The `delivered:{sid}` value's `dry_run: true` discriminator IS the audit cue. When Phase 20 flips production, the next `delivered:` writes carry `dry_run: false` — a `wrangler kv key list --prefix delivered:` followed by spot-`get`s on a few values lets Jack instantly see whether a session was processed pre- or post-flip.
- The 5 `19-UAT.md` steps each close a specific success criterion: Step 1 = SC1 (cron actually fires); Step 2 = SC2 (DRY_RUN logs + crash-safe ordering); Step 3 = SC3 (idempotency holds); Step 4 = SC4 (batch cap enforced). Step 5 is operational hygiene (no audit-debt of UAT keys in production KV). The planner should preserve this 1:1 mapping in `19-UAT.md`'s structure so an auditor can trace each success criterion to its evidence block.
- The retry harness with NO real failure source under DRY_RUN is the cleanest way to satisfy CRON-03's "send-attempt counter cap of 3 retries" obligation without inventing a synthetic failure injector. Unit-testing the harness with a mock `sendOne` that throws synthetically proves the structure; production behavior under DRY_RUN is "log once, always succeed, retries never fire" — Phase 20 verifies the live retry path against Resend.
- The `pnpm dev:cron` script is operator dev ergonomics, not part of the CI surface. Planner doesn't need to wire it into any pre-commit hook or CI pipeline; it's a local dev loop comparable to `pnpm dev` for the fetch path. Phase 17 D-13 established this two-mode pattern.

</specifics>

<deferred>
## Deferred Ideas

- **Real Resend `fetch()` wrapper + adversarial-payload suite + retry-on-5xx live verification** — Phase 20 owns these per the explicit envelope-only D-05/D-06/D-07/D-08 boundary.
- **Subject derivation** (`[Portfolio chat] N turns from <country> via <referrer-host>[ (truncated)]`) — Phase 20 per D-08.
- **Email body rendering** (provenance line, `>>> visitor:` / `<<< bot:` markers, HTML-escape helpers, metadata header block) — Phase 20.
- **`Idempotency-Key: transcript/<sid>` header threading** — Phase 20 (Layer 2 of RESEARCH § Pitfall 4 layered defense; Phase 19's `delivered:{sid}` is Layer 1).
- **`/api/resend-webhook` with Svix HMAC signature verification** — v1.4+ per STATE.md locked-deferred.
- **Cloudflare Workers Analytics Engine integration for transcript metrics** — v1.4+ Phase 21 per RESEARCH § SUMMARY line 189.
- **Per-IP rate limit on chat surface** — v1.4+ per STATE.md (KV-05 per-sessionId quota from Phase 18 is the v1.3-acceptable transcript-write-side guard; per-IP is a different surface).
- **Workers Paid plan upgrade to bind `CHAT_RATE_LIMITER`** — v1.4+ per Plan 17-04 DEBT-01 closure.
- **HTML email body** — v1.4+ per STATE.md (v1.3 ships plaintext-only).
- **Workers Logs query-saved-views for `chat.delivery.tick`** — operational ergonomics for post-launch dashboarding; can be added at any time via Cloudflare UI without code changes; not required for Phase 19 close.
- **Backfill mechanism for transcripts in KV that pre-date Phase 19's cron** — Phase 18 transcripts written before Phase 19 ships will be picked up by the first cron tick that runs after deploy; no special backfill needed.
- **Cross-cron-tick coordination via `delivery_lock:{sid}` key with 5min TTL** — RESEARCH § Pitfall 4 Layer 3 "Recommendation: skip for v1.3." Cron runs once per schedule; concurrent invocations are vanishingly rare; Layer 1 (`delivered:` cursor) + Layer 2 (Resend `Idempotency-Key`, Phase 20) already cover the case.
- **Configurable inactivity threshold via env var** — 2h is locked in STATE.md line 77 / RESEARCH § Pitfall 2 (the threshold is the safety margin over KV's 60s consistency window). Configuring it via env adds a deployment-shape variable for a value that should never change at v1.3 scale.

### Reviewed Todos (not folded)

None — no pending todos matched Phase 19 scope at discussion time.

</deferred>

---

*Phase: 19-cron-sweep-scheduling-idempotency-dry-run*
*Context gathered: 2026-05-12*
