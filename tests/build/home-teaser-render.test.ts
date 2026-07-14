// @vitest-environment jsdom
/**
 * Gate B/C (Phase 24 / HOME-01 + POS-04) -- the built Home HTML must present:
 *
 *  Gate B (numbering + concise-teaser contract): the four section labels read
 *    the exact ordered sequence 01 EXPERIENCE / 02 WORK / 03 ABOUT / 04 CONTACT
 *    (D-01), and the 01 EXPERIENCE section renders a CONCISE teaser -- exactly
 *    ONE highlight, role/company/dates present, ZERO tech-stack line (D-05), and
 *    a deep-link to the /experience listing (NOT /experience/holloway, D-04)
 *    carrying the 1,400 metric (D-03).
 *
 *  Gate C (JSON-LD Person enrichment): the ld+json Person carries
 *    jobTitle "Software Engineer", alumniOf naming WGU + Virginia Tech, and
 *    hasCredential naming "LPI Linux Essentials" with NO VT credential (D-10).
 *
 *  Plus two metadata invariants: the rendered <meta name="description"> is the
 *  sharpened, em-dash-free, DISTINCT-from-hero-lead string (D-15), and the LOCKED
 *  hero lead (D-08) is asserted verbatim as a persistent regression guard.
 *
 * Why parse the DOM (not substring-match): the ld+json bytes are escaped by
 * JsonLd.astro (`<`->`<` etc., valid JSON), so Gate C JSON.parses the
 * script textContent rather than substring-matching escaped bytes. Section
 * labels are read as parsed textContent so the ContactSection entity literal
 * (`&sect;`/`&middot;`) and the SectionHeader glyphs compare identically.
 *
 * This test depends on `dist/` existing -- it runs against a fresh build. If
 * `dist/` is missing, the first assertion surfaces the dependency cleanly
 * rather than failing opaquely on a file read.
 *
 * Test tier: build (reads dist/ output; parses with the jsdom-env DOMParser).
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Astro's Cloudflare adapter emits static pages under dist/client/.
const HOME_HTML = join(process.cwd(), "dist", "client", "index.html");

const EM_DASH = "—";
const SECTION = "§"; // §
const MIDDOT = "·"; // ·
const HERO_LEAD = "Software engineer building reliable, production-grade systems.";

const norm = (s: string | null) => (s ?? "").replace(/\s+/g, " ").trim();

describe("Gate B/C (HOME-01 + POS-04): Home teaser + numbering + JSON-LD render gate", () => {
  let distExists = false;
  let doc: Document;

  beforeAll(() => {
    distExists = existsSync(HOME_HTML);
    if (!distExists) return;
    const html = readFileSync(HOME_HTML, "utf8");
    doc = new DOMParser().parseFromString(html, "text/html");
  });

  it("built Home HTML exists (run after `pnpm build`)", () => {
    expect(
      distExists,
      `${HOME_HTML} does not exist -- run \`pnpm build\` first`,
    ).toBe(true);
  });

  // -- Gate B: section numbering ------------------------------------------------
  it("section labels read the exact ordered 01/02/03/04 sequence (D-01)", () => {
    if (!distExists) return;
    const labels = Array.from(
      doc.querySelectorAll(".section-header .label-mono"),
    ).map((el) => norm(el.textContent));
    expect(labels).toEqual([
      `${SECTION} 01 ${MIDDOT} EXPERIENCE`,
      `${SECTION} 02 ${MIDDOT} WORK`,
      `${SECTION} 03 ${MIDDOT} ABOUT`,
      `${SECTION} 04 ${MIDDOT} CONTACT`,
    ]);
  });

  // -- Gate B: concise-teaser contract -----------------------------------------
  it("the 01 EXPERIENCE section is a concise teaser (one highlight, no stack, role/company/dates, /experience + 1,400)", () => {
    if (!distExists) return;
    const section = doc.querySelector(
      'section[aria-labelledby="section-experience"]',
    );
    expect(section, "the #section-experience teaser section is missing").not.toBeNull();
    const sec = section as Element;

    // Exactly ONE metric highlight line.
    expect(sec.querySelectorAll(".teaser-highlight").length).toBe(1);

    // ZERO tech-stack elements render inside the teaser (D-05). Assert both the
    // known stack-markup classes AND that no known stack token leaks into the
    // teaser text, so a stack line reintroduced under ANY markup is caught (not
    // just the .featured-stack/.teaser-stack classes).
    expect(sec.querySelectorAll(".featured-stack, .teaser-stack").length).toBe(0);
    const teaserText = norm(sec.textContent);
    for (const stackToken of ["TypeScript", "React", "Astro", "Node", "Postgres", "Tailwind"]) {
      expect(
        teaserText,
        `teaser text must not reintroduce a tech-stack token (found "${stackToken}")`,
      ).not.toContain(stackToken);
    }

    // Eyebrow carries role + dates; title carries the company.
    const eyebrow = norm(sec.querySelector(".teaser-eyebrow")?.textContent ?? "");
    expect(eyebrow).toContain("Software Engineer, Contract");
    expect(eyebrow).toContain("May 2026");
    const title = norm(sec.querySelector(".teaser-title")?.textContent ?? "");
    expect(title).toContain("Holloway Company");

    // Deep-link targets the LISTING route (D-04), never the deep-dive route.
    expect(sec.querySelector('a[href="/experience"]')).not.toBeNull();
    expect(sec.querySelector('a[href="/experience/holloway"]')).toBeNull();

    // The one metric (D-03) renders inside the section.
    expect(norm(sec.textContent)).toContain("1,400");
  });

  // -- Gate C: JSON-LD Person enrichment ---------------------------------------
  it("the ld+json Person carries jobTitle + alumniOf (WGU + VT) + hasCredential (LPI), with VT excluded from credentials (D-10)", () => {
    if (!distExists) return;
    const scripts = Array.from(
      doc.querySelectorAll('script[type="application/ld+json"]'),
    );
    const person = scripts
      .map((s) => JSON.parse(s.textContent ?? "{}"))
      .find((obj) => obj["@type"] === "Person");
    expect(person, "no Person ld+json found").toBeTruthy();

    expect(person["@type"]).toBe("Person");
    expect(person.jobTitle).toBe("Software Engineer");

    const alumniNames = (person.alumniOf ?? []).map(
      (a: { name: string }) => a.name,
    );
    expect(alumniNames).toContain("Western Governors University");
    expect(alumniNames).toContain("Virginia Tech");

    const credNames = (person.hasCredential ?? []).map(
      (c: { name: string }) => c.name,
    );
    expect(credNames).toContain("LPI Linux Essentials");

    // D-10: VT is alumniOf-only -- no hasCredential entry may reference it.
    const credBlob = JSON.stringify(person.hasCredential ?? []);
    expect(credBlob).not.toContain("Virginia Tech");
  });

  // -- Metadata invariants ------------------------------------------------------
  it("the rendered meta description is non-empty, em-dash-free, and DISTINCT from the hero lead (D-15)", () => {
    if (!distExists) return;
    const desc =
      doc.querySelector('meta[name="description"]')?.getAttribute("content") ??
      "";
    expect(desc.length).toBeGreaterThan(0);
    expect(desc).not.toContain(EM_DASH);
    expect(desc).not.toBe(HERO_LEAD);
  });

  it("the LOCKED hero lead (D-08) is unchanged verbatim -- persistent regression guard (WARNING 1)", () => {
    if (!distExists) return;
    const lead = norm(doc.querySelector(".hero-lead")?.textContent ?? "");
    expect(lead).toBe(HERO_LEAD);
  });
});
