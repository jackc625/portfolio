---
phase: 22-experience-page-holloway-case-study
plan: 02
subsystem: ui
tags: [astro, nav, header, mobile-menu, active-state, experience]

requires:
  - phase: 22-01
    provides: tests/build/experience-nav.test.ts (Wave 0 RED nav-ordering guard)
provides:
  - "experience-first primary nav entry in Header.astro (desktop) and MobileMenu.astro (mobile)"
  - "isActive startsWith('/experience') branch giving /experience and /experience/[id] active-state coverage"
affects: [22-03 experience page, 22-04 detail pages, 22-05 visual sign-off checkpoint]

tech-stack:
  added: []
  patterns:
    - "Nav route+active pairing: prepend navLinks entry + mirror startsWith branch in both primitives"

key-files:
  created: []
  modified:
    - src/components/primitives/Header.astro
    - src/components/primitives/MobileMenu.astro

key-decisions:
  - "Did NOT edit the v1.1-locked design-system/MASTER.md three-link nav contract; supersession to four items recorded here per plan design_contract_decision"
  - "Refreshed only the genuinely-stale in-code head comments (Header ~L6, MobileMenu ~L13) to the four-item order"

patterns-established:
  - "Experience-first nav order: experience · works · about · contact, mirrored byte-parallel across Header and MobileMenu"

requirements-completed: [EXP-02]

coverage:
  - id: D1
    description: "experience nav link appears FIRST (before /projects) in both Header.astro and MobileMenu.astro"
    requirement: "EXP-02"
    verification:
      - kind: unit
        ref: "tests/build/experience-nav.test.ts#declares href: \"/experience\" before href: \"/projects\""
        status: pass
    human_judgment: false
  - id: D2
    description: "isActive branch matches /experience via startsWith so /experience/[id] is active too, in both primitives"
    requirement: "EXP-02"
    verification:
      - kind: unit
        ref: "tests/build/experience-nav.test.ts#has an isActive branch matching /experience via startsWith"
        status: pass
    human_judgment: false
  - id: D3
    description: "Four-item nav renders without wrap/crowd/clip at intermediate widths (768px AND 1024px)"
    requirement: "EXP-02"
    verification: []
    human_judgment: true
    rationale: "This autonomous plan makes no CSS change and has no dev-server step; intermediate-width visual behavior is verified at the 22-05 human-verify checkpoint per plan design_contract_decision."

duration: 3min
completed: 2026-07-09
status: complete
---

# Phase 22 Plan 02: Experience-First Nav Entry Summary

**Experience-first primary nav (experience · works · about · contact) added to both Header.astro and MobileMenu.astro with a startsWith('/experience') active-state branch, turning experience-nav.test.ts GREEN — the MobileMenu focus-trap/.chat-widget inert script left byte-untouched.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-07-09T17:11:00Z
- **Completed:** 2026-07-09T17:13:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Prepended `{ href: "/experience", label: "experience" }` as the FIRST `navLinks` element in both nav primitives (index of /experience < index of /projects per D-03)
- Added an `isActive` `currentPath.startsWith("/experience")` branch in each file, giving /experience and /experience/[id] active-state coverage for free (mirrors the /projects → /projects/[id] pattern)
- Refreshed the two genuinely-stale in-code head comments to the four-item order without touching the locked MASTER.md spec
- Left the MobileMenu focus-trap and `.chat-widget` inert `<script>` block (lines ~225-380) byte-identical — diff hunks are confined to lines 13, 39, 54 (D-26 chat-surface battery preserved)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add experience first in Header.astro nav (D-03)** - `16a0607` (feat)
2. **Task 2: Mirror the nav entry in MobileMenu.astro (D-03, D-26)** - `c6ca889` (feat)

## Files Created/Modified
- `src/components/primitives/Header.astro` - Added /experience navLinks entry (first) + isActive startsWith branch; refreshed head comment
- `src/components/primitives/MobileMenu.astro` - Same parallel nav edit; focus-trap/.chat-widget script untouched; refreshed head comment

## Decisions Made
- **MASTER.md v1.1 lock respected:** Did not edit the three-link nav contract in design-system/MASTER.md (:324, :637). The four-item supersession is a v1.2+ change recorded in the plan and this SUMMARY, not by rewriting the locked spec.
- **Stale-comment scope:** Only the two in-code head comments were refreshed (Header ~L6 "3-link mono nav", MobileMenu ~L13 "Three stacked mono nav links"). The MobileMenu edit stays well above the D-26-protected `<script>` block.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. Git emitted expected CRLF→LF normalization warnings on commit (repo default, no impact).

## Verification Results
- `pnpm exec astro check` — 0 errors / 0 warnings (1 pre-existing hint in src/scripts/chat.ts, out of scope)
- `pnpm exec vitest run tests/build/experience-nav.test.ts` — 4/4 PASS (both primitives now experience-first)
- `git diff -U0 MobileMenu.astro` — hunks only at lines 13, 39, 54; no hunk inside the `<script>` focus-trap block
- `package.json` + `pnpm-lock.yaml` — unchanged (zero new deps, QA-02 lock held)

## Next Phase Readiness
- /experience is now a site-wide navigation target with active-state pairing; 22-03/22-04 can ship the Experience page and detail routes and inherit active-state coverage automatically.
- Intermediate-width crowding risk (four-item nav) is surfaced for the 22-05 human-verify checkpoint (768px AND 1024px). No CSS change was made here.

## Self-Check: PASSED
- FOUND: src/components/primitives/Header.astro
- FOUND: src/components/primitives/MobileMenu.astro
- FOUND commit: 16a0607
- FOUND commit: c6ca889

---
*Phase: 22-experience-page-holloway-case-study*
*Completed: 2026-07-09*
