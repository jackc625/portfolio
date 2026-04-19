import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";

describe("docs/CONTENT-SCHEMA.md exists with required structure (CONT-07 / D-17)", () => {
  it("contains all four section headings", async () => {
    const md = await readFile("docs/CONTENT-SCHEMA.md", "utf8");
    expect(md).toMatch(/^## 1\. Frontmatter Schema/m);
    expect(md).toMatch(/^## 2\. Sync Contract/m);
    expect(md).toMatch(/^## 3\. Author Workflow/m);
    expect(md).toMatch(/^## 4\. Failure-Mode Matrix/m);
  });

  it("includes the code-wins precedence disclaimer", async () => {
    const md = await readFile("docs/CONTENT-SCHEMA.md", "utf8");
    expect(md).toMatch(/If anything here\s*disagrees/i);
  });
});
