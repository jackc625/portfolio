import { describe, it, expect } from "vitest";
import {
  ABOUT_INTRO,
  ABOUT_P1,
  ABOUT_P2,
  ABOUT_P3,
} from "../../src/data/about";

describe("About page copy exports (ABOUT-02)", () => {
  it("ABOUT_INTRO is a non-empty string", () => {
    expect(typeof ABOUT_INTRO).toBe("string");
    expect(ABOUT_INTRO.trim().length).toBeGreaterThan(0);
  });

  it("all four exports are truthy", () => {
    expect(ABOUT_INTRO).toBeTruthy();
    expect(ABOUT_P1).toBeTruthy();
    expect(ABOUT_P2).toBeTruthy();
    expect(ABOUT_P3).toBeTruthy();
  });

  it("ABOUT_P1 has 80 words or fewer", () => {
    const wordCount = ABOUT_P1.trim().split(/\s+/).length;
    expect(wordCount).toBeLessThanOrEqual(80);
  });

  it("ABOUT_P2 has 80 words or fewer", () => {
    const wordCount = ABOUT_P2.trim().split(/\s+/).length;
    expect(wordCount).toBeLessThanOrEqual(80);
  });

  it("ABOUT_P3 has 80 words or fewer", () => {
    const wordCount = ABOUT_P3.trim().split(/\s+/).length;
    expect(wordCount).toBeLessThanOrEqual(80);
  });
});
