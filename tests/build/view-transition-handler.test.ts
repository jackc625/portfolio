import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * UAT Gap #4 (major, polish-tier) — pageswap handler asserts the implicit
 * cross-document ViewTransition rejection is consumed.
 *
 * The browser-native `@view-transition { navigation: auto }` declaration in
 * src/styles/global.css:539-541 implicitly creates a ViewTransition object
 * on every cross-document nav. Per W3C spec, supersession forces the
 * .finished Promise to reject with AbortError. The codebase has no other
 * place that observes this Promise.
 *
 * This test asserts BaseLayout.astro registers a pageswap listener that
 * .catch()'s the implicit transition's finished Promise.
 *
 * M5 fix: use `[\s\S]*?` (lazy multi-line match) instead of `[^<]*` which
 * fails on multi-line script bodies AND on JS bodies containing `<`
 * characters (e.g., comparisons).
 *
 * See .planning/debug/view-transition-aborterror.md for full diagnosis.
 */

const projectRoot = resolve(__dirname, "../..");
const baseLayoutSrc = readFileSync(
  resolve(projectRoot, "src/layouts/BaseLayout.astro"),
  "utf8"
);

describe("UAT Gap #4: BaseLayout.astro pageswap handler", () => {
  it("registers a window-level pageswap event listener", () => {
    // Match window.addEventListener("pageswap", ...) — handles single OR
    // double-quoted string literal.
    expect(baseLayoutSrc).toMatch(/window\.addEventListener\(["']pageswap["']/);
  });

  it("the listener body consumes the implicit ViewTransition rejection via .finished.catch", () => {
    // Tightest assertion: the literal `viewTransition?.finished.catch(` substring exists.
    expect(baseLayoutSrc).toMatch(/viewTransition\?\.finished\.catch\(/);
  });

  it("the handler is rendered as is:inline within a <script is:inline>...</script> block (M5 multi-line regex)", () => {
    // M5 fix: use [\s\S]*? lazy multi-line match instead of [^<]* (which
    // fails on multi-line script bodies). The lazy quantifier prevents
    // the regex from greedily swallowing past the closing </script> tag.
    const scriptMatch = baseLayoutSrc.match(/<script\s+is:inline[^>]*>[\s\S]*?pageswap[\s\S]*?<\/script>/);
    if (!scriptMatch) {
      throw new Error(
        "pageswap handler is not declared as <script is:inline>...</script>. Processed scripts may fail to register in time. See .planning/debug/view-transition-aborterror.md."
      );
    }
    expect(scriptMatch).toBeTruthy();
  });

  it("the handler is in the <head> (executes before <body> renders, before any link is clickable)", () => {
    const pageswapIdx = baseLayoutSrc.indexOf("pageswap");
    const headEndIdx = baseLayoutSrc.indexOf("</head>");
    expect(pageswapIdx, "pageswap handler not found in source").toBeGreaterThan(-1);
    expect(headEndIdx, "</head> not found in source").toBeGreaterThan(-1);
    expect(pageswapIdx).toBeLessThan(headEndIdx);
  });
});
