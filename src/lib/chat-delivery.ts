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
//   • src/lib/email/             — does NOT exist in Phase 19 (D-06; Phase 20)
//
// Callers wrap deliverDue with ctx.waitUntil(...) and chain .catch() per
// RESEARCH § Pattern 1 + § Pitfall 1; see Plan 19-03 wiring spec in worker.ts.

import type { ChatTranscript, KVMetadata } from "./chat-transcripts";
import { KEY_PREFIX } from "./chat-transcripts"; // shared "live:" — schema source-of-truth

// ---------------------------------------------------------------------------
// Locked constants — Plan 19-02 exports these for test-side assertion + for
// Plan 19-03 to reference structurally without redeclaring numeric literals.
// ---------------------------------------------------------------------------

export const INACTIVITY_THRESHOLD_MS = 2 * 60 * 60 * 1000; // STATE.md / RESEARCH § Pitfall 2 lock
export const PER_TICK_BATCH_CAP = 50; // CRON-03 lock — 50 sessions / tick
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
 * Layer-1 idempotency cursor. Phase 20 will additively append a
 * `resend_message_id: string` field after the Resend POST integration lands.
 */
export interface DeliveredMarker {
  v: 1; // schema discriminator, matches ChatTranscript.v
  sid: string;
  delivered_at: string; // ISO 8601
  dry_run: boolean; // true in Phase 19; false in Phase 20
  msg_count: number;
  truncated: boolean;
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
 * `chat.delivery.dry_run` with the locked D-05 field names and returns
 * synthetic success. NO Resend POST exists in Phase 19; the would-be call
 * is unreachable at runtime under the dry-run flag.
 *
 * Under any other value: throws `send_not_implemented_in_phase_19`. This
 * is the Phase 20 substitution target — Plan 20-XX will replace this
 * branch with the real Resend POST + Idempotency-Key.
 */
async function sendOne(
  env: DeliveryEnv,
  transcript: ChatTranscript,
): Promise<void> {
  if (env.DRY_RUN === "1") {
    // D-05 — locked field NAMES; ORDER is planner's discretion.
    console.log("chat.delivery.dry_run", {
      sid: transcript.sid,
      to: env.CHAT_RECIPIENT_EMAIL ?? null,
      from: env.CHAT_SENDER_EMAIL ?? null,
      reply_to: "jackcutrara@gmail.com",
      msg_count: transcript.msg_count,
      truncated: transcript.truncated,
      country: transcript.meta.country ?? null,
      referrer_host: hostnameOrNull(transcript.meta.referrer),
      dry_run: true,
    });
    return; // synthetic success
  }
  // Phase 20 replaces this branch with the real Resend POST.
  throw new Error("send_not_implemented_in_phase_19");
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

  try {
    // (3) D-07 — would-be send harness (DRY_RUN-gated). Retry up to
    // MAX_SEND_ATTEMPTS with exponential full-jitter backoff.
    await retryWithBackoff(() => sendOne(env, transcript!), MAX_SEND_ATTEMPTS);

    // (4) D-09 — idempotency marker. PUT delivered:{sid} BEFORE step 5.
    // D-11 — NO metadata field on delivered: writes.
    const value: DeliveredMarker = {
      v: 1,
      sid,
      delivered_at: new Date().toISOString(),
      dry_run: env.DRY_RUN === "1", // D-02 — strict-equals-string gate
      msg_count: transcript.msg_count,
      truncated: transcript.truncated,
    };
    await env.CHAT_KV.put(`delivered:${sid}`, JSON.stringify(value), {
      expirationTtl: DELIVERED_TTL_SECONDS,
      // D-11 — intentionally NO metadata field; idempotency cursor is a
      // hint, not a list-surface. Layer-2 cryptographic dedupe lives at
      // the Phase 20 Resend Idempotency-Key tier.
    });

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
 *   1. PER_TICK_BATCH_CAP (50 sessions promoted in a single tick)
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
      // Honor the batch cap inside the loop so we exit promptly mid-page
      // when we cross PER_TICK_BATCH_CAP.
      if (sessionsPromoted >= PER_TICK_BATCH_CAP) break;

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
      const sid = k.name.slice(KEY_PREFIX.length);
      const r = await promoteOne(env, sid);
      if (r.status === "promoted") sessionsPromoted += 1;
      else if (r.status === "error") errors += 1;
      // already_delivered / missing_live: not counted as promoted or error
    }

    // Three independent exit conditions — exit if any are met.
    if (sessionsPromoted >= PER_TICK_BATCH_CAP) break;
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
