import { afterEach, describe, it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(__dirname, "..", "..");
const syncScript = join(repoRoot, "scripts/sync-experience.mjs");

let tmp: string | null = null;

afterEach(async () => {
  if (tmp) {
    await rm(tmp, { recursive: true, force: true });
    tmp = null;
  }
});

async function scaffold(): Promise<{ sourcePath: string; mdxPath: string }> {
  tmp = await mkdtemp(join(tmpdir(), "sync-exp-check-"));
  const experienceDir = join(tmp, "Experience");
  const mdxDir = join(tmp, "src", "content", "experience");
  await mkdir(experienceDir, { recursive: true });
  await mkdir(mdxDir, { recursive: true });

  // Freeform experience prose (no 5-H2 shape — D-07 removed that validation).
  const body = [
    "I led the migration of the scheduling platform, cutting page load times",
    "by a stable needle across the busiest routes.",
    "",
    "The work spanned backend query tuning and a rebuilt front-end cache layer.",
    "",
  ].join("\n");

  const source = [
    "# Sample Engagement",
    "",
    "<!-- CASE-STUDY-START -->",
    "",
    body,
    "<!-- CASE-STUDY-END -->",
    "",
  ].join("\n");
  const sourcePath = join(experienceDir, "1 - SAMPLE.md");
  await writeFile(sourcePath, source, "utf8");

  const mdx = [
    "---",
    'role: "Software Engineer"',
    'company: "Sample Co"',
    'startDate: "2024-01"',
    'dateRange: "Jan 2024 – Present"',
    'summary: "A sample engagement."',
    'techStack: ["Node"]',
    'highlights: ["Did a thing"]',
    'engagementType: "contract"',
    "hasCaseStudy: true",
    'source: "Experience/1 - SAMPLE.md"',
    "---",
    "",
    body,
  ].join("\n");
  const mdxPath = join(mdxDir, "sample.mdx");
  await writeFile(mdxPath, mdx, "utf8");

  return { sourcePath, mdxPath };
}

describe("sync-experience.mjs --check mode (EXP-01)", () => {
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
    const mutated = original.replace("a stable needle", "a DRIFTED needle");
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

  // WR-05: guard the committed real files. Runs --check against the actual
  // repo root so a future hand-edit that drifts balfour-beatty.mdx or
  // holloway.mdx from their Experience/ sources fails this test, not just CI.
  it("exits 0 for the committed repo (real files are in sync)", () => {
    expect(() =>
      execFileSync("node", [syncScript, "--check"], {
        cwd: repoRoot,
        stdio: "pipe",
      }),
    ).not.toThrow();
  });
});
