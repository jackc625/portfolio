# Phase 20: Email Render + Resend Integration — Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 12 (2 NEW source modules, 1 EDIT source, 1 EDIT config, 5 NEW tests, 1 EXTEND test, 2 NEW phase docs)
**Analogs found:** 12 / 12 (100%)
**Match quality:** 8 exact-role / 4 role-match

---

## File Classification

| Phase 20 File | Role | Data Flow | Closest Analog | Match Quality |
|--------------|------|-----------|----------------|---------------|
| `src/lib/email/resend.ts` (NEW) | pure module / HTTP wrapper | request-response (outbound) | `scripts/resend-warmup.mjs` (lines 41-64) + `src/lib/chat-delivery.ts` (lines 128-149 retry harness) | exact (wire-shape oracle) |
| `src/lib/email/render.ts` (NEW) | pure module / data transform | transform (ChatTranscript → ResendPayload) | `src/lib/chat-transcripts.ts` (lines 30-101) + `src/lib/validation.ts` (lines 56-63) | exact (pure-module pattern) |
| `src/lib/chat-delivery.ts` (EDIT) | wiring edit (substitution + additive type extension) | event-driven (cron handler) | self (lines 163-184 substitution; lines 66-73 interface; lines 268-281 PUT site) | exact (in-place edit) |
| `wrangler.jsonc` (EDIT) | config (single-line value flip) | config | self (line 21 `vars.DRY_RUN`) | exact (single-line) |
| `tests/api/email-render.test.ts` (NEW) | unit test | transform-output assertion | `tests/api/chat-delivery.test.ts` (lines 174-205 fixture builder + lines 264-289 vitest shape) | role-match (renderer not cron) |
| `tests/api/email-render.adversarial.test.ts` (NEW) | unit test (it.each table) | adversarial input enumeration | `tests/api/chat-voice-split.test.ts` (lines 30-61 single-fixture pattern) — `it.each` shape borrowed from vitest standard | role-match (no exact `it.each` row precedent in this repo, see "No Analog Found") |
| `tests/api/email-resend.test.ts` (NEW) | unit test (mocked global fetch) | request-response (outbound mock) | `tests/api/cache-hit-logs.test.ts` (lines 14-105 vi.mock + console-spy + Anthropic mock) | role-match (mock-fetch not mock-Anthropic) |
| `tests/api/chat-delivery.test.ts` (EXTEND) | unit test extension | event-driven assertions | self (existing 685+ LOC battery; extend GROUP D and add new groups) | exact (in-file extension) |
| `tests/build/chat-delivery-send-site.test.ts` (NEW, OPTIONAL) | source-text guard | static analysis | `tests/build/append-turn-call-site.test.ts` (lines 21-87 readFileSync + regex invariants) | exact (sibling pattern) |
| `tests/build/wrangler-dry-run-shape.test.ts` (NEW, OPTIONAL) | source-text guard | static analysis (JSONC) | `tests/build/wrangler-cron-shape.test.ts` (lines 25-51 parseJsonc + invariant assertions) | exact (sibling — same file, paired invariant) |
| `20-UAT.md` (NEW) | phase-end doc | numbered manual operator UAT | `.planning/phases/19-cron-sweep-scheduling-idempotency-dry-run/19-UAT.md` (lines 1-120 frontmatter + numbered Steps + expected/result blocks) | exact |
| `DEPLOY-GATE.md` (NEW) | phase-end doc | operator-confirmation gate | `.planning/phases/17-foundations-migration-dns-debt-sweep/DEPLOY-GATE.md` (lines 1-80 frontmatter + checklist + post-deploy verification) | exact |

---

## Pattern Assignments

### Group 1 — Email module (`src/lib/email/*`)

#### `src/lib/email/resend.ts` (NEW; ~80-150 LOC; pure HTTP wrapper)

**Primary analog:** `scripts/resend-warmup.mjs` lines 41-64 (wire-shape oracle).
**Secondary analog:** `src/lib/chat-delivery.ts` lines 128-149 (retry harness consumer pattern).
**Tertiary analog:** `src/lib/chat-transcripts.ts` lines 30-101 (pure-module shape: locked constants → exported types → file-local helpers → public API).

**Wire shape excerpt** (`scripts/resend-warmup.mjs:41-64` — copy header keys, body field set, URL):

```javascript
for (let i = 1; i <= count; i++) {
  const sessionId = crypto.randomUUID();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `warmup/${sessionId}`,
    },
    body: JSON.stringify({
      from: '"Portfolio Chat" <transcripts@mail.jackcutrara.com>',
      to,
      reply_to: "jackcutrara@gmail.com",
      subject: `[Portfolio chat] warmup ${i}/${count} — ${sessionId.slice(0, 8)}`,
      text: `This is a deliverability warmup send (${i} of ${count}).\nFrom: chat widget on jackcutrara.com — domain warming, no visitor message.`,
    }),
  });
  if (!res.ok) {
    console.error(`warmup ${i}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const body = await res.json();
  console.log(`warmup ${i}: id=${body.id} idempotency=warmup/${sessionId}`);
}
```

**Pure-module header pattern** (`src/lib/chat-transcripts.ts:1-50` — copy file-doc-header + locked constants block + decision-ID inline citations):

```typescript
// chat-transcripts.ts — pure KV write module for `/api/chat` transcript persistence.
//
// Owns the entire Phase 18 KV write contract:
//   • KV-02 — schema versioning (`v: 1`) + 30-day TTL on every put
//   ...
//
// Pure module. NO imports from:
//   • @anthropic-ai/sdk          — caller (api/chat.ts) handles Anthropic
//   • cloudflare:workers         — caller passes kv: KVNamespace directly
//   • src/prompts/, src/pages/   — no chat-surface coupling

// ---------------------------------------------------------------------------
// Locked constants — Plan 18-05 imports these verbatim.
// ---------------------------------------------------------------------------
export const KEY_PREFIX = "live:";
export const TRANSCRIPT_TTL_SECONDS = 30 * 24 * 3600; // KV-02 — 30 days
```

**Retry harness consumer pattern** (`src/lib/chat-delivery.ts:128-149` — Phase 20 wrapper does NOT internally retry; it returns a discriminated Result and `sendOne` translates 5xx/429 → `throw` → caught by this existing helper):

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt + 1 >= maxAttempts) break;
      const ceiling = Math.min(
        BACKOFF_CAP_MS,
        BACKOFF_BASE_MS * 2 ** attempt,
      );
      await new Promise<void>((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * ceiling)),
      );
    }
  }
  throw lastErr;
}
```

**Notes for executor:**
- **D-17 supersedes D-14/D-16:** wrapper exposes a **3-variant** discriminated `ResendResult`, NOT 4. Drop the `replayed` variant. Drop the `chat.delivery.idempotency_replay` log event.
  - Variants: `{ status: "sent", message_id, attempt }` | `{ status: "failed_transient", http_status?, error_class?, attempt }` | `{ status: "failed_terminal", http_status, resend_error?, attempt }`.
- **Landmine 1 (DOMException, NOT Error):** AbortController catch branch must use `err instanceof DOMException && err.name === "AbortError"`. Do NOT use `err instanceof Error`. Workers + jsdom both expose `DOMException`.
- **Landmine 2 (clearTimeout in finally):** wrap fetch in `try { ... } finally { clearTimeout(timeoutId); }`. Do NOT branch-by-branch clear.
- **Landmine 4 (User-Agent header):** add `User-Agent: jack-cutrara-portfolio/1.0` to fetch init.headers (defends against Resend 403 / code 1010 in Workers runtime — warmup script ran from Node and worked without it; Workers presents a different default UA).
- **Landmine 7 (NO `metadata` on `delivered:` PUT):** the wrapper itself doesn't write KV — but `sendOne`'s consumer in `promoteOne` step 4 (lines 268-281 of chat-delivery.ts) MUST keep `kv.put(...)` options as `{ expirationTtl: DELIVERED_TTL_SECONDS }` only.
- **Landmines 5/9 (deterministic body):** wrapper accepts an already-rendered payload object — no `Date.now()`, no `crypto.randomUUID()` inside the wrapper. Object literal `{ from, to, reply_to, subject, text }` has stable key ordering per ES2015 spec → byte-identical body across retries.
- **Idempotency-Key:** header value MUST be `transcript/${sessionId}` (47 chars; well under 256 cap). Use HEADER form (matches warmup script + RESEARCH § Idempotency Semantics), NOT body `idempotencyKey` field — mixing both is undefined.
- **Pure module:** NO imports from `@anthropic-ai/sdk`, `cloudflare:workers`, `src/prompts/`, `src/pages/`, `src/scripts/chat.ts`. NO `Date.now()`, NO `crypto.randomUUID()` in wrapper body composition.
- **Structured log emission inside the wrapper:** 3 events only — `chat.delivery.sent` (2xx), `chat.delivery.retry` (5xx + 429 + AbortError), `chat.delivery.failed` (4xx-except-429). Flat-primitive fields per DEBT-02 / Phase 18 / Phase 19 convention.

---

#### `src/lib/email/render.ts` (NEW; LOC TBD — split if >250)

**Primary analog:** `src/lib/chat-transcripts.ts` lines 30-101 (locked constants → exported types → file-local `truncate` helper).
**Secondary analog:** `src/lib/validation.ts` lines 56-63 (pure transform exported function shape) and lines 68-150 (constants block at top of module).
**Tertiary analog:** `src/lib/chat-delivery.ts` lines 108-115 (`hostnameOrNull` URL-extraction helper — Phase 20 renderer should reuse this pattern; planner picks duplicate vs re-export).

**Constants block + types pattern** (`src/lib/chat-transcripts.ts:34-88`):

```typescript
// Locked constants — Plan 18-05 imports these verbatim.
export const KEY_PREFIX = "live:";
export const TRANSCRIPT_TTL_SECONDS = 30 * 24 * 3600; // KV-02 — 30 days
export const TURN_CAP = 30; // KV-04 / D-07
export const REFERRER_MAX = 512; // KV-04 — log-poisoning defense ceiling
export const USER_AGENT_MAX = 512;

// Public types
export interface ChatTranscript {
  v: 1;
  sid: string;
  started_at: string;
  last_activity_at: string;
  msg_count: number;
  truncated: boolean;
  meta: { referrer: string | null; /* ... */ };
  messages: StoredTurn[];
}
```

**File-local helper pattern** (`src/lib/chat-transcripts.ts:94-101` — minimal, single-purpose, defensive null fallback):

```typescript
// KV-04 — log-poisoning defense: any string field that originates from a
// request header gets truncated at this module's boundary so downstream
// consumers (Phase 20 email renderer, Workers Logs queries) never see
// unbounded user-controlled input.
function truncate(value: string | null, max: number): string | null {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) : value;
}
```

**hostname-extraction pattern** (`src/lib/chat-delivery.ts:108-115` — try/catch + null fallback for URL parsing):

```typescript
function hostnameOrNull(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
```

**Notes for executor:**
- **Landmine 5 (deterministic render):** `renderEmail(transcript)` MUST be a pure function. NO `Date.now()`, NO `crypto.randomUUID()`, NO env reads beyond what's threaded in. ALL timestamps come from `transcript.started_at`, `transcript.last_activity_at`, `transcript.messages[i].ts`. Acceptance criterion: `renderEmail(t) === renderEmail(t)` deep-equals.
- **Landmine 6 (sanitize ordering):** apply input sanitization BEFORE output encoding:
  1. `stripControlChars(s)` — null bytes; CR/LF (subject only)
  2. `stripBidiOverrides(s)` — `U+202A..U+202E`, `U+2066..U+2069`
  3. `htmlEscape(s)` — `&` first, then `<`, `>`, `"`, `'`
- **D-07 subject charset:** country pinned to `[A-Z]{2}` regex; `unknown` literal fallback. Referrer-host = `new URL(referrer).hostname` then `[a-z0-9.-]+` regex; `direct` literal fallback. CR/LF + bidi + null-byte strip is defensive belt over those suspenders.
- **D-08 truncated suffix:** trailing space + `(truncated)` parenthetical at end of subject — verbatim from Phase 18 D-08 lock.
- **D-09/D-10 cache aggregate:** `Cache: 5/8 turns hit, 7,234 read / 1,221 created`. `hit` = `messages.filter(m => m.role === "assistant" && (m.cache_read_input_tokens ?? 0) > 0).length`. Token totals via `Number.toLocaleString("en-US")` for thousands separators.
- **D-11 metadata header:** 7-line block with padded label column (12 chars suggested). Then blank line, provenance line, blank line, turn markers.
- **D-12 turn markers:** `>>> visitor:` / `<<< bot:` on own line; raw content below; blank line between turns. HTML-escape applied to every dynamic field.
- **No re-truncation:** Phase 18 KV-04 already truncates referrer + user_agent to 512 chars at write time in `chat-transcripts.ts:97-101`. Renderer reads the already-truncated values; do NOT add a second truncation.
- **Pure module:** NO imports from `@anthropic-ai/sdk`, `cloudflare:workers`, `src/prompts/`, `src/pages/`, `src/scripts/chat.ts`. Type-only import of `ChatTranscript` from `../chat-transcripts`.
- **Provenance line placement:** below the 7-line metadata block, separated by blank lines from both header and turn markers (per RESEARCH § Pattern 1 + CONTEXT.md Discretion).

---

### Group 2 — Chat-delivery edits (`src/lib/chat-delivery.ts`)

#### `src/lib/chat-delivery.ts` (EDIT — three surgical changes)

**Self-analog (in-place edit):**

**Substitution point** (lines 163-184 — Phase 19 throw stub):

```typescript
async function sendOne(
  env: DeliveryEnv,
  transcript: ChatTranscript,
): Promise<void> {
  if (env.DRY_RUN === "1") {
    // D-05 — locked field NAMES; ORDER is planner's discretion.
    console.log("chat.delivery.dry_run", {
      sid: transcript.sid,
      to: env.CHAT_RECIPIENT_EMAIL ?? null,
      from: env.CHAT_SENDER_EMAIL ?? null,
      reply_to: env.CHAT_REPLY_TO_EMAIL ?? null, // WR-02 — sourced from env, not hardcoded
      msg_count: transcript.msg_count,
      truncated: transcript.truncated,
      country: transcript.meta.country ?? null,
      referrer_host: hostnameOrNull(transcript.meta.referrer),
      dry_run: true,
    });
    return; // synthetic success
  }
  // Phase 20 replaces this branch with the real Resend POST.
  throw new Error("send_not_implemented_in_phase_19");
}
```

**Additive interface extension** (lines 66-73 — `DeliveredMarker`):

```typescript
export interface DeliveredMarker {
  v: 1; // schema discriminator, matches ChatTranscript.v
  sid: string;
  delivered_at: string; // ISO 8601
  dry_run: boolean; // true in Phase 19; false in Phase 20
  msg_count: number;
  truncated: boolean;
}
// PHASE 20: append `resend_message_id: string` field. v stays 1 (additive extension per Phase 19 D-09/D-10 lock).
```

**Step-4 PUT site** (lines 268-281 — populate new field; keep `kv.put` options unchanged):

```typescript
const value: DeliveredMarker = {
  v: 1,
  sid,
  delivered_at: new Date().toISOString(),
  dry_run: env.DRY_RUN === "1", // D-02 — strict-equals-string gate
  msg_count: transcript.msg_count,
  truncated: transcript.truncated,
};
await env.CHAT_KV.put(`delivered:${sid}`, JSON.stringify(value), {
  expirationTtl: DELIVERED_TTL_SECONDS,
  // D-11 — intentionally NO metadata field; idempotency cursor is a hint, not a list-surface.
});
```

**Notes for executor:**
- **D-03 rollback runway — DO NOT DELETE the DRY_RUN=`"1"` branch.** It's the instant-rollback mechanism. Add an inline comment block explicitly stating "rollback runway per D-03; do not remove as 'dead code'".
- **Substitution shape (per RESEARCH § Pattern 3):**
  - `sendOne` return type widens from `Promise<void>` to `Promise<{ message_id: string }>` (so `promoteOne` can read the message_id and populate `delivered:{sid}.resend_message_id`).
  - DRY_RUN=`"1"` branch returns `{ message_id: "dry-run-no-id" }` sentinel; `promoteOne` uses the existing `dry_run: env.DRY_RUN === "1"` discriminator (line 272) so the sentinel only appears in dry-run-flagged values.
  - DRY_RUN=`"0"` branch: `const payload = renderEmail(env, transcript); const result = await sendEmail(env, payload);`
    - On `result.status === "sent"`: `return { message_id: result.message_id };`
    - On `result.status === "failed_transient"`: `throw new Error(\`resend_transient_${result.http_status ?? result.error_class}\`);` (caught by retryWithBackoff at line 264)
    - On `result.status === "failed_terminal"`: `throw new Error(\`resend_terminal_${result.http_status}\`);` (also bubbles through retryWithBackoff; 3 attempts will burn for terminal errors but the FIRST attempt's structured log already captured `chat.delivery.failed`. Net cost: 3x log noise on terminal — acceptable at v1.3 scale.)
- **Step-4 PUT additive change:** the `value` object literal gets a `resend_message_id: string` field appended (sourced from `sendOne`'s return). The `kv.put` OPTIONS stay byte-identical (`{ expirationTtl: DELIVERED_TTL_SECONDS }` — NO `metadata` field per Landmine 7 / D-11).
- **Schema `v: 1` unchanged.** Phase 19 D-09/D-10 locked additive extension.
- **`promoteOne` flow (lines 203-318) UNCHANGED beyond the value-object additive change.** Five-step ordering invariant, per-session try/catch isolation, batch-cap counting, etc. all stay byte-identical.
- **Locked constants block (lines 47-53) UNCHANGED.** `INACTIVITY_THRESHOLD_MS`, `PER_TICK_BATCH_CAP`, `MAX_SEND_ATTEMPTS`, etc.

---

### Group 3 — Wrangler config (`wrangler.jsonc`)

#### `wrangler.jsonc` (EDIT — single-line value flip)

**Self-analog (line 21 — the only edit):**

```jsonc
"vars": {
  "DRY_RUN": "1",                                  // Phase 20: flip to "0"
  "CHAT_REPLY_TO_EMAIL": "jackcutrara@gmail.com"
},
```

**Notes for executor:**
- **D-01 atomic single-deploy lock:** the DRY_RUN flip ships in the SAME commit as the wrapper + renderer + `sendOne` substitution + tests + UAT + DEPLOY-GATE.
- **D-03 rollback:** revert is a SECOND single-line edit (`"0"` → `"1"`) + `wrangler deploy`. ~60s recovery.
- **All other keys UNCHANGED:** `triggers.crons` stays `["0 * * * *"]`, `kv_namespaces`, `assets`, `CHAT_REPLY_TO_EMAIL`, `WORKERS_PREVIEW_SUFFIX` byte-identical.
- **Inline comment hint:** the existing comment on line 18 already documents the Phase 20 flip plan — update text from "Phase 20 flips" to past-tense "Phase 20 flipped this 2026-MM-DD" or leave as historical breadcrumb (planner picks).

---

### Group 4 — New unit tests (`tests/api/email-*.test.ts`)

#### `tests/api/email-render.test.ts` (NEW — happy paths + edge cases)

**Primary analog:** `tests/api/chat-delivery.test.ts` lines 174-205 (fixture builder pattern: `buildTranscript(opts)` returns `ChatTranscript` with sensible defaults + override hooks).

**Fixture-builder pattern** (`tests/api/chat-delivery.test.ts:174-206`):

```typescript
function buildTranscript(opts: {
  sid?: string;
  msgCount?: number;
  truncated?: boolean;
  country?: string | null;
  referrer?: string | null;
  lastActivityAt?: string;
}): ChatTranscript {
  const sid = opts.sid ?? SID;
  const startedAt = "2026-05-12T08:00:00.000Z";
  const lastActivityAt = opts.lastActivityAt ?? STALE_3H;
  const msgCount = opts.msgCount ?? 2;
  return {
    v: 1, sid, started_at: startedAt, last_activity_at: lastActivityAt,
    msg_count: msgCount,
    truncated: opts.truncated ?? false,
    meta: {
      referrer: opts.referrer ?? "https://example.com/path",
      user_agent: "TestUA/1.0",
      country: opts.country ?? "US",
      region: "TX", colo: "DFW",
    },
    messages: Array.from({ length: msgCount }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `msg-${i}`,
      ts: startedAt,
    })),
  };
}
```

**describe/it shape** (`tests/api/chat-delivery.test.ts:259-289` — beforeEach console-spy + describe-grouping):

```typescript
describe("GROUP A — CRON-02 list + inactivity filter", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it("filters by inactivity", async () => {
    const kv = new MockKVNamespace();
    seedLive(kv, buildTranscript({ lastActivityAt: FRESH_30M }));
    await deliverDue(buildEnv(kv), SCHEDULED_NOW);
    const tick = findLog(logSpy, "chat.delivery.tick");
    expect(tick).toBeDefined();
    expect((tick![1] as { sessions_promoted: number }).sessions_promoted).toBe(0);
  });
});
```

**Notes for executor:**
- Reuse the `buildTranscript(opts)` helper shape (with cache-token additions for D-09/D-10 cache-aggregate cases). New optional fields: `cacheReadTokens?: number[]` and `cacheCreationTokens?: number[]` (one entry per assistant turn).
- **No MockKV needed** — renderer is a pure function. Tests pass literal `ChatTranscript` fixtures and assert on the returned `ResendPayload` object.
- **Test groups:** subject derivation (D-04/D-05/D-06/D-07/D-08) → body composition (D-11/D-12) → cache aggregate (D-09/D-10) → HTML-escape (MAIL-03) → CR/LF strip on subject → determinism (`renderEmail(t) === renderEmail(t)` per Landmine 5).
- ~10 tests target per RESEARCH § specifics § plan-time test count delta.

---

#### `tests/api/email-render.adversarial.test.ts` (NEW — `it.each` over locked payload classes)

**Primary analog:** `tests/api/chat-voice-split.test.ts` lines 30-61 (single-fixture regex-based assertion against rendered output) — closest existing precedent for adversarial-payload assertions.
**Secondary analog (vitest standard):** `it.each` is a vitest built-in; no in-repo example, but standard pattern.

**Single-fixture regex assertion** (`tests/api/chat-voice-split.test.ts:39-50`):

```typescript
it("system block (full serialized payload) contains no first-person leading clauses", () => {
  const systemText = JSON.stringify(args.system);
  const m = FIRST_PERSON_LEAK.exec(systemText);
  if (m) {
    const idx = systemText.indexOf(m[0]);
    const excerpt = systemText.slice(Math.max(0, idx - 40), idx + 80);
    throw new Error(
      `First-person leak in system block: matched "${m[0]}" near "${excerpt}"`
    );
  }
  expect(systemText).not.toMatch(FIRST_PERSON_LEAK);
});
```

**Notes for executor:**
- Use vitest `it.each([...payloadClasses])` with one row per locked payload class:
  1. `<script>alert(1)</script>` — assert `&lt;script&gt;` in output, NO literal `<script>`
  2. `</p><img src=x onerror=alert(1)>` — assert `&lt;/p&gt;&lt;img` in output, NO literal `<img`
  3. `javascript:alert(1)` — assert plain text (no auto-link)
  4. `‮` reversed-text — assert ZERO occurrences of `U+202A..U+202E` and `U+2066..U+2069` codepoints in output
  5. `\0` null byte — assert ZERO `\0` bytes in output
  6. `From: chat widget on jackcutrara.com` social-engineering prefix — assert literal renders under `>>> visitor:` marker; assert the AUTHENTIC provenance line above the conversation block carries a byte-distinct prefix (e.g. `From: chat widget on jackcutrara.com — visitor message follows below this line.`) that no visitor-typed string can spoof above it
- **Combined-payload row** (Landmine 6 acceptance): single fixture combining null-byte + bidi + script-tag → assert all three classes neutralized.
- **Hex-codepoint helper:** use `/[‪-‮⁦-⁩]/u.test(output)` — flag `u` for unicode safety.
- ~6-8 rows target × ~2 assertions per row = ~12-16 expects.

---

#### `tests/api/email-resend.test.ts` (NEW — mocked global fetch + AbortController)

**Primary analog:** `tests/api/cache-hit-logs.test.ts` lines 14-105 (vi.mock virtual modules + Anthropic mock + console-spy + structured-log assertion).
**Secondary analog:** `tests/api/chat-delivery.test.ts` lines 565-572 (`vi.useFakeTimers()` + `vi.runAllTimersAsync()` + `vi.useRealTimers()` for retry-backoff tests).

**vi.mock + console-spy pattern** (`tests/api/cache-hit-logs.test.ts:14-47`):

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as transcripts from "../../src/lib/chat-transcripts";

// Mock the cloudflare:workers virtual module so env.ANTHROPIC_API_KEY is
// populated when the handler is imported under vitest.
vi.mock("cloudflare:workers", () => ({
  env: { ANTHROPIC_API_KEY: "test-key-for-mock" },
}));

const mockLocals = { cfContext: {
  waitUntil: (p: Promise<unknown>) => { void p; },
  passThroughOnException: () => {},
}};
```

**Fake timers + retry-backoff pattern** (`tests/api/chat-delivery.test.ts:566-571`):

```typescript
// Use fake timers so retry backoff completes instantly
vi.useFakeTimers();
const p = deliverDue(buildEnv(kv, { DRY_RUN: "0" }), SCHEDULED_NOW);
await vi.runAllTimersAsync();
await p;
vi.useRealTimers();
```

**Notes for executor:**
- **Global fetch mock:** `globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: "test-msg-id" }) });` — restore in `afterEach` via `vi.restoreAllMocks()` or unset.
- **Landmine 1 (DOMException test mock):** AbortController timeout test MUST throw `new DOMException("aborted", "AbortError")`, NOT `new Error("aborted")`. Verify wrapper's catch branch uses `instanceof DOMException && err.name === "AbortError"`.
- **Landmine 2 (clearTimeout):** test that fetch resolution does NOT leave dangling setTimeout — combine with `vi.useFakeTimers()` + assert no pending timers via `vi.getTimerCount() === 0` after each test (or just rely on `try/finally` in source).
- **D-17 collapsed Result variant** test cases (NO `replayed` case):
  1. `200 → { status: "sent", message_id: "test-id", attempt: 1 }` + emits `chat.delivery.sent` with `sid` + `resend_message_id` + `attempt`
  2. `500 → { status: "failed_transient", http_status: 500, ... }` + emits `chat.delivery.retry`
  3. `429 → { status: "failed_transient", http_status: 429, ... }` + emits `chat.delivery.retry`
  4. `it.each([400, 401, 403, 409, 422])` → `{ status: "failed_terminal", http_status, ... }` + emits `chat.delivery.failed`
  5. AbortController fires at 10s → `{ status: "failed_transient", error_class: "AbortError" }`
  6. Header literal `Idempotency-Key: transcript/${sessionId}` set on fetch (spy on `fetch.mock.calls[0][1].headers`)
  7. Header literal `Authorization: Bearer ${env.RESEND_API_KEY}` set
  8. Header literal `User-Agent: jack-cutrara-portfolio/1.0` set (Landmine 4)
  9. Body has `text` field present + `html` field ABSENT
  10. `JSON.parse(fetch.mock.calls[0][1].body)` deep-equals expected `{ from, to, reply_to, subject, text }` — confirms key set + key ordering stability (Landmine 9)
- **Landmine 10 (409 logged with http_status):** assert `chat.delivery.failed` log carries `http_status: 409` discriminator.
- ~8-10 tests target.

---

### Group 5 — Extended unit test (`tests/api/chat-delivery.test.ts`)

#### `tests/api/chat-delivery.test.ts` (EXTEND — add new groups for sendOne wiring)

**Self-analog (in-file extension):**

**Existing GROUP D pattern** (`tests/api/chat-delivery.test.ts:493-583` — DRY_RUN gate test group; Phase 20 EXTENDS this with new `it()` rows AND new groups for the live-send paths):

```typescript
describe("GROUP D — CRON-04 DRY_RUN gate (D-01 / D-02 / D-05)", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it("dry_run gate (env.DRY_RUN !== '1' throws)", async () => {
    // PHASE 19 ASSERTION — Phase 20 REWRITES to assert sendEmail call instead of throw stub.
    const kv = new MockKVNamespace();
    seedLive(kv, buildTranscript({ lastActivityAt: STALE_3H }));
    vi.useFakeTimers();
    const p = deliverDue(buildEnv(kv, { DRY_RUN: "0" }), SCHEDULED_NOW);
    await vi.runAllTimersAsync();
    await p;
    vi.useRealTimers();
    // ... etc
  });
});
```

**Notes for executor:**
- **DO NOT remove the `dry_run preserves runway` test** — assert byte-identical envelope log emission under DRY_RUN=`"1"` (forward-defense for the rollback runway per D-03).
- **REWRITE the `dry_run gate (env.DRY_RUN !== '1' throws)` test:** under D-17, the throw stub is GONE. New assertion: under DRY_RUN=`"0"`, `sendEmail` IS called with the rendered payload; on `{ status: "sent", message_id }`, `delivered:{sid}` value has `dry_run: false` + populated `resend_message_id` matching message_id; emits `chat.delivery.sent`.
- **Mock the Resend wrapper:** `vi.mock("../../src/lib/email/resend", () => ({ sendEmail: vi.fn().mockResolvedValue({ status: "sent", message_id: "test-id", attempt: 1 }) }))` — keeps `chat-delivery.test.ts` testing only the wiring, not the wire.
- **New test cases per D-17 collapsed Result + RESEARCH § Wiring rows:**
  1. DRY_RUN=`"1"` envelope log byte-identical (RUNWAY PRESERVED forward-defense)
  2. DRY_RUN=`"0"` calls `sendEmail` with rendered payload (spy on imported sendEmail)
  3. On `{ status: "sent" }` → `delivered:{sid}` has `dry_run: false` + `resend_message_id` populated
  4. On `{ status: "failed_transient" }` → retry harness fires (3-try budget; assert `sendEmail` called 3x)
  5. On `{ status: "failed_terminal" }` → emits `chat.delivery.failed` (with `http_status` discriminator), `live:{sid}` NOT deleted, `delivered:{sid}` NOT written
  6. Pre-existing `chat.delivery.skipped_already_delivered` test (Layer 1 KV cursor) still passes byte-identical (per D-17 — Layer 1 IS the application-side replay detector)
- ~4-6 new test cases target.

---

### Group 6 — New optional source-text guards (`tests/build/*`)

#### `tests/build/chat-delivery-send-site.test.ts` (NEW, OPTIONAL but recommended)

**Primary analog:** `tests/build/append-turn-call-site.test.ts` lines 21-87 (readFileSync + regex invariants for source-text forward-defense).

**Source-text invariant pattern** (`tests/build/append-turn-call-site.test.ts:21-60`):

```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("D-10 / D-11 / D-09: ctx.waitUntil(appendTurn(...).catch(...)) call sites in api/chat.ts (Plan 18-07 forward-defense)", () => {
  const src = readFileSync(join(process.cwd(), "src/pages/api/chat.ts"), "utf8");

  it("Invariant A: imports appendTurn from chat-transcripts at the locked relative path", () => {
    expect(src).toMatch(
      /import\s*\{[^}]*\bappendTurn\b[^}]*\}\s*from\s*["']\.\.\/\.\.\/lib\/chat-transcripts["']/,
    );
  });

  it("Invariant D (D-09): both ctx.waitUntil(appendTurn(...)) calls chain a .catch handler", () => {
    const matches = src.match(/ctx\.waitUntil\(\s*appendTurn\([\s\S]*?\)\s*\)/g) ?? [];
    expect(matches.length).toBe(2);
    for (const match of matches) {
      expect(match).toContain(".catch(");
    }
  });
});
```

**Notes for executor:**
- **Read source-text via `readFileSync(join(process.cwd(), "src/lib/chat-delivery.ts"), "utf8")`.**
- **Invariants to lock:**
  1. `sendOne` imports `sendEmail` from `./email/resend` (regex: `/import\s*\{[^}]*\bsendEmail\b[^}]*\}\s*from\s*["']\.\/email\/resend["']/`)
  2. `sendOne` imports `renderEmail` from `./email/render` (or wherever the renderer lives; planner-decided path)
  3. Phase 19 throw stub is GONE — assert `expect(src).not.toContain('send_not_implemented_in_phase_19');`
  4. The `if (env.DRY_RUN === "1")` branch is STILL PRESENT (rollback runway per D-03) — assert `expect(src).toMatch(/if\s*\(\s*env\.DRY_RUN\s*===\s*["']1["']\s*\)/);`
  5. The `chat.delivery.dry_run` envelope log is STILL PRESENT (rollback runway preserved)
- **Why optional but recommended:** RESEARCH § Wave 0 Gaps marks this as optional per Claude's Discretion. The runway-preserved invariant (#4 + #5) is the most important — guards against a future "cleanup" PR removing the rollback path as "dead code".

---

#### `tests/build/wrangler-dry-run-shape.test.ts` (NEW, OPTIONAL but recommended)

**Primary analog:** `tests/build/wrangler-cron-shape.test.ts` lines 25-51 (parseJsonc + invariant assertions on `wrangler.jsonc`).

**Pattern excerpt** (`tests/build/wrangler-cron-shape.test.ts:25-51`):

```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseJsonc } from "./_helpers/parse-jsonc";

describe("CRON-01 + D-01: wrangler.jsonc cron + DRY_RUN shape", () => {
  const cfg = parseJsonc(
    readFileSync(join(process.cwd(), "wrangler.jsonc"), "utf8"),
  ) as Record<string, unknown>;

  it("CRON-01: triggers.crons is exactly ['0 * * * *'] (Pitfall 6 anti-wildcard-cron-leak)", () => {
    expect((cfg.triggers as { crons: string[] }).crons).toEqual(["0 * * * *"]);
  });

  it("D-01 / D-02: vars.DRY_RUN === '1'", () => {
    expect(cfg.vars).toBeDefined();
    expect((cfg.vars as { DRY_RUN: string }).DRY_RUN).toBe("1");
  });
});
```

**Notes for executor:**
- **CRITICAL:** the existing `tests/build/wrangler-cron-shape.test.ts` line 49 currently asserts `DRY_RUN === "1"`. Phase 20 MUST update that assertion to `"0"` AT THE SAME COMMIT as the wrangler.jsonc flip — otherwise the test goes RED. The PHASE 20 NEW build-time guard supplements (or REPLACES) this assertion:
  - **Option A (recommended):** UPDATE the existing `tests/build/wrangler-cron-shape.test.ts` line 49 in-place from `"1"` to `"0"` (single-line test edit) AND add the new `wrangler-dry-run-shape.test.ts` as a focused Phase 20 attribution test.
  - **Option B:** Delete the line 49 assertion in the existing file, move it entirely into the new file. Riskier — loses cron-shape colocation.
- **New file invariants to lock:**
  1. `cfg.vars.DRY_RUN === "0"` (Phase 20 close)
  2. `cfg.triggers.crons === ["0 * * * *"]` (forward-defense against UAT Step 4 operator forgetting to revert the `*****` UAT cron flip — Pitfall 6 from Phase 19, inherited)
- **`parseJsonc` helper** lives at `tests/build/_helpers/parse-jsonc.ts` (string-literal-aware tokenizer per WR-05/WR-06 Phase 19 code review).

---

### Group 7 — Phase-end docs

#### `20-UAT.md` (NEW — 6-step manual operator UAT)

**Primary analog:** `.planning/phases/19-cron-sweep-scheduling-idempotency-dry-run/19-UAT.md` lines 1-120 (frontmatter + numbered Steps + expected/result blocks + cron-flip-then-revert pattern).

**Frontmatter + intro pattern** (`19-UAT.md:1-58`):

```markdown
---
status: complete
phase: 19-cron-sweep-scheduling-idempotency-dry-run
source: [19-01-SUMMARY.md, ...]
started: 2026-05-12T20:45:00Z
updated: 2026-05-13T00:30:00Z
deviation: |
  [free-form deviation log paragraph]
---

# Phase 19 UAT — Cron Sweep (Scheduling + Idempotency under DRY_RUN)

**Step 1 (CRON-01 `* * * * *` Past-Events verification) is the operator-controlled gate per D-12.**
Executor MUST NOT run `wrangler deploy` for the `* * * * *` flip.

This UAT closes ROADMAP Phase 19 success criteria 1-4. The 5-step sequence maps:

- Step 1 → SC1 (CRON-01: cron trigger wired + Past Events visible)
- Step 2 → SC2 (CRON-02: dry-run sweep PUT delivered: BEFORE / DELETE live: AFTER)
- ...
```

**Step block pattern** (`19-UAT.md:68-120`):

```markdown
### 1. CRON-01 — `* * * * *` Past-Events verification (closes SC1)

expected: |
  TWO-PART step: a local PRE-FLIGHT (executor-runnable, no deploy) ...

  PRE-FLIGHT (local, executor-runnable):
    Terminal 1: `pnpm dev:cron`
    Terminal 2: `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"`
    Terminal 1 should emit one structured JSON log line of shape:
      chat.delivery.tick { sessions_seen: <int>, sessions_due: <int>, ... }

  PRODUCTION (operator-controlled per DEPLOY-GATE.md):
    1. `git diff wrangler.jsonc` should return empty before starting.
    2. Operator edits `wrangler.jsonc` line 23: change `["0 * * * *"]` to `["* * * * *"]`.
    3. Operator runs `wrangler deploy` (executor MUST NOT run this).
    ...

result: |
  [populated post-UAT by operator]
```

**Notes for executor:**
- **Frontmatter shape:** `status: pending` at first commit; operator updates to `status: complete` after Step 6 closure.
- **6-step structure** (per CONTEXT.md D-02 + RESEARCH § Pattern 1):
  1. Step 1 → seed `live:test-uat-<sid>` with stale `last_activity_at` via `wrangler kv key put` (Phase 19 Step 2 pattern verbatim — REUSE the `--remote` flag discipline)
  2. Step 2 → operator flips `triggers.crons` to `["* * * * *"]` + `wrangler deploy` (operator-only per DEPLOY-GATE.md)
  3. Step 3 → verify Gmail Inbox arrival within 90s + `delivered:test-uat-<sid>` value has `dry_run: false` + populated `resend_message_id` + Workers Logs show `chat.delivery.sent` with matching `resend_message_id`
  4. Step 4 → revert `triggers.crons` to `["0 * * * *"]` + `wrangler deploy` (operational hygiene)
  5. Step 5 → backlog cleanup: `wrangler kv key delete live:test-uat-*` + `delivered:test-uat-*`
  6. Step 6 → wait for first organic real-traffic conversation; record Resend message ID + arrival time + Gmail screenshot + Workers Logs screenshot
- **`expected:` / `result:` block format** is REQUIRED per Phase 17/18/19 precedent — operator fills `result:` post-execution.
- **Step 6 7-day soft cap** (per CONTEXT.md Discretion): if no organic visitor arrives within 7 days, milestone may close on Steps 1-5 + manual `scripts/resend-warmup.mjs` re-execution as proxy.
- **`--remote` flag discipline:** every `wrangler kv key` command in Steps 1-5 MUST pass `--remote` (Phase 18 / Phase 19 UAT learning — wrangler defaults to `--local` and burned ~2hr debug time at Phase 18). Document this in the `deviation:` paragraph.
- **KV namespace IDs** verbatim from `wrangler.jsonc:11-17` (Production: `eaa30fef259e4a6b9505b41bbf3f8f01`; Preview: `115f3c1b0f8a4a1da9fee78c48dcb749`).

---

#### `DEPLOY-GATE.md` (NEW — operator-confirmation gate)

**Primary analog:** `.planning/phases/17-foundations-migration-dns-debt-sweep/DEPLOY-GATE.md` lines 1-80 (frontmatter + checklist + post-deploy verification + Test-Environment Mapping table).

**Frontmatter pattern** (`17-DEPLOY-GATE.md:1-10`):

```markdown
---
type: deploy-gate
phase: 17-foundations-migration-dns-debt-sweep
plan: 08
created: 2026-05-11
confirmed: 2026-05-11
status: confirmed
operator: Jack Cutrara
gate: CONFIRMED
---
```

**Pre-Deploy Checklist pattern** (`17-DEPLOY-GATE.md:79-115`):

```markdown
## Pre-Deploy Checklist

Run all checks below. Each MUST pass before `git push origin main`.

### 1. Local build is clean

- [ ] `pnpm test` exits 0 (full suite GREEN, ...)
- [ ] `pnpm exec astro check` exits 0
- [ ] `pnpm build` exits 0

### 2. `pnpm dev` smoke test (UAT Gap #2 closure verification)

Run `pnpm dev` and open http://localhost:4321/.

- [ ] Click red chat bubble — panel OPENS with scale-in animation ...
```

**Notes for executor:**
- **Frontmatter at first commit:** `status: pending`, `gate: PENDING`. Operator updates to `status: confirmed`, `gate: CONFIRMED`, `confirmed: <date>`, `operator: Jack Cutrara` after UAT closure.
- **Pre-deploy checklist** (Phase 20-specific):
  1. Local build clean: `pnpm test` exits 0 (530+ PASS / 0 FAIL / 2 SKIP target per RESEARCH § specifics), `pnpm exec astro check` 0/0/0, `pnpm build` clean
  2. `package.json dependencies` byte-identical phase-wide (`git diff origin/main..HEAD package.json | grep '^\+' | grep -v 'scripts'` returns empty)
  3. `wrangler.jsonc vars.DRY_RUN === "0"` confirmed via `tests/build/wrangler-dry-run-shape.test.ts`
  4. `wrangler.jsonc triggers.crons === ["0 * * * *"]` confirmed (no leftover `*****` from UAT Step 4 revert)
  5. Phase 19 D-26 chat regression battery byte-identical (`tests/api/sse-snapshot.test.ts` + `tests/api/anthropic-payload-shape.test.ts` + `tests/api/cache-hit-logs.test.ts` GREEN)
- **Post-deploy verification (operator-only):** mirrors `20-UAT.md` Steps 1-6.
- **Executor MUST NOT push** — explicit prohibition per Plan 17-08 / D-04. Operator runs `git push origin main` after gate is CONFIRMED.
- **Audit trail:** chat-reply confirmation ("approved — deploy gate cleared") preserved in conversation history per Plan 17-08 precedent.

---

## Shared Patterns

### Pure-module file header (applies to both `src/lib/email/resend.ts` and `src/lib/email/render.ts`)

**Source:** `src/lib/chat-transcripts.ts:1-29` + `src/lib/chat-delivery.ts:1-37`

```typescript
// <module-name>.ts — pure <role> module for <Phase 20 contract scope>.
//
// Owns the entire Phase 20 contract:
//   • MAIL-01 — ...
//   • MAIL-02 — ...
//
// Decision IDs honored in this module:
//   D-01 — ...
//   D-13 — ...
//   D-17 — ...   ← REQUIRED citation; explains why ResendResult has 3 variants not 4
//
// Pure module. NO imports from:
//   • @anthropic-ai/sdk
//   • cloudflare:workers
//   • src/prompts/, src/pages/
//   • src/scripts/chat.ts
```

### Structured Workers-Logs convention (applies to wrapper + sendOne wiring)

**Source:** Plan 17-05 DEBT-02 (`chat.cache_metrics`) → Phase 18 (`chat.transcript.write_failed`) → Phase 19 (`chat.delivery.dry_run`, `.tick`, `.skipped_already_delivered`, `.failed`).

```typescript
// Flat-primitive fields only. Second arg parsed as JSON by wrangler tail.
console.log("chat.delivery.sent", {
  sid: extractSidFromIdempotencyKey(idempotency_key),
  resend_message_id: data.id,
  attempt,
});

console.error("chat.delivery.failed", {
  sid,
  http_status: response.status,
  error_class: errorClass ?? "unknown",
  attempt,
});
```

**Phase 20 event vocabulary (D-16 + D-17 collapsed):**
- `chat.delivery.sent` — 2xx success
- `chat.delivery.failed` — terminal (4xx-except-429 OR all 3 retries exhausted)
- `chat.delivery.retry` — transient (5xx OR 429 OR AbortError) before next retry attempt
- ~~`chat.delivery.idempotency_replay`~~ — REMOVED per D-17

### Console-spy test pattern (applies to all `tests/api/email-*.test.ts` + chat-delivery.test.ts extensions)

**Source:** `tests/api/chat-delivery.test.ts:264-272` + `tests/api/cache-hit-logs.test.ts:14-47`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("...", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => { vi.restoreAllMocks(); });
});

function findLog(spy: ReturnType<typeof vi.spyOn>, eventName: string): unknown[] | undefined {
  return spy.mock.calls.find((c: unknown[]) => c[0] === eventName) as unknown[] | undefined;
}
```

### Source-text invariant pattern (applies to both `tests/build/*.test.ts` Phase 20 additions)

**Source:** `tests/build/append-turn-call-site.test.ts` + `tests/build/wrangler-cron-shape.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(process.cwd(), "src/lib/chat-delivery.ts"), "utf8");

it("Invariant: <description>", () => {
  expect(src).toMatch(/<regex>/);
  // OR
  expect(src).not.toContain("<forbidden literal>");
});
```

For JSONC files, use the shared helper:

```typescript
import { parseJsonc } from "./_helpers/parse-jsonc";
const cfg = parseJsonc(readFileSync(join(process.cwd(), "wrangler.jsonc"), "utf8")) as Record<string, unknown>;
```

---

## No Analog Found

| File | Role | Reason | Mitigation |
|------|------|--------|------------|
| `tests/api/email-render.adversarial.test.ts` (`it.each` table form) | unit test | No existing `tests/api/*.test.ts` uses `it.each` over a fixture-row table — `chat-voice-split.test.ts` is the closest in *intent* (single-fixture regex assertion against rendered output) but uses one `it()` per assertion, not table-driven. | Use the standard vitest `it.each` API directly; reference `chat-voice-split.test.ts` for the regex-based assertion shape and `chat-delivery.test.ts:174-205` for the fixture-builder shape. |

---

## Metadata

**Analog search scope:**
- `src/lib/` (5 files reviewed: chat-delivery.ts, chat-transcripts.ts, validation.ts, plus type-only references to chat-knowledge etc.)
- `scripts/` (1 file: resend-warmup.mjs — wire-shape oracle)
- `tests/api/` (5 files: chat-delivery.test.ts, cache-hit-logs.test.ts, anthropic-payload-shape.test.ts, chat-voice-split.test.ts, chat-transcripts.test.ts)
- `tests/build/` (3 files: append-turn-call-site.test.ts, wrangler-cron-shape.test.ts, wrangler-shape.test.ts)
- `.planning/phases/19-.../19-UAT.md` + `.planning/phases/17-.../DEPLOY-GATE.md` (precedent docs)

**Files scanned:** ~17 source/test/doc files
**Pattern extraction date:** 2026-05-12
**Decision drift accommodation:** D-17 (added 2026-05-12 in response to RESEARCH Drift §1) is reflected throughout — wrapper exposes 3 Result variants (NOT 4), 3 log events (NOT 4), no `replayed` test cases, no `chat.delivery.idempotency_replay` emission. Layer 1 (`delivered:{sid}` KV cursor, Phase 19 D-09) IS the application-side replay detector — short-circuits via existing `chat.delivery.skipped_already_delivered` log BEFORE the Resend call.
**Landmines tagged:** Landmines 1, 2, 4, 5, 6, 7, 9, 10 from RESEARCH § Implementation Landmines surfaced in executor notes per file.
