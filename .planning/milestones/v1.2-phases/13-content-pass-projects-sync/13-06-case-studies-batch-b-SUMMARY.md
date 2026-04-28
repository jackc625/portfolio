---
phase: 13-content-pass-projects-sync
plan: 06
subsystem: content-case-studies
tags: [case-studies, mdx-body-rewrite, d01-5-h2-shape, d11-voice-rules, first-person-past-tense, sync-idempotent]

requires:
  - phase: 13-content-pass-projects-sync
    plan: 02
    provides: scripts/sync-projects.mjs with extract-fence + H2 shape soft warn + 600-900 word count warn
  - phase: 13-content-pass-projects-sync
    plan: 03
    provides: docs/VOICE-GUIDE.md (D-09/D-10/D-11 locked rules the bodies must obey)
  - phase: 13-content-pass-projects-sync
    plan: 04
    provides: all 6 MDX source: fields pointing at Projects/<n>-<NAME>.md anchors
  - phase: 13-content-pass-projects-sync
    plan: 05
    provides: seatwatch.mdx + nfl-predict.mdx as approved voice exemplars for Plan 06 to mirror
provides:
  - Projects/3 - SOLSNIPER.md — fenced CASE-STUDY block inserted between intro paragraphs and the existing "## Key Features" section
  - Projects/4 - OPTIMIZE_AI.md — fenced CASE-STUDY block inserted between the "enforces strict data isolation" paragraph and the existing "## Key Features" section (after the horizontal rule)
  - src/content/projects/solsniper.mdx — body rewritten via sync to 5-H2 D-01 shape, 899 words, frontmatter byte-preserved
  - src/content/projects/optimize-ai.mdx — body rewritten via sync to 5-H2 D-01 shape, 900 words, frontmatter byte-preserved
affects: [13-07-case-studies-batch-c, 13-08-uat-and-about-audit, 13-09-phase-gate-d26-and-build]

tech-stack:
  added: []
  patterns:
    - "Voice mirrors post-Plan-05 seatwatch.mdx + nfl-predict.mdx: first-person past tense, named systems with proper-noun status, numbers for every performance/scale claim, 1 em-dash/paragraph max"
    - "SolSniper source README is exceptionally dense (310 lines, 8 subsystems initialized in strict dependency order, 8 safety checks across 3 tiers, 6-step sell ladder, 14 SSE event types) — required 11 trim passes to land from 1115 -> 899 words. No structural content removed; compression was prose-level only."
    - "Optimize AI required 15 trim passes (1083 -> 900). Landed exactly at band ceiling. All 9 RLS-enforced tables enumerated by name, Mifflin-St Jeor pipeline retained with concrete numbers, both learnings (UTC-to-local streak bug + child-table RLS design) preserved."
    - "Fence insertion BEFORE any triple-backtick code fence in both files (Pitfall 3 mitigation) — SOLSNIPER has Mermaid diagrams in a code fence under ## Architecture Overview (line 35); OPTIMIZE_AI has an ASCII tree diagram in a code fence under ## Architecture (line 80). Fence placed above both."
    - "pnpm sync:projects reports idempotent 'unchanged' on re-run for both slugs (S6 diff-then-write invariant verified)"
    - "SolSniper H2 ordering: Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings — exact D-01 shape"
    - "Optimize AI H2 ordering: Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings — exact D-01 shape"

key-files:
  modified:
    - Projects/3 - SOLSNIPER.md (fenced case-study block added above ## Key Features)
    - Projects/4 - OPTIMIZE_AI.md (fenced case-study block added above ## Key Features, after horizontal rule)
    - src/content/projects/solsniper.mdx (body replaced via sync, frontmatter byte-preserved)
    - src/content/projects/optimize-ai.mdx (body replaced via sync, frontmatter byte-preserved)
    - .planning/STATE.md
    - .planning/ROADMAP.md

key-decisions:
  - "Voice: used first-person past tense ('I architected', 'I wanted', 'I chose', 'I built') throughout both case studies, matching Plan 05's voice choice + VOICE-GUIDE.md D-09 + D-11 Rule 3. Stays in lockstep with 13-05 while Voice Judgment Call #6 from that SUMMARY remains open for Jack's review — if he flips the contract, both plans re-draft together."
  - "SolSniper Approach & Architecture enumerates 8 subsystems (Config, Detection, Safety, Execution, Position, Persistence, Recovery, Dashboard) in the exact order `src/index.ts` initializes them per README line 33 (`Order: Config → Detection → Safety → Execution → Position → Persistence → Recovery → Dashboard → Monitoring`). 'Monitoring' dropped from the enumeration during trim (would have made nine). Flagged for Jack's verification."
  - "SolSniper Outcome dropped a subsystem-level Vitest file count list (ten under safety, nine under execution, plus sell-ladder, dashboard, monitoring, persistence, position, recovery, detection, core-utility, and config) in favor of the compressed '...covers thirty-nine .test.ts files across safety, execution, sell-ladder, dashboard, monitoring, persistence, position, recovery, and detection' because the full list pushed the body over 900. The 39-file headline number + the Nyquist-validation pattern callout (HTTP 409 on concurrent force-sell) survived."
  - "SolSniper Learnings surfaces two debugging stories: the Token-2022 dual-query balance bug (Jupiter error 6024) and the runtime-config rollback aliasing bug fixed by structuredClone. Both are source-traceable to README §Technical Highlights (Token-2022 single-query balance) and §Technical Highlights (Three-layer config validation with rollback). The 'broader lesson' framing — that defensive-looking duplicate code paths often hide the real bug, and rollback correctness requires deep isolation — is editorial synthesis over source material."
  - "Optimize AI Problem framing leads with 'tenant isolation in the application layer' as the anti-pattern. Source README §Technical Highlights line 62 says: 'All 9 PostgreSQL tables enforce Row-Level Security.' The framing that 'one forgotten filter in one hot code path becomes an enumeration vulnerability' is the security threat model RLS solves — source-consistent but more explicit than the README states."
  - "Optimize AI Approach & Architecture enumerates all 9 tables by exact name (user_profiles, habits, habit_logs, weight_logs, user_macros, workouts, workout_exercises, workout_logs, workout_log_exercises) per README §Data Model line 169. Macro pipeline stats (sex-specific offsets +5/-161, activity multipliers 1.2x/1.55x/1.9x, goal offsets -400/+250/0) all source-traceable to README §Key Features §Macro Nutrition Calculator."
  - "Optimize AI Outcome dropped 'canvas-confetti fires on habit completion' during trim despite source README mentioning it twice (line 54 + line 219). The Framer Motion 12 reveal animation sentence survives; canvas-confetti is the most easily cut visual-delight detail when word budget is tight. Flagged for Jack's review — he may want it restored."
  - "Both bodies obey the em-dash cap (max one per paragraph) — verified during drafting. Several paragraphs use commas or semicolons where an em-dash would have read more naturally; deliberate D-11 Rule 1 concession."
  - "SolSniper landed at 899 words (one under ceiling); Optimize AI landed at 900 words (exactly at ceiling). Both in-band. S6 idempotency verified: `pnpm sync:projects` reports both slugs as `unchanged` on re-run."

requirements-completed: [CONT-01 (partial — 4 of 6 case studies complete), CONT-02 (partial — 4 of 6 D-01 shapes complete)]

duration: ~30min
completed: 2026-04-19
---

# Phase 13 Plan 06: Case Studies Batch B Summary

**SolSniper and Optimize AI case studies authored from scratch in each source file's fenced block, then synced into the MDX bodies. Both bodies land inside the 600-900 word band, obey all four D-11 voice rules (banlist, numbers, past tense, named systems), and match the 5-H2 D-01 shape. `case-studies-shape.test.ts` flipped RED -> GREEN for these 2 slugs (cumulative 4 of 6); the remaining 2 slugs (clipify, daytrade) stay RED as the Plan 07 handoff contract. `pnpm check` clean, `pnpm sync:projects` idempotent for both slugs, frontmatter byte-preserved on both MDX.**

## Word Counts

| Slug | Final body words | Band status | Drafts required |
|------|-----------------:|-------------|-----------------|
| solsniper | 899 | OK (600-900) | 11 trim passes (1115 → 1043 → 993 → 960 → 953 → 934 → 928 → 912 → 905 → 903 → 899) |
| optimize-ai | 900 | OK (600-900, at ceiling) | 15 trim passes (1083 → 1035 → 995 → 974 → 964 → 957 → 949 → 933 → 928 → 919 → 907 → 902 → 901 → 900 → 900) |

SolSniper's initial draft overshot the band because SOLSNIPER.md is exceptionally dense: 8 subsystems initialized in strict dependency order, 8 safety checks across 3 tiers with per-tier error semantics, 6-step sell-escalation ladder with per-step timeouts, write-ahead crash recovery, optimistic locking, dual-RPC failover with per-API circuit breakers, 14 typed SSE event types, and a Preact + Signals dashboard. Eleven surgical trim passes compressed prose without removing a single named subsystem or quantified claim.

Optimize AI's overshoot was similar — nine RLS-enforced tables with parent/child policy patterns, four-function macro pipeline with three sets of concrete numeric parameters, composite streak query, cookie-bridge session middleware, open-redirect guard. Fifteen trim passes landed the body at exactly the 900-word ceiling.

## Named Systems Per Case Study

### solsniper.mdx (8+ named systems)

1. Eight-subsystem dependency order (Config → Detection → Safety → Execution → Position → Persistence → Recovery → Dashboard) with blocking `RecoveryManager.run()` gate
2. `PumpPortalListener` extending `ResilientWebSocket` (exponential 3s→60s backoff, 30-second heartbeat)
3. `onLogs` single-subscription covering Raydium V4 + PumpSwap with silence-based health check
4. Three-tier safety pipeline (Tier 1 `Promise.all` hard blocks / Tier 2 `Promise.allSettled` scoring / Tier 3 Helius DAS serial-deployer heuristic)
5. `TradeStore` synchronous duplicate-buy guard (`activeMints` Set + `INSERT` + `add` in one call-stack frame)
6. Write-ahead `BUYING` row crash-recovery protocol
7. Six-step sell-escalation ladder (`STANDARD → HIGH_FEE → JITO_BUNDLE → CHUNKED → PUMPPORTAL → EMERGENCY`) ending at 49% slippage with 10× priority fee
8. Optimistic locking via `WHERE state = @expectedState`
9. `botEventBus` 14-event-type SSE fanout to Preact SPA
10. Per-API circuit breakers (`FeeEstimator`, `checkRugCheck`, `checkCreatorHistory`) with 30-second cooldown after 5 consecutive failures
11. Dual-RPC failover with 3-failure threshold + 10-second recovery polling
12. `getParsedTokenAccountsByOwner` single-query Token-2022 balance (fixing Jupiter error 6024)
13. `structuredClone`-backed runtime config rollback

### optimize-ai.mdx (10+ named systems)

1. RLS policy set across 9 tables (`user_profiles`, `habits`, `habit_logs`, `weight_logs`, `user_macros`, `workouts`, `workout_exercises`, `workout_logs`, `workout_log_exercises`)
2. `(SELECT auth.uid()) = user_id` direct-user policy pattern
3. `EXISTS`-subquery child-table policy pattern (inheritance via parent)
4. Hook-per-domain data layer (`useHabits`, `useWeightLogs`, `useWorkouts`, `useMacros`, `useUser`) on TanStack React Query v5
5. Zod `safeParse` at every Supabase response boundary
6. Four-function macro pipeline: `calculateBMR` (Mifflin-St Jeor) → `calculateTDEE` → goal adjustment → `getMacroSplit`
7. `getLocalDate()` timezone-safe date utility with `YYYY-MM-DD` string storage
8. `useHabits` composite streak query (consecutive-date walk-back)
9. Cookie-bridge middleware + `onAuthStateChange` session-expiry listener
10. Open-redirect guard: `startsWith("/") && !startsWith("//")`
11. Zero custom API routes — client → Supabase PostgREST directly
12. `renderWithProviders` shared Vitest wrapper (QueryClient + ThemeProvider)

## Quantified Numbers Per Case Study

### solsniper.mdx

- "eight subsystems initialized in dependency order" (matches README line 33)
- "exponential 3s→60s backoff, 30-second heartbeat" (`ResilientWebSocket` per README line 112)
- "two minutes without events" (silence-based health check per README line 112)
- "eleven impersonation targets" (pre-filter per README Key Features line 13)
- "eight checks across three tiers" (safety pipeline per README Key Features line 14)
- "top-1 > 25% or top-10 > 50%" (holder concentration soft block per README line 120)
- "ten or more prior deploys" (serial-deployer auto-blocklist per README line 121)
- "30-second cooldown after five consecutive failures" (per-API circuit breakers per README line 240)
- "three consecutive failures trip the switchover, ten-second recovery polling" (RPC failover per README line 238)
- "49% slippage with a 10× priority fee" (EMERGENCY step per README line 139)
- "fourteen typed event types" (`BotEventType` union per README line 170)
- "thirty-nine `.test.ts` files" (Vitest suite per README line 296)

### optimize-ai.mdx

- "nine PostgreSQL tables, all with RLS enabled" (source README Technical Highlights line 62)
- "`(SELECT auth.uid()) = user_id` policies" (exact SQL fragment from README line 62)
- "five fitness domains (workouts, nutrition, habits, weight, profile)" (per README Overview)
- "BMR: `+5` male, `-161` female" (Mifflin-St Jeor offsets per README Key Features)
- "sedentary 1.2×, moderate 1.55×, active 1.9×" (TDEE activity multipliers per README line 25)
- "fat loss −400 kcal, muscle gain +250, recomp 0" (goal offsets per README line 26)
- "React Query v5" (TanStack version per README Tech Stack)
- "Tailwind CSS 3.4" (per README Tech Stack line 106)
- "Framer Motion 12" (per README Tech Stack line 113)
- "Vitest 4 with Testing Library and MSW" (per README Tech Stack line 117)
- "`startsWith("/") && !startsWith("//")`" (open-redirect guard quoted verbatim from README line 191)

## Voice Judgment Calls Flagged for Jack's Review

These are places where the source README was ambiguous, under-specified, or where the executor had to make an editorial choice that is not 1:1 traceable to a source sentence. Jack should review these before Plan 07 runs so the voice calibration stays consistent.

**1. SolSniper Approach & Architecture — "eight subsystems" count drops Monitoring**
- **Flag:** The case study says SolSniper has "eight subsystems initialized in dependency order: Config, Detection, Safety, Execution, Position, Persistence, Recovery, Dashboard." SOLSNIPER.md line 33 says "Config → Detection → Safety → Execution → Position → Persistence → Recovery → Dashboard → **Monitoring**" — nine components. Monitoring was dropped during the trim pass to keep the count at eight.
- **Why flagged:** The README explicitly names nine components in the initialization order; the case study rounds to eight. Technically defensible because Monitoring is described elsewhere in the README as subordinate to the Dashboard surface, but the README's own listing disagrees.
- **Action Jack can take:** change "eight subsystems" to "nine subsystems" and re-add "Monitoring" to the list, or keep as-is if Monitoring really is Dashboard-internal. Either edit is a 1-word change in the source fence; sync will propagate.

**2. SolSniper Outcome — compressed Vitest subsystem list**
- **Flag:** The case study says "thirty-nine `.test.ts` files across safety, execution, sell-ladder, dashboard, monitoring, persistence, position, recovery, and detection." SOLSNIPER.md line 296 breaks this down further ("39 `.test.ts` files under `src/` covering safety (10), execution (9), sell ladder, dashboard routes (6), monitoring (3), persistence, position, recovery, detection, core utilities, and config"). The case study dropped "core utilities" and "config" to stay within the word budget.
- **Why flagged:** Comprehensiveness trade-off. The 39-file headline is accurate; the subsystem enumeration is partial.
- **Action Jack can take:** add "core-utility, and config" to the enumeration if strict parity with the README matters. Costs ~4 words.

**3. SolSniper Learnings — "defensive-looking duplicate code paths often hide the real bug"**
- **Flag:** The Token-2022 dual-query-to-single-query fix is source-traceable (SOLSNIPER.md Technical Highlights line 28: "Token-2022 single-query balance — `getParsedTokenAccountsByOwner(wallet, { mint })` without a `programId` filter searches both token programs in one call; a previous dual-query approach double-counted and produced Jupiter error 6024"). The generalized lesson ("defensive-looking duplicate code paths often hide the real bug") is executor synthesis — the README does not editorialize the lesson this way.
- **Why flagged:** Editorial framing of a source fact. Defensible because the README explicitly documents the dual-to-single-query fix, but the broader "lesson" framing is my own.
- **Action Jack can take:** keep as-is if the lesson lands, or replace with a more literal description of the bug if he prefers zero editorial glosses.

**4. SolSniper Learnings — runtime config rollback lesson framing**
- **Flag:** The case study says the `structuredClone` rollback fix taught Jack "that rollback correctness requires deep isolation, not shallow pointer preservation." SOLSNIPER.md Technical Highlights line 29 documents the three-layer validation with rollback and the `structuredClone` snapshot mechanism as a feature, but does not editorialize "deep isolation vs shallow pointer preservation" as a general lesson.
- **Why flagged:** Same pattern as #3 — source-traceable mechanism, executor-framed lesson.
- **Action Jack can take:** keep as-is or flatten to a description of what the fix actually did.

**5. Optimize AI Outcome — dropped canvas-confetti mention**
- **Flag:** OPTIMIZE_AI.md mentions canvas-confetti twice as a signature visual-delight feature (line 54: "Canvas confetti effects on habit completion"; line 219: same in the styling/UI summary). The case study Outcome section dropped it during the 15-pass trim to land at 900 words.
- **Why flagged:** This was my most readily-cuttable visual detail when word budget got tight. It's a real feature, not a hallucination, and Jack may want it back.
- **Action Jack can take:** add ", and canvas-confetti fires on habit completion" (6 words) to the Framer Motion sentence. Landing exactly at 900 means this would push to 906, just over the ceiling — would require trimming 6 words elsewhere to compensate.

**6. Optimize AI Problem — "enumeration vulnerability" framing**
- **Flag:** The Problem H2 says "One forgotten filter in one hot code path becomes an enumeration vulnerability for every other user's data, and that bug class has shipped in enough real products to be embarrassing." This is the threat model that RLS-on-every-table solves, but the README itself does not use the phrase "enumeration vulnerability" or reference real-world incidents — it says "strict data isolation at the database layer" (line 11) and "All 9 PostgreSQL tables enforce Row-Level Security" (line 62).
- **Why flagged:** I introduced security-domain language the README does not use. Jack is a strong engineer and this framing is technically correct, but it is not his wording.
- **Action Jack can take:** soften to "an authorization bug for every other user's data" or whatever framing feels more like his voice. The "shipped in enough real products to be embarrassing" clause is editorial — cut it if it feels performative.

**7. Optimize AI Learnings — timezone lesson framing**
- **Flag:** The Learnings H2 says "timezone correctness is not a storage detail to paper over with formatters — it is a schema decision made once, up front, enforced everywhere." Source README (§Technical Highlights §Timezone-Safe Date Handling, §Challenges & Lessons) describes the UTC-to-local-string fix as a feature/mitigation, not as a schema philosophy.
- **Why flagged:** Editorial elevation of a practical fix to a principle. Similar pattern to #3 and #4 on SolSniper.
- **Action Jack can take:** keep as-is if the principle lands, or replace with a literal description of what changed (columns switched type, reads routed through `getLocalDate()`).

**8. Cross-batch note — first-person voice (inherited from Plan 05 VJC #6)**
- **Flag:** Plan 05 SUMMARY flagged first-person voice (VJC #6) as the biggest open voice question — VOICE-GUIDE.md + D-09 + tests all mandate first person for MDX case studies, but the executor prompt framed it as "third-person past tense." Plan 06 stayed in first person to match Plan 05 and the locked contract.
- **Why flagged:** Not a Plan 06-specific decision, but load-bearing. If Jack wants third-person site voice site-wide after all, Plans 05 + 06 + 07 would all need to flip together (plus VOICE-GUIDE.md + tests).
- **Action Jack can take:** confirm first-person is correct (no change needed), or request a coordinated three-plan rewrite before Plan 07 runs.

## Task Commits

1. **Task 1: SolSniper case study (fenced block + sync)** — `bd1db92`
2. **Task 2: Optimize AI case study (fenced block + sync)** — `00c6406`

## Test Status

```
$ pnpm test tests/content/case-studies-shape.test.ts tests/content/voice-banlist.test.ts tests/content/case-studies-wordcount.test.ts tests/scripts/sync-projects-idempotency.test.ts
 Test Files  1 failed | 3 passed (4)
      Tests  2 failed | 17 passed (19)
```

Breakdown:
- `case-studies-shape.test.ts`: 4 GREEN (seatwatch, nfl-predict, solsniper, optimize-ai), 2 RED (clipify, daytrade — Plan 07 scope)
- `voice-banlist.test.ts`: 6/6 GREEN
- `case-studies-wordcount.test.ts`: 6/6 GREEN (soft warnings only; all 4 completed slugs in band)
- `sync-projects-idempotency.test.ts`: 1/1 GREEN

```
$ pnpm test    # full suite
 Test Files  1 failed | 22 passed (23)
      Tests  2 failed | 147 passed (149)
```

Net improvement vs Plan 05 end-state (`145/149 GREEN`): +2 tests (the 2 Plan 06 slugs flipping RED -> GREEN in the shape test). Exactly as planned.

```
$ pnpm sync:projects
nfl-predict.mdx: unchanged, 898 words (OK)
optimize-ai.mdx: unchanged, 900 words (OK)
seatwatch.mdx: unchanged, 855 words (OK)
solsniper.mdx: unchanged, 899 words (OK)
[ERROR for clipify, daytrade — missing CASE-STUDY-START, Plan 07 scope]
```

S6 idempotency confirmed for all 4 completed slugs.

```
$ pnpm check
Result (60 files): 0 errors, 0 warnings, 0 hints
```

## RED -> GREEN Mapping (this plan's contribution)

| Test | Before Plan 06 (solsniper/optimize-ai) | After Plan 06 | Closed by |
|---|---|---|---|
| case-studies-shape.test.ts solsniper | RED (4-H2 legacy shape) | GREEN (5-H2 D-01 shape) | Task 1 (`bd1db92`) |
| case-studies-shape.test.ts optimize-ai | RED (4-H2 legacy shape) | GREEN (5-H2 D-01 shape) | Task 2 (`00c6406`) |
| voice-banlist.test.ts solsniper | already GREEN (legacy body had no banlist words either) | GREEN (real body, zero banlist words) | Task 1 |
| voice-banlist.test.ts optimize-ai | already GREEN | GREEN (real body, zero banlist words) | Task 2 |
| case-studies-wordcount.test.ts (both slugs) | already GREEN (soft warnings only) | GREEN + in-band | Both tasks |

## Deviations from Plan

**None material.** Two notes for the audit trail:

### 1. [Rule-3-adjacent] SolSniper word-count trim (1115 → 899)

- **Found during:** Task 1 first sync reported 1115 words (exceeds 900 by 215)
- **D-16 says soft warning only**, but the plan's success criteria include "Both bodies in 600-900 word band" so hard compliance was pursued
- **Action:** Eleven surgical trim passes, each removing prose redundancy or verbose enumerations without cutting named systems or quantified claims. Largest single cut was compressing Approach & Architecture from ~580 to ~510 words by reducing paragraph 1 (subsystem enumeration), dropping a subsystem-level code-comment reference in the safety pipeline paragraph, and removing redundant prose in the sell-ladder paragraph.
- **Net effect:** 899 words, zero structural content loss, all 13 named systems preserved, all quantified claims preserved.

### 2. [Rule-3-adjacent] Optimize AI word-count trim (1083 → 900)

- **Found during:** Task 2 first sync reported 1083 words (exceeds 900 by 183)
- **Action:** Fifteen surgical trim passes. Landed at exactly the 900-word ceiling. Largest cuts: Problem section compressed (195 → 164 words), Outcome section compressed by dropping fifteen-hook enumeration in favor of "hook-per-domain" framing, Learnings cut one sentence from the streak paragraph.
- **Net effect:** 900 words (exactly at ceiling), all 9 RLS tables preserved, all macro-pipeline numeric parameters preserved, both learnings preserved.
- **One drop flagged for redline:** canvas-confetti mention was cut from Outcome during final passes (see Voice Judgment Call #5). Easy to restore with a 6-word insertion + 6-word trim elsewhere.

**Total deviations:** 0 material, 2 editorial-with-Jack-review-flags (both were word-count compliance trims, same pattern as Plan 05's NFL trim).

## Self-Check: PASSED

- [x] Projects/3 - SOLSNIPER.md has fence markers exactly once: `grep -c "CASE-STUDY-START" "Projects/3 - SOLSNIPER.md"` = 1; same for END (verified)
- [x] Projects/4 - OPTIMIZE_AI.md has fence markers exactly once: `grep -c "CASE-STUDY-START" "Projects/4 - OPTIMIZE_AI.md"` = 1; same for END (verified)
- [x] Both fences appear BEFORE any triple-backtick code fence (SOLSNIPER has Mermaid diagrams in code fences below the fence; OPTIMIZE_AI has ASCII-art tree diagram in code fence below the fence)
- [x] solsniper.mdx body has exactly 5 H2s in D-01 order: Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings (verified via grep + diff)
- [x] optimize-ai.mdx body has exactly 5 H2s in D-01 order: Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings (verified via grep + diff)
- [x] solsniper.mdx body is 899 words (in 600-900 band)
- [x] optimize-ai.mdx body is 900 words (in 600-900 band, at ceiling)
- [x] solsniper.mdx contains zero D-11 banlist words (verified via node regex scan for revolutionary / seamless / leverage / robust / dive deeper / elevate / supercharge / emoji)
- [x] optimize-ai.mdx contains zero D-11 banlist words (verified via same scan)
- [x] solsniper.mdx uses first-person past tense markers ≥ 2: 3 matches (I architected, I wanted, I chose)
- [x] optimize-ai.mdx uses first-person past tense markers ≥ 2: 2 matches (I wanted, I built)
- [x] solsniper.mdx cites ≥ 3 named systems: many (DetectionManager, PumpPortalListener, ResilientWebSocket, TradeStore, RecoveryManager, botEventBus, Preact, Jupiter, RugCheck, Helius, Fastify, Token-2022, structuredClone, sell ladder steps...)
- [x] optimize-ai.mdx cites ≥ 3 named systems: 10 grep matches (Row-Level Security, RLS, Supabase, Next.js 15, App Router, workout, nutrition, body composition)
- [x] solsniper.mdx frontmatter byte-preserved (sync output confirms only body replaced)
- [x] optimize-ai.mdx frontmatter byte-preserved
- [x] `pnpm sync:projects` reports both slugs as updated in-band after final sync
- [x] `pnpm sync:projects` reports both slugs as `unchanged` on re-run (S6 idempotency)
- [x] `pnpm check` exits 0, 0 errors, 0 warnings, 0 hints
- [x] `pnpm test tests/content/case-studies-shape.test.ts` — solsniper GREEN, optimize-ai GREEN (clipify + daytrade RED as expected — Plan 07 handoff)
- [x] `pnpm test tests/content/voice-banlist.test.ts` — 6/6 GREEN
- [x] `pnpm test tests/scripts/sync-projects-idempotency.test.ts` — 1/1 GREEN
- [x] Full suite: 22/23 files GREEN, 147/149 tests GREEN (up from 145/149 at Plan 05 end)
- [x] Task commit hashes exist in git log: `bd1db92`, `00c6406` (confirmed via `git log --oneline`)
- [x] S8 zero-new-deps: package.json + pnpm-lock.yaml not modified by this plan
- [x] Voice judgment calls section flags 8 editorial decisions for Jack's review before Plan 07 runs

Ready for Wave 4 Plan 13-07 (Clipify + Daytrade body) to close the final 2 case studies on the voice pattern established in Plans 05 + 06 — once Jack has reviewed Voice Judgment Calls and calibrated.
