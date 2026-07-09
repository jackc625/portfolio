import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * SC1 / EXP-02 / D-03 — Experience-FIRST nav ordering.
 *
 * Wave 0 tests-first guard. Mirrors the readFile + normalize + string-index
 * assertion idiom from tests/content/case-studies-shape.test.ts.
 *
 * For BOTH nav primitives (Header.astro and MobileMenu.astro) this asserts:
 *   1. The source declares a `href: "/experience"` nav entry whose position
 *      precedes `href: "/projects"` (D-03: experience listed FIRST).
 *   2. The source carries an isActive branch matching /experience via
 *      startsWith — i.e. both the literal "/experience" and the substring
 *      startsWith("/experience") appear.
 *
 * These assertions are RED until plan 22-02 edits the nav primitives to add
 * the /experience entry. RED is the EXPECTED pre-implementation state; 22-02
 * turns this GREEN. Assertions deliberately avoid the focus-trap script region
 * and leave no fenced literal that a later negative-grep could depend on.
 */

const NAV_PRIMITIVES = [
  join("src", "components", "primitives", "Header.astro"),
  join("src", "components", "primitives", "MobileMenu.astro"),
];

describe("Experience nav ordering (SC1 / EXP-02 / D-03)", () => {
  for (const relPath of NAV_PRIMITIVES) {
    describe(relPath, () => {
      it("declares href: \"/experience\" before href: \"/projects\"", async () => {
        const raw = await readFile(relPath, "utf8");
        const src = raw.replace(/\r\n/g, "\n");

        const experienceIdx = src.indexOf('href: "/experience"');
        const projectsIdx = src.indexOf('href: "/projects"');

        expect(
          experienceIdx,
          'expected a `href: "/experience"` nav entry (added by 22-02)',
        ).toBeGreaterThanOrEqual(0);
        expect(
          projectsIdx,
          'expected the existing `href: "/projects"` nav entry',
        ).toBeGreaterThanOrEqual(0);
        expect(
          experienceIdx,
          "experience must be listed FIRST (before projects) per D-03",
        ).toBeLessThan(projectsIdx);
      });

      it("has an isActive branch matching /experience via startsWith", async () => {
        const raw = await readFile(relPath, "utf8");
        const src = raw.replace(/\r\n/g, "\n");

        expect(src).toContain('"/experience"');
        expect(src).toContain('startsWith("/experience")');
      });
    });
  }
});
