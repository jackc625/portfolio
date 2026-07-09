import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * SC5e — Experience em-dash guard (D-11 Rule 1 extended to the experience
 * surface). Zero em dashes (U+2014) in experience mdx body prose and, once
 * they exist, in the two new experience page sources.
 *
 * NEW file — mirrors the paragraph-split + `—` count idiom of the LOCKED
 * tests/content/voice-em-dash.test.ts WITHOUT modifying it (that file hardcodes
 * the 6 project slugs and is flagged cross-phase-fragile in STATE).
 *
 * En dashes (U+2013) are permitted (e.g. "May 2026 – Present", date ranges);
 * only U+2014 is banned. GREEN in Wave 1 against current content, and tightens
 * automatically once 22-03/22-04 ship the pages (catches an em dash slipping
 * into a new meta-description string — the UI-SPEC copy table line 103 shows an
 * em dash that is a transcription error superseded by the zero-em-dash rule;
 * the correct meta uses an en dash). Page assertions are skipped gracefully
 * while the files are absent so this file stays GREEN pre-implementation.
 */

const EM_DASH = /—/g;
const MAX_EM_DASHES_PER_PARAGRAPH = 0;

const EXPERIENCE_MDX = [
  join("src", "content", "experience", "holloway.mdx"),
  join("src", "content", "experience", "balfour-beatty.mdx"),
];

const EXPERIENCE_PAGES = [
  join("src", "pages", "experience.astro"),
  join("src", "pages", "experience", "[id].astro"),
];

async function readOrNull(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

describe("Experience mdx em-dash ban (SC5e / D-11 Rule 1)", () => {
  for (const relPath of EXPERIENCE_MDX) {
    it(`${relPath}: zero em-dashes in body paragraphs`, async () => {
      const raw = await readFile(relPath, "utf8");
      const norm = raw.replace(/\r\n/g, "\n");
      const fmCloseIdx = norm.indexOf("\n---\n", 4);
      const body = fmCloseIdx === -1 ? "" : norm.slice(fmCloseIdx + 5);

      // Split on blank-line paragraph boundaries; skip H2 headings.
      const paragraphs = body
        .split(/\n\n+/)
        .filter((p) => p.trim().length > 0 && !p.startsWith("## "));

      const offenders = paragraphs
        .map((p, i) => ({
          index: i,
          count: (p.match(EM_DASH) ?? []).length,
          preview: p.slice(0, 80).replace(/\n/g, " "),
        }))
        .filter((x) => x.count > MAX_EM_DASHES_PER_PARAGRAPH);

      expect(offenders).toEqual([]);
    });
  }
});

describe("Experience page source em-dash ban (SC5e — meta copy guard)", () => {
  for (const relPath of EXPERIENCE_PAGES) {
    it(`${relPath}: zero em-dashes in source (skipped until file exists)`, async () => {
      const src = await readOrNull(relPath);
      if (src === null) {
        // Not shipped yet — GREEN in Wave 1, tightens once the page ships.
        return;
      }
      const count = (src.match(EM_DASH) ?? []).length;
      expect(count, `unexpected em dash in ${relPath} — use an en dash`).toBe(0);
    });
  }
});
