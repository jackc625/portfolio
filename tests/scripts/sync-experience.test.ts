import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import {
  readSourceField,
  sliceFrontmatter,
  extractFence,
  normalize,
} from "../../scripts/sync-experience.mjs";
import { sortExperienceEntries } from "../../src/lib/experience";

describe("readSourceField (EXP-01 / S1)", () => {
  it("returns the unquoted source value when quoted", () => {
    const fm = 'role: X\nsource: "Experience/1 - SAMPLE.md"\n';
    expect(readSourceField(fm)).toBe("Experience/1 - SAMPLE.md");
  });

  it("returns the source value when unquoted", () => {
    const fm = "role: X\nsource: Experience/1 - SAMPLE.md\n";
    expect(readSourceField(fm)).toBe("Experience/1 - SAMPLE.md");
  });

  it("returns null when no source: field is present", () => {
    const fm = "role: X\ncompany: Y\n";
    expect(readSourceField(fm)).toBe(null);
  });

  it("returns null on mismatched quotes (opening quote, no close)", () => {
    const fm = 'role: X\nsource: "Experience/1 - SAMPLE.md\n';
    expect(readSourceField(fm)).toBe(null);
  });

  it("returns null on mismatched quotes (no open, trailing close)", () => {
    const fm = 'role: X\nsource: Experience/1 - SAMPLE.md"\n';
    expect(readSourceField(fm)).toBe(null);
  });
});

describe("normalize (S2 / Pitfall 4)", () => {
  it("converts CRLF to LF", () => {
    expect(normalize("a\r\nb\r\nc")).toBe("a\nb\nc");
  });
});

describe("sliceFrontmatter (EXP-01 / S2)", () => {
  it("returns { frontmatterBlock, body } for a valid MDX string", () => {
    const mdx = "---\nrole: X\n---\n\nbody text";
    const out = sliceFrontmatter(mdx);
    expect(out.frontmatterBlock).toContain("role: X");
    expect(out.body.trim()).toBe("body text");
  });

  it("throws when the input does not start with a frontmatter delimiter", () => {
    expect(() => sliceFrontmatter("no frontmatter here")).toThrow(
      /missing opening frontmatter delimiter/,
    );
  });

  it("throws when no closing frontmatter delimiter is found", () => {
    expect(() => sliceFrontmatter("---\nrole: X\nbody without close")).toThrow(
      /missing closing frontmatter delimiter/,
    );
  });
});

describe("extractFence (EXP-01)", () => {
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
    const src = "<!-- CASE-STUDY-END -->\nbody\n<!-- CASE-STUDY-START -->\n";
    expect(() => extractFence(src)).toThrow(/appears before/);
  });
});

describe("sortExperienceEntries (SC3 / EXP-06 / D-04)", () => {
  it("returns reverse-chronological order: Holloway (2026) before Balfour (2023)", () => {
    const balfour = { data: { startDate: new Date("2023-05") } };
    const holloway = { data: { startDate: new Date("2026-05") } };
    const result = sortExperienceEntries([balfour, holloway]);
    expect(result[0].data.startDate.valueOf()).toBe(
      new Date("2026-05").valueOf(),
    );
    expect(result[1].data.startDate.valueOf()).toBe(
      new Date("2023-05").valueOf(),
    );
  });

  it("does not mutate the input array", () => {
    const balfour = { data: { startDate: new Date("2023-05") } };
    const holloway = { data: { startDate: new Date("2026-05") } };
    const input = [balfour, holloway];
    sortExperienceEntries(input);
    expect(input[0]).toBe(balfour);
    expect(input[1]).toBe(holloway);
  });
});

describe("sync-experience.mjs S3 path-traversal guard (T-21-01)", () => {
  it("rejects a source: path that escapes project root (exit 2, status-asserted)", async () => {
    const tmp = await mkdtemp(join(tmpdir(), "sync-exp-escape-"));
    try {
      await mkdir(join(tmp, "src", "content", "experience"), {
        recursive: true,
      });
      await mkdir(join(tmp, "scripts"), { recursive: true });
      await writeFile(
        join(tmp, "src", "content", "experience", "bad.mdx"),
        '---\nrole: Bad\nsource: "../../escape.md"\n---\n\nbody\n',
        "utf8",
      );
      const repoRoot = join(__dirname, "..", "..");
      let threwWithExpectedMessage = false;
      let status: number | null = null;
      try {
        execFileSync("node", [join(repoRoot, "scripts/sync-experience.mjs")], {
          cwd: tmp,
          stdio: "pipe",
        });
      } catch (err) {
        const stderr = String((err as { stderr?: Buffer }).stderr ?? "");
        const message = String((err as Error).message ?? "");
        if (
          /escapes project root/.test(stderr) ||
          /escapes project root/.test(message)
        ) {
          threwWithExpectedMessage = true;
        }
        status = (err as { status?: number }).status ?? null;
      }
      expect(threwWithExpectedMessage).toBe(true);
      expect(status).toBe(2);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
