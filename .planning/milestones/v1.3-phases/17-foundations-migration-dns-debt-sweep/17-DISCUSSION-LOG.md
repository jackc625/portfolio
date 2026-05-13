# Phase 17: Foundations — Migration + DNS + Debt Sweep - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 17-foundations-migration-dns-debt-sweep
**Areas discussed:** Migration cutover & rollback, DNS warming execution, Internal task ordering, Local dev workflow

---

## Migration cutover & rollback

### Cutover strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Parallel deploy + flip domain | Deploy Workers as a separate Worker first (validates on *.workers.dev preview), run D-15 + D-26 against the preview, then reattach jackcutrara.com custom domain to the Worker. Pages stays warm 24-72h as instant rollback. Low blast radius. | ✓ |
| One-shot cutover | Reconfigure wrangler.jsonc + run wrangler deploy + reattach domain in one motion. Simpler to plan; if D-15/D-26 fail post-cutover, rollback means re-deploying Pages from scratch (~minutes, but with chat downtime). | |
| Canary with traffic split | Use Cloudflare load balancing to send N% of traffic to the Worker. Probably overkill for a single-page-app portfolio — adds DNS/LB config surface for marginal risk reduction. | |

**User's choice:** Parallel deploy + flip domain
**Notes:** Lowest blast radius; rollback is one-click reattach.

### Pages rollback retention window

| Option | Description | Selected |
|--------|-------------|----------|
| 72 hours | Long enough to catch a delayed regression. Then retire the Pages project. | |
| 24 hours | Short safety net; assumes any breakage shows up within a day's traffic. | ✓ |
| 7 days | Conservative — spans a full week of traffic patterns. Costs nothing but delays Phase 18 start. | |
| Indefinite | Don't retire Pages at all. Adds long-term config drift risk. | |

**User's choice:** 24 hours
**Notes:** Plan-phase should treat this as a gated check ("retire after 24h of clean traffic AND no open regressions"), not a hard timer.

### Current deploy mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Cloudflare Pages dashboard "connect to Git" (auto on main push) | No GitHub Action exists for deploy — Cloudflare watches main and runs the build itself. | ✓ |
| GitHub Actions workflow | There's a deploy workflow somewhere I missed. | |
| Manual `wrangler pages deploy` from Jack's laptop | Deploys are user-initiated, not auto. | |
| Not sure — let me check | Need to verify before deciding. | |

**User's choice:** Cloudflare Pages dashboard "connect to Git" (auto on main push)
**Notes:** Confirmed by codebase scout — only `.github/workflows/sync-check.yml` exists; no deploy workflow.

### Replacement for auto-deploy on the Worker

| Option | Description | Selected |
|--------|-------------|----------|
| Cloudflare Workers Builds | Cloudflare's dashboard Git-integration for Workers — same UX as today's Pages auto-deploy. Zero GitHub Actions complexity. | ✓ |
| GitHub Actions running `wrangler deploy` | Explicit deploy workflow. Reproducible, version-controlled, but adds CI infra. Requires CLOUDFLARE_API_TOKEN secret. | |
| Manual `wrangler deploy` from local | User-initiated only. Loses the "every main push goes live" auto-promotion. | |

**User's choice:** Cloudflare Workers Builds
**Notes:** Mirrors current DX; no new CI infra to maintain.

### D-15 byte-identical proof mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Snapshot test against captured SSE bytes | Capture canonical SSE byte stream from current Pages deploy, save as test fixture, replay against new Worker preview. Fail-fast in CI. | ✓ |
| Live diff at cutover | Hit Pages and Worker preview with the same request, diff byte-by-byte at cutover time. One-shot manual verification. | |
| Both — snapshot in CI + live diff at cutover | Belt-and-suspenders. | |

**User's choice:** Snapshot test against captured SSE bytes
**Notes:** Fixture must be captured against live Pages BEFORE migration code lands.

---

## DNS warming execution

### Resend account ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Existing account — add jackcutrara.com domain | Already signed up; just add + verify the mail.jackcutrara.com sending subdomain. | |
| Create new account in this phase | Phase 17 includes Resend account creation as a manual step. | ✓ |
| Already created and domain verified | DNS records already live; only warming sends + Postmaster Tools. | |

**User's choice:** Create new account in this phase
**Notes:** Account creation is part of Phase 17's plan as a manual step.

### Sender display name + address

| Option | Description | Selected |
|--------|-------------|----------|
| "Portfolio Chat" <transcripts@mail.jackcutrara.com> | Display name signals source at-a-glance in Gmail. | ✓ |
| "Jack Cutrara (Portfolio)" <transcripts@mail.jackcutrara.com> | More personal but risks confusion since these aren't from Jack — they're transcripts from the widget. | |
| No display name — bare address | Gmail renders as just the address. Lower scan-ability. | |

**User's choice:** "Portfolio Chat" <transcripts@mail.jackcutrara.com>
**Notes:** `Reply-To: jackcutrara@gmail.com` per locked REQUIREMENTS.md MAIL-04.

### Warming-send mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Throwaway scripts/resend-warmup.mjs | One-shot script using the same fetch() pattern Phase 20 will use. Reuses production code path. ~30 LOC. | ✓ |
| Resend dashboard "Test send" UI | Click 5–10 times in the Resend dashboard. Doesn't validate any production code path. | |
| Hand-craft 5–10 curl POSTs | Manual curl. Doesn't exercise the Worker fetch-wrapper. | |

**User's choice:** Throwaway scripts/resend-warmup.mjs
**Notes:** Pre-validates Authorization + Idempotency-Key header shape early.

### Warmup timing within the phase

| Option | Description | Selected |
|--------|-------------|----------|
| Last — after migration + all DEBT items GREEN | Manual "Not Spam" feedback loop happens against a known-good chat surface. | ✓ |
| First — before migration starts | Get DNS verified + warming done while the chat surface is being touched. | |
| Parallel — DNS records day 1, sends in background | Asynchronous interleaving. Maximizes calendar throughput but harder to reason about. | |

**User's choice:** Last
**Notes:** Avoids debugging chat regressions and warmup mechanics simultaneously.

---

## Internal task ordering

### Execution order

| Option | Description | Selected |
|--------|-------------|----------|
| Migration → chat-surface DEBT (04, 05) → docs/CI (01, 03) → observability (02) → DNS+warmup | Migration first locks the deploy target. Chat-surface DEBT lands under the new deploy with full D-26 re-runs. Observability (DEBT-02) closes last among code changes. DNS+warmup terminates the phase against an all-GREEN surface. | ✓ |
| DEBT items first → migration → DNS | Close DEBT on Pages first, then migrate. Doubles D-26 work. | |
| Migration last (after everything else) | Land all DEBT + DNS while still on Pages. DNS verification can't actually warm a Pages-pointed domain. | |

**User's choice:** Migration → chat-surface DEBT → docs/CI → observability → DNS+warmup
**Notes:** Plus a Day-1 task for the SSE snapshot fixture capture.

### D-26 cadence

| Option | Description | Selected |
|--------|-------------|----------|
| After every commit that touches chat surface + final phase-end gate | Catches regressions at smallest blast radius. Battery is fast (mocked LLM); cost is trivial. | ✓ |
| After each work-block boundary + final gate | Coarser cadence — 4-5 runs total. Risk: regression in commit N+1 isn't caught until N+M. | |
| Only at phase-end gate | Single run before close-out. Highest risk. | |

**User's choice:** After every commit that touches chat surface + final phase-end gate
**Notes:** Chat surface = chat.ts / api/chat.ts / global.css / BaseLayout.astro / validation.ts per TEST-01.

### Plan granularity

| Option | Description | Selected |
|--------|-------------|----------|
| 5 plans aligned to wave boundaries | 17-01 Migration. 17-02 Chat-surface DEBT. 17-03 Docs/CI DEBT. 17-04 Observability. 17-05 DNS+warmup. | |
| 3 plans — group migration, all DEBT, DNS | 17-01 Migration. 17-02 All 5 DEBT in one plan. 17-03 DNS+warmup. | |
| 1 monolithic plan | Everything in 17-01-PLAN.md. | |
| Let plan-phase decide based on dependency analysis | gsd-planner groups tasks via dependency graph. | ✓ |

**User's choice:** Let plan-phase decide based on dependency analysis
**Notes:** Hard ordering constraint (D-09) plus phase exit gates give plan-phase enough structure.

### SSE snapshot capture timing

| Option | Description | Selected |
|--------|-------------|----------|
| Before migration | Capture canonical SSE bytes from live Pages, commit as fixture. Migration plan asserts the new Worker matches. | ✓ |
| Day 1 of plan-phase — before any code work | Same intent; explicitly the very first task. | |
| Capture during plan-phase research | Treat as research output, not a code commit. | |

**User's choice:** Before migration
**Notes:** Captured against live Pages on Day 1; fixture commit precedes any migration code commit.

---

## Local dev workflow

### `pnpm dev` semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Keep astro dev, add separate wrangler dev script | `pnpm dev` stays = astro dev. Add `pnpm dev:worker` = wrangler dev for Worker entrypoint verification. | ✓ |
| Switch pnpm dev to wrangler dev | Single dev mode through the Worker. Slower HMR. | |
| Both run as one command via concurrently | Adds a runtime dep. | |

**User's choice:** Keep astro dev, add separate wrangler dev script
**Notes:** Two-mode pattern matches Cloudflare's documented Workers Static Assets guidance.

### Preview URL strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Use Cloudflare-assigned *.workers.dev preview URLs | Workers Builds gives each PR a *.workers.dev preview URL automatically. Update validation.ts:72 + tests/api/security.test.ts:79–97. | ✓ |
| Custom subdomain preview.jackcutrara.com | Cleaner URL surface but requires DNS routing rules. Overkill for portfolio. | |
| Disable PR previews entirely | Only deploy on main pushes. Loses pre-merge review affordance. | |

**User's choice:** Use Cloudflare-assigned *.workers.dev preview URLs
**Notes:** Actual suffix can't be hardcoded until the Worker deploys once — plan-phase captures it post-first-deploy.

### Fate of scripts/pages-compat.mjs

| Option | Description | Selected |
|--------|-------------|----------|
| Retire entirely — remove from package.json build script | Workers Static Assets [assets] binding handles directory shape natively. Surfaces hidden Pages-coupling early. | ✓ |
| Keep but rewrite as workers-compat.mjs | Convert to whatever post-build glue Workers needs. Likely empty / no-op. | |
| Keep as-is for the rollback window | Don't touch it; if we revert to Pages within 24h the script still works. | |

**User's choice:** Retire entirely — remove from package.json build script
**Notes:** Delete the file. Surfaces hidden Pages-coupling early.

---

## Claude's Discretion

- Exact `src/worker.ts` shape (line count, comment style, import ordering)
- Whether `WORKERS_PREVIEW_SUFFIX` lives in `validation.ts` or moves to a dedicated `src/lib/cors.ts`
- Final `scripts/resend-warmup.mjs` arg shape (`--to`, `--count`, etc.)
- Whether `scripts/resend-warmup.mjs` is committed to the repo or stays untracked
- Naming of the SSE snapshot test (`tests/api/sse-snapshot.test.ts` is suggested; planner may rename)
- Exact log-line shape for DEBT-02 cache-hit observability
- Whether DEBT-01 PROJECT.md edit also touches STATE.md or RETROSPECTIVE.md mentions of `CHAT_RATE_LIMITER`
- Postmaster Tools enrollment timing (during DNS-01 or after first warmup send)
- Plan granularity (5/3/1 plans) deferred to plan-phase dependency analysis

## Deferred Ideas

- Canary-with-traffic-split rollout — revisit only if portfolio traffic crosses thresholds where N% rollout becomes meaningful
- GitHub Actions deploy workflow — revisit if Workers Builds proves insufficient
- Custom preview subdomain (`preview.jackcutrara.com`) — revisit if `*.workers.dev` URLs become a sharing-friction point
- Single-mode dev (`wrangler dev` only) — revisit if two-mode story produces parity bugs
- Custom `workers-compat.mjs` post-build script — revisit if Workers Static Assets needs post-build glue
- `/api/resend-webhook` with Svix HMAC — explicitly v1.4+ per v1.3 milestone lock
- Workers Paid plan upgrade to bind `CHAT_RATE_LIMITER` — v1.4+ per v1.3 milestone lock
