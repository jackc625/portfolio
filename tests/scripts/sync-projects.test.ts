import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import {
  readSourceField,
  sliceFrontmatter,
  extractFence,
  wordCount,
} from "../../scripts/sync-projects.mjs";

describe("readSourceField (CONT-06 / S1)", () => {
  it("returns the unquoted source value when quoted", () => {
    const fm = 'title: X\nsource: "Projects/1 - SEATWATCH.md"\n';
    expect(readSourceField(fm)).toBe("Projects/1 - SEATWATCH.md");
  });

  it("returns the source value when unquoted", () => {
    const fm = "title: X\nsource: Projects/1 - SEATWATCH.md\n";
    expect(readSourceField(fm)).toBe("Projects/1 - SEATWATCH.md");
  });

  it("returns null when no source: field is present", () => {
    const fm = "title: X\ndescription: Y\n";
    expect(readSourceField(fm)).toBe(null);
  });
});

describe("sliceFrontmatter (CONT-06 / S2)", () => {
  it("returns { frontmatterBlock, body } for a valid MDX string", () => {
    const mdx = "---\ntitle: X\n---\n\nbody text";
    const out = sliceFrontmatter(mdx);
    expect(out.frontmatterBlock).toContain("title: X");
    expect(out.body.trim()).toBe("body text");
  });

  it("throws when the input does not start with a frontmatter delimiter", () => {
    expect(() => sliceFrontmatter("no frontmatter here")).toThrow(
      /missing opening frontmatter delimiter/,
    );
  });

  it("throws when no closing frontmatter delimiter is found", () => {
    expect(() => sliceFrontmatter("---\ntitle: X\nbody without close")).toThrow(
      /missing closing frontmatter delimiter/,
    );
  });
});

describe("extractFence (CONT-06)", () => {
  it("returns trimmed text between CASE-STUDY-START and CASE-STUDY-END markers", () => {
    const src =
      "intro\n<!-- CASE-STUDY-START -->\n\n  real body  \n\n<!-- CASE-STUDY-END -->\noutro";
    expect(extractFence(src)).toBe("real body");
  });

  it("throws when CASE-STUDY-START marker is missing", () => {
    const src = "body without start\n<!-- CASE-STUDY-END -->\n";
    expect(() => extractFence(src)).toThrow(/missing <!-- CASE-STUDY-START -->/);
  });

  it("throws when CASE-STUDY-END marker is missing", () => {
    const src = "<!-- CASE-STUDY-START -->\nbody without end\n";
    expect(() => extractFence(src)).toThrow(/missing <!-- CASE-STUDY-END -->/);
  });

  it("throws when a marker appears more than once", () => {
    const src =
      "<!-- CASE-STUDY-START -->\na\n<!-- CASE-STUDY-START -->\nb\n<!-- CASE-STUDY-END -->\n";
    expect(() => extractFence(src)).toThrow(/must each appear exactly once/);
  });

  it("throws when CASE-STUDY-END appears before CASE-STUDY-START", () => {
    const src =
      "<!-- CASE-STUDY-END -->\nbody\n<!-- CASE-STUDY-START -->\n";
    expect(() => extractFence(src)).toThrow(/appears before/);
  });
});

describe("wordCount (CONT-02)", () => {
  it("counts whitespace-separated words, ignoring fenced code blocks", () => {
    const body = "hello world\n```\ncode stuff goes here\n```\n";
    expect(wordCount(body)).toBe(2);
  });
});

describe("sync-projects.mjs S3 path-traversal guard (T-13-01)", () => {
  it("rejects a source: path that escapes project root (S3 guard)", async () => {
    const tmp = await mkdtemp(join(tmpdir(), "sync-escape-"));
    try {
      await mkdir(join(tmp, "src", "content", "projects"), { recursive: true });
      await mkdir(join(tmp, "scripts"), { recursive: true });
      await writeFile(
        join(tmp, "src", "content", "projects", "bad.mdx"),
        '---\ntitle: Bad\nsource: "../../escape.md"\n---\n\nbody\n',
        "utf8",
      );
      const repoRoot = join(__dirname, "..", "..");
      let threwWithExpectedMessage = false;
      try {
        execFileSync("node", [join(repoRoot, "scripts/sync-projects.mjs")], {
          cwd: tmp,
          stdio: "pipe",
        });
      } catch (err) {
        const stderr = String((err as { stderr?: Buffer }).stderr ?? "");
        const message = String((err as Error).message ?? "");
        if (/escapes project root/.test(stderr) || /escapes project root/.test(message)) {
          threwWithExpectedMessage = true;
        }
      }
      expect(threwWithExpectedMessage).toBe(true);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
