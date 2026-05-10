# Phase 17: Foundations — Migration + DNS + Debt Sweep — Pattern Map

**Mapped:** 2026-05-10
**Files analyzed:** 16 (3 NEW, 12 MODIFY, 1 DELETE)
**Analogs found:** 16 / 16 (3 exact, 11 role-match, 2 partial)

## File Classification

| New/Modified File | Action | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|--------|------|-----------|----------------|---------------|
| `src/worker.ts` | NEW | entrypoint (Worker) | request-response + cron event-driven | `node_modules/@astrojs/cloudflare/dist/entrypoints/server.d.ts` + `astro.config.mjs` adapter import | exact (canonical Astro pattern) |
| `tests/api/sse-snapshot.test.ts` | NEW | test (api/SSR) | byte-fixture assertion | `tests/api/chat.test.ts` (lines 109-157, 294-468) | exact (peer file, identical SSE-mock pattern) |
| `scripts/resend-warmup.mjs` | NEW | utility script (throwaway) | request-response (HTTPS POST) | `scripts/build-chat-context.mjs` (CLI shape, exit codes) + `scripts/sync-projects.mjs` (arg parsing) | role-match (CLI pattern; semantics differ — fetch vs FS) |
| `wrangler.jsonc` | MODIFY (full rewrite) | config | n/a | self (additive — keep `name`, `compatibility_date`, `compatibility_flags`, `assets` block byte-identical) | exact (self-evolution) |
| `astro.config.mjs` | MODIFY (verify-only) | config | n/a | self | exact (no edit expected unless `prerender` audit fails) |
| `src/scripts/chat.ts` | MODIFY | client controller | event-driven (DOM lifecycle) | `src/scripts/analytics.ts` (DEBT-04) + `src/scripts/scroll-depth.ts` (DEBT-04) | exact (3-way mirror) |
| `src/scripts/analytics.ts` | MODIFY | client listener | event-driven (DOM lifecycle) | `src/scripts/scroll-depth.ts` lines 74-83 + `src/scripts/chat.ts` lines 893-904 | exact (mirror — same bootstrap idiom) |
| `src/scripts/scroll-depth.ts` | MODIFY | client listener | event-driven (DOM lifecycle) | `src/scripts/analytics.ts` lines 144-153 + `src/scripts/chat.ts` lines 893-904 | exact (mirror) |
| `src/styles/global.css` | MODIFY | stylesheet | n/a (CSS state machine) | self at lines 691-702 (existing `#chat-panel` rules) | exact (self-evolution) |
| `src/lib/chat-cache.ts` | MODIFY (NEW file actually) | service (cache/log seam) | request-response (log emit) | `src/pages/api/chat.ts` line 123 (`console.warn("chat.truncated", {...})`) | role-match (file does not yet exist; planner must confirm scope) |
| `src/lib/content-snapshot.ts` | MODIFY (NEW file actually) | service (snapshot/log seam) | request-response (log emit) | `src/pages/api/chat.ts` line 123 + `scripts/build-chat-context.mjs` lines 414-440 | role-match (file does not yet exist; planner must confirm scope) |
| `src/lib/validation.ts` | MODIFY (rename + retarget) | utility (CORS allow-list) | request-response | self at lines 65-92 (existing `PAGES_PREVIEW_SUFFIX`) | exact (self-evolution) |
| `tests/api/security.test.ts` | MODIFY | test (api) | unit assertion | self at lines 79-99 (existing preview-subdomain tests) | exact (self-evolution) |
| `package.json` | MODIFY (build script) | config | n/a | self at line 11 (build chain) | exact (self-evolution) |
| `.github/workflows/sync-check.yml` | MODIFY (add CI step) | CI workflow | event-driven (PR/push) | self at lines 13-34 (existing `check` job + `pnpm sync:check` step) | exact (self-evolution; mirror `sync:check` step pattern) |
| `PROJECT.md` | MODIFY | doc | n/a | self (Known issues / tech debt section) | partial (free-form prose) |
| `scripts/pages-compat.mjs` | DELETE | utility script | n/a | n/a | n/a |

**Notes on apparent file mismatch:**
- `src/lib/chat-cache.ts` and `src/lib/content-snapshot.ts` are referenced by CONTEXT.md and RESEARCH.md as MODIFY targets but **do not exist on disk** as of 2026-05-10. Only `src/lib/validation.ts` exists in `src/lib/`. Two interpretations the planner must resolve:
  1. **DEBT-02 creates these files** as new dedicated log-seam modules (matches RESEARCH.md "three seams" framing).
  2. **DEBT-02 inlines the log seam** into `src/pages/api/chat.ts` (the stream loop at lines 105-126) plus `src/scripts/chat.ts` (client mirror) and `scripts/build-chat-context.mjs` (build-time snapshot) — in which case CONTEXT.md's filenames are aspirational. Planner picks shape; both targets get the same `console.log("chat.cache_metrics", {...})` structured-JSON shape from RESEARCH §"Pattern 5".

---

## Pattern Assignments

### `src/worker.ts` (NEW — entrypoint, request-response + cron event-driven)

**Analog:** `node_modules/@astrojs/cloudflare/dist/entrypoints/server.d.ts` (the current `main`) + the adapter's installed `handle()` types at `node_modules/@astrojs/cloudflare/dist/utils/handler.d.ts`.

**Adapter `handle()` signature** (verbatim from `node_modules/@astrojs/cloudflare/dist/utils/handler.d.ts:1-9`):
```typescript
export interface Runtime {
    cfContext: ExecutionContext;
}
declare global {
    var __ASTRO_IMAGES_BINDING_NAME: string;
}
type CfResponse = Awaited<ReturnType<Required<ExportedHandler<Env>>['fetch']>>;
export declare function handle(request: Request, env: Env, context: ExecutionContext): Promise<CfResponse>;
```

**Current `entrypoints/server` shape it must replace** (`node_modules/@astrojs/cloudflare/dist/entrypoints/server.d.ts:1-5`):
```typescript
import { handle } from '../utils/handler.js';
declare const _default: {
    fetch: typeof handle;
};
export default _default;
```

**Pattern to copy:** Re-export `{ fetch: handle }` verbatim, then add a `scheduled()` sibling. Import path is the package-export `@astrojs/cloudflare/handler` (verified present in `node_modules/@astrojs/cloudflare/package.json` exports map: `"./handler": "./dist/utils/handler.js"`).

**Env interface composition** — derive from existing usages, not invented:
- `ANTHROPIC_API_KEY: string` — read at `src/pages/api/chat.ts:87` via `env.ANTHROPIC_API_KEY`.
- `ASSETS: Fetcher` — declared in current `wrangler.jsonc:7-10`.
- `CHAT_RATE_LIMITER?: RateLimit` — read defensively at `src/pages/api/chat.ts:49-51` via the existing `as unknown as Record<string, unknown>` shape (defensive-skip pattern; keep optional in the new typed interface).
- `CHAT_KV: KVNamespace`, `RESEND_API_KEY: string`, `CHAT_RECIPIENT_EMAIL: string`, `CHAT_SENDER_EMAIL: string` — NEW per CONTEXT.md D-05/D-06 (declared in wrangler.jsonc Phase 17; consumed Phase 18+).

**Comment style precedent** (from `src/pages/api/chat.ts:24-30`):
```typescript
  // Body size check — reject before parsing JSON to prevent memory abuse.
  // Uses Number() (not parseInt) so malformed values are explicitly rejected:
  //   "abc"     → NaN       → reject
```
Multi-line `//` blocks with arrow indents for examples; cite plan/decision IDs (D-XX) in line.

**Phase-19 forward-compatibility seam** (per RESEARCH §"Pattern 1"): the `scheduled()` body must call `ctx.waitUntil(...)` even in the no-op case, so Phase 19's edit is a single substitution (`Promise.resolve()` → `deliverDue(env, controller.scheduledTime)`). Do not omit the `waitUntil` wrapper in Phase 17.

---

### `tests/api/sse-snapshot.test.ts` (NEW — test/api, byte-fixture assertion)

**Analog:** `tests/api/chat.test.ts` (the existing 469-line peer in the same directory).

**Imports pattern** (`tests/api/chat.test.ts:1-11`):
```typescript
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateRequest,
  sanitizeMessages,
  isAllowedOrigin,
  MAX_BODY_SIZE,
} from "../../src/lib/validation";
import { buildChatRequestArgs } from "../../src/prompts/chat-request-shape";
import portfolioContext from "../../src/data/portfolio-context.json";
```

**SSE byte-stream consumption pattern** (`tests/api/chat.test.ts:117-157`, `tests/api/chat.test.ts:310-365`):
```typescript
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const chunks: string[] = [];

const stream = new ReadableStream({
  async start(controller) {
    for (const event of mockEvents) {
      if (event.type === "content_block_delta" && /* ... */) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text: event.delta?.text })}\n\n`)
        );
      } else if (event.type === "message_delta") {
        if (event.delta.stop_reason === "max_tokens") {
          truncated = true;
          console.warn("chat.truncated", { stop_reason: "max_tokens" });
        }
      }
    }
    if (truncated) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ truncated: true })}\n\n`));
    }
    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    controller.close();
  },
});

const reader = stream.getReader();
let done = false;
while (!done) {
  const result = await reader.read();
  if (result.done) done = true;
  else chunks.push(decoder.decode(result.value));
}

const fullOutput = chunks.join("");
expect(fullOutput).toContain('data: {"text":"Hello"}');
expect(fullOutput).toContain("data: [DONE]");
```

**For byte-identical (D-15) the new file diverges from the analog** by:
1. Using `Buffer.equals()` or `Uint8Array` per-byte equality instead of `toContain` (per RESEARCH §"Don't Hand-Roll" → "SSE byte-stream snapshot diffing").
2. Mocking `Anthropic.messages.create` so the assistant-text payload is deterministic (RESEARCH §"Pitfall 2" — fixture must isolate server-frame structure from variable model output).
3. Capturing the canonical fixture into `tests/fixtures/` (existing dir per `tests/fixtures/chat-eval-dataset.ts` precedent — see `ls tests/fixtures` result).

**Source-text guard pattern** (`tests/api/chat.test.ts:259-289`) — for guarding D-15 across future edits to `chat.ts` API endpoint:
```typescript
const chatSource = readFileSync(
  join(process.cwd(), "src", "pages", "api", "chat.ts"),
  "utf8"
);

it("preserves the Cloudflare-SSE Content-Encoding: none header (AI-SPEC pitfall #4)", () => {
  expect(chatSource).toContain('"Content-Encoding": "none"');
});
```
Lift this idiom to assert SSE response header values byte-identical (`Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `Content-Encoding: none` — per `src/pages/api/chat.ts:153-159`).

**Phase-18 forward-compatibility comment** (per RESEARCH §"Pitfall 10"): file-level docblock MUST name the planned `ctx.waitUntil(appendTurn(...))` amendment so Phase 18 doesn't trip the test as a regression. Same comment style as the file-level docblock at `tests/build/chat-context-integrity.test.ts:1-13`.

---

### `scripts/resend-warmup.mjs` (NEW — throwaway utility, ~30 LOC)

**Analog:** `scripts/build-chat-context.mjs` (CLI argv-flag pattern, exit codes, env-var checks) + `scripts/sync-projects.mjs` (arg parsing semantics).

**Shebang + file docblock pattern** (`scripts/build-chat-context.mjs:1-26`):
```javascript
#!/usr/bin/env node
/**
 * @fileoverview Build-time knowledge generator for the chat widget.
 *
 * Reads 4 sources and writes a single merged JSON the chat API consumes:
 *   ...
 * Usage:
 *   node scripts/build-chat-context.mjs            (write mode; D-10)
 *   node scripts/build-chat-context.mjs --check    (CI mode; exit 1 on drift)
 *
 * Exit codes (D-24):
 *   0 — success ...
 *   1 — drift detected in --check mode (CI gate)
 *   2 — hard failure ...
 */
```

**Argv-flag check idiom** (`scripts/build-chat-context.mjs:37`):
```javascript
const CHECK_MODE = process.argv.includes("--check");
```
For warmup script: substitute `--to <addr>`, `--count <N>` parsing per RESEARCH §"Code Examples → resend-warmup.mjs" — keep simple `Object.fromEntries(reduce)` approach (~6 LOC, no commander/yargs dep).

**Env-var pre-flight check** (no current analog — RESEARCH §"Code Examples" supplies):
```javascript
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("RESEND_API_KEY env var is required");
  process.exit(1);
}
```
Mirrors `scripts/build-chat-context.mjs:355` (`if (errorCount > 0) process.exit(2);`) for fail-fast semantics.

**Fetch-shape pattern (Phase 20 lock-in)** — RESEARCH §"Code Examples → resend-warmup.mjs":
```javascript
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
    subject: `[Portfolio chat] warmup ${i}/${count}`,
    text: `...`,
  }),
});
```
This call shape is locked verbatim — Phase 20's `src/lib/email/resend.ts` will copy from this script per CONTEXT.md D-07 ("first time we exercise that decision in code").

---

### `wrangler.jsonc` (MODIFY — full rewrite)

**Analog:** self at `wrangler.jsonc:1-11` (current 11-line config).

**Existing structure to preserve byte-identical** (lines 1-10):
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "jack-cutrara-portfolio",
  // line 4 below is the ONE field that flips
  "compatibility_date": "2026-04-04",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist/client"
  }
}
```

**The single field-flip** (line 4):
```diff
-  "main": "@astrojs/cloudflare/entrypoints/server",
+  "main": "./src/worker.ts",
```

**Additive blocks (Phase 17 declares; Phase 18+ binds)** — per RESEARCH §"Pattern 2":
```jsonc
"kv_namespaces": [
  {
    "binding": "CHAT_KV",
    "id": "REPLACE_WITH_PROD_ID_FROM_WRANGLER_KV_CREATE",
    "preview_id": "REPLACE_WITH_PREVIEW_ID_FROM_WRANGLER_KV_CREATE_PREVIEW"
  }
],
"triggers": {
  "crons": []
},
"preview_urls": true
```

**Naming convention** — KV binding name `CHAT_KV` aligns with the existing secret-naming convention `ANTHROPIC_API_KEY`, `CHAT_RATE_LIMITER` (UPPER_SNAKE — confirm by grep over `src/pages/api/chat.ts:49,87`).

---

### `astro.config.mjs` (MODIFY — verify-only)

**Analog:** self at lines 1-57.

**Verification target** (per FOUND-04 / RESEARCH §"MDX Bundling Verification"):
- Line 17 `adapter: cloudflare()` — unchanged.
- Per-route `prerender` for `/api/chat` — already declared at `src/pages/api/chat.ts:1` (`export const prerender = false;`). Confirm no collection of MDX content gets bundled into the Worker bundle.
- Astro 6 default is `output: "static"` with per-route SSR opt-in (per existing comment at `astro.config.mjs:15-16`); FOUND-04 only asks the planner to **verify** — likely no edit.

---

### `src/scripts/chat.ts` (MODIFY — DEBT-04 + DEBT-05 + DEBT-02)

**Analog A (DEBT-04 listener dedup):** `src/scripts/analytics.ts:144-153` and `src/scripts/scroll-depth.ts:74-83`.

**Current bootstrap (lines 893-904) — pattern to upgrade:**
```typescript
let chatBootstrapped = false;
if (!chatBootstrapped) {
  chatBootstrapped = true;
  document.addEventListener("astro:page-load", initChat);
  if (document.readyState !== "loading") {
    initChat();
  } else {
    document.addEventListener("DOMContentLoaded", initChat);
  }
}
```

**Target pattern (idempotent — RESEARCH §"Pattern 3"):**
```typescript
if (typeof document !== "undefined") {
  document.removeEventListener("astro:page-load", initChat);
  document.addEventListener("astro:page-load", initChat);
  if (document.readyState !== "loading") {
    initChat();
  } else {
    document.removeEventListener("DOMContentLoaded", initChat);
    document.addEventListener("DOMContentLoaded", initChat);
  }
}
```
The `chatBootstrapped` module-flag becomes redundant once `removeEventListener` provides idempotency at the browser-API layer; planner can drop the flag or keep it as belt-and-suspenders (CONTEXT.md "Claude's Discretion").

**Note:** `src/scripts/chat.ts` lines 893 lacks the `if (typeof document !== "undefined")` guard that `analytics.ts:145` has. Add it for HMR/test-resilience parity (RESEARCH §"Pattern 3" calls this out implicitly).

**Analog B (DEBT-05 imperative-display removal):** self at lines 439-445.

**Pattern to delete** (lines 439-445):
```typescript
async function animatePanelOpen(panel: HTMLElement): Promise<void> {
  panel.style.display = "flex";
}
async function animatePanelClose(panel: HTMLElement): Promise<void> {
  panel.style.display = "none";
}
```

**Target shape (RESEARCH §"Pattern 4"):**
```typescript
async function animatePanelOpen(_panel: HTMLElement): Promise<void> {
  // CSS controls display via .is-open class (DEBT-05 closure).
  // No-op retained so showPanel/hidePanel call sites that await it
  // for keyframe-completion timing do not change shape.
}
async function animatePanelClose(_panel: HTMLElement): Promise<void> {
  // Same.
}
```
Comment style follows the in-file Phase-tag convention at `src/scripts/chat.ts:434-437`:
```typescript
// ============================================
// Animation Helpers (Phase 8: GSAP removed — no-op stubs)
// Chat motion restoration deferred to Phase 10 CHAT-02 per D-27.
// ============================================
```
Update the section banner to reference DEBT-05 on Phase 17.

**Analog C (DEBT-02 client-side log seam):** existing client-tier debug log at `src/scripts/chat.ts:392-395`:
```typescript
// Also log to console in development for debugging
if (import.meta.env.DEV) {
  console.log(`[chat:analytics] ${action}`, label ?? "");
}
```

**Target pattern (RESEARCH §"Pattern 5"):** server emits `console.log("chat.cache_metrics", {...})` JSON with `cache_read_input_tokens` / `cache_creation_input_tokens` / `input_tokens` / `output_tokens`. Client mirrors the same structured-JSON line at the SSE response-handling site so dev tools show parity. Use `import.meta.env.DEV` gating to mirror the existing analytics pattern.

---

### `src/scripts/analytics.ts` (MODIFY — DEBT-04)

**Analog:** self at lines 144-153 (current bootstrap), `src/scripts/scroll-depth.ts:74-83` (sibling pattern).

**Current bootstrap** (lines 138-153):
```typescript
// Bootstrap (matches 15-PATTERNS.md Shared Pattern — Bootstrap on
// astro:page-load + DOMContentLoaded; mirrors scroll-depth.ts and chat.ts).
// WR-01: bootstrap-level guard prevents document listener pile-up if this
// module is re-evaluated across Astro view transitions. The internal
// analyticsInitialized guard already prevents duplicate observable behavior,
// so this is purely a slow-GC hygiene fix for long sessions.
let analyticsBootstrapped = false;
if (typeof document !== "undefined" && !analyticsBootstrapped) {
  analyticsBootstrapped = true;
  document.addEventListener("astro:page-load", initAnalytics);
  if (document.readyState !== "loading") {
    initAnalytics();
  } else {
    document.addEventListener("DOMContentLoaded", initAnalytics);
  }
}
```

**Target pattern:** identical to chat.ts target (above) — substitute handler name `initAnalytics`. Update the comment block to flag DEBT-04 closure on the WR-01 reference (which is Phase 16 origin).

---

### `src/scripts/scroll-depth.ts` (MODIFY — DEBT-04)

**Analog:** self at lines 69-83, `src/scripts/analytics.ts:144-153` (sibling).

**Current bootstrap** (lines 69-83):
```typescript
// Module-evaluation guard — protects against re-import during HMR / test
// reset cycles (vi.resetModules() within a single jsdom session). Production
// cross-document navigation reloads the module fresh (no <ClientRouter />),
// so module-level state resets naturally on every navigation; this guard is
// not a runtime hot path.
let scrollDepthBootstrapped = false;
if (typeof document !== "undefined" && !scrollDepthBootstrapped) {
  scrollDepthBootstrapped = true;
  document.addEventListener("astro:page-load", initScrollDepth);
  if (document.readyState !== "loading") {
    initScrollDepth();
  } else {
    document.addEventListener("DOMContentLoaded", initScrollDepth);
  }
}
```

**Target pattern:** identical to chat.ts/analytics.ts target. Substitute handler name `initScrollDepth`. The leading comment block already documents the WR-01-equivalent rationale; update closing line to flag DEBT-04 closure.

**Cross-cutting note for all three files:** apply the same source-edit shape in all three call sites in a single commit (per D-09 ordering: DEBT-04 is task 3 in the phase). D-26 chat regression battery cadence (D-10) requires a clean run after the DEBT-04 commit because chat.ts is on the surface list.

---

### `src/styles/global.css` (MODIFY — DEBT-05)

**Analog:** self at lines 686-702 (current `#chat-panel` rules).

**Current rules** (verbatim from grep, lines 686-702):
```css
/* WR-06 (Phase 16 review): transform-origin is positional configuration of
 * the element, not part of the animation. Living outside no-preference keeps
 * the origin consistent for reduce and no-preference users alike (relevant
 * if any future code applies a transform to #chat-panel outside the scale-in
 * animation). */
#chat-panel {
  transform-origin: bottom right;
}

/* .is-open class is still added by chat.ts but no animation runs; panel snaps
 * to its resting state (scale 1, opacity 1) instantly. */
@media (prefers-reduced-motion: no-preference) {
  #chat-panel.is-open {
    animation: chat-panel-scale-in 180ms ease-out forwards;
  }
}
```

**Target pattern (RESEARCH §"Pattern 4" recommended target):**
```css
/* Display contract — outside the no-preference media query so it applies to
 * reduced-motion users too (the animation is gated; the visibility is not). */
#chat-panel {
  display: none;
  transform-origin: bottom right;
}

#chat-panel.is-open {
  display: flex;
}

/* Entrance animation — only when motion is allowed. */
@media (prefers-reduced-motion: no-preference) {
  #chat-panel.is-open {
    animation: chat-panel-scale-in 180ms ease-out forwards;
  }
}
```

**Comment-block convention precedent** — the existing `WR-06` comment at line 686 documents motion/no-motion split rationale. Phase 17 DEBT-05 adds the display/animation split (parallel concern). Author the new top comment in matching `/* ... */` block-comment style with a `DEBT-05` tag.

---

### `src/lib/chat-cache.ts` and `src/lib/content-snapshot.ts` (DEBT-02 — file existence TBD)

**Note:** Neither file exists in the repo as of 2026-05-10. Planner must reconcile CONTEXT.md's filename references with the actual edit target. Two options below; pattern is identical either way.

**Analog A (server-side log seam):** `src/pages/api/chat.ts:121-124`:
```typescript
if (event.delta.stop_reason === "max_tokens") {
  truncated = true;
  console.warn("chat.truncated", { stop_reason: "max_tokens" });
}
```
This is the canonical "structured-data console call" pattern in the chat surface — first arg is a `dotted.event.name` string literal, second arg is a flat object with primitive values. Cloudflare Workers Logs / `wrangler tail --format pretty` parse the second arg as JSON.

**Target pattern (RESEARCH §"Pattern 5"):**
```typescript
if (event.type === "message_start") {
  const usage = event.message.usage;
  console.log("chat.cache_metrics", {
    cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
    cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
  });
}
```
Insert in the SSE stream loop at `src/pages/api/chat.ts:105-126` alongside the existing `message_delta` handler.

**Anti-pattern callout (RESEARCH §"Anti-Patterns"):** Do NOT enqueue a new SSE frame to communicate cache metrics to the client — D-15 byte-identical forbids it. This is server-side log-only; the client mirror (in `chat.ts`) is for dev-tools parity, not network bytes.

---

### `src/lib/validation.ts` (MODIFY — D-14 rename + retarget)

**Analog:** self at lines 65-92.

**Current constant + comment** (verbatim, lines 65-72):
```typescript
// Cloudflare Pages project hostname. Only subdomains of this hostname
// (preview deployments of THIS project) pass CORS — not every *.pages.dev site.
// The "-5wl" random suffix is Cloudflare-assigned at project creation and is
// load-bearing: it prevents another Cloudflare Pages user from registering a
// colliding `portfolio.pages.dev` project and bypassing this check. If this
// project is ever renamed, update this constant in lockstep — do NOT shorten
// the suffix to a non-random form.
const PAGES_PREVIEW_SUFFIX = ".portfolio-5wl.pages.dev";
```

**Suffix-match logic that consumes the constant** (lines 84-91 — DO NOT change shape, only the constant name):
```typescript
// Allow preview subdomains of the project's pages.dev hostname (https only).
// Require exactly one non-empty label before the suffix — this rejects the
// apex `portfolio-5wl.pages.dev` and empty-label forms like
// `..portfolio-5wl.pages.dev` that some URL parsers normalize inconsistently.
if (url.protocol === "https:" && url.hostname.endsWith(PAGES_PREVIEW_SUFFIX)) {
  const prefix = url.hostname.slice(0, -PAGES_PREVIEW_SUFFIX.length);
  if (prefix.length > 0 && !prefix.endsWith(".")) return true;
}
```

**Target pattern (RESEARCH §"Code Examples → validation.ts rename"):**
```typescript
// Cloudflare Workers preview hostname. Only subdomains of this hostname
// (preview deployments of THIS Worker) pass CORS — not every *.workers.dev site.
// The {worker_name}.{account_subdomain} prefix is Cloudflare-assigned at
// account creation + Worker name and is load-bearing: it prevents another
// Cloudflare user from registering a colliding Worker name and bypassing
// this check. If the Worker is ever renamed, update this constant in lockstep.
// VALUE captured from first *.workers.dev preview deploy — do NOT hand-construct.
const WORKERS_PREVIEW_SUFFIX = ".<account-subdomain>.workers.dev";  // TBD: capture from deploy log
```

**Critical sequencing** (RESEARCH §"Pitfall 4"): suffix VALUE is **not knowable pre-deploy**. Plan must sequence: (1) deploy first → (2) capture URL → (3) update constant + tests → (4) re-deploy. CONTEXT.md "Claude's Discretion" allows the constant to optionally migrate to `src/lib/cors.ts` — keep in `validation.ts` unless the file gains other CORS concerns (organic refactor judgment).

---

### `tests/api/security.test.ts` (MODIFY — D-14 lockstep)

**Analog:** self at lines 79-99 (existing preview-subdomain CORS tests).

**Current tests** (lines 79-99, verbatim):
```typescript
it("allows https://<branch>.portfolio-5wl.pages.dev (CF Pages preview)", () => {
  expect(
    isAllowedOrigin("https://phase-14-preview.portfolio-5wl.pages.dev")
  ).toBe(true);
});

it("rejects https://portfolio-5wl.pages.dev (apex, no subdomain)", () => {
  expect(isAllowedOrigin("https://portfolio-5wl.pages.dev")).toBe(false);
});

it("rejects http://phase-14-preview.portfolio-5wl.pages.dev (wrong protocol)", () => {
  expect(
    isAllowedOrigin("http://phase-14-preview.portfolio-5wl.pages.dev")
  ).toBe(false);
});

it("rejects https://evil.portfolio-5wl.pages.dev.attacker.com (suffix-confusion attack)", () => {
  expect(
    isAllowedOrigin("https://evil.portfolio-5wl.pages.dev.attacker.com")
  ).toBe(false);
});
```

**Target pattern:** mechanical substitution — replace `portfolio-5wl.pages.dev` with the actual `*.workers.dev` suffix captured per Pitfall 4. Test names update in lockstep (e.g., `(CF Pages preview)` → `(CF Workers preview)`). Test count unchanged (4 preview tests).

---

### `package.json` (MODIFY — D-15 build script + D-13 dev:worker)

**Analog:** self at lines 9-24.

**Current scripts block** (verbatim):
```json
"scripts": {
  "dev": "astro dev",
  "build": "pnpm build:chat-context && wrangler types && astro check && astro build && node scripts/pages-compat.mjs",
  "build:chat-context": "node scripts/build-chat-context.mjs",
  "build:chat-context:check": "node scripts/build-chat-context.mjs --check",
  ...
}
```

**Target diff (RESEARCH §"Code Examples → package.json"):**
```diff
   "scripts": {
     "dev": "astro dev",
+    "dev:worker": "wrangler dev",
-    "build": "pnpm build:chat-context && wrangler types && astro check && astro build && node scripts/pages-compat.mjs",
+    "build": "pnpm build:chat-context && wrangler types && astro check && astro build",
```

Two semicolon-separated edits, one commit. No other script touches.

---

### `.github/workflows/sync-check.yml` (MODIFY — DEBT-03)

**Analog:** self at lines 13-34 (existing `check` job + `pnpm sync:check` step).

**Current shape** (verbatim, lines 13-34):
```yaml
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Verify Projects/ <-> MDX sync is clean
        run: pnpm sync:check
```

**Target pattern (RESEARCH §"Code Examples" — single-job two-step recommended):**
```diff
       - name: Verify Projects/ <-> MDX sync is clean
         run: pnpm sync:check
+      - name: Verify portfolio-context.json is in sync with sources
+        run: pnpm build:chat-context:check
```

The `pnpm build:chat-context:check` script already exists at `package.json:13` (no script-add needed). RESEARCH recommends single-job (saves ~30s of cold-run setup vs separate parallel job). CONTEXT.md "Claude's Discretion" allows splitting into two jobs if true parallelism is wanted.

**Path triggers** (lines 4-8) — likely need expansion to cover the new dependency surface:
```yaml
on:
  pull_request:
    paths:
      - "Projects/**"
      - "src/content/projects/**"
      - "src/data/about.ts"            # NEW for build-chat-context
      - "src/data/portfolio-context.static.json"  # NEW for build-chat-context
      - "scripts/sync-projects.mjs"
      - "scripts/build-chat-context.mjs"  # NEW
```
RESEARCH does not prescribe this — it's an organic-refactor decision when the planner adds the second step. Without it, the new step runs only on `push: main`, missing PR drift.

---

### `PROJECT.md` (MODIFY — DEBT-01 doc rewrite)

**Analog:** self (Known issues / tech debt section — exact location not surfaced by RESEARCH; planner audits).

**Pattern shape (CONTEXT.md DEBT-01):** rewrite the existing `CHAT_RATE_LIMITER` Known-issues entry from "carry-forward gap" to "documented + Free-tier acceptable." Mention v1.4+ Workers Paid plan as the upgrade path.

**No code-pattern analog** — this is a doc edit. Cross-check `STATE.md` and `RETROSPECTIVE.md` for parallel `CHAT_RATE_LIMITER` mentions per CONTEXT.md "Claude's Discretion".

---

### `scripts/pages-compat.mjs` (DELETE)

**Analog:** n/a — pure delete per D-15.

**Pattern note:** the file's full content (57 LOC) is the Pages-specific `_worker.js` + `_routes.json` restructure. Workers Static Assets reads `dist/client/` directly via the `[assets]` binding and has no use for Pages magic filenames. RESEARCH §"State of the Art" confirms removal is safe.

---

## Shared Patterns

### Idempotent `astro:page-load` listener registration (DEBT-04)

**Source:** RESEARCH §"Pattern 3" (consolidates the three call-site fixes).
**Apply to:** `src/scripts/chat.ts:893-904`, `src/scripts/analytics.ts:144-153`, `src/scripts/scroll-depth.ts:74-83`.

**Excerpt** (target shape, identical across all three files modulo handler name):
```typescript
if (typeof document !== "undefined") {
  document.removeEventListener("astro:page-load", initX);
  document.addEventListener("astro:page-load", initX);
  if (document.readyState !== "loading") {
    initX();
  } else {
    document.removeEventListener("DOMContentLoaded", initX);
    document.addEventListener("DOMContentLoaded", initX);
  }
}
```

**Why remove-then-add over a Set guard:** browser's internal `(target, type, handler)` registry already dedups by reference equality; calling `removeEventListener` before `addEventListener` is a no-op when the handler isn't registered, idempotent when it is, and avoids parallel duplicate state in user-space.

**WR-01 comment-block precedent** at `src/scripts/analytics.ts:138-143` — preserve the rationale comment in the upgraded code (rename "WR-01" → "DEBT-04" or stack the tags `WR-01 / DEBT-04`).

### Structured-JSON console log (DEBT-02)

**Source:** `src/pages/api/chat.ts:123` — `console.warn("chat.truncated", { stop_reason: "max_tokens" });`.
**Apply to:** Server-side cache-hit observability in the SSE stream loop, plus client-mirror in `src/scripts/chat.ts`.

**Excerpt:**
```typescript
console.log("chat.cache_metrics", {
  cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
  cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
  input_tokens: usage.input_tokens,
  output_tokens: usage.output_tokens,
});
```

**Convention:** first arg is a dotted-event-name string literal (`chat.cache_metrics`, `chat.truncated`); second arg is a flat object with primitive values only (no nesting beyond one level — Workers Logs JSON parser handles flat objects best).

**Anti-pattern reminder:** never enqueue cache metrics into the SSE stream — D-15 byte-identical forbids new SSE frame types.

### Forward-compatibility comment for Phase 18/19 hooks

**Source:** RESEARCH §"Pitfall 10" + §"Pattern 1".
**Apply to:** `src/worker.ts` (`scheduled()` no-op stub), `tests/api/sse-snapshot.test.ts` (file-level docblock).

**Excerpt (worker.ts):**
```typescript
async scheduled(_controller, _env, ctx): Promise<void> {
  // Phase 19 fills with: ctx.waitUntil(deliverDue(_env, _controller.scheduledTime));
  // Stub kept here so wrangler.jsonc triggers.crons declaration is wireable
  // in Phase 19 with a single ./worker.ts edit (no entrypoint change needed).
  ctx.waitUntil(Promise.resolve());
},
```

**Excerpt (sse-snapshot.test.ts file-level docblock — pattern from `tests/build/chat-context-integrity.test.ts:1-13`):**
```typescript
/**
 * SSE byte-identical snapshot (D-15 / TEST-02)
 *
 * Captures the canonical SSE byte stream of /api/chat against a deterministic
 * fixture (Anthropic mocked). The fixture is the source of truth for D-15;
 * any byte-level drift in headers or frame shape fails this test.
 *
 * Phase 18 will add ctx.waitUntil(appendTurn(...)) calls in api/chat.ts.
 * waitUntil runs out-of-band and does NOT modify response bytes — this
 * fixture should pass into Phase 18 unchanged. If it fails in Phase 18,
 * verify the failure is in headers/frame-shape, not in waitUntil timing.
 */
```

### CLI script docblock + exit-code convention

**Source:** `scripts/build-chat-context.mjs:1-26` and `scripts/sync-projects.mjs:1-24`.
**Apply to:** `scripts/resend-warmup.mjs`.

**Excerpt:**
```javascript
#!/usr/bin/env node
/**
 * @fileoverview Phase 17 D-07 throwaway warmup-sends script.
 * ...
 * Usage:
 *   RESEND_API_KEY=... node scripts/resend-warmup.mjs --to ... --count 5
 *
 * Exit codes:
 *   0 — all sends accepted (HTTP 200)
 *   1 — env-var missing OR any send returned non-2xx
 */
```

---

## No Analog Found

| File | Role | Data Flow | Notes |
|------|------|-----------|-------|
| (none) | — | — | All in-scope files have at least a role-match analog in the existing repo. |

`src/lib/chat-cache.ts` and `src/lib/content-snapshot.ts` are the closest thing to "no analog" — but only because the files don't exist yet. The log-seam **shape** has a strong analog at `src/pages/api/chat.ts:123` (`console.warn` structured-JSON pattern), so the planner has full reference for the seam authoring even if the file path lands differently.

---

## Metadata

**Analog search scope:**
- `src/lib/`, `src/scripts/`, `src/pages/api/`, `src/styles/`, `src/scripts/lib/`
- `tests/api/`, `tests/build/`, `tests/client/`, `tests/fixtures/`
- `scripts/` (top-level)
- `.github/workflows/`
- `node_modules/@astrojs/cloudflare/dist/` (adapter type signatures)

**Files scanned (read or grepped):** ~25 (16 in-scope edit targets + 9 analog/reference files).

**Key insights:**
- Phase 17 has near-zero net-new code shape: `src/worker.ts` is a verbatim copy of the documented Astro pattern, `scripts/resend-warmup.mjs` mirrors the CLI shape of existing `scripts/*.mjs`, and `tests/api/sse-snapshot.test.ts` mirrors `tests/api/chat.test.ts:117-157` byte-stream pattern.
- The DEBT-04 listener-dedup pattern is identical in three call sites — single source-edit shape applied three times.
- The DEBT-05 CSS state machine is 90% already authored at `global.css:691-702`; only the imperative JS half needs deletion plus two new CSS rules (`display: none` on `#chat-panel` and `display: flex` on `#chat-panel.is-open`).
- `wrangler.jsonc` rewrite is additive on top of the existing 11-line config; the only field-flip is `main`.
- The CORS allow-list rename (D-14) is mechanically a constant rename — but the suffix VALUE depends on first-deploy capture (Pitfall 4 sequencing).

**Pattern extraction date:** 2026-05-10
