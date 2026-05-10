/**
 * DEBT-05 — chat.ts has no imperative #chat-panel display flip.
 *
 * After this test passes, animatePanelOpen / animatePanelClose are no-op
 * stubs and `panel.style.display = "flex"` / "none" assignments are gone.
 * The CSS state machine in global.css (#chat-panel { display: none } +
 * #chat-panel.is-open { display: flex }) owns the display contract
 * entirely. The .is-open class toggle in chat.ts (showPanel / hidePanel)
 * remains as the single source of truth for the visibility transition.
 *
 * Anti-regression: this source-text assertion prevents future edits from
 * re-introducing the JS-coupled display flip that DEBT-05 closes. The
 * pattern follows tests/api/chat.test.ts's existing source-text assertions
 * (lines 259-289) and tests/build/motion-css-rules.test.ts.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("DEBT-05: chat.ts has no imperative panel display flip", () => {
  const src = readFileSync(
    join(process.cwd(), "src/scripts/chat.ts"),
    "utf8",
  );

  it('does not contain panel.style.display = "flex"', () => {
    expect(src).not.toMatch(/panel\.style\.display\s*=\s*["']flex["']/);
  });

  it('does not contain panel.style.display = "none"', () => {
    expect(src).not.toMatch(/panel\.style\.display\s*=\s*["']none["']/);
  });

  it("animatePanelOpen receives _panel (unused param indicates no-op)", () => {
    expect(src).toMatch(/animatePanelOpen\s*\(\s*_panel\s*:/);
  });

  it("animatePanelClose receives _panel (unused param indicates no-op)", () => {
    expect(src).toMatch(/animatePanelClose\s*\(\s*_panel\s*:/);
  });
});
