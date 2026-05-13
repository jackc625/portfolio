// email-resend.test.ts — unit tests for src/lib/email/resend.ts
//
// Phase 20 Plan 20-02 — Wave 0 RED test battery covering the entire Phase 20
// MAIL-01 wrapper contract owned by src/lib/email/resend.ts:
//
//   • MAIL-01 — thin fetch() wrapper around POST https://api.resend.com/emails
//               with Authorization Bearer, Idempotency-Key, User-Agent headers
//               + AbortController(10s) per attempt + 3-variant discriminated
//               Result + 3-event structured Workers Logs emission.
//
// Decision IDs anchored:
//   D-13 — 3-class HTTP status taxonomy
//          (2xx -> sent; 5xx + 429 -> failed_transient;
//           4xx-except-429 (incl. 409) -> failed_terminal)
//   D-15 — AbortController fires at 10s per attempt; thrown DOMException
//          (NOT Error) with name === "AbortError" caught at wrapper's catch
//          branch (Landmine 1)
//   D-16 (REVISED by D-17) — 3 distinct structured Workers Logs events:
//          chat.delivery.sent  (2xx success)
//          chat.delivery.retry (5xx + 429 + AbortError + network err)
//          chat.delivery.failed (4xx-except-429 incl. 409)
//   D-17 — Drop the `replayed` Result variant; Layer 1 (delivered:{sid}
//          cursor in chat-delivery.ts) is the sole application-side replay
//          detector. NO chat.delivery.idempotency_replay log event. The
//          ResendResult discriminated union has 3 variants, NOT 4.
//
// Landmines mitigated by this test battery:
//   Landmine 1 — abort timeout test throws new DOMException("aborted",
//                "AbortError"), NOT new Error("aborted"). Forces wrapper's
//                catch branch to use `instanceof DOMException && name ===
//                "AbortError"`.
//   Landmine 2 — fake-timer test asserts setTimeout is paired with
//                clearTimeout in finally (no dangling timers escape the
//                success or error path).
//   Landmine 4 — header-literal test asserts `User-Agent:
//                jack-cutrara-portfolio/1.0` is set on every fetch
//                (Workers runtime default UA -> Resend 403/1010).
//   Landmine 9 — body-shape test asserts JSON body has exactly 5 keys
//                { from, to, reply_to, subject, text } in literal order
//                so retries within Resend's 24h Idempotency-Key window
//                produce byte-identical bodies.
//   Landmine 10 — 4xx it.each row for status 409 asserts the
//                 chat.delivery.failed log carries the http_status: 409
//                 discriminator (grep-distinguishable from 400/401/403/422).
//
// Module under test does NOT exist yet (RED phase). Import resolution will
// fail until Task 2 lands src/lib/email/resend.ts. ResendPayload + RenderEnv
// types resolve from Plan 20-01's already-landed src/lib/email/render.ts.
//
// Console-spy beforeEach/afterEach pattern mirrors tests/api/chat-delivery.test.ts
// (Plan 19-02) + tests/api/cache-hit-logs.test.ts (Plan 17-05).
// Mocked-fetch pattern: globalThis.fetch = vi.fn() per attempt, restored via
// vi.restoreAllMocks() in afterEach.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sendEmail,
  type ResendEnv,
  type ResendResult,
} from "../../src/lib/email/resend";
import type { ResendPayload } from "../../src/lib/email/render";

// ---------------------------------------------------------------------------
// Constants (fixture-builder + ENV)
// ---------------------------------------------------------------------------

const SID = "8b0f7f1c-1234-4567-8901-abcdef012345";
const ENV: ResendEnv = { RESEND_API_KEY: "test-resend-key" };

function buildPayload(overrides?: Partial<ResendPayload>): ResendPayload {
  return {
    from: '"Portfolio Chat" <transcripts@mail.jackcutrara.com>',
    to: "jackcutrara@gmail.com",
    reply_to: "jackcutrara@gmail.com",
    subject: "[Portfolio chat] 7 turns from US via direct",
    text:
      "From: chat widget on jackcutrara.com — visitor message follows below this line.\n\n>>> visitor:\nHello\n",
    idempotency_key: `transcript/${SID}`,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Spy + mocked-fetch helpers
// ---------------------------------------------------------------------------

let fetchMock: ReturnType<typeof vi.fn>;
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/**
 * Single-response fetch mock helper. Wraps the literal Response shape that
 * Resend returns; tests use mockResolved(200, { id: "..." }) for happy paths
 * and mockResolved(500, { name: "internal_error" }) for failures.
 *
 * The body's `json()` is async and returns the literal body object passed in.
 * Status-code-driven `ok` field mirrors the global fetch contract.
 */
function mockResolved(status: number, body: unknown): void {
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

/**
 * Locate a console.log/error call whose first arg equals the given event
 * name. Mirrors the findLog helper in tests/api/chat-delivery.test.ts.
 */
function findLog(
  spy: ReturnType<typeof vi.spyOn>,
  eventName: string,
): unknown[] | undefined {
  return spy.mock.calls.find((c: unknown[]) => c[0] === eventName) as
    | unknown[]
    | undefined;
}

// ---------------------------------------------------------------------------
// Test groups (one describe per area; covers all 10 Per-Task Verification
// Map rows for Plan 20-02 from 20-VALIDATION.md)
// ---------------------------------------------------------------------------

describe("MAIL-01 — sendEmail status taxonomy (D-13 + D-17 3-variant Result)", () => {
  it("200 sent", async () => {
    mockResolved(200, { id: "test-msg-id" });
    const result: ResendResult = await sendEmail(ENV, buildPayload());
    expect(result.status).toBe("sent");
    if (result.status !== "sent") throw new Error("unreachable");
    expect(result.message_id).toBe("test-msg-id");
    expect(result.attempt).toBe(1);

    const sentLog = findLog(logSpy, "chat.delivery.sent");
    expect(sentLog).toBeDefined();
    const fields = sentLog![1] as {
      sid: string;
      resend_message_id: string;
      attempt: number;
    };
    expect(fields.resend_message_id).toBe("test-msg-id");
    expect(fields.sid).toBe(SID);
    expect(fields.attempt).toBe(1);
  });

  it("5xx transient", async () => {
    mockResolved(500, { name: "internal_error" });
    const result = await sendEmail(ENV, buildPayload());
    expect(result.status).toBe("failed_transient");
    if (result.status !== "failed_transient") throw new Error("unreachable");
    expect(result.http_status).toBe(500);
    expect(result.attempt).toBe(1);

    const retryLog = findLog(logSpy, "chat.delivery.retry");
    expect(retryLog).toBeDefined();
    const fields = retryLog![1] as { http_status: number | null };
    expect(fields.http_status).toBe(500);
  });

  it("429 transient", async () => {
    mockResolved(429, { name: "rate_limit_exceeded" });
    const result = await sendEmail(ENV, buildPayload());
    expect(result.status).toBe("failed_transient");
    if (result.status !== "failed_transient") throw new Error("unreachable");
    expect(result.http_status).toBe(429);

    const retryLog = findLog(logSpy, "chat.delivery.retry");
    expect(retryLog).toBeDefined();
    const fields = retryLog![1] as { http_status: number | null };
    expect(fields.http_status).toBe(429);
  });

  // D-13 + Landmine 10: 4xx-except-429 (incl. 409) -> failed_terminal.
  // The 409 row IS the Landmine 10 grep-distinguishability assertion —
  // chat.delivery.failed log carries http_status: 409 so wrangler tail can
  // grep '"http_status":409' without conflating with validation 400/422.
  it.each([
    { status: 400, name: "bad_request" },
    { status: 401, name: "unauthorized" },
    { status: 403, name: "forbidden" },
    { status: 409, name: "idempotency_conflict" }, // Landmine 10
    { status: 422, name: "validation_error" },
  ])("4xx terminal (status $status)", async ({ status, name }) => {
    mockResolved(status, { name });
    const result = await sendEmail(ENV, buildPayload());
    expect(result.status).toBe("failed_terminal");
    if (result.status !== "failed_terminal") throw new Error("unreachable");
    expect(result.http_status).toBe(status);
    expect(result.resend_error).toBe(name);
    expect(result.attempt).toBe(1);

    const failedLog = findLog(errorSpy, "chat.delivery.failed");
    expect(failedLog).toBeDefined();
    const fields = failedLog![1] as {
      sid: string;
      http_status: number;
      error_class: string;
      attempt: number;
    };
    expect(fields.http_status).toBe(status);
    expect(fields.sid).toBe(SID);
    expect(fields.attempt).toBe(1);
  });
});

describe("MAIL-01 / D-15 / Landmine 1 — AbortController 10s timeout", () => {
  it("abort timeout", async () => {
    vi.useFakeTimers();
    // Landmine 1 — the mock MUST reject with DOMException name === "AbortError"
    // (NOT plain Error). The wrapper's catch branch uses
    // `err instanceof DOMException && err.name === "AbortError"` so a plain
    // Error mock would silently route through the network-error branch.
    //
    // Real `fetch` listens for AbortSignal abort events and rejects with
    // exactly this DOMException shape. The mock mirrors that behavior: hang
    // forever, listen for `signal.aborted`, and reject when the wrapper's
    // 10s setTimeout fires controller.abort().
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_, reject) => {
        const signal = init.signal as AbortSignal | undefined;
        if (signal) {
          signal.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }
      });
    });
    const p = sendEmail(ENV, buildPayload());
    // Advance past the wrapper's 10s FETCH_TIMEOUT_MS so its internal
    // setTimeout fires controller.abort() -> signal listener rejects the
    // mocked fetch promise -> DOMException flows into the catch branch.
    await vi.advanceTimersByTimeAsync(11_000);
    const result = await p;
    expect(result.status).toBe("failed_transient");
    if (result.status !== "failed_transient") throw new Error("unreachable");
    expect(result.error_class).toBe("AbortError");

    const retryLog = findLog(logSpy, "chat.delivery.retry");
    expect(retryLog).toBeDefined();
    const fields = retryLog![1] as {
      error_class: string;
      http_status: number | null;
    };
    expect(fields.error_class).toBe("AbortError");
  });
});

describe("MAIL-01 — fetch header literals (Authorization + Idempotency-Key + User-Agent)", () => {
  it("idempotency key header", async () => {
    mockResolved(200, { id: "x" });
    await sendEmail(ENV, buildPayload());
    const initArg = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = initArg.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBe(`transcript/${SID}`);
  });

  it("bearer auth header", async () => {
    mockResolved(200, { id: "x" });
    await sendEmail(ENV, buildPayload());
    const initArg = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = initArg.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe(`Bearer ${ENV.RESEND_API_KEY}`);
  });

  it("user-agent header", async () => {
    // Landmine 4 — Resend KB 403/1010 defense; Workers runtime default UA
    // is not equivalent to Node's, so we set our own identifying string.
    mockResolved(200, { id: "x" });
    await sendEmail(ENV, buildPayload());
    const initArg = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = initArg.headers as Record<string, string>;
    expect(headers["User-Agent"]).toBe("jack-cutrara-portfolio/1.0");
  });
});

describe("MAIL-02 / Landmine 9 — request body shape (text only, html absent, 5 keys, literal order)", () => {
  it("text field only", async () => {
    mockResolved(200, { id: "x" });
    const payload = buildPayload();
    await sendEmail(ENV, payload);
    const initArg = fetchMock.mock.calls[0][1] as RequestInit;
    const bodyStr = initArg.body as string;
    const parsed = JSON.parse(bodyStr) as Record<string, unknown>;

    // MAIL-02 — text field present + html field ABSENT
    expect(parsed.text).toBe(payload.text);
    expect("html" in parsed).toBe(false);

    // Landmine 9 — exactly 5 keys, in literal order { from, to, reply_to,
    // subject, text }. Object literal key ordering is stable per ES2015
    // for string keys; this assertion locks the byte-identical-retry
    // invariant for Resend's 24h Idempotency-Key window.
    const keys = Object.keys(parsed);
    expect(keys).toEqual(["from", "to", "reply_to", "subject", "text"]);
    expect(keys.length).toBe(5);

    // idempotency_key MUST flow through the header, NOT the body
    // (mixing both is undefined per Resend docs).
    expect("idempotency_key" in parsed).toBe(false);
  });
});
