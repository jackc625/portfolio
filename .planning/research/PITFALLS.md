# Pitfalls Research — v1.3 Chat Visibility

**Domain:** Adding KV-backed transcript persistence + Resend transactional email + Cloudflare Cron Trigger to an existing Cloudflare Workers SSE chat endpoint that already ships with Phase 7 security posture and a 117/117 D-26 regression battery
**Researched:** 2026-05-09
**Confidence:** HIGH for the platform-specific Cloudflare/Resend/Anthropic mechanics (verified against Context7 + official docs); HIGH for D-26 / Phase 7 invariants (verified against `src/pages/api/chat.ts`, `src/scripts/chat.ts`, `src/lib/validation.ts`, and v1.2-MILESTONE-AUDIT.md line 172); MEDIUM for Gmail spam-classification thresholds at low send volumes (Postmaster Tools is most reliable signal; thresholds documented are bulk-sender-tier).

> This file enumerates pitfalls **specific to bolting transcript logging + email delivery onto the v1.2 chat surface**. Generic web-dev / generic email warnings are omitted. Every pitfall names the WHAT / WHY / HOW TO PREVENT / WHEN TO ADDRESS / HOW TO TEST quartet so phase planning can pick them up directly. Pitfalls latent in current code (chat.ts, api/chat.ts) are flagged **EXISTING SURFACE** — they exist now and v1.3 additions could trip them.

> **Critical platform constraint surfaced during research:** Cloudflare Pages (current deployment target) **does NOT support Cron Triggers**. This is not optional knowledge — the roadmap must address it in Phase 1 (architecture decision). See [Critical Pitfall 0](#critical-pitfall-0-cloudflare-pages-does-not-support-cron-triggers).

---

## Critical Pitfalls

### Critical Pitfall 0: Cloudflare Pages does NOT support Cron Triggers

**What goes wrong:**
The site currently deploys as Cloudflare Pages (`jackcutrara.com` — static assets + per-route SSR via Pages Functions for `/api/chat`). Pages Functions explicitly does NOT support Cron Triggers — only Cloudflare Workers does. A naive plan that adds `[triggers] crons = ["0 * * * *"]` to `wrangler.toml` will silently never fire on Pages, OR (more likely with `@astrojs/cloudflare`) wrangler will reject the config at deploy with no production-side cron registered. Two months go by, no email ever arrives, KV grows unboundedly, and the missing-data symptom only surfaces when Jack notices he's never received a transcript.

**Why it happens:**
The Cloudflare-Pages-vs-Workers distinction is invisible in most "Cloudflare + cron + KV" tutorials online (most assume a Worker). Astro's `@astrojs/cloudflare` adapter has historically targeted Pages by default. The PROJECT.md and STATE.md both say "Cloudflare Pages (static pages) + Cloudflare Workers (SSR API route)" — but `/api/chat` runs as a Pages Function, not a standalone Worker. Cron is a Workers-only feature.

**How to prevent:**
- Phase 1 (architecture): Pick ONE of these three paths and document the choice in PROJECT.md Key Decisions:
  1. **Migrate the entire site to Workers Static Assets** (Cloudflare's recommended forward path as of 2026; full feature parity with Pages plus cron + Durable Objects). Update `astro.config.mjs` adapter to `@astrojs/cloudflare` with Workers mode, add `wrangler.jsonc` with `[assets]` + `[triggers] crons = [...]`. Largest blast radius; cleanest long-term posture.
  2. **Keep Pages, add a separate sweeper Worker** (a second Cloudflare Worker, deployed independently, that owns the cron trigger and shares the same KV namespace via binding). Smallest blast radius to existing chat endpoint; introduces a second deploy target and a second `wrangler.jsonc`.
  3. **Don't use Cloudflare cron at all** — use an external scheduler (GitHub Actions cron, Cloudflare Workflows, an `@hourly` self-poke via a third-party uptime service). Operationally fragile, adds a non-Cloudflare moving piece.
- Phase 1 should output a Decision Record citing the official compatibility matrix: Workers fully supports Cron Triggers; Pages does not.
- Whichever path is chosen, **the cron handler must reach the same KV namespace as the SSE endpoint** — verify this with a binding-name table (e.g., `CHAT_TRANSCRIPTS` bound on both producers and consumers).
- Wire a `wrangler dev --test-scheduled` command into `package.json` so cron is exercised in local dev.

**Warning signs:**
- `wrangler deploy` log says "no cron triggers configured" or omits cron section silently
- No invocation appears under Workers → Cron → Past Events in Cloudflare dashboard 60+ minutes after deploy
- `wrangler.toml`/`wrangler.jsonc` lives in a Pages project (`pages_build_output_dir` present)
- `astro.config.mjs` uses `output: 'hybrid'` with default Pages adapter and a `[triggers]` block in the same file

**When to address:**
**Phase 1 — Architecture/Foundations**, before any other v1.3 work. This is foundational; every other phase assumes a working schedule mechanism.

**How to test:**
- After deploy, set the cron to `* * * * *` temporarily and confirm Past Events shows ≥1 successful invocation within 90 seconds
- `wrangler tail --format pretty` (production) — invoke the cron manually via dashboard "Trigger" button; assert `console.log("scheduled invoked")` appears
- E2E: write a fake KV entry with `last_activity_at` 3hr in the past, wait one cron tick, assert Resend got hit (use Resend dashboard "Emails" log + idempotency key match)

**Sources:** [Cloudflare migration matrix — Workers vs Pages](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/) (HIGH); [Cloudflare Cron Triggers reference](https://developers.cloudflare.com/workers/configuration/cron-triggers/) (HIGH).

---

### Critical Pitfall 1: KV write inside the SSE stream blocks/aborts when the ReadableStream ends

**What goes wrong:**
Naïve approach: `await env.CHAT_TRANSCRIPTS.put(key, JSON.stringify(transcript))` inside `controller.close()` or right before it. Two things break:
1. The KV write blocks the stream-close handshake. The browser's `ReadableStream` reader sees the `[DONE]` SSE frame slightly later than today, and on slow KV writes (P99 can be 200-800ms during edge cold starts) the chat UI feels sluggish on the **last token** — the most-noticed UX moment.
2. If the browser closes the EventSource (user closed the tab, navigated away, hit Esc) **before** the KV write finishes, the I/O context tied to the request unwinds and the in-flight `put()` Promise never resolves. The Worker runtime treats the orphaned promise as an error and the transcript is **silently dropped**. This is the documented "The script will never generate a response" / detached-promise failure mode.

**Why it happens:**
Cloudflare Workers ties async work to either the request's I/O context (which dies when the response is consumed) or `ctx.waitUntil()` (which extends up to 30 seconds past response end). Devs forget the second category exists when the bulk of their handler is `async/await` syntactic-sugar inside the `start(controller)` callback of a `ReadableStream`. The SSE pattern compounds this because there's no obvious "after response" hook — `controller.close()` looks like the end of life for the request.

**How to prevent:**
- **Two-write strategy** with `ctx.waitUntil()`:
  - **Write 1 (fire-and-forget, synchronous-ish):** Append the latest USER message to KV at the top of the POST handler, **before** the SSE stream begins. This is the durability anchor — even if Anthropic dies mid-stream the user message is still captured. Use `ctx.waitUntil(env.CHAT_TRANSCRIPTS.put(...))` so it doesn't block streaming. The Astro endpoint's `APIRoute` context exposes `ctx` via `locals.runtime.ctx` (Astro Cloudflare adapter) — verify this binding name in the chosen adapter mode at Phase 1.
  - **Write 2 (after-response):** After `controller.close()`, schedule the assembled-final-assistant-message KV write via `ctx.waitUntil(updateTranscript(...))`. This survives the response close.
- **Never `await` the KV put inline in the stream** — accumulate the assistant tokens in a local string, then schedule the write via `ctx.waitUntil` once the stream is done.
- Treat the KV write as **best-effort** — wrap in try/catch and log failures to `console.error` (Cloudflare logs surface in `wrangler tail` and the dashboard). Do not let a KV failure cause an SSE error frame to ship — the user's reply already streamed; the logging miss should be invisible.

**Warning signs:**
- Last-token latency rises measurably in `chat.duration_ms` analytics (Phase 15 instrumentation surface still alive)
- D-26 SSE timing assertions start flaking (especially the test that asserts `[DONE]` arrives within N ms of the final delta)
- `wrangler tail` shows `Error: The script will never generate a response.` after deploys
- KV `put` count in Cloudflare analytics is < unique conversation count (writes are dropping silently)

**When to address:**
**Phase 2 — KV write path** (the SSE-integration phase). Goal-backward TDD: write the failing D-26 timing test first (assistant-message persisted within 30s of last_token; `[DONE]` arrives ≤50ms after final text_delta).

**How to test:**
- D-26 extension: add a regression test that mocks Anthropic SSE, asserts `[DONE]` enqueued **before** any KV `put` resolves
- E2E: open chat, send message, immediately close tab during typing indicator → assert the user message landed in KV (read via `wrangler kv:key get`)
- Latency budget: P95 stream-close-to-first-byte ≤ unchanged-from-v1.2 baseline (no measurable regression)

**Sources:** [Cloudflare ScheduledHandler / waitUntil docs](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) (HIGH — explicit 30s ceiling); [Cloudflare Streams runtime](https://developers.cloudflare.com/workers/runtime-apis/streams/) (HIGH); [SSE detached-promise error case](https://github.com/cloudflare/workers-sdk/issues/7767) (MEDIUM).

---

### Critical Pitfall 2: KV is eventually consistent — cron reads can miss messages written within the last ~60s

**What goes wrong:**
The cron handler runs `env.CHAT_TRANSCRIPTS.list({prefix: "session:"})`, then `get()` each, then checks `last_activity_at`. KV's documented behavior: **writes are immediately visible at the same edge POP, but propagate globally up to 60 seconds**. The cron worker may run in `IAD` while the user's last message landed in `LHR`. Three failure modes:
1. **List returns a stale key set.** A new session that was created 90s ago might not appear yet in the list at the cron's POP. Net effect: a transcript that "should be sent" gets skipped this hour and waits another hour.
2. **`get()` returns a stale value.** Even after `list()` returns the key, the value `get()` reads might be from before the most recent message. The cron sees an "inactive" session that's actually still receiving messages, and emails a partial transcript while the user is mid-conversation.
3. **`put()` from cron racing with `put()` from SSE.** If the cron writes a "sent" sentinel while the user is sending a new message, last-write-wins clobbers one or the other (KV is not atomic — concurrent writes to the same key overwrite).

**Why it happens:**
KV's model is "global low-latency reads, eventually consistent writes" — perfect for cached configuration, dangerous for "tell me everything that's been written." The 2-hour inactivity threshold was chosen partially to absorb this, but the cron reading a stale view across the 2hr boundary is a real interleaving.

**How to prevent:**
- **Set the inactivity threshold conservatively wider than the consistency window.** 2 hours >> 60 seconds — this is already correct. **Do not lower it below 5 minutes.** Document this in CONFIG/decision record.
- **Read-then-CAS-via-flag-key pattern instead of mutating the transcript:**
  - Transcript key: `session:<sessionId>` (append-only; cron only reads it)
  - Sent-marker key: `sent:<sessionId>` (cron writes a sentinel here after Resend success)
  - On cron iteration: skip sessions where `sent:<sessionId>` exists. The marker is the idempotency cursor.
- **Never have the cron mutate the transcript itself.** Transcripts are append-only from the SSE side.
- **Use metadata (kept on the key itself) for `last_activity_at`** so the cron's `list({prefix: "session:"})` returns metadata without a second `get()` per key — this halves the read amplification AND avoids one consistency hop.
- **Tolerate a "sent twice" recovery path** (see Pitfall 4) instead of trying to make KV atomic.

**Warning signs:**
- An email arrives with N messages, then 30 minutes later a *second* email arrives with N+2 (cron saw stale data)
- KV "writes per second" metric spikes from cron firing (cron mutating transcripts)
- Transcripts in KV show `last_activity_at` going backwards across reads

**When to address:**
**Phase 3 — Cron + sweep logic.** TDD pattern: write tests against a `MockKV` that simulates 60s read-after-write delay; assert the sweeper handles stale reads without duplicate emails.

**How to test:**
- Unit test sweeper with a fake KV whose `get()` returns the value from "30 seconds ago" — assert sweeper still emits exactly one email per session
- Integration: with `wrangler dev --remote`, fire two concurrent SSE writes to the same sessionId, then trigger cron — assert the email contains both messages OR has been deferred (NOT a clobbered transcript)
- Inject a clock skew test: `last_activity_at = now() + 5min` (clock drift) — sweeper must not crash; ideally treats future timestamps as "still active"

**Sources:** [Cloudflare KV concurrent writes consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/) (HIGH); [Cloudflare KV FAQ on consistency](https://developers.cloudflare.com/kv/reference/faq/) (HIGH); [KV list pagination / cursor](https://developers.cloudflare.com/kv/api/list-keys/) (HIGH).

---

### Critical Pitfall 3: HTML-render of user-typed content lets a visitor inject HTML/CSS/links into Jack's inbox

**What goes wrong:**
The transcript body contains user-typed text. If the email is composed with template-string interpolation (` `<p>${msg.content}</p>` `) and sent as `html`, a visitor can:
- **Click-jack the entire email into a phishing page** by injecting `<a href="https://evil.example/login">click to view full transcript</a>` — Jack opens the email expecting a portfolio chat, clicks the link, lands on a credential harvester
- **Render rogue images** (`<img src="https://attacker.example/track.gif">`) that make Jack's inbox a beacon and expose his Gmail open-time/IP
- **Insert hidden `<style>` blocks** that overlay legitimate content with attacker-controlled UI in Gmail's preview
- **Use markdown renderers naïvely** — if you reuse `marked` + `DOMPurify` from `chat.ts` (which renders untrusted bot output) for the email body, it'll allowlist `<a>` tags, defeating the goal of "no auto-link" and "no markdown rendering of user input"
- **Mojibake / unicode bidirectional override (RLO)** to make a malicious URL look like a benign one (`https://safe.com/[U+202E]moc.live/...`)

**Why it happens:**
Email is the original "executable HTML attached to a plaintext envelope" environment. Devs reach for "let's reuse the chat.ts renderer" because the chat already has a hardened markdown pipeline — but that renderer is designed to render *trusted* assistant output (post-DOMPurify allowlist for `<a>`, `<strong>`, `<code>`, etc.), not *adversarial user-typed input*. The trust direction is inverted.

**How to prevent:**
- **Send `text/plain`, NOT `html`, for v1.3.** Resend supports a `text` field. Plaintext is unambiguously safe; Gmail renders it without HTML interpretation; line-breaks are preserved with `\n`. Until there's a UX reason to render HTML, this is the smallest-surface choice.
- **If HTML is added later (v1.4+), use a separate render pipeline:**
  - HTML-encode every character of every user message via `escapeHtml(s)` (replaces `& < > " ' /`). Do **not** use `DOMPurify` — that allowlists tags. The intent here is encode, not sanitize.
  - Wrap each turn in pre-rendered structure: `<p><strong>User:</strong> ${escapeHtml(msg.content)}</p>` — never interpolate into attribute context, never inside `<style>`, never inside `<script>`.
  - **No URL auto-linkification.** Do not run a regex over user content to wrap URLs in `<a>` — even legitimate-looking URLs become attack surface (homograph domains, IDN attacks).
  - Strip Unicode bidirectional override characters (`U+202A..U+202E`, `U+2066..U+2069`) before encode. They survive HTML-encoding and reverse adjacent text in the rendered email.
- **Subject line carries the same risk** — apply the same encode/strip there. Resend uses subject as-is; injection into the subject can break threading or impersonate from-line in some clients.
- **Do not echo the user's first message into the email's preheader / preview-text.** Spam classifiers train on preheader content; let the visitor weaponize it once and Jack's reputation tanks (see Pitfall 7).

**Warning signs:**
- Code review finds `${msg.content}` directly inside an `html:` field
- A `marked.parse()` call appears in the email-render path
- Unit tests for `renderEmailBody` don't include payloads like `<script>`, `</p><script>`, `<img onerror=...>`, RTL-override characters, `\u202E`, `https://evil.example`
- Resend dashboard shows the email rendered with clickable links you didn't intend

**When to address:**
**Phase 4 — Email render** (or Phase 3 if email and cron are combined). Also a **milestone-level invariant** — must be re-verified at the end-of-milestone gate.

**How to test:**
- Unit suite for `renderEmailBody` with adversarial payloads: `<script>alert(1)</script>`, `</p><img src=x onerror=alert(1)>`, `javascript:alert(1)`, `data:text/html,...`, Unicode bidi, ` ` null bytes, 4096-byte messages, emoji + ZWJ sequences
- Manual UAT: send self a transcript containing each adversarial payload as a chat message — assert Gmail renders it as literal text (no link, no image fetch, no script)
- Add a CI test: send to `delivered@resend.dev` (Resend's test sandbox) and snapshot the resulting MIME output — diff against golden file

**Sources:** [Twilio: protecting users against email HTML injection](https://www.twilio.com/en-us/blog/developers/tutorials/building-blocks/dont-get-pwned-via-email-html-injection) (MEDIUM); [OWASP XSS](https://owasp.org/www-community/attacks/xss/) (HIGH); [HackTricks: HTML injection in plaintext emails (encoded-tag bypass)](https://github.com/eladnava/mailgen/security/advisories/GHSA-xw6r-chmh-vpmj) (MEDIUM).

---

### Critical Pitfall 4: Cron + KV idempotency — "send once" is impossible without a sentinel

**What goes wrong:**
Cron fires hourly. The handler `list()`s sessions, finds 12 inactive ones, fires 12 Resend calls. One call gets a transient `500` from Resend. The handler keeps a try/catch and `console.error`s, then continues. **Next hour the same 12 sessions reappear** (because nothing marked them sent), and 11 of them get re-sent. Jack receives the same transcript twice (or 12 times across a week if Resend is having a bad day).

A subtler failure: cron handler crashes mid-loop (CPU limit, unhandled exception). The half-processed batch has some "sent + emailed" without a "sent" marker recorded. Next hour replays them.

**Why it happens:**
Cron handlers run "at-least-once" semantics on Cloudflare (Past Events table records "fail" with retry on the *first* `ctx.waitUntil` failure — but this isn't fine-grained). Resend itself supports an `idempotencyKey` that prevents Resend from sending twice — but only within a 24-hour window, and only if the same key is supplied. KV writes-after-Resend-success are a separate operation that can drop. There's no transaction that atomically wraps "Resend send + KV mark-sent".

**How to prevent:**
- **Two-key pattern (the same one from Pitfall 2 is also the idempotency cursor):**
  - `session:<sessionId>` — transcript (read by cron)
  - `sent:<sessionId>` — sentinel key written **after** Resend's `200 OK`. Sentinel value: `{messageId: <resend.id>, sentAt: <ISO>}`.
- **Order of operations (this order is load-bearing):**
  1. Cron reads `session:<id>`. Skip if `sent:<id>` exists.
  2. Compute `idempotencyKey = "transcript/" + sessionId` (Resend max 256 chars; format `<event-type>/<entity-id>` matches Resend's prescribed pattern).
  3. Call `resend.emails.send({...payload, idempotencyKey})`. If error → log and break out of this session's iteration (do NOT write the sentinel).
  4. On 200 → `await env.CHAT_TRANSCRIPTS.put("sent:" + id, JSON.stringify({...}), {expirationTtl: 60 * 60 * 24 * 30})` (30 day expiry; long enough that any retry within Resend's 24h idempotency window is a no-op).
- **Why both layers:** Resend's idempotency key gives you safety **inside Resend's 24h window** (a duplicate API call returns the original response without resending). The KV sentinel gives you safety **outside that window** (cron skips on subsequent hours). Together they eliminate both the "Resend retry storm" and the "next-hour replay".
- **Never delete the transcript after sending.** A deleted transcript is unrecoverable; a transcript with a sentinel is intentionally retained for audit. Set a 30-day `expirationTtl` on `session:<id>` if Jack wants automatic cleanup; cron itself should never `delete()`.
- **Per-session error handling, not per-batch:** wrap each session's send in its own try/catch so one failure doesn't kill the whole sweep. Use `ctx.waitUntil(processSession(id))` per session for fan-out.
- **Bound the sweep batch.** `list()` defaults to 1000 keys; expected scale is far below this, but if cron is ever skipped for days the queue could grow. Hard-cap to 50 sessions/run; anything beyond pages to next hour.

**Warning signs:**
- Same `idempotencyKey` appearing twice in Resend dashboard "Sent" log within a 24h window with `idempotency_replay: true`
- Same transcript reaching Jack's inbox more than once
- KV "writes" count from cron handler is wildly higher than session count (re-write storms)
- Resend shows `409 Conflict` errors — means same idempotency key with different payload (a sign payload is non-deterministic; check timestamp formatting and message order)

**When to address:**
**Phase 3 — Cron sweep + sentinel logic.** Idempotency tests must be in the Wave-0 RED stub set per the project's TDD pattern.

**How to test:**
- Run the sweeper twice in immediate succession against the same KV state → assert exactly one Resend call total (Resend's mock returns `idempotency_replay: true` for the second)
- Inject a Resend `500` on the first send → assert sentinel NOT written → re-run sweeper → assert second send happens, sentinel written
- Crash test: throw in the middle of the loop after 3 of 5 sessions → re-run → assert remaining 2 send, original 3 don't re-send (sentinels exist)

**Sources:** [Resend idempotency keys](https://resend.com/docs/ai-onboarding) (HIGH — explicit format and 24h window); [Resend error retry strategy](https://resend.com/docs/api-reference/errors) (HIGH); [Cloudflare scheduled retry semantics](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) (HIGH).

---

### Critical Pitfall 5: D-26 chat regression battery 117/117 must hold — KV writes can break Phase 7 invariants invisibly

**What goes wrong:**
v1.2 closed with D-26 117/117 GREEN. The Phase 7 invariants (per v1.2-MILESTONE-AUDIT line 172) are: **XSS / CORS / rate-limit / 30s timeout / focus-trap / persistence / SSE / markdown / clipboard**. v1.3 changes touch the SSE / persistence / rate-limit surfaces. Specific regressions:
- **30s client timeout** (`AbortController` in `chat.ts`) — if KV writes lengthen the response close, the existing client timeout fires before `[DONE]` and the user sees an error mid-conversation. v1.2's 30s budget is *whole conversation*, not just Anthropic time.
- **Rate limit semantics** — adding KV per-request adds a CPU/wall-time cost that can push warm requests above the per-IP rate limit threshold differently than v1.2 (more requests rejected on the same input rate). Worse: v1.2 ships with `CHAT_RATE_LIMITER` binding **NOT configured in production** (carry-forward debt). v1.3 must NOT regress that "defensively skip when binding absent" code path.
- **CORS** — if the cron handler is a separate Worker that reads/writes the same KV, the CORS check on `/api/chat` must remain unchanged. Don't loosen for "internal" callers.
- **localStorage persistence** — v1.2 already persists last 50 messages locally for 24h with version+TTL invalidation. v1.3 KV persistence must not duplicate state ownership. Specifically: client must NOT read from KV; server must NOT echo localStorage state.
- **SSE byte-shape (D-15)** — v1.2 promised "server byte-identical phase-wide". A new SSE frame type (e.g., `{persistence: "saved"}`) added to inform the client of KV write success would break D-15. **Don't add new SSE frame types in v1.3.**
- **XSS / DOMPurify config** — chat.ts allowlists `<a>`, hooks `target=_blank` / `rel=noopener noreferrer`. If v1.3 adds a "view full transcript" link served from the email or anywhere else linkable, DON'T loosen the allowlist.
- **Markdown** — `marked` is configured `{breaks: true, gfm: true, async: false}`. Don't let v1.3 introduce a markdown render in email path that causes someone to "fix" the chat.ts config to match.
- **Clipboard** — v1.2 added a copy-button parity fix. Don't regress that.
- **Focus-trap** — chat panel focus-trap must continue to work; KV state has no UI surface in v1.3 (silent logging) so this should be unaffected, but verify.

**Why it happens:**
D-26 is a 117-test regression suite, not a single check. It's easy for a phase to fix the failing tests they expected (e.g., new KV-write tests pass) and not run the full battery before merge. The persistence and SSE invariants are particularly easy to drift on because they're shape-of-output rather than presence-of-feature.

**How to prevent:**
- **Treat D-26 117/117 as a milestone-level cross-phase gate.** Run the full battery at the end of every phase that touches `BaseLayout.astro`, `global.css`, `src/scripts/chat.ts`, `src/pages/api/chat.ts`, `src/lib/validation.ts` (per CLAUDE.md constraint). Phase 7 architecture preserved is non-negotiable per PROJECT.md `Constraints`.
- **Wave-0 RED stubs** — every v1.3 phase that touches these files writes failing D-26 extension tests **before** any implementation. Pattern carried over from v1.2 (4/5 phases NYQUIST-COMPLIANT).
- **D-15 amendment if SSE frame shape must change**: must be pre-approved at milestone gate, not slipped in mid-phase.
- **Diff `chat.ts` and `api/chat.ts` against v1.2 tip at every phase end.** Any change should be additive (new branch, new helper) or a behavior-equivalent refactor — never a config tweak in DOMPurify, marked, AbortController, or rate-limiter.

**Warning signs:**
- Any line of `marked.use(...)` or `PURIFY_CONFIG = {...}` modified
- AbortController timeout constant changed from 30000
- New SSE event types in the `data:` JSON payload (today: `{text}`, `{truncated: true}`, `{error: true}`, `[DONE]` — anything else is new)
- `validation.ts` schemas modified to accept new request shapes for "logging" (any new field is suspect — sessionId is the only new one allowed)
- Tests in the D-26 suite are skipped/edited rather than extended

**When to address:**
**Cross-phase gate.** Re-run at end of every phase. Final milestone-audit must explicitly state "D-26 ≥ 117/117 GREEN" with the same line item phrasing as v1.2 audit line 172.

**How to test:**
- Run the existing D-26 suite as-is at every phase boundary
- Add D-26 extensions in Wave-0 of each phase, never lock-step retroactively
- Diff-check: `git diff main..HEAD -- src/pages/api/chat.ts src/scripts/chat.ts src/lib/validation.ts` should show ONLY additive blocks, no edits to existing logic

**Sources:** Internal — `.planning/milestones/v1.2-MILESTONE-AUDIT.md` line 172; `src/pages/api/chat.ts`; `src/scripts/chat.ts`; `CLAUDE.md` Conventions section.

---

### Critical Pitfall 6: Anthropic prompt cache invalidation from sessionId being part of the cached system block

**What goes wrong:**
v1.2 Phase 14 wired `cache_control: ephemeral` on the system block (built from `portfolio-context.json`). That's now a sunk-cost optimization the chat depends on. If v1.3 naively threads `sessionId` (or any per-request value) into the system block — e.g., adds a "Session ID: abc123" line "for debugging" — every request becomes a cache miss because the hash changes per session. Anthropic charges full input rate, latency rises 200-500ms per request, and the v1.2 win evaporates.

A subtler form: v1.3 adds a "current time" or "request metadata" block "to help the model contextualize" — same problem. The cache key is the byte-for-byte content of everything up to and including the `cache_control` boundary; **anything per-request inside that boundary kills the cache**.

**Why it happens:**
sessionId is a useful feature for the *transcript* path (KV key, idempotency, session correlation) but tempting to also pass to Claude "for context". Adding "for debugging only" data to the system block is a common mistake. The 5-minute TTL (Anthropic's March 6 2026 silent default change from 1h → 5min) makes the cache more fragile than v1.2's design assumed — if cache breaks even once an hour, hit rate collapses.

**How to prevent:**
- **sessionId stays on the request envelope (HTTP body), NOT in the Anthropic message payload.** Validate it in `validation.ts` (extend Zod schema) but do NOT pipe it into `buildChatRequestArgs`.
- **Document the cache boundary in code:** add a comment in `src/prompts/chat-request-shape.ts` (or wherever the system block is assembled) stating "everything above `cache_control` is hash-keyed; per-request data goes BELOW or in metadata".
- **Verify cache-hit-rate observability is wired** — this is **already tech debt** from v1.2 Phase 14 (deferred). v1.3 is the milestone where it lives. Without observability you can't detect a regression. Anthropic returns `cache_read_input_tokens` and `cache_creation_input_tokens` in the response; log both. If `cache_read_input_tokens` falls to 0 across a deploy, you broke the cache.
- **Be aware of the 5-minute default TTL.** With low traffic (this site), back-to-back conversations are likely > 5 minutes apart. A "cold conversation" will always be a cache miss — that's expected, not a regression. Don't read absolute hit rate; read deploy-to-deploy delta.

**Warning signs:**
- `cache_read_input_tokens: 0` for every request post-deploy when it was non-zero pre-deploy
- Anthropic spend doubles overnight
- p50 first-token latency rises 200ms+

**When to address:**
**Phase 2** (KV write path) — the moment sessionId is introduced into the request shape. Also the `build:chat-context:check` CI work (carry-forward debt) belongs here so cache-source drift can't ship.

**How to test:**
- Unit: snapshot test the `messages.create` arg shape — assert sessionId is NOT inside `system` or `messages[0]`
- Live integration: hit `/api/chat` 3x with same payload within 5 minutes; assert response 2 and 3 show `cache_read_input_tokens > 0` (use `wrangler tail`)
- Pre-merge gate: if cache_read drops below 50% of input tokens for repeated requests, fail CI

**Sources:** [Anthropic prompt caching docs](https://docs.claude.com/en/docs/build-with-claude/prompt-caching) (HIGH); [Anthropic cache TTL silent regression March 2026](https://github.com/anthropics/claude-code/issues/46829) (MEDIUM — third-party reporting, but Anthropic-confirmed); STATE.md (Open Blockers — chat cache-hit-rate observability not yet wired).

---

### Critical Pitfall 7: Gmail spam classification when sending self-mail from a brand-new From-domain

**What goes wrong:**
Resend requires a verified sending domain. Naïve flow: add `mail.jackcutrara.com` (or `noreply@jackcutrara.com`) as the From, click verify, send first email. **Gmail aggressively spam-filters mail from low-reputation domains** — and a domain that's never sent email before *is* low-reputation. Symptoms: first 5-50 emails go to Spam, Jack misses transcripts for days, "logging works in tests" is a false positive (Resend says "delivered" — that's SMTP-delivered, not inbox-delivered).

Compounding issues:
- **2024+ Gmail bulk-sender rules** require SPF + DKIM + DMARC even for low-volume senders if the From domain is "high-traffic". jackcutrara.com is low-volume so the bulk-sender rules don't *technically* apply, but the classifier still scores DMARC-failing mail aggressively. **DMARC at `p=none` is the minimum new bar.**
- **Domain alignment** — Resend's `from: 'noreply@jackcutrara.com'` must be aligned with either the SPF or DKIM authentication path. If verification was done for `mail.jackcutrara.com` but `from:` says `noreply@jackcutrara.com`, alignment breaks.
- **List-Unsubscribe header + RFC 8058 one-click** — does NOT apply to transactional self-mail per Gmail's own carve-out (transactional emails like password resets, receipts are exempt). But Gmail's spam classifier doesn't know this email is "self-mail" — it sees a To: that matches the receiver. Self-addressed mail has its own heuristics.
- **PTR record / reverse DNS** — Gmail requires forward-and-reverse DNS validity for the sending IP. Resend handles this *for their own IPs*; if Cloudflare-Workers-direct-SMTP were ever used (don't), this would fail.
- **Suppression list** — if Jack ever marks one of these as Spam (testing, accident), Resend silently adds him to the suppression list and future sends to him are dropped at Resend's edge (returns success but never delivers).

**Why it happens:**
Email deliverability is a black-art niche disconnected from web-dev knowledge. The default mental model is "API returns 200 = email arrived" — the actual model is "API returns 200 = handed off to Resend → handed off to Google → spam folder OR trash OR inbox depending on a reputation engine you have no API for".

**How to prevent:**
- **Phase 1 — pre-roadmap chore:** add the Resend domain (`jackcutrara.com` or a subdomain) and configure all four DNS records: SPF (TXT), DKIM (TXT), MX (return-path / bounce capture), and **DMARC (`v=DMARC1; p=none; rua=mailto:...`)**. Verify all four show "verified" in Resend dashboard before any code is written.
- **Pick the From-address carefully.** `chat@jackcutrara.com` reads more legitimate to Gmail than `noreply@`. Avoid subdomains like `mail.jackcutrara.com` for the From while DKIM is on the apex — alignment trap.
- **Warm the domain.** Send 5-10 manually-triggered transcripts to Jack's Gmail over a few days **before** going live. Mark each as "Not Spam" if it lands in spam. This builds reputation.
- **Configure Google Postmaster Tools** for `jackcutrara.com` — gives you the only authoritative spam-rate signal Gmail will share. Add it before launch; check it at the milestone gate.
- **Use Reply-To: jackcutrara@gmail.com** so if Jack ever clicks Reply to test, the reply goes to himself, not into a black hole at noreply@. Some classifiers downgrade no-reply addresses.
- **Subject line that's predictable.** Something like `[Portfolio chat] <session preview>` — consistent prefix lets Jack create a Gmail filter that bypasses spam classification entirely (use a `+chat` filter or a label rule).
- **Don't include the visitor's IP, full UA string, or country in the email body** if it's HTML — these strings overlap with phishing-template heuristics. Move them to a structured plain-text footer if needed.
- **Test with `delivered@resend.dev`** during dev (Resend's verified test address; never hits real inbox; perfect for D-26-style E2E).

**Warning signs:**
- First 10 emails land in Spam folder consistently
- Resend dashboard shows `delivered` for emails Jack didn't actually receive (in inbox)
- Postmaster Tools spam rate > 0.1% (any non-zero is a yellow flag at Jack's volume)
- DMARC report shows `dkim=fail` or `spf=fail` lines
- Resend `bounced` events appear (suppression list grew)

**When to address:**
**Phase 1 — Foundations** (DNS + domain verification must be live before email-sending code is written). **End-of-milestone gate:** Postmaster Tools enrolled, spam rate verified < 0.1%, no entries in Resend suppression list.

**How to test:**
- DNS check via `dig TXT jackcutrara.com` and `dig TXT _dmarc.jackcutrara.com`
- Send 5 test emails over 3 days → 5/5 land in Inbox, 0/5 in Spam (verify by hand)
- Resend webhook listener on `email.delivered` and `email.bounced` (Cloudflare Worker route) — log to confirm delivery
- After 7 days of production traffic, check Postmaster Tools for spam rate and reputation

**Sources:** [Google Email sender guidelines](https://support.google.com/a/answer/81126?hl=en) (HIGH); [Gmail bulk sender FAQ](https://support.google.com/a/answer/14229414?hl=en) (HIGH); [Gmail enforcement Nov 2025 ramp-up](https://redsift.com/resources/blog/gmails-enforcement-ramps-up-what-bulk-senders-need-to-know) (MEDIUM); [Resend domain verification docs](https://resend.com/docs/dashboard/domains/tracking) (HIGH).

---

### Critical Pitfall 8: Prompt-injection content echoing back through the email path

**What goes wrong:**
v1.2 Phase 14 added prompt-injection hardening on the chat path (the assistant's output is hardened against ignoring system instructions). v1.3 introduces a NEW path where adversarial input flows: into the email. A visitor who knows Jack reads every transcript can craft a message intended for **Jack's email client**, not the bot:
- "Jack, ignore previous chat — I've been trying to reach you about your car's extended warranty. Click here to reschedule: https://evil.example"
- "URGENT: this is Jack's recruiter contact. Reply to this address: phish@evil.example"
- Subject-line abuse if the subject is derived from user content: spoofs From-line in some Gmail mobile previews
- Encoded-tag bypass per the [Mailgen advisory](https://github.com/eladnava/mailgen/security/advisories/GHSA-xw6r-chmh-vpmj) — HTML-encoded entities re-decoded in Gmail's rendering pipeline

The chat already has a degree of injection hardening (assistant output goes through DOMPurify; users see safe markdown). But the **email body is rendered by Gmail's HTML renderer with very different rules** — DOMPurify doesn't run, the system prompt's hardening doesn't apply, and Jack's threat model when reading a transcript is "this is a real conversation" (low suspicion) rather than "this could be a phish" (high suspicion).

**Why it happens:**
Threat-model drift across surface. Phase 14's threat model was "user tries to break the bot's persona". Phase 1.3's threat model is "user tries to break Jack's inbox via the bot's transcript pipeline". Different attacker, different target, different mitigations.

**How to prevent:**
- **Strong sender chrome.** Email body always opens with `From: chat widget on jackcutrara.com — visitor message follows below this line.` — primes Jack to treat content as adversarial.
- **Visual distinction between turns.** If HTML is used, render user turns and bot turns with visibly different formatting (the bot turns are trusted, user turns are quoted-block + monospace + grey). If plaintext, prefix every line: `>>> visitor:` vs `<<< bot:`.
- **No subject derivation from user content.** Subject is fixed: `[Portfolio chat] session abc123 — N messages`. Or derived from server-controlled metadata only (timestamp, count). Never `subject = userMsg.slice(0, 80)`.
- **No auto-link / no auto-image fetch** (Pitfall 3 prevention applies).
- **Reply-to is always `jackcutrara@gmail.com`** — even if a visitor injects a "reply to phish@evil.example" line, the email-client Reply button goes to Jack himself.
- **Explicit warning footer:** `Links and email addresses inside the chat above were typed by a website visitor. Do not click or reply.`

**Warning signs:**
- Code review shows `subject: ${firstUserMessage}` or similar
- Tests for the email body don't include "social engineering" payloads ("Hi Jack, this is your bank...")
- Email body has no provenance header / chrome distinguishing visitor from bot

**When to address:**
**Phase 4 — Email render** (same phase as Pitfall 3). Document the threat model in a phase-level decision record.

**How to test:**
- Unit: render email with a payload `"Hi Jack, urgent — call me at +1-555-555-5555 about your application"` — assert phone number is not auto-linked, the visitor-attribution chrome wraps the body
- Manual: Jack reads a synthetic adversarial transcript and self-reports "could I be tricked by this?" — answer must be no

**Sources:** [HackTricks — email injection patterns](https://book.hacktricks.xyz/pentesting-web/email-injections) (MEDIUM); [Mailgen plaintext bypass advisory](https://github.com/eladnava/mailgen/security/advisories/GHSA-xw6r-chmh-vpmj) (MEDIUM).

---

## Moderate Pitfalls

### Moderate Pitfall A: KV per-key value size cap (25 MiB) is irrelevant — but per-key cost is not

**What goes wrong:**
A single chat session could in theory grow forever if a visitor keeps the panel open (50-msg cap is *client-side localStorage*, not server-side). On the server, transcripts are accumulated across requests. If session keys grow past 1 MiB they incur extra read amplification (each cron iteration re-reads the entire value).

**Why / How to prevent:**
- The 25 MiB ceiling is a non-issue at this scale (a 50-msg transcript is ~50 KiB max). Don't over-engineer.
- DO cap at a sensible bound (e.g., 100 messages or 256 KiB serialized) and truncate the oldest with a `[transcript truncated]` marker. Mirrors v1.2's `MAX_MESSAGES = 50` localStorage cap on the server side.
- DO use `expirationTtl` on session keys — 30 days is generous and keeps the namespace bounded.

**When to address:** Phase 2 (write path).
**How to test:** Push 200 messages to a single sessionId; assert KV value size stays bounded.

**Sources:** [Cloudflare KV limits](https://developers.cloudflare.com/kv/platform/limits/) (HIGH).

---

### Moderate Pitfall B: KV `list()` 1000-key default + cursor pagination — cron must paginate even at low volume

**What goes wrong:**
Cron handler calls `list({prefix: "session:"})` and processes the result. Default limit is 1000. Today with low traffic this works; in 6 months if traffic 10x's or KV cleanup falls behind, the 1001st session is invisible to every cron run forever (cron always sees the same first 1000).

**Why / How to prevent:**
- Always paginate: while `!list_complete`, re-call with `cursor`. Standard pattern.
- Hard-cap iterations to prevent runaway (e.g., max 50 pages = 50,000 keys) — beyond that, log an alert and bail rather than burning the entire CPU budget.
- See also Pitfall C (CPU budget).

**When to address:** Phase 3 (cron).
**How to test:** Seed KV with 1500 fake sessions; assert all 1500 are processed in one cron tick.

**Sources:** [Cloudflare KV list keys](https://developers.cloudflare.com/kv/api/list-keys/) (HIGH).

---

### Moderate Pitfall C: Cron handler CPU/wall-time limits silently truncate the sweep

**What goes wrong:**
Cloudflare Workers default CPU time is 30 seconds (paid plans can extend to 5 minutes). The scheduled handler can run async work past response close via `ctx.waitUntil`, but `waitUntil` itself caps at 30 seconds **after** the response closes. If sweep + Resend calls + KV writes exceed this, the latter half of the batch silently drops; the failed `waitUntil` is recorded as a "failure" in Past Events, but mid-batch sessions remain unsent. Resend is rate-limited to 2 req/s by default (5 RPS for paid teams), which means 50 transcripts could need 25-30 seconds in serial sends alone — close to the budget.

**Why / How to prevent:**
- **Bound the per-tick batch size** (recommend: 10-20 sessions per cron run). With hourly cron, that's 240-480 sessions/day capacity — far above expected scale.
- **Don't use `Promise.all()` to fan-out all sends** — that exceeds Resend's RPS and triggers 429 storms. Use a controlled-concurrency loop (e.g., 2 parallel sends, sleep 500ms between batches).
- **Move CPU-heavy work (HTML escape, body composition) outside the loop** if possible.
- **Wrap each session in its own `ctx.waitUntil`** so each is its own clock — limits one slow session from stalling the rest.

**When to address:** Phase 3.
**How to test:** Synthetic load test with 100 fake sessions; assert sweep completes in ≤ 25 seconds; assert no 429s from Resend.

**Sources:** [Cloudflare Workers CPU limits](https://developers.cloudflare.com/workers/platform/limits/) (HIGH); [Resend rate limit](https://resend.com/docs/api-reference/introduction) (HIGH); [Cloudflare scheduled handler waitUntil 30s ceiling](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) (HIGH).

---

### Moderate Pitfall D: sessionId is a privacy surface — UUID v4, not autoincrement, not browser-fingerprinted

**What goes wrong:**
sessionId derivation choices that fail privacy:
- Sequential / autoincrement → leaks total chat count
- Hash of UA + IP → fingerprinting
- Echoed in HTTP response headers → caches/logs harvest it
- Logged as analytics dimension → cross-references PII with click events

**Why / How to prevent:**
- Generate `crypto.randomUUID()` on the server on first request without a session cookie/header; return it as a non-HTTP-only cookie OR as a body field on the first response.
- Store on client in `localStorage` alongside the existing chat history (or as a new key — discussion in Pitfall E).
- **Do not send sessionId to analytics** (Umami / Cloudflare). The recruiter-engagement events stay aggregate; the transcript path is the only consumer of sessionId.
- **Don't log the IP+UA+sessionId together to console** — that creates a fingerprint trail in `wrangler tail` and Cloudflare logs.

**When to address:** Phase 2 (write path / sessionId introduction).
**How to test:** Inspect HTTP response — sessionId should not appear in headers; only in body or cookie. Inspect analytics dashboard — no chat-session-cardinality metrics.

**Sources:** WebCrypto `randomUUID()` (HIGH, MDN baseline knowledge).

---

### Moderate Pitfall E: Client-side state ownership confusion between localStorage chat history and KV transcript

**What goes wrong:**
v1.2 already persists last-50 messages locally for 24h with version+TTL. v1.3 KV stores the full transcript server-side. Three confused-ownership traps:
1. Client reads from KV on load (it shouldn't — KV is write-only for the client; reads happen via email)
2. Server echoes back the KV-stored history into the SSE response (defeats the point of localStorage)
3. localStorage and KV diverge silently (e.g., TTL fires on localStorage but KV still has the conversation; visitor returns thinking history is gone, but KV+email already shipped a transcript)

**Why / How to prevent:**
- **Single source of truth per consumer:** client uses localStorage exclusively; KV is server-side audit only.
- **Client never queries KV.** No "GET /api/transcript/:id" endpoint in v1.3.
- **No mid-conversation feedback to UI** about KV state (silent logging — already locked).
- **Reset semantics:** if user clicks "Clear chat" (if such UI exists), only localStorage is cleared; KV is intentionally retained for audit. Document this in code comments.

**When to address:** Phase 2.
**How to test:** Clear localStorage manually mid-conversation; assert subsequent messages still bind to the same sessionId on the server side.

**Sources:** Internal — `src/scripts/chat.ts` Chat Persistence section (D-22); STATE.md.

---

### Moderate Pitfall F: Cron schedule expression character-exact match requirement

**What goes wrong:**
Cloudflare's documentation explicitly states `controller.cron` "must match character-for-character with the configuration, including spacing." If the wrangler config has `"0 * * * *"` (with single spaces) and the handler does `if (controller.cron === "0 * * * *")`, that works. But subtle bugs: copy-paste from a different doc gets non-breaking spaces, tabs, or two spaces; switch statement misses; nothing fires; no error logged.

**Why / How to prevent:**
- For a single cron, just don't compare against `controller.cron` — run the sweep unconditionally.
- If multiple crons land in v1.4+, encode them as constants and import the same constant in both `wrangler.jsonc` and the handler (impossible due to file separation — instead, log every invocation's cron string at info level so any mismatch is visible).

**When to address:** Phase 3.
**How to test:** Deploy with cron, log `controller.cron`, verify dashboard `Past Events` field matches the wrangler config byte-for-byte.

**Sources:** [Cloudflare scheduled handler reference](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) (HIGH).

---

### Moderate Pitfall G: Resend SDK in Cloudflare Workers — Node compat or HTTP fetch?

**What goes wrong:**
Resend's official Node SDK uses `node:` imports under the hood. On Workers without Node compat enabled, `import { Resend } from 'resend'` either fails to bundle or fails at runtime. Devs flip on `nodejs_compat` to fix the symptom — that adds bundle weight and a different runtime surface.

**Why / How to prevent:**
- **Prefer direct `fetch()` calls to Resend's REST API** in Workers — same idempotency keys, same auth, no SDK weight. Pattern:
  ```js
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Idempotency-Key": idempotencyKey, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text })
  });
  ```
- If SDK is preferred, ensure `compatibility_flags = ["nodejs_compat"]` is set in the Worker (NOT the Pages project — different config) and run a build-size diff to confirm acceptable.
- The v1.2 site already imports `@anthropic-ai/sdk` from `cloudflare:workers` env — confirm Resend follows the same pattern.

**When to address:** Phase 4 (email integration).
**How to test:** `wrangler deploy` succeeds; bundle size delta < 50KB; `wrangler tail` shows no `node:` import errors.

**Sources:** [Resend send-with-hono example](https://resend.com/docs/send-with-hono) (HIGH); [Resend Express integration](https://resend.com/docs/send-with-express) (HIGH).

---

### Moderate Pitfall H: Missing `expirationTtl` on KV keys → unbounded namespace growth

**What goes wrong:**
KV doesn't auto-clean. Sessions accumulate forever. At 100 KiB/session and 100 sessions/month, in a year that's ~120 MB — fine. In 5 years, ~600 MB and growing. KV pricing is per-read/write, not storage, but namespace metadata operations slow down.

**Why / How to prevent:**
- Set `expirationTtl: 60 * 60 * 24 * 90` (90 days) on `session:<id>` writes. Long enough that Jack reads everything; bounded.
- Set `expirationTtl: 60 * 60 * 24 * 30` on `sent:<id>` markers. Sentinels don't need to live forever.
- Document the chosen TTLs in a constant: `const SESSION_TTL_SEC = 60*60*24*90;`

**When to address:** Phase 2 (every `put()` call gets a TTL from the start).
**How to test:** `wrangler kv:key get` after expirationTtl + 1 minute → returns null.

**Sources:** [Cloudflare KV TTL docs](https://developers.cloudflare.com/kv/llms-full.txt) (HIGH).

---

### Moderate Pitfall I: Resend webhook for delivery confirmation never wired → silent send failures

**What goes wrong:**
Resend returns `200 OK` from the API call when it accepts the email for sending — NOT when Gmail delivers it. If Gmail rejects (spam, bounce, suppression), the only way to know is the dashboard or `email.bounced` webhook. Without the webhook wired, Jack's transcripts could be silently lost for weeks before he notices.

**Why / How to prevent:**
- Wire a webhook endpoint at `POST /api/resend-webhook` (new route in v1.3) that listens for `email.delivered`, `email.bounced`, `email.complained`, `email.delivery_delayed`.
- Verify webhook signature using Resend's signing secret (Svix-style HMAC) — without this, any actor can POST fake delivery events.
- On `email.bounced` or `email.complained`, log to console.error AND store the bounce reason against the session sentinel for triage.

**When to address:** Phase 4 or Phase 5 (post-launch observability).
**How to test:** Trigger a test bounce by sending to `bounced@resend.dev`; assert webhook fires and logs the bounce.

**Sources:** [Resend webhooks docs](https://resend.com/docs/webhooks/domains/updated) (HIGH).

---

### Moderate Pitfall J: 2-hour inactivity threshold + hourly cron creates worst-case 3-hour latency window

**What goes wrong:**
The math: a session whose last message was at T+0:01 (just after a cron tick fired at T+0:00) won't be considered "inactive" until T+2:01 — and the next cron after that fires at T+3:00. Total worst case: 2h 59min between last-message and email-arrival. This is by design per the milestone spec ("worst-case email latency ~3 hr") but can surprise testers / Jack if not documented.

**Why / How to prevent:**
- This is a chosen tradeoff, not a bug — preventing fragmentation across emails was the goal. Document explicitly in REQUIREMENTS.md and end-of-milestone summary.
- Don't try to "fix" with shorter cron (15-min) without lowering the inactivity threshold — that creates fragmentation.

**When to address:** Phase 0 / requirements doc — surface as known operational characteristic.
**How to test:** UAT acceptance criterion: "transcript of conversation ending at 14:01 arrives between 16:01 and 17:00 inclusive."

**Sources:** Internal — milestone spec.

---

### Moderate Pitfall K: Deferred carry-forward debt becoming worse during v1.3 instead of resolved

**What goes wrong:**
The milestone scope explicitly bundles 5 chat-tech-debt carry-forwards. If the roadmap defers any to v1.4+ ("we'll fix WR-01 listener dedup later"), v1.3's new code lands on top of the same fragile foundations:
- `CHAT_RATE_LIMITER` binding still absent → KV writes from cron run unrate-limited (a misconfigured visitor could storm the chat and storm the KV)
- `build:chat-context:check` not in CI → a portfolio-context drift sneaks in alongside v1.3 changes
- WR-01 listener dedup still broken → analytics events double-fire from accumulated `astro:page-load` listeners during long debug sessions
- `#chat-panel` JS-coupled display contract still fragile → an unrelated CSS edit during email-render-styling work breaks the panel

**Why / How to prevent:**
- **Treat the 5 carry-forwards as gating tasks**, not stretch goals. If a phase ends with a debt item open, that phase is not "complete".
- Sequence the debt sweep early — Phase 1 or Phase 2 — before new feature code touches the same files.

**When to address:** **Carry-forward debt phase** (could be Phase 1 — combined with foundations).
**How to test:** STATE.md "Open Blockers (carried into v1.3)" block must be empty by end-of-milestone. Re-verify each item against its tracked todo file.

**Sources:** Internal — `.planning/STATE.md` Open Blockers; PROJECT.md Known issues / tech debt carried into v1.3.

---

## Minor Pitfalls

### Minor Pitfall α: ISO-8601 timestamp parsing across visitor timezone, server UTC, Jack's local

**What goes wrong:** `last_activity_at` stored as `Date.now()` (ms epoch) is unambiguous; stored as `new Date().toString()` is locale-dependent and parses inconsistently across V8 / Workers / Node. Jack reading `Tue Apr 27 2026 14:32:00 GMT+0000 (Coordinated Universal Time)` in his email requires translation.

**How to prevent:** Always store `new Date().toISOString()` (ISO-8601 UTC) in KV. Render in email as `formatLocal(iso, "America/New_York")` or similar (Jack's timezone). Never call `Date.now()` for display.
**When:** Phase 2.
**Test:** snapshot tests for `formatTimestamp` with fixed input → fixed output.

---

### Minor Pitfall β: Test suite using `delivered@resend.dev` charges against rate limit too

**What goes wrong:** Heavy CI test runs hammering Resend's test address can hit the team's 5 RPS limit and 429 the test → false-failed CI run.

**How to prevent:** Mock Resend client in unit tests; use real Resend only in nightly E2E.
**When:** Phase 4 (test infra).
**Test:** unit suite has 0 outbound HTTP calls in `pnpm test`.

---

### Minor Pitfall γ: Astro's `output: 'server'` vs `'hybrid'` interaction with Workers Static Assets

**What goes wrong:** Migration to Workers Static Assets (Pitfall 0 path 1) requires `output: 'server'` in `astro.config.mjs`. The current site is `prerender = false` per-route on `/api/chat` only (everything else is static). Switching to `output: 'server'` could unintentionally SSR static pages and balloon the worker.

**How to prevent:** Keep `output: 'static'` for the static portion of the site; `prerender = false` only for `/api/chat` and the new resend-webhook route. Verify that `wrangler deploy` produces a worker that **only** serves dynamic routes; static assets ship via `[assets]` binding.
**When:** Phase 1.
**Test:** Inspect the deployed worker's bundle — should not include MDX content collections; the static HTML lives in `[assets]`.

---

### Minor Pitfall δ: Resend "delivered" includes spam-folder delivery

**What goes wrong:** `email.delivered` webhook fires when SMTP receives the message — INCLUDING when it lands in spam. Jack might miss transcripts despite Resend dashboard saying "100% delivered."

**How to prevent:** Don't trust `email.delivered`; use Postmaster Tools as ground truth (Pitfall 7). Treat Resend's webhooks as transport-layer ack, not inbox-layer ack.
**When:** Ongoing.
**Test:** Manual inbox check first 7 days post-launch.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfalls | Mitigation Strategy |
|-------------|-----------------|---------------------|
| **Phase 1 — Foundations / architecture decision** | Critical-0 (Pages-doesn't-do-cron); Critical-7 (DNS not pre-warmed); Minor-γ (Astro output mode); Moderate-K (carry-forward debt) | Decision Record locks Workers vs Pages choice; DNS verified before code; debt sweep gating |
| **Phase 2 — KV write path / sessionId introduction** | Critical-1 (SSE + KV race); Critical-5 (D-26 regression); Critical-6 (prompt cache invalidation); Moderate-D (sessionId privacy); Moderate-E (state ownership); Moderate-H (TTL); Minor-α (timestamps) | Wave-0 RED for D-26 extensions; sessionId stays out of system block; ctx.waitUntil for writes |
| **Phase 3 — Cron sweep + idempotency** | Critical-2 (KV consistency); Critical-4 (idempotency); Moderate-B (list pagination); Moderate-C (CPU budget); Moderate-F (cron string match) | Two-key sentinel pattern; bounded batch; pagination; per-session waitUntil |
| **Phase 4 — Email render + Resend integration** | Critical-3 (HTML escape); Critical-7 (deliverability — DNS work needed by P1); Critical-8 (prompt-injection echo); Moderate-G (SDK vs fetch); Moderate-I (webhook); Minor-β (rate limit on test); Minor-δ (delivered ≠ inboxed) | Plaintext-only for v1.3; idempotency keys; webhook for bounces |
| **End-of-milestone gate** | Critical-5 (D-26 ≥ 117 GREEN); Moderate-K (debt sweep complete); Critical-7 (Postmaster Tools enrolled, spam < 0.1%) | Re-run full battery; STATE.md Open Blockers empty; manual deliverability check |

---

## Regression Risks — Existing Surface That MUST Not Break

This section calls out v1.2 invariants explicitly so phase planning treats them as gates, not aspirations.

### D-26 Chat Regression Battery (117/117 GREEN at v1.2 close)

Per `.planning/milestones/v1.2-MILESTONE-AUDIT.md` line 172, D-26 covers Phase 7 invariants:

| Invariant | v1.3 Risk Vector | Mitigation |
|-----------|------------------|------------|
| **XSS** (DOMPurify allowlist + `marked` config) | Email render path tempts a "shared sanitizer" refactor that loosens chat.ts | Email path uses separate plaintext / HTML-encode pipeline; chat.ts config is byte-frozen |
| **CORS** (exact origin whitelist via `isAllowedOrigin`) | New `/api/resend-webhook` route or sweeper Worker may copy-paste CORS logic and drift | Centralize CORS helper; never duplicate inline |
| **Rate-limit** (5/60s per IP via `CHAT_RATE_LIMITER` binding) | KV add per-request adds CPU; unconfigured binding (carry-forward) is a wider hole now | Phase 1 configures binding; never regress the "skip when binding absent" defensive code path |
| **30s timeout** (client `AbortController` in `chat.ts`) | KV writes inside SSE close can push past 30s | `ctx.waitUntil()` for KV; never `await` inline (Critical-1) |
| **Focus-trap** (chat panel focus management) | Silent logging means no UI surface for v1.3 — should be unaffected, verify |
| **Persistence** (localStorage + 50-msg + 24h TTL + version) | Confused ownership with KV (Moderate-E) | Single-source-of-truth doctrine documented in code |
| **SSE** (`text/event-stream` + `[DONE]` + `Content-Encoding: none`) | New SSE frame type would break D-15 server byte-identical | No new SSE frames in v1.3 |
| **Markdown** (`marked` config `{breaks, gfm, async: false}`) | Email path may import `marked`; "fix sync issue" tempts a config tweak | Email path does NOT use `marked` |
| **Clipboard** (copy-button parity per Phase 12 DEBT-03) | Unrelated to v1.3 surface — verify untouched |

### D-15 Server Byte-Identical (v1.2 phase-wide)

Adding sessionId to the request schema is a server byte-shape change → D-15 needs an explicit amendment at milestone gate. The amendment is approved if and only if:
- Old client (no sessionId) still works (server generates sessionId server-side as fallback)
- SSE response shape unchanged (no new `data:` frames)
- `Content-Type`, `Cache-Control`, `Connection`, `Content-Encoding` headers unchanged
- POST request body validation accepts both shapes during a transition window

### Phase 7 Architecture Constraints (per CLAUDE.md / PROJECT.md Constraints)

> **Chat:** Phase 7 architecture preserved (SSE streaming, focus trap, XSS sanitization, CORS, 5/60s rate limit, 30s timeout, localStorage persistence) — D-26 regression battery is a milestone-level gate for any phase touching `BaseLayout.astro` / `global.css` / `chat.ts` / `api/chat.ts`

Implication: every v1.3 phase that touches these four files must run D-26. No exceptions.

### Anthropic Prompt Cache (v1.2 Phase 14)

`cache_control: ephemeral` on the system block. v1.2 deferred cache-hit-rate observability — v1.3 must wire it (carry-forward) AND not invalidate the cache via sessionId leakage (Critical-6).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip Resend domain DNS / ship from `onboarding@resend.dev` | "Send email today" | Marked as test-only by Gmail; immediate spam-foldering; suppression list growth | Never in production |
| Inline `await env.KV.put()` inside SSE stream | "Simpler code, no waitUntil" | Critical-1 race; transcripts dropped on tab close | Never — use ctx.waitUntil unconditionally |
| Skip `idempotencyKey` on Resend calls | "Simpler payload" | Duplicate emails on every retry; Resend bills for each | Never — always set the key |
| Log full chat content to `console.log` for debugging | "Visible in wrangler tail" | PII trail in logs; same content also lives in KV | Never in production; OK temporarily in `wrangler dev` only |
| Defer Postmaster Tools enrollment to "after we see if it works" | "Less setup" | First spam-folder hit invisible for days | Never — enroll at Phase 1 |
| Render user message as `html` "we'll add markdown later" | "More flexible payload" | Critical-3, Critical-8 surface | Never until plaintext-only v1.3 ships AND adversarial render test suite is built |
| Defer cache-hit-rate observability "again" | "Faster Phase 14 close" | Critical-6 has no detection mechanism; cache regression invisible until bill arrives | Not in v1.3 — this is the milestone where it lands |
| Skip the 5-debt-carry-forward sweep "we'll do it in v1.4" | "Smaller scope" | Moderate-K: new code on fragile foundations | Never — milestone scope locks the sweep |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Cloudflare KV** | Reading after writing in same request → expecting strong consistency | KV is eventually consistent globally (60s) but read-your-own-writes within same POP. Don't read-after-write across edge locations. |
| **Cloudflare Cron** | `wrangler.toml` cron block in a Pages project | Cron Triggers are Workers-only. Migrate to Workers (Pitfall 0). |
| **Resend** | Hardcoding API key in source | Use `env.RESEND_API_KEY` via Cloudflare Worker secret (`wrangler secret put`). |
| **Resend** | Sending without `idempotencyKey` then retrying on transient failure | Always set `idempotencyKey: \`transcript/\${sessionId}\``. |
| **Resend** | Treating `email.delivered` webhook as "in inbox" | `delivered` = SMTP accepted, possibly to spam. Use Postmaster Tools for inbox-rate. |
| **Resend** | Subject derived from user content | Subject is server-controlled; visitor content stays in body only. |
| **Anthropic SDK** | Adding sessionId to `messages` array → breaks prompt cache | sessionId stays on HTTP envelope; never in Anthropic payload. |
| **Anthropic SDK** | Assuming 1h cache TTL (was Anthropic default before March 6, 2026) | Default is now 5min; explicit `ttl: 3600` for 1h. |
| **Astro `@astrojs/cloudflare`** | `output: 'server'` SSRs the entire static site | Use `output: 'static'` + per-route `prerender = false`; verify worker bundle excludes static content collections. |
| **Cloudflare Workers Secrets** | Adding `RESEND_API_KEY` to `wrangler.toml` | Use `wrangler secret put RESEND_API_KEY` — secrets, not vars. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| KV read amplification — re-reading large transcripts each cron tick | Cron CPU time grows linearly with session count | Store `last_activity_at` in metadata (`list` returns it without separate `get`) | At ~500 sessions/cron-tick |
| Resend RPS exceeded by parallel sends | 429 errors in logs; suppression list candidates | Controlled-concurrency loop (≤ 2 in flight); exponential backoff | At >2 sessions sending simultaneously |
| Anthropic cache miss every request | First-token latency 200-500ms higher than v1.2 baseline | Don't put per-request data in cached system block (Critical-6) | At every deploy that breaks the cache; stale = 5 min |
| Cron handler timeout (30s `waitUntil` ceiling) | Past Events shows "fail"; mid-batch sessions unsent | Bounded batch size; per-session waitUntil; CPU profiling | At ~50 sessions/tick |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Render user message as HTML in email | Phishing payload in Jack's inbox (Critical-3) | Plaintext-only for v1.3; HTML-encode if HTML added later |
| Subject line interpolated from user content | Spoofing in email previews (Critical-8) | Subject is server-controlled; visitor content body-only |
| `Reply-to: noreply@...` | Auto-reply confusion; some classifiers downgrade | `Reply-To: jackcutrara@gmail.com` |
| sessionId in URL / response headers | Session-fixation / harvesting | sessionId in body or HttpOnly-equivalent only |
| Logging IP+UA+sessionId together | Fingerprinting trail in `wrangler tail` | Log only one of IP/UA/sessionId per line |
| No webhook signature verification on `/api/resend-webhook` | Spoofed bounce events; manipulated suppression state | Verify Svix-style HMAC signature with `RESEND_WEBHOOK_SECRET` |
| Echoing visitor's IP / UA / country into email body unescaped | Same XSS surface as message content | HTML-encode every dynamic field, even "trusted" metadata |

---

## "Looks Done But Isn't" Checklist

- [ ] **KV write path:** transcript saved server-side — verify `wrangler kv:key get session:<id>` returns full conversation, not just the first message
- [ ] **Cron triggering:** verify in dashboard `Past Events` table that cron has actually fired in production within the last hour, not just been "registered"
- [ ] **Idempotency:** rerun cron twice within 60 seconds — verify only one Resend call, sentinel exists after first
- [ ] **Email content security:** synthetic adversarial payload (`<script>alert(1)</script>`, RTL override, `https://evil.example`) → email body renders as literal text, no link, no image fetch
- [ ] **Resend domain verified:** all four DNS records (SPF, DKIM, MX, DMARC) show `verified` in Resend dashboard
- [ ] **DMARC at p=none minimum:** `dig TXT _dmarc.jackcutrara.com` returns a record
- [ ] **Postmaster Tools enrolled:** Jack can see spam rate metric for `jackcutrara.com`
- [ ] **D-26 117/117:** full battery passes at end-of-milestone, not just "the bits we touched"
- [ ] **D-15 amendment:** if SSE / request-shape changed, amendment is approved and documented
- [ ] **Anthropic cache hit rate:** observable via logs; deploy-to-deploy delta visible
- [ ] **Carry-forward debt:** STATE.md "Open Blockers (carried into v1.3)" block is empty
- [ ] **First 7 days of email:** all transcripts arrived in inbox (not spam); manually verified by Jack
- [ ] **No sessionId in analytics:** Umami / CF Web Analytics show no chat-session-cardinality dimension
- [ ] **No new SSE frame types:** `data:` payload shape unchanged from v1.2 (still `{text}`, `{truncated}`, `{error}`, `[DONE]`)
- [ ] **Webhook signature verified:** spoofed POST to `/api/resend-webhook` is rejected
- [ ] **TTLs set on every KV write:** no key written without `expirationTtl`

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Cron didn't deploy (Critical-0) | LOW | Migrate route to Workers Static Assets OR add separate sweeper Worker; existing KV writes are intact |
| KV writes dropped during SSE (Critical-1) | MEDIUM | Lost transcripts are unrecoverable; backfill not possible. Forward-fix with `ctx.waitUntil`. |
| Stale cron read sent partial transcript (Critical-2) | LOW | Sentinel pattern + Resend idempotency means subsequent cron will not re-send; Jack manually replies "saw partial, ignore" if needed |
| Email sent twice (Critical-4) | LOW | Add the sentinel pattern; resend-with-fix doesn't repair history but stops the bleed |
| Spam-foldering (Critical-7) | MEDIUM | Mark "Not Spam" for the next 10 emails; configure Gmail filter on a stable subject prefix; warm domain reputation; consider sender-domain change if persistent |
| Resend suppression list growth (Critical-7) | MEDIUM | Manually remove Jack's address from suppression list via Resend dashboard; ensure no future "this is spam" clicks |
| D-26 regression (Critical-5) | HIGH | Revert; phase work isolated by feature flag; test must pass before re-merge |
| Anthropic cache invalidated (Critical-6) | LOW | Remove the per-request data from system block; cache rebuilds within 5 minutes |
| Adversarial content rendered (Critical-3) | HIGH | If a phishing payload reached Jack's inbox: rotate any credentials Jack might have entered; patch render path; add adversarial test that would have caught it |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Critical-0 (Pages no-cron) | Phase 1 | Decision record + production cron `Past Events` shows fires |
| Critical-1 (SSE + KV race) | Phase 2 | D-26 timing test extension; latency budget held |
| Critical-2 (KV consistency) | Phase 3 | MockKV-with-delay unit test; no double-emails in 7-day prod observation |
| Critical-3 (HTML escape) | Phase 4 | Adversarial-payload unit suite; manual UAT with rendered email |
| Critical-4 (idempotency) | Phase 3 | Crash-test sweeper rerun; Resend `idempotency_replay: true` |
| Critical-5 (D-26 regression) | Cross-phase gate | D-26 ≥ 117 GREEN at every phase end |
| Critical-6 (prompt cache) | Phase 2 + cache observability landing | `cache_read_input_tokens > 0` post-deploy |
| Critical-7 (deliverability) | Phase 1 (DNS) + end-of-milestone gate (Postmaster Tools) | DMARC verified; spam rate < 0.1% |
| Critical-8 (prompt-injection echo) | Phase 4 | Threat-model decision record; sender-chrome present |
| Moderate-A (KV size cap) | Phase 2 | 100-msg test |
| Moderate-B (list pagination) | Phase 3 | 1500-key test |
| Moderate-C (CPU budget) | Phase 3 | Synthetic 100-session sweep < 25s |
| Moderate-D (sessionId privacy) | Phase 2 | sessionId not in headers / analytics |
| Moderate-E (state ownership) | Phase 2 | Code comment + no GET /api/transcript route |
| Moderate-F (cron string match) | Phase 3 | `console.log(controller.cron)` matches wrangler config |
| Moderate-G (Resend SDK / fetch) | Phase 4 | Bundle size delta < 50KB |
| Moderate-H (KV TTL) | Phase 2 | Every `put()` includes `expirationTtl` |
| Moderate-I (Resend webhook) | Phase 4 or 5 | `/api/resend-webhook` deployed and signature-verified |
| Moderate-J (3hr latency) | Requirements doc | UAT criterion explicit |
| Moderate-K (carry-forward debt) | Phase 1 | STATE.md Open Blockers empty by milestone close |
| Minor-α (timestamps) | Phase 2 | ISO-8601 in KV; localized in email |
| Minor-β (test rate limit) | Phase 4 | 0 outbound HTTP in unit suite |
| Minor-γ (Astro output mode) | Phase 1 | Worker bundle excludes static content |
| Minor-δ (delivered ≠ inboxed) | End-of-milestone | Manual 7-day inbox check |

---

## Sources

### Cloudflare (HIGH confidence — Context7 + official docs)
- [Migrate from Pages to Workers (Cloudflare Workers docs)](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/) — feature parity matrix; Pages does NOT support Cron Triggers
- [Cloudflare Cron Triggers config](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Scheduled Handler reference (`scheduled(controller, env, ctx)`)](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) — `ctx.waitUntil` 30s ceiling; `controller.cron` character-exact match
- [Workers KV — Concepts: How KV works / Consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/) — eventual consistency, 60s global propagation
- [Workers KV — Limits](https://developers.cloudflare.com/kv/platform/limits/) — 25 MiB value, 512 byte key, 1024 byte metadata
- [Workers KV — List keys (pagination / cursors)](https://developers.cloudflare.com/kv/api/list-keys/) — 1000 default limit
- [Workers KV — FAQ](https://developers.cloudflare.com/kv/reference/faq/)
- [Workers Streams runtime](https://developers.cloudflare.com/workers/runtime-apis/streams/)
- [Workers Platform Limits (CPU 30s default)](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare-docs migration guide on GitHub](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/static-assets/migration-guides/migrate-from-pages.mdx)

### Resend (HIGH confidence — Context7)
- [Resend AI-onboarding (idempotency keys, error retry, rate limits)](https://resend.com/docs/ai-onboarding) — `<event-type>/<entity-id>`, 24h TTL, 256 char max, 5/2 RPS
- [Resend API reference — errors](https://resend.com/docs/api-reference/errors) — 409, 429, 500 retry strategy
- [Resend API reference — introduction (rate limits)](https://resend.com/docs/api-reference/introduction)
- [Resend domain verification](https://resend.com/docs/dashboard/domains/tracking) — `POST /domains/{id}/verify`
- [Resend webhooks — domain.updated](https://resend.com/docs/webhooks/domains/updated)
- [Resend send-with-hono / Express examples](https://resend.com/docs/send-with-hono) — fetch + SDK patterns

### Anthropic (HIGH / MEDIUM)
- [Claude prompt caching official docs](https://docs.claude.com/en/docs/build-with-claude/prompt-caching) — HIGH (Anthropic docs)
- [Cache TTL silently regressed Mar 6 2026 — claude-code issue #46829](https://github.com/anthropics/claude-code/issues/46829) — MEDIUM (third-party reproduction; Anthropic-confirmed)
- [Anthropic cache TTL DEV.to writeup](https://dev.to/whoffagents/anthropic-silently-dropped-prompt-cache-ttl-from-1-hour-to-5-minutes-16ao) — MEDIUM

### Email security & deliverability
- [Google Workspace Email sender guidelines](https://support.google.com/a/answer/81126?hl=en) — HIGH (Google official)
- [Google Workspace bulk-sender FAQ](https://support.google.com/a/answer/14229414?hl=en) — HIGH
- [Gmail enforcement Nov 2025 ramp-up](https://redsift.com/resources/blog/gmails-enforcement-ramps-up-what-bulk-senders-need-to-know) — MEDIUM (third-party industry analysis)
- [Twilio: protecting users against email HTML injection](https://www.twilio.com/en-us/blog/developers/tutorials/building-blocks/dont-get-pwned-via-email-html-injection) — MEDIUM
- [Mailgen plaintext-bypass advisory (encoded-tag re-decode)](https://github.com/eladnava/mailgen/security/advisories/GHSA-xw6r-chmh-vpmj) — MEDIUM
- [HackTricks — email injections](https://book.hacktricks.xyz/pentesting-web/email-injections) — MEDIUM
- [OWASP XSS](https://owasp.org/www-community/attacks/xss/) — HIGH

### Internal (HIGH — direct file references)
- `.planning/PROJECT.md` — Constraints / Known issues (rev 2026-05-09)
- `.planning/STATE.md` — Open Blockers carried into v1.3
- `.planning/milestones/v1.2-MILESTONE-AUDIT.md` line 172 — D-26 invariants
- `src/pages/api/chat.ts` — current SSE pattern, rate-limiter binding handling
- `src/scripts/chat.ts` — DOMPurify config, marked config, AbortController, localStorage persistence
- `src/lib/validation.ts` — Zod schemas, CORS allow-list
- `CLAUDE.md` — Conventions / Phase 7 architecture preserved

---

*Pitfalls research for: v1.3 Chat Visibility (KV transcript persistence + cron-driven Resend email)*
*Researched: 2026-05-09*
*Author: GSD project researcher*
