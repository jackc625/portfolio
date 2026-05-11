// Phase 18 Plan 18-03 — IDENT-02 sessionId schema validation (D-04 missing-tolerant)
//
// REQUIREMENTS.md IDENT-02 (v1.3-B6 amended 2026-05-11 per Plan 18-01):
//   - sessionId, if present on /api/chat request body, MUST match UUIDv4 regex
//   - sessionId is OPTIONAL — absent sessionId is acceptable (D-04 missing-tolerance
//     branch): server skips ctx.waitUntil(appendTurn(...)) calls entirely while
//     still serving the Anthropic SSE stream (chat UX always wins per D-26).
//   - sessionId NEVER threaded into Anthropic message payload (TEST-03 invariant
//     enforced by tests/api/anthropic-payload-shape.test.ts in Plan 18-04).
//
// Per RESEARCH § "Zod uuid() vs uuidv4() — version specificity":
//   - z.uuidv4() (Zod 4.3.6+) is version-specific — only UUIDv4 shapes pass.
//   - z.uuid() is version-AGNOSTIC (RFC 9562/4122) — UUIDv5/v6/v7 would pass.
//     REJECTED. Test 4 below forward-defends this choice.
//   - z.string().uuid() is the deprecated v4 alias of z.uuid(). REJECTED.
//
// This test file is the FIRST place in the project where server validation
// has a "missing-and-acceptable" code path — Test 2 below explicitly captures
// that exception so future revisions cannot silently strip the .optional().

import { describe, it, expect } from "vitest";
import { validateRequest } from "../../src/lib/validation";

// Hard-coded fixture sessionIds per CONTEXT.md "Claude's Discretion" — sessionIds
// carry no information, just need to be UUIDv4-shaped (or deliberately not).
const VALID_UUIDV4 = "8b0f7f1c-1234-4567-8901-abcdef012345";
// UUIDv5 shape — version nybble is `5` (third group's first hex), not `4`.
// This is the test that distinguishes z.uuidv4() from z.uuid().
const UUIDV5_SHAPE = "8b0f7f1c-1234-5567-8901-abcdef012345";
const MALFORMED_STR = "not-a-uuid";

describe("IDENT-02 — sessionId validation (D-04 missing-tolerant, UUIDv4-specific)", () => {
  it("accepts valid UUIDv4 sessionId — surfaces on result.data.sessionId verbatim", () => {
    const result = validateRequest({
      sessionId: VALID_UUIDV4,
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // Strict equality — schema must surface the field, not strip-and-default.
      expect(result.data.sessionId).toBe(VALID_UUIDV4);
      // messages still validated as before (no regression).
      expect(result.data.messages).toHaveLength(1);
      expect(result.data.messages[0].role).toBe("user");
      expect(result.data.messages[0].content).toBe("Hi");
    }
  });

  it("accepts request with sessionId field absent — D-04 missing-tolerance branch", () => {
    // D-04 amendment to IDENT-02 (Plan 18-01): absent sessionId is acceptable —
    // server skips ctx.waitUntil(appendTurn(...)) entirely while still serving
    // the SSE stream. This is the FIRST "missing-and-acceptable" code path in
    // the project per CONTEXT.md "Specifics" — explicit test prevents future
    // revisions from silently re-mandating the field.
    const result = validateRequest({
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // TS type is `string | undefined` (NOT null, NOT absent — optional Zod field).
      expect(result.data.sessionId).toBeUndefined();
      expect(result.data.messages).toHaveLength(1);
    }
  });

  it("rejects malformed sessionId — random string ('not-a-uuid')", () => {
    const result = validateRequest({
      sessionId: MALFORMED_STR,
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("invalid_request");
    }
  });

  it("rejects UUIDv5-shaped sessionId — version-specificity per IDENT-02", () => {
    // IDENT-02 + RESEARCH § "Zod uuid() vs uuidv4() — version specificity":
    // z.uuidv4() rejects v5; z.uuid() would accept. This test forward-defends
    // the version-specific choice. If the schema is ever loosened to z.uuid(),
    // this test will FAIL and surface the regression at the source-of-truth.
    const result = validateRequest({
      sessionId: UUIDV5_SHAPE,
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("invalid_request");
    }
  });

  it("rejects empty-string sessionId", () => {
    const result = validateRequest({
      sessionId: "",
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("invalid_request");
    }
  });

  it("rejects non-string sessionId — numeric input", () => {
    // z.uuidv4() is a string subtype — numeric input fails the string check
    // first (before regex). Belt-and-suspenders against client bugs that
    // accidentally send Number(sessionId) or similar.
    const result = validateRequest({
      sessionId: 12345,
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("invalid_request");
    }
  });

  it("TS-narrowed sessionId type — string | undefined for both present and absent cases", () => {
    // Encodes the TypeScript narrowing contract as a runtime assertion: after
    // `if (result.success)`, `result.data.sessionId` must be `string | undefined`,
    // never `unknown` or `null`. This catches a regression where the schema field
    // becomes z.unknown() or z.union([z.string(), z.null()]).
    const withSid = validateRequest({
      sessionId: VALID_UUIDV4,
      messages: [{ role: "user", content: "Hi" }],
    });
    const noSid = validateRequest({
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(withSid.success).toBe(true);
    expect(noSid.success).toBe(true);
    if (withSid.success) {
      expect(typeof withSid.data.sessionId === "string").toBe(true);
    }
    if (noSid.success) {
      expect(typeof noSid.data.sessionId === "undefined").toBe(true);
    }
  });
});
