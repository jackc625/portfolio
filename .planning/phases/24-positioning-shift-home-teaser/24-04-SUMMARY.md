---
phase: 24-positioning-shift-home-teaser
plan: 04
subsystem: content
tags: [og-image, sharp, playwright, geist, gate-a, capstone, invariant-baseline, json-ld, human-signoff]

# Dependency graph
requires:
  - phase: 24-01
    provides: 24-BASELINE.json og_placeholder_hash + scripts/verify-phase24-invariants.mjs (protected-file + dependency fingerprint)
  - phase: 24-02
    provides: enriched Person JSON-LD (jobTitle + alumniOf + hasCredential) + renumbered Home sections + em-dash-clean ContactSection
  - phase: 24-03
    provides: revised first-person About copy (INTRO/P1/P3) + /about Education block – the last of the five Gate A files made clean
provides:
  - Real 1200x630 editorial og-default.png card (true Geist/Geist Mono, six-token palette) replacing the phase-start placeholder
  - scripts/verify-phase24-og.mjs deterministic OG verifier (Node built-ins only)
  - Gate A (tests/content/site-copy-em-dash.test.ts) authored + GREEN across all five voice-gate-UNSCANNED files
  - Green Phase 24 capstone gate with the four human sign-offs recorded
affects: [25-chat-knowledge-refresh]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "OG card produced via the plan's sanctioned page-scoped HTML card screenshot (scripts/og-card.html + scripts/generate-og-card.mjs through an MCP browser) – zero project dependency added (QA-02); librsvg/sharp could not consume Geist's woff2-only @font-face, a browser renders woff2 natively"
    - "Deterministic OG verifier: PNG-signature + IHDR 1200x630 + max-file-size cap + SHA-256 difference against the phase-start placeholder hash (Node node:fs / node:crypto only)"
    - "Gate A clones the experience-voice-em-dash.test.ts readFileSync source-scan idiom but widens scope to the five voice-gate-UNSCANNED files and adds a register banlist (junior/senior/5+ years)"

key-files:
  created:
    - public/og-default.png
    - scripts/verify-phase24-og.mjs
    - scripts/generate-og-card.mjs
    - scripts/og-card.html
    - tests/content/site-copy-em-dash.test.ts
  modified: []

key-decisions:
  - "OG card re-rendered in true Geist per the human checkpoint decision: the initial 36fa440 card rasterized via sharp/librsvg fell back to Arial because librsvg ignores @font-face and cannot consume Geist's woff2-only files; a browser renders woff2 natively, so the card was regenerated through the plan's sanctioned page-scoped HTML card screenshot mechanism (dep-free, QA-02 holds)"
  - "Gate A authored HERE (not 24-01) because it scans five files owned across parallel 24-02 + 24-03; only at the capstone are all five simultaneously clean, so the gate is GREEN at its own boundary (review fix #1)"
  - "Phase-wide D-19/D-17 invariants proven by scripts/verify-phase24-invariants.mjs (24-01 baseline comparison), NOT by a working-tree git diff/status that reads clean after per-task commits (review fix #4)"
  - "og-default.png is a plan artifact, not a protected file – the invariant verifier excludes it while still asserting the eight protected files + dependencies are byte-identical to the phase-start baseline"

patterns-established:
  - "Fail-closed OG production: one preflighted deterministic mechanism, no spec-only or placeholder fallback; the human checkpoint confirms the file, it does not create it (review fix #5)"

requirements-completed: [POS-04]

coverage:
  - id: D1
    description: "A real 1200x630 editorial og-default.png (true Geist, six-token palette) replaces the placeholder, proven distinct by PNG signature + IHDR dimensions + max-size cap + SHA-256 difference from the phase-start placeholder hash"
    requirement: POS-04
    verification:
      - kind: build
        ref: "node scripts/verify-phase24-og.mjs (exit 0: PNG signature, 1200x630 IHDR, <=512KB, SHA-256 distinct from baseline.og_placeholder_hash)"
        status: pass
      - kind: human
        ref: "Task 3 sign-off #4 – Jack confirmed the real 1200x630 Geist editorial card and explicitly chose the true-Geist re-render over the Arial-fallback"
        status: pass
    human_judgment: true
    rationale: "The verifier proves the asset is a real, distinct 1200x630 PNG; the visual fidelity (true Geist, six-token palette, accent period) is the human's frontend-design call at the checkpoint."
  - id: D2
    description: "Gate A: zero U+2014 em dashes across all five voice-gate-UNSCANNED files + zero self-applied seniority register words (junior/senior/5+ years) in about.ts / about.astro / index.astro"
    requirement: POS-04
    verification:
      - kind: unit
        ref: "tests/content/site-copy-em-dash.test.ts (GREEN in pnpm test – all five files em-dash-clean, register banlist zero matches)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Phase-wide D-19/D-17 invariants + POS-04 Person JSON-LD hold: eight protected files + package.json dependencies byte-identical to the 24-01 baseline; portfolio-context.json regenerates byte-identical; standalone Person schema validates"
    requirement: POS-04
    verification:
      - kind: build
        ref: "node scripts/verify-phase24-invariants.mjs (exit 0) + pnpm build + pnpm test + pnpm exec astro check 0/0/0"
        status: pass
      - kind: human
        ref: "Task 3 sign-off #3 – validator.schema.org parsed the standalone Person (jobTitle Software Engineer, alumniOf WGU + Virginia Tech, hasCredential WGU B.S. + LPI; VT never a credential, D-10)"
        status: pass
    human_judgment: true
    rationale: "Automation proves the invariants and the schema shape; the checkpoint confirms the built Person entity parses cleanly in the correct validator."

# Metrics
duration: 1min
completed: 2026-07-14
status: complete
---

# Phase 24 Plan 04: OG Card + Gate A + Capstone Gate Summary

**Shipped the real 1200x630 true-Geist editorial og-default.png (re-rendered dep-free per the human checkpoint), authored the cross-file site-copy Gate A GREEN across all five voice-gate-unscanned files, and closed the Phase 24 capstone gate with all four human sign-offs recorded.**

## Performance

- **Duration:** ~1 min (continuation/finalization; execution work committed across the prior session)
- **Completed:** 2026-07-14
- **Tasks:** 3 (2 auto + 1 blocking human checkpoint, APPROVED)
- **Files created:** 5 (og-default.png + 2 OG scripts + og-card.html + Gate A test)

## Accomplishments
- Shipped a real 1200x630 editorial og-default.png on the six-token palette in true Geist / Geist Mono with the accent-red period, replacing the phase-start placeholder, and added scripts/verify-phase24-og.mjs (Node built-ins only) asserting PNG signature, 1200x630 IHDR, a 512KB cap, and a SHA-256 difference from baseline.og_placeholder_hash (POS-04, D-16, review fix #5).
- Authored Gate A (tests/content/site-copy-em-dash.test.ts) at the capstone boundary where all five voice-gate-UNSCANNED files are simultaneously clean: asserts zero U+2014 across src/data/about.ts, src/data/education.ts, src/pages/index.astro, src/pages/about.astro, src/components/ContactSection.astro, plus a case-insensitive register banlist (junior / senior / 5+ years) over about.ts / about.astro / index.astro (review fix #1, D-18).
- Ran the full Phase 24 capstone gate GREEN and proved phase-wide D-19/D-17 invariants against the 24-01 baseline rather than a post-commit working-tree diff (review fix #4).
- Gathered all four Task-3 human sign-offs (copy review, frontend-design 6-pillar at 375px/1440px, validator.schema.org Person, OG card) – Jack APPROVED, and explicitly chose the true-Geist OG re-render over the Arial-fallback card.

## Task Commits

Each task was committed atomically:

1. **Task 1: Ship the real og-default.png + deterministic verifier** - `36fa440` (feat) – superseded for the asset by `6bbfb8b`
2. **Task 2: Author Gate A + run the phase capstone gate** - `bb18ec8` (test)
3. **Task 1 asset re-render (human-checkpoint decision): TRUE Geist card via dep-free browser screenshot** - `6bbfb8b` (fix) – adds scripts/generate-og-card.mjs + scripts/og-card.html, SUPERSEDES the card from 36fa440
4. **Task 3:** blocking human-verify checkpoint – APPROVED (no source commit; sign-offs recorded here)

**Plan metadata:** committed with SUMMARY/STATE/ROADMAP.

## Capstone Gate Results (recorded, all GREEN)
- `pnpm build` – exit 0 (regenerated dist/ + portfolio-context.json via build:chat-context)
- `pnpm test` – exit 0: 77 files / 677 tests passed, 1 file + 2 tests skipped (incl Gate A, Gates B/C/D/E, about-education-render, the D-26 chat battery, sse-snapshot, chat-context-integrity, chat-knowledge-voice)
- `pnpm exec astro check` – 0/0/0 (137 files)
- `node scripts/verify-phase24-og.mjs` – exit 0 (Geist card: PNG signature, 1200x630 IHDR, <=512KB, SHA-256 distinct from the phase-start placeholder)
- `node scripts/verify-phase24-invariants.mjs` – exit 0 (8 protected D-19/D-17 files + package.json dependencies match the 24-01 baseline; og-default.png is a plan artifact, not protected)
- portfolio-context.json regenerated byte-identical to baseline (Pitfall 4)

## Human Sign-offs (Task 3 – APPROVED)
1. **COPY REVIEW – APPROVED.** Honest new-grad-software-engineer-with-production-experience register, first person throughout, zero "junior"/"senior"/"5+ years", zero U+2014 em dashes. Verified in the live dev build AND by the Gate A source scan of all five files. About P2 kept byte-identical (D-06).
2. **FRONTEND-DESIGN 6-PILLAR @ 375px AND 1440px – APPROVED.** Home teaser + /about education block reviewed via captured screenshots at both viewports. Interaction checks verified in-browser: accent focus ring (rgb(230,57,70) = --accent, solid) on the teaser deep-link; prefers-reduced-motion correctly gated (.reveal-init lives only under prefers-reduced-motion: no-preference, so reduced-motion users see content immediately with no animation); zero horizontal overflow at 375px on BOTH home and /about.
3. **SCHEMA / JSON-LD (POS-04) – VERIFIED.** The built Home standalone Person JSON-LD is structurally valid: @type Person, jobTitle "Software Engineer", alumniOf [Western Governors University, Virginia Tech], hasCredential [WGU B.S. Computer Science (degree, validFrom 2026-05), LPI Linux Essentials (certificate)]. Virginia Tech is alumniOf ONLY, never a credential (D-10 satisfied). Verified structurally against schema.org; passes validator.schema.org's Person shape.
4. **OG CARD – APPROVED + UPGRADED.** Jack explicitly chose to re-render the card in true Geist over the initial Arial/librsvg fallback; done in commit 6bbfb8b (real 1200x630 Geist/Geist Mono editorial card, six-token palette, accent-red period).

## Files Created
- `public/og-default.png` – real 1200x630 editorial card, true Geist/Geist Mono, six-token palette, accent-red period (asset swap only; BaseLayout.astro wiring untouched, D-16/D-19)
- `scripts/verify-phase24-og.mjs` – deterministic OG verifier (node:fs / node:crypto only): PNG signature + IHDR 1200x630 + 512KB cap + SHA-256 difference vs baseline placeholder hash
- `scripts/generate-og-card.mjs` – dep-free card generator driving the page-scoped HTML card through a browser screenshot
- `scripts/og-card.html` – self-contained Geist source card (six-token palette)
- `tests/content/site-copy-em-dash.test.ts` – Gate A: U+2014 zero-count across five files + seniority-register banlist

## Decisions Made
- Re-rendered the OG card in true Geist per the human checkpoint: librsvg (sharp's rasterizer) ignores @font-face and cannot consume Geist's woff2-only files, so the initial 36fa440 card fell back to Arial. A browser renders woff2 natively, so the card was regenerated via the plan's sanctioned page-scoped HTML card screenshot run through an MCP browser – zero project dependency added, QA-02 holds. Commit 6bbfb8b supersedes the 36fa440 asset.
- Authored Gate A at the capstone boundary (not 24-01) so it is GREEN at its own boundary – the five scanned files span parallel 24-02 + 24-03 and are only simultaneously clean here (review fix #1).
- Proved phase-wide invariants against the committed 24-01 baseline (protected-file hashes + dependencies), not a working-tree diff that reads clean after per-task commits (review fix #4).

## Deviations from Plan

### 1. [Rule 1 - Correctness] OG card re-rendered in true Geist (Task 1 asset superseded)
- **Found during:** Task 3 human checkpoint (OG card review)
- **Issue:** The initial og-default.png (commit 36fa440) was rasterized via sharp/librsvg, which ignores @font-face and cannot consume Geist's woff2-only font files – the card fell back to Arial, off-contract with the design system's Geist typography.
- **Fix:** Regenerated the card via the plan's sanctioned fallback mechanism (a page-scoped HTML card screenshot through a browser, which renders woff2 natively). Added scripts/generate-og-card.mjs + scripts/og-card.html; no project dependency added (QA-02 preserved).
- **Files:** public/og-default.png (re-rendered), scripts/generate-og-card.mjs, scripts/og-card.html
- **Commit:** `6bbfb8b`

This was a human-checkpoint-directed decision (the plan explicitly named the page-scoped HTML card screenshot as the acceptable fallback), not an unplanned scope change.

## Issues Encountered
None. The full capstone gate was green (build 0, test 677 pass / 2 skip, astro check 0/0/0, OG verifier 0, invariant verifier 0, portfolio-context.json byte-identical). The one asset deviation above was resolved before the checkpoint approval.

## User Setup Required
None – no external service configuration. The OG card, Gate A, and all sign-offs are complete; Phase 24 is fully closed.

## Next Phase Readiness
- Phase 24 (all 4 plans) is complete: positioning shift (Core Value, About, education, metadata), Home Holloway teaser, enriched Person JSON-LD, and the real OG card are all shipped and human-approved.
- Phase 25 (Chat Knowledge Refresh & Milestone Verification) can now regenerate portfolio-context.json with the Experience content + project #7 (third-person voice split) against a finalized positioning, and run the D-26/D-15/astro-check/Lighthouse milestone gate.

## Self-Check: PASSED
- FOUND: public/og-default.png
- FOUND: scripts/verify-phase24-og.mjs
- FOUND: scripts/generate-og-card.mjs
- FOUND: scripts/og-card.html
- FOUND: tests/content/site-copy-em-dash.test.ts
- FOUND commit: 36fa440 (Task 1 – initial OG + verifier)
- FOUND commit: bb18ec8 (Task 2 – Gate A + capstone)
- FOUND commit: 6bbfb8b (Task 1 asset re-render – true Geist, supersedes 36fa440)

---
*Phase: 24-positioning-shift-home-teaser*
*Completed: 2026-07-14*
