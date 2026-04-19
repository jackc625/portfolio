import { describe, it, expect } from "vitest";
import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const PROJECTS_DIR = join("src", "content", "projects");

const SOURCE_RE = /^source:\s*"?([^"\n]+?)"?\s*$/m;

describe("Case-study MDX source: frontmatter integrity (CONT-05)", () => {
  it("every MDX has a source: field pointing to an existing Projects/*.md", async () => {
    const files = (await readdir(PROJECTS_DIR)).filter((f) =>
      f.endsWith(".mdx"),
    );
    expect(files.length).toBeGreaterThan(0);

    const failures: string[] = [];
    for (const f of files) {
      const raw = await readFile(join(PROJECTS_DIR, f), "utf8");
      const match = raw.match(SOURCE_RE);
      if (!match) {
        failures.push(`${f}: no source: field`);
        continue;
      }
      const sourcePath = match[1].trim();
      try {
        await access(sourcePath);
      } catch {
        failures.push(`${f}: source ${sourcePath} not found`);
      }
    }
    expect(failures).toEqual([]);
  });
});
