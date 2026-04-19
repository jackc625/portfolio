import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const PROJECTS = [
  "clipify",
  "daytrade",
  "nfl-predict",
  "optimize-ai",
  "seatwatch",
  "solsniper",
];

describe("Case-study MDX bodies have real content (CONT-01)", () => {
  for (const slug of PROJECTS) {
    it(`${slug}.mdx body is non-empty after frontmatter`, async () => {
      const raw = await readFile(
        join("src", "content", "projects", `${slug}.mdx`),
        "utf8",
      );
      const norm = raw.replace(/\r\n/g, "\n");
      const fmCloseIdx = norm.indexOf("\n---\n", 4);
      const body = fmCloseIdx === -1 ? "" : norm.slice(fmCloseIdx + 5);
      expect(body.trim().length).toBeGreaterThan(0);
    });
  }
});
