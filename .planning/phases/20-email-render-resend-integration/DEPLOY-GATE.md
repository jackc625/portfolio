---
type: deploy-gate
phase: 20-email-render-resend-integration
plan: 04
created: 2026-05-13
confirmed:
status: pending
operator:
gate: PENDING
---

# Phase 20 Deploy Gate

**RELEASE EVENT**: Local main is N commits ahead of origin/main at Phase 20
close. The next `git push origin main` is the v1.3 milestone's **live-mail
go-live event** — once Cloudflare Workers Builds picks up the push, the
deployed Worker's `wrangler.jsonc vars.DRY_RUN` flips from `"1"` (Phase 19
close) to `"0"` (Plan 20-03 atomic-deploy commit `8bba4ef`), the
`src/lib/chat-delivery.ts` `sendOne` substitution starts calling the live
Resend wrapper, and the hourly cron sweep's first qualifying inactive session
emails Jack's Gmail Inbox.

After this gate is CONFIRMED, the next `git push origin main` will deploy:

- Plan 20-01 (`56ba76d`) — pure renderer `src/lib/email/render.ts` (376 LOC) + 36 unit tests (MAIL-02..05)
- Plan 20-02 (`06df4ce`) — pure REST wrapper `src/lib/email/resend.ts` (279 LOC) + 13 unit tests (MAIL-01)
- Plan 20-03 (`8bba4ef`) — `sendOne` substitution + `wrangler.jsonc` DRY_RUN `"1"` → `"0"` + `src/worker.ts` Env literal carry-forward + DeliveredMarker `resend_message_id` additive extension + 2 NEW build tests + GROUP I 6-test wiring extension (MAIL-01..05)
- Plan 20-04 (this commit + per-task commits) — `20-UAT.md` + `DEPLOY-GATE.md` (operational documentation only; zero source changes)

## Pre-Deploy Checklist

Run all checks below from local main with all Phase 20 commits present,
BEFORE `git push origin main`. Each MUST pass; the executor MUST NOT push
the deploy commit on the operator's behalf — operator-controlled push per
Plan 17-08 precedent + D-04 deploy-gate posture.

### 1. Local build is clean

- [ ] `pnpm exec vitest run` exits 0 with **PASS count ≥ 560** / FAIL count == 0 / SKIP count == 2 (Phase 20 close floor at Wave 2 was 560 PASS / 0 FAIL / 2 SKIP per Plan 20-03 SUMMARY; Plan 20-04 adds zero tests so the floor stays 560).
- [ ] `pnpm exec astro check` exits **0/0/0** (Plan 17-08 / Phase 19 baseline preserved; the `tests/client/listener-dedup.test.ts` typecheck debt absorbed at Plan 17-08 stays clean).
- [ ] `pnpm build` exits 0 cleanly (wrangler types regen + `astro check` + `astro build` all OK; matches Plan 20-03 verification gate per the worker.ts literal carry-forward lock).

### 2. Phase 20 forward-defense gates GREEN

- [ ] `pnpm exec vitest run tests/build/wrangler-dry-run-shape.test.ts` exits 0 — Invariant 1 confirms `vars.DRY_RUN === "0"` AT PHASE CLOSE; Invariant 2 confirms `triggers.crons === ["0 * * * *"]` (UAT Step 4 cron revert must have been verified pre-push per Pitfall 6 forward-defense).
- [ ] `pnpm exec vitest run tests/build/wrangler-cron-shape.test.ts` exits 0 — both the Plan 20-03 updated `DRY_RUN === "0"` assertion AND the cron-expression assertion GREEN.
- [ ] `pnpm exec vitest run tests/build/chat-delivery-send-site.test.ts` exits 0 — all 5 invariants GREEN: (A) sendEmail imported from `./email/resend`, (B) renderEmail imported from `./email/render`, (C) Phase 19 `send_not_implemented_in_phase_19` throw stub GONE, (D) D-03 rollback runway `if (env.DRY_RUN === "1")` branch STILL PRESENT, (E) D-03 rollback runway `chat.delivery.dry_run` envelope log STILL PRESENT.
- [ ] `pnpm exec vitest run tests/api/email-render.test.ts tests/api/email-render.adversarial.test.ts tests/api/email-resend.test.ts tests/api/chat-delivery.test.ts` exits 0 — all Phase 20 unit batteries GREEN (Plan 20-01 + Plan 20-02 + Plan 20-03 GROUP I wiring).

### 3. Cross-phase forward-defense gates GREEN (Phase 20 touches ZERO chat-surface)

- [ ] **D-26 chat-surface regression battery** byte-identical or grown — full suite PASS count ≥ 498 baseline (Phase 19 close); Phase 20 added ~62 net new tests (36 renderer + 13 wrapper + 13 substitution/build) bringing the suite to ≥ 560. The chat surface itself (`src/scripts/chat.ts`, `src/pages/api/chat.ts`, `src/lib/validation.ts`, `src/components/chat/ChatWidget.astro`, `src/styles/global.css`) is byte-identical from Phase 19 close — Phase 20 did NOT modify any of these files.
- [ ] **D-15 SSE byte-identical anchor**: `pnpm exec vitest run tests/api/sse-snapshot.test.ts` exits 0 with 3/3 GREEN. The `/api/chat` SSE frame stream is byte-identical from Phase 17 Plan 17-05 close — Phase 20 did NOT modify `src/pages/api/chat.ts`.
- [ ] **TEST-03 Anthropic prompt-cache integrity**: `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` exits 0. The `system` block + `messages[0]` payload contain NO sessionId literal AND are byte-identical across calls. Phase 20 did NOT modify the Anthropic surface (`src/prompts/chat-request-shape.ts`).
- [ ] **DEBT-02 cache-hit-logs**: `pnpm exec vitest run tests/api/cache-hit-logs.test.ts` exits 0. Server-side `chat.cache_metrics` log emission preserved from Plan 17-05 close.

### 4. MAIL-01 zero-new-runtime-dep lock

- [ ] `git diff origin/main..HEAD package.json | grep -E '^\+.*":' | grep -v 'scripts'` returns **empty** — NO new lines under the `dependencies` block. The only acceptable changes are in `scripts` block; for Phase 20, even the `scripts` block should be byte-identical (Plan 20-04 touches no package.json content).
- [ ] `git diff --stat package.json` shows `package.json` **unchanged** OR only whitespace-level changes. Defensive — Phase 20 should not touch `package.json` at all; Plans 20-01 / 20-02 / 20-03 / 20-04 all summary-asserted `package.json dependencies` byte-identical.
- [ ] Manual eyeball of `git diff origin/main..HEAD -- package.json pnpm-lock.yaml` confirms no new entries in either file. Resend is reached via global `fetch` per CONTEXT.md D-01 + RESEARCH § SUMMARY zero-runtime-dep mandate; NO `@resend/node` or similar SDK installed.

### 5. Operational state confirmed

- [ ] `wrangler.jsonc` line 24 contains exactly `"DRY_RUN": "0"` — Plan 20-03 atomic-deploy commit `8bba4ef` locked this. Reverting to `"1"` here would un-do the entire Phase 20 deploy intent.
- [ ] `wrangler.jsonc` line 28 contains exactly `"crons": ["0 * * * *"]` — NO leftover `"* * * * *"` from UAT Step 2 (Step 4 revert MUST have been verified pre-push per Pitfall 6 — `tests/build/wrangler-dry-run-shape.test.ts` Invariant 2 + `tests/build/wrangler-cron-shape.test.ts` will fail CI if forgotten, but pre-push manual confirmation is the canonical operator gate).
- [ ] Wrangler secret `RESEND_API_KEY` present in production: `wrangler secret list` includes `RESEND_API_KEY` (set in Plan 17-06; phase-end inventory confirmed `ANTHROPIC_API_KEY` + `RESEND_API_KEY` + `CHAT_RECIPIENT_EMAIL` + `CHAT_SENDER_EMAIL` — all four Phase 20 prereqs in place).
- [ ] Wrangler secrets `CHAT_RECIPIENT_EMAIL` + `CHAT_SENDER_EMAIL` present in production (set in Plan 17-02 / 17-06; envelope `to:` and `from:` literals).
- [ ] `wrangler.jsonc` `vars.CHAT_REPLY_TO_EMAIL === "jackcutrara@gmail.com"` — Phase 19 default preserved (the envelope `reply_to:` field per Plan 19-02 + Plan 20-03 `buildEnvelope`).

## Operator Confirmation

All 5 sections PASSED:

- Local build clean (vitest ≥ 560 / astro check 0/0/0 / pnpm build clean): _____
- Phase 20 forward-defense gates GREEN: _____
- Cross-phase forward-defense gates GREEN (D-26 / D-15 / TEST-03 / DEBT-02): _____
- MAIL-01 zero-new-runtime-dep lock (package.json byte-identical): _____
- Operational state confirmed (wrangler.jsonc DRY_RUN=="0" + crons==["0 * * * *"] + 4 secrets present): _____

Operator signature: _____
Date: _____

Operator action recorded as the chat-reply `approved — deploy gate cleared`
in the gsd-execute-phase 20 session. Chat history is the durable audit
trail per Plan 17-08 precedent; this file is the rendered artifact for the
file tree.

`gate: PENDING`

(Operator updates the frontmatter to `status: confirmed`, `gate: CONFIRMED`,
`confirmed: <ISO date>`, `operator: Jack Cutrara` AFTER all 5 sections
PASSED and BEFORE running `git push origin main`. The orchestrator MAY
prefill these slots on the operator's behalf per Plan 17-08 option 2 once
the chat-reply `approved — deploy gate cleared` is received in chat.)

## Post-Confirmation: Deploy Procedure

Only after `gate: CONFIRMED` above:

```bash
git status                            # verify clean working tree
git log --oneline origin/main..HEAD   # verify the commit set being pushed
git push origin main                  # the gated deploy — operator-controlled
```

Cloudflare Workers Builds will rebuild + deploy automatically per
Plan 17-02 D-03. Build duration is typically ~90s; first cron tick
under live mail is the next top-of-hour boundary after the deploy
goes Active.

## Post-Deploy Verification (against https://jackcutrara.com)

Defer to **`20-UAT.md`** for the full 6-step runbook. The deploy gate
clears operationally once Steps 1-5 of 20-UAT.md complete GREEN; Step 6
(organic real-traffic OR 7-day soft cap) closes asynchronously within
the 7-day window post-deploy.

Quick post-deploy smoke before running the full UAT:

- [ ] `wrangler tail --format pretty --search "chat.delivery"` shows the hourly cron tick emitting `chat.delivery.tick` log lines (`sessions_seen: 0` is fine if no real visitors have flowed through yet — proves the scheduled() handler is wired live).
- [ ] No `worker.scheduled.failed` log lines (scheduled() handler does NOT throw at the `ctx.waitUntil(deliverDue(...).catch(...))` site).
- [ ] No `chat.delivery.failed` log lines (no live sessions are failing to send — should be quiet until a real visitor's session ages past the 2hr inactivity threshold).

## EXECUTOR-MUST-NOT-PUSH PROHIBITION

> **CRITICAL — D-04 / Plan 17-08 deploy-gate posture:** The executor
> (Claude Code) MUST NOT run `git push origin main` for this phase.
> After committing Plans 20-01..20-04 locally, the executor STOPS at this
> gate. The operator (Jack Cutrara) runs the 6-step UAT in `20-UAT.md`
> against the post-push production deployment, confirms via chat-reply
> `approved — deploy gate cleared` (durable audit trail per Plan 17-08
> precedent), updates this file's frontmatter to `status: confirmed`,
> `gate: CONFIRMED`, `confirmed: <date>`, `operator: Jack Cutrara`, then
> runs `git push origin main` themselves.
>
> The executor MUST NOT run `wrangler deploy` for UAT Step 2 (`* * * * *`
> cron flip) or UAT Step 4 (revert to `["0 * * * *"]`) either — both are
> operator-controlled per the same posture.

## ROLLBACK PROCEDURE (per D-03)

> **Rollback mechanism:** A single-line revert of `wrangler.jsonc` line 24
> (`"DRY_RUN": "0"` → `"DRY_RUN": "1"`) + `wrangler deploy` (or
> commit + `git push origin main` for the Workers Builds path) reverts
> ALL Phase 20 live-mail behavior in ~60 seconds. The Plan 20-01 renderer +
> Plan 20-02 wrapper + Plan 20-03 substitution all stay in source — they
> are unreachable behind the DRY_RUN gate. The `DRY_RUN === "1"` branch in
> `src/lib/chat-delivery.ts` `sendOne` (Plan 20-03 preserved byte-identical
> from Phase 19 except the sentinel return) IS the rollback runway (D-03
> lock; `tests/build/chat-delivery-send-site.test.ts` Invariants D + E
> source-text-lock its presence so a future cleanup PR cannot remove it
> as "dead code").
>
> **CRITICAL paired update for rollback:** Plan 20-03 narrowed the
> `src/worker.ts` local `Env` interface literal `DRY_RUN: "0"` to mirror
> the wrangler-regenerated `Cloudflare.Env` literal after the flip. A
> rollback that flips `wrangler.jsonc` `vars.DRY_RUN` back to `"1"` MUST
> ALSO update `src/worker.ts` `Env.DRY_RUN: "0"` back to `Env.DRY_RUN: "1"`
> at the same commit, OR `pnpm build` will fail ts(2345) at the
> `handle(request, env, ctx)` call site (the inline comment block in
> `src/worker.ts` documents this bidirectional lock per Plan 20-03 SUMMARY
> "Issues Encountered").
>
> **DO NOT** `git revert` the Phase 20 commits as a rollback — that has a
> heavier blast radius (renderer + wrapper + substitution disappear from
> main; harder to re-ship cleanly) AND it doesn't gain anything over the
> single-line wrangler.jsonc revert. The DRY_RUN gate is the
> first-class rollback mechanism by design per D-03.

## Why This Gate Exists

Plan 20-04 calls itself the final Phase 20 metadata commit but has no
mechanism preventing pre-deploy `git push origin main`. This file is the
tangible artifact — it appears in the file tree alongside the other Phase
20 planning docs, the Plan 20-04 SUMMARY surfaces it loud during phase
close, and the operator encounters it as part of the standard pre-deploy
ritual that Plan 17-08 established for v1.3.

If this gate is bypassed (operator pushes without recording CONFIRMED),
the worst-case is a misconfigured production state surfacing as
`chat.delivery.failed` log spikes within ~1hr post-push (next hourly
cron tick after the first qualifying inactive session). Rollback per the
procedure above is ~60s; impact is bounded by the cron tick cadence
(at most ~24 failed-send attempts per day under the locked
`MAX_SEND_ATTEMPTS = 3` retry budget) and by Resend's default 2 req/sec
rate limit which throttles further damage. But the Inbox-of-Gmail signal
loss is real: Jack would NOT see real visitor transcripts arrive while
the misconfiguration persists. The pre-deploy gate is cheap; the cost of
a botched first-impression deploy is high.
