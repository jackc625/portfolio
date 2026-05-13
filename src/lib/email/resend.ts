// resend.ts — pure Resend REST wrapper for Phase 20.
//
// Wave 0 RED stub: typed exports + throwing implementation. Plan 20-02 Task 2
// will replace the throwing body with the real wrapper. This file shape lets
// `pnpm exec astro check` exit 0/0/0 (types declared) while
// `pnpm exec vitest run tests/api/email-resend.test.ts` fails RED at runtime
// (sendEmail throws "not_implemented"). Same RED-via-typed-stub pattern as
// Plan 20-01's render.ts Task 1.

import type { ResendPayload } from "./render";

// ---------------------------------------------------------------------------
// Locked constants — Plan 20-02 Task 2 implementation will export verbatim.
// ---------------------------------------------------------------------------

export const RESEND_URL = "https://api.resend.com/emails";
export const FETCH_TIMEOUT_MS = 10_000; // D-15 — 10s per-attempt timeout
export const USER_AGENT = "jack-cutrara-portfolio/1.0"; // Landmine 4

// ---------------------------------------------------------------------------
// Public types — locked contract consumed by Plan 20-03 sendOne substitution.
// ---------------------------------------------------------------------------

/**
 * Narrowed env shape consumed by `sendEmail`. Only the secret is needed at
 * the HTTP layer; envelope literals are already baked into the rendered
 * ResendPayload by Plan 20-01's renderEmail.
 */
export interface ResendEnv {
  RESEND_API_KEY: string;
}

/**
 * D-17 (REVISED) — 3-variant discriminated Result. The `replayed` variant
 * was retired per RESEARCH Drift §1 (Resend's `idempotency_replay: true`
 * response body flag is not documented in current API surface). Layer 1
 * (delivered:{sid} cursor in chat-delivery.ts) is the sole application-side
 * replay detector.
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
// Public API — RED stub
// ---------------------------------------------------------------------------

export async function sendEmail(
  _env: ResendEnv,
  _payload: ResendPayload,
  _attempt = 1,
): Promise<ResendResult> {
  throw new Error("not_implemented_wave_0_red_stub");
}
