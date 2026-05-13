---
status: pending
phase: 20-email-render-resend-integration
source: [20-01-SUMMARY.md, 20-02-SUMMARY.md, 20-03-SUMMARY.md]
started: 2026-05-13T03:55:00Z
updated:
deviation: |
  ALL `wrangler kv key` commands in Steps 1, 3, 5 MUST pass `--remote`. The
  wrangler CLI defaults to `--local` and burns hours of debug time — Phase 18
  UAT learning carried forward verbatim through Phase 19 (19-UAT.md
  deviation block). PROD KV namespace ID is `eaa30fef259e4a6b9505b41bbf3f8f01`
  (verbatim from wrangler.jsonc:11-17); Preview is
  `115f3c1b0f8a4a1da9fee78c48dcb749` (NOT used here — UAT runs against PROD).

  Step 2 cron flip and Step 4 cron revert are OPERATOR-CONTROLLED per D-04 +
  DEPLOY-GATE.md (Plan 17-08 precedent). Executor MUST NOT run `wrangler
  deploy`. Per the Phase 19 UAT TEXT CORRECTION (19-UAT.md:155-163), the
  actual deploy mechanism on this project is `git push origin main` →
  Cloudflare Workers Builds auto-deploys per Plan 17-02 D-03 / DEPLOY-GATE.md.
  Step 2 / Step 4 below say "operator runs `wrangler deploy`" in places — the
  operator MAY choose either path (direct `wrangler deploy` from local for
  speed, OR commit-and-push for the Builds path) so long as the executor
  itself does not run the deploy command. The CRON-01 + MAIL-01..05
  invariants still hold either way; only the deploy command name changes.

  KV read eventual-consistency: `wrangler kv key get` can lag ~5-10s after a
  write (Phase 19 UAT learning, 19-UAT.md:524-530). If a Step 3 verification
  read returns null/stale, wait 10s and re-read before declaring failure.

  Step 6 is the only step gated on REAL VISITOR TRAFFIC. Per CONTEXT.md
  Discretion + 20-CONTEXT.md D-02, a 7-day soft cap applies: if no organic
  visitor session arrives within 7 days post-deploy, Step 6 may close on a
  manual `node scripts/resend-warmup.mjs` re-execution as proxy (proves the
  wire still works post-deploy independent of cron sweep timing). Steps 1-5
  alone close ROADMAP success criteria 1-3 + SC5; Step 6 closes SC4
  (idempotency in the wild).
---

# Phase 20 UAT — Email Render + Resend Integration (live-mail toggle)

**Step 2 cron flip + redeploy and Step 4 cron revert + redeploy are the OPERATOR-CONTROLLED gates per D-04.**
Executor MUST NOT run `wrangler deploy` (or push to `origin/main` to trigger Workers Builds) — operator owns the deploy cycle per DEPLOY-GATE.md posture (Plan 17-08 precedent verbatim).

This UAT closes ROADMAP Phase 20 success criteria 1-5. The 6-step sequence maps:

- Step 1 (seed) + Step 2 (cron flip + redeploy) + Step 3 (verify Gmail Inbox + delivered marker + Workers Logs + Resend Dashboard) → **SC1** (one email lands in Inbox within 3hr of last activity)
- Step 3 → **SC2** (text-only body + html absent + every dynamic field HTML-escaped) + **SC3** (adversarial-payload renderer hardening — unit-tested in Plan 20-01; UAT verifies live email matches the adversarial-safe contract)
- Step 4 (cron revert + redeploy) + Step 5 (backlog cleanup) → operational hygiene (no `* * * * *` left burning Free-tier budget; no `test-uat-*` audit-debt in PROD KV)
- Step 6 organic real-traffic OR 7-day soft cap → **SC4** (idempotency in the wild — `delivered:{sid}` cursor + Resend Idempotency-Key layered defense holds against real cron re-tick)
- Pre-deploy gate checklist in DEPLOY-GATE.md (sections 1-5) → **SC5** (zero new runtime deps phase-wide; `package.json dependencies` byte-identical to Phase 19 close; REST via global fetch)

**KV namespace IDs** (verbatim from `wrangler.jsonc:11-17`):

- Production: `eaa30fef259e4a6b9505b41bbf3f8f01`
- Preview:    `115f3c1b0f8a4a1da9fee78c48dcb749` (NOT used in this UAT)

**Cron expression** (verbatim from `wrangler.jsonc:27-29`, locked by `tests/build/wrangler-dry-run-shape.test.ts` Invariant 2 + `tests/build/wrangler-cron-shape.test.ts`):

- Production at Phase 20 close: `["0 * * * *"]` (hourly, top of hour)
- Step 2 UAT temporary: `["* * * * *"]` (every minute — REVERT in Step 4)

**DRY_RUN gate** (verbatim from `wrangler.jsonc:23-26`, locked by `tests/build/wrangler-dry-run-shape.test.ts` Invariant 1):

- `vars.DRY_RUN === "0"` — Plan 20-03 live-mail toggle. The Resend POST is reachable in production. Rollback to `"1"` per D-03 is a single-line wrangler.jsonc revert + redeploy (~60s recovery).

**Production URL:** `https://jackcutrara.com/`

**Workers Logs query convention:** `wrangler tail --format pretty --search "chat.delivery.sent"` (per CONTEXT.md `specifics` — the distinct-event-name family from D-16 + D-17 means each grep targets exactly one operational question).

---

## Current Test

[testing not yet started — operator runs Steps 1-5 post-deploy per DEPLOY-GATE.md; Step 6 closes asynchronously within the 7-day soft cap]

---

## Tests

### 1. MAIL-01..05 PRE-CONDITION — Seed `live:test-uat-<sid>` with stale `last_activity_at` (closes pre-condition for SC1)

expected: |
  OPERATOR-ONLY (executor MUST NOT execute this step against PROD KV — same
  posture as Phase 19 UAT Step 2/3 KV seeds; PROD KV writes are operator
  territory per D-04).

  Operator command sequence (ALL --remote — see deviation block):

    # 1. Mint a test sid and a 3-hour-stale timestamp (well past the
    #    2-hour INACTIVITY_THRESHOLD_MS locked in src/lib/chat-delivery.ts).
    SID="test-uat-$(uuidgen)"
    STALE_TS=$(date -u -d '3 hours ago' +"%Y-%m-%dT%H:%M:%S.%3NZ")
    # PowerShell variant:
    # $SID = "test-uat-$([guid]::NewGuid())"
    # $STALE_TS = (Get-Date).ToUniversalTime().AddHours(-3).ToString("o")

    # 2. Compose stale ChatTranscript value with v: 1 schema (Phase 18
    #    KV-02..05 contract). msg_count: 2 keeps the subject short
    #    ("[Portfolio chat] 2 turns from US via example.com"). The
    #    assistant turn carries cache_read_input_tokens > 0 to exercise
    #    D-09/D-10 cache aggregate one-liner under live render.

    # 3. PUT live:${SID} (value + inline metadata block per Phase 18
    #    META-01 contract — the metadata block is what `deliverDue` reads
    #    via kv.list() WITHOUT a per-key fetch).
    wrangler kv key put "live:${SID}" \
      '{"v":1,"sid":"'"${SID}"'","started_at":"'"${STALE_TS}"'","last_activity_at":"'"${STALE_TS}"'","msg_count":2,"truncated":false,"meta":{"referrer":"https://example.com/","user_agent":"UAT/1.0","country":"US","region":"TX","colo":"DFW"},"messages":[{"role":"user","content":"Does Jack have multi-DEX trading experience?"},{"role":"assistant","content":"Yes — see the multi-dex-crypto-trader project for the full architecture write-up.","cache_read_input_tokens":1234,"cache_creation_input_tokens":0}]}' \
      --namespace-id eaa30fef259e4a6b9505b41bbf3f8f01 \
      --metadata '{"last_activity_at":"'"${STALE_TS}"'","msg_count":2,"window_started_at":"'"${STALE_TS}"'","window_count":2}' \
      --remote

    # 4. Confirm the seed landed:
    wrangler kv key get "live:${SID}" \
      --namespace-id eaa30fef259e4a6b9505b41bbf3f8f01 \
      --remote
    # Expected: returns the JSON value verbatim (5-10s settle per Phase 19
    # UAT learning if eventual-consistency lag fires).

  PASS criteria:
    - `wrangler kv key get "live:${SID}" --remote` against the PROD KV namespace
      `eaa30fef259e4a6b9505b41bbf3f8f01` returns the seeded JSON value with
      `last_activity_at` matching the 3hr-stale timestamp.
    - The seeded value contains exactly 2 messages (1 visitor + 1 assistant)
      with the assistant turn carrying `cache_read_input_tokens: 1234`.
    - `--remote` flag confirmed on the put command (NOT --local).
    - The chosen ${SID} starts with literal `test-uat-` (the prefix discipline
      from Phase 19 UAT — makes Step 5 bulk cleanup safe).

result: |
  [populated post-UAT by operator with the actual <sid> + 3hr-stale
  timestamp + raw `wrangler kv key get` output]

---

### 2. CRON-01 — Operator flips `triggers.crons` to `["* * * * *"]` + redeploys (closes Past-Events trigger for SC1)

expected: |
  OPERATOR-ONLY (executor MUST NOT run `wrangler deploy` OR push to
  `origin/main` for this step).

  Operator command sequence:

    # 1. Confirm baseline:
    git diff wrangler.jsonc
    # Expected: empty (zero diff against committed state — `triggers.crons`
    # is `["0 * * * *"]` at Phase 20 close per Plan 19-04 + Plan 20-03).

    # 2. Operator EDITS wrangler.jsonc line 28: change
    #      "crons": ["0 * * * *"]
    #    to
    #      "crons": ["* * * * *"]
    #    (every minute — the temporary UAT flip to drive Past Events
    #    within 90s instead of waiting up to 1hr for top-of-hour).
    #
    #    NOTE: Step 4 reverts this BACK to ["0 * * * *"]. Per Pitfall 6
    #    (forward-defense via tests/build/wrangler-dry-run-shape.test.ts
    #    Invariant 2 + tests/build/wrangler-cron-shape.test.ts), leaving
    #    the `* * * * *` value in main would fail the next CI run and burn
    #    1,440 cron invocations/day from the Free-tier 5,000/day budget.

    # 3. Operator runs the deploy. Two paths (operator chooses):
    #
    #    Path A — direct (faster, no commit on main):
    #      wrangler deploy
    #
    #    Path B — Workers Builds (matches the deploy mechanism on this
    #    project; requires a commit + push):
    #      git add wrangler.jsonc
    #      git commit -m "test(20-UAT): flip cron to ['* * * * *']"
    #      git push origin main
    #
    #    Capture the Worker version ID from the deploy output (Path A) or
    #    the Cloudflare Dashboard → Workers & Pages →
    #    jack-cutrara-portfolio → Deployments tab (Path B) once Active.

    # 4. Wait 90 seconds for the next minute boundary.

    # 5. Open Cloudflare Dashboard → Workers & Pages →
    #    jack-cutrara-portfolio → Cron Triggers → Past Events tab.
    #    Capture screenshot showing ≥1 successful scheduled() invocation
    #    within the 90s window since the deploy.

    # 6. In a separate terminal, start a tail filtered on the chat.delivery
    #    log namespace so Step 3 can capture the live `chat.delivery.sent`
    #    event when the cron fires:
    wrangler tail --format pretty --search chat.delivery

  PASS criteria:
    - `git diff wrangler.jsonc` before flipping returned empty (clean
      baseline; no prior unreverted state).
    - Cloudflare Dashboard Past Events tab shows ≥1 invocation within
      90s of the `* * * * *` deploy going Active.
    - Workers Logs (`wrangler tail`) emits at least one
      `chat.delivery.tick` JSON log line within 90s (sessions_seen ≥ 1
      because Step 1's seed is present).
    - No `worker.scheduled.failed` log line — scheduled() handler does
      NOT throw at the ctx.waitUntil(deliverDue(...).catch(...)) site.

result: |
  [populated post-UAT — Cloudflare Past Events screenshot + first
  chat.delivery.tick JSON log line + Worker version ID + timestamp at
  which `* * * * *` went Active]

---

### 3. MAIL-01..05 + CRON-02 — Verify Gmail Inbox + `delivered:test-uat-<sid>` value + Workers Logs `chat.delivery.sent` + Resend Dashboard (closes SC1 + SC2 + SC3)

expected: |
  Within 5 minutes of Step 2's cron going Active (typically within 90-120s
  of the first `chat.delivery.tick` log line that observed the seeded
  session as due):

    # 1. Gmail Inbox check.
    #    Open Gmail (jackcutrara@gmail.com). Expect ONE new email:
    #      From:    "Portfolio Chat" <transcripts@mail.jackcutrara.com>
    #      Reply-To: jackcutrara@gmail.com
    #      Subject:  [Portfolio chat] 2 turns from US via example.com
    #      (NO " (truncated)" suffix since truncated: false in the seed.)
    #
    #    Per Plan 17-06's 5/5 Inbox first-try DNS warmup, the email
    #    SHOULD land in Inbox (NOT Spam) — if it lands in Spam, mark
    #    "Not Spam" and continue, but log as a Step 3 deviation for
    #    operator triage (Postmaster Tools enrolled Plan 17-06 covers
    #    this case operationally).

    # 2. Gmail body inspection (verify D-11 + D-12 + MAIL-02 + MAIL-03):
    #    Body opens with the 8-line metadata header block per D-11 +
    #    D-09 cache-aggregate hoist (LABEL_WIDTH=12 padded labels):
    #
    #      Session:    test-uat-<uuid>
    #      Started:    <3hr-ago-ISO>
    #      Last turn:  <3hr-ago-ISO> (0s)
    #      From:       US
    #      Referrer:   https://example.com/
    #      User-agent: UAT/1.0
    #      Messages:   2 turns
    #      Cache:      1/1 turns hit, 1,234 read / 0 created
    #
    #    Then ONE blank line, then the provenance line per D-12 anti-
    #    impersonation defense (byte-identical regardless of visitor
    #    content):
    #
    #      From: chat widget on jackcutrara.com — visitor message follows below this line.
    #
    #    Then ONE blank line, then turn markers per D-12:
    #
    #      >>> visitor:
    #      Does Jack have multi-DEX trading experience?
    #
    #      <<< bot:
    #      Yes — see the multi-dex-crypto-trader project for the full architecture write-up.
    #
    #    The "0s" duration in "Last turn" reflects identical started_at +
    #    last_activity_at in the seed (single-turn-pair seed; not a
    #    multi-turn flow).

    # 3. Gmail "Show original" (Three-dot menu → Show original):
    #    - Content-Type: text/plain; charset=utf-8
    #    - NO `multipart/alternative` boundary
    #    - NO `text/html` part anywhere
    #    Per MAIL-02 plaintext-only lock (the Resend `html` field is
    #    ABSENT in the wrapper's body per Plan 20-02 GROUP D test).

    # 4. KV verification — delivered: marker:
    wrangler kv key get "delivered:${SID}" \
      --namespace-id eaa30fef259e4a6b9505b41bbf3f8f01 \
      --remote
    # Expected: returns the D-09/Plan 20-03 envelope shape:
    #   {
    #     "v": 1,
    #     "sid": "test-uat-<uuid>",
    #     "delivered_at": "<ISO 8601>",
    #     "dry_run": false,                   ← Plan 20-03 substitution fired (NOT a dry-run envelope log)
    #     "msg_count": 2,
    #     "truncated": false,
    #     "resend_message_id": "<resend-uuid>" ← populated by Plan 20-03 step-4 PUT site
    #   }
    # Note: dry_run is `false` because env.DRY_RUN === "0" at this point.

    # 5. KV verification — live: key deleted:
    wrangler kv key get "live:${SID}" \
      --namespace-id eaa30fef259e4a6b9505b41bbf3f8f01 \
      --remote
    # Expected: returns null/empty. The Plan 19 D-09 5-step promoteOne
    # ordering DELETES live:${SID} AFTER PUT delivered:${SID} — both writes
    # land before sendOne returns (the two-keyspace partition crash-safe
    # sequencing Phase 20 inherits verbatim from Phase 19 CRON-02).

    # 6. Workers Logs `chat.delivery.sent` query:
    wrangler tail --format pretty --search "chat.delivery.sent"
    # Expected: ONE structured JSON line of shape:
    #   chat.delivery.sent {
    #     sid: "test-uat-<uuid>",
    #     resend_message_id: "<same-uuid-as-step-4>",
    #     attempt: 1
    #   }
    # The resend_message_id MUST match the value written in the
    # delivered:${SID} envelope (step 4) — proves the cross-system
    # correlation chain (KV value ↔ Workers Logs).

    # 7. Resend Dashboard correlation:
    #    Open https://resend.com/emails → Sent tab.
    #    Locate the send by To = jackcutrara@gmail.com + arrival
    #    timestamp within the 5-min window.
    #    Click the row → expand → verify `id` matches the
    #    resend_message_id from steps 4 + 6.

    # 8. No-retry confirmation (Plan 20-02 D-13 success-on-first-attempt):
    #    `wrangler tail --format pretty --search "chat.delivery.retry"` should
    #    show ZERO entries for this sid (a healthy seeded send should
    #    succeed on attempt 1; no transient 5xx/429 expected).
    #    `wrangler tail --format pretty --search "chat.delivery.failed"` should
    #    show ZERO entries for this sid.

  PASS criteria (all eight must hold):
    - ONE email in Gmail Inbox from `"Portfolio Chat"
      <transcripts@mail.jackcutrara.com>` with subject `[Portfolio chat]
      2 turns from US via example.com` (no truncated suffix).
    - Body opens with the 8-line metadata header (padded label column)
      then blank line, then the literal provenance line, then blank line,
      then `>>> visitor:` / `<<< bot:` turn markers per D-12.
    - Gmail "Show original" confirms Content-Type: text/plain only
      (NO text/html part; NO multipart/alternative) per MAIL-02.
    - `delivered:test-uat-<sid>` value returned by wrangler kv key get
      has `dry_run: false` AND a populated 36-char UUIDv4-shape
      `resend_message_id` field (D-09 + Plan 20-03 additive lock).
    - `live:test-uat-<sid>` returned by wrangler kv key get is null
      (deleted by promoteOne step 5 AFTER successful send + delivered:
      PUT — Phase 19 CRON-02 crash-safe ordering preserved).
    - `chat.delivery.sent` Workers Logs entry carries the EXACT same
      resend_message_id as the KV envelope (cross-system correlation).
    - Resend Dashboard "Sent" tab shows a row whose `id` matches the
      resend_message_id from steps 4 + 6.
    - ZERO `chat.delivery.retry` AND ZERO `chat.delivery.failed` log
      lines for this sid (success on first attempt).

  SC1 closure: ONE email landed in Inbox within 5 min of the cron tick
  that observed the seeded session as due.
  SC2 closure: body is plaintext-only (no html field); D-11 + D-12 shape
  preserved live.
  SC3 closure: the seeded session is benign (no adversarial payload), so
  Step 3 only verifies that the WIRE delivers what the unit suite
  (tests/api/email-render.adversarial.test.ts — 6-row it.each over locked
  MAIL-05 classes) already proved is adversarial-safe. The structural
  anti-impersonation defense (D-12) is observable here: the AUTHENTIC
  provenance line precedes the first `>>> visitor:` marker.

result: |
  [populated post-UAT — Gmail screenshot + KV value blocks (delivered: +
  live: confirmation) + Workers Logs JSON line screenshot + Resend
  Dashboard screenshot + resend_message_id cross-correlation note]

---

### 4. CRON-01 (revert) — Operator reverts `triggers.crons` to `["0 * * * *"]` + redeploys (operational hygiene; closes Pitfall 6 forward-defense)

expected: |
  OPERATOR-ONLY (executor MUST NOT run `wrangler deploy` OR push to
  `origin/main` for this step either).

  Operator command sequence:

    # 1. Operator EDITS wrangler.jsonc line 28: change
    #      "crons": ["* * * * *"]
    #    back to
    #      "crons": ["0 * * * *"]
    #
    #    This is the mirror of Step 2's edit. The Phase 20 close state
    #    locked by tests/build/wrangler-dry-run-shape.test.ts Invariant 2
    #    + tests/build/wrangler-cron-shape.test.ts is `["0 * * * *"]` —
    #    any commit on main with `["* * * * *"]` would fail the next CI
    #    run (Pitfall 6 forward-defense).

    # 2. Operator runs the deploy. Same two paths as Step 2:
    #
    #    Path A — direct:
    #      wrangler deploy
    #
    #    Path B — Workers Builds (commit + push):
    #      git add wrangler.jsonc
    #      git commit -m "test(20-UAT): REVERT cron to ['0 * * * *']"
    #      git push origin main

    # 3. Confirm revert at source:
    git diff wrangler.jsonc
    # Expected: empty (zero diff against committed `["0 * * * *"]` state).

    # 4. Confirm revert at runtime — Cloudflare Dashboard → Workers &
    #    Pages → jack-cutrara-portfolio → Cron Triggers tab shows
    #    schedule `0 * * * *` Active.

    # 5. Wait 5 minutes. Workers Logs (`wrangler tail`) should show NO
    #    new `chat.delivery.tick` events (cron is now hourly, not
    #    per-minute — next tick is at the next top-of-hour boundary).

    # 6. Build-time defense check:
    pnpm exec vitest run tests/build/wrangler-dry-run-shape.test.ts tests/build/wrangler-cron-shape.test.ts
    # Expected: both files exit 0 with all invariants PASS — confirms
    # the post-revert source-text state matches Phase 20 close.

  PASS criteria:
    - `git diff wrangler.jsonc` returns empty after the revert.
    - Cloudflare Dashboard Cron Triggers tab shows `0 * * * *` Active
      (NOT `* * * * *`).
    - Over the next 5 minutes, `wrangler tail` shows ZERO new
      `chat.delivery.tick` log lines (cron quiet between hourly ticks).
    - `pnpm exec vitest run tests/build/wrangler-dry-run-shape.test.ts
      tests/build/wrangler-cron-shape.test.ts` exits 0 — both build
      tests Invariant-2 GREEN against the reverted source state.

  Operational hygiene closure: no `* * * * *` left burning the Free-tier
  5,000/day cron budget; the next-CI source-text test would catch any
  forgotten revert per Pitfall 6.

result: |
  [populated post-UAT — git diff confirmation (empty) + Cloudflare
  Dashboard Cron Triggers screenshot + `pnpm exec vitest run` output for
  both build tests]

---

### 5. Backlog cleanup — Delete `test-uat-*` keys from PROD KV (operational hygiene; no UAT audit-debt)

expected: |
  OPERATOR-ONLY (same posture as Phase 19 UAT Step 5).

  Operator command sequence:

    # 1. Delete the delivered: marker for the Step 1-3 test session.
    wrangler kv key delete "delivered:${SID}" \
      --namespace-id eaa30fef259e4a6b9505b41bbf3f8f01 \
      --remote

    # 2. Confirm delivered: gone:
    wrangler kv key get "delivered:${SID}" \
      --namespace-id eaa30fef259e4a6b9505b41bbf3f8f01 \
      --remote
    # Expected: returns null/empty.

    # 3. Confirm live:${SID} is also gone (deleted by promoteOne step 5
    #    in Step 3 — this is a defensive re-check, not a new delete):
    wrangler kv key get "live:${SID}" \
      --namespace-id eaa30fef259e4a6b9505b41bbf3f8f01 \
      --remote
    # Expected: returns null/empty.

    # 4. Catch-all enumeration — make sure no test-uat-* artifacts remain
    #    under any prefix combination (defends against future UATs that
    #    might leave orphans under non-`live:` / non-`delivered:`
    #    namespaces).
    wrangler kv key list \
      --namespace-id eaa30fef259e4a6b9505b41bbf3f8f01 \
      --remote \
      --prefix "live:test-uat-"
    # Expected: empty array (no live: test artifacts remain).

    wrangler kv key list \
      --namespace-id eaa30fef259e4a6b9505b41bbf3f8f01 \
      --remote \
      --prefix "delivered:test-uat-"
    # Expected: empty array.

  PASS criteria:
    - `wrangler kv key get "delivered:${SID}" --remote` returns null after delete.
    - `wrangler kv key get "live:${SID}" --remote` returns null (was already
      deleted by Step 3's successful promote — confirmatory).
    - `wrangler kv key list --prefix "live:test-uat-" --remote` returns
      empty array (no orphans).
    - `wrangler kv key list --prefix "delivered:test-uat-" --remote`
      returns empty array (no orphans).
    - Real visitor session keys (`live:<UUIDv4>` without `test-uat-` prefix)
      are NOT touched — the prefix discipline from Step 1 makes cleanup safe.

  Operational hygiene closure: no UAT audit-debt left in PROD KV. The
  `test-uat-*` prefix discipline keeps every Phase 20 UAT artifact greppable
  for future debug sessions.

result: |
  [populated post-UAT — pre-delete + post-delete enumeration counts +
  confirmation that real visitor sessions were not touched]

---

### 6. CRON-03 (in the wild) — Wait for organic real-traffic conversation + record evidence (closes SC4 — idempotency in the wild) — 7-day soft cap

expected: |
  Within 7 days of Step 4's revert going Active (Phase 20 deploy + UAT
  Steps 1-5 PASS + cron back to hourly):

    # 1. A real visitor opens the chat widget on https://jackcutrara.com,
    #    has a ≥2-turn conversation with the chat, then closes the tab
    #    (or navigates away without further chat activity).

    # 2. ≥2 hours pass with NO further activity from that session
    #    (INACTIVITY_THRESHOLD_MS in src/lib/chat-delivery.ts; same gate
    #    Phase 19 UAT exercised for the seeded session).

    # 3. Next hourly cron tick processes the session under DRY_RUN === "0":
    #    - deliverDue lists live: keys, filters by metadata
    #      last_activity_at < now - 2h
    #    - promoteOne reads the transcript value
    #    - sendOne (Plan 20-03 substitution) renders the email via
    #      renderEmail (Plan 20-01) + calls sendEmail (Plan 20-02)
    #    - Resend POST returns 2xx with a real data.id
    #    - delivered: PUT with dry_run: false + resend_message_id populated
    #    - live: DELETE
    #    - chat.delivery.sent log line emitted

    # 4. Email arrives in Jack's Gmail Inbox (NOT Spam) within 3 hours
    #    of last activity (worst-case latency = 2h inactivity threshold
    #    + ≤1h until next top-of-hour cron tick).

    # 5. Operator records evidence in this `result:` block below:
    #    - Resend message ID (from email header X-Entity-Ref-ID OR
    #      from Resend Dashboard)
    #    - Gmail Inbox arrival timestamp
    #    - Gmail Inbox screenshot showing arrival in Primary tab
    #    - Workers Logs `chat.delivery.sent` JSON line screenshot
    #      (`wrangler tail --format pretty --search "chat.delivery.sent"`)
    #    - Brief note confirming the email's `>>> visitor:` content
    #      matches what the visitor actually typed (the renderer's
    #      pure-function purity per Plan 20-01 means the email body is a
    #      deterministic projection of the KV transcript)

    # 6. Idempotency-in-the-wild verification:
    #    The hourly cron will tick AGAIN ~1hr after the email lands.
    #    Operator confirms via `wrangler tail --format pretty --search
    #    "chat.delivery.skipped_already_delivered"` that the next tick
    #    emits a skipped-already-delivered log for the same sid (Layer 1
    #    `delivered:{sid}` cursor defense per D-17 + Phase 19 D-08).
    #    NO second email arrives for the same session.

  7-DAY SOFT CAP per CONTEXT.md Discretion + 20-CONTEXT.md D-02:
    If no organic visitor session arrives within 7 days, milestone may
    close on Steps 1-5 PASS + a manual `node scripts/resend-warmup.mjs`
    re-execution as proxy. The warmup script's 1-shot send proves the
    wire still works post-deploy independent of the cron sweep timing —
    same byte-compatible fetch shape (per Plan 17-06 + Plan 20-02 Wire-
    Shape Oracle reference). Record the warmup-script's Resend message
    ID + Gmail Inbox arrival in the result block.

    Use the 7-day-soft-cap fallback ONLY when no organic visitor materializes;
    the organic path is strongly preferred because it exercises the FULL chain
    (chat client mints sid → /api/chat appends turns to KV → cron sweep
    detects inactivity → render + send + delivered: cursor) — the warmup
    script bypasses the cron sweep entirely.

  PASS criteria (operator records WHICH path closed Step 6):
    Path 1 — Organic real-traffic (preferred):
      - Real visitor's conversation email lands in Gmail Inbox within
        3hr of last activity.
      - delivered:<real-sid> KV value has dry_run: false + populated
        resend_message_id.
      - chat.delivery.sent Workers Logs entry has matching resend_message_id.
      - Next hourly cron emits chat.delivery.skipped_already_delivered
        for the same sid (idempotency holds).

    Path 2 — 7-day-soft-cap fallback (scripts/resend-warmup.mjs proxy):
      - `node scripts/resend-warmup.mjs` exits 0 with `messageId` printed.
      - That messageId email lands in Gmail Inbox.
      - Operator logs the explicit deviation from Path 1 in the result
        block (no organic visitor in 7-day window post-deploy).

  SC4 closure (idempotency in the wild): either path proves the layered
  defense holds — Path 1 exercises Layer 1 (`delivered:{sid}` KV cursor)
  + Layer 2 (Resend Idempotency-Key 24h server-side window) against real
  hourly cron re-ticks; Path 2 exercises Layer 2 alone via the warmup
  script (the warmup script's `Idempotency-Key: warmup/{sessionId}` is
  byte-compatible with the wrapper's `transcript/{sessionId}` shape;
  re-running the warmup script in the same 24h window with the same
  sessionId returns the same resend_message_id).

result: |
  [populated post-UAT — either (a) organic visitor evidence within 7
  days post-deploy, or (b) 7-day-soft-cap fallback with warmup script
  proxy evidence + explicit "no organic visitor" deviation note]

---

## Phase Exit Gates

After all 6 Steps land `result: pass` (or Step 6 takes the soft-cap fallback path
with operator deviation noted), mark this checklist to close Phase 20 + close
the v1.3 milestone:

- [ ] Step 1 PASS — `live:test-uat-<sid>` seed lands in PROD KV with 3hr-stale `last_activity_at`
- [ ] Step 2 PASS — operator-controlled `* * * * *` flip + redeploy; Cloudflare Past Events ≥1 invocation within 90s
- [ ] Step 3 PASS — Gmail Inbox arrival + delivered:`<sid>` value has dry_run: false + populated resend_message_id + Workers Logs chat.delivery.sent matches + Resend Dashboard correlates + zero retry/failed log lines (closes SC1 + SC2 + SC3)
- [ ] Step 4 PASS — operator-controlled revert + redeploy; `git diff wrangler.jsonc` empty; both build tests GREEN (closes Pitfall 6 forward-defense)
- [ ] Step 5 PASS — `test-uat-*` keys deleted from PROD KV; zero orphans under either prefix
- [ ] Step 6 PASS — either organic real-traffic within 7 days (preferred) OR 7-day-soft-cap proxy via `node scripts/resend-warmup.mjs` (closes SC4 idempotency in the wild)

Forward-defense automation (verified at every commit during Phase 20):

- [ ] `tests/build/wrangler-dry-run-shape.test.ts` — 2/2 GREEN (DRY_RUN === "0" + crons === ["0 * * * *"] locked at phase close)
- [ ] `tests/build/wrangler-cron-shape.test.ts` — 2/2 GREEN (cron expression + DRY_RUN === "0" assertion updated by Plan 20-03)
- [ ] `tests/build/chat-delivery-send-site.test.ts` — 5/5 GREEN (Plan 20-03 substitution + D-03 rollback runway locked)
- [ ] `tests/api/email-render.test.ts` + `tests/api/email-render.adversarial.test.ts` — all GREEN (MAIL-02..05 unit-locked by Plan 20-01)
- [ ] `tests/api/email-resend.test.ts` — all GREEN (MAIL-01 D-13 + D-15 + D-17 unit-locked by Plan 20-02)
- [ ] `tests/api/chat-delivery.test.ts` GROUP I — all GREEN (Plan 20-03 wiring per D-17 collapsed 3-variant Result + Landmine 7 metadata guard)
- [ ] `tests/api/sse-snapshot.test.ts` — 3/3 GREEN (D-15 SSE byte-identical anchor preserved phase-wide; Phase 20 touched zero chat-surface)
- [ ] `tests/api/anthropic-payload-shape.test.ts` — all GREEN (TEST-03 Anthropic prompt-cache integrity preserved)
- [ ] `tests/api/cache-hit-logs.test.ts` — all GREEN (DEBT-02 anchor preserved)
- [ ] `pnpm exec astro check` — 0/0/0 (Plan 17-08 baseline preserved)
- [ ] `pnpm build` — clean (wrangler types regen + astro check + astro build)
- [ ] `git diff origin/main..HEAD package.json` — `dependencies` byte-identical (MAIL-01 zero-new-runtime-dep lock holds phase-wide per RESEARCH § SUMMARY)

ROADMAP Phase 20 success criteria status (filled by operator post-UAT):

- [ ] SC1 — One email lands in Gmail Inbox within 3hr of last activity; From/Reply-To/Subject match locked format (Step 3 evidence)
- [ ] SC2 — Body uses `text` field only; `html` field absent; every dynamic field HTML-escaped at render time (Step 3 "Show original" evidence + tests/api/email-render.test.ts unit coverage)
- [ ] SC3 — Adversarial-payload renderer hardening live (Step 3 evidence shows benign seed; tests/api/email-render.adversarial.test.ts 6-row it.each unit coverage closes the contract)
- [ ] SC4 — Resend idempotency holds in the wild (Step 6 evidence — either organic path or 7-day soft cap)
- [ ] SC5 — `src/lib/email/resend.ts` is thin fetch wrapper; zero new npm deps; `package.json dependencies` byte-identical (DEPLOY-GATE.md section 4 evidence + tests/build/chat-delivery-send-site.test.ts source-text guard)

After all 5 ROADMAP success criteria checked, this UAT's front-matter
`status:` flips from `pending` to `complete`, `updated:` timestamp
refreshes, DEPLOY-GATE.md `status:` flips to `confirmed` with operator
signature, and Phase 20 is COMPLETE. v1.3 milestone (Phases 17-20)
CLOSES.
