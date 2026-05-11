/**
 * DEBT-02 — Server-side cache-hit log seam (Plan 17-05).
 *
 * The handler emits a structured `chat.cache_metrics` console.log line per
 * Anthropic response (sourced from the message_start event usage field).
 * D-15 anchor: NO new SSE frame types — log-only.
 *
 * Pattern mirrors tests/api/sse-snapshot.test.ts:
 *   - Mock the `cloudflare:workers` virtual module at the test seam (Plan 17-01)
 *   - Mock Anthropic SDK at the boundary (single `client.messages.create` site)
 *   - Drive the handler with a synthetic Origin-allowed request
 *   - Drain the SSE body end-to-end so the stream loop runs
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the cloudflare:workers virtual module so env.ANTHROPIC_API_KEY is
// populated when the handler is imported under vitest.
vi.mock("cloudflare:workers", () => ({
  env: {
    ANTHROPIC_API_KEY: "test-key-for-mock",
  },
}));

interface MockUsage {
  input_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  output_tokens: number;
}

/**
 * Build an Anthropic SDK mock that yields:
 *   1. message_start with cache-related usage fields (cache_read, cache_creation,
 *      input_tokens). At message_start, output_tokens reported by Anthropic is
 *      typically 1-3 (preamble accounting) — NOT the final response token count.
 *   2. content_block_delta with one token of text.
 *   3. message_delta with the FINAL output_tokens in usage. This mirrors the
 *      real Anthropic streaming protocol: the canonical output_tokens lives in
 *      message_delta.usage, not message_start.message.usage.
 *
 * CR-01 (Phase 17 review): Earlier versions of this mock supplied the final
 * output_tokens at message_start and asserted it was echoed; that mocked a
 * shape Anthropic never emits and masked a real production bug. The handler
 * now defers the chat.cache_metrics log to message_delta. See chat.ts.
 */
function mockAnthropicWithUsage(usage: MockUsage) {
  return {
    default: class MockAnthropic {
      messages = {
        create: async () => {
          async function* generate() {
            yield {
              type: "message_start",
              message: {
                usage: {
                  input_tokens: usage.input_tokens,
                  cache_read_input_tokens: usage.cache_read_input_tokens,
                  cache_creation_input_tokens: usage.cache_creation_input_tokens,
                  // Real Anthropic message_start.usage.output_tokens is the
                  // preamble count, not the final. Use 1 to model this.
                  output_tokens: 1,
                },
              },
            };
            yield {
              type: "content_block_delta",
              delta: { type: "text_delta", text: "Hi" },
            };
            yield {
              type: "message_delta",
              delta: { stop_reason: "end_turn" },
              usage: { output_tokens: usage.output_tokens },
            };
          }
          return generate();
        },
      };
    },
  };
}

function buildRequest(): Request {
  return new Request("https://jackcutrara.com/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://jackcutrara.com",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Hi" }],
    }),
  });
}

async function drain(response: Response): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(decoder.decode(value));
  }
  return chunks.join("");
}

describe("DEBT-02: chat.cache_metrics structured log seam", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits chat.cache_metrics with all four token fields populated", async () => {
    vi.doMock("@anthropic-ai/sdk", () =>
      mockAnthropicWithUsage({
        input_tokens: 100,
        cache_read_input_tokens: 80,
        cache_creation_input_tokens: 0,
        output_tokens: 50,
      })
    );
    const { POST } = await import("../../src/pages/api/chat");
    const response = await POST({ request: buildRequest() } as never);
    await drain(response);

    const cacheMetricsCall = logSpy.mock.calls.find(
      (c: unknown[]) => c[0] === "chat.cache_metrics"
    );
    expect(cacheMetricsCall).toBeDefined();
    expect(cacheMetricsCall![1]).toEqual({
      cache_read_input_tokens: 80,
      cache_creation_input_tokens: 0,
      input_tokens: 100,
      output_tokens: 50,
    });
  });

  it("defaults missing cache token fields to 0 (not undefined)", async () => {
    vi.doMock("@anthropic-ai/sdk", () =>
      mockAnthropicWithUsage({
        input_tokens: 100,
        output_tokens: 50,
        // cache_read_input_tokens + cache_creation_input_tokens omitted
      })
    );
    const { POST } = await import("../../src/pages/api/chat");
    const response = await POST({ request: buildRequest() } as never);
    await drain(response);

    const cacheMetricsCall = logSpy.mock.calls.find(
      (c: unknown[]) => c[0] === "chat.cache_metrics"
    );
    expect(cacheMetricsCall).toBeDefined();
    const arg = cacheMetricsCall![1] as Record<string, number>;
    expect(arg.cache_read_input_tokens).toBe(0);
    expect(arg.cache_creation_input_tokens).toBe(0);
    expect(arg.input_tokens).toBe(100);
    expect(arg.output_tokens).toBe(50);
  });

  it("does not enqueue a new SSE frame type for cache metrics (D-15 anchor)", async () => {
    vi.doMock("@anthropic-ai/sdk", () =>
      mockAnthropicWithUsage({
        input_tokens: 100,
        cache_read_input_tokens: 80,
        cache_creation_input_tokens: 0,
        output_tokens: 50,
      })
    );
    const { POST } = await import("../../src/pages/api/chat");
    const response = await POST({ request: buildRequest() } as never);
    const fullOutput = await drain(response);

    // No frame containing cache token field names or the log event name:
    expect(fullOutput).not.toContain("cache_read");
    expect(fullOutput).not.toContain("cache_creation");
    expect(fullOutput).not.toContain("cache_metrics");
    // Existing frames still present:
    expect(fullOutput).toContain('"text":"Hi"');
    expect(fullOutput).toContain("data: [DONE]");
  });
});
