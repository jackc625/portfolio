/**
 * Plan 20-03 forward-defense: src/lib/chat-delivery.ts sendOne substitution
 * + DRY_RUN='1' rollback runway preservation (D-03).
 *
 * Source-text guard mirroring tests/build/append-turn-call-site.test.ts (Plan
 * 18-07 pattern) — readFileSync the source file and assert source-text
 * invariants via regex / substring. Five invariants:
 *
 *   A. sendOne imports sendEmail from ./email/resend
 *   B. sendOne imports renderEmail from ./email/render
 *   C. Phase 19 throw stub `send_not_implemented_in_phase_19` is GONE
 *   D. (D-03 rollback runway) DRY_RUN === "1" branch STILL PRESENT
 *   E. (D-03 rollback runway) chat.delivery.dry_run envelope log STILL PRESENT
 *
 * The rollback runway invariants (D + E) are load-bearing: a future cleanup PR
 * that removes the DRY_RUN branch as "unreachable in production" would break
 * the single-line wrangler.jsonc revert mechanism (D-03). This test fails RED
 * if either disappears.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Plan 20-03 forward-defense: src/lib/chat-delivery.ts sendOne substitution wired + DRY_RUN='1' rollback runway preserved (D-03)", () => {
  const src = readFileSync(
    join(process.cwd(), "src/lib/chat-delivery.ts"),
    "utf8",
  );

  it("Invariant A: sendOne imports sendEmail from ./email/resend", () => {
    expect(src).toMatch(
      /import\s*\{[^}]*\bsendEmail\b[^}]*\}\s*from\s*['"]\.\/email\/resend['"]/,
    );
  });

  it("Invariant B: sendOne imports renderEmail from ./email/render", () => {
    expect(src).toMatch(
      /import\s*\{[^}]*\brenderEmail\b[^}]*\}\s*from\s*['"]\.\/email\/render['"]/,
    );
  });

  it("Invariant C: Phase 19 throw stub is GONE", () => {
    // The literal error string from the Phase 19 throw stub. Plan 20-03 Task 2
    // replaces it with the Resend wrapper substitution; this assertion fails
    // if a future regression re-introduces the throw stub.
    expect(src).not.toContain("send_not_implemented_in_phase_19");
  });

  it("Invariant D (D-03 rollback runway): DRY_RUN === '1' branch STILL PRESENT", () => {
    // The literal `if (env.DRY_RUN === "1")` form is the rollback runway gate.
    // A single-line wrangler.jsonc revert from "0" to "1" reverts all Phase 20
    // behavior without source code edit — but only if this branch remains.
    expect(src).toMatch(/if\s*\(\s*env\.DRY_RUN\s*===\s*['"]1['"]\s*\)/);
  });

  it("Invariant E (D-03 rollback runway): chat.delivery.dry_run envelope log STILL PRESENT", () => {
    // The Phase 19 envelope log under the DRY_RUN='1' branch. Operator can
    // verify the rollback runway is alive in production via
    // `wrangler tail --search "chat.delivery.dry_run"`.
    expect(src).toContain("chat.delivery.dry_run");
  });
});
