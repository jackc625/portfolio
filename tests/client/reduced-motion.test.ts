import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * QUAL-04 — prefers-reduced-motion coverage.
 *
 * The editorial design has effectively no decorative motion. The two places
 * motion is referenced in src/styles/global.css are:
 *
 *   1. html `scroll-behavior: smooth` — gated behind
 *      `@media (prefers-reduced-motion: no-preference)` so users who request
 *      reduced motion get instantaneous anchor jumps (WR-02 / WCAG 2.3.3).
 *
 *   2. `.nav-link-hover` underline grow transition — explicitly neutralized
 *      by a `@media (prefers-reduced-motion: reduce)` override that strips
 *      the transition and reverts the hover background-size growth.
 *
 * These tests lock both gates in place — any regression that introduces
 * unconditional motion or drops the reduce override will fail loudly.
 */

const projectRoot = resolve(__dirname, "../..");
const css = readFileSync(
  resolve(projectRoot, "src/styles/global.css"),
  "utf8",
);

describe("prefers-reduced-motion — smooth scroll gating (QUAL-04, WR-02)", () => {
  it("wraps `scroll-behavior: smooth` inside `@media (prefers-reduced-motion: no-preference)`", () => {
    // Multiline match: the no-preference media query precedes the html rule
    // with scroll-behavior: smooth.
    const pattern =
      /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*{\s*html\s*{\s*scroll-behavior:\s*smooth;/;
    expect(css).toMatch(pattern);
  });

  it("does NOT apply `scroll-behavior: smooth` outside the no-preference gate", () => {
    // Strip the one gated block, then assert the declaration appears nowhere else.
    const stripped = css.replace(
      /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*{[\s\S]*?}\s*}/,
      "",
    );
    expect(stripped).not.toMatch(/scroll-behavior:\s*smooth/);
  });
});

describe("prefers-reduced-motion — nav underline neutralization (QUAL-04)", () => {
  it("declares a `@media (prefers-reduced-motion: reduce)` block", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{/);
  });

  it("reduce block neutralizes the .nav-link-hover transition", () => {
    // Inside the reduce block the .nav-link-hover rule should override the
    // default `transition: background-size 300ms ease, color 200ms ease`
    // to drop the background-size animation (color-only transition remains).
    const pattern =
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{[\s\S]*?\.nav-link-hover\s*{\s*transition:\s*color\s+200ms\s+ease;/;
    expect(css).toMatch(pattern);
  });

  it("reduce block reverts .nav-link-hover:hover background-size growth", () => {
    // The hover state should NOT grow the underline when reduce is active.
    const pattern =
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{[\s\S]*?\.nav-link-hover:hover\s*{\s*background-size:\s*0%\s+1px;/;
    expect(css).toMatch(pattern);
  });
});
