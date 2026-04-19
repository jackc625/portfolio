# SeatWatch

An automated restaurant reservation platform that monitors a third-party booking system for availability and secures reservations on behalf of its users. The codebase is a production-minded Turborepo monorepo spanning four applications, a shared TypeScript package, 16 database migrations, and 118 test files across unit, integration, and end-to-end suites.

What makes the project technically substantial is not the automation itself, but the engineering required to make it reliable, undetectable, and horizontally scalable: deterministic per-user browser fingerprinting backed by a 26-profile identity pool, TLS-level fingerprint spoofing via Impit, Redis-backed circuit breakers and distributed booking locks, Poisson-distributed poll scheduling with time-of-day multipliers, a dual-strategy booking engine that falls back from direct API calls to headless Chrome, and a tiered billing system with transaction-level plan enforcement.

<!-- CASE-STUDY-START -->

## Problem

High-demand restaurants release reservations at scheduled times each week, and the window to book one is measured in seconds. I wanted to build a system that could monitor availability across many concurrent users, detect openings the moment they appeared, and execute bookings faster than a person could click through a website. The challenge was not just speed — it was reliability at scale. When fifty users are monitoring the same handful of venues simultaneously, the system needs distributed coordination to prevent double-bookings, has to tolerate upstream API changes gracefully, and must avoid correlated traffic patterns that would get the entire user base flagged. Every subsystem had to assume multiple worker instances running in parallel, because horizontal scaling of a single BullMQ worker was the only path to acceptable latency during weekly release windows.

## Approach & Architecture

I architected SeatWatch as a Turborepo monorepo with four independently deployed services on Railway — a React 19 SPA, an Express REST API with sixteen user-facing route modules, a BullMQ worker with five independently tuned queues, and a separate Next.js 16 SEO content site — plus a shared `packages/shared` that owns types, Zod schemas, the browser identity pool, and the generated Prisma client.

The booking path is a dual-strategy engine. The primary path makes direct HTTP calls to the reservation API and completes in sub-second time; on recoverable errors (403, 404, or unrecognized response shapes) the worker transparently falls back to Patchright, a headless-Chrome driver that takes 2–5 seconds but tolerates UI-layer challenges the API rejects. Rate-limit and auth errors stay on the API path — a browser retry would not help.

Concurrent safety rests on distributed booking locks via Redis `SET NX EX` with UUID nonces and a Lua-script-safe release that atomically checks the nonce before deleting. A per-user circuit breaker implemented as a `CLOSED → OPEN → HALF_OPEN` state machine lives in Redis hashes so it survives worker restarts and coordinates across horizontally scaled instances. Detection evasion runs through a 26-profile browser identity pool — each user is assigned a deterministic identity via DJB2 hash of their user ID, so the same user always looks like the same browser across API calls, TLS handshakes (via Impit), cookie jars, and viewport. Poll intervals use Poisson-distributed stagger offsets with time-of-day multipliers rather than fixed delays, which makes traffic statistically indistinguishable from organic use. Credentials are encrypted at rest with AES-256-GCM using per-record IVs and a separately stored GCM tag, decrypted only in worker memory at the moment of use. Stripe powers a four-tier billing system (Free, Pro, Elite, Day Pass) with transactional plan enforcement — the active-request count check runs inside the same DB transaction as the insert, so concurrent request creations cannot race past the cap.

## Tradeoffs

The dual-strategy fallback adds 2–5 seconds of latency when the API breaks, but keeps the booking path alive during upstream changes that would otherwise drop the entire user base offline. Poisson-distributed polling is statistically cheaper to detect than fixed intervals and costs roughly 5× the clock-time variance — I accepted the variance because correlated bursts are what bot detectors watch for. Deterministic per-user browser identity consumes more cookie-jar storage than randomizing per-session would, and rules out opportunistic IP rotation; the lesson from detection research is that real users are consistent, not random, so consistency wins. The Redis-backed circuit breaker survives restarts at the cost of a Redis round-trip per booking attempt. A single-worker uvicorn equivalent was rejected early — horizontal scaling was non-negotiable for release-window throughput, which is why every coordination primitive is Redis-backed rather than in-process.

## Outcome

SeatWatch handled approximately fifty parallel user sessions across four Railway services plus managed Postgres 16 and Redis 7. The monitor queue processed thousands of availability checks daily with jittered scheduling; sniping mode landed first-poll attempts within milliseconds of the configured release timestamp, using a 500 ms early-fire offset to compensate for BullMQ scheduling latency. The codebase spans 419 TypeScript source files and roughly 64,400 lines, with 97 unit and integration test files plus 21 Playwright E2E specs. Ten Prisma models evolved across 16 migrations back the data layer. The Stripe billing system processed real transactions across all four plan tiers with no observed race condition or double-charge, and the distributed booking lock has yet to produce a double-book in production.

## Learnings

The hardest problem was the distributed booking lock. My first implementation used a plain `SET NX` without a nonce, which worked until a slow worker's lock expired, another instance acquired it, and the original worker deleted the new lock on completion — a textbook distributed-systems bug that I had to encounter firsthand before the fix (atomic nonce-checked deletion via a Lua script) made intuitive sense. The circuit breaker went through three iterations: first in-memory (lost state on restart), then Redis without a half-open probe (couldn't recover cleanly), finally a proper state machine in Redis hashes. The broader lesson I now believe is that detection evasion is fundamentally about consistency, not randomness — a real user has a stable browser fingerprint, stable cookie jar, and stable request rhythm. Randomizing everything makes traffic look more suspicious, not less.

<!-- CASE-STUDY-END -->

## Architecture (FULL TECHNICAL REFERENCE)

A Turborepo monorepo with four independently deployed applications and a shared package.

**`apps/web`** — React 19 + Vite 6 single-page application. Serves the authenticated dashboard, admin console, and marketing landing page. Tailwind CSS 4 with shadcn/ui, six Zustand stores, lazy-loaded routes with Suspense boundaries, and a custom polling hook for near-real-time dashboard updates.

**`apps/api`** — Express REST API. Sixteen user-facing route modules plus nine admin route modules, Clerk JWT authentication, Zod validation on every input, Prisma 7 for all database access, five tiers of rate limiting, and raw-body webhook handling for both Clerk and Stripe signature verification.

**`apps/worker`** — BullMQ job processor. Five queues with independently tuned concurrency, a dual-strategy booking engine (direct API with Patchright headless-browser fallback), a Redis-backed circuit breaker, distributed booking locks, a token-bucket rate limiter, and twelve transactional email templates built with React Email.

**`apps/seo`** — Next.js 16 content site with MDX, Tailwind Typography, and AI-assisted guide generation via the Anthropic SDK. Generates per-restaurant guides, curated collections, JSON-LD schema, and sitemap/robots metadata. Runs as a separate Railway service on port 3003.

**`packages/shared`** — Cross-application types, constants, Zod schemas, encryption utilities, the browser identity pool, cookie-store serialization, and the Prisma client (generated into this package so all apps consume a single source of truth).

### Data Flow

```
 User → web dashboard → POST /api/requests
                            │
                            ▼
             API validates, persists, enqueues "monitor" job
                            │
                            ▼
   Worker polls availability every 25–35s (Poisson-jittered)
                            │
                    ┌───────┴───────┐
                    │               │
         cache hit? │               │ cache miss
                    │               │
                    ▼               ▼
               return           API call (Impit TLS, per-user cookie jar)
                                    │
                                    ▼
              match found → high-priority "book" job
                                    │
                ┌───────────────────┴──────────────────┐
                │                                      │
         API booking path                       recoverable error (403/404)
          (sub-second)                                 │
                │                                      ▼
                │                            Patchright headless Chrome
                │                               (2–5s fallback)
                └──────────────┬───────────────────────┘
                               │
                               ▼
                    persist Reservation row
                               │
                               ▼
                 "notify" job → Resend email (+ Twilio SMS for paid tiers)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 LTS |
| Language | TypeScript 5.7 (strict everywhere) |
| Monorepo | Turborepo 2.4, pnpm 9.15 |
| Web | React 19, Vite 6, React Router 7, Zustand 5, Tailwind CSS 4, shadcn/ui (Radix), Motion, Recharts |
| API | Express 4, Prisma 7 (pg adapter), Zod, Clerk |
| Worker | BullMQ 5, Patchright (undetected Playwright fork), Impit (TLS fingerprinting), tough-cookie, undici |
| SEO | Next.js 16 (App Router), MDX, `@anthropic-ai/sdk` |
| Database | PostgreSQL 16 |
| Queue / Cache | Redis 7 |
| Auth | Clerk (Express middleware + React components + webhooks) |
| Billing | Stripe (subscriptions, customer portal, one-time Day Pass) |
| Email | Resend + React Email |
| SMS | Twilio |
| Observability | Sentry (API + worker, with profiling) |
| Linting / Formatting | Biome 1.9 |
| Testing | Vitest (unit / integration), Playwright (E2E) |
| CI / Deployment | GitHub Actions, Railway (four services + managed Postgres + managed Redis) |

## Core Engineering Systems

The subsystems below are where the project earns its depth. Each one exists because a simpler approach was tried first and proved insufficient.

### Dual-Strategy Booking Engine

The primary booking path makes direct HTTP calls to the reservation API and completes in sub-second time. When the API returns a recoverable error (403, 404, or an unrecognized response shape), the worker transparently falls back to a Patchright-driven headless Chrome session and replays the booking through the same UI a human would use. The browser path takes 2–5 seconds but tolerates API changes and lightweight UI-layer challenges. Rate-limit (429) and authentication errors stay on the API path — those indicate account-level issues, and retrying through a browser would not help. Every `BookingAttempt` row records which method produced the outcome, feeding into an admin dashboard that tracks API-vs-browser success ratios over time.

### Sniping Mode

High-demand venues release reservations at a scheduled time each week. Sniping mode schedules a BullMQ delayed job for the exact release timestamp — with a configurable early-fire offset (default 500 ms) that compensates for BullMQ scheduling latency so the first poll lands at or just before the release moment. On fire, the worker enters a rapid-retry loop polling every 200–500 ms (jittered), for up to eight retries across a 15-second window. Snipe operations bypass the global rate limiter entirely; speed is the entire point of the mode. For paid users, a failed snipe automatically transitions into continuous monitoring rather than marking the request failed.

### Monitoring Mode

Long-running availability polling uses Poisson-distributed intervals (30-second mean, bounded 15–120 s) rather than fixed delays, which makes traffic patterns statistically closer to organic human use. Time-of-day multipliers reduce load during known low-yield windows: roughly 2.5× dilated between 2–8 am, 1.0× during the 10 am–2 pm peak, and custom multipliers across pre-peak, afternoon, and late-night bands. When a request covers multiple desired dates, the worker rotates through them via a Redis `INCR` counter instead of checking all dates on every cycle. Booking failures never terminate monitoring — the request stays alive until a successful booking or explicit user cancellation.

### Detection Evasion

A pool of 26 browser identity profiles spans Chrome 131/136/142/146 and Edge 131 across macOS, Windows, and Linux, with varied viewport dimensions and `Accept-Language` permutations. Each user is assigned a deterministic identity via DJB2 hash of their user ID — the same user always looks like the same browser across API calls, browser sessions, cookie jars, and even the TLS handshake. TLS fingerprinting is handled by the Impit library, which produces browser-grade `ClientHello` records matching the assigned identity's browser version without requiring a full browser process. Cookie jars are persisted per-user in Redis (serialized in tough-cookie format) so session state survives worker restarts. Roughly 15% of poll cycles include ancillary decoy requests that mimic background browser activity, breaking machine-regular access patterns. When multiple users monitor the same venue, poll times are staggered with a minimum separation window to avoid correlated request bursts. A response-fingerprint analyzer watches for bot-vendor headers (Akamai, Cloudflare, PerimeterX) to detect when a venue's infrastructure has changed its detection posture.

### Credential Security

Restaurant-platform credentials are encrypted at rest with AES-256-GCM, using per-record random initialization vectors and storing the GCM authentication tag separately. The encryption key is sourced from `ENCRYPTION_KEY`. A transparent legacy migration path exists: decryption attempts the current key format first (fast path), falls back to a PBKDF2-derived key if that fails (legacy format), and re-encrypts the record with the current format on success — so old rows are silently upgraded the next time they are touched. Both the access token and the underlying password are encrypted independently (the password enables silent token refresh without user intervention). Credentials are decrypted only in worker memory at the moment of use and are never serialized through API responses.

### Circuit Breaker

A Redis-backed per-user circuit breaker implements a `CLOSED → OPEN → HALF_OPEN` state machine. After a configurable threshold of consecutive failures (default 5), the circuit opens and the user's active requests are paused with a `PauseReason.RATE_LIMIT` tag so the UI can explain what happened. After a cooldown period (default 120 s), a single probe request tests recovery. If the probe fails, cooldown doubles, capped at 10 minutes — classic exponential backoff at the user level. Because the state lives in Redis hashes, the breaker survives worker restarts and works correctly across horizontally scaled worker instances.

### Distributed Booking Lock

When a worker instance detects matching availability, it acquires a Redis lock via `SET NX EX` with a random nonce before executing the booking. The lock TTL defaults to 90 seconds. Release uses a Lua script that atomically compares the nonce before deleting — without this, a slow worker could release a lock that has already expired and been reacquired by another instance, and two workers could double-book the same reservation. This script is the mechanism that makes horizontal worker scaling safe.

### Venue Availability Cache

A Redis cache keyed by `(venueId, date, partySize)` stores availability responses with a 30-second TTL. The cache is consulted *after* the circuit breaker (no value caching if the user's breaker is open) but *before* cookie pre-seeding and staggering delays (the expensive operations). Hits short-circuit the entire polling pipeline. Hit/miss counters are maintained in Redis for admin observability. Invalidation happens on successful booking of any slot for that venue and date.

### Global Rate Limiter

A Lua-backed token-bucket rate limiter (30 RPS, 30 burst by default) governs all outgoing calls to the reservation platform, with a separate smaller bucket (5 RPS) dedicated to the watchlist sweep workload so scheduled background scans cannot starve interactive monitoring. A Redis kill switch allows an administrator to globally pause all outgoing traffic with a single toggle — useful during incidents or platform maintenance windows.

### Watchlist Sweeps

Users on any plan can favorite restaurants; paid tiers can promote favorites onto a passive *watchlist* that is scanned hourly without a committed booking intent. The sweep processor batches across users and venues, consults the same availability cache, honors the dedicated watchlist rate limiter, and stores results as `WatchlistSnapshot` rows (slot count + time ranges + timestamp). Tier-based caps (Free 3, Pro 10, Elite unlimited) bound fan-out. A Monday-morning cron aggregates the last seven days of snapshots into a per-user digest email summarizing best-day and best-time-range windows, and snapshots older than 14 days are pruned at digest time. The weekly digest is a separate React Email template consumed by the notify queue.

## Feature Inventory

### Authentication and User Management
Clerk provides JWT-based authentication. Express middleware verifies tokens and injects `clerkUserId` into every request; session claims carry the admin role for zero-latency authorization checks. An auto-provision middleware upserts a `User` row on first API call (so developers don't need Clerk webhooks wired locally), and in production, webhook handlers process `user.created`, `user.updated`, and `user.deleted` events including referral-code attribution on signup.

### Billing and Subscriptions

| Plan | Price | Active Requests | Automation Modes | Notifications |
|------|-------|-----------------|------------------|---------------|
| Free | $0 | 1 | Sniping only | Email |
| Pro | $25 / month | 5 | Sniping + Monitoring | Email + SMS |
| Elite | $60 / month | Unlimited | Sniping + Monitoring | Email + SMS |
| Day Pass | $19 one-time | Unlimited (48 h) | Sniping + Monitoring | Email + SMS |

Stripe Checkout handles subscription creation and one-time Day Pass purchases. The Stripe Customer Portal handles self-service cancellation, payment-method updates, and invoice history. Webhook handlers process `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`, and `checkout.session.completed`. Day Pass expiry is checked both by a 15-minute maintenance cron and at the request-creation middleware level; on expiry the user is atomically downgraded to Free and excess active requests are paused with `PauseReason.PLAN_DOWNGRADE`. Plan limit enforcement uses a transactional count check so concurrent request creations cannot race past the cap.

### Gift Passes
Purchasable gift Day Passes with generated redemption codes, optional personalized messages, and Resend-delivered emails to recipients. `GiftCode` rows track buyer, recipient, Stripe session, and status (`PENDING`, `REDEEMED`, `EXPIRED`, `VOIDED`). Redemption flows run through dedicated `/gift/redeem` and `/gift/success` pages and are managed in the admin console.

### Referral System
Every user receives a unique referral code. Both parties earn a pending Day Pass on successful referral; pending passes stack and auto-activate when the current pass expires. A rate-limited invite endpoint (10 invites / hour / user) supports both email and SMS delivery. `/r/:code` links write to `localStorage` so attribution survives the Clerk signup redirect round-trip.

### Restaurant Favorites and Watchlist
Heart icons across search results and the dashboard sidebar let users save restaurants for quick re-selection. Favorites can be individually promoted to the watchlist for hourly passive monitoring (see Watchlist Sweeps above). A preview component renders the most recent watchlist digest inline.

### Natural-Language Request Builder
An `/api/nlp` endpoint parses free-text reservation requests via the Anthropic SDK (e.g. *"Get me Carbone for four next Friday after 8 pm"*), mapping them to the same schema as the traditional structured form. Per-user quota tracking, input sanitization, and a dedicated rate limiter (separate from the main API limiter) protect the LLM budget and prevent prompt injection into the booking pipeline.

### Notifications
Twelve transactional email templates in the worker, all built as typed React Email components with a shared layout: booking confirmed, booking failed, request expired, snipe failed (paid + free variants), account issue, health resumed, Day Pass expired, referral invite, referral reward, gift sent, and watchlist digest. Two additional templates live in the API (signup welcome and newsletter welcome). SMS delivery via Twilio is available for Pro, Elite, and Day Pass users; SMS failures are best-effort and never block the booking path. The notify processor verifies per-user notification preferences (`notifyEmail`, `notifySms`) and plan eligibility before dispatching.

### Account Health Monitoring
A 12-hour periodic health-check job validates idle restaurant-platform accounts. It uses a refresh-first pattern: attempt a silent token refresh (the encrypted password makes this possible) before probing the account API, so most transient auth issues resolve without user action. A two-strike policy handles authentication failures — the first triggers a retry, the second pauses all of the user's active requests with `PauseReason.AUTH_FAILURE`. When a user reconnects, requests auto-resume and a *health resumed* email is sent. A dismissible health banner surfaces account issues in the dashboard.

### SEO Content Site
A separate Next.js 16 application generates restaurant guides and curated collection pages backed by MDX content under `apps/seo/content/`. A `scripts/generate.ts` task drives Anthropic-assisted guide drafting. Per-page metadata is emitted as OpenGraph + Twitter cards plus JSON-LD structured data (Article, BreadcrumbList, FAQPage, ItemList), with automatic `sitemap.xml` and `robots.txt` generation from the content tree.

### Analytics
Personal statistics (`/api/analytics`) show all-time reservation count, success rate, and top three most-booked restaurants — with database-level statement timeouts to bound worst-case query cost. The admin surface adds system metrics (queue depths, cache hit rates, booking method distribution), per-venue drill-down statistics, a detection dashboard with selectable 1 h / 6 h / 24 h / 7 d time ranges and a kill-switch toggle, and watchlist sweep statistics.

### Admin Console
Overview panel with live user, request, and queue-depth counters. User management with search and per-user detail views including request history and manual booking controls. Bull Board mounted under Clerk-gated admin authentication for direct queue inspection. Gift code management. Detection metrics with challenge-response analysis. Venue analytics with sortable tables. Watchlist sweep health.

## API Surface

Sixteen user-facing route modules plus nine admin modules under `/api/admin`:

| Route | Purpose |
|-------|---------|
| `/api/requests` | Reservation request CRUD |
| `/api/restaurants` | Search, lookup, Resy-URL parsing |
| `/api/reservations` | Confirmed-reservation management |
| `/api/resy-accounts` | Connect / disconnect / status for platform credentials |
| `/api/billing` | Stripe checkout, customer portal, subscription sync |
| `/api/billing/webhook` | Stripe webhook receiver (raw-body signature-verified) |
| `/api/auth/webhook` | Clerk webhook receiver |
| `/api/users` | Profile, phone, notification preferences |
| `/api/referrals` | Stats, invites, seen-tracking |
| `/api/favorites` | Favorites + watchlist toggle |
| `/api/analytics` | Personal reservation statistics |
| `/api/gifts` | Gift code purchase, redemption, lookup |
| `/api/nlp` | Natural-language request parsing |
| `/api/share` | Public reservation share + `.ics` export |
| `/api/newsletter` | Email list subscription |
| `/api/system` | Platform API health, Redis status |
| `/health` | Liveness probe |
| `/api/admin/*` | users, bookings, metrics, detection, venue-stats, watchlist-metrics, gifts, system |

Rate limits are tiered per route group: general 100 / min, booking 10 / min, platform status 60 / min, platform account connect 10 / 15 min, newsletter 5 / 15 min.

## Worker Subsystem

Five BullMQ queues, each with its own processor and independently tuned concurrency:

| Queue | Purpose | Concurrency |
|-------|---------|-------------|
| `monitor` | Availability polling with jittered intervals | 10 |
| `book` | Reservation execution with browser fallback | 5 |
| `release` | Snipe execution at exact release timestamps | 10 |
| `notify` | Email and SMS dispatch | 5 |
| `maintenance` | Day Pass expiry, health checks, watchlist sweeps, weekly digests | 1 |

The worker is driven by more than thirty environment variables — concurrency knobs, Poisson interval parameters, rate-limiter capacities, circuit-breaker thresholds, snipe retry windows, time-of-day multipliers, Impit cache sizes, booking lock TTL, Playwright timeouts. Graceful shutdown follows an ordered drain: health server stops accepting connections, each queue drains with a timeout, Prisma disconnects, Redis closes, and Sentry flushes before exit. Health endpoints on port 3002 cover `/health` (liveness) and `/readiness` (Postgres + Redis probe).

## Data Model

Ten Prisma models and nine enums defined in `prisma/schema.prisma`, evolved across 16 migrations:

| Model | Purpose |
|-------|---------|
| `User` | Clerk-linked account, plan, Day Pass expiry, referral code, pending passes, notification prefs |
| `ResyAccount` | Encrypted platform credentials (token + password), status, last-validated timestamp |
| `Restaurant` | Venue metadata, release schedule, difficulty rating, timezone |
| `ReservationRequest` | Active request: status, party size, desired dates, time window, automation mode, pause reason |
| `BookingAttempt` | Every booking attempt: result, method (API vs. Playwright), slot, error, release offset |
| `Reservation` | Confirmed booking with optional public share token |
| `Favorite` | User ↔ restaurant association with `isWatched` flag |
| `WatchlistSnapshot` | Hourly availability snapshot per favorite: slot count + time ranges |
| `Referral` | Referrer ↔ referred relationship with reward state |
| `GiftCode` | Purchased gift pass with redemption and status tracking |

Enums cover plan (`FREE / PRO / ELITE / DAY_PASS`), request lifecycle (`PENDING / MONITORING / SNIPING / BOOKED / EXPIRED / FAILED / CANCELLED / PAUSED`), booking result, automation mode, pause reason (`AUTH_FAILURE / RATE_LIMIT / PLAN_DOWNGRADE / MANUAL`), platform account status, booking method, referral status, and gift code status. Over twenty indexes target the specific query patterns used by the monitor loop, admin dashboards, and analytics aggregations.

## Security and Reliability Posture

- **Authentication everywhere**. Every non-webhook, non-health API route passes through Clerk middleware. Admin routes require an admin role claim checked directly from session claims.
- **Zod on every input**. Request-body and query-parameter schemas are declared once and used both for runtime validation and inferred TypeScript types.
- **Webhook signature verification**. Stripe and Clerk webhooks receive raw bodies and are verified against their respective signing secrets before any state mutation.
- **Credentials at rest**. AES-256-GCM with per-record IVs, GCM tags stored separately, and a transparent legacy re-encryption path.
- **Helmet CSP + CORS origin allowlist**, with `trust proxy` configured for Railway's single-hop edge.
- **Prepared-statement-only database access** via Prisma; no raw SQL interpolation anywhere.
- **Log sanitization**. Email addresses are masked in log output; proxy URLs log host only.
- **Statement timeouts** on analytics queries to bound worst-case database cost.
- **Secret scanning** via `ship-safe` before commits.
- **Atomic plan enforcement**. Request-creation counts run inside a transaction with the insert, preventing concurrent races past the plan cap.
- **Distributed coordination**. Booking locks, circuit breakers, rate limiters, and availability cache are all Redis-backed so horizontal worker scaling is safe by construction.
- **Graceful shutdown**. Both API and worker drain in-flight work and flush observability before exit.

## Testing

**97** unit and integration test files (Vitest) and **21** Playwright E2E spec files. Integration tests cover every API route, every worker processor, every service module, and the identity / encryption / cookie-store primitives. E2E suites cover authentication, onboarding, dashboard interactions, billing, referrals, favorites, share pages, settings, navigation, accessibility, mobile viewports, visual regression, and the entire admin console. Playwright uses a page-object pattern. CI runs lint, type-check, and unit tests on every push and pull request to `master` via GitHub Actions (`ci.yml`); E2E runs as a separate workflow (`e2e.yml`).

## Deployment

Four Railway services — `api`, `web`, `worker`, `seo` — plus managed PostgreSQL 16 and Redis 7. A push to `master` triggers Railway builds scoped by watch paths, so each service only rebuilds when its source files (or shared package) change. Node version is pinned via `railpack.json`. Sentry is wired into both the API and the worker with profiling enabled.

## Project Structure

```
resy-saas/
├── apps/
│   ├── api/         Express REST API (Clerk, Zod, Prisma, Stripe/Clerk webhooks)
│   ├── web/         React 19 + Vite SPA (dashboard, admin console, landing)
│   ├── worker/      BullMQ processors (monitor, book, release, notify, maintenance)
│   └── seo/         Next.js 16 MDX content site with AI-assisted generation
├── packages/
│   └── shared/      Types, constants, Zod schemas, encryption, identity pool,
│                    cookie-store, generated Prisma client
├── prisma/          schema.prisma + 16 migrations + seed data
├── infra/           Caddy reverse-proxy config for staging
├── scripts/         Database migration utilities
└── .github/         CI workflows (ci.yml, e2e.yml)
```

## Getting Started

### Prerequisites

- Node.js 22 LTS
- pnpm 9.15+
- Docker (for local PostgreSQL and Redis)

### Setup

```bash
pnpm install
docker compose up -d                          # Postgres + Redis
cp .env.example .env                          # fill in Clerk/Stripe/Resend/etc.
set -a && source .env && set +a \
  && pnpm exec prisma migrate dev --schema prisma/schema.prisma
set -a && source .env && set +a \
  && pnpm exec prisma db seed --schema prisma/schema.prisma
pnpm dev
```

Once running: web at `http://localhost:5173`, API at `http://localhost:3001`, worker health at `http://localhost:3002/health`, SEO site at `http://localhost:3003`.

## Environment Variables

Minimum required (see `.env.example` for the full list):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` | Clerk authentication |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe billing |
| `STRIPE_PRO_PRICE_ID` / `STRIPE_ELITE_PRICE_ID` / `STRIPE_DAY_PASS_PRICE_ID` | Plan price IDs |
| `RESEND_API_KEY` | Transactional email |
| `ENCRYPTION_KEY` | AES-256 key for credential encryption at rest |
| `ANTHROPIC_API_KEY` | NLP request parsing and SEO guide generation |
| `PROXY_URL` | Optional egress proxy for platform requests |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | SMS (optional) |
| `SENTRY_DSN` | Error monitoring (optional) |

Worker behavior is further tunable via 30+ environment variables covering concurrency, Poisson interval parameters, rate-limiter capacities, circuit-breaker thresholds, snipe retry windows, time-of-day multipliers, and timeouts.

## Codebase Metrics

| Metric | Count |
|--------|-------|
| TypeScript source files (non-generated) | 419 |
| Lines of TypeScript | ~64,400 |
| Applications | 4 |
| API route modules | 16 user + 9 admin |
| React pages | 19 user + 8 admin |
| Zustand stores | 6 |
| Worker processors / queues | 5 / 5 |
| Email templates | 14 (12 worker + 2 API) |
| Prisma models / enums | 10 / 9 |
| Database migrations | 16 |
| Unit + integration test files | 97 |
| Playwright E2E spec files | 21 |
| Browser identity profiles | 26 |

## Closing Note

SeatWatch is a small product on its surface — create a request, get a reservation. The depth is underneath: it is a distributed system with enough adversarial engineering (fingerprint determinism, TLS-level identity, circuit breaking, distributed locking, rate limiting at multiple layers) to stay reliable and low-profile while running continuously on behalf of many users. The same code paths run in tests, in local development, and across horizontally scaled Railway workers, and the invariants that keep the system honest — never double-book, never leak credentials, never exceed plan limits, never block the booking path on notifications — are enforced structurally rather than procedurally.
