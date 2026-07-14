import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Gate E (D-19 tripwire) — fast per-plan source guard over BaseLayout.astro.
 *
 * Phase 24 must NOT touch the chat surface / SEO head / client-script wiring in
 * src/layouts/BaseLayout.astro. This gate is a readFileSync source-scan (node
 * env) that asserts the canonical anchors still exist. It is intentionally
 * strengthened beyond the four SEO anchors (review fix #6): it also pins the
 * ChatWidget import + render, the pageswap `.finished?.catch` handler, and the
 * three client-script import specifiers, so an accidental edit to the chat
 * widget / view-transition handler / analytics-scroll-motion wiring trips it too.
 *
 * NOTE: this is a fast tripwire, not the authoritative proof. The AUTHORITATIVE
 * phase-wide D-19/D-17 "untouched across the phase" proof is the SHA-256 baseline
 * comparison in scripts/verify-phase24-invariants.mjs, run at the 24-04 capstone
 * against .planning/phases/24-.../24-BASELINE.json (catches drift committed in
 * any task, not only the current working tree).
 */

const BASE_LAYOUT = join("src", "layouts", "BaseLayout.astro");

const ANCHORS: { label: string; needle: string }[] = [
  { label: "OG default image path", needle: 'ogImage = "/og-default.png"' },
  {
    label: "SEO titleDefault",
    needle: 'titleDefault="Jack Cutrara | Software Engineer"',
  },
  { label: "OG image width", needle: "width: 1200" },
  { label: "OG image height", needle: "height: 630" },
  { label: "ChatWidget import", needle: "import ChatWidget" },
  { label: "ChatWidget render", needle: "<ChatWidget />" },
  {
    label: "pageswap listener",
    needle: 'window.addEventListener("pageswap"',
  },
  {
    label: "view-transition finished catch guard",
    needle: "e.viewTransition?.finished?.catch",
  },
  { label: "analytics client script import", needle: "../scripts/analytics.ts" },
  {
    label: "scroll-depth client script import",
    needle: "../scripts/scroll-depth.ts",
  },
  { label: "motion client script import", needle: "../scripts/motion.ts" },
];

describe("Gate E (D-19): BaseLayout.astro chat surface untouched", () => {
  const src = readFileSync(BASE_LAYOUT, "utf8");

  for (const { label, needle } of ANCHORS) {
    it(`retains ${label}`, () => {
      expect(
        src.includes(needle),
        `BaseLayout.astro no longer contains the ${label} anchor (${needle}). Phase 24 must not touch this file (D-19).`,
      ).toBe(true);
    });
  }
});
