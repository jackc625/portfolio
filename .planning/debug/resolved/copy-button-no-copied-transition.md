---
status: resolved
trigger: "No, it never changes to 'COPIED'"
created: 2026-05-10T00:00:00Z
updated: 2026-05-10T00:00:00Z
---

## Current Focus

hypothesis: "The COPY label never appears to change to COPIED because the button's
text DOES update via JS, but the entire button is invisible (opacity: 0) at the
exact moment the JS click handler runs. The label change happens off-screen / behind
opacity: 0, then reverts back to COPY before any condition can re-reveal the button
to the user. Specifically, the click on a touch / single-tap interaction or click
that loses :hover before the 1000ms timeout means the user sees no visible 'COPIED'
state at all. Even on hover-and-click on a desktop, the moment the user moves the
cursor off the wrapper (which is easy on a 12px wide button), the wrapper-hover
:hover rule disengages and the button fades back to opacity: 0 — hiding the COPIED
label."
test: "Read CSS rules for .chat-copy-btn opacity gating + click handler in createCopyButton"
expecting: "Confirm opacity: 0 base + :hover-only reveal contradicts JS that swaps text on click"
next_action: "Document root cause and return diagnosis"

## Symptoms

expected: |
  Clicking the COPY button on a bot message should:
  1. Copy the bot message text to the clipboard.
  2. Briefly change the button label to "COPIED" (or similar visual feedback).
  3. Restore the label to "COPY" after a short delay.
actual: "Button label never visibly changes to 'COPIED' after click"
errors: "(none — silent failure, no console errors)"
reproduction: |
  1. Open https://jackcutrara.com
  2. Open chat panel
  3. Send a message and wait for bot reply
  4. Hover over the bot message and click the COPY button
  5. Observe: label does not visibly change to COPIED
started: "Possibly always — predates Phase 17 WR-02 fix; WR-02 only fixed listener attachment"

## Eliminated

- hypothesis: "Hypothesis 1 — createCopyButton itself never had a working COPY/COPIED transition (helper body just copies + logs)"
  evidence: "src/scripts/chat.ts:339-347 — click handler explicitly does
    `copyBtn.textContent = 'COPIED'` and a 1000ms `setTimeout` that resets to 'COPY'.
    The transition logic IS present and would fire on every click."
  timestamp: 2026-05-10

- hypothesis: "Hypothesis 4 — WR-02 fix only fixed live-stream path; replay path still uses dead clone (or vice-versa)"
  evidence: "Both paths use `createCopyButton(...)`:
    - replay path: src/scripts/chat.ts:664 `const copyBtn = createCopyButton(() => msg.content);`
    - live-stream path post-WR-02: src/scripts/chat.ts:933 `oldCopyBtn.replaceWith(createCopyButton(() => botContent));`
    - createBotMessageEl: src/scripts/chat.ts:395 `const copyBtn = createCopyButton(() => content);`
    All three paths route through the same helper, which contains the COPY→COPIED→COPY logic.
    No bare addEventListener or cloneNode left anywhere in chat.ts after WR-02."
  timestamp: 2026-05-10

- hypothesis: "Hypothesis 5 — button DOES toggle but new label is something the user did not recognize"
  evidence: "src/scripts/chat.ts:341 sets textContent to the literal string 'COPIED' — exactly what the user is looking for. Color also swaps to var(--accent) which would make it more visible if the button were visible."
  timestamp: 2026-05-10

## Evidence

- timestamp: 2026-05-10
  checked: "src/scripts/chat.ts:332-349 — createCopyButton helper body"
  found: |
    Click handler is fully present and correct:
      copyBtn.addEventListener("click", () => {
        copyToClipboard(getContent(), copyBtn);
        copyBtn.textContent = "COPIED";        // Line 341
        copyBtn.style.color = "var(--accent)"; // Line 342
        setTimeout(() => {
          copyBtn.textContent = "COPY";        // Line 344
          copyBtn.style.color = "var(--ink-faint)";
        }, 1000);
      });
  implication: "JS-side transition logic is correct. The bug must be in CSS visibility/opacity gating that hides the label-change from the user."

- timestamp: 2026-05-10
  checked: "src/styles/global.css:371-398 — .chat-copy-btn styling"
  found: |
    .chat-copy-btn {
      opacity: 0;                           /* Line 373 — INVISIBLE BY DEFAULT */
      transition: opacity 200ms ease;       /* Line 374 — fade in/out over 200ms */
      ...
      position: absolute;
      top: -4px;
      right: 0;
    }
    .chat-message-wrapper:hover .chat-copy-btn {
      opacity: 1;                           /* Line 392 — visible only while hovering wrapper */
    }
    .chat-copy-btn:focus-visible {
      opacity: 1;                           /* Line 395 — visible while keyboard-focused */
      outline: 2px solid var(--accent);
    }
  implication: |
    The COPY button is opacity: 0 by default. It only becomes visible when:
    (a) the user is hovering the wrapper, OR
    (b) the button has :focus-visible (keyboard focus only — NOT mouse-click focus).

    Critically: there is NO selector for :focus or :active. Mouse click does
    not trigger :focus-visible (per WHATWG/W3C spec — :focus-visible activates
    only for keyboard navigation, not mouse). So after a mouse click, if the
    user moves the cursor off the wrapper at all (or if the cursor is between
    the absolute-positioned button and the wrapper), opacity transitions back
    to 0 — hiding "COPIED" entirely.

- timestamp: 2026-05-10
  checked: "src/scripts/chat.ts:311-319 — copyToClipboard"
  found: |
    Adds .copy-success class for 2000ms but no CSS rule for .copy-success exists in global.css (verified via grep — only chat.ts has the string). The class is dead — has no visual effect.
  implication: "The intended visual feedback path was (a) class swap consumed by CSS or (b) text swap. Only (b) actually runs, and (b) is hidden behind opacity: 0 for non-hovering users."

- timestamp: 2026-05-10
  checked: "src/scripts/chat.ts inline style on copy button (line 338)"
  found: |
    copyBtn.style.cssText = "position: absolute; top: -4px; right: 0; background: none; border: none; cursor: pointer;";
    Inline style does NOT set opacity, so the CSS rule (opacity: 0 + :hover reveal) wins.
  implication: "Confirms the click handler has no inline-opacity override that would keep the button visible during the 1000ms COPIED window."

## Resolution

root_cause: |
  src/styles/global.css:371-398 gates `.chat-copy-btn` visibility on
  `.chat-message-wrapper:hover` (mouse-hover only) and `.chat-copy-btn:focus-visible`
  (keyboard-only focus).

  The JS click handler at src/scripts/chat.ts:339-347 correctly swaps the textContent
  from "COPY" → "COPIED" and back, but the swap is invisible because the button has
  `opacity: 0` whenever the user is not actively hovering the wrapper, and `:focus-visible`
  does NOT fire on mouse-click focus per spec. After a mouse click, any small cursor
  movement away from the wrapper drops the :hover state and fades the button (and its
  newly-set "COPIED" text) to opacity: 0 within the 200ms transition.

  Common scenarios where the user sees no transition:
  - User hovers, clicks, then immediately moves cursor away → button fades out
    showing "COPIED" mid-fade, then fades back in 1000ms later already showing "COPY"
  - Touch / mobile: no :hover state at all — button must be tapped via initial fade-in
    interaction, then tap drops :hover, "COPIED" never visible
  - User keeps cursor still but the button is positioned `top: -4px; right: 0` outside
    the wrapper's hit zone after click — possible cursor-off-wrapper gap
  - Click handler runs synchronously, but if click is on the button edge, the cursor
    may leave the wrapper between mousedown and the next paint frame

  WR-02 (commit f58325d) correctly restored the click HANDLER. The bug is one layer
  below: the handler runs, the textContent updates, but CSS hides the result.

fix: "(empty — diagnose-only mode per task scope)"
verification: "(empty — diagnose-only mode per task scope)"
files_changed: []

---

## Affected Artifacts

- **src/styles/global.css:371-398** — `.chat-copy-btn` opacity gating uses only
  `:hover` (wrapper) and `:focus-visible` (keyboard). No `:focus` (mouse focus),
  no class-based "active feedback" override, no `:active` rule. This is what
  hides the COPIED label.

- **src/scripts/chat.ts:332-349** — `createCopyButton`. The click handler is correct;
  no fix needed in JS LOGIC. However, JS may need to participate in the fix by
  adding/removing a class that CSS can hook (see Closure path below).

- **src/scripts/chat.ts:311-319** — `copyToClipboard` already adds a `.copy-success`
  class for 2000ms, but no CSS rule consumes it. This is a pre-existing dead
  affordance that could be revived as part of the fix instead of inventing a new class.

## Missing Pieces

1. **A CSS rule that keeps the button visible while feedback is active.**
   `.copy-success` class is set by `copyToClipboard` for 2000ms but has no CSS
   selector — it's a no-op currently. The fix needs a CSS rule like
   `.chat-copy-btn.copy-success { opacity: 1; color: var(--accent); }` so the
   button stays visible regardless of :hover state during the feedback window.

2. **Time alignment between class window and label window.** The `.copy-success`
   class is held for 2000ms (chat.ts:315) but `textContent = "COPIED"` is held
   for only 1000ms (chat.ts:343). After 1000ms the label reverts to "COPY" but
   the button stays opacity: 1 for another second showing "COPY" — minor UX
   awkwardness. The two windows should match (recommend 1500ms for both,
   matching common copy-feedback UX patterns).

3. **No `:active` or `:focus` (non-:focus-visible) opacity rule.** Once a mouse
   user clicks the button, focus moves to the button but `:focus-visible` does
   not match (spec: only keyboard interactions trigger :focus-visible). Adding
   `.chat-copy-btn:focus { opacity: 1; }` would also keep the button visible
   immediately post-click on mouse, but a class-based approach (item 1) is more
   robust and doesn't depend on focus management edge cases.

## Closure Path (1-3 bullets)

- **Add a CSS rule that consumes `.copy-success`** in `src/styles/global.css`
  near line 393 (in the `.chat-copy-btn` block): `.chat-copy-btn.copy-success
  { opacity: 1; color: var(--accent); }`. This wires up the existing dead
  class to actually pin the button visible during the feedback window.

- **Align the timing windows in `src/scripts/chat.ts`**: change the
  `setTimeout` at line 343 from `1000` to match the `2000` in `copyToClipboard`
  (line 315) — or change both to a shared constant (e.g., `1500ms`). The text
  swap and the visibility class should expire together so the user never sees
  a flash of visible "COPY" between "COPIED" and the fade-out.

- **Optional defensive add: `.chat-copy-btn:focus { opacity: 1; }`** as a belt-
  and-suspenders rule for browsers/configs where mouse click does momentarily
  match :focus, costing nothing and improving robustness.

---

## Specialist Hint

`typescript` (TypeScript / DOM / CSS — bug is in the interaction between TS click
handler in chat.ts and CSS opacity gating in global.css; both files are TS-tooled
and the fix touches both layers).

---

## Closeout (v1.4 milestone pre-close audit, 2026-07-14)

**Resolution:** Fixed in v1.3 Phase 17 (UAT-GAP-03) — added the .copy-success CSS rule + COPY_FEEDBACK_MS=1500; COPIED label now shows for the full feedback window.

_Status flipped diagnosed/investigating → resolved and archived to debug/resolved/ during the v1.4 milestone close. No open work remains._
