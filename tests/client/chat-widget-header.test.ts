import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("ChatWidget header literal (CHAT-06 / Plan 14-04 Task 2)", () => {
  const widgetSource = readFileSync(
    join(process.cwd(), "src", "components", "chat", "ChatWidget.astro"),
    "utf8"
  );

  it("renders the renamed header `ASK ABOUT JACK` in the source", () => {
    expect(widgetSource).toContain("ASK ABOUT JACK");
  });

  it("does not contain the pre-Plan-14-04 header `ASK JACK'S AI`", () => {
    expect(widgetSource).not.toContain("ASK JACK'S AI");
    expect(widgetSource).not.toContain("Ask Jack's AI");
  });

  it("preserves the dialog aria-label `Chat with Jack's AI` (D-18: header rename only)", () => {
    expect(widgetSource).toContain('aria-label="Chat with Jack\'s AI"');
  });
});
