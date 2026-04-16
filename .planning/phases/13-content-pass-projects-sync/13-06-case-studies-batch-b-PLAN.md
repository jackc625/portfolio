---
phase: 13
plan: 06
type: execute
wave: 4
depends_on: [02, 04]
files_modified:
  - Projects/3 - SOLSNIPER.md
  - Projects/4 - OPTIMIZE_AI.md
  - src/content/projects/solsniper.mdx
  - src/content/projects/optimize-ai.mdx
autonomous: true
requirements: [CONT-01, CONT-02]
must_haves:
  truths:
    - "Projects/3 - SOLSNIPER.md and Projects/4 - OPTIMIZE_AI.md each contain the fenced case-study block with the 5 D-01 H2s in order"
    - "After `pnpm sync:projects`, src/content/projects/solsniper.mdx and src/content/projects/optimize-ai.mdx bodies have the 5 D-01 H2s in order"
    - "Both MDX bodies fall in 600-900 word band (D-16 soft target)"
    - "Neither body uses any D-11 banlist word"
    - "Both bodies use first-person past-tense voice and reference at least 3 named systems"
    - "Both bodies cite at least one quantified performance/scale number"
    - "Plan 01 case-study tests for these 2 slugs are GREEN"
  artifacts:
    - path: "Projects/3 - SOLSNIPER.md"
      provides: "Source-of-truth case-study for SolSniper (fenced); existing technical README preserved below the fence"
      contains: "<!-- CASE-STUDY-START -->"
    - path: "Projects/4 - OPTIMIZE_AI.md"
      provides: "Source-of-truth case-study for Optimize AI (fenced); existing technical README preserved below the fence"
      contains: "<!-- CASE-STUDY-START -->"
    - path: "src/content/projects/solsniper.mdx"
      provides: "Synced case-study body in 5-H2 D-01 shape; frontmatter byte-preserved (S1)"
      contains: "## Approach & Architecture"
    - path: "src/content/projects/optimize-ai.mdx"
      provides: "Synced case-study body in 5-H2 D-01 shape; frontmatter byte-preserved (S1)"
      contains: "## Approach & Architecture"
  key_links:
    - from: "Projects/3 - SOLSNIPER.md (fenced block)"
      to: "src/content/projects/solsniper.mdx body"
      via: "scripts/sync-projects.mjs"
      pattern: "## Problem.*## Approach & Architecture.*## Tradeoffs.*## Outcome.*## Learnings"
    - from: "Projects/4 - OPTIMIZE_AI.md (fenced block)"
      to: "src/content/projects/optimize-ai.mdx body"
      via: "scripts/sync-projects.mjs"
      pattern: "## Problem.*## Approach & Architecture.*## Tradeoffs.*## Outcome.*## Learnings"
---

<objective>
Author the case-study fenced blocks in `Projects/3 - SOLSNIPER.md` and `Projects/4 - OPTIMIZE_AI.md`, then run `pnpm sync:projects` to land the bodies in the corresponding MDX files. Same contract as Plan 05: 5-H2 D-01 shape, 600-900 words, D-11 voice rules, named systems, quantified numbers.

Purpose: Closes 2 of 6 case studies for CONT-01 and CONT-02. Parallel with Plan 05 and Plan 07 (Wave 4). Splitting at 2-per-plan keeps each plan inside the ~50% context budget.

Output: Two fenced blocks added to Projects/*.md files; two MDX bodies rewritten via sync; Plan 01 case-study test assertions move to GREEN for these 2 slugs.
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
@src/content/projects/solsniper.mdx
@src/content/projects/optimize-ai.mdx
@src/content/projects/seatwatch.mdx
@Projects/3 - SOLSNIPER.md
@Projects/4 - OPTIMIZE_AI.md

<interfaces>
<!-- Same fence convention and voice rules as Plan 05. See Plan 05 <interfaces> block for full details. -->

D-01 H2 sequence (verbatim, in order): Problem, Approach & Architecture, Tradeoffs, Outcome, Learnings.

D-11 banlist (zero occurrences): revolutionary, seamless, leverage, robust, "dive deeper", "elevate", "supercharge", emoji.

D-16 word band (soft target): 600-900 words.

D-09: first-person past tense.

D-11 Rule 4: ≥ 3 named systems per case study.

D-11 Rule 2: ≥ 1 quantified performance/scale number per case study.

Reference voice exemplar: src/content/projects/seatwatch.mdx after Plan 05 Task 1 completes.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Author SolSniper case study (fenced block in Projects/3 - SOLSNIPER.md, then sync to MDX)</name>
  <files>Projects/3 - SOLSNIPER.md, src/content/projects/solsniper.mdx</files>
  <read_first>
    - Projects/3 - SOLSNIPER.md (full file — sole technical source material; READ END-TO-END)
    - src/content/projects/solsniper.mdx (current frontmatter + current body for tonal calibration)
    - src/content/projects/seatwatch.mdx POST-Plan-05-Task-1 state (the canonical 5-H2 voice exemplar to mirror in density and named-systems usage)
    - src/data/portfolio-context.json (lines for SolSniper entry — multi-source token detection, three-tier safety validation, six-step sell escalation, crash recovery, real-time Preact dashboard — informs subsystem naming)
    - docs/VOICE-GUIDE.md (D-09 + D-10 + D-11 four hard rules)
    - docs/CONTENT-SCHEMA.md (fence convention §2, author workflow §3)
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (Pattern 1 frontmatter byte preservation; Pitfall 3 fence before code fences)
    - scripts/sync-projects.mjs
  </read_first>
  <behavior>
    Same shape as Plan 05 Task 1. Read `Projects/3 - SOLSNIPER.md` end-to-end. Author fenced block above any code fence (after intro, before existing tech sections).

    Subject matter highlights to weave in (verify against Projects/3 - SOLSNIPER.md before committing):
    - Solana-based high-speed trading
    - Multi-source token detection (likely WebSocket streams + RPC polling — verify against source)
    - Three-tier safety validation (likely token contract checks → liquidity checks → market-microstructure checks — verify)
    - Six-step sell escalation (the staged exit logic — verify exact step taxonomy)
    - Crash recovery (state persistence + restart flow — verify mechanism)
    - Real-time Preact monitoring dashboard
    - Tech stack: TypeScript, @solana/web3.js, Preact, SQLite, Fastify, Jupiter API

    The five H2s must include:
    - `## Problem`: speed-of-execution + safety-vs-velocity dilemma in Solana token trading; quantified scale (tokens/sec encountered, latency budget)
    - `## Approach & Architecture`: name every subsystem (multi-source token feed, three-tier safety validator, six-step sell escalation engine, crash-recovery state machine, Preact monitor)
    - `## Tradeoffs`: 2-4 deliberate compromises (e.g., safety checks add latency vs raw speed; Preact dashboard chosen over React for bundle weight; SQLite for crash-resume vs Redis for speed)
    - `## Outcome`: quantified — tokens monitored, validations performed, sells executed, dashboard p99 latency, crash-recovery success rate
    - `## Learnings`: hardest problem journey

    Total target: 700-850 words.
  </behavior>
  <action>
    Step 1 — Read `Projects/3 - SOLSNIPER.md` end-to-end. Extract real subsystem names, real numbers, and the actual hardest problem encountered.

    Step 2 — Edit `Projects/3 - SOLSNIPER.md`. Surgical Edit pattern (same as Plan 05 Task 1):

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

    <150-200 words; first-person past-tense; quantified Solana token-flow scale + latency budget>

    ## Approach & Architecture

    <200-300 words; named subsystems: multi-source token detector, three-tier safety validator, six-step sell escalation engine, crash-recovery state machine, real-time Preact monitor; data flow from token-detected to position-closed>

    ## Tradeoffs

    <100-150 words; concrete compromises with hidden costs>

    ## Outcome

    <100-150 words; quantified — pull real numbers from Projects/3 - SOLSNIPER.md; if missing, flag in SUMMARY for redline>

    ## Learnings

    <100-150 words; hardest problem journey + lesson>

    <!-- CASE-STUDY-END -->

    <existing first H2 of the technical README — keep verbatim>
    ```

    Apply D-11 banlist enforcement, first-person past tense, named systems with proper-noun status.

    Step 3 — Run sync:
    ```bash
    pnpm sync:projects
    ```
    Expect: `solsniper.mdx: updated, <NNN> words (OK|...)`. Tighten if outside band.

    Step 4 — Verify:
    ```bash
    pnpm test tests/content/case-studies-shape.test.ts        # GREEN for solsniper at minimum
    pnpm test tests/content/case-studies-have-content.test.ts # GREEN for solsniper
    pnpm test tests/content/voice-banlist.test.ts             # GREEN for solsniper
    pnpm test tests/scripts/sync-projects-idempotency.test.ts # GREEN
    pnpm check                                                 # exit 0
    ```
  </action>
  <acceptance_criteria>
    - `Projects/3 - SOLSNIPER.md` contains both fence markers, each appearing exactly once, start before end (verify: `grep -c "<!-- CASE-STUDY-START -->" "Projects/3 - SOLSNIPER.md"` returns 1; same for END).
    - `src/content/projects/solsniper.mdx` body has the 5 H2s in D-01 order (verify: `grep -E "^## " src/content/projects/solsniper.mdx | tr '\n' '|'` outputs exactly `## Problem|## Approach & Architecture|## Tradeoffs|## Outcome|## Learnings|`).
    - solsniper.mdx body in 600-900 word band (verify via sync output `OK` tag).
    - solsniper.mdx zero banlist words (verify: `grep -ciE "\\b(revolutionary|seamless|leverage|robust|dive deeper|elevate|supercharge)\\b" src/content/projects/solsniper.mdx` returns 0).
    - solsniper.mdx uses first-person past tense (verify: `grep -cE "\\b(I built|I implemented|I designed|I architected)\\b" src/content/projects/solsniper.mdx` returns ≥ 2).
    - solsniper.mdx cites at least 3 named systems (verify: `grep -cE "(multi-source|token detector|safety validator|sell escalation|crash-recovery|Preact monitor|Jupiter)" src/content/projects/solsniper.mdx` returns ≥ 3).
    - `pnpm test tests/content/case-studies-shape.test.ts` test for solsniper passes GREEN.
    - `pnpm test tests/scripts/sync-projects-idempotency.test.ts` passes GREEN.
    - `pnpm check` exits 0.
    - Frontmatter of solsniper.mdx byte-preserved (verify diff scope).
    - SUMMARY notes any quantified-number gaps for redline.
  </acceptance_criteria>
  <verify>
    <automated>pnpm sync:projects 2>&1 | grep "solsniper" | tee /tmp/13-06-task1.log; grep -E "^## " src/content/projects/solsniper.mdx | head -5 | diff - <(printf "## Problem\n## Approach & Architecture\n## Tradeoffs\n## Outcome\n## Learnings\n") && grep -ciE "\\b(revolutionary|seamless|leverage|robust|dive deeper)\\b" src/content/projects/solsniper.mdx | awk '{ if ($1 == 0) exit 0; else exit 1 }'</automated>
  </verify>
  <done>SolSniper fenced block written, sync produces 5-H2 MDX body in 600-900 words, zero banlist words, named systems cited, voice rules obeyed, idempotency tests GREEN, frontmatter byte-preserved.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Author Optimize AI case study (fenced block in Projects/4 - OPTIMIZE_AI.md, then sync to MDX)</name>
  <files>Projects/4 - OPTIMIZE_AI.md, src/content/projects/optimize-ai.mdx</files>
  <read_first>
    - Projects/4 - OPTIMIZE_AI.md (full file — sole technical source material; READ END-TO-END)
    - src/content/projects/optimize-ai.mdx (current frontmatter + body)
    - src/content/projects/seatwatch.mdx POST-Plan-05-Task-1 state (canonical voice reference)
    - src/data/portfolio-context.json (lines for Optimize AI entry — Next.js 15 + Supabase, fitness platform, complete user data isolation via PostgreSQL Row-Level Security on every table)
    - docs/VOICE-GUIDE.md, docs/CONTENT-SCHEMA.md
    - .planning/phases/13-content-pass-projects-sync/13-PATTERNS.md (Pattern 1 + Pitfall 3)
    - scripts/sync-projects.mjs
  </read_first>
  <behavior>
    Same contract as Task 1, applied to Optimize AI.

    Subject matter highlights to verify against Projects/4 - OPTIMIZE_AI.md:
    - Personal fitness platform (workouts, nutrition, habits, body composition)
    - Next.js 15 with App Router
    - Supabase for auth + Postgres + storage
    - PostgreSQL Row-Level Security (RLS) policies on EVERY table for complete user data isolation
    - Tailwind CSS for styling
    - Likely subsystems: workout tracker, nutrition logger, habit-streak engine, body-comp dashboard, RLS policy library

    The five H2s:
    - `## Problem`: personal fitness data is highly sensitive; multi-tenant SaaS often leaks via missing tenant filters in queries; goal was a fitness platform where RLS guarantees zero cross-user data leakage even if app code has bugs
    - `## Approach & Architecture`: name subsystems — RLS policy library covering N tables, Supabase auth → JWT → row policy chain, Next.js 15 App Router with server components for query-time RLS, four feature modules (workouts, nutrition, habits, body comp)
    - `## Tradeoffs`: RLS imposes latency on every query (Postgres planner runs the policy) but eliminates a class of bugs entirely; Supabase locks you into Postgres + their auth (acceptable for solo project); App Router server components reduce client JS but require server round-trip per page change
    - `## Outcome`: quantified — N tables with RLS, X RLS policies tested, Y feature modules shipped, Z pages, query latency under W ms
    - `## Learnings`: hardest problem journey (likely RLS policy debugging or auth-token integration)

    Total target: 700-850 words.
  </behavior>
  <action>
    Step 1 — Read `Projects/4 - OPTIMIZE_AI.md` end-to-end.

    Step 2 — Edit `Projects/4 - OPTIMIZE_AI.md` with the same surgical fence-insertion pattern as Task 1.

    Apply D-11 banlist + first-person past + named systems + quantified numbers.

    Special attention for Optimize AI: RLS is a security-critical claim. Be specific — "RLS policies on N tables" beats "comprehensive security". If exact policy count not in the README, use a measured phrasing like "every table" or document the gap.

    Step 3 — Run sync:
    ```bash
    pnpm sync:projects
    ```

    Step 4 — Verify:
    ```bash
    pnpm test tests/content/case-studies-shape.test.ts        # GREEN for optimize-ai
    pnpm test tests/content/case-studies-have-content.test.ts # GREEN for optimize-ai
    pnpm test tests/content/voice-banlist.test.ts             # GREEN for optimize-ai
    pnpm test tests/scripts/sync-projects-idempotency.test.ts # GREEN
    pnpm check                                                 # exit 0
    ```
  </action>
  <acceptance_criteria>
    - `Projects/4 - OPTIMIZE_AI.md` contains both fence markers exactly once each (verify with grep).
    - `src/content/projects/optimize-ai.mdx` body has the 5 H2s in D-01 order (verify with the same grep + diff pattern as Task 1).
    - optimize-ai.mdx body in 600-900 word band.
    - optimize-ai.mdx zero banlist words.
    - optimize-ai.mdx uses first-person past tense (verify: `grep -cE "\\b(I built|I implemented|I designed|I architected)\\b" src/content/projects/optimize-ai.mdx` returns ≥ 2).
    - optimize-ai.mdx cites at least 3 named systems (verify: `grep -cE "(Row-Level Security|RLS|Supabase|Next\\.js 15|App Router|workout tracker|nutrition logger|body composition)" src/content/projects/optimize-ai.mdx` returns ≥ 3).
    - `pnpm test tests/content/case-studies-shape.test.ts` test for optimize-ai passes GREEN.
    - `pnpm test tests/scripts/sync-projects-idempotency.test.ts` passes GREEN.
    - `pnpm check` exits 0.
    - Frontmatter byte-preserved.
    - RLS / security claims either include numbers or use measured phrasing (no "comprehensive" / "robust security" hand-waving).
  </acceptance_criteria>
  <verify>
    <automated>pnpm sync:projects 2>&1 | grep "optimize-ai" | tee /tmp/13-06-task2.log; grep -E "^## " src/content/projects/optimize-ai.mdx | head -5 | diff - <(printf "## Problem\n## Approach & Architecture\n## Tradeoffs\n## Outcome\n## Learnings\n") && grep -ciE "\\b(revolutionary|seamless|leverage|robust|dive deeper)\\b" src/content/projects/optimize-ai.mdx | awk '{ if ($1 == 0) exit 0; else exit 1 }'</automated>
  </verify>
  <done>Optimize AI fenced block written, sync produces 5-H2 MDX body in 600-900 words, zero banlist words, named systems cited (RLS / Supabase / Next.js 15 / etc.), security claims grounded in numbers or measured language, idempotency tests GREEN, frontmatter byte-preserved.</done>
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
| T-13-02 | Information Disclosure | Projects/3 - SOLSNIPER.md, Projects/4 - OPTIMIZE_AI.md (Solsniper involves trading capital; Optimize AI involves user fitness data — both have privacy-relevant context that COULD inadvertently leak operational details) | accept | Manual review during authoring; never paste API keys, wallet addresses, RPC endpoints, Supabase project URLs / anon keys, JWT secrets. Author writes about HOW the system works conceptually, not WHERE it runs or HOW to access it. |

T-13-01, T-13-03, T-13-04 not in scope (sync script + CI workflow + portfolio-context.json owned elsewhere).
</threat_model>

<verification>
After this plan runs:
- 2 of 6 case studies (cumulative 4 of 6 with Plan 05) have correct shape and voice
- `pnpm sync:projects` reports OK status for all 4 completed slugs (clipify and daytrade still pending — Plan 07)
- All Plan 01 case-study tests GREEN for the 4 completed slugs

Verification commands:
```bash
pnpm sync:projects                                           # 4 OK files reported
pnpm test tests/content/case-studies-shape.test.ts          # 4 of 6 slugs pass; clipify + daytrade still RED
pnpm test tests/content/voice-banlist.test.ts               # 4 of 6 slugs pass
pnpm test tests/scripts/sync-projects-idempotency.test.ts  # GREEN
pnpm check                                                   # exit 0
```
</verification>

<success_criteria>
- [ ] Both Projects/*.md files have correctly placed fence markers
- [ ] Both MDX bodies have the 5 D-01 H2s in exact order, in-band word count, zero banlist
- [ ] Both bodies use first-person past + cite ≥ 3 named systems + ≥ 1 quantified number
- [ ] Frontmatter byte-preserved
- [ ] Sync idempotency holds
- [ ] Plan 01 case-study tests GREEN for solsniper + optimize-ai
- [ ] No leaked operational secrets in either case study
</success_criteria>

<output>
After completion, create `.planning/phases/13-content-pass-projects-sync/13-06-case-studies-batch-b-SUMMARY.md` with the same per-slug structure as Plan 05's SUMMARY: word counts, named systems, quantified numbers, gaps for redline, test pass status.
</output>
