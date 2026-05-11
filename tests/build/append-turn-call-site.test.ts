/**
 * D-10 / D-11 — appendTurn call-site forward defense.
 *
 * Two ctx.waitUntil(appendTurn(…).catch(…)) calls must appear in api/chat.ts:
 *   1. AFTER validateRequest, BEFORE the Anthropic stream begins (D-10).
 *   2. AFTER controller.close(), inside the start(controller) closure (D-11).
 *
 * Pattern follows tests/build/worker-entrypoint.test.ts — readFileSync the
 * source file, assert source-text invariants via regex. This is the anti-
 * regression invariant: future edits that drop the waitUntil wrapper, the
 * .catch chain, or the call-site anchor would silently break the durability
 * contract (D-09 silent-fail without the .catch; D-15 byte-identical SSE if
 * waitUntil is replaced with await).
 *
 * Source: 18-PATTERNS.md lines 411-468 + 18-RESEARCH.md § Pitfall 1.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("D-10 / D-11 / D-09: ctx.waitUntil(appendTurn(...).catch(...)) call sites in api/chat.ts (Plan 18-07 forward-defense)", () => {
  const src = readFileSync(join(process.cwd(), "src/pages/api/chat.ts"), "utf8");

  it("Invariant A: imports appendTurn from chat-transcripts at the locked relative path", () => {
    // Guards against the import path drifting (e.g., refactor src/lib/ → src/server/lib/).
    expect(src).toMatch(
      /import\s*\{[^}]*\bappendTurn\b[^}]*\}\s*from\s*["']\.\.\/\.\.\/lib\/chat-transcripts["']/,
    );
  });

  it("Invariant B (D-10): ctx.waitUntil(appendTurn(... \"user\" ...)) appears AFTER validateRequest", () => {
    const validateIdx = src.search(/validateRequest\(/);
    const userWaitIdx = src.search(/ctx\.waitUntil\(\s*appendTurn\([^)]*["']user["']/);
    expect(validateIdx).toBeGreaterThan(-1);
    expect(userWaitIdx).toBeGreaterThan(-1);
    expect(userWaitIdx).toBeGreaterThan(validateIdx);
  });

  it("Invariant C (D-11): ctx.waitUntil(appendTurn(... \"assistant\" ...)) appears AFTER controller.close()", () => {
    const closeIdx = src.search(/controller\.close\(\)/);
    const assistantWaitIdx = src.search(
      /ctx\.waitUntil\(\s*appendTurn\([^)]*["']assistant["']/,
    );
    expect(closeIdx).toBeGreaterThan(-1);
    expect(assistantWaitIdx).toBeGreaterThan(-1);
    expect(assistantWaitIdx).toBeGreaterThan(closeIdx);
  });

  it("Invariant D (D-09): both ctx.waitUntil(appendTurn(...)) calls chain a .catch handler (silent-swallow rule)", () => {
    // RESEARCH § Pitfall 1: ctx.waitUntil rejections are silently swallowed
    // without an explicit .catch chained BEFORE the promise is passed in.
    // Exactly 2 ctx.waitUntil(appendTurn(...)) matches must exist in source
    // (per Plan 18-05 D-PA-01 comment-text cleanup) — both must contain .catch(.
    const matches = src.match(/ctx\.waitUntil\(\s*appendTurn\([\s\S]*?\)\s*\)/g) ?? [];
    expect(matches.length).toBe(2);
    for (const match of matches) {
      expect(match).toContain(".catch(");
    }
  });

  it("Invariant E (anti-destructure): source does NOT destructure ctx (would lose `this` binding → 'Illegal invocation')", () => {
    // RESEARCH § Pitfall 1: destructuring waitUntil out of the Workers
    // ExecutionContext loses the `this` binding and throws "Illegal
    // invocation" at runtime. The regex pattern below is built dynamically
    // (string-concatenated RegExp source) so this test file itself contains
    // no literal occurrence of the anti-pattern — keeps the upstream
    // self-scan verification check clean (the plan-spec verifier reads this
    // file and asserts the destructure pattern is absent).
    const destructurePattern = new RegExp(
      ["const", "\\s*", "\\{", "\\s*", "waitUntil", "\\s*", "\\}", "\\s*", "=", "\\s*", "ctx", "\\b"].join(""),
    );
    expect(src).not.toMatch(destructurePattern);
  });

  it("D-15 anchor: source does NOT enqueue an SSE persistence frame (waitUntil writes stay OFF the controller.enqueue path)", () => {
    // Guards against accidentally enqueuing `data: ${JSON.stringify({persistence:...})}\n\n`
    // — D-15 byte-identical SSE contract forbids new frame types for persistence.
    expect(src).not.toMatch(/data:\s*\$\{\s*JSON\.stringify\(\s*\{\s*persistence/);
  });

  it("D-09 observability surface: chat.transcript.write_failed log namespace + error_class field present", () => {
    // Both .catch handlers must emit the canonical structured log seam so
    // wrangler tail / Workers Logs can surface KV write failures.
    expect(src).toMatch(/chat\.transcript\.write_failed/);
    expect(src).toMatch(/error_class/);
  });
});
