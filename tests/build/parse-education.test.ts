/**
 * Unit tests for the Phase 25 / CHAT-10 corpus-engine helpers (25-03 Task 1).
 *
 * Exercises the three pure, exported helpers added to
 * scripts/build-chat-context.mjs:
 *   - parseEducation(sourceContent)       — SSoT education reader (D-07)
 *   - parseExperienceEntry(fmBlock, slug) — fail-closed field validator (D-09)
 *   - isReservedProjects7Source(src,slug) — #7 reservation predicate (D-04)
 *
 * The education assertion compares the parsed object against the IMPORTED
 * education.ts exports (the SSoT relationship) — a build script that hard-coded
 * the same literals would still pass a literal test; comparing against imports
 * proves the chat education can never silently drift from education.ts.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  parseEducation,
  parseExperienceEntry,
  isReservedProjects7Source,
} from "../../scripts/build-chat-context.mjs";
import { sliceFrontmatter } from "../../scripts/sync-projects.mjs";
import { EDUCATION, CREDENTIALS } from "../../src/data/education";

const projectRoot = resolve(__dirname, "../..");
const educationSource = readFileSync(
  resolve(projectRoot, "src/data/education.ts"),
  "utf8"
);
const hollowayMdx = readFileSync(
  resolve(projectRoot, "src/content/experience/holloway.mdx"),
  "utf8"
);
const balfourMdx = readFileSync(
  resolve(projectRoot, "src/content/experience/balfour-beatty.mdx"),
  "utf8"
);

describe("parseEducation — SSoT reader (D-07)", () => {
  it("returns an object DEEP-EQUAL to the imported EDUCATION/CREDENTIALS exports", () => {
    const parsed = parseEducation(educationSource);
    expect(parsed).toEqual({
      degree: EDUCATION.degree,
      school: EDUCATION.institution,
      graduation: EDUCATION.date,
      transferredFrom: EDUCATION.transferredFrom,
      certifications: CREDENTIALS.map((c) => c.name),
    });
  });

  it("throws a NAMED error (mentions education.ts + the missing key) when `date:` is removed", () => {
    // Strip the `date:` line from the EDUCATION block only.
    const mangled = educationSource.replace(/^\s*date:.*$/m, "");
    expect(() => parseEducation(mangled)).toThrow(/education\.ts/);
    expect(() => parseEducation(mangled)).toThrow(/date/);
  });
});

describe("parseExperienceEntry — fail-closed field validator (D-09)", () => {
  it("returns {role,company,dateRange,summary,startDate} with summary = chatSummary (Holloway)", () => {
    const { frontmatterBlock } = sliceFrontmatter(hollowayMdx);
    const entry = parseExperienceEntry(frontmatterBlock, "holloway");
    expect(entry.role).toBe("Software Engineer, Contract");
    expect(entry.company).toBe("Holloway Company");
    expect(entry.dateRange).toBe("May 2026 – Present");
    expect(entry.startDate).toBe("2026-05");
    expect(entry.summary).toMatch(/^Jack is the solo contract engineer/);
    // summary is the chatSummary, NOT the first-person `summary` field
    expect(entry.summary).not.toMatch(/^I'm/);
  });

  it("parses the Balfour entry (third-person chatSummary)", () => {
    const { frontmatterBlock } = sliceFrontmatter(balfourMdx);
    const entry = parseExperienceEntry(frontmatterBlock, "balfour-beatty");
    expect(entry.company).toBe("Balfour Beatty");
    expect(entry.summary).toMatch(/^Jack interned/);
  });

  it("throws a named error mentioning chatSummary when chatSummary is missing", () => {
    const { frontmatterBlock } = sliceFrontmatter(balfourMdx);
    const stripped = frontmatterBlock.replace(/^chatSummary:.*$/m, "");
    expect(() => parseExperienceEntry(stripped, "balfour-beatty")).toThrow(
      /chatSummary/
    );
  });

  it("throws a named error mentioning role when role is missing", () => {
    const { frontmatterBlock } = sliceFrontmatter(hollowayMdx);
    const stripped = frontmatterBlock.replace(/^role:.*$/m, "");
    expect(() => parseExperienceEntry(stripped, "holloway")).toThrow(/role/);
  });
});

describe("isReservedProjects7Source — #7 reservation predicate (D-04)", () => {
  it("true when source matches MULTI-DEX and slug is not multi-chain-evm", () => {
    expect(
      isReservedProjects7Source(
        "Projects/7 - MULTI-DEX CRYPTO TRADER.md",
        "other-slug"
      )
    ).toBe(true);
  });

  it("false when the reserved source belongs to the canonical multi-chain-evm slug", () => {
    expect(
      isReservedProjects7Source(
        "Projects/7 - MULTI-DEX CRYPTO TRADER.md",
        "multi-chain-evm"
      )
    ).toBe(false);
  });

  it("false for an unrelated project source", () => {
    expect(
      isReservedProjects7Source("Projects/1 - SEATWATCH.md", "seatwatch")
    ).toBe(false);
  });
});
