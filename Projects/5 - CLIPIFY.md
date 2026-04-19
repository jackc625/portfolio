# Clipify

**AI-powered video clipping platform that transforms long-form creator content into short, social-ready clips with auto-captions and hook titles.**

Clipify takes YouTube VODs, Twitch streams, podcasts, and uploaded MP4s — runs them through a multi-stage AI pipeline (transcription → moment detection → rendering) — and produces captioned, mobile-optimized clips ready for TikTok, YouTube Shorts, and Instagram Reels. The entire flow is automated: upload a video, and the system identifies the most viral-worthy segments, generates hook titles, burns styled captions, and delivers download-ready clips.

Built for streamers, podcasters, and YouTubers who need to repurpose long-form content into short-form clips without manual editing.

---

<!-- CASE-STUDY-START -->

## Problem

Content creators sit on hours of long-form footage — podcasts, streams, YouTube VODs — and repurpose it into short-form clips for TikTok, Shorts, and Reels. The manual path is cutting an 8-hour podcast into ten 45-second clips, writing hook titles, burning captions, and re-rendering per clip per platform. Most creators pay an editor several hundred dollars per long video or skip distribution entirely. I wanted to build a pipeline that took a YouTube URL or MP4 upload, ran it through transcription, picked the actual highlights at a quality close to what a human editor would choose, rendered them captioned and cropped to target aspect, and delivered download-ready clips without a manual pass. The non-obvious constraint was that moment-picking had to earn its cost: GPT scoring at a per-minute rate across hours of transcript adds up fast, and a naïve "send the whole transcript to GPT" approach was both expensive and worse than a heuristic-first pipeline.

## Approach & Architecture

I built Clipify as a pnpm monorepo with two deployed services: a Next.js 15 App Router web application handling uploads, billing, and dashboard, and a Dockerized Node 20 worker that owned the heavy pipeline. Three BullMQ queues on Upstash Redis connected them — `q_transcribe` (concurrency 1, API-bound), `q_detect` (concurrency 2), `q_render` (concurrency 0.5, FFmpeg CPU-bound) — with per-job timeouts (20 / 10 / 15 minutes), three retries with 2s exponential backoff, and stalled-job detection under a 10-minute lock.

The transcription stage sent audio to OpenAI Whisper with `verbose_json` and word-level timestamp granularity. For videos over 45 minutes I auto-split audio into 10-minute segments, processed each independently, and merged word timestamps back to global time — memory stayed bounded and 8+ hour podcasts went through without API timeouts. An adaptive per-request timeout scaled with video length (minimum 15 minutes, up to 0.8× duration).

Moment detection was the interesting piece. I ran a heuristic-first scoring pass across the transcript — energy peaks (excited lexicon, fast speech), story-arc markers, viral hook patterns ("plot twist", "wait until you see this"), and speaker-change dynamics — to generate variable-length candidate windows (35-75s) at three positions around each detected moment, deduplicated against >50% overlap. Only the top 15 candidates went to GPT-4o-mini for re-ranking against a structured rubric: Immediate Engagement 30%, Emotional Resonance 25%, Standalone Value 25%, Shareability 20%. The model returned scores plus hook titles in one call. Final selection picked 2-4 clips with 15-second minimum spacing. Rendering ran each selected clip through FFmpeg — H.264 High Profile at CRF 18, 10 Mbps max, 30 fps, AAC 192 kbps — with smart cropping per aspect ratio and ASS subtitle burning (Arial Black 68px, line breaks at punctuation with a 35-character limit).

A three-tier S3 lifecycle tiered storage by plan (`users/free/` vs `users/paid/`): free-tier files expired after 90 days, paid-tier transitioned to Glacier, and all uploads and downloads went through presigned URLs (5-minute and 1-hour TTLs) so files never touched the server. Stripe drove three billing plans — Free (60 min/month, watermarked), Pro ($29/mo, 600 min), Agency ($99/mo, 2000 min) — with five webhook events persisted as `BillingEvent` rows for audit.

## Tradeoffs

A single-pass "send the whole transcript to GPT-4o and pick clips" was the obvious simplification, and I chose against it. Heuristic-first filtering gated the expensive GPT call behind cheap regex and lexicon scoring, cutting per-video cost meaningfully on long podcasts without noticeably hurting selection quality. The three-stage queue split added orchestration complexity but meant a crashed render couldn't invalidate a completed transcription that cost real OpenAI money. Deducting quota minutes at transcription start rather than completion was a deliberate anti-abuse choice — it prevents users from abandoning jobs to reclaim minutes, at the cost of billing fairly for failed renders. Whisper API over a self-hosted model traded per-minute cost for zero ops work and word-level timestamp accuracy I couldn't match locally.

## Outcome

Clipify runs as a Next.js 15 web app and a Dockerized Node 20 worker across 17 API routes, three BullMQ queues, 12 Prisma models on Neon serverless Postgres, and a typed SSE event stream driving real-time queue position on the dashboard. The moment-detection pipeline runs five stages (heuristic scoring, candidate generation, deduplication, GPT re-ranking, final selection) and supports optional GPT completeness scoring for podcasts over 30 minutes. Long-form videos auto-chunk at the 45-minute boundary into 10-minute audio segments. The billing system covers three plan tiers with server-side quota enforcement at both project creation and transcription start, premium feature gating at the API layer, and Stripe signature verification on every webhook. Clips export as individual downloads, streaming-ZIP bulk downloads, JSON metadata, and CMX3600 EDL for professional NLEs.

## Learnings

The hardest problem was the moment-detection cost/quality curve. My first version sent the entire transcript to GPT-4o for scoring, which produced reasonable clips but cost multiple dollars per hour and got slower as transcripts grew. The fix was inverting the pipeline: cheap heuristic scoring on 100% of transcript, variable-window candidate generation, dedupe, then hand only the top 15 candidates to GPT-4o-mini for a structured rubric. The deeper lesson was that LLM scoring is a last-mile refinement, not a first-pass filter — the tempting shape of "LLM sees everything" is the one that burns money. The second lesson was idempotency: detection deleted existing clips before creating new ones, rendering checked for double-attempts, and queue jobs used deduplication IDs — without that discipline retry logic produced duplicate clips on every transient Whisper failure.

<!-- CASE-STUDY-END -->

## Key Features

### Core Pipeline
- **Multi-source ingestion** — Upload MP4 files directly or paste a YouTube URL (yt-dlp handles download)
- **Speech-to-text with word-level timestamps** — OpenAI Whisper API with intelligent chunking for long-form content (8+ hours supported)
- **AI-powered moment detection** — Multi-layered heuristic scoring + GPT-4o-mini re-ranking to identify the most clip-worthy segments
- **Automated clip rendering** — FFmpeg-based pipeline producing 1080×1920 H.264 clips with burned ASS captions

### Moment Detection System
- **Energy peak analysis** — Detects excitement markers, modern slang, emotional triggers, controversy signals, speech pace, and punctuation patterns
- **Story arc detection** — Identifies narrative moments, first-person storytelling, and temporal transitions
- **Hook pattern matching** — Recognizes viral hooks ("wait until you see this", "plot twist", "no one talks about this")
- **Speaker change detection** — Tracks conversation dynamics, Q&A patterns, and formality shifts
- **GPT re-ranking** — Top candidates scored on Immediate Engagement (30%), Emotional Resonance (25%), Standalone Value (25%), and Shareability (20%)
- **Completeness scoring** — Optional GPT-based evaluation of setup→payoff structure for podcast-style content

### Clip Editing (Premium)
- **Custom hook titles** — Edit AI-generated titles with inline save
- **Multiple aspect ratios** — 9:16 (TikTok/Shorts), 1:1 (Instagram), 16:9 (YouTube) with automatic re-rendering
- **Drag-to-adjust timing** — Visual timeline scrubber with real-time preview, constrained to 15–120 second clips
- **Bulk download** — Server-side ZIP creation for all clips in a project

### Billing & Quotas
- **Stripe integration** — Checkout sessions, subscription lifecycle via webhooks, billing portal
- **Tiered plans** — Free (60 min/month, watermarked), Pro ($29/mo, 600 min), Agency ($99/mo, 2000 min)
- **Real-time quota enforcement** — Minutes deducted at transcription start, monthly reset on payment success
- **Premium feature gating** — Server-side plan validation for editing tools, aspect ratios, bulk download

### Project Management
- **Dashboard** — Project count, clips generated, downloads available, quota usage with progress bars
- **Queue visibility** — Real-time queue position and ETA via SSE with polling fallback
- **Export** — JSON metadata and CMX3600 EDL format for professional video editors
- **Contact form** — Nodemailer-based email with HTML templates

---

## Technical Highlights

**Three-stage decoupled pipeline.** Transcription, detection, and rendering run as independent BullMQ jobs on separate queues with independent concurrency tuning. Each stage can fail, retry (3x with exponential backoff), and recover without affecting the others. Lock durations and per-job timeouts prevent stalled jobs from blocking the system.

**Long-form video scalability.** Videos longer than 45 minutes are automatically split into 10-minute audio chunks, each processed independently by Whisper, with timestamps merged back to global time. This keeps memory bounded and avoids API timeouts regardless of input length.

**Adaptive clip windowing.** Rather than fixed-length clips, the detection system generates candidates at multiple positions (30%, 50%, 70%) around each identified moment with adaptive windows (35–75s), then deduplicates overlapping candidates before GPT scoring. This produces clips that start and end at natural breakpoints.

**In-memory caching layer.** Quota lookups, project lists, and clip data are cached with TTL-based expiration (1–30 minutes depending on volatility) and pattern-based invalidation. Reduces database load without external cache infrastructure.

**Idempotent job processing.** Detection deletes existing clips before creating new ones. Rendering checks for double-render attempts. Queue jobs use auto-generated IDs with deduplication. This makes the entire pipeline safe to retry.

**Structured error taxonomy.** Errors are classified as retryable (API failures, S3 timeouts, FFmpeg crashes) or terminal (quota exceeded, invalid format, file too large). Retryable errors trigger backoff; terminal errors fail immediately with user-friendly messages.

**S3 lifecycle management.** Storage paths are tier-segmented (`users/free/` vs `users/paid/`), enabling different lifecycle policies — free-tier files expire after 90 days, paid-tier transitions to Glacier. Temporary processing files are cleaned after 7 days.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 Web App                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Pages &  │  │   API    │  │  Clerk   │  │  Stripe   │  │
│  │Components │  │  Routes  │  │   Auth   │  │  Billing  │  │
│  └──────────┘  └────┬─────┘  └──────────┘  └───────────┘  │
│                     │                                       │
│              ┌──────┴──────┐                                │
│              │   BullMQ    │                                │
│              │  (Enqueue)  │                                │
│              └──────┬──────┘                                │
└─────────────────────┼───────────────────────────────────────┘
                      │ Redis (Upstash)
┌─────────────────────┼───────────────────────────────────────┐
│              ┌──────┴──────┐       Worker Service           │
│              │   BullMQ    │       (Dockerized)             │
│              │  (Process)  │                                │
│              └──────┬──────┘                                │
│    ┌────────────────┼────────────────┐                      │
│    │                │                │                      │
│  ┌─┴──────┐  ┌─────┴─────┐  ┌──────┴──┐                   │
│  │Transcr. │  │  Detect   │  │ Render  │                   │
│  │Whisper  │  │Heuristics │  │ FFmpeg  │                   │
│  │  API    │  │ + GPT-4o  │  │  + ASS  │                   │
│  └────────┘  └───────────┘  └─────────┘                    │
└─────────────────────────────────────────────────────────────┘
         │                                    │
    ┌────┴────┐                          ┌────┴────┐
    │ OpenAI  │                          │ AWS S3  │
    │  APIs   │                          │ Storage │
    └─────────┘                          └─────────┘
         │
    ┌────┴─────┐
    │PostgreSQL│
    │  (Neon)  │
    └──────────┘
```

### Frontend — Next.js 15 with App Router
- Server components for data loading, client components for interactivity
- Clerk middleware protects all non-public routes with automatic redirect-to-sign-in
- Tailwind CSS + shadcn/ui component library (Radix UI primitives)
- Framer Motion for animations, Sonner for toast notifications
- Real-time queue monitoring via SSE with polling fallback

### Backend — Next.js API Routes
- 17 API routes handling uploads, processing pipeline triggers, clip editing, billing, queue status, quota management, exports, and contact
- Presigned S3 URLs for secure direct uploads (5-minute expiry)
- Streaming ZIP generation for bulk downloads (Archiver library)
- Stripe webhook handler for subscription lifecycle events

### Worker — Node.js Background Processor
- Separate Dockerized service with FFmpeg, Python 3, and yt-dlp
- Three BullMQ queues: `q_transcribe` (1× concurrency), `q_detect` (2×), `q_render` (0.5×)
- Per-job timeout wrappers (transcribe: 20min, detect: 10min, render: 15min)
- 10-minute lock duration with stalled job detection and force-fail recovery

### Database — PostgreSQL via Prisma
- Neon serverless Postgres with connection retry logic and health checks
- Singleton Prisma client optimized for serverless (avoids connection exhaustion)
- Cascade deletes from Projects to Transcripts, Clips, and ExportManifests

### Queue — BullMQ + Redis (Upstash)
- TLS-enabled Redis connection with IPv4 forced (Upstash compatibility)
- 3 retries with exponential backoff (2s base) on all queues
- Queue health monitoring every 30 seconds with active job tracking
- Automatic cleanup: keeps 50 completed / 20 failed jobs for 24 hours

### Storage — AWS S3
- Tier-segmented paths: `users/{free|paid}/{userId}/projects/{projectId}/clips/{clipId}.mp4`
- Presigned URLs for both upload (5-min expiry) and download/stream (1-hour expiry)
- Lifecycle rules by tier with automatic Glacier transition for paid users

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript (strict mode) throughout |
| **Frontend** | Next.js 15, React 19, App Router, Turbopack |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion |
| **Auth** | Clerk (middleware-level route protection) |
| **Database** | PostgreSQL (Neon), Prisma ORM |
| **Queue** | BullMQ, Redis (Upstash, TLS) |
| **Storage** | AWS S3 (presigned URLs, lifecycle policies) |
| **AI/ML** | OpenAI Whisper (transcription), GPT-4o-mini (moment scoring) |
| **Video** | FFmpeg (H.264 encoding, ASS subtitles), yt-dlp (YouTube download) |
| **Billing** | Stripe (Checkout, Subscriptions, Webhooks, Billing Portal) |
| **Email** | Nodemailer (Gmail SMTP) |
| **Monorepo** | pnpm workspaces |
| **Container** | Docker (Node 20 + FFmpeg + yt-dlp) |

---

## Feature Deep Dive

### Video Ingestion

Users create a project by either uploading an MP4 or providing a YouTube URL. MP4 uploads go directly to S3 via a presigned URL generated by the API — the file never touches the server. YouTube URLs are validated against multiple URL patterns (standard, shortened, embed, live) and the worker downloads them via yt-dlp with format selection for best MP4 quality.

Before accepting a project, the API checks the user's remaining quota against their plan limits. Minutes are deducted when transcription begins, not when it completes — this prevents quota abuse from abandoned jobs.

### Transcription Pipeline

For videos under 45 minutes, the worker extracts audio using FFmpeg, optionally compresses it (CRF 35, 480p) if over 25MB, and sends it to OpenAI's Whisper API with `verbose_json` format and word-level timestamp granularity. An adaptive timeout scales with video duration (minimum 15 minutes, up to 0.8× video length).

For long-form content (45+ minutes), the worker splits the video into 10-minute audio segments, processes each independently, adjusts word timestamps to global time offsets, and merges the results. This keeps memory bounded and prevents API timeouts.

The transcript is stored as both full text and a JSON array of word-level timestamps, which are later used for caption generation and moment boundary detection.

### Moment Detection

Detection runs in multiple stages:

1. **Heuristic scoring** scans the transcript for energy peaks (excited lexicon, exclamations, ALL CAPS, fast speech), story markers (narrative language, first-person indicators, temporal words), hook patterns (viral phrases, value words, superlatives), and speaker changes (pauses, Q&A patterns, formality shifts).

2. **Candidate generation** creates variable-length windows (35–75s) around detected moments at three positions, plus fixed-window candidates for coverage. Each candidate receives a composite score based on moment type bonuses, pacing quality, sentence completeness, and viral pattern presence.

3. **Deduplication** removes candidates with >50% overlap.

4. **GPT re-ranking** sends the top 15 candidates to GPT-4o-mini with a structured scoring rubric. The model returns scores across four dimensions and generates hook titles.

5. **Final selection** picks the top 2–4 clips with minimum 15-second spacing and no overlap.

For podcast-style content (30+ minutes or audio-only), an optional completeness scoring pass uses GPT to evaluate setup→payoff structure and auto-extend clip windows that don't contain a complete thought.

### Clip Rendering

Each selected clip is rendered independently by FFmpeg:

- **Smart cropping** probes input dimensions and calculates crop/letterbox parameters for the target aspect ratio, preserving center content
- **High-quality encoding** — H.264 High Profile, CRF 18, 10Mbps max bitrate, 30fps, AAC 192kbps audio
- **ASS subtitle burning** — Arial Black 68px, white with black outline, smart line breaks at punctuation and natural pauses (max 3 seconds or 5 words per line, 35-character limit)
- **Upload** to S3 with tier-segmented paths and render key tracking

When all clips in a project finish rendering (or fail), the project status updates to `ready` or `failed`.

### Billing & Subscription Management

Stripe Checkout creates subscription sessions with plan metadata. Five webhook events drive the subscription lifecycle:

- `checkout.session.completed` — Activates the user's plan
- `customer.subscription.updated` — Handles plan changes based on price ID
- `customer.subscription.deleted` — Downgrades to free
- `invoice.payment_succeeded` — Resets the monthly minute quota
- `invoice.payment_failed` — Logs for support follow-up

All webhook events are stored as `BillingEvent` records for audit. The billing portal (Stripe-hosted) handles cancellation, payment method updates, and invoice history.

### Export System

Projects can be exported as JSON (full metadata with optional presigned clip URLs) or CMX3600 EDL (industry-standard edit decision list). EDL exports include timecode conversion and clip metadata as comments, allowing editors to import clips into professional NLEs. Export manifests are persisted in the database.

---

## Data Model

```
User
├── id, email, plan (free/pro/agency)
├── minutesUsedMonth, stripeCustomerId, stripeSubscriptionId
├── Projects[]
├── BillingEvents[]
├── ApiKeys[]
├── IntegrationSettings (Twitch, Discord, custom S3)
├── Markers[]
├── WebhookSubscriptions[]
└── WorkerRegistrations[]

Project
├── id, userId, name, sourceType (upload/youtube), sourceUrl, storageKey
├── durationSec, status, vodStartAt
├── Transcripts[]
├── Clips[]
├── ExportManifests[]
└── Markers[]

Clip
├── id, projectId, startSec, endSec, title
├── captionJson, scoresJson, aspect (9:16/1:1/16:9)
├── status (pending/rendering/ready/failed), renderKey
└── ReviewActions[]

Transcript
├── id, projectId, language
├── textFull, wordsJson (word-level timestamps)
└── createdAt
```

**Status flow:** `uploaded` → `transcribing` → `transcribed` → `detecting` → `detected` → `rendering` → `ready` (or `failed` at any stage)

All project-scoped entities cascade on delete. The schema includes forward-looking models (ApiKey, IntegrationSettings, WebhookSubscription, WorkerRegistration, ReviewAction) that support future API access, third-party integrations, distributed workers, and team review workflows.

---

## Security & Reliability

- **Route protection** — Clerk middleware enforces authentication on all non-public routes; API routes verify user identity and ownership before any data access
- **Presigned URLs** — Files are never proxied through the server; S3 presigned URLs with short TTLs (5 min upload, 1 hour download) prevent unauthorized access
- **Webhook verification** — Stripe webhooks are validated with signature verification before processing
- **Quota enforcement** — Server-side validation at both project creation and transcription start; no client-side bypass possible
- **Premium feature gating** — Plan checks happen at the API layer, not just the UI
- **Database resilience** — Prisma connection retry with exponential backoff, health checks, graceful shutdown on SIGINT/SIGTERM
- **Job recovery** — Stalled job detection with force-fail, 10-minute lock durations, automatic cleanup of old jobs
- **Idempotent processing** — Detection deletes before creating, render checks for duplicate attempts, queue jobs use deduplication IDs
- **Structured error handling** — Centralized `AppError` class with context tracking (userId, projectId, action, timestamp) and retryable/terminal classification
- **Stream cleanup** — All file streams are destroyed on error paths to prevent resource leaks
- **Input validation** — YouTube URL regex validation, file type checks, duration constraint enforcement, aspect ratio whitelist

---

## Project Structure

```
clipify/
├── apps/
│   ├── web/                          # Next.js 15 frontend + API
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages + API routes
│   │   │   │   ├── api/              # 17 API route handlers
│   │   │   │   ├── dashboard/        # Dashboard page
│   │   │   │   ├── projects/         # Project management page
│   │   │   │   ├── upload/           # Upload page
│   │   │   │   ├── pricing/          # Pricing page
│   │   │   │   └── ...               # Legal pages, auth, features
│   │   │   ├── components/           # React components
│   │   │   │   ├── ui/               # shadcn/ui primitives
│   │   │   │   ├── ProjectsClient    # Project list + clip management
│   │   │   │   ├── ClipPreviewModal  # Video player with controls
│   │   │   │   ├── VideoTimeline     # Drag-to-adjust timing editor
│   │   │   │   ├── QueueStatus       # Real-time queue monitoring
│   │   │   │   └── ...               # Upload, billing, layout
│   │   │   ├── lib/                  # Utilities
│   │   │   │   ├── quota.ts          # Quota management + caching
│   │   │   │   ├── stripe.ts         # Plan config + Stripe helpers
│   │   │   │   ├── premium.ts        # Feature flags by plan
│   │   │   │   ├── queue.ts          # BullMQ queue singletons
│   │   │   │   ├── cache.ts          # TTL-based in-memory cache
│   │   │   │   ├── s3-lifecycle.ts   # S3 path + lifecycle rules
│   │   │   │   ├── db.ts             # Prisma singleton + retries
│   │   │   │   ├── errors.ts         # Error taxonomy + retry logic
│   │   │   │   └── email.ts          # Contact form email templates
│   │   │   └── middleware.ts         # Clerk route protection
│   │   └── prisma/schema.prisma      # Database schema (12 models)
│   │
│   └── worker/                       # Background job processor
│       ├── src/
│       │   ├── worker.ts             # Main worker (transcribe + detect + render)
│       │   ├── helper-functions.ts   # Moment detection heuristics
│       │   ├── completeness-scoring  # GPT-based podcast clip evaluation
│       │   ├── queues.ts             # Queue definitions + concurrency
│       │   ├── quota.ts              # Worker-side quota enforcement
│       │   ├── errors.ts             # Error types + retry classification
│       │   ├── db.ts                 # Prisma client + health checks
│       │   ├── s3.ts                 # S3 client configuration
│       │   └── env.ts                # Environment validation
│       ├── prisma/schema.prisma      # Worker database schema
│       └── Dockerfile                # Node 20 + FFmpeg + yt-dlp
│
└── pnpm-workspace.yaml               # Monorepo workspace config
```

---

## User Flow

1. **Sign up** via Clerk (email or OAuth) → redirected to dashboard
2. **Create project** — name it, then upload an MP4 or paste a YouTube URL
3. **Automatic processing** — transcription starts immediately; detection and rendering follow automatically
4. **Monitor progress** — queue position and ETA shown in real-time via SSE
5. **Review clips** — preview each clip in a video player modal with playback controls
6. **Edit (Pro/Agency)** — adjust titles, change aspect ratios, fine-tune timing on a visual timeline
7. **Download** — individual clips or bulk ZIP; export metadata as JSON or EDL
8. **Manage subscription** — upgrade/downgrade via Stripe, monitor quota on dashboard

---

## Extensibility

The schema and architecture include several designed-for-growth patterns:

- **ApiKey model** and webhook subscription system support future API access for programmatic clip generation
- **IntegrationSettings** stores Twitch OAuth tokens, Discord channel configs, and custom S3 credentials per user — ready for third-party integrations
- **WorkerRegistration** with heartbeat tracking supports distributed worker scaling across regions
- **ReviewAction** model enables team-based clip review workflows (approve/reject)
- **Marker** model supports user-defined timestamps for manual moment flagging
- **ExportManifest** persistence creates an audit trail for all exports
- **Configurable concurrency** per queue type allows tuning worker resources without code changes
- **Aspect ratio whitelist** via environment variable makes adding new formats a config change

---

## Summary

Clipify is a full-stack SaaS application that solves a real problem for content creators: turning hours of raw footage into polished, captioned short-form clips without manual editing. The system combines a multi-layered AI detection pipeline (heuristic analysis + GPT scoring), a production-grade job processing architecture (BullMQ with retry/recovery/monitoring), and a complete subscription billing system — all deployed as a monorepo with a Next.js frontend and a Dockerized worker service. The codebase is designed for reliability at every layer: idempotent jobs, structured error handling, quota enforcement, presigned-URL security, and graceful degradation.
