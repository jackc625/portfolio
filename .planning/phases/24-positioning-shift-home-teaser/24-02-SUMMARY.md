---
phase: 24-positioning-shift-home-teaser
plan: 02
subsystem: home
tags: [home-teaser, section-numbering, json-ld, seo, vitest, positioning]

requires:
  - phase: 24-01-positioning-foundation
    provides: education.ts SSoT exports (alumniOfSchema, hasCredentialSchema)
provides:
  - Home 01 EXPERIENCE Holloway teaser (id-guarded collection query, /experience link)
  - Home section sequence 01/02/03/04 + em-dash-clean ContactSection.astro
  - Enriched personSchema (jobTitle + alumniOf + hasCredential) + sharpened SEO description
  - Gate B/C (home-teaser-render) GREEN render gate
affects: [24-03-about-education-block, 24-04-capstone]

tech-stack:
  added: []
  patterns:
    - "Reuse the shared experience collection query + hasCaseStudy/id guards on a second surface (no data duplication, D-05)"
    - "JSON.parse the escaped ld+json script textContent in a jsdom build gate (not substring-match escaped bytes)"

key-files:
  created:
    - tests/build/home-teaser-render.test.ts
  modified:
    - src/pages/index.astro
    - src/components/ContactSection.astro

key-decisions:
  - "Teaser summary is the drafted one-liner literal in index.astro (teaser brevity, D-12) using an &rsquo; entity apostrophe -- zero em dashes"
  - "Highlight is the trimmed UI-SPEC 1,400 draft (Gate A covers either source); stack line omitted (D-05)"
  - "Comment wording reworded twice so grep -c returns exactly 2 (sortExperienceEntries) and exactly 1 (jobTitle) per the acceptance criteria"

patterns-established:
  - "Second-surface reuse of the id-guarded experience query with an index.astro-prefixed throw message"
  - "jsdom render gate that JSON.parses ld+json + asserts a verbatim LOCKED hero-lead regression guard"

requirements-completed: [HOME-01, POS-01, POS-04]

coverage:
  - id: HOME-01
    description: "Home opens with the concise 01 EXPERIENCE Holloway teaser (role/company/dates + 1,400 metric + /experience link)"
    requirement: "HOME-01"
    verification:
      - kind: unit
        ref: "tests/build/home-teaser-render.test.ts#the 01 EXPERIENCE section is a concise teaser"
        status: pass
    human_judgment: false
  - id: POS-01
    description: "Section sequence reads 01 EXPERIENCE / 02 WORK / 03 ABOUT / 04 CONTACT; ContactSection em-dash-clean"
    requirement: "POS-01"
    verification:
      - kind: unit
        ref: "tests/build/home-teaser-render.test.ts#section labels read the exact ordered 01/02/03/04 sequence"
        status: pass
      - kind: other
        ref: "test \"$(grep -c '—' src/components/ContactSection.astro)\" -eq 0"
        status: pass
    human_judgment: false
  - id: POS-04
    description: "personSchema carries jobTitle + alumniOf + hasCredential; SEO description sharpened + distinct from hero lead"
    requirement: "POS-04"
    verification:
      - kind: unit
        ref: "tests/build/home-teaser-render.test.ts#the ld+json Person carries jobTitle + alumniOf (WGU + VT) + hasCredential (LPI)"
        status: pass
      - kind: unit
        ref: "tests/build/home-teaser-render.test.ts#the rendered meta description is non-empty, em-dash-free, and DISTINCT from the hero lead"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-07-14
status: complete
---

# Phase 24 Plan 02: Home Positioning Shift & Experience Teaser Summary

**Home now opens with a concise 01 EXPERIENCE Holloway teaser (id-guarded collection reuse, /experience link, 1,400 metric), reads 01/02/03/04 across sections, carries an enriched JSON-LD Person (jobTitle + derived alumniOf/hasCredential) and a sharpened SEO description, with ContactSection.astro fully em-dash-clean and a GREEN Gate B/C render test proving all of it.**

## Performance

- **Duration:** ~8 min
- **Tasks:** 3
- **Files modified:** 3 (2 modified, 1 created)

## Accomplishments
- Added the `01 EXPERIENCE` Holloway teaser to `src/pages/index.astro`, placed FIRST. It reuses the SAME collection query `experience.astro` uses (shared ordering helper + `hasCaseStudy` find guard + `holloway.id !== "holloway"` throw guard, both index.astro-prefixed) so it can never point at an unbuilt route (review fix #6, D-05). Compact `.featured` mirror: eyebrow / title / summary / ONE 1,400 metric highlight / deep-link to `/experience`; stack line omitted (D-05). All teaser CSS is page-scoped with the reduced-motion contract.
- Renumbered the Home headers to read `01 EXPERIENCE / 02 WORK / 03 ABOUT / 04 CONTACT` (WORK 01->02, ABOUT 02->03 via SectionHeader props; CONTACT 03->04 via the ContactSection literal, D-01).
- Enriched `personSchema` with `jobTitle: "Software Engineer"` + `alumniOf: alumniOfSchema` + `hasCredential: hasCredentialSchema`, both DERIVED in `education.ts` (24-01) so no institution literals are re-hardcoded (POS-04, D-14). Render path unchanged (`<JsonLd schema={personSchema} />`, no hand-rolled script tag, V5.3).
- Sharpened the Home `description=` prop to the production/contract positioning (D-15), distinct from the unchanged hero lead (D-08).
- Stripped all three U+2014 em dashes from `ContactSection.astro`'s doc comments and updated its `§ 03` references to `§ 04` (review fix #3), closing the known non-MDX voice-gate scope gap before 24-04's whole-source Gate A scan.
- Authored `tests/build/home-teaser-render.test.ts` (Gates B + C), GREEN at this boundary: exact section-label sequence, concise-teaser contract, JSON.parsed Person enrichment, em-dash-free/distinct meta description, and a verbatim LOCKED hero-lead regression guard (WARNING 1).

## Task Commits

1. **Task 1: 01 EXPERIENCE Holloway teaser** - `50325b7` (feat)
2. **Task 2: renumber headers + enrich personSchema + sharpen SEO desc + fix ContactSection** - `2279244` (feat)
3. **Task 3: author Gate B/C home-teaser-render** - `4caca7a` (test)

## Files Created/Modified
- `src/pages/index.astro` - teaser section + id-guarded experience query + renumbered WORK/ABOUT headers + enriched personSchema + sharpened description + page-scoped teaser CSS
- `src/components/ContactSection.astro` - CONTACT literal `03 -> 04` + three doc-comment em dashes stripped + `§ 03 -> § 04` comment refs
- `tests/build/home-teaser-render.test.ts` - Gate B/C jsdom render gate (created)

## Decisions Made
- Used the drafted one-liner teaser summary as a literal string in `index.astro` (teaser brevity per D-12), written with an `&rsquo;` entity apostrophe to stay em-dash-free and match the site's curly-quote convention.
- Used the trimmed UI-SPEC 1,400 highlight draft rather than the full `holloway.mdx` highlight[0] (both covered by Gate A; the trimmed line reads cleaner in a single-highlight teaser).
- Reworded two doc comments to satisfy the exact `grep -c` acceptance criteria (`sortExperienceEntries` == 2, `jobTitle` == 1) without weakening the code intent.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reworded two doc comments to meet the exact grep-count acceptance criteria**
- **Found during:** Tasks 1 and 2
- **Issue:** My initial comments referenced `sortExperienceEntries` and `jobTitle` by name, pushing `grep -c sortExperienceEntries` to 3 (criterion: 2) and `grep -c jobTitle` to 2 (criterion: 1).
- **Fix:** Reworded the two comments to describe the symbols ("the shared ordering helper", "The job title + alumniOf ... fields") without repeating the literal token.
- **Files modified:** src/pages/index.astro
- **Verification:** `grep -c sortExperienceEntries` == 2 and `grep -c jobTitle` == 1; build + Gate B/C GREEN.
- **Committed in:** `50325b7` (Task 1), `2279244` (Task 2)

---

**Total deviations:** 1 auto-fixed (1 blocking). No scope creep; no architectural changes.

## Verification Results
- `pnpm build` exits 0 with the new EXPERIENCE section in place
- `pnpm exec vitest run tests/build/home-teaser-render.test.ts` exits 0 (6/6 GREEN, Gates B + C)
- `grep -c '—'` on `src/pages/index.astro` and `src/components/ContactSection.astro` both return 0
- `grep -c sortExperienceEntries src/pages/index.astro` == 2; `grep -c jobTitle src/pages/index.astro` == 1
- `grep -c "&sect; 04" ContactSection.astro` == 1; `grep -c "&sect; 03"` == 0
- `pnpm exec astro check` is 0/0/0 (133 files)
- No change to `src/layouts/BaseLayout.astro` or `src/styles/global.css` (D-19), confirmed by `git diff --name-only`

## Known Stubs
None. The teaser is fed by the live build-time collection query with fail-loud guards; no placeholder or empty-state data.

## Next Phase Readiness
- Home positioning + JSON-LD are final for the phase; 24-03 wires the `/about` education block from the same `education.ts` SSoT.
- Gate B/C is a persistent regression guard the 24-04 capstone re-runs; the LOCKED hero lead is now automated-guarded.

## Self-Check: PASSED

All three files verified present on disk; all three task commits verified in git history (`50325b7`, `2279244`, `4caca7a`).

---
*Phase: 24-positioning-shift-home-teaser*
*Completed: 2026-07-14*
