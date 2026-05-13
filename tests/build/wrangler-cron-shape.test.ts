/**
 * CRON-01 + D-01 / D-02 — wrangler.jsonc cron + DRY_RUN shape forward-defense (Plan 19-04).
 *
 * Source-text guard locking two invariants:
 *   1. triggers.crons === ["0 * * * *"]      — hourly cron expression locked
 *   2. vars.DRY_RUN === "0"                  — Phase 20 live-mail toggle (D-01)
 *
 * Plan 20-03 (2026-05-12) updated invariant 2 from "1" to "0" at the same
 * commit as the wrangler.jsonc flip. The DRY_RUN === "1" branch in
 * src/lib/chat-delivery.ts sendOne stays in source as the rollback runway
 * (D-03) — a single-line wrangler.jsonc revert from "0" back to "1" reverts
 * all Phase 20 behavior without source edit.
 *
 * Pitfall 6 defense: the 19-UAT.md Step 1 operator manually flips
 * triggers.crons to ["* * * * *"] for ~90s to confirm Past Events in the
 * Cloudflare dashboard, then reverts. If the operator forgets to revert,
 * this build-time test fails on the next `pnpm test` or CI run BEFORE
 * the runaway every-minute cron burns through Free-tier quota.
 *
 * The companion file tests/build/wrangler-shape.test.ts (FOUND-04 anchor)
 * holds the broader wrangler.jsonc shape; this file is the focused
 * CRON-01 / D-01 attribution test.
 *
 * Per 19-PATTERNS.md "tests/build/wrangler-cron-shape.test.ts" section
 * (lines 627-672) — parseJsonc originally copied verbatim from
 * wrangler-shape.test.ts. WR-05 / WR-06 (Phase 19 code review) extracted
 * the duplicated helper to a shared module so future fixes propagate
 * automatically; the helper also switched from a naive regex to a
 * string-literal-aware tokenizer.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseJsonc } from "./_helpers/parse-jsonc";

describe("CRON-01 + D-01: wrangler.jsonc cron + DRY_RUN shape", () => {
  const cfg = parseJsonc(
    readFileSync(join(process.cwd(), "wrangler.jsonc"), "utf8"),
  ) as Record<string, unknown>;

  it("CRON-01: triggers.crons is exactly ['0 * * * *'] (Pitfall 6 anti-wildcard-cron-leak)", () => {
    // WR-08 (Phase 19 code review) — replaced the censored `anti-*****-leak`
    // placeholder. The `*****` was the literal cron expression `* * * * *`
    // (every-minute wildcard) and the test exists to prevent that UAT-only
    // expression from leaking into production -- where it would burn through
    // Free-tier cron quota and re-trigger the sweep every minute.
    //
    // Forward-defense: operator UAT Step 1 flips this to ['* * * * *'] briefly.
    // Build-time fail catches the unreverted state before deploy.
    expect((cfg.triggers as { crons: string[] }).crons).toEqual(["0 * * * *"]);
  });

  it("D-01 / D-02: vars.DRY_RUN === '0' (Phase 20 live-mail toggle per D-01)", () => {
    expect(cfg.vars).toBeDefined();
    expect((cfg.vars as { DRY_RUN: string }).DRY_RUN).toBe("0");
  });
});
