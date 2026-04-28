---
phase: 12-tech-debt-sweep
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - src/scripts/chat.ts
  - tests/client/chat-copy-button.test.ts
autonomous: true
requirements:
  - DEBT-04
user_setup: []
tags:
  - chat
  - copy-button
  - dom
  - vitest
  - d-26
must_haves:
  truths:
    - "Both live-stream and localStorage-replay paths render IDENTICAL copy-button markup (outerHTML byte-equal)"
    - "Canonical markup = mono COPY label → COPIED on click → reverts to COPY after 1 second"
    - "Clicking COPY on either path writes message content to clipboard AND flips label to COPIED with accent color"
    - "After 1s, label reverts to COPY with `--ink-faint` color"
    - "Clipboard idempotency cloneNode rewire (chat.ts:822-832) still works — double-clicks in 1s window do not trigger double transitions"
    - "`createCopyButton` is exported from `src/scripts/chat.ts` and unit-tested via vitest + jsdom"
    - "D-26 Chat Regression Gate passes end-to-end"
  artifacts:
    - path: "src/scripts/chat.ts"
      provides: "New `createCopyButton(getContent: () => string): HTMLButtonElement` helper adjacent to `createBotMessageEl`, called from both live-stream and replay paths"
      exports:
        - "createCopyButton"
      contains: "export function createCopyButton"
    - path: "tests/client/chat-copy-button.test.ts"
      provides: "Vitest + jsdom tests for createCopyButton — markup snapshot, live/replay parity, COPY→COPIED→COPY transition, accent-color flip, idempotency"
      min_lines: 50
      contains: "@vitest-environment jsdom"
  key_links:
    - from: "chat.ts live-stream path (line 285 region)"
      to: "createCopyButton helper"
      via: "createCopyButton(() => content) call replacing SVG block"
      pattern: "createCopyButton\\(\\(\\)"
    - from: "chat.ts replay path (line 553 region)"
      to: "createCopyButton helper"
      via: "createCopyButton(() => msg.content) call replacing inline markup"
      pattern: "createCopyButton\\(\\(\\) =&gt; msg\\.content\\)"
    - from: "tests/client/chat-copy-button.test.ts"
      to: "src/scripts/chat.ts createCopyButton export"
      via: "import"
      pattern: 'import \\{ createCopyButton \\} from'
---

<objective>
Close DEBT-04 by deduplicating the chat copy-button into a single `createCopyButton(getContent: () => string): HTMLButtonElement` helper in `src/scripts/chat.ts`. Both creation paths — live-stream (currently SVG at ~chat.ts:285-308) and localStorage replay (currently inline COPY/COPIED at ~chat.ts:553-569) — call the helper so markup, classes, inline styles, aria-label, event wiring, and post-click label/color transitions are byte-identical. Canonical markup (per D-01) = mono `COPY` → `COPIED` with accent-color flip on success, 1s revert, always-visible (no hover-reveal). Add a new Wave-0 vitest test (`tests/client/chat-copy-button.test.ts`) that mirrors `tests/client/markdown.test.ts` shape and proves parity + behavior. Run D-26 Chat Regression Gate as verification.

Purpose: v1.1 Phase 10 audit flagged that live-stream bot messages rendered an SVG clipboard icon while replayed messages rendered `COPY` text — visible drift that makes the site look inconsistent across a page reload. Per D-01, the REPLAY path has the canonical behavior; live-stream conforms.

Output: Single `createCopyButton` helper exported from chat.ts; two call-site swaps (live + replay); new vitest test proving parity; clipboard idempotency preserved at chat.ts:822-832; D-26 gate all-green; Lighthouse 99/95/100/100 held.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/12-tech-debt-sweep/12-CONTEXT.md
@.planning/phases/12-tech-debt-sweep/12-RESEARCH.md
@.planning/phases/12-tech-debt-sweep/12-PATTERNS.md
@.planning/phases/12-tech-debt-sweep/12-VALIDATION.md
@tests/client/markdown.test.ts

<interfaces>
<!-- Canonical markup to emit — lifted verbatim from replay path (chat.ts:553-569) per PATTERNS.md -->
```ts
const copyBtn = document.createElement("button");
copyBtn.className = "chat-copy-btn label-mono";
copyBtn.textContent = "COPY";
copyBtn.setAttribute("aria-label", "Copy message");
copyBtn.type = "button";
copyBtn.style.cssText = "position: absolute; top: -4px; right: 0; background: none; border: none; cursor: pointer;";
// event wiring (closes over getContent callback, not a captured string):
copyBtn.addEventListener("click", () => {
  copyToClipboard(getContent(), copyBtn);
  copyBtn.textContent = "COPIED";
  copyBtn.style.color = "var(--accent)";
  setTimeout(() => {
    copyBtn.textContent = "COPY";
    copyBtn.style.color = "var(--ink-faint)";
  }, 1000);
});
```

<!-- copyToClipboard signature (unchanged, chat.ts:231-239) -->
```ts
async function copyToClipboard(text: string, button: HTMLElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    button.classList.add("copy-success");
    setTimeout(() => button.classList.remove("copy-success"), 2000);
  } catch { /* silently fail */ }
}
```

<!-- Clipboard idempotency cloneNode rewire — PRESERVE at chat.ts:822-832 (RESEARCH.md A2 forbids simplification) -->
```ts
const copyBtn = botEl?.querySelector(".chat-copy-btn");
if (copyBtn) {
  copyBtn.replaceWith(copyBtn.cloneNode(true));
  const newCopyBtn = botEl?.querySelector(".chat-copy-btn") as HTMLElement;
  if (newCopyBtn) {
    newCopyBtn.addEventListener("click", () => {
      copyToClipboard(botContent, newCopyBtn);
    });
  }
}
```

<!-- Vitest skeleton pattern from tests/client/markdown.test.ts:1-15 -->
```ts
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../../src/scripts/chat";
// ...
```
</interfaces>
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 1 (Wave 0 RED): Author failing tests for createCopyButton — confirm RED state via developer inspection</name>
  <read_first>
    - tests/client/markdown.test.ts (full file — skeleton pattern)
    - .planning/phases/12-tech-debt-sweep/12-PATTERNS.md section "tests/client/chat-copy-button.test.ts — new vitest + jsdom test"
    - .planning/phases/12-tech-debt-sweep/12-VALIDATION.md Wave 0 Requirements
    - .planning/phases/12-tech-debt-sweep/12-RESEARCH.md §Validation Architecture
  </read_first>
  <what-built>
    A new vitest + jsdom test file authored at `tests/client/chat-copy-button.test.ts` with 5 `it(...)` blocks covering canonical markup, live/replay parity, COPY→COPIED→COPY transition, click-time getContent invocation, and cloneNode idempotency. Because `createCopyButton` is NOT yet exported from `src/scripts/chat.ts` (implemented in Task 2), running vitest on this file MUST fail — the import resolution itself errors. This is intentional RED state for TDD. Because the standard `<automated>` verify contract expects exit 0 = pass, confirming RED is a human-verify checkpoint — the developer runs vitest, reads the failure output, and confirms it matches expected TDD RED behavior. The file is staged for Task 2 GREEN.
  </what-built>
  <action>
    Create new file `tests/client/chat-copy-button.test.ts` with this exact skeleton (adjust paths if your repo layout differs — pattern lifted from tests/client/markdown.test.ts):

    ```ts
    // @vitest-environment jsdom
    import { describe, it, expect, vi, beforeEach } from "vitest";
    import { createCopyButton } from "../../src/scripts/chat";

    describe("createCopyButton (DEBT-04)", () => {
      beforeEach(() => {
        document.body.innerHTML = "";
        Object.assign(navigator, {
          clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
      });

      it("emits canonical COPY label markup", () => {
        const btn = createCopyButton(() => "hello");
        expect(btn.tagName).toBe("BUTTON");
        expect(btn.className).toContain("chat-copy-btn");
        expect(btn.className).toContain("label-mono");
        expect(btn.type).toBe("button");
        expect(btn.textContent).toBe("COPY");
        expect(btn.getAttribute("aria-label")).toBe("Copy message");
        expect(btn.style.cssText).toContain("position: absolute");
        expect(btn.style.cssText).toContain("top: -4px");
        expect(btn.style.cssText).toContain("right: 0");
      });

      it("markup identical between invocations (live + replay parity)", () => {
        const live = createCopyButton(() => "msg");
        const replay = createCopyButton(() => "msg");
        expect(live.outerHTML).toBe(replay.outerHTML);
      });

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

      it("invokes getContent at click-time, not creation-time (live-stream parity)", () => {
        let current = "v1";
        const btn = createCopyButton(() => current);
        document.body.appendChild(btn);
        current = "v2";
        btn.click();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("v2");
      });

      it("cloneNode dance strips listeners (idempotency guard compat)", () => {
        const btn = createCopyButton(() => "x");
        document.body.appendChild(btn);
        btn.replaceWith(btn.cloneNode(true));
        const clone = document.querySelector(".chat-copy-btn") as HTMLElement;
        expect(clone).not.toBeNull();
        clone.click();
        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
      });
    });
    ```

    Stage the file. Commit as:
    ```
    test(12-03): add failing tests for createCopyButton helper
    ```

    Proceed to the human-verify step below to confirm RED state before Task 2.
  </action>
  <how-to-verify>
    **Capture expected RED output.** Run:
    ```
    pnpm test -- --run tests/client/chat-copy-button.test.ts
    ```

    Expected observations (developer confirms all five):
    1. The command exits NON-ZERO (vitest reports failure)
    2. The failure reason is an import/resolution error: `createCopyButton` is not exported from `../../src/scripts/chat` (or equivalent "No matching export" / "is not a function" message). Vitest may also report the failure as a test-file load failure with 5 missing-discovery errors — either shape is valid RED state.
    3. The test file `tests/client/chat-copy-button.test.ts` exists and contains the exact 5 `it(...)` blocks listed above
    4. The source file `src/scripts/chat.ts` does NOT yet export `createCopyButton` — confirms the test is truly RED, not accidentally green
    5. No other test in the suite regressed

    **Verdict:** if vitest fails with the import/export error and the test file is staged, the RED state is valid — "test file exists and Vitest reports the expected failing assertions — file is staged for Task 2 GREEN". Type "approved" to proceed to Task 2.

    If vitest unexpectedly passes (a pre-existing `createCopyButton` export exists, or tests are structured so they don't actually exercise the helper), STOP and investigate — do NOT proceed to Task 2 until RED is confirmed.
  </how-to-verify>
  <verify>
    <automated>test -f tests/client/chat-copy-button.test.ts &amp;&amp; echo "file exists"</automated>
    <automated>grep -c "@vitest-environment jsdom" tests/client/chat-copy-button.test.ts</automated>
    <automated>grep -c "createCopyButton" tests/client/chat-copy-button.test.ts</automated>
    <automated>grep -c "^export function createCopyButton" src/scripts/chat.ts</automated>
  </verify>
  <resume-signal>Type "approved" once vitest has been run against the new test file, RED state confirmed (import error or 5 failing assertions), and the test file is committed under the `test(12-03):` message. Paste the vitest stderr summary line into the resume message for audit trail.</resume-signal>
  <acceptance_criteria>
    - File `tests/client/chat-copy-button.test.ts` exists with at least 50 lines
    - File starts with `// @vitest-environment jsdom` on line 1
    - File imports `createCopyButton` from `"../../src/scripts/chat"`
    - Contains exactly 5 `it(...)` blocks covering: canonical markup, live/replay parity, COPY→COPIED→COPY transition, click-time getContent invocation, cloneNode idempotency
    - `grep -c "^export function createCopyButton" src/scripts/chat.ts` returns 0 (helper NOT yet implemented — ensures RED state)
    - Vitest invocation against the test file reports failure (developer confirms output shape in sign-off message)
    - Commit message: `test(12-03): add failing tests for createCopyButton helper`
  </acceptance_criteria>
  <done>Wave 0 test scaffold committed in RED state — `createCopyButton` does not yet exist; developer has visually confirmed vitest failure matches TDD RED expectation.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2 (GREEN): Implement createCopyButton helper + swap both call sites</name>
  <read_first>
    - src/scripts/chat.ts (full file — focus on lines 231-239 copyToClipboard, 266-310 createBotMessageEl, 285-308 live-stream SVG block to delete, 553-569 replay canonical markup to replace, 820-832 cloneNode rewire to preserve)
    - .planning/phases/12-tech-debt-sweep/12-PATTERNS.md "src/scripts/chat.ts" section (contains the exact markup to emit, verbatim from replay path)
    - .planning/phases/12-tech-debt-sweep/12-CONTEXT.md D-01, D-02, D-03
    - tests/client/chat-copy-button.test.ts (the failing test file from Task 1)
  </read_first>
  <behavior>
    Helper signature: `export function createCopyButton(getContent: () => string): HTMLButtonElement`. Returns a fully-wired button that emits canonical markup (mono COPY label, label-mono class, chat-copy-btn class, type=button, aria-label=Copy message, inline style for position/top/right). Click handler calls `copyToClipboard(getContent(), btn)`, flips textContent to COPIED + color to `var(--accent)`, and after 1s reverts to COPY + `var(--ink-faint)`. All 5 Task-1 tests go GREEN.
  </behavior>
  <action>
    **Step A — Add the helper to `src/scripts/chat.ts`:** Insert the following function immediately after `createBotMessageEl` (around chat.ts:310, just before the next function). Use EXACT text:

    ```ts
    /**
     * DEBT-04 / D-01, D-02: Single source of truth for the chat copy button.
     * Both live-stream and localStorage-replay paths call this helper so markup,
     * classes, inline styles, aria-label, and post-click transitions are identical.
     * Canonical behavior lifted verbatim from the replay path (pre-dedup chat.ts:553-569).
     *
     * @param getContent Callback returning the current message text to copy.
     *                   Invoked at CLICK TIME (not creation time) so the live-stream
     *                   path can read the final `botContent` after streaming completes
     *                   while the cloneNode idempotency rewire at chat.ts ~822-832 still works.
     */
    export function createCopyButton(getContent: () => string): HTMLButtonElement {
      const copyBtn = document.createElement("button");
      copyBtn.className = "chat-copy-btn label-mono";
      copyBtn.textContent = "COPY";
      copyBtn.setAttribute("aria-label", "Copy message");
      copyBtn.type = "button";
      copyBtn.style.cssText = "position: absolute; top: -4px; right: 0; background: none; border: none; cursor: pointer;";
      copyBtn.addEventListener("click", () => {
        copyToClipboard(getContent(), copyBtn);
        copyBtn.textContent = "COPIED";
        copyBtn.style.color = "var(--accent)";
        setTimeout(() => {
          copyBtn.textContent = "COPY";
          copyBtn.style.color = "var(--ink-faint)";
        }, 1000);
      });
      return copyBtn;
    }
    ```

    **Step B — Swap the live-stream call site (chat.ts ~285-308):** Delete the entire existing SVG block (the `document.createElement("button")`, `className = "chat-copy-btn"`, multi-line `style.cssText = \`...\``, `innerHTML = '<svg...>'`, and the `addEventListener("click", () => copyToClipboard(content, copyBtn))` call — everything from `const copyBtn = document.createElement("button");` through the closing of the listener). Replace with:
    ```ts
    const copyBtn = createCopyButton(() => content);
    ```
    Keep the `wrapper.appendChild(copyBtn)` line that follows (or add it if it was part of the deleted block). `content` here is the live-stream variable holding the current bot content; because `createCopyButton` reads it via the callback at click-time, the cloneNode rewire at chat.ts:822-832 continues to work: it clones the button (losing listeners), then re-addEventListener's with the FINAL `botContent`. The closure-over-function design is additive to, not replacing, the existing idempotency guard.

    **Step C — Swap the replay call site (chat.ts ~553-569):** Delete the verbatim-canonical inline block (the entire `const copyBtn = document.createElement("button");` through the `wrapper.appendChild(copyBtn);` — 17 lines per PATTERNS.md). Replace with:
    ```ts
    const copyBtn = createCopyButton(() => msg.content);
    wrapper.appendChild(copyBtn);
    ```
    (`msg.content` is the replay-path variable for the message being rehydrated.)

    **Step D — PRESERVE the clipboard idempotency rewire at chat.ts ~822-832 UNCHANGED.** Per RESEARCH.md A2, do NOT simplify this block. The `copyBtn.replaceWith(copyBtn.cloneNode(true))` + `newCopyBtn.addEventListener("click", () => copyToClipboard(botContent, newCopyBtn))` pattern is D-08 load-bearing — if the planner elects to simplify it, the D-26 gate MUST cover clipboard double-click idempotency explicitly. Simplest-correct path: leave it alone.

    **Step E — Run the tests:** `pnpm test -- --run tests/client/chat-copy-button.test.ts`. All 5 tests MUST now pass GREEN. If any fail, inspect the test's assertion and the helper implementation — do NOT modify the tests to match faulty implementation.

    **Step F — Run full test suite:** `pnpm test` must exit 0 with zero failures (existing markdown, CORS, security tests continue to pass — no regression).

    Commit as:
    ```
    feat(12-03): implement createCopyButton helper and dedup both chat paths
    ```
  </action>
  <verify>
    <automated>grep -c "^export function createCopyButton" src/scripts/chat.ts</automated>
    <automated>grep -c "createCopyButton(() =&gt; content)" src/scripts/chat.ts</automated>
    <automated>grep -c "createCopyButton(() =&gt; msg.content)" src/scripts/chat.ts</automated>
    <automated>grep -c 'copyBtn.innerHTML = .*svg' src/scripts/chat.ts</automated>
    <automated>grep -c "copyBtn.replaceWith(copyBtn.cloneNode(true))" src/scripts/chat.ts</automated>
    <automated>pnpm test -- --run tests/client/chat-copy-button.test.ts</automated>
    <automated>pnpm test -- --run</automated>
    <automated>pnpm build</automated>
  </verify>
  <acceptance_criteria>
    - `grep "^export function createCopyButton" src/scripts/chat.ts` returns exactly 1 match
    - Helper signature is `export function createCopyButton(getContent: () =&gt; string): HTMLButtonElement`
    - `grep "createCopyButton(() =&gt; content)" src/scripts/chat.ts` returns 1 match (live-stream call site)
    - `grep "createCopyButton(() =&gt; msg.content)" src/scripts/chat.ts` returns 1 match (replay call site)
    - `grep "copyBtn.innerHTML" src/scripts/chat.ts` returns 0 matches (no SVG innerHTML remains — XSS surface eliminated)
    - `grep "&lt;svg" src/scripts/chat.ts` returns 0 matches in the copy-button context (verify manually — the file may have other SVGs)
    - `grep "copyBtn.replaceWith(copyBtn.cloneNode(true))" src/scripts/chat.ts` returns exactly 1 match (idempotency guard preserved verbatim)
    - `pnpm test -- --run tests/client/chat-copy-button.test.ts` exits 0, all 5 tests PASS (GREEN)
    - `pnpm test -- --run` full suite exits 0 with zero failures
    - `pnpm build` exits 0 with zero warnings
    - `pnpm exec astro check` exits 0
    - `pnpm lint` exits 0 with zero warnings
  </acceptance_criteria>
  <done>GREEN — createCopyButton exported, both call sites call it, all tests pass, idempotency guard preserved verbatim.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: D-26 Chat Regression Gate + Lighthouse verification</name>
  <read_first>
    - .planning/phases/12-tech-debt-sweep/12-RESEARCH.md §"D-26 Chat Regression Gate Checklist" (lines 333-375)
    - .planning/phases/12-tech-debt-sweep/12-VALIDATION.md
  </read_first>
  <what-built>
    `createCopyButton` helper now lives in `src/scripts/chat.ts` and is exported for tests. Both live-stream and replay paths call it. Vitest coverage proves markup parity + behavior + click-time content resolution + cloneNode idempotency compatibility. The existing clipboard idempotency rewire at chat.ts:822-832 is preserved verbatim. All automated tests green. The remaining concern is live-production smoke of the full Phase 7 chat regression surface under the changed copy-button code path.
  </what-built>
  <action>See &lt;how-to-verify&gt; block below — this is a checkpoint:human-verify task; the executor pauses the automation for the developer to run the full D-26 Chat Regression Gate manual-smoke battery against a preview deploy, inspect live-vs-replay copy-button markup parity, and confirm Lighthouse CI holds 99/95/100/100. Results recorded in 12-VALIDATION.md §D-26 — Plan 12-03.</action>
  <how-to-verify>
    Run the FULL D-26 Chat Regression Gate from `12-RESEARCH.md §D-26 Chat Regression Gate Checklist` (lines 337-367) against the preview deploy (after `pnpm build &amp;&amp; pnpm preview`) or a staging deploy.

    **Automated (already green after Task 2):**
    - `pnpm test` exits 0; all 12 markdown XSS tests + 9 CORS + streaming + body-size + 12 prompt-injection tests pass
    - `pnpm test -- --run tests/client/chat-copy-button.test.ts` all 5 tests GREEN

    **Manual smoke (paste into 12-VALIDATION.md §D-26 with timestamp + commit SHA + verdict):**
    1. Open chat panel — focus lands in input; Tab cycles stay inside panel (focus trap re-query on every Tab)
    2. Send "Hello" — SSE stream renders tokens live; typing indicator visible during stream
    3. **COPY BUTTON — LIVE STREAM:** on the streamed bot reply, click COPY. Expect:
       - Text flips from `COPY` to `COPIED`
       - Color flips from `var(--ink-faint)` to `var(--accent)` (inspect via DevTools computed style)
       - After 1 second, reverts to `COPY` in `var(--ink-faint)`
       - Clipboard contains the bot message content (paste into a scratch doc to verify)
    4. Reload page (localStorage replay triggers)
    5. **COPY BUTTON — REPLAY:** on the same rehydrated bot reply, click COPY. Expect IDENTICAL markup + IDENTICAL behavior to step 3. Specifically: inspect element on both the live and replay buttons — `outerHTML` should be byte-equal except for the text content after click-transitions.
    6. **IDEMPOTENCY:** on a bot message, double-click COPY within the 1s window. Expect only ONE transition (no double-flip, no double-clipboard-write). Confirm the JS boolean + DOM data-attribute guards from Phase 7 still operate.
    7. 30s AbortController timeout — kill network mid-stream; client recovers, error message rendered, panel still usable
    8. Rate limit 5/60s — send 6 messages rapidly; 6th rejected with user-facing error
    9. localStorage persistence + cap — send 51 messages; verify 50-msg cap via DevTools Application → Local Storage
    10. 24h TTL — set `Date.now()` mock in DevTools console; reopen chat; expired messages purged
    11. Markdown rendering — bot reply with `**bold**`, `*italic*`, `- list`, `` `code` ``, `[link](https://…)` — all render via DOMPurify strict whitelist (no `<script>`, no inline handlers)
    12. Focus trap re-query — open chat, Tab 20+ times; `document.activeElement` never leaves the chat panel subtree

    **Phase-12-specific D-26 additions (per 12-RESEARCH.md:362-365):** N/A for this plan (no inert change — that's plan 12-02). Skip.

    **Lighthouse CI:** run on homepage + one project detail page. Expect Performance ≥99, Accessibility ≥95, Best Practices 100, SEO 100. Confirm the removed SVG block did not regress any metric.

    Record all results in `.planning/phases/12-tech-debt-sweep/12-VALIDATION.md` under `## D-26 Chat Regression Gate — Plan 12-03` with timestamp, commit SHA (HEAD after Task 2), and one-line verdict per bullet. Include a screenshot or inspect-element excerpt showing identical markup between live-stream and replay copy buttons.
  </how-to-verify>
  <verify><automated>pnpm test -- --run &amp;&amp; pnpm build &amp;&amp; pnpm lint</automated></verify>
  <resume-signal>Type "approved" once D-26 gate all-green and Lighthouse held, or describe any regression with reproduction steps.</resume-signal>
  <acceptance_criteria>
    - 12-VALIDATION.md contains `## D-26 Chat Regression Gate — Plan 12-03` section with timestamp + commit SHA
    - All 12 D-26 manual smoke items verified PASS (with explicit live-stream vs replay parity evidence for the copy button)
    - Lighthouse on homepage + one project detail: Performance ≥99, Accessibility ≥95, Best Practices 100, SEO 100
    - Inspection evidence (screenshot or outerHTML diff) proves live-stream and replay buttons have identical markup
  </acceptance_criteria>
  <done>DEBT-04 closed: single helper drives both paths, parity proven by both unit test and manual D-26 smoke, Lighthouse held.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user chat content → DOM | Message content flows into clipboard and button closure; must not open XSS surface |
| live-stream → replay rehydration | Both paths must produce byte-equal DOM so localStorage replay is indistinguishable from fresh stream |
| click handler → clipboard API | navigator.clipboard.writeText receives user-supplied message text |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-12-03-01 | Tampering / XSS | createCopyButton markup emission | mitigate | Helper uses `textContent` and `setAttribute` exclusively — NEVER `innerHTML`, NEVER template-string concatenation into HTML. Deleted SVG block previously used `innerHTML = '<svg…>'`; removing it eliminates one minor XSS foothold (the SVG string was static, but the pattern made audit harder). Task 2 acceptance criteria grep confirms `copyBtn.innerHTML` is 0 matches. D-26 gate XSS battery (`tests/client/markdown.test.ts` 12 tests) catches regressions. Severity: Medium (blocking if helper were to use innerHTML). |
| T-12-03-02 | Information disclosure | Clipboard content | accept | `copyToClipboard(getContent(), btn)` writes the bot message the user just saw on screen — by definition non-secret from the user's perspective. No PII leakage risk. Severity: Low. |
| T-12-03-03 | Denial of service | Double-click transition storm | mitigate | Existing chat.ts:822-832 cloneNode rewire idempotency guard is preserved verbatim per RESEARCH.md A2. Task 1 Test 5 proves `cloneNode(true)` strips listeners (compatibility). D-26 gate manual step 6 verifies double-click within 1s window triggers only one transition. Severity: Low. |
| T-12-03-04 | Repudiation / parity regression | Live vs replay drift | mitigate | Task 1 Test 2 asserts byte-equal `outerHTML` between two invocations. Task 3 D-26 manual step 5 visually inspects both buttons for markup parity. Any future edit to `createCopyButton` that breaks parity fails the unit test at CI. Severity: Medium. |
| T-12-03-05 | Elevation of privilege | Exported helper surface | accept | `createCopyButton` is the only new chat.ts export. It takes a function and returns a DOM node — no DOM mutation of arbitrary elements, no fetch calls, no eval. Import from other modules is expected; the function contract is tight. Severity: Low. |
</threat_model>

<verification>
Plan-level sign-off requires:
- Task 1 tests file exists, RED state confirmed by developer (import error or 5 failing assertions), commit landed
- Task 2 helper implemented, all 5 tests GREEN, full `pnpm test` suite GREEN, `pnpm build` + `pnpm lint` + `pnpm exec astro check` all 0 warnings
- Task 3 D-26 Chat Regression Gate checklist recorded in 12-VALIDATION.md with PASS evidence per bullet
- Lighthouse 99/95/100/100 on homepage + one project detail
- Clipboard idempotency rewire at chat.ts:822-832 preserved byte-identical to pre-plan state (verify via `git blame` or diff)
- Zero `copyBtn.innerHTML` occurrences in chat.ts
- Exactly one `export function createCopyButton` occurrence in chat.ts
</verification>

<success_criteria>
- `createCopyButton` exported from `src/scripts/chat.ts`
- Live-stream path calls `createCopyButton(() =&gt; content)` (SVG block deleted)
- Replay path calls `createCopyButton(() =&gt; msg.content)` (inline block deleted)
- Clipboard idempotency rewire at chat.ts:822-832 preserved verbatim
- `tests/client/chat-copy-button.test.ts` exists with 5 tests, all GREEN
- Full test suite, build, lint, astro check all exit 0 with zero warnings
- D-26 Chat Regression Gate all-green (evidence in 12-VALIDATION.md)
- Live and replay copy buttons have byte-equal outerHTML (proven by unit test + manual inspection)
- Lighthouse 99/95/100/100 held
</success_criteria>

<output>
After completion, create `.planning/phases/12-tech-debt-sweep/12-03-SUMMARY.md` with:
- Helper source (pasted from chat.ts)
- Diff showing both call-site swaps (live + replay)
- Confirmation that chat.ts:822-832 idempotency rewire is byte-identical to pre-plan state
- Vitest output (all 5 new tests PASS + full suite green)
- Reference to 12-VALIDATION.md §D-26 — Plan 12-03 with gate evidence
- Lighthouse scores
- Inspection evidence (screenshot or outerHTML diff) of live vs replay parity
</output>
