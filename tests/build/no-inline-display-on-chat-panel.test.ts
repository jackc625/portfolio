/**
 * UAT Gap #2 (RELEASE BLOCKER) — guard against re-adding inline display
 * to ChatWidget.astro #chat-panel.
 *
 * Inline-style display declarations on #chat-panel beat the CSS state
 * machine in global.css:699-706 via selector specificity. After Plan 17-03
 * DEBT-05 removed the imperative `panel.style.display` flip from chat.ts,
 * the panel-open path depends on the CSS rule being the highest-specificity
 * display declaration on the element.
 *
 * See .planning/debug/chat-panel-not-opening-dev.md for full diagnosis.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(__dirname, "../..");
const src = readFileSync(
  resolve(projectRoot, "src/components/chat/ChatWidget.astro"),
  "utf8",
);

describe("UAT Gap #2: ChatWidget.astro #chat-panel has no inline display declaration", () => {
  it("the inline style attribute on #chat-panel contains no `display:` token", () => {
    const panelMatch = src.match(/<div\s+id="chat-panel"\s+style="([^"]+)"/);
    if (!panelMatch) {
      throw new Error(
        'Could not locate <div id="chat-panel" style="..."> in ChatWidget.astro — markup may have been refactored. Update this test to match.',
      );
    }
    const inlineStyle = panelMatch[1];
    expect(
      inlineStyle,
      `Inline style on #chat-panel re-introduced display declaration: "${inlineStyle}". This breaks the CSS state machine in global.css:699-706 — see .planning/debug/chat-panel-not-opening-dev.md.`,
    ).not.toMatch(/display\s*:/);
  });
});
