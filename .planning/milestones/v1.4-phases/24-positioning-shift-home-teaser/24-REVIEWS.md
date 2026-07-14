---
phase: 24
reviewers: [codex]
reviewed_at: 2026-07-14T02:34:46Z
plans_reviewed: [24-01-PLAN.md, 24-02-PLAN.md, 24-03-PLAN.md, 24-04-PLAN.md]
reviewer_model: { codex: gpt-5.6-sol }
---

# Cross-AI Plan Review — Phase 24

> **Reviewer availability this run:** Only **codex** (`gpt-5.6-sol`) produced a review.
> - **gemini** — CLI installed but unusable: Google discontinued free-tier Gemini Code Assist auth for individuals (`IneligibleTierError: This client is no longer supported`). No review produced.
> - **claude** — skipped by design (this review runs inside Claude Code; its own CLI is excluded for independence).
>
> With a single reviewer there is no cross-model consensus; treat the findings below as one grounded perspective, not a multi-model agreement. Codex ran agentically inside the working tree and cited `file:line` evidence for each finding.

---

## Codex Review

### Overall Summary

**Verdict: Request changes. Overall risk: HIGH as written.**

The implementation design is sound and appropriately scoped: static content, build-time collection reads, page-scoped CSS, existing JSON-LD serialization, and no new runtime dependencies. However, several verification commands are guaranteed to fail at their task boundaries, one acceptance criterion is mathematically impossible, and the capstone’s working-tree checks cannot prove phase-wide invariants after earlier tasks have been committed. Fixing the plan mechanics should reduce implementation risk to LOW–MEDIUM.

---

## Plan 24-01 — Education Foundation and Wave 0 Gates

### Summary

The education module and proposed render/source gates are good architectural choices, but Plan 24-01 cannot complete cleanly under the repository’s execution workflow because it deliberately leaves automated verification red and incorrectly assumes `ContactSection.astro` is em-dash-free.

### Strengths

- Centralizing education data is consistent with the existing data-module convention used by [`contact.ts`](C:/Users/jackc/Code/portfolio/src/data/contact.ts:1) and gives both visible markup and JSON-LD a common dependency.
- Parsing rendered JSON-LD is the correct testing mechanism. [`JsonLd.astro`](C:/Users/jackc/Code/portfolio/src/components/JsonLd.astro:9) serializes and escapes the schema before placing it in the script at line 17, so `JSON.parse(script.textContent)` tests the real output safely.
- The built-HTML strategy follows a proven pattern: [`featured-tier-render.test.ts`](C:/Users/jackc/Code/portfolio/tests/build/featured-tier-render.test.ts:31) checks for `dist`, parses with `DOMParser`, and asserts actual elements rather than CSS substrings.
- The plan correctly identifies that existing experience voice checks scan only explicitly listed MDX/page files; see [`experience-voice-em-dash.test.ts`](C:/Users/jackc/Code/portfolio/tests/content/experience-voice-em-dash.test.ts:26).

### Concerns

- **HIGH — Gate A will fail for an unplanned reason.** Plan 24-01 says `ContactSection.astro` is already clean and must pass the whole-source em-dash scan ([plan line 104](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-01-PLAN.md:104), [line 111](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-01-PLAN.md:111)). It currently contains U+2014 in comments at [`ContactSection.astro:3`](C:/Users/jackc/Code/portfolio/src/components/ContactSection.astro:3), [`:5`](C:/Users/jackc/Code/portfolio/src/components/ContactSection.astro:5), and [`:9`](C:/Users/jackc/Code/portfolio/src/components/ContactSection.astro:9). Plan 24-02 renumbers comments but never instructs removing these characters.

- **HIGH — Intentionally red `type="auto"` verification conflicts with the executor.** The plan explicitly leaves Gate A and Gates B/C red ([line 35](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-01-PLAN.md:35)) and runs a command expected to exit nonzero ([line 107](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-01-PLAN.md:107)). The execution workflow makes task acceptance a hard gate and requires failures to be fixed before continuing ([execute-plan.md:193](C:/Users/jackc/.codex/gsd-core/workflows/execute-plan.md:193), [`:196`](C:/Users/jackc/.codex/gsd-core/workflows/execute-plan.md:196)).

- **MEDIUM — Gate E does not prove the chat surface is untouched.** It checks only four SEO anchors ([plan line 129](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-01-PLAN.md:129)). Changes to the chat widget, pageswap handler, or client scripts at [`BaseLayout.astro:96`](C:/Users/jackc/Code/portfolio/src/layouts/BaseLayout.astro:96) and [`:130`](C:/Users/jackc/Code/portfolio/src/layouts/BaseLayout.astro:130) would pass Gate E.

- **LOW — The proposed “single source” still duplicates facts internally.** The prescribed schema separately hardcodes WGU and Virginia Tech instead of deriving them from `EDUCATION` ([plan line 77](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-01-PLAN.md:77)). Keeping everything in one file helps, but it does not fully prevent display/schema drift.

### Suggestions

- Move Gate A creation into Plan 24-03 and Gate B/C creation into Plan 24-02, so every task ends green.
- Alternatively, split tests into independently selectable cases and run only assertions satisfied by the current task.
- Remove the existing em dashes from all three `ContactSection.astro` comments, or restrict Gate A to user-facing literals.
- Derive schema fragments from `EDUCATION` and `CREDENTIALS`.
- Replace Gate E with phase-start file hashes or a baseline commit comparison.

### Risk Assessment

**HIGH.** The module itself is low-risk, but the plan cannot meet its current verification contract.

---

## Plan 24-02 — Home Teaser, Numbering, and Metadata

### Summary

The Home implementation is well aligned with existing source patterns, but the first task’s verification necessarily fails until Task 2, and one acceptance command can never return the specified value.

### Strengths

- Reusing [`sortExperienceEntries`](C:/Users/jackc/Code/portfolio/src/lib/experience.ts:12) preserves reverse-chronological ordering without mutating the collection.
- The teaser appropriately mirrors the established featured treatment and reduced-motion behavior in [`experience.astro:51`](C:/Users/jackc/Code/portfolio/src/pages/experience.astro:51) and [`:141`](C:/Users/jackc/Code/portfolio/src/pages/experience.astro:141).
- The plan correctly identifies CONTACT as a literal rather than a `SectionHeader` prop; the current value is at [`ContactSection.astro:28`](C:/Users/jackc/Code/portfolio/src/components/ContactSection.astro:28).
- Extending the inline `personSchema` while retaining `<JsonLd>` correctly uses the existing secure serialization path at [`index.astro:21`](C:/Users/jackc/Code/portfolio/src/pages/index.astro:21) and [`:37`](C:/Users/jackc/Code/portfolio/src/pages/index.astro:37).
- All collection work remains build-time, so there is no client-runtime performance cost.

### Concerns

- **HIGH — Task 1 runs a test file that includes Task 2 requirements.** Task 1 verifies the entire `home-teaser-render.test.ts` ([plan line 71](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-02-PLAN.md:71)), but that file also asserts final numbering and enriched JSON-LD. Those are not implemented until Task 2. The command will exit nonzero after Task 1.

- **HIGH — The occurrence-count acceptance criterion is impossible.** The plan requires `grep -c "sortExperienceEntries"` to return 1 ([line 76](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-02-PLAN.md:76)). The required pattern necessarily contains one import and one call, just like [`experience.astro:6`](C:/Users/jackc/Code/portfolio/src/pages/experience.astro:6) and [`:10`](C:/Users/jackc/Code/portfolio/src/pages/experience.astro:10), producing a count of 2.

- **MEDIUM — The query does not uniquely select Holloway.** The plan uses the first `hasCaseStudy` entry ([line 68](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-02-PLAN.md:68)). The collection schema only defines a boolean and enforces no uniqueness at [`content.config.ts:39`](C:/Users/jackc/Code/portfolio/src/content.config.ts:39). The existing experience page adds an explicit Holloway ID assertion at [`experience.astro:29`](C:/Users/jackc/Code/portfolio/src/pages/experience.astro:29); the Home plan omits it.

- **MEDIUM — Gate B under-tests the concise-teaser contract.** It checks a link and the `1,400` substring but not exactly one highlight, role/company/dates, or absence of the tech stack ([24-01 plan line 129](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-01-PLAN.md:129)).

### Suggestions

- Split the render test into named suites and run only teaser-specific tests after Task 1; run the complete file after Task 2.
- Change the occurrence check to 2 or assert one import plus one invocation explicitly.
- Select by `e.id === "holloway"` and assert `hasCaseStudy`, or copy the existing ID guard.
- Assert exactly one teaser highlight and zero stack elements inside `section[aria-labelledby="section-experience"]`.
- Add an assertion for the rendered `<meta name="description">`.

### Risk Assessment

**HIGH as written; LOW after verification fixes.** The implementation approach itself is straightforward and safe.

---

## Plan 24-03 — About Copy and Education Block

### Summary

This plan correctly uses shared About copy and page-scoped education markup, but its first verification command is again guaranteed to fail, and POS-03 lacks a persistent rendered-output test.

### Strengths

- Revising `about.ts` correctly propagates to both Home and `/about`; the consumers are visible at [`index.astro:12`](C:/Users/jackc/Code/portfolio/src/pages/index.astro:12) and [`about.astro:5`](C:/Users/jackc/Code/portfolio/src/pages/about.astro:5).
- The existing word-count tests genuinely enforce the 80-word limit at [`about-data.test.ts:22`](C:/Users/jackc/Code/portfolio/tests/client/about-data.test.ts:22) and [`:32`](C:/Users/jackc/Code/portfolio/tests/client/about-data.test.ts:32).
- The education divider is based on an existing, design-system-compatible hairline pattern at [`experience.astro:171`](C:/Users/jackc/Code/portfolio/src/pages/experience.astro:171).
- Avoiding `BaseLayout.astro` and `global.css` keeps chat-surface and global-regression risk low.

### Concerns

- **HIGH — Task 1 cannot pass its verification command.** It runs the complete site-copy gate after changing only `about.ts` ([plan line 69](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-03-PLAN.md:69)). At that point, `about.astro` still contains “junior” in its description at [`about.astro:8`](C:/Users/jackc/Code/portfolio/src/pages/about.astro:8), so the suite remains red until Task 2.

- **MEDIUM — POS-03’s visible render is not covered by a regression test.** The plan’s automated command runs only the source-copy gate ([line 97](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-03-PLAN.md:97)); education visibility is merely an acceptance statement at [line 101](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-03-PLAN.md:101). Gate D proves the module exists, not that `/about` renders it.

- **LOW — Register checks are mostly negative.** They prevent prohibited labels but do not prove the positive claims required by POS-01/02: current contract, completed degree, and full-time search.

### Suggestions

- During Task 1, run only `about-data.test.ts` and an `about.ts`-specific copy test; run the complete Gate A after Task 2.
- Add `tests/build/about-education-render.test.ts` asserting all four visible education facts from `dist/client/about/index.html`.
- Add lightweight positive assertions for Holloway/current contract, completed B.S., and seeking a full-time role.
- Snapshot or explicitly assert `ABOUT_P2` if byte-identical preservation is a hard requirement.

### Risk Assessment

**MEDIUM–HIGH.** The code work is low-risk, but task sequencing and visible-output coverage need correction.

---

## Plan 24-04 — OG Card and Capstone

### Summary

The blocking human checkpoint and full build/test gate are appropriate, but the capstone cannot currently prove its “untouched across the phase” claims, and the OG fallback permits Task 1 to finish without its required artifact.

### Strengths

- The asset-only approach is correct: [`BaseLayout.astro:23`](C:/Users/jackc/Code/portfolio/src/layouts/BaseLayout.astro:23) already points to `/og-default.png`, with 1200×630 metadata at [`:73`](C:/Users/jackc/Code/portfolio/src/layouts/BaseLayout.astro:73).
- The capstone runs build, full Vitest suite, and Astro check ([plan line 84](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-04-PLAN.md:84)).
- The cited SSE test genuinely compares headers and frame bytes to fixtures at [`sse-snapshot.test.ts:74`](C:/Users/jackc/Code/portfolio/tests/api/sse-snapshot.test.ts:74) and [`:95`](C:/Users/jackc/Code/portfolio/tests/api/sse-snapshot.test.ts:95).
- Human copy and visual approval is correctly blocking rather than auto-approved ([plan line 98](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-04-PLAN.md:98)).

### Concerns

- **HIGH — Working-tree checks cannot prove phase-wide invariants after commits.** The capstone uses `git diff --name-only` and `git status --porcelain` ([lines 81–90](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-04-PLAN.md:81)). The GSD executor commits tasks before later plans run ([execute-plan.md:191](C:/Users/jackc/.codex/gsd-core/workflows/execute-plan.md:191)). Therefore an accidental BaseLayout, global CSS, chat-context, or dependency edit committed in Plans 01–03 will appear clean in Plan 04.

- **HIGH — The OG fallback contradicts completion criteria.** Task 1 permits producing only a design spec if deterministic rendering is unavailable ([line 59](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-04-PLAN.md:59)), while acceptance and `<done>` require the real PNG ([lines 65–69](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-04-PLAN.md:65)). The human checkpoint asks Jack to confirm the file, not create it.

- **MEDIUM — The dimension check does not distinguish the placeholder.** The current [`og-default.png`](C:/Users/jackc/Code/portfolio/public/og-default.png) is already 1200×630, so the automated command at [line 62](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-04-PLAN.md:62) passes before any work.

- **MEDIUM — Google Rich Results Test is the wrong primary validator for standalone `Person`.** Google documents that the Rich Results Test checks supported rich-result eligibility and recommends the Schema Markup Validator for generic Schema.org validation. Google’s supported profile feature expects `ProfilePage` with `Person` as `mainEntity`, while this site emits a standalone `Person`. Use the [Schema Markup Validator guidance](https://developers.google.com/search/docs/appearance/structured-data) unless the phase intentionally adopts [`ProfilePage`](https://developers.google.com/search/docs/appearance/structured-data/profile-page).

- **MEDIUM — Visual verification lacks concrete viewports and interaction checks.** The UI spec requires 375px and 1440px, mobile overflow verification, focus behavior, and reduced motion at [`24-UI-SPEC.md:99`](C:/Users/jackc/Code/portfolio/.planning/phases/24-positioning-shift-home-teaser/24-UI-SPEC.md:99), but the checkpoint only asks for a general six-pillar sign-off.

### Suggestions

- Capture a phase-start commit SHA or hashes for all protected files in Plan 24-01. In Plan 24-04, compare `<phase-base>..HEAD`, not only the working tree.
- Record and compare the phase-start `dependencies` object and chat-context file hashes.
- Choose and preflight one deterministic PNG production path; fail closed if unavailable.
- Add PNG signature, maximum file-size, and phase-start hash-difference checks.
- Replace the standalone-Person Rich Results step with Schema Markup Validator; retain Rich Results only if `ProfilePage` is intentionally added.
- Require screenshots at 375px and 1440px plus keyboard-focus, reduced-motion, and horizontal-overflow checks.

### Risk Assessment

**HIGH.** The final gate currently overstates what it proves, and the asset task has an unresolved production-path contradiction.

---

## Priority Fixes Before Execution

1. Restructure task-level tests so every `<verify>` command exits 0 at that task boundary.
2. Fix the `ContactSection.astro` em-dash assumption.
3. Correct the impossible `sortExperienceEntries` count.
4. Add a phase-start baseline for protected-file and dependency comparisons.
5. Make OG generation fail closed with an explicit production mechanism.
6. Add rendered `/about` education coverage and use Schema Markup Validator for the standalone `Person` schema.

---

## Consensus Summary

Only one reviewer (codex) was available, so this is a single-reviewer synthesis rather than a cross-model consensus. Codex's overall verdict is **request changes / HIGH risk as written**, but the risk is concentrated in *plan mechanics* (verification-command sequencing and gate design), not in the implementation design itself — which it rated sound and appropriately scoped (static content, build-time collection reads, page-scoped CSS, existing JSON-LD serialization, no new runtime deps).

### Agreed Strengths
_(single reviewer — codex-attributed)_
- Centralizing education facts in one data module (`src/data/education.ts`) matches the existing `contact.ts` convention and gives markup + JSON-LD a shared source.
- Testing via parsed rendered JSON-LD (`JSON.parse(script.textContent)`) and parsed built HTML (`DOMParser` over `dist/`) follows proven repo patterns, not brittle CSS-substring checks.
- Metadata enrichment reuses the existing secure `<JsonLd>` serialization path rather than hand-rolling escaping.
- Human copy + visual sign-off on the capstone is correctly blocking, not auto-approved.

### Top Concerns (highest priority first)
1. **HIGH — Task-boundary verification commands are guaranteed to fail.** Multiple plans run a full test file (or full gate) at the end of Task 1 when that file also asserts Task 2 behavior — so `<verify>` exits nonzero at a task boundary the executor treats as a hard gate (24-01 Gate A/B/C left intentionally red; 24-02 Task 1 runs the full `home-teaser-render.test.ts`; 24-03 Task 1 runs the full site-copy gate while `about.astro` still says "junior").
2. **HIGH — Impossible acceptance criterion.** 24-02 requires `grep -c "sortExperienceEntries"` to return `1`, but the import + the call necessarily produce `2` (mirrors `experience.astro:6` and `:10`).
3. **HIGH — `ContactSection.astro` em-dash assumption is wrong.** 24-01 assumes the file is em-dash-clean, but U+2014 exists in its comments at lines 3, 5, 9; 24-02 renumbers those comments but never strips the characters, so Gate A fails for an unplanned reason. *(This directly matches the known [[project_voice_gate_scope_gap]] risk.)*
4. **HIGH — Capstone working-tree checks cannot prove phase-wide invariants.** 24-04 uses `git diff --name-only` / `git status --porcelain`, but the executor commits each task before later plans run, so an accidental BaseLayout / global-CSS / chat-context / dependency edit committed in plans 01–03 reads as clean in 04. Needs a phase-start baseline SHA/hashes compared `<phase-base>..HEAD`.
5. **HIGH — OG asset production path is contradictory.** 24-04 Task 1 permits shipping only a design spec if deterministic rendering is unavailable, while acceptance + `<done>` require the real 1200×630 PNG; the human checkpoint asks Jack to *confirm* the file, not create it. Pick one deterministic production path and fail closed.
6. **MEDIUM — Coverage gaps:** Holloway teaser query selects "first `hasCaseStudy`" with no ID guard (add `id === "holloway"`); POS-03 education visibility has no rendered-output regression test; Gate E / dimension checks are weak (SEO-anchor-only chat tripwire; OG dimension check already passes on the placeholder); Google Rich Results Test is the wrong validator for a standalone `Person` (use Schema Markup Validator unless adopting `ProfilePage`).

### Priority Fixes Before Execution (codex)
1. Restructure task-level tests so every `<verify>` exits 0 at its task boundary.
2. Fix the `ContactSection.astro` em-dash assumption (strip U+2014 from the 3 comments, or scope Gate A to user-facing literals).
3. Correct the impossible `sortExperienceEntries` count (expect 2, or assert import + invocation separately).
4. Add a phase-start baseline for protected-file + dependency comparison in the capstone.
5. Make OG generation fail closed with one explicit production mechanism.
6. Add rendered `/about` education coverage; use Schema Markup Validator for the standalone `Person`.

### Divergent Views
None — only one reviewer available this run. To get true adversarial cross-model coverage, add a second independent CLI (e.g. re-auth gemini via the Antigravity migration, or install `codex`-independent `opencode`/`qwen`) and re-run `/gsd-review --phase 24`.
