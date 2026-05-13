---
phase: 20-email-render-resend-integration
fixed_at: 2026-05-13T00:00:00Z
review_path: .planning/phases/20-email-render-resend-integration/20-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 7
skipped: 1
status: partial
test_suite: pass
test_summary: "vitest: 567 passed, 2 skipped, 0 failed across 63 test files"
---

# Phase 20: Code Review Fix Report

**Fixed at:** 2026-05-13T00:00:00Z
**Source review:** `.planning/phases/20-email-render-resend-integration/20-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope (Critical + Warning): 8
- Fixed: 7
- Skipped (deliberate spec trade-off): 1
- Test suite after fixes: **PASS** (567 passed, 2 skipped, 0 failed)

Scope was `critical_warning` — Info findings (IN-01, IN-02, IN-03) were not
attempted in this run.

## Fixed Issues

### CR-01: `formatDuration` produces "NaNm NaNs" when `started_at`/`last_activity_at` is malformed

**Files modified:** `src/lib/email/render.ts`
**Commit:** `617ccdf`
**Applied fix:** Added two guards. (1) `composeBody` now treats
`Number.isNaN(startMs) || Number.isNaN(lastMs)` as `durationMs = 0` instead of
letting `Math.max(0, NaN) === NaN` propagate through `formatDuration`. (2)
`formatDuration` now coerces non-finite input to 0 via
`Number.isFinite(durationMs) ? durationMs : 0` as a belt-over-suspenders
defense for any future caller. Mirrors the chat-delivery.ts:504 NaN guard
added in the Phase 19 review for the same `Date.parse` failure mode.

### CR-02: Missing runtime validation of Resend `data.id` allows `undefined`/`null` to enter `DeliveredMarker.resend_message_id`

**Files modified:** `src/lib/email/resend.ts`, `tests/api/email-resend.test.ts`
**Commit:** `9849a7e`
**Applied fix:** Replaced the unsafe `as { id: string }` cast with runtime
validation: `typeof data.id !== "string" || data.id.length === 0` now classifies
the response as `failed_transient` with `error_class: "resend_2xx_missing_id"`,
emits `chat.delivery.retry` (instead of `chat.delivery.sent`), and lets the
retry harness make another attempt. Resend documents successful sends always
include a non-empty id, so the false-transient rate is expected to be
near-zero. Added 4 `it.each` test rows in
`tests/api/email-resend.test.ts` covering `{}`, `{ id: null }`, `{ id: "" }`,
`{ id: 12345 }` — all assert `failed_transient`, `http_status: 200`,
`error_class: "resend_2xx_missing_id"`, no `chat.delivery.sent` emission, and
correct `chat.delivery.retry` field shape. **Logic-bug verification:** the
runtime-validation branch is structural (typeof check) — Tier 2 syntax check
plus the new tests cover the three off-nominal shapes; no further human
verification required.

### WR-01: `attempt` parameter to `sendEmail` always reports `1`, breaking retry observability

**Files modified:** `src/lib/chat-delivery.ts`
**Commit:** `ceb591b`
**Applied fix:** Adopted Option A from the review. `retryWithBackoff` signature
changed from `fn: () => Promise<T>` to `fn: (attempt: number) => Promise<T>`;
the harness now passes `attempt + 1` (1-indexed) on each iteration. `sendOne`
gained an `attempt = 1` parameter and forwards it to `sendEmail` as the third
arg. The promoteOne call site now passes `(attempt) => sendOne(env,
transcript!, attempt)`. Result: every retry's `chat.delivery.{sent,retry,failed}`
log line now stamps the true 1-, 2-, or 3-indexed attempt number, restoring
the D-16 / D-17 retry-budget grep-ability contract.

### WR-02: Env-presence guard only fires when `DRY_RUN === "0"` literally — missing/empty/typo'd values silently bypass it

**Files modified:** `src/lib/chat-delivery.ts`
**Commit:** `3810176`
**Applied fix:** Hoisted the `RESEND_API_KEY + CHAT_*_EMAIL` validation out
of the `if (env.DRY_RUN === "0")` conditional. The dry-run early-return on
`=== "1"` still short-circuits before the guard; everything else (including
missing, empty, `"true"`, `"yes"`, typos) now hits the env validation, emits
the structured `chat.delivery.failed` log line with
`error_class: "resend_terminal_env_missing"`, and throws the terminal-class
error that promoteOne's catch translates into the standard failure path.
Also stamps the true `attempt` parameter on the log line now that WR-01
threads it through.

### WR-03: Bidi-override stripper misses LRM (U+200E), RLM (U+200F), and ALM (U+061C) — common spoofing chars

**Files modified:** `src/lib/email/render.ts`, `tests/api/email-render.adversarial.test.ts`
**Commit:** `91e3b49`
**Applied fix:** Extended `stripBidiOverrides` regex to `/[؜‎‏‪-‮⁦-⁩]/g`
(written with literal Unicode chars, not escapes, per the rest of the
codebase). The docstring now enumerates all 12 bidi codepoints and cites
WR-03. Added an `it.each` block in `tests/api/email-render.adversarial.test.ts`
with 3 rows (ALM, LRM, RLM); each asserts the marker is stripped from the
visitor content and the surrounding `Before` / `After` text is preserved.
Existing `bidi strip` test (covering the original 9 codepoints) still passes.

### WR-05: `idempotency_key` destructure relies on TypeScript-only contract for body shape stability

**Files modified:** `src/lib/email/render.ts`
**Commit:** `a413aaf`
**Applied fix:** Docstring-only — locked the `ResendPayload` field order at
the type declaration site with an explicit "FIELD ORDER IS LOAD-BEARING"
notice citing WR-05, the cross-file invariant (Resend's 24h Idempotency-Key
window matches on byte-identical request bodies), and the
`tests/api/email-resend.test.ts` body-shape lock that enforces it. Calls out
that any future refactor using `Object.assign` / spread to construct a
`ResendPayload` can silently reorder keys despite passing TypeScript. No
behavioral change.

### WR-06: `chat.delivery.retry` log lines after the abort-timeout fire come with `http_status: null` but no clear `network_err` vs `timeout` distinction at log-grep time

**Files modified:** `src/lib/email/resend.ts`
**Commit:** `a941150`
**Applied fix:** Collapsed the AbortError-specific catch branch and the
generic-Error catch branch into a single 3-way classifier:
- `err instanceof DOMException` → `errorClass = err.name` (captures
  AbortError, TimeoutError, and any future runtime variant)
- `err instanceof Error` → `errorClass = err.constructor.name` (TypeError,
  SyntaxError, etc.)
- otherwise → `errorClass = "UnknownError"`

The existing `abort timeout` test in `tests/api/email-resend.test.ts`
continues to pass because `new DOMException("aborted", "AbortError").name`
is `"AbortError"` — same value the old branch produced.

## Skipped Issues

### WR-04: HTML entity escapes appear literally in the plaintext email body

**File:** `src/lib/email/render.ts:144-162`
**Reason:** Deliberate spec trade-off per 20-RESEARCH MAIL-03 ("Every dynamic
field HTML-escaped at render time even though body is plaintext … defense-in-
depth in case some email client renders the plain text body in HTML mode").
Per the orchestrator instructions for this fix run, WR-04 is marked
**won't_fix** unless the change is purely additive (e.g. docstring tightening
that does not touch the sanitizer pipeline). The renderer's `escapeBodyField`
intentionally HTML-escapes every dynamic field including those flowing into
the plaintext body; changing that behavior would require a spec amendment
(MAIL-03 split sanitizer per output context) and re-running the adversarial
test battery — out of scope for this code-review-fix iteration.
**Original issue:** Visitor messages with quotes / apostrophes / code snippets
appear mangled (e.g. `&quot;how do I escape &lt;div&gt; in JSX?&quot;`) in
the operator's inbox. This is a quality WARNING, not a correctness bug.

## Out of Scope (Info findings)

Per `fix_scope: critical_warning`, the three Info findings in REVIEW.md
were not attempted in this iteration:

- **IN-01:** `extractSidFromIdempotencyKey` does not handle multiple `/`
  segments cleanly (docstring-tightening suggestion)
- **IN-02:** Test file imports `ResendResult` type but uses it explicitly
  in only one place (lint cleanup)
- **IN-03:** `wrangler-cron-shape.test.ts` and `wrangler-dry-run-shape.test.ts`
  duplicate two assertions (deliberate per attribution comments)

## Test Verification

After applying all 7 fixes, the full `pnpm test` suite reported:

```
Test Files  63 passed | 1 skipped (64)
Tests       567 passed | 2 skipped (569)
Duration    9.51s
```

Scoped re-run of email + chat-delivery tests (the surface most affected by
the fixes):

```
Test Files  4 passed (4)
Tests       81 passed (81)
```

The 81-test scoped pass includes the 4 new CR-02 rows and the 3 new WR-03
rows added in this iteration (74 baseline + 7 new = 81). No regressions.

---

_Fixed: 2026-05-13T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
