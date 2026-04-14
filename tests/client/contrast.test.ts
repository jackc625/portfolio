import { describe, it, expect } from "vitest";

/**
 * WCAG 2.1 contrast verification for the six-token editorial palette
 * documented in .planning/phases/11-polish/11-02-PLAN.md Task 1 and
 * the final contrast inventory in 11-AUDIT.md.
 *
 * Formula (WCAG 2.1 Relative Luminance):
 *   For each sRGB channel c in [0, 255]:
 *     c_srgb = c / 255
 *     c_lin  = (c_srgb <= 0.03928)
 *                ? c_srgb / 12.92
 *                : ((c_srgb + 0.055) / 1.055) ^ 2.4
 *   L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin
 *   contrast = (L_lighter + 0.05) / (L_darker + 0.05)
 *
 * Thresholds:
 *   Normal text (< 18pt / < 14pt bold):  4.5:1
 *   Large text  (>= 18pt / >= 14pt bold): 3.0:1
 *   Non-text UI components (WCAG 1.4.11): 3.0:1
 *
 * Tokens under test (from src/styles/global.css :root):
 *   --bg:         #FAFAF7  warm off-white background
 *   --ink:        #0A0A0A  near-black body text
 *   --ink-muted:  #52525B  secondary text (labels, nav)
 *   --ink-faint:  #A1A1AA  tertiary/decorative text
 *   --rule:       #E4E4E7  borders (non-text)
 *   --accent:     #E63946  signal red (UI + hover only)
 */

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const h = hex.replace(/^#/, "");
  if (h.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function channelToLinear(c255: number): number {
  const c = c255 / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la >= lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

// Design tokens from src/styles/global.css :root
const BG = "#FAFAF7";
const INK = "#0A0A0A";
const INK_MUTED = "#52525B";
const INK_FAINT = "#A1A1AA";
const ACCENT = "#E63946";
const WHITE = "#FFFFFF";

describe("WCAG AA contrast formula — sanity checks (QUAL-05)", () => {
  it("black on white yields the canonical 21:1 ratio", () => {
    const ratio = contrastRatio("#000000", "#FFFFFF");
    expect(ratio).toBeGreaterThan(20.9);
    expect(ratio).toBeLessThan(21.1);
  });

  it("ratio is symmetric regardless of argument order", () => {
    const ab = contrastRatio(INK, BG);
    const ba = contrastRatio(BG, INK);
    expect(Math.abs(ab - ba)).toBeLessThan(1e-9);
  });

  it("identical colors yield ratio of exactly 1", () => {
    const ratio = contrastRatio(BG, BG);
    expect(ratio).toBeCloseTo(1.0, 9);
  });

  it("ratio is always >= 1", () => {
    expect(contrastRatio(INK, BG)).toBeGreaterThanOrEqual(1);
    expect(contrastRatio(ACCENT, BG)).toBeGreaterThanOrEqual(1);
    expect(contrastRatio(INK_FAINT, BG)).toBeGreaterThanOrEqual(1);
  });
});

describe("WCAG AA contrast — editorial token palette (QUAL-05)", () => {
  it("--ink on --bg meets 4.5:1 for normal text (primary body + headings)", () => {
    // Inventory row #1: headings, body, .display, .h1-section, .h2-project.
    // Expected ~18.9:1 per 11-AUDIT.md.
    const ratio = contrastRatio(INK, BG);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeGreaterThan(15); // very high contrast anchor
  });

  it("--ink-muted on --bg meets 4.5:1 for normal text (labels, nav, contact-link)", () => {
    // Inventory row #2: .label-mono, .nav-link, .contact-link, .meta-mono.
    // Expected ~7.4:1 per 11-AUDIT.md.
    const ratio = contrastRatio(INK_MUTED, BG);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("--ink-faint on --bg is documented tertiary/decorative text (known tradeoff)", () => {
    // Inventory row #3: .footer-copy, .footer-built, .work-stack, .work-year,
    // .contact-sep, .section-count, .next-project-label, chat char-count.
    //
    // Per 11-AUDIT.md (QUAL-05 "PASS WITH NOTES"): computed ~2.5:1. This
    // FAILS the 4.5:1 normal-text threshold and the 3:1 large-text threshold.
    // The design intentionally uses faint text for visual hierarchy on
    // tertiary/decorative metadata only — no primary content relies on it.
    // This test locks the measured value so any palette regression is caught.
    const ratio = contrastRatio(INK_FAINT, BG);
    expect(ratio).toBeGreaterThan(2.3);
    expect(ratio).toBeLessThan(2.7);
  });

  it("--accent on --bg meets 3:1 for UI components (WCAG 1.4.11) and large text", () => {
    // Inventory row #4: focus rings, status dot, hover states, decorative underlines.
    // Expected ~4.0:1 per 11-AUDIT.md. Accent is NEVER used as default text
    // color at normal-text size — Plan 01 fixed .chat-bot-message a.
    const ratio = contrastRatio(ACCENT, BG);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it("white on --accent meets 3:1 for the chat bubble icon (UI element)", () => {
    // Inventory row #5: white chevron stroke on red chat bubble background.
    // Expected ~4.2:1 per 11-AUDIT.md.
    const ratio = contrastRatio(WHITE, ACCENT);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });
});
