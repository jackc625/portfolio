import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Phase 16 Motion Layer — source-text invariants for src/styles/global.css.
 *
 * Wave 0 RED stubs. Plans 02..06 land the underlying CSS; assertions here
 * lock the durations, easings, and reduced-motion gating from
 * 16-UI-SPEC.md so future drift fails CI loudly.
 *
 * Test tier: build (pure node + readFileSync — no jsdom).
 */

const projectRoot = resolve(__dirname, "../..");
const css = readFileSync(resolve(projectRoot, "src/styles/global.css"), "utf8");

describe("Phase 16 motion CSS rules — view-transition (MOTN-01)", () => {
  it("declares `@view-transition { navigation: auto }` exactly once", () => {
    const pattern = /@view-transition\s*{\s*navigation:\s*auto;\s*}/;
    expect(css).toMatch(pattern);
    const matches = css.match(/@view-transition\s*{/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("ships `::view-transition-old(root)` keyframe with 200ms ease-out animation", () => {
    // Allow either inline animation shorthand or animation: <name> 200ms ease-out
    const pattern = /::view-transition-old\(root\)\s*{[\s\S]*?animation:\s*[\w-]+\s+200ms\s+ease-out/;
    expect(css).toMatch(pattern);
  });

  it("ships `::view-transition-new(root)` keyframe with 200ms ease-out animation", () => {
    const pattern = /::view-transition-new\(root\)\s*{[\s\S]*?animation:\s*[\w-]+\s+200ms\s+ease-out/;
    expect(css).toMatch(pattern);
  });

  it("view-transition keyframes live inside `prefers-reduced-motion: no-preference`", () => {
    // Either the at-rule or the pseudo-element rules sit inside no-preference
    const pattern = /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*{[\s\S]*?::view-transition-(old|new)\(root\)/;
    expect(css).toMatch(pattern);
  });
});

describe("Phase 16 motion CSS rules — chat-bubble pulse (MOTN-04 / D-14)", () => {
  it("declares `@keyframes chat-pulse` with rgba(230, 57, 70, 0.4) starting ring", () => {
    const pattern = /@keyframes\s+chat-pulse\s*{[\s\S]*?box-shadow:\s*0\s+0\s+0\s+0\s+rgba\(230,\s*57,\s*70,\s*0\.4\)/;
    expect(css).toMatch(pattern);
  });

  it("chat-pulse keyframe expands ring to 0 0 0 16px rgba(230, 57, 70, 0)", () => {
    const pattern = /@keyframes\s+chat-pulse\s*{[\s\S]*?box-shadow:\s*0\s+0\s+0\s+16px\s+rgba\(230,\s*57,\s*70,\s*0\)/;
    expect(css).toMatch(pattern);
  });

  it("chat-pulse keyframe scales 1.0 -> 1.02 -> 1.0", () => {
    const block = css.match(/@keyframes\s+chat-pulse\s*{[\s\S]*?\n}/)?.[0] ?? "";
    expect(block).toMatch(/scale\(1\.0\)|scale\(1\)/); // start
    expect(block).toMatch(/scale\(1\.02\)/); // middle
  });

  it("`#chat-bubble` runs `chat-pulse 2500ms ease-in-out infinite`", () => {
    const pattern = /#chat-bubble[^{]*{[^}]*animation:\s*chat-pulse\s+2500ms\s+ease-in-out\s+infinite/;
    expect(css).toMatch(pattern);
  });

  it("pulse pause selectors include :hover, :focus-visible, [data-pulse-paused]", () => {
    // Must contain animation-play-state: paused on the union selector
    expect(css).toMatch(/#chat-bubble:hover[\s\S]{0,400}animation-play-state:\s*paused/);
    expect(css).toMatch(/#chat-bubble:focus-visible[\s\S]{0,400}animation-play-state:\s*paused/);
    expect(css).toMatch(/#chat-bubble\[data-pulse-paused\][\s\S]{0,400}animation-play-state:\s*paused/);
  });

  it("paired `prefers-reduced-motion: reduce` neutralizes the pulse via `animation: none`", () => {
    const pattern = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{[\s\S]*?#chat-bubble\s*{\s*animation:\s*none/;
    expect(css).toMatch(pattern);
  });
});

describe("Phase 16 motion CSS rules — chat panel scale-in (MOTN-05)", () => {
  it("declares a chat-panel scale-in animation gated by `.is-open` class", () => {
    // Either via @keyframes referenced from #chat-panel.is-open animation, or via transition + class
    // Acceptance: an animation/transition that targets #chat-panel.is-open with 180ms ease-out
    const pattern = /#chat-panel\.is-open\s*{[\s\S]*?(animation|transition):[\s\S]*?180ms\s+ease-out/;
    expect(css).toMatch(pattern);
  });

  it("chat panel scale-in keyframe scales 0.96 -> 1.0 (transform-origin bottom right)", () => {
    expect(css).toMatch(/scale\(0\.96\)/);
    expect(css).toMatch(/transform-origin:\s*bottom\s+right/);
  });

  it("chat panel scale-in lives inside `prefers-reduced-motion: no-preference`", () => {
    const pattern = /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*{[\s\S]*?#chat-panel\.is-open/;
    expect(css).toMatch(pattern);
  });
});

describe("Phase 16 motion CSS rules — scroll-reveal (MOTN-02 / D-06)", () => {
  it("declares `@keyframes reveal-rise` with translateY 12px -> 0", () => {
    expect(css).toMatch(/@keyframes\s+reveal-rise\s*{/);
    expect(css).toMatch(/@keyframes\s+reveal-rise\s*{[\s\S]*?translateY\(12px\)/);
  });

  it("`.reveal-init` and `.reveal-on` classes live inside no-preference, run reveal-rise 300ms ease-out", () => {
    const pattern = /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*{[\s\S]*?\.reveal-init[\s\S]*?\.reveal-on[\s\S]*?animation:\s*reveal-rise\s+300ms\s+ease-out/;
    expect(css).toMatch(pattern);
  });
});

describe("Phase 16 motion CSS rules — word-stagger (MOTN-07 / D-09, D-10)", () => {
  it("declares `@keyframes word-rise` with translateY 8px -> 0", () => {
    expect(css).toMatch(/@keyframes\s+word-rise\s*{/);
    expect(css).toMatch(/@keyframes\s+word-rise\s*{[\s\S]*?translateY\(8px\)/);
  });

  it("`.word` rule has animation 250ms ease-out and animation-delay calc(var(--i) * 60ms)", () => {
    const pattern = /\.word\s*{[\s\S]*?animation:\s*word-rise\s+250ms\s+ease-out[\s\S]*?animation-delay:\s*calc\(var\(--i\)\s*\*\s*60ms\)/;
    expect(css).toMatch(pattern);
  });

  it("word-stagger lives inside no-preference (word-rise keyframe + .word class)", () => {
    const pattern = /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*{[\s\S]*?\.word/;
    expect(css).toMatch(pattern);
  });
});

describe("Phase 16 motion CSS rules — typing-bounce byte-equivalence (MOTN-06 zero-cost)", () => {
  it("`@keyframes typing-bounce` still present, byte-equivalent body", () => {
    // The exact 3-line shape from current global.css:260-263
    const pattern = /@keyframes\s+typing-bounce\s*{\s*0%,\s*100%\s*{\s*transform:\s*translateY\(0\);\s*}\s*50%\s*{\s*transform:\s*translateY\(-4px\);\s*}\s*}/;
    expect(css).toMatch(pattern);
  });

  it("typing-bounce 600ms ease-in-out infinite still applied to .typing-dot", () => {
    expect(css).toMatch(/\.typing-dot\s*{[\s\S]*?animation:\s*typing-bounce\s+600ms[\s\S]*?ease-in-out\s+infinite/);
  });
});

/**
 * Heuristic limitation (WR-05 from Phase 16 code review):
 * The `will-change` and `cubic-bezier(` stress guards below strip CSS block
 * comments via the regex `/\/\*[\s\S]*?\*\//g` then count occurrences of the
 * literal token. This is a regex heuristic, not a true CSS parser:
 *   - It does NOT understand string content (e.g., a `content: "cubic-bezier("`
 *     declaration would trigger a false positive).
 *   - It does NOT handle nested or unbalanced /* delimiters.
 *   - CSS has no `//` line comments today, so that case is not a concern.
 * For the v1.2 motion lock the heuristic is sufficient: there are no
 * `content:` strings in global.css that contain the literal banned tokens.
 * If a future contributor adds CSS-in-JS or a `content:` string with one of
 * these tokens, upgrade this check to a CSS parser (postcss / lightningcss).
 */
describe("Phase 16 motion CSS rules — Lighthouse stress guards (MOTN-10)", () => {
  it("`will-change` count is 0 (avoid sticky GPU-promotion drift)", () => {
    // Filter comments first to avoid false-positives from header prose discussing the rule
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const matches = stripped.match(/will-change\s*:/g) ?? [];
    expect(matches.length).toBe(0);
  });

  it("`cubic-bezier(` count is 0 (named easings only per UI-SPEC)", () => {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const matches = stripped.match(/cubic-bezier\s*\(/g) ?? [];
    expect(matches.length).toBe(0);
  });
});
