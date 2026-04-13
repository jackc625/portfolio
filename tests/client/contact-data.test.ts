import { describe, it, expect } from "vitest";
import { CONTACT } from "../../src/data/contact";

describe("Contact data integrity (CONTACT-02)", () => {
  it("email is jack@jackcutrara.com", () => {
    expect(CONTACT.email).toBe("jack@jackcutrara.com");
  });

  it("github starts with https://", () => {
    expect(CONTACT.github).toMatch(/^https:\/\//);
  });

  it("linkedin starts with https://", () => {
    expect(CONTACT.linkedin).toMatch(/^https:\/\//);
  });

  it("x is null (intentionally disabled)", () => {
    expect(CONTACT.x).toBeNull();
  });

  it("resume equals /jack-cutrara-resume.pdf", () => {
    expect(CONTACT.resume).toBe("/jack-cutrara-resume.pdf");
  });

  it("resume ends with .pdf (download attribute will trigger PDF download)", () => {
    expect(CONTACT.resume).toMatch(/\.pdf$/);
  });

  it("all non-null URL fields are valid URLs with no empty strings", () => {
    const urlFields = [CONTACT.github, CONTACT.linkedin] as const;
    for (const url of urlFields) {
      expect(url.length).toBeGreaterThan(0);
      expect(() => new URL(url)).not.toThrow();
    }
  });
});
