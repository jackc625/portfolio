# Phase 17: Foundations — Migration + DNS + Debt Sweep - Research

**Researched:** 2026-05-10
**Domain:** Cloudflare Pages → Workers Static Assets migration on an Astro 6 + `@astrojs/cloudflare` stack, with Resend transactional-email DNS warming and a 5-item chat-surface tech-debt sweep
**Confidence:** HIGH (platform mechanics, custom-entrypoint pattern, DNS record shapes, debt-item code seams all verified against Context7 + installed source); MEDIUM (Gmail spam thresholds at <30/day volume — operational, not engineering)

## Summary

Phase 17 is mechanically simple but coupling-heavy: one structural change (`wrangler.jsonc` `main` switch + new `src/worker.ts`) unblocks Phases 18–20 by giving the Worker a `scheduled()` export that Pages cannot host, **and** the same phase opens the chat regression surface five separate times via the DEBT items. The only design questions left at research-time are surface-level:

- The custom-entrypoint pattern is **canonical** (Astro docs + installed `@astrojs/cloudflare/handler` 13.1.7 confirms `handle(request, env, context)` signature) — no spike needed.
- The DEBT-04 listener-dedup pattern already exists in the codebase three places (`analyticsBootstrapped`, `scrollDepthBootstrapped`, `chatBootstrapped` all guard the *bootstrap*, but `astro:page-load` listeners are still re-added on each module re-evaluation). Fix: lift the bootstrap guard from "set-once flag" to "set-once flag + `removeEventListener` on stale handler" — single-line per file.
- DEBT-05 has 95% of the work already done (`#chat-panel.is-open` already triggers the keyframe animation in `global.css:699-702`); only the imperative `panel.style.display = "flex"` flip in `chat.ts:439-445` remains.
- The Resend DNS records for a `mail.jackcutrara.com` subdomain are deterministic — Resend exposes the exact record set via the `domain.created` webhook payload, so the planner can author Cloudflare DNS entries from a known shape.

**Primary recommendation:** Treat Phase 17 as 7 sequential tasks (per CONTEXT.md D-09) with the SSE snapshot fixture as a Day 1 hard gate. The plan should not introduce parallelism that interleaves chat-surface DEBT with the migration cutover — D-09 explicitly forbids it, and the regression surface is too risky for parallel execution at junior-SWE-portfolio scale.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**A. Migration cutover & rollback**

- **D-01:** Parallel deploy + flip-domain cutover. Deploy as separate Worker first, validate against `*.workers.dev` preview with full D-15 SSE snapshot diff and full D-26 117/117, then reattach `jackcutrara.com` from Pages to Worker.
- **D-02:** Pages stays warm 24h post-flip as instant rollback. Retire after 24h of clean traffic AND no open regressions.
- **D-03:** Cloudflare Workers Builds replaces the Pages "connect to Git" UX. No GitHub Actions deploy workflow added.
- **D-04:** D-15 byte-identical proven via SSE snapshot test. Capture canonical SSE byte stream from live Pages on Day 1, commit as `tests/api/sse-snapshot.test.ts` fixture **before** any migration code commit.

**B. DNS warming execution**

- **D-05:** Resend account creation is part of Phase 17. `RESEND_API_KEY` Wrangler secret added to production AND preview environments.
- **D-06:** Sender = `"Portfolio Chat" <transcripts@mail.jackcutrara.com>`. `Reply-To: jackcutrara@gmail.com`.
- **D-07:** Throwaway `scripts/resend-warmup.mjs` (~30 LOC) executes warming sends; reuses Phase 20's locked `fetch()` pattern for `Authorization: Bearer ${RESEND_API_KEY}` + `Idempotency-Key` shape.
- **D-08:** Warming sends happen LAST in Phase 17 ordering — after migration GREEN, after all 5 DEBT items GREEN, after D-26 117/117 verified.

**C. Internal task ordering**

- **D-09:** Execution order is FIXED: (1) Day 1 SSE snapshot fixture; (2) Migration FOUND-01..04; (3) Chat-surface DEBT (DEBT-04 + DEBT-05); (4) Docs/CI DEBT (DEBT-01 + DEBT-03); (5) Observability DEBT (DEBT-02); (6) DNS-01; (7) DNS-02.
- **D-10:** D-26 cadence: every commit touching `chat.ts` / `api/chat.ts` / `global.css` / `BaseLayout.astro` / `validation.ts`, plus final phase-end gate.
- **D-11:** SSE snapshot fixture captured BEFORE migration — Day 1.
- **D-12:** Plan granularity is plan-phase's call. Hard ordering (D-09) plus exit gates (D-04, D-10) give plan-phase enough structure.

**D. Local dev workflow**

- **D-13:** Two-mode dev: `pnpm dev` = `astro dev` (HMR); add `pnpm dev:worker` = `wrangler dev` for end-to-end verification.
- **D-14:** Use Cloudflare-assigned `*.workers.dev` preview URLs. Update `src/lib/validation.ts:72` `PAGES_PREVIEW_SUFFIX` → `WORKERS_PREVIEW_SUFFIX` + the new `*.workers.dev` suffix value (captured from first deploy).
- **D-15:** Retire `scripts/pages-compat.mjs` entirely. Workers Static Assets uses `[assets] binding="ASSETS" directory="./dist/client"` directly. Remove `&& node scripts/pages-compat.mjs` from `package.json` `build`. Delete the file.

### Claude's Discretion

- Exact `src/worker.ts` line count / comment style / import order
- Whether `WORKERS_PREVIEW_SUFFIX` stays in `validation.ts` or moves to `src/lib/cors.ts`
- `scripts/resend-warmup.mjs` arg shape (`--to`, `--count`, etc.)
- Whether `scripts/resend-warmup.mjs` is committed (leaning yes) or untracked
- Naming of the SSE snapshot test file
- Exact log-line shape for DEBT-02 cache-hit observability (structured JSON fields)
- Whether DEBT-01 PROJECT.md edit also touches STATE.md / RETROSPECTIVE.md
- Postmaster Tools enrollment timing (during DNS-01 vs after first warmup send)

### Deferred Ideas (OUT OF SCOPE)

- Canary-with-traffic-split rollout — rejected (overkill for portfolio scale; one-shot has no fast rollback)
- GitHub Actions deploy workflow — Workers Builds chosen instead
- Custom preview subdomain (`preview.jackcutrara.com`) — rejected for portfolio scale
- Single-mode dev (`wrangler dev` only) — rejected for HMR speed
- Custom `workers-compat.mjs` post-build script — Workers Static Assets handles output shape natively
- `/api/resend-webhook` with Svix HMAC — explicitly v1.4+
- Workers Paid plan upgrade to bind `CHAT_RATE_LIMITER` — v1.4+; DEBT-01 is documentation-only here
- Mobile menu breakpoint todo (`2026-04-15-change-mobile-menu-breakpoint`) — out of v1.3 scope
- OG default image todo (`2026-04-15-design-and-ship-og-default-image`) — out of v1.3 scope

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Site deploys as a single Cloudflare Worker via Workers Static Assets, serving static HTML, `/api/chat`, and a `scheduled` cron handler from one binding. Pages retired. | §"Wrangler Config Shape" + §"src/worker.ts Shape" + §"Migration Cutover Mechanics" |
| FOUND-02 | Custom worker entrypoint at `src/worker.ts` re-exports Astro's `handle()` for fetch + `scheduled()` delegating to cron sweep module. `wrangler.jsonc` `main` switch. | §"src/worker.ts Shape" — canonical Astro pattern verified Context7 |
| FOUND-03 | `jackcutrara.com` reattached to Worker; preview URLs migrate `*.pages.dev` → `*.workers.dev`; CI/CD deploy command updated; rollback documented. | §"Migration Cutover Mechanics" + §"Workers Builds" + §"CORS Allow-list Update" |
| FOUND-04 | `wrangler.jsonc` declares `[assets]`, `kv_namespaces`, `triggers.crons`, dev/preview namespace IDs. MDX content collections do NOT bundle into Worker bundle. | §"Wrangler Config Shape" + §"MDX Bundling Verification" |
| DNS-01 | `mail.jackcutrara.com` verified on Resend with SPF + DKIM + MX + DMARC (`p=none` minimum) records live in Cloudflare DNS. `dig TXT _dmarc.mail.jackcutrara.com` returns valid record. | §"Resend Domain DNS Records" |
| DNS-02 | Domain warmed via 5–10 manual sends from `transcripts@mail.jackcutrara.com` to Jack's Gmail with "Not Spam" feedback. Postmaster Tools enrolled. | §"DNS Warming Mechanics" + §"Resend Warmup Script Shape" |
| DEBT-01 | `CHAT_RATE_LIMITER` binding documented for Workers Paid upgrade path. PROJECT.md "Known issues" rewritten to "documented + Free-tier acceptable." | §"DEBT-01 Documentation Rewrite" |
| DEBT-02 | Cache-hit-rate observability wired in `chat-cache.ts` / `content-snapshot.ts` / `chat.ts` emitting `cache_read_input_tokens` / `cache_creation_input_tokens` from Anthropic responses. | §"DEBT-02 Cache-Hit Log Shape" |
| DEBT-03 | `build:chat-context:check` enforced in CI via parallel job in `.github/workflows/sync-check.yml`. PRs fail-fast on local drift. | §"DEBT-03 CI Job Shape" |
| DEBT-04 | WR-01 bootstrap listener dedup at `analytics.ts:140-147`, `scroll-depth.ts:63-70`, `chat.ts:870-877`. | §"DEBT-04 Listener Dedup Pattern" |
| DEBT-05 | `#chat-panel` JS-coupled display contract decoupled. `.is-open` controls BOTH display AND animation; `animatePanelOpen` no longer flips `style.display`. | §"DEBT-05 CSS-Only State Machine" |
| TEST-01 | D-26 chat regression battery 117/117 GREEN at end of every phase touching the chat surface. | §"Validation Architecture" — D-26 cadence per D-10 |
| TEST-02 | D-15 server byte-identical at `/api/chat` after migration. No new SSE frame types. | §"D-15 SSE Snapshot Test Mechanics" |
| TEST-03 | Anthropic prompt cache integrity — sessionId NEVER inside `system` block or `messages[0]` payload. 3x identical-payload live test → cache hit on responses 2,3. | §"TEST-03 Cache-Integrity Snapshot" |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Static HTML / CSS / JS asset delivery | CDN / Static (Worker via `[assets]` binding) | — | Workers Static Assets is the canonical replacement for Pages static delivery. No tier change vs. today; just binding name `ASSETS` continues to point at `./dist/client`. |
| `/api/chat` SSE endpoint | API / Backend (Worker `fetch` handler) | — | Already SSR; migration preserves byte-identical surface (D-15). |
| `scheduled()` cron handler | API / Backend (Worker default export) | — | Pages cannot host this. Phase 17 declares the export with a no-op stub; Phase 19 fills the body. Tier choice is forced by platform mechanics (Pitfall 0). |
| KV namespace declaration | Database / Storage (Worker binding `CHAT_KV`) | — | Phase 17 declares `kv_namespaces` with placeholder IDs only — no read/write code yet. Phase 18 binds and uses. |
| Wrangler secret management | API / Backend (Worker secrets) | — | `RESEND_API_KEY` is added in Phase 17 alongside the existing `ANTHROPIC_API_KEY` pattern. Same tier. |
| DNS records (SPF/DKIM/MX/DMARC) | External (Cloudflare DNS, not the Worker) | — | Pure DNS — no code surface. Cloudflare dashboard authoring; verification via `dig`. |
| `astro:page-load` lifecycle (DEBT-04) | Browser / Client (`src/scripts/*.ts` modules) | — | Lives entirely in the client bundle. Idempotent guard pattern; no server tier touch. |
| `#chat-panel` display state (DEBT-05) | Browser / Client (CSS + DOM class toggle) | — | CSS-only state machine; chat.ts removes the imperative `style.display` flip. No server tier touch. |
| Cache-hit observability (DEBT-02) | API / Backend (server-side `console.log` in Anthropic response handlers) + Browser / Client (chat client log seam) | — | Anthropic cache token counts come from the SSE response object (`message_start` event `usage` field) — server-side. Client-side seam mirrors what the server already emits for client-tier debugging. |
| `build:chat-context:check` CI gate | CDN / Static (build pipeline) | — | Pure CI/CD; runs in GitHub Actions. No runtime tier impact. |

## Standard Stack

### Core (NEW for Phase 17, atop existing v1.2 stack)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `wrangler` | 4.83.x (already installed) | Workers deploy + bindings + secrets management | [VERIFIED: package.json line 50] Already at 4.83.0; supports `[assets]`, `kv_namespaces`, `triggers.crons`, JSONC. No bump needed. |
| `@astrojs/cloudflare` | 13.1.7 (already installed); 13.5.0 latest | Astro adapter — exposes `handle()` for the custom worker entrypoint | [VERIFIED: node_modules/@astrojs/cloudflare/package.json] 13.1.7 has the `./handler` export. [VERIFIED: npm view @astrojs/cloudflare version 2026-05-07] 13.5.0 latest stable. **Recommendation: stay on 13.1.7** — bumping introduces unbounded D-26 risk; minor version bumps to the adapter are out of scope per Phase 17's "minimize regression surface" anchor. |
| Cloudflare Workers KV (platform) | n/a (binding) | Phase 17 declares the namespace shape; Phase 18 reads/writes | [CITED: developers.cloudflare.com/kv/concepts/kv-bindings/] `kv_namespaces` array with `binding`, `id`, `preview_id`. Phase 17 uses placeholder IDs created via `wrangler kv namespace create CHAT_KV`. |
| Cloudflare Cron Triggers (platform) | n/a (declared in `triggers.crons`) | Phase 17 declares `triggers` block (no schedule yet); Phase 19 sets `["0 * * * *"]` | [CITED: developers.cloudflare.com/workers/configuration/cron-triggers/] Workers-only; explicitly NOT supported on Pages (Pitfall 0 in research/PITFALLS.md). |
| Resend (REST endpoint, not SDK) | n/a (HTTPS API at `https://api.resend.com/emails`) | Phase 17 verifies the sending domain + executes warmup sends; Phase 20 wraps the same `fetch()` shape | [CITED: developers.cloudflare.com/workers/tutorials/send-emails-with-resend/] REST avoids Node deps in Workers. The warmup script intentionally exercises the same call shape Phase 20 will use. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | 4.1.x (already installed) | SSE snapshot test runner; D-26 battery; new tests for DEBT-04 / DEBT-05 / cache-hit logs | [VERIFIED: package.json line 49] Already in use. New tests in `tests/api/`, `tests/client/`, `tests/build/` follow existing conventions. |
| Native `dig` (or `nslookup` on Windows) | OS tool | DNS-01 verification (`dig TXT _dmarc.mail.jackcutrara.com`) | [CITED: REQUIREMENTS.md DNS-01] Spec'd verification command. On Windows, `nslookup -type=TXT _dmarc.mail.jackcutrara.com` is the native equivalent; `dig` requires WSL or BIND tools install. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom `src/worker.ts` re-exporting `handle()` | Continue with `"main": "@astrojs/cloudflare/entrypoints/server"` | The Astro adapter's `entrypoints/server` only exports `{ fetch: handle }` — cannot add `scheduled()`. Custom entrypoint is **mandatory** for Phase 19's cron. [VERIFIED: node_modules/@astrojs/cloudflare/dist/entrypoints/server.d.ts shows `_default: { fetch: typeof handle }`]. |
| `[assets]` binding (default behavior) | Add `run_worker_first: true` to assets config | [CITED: cloudflare/workers/static-assets/migration-guides/migrate-from-pages] `run_worker_first: true` runs the Worker on EVERY request, even for static assets. **Reject:** the chat endpoint is opt-in via `prerender = false`; static asset paths should NOT hit the Worker. Astro adapter handles route dispatch correctly without `run_worker_first`. |
| Resend npm SDK | Resend REST via `fetch()` | [CITED: research/STACK.md MAIL-01 lock] REST avoids Node deps in Workers, zero new runtime deps. Phase 20 uses REST; Phase 17's warmup script must match. |
| Postmark / SendGrid / SES | Resend | [LOCKED: STATE.md v1.3 architectural decisions 2026-05-09] Resend chosen at milestone scope; not re-litigated. |
| In-memory listener-set guard | Module-level `removeEventListener` before `addEventListener` | [ASSUMED] Both work. Module-level remove-then-add is more defensive against module-cache hot-paths; in-memory Set is more typical. Pick remove-then-add per "defense in depth" — see DEBT-04 §. |

**Installation:**

No new npm dependencies. Phase 17 is a pure-config phase for the migration; Resend warmup uses native `fetch()`.

```bash
# CHAT_KV namespace creation (one-time, before wrangler.jsonc edits land)
npx wrangler kv namespace create CHAT_KV
npx wrangler kv namespace create CHAT_KV --preview

# Resend secret (one-time, after Resend account creation)
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CHAT_RECIPIENT_EMAIL    # jackcutrara@gmail.com
npx wrangler secret put CHAT_SENDER_EMAIL       # "Portfolio Chat" <transcripts@mail.jackcutrara.com>
```

**Version verification:**

[VERIFIED: 2026-05-10 via npm view] `@astrojs/cloudflare` latest 13.5.0 (published 2026-05-07). Currently installed: 13.1.7. **Recommendation:** do NOT bump in Phase 17. The `./handler` export is identical between 13.1.7 and 13.5.0, and bumping risks adapter behavior drift mid-migration.

[VERIFIED: package.json] `wrangler@4.83.0` is current. No bump needed. Documented support for all required `wrangler.jsonc` keys.

## Architecture Patterns

### System Architecture Diagram

```
                        BEFORE (current — Cloudflare Pages)
                                jackcutrara.com
       ┌──────────────────────────────────────────────────────────┐
       │  Pages static hosting                                    │
       │   ├── HTML / CSS / JS / fonts / images (./dist/client)   │
       │   └── _worker.js (Pages Function — runs on /api/*)       │
       │       └── @astrojs/cloudflare handle()                   │
       │            └── src/pages/api/chat.ts (SSE)               │
       └──────────────────────────────────────────────────────────┘
                wrangler.jsonc.main = @astrojs/cloudflare/entrypoints/server
                build emits dist/client + dist/server, scripts/pages-compat.mjs
                restructures into Pages magic _worker.js + _routes.json layout

                        AFTER (Phase 17 — Workers Static Assets)
                                jackcutrara.com
       ┌──────────────────────────────────────────────────────────┐
       │  Single Cloudflare Worker (one deployment, one binding)  │
       │                                                          │
       │  src/worker.ts (NEW custom entrypoint)                   │
       │   ├── fetch(req, env, ctx)                               │
       │   │     └── handle(req, env, ctx)  [Astro adapter]       │
       │   │           ├── env.ASSETS → ./dist/client (static)    │
       │   │           └── /api/chat (SSE — D-15 byte-identical)  │
       │   │                                                      │
       │   └── scheduled(controller, env, ctx)                    │
       │         └── ctx.waitUntil(noopStub())  ← Phase 19 fills  │
       │                                                          │
       │  Bindings declared in wrangler.jsonc:                    │
       │   ├── [assets] binding=ASSETS dir=./dist/client          │
       │   ├── kv_namespaces=[{binding: CHAT_KV, ...placeholder}] │
       │   └── triggers.crons=[]  ← Phase 19 sets ["0 * * * *"]   │
       └──────────────────────────────────────────────────────────┘
                wrangler.jsonc.main = ./src/worker.ts
                build emits dist/client (consumed by [assets]) +
                  the bundled Worker JS (managed by adapter, no
                  pages-compat.mjs restructure step).
```

**Cutover dataflow:**

```
Day 1:  capture SSE byte-stream from live Pages /api/chat → tests/api/sse-snapshot.test.ts
        commit fixture (BEFORE any migration code)

Day 2+: edit wrangler.jsonc + author src/worker.ts + remove pages-compat.mjs
        deploy as NEW Worker `jack-cutrara-portfolio-worker` (or rename)
        validate on *.workers.dev preview against fixture (BYTE-IDENTICAL)
        run D-26 117/117 against preview (GREEN)
        flip jackcutrara.com custom domain from Pages → Worker (1-click)
        Pages stays warm for 24h (rollback path)

Day 3+: migration GREEN → DEBT-04 → DEBT-05 → DEBT-01 → DEBT-03 → DEBT-02
        D-26 cadence: every chat-surface commit + final phase-end gate

Day N:  DNS-01 (records in Cloudflare) → DNS-02 (5-10 warmup sends + Postmaster Tools)
        retire Pages project after 24h clean window AND no open regressions
```

### Recommended Project Structure

```
src/
├── worker.ts                NEW — custom Worker entrypoint (~30 LOC)
│                            re-exports Astro handle() + adds scheduled() stub
├── pages/api/chat.ts        UNCHANGED in Phase 17 (D-15 byte-identical anchor)
├── lib/
│   ├── validation.ts        EDIT: PAGES_PREVIEW_SUFFIX → WORKERS_PREVIEW_SUFFIX (rename)
│   ├── chat-cache.ts        EDIT: DEBT-02 cache-hit log seam
│   └── content-snapshot.ts  EDIT: DEBT-02 cache-hit log seam
├── scripts/
│   ├── chat.ts              EDIT: DEBT-04 dedup + DEBT-05 remove style.display flip + DEBT-02 client log seam
│   ├── analytics.ts         EDIT: DEBT-04 dedup
│   └── scroll-depth.ts      EDIT: DEBT-04 dedup
└── styles/global.css        EDIT: DEBT-05 ensure .is-open controls display + animation
                              (already animates — only need display rule)

scripts/
├── pages-compat.mjs         DELETE (D-15)
├── resend-warmup.mjs        NEW (~30 LOC) — Phase 20-pattern fetch() to Resend
├── build-chat-context.mjs   UNCHANGED
└── sync-projects.mjs        UNCHANGED

tests/
├── api/sse-snapshot.test.ts NEW — D-15 byte-identical fixture (Day 1)
├── api/security.test.ts     EDIT: portfolio-5wl.pages.dev → workers.dev preview suffix
├── client/                  NEW: tests for DEBT-04 listener idempotency
└── build/                   NEW: tests for DEBT-05 CSS state machine + DEBT-02 log shape

.github/workflows/sync-check.yml  EDIT: add parallel job for build:chat-context:check

wrangler.jsonc                EDIT: main switch + kv_namespaces + triggers + secrets list
package.json                  EDIT: build chain — drop && node scripts/pages-compat.mjs
                              ADD: dev:worker = wrangler dev
PROJECT.md                    EDIT: DEBT-01 "Known issues" rewrite
```

### Pattern 1: Custom Worker Entrypoint with `fetch` + `scheduled`

**What:** A single `src/worker.ts` exports `{ fetch, scheduled }` satisfying `ExportedHandler<Env>`. `fetch` delegates to Astro's `handle()`; `scheduled` delegates (via `ctx.waitUntil`) to a Phase 19 module that doesn't yet exist — Phase 17 ships the import path with a no-op stub.

**When to use:** Mandatory for any Astro-on-Workers deployment that needs `scheduled()` (cron) or `queue()` handlers. Astro's bundled `entrypoints/server` only exports `{ fetch: handle }` — it cannot accept additional handlers.

**Example:**

```typescript
// src/worker.ts (NEW, ~30 LOC)
// Source: https://docs.astro.build/en/guides/integrations-guide/cloudflare
// (Standard Cloudflare Worker Export Handler — Context7 verified 2026-05-10)
import { handle } from "@astrojs/cloudflare/handler";

// Phase 19 will create src/lib/chat-delivery.ts with deliverDue(env).
// Phase 17 ships only the import path + a no-op stub.
async function noopScheduledStub(_env: Env): Promise<void> {
  // Intentionally empty — Phase 19 fills with deliverDue(env) per CRON-01.
}

export interface Env {
  ASSETS: Fetcher;                    // existing — Workers Static Assets binding
  CHAT_KV: KVNamespace;               // NEW — declared in wrangler.jsonc, unused in Phase 17
  ANTHROPIC_API_KEY: string;          // existing
  RESEND_API_KEY: string;             // NEW — Phase 17 secret
  CHAT_RECIPIENT_EMAIL: string;       // NEW — Phase 17 secret
  CHAT_SENDER_EMAIL: string;          // NEW — Phase 17 secret
  CHAT_RATE_LIMITER?: RateLimit;      // existing carry-forward (DEBT-01: documented Free-tier)
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    return handle(request, env, ctx);
  },
  async scheduled(_controller, env, ctx): Promise<void> {
    ctx.waitUntil(noopScheduledStub(env));
  },
} satisfies ExportedHandler<Env>;
```

**Verification:** [VERIFIED: node_modules/@astrojs/cloudflare/dist/utils/handler.d.ts] confirms `handle(request: Request, env: Env, context: ExecutionContext): Promise<CfResponse>`. Existing `dist/entrypoints/server.d.ts` exports `default: { fetch: typeof handle }` — the new `worker.ts` is a strict superset (adds `scheduled`).

### Pattern 2: Wrangler Config Shape (FOUND-04)

**What:** `wrangler.jsonc` declares all bindings, secrets list (by reference), and the cron block — even when Phase 17 doesn't use the KV namespace yet. Future phases bind without further wrangler edits.

**Example:**

```jsonc
// wrangler.jsonc — Phase 17 target shape
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "jack-cutrara-portfolio",  // SAME name keeps Workers Builds wired to existing repo
  "main": "./src/worker.ts",         // CHANGED from @astrojs/cloudflare/entrypoints/server
  "compatibility_date": "2026-04-04",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist/client"
  },
  // Phase 18 will use; declared here so wrangler types regenerates with the binding
  "kv_namespaces": [
    {
      "binding": "CHAT_KV",
      "id": "<production-id-from-wrangler-kv-namespace-create>",
      "preview_id": "<preview-id-from-wrangler-kv-namespace-create-preview>"
    }
  ],
  // Phase 19 will set ["0 * * * *"]; declared here so the structure is in place
  "triggers": {
    "crons": []
  },
  // Astro 6 + Workers Builds Preview URLs — replaces Pages preview semantics
  "preview_urls": true
}
```

**Source:** [VERIFIED via Context7 2026-05-10] cloudflare/workers/static-assets/migration-guides/migrate-from-pages — `[assets] binding="ASSETS" directory="./dist/client"` is the canonical shape; `preview_urls: true` enables Pages-equivalent automatic preview deployments.

### Pattern 3: DEBT-04 Listener Dedup — Module-Level Remove-Then-Add

**What:** The current bootstrap pattern uses a module-level `*Bootstrapped = true` flag. Problem: HMR re-evaluation of the module (and edge cases under `astro:before-preparation`) can re-add the listener even when the flag is true on a different evaluation. Fix: store the registered handler reference and call `removeEventListener` first.

**Anti-pattern (current code at `analytics.ts:144-147`):**
```typescript
let analyticsBootstrapped = false;
if (typeof document !== "undefined" && !analyticsBootstrapped) {
  analyticsBootstrapped = true;
  document.addEventListener("astro:page-load", initAnalytics);  // duplicate-able
  if (document.readyState !== "loading") {
    initAnalytics();
  } else {
    document.addEventListener("DOMContentLoaded", initAnalytics);
  }
}
```

**Idempotent pattern (recommended):**
```typescript
// Idempotent astro:page-load listener registration.
// Defense-in-depth: remove any previously-registered handler reference
// before adding, even if the bootstrap guard appears to have prevented re-entry.
// Mitigates module re-evaluation under HMR + view-transition lifecycle edge cases.
if (typeof document !== "undefined") {
  document.removeEventListener("astro:page-load", initAnalytics);
  document.addEventListener("astro:page-load", initAnalytics);
  // DOMContentLoaded fires once per document; the guard pattern is sufficient there.
  if (document.readyState !== "loading") {
    initAnalytics();
  } else {
    document.removeEventListener("DOMContentLoaded", initAnalytics);
    document.addEventListener("DOMContentLoaded", initAnalytics);
  }
}
```

**Why remove-then-add over a Set:** The `removeEventListener` API is a no-op when the handler reference isn't already registered, so the pattern is safe to call unconditionally. Function-reference equality is stable as long as `initAnalytics` is module-scoped (it is). No need for a separate `WeakSet<EventListener>` — the browser's internal listener registry is already keyed on `(target, type, handler)` and dedups idempotently when called with the same handler reference.

**Three call sites (per CONTEXT.md):**
- `src/scripts/analytics.ts:140-147` — `initAnalytics`
- `src/scripts/scroll-depth.ts:63-70` — wait, the line range there is actually the `initScrollDepth` function body (lines 45-67); the bootstrap is at 74-83. The scope of edit is the bootstrap block. Same shape.
- `src/scripts/chat.ts:893-903` — `chatBootstrapped` block; same shape.

[VERIFIED: source files read 2026-05-10] All three files already use the same bootstrap pattern (module-level flag + addEventListener for `astro:page-load` + readyState check + DOMContentLoaded fallback). The fix is mechanical: replace each `addEventListener` with `removeEventListener` + `addEventListener`.

### Pattern 4: DEBT-05 CSS-Only `#chat-panel` State Machine

**What:** The `.is-open` class currently triggers the keyframe animation in `global.css:699-702` but does NOT control `display`. The imperative `panel.style.display = "flex"` flip in `chat.ts:439-441` (`animatePanelOpen`) is what makes the panel visible. Decoupling: `.is-open` controls both.

**Existing CSS (already correct for animation):**
```css
/* global.css:691-713 */
#chat-panel {
  transform-origin: bottom right;
  /* TODO Phase 17 DEBT-05: add display: none here */
}

@media (prefers-reduced-motion: no-preference) {
  #chat-panel.is-open {
    animation: chat-panel-scale-in 180ms ease-out forwards;
    /* TODO Phase 17 DEBT-05: add display: flex here OR use the rule below */
  }
}

#chat-panel.is-open {
  /* TODO Phase 17 DEBT-05: NEW rule — display state OUTSIDE the no-preference
     media query so reduced-motion users still see the panel. */
}
```

**Recommended target shape:**
```css
/* Display contract — outside the no-preference media query so it applies to
 * reduced-motion users too (the animation is gated; the visibility is not). */
#chat-panel {
  display: none;
  transform-origin: bottom right;
}

#chat-panel.is-open {
  display: flex;
}

/* Entrance animation — only when motion is allowed. */
@media (prefers-reduced-motion: no-preference) {
  #chat-panel.is-open {
    animation: chat-panel-scale-in 180ms ease-out forwards;
  }
}

@keyframes chat-panel-scale-in {
  from { transform: scale(0.96); opacity: 0; }
  to   { transform: scale(1.0);  opacity: 1; }
}
```

**chat.ts edits (lines 439-445):**
```typescript
// BEFORE (current — DEBT-05 violation: imperative style flip)
async function animatePanelOpen(panel: HTMLElement): Promise<void> {
  panel.style.display = "flex";
}
async function animatePanelClose(panel: HTMLElement): Promise<void> {
  panel.style.display = "none";
}

// AFTER — no-op (the .is-open class toggle in showPanel/hidePanel does it)
async function animatePanelOpen(_panel: HTMLElement): Promise<void> {
  // CSS controls display via .is-open class (DEBT-05 closure).
  // Function retained as no-op so call sites in showPanel/hidePanel
  // (which await it for keyframe-completion timing) don't change shape.
}
async function animatePanelClose(_panel: HTMLElement): Promise<void> {
  // Same.
}
```

**CSS gotchas verified:**
- `display: none` blocks animation entry — but `display: flex` set BEFORE the `animation` declaration means the `chat-panel-scale-in` keyframes apply to the now-displayed element on the same frame the class is added. Browser handles this correctly. [VERIFIED: existing global.css:699-702 already animates from `.is-open` — only display was missing.]
- `@starting-style` (CSS WG draft, recently shipping in browsers) is NOT needed here because `display: none → flex` doesn't kick off the animation on its own; the explicit `animation` property does. `@starting-style` is for the future case "transition-from-display-none" which we don't use.
- `content-visibility: auto` is irrelevant — the panel is in the DOM, just hidden via `display`.

### Pattern 5: DEBT-02 Cache-Hit Log Shape

**What:** Anthropic returns prompt-cache hit/miss token counts in the `usage` field of the `message_start` SSE event. Surface them as structured logs at three seams.

**Anthropic response shape (CITED: docs.claude.com/en/docs/build-with-claude/prompt-caching):**

The streaming SDK exposes `usage` on the `message_start` event:
```typescript
{
  type: "message_start",
  message: {
    usage: {
      input_tokens: number,
      cache_read_input_tokens: number,    // hit: tokens served from cache
      cache_creation_input_tokens: number, // miss: tokens written to cache
      output_tokens: number
    }
  }
}
```

**Recommended log seam shape (planner finalizes structured fields):**

```typescript
// In api/chat.ts inside the SSE start(controller) block, after each
// event from response is read:
if (event.type === "message_start") {
  const usage = event.message.usage;
  console.log("chat.cache_metrics", {
    cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
    cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,  // populated on message_delta, log delta later
  });
}
```

Three seams per CONTEXT.md:
- `src/lib/chat-cache.ts` — emits when cache populates / serves
- `src/lib/content-snapshot.ts` — emits when context snapshot rebuilds
- `src/scripts/chat.ts` — client-side log seam mirrors server log shape (same field names) for browser-tier debugging via `chat:analytics` event or `console.log`

**Why structured JSON:** Cloudflare's `wrangler tail --format pretty` and the Workers Logs dashboard both parse JSON-shaped log lines, enabling future query/filter; bare strings are opaque. Phase 18 META-02 captures the same fields per-turn into KV transcript metadata — log shape and metadata shape align.

### Anti-Patterns to Avoid

- **Add a new SSE frame type to inform client of cache hit/miss.** D-15 byte-identical forbids this. Cache observability is server-side log + (Phase 18) per-turn metadata. Client-side log seam exists for debugging only and does NOT enqueue new SSE frames.
- **Bump `@astrojs/cloudflare` 13.1.7 → 13.5.0 mid-migration.** Even if 13.5.0 is current. Adapter behavior drift compounds with the entrypoint switch — un-debuggable failure mode. Bump in v1.4+ if needed.
- **Use `run_worker_first: true` in `[assets]`.** Wrong tier — would route static asset GETs through the Worker. Astro adapter dispatches routes correctly without it.
- **Hardcode the `*.workers.dev` preview suffix.** Per CONTEXT.md specifics: the suffix is `${worker_name}.${account_subdomain}.workers.dev` — **only knowable after first deploy**. The plan must capture this from the first preview URL and only then update `validation.ts:72` + `tests/api/security.test.ts:79-97`.
- **Move chat-surface DEBT into the same commit as the migration cutover.** D-09 forbids it. Each opens the chat regression surface independently; coupling them makes D-26 failures un-bisect-able.
- **Use `wrangler dev` as the only dev mode.** D-13 explicitly preserves `pnpm dev` = `astro dev` for HMR speed. Two-mode story.
- **Pages compatibility scripts.** D-15: `scripts/pages-compat.mjs` is deleted, not "kept just in case." Workers Static Assets has zero use for `_worker.js` magic filename or `_routes.json` shape.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Worker entrypoint shim | Custom request-routing logic that calls the Astro adapter manually | `import { handle } from "@astrojs/cloudflare/handler"` | Astro adapter handles all route dispatch, MDX content, SSR routes, asset binding. Hand-rolling would require re-implementing `dist/server` integration. [VERIFIED: handler.d.ts] |
| Build output restructure for Workers | Replicate `pages-compat.mjs` shape for Workers | Workers Static Assets `[assets] directory="./dist/client"` reads Astro's adapter output natively | The whole point of the migration is removing the Pages-specific shim. Workers' `[assets]` consumes adapter output as-is. |
| Cron schedule registration | External scheduler (GitHub Actions cron, third-party uptime poke) hitting an authenticated endpoint | Cloudflare `triggers.crons` declared in wrangler.jsonc | Native, free on Workers Free tier (5k cron invocations/day vs our ~24/day target). External schedulers add a non-Cloudflare moving piece. |
| DNS record authoring | Hand-compose SPF / DKIM / MX / DMARC strings | Resend "Add Domain" UI returns the canonical record set; Cloudflare DNS dashboard authors them | Resend's `domain.created` API response (and dashboard) returns ready-to-paste record values. SPF/DKIM/MX values are derived from Resend's AWS SES upstream — not user-authored. [CITED: resend.com/docs/api-reference/domains/create-domain] |
| SSE byte-stream snapshot diffing | `JSON.parse + assert message-by-message` semantic comparison | Capture raw bytes from `Response.body` reader as a fixture; compare with `Buffer.equals()` | D-15 says **byte-identical**, not "semantically equivalent." A semantic diff would silently allow a key-order change in the JSON payload — that's a D-15 amendment. The test must compare bytes, not structure. |
| Preview URL CORS suffix detection | Code that introspects the request hostname at runtime to allow any `*.workers.dev` | Hardcoded `WORKERS_PREVIEW_SUFFIX` constant captured from first deploy | Phase 7 D-9 explicitly rejected `endsWith()`-based suffix matching as bypassable. The constant is load-bearing security; capturing it post-first-deploy keeps the Phase 7 contract. |
| Listener-set tracking for DEBT-04 | `WeakSet<EventListener>` of registered handlers | `removeEventListener` before `addEventListener` (idempotent by browser API contract) | Browser's internal `(target, type, handler)` registry already dedups by reference equality. Adding a Set is duplicate state. |
| Chat panel display animation | JavaScript-driven `animate()` API or `requestAnimationFrame` loop | CSS keyframes triggered by `.is-open` class | Already done — keyframes exist at `global.css:699-713`. DEBT-05 just removes the imperative JS half that's doing the same thing. |

**Key insight:** Phase 17 has near-zero "build something new" work. It's almost entirely deletes (pages-compat.mjs, imperative style flips, Pages-specific suffix) and config rewrites (wrangler.jsonc, sync-check.yml, PROJECT.md). The one "new code" piece (`src/worker.ts` ~30 LOC) is a verbatim copy of Astro's documented Standard Cloudflare Worker Export Handler pattern.

## Runtime State Inventory

This phase is a **migration phase** — Pages → Workers is by definition a runtime-state-affecting cutover. Inventory:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | None — Phase 17 declares `kv_namespaces` but does not write. The newly-created CHAT_KV namespace starts empty. The existing Astro `SESSION` KV namespace (auto-injected by `@astrojs/cloudflare`) is per-Worker and resets on the new Worker; the chat surface does not use it (verified — no `env.SESSION` reads in `api/chat.ts`). | No data migration. Document in PLAN that CHAT_KV is created and bound but unused until Phase 18. |
| **Live service config** | (1) Cloudflare custom domain `jackcutrara.com` route currently bound to Pages project — must be reattached to the new Worker. (2) Cloudflare Pages "connect to Git" deploy hook must be retired and replaced by Cloudflare Workers Builds Git connection — both UI-only operations, no git-trackable artifacts. (3) Wrangler secrets `ANTHROPIC_API_KEY` (already exists) must be re-added to the new Worker (secrets are per-Worker, do not transfer from Pages project). | Manual cutover steps in PLAN: (a) `wrangler secret put ANTHROPIC_API_KEY` on the new Worker; (b) custom domain reattach via Cloudflare dashboard; (c) Workers Builds Git connection setup. (d) Pages project retirement after 24h clean window. |
| **OS-registered state** | None. No Windows Task Scheduler / launchd / systemd / pm2 entries reference the project. | None. |
| **Secrets/env vars** | (1) `ANTHROPIC_API_KEY` — currently bound on Pages, must re-bind on Worker (secrets are per-deployment). (2) NEW: `RESEND_API_KEY`, `CHAT_RECIPIENT_EMAIL`, `CHAT_SENDER_EMAIL` — bind on both production AND preview Worker environments per D-05. (3) The `CHAT_RATE_LIMITER` binding (Free-tier defensive-skip path) is a binding, not a secret — declared in wrangler.jsonc only on Workers Paid; current code path defensively-skips when absent and DEBT-01 documents this as v1.3-acceptable. | (a) Re-add `ANTHROPIC_API_KEY` to the new Worker via `wrangler secret put`. (b) Add 3 new secrets per D-05/D-06. (c) DO NOT add `CHAT_RATE_LIMITER` binding — Free-tier acceptable per CONTEXT.md DEBT-01 lock. |
| **Build artifacts / installed packages** | (1) `dist/client/_worker.js` and `dist/client/_routes.json` — generated by `scripts/pages-compat.mjs`, will stop being generated once the script is deleted (D-15). (2) `dist/client/chunks/*` and `dist/client/virtual_astro_middleware.mjs` — also generated by `pages-compat.mjs`; Workers Static Assets uses Astro adapter's `dist/server` output directly via internal bundler integration. (3) Workers Builds will execute `pnpm build` on first deploy — needs `dist/client` to exist with the post-build shape Workers Static Assets expects. | (a) Verify locally that `pnpm build` (with `pages-compat.mjs` removed and `wrangler.jsonc.main` switched) produces a deploy-able tree; `wrangler deploy` should succeed against a `*.workers.dev` preview before any production cutover. (b) `.gitignore` already covers `dist/`, no source-tree debris. |
| **Pre-existing Worker bindings** | The current Pages Function deployment auto-injects `ASSETS`, `IMAGES`, and `SESSION` (Astro Sessions KV) bindings. The new Worker must declare `ASSETS` explicitly in wrangler.jsonc (per FOUND-04). `IMAGES` is automatic via `@astrojs/cloudflare`'s integration. `SESSION` is automatic via the Astro Sessions API config (no chat-surface impact). | Declare `ASSETS` per FOUND-04. Verify `IMAGES` and `SESSION` continue to auto-inject; if not, add to wrangler.jsonc. |

**Canonical question (per researcher template):** *After every file in the repo is updated and the new Worker is deployed, what runtime systems still have the old "Pages" string cached, stored, or registered?*

**Answer:**
1. The Cloudflare Pages project itself (`portfolio-5wl.pages.dev`) — retire after 24h clean window per D-02.
2. Browser localStorage `chat-history` keys on returning visitors — unchanged across migration; localStorage is origin-keyed (`jackcutrara.com`), so persists.
3. Cached static asset URLs (`*.portfolio-5wl.pages.dev/*`) — preview URLs only; production traffic was on `jackcutrara.com` (custom domain) and is unaffected.
4. The `PAGES_PREVIEW_SUFFIX = ".portfolio-5wl.pages.dev"` constant in `validation.ts:72` and the security test at `tests/api/security.test.ts:79-97` — code-level rename per D-14.
5. `package.json` `build` script chain — code-level edit per D-15.

## Common Pitfalls

(Phase 17-specific. Cross-references milestone-level pitfalls in `.planning/research/PITFALLS.md` for items #0, #5, #6, #7.)

### Pitfall 1: SSE Snapshot Fixture Captured AFTER Migration Code Lands

**What goes wrong:** The fixture commit lands on the same branch as `wrangler.jsonc` edits, or after the new Worker is deployed. Once the live `/api/chat` is the new Worker, the "ground truth" for D-15 is the new Worker — circular validation. Plan-time decision: capture against live PAGES production before any migration code exists.

**Why it happens:** Branch-and-PR developer instinct says "do all the work on one branch, then verify." D-11 explicitly inverts this: capture FIRST, on a clean main, before any migration code.

**How to avoid:** Plan-phase makes Day 1 task ID `T-17-01` (or equivalent) "Capture SSE snapshot fixture against live `https://jackcutrara.com/api/chat`, commit to main with NO other migration changes, then proceed." Make this the first commit of the phase, before the wrangler edits.

**Warning signs:** Branch dance where the fixture commit is part of the same PR as `wrangler.jsonc` edits. Plan-time test plan that says "validate D-15 after preview deploy" without specifying capture timing.

### Pitfall 2: SSE Bytes Are Not Deterministic Without Fixture Control

**What goes wrong:** A naive SSE snapshot captures whatever bytes the live API streams for an arbitrary `messages` payload. Anthropic's response varies token-by-token; the fixture would never match twice in a row.

**Why it happens:** SSE byte-stream byte-identical-ness depends on the SERVER bytes wrapping the response, NOT the assistant's variable text. The fixture must isolate the server frame structure (`data: {"text":"..."}\n\n`, `data: [DONE]\n\n`, frame ordering, `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `Content-Encoding: none` headers) — not the Anthropic-generated text.

**How to avoid:** The fixture has TWO layers:
1. **Header snapshot:** capture all response headers as JSON; assert byte-identical (header names + values).
2. **Frame structure snapshot:** capture the SSE frame *shape* — count and order of frame types (`data: {text:...}`, `data: {truncated:true}` if applicable, `data: {error:true}` if applicable, `data: [DONE]`), each frame's `data:`-prefix and `\n\n`-suffix bytes, but NOT the variable assistant text. Mock Anthropic responses to make the text deterministic OR use a fixture that asserts:
   - First byte of each frame is exactly `d` (start of `data:`)
   - Each frame ends with exactly `\n\n` (two LF bytes — no CR)
   - Final frame is exactly `data: [DONE]\n\n` (literal byte match)
   - Number of `data:` frames matches expectation

**Recommended:** Mock Anthropic at the test seam (mocking `Anthropic.messages.create`'s streaming iterator) so the assistant text is deterministic, then assert raw byte equality on the resulting Response body. This is the cleanest D-15 fixture.

[VERIFIED: existing tests/api/chat.test.ts likely already mocks Anthropic — planner verifies before authoring the snapshot test.]

### Pitfall 3: Workers Builds Doesn't Exist for the Worker Yet

**What goes wrong:** Plan-phase assumes Workers Builds is already wired and writes deploy steps as `git push → automatic deploy → preview URL`. But on Day 1 the Pages project has the Git connection; the new Worker has none. First Worker deploys are MANUAL via `wrangler deploy`.

**Why it happens:** The migration is a UX-equivalent swap (Pages "connect to Git" → Workers Builds "connect to Git"), but the wiring is one-time and explicit per Cloudflare dashboard.

**How to avoid:** PLAN must include explicit "Set up Workers Builds Git integration in Cloudflare dashboard" as a discrete task before the second Worker deploy. First deploy is `wrangler deploy` from local. Subsequent deploys flow through Workers Builds. [VERIFIED via Context7: cloudflare/workers/ci-cd/builds — explicit two-step setup: connect repo, configure build/deploy commands `npm run build` + `npx wrangler deploy`.]

**Warning signs:** Plan-phase task description "push to main → CI deploys" without an antecedent "configure Workers Builds Git connection" task.

### Pitfall 4: `*.workers.dev` Preview URL Is Account-Specific And Not Knowable Pre-Deploy

**What goes wrong:** Plan-phase pre-commits a value for `WORKERS_PREVIEW_SUFFIX` based on guessed account subdomain. Test suite at `tests/api/security.test.ts:79-97` is updated with a wrong suffix; CORS allow-list silently rejects all preview URLs.

**Why it happens:** The full preview URL is `${worker_name}.${cloudflare_account_subdomain}.workers.dev` — `cloudflare_account_subdomain` is set when the user creates their Cloudflare account and is invisible until first deploy.

**How to avoid:** Sequence the work as:
1. First deploy to `*.workers.dev` (suffix unknown).
2. Capture the actual hostname from the deploy log or dashboard.
3. Update `WORKERS_PREVIEW_SUFFIX` constant + test suite.
4. Re-deploy to test the updated CORS allow-list.

This is a 4-step commit sequence that PLAN must surface; otherwise step 3 is forgotten and preview-URL CORS silently fails (no symptoms until someone tries to use the preview URL).

### Pitfall 5: Resend Domain Verification is Async — Records Take Up To 72h

**What goes wrong:** PLAN treats DNS-01 as a single task. In reality: (1) author records in Cloudflare DNS dashboard, (2) wait for Cloudflare propagation (minutes to hours), (3) wait for Resend's verifier to re-poll (up to 24h), (4) potentially retry record syntax. Phase 17 stalls if the planner expected synchronous verification.

**Why it happens:** Cloudflare DNS propagation is fast (seconds to minutes for new records on Cloudflare's authoritative servers), but Resend's verification poller runs on its own schedule, and DNS TXT record values are notoriously fiddle-prone (escaping, quote characters, leading whitespace).

**How to avoid:** Plan DNS-01 as TWO tasks: (a) "Author records in Cloudflare DNS, verify with `dig`" (synchronous), (b) "Verify Resend dashboard shows all records green" (async — may need a re-check after 1-24h). Don't block the rest of Phase 17 on (b); DNS-02 warming sends require (b) GREEN, but DEBT items don't.

**Warning signs:** PLAN with DNS-01 as a sub-30-minute task. Real timing: 30 min DNS authoring + N hours waiting for Resend propagation.

### Pitfall 6: Pages-Compat Script Removal Without Build Verification

**What goes wrong:** D-15 deletes `scripts/pages-compat.mjs` and the `&& node scripts/pages-compat.mjs` from `package.json`. If the build doesn't produce a Workers-deployable tree without the script, the next deploy fails.

**Why it happens:** `pages-compat.mjs` performs Pages-specific restructure: copies `dist/server/chunks/*`, copies `entry.mjs` to `_worker.js`, writes `_routes.json`. Workers Static Assets doesn't need any of this — it consumes Astro adapter's output directly. But the planner can't verify the new build shape without actually running `pnpm build` and `wrangler deploy --dry-run`.

**How to avoid:** Plan a discrete verification task: after `pages-compat.mjs` deletion + `wrangler.jsonc.main` switch + `src/worker.ts` author, run `pnpm build && wrangler deploy --dry-run` locally. If the dry-run rejects, fix before pushing.

**Warning signs:** Plan order that does (1) edit wrangler.jsonc, (2) author worker.ts, (3) delete pages-compat, (4) push and rely on Workers Builds without local verification.

### Pitfall 7: D-26 Battery Run Cadence Misinterpretation

**What goes wrong:** Plan-phase reads "D-26 every chat-surface commit" as "D-26 in CI on every push." But the existing chat regression battery is local-only (`pnpm test`), and there's no CI workflow that runs the full vitest suite — only `sync-check.yml` runs `pnpm sync:check`.

**Why it happens:** D-10's "every commit that touches chat surface" is an executor-discipline directive, not a CI directive. The agent doing the work runs `pnpm test` locally before each commit; CI doesn't enforce.

**How to avoid:** PLAN names "run `pnpm test` before commit" as an explicit step on each chat-surface task. Optionally, propose adding a CI workflow for `pnpm test` — but that's a separate todo, NOT Phase 17 scope (would expand DEBT-03).

**Warning signs:** PLAN task that says "CI verifies D-26" without identifying the workflow file. Look at `.github/workflows/` — only `sync-check.yml` exists.

### Pitfall 8: DEBT-02 Log Volume on Free-Tier Workers

**What goes wrong:** Cloudflare Workers Free tier has a Workers Logs daily volume cap. If DEBT-02 emits one structured log line per chat turn × N field × debug-grade verbosity, the cap can hit on a recruiter-link-on-LinkedIn day.

**Why it happens:** `console.log` in Workers ships to Workers Logs / `wrangler tail`. Free tier has a daily ingestion limit (currently ~200K events / 5M lines depending on plan).

**How to avoid:** Single structured-JSON log line per Anthropic response (NOT per token) at the seam where `message_start.usage` is captured. ~2-5 log lines per chat turn including the existing `chat.truncated` warn. At <30 chats/day this is comfortably under any free-tier cap. Don't emit one line per cache field.

[ASSUMED] The 200K/day Workers Logs cap is approximate; verify against current Cloudflare pricing if log volume grows. At Phase 17 scale this is not a binding constraint.

### Pitfall 9: Wrangler Secrets Are Per-Worker, Not Per-Account

**What goes wrong:** Plan assumes `ANTHROPIC_API_KEY` "carries over" from the Pages project to the new Worker. It doesn't. Secrets are scoped to the Worker (or Pages project) that owns them.

**Why it happens:** Cloudflare's secret model is per-Worker. The Pages project has its own secret store; the new Worker has its own.

**How to avoid:** PLAN includes explicit "re-add `ANTHROPIC_API_KEY` to new Worker via `wrangler secret put` (using same value from Pages)" task. Document the pre-cutover secret-add so the preview deploy can stream Anthropic responses correctly.

### Pitfall 10: D-15 Amendment Risk When Phase 18 Lands

**What goes wrong:** Phase 17 sets a strict D-15 byte-identical anchor. Phase 18 will introduce `ctx.waitUntil(appendTurn(...))` calls in `api/chat.ts` — which is a planned D-15 amendment per REQUIREMENTS.md cross-phase notes. If Phase 17 doesn't document the snapshot fixture test name + the pre-Phase-18 amendment expectation, Phase 18 trips the test and looks like a regression.

**Why it happens:** The fixture is forever-binding unless explicitly amended.

**How to avoid:** Phase 17's snapshot test file MUST include a comment naming the planned amendment ("Phase 18 will add ctx.waitUntil calls; the SSE byte-stream MUST remain identical (waitUntil never enqueues SSE frames). If this test fails in Phase 18, verify the failure is in headers/frame-shape, not in waitUntil timing."). The fixture validates BYTE-IDENTICAL on the SSE response stream itself — `ctx.waitUntil` runs out-of-band and does NOT modify response bytes, so the fixture should pass into Phase 18 unchanged. Document this expectation.

## Code Examples

### `src/worker.ts` (FOUND-02 — the canonical entrypoint)

```typescript
// Source: https://docs.astro.build/en/guides/integrations-guide/cloudflare
// (Standard Cloudflare Worker Export Handler — Context7 verified 2026-05-10)
// Phase 17: scheduled() is a no-op stub. Phase 19 will replace the body
// with `ctx.waitUntil(deliverDue(env, controller.scheduledTime))`.

import { handle } from "@astrojs/cloudflare/handler";

export interface Env {
  ASSETS: Fetcher;
  CHAT_KV: KVNamespace;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
  CHAT_RECIPIENT_EMAIL: string;
  CHAT_SENDER_EMAIL: string;
  // Phase 7 carry-forward: defensive-skip when absent (Free-tier acceptable per DEBT-01).
  CHAT_RATE_LIMITER?: RateLimit;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    return handle(request, env, ctx);
  },
  async scheduled(_controller, _env, ctx): Promise<void> {
    // Phase 19 fills with: ctx.waitUntil(deliverDue(_env, _controller.scheduledTime));
    // Stub kept here so wrangler.jsonc triggers.crons declaration is wireable
    // in Phase 19 with a single ./worker.ts edit (no entrypoint change needed).
    ctx.waitUntil(Promise.resolve());
  },
} satisfies ExportedHandler<Env>;
```

### `wrangler.jsonc` (FOUND-04 target shape)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "jack-cutrara-portfolio",
  "main": "./src/worker.ts",
  "compatibility_date": "2026-04-04",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist/client"
  },
  "kv_namespaces": [
    {
      "binding": "CHAT_KV",
      "id": "REPLACE_WITH_PROD_ID_FROM_WRANGLER_KV_CREATE",
      "preview_id": "REPLACE_WITH_PREVIEW_ID_FROM_WRANGLER_KV_CREATE_PREVIEW"
    }
  ],
  "triggers": {
    "crons": []
  },
  "preview_urls": true
}
```

### `package.json` `build` script edit (D-15)

```diff
   "scripts": {
     "dev": "astro dev",
+    "dev:worker": "wrangler dev",
-    "build": "pnpm build:chat-context && wrangler types && astro check && astro build && node scripts/pages-compat.mjs",
+    "build": "pnpm build:chat-context && wrangler types && astro check && astro build",
     "build:chat-context": "node scripts/build-chat-context.mjs",
```

### `src/lib/validation.ts` rename (D-14)

```diff
-// Cloudflare Pages project hostname. Only subdomains of this hostname
-// (preview deployments of THIS project) pass CORS — not every *.pages.dev site.
-// The "-5wl" random suffix is Cloudflare-assigned at project creation and is
-// load-bearing: it prevents another Cloudflare Pages user from registering a
-// colliding `portfolio.pages.dev` project and bypassing this check. If this
-// project is ever renamed, update this constant in lockstep — do NOT shorten
-// the suffix to a non-random form.
-const PAGES_PREVIEW_SUFFIX = ".portfolio-5wl.pages.dev";
+// Cloudflare Workers preview hostname. Only subdomains of this hostname
+// (preview deployments of THIS Worker) pass CORS — not every *.workers.dev site.
+// The {worker_name}.{account_subdomain} prefix is Cloudflare-assigned at
+// account creation + Worker name and is load-bearing: it prevents another
+// Cloudflare user from registering a colliding Worker name and bypassing
+// this check. If the Worker is ever renamed, update this constant in lockstep.
+// VALUE captured from first *.workers.dev preview deploy — do NOT hand-construct.
+const WORKERS_PREVIEW_SUFFIX = ".<account-subdomain>.workers.dev";  // TBD: capture from deploy log
```

### `.github/workflows/sync-check.yml` (DEBT-03)

```diff
 jobs:
   check:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - name: Setup pnpm
         uses: pnpm/action-setup@v4
         with:
           version: 10
       - name: Setup Node.js
         uses: actions/setup-node@v4
         with:
           node-version: 22
           cache: pnpm
       - name: Install dependencies
         run: pnpm install --frozen-lockfile
-      - name: Verify Projects/ <-> MDX sync is clean
-        run: pnpm sync:check
+      - name: Verify Projects/ <-> MDX sync is clean
+        run: pnpm sync:check
+      - name: Verify portfolio-context.json is in sync with sources
+        run: pnpm build:chat-context:check
```

(Single job with two run steps; matches the existing pattern in this 35-line workflow. CONTEXT.md says "parallel job" — planner picks shape; combining-into-one-job is simpler and has identical fail-fast behavior because both run sequentially in the same job and the second only runs if the first passes. If true parallelism is desired, split into two jobs. **Recommendation: single-job two-step** — saves a second `actions/checkout@v4` + `pnpm install` cycle, ~30s faster on cold runs.)

### `scripts/resend-warmup.mjs` (D-07 throwaway, ~30 LOC)

```javascript
#!/usr/bin/env node
// Phase 17 D-07: throwaway warmup-sends script. Reuses Phase 20's locked
// fetch() shape (REST, not SDK) so this script doubles as a Phase 20 dry-run.
// Run: RESEND_API_KEY=... node scripts/resend-warmup.mjs --to jackcutrara@gmail.com --count 5

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith("--")) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);
const to = args.to ?? "jackcutrara@gmail.com";
const count = Number(args.count ?? 5);
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("RESEND_API_KEY env var is required");
  process.exit(1);
}

for (let i = 1; i <= count; i++) {
  const sessionId = crypto.randomUUID();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `warmup/${sessionId}`,
    },
    body: JSON.stringify({
      from: '"Portfolio Chat" <transcripts@mail.jackcutrara.com>',
      to,
      reply_to: "jackcutrara@gmail.com",
      subject: `[Portfolio chat] warmup ${i}/${count} — ${sessionId.slice(0, 8)}`,
      text: `This is a deliverability warmup send (${i} of ${count}).\nFrom: chat widget on jackcutrara.com — domain warming, no visitor message.`,
    }),
  });
  if (!res.ok) {
    console.error(`warmup ${i}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const body = await res.json();
  console.log(`warmup ${i}: id=${body.id} idempotency=warmup/${sessionId}`);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@astrojs/cloudflare` adapter `workerEntryPoint` config option | `wrangler.jsonc` `main` switch + `import { handle } from "@astrojs/cloudflare/handler"` | Astro 5+ removed the adapter option | Phase 17 uses the new pattern. [VERIFIED Context7: docs.astro.build/en/guides/integrations-guide/cloudflare] "The custom `workerEntryPoint` configuration in the adapter options has been removed. Instead, specify your custom entrypoint in your Wrangler configuration." |
| Cloudflare Pages "connect to Git" | Cloudflare Workers Builds | Workers Builds GA'd 2024-09-26; functional parity by 2025 | D-03 lock. Same dashboard UX; pointed at the new Worker instead of the Pages project. |
| `_worker.js` + `_routes.json` Pages convention | `[assets] binding="ASSETS" directory="./dist/client"` Workers convention | Workers Static Assets full-feature-parity migration path documented 2025 | D-15 deletes `pages-compat.mjs`. Workers Static Assets reads Astro adapter output directly. |
| Cloudflare Email Sending (NEW option, public beta 2026-04-16) | Resend (chosen at v1.3 milestone) | Cloudflare Email Sending beta — not GA | [LOCKED at STATE.md milestone scope] Re-evaluate at Cloudflare Email GA + Workers Paid migration. Not Phase 17's call. |
| MailChannels free Workers tier | Resend | MailChannels EOL'd 2024-08-31 | [LOCKED at v1.3 milestone] |

**Deprecated/outdated:**
- `scripts/pages-compat.mjs` — deleted in this phase (D-15). The Pages-specific `_worker.js` + `_routes.json` restructure is unnecessary on Workers Static Assets.
- `PAGES_PREVIEW_SUFFIX` constant name — renamed to `WORKERS_PREVIEW_SUFFIX` (D-14).
- `wrangler pages deploy` command in any local docs/runbooks (if present) — replaced by Workers Builds (Git push) or `wrangler deploy` (manual).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Workers Logs free-tier daily cap is approximately 200K events / 5M lines | Pitfall 8 | Plan over-engineers DEBT-02 log shape unnecessarily. Verify against current Cloudflare pricing if traffic grows. |
| A2 | The current `tests/api/chat.test.ts` already mocks `Anthropic.messages.create` (or has a test seam for it) | Pitfall 2 | If true: SSE snapshot can re-use the existing mock. If false: planner authors a new mock as part of the snapshot test. Low risk — at worst adds 30 LOC to the snapshot test. |
| A3 | The 24-hour Pages-as-rollback window is a calendar window, not a hard deadline; retire-Pages can slip to 48h or longer if a regression surfaces at hour 23 | CONTEXT.md specifics + Pitfall plan-time | None — CONTEXT.md already calls this out as a "gated check" not a timer. Surfaced as assumption to ensure planner doesn't write the retire-Pages task as a hard timer. |
| A4 | Cloudflare Workers Builds requires the Cloudflare account to have Worker creation rights AND access to the Git provider connection — both are likely already set up since the Pages project is git-connected today, but the Workers Git connection is a separate dashboard flow | Pitfall 3 | Plan-time risk: if the Workers Git connection adds friction the planner hasn't accounted for, Day 2's "first push to main triggers Workers Build" can stall. Mitigation: PLAN includes "Set up Workers Builds Git connection" as a discrete pre-deploy task. |
| A5 | The 1-click "reattach custom domain" flow in Cloudflare dashboard works for the Pages → Worker switch without intermediate DNS changes (since the domain is already on Cloudflare DNS pointing at Cloudflare-managed targets) | Pitfall plan-time | Plan-time risk: if domain reattach requires a DNS record edit (CNAME flatten, etc.), add a manual DNS step. Low risk — Cloudflare's standard custom-domain flow handles this. |
| A6 | The DEBT-04 listener-dedup pattern (remove-then-add) is sufficient at the bootstrap level without needing a centralized listener registry | DEBT-04 § | Plan-time risk: if a future refactor introduces dynamic listener registration (e.g., a plugin system), the pattern won't scale. Out of scope for v1.3. |
| A7 | DMARC `p=none` on `mail.jackcutrara.com` (subdomain) does NOT propagate up to `jackcutrara.com` (apex) — i.e., apex has no DMARC record today, and adding one to the subdomain doesn't affect apex reputation | CONTEXT.md specifics | None — CONTEXT.md already states this is the standard Resend pattern. Surfaced as assumption to remind the planner not to author DMARC at the apex during DNS-01. |
| A8 | `tests/api/chat.test.ts` and other existing tests are NOT skipped or `.todo` — they all currently run as part of `pnpm test` | Validation Architecture | Plan-time risk: if some tests are skipped, the "117/117" count needs verification. Low risk — D-26 lock at v1.2 was 117/117 GREEN; pre-Phase-17 baseline assumed unchanged. |

## Open Questions

1. **What is the exact Cloudflare account subdomain for `*.workers.dev` preview URLs?**
   - What we know: Format is `${worker_name}.${cloudflare_account_subdomain}.workers.dev`. Worker name is `jack-cutrara-portfolio` (from current `wrangler.jsonc`).
   - What's unclear: The `cloudflare_account_subdomain` part — set when Jack created his Cloudflare account, visible in the Workers dashboard.
   - Recommendation: PLAN sequences this as: (a) first deploy → capture URL from log/dashboard, (b) update `WORKERS_PREVIEW_SUFFIX` constant + test suite, (c) re-deploy. Don't attempt to pre-fill the constant.

2. **Does the current Cloudflare Pages project use Cloudflare Access or any auth gating on preview URLs?**
   - What we know: CONTEXT.md doesn't mention it; production traffic is on `jackcutrara.com` (custom domain) not preview URL.
   - What's unclear: Whether preview deploys currently require auth (some teams add Access policies).
   - Recommendation: If yes, replicate on the Workers preview URL; if no, leave Workers preview URLs public per Cloudflare default. Verify in Cloudflare Pages project settings before cutover.

3. **Should the SSE snapshot fixture be regenerated automatically, or pinned forever?**
   - What we know: D-15 says "byte-identical phase-wide" and the fixture is the source of truth.
   - What's unclear: How the fixture handles Phase 18's planned `ctx.waitUntil` amendment — the fixture should NOT need to change (waitUntil doesn't modify SSE bytes), but if it does, the regeneration policy needs documenting.
   - Recommendation: Pin forever; document that regeneration requires explicit D-15 amendment in plan-time.

4. **Is `wrangler dev` known to work with the current local environment (Windows, PowerShell, pnpm 10)?**
   - What we know: D-13 locks `pnpm dev:worker` = `wrangler dev`. The user has run `wrangler types` as part of `pnpm build` historically.
   - What's unclear: Whether `wrangler dev` itself has any Windows-specific friction (workerd binary, miniflare loopback) that would warrant a fallback to `wrangler dev --remote`.
   - Recommendation: First task in the dev-workflow plan — verify `wrangler dev` boots locally; if it doesn't, document `--remote` flag fallback and update D-13 plan accordingly.

5. **Postmaster Tools enrollment timing — during DNS-01 or after first warmup send?**
   - What we know: CONTEXT.md "Claude's Discretion" leaves this open.
   - What's unclear: Postmaster Tools verifies via DNS TXT record OR via uploaded HTML file. DNS TXT verification can run in parallel with Resend domain verification.
   - Recommendation: Enroll DURING DNS-01 — author the Postmaster Tools verification TXT record alongside the SPF/DKIM/MX/DMARC records. Single DNS-author session vs two.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All build steps | ✓ | 22.x | — |
| pnpm | Build/test/install | ✓ | 10.x (per CI workflow) | — |
| wrangler | Workers deploy + types + dev:worker mode | ✓ | 4.83.0 (devDependency) | — |
| `@astrojs/cloudflare` | Astro adapter for Workers | ✓ | 13.1.7 (installed); 13.5.0 latest | — |
| Cloudflare account access | wrangler deploy + Workers Builds dashboard + DNS authoring + custom domain reattach + secret put | ✓ (assumed — Pages project is live) | — | — |
| Cloudflare DNS for `jackcutrara.com` | DNS-01 SPF/DKIM/MX/DMARC authoring | ✓ (assumed — apex is on Cloudflare) | — | — |
| Resend account | DNS-01 domain verification + DNS-02 warmup sends + Phase 20 production | ✗ — created in Phase 17 (D-05) | — | None — must be created |
| `dig` (or equivalent) | DNS-01 verification command | ✓ on macOS/Linux/WSL; ✗ on bare Windows PowerShell | — | `nslookup -type=TXT _dmarc.mail.jackcutrara.com` is the Windows-native equivalent; output format differs but result is verifiable. |
| Gmail account | DNS-02 inbox-vs-spam manual verification | ✓ — `jackcutrara@gmail.com` | — | — |
| Google Postmaster Tools enrollment | DNS-02 deliverability monitoring | ✗ — created in Phase 17 (DNS-02) | — | None — must be created |

**Missing dependencies with no fallback:**
- Resend account (must be created in Phase 17 per D-05)
- Postmaster Tools enrollment (must be created in DNS-02)

**Missing dependencies with fallback:**
- `dig` on Windows — use `nslookup`. PLAN references both.

## Validation Architecture

> Phase 17 honors `workflow.nyquist_validation: true` per `.planning/config.json:19`. Section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `vitest` 4.1.x |
| Config file | `vitest.config.*` (verify exists; current setup uses defaults via `package.json` `test` script) |
| Quick run command | `pnpm test` (full suite — D-26 battery is fast, mocked LLM) |
| Full suite command | `pnpm test` (same — vitest doesn't sub-divide unless we add `--testPathPattern`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Worker deploys successfully serving static + /api/chat + scheduled | smoke (deploy + curl) | `pnpm build && wrangler deploy --dry-run`; on `*.workers.dev` preview: `curl https://<preview>/` returns 200; `curl -X POST https://<preview>/api/chat -d '...'` returns SSE | ❌ Wave 0 (manual smoke; no automated test) |
| FOUND-02 | `src/worker.ts` exports `{ fetch, scheduled }` satisfying `ExportedHandler<Env>` | unit (build-time) | `tests/build/worker-entrypoint.test.ts` — assert source contains `export default {`, `fetch:`, `scheduled:`, `import { handle }` | ❌ Wave 0 |
| FOUND-03 | `jackcutrara.com` resolves to Worker; CORS allow-list includes new preview suffix | smoke (curl) + unit | `tests/api/security.test.ts` updated for `WORKERS_PREVIEW_SUFFIX`; manual: `curl -I https://jackcutrara.com` returns CF-Worker headers | ✅ test exists (security.test.ts:79-97); ❌ smoke |
| FOUND-04 | `wrangler.jsonc` declares `[assets]`, `kv_namespaces`, `triggers.crons`; build excludes MDX | unit (build-time) | `tests/build/wrangler-shape.test.ts` — JSON.parse `wrangler.jsonc` and assert keys present; `tests/build/no-mdx-in-worker-bundle.test.ts` — assert `dist/_worker.js/index.js` (or new path) does NOT contain MDX content body strings | ❌ Wave 0 |
| DNS-01 | SPF/DKIM/MX/DMARC records resolve | smoke (manual) | `dig TXT _dmarc.mail.jackcutrara.com`; `dig TXT mail.jackcutrara.com` (SPF); `dig CNAME *._domainkey.mail.jackcutrara.com` (DKIM); `dig MX mail.jackcutrara.com`. Resend dashboard "verified" status check | ❌ manual-only (DNS) |
| DNS-02 | 5-10 sends from warmup script land in Gmail Inbox | smoke (manual) | `RESEND_API_KEY=... node scripts/resend-warmup.mjs --count 5`; manual inbox check | ❌ manual-only (deliverability) |
| DEBT-01 | PROJECT.md "Known issues" entry reflects Free-tier acceptable | unit (build-time) | `tests/build/project-md-debt-01.test.ts` — read `PROJECT.md`, assert it does NOT contain "carry-forward gap" for `CHAT_RATE_LIMITER` and DOES contain "Free-tier acceptable" | ❌ Wave 0 |
| DEBT-02 | Cache-hit logs emit at 3 seams | unit (mocked Anthropic response) | `tests/api/cache-hit-logs.test.ts` — mock `console.log`, drive a chat turn, assert `chat.cache_metrics` log line emitted with expected JSON shape | ❌ Wave 0 |
| DEBT-03 | CI fails when `portfolio-context.json` is stale | smoke (manual + CI) | `.github/workflows/sync-check.yml` runs `pnpm build:chat-context:check`; verify by inducing drift on a test branch and confirming PR fails | ❌ Wave 0 (CI gate verifiable only via PR) |
| DEBT-04 | `astro:page-load` listeners register exactly once after multiple bootstraps | unit (jsdom) | `tests/client/listener-dedup.test.ts` — re-import each module N times, count document listeners on `astro:page-load`, assert N=1 | ❌ Wave 0 |
| DEBT-05 | `#chat-panel` shows/hides via `.is-open` class only; no `style.display` flip | unit (jsdom + source assertion) | `tests/client/chat-panel-display.test.ts` — toggle `.is-open`, assert `getComputedStyle(panel).display` matches expected; `tests/build/no-imperative-display-flip.test.ts` — grep `chat.ts` for `style.display` and assert no matches in `animatePanel*` functions | ❌ Wave 0 |
| TEST-01 | D-26 chat regression battery 117/117 GREEN | regression | `pnpm test` (full suite) | ✅ existing battery |
| TEST-02 | D-15 server byte-identical at /api/chat | regression (snapshot) | `tests/api/sse-snapshot.test.ts` — capture against fixture, assert byte equality | ❌ Wave 0 (Day 1 task) |
| TEST-03 | sessionId NOT in `system` block or `messages[0]` payload | unit | `tests/api/anthropic-payload-shape.test.ts` — snapshot `messages.create` arg shape, assert sessionId absent. Live verification: 3x identical-payload requests within 5min via `wrangler tail` showing `cache_read_input_tokens > 0` on responses 2,3 | ❌ Wave 0 (snapshot test); ❌ live (manual) |

### Sampling Rate

- **Per task commit (chat-surface):** `pnpm test` (full battery — fast because mocked LLM); D-10 directive
- **Per task commit (non-chat):** `pnpm test` (still cheap; but allowed to skip if commit is purely DNS / docs / CI-yaml)
- **Per wave merge:** `pnpm test` + `pnpm build` (verify build chain works post-DEBT-XX)
- **Phase gate:** Full `pnpm test` GREEN + manual D-15 SSE byte-identical verified + manual DNS-01 records verified + manual DNS-02 first 5 sends in Inbox + Postmaster Tools enrolled

### Wave 0 Gaps

The current test suite covers the existing chat surface (per D-26 117/117) but does NOT cover Phase 17's specific work. Wave 0 must author:

- [ ] `tests/api/sse-snapshot.test.ts` — D-15 SSE byte-identical fixture (Day 1, BEFORE migration code) — covers TEST-02
- [ ] `tests/api/cache-hit-logs.test.ts` — DEBT-02 structured-log shape assertion
- [ ] `tests/api/anthropic-payload-shape.test.ts` — TEST-03 cache-integrity snapshot
- [ ] `tests/build/worker-entrypoint.test.ts` — FOUND-02 source-text assertion
- [ ] `tests/build/wrangler-shape.test.ts` — FOUND-04 wrangler.jsonc keys present
- [ ] `tests/build/no-mdx-in-worker-bundle.test.ts` — FOUND-04 MDX content not in Worker bundle
- [ ] `tests/build/no-imperative-display-flip.test.ts` — DEBT-05 `chat.ts` grep
- [ ] `tests/build/project-md-debt-01.test.ts` — DEBT-01 PROJECT.md text assertion
- [ ] `tests/client/listener-dedup.test.ts` — DEBT-04 idempotency
- [ ] `tests/client/chat-panel-display.test.ts` — DEBT-05 CSS state machine

Existing tests requiring **edit** (not new authoring):
- [ ] `tests/api/security.test.ts:79-97` — update suffix from `.portfolio-5wl.pages.dev` → captured `*.workers.dev` value (D-14)

No framework install needed; vitest 4.1.0 already in place.

## Security Domain

> Required because `security_enforcement` is implicit (no `false` flag in config). Phase 17 has discrete security touchpoints around the cutover.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No user auth in v1.3 (chat is anonymous; sessionId is identifier, not auth) |
| V3 Session Management | no | sessionId arrives in Phase 18; Phase 17 doesn't introduce session state |
| V4 Access Control | yes | CORS allow-list for `/api/chat` — must update `PAGES_PREVIEW_SUFFIX` → `WORKERS_PREVIEW_SUFFIX` without loosening logic (D-14). The existing `endsWith()` plus exactly-one-non-empty-label-before-suffix check (validation.ts:88-91) is the binding security control. |
| V5 Input Validation | yes (existing) | Zod validation in `validation.ts` — unchanged in Phase 17 |
| V6 Cryptography | yes | Wrangler secrets (`RESEND_API_KEY`, `ANTHROPIC_API_KEY`) — Cloudflare manages encryption-at-rest. Phase 17 adds new secrets via `wrangler secret put`. NEVER hardcode. |
| V14 Configuration | yes | wrangler.jsonc binding shape; secret bindings; cron declaration. Misconfiguration risk is high during cutover. |

### Known Threat Patterns for Phase 17

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `*.workers.dev` preview suffix bypass via subdomain confusion | Spoofing | Reuse existing `endsWith()` + exactly-one-non-empty-label-before-suffix check from validation.ts:88-91 against the new suffix. Suffix-confusion attack tested at security.test.ts:95-99 — keep the same test, just retarget. |
| Wrangler secret leakage in repo / CI logs | Information Disclosure | Secrets via `wrangler secret put` only — never in `wrangler.jsonc`, never in env files committed. The `RESEND_API_KEY`/`CHAT_*_EMAIL` per D-05/D-06 are added via secret-put. CI logs masked by Cloudflare. |
| DMARC misconfiguration → email spoofing of jackcutrara.com | Spoofing | DMARC at `p=none` minimum on `mail.jackcutrara.com` (subdomain). Apex (jackcutrara.com) has no DMARC change in Phase 17 — recruiter outreach reputation untouched. |
| Cloudflare Pages → Workers cutover replay window | Tampering / Repudiation | 24h Pages-stays-warm rollback (D-02) is the mitigation for "deploy-borked-it" scenarios. The window itself is NOT a security risk because both deploys are TLS-terminated by Cloudflare with the same custom-domain certificate. |
| Resend API key exposure in warmup script | Information Disclosure | `scripts/resend-warmup.mjs` reads from `process.env.RESEND_API_KEY` only — no key checked into repo. PLAN: instruct user to `$env:RESEND_API_KEY = "..."` (PowerShell) or `export RESEND_API_KEY=...` (bash) before running, NOT to inline. |
| `CHAT_RATE_LIMITER` defensive-skip code path is unchanged in Phase 17 | Denial of Service | Free-tier acceptable per DEBT-01 lock. Phase 17 does NOT add the binding (Workers Paid required). The code path's `if (rateLimiter)` guard is the existing mitigation — no change. |
| Anthropic prompt-cache invalidation via accidental sessionId leak | Information Disclosure (latency-side-channel) + Cost | TEST-03 snapshot test asserts sessionId NEVER in `system` or `messages[0]`. Phase 17 doesn't introduce sessionId yet (Phase 18), so this is a forward-defense. DEBT-02 cache-token observability gives a detection signal. |
| Wrangler secrets per-Worker scoping (Pitfall 9) | Misconfiguration / Repudiation | Plan-time discipline: PLAN explicitly lists "re-add `ANTHROPIC_API_KEY` to new Worker" as a discrete task. Without it, the new Worker's `/api/chat` returns 500. |

## Sources

### Primary (HIGH confidence)

- [VERIFIED via Context7 2026-05-10] [Astro Docs — Cloudflare adapter custom worker entrypoint](https://docs.astro.build/en/guides/integrations-guide/cloudflare) — Standard Cloudflare Worker Export Handler pattern; `import { handle } from "@astrojs/cloudflare/handler"`; `wrangler.jsonc` `main` switch
- [VERIFIED via Context7 2026-05-10] [Cloudflare Workers — scheduled handler reference](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled) — `scheduled(controller, env, ctx)` signature, `ctx.waitUntil()` semantics
- [VERIFIED via Context7 2026-05-10] [Cloudflare Workers Static Assets migration from Pages](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages) — `[assets] binding="ASSETS" directory="./dist/client"` shape; `preview_urls: true`; `run_worker_first` rejected for our use
- [VERIFIED via Context7 2026-05-10] [Cloudflare Workers Builds CI/CD](https://developers.cloudflare.com/workers/ci-cd/builds) — Git-integration setup; build/deploy command shape; preview deployment via `wrangler versions upload`
- [VERIFIED via Context7 2026-05-10] [Cloudflare wrangler dev with --test-scheduled](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled) — `/__scheduled?cron=...` test endpoint
- [VERIFIED via Context7 2026-05-10] [Resend domain create API](https://resend.com/docs/api-reference/domains/create-domain) — DNS record set returned (SPF MX, SPF TXT, DKIM CNAME × 3, optional Tracking CNAME)
- [VERIFIED via Context7 2026-05-10] [Resend BIMI / DMARC docs](https://resend.com/docs/dashboard/domains/bimi) — example DMARC record string format
- [VERIFIED 2026-05-10] [npm view @astrojs/cloudflare] — version 13.5.0 latest (published 2026-05-07); installed 13.1.7 has `./handler` export
- [VERIFIED 2026-05-10 via local file inspection] `node_modules/@astrojs/cloudflare/dist/utils/handler.d.ts` — `handle(request: Request, env: Env, context: ExecutionContext): Promise<CfResponse>` signature confirmed
- [VERIFIED 2026-05-10 via local file inspection] `node_modules/@astrojs/cloudflare/dist/entrypoints/server.d.ts` — exports `default: { fetch: typeof handle }`, confirming the new entrypoint is a strict superset
- [Internal] `.planning/research/SUMMARY.md` — milestone-level architecture
- [Internal] `.planning/research/STACK.md` — alternatives rejection rationale (Cloudflare Email Service beta, MailChannels EOL)
- [Internal] `.planning/research/ARCHITECTURE.md` — `src/worker.ts` shape; `ctx.waitUntil` discipline
- [Internal] `.planning/research/PITFALLS.md` — Critical Pitfalls #0 (Pages no cron), #5 (D-26 invariants), #6 (Anthropic cache integrity), #7 (Gmail spam classification on new From-domain)
- [Internal] CONTEXT.md — 15 locked decisions for Phase 17

### Secondary (MEDIUM confidence)

- [Cloudflare Email Sending pricing — Workers Paid only](https://developers.cloudflare.com/email-service/platform/pricing/) — informs why we're not using it (re-evaluate at GA)
- [Cloudflare Workers Logs free-tier ingestion limits — approximate](https://developers.cloudflare.com/workers/observability/logs/) — informs DEBT-02 log volume

### Tertiary (LOW confidence)

- [Pitfall 8 cache-hit-rate observability cap] — Workers Logs daily cap is approximate. Verify at scale.
- [Assumption A2 — current chat.test.ts mocks Anthropic] — verify before authoring SSE snapshot test.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every Phase 17 stack item is either already installed (verified package.json) or platform-native (verified Context7).
- Architecture: HIGH — custom-entrypoint pattern is the documented Astro 6 path; verified against installed 13.1.7 source.
- Pitfalls: HIGH for Cloudflare-platform mechanics; MEDIUM for Gmail spam thresholds at <30/day volume (operational, not engineering).
- DNS records: HIGH — Resend exposes the canonical record set via API; planner pastes from Resend dashboard.
- DEBT items: HIGH — all 5 DEBT items have specific file:line anchors; DEBT-04/05 patterns verified against existing code.

**Research date:** 2026-05-10

**Valid until:** 2026-06-10 (30 days). Re-verify if:
- `@astrojs/cloudflare` releases a major version bump (currently 13.x; v14 would invalidate the `./handler` export path).
- Cloudflare Email Sending hits GA (would re-open the Resend-vs-CF-Email decision at v1.4+ scope).
- Cloudflare deprecates Workers Static Assets (no signals; HIGH confidence in 30-day validity).

---

*Research for: Phase 17 — Foundations: Migration + DNS + Debt Sweep*
*Researched: 2026-05-10*
*Verification anchors: Astro Cloudflare adapter docs (Context7); Cloudflare Workers Static Assets / Cron / Builds docs (Context7); Resend domain DNS API (Context7); local node_modules/@astrojs/cloudflare 13.1.7 source files; npm registry for @astrojs/cloudflare 13.5.0 latest.*
