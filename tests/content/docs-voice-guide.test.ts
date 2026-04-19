import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";

describe("docs/VOICE-GUIDE.md exists with four hard rules (CONT-07 / D-11)", () => {
  it("contains all four Rule subsections", async () => {
    const md = await readFile("docs/VOICE-GUIDE.md", "utf8");
    expect(md).toMatch(/^### Rule 1: No hype/m);
    expect(md).toMatch(/^### Rule 2: Numbers or don't claim it/m);
    expect(md).toMatch(/^### Rule 3: Past tense for shipped work/m);
    expect(md).toMatch(/^### Rule 4: Named systems over abstractions/m);
  });

  it("references seatwatch.mdx as the canonical example", async () => {
    const md = await readFile("docs/VOICE-GUIDE.md", "utf8");
    expect(md).toMatch(/seatwatch\.mdx/);
  });
});
