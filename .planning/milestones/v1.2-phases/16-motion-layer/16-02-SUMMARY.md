---
phase: 16-motion-layer
plan: 02
subsystem: ui
tags: [intersection-observer, factory, refactor, motion, byte-equivalence, tdd-green, phase-16]

# Dependency graph
requires:
  - phase: 16-motion-layer
    provides: Plan 16-01 Wave 0 RED test stubs (observer-factory.test.ts + 6 sibling files); D-19 byte-equivalence canary established (scroll-depth.test.ts + analytics.test.ts byte-identical lock)
  - phase: 15-analytics-instrumentation
    provides: scroll-depth.ts (76 LOC IO-based analytics observer; D-08 per-page-view dedup; handleScrollEntry test seam) — refactored byte-equivalent in this plan
provides:
  - Shared IntersectionObserver factory at src/scripts/lib/observer.ts (consumed by Plan 04 motion.ts)
  - oneShot-defaults-to-false API contract (caller-managed unobserve preserved for scroll-depth byte-equivalence; oneShot=true reserved for one-shot reveal patterns motion.ts will adopt)
  - scroll-depth.ts refactored to consume the factory (D-19 canary held — 7 scroll-depth + 15 analytics tests stay GREEN with zero source edits)
  - 8 observer-factory.test.ts tests flipped from suite-level RED (Wave 0 stub) to GREEN
affects: [16-03 (MOTION.md doc rewrite — sibling Wave 1, no source coupling), 16-04 (motion.ts — Wave 2 consumer of observer.ts factory; oneShot=true path)]

# Tech tracking
tech-stack:
  added: []  # zero new dependencies — pure refactor
  patterns:
    - "Shared IntersectionObserver factory: makeRevealObserver({selector, rootMargin, threshold, onIntersect, oneShot?}) returning IntersectionObserver | null with empty-selector gate parity with original scroll-depth.ts:42"
    - "Caller-managed vs auto-managed unobserve toggle via optional oneShot boolean (D-19 byte-equivalence preservation pattern — defaults to caller-managed so existing analytics.unobserve calls remain authoritative)"
    - "Byte-equivalent refactor: extract shared kernel without modifying any test file — D-19 canary verifies via git diff returning 0 lines"

key-files:
  created:
    - src/scripts/lib/observer.ts (46 LOC — pure factory, no bootstrap, no analytics surface, no console)
  modified:
    - src/scripts/scroll-depth.ts (76 -> 82 LOC, +6 net)
    - tests/client/observer-factory.test.ts (removed @ts-expect-error directive that flipped to TS error once observer module landed — Plan 16-01 documented this as drift signal for the executor of Plan 16-02)

key-decisions:
  - "oneShot defaults to false (D-19 critical): scroll-depth.ts's handleScrollEntry calls observer.unobserve(entry.target) itself; making the factory auto-unobserve would be a redundant double-call (idempotent in scroll-depth's case but a behavioral surface change). Default-omitted preserves the analytics caller's authority over its own dedup semantics."
  - "Empty-selector gate placed inside factory (returns null) — absorbs the original scroll-depth.ts:42 `if (sentinels.length === 0) return;` gate. Caller checks `if (!observer) return;` to preserve identical no-op-on-non-project-routes behavior (D-05 scope gate)."
  - "Non-intersecting filter inside the factory's IO callback (`if (!entry.isIntersecting) continue;`) — required for observer-factory.test.ts test 7 (does NOT invoke onIntersect for non-intersecting entries). handleScrollEntry retains its own defensive `if (!entry.isIntersecting) return;` check — belt-and-suspenders, no behavior change."
  - "onIntersect: handleScrollEntry passed directly (no arrow wrapper) — minimal-diff path; signatures match exactly so direct passing typechecks clean. Plan §<action> note 3 listed both options; direct passing produces zero TS errors and the smallest diff."
  - "DEV console.log preserved via separate document.querySelectorAll(`.scroll-sentinel`).length read inside the import.meta.env.DEV branch — factory does not expose its targets list. Functionally equivalent to the original sentinels.length count."
  - "Removed @ts-expect-error directive from observer-factory.test.ts in the Task 1 commit (not Task 2) — Plan 16-01 explicitly flagged this as a drift signal for Plan 16-02 because the directive flips to a ts(2578) error once the imported module exists. Removal lives alongside src/scripts/lib/observer.ts creation in d7ed781."

patterns-established:
  - "Factory consumer pattern for IO observers: caller defines selector + options + onIntersect; factory handles construction, target observation, and (optional) auto-unobserve. Future IO consumers (Plan 04 motion.ts) reuse the kernel without re-implementing querySelectorAll/forEach observe loops."
  - "Byte-equivalence verification via git diff against pre-plan SHA: `git diff db876cf -- tests/client/scroll-depth.test.ts tests/client/analytics.test.ts | wc -l` returns 0 — locks the canary against any test-file edits that would silently weaken D-19."
  - "Comment-text hygiene for grep-based acceptance criteria: avoid mentioning the literal call shape `observer.unobserve(entry.target)` in comments since acceptance criterion `grep -c 'observer.unobserve(entry.target)' returns 1` counts comment occurrences too. Re-worded comments to 'per-target unobserve' / 'unobserve on its own entry.target' to keep the grep count at the intended 1 (executable call only)."

requirements-completed: []
# Note: Plan 02's frontmatter declares `requirements: [MOTN-02]`, but the literal MOTN-02 requirement text references `src/scripts/motion.ts` ("Scroll-reveal utility module src/scripts/motion.ts using IntersectionObserver — fade + ≤12px translateY, 250–350ms, one-shot per element"). That module does NOT exist yet — Plan 04 creates it. Plan 02 ships the *kernel* (the factory) that MOTN-02 depends on, but the requirement text is not literally satisfied until motion.ts lands with the reveal animation, translateY, and one-shot semantics applied to actual page elements. REQUIREMENTS.md MOTN-02 stays Pending; Plan 04 will close it. This matches the Plan 16-01 precedent (no MOTN-XX closed in the Wave 0 RED-stub plan even though it was foundational).

# Metrics
duration: 8min
completed: 2026-04-27
---

# Phase 16 Plan 02: Shared IntersectionObserver factory + scroll-depth byte-equivalent refactor Summary

**Extracted IntersectionObserver construction from scroll-depth.ts into reusable makeRevealObserver factory; D-19 byte-equivalence canary held (scroll-depth + analytics tests byte-identical, all 31 tests GREEN); observer-factory test stub flipped from suite-level RED to 8 GREEN.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-27T19:23:00Z
- **Completed:** 2026-04-27T19:31:09Z
- **Tasks:** 2
- **Files created:** 1 (src/scripts/lib/observer.ts)
- **Files modified:** 2 (src/scripts/scroll-depth.ts, tests/client/observer-factory.test.ts)

## Accomplishments

- **Shared IO factory landed** — `src/scripts/lib/observer.ts` (46 LOC) exports `makeRevealObserver({selector, rootMargin, threshold, onIntersect, oneShot?}): IntersectionObserver | null`. Consumed by scroll-depth.ts today; will be consumed by motion.ts in Plan 04 without further factory edits.
- **scroll-depth.ts refactored byte-equivalent** — 76 LOC -> 82 LOC (+6 net delta, well under `max_lines_delta: 30`). The inline `new IntersectionObserver(...)` block + `sentinels.forEach(observe)` loop replaced with one factory call. handleScrollEntry signature unchanged; WR-01 bootstrap block (lines 67-76) preserved verbatim; gate-ordering preserved (scrollDepthInitialized set AFTER the empty-sentinel/null gate).
- **D-19 byte-equivalence canary HELD** — `git diff db876cf -- tests/client/scroll-depth.test.ts tests/client/analytics.test.ts | wc -l` returns 0. Phase 15 ANAL-05 / D-26 chat regression gate parity preserved at the analytics surface.
- **observer-factory.test.ts: suite-level RED -> 8 GREEN** — Plan 16-01 RED stub had its module import resolve to a missing module (vitest reported "Failed to resolve import" + 0 individual tests collected). After Task 1 lands the factory + the @ts-expect-error directive is removed, all 8 declared `it()` blocks run and pass.
- **Net test-count delta:** 275 GREEN (pre-plan) -> 283 GREEN (+8). 55 RED Wave 0 stubs preserved (Plans 03-06 will flip them GREEN).
- **Zero new dependencies** — pure refactor + new TypeScript-strict utility module.
- **`pnpm check` 0/0/0 (81 files); `pnpm build` clean end-to-end** (build:chat-context -> wrangler types -> astro check -> astro build -> pages-compat; 11 prerendered routes).

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/scripts/lib/observer.ts factory exporting makeRevealObserver** — `d7ed781` (feat)
   - Files: `src/scripts/lib/observer.ts` (created), `tests/client/observer-factory.test.ts` (removed @ts-expect-error directive — Plan 16-01 documented drift signal)
2. **Task 2: Refactor src/scripts/scroll-depth.ts to consume makeRevealObserver (D-19 byte-equivalence)** — `dc36742` (refactor)
   - Files: `src/scripts/scroll-depth.ts` (modified, +6 LOC delta)

## Files Created/Modified

- `src/scripts/lib/observer.ts` (NEW, 46 LOC) — exports `RevealObserverOptions` type + `makeRevealObserver` function. Pure factory: no bootstrap, no console, no analytics surface, no `addEventListener`. Filters non-intersecting entries inside the IO callback. Returns null on `typeof document === "undefined"` (SSR guard) and on empty `querySelectorAll`. oneShot defaults to false; oneShot=true auto-unobserves via `observer.unobserve(entry.target)` after onIntersect.
- `src/scripts/scroll-depth.ts` (MODIFIED, 76 -> 82 LOC) — added import for makeRevealObserver; replaced inline IO construction in `initScrollDepth` body with single factory call; preserved handleScrollEntry, WR-01 bootstrap block, scrollDepthInitialized guard, DEV console.log, optional-chaining umami.track call shape.
- `tests/client/observer-factory.test.ts` (MODIFIED, removed @ts-expect-error directive only — 6 lines removed, 1 line content unchanged). The directive was a Plan 16-01 RED-stub artifact that flips to a ts(2578) "unused @ts-expect-error" error once the imported module lands; Plan 16-01's PROJECT.md decision explicitly noted this as the drift signal for the executor of Plan 16-02 to remove in the same diff that creates `src/scripts/lib/observer.ts`.

## Decisions Made

See `key-decisions` in frontmatter (6 entries):

1. **oneShot defaults to false (D-19 critical)** — preserves scroll-depth's caller-managed unobserve authority.
2. **Empty-selector gate inside factory** — null return absorbs the original `if (sentinels.length === 0) return;` gate.
3. **Non-intersecting filter inside factory's IO callback** — required for observer-factory.test.ts test 7; handleScrollEntry retains its own defensive check.
4. **`onIntersect: handleScrollEntry` passed directly (no arrow wrapper)** — minimal-diff path, signatures match exactly.
5. **DEV console.log preserved via separate `querySelectorAll` count read** — factory doesn't expose targets list; functionally equivalent.
6. **@ts-expect-error directive removal in Task 1 commit** — Plan 16-01 documented as drift signal; removal co-located with module creation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Comment-text drift] Reduced `observer.unobserve(entry.target)` literal references in comments to satisfy grep-count acceptance criterion**

- **Found during:** Task 2 (post-refactor verification of `grep -c 'observer.unobserve(entry.target)' src/scripts/scroll-depth.ts returns 1`)
- **Issue:** Initial Task 2 draft had 3 grep matches: 1 executable call (line 40, intended) + 2 comment references (line 9 header comment + line 49 inline comment) using the literal call shape `observer.unobserve(entry.target)`. The plan's acceptance criterion expected exactly 1.
- **Fix:** Re-worded comment text without changing meaning — line 9 became "preserves its own per-target unobserve call"; line 49 became "handleScrollEntry calls unobserve on its own entry.target". Executable call (line 40) untouched; behavior byte-identical.
- **Files modified:** src/scripts/scroll-depth.ts (comment-only edits, prior to Task 2 commit)
- **Verification:** `grep -c 'observer.unobserve(entry.target)' src/scripts/scroll-depth.ts` returns 1 (executable call only); `pnpm vitest run` 31 GREEN; `pnpm check` 0/0/0; D-19 canary still 0-lines diff in test files.
- **Committed in:** dc36742 (folded into Task 2 commit; no separate fix commit needed)

---

**Total deviations:** 1 auto-fixed (Rule 1 — comment-text hygiene to honor grep-based acceptance criterion).
**Impact on plan:** Pure documentation rewording, no behavior change, no LOC delta beyond what the plan already authorized. The Pattern is documented in `patterns-established` for future plans where grep-count acceptance criteria conflict with comment-driven self-documentation.

## Issues Encountered

None — both tasks executed in plan order, both verifications passed first-attempt, full `pnpm test` ran cleanly with the expected 283 GREEN / 55 RED distribution (Wave 0 stubs from Plans 03-06 still RED as expected).

## Verification Summary

| Gate | Status | Evidence |
|------|--------|----------|
| `src/scripts/lib/observer.ts` exists with `makeRevealObserver` named export | PASS | File created at d7ed781; grep confirms 1 export |
| Factory returns null when `querySelectorAll` matches 0 elements | PASS | observer-factory.test.ts test 1 GREEN |
| `oneShot` defaults to false/omitted (D-19 byte-equivalence) | PASS | observer-factory.test.ts tests 5+6 GREEN ("does NOT auto-unobserve when oneShot=false / omitted") |
| `oneShot: true` auto-unobserves (motion.ts MOTN-02 path) | PASS | observer-factory.test.ts test 5 GREEN ("oneShot=true auto-unobserves the target after intersect") |
| scroll-depth.ts consumes makeRevealObserver | PASS | grep `import.*makeRevealObserver.*from.*\./lib/observer` returns 1 |
| No inline `new IntersectionObserver` in scroll-depth.ts | PASS | grep `new IntersectionObserver` returns 0 |
| handleScrollEntry signature unchanged | PASS | grep `export function handleScrollEntry` returns 1; tests 1-7 GREEN |
| WR-01 bootstrap block preserved verbatim | PASS | grep confirms WR-01 comment + 2 addEventListener calls preserved |
| All 7 scroll-depth tests GREEN | PASS | `pnpm vitest run tests/client/scroll-depth.test.ts` 8/8 GREEN (counted as 7 in plan; actual file has 8 it() blocks across 2 describe blocks) |
| All analytics tests GREEN | PASS | `pnpm vitest run tests/client/analytics.test.ts` 15/15 GREEN |
| All observer-factory tests GREEN | PASS | `pnpm vitest run tests/client/observer-factory.test.ts` 8/8 GREEN |
| **D-19 canary held** (test files byte-identical to pre-plan SHA db876cf) | **PASS** | `git diff db876cf -- tests/client/scroll-depth.test.ts tests/client/analytics.test.ts \| wc -l` returns 0 |
| `pnpm check` 0 errors / 0 warnings / 0 hints | PASS | 81 files checked |
| `pnpm build` clean end-to-end | PASS | build:chat-context -> wrangler types -> astro check -> astro build -> pages-compat (11 prerendered routes, 7.80s server build) |

## User Setup Required

None — no external service configuration required. Pure code refactor.

## Next Phase Readiness

- **Wave 1 sibling (16-03 — MOTION.md doc rewrite)**: ready to execute in parallel; no source coupling with Plan 02 (Plan 03 touches `design-system/MOTION.md` + `design-system/MASTER.md` §6/§8 only; no overlap with `src/scripts/`).
- **Wave 2 (16-04 — motion.ts)**: ready. The factory's `oneShot: true` code path is contract-tested (observer-factory.test.ts test "oneShot=true auto-unobserves") and ready for motion.ts to consume for one-shot reveal targets (D-07 / MOTN-02). Plan 04's motion.ts will import `makeRevealObserver` and pass `oneShot: true` for `.h1-section`, `.work-row`, `.project-prose p`, `.about-prose p` selectors.
- **Phase 15 D-26 chat regression gate**: untouched. This plan does not modify chat.ts, ChatWidget.astro, or any chat surface.
- **Test count baseline forward**: 283 GREEN / 55 RED / 338 total. Plans 03-06 will flip the 55 RED to GREEN as their implementations land (motion-css-rules / motion-doc / work-arrow-motion / motion / chat-pulse-coordination + reduced-motion extension).

---

## Self-Check: PASSED

**Files verified:**
- FOUND: `src/scripts/lib/observer.ts`
- FOUND: `src/scripts/scroll-depth.ts` (modified)

**Commits verified:**
- FOUND: `d7ed781` (feat: factory creation)
- FOUND: `dc36742` (refactor: scroll-depth consumes factory)

**Test gates verified:**
- FOUND: 31 GREEN in target test files (8 observer-factory + 8 scroll-depth + 15 analytics)
- FOUND: 0-lines diff in test files since pre-plan SHA db876cf (D-19 canary)
- FOUND: `pnpm check` 0/0/0; `pnpm build` clean

---

*Phase: 16-motion-layer*
*Plan: 02*
*Completed: 2026-04-27*
