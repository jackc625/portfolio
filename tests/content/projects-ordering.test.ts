import { describe, it, expect } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

// SC4 / PROJ-04 property gate. Proves the D-12 single featured/order
// distinction directly from the MDX frontmatter, independent of page
// rendering. Mirrors the projects-collection.test.ts readdir/readFile idiom
// and imports nothing from astro:content.

const PROJECTS_DIR = join("src", "content", "projects");

const EXPECTED_SLUGS = [
  "clipify",
  "daytrade",
  "multi-chain-evm",
  "nfl-predict",
  "optimize-ai",
  "seatwatch",
  "solsniper",
];

const FEATURED_SLUGS = ["multi-chain-evm", "nfl-predict", "seatwatch"];

/** Read every project MDX and return { slug, order, featured }. */
async function readProjectFrontmatter() {
  const files = (await readdir(PROJECTS_DIR)).filter((f) => f.endsWith(".mdx"));
  const entries = [];
  for (const f of files) {
    const raw = await readFile(join(PROJECTS_DIR, f), "utf8");
    const slug = f.replace(/\.mdx$/, "");
    const orderMatch = raw.match(/^order:\s*(\d+)\b/m);
    const featuredMatch = raw.match(/^featured:\s*(true|false)\b/m);
    if (!orderMatch) throw new Error(`${f}: missing order: frontmatter`);
    if (!featuredMatch) throw new Error(`${f}: missing featured: frontmatter`);
    entries.push({
      slug,
      order: Number(orderMatch[1]),
      featured: featuredMatch[1] === "true",
    });
  }
  return entries;
}

describe("Projects ordering property gate (SC4 / PROJ-04)", () => {
  it("order values are exactly {1,2,3,4,5,6,7} — seven, contiguous, unique", async () => {
    const entries = await readProjectFrontmatter();
    const orders = entries.map((e) => e.order).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7]);
    // Uniqueness: no duplicate order values.
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("featured:true slugs are exactly {seatwatch, multi-chain-evm, nfl-predict}", async () => {
    const entries = await readProjectFrontmatter();
    const featured = entries
      .filter((e) => e.featured)
      .map((e) => e.slug)
      .sort();
    expect(featured).toEqual([...FEATURED_SLUGS].sort());
  });

  it("every file slug is one of the seven expected slugs", async () => {
    const entries = await readProjectFrontmatter();
    const slugs = entries.map((e) => e.slug).sort();
    expect(slugs).toEqual(EXPECTED_SLUGS);
  });

  it("featured slugs occupy the lowest contiguous order values (guards Home 01-03 ledger, WR-01)", async () => {
    const entries = await readProjectFrontmatter();
    const featuredOrders = entries
      .filter((e) => e.featured)
      .map((e) => e.order)
      .sort((a, b) => a - b);
    // Featured projects must hold orders 1..N so the homepage's canonical
    // `order`-derived numbering renders 01, 02, 03 with no gaps. If a future
    // edit features a higher-order project, this fails loudly rather than
    // silently desyncing Home from /projects.
    const expectedContiguous = Array.from(
      { length: featuredOrders.length },
      (_, k) => k + 1,
    );
    expect(featuredOrders).toEqual(expectedContiguous);
  });

  it("partitioning by featured then sorting by order yields one clean distinction (D-12)", async () => {
    const entries = await readProjectFrontmatter();
    const featured = entries
      .filter((e) => e.featured)
      .sort((a, b) => a.order - b.order)
      .map((e) => e.slug);
    const rest = entries
      .filter((e) => !e.featured)
      .sort((a, b) => a.order - b.order)
      .map((e) => e.slug);
    expect(featured).toEqual(["seatwatch", "multi-chain-evm", "nfl-predict"]);
    expect(rest).toEqual(["solsniper", "optimize-ai", "clipify", "daytrade"]);
  });
});
