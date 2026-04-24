// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { streamChat } from "../../src/scripts/chat";

type AnalyticsDetail = { action: string; label?: string; timestamp?: number };

/**
 * Build a mock Response with a ReadableStream body that emits the supplied
 * SSE frames in order, then closes. Mirrors tests/api/chat.test.ts:117-157
 * but scoped for client-side streamChat consumption.
 */
function makeMockResponse(frames: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const frame of frames) {
        controller.enqueue(encoder.encode(frame));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

beforeEach(() => {
  // Reset fetch mock each test
  (globalThis as unknown as { fetch: unknown }).fetch = vi.fn();
});

describe("SSE truncation frame (D-14, D-15 client-only)", () => {
  it("dispatches chat:analytics with action='chat_truncated' on {truncated:true} frame", async () => {
    const analyticsSpy = vi.fn();
    document.addEventListener("chat:analytics", (e) => {
      analyticsSpy((e as CustomEvent<AnalyticsDetail>).detail);
    });

    (globalThis as unknown as { fetch: unknown }).fetch = vi.fn().mockResolvedValue(
      makeMockResponse([
        `data: ${JSON.stringify({ text: "Hello" })}\n\n`,
        `data: ${JSON.stringify({ truncated: true })}\n\n`,
        `data: [DONE]\n\n`,
      ])
    );

    const onToken = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamChat(
      [{ role: "user", content: "test" }] as never,
      onToken,
      onDone,
      onError
    );

    // Verify chat:analytics was dispatched with action='chat_truncated'
    const truncatedCall = analyticsSpy.mock.calls.find(
      (call) => call[0].action === "chat_truncated"
    );
    expect(truncatedCall).toBeDefined();
  });

  it("does NOT call onToken with undefined for the truncated frame (L7 no double-render)", async () => {
    (globalThis as unknown as { fetch: unknown }).fetch = vi.fn().mockResolvedValue(
      makeMockResponse([
        `data: ${JSON.stringify({ text: "Hello" })}\n\n`,
        `data: ${JSON.stringify({ truncated: true })}\n\n`,
        `data: [DONE]\n\n`,
      ])
    );

    const onToken = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamChat(
      [{ role: "user", content: "test" }] as never,
      onToken,
      onDone,
      onError
    );

    // onToken called exactly once — with "Hello". Never with undefined.
    expect(onToken).toHaveBeenCalledTimes(1);
    expect(onToken).toHaveBeenCalledWith("Hello");
    expect(onToken).not.toHaveBeenCalledWith(undefined);
  });

  it("continues draining stream after truncated frame until [DONE] (onDone fires exactly once)", async () => {
    (globalThis as unknown as { fetch: unknown }).fetch = vi.fn().mockResolvedValue(
      makeMockResponse([
        `data: ${JSON.stringify({ text: "partial" })}\n\n`,
        `data: ${JSON.stringify({ truncated: true })}\n\n`,
        `data: [DONE]\n\n`,
      ])
    );

    const onToken = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamChat(
      [{ role: "user", content: "test" }] as never,
      onToken,
      onDone,
      onError
    );

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("non-truncated responses do NOT dispatch chat_truncated", async () => {
    const analyticsSpy = vi.fn();
    document.addEventListener("chat:analytics", (e) => {
      analyticsSpy((e as CustomEvent<AnalyticsDetail>).detail);
    });

    (globalThis as unknown as { fetch: unknown }).fetch = vi.fn().mockResolvedValue(
      makeMockResponse([
        `data: ${JSON.stringify({ text: "Complete response." })}\n\n`,
        `data: [DONE]\n\n`,
      ])
    );

    const onToken = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamChat(
      [{ role: "user", content: "test" }] as never,
      onToken,
      onDone,
      onError
    );

    const truncatedCall = analyticsSpy.mock.calls.find(
      (call) => call[0].action === "chat_truncated"
    );
    expect(truncatedCall).toBeUndefined();
  });
});
