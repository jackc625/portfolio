import { describe, it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * SC3 / SC4 / EXP-04 / EXP-05 — Detail-route filter contract.
 *
 * Wave 0 tests-first guard. Mirrors the readdir + per-file frontmatter regex
 * idiom from tests/content/projects-collection.test.ts.
 *
 * Two contracts:
 *   1. CONTENT (structural EXP-05 guarantee) — over src/content/experience,
 *      the set of ids whose `hasCaseStudy: true` MUST equal exactly
 *      ["holloway"], and balfour-beatty MUST be excluded. This mirrors the
 *      filter `entries.filter((e) => e.data.hasCaseStudy)` that getStaticPaths
 *      will use. This assertion passes against the current collection.
 *   2. SOURCE (D-02) — src/pages/experience/[id].astro MUST filter on
 *      hasCaseStudy inside getStaticPaths (source includes `hasCaseStudy`
 *      within a `.filter(`) and MUST carry EXACTLY TWO `href="/experience"`
 *      occurrences — the D-02 top AND bottom back links (REVIEWS 22-01: count
 *      them, not merely one; the site nav lives in Header/MobileMenu, not this
 *      route file, so only the two back links contribute). RED until 22-04
 *      ships the route; a missing file fails RED cleanly, not by throwing.
 */

const EXPERIENCE_DIR = join("src", "content", "experience");
const DETAIL_ROUTE = join("src", "pages", "experience", "[id].astro");

async function readOrNull(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

describe("Experience detail filter — content contract (SC3 / SC4 / EXP-05)", () => {
  it("ids with hasCaseStudy true === [\"holloway\"] and excludes balfour-beatty", async () => {
    const files = (await readdir(EXPERIENCE_DIR)).filter((f) =>
      f.endsWith(".mdx"),
    );

    const caseStudyIds: string[] = [];
    for (const f of files) {
      const raw = await readFile(join(EXPERIENCE_DIR, f), "utf8");
      const norm = raw.replace(/\r\n/g, "\n");
      // Parse the hasCaseStudy boolean from frontmatter.
      const match = norm.match(/^hasCaseStudy:\s*(true|false)\b/m);
      if (match && match[1] === "true") {
        caseStudyIds.push(f.replace(/\.mdx$/, ""));
      }
    }

    expect(caseStudyIds.sort()).toEqual(["holloway"]);
    expect(caseStudyIds).not.toContain("balfour-beatty");
  });
});

describe("Experience detail route — source shape (SC3 / D-02)", () => {
  it("filters getStaticPaths on hasCaseStudy and carries exactly two /experience back links", async () => {
    const src = await readOrNull(DETAIL_ROUTE);
    // RED (clean) until 22-04 ships the route.
    expect(
      src,
      "src/pages/experience/[id].astro should exist (shipped by 22-04)",
    ).not.toBeNull();
    if (src === null) return;

    const norm = src.replace(/\r\n/g, "\n");

    // getStaticPaths must filter on hasCaseStudy: assert a `.filter(` call
    // references hasCaseStudy within a short window (tolerates the common
    // `.filter((e) => e.data.hasCaseStudy)` shape).
    expect(norm, "getStaticPaths must filter on hasCaseStudy").toMatch(
      /\.filter\([\s\S]{0,200}?hasCaseStudy/,
    );

    // Exactly TWO href="/experience" occurrences (D-02 top + bottom back links).
    const backLinkCount = (norm.match(/href="\/experience"/g) ?? []).length;
    expect(backLinkCount).toBe(2);
  });
});
