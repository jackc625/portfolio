---
status: complete
phase: 17-foundations-migration-dns-debt-sweep
source: [17-01-SUMMARY.md, 17-02-SUMMARY.md, 17-03-SUMMARY.md, 17-04-SUMMARY.md, 17-05-SUMMARY.md, 17-06-SUMMARY.md]
started: 2026-05-10T00:00:00Z
updated: 2026-05-10T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test (production Worker)
expected: Open a fresh incognito window. Visit https://jackcutrara.com/. Page loads with HTTP 200, homepage renders, no console errors. This catches Worker startup issues from the Pages → Workers Static Assets cutover.
result: pass

### 2. Apex domain (jackcutrara.com) browses correctly
expected: On https://jackcutrara.com, navigate around the site (home → projects → about → back). Each page loads, navigation links work, no broken images, no SSL errors. Content matches what was on the old Pages deploy byte-equivalent.
result: issue
reported: "Got this error message in the console: Uncaught (in promise) AbortError: Transition was skipped"
severity: major

### 3. www subdomain (www.jackcutrara.com) loads correctly
expected: Visit https://www.jackcutrara.com/. Page loads with HTTPS (no 525 SSL handshake error — the parking-page CNAME issue from Plan 17-02 Task 5 is fixed). Content matches the apex.
result: pass

### 4. Chat widget streams response on production
expected: On https://jackcutrara.com, click the chat bubble (bottom-right). Type "Hi" and submit. A response streams in token-by-token (not all at once, not blank). Stream completes cleanly. This verifies D-15 SSE byte-identical surface through the new Worker.
result: issue
reported: |
  We have a new bug. Never noticed before. The chatbot assumes the user is "Jack".
  Transcript:
    user: hi
    bot:  Hey Jack. What would you like to know?
    user: who am i
    bot:  You're Jack Cutrara, a software engineer based in Virginia... [continues describing the visitor AS Jack]
  (Streaming itself worked — the regression is voice/identity in the system prompt.)
severity: blocker

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
expected: Run `pnpm dev`. Open http://localhost:4321/, open DevTools Console, click chat bubble, send a message. After the response completes, the Console shows ONE `chat.response_metrics_client` log line with shape `{ elapsed_ms: <integer> }`. (Production is tree-shaken; this verifies the dev seam.)
result: issue
reported: "It's failing by the way, the chatbot sidebar isnt even popping up"
severity: major
note: Could not get to the cache_metrics log assertion because the chat panel itself does not open on `pnpm dev` localhost (production-side panel-open works — Test 5 + Test 6 passed against jackcutrara.com). Dev-only regression in chat panel mount/open path.

### 9. COPY button label transitions on bot messages (WR-02 fix)
expected: In the chat panel on production, after a bot response renders, hover over the bot message — a COPY button appears. Click it. The label briefly changes to "COPIED" (or similar), then returns to "COPY". The button is fully wired (not a dead-clone).
result: issue
reported: "No, it never changes to \"COPIED\""
severity: major

### 10. Long chat stream does not time out prematurely (WR-01 fix)
expected: Send a chat message that takes a long time to fully stream (e.g., "Tell me everything about Jack's portfolio in detail — projects, skills, background, the chat widget, all of it"). The stream continues for >30s without aborting; the response completes naturally without a "timeout" / abort error in the UI.
result: pass

## Summary

total: 10
passed: 6
issues: 4
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "COPY button on bot messages briefly transitions to COPIED label after click (WR-02 fix preserves the createCopyButton helper's COPY/COPIED transition)"
  status: failed
  reason: "User reported: 'No, it never changes to COPIED'. Click does not produce the visual COPIED feedback that WR-02's `oldCopyBtn.replaceWith(createCopyButton(() => botContent))` rewire was supposed to restore. Either the helper isn't being invoked, the label-transition handler isn't firing, or the COPIED → COPY restore is happening too fast to see (unlikely if 'never' is literal). Investigate src/scripts/chat.ts createCopyButton + replay-path rewire."
  severity: major
  test: 9
  artifacts: []
  missing: []

- truth: "Site navigation between pages on https://jackcutrara.com completes without uncaught console errors"
  status: failed
  reason: "User reported: Got this error message in the console: Uncaught (in promise) AbortError: Transition was skipped"
  severity: major
  test: 2
  artifacts: []
  missing: []

- truth: "Chat widget addresses VISITORS (recruiters/engineers) and describes Jack in third person — does not assume the user is Jack (CHAT-06 voice-split contract)"
  status: failed
  reason: |
    User reported: chatbot greeted visitor as 'Hey Jack' and, when asked 'who am i', described the visitor AS Jack ('You're Jack Cutrara, a software engineer based in Virginia...'). Voice-split regression — chat is supposed to be third person about Jack, talking TO recruiters/visitors. Streaming itself worked; bug is in the system prompt / persona contract. Memory note: project_voice_split.md flags this exact failure mode ('Don't repeat my Plan-05 mistake').
  severity: blocker
  test: 4
  artifacts: []
  missing: []

- truth: "Chat panel opens on click in local dev (pnpm dev / http://localhost:4321/), parity with production"
  status: failed
  reason: |
    User reported: 'the chatbot sidebar isnt even popping up' on `pnpm dev`. Clicking the chat bubble does nothing (no scale-in, no panel mount). Production (Test 5 + Test 6 against jackcutrara.com) shows the panel opening + closing correctly, so this is a dev-only regression. Possible causes to investigate: Vite HMR initialization order against the new DEBT-04 idempotent astro:page-load registration in chat.ts (initChat may not be running on first load under dev), Astro 6 dev-server initial-mount difference vs SSR build, or stale dist artifacts shadowing the dev tree.
  severity: major
  test: 8
  artifacts: []
  missing: []
