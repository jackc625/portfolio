import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * SC2 / EXP-03 / D-08 — Holloway summary + company normalization.
 *
 * Wave 0 tests-first guard. Mirrors the frontmatter/body split idiom from
 * tests/content/case-studies-shape.test.ts (indexOf("\n---\n", 4) then slice).
 *
 * Two contracts:
 *   1. holloway.mdx frontmatter — company MUST equal exactly "Holloway Company"
 *      (D-08: the leading "The" is dropped). RED until 22-03 normalizes it.
 *      role, dateRange, and a non-empty techStack must be present, and the
 *      highlights list must carry exactly 5 entries. REVIEWS 22-01 (LOW):
 *      highlights is MULTILINE flow-style YAML (a `[` on its own line, one
 *      quoted string per line, then `]`), so the count slices the block from
 *      the `highlights:` key up to the next top-level key (`engagementType:`)
 *      and counts quoted-string lines — never assuming a single-line array.
 *   2. src/pages/experience.astro source — MUST reference sortExperienceEntries
 *      and link to an `/experience/` detail path (D-05 deep-dive link). RED
 *      until 22-03 ships the listing page. A missing file yields a clear RED
 *      failure, not a thrown ENOENT that aborts the suite.
 */

const HOLLOWAY = join("src", "content", "experience", "holloway.mdx");
const EXPERIENCE_PAGE = join("src", "pages", "experience.astro");

async function readOrNull(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  const norm = raw.replace(/\r\n/g, "\n");
  const fmCloseIdx = norm.indexOf("\n---\n", 4);
  if (fmCloseIdx === -1) return { frontmatter: "", body: "" };
  return {
    frontmatter: norm.slice(0, fmCloseIdx),
    body: norm.slice(fmCloseIdx + 5),
  };
}

describe("Holloway summary + D-08 company normalization (SC2 / EXP-03)", () => {
  it("company is normalized to \"Holloway Company\" (no leading \"The\")", async () => {
    const raw = await readFile(HOLLOWAY, "utf8");
    const { frontmatter } = splitFrontmatter(raw);
    const match = frontmatter.match(/^company:\s*"([^"]*)"/m);
    expect(match, "expected a quoted company: frontmatter field").not.toBeNull();
    expect(match![1]).toBe("Holloway Company");
  });

  it("carries role, dateRange, and a non-empty techStack", async () => {
    const raw = await readFile(HOLLOWAY, "utf8");
    const { frontmatter } = splitFrontmatter(raw);

    expect(frontmatter, "role: present").toMatch(/^role:\s*"[^"]+"/m);
    expect(frontmatter, "dateRange: present").toMatch(/^dateRange:\s*"[^"]+"/m);

    // techStack is a flow-style array; assert it contains at least one quoted
    // entry (non-empty). Slice from `techStack:` to the next top-level key.
    const tsStart = frontmatter.indexOf("\ntechStack:");
    expect(tsStart, "techStack: key present").toBeGreaterThanOrEqual(0);
    const tsRest = frontmatter.slice(tsStart + 1);
    const tsEnd = tsRest.search(/\n[A-Za-z]/); // next top-level key
    const tsBlock = tsEnd === -1 ? tsRest : tsRest.slice(0, tsEnd);
    const tsEntries = (tsBlock.match(/"[^"]+"/g) ?? []).length;
    expect(tsEntries, "techStack must be non-empty").toBeGreaterThan(0);
  });

  it("highlights list contains exactly 5 entries (multiline flow YAML)", async () => {
    const raw = await readFile(HOLLOWAY, "utf8");
    const { frontmatter } = splitFrontmatter(raw);

    // Slice the highlights block from the `highlights:` key up to the next
    // top-level key (`engagementType:`). Count lines that begin, after
    // optional whitespace, with a double-quote (one quoted highlight per line).
    const hlStart = frontmatter.indexOf("\nhighlights:");
    expect(hlStart, "highlights: key present").toBeGreaterThanOrEqual(0);
    const afterHl = frontmatter.slice(hlStart + 1);
    const engIdx = afterHl.indexOf("\nengagementType:");
    const hlBlock = engIdx === -1 ? afterHl : afterHl.slice(0, engIdx);

    const entryCount = hlBlock
      .split("\n")
      .filter((line) => /^\s*"/.test(line)).length;
    expect(entryCount).toBe(5);
  });
});

describe("Experience listing page source (SC2 / D-05)", () => {
  it("references sortExperienceEntries and links to an /experience/ detail path", async () => {
    const src = await readOrNull(EXPERIENCE_PAGE);
    // RED (clean) until 22-03 ships the page: a null source fails the assertion
    // rather than throwing an uncaught ENOENT.
    expect(
      src,
      "src/pages/experience.astro should exist (shipped by 22-03)",
    ).not.toBeNull();
    if (src === null) return;

    const norm = src.replace(/\r\n/g, "\n");
    expect(norm).toContain("sortExperienceEntries");
    expect(norm, "expected a deep-dive link whose href starts with /experience/").toMatch(
      /href=["'`]?\/experience\//,
    );
  });
});
