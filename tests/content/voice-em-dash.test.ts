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

const MAX_EM_DASHES_PER_PARAGRAPH = 0;

/**
 * D-11 Rule 1 (em-dash ban):
 *   "Zero em dashes in case-study body prose. Use commas, semicolons, periods,
 *   or parens. Em dashes are an AI-tells cadence and are not allowed."
 *
 * Updated 2026-05-13 from a ≤2 paragraph cap to a hard zero. The cap variable
 * stays for future flexibility but the locked value is 0.
 */
describe("Case-study em-dash cap (D-11 Rule 1)", () => {
  for (const slug of PROJECTS) {
    it(`${slug}.mdx: zero em-dashes in body paragraphs`, async () => {
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
