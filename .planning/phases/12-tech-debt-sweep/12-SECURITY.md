---
phase: 12-tech-debt-sweep
asvs_level: L1
block_on: high
auditor: gsd-security-auditor
audit_date: 2026-04-15
threats_total: 12
threats_closed: 12
threats_open: 0
verdict: SECURED
---

# Phase 12 — Security Audit (Tech Debt Sweep)

Verification of all threat mitigations declared in PLAN threat_model blocks for Phase 12 (plans 12-01 through 12-06). Plans 12-04, 12-05, and 12-06 were declared N/A (docs/verification-only, zero code surface) and are recorded here for completeness. Plans 12-01, 12-02, and 12-03 carry 12 threats total; all closed with ground-in-code evidence.

## Threat Verification

### Plan 12-01 — Build Warnings Sweep

| Threat ID | Category | Disposition | Verdict | Evidence |
|-----------|----------|-------------|---------|----------|
| T-12-01-01 | Tampering (wrangler.jsonc rate_limits deletion) | mitigate | CLOSED | `wrangler.jsonc:1-12` contains only `name`/`main`/`compatibility_date`/`compatibility_flags`/`assets` — no `rate_limits` or `ratelimits` key. App-layer limiter at `src/pages/api/chat.ts:31-45` still present with `if (rateLimiter)` guard (silently no-ops when binding undefined). Byte-unchanged per SUMMARY commit history (`git diff src/pages/api/chat.ts` → 0 per plan 12-01 SUMMARY). |
| T-12-01-02 | Information disclosure (worker-configuration.d.ts in ESLint ignores) | accept | CLOSED | Accepted risk logged below. `eslint.config.mjs:6` adds exactly one entry: `"worker-configuration.d.ts"` alongside existing `.astro/`, `dist/`, `.claude/`, `.ship-safe/` ignores. Generated-file provenance self-documenting via filename. |
| T-12-01-03 | Denial of service (Wrangler upgrade TS drift) | mitigate | CLOSED | Post-upgrade `pnpm exec astro check` → `0 errors, 0 warnings, 0 hints across 45 files` per plan 12-01 SUMMARY §Task 1 & §Task 4. Fallback pin to 4.82/4.81 unused. |

### Plan 12-02 — MobileMenu + ChatWidget Inert

| Threat ID | Category | Disposition | Verdict | Evidence |
|-----------|----------|-------------|---------|----------|
| T-12-02-01 | Denial of service (MobileMenu focus trap Escape) | mitigate | CLOSED | `src/components/primitives/MobileMenu.astro:302-326` — `handleKeyDown` contains Escape-key early return at :303-306 and Tab focus-trap loop at :307-325. D-10 belt-and-suspenders fallback preserved verbatim (SUMMARY confirms byte-identical per git blame line range 293–317). |
| T-12-02-02 | Tampering (inert state leak) | mitigate | CLOSED | Symmetric pair verified: `MobileMenu.astro:276-279` (openMenu `setAttribute("inert", "")` on header/main/footer/.chat-widget) matched by `:294-297` (closeMenu `removeAttribute("inert")` on same four selectors). `.chat-widget` line at :279 and :297 are mirrored; no mismatch. |
| T-12-02-03 | Information disclosure (chat widget in a11y tree) | accept | CLOSED | Accepted risk logged below. Declared as UX improvement, not threat. |
| T-12-02-04 | Elevation of privilege (D-26 regression surface) | mitigate | CLOSED | `12-VALIDATION.md §D-26 Chat Regression Gate — Plan 12-02` records 7/7 automated gates PASS and 21/21 manual items APPROVED (Jack, 2026-04-15). Verdict line at :135: "ALL GREEN — automated (7/7) + manual (21/21) all confirmed." Phase-end consolidated gate at `12-VALIDATION.md:221-243` also APPROVED (Jack, 2026-04-15). |

### Plan 12-03 — Chat Copy Button Parity

| Threat ID | Category | Disposition | Verdict | Evidence |
|-----------|----------|-------------|---------|----------|
| T-12-03-01 | Tampering / XSS (createCopyButton markup emission) | mitigate | CLOSED | `src/scripts/chat.ts:252-269` — helper uses only `document.createElement`, `textContent` (:255, :261, :264), `setAttribute("aria-label", ...)` (:256), `.className =` (:254), `.type =` (:257), `.style.cssText =` (:258), `.style.color =` (:262, :265). Grep for `copyBtn.innerHTML` and `<svg` in chat.ts → 0 matches. XSS battery `tests/client/markdown.test.ts` retains strip-script, strip-javascript:, strip-data:URL tests (72 lines, XSS tests at :11-56). |
| T-12-03-02 | Information disclosure (clipboard content) | accept | CLOSED | Accepted risk logged below. Clipboard receives bot message user already saw — non-secret by definition. |
| T-12-03-03 | Denial of service (double-click transition storm) | mitigate | CLOSED | `src/scripts/chat.ts:817-827` — `copyBtn.replaceWith(copyBtn.cloneNode(true))` idempotency rewire preserved byte-identical (per SUMMARY: `git show HEAD~1` vs `HEAD` diff byte-equal). Test 5 in `tests/client/chat-copy-button.test.ts:59` (`cloneNode dance strips listeners`) confirms listener-removal compat. |
| T-12-03-04 | Repudiation / parity regression (live vs replay drift) | mitigate | CLOSED | `tests/client/chat-copy-button.test.ts:30-34` — Test 2 "markup identical between invocations" asserts `expect(live.outerHTML).toBe(replay.outerHTML)` at :33. Both call sites use the same helper: `chat.ts:315` (`createCopyButton(() => content)`, live-stream) and `:563` (`createCopyButton(() => msg.content)`, replay). |
| T-12-03-05 | Elevation of privilege (exported helper surface) | accept | CLOSED | Accepted risk logged below. Signature `(getContent: () => string) => HTMLButtonElement` at `src/scripts/chat.ts:252` — no DOM mutation of arbitrary elements, no fetch, no eval. Only export consumer is the test file per SUMMARY self-check. |

### Plans 12-04, 12-05, 12-06 — N/A (no code surface)

| Plan | Declaration | Status |
|------|-------------|--------|
| 12-04 OG URL production verify | N/A per plan (curl-based verification, read-only) | N/A — no threat register, no code change |
| 12-05 Master token exceptions | N/A per plan (docs-only) | N/A — no threat register, no code change |
| 12-06 Audit closeout | N/A per plan (docs-only) | N/A — no threat register, no code change |

## Accepted Risks Log

| Threat ID | Summary | Rationale for Acceptance |
|-----------|---------|--------------------------|
| T-12-01-02 | `worker-configuration.d.ts` suppressed by ESLint ignore | Generated by `wrangler types`; filename self-documents provenance. No source-code lint suppression. One ignore entry in `eslint.config.mjs:6`. |
| T-12-02-03 | Chat widget reachable in a11y tree | Chat widget is intentionally screen-visible. Making it inert while mobile menu is open is a UX/a11y improvement (closes WR-01 middle-element focus-trap edge case), not a security posture reduction. Categorized as feature, not threat. |
| T-12-03-02 | Clipboard content disclosure | Helper writes the bot message the user just saw on screen. No PII or secret material flows through clipboard. User-initiated action. |
| T-12-03-05 | Exported helper broadens module surface | `createCopyButton` export exists solely for test-file import. Tight signature `(() => string) => HTMLButtonElement`. No DOM mutation of arbitrary elements, no network, no eval. |

## Unregistered Flags

None. Plan 12-01 SUMMARY §Threat Model Status explicitly states "No new threat flags introduced". Plan 12-02 SUMMARY records no new threat flags (only deferred test issue at `deferred-items.md`, which is functional, not security). Plan 12-03 SUMMARY §Threat Flags: "None — no new security-relevant surface introduced beyond what was already in the `<threat_model>`."

## Grep Verification Receipts

- `copyBtn.innerHTML` in `src/scripts/chat.ts` → 0 matches
- `<svg` literal in `src/scripts/chat.ts` → 0 matches
- `createCopyButton` definition in `src/scripts/chat.ts:252` → 1 export, 2 call sites (:315 live, :563 replay)
- `copyBtn.replaceWith(copyBtn.cloneNode(true))` in `src/scripts/chat.ts:820` → 1 match (idempotency guard preserved)
- `rate_limits` / `ratelimits` in `wrangler.jsonc` → 0 matches
- `worker-configuration.d.ts` in `eslint.config.mjs:6` → 1 match
- `handleKeyDown` `Escape` branch in `MobileMenu.astro:303-306` → present
- `.chat-widget` `setAttribute("inert", "")` at `MobileMenu.astro:279` ↔ `.chat-widget` `removeAttribute("inert")` at `:297` → symmetric pair
- `tests/client/chat-copy-button.test.ts` → 5 `it(...)` tests present (lines 13, 30, 36, 50, 59)
- Parity assertion `expect(live.outerHTML).toBe(replay.outerHTML)` at `tests/client/chat-copy-button.test.ts:33`
- `tests/client/markdown.test.ts` → XSS battery present (strip script, strip `javascript:`, strip `data:` URLs)

## Verdict

**SECURED.** 12/12 threats closed with code-grounded evidence. Zero open threats. Zero unregistered flags. All accept-disposition threats have documented rationale in the Accepted Risks Log. ASVS L1 block_on=high threshold not triggered.
