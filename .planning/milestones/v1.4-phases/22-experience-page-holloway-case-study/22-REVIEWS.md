---
phase: 22
reviewers: [codex]
attempted_reviewers: [gemini, codex]
skipped_reviewers: [claude]
reviewed_at: 2026-07-09T15:29:28Z
plans_reviewed: [22-01-PLAN.md, 22-02-PLAN.md, 22-03-PLAN.md, 22-04-PLAN.md, 22-05-PLAN.md]
---

# Cross-AI Plan Review — Phase 22

> **Reviewer availability (this run):** Requested `--all`. Detected CLIs: `gemini`, `claude`, `codex`.
> - **Codex** (`gpt-5` default) — completed, source-grounded review below.
> - **Gemini** — hard-failed at auth. `gemini-cli` 0.36.0 returns `IneligibleTierError: This client is no longer supported for Gemini Code Assist for individuals` (Google deprecated the free-tier client, directs users to migrate to the Antigravity suite). No review produced. Not fixable from this workflow — the CLI itself can no longer authenticate.
> - **Claude** — skipped for independence (the review ran inside Claude Code; `CLAUDE_CODE_ENTRYPOINT=cli`).
>
> **Net: one independent reviewer succeeded (Codex).** A true multi-reviewer consensus is not available. The Consensus section below is therefore based on the single Codex review plus an independent verification pass by the orchestrator on the highest-severity finding.

## Codex Review

**Overall Summary**
The plans are directionally strong: they reuse the existing Projects surface, honor the Phase 21 collection contract, avoid new dependencies, and put the risky shared-layout changes behind tests and a full gate. Overall risk is **MEDIUM**, mainly because a few validation claims are source-shape-only, the final build-output path is wrong for this Cloudflare setup, and the Holloway body contains Markdown structures the copied project prose CSS does not style.

### 22-01-PLAN.md

**Summary**
Good tests-first plan, aligned with existing repo idioms, but the planned tests are mostly source-shape checks and can false-green on some real rendering failures.

**Strengths**
- Mirrors existing file-read/frontmatter test patterns from `tests/content/case-studies-shape.test.ts:29` and `tests/content/projects-collection.test.ts:17`.
- Correctly encodes current RED states: nav lacks `/experience` in `src/components/primitives/Header.astro:23` and `src/components/primitives/MobileMenu.astro:38`; Holloway still says `"The Holloway Company"` in `src/content/experience/holloway.mdx:3`.
- Creating a separate experience em-dash guard avoids disturbing the locked project guard in `tests/content/voice-em-dash.test.ts:24`.

**Concerns**
- **MEDIUM:** The summary/detail tests assert source strings, not rendered output. A page could contain `sortExperienceEntries` and a `/experience/` string but still omit highlights, render Balfour as a link, or include only one back link.
- **LOW:** The highlights-count test will depend on current YAML formatting. Holloway's current `highlights` array is multiline flow style in `src/content/experience/holloway.mdx:19`, so regex parsing should be written carefully.

**Suggestions**
- Add build-output HTML assertions in 22-05 for "all 5 highlights visible," "no `/experience/balfour-beatty` link," and "two back links."
- Make the detail source test count two `href="/experience"` occurrences, not just one.

**Risk Assessment**
**MEDIUM.** The tests are useful guards, but not sufficient proof of the user-visible contract.

### 22-02-PLAN.md

**Summary**
The nav edit is correctly scoped and matches the current architecture, but the added fourth nav item invalidates some existing breakpoint assumptions.

**Strengths**
- Correctly targets both shared nav primitives: desktop nav in `src/components/primitives/Header.astro:23` and mobile nav in `src/components/primitives/MobileMenu.astro:38`.
- Active-state plan mirrors the existing `/projects` branch in `Header.astro:29` and `MobileMenu.astro:52`.
- Leaving MobileMenu's focus/inert script untouched is right; it manages `.chat-widget` inert state at `MobileMenu.astro:261`.

**Concerns**
- **MEDIUM:** The existing design contract assumes three nav links. MASTER says nav links are exactly `works`, `about`, `contact` at `design-system/MASTER.md:324`, and the 380px hamburger rationale is based on three links at `design-system/MASTER.md:637`. Adding `experience` may create cramped intermediate widths if CSS is untouched.

**Suggestions**
- Keep the no-CSS edit, but add explicit visual verification at 768px and 1024px, not just "desktop" and "mobile."
- Update stale comments/docs after the nav change so future agents do not rely on the old three-link assumption.

**Risk Assessment**
**MEDIUM.** Implementation risk is low, responsive polish risk is real.

### 22-03-PLAN.md

**Summary**
The listing page plan uses the right data model and ordering helper, but needs an explicit invariant guard and a cleanup of the UI spec copy mismatch.

**Strengths**
- Correctly uses the Phase 21 helper; `sortExperienceEntries` returns a new reverse-chron array at `src/lib/experience.ts:12`.
- D-08 is safe as described: the sync script preserves frontmatter and only replaces body content, shown at `scripts/sync-experience.mjs:127` and `scripts/sync-experience.mjs:170`.
- Schema supports the intended asymmetry: Balfour can have empty `techStack` at `src/content.config.ts:34`, and `hasCaseStudy` is a first-class field at `src/content.config.ts:38`.

**Concerns**
- **MEDIUM:** `entries.find((e) => e.data.hasCaseStudy)` is typed as possibly undefined under strict TS; the repo extends `astro/tsconfigs/strict` in `tsconfig.json:2`. Add `if (!holloway) throw new Error(...)`.
- **LOW:** The UI spec still contains an em dash in the meta description at `.planning/phases/22-experience-page-holloway-case-study/22-UI-SPEC.md:103`, while the plan correctly says to use an en dash. That inconsistency should be fixed before execution.

**Suggestions**
- Add explicit guards for missing `holloway` and optionally unexpected `earlier.length === 0`.
- Extend validation to assert the listing source or built HTML does not contain `/experience/balfour-beatty`.

**Risk Assessment**
**MEDIUM.** Data plumbing is sound, but strict TS and shallow assertions could slow execution.

### 22-04-PLAN.md

**Summary**
The dynamic route plan correctly mirrors `projects/[id].astro`, but copying the prose CSS verbatim is not enough for Holloway's actual MDX body.

**Strengths**
- The existing project detail route is a strong analog: `getStaticPaths`, `render()`, `Content`, and sentinels are established in `src/pages/projects/[id].astro:8`.
- Scroll-depth wiring is correctly DOM-gated by `.scroll-sentinel` in `src/scripts/scroll-depth.ts:64`, so no new JS is needed.
- Excluding Balfour through `hasCaseStudy` matches the content: Holloway is true at `src/content/experience/holloway.mdx:28`, Balfour is false at `src/content/experience/balfour-beatty.mdx:16`.

**Concerns**
- **MEDIUM:** Holloway uses a blockquote, horizontal rules, and `###` headings in `src/content/experience/holloway.mdx:32`, `:42`, and `:46`. The project prose CSS only styles h2/p/lists/a/code/pre in `src/pages/projects/[id].astro:145`. Those elements will fall back to browser defaults.
- **MEDIUM:** If the implementation renames header classes to `experience-*`, the copied project CSS will not apply. Existing styles target `.project-meta`, `.project-title`, and `.project-tagline` at `src/pages/projects/[id].astro:110`.

**Suggestions**
- Add page-scoped `:global(blockquote)`, `:global(h3)`, and `:global(hr)` styles.
- Either reuse the `.project-*` class names intentionally or rename the copied selectors to match new `experience-*` classes.

**Risk Assessment**
**MEDIUM.** Functional route risk is low; visual/readability risk is material.

### 22-05-PLAN.md

**Summary**
The capstone gate is well chosen, but its route-output check points at the wrong build directory.

**Strengths**
- Full gate covers the right commands: `pnpm build` already runs chat-context build, Wrangler types, Astro check, and Astro build via `package.json:13`.
- Running the full Vitest suite is the right way to catch D-26 chat regressions; BaseLayout includes Header, MobileMenu, and ChatWidget site-wide at `src/layouts/BaseLayout.astro:123`.
- Human sign-off is appropriate because the asymmetric "Earlier" treatment is not fully machine-verifiable.

**Concerns**
- **HIGH:** The plan checks `dist/experience/...`, but this Worker serves static assets from `./dist/client` per `wrangler.jsonc:7`. A correct build will emit under `dist/client/experience/...`, making the gate falsely fail.
- **LOW:** Dependency lock verification via `git diff --stat` is less strict than `git diff --exit-code -- package.json pnpm-lock.yaml`.

**Suggestions**
- Change route checks to `dist/client/experience/index.html`, `dist/client/experience/holloway/index.html`, and absence of `dist/client/experience/balfour-beatty`.
- Add visual verification at intermediate nav widths because the nav now has four items.

**Risk Assessment**
**MEDIUM-HIGH until the output path is fixed; LOW-MEDIUM after that.** The gate set is right, but the current path assertion can block a valid implementation.

---

## Gemini Review

_Not produced._ `gemini-cli` 0.36.0 failed authentication with `IneligibleTierError: This client is no longer supported for Gemini Code Assist for individuals` (free-tier client deprecated by Google; migration to the Antigravity suite required). No content to include.

---

## Claude Review

_Skipped for independence._ This review executed inside Claude Code, so `claude` is excluded per the cross-AI review protocol (a model must not peer-review itself). Use `--claude` from a non-Claude runtime (or run `/gsd-review` from Codex/Gemini) if a Claude perspective is wanted.

---

## Consensus Summary

Only one independent reviewer (Codex) succeeded this run, so there is no cross-reviewer agreement to synthesize. Treat the items below as **single-reviewer findings**, with one exception: the orchestrator independently verified the HIGH finding against the live repo and **confirms it**.

The plans are sound in shape — reuse of the Projects surface, no new dependencies, tests-first ordering, and a full regression gate on the shared-layout changes. The risk is concentrated in a handful of concrete, fixable gaps rather than in the overall architecture.

### Confirmed (orchestrator-verified)

- **HIGH — 22-05 phase gate checks the wrong build directory.** `wrangler.jsonc:9` sets `assets.directory` to `./dist/client`, and the Cloudflare adapter emits static HTML there (existing pages build to `dist/client/projects/`, `dist/client/about/`, etc.). But `22-05-PLAN.md:55` asserts `dist/experience/index.html` and `dist/experience/holloway/index.html`. Those paths will not exist after a correct build, so the gate would falsely fail and block a valid implementation. **Fix:** point the route checks at `dist/client/experience/index.html`, `dist/client/experience/holloway/index.html`, and absence of `dist/client/experience/balfour-beatty`.

### Highest-priority findings (single reviewer, not independently verified)

1. **MEDIUM — Prose CSS gap in the Holloway detail view (22-04).** Holloway's MDX body uses a blockquote, `---` rules, and `###` headings, but the copied project prose CSS only styles h2/p/lists/a/code/pre. Those elements would render with unstyled browser defaults. Add page-scoped `:global(blockquote)`, `:global(h3)`, `:global(hr)` styles (or trim the MDX to the styled element set).
2. **MEDIUM — Class-name coupling risk (22-04).** The copied header CSS targets `.project-meta` / `.project-title` / `.project-tagline`. If the executor renames them to `experience-*`, the styles silently stop applying. Decide explicitly: reuse the `.project-*` names or rename both selectors and markup together.
3. **MEDIUM — Strict-TS undefined guard (22-03).** `entries.find((e) => e.data.hasCaseStudy)` is `T | undefined` under `astro/tsconfigs/strict`. Add `if (!holloway) throw new Error(...)` before use.
4. **MEDIUM — Four-item nav vs three-link design contract (22-02).** `design-system/MASTER.md:324` / `:637` document nav as exactly three links, with the 380px hamburger rationale built on three. Adding `experience` with no CSS change risks cramped intermediate widths. Add explicit visual verification at 768px and 1024px, and refresh the stale three-link docs/comments.
5. **MEDIUM — Source-shape tests can false-green (22-01).** The summary/detail tests assert source strings, not rendered output; a page could satisfy them while still omitting highlights, linking Balfour, or shipping only one back link. Back them with build-output HTML assertions in 22-05.

### Lower-priority / cleanup

- **LOW — Em-dash inconsistency:** `22-UI-SPEC.md:103` still contains an em dash in the meta description while the plan mandates an en dash. Fix the spec before execution (aligns with the site-wide zero-em-dash rule).
- **LOW — Stricter dep-lock check:** replace `git diff --stat package.json pnpm-lock.yaml` with `git diff --exit-code -- package.json pnpm-lock.yaml` for a hard QA-02 gate.
- **LOW — Highlights-count regex:** Holloway's `highlights` is multiline flow YAML; write the count assertion to tolerate that formatting.

### Divergent Views

None — only one reviewer produced output. A second independent perspective (Gemini via a working auth, or Claude/Codex run from a non-Claude runtime) would strengthen confidence on the five unverified MEDIUM items above.
