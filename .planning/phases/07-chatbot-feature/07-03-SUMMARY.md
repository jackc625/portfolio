---
phase: 07-chatbot-feature
plan: 03
subsystem: ui
tags: [astro, chat-widget, sse-streaming, markdown, dompurify, gsap, accessibility, xss-sanitization]

# Dependency graph
requires:
  - phase: 07-01
    provides: Astro hybrid SSR with Cloudflare adapter, deps installed (marked, dompurify, anthropic SDK)
  - phase: 07-02
    provides: SSE streaming endpoint at /api/chat, validation module, system prompt
provides:
  - ChatWidget.astro component with complete markup (bubble, panel, header, message area, starter chips, typing indicator, input area, copy buttons, privacy note)
  - Client-side chat controller (src/scripts/chat.ts) with SSE streaming consumer, markdown rendering, GSAP animations, state management
  - renderMarkdown() function with marked + DOMPurify sanitization pipeline
  - 12 markdown sanitization tests covering XSS, tag whitelist, attribute stripping
affects: [07-04-integration, 07-05-e2e-testing]

# Tech tracking
tech-stack:
  added: [jsdom (dev)]
  patterns: [marked.parse with async:false, DOMPurify strict config with ALLOWED_URI_REGEXP, AbortController timeout for SSE streams, JS auto-grow textarea, GSAP panel animations with reduced-motion respect]

key-files:
  created:
    - src/components/chat/ChatWidget.astro
  modified:
    - src/scripts/chat.ts
    - src/styles/global.css
    - tests/client/markdown.test.ts
    - package.json

key-decisions:
  - "marked configured with async:false to prevent Promise-as-string bug in v17"
  - "DOMPurify strict config: ALLOWED_TAGS with ol, ALLOWED_ATTR whitelist, FORBID_ATTR:style, ALLOWED_URI_REGEXP for safe protocols"
  - "AbortController with 30s timeout for SSE streams to prevent stuck typing state"
  - "JS auto-grow textarea instead of field-sizing:content (no Firefox support)"
  - "Copy-to-clipboard wrapped in try/catch for non-HTTPS contexts"

patterns-established:
  - "Markdown sanitization pipeline: marked.parse({async:false}) -> DOMPurify.sanitize(strict config) -> innerHTML"
  - "SSE consumer pattern: fetch with AbortController -> ReadableStream reader -> line-based SSE parsing"
  - "Chat animation pattern: GSAP dynamic import with prefersReducedMotion guard"

requirements-completed: [D-01, D-02, D-03, D-04, D-05, D-06, D-12, D-21, D-25, D-26, D-27, D-28, D-29, D-30, D-31, D-32, D-34, D-35, D-37, D-38]

# Metrics
duration: 8min
completed: 2026-04-04
---

# Phase 7 Plan 3: Chat Widget UI Summary

**Complete chat widget with SSE streaming consumer, markdown rendering via marked+DOMPurify strict pipeline, GSAP animations, and 12 XSS sanitization tests**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-04T20:35:45Z
- **Completed:** 2026-04-04T20:44:40Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- ChatWidget.astro with full markup: floating bubble, expandable panel, header, message area, starter chips, typing indicator, input with char count, send button, copy button, privacy note
- Client-side chat controller (712 lines) handling full lifecycle: open/close with GSAP, SSE streaming with 30s AbortController timeout, markdown sanitization, clipboard copy, error handling, nudge system
- 12 markdown sanitization tests validating XSS protection: script/img stripping, tag whitelist, attribute whitelist, style forbid, javascript:/data: protocol blocking, async:false verification
- All 52 tests pass across full suite (40 prior + 12 new)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ChatWidget.astro component with complete markup and chat-specific CSS** - `0293d2d` (feat)
2. **Task 2 RED: Failing markdown sanitization tests** - `ba8b49c` (test)
3. **Task 2 GREEN: Implement chat controller with streaming, markdown, animations** - `30386ba` (feat)

## Files Created/Modified
- `src/components/chat/ChatWidget.astro` - Complete chat widget markup with all sub-components, 217 lines
- `src/scripts/chat.ts` - Client-side chat controller with streaming, markdown rendering, animations, 712 lines
- `src/styles/global.css` - Chat-specific CSS: print hiding, typing dots, textarea, bot message markdown, mobile full-screen, copy button, hover states
- `tests/client/markdown.test.ts` - 12 tests for renderMarkdown XSS sanitization
- `package.json` - Added jsdom dev dependency for test environment
- `pnpm-lock.yaml` - Lock file updated

## Decisions Made
- **marked async:false:** Configured `marked.use({ async: false })` because marked v17's `parse()` returns a Promise without it, which would silently break DOMPurify sanitization (DOMPurify.sanitize(Promise) returns empty string)
- **Strict DOMPurify config:** Beyond just ALLOWED_TAGS, added ALLOWED_ATTR whitelist (href, target, rel), FORBID_ATTR (style), ALLOW_DATA_ATTR false, and ALLOWED_URI_REGEXP to block javascript: and data: protocols
- **AbortController 30s timeout:** SSE fetch uses AbortController with 30-second timeout to prevent stuck "typing" state on connection drops or server hangs
- **JS auto-grow over field-sizing:** Used JavaScript-based auto-grow for textarea instead of CSS `field-sizing: content` because Firefox does not support it
- **Clipboard try/catch:** Wrapped `navigator.clipboard.writeText()` in try/catch because it fails on non-HTTPS contexts and can throw on permission denial

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed jsdom for test environment**
- **Found during:** Task 2 (TDD RED phase)
- **Issue:** Tests needed jsdom environment for DOMPurify (which requires DOM APIs), but jsdom was not installed
- **Fix:** `pnpm add -D jsdom`
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** All 12 markdown tests pass with `@vitest-environment jsdom` directive
- **Committed in:** 30386ba (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary dependency for test environment. No scope creep.

## Issues Encountered
None - plan executed smoothly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ChatWidget.astro is ready to be injected into BaseLayout.astro (Plan 04: Integration)
- All markup IDs match what chat.ts queries via getElementById
- SSE streaming consumer is wired to POST /api/chat (built in Plan 02)
- Chat widget uses `transition:persist` for page navigation survival (needs BaseLayout injection)
- Focus trapping for the chat panel will need to be added during integration (Plan 04)

## Self-Check: PASSED

All files verified present. All commit hashes found in git log.

---
*Phase: 07-chatbot-feature*
*Completed: 2026-04-04*
