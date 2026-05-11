---
phase: 18-persistence-identity-kv-write-path-sessionid
plan: 08
type: execute
wave: 4
depends_on: [02, 03, 05, 06, 07]
files_modified:
  - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md
autonomous: false
requirements: [KV-01, KV-02, KV-03, KV-04, KV-05, IDENT-01, IDENT-02, META-01, META-02, TEST-01, TEST-03]
must_haves:
  truths:
    - "18-UAT.md exists with front-matter mirroring 17-UAT.md (status, phase, source, started, updated)"
    - "Numbered manual UAT step encoding D-14 TEST-03 (3× identical /api/chat POSTs within 5min, verify cache_read_input_tokens > 0 on responses 2 and 3 via wrangler tail)"
    - "Numbered manual UAT step encoding D-15 cache-miss-blocks-close (operator instruction to root-cause via Anthropic system-block byte-diff BEFORE merging if cache miss)"
    - "Numbered manual UAT step verifying KV transcript shape via wrangler kv key get (ROADMAP success criterion 1: v: 1, both turns, started_at/last_activity_at, ≤30 turns, referrer/UA ≤512 chars, expirationTtl: 30 days)"
    - "Numbered manual UAT step verifying KV list({prefix:'live:'}) returns inline metadata (ROADMAP success criterion 2)"
    - "Numbered manual UAT step verifying full chat-history v2 blob in localStorage (ROADMAP success criterion 3 — STORAGE_VERSION 2, sessionId present)"
    - "Two-touch verification: preview-first, production-after (Plan 17-02 D-03 pattern)"
    - "TEST-03 LIVE verification PASS = `cache_read_input_tokens > 0` on responses 2 and 3 in `wrangler tail` for `chat.cache_metrics` log lines"
  artifacts:
    - path: ".planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md"
      provides: "Manual UAT spec for Phase 18 — encodes D-14 TEST-03 + KV inspection steps + STORAGE_VERSION verification"
      contains: "chat.cache_metrics"
      min_lines: 60
  key_links:
    - from: "18-UAT.md TEST-03 step"
      to: "DEBT-02 chat.cache_metrics log seam in api/chat.ts (Plan 17-05 commit 7c3827e)"
      via: "wrangler tail --search chat.cache_metrics"
      pattern: "wrangler tail.*chat\\.cache_metrics"
    - from: "18-UAT.md KV inspection step"
      to: "Cloudflare KV namespace CHAT_KV (prod id eaa30fef259e4a6b9505b41bbf3f8f01)"
      via: "wrangler kv key get / list against the namespace ID"
      pattern: "wrangler kv key"
---

<objective>
Author `18-UAT.md` and run the manual UAT against `*.workers.dev` preview (then production). This is the LIVE counterpart to Plans 18-04 / 18-07 static forward-defense — the test surface is GREEN; this plan verifies the runtime behavior matches.

Per CONTEXT.md D-14: "Manual UAT at phase close: 3× identical /api/chat POSTs within 5min, verify chat.cache_metrics log shows cache_read_input_tokens > 0 on responses 2 and 3. Performed against *.workers.dev preview FIRST, then re-run against production AFTER deploy."

Per CONTEXT.md D-15: "Cache miss = blocks phase close. If the 3× UAT shows cache_read_input_tokens === 0 on responses 2 or 3, sessionId is leaking into the cached surface somewhere. Root-cause via wrangler tail byte-diff of the Anthropic system block between calls 1 and 2 BEFORE any other Phase 18 work merges to main."

Per ROADMAP Phase 18 success criteria 1-5: this UAT verifies all five at the LIVE level. Static tests (Plans 18-02/03/04/06/07) cover the shape; this UAT confirms the shape lands at the bytes-on-the-wire level against real Cloudflare KV + real Anthropic.

Why human-action checkpoint: the 3× identical POST UAT requires wrangler tail + a real chat-bubble interaction OR a real curl session, AND visual confirmation of `cache_read_input_tokens > 0` on responses 2 and 3. No CLI/API can verify the Anthropic regional cache state on Jack's behalf. The KV inspection via `wrangler kv key get` is also a manual step the operator runs at their terminal because the Worker doesn't have a "list my transcript" endpoint by design (per ROADMAP "Out of Scope: Admin UI / dashboard / list view of transcripts").

Output: 18-UAT.md authored with numbered manual steps + operator runs each step against preview, records `result: pass/issue`, re-runs against production, marks status=complete.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-RESEARCH.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-VALIDATION.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-05-SUMMARY.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-06-SUMMARY.md
@.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-07-SUMMARY.md
@.planning/phases/17-foundations-migration-dns-debt-sweep/17-UAT.md
</context>

<interfaces>
<!-- 18-UAT.md exact front-matter shape (verbatim style from 17-UAT.md, adapted for Phase 18) -->

  ---
  status: in-progress
  phase: 18-persistence-identity-kv-write-path-sessionid
  source: [18-01-SUMMARY.md, 18-02-SUMMARY.md, 18-03-SUMMARY.md, 18-04-SUMMARY.md, 18-05-SUMMARY.md, 18-06-SUMMARY.md, 18-07-SUMMARY.md]
  started: 2026-MM-DDTHH:MM:SSZ
  updated: 2026-MM-DDTHH:MM:SSZ
  ---

<!-- Required UAT steps Plan 18-08 authors -->

  Step 1: Workers Builds preview URL discovery
    - Push the Phase 18 commits to a branch / open PR; Workers Builds spins a preview at
      `https://jack-cutrara-portfolio-pr-{N}.jackcutrara.workers.dev` (per Plan 17-02 SUMMARY pattern).
    - OR (if running locally) `pnpm dev:worker` against the preview KV namespace + ANTHROPIC_API_KEY env.

  Step 2: D-14 — 3× identical POST to /api/chat against preview, observe chat.cache_metrics log
    - Open `wrangler tail --format pretty --search chat.cache_metrics` in a terminal.
    - In a browser, open the preview URL. Open DevTools Network tab.
    - Click chat bubble (this mints sessionId per Plan 18-06).
    - Send "Hi" three times within 5 minutes. Allow each reply to complete before the next send.
    - Observe wrangler tail output: three chat.cache_metrics log lines. Expected:
        Call 1: cache_read_input_tokens === 0 AND cache_creation_input_tokens > 0  (first write — cold cache)
        Calls 2 + 3: cache_read_input_tokens > 0 AND cache_creation_input_tokens === 0  (cache hits)
    - PASS criteria: calls 2 + 3 both have cache_read_input_tokens > 0.
    - FAIL criteria: ANY call 2 or call 3 shows cache_read_input_tokens === 0. This triggers D-15
      cache-miss-blocks-close — root-cause via wrangler tail byte-diff of the Anthropic system block
      between calls 1 and 2 BEFORE any production deploy.

  Step 3: KV transcript inspection via wrangler kv key get (ROADMAP success criterion 1)
    - From step 2's interaction, note the sessionId logged or read from chat-history localStorage.
    - Run: `wrangler kv key get --namespace-id 115f3c1b0f8a4a1da9fee78c48dcb749 live:{sid}`
      (115f3c1b0f8a4a1da9fee78c48dcb749 = preview namespace ID per wrangler.jsonc).
    - PASS criteria:
        - JSON value parses with `v: 1`
        - `messages[]` contains both visitor and assistant turns from the UAT
        - `started_at` + `last_activity_at` are ISO 8601 strings
        - `messages.length` ≤ 30
        - `meta.referrer` and `meta.user_agent` each ≤ 512 chars (use `jq '.meta.referrer | length'`)
        - `expirationTtl` of 30 days verifiable via `wrangler kv key list --namespace-id ... --prefix live: | jq '.[] | .expiration'` (epoch seconds; expect ~30 days from now)

  Step 4: KV metadata inspection (ROADMAP success criterion 2)
    - Run: `wrangler kv key list --namespace-id 115f3c1b0f8a4a1da9fee78c48dcb749 --prefix live:`
    - PASS criteria: each returned key has inline `metadata.last_activity_at` (ISO 8601) AND `metadata.msg_count` (integer ≥ 1).

  Step 5: STORAGE_VERSION v2 blob in localStorage (ROADMAP success criterion 3)
    - In the browser DevTools (Application tab → Local Storage → preview URL origin):
      - Inspect the `chat-history` key. Expect: `{ version: 2, sessionId: <UUIDv4>, messages: [...], lastActive: <ISO> }`.

  Step 6: D-04 silent-fail check (optional but recommended)
    - In DevTools, set localStorage manually to a corrupted/missing-sessionId blob (or use private browsing).
    - Click chat bubble + send a message.
    - Expected: chat works normally (reply streams). Wrangler tail shows NO `chat.transcript.write_failed`
      log (because no write was attempted). The POST body in Network tab does NOT contain a sessionId key.
    - PASS criteria: chat surface continues to work; no new KV entry created.

  Step 7: D-26 chat regression spot-check
    - In the preview URL, verify chat panel scale-in animation, COPY button feedback, reduced-motion behavior,
      cross-document navigation (no AbortError) — quick visual confirmation that existing chat behaviors hold.

  Step 8: Re-run Steps 2–7 against PRODUCTION after deploy (two-touch verification per Plan 17-02 D-03)
    - After all preview-side steps PASS, operator promotes via `git push origin main` (Workers Builds auto-deploys).
    - Use prod namespace ID `eaa30fef259e4a6b9505b41bbf3f8f01` for wrangler kv key get/list commands.
    - Repeat steps 2–6 against https://jackcutrara.com/.
    - PASS criteria: same as preview.
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Author 18-UAT.md with all 8 numbered manual steps (no execution yet)</name>
  <files>.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md</files>
  <read_first>
    - .planning/phases/17-foundations-migration-dns-debt-sweep/17-UAT.md (verbatim front-matter + test-entry shape — Plan 17-02 + 17-07/08/09/10 UAT precedent)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-CONTEXT.md (D-14 + D-15 + critical constraint #2 TEST-03 cross-phase gate)
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-PATTERNS.md (§ 18-UAT.md — front-matter pattern lines 477-486; Test entry shape lines 489-495; wrangler tail command + preview URL pattern lines 498-516)
    - .planning/ROADMAP.md Phase 18 entry — the 5 success criteria the UAT exercises
    - wrangler.jsonc (kv_namespaces section — prod + preview IDs for the wrangler kv commands)
  </read_first>
  <action>
Create `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md`.

Use this exact structure (front-matter mirrors 17-UAT.md; status starts as `in-progress`; both prod and preview KV namespace IDs hard-coded from wrangler.jsonc):

```
---
status: in-progress
phase: 18-persistence-identity-kv-write-path-sessionid
source: [18-01-SUMMARY.md, 18-02-SUMMARY.md, 18-03-SUMMARY.md, 18-04-SUMMARY.md, 18-05-SUMMARY.md, 18-06-SUMMARY.md, 18-07-SUMMARY.md]
started: YYYY-MM-DDTHH:MM:SSZ
updated: YYYY-MM-DDTHH:MM:SSZ
---

# Phase 18 UAT — Persistence + Identity (KV Write Path + sessionId)

**TEST-03 (Anthropic prompt cache integrity) is the cross-phase BLOCKING gate per CONTEXT.md D-15.**
Cache miss on responses 2 or 3 in Step 2 blocks phase close until root-caused.

KV namespace IDs (from wrangler.jsonc):
- Production: `eaa30fef259e4a6b9505b41bbf3f8f01`
- Preview:    `115f3c1b0f8a4a1da9fee78c48dcb749`

## Current Test

[testing in progress — preview side]

## Tests

### 1. Workers Builds preview URL discovery
expected: |
  Push Phase 18 branch / open PR → Workers Builds spins preview at
  `https://jack-cutrara-portfolio-pr-{N}.jackcutrara.workers.dev` (per Plan 17-02 D-03 / SUMMARY pattern).
  Confirm the preview URL is reachable, homepage loads, no console errors.
result: [pending]

### 2. D-14 / TEST-03 — 3× identical POST to /api/chat, observe chat.cache_metrics
expected: |
  D-14: Open `wrangler tail --format pretty --search chat.cache_metrics` in a separate terminal.
  Open preview URL in a browser. Open DevTools Network tab. Click chat bubble (mints sessionId
  per Plan 18-06 — verify in DevTools Application → Local Storage → preview origin → chat-history
  has `{ version: 2, sessionId: <UUIDv4>, ... }`).

  Send the SAME single user message "Hi" 3 times within 5 minutes via the chat bubble. Allow each
  reply to complete before the next send. Watch `wrangler tail` for three `chat.cache_metrics` log
  lines.

  Expected shape per Plan 17-05 commit 7c3827e:
    `{"cache_read_input_tokens":<int>,"cache_creation_input_tokens":<int>,"input_tokens":<int>,"output_tokens":<int>}`

  PASS criteria:
    - Call 1: `cache_read_input_tokens === 0` AND `cache_creation_input_tokens > 0` (cold cache write)
    - Calls 2 + 3: `cache_read_input_tokens > 0` AND `cache_creation_input_tokens === 0` (cache hits)

  FAIL criteria: ANY response 2 or 3 with `cache_read_input_tokens === 0`. This triggers D-15
  cache-miss-blocks-close — root-cause via `wrangler tail` byte-diff of the Anthropic system block
  between calls 1 and 2 BEFORE any production deploy. If 5 minutes have elapsed between sends,
  retry within a fresh 5-minute window (Anthropic's default TTL is 5 minutes — recent quiet periods
  invalidate the cache).
result: [pending]

### 3. KV transcript shape inspection (ROADMAP success criterion 1)
expected: |
  Note the sessionId logged in Step 2 (read from DevTools localStorage `chat-history.sessionId`).
  Run: `wrangler kv key get --namespace-id 115f3c1b0f8a4a1da9fee78c48dcb749 live:{sid}`

  PASS criteria — output JSON parses with:
    - `v: 1`                                       (schema version per KV-02)
    - `sid: "{the-sessionId-from-localStorage}"`   (matches client-minted UUIDv4)
    - `started_at` + `last_activity_at` as ISO 8601 strings
    - `messages` array of length ≥ 2 (at least one user + one assistant turn from Step 2)
    - `messages.length ≤ 30`                       (KV-04 cap)
    - `meta.referrer` and `meta.user_agent` each ≤ 512 chars
      (verify via: `wrangler kv key get ... live:{sid} | jq '.meta.referrer | length'`)
    - `meta.country` is "US" (or null in `pnpm dev` per Pitfall 4)
    - `truncated: false` (unless the UAT was a continuation of a >30-turn session)

  Also verify expirationTtl ≈ 30 days from now:
    `wrangler kv key list --namespace-id 115f3c1b0f8a4a1da9fee78c48dcb749 --prefix live: | jq '.[] | select(.name == "live:{sid}") | .expiration'`
    Expected: a Unix epoch ~30 days from now (2592000 seconds + current time).
result: [pending]

### 4. KV metadata inline read for Phase 19 forward-compat (ROADMAP success criterion 2)
expected: |
  Run: `wrangler kv key list --namespace-id 115f3c1b0f8a4a1da9fee78c48dcb749 --prefix live:`
  Expected output: each key has inline `metadata.last_activity_at` (ISO 8601) AND `metadata.msg_count`
  (integer ≥ 1) AND `metadata.window_started_at` AND `metadata.window_count` (KV-05 state).

  Verify with: `wrangler kv key list ... --prefix live: | jq '.[] | {name, metadata}'`
  PASS: every returned entry has all four metadata fields populated; window_count ≥ msg_count (each
  appendTurn invocation increments the window counter).
result: [pending]

### 5. STORAGE_VERSION v2 + sessionId in localStorage (ROADMAP success criterion 3)
expected: |
  In DevTools Application → Local Storage → preview URL origin:
  Inspect the `chat-history` key value (JSON).
  PASS: `{ version: 2, sessionId: <UUIDv4>, messages: [...], lastActive: <ISO 8601> }`. The
  sessionId here MUST equal the sessionId you used in Step 3 to read the live:{sid} key.
result: [pending]

### 6. D-04 silent-fail tolerance branch
expected: |
  In DevTools, set localStorage manually to simulate the D-04 missing-tolerance branch. Options:
    (a) Clear chat-history entirely and use a fresh incognito window WITH Web Crypto blocked at
        the browser (rare — most browsers don't allow this without extension help).
    (b) Easier: open private/incognito where localStorage may be ephemeral, send a chat message,
        and verify the request body in DevTools Network tab.

  PASS criteria:
    - Chat UX continues to work — reply streams normally.
    - Network tab → /api/chat → Request payload → JSON does NOT contain a `sessionId` key (it's
      ABSENT, not null).
    - `wrangler tail` shows NO `chat.transcript.write_failed` log line (no write was attempted).
    - `wrangler kv key list ... --prefix live:` does NOT show a new key from this interaction.
result: [pending]

### 7. D-26 chat regression spot-check
expected: |
  Quick visual verification that existing chat behaviors hold post-Phase-18 wiring (D-26 BLOCKING
  gate at runtime):
    - Click chat bubble → panel scale-in animation plays (~180ms, transform-origin bottom-right)
    - Send a message → bot reply streams token-by-token
    - Hover/click COPY button on bot reply → button transitions to COPIED for ~1500ms
    - In DevTools rendering tab, set `prefers-reduced-motion: reduce` → panel appears instantly
      without scale animation, chat still works
    - Navigate from /projects/ → /about/ via internal nav → DevTools console shows NO AbortError
  PASS: all five behaviors hold.
result: [pending]

### 8. Production re-run (two-touch verification per Plan 17-02 D-03)
expected: |
  After steps 1–7 PASS on preview, operator promotes by `git push origin main`. Workers Builds
  auto-deploys to production at https://jackcutrara.com/. Re-run steps 2–7 against production:
    - Use prod KV namespace ID `eaa30fef259e4a6b9505b41bbf3f8f01` for wrangler kv commands.
    - Use https://jackcutrara.com/ for the browser interactions.

  PASS criteria: same as preview. If production differs from preview, root-cause before declaring
  phase close (preview + prod share the same Anthropic API key per Plan 17-02 SUMMARY note, so
  cache behavior should be equivalent).
result: [pending]
```

DO NOT execute any UAT step in Task 1 — Task 1 is authoring-only. The status frontmatter starts as `in-progress`; Task 2 (executor + operator) runs each step and fills in `result:`.

After authoring, run `node -e "..."` to validate the file structure is intact (front-matter present, all 8 tests present with `expected:` and `result: [pending]` placeholders).
  </action>
  <verify>
    <automated>node -e "const fs = require('fs'); const f = fs.readFileSync('.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md', 'utf8'); const checks = [/^---[\s\S]*status:\s*in-progress[\s\S]*phase:\s*18-persistence-identity-kv-write-path-sessionid[\s\S]*---/m.test(f), /TEST-03/.test(f), /chat\.cache_metrics/.test(f), /cache_read_input_tokens/.test(f), /wrangler tail/.test(f), /wrangler kv key get/.test(f), /wrangler kv key list/.test(f), /STORAGE_VERSION|version:\s*2/.test(f), /D-04/.test(f), /D-15/.test(f), /D-14/.test(f), /eaa30fef259e4a6b9505b41bbf3f8f01/.test(f), /115f3c1b0f8a4a1da9fee78c48dcb749/.test(f), (f.match(/### \d/g) || []).length >= 8, (f.match(/result: \[pending\]/g) || []).length >= 8]; const failed = checks.findIndex(c => !c); if (failed >= 0) { console.error('UAT structure check ' + failed + ' failed'); process.exit(1); } process.exit(0);"</automated>
  </verify>
  <done>18-UAT.md exists with front-matter mirroring 17-UAT.md, all 8 numbered tests (Workers Builds preview URL discovery, D-14/TEST-03 3× identical POST, KV transcript inspection, KV metadata inspection, STORAGE_VERSION v2 localStorage check, D-04 silent-fail, D-26 chat regression spot-check, production re-run), each with `expected:` block + `result: [pending]` placeholder. Both KV namespace IDs hard-coded. D-14 + D-15 + D-04 + D-26 + TEST-03 + STORAGE_VERSION all referenced.</done>
</task>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 2: OPERATOR runs the manual UAT against preview, then production</name>
  <files>.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md</files>
  <read_first>
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md (Task 1 output — operator follows the 8 numbered steps verbatim)
    - .planning/phases/17-foundations-migration-dns-debt-sweep/17-UAT.md (operator pattern precedent — result formatting + retest narrative shape)
  </read_first>
  <action>
This task is BLOCKING and OPERATOR-EXECUTED. The executor (Claude) presents the 8 numbered steps in 18-UAT.md to the operator and pauses. No CLI/API can run these steps on the operator's behalf: visual confirmation of cache_read_input_tokens > 0 in wrangler tail output requires a human terminal session; sessionId verification requires a browser DevTools inspection; the wrangler kv key get / list commands require operator-authenticated Cloudflare control-plane access.

OPERATOR INSTRUCTIONS:
1. Open 18-UAT.md.
2. Run each numbered step (1-7 against preview, then 2-7 against production) in the listed order.
3. After each step, update its result field with one of:
   - pass — if all PASS criteria met
   - issue (YYYY-MM-DD) — <one-line description> if any criterion missed (do NOT continue to next step until root-caused + fix landed)
4. If Step 2 fails (cache miss on response 2 or 3), STOP — root-cause via wrangler tail byte-diff of the Anthropic system block between calls 1 and 2 BEFORE merging to main. Cache miss means sessionId is leaking somewhere a static test didn't catch.
5. When ALL preview steps pass, push to production (git push origin main) — Workers Builds auto-deploys.
6. Re-run steps 2-7 against https://jackcutrara.com/ using the prod KV namespace ID eaa30fef259e4a6b9505b41bbf3f8f01.
7. Set 18-UAT.md front-matter status: complete and update the updated: timestamp when Step 8 passes.
8. Resume the execute-plan flow with the resume-signal phrase.
  </action>
  <what-built>
    Plan 18-07 closed with 459+ tests GREEN, astro check 0/0/0, sse-snapshot 3/3 GREEN, anthropic-payload-shape 8/8 GREEN, D-26 chat-surface focused 13-file battery GREEN. 18-UAT.md authored with 8 manual steps.

    Phase 18 has shipped (in test source): KV write path (chat-transcripts.ts), validation extension (sessionId on envelope), api/chat.ts wiring (two ctx.waitUntil(appendTurn(...)) call sites), client mint (STORAGE_VERSION 2 + ensureSessionId + streamChat body), forward-defense source-text tests, and META-02 source-of-truth-once test.

    What the UAT verifies: every static gate the test suite asserts is consistent with the LIVE runtime against Cloudflare KV + Anthropic + the real browser. The 3× identical POST step (D-14 / TEST-03) is the only verification of Anthropic prompt cache integrity that the test suite CANNOT fully simulate (RESEARCH § "Don't Hand-Roll" — automated vitest live test against real Anthropic deferred to v1.4+).

    Operator (Jack Cutrara) executes the steps and records pass/issue per step.
  </what-built>
  <how-to-verify>
    Follow each numbered step in `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md` in order. After completing each step on PREVIEW, update its `result:` field with one of:
      - `pass` if all PASS criteria met
      - `issue (YYYY-MM-DD) — <one-line description>` if any criterion missed (do NOT continue to next step until issue is root-caused and fix landed)

    Per Step 2 D-14/D-15: if `cache_read_input_tokens === 0` on responses 2 or 3, STOP — root-cause via `wrangler tail` byte-diff of the Anthropic system block between calls 1 and 2 BEFORE any other Phase 18 work merges to main. The cache miss means sessionId is leaking into the cached surface somewhere (a runtime regression that Plan 18-04 static forward-defense didn't catch). Likely culprits:
      - A template-string in api/chat.ts that accidentally interpolates sessionId into the messages payload
      - A new code path that concatenates sessionId into the system block
      - An Anthropic SDK option that the SDK is now passing through unexpectedly

    Once all 8 PREVIEW steps pass, push to production (`git push origin main`) — Workers Builds auto-deploys. Then re-run steps 2–7 against https://jackcutrara.com/ using the prod KV namespace ID `eaa30fef259e4a6b9505b41bbf3f8f01`. Mark Step 8 `result:` with the production-side outcome.

    Finally, in `18-UAT.md`:
      - Set front-matter `status: complete`
      - Set front-matter `updated: <ISO 8601 timestamp>` to the moment Step 8 passed
  </how-to-verify>
  <verify>
    <automated>node -e "const fs = require('fs'); const f = fs.readFileSync('.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md', 'utf8'); if (!/status:\s*complete/.test(f)) { console.error('18-UAT.md status is not complete'); process.exit(1); } process.exit(0);"</automated>
  </verify>
  <done>18-UAT.md has front-matter status: complete AND all 8 numbered tests show result: pass on preview side AND result: pass (or retest_pass narrative) on production side (Step 8). TEST-03 D-14 verification confirmed cache_read_input_tokens > 0 on responses 2 + 3 in wrangler tail for chat.cache_metrics log lines on BOTH preview AND production.</done>
  <resume-signal>Type "approved — Phase 18 UAT complete" once 18-UAT.md status is set to `complete` and ALL 8 steps show `result: pass` (on both preview and production where applicable). If any step shows `issue`, describe the issue + root-cause + fix + re-test outcome.</resume-signal>
</task>

<task type="auto">
  <name>Task 3: Plan-end gate — final D-26 chat regression battery + astro check + commit 18-UAT.md as status=complete</name>
  <files>.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md</files>
  <read_first>
    - .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md (operator-updated state after Task 2)
    - .planning/phases/17-foundations-migration-dns-debt-sweep/17-UAT.md (status=complete + retest line precedent)
  </read_first>
  <action>
After operator clears Task 2's resume signal, verify 18-UAT.md is fully completed and run the final phase-close gates:

1. Confirm 18-UAT.md has `status: complete` in front-matter AND every `### N.` test entry has `result: pass` (or a documented issue+fix narrative followed by a `retest_pass:` line).

2. Run the FINAL Phase 18 closing-gate commands:
   - `pnpm test` — full suite ≥ 459 PASS / 0 FAIL / 2 SKIP (Plan 18-07 close baseline; Plan 18-08 adds no new tests).
   - `pnpm exec astro check` — 0/0/0.
   - `pnpm exec vitest run tests/api/sse-snapshot.test.ts` — 3/3 GREEN (D-15 anchor preserved end-to-end).
   - `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` — 8/8 GREEN (TEST-03 static).
   - `pnpm exec vitest run tests/build/append-turn-call-site.test.ts` — ≥5 GREEN (Plan 18-07 forward-defense).
   - `pnpm exec vitest run tests/api/chat-transcripts.test.ts` — 16 GREEN.

3. Verify Phase 18 commit history is clean: `git log --oneline --since="2026-05-11" -- .planning/phases/18-persistence-identity-kv-write-path-sessionid src/lib/chat-transcripts.ts src/scripts/chat.ts src/pages/api/chat.ts src/lib/validation.ts tests/api/chat-transcripts.test.ts tests/api/chat-session-id.test.ts tests/api/anthropic-payload-shape.test.ts tests/client/chat-sessionid-mint.test.ts tests/build/append-turn-call-site.test.ts tests/api/cache-hit-logs.test.ts .planning/REQUIREMENTS.md` — confirm each plan's commit shape is present.

4. If 18-UAT.md was modified by the operator during Task 2, commit it: `gsd-sdk query commit "docs(18-08): UAT complete — TEST-03 verified on preview + production" --files .planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md`.

If ANY of the gates 1-3 fail, do NOT close the phase. Investigate; either revert offending commits or open a Phase 18 gap-closure plan (e.g., 18-09-PLAN.md targeting the specific defect).
  </action>
  <verify>
    <automated>pnpm test 2>&1 | tail -3 && pnpm exec astro check 2>&1 | tail -3 && pnpm exec vitest run tests/api/sse-snapshot.test.ts tests/api/anthropic-payload-shape.test.ts tests/build/append-turn-call-site.test.ts tests/api/chat-transcripts.test.ts 2>&1 | tail -3 && node -e "const fs = require('fs'); const f = fs.readFileSync('.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md', 'utf8'); const checks = [/^---[\s\S]*status:\s*complete/m.test(f), (f.match(/result:\s*pass/g) || []).length >= 6 || /retest_pass/.test(f)]; const failed = checks.findIndex(c => !c); if (failed >= 0) { console.error('UAT closure check ' + failed + ' failed'); process.exit(1); } process.exit(0);"</automated>
  </verify>
  <done>18-UAT.md has `status: complete` + ≥6 `result: pass` entries (or `retest_pass:` lines for issue-and-fix narratives). `pnpm test` ≥ 459 PASS / 0 FAIL / 2 SKIP. `pnpm exec astro check` 0/0/0. sse-snapshot 3/3 + anthropic-payload-shape 8/8 + append-turn-call-site ≥5 + chat-transcripts 16 all GREEN. Phase 18 ready for `/gsd-verify-work` close.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| operator → Cloudflare control plane | wrangler kv key get/list + wrangler tail are operator-authenticated against the live KV namespace + Worker logs. Same trust boundary as Phase 17 17-UAT.md steps (RESEND_API_KEY warmup, postmaster enrollment). No new attack surface introduced. |
| operator browser → preview/production URL | Standard HTTPS; no novel security surface. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-18-08-01 | Information Disclosure | sessionId visible in DevTools localStorage on preview URL during operator verification | accept | The operator is Jack — he's reading his own sessionId. No third-party observes the data. Preview URLs are gated by Workers Builds auth (per Plan 17-02 D-03); production URLs have no auth (intentional — chat is public). Per V14. |
| T-18-08-02 | Repudiation | Operator marks step `pass` without actually verifying cache_read_input_tokens > 0 | mitigate | D-15 in REQUIREMENTS.md is the contractual gate; subsequent operator-visible signal (production Anthropic spend doubling overnight; p50 first-token latency rising 200ms+; visitor-perceived chat quality declining) would surface a false-positive after the fact. The UAT step's explicit "FAIL criteria: ANY response 2 or 3 with cache_read_input_tokens === 0" + the resume-signal narrative requirement ("describe the issue + root-cause + fix + re-test outcome") together create a deliberate paper trail. Per V7. |
| T-18-08-03 | Tampering | sessionId leak into Anthropic system block discovered during UAT (cache miss on call 2/3) | mitigate | Plan 18-04 static forward-defense (anthropic-payload-shape.test.ts D-16 byte-equality + source-text guard) should have caught this AT commit time. If the static gate is GREEN but the UAT shows cache miss, the leak is in a path the static test doesn't cover (e.g., a runtime side-effect mutating the system block AFTER buildChatRequestArgs returns). Root-cause via `wrangler tail` byte-diff per D-15 anchor; Plan 18-08 issues become Phase 18 gap-closure plans 18-09+. Per V13. |
| T-18-08-04 | Denial of Service | Manual UAT step 2 fails due to 5-min Anthropic cache TTL expiring between sends | accept | UAT step explicitly documents the 5-min window; operator retries within a fresh window. Not a phase-blocking issue — re-run the step. Per operational verification. |

ASVS L1 mapping for this plan: V7 yes (operational verification surface + audit trail in 18-UAT.md), V13 yes (LIVE verification of the /api/chat surface), V14 partial (KV namespace ID operator-confirmed against the binding declared in wrangler.jsonc).
</threat_model>

<verification>
**Plan-end checks (all must pass):**

1. `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-UAT.md` exists with `status: complete` in front-matter, all 8 numbered tests with `result: pass` (or retest_pass narrative for issue+fix).
2. `pnpm test` — full suite ≥ 459 PASS / 0 FAIL / 2 SKIP.
3. `pnpm exec astro check` — 0/0/0.
4. `pnpm exec vitest run tests/api/sse-snapshot.test.ts` — 3/3 GREEN (D-15 anchor preserved end-to-end across Phase 18).
5. `pnpm exec vitest run tests/api/anthropic-payload-shape.test.ts` — 8/8 GREEN (TEST-03 static; D-16 extension still holding).
6. `pnpm exec vitest run tests/build/append-turn-call-site.test.ts` — ≥5 GREEN (Plan 18-07 forward-defense).
7. `pnpm exec vitest run tests/api/chat-transcripts.test.ts` — 16 GREEN (Plan 18-02 pure module).
8. **TEST-03 LIVE verification confirmed**: 18-UAT.md Step 2 result is `pass` on BOTH preview AND production sides.
</verification>

<success_criteria>
- 18-UAT.md committed with `status: complete`, all 8 tests `result: pass` (or `retest_pass` for resolved issues).
- TEST-03 D-14 verification: `cache_read_input_tokens > 0` confirmed on responses 2 and 3 in `wrangler tail` for `chat.cache_metrics` log lines — on preview FIRST, then production.
- KV transcript shape verified live (`v: 1`, both turns, started_at, last_activity_at, ≤30 turns, referrer/UA ≤512 chars, expirationTtl ~30 days).
- KV metadata inline read verified (`last_activity_at`, `msg_count`, `window_started_at`, `window_count`).
- localStorage `chat-history` confirmed `{ version: 2, sessionId: <UUIDv4>, messages, lastActive }`.
- D-04 silent-fail tolerance verified at runtime (private browsing / cleared localStorage → POST body omits sessionId; chat works).
- D-26 chat regression spot-check passes at runtime (panel animation, COPY button, reduced-motion, cross-doc nav).
- Production re-run mirrors preview side.
- `pnpm test` ≥ 459 PASS / 0 FAIL / 2 SKIP; `pnpm exec astro check` 0/0/0; sse-snapshot 3/3; anthropic-payload-shape 8/8; append-turn-call-site ≥5; chat-transcripts 16 — Phase 18 closing test surface clean.
</success_criteria>

<output>
After completion, create `.planning/phases/18-persistence-identity-kv-write-path-sessionid/18-08-SUMMARY.md` recording:
- 18-UAT.md final state (status: complete; each step result)
- TEST-03 cache_read_input_tokens values observed on calls 1/2/3 on preview AND production (the four-number observations)
- The actual `live:{sid}` key value retrieved from preview KV (sample value or summary)
- Production deploy timestamp (when `git push origin main` triggered Workers Builds deploy)
- Final test count: `pnpm test` exact PASS/FAIL/SKIP at phase close
- `astro check` 0/0/0 status at phase close
- Any issues encountered during UAT + how they were resolved (or punted to Phase 18 gap-closure plan 18-09+ if a runtime defect surfaced)
- Anchor for `/gsd-verify-work`: all 5 ROADMAP Phase 18 success criteria are operationally verified
- Phase 18 ready for STATE.md update + ROADMAP checkbox close + RETROSPECTIVE.md authoring
</output>
