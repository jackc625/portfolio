/**
 * FOUND-02 — src/worker.ts custom Worker entrypoint shape assertion.
 *
 * The Astro Cloudflare adapter's default entrypoint
 * (@astrojs/cloudflare/entrypoints/server) exports only { fetch }, which
 * cannot host a scheduled() handler. Phase 19's cron sweep depends on a
 * custom entrypoint that exports both fetch and scheduled.
 *
 * This test asserts the canonical shape of src/worker.ts so future edits
 * cannot silently drop the scheduled handler or its Phase 19 forward-compat
 * waitUntil wrapper.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("FOUND-02: src/worker.ts custom entrypoint", () => {
  const path = join(process.cwd(), "src/worker.ts");

  it("file exists", () => {
    expect(existsSync(path)).toBe(true);
  });

  const src = readFileSync(path, "utf8");

  it("imports handle from @astrojs/cloudflare/handler", () => {
    expect(src).toMatch(/import\s*\{\s*handle\s*\}\s*from\s*"@astrojs\/cloudflare\/handler"/);
  });

  it("exports default object with fetch and scheduled handlers", () => {
    expect(src).toContain("export default {");
    expect(src).toMatch(/(async\s+)?fetch\s*\(/);
    expect(src).toMatch(/(async\s+)?scheduled\s*\(/);
  });

  it("scheduled handler uses ctx.waitUntil (Phase 19 forward-compat)", () => {
    expect(src).toMatch(/ctx\.waitUntil\s*\(/);
  });

  it("file documents the Phase 19 deliverDue substitution target", () => {
    expect(src).toContain("Phase 19");
    expect(src).toContain("deliverDue");
  });
});
