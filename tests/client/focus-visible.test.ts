import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * QUAL-03 — focus-visible selector coverage.
 *
 * Asserts that the global catch-all block in src/styles/global.css covers
 * every required interactive element selector, that chat-widget component
 * selectors explicitly add :focus-visible rules, and that per-component
 * primitives (ContactSection, WorkRow, Footer) carry their own scoped
 * :focus-visible rules so focus rings survive Astro's style scoping.
 *
 * Pattern (Phase 11 Plan 01): `outline: 2px solid var(--accent); outline-offset: 2px`.
 */

const projectRoot = resolve(__dirname, "../..");
const read = (rel: string) =>
  readFileSync(resolve(projectRoot, rel), "utf8");

describe("Focus-visible coverage — global catch-all (QUAL-03)", () => {
  const css = read("src/styles/global.css");

  const requiredSelectors = [
    "a:focus-visible",
    "button:focus-visible",
    "textarea:focus-visible",
    "input:focus-visible",
    "select:focus-visible",
    '[role="button"]:focus-visible',
    "summary:focus-visible",
  ];

  for (const selector of requiredSelectors) {
    it(`global.css contains '${selector}' in the catch-all block`, () => {
      expect(css).toContain(selector);
    });
  }

  it("catch-all applies the accent outline pattern", () => {
    // Anchor the catch-all block and confirm the Phase 11 focus-ring pattern.
    expect(css).toMatch(/summary:focus-visible\s*{\s*outline:\s*2px solid var\(--accent\);\s*outline-offset:\s*2px;/);
  });
});

describe("Focus-visible coverage — chat widget selectors (QUAL-03)", () => {
  const css = read("src/styles/global.css");

  it("global.css contains .chat-starter-chip:focus-visible rule", () => {
    expect(css).toContain(".chat-starter-chip:focus-visible");
  });

  it("global.css contains .chat-copy-btn:focus-visible rule", () => {
    expect(css).toContain(".chat-copy-btn:focus-visible");
  });

  it("global.css uses .chat-textarea:focus-visible (not plain :focus)", () => {
    expect(css).toContain(".chat-textarea:focus-visible");
  });
});

describe("Focus-visible coverage — component-scoped primitives (QUAL-03)", () => {
  it("ContactSection.astro defines .contact-email:focus-visible", () => {
    const src = read("src/components/ContactSection.astro");
    expect(src).toContain(".contact-email:focus-visible");
  });

  it("ContactSection.astro defines .contact-link:focus-visible", () => {
    const src = read("src/components/ContactSection.astro");
    expect(src).toContain(".contact-link:focus-visible");
  });

  it("WorkRow.astro defines .work-row:focus-visible (outline on the row itself)", () => {
    const src = read("src/components/primitives/WorkRow.astro");
    // Match the selector at rule scope (not only as a descendant combinator).
    expect(src).toMatch(/\.work-row:focus-visible\s*{/);
  });

  it("Footer.astro defines .footer-social-link:focus-visible", () => {
    const src = read("src/components/primitives/Footer.astro");
    expect(src).toContain(".footer-social-link:focus-visible");
  });
});
