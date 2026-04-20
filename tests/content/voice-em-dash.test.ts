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

const MAX_EM_DASHES_PER_PARAGRAPH = 2;

/**
 * D-11 Rule 1 (em-dash abuse):
 *   "prefer paired em-dashes (open/close); avoid three or more in a single paragraph"
 *
 * House style allows a single pair of em-dashes (open + close) inside a
 * paragraph. Three or more em-dashes in one paragraph signals hype / AI-tells
 * cadence and must be rewritten with commas, semicolons, periods, or parens.
 *
 * This test enforces the relaxed cap on every shipped case study body
 * (post-frontmatter). Code fences are NOT stripped — em-dashes inside
 * inline code should count too (none today).
 */
describe("Case-study em-dash cap (D-11 Rule 1)", () => {
  for (const slug of PROJECTS) {
    it(`${slug}.mdx: no paragraph has more than ${MAX_EM_DASHES_PER_PARAGRAPH} em-dashes`, async () => {
      const raw = await readFile(
        join("src", "content", "projects", `${slug}.mdx`),
        "utf8",
      );
      const norm = raw.replace(/\r\n/g, "\n");
      const fmCloseIdx = norm.indexOf("\n---\n", 4);
      const body = fmCloseIdx === -1 ? "" : norm.slice(fmCloseIdx + 5);

      // Split on blank-line paragraph boundaries. Skip H2 headings — they
      // don't carry em-dashes in practice and the cap is about prose cadence.
      const paragraphs = body
        .split(/\n\n+/)
        .filter((p) => p.trim().length > 0 && !p.startsWith("## "));

      const offenders = paragraphs
        .map((p, i) => ({
          index: i,
          count: (p.match(/\u2014/g) ?? []).length,
          preview: p.slice(0, 80).replace(/\n/g, " "),
        }))
        .filter((x) => x.count > MAX_EM_DASHES_PER_PARAGRAPH);

      expect(offenders).toEqual([]);
    });
  }
});
