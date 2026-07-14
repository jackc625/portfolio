/**
 * Single source of truth for education display facts AND the schema.org JSON-LD
 * fragments derived from them (D-11).
 *
 * Consumed by:
 *   - about.astro education block (24-03): reads EDUCATION + CREDENTIALS
 *   - index.astro personSchema JSON-LD (24-02): spreads alumniOfSchema +
 *     hasCredentialSchema into the Person object
 *   - Phase 25 chat consumer (deferred): imports EDUCATION + CREDENTIALS for a
 *     third-person chat variant (the schema fragments are site-only)
 *
 * The two schema fragments are DERIVED from EDUCATION/CREDENTIALS so display
 * copy and structured data can never drift (review fix, LOW single-source). The
 * WGU/VT literals live in exactly one place: the EDUCATION object.
 *
 * Voice-neutral facts only. Zero em dashes (U+2014); en dashes permitted.
 */

export interface Credential {
  name: string;
  /** e.g. "Linux Professional Institute"; omitted when there is no issuer. */
  issuer?: string;
}

export const EDUCATION = {
  /** Display: "B.S. Computer Science" (abbreviated for the /about ledger). */
  degree: "B.S. Computer Science",
  /** Display + schema recognizedBy: the degree-granting institution. */
  institution: "Western Governors University",
  /** Display: "May 2026" (human-readable graduation date). */
  date: "May 2026",
  /** Display: prior institution; attended = honest (D-10). alumniOf only. */
  transferredFrom: "Virginia Tech",
  /** Schema-only: unabbreviated degree name for hasCredential.name. */
  degreeSchemaName: "Bachelor of Science in Computer Science",
  /** Schema-only: ISO 8601 (YYYY-MM) for hasCredential.validFrom. */
  dateISO: "2026-05",
} as const;

export const CREDENTIALS: Credential[] = [
  { name: "LPI Linux Essentials", issuer: "Linux Professional Institute" },
];

/**
 * alumniOf = institutions *attended* (VT transfer is honest here, D-10).
 * Names read from EDUCATION so there is no second copy of the WGU/VT literals.
 */
export const alumniOfSchema = [
  { "@type": "CollegeOrUniversity", name: EDUCATION.institution },
  { "@type": "CollegeOrUniversity", name: EDUCATION.transferredFrom },
] as const;

interface CredentialSchemaEntry {
  "@type": "EducationalOccupationalCredential";
  credentialCategory: "degree" | "certificate";
  name: string;
  recognizedBy?: { "@type": "Organization"; name: string };
  validFrom?: string;
}

/**
 * hasCredential = credentials *earned*: the WGU degree plus every entry in
 * CREDENTIALS. VT is NOT a credential (D-10): it never appears here. All fields
 * are derived from EDUCATION/CREDENTIALS.
 */
export const hasCredentialSchema: CredentialSchemaEntry[] = [
  {
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "degree",
    name: EDUCATION.degreeSchemaName,
    recognizedBy: { "@type": "Organization", name: EDUCATION.institution },
    validFrom: EDUCATION.dateISO,
  },
  ...CREDENTIALS.map((c): CredentialSchemaEntry => ({
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "certificate",
    name: c.name,
    ...(c.issuer
      ? { recognizedBy: { "@type": "Organization" as const, name: c.issuer } }
      : {}),
  })),
];
