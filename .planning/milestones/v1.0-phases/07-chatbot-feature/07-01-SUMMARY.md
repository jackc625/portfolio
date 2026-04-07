---
phase: 07-chatbot-feature
plan: 01
subsystem: infra
tags: [astro, cloudflare, wrangler, vitest, ssr, rate-limiting]

# Dependency graph
requires: []
provides:
  - Cloudflare adapter for hybrid SSR (per-route opt-in)
  - Wrangler config with rate limit binding (CHAT_RATE_LIMITER)
  - All chatbot production dependencies (@anthropic-ai/sdk, marked, dompurify)
  - Wave 0 test scaffold (29 todo stubs across 4 test files)
  - Vitest configuration for tests/**/*.test.ts
affects: [07-02, 07-03, 07-04, 07-05]

# Tech tracking
tech-stack:
  added: [@astrojs/cloudflare, @anthropic-ai/sdk, marked, dompurify, wrangler]
  patterns: [per-route SSR opt-in via prerender=false, it.todo() test stubs for Wave 0]

key-files:
  created:
    - wrangler.jsonc
    - .dev.vars.example
    - vitest.config.ts
    - tests/api/validation.test.ts
    - tests/api/security.test.ts
    - tests/api/chat.test.ts
    - tests/client/markdown.test.ts
  modified:
    - astro.config.mjs
    - package.json
    - pnpm-lock.yaml
    - .gitignore

key-decisions:
  - "Astro 6 removed output:hybrid -- use default static output with per-route SSR via prerender=false"
  - "Rate limit set to 5 requests per 60 seconds (not 3/60s) for better UX per review feedback"
  - "Test stubs use it.todo() instead of expect(true).toBe(true) for honest pending status"

patterns-established:
  - "Per-route SSR: individual API routes export const prerender = false to opt into server rendering"
  - "Wave 0 test scaffold: it.todo() stubs organized by security domain, ready for Plan 02/03 to fill in"

requirements-completed: [D-09, D-20]

# Metrics
duration: 9min
completed: 2026-04-04
---

# Phase 7 Plan 1: Infrastructure & Test Scaffold Summary

**Cloudflare adapter with rate-limited SSR, all chatbot deps installed, and 29-stub vitest scaffold covering validation/security/streaming/XSS**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-04T20:11:38Z
- **Completed:** 2026-04-04T20:20:43Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Astro configured with @astrojs/cloudflare adapter for per-route SSR (API endpoint will use prerender=false)
- All chatbot production deps installed: @anthropic-ai/sdk, marked, dompurify, plus wrangler as dev dep
- Wrangler configured with CHAT_RATE_LIMITER binding (5/60s) and nodejs_compat flag
- Wave 0 test scaffold: 29 it.todo() stubs across 4 files covering input validation, prompt injection, streaming API, and markdown XSS sanitization

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and configure hybrid SSR with Cloudflare adapter** - `9aa0691` (feat)
2. **Task 2: Create Wave 0 test scaffold for security-critical behaviors** - `5aaa8aa` (test)

## Files Created/Modified
- `astro.config.mjs` - Added @astrojs/cloudflare adapter import and configuration
- `package.json` - Added production and dev dependencies, pnpm build script approval
- `pnpm-lock.yaml` - Lock file updated with new dependencies
- `wrangler.jsonc` - Cloudflare Workers config with rate limit binding and nodejs_compat
- `.dev.vars.example` - Template for local dev secrets (ANTHROPIC_API_KEY)
- `.gitignore` - Added .dev.vars and .wrangler/ exclusions
- `vitest.config.ts` - Test runner config with globals and tests/**/*.test.ts include
- `tests/api/validation.test.ts` - Input validation + conversation history test stubs (D-22, D-23, S7)
- `tests/api/security.test.ts` - Prompt injection defense test stubs (S1, D-22)
- `tests/api/chat.test.ts` - Streaming endpoint test stubs (D-09)
- `tests/client/markdown.test.ts` - Markdown rendering + XSS sanitization test stubs (D-21, D-25)

## Decisions Made
- **Astro 6 removed output:"hybrid"**: Astro 6.0.8 no longer supports the `output: "hybrid"` config option. The correct approach is to use the default output mode (static) with the Cloudflare adapter, and individual API routes opt into SSR via `export const prerender = false`. This achieves the same behavior as the old hybrid mode.
- **Rate limit 5/60s**: Per review feedback, 3/60s was too aggressive. Using 5/60s for better UX while still preventing abuse.
- **it.todo() stubs**: Per review feedback, using vitest's `it.todo()` instead of `expect(true).toBe(true)` so tests show as pending rather than falsely green.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed output:"hybrid" from astro.config.mjs**
- **Found during:** Task 1 (build verification)
- **Issue:** Astro 6 removed the `output: "hybrid"` option. Build failed with: "The output: 'hybrid' option has been removed. Use output: 'static' (the default) instead."
- **Fix:** Removed `output: "hybrid"` and added a comment explaining that Astro 6 uses default static output with per-route SSR opt-in via `export const prerender = false`
- **Files modified:** astro.config.mjs
- **Verification:** `pnpm run build` passes with exit code 0
- **Committed in:** 9aa0691 (Task 1 commit)

**2. [Rule 3 - Blocking] Added .wrangler/ to .gitignore**
- **Found during:** Task 1 (post-build git status check)
- **Issue:** Installing wrangler created a `.wrangler/` runtime directory that should not be committed
- **Fix:** Added `.wrangler/` to `.gitignore`
- **Files modified:** .gitignore
- **Verification:** `git status` no longer shows .wrangler/ as untracked
- **Committed in:** 9aa0691 (Task 1 commit)

**3. [Rule 3 - Blocking] Added pnpm.onlyBuiltDependencies for esbuild and workerd**
- **Found during:** Task 1 (dependency installation)
- **Issue:** pnpm v10 blocked build scripts for esbuild and workerd, which wrangler needs
- **Fix:** Added `pnpm.onlyBuiltDependencies` to package.json and ran `pnpm rebuild`
- **Files modified:** package.json
- **Verification:** `pnpm rebuild esbuild workerd` completes successfully
- **Committed in:** 9aa0691 (Task 1 commit)

**4. [Rule 3 - Blocking] Used pnpm instead of npm for package installation**
- **Found during:** Task 1 (dependency installation)
- **Issue:** Plan specified `npm install` but project uses pnpm (pnpm-lock.yaml present, no package-lock.json)
- **Fix:** Used `pnpm add` for all dependency installations
- **Files modified:** N/A (tooling choice)
- **Verification:** All packages installed successfully
- **Committed in:** 9aa0691 (Task 1 commit)

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking)
**Impact on plan:** All auto-fixes necessary for correct build and toolchain operation. No scope creep. The output:"hybrid" removal is the most significant -- Astro 6 changed its API, but the replacement pattern (per-route prerender=false) achieves identical behavior.

## Issues Encountered
- npm 9.9.4 failed with "Cannot read properties of null (reading 'matches')" because the project uses pnpm, not npm. Switched to pnpm for all operations.

## User Setup Required
None - no external service configuration required. `.dev.vars.example` is provided as a template for local development; actual API key setup will be needed when implementing Plan 02.

## Known Stubs
None in production code. The 29 test stubs are intentional Wave 0 scaffolding -- Plans 02 and 03 will replace them with real assertions.

## Next Phase Readiness
- Cloudflare adapter configured and build passing -- ready for Plan 02 to create the API endpoint
- All chatbot dependencies installed -- ready for SDK usage in Plan 02
- Test scaffold in place -- Plans 02 and 03 will fill in real test assertions
- Rate limit binding defined in wrangler.jsonc -- ready for Plan 02 to consume

## Self-Check: PASSED

- All 7 created files verified on disk
- Both task commits (9aa0691, 5aaa8aa) found in git log

---
*Phase: 07-chatbot-feature*
*Completed: 2026-04-04*
