# Phase 15: Analytics Instrumentation - Pattern Map

**Mapped:** 2026-04-23
**Files analyzed:** 7 (3 new, 4 modified)
**Analogs found:** 6 / 7 (1 flagged net-new)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/scripts/analytics.ts` (NEW) | client script | event-driven + delegated DOM | `src/scripts/chat.ts` | exact (same role, same plain-TS IIFE shape) |
| `tests/client/analytics.test.ts` (NEW) | test (jsdom, unit) | request-response (event dispatch -> mock assertion) | `tests/client/chat-copy-button.test.ts` | exact (same jsdom harness, same DOM reset pattern, imports same module under test) |
| `tests/client/sse-truncation.test.ts` (NEW) | test (stream parser integration) | streaming (ReadableStream -> SSE parse) | `tests/api/chat.test.ts` lines 109-157 (ReadableStream + TextEncoder/TextDecoder harness) | role-match (test, request-response) + data-flow match (streaming) |
| `tests/build/umami-tag-present.test.ts` (NEW) | test (source-string assertion) | file-I/O (readFileSync against `src/layouts/BaseLayout.astro`) | `tests/client/chat-widget-header.test.ts` (readFileSync against an .astro file + `.toContain()` assertions) | exact-role (source-text build assertion); there is NO existing precedent for reading `dist/` -- recommend source-text pattern instead |
| `src/layouts/BaseLayout.astro` (MODIFIED) | layout / frontmatter-conditional markup | request-response (build-time SSG) | `src/components/JsonLd.astro` (the one existing `<script is:inline>` usage) | role-match (both are `is:inline` script tags in Astro); BaseLayout itself carries the `{noindex && <meta … />}` precedent for the build-time conditional render pattern |
| `src/scripts/chat.ts` (MODIFIED) | client script | streaming (SSE parse loop) | `src/scripts/chat.ts` itself lines 182-199 (the existing parse loop -- edit is additive inside it) | exact (diff is inside the analog) |
| `src/pages/projects/[id].astro` (MODIFIED) | page template | markup (static SSG + data-attribute sentinels) | `src/components/primitives/MobileMenu.astro` line 68 (empty `<div aria-hidden="true">` structural element) -- and the `<span aria-hidden="true">` pattern already established in ContactSection/NextProject/Header/Footer/[id].astro itself | role-match (both are invisible structural DOM nodes with `aria-hidden`) |

## Pattern Assignments

---

### `src/scripts/analytics.ts` (client script, event-driven + delegated DOM)

**Analog:** `src/scripts/chat.ts`

**Role fit:** Both are plain-TS client scripts living in `src/scripts/`, TypeScript strict, imported once from an Astro `<script>` block in a layout/component, idempotent across astro:page-load firings, zero framework dependency.

**Delta from analog:**
- Phase 15's `analytics.ts` does NOT render into the DOM -- so DOMPurify/marked imports are NOT needed. Drop lines 7-8 and 14-49 of chat.ts from the mental model.
- No localStorage persistence; analytics is fire-and-forget via `window.umami?.track(...)`.
- Module-level IIFE-ish guard (`let initialized = false`) mirrors chat.ts `let chatInitialized = false` at line 128.
- Exports pure helpers for test (`classifyOutbound`, `handleChatAnalytics`) the same way chat.ts exports `renderMarkdown` (line 45) and `createCopyButton` -- the established test-seam pattern.

**Imports pattern** -- chat.ts lines 1-9 (copy the header-comment + strict-TS shape; drop the marked/DOMPurify imports):
```ts
// Chat client-side controller — Phase 7
// Handles: bubble toggle, GSAP animations, starter chips, input handling,
// SSE streaming with AbortController timeout, markdown rendering with
// DOMPurify sanitization, copy-to-clipboard, typing indicator, error messages,
// nudge system, auto-scroll, and reduced-motion support.

import { marked } from "marked";
import DOMPurify, { type Config } from "dompurify";
```
**For analytics.ts:** header comment stays ("Analytics client-side forwarder -- Phase 15 / Handles: chat:analytics forwarding to Umami, delegated outbound-link classification, resume-download dedup, scroll-depth IntersectionObserver on /projects/[id]"); no imports needed (zero new runtime deps per cross-phase gate).

**Core event-dispatch pattern** -- chat.ts lines 379-388 (the canonical dispatcher the forwarder consumes):
```ts
function trackChatEvent(action: string, label?: string): void {
  document.dispatchEvent(new CustomEvent("chat:analytics", {
    detail: { action, label, timestamp: Date.now() },
  }));

  // Also log to console in development for debugging
  if (import.meta.env.DEV) {
    console.log(`[chat:analytics] ${action}`, label ?? "");
  }
}
```
**For analytics.ts forwarder:** `document.addEventListener("chat:analytics", (e) => { const { action, label } = (e as CustomEvent).detail; window.umami?.track(action, label ? { label } : {}); })` -- mirrors the `detail: { action, label, timestamp }` shape; preserves the content-free payload discipline (Phase 7 D-36).

**Module-level initialization guard pattern** -- chat.ts lines 124-128:
```ts
// Module-level initialization guard — prevents duplicate handlers
// across view transition navigations where transition:persist preserves
// the DOM but astro:page-load re-fires the script.
// Addresses review concern: Claude MEDIUM, Codex MEDIUM — duplicate handler risk.
let chatInitialized = false;
```
**For analytics.ts:** `let analyticsInitialized = false;` at module scope, with `initAnalytics()` function that early-returns if already initialized. Mirror the `document.addEventListener("astro:page-load", init); if (document.readyState !== "loading") init(); else document.addEventListener("DOMContentLoaded", init);` bootstrap (see RESEARCH.md §2.3).

**Exported-helper-for-test pattern** -- chat.ts line 45 (`renderMarkdown`):
```ts
/**
 * Render raw markdown text to sanitized HTML.
 * Pipeline: raw -> marked.parse() -> DOMPurify.sanitize()
 * Exported for testing.
 */
export function renderMarkdown(raw: string): string {
  // marked.parse() with { async: false } configured above — returns string, not Promise
  const html = marked.parse(raw) as string;
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}
```
**For analytics.ts:** export pure helpers (`classifyOutbound(href: string): { type: string; href: string } | null` and `handleChatAnalytics(detail: { action: string; label?: string }): void`). RESEARCH.md §8.3 gives the exact recommended shape -- tests then import them without triggering install-time listeners, same as markdown.test.ts importing `renderMarkdown` and chat-copy-button.test.ts importing `createCopyButton`.

**DEV-mode logging pattern** -- chat.ts lines 384-387:
```ts
if (import.meta.env.DEV) {
  console.log(`[chat:analytics] ${action}`, label ?? "");
}
```
**For analytics.ts:** same guard shape if debug logging is added -- `if (import.meta.env.DEV) console.log("[analytics] umami.track", action, metadata);`. Vite strips the DEV branch from prod builds.

**Call-sites & imports:**
- `src/components/chat/ChatWidget.astro:184-186` is the canonical import shape:
```astro
<script>
  import "../../scripts/chat.ts";
</script>
```
- For `analytics.ts`, import it from `src/layouts/BaseLayout.astro` inside an `<script>` block (NOT `is:inline`; standard processed script for TS support). Place inside `<body>` after the ChatWidget block so it loads once per full page-load (no ClientRouter, so this is once per navigation).

---

### `tests/client/analytics.test.ts` (test, jsdom unit)

**Analog:** `tests/client/chat-copy-button.test.ts`

**Role fit:** Both test functions exported from a `src/scripts/*.ts` module; both use jsdom for DOM-interacting behavior; both use `vi.fn()` mocks for side-effect sinks; both reset DOM via `document.body.innerHTML = ""` in `beforeEach`.

**Delta from analog:**
- Replace the `navigator.clipboard` mock with a `window.umami = { track: vi.fn() }` mock.
- Add an `IntersectionObserver` stub in `beforeEach` (jsdom 29 does not implement it -- RESEARCH.md §7.3 gives the minimal stub verbatim).
- Drive delegated clicks via `element.click()` (bubbles in jsdom) -- no user-event library needed.
- 15 tests (RESEARCH.md §8.2 spec) -- planner uses that table as the RED->GREEN list.

**Imports + environment header** -- chat-copy-button.test.ts lines 1-3 (copy verbatim; swap the import):
```ts
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCopyButton } from "../../src/scripts/chat";
```
**For analytics.test.ts:**
```ts
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { classifyOutbound, handleChatAnalytics } from "../../src/scripts/analytics";
```
The `// @vitest-environment jsdom` header is MANDATORY (see vitest.config.ts -- global environment is `node`; per-file jsdom is opt-in via comment). Same pattern as markdown.test.ts line 1.

**beforeEach DOM reset + mock install** -- chat-copy-button.test.ts lines 6-11:
```ts
beforeEach(() => {
  document.body.innerHTML = "";
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});
```
**For analytics.test.ts (mirrors shape; adds umami + IntersectionObserver stubs):**
```ts
beforeEach(() => {
  document.body.innerHTML = "";
  (window as any).umami = { track: vi.fn() };
  (window as any).IntersectionObserver = class {
    constructor(public cb: IntersectionObserverCallback, public opts?: IntersectionObserverInit) {}
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  };
});
```
The IntersectionObserver stub captures `cb` on the instance so the test can synthesize entries and invoke the callback (RESEARCH.md §7.3 -- identical to the jsdom 22+ community pattern).

**Click-bubble / DOM-injection assertion** -- chat-copy-button.test.ts lines 36-48:
```ts
it("flips to COPIED + accent on click, reverts after 1s", async () => {
  vi.useFakeTimers();
  const btn = createCopyButton(() => "payload");
  document.body.appendChild(btn);
  btn.click();
  await Promise.resolve(); // drain clipboard microtask
  expect(btn.textContent).toBe("COPIED");
  expect(btn.style.color).toBe("var(--accent)");
  vi.advanceTimersByTime(1000);
  expect(btn.textContent).toBe("COPY");
  expect(btn.style.color).toBe("var(--ink-faint)");
  vi.useRealTimers();
});
```
**For analytics.test.ts:** use the same `document.body.appendChild(anchor); anchor.click();` pattern to synthesize delegated clicks; assert `expect((window as any).umami.track).toHaveBeenCalledWith("outbound_click", { type: "github", href: "github.com/jackc625" })`.

**CustomEvent dispatch assertion pattern** (new -- no direct analog, but mirrors the dispatchEvent pattern from chat.ts:380):
```ts
it("chat:analytics with action=chat_open forwards to umami.track", () => {
  document.dispatchEvent(new CustomEvent("chat:analytics", {
    detail: { action: "chat_open", timestamp: Date.now() },
  }));
  expect((window as any).umami.track).toHaveBeenCalledWith("chat_open", {});
});
```
Tests S6-S14 from RESEARCH.md §10.1 map 1:1 to the 15-test list in §8.2.

---

### `tests/client/sse-truncation.test.ts` (test, stream parser integration)

**Analog:** `tests/api/chat.test.ts` lines 109-157 (the ReadableStream + TextEncoder/TextDecoder harness -- the only existing test that feeds canned SSE bytes through a reader)

**Role fit:** Both construct an in-memory `ReadableStream` that emits SSE frames and assert on the parsed output. Existing test asserts on `fullOutput` string; new test needs to intercept the `onToken` / `onDone` / `onError` callbacks AND assert a `chat:analytics` CustomEvent was dispatched.

**Delta from analog:**
- The existing chat.test.ts test is purely byte-level (concatenates chunks and greps). Phase 15's test needs to exercise the ACTUAL `streamChat` function in `src/scripts/chat.ts` -- but `streamChat` is NOT currently exported (`async function streamChat(...)` at chat.ts:140).
- Two options for the planner:
  - **(A) Export `streamChat` for testing** (mirrors the `export function renderMarkdown` / `export function createCopyButton` pattern -- the established test-seam precedent at chat.ts:45). This is the path with precedent.
  - **(B) Mock `fetch` to return a ReadableStream body** and exercise through the public `sendMessage` surface. Higher fidelity but requires full DOM mount of ChatWidget.
- Planner recommendation: **(A)** -- matches the existing export-for-testing idiom and is the lowest-risk D-26 client-surface test.

**Code pattern to copy** -- chat.test.ts lines 117-157 (the ReadableStream harness):
```ts
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const chunks: string[] = [];

const stream = new ReadableStream({
  async start(controller) {
    for (const event of mockEvents) {
      if (
        event.type === "content_block_delta" &&
        "delta" in event &&
        event.delta?.type === "text_delta"
      ) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: event.delta?.text })}\n\n`
          )
        );
      }
    }
    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    controller.close();
  },
});

const reader = stream.getReader();
let done = false;
while (!done) {
  const result = await reader.read();
  if (result.done) {
    done = true;
  } else {
    chunks.push(decoder.decode(result.value));
  }
}
```

**For sse-truncation.test.ts:** feed an SSE stream that emits `data: {"text":"Hello"}\n\n` then `data: {"truncated":true}\n\n` then `data: [DONE]\n\n`. Assert:
1. `onToken` called exactly once with `"Hello"` (NOT twice, NOT with `undefined` -- the truncated frame must be skipped, not passed through).
2. A `chat:analytics` CustomEvent was dispatched with `detail.action === "chat_truncated"` -- capture via `document.addEventListener("chat:analytics", spy)` before invoking the parser.
3. `onDone` called exactly once (the `[DONE]` terminator still resolves).

Combine with `// @vitest-environment jsdom` header (like chat-copy-button.test.ts:1) -- the test uses `document.dispatchEvent` which needs jsdom. The existing chat.test.ts runs under node environment (no DOM) and uses raw string assertions; this new test needs jsdom for the CustomEvent dispatch assertion path.

**Pattern delta:** this is a **hybrid** between chat.test.ts (ReadableStream construction) and chat-copy-button.test.ts (jsdom + vi.fn() spies). The harness comes from the former; the jsdom env + CustomEvent listener comes from the latter.

---

### `tests/build/umami-tag-present.test.ts` (test, source-string assertion)

**Analog:** `tests/client/chat-widget-header.test.ts` (the `readFileSync` + `.toContain()` pattern applied to an `.astro` source file)

**Role fit:** Both assert on literal strings inside Astro source files at test time, no Astro build required. This is the ONLY existing pattern in `tests/` that reads an `.astro` source file for invariant checks.

**Pattern note -- NET-NEW alternative considered:**
The original phase scope calls this a "build-output assertion test." Reading `dist/client/**/*.html` requires running `pnpm build` first, which is slow and CI-fragile. **There is no existing test that reads from `dist/`.** Recommend the planner adopt the source-text pattern (like chat-widget-header.test.ts) instead -- assert against `src/layouts/BaseLayout.astro` source for:
- Literal `cloud.umami.is/script.js` substring presence
- Literal `is:inline` attribute presence
- Literal `data-domains="jackcutrara.com"` presence
- Literal `{import.meta.env.PROD` substring presence (the build-time guard)

This gives the same signal (Vite will honor `import.meta.env.PROD`; Astro's `is:inline` is well-covered by `src/components/JsonLd.astro`) without requiring a dist/ build step.

If the planner truly needs dist/ verification, it becomes net-new infrastructure: add a `tests/build/dist-assertions.test.ts` harness that shells out to `pnpm build` in `beforeAll`, then `readFileSync("dist/client/index.html")` + assert. **Recommend against this for Phase 15** -- flag as future work; rely on the source-text pattern and the Lighthouse CI gate for prod-build correctness.

**Code pattern to copy** -- chat-widget-header.test.ts lines 1-23:
```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("ChatWidget header literal (CHAT-06 / Plan 14-04 Task 2)", () => {
  const widgetSource = readFileSync(
    join(process.cwd(), "src", "components", "chat", "ChatWidget.astro"),
    "utf8"
  );

  it("renders the renamed header `ASK ABOUT JACK` in the source", () => {
    expect(widgetSource).toContain("ASK ABOUT JACK");
  });

  it("does not contain the pre-Plan-14-04 header `ASK JACK'S AI`", () => {
    expect(widgetSource).not.toContain("ASK JACK'S AI");
    expect(widgetSource).not.toContain("Ask Jack's AI");
  });

  it("preserves the dialog aria-label `Chat with Jack's AI` (D-18: header rename only)", () => {
    expect(widgetSource).toContain('aria-label="Chat with Jack\'s AI"');
  });
});
```

**For umami-tag-present.test.ts:** same shape, swap path to `src/layouts/BaseLayout.astro`, assert:
- `expect(layoutSource).toContain("cloud.umami.is/script.js")` -- Umami src (D-03)
- `expect(layoutSource).toContain("is:inline")` -- mandatory per RESEARCH.md §3.2
- `expect(layoutSource).toContain('data-domains="jackcutrara.com"')` -- D-01 server-side filter
- `expect(layoutSource).toContain("defer")` -- D-02 (drop `async` per RESEARCH.md §3.3 recommendation)
- `expect(layoutSource).toContain("import.meta.env.PROD")` -- D-01 belt-and-suspenders gate
- Negative guard: `expect(layoutSource).not.toContain("async")` IF planner adopts the defer-only recommendation (catches regression where someone adds `async`)
- `expect(layoutSource).toMatch(/data-website-id=/)` -- D-03 attribute present (don't assert the literal UUID; Jack commits the UUID during phase execution per phase-opening checklist)

**Reads `process.cwd()` not `__dirname`** -- matches chat-widget-header.test.ts (vitest runs from project root).

---

### `src/layouts/BaseLayout.astro` (layout, build-time SSG)

**Analog:** `src/components/JsonLd.astro` (existing `<script is:inline>` usage -- the ONLY `is:inline` script precedent in the codebase); plus `BaseLayout.astro:84` (the existing `{noindex && <meta />}` frontmatter-conditional-render pattern)

**Role fit:** The Umami tag needs `is:inline` (external src + preserved `data-*` attrs); JsonLd.astro is the precedent. The PROD gate uses `{import.meta.env.PROD && <script … />}` JSX-expression rendering; the `{noindex && <meta … />}` pattern at BaseLayout.astro:84 is the in-file precedent for that technique.

**`<script is:inline>` pattern** -- JsonLd.astro full file (note: the two `.replace` calls at the bottom use LITERAL U+2028 and U+2029 separator characters as the regex source; they are displayed here as the escape sequences `[U+2028]` / `[U+2029]` to keep this file free of invisible unicode -- the actual JsonLd.astro source contains the literal chars):
```astro
---
interface Props {
  schema: Record<string, unknown>;
}
const { schema } = Astro.props;
// Escape </ and <! sequences that would terminate a <script> block or
// start an HTML comment. Also escape line/paragraph separators that
// break JavaScript string literals in older parsers.
const serialized = JSON.stringify(schema)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026")
  .replace(/[U+2028]/g, "\\u2028")  // actual source has literal U+2028 inside the regex
  .replace(/[U+2029]/g, "\\u2029"); // actual source has literal U+2029 inside the regex
---

<script is:inline type="application/ld+json" set:html={serialized} />
```

**Frontmatter-conditional render pattern** -- BaseLayout.astro line 84:
```astro
{noindex && <meta name="robots" content="noindex, nofollow" />}
```
This is the exact JSX-expression shape Phase 15 mirrors. `noindex` is a prop; for Phase 15, swap in `import.meta.env.PROD` (a Vite build-time replacement).

**For BaseLayout.astro Phase 15 insert** -- combine both patterns. Per RESEARCH.md §3.2, insert in `<head>` **after** `<SEO … />` (line 80) and **before** the `<Font>` preload triplet (lines 81-83):
```astro
<SEO … />
{import.meta.env.PROD && (
  <script
    is:inline
    defer
    src="https://cloud.umami.is/script.js"
    data-website-id="REPLACE_WITH_UMAMI_UUID"
    data-domains="jackcutrara.com"
  />
)}
<Font cssVariable="--font-display-src" />
```

**Delta from analog:**
- JsonLd.astro uses `type="application/ld+json"` + `set:html={serialized}` (inline content); Phase 15 uses external `src=` + data attributes (no inline body).
- Per RESEARCH.md §3.3: **drop `async`, keep `defer` only** (CONTEXT.md D-02 says "async+defer" but the HTML spec + Umami docs disagree -- planner resolves as defer-only).
- `data-website-id` is a committed static literal (D-03). Jack drops the Umami UUID into the source during phase execution per phase-opening checklist.

**Call-sites & imports:**
- BaseLayout.astro is consumed by every page: `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/projects.astro`, `src/pages/projects/[id].astro`, `src/pages/contact.astro`. No changes to consumers.
- Add an `<script>` block (NOT `is:inline`) at the end of `<body>` that imports `analytics.ts`:
```astro
<ChatWidget />
<script>
  import "../scripts/analytics.ts";
</script>
```
Mirrors the `ChatWidget.astro:184-186` pattern. Processed script -> TS support, ESM bundling, deduplicated across navigations.

---

### `src/scripts/chat.ts` (client script, SSE streaming)

**Analog:** itself -- lines 182-199 (the existing SSE parse loop that Phase 15 augments)

**Exact site of the additive diff** -- chat.ts lines 189-198:
```ts
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            onError("api_error");
            return;
          }
          onToken(parsed.text);
        } catch {
          /* skip malformed SSE line */
        }
```

**Insert between the `parsed.error` guard and the `onToken(parsed.text)` call:**
```ts
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            onError("api_error");
            return;
          }
          // Phase 15 D-14: recognize server truncation diagnostic frame
          // {"truncated": true} arrives just before [DONE] when stop_reason === "max_tokens"
          // Forward to Umami via the existing chat:analytics CustomEvent (5th action)
          if (parsed.truncated === true) {
            trackChatEvent("chat_truncated");
            continue; // skip onToken — this frame has no .text, would render "undefined"
          }
          onToken(parsed.text);
        } catch {
          /* skip malformed SSE line */
        }
```

**Design invariants (RESEARCH.md §5.3):**
- Additive: inserts one `if` block. Deletes nothing.
- Fail-soft: if server stops emitting the frame, parser handles all other frames unchanged.
- No double-fire: single `trackChatEvent("chat_truncated")` call; one CustomEvent per response.
- No double-render: `continue` skips `onToken(parsed.text)` (which would otherwise render `undefined`).
- `onDone`/`onError`/streaming invariants preserved.

**Companion change -- export streamChat for the new sse-truncation.test.ts** (chat.ts line 140):
```ts
async function streamChat(
```
becomes
```ts
export async function streamChat(
```
Mirrors the `export function renderMarkdown` / `export function createCopyButton` pattern at chat.ts:45 -- established test-seam idiom. Zero behavioral change.

**D-26 client-surface regression coverage:** RESEARCH.md §9.2 gives the 9-item breakdown. Only items #7 (SSE streaming) is changed; all other items remain byte-identical in behavior. Re-run `tests/client/markdown.test.ts`, `tests/client/chat-copy-button.test.ts`, `tests/client/focus-visible.test.ts` -- all expect GREEN unchanged.

---

### `src/pages/projects/[id].astro` (page template, markup)

**Analog:** `src/components/primitives/MobileMenu.astro:68` (empty `<div aria-hidden="true">` as invisible structural DOM); plus in-file precedent at `[id].astro:53` for `<span class="project-link-sep" aria-hidden="true">`

**Reference markup (MobileMenu.astro:68):**
```astro
<div class="mobile-menu-backdrop" data-menu-close aria-hidden="true"></div>
```

**In-file precedent at [id].astro:53:**
```astro
<span class="project-link-sep" aria-hidden="true">&middot;</span>
```

**Role fit:** Both are invisible-to-screen-reader structural DOM nodes with CSS-positioned placement and no semantic content. Perfect analog for scroll-sentinels.

**For [id].astro Phase 15 insert** (inside `<article>`, after the existing `<section>` elements, per RESEARCH.md §2.1):
```astro
<article>
  <section class="section project-header">…</section>
  <section class="section project-body-section">…</section>
  <section class="section">…</section>
  <!-- Phase 15: scroll-depth sentinels (D-06). Absolute-positioned via percent
       inside <article> relative context. Observer in src/scripts/analytics.ts
       fires scroll_depth at 25/50/75/100%. -->
  <div class="scroll-sentinel" data-percent="25" aria-hidden="true"></div>
  <div class="scroll-sentinel" data-percent="50" aria-hidden="true"></div>
  <div class="scroll-sentinel" data-percent="75" aria-hidden="true"></div>
  <div class="scroll-sentinel" data-percent="100" aria-hidden="true"></div>
</article>
```

**CSS addition inside the existing `<style>` block (after line 118):**
```css
/* Phase 15: scroll-depth sentinels (D-06, D-07) — positioned as percent
   of article height so sentinel top crosses viewport at each depth. */
article {
  position: relative;
}
.scroll-sentinel {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  pointer-events: none;
}
.scroll-sentinel[data-percent="25"]  { top: 25%; }
.scroll-sentinel[data-percent="50"]  { top: 50%; }
.scroll-sentinel[data-percent="75"]  { top: 75%; }
.scroll-sentinel[data-percent="100"] { top: 100%; }
```

**Delta from analog:**
- MobileMenu backdrop is full-viewport fixed-positioned overlay; scroll-sentinels are `position: absolute` at fractional `top` values inside `<article>`.
- Both use `aria-hidden="true"` -- no assistive-tech impact (identical to the existing `.project-link-sep` precedent on line 53 of the same file).
- Must add `position: relative` to the existing `article` selector (RESEARCH.md §2.1 confirms no layout regression -- child `<section>`s are not absolutely positioned, so a new relative context has zero visual effect).

**Call-sites:** [id].astro is consumed by Astro's static getStaticPaths -- generates one static page per project (6 projects per CONTEXT.md §canonical_refs / Phase 13 D-04). Observer in analytics.ts detects presence via `document.querySelectorAll(".scroll-sentinel")` -- absent on other routes, so observer construction is a no-op elsewhere (RESEARCH.md §2.4 -- "recommend this pattern over path-string sniffing").

---

## Shared Patterns

### Snake_case event naming (cross-cutting)
**Source:** `src/scripts/chat.ts:379-388` + call sites 520, 700, 734, 742, 845
**Apply to:** All new Umami events in Phase 15
**Precedent:** `chat_open`, `message_sent`, `chip_click`, `chat_error` -- snake_case, underscore-separated.
**Phase 15 conformance:** `chat_truncated` (D-14), `outbound_click` (D-10), `resume_download` (D-09), `scroll_depth` (D-06). All match.

### Content-free CustomEvent payload (Phase 7 D-36)
**Source:** `src/scripts/chat.ts:379-388`
```ts
document.dispatchEvent(new CustomEvent("chat:analytics", {
  detail: { action, label, timestamp: Date.now() },
}));
```
**Apply to:** analytics.ts forwarder (preserves payload verbatim -- no PII enrichment); outbound classifier (D-12: hostname+pathname only, mailto stored as literal `"mailto"` not the email address).

### Optional-chaining for global sinks
**Source:** RESEARCH.md §1.4 (industry-standard Umami pattern)
**Apply to:** Every `window.umami?.track(…)` call in analytics.ts. Silent no-op if Umami script hasn't loaded (defer window of 15-30ms); no thrown errors.

### Module-level initialization guard
**Source:** `src/scripts/chat.ts:124-128` + `chat.ts:466` (`panel.dataset.chatBound === "true"`)
**Apply to:** analytics.ts -- prevent duplicate chat:analytics/click/IntersectionObserver listener registration across astro:page-load re-fires:
```ts
let analyticsInitialized = false;
function initAnalytics() {
  if (analyticsInitialized) return;
  analyticsInitialized = true;
  // … register listeners
}
```

### Bootstrap on astro:page-load + DOMContentLoaded
**Source:** RESEARCH.md §2.3; chat.ts uses `astro:page-load` via ChatWidget.astro import
**Apply to:** analytics.ts bootstrap:
```ts
document.addEventListener("astro:page-load", initAnalytics);
if (document.readyState !== "loading") initAnalytics();
else document.addEventListener("DOMContentLoaded", initAnalytics);
```

### Exported pure helpers for testing
**Source:** `src/scripts/chat.ts:45` (`export function renderMarkdown`) + `createCopyButton` (imported in chat-copy-button.test.ts:3)
**Apply to:** analytics.ts exports `classifyOutbound` and `handleChatAnalytics`; chat.ts exports `streamChat` (new for Phase 15 sse-truncation.test.ts).

### Test env header: `// @vitest-environment jsdom`
**Source:** `tests/client/chat-copy-button.test.ts:1`, `tests/client/markdown.test.ts:1`
**Apply to:** All Phase 15 client tests (analytics.test.ts, sse-truncation.test.ts). MANDATORY -- vitest.config.ts line 6 sets global environment to `node`.

### readFileSync source-text test pattern
**Source:** `tests/client/chat-widget-header.test.ts:1-23`
**Apply to:** `tests/build/umami-tag-present.test.ts`. Uses `process.cwd()` not `__dirname`. No `// @vitest-environment jsdom` header needed (pure string assertion in node).

---

## No Analog Found

No files in Phase 15 lack an analog. The one weak point -- `tests/build/umami-tag-present.test.ts` -- is flagged above (§File Classification row 4) with a strong **recommendation against** creating a net-new `dist/` read pattern; the existing chat-widget-header.test.ts source-text pattern covers the required invariants with zero new infrastructure.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| -- | -- | -- | All 7 Phase 15 files have a concrete in-codebase analog. |

## Metadata

**Analog search scope:**
- `src/scripts/` (plain-TS client scripts -- 1 existing file: `chat.ts`)
- `src/layouts/` (1 file: `BaseLayout.astro`)
- `src/components/` (all -- specifically JsonLd.astro, MobileMenu.astro, ChatWidget.astro, ContactSection.astro, Header.astro, Footer.astro, NextProject.astro for `aria-hidden` / `is:inline` patterns)
- `src/pages/` (all -- specifically `projects/[id].astro` + `api/chat.ts` for server-side byte-identical confirmation)
- `tests/client/` (8 files -- chat-copy-button, markdown, chat-widget-header, focus-visible, contact-data, about-data, contrast, reduced-motion)
- `tests/api/` (4 files -- chat.test.ts for ReadableStream harness)
- `tests/build/` (1 file -- chat-context-integrity.test.ts, JSON-read pattern, not directly applicable but confirmed no dist/ precedent)
- `vitest.config.ts` (for environment semantics)
- `src/data/contact.ts` (for hostname single-source truth)

**Files scanned:** ~35 source + test files read or grepped. Stopped after 5 strong pattern matches per file were identified.

**Pattern extraction date:** 2026-04-23

**Unicode note:** This file was sanitized to contain no U+2028 / U+2029 line/paragraph separators; the JsonLd.astro code excerpt above displays `[U+2028]` / `[U+2029]` as escape sequences even though the actual source uses the literal chars inside the regex source. Pre-execution: agents reading this PATTERNS.md should consult `src/components/JsonLd.astro` directly to confirm the literal bytes.

**Key findings for planner:**
1. `src/scripts/chat.ts` is the **only** existing plain-TS client script -- `analytics.ts` has exactly one analog, and it is authoritative. Mirror it closely.
2. `src/components/JsonLd.astro` is the **only** existing `<script is:inline>` usage -- it IS the precedent for the Umami tag shape.
3. `tests/client/chat-copy-button.test.ts` + `tests/client/markdown.test.ts` are the canonical jsdom-unit-test analogs (same export-for-testing idiom); `tests/api/chat.test.ts:109-157` is the canonical ReadableStream harness.
4. **No `dist/` read test precedent exists** -- recommend the source-text pattern (chat-widget-header.test.ts) for the Umami build-assertion test.
5. The 4-line additive SSE diff in `chat.ts` is self-analog (the existing parse loop IS the pattern to extend); the companion `export` keyword addition on `streamChat` mirrors the established `renderMarkdown` / `createCopyButton` export-for-test idiom.
6. `aria-hidden="true"` invisible structural `<div>`s are well-precedented in the codebase (MobileMenu backdrop, NextProject arrow, Footer/ContactSection separators, and the in-file `project-link-sep` on [id].astro:53 itself) -- scroll-sentinels are a natural fit.
