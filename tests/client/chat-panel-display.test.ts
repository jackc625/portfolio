// @vitest-environment jsdom
/**
 * DEBT-05 — #chat-panel display contract is CSS-only.
 *
 * UAT Gap #2 (RELEASE BLOCKER) update: the original fixture used
 * `<div id="chat-panel"></div>` with NO inline style — false-green coverage.
 * The real ChatWidget.astro markup carries an inline `style` attribute with
 * positional layout. Pre-fix, that inline attribute also contained
 * `display: none;`, which beat the CSS state machine via selector specificity.
 * The fix (Plan 17-08 Task 2) removes the display declaration ONLY; positional
 * layout stays inline.
 *
 * This fixture mirrors the post-fix production markup — forward-defense lock
 * (m2): the test starts GREEN because the fixture represents the post-fix state.
 * The binding gate against the dev regression is Task 2's source-text test
 * (no `display:` substring in the ChatWidget.astro #chat-panel inline style)
 * PLUS this test's fixture matching the post-fix component shape.
 *
 * See .planning/debug/chat-panel-not-opening-dev.md for full diagnosis.
 */
import { describe, it, expect, beforeEach } from "vitest";

// Mirror ChatWidget.astro:55 inline style verbatim, sans display: none (Plan 17-08 fix).
// If this string drifts from the real component markup, update both in lockstep
// (or the test becomes false-green again).
const CHAT_PANEL_INLINE_STYLE =
  "position: fixed; bottom: 84px; right: 24px; z-index: 50; width: 400px; height: 500px; background: var(--bg); border: 1px solid var(--rule); border-radius: 0; box-shadow: none; flex-direction: column; overflow: hidden;";

describe("DEBT-05 + UAT Gap #2: #chat-panel CSS state machine + inline-style integration", () => {
  let panel: HTMLElement;

  beforeEach(() => {
    document.head.innerHTML = `
      <style>
        #chat-panel { display: none; transform-origin: bottom right; }
        #chat-panel.is-open { display: flex; }
      </style>
    `;
    document.body.innerHTML = `<div id="chat-panel" style="${CHAT_PANEL_INLINE_STYLE}"></div>`;
    panel = document.getElementById("chat-panel")!;
  });

  it("base #chat-panel has display: none (CSS state machine wins despite inline positional style)", () => {
    expect(getComputedStyle(panel).display).toBe("none");
  });

  it("adding .is-open sets display: flex (CSS state machine wins despite inline positional style)", () => {
    panel.classList.add("is-open");
    expect(getComputedStyle(panel).display).toBe("flex");
  });

  it("removing .is-open returns to display: none", () => {
    panel.classList.add("is-open");
    panel.classList.remove("is-open");
    expect(getComputedStyle(panel).display).toBe("none");
  });

  it("UAT Gap #2: inline style attribute does NOT contain display declaration (Plan 17-08 lock)", () => {
    const inlineStyle = panel.getAttribute("style") ?? "";
    expect(inlineStyle).not.toMatch(/display\s*:/);
  });

  it("UAT Gap #2: CSS state machine wins integration test — .is-open + production inline style → display: flex", () => {
    panel.classList.add("is-open");
    const computed = getComputedStyle(panel);
    // The real contract: display is governed by the CSS state machine, not by
    // the inline style attribute (which no longer carries a display declaration
    // post-Plan-17-08). This is the UAT Gap #2 closure assertion.
    expect(computed.display).toBe("flex");
    // Positional layout markers ARE present in the inline style attribute
    // verbatim. Note: jsdom's CSS parser fails-fast on the var(--bg) /
    // var(--rule) tokens in `background` and `border` declarations and
    // discards style.position / style.zIndex for property accessors as a
    // result — but getAttribute("style") returns the raw text intact. The raw
    // text is what the real browser parses + applies, so asserting on it is
    // the production-equivalent integration check under jsdom.
    const inlineStyle = panel.getAttribute("style") ?? "";
    expect(inlineStyle).toContain("position: fixed");
    expect(inlineStyle).toContain("z-index: 50");
  });
});
