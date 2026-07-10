---
phase: 23
reviewers: [codex]
reviewed_at: 2026-07-10T12:26:49Z
plans_reviewed: [23-01-PLAN.md, 23-02-PLAN.md, 23-03-PLAN.md, 23-04-PLAN.md]
attempted_but_unavailable:
  - reviewer: gemini
    reason: "IneligibleTierError — Gemini Code Assist free tier no longer supported for this CLI client (migrate-to-Antigravity notice); auth failed, empty output."
  - reviewer: claude
    reason: "Skipped for independence — this review runs inside the Claude Code CLI (SELF_CLI=claude)."
---

# Cross-AI Plan Review — Phase 23

**Reviewers invoked:** Codex (codex-cli 0.142.2, source-grounded against the live working tree).
**Unavailable:** Gemini (free-tier client no longer supported — auth error), Claude (skipped as the executing CLI, per the independence rule).

> Single-reviewer run. To compensate, the two highest-value Codex concerns were independently re-verified against source by the orchestrator; verification notes are inline below and in the Consensus Summary.

---

## Gemini Review

_Not available._ The Gemini CLI failed to authenticate: `IneligibleTierError: This client is no longer supported for Gemini Code Assist for individuals` (the free tier now routes to the Antigravity suite). No review was produced. Install/authorize an eligible Gemini client, or add another external CLI (`codex` alone ran this pass), to restore a second independent perspective.

---

## Codex Review

**Summary**

Overall, the phase plan is technically sound and well sequenced. The main architecture is correct: add #7 to site content, skip it from chat, reuse `featured`/`order`, and extend `WorkRow` rather than inventing a new listing system. The biggest fixes before execution are test-related: one verify command points at a non-existent `tests/motion` path, and the word-count gate is described as enforcing 600+ words even though the current test only warns.

**23-01 Review**

Strengths:
- Correctly identifies the D-15 landmine. `build-chat-context.mjs` hard-fails on missing `chatSummary` at `scripts/build-chat-context.mjs:389` and on `MULTI-DEX` sources at `scripts/build-chat-context.mjs:457`; `pnpm build` runs this first at `package.json:13`.
- The top-of-loop slug skip is the right mechanism because it bypasses both hard-fails before `buildProjectBlock()` at `scripts/build-chat-context.mjs:476`.
- Sync assumptions are accurate: `sync-projects.mjs` reads `source:` at `scripts/sync-projects.mjs:151`, extracts the fence at `scripts/sync-projects.mjs:179`, preserves frontmatter at `scripts/sync-projects.mjs:182`, and only visits existing MDX files at `scripts/sync-projects.mjs:203`.

Concerns:
- LOW: The header comment will become stale if not updated. It currently says Projects/7 is excluded because unreferenced sources are ignored at `scripts/build-chat-context.mjs:11-13`, but after #7 MDX exists the exclusion is the explicit slug skip.
- LOW: Be precise that the zero-em-dash requirement applies to the new fenced case-study body. The existing below-fence README already contains em dashes, for example `Projects/7 - MULTI-DEX CRYPTO TRADER.md:16`, and the plan also says to leave that README verbatim.

Suggestions:
- Make the comment update non-optional in Task 1.
- Add an acceptance check that `src/data/portfolio-context.json` has no diff after `pnpm build:chat-context:check`.

Risk Assessment: LOW-MEDIUM. The sequencing is strong; risk is mostly content authoring and generated-artifact drift.

**23-02 Review**

Strengths:
- The right site-side arrays are targeted. Current hard-coded arrays are visible in `tests/content/case-studies-have-content.test.ts:5`, `case-studies-shape.test.ts:5`, `case-studies-wordcount.test.ts:5`, `voice-banlist.test.ts:5`, `voice-em-dash.test.ts:5`, and `tests/build/no-mdx-in-worker-bundle.test.ts:48`.
- Correctly leaves chat-side pins unchanged: chat still expects 6 slugs at `tests/build/chat-context-integrity.test.ts:17-24` and rejects #7 terms at `tests/build/chat-context-integrity.test.ts:26-31`.

Concerns:
- MEDIUM: The plan says the word-count gate asserts `>=600` words, but the test only logs a warning and always passes: `tests/content/case-studies-wordcount.test.ts:41-46`. A 300-word #7 case study would still pass this gate.
- LOW: The no-MDX-in-worker test needs a fresh `dist/`; the test itself asserts `dist/` exists at `tests/build/no-mdx-in-worker-bundle.test.ts:78-80`, so deferring it to Plan 04 is fine, but Plan 02 should avoid implying that leak prevention is already verified.

Suggestions:
- Either strengthen `case-studies-wordcount.test.ts` to fail below 600 for all projects, or change plan language to "reports word count; human/sign-off enforces 600-900."
- Keep no-MDX wording as "array updated, validated in Plan 04."

Risk Assessment: MEDIUM because one claimed automated gate does not actually enforce the stated invariant.

**23-03 Review**

Strengths:
- The UI change is well scoped. Current `/projects` is a flat sorted list at `src/pages/projects.astro:8-31`; Home already filters `featured` at `src/pages/index.astro:14-18`.
- Extending `WorkRow` is the right reuse path. The primitive is simple and scoped at `src/components/primitives/WorkRow.astro:20-41`, with motion/focus styles at `src/components/primitives/WorkRow.astro:83-124`.
- The divider precedent is real: Experience uses the label + hairline pattern at `src/pages/experience.astro:72-75` and styles it at `src/pages/experience.astro:172-188`.

Concerns:
- MEDIUM: `pnpm exec vitest run tests/motion` is not a valid repo path. Existing motion/focus tests live under files like `tests/build/work-arrow-motion.test.ts:19-47`, `tests/build/motion-css-rules.test.ts:18-42`, and `tests/client/focus-visible.test.ts:62-77`.
- LOW: The "See all work" arrow reveal needs explicit markup. Existing `.read-more` is just text plus `&rarr;` with a color hover at `src/pages/index.astro:81` and `src/pages/index.astro:106-107`; the reveal pattern needs a span like the Experience deep link at `src/pages/experience.astro:65-67` and `src/pages/experience.astro:150-163`.
- LOW: The proposed render test should count elements, not raw string occurrences of `work-tagline`, because component-scoped styles live alongside markup in Astro components, as seen in `WorkRow.astro:43-125`.

Suggestions:
- Replace `tests/motion` with explicit files: `tests/build/work-arrow-motion.test.ts tests/build/motion-css-rules.test.ts tests/client/focus-visible.test.ts`.
- In the render test, match `class="...work-tagline..."` or parse HTML with a lightweight DOM approach already available in the test environment.

Risk Assessment: MEDIUM. The UI approach is good, but one verify command is currently wrong.

**23-04 Review**

Strengths:
- The full gate is appropriate. `pnpm build` exercises chat-context, Wrangler types, Astro check, and Astro build at `package.json:13`; `pnpm test` runs the full Vitest suite at `package.json:22`.
- Running build before no-MDX/render tests is correct because the no-MDX test explicitly depends on `dist/` at `tests/build/no-mdx-in-worker-bundle.test.ts:25-27`.

Concerns:
- MEDIUM: Plan 04 says it writes no source, but `pnpm build` runs `build:chat-context` in write mode. The script writes `src/data/portfolio-context.json` when drift exists at `scripts/build-chat-context.mjs:601-614`. Running `build:chat-context:check` after that can mask drift.
- LOW: The dependency-lock check needs a concrete command and should include `pnpm-lock.yaml`, not just `package.json`.

Suggestions:
- Run `pnpm build:chat-context:check` before `pnpm build`, or run `git diff -- src/data/portfolio-context.json` after build.
- Add `git diff -- package.json pnpm-lock.yaml` to the QA-02 dependency check.

Risk Assessment: LOW-MEDIUM. Good capstone gate, but generated-output drift should be checked before or after build explicitly.

**Overall Risk**

MEDIUM. The implementation plan achieves the phase goals, and the risky chat exclusion is handled correctly. Fix the invalid motion test command, clarify or strengthen the word-count gate, and guard against `pnpm build` silently rewriting generated chat context.

---

## Consensus Summary

Only one grounded reviewer (Codex) ran this pass — Gemini's client is deauthorized and Claude is the executing CLI, so there is no second independent vote to form true consensus. To compensate, the orchestrator re-verified Codex's two most actionable concerns directly against source; both **CONFIRMED** (see below). Treat the two CONFIRMED items as must-fix before execution; treat the LOW items as polish.

### Verified Concerns (orchestrator-confirmed against live source)

1. **[CONFIRMED · MEDIUM] `tests/motion` is not a real path (Plan 23-03, Task 1 verify).** `ls tests/motion` → *No such file or directory*. Motion/focus tests live at `tests/build/motion-css-rules.test.ts`, `tests/build/work-arrow-motion.test.ts`, `tests/build/motion.test.ts`, `tests/build/reduced-motion.test.ts`, and `tests/client/focus-visible.test.ts`. `pnpm exec vitest run tests/motion` matches zero files and exits green as a **no-op** — the WorkRow byte-identical / motion-preservation guarantee would go unverified. **Fix:** replace with explicit files, e.g. `pnpm exec vitest run tests/build/work-arrow-motion.test.ts tests/build/motion-css-rules.test.ts tests/client/focus-visible.test.ts`. (This same `tests/motion` string appears in Plan 23-03's `<verification>` block too — fix both occurrences.)

2. **[CONFIRMED · MEDIUM] The 600-word floor is NOT automatically enforced (Plan 23-02, Task 1).** `tests/content/case-studies-wordcount.test.ts` ends every case in `expect(true).toBe(true)` and only `console.warn`s when outside the 600–900 band (the test title literally reads "soft warn only per D-16"). A sub-600-word #7 body passes. Plan 23-02's acceptance criterion "wordcount asserts the body is at least 600 words. If any fails…" overstates the gate; 23-RESEARCH.md Priority 4 carries the same overstatement (`MIN_WORDS = 600, so #7 must be ≥600w`). The real enforcement of the 600–900 floor is the **human sign-off in Plan 23-04 (D-02)**, not an automated gate. **Fix:** either (a) change 23-02 language to "reports word count; the 600–900 floor is enforced by the Plan 04 human sign-off," or (b) if an automated floor is wanted, strengthen the test to fail below 600 — but note that would be a behavior change beyond D-16's stated "soft warn" intent, so option (a) is the lower-risk reconciliation.

### Agreed Strengths (single reviewer; high-confidence, source-cited)

- **The D-15 chat-exclusion landmine is handled correctly.** The top-of-loop slug skip neutralizes both hard-fails (`chatSummary` at `build-chat-context.mjs:389`, MULTI-DEX guard at `:457`) before `buildProjectBlock()`, and `build:chat-context` running first in `package.json:13` is correctly understood as the reason sequencing matters.
- **Reuse over invention is the right call throughout** — extend `WorkRow` (not a new `FeaturedRow`), reuse the existing `featured`/`order` schema, reuse the `experience.astro` label+hairline divider idiom, reuse the sync pipeline unchanged.
- **The site-side vs chat-side test split is exhaustively and correctly targeted** — the six site-side arrays gain `multi-chain-evm`; the chat-side pins are deliberately left green at 6.

### Divergent Views / Open Items for the planner

- **[LOW] Plan 04 "writes no source" vs. `pnpm build` rewriting `portfolio-context.json`.** Codex flags that `pnpm build` runs `build:chat-context` in write mode, so running `build:chat-context:check` *after* the build could mask drift. Note: the phase design intends `portfolio-context.json` to re-emit **byte-identical** (the skip changes nothing about the 6 emitted projects), so in the happy path there is no drift to mask. The concern is still worth a cheap guard — run `build:chat-context:check` *before* `pnpm build`, or add `git diff --exit-code -- src/data/portfolio-context.json` after the build — so a regression can't slip through silently.
- **[LOW] QA-02 dependency lock should assert on `pnpm-lock.yaml` too, not just `package.json`** — add `git diff --exit-code -- package.json pnpm-lock.yaml` as the concrete no-new-dep check in Plan 23-04.
- **[LOW] Stale header comment in `build-chat-context.mjs` (lines 6–16/11–13)** — Plan 23-01 currently makes the refresh optional ("non-blocking hygiene"); Codex recommends making it non-optional so the comment doesn't misdescribe the exclusion mechanism after #7's MDX exists. Planner discretion.
- **[LOW] Render-gate robustness (Plan 23-03)** — count rendered `class="...work-tagline..."` elements rather than raw substring occurrences of `work-tagline`, so the assertion can't be satisfied by the scoped-style block instead of markup.

### Bottom line

Overall risk **MEDIUM**, driven entirely by the two CONFIRMED test-fidelity gaps, not by the architecture (which is sound and the risky chat exclusion is correct). Before execution, fix the `tests/motion` path (23-03) and reconcile the word-count-gate language (23-02); fold the LOW items in as polish.
