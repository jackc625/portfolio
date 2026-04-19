import { afterEach, describe, it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(__dirname, "..", "..");
const syncScript = join(repoRoot, "scripts/sync-projects.mjs");

let tmp: string | null = null;

afterEach(async () => {
  if (tmp) {
    await rm(tmp, { recursive: true, force: true });
    tmp = null;
  }
});

async function scaffold(): Promise<{ sourcePath: string; mdxPath: string }> {
  tmp = await mkdtemp(join(tmpdir(), "sync-check-"));
  const projectsDir = join(tmp, "Projects");
  const mdxDir = join(tmp, "src", "content", "projects");
  await mkdir(projectsDir, { recursive: true });
  await mkdir(mdxDir, { recursive: true });

  const body = [
    "## Problem",
    "",
    "Problem body.",
    "",
    "## Approach & Architecture",
    "",
    "Approach body.",
    "",
    "## Tradeoffs",
    "",
    "Tradeoffs body.",
    "",
    "## Outcome",
    "",
    "Outcome body.",
    "",
    "## Learnings",
    "",
    "Learnings body.",
    "",
  ].join("\n");

  const source = [
    "# Sample",
    "",
    "<!-- CASE-STUDY-START -->",
    "",
    body,
    "<!-- CASE-STUDY-END -->",
    "",
  ].join("\n");
  const sourcePath = join(projectsDir, "1 - SAMPLE.md");
  await writeFile(sourcePath, source, "utf8");

  const mdx = [
    "---",
    'title: "Sample"',
    'description: "A sample."',
    'source: "Projects/1 - SAMPLE.md"',
    "featured: false",
    "order: 1",
    'dateStart: "2024-01"',
    'stack: ["Node"]',
    "---",
    "",
    body,
  ].join("\n");
  const mdxPath = join(mdxDir, "sample.mdx");
  await writeFile(mdxPath, mdx, "utf8");

  return { sourcePath, mdxPath };
}

describe("sync-projects.mjs --check mode (CONT-06)", () => {
  it("exits 0 when source fence matches MDX body", async () => {
    await scaffold();
    expect(() =>
      execFileSync("node", [syncScript, "--check"], {
        cwd: tmp!,
        stdio: "pipe",
      }),
    ).not.toThrow();
  });

  it("exits 1 when source fence is mutated but MDX is not", async () => {
    const { sourcePath } = await scaffold();
    const original = await readFile(sourcePath, "utf8");
    const mutated = original.replace("Problem body.", "DRIFTED problem body.");
    await writeFile(sourcePath, mutated, "utf8");

    let status: number | null = null;
    try {
      execFileSync("node", [syncScript, "--check"], {
        cwd: tmp!,
        stdio: "pipe",
      });
    } catch (err) {
      status = (err as { status?: number }).status ?? null;
    }
    expect(status).toBe(1);
  });
});
