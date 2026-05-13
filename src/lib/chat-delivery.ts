// chat-delivery.ts — pure cron-sweep module for transcript delivery (DRY_RUN-gated).
//
// Owns the entire Phase 19 cron sweep contract:
//   • CRON-02 — two-keyspace partition (live: → delivered:) with locked ordering
//               (PUT delivered:{sid} BEFORE kv.delete(live:{sid}))
//   • CRON-03 — per-session try/catch isolation + 50-session batch cap
//               + 3-try retry harness + 50-page pagination hard-cap
//   • CRON-04 — DRY_RUN flag toggles inner send (env.DRY_RUN === "1")
//
// Decision IDs honored in this module:
//   D-01 / D-02 — env.DRY_RUN strict-equals-string check ("1" only)
//   D-05        — flat-field structured dry_run envelope log shape
//                 { sid, to, from, reply_to, msg_count, truncated, country,
//                   referrer_host, dry_run } — NAMES locked, ORDER is planner's
//   D-06        — NO Resend wrapper import (Phase 20 creates src/lib/email/*)
//   D-07        — 3-attempt retry harness with exponential full-jitter backoff
//   D-09 / D-10 — delivered: value shape { v:1, sid, delivered_at, dry_run,
//                 msg_count, truncated }; schema-versioned + 24h TTL
//   D-11        — NO KV metadata field on delivered: writes (idempotency cursor
//                 is a hint, not a list-surface — Layer 2 cryptographic dedupe
//                 lives at the Phase 20 Resend Idempotency-Key tier)
//   OQ-2        — Full-jitter exponential backoff (RESEARCH § Code Example 3);
//                 base 250ms, cap 5000ms. Trade-off vs equal-jitter is
//                 latency-variance vs synchronized-collision risk.
//   OQ-6        — scheduledTime arg is the canonical nowMs for inactivity
//                 comparisons (tick-as-batch consistency; deterministic tests).
//   OQ-7        — chat.delivery.tick summary log shape: 6 flat-primitive fields.
//
// Pure module. NO imports from:
//   • @anthropic-ai/sdk          — cron path has no LLM surface
//   • cloudflare:workers         — caller (worker.ts scheduled()) passes Env
//   • src/prompts/, src/pages/   — no chat-surface coupling (D-26 anchor)
//   • src/scripts/chat.ts        — same anchor (browser-tier surface)
//
// Phase 20 additions (Plan 20-03):
//   • renderEmail (./email/render) — pure ChatTranscript -> ResendPayload renderer
//   • sendEmail (./email/resend)   — pure REST wrapper around Resend POST
//   Both imported as named value imports; consumed under DRY_RUN === "0" in
//   the live-send branch of sendOne.
//
// Callers wrap deliverDue with ctx.waitUntil(...) and chain .catch() per
// RESEARCH § Pattern 1 + § Pitfall 1; see Plan 19-03 wiring spec in worker.ts.

import type { ChatTranscript, KVMetadata } from "./chat-transcripts";
import { KEY_PREFIX } from "./chat-transcripts"; // shared "live:" — schema source-of-truth
import { renderEmail, type RenderEnv } from "./email/render"; // Plan 20-01 — pure renderer
import { sendEmail, type ResendEnv } from "./email/resend"; // Plan 20-02 — pure REST wrapper

// ---------------------------------------------------------------------------
// Locked constants — Plan 19-02 exports these for test-side assertion + for
// Plan 19-03 to reference structurally without redeclaring numeric literals.
// ---------------------------------------------------------------------------

export const INACTIVITY_THRESHOLD_MS = 2 * 60 * 60 * 1000; // STATE.md / RESEARCH § Pitfall 2 lock
export const PER_TICK_BATCH_CAP = 50; // CRON-03 lock — 50 due sessions processed / tick (WR-01: counts ALL processed paths, not just promoted)
export const PAGINATION_PAGE_HARDCAP = 50; // CRON-03 safety valve — 50 pages / tick
export const MAX_SEND_ATTEMPTS = 3; // CRON-03 lock — 3 retries / send
export const BACKOFF_BASE_MS = 250; // OQ-2 recommendation (full-jitter)
export const BACKOFF_CAP_MS = 5000;
export const DELIVERED_TTL_SECONDS = 24 * 3600; // D-09 lock — 24h marker

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * D-09 / D-10 — schema-versioned envelope written to `delivered:{sid}`
 * after a successful (DRY_RUN-gated) send.
 *
 * Layer-1 idempotency cursor. Phase 20 ADDED `resend_message_id` per D-09
 * additive lock + 20-03 close. Schema `v: 1` UNCHANGED — additive-extension
 * lock means existing Phase 19 readers (D-09 cursor short-circuit in
 * promoteOne step 1) still parse the value cleanly without schema migration.
 *
 * Under DRY_RUN === "1" (rollback runway), `resend_message_id` carries the
 * sentinel `"dry-run-no-id"` and `dry_run` flips true; under DRY_RUN === "0"
 * (Phase 20 live-mail), `resend_message_id` carries the Resend `data.id` from
 * the sendEmail Result and `dry_run` flips false.
 */
export interface DeliveredMarker {
  v: 1; // schema discriminator, matches ChatTranscript.v
  sid: string;
  delivered_at: string; // ISO 8601
  dry_run: boolean; // true in Phase 19; false in Phase 20
  msg_count: number;
  truncated: boolean;
  resend_message_id: string; // Phase 20 (Plan 20-03) — Resend data.id on live send; "dry-run-no-id" sentinel under DRY_RUN==="1"
}

/**
 * Env shape — narrowed to fields deliverDue reads. NOT imported from
 * `src/worker.ts` (cyclic-import avoidance); callers pass the real
 * `ExportedHandler<Env>` second arg which structurally matches.
 *
 * Plan 19-01 added `DRY_RUN: string` to `src/worker.ts` Env. The wider
 * `string` declaration (vs wrangler-generated literal `"1"`) is the
 * structural compatibility surface this module needs.
 */
interface DeliveryEnv {
  CHAT_KV: KVNamespace;
  DRY_RUN: string;
  CHAT_RECIPIENT_EMAIL?: string; // envelope `to:` log field (Phase 19)
  CHAT_SENDER_EMAIL?: string; // envelope `from:` log field (Phase 19)
  // WR-02 (Phase 19 code review) — envelope `reply_to:` log field. Sourced
  // from wrangler.jsonc vars (Plan 19-01 absorption precedent). Optional so
  // Phase 20 doesn't have to thread an additional var to ship the live POST;
  // unset value falls through to null in the log line (operationally
  // identical to omitting the field but greppable in Workers Logs).
  CHAT_REPLY_TO_EMAIL?: string;
  // Phase 20 — sourced from Wrangler secret (set Plan 17-06); read by sendEmail
  // wrapper under DRY_RUN='0' live path. Runtime narrowing guard at sendOne
  // entry (sendOne body below) emits chat.delivery.failed before the as-cast
  // on missing values — surfaces a structured failure log instead of a raw
  // TypeError when an env var is missing under the live-send branch.
  RESEND_API_KEY?: string;
}

// ---------------------------------------------------------------------------
// File-local helpers
// ---------------------------------------------------------------------------

/**
 * Extract hostname from a URL string. Returns null if the input is
 * undefined, empty, or malformed.
 *
 * Used for the D-05 envelope log `referrer_host` field — we strip
 * path/query so the operational log never carries unbounded URL data.
 */
function hostnameOrNull(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * D-07 / OQ-2 — exponential full-jitter retry harness.
 *
 * Runs `fn` up to `maxAttempts` times. After each failure (except the
 * last) sleeps for a uniformly-random delay in [0, ceiling) where
 * ceiling = min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt).
 *
 * Full-jitter (uniform random in [0, ceiling)) trades a bit of latency
 * variance for substantially reduced thundering-herd risk when many
 * sessions retry simultaneously.
 */
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
      const ceiling = Math.min(
        BACKOFF_CAP_MS,
        BACKOFF_BASE_MS * 2 ** attempt,
      );
      await new Promise<void>((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * ceiling)),
      );
    }
  }
  throw lastErr;
}

/**
 * CRON-04 / D-01 / D-02 / D-05 — DRY_RUN-gated send harness.
 *
 * Under `env.DRY_RUN === "1"`: emits the flat-primitive envelope log line
 * `chat.delivery.dry_run` with the locked D-05 field names and returns a
 * sentinel `{ message_id: "dry-run-no-id" }`. Phase 20 (Plan 20-03) widened
 * the return type from `Promise<void>` to `Promise<{ message_id: string }>`
 * so promoteOne can persist the Resend data.id into the additive
 * DeliveredMarker.resend_message_id field.
 *
 * Under `env.DRY_RUN !== "1"` (Phase 20 live-send branch): renderEmail
 * composes the ResendPayload, sendEmail POSTs to Resend, and the
 * discriminated Result is translated to:
 *   sent             -> return { message_id: result.message_id }
 *   failed_transient -> throw Error(resend_transient_...) caught by
 *                       retryWithBackoff (next attempt within MAX_SEND_ATTEMPTS)
 *   failed_terminal  -> throw Error(resend_terminal_...) which also bubbles
 *                       through retryWithBackoff (net 3x log noise on
 *                       terminal; trade-off accepted per RESEARCH § Pattern 3
 *                       refinement note — the alternative is exposing a
 *                       no-retry-class signal that couples sendOne to the
 *                       harness internals).
 *
 * Return-type widening note: sendOne returns the message_id so promoteOne can
 * read the Resend data.id and populate the additive DeliveredMarker field
 * (D-09 / D-10 additive-extension lock).
 */
async function sendOne(
  env: DeliveryEnv,
  transcript: ChatTranscript,
): Promise<{ message_id: string }> {
  // ─────────────────────────────────────────────────────────────────────────
  // D-03 ROLLBACK RUNWAY — DO NOT DELETE this branch as "dead code".
  // The DRY_RUN="1" path is the instant-rollback mechanism: a single-line
  // wrangler.jsonc revert to "DRY_RUN": "1" reverts ALL Phase 20 behavior
  // without source code edit. Operator runs wrangler deploy; ~60s recovery.
  // The sentinel "dry-run-no-id" message_id flows through promoteOne where
  // the line-272 dry_run discriminator (env.DRY_RUN === "1") flags the value
  // as dry_run: true so this sentinel only ever appears in dry-run-flagged
  // delivered: markers — not in real sends.
  // Build-time forward-defense locks in tests/build/chat-delivery-send-site.test.ts
  // (Invariants D + E) — removing either the DRY_RUN gate or the
  // chat.delivery.dry_run envelope log fails the next CI run.
  // ─────────────────────────────────────────────────────────────────────────
  if (env.DRY_RUN === "1") {
    // D-05 — locked field NAMES; ORDER is planner's discretion.
    console.log("chat.delivery.dry_run", {
      sid: transcript.sid,
      to: env.CHAT_RECIPIENT_EMAIL ?? null,
      from: env.CHAT_SENDER_EMAIL ?? null,
      reply_to: env.CHAT_REPLY_TO_EMAIL ?? null, // WR-02 — sourced from env, not hardcoded
      msg_count: transcript.msg_count,
      truncated: transcript.truncated,
      country: transcript.meta.country ?? null,
      referrer_host: hostnameOrNull(transcript.meta.referrer),
      dry_run: true,
    });
    return { message_id: "dry-run-no-id" }; // sentinel — see comment block above
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 20 live-send branch (DRY_RUN !== "1") — Plan 20-03 substitution.
  // ─────────────────────────────────────────────────────────────────────────

  // Env-narrowing guard: closes the unsafe `as RenderEnv` / `as ResendEnv`
  // cast gap. Without this guard, a missing env var at runtime surfaces as a
  // raw TypeError ("Cannot read property of undefined") inside renderEmail or
  // sendEmail; the structured chat.delivery.failed log is the operationally
  // greppable surface, so emit it BEFORE the cast and throw a terminal-class
  // error that promoteOne's catch translates into the standard failure path.
  if (env.DRY_RUN === "0") {
    if (
      !env.RESEND_API_KEY ||
      !env.CHAT_RECIPIENT_EMAIL ||
      !env.CHAT_SENDER_EMAIL ||
      !env.CHAT_REPLY_TO_EMAIL
    ) {
      console.warn("chat.delivery.failed", {
        sid: transcript.sid,
        http_status: null,
        error_class: "resend_terminal_env_missing",
        attempt: 0,
      });
      throw new Error("resend_terminal_env_missing");
    }
  }

  const payload = renderEmail(env as RenderEnv, transcript);
  const result = await sendEmail(env as ResendEnv, payload);

  if (result.status === "sent") {
    return { message_id: result.message_id };
  }
  if (result.status === "failed_transient") {
    // RESEARCH § Pattern 3 — throw so retryWithBackoff catches and retries
    // within MAX_SEND_ATTEMPTS. The error message encodes http_status (or
    // error_class for AbortError / network errors) for log grep-ability.
    throw new Error(
      `resend_transient_${result.http_status ?? result.error_class ?? "unknown"}`,
    );
  }
  // failed_terminal — throw so promoteOne's catch logs chat.delivery.failed.
  // The throw also bubbles through retryWithBackoff which means the same
  // error gets caught + thrown again on attempts 2 and 3 producing ~3x log
  // noise on terminal errors. This is accepted per RESEARCH § Pattern 3
  // refinement note (lines 783-792): the alternative is exposing a
  // no-retry-class signal that couples sendOne to retryWithBackoff's
  // internals; the 3x noise is preferable to a tight harness coupling.
  throw new Error(`resend_terminal_${result.http_status}`);
}

/**
 * CRON-02 / D-09 — two-keyspace promotion of a single live:{sid}.
 *
 * Five-step ordering invariant (RESEARCH § Pattern 2):
 *   1. Read `delivered:{sid}` — cheapest short-circuit; if present emit
 *      `chat.delivery.skipped_already_delivered` and return.
 *   2. Load `live:{sid}` transcript — short-circuit (no log) if absent
 *      (cross-POP race or already-deleted-by-prior-tick).
 *   3. Wrap sendOne in retryWithBackoff(MAX_SEND_ATTEMPTS).
 *   4. PUT `delivered:{sid}` BEFORE step 5 — D-09 ordering lock.
 *   5. DELETE `live:{sid}` AFTER step 4 — cleanup.
 *
 * Steps 3-5 are wrapped in try/catch — on catch emit
 * `chat.delivery.failed { sid, error_class, msg_count }` and return
 * `{ status: "error" }`. The outer caller's loop continues to the next
 * session (per-session try/catch isolation per CRON-03).
 */
async function promoteOne(
  env: DeliveryEnv,
  sid: string,
): Promise<{
  status: "promoted" | "already_delivered" | "missing_live" | "error";
}> {
  // (1) D-09 idempotency cursor read — cheapest short-circuit.
  // CR-01 (Phase 19 code review) — wrap in try/catch for CRON-03 isolation.
  // A transient KV read failure on the delivered: cursor key must NOT abort
  // the entire sweep; the outer caller's loop continues to the next session.
  let delivered: DeliveredMarker | null = null;
  try {
    delivered = (await env.CHAT_KV.get(`delivered:${sid}`, {
      type: "json",
    })) as DeliveredMarker | null;
  } catch (err) {
    console.error("chat.delivery.failed", {
      sid,
      error_class: err instanceof Error ? err.constructor.name : "Error",
      msg_count: 0,
    });
    return { status: "error" };
  }
  if (delivered !== null) {
    console.log("chat.delivery.skipped_already_delivered", {
      sid,
      delivered_at_existing: delivered.delivered_at ?? null,
    });
    return { status: "already_delivered" };
  }

  // (2) Load the transcript value. Wrap in try/catch because the get
  // itself may throw on malformed JSON / KV failures, and per CRON-03
  // per-session isolation those failures must not abort the sweep.
  let transcript: ChatTranscript | null = null;
  try {
    transcript = (await env.CHAT_KV.get<ChatTranscript>(KEY_PREFIX + sid, {
      type: "json",
    })) as ChatTranscript | null;
  } catch (err) {
    // KV read failure — treat as a session-scoped error (CRON-03 isolation).
    console.error("chat.delivery.failed", {
      sid,
      error_class: err instanceof Error ? err.constructor.name : "Error",
      msg_count: 0,
    });
    return { status: "error" };
  }
  if (transcript === null) {
    // Race / already-deleted — silent skip per CRON-02 edge case.
    return { status: "missing_live" };
  }

  // WR-03 (Phase 19 code review) — track whether the delivered: marker
  // was successfully PUT so the catch block can GC the orphan live: key
  // only when there IS an orphan (avoids accidentally deleting live: when
  // the send itself failed and the next tick should retry).
  let deliveredWritten = false;
  try {
    // (3) D-07 — send harness (DRY_RUN-gated, Phase 20 live under "0").
    // Retry up to MAX_SEND_ATTEMPTS with exponential full-jitter backoff.
    // Plan 20-03 widened sendOne return to { message_id: string } so we
    // capture sendResult for step 4 (additive DeliveredMarker field).
    const sendResult = await retryWithBackoff(
      () => sendOne(env, transcript!),
      MAX_SEND_ATTEMPTS,
    );

    // (4) D-09 — idempotency marker. PUT delivered:{sid} BEFORE step 5.
    // D-11 — NO metadata field on delivered: writes (Landmine 7 lock per
    // Plan 20-03 — idempotency cursor stays a hint, not a list-surface).
    // Plan 20-03 — additive resend_message_id field populated from
    // sendResult; sentinel "dry-run-no-id" under DRY_RUN=="1" or real
    // Resend data.id under DRY_RUN=="0". Schema v: 1 UNCHANGED per
    // D-09 / D-10 additive-extension lock.
    const value: DeliveredMarker = {
      v: 1,
      sid,
      delivered_at: new Date().toISOString(),
      dry_run: env.DRY_RUN === "1", // D-02 — strict-equals-string gate
      msg_count: transcript.msg_count,
      truncated: transcript.truncated,
      resend_message_id: sendResult.message_id, // Plan 20-03 additive (D-09/D-10)
    };
    await env.CHAT_KV.put(`delivered:${sid}`, JSON.stringify(value), {
      expirationTtl: DELIVERED_TTL_SECONDS,
      // D-11 — intentionally NO metadata field; idempotency cursor is a
      // hint, not a list-surface. Layer-2 cryptographic dedupe lives at
      // the Phase 20 Resend Idempotency-Key tier.
    });
    deliveredWritten = true; // WR-03 — only after the PUT awaits successfully

    // (5) Clean up live entry — AFTER successful "send" + PUT delivered.
    await env.CHAT_KV.delete(KEY_PREFIX + sid);

    return { status: "promoted" };
  } catch (err) {
    // CRON-03 — per-session try/catch isolation. The error is logged
    // and the sweep continues; the catastrophic-only outer .catch on
    // ctx.waitUntil in worker.ts handles top-level rejections.
    console.error("chat.delivery.failed", {
      sid,
      error_class: err instanceof Error ? err.constructor.name : "Error",
      msg_count: transcript.msg_count,
    });
    // WR-03 (Phase 19 code review) — best-effort orphan-live: GC.
    // If the catch fires AFTER step 4 (delivered:{sid} PUT succeeded)
    // but BEFORE step 5 (live:{sid} DELETE) -- i.e. the kv.delete call
    // itself failed -- the delivered: marker is persisted and the next
    // tick's promoteOne short-circuits via already_delivered, but the
    // live: key hangs for its 30-day TTL, gets re-listed every tick, and
    // emits ~720 chat.delivery.skipped_already_delivered log lines per
    // orphaned session. Try a single best-effort delete; gated by
    // deliveredWritten so a pre-PUT failure (e.g. send threw, or the
    // delivered: PUT itself failed) leaves live: in place for retry.
    // Wrap in its own try/catch because the main error is already
    // reported and we must never throw out of this branch.
    if (deliveredWritten) {
      try {
        await env.CHAT_KV.delete(KEY_PREFIX + sid);
      } catch {
        // swallow — main error already logged; GC is best-effort
      }
    }
    return { status: "error" };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Top-level cron sweep entry point — invoked once per cron tick by
 * `src/worker.ts` `scheduled()` via `ctx.waitUntil(deliverDue(env, ...))`.
 *
 * Walks `live:*` in cursor-paginated pages (RESEARCH § Pattern 3), filters
 * each key by `metadata.last_activity_at` against INACTIVITY_THRESHOLD_MS,
 * and dispatches due sessions to `promoteOne`. Honors three independent
 * exit conditions:
 *   1. PER_TICK_BATCH_CAP (50 due sessions PROCESSED in a single tick --
 *      WR-01: includes promoted + error + already_delivered + missing_live
 *      since each path consumes per-session work-budget)
 *   2. PAGINATION_PAGE_HARDCAP (50 pages scanned)
 *   3. page.list_complete (no more keys to scan)
 *
 * `scheduledTime` (when provided by the cron controller) is the canonical
 * `nowMs` for inactivity comparisons (OQ-6 tick-as-batch consistency).
 *
 * Emits one `chat.delivery.tick` summary log per invocation.
 *
 * @throws if the FIRST `kv.list()` call rejects — that surfaces to the
 *   caller's `.catch` chain (worker.ts) for catastrophic-only error
 *   observability. Per-session failures are isolated inside `promoteOne`.
 */
export async function deliverDue(
  env: DeliveryEnv,
  scheduledTime?: number,
): Promise<void> {
  const startMs = Date.now();
  // OQ-6 — tick-as-batch nowMs: prefer cron-supplied scheduledTime so
  // every key examined in a single tick is filtered against the same
  // instant (deterministic tests; consistent live-window semantics).
  const nowMs = scheduledTime ?? Date.now();

  let cursor: string | undefined = undefined;
  let pagesScanned = 0;
  let sessionsSeen = 0;
  let sessionsDue = 0;
  let sessionsProcessed = 0; // WR-01 — counts ALL due sessions processed (promoted + already_delivered + missing_live + error). The batch cap binds on work-done so a tick where every session errors cannot run away past 50 sessions worth of wall-clock + retry budget.
  let sessionsPromoted = 0;
  let errors = 0;

  while (pagesScanned < PAGINATION_PAGE_HARDCAP) {
    // CRON-02 — list only the live: prefix. Phase 19 never touches the
    // delivered: keyspace on a list (per-session reads only).
    const page: KVNamespaceListResult<KVMetadata> =
      await env.CHAT_KV.list<KVMetadata>({
        prefix: KEY_PREFIX,
        cursor,
      });
    pagesScanned += 1;
    sessionsSeen += page.keys.length;

    for (const k of page.keys) {
      // WR-01 — honor the batch cap on PROCESSED-due sessions (not just
      // successful promotions). Failures are also work; capping only on
      // success would let an all-error tick burn through hundreds of
      // sessions worth of retry + backoff budget against the free-tier
      // 30s cron-tick ceiling.
      if (sessionsProcessed >= PER_TICK_BATCH_CAP) break;

      const metadata = k.metadata;
      if (!metadata?.last_activity_at) continue; // missing metadata = skip

      const lastActiveMs = Date.parse(metadata.last_activity_at);
      // CR-02 (Phase 19 code review) — defensive NaN guard. Date.parse
      // returns NaN on malformed ISO strings (truncated, locale-stamped,
      // produced by a buggy migration tool, etc.). `nowMs - NaN` is NaN
      // and `NaN < INACTIVITY_THRESHOLD_MS` is false, so without this
      // guard a malformed-metadata session would skip the not-due branch
      // and be incorrectly promoted -- Phase 20 would send a real email
      // before its inactivity window. Treat NaN as "skip this session"
      // so the INACTIVITY_THRESHOLD_MS contract holds defensively.
      if (Number.isNaN(lastActiveMs)) continue; // malformed ISO = skip
      if (nowMs - lastActiveMs < INACTIVITY_THRESHOLD_MS) continue; // not due yet

      sessionsDue += 1;
      sessionsProcessed += 1; // WR-01 — count work-done units against cap
      const sid = k.name.slice(KEY_PREFIX.length);
      const r = await promoteOne(env, sid);
      if (r.status === "promoted") sessionsPromoted += 1;
      else if (r.status === "error") errors += 1;
      // already_delivered / missing_live: not counted as promoted or error
    }

    // Three independent exit conditions — exit if any are met.
    if (sessionsProcessed >= PER_TICK_BATCH_CAP) break; // WR-01 — same cap as inner-loop guard
    if (page.list_complete) break; // RESEARCH § Pitfall 4 — use list_complete
    cursor = page.cursor;
  }

  // OQ-7 — per-tick summary. Flat-primitive fields only so Workers Logs
  // can auto-index without nested-object cardinality explosion.
  console.log("chat.delivery.tick", {
    sessions_seen: sessionsSeen,
    sessions_due: sessionsDue,
    sessions_promoted: sessionsPromoted,
    errors,
    pages_scanned: pagesScanned,
    elapsed_ms: Date.now() - startMs,
  });
}
