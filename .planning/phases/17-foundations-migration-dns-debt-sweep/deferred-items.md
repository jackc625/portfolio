# Phase 17 — Deferred Items

Out-of-scope discoveries surfaced during phase execution. NOT fixed by their
discovering plan; tracked for explicit follow-up.

## Discovered during Plan 17-01 (2026-05-10)

### Pre-existing test failure: `tests/content/roadmap-amendment.test.ts`

**Status:** Pre-existing — failure reproduces at HEAD~1 (`0a52f77`) BEFORE any
Plan 17-01 changes. Confirmed via `git stash` + checkout-equivalent: with the
fixture commit and new test file un-applied, the test still fails identically.

**Symptom:**
```
FAIL tests/content/roadmap-amendment.test.ts > Phase 13 block mentions 'Approach & Architecture' as one section
AssertionError: expected '' to match /Approach & Architecture/
```

**Root cause:** The test splits `.planning/ROADMAP.md` on `### Phase 13:` and
`### Phase 14:` H3 headings, but ROADMAP.md no longer has those H3 headings.
Phase 13 was collapsed into the `<details>` v1.2-archive block at some point
during v1.2 → v1.3 transition. The test (authored 2026-04-15 by Plan 13-01,
commit `2f0b8bb`) was correct against that era's ROADMAP shape and silently
went stale when ROADMAP was restructured.

**Plan 17-01 scope decision:** Per execution deviation rules — "Only auto-fix
issues DIRECTLY caused by the current task's changes" — this is out of scope
for Plan 17-01 (fixture capture + snapshot test). The failure is in
`tests/content/`, not in the chat-surface D-26 battery.

**D-26 chat regression battery status:** GREEN. The pre-existing failure is
NOT in the chat surface (`api/chat.ts`, `chat.ts`, `validation.ts`,
`BaseLayout.astro`, `global.css`). Plan 17-01's 3 new tests are additive to
the chat-surface tests and all GREEN.

**Closure path (not Plan 17-01):** Either (a) update the test to navigate the
new `<details>`-collapsed ROADMAP shape, or (b) retire the test if the D-02
5-H2 amendment it guards is no longer load-bearing. Likely a 5-minute fix —
candidate for a `/gsd-quick` task in v1.3 or to be folded into Plan 17-04
("Docs/CI tech debt") since that plan already audits doc-level state.

## Discovered during Plan 17-05 (2026-05-10)

### Pre-existing `astro check` (typecheck) failures: `tests/client/listener-dedup.test.ts`

**Status:** Pre-existing — failure reproduces at `84c6493` (Plan 17-04 close-out
metadata commit, immediate predecessor of Plan 17-05) BEFORE any Plan 17-05
changes. Confirmed via `git checkout 84c6493 -- .` + `pnpm exec astro check`.

**Symptom:** `astro check` exits non-zero with two `ts(7006)` errors:
```
tests/client/listener-dedup.test.ts:161:12 - error ts(7006):
  Parameter 'c' implicitly has an 'any' type.
tests/client/listener-dedup.test.ts:164:12 - error ts(7006):
  Parameter 'c' implicitly has an 'any' type.
```

Both at `addEventListener` call inspections inside the `find()` callback over
`spy.mock.calls`. The same idiom that the listener-dedup test uses for
`logSpy.mock.calls.find((c) => c[0] === "astro:page-load")` — vitest's
`MockInstance.calls` is typed as `any[]` and the array element `c` becomes
`any` under `strict` mode without explicit annotation.

**Root cause:** Authored 2026-05-10 by Plan 17-03 commit `0ad77b3` (DEBT-04
idempotent listener registration), which did not run `pnpm build` /
`astro check` before commit. Subsequent plans (17-04, the Plan 17-04 close-out
metadata commit) also did not run `pnpm build`, so the errors silently
accumulated on `main`.

**Plan 17-05 scope decision:** Per execution deviation rules — "Only auto-fix
issues DIRECTLY caused by the current task's changes" — out of scope for
Plan 17-05 (DEBT-02 chat-cache observability + TEST-03 forward-defense). My
Task 1 introduced 2 IDENTICAL implicit-any errors in
`tests/api/cache-hit-logs.test.ts` (copy-pasted the listener-dedup idiom);
those 2 ARE Plan 17-05 scope and have been fixed inline via `(c: unknown[])`
annotation. The 2 errors in `tests/client/listener-dedup.test.ts` are NOT
fixed by Plan 17-05.

**Impact:** `pnpm build` fails on Cloudflare Workers deploys (this is why the
predecessor production deploys must have used a different build command, OR
the prior deploy was from before the listener-dedup test landed; needs audit).
Vitest runs are unaffected — `pnpm test` runs the test file fine; only the
`astro check` typecheck step is blocked. Production was deployed before this
errors were introduced, so live site is unaffected.

**Closure path (not Plan 17-05):** Annotate the two `find()` callbacks at
listener-dedup.test.ts:161 and :164 with `(c: unknown[])` to match the
canonical pattern used in `tests/api/cache-hit-logs.test.ts`. Two-line fix.
Candidate for `/gsd-quick` or fold into the Phase 18 first plan as a Rule 3
auto-fix prerequisite (Phase 18 WILL touch chat surface and run `pnpm build`
during normal development).

**Verification:** After Plan 17-05 close, `pnpm exec astro check` will report
exactly 2 errors (down from 4 at Plan 17-04 close) — the 2 in
listener-dedup.test.ts. My 2 errors in cache-hit-logs.test.ts are fixed
inline as part of Task 2's commit.
