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
    // invocation" at runtime. The regex patterns below are built dynamically
    // (string-concatenated RegExp source) so this test file itself contains
    // no literal occurrence of the anti-pattern — keeps the source-text
    // self-scan verification clean and ensures this file does NOT self-match.
    //
    // WR-07 (Phase 19 code review) — broaden coverage. The previous pattern
    // matched only the exact phrasing `const { waitUntil } = ctx`. Equivalent
    // anti-patterns that ALSO lose the `this` binding slipped past:
    //   - let { waitUntil } = ctx;
    //   - var { waitUntil } = ctx;
    //   - const { waitUntil: alias } = ctx;
    //   - const { waitUntil, ...rest } = ctx;
    //   - const w = ctx.waitUntil; w(...);   (function-reference extraction)
    //
    // Two patterns cover the space:
    //   1. Any destructuring of waitUntil from ctx (matches all let/const/var
    //      forms plus aliases and rest-spreads — the `[^}]*` permissive class
    //      around the waitUntil identifier accommodates aliasing and other
    //      destructured siblings).
    //   2. Bare function-reference extraction (`ctx.waitUntil` not immediately
    //      followed by `(` — the call form is fine; assigning the reference
    //      to a name is the anti-pattern).
    const destructurePattern = new RegExp(
      [
        "(?:const|let|var)", "\\s*", "\\{", "[^}]*", "\\b", "waitUntil", "\\b", "[^}]*", "\\}", "\\s*", "=", "\\s*", "ctx", "\\b",
      ].join(""),
    );
    expect(src).not.toMatch(destructurePattern);

    // Function-reference extraction — `ctx.waitUntil` followed by anything
    // that ISN'T a call. The call form (`ctx.waitUntil(...)`) is the canonical
    // pattern and must remain matchable.
    const functionRefPattern = /\bctx\s*\.\s*waitUntil\s*(?!\()/;
    // Filter false positives: comments and JSDoc may legitimately reference
    // `ctx.waitUntil` in prose. We require the match to NOT be preceded by
    // common comment markers on the same logical token.
    const lines = src.split("\n");
    for (const line of lines) {
      // Skip lines that are comments (start with // optionally after whitespace,
      // or start with * which is a continuation of a JSDoc/block comment).
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
      // Also strip everything after a line-comment marker on a code line so we
      // do not flag `foo(); // ctx.waitUntil prose` falsely.
      const codeOnly = line.split("//")[0];
      expect(codeOnly).not.toMatch(functionRefPattern);
    }
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
