import { describe, it, expect } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const PROJECTS_DIR = join("src", "content", "projects");

const EXPECTED_SLUGS = [
  "clipify",
  "daytrade",
  "nfl-predict",
  "optimize-ai",
  "seatwatch",
  "solsniper",
];

describe("Projects content collection (CONT-04)", () => {
  it("contains exactly 6 MDX entries with expected slugs", async () => {
    const files = (await readdir(PROJECTS_DIR)).filter((f) =>
      f.endsWith(".mdx"),
    );
    const slugs = files.map((f) => f.replace(/\.mdx$/, "")).sort();
    expect(slugs).toEqual(EXPECTED_SLUGS);
  });

  it("exactly 3 entries are marked featured: true (homepage WorkRow count)", async () => {
    const files = (await readdir(PROJECTS_DIR)).filter((f) =>
      f.endsWith(".mdx"),
    );
    let featured = 0;
    for (const f of files) {
      const raw = await readFile(join(PROJECTS_DIR, f), "utf8");
      if (/^featured:\s*true\b/m.test(raw)) featured++;
    }
    expect(featured).toBe(3);
  });
});
