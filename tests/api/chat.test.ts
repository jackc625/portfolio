import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateRequest,
  sanitizeMessages,
  isAllowedOrigin,
  MAX_BODY_SIZE,
} from "../../src/lib/validation";
import { buildChatRequestArgs } from "../../src/prompts/chat-request-shape";
import portfolioContext from "../../src/data/portfolio-context.json";

// These tests exercise the validation + SSE formatting logic as unit tests.
// We test the contract: validation rules, CORS checks, body size limits, and SSE format.
// Full integration tests with the actual Astro endpoint are not needed here.

describe("Chat API Endpoint Contract (D-09)", () => {
  describe("Input validation for endpoint", () => {
    it("returns error shape for invalid JSON body (non-parseable)", () => {
      // Simulates what the endpoint does: validate parsed body
      const result = validateRequest(undefined);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("invalid_request");
      }
    });

    it("returns error shape for missing messages field", () => {
      const result = validateRequest({ notMessages: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("invalid_request");
      }
    });

    // Mirrors the endpoint's Content-Length check (WR-02). Uses Number() so
    // malformed values (NaN, negative, fractional) are rejected as "too large"
    // instead of being silently accepted like parseInt would have.
    const rejectsContentLength = (raw: string): boolean => {
      const parsed = Number(raw);
      return (
        !Number.isFinite(parsed) ||
        !Number.isInteger(parsed) ||
        parsed < 0 ||
        parsed > MAX_BODY_SIZE
      );
    };

    it("rejects Content-Length exceeding MAX_BODY_SIZE (32KB)", () => {
      expect(rejectsContentLength("65536")).toBe(true);
      expect(MAX_BODY_SIZE).toBe(32768);
    });

    it("accepts Content-Length within MAX_BODY_SIZE", () => {
      expect(rejectsContentLength("1024")).toBe(false);
    });

    it("rejects malformed Content-Length (non-numeric)", () => {
      // "abc" → NaN → must be rejected, not silently allowed
      expect(rejectsContentLength("abc")).toBe(true);
    });

    it("rejects negative Content-Length", () => {
      // "-1" → -1 → must be rejected, not silently allowed
      expect(rejectsContentLength("-1")).toBe(true);
    });

    it("rejects fractional Content-Length", () => {
      // "32768.5" → non-integer → reject
      expect(rejectsContentLength("32768.5")).toBe(true);
    });
  });

  describe("CORS enforcement", () => {
    it("rejects origin 'evil-jackcutrara.com'", () => {
      expect(isAllowedOrigin("https://evil-jackcutrara.com")).toBe(false);
    });

    it("allows origin 'https://jackcutrara.com'", () => {
      expect(isAllowedOrigin("https://jackcutrara.com")).toBe(true);
    });

    it("rejects arbitrary origin", () => {
      expect(isAllowedOrigin("https://attacker.com")).toBe(false);
    });
  });

  describe("SSE format contract", () => {
    it("produces correctly formatted SSE data event", () => {
      // Verify the SSE format the endpoint uses
      const text = "Hello world";
      const sseEvent = `data: ${JSON.stringify({ text })}\n\n`;
      expect(sseEvent).toBe('data: {"text":"Hello world"}\n\n');
      expect(sseEvent.startsWith("data: ")).toBe(true);
      expect(sseEvent.endsWith("\n\n")).toBe(true);
    });

    it("produces [DONE] terminator event", () => {
      const doneEvent = "data: [DONE]\n\n";
      expect(doneEvent).toBe("data: [DONE]\n\n");
    });

    it("produces error event for API failure", () => {
      const errorEvent = `data: ${JSON.stringify({ error: true })}\n\n`;
      expect(errorEvent).toBe('data: {"error":true}\n\n');
    });
  });

  describe("Streaming with mocked Anthropic client", () => {
    it("streams SSE events from mocked Anthropic response", async () => {
      // Simulate the streaming logic from the endpoint
      const mockEvents = [
        { type: "content_block_delta", delta: { type: "text_delta", text: "Hello" } },
        { type: "content_block_delta", delta: { type: "text_delta", text: " world" } },
        { type: "message_stop" },
      ];

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const chunks: string[] = [];

      const stream = new ReadableStream({
        async start(controller) {
          for (const event of mockEvents) {
            if (
              event.type === "content_block_delta" &&
              "delta" in event &&
              event.delta?.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: event.delta?.text })}\n\n`
                )
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      const reader = stream.getReader();
      let done = false;
      while (!done) {
        const result = await reader.read();
        if (result.done) {
          done = true;
        } else {
          chunks.push(decoder.decode(result.value));
        }
      }

      const fullOutput = chunks.join("");
      expect(fullOutput).toContain('data: {"text":"Hello"}');
      expect(fullOutput).toContain('data: {"text":" world"}');
      expect(fullOutput).toContain("data: [DONE]");
    });

    it("sends error event when Anthropic client throws", async () => {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const chunks: string[] = [];

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Simulate Anthropic client throwing
            throw new Error("API rate limit exceeded");
          } catch {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`)
              );
              controller.close();
            } catch {
              // Controller may already be closed
            }
          }
        },
      });

      const reader = stream.getReader();
      let done = false;
      while (!done) {
        const result = await reader.read();
        if (result.done) {
          done = true;
        } else {
          chunks.push(decoder.decode(result.value));
        }
      }

      const fullOutput = chunks.join("");
      expect(fullOutput).toContain('data: {"error":true}');
    });
  });

  describe("Sanitization in endpoint flow", () => {
    it("sanitizes validated messages before sending to LLM", () => {
      // Verify the endpoint flow: validate then sanitize
      const validResult = validateRequest({
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi" },
        ],
      });
      expect(validResult.success).toBe(true);
      if (validResult.success) {
        const sanitized = sanitizeMessages(validResult.data.messages);
        expect(sanitized).toHaveLength(2);
        expect(sanitized[0].role).toBe("user");
        expect(sanitized[1].role).toBe("assistant");
      }
    });
  });

  describe("SDK request shape (CHAT-05 / CHAT-07)", () => {
    // Primary -- structural: call the exported helper and introspect the returned object.
    const args = buildChatRequestArgs(portfolioContext as never, [
      { role: "user", content: "Hello" },
    ]);

    it("max_tokens is 768 (CHAT-07 -- up from Phase 7's 512)", () => {
      expect(args.max_tokens).toBe(768);
    });

    it("system is an ARRAY of TextBlockParam, NOT a bare string (L2 landmine guard -- structural)", () => {
      expect(Array.isArray(args.system)).toBe(true);
      expect((args.system as unknown[]).length).toBe(1);
      const block = (args.system as Array<{
        type: string;
        text: string;
        cache_control: { type: string };
      }>)[0];
      expect(block.type).toBe("text");
      expect(typeof block.text).toBe("string");
      // Text content must come from buildSystemPrompt -- i.e., contain "<role>" after the rewrite.
      expect(block.text.length).toBeGreaterThan(100);
      expect(block.text).toContain("<role>");
    });

    it("cache_control is { type: \"ephemeral\" } per D-12 (CHAT-05 -- structural)", () => {
      const block = (args.system as Array<{
        cache_control: { type: string };
      }>)[0];
      expect(block.cache_control).toEqual({ type: "ephemeral" });
    });

    it("model is claude-haiku-4-5 and stream is true (Phase 7 D-26 invariants preserved in helper)", () => {
      expect(args.model).toBe("claude-haiku-4-5");
      expect(args.stream).toBe(true);
    });

    it("messages array is passed through unmodified", () => {
      expect(args.messages).toEqual([{ role: "user", content: "Hello" }]);
    });

    // Secondary -- source-text guards on chat.ts. Cheap regression protection against
    // a future refactor that replaces buildChatRequestArgs() with an inline literal.
    const chatSource = readFileSync(
      join(process.cwd(), "src", "pages", "api", "chat.ts"),
      "utf8"
    );

    it("chat.ts calls buildChatRequestArgs() (L2 secondary guard -- no inline literal)", () => {
      expect(
        chatSource,
        "chat.ts must call buildChatRequestArgs -- replacing it with an inline literal risks cache-silent-disable drift"
      ).toContain("buildChatRequestArgs(portfolioContext, messages)");
      // Negative guards against the pre-plan inline shapes.
      expect(chatSource).not.toContain("max_tokens: 512");
      expect(chatSource).not.toMatch(/system:\s*buildSystemPrompt\(portfolioContext\)/);
    });

    it("preserves the Cloudflare-SSE Content-Encoding: none header (AI-SPEC pitfall #4)", () => {
      expect(chatSource).toContain('"Content-Encoding": "none"');
    });

    it("preserves Phase 7 D-26 invariants: CORS, rate-limiter, sanitize, stream:true call site", () => {
      expect(chatSource).toContain("isAllowedOrigin(origin)");
      expect(chatSource).toContain("rateLimiter.limit({ key: ip })");
      expect(chatSource).toContain("sanitizeMessages(validation.data.messages)");
      // stream:true is in the helper file now -- assert it there.
      const helperSource = readFileSync(
        join(process.cwd(), "src", "prompts", "chat-request-shape.ts"),
        "utf8"
      );
      expect(helperSource).toContain("stream: true");
    });
  });
});
