import { describe, it, expect } from "vitest";
import { stat } from "node:fs/promises";
import { join } from "node:path";

const RESUME_PATH = join("public", "jack-cutrara-resume.pdf");

describe("Resume PDF asset (CONT-04 / D-19)", () => {
  it("public/jack-cutrara-resume.pdf exists as a file", async () => {
    const s = await stat(RESUME_PATH);
    expect(s.isFile()).toBe(true);
  });

  it("public/jack-cutrara-resume.pdf size is between 10KB and 1MB", async () => {
    const s = await stat(RESUME_PATH);
    expect(s.size).toBeGreaterThan(10 * 1024);
    expect(s.size).toBeLessThan(1 * 1024 * 1024);
  });
});
