---
phase: 14-chat-knowledge-upgrade
plan: 03
subsystem: chat-api-sdk-wire-up
tags: [cache_control, ephemeral, max_tokens, anthropic-sdk, helper-extract, surgical-diff, haiku-prompt-cache]

# Dependency graph
requires:
  - phase: 07-chatbot-feature
    provides: "Chat API surface (src/pages/api/chat.ts) + @anthropic-ai/sdk@0.82.0 messages.create call site + Phase 7 D-26 regression invariants (CORS, rate-limit, sanitize, SSE framing, Content-Encoding:none)"
  - phase: 14-01-chat-knowledge-upgrade
    provides: "tests/api/chat.test.ts existing 13-test baseline (D-09 endpoint contract tests)"
  - phase: 14-02-chat-knowledge-upgrade
    provides: "49005-token portfolio-context.json artifact (12x above Haiku 4.5 4096-token cache floor -- cache will NOT silently disable); PortfolioContext type in src/prompts/portfolio-context-types.ts"
provides:
  - "src/prompts/chat-request-shape.ts -- pure buildChatRequestArgs helper that returns the exact args object passed to client.messages.create()"
  - "src/pages/api/chat.ts rewired to call the helper; inline messages.create literal collapsed to a single helper call"
  - "tests/api/chat.test.ts gains 8 new tests (5 structural + 3 secondary source-text) that lock the cache_control + max_tokens + Phase 7 invariants together"
affects: [14-04-system-prompt-rewrite, 14-05-injection-battery-green, 14-06-d26-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure-helper extraction for structural testability -- REVIEWS.md MEDIUM mitigation: replaces brittle source-text regex with an introspectable object returned by an imported function. Eliminates need for vi.mock(@anthropic-ai/sdk) and the associated L6 cross-file module-hoisting landmine."
    - "Dual-layer L2 landmine guard -- structural (Array.isArray + block.cache_control.type) AND source-text (expect(chatSource).toContain helper call). A refactor that inlines the helper back to string form fails both gates with two distinct, named error messages."
    - "Surgical byte-preservation diff -- chat.ts diff is exactly 2 hunks totaling 8 lines-in + 4 lines-out (net -4 lines, 131 -> 127). All Phase 7 D-26 invariants preserved byte-for-byte: CORS check, Content-Length guard, rate-limiter binding, JSON parse, validation, sanitize, SSE framing, mid-stream error handling, Content-Encoding:none header."
    - "Astro-route exclusion via file placement -- helpers that share a directory with route files MUST live outside src/pages/. Rule 1 bugfix moved helper from src/pages/api/ (where Astro exposed it as a public /api/chat-request-shape route) to src/prompts/ alongside system-prompt.ts."

key-files:
  created:
    - src/prompts/chat-request-shape.ts
    - .planning/phases/14-chat-knowledge-upgrade/14-03-SUMMARY.md
  modified:
    - src/pages/api/chat.ts
    - tests/api/chat.test.ts

key-decisions:
  - "Helper lives at src/prompts/chat-request-shape.ts (NOT src/pages/api/) -- any .ts under src/pages/ becomes a public route in Astro. First-draft placement at src/pages/api/ auto-built dist/client/api/chat-request-shape at build time -- Rule 1 bugfix moved it to src/prompts/ alongside system-prompt.ts (its only dependency) and adjusted imports in chat.ts + tests. One extra commit (c4ed25a); all tests stayed GREEN through the move."
  - "cache_control: { type: 'ephemeral' } placed on the single TextBlockParam wrapping buildSystemPrompt output -- matches D-12 'single breakpoint on the entire system prompt block.' No beta headers, no ttl field (5m default used). @anthropic-ai/sdk@0.82.0 TextBlockParam type accepts cache_control natively -- zero @ts-ignore, zero `as unknown as`, zero casts beyond the two `as const` annotations required to keep 'text' and 'ephemeral' as string literal types (not widened to string) so the SDK overload matches."
  - "max_tokens bumped 512 -> 768 (CHAT-07). Lives inside the helper -- both the runtime value and the source-text guard for the value live in chat-request-shape.ts. chat.ts no longer contains 'max_tokens' in any form (verified: grep -c 'max_tokens' src/pages/api/chat.ts returns 0)."
  - "messages.create call site shrunk from 7-line literal to 3-line helper call -- chat.ts is 4 lines shorter (131 -> 127). REVIEWS.md MEDIUM primary structural test path is now `const args = buildChatRequestArgs(portfolioContext as never, [...]); expect(args.system).toBeArray(); expect(block.cache_control).toEqual({type:'ephemeral'})` -- no vi.mock, no readFileSync regex dance for the invariant assertions."
  - "Test file adds 8 new tests (not 5): 5 structural (max_tokens / array shape / cache_control / model+stream / messages passthrough) + 3 secondary source-text (helper-is-called / Content-Encoding:none / D-26 invariants). Plan text said 'expected: 5' but the natural shape of the describe block called for splitting the compound invariant checks into 8 named `it(...)` blocks so failures surface the specific broken invariant -- better CI signal."
  - "Zero new dependencies. @anthropic-ai/sdk@0.82.0 unchanged. Zero SDK version bump. Zero devDep additions. Full build chain (pnpm build:chat-context && wrangler types && astro check && astro build && pages-compat) runs clean."

patterns-established:
  - "When a route module needs a pure helper whose logic must be testable without mocking the HTTP layer, extract the helper to a NON-route directory (src/prompts/ or src/lib/) and import it from the route. Keeps the route's public surface minimal AND lets tests import the helper without triggering the route module's top-level side-effect imports (Anthropic SDK, cloudflare:workers env, etc.)."
  - "When SDK types accept an optional cache_control field on content blocks, prefer the array-of-blocks form over the string form even when the SDK accepts both -- the array form surfaces the cache intent in the types, eliminates silent-cache-disable drift, and costs ~5 lines of TypeScript. The string form is a premature optimization."
  - "Plan-execution note: when placing new files, verify they are not in an auto-discovered directory (src/pages/, src/content/, pages/api/ in Next.js, etc.) BEFORE committing. A quick `pnpm build` after Task 1 caught the rogue-route bug immediately -- cost 1 extra commit and ~2 minutes, not a deploy-time incident."

requirements-completed: [CHAT-05, CHAT-07]

# Metrics
duration: 9min
completed: 2026-04-23
---

# Phase 14 Plan 03: SDK cache_control + max_tokens Wire-Up Summary

**Wired `cache_control: { type: 'ephemeral' }` + `max_tokens: 768` into the Anthropic messages.create call via a pure `buildChatRequestArgs` helper extracted to `src/prompts/chat-request-shape.ts`. All 8 new structural tests GREEN. All Phase 7 D-26 invariants byte-preserved (chat.ts net -4 lines, 2 hunks). Zero SDK casts. Zero new dependencies. One Rule 1 auto-fix commit (helper file moved out of src/pages/api/ after initial placement inadvertently exposed it as a public Astro route at build time).**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-04-23T16:47:16Z
- **Completed:** 2026-04-23T16:56:40Z
- **Tasks:** 2 (plus 1 Rule 1 auto-fix)
- **Files created:** 1 (helper) + this SUMMARY
- **Files modified:** 2 (chat.ts surgical; chat.test.ts append-only)

## Task Commits

1. **Task 1: create helper + wire chat.ts to it** -- `a2c14b6` (feat)
2. **Task 2: add SDK request-shape structural tests** -- `eedc5cd` (test)
3. **Rule 1 auto-fix: move helper out of src/pages/api/** -- `c4ed25a` (fix)

## Byte-Preservation Evidence for chat.ts

### Cumulative diff (pre-plan `70dc0df` vs HEAD)

```diff
diff --git a/src/pages/api/chat.ts b/src/pages/api/chat.ts
@@ -4,7 +4,7 @@ import type { APIRoute } from "astro";
 import Anthropic from "@anthropic-ai/sdk";
 import { env } from "cloudflare:workers";
 import portfolioContext from "../../data/portfolio-context.json";
-import { buildSystemPrompt } from "../../prompts/system-prompt";
+import { buildChatRequestArgs } from "../../prompts/chat-request-shape";
 import {
   validateRequest,
   sanitizeMessages,
@@ -81,13 +81,9 @@ export const POST: APIRoute = async ({ request }) => {
   const stream = new ReadableStream({
     async start(controller) {
       try {
-        const response = await client.messages.create({
-          model: "claude-haiku-4-5",
-          max_tokens: 512,
-          system: buildSystemPrompt(portfolioContext),
-          messages,
-          stream: true,
-        });
+        const response = await client.messages.create(
+          buildChatRequestArgs(portfolioContext, messages)
+        );
```

### Diff line-count breakdown

| Metric | Value |
|--------|-------|
| Total hunks | 2 |
| Lines added | 4 (1 import + 3-line helper call) |
| Lines removed | 8 (1 import + 7-line inline literal) |
| Net change | -4 lines (131 -> 127) |
| Non-hunk lines preserved | 119 of 123 (97% byte-identical) |

### Phase 7 D-26 invariants grep-verified byte-preserved

| Invariant | Grep | Expected | Actual |
|-----------|------|----------|--------|
| CORS check | `isAllowedOrigin(origin)` | 1 | **1** |
| Rate limiter binding | `CHAT_RATE_LIMITER` | 1 | **1** |
| Rate-limit call | `rateLimiter.limit({ key: ip })` | 1 (indirect in chat.ts text) | **1** |
| Content-Length guard | `MAX_BODY_SIZE` | 1 | **1** |
| Validation | `validateRequest` | 1 | **1** |
| Sanitization | `sanitizeMessages(validation.data.messages)` | 1 | **1** |
| SSE Content-Encoding header | `"Content-Encoding": "none"` | 1 | **1** |
| SSE Cache-Control | `Cache-Control.*no-cache, no-transform` | 1 | **1** |
| Mid-stream error handling | `catch {.*controller.enqueue.*error: true` | 1 (block) | **1** |
| Old inline max_tokens removed | `max_tokens: 512` | 0 | **0** |
| Old string-form system removed | `system: buildSystemPrompt(portfolioContext)` | 0 | **0** |

## Helper File Shape Evidence

`src/prompts/chat-request-shape.ts` (45 lines):

- Two imports: `buildSystemPrompt` from `./system-prompt`, `PortfolioContext` type from `./portfolio-context-types`. Zero SDK imports (helper never touches Anthropic at runtime).
- One exported interface `ChatMessage` (role + content) mirroring what `sanitizeMessages` returns.
- One exported pure function `buildChatRequestArgs(context, messages)` returning `{ model, max_tokens, system: [{ type, text, cache_control }], messages, stream }`.
- Three `as const` annotations on string-literal fields (`"text"`, `"ephemeral"`, stream's `true`) -- these are NOT casts; they narrow literal types so the SDK overload matches.
- Zero `@ts-ignore`, zero `as unknown as`, zero type casts beyond the three `as const` narrowings.

## SDK Type Verification

`@anthropic-ai/sdk@0.82.0` (stable namespace, unchanged from pre-plan):

```typescript
// node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts
// Line 150-163
export interface CacheControlEphemeral {
  type: 'ephemeral';
  ttl?: '5m' | '1h';
}
// Line 887-895
export interface TextBlockParam {
  text: string;
  type: 'text';
  cache_control?: CacheControlEphemeral | null;
  citations?: Array<TextCitationParam> | null;
}
// Line 1942 + 2184
system?: string | Array<TextBlockParam>;
```

The array-of-TextBlockParam overload accepts `cache_control` natively. `pnpm check` clean, zero errors / zero warnings / zero hints. No beta headers, no SDK version bump.

## Test Flip Evidence

### chat.test.ts grep counts

| Grep | Count | Expected | Status |
|------|-------|----------|--------|
| `describe(\"SDK request shape (CHAT-05 / CHAT-07)` | 1 | >=1 | PASS |
| `buildChatRequestArgs` | 6 | >=2 | PASS (import + helper call + 3 structural asserts + 1 source-text assert) |
| `readFileSync` | 3 | >=1 | PASS (import + chat.ts read + helper read) |
| `vi.mock` | 0 | 0 | PASS (L6 mitigation) |
| `it(` (all describes) | 21 | 13 + 8 = 21 | PASS |

### Test result delta

| State | Files | Tests pass | Tests fail |
|-------|-------|------------|------------|
| Pre-plan (post 14-02) | 25/26 | 194 | 6 (Plan 14-04 RED targets) |
| Post-plan | 25/26 | **202** | 6 (same Plan 14-04 RED targets) |
| Delta | +0 files | **+8** | +0 |

### 8 new test titles

1. `max_tokens is 768 (CHAT-07 -- up from Phase 7's 512)`
2. `system is an ARRAY of TextBlockParam, NOT a bare string (L2 landmine guard -- structural)`
3. `cache_control is { type: "ephemeral" } per D-12 (CHAT-05 -- structural)`
4. `model is claude-haiku-4-5 and stream is true (Phase 7 D-26 invariants preserved in helper)`
5. `messages array is passed through unmodified`
6. `chat.ts calls buildChatRequestArgs() (L2 secondary guard -- no inline literal)`
7. `preserves the Cloudflare-SSE Content-Encoding: none header (AI-SPEC pitfall #4)`
8. `preserves Phase 7 D-26 invariants: CORS, rate-limiter, sanitize, stream:true call site`

All 21 tests GREEN (13 pre-existing + 8 new). Net suite state: 202 / 208 GREEN; the 6 failures are Plan 14-04 RED targets unchanged from Plan 14-02 end state.

### Plan text said "+5 from 14-01 + 5 here = +10 at plan end" -- actual delta

Plan narrative anticipated 5 new tests. Actual is 8 -- I split compound invariants into named tests so CI failures surface the specific broken invariant rather than "the SDK-shape test failed." Net suite-level delta: +8 GREEN (not +5). The larger gain is informational-only; it does NOT change the GREEN/RED headline count on the 6 prompt-injection RED tests (those remain Plan 14-04's target).

## Full Build Chain Clean

```
$ rm -rf dist && pnpm build
> pnpm build:chat-context && wrangler types && astro check && astro build && node scripts/pages-compat.mjs

build:chat-context -- unchanged (idempotent from Plan 14-02)
wrangler types     -- 0 errors
astro check        -- 0 errors / 0 warnings / 0 hints (67 files)
astro build        -- Complete
pages-compat       -- restructured dist/client/ for Cloudflare Pages
```

**Critical post-Rule-1 verification:** `find dist -name "*chat-request-shape*"` returns **zero results**. The helper no longer surfaces as a public route (previously at `dist/client/api/chat-request-shape` when file lived in `src/pages/api/`). `dist/client/api/` is empty -- SSR chat endpoint served by `dist/_worker.js` only.

## D-13 Cache Observability Stays Deferred

Per D-13 (14-CONTEXT.md): `cache_read_input_tokens` vs `cache_creation_input_tokens` logging is NOT required by CHAT-05 and stays deferred. Phase 15 Analytics may add it later.

Concrete evidence: the `for await (const event of response)` loop in chat.ts is byte-identical to pre-plan -- no `event.message.usage` reads, no `cache_read_input_tokens` logging, no changes to what gets forwarded on SSE. The cache activation is LLM-API-side only; observability surfaces are Phase 15's concern.

## Known Stubs

None. buildChatRequestArgs is production-wired to real data (portfolio-context.json, buildSystemPrompt) -- no empty defaults, no placeholder values.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Helper file initially placed in src/pages/api/, auto-exposed as public Astro route**

- **Found during:** Task 1 + 2 complete, first post-commit `pnpm build` run
- **Issue:** Plan text placed the helper at `src/pages/api/chat-request-shape.ts`. Astro auto-discovers ANY `.ts` file under `src/pages/` as a public route. The helper file had no `APIRoute` export, so the build emitted `dist/client/api/chat-request-shape` returning a runtime `TypeError: Illegal invocation`. The URL was publicly reachable even though non-functional -- a public-surface leak of internal helper naming + an unexpected route on jackcutrara.com/api/chat-request-shape.
- **Detection path:** Ran `pnpm build` after committing Tasks 1+2 per plan success criteria (`pnpm build runs end-to-end without errors`). Build completed successfully, but I spotted `/api/chat-request-shape` in the route emission list. `ls dist/client/api/` confirmed the rogue artifact.
- **Fix:** `git mv src/pages/api/chat-request-shape.ts src/prompts/chat-request-shape.ts` (alongside system-prompt.ts, its only dependency). Updated imports in chat.ts (`./chat-request-shape` -> `../../prompts/chat-request-shape`) and chat.test.ts (`../../src/pages/api/chat-request-shape` -> `../../src/prompts/chat-request-shape`; `src/pages/api/chat-request-shape.ts` -> `src/prompts/chat-request-shape.ts` in the source-text guard path inside the test file). Updated the helper's own imports from `../../prompts/*` to `./*` (siblings now).
- **Verification:**
  - `find dist -name "*chat-request-shape*"` returns 0 results post-fix (was 1 pre-fix).
  - `ls dist/client/api/` is empty post-fix (was `chat-request-shape` pre-fix).
  - `pnpm check` clean.
  - `pnpm vitest run tests/api/chat.test.ts` -- all 21 tests GREEN.
  - Full `pnpm test` -- 202 pass / 6 fail (6 are pre-existing Plan 14-04 RED targets).
- **Files modified:** `src/prompts/chat-request-shape.ts` (moved + internal imports tweaked), `src/pages/api/chat.ts` (import path fixed), `tests/api/chat.test.ts` (import path + source-text guard path fixed). 3 files, 5 insertions + 5 deletions (net 0 LOC).
- **Commit:** `c4ed25a` (fix(14-03): move chat-request-shape helper out of src/pages/api/).

### No other deviations

Tasks 1 and 2 otherwise executed as the plan text specified. Zero changes to unrelated files. Zero new dependencies. Zero SDK version bump. Zero casts. All Phase 7 D-26 invariants byte-preserved in chat.ts (grep-verified).

**Plan-text narrative on test count ("expected: 5"):** Not a deviation -- the plan's `<action>` block for Task 2 was written as "add these 5 structural tests" but the 14-03-PLAN.md inside `<acceptance_criteria>` explicitly requires "at least 8 more than pre-plan state (8 new tests: 5 structural + 3 secondary source-text guards)". Executed per acceptance criteria. Narrative "+5" in the `<output>` section was counting only structural tests; 3 secondary source-text tests are additive per plan design.

## Issues Encountered

- **Astro route auto-discovery under `src/pages/`:** Placing the helper alongside chat.ts felt architecturally tidy ("grouped with its caller") but Astro's convention of treating every `src/pages/` file as a route made that placement a public-surface leak. Pattern now established: pure helpers belong in `src/prompts/` or `src/lib/`, never `src/pages/`. This is a repo-wide lesson, not just a Phase 14 lesson.
- **Compound `&&` acceptance-grep chain early-exited on `grep -c ... = 0`:** The plan's verification bash used `grep ... && grep ...` to chain checks. When one grep correctly returned 0 hits (e.g., `max_tokens: 512` should be 0 post-edit), `&&` treated the exit code as failure and aborted the chain. Resolved by running each grep in its own subshell with explicit echo labels. Observability-only issue; no action items.
- **Vitest CLI filter `pnpm test -- chat.test` doesn't target a single file:** Same issue noted in 14-02-SUMMARY.md under "Issues Encountered." Used `pnpm vitest run tests/api/chat.test.ts` as the reliable single-file pattern.

## Threat Register Disposition Verified

| Threat ID | Disposition | Evidence |
|-----------|-------------|----------|
| T-14-CACHE (DoS via silent cache disable) | **mitigated** -- structural test `expect(Array.isArray(args.system)).toBe(true)` + `expect(block.cache_control).toEqual({type:'ephemeral'})` catches any refactor that drops to string-form or strips cache_control. Secondary source-text guard `expect(chatSource).toContain("buildChatRequestArgs(portfolioContext, messages)")` catches helper-inlining refactors. `expect(chatSource).not.toMatch(/system:\s*buildSystemPrompt\(portfolioContext\)/)` rejects re-emergence of the pre-plan string form. Three independent gates. |
| T-14-CACHE (info disclosure via cache key hash) | **accept** -- no new surface; system prompt contents committed to git per D-11. |
| T-14-REGRESSION (Phase 7 D-26 invariant break) | **mitigated** -- new test `preserves Phase 7 D-26 invariants` source-greps chat.ts for `isAllowedOrigin(origin)`, `rateLimiter.limit({ key: ip })`, `sanitizeMessages(validation.data.messages)`; helper file greps for `stream: true`; `Content-Encoding: none` has its own named test. Any future edit dropping one fires CI with a specific message. |
| T-14-CACHE (cache-bust via above-breakpoint byte change) | **mitigated** -- helper's `text` field is `buildSystemPrompt(context)` from a pure JSON import + pure function. No `Date.now()`, no UUIDs, no per-request state. Build-time determinism preserved by upstream Plan 14-02 generator's alphabetical sort + idempotency gate. |

## Threat Flags

None. No new network endpoints, no new auth paths, no new file-access patterns, no new trust-boundary schema changes beyond what Plan 14-02 already flagged (knowledge block size 49005 tokens -- already dispositioned under T-14-DATA-INTEGRITY).

## TDD Gate Compliance

Plan type is `execute` (not `tdd`), so the RED/GREEN/REFACTOR gate sequence does not apply at the plan level. Per-task commit convention followed: `feat(14-03):` for the implementation, `test(14-03):` for the test addition, `fix(14-03):` for the Rule 1 auto-fix.

## Commit Ledger

| # | Task / Deviation | Commit | Type | Files |
|---|------------------|--------|------|-------|
| 1 | Helper + chat.ts wire-up | `a2c14b6` | feat | src/pages/api/chat-request-shape.ts (CREATE), src/pages/api/chat.ts (MOD) |
| 2 | SDK shape structural tests | `eedc5cd` | test | tests/api/chat.test.ts (MOD) |
| 3 | Rule 1 fix: helper out of src/pages/api/ | `c4ed25a` | fix | src/prompts/chat-request-shape.ts (RENAME), src/pages/api/chat.ts (MOD), tests/api/chat.test.ts (MOD) |

## Next Plan Readiness

- **Plan 14-04 (System Prompt Rewrite):** has explicit test targets -- the 6 remaining RED tests in `prompt-injection.test.ts` block 3 (section order, D-16 tiered refusal copy, D-17 attack-pattern list, third-person persona framing, D-19 never-padding clause, Projects/7 banlist reinforcement). Plan 14-04 rewrites `buildSystemPrompt` body only; the `PortfolioContext` type shape stays frozen (Plan 14-02 decoupling holds). This plan's `buildChatRequestArgs` helper is stable -- Plan 14-04 will not touch it.
- **Plan 14-05 (Injection Battery Green):** fixtures + mocked injection battery already wired; Plan 14-05 makes the full battery pass against the rewritten system prompt. Cache_control + max_tokens shape is locked by this plan's tests -- Plan 14-05 doesn't need to re-assert it.
- **Plan 14-06 (D-26 Verification):** 9-item regression battery; this plan's 8 new tests cover items 1-9 in the SOURCE-CODE-GREP dimension (helper-is-called, Content-Encoding, CORS, rate-limit, sanitize, stream). Plan 14-06 adds the runtime/manual dimensions (browser XSS smoke, CORS curl preview, rate-limit curl sequence, AbortController timeout, focus-trap, localStorage, SSE DevTools, markdown strict DOMPurify, copy-button parity).

## Self-Check: PASSED

**Files exist:**
- FOUND: src/prompts/chat-request-shape.ts
- FOUND: src/pages/api/chat.ts (modified)
- FOUND: tests/api/chat.test.ts (modified)
- FOUND: .planning/phases/14-chat-knowledge-upgrade/14-03-SUMMARY.md

**Commits exist:**
- FOUND: a2c14b6 (Task 1 -- feat: helper + wire-up)
- FOUND: eedc5cd (Task 2 -- test: SDK shape assertions)
- FOUND: c4ed25a (Rule 1 fix -- helper out of src/pages/api/)

---
*Phase: 14-chat-knowledge-upgrade*
*Completed: 2026-04-23*
