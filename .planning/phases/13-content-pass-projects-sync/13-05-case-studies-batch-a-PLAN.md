---
phase: 13
plan: 05
type: execute
wave: 4
depends_on: [02, 04]
files_modified:
  - Projects/1 - SEATWATCH.md
  - Projects/2 - NFL_PREDICT.md
  - src/content/projects/seatwatch.mdx
  - src/content/projects/nfl-predict.mdx
autonomous: true
requirements: [CONT-01, CONT-02]
must_haves:
  truths:
    - "Projects/1 - SEATWATCH.md contains the fenced case-study block with the 5 D-01 H2s in order"
    - "Projects/2 - NFL_PREDICT.md contains the fenced case-study block with the 5 D-01 H2s in order"
    - "After `pnpm sync:projects`, src/content/projects/seatwatch.mdx body has the 5 D-01 H2s in order"
    - "After `pnpm sync:projects`, src/content/projects/nfl-predict.mdx body has the 5 D-01 H2s in order"
    - "Both MDX bodies fall in 600-900 word band (D-16 soft target — warning ok, but target should be hit)"
    - "Neither body uses any D-11 banlist word (revolutionary, seamless, leverage, robust, dive deeper, elevate, supercharge, emoji)"
    - "Both bodies use first-person past-tense voice (D-09, D-11 Rule 3) and reference at least 3 named systems (D-11 Rule 4)"
    - "Both bodies cite at least one quantified performance/scale number (D-11 Rule 2)"
    - "tests/content/case-studies-have-content.test.ts and case-studies-shape.test.ts and voice-banlist.test.ts assertions for these 2 slugs are GREEN"
  artifacts:
    - path: "Projects/1 - SEATWATCH.md"
      provides: "Source-of-truth case-study for SeatWatch (fenced); existing technical README preserved below the fence"
      contains: "<!-- CASE-STUDY-START -->"
    - path: "Projects/2 - NFL_PREDICT.md"
      provides: "Source-of-truth case-study for NFL Prediction System (fenced); existing technical README preserved below the fence"
      contains: "<!-- CASE-STUDY-START -->"
    - path: "src/content/projects/seatwatch.mdx"
      provides: "Synced case-study body in 5-H2 D-01 shape; frontmatter byte-preserved (S1)"
      contains: "## Approach & Architecture"
    - path: "src/content/projects/nfl-predict.mdx"
      provides: "Synced case-study body in 5-H2 D-01 shape; frontmatter byte-preserved (S1)"
      contains: "## Approach & Architecture"
  key_links:
    - from: "Projects/1 - SEATWATCH.md (fenced block)"
      to: "src/content/projects/seatwatch.mdx body"
      via: "scripts/sync-projects.mjs"
      pattern: "## Problem.*## Approach & Architecture.*## Tradeoffs.*## Outcome.*## Learnings"
    - from: "Projects/2 - NFL_PREDICT.md (fenced block)"
      to: "src/content/projects/nfl-predict.mdx body"
      via: "scripts/sync-projects.mjs"
      pattern: "## Problem.*## Approach & Architecture.*## Tradeoffs.*## Outcome.*## Learnings"
---

<objective>
Author the case-study fenced blocks in `Projects/1 - SEATWATCH.md` and `Projects/2 - NFL_PREDICT.md`, then run `pnpm sync:projects` to land the bodies in the corresponding MDX files. Both case studies follow the locked 5-H2 D-01 shape, hit the 600-900 word target, and obey every D-11 voice rule.

Purpose: Closes 2 of 6 case studies for CONT-01 and CONT-02. This is one of three parallel Wave-4 plans (Plans 05, 06, 07) that each handle 2 case studies. Splitting at 2-per-plan keeps each plan inside the ~50% context budget — heavy from-scratch authoring is the highest-context activity in this phase.

Output: Two fenced blocks added to Projects/*.md files; two MDX bodies rewritten via sync; six of the Plan 01 case-study test assertions (3 per slug × 2 slugs) move from RED to GREEN for these 2 slugs.

**Context note:** SeatWatch's CURRENT MDX body is the canonical voice exemplar per D-10 (PATTERNS.md). However, its current shape is 4-H2 (Problem / Solution & Approach / Tech Stack Detail / Challenges & Lessons / Results) not 5-H2. This plan REWRITES it into the 5-H2 shape, preserving the voice and merging Solution & Approach + Tech Stack Detail into the new "Approach & Architecture" H2 per D-01. The voice / named systems / quantified numbers from the current seatwatch.mdx must be retained.
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
@src/content/projects/seatwatch.mdx
@src/content/projects/nfl-predict.mdx
@Projects/1 - SEATWATCH.md
@Projects/2 - NFL_PREDICT.md

<interfaces>
<!-- The exact fence convention each Projects/*.md file must adopt (D-06): -->

```markdown
# <Project Name>

<intro paragraphs from existing Projects/*.md — KEEP byte-for-byte>

<!-- CASE-STUDY-START -->

## Problem

<150-200 words: the constraint, the goal, the non-obvious challenge, quantified scale>

## Approach & Architecture

<200-300 words: named subsystems, the architecture decisions, the data/control flow>

## Tradeoffs

<100-150 words: the deliberate compromises and their hidden costs>

## Outcome

<100-150 words: every claim has a number; lines of code, requests/sec, uptime, etc.>

## Learnings

<100-150 words: the hardest problem, the first attempt, the fix, the lesson>

<!-- CASE-STUDY-END -->

## Architecture (FULL TECHNICAL REFERENCE)

<existing Projects/*.md content from this point onward — KEEP byte-for-byte; possibly relabel original H1/H2 to disambiguate>
```

<!-- D-11 Voice Rules (apply to every word of body): -->
- BANLIST (NEVER appear): revolutionary, seamless, leverage (verb), robust, "dive deeper", "elevate", "supercharge", emoji of any kind
- "scalable" only if quantified with a number
- Numbers required for every performance/scale/reliability claim
- Past tense for shipped work ("I built", "handled")
- Named systems over abstractions ("the dual-strategy booking engine", not "an advanced booking system")
- Max one em-dash per paragraph

<!-- Word-count target (D-16 soft): 600-900 words inside the fence -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Author SeatWatch case study (fenced block in Projects/1 - SEATWATCH.md, then sync to MDX)</name>
  <files>Projects/1 - SEATWATCH.md, src/content/projects/seatwatch.mdx</files>
  <read_first>
    - Projects/1 - SEATWATCH.md (full file — this is the technical README that supplies all source material; READ END-TO-END before writing)
    - src/content/projects/seatwatch.mdx (CURRENT body lines 24-56 — this IS the canonical voice exemplar per D-10; the prose, named systems, and quantified numbers in its current 4-H2 shape are the gold standard. Voice MUST be retained when collapsing into 5-H2.)
    - docs/VOICE-GUIDE.md (D-09 first-person, D-10 engineering-journal tone, D-11 four hard rules + banlist + numbers + past-tense + named-systems)
    - docs/CONTENT-SCHEMA.md (§2 fence convention, §3 author workflow steps 1-5)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (PATTERNS §"src/content/projects/seatwatch.mdx" — voice exemplars per H2; shows exact prose patterns per H2; lines 632-690 of PATTERNS.md)
    - .planning/phases/13-content-pass-projects-sync/13-RESEARCH.md (RESEARCH §2 lines 467-506 — the example Projects/1 - SEATWATCH.md shape with the fence inserted)
    - scripts/sync-projects.mjs (the sync script that will be run after authoring)
  </read_first>
  <behavior>
    Phase 1: Add the fenced case-study block to `Projects/1 - SEATWATCH.md`.
    Phase 2: Run `pnpm sync:projects`.
    Phase 3: Verify the synced MDX body satisfies all assertions.

    Fenced block contents (write inside `<!-- CASE-STUDY-START -->` and `<!-- CASE-STUDY-END -->`):

    The five H2s (in this exact order, this exact spelling):
    - `## Problem` (150-200 words): the bookings-window-measured-in-seconds problem; the goal of monitoring + auto-booking faster than humans; the reliability-at-scale challenge with 50 concurrent users; quantified ("the window to book one is measured in seconds", "fifty users monitoring simultaneously")
    - `## Approach & Architecture` (200-300 words; MERGE the existing "Solution & Approach" + "Tech Stack Detail" sections from current seatwatch.mdx lines 30-44): Turborepo monorepo with three services (React SPA, Express REST API with 40+ endpoints, BullMQ worker with five concurrent queues); the dual-strategy booking engine (primary API path under a second; Patchright headless-browser fallback); distributed booking locks via Redis SET NX EX with UUID nonces and Lua-script-safe release; per-user circuit breaker (CLOSED / OPEN / HALF_OPEN state machine in Redis hashes); detection evasion via deterministic per-user browser identity + Poisson-distributed stagger offsets; AES-256-GCM credential encryption with per-record IVs; Stripe four-tier billing with transaction-level plan enforcement
    - `## Tradeoffs` (100-150 words; NEW H2 per D-01 — distill from existing prose): the dual-strategy fallback adds latency on the rare paths but preserves uptime when the upstream API breaks; the Redis-backed circuit breaker survives worker restarts at the cost of cross-worker coordination overhead; deterministic browser fingerprinting consumes more storage than randomized but keeps detection low; consider one or two more concrete tradeoff bullets from the Projects/1 - SEATWATCH.md technical README
    - `## Outcome` (100-150 words; rename current "Results" H2): SeatWatch handles approximately 50 parallel user sessions across three Railway-deployed services; processes thousands of availability checks daily; sniping mode lands first-poll attempts within milliseconds; codebase spans 48,000 lines of TypeScript across 329 files with 90+ test files; billing system processed real transactions through all four plan tiers without race conditions or double-charges
    - `## Learnings` (100-150 words; rename current "Challenges & Lessons" H2): the hardest problem was the distributed booking lock; first attempt used Redis SET NX without nonce, broke when slow worker's lock expired and original deleted the new lock; fix was atomic nonce-checked deletion via Lua script (textbook distributed systems problem encountered firsthand); circuit breaker went through three iterations (in-memory, Redis without proper half-open, final state-machine in Redis hashes); biggest lesson — detection evasion is fundamentally about CONSISTENCY not randomness

    Total target: 700-850 words.

    Fence placement: insert the entire `<!-- CASE-STUDY-START -->` ... `<!-- CASE-STUDY-END -->` block AFTER the existing intro paragraphs of `Projects/1 - SEATWATCH.md` (which sit between the H1 `# SeatWatch` and the existing `## Architecture` H2) and BEFORE the existing `## Architecture` heading. Per RESEARCH §2, optionally relabel the existing `## Architecture` to `## Architecture (FULL TECHNICAL REFERENCE)` for disambiguation. Per Pitfall 3, fence MUST appear before any code fence in the file.
  </behavior>
  <action>
    Step 1 — Read both files end-to-end:
    - `Projects/1 - SEATWATCH.md` (full file)
    - `src/content/projects/seatwatch.mdx` (current 4-H2 body lines 24-56)

    Step 2 — Edit `Projects/1 - SEATWATCH.md`. Use the Edit tool with this surgical structure:

    OLD (the existing content between intro paragraph and `## Architecture` heading):
    ```markdown
    <last sentence of the existing intro paragraph(s) — copy verbatim from file>

    ## Architecture
    ```

    NEW:
    ```markdown
    <last sentence of the existing intro paragraph(s) — keep verbatim>

    <!-- CASE-STUDY-START -->

    ## Problem

    <150-200 words of from-scratch case-study prose using the source material in this file's technical README + the voice patterns from src/content/projects/seatwatch.mdx current body. Apply D-11 voice rules.>

    ## Approach & Architecture

    <200-300 words; merge "Solution & Approach" + "Tech Stack Detail" voice from current seatwatch.mdx into one tight section. Name every named system: dual-strategy booking engine, distributed booking locks, per-user circuit breaker, deterministic browser identity, Poisson-distributed stagger offsets, AES-256-GCM credential encryption, Stripe four-tier billing.>

    ## Tradeoffs

    <100-150 words; surface 2-4 deliberate compromises with their hidden costs.>

    ## Outcome

    <100-150 words; every claim quantified: 50 parallel users, 48,000 LOC, 329 files, 90+ test files, 4 plan tiers, milliseconds-precision sniping, thousands of daily checks.>

    ## Learnings

    <100-150 words; the distributed lock journey is the canonical pattern: hardest problem → first attempt → fix → lesson. Plus one secondary learning (e.g., circuit breaker iteration journey OR detection-via-consistency insight).>

    <!-- CASE-STUDY-END -->

    ## Architecture (FULL TECHNICAL REFERENCE)
    ```

    DRAFTING DISCIPLINE — ENFORCE THESE EVERY PARAGRAPH:
    - First-person past tense ("I built", "I architected", "I implemented")
    - Numbers for every performance/scale claim (no "fast", "robust", "highly scalable")
    - Named systems with proper-noun status ("the dual-strategy booking engine" — capitalize/treat as a noun phrase)
    - Banlist enforcement: visually scan EVERY paragraph for: revolutionary, seamless, leverage, robust, "dive deeper", "elevate", "supercharge", em-dash abuse (max one per paragraph), emoji
    - "scalable" only if followed by a number ("scalable to 50 concurrent users" OK; "scalable architecture" NOT OK)

    Step 3 — Run sync:
    ```bash
    pnpm sync:projects
    ```
    Expect output: `seatwatch.mdx: updated, <NNN> words (OK|under 600|exceeds 900)`. If "exceeds 900", tighten prose; if "under 600", expand. Re-run sync.

    Step 4 — Verify with tests:
    ```bash
    pnpm test tests/content/case-studies-shape.test.ts        # GREEN for seatwatch row at minimum
    pnpm test tests/content/case-studies-have-content.test.ts # GREEN for seatwatch
    pnpm test tests/content/voice-banlist.test.ts             # GREEN for seatwatch
    pnpm test tests/content/case-studies-wordcount.test.ts    # OK warning at most for seatwatch
    pnpm test tests/scripts/sync-projects-idempotency.test.ts # GREEN
    pnpm check                                                 # Zod still passes
    ```

    Step 5 — Commit BOTH files together (CONTENT-SCHEMA §3 step 5):
    Per project convention this is staged and committed by gsd-execute-phase / Plan 09; this task just leaves the working tree clean and tests GREEN.
  </action>
  <acceptance_criteria>
    - `Projects/1 - SEATWATCH.md` contains the fence start marker (verify: `grep -c "^<!-- CASE-STUDY-START -->" "Projects/1 - SEATWATCH.md"` returns 1).
    - `Projects/1 - SEATWATCH.md` contains the fence end marker (verify: `grep -c "^<!-- CASE-STUDY-END -->" "Projects/1 - SEATWATCH.md"` returns 1).
    - `Projects/1 - SEATWATCH.md` fence appears before any code fence (verify: position of CASE-STUDY-START < position of first ```` ``` ```` — `grep -n "CASE-STUDY-START\\|^\\\`\\\`\\\`" "Projects/1 - SEATWATCH.md" | head -3` shows CASE-STUDY-START first).
    - `src/content/projects/seatwatch.mdx` body has the 5 H2s in D-01 order (verify: `grep -E "^## " src/content/projects/seatwatch.mdx | tr '\n' '|'` outputs exactly `## Problem|## Approach & Architecture|## Tradeoffs|## Outcome|## Learnings|`).
    - seatwatch.mdx body word count is in 600-900 band (verify via sync output: `pnpm sync:projects 2>&1 | grep "seatwatch" | grep -E "(OK)" | wc -l` returns 1; if "exceeds 900" or "under 600", task isn't done).
    - seatwatch.mdx contains zero D-11 banlist words (verify: `grep -ciE "\\b(revolutionary|seamless|leverage|robust|dive deeper|elevate|supercharge)\\b" src/content/projects/seatwatch.mdx` returns 0; case-insensitive).
    - seatwatch.mdx body uses first-person past tense (verify: `grep -cE "\\b(I built|I architected|I implemented|I designed)\\b" src/content/projects/seatwatch.mdx` returns ≥ 2).
    - seatwatch.mdx body cites at least 3 named systems (verify: `grep -cE "(dual-strategy booking engine|distributed booking lock|per-user circuit breaker|browser identity|Poisson-distributed stagger|AES-256-GCM)" src/content/projects/seatwatch.mdx` returns ≥ 3).
    - seatwatch.mdx body cites at least 1 quantified performance/scale number (verify: `grep -cE "\\b(50|fifty|48,000|329|90\\+|4|four)\\b" src/content/projects/seatwatch.mdx` returns ≥ 3 — multiple expected).
    - `pnpm test tests/content/case-studies-shape.test.ts` test for seatwatch passes GREEN (other 5 may still RED — that's Tasks 2-3 of plans 06+07).
    - `pnpm test tests/scripts/sync-projects-idempotency.test.ts` passes GREEN (idempotency holds).
    - `pnpm check` exits 0.
    - Frontmatter of seatwatch.mdx is byte-identical to pre-sync state for everything except possibly NO body change (verify: `git diff src/content/projects/seatwatch.mdx | grep -E "^[+-]" | head -3` shows changes only after the closing `---`).
  </acceptance_criteria>
  <verify>
    <automated>pnpm sync:projects 2>&1 | grep "seatwatch" | tee /tmp/13-05-task1.log; grep -E "^## " src/content/projects/seatwatch.mdx | head -5 | diff - <(printf "## Problem\n## Approach & Architecture\n## Tradeoffs\n## Outcome\n## Learnings\n") && grep -ciE "\\b(revolutionary|seamless|leverage|robust|dive deeper)\\b" src/content/projects/seatwatch.mdx | awk '{ if ($1 == 0) exit 0; else exit 1 }'</automated>
  </verify>
  <done>SeatWatch fenced block written in source file, sync produces 5-H2 MDX body in 600-900 words with zero banlist words, named systems cited, quantified numbers present, all relevant Plan 01 tests GREEN for the seatwatch slug, frontmatter byte-preserved.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Author NFL Prediction System case study (fenced block in Projects/2 - NFL_PREDICT.md, then sync to MDX)</name>
  <files>Projects/2 - NFL_PREDICT.md, src/content/projects/nfl-predict.mdx</files>
  <read_first>
    - Projects/2 - NFL_PREDICT.md (full file — sole technical source material for this case study; READ END-TO-END)
    - src/content/projects/nfl-predict.mdx (current frontmatter; current body for word-count and tonal calibration vs SeatWatch reference)
    - src/content/projects/seatwatch.mdx POST-Task-1 state (the fresh 5-H2 canonical voice exemplar after Task 1 completes — voice/density target)
    - docs/VOICE-GUIDE.md (D-11 four hard rules; reuse the same verification pattern from Task 1)
    - docs/CONTENT-SCHEMA.md (fence convention, author workflow)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (Pattern 1 frontmatter byte preservation; PATTERNS §"src/content/projects/{nfl-predict,...}.mdx" — analog is post-rewrite seatwatch.mdx)
    - scripts/sync-projects.mjs (sync script behavior)
  </read_first>
  <behavior>
    Same shape as Task 1, applied to NFL Prediction System. Read `Projects/2 - NFL_PREDICT.md` end-to-end to extract the technical material. Then write the fenced case-study block above any code fence in that file (after intro, before the existing technical sections).

    The 5 H2s (this exact order, this exact spelling — D-01 enforced):
    - `## Problem`: NFL game-outcome prediction is a temporal-data problem with leakage hazards (look-ahead bias) and a market-edge floor (Vegas lines are sharp). Goal: build a prediction engine that beats market lines on a meaningful subset of games and is honest about its temporal validity. Quantified scale: weeks of NFL data, X seasons, Y games.
    - `## Approach & Architecture`: walk-forward temporal validation; XGBoost / scikit-learn ensemble; market blending (combining model output with market lines to produce calibrated probabilities); FastAPI dashboard with HTMX + Tailwind (interactive but server-rendered); DuckDB for analytical queries on game-level data. Name each subsystem.
    - `## Tradeoffs`: walk-forward validation is slower to compute than k-fold but eliminates a class of leakage bugs; market blending caps upside (you can't beat the market by much) in exchange for calibration; HTMX over a heavy SPA framework keeps the bundle tiny but limits client-side state.
    - `## Outcome`: quantified numbers from the project — model accuracy %, win-probability AUROC, total games predicted, dashboard load time, etc. Pull actual numbers from Projects/2 - NFL_PREDICT.md; if not present in the README, document that in the executor SUMMARY and use placeholder language that Jack can fill in during redline (per D-07 redline cycle).
    - `## Learnings`: the hardest problem encountered (likely temporal validation or calibration); the first attempt that failed; the fix; the lesson.

    Total target: 700-850 words.

    Same enforcement: D-11 banlist, first-person past tense, named systems, numbers required.
  </behavior>
  <action>
    Step 1 — Read `Projects/2 - NFL_PREDICT.md` end-to-end. Extract:
    - The actual quantified numbers (game counts, accuracy %, AUROC, etc.) — DO NOT INVENT
    - The actual named subsystems / files / classes
    - The actual hardest problem encountered (look at code comments, commit history, README pain points)

    If the README is sparse on hard numbers (likely for some metrics), record this in SUMMARY and use cautious phrasing ("over multiple seasons", "thousands of game-weeks") rather than fabricated specific numbers. The redline cycle (D-07) is the quality gate; Jack will tighten with real numbers.

    Step 2 — Edit `Projects/2 - NFL_PREDICT.md`. Insert fence block AFTER intro paragraphs and BEFORE the first existing H2 / code fence in the file. Same surgical Edit pattern as Task 1:

    OLD:
    ```markdown
    <last sentence of intro>

    <existing first H2 of the technical README — copy verbatim>
    ```

    NEW:
    ```markdown
    <last sentence of intro>

    <!-- CASE-STUDY-START -->

    ## Problem

    <150-200 words; first-person past-tense; quantified scale>

    ## Approach & Architecture

    <200-300 words; named subsystems: walk-forward validator, XGBoost ensemble, market blender, FastAPI/HTMX dashboard, DuckDB analytical store>

    ## Tradeoffs

    <100-150 words; 2-4 deliberate compromises>

    ## Outcome

    <100-150 words; quantified — pull real numbers from Projects/2 - NFL_PREDICT.md or note placeholders for Jack's redline>

    ## Learnings

    <100-150 words; the hardest problem journey>

    <!-- CASE-STUDY-END -->

    <existing first H2 of the technical README — keep verbatim, optionally relabel for disambiguation>
    ```

    Apply the same banlist / named-systems / first-person / numbers-required discipline as Task 1.

    Step 3 — Run sync:
    ```bash
    pnpm sync:projects
    ```
    Expect: `nfl-predict.mdx: updated, <NNN> words (OK|...)`. Tighten if outside 600-900.

    Step 4 — Verify:
    ```bash
    pnpm test tests/content/case-studies-shape.test.ts        # GREEN for nfl-predict at minimum (seatwatch already GREEN from Task 1)
    pnpm test tests/content/case-studies-have-content.test.ts # GREEN for nfl-predict
    pnpm test tests/content/voice-banlist.test.ts             # GREEN for nfl-predict
    pnpm test tests/scripts/sync-projects-idempotency.test.ts # GREEN
    pnpm check                                                 # Zod still passes
    ```
  </action>
  <acceptance_criteria>
    - `Projects/2 - NFL_PREDICT.md` contains both fence markers, each appearing exactly once, with start before end (verify: `grep -c "<!-- CASE-STUDY-START -->" "Projects/2 - NFL_PREDICT.md"` returns 1 AND `grep -c "<!-- CASE-STUDY-END -->" "Projects/2 - NFL_PREDICT.md"` returns 1).
    - `src/content/projects/nfl-predict.mdx` body has the 5 H2s in D-01 order (verify: `grep -E "^## " src/content/projects/nfl-predict.mdx | tr '\n' '|'` outputs exactly `## Problem|## Approach & Architecture|## Tradeoffs|## Outcome|## Learnings|`).
    - nfl-predict.mdx body word count in 600-900 band (verify via sync output).
    - nfl-predict.mdx contains zero D-11 banlist words (verify: `grep -ciE "\\b(revolutionary|seamless|leverage|robust|dive deeper|elevate|supercharge)\\b" src/content/projects/nfl-predict.mdx` returns 0).
    - nfl-predict.mdx uses first-person past tense (verify: `grep -cE "\\b(I built|I implemented|I designed|I trained)\\b" src/content/projects/nfl-predict.mdx` returns ≥ 2).
    - nfl-predict.mdx cites at least 3 named systems (verify: `grep -cE "(walk-forward|XGBoost|market blender|FastAPI|HTMX|DuckDB|ensemble)" src/content/projects/nfl-predict.mdx` returns ≥ 3).
    - `pnpm test tests/content/case-studies-shape.test.ts` test for nfl-predict passes GREEN.
    - `pnpm test tests/scripts/sync-projects-idempotency.test.ts` passes GREEN.
    - `pnpm check` exits 0.
    - Frontmatter of nfl-predict.mdx is byte-identical to pre-sync state (verify: `git diff src/content/projects/nfl-predict.mdx | head -20` shows changes only after the closing `---`).
    - SUMMARY.md notes any quantified-number gaps where the source README didn't provide hard data (executor honesty per D-07 redline cycle).
  </acceptance_criteria>
  <verify>
    <automated>pnpm sync:projects 2>&1 | grep "nfl-predict" | tee /tmp/13-05-task2.log; grep -E "^## " src/content/projects/nfl-predict.mdx | head -5 | diff - <(printf "## Problem\n## Approach & Architecture\n## Tradeoffs\n## Outcome\n## Learnings\n") && grep -ciE "\\b(revolutionary|seamless|leverage|robust|dive deeper)\\b" src/content/projects/nfl-predict.mdx | awk '{ if ($1 == 0) exit 0; else exit 1 }'</automated>
  </verify>
  <done>NFL Prediction System fenced block written in source file, sync produces 5-H2 MDX body in 600-900 words with zero banlist words, named systems cited, voice rules obeyed, idempotency tests GREEN, frontmatter byte-preserved, gaps documented for redline cycle.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| author→Projects/*.md | Jack/Claude authors content; sync script trusts the fenced block as-is. No external input. |
| Projects/*.md→sync→MDX | Sync extracts and writes; integrity guaranteed by Plan 02 path-traversal guard (S3) and idempotency (S6). |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-13-02 | Information Disclosure | Projects/1 - SEATWATCH.md, Projects/2 - NFL_PREDICT.md (potential embedded credentials/keys) | accept | Manual review during authoring; case-study content is intentionally non-sensitive (system descriptions only, no API keys / customer data / internal endpoints). Author is instructed to NOT paste any secret. RESEARCH §"Security Domain" defers automated entropy detection to v1.3+. |

T-13-01, T-13-03, T-13-04 do not apply — this plan only authors content; sync script and CI workflow already mitigated by Plan 02; portfolio-context.json untouched here.
</threat_model>

<verification>
After this plan runs:
- 2 of 6 case studies have correct 5-H2 D-01 shape, in-band word count, and zero banlist words
- `pnpm sync:projects` reports OK status for seatwatch.mdx and nfl-predict.mdx
- `pnpm sync:check` no longer errors on these 2 sources (still errors on the other 4 — Wave 4 Plans 06+07 close those)
- All Plan 01 case-study tests are GREEN for these 2 slugs (still RED for the other 4)

Verification commands:
```bash
pnpm sync:projects                                           # 2 files reported as updated/OK
pnpm test tests/content/case-studies-shape.test.ts          # seatwatch + nfl-predict pass; other 4 may fail
pnpm test tests/content/voice-banlist.test.ts               # seatwatch + nfl-predict pass
pnpm test tests/scripts/sync-projects-idempotency.test.ts  # GREEN
pnpm check                                                   # exit 0
```
</verification>

<success_criteria>
- [ ] Both Projects/*.md files have correctly placed fence markers (each marker exactly once, start before end, before any code fence)
- [ ] Both MDX bodies have the 5 D-01 H2s in exact order
- [ ] Both bodies in 600-900 word band (or sync output documents the deviation per D-16)
- [ ] Both bodies contain zero D-11 banlist words
- [ ] Both bodies use first-person past tense and cite ≥ 3 named systems and ≥ 1 quantified number
- [ ] Frontmatter byte-preserved on both MDX files
- [ ] Sync idempotency holds (re-running pnpm sync:projects produces zero filesystem changes)
- [ ] Plan 01 case-study tests GREEN for these 2 slugs
- [ ] SUMMARY documents any quantified-number gaps requiring Jack's redline
</success_criteria>

<output>
After completion, create `.planning/phases/13-content-pass-projects-sync/13-05-case-studies-batch-a-SUMMARY.md` documenting:
- Final word counts (seatwatch: NNN words, nfl-predict: NNN words)
- Named systems cited per case study (full list per slug)
- Quantified numbers cited per case study (full list per slug)
- Any deviations from the 600-900 band and why
- Any quantified-number placeholders the executor used because the source README lacked hard data (flag for Jack's redline)
- Test pass status per slug
</output>
