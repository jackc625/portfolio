// @vitest-environment jsdom
/**
 * SC2 render gate (Phase 23 / PROJ-02) — the built /projects HTML must present
 * the asymmetric two-tier layout: exactly 3 featured rows carry a rendered
 * tagline line, and all 7 rows are numbered continuously 01 through 07.
 *
 * Why parse the DOM (not substring-match): component-scoped styles live inline
 * beside markup in WorkRow.astro, so the bare token `work-tagline` appears in
 * the emitted <style> block too. A naive substring count would be satisfied by
 * the scoped-style rules rather than real rows. We parse the built HTML into a
 * real document (the jsdom vitest environment's DOMParser — no extra dep) and
 * count real ELEMENTS carrying the class; only the 3 featured rows qualify (F7).
 *
 * This test depends on `dist/` existing — it runs against a fresh build at the
 * Plan 04 phase gate (`pnpm build`). If `dist/` is missing, the first assertion
 * surfaces the dependency cleanly rather than failing opaquely on a file read.
 *
 * Test tier: build (reads dist/ output; parses with the jsdom-env DOMParser).
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Astro's Cloudflare adapter emits static pages under dist/client/.
const PROJECTS_HTML = join(process.cwd(), "dist", "client", "projects", "index.html");

describe("SC2 (PROJ-02): /projects two-tier featured render gate", () => {
  let distExists = false;
  let doc: Document;

  beforeAll(() => {
    distExists = existsSync(PROJECTS_HTML);
    if (!distExists) return;
    const html = readFileSync(PROJECTS_HTML, "utf8");
    doc = new DOMParser().parseFromString(html, "text/html");
  });

  it("built /projects HTML exists (run after `pnpm build`)", () => {
    expect(
      distExists,
      `${PROJECTS_HTML} does not exist — run \`pnpm build\` first`,
    ).toBe(true);
  });

  it("renders exactly 3 elements carrying the .work-tagline class (featured tier)", () => {
    if (!distExists) return;
    const taglines = doc.querySelectorAll("p.work-tagline");
    expect(taglines.length).toBe(3);
  });

  it("renders exactly 7 work rows numbered continuously 01 through 07", () => {
    if (!distExists) return;
    const nums = Array.from(doc.querySelectorAll(".work-row .work-num")).map(
      (el) => (el.textContent ?? "").trim(),
    );
    expect(nums).toEqual(["01", "02", "03", "04", "05", "06", "07"]);
  });

  it("the 3 tagged rows are the first 3 (featured 01-03) and the rest carry no tagline", () => {
    if (!distExists) return;
    const rows = Array.from(doc.querySelectorAll("a.work-row"));
    expect(rows.length).toBe(7);
    const tagged = rows.map((row) => row.querySelector("p.work-tagline") !== null);
    expect(tagged).toEqual([true, true, true, false, false, false, false]);
  });
});
