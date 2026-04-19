import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";

describe("ROADMAP.md Phase 13 success criterion reflects D-02 5-H2 amendment", () => {
  it("Phase 13 block mentions 'Approach & Architecture' as one section", async () => {
    const md = await readFile(".planning/ROADMAP.md", "utf8");
    const afterPhase13 = md.split(/^### Phase 13:/m)[1] ?? "";
    const block = afterPhase13.split(/^### Phase 14:/m)[0] ?? "";
    expect(block).toMatch(/Approach & Architecture/);
  });

  it("Phase 13 block does NOT keep the old 'Approach → Architecture' two-section wording", async () => {
    const md = await readFile(".planning/ROADMAP.md", "utf8");
    const afterPhase13 = md.split(/^### Phase 13:/m)[1] ?? "";
    const block = afterPhase13.split(/^### Phase 14:/m)[0] ?? "";
    expect(block).not.toMatch(/Approach\s*→\s*Architecture/);
  });
});
