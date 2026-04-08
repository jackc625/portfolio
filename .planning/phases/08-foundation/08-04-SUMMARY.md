---
phase: 08-foundation
plan: 04
subsystem: ui
tags: [astro, tailwind-v4, components, cleanup, design-tokens]

requires:
  - phase: 08-foundation
    provides: "Plan 02 token rename (--bg, --ink, --rule, --accent), Plan 03 GSAP/dark-mode/ClientRouter removal + DOMContentLoaded mobile menu fallback"
provides:
  - "8 dead v1.0 components removed from src/components/"
  - "Header.astro stripped of ThemeToggle, /resume nav, and old token classes"
  - "MobileMenu.astro with /resume removed, token classes renamed, Plan 03 fallback preserved"
  - "simplex-noise dependency uninstalled (CanvasHero was sole consumer)"
affects: [09-primitives, 10-page-port]

tech-stack:
  added: []
  patterns:
    - "Inline Tailwind token classes use new v1.1 scheme: bg-bg, text-ink, text-ink-muted, text-ink-faint, border-rule"
    - "Token deletions bundled with their consumer deletions to keep every commit buildable"

key-files:
  created: []
  modified:
    - src/components/Header.astro
    - src/components/MobileMenu.astro
    - package.json
    - pnpm-lock.yaml
  deleted:
    - src/components/CTAButton.astro
    - src/components/FeaturedProjectItem.astro
    - src/components/ProjectCard.astro
    - src/components/SkillGroup.astro
    - src/components/CanvasHero.astro
    - src/components/ResumeEntry.astro
    - src/components/CaseStudySection.astro
    - src/components/ThemeToggle.astro

key-decisions:
  - "MobileMenu social-link block (GitHub/LinkedIn/Mail) had additional text-text-muted/hover:text-text-primary classes not enumerated in plan task list — renamed to text-ink-faint/hover:text-ink to satisfy the explicit acceptance criteria (grep returns 0 for old token classes in MobileMenu.astro)"
  - "Used pnpm not npm per Plan 03 carry-over decision; staged pnpm-lock.yaml"

patterns-established:
  - "Token rename map: bg-bg-primary→bg-bg, text-text-primary→text-ink, text-text-muted→text-ink-faint (faint variant for low-emphasis), text-text-secondary→text-ink-muted, border-border→border-rule, [length:--token-text-base]→text-base, [length:--token-text-sm]→text-sm, [length:--token-text-heading]→text-3xl"

requirements-completed: [DSGN-04]

duration: 3min
completed: 2026-04-08
---

# Phase 08 Plan 04: Dead Component Cleanup Summary

**Deleted 8 dead v1.0 components and surgically renamed inline Tailwind token classes in Header + MobileMenu so the surviving nav uses the new --bg/--ink/--rule token scheme.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-08T00:07:17Z
- **Completed:** 2026-04-08T00:10:01Z
- **Tasks:** 2
- **Files modified:** 4 (2 edited, 2 dependency manifests)
- **Files deleted:** 8

## Accomplishments
- Removed the v1.0 component zoo (CTAButton, FeaturedProjectItem, ProjectCard, SkillGroup, CanvasHero, ResumeEntry, CaseStudySection, ThemeToggle) — 621 lines deleted
- Header.astro: removed ThemeToggle import + 2 usages, dropped /resume navLink, renamed all inline token classes to v1.1 scheme
- MobileMenu.astro: dropped /resume navLink, renamed all inline token classes (including social link block), preserved Plan 03 DOMContentLoaded fallback
- Uninstalled simplex-noise (CanvasHero was its only consumer) in the same commit as the CanvasHero deletion — every intermediate state remains buildable

## Task Commits

1. **Task 1: Delete 8 dead components + uninstall simplex-noise** — `cd12637` (chore)
2. **Task 2: Header + MobileMenu surgery** — `2b2a7cb` (refactor)

## Files Created/Modified
- `src/components/Header.astro` — ThemeToggle import + 2 usages removed; /resume navLink removed; 6 class strings renamed to new tokens
- `src/components/MobileMenu.astro` — /resume navLink removed; 4 nav class strings renamed; 4 social-link class strings renamed; Plan 03 DOMContentLoaded fallback preserved untouched
- `package.json` — simplex-noise dependency removed
- `pnpm-lock.yaml` — lockfile updated
- 8 deleted component files listed in frontmatter

## Decisions Made
- **Social-link rename outside enumerated task list:** The plan task list enumerated specific lines for token rename, but the acceptance criteria explicitly required `grep -c 'text-text-muted' src/components/MobileMenu.astro` to return 0. The social-link block (GitHub/LinkedIn/Mail) had `text-text-muted` and `hover:text-text-primary` classes not covered by the enumerated lines. Renamed them to `text-ink-faint` and `hover:text-ink` to satisfy the acceptance criteria. Phase 9 rewrites Header/MobileMenu entirely so this is throwaway code.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed token classes in MobileMenu social-link block**
- **Found during:** Task 2 verification
- **Issue:** Plan task list only enumerated nav-link lines for renaming, but the acceptance criteria required all `text-text-muted` and `hover:text-text-primary` instances to be 0 — the social-link block had unenumerated instances that would have failed acceptance criteria AND would have rendered incorrectly against the new tokens (text-text-muted no longer exists as a Tailwind utility).
- **Fix:** `replace_all` rename: `text-text-muted` → `text-ink-faint` (low-emphasis grey for footer-icon style), `hover:text-text-primary` → `hover:text-ink`
- **Files modified:** src/components/MobileMenu.astro
- **Verification:** All 18 grep acceptance criteria pass
- **Committed in:** 2b2a7cb (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug; would have rendered with broken classes)
**Impact on plan:** Necessary to honor explicit acceptance criteria + correct rendering. No scope creep — Phase 9 rewrites both files.

## Issues Encountered
None — both tasks executed cleanly. All 19 grep acceptance criteria passed on first run after edits.

## Parallel Wave 4 Confirmation
Per plan verification: Plan 04 (this) touches Header.astro + MobileMenu.astro + 8 deleted components + package.json/pnpm-lock.yaml. Plan 05 will touch ChatWidget.astro + global.css `.chat-*` section + portfolio-context.json. Plan 06 will touch pages + Footer/NextProject/ArticleImage/SkipToContent/ContactChannel. **No shared files** — all three Wave 4 plans are file-disjoint and could run in parallel (worktrees disabled, so they run sequentially in this session).

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Phase 9 (Primitives) full Header/MobileMenu rewrites are unblocked: existing files render correctly against the new token scheme as a transitional state
- DSGN-04 (motion/component cleanup) is structurally satisfied
- No file in src/ imports any of the 8 deleted components except `src/pages/resume.astro` (Plan 07 deletes it)

## Self-Check: PASSED

- All 8 component files confirmed deleted
- Both task commits found in git log (cd12637, 2b2a7cb)

---
*Phase: 08-foundation*
*Completed: 2026-04-08*
