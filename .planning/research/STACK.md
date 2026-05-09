# Stack Research — v1.3 Chat Visibility

**Domain:** Subsequent milestone — adding transcript persistence + per-session email delivery + cron-driven scanning to the existing Astro 6 + Cloudflare Workers SSR chat endpoint.
**Researched:** 2026-05-09
**Confidence:** HIGH

> **Scope note:** v1.3 is purely additive on top of v1.2's locked stack (Astro 6.0.x, Tailwind v4.2.x, TypeScript 5.9, Node 22, Cloudflare Pages + Workers SSR via `@astrojs/cloudflare` 13.1.x, `@anthropic-ai/sdk` 0.82.x, MDX + Zod 4 content collections, Geist via Astro Fonts API, Umami + CF Web Analytics, DOMPurify + marked). Nothing in the existing stack is re-researched here. This file scopes **only** the three new capabilities — KV persistence, Resend email, Cloudflare Cron — plus the entrypoint change required to wire `scheduled()` into the existing Astro Worker.

---

## Recommended Stack Additions

### Runtime dependency

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| **`resend`** | `^6.12.x` (latest 6.12.3 published 2026-05-08) | Transactional email API SDK — sends one HTML email per ended chat session to `jackcutrara@gmail.com` | Officially documented for Cloudflare Workers by both Cloudflare ([Workers tutorial](https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/)) and Resend ([Cloudflare Workers guide](https://resend.com/docs/send-with-cloudflare-workers)). Pure `fetch`-based — works in Workers without `nodejs_compat` (the user already has it enabled, so no change either way). Idempotency-key support (`Idempotency-Key` header / `idempotencyKey` SDK option) prevents duplicate sends if the cron retries — directly relevant since v1.3's "scan-and-send" cron must be safely re-runnable. Free tier is 3,000 emails/month + 100/day on a verified domain — Jack will send <30/day worst case. |

**That is the only new runtime npm dependency required.** Everything else (KV, cron) is platform-native and configured in `wrangler.jsonc` — no new package, just a binding declaration.

### Platform features (Cloudflare-native, no npm install)

| Feature | Configured via | Purpose | Why |
|---------|----------------|---------|-----|
| **Cloudflare Workers KV** | `wrangler.jsonc` `kv_namespaces` array | Transcript persistence keyed by sessionId; metadata holds `last_activity_at` + `email_sent` flag for cron's filter pass | KV is the right scale fit: bounded corpus (~2000 transcripts/year max at this traffic profile), no aggregation/search needed (Jack reads each transcript whole), eventually-consistent reads are fine for this workload, and 25 MiB per value is well above any plausible session length. KV's `metadata` field (1024 bytes JSON) is purpose-built for the "filter without reading the value body" pattern the cron needs. **Confirmed limit: KV enforces 1 write/sec per key** — a real concern since transcripts are appended on every assistant turn. Mitigation: debounce writes server-side (write only after assistant stream completes, not per-token) — this is already the natural seam in `chat.ts`. |
| **Cloudflare Cron Triggers** | `wrangler.jsonc` `triggers.crons` array + `scheduled()` handler in custom entrypoint | Hourly inactivity scan — list KV keys, filter by `metadata.last_activity_at < now - 2h` AND `metadata.email_sent !== true`, call Resend, mark `email_sent: true` | Free on Workers (no Cron-specific cost beyond the included 5,000 cron invocations/day on the Free plan; Paid plan is unlimited). Cron event fires globally at the configured schedule and routes to `scheduled(controller, env, ctx)`. `ctx.waitUntil()` is the correct pattern for awaiting Resend + KV operations in a cron handler. |
| **Wrangler secret: `RESEND_API_KEY`** | `npx wrangler secret put RESEND_API_KEY` | API key for Resend SDK — accessed via `env.RESEND_API_KEY` from `cloudflare:workers` import (same pattern as the existing `env.ANTHROPIC_API_KEY`) | Cloudflare's official guidance: never hardcode; always use secret bindings. The existing `chat.ts` already follows this pattern verbatim — the new key slots into the same `env` object alongside `ANTHROPIC_API_KEY`. |
| **Resend domain verification** (DNS, not code) | Cloudflare DNS dashboard for `jackcutrara.com` | Authenticate outbound email so it doesn't hit Gmail spam | Resend requires SPF + DKIM TXT records on the sending domain or subdomain. Resend explicitly recommends using a subdomain like `updates.jackcutrara.com` or `mail.jackcutrara.com` to isolate sending reputation from the apex domain. **Recommended: use a `mail.jackcutrara.com` subdomain** — keeps the apex's existing email situation untouched. Cloudflare DNS has Resend's "Sign in to Cloudflare" / Domain Connect button that auto-configures the records ([Resend Cloudflare DNS guide](https://resend.com/docs/knowledge-base/cloudflare)). Optional DMARC record once DKIM stabilizes. |

### TypeScript types (zero install — already present)

| Types | Source | Notes |
|-------|--------|-------|
| `KVNamespace`, `ScheduledController`, `ExecutionContext`, `ExportedHandler` | Generated by `wrangler types` (already in `pnpm build` script) into `worker-configuration.d.ts` | The user's `package.json` already runs `wrangler types` as part of `build`. After adding `kv_namespaces` and `triggers.crons` to `wrangler.jsonc`, re-running `wrangler types` regenerates `worker-configuration.d.ts` so `env.CHAT_TRANSCRIPTS` is correctly typed as `KVNamespace`. No `@cloudflare/workers-types` install needed — wrangler-generated types are the modern path. |

---

## Wrangler Config Additions

The current `wrangler.jsonc` is minimal:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "jack-cutrara-portfolio",
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_date": "2026-04-04",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "binding": "ASSETS", "directory": "./dist/client" }
}
```

Three additions are required, plus one **structural change**:

### 1. KV namespace binding

```jsonc
"kv_namespaces": [
  {
    "binding": "CHAT_TRANSCRIPTS",
    "id": "<created-via-wrangler-kv-namespace-create>",
    "preview_id": "<created-with-flag --preview>"
  }
]
```

Created via:
```powershell
npx wrangler kv namespace create CHAT_TRANSCRIPTS
npx wrangler kv namespace create CHAT_TRANSCRIPTS --preview
```

`preview_id` is required for `astro dev` / `wrangler dev` to use a separate dev namespace — never write dev transcripts into prod. Both IDs go into `wrangler.jsonc`.

### 2. Cron Trigger

```jsonc
"triggers": {
  "crons": ["0 * * * *"]
}
```

Hourly at minute 0 (UTC). The 2-hour inactivity window is enforced **inside** the scheduled handler (not by cron schedule) — so the cron expression can stay simple and the threshold is a code constant. Hourly + 2h threshold gives worst-case email latency ~3h, matching the locked spec.

### 3. Custom entrypoint (structural change — required)

**Current setup:** `"main": "@astrojs/cloudflare/entrypoints/server"` — pointing directly at the adapter's bundled entrypoint. This is fine for fetch-only Workers. **It does not allow exporting a `scheduled` handler.**

**Required change:** swap to a custom entrypoint that wraps the Astro handler.

`wrangler.jsonc`:
```jsonc
"main": "./src/worker/index.ts",
```

`src/worker/index.ts` (new file):
```ts
import { handler } from "@astrojs/cloudflare/handler";
import { runChatTranscriptScan } from "./chat-transcript-scan";

export default {
  // Astro fetch handler — preserves all existing routes including /api/chat
  fetch: handler.fetch,

  // Cron handler — runs hourly per wrangler triggers.crons
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(runChatTranscriptScan(env));
  },
} satisfies ExportedHandler<Env>;
```

This is the documented Astro 6 + cron pattern (see [Astro issue #13838 thread](https://github.com/withastro/astro/issues/13838) and the parallel TanStack pattern in Cloudflare's docs — Astro uses `import { handler } from "@astrojs/cloudflare/handler"`). The `handler.fetch` re-export is identity-equivalent to the previous `@astrojs/cloudflare/entrypoints/server` default — Astro's fetch routing is byte-identical.

Build output integration: `astro build` continues to emit `dist/_worker.js/index.js`. The custom entrypoint at `src/worker/index.ts` is the bundle's entry, and Wrangler resolves the `@astrojs/cloudflare/handler` import to the built Astro handler. **Verify post-build that `dist/_worker.js/index.js` still exists or update the bundling chain accordingly** — if Astro 6 build output path changes when Wrangler `main` is overridden, this is the seam to watch (low risk; documented to work, but worth a smoke test in the requirements phase).

### 4. Secrets (not in wrangler.jsonc)

```powershell
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put NOTIFY_EMAIL_TO     # jackcutrara@gmail.com
npx wrangler secret put NOTIFY_EMAIL_FROM   # transcripts@mail.jackcutrara.com
```

`NOTIFY_EMAIL_TO` and `NOTIFY_EMAIL_FROM` as secrets (rather than `vars`) keeps them out of the `wrangler.jsonc` git history. They're not secret per se, but secrets-not-vars is the safer default for anything email-related (avoids harvesting from the public repo).

---

## Integration Points

| File | Change | Reason |
|------|--------|--------|
| `wrangler.jsonc` | Add `kv_namespaces`, `triggers.crons`, switch `main` to `./src/worker/index.ts` | Declare new bindings + cron schedule + dual-handler entrypoint |
| `src/worker/index.ts` | **New file.** Export `{ fetch, scheduled }` wrapping `@astrojs/cloudflare/handler` | Bridge Astro fetch routing + Cloudflare cron in one Worker |
| `src/worker/chat-transcript-scan.ts` | **New file.** `runChatTranscriptScan(env)` — list KV with metadata, filter, send-and-mark | Encapsulates the cron's full scan logic; testable in isolation |
| `src/lib/transcript-store.ts` | **New file.** `appendMessage()`, `markEmailSent()`, `listInactive()` — typed wrapper around `env.CHAT_TRANSCRIPTS` | Single seam for KV access; encapsulates key shape, metadata schema, TTL policy |
| `src/lib/email-transcript.ts` | **New file.** `sendTranscriptEmail(env, sessionId, transcript)` — Resend SDK call with HTML escaping + idempotency key | Encapsulates Resend SDK + content-security (HTML escape user-typed text, no markdown rendering, no auto-link). Idempotency key derived from sessionId so cron retries are safe. |
| `src/pages/api/chat.ts` | **Modify.** After SSE stream completes successfully, append final user+assistant turns to KV via `transcript-store.appendMessage()` (debounced — one write per assistant turn, after stream close, not per-token) | Wire transcript capture into the existing endpoint without disturbing the SSE flow. Wrap in a `try/catch` that logs but does not propagate — transcript write failure must never break the chat reply. |
| `src/env.d.ts` (or ambient `.d.ts`) | **Verify auto-generated `worker-configuration.d.ts` has `CHAT_TRANSCRIPTS: KVNamespace` and `RESEND_API_KEY: string`** | `wrangler types` regenerates this on every build; no manual edits needed |
| `package.json` | Add `"resend": "^6.12.3"` to `dependencies` | Single npm install |
| `astro.config.mjs` | **No change required.** Adapter config stays as-is — the custom entrypoint is a Wrangler-level concern, not an Astro config change | Confirmed against Astro Cloudflare adapter docs |

**Phase 7 invariants preserved:** SSE streaming flow, focus trap, XSS sanitization (DOMPurify+marked), CORS allow-list, 5/60s rate limit binding (currently absent on prod), 30s timeout, localStorage 50-msg/24h persistence — **none of these change**. Transcript capture is a pure additive call after the existing stream-close path.

---

## Alternatives Considered — the explicit Resend vs Cloudflare Email vs MailChannels comparison

The user flagged this as the most important comparison. **Decision: Resend.** Cloudflare Email Service was assessed as a serious contender and explicitly rejected for v1.3 — see analysis below.

### Cloudflare Email Sending (Email Service)

**Status (as of 2026-05-09):** Public beta since 2026-04-16 ([changelog](https://developers.cloudflare.com/changelog/post/2026-04-16-email-sending-public-beta/), [blog post](https://blog.cloudflare.com/email-for-agents/)). Graduated from private beta during Cloudflare Agents Week. **Not GA.**

**API:**
```ts
await env.EMAIL.send({
  to: "jackcutrara@gmail.com",
  from: `transcripts@mail.jackcutrara.com`,
  subject: `Chat transcript: ${sessionId}`,
  html: escapedHtml,
  text: plainText,
});
```

Bound via `wrangler.jsonc` `send_email` array — no API key, no SDK, no fetch call.

**Pricing (current public docs, [pricing page](https://developers.cloudflare.com/email-service/platform/pricing/)):**
- **Workers Paid plan only** ($5/month minimum) — not on the free Workers tier
- 3,000 emails/month included
- $0.35 per 1,000 emails beyond that

**Pros:**
- No API key to rotate, no separate dashboard, no third-party dependency
- Native binding pattern matches the rest of the Worker
- SPF/DKIM/DMARC auto-configured when domain is added — Cloudflare handles authentication
- Reserved IPs separate from general Cloudflare pools
- Astro is now Cloudflare-owned (Jan 2026 acquisition) — first-party path

**Cons (decisive):**
1. **Public beta — explicitly "features and APIs may change before general availability."** The v1.3 milestone is going to production and Jack relies on this email pipeline to see real recruiter conversations. Beta-status APIs are a wrong fit for a production capture pipeline where lost transcripts = lost insight.
2. **Workers Paid plan required.** Jack is currently on the free Workers tier (no `CHAT_RATE_LIMITER` binding indicates Free plan; Pages projects don't auto-attach Workers Paid). Adopting Cloudflare Email would push him to a $5/month minimum plan just for the binding — Resend's free tier covers the full v1.3 traffic profile at $0/month.
3. **No deliverability track record at scale.** Even Cloudflare's own messaging on this acknowledges they have not operated email-sending at scale before; experienced operators are advising "wait six months and watch the reputation data" for revenue-critical workloads ([Lord, 2026-04-20](https://lord.technology/2026/04/20/cloudflare-email-service-is-a-deliverability-bet-dressed-as-an-agents-launch.html)). Resend has 3+ years of deliverability optimization specifically for transactional email.
4. **Can't easily retry / reproduce in dev.** Resend has a sandbox `from: "Acme <onboarding@resend.dev>"` mode that delivers test emails to `delivered@resend.dev` without DNS setup. Cloudflare's path requires verified domain + production binding to test end-to-end.

**FLAG (per user instruction):** Cloudflare Email Sending is the strictly-better option **once it hits GA AND the user is on Workers Paid for other reasons.** Re-evaluate at:
- Cloudflare Email GA announcement (track [Cloudflare changelog](https://developers.cloudflare.com/changelog/) feed)
- Any future Workers Paid migration (e.g. if Jack later wants `CHAT_RATE_LIMITER` to actually bind, which requires Paid)

The migration cost when GA'd is genuinely small: replace one `email-transcript.ts` implementation, drop the `resend` package, remove `RESEND_API_KEY` secret. The interface boundary in `email-transcript.ts` (above) is already structured to make this a one-file swap.

### MailChannels

**Status: dead path.** MailChannels' free Cloudflare Workers email API was terminated 2024-08-31 ([end-of-life notice](https://support.mailchannels.com/hc/en-us/articles/26814255454093-End-of-Life-Notice-Cloudflare-Workers)). Their post-2024 product is a separate paid tier with a 100 emails/day free plan — narrower than Resend's free tier and without Resend's developer experience.

**Verdict: Do NOT use MailChannels for v1.3.** Historical guidance to use MailChannels with Cloudflare Workers (from 2022–2024 blog posts) is stale.

### Other email providers (briefly)

| Provider | Free tier | Why not |
|----------|-----------|---------|
| Postmark | 100 emails/month free | Free tier too narrow; otherwise excellent for transactional |
| SendGrid (Twilio) | 100/day free | Heavier API surface, weaker DX, deliverability reputation has degraded since the Twilio merger |
| AWS SES | $0 / 3000 emails first year (Worker-based), then $0.10/1k | Cheapest at scale, but requires AWS account + IAM setup overhead disproportionate to v1.3's traffic. Off-platform from Cloudflare. |
| Mailgun | 100/day free | Account verification has historically been friction-heavy for small senders |

**Resend wins** on the v1.3 specific criteria: free tier covers the workload, first-class Cloudflare Workers documentation (both sides of the integration), idempotency-key support for safe cron retries, and a three-year track record of focused transactional email deliverability.

---

## Alternatives Considered — Storage

| Option | Verdict | Reasoning |
|--------|---------|-----------|
| **Cloudflare KV** (recommended) | ✅ Use | Right shape: per-key writes/reads, 25 MiB values, 1024-byte metadata for filter-without-fetch, free tier 1k writes/day + 100k reads/day fits easily. List-with-prefix supports the cron's "find inactive sessions" scan. |
| Cloudflare D1 (SQLite) | ❌ No | User explicitly ruled out — no aggregation, no search, no joins needed. SQL surface area + migration story is overhead for the access pattern. Re-revisit if Jack ever wants per-recruiter analytics or message-level search. |
| Cloudflare R2 | ❌ No | Object storage is the wrong shape for this access pattern. R2 is for blobs measured in MB to GB; chat transcripts are KB. List operations are slower and metadata is less ergonomic than KV's. |
| Cloudflare Durable Objects | ❌ No | DOs are the right tool when you need strong consistency, transactional updates, or per-session compute (e.g. WebSocket session state). Transcript capture is append-only with eventual-read — KV is strictly simpler. DO billing also requires Workers Paid. |
| Cloudflare Queues | ❌ No (for storage) | Queues are for "fire and forget" delivery, not durable storage. **Could** be used as a complement (enqueue session-ended events for cron consumption) but adds infra without removing any. The KV-list-with-metadata-filter pattern obviates the need entirely at this scale. |

---

## What NOT to Add

| Avoid | Why |
|-------|-----|
| `@cloudflare/workers-types` package | The user already runs `wrangler types` in `pnpm build`; that command generates `worker-configuration.d.ts` directly. Installing the standalone types package duplicates the source of truth. |
| `cron` / `node-cron` / `croner` npm packages | Cloudflare Cron Triggers are platform-native and route to `scheduled()` directly. Any in-process Node cron library would not run inside the Worker (Workers are request-bound) and is irrelevant. |
| `nodemailer` | SMTP from a Worker requires raw socket support that Workers does not expose for outbound SMTP to arbitrary servers. Even via TCP sockets, nodemailer's Node-stream-based design doesn't run cleanly in workerd. Use HTTP-API-based providers (Resend, Postmark, etc.). |
| MailChannels `worker-mailchannels` etc. | Free CF integration ended 2024; legacy. |
| A queue (Cloudflare Queues) for v1.3 | The KV-with-metadata + hourly cron filter is sufficient at this traffic scale. Adding a queue introduces a second async surface (enqueue side + consume side) without simplifying anything. Revisit only if email volume ever pushes past a queue threshold (10k+ msgs/day). |
| `react-email` / `@react-email/render` | Email body for v1.3 is a single transcript dump in HTML — `<table>`-based or `<pre>`-based, escaped. React Email is overkill for one template and pulls React into the Worker bundle. Use a tagged-template-literal HTML builder with a dedicated escaper. |
| `@anthropic-ai/sdk` upgrade | Already at 0.82.0 with `cache_control` + Haiku 4.5 — no v1.3 reason to bump. |
| `wrangler` upgrade (4.83.x → newer) | 4.83.x supports `kv_namespaces` and `triggers.crons` and JSONC config. Bump only if the `wrangler types` output doesn't include `KVNamespace` (it does). |
| Astro `<ClientRouter />` | Removed in v1.1; Phase 7 architecture invariant; not relevant to v1.3. |
| Switching to Astro 7 / Tailwind v5 / etc. | None released; not relevant. |
| Workers Paid plan upgrade (just for v1.3) | Free plan covers KV (1k writes/day, 100k reads/day) + Cron Triggers (5k invocations/day) + Resend (3k emails/month). Only reason to upgrade is to get `CHAT_RATE_LIMITER` actually bound — that is a separate v1.3 tech-debt item that should be costed against its own value, not bundled into the email feature. |

---

## Confidence Assessment

| Decision | Confidence | Rationale |
|----------|------------|-----------|
| Resend over Cloudflare Email Service for v1.3 | **HIGH** | CF Email is in **public beta** — verified via Cloudflare's own [2026-04-16 changelog](https://developers.cloudflare.com/changelog/post/2026-04-16-email-sending-public-beta/) and [Email for Agents blog](https://blog.cloudflare.com/email-for-agents/). Workers Paid plan requirement verified via [pricing page](https://developers.cloudflare.com/email-service/platform/pricing/). Resend free tier and Cloudflare-Workers integration both officially documented by both vendors. |
| Resend version `^6.12.x` | **HIGH** | npm registry confirms 6.12.3 published 2026-05-08 — current stable. SDK shape stable across 4.x → 6.x for the basic `emails.send()` call. |
| Cloudflare KV over D1 | **HIGH** | User-locked decision; corroborated by access pattern analysis (no aggregation, no search, append-only, ~2k records/year ceiling). Confirmed write-rate limit (1/sec/key) is mitigable via natural debouncing in `chat.ts`. |
| Hourly cron + 2h inactivity threshold | **HIGH** | User-locked. Cron Triggers free-tier limits (5k invocations/day) easily accommodate 24/day. |
| Custom entrypoint pattern (`@astrojs/cloudflare/handler`) | **HIGH** | Confirmed against [Astro issue #13838](https://github.com/withastro/astro/issues/13838) thread, Cloudflare's TanStack parallel example, and Astro adapter docs. The `workerEntryPoint` adapter option was removed; custom-main + handler-import is the documented post-removal path. |
| `mail.jackcutrara.com` subdomain for sending | **MEDIUM** | Resend explicitly recommends subdomain isolation; standard email-deliverability practice. Specific subdomain choice is cosmetic — could equally be `transcripts.` or `notify.` Confidence is MEDIUM only because Jack hasn't confirmed which subdomain he wants; the requirements writer should solicit a choice. |
| KV `metadata` field for inactivity filter | **HIGH** | Native Cloudflare KV feature: `list()` returns metadata inline without fetching values, scoped to 1024 bytes. Schema fits comfortably (`{ last_activity_at: number, started_at: number, email_sent: boolean, message_count: number, country?: string }` ≈ 100 bytes). |
| Idempotency key on Resend sends | **HIGH** | Resend SDK and REST API both support `idempotencyKey` / `Idempotency-Key`; expires after 24h, max 256 chars. Using `sessionId + ':' + last_activity_at` as the key makes cron retries safe within the 24h window. |
| `wrangler types` is sufficient (no `@cloudflare/workers-types` install) | **HIGH** | Already in build script; verified by inspecting current `package.json`. |
| HTML-escape user-typed text in email body | **HIGH** | User-locked content-security requirement; standard practice for transactional email containing UGC. |

---

## Sources

### Cloudflare Email Service (the comparison)

- [Cloudflare Email Service: now in public beta. Ready for your agents — Cloudflare blog, 2026-04-16](https://blog.cloudflare.com/email-for-agents/) — public beta announcement (HIGH)
- [Email Sending now in public beta — Cloudflare changelog, 2026-04-16](https://developers.cloudflare.com/changelog/post/2026-04-16-email-sending-public-beta/) — official status (HIGH)
- [Cloudflare Email Service pricing](https://developers.cloudflare.com/email-service/platform/pricing/) — Workers Paid only, 3k included, $0.35/1k after (HIGH)
- [Cloudflare Email Service — Send emails docs](https://developers.cloudflare.com/email-service/get-started/send-emails/) — `send_email` binding + `env.EMAIL.send()` API (HIGH)
- [Cloudflare Email Service deliverability docs](https://developers.cloudflare.com/email-service/) — SPF/DKIM/DMARC auto-config (HIGH)
- [Cloudflare Email Service is a deliverability bet dressed as an agents launch — Jamie Lord, 2026-04-20](https://lord.technology/2026/04/20/cloudflare-email-service-is-a-deliverability-bet-dressed-as-an-agents-launch.html) — independent assessment recommending wait-and-see for revenue-critical use (MEDIUM — single analyst opinion)
- [Cloudflare Introduces Email Service to Compete with Amazon SES, Resend, and SendGrid — InfoQ, 2025-10](https://www.infoq.com/news/2025/10/cloudflare-email-service/) — original Email Sending private beta announcement context (MEDIUM)

### Resend

- [Resend npm package](https://www.npmjs.com/package/resend) — current stable 6.12.3, published 2026-05-08 (HIGH)
- [Resend: Send emails with Cloudflare Workers](https://resend.com/docs/send-with-cloudflare-workers) — Resend's official Workers integration guide (HIGH)
- [Cloudflare: Send Emails With Resend tutorial](https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/) — Cloudflare's official Resend integration tutorial (HIGH)
- [Resend Cloudflare DNS guide](https://resend.com/docs/knowledge-base/cloudflare) — Domain Connect auto-configuration of SPF/DKIM via Cloudflare DNS (HIGH)
- [Resend Send Email API reference](https://resend.com/docs/api-reference/emails/send-email) — `idempotencyKey`, request/response shape, 5 req/s rate limit (HIGH)
- [Resend Domains: DNS records introduction](https://resend.com/docs/dashboard/domains/introduction) — SPF + DKIM required, subdomain recommended (HIGH)
- [resend-cloudflare-workers-example (Resend official repo)](https://github.com/resend/resend-cloudflare-workers-example) — reference integration (HIGH)

### Cloudflare KV

- [Cloudflare KV docs (full text)](https://developers.cloudflare.com/kv/llms-full.txt) — bindings, list with metadata, write rate limits, TTL (HIGH — Context7 verified)
- [Cloudflare KV: Write key-value pairs](https://developers.cloudflare.com/kv/api/write-key-value-pairs/) — `put()` options including `metadata` (1024 bytes JSON), `expirationTtl` (min 60s), 1 write/sec/key limit (HIGH)
- [Cloudflare KV: List keys](https://developers.cloudflare.com/kv/api/list-keys/) — `list({ prefix, cursor, limit })` returns name + expiration + metadata inline (HIGH)
- [Cloudflare KV: Bindings](https://developers.cloudflare.com/kv/concepts/kv-bindings/) — `wrangler.jsonc` `kv_namespaces` array shape (HIGH)

### Cloudflare Cron Triggers + Scheduled Handler

- [Cloudflare Cron Triggers configuration](https://developers.cloudflare.com/workers/configuration/cron-triggers/) — `triggers.crons` array, cron-expression syntax, `--test-scheduled` for local testing (HIGH)
- [Cloudflare scheduled handler reference](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) — `scheduled(controller, env, ctx)` signature, `ctx.waitUntil()` semantics (HIGH)
- [Cloudflare Cron Triggers example with Hono — TypeScript](https://developers.cloudflare.com/workers/examples/cron-trigger/) — pattern for combining `fetch` + `scheduled` in one Worker (HIGH)

### Astro + Cloudflare adapter custom entrypoint

- [@astrojs/cloudflare integration docs](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) — current version, env access via `cloudflare:workers` import (HIGH)
- [Astro Cloudflare Workers framework guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/) — current entrypoint conventions (HIGH)
- [Astro issue #13838: scheduled function for cron triggers + queues](https://github.com/withastro/astro/issues/13838) — community thread on the custom-main pattern after `workerEntryPoint` adapter option removal (MEDIUM — issue, not docs, but corroborated by the parallel TanStack pattern)
- [TanStack Start custom entrypoint with cron triggers + queues](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start) — direct parallel showing `import handler from '@.../server-entry'; export default { fetch: handler.fetch, scheduled }` — same pattern adapted to Astro (HIGH)

### MailChannels (the rejected option)

- [MailChannels End of Life Notice — Cloudflare Workers](https://support.mailchannels.com/hc/en-us/articles/26814255454093-End-of-Life-Notice-Cloudflare-Workers) — free CF Workers tier ended 2024-08-31 (HIGH)
- [MailChannels migration blog post](https://blog.mailchannels.com/important-update-mailchannels-email-sending-api-for-cloudflare-workers-to-be-terminated/) — corroboration of EOL (HIGH)

### Resend vs Cloudflare email comparisons

- [Resend vs Cloudflare Email Routing — ForwardEmail blog 2026](https://forwardemail.net/en/blog/resend-vs-cloudflare-email-routing-email-service-comparison) — feature comparison (MEDIUM)
- [Cloudflare Email Routing vs Resend — ForwardEmail blog 2026](https://forwardemail.net/en/blog/cloudflare-email-routing-vs-resend-email-service-comparison) — corroborating comparison (MEDIUM)

---

*Stack research for: v1.3 Chat Visibility (additive on v1.2-locked Astro 6 + Tailwind v4 + Cloudflare Pages/Workers stack)*
*Researched: 2026-05-09*
*Verification: Resend 6.12.3 latest verified via npm registry; Cloudflare Email public-beta status verified via official changelog 2026-04-16; KV write-rate / metadata limits verified via Context7-fetched docs; @astrojs/cloudflare custom-entrypoint pattern verified against Astro issue thread + parallel TanStack docs.*
