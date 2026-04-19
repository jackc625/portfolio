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

const MIN_WORDS = 600;
const MAX_WORDS = 900;

function countWords(body: string): number {
  const stripped = body.replace(/```[\s\S]*?```/g, " ");
  const words = stripped.trim().split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

describe("Case-study MDX word count soft band 600-900 (CONT-02 / D-16)", () => {
  for (const slug of PROJECTS) {
    it(`${slug}.mdx word count is reported (soft warn only per D-16)`, async () => {
      let body = "";
      try {
        const raw = await readFile(
          join("src", "content", "projects", `${slug}.mdx`),
          "utf8",
        );
        const norm = raw.replace(/\r\n/g, "\n");
        const fmCloseIdx = norm.indexOf("\n---\n", 4);
        body = fmCloseIdx === -1 ? "" : norm.slice(fmCloseIdx + 5);
      } catch {
        console.warn(`${slug}: mdx file missing, skipping word count`);
        expect(true).toBe(true);
        return;
      }
      const words = countWords(body);
      if (words < MIN_WORDS || words > MAX_WORDS) {
        console.warn(
          `${slug}: ${words} words (out of ${MIN_WORDS}-${MAX_WORDS} band)`,
        );
      }
      expect(true).toBe(true);
    });
  }
});
