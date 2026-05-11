/**
 * Plan 17-08 Task 2-ALPHA (Rule 3 inline deviation) — DEPLOY-GATE UAT regression lock.
 *
 * On 2026-05-11 the deploy-gate manual UAT for Plan 17-08 surfaced a BLOCKING
 * regression: POST /api/chat from http://localhost:4321 returned 403 Forbidden
 * under `pnpm dev`. Root cause: `ALLOW_LOOPBACK = import.meta.env.DEV` at
 * src/lib/validation.ts:87 evaluated falsy in the @astrojs/cloudflare adapter's
 * SSR runtime during `astro dev` — the adapter does NOT statically replace
 * `import.meta.env.DEV` in SSR routes the way it does in client bundles.
 * Vitest sets DEV=true by default, so tests/api/security.test.ts passed and
 * masked the regression.
 *
 * The fix broadens ALLOW_LOOPBACK to a three-signal disjunction:
 *   - `import.meta.env.DEV === true` (Vitest + Vite client bundles)
 *   - `import.meta.env.MODE === "development"` (@astrojs/cloudflare SSR under astro dev)
 *   - `process.env.NODE_ENV === "development"` (pure-Node fallback)
 *
 * Production tree-shaking preserved: each operand is a statically-replaced
 * literal during `astro build` (DEV → false, MODE → "production",
 * NODE_ENV → "production"), so the entire ALLOW_LOOPBACK branch emits zero
 * bytes in the deployed Worker bundle. Deployed Worker continues to reject
 * Origin=http://localhost:4321 (defense-in-depth against Origin spoofing).
 *
 * This test is the STRUCTURAL LOCK: it asserts the three-signal disjunction
 * is present in source so a future contributor cannot silently revert to the
 * single-signal form and reintroduce the dev-403 regression. The RUNTIME
 * assertion (`isAllowedOrigin("http://localhost:4321") === true` under
 * Vitest DEV=true) already lives in tests/api/security.test.ts and remains
 * canonical for the dev-loopback contract.
 *
 * The companion existing-test pattern is tests/build/no-inline-display-on-chat-panel.test.ts
 * (Plan 17-08 Task 2): build-time source-text grep that catches reverts that
 * would pass behavioral tests.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(__dirname, "../..");
const src = readFileSync(
  resolve(projectRoot, "src/lib/validation.ts"),
  "utf8",
);

describe("Plan 17-08 Task 2-ALPHA: ALLOW_LOOPBACK three-signal disjunction lock", () => {
  it("validation.ts declares ALLOW_LOOPBACK exactly once", () => {
    const matches = src.match(/const\s+ALLOW_LOOPBACK\s*=/g) ?? [];
    expect(
      matches.length,
      `Expected exactly 1 declaration of ALLOW_LOOPBACK; found ${matches.length}. The constant is the sole loopback-gate seam; multiple declarations indicate a refactor that broke the dev/production tree-shaking contract.`,
    ).toBe(1);
  });

  it("ALLOW_LOOPBACK includes all three signals (DEV, MODE === \"development\", process.env.NODE_ENV === \"development\")", () => {
    // Extract the ALLOW_LOOPBACK definition body — everything from `const ALLOW_LOOPBACK =`
    // up to the first semicolon at top level. Lazy match `[\s\S]*?;` permits
    // multi-line disjunctions while bounding at the statement terminator.
    const defMatch = src.match(/const\s+ALLOW_LOOPBACK\s*=([\s\S]*?);/);
    if (!defMatch) {
      throw new Error(
        "Could not locate `const ALLOW_LOOPBACK = ...;` in src/lib/validation.ts. The file may have been refactored — update this test to match (and verify the dev-loopback contract is still defended at the new seam).",
      );
    }
    const body = defMatch[1];

    // Signal 1: import.meta.env.DEV — Vitest + Vite client bundle.
    expect(
      body,
      `ALLOW_LOOPBACK body is missing the \`import.meta.env.DEV\` signal. Body: "${body.trim()}". This signal covers Vitest (which sets DEV=true by default) and Vite-statically-replaced client bundles. See Plan 17-08 Task 2-ALPHA in validation.ts comment block.`,
    ).toMatch(/import\.meta\.env\.DEV/);

    // Signal 2: import.meta.env.MODE === "development" — @astrojs/cloudflare SSR under astro dev.
    expect(
      body,
      `ALLOW_LOOPBACK body is missing the \`import.meta.env.MODE === "development"\` signal. Body: "${body.trim()}". This signal covers @astrojs/cloudflare SSR routes under \`astro dev\` where DEV is NOT statically replaced — without this signal, POST /api/chat returns 403 Forbidden in dev (Plan 17-08 deploy-gate UAT regression 2026-05-11).`,
    ).toMatch(/import\.meta\.env\.MODE\s*===\s*["']development["']/);

    // Signal 3: process.env.NODE_ENV === "development" — pure-Node fallback.
    expect(
      body,
      `ALLOW_LOOPBACK body is missing the \`process.env.NODE_ENV === "development"\` signal. Body: "${body.trim()}". This signal covers pure-Node environments where neither import.meta.env signal is populated. See Plan 17-08 Task 2-ALPHA in validation.ts comment block.`,
    ).toMatch(/process\.env(?:\?\.|\.)NODE_ENV\s*===\s*["']development["']/);
  });

  it("ALLOW_LOOPBACK uses a disjunction (||) to combine the three signals", () => {
    const defMatch = src.match(/const\s+ALLOW_LOOPBACK\s*=([\s\S]*?);/);
    if (!defMatch) {
      throw new Error(
        "Could not locate `const ALLOW_LOOPBACK = ...;` in src/lib/validation.ts.",
      );
    }
    const body = defMatch[1];
    // At least two `||` operators are required to chain three signals.
    const orMatches = body.match(/\|\|/g) ?? [];
    expect(
      orMatches.length,
      `ALLOW_LOOPBACK body must combine the three signals with disjunction (||); found ${orMatches.length} || operator(s). A single signal would re-introduce the dev-403 regression (Plan 17-08 deploy-gate UAT 2026-05-11).`,
    ).toBeGreaterThanOrEqual(2);
  });
});
