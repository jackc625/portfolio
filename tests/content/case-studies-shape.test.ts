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

const EXPECTED_H2S = [
  "Problem",
  "Approach & Architecture",
  "Tradeoffs",
  "Outcome",
  "Learnings",
];

describe("Case-study MDX H2 shape (CONT-02 / D-01)", () => {
  for (const slug of PROJECTS) {
    it(`${slug}.mdx has exactly 5 H2s in the locked order`, async () => {
      const raw = await readFile(
        join("src", "content", "projects", `${slug}.mdx`),
        "utf8",
      );
      const norm = raw.replace(/\r\n/g, "\n");
      const fmCloseIdx = norm.indexOf("\n---\n", 4);
      const body = fmCloseIdx === -1 ? "" : norm.slice(fmCloseIdx + 5);
      const matches = body.match(/^## (.+)$/gm) ?? [];
      const actual = matches.map((s) => s.slice(3).trim());
      expect(actual).toEqual(EXPECTED_H2S);
    });
  }
});
