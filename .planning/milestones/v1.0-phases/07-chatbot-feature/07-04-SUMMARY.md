---
phase: 07-chatbot-feature
plan: 04
subsystem: ui
tags: [astro, view-transitions, focus-trap, accessibility, analytics, keyboard-nav]

# Dependency graph
requires:
  - phase: 07-02
    provides: "Streaming SSE chat endpoint, validation, system prompt"
  - phase: 07-03
    provides: "ChatWidget component, chat controller with SSE streaming and markdown rendering"
provides:
  - "ChatWidget injected into BaseLayout visible on every page"
  - "transition:persist navigation persistence for chat state"
  - "Focus trap with dynamic element re-querying for accessibility"
  - "Idempotent initialization preventing duplicate handlers across navigations"
  - "Anonymous analytics event dispatching (open/send/chip/error)"
affects: [07-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Idempotent initialization via module-level boolean + data-attribute marker"
    - "Focus trap with dynamic querySelectorAll on each Tab keypress"
    - "CustomEvent-based analytics dispatching on document"
    - "astro:before-preparation cleanup for persistent component listeners"

key-files:
  created: []
  modified:
    - "src/layouts/BaseLayout.astro"
    - "src/scripts/chat.ts"
    - "src/components/chat/ChatWidget.astro"

key-decisions:
  - "Focus trap re-queries focusable elements on every Tab keypress to include dynamic bot message links/buttons"
  - "Analytics uses CustomEvent on document for framework-agnostic provider integration"
  - "Idempotency uses both JS boolean and DOM data-attribute to handle transition:persist edge cases"

patterns-established:
  - "Idempotent init: chatInitialized boolean + panel.dataset.chatBound prevents duplicate handlers"
  - "Focus trap pattern: setupFocusTrap returns cleanup function, stored at module level for lifecycle access"
  - "Analytics pattern: trackChatEvent dispatches CustomEvent with action + optional label, no content"

requirements-completed: [D-07, D-33, D-36]

# Metrics
duration: 6min
completed: 2026-04-04
---

# Phase 07 Plan 04: Integration & Accessibility Summary

**ChatWidget wired into BaseLayout with transition:persist, focus trap with dynamic re-querying, idempotent init guard, and CustomEvent analytics dispatching**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-04T20:48:20Z
- **Completed:** 2026-04-04T20:54:53Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- ChatWidget injected into BaseLayout after Footer with transition:persist, rendering on every page
- Focus trap with dynamic element re-querying on each Tab keypress captures bot message links and copy buttons
- Idempotent initialization via chatInitialized boolean + data-chat-bound attribute prevents duplicate handlers across view transition navigations
- Anonymous analytics events fire for chat_open, message_sent, chip_click, and chat_error without logging conversation content
- astro:before-preparation cleanup prevents stale focus trap listeners across navigations

## Task Commits

Each task was committed atomically:

1. **Task 1: Inject ChatWidget into BaseLayout with focus trap + idempotent init** - `ea8cc1d` (feat)
2. **Task 2: Add anonymous analytics event dispatching with error tracking** - `1ff20b9` (feat)

## Files Created/Modified
- `src/layouts/BaseLayout.astro` - Added ChatWidget import and `<ChatWidget transition:persist />` after Footer
- `src/scripts/chat.ts` - Added idempotent init guard, setupFocusTrap with dynamic re-querying, astro:before-preparation cleanup, trackChatEvent analytics helper with open/send/chip/error events
- `src/components/chat/ChatWidget.astro` - Fixed script import path from `../scripts/chat.ts` to `../../scripts/chat.ts`

## Decisions Made
- Focus trap re-queries focusable elements on every Tab keypress rather than caching at panel-open time, because bot messages dynamically add `<a>` links and copy buttons that must be included in the trap
- Analytics uses `CustomEvent("chat:analytics")` dispatched on `document` -- framework-agnostic, fire-and-forget, consumable by any future analytics provider (Cloudflare Web Analytics, Plausible, custom endpoint)
- Idempotency uses both a JS module-level boolean (`chatInitialized`) and a DOM data-attribute (`data-chat-bound`) to handle the case where transition:persist preserves DOM but script re-executes on astro:page-load

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed ChatWidget script import path**
- **Found during:** Task 1 (build verification)
- **Issue:** ChatWidget.astro had `import "../scripts/chat.ts"` but its location at `src/components/chat/` means that resolves to `src/components/scripts/chat.ts` which doesn't exist. Build error: `Could not resolve "../scripts/chat.ts"`
- **Fix:** Changed to `import "../../scripts/chat.ts"` -- correct relative path from `src/components/chat/` to `src/scripts/`
- **Files modified:** src/components/chat/ChatWidget.astro
- **Verification:** Build passes (exit 0)
- **Committed in:** ea8cc1d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Pre-existing bug from Plan 03 that only manifested when ChatWidget was actually imported into a layout. Essential fix for build to succeed. No scope creep.

## Issues Encountered
None beyond the auto-fixed import path.

## User Setup Required
None - no external service configuration required.

## Verification Results
- `astro build` exits with code 0 -- ChatWidget renders on all 11 prerendered pages
- `vitest run` -- 52 tests pass across 4 test files
- BaseLayout.astro contains ChatWidget import and transition:persist usage
- chat.ts contains chatInitialized + data-chat-bound idempotency guard
- chat.ts contains setupFocusTrap with dynamic querySelectorAll inside Tab handler
- chat.ts contains astro:before-preparation cleanup listener
- chat.ts contains trackChatEvent with chat_open, message_sent, chip_click, chat_error events

## Next Phase Readiness
- Chat widget is live on every page, persists across navigation, fully keyboard accessible
- Plan 05 (polish/testing) can proceed -- all integration and accessibility requirements met
- Analytics events are firing and ready for a future provider hookup

---
## Self-Check: PASSED

- All 3 modified files exist on disk
- Commit ea8cc1d found in git log
- Commit 1ff20b9 found in git log

---
*Phase: 07-chatbot-feature*
*Completed: 2026-04-04*
