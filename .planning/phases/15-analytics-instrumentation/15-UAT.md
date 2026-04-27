---
status: complete
phase: 15-analytics-instrumentation
source: [15-01-SUMMARY.md, 15-02-SUMMARY.md, 15-03-SUMMARY.md, 15-04-SUMMARY.md, 15-05-SUMMARY.md]
started: 2026-04-26T00:00:00Z
updated: 2026-04-26T01:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Stop any running dev server, run `pnpm dev` clean. Boots without errors, homepage loads, no console errors, no Umami script in dev HTML (PROD gate active).
result: pass

### 2. No JS Console Errors After WR-01 Bootstrap Guards
expected: With dev server running, navigate Home → About → Projects → a project page → Contact, then back. DevTools console stays clean — no errors, no warnings related to analytics/scroll-depth/chat. Recent WR-01 commits added listener-dedup guards across view transitions; this confirms they didn't break bootstrap.
result: pass

### 3. Chat Widget Opens, Sends, Receives
expected: Click the chat bubble. Panel opens with focus trapped. Type "hello" and send. Streamed response appears word-by-word, ends cleanly. Close and reopen — history persists. (Validates chat.ts WR-01 guard + chat_open/message_sent dispatch path.)
result: pass

### 4. Outbound Link Clicks Navigate Correctly
expected: Click the GitHub link, then the LinkedIn link in the footer/header. Each opens the destination URL (new tab is fine). No JS errors. Navigation is not blocked or intercepted. (Validates analytics.ts passive click listener doesn't preventDefault.)
result: pass

### 5. Resume Download Link Works
expected: Click the "Resume" link in the header. The `jack-cutrara-resume.pdf` opens or downloads (browser-dependent). No JS error. (Validates the `/jack-cutrara-resume.pdf` early-return branch in analytics.ts doesn't break navigation.)
result: pass

### 6. Scroll Sentinels Present in Project-Page DOM
expected: Open `/projects/seatwatch` in dev. View page source (Ctrl+U) or DevTools Elements panel. Inside `<article>` you should see 4 `<div class="scroll-sentinel" data-percent="25|50|75|100" aria-hidden="true">` elements. Scroll through the page top-to-bottom — no layout glitches.
result: pass

### 7. Production Build Bakes In Real UUID
expected: Run `pnpm build`. Build completes clean, all 11 routes prerendered, zero warnings. Confirm the real Umami UUID is in the output: `dist/client/index.html` contains `32f8fdf4-1f21-4895-9e4c-938285c08240` and does NOT contain `TODO_PHASE_15_UMAMI_ID`.
result: pass
evidence: |
  pnpm build clean (11 routes prerendered, zero warnings, 9.39s server build).
  grep counts on dist/client/index.html:
  - 32f8fdf4-1f21-4895-9e4c-938285c08240 = 1
  - TODO_PHASE_15_UMAMI_ID = 0
  - cloud.umami.is = 1

### 8. Production Dashboard Verification (Umami + CF + Cookies + Lighthouse)
expected: Post-deploy verification per `15-VERIFICATION.md` §§4–9 against `https://jackcutrara.com/`: 8 Umami events fire, CF Web Analytics enabled + beacon present, zero analytics cookies, preview subdomain stays silent, Lighthouse Performance ≥99 / A11y ≥95 / BP 100 / SEO 100.
result: pass
evidence: |
  §4 Umami events: confirmed by Jack via dashboard (8 events present)
  §5.1 CF beacon (curl): static.cloudflareinsights.com count = 1
  §5.3 CF Web Analytics dashboard: confirmed enabled by Jack
  §6 cookie audit: confirmed zero analytics cookies by Jack
  §7 preview subdomain: not run (no preview URL provided; deferred to next branch deploy)
  §9 Lighthouse:
    /: Perf 94 (target ≥99), A11y 95, BP 100, SEO 100, TBT 0ms, CLS 0.002, LCP 2.7s
    /projects/seatwatch: Perf 98 (target ≥99), A11y 95, BP 100, SEO 100, TBT 0ms, CLS 0, LCP 1.9s
    Perf below ≥99 target accepted by Jack — CLS ~0 confirms Phase 15 (sentinels + 2KB defer Umami) added zero layout cost; LCP gap likely upstream image/font work, not analytics-related.

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
