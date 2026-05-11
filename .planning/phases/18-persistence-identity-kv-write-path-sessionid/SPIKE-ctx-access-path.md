# SPIKE — ExecutionContext access path in Astro v6 + @astrojs/cloudflare 13.1.7

**Resolves:** 18-RESEARCH.md § Pitfall 8 ("Astro APIRoute `locals.runtime.ctx` binding name versions across `@astrojs/cloudflare` releases") and Open Question Q1 ("What is the exact `ExecutionContext` access path in `@astrojs/cloudflare` 13.1.7 SSR routes?").

**Date:** 2026-05-11
**Plan:** 18-01
**Adapter version:** `@astrojs/cloudflare@13.1.7` (per `node_modules/@astrojs/cloudflare/package.json`)
**Astro version:** v6 (the adapter only ships v6-compatible code; legacy v5 paths now throw at runtime)
**Spike strategy:** Static type + source-code read only. No dev probe was needed — the adapter source at `node_modules/@astrojs/cloudflare/dist/utils/handler.js` lines 64–91 is unambiguous. `git diff --exit-code src/pages/api/chat.ts` exits 0.

---

## Verified path

```ts
const ctx = (locals as { cfContext?: { waitUntil: (p: Promise<unknown>) => void } } | undefined)
  ?.cfContext;
```

Plain destructure form (production-only, no test-compat concern):

```ts
import type { APIRoute } from "astro";
export const POST: APIRoute = async ({ request, locals }) => {
  const ctx = locals.cfContext;            // ExecutionContext — has waitUntil(promise: Promise<unknown>): void
  // ctx is the ExecutionContext supplied by handle(request, env, context) on the worker entrypoint.
};
```

**Why the defensive `(locals as ...)?.cfContext` cast is preferred for Plan 18-05:** Existing chat-surface tests (`tests/api/sse-snapshot.test.ts`, `tests/api/cache-hit-logs.test.ts`) call `POST({ request } as never)` without supplying a `locals` argument. The cast keeps `ctx` typed as possibly undefined so those tests stay GREEN; the production Workers runtime always populates `locals.cfContext`. The downstream call site MUST guard `if (sessionId && ctx) ctx.waitUntil(...)` (D-04 missing-tolerance branch already requires the sessionId guard; the `ctx` half is free).

**TypeScript surface of `locals.cfContext`:** `ExecutionContext` from `@cloudflare/workers-types`. Members of interest:
- `waitUntil(promise: Promise<unknown>): void` — fire-and-forget; rejections silently swallowed without explicit `.catch` (per RESEARCH § Pitfall 1).
- `passThroughOnException(): void` — not used in Phase 18.

The adapter does NOT publish a re-exported `ExecutionContext` symbol — Plan 18-05 imports the type from the worker runtime (or just lets the App's ambient `@cloudflare/workers-types` declarations resolve it through `locals` inference).

---

## Evidence

### 1. Adapter source declares `locals.cfContext = context` directly

**File:** `node_modules/@astrojs/cloudflare/dist/utils/handler.js`
**Lines 64–66:**

```js
const locals = {
  cfContext: context
};
```

`context` here is the third parameter of the Workers `ExportedHandler.fetch` signature `(request, env, context: ExecutionContext) => ...`. This is the canonical wiring — no indirection, no nested object, no proxy.

### 2. Legacy `locals.runtime.ctx` path was REMOVED in Astro v6 and now THROWS

**Same file, lines 67–91:**

```js
Object.defineProperty(locals, "runtime", {
  enumerable: false,
  value: {
    get env() {
      throw new Error(
        `Astro.locals.runtime.env has been removed in Astro v6. Use 'import { env } from "cloudflare:workers"' instead.`
      );
    },
    get cf() {
      throw new Error(
        `Astro.locals.runtime.cf has been removed in Astro v6. Use 'Astro.request.cf' instead.`
      );
    },
    get caches() {
      throw new Error(
        `Astro.locals.runtime.caches has been removed in Astro v6. Use the global 'caches' object instead.`
      );
    },
    get ctx() {
      throw new Error(
        `Astro.locals.runtime.ctx has been removed in Astro v6. Use 'Astro.locals.cfContext' instead.`
      );
    }
  }
});
```

The `get ctx()` getter on `locals.runtime` is intentionally a tripwire — any code path that tries the v5 convention crashes the request with an explicit migration message naming `Astro.locals.cfContext` as the replacement. Architectural research naming `locals.cfContext` was correct; the v5 convention `locals.runtime.ctx` from RESEARCH § Pitfall 8 Candidate A is now wrong and dangerous (silently passes type-check but throws at runtime since `runtime` IS defined as a non-enumerable object).

### 3. Type surface confirms the shape

**File:** `node_modules/@astrojs/cloudflare/dist/utils/handler.d.ts`
**Lines 1–3:**

```ts
export interface Runtime {
    cfContext: ExecutionContext;
}
```

The `Runtime` type is re-exported from `node_modules/@astrojs/cloudflare/dist/index.d.ts:4` (`export type { Runtime } from './utils/handler.js';`) — the only structural member is `cfContext: ExecutionContext`. There is no `ctx`, no `runtime`, no virtual-module re-export.

### 4. The `handle(request, env, context)` signature confirms `context` is `ExecutionContext`

**Same `handler.d.ts`, line 8:**

```ts
export declare function handle(request: Request, env: Env, context: ExecutionContext): Promise<CfResponse>;
```

The `context` argument is passed through unchanged to `locals.cfContext` (line 64 of `handler.js` above). `ExecutionContext` is the Cloudflare Workers runtime type with `waitUntil(promise: Promise<unknown>): void` and `passThroughOnException(): void`.

---

## Alternative if primary unavailable

**Fallback (Candidate D from RESEARCH § Pitfall 8):** Import `executionContext` from the `cloudflare:workers` virtual module.

```ts
import { env, executionContext as ctx } from "cloudflare:workers";
ctx.waitUntil(promise.catch(handler));
```

**Cost statement:** This is the documented escape hatch for code paths that don't have access to Astro's `locals` (e.g., shared modules called outside an APIRoute handler). For Plan 18-05 specifically, the primary `locals.cfContext` path is strictly preferable because (a) it keeps the access expression local to the APIRoute and matches the adapter's intended API surface, (b) it stays consistent with the existing `env` import which is already from `cloudflare:workers` — splitting `env` (virtual-module) and `ctx` (locals) is fine and idiomatic, (c) `executionContext` from the virtual module is a thin wrapper around the same underlying ExecutionContext but with an extra module-resolution hop. Use this fallback ONLY if a future plan needs `ctx` access from `src/lib/*` modules where `locals` is not available.

---

## Plan 18-05 import & destructure pattern

The exact APIRoute signature change ready to copy into Plan 18-05 (extends the current `({ request })` destructure at `src/pages/api/chat.ts:15`):

```ts
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  // Defensive cast — production Workers runtime always populates locals.cfContext;
  // existing chat-surface tests call POST({ request } as never) without locals,
  // so the optional-chain keeps those tests GREEN. Plan 18-05 must guard the
  // ctx.waitUntil call site with `if (sessionId && ctx)` (D-04 missing-tolerance
  // already requires the sessionId guard; the ctx half is free).
  const ctx = (locals as { cfContext?: { waitUntil: (p: Promise<unknown>) => void } } | undefined)
    ?.cfContext;

  // ... existing CORS / body-size / rate-limit / parse / validate flow unchanged ...

  // D-10: user-turn appendTurn after validation, BEFORE Anthropic stream open.
  // D-09: explicit .catch() — ctx.waitUntil silently swallows rejections per RESEARCH § Pitfall 1.
  if (sessionId && ctx) {
    ctx.waitUntil(
      appendTurn(env.CHAT_KV, sessionId, "user", validatedUserContent, meta).catch((err) => {
        console.error("chat.transcript.write_failed", {
          sessionId,
          role: "user",
          error_class: err?.name ?? "unknown",
        });
      })
    );
  }

  // ... existing ReadableStream(start(controller) { ... controller.close() }) flow ...

  // D-11: assistant-turn appendTurn AFTER controller.close(), accumulator strategy.
  if (sessionId && ctx) {
    ctx.waitUntil(
      appendTurn(env.CHAT_KV, sessionId, "assistant", accumulator, assistantMeta).catch((err) => {
        console.error("chat.transcript.write_failed", {
          sessionId,
          role: "assistant",
          error_class: err?.name ?? "unknown",
          content_length: accumulator.length,
        });
      })
    );
  }
};
```

**Anchors for the `tests/build/append-turn-call-site.test.ts` forward-defense (RESEARCH § Example 6, Plan 18-05 to wire):**
- D-10 user-turn anchor: AFTER `sanitizeMessages(validation.data.messages)` call (current line 84 of api/chat.ts), BEFORE `client.messages.create(...)` call (current line 112).
- D-11 assistant-turn anchor: AFTER `controller.close()` (current line 170) — landing on the post-stream side of the closure keeps SSE bytes byte-identical per D-15.
- D-09 rejection-handling: every `ctx.waitUntil(` invocation MUST chain `.catch(...)` BEFORE the promise is passed to `ctx.waitUntil`. Source-text grep gate.

**`tests/api/chat-transcripts.test.ts` `mockLocals` shape** (per PATTERNS.md § 1163 — already locked):

```ts
const mockLocals = {
  cfContext: {
    waitUntil: (promise: Promise<unknown>) => {
      // capture the promise so the test can `await Promise.allSettled([captured])`
      // and assert the appendTurn(...).catch(...) call shape.
    },
  },
};
// Test invocation:
await POST({ request: mockRequest, locals: mockLocals } as never);
```

---

## Resolution summary

| Aspect | Resolution |
|--------|------------|
| Verified path | `locals.cfContext` (NOT `locals.runtime.ctx` — the v5 path is REMOVED and throws at runtime in v6) |
| Defensive form | `(locals as { cfContext?: { waitUntil: ... } } \| undefined)?.cfContext` (test-compat) |
| Source evidence | `node_modules/@astrojs/cloudflare/dist/utils/handler.js:64–91` (direct assignment + tripwire getter) |
| Type evidence | `node_modules/@astrojs/cloudflare/dist/utils/handler.d.ts:1–3` (`interface Runtime { cfContext: ExecutionContext }`) |
| Pitfall 8 status | CLOSED — primary path is `locals.cfContext`, fallback is `executionContext` from `cloudflare:workers` |
| Open Question Q1 status | CLOSED — Plan 18-05 has the exact verbatim TS expression ready to copy |
| Dev probe needed? | NO — adapter source is unambiguous; spike resolved by static read |
| `git diff src/pages/api/chat.ts` | empty (no probe code written; nothing to revert) |

Plan 18-05 (`api/chat.ts` wiring) MUST copy the `locals.cfContext` access expression verbatim from § Plan 18-05 import & destructure pattern above. Skipping the defensive cast in favor of `locals.cfContext` directly is acceptable IF Plan 18-05 also widens the existing test invocations to pass a `mockLocals` argument — but the defensive cast is the lower-friction path and the PATTERNS.md analog already standardizes on it.
