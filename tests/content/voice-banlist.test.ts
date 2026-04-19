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

const BANLIST: Array<{ name: string; pattern: RegExp }> = [
  { name: "revolutionary", pattern: /\brevolutionary\b/i },
  { name: "seamless", pattern: /\bseamless\b/i },
  { name: "leverage", pattern: /\bleverage\b/i },
  { name: "robust", pattern: /\brobust\b/i },
  { name: "dive deeper", pattern: /\bdive deeper\b/i },
  { name: "elevate", pattern: /\belevate\b/i },
  { name: "supercharge", pattern: /\bsupercharge\b/i },
  { name: "emoji", pattern: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u },
];

describe("Case-study MDX voice banlist (CONT-02 / D-11 Rule 1)", () => {
  for (const slug of PROJECTS) {
    it(`${slug}.mdx body contains no banned words or emoji`, async () => {
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
        // File missing counts as RED — force failure with clear message
        expect.fail(`${slug}.mdx not found`);
      }
      const violations = BANLIST.filter(({ pattern }) => pattern.test(body))
        .map(({ name }) => name);
      expect(violations).toEqual([]);
    });
  }
});
