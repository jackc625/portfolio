/**
 * TEST-03 — Anthropic prompt cache integrity (forward-defense).
 *
 * Phase 17 has no sessionId yet — Phase 18 introduces it. This test asserts
 * the CURRENT clean state and locks it forward: no per-session field may
 * appear in the cacheable system block or messages[0] payload.
 *
 * Anthropic's prompt-cache hit predicate is "exact byte-equality of the
 * `system` array contents across calls". Threading a sessionId (or any
 * per-request UUID) into the cacheable surface silently disables the cache
 * — every request becomes a fresh cache_creation rather than a cache_read,
 * 10x'ing both latency and token spend. The threat is invisible at the
 * application layer; only token counts in Workers Logs reveal it.
 *
 * If this test fails in Phase 18, IDENT-02 has a regression — sessionId
 * leaked into the Anthropic call args. Fix at the source (route sessionId
 * through the HTTP envelope — request header or non-cached body field), not
 * by editing the test.
 */
import { describe, it, expect } from "vitest";
import { buildChatRequestArgs } from "../../src/prompts/chat-request-shape";
import type { PortfolioContext } from "../../src/prompts/portfolio-context-types";
import portfolioContext from "../../src/data/portfolio-context.json";

// Canonical UUIDv4 pattern. Phase 18 IDENT-02 will mint per-session UUIDs;
// this regex catches the obvious threading shape if it leaks into the
// cacheable surface.
const UUID_V4_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

describe("TEST-03: Anthropic payload shape — no per-session fields in cacheable surface", () => {
  const ctx = portfolioContext as unknown as PortfolioContext;
  const args1 = buildChatRequestArgs(ctx, [
    { role: "user", content: "What's your favorite project?" },
  ]);
  const args2 = buildChatRequestArgs(ctx, [
    { role: "user", content: "Tell me about TypeScript." },
  ]);

  it("system block does not contain literal 'sessionId'", () => {
    const systemText = JSON.stringify(args1.system);
    expect(systemText).not.toContain("sessionId");
  });

  it("system block does not contain a UUIDv4 pattern", () => {
    const systemText = JSON.stringify(args1.system);
    expect(systemText).not.toMatch(UUID_V4_REGEX);
  });

  it("messages[0].content does not contain literal 'sessionId'", () => {
    const firstMsg = JSON.stringify(args1.messages[0]);
    expect(firstMsg).not.toContain("sessionId");
  });

  it("messages[0].content does not contain a UUIDv4 pattern", () => {
    const firstMsg = JSON.stringify(args1.messages[0]);
    expect(firstMsg).not.toMatch(UUID_V4_REGEX);
  });

  it("system block is byte-identical across calls with different messages (cacheable)", () => {
    // This is what Anthropic's prompt-cache hit predicate evaluates: the
    // serialized `system` array must be EXACTLY EQUAL between two calls for
    // the second call to be a cache_read. Phase 18's sessionId MUST NOT
    // make this assertion fail — if it does, the cache is silently disabled.
    const sys1 = JSON.stringify(args1.system);
    const sys2 = JSON.stringify(args2.system);
    expect(sys1).toBe(sys2);
  });
});
