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
  it("no #chat-panel <div> contains a `style=\"...display:...\"` declaration (matchAll, attribute-order tolerant)", () => {
    // WR-05 (17-REVIEW-GAPS.md, quick-260513-hqk): use matchAll with an
    // order-agnostic attribute regex. The previous anchor
    //   /<div\s+id="chat-panel"\s+style="([^"]+)"/
    // required id to be IMMEDIATELY followed by style — adding any benign
    // attribute (e.g., `data-foo="bar"`) between them would cause the regex
    // to miss, throwing the "Could not locate" error and masking the real
    // situation. It also returns only the first match (no /g flag), so a
    // second duplicate #chat-panel div with inline display would slip past.
    const panelTagRe = /<div\s[^>]*\bid="chat-panel"[^>]*>/g;
    const panelMatches = [...src.matchAll(panelTagRe)];

    // Per-match assertion: no panel tag contains an inline `style="...display:..."`.
    for (const match of panelMatches) {
      expect(
        match[0],
        `Inline style on #chat-panel re-introduced display declaration: "${match[0]}". This breaks the CSS state machine in global.css:699-706 — see .planning/debug/chat-panel-not-opening-dev.md.`,
      ).not.toMatch(/style="[^"]*display\s*:/);
    }

    // Structural lock: exactly ONE #chat-panel div in the source. Catches
    // both accidental zero-match (markup refactor) AND duplicate (WR-05).
    expect(
      panelMatches.length,
      `Expected exactly one <div id="chat-panel"> in ChatWidget.astro, found ${panelMatches.length}. WR-05: a duplicate panel element would let inline display slip past per-match assertions and break the CSS state machine.`,
    ).toBe(1);
  });
});
