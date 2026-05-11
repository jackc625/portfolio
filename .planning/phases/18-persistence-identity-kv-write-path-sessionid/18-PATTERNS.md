# Phase 18: Persistence + Identity — KV Write Path + sessionId — Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 11 (5 NEW, 5 MODIFY, 1 NEW UAT doc)
**Analogs found:** 11 / 11 (5 exact, 4 role-match, 2 partial)

## File Classification

| New/Modified File | Action | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|--------|------|-----------|----------------|---------------|
| `src/lib/chat-transcripts.ts` | NEW | service (pure infra helper) | request-response + KV CRUD (read-modify-write) | `src/lib/validation.ts` (sibling pure module — Zod + named exports + flat type emit) | role-match (only existing `src/lib/*` module; both are dependency-free pure modules) |
| `tests/api/chat-transcripts.test.ts` | NEW | test (unit, mock KV) | request-response (function call assertion) | `tests/api/validation.test.ts` (pure-module unit test pattern; arrange-act-assert) + `tests/api/cache-hit-logs.test.ts` (`vi.spyOn(console)` pattern) | exact (peer file: `src/lib/X` ↔ `tests/api/X.test.ts`) |
| `tests/api/chat-session-id.test.ts` | NEW | test (api, validation branch) | request-response | `tests/api/validation.test.ts` lines 8-72 (positive/negative `validateRequest` cases) + `tests/api/cache-hit-logs.test.ts` (full POST drive with mocked `cloudflare:workers`) | exact (two-prong: schema unit + endpoint integration mirror existing test layout) |
| `tests/client/chat-sessionid-mint.test.ts` | NEW | test (client, jsdom) | event-driven (DOM lifecycle) | `tests/client/listener-dedup.test.ts` (jsdom + `vi.spyOn(document, ...)` + dynamic import + reset modules + sourcetext+behavioral two-prong) | exact (canonical jsdom client-test pattern for source-of-truth invariants on `src/scripts/chat.ts`) |
| `tests/build/append-turn-call-site.test.ts` | NEW | test (build, source-text) | n/a (source-text grep) | `tests/build/worker-entrypoint.test.ts` (forward-defense for `ctx.waitUntil` source-text in `src/worker.ts`) + `tests/build/no-imperative-display-flip.test.ts` (source-text NOT-pattern lock) | exact (identical idiom: `readFileSync` + `expect(src).toMatch(/.../)`) |
| `18-UAT.md` | NEW (phase close) | doc (manual UAT spec) | n/a | `.planning/phases/17-foundations-migration-dns-debt-sweep/17-UAT.md` (front-matter + numbered Tests with `expected:` / `result:`) | exact (precedent established Phase 17) |
| `src/pages/api/chat.ts` | MODIFY | controller (SSR/SSE) | request-response + streaming + event-driven (`ctx.waitUntil`) | self at lines 97-185 (existing SSE handler; `cacheUsage` closure pattern; `console.log("chat.cache_metrics", {…})` Plan 17-05 seam) | exact (self-evolution; +~30 LOC additive at locked anchors) |
| `src/scripts/chat.ts` | MODIFY | client controller | event-driven (DOM lifecycle) + localStorage CRUD | self at lines 68-120 (`ChatStorage` interface + `saveChatHistory`/`loadChatHistory` + STORAGE_VERSION gate) and lines 572-660 (`initChat` bubble click handler) | exact (self-evolution; in-file pattern mirror) |
| `src/lib/validation.ts` | MODIFY | utility (schema) | request-response | self at lines 31-33 (`RequestSchema` Zod object) | exact (self-evolution; 1-line additive field) |
| `tests/api/anthropic-payload-shape.test.ts` | MODIFY | test (api, source-text + byte-equality) | request-response | self lines 31-69 (existing 5 forward-defense assertions; the file's docblock at lines 1-19 already names Phase 18 as the consumer of the extension) | exact (self-evolution; D-16 amendment authored to invite this expansion) |
| `tests/api/cache-hit-logs.test.ts` | MODIFY | test (api) | request-response | self lines 107-188 (existing 3 cases asserting `chat.cache_metrics` log shape via `vi.spyOn(console, "log")`) | exact (self-evolution; META-02 closure adds one new spy on `appendTurn`) |

---

## Pattern Assignments

### `src/lib/chat-transcripts.ts` (NEW — service, KV CRUD pure module)

**Analog:** `src/lib/validation.ts` (the only sibling under `src/lib/`).

**Module-shape pattern to copy** (from `src/lib/validation.ts:1-46`):
```typescript
import { z } from "zod";

// [comment block explaining the contract + decision IDs]

export const SomethingSchema = z.object({ ... });

export type ValidatedSomething = z.infer<typeof SomethingSchema>;

export function doThing(
  body: unknown
): { success: true; data: ValidatedSomething } | { success: false; error: string } {
  // ...
  return { success: true, data: result.data };
}
```

**Why this is the analog:** It is the only existing `src/lib/*` module, it has zero non-stdlib deps (Zod is in-stack), it exports named functions and types (no default), and inline comments cite decision IDs (`D-22`, `D-23`, `WR-04`, `Plan 17-08 Task 2-ALPHA`). `chat-transcripts.ts` must follow this exact shape: named exports, no default, inline-comment decision-ID citations (`D-05`, `D-06`, `D-07`, `D-09`, `D-12`, `D-13`, `KV-02..05`, `META-01`, `META-02`).

**KV write contract** (from RESEARCH §"Pattern 2" + §"Code Examples 1-2", verbatim):
```typescript
const KEY_PREFIX = "live:";
const TRANSCRIPT_TTL_SECONDS = 30 * 24 * 3600; // 30 days

// Read-modify-write — getWithMetadata so cron path's list({prefix}) can read
// last_activity_at + msg_count inline without per-key get() round-trips.
const { value: existing, metadata: existingMeta } =
  await kv.getWithMetadata<ChatTranscript, KVMetadata>(key, { type: "json" });

// ... 30-turn trim (D-05), KV-05 quota check, meta merge ...

await kv.put(key, JSON.stringify(updated), {
  expirationTtl: TRANSCRIPT_TTL_SECONDS,
  metadata: nextMetadata,
});
```

**30-turn trim algorithm** (from RESEARCH §"Pitfall 6", exact implementation):
```typescript
const TURN_CAP = 30;
const next = [...existing.messages, newTurn];
let truncated = existing.truncated ?? false;
if (next.length > TURN_CAP) {
  next.splice(0, next.length - TURN_CAP);
  truncated = true; // D-06: one-way set
}
```

**KV-05 quota guard (inline metadata)** (RESEARCH §"KV-05 quota storage shape recommendation"):
- Window: rolling 1-hour. Cap: 100 writes per sessionId.
- Storage: inline in `metadata: { window_started_at, window_count }` (NOT a sibling key — cheaper, more cohesive per Claude's Discretion bullet).
- On overflow: `console.warn("chat.transcript.quota_exceeded", { sessionId, count_in_window })` and RETURN (do not throw — caller is `ctx.waitUntil`, throw is silently swallowed; explicit return keeps the contract honest).

**Concurrent-write race observability** (D-13, RESEARCH §"Pitfall 2" clarification):
```typescript
// Single-invocation scope only (RESEARCH §"Pitfall 2" recommendation a).
// Cross-invocation races at v1.3 scale do not justify the design cost.
if (previousTailLen !== null && currentReadLen < previousTailLen) {
  console.warn("chat.transcript.race_suspected", {
    sessionId: sid,
    in_memory_tail_len: previousTailLen,
    kv_read_len: currentReadLen,
  });
}
```

**Inline-comment style precedent** (from `src/lib/validation.ts:65-114`):
- Multi-line `//` block citing review-iteration tags (`WR-04`, `Plan 17-08 Task 2-ALPHA`)
- Decision-ID cross-references in line
- "Verified at plan-time on YYYY-MM-DD" anchor lines acceptable

**What NOT to import** (anti-pattern per RESEARCH §"Don't Hand-Roll"):
- No `Anthropic` SDK import — pure module
- No `request` / `Headers` reach-in — pure module; caller passes `meta`
- No `cloudflare:workers` virtual module — caller passes `kv: KVNamespace`
- No SSE encoder/decoder — pure module

---

### `tests/api/chat-transcripts.test.ts` (NEW — unit test for pure module)

**Analog:** `tests/api/validation.test.ts` (sibling pattern — pure module unit test).

**Imports + describe structure** (verbatim from `tests/api/validation.test.ts:1-19`):
```typescript
import { describe, it, expect } from "vitest";
import {
  validateRequest,
  sanitizeMessages,
  type ValidatedMessage,
} from "../../src/lib/validation";

describe("Input Validation (D-22, D-23)", () => {
  it("accepts valid single message", () => {
    const result = validateRequest({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.success).toBe(true);
    // ...
  });
});
```

**Mock KV pattern** (RESEARCH §"Supporting" — hand-rolled, ~30 LOC):
```typescript
// Hand-rolled mock KV. No external dep. ~30 LOC.
class MockKVNamespace {
  storage = new Map<string, { value: string; metadata: unknown; expirationTtl?: number }>();
  async get(key: string, opts?: { type: "json" }): Promise<unknown> {
    const entry = this.storage.get(key);
    if (!entry) return null;
    return opts?.type === "json" ? JSON.parse(entry.value) : entry.value;
  }
  async getWithMetadata<V, M>(
    key: string,
    opts?: { type: "json" },
  ): Promise<{ value: V | null; metadata: M | null }> {
    const entry = this.storage.get(key);
    if (!entry) return { value: null, metadata: null };
    return {
      value: opts?.type === "json" ? JSON.parse(entry.value) : (entry.value as unknown as V),
      metadata: (entry.metadata as M) ?? null,
    };
  }
  async put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; metadata?: unknown },
  ): Promise<void> {
    this.storage.set(key, { value, metadata: options?.metadata, expirationTtl: options?.expirationTtl });
  }
  async list<M>(opts?: { prefix?: string }): Promise<{ keys: { name: string; metadata: M }[] }> {
    const prefix = opts?.prefix ?? "";
    const keys = [...this.storage.entries()]
      .filter(([k]) => k.startsWith(prefix))
      .map(([name, entry]) => ({ name, metadata: entry.metadata as M }));
    return { keys };
  }
}
```

**Console-spy pattern for log assertions** (verbatim from `tests/api/cache-hit-logs.test.ts:107-141`):
```typescript
describe("...", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits chat.transcript.quota_exceeded when window_count >= 100", async () => {
    // ... arrange + appendTurn call ...
    const call = warnSpy.mock.calls.find((c) => c[0] === "chat.transcript.quota_exceeded");
    expect(call).toBeDefined();
    expect(call![1]).toMatchObject({ sessionId: SID, count_in_window: expect.any(Number) });
  });
});
```

**Required test cases** (per CONTEXT.md Claude's Discretion + D-26 expansion list):
1. Schema versioning: `{ v: 1 }` on first write; preserved across subsequent writes.
2. `expirationTtl: 30 * 24 * 3600` passed on every `put()`.
3. Metadata shape: `{ last_activity_at, msg_count, window_started_at, window_count }` ≤ 1024 bytes serialized.
4. 30-turn cap drop-oldest: append 31 → `messages.length === 30`, `truncated === true`.
5. Boundary: append exactly 30 → `messages.length === 30`, `truncated === false` (Pitfall 6 anti-off-by-one).
6. `truncated=true` one-way (D-06): set on first drop, never unset even if subsequent writes are within cap.
7. KV-05 quota reject: 101st write within 1h window → `console.warn("chat.transcript.quota_exceeded", …)`, no `put()` call.
8. Quota window expiration: 101st write AFTER 1h elapsed → window reset to 1, write proceeds.
9. `referrer` / `user_agent` truncated to 512 chars (META-01).
10. `race_suspected` log when read returns shorter `messages.length` than `previousTailLen` (single-invocation race detection).
11. `write_failed` error class capture: when `kv.put` throws, error log shape includes `error_class: err.constructor.name` (D-09).

**Hard-coded fixture sessionId** (CONTEXT.md "Claude's Discretion" — hard-coded is fine):
```typescript
const SID = "8b0f7f1c-1234-4567-8901-abcdef012345"; // valid UUIDv4, used across all tests
```

---

### `tests/api/chat-session-id.test.ts` (NEW — IDENT-02 server-side validation)

**Analog:** `tests/api/validation.test.ts` (positive/negative `validateRequest` cases) + `tests/api/cache-hit-logs.test.ts` (full-handler drive pattern for the missing-tolerance branch).

**Schema-level test pattern** (verbatim style from `tests/api/validation.test.ts:8-72`):
```typescript
describe("IDENT-02: sessionId validation (D-04 missing-tolerant)", () => {
  it("accepts valid UUIDv4 sessionId", () => {
    const result = validateRequest({
      sessionId: "8b0f7f1c-1234-4567-8901-abcdef012345",
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionId).toBe("8b0f7f1c-1234-4567-8901-abcdef012345");
    }
  });

  it("accepts request with sessionId field absent (D-04 missing-tolerant)", () => {
    const result = validateRequest({
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionId).toBeUndefined();
    }
  });

  it("rejects malformed sessionId (not UUIDv4) → 400 invalid_request", () => {
    const result = validateRequest({
      sessionId: "not-a-uuid",
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects UUIDv5 (must be specifically v4 per IDENT-02)", () => {
    // v5 differs from v4: "5" in the third group's first hex
    const result = validateRequest({
      sessionId: "8b0f7f1c-1234-5567-8901-abcdef012345",
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(result.success).toBe(false);
  });
});
```

**Handler-level missing-tolerance branch test** (full POST drive — verbatim pattern from `tests/api/cache-hit-logs.test.ts:82-105, 119-142`):
```typescript
vi.mock("cloudflare:workers", () => ({
  env: { ANTHROPIC_API_KEY: "test-key-for-mock", CHAT_KV: /* mock KV */ },
}));

// Spy on appendTurn imports — assert it is NOT called when sessionId is absent
import * as transcripts from "../../src/lib/chat-transcripts";

describe("D-04: api/chat.ts skips appendTurn entirely when sessionId is absent", () => {
  let appendTurnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    appendTurnSpy = vi.spyOn(transcripts, "appendTurn").mockResolvedValue(undefined);
  });

  it("missing sessionId → SSE stream serves normally, appendTurn never called", async () => {
    // request body WITHOUT sessionId field
    const { POST } = await import("../../src/pages/api/chat");
    const response = await POST({ request: buildRequestNoSid() } as never);
    const body = await drain(response);
    expect(body).toContain("data: [DONE]");
    expect(appendTurnSpy).not.toHaveBeenCalled();
  });

  it("present sessionId → SSE stream serves normally, appendTurn called twice (user + assistant)", async () => {
    const { POST } = await import("../../src/pages/api/chat");
    const response = await POST({ request: buildRequestWithSid() } as never);
    await drain(response);
    expect(appendTurnSpy).toHaveBeenCalledTimes(2);
  });
});
```

---

### `tests/client/chat-sessionid-mint.test.ts` (NEW — IDENT-01 client mint)

**Analog:** `tests/client/listener-dedup.test.ts` (verbatim — jsdom + `vi.spyOn(document)` + `vi.resetModules()` + two-prong source-text + behavioral).

**File header convention** (verbatim from `tests/client/listener-dedup.test.ts:1-2`):
```typescript
// @vitest-environment jsdom
/**
 * IDENT-01 — sessionId mint on bubble click, persisted in chat-history
 * localStorage blob. STORAGE_VERSION 1→2 auto-clear path.
 *
 * Two-prong validation (mirrors DEBT-04 in tests/client/listener-dedup.test.ts):
 *
 *   1. SOURCE-LEVEL — chat.ts contains STORAGE_VERSION = 2 (not 1) and
 *      ChatStorage extends with sessionId: string. crypto.randomUUID() is
 *      called inside initChat / bubble click handler.
 *
 *   2. BEHAVIORAL — under jsdom: (a) clicking the bubble when localStorage is
 *      empty mints a UUIDv4 and persists it; (b) clicking the bubble when a
 *      v1-shape blob is present triggers auto-clear + fresh mint; (c) clicking
 *      the bubble when a v2-shape blob is present preserves the existing
 *      sessionId (cross-visit continuity per D-01); (d) when crypto.randomUUID
 *      throws or localStorage setItem throws, sessionId stays undefined and
 *      the body field is omitted (D-04 silent-fail).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
```

**jsdom setup pattern** (verbatim from `tests/client/listener-dedup.test.ts:124-147`):
```typescript
beforeEach(() => {
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
    constructor(public cb: IntersectionObserverCallback) {}
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  };
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
  (globalThis as unknown as { fetch: unknown }).fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});
```

**Source-text assertions** (mirror `tests/client/listener-dedup.test.ts:79-117`):
```typescript
const src = readFileSync(join(process.cwd(), "src/scripts/chat.ts"), "utf8");

it("STORAGE_VERSION = 2 (not 1)", () => {
  expect(src).toMatch(/const\s+STORAGE_VERSION\s*=\s*2\b/);
  expect(src).not.toMatch(/const\s+STORAGE_VERSION\s*=\s*1\b/);
});

it("ChatStorage interface extends with sessionId", () => {
  // version: 2 + sessionId field in the interface
  expect(src).toMatch(/version:\s*2\b/);
  expect(src).toMatch(/sessionId\s*:\s*string/);
});

it("crypto.randomUUID() is called from the click-handler / mint path", () => {
  expect(src).toMatch(/crypto\.randomUUID\(\)/);
});
```

**Behavioral mint assertion** (jsdom-based — mirror `tests/client/listener-dedup.test.ts:154-185`):
```typescript
it("mints a UUIDv4 on first bubble click when no chat-history blob exists", async () => {
  // Build full chat panel fixture (chat-panel + chat-bubble + ... required by initChat)
  document.body.innerHTML = `<div id="chat-panel">...</div>...`;
  // Spy on crypto.randomUUID — assert called exactly once
  const uuid = "8b0f7f1c-1234-4567-8901-abcdef012345";
  vi.spyOn(crypto, "randomUUID").mockReturnValue(uuid);

  await import("../../src/scripts/chat");
  document.getElementById("chat-bubble")!.click();

  const stored = JSON.parse(localStorage.getItem("chat-history")!);
  expect(stored.version).toBe(2);
  expect(stored.sessionId).toBe(uuid);
});

it("D-04: when crypto.randomUUID throws, sessionId stays undefined and the field is omitted from /api/chat body", async () => {
  vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
    throw new Error("crypto unavailable");
  });
  // ... click bubble + submit a message ...
  // Assert: fetch was called with body that does NOT contain "sessionId" key
  const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
  const body = JSON.parse(fetchCall[1].body);
  expect("sessionId" in body).toBe(false);
});
```

---

### `tests/build/append-turn-call-site.test.ts` (NEW — source-text forward-defense)

**Analog:** `tests/build/worker-entrypoint.test.ts` (verbatim — `readFileSync` + `expect(src).toMatch(regex)` for `ctx.waitUntil` source-text guard).

**Full canonical idiom** (verbatim from `tests/build/worker-entrypoint.test.ts:13-44`):
```typescript
/**
 * D-10 / D-11 — appendTurn call-site forward defense.
 *
 * Two ctx.waitUntil(appendTurn(…).catch(…)) calls must appear in api/chat.ts:
 *   1. AFTER validateRequest, BEFORE the Anthropic stream begins (D-10).
 *   2. AFTER controller.close(), inside the start(controller) closure (D-11).
 *
 * Pattern follows tests/build/worker-entrypoint.test.ts — readFileSync the
 * source file, assert source-text invariants via regex. This is the anti-
 * regression invariant: future edits that drop the waitUntil wrapper, the
 * .catch chain, or the call-site anchor would silently break the durability
 * contract (D-09 silent-fail without the .catch; D-15 byte-identical SSE if
 * waitUntil is replaced with await).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("D-10 / D-11: ctx.waitUntil(appendTurn(...)) call sites in api/chat.ts", () => {
  const src = readFileSync(join(process.cwd(), "src/pages/api/chat.ts"), "utf8");

  it("imports appendTurn from chat-transcripts", () => {
    expect(src).toMatch(/import\s*\{\s*appendTurn\s*\}\s*from\s*["']\.\.\/\.\.\/lib\/chat-transcripts["']/);
  });

  it("D-10: ctx.waitUntil(appendTurn(...)) for user turn appears AFTER validateRequest", () => {
    const validateIdx = src.search(/validateRequest\(/);
    const userWaitIdx = src.search(/ctx\.waitUntil\(\s*appendTurn\([^)]*["']user["']/);
    expect(validateIdx).toBeGreaterThan(-1);
    expect(userWaitIdx).toBeGreaterThan(-1);
    expect(userWaitIdx).toBeGreaterThan(validateIdx);
  });

  it("D-11: ctx.waitUntil(appendTurn(...)) for assistant turn appears AFTER controller.close()", () => {
    const closeIdx = src.search(/controller\.close\(\)/);
    const assistantWaitIdx = src.search(/ctx\.waitUntil\(\s*appendTurn\([^)]*["']assistant["']/);
    expect(closeIdx).toBeGreaterThan(-1);
    expect(assistantWaitIdx).toBeGreaterThan(-1);
    expect(assistantWaitIdx).toBeGreaterThan(closeIdx);
  });

  it("D-09: both ctx.waitUntil calls chain a .catch handler (rejection-safe)", () => {
    // Find all ctx.waitUntil(appendTurn(...)... patterns; assert each contains .catch(
    // (RESEARCH §"Pitfall 1": ctx.waitUntil rejections are silently swallowed
    // without an explicit .catch before passing to waitUntil.)
    const matches = src.match(/ctx\.waitUntil\(\s*appendTurn\([\s\S]*?\)\s*\)/g) ?? [];
    expect(matches.length).toBe(2);
    for (const match of matches) {
      expect(match).toContain(".catch(");
    }
  });

  it("anti-pattern: no ctx destructure (loses this binding per RESEARCH Pitfall 1)", () => {
    expect(src).not.toMatch(/const\s*\{\s*waitUntil\s*\}\s*=\s*ctx\b/);
  });
});
```

---

### `18-UAT.md` (NEW — at phase close)

**Analog:** `.planning/phases/17-foundations-migration-dns-debt-sweep/17-UAT.md`.

**Front-matter pattern** (verbatim from `17-UAT.md:1-8`):
```yaml
---
status: in-progress
phase: 18-persistence-identity-kv-write-path-sessionid
source: [18-01-SUMMARY.md, 18-02-SUMMARY.md, ...]  # plans authored during execution
started: 2026-MM-DDTHH:MM:SSZ
updated: 2026-MM-DDTHH:MM:SSZ
---
```

**Test entry shape** (verbatim from `17-UAT.md:14-25`):
```markdown
## Tests

### N. [Test name — Phase 18 TEST-03 3× identical UAT]
expected: |
  D-14: Open `*.workers.dev` preview. Send the SAME single user message 3 times within 5 minutes via the chat bubble. Open `wrangler tail` in a separate terminal. After each response, observe one `chat.cache_metrics` log line. On call 1, `cache_read_input_tokens === 0` AND `cache_creation_input_tokens > 0`. On calls 2 and 3, `cache_read_input_tokens > 0` AND `cache_creation_input_tokens === 0`. CACHE MISS on call 2 or 3 BLOCKS phase close (D-15) — root-cause via Anthropic system-block byte-diff before merging.
result: [pending]
```

**`wrangler tail` command + expected log shape** (per CONTEXT.md D-14):
```
wrangler tail --format pretty --search "chat.cache_metrics"
```
Expected per-response log line (per Plan 17-05 commit `7c3827e` + `api/chat.ts:144-148`):
```json
{
  "cache_read_input_tokens": <int>,
  "cache_creation_input_tokens": <int>,
  "input_tokens": <int>,
  "output_tokens": <int>
}
```

**Preview URL pattern** (per CONTEXT.md "Specifics" + Plan 17-02 SUMMARY):
```
https://{worker-name}-pr-{build-id}.jackcutrara.workers.dev
```
For this Worker: `jack-cutrara-portfolio-pr-{N}.jackcutrara.workers.dev`.

---

### `src/pages/api/chat.ts` (MODIFY — wire two `ctx.waitUntil(appendTurn(...))` calls)

**Analog:** self at lines 97-185 (existing SSE handler structure).

**Current signature** (line 15):
```typescript
export const POST: APIRoute = async ({ request }) => {
```

**Target signature for ctx access** (RESEARCH § Open Questions (RESOLVED) Q1 — `locals.cfContext` is the Astro v6 canonical path; `locals.runtime.ctx` was REMOVED in Astro v6 and throws at runtime):
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  const ctx = (locals as { cfContext?: { waitUntil: (p: Promise<unknown>) => void } } | undefined)
    ?.cfContext
    ?? { waitUntil: (_p: Promise<unknown>) => {} };  // defensive fallback for test env (no locals)
  // ...
};
```
**Verified via:** direct read of `node_modules/@astrojs/cloudflare/dist/utils/handler.js:64-91` during iteration-1 revision. The v5 `locals.runtime.ctx` getter now throws `"Astro.locals.runtime.ctx has been removed in Astro v6. Use 'Astro.locals.cfContext' instead."` The defensive fallback enables existing chat-surface tests (sse-snapshot, cache-hit-logs) to call `POST({ request } as never)` without supplying locals — production Workers runtime always populates `locals.cfContext`.

**D-10 insertion anchor** (AFTER `validateRequest` at line 75-81, BEFORE `client.messages.create` at line 112-114):
```typescript
// D-10: user-turn KV write — fire-and-forget AFTER validation, BEFORE stream open.
// .catch BEFORE waitUntil per RESEARCH §"Pitfall 1" (silent-swallow rule).
if (validation.data.sessionId) {
  const sid = validation.data.sessionId;
  const userContent = messages[messages.length - 1].content;
  const sessionMeta = captureRequestMeta(request); // see helper below
  ctx.waitUntil(
    appendTurn(env.CHAT_KV, sid, "user", userContent, sessionMeta).catch((err: unknown) => {
      console.error("chat.transcript.write_failed", {
        sessionId: sid,
        role: "user",
        error_class: err instanceof Error ? err.constructor.name : "unknown",
      });
    })
  );
}
```

**D-11 insertion anchor** (AFTER `controller.close()` at line 170, INSIDE the `start(controller)` closure):
```typescript
// D-11: assistant-turn write AFTER controller.close() — accumulator strategy.
// Accumulator (let accumulator = "") declared at top of start(controller), populated
// inside the for-await loop's content_block_delta branch:
//   accumulator += event.delta.text;
controller.close();

if (validation.data.sessionId && accumulator) {
  const sid = validation.data.sessionId;
  ctx.waitUntil(
    appendTurn(env.CHAT_KV, sid, "assistant", accumulator, {
      cache_read_input_tokens: cacheUsage?.cache_read_input_tokens ?? 0,
      cache_creation_input_tokens: cacheUsage?.cache_creation_input_tokens ?? 0,
    }).catch((err: unknown) => {
      console.error("chat.transcript.write_failed", {
        sessionId: sid,
        role: "assistant",
        content_length: accumulator.length,
        error_class: err instanceof Error ? err.constructor.name : "unknown",
      });
    })
  );
}
```

**Accumulator wiring** (inside `start(controller)` closure — top-of-closure declaration):
```typescript
let accumulator = "";
// ... inside for-await content_block_delta branch (line 118-125):
controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
accumulator += event.delta.text;  // NEW — META-02 source-of-truth-once
```

**Anti-pattern callouts** (RESEARCH §"Anti-Patterns" + Pitfall 1):
- DO NOT `await` the KV `put` inline in the SSE loop (lengthens TTFB, orphans on browser-close mid-stream)
- DO NOT destructure `ctx` (`const { waitUntil } = ctx` — "Illegal invocation" runtime error)
- DO NOT add new SSE frame types for persistence acknowledgment (D-15)

**META-02 source-of-truth-once** (RESEARCH §"META-02"): the `cacheUsage` object already exists at line 107-111 / 154-158 for the `chat.cache_metrics` log emission. Pass the SAME object into `appendTurn(assistant, ..., meta)` — do not re-read.

**META-01 request.cf capture helper** (RESEARCH §"Code Examples 5", per Pitfall 4 defensive read):
```typescript
function captureRequestMeta(request: Request): AppendTurnMeta {
  const cf = (request as unknown as { cf?: IncomingRequestCfProperties }).cf;
  return {
    referrer: truncate(request.headers.get("Referer"), 512),
    user_agent: truncate(request.headers.get("User-Agent"), 512),
    country: cf?.country ?? null,
    region: cf?.region ?? null,
    colo: cf?.colo ?? null,
  };
}
```
First-turn-only pin (per CONTEXT.md Claude's Discretion default): `appendTurn` internally checks `existing?.meta` — if present, preserves; if absent, writes. No "Re-pin" logic.

---

### `src/scripts/chat.ts` (MODIFY — STORAGE_VERSION 1→2, mint on bubble click)

**Analog:** self at lines 68-120 (ChatStorage + save/load) and lines 572-660 (initChat / openPanel).

**Current ChatStorage interface (lines 68-82)** — exact current shape:
```typescript
interface StoredMessage {
  role: "user" | "bot";
  content: string;
  timestamp: string;
}

interface ChatStorage {
  version: 1;
  messages: StoredMessage[];
  lastActive: string; // ISO 8601
}

const STORAGE_KEY = "chat-history";
const STORAGE_VERSION = 1;
const MAX_MESSAGES = 50;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
```

**Target shape (D-02):**
```typescript
interface ChatStorage {
  version: 2;
  sessionId: string;
  messages: StoredMessage[];
  lastActive: string;
}

const STORAGE_VERSION = 2;  // 1→2 atomic-wipe per IDENT-01
```

**Current `saveChatHistory` (lines 85-96)** — exact signature:
```typescript
function saveChatHistory(msgs: StoredMessage[]): void {
  const data: ChatStorage = {
    version: STORAGE_VERSION,
    messages: msgs.slice(-MAX_MESSAGES),
    lastActive: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail
  }
}
```

**Target — thread sessionId through:**
```typescript
function saveChatHistory(msgs: StoredMessage[], sessionId: string | undefined): void {
  if (!sessionId) return; // D-04: no persistence without sessionId
  const data: ChatStorage = {
    version: STORAGE_VERSION,  // 2
    sessionId,
    messages: msgs.slice(-MAX_MESSAGES),
    lastActive: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail
  }
}
```

**Current `loadChatHistory` (lines 98-120)** — exact pattern + the auto-clear gate at lines 104-106 (the IDENT-01 wipe mechanism, NO new code path):
```typescript
function loadChatHistory(): StoredMessage[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ChatStorage;
    // Version check -- clear if schema has changed
    if (!data.version || data.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // ...
  } catch { /* ... */ }
}
```

**Target — return `{ messages, sessionId }` shape:**
```typescript
function loadChatHistory(): { messages: StoredMessage[]; sessionId: string } | null {
  // ... same TTL + version gate (1→2 mismatch auto-clears) ...
  // Return both fields after gates pass.
  return { messages: data.messages, sessionId: data.sessionId };
}
```

**Bubble-click mint sub-routine** (per CONTEXT.md "Specifics" — ordering: click → check → mint+persist → animate panel open). Insert in `initChat` between lines 624 (`startPulse($bubble)`) and 628 (`openPanel`'s bubble-click registration site — depending on exact handler binding). The closest existing pattern:
- D-04 silent-fail wrap (try/catch around `crypto.randomUUID()` AND `localStorage.setItem` — both can throw):

```typescript
let sessionId: string | undefined = undefined;

// On bubble click handler (BEFORE openPanel animation begins):
function ensureSessionId(): void {
  if (sessionId) return; // already minted this session
  const stored = loadChatHistory();
  if (stored?.sessionId) {
    sessionId = stored.sessionId; // cross-visit continuity within 24h
    return;
  }
  // Mint fresh
  try {
    sessionId = crypto.randomUUID();
    saveChatHistory(chatLog, sessionId); // persist immediately so reload preserves
  } catch {
    // D-04: leave sessionId undefined; field will be omitted from /api/chat body
    sessionId = undefined;
  }
}
```

**streamChat body shape (current line 191):**
```typescript
body: JSON.stringify({ messages: chatMessages }),
```
**Target (D-04 — omit field if undefined):**
```typescript
body: JSON.stringify(
  sessionId
    ? { sessionId, messages: chatMessages }
    : { messages: chatMessages }
),
```

**Existing client-side log mirror pattern** (verbatim from `src/scripts/chat.ts:273-283`) — Phase 18 does NOT add new client-side logs; existing `chat.response_metrics_client` log line is untouched. Phase 18 only impacts the request body shape and bubble-click sub-routine; no new console logs on the client tier per CONTEXT.md.

---

### `src/lib/validation.ts` (MODIFY — RequestSchema extension)

**Analog:** self at lines 31-33.

**Current `RequestSchema` (lines 31-33), verbatim:**
```typescript
export const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
});
```

**Target shape (D-04 + RESEARCH §"Zod uuid() vs uuidv4()"):**
```typescript
export const RequestSchema = z.object({
  sessionId: z.uuidv4().optional(),  // D-04: missing-tolerant; IDENT-02: UUIDv4-specific
  messages: z.array(MessageSchema).min(1).max(30),
});
```

**Why `z.uuidv4()` not `z.string().uuid()` or `z.uuid()`** (per RESEARCH §"Zod uuid() vs uuidv4()"):
- `z.string().uuid()` — deprecated in v4, version-agnostic (would accept v5/v6/v7).
- `z.uuid()` — top-level, RFC 9562/4122 compliant but version-agnostic.
- `z.uuidv4()` — top-level, version-specific. **Matches IDENT-02 "UUIDv4 regex" wording exactly.**

**Verify Zod v4 availability** (RESEARCH Open Question Q1 / Assumption A4): `package.json:32` shows `zod@^4.3.6` — `z.uuidv4` IS in this version. No version bump needed.

**Type emission** (line 36 — auto-updates from inference):
```typescript
export type ValidatedRequest = z.infer<typeof RequestSchema>;
// becomes: { sessionId?: string; messages: ValidatedMessage[] }
```

No edits required to `validateRequest` function signature (line 38-46) — return shape carries `data: ValidatedRequest` which now includes optional sessionId.

---

### `tests/api/anthropic-payload-shape.test.ts` (MODIFY — D-16 extension)

**Analog:** self at lines 31-69 (existing 5 forward-defense tests).

**Existing 5 tests pattern** (verbatim from lines 31-69):
```typescript
describe("TEST-03: Anthropic payload shape — no per-session fields in cacheable surface", () => {
  const ctx = portfolioContext as unknown as PortfolioContext;
  const args1 = buildChatRequestArgs(ctx, [
    { role: "user", content: "What's your favorite project?" },
  ]);
  const args2 = buildChatRequestArgs(ctx, [
    { role: "user", content: "Tell me about TypeScript." },
  ]);

  it("system block does not contain literal 'sessionId'", () => { /* ... */ });
  it("system block does not contain a UUIDv4 pattern", () => { /* ... */ });
  it("messages[0].content does not contain literal 'sessionId'", () => { /* ... */ });
  it("messages[0].content does not contain a UUIDv4 pattern", () => { /* ... */ });
  it("system block is byte-identical across calls with different messages (cacheable)", () => { /* ... */ });
});
```

**D-16 NEW assertions to add (CONTEXT.md D-16 + RESEARCH §"D-16 extension"):**

**(a) Byte-equality across sessionId-bearing vs no-sessionId calls — catches template-string leak:**
```typescript
it("D-16: sessionId-on-envelope path produces byte-identical system block as no-sessionId path", () => {
  // Simulate the api/chat.ts code path: validateRequest produces a ValidatedRequest
  // with sessionId; the messages passed to buildChatRequestArgs are the SAME shape
  // regardless of sessionId presence. So calling buildChatRequestArgs with the same
  // messages MUST produce byte-identical args.system + messages[0] whether sessionId
  // is "on the envelope" or not.
  const sameMessages = [{ role: "user", content: "Hi" }];
  const argsWithSidContext = buildChatRequestArgs(ctx, sameMessages);
  const argsNoSidContext = buildChatRequestArgs(ctx, sameMessages);
  expect(JSON.stringify(argsWithSidContext.system)).toBe(JSON.stringify(argsNoSidContext.system));
  expect(JSON.stringify(argsWithSidContext.messages[0])).toBe(JSON.stringify(argsNoSidContext.messages[0]));
});

it("D-16: buildChatRequestArgs signature does NOT accept sessionId (compile-time-equivalent)", () => {
  // Read chat-request-shape.ts source-text; assert the function signature contains
  // (context, messages) and NOT sessionId as a parameter. This is the structural
  // guard that an accidental signature extension cannot bypass without the test
  // failing first.
  const src = readFileSync(join(process.cwd(), "src/prompts/chat-request-shape.ts"), "utf8");
  expect(src).toMatch(/buildChatRequestArgs\s*\(\s*\w+\s*:\s*\w+\s*,\s*\w+\s*:[^)]*\)\s*[:{]/);
  // Function declaration must not name a sessionId param
  const sigMatch = src.match(/buildChatRequestArgs\s*\(([^)]*)\)/);
  expect(sigMatch?.[1]).not.toContain("sessionId");
});
```

**(b) validateRequest accepts the sessionId-on-envelope path:**
```typescript
it("D-16: validateRequest accepts a request body carrying sessionId on the envelope", () => {
  const result = validateRequest({
    sessionId: "8b0f7f1c-1234-4567-8901-abcdef012345",
    messages: [{ role: "user", content: "Hi" }],
  });
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.sessionId).toBe("8b0f7f1c-1234-4567-8901-abcdef012345");
  }
});
```

**Imports to add:**
```typescript
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateRequest } from "../../src/lib/validation";
```

---

### `tests/api/cache-hit-logs.test.ts` (MODIFY — META-02 closure)

**Analog:** self at lines 107-188 (existing 3 cache-metrics tests).

**Existing test shell** (verbatim from lines 107-117) — re-use for META-02 spy on `appendTurn`:
```typescript
describe("DEBT-02: chat.cache_metrics structured log seam", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  // ... existing 3 tests ...
});
```

**META-02 NEW test (per CONTEXT.md Integration Points):**
```typescript
import * as transcripts from "../../src/lib/chat-transcripts";

it("META-02: appendTurn(assistant, ...) receives the same cacheUsage object the log line consumes", async () => {
  const appendTurnSpy = vi.spyOn(transcripts, "appendTurn").mockResolvedValue(undefined);
  vi.doMock("@anthropic-ai/sdk", () =>
    mockAnthropicWithUsage({
      input_tokens: 100,
      cache_read_input_tokens: 80,
      cache_creation_input_tokens: 0,
      output_tokens: 50,
    })
  );
  const { POST } = await import("../../src/pages/api/chat");
  // Build a request that DOES carry sessionId so the appendTurn branch fires
  const request = new Request("https://jackcutrara.com/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://jackcutrara.com" },
    body: JSON.stringify({
      sessionId: "8b0f7f1c-1234-4567-8901-abcdef012345",
      messages: [{ role: "user", content: "Hi" }],
    }),
  });
  const response = await POST({ request, locals: mockLocals } as never);
  await drain(response);

  // Filter for the assistant turn (second call; user turn fires before stream)
  const assistantCall = appendTurnSpy.mock.calls.find(
    (c) => c[2] === "assistant",
  );
  expect(assistantCall).toBeDefined();
  // meta arg (index 4) carries the same cache token fields the log line emits
  const meta = assistantCall![4] as Record<string, unknown>;
  expect(meta.cache_read_input_tokens).toBe(80);
  expect(meta.cache_creation_input_tokens).toBe(0);
});
```

**`mockLocals` shape** (for `ctx.waitUntil` reachability under vitest — matches Plan 18-05's defensive `(locals as ...)?.cfContext` access path per RESEARCH § Open Questions (RESOLVED) Q1):
```typescript
const mockLocals = {
  cfContext: {
    waitUntil: (p: Promise<unknown>) => { void p; },  // immediate no-op; appendTurn spy captures the call synchronously when waitUntil's argument is built
    passThroughOnException: () => {},
  },
};
```

---

## Shared Patterns

### Structured-JSON `console.{log,warn,error}` line (Plan 17-05 DEBT-02)

**Source:** `src/pages/api/chat.ts:134` (`console.warn("chat.truncated", { stop_reason: "max_tokens" })`) and `src/pages/api/chat.ts:144-148` (`console.log("chat.cache_metrics", { ... })`).

**Apply to:** All Phase 18 KV-write observability lines.

**Excerpt — exact convention:**
```typescript
console.error("chat.transcript.write_failed", {
  sessionId: sid,               // primitive: string
  role: "user",                 // primitive: string literal
  error_class: err instanceof Error ? err.constructor.name : "unknown",  // primitive: string
});

console.warn("chat.transcript.quota_exceeded", {
  sessionId: sid,
  count_in_window: 101,
});

console.warn("chat.transcript.race_suspected", {
  sessionId: sid,
  in_memory_tail_len: 5,
  kv_read_len: 3,
});
```

**Convention rules (locked):**
- First arg = dotted-event-name string literal (`chat.transcript.*` namespace for Phase 18).
- Second arg = flat object, primitive values only (no nesting beyond one level — Workers Logs JSON parser handles flat best).
- Field NAMES locked by D-09 / D-12 / D-13; field ORDER is presentational (Claude's Discretion).
- Severity level: `error` for write failures (D-09), `warn` for quota+race (D-12, D-13).

**Anti-pattern reminder:** NEVER enqueue these as new SSE frames — D-15 forbids new frame types.

---

### `ctx.waitUntil(promise.catch(...))` rejection-safe pattern

**Source:** RESEARCH §"Pattern 1" + §"Pitfall 1" (Cloudflare best-practices doc).

**Apply to:** Both D-10 (user-turn) and D-11 (assistant-turn) write call sites in `src/pages/api/chat.ts`.

**Excerpt — exact form:**
```typescript
ctx.waitUntil(
  appendTurn(env.CHAT_KV, sid, role, content, meta).catch((err: unknown) => {
    console.error("chat.transcript.write_failed", {
      sessionId: sid,
      role,
      error_class: err instanceof Error ? err.constructor.name : "unknown",
    });
  })
);
```

**Locked invariants** (all sourced from RESEARCH):
1. `.catch(...)` MUST chain BEFORE the promise is passed to `ctx.waitUntil` — rejection is silently swallowed otherwise.
2. `ctx` MUST NOT be destructured (`const { waitUntil } = ctx` → "Illegal invocation" runtime error).
3. The promise body MUST NOT add SSE frames — out-of-band side effect only.
4. The promise body MUST NOT block via inline `await` outside its own closure — `ctx.waitUntil` owns the lifecycle.

**Source-text forward defense:** `tests/build/append-turn-call-site.test.ts` asserts all 4 invariants via regex on `api/chat.ts` source text.

---

### Source-text forward-defense test for source-of-truth invariants

**Source:** `tests/build/worker-entrypoint.test.ts` (FOUND-02 pattern, Plan 17-04) + `tests/build/no-imperative-display-flip.test.ts` (DEBT-05 pattern, Plan 17-08) + STATE.md retro line 116.

**Apply to:** Any Phase 18 source-of-truth invariant that depends on a string-shape rather than a runtime behavior.

**Canonical idiom:**
```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("D-XX: <invariant name>", () => {
  const src = readFileSync(join(process.cwd(), "<path>"), "utf8");

  it("<asserts source contains canonical pattern>", () => {
    expect(src).toMatch(/<regex>/);
  });

  it("<asserts source does NOT contain anti-pattern>", () => {
    expect(src).not.toMatch(/<anti-regex>/);
  });
});
```

**Phase 18 source-text guards:**
- `tests/build/append-turn-call-site.test.ts` — D-10 / D-11 `ctx.waitUntil(appendTurn(...).catch(...))` anchors + D-09 `.catch` chain + anti-destructure
- `tests/client/chat-sessionid-mint.test.ts` (source-level prong) — `STORAGE_VERSION === 2`, `ChatStorage` extends with `sessionId`, `crypto.randomUUID()` is called
- `tests/api/anthropic-payload-shape.test.ts` (D-16 part b) — `buildChatRequestArgs` signature does NOT name a `sessionId` param

**Why source-text and not behavioral:** These invariants protect a design-time decision (where in the file the call lives, what symbols are present) that no runtime behavior can detect alone. A behavioral test passes against any implementation that produces the same output; a source-text test fails the moment the canonical pattern is moved.

---

### `vi.mock("cloudflare:workers")` + Anthropic SDK mock pattern (Plan 17-01)

**Source:** `tests/api/sse-snapshot.test.ts:27-56` and `tests/api/cache-hit-logs.test.ts:18-80`.

**Apply to:** All Phase 18 tests that drive `POST` from `src/pages/api/chat.ts` end-to-end.

**Excerpt — exact mock structure:**
```typescript
vi.mock("cloudflare:workers", () => ({
  env: {
    ANTHROPIC_API_KEY: "test-key-for-mock",
    CHAT_KV: new MockKVNamespace(),  // Phase 18 addition for appendTurn reach
  },
}));

vi.doMock("@anthropic-ai/sdk", () =>
  mockAnthropicWithUsage({
    input_tokens: 100,
    cache_read_input_tokens: 80,
    cache_creation_input_tokens: 0,
    output_tokens: 50,
  })
);

const { POST } = await import("../../src/pages/api/chat");
const response = await POST({ request: buildRequest(), locals: mockLocals } as never);
await drain(response);
```

**Drain helper** (verbatim from `tests/api/cache-hit-logs.test.ts:95-105`):
```typescript
async function drain(response: Response): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(decoder.decode(value));
  }
  return chunks.join("");
}
```

---

### `// @vitest-environment jsdom` + spy-on-document client-test pattern

**Source:** `tests/client/listener-dedup.test.ts` (DEBT-04 pattern).

**Apply to:** `tests/client/chat-sessionid-mint.test.ts` and any other Phase 18 client-side DOM-interaction test.

**Canonical idiom:**
```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("...", () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // jsdom-stub: IntersectionObserver, matchMedia, fetch (none of which jsdom provides)
    // ... (verbatim from listener-dedup.test.ts:124-147)
    addSpy = vi.spyOn(document, "addEventListener");
    removeSpy = vi.spyOn(document, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("evaluating <module> calls <expected DOM API>", async () => {
    vi.resetModules();
    await import("../../src/scripts/chat");
    // ... assertions ...
  });
});
```

**Hard constraint** (RESEARCH §"Pitfall 8" + listener-dedup precedent): `vi.resetModules()` re-creates fresh handler references; cross-evaluation behavior is reference-mismatched. Keep each test self-contained — do not assume cross-test module state.

---

### CONTEXT.md "B6 sub-version changelog convention for amendments"

**Source:** STATE.md / Phase 17 retrospective (CONTEXT.md "Prior phase context").

**Apply to:** Any Phase 18 REQUIREMENTS.md amendment (KV-05 add per D-12; IDENT-02 amend per D-04).

**Convention (locked):** When adding KV-05 or amending IDENT-02, the change lands in REQUIREMENTS.md with a sub-version tag `(v1.3-B6)` (or whatever the current sub-version is) in the requirement-traceability table notes column. Forward-defense source-text test for KV-05 / IDENT-02 amendment text presence can be added under `tests/build/requirements-shape.test.ts` if planner wants (optional — CONTEXT.md does not lock).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | All Phase 18 files have at least a role-match analog in the existing repo. |

**Closest "no analog" cases worth noting (all still role-match):**
- `src/lib/chat-transcripts.ts` is the project's first "infrastructure helper" carving — it has a sibling module (`validation.ts`) but no prior KV-touching module. The shape is well-defined by RESEARCH §"Pattern 2" + §"Code Examples 1-2", so the planner has full reference even though the role is novel.
- `tests/api/chat-transcripts.test.ts` is the project's first test driving a pure module against a mock `KVNamespace` — the mock-KV pattern is hand-rolled per RESEARCH §"Supporting"; not a copy from existing tests but a documented 30-LOC pattern.

---

## Metadata

**Analog search scope:**
- `src/lib/` (1 file: `validation.ts`)
- `src/scripts/` (3 chat-surface files)
- `src/pages/api/` (1 file: `chat.ts`)
- `src/worker.ts` (entrypoint)
- `tests/api/` (8 files — chat.test, anthropic-payload-shape, cache-hit-logs, sse-snapshot, validation, etc.)
- `tests/build/` (15 files — worker-entrypoint, no-imperative-display-flip, chat-context-integrity, etc.)
- `tests/client/` (17 files — listener-dedup, chat-panel-display, etc.)
- `.planning/phases/17-foundations-migration-dns-debt-sweep/` (PATTERNS.md, UAT.md, RETROSPECTIVE.md)

**Files scanned (read or grepped):** ~22 (11 in-scope edit targets + 11 analog/reference files).

**Key insights:**
- Phase 18 is structurally **two `ctx.waitUntil` insertions + one pure module + four extension tests + one new module test + one new client test + one new build test + one UAT doc**. Every other concern (UUID gen, Zod validation, KV semantics, prompt-cache integrity) is already a solved upstream contract.
- The pure-module shape of `chat-transcripts.ts` follows `validation.ts` byte-for-byte structurally: named exports only, decision-ID inline comments, Zod-or-platform types only, zero downstream coupling.
- The four new test files map cleanly to four existing pattern templates: `validation.test.ts` (unit test of a pure module), `cache-hit-logs.test.ts` (full-handler drive with spy-on-console + mocked SDK), `listener-dedup.test.ts` (jsdom two-prong source-text + behavioral), `worker-entrypoint.test.ts` (build-time source-text forward defense).
- The D-15 SSE byte-identical invariant is upheld by the `ctx.waitUntil` calls landing OFF the controller-enqueue path. The existing `tests/api/sse-snapshot.test.ts` fixture (Phase 17 D-04 capture) is expected to pass into Phase 18 unchanged per its file-level docblock (lines 10-14).
- The cross-cutting `chat.transcript.*` log namespace is the new namespace Phase 18 adds; it follows the existing `chat.truncated` / `chat.cache_metrics` Plan 17-05 DEBT-02 convention exactly.

**Pattern extraction date:** 2026-05-11
