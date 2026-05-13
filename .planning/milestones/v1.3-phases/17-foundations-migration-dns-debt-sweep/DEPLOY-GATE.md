---
type: deploy-gate
phase: 17-foundations-migration-dns-debt-sweep
plan: 08
created: 2026-05-11
confirmed: 2026-05-11
status: confirmed
operator: Jack Cutrara
gate: CONFIRMED
---

# Phase 17 Wave 7-10 Gap Closure — Deploy Gate

**RELEASE BLOCKER**: Local main is 38 commits ahead of origin/main.
Production "works" today only because origin/main has not received DEBT-05
(commit 1c148c9). Deploying ANY commit on or after DEBT-05 without Plans
17-07..10 breaks the production chat panel.

After this gate is CONFIRMED, the next `git push origin main` will deploy:

- DEBT-05 (1c148c9) — CSS-only #chat-panel display state machine
- DEBT-04 (0ad77b3) — idempotent astro:page-load listener registration
- DEBT-01..03 (Plans 17-04, 17-05, 17-06) — observability + CI enforcement
- Pages → Workers Static Assets migration (FOUND-01..04)
- DNS-01..02 — Resend domain authored + warmed (Phase 17-06)
- Plan 17-07 — chat voice-split fix (UAT Gap #1)
- Plan 17-08 — #chat-panel inline display:none removal (UAT Gap #2 — THIS plan)
- Plan 17-09 — COPY button feedback window fix (UAT Gap #3)
- Plan 17-10 — pageswap handler swallowing implicit @view-transition AbortError (UAT Gap #4)

## Late-Surfacing Regression (Plan 17-08 Rule 3 inline deviation, 2026-05-11)

The FIRST attempt at this deploy-gate UAT (commit `7f529a0`) surfaced a
**BLOCKING regression** that prevented `gate: CONFIRMED`: POST /api/chat from
http://localhost:4321 returned **403 Forbidden** under `pnpm dev` — DevTools
Network tab showed Origin=http://localhost:4321, response body literal
`Forbidden`. Chat UI displayed "Sorry, I'm having trouble right now."

**Root cause:** `src/lib/validation.ts:87` declared
`const ALLOW_LOOPBACK = import.meta.env.DEV`. The @astrojs/cloudflare adapter
does NOT statically replace `import.meta.env.DEV` in SSR routes under
`astro dev` the way Vite does in client bundles. DEV evaluated falsy in the
dev SSR runtime, so `isAllowedOrigin("http://localhost:4321")` returned false
and the request was rejected. Vitest sets DEV=true by default, so
`tests/api/security.test.ts` passed for two days (since WR-04 landed in
commit dbdd461 / Plan 17-02) and masked the regression. The dev /api/chat
path was never exercised end-to-end until the chat panel started opening on
dev today (commit `7f529a0`).

**Why production was unaffected:** the deployed Worker legitimately never
receives Origin=http://localhost:4321 from a browser; production-bundle
tree-shaking statically eliminates the ALLOW_LOOPBACK branch entirely.

**Fix (commit `7af2841`):** broadened ALLOW_LOOPBACK to a three-signal
disjunction:

1. `import.meta.env.DEV === true` — Vitest + Vite-statically-replaced client bundles.
2. `import.meta.env.MODE === "development"` — @astrojs/cloudflare SSR routes under `astro dev` (the missing signal).
3. `process.env.NODE_ENV === "development"` — pure-Node fallback.

Each operand is statically replaced to a literal during `astro build`
(DEV → false, MODE → "production", NODE_ENV → "production"), so the entire
ALLOW_LOOPBACK branch emits **zero bytes** in the deployed Worker bundle —
verified post-build by grep on `dist/server/chunks/chat_CqagseDb.mjs`
showing `isAllowedOrigin()` skipping directly from URL parsing to
`WORKERS_PREVIEW_SUFFIX` with no localhost/loopback references.

**Production CORS posture UNCHANGED.** Deployed Worker continues to reject
Origin=http://localhost:4321 (WR-04 defense-in-depth against Origin spoofing).

**Regression lock:** new build-time source-text test
`tests/build/validation-loopback-source.test.ts` (3 assertions) asserts the
disjunction stays present in source so a future contributor cannot silently
revert to the single-signal form and reintroduce the dev-403 regression.

**Re-run required.** All six manual checks below MUST be re-executed against
the post-fix HEAD (`7af2841`) — the prior UAT was halted at check #2.

## Pre-Deploy Checklist

Run all checks below. Each MUST pass before `git push origin main`.

### Test-Environment Mapping (read first — added 2026-05-11)

The WR-04 ALLOW_LOOPBACK fix (commit `7af2841`) intentionally limits the
localhost-Origin bypass to `astro dev` SSR (signal: `MODE === "development"`)
and Vitest (signal: `DEV === true`). The `pnpm preview` build emits a
production bundle where Vite tree-shakes all three loopback signals to
literal `false` — by design, so preview mirrors the deployed Worker. This
means **`pnpm preview` will reject every POST /api/chat from
http://localhost:4321 with 403 Forbidden**, exactly as the deployed Worker
will reject Origin spoofing. That is correct WR-04 behavior, not a bug.

Practical consequence for this gate:

| Check | Where it runs | Why |
| --- | --- | --- |
| 1. Local build clean | offline (test/check/build) | no server |
| 2. Panel-open smoke | `pnpm dev` | exercises dev SSR + chat round-trip; loopback CORS bypass is active |
| 3. Production-build markup | `pnpm preview` | **DOM-inspection only — DO NOT send a chat message**; verifies the static markup the deployed Worker will ship |
| 4. COPY button feedback | `pnpm dev` | requires a real bot reply; only the dev loopback bypass permits the round-trip |
| 5. AbortError-free nav | `pnpm dev` | needs the page-shell ↔ chat-island state intact through real navigation; same loopback constraint as check 4 |
| 6. Voice-split | `pnpm dev` | requires a real Anthropic round-trip with the third-person `<knowledge>` block; same loopback constraint as check 4 |

Production verification (after deploy) re-runs checks 4 + 5 + 6 against
https://jackcutrara.com, where the deployed Worker accepts
Origin=https://jackcutrara.com legitimately. See the "Post-Deploy
Verification" section at the bottom of this file.

### 1. Local build is clean

- [ ] `pnpm test` exits 0 (full suite GREEN, including B1 self-test, no-inline-display test, COPY button tests, pageswap handler test)
- [ ] `pnpm exec astro check` exits 0
- [ ] `pnpm build` exits 0

### 2. `pnpm dev` smoke test (UAT Gap #2 closure verification)

Run `pnpm dev` and open http://localhost:4321/.

- [ ] Click red chat bubble — panel OPENS with scale-in animation (or instant under reduce-motion)
- [ ] Click close (X) — panel HIDES cleanly
- [ ] Re-open + close 3 times — no glitches

### 3. `pnpm preview` production-build markup (DOM-only — DO NOT send a chat message)

Per the Test-Environment Mapping above, the production preview deliberately
rejects localhost Origins (WR-04 mirror). This check verifies the static
markup the deployed Worker will ship; the chat round-trip checks (4-6) run
in `pnpm dev` instead.

Stop `pnpm dev`, then `pnpm build && pnpm preview`. Open http://localhost:4321/.

- [ ] Click chat bubble — panel OPENS (proves production build emits the post-fix markup)
- [ ] Inspect `<div id="chat-panel">` in DevTools — verify NO `display:` in style attribute
- [ ] Verify computed `display: flex` while `.is-open` is in classList; `display: none` after .is-open removed
- [ ] (Do NOT send a chat message in preview — a 403 here is correct WR-04 behavior, not a regression. Round-trip checks happen in `pnpm dev` below.)

### 4. COPY button feedback verification (UAT Gap #3 — Plan 17-09 fix)

Stop `pnpm preview`, run `pnpm dev`, open http://localhost:4321/, click the
chat bubble (panel scale-in).

- [ ] Send "hi", wait for bot reply
- [ ] Hover over bot message — COPY button appears (pre-click discovery affordance)
- [ ] Click COPY — button label changes to COPIED (red/accent color)
- [ ] **COPIED label STAYS VISIBLE for ~1.5 seconds even when cursor moves away from the wrapper** (UAT Gap #3 closure)
- [ ] After ~1.5s: button reverts to COPY and fades out via the 200ms opacity transition
- [ ] Paste in another window — bot message text is in clipboard

### 5. AbortError-free navigation (UAT Gap #4 — Plan 17-10 fix)

With `pnpm dev` running (continued from check 4):

- [ ] Open DevTools Console; clear it
- [ ] Navigate rapidly between pages (home -> projects -> about -> home — click within ~200ms each)
- [ ] **NO `Uncaught (in promise) AbortError: Transition was skipped` messages in console** (UAT Gap #4 closure)
- [ ] Pages still transition with the 200ms fade (no-preference) or snap (reduce)

### 6. Voice-split verification (UAT Gap #1 — Plan 17-07 fix)

With chat panel open in `pnpm dev` (re-open if navigation in check 5 closed it):

- [ ] Send "hi" — bot reply addresses VISITOR (not "Hey Jack"; should be "Hi" or "Hey there" or similar second-person greeting)
- [ ] Send "who am i" — bot reply does NOT say "You're Jack Cutrara"; should clarify it doesn't know who the visitor is OR ask their name (UAT Gap #1 closure)

## Operator Confirmation

All six checks PASSED:

- Local build clean: ✓
- `pnpm dev` panel-open: ✓
- `pnpm preview` panel-open (DOM-only): ✓
- COPY button feedback: ✓
- AbortError-free nav: ✓
- Voice-split: ✓

Operator signature: Jack Cutrara
Date: 2026-05-11

Operator action recorded as the chat-reply "approved — deploy gate cleared"
in the gsd-execute-phase 17 --gaps-only session on 2026-05-11. Chat history
is the durable audit trail; this file is the rendered artifact.

`gate: CONFIRMED`

## Post-Confirmation: Deploy Procedure

Only after `gate: CONFIRMED` above:

```bash
git status                          # verify clean working tree
git log --oneline origin/main..HEAD # verify the commit set being pushed (~38 commits)
git push origin main                # the gated deploy
```

Cloudflare Workers Builds will rebuild + deploy automatically per Plan 17-02 D-03.

## Post-Deploy Verification (against https://jackcutrara.com)

Repeat checks 4 + 5 + 6 against the production URL after the Workers Builds
deploy completes. Any post-deploy failure = `git revert` immediately and
re-open Phase 17 with a new debug session.

- [ ] Homepage loads; chat bubble visible bottom-right
- [ ] Click bubble — panel OPENS (UAT Gap #2 closure on production)
- [ ] Send "hi" — bot replies as visitor-addressed second person (UAT Gap #1)
- [ ] Hover bot message → click COPY — COPIED label persists ~1.5s (UAT Gap #3)
- [ ] Rapid page navigation — no AbortError in console (UAT Gap #4)
- [ ] No console errors of any other kind

## Why This Gate Exists

Plan 17-08 calls itself a release blocker but has no mechanism preventing
pre-fix `git push origin main`. This file is the tangible artifact — it
appears in the file tree alongside the other Phase 17 planning docs, the
Plan 17-08 SUMMARY surfaces it loud during phase close, and the operator
encounters it as part of the standard pre-deploy ritual.

If this gate is bypassed (operator pushes without recording CONFIRMED), the
RELEASE BLOCKER documented in `.planning/phases/17-foundations-migration-dns-debt-sweep/17-UAT.md`
Gap #2 will materialize on production within ~5 minutes (Workers Builds
deploy time), and chat panel-open will be broken for every visitor.
