---
status: partial
phase: 17-foundations-migration-dns-debt-sweep
source: [17-VERIFICATION.md]
started: 2026-05-11T14:30:00Z
updated: 2026-05-11T14:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. FOUND-03 Pages retirement
expected: jackcutrara.com continues serving from the Cloudflare Worker; Pages project deleted from Cloudflare dashboard.
result: [pending]
note: Manual one-time dashboard action. 24h warm window opened ~2026-05-10 22:00 UTC; the window is open as of 2026-05-11. REQUIREMENTS.md FOUND-03 is `[~]` (partial) with retirement explicitly pending.

### 2. DNS-01 live DNS verification
expected: `dig TXT _dmarc.mail.jackcutrara.com` returns `v=DMARC1; p=none; rua=mailto:jackcutrara@gmail.com; ...`.
result: [pending]
note: DNS propagation + Resend dashboard verification are external to the codebase. `scripts/resend-warmup.mjs` documents the intent; only a resolver query confirms live state.

### 3. DNS-02 Postmaster Tools enrollment
expected: Postmaster Tools dashboard shows `mail.jackcutrara.com` with auth metrics accumulating (may still display "data pending volume" until 24-48h of additional volume).
result: [pending]
note: Google Postmaster Tools enrollment is a human-initiated external action.

### 4. Post-deploy production smoke (after `git push origin main`)
expected: jackcutrara.com chat panel opens (UAT-GAP-02); bot addresses visitor in second person (UAT-GAP-01); COPY button shows COPIED ~1.5s after click (UAT-GAP-03); no `AbortError: Transition was skipped` in console on rapid navigation (UAT-GAP-04).
result: [pending]
note: Local main is 40 commits ahead of origin/main. All four UAT gaps are fixed in local code (per DEPLOY-GATE.md operator sign-off) but not yet deployed. Post-deploy verification cannot be automated without a live production URL change.

### 5. TEST-01 D-26 full suite confirmation
expected: `pnpm test` exits with `419 PASS / 0 FAIL / 2 SKIP`.
result: pass
note: Already confirmed during Plan 17-08 post-commit verification (HEAD `7c0be1f`). Verifier conservatively re-listed this; recording it as `pass` per executor's verified run.

### 6. WR-01 clipboard-failure path (REVIEW-GAPS.md Warning)
expected: When `clipboard.writeText()` rejects, decide whether the COPY button should still show accent-colored COPIED feedback OR if the current ink-faint-color textContent swap is acceptable.
result: [pending]
note: Real but minor UX regression identified by gap-closure code review (`17-REVIEW-GAPS.md` WR-01). Product decision required: accept vs. fix in Phase 18 first plan, or open a small `/gsd-quick` task. Does NOT block deploy — degraded path only fires when the clipboard API fails (rare; mostly non-HTTPS preview contexts).

## Summary

total: 6
passed: 1
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps

(none yet — items are pending human action, not failures)
