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
const syncScript = join(repoRoot, "scripts/sync-experience.mjs");

let tmp: string | null = null;

afterEach(async () => {
  if (tmp) {
    await rm(tmp, { recursive: true, force: true });
    tmp = null;
  }
});

describe("sync-experience.mjs idempotency (EXP-01 / S6)", () => {
  it("running twice in succession produces zero filesystem changes on second run", async () => {
    tmp = await mkdtemp(join(tmpdir(), "sync-exp-idem-"));
    const experienceDir = join(tmp, "Experience");
    const mdxDir = join(tmp, "src", "content", "experience");
    await mkdir(experienceDir, { recursive: true });
    await mkdir(mdxDir, { recursive: true });

    // Freeform experience prose (not the 5-H2 project shape — D-07).
    const body = [
      "I owned the observability rollout end to end, from tracing spec to",
      "the dashboards the on-call team relies on today.",
      "",
      "Along the way I standardised the alerting thresholds across services.",
      "",
    ].join("\n");

    const source = [
      "# Sample Engagement",
      "",
      "intro prose outside the fence",
      "",
      "<!-- CASE-STUDY-START -->",
      "",
      body,
      "<!-- CASE-STUDY-END -->",
      "",
    ].join("\n");

    await writeFile(join(experienceDir, "1 - SAMPLE.md"), source, "utf8");

    const mdx = [
      "---",
      'role: "Software Engineer"',
      'company: "Sample Co"',
      'startDate: "2024-01"',
      'dateRange: "Jan 2024 – Present"',
      'summary: "A sample engagement."',
      'techStack: ["Node"]',
      'highlights: ["Did a thing"]',
      'engagementType: "full-time"',
      "hasCaseStudy: true",
      'source: "Experience/1 - SAMPLE.md"',
      "---",
      "",
      body,
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
