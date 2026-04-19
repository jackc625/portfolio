import { afterEach, describe, it, expect } from "vitest";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  stat,
  rm,
} from "node:fs/promises";
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

describe("sync-projects.mjs idempotency (CONT-06 / S6)", () => {
  it("running twice in succession produces zero filesystem changes on second run", async () => {
    tmp = await mkdtemp(join(tmpdir(), "sync-idem-"));
    const projectsDir = join(tmp, "Projects");
    const mdxDir = join(tmp, "src", "content", "projects");
    await mkdir(projectsDir, { recursive: true });
    await mkdir(mdxDir, { recursive: true });

    const source = [
      "# Sample",
      "",
      "intro prose outside the fence",
      "",
      "<!-- CASE-STUDY-START -->",
      "",
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
      "<!-- CASE-STUDY-END -->",
      "",
    ].join("\n");

    await writeFile(join(projectsDir, "1 - SAMPLE.md"), source, "utf8");

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

    const mdxPath = join(mdxDir, "sample.mdx");
    await writeFile(mdxPath, mdx, "utf8");

    execFileSync("node", [syncScript], { cwd: tmp, stdio: "pipe" });
    const firstStat = await stat(mdxPath);
    const firstContents = await readFile(mdxPath, "utf8");

    execFileSync("node", [syncScript], { cwd: tmp, stdio: "pipe" });
    const secondStat = await stat(mdxPath);
    const secondContents = await readFile(mdxPath, "utf8");

    expect(secondContents).toBe(firstContents);
    expect(secondStat.mtimeMs).toBe(firstStat.mtimeMs);
  });
});
