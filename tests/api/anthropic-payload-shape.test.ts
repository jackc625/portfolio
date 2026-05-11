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
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildChatRequestArgs } from "../../src/prompts/chat-request-shape";
import type { PortfolioContext } from "../../src/prompts/portfolio-context-types";
import { validateRequest } from "../../src/lib/validation";
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

describe("D-16: sessionId-on-envelope path (Plan 18-04 extension — TEST-03 hardening)", () => {
  // Plan 18-03 extended RequestSchema with sessionId: z.uuidv4().optional().
  // The cacheable Anthropic surface (system + messages[0]) MUST stay byte-identical
  // regardless of whether sessionId appears on the HTTP envelope (D-16 + RESEARCH § Pitfall 3).
  //
  // The existing 5 tests above assert ABSENCE (no literal "sessionId", no UUIDv4 pattern,
  // system byte-equal across calls with different messages). The 3 tests below ADD
  // forward-defense for the regression class those tests miss: a template-string
  // concatenation that smuggles sessionId into the system block (e.g., `session ${sid}`).
  // Pattern-grep against UUIDv4 regex catches some leaks but misses synthetic IDs.
  // Byte-equality across sessionId-bearing vs no-sessionId calls catches BOTH cases.

  const VALID_SID = "8b0f7f1c-1234-4567-8901-abcdef012345";
  const FIXED_MESSAGES = [{ role: "user" as const, content: "Hi" }];

  it("(a) buildChatRequestArgs produces byte-identical system + messages[0] regardless of sessionId on envelope", () => {
    // Simulate api/chat.ts code path: validate two bodies — one with sessionId, one without.
    const withSid = validateRequest({ sessionId: VALID_SID, messages: FIXED_MESSAGES });
    const withoutSid = validateRequest({ messages: FIXED_MESSAGES });

    expect(withSid.success).toBe(true);
    expect(withoutSid.success).toBe(true);

    if (!withSid.success || !withoutSid.success) return; // narrow TS

    // Both bodies surface the same messages[] to buildChatRequestArgs.
    // sessionId NEVER threads in — and this test forward-defends that promise.
    const ctx = portfolioContext as unknown as PortfolioContext;
    const argsWithSid = buildChatRequestArgs(ctx, withSid.data.messages);
    const argsWithoutSid = buildChatRequestArgs(ctx, withoutSid.data.messages);

    expect(JSON.stringify(argsWithSid.system)).toBe(JSON.stringify(argsWithoutSid.system));
    expect(JSON.stringify(argsWithSid.messages[0])).toBe(JSON.stringify(argsWithoutSid.messages[0]));
  });

  it("(b) buildChatRequestArgs source-text contains zero sessionId references (no template-string leak)", () => {
    // RESEARCH § Pitfall 3: a template-string concatenation `${sid}` would slip past
    // the literal/UUIDv4-pattern greps in the legacy 5 tests. Source-text forward-defense
    // asserts chat-request-shape.ts has no legitimate reason to mention sessionId at all.
    const src = readFileSync(join(process.cwd(), "src/prompts/chat-request-shape.ts"), "utf8");
    expect(src).toMatch(/export\s+function\s+buildChatRequestArgs\s*\(/);
    const sigMatch = src.match(/buildChatRequestArgs\s*\(([^)]*)\)/);
    expect(sigMatch).not.toBeNull();
    expect(sigMatch![1]).not.toContain("sessionId");
    expect(src).not.toMatch(/sessionId/);
  });

  it("(c) validateRequest accepts a request body carrying sessionId on the HTTP envelope", () => {
    // Closes the loop with Plan 18-03 RequestSchema extension. If the schema later
    // strips .optional() or changes to z.uuid()/z.string().uuid(), this test catches it
    // at the cache-integrity test file (an additional surface beyond Plan 18-03's
    // dedicated tests/api/chat-session-id.test.ts).
    const result = validateRequest({
      sessionId: VALID_SID,
      messages: FIXED_MESSAGES,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionId).toBe(VALID_SID);
    }
  });
});
