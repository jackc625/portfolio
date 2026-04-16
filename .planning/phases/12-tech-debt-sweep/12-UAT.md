---
status: complete
phase: 12-tech-debt-sweep
source:
  - 12-01-build-warnings-sweep-SUMMARY.md
  - 12-02-mobilemenu-chatwidget-inert-SUMMARY.md
  - 12-03-chat-copy-button-parity-SUMMARY.md
  - 12-04-og-url-production-verify-SUMMARY.md
  - 12-05-master-token-exceptions-SUMMARY.md
  - 12-06-audit-closeout-SUMMARY.md
started: 2026-04-15T00:00:00Z
updated: 2026-04-15T06:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Run `pnpm dev` from clean shell. Server boots without errors/warnings, http://localhost:4321 renders hero+nav+chat bubble, no console errors.
result: fixed
reported: "It boots and renders fine, but first the console throws an error. Read the file LOGS.txt for context."
severity: minor
evidence: |
  LOGS.txt captured: Vite dep-optimizer throws "The file does not exist at
  .vite/deps_ssr/chunk-7VRFT6OE.js" (and chunk-FW4QRCOW.js) during first
  SSR request at 17:41:12, followed by full-reload. Subsequent loads succeed
  (200 / at 17:41:15 and 17:41:17). A second [WARN] on 17:41:16 flags
  .vite/deps/audit-GII5XVTN.js missing after optimizer reloaded for
  marked/dompurify. Pages render correctly; errors are dev-only startup
  noise from the Vite dep optimizer race under the Cloudflare vite-plugin.
fix: |
  Diagnosed in .planning/debug/vite-dep-optimizer-cold-start.md as a
  Vite cold-start race amplified by @cloudflare/vite-plugin's miniflare
  loopback. Shipped 6-line fix in astro.config.mjs: optimizeDeps.include
  for [astro-seo, marked, dompurify] + ssr.optimizeDeps.include for
  [astro-seo]. Verified clean cold start by Jack 2026-04-15. Commit f36818a.

### 2. Mobile Menu Traps Focus (Chat Widget Inert)
expected: Narrow the browser so the header container is ≤380px wide (design D-06 container query — hamburger trigger only appears at that width). Open mobile menu via hamburger. Tab/Shift+Tab cycles only through menu links + close button. Chat bubble cannot be reached by keyboard. Close menu — chat bubble is Tab-reachable again.
result: skipped
reason: "Deferred pending design change. Jack opted to change D-06 so the mobile menu appears at <768px instead of ≤380px. Captured as todo .planning/todos/pending/2026-04-15-change-mobile-menu-breakpoint-from-380px-to-768px.md. Re-run this test after that breakpoint change ships."

### 3. Chat Copy Button — Live Stream
expected: Open chat, send a message, wait for bot reply. A "COPY" button appears on the bot message. Click it → label flips to "COPIED" briefly (~1s) then back to "COPY". Clipboard contains the bot message text.
result: pass

### 4. Chat Copy Button — Replay Parity
expected: After step 3, close chat and reopen it. The replayed bot message from history shows a COPY button visually identical (same size, position, font, color) to the one you just clicked. Click it — same COPY→COPIED→COPY transition, clipboard gets the same text.
result: pass

### 5. Production OG Preview URLs
expected: On jackcutrara.com, share/paste the URL for `/`, `/about`, `/projects`, `/projects/seatwatch`, and `/contact` into a link preview tool (Slack/Discord/Facebook debugger/Twitter). Each preview shows the correct absolute URL and image — no localhost, no preview hostname, no double-prefix corruption.
result: issue
reported: "Everything looks fine except for the fact that we are missing an OG image"
severity: major
evidence: |
  og:url plumbing verified OK (DEBT-03 5/5 curl evidence in 12-VALIDATION.md
  remains valid). og-default.png exists in public/, serves 200 OK on prod at
  correct 1200×630 dimensions, but the file is only 3,631 bytes — effectively
  a blank placeholder. Social-media unfurl cards render with no meaningful
  visual content. The issue is image asset quality, not URL resolution
  plumbing. Captured as todo:
  .planning/todos/pending/2026-04-15-design-and-ship-og-default-image.md.

## Summary

total: 5
passed: 2
issues: 1
fixed: 1
pending: 0
skipped: 1

## Gaps

- truth: "Cold start `pnpm dev` boots without console errors; first page load succeeds without Vite dep-optimizer errors"
  status: closed
  reason: "User reported: It boots and renders fine, but first the console throws an error. Read the file LOGS.txt for context."
  severity: minor
  test: 1
  artifacts:
    - LOGS.txt
    - .planning/debug/vite-dep-optimizer-cold-start.md
  missing: []
  resolution: "Fixed inline 2026-04-15 by adding optimizeDeps.include + ssr.optimizeDeps.include in astro.config.mjs (commit f36818a). Cold-start re-verified clean by Jack."

- truth: "Production social-media unfurls show a designed OG image on every page"
  status: failed
  reason: "User reported: Everything looks fine except for the fact that we are missing an OG image"
  severity: major
  test: 5
  artifacts:
    - public/og-default.png (3,631-byte placeholder)
    - .planning/todos/pending/2026-04-15-design-and-ship-og-default-image.md
  missing:
    - Designed 1200×630 og-default.png matching editorial design system
    - (optional) per-project og:image overrides
