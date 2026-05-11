// chat-transcripts.ts — pure KV write module for `/api/chat` transcript persistence.
//
// Owns the entire Phase 18 KV write contract:
//   • KV-02 — schema versioning (`v: 1`) + 30-day TTL on every put
//   • KV-03 — KV `metadata` field for Phase 19 cron list({prefix}) forward-compat
//   • KV-04 — 30-turn drop-oldest sliding window + truncated one-way flag
//             + referrer / user_agent truncation to 512 chars
//   • KV-05 — per-sessionId rolling 1-hour write quota of 100 (D-12)
//   • META-01 — first-turn metadata pin (referrer, user_agent, country,
//               region, colo — server snapshots once and preserves)
//
// Decision IDs honored in this module:
//   D-05 — drop-oldest sliding window at cap
//   D-06 — truncated=true is one-way (never unset)
//   D-07 — 30 = individual messages (matches RequestSchema.messages.max(30))
//   D-09 — silent posture: errors surface to the CALLER's .catch chain
//          (RESEARCH § Pitfall 1 — ctx.waitUntil swallows rejections without
//          an explicit .catch chained before the promise is passed in)
//   D-12 — per-sessionId quota; rejected writes emit chat.transcript.quota_exceeded
//   D-13 — concurrent-write race observability (last-writer-wins on the put)
//
// Pure module. NO imports from:
//   • @anthropic-ai/sdk          — caller (api/chat.ts) handles Anthropic
//   • cloudflare:workers         — caller passes kv: KVNamespace directly
//   • src/prompts/, src/pages/   — no chat-surface coupling
//
// Callers wrap appendTurn with ctx.waitUntil(...) and chain .catch() per
// RESEARCH § Pattern 1 + § Pitfall 1; see Plan 18-05 wiring spec.

// ---------------------------------------------------------------------------
// Locked constants — Plan 18-05 imports these verbatim.
// ---------------------------------------------------------------------------

export const KEY_PREFIX = "live:";
export const TRANSCRIPT_TTL_SECONDS = 30 * 24 * 3600; // KV-02 — 30 days
export const TURN_CAP = 30; // KV-04 / D-07 — matches validation.ts max(30)
export const REFERRER_MAX = 512; // KV-04 — log-poisoning defense ceiling
export const USER_AGENT_MAX = 512; // KV-04 — same ceiling for UA
export const QUOTA_WINDOW_MS = 60 * 60 * 1000; // KV-05 / D-12 — rolling 1h
export const QUOTA_CAP = 100; // KV-05 / D-12 — locked per Plan 18-01

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface AppendTurnMeta {
  referrer: string | null;
  user_agent: string | null;
  country: string | null;
  region: string | null;
  colo: string | null;
  // Assistant-turn-only cache token capture (META-02 source-of-truth-once
  // from api/chat.ts cacheUsage closure — Plan 18-05 / Plan 18-07).
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

export interface StoredTurn {
  role: "user" | "assistant";
  content: string;
  ts: string; // ISO 8601
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

export interface ChatTranscript {
  v: 1; // KV-02 — schema versioning discriminator
  sid: string;
  started_at: string; // ISO 8601 — first turn timestamp, immutable after first put
  last_activity_at: string; // ISO 8601 — refreshed on every put
  msg_count: number;
  truncated: boolean; // D-06 — one-way flag
  meta: {
    referrer: string | null;
    user_agent: string | null;
    country: string | null;
    region: string | null;
    colo: string | null;
  };
  messages: StoredTurn[]; // length ≤ TURN_CAP
}

export interface KVMetadata {
  last_activity_at: string;
  msg_count: number;
  window_started_at: string;
  window_count: number;
}

// ---------------------------------------------------------------------------
// File-local helpers
// ---------------------------------------------------------------------------

// KV-04 — log-poisoning defense: any string field that originates from a
// request header gets truncated at this module's boundary so downstream
// consumers (Phase 20 email renderer, Workers Logs queries) never see
// unbounded user-controlled input.
function truncate(value: string | null, max: number): string | null {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) : value;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read-modify-write the `live:{sessionId}` transcript with one new turn.
 *
 * The full Phase 18 KV write contract lives inside this function — see the
 * decision-ID inline comments below for the precise behavior locked by each
 * spec decision.
 *
 * @throws on KV.put failure. Per D-09 the .catch chain is the CALLER's
 *   responsibility — RESEARCH § Pitfall 1 (ctx.waitUntil swallows rejections
 *   without an explicit .catch chained before the promise is passed in).
 */
export async function appendTurn(
  kv: KVNamespace,
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  meta: AppendTurnMeta,
): Promise<void> {
  const key = KEY_PREFIX + sessionId;
  const nowIso = new Date().toISOString();
  const nowMs = Date.parse(nowIso);

  // Read existing transcript + metadata in one round-trip. Phase 19 cron will
  // depend on the metadata-on-list pattern; this module IS the producer.
  const { value: existing, metadata: existingMeta } =
    await kv.getWithMetadata<ChatTranscript, KVMetadata>(key, { type: "json" });

  // -------------------------------------------------------------------------
  // KV-05 / D-12 — per-sessionId quota guard. Inline metadata for cheapest
  // path (RESEARCH §"KV-05 quota storage shape"; lossy increment acceptable
  // per Pitfall 7 — quota is a guard, not a precise threshold).
  // -------------------------------------------------------------------------
  let windowStartedAt = nowIso;
  let windowCount = 1;
  if (existingMeta) {
    const windowAgeMs = nowMs - Date.parse(existingMeta.window_started_at);
    if (windowAgeMs < QUOTA_WINDOW_MS) {
      // Window still active.
      if (existingMeta.window_count >= QUOTA_CAP) {
        // D-12 — silent reject; emit observability log; return without put
        // so the caller's ctx.waitUntil resolves cleanly (D-09 same silent
        // posture as write failures — chat UX always wins per D-26).
        console.warn("chat.transcript.quota_exceeded", {
          sessionId,
          count_in_window: existingMeta.window_count,
        });
        return;
      }
      windowStartedAt = existingMeta.window_started_at;
      windowCount = existingMeta.window_count + 1;
    }
    // else: window expired — fall through to fresh window (windowStartedAt
    // = nowIso, windowCount = 1).
  }

  // -------------------------------------------------------------------------
  // D-13 — concurrent-write race observability. If a prior put recorded
  // msg_count: N but the value we just read has fewer messages than N, the
  // KV value is a cross-POP stale read (RESEARCH § Pitfall 2). Last-writer-
  // wins: we proceed with the put. The log is observability only; per
  // CONTEXT.md critical-constraint resolution (b) the "in_memory_tail_len"
  // sourced here is existingMeta.msg_count (the prior-put tail size).
  // -------------------------------------------------------------------------
  if (existingMeta) {
    const currentReadLen = existing?.messages.length ?? 0;
    if (currentReadLen < existingMeta.msg_count) {
      console.warn("chat.transcript.race_suspected", {
        sessionId,
        in_memory_tail_len: existingMeta.msg_count,
        kv_read_len: currentReadLen,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Build the new StoredTurn. Assistant turns carry cache token fields from
  // the meta arg when present (META-02 source-of-truth-once).
  // -------------------------------------------------------------------------
  const newTurn: StoredTurn = {
    role,
    content,
    ts: nowIso,
  };
  if (role === "assistant") {
    if (typeof meta.cache_read_input_tokens === "number") {
      newTurn.cache_read_input_tokens = meta.cache_read_input_tokens;
    }
    if (typeof meta.cache_creation_input_tokens === "number") {
      newTurn.cache_creation_input_tokens = meta.cache_creation_input_tokens;
    }
  }

  // -------------------------------------------------------------------------
  // META-01 — session-level metadata is pinned on the first turn. If a prior
  // transcript exists, we preserve its meta block byte-identically; otherwise
  // we snapshot the meta arg, truncating referrer / user_agent to bound the
  // KV value size + log surface (KV-04 log-poisoning defense).
  // -------------------------------------------------------------------------
  const sessionMeta: ChatTranscript["meta"] = existing?.meta
    ? existing.meta
    : {
        referrer: truncate(meta.referrer, REFERRER_MAX),
        user_agent: truncate(meta.user_agent, USER_AGENT_MAX),
        country: meta.country ?? null,
        region: meta.region ?? null,
        colo: meta.colo ?? null,
      };

  // -------------------------------------------------------------------------
  // D-05 / D-06 / D-07 — append + 30-turn drop-oldest trim (RESEARCH §
  // Pitfall 6 exact implementation). truncated flips one-way to true the
  // first time a drop happens; never unset on subsequent in-cap writes.
  // -------------------------------------------------------------------------
  const next: StoredTurn[] = [...(existing?.messages ?? []), newTurn];
  let truncated = existing?.truncated ?? false;
  if (next.length > TURN_CAP) {
    next.splice(0, next.length - TURN_CAP);
    truncated = true; // D-06 — one-way set
  }

  const updated: ChatTranscript = {
    v: 1, // KV-02 — schema discriminator
    sid: sessionId,
    started_at: existing?.started_at ?? nowIso,
    last_activity_at: nowIso,
    msg_count: next.length,
    truncated,
    meta: sessionMeta,
    messages: next,
  };

  const nextMetadata: KVMetadata = {
    last_activity_at: nowIso,
    msg_count: next.length,
    window_started_at: windowStartedAt,
    window_count: windowCount,
  };

  // KV-02 — expirationTtl on every put. KV-03 — metadata on every put.
  // D-09 — no try/catch; the rejection surfaces to the caller's .catch
  // chain which lives at the call site in api/chat.ts (Plan 18-05).
  await kv.put(key, JSON.stringify(updated), {
    expirationTtl: TRANSCRIPT_TTL_SECONDS,
    metadata: nextMetadata,
  });
}
