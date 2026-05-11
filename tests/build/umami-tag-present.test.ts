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
  it("does not introduce extra un-scoped is:inline scripts beyond the documented set (catches future drift)", () => {
    const occurrences = (layoutSource.match(/is:inline/g) ?? []).length;
    // Documented is:inline string occurrences in BaseLayout.astro:
    //   1. Phase 15 Umami analytics tag (`<script is:inline defer src=".../script.js" ...>`)
    //   2. Phase 17 Plan 17-10 pageswap handler (`<script is:inline>...pageswap.../<script>`)
    //      — UAT Gap #4 closure; consumes the implicit @view-transition AbortError.
    //      See design-system/MOTION.md §5 MOTN-01 rejection-handling contract +
    //      .planning/debug/view-transition-aborterror.md.
    //   3. The body-end comment block prose `(NOT is:inline)` which documents the
    //      processed analytics/scroll/motion <script> intentionally NOT being is:inline.
    // Total documented occurrences: 3. Anything > 3 signals accidental duplication.
    expect(occurrences).toBeLessThanOrEqual(3);
  });
});
