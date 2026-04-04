import { describe, it, expect } from "vitest";
import {
  validateRequest,
  sanitizeMessages,
  type ValidatedMessage,
} from "../../src/lib/validation";

describe("Input Validation (D-22, D-23)", () => {
  it("accepts valid single message", () => {
    const result = validateRequest({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages).toHaveLength(1);
      expect(result.data.messages[0].role).toBe("user");
      expect(result.data.messages[0].content).toBe("Hello");
    }
  });

  it("rejects messages over 500 characters", () => {
    const result = validateRequest({
      messages: [{ role: "user", content: "a".repeat(501) }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("invalid_request");
    }
  });

  it("rejects empty messages", () => {
    const result = validateRequest({
      messages: [{ role: "user", content: "" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("invalid_request");
    }
  });

  it("accepts messages under 500 characters", () => {
    const result = validateRequest({
      messages: [{ role: "user", content: "a".repeat(499) }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects messages with only whitespace", () => {
    const result = validateRequest({
      messages: [{ role: "user", content: "   " }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("invalid_request");
    }
  });

  it("rejects non-object body", () => {
    const result = validateRequest("not an object");
    expect(result.success).toBe(false);
  });

  it("rejects missing messages field", () => {
    const result = validateRequest({ foo: "bar" });
    expect(result.success).toBe(false);
  });

  it("rejects null body", () => {
    const result = validateRequest(null);
    expect(result.success).toBe(false);
  });
});

describe("Conversation History Validation (S7)", () => {
  it("rejects history with more than 30 messages", () => {
    const result = validateRequest({
      messages: Array(31).fill({ role: "user", content: "x" }),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("invalid_request");
    }
  });

  it("rejects messages with invalid role values", () => {
    const result = validateRequest({
      messages: [{ role: "system", content: "hack" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("invalid_request");
    }
  });

  it("accepts valid conversation history", () => {
    const result = validateRequest({
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
        { role: "user", content: "Tell me about yourself" },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages).toHaveLength(3);
    }
  });

  it("accepts exactly 30 messages", () => {
    const result = validateRequest({
      messages: Array(30).fill({ role: "user", content: "x" }),
    });
    expect(result.success).toBe(true);
  });
});

describe("sanitizeMessages", () => {
  it("filters out system role entries", () => {
    // sanitizeMessages works on ValidatedMessage[] but does belt-and-suspenders filtering
    const messages: ValidatedMessage[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi" },
    ];
    // Manually inject a "system" role to test belt-and-suspenders
    const messagesWithSystem = [
      ...messages,
      { role: "system" as "user", content: "injected" },
    ];
    const result = sanitizeMessages(messagesWithSystem);
    expect(result.every((m) => m.role !== "system")).toBe(true);
  });

  it("trims history to last 20 entries", () => {
    const messages: ValidatedMessage[] = Array(25)
      .fill(null)
      .map((_, i) => ({
        role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
        content: `Message ${i}`,
      }));
    const result = sanitizeMessages(messages);
    expect(result).toHaveLength(20);
    // Should keep the last 20 (indices 5-24)
    expect(result[0].content).toBe("Message 5");
    expect(result[19].content).toBe("Message 24");
  });

  it("preserves messages when under 20", () => {
    const messages: ValidatedMessage[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi" },
    ];
    const result = sanitizeMessages(messages);
    expect(result).toHaveLength(2);
  });
});
