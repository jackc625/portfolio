---
phase: 07-chatbot-feature
plan: 02
subsystem: api
tags: [anthropic, claude, streaming, sse, zod, validation, cors, rate-limiting, system-prompt]

# Dependency graph
requires:
  - phase: 07-01
    provides: Cloudflare adapter, wrangler config, chatbot dependencies, test scaffold
provides:
  - Streaming SSE chat endpoint at /api/chat with validation and security
  - Shared validation module with Zod schemas, CORS whitelist, body size limit
  - XML-structured system prompt builder with 5 sections
  - Curated portfolio context JSON with 6 real projects
  - 40 passing tests covering validation, security, and endpoint contract
affects: [07-03, 07-04, 07-05]

# Tech tracking
tech-stack:
  added: [zod (direct dependency)]
  patterns: [Zod schema validation with transform+pipe for trim, exact CORS origin whitelist via URL parsing, SSE streaming with ReadableStream, XML-structured system prompt sections]

key-files:
  created:
    - src/lib/validation.ts
    - src/pages/api/chat.ts
    - src/data/portfolio-context.json
    - src/prompts/system-prompt.ts
  modified:
    - tests/api/validation.test.ts
    - tests/api/security.test.ts
    - tests/api/chat.test.ts
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "Import zod directly (not astro/zod) for test compatibility -- vitest runs outside Astro runtime"
  - "CORS uses exact origin whitelist with URL parsing, not endsWith() -- all 3 reviewers flagged bypass risk"
  - "Body size limit at 32KB with 413 response before JSON parsing to prevent memory abuse"
  - "Portfolio context includes real data from all 6 project MDX files -- no placeholders"

patterns-established:
  - "Validation module pattern: shared Zod schemas + helper functions importable by both endpoint and tests"
  - "SSE streaming pattern: data: {json}\\n\\n events with [DONE] terminator and error recovery"
  - "System prompt pattern: XML sections (<role>, <knowledge>, <constraints>, <tone>, <security>) with JSON knowledge injection"
  - "CORS pattern: exact origin whitelist array checked via isAllowedOrigin() with URL parsing for localhost detection"

requirements-completed: [D-08, D-09, D-10, D-11, D-13, D-14, D-15, D-16, D-17, D-18, D-19, D-22, D-23, D-24, D-25, D-26]

# Metrics
duration: 8min
completed: 2026-04-04
---

# Phase 7 Plan 2: Chat API & System Prompt Summary

**Streaming SSE chat endpoint with Zod validation, exact CORS whitelist, XML-structured system prompt, and curated portfolio context from 6 real projects**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-04T20:24:41Z
- **Completed:** 2026-04-04T20:32:45Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Streaming SSE chat endpoint at /api/chat with CORS, body size limit, rate limiting, input validation, and mid-stream error recovery
- Shared validation module with Zod schemas enforcing message length (1-500 chars), role enum (user/assistant), array limits (1-30), whitespace rejection, and history trimming (last 20)
- XML-structured system prompt with 5 sections: role, knowledge, constraints, tone, security -- enforces grounding (D-19), anti-injection (D-22), and out-of-scope redirect (D-15)
- Curated portfolio context JSON with real data from all 6 project MDX files, skills from about page, education, experience, and contact info
- 40 passing tests with real assertions covering validation rules, CORS origin whitelist, SSE format, streaming contract, and error handling

## Task Commits

Each task was committed atomically:

1. **Task 1 (TDD RED): Failing tests for validation, security, chat** - `f7aeef2` (test)
2. **Task 1 (TDD GREEN): Validation module and chat API endpoint** - `c50fce6` (feat)
3. **Task 2: System prompt and portfolio context data** - `621d90c` (feat)

## Files Created/Modified
- `src/lib/validation.ts` - Shared validation module: Zod schemas, validateRequest, sanitizeMessages, isAllowedOrigin, MAX_BODY_SIZE
- `src/pages/api/chat.ts` - SSR streaming chat endpoint with CORS, body size check, rate limiting, validation, Claude Haiku streaming
- `src/data/portfolio-context.json` - Curated portfolio knowledge: 6 projects, skills, education, experience, contact
- `src/prompts/system-prompt.ts` - XML-structured system prompt builder with role, knowledge, constraints, tone, security sections
- `tests/api/validation.test.ts` - 19 tests: validateRequest (valid/invalid input, edge cases) and sanitizeMessages (filtering, trimming)
- `tests/api/security.test.ts` - 12 tests: prompt injection defense, CORS origin whitelist (evil-jackcutrara.com rejection, subdomain attack, localhost)
- `tests/api/chat.test.ts` - 9 tests: endpoint contract (validation errors, body size, CORS, SSE format, streaming, error events)
- `package.json` - Added zod as direct dependency for test compatibility
- `pnpm-lock.yaml` - Updated with zod direct dependency

## Decisions Made
- **Zod direct dependency:** Installed zod as a direct dependency instead of relying on astro/zod transitive dependency. Vitest runs outside Astro's runtime, so astro/zod import fails in tests. This addresses the review concern flagged at MEDIUM risk.
- **Exact CORS whitelist:** Used an explicit origin array with URL parsing (isAllowedOrigin) instead of endsWith(). All 3 reviewers (Claude, Gemini, Codex) flagged endsWith() as bypassable via "evil-jackcutrara.com".
- **Body size limit before parsing:** Content-Length check rejects >32KB bodies with 413 before JSON.parse() runs, preventing memory abuse on oversized payloads.
- **Real project data:** Populated portfolio-context.json with actual data from 6 MDX project files and the about page, not placeholder content.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed zod as direct dependency**
- **Found during:** Task 1 (validation module creation)
- **Issue:** Zod was only available as a transitive peer dependency of @anthropic-ai/sdk and @astrojs/sitemap. Direct import (`import { z } from "zod"`) failed in Node.
- **Fix:** Ran `pnpm add zod` to make it a direct dependency
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** `import { z } from "zod"` resolves correctly in vitest
- **Committed in:** c50fce6 (Task 1 GREEN commit)

**2. [Rule 1 - Bug] Fixed require() to ESM import in security test**
- **Found during:** Task 1 (GREEN phase test run)
- **Issue:** security.test.ts used `require("../../src/lib/validation")` which fails in ESM project. Added validateRequest to the ESM import at top of file.
- **Fix:** Changed from `require()` call to using the already-available ESM import
- **Files modified:** tests/api/security.test.ts
- **Verification:** All 40 tests pass
- **Committed in:** c50fce6 (Task 1 GREEN commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for test execution. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None for this plan. API key setup will be needed at deployment time (ANTHROPIC_API_KEY in Cloudflare environment variables). The `.dev.vars.example` template was created in Plan 01.

## Known Stubs
None in production code. The 9 remaining `it.todo()` stubs in `tests/client/markdown.test.ts` are intentional -- they belong to Plan 03 (client-side markdown rendering).

## Next Phase Readiness
- Chat API endpoint complete and tested -- ready for Plan 03 to build the client-side chat UI that calls it
- System prompt and portfolio context in place -- ready for integration
- Validation module exportable for any client-side pre-validation in Plan 03
- All 40 tests green, providing regression safety for Plan 03/04/05 changes

## Self-Check: PASSED

- All 4 created files verified on disk
- All 3 task commits (f7aeef2, c50fce6, 621d90c) found in git log

---
*Phase: 07-chatbot-feature*
*Completed: 2026-04-04*
