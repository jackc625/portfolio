---
phase: 13
plan: 07
type: execute
wave: 4
depends_on: [02, 04]
files_modified:
  - Projects/5 - CLIPIFY.md
  - Projects/6 - DAYTRADE.md
  - src/content/projects/clipify.mdx
  - src/content/projects/daytrade.mdx
autonomous: true
requirements: [CONT-01, CONT-02]
must_haves:
  truths:
    - "Projects/5 - CLIPIFY.md and Projects/6 - DAYTRADE.md each contain the fenced case-study block with the 5 D-01 H2s in order"
    - "After `pnpm sync:projects`, src/content/projects/clipify.mdx and src/content/projects/daytrade.mdx bodies have the 5 D-01 H2s in order"
    - "Both MDX bodies in 600-900 word band (D-16 soft target)"
    - "Neither body uses any D-11 banlist word"
    - "Both bodies use first-person past-tense voice and reference at least 3 named systems"
    - "Both bodies cite at least one quantified performance/scale number"
    - "Plan 01 case-study tests for these 2 slugs are GREEN"
    - "After this plan, ALL 6 case studies are complete (CONT-01, CONT-02 fully closed at the automated-test layer)"
  artifacts:
    - path: "Projects/5 - CLIPIFY.md"
      provides: "Source-of-truth case-study for Clipify"
      contains: "<!-- CASE-STUDY-START -->"
    - path: "Projects/6 - DAYTRADE.md"
      provides: "Source-of-truth case-study for Daytrade"
      contains: "<!-- CASE-STUDY-START -->"
    - path: "src/content/projects/clipify.mdx"
      provides: "Synced case-study body in 5-H2 D-01 shape"
      contains: "## Approach & Architecture"
    - path: "src/content/projects/daytrade.mdx"
      provides: "Synced case-study body in 5-H2 D-01 shape (body completed; frontmatter already renamed in Plan 04)"
      contains: "## Approach & Architecture"
  key_links:
    - from: "Projects/5 - CLIPIFY.md (fenced block)"
      to: "src/content/projects/clipify.mdx body"
      via: "scripts/sync-projects.mjs"
      pattern: "## Problem.*## Approach & Architecture.*## Tradeoffs.*## Outcome.*## Learnings"
    - from: "Projects/6 - DAYTRADE.md (fenced block)"
      to: "src/content/projects/daytrade.mdx body"
      via: "scripts/sync-projects.mjs"
      pattern: "## Problem.*## Approach & Architecture.*## Tradeoffs.*## Outcome.*## Learnings"
---

<objective>
Author the case-study fenced blocks in `Projects/5 - CLIPIFY.md` and `Projects/6 - DAYTRADE.md`, then run `pnpm sync:projects` to land the bodies in the corresponding MDX files. Same contract as Plans 05 + 06.

Purpose: Closes the final 2 of 6 case studies for CONT-01 and CONT-02. After this plan, all six case-study MDX bodies are complete and all Plan 01 case-study tests are GREEN across all 6 slugs.

Output: Two fenced blocks in Projects/*.md files; two MDX bodies rewritten via sync. This plan completes the CONT-01 and CONT-02 automated test coverage; content QUALITY (voice, technical accuracy) is validated by Plan 08 UAT and Jack's redline cycle (D-07).

**Special note for Daytrade:** daytrade.mdx's FRONTMATTER was handled in Plan 04 Task 1 (rename + title + description + source). This task completes the BODY. The placeholder content left in Plan 04 Task 1's body is overwritten here.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/13-content-pass-projects-sync/13-CONTEXT.md
@.planning/phases/13-content-pass-projects-sync/13-RESEARCH.md
@.planning/phases/13-content-pass-projects-sync/13-PATTERNS.md
@.planning/phases/13-content-pass-projects-sync/13-VALIDATION.md
@docs/VOICE-GUIDE.md
@docs/CONTENT-SCHEMA.md
@src/content/projects/clipify.mdx
@src/content/projects/daytrade.mdx
@src/content/projects/seatwatch.mdx
@Projects/5 - CLIPIFY.md
@Projects/6 - DAYTRADE.md

<interfaces>
<!-- Same fence convention and voice rules as Plans 05 and 06. See Plan 05 <interfaces> for full details. -->

D-01 H2 sequence: Problem, Approach & Architecture, Tradeoffs, Outcome, Learnings.
D-11 banlist: revolutionary, seamless, leverage, robust, "dive deeper", "elevate", "supercharge", emoji.
D-16 word band: 600-900 words.
First-person past tense. ≥ 3 named systems. ≥ 1 quantified number.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Author Clipify case study (fenced block in Projects/5 - CLIPIFY.md, then sync to MDX)</name>
  <files>Projects/5 - CLIPIFY.md, src/content/projects/clipify.mdx</files>
  <read_first>
    - Projects/5 - CLIPIFY.md (full file — sole technical source material; READ END-TO-END)
    - src/content/projects/clipify.mdx (current frontmatter + body)
    - src/content/projects/seatwatch.mdx POST-Plan-05-Task-1 state (canonical voice reference)
    - src/data/portfolio-context.json (Clipify entry: AI-powered SaaS, YouTube/streams/uploads → captioned short-form clips, Whisper transcription, GPT-4o moment detection, FFmpeg rendering, Next.js + TypeScript + BullMQ + AWS S3 + Stripe)
    - docs/VOICE-GUIDE.md, docs/CONTENT-SCHEMA.md
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (Pattern 1 + Pitfall 3)
    - scripts/sync-projects.mjs
  </read_first>
  <behavior>
    Same shape as Plans 05-06. Read Projects/5 - CLIPIFY.md end-to-end. Author fenced block with the 5 D-01 H2s.

    Subject matter highlights to verify against source:
    - Video → clip pipeline (YouTube URL / streams / uploads → captioned short-form clips)
    - Whisper for transcription
    - GPT-4o for moment detection (picking the highlight windows)
    - FFmpeg for rendering
    - BullMQ for job queuing
    - AWS S3 for storage
    - Stripe for billing
    - Next.js + TypeScript

    The five H2s:
    - `## Problem`: manual short-form clipping from long video is tedious and requires judgment about which moments matter; goal was an AI pipeline that identifies highlights at human-quality and renders them with captions; quantified scale (hours of video processable per unit time)
    - `## Approach & Architecture`: name subsystems — Whisper transcription pipeline, GPT-4o moment detector, FFmpeg rendering engine, BullMQ job orchestrator, S3 storage tier, Stripe billing; data flow from upload to delivered clip
    - `## Tradeoffs`: LLM moment detection costs per-minute vs a heuristic; S3 vs self-hosted storage (latency + cost vs ops); Whisper local vs API (privacy vs speed)
    - `## Outcome`: quantified — minutes of video processed, clips rendered, average pipeline latency, cost-per-clip, users served, caption accuracy %
    - `## Learnings`: hardest problem journey (likely moment-detection prompt engineering or FFmpeg cost/quality tuning)

    Total target: 700-850 words.
  </behavior>
  <action>
    Step 1 — Read `Projects/5 - CLIPIFY.md` end-to-end.

    Step 2 — Edit `Projects/5 - CLIPIFY.md` with the same surgical fence-insertion pattern as Plans 05-06.

    Apply D-11 banlist + first-person past + named systems + quantified numbers.

    Special attention for Clipify: the AI/LLM domain is the exact area where "revolutionary" / "seamless" / "leverage" / "supercharge" etc. are tempting. Be hyper-vigilant on banlist — read the draft aloud and flag any of those words.

    Step 3 — Run sync:
    ```bash
    pnpm sync:projects
    ```

    Step 4 — Verify:
    ```bash
    pnpm test tests/content/case-studies-shape.test.ts        # GREEN for clipify
    pnpm test tests/content/case-studies-have-content.test.ts # GREEN for clipify
    pnpm test tests/content/voice-banlist.test.ts             # GREEN for clipify
    pnpm test tests/scripts/sync-projects-idempotency.test.ts # GREEN
    pnpm check                                                 # exit 0
    ```
  </action>
  <acceptance_criteria>
    - `Projects/5 - CLIPIFY.md` contains both fence markers exactly once each.
    - `src/content/projects/clipify.mdx` body has the 5 H2s in D-01 order.
    - clipify.mdx body in 600-900 word band.
    - clipify.mdx zero banlist words (verify: `grep -ciE "\\b(revolutionary|seamless|leverage|robust|dive deeper|elevate|supercharge)\\b" src/content/projects/clipify.mdx` returns 0 — extra vigilance on this file because the AI/LLM domain tempts the banlist).
    - clipify.mdx uses first-person past tense (≥ 2 matches for "I built / implemented / designed / architected").
    - clipify.mdx cites at least 3 named systems (verify: `grep -cE "(Whisper|GPT-4o|FFmpeg|BullMQ|moment detector|transcription pipeline|rendering engine|caption)" src/content/projects/clipify.mdx` returns ≥ 3).
    - `pnpm test tests/content/case-studies-shape.test.ts` test for clipify passes GREEN.
    - `pnpm test tests/scripts/sync-projects-idempotency.test.ts` passes GREEN.
    - `pnpm check` exits 0.
    - Frontmatter byte-preserved.
  </acceptance_criteria>
  <verify>
    <automated>pnpm sync:projects 2>&1 | grep "clipify" | tee /tmp/13-07-task1.log; grep -E "^## " src/content/projects/clipify.mdx | head -5 | diff - <(printf "## Problem\n## Approach & Architecture\n## Tradeoffs\n## Outcome\n## Learnings\n") && grep -ciE "\\b(revolutionary|seamless|leverage|robust|dive deeper|elevate|supercharge)\\b" src/content/projects/clipify.mdx | awk '{ if ($1 == 0) exit 0; else exit 1 }'</automated>
  </verify>
  <done>Clipify fenced block written, sync produces 5-H2 MDX body in 600-900 words, zero banlist words (extra vigilance paid off), named systems cited, voice rules obeyed, idempotency tests GREEN, frontmatter byte-preserved.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Author Daytrade case study (fenced block in Projects/6 - DAYTRADE.md, then sync to MDX body)</name>
  <files>Projects/6 - DAYTRADE.md, src/content/projects/daytrade.mdx</files>
  <read_first>
    - Projects/6 - DAYTRADE.md (full file — sole technical source material; READ END-TO-END)
    - src/content/projects/daytrade.mdx (POST-Plan-04-Task-1 state: frontmatter renamed and has source: field; body is placeholder)
    - src/content/projects/seatwatch.mdx POST-Plan-05-Task-1 state (canonical voice reference)
    - src/data/portfolio-context.json (Daytrade entry: automated cryptocurrency day-trading system, momentum breakout detection on 5-minute candles, composable signal filters, risk-based position sizing, atomic state persistence; tech: Python, CCXT, pandas, pandas-ta, Pydantic)
    - docs/VOICE-GUIDE.md, docs/CONTENT-SCHEMA.md
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (Pattern 1; Pitfall 3; Pitfall 5 D-26 reminder — Daytrade is the slug that triggered D-26 in Plan 04; body edit here does NOT re-trigger because we're editing inside the MDX which chat.ts does not import)
    - scripts/sync-projects.mjs
  </read_first>
  <behavior>
    Same contract as Task 1, applied to Daytrade.

    Subject matter highlights to verify against Projects/6 - DAYTRADE.md:
    - Automated crypto day-trading system (Python, not browser-automation)
    - Momentum breakout detection on 5-minute candles (technical-analysis strategy)
    - Composable signal filters (plug-and-play filter architecture)
    - Risk-based position sizing (Kelly criterion or similar)
    - Atomic state persistence (crash-safe state — likely SQLite or similar with WAL/atomic writes)
    - CCXT for exchange connectivity
    - pandas + pandas-ta for data pipeline + indicators
    - Pydantic for config/signal schemas

    The five H2s:
    - `## Problem`: manual crypto day-trading is 24/7 and error-prone; goal was an automated system that implements a precise strategy (momentum breakout on 5m candles), sizes positions by risk, and survives crashes without double-positions; quantified scale (markets monitored, candles processed per hour)
    - `## Approach & Architecture`: name subsystems — 5-minute candle ingest loop, composable signal filter chain (Pydantic-typed), momentum breakout detector, risk-based position sizer, atomic state persistence layer, CCXT exchange adapter; data flow from market tick to order submission
    - `## Tradeoffs`: composable filters add startup config complexity but enable A/B testing filters without redeploy; atomic state adds write latency but eliminates double-order class of bugs; 5m candles reduce noise vs 1m but delay entries
    - `## Outcome`: quantified — markets monitored, signals evaluated, trades executed, uptime %, position-sizing accuracy, state recovery success after crash
    - `## Learnings`: hardest problem journey (likely state-persistence atomicity or filter-composition ordering)

    Total target: 700-850 words.

    IMPORTANT: Frontmatter is ALREADY CORRECT from Plan 04 Task 1. Do not touch frontmatter. The sync script replaces only the body per S1 (frontmatter byte-preserved). After this task, daytrade.mdx has correct frontmatter (renamed) + correct body (case study) + no trace of "Crypto Breakout Trader".
  </behavior>
  <action>
    Step 1 — Read `Projects/6 - DAYTRADE.md` end-to-end. Extract real subsystem names, real numbers, real hardest problems.

    Step 2 — Edit `Projects/6 - DAYTRADE.md`. The file exists (verified in planning); it likely has intro paragraphs followed by technical sections. Insert fence block after intro, before first code fence / technical H2.

    If `Projects/6 - DAYTRADE.md` is sparse on technical detail, document gaps in SUMMARY — Jack's redline will close them. Use measured phrasing where numbers are uncertain ("several markets", "thousands of candles processed") rather than fabricating specifics.

    Apply D-11 banlist + first-person past + named systems + quantified numbers.

    Step 3 — Run sync:
    ```bash
    pnpm sync:projects
    ```
    Expect: `daytrade.mdx: updated, <NNN> words (OK|...)`.

    Step 4 — Verify:
    ```bash
    pnpm test tests/content/case-studies-shape.test.ts         # GREEN for daytrade → ALL 6 GREEN now
    pnpm test tests/content/case-studies-have-content.test.ts  # GREEN for daytrade → ALL 6 GREEN
    pnpm test tests/content/voice-banlist.test.ts              # GREEN for daytrade
    pnpm test tests/content/case-studies-wordcount.test.ts     # All 6 at OK (or warn per D-16)
    pnpm test tests/scripts/sync-projects-idempotency.test.ts  # GREEN
    pnpm sync:check                                             # ALL 6 clean → exit 0
    pnpm check                                                  # exit 0
    pnpm build                                                  # passes; all 6 routes emit
    ```

    **Verify no Crypto Breakout Trader drift regressed into the daytrade body** (this is the seam where regression could sneak in — voice exemplars from the old content might creep into the new body):
    ```bash
    grep -c "Crypto Breakout Trader\\|crypto-breakout" src/content/projects/daytrade.mdx  # Must be 0
    ```
  </action>
  <acceptance_criteria>
    - `Projects/6 - DAYTRADE.md` contains both fence markers exactly once each.
    - `src/content/projects/daytrade.mdx` body has the 5 H2s in D-01 order.
    - daytrade.mdx body in 600-900 word band.
    - daytrade.mdx zero banlist words.
    - daytrade.mdx uses first-person past tense (≥ 2 matches).
    - daytrade.mdx cites at least 3 named systems (verify: `grep -cE "(candle ingest|signal filter|breakout detector|position sizer|state persistence|CCXT|pandas-ta|Pydantic)" src/content/projects/daytrade.mdx` returns ≥ 3).
    - daytrade.mdx does NOT contain "Crypto Breakout Trader" anywhere (verify: `grep -c "Crypto Breakout Trader\\|crypto-breakout" src/content/projects/daytrade.mdx` returns 0).
    - `pnpm test tests/content/case-studies-shape.test.ts` — ALL 6 slugs pass (this task closes the final one).
    - `pnpm test tests/content/case-studies-have-content.test.ts` — ALL 6 slugs pass.
    - `pnpm test tests/content/voice-banlist.test.ts` — ALL 6 slugs pass.
    - `pnpm sync:check` exits 0 (every Projects/*.md ↔ MDX pair is in sync).
    - `pnpm check` exits 0.
    - `pnpm build` passes.
    - daytrade.mdx frontmatter is byte-identical to Plan 04 Task 1 end-state (verify: only body changed — `git diff src/content/projects/daytrade.mdx` since Plan 04 shows changes only after the closing `---`).
  </acceptance_criteria>
  <verify>
    <automated>pnpm sync:projects 2>&1 | grep "daytrade" | tee /tmp/13-07-task2.log; grep -E "^## " src/content/projects/daytrade.mdx | head -5 | diff - <(printf "## Problem\n## Approach & Architecture\n## Tradeoffs\n## Outcome\n## Learnings\n") && grep -ciE "\\b(revolutionary|seamless|leverage|robust|dive deeper)\\b" src/content/projects/daytrade.mdx | awk '{ if ($1 == 0) exit 0; else exit 1 }' && grep -c "Crypto Breakout Trader\\|crypto-breakout" src/content/projects/daytrade.mdx | awk '{ if ($1 == 0) exit 0; else exit 1 }' && pnpm sync:check</automated>
  </verify>
  <done>Daytrade fenced block written, sync produces 5-H2 MDX body in 600-900 words, zero banlist words, named systems cited, no "Crypto Breakout Trader" residue, frontmatter byte-preserved from Plan 04, ALL 6 case-study tests now GREEN, pnpm sync:check exits 0 (every Projects/*.md ↔ MDX pair in sync).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| author→Projects/*.md | Author-controlled content; sync trusts as-is |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-13-02 | Information Disclosure | Projects/5 - CLIPIFY.md, Projects/6 - DAYTRADE.md (Daytrade involves trading capital + exchange API connectivity; Clipify involves user-uploaded video + AI processing — both have privacy-relevant context) | accept | Manual review during authoring; never paste API keys, exchange credentials, S3 bucket names, OpenAI keys, Stripe keys, JWT secrets. Author writes about HOW the system works conceptually. |

T-13-01, T-13-03, T-13-04 not in scope.
</threat_model>

<verification>
After this plan runs:
- ALL 6 of 6 case studies have correct shape and voice
- `pnpm sync:projects` reports OK status for all 6 slugs
- `pnpm sync:check` exits 0
- All Plan 01 case-study tests GREEN across all 6 slugs
- daytrade.mdx is fully complete (frontmatter from Plan 04 + body from this plan)

Verification commands:
```bash
pnpm sync:projects                                            # 6 OK files reported
pnpm sync:check                                                # exit 0
pnpm test tests/content/case-studies-shape.test.ts            # ALL 6 pass
pnpm test tests/content/case-studies-have-content.test.ts     # ALL 6 pass
pnpm test tests/content/voice-banlist.test.ts                 # ALL 6 pass
pnpm check                                                     # exit 0
pnpm build                                                     # all 6 routes emit
```
</verification>

<success_criteria>
- [ ] Both Projects/*.md files have correctly placed fence markers
- [ ] Both MDX bodies have the 5 D-01 H2s in exact order, in-band word count, zero banlist
- [ ] Both bodies use first-person past + cite ≥ 3 named systems + ≥ 1 quantified number
- [ ] daytrade.mdx contains zero "Crypto Breakout Trader" residue
- [ ] Frontmatter byte-preserved on both MDX files
- [ ] Sync idempotency holds; pnpm sync:check exits 0
- [ ] ALL 6 Plan 01 case-study tests GREEN across all 6 slugs (CONT-01 + CONT-02 closed at automated test layer)
</success_criteria>

<output>
After completion, create `.planning/phases/13-content-pass-projects-sync/13-07-case-studies-batch-c-SUMMARY.md` with the same per-slug structure as Plans 05-06's SUMMARYs. Include a final summary line: "All 6 case studies complete; CONT-01 and CONT-02 closed at automated test layer; voice/technical-accuracy redline cycle (D-07) is Jack's responsibility before phase completion."
</output>
