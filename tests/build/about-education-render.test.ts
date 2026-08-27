// @vitest-environment jsdom
/**
 * POS-03 render regression gate (Phase 24) — the built /about HTML must present
 * the dedicated Education/credentials block with all three visible education
 * facts, and the block must carry no accent affordance (it is non-interactive
 * content, MASTER 7). Also asserts two positive POS-01/02 register claims in
 * the rendered About body (in-progress degree + full-time search) so the
 * positioning shift is proven at rendered output, not just a source-copy gate
 * (review fix #6 + LOW positive assertions).
 *
 * Why parse the built DOM (not the source or a substring): the facts flow from
 * src/data/education.ts through about.astro at build time; asserting them from
 * dist/client/about/index.html proves the block actually renders the SSoT
 * values on the visible page, catching a silent wiring break the source-copy
 * gate would miss.
 *
 * This test depends on `dist/` existing — it runs against a fresh build at the
 * task boundary and the Plan 04 phase gate (`pnpm build`). If `dist/` is
 * missing, the first assertion surfaces the dependency cleanly.
 *
 * Test tier: build (reads dist/ output; parses with the jsdom-env DOMParser).
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Astro's Cloudflare adapter emits static pages under dist/client/.
const ABOUT_HTML = join(process.cwd(), "dist", "client", "about", "index.html");

describe("POS-03: /about Education block render gate", () => {
  let distExists = false;
  let doc: Document;
  let bodyText = "";

  beforeAll(() => {
    distExists = existsSync(ABOUT_HTML);
    if (!distExists) return;
    const html = readFileSync(ABOUT_HTML, "utf8");
    doc = new DOMParser().parseFromString(html, "text/html");
    bodyText = doc.body.textContent ?? "";
  });

  it("built /about HTML exists (run after `pnpm build`)", () => {
    expect(
      distExists,
      `${ABOUT_HTML} does not exist — run \`pnpm build\` first`,
    ).toBe(true);
  });

  it("renders all three visible education facts", () => {
    if (!distExists) return;
    for (const fact of [
      "Western Governors University",
      "Expected September 2026",
      "LPI Linux Essentials",
    ]) {
      expect(bodyText, `expected /about to render "${fact}"`).toContain(fact);
    }
  });

  it("the Education block carries no accent affordance (non-interactive)", () => {
    if (!distExists) return;
    const block = doc.querySelector(".education");
    expect(block, "expected a .education block in the rendered /about").not.toBeNull();
    // No links or buttons inside the block => no interactive/accent target
    // (MASTER 7: only clickable affordances may carry accent).
    expect(block!.querySelectorAll("a, button").length).toBe(0);
  });

  it("renders the POS-01/02 positive claims in the About body", () => {
    if (!distExists) return;
    expect(bodyText).toContain("finishing my B.S. in Computer Science");
    expect(bodyText).toContain("full-time software engineering role");
  });
});
