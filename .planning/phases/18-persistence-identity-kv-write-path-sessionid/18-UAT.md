---
status: in-progress
phase: 18-persistence-identity-kv-write-path-sessionid
source: [18-01-SUMMARY.md, 18-02-SUMMARY.md, 18-03-SUMMARY.md, 18-04-SUMMARY.md, 18-05-SUMMARY.md, 18-06-SUMMARY.md, 18-07-SUMMARY.md]
started: 2026-05-11T00:00:00Z
updated: 2026-05-11T00:00:00Z
---

# Phase 18 UAT — Persistence + Identity (KV Write Path + sessionId)

**TEST-03 (Anthropic prompt cache integrity) is the cross-phase BLOCKING gate per CONTEXT.md D-15.**
Cache miss on responses 2 or 3 in Step 2 blocks phase close until root-caused via `wrangler tail`
byte-diff of the Anthropic system block between calls 1 and 2 — BEFORE any other Phase 18 work
merges to main.

KV namespace IDs (verbatim from `wrangler.jsonc:11-17`):

- Production: `eaa30fef259e4a6b9505b41bbf3f8f01`
- Preview:    `115f3c1b0f8a4a1da9fee78c48dcb749`

Preview URL pattern (per Plan 17-02 D-03 / 18-PATTERNS.md):
`https://jack-cutrara-portfolio-pr-{N}.jackcutrara.workers.dev`

Production URL: `https://jackcutrara.com/`

## Current Test

[testing in progress — preview side]

## Tests

### 1. Workers Builds preview URL discovery
expected: |
  Push the Phase 18 commits to a branch / open PR. Workers Builds spins a preview at
  `https://jack-cutrara-portfolio-pr-{N}.jackcutrara.workers.dev` (per Plan 17-02 D-03 / SUMMARY
  pattern; the Worker name `jack-cutrara-portfolio` is the `name` field in `wrangler.jsonc:3`).

  Alternative for offline / pre-push verification: `pnpm dev:worker` against the preview KV
  namespace + the `ANTHROPIC_API_KEY` secret pulled via `wrangler secret list` confirmation
  (do NOT print the secret value). Local dev hits the same preview namespace ID
  `115f3c1b0f8a4a1da9fee78c48dcb749`.

  PASS criteria:
    - Preview URL is reachable (HTTP 200 on `/`).
    - Homepage renders without DevTools console errors.
    - The chat bubble is visible bottom-right (DEBT-05 CSS-state-machine + Plan 17-08 inline
      `display: none` removal still hold post-Phase-18 wiring).
    - DevTools Network tab shows the static assets served from the Worker (not a stale Pages
      origin — Phase 17 retirement should already be complete, but verify the response
      `cf-ray` header is present and the `server` header advertises Cloudflare).
result: [pending]

### 2. D-14 / TEST-03 — 3× identical POST to /api/chat, observe chat.cache_metrics
expected: |
  D-14: Open `wrangler tail --format pretty --search chat.cache_metrics` in a separate terminal
  (the DEBT-02 server seam shipped in Plan 17-05 commit `7c3827e` emits one log line per
  Anthropic `message_delta`). Open the preview URL in a browser. Open DevTools Network tab.

  Click the chat bubble. This is the IDENT-01 / D-01 mint trigger — verify in DevTools
  Application → Local Storage → preview origin → `chat-history` that the value now has shape
  `{ version: 2, sessionId: <UUIDv4>, messages: [], lastActive: <ISO 8601> }`. Note the
  sessionId — Step 3 will read the `live:{sid}` KV key under that exact UUID.

  Send the SAME single user message "Hi" THREE times within 5 minutes via the chat bubble.
  Allow each reply to complete (stream finishes; COPY button affordance appears on the bot
  bubble) BEFORE the next send. Watch the `wrangler tail` output for THREE `chat.cache_metrics`
  log lines.

  Expected log shape per Plan 17-05 commit `7c3827e` (`src/pages/api/chat.ts` `message_start` /
  `message_delta` branch):
  ```json
  {
    "cache_read_input_tokens": <int>,
    "cache_creation_input_tokens": <int>,
    "input_tokens": <int>,
    "output_tokens": <int>
  }
  ```

  PASS criteria:
    - Call 1: `cache_read_input_tokens === 0` AND `cache_creation_input_tokens > 0`
      (cold cache write — the first request creates the cache).
    - Calls 2 + 3: `cache_read_input_tokens > 0` AND `cache_creation_input_tokens === 0`
      (cache hits — both subsequent requests read the cached system block).

  FAIL criteria: ANY response 2 or 3 with `cache_read_input_tokens === 0`. This triggers
  D-15 cache-miss-blocks-close — operator MUST root-cause via `wrangler tail` byte-diff of the
  Anthropic system block between calls 1 and 2 BEFORE any production deploy. Likely culprits:
    - A template-string in `src/pages/api/chat.ts` accidentally interpolates sessionId into
      the messages payload.
    - A new code path concatenates sessionId into the system block (Plan 18-04 / 18-07
      forward-defense should have caught this at commit time — a green static test combined
      with a failing live test means the static guard has a blind spot, and closing that
      blind spot becomes a sub-task of the same Phase-18 gap-closure plan).
    - An Anthropic SDK option silently passes a field through.

  Recovery procedure (if 5-min Anthropic cache TTL expires between sends): retry within a
  fresh 5-minute window. Anthropic's `cache_control: ephemeral` default TTL is ~5 minutes;
  quiet periods longer than that invalidate the cache and produce a legitimate cache miss
  unrelated to a code bug. Per CONTEXT.md "Pitfalls" — this is operational, not a phase blocker.
result: [pending]

### 3. KV transcript shape inspection (ROADMAP success criterion 1)
expected: |
  From Step 2 you noted the sessionId in DevTools localStorage (the `sessionId` key inside
  the `chat-history` blob). Run from a terminal authenticated to the Cloudflare control plane:

  ```sh
  wrangler kv key get \
    --namespace-id 115f3c1b0f8a4a1da9fee78c48dcb749 \
    live:{paste-sessionId-here}
  ```

  PASS criteria — the output JSON parses with the following shape (per Plan 18-02 KV-02 contract):
    - `v: 1`                                       (schema version per KV-02 / D-05)
    - `sid: "{the-sessionId-from-localStorage}"`   (matches client-minted UUIDv4 — IDENT-01)
    - `started_at` is an ISO 8601 string (first turn's arrival time)
    - `last_activity_at` is an ISO 8601 string (most recent turn's completion time)
    - `messages` is an array; length ≥ 2 (at least one `user` + one `assistant` turn from Step 2)
    - `messages.length <= 30` (KV-04 cap — drop-oldest sliding window per D-05)
    - `meta.referrer` ≤ 512 chars (META-01 truncation; verify via
      `wrangler kv key get ... live:{sid} | jq '.meta.referrer | length'`)
    - `meta.user_agent` ≤ 512 chars (same — verify via `jq '.meta.user_agent | length'`)
    - `meta.country` is `"US"` from preview URL; or `null` under `pnpm dev:worker` per
      CONTEXT.md "request.cf availability" pitfall (the local mock returns null/undefined for
      `request.cf.country`)
    - `truncated: false` (unless the UAT was a continuation of a >30-turn session — D-06
      one-way flag)
    - Per assistant turn under `messages[]`: `meta.cache_read_input_tokens` AND
      `meta.cache_creation_input_tokens` populated from the same `cacheUsage` closure object
      that Plan 17-05's `chat.cache_metrics` log line consumes (META-02 source-of-truth-once
      closure, locked by `tests/api/cache-hit-logs.test.ts`).

  Also verify the `expirationTtl` of ≈30 days is set on the KV entry:

  ```sh
  wrangler kv key list \
    --namespace-id 115f3c1b0f8a4a1da9fee78c48dcb749 \
    --prefix live: | \
    jq '.[] | select(.name == "live:{paste-sessionId-here}") | .expiration'
  ```

  Expected: a Unix epoch timestamp ~30 days from now (2,592,000 seconds + current Unix time;
  KV-03 contract — `expirationTtl: 30 * 24 * 3600` on every `put()` per
  `src/lib/chat-transcripts.ts`).
result: [pending]

### 4. KV metadata inline read for Phase 19 forward-compat (ROADMAP success criterion 2)
expected: |
  Run from the same authenticated terminal:

  ```sh
  wrangler kv key list \
    --namespace-id 115f3c1b0f8a4a1da9fee78c48dcb749 \
    --prefix live:
  ```

  Expected raw output: a JSON array of key entries; each entry has an inline `metadata` field
  (Cloudflare KV `list()` API returns metadata inline — no per-key `get()` round-trip needed,
  which is the affordance Phase 19 cron sweep depends on).

  Verify with:
  ```sh
  wrangler kv key list \
    --namespace-id 115f3c1b0f8a4a1da9fee78c48dcb749 \
    --prefix live: | \
    jq '.[] | {name, metadata}'
  ```

  PASS criteria — every returned entry has the four metadata fields populated:
    - `metadata.last_activity_at` (ISO 8601 string — KV-02 / META-01)
    - `metadata.msg_count` (integer ≥ 1 — KV-02)
    - `metadata.window_started_at` (ISO 8601 string — KV-05 per-sessionId quota window start)
    - `metadata.window_count` (integer ≥ 1 — KV-05 per-sessionId quota counter)

  Additional invariant: `metadata.window_count >= metadata.msg_count`. Each `appendTurn`
  invocation increments the KV-05 window counter (D-12); the counter never drops below
  msg_count for the session.

  This step verifies ROADMAP Phase 18 success criterion 2 (cron path can `list({prefix:'live:'})`
  and filter inactive sessions without per-key `get()` — confirmed against real Cloudflare KV).
result: [pending]

### 5. STORAGE_VERSION v2 + sessionId in localStorage (ROADMAP success criterion 3)
expected: |
  In DevTools (Application → Local Storage → preview URL origin):
  Inspect the `chat-history` key value (raw JSON string).

  PASS criteria — the value parses as JSON with shape:
  ```json
  {
    "version": 2,
    "sessionId": "<UUIDv4>",
    "messages": [
      { "role": "user", "content": "Hi" },
      { "role": "assistant", "content": "..." },
      ...
    ],
    "lastActive": "<ISO 8601 timestamp>"
  }
  ```

  Specifically:
    - `version === 2` (IDENT-01 — `STORAGE_VERSION` bumped from 1 to 2 in
      `src/scripts/chat.ts`; the existing 24h-TTL auto-clear path at chat.ts:104-106 wipes
      pre-Phase-18 v:1 blobs on first load, atomic transition)
    - `sessionId` is a valid UUIDv4 string (regex `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`)
    - `sessionId` EQUALS the sessionId used in Step 3 to read the `live:{sid}` KV entry —
      this is the IDENT-01 + IDENT-02 closure: client mint, server read, KV write all
      agree on the same UUID.
    - `messages` array has both turns from Step 2 (mirror of the server-side KV state for
      this session)
    - `lastActive` is an ISO 8601 string within the last few minutes
result: [pending]

### 6. D-04 silent-fail tolerance branch
expected: |
  Verify IDENT-02 D-04 amendment (CONTEXT.md): server tolerates a missing `sessionId` field
  on `/api/chat` request body — chat surface continues to work; no KV write fires; no
  `chat.transcript.write_failed` log emitted (because no write was attempted).

  Setup options (pick whichever is most accessible on operator's machine):
    (a) DevTools Application → Local Storage → clear the `chat-history` key entirely, then
        open the preview URL in a fresh window. (This actually exercises the mint path —
        not quite D-04, see (c).)
    (b) Open the preview URL in a private/incognito window where localStorage is ephemeral
        OR where the operator can simulate `crypto.randomUUID` being unavailable.
    (c) Most direct: in DevTools Sources panel, set a breakpoint on the `ensureSessionId()`
        call in `src/scripts/chat.ts` (Plan 18-06 bubble-click handler), step over the mint,
        and manually `delete window.chatStorage.sessionId` (or equivalent — the chat-history
        blob is updated in place before the panel opens). Then send a chat message.

  PASS criteria:
    - Chat UX continues to work — the reply streams normally (D-26 invariant; chat surface
      always wins per IDENT-02 D-04 amendment).
    - DevTools Network tab → `/api/chat` → Request payload (raw JSON) does NOT contain a
      `sessionId` key. It is ABSENT, not `null` (the server-side Zod schema is
      `z.string().uuid().optional()` — `.optional()` accepts absence; an explicit `null`
      would be rejected as `invalid_type`).
    - `wrangler tail` shows NO new `chat.transcript.write_failed` log line for the missing-sid
      branch (because no `appendTurn` was scheduled — the api/chat.ts wiring skips the two
      `ctx.waitUntil(appendTurn(...))` calls entirely when sessionId is undefined per
      `tests/build/append-turn-call-site.test.ts` D-09 guard).
    - `wrangler kv key list ... --prefix live:` does NOT show a NEW key from this interaction
      (compare against the count from Step 4 — should be unchanged).
result: [pending]

### 7. D-26 chat regression spot-check
expected: |
  Quick visual verification that existing chat behaviors hold post-Phase-18 wiring (D-26 is
  the cross-phase BLOCKING gate from Phase 17 carried into Phase 18 per CONTEXT.md
  "Phase exit gates"). The Phase 17 D-26 chat-surface regression battery is 30 tests +
  Plan 18-07 brought it to a 13-file 97/97 GREEN static surface — this step verifies the
  runtime mirrors that GREEN static state.

  Walk through on the preview URL:
    1. Click chat bubble → panel scale-in animation plays (~180ms, transform-origin
       bottom-right per design-system/MOTION.md §5; DEBT-05 CSS state machine).
    2. Send a message → bot reply streams token-by-token (D-15 SSE byte-identical contract;
       sse-snapshot.test.ts 3/3 GREEN at Plan 18-07 close).
    3. Hover over the bot reply → COPY button fades in. Click COPY → button label
       transitions to "COPIED" for 1500ms (`COPY_FEEDBACK_MS` per Plan 17-09 commit `b35ad94`)
       and the chat-copy-btn stays visible during the feedback window (`.copy-success` CSS
       rule per Plan 17-09 commit `dcf597b`), then returns to "COPY".
    4. In DevTools Rendering tab, set `prefers-reduced-motion: reduce` → panel appears
       INSTANTLY without scale animation; chat still works (Plan 17-03 DEBT-05 contract).
    5. Navigate from `/projects/` → `/about/` via internal nav (click a project link, then
       click the About header link) → DevTools console shows NO `AbortError: Transition
       was skipped` (Plan 17-10 pageswap handler in BaseLayout.astro).

  PASS criteria: all five behaviors hold; no new console errors; no new network failures.
result: [pending]

### 8. Production re-run (two-touch verification per Plan 17-02 D-03)
expected: |
  After Steps 1-7 PASS on PREVIEW, the operator promotes by `git push origin main`.
  Workers Builds auto-deploys the same commit to production at `https://jackcutrara.com/`.

  Re-run Steps 2-7 against PRODUCTION using:
    - URL: `https://jackcutrara.com/` (apex domain)
    - Prod KV namespace ID: `eaa30fef259e4a6b9505b41bbf3f8f01` for ALL `wrangler kv` commands
      (replace `115f3c1b0f8a4a1da9fee78c48dcb749` everywhere in Steps 3 + 4 + 6).
    - Same `wrangler tail --format pretty --search chat.cache_metrics` — the tail listens to
      both preview and production Workers; filter by URL when interpreting log lines (or run
      with `--name jack-cutrara-portfolio` to target the production Worker by name).

  PASS criteria: same as preview for each re-run step (cache hits on calls 2 + 3; KV transcript
  shape matches; metadata inline read returns the four fields; localStorage shape is v2 with
  sessionId; D-04 silent-fail tolerated; D-26 surface holds).

  CRITICAL: if production differs from preview, root-cause BEFORE declaring Phase 18 close
  (preview + prod share the same `ANTHROPIC_API_KEY` per Plan 17-02 SUMMARY note + Plan 17-06
  `wrangler secret list` shows 4 entries for the Worker, so prompt cache behavior should be
  equivalent — divergence indicates a binding or env-var drift somewhere). Likely culprits if
  prod differs:
    - The production Worker is reading a different KV namespace ID than expected (verify via
      `wrangler kv namespace list` and check the binding in `wrangler.jsonc:11-17`).
    - A `wrangler secret` was rotated on prod but not preview (verify via
      `wrangler secret list --name jack-cutrara-portfolio`).
    - A `request.cf` field differs between preview and production (preview URLs are routed
      through a Cloudflare colo just like production, so this is unusual — but possible if
      colocation differs).

  Two-touch pattern source: Plan 17-02 D-03 ("verify preview, then flip domain") — Phase 18
  applies the same gate to the runtime cache-integrity verification. See 17-UAT.md tests 1-3
  for the analogous preview/prod sequence at Phase 17 close.
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

retest_note: (none yet — to be populated after operator executes the steps)
