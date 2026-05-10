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
