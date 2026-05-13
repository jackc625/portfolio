// render.ts — pure ChatTranscript -> ResendPayload renderer for Phase 20.
//
// Owns the entire Phase 20 render contract:
//   • MAIL-02 — plaintext text-body composition (8-line metadata header +
//               provenance line + turn markers)
//   • MAIL-03 — defense-in-depth sanitizer pipeline (control-char strip,
//               CR/LF strip for subject components, bidi-override strip,
//               HTML entity escape) applied to every dynamic field
//   • MAIL-04 — server-controlled subject derivation with locked envelope
//               literals threaded from RenderEnv
//   • MAIL-05 — adversarial-payload safe rendering (covered by sibling
//               adversarial test battery)
//
// Decision IDs honored in this module:
//   D-05 — null country -> literal "unknown" subject token
//   D-06 — null referrer -> literal "direct" subject token
//   D-07 — strict charset on subject interpolations: country pinned to
//          /^[A-Z]{2}$/, referrer-host pinned to /^[a-z0-9.-]+$/, hostname
//          extracted via new URL().hostname.toLowerCase()
//   D-08 — truncated suffix = trailing " (truncated)" parenthetical
//   D-09 — cache-aggregate one-liner hoisted to line 8 of metadata header
//   D-10 — cache aggregate format with thousands separators via
//          Number.toLocaleString("en-US")
//   D-11 — 8-line metadata header with padded label column + provenance line
//          below, separated by blank lines
//   D-12 — turn markers >>> visitor: / <<< bot: on own line; raw content
//          below; blank line between turns
//   D-17 — Result variant collapse is consumed downstream (resend.ts) — the
//          renderer itself is unaffected; idempotency_key shape is locked
//          here (`transcript/${sid}`)
//
// Landmines mitigated:
//   Landmine 5 — fully deterministic: renderEmail(env, t) === renderEmail(env, t)
//                deep-equals across two invocations. NO Date.now(), NO
//                crypto.randomUUID(), NO env reads beyond the threaded
//                RenderEnv. ALL timestamps come from transcript fields.
//   Landmine 6 — sanitizer pipeline ordering is fixed:
//                  stripControlChars -> stripCrLf (subject only)
//                  -> stripBidiOverrides -> htmlEscape
//                Each dynamic field flows through this composition.
//   Landmine 9 — payload object literal has stable key ordering (ES2015
//                spec) so the JSON body is byte-identical across retries,
//                preserving Resend Idempotency-Key matching.
//
// Pure module. NO imports from:
//   • @anthropic-ai/sdk          — renderer has no LLM surface
//   • cloudflare:workers         — caller threads RenderEnv; KVNamespace
//                                  not needed
//   • src/prompts/, src/pages/   — no chat-surface coupling (D-26 anchor)
//   • src/scripts/chat.ts        — browser-tier surface
//   • src/lib/chat-delivery.ts   — renderer is UPSTREAM of chat-delivery;
//                                  the reverse direction would create a
//                                  module-dependency cycle. The
//                                  hostnameOrNull pattern is mirrored
//                                  inline (deriveReferrerHostToken) per
//                                  20-PATTERNS.md Group 1 guidance.

import type { ChatTranscript } from "../chat-transcripts";

// ---------------------------------------------------------------------------
// Locked constants
// ---------------------------------------------------------------------------

const LABEL_WIDTH = 12; // D-11 — header label column width (max label is "User-agent:" = 11 chars + 1 separator space)

// D-11 / structural anti-impersonation defense — verbatim provenance literal.
// The em dash (U+2014) is intentional and byte-distinct.
const PROVENANCE =
  "From: chat widget on jackcutrara.com — visitor message follows below this line.";

const COUNTRY_PATTERN = /^[A-Z]{2}$/; // D-07 — strict ISO-3166-1 alpha-2
const HOST_PATTERN = /^[a-z0-9.-]+$/; // D-07 — post-URL-parse host charset

const COUNTRY_FALLBACK = "unknown"; // D-05
const REFERRER_HOST_FALLBACK = "direct"; // D-06
const TRUNCATED_SUFFIX = " (truncated)"; // D-08 — leading space + parenthetical

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Narrowed env shape consumed by `renderEmail`. The Plan 20-02 wrapper +
 * Plan 20-03 wiring re-use this shape via the cron-tick env.
 */
export interface RenderEnv {
  CHAT_RECIPIENT_EMAIL: string;
  CHAT_SENDER_EMAIL: string;
  CHAT_REPLY_TO_EMAIL: string;
}

/**
 * Fully-rendered Resend POST payload. The Plan 20-02 wrapper consumes this
 * directly — the renderer produces, the wrapper transports.
 *
 * Key ordering is locked by ES2015 spec preservation of object-literal order;
 * this guarantees byte-identical JSON body across two invocations (Landmine 9).
 */
export interface ResendPayload {
  from: string;
  to: string;
  reply_to: string;
  subject: string;
  text: string;
  idempotency_key: string;
}

// ---------------------------------------------------------------------------
// File-local sanitizer helpers (Landmine 6 ordering)
// ---------------------------------------------------------------------------

/**
 * Strip C0 control characters except \t \n \r (which are allowed in text
 * bodies). \r is stripped separately for subject components via stripCrLf.
 *
 * Pattern reference: 20-RESEARCH.md § Code Example 1.
 */
function stripControlChars(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Strip CR/LF entirely — RFC 5322 header-injection defense for subject
 * components.
 */
function stripCrLf(s: string): string {
  return s.replace(/[\r\n]/g, "");
}

/**
 * Strip Unicode bidi-override codepoints:
 *   U+061C ALM (Arabic Letter Mark)
 *   U+200E LRM (Left-to-Right Mark), U+200F RLM (Right-to-Left Mark)
 *   U+202A LRE, U+202B RLE, U+202C PDF, U+202D LRO, U+202E RLO
 *   U+2066 LRI, U+2067 RLI, U+2068 FSI, U+2069 PDI
 *
 * WR-03 (Phase 20 code review) — added ALM/LRM/RLM. The original regex
 * only covered U+202A..U+202E and U+2066..U+2069, missing the three
 * single-char marks that OWASP / Unicode Technical Report #36 list as
 * high-risk for visual spoofing.
 */
function stripBidiOverrides(s: string): string {
  return s.replace(/[؜‎‏‪-‮⁦-⁩]/g, "");
}

/**
 * HTML entity escape for the 5 dangerous characters. & MUST come first to
 * avoid double-encoding (Landmine 6 ordering).
 */
function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Body-field sanitizer composition. Applied to every dynamic body value:
 * visitor content, bot content, referrer, user-agent, country, region.
 *
 * Order: strip-controls -> strip-bidi -> html-escape.
 */
function escapeBodyField(raw: string | null): string {
  if (raw == null) return "";
  return htmlEscape(stripBidiOverrides(stripControlChars(raw)));
}

// ---------------------------------------------------------------------------
// Subject helpers (D-05/D-06/D-07/D-08)
// ---------------------------------------------------------------------------

/**
 * D-05 + D-07 — return country verbatim only if it matches /^[A-Z]{2}$/;
 * otherwise the literal "unknown" fallback token.
 *
 * The regex pin alone rejects every non-ISO-3166-1-alpha-2 value (including
 * adversarial CR/LF / bidi / HTML payloads). No further sanitization needed
 * before subject interpolation.
 */
function deriveCountryToken(country: string | null): string {
  if (country && COUNTRY_PATTERN.test(country)) return country;
  return COUNTRY_FALLBACK;
}

/**
 * D-06 + D-07 — extract hostname via `new URL().hostname.toLowerCase()`, then
 * confirm the result matches /^[a-z0-9.-]+$/. Any failure path returns the
 * literal "direct" fallback token.
 *
 * Pattern mirrored from src/lib/chat-delivery.ts:108-115 hostnameOrNull;
 * duplicated inline (not re-exported) to keep this module pure — no
 * chat-delivery import surface coupling.
 */
function deriveReferrerHostToken(referrer: string | null): string {
  if (!referrer) return REFERRER_HOST_FALLBACK;
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return REFERRER_HOST_FALLBACK;
  }
  if (!HOST_PATTERN.test(host)) return REFERRER_HOST_FALLBACK;
  return host;
}

/**
 * D-07 defense-in-depth — apply the full subject sanitizer pipeline
 * (strip-controls -> strip-crlf -> strip-bidi -> html-escape) to any token
 * before interpolation. For tokens that already pass the strict regex, this
 * is a no-op; it's a defensive belt over the regex suspenders.
 */
function sanitizeSubjectToken(raw: string): string {
  return htmlEscape(
    stripBidiOverrides(stripCrLf(stripControlChars(raw))),
  );
}

/**
 * Compose the server-controlled subject line.
 *
 * Format (D-08 truncated suffix appended when truncated):
 *   `[Portfolio chat] N turns from <country> via <referrer-host>[ (truncated)]`
 */
function composeSubject(transcript: ChatTranscript): string {
  const country = sanitizeSubjectToken(
    deriveCountryToken(transcript.meta.country),
  );
  const referrerHost = sanitizeSubjectToken(
    deriveReferrerHostToken(transcript.meta.referrer),
  );
  const truncatedSuffix = transcript.truncated ? TRUNCATED_SUFFIX : "";
  return `[Portfolio chat] ${transcript.msg_count} turns from ${country} via ${referrerHost}${truncatedSuffix}`;
}

// ---------------------------------------------------------------------------
// Cache-aggregate helper (D-09/D-10)
// ---------------------------------------------------------------------------

/**
 * D-09 + D-10 — aggregate cache one-liner.
 *
 * Format: `{hits}/{total} turns hit, {totalRead:locale} read / {totalCreated:locale} created`
 * - total = count of assistant turns in transcript
 * - hits  = count of assistant turns with cache_read_input_tokens > 0
 * - totalRead / totalCreated = sum across all assistant turns, with
 *   thousands separators via `Number.toLocaleString("en-US")` (works in the
 *   Workers runtime without external locale data per RESEARCH § specifics)
 */
function deriveCacheLine(transcript: ChatTranscript): string {
  const assistantTurns = transcript.messages.filter(
    (m) => m.role === "assistant",
  );
  const total = assistantTurns.length;
  const hits = assistantTurns.filter(
    (m) => (m.cache_read_input_tokens ?? 0) > 0,
  ).length;
  const totalRead = assistantTurns.reduce(
    (sum, m) => sum + (m.cache_read_input_tokens ?? 0),
    0,
  );
  const totalCreated = assistantTurns.reduce(
    (sum, m) => sum + (m.cache_creation_input_tokens ?? 0),
    0,
  );
  return `${hits}/${total} turns hit, ${totalRead.toLocaleString("en-US")} read / ${totalCreated.toLocaleString("en-US")} created`;
}

// ---------------------------------------------------------------------------
// Body helpers (D-11/D-12)
// ---------------------------------------------------------------------------

/**
 * Pad a header label to LABEL_WIDTH characters using right-padded spaces.
 *
 * The widest label is "User-agent:" at 11 chars; LABEL_WIDTH=12 guarantees
 * a 1-space gap between every label and the value that follows.
 */
function pad(label: string): string {
  return label.padEnd(LABEL_WIDTH);
}

/**
 * Format an elapsed milliseconds duration as `Xm Ys`.
 *
 * Examples: 514_000 -> "8m 34s", 0 -> "0m 0s", 65_000 -> "1m 5s".
 */
function formatDuration(durationMs: number): string {
  // CR-01 (Phase 20 code review) — belt-over-suspenders NaN/Infinity coerce.
  // composeBody already guards the call site against NaN inputs from
  // Date.parse, but `formatDuration` is reached by any future caller too;
  // coerce non-finite to 0 so this helper is safe in isolation.
  const safeMs = Number.isFinite(durationMs) ? durationMs : 0;
  const totalSeconds = Math.max(0, Math.floor(safeMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * Compose the 8-line metadata header + provenance line + turn-markers body.
 *
 * Final structure:
 *   lines 1-8: metadata header (Session, Started, Last turn, From, Referrer,
 *              User-agent, Messages, Cache)
 *   line 9:    blank
 *   line 10:   AUTHENTIC provenance literal
 *   line 11:   blank
 *   lines 12+: turn markers + content + blank-line separators
 *   trailing:  single \n
 */
function composeBody(transcript: ChatTranscript): string {
  const meta = transcript.meta;
  const startMs = Date.parse(transcript.started_at);
  const lastMs = Date.parse(transcript.last_activity_at);
  // CR-01 (Phase 20 code review) — guard against malformed ISO timestamps.
  // `Math.max(0, NaN)` returns NaN, not 0; without this guard a corrupted
  // KV entry, manual KV edit, or buggy migration tool would produce a
  // literal "(NaNm NaNs)" suffix on the "Last turn" header line. Mirrors
  // the chat-delivery.ts:504 NaN guard added for the same reason against
  // metadata.last_activity_at.
  const durationMs =
    Number.isNaN(startMs) || Number.isNaN(lastMs)
      ? 0
      : Math.max(0, lastMs - startMs);
  const durationLabel = formatDuration(durationMs);

  // Sid is server-generated (UUID) and not visitor-typable but flows through
  // the same escape pipeline as defensive belt-over-suspenders.
  const sidEscaped = escapeBodyField(transcript.sid);
  const countryEscaped = escapeBodyField(meta.country);
  const regionEscaped = escapeBodyField(meta.region);
  const fromValue = regionEscaped
    ? `${countryEscaped} · ${regionEscaped}`
    : countryEscaped;

  const headerLines = [
    `${pad("Session:")}${sidEscaped}`,
    `${pad("Started:")}${transcript.started_at}`,
    `${pad("Last turn:")}${transcript.last_activity_at} (${durationLabel})`,
    `${pad("From:")}${fromValue}`,
    `${pad("Referrer:")}${escapeBodyField(meta.referrer)}`,
    `${pad("User-agent:")}${escapeBodyField(meta.user_agent)}`,
    `${pad("Messages:")}${transcript.msg_count} turns`,
    `${pad("Cache:")}${deriveCacheLine(transcript)}`, // D-09 — line 8
  ];

  const turnLines = transcript.messages.flatMap((m) => [
    m.role === "user" ? ">>> visitor:" : "<<< bot:",
    escapeBodyField(m.content),
    "", // D-12 — blank line between turns
  ]);

  return (
    [
      ...headerLines,
      "", // D-11 — blank between header and provenance
      PROVENANCE,
      "", // D-11 — blank between provenance and turns
      ...turnLines,
    ]
      .join("\n")
      .trimEnd() + "\n"
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Transform a ChatTranscript into a Resend-ready POST payload.
 *
 * Pure function. No side effects. No env reads beyond the threaded
 * RenderEnv. No Date.now(), no crypto.randomUUID() — all timing values come
 * from transcript fields. Two invocations with the same input return deeply
 * equal output (Landmine 5).
 *
 * @param env       — narrowed env shape with the three envelope literals
 * @param transcript — Phase 18 `live:{sid}` value at delivery time
 * @returns the ResendPayload that Plan 20-02's `sendEmail` POSTs
 */
export function renderEmail(
  env: RenderEnv,
  transcript: ChatTranscript,
): ResendPayload {
  return {
    from: env.CHAT_SENDER_EMAIL,
    to: env.CHAT_RECIPIENT_EMAIL,
    reply_to: env.CHAT_REPLY_TO_EMAIL,
    subject: composeSubject(transcript),
    text: composeBody(transcript),
    idempotency_key: `transcript/${transcript.sid}`,
  };
}
