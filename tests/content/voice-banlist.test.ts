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
  // D-11 Rule 2 "Numbers or don't claim it" — each of the Don't-Write
  // entries is banned outright. Pair with a number if the claim is real.
  { name: "battle-tested", pattern: /\bbattle-tested\b/i },
  { name: "lightning fast", pattern: /\blightning fast\b/i },
  { name: "highly available", pattern: /\bhighly available\b/i },
  { name: "next-gen", pattern: /\bnext-gen\b/i },
  { name: "emoji", pattern: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u },
];

async function loadBody(slug: string): Promise<string> {
  const raw = await readFile(
    join("src", "content", "projects", `${slug}.mdx`),
    "utf8",
  );
  const norm = raw.replace(/\r\n/g, "\n");
  const fmCloseIdx = norm.indexOf("\n---\n", 4);
  return fmCloseIdx === -1 ? "" : norm.slice(fmCloseIdx + 5);
}

describe("Case-study MDX voice banlist (CONT-02 / D-11 Rule 1)", () => {
  for (const slug of PROJECTS) {
    it(`${slug}.mdx body contains no banned words or emoji`, async () => {
      let body = "";
      try {
        body = await loadBody(slug);
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

/**
 * D-11 Rule 1: "scalable" is the one asymmetric banned term — allowed
 * only when paired with a number in the same sentence (e.g., "scalable
 * to 50 concurrent users"). Enforce the asymmetric check separately so
 * the main banlist can stay a flat regex table.
 *
 * Heuristic: any occurrence of `scalable` that is NOT followed by a
 * digit before the next sentence-ending period is flagged.
 */
describe("Case-study 'scalable' numeric-pair rule (D-11 Rule 1)", () => {
  for (const slug of PROJECTS) {
    it(`${slug}.mdx: any 'scalable' is paired with a number`, async () => {
      const body = await loadBody(slug);
      const unpaired = [...body.matchAll(/\bscalable\b(?![^.]*\d)/gi)].map(
        (m) => m[0],
      );
      expect(unpaired).toEqual([]);
    });
  }
});

