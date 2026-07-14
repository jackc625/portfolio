import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Gate A — site-copy em-dash + register guard (D-18; Phase 24 review fix #1).
 *
 * The MDX-only voice gates (voice-em-dash.test.ts, experience-voice-em-dash.
 * test.ts) hardcode `src/content/**` MDX paths and never scan the src/data/*
 * copy modules or the page sources. This gate closes exactly that scope gap:
 * it source-scans the five NON-MDX copy surfaces the Phase 24 positioning shift
 * touches and asserts the site-wide zero-em-dash ban (U+2014) holds there too
 * (en dash U+2013 is permitted for date ranges).
 *
 * Authored HERE at the 24-04 capstone, not at 24-01: these five files are owned
 * across the parallel 24-02 (Home teaser / index.astro / ContactSection) and
 * 24-03 (about.ts / education.ts / about.astro) plans, and only once BOTH have
 * landed are all five clean. Authoring the gate at the point where it is GREEN
 * at its own boundary avoids an intentionally-RED gate (review fix #1).
 *
 * Failure messages name the offending file, mirroring the
 * experience-voice-em-dash.test.ts style.
 */

const EM_DASH = /—/g; // U+2014 only. En dash U+2013 is allowed.

/** Every non-MDX copy surface the positioning shift edits (D-18 scan set). */
const COPY_FILES = [
  join("src", "data", "about.ts"),
  join("src", "data", "education.ts"),
  join("src", "pages", "index.astro"),
  join("src", "pages", "about.astro"),
  join("src", "components", "ContactSection.astro"),
];

/**
 * D-07 honest-new-grad register: the site must not self-apply a seniority
 * qualifier. Applied to the copy sources that carry the About narrative + Home
 * positioning strings.
 */
const REGISTER_BANLIST: Array<{ name: string; pattern: RegExp }> = [
  { name: "junior", pattern: /\bjunior\b/i },
  { name: "senior", pattern: /\bsenior\b/i },
  { name: "5+ years", pattern: /\b5\+\s*years\b/i },
];

const REGISTER_FILES = [
  join("src", "data", "about.ts"),
  join("src", "pages", "about.astro"),
  join("src", "pages", "index.astro"),
];

describe("Gate A — site-copy em-dash ban (D-18 / review fix #1)", () => {
  for (const relPath of COPY_FILES) {
    it(`${relPath}: zero em-dashes (U+2014)`, () => {
      const src = readFileSync(relPath, "utf8");
      const count = (src.match(EM_DASH) ?? []).length;
      expect(
        count,
        `unexpected em dash (U+2014) in ${relPath} — use an en dash (U+2013) or rewrite`,
      ).toBe(0);
    });
  }
});

describe("Gate A — site-copy register ban (D-07)", () => {
  for (const relPath of REGISTER_FILES) {
    it(`${relPath}: no self-applied seniority qualifier`, () => {
      const src = readFileSync(relPath, "utf8");
      const violations = REGISTER_BANLIST.filter(({ pattern }) =>
        pattern.test(src),
      ).map(({ name }) => name);
      expect(
        violations,
        `banned register word(s) in ${relPath}: ${violations.join(", ")}`,
      ).toEqual([]);
    });
  }
});
