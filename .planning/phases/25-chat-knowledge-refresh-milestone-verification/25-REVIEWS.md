---
phase: 25
reviewers: [antigravity, codex]
reviewed_at: 2026-07-14T17:22:57Z
plans_reviewed: [25-01-PLAN.md, 25-02-PLAN.md, 25-03-PLAN.md, 25-04-PLAN.md]
models:
  antigravity: "Gemini 3.1 Pro (High)"
  codex: "gpt-5.6-sol"
---

# Cross-AI Plan Review — Phase 25

Two independent reviewers ran source-grounded against the live git working tree (each opened the referenced files and checked plan claims against actual code).

- **Antigravity** (Gemini 3.1 Pro, High) — Overall Risk: **LOW**
- **Codex** (gpt-5.6-sol) — Overall Risk: **MEDIUM** (25-03 **HIGH as written**); four mandatory corrections before execution

---

## Antigravity Review

# Markdown Review

## Summary
The plan is exceptionally thorough and highly accurate. It comprehensively addresses the Phase 25 goals of refreshing the chat knowledge base with the new professional experience and project #7, while properly migrating the education data. The planner correctly identified critical missing scope from the provided `CONTEXT.md` (specifically the hardcoded bans and audience framing in `src/prompts/system-prompt.ts`) and has mapped every necessary change down to the exact file and line number. I have cross-referenced every claim against the actual codebase, and the citations are perfectly aligned with the current state of the git working tree.

## Strengths
- **Impeccable Codebase Awareness**: Every file path and line number cited in the research (e.g., `build-chat-context.mjs` line 449 for the slug skip, line 468 for the defensive regex, `system-prompt.ts` line 56 for the #7 ban, etc.) exactly matches the repository's current state.
- **Scope Discovery**: Identifying that `src/prompts/system-prompt.ts` contains hardcoded instructions banning project #7 and framing the user as a "junior" engineer is a critical catch. Failing to update this would have caused the chat to refuse to discuss the new project despite it being in the corpus.
- **Robust Test Updates**: The plan correctly identifies all the brittle, hard-pinned tests that will break when the 6-project invariant changes to 7, including `chat-context-integrity.test.ts` (lines 17-24, 46) and `prompt-injection.test.ts` (lines 171-173, 279-298).
- **Graceful Deprecation & Safe Serialization**: Shifting `merged.experience` from a synthesized string to a structured array while updating the TypeScript interface (`src/prompts/portfolio-context-types.ts:50`) is done safely because the API only consumes the object via `JSON.stringify`.

## Concerns
- **LOW Severity - `education.ts` Regex Parsing Resilience**: The plan proposes extracting data from `education.ts` using per-key regexes like `/degree:\s*"([^"]+)"/`. Since `education.ts` formats the object across multiple lines with comments, ensure the regexes robustly handle potential whitespace or formatting variations (e.g., ensuring they don't accidentally match commented-out code or string fragments elsewhere in the file).
- **LOW Severity - `balfour-beatty.mdx` Summary Leak**: The plan correctly notes that Balfour's `summary` field (line 9) starts with "I interned...", which would trip the `checkFirstPersonLeaks` guard. The proposed solution (Option A: authoring a dedicated third-person `chatSummary` frontmatter field) is the safest approach and should be strictly adhered to.

## Suggestions
- **`education.ts` Parsing Implementation**: When implementing `parseEducation`, use the `m` (multiline) flag in your regexes and ensure you are matching within the bounds of the `export const EDUCATION` block to avoid false positives. 
- **Leak Guard Array Check**: When updating `checkFirstPersonLeaks` (lines 104-140 in `build-chat-context.mjs`), the proposed `Array.isArray(merged.experience)` fallback is excellent. Be sure to also log the specific array index in the error message (as proposed: `"experience[${i}].summary"`) to make debugging easier if a first-person leak does occur.
- **System Prompt Updates**: When removing the #7 ban on line 56 of `src/prompts/system-prompt.ts`, consider leaving a comment in the file explaining that project #7 is now explicitly permitted, to prevent future contributors from mistakenly re-adding a ban.

## Risk Assessment
**Overall Risk: LOW**
The execution risk is very low because the plan has already mapped out all the potential landmines (failing tests, first-person leak guards, hardcoded prompt bans, and exact exclusion locations). The changes are mostly confined to build scripts, static data files, and test fixtures. As long as the execution adheres strictly to the plan—especially updating the four pinned test files in lockstep with the build script changes—the milestone should close smoothly.

---

## Codex Review

# Overall Summary

The four-plan structure is sound: Wave 1 cleanly separates tests from copy, Wave 2 owns the corpus-engine migration, and Wave 3 performs capstone verification plus live UAT. The plans correctly discovered the hidden `system-prompt.ts` ban and cover the main CHAT-10/CHAT-11 data flow. I would approve the architecture but revise the plans before execution. The largest issues are an incomplete first-person guard, an internally inconsistent 25-03 task sequence, non-recursive experience ingestion, and the absence of an authoritative Phase 25 baseline for QA-01/QA-02.

## Plan 25-01 — Wave-0 Test Retargets

### Summary

The test retarget is necessary and mostly accurate. It removes assertions that deliberately protect the obsolete six-project world and establishes useful RED targets for project #7, structured experience, education, and positioning.

### Strengths

- It correctly identifies every major stale assertion: six expected slugs and the #7 exclusion in [chat-context-integrity.test.ts:17](C:/Users/jackc/Code/portfolio/tests/build/chat-context-integrity.test.ts:17), the prompt-level ban in [prompt-injection.test.ts:171](C:/Users/jackc/Code/portfolio/tests/api/prompt-injection.test.ts:171), the six-project count in [prompt-injection.test.ts:279](C:/Users/jackc/Code/portfolio/tests/api/prompt-injection.test.ts:279), and the stale `entry-level` anchor in [chat-eval-dataset.ts:175](C:/Users/jackc/Code/portfolio/tests/fixtures/chat-eval-dataset.ts:175).

- Retargeting the experience test is required because it currently assumes `ctx.experience` is a string at [chat-knowledge-voice.test.ts:117](C:/Users/jackc/Code/portfolio/tests/build/chat-knowledge-voice.test.ts:117). Adding a separate array-shape assertion avoids silently accepting the old shape.

- The three current canonical regex literals are byte-identical at [build-chat-context.mjs:93](C:/Users/jackc/Code/portfolio/scripts/build-chat-context.mjs:93), [chat-knowledge-voice.test.ts:40](C:/Users/jackc/Code/portfolio/tests/build/chat-knowledge-voice.test.ts:40), and [chat-voice-split.test.ts:33](C:/Users/jackc/Code/portfolio/tests/api/chat-voice-split.test.ts:33).

### Concerns

- **HIGH — The byte-identical leak guard has a live blind spot.** It is a finite verb allowlist, not a general first-person detector. The actual Balfour source starts with `"I interned..."` at [balfour-beatty.mdx:9](C:/Users/jackc/Code/portfolio/src/content/experience/balfour-beatty.mdx:9), but `interned` is absent from the regex at [build-chat-context.mjs:93](C:/Users/jackc/Code/portfolio/scripts/build-chat-context.mjs:93). A direct probe confirms that `"I interned"` and `"I coordinated"` do not match. Because both artifact tests reuse the same regex, all three prongs could miss that leak. The plan explicitly forbids changing the regex at [25-01-PLAN.md:107](C:/Users/jackc/Code/portfolio/.planning/phases/25-chat-knowledge-refresh-milestone-verification/25-01-PLAN.md:107).

- **MEDIUM — The array walk covers only two of four serialized strings.** The proposed object contains `role`, `company`, `dateRange`, and `summary`, but the plan scans only `role` and `summary` at [25-01-PLAN.md:107](C:/Users/jackc/Code/portfolio/.planning/phases/25-chat-knowledge-refresh-milestone-verification/25-01-PLAN.md:107). All four fields enter the prompt because the context is serialized wholesale at [system-prompt.ts:60](C:/Users/jackc/Code/portfolio/src/prompts/system-prompt.ts:60).

- **MEDIUM — The education test pins values, not the SSoT relationship.** The proposed assertions hard-code WGU, May 2026, VT, and LPI at [25-01-PLAN.md:83](C:/Users/jackc/Code/portfolio/.planning/phases/25-chat-knowledge-refresh-milestone-verification/25-01-PLAN.md:83). A build script that hard-coded the same values would pass even though the actual SSoT is exported at [education.ts:25](C:/Users/jackc/Code/portfolio/src/data/education.ts:25).

- **LOW — Full #7 ingestion is under-asserted.** The current integrity test checks only that every extended reference exceeds 100 characters at [chat-context-integrity.test.ts:73](C:/Users/jackc/Code/portfolio/tests/build/chat-context-integrity.test.ts:73). That does not prove D-04’s full, untruncated sibling treatment through the truncation path at [build-chat-context.mjs:399](C:/Users/jackc/Code/portfolio/scripts/build-chat-context.mjs:399).

### Suggestions

- Add `interned`, `coordinated`, and the other newly relevant first-person verbs to all three regex copies, plus B1 self-test samples for the exact Balfour wording. Alternatively, add an experience-specific assertion that summaries begin with `Jack`/`He` and never with `I`/`My`.

- Walk all four experience string properties, preferably through a small generic object-string walker.

- Import `EDUCATION` and `CREDENTIALS` into the Vitest test and compare the generated object against those exports.

- Assert `/projects/multi-chain-evm` has `extendedReference.truncated === false` and contains a distinctive late-source anchor.

### Risk Assessment

**MEDIUM.** The retargeting direction is correct, but the central voice guard does not currently guarantee what the plan claims.

## Plan 25-02 — Copy and Prompt Authoring

### Summary

This plan is well scoped and correctly includes the previously omitted prompt-template change. The human checkpoint is appropriate because the content includes production claims, professional positioning, and a reputationally sensitive trading project.

### Strengths

- Removing the #7 ban is mandatory: the current prompt explicitly forbids discussing the project at [system-prompt.ts:56](C:/Users/jackc/Code/portfolio/src/prompts/system-prompt.ts:56). Updating the `junior` audience framing at [system-prompt.ts:5](C:/Users/jackc/Code/portfolio/src/prompts/system-prompt.ts:5) is also necessary for CHAT-11 consistency.

- The proposed Holloway summary is grounded in actual source facts: 0→~1,400 checks, RLS across 47 entities, 223→1 portal scoping, 91 recovered jobs, payroll idempotency, and data-access consolidation are all present at [holloway.mdx:22](C:/Users/jackc/Code/portfolio/src/content/experience/holloway.mdx:22).

- The #7 framing accurately follows the source’s safety and honesty posture, including the explicit no-returns statement at [multi-chain-evm.mdx:40](C:/Users/jackc/Code/portfolio/src/content/projects/multi-chain-evm.mdx:40).

- The blocking human review occurs before corpus regeneration, preventing approved copy from drifting between source authoring and generated output.

### Concerns

- **MEDIUM — “Security block byte-intact” is not automatically proven.** Existing prompt tests pin the refusal strings and selected attack phrases at [prompt-injection.test.ts:138](C:/Users/jackc/Code/portfolio/tests/api/prompt-injection.test.ts:138) and [prompt-injection.test.ts:148](C:/Users/jackc/Code/portfolio/tests/api/prompt-injection.test.ts:148), but they do not snapshot the whole `<security>` block. An accidental edit to another security sentence could pass.

- **LOW — The fixture retains contradictory “global” #7 ban regexes.** `GLOBAL_BANNED_REGEXES` still labels multi-dex and crypto-trader wording as a Projects/7 ban at [chat-eval-dataset.ts:38](C:/Users/jackc/Code/portfolio/tests/fixtures/chat-eval-dataset.ts:38). They currently apply only to fixed refusal responses through [prompt-injection.test.ts:43](C:/Users/jackc/Code/portfolio/tests/api/prompt-injection.test.ts:43), so this is not an immediate functional failure, but it becomes misleading once #7 is public chat knowledge.

### Suggestions

- Add a normalized `<security>` block snapshot or baseline comparison that permits exactly the removal of the #7 sentence and nothing else.

- Rename the fixture list to something like `REFUSAL_RESPONSE_BANNED_REGEXES`, update its comments, or remove the obsolete #7 terms if they no longer serve a security purpose.

- Add simple assertions for the four new top-level skills so D-08 is not human-review-only.

### Risk Assessment

**MEDIUM.** Content risk is controlled by the checkpoint; the remaining concern is proving that the sensitive prompt-security edit is as narrow as claimed.

## Plan 25-03 — Corpus Engine and Regeneration

### Summary

This is the load-bearing plan and has the strongest architectural direction, but it needs revision before execution. As written, its task-level verification order cannot remain green, and several proposed parser/guard mechanisms are insufficiently fail-closed.

### Strengths

- It correctly handles both #7 exclusion mechanisms: the active slug skip at [build-chat-context.mjs:443](C:/Users/jackc/Code/portfolio/scripts/build-chat-context.mjs:443) and the defensive regex at [build-chat-context.mjs:466](C:/Users/jackc/Code/portfolio/scripts/build-chat-context.mjs:466).

- Once admitted, #7 can reuse the existing complete pipeline: required `chatSummary`, below-fence extraction, truncation, and extended-reference assembly at [build-chat-context.mjs:377](C:/Users/jackc/Code/portfolio/scripts/build-chat-context.mjs:377).

- The array migration is serialization-safe. The API imports the generated JSON at [api/chat.ts:6](C:/Users/jackc/Code/portfolio/src/pages/api/chat.ts:6), passes it to the request builder at [api/chat.ts:194](C:/Users/jackc/Code/portfolio/src/pages/api/chat.ts:194), and the prompt serializes the object without field-specific reads.

- The dependency-free parser approach matches the existing `parseAboutChatExports` convention at [build-chat-context.mjs:343](C:/Users/jackc/Code/portfolio/scripts/build-chat-context.mjs:343).

### Concerns

- **HIGH — Task 1’s verification cannot pass in its stated order.** It changes `PortfolioContext.experience` and `education`, then immediately requires `astro check` green at [25-03-PLAN.md:84](C:/Users/jackc/Code/portfolio/.planning/phases/25-chat-knowledge-refresh-milestone-verification/25-03-PLAN.md:84). The current generated JSON still has stale education and string experience at [portfolio-context.json:8](C:/Users/jackc/Code/portfolio/src/data/portfolio-context.json:8) and [portfolio-context.json:178](C:/Users/jackc/Code/portfolio/src/data/portfolio-context.json:178). Because that JSON is passed to the typed builder, TypeScript should fail until regeneration.

- **HIGH — Task 2’s verification silently performs Task 3’s mutation.** `node scripts/build-chat-context.mjs` in [25-03-PLAN.md:120](C:/Users/jackc/Code/portfolio/.planning/phases/25-chat-knowledge-refresh-milestone-verification/25-03-PLAN.md:120) is write mode; the script writes changed JSON at [build-chat-context.mjs:612](C:/Users/jackc/Code/portfolio/scripts/build-chat-context.mjs:612). Thus Task 2 modifies `portfolio-context.json` even though regeneration is assigned to Task 3.

- **MEDIUM — The proposed slug declaration can be duplicated.** The plan says to compute `const slug` before the regex at [25-03-PLAN.md:112](C:/Users/jackc/Code/portfolio/.planning/phases/25-chat-knowledge-refresh-milestone-verification/25-03-PLAN.md:112), but the current block already declares `const slug` later at [build-chat-context.mjs:475](C:/Users/jackc/Code/portfolio/scripts/build-chat-context.mjs:475). Literal execution would produce a duplicate declaration.

- **MEDIUM — The experience glob regresses established recursive coverage.** The plan specifies `src/content/experience/*.mdx` at [25-03-PLAN.md:113](C:/Users/jackc/Code/portfolio/.planning/phases/25-chat-knowledge-refresh-milestone-verification/25-03-PLAN.md:113), while both Astro’s collection loader at [content.config.ts:26](C:/Users/jackc/Code/portfolio/src/content.config.ts:26) and the experience sync script at [sync-experience.mjs:30](C:/Users/jackc/Code/portfolio/scripts/sync-experience.mjs:30) intentionally use `**/*.mdx`.

- **MEDIUM — Error behavior is underspecified.** The plan explicitly validates only missing `chatSummary`; `role`, `company`, `dateRange`, and `startDate` are also required by the schema at [content.config.ts:28](C:/Users/jackc/Code/portfolio/src/content.config.ts:28). It also says “throw exit 2,” but a raw unhandled throw does not enforce exit code 2. The existing project loop achieves that through its catch/count/exit mechanism at [build-chat-context.mjs:509](C:/Users/jackc/Code/portfolio/scripts/build-chat-context.mjs:509).

- **MEDIUM — The task is labeled TDD but its negative behaviors are untested.** No planned test actually introduces a second Projects/7 MDX, malformed education source, missing experience field, or first-person experience summary. The artifact tests cover only the current happy path.

### Suggestions

- Merge Tasks 1–3 into one atomic engine migration, or defer `astro check` until after the JSON has been regenerated. Keep interface, producer, and artifact synchronized at every green checkpoint.

- Move the existing `const slug` declaration above the reservation regex and reuse it.

- Use `src/content/experience/**/*.mdx` to match the collection and sync pipelines.

- Validate every required experience field and every required education scalar with named errors. Catch per-file failures and exit 2 before writing the generated artifact.

- Export and unit-test `parseEducation` and any pure experience/source-reservation helpers. Include malformed and missing-field cases.

- Expand the leak walk and regex as recommended under 25-01.

### Risk Assessment

**HIGH as written.** This plan owns the central migration, and its current task ordering and verification commands are internally inconsistent even before considering parser edge cases.

## Plan 25-04 — Capstone and Live UAT

### Summary

The capstone correctly runs the full build, full suite, type check, drift gate, and live benign-answer UAT. Deferring production-edge Lighthouse and milestone archival to ship follows the locked D-11 boundary. The main weakness is evidence quality for “untouched” files and dependency invariants.

### Strengths

- The automated command set covers the actual build chain defined in [package.json:13](C:/Users/jackc/Code/portfolio/package.json:13), the complete Vitest suite at [package.json:22](C:/Users/jackc/Code/portfolio/package.json:22), and corpus drift at [package.json:15](C:/Users/jackc/Code/portfolio/package.json:15).

- The D-15 test genuinely verifies SSE headers and byte-exact frames at [sse-snapshot.test.ts:74](C:/Users/jackc/Code/portfolio/tests/api/sse-snapshot.test.ts:74) and [sse-snapshot.test.ts:94](C:/Users/jackc/Code/portfolio/tests/api/sse-snapshot.test.ts:94). Prompt-content changes should not alter those bytes.

- Live UAT addresses the gap that corpus-presence assertions cannot: whether Haiku actually discusses #7, uses third person, and avoids return claims.

### Concerns

- **HIGH — The phase-wide baseline is not concretely defined.** The plan uses `git diff <phase-start-ref>` or `origin/main` at [25-04-PLAN.md:64](C:/Users/jackc/Code/portfolio/.planning/phases/25-chat-knowledge-refresh-milestone-verification/25-04-PLAN.md:64), but no plan captures that ref or a Phase 25 baseline. Research explicitly recommended a baseline. The prior authoritative pattern hashes protected files and dependencies because a working-tree diff misses committed drift at [verify-phase24-invariants.mjs:4](C:/Users/jackc/Code/portfolio/scripts/verify-phase24-invariants.mjs:4).

- **MEDIUM — `chat-surface-untouched` is being overstated.** The test itself says it is only a fast tripwire and not authoritative at [chat-surface-untouched.test.ts:16](C:/Users/jackc/Code/portfolio/tests/build/chat-surface-untouched.test.ts:16). It scans only `BaseLayout.astro`, not `global.css`, `chat.ts`, and `api/chat.ts`. The full test suite provides behavior coverage, but it does not by itself prove those four files remained byte-identical.

- **LOW — The live security behavior is not sampled.** The existing prompt-injection “battery” uses hand-authored expected responses rather than a live model, as documented at [prompt-injection.test.ts:57](C:/Users/jackc/Code/portfolio/tests/api/prompt-injection.test.ts:57). Because the security prompt is edited, one live injection/refusal probe would add useful confidence.

### Suggestions

- Add a Phase 25 baseline task before Wave 1, hashing the four gated files plus normalized `package.json.dependencies`. Verify it at the capstone using the Phase 24 pattern.

- Describe `chat-surface-untouched` accurately as the BaseLayout tripwire; treat `pnpm test` as the automated D-26 behavior battery and the hash verifier as the phase-wide untouched proof.

- Add one optional live prompt-exfiltration or PII-refusal probe after the two CHAT-11 knowledge questions.

### Risk Assessment

**MEDIUM.** The functional gate set is good, but QA-01/QA-02 need a deterministic baseline rather than a placeholder git comparison.

# Final Risk Assessment

**Overall risk: MEDIUM, with Plan 25-03 requiring revision before execution.**

The plans should achieve CHAT-10 and CHAT-11 once the engine migration lands, and the security scope is appropriately narrow. Before execution, I would make four mandatory corrections:

1. Fix the first-person guard using the repository’s actual `"I interned"` counterexample.
2. Merge or reorder 25-03 so type, producer, and generated artifact become green atomically.
3. Use recursive experience ingestion with fail-closed field/parser validation.
4. Capture a real Phase 25 baseline for the four gated files and runtime dependencies.

---

## Consensus Summary

Both reviewers approve the four-plan **architecture** (Wave 1 tests+copy in parallel, Wave 2 corpus-engine migration, Wave 3 capstone+UAT) and independently verified that the plans' file:line citations match the current repo. They diverge on execution risk: Antigravity rates it LOW; Codex rates it MEDIUM (25-03 HIGH) after a deeper task-sequencing/parser analysis that surfaced concrete inconsistencies Antigravity did not catch.

### Agreed Strengths (2+ reviewers)

- **Accurate, source-verified citations.** Both opened the repo and confirmed the cited lines (e.g. `build-chat-context.mjs:449` slug-skip, `:466` defensive regex, `system-prompt.ts:56` #7 ban) match the working tree.
- **The `system-prompt.ts` scope catch.** Both call out that discovering the hardcoded #7 topic ban + "junior" audience framing (omitted from the upstream file list) is critical — without it the chat would refuse the very project this phase ingests.
- **The string→array `experience` migration is serialization-safe.** Both traced that `api/chat.ts` consumes the corpus only via `JSON.stringify(context)` (Codex: `api/chat.ts:6`, `:194`), so the shape change carries no gated-file risk.
- **Correct identification of the stale/brittle test pins** (6→7 slugs, the #7 ban assertion, the `entry-level` anchor) that must flip in lockstep.

### Agreed Concerns (2+ reviewers — highest priority)

1. **First-person leak guard vs. Balfour "I interned…" (TOP CONSENSUS).** Both flag that the Balfour `summary` field starts in first person. Antigravity (LOW) trusts the mitigation — author a clean third-person `chatSummary` and never emit the first-person `summary`. **Codex escalates to HIGH**: the canonical `FIRST_PERSON_LEAK` regex is a *finite verb allowlist* and does **not** contain `interned`/`coordinated`, so if a first-person Balfour string ever reached a chat-bound field the guard would silently miss it — and 25-01 explicitly forbids changing the regex (`25-01-PLAN.md:107`). Net: the mitigation is sound, but the automated backstop is weaker than the plans claim.
2. **`education.ts` parsing/testing robustness.** Antigravity (LOW): the per-key regexes must be bounded to the `EDUCATION` block and multiline-safe to avoid matching comments/fragments. Codex (MEDIUM): the education test hard-codes WGU/May 2026/VT/LPI, so a build script that *also* hard-coded them would pass — it doesn't prove the SSoT relationship. Fix: import `EDUCATION`/`CREDENTIALS` into the test and compare against the exports.

### Divergent Views (worth investigating — mostly Codex depth Antigravity did not surface)

- **25-03 internal task ordering (Codex HIGH, Antigravity silent).** Codex found the load-bearing plan cannot stay green as sequenced:
  - Task 1 flips the `PortfolioContext` types then demands `astro check` green — but the stale generated JSON (string `experience`, old `education`) is fed to the typed builder, so TS should fail until regen (`25-03-PLAN.md:84`).
  - Task 2's verify command `node scripts/build-chat-context.mjs` is **write mode** (`build-chat-context.mjs:612`) — it silently performs Task 3's regeneration.
  - Fix: merge Tasks 1–3 into one atomic migration (or defer `astro check` until after regen) so type, producer, and artifact go green together.
- **Experience glob regression (Codex MEDIUM).** Plan uses `src/content/experience/*.mdx`, but the Astro collection loader (`content.config.ts:26`) and `sync-experience.mjs:30` use `**/*.mdx`. Recommend `**/*.mdx` for parity.
- **Duplicate `const slug` (Codex MEDIUM).** The plan adds `const slug` before the reservation regex, but the block already declares `const slug` at `build-chat-context.mjs:475` — literal execution = duplicate-declaration error. Reuse/move the existing declaration.
- **Fail-closed validation gaps (Codex MEDIUM).** Only missing `chatSummary` is validated; `role`/`company`/`dateRange`/`startDate` are also schema-required, and a raw `throw` does not guarantee exit 2 (the existing project loop gets exit 2 via its catch/count mechanism at `build-chat-context.mjs:509`). Validate every required field with named errors; catch-and-exit-2 before writing.
- **Leak walk covers 2 of 4 serialized strings (Codex MEDIUM).** The walk scans `role`+`summary`, but `company`+`dateRange` are also serialized wholesale into the prompt. Walk all four (a small generic object-string walker).
- **QA-01/QA-02 baseline is a placeholder (Codex HIGH, 25-04).** The dep/gated-file check relies on `git diff <phase-start-ref>` with no captured ref; a working-tree diff misses committed drift. The Phase 24 pattern (`verify-phase24-invariants.mjs`) hashes the four gated files + normalized `dependencies`. Recommend a Phase 25 baseline task before Wave 1, verified at the capstone. Also: `chat-surface-untouched` is a BaseLayout-only tripwire (`chat-surface-untouched.test.ts:16`), not proof all four gated files are byte-identical.
- **Overall risk rating.** Antigravity LOW vs. Codex MEDIUM/HIGH. The gap is entirely Codex's task-sequencing + fail-closed-parser scrutiny; Antigravity's pass validated citations and the two shared concerns but did not probe 25-03's execution order.

### Codex's four mandatory corrections (before execution)

1. Fix the first-person guard using the real `"I interned"` counterexample (extend the regex + B1 self-test, or add an experience-specific `starts-with-Jack/He, never I/My` assertion).
2. Merge/reorder 25-03 so type, producer, and generated artifact go green atomically.
3. Use recursive experience ingestion (`**/*.mdx`) with fail-closed field/parser validation and exported, unit-tested `parseEducation`.
4. Capture a real Phase 25 baseline (hash the four gated files + `package.json.dependencies`) for QA-01/QA-02.

### Recommended next step

Feed this back into planning:

```
/gsd-plan-phase 25 --reviews
```

The replan should prioritize the two agreed concerns and Codex's four corrections — especially the 25-03 task-ordering fix (HIGH) and the leak-guard/regex gap (HIGH), which are the two findings most likely to cause a red build or a silent voice regression during execution.
