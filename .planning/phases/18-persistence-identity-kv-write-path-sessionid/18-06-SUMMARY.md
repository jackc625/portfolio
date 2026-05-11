---
phase: 18-persistence-identity-kv-write-path-sessionid
plan: 06
subsystem: chat-client
tags: [chat-client, sessionid-mint, ident-01, storage-version-bump, d-01-cross-visit, d-04-silent-fail, d-26-chat-surface, jsdom, crypto-randomuuid, localstorage]

# Dependency graph
requires:
  - phase: 18-persistence-identity-kv-write-path-sessionid
    plan: 01
    provides: "SPIKE — sessionId mint trigger locked to bubble-click (initChat openPanel path), confirmed crypto.randomUUID available in the chat.ts evaluation context"
  - phase: 18-persistence-identity-kv-write-path-sessionid
    plan: 03
    provides: "src/lib/validation.ts RequestSchema sessionId field (z.uuidv4().optional()) — accepts the field absent OR present-and-uuidv4; this plan emits the field conditionally"
  - phase: 18-persistence-identity-kv-write-path-sessionid
    plan: 05
    provides: "src/pages/api/chat.ts D-04 missing-tolerance branch — server handles absent sessionId by skipping appendTurn; allows this plan's silent-fail path to be end-to-end correct"
provides:
  - "src/scripts/chat.ts STORAGE_VERSION 1→2 bump (line 82) — existing version-gate at line ~104 auto-clears v1 blobs on next bubble-open per IDENT-01 / D-02"
  - "ChatStorage interface extended (line 74-79): `version: 2` literal + `sessionId: string` — type narrows the new shape; old v1 callers no longer compile"
  - "Module-scoped `let sessionId: string | undefined = undefined` (line 131) surfaces into streamChat body construction"
  - "`ensureSessionId()` idempotent sub-routine (line 149) — crypto.randomUUID + saveChatHistory; D-01 cross-visit continuity; D-04 silent fail wrapper"
  - "Bubble-click handler order: click → ensureSessionId() → openPanel() (line 783) — mint BEFORE animation begins so the first user-submit POST already carries sessionId"
  - "streamChat body conditional emission (line 235): `sessionId ? { sessionId, messages } : { messages }` — field OMITTED (not null) when absent; matches server's z.uuidv4().optional() contract"
  - "saveChatHistory signature extended: `(msgs, sid: string | undefined)` — no-op when sid undefined (D-04 silent fail without persistence)"
  - "loadChatHistory return shape: `{ messages, sessionId } | null` — full v2 shape surfaced to caller"
  - "tests/client/chat-sessionid-mint.test.ts — 8 tests (4 source-text + 4 behavioral) following tests/client/listener-dedup.test.ts two-prong pattern; verifies STORAGE_VERSION bump, ChatStorage shape, crypto.randomUUID call, conditional body shape, fresh mint, v1→v2 auto-clear, cross-visit continuity, D-04 silent fail"
affects: [18-07-forward-defense-and-meta02, 18-08-uat-and-test03-live, phase-19]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-scoped state for client-minted identifiers: `let sessionId: string | undefined = undefined` survives across initChat re-runs (astro:page-load idempotency guard ensures chatInitialized flag prevents double-binding but module state itself persists across re-entries in the same realm)"
    - "Idempotent mint sub-routine: ensureSessionId() guards on `if (sessionId) return` AND prefers stored sessionId via loadChatHistory before minting — safe to call multiple times across bubble open/close cycles"
    - "Try/catch around BOTH crypto.randomUUID AND saveChatHistory inside ensureSessionId — single failure point covers both Web-Crypto-blocked AND localStorage-disabled environments per D-04"
    - "Conditional field emission via JSON.stringify ternary — `sessionId ? { sessionId, messages } : { messages }` — produces a key-absent body (not a `null` body field) matching Zod's `.optional()` semantics; emitting `{ sessionId: null, messages }` would 400 since z.uuidv4() doesn't accept null"
    - "STORAGE_VERSION bump re-uses existing auto-clear path at chat.ts:104-106 (data.version !== STORAGE_VERSION → localStorage.removeItem + return null) — zero new code for v1→v2 migration; IDENT-01 wipe is the side-effect of the schema version check that already existed"
    - "Two-prong test pattern carried verbatim from tests/client/listener-dedup.test.ts: source-text prong (readFileSync + regex) catches future refactor that drops the invariant even if behavioral tests still pass under a mock; behavioral prong (jsdom + dynamic import + DOM click) exercises the runtime mint integration"

key-files:
  created:
    - "tests/client/chat-sessionid-mint.test.ts (207 LOC; 8 tests across 2 describe blocks)"
  modified:
    - "src/scripts/chat.ts (1059 LOC after edits; +61 / -20 net additive — interface bump, STORAGE_VERSION constant bump, saveChatHistory signature extension, loadChatHistory return-shape extension, module-scoped sessionId + ensureSessionId block, bubble-click ensureSessionId wire, streamChat body ternary, initChat openPanel restore destructure + sessionId adoption)"

key-decisions:
  - "Bubble-click as the mint trigger (per IDENT-01 + CONTEXT.md 'Specifics'): ensureSessionId() fires synchronously BEFORE openPanel() so the first user-submit POST already carries sessionId. Putting it inside openPanel would still work but coupling it to the click event (not the panel-open path) makes the test surface cleaner and matches PATTERNS.md Test 5 spy assertion."
  - "Module-scoped `let sessionId` (NOT closure-scoped inside initChat) — streamChat is a module-level export referenced by both production code and Plan 17's existing test suite; making sessionId reachable from streamChat without threading a parameter keeps the streamChat signature byte-identical (`chatMessages, onToken, onDone, onError`). Trading off: sessionId state survives across re-imports under vi.resetModules. The afterEach `vi.resetModules()` in chat-sessionid-mint.test.ts handles this for the new test surface."
  - "Conditional field emission (NOT field-with-null) for the streamChat body: server's RequestSchema is `z.object({ sessionId: z.uuidv4().optional(), ... })` — `optional()` accepts FIELD ABSENT or FIELD UUIDv4, but NOT field-with-null. Emitting `{ sessionId: null, messages }` would 400. The ternary on the JSON.stringify input ensures the absent branch is structurally key-absent, not value-null."
  - "Three-branch ensureSessionId logic (stored → fresh-mint → silent-fail): the stored-sessionId branch covers D-01 cross-visit continuity (returning visitor within 24h hits the same `live:{sid}` KV key); the fresh-mint branch covers first-time visitors; the silent-fail branch (try/catch) covers private browsing + Web-Crypto-blocked extensions per D-04. All three branches are exercised by behavioral tests 5, 6, 7, 8 respectively."
  - "loadChatHistory return-shape change (StoredMessage[] | null → { messages, sessionId } | null) was minimum-diff: changed ONLY the signature and the final `return data.messages` → `return { messages: data.messages, sessionId: data.sessionId }`. All four early-return-null paths (raw-null, version-gate-fail, TTL-gate-fail, catch) stayed byte-identical. The initChat openPanel restore site was updated to destructure both fields."

patterns-established:
  - "IDENT-01 client mint pattern: bubble-click handler synchronously invokes a module-scope `ensure*Id()` helper BEFORE the panel/widget animation begins → mint result is available for the first outbound POST. Future phases that add similar client-minted correlation IDs (e.g. anonymous device-id, ab-test bucket) should follow this trigger ordering."
  - "STORAGE_VERSION bump as IDENT migration mechanism: re-use the existing version-gate auto-clear path instead of writing a one-off migration shim. The version constant is the schema generation; bumping it is the migration. Zero migration code, zero data-loss risk for never-returning visitors (their stale blob expires via 24h TTL anyway)."
  - "Test fixture for jsdom client tests: minimal HTML mirror of the production component (ChatWidget.astro) inlined as a const string in the test file. Only the element IDs that initChat queries are needed — skips ARIA, styling, SVG content. Matches PATTERNS.md Test 5 fixture strategy and listener-dedup.test.ts implicit pattern (those tests don't need a fixture because chat.ts's `if (!panel) return` short-circuits on initChat when the DOM is empty; this plan's tests DO trigger bubble-click so the full fixture is required)."

requirements-completed: [IDENT-01]
# IDENT-02 was wired server-side by Plan 18-05 (D-11 assistant-turn appendTurn).
# IDENT-01 is the client mint side; this plan completes it.

# Metrics
duration: ~12 minutes
completed: 2026-05-11
---

# Phase 18 Plan 06: client-sessionid-mint Summary

**Client-side sessionId mint via crypto.randomUUID() on bubble click, persisted in the chat-history v2 localStorage blob with STORAGE_VERSION 1→2 auto-clear, conditionally emitted on /api/chat POST body — IDENT-01 + D-01 cross-visit + D-04 silent fail closed.**

## Performance

- **Duration:** ~12 minutes
- **Started:** 2026-05-11T16:16Z (baseline measurement)
- **Completed:** 2026-05-11T16:25Z (post-Task-3 gate)
- **Tasks:** 3 (Task 1 RED, Task 2 GREEN, Task 3 gate)
- **Files modified:** 2 (`src/scripts/chat.ts`, `tests/client/chat-sessionid-mint.test.ts`)

## Accomplishments

- **IDENT-01 client mint closed:** Bubble click now invokes ensureSessionId() BEFORE the openPanel animation, so the first user-submit POST already carries sessionId. The mint persists immediately via saveChatHistory so the NEXT page-load resumes the same session within the 24h TTL window.
- **STORAGE_VERSION 1→2 with zero new migration code:** The existing version-gate at chat.ts:104-106 (data.version !== STORAGE_VERSION → removeItem + return null) auto-clears v1 blobs on next bubble-open. v1 → v2 wipe is a side-effect of the schema version constant bump.
- **D-04 silent fail end-to-end correct:** Try/catch around crypto.randomUUID + saveChatHistory keeps the chat surface live when Web Crypto is extension-blocked or localStorage is private-browsing-disabled. streamChat body omits the sessionId field (NOT field-with-null) when undefined, matching the server's `z.uuidv4().optional()` contract.
- **D-01 cross-visit continuity verified:** Behavioral test 7 pre-seeds a valid v2 blob and asserts the existing sessionId is preserved across the bubble-click — `crypto.randomUUID` is NOT called, the spy records zero invocations.
- **8 new tests in two-prong shape:** 4 source-text + 4 behavioral, mirroring tests/client/listener-dedup.test.ts. Source-text prong catches future refactors that drop the invariants even if behavioral tests pass under mocks.

## Task Commits

Each task was committed atomically (TDD test → feat sequence):

1. **Task 1: Author tests/client/chat-sessionid-mint.test.ts (RED)** — `1813def` (test)
2. **Task 2: Update src/scripts/chat.ts — STORAGE_VERSION 1→2 + sessionId mint + streamChat body (GREEN)** — `193a32b` (feat)
3. **Task 3: Plan-end gate — full suite + astro check + 11-file D-26 battery** — verification only, no commit

**Plan metadata:** _(to follow this SUMMARY commit)_

## Files Created/Modified

- `tests/client/chat-sessionid-mint.test.ts` — NEW: 207 LOC, 8 tests (4 source-text prong + 4 behavioral prong). Hard-coded UUID fixture `8b0f7f1c-1234-4567-8901-abcdef012345`. Tests fresh mint, v1→v2 auto-clear, cross-visit continuity, D-04 silent fail.
- `src/scripts/chat.ts` — MODIFIED: 9 edits totaling +61 / -20 net. ChatStorage interface (line 74-79), STORAGE_VERSION constant (line 82), saveChatHistory signature + body (line 86), loadChatHistory return shape + body (line 103), module-scoped `let sessionId` + ensureSessionId function (lines 131-163), bubble-click handler ensureSessionId wire (line 783), streamChat body ternary (line 235 area), initChat openPanel restore destructure (lines 690-720 area).

### Final line numbers (post-edit)

| Item | Line | Notes |
| ---- | ---- | ----- |
| `interface ChatStorage` | 74 | `version: 2` literal + `sessionId: string` field |
| `const STORAGE_VERSION = 2` | 82 | bumped 1→2 per IDENT-01 / D-02 |
| `function saveChatHistory(msgs, sid)` decl | 86 | D-04 guard at line 89: `if (!sid) return;` |
| `function loadChatHistory()` decl | 103 | returns `{ messages, sessionId } | null` |
| `let sessionId: string | undefined` | 131 | module-scoped state |
| `function ensureSessionId()` decl | 149 | three-branch logic (stored / fresh-mint / silent-fail) |
| streamChat body conditional | 232-238 | `body: JSON.stringify(sessionId ? ... : ...)` |
| Bubble-click handler `ensureSessionId();` call | 783 | BEFORE openPanel() |

## Decisions Made

- **Bubble-click as mint trigger** (vs. openPanel-internal mint): preserves test surface ergonomics and matches PATTERNS.md Test 5 spy assertion. ensureSessionId() runs synchronously before openPanel() in the click handler's else branch.
- **Module-scoped sessionId** (vs. closure-scoped inside initChat): streamChat is a module-level export with a frozen signature. Module-scoping avoids threading sessionId through `(chatMessages, onToken, onDone, onError)`. Tradeoff: state survives across re-imports under vi.resetModules — handled in the test file's afterEach via explicit reset.
- **Conditional field emission, not field-with-null:** the server's `z.uuidv4().optional()` rejects `null`. The ternary on JSON.stringify keeps the absent branch structurally key-absent.
- **Test fixture inline string** (vs. importing ChatWidget.astro): minimal HTML matching only the element IDs initChat queries. Inline string avoids Astro component compilation in the test pipeline and keeps the test self-contained.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Typed fetchMock signature in chat-sessionid-mint.test.ts to satisfy astro check**

- **Found during:** Task 2 verification (`pnpm exec astro check`)
- **Issue:** The Task 1 RED test file used `vi.fn(async () => Response(...))` for the fetch mock in behavioral Test 8 (D-04 silent fail). Vitest inferred the parameter tuple as `[]` (zero args), so `fetchMock.mock.calls[0][1]` produced two TypeScript errors: ts(2493) `Tuple type '[]' of length '0' has no element at index '1'` and ts(2352) `Conversion of type 'undefined' to type 'RequestInit<CfProperties<unknown>>'`. astro check failed with 2 errors / 0 warnings.
- **Fix:** Replaced the untyped mock with `vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => { ... })`. The explicit parameter signature lets vitest infer the mock.calls tuple as `[RequestInfo | URL, RequestInit?]`. Removed the `as RequestInit` cast and added a `toBeDefined()` guard before reading `requestInit.body`.
- **Files modified:** `tests/client/chat-sessionid-mint.test.ts` (one-block edit inside Test 8)
- **Verification:** `pnpm exec astro check` → 0 errors / 0 warnings / 0 hints (after fix). Test 8 still passes.
- **Committed in:** `193a32b` (folded into the Task 2 GREEN commit since the typed signature only became meaningful once chat.ts produced the new body shape; the explicit choice of types is bound to the production code's contract).

---

**Total deviations:** 1 auto-fixed (1 blocking — astro check ts(2493) + ts(2352))
**Impact on plan:** Strictly internal to the test file's type annotations. Zero behavioral change. The fix was a one-block edit; the test logic + assertions are byte-identical to the planned shape.

## Issues Encountered

None — Task 1 RED state matched expectation (7 failed / 1 passed, with Test 8 passing on baseline because the BEFORE-state chat.ts already produced a sessionId-less body). Task 2 GREEN was first-shot success on all 8 tests. Task 3 gate produced clean 453 PASS / 0 FAIL / 2 SKIP / 79 chat-surface battery tests GREEN / astro check 0/0/0.

## Gate Status

| Gate | Result | Notes |
| ---- | ------ | ----- |
| `pnpm test` | 453 PASS / 0 FAIL / 2 SKIP (55 test files, 1 skipped) | Baseline was 445 — exactly +8 from this plan's new test file |
| `pnpm exec astro check` | 0 errors / 0 warnings / 0 hints (103 files) | Carries forward Plan 18-05 baseline |
| 11-file D-26 chat-surface focused battery | 11 files / 79 tests GREEN | All chat-surface tests stay green: sse-snapshot, anthropic-payload-shape, cache-hit-logs, validation, chat-session-id, chat-transcripts, listener-dedup, chat-panel-display, chat-sessionid-mint, no-imperative-display-flip, no-inline-display-on-chat-panel |
| Source diff isolation | `git diff HEAD~2 -- src/pages/api/chat.ts src/lib/validation.ts src/lib/chat-transcripts.ts src/prompts/chat-request-shape.ts wrangler.jsonc` exits 0 | api/server side untouched per success criterion #5 |
| `STORAGE_VERSION` value | `= 2`, zero `= 1` substrings in chat.ts | Per success criterion #6 |

**Plan 18-06 is the second chat-surface BLOCKING commit cleared in Phase 18** (Plan 18-05 was the first; the D-26 BLOCKING gate has now been validated twice across the two highest-risk chat-surface commits). Plan 18-03 also touched a chat-surface file (`src/lib/validation.ts`) but its surface area was smaller (Zod schema only — no DOM, no localStorage, no fetch).

## Next Phase Readiness

**Anchors for downstream plans:**

- **Plan 18-08 UAT anchor:** A real visitor session against `pnpm dev:worker` + sessionId on POST body now produces a `live:{sid}` key in CHAT_KV — verifiable manually via:
  ```bash
  wrangler kv key get --namespace-id 115f3c1b0f8a4a1da9fee78c48dcb749 "live:8b0f7f1c-..."
  ```
  against the preview namespace. The full IDENT-01 + IDENT-02 round-trip (client mint → server appendTurn) is wired end-to-end at this commit.

- **/gsd-verify-work anchor:** ROADMAP Phase 18 success criterion #3 ("client mints sessionId via crypto.randomUUID, persists with STORAGE_VERSION 1→2, includes in /api/chat body; server rejects non-UUIDv4") is FULLY satisfied at HEAD. The client emission path is closed by this plan; the server rejection path is closed by Plan 18-03 (Zod `z.uuidv4().optional()`).

- **Plan 18-07 forward-defense anchor:** Plan 18-07's META-02 source-text forward-defense (cacheable surface invariants + sessionId-not-in-anthropic-payload guard) can rely on chat.ts being the only file that originates sessionId on the client side. The streamChat body construction is the canonical emit site.

- **Plan 18-08 TEST-03 live anchor:** With both Plan 18-05 (server appendTurn wired) and Plan 18-06 (client mint wired) committed, a live `wrangler tail` against the dev:worker process should produce exactly two `chat.transcript.write_succeeded` (or `_failed` per D-09 silent log) events per user-turn-cycle: one D-10 user-turn write, one D-11 assistant-turn write — both keyed off the same `live:{sid}`.

**Concerns:** None. The plan landed clean. Phase 18 remains on the original 8-plan / 5-wave trajectory.

## Threat Surface Scan

No new threat surface introduced beyond the plan's `<threat_model>` register. T-18-06-01 through T-18-06-06 are all addressed in implementation:

- T-18-06-01 (forged sessionId) — accepted per opaque-correlation-ID disposition; 122-bit entropy makes guessing infeasible; KV-05 write quota caps abuse.
- T-18-06-02 (third-party script read of localStorage) — mitigated by single-origin no-third-party-scripts site policy + DOMPurify on bot responses.
- T-18-06-03 (crypto.randomUUID DoS) — mitigated by D-04 try/catch in ensureSessionId; chat UX continues with sessionId-omitted POST body.
- T-18-06-04 (malformed sessionId injection via DevTools) — mitigated by server-side `z.uuidv4().optional()` rejection at Plan 18-03.
- T-18-06-05 (mint failure invisibility to operator) — accepted; v1.4+ optional DEV-only client log.
- T-18-06-06 (in-memory v1 state across deploy boundary) — accepted per D-03; brief session-boundary discontinuity at deploy is acceptable.

## Self-Check: PASSED

- **Files created:** `tests/client/chat-sessionid-mint.test.ts` — FOUND
- **Files modified:** `src/scripts/chat.ts` — FOUND
- **Commit 1813def:** `test(18-06): tests/client/chat-sessionid-mint.test.ts — IDENT-01 mint + D-04 silent fail (RED)` — FOUND in `git log`
- **Commit 193a32b:** `feat(18-06): src/scripts/chat.ts STORAGE_VERSION 1→2 + sessionId mint + streamChat body — IDENT-01 + D-01 + D-04 silent fail (GREEN)` — FOUND in `git log`
- **Test count:** 453 PASS / 0 FAIL / 2 SKIP — VERIFIED via `pnpm test`
- **astro check:** 0 errors / 0 warnings / 0 hints — VERIFIED
- **11-file D-26 battery:** 11 files / 79 tests GREEN — VERIFIED
- **Source diff isolation:** api/server files untouched — VERIFIED via `git diff --exit-code HEAD~2 -- ...`

---
*Phase: 18-persistence-identity-kv-write-path-sessionid*
*Plan: 06 (client-sessionid-mint)*
*Completed: 2026-05-11*
