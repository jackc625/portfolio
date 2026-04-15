# Phase 12 Deferred Items

Out-of-scope issues discovered during execution. Not fixed in this phase per SCOPE BOUNDARY rule (only auto-fix issues directly caused by current task's changes).

---

## Plan 12-02 discoveries

### Pre-existing test failure: `tests/client/contact-data.test.ts > email is jack@jackcutrara.com`

- **Discovered during:** Plan 12-02 Task 1 automated verify (`pnpm test -- --run`)
- **Root cause:** Commit `de85698 chore: updated contact info` changed `CONTACT.email` from `jack@jackcutrara.com` to `jackcutrara@gmail.com` in `src/data/contact.ts` but did NOT update `tests/client/contact-data.test.ts:6` which still asserts the old address.
- **Pre-existing evidence:** `git diff HEAD -- src/data/contact.ts tests/client/contact-data.test.ts` produced zero diff at Plan 12-02 start — the failure exists on HEAD regardless of any Plan 12-02 change.
- **Scope:** Unrelated to MobileMenu.astro inert extension (DEBT-02). Touching it here would violate SCOPE BOUNDARY.
- **Recommended fix-out:** Either the CONTACT-02 test should be updated to assert `jackcutrara@gmail.com`, or the data should be reverted to `jack@jackcutrara.com`. User decision — MEMORY notes the user's email is `jackcutrara@gmail.com`, so the test likely needs updating.
- **Suggested future plan:** A small follow-up task in Phase 13 (Content Pass) or a `/gsd:quick` fix-up.

Test suite status outside this one test: **92/93 pass** (99%). All markdown, chat API, security, and other client-side tests green.
