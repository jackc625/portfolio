---
status: complete
phase: 17-foundations-migration-dns-debt-sweep
source: [17-01-SUMMARY.md, 17-02-SUMMARY.md, 17-03-SUMMARY.md, 17-04-SUMMARY.md, 17-05-SUMMARY.md, 17-06-SUMMARY.md]
started: 2026-05-10T00:00:00Z
updated: 2026-05-11T00:00:00Z
retest: 2026-05-11 — all 4 fixed gaps (UAT-GAP-01..04, Plans 17-07/08/09/10) re-tested and PASS on pnpm dev. Production deploy unblocked from a code-correctness standpoint; HUMAN-UAT.md still tracks dashboard/DNS/post-deploy items.
---

## Current Test

[testing complete — all 10 tests pass after re-test]

## Tests

### 1. Cold Start Smoke Test (production Worker)
expected: Open a fresh incognito window. Visit https://jackcutrara.com/. Page loads with HTTP 200, homepage renders, no console errors. This catches Worker startup issues from the Pages → Workers Static Assets cutover.
result: pass

### 2. Apex domain (jackcutrara.com) browses correctly
expected: |
  RE-TEST: On `pnpm dev` localhost:4321, open DevTools Console. Navigate rapidly home → projects → about → home (click links faster than transitions complete). NO `AbortError: Transition was skipped` appears. (Fix: Plan 17-10 pageswap handler in BaseLayout.)
result: pass
prior_result: issue (2026-05-10) — "Uncaught (in promise) AbortError: Transition was skipped" on apex nav. Fix commit: 8fe670c.
retest_pass: 2026-05-11 — UAT-GAP-04 fix verified on pnpm dev.

### 3. www subdomain (www.jackcutrara.com) loads correctly
expected: Visit https://www.jackcutrara.com/. Page loads with HTTPS (no 525 SSL handshake error — the parking-page CNAME issue from Plan 17-02 Task 5 is fixed). Content matches the apex.
result: pass

### 4. Chat widget streams response on production
expected: |
  RE-TEST UAT-GAP-01 (voice-split): On `pnpm dev` localhost:4321, click chat bubble. Send `hi`. Bot greets the VISITOR (e.g., "Hi! How can I help you learn about Jack?") — NOT "Hey Jack". Then send `who am i`. Bot says it does NOT know who you are / asks you to introduce yourself — does NOT identify the visitor AS Jack. (Fix: Plan 17-07 third-person about-chat sources + leak guard.)
result: pass
prior_result: issue (2026-05-10) — "chatbot assumes user is Jack". Fix commits: 537a0e6, 05bf93d, 2aa627d.
retest_pass: 2026-05-11 — UAT-GAP-01 fix verified on pnpm dev.

### 5. Chat panel scale-in animation (DEBT-05 CSS state machine)
expected: Click the chat bubble. The panel appears with a brief scale-in animation from the bottom-right corner (~180ms, transform-origin bottom-right). Panel is fully visible after the animation completes.
result: pass

### 6. Chat panel closes cleanly (DEBT-05)
expected: With the chat panel open, click the close (X) button. The panel hides immediately. Re-opening it (click bubble again) shows the panel again with the scale-in animation. Open/close cycles do not visually glitch.
result: pass

### 7. Reduced-motion users see the chat panel (DEBT-05 display rules outside no-preference)
expected: In DevTools (Rendering tab), set "Emulate CSS prefers-reduced-motion: reduce". Click the chat bubble. The panel appears INSTANTLY with no scale-in animation but is fully visible and usable. Type a message and confirm streaming still works.
result: pass

### 8. DEV-only client metrics log fires (DEBT-02 client seam, manual dev verification)
expected: |
  RE-TEST UAT-GAP-02 (panel-open on dev): On `pnpm dev` localhost:4321, click chat bubble. Panel OPENS (scale-in animation, fully visible). Send a message. After the response completes, DevTools Console shows ONE `chat.response_metrics_client` log line with shape `{ elapsed_ms: <integer> }`. (Fix: Plan 17-08 removed inline display:none from #chat-panel; CSS state machine now wins.)
result: pass
prior_result: issue (2026-05-10) — "chatbot sidebar isnt even popping up" on pnpm dev. Fix commits: 7f529a0, ce0d2af, 7af2841.
retest_pass: 2026-05-11 — UAT-GAP-02 fix verified on pnpm dev; panel opens and metrics log fires.

### 9. COPY button label transitions on bot messages (WR-02 fix)
expected: |
  RE-TEST UAT-GAP-03: On `pnpm dev` localhost:4321, send a chat message, wait for bot response. Hover over the bot message — COPY button appears. Click it. The button STAYS visible and the label briefly changes to "COPIED" (or similar) for ~1.5s, then returns to "COPY". (Fix: Plan 17-09 .copy-success CSS rule pins button visible during feedback + aligned timeout windows.)
result: pass
prior_result: issue (2026-05-10) — "it never changes to COPIED". Fix commits: dcf597b, b35ad94.
retest_pass: 2026-05-11 — UAT-GAP-03 fix verified on pnpm dev; COPIED label visible.

### 10. Long chat stream does not time out prematurely (WR-01 fix)
expected: Send a chat message that takes a long time to fully stream (e.g., "Tell me everything about Jack's portfolio in detail — projects, skills, background, the chat widget, all of it"). The stream continues for >30s without aborting; the response completes naturally without a "timeout" / abort error in the UI.
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0
blocked: 0

retest_note: All 4 prior issues (tests 2, 4, 8, 9) re-tested 2026-05-11 against `pnpm dev` localhost:4321 and PASS. Fix commits: Plan 17-07 (UAT-GAP-01), 17-08 (UAT-GAP-02), 17-09 (UAT-GAP-03), 17-10 (UAT-GAP-04). Original Gaps section below preserved as diagnostic history.

## Gaps

- truth: "Chat widget addresses VISITORS (recruiters/engineers) and describes Jack in third person — does not assume the user is Jack (CHAT-06 voice-split contract)"
  status: failed
  reason: |
    User reported: chatbot greeted visitor as 'Hey Jack' and, when asked 'who am i', described the visitor AS Jack. Voice-split regression — bot speaks AS Jack rather than ABOUT Jack to visitors. Memory note: project_voice_split.md flags this exact failure mode.
  severity: blocker
  test: 4
  root_cause: |
    The chat system prompt's <knowledge> block at src/prompts/system-prompt.ts:57-59 injects src/data/portfolio-context.json verbatim via JSON.stringify(context, null, 2). That JSON ships first-person prose authored for the website surface — about.{intro,p1,p2,p3} and experience at portfolio-context.json:178-184 (verbatim copies of ABOUT_INTRO/ABOUT_P1/ABOUT_P3 from src/data/about.ts:7-20) plus 6 first-person caseStudy fields from src/content/projects/*.mdx ("I architected...", "I chose..."). The biographer instruction at src/prompts/system-prompt.ts:4-15 cannot reliably override ~30KB of first-person voice signal — the model anchors on the dominant voice. scripts/build-chat-context.mjs:258 + 367-396 perform no voice transformation; the build pipeline never enforced the voice split.
  artifacts:
    - path: "src/data/portfolio-context.json"
      issue: "Lines 178-184 (about.{intro,p1,p2,p3}, experience) ship first-person prose to the model"
    - path: "scripts/build-chat-context.mjs"
      issue: "Lines 258, 367-396 copy first-person prose verbatim with no voice transformation; no leak-detection guard"
    - path: "src/prompts/system-prompt.ts"
      issue: "Biographer instruction is correct but cannot defeat the volume of first-person knowledge text"
    - path: "src/data/about.ts"
      issue: "First-person source of truth — correct for site surface; do NOT change"
    - path: "src/content/projects/*.mdx"
      issue: "First-person case-study bodies — correct for site surface; do NOT change"
  missing:
    - "Hand-authored third-person variants of the about block (sibling exports in about.ts OR new src/data/about-chat.ts)"
    - "Per-project third-person chat summary fields (chat: block / fenced section in each MDX OR sibling chat-summary file)"
    - "build-chat-context.mjs change to merge third-person variants into chat-knowledge JSON instead of first-person originals"
    - "First-person-leak regex sweep in build-chat-context.mjs that exits non-zero on match (e.g., \\b(I'?m |I built|I architected|I chose|My approach)\\b)"
    - "Chat-API regression test asserting response to 'hi' contains neither 'Hey Jack' nor 'you're Jack'"
    - "Optional defense-in-depth: explicit 'translate first-person citations to third-person' instruction in system-prompt.ts <role>"
  debug_session: ".planning/debug/chat-voice-split-regression.md"

- truth: "COPY button on bot messages briefly transitions to COPIED label after click (WR-02 fix preserves the createCopyButton helper's COPY/COPIED transition)"
  status: failed
  reason: "User reported: 'No, it never changes to COPIED'. Click handler swap of textContent runs correctly per createCopyButton at chat.ts:339-347, but the visible result is hidden by CSS opacity: 0 + hover-only reveal."
  severity: major
  test: 9
  root_cause: |
    .chat-copy-btn is opacity: 0 by default in src/styles/global.css:371-398, revealed only via .chat-message-wrapper:hover .chat-copy-btn (mouse hover on wrapper) and .chat-copy-btn:focus-visible (keyboard focus only — does NOT match mouse-click focus per WHATWG spec). After click, cursor moves off the button, the wrapper hover is lost, and the 200ms opacity transition hides the COPIED label before the user can see it. WR-02 was correctly applied (handler fires, textContent swaps to "COPIED" then back to "COPY" after 1000ms), but the .copy-success class added by copyToClipboard at chat.ts:311-319 has no CSS rule consuming it — pre-existing dead affordance. The bug is in the JS/CSS boundary, not in the handler.
  artifacts:
    - path: "src/styles/global.css"
      issue: "Lines 371-398: .chat-copy-btn opacity: 0 with hover-only / focus-visible-only reveal selectors. No rule consumes the .copy-success class added by JS."
    - path: "src/scripts/chat.ts"
      issue: "Lines 311-319: .copy-success class added for 2000ms with no CSS consumer. Lines 332-349: createCopyButton click handler is correct (1000ms textContent swap); timing is misaligned with .copy-success window (2000ms)."
  missing:
    - "CSS rule near global.css:393: .chat-copy-btn.copy-success { opacity: 1; color: var(--accent); } — pins button visible during feedback regardless of hover"
    - "Align the two timeout windows in chat.ts (1000ms text swap vs 2000ms class swap) to a single shared duration so the user never sees COPY flash before fade-out"
    - "Optional: visual regression assertion that COPIED label is reachable in the post-click DOM state"
  debug_session: ".planning/debug/copy-button-no-copied-transition.md"

- truth: "Chat panel opens on click in local dev (pnpm dev / http://localhost:4321/), parity with production AND survives the next production deploy that ships DEBT-05"
  status: failed
  reason: |
    User reported: 'the chatbot sidebar isnt even popping up' on `pnpm dev`. CRITICAL: production at jackcutrara.com is still PRE-DEBT-05 (local main is 23 commits ahead of origin/main; commit 1c148c9 has never been deployed). When DEBT-05 deploys, production will break the same way as dev today. This is a release blocker for the next deploy, not a dev-only annoyance.
  severity: blocker
  test: 8
  root_cause: |
    DEBT-05 moved #chat-panel display contract from JS into CSS state machine (src/styles/global.css:699-706: #chat-panel { display: none } + #chat-panel.is-open { display: flex }, neither marked !important). But ChatWidget.astro:55 declares the panel with inline style="display: none; position: fixed; ...". Inline styles (specificity 1,0,0,0) beat selector-based stylesheet rules without !important. After DEBT-05, openPanel() at chat.ts:615-708 only adds .is-open class — no longer overwrites panel.style.display — so inline display: none permanently wins. Production "works" only because pre-DEBT-05 chat.ts JS still imperatively writes panel.style.display = "flex", overwriting the inline declaration at the same specificity tier. tests/client/chat-panel-display.test.ts:20-29 fixture uses bare <div id="chat-panel"></div> with NO inline style — false-green coverage that hid the regression.
  artifacts:
    - path: "src/components/chat/ChatWidget.astro"
      issue: "Line 55: inline style=\"display: none; position: fixed; ...\" on #chat-panel beats CSS state machine"
    - path: "src/styles/global.css"
      issue: "Lines 699-706: #chat-panel display rules without !important; lose to inline style"
    - path: "src/scripts/chat.ts"
      issue: "Lines 615-708: openPanel/closePanel only toggle .is-open; no panel.style.display writes (DEBT-05 removed them) — class toggle alone is now insufficient against the inline style"
    - path: "tests/client/chat-panel-display.test.ts"
      issue: "Lines 20-29: fixture missing the inline style; never exercised real component markup; false-green coverage"
  missing:
    - "Either (Option A, recommended): remove `display: none;` from inline style on ChatWidget.astro:55 — lets CSS state machine win cleanly"
    - "Or (Option B): add !important to both CSS rules at global.css:699-706 — preserves SSR FOUC protection but louder mechanism"
    - "Update tests/client/chat-panel-display.test.ts fixture to match real ChatWidget.astro markup (inline style included)"
    - "Re-run chat-surface battery (must stay 145/145 GREEN) and re-verify D-15 sse-snapshot 3/3 GREEN"
  debug_session: ".planning/debug/chat-panel-not-opening-dev.md"

- truth: "Site navigation between pages on https://jackcutrara.com completes without uncaught console errors"
  status: failed
  reason: "User reported: Got this error message in the console: Uncaught (in promise) AbortError: Transition was skipped during apex navigation."
  severity: major
  test: 2
  root_cause: |
    src/styles/global.css:539-541 declares @view-transition { navigation: auto; } (added Phase 16-04, commit 995f5b2) opting into browser-native cross-document View Transitions. When transitions are superseded (rapid clicks, prefetch races, back/forward, document-hidden flips), the W3C CSS View Transitions Module L2 spec mandates the implicit ViewTransition.finished Promise reject with DOMException AbortError "Transition was skipped". The codebase has zero handlers — no <ClientRouter />, no document.startViewTransition call (intentionally — Phase 8-03 atomic removal commit c5d0911 + enforcement test motion-doc.test.ts:101), no pageswap/pagereveal listener, no global unhandledrejection guard. Nothing observes the implicit ViewTransition object, so the rejection has nowhere to be caught. CSS rule has been live since 2026-04-27; Pages → Workers cutover likely raised visibility via different prefetch/cache timing. Cosmetic noise (navigation completes correctly), but matters for the polish promise to engineers who open DevTools.
  artifacts:
    - path: "src/layouts/BaseLayout.astro"
      issue: "Missing head-level handler that consumes the implicit ViewTransition Promise rejection"
    - path: "src/styles/global.css"
      issue: "Lines 539-541: @view-transition { navigation: auto } opt-in is correct (MOTN-01 contract); not the bug — but pairs with missing JS handler"
    - path: "design-system/MOTION.md"
      issue: "§5 MOTN-01 row locks visual contract but does not spec the rejection-handling contract — latent spec gap"
  missing:
    - "Add inline <script> in BaseLayout.astro head: window.addEventListener('pageswap', (e) => { e.viewTransition?.finished.catch(() => {}); }) — ~60 bytes, runs on every cross-document nav, swallows only the implicit transition's rejection"
    - "Update MOTION.md §5 with the rejection-handling contract alongside MOTN-01's visual contract"
    - "Vitest build-time assertion mirroring tests/client/reduced-motion.test.ts and tests/build/motion-css-rules.test.ts patterns to lock the handler in place"
  debug_session: ".planning/debug/view-transition-aborterror.md"
