---
phase: 14-chat-knowledge-upgrade
fixed_at: 2026-04-23T00:00:00Z
review_path: .planning/phases/14-chat-knowledge-upgrade/14-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 14: Code Review Fix Report

**Fixed at:** 2026-04-23
**Source review:** `.planning/phases/14-chat-knowledge-upgrade/14-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (WR-01 through WR-04)
- Fixed: 4
- Skipped: 0
- Out-of-scope (not attempted): 6 Info findings (IN-01 through IN-06) — `fix_scope` is `critical_warning`, so Info findings are deferred per workflow policy.

Each fix was verified with a Tier-1 re-read, a Tier-2 syntax check (`node --check` for `.mjs`, `tsc --noEmit -p tsconfig.json` for `.ts`), and — where applicable — the full vitest suite (223/223 passing after the last fix) plus a `build-chat-context.mjs --check` run (no drift against `src/data/portfolio-context.json`).

## Fixed Issues

### WR-01: CORS preview-suffix match still accepts unrelated hostnames that happen to end with `.portfolio-5wl.pages.dev`

**Files modified:** `src/lib/validation.ts`
**Commit:** `4806358`
**Applied fix:** Added a comment documenting why the Cloudflare-assigned `-5wl` random suffix is load-bearing (prevents another Pages user from squatting `portfolio.pages.dev` and bypassing the check). Tightened the hostname check to require at least one non-empty label before the suffix — rejects empty-label forms like `..portfolio-5wl.pages.dev` in addition to the apex hostname. Existing 16 CORS test cases in `tests/api/security.test.ts` continue to pass (apex-rejection, preview-allow, suffix-confusion-reject, wrong-protocol-reject all green).

### WR-02: `parseInt(contentLength)` accepts negative and non-integer values, silently bypassing body-size limit

**Files modified:** `src/pages/api/chat.ts`, `tests/api/chat.test.ts`
**Commit:** `0f4af6e`
**Applied fix:** Replaced `parseInt(contentLength, 10) > MAX_BODY_SIZE` with `Number(contentLength)` + `Number.isFinite` + `Number.isInteger` + `parsed < 0` + `parsed > MAX_BODY_SIZE`. Malformed values (`"abc"` → `NaN`, `"-1"` → `-1`, `"32768.5"` → fractional) now correctly reject with 413 `payload_too_large` instead of falling through. Updated the existing two test cases in `chat.test.ts` to mirror the new guard (as a shared `rejectsContentLength` helper so the test stays a living contract of the actual check) and added three new cases covering the malformed-value regressions (non-numeric, negative, fractional). Test file grew from 21 to 24 tests — all passing.

### WR-03: `readStringField` unquoted regex can swallow a trailing YAML comment into the value

**Files modified:** `scripts/build-chat-context.mjs`
**Commit:** `15a2190`
**Applied fix:** Restructured `readStringField` into explicit quoted-first / unquoted-fallback branches. The unquoted branch now strips YAML inline comments matching `/\s+#.*$/` (e.g., `title: foo # TODO` → `foo`) and returns `null` if the resulting value is empty after strip. Added a JSDoc note that all current MDX files use quoted form so this is latent-defect hardening rather than a live-bug fix. Ran `scripts/build-chat-context.mjs --check` — output `src/data/portfolio-context.json` unchanged (no drift), confirming behavior-preserving for the actual fixture set.

### WR-04: `readArrayField` bracket-form regex does not handle trailing commas or mixed quote styles cleanly

**Files modified:** `scripts/build-chat-context.mjs`
**Commit:** `fafa433`
**Applied fix:** Added a pre-split validation pass in the bracket-form branch of `readArrayField` that walks fully-quoted tokens (`/"([^"]*)"/g` + `exec` loop to isolate adjacent entries) and throws if any contains a comma. First iteration used a naive `/"[^"]*,[^"]*"/` regex which misfired on every MDX file because `[^"]*` crossed the closing quote of one entry into the opening quote of the next; the final version per-token-scans via a stateful `/g` regex so only intra-entry commas trigger the error. Verified on all 6 MDX files: `scripts/build-chat-context.mjs --check` reports `unchanged` (no drift), confirming zero false positives.

---

_Fixed: 2026-04-23_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
