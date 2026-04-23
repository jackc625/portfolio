import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const layoutSource = readFileSync(
  join(process.cwd(), "src", "layouts", "BaseLayout.astro"),
  "utf8"
);

describe("Umami analytics tag (ANAL-01 / D-01, D-02, D-03)", () => {
  it("references cloud.umami.is/script.js as the external src", () => {
    expect(layoutSource).toContain("cloud.umami.is/script.js");
  });

  it("is rendered with is:inline so Astro preserves data-* attributes verbatim", () => {
    // Multiline regex: `is:inline` and the umami src URL must live in the
    // same tag. Allows up to 200 chars between them so attribute order is
    // flexible (per 15-PLAN.md Task 1 assertion #2).
    expect(layoutSource).toMatch(
      /is:inline[\s\S]{0,200}?cloud\.umami\.is\/script\.js/
    );
  });

  it('has data-domains="jackcutrara.com" for server-side hostname filtering (D-01)', () => {
    expect(layoutSource).toContain('data-domains="jackcutrara.com"');
  });

  it("has a defer attribute for non-blocking load (D-02)", () => {
    // `defer` appears within the same tag as the umami src — match either
    // direction (defer before src OR src before defer) up to 200 chars apart.
    expect(layoutSource).toMatch(
      /defer[\s\S]{0,200}?cloud\.umami\.is|cloud\.umami\.is[\s\S]{0,200}?defer/
    );
  });

  it("commits a data-website-id attribute (D-03 — public literal, no env var)", () => {
    // Matches either JSX expression form `{WEBSITE_ID}` or bare string form
    // `"TODO_..."` — flexible to whichever shape Task 2 picks.
    expect(layoutSource).toMatch(/data-website-id=(\{[^}]+\}|"[^"]+")/);
  });

  it("is gated by import.meta.env.PROD (D-01 belt-and-suspenders — absent in dev/preview builds)", () => {
    expect(layoutSource).toMatch(/\{import\.meta\.env\.PROD\s*&&/);
  });
});

describe("BaseLayout is:inline precedent integrity", () => {
  it("does not introduce a second un-scoped is:inline for Umami (catches future drift)", () => {
    const occurrences = (layoutSource.match(/is:inline/g) ?? []).length;
    // BaseLayout currently has zero is:inline; Task 2 adds exactly one for
    // Umami. Anything > 2 signals accidental duplication.
    expect(occurrences).toBeLessThanOrEqual(2);
  });
});
