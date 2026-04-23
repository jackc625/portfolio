import { buildSystemPrompt } from "../../prompts/system-prompt";
import type { PortfolioContext } from "../../prompts/portfolio-context-types";

/**
 * Message shape accepted by the Anthropic Messages API for user/assistant turns.
 * Mirrors the shape validated by src/lib/validation.ts sanitizeMessages output.
 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Builds the exact arguments object passed to Anthropic's `client.messages.create()`.
 *
 * Pure -- no SDK calls, no network, no I/O. Extracted so tests can import and assert
 * on the returned object structurally (REVIEWS.md MEDIUM -- replaces brittle
 * source-text regex with an introspectable payload).
 *
 * Shape invariants (locked by tests/api/chat.test.ts):
 *   - model: "claude-haiku-4-5"
 *   - max_tokens: 768                                    (CHAT-07)
 *   - system: [{ type, text, cache_control }]             (CHAT-05 / D-12 -- array, NOT string)
 *   - system[0].cache_control.type: "ephemeral"           (CHAT-05)
 *   - stream: true
 */
export function buildChatRequestArgs(
  context: PortfolioContext,
  messages: ChatMessage[]
) {
  return {
    model: "claude-haiku-4-5",
    max_tokens: 768, // CHAT-07
    system: [
      {
        type: "text" as const,
        text: buildSystemPrompt(context),
        cache_control: { type: "ephemeral" as const }, // CHAT-05 / D-12
      },
    ],
    messages,
    stream: true as const,
  };
}
