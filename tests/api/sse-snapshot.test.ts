/**
 * SSE byte-identical snapshot (D-15 / TEST-02 / Phase 17 D-04)
 *
 * Captures the canonical SSE byte stream of /api/chat against a
 * deterministic fixture (Anthropic mocked, single-token "Hello" response).
 * The fixture in tests/fixtures/sse-snapshot-frames.bin is the source of
 * truth for D-15; any byte-level drift in headers or frame shape fails
 * this test.
 *
 * Phase 18 will add ctx.waitUntil(appendTurn(...)) calls in api/chat.ts.
 * waitUntil runs out-of-band and does NOT modify response bytes — this
 * fixture should pass into Phase 18 unchanged. If it fails in Phase 18,
 * verify the failure is in headers/frame-shape, not in waitUntil timing.
 *
 * Per Phase 17 D-15: this fixture was captured BEFORE any migration code
 * (wrangler.jsonc rewrite, src/worker.ts) landed. Do NOT regenerate
 * without an explicit D-15 amendment in plan-time.
 */
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Mock the cloudflare:workers virtual module. The api/chat.ts route imports
// `env` from this module and reads env.ANTHROPIC_API_KEY at request time.
// Vitest runs in plain Node, so the virtual module does not exist — provide
// a stub env with a non-empty API key so the handler reaches the SSE branch.
vi.mock("cloudflare:workers", () => ({
  env: {
    ANTHROPIC_API_KEY: "test-key-for-mock",
  },
}));

// Mock the Anthropic SDK at the boundary api/chat.ts imports. The handler
// calls `client.messages.create(...)` and iterates the returned async
// iterable. Yield exactly one content_block_delta with text "Hello" and
// then end — NO message_delta (so truncated stays false), NO error.
// This isolates the SSE server-frame structure from variable model output
// (per Phase 17 RESEARCH §"Pitfall 2 — SSE Bytes Not Deterministic Without
// Fixture Control").
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: async () => {
          async function* generate() {
            yield {
              type: "content_block_delta",
              delta: { type: "text_delta", text: "Hello" },
            };
          }
          return generate();
        },
      };
    },
  };
});

describe("SSE byte-identical snapshot (D-15 / TEST-02)", () => {
  // Shared request shape — origin must pass isAllowedOrigin allow-list.
  const buildRequest = () =>
    new Request("https://jackcutrara.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jackcutrara.com",
      },
      body: JSON.stringify({
        messages: [
          { role: "user", content: "Say only the literal phrase: Hello world." },
        ],
      }),
    });

  it("D-15: response headers match fixture (TEST-02)", async () => {
    const expected = JSON.parse(
      readFileSync(
        join(process.cwd(), "tests/fixtures/sse-snapshot-headers.json"),
        "utf8"
      )
    );
    const { POST } = await import("../../src/pages/api/chat");
    const response = await POST({
      request: buildRequest(),
    } as never);

    expect(response.headers.get("content-type")).toBe(expected["content-type"]);
    expect(response.headers.get("cache-control")).toBe(expected["cache-control"]);
    expect(response.headers.get("connection")).toBe(expected["connection"]);
    expect(response.headers.get("content-encoding")).toBe(
      expected["content-encoding"]
    );
  });

  it("D-15: SSE frame bytes match fixture (TEST-02)", async () => {
    const expected = readFileSync(
      join(process.cwd(), "tests/fixtures/sse-snapshot-frames.bin")
    );
    const { POST } = await import("../../src/pages/api/chat");
    const response = await POST({
      request: buildRequest(),
    } as never);

    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const actual = Buffer.concat(chunks);

    // Byte-exact equality. Buffer.compare returns 0 when equal.
    expect(Buffer.compare(actual, expected)).toBe(0);
    expect(actual.length).toBe(expected.length);
  });

  it("D-15: api/chat.ts source text contains canonical SSE strings (anti-regression)", () => {
    const src = readFileSync(
      join(process.cwd(), "src/pages/api/chat.ts"),
      "utf8"
    );
    expect(src).toContain('"Content-Type": "text/event-stream"');
    expect(src).toContain('"Cache-Control": "no-cache, no-transform"');
    expect(src).toContain('Connection: "keep-alive"');
    expect(src).toContain('"Content-Encoding": "none"');
    expect(src).toContain("data: [DONE]");
  });
});
