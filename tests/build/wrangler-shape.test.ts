/**
 * FOUND-04 — wrangler.jsonc Workers Static Assets shape assertion.
 *
 * After Phase 17 Plan 02 Task 2 lands, wrangler.jsonc declares:
 *   - main = "./src/worker.ts" (the new custom entrypoint, not the bundled adapter)
 *   - assets binding ASSETS / directory ./dist/client (Workers Static Assets)
 *   - kv_namespaces declaring CHAT_KV (Phase 17 declares; Phase 18 binds + writes)
 *   - triggers.crons array (Phase 17: empty; Phase 19 sets schedule)
 *   - preview_urls: true (Workers Builds preview deploys)
 *
 * Phase 17 Plan 02 Task 1 lands this test in an INTENTIONALLY RED state —
 * the test exists to gate Task 2 (wrangler.jsonc rewrite). Task 2 makes it GREEN.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Strip JSONC line + block comments to allow JSON.parse.
function parseJsonc(src: string): unknown {
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"])\/\/.*$/gm, "$1");
  return JSON.parse(stripped);
}

describe("FOUND-04: wrangler.jsonc Workers Static Assets shape", () => {
  const cfg = parseJsonc(
    readFileSync(join(process.cwd(), "wrangler.jsonc"), "utf8"),
  ) as Record<string, unknown>;

  it("main points at ./src/worker.ts", () => {
    expect(cfg.main).toBe("./src/worker.ts");
  });

  it("assets binding=ASSETS directory=./dist/client", () => {
    expect(cfg.assets).toEqual({ binding: "ASSETS", directory: "./dist/client" });
  });

  it("declares CHAT_KV in kv_namespaces", () => {
    expect(Array.isArray(cfg.kv_namespaces)).toBe(true);
    const ns = (cfg.kv_namespaces as Array<{ binding: string }>).find(
      (n) => n.binding === "CHAT_KV",
    );
    expect(ns).toBeDefined();
  });

  it("declares triggers.crons array (Phase 17: empty; Phase 19 sets schedule)", () => {
    // Phase 17: empty array is correct. Phase 19 sets ["0 * * * *"] —
    // when that change lands, update this assertion accordingly.
    expect(cfg.triggers).toBeDefined();
    expect(Array.isArray((cfg.triggers as { crons: unknown[] }).crons)).toBe(true);
  });

  it("preview_urls is true (Workers Builds preview deploys)", () => {
    expect(cfg.preview_urls).toBe(true);
  });
});
