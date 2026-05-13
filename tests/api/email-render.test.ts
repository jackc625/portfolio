// email-render.test.ts — Plan 20-01 happy-path + edge-case battery for the pure
// ChatTranscript -> ResendPayload renderer at src/lib/email/render.ts.
//
// Covers:
//   • MAIL-02 — plaintext body composition (8-line metadata header + provenance
//     line + turn markers; D-11 / D-12 / D-09 / D-10)
//   • MAIL-03 — HTML-escape + CR/LF strip + bidi strip + null-byte strip on
//     every dynamic field (D-07 / Landmine 6 sanitizer ordering)
//   • MAIL-04 — server-controlled subject derivation (D-05 / D-06 / D-07 / D-08)
//   • Renderer purity (Landmine 5) — renderEmail(t) === renderEmail(t)
//
// Wave 0 RED state: src/lib/email/render.ts does NOT yet exist. Imports will
// fail with module-not-found until Task 2 lands the renderer. astro check
// MUST still pass (TypeScript resolves declared exports at typecheck time via
// the bare `from "../../src/lib/email/render"` specifier — vitest catches the
// missing module at runtime).
//
// Adversarial-payload coverage lives in the sibling file
// tests/api/email-render.adversarial.test.ts (MAIL-05 closure with it.each).
//
// Decision IDs referenced: D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-12
// Landmines referenced: 5 (deterministic render), 6 (sanitizer ordering)

import { describe, it, expect } from "vitest";
import {
  renderEmail,
  type ResendPayload,
  type RenderEnv,
} from "../../src/lib/email/render";
import type {
  ChatTranscript,
  StoredTurn,
} from "../../src/lib/chat-transcripts";

// ---------------------------------------------------------------------------
// Constants — fixed across the suite for deterministic-output assertions.
// ---------------------------------------------------------------------------

const SID = "8b0f7f1c-1234-4567-8901-abcdef012345";
const STARTED_AT = "2026-05-12T14:23:08.000Z";
const LAST_ACTIVITY_AT = "2026-05-12T14:31:42.000Z";

const ENV: RenderEnv = {
  CHAT_RECIPIENT_EMAIL: "jackcutrara@gmail.com",
  CHAT_SENDER_EMAIL: '"Portfolio Chat" <transcripts@mail.jackcutrara.com>',
  CHAT_REPLY_TO_EMAIL: "jackcutrara@gmail.com",
};

// AUTHENTIC provenance line literal — must appear byte-identical in body output
// per D-11 / structural anti-impersonation defense.
const PROVENANCE_LINE =
  "From: chat widget on jackcutrara.com — visitor message follows below this line.";

// ---------------------------------------------------------------------------
// Fixture builder — extends tests/api/chat-delivery.test.ts:174-205 shape with
// cacheReadTokens / cacheCreationTokens injection for D-09 / D-10 cases.
// ---------------------------------------------------------------------------

function buildTranscript(opts: {
  sid?: string;
  msgCount?: number;
  truncated?: boolean;
  country?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  region?: string | null;
  startedAt?: string;
  lastActivityAt?: string;
  messages?: StoredTurn[];
  cacheReadTokens?: number[];
  cacheCreationTokens?: number[];
}): ChatTranscript {
  const startedAt = opts.startedAt ?? STARTED_AT;
  const lastActivityAt = opts.lastActivityAt ?? LAST_ACTIVITY_AT;
  const msgCount = opts.msgCount ?? 2;

  let messages: StoredTurn[];
  if (opts.messages) {
    messages = opts.messages;
  } else {
    messages = Array.from({ length: msgCount }, (_, i) => {
      const role: "user" | "assistant" =
        i % 2 === 0 ? "user" : "assistant";
      const turn: StoredTurn = {
        role,
        content: `msg-${i}`,
        ts: startedAt,
      };
      // Distribute cache-token arrays across assistant turns by assistant-index.
      if (role === "assistant") {
        const assistantIdx = Math.floor(i / 2);
        if (
          opts.cacheReadTokens &&
          typeof opts.cacheReadTokens[assistantIdx] === "number"
        ) {
          turn.cache_read_input_tokens = opts.cacheReadTokens[assistantIdx];
        }
        if (
          opts.cacheCreationTokens &&
          typeof opts.cacheCreationTokens[assistantIdx] === "number"
        ) {
          turn.cache_creation_input_tokens =
            opts.cacheCreationTokens[assistantIdx];
        }
      }
      return turn;
    });
  }

  return {
    v: 1,
    sid: opts.sid ?? SID,
    started_at: startedAt,
    last_activity_at: lastActivityAt,
    msg_count: opts.msgCount ?? messages.length,
    truncated: opts.truncated ?? false,
    meta: {
      referrer:
        opts.referrer === undefined
          ? "https://linkedin.com/in/jackcutrara"
          : opts.referrer,
      user_agent:
        opts.userAgent === undefined
          ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/132"
          : opts.userAgent,
      country: opts.country === undefined ? "US" : opts.country,
      region: opts.region === undefined ? "California" : opts.region,
      colo: "SJC",
    },
    messages,
  };
}

// ---------------------------------------------------------------------------
// Subject derivation (D-05 / D-06 / D-07 / D-08)
// ---------------------------------------------------------------------------

describe("subject derivation (D-05/D-06/D-07/D-08)", () => {
  it("subject happy path", () => {
    const t = buildTranscript({
      msgCount: 7,
      country: "US",
      referrer: "https://stackoverflow.com/questions/12345",
    });
    const result: ResendPayload = renderEmail(ENV, t);
    expect(result.subject).toBe(
      "[Portfolio chat] 7 turns from US via stackoverflow.com",
    );
  });

  it("subject null country", () => {
    const t = buildTranscript({
      msgCount: 7,
      country: null,
      referrer: "https://stackoverflow.com/q/1",
    });
    const result = renderEmail(ENV, t);
    expect(result.subject).toContain(" from unknown via ");
    expect(result.subject).toBe(
      "[Portfolio chat] 7 turns from unknown via stackoverflow.com",
    );
  });

  it("subject null referrer", () => {
    const t = buildTranscript({
      msgCount: 7,
      country: "US",
      referrer: null,
    });
    const result = renderEmail(ENV, t);
    expect(result.subject).toContain(" via direct");
    expect(result.subject).toBe(
      "[Portfolio chat] 7 turns from US via direct",
    );
  });

  it("subject country regex", () => {
    // D-07: anything not matching /^[A-Z]{2}$/ falls back to literal "unknown".
    const badCountries = ["usa", "US1", "U", "USA", "us", "U.S"];
    for (const bad of badCountries) {
      const t = buildTranscript({
        msgCount: 3,
        country: bad,
        referrer: "https://example.com",
      });
      const result = renderEmail(ENV, t);
      expect(result.subject).toBe(
        "[Portfolio chat] 3 turns from unknown via example.com",
      );
    }
  });

  it("subject referrer regex", () => {
    // D-07: malformed URL → URL parser throws → "direct" fallback.
    // Also: hostname that doesn't match /^[a-z0-9.-]+$/ → "direct".
    const t1 = buildTranscript({
      msgCount: 2,
      country: "US",
      referrer: "not-a-valid-url",
    });
    expect(renderEmail(ENV, t1).subject).toBe(
      "[Portfolio chat] 2 turns from US via direct",
    );

    // Empty string also → direct
    const t2 = buildTranscript({
      msgCount: 2,
      country: "US",
      referrer: "",
    });
    expect(renderEmail(ENV, t2).subject).toBe(
      "[Portfolio chat] 2 turns from US via direct",
    );
  });

  it("subject truncated suffix", () => {
    const t = buildTranscript({
      msgCount: 30,
      truncated: true,
      country: "US",
      referrer: null,
    });
    const result = renderEmail(ENV, t);
    expect(result.subject).toBe(
      "[Portfolio chat] 30 turns from US via direct (truncated)",
    );
    // Verify the locked literal " (truncated)" exact placement.
    expect(result.subject.endsWith(" (truncated)")).toBe(true);
  });

  it("subject without truncated has no suffix", () => {
    const t = buildTranscript({
      msgCount: 5,
      truncated: false,
      country: "US",
      referrer: null,
    });
    const result = renderEmail(ENV, t);
    expect(result.subject.endsWith("(truncated)")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Body composition (D-11 / D-12)
// ---------------------------------------------------------------------------

describe("body composition (D-11/D-12)", () => {
  it("body metadata header shape", () => {
    const t = buildTranscript({
      msgCount: 8,
      country: "US",
      region: "Mountain View",
      referrer: "https://linkedin.com/in/jackcutrara",
      userAgent: "Mozilla/5.0 (Macintosh) Chrome/132",
    });
    const result = renderEmail(ENV, t);
    // Pull out the first 8 lines of the body — must be the metadata header.
    const lines = result.text.split("\n");
    expect(lines[0]).toMatch(/^Session:\s+8b0f7f1c-1234-4567-8901-abcdef012345$/);
    expect(lines[1]).toMatch(/^Started:\s+2026-05-12T14:23:08\.000Z$/);
    expect(lines[2]).toMatch(/^Last turn:\s+2026-05-12T14:31:42\.000Z \(\d+m \d+s\)$/);
    expect(lines[3]).toMatch(/^From:\s+US · Mountain View$/);
    expect(lines[4]).toMatch(/^Referrer:\s+https:\/\/linkedin\.com\/in\/jackcutrara$/);
    expect(lines[5]).toMatch(/^User-agent:\s+Mozilla\/5\.0 \(Macintosh\) Chrome\/132$/);
    expect(lines[6]).toMatch(/^Messages:\s+8 turns$/);
    expect(lines[7]).toMatch(/^Cache:\s+/);
    // Padded label column — every header label must end at the same column.
    // Labels: "Session:" (8), "Started:" (8), "Last turn:" (10), "From:" (5),
    // "Referrer:" (9), "User-agent:" (11), "Messages:" (9), "Cache:" (6).
    // Minimum padding = max label width = "User-agent:" (11). LABEL_WIDTH=12
    // → header value starts at column 12 → space gap >= 1 for all rows.
    for (let i = 0; i < 8; i++) {
      // Each header line has a colon followed by at least one space before the value.
      expect(lines[i]).toMatch(/^[A-Za-z][A-Za-z- ]+:\s+\S/);
    }
  });

  it("provenance placement", () => {
    const t = buildTranscript({ msgCount: 2 });
    const result = renderEmail(ENV, t);
    const lines = result.text.split("\n");
    // Line 8 is the cache header line (index 7). Line 9 (index 8) is blank.
    // Line 10 (index 9) is provenance. Line 11 (index 10) is blank.
    // Line 12 (index 11) is the first turn marker.
    expect(lines[8]).toBe("");
    expect(lines[9]).toBe(PROVENANCE_LINE);
    expect(lines[10]).toBe("");
    expect(lines[11]).toBe(">>> visitor:");
    // Provenance literal appears EXACTLY ONCE (anti-impersonation invariant).
    const occurrences = result.text.split(PROVENANCE_LINE).length - 1;
    expect(occurrences).toBe(1);
  });

  it("turn marker shape", () => {
    const t = buildTranscript({
      msgCount: 4,
      messages: [
        { role: "user", content: "Question 1", ts: STARTED_AT },
        { role: "assistant", content: "Answer 1", ts: STARTED_AT },
        { role: "user", content: "Question 2", ts: STARTED_AT },
        { role: "assistant", content: "Answer 2", ts: STARTED_AT },
      ],
    });
    const result = renderEmail(ENV, t);
    // Markers must appear on their own line; content below; blank line between turns.
    expect(result.text).toContain(">>> visitor:\nQuestion 1\n\n");
    expect(result.text).toContain("<<< bot:\nAnswer 1\n\n");
    expect(result.text).toContain(">>> visitor:\nQuestion 2\n\n");
    expect(result.text).toContain("<<< bot:\nAnswer 2\n");
    // Sequence integrity: visitor turn 1 precedes bot turn 1.
    const idxV1 = result.text.indexOf("Question 1");
    const idxB1 = result.text.indexOf("Answer 1");
    const idxV2 = result.text.indexOf("Question 2");
    expect(idxV1).toBeLessThan(idxB1);
    expect(idxB1).toBeLessThan(idxV2);
  });

  it("body ends with single trailing newline", () => {
    const t = buildTranscript({ msgCount: 2 });
    const result = renderEmail(ENV, t);
    // Trim trailing blank lines, single \n at end.
    expect(result.text.endsWith("\n")).toBe(true);
    expect(result.text.endsWith("\n\n\n")).toBe(false);
  });

  it("From line handles null region", () => {
    const t = buildTranscript({
      msgCount: 2,
      country: "US",
      region: null,
    });
    const result = renderEmail(ENV, t);
    const lines = result.text.split("\n");
    // Without region, the From line is just "From:       US" (no " · region")
    expect(lines[3]).toMatch(/^From:\s+US$/);
  });
});

// ---------------------------------------------------------------------------
// Cache aggregate (D-09 / D-10)
// ---------------------------------------------------------------------------

describe("cache aggregate (D-09/D-10)", () => {
  it("cache aggregate", () => {
    // 4 turns total; 2 assistant turns; both hit (read > 0).
    // Total read: 7234; total created: 1221. Thousands separators via toLocaleString.
    const t = buildTranscript({
      msgCount: 4,
      messages: [
        { role: "user", content: "Q1", ts: STARTED_AT },
        {
          role: "assistant",
          content: "A1",
          ts: STARTED_AT,
          cache_read_input_tokens: 4234,
          cache_creation_input_tokens: 1221,
        },
        { role: "user", content: "Q2", ts: STARTED_AT },
        {
          role: "assistant",
          content: "A2",
          ts: STARTED_AT,
          cache_read_input_tokens: 3000,
          cache_creation_input_tokens: 0,
        },
      ],
    });
    const result = renderEmail(ENV, t);
    const lines = result.text.split("\n");
    expect(lines[7]).toBe("Cache:      2/2 turns hit, 7,234 read / 1,221 created");
  });

  it("cache aggregate hit count counts only assistant turns with cache_read > 0", () => {
    // 8 turns: 4 assistant; only 2 of the 4 assistant turns have cache_read > 0.
    const messages: StoredTurn[] = [];
    for (let i = 0; i < 8; i++) {
      const role: "user" | "assistant" = i % 2 === 0 ? "user" : "assistant";
      const turn: StoredTurn = { role, content: `m${i}`, ts: STARTED_AT };
      if (role === "assistant") {
        // Assistant indices: 0 (i=1), 1 (i=3), 2 (i=5), 3 (i=7)
        // First 2 hit cache; last 2 don't (cache_read = 0).
        const aIdx = (i - 1) / 2;
        turn.cache_read_input_tokens = aIdx < 2 ? 1000 : 0;
        turn.cache_creation_input_tokens = aIdx === 0 ? 500 : 0;
      }
      messages.push(turn);
    }
    const t = buildTranscript({ msgCount: 8, messages });
    const result = renderEmail(ENV, t);
    const lines = result.text.split("\n");
    expect(lines[7]).toBe("Cache:      2/4 turns hit, 2,000 read / 500 created");
  });

  it("cache aggregate handles missing cache token fields", () => {
    // 2 assistant turns with no cache_read_input_tokens / cache_creation_input_tokens set.
    const t = buildTranscript({
      msgCount: 4,
      messages: [
        { role: "user", content: "Q1", ts: STARTED_AT },
        { role: "assistant", content: "A1", ts: STARTED_AT },
        { role: "user", content: "Q2", ts: STARTED_AT },
        { role: "assistant", content: "A2", ts: STARTED_AT },
      ],
    });
    const result = renderEmail(ENV, t);
    const lines = result.text.split("\n");
    expect(lines[7]).toBe("Cache:      0/2 turns hit, 0 read / 0 created");
  });

  it("cache aggregate uses toLocaleString thousands separators for big numbers", () => {
    const t = buildTranscript({
      msgCount: 2,
      messages: [
        { role: "user", content: "Q1", ts: STARTED_AT },
        {
          role: "assistant",
          content: "A1",
          ts: STARTED_AT,
          cache_read_input_tokens: 1234567,
          cache_creation_input_tokens: 98765,
        },
      ],
    });
    const result = renderEmail(ENV, t);
    const lines = result.text.split("\n");
    expect(lines[7]).toContain("1,234,567 read / 98,765 created");
  });

  it("cache aggregate at line 8 of header (D-09 hoist)", () => {
    // D-09 specifies Cache is the 8th line of the metadata header (after the
    // pre-D-09 7-line block).
    const t = buildTranscript({ msgCount: 2 });
    const result = renderEmail(ENV, t);
    const lines = result.text.split("\n");
    expect(lines[7]).toMatch(/^Cache:\s+/);
    // The blank separator immediately follows the cache line.
    expect(lines[8]).toBe("");
  });
});

// ---------------------------------------------------------------------------
// HTML escape (MAIL-03)
// ---------------------------------------------------------------------------

describe("HTML escape (MAIL-03)", () => {
  it("html escape", () => {
    // Visitor content with all 5 dangerous chars: < > & " '
    const t = buildTranscript({
      msgCount: 2,
      messages: [
        {
          role: "user",
          content: `<a href="x">'hi' & "world"</a>`,
          ts: STARTED_AT,
        },
        { role: "assistant", content: "ok", ts: STARTED_AT },
      ],
    });
    const result = renderEmail(ENV, t);
    // Every dangerous char must be entity-encoded.
    expect(result.text).toContain("&lt;a href=&quot;x&quot;&gt;");
    expect(result.text).toContain("&#39;hi&#39;");
    expect(result.text).toContain("&amp;");
    expect(result.text).toContain("&quot;world&quot;");
    expect(result.text).toContain("&lt;/a&gt;");
    // Raw characters must NOT appear in any visitor-rendered region.
    // (The metadata header above MAY contain `:` followed by spaces but not raw `<`.)
    expect(result.text).not.toContain("<a href=");
    expect(result.text).not.toContain("</a>");
  });

  it("html escape applies to referrer + user-agent + country", () => {
    // Adversarial meta values — these should be regex-filtered for subject but
    // also HTML-escaped in the body.
    const t = buildTranscript({
      msgCount: 2,
      country: '"<US>"',
      referrer: "https://example.com/<bad>",
      userAgent: 'Mozilla/<5.0> "ua"',
    });
    const result = renderEmail(ENV, t);
    // Country in body From line is escaped.
    expect(result.text).toContain("&quot;&lt;US&gt;&quot;");
    // Referrer in body Referrer line is escaped.
    expect(result.text).toContain("https://example.com/&lt;bad&gt;");
    // User-agent escaped.
    expect(result.text).toContain("Mozilla/&lt;5.0&gt; &quot;ua&quot;");
    // Subject country fallback to "unknown" since `"<US>"` doesn't match /^[A-Z]{2}$/
    expect(result.subject).toContain("from unknown via");
  });

  it("html escape ampersand first ordering (no double-encoding)", () => {
    const t = buildTranscript({
      msgCount: 2,
      messages: [
        { role: "user", content: "&lt;already-escaped&gt;", ts: STARTED_AT },
        { role: "assistant", content: "ok", ts: STARTED_AT },
      ],
    });
    const result = renderEmail(ENV, t);
    // The literal `&` becomes `&amp;`; the `<` and `>` are already escaped in
    // source but their constituent chars are NOT — we expect `&amp;lt;` etc.
    expect(result.text).toContain("&amp;lt;already-escaped&amp;gt;");
    // Should NOT contain `&amp;amp;` (would indicate ampersand encoded twice).
    expect(result.text).not.toContain("&amp;amp;");
  });
});

// ---------------------------------------------------------------------------
// CR/LF strip on subject (MAIL-03)
// ---------------------------------------------------------------------------

describe("CR/LF strip on subject (MAIL-03)", () => {
  it("crlf strip subject", () => {
    // Even though country/referrer regex would normally reject CR/LF, this is
    // defense-in-depth — the subject sanitizer pipeline MUST include stripCrLf.
    // Construct a transcript with a country that, if accepted, would carry CR/LF.
    // The country regex pin will reject this anyway, but verify subject has no \r or \n.
    const t = buildTranscript({
      msgCount: 2,
      country: "US\r\nBcc: evil@example.com",
      referrer: null,
    });
    const result = renderEmail(ENV, t);
    expect(result.subject).not.toContain("\r");
    expect(result.subject).not.toContain("\n");
    // Country regex rejects → "unknown" fallback.
    expect(result.subject).toBe(
      "[Portfolio chat] 2 turns from unknown via direct",
    );
  });

  it("crlf strip subject (referrer host)", () => {
    // Hostname extracted from a malformed URL containing CR/LF → URL parser
    // either throws or the resulting hostname fails the host regex → "direct".
    const t = buildTranscript({
      msgCount: 2,
      country: "US",
      referrer: "https://example.com\r\nBcc:%20evil",
    });
    const result = renderEmail(ENV, t);
    expect(result.subject).not.toContain("\r");
    expect(result.subject).not.toContain("\n");
  });
});

// ---------------------------------------------------------------------------
// Renderer purity (Landmine 5)
// ---------------------------------------------------------------------------

describe("renderer purity (Landmine 5)", () => {
  it("renderer purity", () => {
    // renderEmail(ENV, t) called twice with the same input MUST return deeply
    // equal output. NO Date.now(), NO crypto.randomUUID(), NO env reads beyond
    // the threaded RenderEnv. Acceptance criterion is the load-bearing
    // invariant for Resend Idempotency-Key matching across retries.
    const t = buildTranscript({
      msgCount: 4,
      messages: [
        { role: "user", content: "Q1", ts: STARTED_AT },
        {
          role: "assistant",
          content: "A1",
          ts: STARTED_AT,
          cache_read_input_tokens: 100,
          cache_creation_input_tokens: 50,
        },
        { role: "user", content: "Q2", ts: STARTED_AT },
        {
          role: "assistant",
          content: "A2",
          ts: STARTED_AT,
          cache_read_input_tokens: 200,
          cache_creation_input_tokens: 0,
        },
      ],
    });
    const r1 = renderEmail(ENV, t);
    const r2 = renderEmail(ENV, t);
    expect(r1).toEqual(r2);
    // Defense-in-depth: identity-by-value on each field.
    expect(r1.from).toBe(r2.from);
    expect(r1.to).toBe(r2.to);
    expect(r1.reply_to).toBe(r2.reply_to);
    expect(r1.subject).toBe(r2.subject);
    expect(r1.text).toBe(r2.text);
    expect(r1.idempotency_key).toBe(r2.idempotency_key);
  });

  it("idempotency key is transcript/{sid} literal", () => {
    const t = buildTranscript({ sid: "abc-123" });
    const result = renderEmail(ENV, t);
    expect(result.idempotency_key).toBe("transcript/abc-123");
  });

  it("payload threads envelope literals from env", () => {
    const t = buildTranscript({ msgCount: 2 });
    const result = renderEmail(ENV, t);
    expect(result.from).toBe(ENV.CHAT_SENDER_EMAIL);
    expect(result.to).toBe(ENV.CHAT_RECIPIENT_EMAIL);
    expect(result.reply_to).toBe(ENV.CHAT_REPLY_TO_EMAIL);
  });
});
