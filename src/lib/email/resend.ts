// resend.ts — pure Resend REST wrapper for Phase 20.
//
// Owns the entire Phase 20 MAIL-01 contract:
//   • MAIL-01 — thin fetch() wrapper around POST https://api.resend.com/emails
//               with Authorization Bearer + Idempotency-Key + User-Agent headers
//               + AbortController(10s) per attempt + 3-variant discriminated
//               ResendResult + 3-event structured Workers Logs emission.
//
// Decision IDs honored in this module:
//   D-13 — 3-class HTTP status taxonomy:
//            2xx                  -> sent
//            5xx + 429            -> failed_transient (caller's retry budget)
//            4xx-except-429       -> failed_terminal  (incl. 409 idempotency
//                                                      conflict per Landmine 10)
//   D-15 — AbortController fires at 10s per attempt. Workers cron-tick budget
//          is 30s total; 3 retries × 10s ≈ 30s worst-case per session — the
//          per-session try/catch in promoteOne (Phase 19) absorbs timeout cost
//          without starving the rest of the batch. Per-session 10s × 3 ≠
//          per-batch 30s (Landmine 8 reconciliation).
//   D-16 — 3 distinct structured Workers Logs events (REVISED by D-17):
//            chat.delivery.sent   (2xx success)
//            chat.delivery.retry  (5xx + 429 + AbortError + network err)
//            chat.delivery.failed (4xx-except-429 incl. 409)
//          Flat-primitive fields only; second arg parsed as JSON by
//          `wrangler tail`. Each event maps to exactly one operational query.
//   D-17 — Collapse the 4-variant Result + 4-event log family from D-14 / D-16
//          down to 3 variants + 3 events per RESEARCH Drift §1 (Resend's
//          response body flag that D-14 originally branched on is not
//          documented in the current Resend API surface). Layer 1 (the
//          delivered:{sid} cursor in chat-delivery.ts) is the sole
//          application-side replay-suppression mechanism, via the existing
//          Phase 19 chat.delivery.skipped_already_delivered short-circuit
//          BEFORE this wrapper is ever called.
//
// Landmines mitigated:
//   Landmine 1 — AbortController fires DOMException with name === "AbortError",
//                NOT plain Error. The catch branch uses
//                `err instanceof DOMException && err.name === "AbortError"` so
//                aborted requests are classified as failed_transient (NOT
//                failed_terminal).
//   Landmine 2 — clearTimeout invoked in `finally` block so the dangling
//                10s setTimeout never escapes the success or error path. Works
//                for both happy path (200) AND every failure path.
//   Landmine 4 — User-Agent header `jack-cutrara-portfolio/1.0` set on every
//                fetch. Workers runtime default UA differs from Node's; Resend
//                KB 403/1010 documents the exact failure mode.
//   Landmine 8 — FETCH_TIMEOUT_MS is per-attempt (D-15). NO batch-level abort
//                exists in this module; the Workers 15min wall-clock cap is
//                handled at the next-tick re-attempt boundary (Layer 2 Resend
//                Idempotency-Key 24h window absorbs the mid-batch-kill case).
//   Landmine 9 — Body destructure `const { idempotency_key, ...body } =
//                payload;` extracts idempotency_key for the header, leaving
//                the body literal with 5 keys in ES2015-stable order
//                { from, to, reply_to, subject, text }. Byte-identical retries
//                within the 24h Idempotency-Key window.
//   Landmine 10 — 409 Idempotency-Conflict surfaces as failed_terminal with
//                 http_status: 409 on the chat.delivery.failed log line, so
//                 `wrangler tail --search "chat.delivery.failed" | grep
//                 '"http_status":409'` distinguishes it from validation
//                 errors (400/422).
//
// Pure module. NO imports from:
//   • @anthropic-ai/sdk          — wrapper has no LLM surface
//   • cloudflare:workers         — caller threads ResendEnv directly
//   • src/prompts/, src/pages/   — no chat-surface coupling (D-26 anchor)
//   • src/scripts/chat.ts        — browser-tier surface
//   • the cron-sweep delivery module (Phase 19 sibling)
//                                — this wrapper is UPSTREAM of the
//                                  delivery module; the reverse direction
//                                  would create a module-dependency cycle.
//                                  Plan 20-03's sendOne consumes
//                                  ResendResult; this module imports nothing
//                                  from the Phase 19 sibling.

import type { ResendPayload } from "./render";

// ---------------------------------------------------------------------------
// Locked constants — exported for test-side assertion + Plan 20-03 reference.
// ---------------------------------------------------------------------------

export const RESEND_URL = "https://api.resend.com/emails";
export const FETCH_TIMEOUT_MS = 10_000; // D-15 — 10s per-attempt
export const USER_AGENT = "jack-cutrara-portfolio/1.0"; // Landmine 4

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Narrowed env shape consumed by `sendEmail`. Only the Resend secret is
 * read here; envelope literals (CHAT_SENDER_EMAIL / CHAT_RECIPIENT_EMAIL /
 * CHAT_REPLY_TO_EMAIL) are already baked into the rendered ResendPayload
 * by Plan 20-01's renderEmail.
 */
export interface ResendEnv {
  RESEND_API_KEY: string;
}

/**
 * D-17 — 3-variant discriminated Result. The 4th variant from D-14 was
 * retired per RESEARCH Drift §1. Layer 1 (delivered:{sid} cursor in
 * chat-delivery.ts) handles replay-suppression upstream of this wrapper
 * via the Phase 19 chat.delivery.skipped_already_delivered short-circuit.
 *
 * Plan 20-03's sendOne consumes this directly: `sent` -> return message_id;
 * `failed_transient` -> throw (caught by retryWithBackoff for retry);
 * `failed_terminal` -> throw with terminal class (also bubbles through
 * retryWithBackoff but the first attempt already logged the failure).
 */
export type ResendResult =
  | { status: "sent"; message_id: string; attempt: number }
  | {
      status: "failed_transient";
      http_status?: number;
      error_class?: string;
      attempt: number;
    }
  | {
      status: "failed_terminal";
      http_status: number;
      resend_error?: string;
      attempt: number;
    };

// ---------------------------------------------------------------------------
// File-local helpers
// ---------------------------------------------------------------------------

/**
 * Extract the session id segment from an Idempotency-Key value of the form
 * `transcript/{sid}`. Returns the second segment after the first `/`. Falls
 * back to the raw key if the format does not match (defensive — every log
 * event carries an `sid` field for grep-by-session, so a fallback prevents
 * a malformed key from emitting `undefined`).
 */
function extractSidFromIdempotencyKey(key: string): string {
  const slash = key.indexOf("/");
  if (slash < 0) return key;
  return key.slice(slash + 1);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * POST a rendered Resend payload to https://api.resend.com/emails and
 * classify the response into a 3-variant discriminated Result per D-13 +
 * D-17. Emits one of three structured Workers Logs events per outcome
 * per D-16 + D-17.
 *
 * Pure HTTP wrapper — accepts an already-rendered ResendPayload (from
 * Plan 20-01's renderEmail) and returns a typed Result. The caller's
 * retryWithBackoff harness (Phase 19 cron-sweep module lines 128-149)
 * iterates retries; the `attempt` parameter is threaded through for log
 * fields and final Result attribution.
 *
 * @param env       — narrowed env shape exposing only RESEND_API_KEY
 * @param payload   — fully-rendered envelope { from, to, reply_to, subject,
 *                    text, idempotency_key } from Plan 20-01
 * @param attempt   — current retry attempt (1-indexed; defaults to 1)
 * @returns         — discriminated Result variant per D-13 + D-17
 */
export async function sendEmail(
  env: ResendEnv,
  payload: ResendPayload,
  attempt = 1,
): Promise<ResendResult> {
  // D-15 + Landmine 2 — AbortController setup; clearTimeout in finally
  // catches every exit path so the 10s setTimeout never escapes.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  // Landmine 9 — destructure idempotency_key OUT of body so the JSON body
  // has exactly 5 keys { from, to, reply_to, subject, text } in literal
  // ES2015-stable order. Byte-identical retries inside the 24h Resend
  // Idempotency-Key window.
  const { idempotency_key, ...body } = payload;
  const sid = extractSidFromIdempotencyKey(idempotency_key);

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotency_key,
        "User-Agent": USER_AGENT, // Landmine 4
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    // 2xx success -> sent
    if (response.ok) {
      const data = (await response.json()) as { id: string };
      console.log("chat.delivery.sent", {
        sid,
        resend_message_id: data.id,
        attempt,
      });
      return { status: "sent", message_id: data.id, attempt };
    }

    // Best-effort error body parse (tolerate malformed JSON without throwing
    // into the AbortError catch branch below).
    let errorClass: string | undefined;
    try {
      const errBody = (await response.json()) as { name?: string };
      errorClass = errBody.name;
    } catch {
      /* swallow — Resend returned non-JSON or empty body */
    }

    // D-13 — Transient: 429 OR 5xx -> failed_transient + chat.delivery.retry
    if (response.status === 429 || response.status >= 500) {
      console.log("chat.delivery.retry", {
        sid,
        http_status: response.status,
        error_class: errorClass ?? null,
        attempt,
        backoff_ms: null, // backoff lives in caller's retryWithBackoff
      });
      return {
        status: "failed_transient",
        http_status: response.status,
        error_class: errorClass,
        attempt,
      };
    }

    // D-13 + Landmine 10 — Terminal: 4xx-except-429 (incl. 409
    // Idempotency-Conflict) -> failed_terminal + chat.delivery.failed
    // (carries http_status field so 409 is grep-distinguishable from
    // 400/422 validation errors).
    console.error("chat.delivery.failed", {
      sid,
      http_status: response.status,
      error_class: errorClass ?? "unknown",
      attempt,
    });
    return {
      status: "failed_terminal",
      http_status: response.status,
      resend_error: errorClass,
      attempt,
    };
  } catch (err) {
    // Landmine 1 — DOMException check, NOT generic Error. Workers + jsdom
    // both expose DOMException; AbortController.abort() fires this exact
    // type with name === "AbortError".
    if (err instanceof DOMException && err.name === "AbortError") {
      console.log("chat.delivery.retry", {
        sid,
        http_status: null,
        error_class: "AbortError",
        attempt,
        backoff_ms: null,
      });
      return {
        status: "failed_transient",
        error_class: "AbortError",
        attempt,
      };
    }
    // Network / TypeError / other thrown — also transient per D-15.
    const errorClass =
      err instanceof Error ? err.constructor.name : "Error";
    console.log("chat.delivery.retry", {
      sid,
      http_status: null,
      error_class: errorClass,
      attempt,
      backoff_ms: null,
    });
    return {
      status: "failed_transient",
      error_class: errorClass,
      attempt,
    };
  } finally {
    // Landmine 2 — clearTimeout on every exit path (success, error, abort).
    clearTimeout(timeoutId);
  }
}
