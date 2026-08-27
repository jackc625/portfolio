import { describe, it, expect } from "vitest";
import {
  EDUCATION,
  CREDENTIALS,
  alumniOfSchema,
  hasCredentialSchema,
} from "../../src/data/education";

/**
 * Gate D (POS-03, POS-04, D-11) — education.ts single-source-of-truth unit gate.
 *
 * education.ts is the ONE place education display facts AND the schema.org
 * JSON-LD fragments live. This gate proves:
 *   1. the display facts are the exact copy the /about block (24-03) renders,
 *   2. the schema fragments are DERIVED from those facts (not re-hardcoded), so
 *      the Home personSchema (24-02) and the /about block can never drift, and
 *   3. Virginia Tech appears as alumniOf (attended = honest, D-10) but NEVER as
 *      a credential (VT issued no degree here — D-10).
 *
 * Import-and-assert unit gate (node env), mirroring tests/client/about-data.test.ts.
 */

describe("education.ts display facts (POS-03, POS-04)", () => {
  it("EDUCATION carries the exact display facts", () => {
    expect(EDUCATION.degree).toBe("B.S. Computer Science");
    expect(EDUCATION.institution).toBe("Western Governors University");
    expect(EDUCATION.date).toBe("Expected September 2026");
    expect(EDUCATION.transferredFrom).toBe("Virginia Tech");
  });

  it("EDUCATION carries the schema-only fields (unabbreviated degree + ISO date)", () => {
    expect(EDUCATION.degreeSchemaName).toBe(
      "Bachelor of Science in Computer Science",
    );
    expect(EDUCATION.dateISO).toBe("2026-09");
  });

  it("CREDENTIALS contains LPI Linux Essentials issued by Linux Professional Institute", () => {
    const lpi = CREDENTIALS.find((c) => c.name === "LPI Linux Essentials");
    expect(lpi).toBeDefined();
    expect(lpi?.issuer).toBe("Linux Professional Institute");
  });
});

describe("alumniOfSchema derivation (D-10, D-11, review fix LOW single-source)", () => {
  it("every entry is a CollegeOrUniversity", () => {
    for (const entry of alumniOfSchema) {
      expect(entry["@type"]).toBe("CollegeOrUniversity");
    }
  });

  it("first entry name is DERIVED from EDUCATION.institution (not re-hardcoded)", () => {
    expect(alumniOfSchema[0].name).toBe(EDUCATION.institution);
  });

  it("one entry name equals EDUCATION.transferredFrom (VT attended is honest — D-10)", () => {
    const vt = alumniOfSchema.find((e) => e.name === EDUCATION.transferredFrom);
    expect(vt).toBeDefined();
  });
});

describe("hasCredentialSchema derivation (D-10, D-11)", () => {
  it("every entry is an EducationalOccupationalCredential", () => {
    for (const entry of hasCredentialSchema) {
      expect(entry["@type"]).toBe("EducationalOccupationalCredential");
    }
  });

  it("the degree entry is DERIVED from EDUCATION (name, recognizedBy, validFrom)", () => {
    const degree = hasCredentialSchema.find(
      (e) => e.credentialCategory === "degree",
    );
    expect(degree).toBeDefined();
    expect(degree?.name).toBe(EDUCATION.degreeSchemaName);
    expect(degree?.recognizedBy?.name).toBe(EDUCATION.institution);
    expect(degree?.validFrom).toBe(EDUCATION.dateISO);
  });

  it("NO credential is recognizedBy Virginia Tech (VT is not a credential — D-10)", () => {
    const vtCred = hasCredentialSchema.find(
      (e) => e.recognizedBy?.name === EDUCATION.transferredFrom,
    );
    expect(vtCred).toBeUndefined();
  });

  it("certificate entries map 1:1 from CREDENTIALS", () => {
    const certs = hasCredentialSchema.filter(
      (e) => e.credentialCategory === "certificate",
    );
    expect(certs.length).toBe(CREDENTIALS.length);
    for (const c of CREDENTIALS) {
      const match = certs.find((e) => e.name === c.name);
      expect(match).toBeDefined();
      if (c.issuer) {
        expect(match?.recognizedBy?.name).toBe(c.issuer);
      }
    }
  });
});
