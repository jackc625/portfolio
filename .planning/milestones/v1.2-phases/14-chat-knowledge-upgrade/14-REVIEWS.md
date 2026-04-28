---
phase: 14
reviewers: [codex]
reviewed_at: 2026-04-20
plans_reviewed:
  - 14-01-PLAN.md
  - 14-02-PLAN.md
  - 14-03-PLAN.md
  - 14-04-PLAN.md
  - 14-05-PLAN.md
  - 14-06-PLAN.md
not_available:
  - gemini — 429 "capacity exhausted" on every model (3-flash-preview, 2.5-pro, 2.5-flash, 3-pro-preview) for the ~110K-token review prompt; small prompts worked, so this was TPM-window throttling on Google's free tier, not a content issue
  - claude — skipped (executing AI; preserves independence)
  - cursor — skipped per user request
---

# Cross-AI Plan Review — Phase 14

## Codex Review

### Summary

The phase plan is unusually strong on specificity, sequencing, and traceability: it ties decisions to requirements, gives exact file-level work, and bakes in meaningful verification for prompt security, cache wiring, and regression safety. The main weaknesses are not vagueness but execution risk from over-specification, some test-design blind spots around real model behavior, and a few places where implementation details are coupled too tightly to current source text or repo shape. Overall, it should achieve the Phase 14 goals if executed carefully, but it needs a small amount of simplification and a few guardrails around brittleness, build behavior, and live-model validation.

### Strengths

- Clear dependency ordering: Wave 0 tests, then generator/static split, then SDK wire-up, then prompt rewrite, then injection battery, then regression close-out.
- Requirements coverage is explicit and mostly complete for `CHAT-03` through `CHAT-09`.
- Strong security posture:
  - Explicit refusal taxonomy
  - Prompt-injection battery
  - Projects/7 exclusion at multiple layers
  - PII minimization by excluding resume text
- Good regression discipline:
  - Preserves Phase 7 transport/security behavior
  - Calls out manual preview-only checks where local tests are insufficient
- Prompt caching plan is technically sound:
  - Correct use of Anthropic array-form `system`
  - Awareness of cache-floor/token minimum and cache-bust pitfalls
- Build-time generator approach matches repo conventions and avoids unnecessary runtime complexity.
- Zero-new-runtime-dependencies constraint is respected.
- The plan understands the product goal: grounded, recruiter-facing, non-generic responses rather than "AI feature for its own sake."

### Concerns

- **HIGH**: The injection tests are mostly contract tests on fixture-authored expected responses, not behavioral tests of the actual endpoint or live model.
  - Proves the refusal copy and banned substrings are defined, but not that the model will consistently obey them under real prompts.
  - The plan acknowledges this, but the practical result is that CI may go green while real behavior still drifts.

- **HIGH**: `14-02` includes `src/prompts/system-prompt.ts` in scope just to extend the interface.
  - Creates cross-plan coupling with `14-04`, raises merge risk, and weakens the "single-responsibility" boundary between generator work and prompt work.
  - If the interface changes again in `14-04`, the split becomes noisy.

- **MEDIUM**: The plan is over-specified down to exact code blocks in many places.
  - Improves consistency, but reduces executor discretion and increases the chance of local mismatch if source files differ slightly.
  - May encourage implementers to satisfy the literal plan text instead of the underlying requirement.

- **MEDIUM**: Source-text regex assertions in `tests/api/chat.test.ts` are brittle.
  - Can fail on harmless refactors or pass while behavior changes indirectly.
  - Useful as a guard, not ideal as the primary proof of SDK request shape.

- **MEDIUM**: Generator parsing of `about.ts` via regex is fragile.
  - Assumes string-literal shape remains simple.
  - A future multiline/template-literal change will hard-fail the build.

- **MEDIUM**: The knowledge block may become quite large, and the plan accepts that without a hard cap.
  - Acceptable at current traffic, but still increases prompt cost, cold-start latency, and potential attention dilution.
  - The soft warning may be too weak if content expands quickly.

- **MEDIUM**: `groundedQA` anchor choices are partly speculative and may not match actual content.
  - If anchors drift from real MDX wording, tests will fail for the wrong reason.
  - Example risk areas: project stack keywords, exact subsystem names, or whether "looking for"/"entry-level" exists literally in generated context.

- **LOW**: The plan mixes verification of build artifact shape with semantic validation of chat knowledge quality.
  - Related, not the same thing.
  - Some tests may create false confidence because "anchor exists in prompt" is much weaker than "answer is grounded."

- **LOW**: The `experience` field synthesis from `about.ts` feels underdefined.
  - Preserves shape for compatibility, but not fully clear whether that field remains meaningful once `about` is added.

### Suggestions

- Add one lightweight endpoint-level unit/integration test around `chat.ts` request construction.
  - Mock `client.messages.create` and assert the actual call payload shape instead of relying primarily on source-text regex.

- Keep `14-02` limited to generator/static split/build-chain work.
  - Move `PortfolioContext` typing to `14-04`, or extract the shared type to a dedicated type file if needed.

- Tighten the live verification requirement for injection resistance.
  - Even if not CI, require a short fixed manual script against preview with 5–10 high-value jailbreak prompts and record outcomes in `14-VERIFICATION.md`.

- Reduce plan brittleness by relaxing some exact-code requirements.
  - Preserve required outcomes and invariants, but allow equivalent implementations where repo realities differ.

- Strengthen generator validation around source mapping.
  - Assert one-to-one mapping between active MDX entries and generated projects.
  - Fail if duplicate `source:` values or duplicate slugs appear.

- Add a more explicit check for deterministic ordering in the generated `projects` array.
  - Matters for cache stability and review diffs.

- Consider making the token budget warning slightly stronger.
  - Not a hard fail, but maybe warn at multiple thresholds and print per-project token contribution, not just words.

- Validate the `groundedQA` dataset directly against actual source files before locking it.
  - Otherwise the tests may encode planning assumptions rather than repo truth.

- Add a minimal fallback plan for generator failure in local dev.
  - Since the generated file is tracked, clarify expected behavior if `build:chat-context` fails after content edits but before commit.

### Risk Assessment

**Overall risk: MEDIUM**

The architecture and sequencing are solid, and the plan is strong enough to deliver the intended phase scope without obvious missing work. The main risk is not "will they build the files?" but "will the verification signal be honest enough?" The current plan is excellent at proving static structure, prompt contents, and build determinism, but weaker at proving real-model behavior under adversarial prompts and content-grounded answers in production-like conditions. With a small increase in endpoint-level testing and a stricter manual live-model verification pass, this would move close to low risk.

---

## Consensus Summary

Only one reviewer (Codex) produced a review this round, so "consensus" collapses to Codex's strongest signals. Treat the HIGH-severity items as the priority feedback to incorporate via `/gsd-plan-phase 14 --reviews`.

### Top Priority (HIGH-severity)

1. **Injection tests are contract tests, not behavioral tests.** Fixture-authored expected responses prove the copy exists, not that the live model obeys it. Add a small manual live-model verification pass against preview (5–10 jailbreak prompts, recorded in `14-VERIFICATION.md`).
2. **`14-02` and `14-04` are coupled via `src/prompts/system-prompt.ts`.** Move `PortfolioContext` typing work out of `14-02` so the generator plan and the prompt-rewrite plan have clean single-responsibility boundaries.

### Secondary (MEDIUM-severity, recurring themes)

- **Brittleness everywhere tied to source-text matching** — `about.ts` regex parsing, `chat.test.ts` regex assertions, `groundedQA` anchor strings. Replace with structural assertions (mock `client.messages.create` payload; validate `groundedQA` against real MDX before locking) and/or relax exact-code over-specification.
- **Knowledge-block size has no hard cap** — warn at multiple thresholds and surface per-project token contributions so content growth stays observable.

### Divergent Views

N/A — single reviewer.

### Note on Missing Reviewers

Gemini was attempted four times across `gemini-3-flash-preview`, `gemini-2.5-pro`, `gemini-2.5-flash`, and `gemini-3-pro-preview`. All returned 429 "capacity exhausted" for the full ~110K-token review prompt. A small test prompt succeeded against the default model, and a half-sized (~60K-token) prompt also succeeded, which indicates Google's free-tier per-minute token budget was the limiter — not content, safety, or CLI syntax. A trimmed 231KB prompt was prepared but abandoned at user request after Codex's review was sufficient to proceed.

---

To incorporate feedback into planning:
  `/gsd-plan-phase 14 --reviews`
