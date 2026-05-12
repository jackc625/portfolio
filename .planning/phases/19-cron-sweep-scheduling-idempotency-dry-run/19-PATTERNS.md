# Phase 19: Cron Sweep — Scheduling + Idempotency (DRY_RUN) — Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 7 (3 NEW, 3 MODIFY, 1 NEW UAT doc, 2 OPTIONAL build-test files)
**Analogs found:** 7 / 7 (3 exact, 4 role-match — see notes)

## File Classification

| New/Modified File | Action | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|--------|------|-----------|----------------|---------------|
| `wrangler.jsonc` | MODIFY | config (Cloudflare Worker manifest) | n/a (declarative config) | self (existing file) — diff is additive `vars.DRY_RUN` + flip `triggers.crons` from `[]` to `["0 * * * *"]` | exact (self-evolution; 2 isolated edits) |
| `src/worker.ts` | MODIFY | entrypoint (Workers `scheduled()` handler) | event-driven (cron tick → `ctx.waitUntil`) | self at lines 22-44 (existing `scheduled()` stub with the Phase 19 substitution target named in comment) | exact (self-evolution; replace stub body + extend `Env`) |
| `package.json` | MODIFY | config (npm scripts) | n/a | self at lines 9-25 (existing `scripts` block — `dev:worker` is the Phase 17 D-13 sibling for the fetch path) | exact (self-evolution; 1-line additive) |
| `src/lib/chat-delivery.ts` | NEW | service (pure infra helper) | KV CRUD (list-filter-readModifyWrite) + event-driven (cron-dispatched) | `src/lib/chat-transcripts.ts` (sibling pure module — named exports, KV reach via param, decision-ID inline citations, NO `cloudflare:workers` import) | exact (canonical sibling; Phase 18 PATTERNS.md explicitly names this as the analog) |
| `tests/api/chat-delivery.test.ts` | NEW | test (unit, mock KV + console spies) | request-response (function-call assertion) | `tests/api/chat-transcripts.test.ts` (peer file: `src/lib/X` ↔ `tests/api/X.test.ts`; same hand-rolled `MockKVNamespace`, same console-spy pattern) | exact (sibling pattern) |
| `tests/build/worker-scheduled-call-site.test.ts` | NEW (OPTIONAL) | test (build, source-text guard) | n/a (source-text grep) | `tests/build/append-turn-call-site.test.ts` (5-invariant source-text idiom: import-path, anchor-ordering, `.catch` chain count, anti-destructure, anti-SSE-frame) + `tests/build/worker-entrypoint.test.ts` (5-assertion existence/import-shape pattern on the same `src/worker.ts` file) | exact (two-analog reuse — append-turn-call-site for invariants; worker-entrypoint for the same target file) |
| `tests/build/wrangler-cron-shape.test.ts` | NEW (OPTIONAL) | test (build, source-text guard) | n/a (JSONC parse + shape assertion) | `tests/build/wrangler-shape.test.ts` (FOUND-04 — `parseJsonc` helper + 5 shape assertions on the same `wrangler.jsonc` file) | exact (same target file, extend with cron-shape assertion) |
| `19-UAT.md` | NEW (phase close) | doc (manual operator UAT spec) | n/a | `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md` (closest precedent — same `wrangler kv` operator surface; Phase 17 17-UAT.md established the `expected:` / `result:` block convention) | exact (precedent established Phase 17, deepened Phase 18 with `wrangler kv` operator commands) |

---

## Pattern Assignments

### `wrangler.jsonc` (MODIFY — 2 additive edits)

**Analog:** self at lines 1-28 (existing JSONC).

**Anchor decisions:** D-01 (DRY_RUN in `vars` block); D-02 (string `"1"` value); CRON-01 (hourly trigger).

**Current shape (verbatim from `wrangler.jsonc:1-28`):**
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "jack-cutrara-portfolio",
  "main": "./src/worker.ts",
  "compatibility_date": "2026-04-04",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist/client"
  },
  "kv_namespaces": [
    {
      "binding": "CHAT_KV",
      "id": "eaa30fef259e4a6b9505b41bbf3f8f01",
      "preview_id": "115f3c1b0f8a4a1da9fee78c48dcb749"
    }
  ],
  "triggers": {
    "crons": []                          // EDIT → ["0 * * * *"]
  },
  ...
}
```

**Target shape (Phase 19):**
```jsonc
  "kv_namespaces": [ /* unchanged */ ],
  "vars": {                              // NEW Phase 19 — D-01 / D-02
    "DRY_RUN": "1"                       // Phase 20 flips to "0"
  },
  "triggers": {
    "crons": ["0 * * * *"]               // EDIT Phase 19 — CRON-01
  },
```

**Forward-defense:** `tests/build/wrangler-shape.test.ts:47-52` currently asserts only `Array.isArray(triggers.crons)`. After Phase 19 lands, the empty-array tolerance there should TIGHTEN to `expect(crons).toEqual(["0 * * * *"])` — either in `wrangler-shape.test.ts` directly OR in the new `tests/build/wrangler-cron-shape.test.ts` (see below). Pitfall 6 (operator forgets to revert `*****` UAT) is the reason this test matters.

**Deviation:** None. Pure additive config edit; no migration semantics.

---

### `src/worker.ts` (MODIFY — replace stub body + extend `Env`)

**Analog:** self at lines 22-44 (existing `scheduled()` stub).

**Anchor decisions:** CRON-01 (handler delegates to `deliverDue`); D-01 (`Env.DRY_RUN: string`); Phase 18 D-09/D-10/D-11 (`.catch` INSIDE the promise).

**Current shape (verbatim from `src/worker.ts:1-44`):**
```typescript
import { handle } from "@astrojs/cloudflare/handler";

export interface Env {
  ASSETS: Fetcher;
  CHAT_KV: KVNamespace;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
  CHAT_RECIPIENT_EMAIL: string;
  CHAT_SENDER_EMAIL: string;
  CHAT_RATE_LIMITER?: RateLimit;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    return handle(request, env, ctx);
  },
  async scheduled(_controller, _env, ctx): Promise<void> {
    // Phase 19 will replace with: ctx.waitUntil(deliverDue(_env, _controller.scheduledTime));
    // Stub kept here so wrangler.jsonc triggers.crons declaration is wireable
    // ...
    console.warn("worker.scheduled.stub", {
      note: "Phase 19 will replace with deliverDue(env, controller.scheduledTime)",
      scheduledTime: _controller.scheduledTime,
      cron: _controller.cron,
    });
    ctx.waitUntil(Promise.resolve());
  },
} satisfies ExportedHandler<Env>;
```

**Target shape (Phase 19) — RESEARCH § Code Example 2:**
```typescript
import { handle } from "@astrojs/cloudflare/handler";
import { deliverDue } from "./lib/chat-delivery";   // NEW

export interface Env {
  ASSETS: Fetcher;
  CHAT_KV: KVNamespace;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
  CHAT_RECIPIENT_EMAIL: string;
  CHAT_SENDER_EMAIL: string;
  CHAT_RATE_LIMITER?: RateLimit;
  DRY_RUN: string;                                  // NEW — D-01 / D-02
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    return handle(request, env, ctx);
  },
  async scheduled(controller, env, ctx): Promise<void> {
    // .catch INSIDE per Phase 18 D-09/D-10/D-11 (ctx.waitUntil swallows
    // rejections without an explicit .catch chained before the pass-in).
    ctx.waitUntil(
      deliverDue(env, controller.scheduledTime).catch((err: unknown) => {
        console.error("worker.scheduled.failed", {
          error_class: err instanceof Error ? err.constructor.name : "Error",
        });
      })
    );
  },
} satisfies ExportedHandler<Env>;
```

**Critical anti-patterns to avoid** (verbatim from Phase 18 PATTERNS.md "Shared Patterns" section, also restated in RESEARCH § Anti-Patterns):
1. **No `ctx` destructure** — `const { waitUntil } = ctx` throws "Illegal invocation" at runtime.
2. **`.catch` chained INSIDE the promise** — `ctx.waitUntil(p.catch(...))`, NOT `ctx.waitUntil(p).catch(...)` (the latter is a type-error no-op since `waitUntil` returns `void`).
3. **Underscore-prefixed args (`_controller`, `_env`) MUST drop the prefix** — the new body uses both `controller.scheduledTime` and `env` actively. Existing stub's underscore prefix communicates "unused"; remove it during the edit.
4. **No `switch (controller.cron)` branch** — v1.3 has a single cron; per Pitfall 3 the handler runs unconditionally.

**Deviation:** The stub's `console.warn("worker.scheduled.stub", ...)` and `ctx.waitUntil(Promise.resolve())` are BOTH replaced (not amended). The forward-compat comment at line 27 is the substitution target; remove it along with the stub body.

---

### `package.json` (MODIFY — add `dev:cron` script)

**Analog:** self at lines 9-25 (existing `scripts` block); `dev:worker` (line 11) is the canonical sibling pattern from Phase 17 D-13.

**Anchor decisions:** D-13 (`pnpm dev:cron` script for local handler-wiring proof).

**Current `scripts` block (verbatim from `package.json:9-25`):**
```jsonc
  "scripts": {
    "dev": "astro dev",
    "dev:worker": "wrangler dev",          // Phase 17 D-13 sibling
    "build": "pnpm build:chat-context && wrangler types && astro check && astro build",
    "build:chat-context": "node scripts/build-chat-context.mjs",
    "build:chat-context:check": "node scripts/build-chat-context.mjs --check",
    "types": "wrangler types",
    "preview": "astro preview",
    "check": "astro check",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "test": "vitest run",
    "astro": "astro",
    "sync:projects": "node scripts/sync-projects.mjs",
    "sync:check": "node scripts/sync-projects.mjs --check"
  },
```

**Target — single additive line per RESEARCH § Code Example 4:**
```jsonc
    "dev": "astro dev",
    "dev:worker": "wrangler dev",
    "dev:cron": "wrangler dev --test-scheduled",   // NEW — D-13
    "build": "...",
```

**Operator invocation pattern (documented in 19-UAT.md Step 1 pre-flight):**
```bash
pnpm dev:cron
# In a separate terminal:
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```
(`+` for space encoding, VERIFIED via Context7 — see RESEARCH Open Question 4.)

**Deviation:** None. Pure additive script entry; matches the Phase 17 D-13 `dev:worker` precedent byte-for-byte stylistically.

---

### `src/lib/chat-delivery.ts` (NEW — pure module, ~150-250 LOC estimate)

**Analog:** `src/lib/chat-transcripts.ts` (sibling pure module, Phase 18 Plan 18-02). This is the canonical analog explicitly named in CONTEXT.md "Existing Code Insights" and in Phase 18 PATTERNS.md.

**Anchor decisions:** CRON-02 (two-keyspace partition + ordering invariant); CRON-03 (per-session try/catch + 50-session batch cap + 3-try retry + 50-page pagination hard-cap); CRON-04 (DRY_RUN flag); D-05 (envelope log shape); D-06 (no Resend wrapper in Phase 19); D-07 (retry harness with mock failure); D-08 (no subject derivation); D-09 / D-10 / D-11 (`delivered:{sid}` value + version + no metadata).

**Module-shape pattern (verbatim from `src/lib/chat-transcripts.ts:1-40`):**
```typescript
// chat-delivery.ts — pure cron-sweep module for transcript delivery (DRY_RUN-gated).
//
// Owns the entire Phase 19 cron sweep contract:
//   • CRON-02 — two-keyspace partition (live: → delivered:) with locked ordering
//   • CRON-03 — per-session try/catch isolation + 50-session batch cap
//               + 3-try retry harness + 50-page pagination hard-cap
//   • CRON-04 — DRY_RUN flag toggles inner send (env.DRY_RUN === "1")
//
// Decision IDs honored in this module:
//   D-01 / D-02 — env.DRY_RUN strict-equals-string check
//   D-05        — flat-field structured dry_run envelope log shape
//   D-06        — NO Resend wrapper import (Phase 20 creates it)
//   D-07        — 3-attempt retry harness, mock-failure-tested
//   D-09 / D-10 — delivered: value shape { v:1, sid, delivered_at, dry_run,
//                 msg_count, truncated }; schema-versioned
//   D-11        — NO KV metadata field on delivered: writes
//
// Pure module. NO imports from:
//   • @anthropic-ai/sdk          — cron path has no LLM surface
//   • cloudflare:workers         — caller (worker.ts scheduled()) passes Env
//   • src/prompts/, src/pages/   — no chat-surface coupling (D-26 anchor)
//   • src/lib/email/             — Phase 20 creates this; Phase 19 inlines envelope log
//
// Callers wrap deliverDue with ctx.waitUntil(...) and chain .catch() per
// RESEARCH § Pattern 1 + § Pitfall 1; see worker.ts scheduled() wiring.

import type { ChatTranscript, KVMetadata } from "./chat-transcripts";
import { KEY_PREFIX } from "./chat-transcripts";  // shared "live:" — schema source-of-truth

// ---------------------------------------------------------------------------
// Locked constants
// ---------------------------------------------------------------------------

export const INACTIVITY_THRESHOLD_MS = 2 * 60 * 60 * 1000; // STATE.md / RESEARCH § Pitfall 2 lock
export const PER_TICK_BATCH_CAP = 50;                      // CRON-03 lock
export const PAGINATION_PAGE_HARDCAP = 50;                 // CRON-03 safety valve
export const MAX_SEND_ATTEMPTS = 3;                        // CRON-03 lock
export const BACKOFF_BASE_MS = 250;                        // OQ-2 recommendation (full-jitter)
export const BACKOFF_CAP_MS = 5000;
export const DELIVERED_TTL_SECONDS = 24 * 3600;            // D-09 lock — 24h
```

**Public types pattern (mirror `chat-transcripts.ts:46-88`):**
```typescript
export interface DeliveredMarker {       // D-09 / D-10 — 24h delivered:{sid} value
  v: 1;                                  // schema discriminator, matches ChatTranscript.v
  sid: string;
  delivered_at: string;                  // ISO 8601
  dry_run: boolean;                      // true in Phase 19; false in Phase 20
  msg_count: number;
  truncated: boolean;
  // Phase 20 will additively add: resend_message_id: string
}

// Env shape — narrowed to what deliverDue reads. NOT imported from worker.ts
// (cyclic-import avoidance); callers pass the real Env which structurally matches.
interface DeliveryEnv {
  CHAT_KV: KVNamespace;
  DRY_RUN: string;
  CHAT_RECIPIENT_EMAIL?: string;         // log-only in Phase 19 (envelope to: field)
  CHAT_SENDER_EMAIL?: string;            // log-only in Phase 19 (envelope from: field)
}
```

**Two-keyspace promotion ordering (verbatim from RESEARCH § Pattern 2 — locked sequence):**
```typescript
async function promoteOne(
  env: DeliveryEnv,
  sid: string,
  scheduledAt: string,
): Promise<{ status: "promoted" | "already_delivered" | "missing_live" | "error" }> {
  // (1) idempotency cursor read — cheapest short-circuit
  const delivered = await env.CHAT_KV.get(`delivered:${sid}`, { type: "json" });
  if (delivered !== null) {
    console.log("chat.delivery.skipped_already_delivered", {
      sid,
      delivered_at_existing: (delivered as { delivered_at?: string }).delivered_at ?? null,
    });
    return { status: "already_delivered" };
  }

  // (2) load the transcript value
  const transcript = await env.CHAT_KV.get<ChatTranscript>(`${KEY_PREFIX}${sid}`, { type: "json" });
  if (transcript === null) return { status: "missing_live" };

  try {
    // (3) would-be send harness (DRY_RUN-gated)
    await retryWithBackoff(() => sendOne(env, transcript), MAX_SEND_ATTEMPTS);

    // (4) idempotency marker — BEFORE the actual send in Phase 20
    const value: DeliveredMarker = {
      v: 1, sid,
      delivered_at: new Date().toISOString(),
      dry_run: env.DRY_RUN === "1",
      msg_count: transcript.msg_count,
      truncated: transcript.truncated,
    };
    await env.CHAT_KV.put(`delivered:${sid}`, JSON.stringify(value), {
      expirationTtl: DELIVERED_TTL_SECONDS,
      // D-11 — NO metadata field on delivered: writes
    });

    // (5) clean up live entry — AFTER successful "send"
    await env.CHAT_KV.delete(`${KEY_PREFIX}${sid}`);

    return { status: "promoted" };
  } catch (err) {
    console.error("chat.delivery.failed", {
      sid,
      error_class: err instanceof Error ? err.constructor.name : "Error",
      msg_count: transcript.msg_count,
    });
    return { status: "error" };
  }
}
```

**Pagination loop pattern (verbatim from RESEARCH § Pattern 3):**
```typescript
let cursor: string | undefined = undefined;
let pagesScanned = 0, sessionsSeen = 0, sessionsDue = 0, sessionsPromoted = 0, errors = 0;
const nowMs = scheduledTime ?? Date.now();

while (pagesScanned < PAGINATION_PAGE_HARDCAP) {
  const page = await env.CHAT_KV.list<KVMetadata>({ prefix: KEY_PREFIX, cursor });
  pagesScanned += 1;
  sessionsSeen += page.keys.length;

  for (const k of page.keys) {
    if (sessionsPromoted >= PER_TICK_BATCH_CAP) break;
    const metadata = k.metadata;
    if (!metadata?.last_activity_at) continue;          // missing metadata = skip
    const lastActiveMs = Date.parse(metadata.last_activity_at);
    if (nowMs - lastActiveMs < INACTIVITY_THRESHOLD_MS) continue;  // not due yet

    sessionsDue += 1;
    const sid = k.name.slice(KEY_PREFIX.length);
    const r = await promoteOne(env, sid, new Date(nowMs).toISOString());
    if (r.status === "promoted") sessionsPromoted += 1;
    else if (r.status === "error") errors += 1;
  }

  if (sessionsPromoted >= PER_TICK_BATCH_CAP) break;
  if (page.list_complete) break;                         // Pitfall 4 — use list_complete, NOT keys.length === 0
  cursor = page.cursor;
}
```

**DRY_RUN envelope log (D-05 field NAMES locked; ORDER is planner's):**
```typescript
async function sendOne(env: DeliveryEnv, transcript: ChatTranscript): Promise<void> {
  if (env.DRY_RUN === "1") {
    console.log("chat.delivery.dry_run", {
      sid: transcript.sid,
      to: env.CHAT_RECIPIENT_EMAIL ?? null,
      from: env.CHAT_SENDER_EMAIL ?? null,
      reply_to: "jackcutrara@gmail.com",
      msg_count: transcript.msg_count,
      truncated: transcript.truncated,
      country: transcript.meta.country,
      referrer_host: hostnameOrNull(transcript.meta.referrer),
      dry_run: true,
    });
    return;                                                  // synthetic success
  }
  // Phase 20 will replace this branch with the real Resend POST.
  throw new Error("send_not_implemented_in_phase_19");
}
```

**Retry harness (RESEARCH § Code Example 3 — exponential full-jitter, base 250ms, cap 5000ms):**
```typescript
async function retryWithBackoff<T>(fn: () => Promise<T>, maxAttempts: number): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try { return await fn(); }
    catch (err) {
      lastErr = err;
      if (attempt + 1 >= maxAttempts) break;
      const ceiling = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt);
      await new Promise((r) => setTimeout(r, Math.floor(Math.random() * ceiling)));
    }
  }
  throw lastErr;
}
```

**Per-tick summary log (closes the cron-health observability surface):**
```typescript
console.log("chat.delivery.tick", {
  sessions_seen: sessionsSeen,
  sessions_due: sessionsDue,
  sessions_promoted: sessionsPromoted,
  errors,
  pages_scanned: pagesScanned,
  elapsed_ms: Date.now() - startMs,
  // Optional per CONTEXT.md Claude's Discretion: batch_capped: sessionsPromoted >= PER_TICK_BATCH_CAP
});
```

**What NOT to import (anti-pattern per RESEARCH § Pitfall 7 + CONTEXT.md):**
- No `@anthropic-ai/sdk` — pure module, no LLM surface
- No `request` / `Headers` reach-in — pure module; data comes from KV
- No `cloudflare:workers` virtual module — caller passes `env`
- No `src/prompts/`, `src/data/portfolio-context.json` — TEST-03 anchor anti-coupling
- No `src/pages/`, `src/scripts/chat.ts` — D-26 chat-surface anchor
- No `src/lib/email/*` — does NOT exist in Phase 19 (D-06)

**Inline-comment style precedent** (from `src/lib/chat-transcripts.ts:1-29` and `:107-117`):
- File header docblock cites decision IDs in groups (CRON-02 / CRON-03 / CRON-04 then D-05 / D-06 / D-09 / D-11)
- Multi-line `//` block on every algorithmic step citing the locked invariant
- Pure-module disclaimer block ("NO imports from: …") matching `chat-transcripts.ts:22-25`

**Deviation from `chat-transcripts.ts`:** `chat-delivery.ts` reads multiple keys per invocation (vs `appendTurn`'s one key) and writes a different value shape (`DeliveredMarker` vs `ChatTranscript`). The module pattern (named exports, decision-ID inline citations, no `cloudflare:workers` import) carries over verbatim; the per-key vs per-list shape differs.

---

### `tests/api/chat-delivery.test.ts` (NEW — unit tests for pure module)

**Analog:** `tests/api/chat-transcripts.test.ts` (the canonical sibling — same hand-rolled `MockKVNamespace` shape, same console-spy pattern, same `import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"` header, same hard-coded `SID = "8b0f7f1c-1234-4567-8901-abcdef012345"` fixture).

**Anchor decisions:** CRON-02 / CRON-03 / CRON-04 verification (full coverage); D-05 envelope log shape; D-07 retry harness mock-failure path; D-09 delivered: value shape.

**Imports + structure pattern (verbatim from `tests/api/chat-transcripts.test.ts:26-43`):**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  deliverDue,
  INACTIVITY_THRESHOLD_MS,
  PER_TICK_BATCH_CAP,
  PAGINATION_PAGE_HARDCAP,
  MAX_SEND_ATTEMPTS,
  DELIVERED_TTL_SECONDS,
  type DeliveredMarker,
} from "../../src/lib/chat-delivery";
import { KEY_PREFIX, type ChatTranscript, type KVMetadata } from "../../src/lib/chat-transcripts";

// Hard-coded fixture sessionId per Phase 18 precedent — sessionIds carry no
// information, just need to be UUIDv4-shaped. Same value across every test.
const SID = "8b0f7f1c-1234-4567-8901-abcdef012345";
```

**MockKVNamespace pattern (mostly verbatim from `tests/api/chat-transcripts.test.ts:56-104` — extend with `delete` and pagination/cursor support):**
```typescript
interface MockKVEntry { value: string; metadata: unknown; expirationTtl?: number; }

class MockKVNamespace {
  storage = new Map<string, MockKVEntry>();

  async get(key: string, opts?: { type: "json" }): Promise<unknown> { /* same as chat-transcripts.test.ts */ }
  async getWithMetadata<V, M>(key: string, opts?: { type: "json" }) { /* same */ }
  async put(key: string, value: string, options?: { expirationTtl?: number; metadata?: unknown }): Promise<void> {
    this.storage.set(key, { value, metadata: options?.metadata, expirationTtl: options?.expirationTtl });
  }
  // NEW for chat-delivery.test.ts:
  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }
  // EXTEND list to honor cursor + page-cap semantics (chat-transcripts.test.ts's
  // list() is single-page; chat-delivery exercises multi-page pagination).
  async list<M>(opts?: { prefix?: string; cursor?: string; limit?: number }):
    Promise<{ keys: { name: string; metadata: M }[]; list_complete: boolean; cursor: string }> {
    const prefix = opts?.prefix ?? "";
    const all = [...this.storage.entries()]
      .filter(([k]) => k.startsWith(prefix))
      .map(([name, entry]) => ({ name, metadata: entry.metadata as M }));
    const pageSize = opts?.limit ?? 1000;
    const startIdx = opts?.cursor ? parseInt(opts.cursor, 10) : 0;
    const slice = all.slice(startIdx, startIdx + pageSize);
    const endIdx = startIdx + slice.length;
    return {
      keys: slice,
      list_complete: endIdx >= all.length,
      cursor: String(endIdx),
    };
  }
}
```

**Console-spy pattern (verbatim from `tests/api/chat-transcripts.test.ts:167-178`):**
```typescript
describe("CRON-04 — DRY_RUN envelope log shape (D-05)", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it("D-05: dry_run path emits chat.delivery.dry_run with locked field names", async () => {
    // ... seed live:{sid} with stale last_activity_at ...
    await deliverDue(env, scheduledTime);
    const dryRunCall = logSpy.mock.calls.find((c) => c[0] === "chat.delivery.dry_run");
    expect(dryRunCall).toBeDefined();
    expect(dryRunCall![1]).toMatchObject({
      sid: SID,
      to: expect.any(String),
      from: expect.any(String),
      reply_to: "jackcutrara@gmail.com",
      msg_count: expect.any(Number),
      truncated: expect.any(Boolean),
      country: expect.any(String),
      referrer_host: expect.any(String),
      dry_run: true,
    });
  });
});
```

**Required test cases (per CONTEXT.md Integration Points + RESEARCH coverage):**

| # | Group | Test | Closes |
|---|-------|------|--------|
| 1 | CRON-02 list+filter | `kv.list({ prefix: "live:" })` is the only prefix listed (not `delivered:`) | D-11 |
| 2 | CRON-02 inactivity filter | session with `metadata.last_activity_at` 30min old is NOT promoted | 2h threshold |
| 3 | CRON-02 inactivity filter | session with `metadata.last_activity_at` 3h old IS promoted | 2h threshold |
| 4 | CRON-02 ordering | `delivered:{sid}` written BEFORE `live:{sid}` deleted (storage assertion at each step) | D-09 ordering |
| 5 | CRON-02 idempotency | session with `delivered:{sid}` already present → `sessions_promoted: 0`, `chat.delivery.skipped_already_delivered` logged | CRON-02 cursor |
| 6 | CRON-02 missing live | session with `delivered:` absent but `live:` also absent (race) → skip, no error | edge case |
| 7 | CRON-03 batch cap | seed 60 stale sessions → first call promotes 50, second call promotes remaining 10 | PER_TICK_BATCH_CAP=50 |
| 8 | CRON-03 pagination | seed sessions across 3 pages (with `MockKVNamespace.list` paging) → `pages_scanned: 3`, all due drained | RESEARCH Pattern 3 |
| 9 | CRON-03 pagination hard-cap | mock list to never return `list_complete: true` → loop terminates at 50 pages | safety valve |
| 10 | CRON-03 retry harness | inject mock `sendOne` that throws on attempt 1+2+3 → `chat.delivery.failed` logged once, loop continues to next session | D-07 + per-session try/catch |
| 11 | CRON-03 per-session isolation | sessions A throws, B succeeds → A in errors, B in promoted; loop completes | CRON-03 isolation |
| 12 | CRON-04 DRY_RUN gate | `env.DRY_RUN === "1"` → envelope log fires, no would-be Resend POST | D-01 / D-02 |
| 13 | D-05 envelope field names | log line second-arg has exact field set `{sid, to, from, reply_to, msg_count, truncated, country, referrer_host, dry_run}` | D-05 |
| 14 | D-09 delivered: value | `JSON.parse(kv.storage.get("delivered:${sid}").value)` matches `{ v:1, sid, delivered_at, dry_run:true, msg_count, truncated }` | D-09 / D-10 |
| 15 | D-09 TTL | `kv.put` options arg has `expirationTtl: 24 * 3600` | D-09 |
| 16 | D-11 no metadata on delivered: | `kv.put("delivered:...")` options has NO `metadata` field | D-11 |
| 17 | summary log | `chat.delivery.tick` fires once per `deliverDue` call with `{sessions_seen, sessions_due, sessions_promoted, errors, pages_scanned, elapsed_ms}` | OQ-7 |
| 18 | scheduledTime arg | `deliverDue(env, scheduledTime)` uses `scheduledTime` as `nowMs` (NOT `Date.now()` — tick-as-batch consistency per OQ-6) | RESEARCH OQ-6 |
| 19 | type-safety | `import type { KVMetadata } from "./chat-transcripts"` — TypeScript build-time check | RESEARCH OQ-5 |

**Fake timers caveat (for tests 10 + 11):** Use `vi.useFakeTimers()` + `vi.runAllTimersAsync()` to skip backoff delays. Phase 18 PATTERNS.md `vi.resetModules()` is NOT needed here — `chat-delivery.ts` has no module-level state to reset between tests.

**Deviation:** `tests/api/chat-transcripts.test.ts` uses single-page `kv.list()`; `chat-delivery.test.ts` MUST extend the mock with cursor pagination support to exercise the pagination hard-cap and multi-page batch-drain paths (tests 8 + 9). The cursor implementation can be naive (numeric string indices into the sorted entries array) — pagination behavior is what matters, not cursor opacity.

---

### `tests/build/worker-scheduled-call-site.test.ts` (NEW, OPTIONAL — source-text forward-defense)

**Analog:** `tests/build/append-turn-call-site.test.ts` (the canonical 5-invariant idiom for `ctx.waitUntil(X(...).catch(...))` call sites; the regex shapes are reusable verbatim) + `tests/build/worker-entrypoint.test.ts` (the existing source-text test on the SAME target file `src/worker.ts`).

**Anchor decisions:** CRON-01 (`scheduled()` delegates to `deliverDue`); Phase 18 D-09 (`.catch` INSIDE the promise); RESEARCH OQ-3 (anti-destructure + anti-fetch-handler-pattern).

**Full canonical idiom (adapt verbatim from `tests/build/append-turn-call-site.test.ts:21-87`):**
```typescript
/**
 * CRON-01 — worker.ts scheduled() handler call-site forward defense.
 *
 * The scheduled() handler must:
 *   1. Import deliverDue from ./lib/chat-delivery (Invariant A).
 *   2. Wrap deliverDue() in ctx.waitUntil(...).catch(...) (Invariants B + C).
 *   3. NOT destructure ctx (Invariant D — anti-"Illegal invocation").
 *   4. NOT use the Phase 17/18 stub log line "worker.scheduled.stub" anymore
 *      (Invariant E — the substitution must replace, not amend).
 *
 * Pattern follows tests/build/append-turn-call-site.test.ts — readFileSync the
 * source file, assert source-text invariants via regex.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("CRON-01: ctx.waitUntil(deliverDue(...).catch(...)) call site in src/worker.ts", () => {
  const src = readFileSync(join(process.cwd(), "src/worker.ts"), "utf8");

  it("Invariant A: imports deliverDue from ./lib/chat-delivery", () => {
    expect(src).toMatch(
      /import\s*\{[^}]*\bdeliverDue\b[^}]*\}\s*from\s*["']\.\/lib\/chat-delivery["']/,
    );
  });

  it("Invariant B: scheduled() body contains ctx.waitUntil(deliverDue(...)", () => {
    expect(src).toMatch(/ctx\.waitUntil\(\s*deliverDue\(/);
  });

  it("Invariant C (Phase 18 D-09): ctx.waitUntil(deliverDue(...)) chains a .catch handler", () => {
    const match = src.match(/ctx\.waitUntil\(\s*deliverDue\([\s\S]*?\)\s*\)/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain(".catch(");
  });

  it("Invariant D (anti-destructure): source does NOT destructure ctx (RESEARCH § Pitfall 1)", () => {
    // Dynamic-build the regex so this file itself contains no literal anti-pattern,
    // matching append-turn-call-site.test.ts:69-72 (keeps planner-spec self-scan clean).
    const destructurePattern = new RegExp(
      ["const","\\s*","\\{","\\s*","waitUntil","\\s*","\\}","\\s*","=","\\s*","ctx","\\b"].join(""),
    );
    expect(src).not.toMatch(destructurePattern);
  });

  it("Invariant E (substitution): worker.scheduled.stub log line is removed", () => {
    // The Phase 17 stub log line MUST be removed — Phase 19 replaces, not amends.
    expect(src).not.toContain('"worker.scheduled.stub"');
    // The new observability surface MUST be present:
    expect(src).toMatch(/worker\.scheduled\.failed/);
    expect(src).toMatch(/error_class/);
  });

  it("Invariant F (Env shape): Env interface declares DRY_RUN: string", () => {
    expect(src).toMatch(/DRY_RUN\s*:\s*string/);
  });
});
```

**Cross-test coordination:** `tests/build/worker-entrypoint.test.ts:40-43` currently asserts `src.toContain("Phase 19")` and `src.toContain("deliverDue")` against the stub forward-compat comment. After Phase 19 lands and the comment is removed, those assertions still pass because the IMPORT and the CALL SITE will contain "deliverDue"; the "Phase 19" string match should either be moved into a new file-header docblock comment OR `worker-entrypoint.test.ts:40-43` should be tightened to assert the LIVE `deliverDue` call site (not the historical comment). Planner picks; the simplest path is to keep a one-line `// Phase 19 CRON-01 — scheduled() dispatch` header comment in `worker.ts`.

**Deviation:** `append-turn-call-site.test.ts` asserts TWO `ctx.waitUntil(appendTurn(...))` call sites (user + assistant turns); `worker-scheduled-call-site.test.ts` asserts ONE (single `deliverDue` dispatch). Drop the count-comparison assertion and the ordering-relative-to-`controller.close()` assertion — both are appendTurn-specific. Keep Invariants A, C, D verbatim.

---

### `tests/build/wrangler-cron-shape.test.ts` (NEW, OPTIONAL — source-text guard)

**Analog:** `tests/build/wrangler-shape.test.ts` (FOUND-04 — same `parseJsonc` helper + same target file `wrangler.jsonc`; the existing line 47-52 currently asserts only `Array.isArray(triggers.crons)` which is the anchor to tighten).

**Anchor decisions:** CRON-01 (cron expression locked to `"0 * * * *"`); D-01 (`vars.DRY_RUN === "1"`); RESEARCH Pitfall 6 (operator forgets to revert `*****` UAT).

**Two options for the planner:**
1. **Tighten `tests/build/wrangler-shape.test.ts:47-52` in-place** — change the existing array-shape assertion to `expect(cfg.triggers.crons).toEqual(["0 * * * *"])` and add a `vars.DRY_RUN` assertion. Smaller diff; one fewer file.
2. **Add a separate `tests/build/wrangler-cron-shape.test.ts`** — keeps `wrangler-shape.test.ts` as the FOUND-04 anchor (unchanged byte-for-byte if possible) and isolates the CRON-01 + D-01 / D-02 guards. Larger diff; clearer attribution.

**Recommended:** Option 1 (tighten in place). The existing test's comment at line 48 (`// Phase 17: empty array is correct. Phase 19 sets ["0 * * * *"] — when that change lands, update this assertion accordingly.`) is the explicit invitation to tighten.

**Idiom (verbatim from `wrangler-shape.test.ts:14-29`):**
```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Strip JSONC line + block comments to allow JSON.parse.
function parseJsonc(src: string): unknown {
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"])\/\/.*$/gm, "$1");
  return JSON.parse(stripped);
}

describe("CRON-01 + D-01: wrangler.jsonc cron + DRY_RUN shape", () => {
  const cfg = parseJsonc(
    readFileSync(join(process.cwd(), "wrangler.jsonc"), "utf8"),
  ) as Record<string, unknown>;

  it("CRON-01: triggers.crons is exactly ['0 * * * *'] (Pitfall 6 anti-*****-leak)", () => {
    // Forward-defense: operator UAT Step 1 flips this to ['* * * * *'] briefly.
    // Build-time fail catches the unreverted state before deploy.
    expect((cfg.triggers as { crons: string[] }).crons).toEqual(["0 * * * *"]);
  });

  it("D-01 / D-02: vars.DRY_RUN === '1'", () => {
    expect(cfg.vars).toBeDefined();
    expect((cfg.vars as { DRY_RUN: string }).DRY_RUN).toBe("1");
  });
});
```

**Deviation:** `wrangler-shape.test.ts` doesn't currently test `vars` because Phase 17/18 didn't declare it. Add the `vars.DRY_RUN` assertion alongside the cron-shape assertion. This is the cleanest Pitfall 6 defense.

---

### `19-UAT.md` (NEW — at phase close)

**Analog (closer):** `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md` — same Cloudflare Workers preview-vs-prod surface, same `wrangler kv` operator commands, same `wrangler tail` log-line verification pattern. Phase 18 UAT also includes an explicit `deviation:` block in front-matter that documents Workers Builds branch-preview KV-binding quirk (`preview_id` not honored) — Phase 19 may inherit the same wisdom for any KV-touching steps.

**Analog (precedent):** `.planning/phases/17-foundations-migration-dns-debt-sweep/17-UAT.md` — established the numbered-steps + `expected:` / `result:` / `prior_result:` block convention.

**Anchor decisions:** D-12 (Step 1 = `*****` Past-Events verification, operator-controlled, executor MUST NOT `wrangler deploy`); D-13 (pre-flight is `pnpm dev:cron` + `curl /__scheduled`); D-14 (5 numbered steps, 1:1 success-criteria mapping).

**Front-matter pattern (verbatim from `18-UAT.md:1-28` shape):**
```yaml
---
status: in-progress
phase: 19-cron-sweep-scheduling-idempotency-dry-run
source: [19-01-SUMMARY.md, 19-02-SUMMARY.md, ...]   # filled in as plans land
started: 2026-05-MM-DDTHH:MM:SSZ
updated: 2026-05-MM-DDTHH:MM:SSZ
deviation: |
  [free-text — used if any preview-vs-prod or Workers Builds quirk surfaces;
   inherits the Phase 18 precedent that branch previews bind to PROD KV `id`,
   not `preview_id`. Operator should be alert for the same behavior during
   Step 2 seed-and-sweep.]
---

# Phase 19 UAT — Cron Sweep (Scheduling + Idempotency under DRY_RUN)

**Step 1 (CRON-01 *** *** Past-Events verification) is the operator-controlled gate per D-12.**
Executor MUST NOT run `wrangler deploy` for the `* * * * *` flip — operator owns
the verification + revert cycle per DEPLOY-GATE.md posture (Plan 17-08).

KV namespace IDs (verbatim from `wrangler.jsonc:11-17`):

- Production: `eaa30fef259e4a6b9505b41bbf3f8f01`
- Preview:    `115f3c1b0f8a4a1da9fee78c48dcb749`

Preview URL pattern (per Plan 17-02 D-03 / 18-UAT.md):
`https://jack-cutrara-portfolio-pr-{N}.jackcutrara.workers.dev`
(Workers Builds branch previews may also surface at
`https://{branch-slug}-jack-cutrara-portfolio.jackcutrara.workers.dev/` per
the Phase 18 UAT note.)

Production URL: `https://jackcutrara.com/`
```

**5-step structure (locked by D-14; ordering matches success-criteria numbering 1→4 + cleanup 5):**

**Step 1: CRON-01 `*****` Past-Events verification (closes SC1)**
- **PRE-FLIGHT** (executor-runnable, no deploy gate): `pnpm dev:cron` + `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` → console shows `chat.delivery.tick` log. Catches handler-wiring regressions BEFORE the operator-controlled production verification.
- **PRODUCTION**: Operator edits `wrangler.jsonc` `triggers.crons` to `["* * * * *"]`, runs `wrangler deploy`, waits 90s, opens Cloudflare Dashboard → Workers → jack-cutrara-portfolio → Cron → Past Events, confirms ≥1 successful invocation within 90s, captures screenshot, REVERTS `wrangler.jsonc` to `["0 * * * *"]`, redeploys.
- **REVERT CHECK**: `git diff wrangler.jsonc` returns 0 lines (Pitfall 6 defense — the optional `wrangler-cron-shape.test.ts` build test would also catch this).

**Step 2: Seed-and-sweep end-to-end (closes SC2)**
- Operator command sequence (against PROD KV per Phase 18 UAT learning):
  ```bash
  # Seed a stale live:test-uat-* key
  SID="test-uat-$(uuidgen)"
  STALE_TS=$(date -u -d '3 hours ago' +"%Y-%m-%dT%H:%M:%S.%3NZ")
  wrangler kv key put "live:${SID}" \
    '{"v":1,"sid":"'"${SID}"'","started_at":"'"${STALE_TS}"'","last_activity_at":"'"${STALE_TS}"'","msg_count":2,"truncated":false,"meta":{"referrer":"https://example.com/","user_agent":"UAT/1.0","country":"US","region":"TX","colo":"DFW"},"messages":[...]}' \
    --namespace-id eaa30fef259e4a6b9505b41bbf3f8f01 \
    --metadata '{"last_activity_at":"'"${STALE_TS}"'","msg_count":2,"window_started_at":"'"${STALE_TS}"'","window_count":2}' \
    --remote
  ```
- In a separate terminal: `wrangler tail --format pretty --search chat.delivery`
- Wait for next top-of-hour OR for operator-triggered `*****` flip from Step 1
- Verify:
  - `wrangler tail` shows `chat.delivery.dry_run { sid: ${SID}, to, from, reply_to, msg_count: 2, truncated: false, country: "US", referrer_host: "example.com", dry_run: true }`
  - `wrangler tail` shows `chat.delivery.tick { sessions_seen, sessions_due ≥ 1, sessions_promoted ≥ 1, errors: 0, pages_scanned, elapsed_ms }`
  - `wrangler kv key get "delivered:${SID}" --namespace-id ... --remote` returns the `{v:1, sid, delivered_at, dry_run:true, msg_count:2, truncated:false}` envelope
  - `wrangler kv key get "live:${SID}" --namespace-id ... --remote` returns null (key deleted post-promote)

**Step 3: Idempotency double-tap (closes SC3)**
- Operator re-seeds same `live:${SID}` (with stale timestamp) — but `delivered:${SID}` is still present from Step 2 (within 24h)
- Invoke cron (wait for top of hour OR use Step 1's temporary `*****` flip)
- Verify `wrangler tail` shows `chat.delivery.skipped_already_delivered { sid: ${SID}, delivered_at_existing: ... }` AND `chat.delivery.tick.sessions_promoted: 0` for the re-seeded session

**Step 4: Pagination / batch-cap stress (closes SC4)**
- Operator bash loop seeds 60 stale `live:test-uat-batch-*` keys
- Invoke cron, verify first-tick `sessions_due: 60` but `sessions_promoted: 50`
- Invoke cron a second time, verify second-tick promotes remaining 10
- `wrangler kv key list --prefix delivered:test-uat-batch- --remote` returns 60 keys after both ticks complete

**Step 5: Backlog cleanup (operational hygiene)**
- Operator deletes all `live:test-uat-*` + `delivered:test-uat-*` via `wrangler kv key delete` (or `--bulk-delete` with the output of `--prefix`)
- Verify `wrangler kv key list --prefix test-uat- --remote` returns empty (no UAT audit-debt in PROD KV)

**Result-block convention (verbatim from `17-UAT.md:14-25` + `18-UAT.md:50-80`):**
```markdown
### N. [Test name]
expected: |
  [multi-line expected behavior]
result: [pending | pass | issue]
prior_result: [populated only if a re-test happened]
notes: |
  [optional — operator captures observations, command output snippets, screenshots]
```

**Deviation:** Phase 19 has NO browser/client tier verification (zero chat-surface files touched per D-26). The UAT is operator-only — no `pnpm dev` localhost steps for chat regression (which Phase 17/18 UATs included as Steps 4-10). The forward-defense `pnpm test` run at phase close validates D-26 / D-15 / TEST-03 anchors automatically.

---

## Shared Patterns

### Structured-JSON Workers Logs (Plan 17-05 DEBT-02 + Phase 18 `chat.transcript.*` + Phase 19 `chat.delivery.*`)

**Source:** `src/pages/api/chat.ts:134` (`console.warn("chat.truncated", {...})`) + `:144-148` (`chat.cache_metrics`) + `src/lib/chat-transcripts.ts:149-178` (`chat.transcript.quota_exceeded` / `chat.transcript.race_suspected`).

**Apply to:** All Phase 19 observability — `chat.delivery.tick`, `chat.delivery.dry_run`, `chat.delivery.skipped_already_delivered`, `chat.delivery.failed`, `worker.scheduled.failed`.

**Exact convention (locked):**
```typescript
console.log("event.name", {
  flat_primitive_field_1: value_1,    // string, number, boolean, or null
  flat_primitive_field_2: value_2,
});
```

| Rule | Reason |
|------|--------|
| First arg = dotted-event-name string literal | Workers Logs uses substring filter on first arg (`wrangler tail --search chat.delivery.tick`) |
| Second arg = flat object | Workers Logs auto-indexes flat fields; nested objects aren't first-class |
| Primitives only (no `Date` objects, no Errors, no nested objects) | Auto-indexed cardinality |
| Severity matches semantic | `console.log` for steady-state; `console.warn` for soft-rejects (quota, race); `console.error` for hard-failures |

**Phase 19's `chat.delivery.*` namespace map** (per RESEARCH § OQ-7):

| Log line | Severity | Source location | Required fields |
|----------|----------|-----------------|-----------------|
| `chat.delivery.tick` | `console.log` | end of `deliverDue` | `sessions_seen, sessions_due, sessions_promoted, errors, pages_scanned, elapsed_ms` |
| `chat.delivery.dry_run` | `console.log` | `sendOne` under DRY_RUN gate | `sid, to, from, reply_to, msg_count, truncated, country, referrer_host, dry_run: true` (D-05 NAMES locked) |
| `chat.delivery.skipped_already_delivered` | `console.log` | `promoteOne` early-exit | `sid, delivered_at_existing` |
| `chat.delivery.failed` | `console.error` | `promoteOne` catch | `sid, error_class, msg_count` |
| `worker.scheduled.failed` | `console.error` | `src/worker.ts` outer `.catch` | `error_class` (catastrophic-only) |

---

### `ctx.waitUntil(promise.catch(...))` rejection-safe pattern (Phase 18 D-09 / D-10 / D-11 → Phase 19 inherits)

**Source:** RESEARCH § Pattern 1 + Pitfall 1 + Phase 18 D-09 / D-10 / D-11. Also: `src/pages/api/chat.ts` (Phase 18 already wired this for the fetch path).

**Apply to:** The single `deliverDue` call site in `src/worker.ts` `scheduled()` body.

**Exact form (verbatim from RESEARCH § Code Example 2):**
```typescript
ctx.waitUntil(
  deliverDue(env, controller.scheduledTime).catch((err: unknown) => {
    console.error("worker.scheduled.failed", {
      error_class: err instanceof Error ? err.constructor.name : "Error",
    });
  })
);
```

**Locked invariants (all sourced from RESEARCH § Anti-Patterns + Phase 18 PATTERNS.md "Shared Patterns"):**
1. `.catch(...)` chains BEFORE the promise is passed to `ctx.waitUntil` — rejection silently swallowed otherwise.
2. `ctx` MUST NOT be destructured (`const { waitUntil } = ctx` → "Illegal invocation" runtime error).
3. The promise body MUST NOT enqueue SSE frames (D-15 anchor — but Phase 19 doesn't touch SSE surface anyway).
4. Per-session try/catch lives INSIDE `deliverDue` (CRON-03 isolation invariant) — the outer `.catch` is for catastrophic-only failures (e.g., the first KV `list()` throws before any per-session work begins).

**Source-text forward defense:** `tests/build/worker-scheduled-call-site.test.ts` (OPTIONAL) asserts invariants 1, 2, and 4. Pattern is copy-from-`append-turn-call-site.test.ts`.

---

### Source-text forward-defense tests (Plan 17-04 FOUND-02 + Plan 18-07 D-PA-01)

**Source:** `tests/build/worker-entrypoint.test.ts` (FOUND-02 idiom) + `tests/build/append-turn-call-site.test.ts` (extended idiom) + `tests/build/wrangler-shape.test.ts` (config-shape idiom) + `tests/build/no-imperative-display-flip.test.ts` (anti-pattern idiom).

**Apply to:** Any Phase 19 source-of-truth invariant that depends on string-shape rather than runtime behavior — specifically (per CONTEXT.md Claude's Discretion):
- `tests/build/worker-scheduled-call-site.test.ts` — `ctx.waitUntil(deliverDue(...).catch(...))` shape in `src/worker.ts`
- `tests/build/wrangler-cron-shape.test.ts` (or tightening of existing `wrangler-shape.test.ts`) — `triggers.crons === ["0 * * * *"]` + `vars.DRY_RUN === "1"`

**Canonical idiom:**
```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("<INVARIANT-ID>: <what is locked>", () => {
  const src = readFileSync(join(process.cwd(), "<target-file>"), "utf8");

  it("<asserts source contains canonical pattern>", () => {
    expect(src).toMatch(/<regex>/);
  });

  it("<asserts source does NOT contain anti-pattern>", () => {
    expect(src).not.toMatch(/<anti-regex>/);
  });
});
```

**Why source-text and not behavioral:** These invariants protect a design-time decision (where in the file the call lives, what symbols are present, whether a config key is exactly `["0 * * * *"]`) that no runtime behavior can detect alone. A behavioral test passes against any implementation that produces equivalent output; a source-text test fails the moment the canonical pattern is moved.

---

### Mock-KV pattern for pure-module unit tests (Phase 18 Plan 18-02 → Phase 19 inherits)

**Source:** `tests/api/chat-transcripts.test.ts:56-104`. Hand-rolled `MockKVNamespace` class, ~30 LOC, no external dep.

**Apply to:** `tests/api/chat-delivery.test.ts`.

**What Phase 19 inherits verbatim:**
- `get(key, opts?: { type: "json" })` — returns parsed JSON or null
- `getWithMetadata<V, M>(key, opts?)` — returns `{ value: V|null, metadata: M|null }`
- `put(key, value, options?: { expirationTtl?, metadata? })` — stores with TTL + metadata
- Console-spy beforeEach/afterEach pattern (`vi.spyOn(console, "log").mockImplementation(() => {})` + `vi.restoreAllMocks()`)
- Hard-coded `SID = "8b0f7f1c-1234-4567-8901-abcdef012345"` fixture

**What Phase 19 must EXTEND:**
- **`delete(key)`** — required by `deliverDue`'s `kv.delete(live:${sid})` step 5. Simple 1-line `this.storage.delete(key)`.
- **`list({ prefix, cursor, limit })` with multi-page semantics** — `chat-transcripts.test.ts:95-103` returns a single page (no `list_complete` / `cursor` fields). `chat-delivery.test.ts` MUST extend to return `{ keys, list_complete, cursor }` with cursor-based pagination so the 50-page hard-cap and multi-page-batch-drain tests can run.

**Cursor implementation strategy for the extended mock:** Cursor is a numeric string indexing into the sorted entries array. `pageSize = options.limit ?? 1000` keys per page. `list_complete = (cursor + pageSize >= total)`. Naive but sufficient — production KV cursor opacity isn't under test; pagination CONTROL FLOW is.

---

### Type-sharing across pure modules (`src/lib/chat-transcripts.ts` → `src/lib/chat-delivery.ts`)

**Source:** Phase 18 module structure + CONTEXT.md Claude's Discretion (last bullet — "Whether `chat-delivery.ts` reuses any types from `chat-transcripts.ts`").

**Recommendation:** Re-export from `chat-delivery.ts` ONLY the types it produces (`DeliveredMarker`); IMPORT types it consumes (`ChatTranscript`, `KVMetadata`, `KEY_PREFIX`) from `chat-transcripts.ts`. Pinning schema source-of-truth in `chat-transcripts.ts` is the single most important type-drift defense across the two-module surface.

```typescript
// In chat-delivery.ts:
import type { ChatTranscript, KVMetadata } from "./chat-transcripts";  // type-only import — zero runtime cost
import { KEY_PREFIX } from "./chat-transcripts";                       // value import — schema constant
```

**Why type-only import (`import type`)**: Skips runtime emit; pure compile-time check. If `chat-transcripts.ts` changes the `KVMetadata` shape, `chat-delivery.ts` fails to typecheck — catches schema drift at build time, before any test runs.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | All Phase 19 files have at least a role-match analog in the existing repo. |

**Closest "novel" cases worth noting (all still role-match exact):**
- `src/lib/chat-delivery.ts` is the project's first **list-and-process** module (vs `chat-transcripts.ts`'s **single-key read-modify-write**). The pure-module shape is well-defined by `chat-transcripts.ts`; the list-loop algorithm comes verbatim from RESEARCH § Pattern 3.
- `tests/api/chat-delivery.test.ts` is the project's first test exercising KV `list({ prefix, cursor })` pagination. The `MockKVNamespace.list` extension is the only genuinely new test-infrastructure piece — and it's a small extension of an existing 30-LOC mock.

---

## Metadata

**Analog search scope:**
- `src/lib/` (2 files: `validation.ts`, `chat-transcripts.ts`)
- `src/worker.ts` (entrypoint — Phase 17 baseline)
- `tests/api/` (chat-transcripts, validation, cache-hit-logs, chat-session-id, sse-snapshot, chat.test, anthropic-payload-shape)
- `tests/build/` (worker-entrypoint, append-turn-call-site, wrangler-shape, no-imperative-display-flip, chat-context-integrity, view-transition-handler, motion-css-rules, others)
- `.planning/phases/17-foundations-migration-dns-debt-sweep/17-UAT.md`
- `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md` + `18-PATTERNS.md`
- `wrangler.jsonc` + `package.json`

**Files scanned (read or grepped):** ~14 (7 in-scope edit targets + 7 analog/reference files).

**Key insights:**
- Phase 19 is structurally **one new pure module + one entrypoint edit + two config edits + one new unit test file + one UAT doc** (plus two OPTIONAL build-time tests). Every primitive it needs (`triggers.crons`, `ctx.waitUntil`, KV `list({ prefix, cursor })`, structured logs, vars block) has a Phase 17/18 analog that locks the shape.
- The pure-module shape of `chat-delivery.ts` follows `chat-transcripts.ts` byte-for-byte structurally: named exports only, decision-ID inline citations, platform types only (`KVNamespace` via param), zero `cloudflare:workers` import.
- The single test file `tests/api/chat-delivery.test.ts` maps cleanly to `tests/api/chat-transcripts.test.ts`'s template — the only new infrastructure piece is the `MockKVNamespace.list` cursor extension (~10 LOC).
- D-15 SSE byte-identical invariant is upheld trivially: Phase 19 touches ZERO chat-surface files. `tests/api/sse-snapshot.test.ts` re-verified at phase close is forward-defense.
- TEST-03 Anthropic prompt-cache integrity is similarly trivial: `chat-delivery.ts` is forbidden from importing `src/prompts/*` or `src/data/portfolio-context.json`. Pitfall 7 calls this out explicitly.
- The cross-cutting `chat.delivery.*` log namespace is the new namespace Phase 19 adds; it follows the existing `chat.cache_metrics` / `chat.transcript.*` Plan 17-05 + Phase 18 convention exactly.
- The `19-UAT.md` 5-step structure has 1:1 mapping to SC1..SC4 + cleanup; Phase 18 UAT's `deviation:` block (Workers Builds branch-preview KV-binding quirk) is wisdom Phase 19 may inherit if the same surface is exercised in Step 2.

**Pattern extraction date:** 2026-05-12
