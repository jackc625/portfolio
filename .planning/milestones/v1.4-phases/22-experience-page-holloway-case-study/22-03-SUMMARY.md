---
phase: 22-experience-page-holloway-case-study
plan: 03
subsystem: experience-surface
tags: [astro, content-collections, experience, listing-page, frontend-design]
requires:
  - "src/lib/experience.ts::sortExperienceEntries (Phase 21)"
  - "experience content collection (holloway.mdx, balfour-beatty.mdx)"
provides:
  - "GET /experience — asymmetric two-tier listing route (EXP-02)"
  - "Holloway deep-dive link target /experience/holloway (consumed by 22-04)"
  - "company frontmatter normalized to 'Holloway Company' (D-08, single-source for 22-04 H1)"
affects:
  - "22-04 (detail page reads normalized company + is linked from this listing)"
  - "22-05 (visual sign-off checkpoint + built-HTML no-balfour-link / no-em-dash gates)"
tech-stack:
  added: []
  patterns:
    - "sortExperienceEntries(await getCollection('experience')) for reverse-chron order (no inline .sort())"
    - "strict-TS .find(hasCaseStudy) narrowed via explicit if (!holloway) throw guard"
    - "page-scoped <style>, six design tokens only; global.css untouched"
key-files:
  created:
    - src/pages/experience.astro
  modified:
    - src/content/experience/holloway.mdx
decisions:
  - "Two tiers differentiated by TYPE REGISTER not decoration: Holloway = display heading + mono eyebrow + tech line + .lead + highlight ledger + accent CTA; Balfour = all-mono/muted, no accent, no link"
  - "Highlights rendered as a hairline (1px --rule) 'ledger', NOT numbered — parallel accomplishments, not a ranked sequence"
  - "'EARLIER' cue = label-on-rule divider (.label-mono --ink-faint + trailing hairline)"
  - "Deep-dive link uses static href='/experience/holloway' (Wave-0 test regex requires a quote adjacent to href=; template-literal form cannot satisfy it) + a build-time id-invariant guard"
metrics:
  duration: "~9 min"
  completed: 2026-07-09
  tasks: 2
  files_changed: 2
status: complete
---

# Phase 22 Plan 03: Experience Listing Page (Asymmetric Two-Tier) Summary

Built the reachable `/experience` route as a D-04 asymmetric two-tier page — Holloway as a rich 30-second recruiter payload (meta · first-person summary · all 5 highlights · accent deep-dive link) and Balfour as a lighter non-linked "Earlier" entry — and normalized the Holloway `company` frontmatter to "Holloway Company" (D-08). Turns `tests/content/experience-summary.test.ts` GREEN; keeps `experience-voice-em-dash.test.ts` green.

## What Shipped

- **`src/content/experience/holloway.mdx`** (Task 1): `company` frontmatter normalized `"The Holloway Company"` → `"Holloway Company"` (D-08). Frontmatter-only edit; MDX body untouched — sync drift gate exits 0 (Pitfall 1: `sync-experience.mjs` diffs body only).
- **`src/pages/experience.astro`** (Task 2, 234 lines): new SSG listing route mirroring `projects.astro`'s BaseLayout → section → Container shell.
  - `const entries = sortExperienceEntries(await getCollection("experience"))` (reverse-chron by startDate desc; no inline `.sort()`).
  - `const holloway = entries.find((e) => e.data.hasCaseStudy)` immediately followed by `if (!holloway) throw` (strict-TS `T | undefined` narrowing + collection-invariant guard, REVIEWS 22-03); parallel `if (earlier.length === 0) throw`.
  - Holloway tier: mono eyebrow (role · dateRange), `.h2-project` "Holloway Company" heading, uppercase mono tech line, `.lead` first-person summary, all 5 highlights as a hairline ledger, and a `.label-mono` "Read the full case study →" link to `/experience/holloway` (accent hover + 120ms arrow reveal).
  - Balfour tier: quiet "EARLIER" label-on-rule divider, then role · company · dateRange + its 2 highlights, all in mono/muted register — NON-LINKED, zero accent.
  - Page-scoped `<style>` using only the six global tokens; `global.css` not touched.

## Frontend-Design Attribution (SC5)

All visual composition was routed through the **frontend-design skill** against `design-system/MASTER.md` + `22-UI-SPEC.md`. Skill-attributed decisions:

1. **Tier differentiation via type register** (not borders/shadows/color-fills): the featured entry uses the display/`.lead` ramp + accent CTA; the earlier entry is rendered entirely in the mono/muted utility register (`.meta-mono` + `--ink-muted`), so the asymmetry reads instantly with no new tokens.
2. **Highlights as a hairline "ledger"** — each highlight is a `.body` line with a `1px var(--rule)` top border and `md` (16px) padding. Chosen over a numbered list because the 5 highlights are parallel accomplishments, not a ranked sequence (honest structure).
3. **"EARLIER" cue = label-on-rule divider** — `.label-mono` `--ink-faint` label with a trailing `1px var(--rule)` hairline filling the row; a real editorial sectioning device separated from Holloway by `2xl` (48px).
4. **Accent reserved solely** for the deep-dive link (hover color + arrow-opacity reveal) and its focus ring (`outline: 2px solid var(--accent); offset 2px`); Balfour carries zero accent (MASTER §7 "if you can't click it, it can't be accent"). Reduced-motion drops the arrow reveal but keeps the accent color affordance.
5. **Spacing** drawn only from the MASTER scale (xs 8 / sm 12 / md 16 / lg 24 / xl 28 / 2xl 48); page framed with the site-standard `SectionHeader` ("§ 01 · EXPERIENCE", no count) + `.section` rhythm, consistent with `projects.astro`.

## Deviations from Plan

### Auto-fixed / Reconciled Issues

**1. [Rule 3 — Blocking] Deep-dive link form reconciled to the binding Wave-0 test**
- **Found during:** Task 2 verification (`experience-summary.test.ts` failed).
- **Issue:** The plan/PATTERNS suggested `href={`/experience/${holloway.id}`}`, but the Wave-0 test asserts `href=["'`]?\/experience\/` — a regex that requires a quote/backtick *immediately adjacent* to `href=`. Astro's brace-wrapped template-literal (`href={` … `}`) inserts a `{` between `href=` and the value, so the regex can never match it, and Astro cannot interpolate inside a quoted attribute. Verified empirically with a standalone regex probe.
- **Fix:** Used the equivalent static `href="/experience/holloway"` (matches the acceptance criterion's literal href and the Balfour-exclusion intent) and added a build-time guard `if (holloway.id !== "holloway") throw` so the static route stays honest — the build fails loudly if the featured MDX file is ever renamed and `/experience/holloway` would 404. Preserves the single-source safety intent of D-05.
- **Files modified:** src/pages/experience.astro
- **Commit:** c5d7b30

## Known Stubs

None. Both entries render live collection data; no placeholders.

## Threat Flags

None. No new network endpoints, auth paths, or trust-boundary surface introduced. Rendering is build-time SSG over Zod-validated first-party content; no user input. `global.css`/chat surface untouched (T-22-05 mitigation held — page-scoped `<style>` only).

## Verification Results

- `pnpm exec astro check` → **0 errors / 0 warnings** (1 pre-existing hint in `src/scripts/chat.ts:384`, out of scope — untouched by this plan).
- `pnpm exec vitest run tests/content/experience-summary.test.ts tests/content/experience-voice-em-dash.test.ts` → **8/8 pass**.
- `pnpm sync:experience:check` → **exits 0** (D-08 introduced no body drift).
- `pnpm exec astro build` → **success**; `/experience/index.html` generated.
- Built-HTML checks: no `/experience/balfour-beatty` string (EXP-05); "Holloway Company" present; `/experience/holloway` deep-dive link present; "Earlier" cue present. (The 2 `—` found in built HTML are inside pre-existing BaseLayout chat-widget HTML *comments*, present on every page — not this plan's content, not visible copy; the em-dash guard correctly scopes to `.astro` source + MDX body prose and passes.)
- `git diff src/styles/global.css` → **empty**; `package.json` + `pnpm-lock.yaml` → **unchanged** (QA-02: zero new deps).

## Requirements Satisfied

- **EXP-02** — `/experience` route reachable and rendering the collection.
- **EXP-03** — Holloway 30-second payload (meta + summary + 5 highlights + deep-dive link).
- **EXP-05** — Balfour rendered as a structurally-honest non-linked "Earlier" listing entry (no detail route referenced).

## Self-Check: PASSED

- FOUND: src/pages/experience.astro
- FOUND: src/content/experience/holloway.mdx (company normalized)
- FOUND commit 000d9a8 (Task 1)
- FOUND commit c5d7b30 (Task 2)
