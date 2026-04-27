import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Phase 16 Motion Layer — file existence + content invariants for
 * design-system/MOTION.md (NEW) and design-system/MASTER.md (§6 stub +
 * §8 view-transition reconciliation + §11 changelog).
 *
 * Wave 0 RED stubs. Plan 03 authors MOTION.md and patches MASTER.md.
 *
 * Test tier: build (pure node + readFileSync — no jsdom).
 */

const projectRoot = resolve(__dirname, "../..");
const motionPath = resolve(projectRoot, "design-system/MOTION.md");
const masterPath = resolve(projectRoot, "design-system/MASTER.md");

describe("Phase 16 design-system/MOTION.md (MOTN-09 / D-01)", () => {
  it("file exists at design-system/MOTION.md", () => {
    expect(existsSync(motionPath)).toBe(true);
  });

  it("contains Property whitelist section header", () => {
    const md = readFileSync(motionPath, "utf8");
    expect(md).toMatch(/^##\s.*Property [Ww]hitelist/m);
  });

  it("contains the 3 whitelisted properties: transform, opacity, box-shadow", () => {
    const md = readFileSync(motionPath, "utf8");
    expect(md).toContain("transform");
    expect(md).toContain("opacity");
    expect(md).toContain("box-shadow");
  });

  it("contains all 7 duration band markers", () => {
    const md = readFileSync(motionPath, "utf8");
    for (const dur of ["120ms", "180ms", "200ms", "250", "300ms", "350", "600ms", "2500ms"]) {
      expect(md).toContain(dur);
    }
  });

  it("contains easing names: ease-out, ease-in-out, ease", () => {
    const md = readFileSync(motionPath, "utf8");
    expect(md).toContain("ease-out");
    expect(md).toContain("ease-in-out");
  });

  it("references all 7 motion IDs MOTN-01 through MOTN-07", () => {
    const md = readFileSync(motionPath, "utf8");
    for (const id of ["MOTN-01", "MOTN-02", "MOTN-03", "MOTN-04", "MOTN-05", "MOTN-06", "MOTN-07"]) {
      expect(md).toContain(id);
    }
  });

  it("does NOT contain `cubic-bezier(` (UI-SPEC: prohibited)", () => {
    const md = readFileSync(motionPath, "utf8");
    expect(md).not.toMatch(/cubic-bezier\(/);
  });

  it("does NOT contain `gsap` or `GSAP` mention as authorized motion (anti-pattern carryover)", () => {
    // GSAP can appear in an anti-pattern callout — but not as a permitted dependency
    const md = readFileSync(motionPath, "utf8");
    // No `import gsap`, no positive permission sentence
    expect(md).not.toMatch(/import\s+gsap/);
  });
});

describe("Phase 16 MASTER.md §6 stub + §8 reconciliation (MOTN-09 / D-02)", () => {
  it("MASTER.md §6 contains the v1.1-superseded stub phrase", () => {
    const md = readFileSync(masterPath, "utf8");
    expect(md).toContain("v1.1 motion lock superseded by v1.2");
  });

  it("MASTER.md §6 links to MOTION.md", () => {
    const md = readFileSync(masterPath, "utf8");
    expect(md).toMatch(/\(MOTION\.md\)|\(\.\/MOTION\.md\)/);
  });

  it("MASTER.md §6 stub body is short (<= 12 lines between `## 6.` and `## 7.`)", () => {
    const md = readFileSync(masterPath, "utf8");
    const sec6 = md.match(/##\s*6\.[\s\S]*?(?=##\s*7\.)/)?.[0] ?? "";
    const lineCount = sec6.split(/\r?\n/).length;
    expect(lineCount).toBeLessThanOrEqual(12);
  });

  it("MASTER.md §8 still bans GSAP (no GSAP carve-out for v1.2)", () => {
    const md = readFileSync(masterPath, "utf8");
    const sec8 = md.match(/##\s*8\.[\s\S]*?(?=##\s*9\.)/)?.[0] ?? "";
    expect(sec8).toMatch(/No GSAP/);
  });

  it("MASTER.md §8 reconciles `::view-transition-*` ban — permits MOTION.md authorization", () => {
    const md = readFileSync(masterPath, "utf8");
    const sec8 = md.match(/##\s*8\.[\s\S]*?(?=##\s*9\.)/)?.[0] ?? "";
    // The original blanket ban must be amended — explicit MOTION.md carve-out language present
    expect(sec8).toMatch(/MOTION\.md|MOTN-01/);
    expect(sec8).toMatch(/view-transition/);
  });

  it("MASTER.md §8 still bans `<ClientRouter />`", () => {
    const md = readFileSync(masterPath, "utf8");
    const sec8 = md.match(/##\s*8\.[\s\S]*?(?=##\s*9\.)/)?.[0] ?? "";
    expect(sec8).toMatch(/ClientRouter/);
  });

  it("MASTER.md §11 Changelog gains a v1.2 / Phase 16 entry", () => {
    const md = readFileSync(masterPath, "utf8");
    const sec11 = md.match(/##\s*11\.[\s\S]*$/)?.[0] ?? "";
    expect(sec11).toMatch(/v1\.2/);
    expect(sec11).toMatch(/Phase 16/);
  });
});
