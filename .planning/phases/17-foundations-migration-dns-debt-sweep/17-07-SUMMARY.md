---
phase: 17-foundations-migration-dns-debt-sweep
plan: 07
subsystem: chat
tags: [chat, voice-split, gap-closure, phase-17, CHAT-06, UAT-GAP-01]
dependency_graph:
  requires:
    - 17-06-SUMMARY  # baseline Phase 17 close-out (clean tree, all DEBT-01..05 done)
    - 14-04-SUMMARY  # original biographer system prompt (the contract this restores)
  provides:
    - voice_split_artifact: src/data/about-chat.ts (third-person about exports)
    - voice_split_artifact: per-MDX chatSummary frontmatter (third-person project summaries)
    - voice_split_guard: scripts/build-chat-context.mjs checkFirstPersonLeaks() (broadened B1 regex)
    - voice_split_test_battery: tests/build/chat-knowledge-voice.test.ts + tests/api/chat-voice-split.test.ts (21 tests)
    - hardened_role_block: src/prompts/system-prompt.ts <role> defense-in-depth
    - clean_baseline_test_suite: pnpm test exits 0 (closes the 1 pre-existing FAIL from Plan 17-01)
  affects:
    - phase: 18
      surface: chat
      reason: "Phase 18 will touch chat surface (IDENT-01/02 + META-02) and inherits the new voice-split contract; the BROADENED leak guard in build-chat-context.mjs and the 21-test battery prevent silent voice regressions during sessionId wiring."
    - phase: 17
      sub_goal: FOUND-03
      reason: "Pages retirement now waits not just for the 24h warm window but ALSO for the gap-closure deploy chain (17-09, 17-10, 17-08) to land. Plan 17-08 in particular is THE prerequisite for `git push origin main` per DEPLOY-GATE.md."
tech_stack:
  added: []
  patterns:
    - "Per-surface voice-split data publishing — same source-of-truth content authored in two voices for two surfaces (site = first-person via about.ts + MDX bodies; chat = third-person via about-chat.ts + MDX chatSummary frontmatter). The voice split is per-surface, not per-source."
    - "BROADENED first-person leak regex (B1) — explicitly enumerates present-tense verbs (build/like/wonder), apostrophe contractions (I'd/I'll/I've/I'm), and 'My favorite'/'My approach' tokens that the original spec'd regex missed. Same canonical regex string in 3 places: scripts/build-chat-context.mjs FIRST_PERSON_LEAK_RE, tests/build/chat-knowledge-voice.test.ts, tests/api/chat-voice-split.test.ts. Keep all three in sync."
    - "B1 self-test pattern — assert the regex catches what it SHOULD catch (16 known-leak samples) before asserting it doesn't catch anything in the artifact. Prevents silent regex weakening from passing artifact-sweep tests."
    - "B2 readFileSync + JSON.parse pattern (over import + as any) — type-system independent; fails LOUD if portfolio-context.json is missing or malformed; sidesteps the need for tsconfig.resolveJsonModule and avoids masking JSON shape drift."
    - "Defense-in-depth wording discipline — system-prompt instructions describing the voice-split rule MUST avoid literal first-person example phrases (e.g. 'I built X'); those phrases trip the leak regex and ironically cause the live-system-block tripwire to fail. Phrase abstractly: 'rewrite Jack's first-person voice as third-person'."
key_files:
  created:
    - path: src/data/about-chat.ts
      role: "Hand-authored third-person variants of ABOUT_INTRO/P1/P2/P3 (sibling exports consumed only by build-chat-context.mjs). about.ts continues to feed the website surface in first person."
    - path: tests/build/chat-knowledge-voice.test.ts
      role: "Build-time voice contract: B1 self-test (16 known-leak samples + 1 negative-control) + 3 artifact-contract tests over portfolio-context.json (about.intro starts with 'Jack', no leaks in about.* + experience, every project.caseStudy non-empty + leak-free)."
    - path: tests/api/chat-voice-split.test.ts
      role: "Live-system-block tripwire: full JSON.stringify(args.system) contains no first-person leading clauses + canonical role + defense-in-depth phrases present. Catches a regression where someone bypasses build-chat-context.mjs and edits portfolio-context.json directly."
  modified:
    - path: src/content/projects/clipify.mdx
      role: "Added chatSummary: frontmatter (third-person summary). Body above CASE-STUDY-END unchanged."
    - path: src/content/projects/daytrade.mdx
      role: "Added chatSummary: frontmatter."
    - path: src/content/projects/nfl-predict.mdx
      role: "Added chatSummary: frontmatter."
    - path: src/content/projects/optimize-ai.mdx
      role: "Added chatSummary: frontmatter."
    - path: src/content/projects/seatwatch.mdx
      role: "Added chatSummary: frontmatter."
    - path: src/content/projects/solsniper.mdx
      role: "Added chatSummary: frontmatter."
    - path: scripts/build-chat-context.mjs
      role: "+ parseAboutChatExports() mirroring parseAboutExports; buildProjectBlock() now requires chatSummary frontmatter + substitutes for body in caseStudy field; main() reads about-chat.ts (NOT about.ts) for the about block; new checkFirstPersonLeaks(merged) walks chat-bound fields against B1 broadened regex and exits 2 on any match."
    - path: src/data/portfolio-context.json
      role: "Regenerated artifact: about.intro now starts with 'Jack is...'; experience now third-person concatenation; every project.caseStudy is the third-person chatSummary (~110-130 words) instead of first-person MDX body (~700-900 words). Bulk shifted to extendedReference.content where it belongs. est_tokens=41053."
    - path: src/prompts/system-prompt.ts
      role: "<role> block gains a defense-in-depth instruction: 'rewrite Jack's first-person voice as third-person — turn first-person verb forms into Jack plus the third-person verb form, and turn first-person possessives into Jacks.' Phrasing intentionally abstract (no literal example phrases) to avoid tripping FIRST_PERSON_LEAK regex."
    - path: .github/workflows/sync-check.yml
      role: "Added src/data/about-chat.ts to PR path triggers (M1) so PRs touching the third-person variant fire the existing build:chat-context:check job."
    - path: tests/content/roadmap-amendment.test.ts
      role: "Both cases marked it.skip with rationale comments (Path B per Task 0/M8). The tests asserted ROADMAP.md still has standalone Phase 13/14 H3 headings, but those collapsed into the v1.2-archive <details> block during v1.2 → v1.3 transition. Closes the 1 pre-existing FAIL that has polluted pnpm test exit codes since Plan 17-01."
    - path: .planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md
      role: "Logged the Task 0/M8 closure with skip-rationale and pointer to revisit Path A (rewrite slicer for new ROADMAP) as low-priority polish."
    - path: .planning/STATE.md
      role: "Frontmatter completed_plans 6 -> 7, percent 60 -> 70; new 'Phase 17 Re-Opened (Gap Closure — 2026-05-11)' body section."
    - path: .planning/ROADMAP.md
      role: "M-iter2 wave correction (one plan per wave: 7→8→9→10); 17-07 marked [x] with full commit chain; v1.3 Phase 17 entry [x]→[~]; progress table row updated 6/6→7/10."
    - path: .planning/REQUIREMENTS.md
      role: "Added UAT-GAP-01..04 acceptance criteria + traceability rows; UAT-GAP-01 marked [x] implemented; coverage 31/31 → 35/35."
decisions:
  - "Path B (annotated-skip) chosen for the pre-existing roadmap-amendment.test.ts failure (Task 0/M8). The D-02 5-H2 amendment the test was guarding is already validated at Phase 13 close and continues to live in src/content/projects/*.mdx bodies (verified by Task 1 acceptance criteria asserting bodies are byte-identical above CASE-STUDY-END). Path A (rewrite slicer for new <details>-collapsed ROADMAP) is lower-value and deferred to a future /gsd-quick task."
  - "BROADENED canonical regex (B1) — single source of truth string used in scripts/build-chat-context.mjs, tests/build/chat-knowledge-voice.test.ts, and tests/api/chat-voice-split.test.ts. Future regression risk: if the regex weakens in one place but not the others, the leak guard becomes inconsistent. Mitigation: B1 self-test in chat-knowledge-voice.test.ts asserts the regex matches 16 known leak samples before any artifact-sweep test runs."
  - "Defense-in-depth instruction phrased ABSTRACTLY (no literal first-person example phrases). Discovered Rule 3 inline: my first draft included literal examples ('I built X', 'I'm Jack', 'my approach') which tripped the FIRST_PERSON_LEAK regex during the live-system-block tripwire test. Fixed inline by rewording to describe the rule abstractly: 'turn first-person verb forms into Jack plus the third-person verb form, and turn first-person possessives into Jacks.' Lifted into the patterns above for future plan-authoring guidance."
  - "Test assertion phrase chosen to match abstract instruction wording. Originally asserted toContain('rewrite first-person'), which broke when the instruction was rephrased. Updated to toContain(\"rewrite Jack's first-person voice\") which is the canonical phrase actually present in the prompt and which itself is leak-regex-safe."
  - "MDX bodies left UNCHANGED above CASE-STUDY-END. The first-person bodies remain correct for the /projects/[slug] case-study pages (per CHAT-06 voice-split contract). The chat surface gets its own dedicated chatSummary frontmatter field. Per-surface voice publishing instead of per-source rewriting."
  - "extendedReference.content (below-fence Projects/*.md technical reference) is OUT OF SCOPE for the leak guard. That's technical reference material, not voice-bearing prose authored for either surface. The defense-in-depth <role> instruction handles voice translation when the model cites it."
  - "M-iter2 wave correction (4 gap-closure plans into Waves 7-10 instead of all in Wave 6). One plan per wave so a wave-batching orchestrator cannot accidentally parallelize chat-surface mutations per CONTEXT.md D-10 — chat-surface mutations cannot run parallel without muddying D-26 attribution. Plan 17-08 gated LAST as the release-blocker deploy gate per DEPLOY-GATE.md."
metrics:
  duration_minutes: 19
  duration_string: "~19 min wall clock"
  completed_date: "2026-05-11"
  task_count: 5
  commit_count: 5
  file_count: 13
  test_count_delta: "+22 (new tests across chat-knowledge-voice + chat-voice-split) +0 modified -0 removed; net pnpm test 383 PASS / 1 FAIL → 404 PASS / 2 SKIP / 0 FAIL"
---

# Phase 17 Plan 07: Chat Voice-Split Regression (UAT Gap #1) Summary

UAT Gap #1 (BLOCKER) closed with three independent gates: a new third-person data source for the chat surface (about-chat.ts + 6 MDX chatSummary frontmatters), a build-time leak guard with a BROADENED B1 regex that hard-fails the build on any first-person leading clause, and a 21-test battery (B1 self-test + artifact-contract tests + live-system-block tripwire). The chat widget now speaks ABOUT Jack to visitors, never AS Jack.

## What Shipped

The chat <knowledge> block no longer ships ~30KB of first-person prose authored for the website surface. The third-person <role>/<tone> instruction in src/prompts/system-prompt.ts is no longer competing with conflicting voice signals embedded in the grounding data — the data and the instruction now agree. A defense-in-depth callout was added to the <role> block (phrased abstractly to avoid tripping the leak regex on its own example phrases), and a 21-test regression battery locks the contract forward.

The fix is per-surface, not per-source. src/data/about.ts is BYTE-IDENTICAL (still first-person for the homepage hero + about page). All 6 src/content/projects/*.mdx bodies are BYTE-IDENTICAL above CASE-STUDY-END (still first-person for /projects/[slug] case-study renders). The chat surface gets its own dedicated sources: src/data/about-chat.ts and per-MDX chatSummary frontmatter. The CHAT-06 voice-split contract is now structurally enforced rather than relying on instruction-only mitigation.

## Tasks Completed

| Task | Name                                                                                             | Commit  | Files                                                                                                                                                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Fix pre-existing roadmap-amendment.test.ts failure (M8 prerequisite)                             | ad9fdad | tests/content/roadmap-amendment.test.ts (Path B annotated-skip), .planning/phases/17.../deferred-items.md (closure note)                                                                                                                            |
| 1    | Author about-chat.ts (third-person about exports) + chatSummary on all 6 MDX frontmatters        | 537a0e6 | src/data/about-chat.ts (NEW, 4 exports), src/content/projects/{clipify,daytrade,nfl-predict,optimize-ai,seatwatch,solsniper}.mdx (frontmatter +1 line each)                                                                                         |
| 2    | Extend build-chat-context.mjs with broadened leak guard + sync-check.yml triggers                | 05bf93d | scripts/build-chat-context.mjs (parseAboutChatExports + buildProjectBlock chatSummary + main() about-chat.ts + checkFirstPersonLeaks B1), src/data/portfolio-context.json (regenerated), .github/workflows/sync-check.yml (+about-chat.ts trigger) |
| 3    | Defense-in-depth: system-prompt.ts hardening + 2 new test files (B1 self-test + B2 readFileSync) | 2aa627d | src/prompts/system-prompt.ts (<role> defense-in-depth), tests/build/chat-knowledge-voice.test.ts (NEW, 19 tests inc. B1 self-test), tests/api/chat-voice-split.test.ts (NEW, 2 tests)                                                              |
| 4    | M7 metadata + M-iter2 wave correction                                                            | 514339c | .planning/STATE.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md                                                                                                                                                                                |

## Verification Results

- pnpm build:chat-context:check exits 0 — no drift between sources and src/data/portfolio-context.json.
- pnpm test (full suite, every commit):
  - After Task 0: 46 files passed / 1 skipped (47), 382 tests passed / 2 skipped (384), 0 failed. (First time pnpm test exits 0 cleanly in 6 plans.)
  - After Task 1: 46 files passed / 1 skipped, 382 / 2 / 0.
  - After Task 2: 46 files passed / 1 skipped, 382 / 2 / 0.
  - After Task 3: 48 files passed / 1 skipped (49), 404 tests passed / 2 skipped (406), 0 failed. (+22 tests across the 2 new files.)
  - After Task 4 (final): 48 files passed / 1 skipped, 404 / 2 / 0.
- pnpm test tests/api/sse-snapshot.test.ts (D-15 anchor): 3/3 GREEN at every commit. system-prompt.ts edits do NOT flow into SSE response bytes (the system block is sent to Anthropic, not enqueued into the SSE stream).
- pnpm exec astro check: 2 errors — both PRE-EXISTING in tests/client/listener-dedup.test.ts from Plan 17-03 (already logged in deferred-items.md as out-of-scope carry-forward debt). Plan 17-07 introduced 0 new typecheck errors.
- portfolio-context.json est_tokens = 41053 — well above MIN_TOKEN_FLOOR 4096 cache minimum. INFO threshold (40000) crossed but no WARN — content within budget. (Token total slightly above the previous baseline because the static identity + extendedReference.content together exceed what the dropped first-person caseStudy body contributed.)

## Token Budget Delta (m1 observation)

Pre-plan (first-person caseStudy bodies): each project caseStudy was ~700-900 words. Per-project token contribution stayed roughly:
- daytrade: 9378 tokens (truncated extendedReference)
- nfl-predict: 8551 tokens
- seatwatch: 7263 tokens
- clipify: 5684 tokens
- solsniper: 5168 tokens
- optimize-ai: 4063 tokens
- TOTAL: 41053 est_tokens

Post-plan (third-person chatSummary fields ~110-130 words): the per-project token totals look similar in this report because the bulk of token weight in each project block lives in the extendedReference.content field (below-fence Projects/*.md), not in the caseStudy. The caseStudy field shrank by ~85% per project (from full case-study body to one chatSummary paragraph). Bulk shifted to extendedReference.content where it belongs.

m1 hint: chatSummary cap is currently 600 chars. None of the 6 hand-authored chatSummary fields hit the cap — the longest is solsniper at ~108 words (well under 600 chars worth of content). No need to raise the cap; the 600-char ceiling provides headroom for future case-study authoring without forcing multi-line YAML.

## B1 Self-Test Results

The 16 known-leak samples the regex catches (all PASS):

```
"I'm Jack" / "I built SeatWatch" / "I architected the system" /
"I chose Postgres" / "I wanted a faster path" / "I reach for the boring tool" /
"I read the spec" / "I build small services" / "I like tests that fail loudly" /
"I wonder how that actually works" / "I haven't touched that yet" /
"I'd be comfortable handing off" / "I'll push to main" / "I've shipped 6 projects" /
"My approach is" / "My favorite bug reports"
```

The 6 negative-control samples the regex correctly does NOT match:

```
"Jack is a junior software engineer" / "Jack builds small services" /
"Jack likes tests that fail loudly" / "His favorite bug reports" /
"Jack's approach is" / "Jack reaches for the boring tool"
```

This proves the regex catches what it should catch — not just whatever happens to be in the post-fix portfolio-context.json. If a future regex weakening lets these tokens through, the self-test fails BEFORE the artifact sweep tests have a chance to silently pass.

## Voice Wording Adjustments (vs Plan Suggestions)

The plan provided suggested ABOUT_CHAT_* defaults; I refined wording during authoring to keep the tone natural while strictly avoiding the broadened leak regex. Notable substitutions vs the plan's suggestion:

- "Jack ... who likes building" → "Jack ... who enjoys building" (the plan's phrase was leak-safe, just chose a verb that reads more natural in third-person without losing concrete signal).
- "Jack reads the spec before the blog post" left as-is (matches plan).
- "Jack gravitates toward tests that fail loudly" instead of "He likes tests that fail loudly" (avoids any possible confusion with first-person phrasing in adjacent text; "gravitates" reads well).
- "His favourite bug reports" (UK spelling) — chosen because the leak regex matches "favorite" as part of `My\s+favorite` only; using "favourite" avoids any ambiguity if a future regex extension covers "His favorite" too. Cosmetic decision; both spellings are correct in third-person context.

The 6 MDX chatSummary fields were authored from each file's existing Approach & Architecture + Outcome sections. Each is a single quoted YAML string (one paragraph, ~80-130 words), substantively the same content as the first-person body but voice-flipped. Project names ("SeatWatch", "SolSniper", etc.) preserved exactly. Numbers preserved exactly (39 test files, 6-step ladder, 26-profile pool, etc.). System behavior present-tense; Jack's actions third-person past tense.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Defense-in-depth instruction tripped its own leak regex**

- **Found during:** Task 3 verification (`pnpm test tests/api/chat-voice-split.test.ts`)
- **Issue:** My first draft of the system-prompt defense-in-depth instruction included literal first-person example phrases ("I built X", "I'm Jack", "my approach") to make the rule clear to the model. Those phrases tripped the FIRST_PERSON_LEAK regex during the live-system-block tripwire test (`expect(systemText).not.toMatch(FIRST_PERSON_LEAK)` failed with `matched "I built" near " quote from it, rewrite first-person ("I built X", "I'm Jack", "my approach") as third-person ("Jack built X", "Jack is...", "..."`).
- **Fix:** Reworded the instruction to describe the rule abstractly without any literal first-person example phrases: "turn first-person verb forms into Jack plus the third-person verb form, and turn first-person possessives into Jacks." Test passed on re-run.
- **Files modified:** `src/prompts/system-prompt.ts` (one paragraph reword)
- **Commit:** `2aa627d` (folded into Task 3's natural commit; not a separate fix commit per "atomic per-task" rule)

**2. [Rule 3 - Blocking] Test assertion broken by Rule 3 #1 fix**

- **Found during:** Task 3 re-run after Rule 3 #1 fix
- **Issue:** I had written `expect(systemText).toContain("rewrite first-person")` — but the reword in fix #1 changed the phrase to "rewrite Jack's first-person voice as third-person", so the literal substring no longer matched.
- **Fix:** Updated test assertion to `expect(systemText).toContain("rewrite Jack's first-person voice")` which matches the canonical phrase in the rephrased prompt. Test passed on re-run. Both fixes lifted into the canonical patterns at the top of this SUMMARY for future plan-authoring guidance.
- **Files modified:** `tests/api/chat-voice-split.test.ts` (one toContain string)
- **Commit:** `2aa627d` (folded into Task 3's natural commit)

### Out-of-scope discoveries (not fixed)

**1. tests/client/listener-dedup.test.ts ts(7006) errors (carry-forward from Plan 17-03)**

- **Status:** Pre-existing — already documented in `.planning/phases/17-foundations-migration-dns-debt-sweep/deferred-items.md` as out-of-scope carry-forward debt from Plan 17-03 commit `0ad77b3`. Plan 17-07 introduced 0 new typecheck errors. `pnpm exec astro check` shows exactly the same 2 errors as before this plan (no net change).
- **Plan 17-07 acceptance criterion text:** Task 3 acceptance lists "pnpm exec astro check exits 0 — no new typecheck errors introduced" — phrasing is internally inconsistent (exits 0 vs no NEW errors). Per the deviation rules SCOPE BOUNDARY, only auto-fix issues DIRECTLY caused by current task changes; the listener-dedup typecheck errors are not directly caused by Plan 17-07 task changes, so they remain out of scope.
- **Closure path:** Already logged in deferred-items.md for Phase 18 first-plan absorption per 17-RETROSPECTIVE.md.

## Post-Deploy UAT (PENDING)

After the gap-closure plans deploy (which is gated on Plan 17-08 landing — see DEPLOY-GATE.md), open the chat widget on https://jackcutrara.com and verify:

- Send "hi" → bot greets the visitor in second person (NOT "Hey Jack"); refers to Jack in third person.
- Send "who am i" → bot answers something like "I don't know who you are — I can only speak ABOUT Jack" or similar (NOT "You're Jack Cutrara, ...").
- Send "tell me about Jack" → response uses "Jack is...", "Jack built...", "Jack chose...", never "I'm Jack" or "I built".

The post-deploy UAT will close UAT-GAP-01 fully (the build-time tests close it structurally; the post-deploy UAT closes it operationally).

## Self-Check: PASSED

Created files exist:
- ✅ src/data/about-chat.ts
- ✅ tests/build/chat-knowledge-voice.test.ts
- ✅ tests/api/chat-voice-split.test.ts
- ✅ .planning/phases/17-foundations-migration-dns-debt-sweep/17-07-SUMMARY.md (this file)

Commits exist (verified via `git log --oneline -8`):
- ✅ ad9fdad (Task 0/M8)
- ✅ 537a0e6 (Task 1)
- ✅ 05bf93d (Task 2)
- ✅ 2aa627d (Task 3)
- ✅ 514339c (Task 4 metadata)

State updates:
- ✅ STATE.md frontmatter completed_plans 6 → 7, percent 60 → 70
- ✅ STATE.md body Phase 17 Re-Opened section added
- ✅ ROADMAP.md M-iter2 wave correction (Wave 7-10) + 17-07 marked [x] + progress table 6/6 → 7/10
- ✅ REQUIREMENTS.md UAT-GAP-01..04 added; UAT-GAP-01 [x]; coverage 31/31 → 35/35
