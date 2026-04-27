# Phase 16: Motion Layer - Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** 17 (8 new, 9 modified)
**Analogs found:** 17 / 17 (every file has an in-codebase precedent)

> **Note for the planner.** Phase 16 is unusual: it touches mostly *modify-in-place* surfaces (chat.ts, scroll-depth.ts, WorkRow.astro, global.css, BaseLayout.astro, MASTER.md, reduced-motion.test.ts), so for several files **the analog IS the file itself**. In those rows the patterns to copy are the existing in-file conventions plus the surrounding-file idioms (init guard, scoped `<style>`, `@media (prefers-reduced-motion: ...)` block shape). For new files, the analogs are concrete sibling files in the same directory.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `design-system/MOTION.md` (NEW) | design-system doc | file-I/O (markdown spec) | `design-system/MASTER.md` | exact — same doc class, same project, same lock-style structure |
| `design-system/MASTER.md` §6 (MODIFIED, stub-rewrite only) | design-system doc | file-I/O | `design-system/MASTER.md` itself | exact — modify in place |
| `src/scripts/lib/observer.ts` (NEW) | utility / factory | request-response (callback) | `src/scripts/scroll-depth.ts` (its `new IntersectionObserver(cb, opts)` block + `observe()` loop) | role-match (utility extracted from analog); the analog is being refactored to consume the new factory |
| `src/scripts/motion.ts` (NEW) | client script | event-driven (IO-fire + DOM mutate) | `src/scripts/scroll-depth.ts` | exact — same role (client TS module), same data flow (IO-driven side effects), same bootstrap shape |
| `src/scripts/scroll-depth.ts` (MODIFIED) | client script | event-driven | `src/scripts/scroll-depth.ts` itself | exact — refactor in place; **byte-equivalent behavior gate (D-19)** |
| `src/scripts/chat.ts:451–457, 525–528, 605–610` (MODIFIED) | client script | event-driven (lifecycle hooks) | `src/scripts/chat.ts` itself (the focus-trap setup/teardown pattern at 585 / 600–604 — analog for "do X before focus-trap, undo X after focus restoration") | exact — modify in place; pattern lives in same function |
| `src/styles/global.css` (MODIFIED — adds @view-transition + pulse + panel scale-in + .word + reveal classes) | stylesheet | file-I/O (build asset) | `src/styles/global.css:260–280` (typing-bounce keyframes) for new `@keyframes`; `src/styles/global.css:74–81, 126–133` for paired no-preference / reduce blocks | exact — same file, same conventions |
| `src/styles/global.css:74–77, 126–133` (EXTENDED in place) | stylesheet | file-I/O | self | exact |
| `src/components/primitives/WorkRow.astro:81–98` (MODIFIED) | primitive component | request-response (SSG render + scoped CSS) | `WorkRow.astro` itself, lines 81–85 (`.work-arrow`) and 95–98 (hover/focus selector) | exact — upgrade in place |
| `src/layouts/BaseLayout.astro:118–121` (MODIFIED — add motion.ts import) | layout | request-response (SSG) | `BaseLayout.astro` itself, the existing `<script>` block at 118–121 importing `analytics.ts` + `scroll-depth.ts` | exact — append a third import line |
| `tests/build/motion-css-rules.test.ts` (NEW) | test (source-text invariant) | file-I/O (`readFileSync` + regex) | `tests/client/reduced-motion.test.ts` (file-I/O against `src/styles/global.css` with multiline regex assertions) | exact — same `readFileSync` shape, same multiline regex grammar |
| `tests/build/work-arrow-motion.test.ts` (NEW) | test (source-text invariant) | file-I/O | `tests/client/chat-widget-header.test.ts` (`readFileSync` against an `.astro` file with `.toContain` + regex) | exact-role |
| `tests/build/motion-doc.test.ts` (NEW) | test (source-text invariant) | file-I/O (markdown grep) | `tests/build/chat-context-integrity.test.ts` (parses a generated artifact and asserts shape) | role-match — same vitest+readFileSync+invariant shape, but reads markdown instead of JSON |
| `tests/client/observer-factory.test.ts` (NEW) | test (jsdom unit, IO contract) | event-driven (mock IntersectionObserver) | `tests/client/scroll-depth.test.ts` | exact — same IntersectionObserver class-stub harness, same `latestObserverCallback` capture pattern |
| `tests/client/motion.test.ts` (NEW) | test (jsdom DOM mutation behavior) | event-driven | `tests/client/scroll-depth.test.ts` (IO stub + entry synthesis); `tests/client/chat-copy-button.test.ts` (DOM mutation assertions on jsdom) | exact — same harness, same module-import pattern |
| `tests/client/chat-pulse-coordination.test.ts` (NEW) | test (jsdom lifecycle ordering) | event-driven (open/close ordering) | `tests/client/analytics.test.ts` (importing chat surfaces and dispatching events) + `tests/client/scroll-depth.test.ts` IO stub block | role-match (jsdom client test); ordering-assertion is novel to this phase |
| `tests/client/reduced-motion.test.ts` (MODIFIED — extend assertions) | test (source-text invariant) | file-I/O | itself | exact — extend in place |

---

## Pattern Assignments

---

### `src/scripts/lib/observer.ts` (NEW — utility / factory, ~20–30 LOC)

**Analog:** `src/scripts/scroll-depth.ts` (the `new IntersectionObserver(...)` block at lines 47–56 — the factory is literally extracted from this site)

**Role fit:** Both live under `src/scripts/`, both are TypeScript-strict, both wrap `new IntersectionObserver(callback, options)` + iterate `entries`. The factory is the de-duplicated kernel of `initScrollDepth()` lines 41–56 plus the `motion.ts` reveal logic (D-17 / D-18 / D-19).

**Imports pattern** — `scroll-depth.ts:1-6` (header comment style + `export {}` for module scope):
```ts
// Scroll-depth client-side tracker — Phase 15
// Handles: IntersectionObserver on .scroll-sentinel elements; fires
// scroll_depth events at 25/50/75/100% of <article> height on project
// detail pages only (D-05 scope). Observer construction is gated by
// sentinel presence in the DOM — no-op on non-project routes.
// See 15-CONTEXT.md D-05..D-08 and 15-RESEARCH.md §2.
```
**For observer.ts:** header comment names Phase 16 D-17 ("shared IO factory; consumed by scroll-depth.ts and motion.ts"). No `export {}` line — the file exports a named function so the module-marker is implicit.

**Core IO-construction pattern** — `scroll-depth.ts:47-56` (the literal block being factored out):
```ts
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      handleScrollEntry(entry, observer);
    }
  },
  { threshold: 0, rootMargin: "0px" }
);

sentinels.forEach((el) => observer.observe(el));
```
**For observer.ts:** export a function `makeRevealObserver({ selector, rootMargin, threshold, onIntersect }: { selector: string; rootMargin: string; threshold: number; onIntersect: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void }): IntersectionObserver | null` (final naming Claude's discretion per D-17). Internally: `document.querySelectorAll<HTMLElement>(selector)` -> early return null if length 0 -> instantiate IO over `(entries) => { for (const e of entries) onIntersect(e, observer); }` -> `forEach observer.observe(el)` -> return the observer. Keeps the analog's "no-op when no targets in DOM" gate (scroll-depth.ts:42).

**Test seam pattern** — `scroll-depth.ts:20-35` (named export `handleScrollEntry` for jsdom unit test):
```ts
// Handle a single observer entry: fire umami scroll_depth event and unobserve target.
// Exported for unit testing — driven synthetically with mock IntersectionObserverEntry.
export function handleScrollEntry(
  entry: IntersectionObserverEntry,
  observer: IntersectionObserver
): void { ... }
```
**For observer.ts:** export `makeRevealObserver` as the test seam (no `handle*` helper — the `onIntersect` callback IS the seam; tests pass a vi.fn()). Mirrors the test pattern in `tests/client/scroll-depth.test.ts:7-9` (capture latest callback, drive synthetically).

**Type-safety pattern (no `@types/` install needed)** — RESEARCH.md notes lib.dom.d.ts has `IntersectionObserver`, `IntersectionObserverEntry`, `IntersectionObserverInit`. Use those directly; do not `import type` from anywhere.

---

### `src/scripts/motion.ts` (NEW — client script, event-driven IO + DOM mutation)

**Analog:** `src/scripts/scroll-depth.ts` (full file)

**Role fit:** Both are TypeScript-strict client modules in `src/scripts/`, both initialize once on `astro:page-load` + `DOMContentLoaded`, both consume IntersectionObserver, both gate observer construction on DOM presence. Motion.ts is the *nearly-twin* of scroll-depth.ts with three deltas: (a) consumes `lib/observer.ts` factory; (b) adds DOM mutation (add `.reveal-on` class, span-wrap headings); (c) reads `matchMedia('(prefers-reduced-motion: reduce)').matches` early-return.

**Imports pattern** — `scroll-depth.ts:1-16`:
```ts
// Scroll-depth client-side tracker — Phase 15
// Handles: ...
declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void; };
  }
}
export {};
```
**For motion.ts:** header comment names Phase 16 D-17/D-18 (scroll-reveal + word-stagger consumer; one-shot via `unobserve`). Drop the `umami` global augmentation. Keep `export {};` to enforce module scope. Note that **WR-01** (the bootstrap-level guard pattern at `scroll-depth.ts:67-76`) is REQUIRED — copy verbatim.

**Reduced-motion early-return pattern** — D-25 / RESEARCH §3 Pattern 3 / Pitfall 3 — *no in-file analog exists yet*; this is novel. Use:
```ts
function shouldReduceMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```
Called at the top of `initMotion()` before any observer construction or span-wrap. On `reduce`: return immediately, no DOM mutation, no observer attached (D-25 — elements render at resting state via the CSS `@media (prefers-reduced-motion: no-preference) { ... }` gate that surrounds reveal init/active classes in `global.css`).

**One-shot reveal callback** — `scroll-depth.ts:20-35` (the `handleScrollEntry` body that calls `observer.unobserve(entry.target)` after firing):
```ts
if (!entry.isIntersecting) return;
// ... do the work ...
observer.unobserve(entry.target);
```
**For motion.ts onIntersect:** `if (!entry.isIntersecting) return;` -> `entry.target.classList.add("reveal-on")` -> if `entry.target.matches(".h1-section")` and `!entry.target.hasAttribute("data-stagger-split")`: split textContent and replace with `<span class="word" style="--i: N">word</span>` per word, then `entry.target.setAttribute("data-stagger-split", "true")` (D-13 idempotency guard) -> `observer.unobserve(entry.target)` (D-07 one-shot).

**Span-wrap idempotency pattern (D-13)** — *no in-file analog*; this is novel. Implementation note for the planner:
```ts
function wrapWordsInPlace(el: HTMLElement): void {
  if (el.dataset.staggerSplit === "true") return;
  const text = (el.textContent ?? "").trim();
  if (!text) return;
  const words = text.split(/\s+/);
  el.textContent = "";
  words.forEach((word, i) => {
    const span = document.createElement("span");
    span.className = "word";
    span.style.setProperty("--i", String(i));
    span.textContent = word;
    el.appendChild(span);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
  el.dataset.staggerSplit = "true";
}
```
**XSS note:** uses `textContent` only — no innerHTML, no template literals into HTML. Mirrors `chat.ts:560` pattern (`el.textContent = msg.content; // textContent -- XSS safe`).

**Bootstrap pattern (verbatim copy)** — `scroll-depth.ts:67-76`:
```ts
// WR-01: bootstrap-level guard prevents document listener pile-up if this
// module is re-evaluated across Astro view transitions. The internal
// scrollDepthInitialized guard already prevents duplicate observer creation,
// so this is purely a slow-GC hygiene fix for long sessions.
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
**For motion.ts:** copy verbatim, rename `scrollDepthBootstrapped` -> `motionBootstrapped`, `initScrollDepth` -> `initMotion`. The dual-listener pattern is required because `<ClientRouter />` is prohibited (RESEARCH §1 finding #2 — `astro:page-load` does not fire on its own; `DOMContentLoaded` is the actual init hook today).

**Internal init guard** — `scroll-depth.ts:37-43`:
```ts
let scrollDepthInitialized = false;

export function initScrollDepth(): void {
  if (scrollDepthInitialized) return;
  const sentinels = document.querySelectorAll<HTMLElement>(".scroll-sentinel");
  if (sentinels.length === 0) return; // Not on a /projects/[id] route (D-05 scope gate)
  scrollDepthInitialized = true;
```
**For motion.ts:** `let motionInitialized = false;` at module scope. `initMotion()` early-returns on guard. **Selector list (D-04)**: `.h1-section, .work-row, .project-prose p, .about-prose p` — the precise selector for "project detail prose blocks" and "About page paragraphs" is Claude's discretion within D-04 scope; the planner should choose a class hook compatible with existing primitive output (verify against the rendered DOM in `src/pages/projects/[id].astro` and `src/pages/about.astro`). On `reduce`, return after the matchMedia check before constructing the observer.

---

### `src/scripts/scroll-depth.ts` (MODIFIED — refactor to consume factory; **byte-equivalent gate D-19**)

**Analog:** `src/scripts/scroll-depth.ts` itself (lines 47–56)

**Critical constraint:** `tests/client/scroll-depth.test.ts` and `tests/client/analytics.test.ts` MUST stay green with zero source edits to those test files. The exported `handleScrollEntry` signature stays identical — only the internal `initScrollDepth` body changes.

**Refactor target** — replace lines 47–56 (the `new IntersectionObserver(...)` block + `sentinels.forEach(observe)`) with a single call to `makeRevealObserver({ selector: ".scroll-sentinel", rootMargin: "0px", threshold: 0, onIntersect: handleScrollEntry })`. The `if (sentinels.length === 0) return;` gate at line 42 is absorbed into the factory's null return, so the in-function gate becomes a check on the factory return (`if (!observer) return;`).

**What MUST NOT change:**
- The exported `handleScrollEntry(entry, observer)` signature (`tests/client/scroll-depth.test.ts:60` calls it directly)
- The `umami?.track("scroll_depth", { percent, slug })` call shape (`tests/client/scroll-depth.test.ts:64-67`)
- The `observer.unobserve(entry.target)` call inside `handleScrollEntry` (`tests/client/scroll-depth.test.ts:106-111`)
- The DEV `console.log` line (no test asserts it but it's part of the existing observable surface)
- The `WR-01` bootstrap block at lines 67–76 — copy preserved verbatim (analog for motion.ts)
- The internal `scrollDepthInitialized` guard

**Verification gate:** run `pnpm vitest run tests/client/scroll-depth.test.ts` after refactor and confirm 7/7 pass with zero edits to the test file.

---

### `src/scripts/chat.ts:451–457, 521–528, 605–610` (MODIFIED — replace pulse stubs + add ordering)

**Analog:** `src/scripts/chat.ts` itself — specifically:
- Lines 451–457 (the no-op `startPulse`/`stopPulse` that get replaced with attribute toggling)
- Lines 525–528 (current `openPanel` body — `panelOpen = true; stopPulse(); trackChatEvent(...);` order)
- Lines 585 (current `cleanupFocusTrap = setupFocusTrap($panel, closePanel)` — the focus-trap activation site)
- Lines 600–610 (current `closePanel` body — the `cleanupFocusTrap()` -> `animatePanelClose().then(() => $bubble.focus(); startPulse(...))` chain)

**Replacement for `startPulse`/`stopPulse` (lines 451–457):**
```ts
async function startPulse(bubble: HTMLElement): Promise<void> {
  // Phase 16 MOTN-04: pure-CSS pulse on #chat-bubble. Removing data-pulse-paused
  // re-engages the @keyframes loop. CSS handles :hover, :focus-visible, and
  // (prefers-reduced-motion: reduce) gating; this attribute covers panel-open.
  bubble.removeAttribute("data-pulse-paused");
}

function stopPulse(bubble?: HTMLElement): void {
  // Phase 16 MOTN-04 / D-15: pause the CSS pulse loop while panel is open.
  if (bubble) bubble.setAttribute("data-pulse-paused", "");
}
```
Note: the existing `stopPulse()` is called in `openPanel()` at line 527 with **no argument** (current signature). The new shape needs the bubble. Two options: (a) thread `$bubble` through (matches current `startPulse($bubble)` call shape at 521 / 608); (b) close over the bubble in `initChat`. Option (a) preserves the analog exactly — change `stopPulse();` to `stopPulse($bubble);` at the two call sites (527, and similarly inside the open path) — minimal-diff.

**Critical ordering: openPanel (current lines 525–528 + 585):**
```ts
function openPanel(): void {
  panelOpen = true;
  stopPulse();              // CURRENT: line 527
  trackChatEvent("chat_open");
  // ... existing setAttribute / display toggle / icon swap / mobile class ...
  // ... existing chatLog.length===0 history-restore block ...
  cleanupFocusTrap = setupFocusTrap($panel, closePanel);   // CURRENT: line 585
  animatePanelOpen($panel).then(() => { $input.focus(); });
}
```
**Required ordering change (D-15 / UI-SPEC §D-26 chat regression gate):** `stopPulse($bubble)` already happens at line 527 — **before** focus-trap setup at line 585. That ordering is correct AS-IS — preserve it. The ordering rule "pause attribute toggle BEFORE focus-trap activation" is already satisfied by the current line layout. Confirm with a regression test that the attribute is set before `setupFocusTrap` is called.

**Critical ordering: closePanel (current lines 600–610):**
```ts
function closePanel(): void {
  panelOpen = false;
  // ... existing aria-expanded / aria-label / icon swap / mobile-class removal ...
  if (cleanupFocusTrap) {
    cleanupFocusTrap();          // CURRENT: line 602 — focus-trap teardown
    cleanupFocusTrap = null;
  }
  animatePanelClose($panel).then(() => {
    $bubble.focus();              // CURRENT: line 607 — focus restoration
    startPulse($bubble);          // CURRENT: line 608 — resume pulse
  });
}
```
**Required ordering (D-15):** resume pulse **AFTER** focus restoration. The current `startPulse` is correctly inside the `.then()` after `$bubble.focus()` — preserve. After the rewrite, the `startPulse` body removes `data-pulse-paused`, so the resume happens precisely after `$bubble.focus()` returns.

**Test for ordering:** the new `tests/client/chat-pulse-coordination.test.ts` should verify (a) `data-pulse-paused` attribute is set on `#chat-bubble` synchronously inside `openPanel` BEFORE `setupFocusTrap` records its `panel.addEventListener("keydown", ...)` (use a vi.spyOn on `addEventListener`); (b) attribute is removed AFTER `$bubble.focus()` is observed. This mirrors the `tests/client/analytics.test.ts:39-46` pattern of dispatching synthetic events and asserting handler shape.

**D-26 chat regression gate:** any change to chat.ts requires the Phase 7 regression battery (XSS sanitization, exact-origin CORS, 5/60s rate limit, 30s AbortController timeout, focus trap re-query on every Tab keypress, localStorage persistence, SSE streaming `async:false`, markdown via DOMPurify, clipboard idempotency). The pulse change touches NONE of these surfaces — but the gate still runs; confirmed by running the existing `tests/api/chat.test.ts`, `tests/api/security.test.ts`, `tests/api/prompt-injection.test.ts`, `tests/client/markdown.test.ts`, `tests/client/chat-copy-button.test.ts`, `tests/client/sse-truncation.test.ts`, and `tests/client/focus-visible.test.ts` post-edit.

---

### `src/styles/global.css` (MODIFIED — large-surface CSS additions)

**Analog:** `src/styles/global.css` itself — three precedent blocks:

**1. `@keyframes` shape — analog at lines 260–263 (typing-bounce):**
```css
@keyframes typing-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
```
**For Phase 16:** mirror the structure for new keyframes:
```css
/* MOTN-04 (D-14): chat bubble idle pulse — combined ring + scale */
@keyframes chat-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.4); transform: scale(1.0); }
  50%  { box-shadow: 0 0 0 16px rgba(230, 57, 70, 0); transform: scale(1.02); }
  100% { box-shadow: 0 0 0 0 rgba(230, 57, 70, 0); transform: scale(1.0); }
}
```
Same structure used for `@keyframes view-transition-fade-out` / `view-transition-fade-in` (MOTN-01) — opacity 1 -> 0 and 0 -> 1 with `to`/`from` syntax, 200ms ease-out applied via the `::view-transition-old(root)` / `::view-transition-new(root)` `animation:` declaration. Same structure used for `@keyframes reveal-rise` (MOTN-02 — opacity 0 + translateY 12px -> opacity 1 + translateY 0) and `@keyframes word-rise` (MOTN-07 — opacity 0 + translateY 8px -> opacity 1 + translateY 0).

**2. Paired no-preference / reduce gate — analogs at lines 74–81 and 126–133:**
```css
/* WR-02: Honor prefers-reduced-motion for programmatic smooth scrolls. */
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}
```
and:
```css
.nav-link-hover {
  background-image: linear-gradient(currentColor, currentColor);
  /* ... */
  transition: background-size 300ms ease, color 200ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .nav-link-hover { transition: color 200ms ease; }
  .nav-link-hover:hover { background-size: 0% 1px; }
}
```
**For Phase 16 (MOTN-08 / D-23 / D-24):**
- Wrap MOTN-02 reveal init/active rules in `@media (prefers-reduced-motion: no-preference) { .reveal-init { opacity: 0; transform: translateY(12px); } .reveal-init.reveal-on { animation: reveal-rise 300ms ease-out forwards; } }` (analog: the no-preference block at 77–81)
- Wrap MOTN-07 `.word` styles + animation in the same no-preference block (`.word { display: inline-block; opacity: 0; transform: translateY(8px); animation: word-rise 250ms ease-out forwards; animation-delay: calc(var(--i) * 60ms); }`)
- Wrap MOTN-05 chat panel scale-in in no-preference (transform-origin bottom-right; transform scale(0.96) -> scale(1.0); opacity 0 -> 1; 180ms ease-out)
- For MOTN-04 chat pulse: declare `#chat-bubble { animation: chat-pulse 2500ms ease-in-out infinite; }` UNCONDITIONALLY, then pair with `@media (prefers-reduced-motion: reduce) { #chat-bubble { animation: none; } }` — exact MOTN-08 / D-24 paired-override pattern, mirroring the `.nav-link-hover` structure at 119–133.
- Pulse-pause selectors (D-15): `#chat-bubble:hover, #chat-bubble:focus-visible, #chat-bubble[data-pulse-paused] { animation-play-state: paused; }` — placed adjacent to the unconditional pulse rule, INSIDE the no-preference wrap is unnecessary because pause-state on a non-running animation is a no-op.
- For MOTN-01 view-transitions: `@view-transition { navigation: auto; }` UNCONDITIONAL at-rule + `::view-transition-old(root) { animation: view-transition-fade-out 200ms ease-out forwards; } ::view-transition-new(root) { animation: view-transition-fade-in 200ms ease-out forwards; }` wrapped in `@media (prefers-reduced-motion: no-preference) { ... }` (D-23). Wrap rationale: per MOTN-08 entrance animations live inside no-preference; the bare `@view-transition` at-rule itself stays unconditional (browsers respect prefers-reduced-motion natively per CSS WG draft, but the wrapping override is belt-and-suspenders + matches the in-file convention).

**3. WR-02 scroll-behavior gate (lines 74–77) — DO NOT REDEFINE.** Existing block stays as-is; `tests/client/reduced-motion.test.ts:30-46` lock its presence and uniqueness. Phase 16 adds NEW `@media (prefers-reduced-motion: no-preference)` blocks elsewhere in the file but never modifies the existing one.

**Already-live block — DO NOT TOUCH:** lines 260–280 (`@keyframes typing-bounce` + `.typing-dot` rules). MOTN-06 ships zero-cost. The optional `@media (prefers-reduced-motion: reduce) { .typing-dot { animation: none; } }` extension noted in UI-SPEC is at Claude's discretion — researcher recommends adding it for parity, but it's not blocking.

---

### `src/components/primitives/WorkRow.astro:81–98` (MODIFIED — arrow upgrade in place)

**Analog:** `WorkRow.astro` itself, lines 81–85 (current `.work-arrow`) and 95–98 (current hover/focus selector)

**Current state (lines 81–98):**
```css
.work-arrow {
  color: var(--accent);
  opacity: 0;
  transition: opacity 120ms ease;
}

.work-row:hover .work-title,
.work-row:focus-visible .work-title {
  text-decoration: underline;
  text-decoration-color: var(--accent);
  text-decoration-thickness: 1.5px;
  text-underline-offset: 4px;
}

.work-row:hover .work-arrow,
.work-row:focus-visible .work-arrow {
  opacity: 1;
}
```

**Phase 16 upgrade (MOTN-03):**
```css
.work-arrow {
  color: var(--accent);
  opacity: 0;
  transform: translateX(0);
  transition: opacity 120ms ease, transform 180ms ease-out;
}

.work-row:hover .work-arrow,
.work-row:focus-visible .work-arrow {
  opacity: 1;
  transform: translateX(4px);
}
```
**Reduced-motion contract (UI-SPEC MOTN-03 row):** with `reduce`, the arrow stays opacity 0 (hidden); the accent title underline (color-only state change, sub-200ms) still appears as the affordance. **No `@media (prefers-reduced-motion: reduce)` block needed inside the scoped `<style>` block** — the `transition: opacity 120ms ease, transform 180ms ease-out` is allowed under MASTER.md §6.2 (sub-200ms state transitions allowed unconditionally). However, **adding an explicit reduce override is safer**:
```css
@media (prefers-reduced-motion: reduce) {
  .work-arrow { transition: none; transform: translateX(0); opacity: 0; }
  .work-row:hover .work-arrow,
  .work-row:focus-visible .work-arrow { transform: translateX(0); opacity: 0; }
}
```
This matches UI-SPEC's "with `reduce`, the arrow stays opacity 0" behavior exactly. Planner recommendation: include the explicit reduce override — small, safe, mirrors `nav-link-hover` reduce-override pattern at `global.css:126-133`.

**File-discipline rules (from `WorkRow.astro:1-17` header comment):**
- Per D-02: primitive lives in `src/components/primitives/`
- Per D-03: NO Tailwind utilities inside primitive markup — keep CSS in scoped `<style>` block
- Per D-14: layout scoped here (don't move to `global.css`)

---

### `src/layouts/BaseLayout.astro:118–121` (MODIFIED — append motion.ts import)

**Analog:** `BaseLayout.astro` itself, lines 118–121 (the existing single processed `<script>` block):
```astro
{/* Phase 15 Plan 02 — Analytics forwarder + scroll-depth observer wiring. */}
{/* Single processed <script> block (NOT is:inline) loads both client modules: */}
<script>
  import "../scripts/analytics.ts";
  import "../scripts/scroll-depth.ts";
</script>
```

**Phase 16 modification:** append `import "../scripts/motion.ts";` as a third line inside the same `<script>` block. Update the comment to name Phase 16 ("Phase 15/16 — Analytics + scroll-depth + motion observer wiring."). Single block, NOT `is:inline` (per Phase 15 D-12 + analytics tag block at line 93–95 which IS the only `is:inline` and stays scoped to umami). Order: motion.ts goes AFTER analytics.ts and scroll-depth.ts so analytics is registered first (motion.ts construction does not depend on analytics, but the order is documentation-friendly).

**Note on Astro 6 Fonts API:** the `<Font cssVariable="--font-display-src" />` lines at 96–98 sit in `<head>` and are unrelated to motion. Do not edit them.

---

### `design-system/MOTION.md` (NEW — v1.2 motion canonical doc)

**Analog:** `design-system/MASTER.md` (the entire file)

**Role fit:** Both are markdown design-system specs in `design-system/`, both have an opening lock contract, both use `## N. Title` numbered sections, both use `| col | col |` tables for token/value pairs, both end with a Changelog. MOTION.md inherits the structural conventions of MASTER.md.

**Header pattern (MASTER.md:1-9):**
```md
# Jack Cutrara Portfolio — Design System (MASTER.md)

> **Milestone:** v1.1 Editorial Redesign
> **Phase:** 8 (Foundation)
> **Status:** Locked at Phase 8 sign-off — read-only for Phases 9, 10, 11
> **Source visual reference:** `mockup.html` at repo root (transcribed below — do not re-derive)

---
```
**For MOTION.md:**
```md
# Jack Cutrara Portfolio — Motion System (MOTION.md)

> **Milestone:** v1.2 Motion Layer
> **Phase:** 16 (Motion)
> **Status:** Locked at Phase 16 sign-off — supersedes MASTER.md §6 (v1.1 motion lock)
> **Authoritative for:** all v1.2+ motion decisions. MASTER.md §2-§5, §7-§10 still bind for non-motion concerns.

---
```

**Section structure (mirror MASTER.md §1-§11):**
1. Overview — what MOTION.md is, what it supersedes, voice = third-person spec
2. Property whitelist (UI-SPEC §Motion Contract / Property whitelist table)
3. Duration bands (UI-SPEC table — Snap 120 / Tap 180 / Reveal 250–350 / View-transition 200 / Loop-fast 600 / Loop-slow 2500)
4. Easing defaults (UI-SPEC table — ease-out / ease-in-out / ease)
5. Animation specs — table with all 7 (MOTN-01 .. MOTN-07) per UI-SPEC
6. Reduced-motion contract (D-23 / D-24 / D-25 — entrance-animations-in-no-preference rule + paired-reduce-override rule + final-state rule)
7. File ownership map (UI-SPEC table — file -> role -> NEW/MODIFIED status)
8. Lighthouse gate (MOTN-10 — 99/95/100/100, TBT ≤ 150, CLS ≤ 0.01)
9. Anti-patterns (no `cubic-bezier` custom curves, no `will-change` sticking, no layout-triggering properties, no `<ClientRouter />`, no GSAP — all derived from UI-SPEC §Motion Contract + MASTER.md §8 carry-over)
10. Changelog (v1.2-init: Phase 16 sign-off date)

**Voice rule (MEMORY feedback `feedback_no_rtk_prefix.md`-aligned, project_voice_split.md):** MOTION.md is technical docs (third-person spec voice) — "Pulse animates the bubble at 2500ms ease-in-out infinite." NOT user-facing prose; the voice-split rule (site = first person, chat = third person) does not apply to design-system docs.

**Length target:** ~150–250 lines. MASTER.md is 815+ lines and covers a much larger surface; MOTION.md is single-axis (motion only), so it should be tighter. Length is Claude's discretion within the section list above.

---

### `design-system/MASTER.md` §6 (MODIFIED — replace with 3-line stub)

**Analog:** `design-system/MASTER.md` itself, current §6 at lines 662–693 (the full "pragmatic motion line" section)

**Current state:** §6 spans lines 662–693, 31 lines, contains §6.1 (dead — removed in Phase 8), §6.2 (allowed to survive), §6.3 (prefers-reduced-motion), §6.4 (why this matters).

**Phase 16 replacement (D-02):** replace lines 662–693 with:
```md
## 6. Motion (superseded by v1.2)

> **v1.1 motion lock superseded by v1.2.** See [`design-system/MOTION.md`](MOTION.md) for the v1.2 motion canonical doc — property whitelist, duration bands, easing defaults, per-animation specs, and the reduced-motion contract.

The §6.1 anti-pattern list (no GSAP, no `<ClientRouter />`, no canvas hero, no scroll-trigger animations) remains binding except where MOTION.md explicitly carves out an exception (cross-document `@view-transition` in MOTN-01 supersedes §6.1's `<ClientRouter />` ban for that specific surface).
```

**What MUST stay intact:** lines 1–661 (everything before §6), lines 694+ (§7 Accent usage, §8 Anti-patterns, §9 Chat Widget Token Map, §10 Chat Bubble Exception, §11 Changelog). The `## 11. Changelog` should gain an entry: `v1.2 / Phase 16: §6 replaced with stub pointer to MOTION.md`.

**Anti-pattern §8 has overlap that needs reconciling.** Current §8 lines 747 contains: `**No view transition `::view-transition-*` keyframes** — they were removed with `<ClientRouter />`. Do not re-add CSS for view transitions in any form.` This conflicts with MOTN-01 (which DOES add `::view-transition-old(root)` / `::view-transition-new(root)` keyframes). The §8 entry must be amended in this phase to read `... except as authorized by MOTION.md (MOTN-01: cross-document fade only — no morph, no named-element)`. This is part of D-02's scope per the §6 stub — the planner should plan the §8 line-edit alongside the §6 rewrite. Same for the GSAP entry at §8 line 736 (no change — GSAP stays banned in v1.2).

---

### `tests/build/motion-css-rules.test.ts` (NEW — source-text invariants for global.css)

**Analog:** `tests/client/reduced-motion.test.ts`

**Role fit:** Both are vitest tests that `readFileSync('src/styles/global.css', 'utf8')` and assert with multiline regex. Same `projectRoot = resolve(__dirname, "../..")` pattern, same describe-block-per-rule organization.

**Imports pattern (lines 1-3 of analog):**
```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
```

**File-load pattern (lines 23–27 of analog):**
```ts
const projectRoot = resolve(__dirname, "../..");
const css = readFileSync(
  resolve(projectRoot, "src/styles/global.css"),
  "utf8",
);
```

**Multiline regex assertion shape (lines 30–36 of analog):**
```ts
it("wraps `scroll-behavior: smooth` inside `@media (prefers-reduced-motion: no-preference)`", () => {
  const pattern =
    /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*{\s*html\s*{\s*scroll-behavior:\s*smooth;/;
  expect(css).toMatch(pattern);
});
```

**For motion-css-rules.test.ts — required assertions:**
- `@view-transition { navigation: auto; }` at-rule present (MOTN-01 / D-20)
- `::view-transition-old(root)` rule with 200ms ease-out animation (MOTN-01 / D-21)
- `::view-transition-new(root)` rule with 200ms ease-out animation (MOTN-01 / D-21)
- `@keyframes chat-pulse` (or chosen name) declared with 0% box-shadow `0 0 0 0 rgba(230, 57, 70, 0.4)` and 100% / 50% box-shadow with 16px expansion (MOTN-04 / D-14)
- `#chat-bubble` rule with `animation: chat-pulse 2500ms ease-in-out infinite;` (or equivalent — D-14)
- `@media (prefers-reduced-motion: reduce)` block containing `#chat-bubble { animation: none; }` (D-24 paired override)
- `#chat-bubble[data-pulse-paused]` selector with `animation-play-state: paused` (D-15)
- `@keyframes reveal-rise` declared with translateY 12px -> 0 (MOTN-02 / D-06)
- `@keyframes word-rise` declared with translateY 8px -> 0 (MOTN-07 / D-10)
- `.word` rule with `animation-delay: calc(var(--i) * 60ms)` (D-09)
- `.reveal-init` and `.reveal-on` classes inside no-preference block (MOTN-02 / D-23)
- `@keyframes typing-bounce` STILL present at lines ~260–263 (MOTN-06 zero-cost regression guard)
- The TWO existing reduced-motion blocks at original lines 74–77 and 126–133 still present (regression guard against accidental redefinition)

**Strip-and-verify uniqueness pattern (lines 38–45 of analog) — apply to:**
- `@view-transition { navigation: auto; }` should appear EXACTLY ONCE
- `@keyframes chat-pulse` should appear EXACTLY ONCE

---

### `tests/build/work-arrow-motion.test.ts` (NEW — source-text for WorkRow.astro)

**Analog:** `tests/client/chat-widget-header.test.ts`

**File-load pattern (lines 5–9 of analog):**
```ts
const widgetSource = readFileSync(
  join(process.cwd(), "src", "components", "chat", "ChatWidget.astro"),
  "utf8"
);
```
**For work-arrow-motion.test.ts:** `readFileSync(join(process.cwd(), "src", "components", "primitives", "WorkRow.astro"), "utf8")`.

**Assertion shape (lines 11-13 of analog):**
```ts
it("renders the renamed header `ASK ABOUT JACK` in the source", () => {
  expect(widgetSource).toContain("ASK ABOUT JACK");
});
```

**For work-arrow-motion.test.ts — required assertions:**
- `transition: opacity 120ms ease, transform 180ms ease-out` declared on `.work-arrow` (MOTN-03)
- `transform: translateX(4px)` declared inside `.work-row:hover .work-arrow, .work-row:focus-visible .work-arrow` (MOTN-03 / UI-SPEC)
- `@media (prefers-reduced-motion: reduce)` block inside the WorkRow `<style>` block resets transform to `translateX(0)` and opacity to `0` (UI-SPEC MOTN-03 row reduced-motion contract)
- The original `opacity: 0;` declaration on `.work-arrow` is preserved (regression guard — affordance must still hide-by-default)
- The original `color: var(--accent);` declaration is preserved
- The accent title underline rules at the existing hover/focus selector are preserved (MASTER.md §7.1 / line 87–93 of WorkRow.astro)

---

### `tests/build/motion-doc.test.ts` (NEW — MOTION.md / MASTER.md §6 / §8 invariants)

**Analog:** `tests/build/chat-context-integrity.test.ts` (vitest + readFileSync against a generated artifact + invariant assertions)

**Adaptation:** instead of importing `portfolio-context.json`, `readFileSync('design-system/MOTION.md')` and `readFileSync('design-system/MASTER.md')`.

**For motion-doc.test.ts — required assertions:**
- `design-system/MOTION.md` file exists and is readable (use `existsSync` + `readFileSync`)
- MOTION.md contains `## ` headers for property whitelist, duration bands, easing defaults, animation specs, reduced-motion contract sections (test by `.toMatch(/^## .*Property whitelist/m)`-style)
- MOTION.md mentions all 7 motion IDs: `MOTN-01` through `MOTN-07` (toContain assertions)
- MOTION.md mentions duration values `120ms`, `180ms`, `200ms`, `250ms`, `300ms`, `600ms`, `2500ms` (toContain — the 7 spec'd durations)
- MOTION.md mentions easing names `ease-out`, `ease-in-out`, `ease` (toContain)
- MOTION.md does NOT contain `cubic-bezier(` (UI-SPEC: prohibited in v1.2)
- MOTION.md does NOT contain `gsap` or `GSAP` (anti-pattern carryover)
- MASTER.md §6 has been replaced — `readFileSync` MASTER.md, assert it contains the stub phrase (`v1.1 motion lock superseded by v1.2`) AND contains a link to `MOTION.md` (`(MOTION.md)` substring)
- MASTER.md NO LONGER contains the original §6.1 line "**GSAP** — `gsap` is uninstalled" inside the §6 region (since §6 is replaced with stub) — the GSAP ban survives in §8 instead
- MASTER.md §8 still contains the GSAP ban (regression guard: §8 line 736 of original)
- MASTER.md §11 Changelog gains a v1.2 / Phase 16 entry (toContain `v1.2` + `Phase 16`)

---

### `tests/client/observer-factory.test.ts` (NEW — IO factory contract)

**Analog:** `tests/client/scroll-depth.test.ts`

**File-prelude pattern (lines 1-34 of analog):**
```ts
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleScrollEntry } from "../../src/scripts/scroll-depth";

let latestObserverCallback: IntersectionObserverCallback | null = null;
let observeMock: ReturnType<typeof vi.fn>;
let unobserveMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  document.body.innerHTML = "";
  observeMock = vi.fn();
  unobserveMock = vi.fn();
  latestObserverCallback = null;
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    class {
      constructor(cb: IntersectionObserverCallback) {
        latestObserverCallback = cb;
      }
      observe = observeMock;
      unobserve = unobserveMock;
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    };
});
```

**For observer-factory.test.ts:** copy the entire prelude verbatim, swap the import to `import { makeRevealObserver } from "../../src/scripts/lib/observer";` (drop the `umami` mock since the factory has no analytics surface).

**Required assertions:**
- Factory returns `null` when `document.querySelectorAll(selector)` returns 0 elements (gate parity with `scroll-depth.ts:42`)
- Factory returns an IntersectionObserver instance when ≥ 1 element matches
- Factory calls `observer.observe(el)` once per matched element (assert `observeMock.mock.calls.length === N`)
- Factory passes `rootMargin` and `threshold` from options through to the IO constructor (capture via class-stub constructor and assert)
- Factory invokes `onIntersect(entry, observer)` for each entry in callback when isIntersecting=true (drive synthetically via `latestObserverCallback`)
- Factory does NOT invoke `onIntersect` when `isIntersecting=false` is passed in entry (analog: `tests/client/scroll-depth.test.ts:113-120` — the negative case)

---

### `tests/client/motion.test.ts` (NEW — motion.ts behavior)

**Analog:** `tests/client/scroll-depth.test.ts`

**Adaptation:** same harness; the module under test is `src/scripts/motion.ts` (or its exported helpers). Required test seams in motion.ts: `export function shouldReduceMotion(): boolean`, `export function wrapWordsInPlace(el: HTMLElement): void`, and `export function handleRevealEntry(entry: IntersectionObserverEntry, observer: IntersectionObserver): void` — three pure functions analogous to scroll-depth's `handleScrollEntry`.

**Required assertions:**
- **Reduced-motion path (FIRST test per ROADMAP gate "Reduced-Motion Contract"):** when `window.matchMedia` returns `{ matches: true }`, `initMotion()` performs ZERO DOM mutations (no `.reveal-on` class added, no `data-stagger-split` set, no span-wrap). Mock matchMedia via `Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: true, addEventListener: vi.fn() }) })`.
- **No-preference path:** when matchMedia returns `{ matches: false }`, `handleRevealEntry(syntheticIntersectingEntry, mockObserver)` adds `.reveal-on` class to entry.target.
- **Word-stagger fires for `.h1-section`:** synthetic entry with target `.h1-section` containing "Lorem ipsum dolor" -> `handleRevealEntry` -> entry.target.children.length === 3, each child is `<span class="word">`, each has `style="--i: N"` set.
- **Word-stagger idempotency (D-13):** running `wrapWordsInPlace(el)` twice on same element produces same DOM as one run; second call early-returns based on `data-stagger-split="true"` attribute.
- **Word-stagger NEVER fires on `.display`:** synthetic entry with target `.display` -> no span-wrap occurs (D-08 / D-12). This is enforced by motion.ts's selector list NOT including `.display` — assertion: `wrapWordsInPlace(displayEl)` is never called when `handleRevealEntry` receives a `.display` target. Alternative: assert that the selector list passed to factory excludes `.display`.
- **One-shot unobserve (D-07):** `handleRevealEntry` calls `observer.unobserve(entry.target)` after firing. Mirrors `tests/client/scroll-depth.test.ts:106-111`.
- **Non-intersecting no-op:** `handleRevealEntry(syntheticNonIntersectingEntry, mockObserver)` makes no DOM mutation and does not call `unobserve`. Mirrors `tests/client/scroll-depth.test.ts:113-120`.

---

### `tests/client/chat-pulse-coordination.test.ts` (NEW — chat.ts D-15 + MOTN-05 ordering)

**Analog:** `tests/client/analytics.test.ts` (jsdom + chat surface event dispatch + assertion of side effects) + `tests/client/scroll-depth.test.ts` (IntersectionObserver stub block — needed because importing chat.ts may transitively touch IO surfaces; defensive scaffolding per `tests/client/analytics.test.ts:13-32`).

**Test setup (mirror analytics.test.ts:14-32):**
```ts
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  document.body.innerHTML = "";
  // Stub IntersectionObserver defensively (chat.ts may transitively touch it)
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    class {
      constructor(public cb: IntersectionObserverCallback) {}
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    };
});
```

**Required assertions:**
- **Pause-before-focus-trap (D-15):** spy on `setupFocusTrap` (or its observable `addEventListener("keydown", ...)` side effect on the panel); construct minimal DOM with `#chat-bubble` and `#chat-panel` and required children; click bubble; assert that `#chat-bubble.dataset.pulsePaused` is set BEFORE the keydown listener is registered. Verify ordering by timestamping or by `mockBubble.setAttribute` spy call-order vs `mockPanel.addEventListener` spy call-order.
- **Resume-after-focus-restoration (D-15):** open then close panel; assert that on close, `#chat-bubble.focus()` is called BEFORE `data-pulse-paused` attribute is removed. Use a spy on `bubble.focus` to capture timestamp + a spy on `bubble.removeAttribute`.
- **Attribute presence reflects panel state:** when panel is open (`panelOpen=true`), `bubble.hasAttribute("data-pulse-paused")` === true; when closed, false.
- **Idempotency:** opening a panel that's already open (double-click) does not re-set the attribute redundantly OR redundant set is a no-op (acceptable; assert no error thrown and final state is correct).
- **D-26 chat regression gate parity:** import `tests/api/chat.test.ts`-style harness check that runs through `setupFocusTrap` re-query test from Phase 7 — ensure the pulse changes don't break the dynamic Tab-keypress re-query. (May be deferred to running the existing focus-visible test suite as the regression battery.)

**Note on Astro `astro:page-load` simulation:** chat.ts initializes via `astro:page-load` event. To exercise `initChat`, dispatch `document.dispatchEvent(new Event("astro:page-load"))` after the module is imported. Mirrors the `chat.ts:initChat` path that runs on page-load (line 466-468).

---

### `tests/client/reduced-motion.test.ts` (MODIFIED — extend assertions)

**Analog:** `tests/client/reduced-motion.test.ts` itself

**Existing assertions (DO NOT MODIFY):**
- `scroll-behavior: smooth` inside no-preference (lines 30–36) — regression guard
- Strip-and-verify scroll-behavior uniqueness (lines 38–45)
- `@media (prefers-reduced-motion: reduce)` block exists (lines 49–51)
- `.nav-link-hover` transition reduced (lines 53–60)
- `.nav-link-hover:hover` background-size revert (lines 62–67)

**Phase 16 extensions (NEW assertions to add — same file, same describe-block style):**
- `@keyframes reveal-rise` lives inside or paired-with `@media (prefers-reduced-motion: no-preference)` (MOTN-02 / D-23 — reveal animation gated)
- `@keyframes word-rise` (or chosen name) lives inside `@media (prefers-reduced-motion: no-preference)` (MOTN-07 / D-23)
- `@media (prefers-reduced-motion: reduce)` block contains `#chat-bubble { animation: none; }` (MOTN-04 / D-24 — paired override pattern)
- View-transition keyframes (`view-transition-fade-out` / `view-transition-fade-in`) live inside `@media (prefers-reduced-motion: no-preference)` (MOTN-01 / D-23)
- Chat panel scale-in animation lives inside `@media (prefers-reduced-motion: no-preference)` (MOTN-05 / D-23)

**Style note:** keep the same describe-block header style — `describe("prefers-reduced-motion — Phase 16 motion gating (MOTN-02, MOTN-04, MOTN-05, MOTN-07)", ...)`.

---

## Shared Patterns

### Bootstrap on `astro:page-load` + `DOMContentLoaded` (idempotency-guarded)

**Source:** `src/scripts/scroll-depth.ts:67-76` and `src/scripts/analytics.ts:144-153`
**Apply to:** `src/scripts/motion.ts` (NEW)

```ts
// WR-01: bootstrap-level guard prevents document listener pile-up if this
// module is re-evaluated across Astro view transitions.
let xxxBootstrapped = false;
if (typeof document !== "undefined" && !xxxBootstrapped) {
  xxxBootstrapped = true;
  document.addEventListener("astro:page-load", initXxx);
  if (document.readyState !== "loading") {
    initXxx();
  } else {
    document.addEventListener("DOMContentLoaded", initXxx);
  }
}
```
**Why both listeners:** `<ClientRouter />` is prohibited (MASTER.md §8), so `astro:page-load` does NOT fire on its own (RESEARCH.md §1 finding #2). `DOMContentLoaded` is the actual init hook today. Both listeners are wired for forward-compat.

**Internal init guard companion (mirror at scroll-depth.ts:37-43):**
```ts
let xxxInitialized = false;
export function initXxx(): void {
  if (xxxInitialized) return;
  // ... DOM-presence gate (early return if no targets) ...
  xxxInitialized = true;
  // ... actual init work ...
}
```

---

### IntersectionObserver class-stub for jsdom

**Source:** `tests/client/scroll-depth.test.ts:11-29` and `tests/client/analytics.test.ts:14-32`
**Apply to:** `tests/client/observer-factory.test.ts`, `tests/client/motion.test.ts`, `tests/client/chat-pulse-coordination.test.ts` (defensive)

```ts
beforeEach(() => {
  document.body.innerHTML = "";
  observeMock = vi.fn();
  unobserveMock = vi.fn();
  latestObserverCallback = null;
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    class {
      constructor(cb: IntersectionObserverCallback) {
        latestObserverCallback = cb;
      }
      observe = observeMock;
      unobserve = unobserveMock;
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    };
});
```
**Why:** jsdom 29 does not implement IntersectionObserver natively. The `latestObserverCallback` capture allows tests to drive the callback synthetically with mock `IntersectionObserverEntry` objects (analog: `tests/client/scroll-depth.test.ts:45-55`).

---

### Source-text invariant (vitest + readFileSync + multiline regex)

**Source:** `tests/client/reduced-motion.test.ts` (entire file is the canonical pattern)
**Apply to:** `tests/build/motion-css-rules.test.ts`, `tests/build/work-arrow-motion.test.ts`, `tests/build/motion-doc.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(__dirname, "../..");
const css = readFileSync(resolve(projectRoot, "src/styles/global.css"), "utf8");

it("...", () => {
  const pattern = /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*{\s*html\s*{\s*scroll-behavior:\s*smooth;/;
  expect(css).toMatch(pattern);
});
```
**Style notes:**
- Use `\s*` between tokens so single-line vs multi-line CSS formatting both match
- Use `[\s\S]*?` (non-greedy) for inter-block matches across newlines
- For uniqueness: use `css.replace(pattern, "")` then assert the stripped text doesn't contain the matched declaration (analog: lines 38–45 of reduced-motion.test.ts)

---

### `@media (prefers-reduced-motion: ...)` paired-block pattern

**Source:** `src/styles/global.css:74-81` (no-preference gate) + `src/styles/global.css:119-133` (paired-override pattern)
**Apply to:** all new motion CSS in `src/styles/global.css` and the `@media (prefers-reduced-motion: reduce)` block to be added inside `WorkRow.astro` scoped `<style>`

**Two patterns coexist:**
1. **Wrap-in-no-preference (used for entrance animations — MOTN-01, MOTN-02, MOTN-05, MOTN-07):**
   ```css
   @media (prefers-reduced-motion: no-preference) {
     /* entrance animation only fires when user hasn't requested reduce */
   }
   ```
2. **Unconditional + paired-reduce-override (used for loop animations — MOTN-04 chat pulse):**
   ```css
   /* unconditional rule */
   #chat-bubble { animation: chat-pulse 2500ms ease-in-out infinite; }
   /* paired override neutralizes the rule under reduce */
   @media (prefers-reduced-motion: reduce) {
     #chat-bubble { animation: none; }
   }
   ```
**When to use which:** entrance animations should default to OFF for reduce users (no-preference wrap). Loops with side effects (the bubble pulse signals "active state") follow the paired-override pattern so the animation declaration is co-located with its neutralizer for reviewability.

---

### Test-seam exported helper

**Source:** `src/scripts/scroll-depth.ts:18-35` (`export function handleScrollEntry`); `src/scripts/analytics.ts:29` (`export function classifyOutbound`); `src/scripts/chat.ts:45` (`export function renderMarkdown`)
**Apply to:** `src/scripts/motion.ts` (export `handleRevealEntry`, `wrapWordsInPlace`, `shouldReduceMotion`); `src/scripts/lib/observer.ts` (export `makeRevealObserver`)

**Pattern:** keep the bootstrap side-effect (init listeners) at module scope at the bottom of the file, but export the pure functions that do the work. Tests import the pure functions and exercise them with synthetic inputs. The bootstrap block fires when the test imports the module, but the IntersectionObserver class-stub absorbs any side effects.

---

### Voice rule for design-system docs

**Source:** `MEMORY.md` -> `project_voice_split.md` (site = first person, chat = third person, design-system = third-person spec voice)
**Apply to:** `design-system/MOTION.md` only (MASTER.md §6 stub is structural — no voice consideration)

`MOTION.md` is technical documentation. Use third-person spec voice: "Pulse animates the bubble at 2500ms ease-in-out infinite." NOT "I designed the pulse to..." (first person — that's site-content voice). NOT "Jack designed the pulse..." (third-person about-Jack — that's chat voice). MOTION.md is voice-neutral spec voice.

---

## No Analog Found

None — every Phase 16 file has a strong in-codebase precedent. Most novel surfaces (matchMedia early-return, span-wrap idempotency, `data-pulse-paused` attribute toggling, `@view-transition` at-rule, paired-reduce-override on chat pulse) are *new patterns* but their *file shapes* are well-precedented (TypeScript module with bootstrap + init guard + exported test seams; CSS file with `@media` gates; vitest source-text invariant test). The Phase 16 novelty is in the CSS rule contents and the chat.ts ordering — both well-specified by D-14 / D-15 / D-23 / D-24 / D-25.

---

## Metadata

**Analog search scope:**
- `src/scripts/` — all files (analytics.ts, chat.ts, scroll-depth.ts read in full)
- `src/styles/global.css` — lines 60–280 read (motion-relevant region); lines 395–475 read (chat panel + typography region)
- `src/components/primitives/` — WorkRow.astro, SectionHeader.astro
- `src/components/chat/ChatWidget.astro` — bubble + panel markup
- `src/layouts/BaseLayout.astro` — full
- `tests/client/` — reduced-motion.test.ts, scroll-depth.test.ts, analytics.test.ts, chat-widget-header.test.ts
- `tests/build/` — chat-context-integrity.test.ts, umami-tag-present.test.ts
- `design-system/MASTER.md` — header (1–100), §6 (662–693), §8 (729–748)
- `.planning/phases/15-analytics-instrumentation/15-PATTERNS.md` — header and Pattern Assignments shape

**Files scanned:** 17

**Pattern extraction date:** 2026-04-27
