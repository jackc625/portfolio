import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Phase 16 Motion Layer — source-text invariants for the WorkRow arrow upgrade.
 *
 * Wave 0 RED stubs. Plan 06 lands the actual `.work-arrow` motion rules.
 *
 * Test tier: build (pure node + readFileSync — no jsdom).
 */

const projectRoot = resolve(__dirname, "../..");
const source = readFileSync(
  resolve(projectRoot, "src/components/primitives/WorkRow.astro"),
  "utf8",
);

describe("Phase 16 WorkRow arrow upgrade (MOTN-03)", () => {
  it("`.work-arrow` declares `transition: opacity 120ms ease, transform 180ms ease-out`", () => {
    const pattern = /\.work-arrow\s*{[\s\S]*?transition:\s*opacity\s+120ms\s+ease,\s*transform\s+180ms\s+ease-out/;
    expect(source).toMatch(pattern);
  });

  it("`.work-arrow` keeps `opacity: 0` resting state", () => {
    expect(source).toMatch(/\.work-arrow\s*{[\s\S]*?opacity:\s*0/);
  });

  it("`.work-arrow` keeps `color: var(--accent)` (regression guard for accent reservation list)", () => {
    expect(source).toMatch(/\.work-arrow\s*{[\s\S]*?color:\s*var\(--accent\)/);
  });

  it("hover/focus rule applies `transform: translateX(4px)` and `opacity: 1`", () => {
    const pattern = /\.work-row:hover\s+\.work-arrow,\s*\.work-row:focus-visible\s+\.work-arrow\s*{[\s\S]*?opacity:\s*1[\s\S]*?transform:\s*translateX\(4px\)/;
    expect(source).toMatch(pattern);
  });

  it("`@media (prefers-reduced-motion: reduce)` block neutralizes arrow translateX + keeps opacity 0", () => {
    const pattern = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{[\s\S]*?\.work-arrow[\s\S]*?transform:\s*translateX\(0\)[\s\S]*?opacity:\s*0/;
    expect(source).toMatch(pattern);
  });

  it("title underline rules at hover/focus selector are preserved (MASTER.md §7.1 affordance)", () => {
    expect(source).toMatch(/\.work-row:hover\s+\.work-title[\s\S]*?text-decoration:\s*underline/);
    expect(source).toMatch(/text-decoration-color:\s*var\(--accent\)/);
  });
});
