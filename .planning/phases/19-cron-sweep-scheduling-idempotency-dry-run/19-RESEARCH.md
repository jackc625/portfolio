# Phase 19: Cron Sweep — Scheduling + Idempotency (DRY_RUN) — Research

**Researched:** 2026-05-12
**Domain:** Cloudflare Workers Cron Triggers + KV `list()` pagination + two-keyspace idempotency pipeline (DRY_RUN-gated)
**Confidence:** HIGH for Cloudflare platform mechanics (Context7 + official docs); HIGH for module pattern (sibling `chat-transcripts.ts` is the analog); MEDIUM-HIGH for retry-backoff curve (industry guidance is consistent; Resend itself publishes minimal retry policy)

<user_constraints>
## User Constraints (from 19-CONTEXT.md)

### Locked Decisions

**A. DRY_RUN flag plumbing**

- **D-01** — `DRY_RUN` lives in `wrangler.jsonc` `vars` block adjacent to `kv_namespaces` and `triggers.crons`. Declaration: `"vars": { "DRY_RUN": "1" }`. Phase 20 flips with a single-line edit (`"1"` → `"0"`); requires redeploy to take effect.
- **D-02** — Name = `DRY_RUN`; value = string `"1"` (dry-run active) or `"0"` (live). Checked via `env.DRY_RUN === "1"` (strict-equals-string per Cloudflare convention; `Boolean(env.DRY_RUN)` is bug-prone — `"false"` is truthy).
- **D-03** — Phase 20 flips with a single-line wrangler.jsonc edit (`"DRY_RUN": "1"` → `"0"`).
- **D-04** — No test-environment override seam. Production and preview both honor `DRY_RUN` identically.

**B. Phase 19 / Phase 20 boundary — envelope-only**

- **D-05** — DRY_RUN emits a flat-field structured log line: `console.log("chat.delivery.dry_run", { sid, to, from, reply_to, msg_count, truncated, country, referrer_host, dry_run: true })`. Field NAMES locked here; field ORDER is presentational (planner's discretion).
- **D-06** — `src/lib/email/resend.ts` does NOT exist in Phase 19. No stub, no signature placeholder. Phase 20 creates the file from scratch.
- **D-07** — Retry harness with 3-try cap + backoff structure lives in Phase 19, unit-tested with a mock that throws on attempts 1+2+3. Locked invariants: max 3 attempts (CRON-03), per-session try/catch isolation, retries fire on the inner send call ONLY (NOT on KV writes). Curve is planner's discretion (see Open Question 2).
- **D-08** — Subject derivation deferred to Phase 20. Phase 19's envelope log records `country`, `referrer_host`, `msg_count`, `truncated` as raw fields.

**C. `delivered:{sid}` value shape**

- **D-09** — Value = `{ v: 1, sid, delivered_at: ISO8601, dry_run: true, msg_count, truncated }`. 24h `expirationTtl`. Phase 20 extends additively to add `resend_message_id` + flip `dry_run` to `false`.
- **D-10** — Schema-versioned with `v: 1` discriminator (matches Phase 18 `ChatTranscript.v: 1`).
- **D-11** — No KV `metadata` field on `delivered:` writes. The cron sweep never lists `delivered:` prefix — only `live:` is listed.

**D. Cron verification strategy**

- **D-12** — Success criterion 1 (`*****` Past-Events verification) closes via operator-controlled manual UAT in `19-UAT.md` Step 1. Operator edits `wrangler.jsonc` `triggers.crons` to `["* * * * *"]`, runs `wrangler deploy`, waits 90s, captures Past Events screenshot, reverts to `["0 * * * *"]`, redeploys. Executor MUST NOT run `wrangler deploy` for the flip — operator-controlled per DEPLOY-GATE.md posture.
- **D-13** — `pnpm dev:cron` script added to package.json — local handler-wiring proof. Invocation: `curl http://localhost:8787/__scheduled?cron=*+*+*+*+*`. Documented in `19-UAT.md` as a pre-flight check BEFORE the production `*****` UAT.
- **D-14** — `19-UAT.md` includes 5 numbered steps (Step 1 SC1 / Step 2 SC2 / Step 3 SC3 / Step 4 SC4 / Step 5 backlog cleanup).

### Claude's Discretion

- Internal `chat-delivery.ts` module shape — function signature `deliverDue(env, scheduledTime?)` is locked; internal helper structure, named exports vs default export, JSDoc style — planner picks. Phase 18's `chat-transcripts.ts` is the canonical sibling/analog.
- Pagination batching strategy — interpretations (a) inside-batch pagination vs (b) page-per-tick (see Open Question 1). Locked invariants: per-tick batch cap **50 sessions**, pagination hard-cap **50 pages safety valve**.
- Retry backoff curve specifics — exponential / linear / full-jitter / constant (see Open Question 2). Locked invariants: max 3 attempts (CRON-03), per-session try/catch, retries fire only on inner send call.
- `chat.delivery.tick` per-tick summary log field set — `{ sessions_seen, sessions_due, sessions_promoted, errors, pages_scanned, elapsed_ms }` suggested; may add `batch_capped: true/false`.
- `chat.delivery.dry_run` envelope field ordering (NAMES locked in D-05).
- `chat.delivery.skipped_already_delivered` log shape — recommended `{ sid, delivered_at_existing }`.
- Where the 2h inactivity threshold lives as a constant — `INACTIVITY_THRESHOLD_MS = 2 * 60 * 60 * 1000` at module scope; name is planner's, value is locked.
- `19-UAT.md` step ordering inside the five-step set (per Phase 17/18 precedent, match success-criteria numbering for traceability).
- D-26 forward-defense test additions are OPTIONAL (Phase 19 touches zero chat-surface files). `tests/build/worker-scheduled-call-site.test.ts` recommended-but-discretionary.
- Whether `chat-delivery.ts` reuses types from `chat-transcripts.ts` (planner picks; sharing via `export type` keeps schema source-of-truth pinned to one module).

### Deferred Ideas (OUT OF SCOPE)

- Real Resend `fetch()` wrapper + adversarial-payload suite + retry-on-5xx live verification — Phase 20.
- Subject derivation `[Portfolio chat] N turns from <country> via <referrer-host>[ (truncated)]` — Phase 20.
- Email body rendering (provenance line, `>>> visitor:` / `<<< bot:` markers, HTML-escape helpers) — Phase 20.
- `Idempotency-Key: transcript/<sid>` header threading — Phase 20.
- `/api/resend-webhook` with Svix HMAC — v1.4+.
- Cloudflare Workers Analytics Engine — v1.4+.
- Per-IP rate limit on chat surface — v1.4+.
- Workers Paid plan upgrade to bind `CHAT_RATE_LIMITER` — v1.4+.
- HTML email body — v1.4+.
- Workers Logs query-saved-views for `chat.delivery.tick` — operational ergonomics, can be added at any time via Cloudflare UI.
- Backfill mechanism for Phase 18 pre-Phase-19 transcripts — automatic via first cron tick.
- `delivery_lock:{sid}` cross-tick coordination key — RESEARCH § Pitfall 4 Layer 3 "skip for v1.3."
- Configurable inactivity threshold via env var — 2h is locked.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **CRON-01** | `wrangler.jsonc` `triggers.crons: ["0 * * * *"]` (hourly). Worker `scheduled()` handler delegates to `deliverDue(env)` via `ctx.waitUntil()`. | OQ-3 (ctx.waitUntil lifecycle) + OQ-6 (cron schedule semantics) + Standard Stack (`triggers.crons` shape) |
| **CRON-02** | `src/lib/chat-delivery.ts` `deliverDue` lists `prefix: "live:"` with cursor pagination; filters via `metadata.last_activity_at < now − 2h`. Two-keyspace partition: PUT `delivered:{sid}` (24h TTL) BEFORE Resend POST; DELETE `live:{sid}` AFTER Resend success. Crash-safe at every step boundary. | OQ-5 (KV list semantics) + Architecture Patterns (Pattern 2 two-keyspace ordering invariant) + Don't Hand-Roll (idempotency cursor) |
| **CRON-03** | Per-session try/catch isolates failures; per-tick batch cap (50 sessions); send-attempt counter cap (3 retries); pagination hard-cap (50 pages safety valve); structured JSON logs. | OQ-1 (pagination strategy) + OQ-2 (retry backoff curve) + OQ-7 (structured-log convention) |
| **CRON-04** | `DRY_RUN` env flag — full sweep loop runs but logs Resend payload instead of POSTing. Used to validate Phase 19 sweep mechanics before Phase 20 flips delivery on. | D-01..D-08 locked decisions + OQ-3 (env.DRY_RUN access shape) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

These directives carry the same authority as locked CONTEXT.md decisions. Phase 19 plans MUST NOT regress them:

- **Phase 7 architecture preserved** — SSE streaming, focus trap, XSS sanitization, rate limiting. Phase 19 touches ZERO chat-surface files, so this is a forward-defense gate (D-26 chat regression battery, D-15 SSE byte-identical, TEST-03 Anthropic prompt-cache integrity all expected byte-identical at phase close).
- **Editorial design contract** (`design-system/MASTER.md`) — Phase 19 has no UI surface; informational only.
- **Restrained motion** — Phase 19 has no animation surface; informational only.
- **Type role classes** in `global.css` — Phase 19 does not touch `global.css`.
- **Content collections** — Phase 19 does not touch `src/content/projects/`.

## Summary

Phase 19 ships the cron-driven half of the v1.3 transcript pipeline that Phase 18 fed and Phase 20 will complete. The deliverables are:

1. **`wrangler.jsonc` edits** — `triggers.crons: ["0 * * * *"]` (CRON-01) + `vars.DRY_RUN = "1"` (CRON-04).
2. **`src/worker.ts` body edit** — replace the `scheduled()` stub with `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch((err) => console.error("worker.scheduled.failed", { error_class: err?.name ?? "Error" })))` — the `.catch()` chained INSIDE the promise per Phase 18 D-09 pattern.
3. **NEW `src/lib/chat-delivery.ts`** (~150–250 LOC) — pure module exporting `deliverDue(env, scheduledTime?)`. Owns the full two-keyspace promotion loop: `list({ prefix: "live:" })` → filter `metadata.last_activity_at < now − 2h` → per-session: read `live:{sid}` → check `delivered:{sid}` absence (idempotency cursor) → call would-be-send harness (DRY_RUN-gated) → PUT `delivered:{sid}` (24h TTL) BEFORE the would-be POST → DELETE `live:{sid}` AFTER dry-run "success." Per-session try/catch isolation; 50-session batch cap; 50-page pagination hard-cap; 3-try retry harness with backoff.
4. **`package.json`** — add `"dev:cron": "wrangler dev --test-scheduled"` script (D-13).
5. **`tests/api/chat-delivery.test.ts`** (NEW) — unit tests with mock KV: list-with-pagination, inactivity filter, idempotency-cursor skip, two-keyspace ordering, batch-cap, retry-harness mock-failure, per-session try/catch, structured log emission.
6. **Optional** `tests/build/worker-scheduled-call-site.test.ts` + `tests/build/wrangler-cron-shape.test.ts` source-text forward-defense tests.
7. **`19-UAT.md`** — 5 numbered manual operator steps (D-14).

**Primary recommendation:** Phase 19 is structurally **one new pure module + one entrypoint edit + two config edits + one new unit test file + one UAT doc**. The KV / cron / waitUntil mechanics are all platform-standard and verified in Context7. The architectural decisions are all locked in CONTEXT.md. The only open questions are **inside-batch-vs-page-per-tick pagination strategy** (recommend inside-batch — see OQ-1), **retry backoff curve** (recommend exponential-with-full-jitter starting at 250ms — see OQ-2), and **`19-UAT.md` shape** (mirror Phase 18 verbatim — see OQ-4).

## Architectural Responsibility Map

Phase 19 is a backend-only phase. No browser/client tier touched.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Cron schedule registration | API / Backend (Cloudflare Workers `triggers.crons` in `wrangler.jsonc`) | — | Cron Triggers are a Workers platform feature; `wrangler.jsonc` is the only registration surface. |
| Cron handler dispatch | API / Backend (`src/worker.ts` `scheduled()` handler) | — | `scheduled()` is a Worker default-export field; no other surface can receive Cron Trigger events. |
| KV list pagination + filter | API / Backend (`src/lib/chat-delivery.ts` `deliverDue`) | Database / Storage (`env.CHAT_KV.list()`) | KV runs in the Cloudflare data plane; the Worker dispatches the `list()` call and consumes the result. |
| Idempotency cursor (`delivered:{sid}`) | Database / Storage (KV write) | API / Backend (chat-delivery.ts ordering invariant) | The KV write IS the idempotency cursor; the Worker controls the ordering relative to the would-be send. |
| DRY_RUN gate | API / Backend (string compare on `env.DRY_RUN`) | — | Env var lives in `wrangler.jsonc` (config plane); the Worker reads it at runtime. |
| Structured logs (`chat.delivery.*`) | API / Backend (Worker `console.{log,warn,error}`) | Observability (Workers Logs ingestion) | Workers Logs auto-indexes flat-object fields in `console.log` second-arg; the Worker is the producer, Workers Logs is the consumer. |
| `pnpm dev:cron` local handler-wiring proof | Build / Tooling (`package.json` script) | API / Backend (`wrangler dev --test-scheduled` exposes `/__scheduled` endpoint) | Wrangler CLI tooling concern; not a runtime concern. |

**Notable absence:** No frontend tier work. No browser tier work. No content collections work. No `chat.ts` / `api/chat.ts` edits (D-26 chat-surface untouched).

## Standard Stack

### Core (already installed — Phase 19 consumes these)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@astrojs/cloudflare` | 13.5.0 [VERIFIED: `npm view`] (project on 13.1.7 per package.json — no bump needed for Phase 19) | Astro Cloudflare adapter (custom Worker entrypoint via `@astrojs/cloudflare/handler`) | Already wired by Phase 17 Plan 17-02. Phase 19 doesn't import from it; the handler edit happens in `src/worker.ts` which already wraps `handle()`. |
| `wrangler` | 4.90.1 [VERIFIED: `npm view`] (project on 4.83.0 — no bump needed) | Cron Trigger registration + local `dev --test-scheduled` testing | Already in `devDependencies`. `wrangler types` regenerates `worker-configuration.d.ts` after the `vars.DRY_RUN` + `triggers.crons` edits land. |
| `vitest` | 4.1.0 [VERIFIED: package.json] | Unit tests with mock KV | Established pattern in Phase 18 (`tests/api/chat-transcripts.test.ts` is the analog). |
| `zod` | 4.3.6 [VERIFIED: package.json] | Type-safe schemas | Phase 19 does NOT introduce new Zod schemas. Types reused from `chat-transcripts.ts` (`ChatTranscript`, `KVMetadata`, `KEY_PREFIX`). |

### Supporting (zero install — already present)

| Resource | Source | Purpose | When to Use |
|----------|--------|---------|-------------|
| `KVNamespace` / `ScheduledController` / `ExecutionContext` / `ExportedHandler` types | Generated by `wrangler types` into `worker-configuration.d.ts` | TypeScript type-safety for the new module | Already runs in `pnpm build`. Re-run after `wrangler.jsonc` `triggers.crons` edit lands. |
| `src/lib/chat-transcripts.ts` types | Phase 18 module — re-imported by Phase 19 | `ChatTranscript`, `KVMetadata`, `KEY_PREFIX` for KV value parsing | `deliverDue` calls `kv.list<KVMetadata>({ prefix: KEY_PREFIX })` then `kv.getWithMetadata<ChatTranscript, KVMetadata>(...)`. Shared types prevent schema drift. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cloudflare Workers Cron Triggers | External scheduler (GitHub Actions cron, uptime poller) | Rejected by research (Critical Pitfall 0 path 3) — operationally fragile; off-platform; adds auth surface. Phase 17 migration to Workers Static Assets already enabled native cron. [CITED: `.planning/research/PITFALLS.md#critical-pitfall-0`] |
| `triggers.crons: ["0 * * * *"]` (hourly) | Sub-hourly cron (`*/15 * * * *`) | Rejected by milestone lock — STATE.md lines 73-77 lock hourly + 2h inactivity threshold. Sub-hourly would require lowering the threshold or accept fragmented emails. [CITED: STATE.md] |
| Two-keyspace partition (`live:` → `delivered:`) | `delivered: bool` flag inside the value | Rejected by KV constraints — KV has no compare-and-swap (CAS); read-modify-write on a flag is racy; 1-write/sec/key cap. Two-keyspace is strictly better at exploiting KV's key-as-filter affordance. [CITED: `.planning/research/ARCHITECTURE.md#7-3`] |
| In-band Resend `Idempotency-Key` only (no KV cursor) | KV `delivered:` cursor only | Both layers exist by design (RESEARCH § Layered defenses). Layer 1 (KV `delivered:`) lives in Phase 19; Layer 2 (`Idempotency-Key: transcript/<sid>`) is deferred to Phase 20. Phase 19 alone is sufficient for app-level idempotency. [CITED: `.planning/research/ARCHITECTURE.md#7-2`] |

**Installation:** No new packages. Phase 19 is zero-runtime-dependency.

**Version verification (2026-05-12):**
- `wrangler` latest = 4.90.1 [VERIFIED: `npm view wrangler version`]
- `@astrojs/cloudflare` latest = 13.5.0 [VERIFIED: `npm view @astrojs/cloudflare version`]

Both newer than project pins, but no Phase 19 feature requires a bump. The custom entrypoint pattern in `src/worker.ts` is stable in `@astrojs/cloudflare` 13.1+; `triggers.crons` JSONC support is stable in `wrangler` 4.0+.

## Architecture Patterns

### System Architecture Diagram

```
                  Cloudflare Workers (single deployment)
                       jackcutrara.com
┌──────────────────────────────────────────────────────────────────────┐
│  src/worker.ts (existing — EDIT scheduled() body)                    │
│    fetch(req, env, ctx)     → handle(req, env, ctx)  [Astro]         │
│    scheduled(controller, env, ctx)                                   │
│       → ctx.waitUntil(                                               │
│           deliverDue(env, controller.scheduledTime).catch(handler)   │
│         )                                                            │
└──────┬───────────────────────────────────┬───────────────────────────┘
       │ /api/chat (SSE — UNTOUCHED)       │ Cron: "0 * * * *"
       ▼                                   ▼
[api/chat.ts]                       [chat-delivery.ts] (NEW)
  ├── (Phase 18 — UNTOUCHED)          ├── ENTRY: deliverDue(env, scheduledTime?)
  ├── ctx.waitUntil(                  ├──   ┌─────────────────────────────────────────┐
  │   appendTurn(user))               │   │ 1. cursor = undefined                    │
  ├── stream Anthropic SSE            │   │ 2. while pages_scanned < 50 (safety):    │
  └── ctx.waitUntil(                  │   │      r = kv.list({ prefix: "live:",     │
      appendTurn(assistant))          │   │                    cursor })             │
                                      │   │ 3.   for key of r.keys:                  │
                                      │   │ 4.     skip if metadata.last_activity_at │
                                      │   │           > now − 2h                     │
                                      │   │ 5.     promoteOne(env, key.name) {       │
                                      │   │           try {                          │
                                      │   │             existing = kv.get(delivered:)│
                                      │   │             if existing: log + skip;     │
                                      │   │             transcript = kv.get(live:);  │
                                      │   │             retryHarness(sendOne, 3):    │
                                      │   │               under DRY_RUN: log envelope│
                                      │   │               else: throw NotImplemented │
                                      │   │             kv.put(delivered:, …, 24h)   │
                                      │   │             kv.delete(live:)             │
                                      │   │           } catch (err) {                │
                                      │   │             log chat.delivery.failed     │
                                      │   │             errors++                     │
                                      │   │           }                              │
                                      │   │         }                                │
                                      │   │ 6.   if sessions_promoted >= 50: break   │
                                      │   │ 7.   if r.list_complete: break           │
                                      │   │      else: cursor = r.cursor             │
                                      │   │ 8. emit chat.delivery.tick {summary}     │
                                      │   └─────────────────────────────────────────┘
                                      │
                                      ▼
                  env.CHAT_KV (Phase 17 + 18 binding — UNCHANGED)
                  ─────────────────────────────────────────
                  live:{sid}      → transcript JSON  (30d TTL, Phase 18 wrote)
                  delivered:{sid} → { v:1, sid, delivered_at, dry_run:true,
                                      msg_count, truncated }  (24h TTL)
```

The diagram's "read delivered: before kv.get(live:)" placement is **operationally cheaper** — if the session has already been delivered the loop short-circuits without the larger `get(live:)` read. Single-source idempotency cursor; no race window because both reads happen synchronously inside one `promoteOne` invocation.

### Recommended Project Structure

No new directories. All new code lives in existing locations:

```
src/
├── lib/
│   ├── chat-transcripts.ts    (Phase 18 — Phase 19 imports types)
│   └── chat-delivery.ts       (NEW — Phase 19 owns end-to-end)
├── worker.ts                  (EDIT scheduled() body)
└── pages/api/chat.ts          (UNTOUCHED — D-26 anchor)

tests/
├── api/
│   ├── chat-transcripts.test.ts   (UNTOUCHED)
│   └── chat-delivery.test.ts      (NEW — unit tests with mock KV)
└── build/
    ├── worker-entrypoint.test.ts          (UNTOUCHED — Phase 17 baseline)
    ├── worker-scheduled-call-site.test.ts (OPTIONAL NEW — source-text forward-defense)
    └── wrangler-cron-shape.test.ts        (OPTIONAL NEW — source-text guard)

wrangler.jsonc                  (EDIT vars.DRY_RUN + triggers.crons)
package.json                    (EDIT scripts.dev:cron)
.planning/phases/19-…/
└── 19-UAT.md                   (NEW)
```

### Pattern 1: Custom-Entrypoint `scheduled()` Handler with `ctx.waitUntil(...)` + INSIDE-promise `.catch`

**What:** The Cloudflare Workers ES-modules `scheduled()` handler signature is `(controller: ScheduledController, env: Env, ctx: ExecutionContext) => Promise<void>`. To run async work (KV list/get/put/delete + the would-be send) past the moment the handler function returns, the work MUST be passed to `ctx.waitUntil(promise)`. The runtime tracks the promise and the cron invocation is recorded as a Past Events success only if ALL `ctx.waitUntil` promises resolve.

**When to use:** Always, when a Workers `scheduled()` handler does I/O. There is no "fast path" alternative — `await` inside `scheduled()` works for code that runs before the handler returns, but `ctx.waitUntil(...)` is the only way to extend execution past the handler return.

**Rejection-handling rule (the critical detail):** The first `ctx.waitUntil()` call to fail is recorded as the status in the Cron Trigger Past Events table — but **only if the promise rejection bubbles up to the runtime**. If a rejection happens INSIDE the promise and is not caught, it bubbles. If the planner wants Workers Logs to surface the failure WITHOUT marking the cron invocation as failed (e.g., per-session failures handled gracefully), `.catch()` MUST be chained INSIDE the promise BEFORE it is passed to `ctx.waitUntil`. This is the exact Phase 18 D-09 / D-10 / D-11 pattern.

**Example (Phase 19 target shape in `src/worker.ts`):**

```typescript
// Source: Phase 18 D-09/D-10/D-11 pattern + Cloudflare docs (Context7-verified 2026-05-12).
// https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/
export default {
  async fetch(request, env, ctx): Promise<Response> {
    return handle(request, env, ctx);
  },
  async scheduled(controller, env, ctx): Promise<void> {
    // .catch chained INSIDE the promise — RESEARCH § Pitfall 1.
    // Without it, ctx.waitUntil swallows the rejection AND Past Events
    // marks the invocation FAILED. With it, per-session failures inside
    // deliverDue handle themselves; only catastrophic deliverDue-level
    // crashes (uncaught throw at top of function) reach this handler.
    ctx.waitUntil(
      deliverDue(env, controller.scheduledTime).catch((err: unknown) => {
        console.error("worker.scheduled.failed", {
          error_class: err instanceof Error ? err.constructor.name : "Error",
        });
      })
    );
  },
} satisfies ExportedHandler<Env>;
```

**Where Phase 18 already proved this pattern works:** `src/pages/api/chat.ts:36-46` (the `locals.cfContext` resolution) and the two `ctx.waitUntil(appendTurn(...).catch(...))` call sites. Source-text-locked by `tests/build/append-turn-call-site.test.ts`.

### Pattern 2: Two-Keyspace Idempotency Cursor with Ordering Invariant

**What:** Two KV keys per session split the lifecycle:
- `live:{sid}` — Phase 18 writes; Phase 19 cron LIST + GET + DELETE candidates
- `delivered:{sid}` — Phase 19 cron WRITE marker before the would-be send; READ-as-presence-check on every promotion to short-circuit re-delivery

**When to use:** Every per-session promotion in `deliverDue`. The ordering is load-bearing.

**Locked ordering (per ARCHITECTURE § 7.2):**

1. `kv.get(delivered:{sid})` — if present, log `chat.delivery.skipped_already_delivered { sid, delivered_at_existing }` and skip this session entirely.
2. `kv.get(live:{sid})` — read the transcript; if absent (race with another tick that already deleted), skip.
3. `retryHarness(sendOne)` — the would-be send (under DRY_RUN: log envelope; else: would throw in Phase 19 because Resend wrapper doesn't exist).
4. `kv.put(delivered:{sid}, { v:1, sid, delivered_at, dry_run:true, msg_count, truncated }, { expirationTtl: 24*3600 })` — **BEFORE** the would-be POST (in Phase 20 this PUT is BEFORE the real POST; in Phase 19 under DRY_RUN it's BEFORE the envelope log, which is the same crash-safety boundary).
5. `kv.delete(live:{sid})` — **AFTER** the would-be POST succeeds (in Phase 19 under DRY_RUN, the envelope log always "succeeds" so this always fires).

**Why the order is load-bearing:** If the Worker dies between (3) and (4), the next cron sees `live:{sid}` still present AND `delivered:{sid}` absent → re-attempts (3) — duplicate envelope log under DRY_RUN; in Phase 20 the Resend Idempotency-Key (Layer 2) catches this. If the Worker dies between (4) and (5), the next cron sees `delivered:{sid}` present → skips entirely. If the Worker dies before (4), the next cron just retries from the top. Worst-case is one duplicate would-be POST per failure window, never zero.

**Example (Phase 19 internal helper signature):**

```typescript
// Source: ARCHITECTURE § 7.2 + Phase 18 chat-transcripts.ts inline-decision-ID pattern.
async function promoteOne(
  env: Env,
  sid: string,
  scheduledAt: string,
): Promise<{ status: "promoted" | "already_delivered" | "missing_live" | "error" }> {
  // (1) idempotency cursor read — cheapest possible short-circuit
  const delivered = await env.CHAT_KV.get(`delivered:${sid}`, { type: "json" });
  if (delivered !== null) {
    console.log("chat.delivery.skipped_already_delivered", {
      sid,
      delivered_at_existing: (delivered as { delivered_at?: string }).delivered_at ?? null,
    });
    return { status: "already_delivered" };
  }

  // (2) load the transcript value
  const transcript = await env.CHAT_KV.get<ChatTranscript>(`${KEY_PREFIX}${sid}`, { type: "json" });
  if (transcript === null) return { status: "missing_live" };

  try {
    // (3) would-be send harness (DRY_RUN-gated) with retry curve
    await retryWithBackoff(() => sendOne(env, transcript), MAX_SEND_ATTEMPTS);

    // (4) idempotency marker — BEFORE the actual send in Phase 20
    //                          (in Phase 19 under DRY_RUN, sendOne is the envelope log
    //                           and always succeeds — so the "before" semantic is
    //                           moot in Phase 19; the structure is what Phase 20 inherits)
    const value: DeliveredMarker = {
      v: 1,
      sid,
      delivered_at: new Date().toISOString(),
      dry_run: env.DRY_RUN === "1",
      msg_count: transcript.msg_count,
      truncated: transcript.truncated,
    };
    await env.CHAT_KV.put(`delivered:${sid}`, JSON.stringify(value), {
      expirationTtl: 24 * 3600,
      // D-11 — NO metadata field on delivered: writes (cron never lists delivered:)
    });

    // (5) clean up live entry — AFTER successful "send"
    await env.CHAT_KV.delete(`${KEY_PREFIX}${sid}`);

    return { status: "promoted" };
  } catch (err) {
    // Per-session try/catch — CRON-03 isolation invariant.
    console.error("chat.delivery.failed", {
      sid,
      error_class: err instanceof Error ? err.constructor.name : "Error",
      msg_count: transcript.msg_count,
    });
    return { status: "error" };
  }
}
```

### Pattern 3: KV `list({ prefix, cursor, limit })` with `list_complete` Pagination + Hard-Cap Safety Valve

**What:** `env.CHAT_KV.list<KVMetadata>({ prefix: "live:" })` returns `{ keys: Array<{ name, expiration?, metadata? }>, list_complete: boolean, cursor: string }`. The default and maximum page size is **1,000 keys per request**. `metadata` is returned inline on every key (no per-key `get()` required to filter). `list_complete: false` means more pages exist; `cursor` is opaque and must be passed verbatim on the next call.

**When to use:** Every cron tick. The pattern is "loop until the per-tick batch cap is reached OR `list_complete` is true OR the pagination hard-cap fires."

**Example:**

```typescript
// Source: Cloudflare KV list-keys docs (https://developers.cloudflare.com/kv/api/list-keys/)
// VERIFIED 2026-05-12 via WebFetch — default + max limit is 1000; metadata returned inline;
// list_complete is the authoritative "more pages" signal (not keys.length === 0).
const INACTIVITY_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2h — STATE.md lock
const PER_TICK_BATCH_CAP = 50;
const PAGINATION_PAGE_HARDCAP = 50; // CRON-03 safety valve

let cursor: string | undefined = undefined;
let pagesScanned = 0;
let sessionsSeen = 0;
let sessionsDue = 0;
let sessionsPromoted = 0;
let errors = 0;
const nowMs = scheduledTime ?? Date.now();

while (pagesScanned < PAGINATION_PAGE_HARDCAP) {
  const page = await env.CHAT_KV.list<KVMetadata>({
    prefix: KEY_PREFIX,
    cursor,
  });
  pagesScanned += 1;
  sessionsSeen += page.keys.length;

  for (const k of page.keys) {
    if (sessionsPromoted >= PER_TICK_BATCH_CAP) break;

    const metadata = k.metadata;
    if (!metadata?.last_activity_at) continue; // missing metadata = skip; not our row
    const lastActiveMs = Date.parse(metadata.last_activity_at);
    if (nowMs - lastActiveMs < INACTIVITY_THRESHOLD_MS) continue; // not yet due

    sessionsDue += 1;
    const sid = k.name.slice(KEY_PREFIX.length);
    const r = await promoteOne(env, sid, new Date(nowMs).toISOString());
    if (r.status === "promoted") sessionsPromoted += 1;
    else if (r.status === "error") errors += 1;
  }

  if (sessionsPromoted >= PER_TICK_BATCH_CAP) break;
  if (page.list_complete) break;
  cursor = page.cursor;
}
```

### Pattern 4: Structured-JSON Workers Logs (Plan 17-05 DEBT-02 + Phase 18 convention)

**What:** `console.log("event.name", { flat_primitive_fields })`. The first arg is a dotted-event-name string literal (the namespace `chat.delivery.*` is reserved by Phase 19). The second arg is a flat object containing only primitive values (string, number, boolean, null) — Workers Logs auto-extracts these as searchable/filterable fields. `wrangler tail --search chat.delivery.tick` filters on the first-arg event-name substring.

**Verified behavior (Workers Logs docs, 2026-05-12 via WebFetch):**
- `console.log({user_id: 123})` auto-indexes `user_id` as a searchable field (no `JSON.stringify` required).
- Recommended shape is flat primitives for "faster queries" and filtering "across any dimension for fields with unlimited cardinality."
- Single log size cap: 256 KB (Phase 19 log lines are well under).
- Nested objects: not formally documented; flat is the canonical shape.

**Example (Phase 19 log lines):**

```typescript
// Per-tick summary at end of deliverDue:
console.log("chat.delivery.tick", {
  sessions_seen: sessionsSeen,
  sessions_due: sessionsDue,
  sessions_promoted: sessionsPromoted,
  errors,
  pages_scanned: pagesScanned,
  elapsed_ms: Date.now() - startMs,
});

// DRY_RUN envelope log (D-05 — field NAMES locked):
console.log("chat.delivery.dry_run", {
  sid,
  to: env.CHAT_RECIPIENT_EMAIL ?? null,
  from: env.CHAT_SENDER_EMAIL ?? null,
  reply_to: "jackcutrara@gmail.com",
  msg_count: transcript.msg_count,
  truncated: transcript.truncated,
  country: transcript.meta.country,
  referrer_host: hostnameOrNull(transcript.meta.referrer),
  dry_run: true,
});

// Idempotency-skip log:
console.log("chat.delivery.skipped_already_delivered", {
  sid,
  delivered_at_existing,
});

// Per-session failure (inside promoteOne catch):
console.error("chat.delivery.failed", {
  sid,
  error_class,
  msg_count,
});
```

### Anti-Patterns to Avoid

- **Destructuring `ctx` (`const { waitUntil } = ctx`)** — loses `this` binding; throws "Illegal invocation" at runtime. Source-text-locked by Phase 18's `tests/build/append-turn-call-site.test.ts` "Invariant E (anti-destructure)" assertion. Phase 19's `worker-scheduled-call-site.test.ts` (optional) should extend the same lock to `src/worker.ts`.
- **`.catch` chained OUTSIDE `ctx.waitUntil` (`ctx.waitUntil(p).catch(...)`)** — `ctx.waitUntil` is `void`-returning; chaining `.catch` on `void` is a no-op AND TypeScript-incorrect. The correct shape is `ctx.waitUntil(p.catch(...))`. This is the exact Phase 18 D-09 lesson.
- **`Promise.all([...sends])` for parallel per-session promotion** — exceeds Resend's 2 req/s rate cap (RESEARCH § Moderate Pitfall C); fan-out has no value at v1.3 scale (single-digit sessions/tick). Use sequential `for` loop. [CITED: `.planning/research/PITFALLS.md#moderate-pitfall-c`]
- **`await env.CHAT_KV.put(delivered:, …)` inside the SSE controller's `start(controller)` closure** — N/A to Phase 19 (no SSE surface touched) but worth re-stating: the cron path runs `await` freely inside `deliverDue` because there is no SSE response stream to block.
- **Reading `delivered:` via `list({ prefix: "delivered:" })`** — the cron sweep NEVER lists `delivered:`. The cursor read is per-session `get(delivered:{sid})` only. Listing both prefixes doubles the round-trip cost and adds an unnecessary code path.
- **New SSE frame types in `/api/chat`** — Phase 19 doesn't touch `/api/chat`, but the D-15 byte-identical anchor still applies as a forward-defense gate at phase close.
- **String-comparing `controller.cron` in the handler** — RESEARCH § Moderate Pitfall F. v1.3 has a single cron, so the handler runs unconditionally; no `switch (controller.cron)` logic needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron schedule | A node-cron / croner / external poller process | Cloudflare native `triggers.crons` in `wrangler.jsonc` + `scheduled()` handler | Platform-native; runs in the same Worker as fetch; free tier (5,000 invocations/day vs our 24/day). Phase 17 migration to Workers Static Assets was the precondition. [CITED: `.planning/research/STACK.md`] |
| Idempotency cursor | `delivered: bool` flag inside the transcript value (read-modify-write CAS) | Two-keyspace partition (`delivered:{sid}` separate key) | KV has no CAS; read-modify-write on the same key is racy AND capped at 1 write/sec/key. Two-keyspace exploits KV's key-as-filter affordance. [CITED: ARCHITECTURE § 7.3] |
| Metadata-on-list filter | Per-key `get()` round-trip on every `list()` result | `kv.list<KVMetadata>({ prefix })` returning `metadata` inline | KV `list` API returns metadata in the same response; Phase 18 already writes the metadata field. O(1) per session instead of O(n) round-trips. [CITED: KV list-keys docs, VERIFIED via WebFetch 2026-05-12] |
| Pagination loop control | Re-list until `keys.length === 0` | `while (!page.list_complete)` with cursor pass-through | Empty `keys` array does NOT mean done — the official docs explicitly warn against this: "Checking for an empty array in `keys` is not sufficient." Always use `list_complete`. [CITED: KV list-keys docs] |
| Concurrent-tick coordination | `delivery_lock:{sid}` with 5min TTL | Skip — Layer 1 (delivered: cursor) + Phase 20's Layer 2 (Resend `Idempotency-Key`) cover the case | Cloudflare cron runs once per schedule; concurrent invocations are vanishingly rare. ARCHITECTURE § 7.2 Layer 3 says "skip for v1.3." [CITED: ARCHITECTURE § 7.2] |
| Sub-second retry backoff math | Custom exponential / decorrelated-jitter implementation | Inline ~10-LOC full-jitter helper (see Open Question 2) | At 3-attempt cap + only failing under unit-test mock (DRY_RUN never fails in production), the math is too simple to justify a dependency. |
| Retry-with-same-key on Resend 5xx | Phase 19 concern | Phase 20 owns the real Resend wrapper | Phase 19's retry harness STRUCTURE exists; the real failure source comes in Phase 20. [CITED: 19-CONTEXT.md D-07] |

**Key insight:** Phase 19 is **infrastructure orchestration**, not feature engineering. Every primitive it needs (cron, KV list, KV put with TTL, `ctx.waitUntil`, structured logs) is platform-native and verified in Context7. The work is "wire them in the locked order." No new dependencies; no new abstractions beyond the one new module.

## Runtime State Inventory

> Phase 19 is NOT a rename/refactor phase — it's a feature-additive phase. The five categories below are documented for completeness; most are "None — verified."

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None directly produced; Phase 19 READS `live:{sid}` values written by Phase 18 (`ChatTranscript v:1` shape preserved). Phase 19 WRITES `delivered:{sid}` (new keyspace, no rename). | None — additive write surface |
| Live service config | `wrangler.jsonc` `triggers.crons` flips from `[]` to `["0 * * * *"]` (NEW). `vars.DRY_RUN: "1"` (NEW). Both live in source-tree git history — no UI-only config. | Verified after Phase 17 closed: production config lives in `wrangler.jsonc` exclusively. |
| OS-registered state | None — Workers Cron is a Cloudflare control-plane registration, registered at `wrangler deploy` time, not OS-level. Past Events tab refresh happens within ~30 min of first deploy (CITED: Cloudflare cron-triggers docs, VERIFIED 2026-05-12). | None |
| Secrets/env vars | `DRY_RUN` is a **var** (string `"1"`), NOT a secret — locked at D-01 / D-02. Existing 4 secrets (`ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `CHAT_RECIPIENT_EMAIL`, `CHAT_SENDER_EMAIL`) UNCHANGED. | None — additive var; no secret changes |
| Build artifacts / installed packages | `wrangler types` regeneration after `wrangler.jsonc` edit produces an updated `worker-configuration.d.ts`. No package adds/removes. | Run `pnpm build` once after the wrangler.jsonc edit lands to verify clean types regen. |

**The canonical question:** *After every file in the repo is updated, what runtime systems still have the old string cached, stored, or registered?*

**Answer:** Nothing. Phase 19 is fully forward-additive. Phase 18 transcripts written BEFORE Phase 19 deploys will be picked up by the first cron tick that runs after deploy — no backfill needed (CONTEXT.md "Deferred Ideas" confirms).

## Common Pitfalls

### Pitfall 1: `ctx.waitUntil` rejection swallowing

**What goes wrong:** The Cloudflare runtime tracks promises passed to `ctx.waitUntil` but does NOT auto-report uncaught rejections. If `deliverDue(...)` rejects and the promise is passed naked to `ctx.waitUntil`, the rejection is silently swallowed. Workers Logs surfaces nothing; Past Events marks the cron invocation as "failed" with no detail.
**Why it happens:** TypeScript signature is `ctx.waitUntil(promise: Promise<unknown>): void` — there's no method on the return value to attach a handler. Devs assume "the runtime will log it for me."
**How to avoid:** ALWAYS chain `.catch(...)` INSIDE the promise BEFORE passing to `ctx.waitUntil`. Phase 18 D-09 / D-10 / D-11 lock this; Phase 19 inherits.
**Warning signs:** Past Events shows "failed" with no log line in Workers Logs. Empty `chat.delivery.tick` summary log absence post-deploy.

### Pitfall 2: KV `metadata` field stale-on-write race (Phase 18 inherits)

**What goes wrong:** A user sends a turn while the cron tick is reading `live:{sid}`. The `appendTurn` write happens AFTER the cron's `get(live:)` returns but BEFORE the cron's `put(delivered:)`. The cron emails an incomplete transcript while the user is still typing.
**Why it happens:** KV is eventually consistent (~60s globally; immediate at the same POP). The 2h inactivity window absorbs this fully — a session that was active 60s ago is not "due" by the 2h filter. [CITED: `.planning/research/PITFALLS.md#critical-pitfall-2`]
**How to avoid:** Trust the 2h inactivity threshold. Do NOT lower it below 5min. Document the trade-off in code comments.
**Warning signs:** A `delivered:{sid}` exists for a session that has new turns appended within ~60s of the delivery. (Won't happen at the 2h threshold — defense is structural.)

### Pitfall 3: Cron schedule expression character-exact match (RESEARCH § Moderate Pitfall F)

**What goes wrong:** Cloudflare's `controller.cron` field "must match character-for-character with the configuration, including spacing." Copy-paste from a different doc gets non-breaking spaces or tabs; a `switch (controller.cron)` falls through; nothing fires; no error logged.
**Why it happens:** Cron strings have ambiguous whitespace semantics across tools.
**How to avoid:** For v1.3's single cron, run the sweep UNCONDITIONALLY — do NOT compare `controller.cron`. (See Open Question 6.)
**Warning signs:** Past Events shows successful invocations but `chat.delivery.tick` log never fires.

### Pitfall 4: Pagination "empty array" misread

**What goes wrong:** `kv.list({ prefix })` returns `{ keys: [], list_complete: false, cursor: "…" }` — an empty page MID-pagination is documented as possible. Code that treats `keys.length === 0` as "done" terminates early and misses sessions.
**Why it happens:** Intuition says "no keys = done." KV's pagination model allows internal-empty pages.
**How to avoid:** ALWAYS use `list_complete` as the loop terminator. [CITED: KV list-keys docs: "Checking for an empty array in `keys` is not sufficient to determine whether there are more keys to fetch. Instead, use `list_complete`."]
**Warning signs:** `chat.delivery.tick` shows `pages_scanned: 1` consistently when KV holds >1 page worth of `live:` keys.

### Pitfall 5: CPU / wall-time budget overrun on the scheduled handler

**What goes wrong:** Cloudflare Workers' default CPU time on a scheduled handler is 30 seconds (Paid plan can extend; we're on Free with the cron-trigger free-tier cap). Sweep + would-be sends + KV writes that exceed this drop the tail of the batch silently — `waitUntil` records a failure in Past Events with no per-session detail. [CITED: `.planning/research/PITFALLS.md#moderate-pitfall-c`]
**Why it happens:** Resend (Phase 20) defaults to 2 req/s; 50 transcripts in serial sends ≈ 25 seconds — close to budget. Under DRY_RUN in Phase 19, the envelope log is microsecond-level — Phase 19 itself will not exceed budget. But the harness structure must not multiply (avoid `Promise.all`).
**How to avoid:** Per-tick batch cap of 50 (locked at CRON-03) + sequential `for` loop, no `Promise.all` for sends.
**Warning signs:** `chat.delivery.tick` `elapsed_ms` > 20000 (warning) or 28000+ (critical). Past Events shows "exceeded CPU time" status.

### Pitfall 6: Forgetting to revert `*****` UAT after Step 1

**What goes wrong:** Operator runs Step 1 (`*****` Past-Events verification), captures the screenshot, but forgets to revert `wrangler.jsonc` back to `["0 * * * *"]`. Production runs every-minute cron until someone notices.
**Why it happens:** UAT is operator-driven and the revert is a separate manual action.
**How to avoid:** RECOMMENDED: add `tests/build/wrangler-cron-shape.test.ts` source-text guard that asserts `triggers.crons` is `["0 * * * *"]` exactly. Build-time fail catches the unreverted state. Operator runbook in `19-UAT.md` Step 1 also explicitly enumerates the revert action.
**Warning signs:** A `wrangler.jsonc` diff post-UAT shows `* * * * *`. `chat.delivery.tick` log lines spike to 60/hour.

### Pitfall 7: Anthropic prompt cache integrity regression (cross-phase gate)

**What goes wrong:** Phase 19 does NOT touch any Anthropic code, BUT if a Phase 19 plan mistakenly imports from `src/prompts/` or threads sessionId through the cron path, the TEST-03 forward-defense (`tests/api/anthropic-payload-shape.test.ts`) could regress.
**Why it happens:** A planner could reasonably think "we need transcript-context to compose the would-be envelope" and reach into chat-context modules.
**How to avoid:** `chat-delivery.ts` is a pure module — NO imports from `@anthropic-ai/sdk`, `src/prompts/`, or `src/pages/`. The envelope is composed entirely from the KV transcript value's fields + locked vars.
**Warning signs:** Phase 19 source touches `src/prompts/*` or `src/data/portfolio-context.json`. `tests/api/anthropic-payload-shape.test.ts` fails.

## Code Examples

### Code Example 1: `wrangler.jsonc` edits (Phase 19 lock)

```jsonc
// Source: existing wrangler.jsonc post-Phase-18 + Phase 19 D-01 + CRON-01.
// VERIFIED 2026-05-12: triggers.crons array shape via WebFetch on
// https://developers.cloudflare.com/workers/configuration/cron-triggers/
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "jack-cutrara-portfolio",
  "main": "./src/worker.ts",
  "compatibility_date": "2026-04-04",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist/client"
  },
  "kv_namespaces": [
    {
      "binding": "CHAT_KV",
      "id": "eaa30fef259e4a6b9505b41bbf3f8f01",
      "preview_id": "115f3c1b0f8a4a1da9fee78c48dcb749"
    }
  ],
  "vars": {                            // NEW Phase 19
    "DRY_RUN": "1"                     // D-01 / D-02 — Phase 20 flips to "0"
  },
  "triggers": {
    "crons": ["0 * * * *"]             // EDIT Phase 19 — CRON-01
  },
  "preview_urls": true,
  "observability": {
    "logs": {
      "enabled": true,
      "invocation_logs": true
    }
  }
}
```

### Code Example 2: `src/worker.ts` `scheduled()` body edit

```typescript
// Source: existing src/worker.ts:22-44 + Phase 18 D-09/D-10 pattern.
// Replaces the current console.warn("worker.scheduled.stub", ...) +
// ctx.waitUntil(Promise.resolve()) with the actual deliverDue dispatch.

import { handle } from "@astrojs/cloudflare/handler";
import { deliverDue } from "./lib/chat-delivery";

export interface Env {
  ASSETS: Fetcher;
  CHAT_KV: KVNamespace;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
  CHAT_RECIPIENT_EMAIL: string;
  CHAT_SENDER_EMAIL: string;
  CHAT_RATE_LIMITER?: RateLimit;
  DRY_RUN: string;                     // NEW Phase 19 — D-01 / D-02
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    return handle(request, env, ctx);
  },
  async scheduled(controller, env, ctx): Promise<void> {
    // .catch INSIDE per Phase 18 D-09. err typed as unknown.
    ctx.waitUntil(
      deliverDue(env, controller.scheduledTime).catch((err: unknown) => {
        console.error("worker.scheduled.failed", {
          error_class: err instanceof Error ? err.constructor.name : "Error",
        });
      })
    );
  },
} satisfies ExportedHandler<Env>;
```

### Code Example 3: Full-jitter retry helper (recommended; see Open Question 2)

```typescript
// Source: AWS Architecture Blog "Exponential Backoff And Jitter"
// (https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
// VERIFIED 2026-05-12 — formula: sleep = random(0, min(cap, base * 2^attempt))
// Cap chosen at 5000ms (cron tick budget is 30s; 3 attempts × 5s = 15s ceiling).
const MAX_SEND_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 250;
const BACKOFF_CAP_MS = 5000;

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt + 1 >= maxAttempts) break;
      const ceiling = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt);
      const sleepMs = Math.floor(Math.random() * ceiling);
      await new Promise((r) => setTimeout(r, sleepMs));
    }
  }
  throw lastErr;
}
```

### Code Example 4: `package.json` script edit

```jsonc
// Add to scripts block per D-13. Other scripts UNCHANGED.
"dev:cron": "wrangler dev --test-scheduled"
```

Operator invokes locally via `pnpm dev:cron` then in a separate terminal: `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` ([VERIFIED 2026-05-12 via Context7]: the `cron` query parameter uses `+` for space-encoding).

## Open Question 1: Pagination strategy

### Recommendation

**Use strategy (a) — inside-batch pagination.** One tick processes up to **50 due sessions**, paginating through `list_complete=false` pages until the batch fills, the safety valve (50 pages = 50,000 keys) fires, or `list_complete=true`. Strategy (b) — page-per-tick — is rejected.

### Rationale

| Property | (a) Inside-batch pagination | (b) Page-per-tick |
|----------|----------------------------|-------------------|
| **Post-outage backlog recovery** | A single tick drains 50 sessions/hour regardless of where in the namespace they live (paginates through non-due pages to find due sessions). After a 12-hour outage with 300 backlogged sessions, drains in 6 ticks = 6 hours. | A single tick processes only ONE page (up to 1000 keys) — if the 300 backlogged sessions are spread across multiple pages, drain takes 300 / 50 = 6 ticks ALSO, but only if every page has 50 due sessions. If due sessions are scattered (interleaved with not-due ones), drain is bounded by page traversal: could take 12+ hours to even visit every page. |
| **CPU / wall-time** | Bounded by `PER_TICK_BATCH_CAP × per-session-cost` (50 × ~200ms ≈ 10s) PLUS `pages_scanned × list_cost` (50 × ~50ms ≈ 2.5s) = ~12.5s worst case. Well under 30s budget. | Bounded by `keys_per_page × filter_cost + due_count × per-session-cost`. Cheaper per-tick at low volume, but the "wasted" reads on a page where only 5 of 1000 keys are due is the cron's only work that hour. |
| **Predictability** | "50 sessions per hour OR until backlog clears" — operator-friendly. | "Whatever's in the next page" — opaque to the operator. |
| **Cron throughput at steady state** | Equal to (b) at steady state (single page, all due, drain fits inside cap). | Equal to (a). |
| **Cron behavior when due sessions are sparse across many pages** | DRAINS them. | STALLS them — could orphan a session indefinitely on page N if pages 1..N-1 are full of not-due sessions. |
| **Match to CRON-03 contract** | Per-tick batch cap of 50 AND pagination hard-cap of 50 pages are BOTH locked. (a) uses both invariants. | Pagination hard-cap is effectively N/A; only the batch cap is used. (b) underspends the locked invariants. |

**Cloudflare's stated behavior** (KV list-keys docs, VERIFIED 2026-05-12 via WebFetch):
- "The default is 1,000 keys, which is the maximum" (per page).
- `list_complete: false` means "more keys to fetch" (the canonical pagination terminator).
- "Checking for an empty array in `keys` is not sufficient to determine whether there are more keys to fetch."
- Cursor is opaque; pass verbatim on the next call.

**Cost estimate at v1.3 scale:** Production currently has ~8 `live:*` keys (per Phase 18 UAT Step 4 close). 50-page hard-cap is 50,000-key headroom — five orders of magnitude over current scale. Inside-batch pagination is operationally indistinguishable from page-per-tick at this volume, but provides backlog-drain insurance for free.

[VERIFIED: Cloudflare KV list-keys docs] [CITED: `.planning/research/PITFALLS.md#moderate-pitfall-b`]

## Open Question 2: Retry backoff curve

### Recommendation

**Use exponential backoff with full-jitter, base 250ms, cap 5000ms, 3 attempts.** Formula: `sleep_ms = random(0, min(5000, 250 * 2^attempt))`. Attempts 1 and 2 sleep before retry; attempt 3 throws on failure (caller handles per-session try/catch).

| Attempt | Ceiling (min(cap, base × 2^n)) | Possible sleep range (full jitter) |
|---------|--------------------------------|------------------------------------|
| 0 (initial) | — | 0ms (no pre-sleep) |
| 1 (after 1st failure) | min(5000, 250) = 250ms | random(0, 250)ms |
| 2 (after 2nd failure) | min(5000, 500) = 500ms | random(0, 500)ms |
| 3 (after 3rd failure) | — | throws to caller |

Worst-case end-to-end retry budget: ~750ms (250 + 500 ceilings). Well inside the 30s cron handler CPU budget even with 50 sessions running sequentially.

### Rationale

| Curve | Pros | Cons | Verdict |
|-------|------|------|---------|
| **Full-jitter exponential** (RECOMMENDED) | AWS-recommended; spreads retries evenly; avoids thundering herd; mathematically simple. [VERIFIED: AWS Architecture Blog 2026-05-12 via WebFetch] | None at v1.3 scale. | ✓ |
| Constant 500ms | Simplest math. | Synchronizes retries across sessions — at 50 sessions × 3 attempts × 500ms cluster = predictable thundering herd against Resend's 2 req/s rate limit. | ✗ |
| Linear 500/1000/1500ms | Easy to reason about. | Same thundering-herd problem; only minor improvement over constant. | ✗ |
| Exponential without jitter (100/500/2500ms) | Classic curve; predictable max delay. | Synchronizes retries (RESEARCH § AWS Blog: "with N clients contending, the total amount of work done by the system increases with N²"). | ✗ |
| Decorrelated jitter | Marginally better convergence than full jitter in some workloads. | More complex math; same end-to-end behavior at 3 attempts; not worth complexity. | ✗ |

**Resend's published retry guidance** (VERIFIED 2026-05-12 via WebFetch on `/docs/api-reference/errors`):
- 5xx errors: "Try the request again later." (No concrete backoff numbers published.)
- 429: "reduce the rate at which you request the API." (No concrete RPS specified in the errors page; the introduction page documents 2 req/s default.)
- Idempotency: 409 `concurrent_idempotent_requests` says "Try the request again later" — same retry posture.

Resend punts on the curve choice; AWS's full-jitter recommendation is the strongest industry signal for transactional API retries.

**Phase 19 unit-test value:** With a synthetic mock `sendOne` that throws on attempts 1+2+3, the test asserts: exactly 3 invocations of `sendOne`; the per-session `chat.delivery.failed` log fires once; the loop continues to the next session (per-session try/catch isolation). Backoff timing is mocked via `vi.useFakeTimers()` — the actual sleep durations are not under test.

[VERIFIED: AWS Architecture Blog — "Exponential Backoff And Jitter"] [CITED: Resend docs `/api-reference/errors`] [CITED: `.planning/research/PITFALLS.md#moderate-pitfall-c`]

## Open Question 3: `ctx.waitUntil` lifecycle inside `scheduled()`

### Confirmed: Phase 18 D-09 / D-10 / D-11 pattern applies identically to `scheduled()` (vs `fetch()`)

### Docs citation

[CITED: Cloudflare scheduled handler reference, Context7-verified 2026-05-12]

The scheduled handler's `ctx.waitUntil(promise)` semantics are documented identically to the fetch handler's:

> "Notifies the runtime to wait for asynchronous tasks such as logging, analytics, streaming, and caching. The first ctx.waitUntil() to fail will be recorded as the status in the Cron Trigger Past Events table. Otherwise, it will be reported as a success."

> "Multiple ctx.waitUntil() calls can be made within a single scheduled handler invocation"

**Behavioral parity with fetch path:**

1. **Rejection-handling semantics are identical.** A rejection inside the promise passed to `ctx.waitUntil` propagates to the runtime; for `fetch` it's silently observed; for `scheduled` it's recorded in Past Events. Either way, **without an inside-promise `.catch`, the rejection's CONTENT is not surfaced to Workers Logs** — only the bare fact of failure.

2. **The 30-second ceiling.** Documented under the Cloudflare Workers `ctx.waitUntil` page broadly: `waitUntil` extends execution up to 30 seconds AFTER the response close (for fetch) OR handler return (for scheduled). For Phase 19's scheduled handler this means: from the moment `scheduled()` returns synchronously (immediately, since it only schedules `ctx.waitUntil(deliverDue(...))`), the runtime gives 30 seconds for the wrapped promise to resolve.

3. **CPU budget caveat.** The 30-second `ctx.waitUntil` ceiling is **separate** from CPU time. Workers Free plan caps CPU at 10ms per request (default; configurable up to 30s on Paid). For Cron Triggers specifically on Free tier, [VERIFIED: Cloudflare docs] the cron handler gets the "Standard Worker" CPU budget — typically the default 30s on Paid, less on Free. Phase 19's elapsed_ms in `chat.delivery.tick` lets the operator measure actual usage. At expected v1.3 scale (single-digit sessions/tick × low-millisecond per-session under DRY_RUN), there is no risk of approaching either ceiling.

4. **Pattern Phase 19 inherits verbatim:**

```typescript
// SAME pattern as src/pages/api/chat.ts (Phase 18 D-09 / D-10 / D-11).
// SAME pattern as Cloudflare's official scheduled handler example.
ctx.waitUntil(
  deliverDue(env, controller.scheduledTime).catch((err: unknown) => {
    console.error("worker.scheduled.failed", {
      error_class: err instanceof Error ? err.constructor.name : "Error",
    });
  })
);
```

5. **Recommendation:** Add `tests/build/worker-scheduled-call-site.test.ts` (OPTIONAL per CONTEXT.md "Claude's Discretion") — source-text forward-defense that mirrors `tests/build/append-turn-call-site.test.ts`. The test asserts: (i) `deliverDue` is imported from `./lib/chat-delivery`, (ii) `ctx.waitUntil(deliverDue(` appears in source, (iii) the call chains `.catch(`, (iv) no `const { waitUntil } = ctx` destructure.

[CITED: Cloudflare scheduled handler — https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/]

## Open Question 4: `wrangler dev --test-scheduled` invocation pattern

### Confirmed shape

**Start the dev server:**
```bash
pnpm dev:cron   # which expands to: wrangler dev --test-scheduled
```

**Invoke the handler:**
```bash
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

### Docs citation

[VERIFIED 2026-05-12 via Context7 (`ctx7 docs //websites/developers_cloudflare_workers "wrangler dev test-scheduled"`)]:

> "Test the scheduled() handler behavior in local development using Wrangler by passing the `--test-scheduled` flag to `wrangler dev`. This exposes a test endpoint that can be invoked via HTTP requests."
>
> Test Endpoint (JavaScript/TypeScript Workers): `GET /__scheduled?cron=[CRON_EXPRESSION]`
>
> "**cron** (string) - Optional - Cron expression to simulate. Example: `*+*+*+*+*` (spaces encoded as `+`)"

### URL-encoding rules

- The `cron` query parameter uses **plus signs (`+`) for spaces**, not `%20`. So `* * * * *` becomes `*+*+*+*+*` and `0 * * * *` becomes `0+*+*+*+*`.
- Other valid forms tested in docs: `cron=*%2F3+*+*+*+*` (URL-encoded slash for `*/3 * * * *`).

### Local KV behavior

- **`wrangler dev` defaults to `--local`** mode, which uses an in-memory simulated KV namespace seeded from the `preview_id` in `wrangler.jsonc`. Local writes do NOT propagate to the production namespace.
- **For tests against real preview KV**, use `wrangler dev --remote` — but this is NOT what `dev:cron` should do. The operator pre-flight is purely "does the handler wire up?", not "does it find production data?" The end-to-end seed-and-sweep happens in Step 2 of `19-UAT.md` against a real preview/prod deploy.
- **Phase 18 UAT discovered** that Workers Builds branch previews bind KV to the PROD `id` namespace (not `preview_id`) — that's a Workers Builds quirk, not a `wrangler dev` quirk. Locally, `--test-scheduled` uses the in-memory simulator.

### Production differences

- No retries on local handler failures (Cloudflare retries cron in production only).
- No `controller.scheduledTime` from the cron scheduler — it's the time `__scheduled` was hit.
- No Past Events tab — operator sees only `wrangler tail`-style output in the dev console.
- DRY_RUN string `"1"` from `wrangler.jsonc` vars block IS respected locally — the dev runtime reads vars from the same config.

### Phase 19 use in `19-UAT.md`

This invocation is the **Step 1 PRE-FLIGHT** before the production `*****` Past-Events verification (Step 1 OF Step 1, so to speak). It catches handler-wiring regressions before deploy.

[VERIFIED: Cloudflare docs via Context7 2026-05-12]

## Open Question 5: KV `list({ prefix, cursor, limit })` semantics

### Confirmed shape

```typescript
const page = await env.CHAT_KV.list<KVMetadata>({
  prefix: "live:",
  cursor,                          // string | undefined
  limit: undefined,                // optional — default 1000, max 1000
});
// page = {
//   keys: Array<{
//     name: string;                // full key including prefix, e.g. "live:abc-…"
//     expiration?: number;         // Unix epoch seconds, present only if set
//     metadata?: KVMetadata;       // returned inline if non-null
//   }>;
//   list_complete: boolean;        // false if more pages exist (even if keys is empty)
//   cursor: string;                // opaque pagination token
// }
```

### Docs citation

[VERIFIED 2026-05-12 via WebFetch on https://developers.cloudflare.com/kv/api/list-keys/]:

**Limits:**
- "The default is 1,000 keys, which is the maximum" — default == maximum == 1000 per page.
- `expiration` field: "in absolute value form, even if it was set in TTL form" (Unix epoch seconds).
- `metadata`: "Returned only if non-null" (Phase 18 writes metadata on every put — every key will have it).

**Pagination contract:**
- `list_complete: false` "if there are more keys to fetch, even if the `keys` array is empty"
- `cursor` "used for paginating responses"; opaque (implementation details not disclosed)
- "Checking for an empty array in `keys` is not sufficient to determine whether there are more keys to fetch. Instead, use `list_complete`."

**Metadata-size cap (separate from list response):** 1024 bytes serialized per `metadata` field. Phase 18 `KVMetadata` shape `{ last_activity_at: ISO8601, msg_count: number, window_started_at: ISO8601, window_count: number }` is ~120 bytes serialized — well under cap. [VERIFIED: ARCHITECTURE § 6.2]

### Phase 18 KVMetadata shape verification

Phase 19 consumes Phase 18's metadata directly without an additional `get()`. The Phase 18 module `src/lib/chat-transcripts.ts:84-88` exports:

```typescript
export interface KVMetadata {
  last_activity_at: string;        // ISO 8601 — the 2h inactivity filter input
  msg_count: number;
  window_started_at: string;       // KV-05 quota window start
  window_count: number;            // KV-05 quota counter
}
```

Phase 19 only reads `metadata.last_activity_at` (for the filter). The other three fields are ignored (Phase 19 doesn't enforce KV-05).

**Critical:** Phase 19 imports the type via `import type { KVMetadata } from "./chat-transcripts"` to keep schema source-of-truth pinned to one module. If a future phase changes the metadata shape, Phase 19 fails to typecheck — catching drift at build time.

### list() does NOT return values

`kv.list()` returns keys + metadata + expiration ONLY. Per-key value bodies require `kv.get()`. Phase 19 reads the value body inside `promoteOne` ONLY AFTER the inactivity filter passes AND the `delivered:` cursor confirms not-yet-delivered — minimizes wasted reads.

[VERIFIED: Cloudflare KV list-keys docs via WebFetch 2026-05-12]

## Open Question 6: Cron schedule expression behavior

### Confirmed

**For Phase 19's single-cron-array config (`triggers.crons: ["0 * * * *"]`), the scheduled handler runs UNCONDITIONALLY on every invocation.** Do NOT include a `switch (controller.cron)` or `if (controller.cron === ...)` check in `src/worker.ts` — the handler invocation IS the schedule signal.

### Docs citation

[VERIFIED 2026-05-12 via Context7 + WebFetch on Cloudflare cron-triggers docs]:

**Multiple-cron pattern** (NOT what Phase 19 uses — included for forward-context):
> "When multiple Cron Triggers are configured, use `controller.cron` to distinguish which schedule fired"
>
> ```javascript
> async scheduled(controller, env, ctx) {
>   switch (controller.cron) {
>     case "*/5 * * * *":  ctx.waitUntil(fetch("https://example.com/api/sync")); break;
>     case "0 0 * * *":    ctx.waitUntil(env.MY_KV.put("last-cleanup", new Date().toISOString())); break;
>   }
> }
> ```

**Character-exact match warning** [CITED: RESEARCH § Moderate Pitfall F + Cloudflare docs]:
> `controller.cron` "Must match character-for-character with the configuration, including spacing."

This is the WHY behind "single cron = unconditional handler" — for v1.3, comparing strings is a pure surface for invisible failures (non-breaking spaces, tabs, copy-paste of dashes).

### `*****` UAT case (the every-minute test)

Setting `triggers.crons: ["* * * * *"]` (every minute) and `["0 * * * *"]` (top of every hour) produce IDENTICAL handler invocations as far as the code path is concerned — `deliverDue` runs the same way. The only difference is invocation rate. The `*****` UAT in Step 1 of `19-UAT.md` is purely a deploy-and-observe check (does the Past Events tab register an invocation within 90s?), with no handler logic difference.

### Past Events tab — minimum delay after deploy

[VERIFIED via WebFetch on Cloudflare cron-triggers docs 2026-05-12]:
> "It can take up to 30 minutes before events are displayed in **Past Cron Events** when creating a new Worker or changing a Worker's name."

For Phase 19 specifically, the Worker name is UNCHANGED (`jack-cutrara-portfolio` from Phase 17). New cron triggers on an existing Worker register faster. The roadmap's "≥1 invocation visible within 90 seconds" success criterion targets this fast path. **If the operator runs Step 1 and sees nothing in 90 seconds, the recovery procedure is: wait up to 30 minutes before retrying** — that's the documented worst case for a newly-created Worker, but this Worker has been live since Phase 17 Plan 17-02.

### Cron handler invocation context

[VERIFIED via Context7]:
- `controller.cron` (string) — the matching cron expression string. For v1.3 single-cron, always `"0 * * * *"` (or `"* * * * *"` during UAT Step 1).
- `controller.type` (string) — always `"scheduled"`.
- `controller.scheduledTime` (number) — Unix milliseconds since 1970-01-01 UTC. Phase 19 passes this through to `deliverDue` so the inactivity filter uses the scheduled-tick time, NOT `Date.now()` (a few-ms drift for tick-as-batch consistency).

[CITED: Cloudflare scheduled handler docs] [CITED: `.planning/research/PITFALLS.md#moderate-pitfall-f`]

## Open Question 7: Workers Logs structured-log convention

### Confirmed shape

```typescript
console.log("event.name", { flat_primitive_field_1: value_1, flat_primitive_field_2: value_2 });
```

- First arg: dotted-event-name string literal (e.g., `"chat.delivery.tick"`).
- Second arg: flat object with primitive-only values (string, number, boolean, null).
- Workers Logs auto-indexes the second-arg fields as searchable/filterable.
- `wrangler tail --search "event.name"` filters on the first-arg substring.
- NO `JSON.stringify` wrapping needed.

### Docs citation

[VERIFIED 2026-05-12 via WebFetch on https://developers.cloudflare.com/workers/observability/logs/workers-logs/]:

> "Workers Logs automatically extracts fields from JSON objects: `console.log({user_id: 123})` results in `{user_id: 123}` being indexed as searchable fields rather than embedded in a message string."
>
> "Logs can be filtered against the keys `user_id` and `user_email` — flat primitive approach enables 'faster queries' and filtering 'across any dimension for fields with unlimited cardinality.'"
>
> "A single log has a maximum size limit of 256 KB. Logs exceeding that size will be truncated and the log's `$cloudflare.truncated` field will be set to true."

### Phase 19 conformance

Phase 19's log namespace is **`chat.delivery.*`** — owned end-to-end by `chat-delivery.ts` and `src/worker.ts`'s `worker.scheduled.failed`:

| Log line (first arg) | Severity | Source | Field set |
|---------------------|----------|--------|-----------|
| `chat.delivery.tick` | `console.log` | `chat-delivery.ts` end of `deliverDue` | `{ sessions_seen, sessions_due, sessions_promoted, errors, pages_scanned, elapsed_ms, batch_capped? }` |
| `chat.delivery.dry_run` | `console.log` | `chat-delivery.ts` inside the would-be-send harness, gated on `env.DRY_RUN === "1"` | `{ sid, to, from, reply_to, msg_count, truncated, country, referrer_host, dry_run: true }` (D-05 NAMES locked) |
| `chat.delivery.skipped_already_delivered` | `console.log` | `chat-delivery.ts` inside `promoteOne` after the `delivered:` cursor read returns non-null | `{ sid, delivered_at_existing }` |
| `chat.delivery.failed` | `console.error` | `chat-delivery.ts` per-session try/catch | `{ sid, error_class, msg_count? }` |
| `worker.scheduled.failed` | `console.error` | `src/worker.ts` outer `.catch` on the `ctx.waitUntil` promise | `{ error_class }` (catastrophic-only — `deliverDue` rarely re-throws) |

**Why `chat.delivery.tick` is the operational ground truth:** `wrangler tail --format json --search chat.delivery.tick` returns one structured line per cron invocation. Workers Logs query examples:
- "Sessions due in the last 24h": filter `event = chat.delivery.tick` then sum `sessions_due`.
- "Average pages scanned": filter `event = chat.delivery.tick` then average `pages_scanned`.
- "Tick elapsed time outliers": filter `event = chat.delivery.tick` where `elapsed_ms > 10000`.

[VERIFIED: Cloudflare Workers Logs docs via WebFetch] [CITED: Plan 17-05 DEBT-02 `chat.cache_metrics` precedent + Phase 18 `chat.transcript.*` namespace]

## State of the Art

| Old approach | Current approach | When changed | Impact |
|--------------|------------------|--------------|--------|
| `wrangler.toml` (TOML config) | `wrangler.jsonc` (JSONC config) | 2024 — Wrangler stable | This project already uses `wrangler.jsonc`; no migration needed. |
| Pages Functions with cron | Workers Static Assets with `triggers.crons` | Phase 17 (2026-05-10) | Cloudflare Pages does NOT support Cron Triggers. Phase 17 migration was the unlock. [CITED: PITFALLS § Critical Pitfall 0] |
| `event.waitUntil()` (service-worker style) | `ctx.waitUntil()` (ES modules) | Workers ES Modules migration | Project is fully ES-modules. Phase 18 wired this for the fetch path; Phase 19 wires it for scheduled. |
| Single-keyspace with `delivered: bool` flag | Two-keyspace (`live:` / `delivered:`) partition | This research (2026-05-09) | KV has no CAS — flag-in-value is racy. Two-keyspace exploits KV's key-as-filter affordance. |
| Pure exponential backoff | Exponential with full-jitter | Industry shift ~2015 (AWS Architecture Blog) | Thundering-herd avoidance at low marginal complexity cost. [VERIFIED: AWS blog] |

**Deprecated / outdated:**
- `locals.runtime.ctx` (Astro v5) — REMOVED in Astro v6; throws `"Astro.locals.runtime.ctx has been removed in Astro v6. Use 'Astro.locals.cfContext' instead."` Phase 18 D-CT-PA-01 locked the migration; Phase 19 doesn't touch `locals.cfContext` directly (the cron handler doesn't go through Astro), but the lesson informs the `Env` interface shape.
- MailChannels Workers email — free Cloudflare tier ended 2024-08-31 (CITED: STACK.md). Not relevant to Phase 19 (no email work), but informs Phase 20's Resend choice.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Workers Free plan's cron CPU budget is sufficient for 50-session sequential sweep under DRY_RUN (~milliseconds per envelope log) | Pitfall 5 + Open Question 3 | LOW — DRY_RUN envelope logs are microsecond-level. Phase 19 elapsed_ms in `chat.delivery.tick` lets the operator measure. Phase 20 will revisit when real Resend POSTs (~200ms each × 50 = 10s) push the budget. |
| A2 | `wrangler dev --test-scheduled` `cron` query param URL-encoding uses `+` for space (not `%20`) | Open Question 4 | NONE — verified via Context7 explicit example `cron=*+*+*+*+*`. |
| A3 | Workers Logs second-arg-object auto-indexing works without `JSON.stringify` wrapping | Open Question 7 | NONE — verified via WebFetch on official docs explicit example. |
| A4 | Phase 18 transcripts written before Phase 19 deploys will be picked up by the first cron tick after deploy (no backfill needed) | Runtime State Inventory | NONE — Phase 19's filter only checks `metadata.last_activity_at`; Phase 18 writes that field on every put. Phase 18 UAT Step 4 confirmed 8 production keys with conforming metadata at Phase 18 close. |
| A5 | The 2h inactivity threshold + 60s KV consistency window is structurally safe (no need for `delivery_lock:{sid}` cross-tick mutex) | Pitfall 2 + Don't Hand-Roll | LOW — ARCHITECTURE § 7.2 Layer 3 explicitly says "skip for v1.3"; the threshold absorbs the window. |

**Empty?** No — 5 assumptions logged. None reach high-risk per the Risk-if-Wrong column. The planner should treat A1 as the one to watch when Phase 20 lands (real Resend POSTs change the math); A2–A5 are fully verified or structurally safe.

## Open Questions (after research)

All 7 Open Questions from CONTEXT.md are answered above with explicit recommendations. There are no UNRESOLVED questions remaining.

**One operational follow-up** (not blocking Phase 19 planning): after the production `*****` UAT in Step 1, the operator should record the actual delay between deploy and first Past Events entry. If consistently >2 minutes, update `19-UAT.md` Step 1's 90s ceiling to match. (Worst documented case is 30 minutes for new Workers — this Worker is not new, so a ~30s actual is expected.)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Astro 6 build + wrangler | ✓ | ≥22 per package.json `engines.node` | — |
| `wrangler` CLI | Cron registration; local `--test-scheduled` | ✓ | 4.83.0 (installed); 4.90.1 (latest) | — |
| `@astrojs/cloudflare` adapter | Custom Worker entrypoint shape | ✓ | 13.1.7 (installed); 13.5.0 (latest) | — |
| `vitest` | Unit tests | ✓ | 4.1.0 | — |
| Cloudflare account access | Operator-side: deploy + Past Events + `wrangler tail` for Step 1 of UAT | ✓ (per Phase 17 + Phase 18 UAT history) | — | None — DEPLOY-GATE.md posture: executor MUST NOT run `wrangler deploy`; operator drives. |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

Phase 19 is fully executable with the existing toolchain. No `npm install` step required.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 ([VERIFIED: package.json]) |
| Config file | `vitest.config.ts` at project root (existing — Phase 17/18 pattern) |
| Quick run command | `pnpm test -- tests/api/chat-delivery.test.ts tests/build/worker-scheduled-call-site.test.ts tests/build/wrangler-cron-shape.test.ts` |
| Full suite command | `pnpm test` |
| Phase gate | `pnpm test` exits 0 with ≥425 PASS / 0 FAIL / 2 SKIP (baseline 419 PASS + ≥6 new Phase 19 tests) AND `pnpm exec astro check` exits 0/0/0 AND `pnpm build` clean. |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| CRON-01 | `wrangler.jsonc` `triggers.crons` is `["0 * * * *"]` (single-element array, character-exact) | build-time (source-text) | `pnpm test -- tests/build/wrangler-cron-shape.test.ts` | ❌ NEW (optional) |
| CRON-01 | `src/worker.ts` `scheduled()` body calls `ctx.waitUntil(deliverDue(...).catch(...))` with .catch INSIDE | build-time (source-text) | `pnpm test -- tests/build/worker-scheduled-call-site.test.ts` | ❌ NEW (optional) |
| CRON-01 (operational closure) | Cron actually fires; ≥1 invocation in Past Events within 90s of deploy with `triggers.crons: ["* * * * *"]` | manual UAT (Step 1) | n/a — operator-driven per D-12 | ❌ NEW: `19-UAT.md` Step 1 |
| CRON-02 | `deliverDue` lists `prefix: "live:"` with cursor pagination | unit (mock KV) | `pnpm test -- tests/api/chat-delivery.test.ts -t "paginates through list_complete=false"` | ❌ NEW: `tests/api/chat-delivery.test.ts` |
| CRON-02 | Filters via `metadata.last_activity_at < now − 2h` | unit (mock KV with synthetic metadata) | `pnpm test -- tests/api/chat-delivery.test.ts -t "filters sessions newer than 2h"` | ❌ NEW |
| CRON-02 | Two-keyspace ordering: PUT delivered: BEFORE would-be POST; DELETE live: AFTER | unit (mock KV with call-order assertion) | `pnpm test -- tests/api/chat-delivery.test.ts -t "PUT delivered before DELETE live"` | ❌ NEW |
| CRON-02 | Idempotency cursor — second tick over same KV state results in 0 new envelope logs | unit (mock KV pre-seeded with delivered:) | `pnpm test -- tests/api/chat-delivery.test.ts -t "skips already-delivered sessions"` | ❌ NEW |
| CRON-02 (operational closure) | Real preview/prod Step 2: seed `live:test-uat-<sid>` with stale `last_activity_at`, invoke cron, verify `delivered:` exists + `chat.delivery.dry_run` logs + `live:` deleted | manual UAT (Step 2) | n/a — operator-driven | ❌ NEW: `19-UAT.md` Step 2 |
| CRON-03 | Per-session try/catch isolates failures — one bad session does not abort sweep | unit (mock KV + mock `sendOne` throwing on one specific sid) | `pnpm test -- tests/api/chat-delivery.test.ts -t "per-session try/catch isolation"` | ❌ NEW |
| CRON-03 | Per-tick batch cap of 50 sessions enforced | unit (mock KV with 60 due sessions) | `pnpm test -- tests/api/chat-delivery.test.ts -t "batch cap at 50 sessions"` | ❌ NEW |
| CRON-03 | Send-attempt counter cap of 3 retries (with mock throwing on attempts 1+2+3) | unit (mock `sendOne` + `vi.useFakeTimers`) | `pnpm test -- tests/api/chat-delivery.test.ts -t "retry harness 3-try cap"` | ❌ NEW |
| CRON-03 | Pagination hard-cap of 50 pages safety valve | unit (mock KV `list_complete: false` indefinitely) | `pnpm test -- tests/api/chat-delivery.test.ts -t "pagination hard-cap 50 pages"` | ❌ NEW |
| CRON-03 | Structured JSON logs (`chat.delivery.tick` + `chat.delivery.dry_run`) | unit (`vi.spyOn(console, "log")`) | `pnpm test -- tests/api/chat-delivery.test.ts -t "emits chat.delivery.tick"` | ❌ NEW |
| CRON-03 (operational closure) | Real preview/prod Step 4: bash loop seeds 60 stale keys, first tick logs `sessions_due: 60` but `sessions_promoted: 50`, second tick drains remaining 10 | manual UAT (Step 4) | n/a — operator-driven | ❌ NEW: `19-UAT.md` Step 4 |
| CRON-04 | `env.DRY_RUN === "1"` toggles `sendOne` path between envelope-log (dry-run) and throw (would-be real send) | unit (mock env with both values) | `pnpm test -- tests/api/chat-delivery.test.ts -t "DRY_RUN gate"` | ❌ NEW |
| CRON-04 | `delivered:{sid}` value has `dry_run: true` under DRY_RUN | unit (mock KV; inspect put argument) | `pnpm test -- tests/api/chat-delivery.test.ts -t "delivered: value carries dry_run: true"` | ❌ NEW |
| D-26 forward-defense (informational) | `pnpm test` chat-surface regression battery 419+ PASS / 0 FAIL / 2 SKIP | full suite | `pnpm test` | ✅ existing |
| D-15 forward-defense (informational) | SSE byte-identical at `/api/chat` — Phase 19 should not affect | unit (existing) | `pnpm test -- tests/api/sse-snapshot.test.ts` | ✅ existing |
| TEST-03 forward-defense (informational) | Anthropic prompt cache integrity — sessionId not in cached surface | unit (existing) | `pnpm test -- tests/api/anthropic-payload-shape.test.ts` | ✅ existing |
| Typecheck | `pnpm exec astro check` exits 0/0/0 | full | `pnpm exec astro check` | ✅ existing |
| Build | `pnpm build` exits clean (incl. wrangler types regen after triggers.crons + vars.DRY_RUN edit) | full | `pnpm build` | ✅ existing |

### Sampling Rate

- **Per task commit:** `pnpm test -- tests/api/chat-delivery.test.ts tests/build/worker-scheduled-call-site.test.ts tests/build/wrangler-cron-shape.test.ts` — runs the Phase 19 new tests only (~2s warm; <5s cold).
- **Per wave merge:** `pnpm test` (full suite) — verifies D-26 / D-15 / TEST-03 forward-defense holds (~10s).
- **Phase gate:** `pnpm test` GREEN + `pnpm exec astro check` 0/0/0 + `pnpm build` clean + 19-UAT.md Steps 1–5 all PASS.

### Wave 0 Gaps

- [ ] `tests/api/chat-delivery.test.ts` — covers CRON-02 / CRON-03 / CRON-04 unit-level (mock KV)
- [ ] `tests/build/worker-scheduled-call-site.test.ts` — source-text forward-defense for CRON-01 entrypoint shape (OPTIONAL per CONTEXT.md)
- [ ] `tests/build/wrangler-cron-shape.test.ts` — source-text forward-defense for `wrangler.jsonc` `triggers.crons` and `vars.DRY_RUN` (OPTIONAL per CONTEXT.md; STRONGLY RECOMMENDED to catch the unreverted `*****` UAT pitfall per Pitfall 6)
- [ ] Framework install: NONE — Vitest 4.1.0 already in devDependencies

### Test architecture notes

- **Mock KV pattern** — reuse the 30-LOC `MockKVNamespace` class from `tests/api/chat-transcripts.test.ts` (Plan 18-02). EXTEND to also support `kv.list({ prefix, cursor, limit })` returning `{ keys, list_complete, cursor }` shape — Phase 18's mock implements `list` but does not exercise pagination. Phase 19's tests need synthetic `list_complete: false` + cursor responses.
- **Fake timers** — `vi.useFakeTimers()` for the retry-backoff test so the 3 attempts complete synchronously (no real `setTimeout` wait).
- **Console spy pattern** — `vi.spyOn(console, "log"|"warn"|"error").mockImplementation(() => {})` per Plan 17-05 / Phase 18 precedent.
- **Hard-coded fixture sessionIds** — `"22aa504f-f9f0-445b-bcf5-892a3fb15218"` (Phase 18 UAT used this) and 50–60 synthetic UUIDv4s for the batch-cap and pagination tests.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 19 has no auth surface (cron handler is platform-invoked, no user requests). |
| V3 Session Management | no | sessionId is read from KV (Phase 18-written), not minted or validated in Phase 19. |
| V4 Access Control | yes | `delivered:{sid}` writes are the ONLY new permission introduced. Implicit: the cron handler runs with the same `env.CHAT_KV` binding the fetch path uses — same namespace, same access. No new IAM/permission scope. |
| V5 Input Validation | partial | `metadata.last_activity_at` is server-written by Phase 18; Phase 19 reads it as ISO-8601. `Date.parse(...)` returning `NaN` on malformed metadata must be guarded (skip-the-row, not throw). Other inputs (the transcript value's `msg_count`, `truncated`, `meta.country`, etc.) are server-written and structurally trusted, but Phase 19 should still defensively narrow types via the imported `ChatTranscript` interface. |
| V6 Cryptography | no | No crypto in Phase 19. Phase 20 will revisit when Resend `Authorization: Bearer` ships. |
| V7 Error Handling | yes | Per-session try/catch isolation + structured error logs (`chat.delivery.failed`) + outer `worker.scheduled.failed` catch. No error detail leaked beyond Workers Logs (silent posture per CONTEXT.md). |
| V8 Data Protection | yes | KV transcripts contain visitor-typed text. Phase 19 reads but does NOT log message content (envelope only carries `msg_count` + `truncated`, not turn text). Log surface is bounded. |
| V9 Communication | no | Cron handler has no outbound HTTP in Phase 19 (under DRY_RUN). Phase 20 will need V9 for Resend POST. |
| V11 Business Logic | yes | The two-keyspace ordering invariant IS the business-logic safety property. Forward-defense unit tests assert call ordering (PUT delivered: before DELETE live:). |

### Known Threat Patterns for Cloudflare Workers Cron + KV

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cron handler crashes mid-loop, partial batch dropped silently | Repudiation | `worker.scheduled.failed` log captures the crash; per-session try/catch ensures one bad session can't crash the whole loop; structural recovery via re-run on next tick. |
| KV `list` returns stale view, cron misses recent sessions | Tampering | 2h inactivity threshold absorbs the 60s KV consistency window structurally; threshold lock at STATE.md line 77. |
| Two ticks race, both attempt to deliver same session | Repudiation + Tampering | Two-keyspace partition Layer 1 (`delivered:` cursor read happens BEFORE any work); Layer 2 (Resend `Idempotency-Key`) deferred to Phase 20. |
| KV write success but Cloudflare data-plane lag means next tick re-reads pre-write state | Tampering | Last-writer-wins on PUT; 24h TTL on `delivered:` is long enough that propagation lag never spans the window. |
| Misconfigured `triggers.crons` (e.g., `* * * * *` left in production after Step 1 UAT) | Denial of Service (self-DoS via cron storm) | Recommended forward-defense: `tests/build/wrangler-cron-shape.test.ts` source-text guard asserting `["0 * * * *"]` exactly. Build-time fail catches unreverted state before deploy. |
| Cron handler reads from a KV namespace not bound to the Worker | Information Disclosure / Privilege escalation | N/A — Phase 19 uses the same `env.CHAT_KV` binding as the fetch path; no new namespace. `wrangler types` regenerates `worker-configuration.d.ts` after the vars edit; mismatched bindings would fail typecheck. |
| Adversarial transcript content escapes through envelope log into `wrangler tail` output | Information Disclosure (via log injection) | Envelope log carries primitives ONLY (`country`, `referrer_host`, `msg_count`, `truncated`) — no user-typed message content. `referrer_host` is a parsed hostname, not raw `referrer`. |
| Forgotten `DRY_RUN: "0"` in preview while Phase 19 ships | Functional (not security) | Phase 19 has no real Resend path — even if `DRY_RUN === "0"`, the inner `sendOne` does not POST. (Phase 20 will add the real path; the harness exists in Phase 19 for the retry structure.) Defense-in-depth: the unit test `pnpm test -- tests/api/chat-delivery.test.ts -t "DRY_RUN gate"` documents both branches. |

### Phase 19 security exit gates

- No new outbound HTTP surface (Phase 20's responsibility).
- No secrets reads in `chat-delivery.ts` beyond `env.DRY_RUN` (a non-secret var per D-01).
- All KV reads/writes scoped to `env.CHAT_KV` (the existing Phase 17-bound namespace).
- Log surface bounded to envelope fields + counters; no user-typed content emitted.
- Per-session try/catch isolation guarantees one malicious payload can't crash the cron.

## Sources

### Primary (HIGH confidence)

- [Cloudflare scheduled handler reference](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) — VERIFIED 2026-05-12 via Context7 (`/websites/developers_cloudflare_workers`) — `scheduled(controller, env, ctx)` signature, `ctx.waitUntil()` semantics, Past Events behavior, multiple-cron switching pattern, `wrangler dev --test-scheduled` endpoint shape (`/__scheduled?cron=*+*+*+*+*`).
- [Cloudflare Cron Triggers configuration](https://developers.cloudflare.com/workers/configuration/cron-triggers/) — VERIFIED 2026-05-12 via WebFetch — `triggers.crons` array shape, cron expression syntax, "up to 30 minutes" Past Events display delay on new Workers, `controller.cron` character-exact match warning.
- [Cloudflare KV list-keys API](https://developers.cloudflare.com/kv/api/list-keys/) — VERIFIED 2026-05-12 via WebFetch — default + max limit 1000 per page, `list_complete` is authoritative pagination terminator, metadata returned inline, "empty array in keys is not sufficient" warning.
- [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) — VERIFIED 2026-05-12 via WebFetch — `console.log("event", {fields})` auto-indexing, flat-primitive recommendation, 256 KB log line cap.
- [Cloudflare Workers environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/) — VERIFIED 2026-05-12 via WebFetch — `vars` block typing, string access via `env.X`, redeploy semantics.
- [AWS Architecture Blog: Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) — VERIFIED 2026-05-12 via WebFetch — full jitter formula `sleep = random(0, min(cap, base × 2^attempt))`, thundering-herd avoidance, full jitter beats decorrelated jitter.
- `.planning/research/SUMMARY.md` (project-internal v1.3 research, 2026-05-09) — Phase 19 rationale, DRY_RUN env flag mechanic, pagination loop on `list_complete`, 50-page safety valve.
- `.planning/research/STACK.md` — Cloudflare Cron Triggers configuration, free-tier limits, `--test-scheduled` for local testing.
- `.planning/research/ARCHITECTURE.md` — § 6 KV data shape rationale (two-keyspace partition mechanics); § 7.2 ordering invariant (PUT delivered BEFORE send; DELETE live AFTER success); § 7 layered defenses.
- `.planning/research/PITFALLS.md` — Critical Pitfall 0/2/4/5/6, Moderate Pitfall B/C/F/H/J.
- `src/lib/chat-transcripts.ts` (Phase 18 close 2026-05-11) — analog module shape; exports `ChatTranscript`, `KVMetadata`, `KEY_PREFIX` for Phase 19 type reuse.
- `tests/build/append-turn-call-site.test.ts` (Phase 18) — source-text forward-defense pattern Phase 19's optional `worker-scheduled-call-site.test.ts` will mirror.
- `wrangler.jsonc` (current) + `package.json` (current) — verified current shape against which Phase 19 edits land.

### Secondary (MEDIUM confidence)

- [Resend API errors reference](https://resend.com/docs/api-reference/errors) — VERIFIED 2026-05-12 via WebFetch — 5xx "try again later" guidance; 429 "reduce rate" guidance; 409 idempotent-request semantics. NO concrete backoff curve published.
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/) — referenced by cron-triggers docs; concrete Free vs Paid CPU budget numbers cited via cross-reference but not directly read this session.

### Tertiary (LOW confidence)

- None — every recommendation traces to at least one HIGH or MEDIUM source. The retry curve recommendation (Open Question 2) anchors on AWS (HIGH) because Resend (MEDIUM) is silent.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every dependency already installed; versions verified via `npm view`; no new packages.
- Architecture: HIGH — pattern is direct execution of locked CONTEXT.md decisions + Phase 18's proven module/test pattern.
- Pagination strategy (Open Question 1): HIGH — Cloudflare docs explicit on `list_complete` semantics; recommendation grounded in operational tradeoff comparison.
- Retry curve (Open Question 2): MEDIUM-HIGH — AWS source is authoritative for the formula; Resend silent on specifics so MEDIUM on "Phase 20 will not override this choice."
- `ctx.waitUntil` lifecycle (Open Question 3): HIGH — Context7-verified scheduled handler docs.
- `wrangler dev --test-scheduled` invocation (Open Question 4): HIGH — Context7-verified exact `cron=*+*+*+*+*` URL example.
- KV list semantics (Open Question 5): HIGH — WebFetch-verified on official KV docs.
- Cron schedule expression behavior (Open Question 6): HIGH — Context7 + WebFetch double-verified.
- Workers Logs convention (Open Question 7): HIGH — WebFetch-verified.
- Common pitfalls: HIGH — every pitfall sourced from RESEARCH/PITFALLS.md (v1.3-wide research) or Phase 18 SUMMARY learnings.
- Validation architecture: HIGH — built directly from CRON-01..04 requirement texts + Phase 18 test-pattern precedent.
- Security domain: HIGH — Phase 19 has a small, well-scoped attack surface; every applicable ASVS category mapped to a control.

**Research date:** 2026-05-12
**Valid until:** 2026-06-11 (30 days — Cloudflare Workers / KV / Resend docs are stable infrastructure; no fast-moving surface)

## RESEARCH COMPLETE

**Phase:** 19 - Cron Sweep — Scheduling + Idempotency (DRY_RUN)
**Confidence:** HIGH

### Key Findings

1. **Phase 19 is one pure module + one entrypoint edit + two config edits + one new test file + one UAT doc.** Every primitive (cron, KV list, KV put with TTL, `ctx.waitUntil`, structured logs) is platform-native and Context7-verified. Zero new dependencies. Module shape is byte-for-byte structurally analogous to Phase 18's `chat-transcripts.ts`.
2. **Pagination strategy = inside-batch (option a).** Drains backlog deterministically at the locked 50-session-per-tick cap regardless of how due sessions are distributed across pages; uses both CRON-03 caps (per-tick + per-pagination).
3. **Retry backoff curve = full-jitter exponential, base 250ms, cap 5000ms, 3 attempts.** AWS-recommended; thundering-herd-safe; worst-case ~750ms total retry budget — well inside cron CPU budget. Unit-test with mock `sendOne` throwing on attempts 1+2+3 + `vi.useFakeTimers`.
4. **`ctx.waitUntil` rejection-handling pattern is identical for scheduled() and fetch().** Phase 18 D-09 / D-10 / D-11 pattern (`.catch` INSIDE the promise BEFORE pass to `ctx.waitUntil`) applies verbatim. Forward-defense test in `tests/build/worker-scheduled-call-site.test.ts` recommended (mirrors `append-turn-call-site.test.ts`).
5. **`wrangler dev --test-scheduled` invocation is `GET /__scheduled?cron=*+*+*+*+*`** (plus-encoded spaces). Confirmed via Context7. `pnpm dev:cron` script wires this for the local pre-flight before the production Step 1 UAT.
6. **KV `list()` pagination uses `list_complete` (not empty-array) as terminator.** Default + max page size is 1000. `metadata` returned inline (no extra `get` round-trip). Phase 18's `KVMetadata` shape parses cleanly without extra work.
7. **Cron schedule expression is character-exact;** for single-cron config, the handler runs UNCONDITIONALLY (no `controller.cron` switch). Past Events tab refreshes within ~30 min on a new Worker; this Worker is not new, so ≥1 invocation in 90s for the `*****` UAT is the documented fast path.
8. **Workers Logs auto-indexes flat-object second-arg fields** (`console.log("event.name", { flat_primitives })`). Phase 19 reuses the Plan 17-05 DEBT-02 + Phase 18 `chat.transcript.*` convention under the new `chat.delivery.*` namespace.

### File Created

`.planning/phases/19-cron-sweep-scheduling-idempotency-dry-run/19-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard stack | HIGH | Zero new deps; versions verified via `npm view`; project already on a Phase-18-proven toolchain. |
| Architecture | HIGH | Every pattern is a direct application of locked CONTEXT.md decisions + Phase 18 precedent + Context7-verified Cloudflare APIs. |
| Pagination (OQ-1) | HIGH | Cloudflare docs explicit; tradeoff analysis grounds the strategy (a) choice. |
| Retry curve (OQ-2) | MEDIUM-HIGH | AWS-verified formula; Resend silent on specifics so the choice will hold through Phase 20 unless live retry data informs otherwise. |
| ctx.waitUntil lifecycle (OQ-3) | HIGH | Context7-verified; identical to Phase 18 fetch-path pattern. |
| wrangler dev --test-scheduled (OQ-4) | HIGH | Context7-verified exact URL/cron-encoding example. |
| KV list semantics (OQ-5) | HIGH | WebFetch-verified on official docs. |
| Cron schedule expression (OQ-6) | HIGH | Context7 + WebFetch double-verified. |
| Workers Logs convention (OQ-7) | HIGH | WebFetch-verified on official docs. |
| Pitfalls | HIGH | All sourced from project's v1.3-wide PITFALLS.md or Phase 18 close-out learnings. |
| Validation architecture | HIGH | Built directly from CRON-01..04 + Phase 18 test-pattern precedent. |
| Security domain | HIGH | Phase 19 attack surface is small and well-scoped; all applicable ASVS categories mapped to controls. |

### Open Questions

None unresolved. All 7 CONTEXT.md Open Questions have explicit recommendations with citations. One operational follow-up flagged: record actual Past Events display delay during UAT Step 1, refine the 90s ceiling in `19-UAT.md` if needed (not blocking).

### Ready for Planning

Research complete. Planner can now create PLAN.md files. Recommended plan shape (see "Implementation Plan" below): 4–5 plans across 3 waves.

## Implementation Plan (high-level — for the planner)

> Pure recommendation; planner makes final call on plan count, wave structure, and task split.

**Suggested plan shape: 4 plans across 3 waves.**

### Wave 0 (Day-1 gate, no dependencies)

**Plan 19-01 — `pnpm dev:cron` ergonomics + DRY_RUN env wiring (low-risk preflight)**
- ADD `"dev:cron": "wrangler dev --test-scheduled"` to `package.json` (D-13).
- ADD `vars.DRY_RUN: "1"` to `wrangler.jsonc` (D-01 / D-02). NOTE: do NOT add `triggers.crons` yet — Plan 19-04 adds it as the final atomic deploy commit; that ordering ensures the cron doesn't fire on a deployed worker before `deliverDue` is wired.
- ADD `DRY_RUN: string` field to `Env` interface in `src/worker.ts`.
- Re-run `wrangler types` to verify `worker-configuration.d.ts` regenerates cleanly.
- Closes: D-13, prereq for CRON-04 string-check pattern.

### Wave 1 (depends on Wave 0)

**Plan 19-02 — NEW `src/lib/chat-delivery.ts` module (the core deliverable)**
- TDD: author `tests/api/chat-delivery.test.ts` with full mock-KV test surface (RED) — 12–15 tests covering: schema-versioned `delivered:` value shape, two-keyspace ordering (PUT delivered: BEFORE DELETE live:), idempotency-cursor skip, inactivity filter, batch cap 50, pagination cursor pass-through + `list_complete` terminator, pagination hard-cap 50 pages, retry harness 3-try with fake timers, per-session try/catch isolation, DRY_RUN gate (envelope log fires when `env.DRY_RUN === "1"`, skips envelope log + still goes through ordering when `"0"`), structured-log emission (`chat.delivery.tick` + `chat.delivery.dry_run` + `chat.delivery.skipped_already_delivered` + `chat.delivery.failed`).
- CREATE `src/lib/chat-delivery.ts` (~200 LOC estimate) to make tests GREEN. Module owns: `deliverDue(env, scheduledTime?)`, `promoteOne(env, sid, scheduledAt)`, `retryWithBackoff(fn, maxAttempts)`, and the constants (`INACTIVITY_THRESHOLD_MS`, `PER_TICK_BATCH_CAP`, `PAGINATION_PAGE_HARDCAP`, `MAX_SEND_ATTEMPTS`, `BACKOFF_BASE_MS`, `BACKOFF_CAP_MS`, `DELIVERED_PREFIX = "delivered:"`, `DELIVERED_TTL_SECONDS = 24*3600`).
- Pure module: imports only `KVNamespace` types + types from `./chat-transcripts`. No `@anthropic-ai/sdk`, no `cloudflare:workers`, no `src/prompts/`.
- Reuse `ChatTranscript`, `KVMetadata`, `KEY_PREFIX` from `chat-transcripts.ts` via `import type`.
- Closes: CRON-02, CRON-03, CRON-04 (code paths). Operational closure of these requirements happens in `19-UAT.md`.

### Wave 2 (depends on Wave 1)

**Plan 19-03 — `src/worker.ts` `scheduled()` body edit + optional source-text forward-defense**
- EDIT `src/worker.ts` `scheduled()` body: replace stub with `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch(handler))` per the locked pattern.
- ADD `tests/build/worker-scheduled-call-site.test.ts` (RECOMMENDED per CONTEXT.md "D-26 forward-defense"): mirrors `tests/build/append-turn-call-site.test.ts` — asserts (1) `deliverDue` imported from `./lib/chat-delivery`, (2) `ctx.waitUntil(deliverDue(` appears in source, (3) `.catch(` chained, (4) no `const { waitUntil } = ctx` destructure.
- ADD `tests/build/wrangler-cron-shape.test.ts` (RECOMMENDED — see Pitfall 6 above): asserts `wrangler.jsonc` `triggers.crons === ["0 * * * *"]` exactly AND `vars.DRY_RUN === "1"`. Catches operator forgetting to revert after `*****` UAT.
- Closes: CRON-01 (code path).

### Wave 3 (depends on Wave 2 — final atomic deploy commit + operator UAT)

**Plan 19-04 — `wrangler.jsonc` `triggers.crons` flip + `19-UAT.md` + operator UAT**
- EDIT `wrangler.jsonc` `triggers.crons` from `[]` to `["0 * * * *"]`. (This is the only edit that "arms" the cron in production.)
- ADD `19-UAT.md` per D-14 (5 numbered steps mirroring Phase 18 UAT precedent):
  - Step 1: Pre-flight `pnpm dev:cron` + `curl http://localhost:8787/__scheduled?cron=0+*+*+*+*`; verify handler-wired log; then `*****` Past-Events verification on production (operator: edit `triggers.crons` to `["* * * * *"]`, deploy, wait 90s, capture Past Events screenshot, revert to `["0 * * * *"]`, redeploy).
  - Step 2: Seed-and-sweep end-to-end (`wrangler kv key put live:test-uat-<sid>` with stale `last_activity_at`, invoke cron, verify `delivered:test-uat-<sid>` exists with versioned envelope, `live:test-uat-<sid>` is null, `wrangler tail` shows `chat.delivery.dry_run` + `chat.delivery.tick` log lines).
  - Step 3: Idempotency double-tap (re-invoke sweep, verify `sessions_promoted: 0` for the seeded sid).
  - Step 4: Pagination/batch-cap stress (bash loop seeds 60 stale `live:test-uat-*` keys, invoke cron, verify first tick `sessions_due: 60` but `sessions_promoted: 50`, re-invoke for remaining 10).
  - Step 5: Backlog cleanup (`wrangler kv key delete live:test-uat-* delivered:test-uat-*`, verified empty via `wrangler kv key list --prefix test-uat-`).
- Operator runs Steps 1–5 against preview FIRST, then production (two-touch verification per Plan 17-02 D-03). Phase 18 UAT discovered that Workers Builds previews bind KV to PROD `id`, so the two-touch may collapse to single-touch production — document this contingency.
- Closes: CRON-01 / CRON-02 / CRON-03 / CRON-04 operational success criteria; Phase 19 close.

### Optional Plan 19-05 — Phase 19 retrospective

Author `19-RETROSPECTIVE.md` summarizing what worked / what didn't / forward-looking notes for Phase 20. Inherits the Phase 17 / Phase 18 retrospective shape. Low priority; can be merged into Plan 19-04 close.

### Plan sequencing rationale

- **Plan 19-01 first** to land the dev ergonomics + DRY_RUN var with ZERO behavior change in production (cron still empty array; handler still stub-with-breadcrumb-log).
- **Plan 19-02 second** to land the core module behind a still-stub handler — module is tested end-to-end against mock KV but the production cron does nothing because Plan 19-04 hasn't armed it. Production deploy of Plan 19-02 is safe.
- **Plan 19-03 third** to wire the handler to the module (still no cron schedule) — production deploy is safe (`scheduled()` runs the module but `triggers.crons: []` means it never fires).
- **Plan 19-04 last** to atomically arm the cron schedule + author + run the UAT. This is the only commit that produces observable production behavior, so the deploy gate (operator-controlled per DEPLOY-GATE.md posture) applies most strictly here.

This ordering minimizes the blast radius of any single deploy: every plan up through Plan 19-03 ships code that can be safely deployed without any visible production effect.
