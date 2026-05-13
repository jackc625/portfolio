# Phase 20: Email Render + Resend Integration - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 20 is the v1.3 finale. It converts the Phase 19 DRY_RUN envelope-log into a real Resend POST so visitor conversations actually land in Jack's Gmail. Five coupled things ship in one atomic deploy commit:

1. **NEW module `src/lib/email/resend.ts`** — thin `fetch()` wrapper around `https://api.resend.com/emails` (NOT the npm SDK — REST is zero-dep and Workers-native per v1.3 milestone-shape lock). Owns: `Authorization: Bearer ${RESEND_API_KEY}` header injection, `Idempotency-Key: transcript/{sessionId}` header threading, 3-class HTTP status taxonomy (2xx success / 5xx+429 retry-with-same-key / 4xx-except-429 no-retry), `AbortController` with 10s timeout per attempt, and four distinct structured log events (`chat.delivery.sent`, `chat.delivery.failed`, `chat.delivery.retry`, `chat.delivery.idempotency_replay`). Pure module — NO imports from `@anthropic-ai/sdk`, `cloudflare:workers`, `src/prompts/`, `src/pages/`, `src/scripts/chat.ts`.

2. **NEW module `src/lib/email/render.ts`** (file location is planner's discretion; the renderer logic must live somewhere) — owns: subject derivation (`[Portfolio chat] N turns from <country> via <referrer-host>[ (truncated)]`), body composition (metadata header + provenance line + `>>> visitor:` / `<<< bot:` turn markers), HTML-escape applied to every dynamic field, CR/LF + Unicode bidi (`U+202A..U+202E`, `U+2066..U+2069`) + null-byte stripping, strict charset enforcement on subject interpolations. Pure module — adversarial-payload unit-testable.

3. **`src/lib/chat-delivery.ts` `sendOne` substitution** — replaces the current `throw new Error("send_not_implemented_in_phase_19")` branch at line 183 with a call to the new Resend wrapper. The DRY_RUN=`"1"` branch above stays byte-identical (Phase 19 contract preserved for instant rollback). The promotion sequence in `promoteOne` stays unchanged: retry-wrapped `sendOne` → PUT `delivered:{sid}` → DELETE `live:{sid}`. `delivered:{sid}` value gains an additive `resend_message_id: string` field (still `v: 1` schema per Phase 19 D-09/D-10 additive-extension lock); `dry_run` discriminator flips to `false` when env.DRY_RUN === `"0"`.

4. **`wrangler.jsonc` DRY_RUN flip** — single-line edit `"DRY_RUN": "1"` → `"DRY_RUN": "0"` in the same atomic commit per Phase 19 D-03. The Resend wrapper + adversarial tests are byte-stable in main after this commit; rollback is a single-line revert of that one value (no code revert needed — the DRY_RUN=`"1"` branch path is still present and tested in `chat-delivery.ts`).

5. **`20-UAT.md` 6-step operator UAT spec + DEPLOY-GATE.md** — mirrors the Plan 17-08 deploy-gate posture. Executor commits all Phase 20 code locally, STOPS at the final metadata commit, writes DEPLOY-GATE.md with `status=pending` + manual UAT checklist. Operator runs the 6-step seed-then-cron UAT against the post-push production deployment, replies "approved — deploy gate cleared" (or revert path), then `git push origin main` themselves.

**Phase exit gates (non-negotiable):**

- **MAIL-01..05 GREEN** — Resend REST wrapper with Idempotency-Key + retry-on-5xx; plaintext `text`-field-only body with provenance line + turn markers; HTML-escape + CR/LF + bidi-override strip on every dynamic field; subject server-controlled with locked format; adversarial-payload unit suite covers `<script>`, `</p><img onerror>`, `javascript:`, RTL/bidi, null bytes, social-engineering prefixes.
- **DRY_RUN flipped to `"0"`** — `wrangler.jsonc` `vars.DRY_RUN` is `"0"` at phase close; the dry-run code path is unreachable in production but stays in source for instant rollback.
- **D-26 chat regression battery GREEN at phase close** — Phase 20 touches ZERO chat-surface files (`chat.ts` / `api/chat.ts` / `validation.ts` / `ChatWidget.astro` / `global.css` are all UNTOUCHED). Run as forward-defense: battery is expected byte-identical from Phase 19 close (498 PASS / 0 FAIL / 2 SKIP per STATE.md).
- **D-15 SSE byte-identical anchor PRESERVED** — `scheduled()` runs as an independent surface from the fetch path; `api/chat.ts` is UNTOUCHED. `tests/api/sse-snapshot.test.ts` re-verified GREEN at phase close.
- **TEST-03 Anthropic prompt-cache integrity PRESERVED** — Phase 20 does not touch Anthropic-related code. `tests/api/anthropic-payload-shape.test.ts` re-verified GREEN at phase close.
- **`pnpm exec astro check` exits 0/0/0** — Plan 17-08 / Phase 19 baseline; do not regress.
- **`pnpm build` clean** — wrangler types regeneration + astro check + astro build all clean.
- **`package.json` `dependencies` byte-identical phase-wide** — zero new runtime npm dependencies (MAIL-01 lock; Resend REST avoids the npm SDK).
- **`scripts/resend-warmup.mjs` warming path stays valid** — pre-existing throwaway script proved the wire 5/5 Inbox at Plan 17-06; do not regress its `fetch()` shape compatibility.

**Out of scope for Phase 20 (handled by future milestones):**

- `/api/resend-webhook` with Svix HMAC for bounce/complaint/delivered events — v1.4+ per STATE.md locked-deferred (deliverability monitoring relies on Gmail inbox checks + Postmaster Tools enrolled Plan 17-06).
- HTML email body — v1.4+; re-evaluate threat model only if Jack reports plaintext readability friction.
- Per-IP rate limit on chat surface — v1.4+; KV-05 per-sessionId quota from Phase 18 is the v1.3-acceptable transcript-write-side guard.
- Workers Paid plan upgrade to bind `CHAT_RATE_LIMITER` — v1.4+ per Plan 17-04 DEBT-01 closure.
- Cloudflare Workers Analytics Engine integration for transcript metrics — v1.4+ Phase 21 per RESEARCH § SUMMARY.
- Markdown rendering of user input in email — phishing surface; v1.4+ if ever.
- Auto-linkification of URLs in email — same surface; v1.4+ if ever.
- Configurable inactivity threshold via env var — locked at 2h per STATE.md / RESEARCH Pitfall 2.

</domain>

<decisions>
## Implementation Decisions

### A. Cutover strategy

- **D-01:** **Atomic single deploy commit.** One commit ships `src/lib/email/resend.ts` + the renderer module + `sendOne()` substitution in `chat-delivery.ts` + `wrangler.jsonc` DRY_RUN flip `"1"` → `"0"` + adversarial-payload tests + `20-UAT.md` + DEPLOY-GATE.md. Cleanest audit trail per Phase 19 D-03 (locks the Resend POST landing visible in a single git diff). The wire was already proven by `scripts/resend-warmup.mjs` at Plan 17-06 (5/5 Inbox first try; ZERO Not-Spam feedback needed). Rejected: staged two-commit soak (slower but no operational payoff — Phase 19 already proved the DRY_RUN sweep mechanics); preview-first via branch (conflicts with Phase 19 D-04 "no test-environment override seam" — preview and prod share the wrangler.jsonc DRY_RUN value, so a DRY_RUN=`"0"` preview branch IS effectively a production deploy at merge time).
- **D-02:** **Seed-then-cron + wait-for-real operator UAT** — `20-UAT.md` Step 1: operator runs `wrangler kv key put live:test-uat-<sid>` with stale `last_activity_at` (Phase 19 Step 2 pattern). Step 2: operator temporarily flips `triggers.crons` to `["* * * * *"]` + redeploys (same Phase 19 D-12 pattern for the `*****` Past-Events verification). Step 3: verify Gmail Inbox arrival within 90s; verify `delivered:test-uat-<sid>` value has `dry_run: false` + populated `resend_message_id`; verify Workers Logs show `chat.delivery.sent` with matching `resend_message_id`. Step 4: revert `triggers.crons` to `["0 * * * *"]` + redeploy. Step 5: backlog cleanup (`wrangler kv key delete live:test-uat-*` + `delivered:test-uat-*`). Step 6 (organic): wait for the first real visitor conversation to flow through and land in Gmail Inbox naturally; record Resend message ID + arrival time in `result:` block. Catches both the wire AND inbox-delivery in one flow. Rejected: wait-for-organic only (UAT closure gated on real traffic; may take days; no seed-level confidence); sandbox-then-prod via `delivered@resend.dev` (Resend's test sandbox; adds a recipient-env-swap step that conflicts with the atomic-deploy lock).
- **D-03:** **Rollback = single-line `wrangler.jsonc` revert** (`"DRY_RUN": "0"` → `"1"`). If something breaks post-flip: operator edits + runs `wrangler deploy`. Resend POST is unreachable behind the dry-run gate; cron sweep continues logging envelopes. ~60s recovery. The Resend wrapper + adversarial tests stay in main — deployable surface is byte-stable, only the toggle flips. The DRY_RUN=`"1"` code path in `chat-delivery.ts` `sendOne` stays in source AS the rollback mechanism — do NOT delete it as "dead code" in Phase 20; it's the runway. Rejected: git-revert the deploy commit (larger blast radius — Resend wrapper + tests disappear from main; harder to re-ship cleanly); empty `triggers.crons` (heavier; bounds blast radius only if bug is in sweep loop rather than send path).
- **D-04:** **DEPLOY-GATE.md required (Plan 17-08 posture).** Executor commits all Phase 20 code locally, STOPS at the final metadata commit, writes DEPLOY-GATE.md with `status=pending` + 6-step manual UAT checklist matching `20-UAT.md`. Operator runs the UAT against the post-push production deployment, replies "approved — deploy gate cleared" (or revert path), THEN `git push origin main` themselves. Executor MUST NOT push. Mirrors the operator-trust pattern that closed Phase 17 cleanly (DEPLOY-GATE.md status=confirmed by Jack Cutrara 2026-05-11 via chat-reply audit trail). Rejected: standard executor completion (gate-before-push lever is gone if pre-push concern surfaces); lightweight chat-only gate (no file-tree audit trail).

### B. Subject edge cases — null country / null referrer / truncated suffix

- **D-05:** **Null `request.cf.country` → literal `unknown` token in subject.** `[Portfolio chat] 7 turns from unknown via stackoverflow.com`. Explicit, scannable, tells you at-a-glance the data was missing rather than that the visitor was somewhere specific. Common in `wrangler dev` local invocations (Workers runtime mocks `cf` sparsely) and rare production cases (Tor exits, very fresh edge POPs). Rejected: omit the `from <country>` segment (loses missing-vs-present signal — must open body to know); `??` literal (preserves 2-char alignment with ISO codes but adds a "what does ?? mean" question for any other reader).
- **D-06:** **Null `referrer` → literal `direct` token in subject.** `[Portfolio chat] 7 turns from US via direct`. Mirrors common analytics convention (UTM-style `(direct)` source). Tells you the visitor didn't arrive from a referring site — a valuable operational signal (cold visit, bookmark, social DM, paste from resume PDF). Rejected: omit the `via <host>` segment (loses direct-vs-referred signal); literal `unknown` (conflates "data missing" with "direct visit" — they are operationally different and Jack should be able to distinguish them at a glance).
- **D-07:** **Strict charset enforcement + CR/LF stripping on subject interpolations** (NOT a universal `sanitizeHeader()` helper). Country pinned to `[A-Z]{2}` regex (only ISO-3166-1 alpha-2 codes from `request.cf.country` are valid) or the literal `unknown` token from D-05 — no other values reach the subject. `referrer-host` is the output of `new URL(referrer).hostname` (URL parser already strips control chars + rejects malformed input); additionally enforce a `[a-z0-9.-]+` regex post-parse and fall back to the literal `direct` token from D-06 on mismatch. CR/LF + Unicode bidi (`U+202A..U+202E`, `U+2066..U+2069`) + null-byte stripping is a defensive belt over those suspenders (MAIL-03 lock). Smallest attack surface. Rejected: universal `sanitizeHeader()` helper (heavier defense for a field set that's currently 4 fields — subject, from, to, reply_to — three of which are env-controlled; adds abstraction surface without payoff at v1.3 scale); inline sanitize at each interpolation point (spreads sanitization logic across call sites; each new header field requires a dedicated sanitizer).
- **D-08:** **Truncated suffix = trailing space + parenthetical at end of subject** when `transcript.truncated === true`. `[Portfolio chat] 30 turns from US via direct (truncated)`. One space before, parenthetical at end. Visually distinct in Gmail's subject column — you see it without parsing the rest of the line. Matches Phase 18 D-08 locked spec verbatim. Rejected: bracketed prefix `[TRUNCATED]...` (groups under subject sort but conflicts with Phase 18 D-08 wording + higher visual noise); inline `30+` count suffix (tighter but loses the discrete signal Jack chose at Phase 18).

### C. Body shape — metadata header block + cache summary + turn markers

- **D-09:** **Cache-hit data surfaces as aggregate one-liner inside the metadata header block** (NOT per-turn inline notation; NOT omitted). One line at the bottom of the 7-line metadata block alongside timestamps/country/referrer/user-agent/messages. Quick at-a-glance health check ("cache mostly worked this session") without polluting per-turn read flow. Phase 18 META-02 captures `cache_read_input_tokens` + `cache_creation_input_tokens` per assistant turn in transcript metadata; the renderer aggregates across all assistant turns at email-render time. Rejected: per-turn inline notation `[cache: 1234r / 0c]` next to each `<<< bot:` (higher info density but heavier visual noise — Jack reads transcripts in entirety; cache numbers next to every bot line is friction); omit entirely (loses at-rest persistence — Workers Logs retention is short; email is the canonical durable surface for v1.3).
- **D-10:** **Cache aggregate format = `Cache: 5/8 turns hit, 7,234 read / 1,221 created`.** Compact + scannable. `hit` count is the human signal (did caching mostly work?); raw token totals are the diagnostic. Slash separator distinguishes the two token kinds without verbose labels. Thousands separators (`,`) since these numbers can run into 5+ digits and become unreadable. `hit` = count of assistant turns with `cache_read_input_tokens > 0`. Rejected: verbose sentence form ("Anthropic cache: 5 of 8 turns hit cache; 7234 tokens read from cache, 1221 created" — less scannable in monospace plaintext); terser form ("Cache hits 5/8 (read 7234 / create 1221)" — drops thousands separator and comma; harder to read).
- **D-11:** **Metadata header block = compact 7-line block with padded label column.** Format:
  ```
  Session:    <sessionId>
  Started:    2026-05-12T14:23:08Z
  Last turn:  2026-05-12T14:31:42Z (8m 34s)
  From:       US · Mountain View
  Referrer:   https://linkedin.com/in/jackcutrara
  User-agent: Mozilla/5.0 (Macintosh; Intel...) Chrome/132
  Messages:   8 turns
  Cache:      5/8 turns hit, 7,234 read / 1,221 created
  ```
  Then blank line, then provenance line (`From: chat widget on jackcutrara.com — visitor message follows below this line.`), then blank line, then turn markers. Label column is padded to a fixed width (12 chars suggested; planner picks final width). Rejected: pipe-separated single-line header (loses per-field discoverability); sectioned with `===` rule lines between Context/Metadata/Conversation (more vertical real estate before the actual conversation; Jack reads everything, so the early scroll cost compounds).
- **D-12:** **Turn-marker render = marker line then raw content, blank line between turns.** Format:
  ```
  >>> visitor:
  Does Jack have multi-DEX trading experience?

  <<< bot:
  Yes — see the multi-dex-crypto-trader project for
  the full architecture write-up.

  >>> visitor:
  What languages did he use?
  ```
  Marker on its own line; content verbatim below (no indent, no wrapping); blank line separates turns. HTML-escape applied to every dynamic field (visitor content, bot content, referrer, user-agent, country) even though body is plaintext — MAIL-03 defense-in-depth for any future v1.4+ HTML migration. Easy to read in Gmail's monospace plaintext; preserves user line breaks exactly. Rejected: inline marker with content on same line (compact for short messages; for multi-line content the marker visually disconnects from continuation lines); indented content with 2/4 spaces (looks like a code block — visitor pasting code with literal leading spaces gets ambiguous indentation; harder to copy-paste content out of the email).

### D. Resend HTTP error policy

- **D-13:** **Three-class HTTP status taxonomy.** 2xx → success, write `delivered:` marker with populated `resend_message_id`. 5xx and 429 → retry with same Idempotency-Key (within the 3-try budget Phase 19 D-07 locked; full-jitter exponential backoff already exists in `chat-delivery.ts retryWithBackoff` at lines 128-149). 4xx-except-429 → do NOT retry, emit `chat.delivery.failed { sid, http_status, resend_error, attempt }`, return error from `sendOne` (per-session try/catch in `promoteOne` already isolates; session waits for next tick's retry-from-scratch — but most 4xx mean the payload is broken, not transient). 3xx → unexpected for Resend, treat as 4xx. Workers Logs filter for `4xx-except-429` surfaces bad-payload bugs without retry-storm noise. Rejected: two-class retry-all-failures (a bad-payload 422 burns full retry budget on the same broken payload, wastes Resend rate-limit credit, slows the per-tick batch); retry-on-5xx-only with 429 separation that defers to next-tick (cleaner if 30s scheduled-handler budget were tight, but Phase 19's full-jitter ceiling is 5s so 3 retries against a 429 still fit within budget; tick-deferred 429 also splits the retry-budget reasoning across two systems).
- **D-14:** **Idempotency replay = treat as success; emit distinct log event.** Resend returns `200 OK` with `idempotency_replay: true` (and the original `data.id`) when the same Idempotency-Key + payload posts twice within 24h. The wrapper treats this as success: same `data.id` → `delivered:{sid}` writes the same `resend_message_id`, `live:{sid}` gets deleted in `promoteOne`'s step 5. Optionally emit `chat.delivery.idempotency_replay { sid, resend_message_id, attempt }` (distinct event name from `chat.delivery.sent`) so Workers Logs can spot when the cron re-fires duplicates — informational, not a failure. Matches the layer-1 (`delivered:` cursor) + layer-2 (Resend Idempotency-Key) defense-in-depth design from RESEARCH § Critical Pitfall 4. Rejected: log as warning (replay is expected at v1.3 idempotency-by-design; warning level pollutes the warning surface); detect-and-skip-KV-writes (if `idempotency_replay: true` and `delivered:{sid}` doesn't exist locally, that's a data-integrity bug and the bug should surface — option 1's "same as first send" preserves visibility).
- **D-15:** **`AbortController` with 10s timeout per fetch attempt; throws caught at retry-harness layer treated as 5xx-class.** Each `fetch()` call wrapped in `AbortController` with `signal` set; timeout fires at 10s. Workers cron-tick budget is 30s total; 10s per attempt × 3 retries ≈ 30s worst-case wall-clock per session (backoff sleeps add another ~7s in the worst case → effectively bounded by the cron-tick ceiling, which is why per-session try/catch in `promoteOne` is the right place to absorb timeout cost without starving the rest of the batch). Network/timeout errors throw from `fetch()` and are caught at the `retryWithBackoff` layer — same retry treatment as 5xx (retry with same key, full-jitter backoff). On terminal failure: emit `chat.delivery.failed { sid, error_class, http_status: null, attempt: 3 }`. Bounds the worst-case wall-clock per session so a hung Resend endpoint can't starve the remaining batch (Phase 19 50-session batch cap intent preserved). Rejected: no-timeout (a hung connection consumes the entire 30s scheduled-handler budget on one session, breaks the batch-cap intent); timeout-per-tick (single AbortController shared across all 3 retries with a 15s total send-budget; tighter but conflicts with full-jitter backoff that can sleep up to ~5s per gap, and risks declaring a session failed when a single slow round-trip would have succeeded).
- **D-16:** **Four distinct Workers Logs event names.** `chat.delivery.sent { sid, resend_message_id, attempt }` (2xx success), `chat.delivery.failed { sid, http_status, error_class, attempt }` (terminal failure after retries OR 4xx-except-429), `chat.delivery.retry { sid, http_status, attempt, backoff_ms }` (transient failure before next retry), `chat.delivery.idempotency_replay { sid, resend_message_id, attempt }` (200 with replay flag). Each event name maps to exactly one operational question Jack can grep for. Extends the Phase 19 family naturally — `chat.delivery.dry_run`, `chat.delivery.tick`, `chat.delivery.skipped_already_delivered`, `chat.delivery.failed` already exist. Flat-primitive fields only per the Plan 17-05 DEBT-02 / Phase 18 / Phase 19 convention. Rejected: two events (`sent` + `failed`) with `attempts: 3` field for terminal failures (retry decisions invisible mid-flight; harder to debug latency outliers); single `chat.delivery.outcome` with `status` discriminator (one search captures all outcomes but every Workers Logs query has to add a status filter to disambiguate; loses the cardinality-minimization benefit of distinct names).

### Claude's Discretion

- **`src/lib/email/` directory shape** — Phase 20 introduces a new `src/lib/email/` directory. Whether the renderer logic lives in `src/lib/email/render.ts` (sibling to `resend.ts`) vs `src/lib/email/render/*.ts` (split into `subject.ts` + `body.ts` + `escape.ts`) vs inlined into `resend.ts` — planner's call. Suggestion: split when the LOC grows past ~250 in a single file; otherwise keep cohesive. Mirrors the Phase 18 `chat-transcripts.ts` / Phase 19 `chat-delivery.ts` precedent of "one cohesive pure module per Phase contract."
- **Exact retry-harness wiring inside `sendOne`** — `chat-delivery.ts retryWithBackoff` already wraps `sendOne` at 3 attempts; planner picks whether the Resend wrapper internally calls retryWithBackoff (couples the wrapper to chat-delivery's helper), uses its own retry loop (duplicates the harness), or returns a discriminated result type that lets `sendOne` decide which class (2xx/5xx/4xx-except-429) → retry vs no-retry. Recommended: the Resend wrapper returns a typed Result; `sendOne` translates Result to a thrown error (when 5xx or 429 — caught by retryWithBackoff and retried) vs a returned `{ status: "failed_terminal" }` (when 4xx-except-429 — propagated up through promoteOne's catch to log + return error status). Keeps the retry decision close to the harness it depends on.
- **Adversarial-payload unit-test fixture set + organization** — MAIL-05 enumerates the payload classes (`<script>`, `</p><img onerror>`, `javascript:` URLs, RTL/bidi U+202A..U+202E + U+2066..U+2069, null bytes, social-engineering prefixes). Planner picks fixture file structure (one fixture per payload class vs single `tests/api/email-render.adversarial.test.ts` with `it.each` over all payloads), how many variants per class, whether to test renderer output as a string match or as a `text/plain` raw byte snapshot. Recommended: single `it.each` test file with one row per locked payload class; assert (a) the payload literal appears in the rendered body verbatim and (b) no HTML entity / link / control-char artifact appears (defensive over MAIL-03's HTML-escape rule even though body is plaintext).
- **`20-UAT.md` step ordering** — D-02 enumerates the 6 steps but their final ordering inside `20-UAT.md` is presentational. Per Phase 17 / Phase 18 / Phase 19 precedent, ordering should match the success-criteria numbering for traceability. The organic-real-traffic step (Step 6) sits last because it's the only step gated on visitor traffic rather than operator action.
- **Where the User-Agent + Referrer caps live** — Phase 18 KV-04 truncates referrer + user_agent to 512 chars AT WRITE TIME (in `chat-transcripts.ts`). Phase 20 renderer reads the already-truncated values. Planner verifies no second truncation is needed at render time and removes any defensive re-truncation if accidentally added. Truncated-flag posture: don't re-flag truncated user-agent in the email body (the field is just-display; the truncated discriminator at the transcript level is already locked to msg-count truncation).
- **Provenance line placement** — Phase 20 body opens with metadata header → provenance line (`From: chat widget on jackcutrara.com — visitor message follows below this line.`) → blank line → turn markers. Whether the provenance line sits inside the metadata header block as a final line, OR above it as a "preamble banner", OR below it as a transition — planner picks. Suggestion: below the 7-line metadata block, separated from it by a blank line and from the conversation by another blank line; creates a visible "the conversation below is adversarial" cue right before the turn markers start.
- **Whether the Resend wrapper exports a thin `sendEmail(env, payload)` or a richer `sendTranscript(env, transcript)` API** — planner picks. Recommended: `sendEmail(env, payload)` accepts an already-rendered envelope `{ from, to, reply_to, subject, text, idempotency_key }` so the renderer and the HTTP wrapper are testable in isolation. `sendOne(env, transcript)` in `chat-delivery.ts` composes (render → fetch wrapper → result handling).
- **`20-UAT.md` `result:` block for Step 6 organic real-traffic** — operator records Resend message ID + arrival time + screenshot of Gmail Inbox + screenshot of Workers Logs `chat.delivery.sent` log line. Step 6 is the only one gated on visitor traffic; if no visitor arrives within a 7-day window post-deploy, the milestone can still close on Steps 1-5 + manual operator `scripts/resend-warmup.mjs` re-execution as proxy. Planner picks the 7-day soft cap; this is operational documentation, not a hard requirement.
- **Whether to extend `tests/build/append-turn-call-site.test.ts`-style source-text forward-defense for the new `sendOne` substitution** — planner picks. Recommended: add `tests/build/chat-delivery-send-site.test.ts` asserting the throw-stub is gone and the Resend wrapper import is wired; extends the Phase 18 / Phase 19 source-text guard family.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Requirements & roadmap

- `.planning/ROADMAP.md` — Phase 20 entry: goal statement, requirements list (MAIL-01..05), 5 success criteria, depends-on Phase 19
- `.planning/REQUIREMENTS.md` — MAIL-01..05 (lines 50-54); requirement traceability table lines 151-155
- `.planning/STATE.md` — v1.3 architectural decisions lines 73-77 (Resend justified new runtime dep; silent posture; hourly cron + 2h inactivity); v1.3 phase-shape decisions lines 81-86; Out-of-scope locks lines 207-212
- `.planning/PROJECT.md` — v1.3 milestone summary; "Known issues / tech debt" section

### Prior phase context

- `.planning/phases/19-cron-sweep-scheduling-idempotency-dry-run/19-CONTEXT.md` — Phase 19 contract that Phase 20 completes: D-01/D-02 DRY_RUN env-flag mechanics; D-03 single-line wrangler.jsonc flip lock; D-04 no test-environment override seam; D-05 envelope log shape (NAMES locked, ORDER planner's); D-06 `src/lib/email/resend.ts` is created in Phase 20; D-07 3-try retry harness structure; D-08 subject derivation lives in Phase 20; D-09 `delivered:` value shape additive extension (adds `resend_message_id`, flips `dry_run` to false); OQ-2 full-jitter exponential backoff baseline
- `.planning/phases/19-cron-sweep-scheduling-idempotency-dry-run/19-UAT.md` — Phase 19 UAT precedent: numbered manual steps with `wrangler` commands + `expected:` / `result:` blocks; `*****` Past-Events verification pattern; seed-and-sweep pattern; backlog cleanup of test-uat-* keys
- `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md` — Phase 18 KV write contract: schema `v: 1`; META-01 metadata fields (`started_at`, `last_activity_at`, `referrer`, `user_agent`, `country`, `region`, `colo`, `message_count`, `truncated`); META-02 cache-token capture per assistant turn; D-08 truncated suffix lock for Phase 20 subject; D-09 silent + structured error log posture
- `.planning/phases/17-foundations-migration-dns-debt-sweep/17-CONTEXT.md` — Phase 17 foundation: D-06 sender = `"Portfolio Chat" <transcripts@mail.jackcutrara.com>` + Reply-To `jackcutrara@gmail.com`; D-07 throwaway warmup script as Phase 20 dry-run; D-08 warming-sends-last ordering
- `.planning/phases/17-foundations-migration-dns-debt-sweep/DEPLOY-GATE.md` — deploy-gate posture template Phase 20 mirrors: operator-confirmed gate, executor MUST NOT push, chat-reply as durable audit trail (Plan 17-08 precedent)
- `.planning/phases/17-foundations-migration-dns-debt-sweep/17-RETROSPECTIVE.md` — Phase 17 patterns Phase 20 should honor: explicit `pnpm exec astro check` gate at phase close; build-time source-text tests for canonical decisions; Rule 1 cap-bumping pattern when adding counted constructs

### Research (v1.3-wide, authored at milestone gate)

- `.planning/research/SUMMARY.md` — Phase 20 rationale (lines 177-187); Resend REST via fetch (NOT npm SDK); Idempotency-Key threading; plaintext-only body locked; adversarial-payload suite mandated
- `.planning/research/STACK.md` — Resend (REST via `fetch`) line 38; Wrangler secrets pattern line 41; Resend domain DNS line 42
- `.planning/research/ARCHITECTURE.md` — `src/lib/email/resend.ts` file shape (line 157); two-keyspace partition + Resend Idempotency-Key layered defense (lines 88-94, 287-298); idempotency replay semantics (line 391); Resend rate-limit + retry strategy (line 538)
- `.planning/research/PITFALLS.md` — Critical Pitfall 3 (HTML escape — locked plaintext-only; adversarial-payload unit suite + manual UAT mandated; bidi-override strip; Subject sanitization same surface; no preheader echo of visitor content); Critical Pitfall 4 (Cron + KV idempotency — two-key sentinel pattern + Resend Idempotency-Key 24h window + `transcript/{sid}` format); Critical Pitfall 5 (D-26 cross-phase gate); Critical Pitfall 7 (Gmail spam classification — Postmaster Tools already enrolled Plan 17-06; SPF/DKIM/DMARC live; domain warmed); Moderate Pitfall G (SDK vs fetch — REST chosen); Minor Pitfall β (rate limit on Resend test); Minor Pitfall δ (delivered ≠ inboxed — webhook deferred to v1.4+)

### Resend API documentation (external — researcher should fetch via Context7 / WebFetch)

- Resend REST API `POST https://api.resend.com/emails` — request body shape (`from`, `to`, `reply_to`, `subject`, `text`); `Authorization: Bearer` header; `Idempotency-Key` header (256-char max, `<event-type>/<entity-id>` recommended format); 24h idempotency window; `idempotency_replay: true` response flag; status code semantics (2xx success, 429 rate-limited with default 2 req/sec, 4xx invalid payload, 5xx transient)
- Resend error handling + retry strategy — official doc recommends retry-with-same-key on 5xx and 429 with exponential backoff; 4xx-except-429 indicates payload bug (do not retry)
- Cloudflare Workers `fetch()` + `AbortController` — `signal` field; timeout pattern via `AbortController` + `setTimeout`; subrequest CPU/wall-time budget within `scheduled()` handler (30s ceiling)

### Existing code surface (post-Phase-19 baseline)

- `src/lib/chat-delivery.ts` — Phase 20 EDITS the `sendOne` function (lines 163-184): replace the `throw new Error("send_not_implemented_in_phase_19")` branch (line 183) with a call to the new Resend wrapper. The DRY_RUN=`"1"` branch (lines 167-181) STAYS BYTE-IDENTICAL as the rollback runway per D-03. The `promoteOne` flow (lines 203-318) is UNCHANGED. The locked constants block (lines 47-53) — `INACTIVITY_THRESHOLD_MS`, `PER_TICK_BATCH_CAP`, `PAGINATION_PAGE_HARDCAP`, `MAX_SEND_ATTEMPTS`, `BACKOFF_BASE_MS`, `BACKOFF_CAP_MS`, `DELIVERED_TTL_SECONDS` — UNCHANGED. `DeliveredMarker` interface (lines 66-73) EXTENDS additively with `resend_message_id: string` field (Phase 19 D-09 lock).
- `src/lib/email/resend.ts` — **NEW FILE** (~80-150 LOC estimate). Exports `sendEmail(env: ResendEnv, payload: ResendPayload): Promise<ResendResult>`. `ResendPayload` = `{ from, to, reply_to, subject, text, idempotency_key }`. `ResendResult` = discriminated `{ status: "sent", message_id, attempt } | { status: "replayed", message_id, attempt } | { status: "failed_transient", http_status?, error_class? } | { status: "failed_terminal", http_status, resend_error }`. Owns HTTP layer + Idempotency-Key header + AbortController timeout. Pure module — NO Anthropic SDK, NO `cloudflare:workers`, NO `src/scripts/chat.ts` reach-in. Unit-testable with mocked `fetch`.
- `src/lib/email/render.ts` (file location is planner's discretion) — **NEW FILE**. Exports `renderEmail(transcript: ChatTranscript): ResendPayload`. Subject derivation per D-05/D-06/D-07/D-08. Body composition per D-11/D-12. HTML-escape + CR/LF + bidi-override strip per MAIL-03. Aggregate cache one-liner per D-09/D-10. Pure module — adversarial-payload unit-testable.
- `wrangler.jsonc` — Phase 20 EDITS: change `vars.DRY_RUN` from `"1"` to `"0"` (the locked single-line flip per D-01/D-03). `triggers.crons`, `kv_namespaces`, `assets`, `CHAT_REPLY_TO_EMAIL`, `WORKERS_PREVIEW_SUFFIX` UNCHANGED.
- `src/worker.ts` — UNCHANGED. Phase 19 wired `scheduled()` to call `ctx.waitUntil(deliverDue(env, controller.scheduledTime).catch(...))`. Phase 20 doesn't touch this file.
- `src/lib/chat-transcripts.ts` — UNCHANGED. `ChatTranscript` type is consumed read-only by Phase 20 renderer.
- `src/pages/api/chat.ts` — UNCHANGED. D-15 SSE byte-identical anchor PRESERVED.
- `src/scripts/chat.ts` — UNCHANGED.
- `src/lib/validation.ts` — UNCHANGED.
- `src/styles/global.css` — UNCHANGED.
- `package.json` `dependencies` — UNCHANGED phase-wide (MAIL-01 zero-new-runtime-dep lock).
- `scripts/resend-warmup.mjs` — UNCHANGED (Plan 17-06 throwaway warmup script; its `fetch()` shape is byte-compatible with the new Phase 20 wrapper).
- `tests/api/sse-snapshot.test.ts` — D-15 anchor; re-verify GREEN at phase close.
- `tests/api/anthropic-payload-shape.test.ts` — TEST-03 anchor; re-verify GREEN at phase close.
- `tests/api/cache-hit-logs.test.ts` — DEBT-02 anchor; re-verify GREEN at phase close.
- `tests/api/chat-delivery.test.ts` — Phase 19 unit-test battery; Phase 20 EXTENDS with new test cases asserting the `sendOne` substitution wires the Resend wrapper, the `DeliveredMarker.resend_message_id` field populates, and the DRY_RUN=`"0"` code path calls `sendEmail` while DRY_RUN=`"1"` does not (rollback runway forward-defense).

### NEW test surface (Phase 20 authors)

- `tests/api/email-render.test.ts` — **NEW**. Unit tests for `renderEmail(transcript)`. Cases: subject derivation (locked format + null country → `unknown` + null referrer → `direct` + truncated suffix); body composition (7-line metadata header padded labels + provenance line placement + turn-marker shape with blank-line separators); HTML-escape applied to all dynamic fields; aggregate cache one-liner format with thousands separators; truncated subject suffix placement.
- `tests/api/email-render.adversarial.test.ts` — **NEW**. Adversarial-payload unit suite (MAIL-05 closure). `it.each` over locked payload classes: `<script>alert(1)</script>`, `</p><img src=x onerror=alert(1)>`, `javascript:alert(1)`, RTL/bidi override (`U+202A..U+202E`, `U+2066..U+2069`), null bytes (`\0`), social-engineering provenance prefixes (e.g. visitor typing "From: chat widget on jackcutrara.com"). Assert: (a) HTML-escape converts angle brackets / quotes / ampersands to entities even though body is plaintext; (b) bidi overrides are stripped (zero occurrences in output); (c) null bytes are stripped; (d) CR/LF in subject components are stripped; (e) the social-engineering provenance prefix is NOT confusable with the literal provenance line at the body opening (the literal provenance line carries a distinct prefix like `From: chat widget on jackcutrara.com —` that no visitor-typed string can spoof above it).
- `tests/api/email-resend.test.ts` — **NEW**. Unit tests for `sendEmail(env, payload)` with mocked global `fetch`. Cases: 2xx → `{ status: "sent", message_id, attempt: 1 }`; 200 with `idempotency_replay: true` → `{ status: "replayed", ... }`; 5xx → `{ status: "failed_transient", ... }`; 429 → `{ status: "failed_transient", ... }`; 4xx-except-429 → `{ status: "failed_terminal", ... }`; AbortController timeout fires at 10s → throws / `failed_transient`; Idempotency-Key header literal `transcript/${sessionId}` shape; `Authorization: Bearer ${env.RESEND_API_KEY}` literal; `text` field present + `html` field ABSENT.
- `tests/api/chat-delivery.test.ts` — **EXTEND**. Add cases for the new `sendOne` wiring: DRY_RUN=`"1"` still emits envelope log (unchanged); DRY_RUN=`"0"` calls `sendEmail`; on `{ status: "sent", message_id }` → `delivered:{sid}` value has `dry_run: false` + populated `resend_message_id`; on `{ status: "failed_transient" }` → retry harness fires; on `{ status: "failed_terminal" }` → emits `chat.delivery.failed`, returns error from promoteOne; on `{ status: "replayed" }` → success path with distinct `chat.delivery.idempotency_replay` log emission.
- `tests/build/chat-delivery-send-site.test.ts` — **NEW** (optional per Claude's Discretion). Source-text forward-defense that `src/lib/chat-delivery.ts` `sendOne` imports the Resend wrapper and does NOT contain the Phase 19 throw stub. Extends the Phase 18 / Phase 19 source-text guard family.
- `tests/build/wrangler-dry-run-shape.test.ts` — **NEW** (optional per Claude's Discretion). Build-time source-text guard that `wrangler.jsonc` `vars.DRY_RUN` is `"0"` at phase close + `triggers.crons` stays `["0 * * * *"]` (forward-defense against the UAT Step 4 operator forgetting to revert the temporary `*****` cron flip).
- `20-UAT.md` — **NEW** at phase-end. Encodes the 6-step manual operator UAT per D-02.
- `DEPLOY-GATE.md` — **NEW** at phase-end. Mirrors Plan 17-08 DEPLOY-GATE.md template; status=pending; 6-step UAT checklist; operator-confirmation slot.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`scripts/resend-warmup.mjs`** (Plan 17-06 commit `0b9d5c5`) — INTENTIONAL Phase 20 dry-run per Plan 17-06 retrospective. Lines 41-64 already exercise the canonical wire shape: `POST https://api.resend.com/emails` + `Authorization: Bearer ${apiKey}` + `Idempotency-Key: warmup/${sessionId}` + JSON body `{ from, to, reply_to, subject, text }`. Phase 20's `src/lib/email/resend.ts` is byte-compatible by construction — the warmup script is the wire-shape oracle. Domain warmed by 5/5 Inbox first-try (ZERO Not-Spam feedback needed). Phase 20 `sendEmail()` implementation should read like a Workers-runtime port of this script with: AbortController added; retry-loop delegated to `chat-delivery.ts` `retryWithBackoff`; discriminated Result return type; structured log emission.
- **`src/lib/chat-delivery.ts retryWithBackoff` helper** (lines 128-149, Plan 19-02) — already implements 3-try full-jitter exponential backoff. Phase 20 reuses unchanged. `sendOne` already calls it: `await retryWithBackoff(() => sendOne(env, transcript!), MAX_SEND_ATTEMPTS);` (line 264). The retry semantics that ship in Phase 19 are the same semantics Phase 20 uses for live Resend retries — no harness change.
- **`src/lib/chat-delivery.ts sendOne` substitution point** (lines 163-184) — the Phase 19 throw branch at line 183 (`throw new Error("send_not_implemented_in_phase_19")`) is the substitution target. The DRY_RUN=`"1"` branch above (lines 167-181) stays byte-identical as the rollback runway per D-03. Phase 20 inserts the Resend-wrapper call into the else branch.
- **`DeliveredMarker` interface** (`src/lib/chat-delivery.ts` lines 66-73, Plan 19-02) — Phase 19 D-09/D-10 already locked additive extension. Phase 20 appends `resend_message_id: string` field; `v` stays `1`; `dry_run` discriminator flips to `false` when `env.DRY_RUN === "0"`. Schema-versioned forward-defense.
- **`ChatTranscript` + `KVMetadata` types** (`src/lib/chat-transcripts.ts`, Plan 18-02) — Phase 20 renderer reads `ChatTranscript` as input. `messages[]` (with `role`, `content`, `ts`, `cache_read_input_tokens`, `cache_creation_input_tokens`); `meta` (with `started_at`, `last_activity_at`, `referrer`, `user_agent`, `country`, `region`, `colo`); `msg_count`; `truncated`; `sid`. All fields needed by the renderer are already in the schema (Plan 18-02 KV-04 + META-01 + META-02 closure).
- **`scripts/resend-warmup.mjs` `from` literal** (`"Portfolio Chat" <transcripts@mail.jackcutrara.com>`) and **`reply_to` literal** (`jackcutrara@gmail.com`) — locked by Phase 17 D-06; Phase 20 sources these from `CHAT_SENDER_EMAIL` + `CHAT_REPLY_TO_EMAIL` (already in `wrangler.jsonc` `vars` for reply-to; sender lives in Wrangler secret per Plan 17-02 retrospective).
- **Structured Workers-Logs convention** — established by Plan 17-05 DEBT-02 (`chat.cache_metrics`), extended by Phase 18 (`chat.transcript.write_failed` / `.quota_exceeded` / `.race_suspected`), Phase 19 (`chat.delivery.dry_run` / `.tick` / `.skipped_already_delivered` / `.failed`), and now Phase 20 (`chat.delivery.sent` / `.failed` / `.retry` / `.idempotency_replay`). Flat-primitive fields only; second arg parsed as JSON by `wrangler tail`.
- **D-26 chat regression battery baseline carried from Phase 19 close** — 498 PASS / 0 FAIL / 2 SKIP. Phase 20 must hold both this baseline AND `pnpm exec astro check` at 0/0/0 (Plan 17-08 / Phase 19 standard).

### Established Patterns

- **Pure-module helper pattern** — `src/lib/validation.ts` (Phase 7 v1.0) → `src/lib/chat-transcripts.ts` (Plan 18-02) → `src/lib/chat-delivery.ts` (Plan 19-02) → `src/lib/email/resend.ts` + `src/lib/email/render.ts` (Phase 20). Named exports; inline decision-ID citations; zero non-stdlib deps beyond CF Workers types; structurally testable with mocks.
- **TDD pattern carried from Phases 17/18/19** — `tests/build/*` for source-text source-of-truth invariants; `tests/api/*` for unit tests of pure modules; `tests/client/*` for DOM-mock assertions (Phase 20 adds none — no client-side surface).
- **Atomic single-deploy + DEPLOY-GATE.md operator confirmation** (Plan 17-08 + D-04) — operator-confirmed gate before `git push`. Executor MUST NOT push. Chat-reply audit trail as durable evidence (Plan 17-08 precedent).
- **Single-line wrangler.jsonc flip for forward/rollback toggles** (Phase 19 D-03 + D-01) — Phase 19 introduced the DRY_RUN env var via `vars` block; Phase 20 flips it via single-line edit. The flip is visible in git diff; rollback is a second single-line edit. No source-code edits needed for either direction.
- **`ctx.waitUntil(promise.catch(...))` rejection-handling rule** — Phase 18 D-09 + Phase 19 inherited. Phase 20 doesn't introduce a new `ctx.waitUntil` site; uses Phase 19's existing wiring in `worker.ts scheduled()` and `chat-delivery.ts deliverDue/promoteOne`.
- **Numbered manual UAT spec** per Plan 17-06 (17-UAT.md) + Plan 18-08 (18-UAT.md) + Plan 19-04 (19-UAT.md) — `20-UAT.md` mirrors this exactly: numbered steps, `wrangler` commands, `expected:` / `result:` blocks. D-02 enumerates the 6 steps.
- **Build-time source-text test pattern** for source-of-truth invariants (Plan 17-04 + Plan 17-08 + Plan 18 + Plan 19 STATE.md retrospective). Phase 20 adds (optional per Claude's Discretion): source-text guards on `chat-delivery.ts sendOne` substitution + `wrangler.jsonc` DRY_RUN shape.
- **Distinct-event-name Workers Logs convention** — established by Phase 19's family of 4 `chat.delivery.*` events; Phase 20 extends naturally with 4 more. Each event name maps to exactly one operational question. Greppable via `wrangler tail --search "chat.delivery.sent"`.

### Integration Points

- `wrangler.jsonc` — EDITS: `vars.DRY_RUN` flipped from `"1"` to `"0"` (single line). Other keys UNCHANGED.
- `src/lib/chat-delivery.ts` — EDITS: `sendOne` body — replace the throw stub at line 183 with a call to the new Resend wrapper; the DRY_RUN=`"1"` branch stays byte-identical as rollback runway. `DeliveredMarker` interface (lines 66-73) extends additively with `resend_message_id: string`. `promoteOne` step-4 PUT (lines 268-281) populates the new field on the value. The `dry_run` discriminator at line 272 evaluates `env.DRY_RUN === "1"` which correctly flips with the DRY_RUN value.
- `src/lib/email/resend.ts` — **NEW**. Exports `sendEmail(env, payload)` returning a discriminated Result. Internal: builds the request, sets headers (Authorization + Idempotency-Key + Content-Type), wraps `fetch` in AbortController with 10s timeout, parses response status into one of 4 Result variants, emits 1 of 4 distinct log events.
- `src/lib/email/render.ts` (file location is planner's discretion) — **NEW**. Exports `renderEmail(transcript)` returning a payload object the Resend wrapper consumes. Pure module; no I/O.
- `src/lib/chat-transcripts.ts` — UNCHANGED. Type-only import surface for the renderer.
- `tests/api/email-render.test.ts` — **NEW**. Unit tests for renderer happy paths + edge cases (null country / null referrer / truncated transcript).
- `tests/api/email-render.adversarial.test.ts` — **NEW**. MAIL-05 closure: adversarial-payload unit suite with `it.each` over locked payload classes.
- `tests/api/email-resend.test.ts` — **NEW**. Unit tests for `sendEmail` with mocked `fetch` + AbortController.
- `tests/api/chat-delivery.test.ts` — EXTEND with cases asserting the new `sendOne` wiring + `delivered:` value extension.
- `tests/build/chat-delivery-send-site.test.ts` — **NEW** (optional). Source-text forward-defense.
- `tests/build/wrangler-dry-run-shape.test.ts` — **NEW** (optional). Source-text guard against an operator forgetting to revert the UAT cron flip.
- `20-UAT.md` — **NEW** at phase-end. 6-step manual operator UAT spec.
- `DEPLOY-GATE.md` — **NEW** at phase-end. Operator-confirmation gate before `git push origin main`.

</code_context>

<specifics>
## Specific Ideas

- The `scripts/resend-warmup.mjs` script is the wire-shape oracle for `src/lib/email/resend.ts`. The Phase 20 wrapper is essentially a Workers-runtime port with: discriminated Result return type instead of `process.exit(1)`; AbortController + 10s timeout per attempt; retry delegated to `chat-delivery.ts retryWithBackoff`; structured-log event emission. The fetch shape itself is identical (URL, method, headers, body JSON keys). This is by design per Plan 17-06's decision to make the warmup script "a wire-shape validator AND a deliverability warming surface" — Phase 20 inherits both.
- The DRY_RUN=`"1"` code path in `chat-delivery.ts sendOne` is NOT dead code after Phase 20 — it's the rollback runway. Do NOT delete it as a cleanup pass. Future contributors who see `if (env.DRY_RUN === "1")` may want to remove it as "unreachable in production"; they're missing that it's the instant-rollback mechanism per D-03. Add a comment block explaining the runway role.
- Aggregate cache one-liner format `Cache: 5/8 turns hit, 7,234 read / 1,221 created` should compute `hit` count as `messages.filter(m => m.role === "assistant" && (m.cache_read_input_tokens ?? 0) > 0).length` and total bucket as sum across all assistant turns. Thousands separators come from `Number.toLocaleString("en-US")` — works in Workers runtime without external locale data.
- The 6-step `20-UAT.md` operator UAT closes specific success criteria 1-by-1: Step 1 (seed) + Step 2 (cron flip + invoke) + Step 3 (verify Gmail Inbox + delivered marker + Workers Logs) = success criterion 1 (one email lands in Inbox). Step 4 (revert cron) = operational hygiene. Step 5 (backlog cleanup) = no audit-debt of test-uat-* keys. Step 6 (organic real-traffic) = success criterion 4 closure for idempotency-in-the-wild verification. The planner should preserve this 1:1 mapping in `20-UAT.md`'s structure so an auditor can trace each success criterion to its evidence block (Phase 19 pattern carried).
- The provenance line below the metadata header block is the structural anti-impersonation defense for social-engineering provenance prefixes. If a visitor types `"From: chat widget on jackcutrara.com — visitor message follows below this line."` as their actual message, the renderer outputs that literal text under a `>>> visitor:` marker — but the AUTHENTIC provenance line above the conversation block uses a distinct prefix (`From: chat widget on jackcutrara.com —`) that is byte-identical regardless of visitor content. Jack reads the provenance line ONCE at the top; everything after the first blank line is adversarial-content territory. The renderer must NOT echo any visitor input into the header block or pre-conversation area.
- The `wrangler tail --search "chat.delivery.sent"` operational query is the canonical "did the email land?" check. The 4-distinct-event-name posture in D-16 means Jack can filter Workers Logs for exactly one event type without status-field disambiguation. Phase 19 already established this for `chat.delivery.tick` / `.dry_run` / `.skipped_already_delivered` / `.failed`; Phase 20 extends the family.
- Plan-time test count delta projection: Phase 20 adds approximately ~30-40 new tests (`email-render.test.ts` ~10, `email-render.adversarial.test.ts` ~6-8 payload classes × ~2 assertions per fixture, `email-resend.test.ts` ~8-10 mocked fetch cases, `chat-delivery.test.ts` extension ~4-6 cases, 2 optional build-time guards ~2-4). Phase 20 close baseline target: 530+ PASS / 0 FAIL / 2 SKIP (Phase 19 close was 498/0/2).

</specifics>

<deferred>
## Deferred Ideas

- **`/api/resend-webhook` with Svix HMAC for bounce/complaint/delivered events** — v1.4+ per STATE.md locked-deferred. Deliverability monitoring relies on Gmail inbox checks + Postmaster Tools enrolled Plan 17-06 (data lag 24-48h post first volume).
- **HTML email body with rich rendering** — v1.4+. Re-evaluate threat model only if Jack reports plaintext readability friction. Critical Pitfall 3 surface (phishing-into-inbox).
- **Auto-linkification of URLs in user content** — same surface; v1.4+ if ever.
- **Markdown rendering of user input** — same surface; v1.4+ if ever.
- **Per-IP rate limit on chat surface** — v1.4+; KV-05 per-sessionId quota from Phase 18 is the v1.3-acceptable transcript-write-side guard.
- **Workers Paid plan upgrade to bind `CHAT_RATE_LIMITER`** — v1.4+ per Plan 17-04 DEBT-01 closure.
- **Cloudflare Workers Analytics Engine integration for transcript metrics** — v1.4+ Phase 21 per RESEARCH § SUMMARY.
- **`delivered@resend.dev` test sandbox routing** — Plan 17-06 already validated the wire against real Resend with `jackcutrara@gmail.com` as recipient (5/5 Inbox first try); v1.4+ if a sandbox-only soak ever becomes useful for non-deliverability regression testing.
- **Configurable inactivity threshold via env var** — locked at 2h per STATE.md / RESEARCH § Pitfall 2; deferred.
- **Resend suppression-list audit + Jack's address removal** — only relevant if Jack accidentally marks a Phase 20 email as Spam during UAT. Currently zero suppression-list entries (deduced from 5/5 Inbox first try at Plan 17-06).
- **`tests/api/email-resend.test.ts` against Resend's `delivered@resend.dev` live sandbox** — current Phase 20 plan uses mocked `fetch` for unit tests. Live integration testing against `delivered@resend.dev` is deferred to operational verification post-deploy (the 6-step `20-UAT.md` operator UAT covers live verification via the real production Resend account).
- **Cross-cron-tick coordination via `delivery_lock:{sid}` key with 5min TTL** — Phase 19 deferred per RESEARCH § Pitfall 4 Layer 3 "skip for v1.3"; Phase 20 inherits the deferral. Layer 1 (`delivered:` cursor) + Layer 2 (Resend Idempotency-Key) cover the cross-tick duplication case at v1.3 scale.

### Reviewed Todos (not folded)

- `.planning/todos/pending/2026-04-15-change-mobile-menu-breakpoint-from-380px-to-768px.md` — UI todo; out of v1.3 scope per STATE.md milestone-shape lock; matched at 0.9 keyword score but the area is `ui` and Phase 20 touches zero UI surface. Status unchanged from Phase 17/18/19 discussions.
- `.planning/todos/pending/2026-04-15-design-and-ship-og-default-image.md` — same as above; out of v1.3 scope; UI surface, no Phase 20 fit.
- `.planning/todos/pending/2026-04-23-chat-cache-hit-rate-observability.md` — already CLOSED by Plan 17-05 (DEBT-02); todo file is stale and should be moved to `.planning/todos/completed/` post-phase as part of operational hygiene. Not Phase 20 work.
- `.planning/todos/pending/2026-04-23-configure-chat-rate-limiter-binding.md` — already CLOSED by Plan 17-04 (DEBT-01); same as above. Workers Paid plan upgrade trigger is v1.4+.

</deferred>

---

*Phase: 20-email-render-resend-integration*
*Context gathered: 2026-05-12*
