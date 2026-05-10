/**
 * DEBT-01 — PROJECT.md Known issues entry framing.
 *
 * v1.3 milestone-shape lock (2026-05-09) reframed CHAT_RATE_LIMITER from
 * "carry-forward gap" to "documented + Free-tier acceptable." Workers Paid
 * plan upgrade is v1.4+. This test asserts the doc reflects the lock.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("DEBT-01: PROJECT.md Known issues framing for CHAT_RATE_LIMITER", () => {
  const src = readFileSync(join(process.cwd(), ".planning/PROJECT.md"), "utf8");

  it("contains CHAT_RATE_LIMITER reference (entry exists)", () => {
    expect(src).toContain("CHAT_RATE_LIMITER");
  });

  it("uses 'Free-tier acceptable' framing (locked decision wording)", () => {
    expect(src).toContain("Free-tier acceptable");
  });

  it("does not retain stale 'carry-forward gap' framing for CHAT_RATE_LIMITER", () => {
    // Allow 'carry-forward' to appear elsewhere (e.g. for other v1.2 items
    // that legitimately carried forward); only the CHAT_RATE_LIMITER context
    // must not retain the stale gap framing.
    const rateLimiterIndex = src.indexOf("CHAT_RATE_LIMITER");
    const surrounding = src.slice(rateLimiterIndex, rateLimiterIndex + 600);
    expect(surrounding).not.toContain("carry-forward gap");
  });

  it("references Workers Paid v1.4+ as upgrade path", () => {
    const rateLimiterIndex = src.indexOf("CHAT_RATE_LIMITER");
    const surrounding = src.slice(rateLimiterIndex, rateLimiterIndex + 600);
    expect(surrounding).toMatch(/Workers Paid|v1\.4/);
  });

  it("uses the renamed heading 'Known issues / tech debt' (no v1.3 qualifier)", () => {
    expect(src).toContain("**Known issues / tech debt:**");
    expect(src).not.toContain("carried into v1.3");
  });

  it("does not list DEBT items closed in Phase 17 under v1.3-carry-forward Known issues", () => {
    // After Phase 17 close, the 5 v1.3 chat-tech-debt items (CHAT_RATE_LIMITER
    // doc reframe, cache-hit obs, build:chat-context:check CI, WR-01 dedup,
    // #chat-panel state machine) all have closure paths in this milestone.
    // The "Known issues / tech debt carried into v1.3" block should reflect
    // the post-Phase-17 reality: only items that DIDN'T carry forward (or
    // were re-classified) remain as bullets.
    const knownIssuesMatch = src.match(/Known issues[\s\S]*?##/);
    if (knownIssuesMatch) {
      const block = knownIssuesMatch[0];
      // The reframed CHAT_RATE_LIMITER bullet (Free-tier acceptable) IS
      // still allowed in the Known-issues list — it's not closed by code,
      // just reframed. The other 4 items should NOT appear here as
      // open items (they're closed by Phase 17 plans).
      expect(block).not.toContain("Chat cache-hit-rate observability not yet wired");
      expect(block).not.toContain("`build:chat-context:check` not enforced in CI");
      expect(block).not.toContain("`#chat-panel` display contract is JS-coupled");
      expect(block).not.toContain("WR-01 bootstrap listener registers without dedup");
    }
  });
});
