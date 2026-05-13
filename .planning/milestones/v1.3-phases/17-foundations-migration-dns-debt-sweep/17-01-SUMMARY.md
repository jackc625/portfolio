---
phase: 17-foundations-migration-dns-debt-sweep
plan: 01
subsystem: testing
tags: [cloudflare, sse, snapshot-test, byte-identical, vitest, phase-17, d-15]

# Dependency graph
requires:
  - phase: 16-motion-layer
    provides: D-26 chat regression battery (117/117 GREEN) and the unmodified pre-migration src/pages/api/chat.ts SSE surface that this plan snapshots
provides:
  - Canonical 38-byte SSE frame fixture (tests/fixtures/sse-snapshot-frames.bin) captured BEFORE any migration code lands
  - Canonical 4-key SSE response-header fixture (tests/fixtures/sse-snapshot-headers.json)
  - tests/api/sse-snapshot.test.ts — 3 GREEN tests asserting D-15 byte-identical SSE shape via Buffer.compare + header byte-equality + source-text guard
  - Anthropic SDK mock at the test seam (single-token "Hello" yield), reusable by future SSE-shape tests
  - cloudflare:workers virtual-module mock pattern for vitest (env.ANTHROPIC_API_KEY stub) — first time this seam is exercised in tests
affects: [17-02, 17-03, 17-05, 18, 19]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - vi.mock("cloudflare:workers", ...) — virtual-module stub enabling direct import of route modules in vitest (previously avoided per Plan 14-03 SUMMARY's recorded lesson)
    - Buffer.compare(actual, expected) === 0 for SSE byte-identical assertion (replaces brittle toContain string-match)
    - Async generator yield pattern in Anthropic.messages.create mock — closer to Anthropic streaming-iterator real shape than the `start()` ReadableStream pattern used in tests/api/chat.test.ts

key-files:
  created:
    - tests/fixtures/sse-snapshot-headers.json
    - tests/fixtures/sse-snapshot-frames.bin
    - tests/api/sse-snapshot.test.ts
    - .planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md
  modified: []

key-decisions:
  - "Fixture commit landed BEFORE the test file (Task 1 → Task 2) to honor D-04/D-11 ordering at the commit level, not just the plan level — the fixture exists in git history as a standalone artifact independent of the test that consumes it"
  - "Captured the deterministic envelope (38 bytes: data: {\"text\":\"Hello\"}\\n\\n + data: [DONE]\\n\\n) rather than raw live-API bytes — per RESEARCH §\"Pitfall 2\" the fixture must isolate server frame structure from variable Anthropic output"
  - "Mocked Anthropic + cloudflare:workers at the SDK/virtual-module boundary instead of refactoring chat.ts to inject the client — keeps src/pages/api/chat.ts untouched (D-04 / D-11 hard requirement)"
  - "Plan's stated 36-byte fixture size was an arithmetic miscount; canonical server output is 38 bytes (data: {\"text\":\"Hello\"}\\n\\n is 24 bytes, not 22). Test asserts byte equality against the fixture file content, not a hardcoded length, so the canonical 38-byte fixture remains the source of truth — see Deviations §1."

patterns-established:
  - "SSE snapshot test pattern: mock @anthropic-ai/sdk at module scope, mock cloudflare:workers, then dynamic-import POST from src/pages/api/chat.ts after mocks are in place"
  - "Forward-compatibility docblock for fixture tests: explicit named callout of upcoming Phase 18 ctx.waitUntil amendment so the fixture-validity expectation survives the cross-phase boundary"

requirements-completed: [TEST-02]

# Metrics
duration: 6min
completed: 2026-05-10
---

# Phase 17 Plan 01: D-15 SSE Byte-Identical Snapshot Fixture Summary

**Pre-migration ground truth committed: 38-byte canonical SSE fixture + 4-key header fixture + 3-test vitest battery asserting Buffer.compare byte-equality on /api/chat output. Day-1 D-04/D-11 gate held — no migration code on the same branch.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-05-10T21:03:11Z
- **Completed:** 2026-05-10T21:08:53Z
- **Tasks:** 2 (both atomic commits)
- **Files created:** 3 (1 test + 2 fixtures)
- **LOC added:** +138 (128 test + 10 fixture text; binary not counted)

## Accomplishments

- Captured the canonical SSE byte stream that `/api/chat` emits — 38 bytes ending in `0a 0a` (LF LF, no CR) — as a binary fixture that future cutovers must byte-match.
- Locked the 4-header response surface (`content-type`, `cache-control`, `connection`, `content-encoding`) as a separate JSON fixture; HTTP/2 will normalize keys to lowercase regardless of source-case so the fixture uses lowercase keys.
- Authored 3 vitest tests (headers byte-identical, frame bytes byte-identical via `Buffer.compare`, source-text anti-regression guard) — all GREEN on first run against the current pre-migration `src/pages/api/chat.ts`.
- Established the first vitest mock of `cloudflare:workers` virtual module in this repo. Plan 14-03 SUMMARY had documented that direct import of route modules was avoided because of `cloudflare:workers` env import; this plan demonstrates the reusable mock pattern that unblocks future route-module testing.
- Day-1 ordering held: `git diff HEAD~2 HEAD` shows ONLY 3 files changed — all under `tests/fixtures/` or `tests/api/`. ZERO src/, ZERO config, ZERO migration code on the branch.

## Task Commits

Each task was committed atomically per the plan's `<done>` blocks:

1. **Task 1: Capture canonical SSE bytes and write fixture files** — `d6c2f0e` (test)
   - Commit message: `test(17-01): capture SSE snapshot fixture for D-15 byte-identical (TEST-02)`
   - Files: `tests/fixtures/sse-snapshot-headers.json`, `tests/fixtures/sse-snapshot-frames.bin`
2. **Task 2: Author tests/api/sse-snapshot.test.ts asserting byte-identical against fixtures** — `a4d5db6` (test)
   - Commit message: `test(17-01): add D-15 byte-identical SSE snapshot test (TEST-02 / Phase 17 D-04)`
   - Files: `tests/api/sse-snapshot.test.ts`

**Plan metadata commit:** *(this commit — SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md + deferred-items.md)*

## Files Created/Modified

| Path | Bytes | SHA256 | Purpose |
|------|-------|--------|---------|
| `tests/fixtures/sse-snapshot-headers.json` | 147 | `a4f9653f1dc2ff286fbc6f76834b99c8c06762f30809e1578ee13f74c5e47316` | 4 SSE response headers, lowercase keys |
| `tests/fixtures/sse-snapshot-frames.bin` | 38 | `fbf6926635f42e829f24edbaaf510ca6b8dd9937c66b6e223fe35d8bcf62460d` | Canonical SSE frame bytes, terminates `0a 0a` |
| `tests/api/sse-snapshot.test.ts` | 4764 | `f58ec7ea358bf8e30acbd3cbee401cd5f9134f485bd250cceebe8c9e4ebacc2a` | 3 vitest tests (headers, frame bytes, source-text guard) |
| `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md` | — | — | Out-of-scope pre-existing test failure log |

Fixture-tamper detection in future phases: compare SHA256s against the table above. Any drift = the fixture was regenerated outside an explicit D-15 amendment.

## Test Count Delta

- **Pre-Plan 17-01 baseline:** 337 tests passing in vitest (plus 1 pre-existing unrelated content-test failure — see Deviations §2 and `deferred-items.md`).
- **Post-Plan 17-01:** 340 tests passing (+3 additive: D-15 headers, D-15 frame bytes, D-15 source-text guard). The 1 pre-existing failure persists, untouched.
- **Chat-surface battery (D-26 anchor):** 276/276 GREEN across `tests/api/`, `tests/client/`, `tests/build/` (includes the 3 new tests). TEST-01 (D-26 ≥ 117/117) gate intact.

NOTE: The "117/117" in REQUIREMENTS.md TEST-01 refers to the *D-26 chat regression battery* (chat surface only — `chat.ts`, `api/chat.ts`, `validation.ts`, `BaseLayout.astro`, `global.css`), not the full suite. Repo-total has grown to 340+; chat-surface subset is the load-bearing gate.

## Decisions Made

- **Day-1 D-04/D-11 ordering enforced at commit level**, not just plan level: fixture commit (`d6c2f0e`) was authored as a standalone commit BEFORE the test commit (`a4d5db6`), so the fixture exists in git history even if the test were ever reverted. This is stricter than the plan required (it allowed both tasks on the same branch as long as no migration code).
- **No migration code on the branch.** Verified via `git log --oneline -3`: the only Phase-17 commits on main are `d6c2f0e` (fixture) and `a4d5db6` (test). Parent commit `0a52f77` is `docs(17): create phase plan` — also non-code.
- **Mock at the SDK/virtual-module boundary**, not at the handler boundary: by mocking `@anthropic-ai/sdk` and `cloudflare:workers` directly, `src/pages/api/chat.ts` source remains untouched (D-04/D-11). Alternative — refactor chat.ts to accept an injected Anthropic client — was rejected because it would itself be migration code.
- **Async generator yield pattern in the Anthropic mock**, not a ReadableStream `start()` pattern: matches the real `client.messages.create()` streaming-iterator shape closer than the in-file mock in `tests/api/chat.test.ts:117-157`, which constructs the SSE bytes itself rather than testing the handler's construction of them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan stated 36-byte fixture size; canonical server output is 38 bytes**

- **Found during:** Task 1 (fixture generation)
- **Issue:** The plan's acceptance criteria and `<action>` block both stated `data: {"text":"Hello"}\n\n` is "22 bytes" and the total fixture should be 36 bytes. The actual byte count of `data: {"text":"Hello"}\n\n` is 24 bytes (22 visible chars + 2 LF bytes), making the total 38 bytes. The plan miscounted by 2 bytes.
- **Why it matters:** The fixture must match what `src/pages/api/chat.ts` actually emits on the wire. If we'd written 36 bytes to match the plan's arithmetic, the snapshot test would fail every run because the server's real output is 38 bytes. The plan's *intent* (canonical bytes) and its *arithmetic* (36) contradicted each other; we honored the intent.
- **Fix:** Wrote the canonical 38-byte content (the plan's intended bytes) rather than truncating to the plan's stated length. Test asserts `Buffer.compare(actual, expected) === 0` against the fixture *file* (no hardcoded length expectation in the test code), so the fixture is self-validating regardless of size.
- **Files modified:** `tests/fixtures/sse-snapshot-frames.bin` (38 bytes, not 36); `tests/api/sse-snapshot.test.ts` (asserts byte-equality against fixture, no `b.length === 36` check)
- **Verification:** `node -e "const b=require('fs').readFileSync('tests/fixtures/sse-snapshot-frames.bin'); console.log(b.length, b[b.length-1].toString(16), b[b.length-2].toString(16))"` → `38 a a`. End-bytes `0a 0a` (LF LF) preserved per acceptance criteria. `pnpm test tests/api/sse-snapshot.test.ts` → 3/3 GREEN, byte-equality assertion holds.
- **Committed in:** `d6c2f0e` (fixture) — commit body explicitly documents the arithmetic correction.

**2. [Out of scope - logged to deferred-items.md] Pre-existing unrelated test failure**

- **Found during:** Task 2 (running `pnpm test` full suite per acceptance criteria)
- **Issue:** `tests/content/roadmap-amendment.test.ts` fails with `expected '' to match /Approach & Architecture/`. The test splits ROADMAP.md on `### Phase 13:` and `### Phase 14:` H3 headings, but those headings have been collapsed into the v1.2 `<details>` archive block.
- **Why it's NOT a Rule 1 fix:** Per execution deviation rules, scope is limited to "issues DIRECTLY caused by the current task's changes." Reproduces at `HEAD~1` (`0a52f77`) with NO Plan 17-01 changes applied — pre-existing.
- **Action:** Logged to `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md` with full context (symptom, root cause, scope decision, suggested closure path). Test is in `tests/content/`, NOT in the D-26 chat-surface battery; TEST-01 chat-regression gate remains GREEN (276/276).
- **Files modified:** `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md` (NEW)
- **Verification:** `git stash` + run-at-HEAD~1 reproduced identical failure. Plan 17-01 commits do not touch ROADMAP.md or that test file.

---

**Total deviations:** 1 auto-fixed (Rule 1 — plan arithmetic miscount) + 1 deferred (out-of-scope pre-existing failure).
**Impact on plan:** Deviation §1 was a documentation correction to honor the plan's *intent* (canonical bytes) when its *arithmetic* was wrong by 2 bytes; the canonical fixture is the load-bearing artifact and matches server output. Deviation §2 is admin-only — no chat-surface regression, gate intact.

## Issues Encountered

- **`cloudflare:workers` import in vitest:** `src/pages/api/chat.ts:5` imports `env` from `cloudflare:workers`, a Cloudflare Workers virtual module that does not exist in Node/vitest. Plan 14-03 SUMMARY (2026-04-23) had recorded the previous workaround: "When a route module needs a pure helper whose logic must be testable without mocking the HTTP layer, extract the helper to a NON-route directory" — and `tests/api/chat.test.ts` consequently never imports `chat.ts` directly. Plan 17-01 took the other path: mock `cloudflare:workers` with `vi.mock("cloudflare:workers", () => ({ env: { ANTHROPIC_API_KEY: "test-key-for-mock" } }))`. Mock-pattern establishes a precedent for future route-module direct-import tests.
- **Async generator vs. raw stream in Anthropic mock:** First attempt would have constructed a `ReadableStream` like `tests/api/chat.test.ts` does — but that's the server-side encoding, not what `messages.create()` actually returns. `messages.create({stream:true})` returns an async iterable of event objects (`{type:"content_block_delta", delta:{type:"text_delta", text:...}}`). Final mock uses `async function* generate() { yield { type: "content_block_delta", ... }; }` to match the real SDK contract; the handler then encodes the yielded events into SSE bytes via its own logic — which is exactly what the test is checking byte-identical.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: test-fixture-tamper-detection | tests/fixtures/sse-snapshot-frames.bin | Fixture is the source of truth for D-15. SHA256 `fbf69266…2460d` recorded above. Future phases checking byte-identical must compare against this hash; any drift outside an explicit D-15 amendment is a regression. |
| threat_flag: test-mock-precedent | tests/api/sse-snapshot.test.ts | First vitest mock of `cloudflare:workers` virtual module in this repo. Future tests that import route modules directly may copy this pattern; care needed not to silently substitute production env shapes (the mock only declares `ANTHROPIC_API_KEY` — other env reads in chat.ts code paths not exercised by this test would read `undefined`). |

## Self-Check

Verifications performed before recording PASS:

- File `tests/fixtures/sse-snapshot-headers.json`: EXISTS, 147 bytes, 4 keys validated.
- File `tests/fixtures/sse-snapshot-frames.bin`: EXISTS, 38 bytes, ends `0a 0a`.
- File `tests/api/sse-snapshot.test.ts`: EXISTS, 4764 bytes, file-level docblock contains `Phase 18 will add ctx.waitUntil` (grep -c → 1).
- Commit `d6c2f0e` (Task 1 — fixture): `git log --oneline --all | grep d6c2f0e` → FOUND.
- Commit `a4d5db6` (Task 2 — test): `git log --oneline --all | grep a4d5db6` → FOUND.
- `pnpm test tests/api/sse-snapshot.test.ts` → 3/3 GREEN.
- `pnpm test tests/api/ tests/client/ tests/build/` (D-26 chat-surface superset) → 276/276 GREEN.
- `git diff --stat HEAD~2 HEAD` → 3 files, all under `tests/` — no src/, no config, no migration code.
- `git log --oneline -3 main`: confirms only 17-01 fixture + test commits + docs(17) plan commit on main.

## Self-Check: PASSED

## Next Phase Readiness

- **Plan 17-02 (Wave 1 — Pages → Workers migration) is unblocked.** It can now reference the fixture + snapshot test as the D-15 gate.
- Plan 17-02 will modify `wrangler.jsonc`, create `src/worker.ts`, delete `scripts/pages-compat.mjs`, and edit `src/lib/validation.ts` + `tests/api/security.test.ts` (suffix rename). After each Plan 17-02 commit, `pnpm test tests/api/sse-snapshot.test.ts` must remain 3/3 GREEN — that is the D-15 verification.
- Phase 18 forward-compat: the test file's docblock explicitly calls out the planned `ctx.waitUntil(appendTurn(...))` amendment in `api/chat.ts`. Because `ctx.waitUntil` runs out-of-band of the SSE response stream, it does NOT modify response bytes, so the fixture should pass through Phase 18 unchanged. If Phase 18 trips this test, the failure is in headers or frame shape, not `waitUntil` timing — the docblock guides the diagnostic.
- **Phase 21 (deferred to v1.4+) note:** any future plan that intentionally amends `/api/chat` SSE shape (e.g., adding a new frame type, changing a header) must (a) commit a D-15 amendment plan-time, (b) regenerate the fixture, (c) update the docblock to record the amendment phase + reason. Do NOT regenerate the fixture silently.

---
*Phase: 17-foundations-migration-dns-debt-sweep*
*Plan: 17-01*
*Completed: 2026-05-10*
