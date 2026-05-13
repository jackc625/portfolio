/**
 * Plan 20-03 forward-defense: wrangler.jsonc DRY_RUN='0' phase-close state
 * + cron revert (D-01 atomic-deploy commit + Pitfall 6 inherited from Phase 19).
 *
 * Focused Phase 20 attribution sibling to tests/build/wrangler-cron-shape.test.ts
 * (Plan 19-04). Two invariants:
 *
 *   1. (D-01 / D-17) vars.DRY_RUN === '0'   — Phase 20 live-mail toggle
 *   2. (Pitfall 6) triggers.crons === ['0 * * * *']  — operator must revert the
 *      temporary `* * * * *` cron flip after UAT Step 4. This test catches the
 *      unreverted state at build time before deploy.
 *
 * Companion file `tests/build/wrangler-cron-shape.test.ts` covers the same two
 * invariants but at the Phase 19 originating-decision attribution; this file is
 * the focused Plan 20-03 attribution test (one file = one decision authorship).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseJsonc } from "./_helpers/parse-jsonc";

describe("Plan 20-03 forward-defense: wrangler.jsonc DRY_RUN='0' phase-close + cron revert (D-01 + Pitfall 6)", () => {
  const cfg = parseJsonc(
    readFileSync(join(process.cwd(), "wrangler.jsonc"), "utf8"),
  ) as Record<string, unknown>;

  it("D-01 / D-17: vars.DRY_RUN === '0' (Phase 20 live-mail toggle)", () => {
    expect(cfg.vars).toBeDefined();
    expect((cfg.vars as { DRY_RUN: string }).DRY_RUN).toBe("0");
  });

  it("Pitfall 6: triggers.crons === ['0 * * * *'] (operator forgot to revert UAT * * * * * cron flip catches here)", () => {
    expect((cfg.triggers as { crons: string[] }).crons).toEqual(["0 * * * *"]);
  });
});
