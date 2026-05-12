/**
 * CRON-01 — ctx.waitUntil(deliverDue(...).catch(...)) call-site forward defense.
 *
 * Plan 19-03 wires src/worker.ts scheduled() to the unit-tested deliverDue
 * pure module from Plan 19-02. This test locks 6 source-text invariants on
 * src/worker.ts so future edits cannot silently drop the .catch handler,
 * destructure ctx, re-introduce the Phase 17 stub log line, or remove the
 * Env.DRY_RUN field that the cron sweep contract depends on.
 *
 * Pattern follows tests/build/append-turn-call-site.test.ts (Plan 18-07) —
 * readFileSync the source file, assert source-text invariants via regex.
 * Deviations from the appendTurn analog:
 *   • Plan 19-03 has exactly 1 deliverDue call site (vs 2 appendTurn calls)
 *     so the count assertion is dropped.
 *   • No ordering assertion vs controller.close() — scheduled() has no
 *     such site; that was an appendTurn-specific concern.
 *   • Adds Invariant E (anti-stub-log-line — substitution semantic) and
 *     Invariant F (Env.DRY_RUN field — Plan 19-01 regression-lock).
 *
 * Source: 19-PATTERNS.md "tests/build/worker-scheduled-call-site.test.ts
 * (NEW, OPTIONAL)" section + Phase 18 D-09 inheritance.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("CRON-01: ctx.waitUntil(deliverDue(...).catch(...)) call site in src/worker.ts", () => {
  const src = readFileSync(join(process.cwd(), "src/worker.ts"), "utf8");

  it("Invariant A: imports deliverDue from ./lib/chat-delivery at the locked relative path", () => {
    // Guards against the import path drifting (e.g., refactor src/lib/ → src/server/lib/).
    expect(src).toMatch(
      /import\s*\{[^}]*\bdeliverDue\b[^}]*\}\s*from\s*["']\.\/lib\/chat-delivery["']/,
    );
  });

  it("Invariant B: scheduled() body contains ctx.waitUntil(deliverDue(...))", () => {
    // The wired call site is the substitution target of the Phase 17 stub.
    expect(src).toMatch(/ctx\.waitUntil\(\s*deliverDue\(/);
  });

  it("Invariant C (Phase 18 D-09): .catch is chained INSIDE the ctx.waitUntil promise (rejection-safe)", () => {
    // RESEARCH § Pitfall 1: ctx.waitUntil rejections are silently swallowed
    // without an explicit .catch chained BEFORE the promise is passed in.
    // Also: ctx.waitUntil returns void, so .catch chained AFTER would be a
    // type error and a runtime no-op. The .catch MUST live inside the
    // promise wrapped by waitUntil.
    const matches = src.match(/ctx\.waitUntil\(\s*deliverDue\([\s\S]*?\)\s*\)/g) ?? [];
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      expect(match).toContain(".catch(");
    }
  });

  it("Invariant D (anti-destructure): source does NOT destructure ctx (would lose `this` binding → 'Illegal invocation')", () => {
    // RESEARCH § Pitfall 1: destructuring waitUntil out of the Workers
    // ExecutionContext loses the `this` binding and throws "Illegal
    // invocation" at runtime. The regex pattern below is built dynamically
    // (string-concatenated RegExp source) so this test file itself contains
    // no literal occurrence of the anti-pattern — keeps the source-text
    // self-scan verification clean and ensures this file does NOT self-match.
    const destructurePattern = new RegExp(
      ["const", "\\s*", "\\{", "\\s*", "waitUntil", "\\s*", "\\}", "\\s*", "=", "\\s*", "ctx", "\\b"].join(""),
    );
    expect(src).not.toMatch(destructurePattern);
  });

  it("Invariant E (substitution semantic): Phase 17 worker.scheduled.stub log line is REMOVED, replaced by worker.scheduled.failed observability", () => {
    // Plan 19-03 REPLACES (not amends) the stub — the migration semantic is
    // substitution, so the old stub log namespace must be absent and the new
    // catastrophic-failure log namespace must be present with its error_class
    // field per the Phase 18 chat.transcript.write_failed convention.
    expect(src).not.toContain('"worker.scheduled.stub"');
    expect(src).toMatch(/worker\.scheduled\.failed/);
    expect(src).toMatch(/error_class/);
  });

  it("Invariant F (Plan 19-01 regression-lock): Env interface declares DRY_RUN field for the cron-sweep DRY_RUN gate", () => {
    // Plan 19-01 added DRY_RUN to Env so chat-delivery.ts can gate the inner
    // send on env.DRY_RUN === "1". Plan 19-03 narrowed it from `string` to
    // the wrangler-generated literal `"1"` to satisfy the global
    // `Env extends Cloudflare.Env` shape at the handle(request, env, ctx)
    // call site (deferred-items.md option 2 absorption). This invariant
    // locks the field's presence regardless of which width future edits
    // settle on — the field MUST exist so deliverDue's env.DRY_RUN gate
    // continues to compile structurally.
    expect(src).toMatch(/DRY_RUN\s*:\s*(?:"1"|string)/);
  });
});
