---
phase: quick-260513-hqk-v1-3-closeout
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/scripts/chat.ts
  - scripts/build-chat-context.mjs
  - tests/build/chat-knowledge-voice.test.ts
  - tests/api/chat-voice-split.test.ts
  - tests/client/chat-copy-button.test.ts
  - src/layouts/BaseLayout.astro
  - tests/build/view-transition-handler.test.ts
  - tests/build/no-inline-display-on-chat-panel.test.ts
autonomous: true
requirements:
  - WR-01
  - WR-02
  - WR-03
  - WR-04
  - WR-05
must_haves:
  truths:
    - "Clipboard-failure path shows accent-red COPIED label (not default --ink-faint) for the full 1500ms feedback window"
    - "Copy button textContent and .copy-success class revert in the same tick (no dual-setTimeout drift)"
    - "FIRST_PERSON_LEAK_RE catches curly-apostrophe forms (I’m, I’d), British 'favourite', and the additional verbs (made, created, developed, implemented, designed, think, learned, noticed, tried, tested) + possessives (implementation, solution, design, team, experience)"
    - "All three FIRST_PERSON_LEAK_RE call sites (build script + 2 tests) carry the exact same regex source"
    - "readStringField rejects escaped quotes (`\\\"`) with an explicit error rather than silently truncating"
    - "BaseLayout pageswap handler uses double optional-chain `viewTransition?.finished?.catch(() => {})`"
    - "no-inline-display-on-chat-panel test uses matchAll, survives attribute reordering, and asserts exactly one #chat-panel div"
    - "Cross-phase anchors hold: D-15 sse-snapshot, D-26 chat-surface battery, TEST-03 anthropic-payload-shape — all GREEN"
  artifacts:
    - path: "src/scripts/chat.ts"
      provides: "createCopyButton with sync class-add in click handler + single-setTimeout dual revert; copyToClipboard no longer touches .copy-success"
      contains: "classList.add(\"copy-success\")"
    - path: "scripts/build-chat-context.mjs"
      provides: "Hardened FIRST_PERSON_LEAK_RE + readStringField escaped-quote guard"
      contains: "FIRST_PERSON_LEAK_RE"
    - path: "tests/build/chat-knowledge-voice.test.ts"
      provides: "FIRST_PERSON_LEAK regex in lockstep with build script + tests/api"
      contains: "FIRST_PERSON_LEAK"
    - path: "tests/api/chat-voice-split.test.ts"
      provides: "FIRST_PERSON_LEAK regex in lockstep with build script + tests/build"
      contains: "FIRST_PERSON_LEAK"
    - path: "src/layouts/BaseLayout.astro"
      provides: "Double optional-chain pageswap handler"
      contains: "viewTransition?.finished?.catch"
    - path: "tests/build/view-transition-handler.test.ts"
      provides: "Relaxed regex accepting both .finished.catch and .finished?.catch"
      contains: "viewTransition\\?\\.finished"
    - path: "tests/build/no-inline-display-on-chat-panel.test.ts"
      provides: "matchAll + duplicate-detection assertions"
      contains: "matchAll"
    - path: "tests/client/chat-copy-button.test.ts"
      provides: "Updated contract: class added at t=0 in click handler regardless of clipboard outcome"
      contains: "copy-success"
  key_links:
    - from: "src/scripts/chat.ts (createCopyButton click handler)"
      to: ".copy-success CSS class (global.css)"
      via: "classList.add at t=0, single setTimeout removes both textContent + class at t=COPY_FEEDBACK_MS"
      pattern: "classList\\.add\\(['\"]copy-success['\"]\\)"
    - from: "scripts/build-chat-context.mjs FIRST_PERSON_LEAK_RE"
      to: "tests/build/chat-knowledge-voice.test.ts + tests/api/chat-voice-split.test.ts"
      via: "byte-identical regex literal across all 3 sites"
      pattern: "FIRST_PERSON_LEAK"
    - from: "tests/build/no-inline-display-on-chat-panel.test.ts"
      to: "src/components/chat/ChatWidget.astro #chat-panel markup"
      via: "matchAll regex tolerant of attribute reordering + exactly-one-panel assertion"
      pattern: "matchAll"
---

<objective>
Close all five Warnings from `.planning/phases/17-foundations-migration-dns-debt-sweep/17-REVIEW-GAPS.md` (WR-01 through WR-05) as five atomic source-code commits, finishing the v1.3 milestone tech-debt sweep flagged in `.planning/v1.3-MILESTONE-AUDIT.md`.

Purpose: WR-01 is a real UX regression on the clipboard-failure path (showing "COPIED" text in default `--ink-faint` color with no accent confirmation). WR-02/03 are guard-strength hardening on the chat voice-split tripwire. WR-04 is a one-byte latent-defect fix on the pageswap handler. WR-05 is structural-lock test hardening. Together they close the v1.3 milestone with zero open Warnings.

Output: Five atomic `fix(quick-260513-hqk): WR-NN …` commits plus a final SUMMARY commit, with `pnpm test` GREEN at every boundary and cross-phase anchors (D-15 sse-snapshot, D-26 chat-surface, TEST-03 anthropic-payload-shape) preserved.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/v1.3-MILESTONE-AUDIT.md
@.planning/phases/17-foundations-migration-dns-debt-sweep/17-REVIEW-GAPS.md
@CLAUDE.md
@src/scripts/chat.ts
@scripts/build-chat-context.mjs
@tests/build/chat-knowledge-voice.test.ts
@tests/api/chat-voice-split.test.ts
@tests/client/chat-copy-button.test.ts
@src/layouts/BaseLayout.astro
@tests/build/view-transition-handler.test.ts
@tests/build/no-inline-display-on-chat-panel.test.ts
@src/components/chat/ChatWidget.astro
</context>

<interfaces>
<!-- Current contracts extracted from source so executor doesn't re-explore. -->

Current `createCopyButton` (src/scripts/chat.ts:400-420) — post-Plan-17-09 M3 shape:
```typescript
// Click handler currently only swaps textContent and schedules its revert;
// .copy-success is added/removed INSIDE copyToClipboard (success branch only).
copyBtn.addEventListener("click", () => {
  copyToClipboard(getContent(), copyBtn);
  copyBtn.textContent = "COPIED";
  setTimeout(() => {
    copyBtn.textContent = "COPY";
  }, COPY_FEEDBACK_MS);
});
```

Current `copyToClipboard` (src/scripts/chat.ts:379-387):
```typescript
async function copyToClipboard(text: string, button: HTMLElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    button.classList.add("copy-success");
    setTimeout(() => button.classList.remove("copy-success"), COPY_FEEDBACK_MS);
  } catch { /* swallow */ }
}
```

Canonical regex (3 lockstep sites — build script + 2 test files):
```
/\b(I(?:'|\s)(?:m\b|d\b|ll\b|ve\b|re\b|am\b)|I\s+(?:build|built|like|liked|wonder|wanted|reach|reached|read|architected|chose|haven|wrote|run|set|shipped|added|prefer|care|watch|track|love|hate)|My\s+(?:approach|favorite|projects|code|work|background|stack|version|first))\b/i
```

Current `readStringField` quoted-body pattern (scripts/build-chat-context.mjs:140-153):
```
^${escaped}:\s*"([^"\n]+)"\s*$    // stops at first internal `"` — silent partial truncation on escaped `\"`
```

Comma-in-array guard analog to mirror (scripts/build-chat-context.mjs:187-193): explicit `throw new Error(...)` rather than silent regex bypass.

Current pageswap handler (src/layouts/BaseLayout.astro:106):
```html
<script is:inline>
  window.addEventListener("pageswap", (e) => { e.viewTransition?.finished.catch(() => {}); });
</script>
```

Current panel-display test regex (tests/build/no-inline-display-on-chat-panel.test.ts:25):
```
/<div\s+id="chat-panel"\s+style="([^"]+)"/    // brittle — requires id IMMEDIATELY followed by style
```
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: WR-01 — Move .copy-success class to click handler; single-setTimeout dual revert</name>
  <files>src/scripts/chat.ts, tests/client/chat-copy-button.test.ts</files>
  <behavior>
    - In `createCopyButton` click handler: add `copyBtn.classList.add("copy-success")` SYNCHRONOUSLY at t=0 (before `copyToClipboard(...)`).
    - Consolidate the two prior setTimeouts (textContent revert + class removal) into ONE setTimeout that runs at `COPY_FEEDBACK_MS`, removing the class AND reverting textContent in the same tick.
    - In `copyToClipboard`: REMOVE the `classList.add("copy-success")` line AND its `setTimeout(...classList.remove...)` line. The function becomes a pure clipboard-write with try/catch — no DOM class side effects.
    - Test updates (tests/client/chat-copy-button.test.ts):
      - "flips textContent to COPIED on click..." test (line ~158): `.copy-success` class must be present at t=0 SYNCHRONOUSLY after `btn.click()`, not after `await Promise.resolve()`. Update assertion order to check class presence BEFORE the microtask drain.
      - Add a new test "WR-01: class added even when clipboard rejects" — stub `navigator.clipboard.writeText` to reject (`vi.fn().mockRejectedValue(new Error("denied"))`), click the button, assert `btn.classList.contains("copy-success")` is true at t=0, then `vi.advanceTimersByTime(1500)` and assert both `textContent === "COPY"` AND `classList.contains("copy-success") === false`.
      - The existing isolated CSS-cascade fixture tests (M4 fixture, lines 48-88) and the standalone `setTimeout` simulation test (lines 105-124) do NOT exercise `createCopyButton` directly — they remain unchanged.
      - The "createCopyButton lifecycle — class add/remove via setTimeout window" describe block (line ~90) uses a manual `setTimeout` simulation and does NOT call `createCopyButton`. Leave as-is.
  </behavior>
  <action>Edit src/scripts/chat.ts createCopyButton (line ~400-420) to apply the WR-01 fix pattern from 17-REVIEW-GAPS.md: classList.add inside the click handler at t=0, single setTimeout combining both reverts at COPY_FEEDBACK_MS. Strip the class-add/remove pair from copyToClipboard (line ~379-387). Update the JSDoc comments above createCopyButton (line ~390-399) and the M3 block-comment inside the click handler (line ~408-412) to reflect the new contract: click handler is the single class-driver site, copyToClipboard is now pure clipboard I/O. Then update tests/client/chat-copy-button.test.ts per the behavior block above. Run `pnpm test tests/client/chat-copy-button.test.ts` until GREEN. Then run the full D-26 chat-surface battery to confirm no regression: `pnpm test tests/client/ tests/api/chat-voice-split.test.ts tests/build/no-inline-display-on-chat-panel.test.ts tests/api/sse-snapshot.test.ts`. Stage src/scripts/chat.ts + tests/client/chat-copy-button.test.ts and commit `fix(quick-260513-hqk): WR-01 sync .copy-success class on click + single-timeout revert`.</action>
  <verify>
    <automated>pnpm test tests/client/chat-copy-button.test.ts tests/api/sse-snapshot.test.ts</automated>
  </verify>
  <done>Click handler adds `.copy-success` synchronously regardless of clipboard outcome; copyToClipboard no longer touches the class; both reverts share one setTimeout at COPY_FEEDBACK_MS; all chat-copy-button tests GREEN; D-15 sse-snapshot still GREEN; commit landed.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: WR-02 — Harden FIRST_PERSON_LEAK_RE across all 3 lockstep sites</name>
  <files>scripts/build-chat-context.mjs, tests/build/chat-knowledge-voice.test.ts, tests/api/chat-voice-split.test.ts</files>
  <behavior>
    - Per WR-02 fix option (b) in 17-REVIEW-GAPS.md: extend the existing token allow-list (do NOT switch to the structural pattern — option b is the recommended fix per the constraint that triplication is acceptable and option a's false-positive surface is too wide).
    - Verbs to add to the `I\s+(...)` branch: `made|created|developed|implemented|designed|think|learned|noticed|tried|tested`.
    - Possessives to add to the `My\s+(...)` branch: `implementation|solution|design|team|experience`.
    - British spelling: add `favourite` alongside `favorite` in the `My\s+(...)` branch.
    - Curly apostrophe: extend the contraction branch from `I(?:'|\s)` to `I(?:['’]|\s)` — accept both ASCII U+0027 (`'`) and curly U+2019 (`’`).
    - The regex source must be BYTE-IDENTICAL across all 3 sites. Copy the canonical updated regex literal into each file via copy-paste, then visually diff.
    - Test updates (chat-knowledge-voice.test.ts B1 self-test, line 40-57): extend `KNOWN_LEAKS` array with positive cases proving the new tokens are caught:
      - `"I made a small CLI"`
      - `"I created the build script"`
      - `"I developed the parser"`
      - `"I implemented the cache"`
      - `"I designed the schema"`
      - `"I think the boring path wins"`
      - `"I learned the hard way"`
      - `"I noticed the race"`
      - `"I tried the new flag"`
      - `"I tested with vitest"`
      - `"My implementation uses..."`
      - `"My solution was..."`
      - `"My design philosophy"`
      - `"My team shipped..."`
      - `"My experience tells me..."`
      - `"My favourite tool"` (British spelling)
      - `"I’m Jack"` (curly apostrophe)
      - `"I’d like to ship"` (curly apostrophe)
      - `"I’ve added tests"` (curly apostrophe)
    - The existing negative-control test (line 65-77) MUST stay GREEN. Re-verify "Jack's approach is" / "His favorite bug reports" / etc. still do not match.
    - No changes to chat-voice-split.test.ts beyond the regex literal swap — the existing system-block sweep is sufficient.
  </behavior>
  <action>Update FIRST_PERSON_LEAK_RE in scripts/build-chat-context.mjs (line 81) with the extended token list per the behavior block. Update the comment block at lines 60-79 to mention the WR-02 additions (verbs, possessives, British spelling, curly apostrophe). Copy the exact same regex into tests/build/chat-knowledge-voice.test.ts (line 32-33) and tests/api/chat-voice-split.test.ts (line 31-32) — byte-identical literal. Update the comment lines above each test regex (chat-knowledge-voice.test.ts lines 26-31 and chat-voice-split.test.ts lines 28-30) with the same WR-02 note. Extend KNOWN_LEAKS in chat-knowledge-voice.test.ts (line 40-57) with the new positive cases. Run `pnpm build:chat-context` to regenerate src/data/portfolio-context.json and confirm the existing content does NOT trigger the broadened guard (no first-person leaks introduced; the regex tightens what's caught but the current authored content is already third-person). Run `pnpm test tests/build/chat-knowledge-voice.test.ts tests/api/chat-voice-split.test.ts` until GREEN. Then run TEST-03 anthropic-payload-shape: `pnpm test tests/api/` to confirm cross-phase anchor holds. Stage the 3 files + src/data/portfolio-context.json (only if the build script rewrites it identically — git diff should show no content change) and commit `fix(quick-260513-hqk): WR-02 extend first-person leak regex (verbs, possessives, British, curly quote)`.</action>
  <verify>
    <automated>pnpm test tests/build/chat-knowledge-voice.test.ts tests/api/chat-voice-split.test.ts tests/api/sse-snapshot.test.ts</automated>
  </verify>
  <done>FIRST_PERSON_LEAK_RE byte-identical across all 3 sites; new KNOWN_LEAKS entries all GREEN; negative-control still GREEN; portfolio-context.json passes the broadened guard; D-15 + TEST-03 anchors GREEN; commit landed.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: WR-03 — readStringField rejects escaped quotes with explicit error</name>
  <files>scripts/build-chat-context.mjs</files>
  <behavior>
    - Mirror the existing comma-in-array guard pattern (build-chat-context.mjs:187-193): explicit `throw new Error(...)` rather than silent regex bypass.
    - In `readStringField` (line 139-153), AFTER the quoted regex match succeeds and BEFORE returning the trimmed value, inspect the captured group for an escaped-quote token `\"`. If present, `throw new Error(\`${fieldName}: escaped quote (\\\\\\") inside quoted string is not supported; use a different phrasing or update readStringField to handle YAML escapes\`)`.
    - Whitespace-only values: keep the current `.trim()` behavior (downstream falsy check handles the empty-string case correctly per WR-03 analysis — not a real bug, no change needed).
    - No test file changes required — this is latent-defect hardening only. The current 6 chatSummary values have no embedded quotes (per WR-03 reading), so existing tests stay GREEN. The error path is verified by the existing build script's chatSummary-required guard.
  </behavior>
  <action>Edit scripts/build-chat-context.mjs readStringField (line 139-153). After the `if (quoted)` branch's `quoted[1].trim()` capture, check `if (quoted[1].includes('\\"')) throw new Error(...)`. Add a JSDoc note in the comment block (line 130-138) referencing WR-03 and the parallel comma-in-array guard pattern. Run `pnpm build:chat-context` to confirm the existing MDX files build cleanly (no chatSummary has an escaped quote). Run `pnpm test` to confirm no test regressions. Stage scripts/build-chat-context.mjs and commit `fix(quick-260513-hqk): WR-03 readStringField rejects escaped quotes explicitly`.</action>
  <verify>
    <automated>pnpm build:chat-context && pnpm test tests/build/ tests/api/sse-snapshot.test.ts</automated>
  </verify>
  <done>readStringField throws on `\"` inside quoted body with diagnostic message mirroring the comma-in-array guard; existing build still GREEN; all tests GREEN; D-15 anchor preserved; commit landed.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 4: WR-04 — Second optional-chain on pageswap handler + test regex update</name>
  <files>src/layouts/BaseLayout.astro, tests/build/view-transition-handler.test.ts</files>
  <behavior>
    - BaseLayout.astro line 106: change `e.viewTransition?.finished.catch(() => {})` to `e.viewTransition?.finished?.catch(() => {})`. One byte added.
    - view-transition-handler.test.ts line 40: relax the regex from `/viewTransition\?\.finished\.catch\(/` to `/viewTransition\?\.finished\??\.catch\(/`. The `\??` makes the second optional-chain optional in the assertion (accepts both old and new forms during the transition; tightening to `\?\.` exclusively is fine too, but the relaxed form is more forgiving for future contributors).
    - All other view-transition-handler.test.ts assertions stay unchanged (pageswap listener present, is:inline script wrapper, in <head>).
  </behavior>
  <action>Edit src/layouts/BaseLayout.astro line 106 to add the second optional-chain (`?.catch`). Update the surrounding comment block (lines 96-105) to reference WR-04 closure. Edit tests/build/view-transition-handler.test.ts line 40 with the relaxed regex `\?\.finished\??\.catch\(`. Run `pnpm test tests/build/view-transition-handler.test.ts` until GREEN. Run `pnpm exec astro check` to confirm the .astro file parses cleanly. Stage both files and commit `fix(quick-260513-hqk): WR-04 defensive optional-chain on pageswap finished.catch`.</action>
  <verify>
    <automated>pnpm test tests/build/view-transition-handler.test.ts && pnpm exec astro check</automated>
  </verify>
  <done>BaseLayout pageswap handler uses double optional-chain; test regex accepts both forms; astro check GREEN; commit landed.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 5: WR-05 — matchAll for #chat-panel + duplicate-detection assertion</name>
  <files>tests/build/no-inline-display-on-chat-panel.test.ts</files>
  <behavior>
    - Replace the brittle `src.match(/<div\s+id="chat-panel"\s+style="([^"]+)"/)` (line 25) with a `matchAll` loop using `/<div\s[^>]*\bid="chat-panel"[^>]*>/g` that tolerates arbitrary attribute order.
    - For each matched panel-tag string, assert it does NOT contain a `style="..."` segment with a `display:` token. Use a per-match regex: `expect(match[0]).not.toMatch(/style="[^"]*display\s*:/)`.
    - Add a second assertion at the end of the test: `expect([...src.matchAll(/<div\s[^>]*\bid="chat-panel"[^>]*>/g)].length).toBe(1)` — catches accidental duplicate `#chat-panel` elements.
    - Keep the existing top-of-file JSDoc + the descriptive `throw new Error("Could not locate...")` semantics — if zero matches, the new exactly-one assertion (`.toBe(1)`) fails with a clearer message than the bare `match` returning null.
    - Use a more helpful failure message on the duplicate-count assertion: pass a second argument to `expect` (or a context message in the matcher) to call out the WR-05 scenario.
  </behavior>
  <action>Rewrite the single `it(...)` block in tests/build/no-inline-display-on-chat-panel.test.ts (line 23-37) per the behavior block. The describe block name stays the same. Run `pnpm test tests/build/no-inline-display-on-chat-panel.test.ts` until GREEN against the current ChatWidget.astro markup (which has exactly one #chat-panel div). Run the D-26 chat-surface battery again to confirm nothing else regressed: `pnpm test tests/client/ tests/api/chat-voice-split.test.ts tests/build/no-inline-display-on-chat-panel.test.ts tests/api/sse-snapshot.test.ts`. Stage tests/build/no-inline-display-on-chat-panel.test.ts and commit `fix(quick-260513-hqk): WR-05 matchAll-based panel test tolerant of attribute order`.</action>
  <verify>
    <automated>pnpm test tests/build/no-inline-display-on-chat-panel.test.ts tests/api/sse-snapshot.test.ts</automated>
  </verify>
  <done>Test uses matchAll, tolerates attribute reordering, asserts exactly one #chat-panel div; ChatWidget.astro markup passes; D-26 + D-15 anchors hold; commit landed.</done>
</task>

<task type="auto">
  <name>Task 6: Full verification — pnpm test + astro check + cross-phase anchor confirmation + SUMMARY</name>
  <files>.planning/quick/260513-hqk-v1-3-closeout-close-phase-17-review-warn/260513-hqk-SUMMARY.md</files>
  <action>Run the full verification battery to confirm the v1.3 closeout is clean: (1) `pnpm test` — entire suite GREEN. (2) `pnpm exec astro check` — TypeScript + .astro type-check passes. (3) `pnpm build:chat-context` — regenerates portfolio-context.json without first-person leak errors. (4) Explicitly confirm cross-phase anchors: D-15 sse-snapshot (`pnpm test tests/api/sse-snapshot.test.ts`), D-26 chat-surface battery (`pnpm test tests/client/ tests/api/chat-voice-split.test.ts tests/build/no-inline-display-on-chat-panel.test.ts`), TEST-03 anthropic-payload-shape (`pnpm test tests/api/`). If any of those fail, STOP and surface the failure — do NOT write the SUMMARY. (5) `git log --oneline -7` to confirm the 5 fix commits landed in order WR-01 → WR-05. (6) Write the SUMMARY at .planning/quick/260513-hqk-v1-3-closeout-close-phase-17-review-warn/260513-hqk-SUMMARY.md following $HOME/.claude/get-shit-done/templates/summary.md format. Include: (a) the 5 WR-NN warnings closed with the file paths touched, (b) the cross-phase anchor verification table showing each anchor's test command + GREEN status, (c) the explicit confirmation that 17-REVIEW-GAPS.md is now fully closed (0 open Warnings), (d) reference to .planning/v1.3-MILESTONE-AUDIT.md indicating which audit buckets this closeout addresses. Note: orchestrator handles the SUMMARY commit in Step 8 — do NOT commit the SUMMARY here.</action>
  <verify>
    <automated>pnpm test && pnpm exec astro check && pnpm build:chat-context</automated>
  </verify>
  <done>Full pnpm test GREEN; astro check GREEN; build:chat-context regenerates without errors; D-15, D-26, TEST-03 anchors confirmed GREEN; 5 atomic fix commits landed in WR-01..WR-05 order; SUMMARY file written (commit deferred to orchestrator).</done>
</task>

</tasks>

<verification>
- `pnpm test` — full Vitest suite GREEN at every task boundary (the verify blocks gate each commit).
- `pnpm exec astro check` — TypeScript + .astro type-check GREEN after Task 4 (the only .astro edit).
- `pnpm build:chat-context` — regenerates src/data/portfolio-context.json without first-person leak guard errors after Task 2.
- Cross-phase anchors (every commit must preserve all three):
  - **D-15 sse-snapshot**: `tests/api/sse-snapshot.test.ts` GREEN (no SSE surface touched in any task).
  - **D-26 chat-surface battery**: `tests/client/` + `tests/api/chat-voice-split.test.ts` + `tests/build/no-inline-display-on-chat-panel.test.ts` GREEN. Re-run explicitly after Tasks 1 and 5 (the two tasks that touch D-26 file set: chat.ts and ChatWidget.astro test).
  - **TEST-03 anthropic-payload-shape**: `tests/api/` GREEN (re-run after Task 2's regex broadening to confirm system-block payload still passes the tighter guard).
- All 5 fix commits land atomically with the message pattern `fix(quick-260513-hqk): WR-NN brief description`.
- Final SUMMARY at .planning/quick/260513-hqk-v1-3-closeout-close-phase-17-review-warn/260513-hqk-SUMMARY.md following the GSD summary template (orchestrator commits this in Step 8).
</verification>

<success_criteria>
- All 5 Warnings in .planning/phases/17-foundations-migration-dns-debt-sweep/17-REVIEW-GAPS.md are addressed in source code with corresponding test updates where applicable.
- 17-REVIEW-GAPS.md "Warnings" count effectively drops from 5 to 0 (the file itself is not edited — the closure is recorded in the SUMMARY and via the landed commits).
- `pnpm test` ends GREEN. `pnpm exec astro check` ends GREEN. `pnpm build:chat-context` ends GREEN.
- D-15 (SSE byte-identical), D-26 (chat-surface), TEST-03 (anthropic-payload-shape) anchors confirmed GREEN.
- Git log shows 5 atomic `fix(quick-260513-hqk): WR-NN ...` commits in order WR-01 → WR-05, plus the SUMMARY (committed by orchestrator).
- Clipboard-failure path now shows accent-red "COPIED" for the full 1500ms window (WR-01 behavioral fix verified by the new "WR-01: class added even when clipboard rejects" test).
</success_criteria>

<output>
After completion, the SUMMARY at `.planning/quick/260513-hqk-v1-3-closeout-close-phase-17-review-warn/260513-hqk-SUMMARY.md` records:
- The 5 WR-NN closures with file paths touched per warning.
- Cross-phase anchor verification table (D-15, D-26, TEST-03 — each with test command + GREEN status).
- Confirmation that 17-REVIEW-GAPS.md is fully closed (0 open Warnings).
- Reference to .planning/v1.3-MILESTONE-AUDIT.md indicating which audit buckets are now drained.
</output>
