// @vitest-environment jsdom
/**
 * DEBT-05 — #chat-panel display contract is CSS-only.
 *
 * The .is-open class controls BOTH visibility and animation. The
 * `#chat-panel { display: none }` on base + `#chat-panel.is-open { display:
 * flex }` rules in global.css are the source of truth.
 *
 * Test methodology: inline a fixture <style> block matching the global.css
 * rules under test and assert getComputedStyle traversal honors the cascade
 * in jsdom. This is a contract test for the CSS state machine — the actual
 * global.css is verified via the source-level no-imperative-display-flip
 * test plus the design-system/MASTER.md visual contract.
 */
import { describe, it, expect, beforeEach } from "vitest";

describe("DEBT-05: #chat-panel CSS state machine", () => {
  let panel: HTMLElement;

  beforeEach(() => {
    document.head.innerHTML = `
      <style>
        #chat-panel { display: none; transform-origin: bottom right; }
        #chat-panel.is-open { display: flex; }
      </style>
    `;
    document.body.innerHTML = '<div id="chat-panel"></div>';
    panel = document.getElementById("chat-panel")!;
  });

  it("base #chat-panel has display: none", () => {
    expect(getComputedStyle(panel).display).toBe("none");
  });

  it("adding .is-open sets display: flex", () => {
    panel.classList.add("is-open");
    expect(getComputedStyle(panel).display).toBe("flex");
  });

  it("removing .is-open returns to display: none", () => {
    panel.classList.add("is-open");
    panel.classList.remove("is-open");
    expect(getComputedStyle(panel).display).toBe("none");
  });
});
