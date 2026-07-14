---
phase: 25-chat-knowledge-refresh-milestone-verification
plan: 02
subsystem: ai
tags: [chat, voice-split, portfolio-context, system-prompt, positioning, mdx, third-person]

# Dependency graph
requires:
  - phase: 24-positioning-shift-home-teaser
    provides: new-grad-with-production-experience site positioning (about.ts P1/P3, education.ts SSoT) + the 24-UAT removal of the site /about P2 paragraph that this plan mirrors into chat
  - phase: 25 (Plan 01)
    provides: Wave-0 chat tests-first contract (14 RED-by-design), the byte-intact <security>-block snapshot bounding 25-02's edit, and the "looking for"/"full-time" fixture anchors
provides:
  - Third-person chatSummary fields on holloway.mdx, multi-chain-evm.mdx, balfour-beatty.mdx (locked copy)
  - Repositioned chat identity: about-chat.ts (junior dropped, new-grad register, P3 anchors "looking for"/"full-time"), portfolio-context.static.json (refreshed personal.summary + additive Deno/TanStack Query/Vitest/Ethers.js skills, stale education object removed)
  - system-prompt.ts audience re-framed + #7 topic-ban sentence removed with the <security> block otherwise byte-intact
  - Chat about block cut to three paragraphs (INTRO/P1/P3) to match the Phase 24 site /about
affects: [25-03 (corpus regen reads these locked sources), 25-04 (milestone gate pass)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Copy-review checkpoint locks all third-person chat copy at source before 25-03 regenerates the corpus (Phase 24 pattern)"
    - "Coupled source+consumer edit: dropping an ABOUT_CHAT_* export requires a matching edit to build-chat-context.mjs's about-extractor to keep the tree green between waves"

key-files:
  created: []
  modified:
    - src/content/experience/holloway.mdx
    - src/content/experience/balfour-beatty.mdx
    - src/content/projects/multi-chain-evm.mdx
    - src/data/about-chat.ts
    - src/data/portfolio-context.static.json
    - src/prompts/system-prompt.ts
    - scripts/build-chat-context.mjs

key-decisions:
  - "Chat ABOUT_CHAT_P2 removed at the copy-review checkpoint to match the Phase 24 site /about P2 cut (24-UAT); build-chat-context.mjs about-extractor updated to 3 paragraphs (INTRO/P1/P3)"
  - "build-chat-context.mjs (nominally 25-03's file) edited here as a coupled consequence of the approved checkpoint edit — necessary to avoid a broken tree (hard-error on missing ABOUT_CHAT_P2 export) between waves; kept surgical, no corpus regen"
  - "portfolio-context.json NOT regenerated — the committed corpus retains about.p2; regeneration is 25-03's job (established, deliberate drift)"

patterns-established:
  - "Coupled export/consumer edit keeps working tree green across wave boundaries without pre-empting the next plan's corpus rewrite"

requirements-completed: []  # CHAT-10/CHAT-11 only PARTIALLY advanced by locked copy; they complete when 25-03/25-04 turn the RED suite green. Not over-claimed here.

# Metrics
duration: ~15min
completed: 2026-07-14
status: complete
---

# Phase 25 Plan 02: Chat Copy & Positioning Rewrite Summary

**Third-person chat copy locked across six files (Holloway/#7/Balfour chatSummaries, repositioned about-chat identity, #7-ban lifted from system-prompt) and, per Jack's copy-review approval, the chat about P2 "boring tool first" paragraph cut to match the Phase 24 site /about.**

## Performance

- **Duration:** ~15 min (continuation session, past the human copy-review checkpoint)
- **Completed:** 2026-07-14
- **Tasks:** 3 (Tasks 1-2 by prior executor; Task 3 checkpoint resolved here)
- **Files modified:** 7 across the full plan (6 copy/identity sources + build script coupled edit)

## Accomplishments

- **Verified prior committed work:** Task 1 (`b2b35b7` — three third-person chatSummary fields) and Task 2 (`5a7fd89` — repositioned identity across about-chat.ts, portfolio-context.static.json, system-prompt.ts) confirmed present with the working tree reflecting them.
- **Resolved the Task 3 human copy-review checkpoint:** Jack APPROVED all authored copy with a single edit — cut the chat P2 "boring tool first" paragraph to keep the chat about block consistent with the site /about page (where the equivalent paragraph was removed during Phase 24 UAT).
- **Applied the P2 cut correctly as a coupled edit:** removed `ABOUT_CHAT_P2` from `src/data/about-chat.ts` and updated the sole consumer (`scripts/build-chat-context.mjs`) so its about-extractor no longer requires/assembles P2 — keeping the tree green (no hard-error on missing export).

## Task Commits

1. **Task 1: Author three third-person chatSummary fields (Holloway / #7 / Balfour)** - `b2b35b7` (feat) — prior executor
2. **Task 2: Rewrite positioning + identity + prompt template** - `5a7fd89` (feat) — prior executor
3. **Task 3: Human copy-review checkpoint → P2 cut** - `e874728` (refactor) — this session

## Files Created/Modified

- `src/data/about-chat.ts` - Removed `ABOUT_CHAT_P2` constant + its `/* Verified */` comment; INTRO/P1/P3 left byte-identical.
- `scripts/build-chat-context.mjs` - Coupled edit: dropped `"ABOUT_CHAT_P2"` from the about-extractor required-names list and removed `p2: parsed.ABOUT_CHAT_P2` from the about-block assembly. No other change to the build script (25-03 owns the corpus-engine rewrite).

## Decisions Made

- **Cut chat ABOUT_CHAT_P2 to match the site /about.** At the copy-review checkpoint Jack approved all authored copy but asked to remove the chat's P2 "boring tool first" paragraph, mirroring the Phase 24 24-UAT removal of the equivalent site paragraph (STATE.md line 95). All other 25-02 copy stays locked exactly as authored (INTRO, P1, P3, the three chatSummary fields, portfolio-context.static.json, system-prompt.ts untouched).
- **Did NOT regenerate `portfolio-context.json`.** Corpus regeneration is 25-03's job; the committed JSON deliberately retains `about.p2` (the established, intentional cross-wave drift 25-03 closes when it rebuilds the corpus without P2).
- **CHAT-10/CHAT-11 not marked complete.** The locked copy only partially advances them; they complete when 25-03 regenerates the corpus and 25-04 turns the RED suite green. `requirements-completed: []` to avoid over-claiming.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Coupled edit to build-chat-context.mjs (nominally 25-03's file)**
- **Found during:** Task 3 checkpoint resolution (P2 cut)
- **Issue:** `scripts/build-chat-context.mjs` is the sole consumer of `ABOUT_CHAT_P2`; its `parseAboutChatExports` required-names list (`ABOUT_CHAT_INTRO, ABOUT_CHAT_P1, ABOUT_CHAT_P2, ABOUT_CHAT_P3`) HARD-ERRORS (`process.exit(2)`) on a missing export. Removing `ABOUT_CHAT_P2` from about-chat.ts without a matching consumer edit would leave the tree broken (build:chat-context fails) between waves.
- **Fix:** Dropped `"ABOUT_CHAT_P2"` from the required-names array and removed `p2: parsed.ABOUT_CHAT_P2` from the about-block assembly. Surgical — no other refactor of the build script (25-03 owns the corpus-engine rewrite).
- **Files modified:** scripts/build-chat-context.mjs
- **Verification:** `pnpm exec astro check` 0/0/0; targeted chat test suites show only the known RED-until-25-03 failures.
- **Committed in:** `e874728` (atomic with the P2 cut)

---

**Total deviations:** 1 auto-fixed (1 blocking — coupled source/consumer edit)
**Impact on plan:** Necessary consequence of the approved checkpoint edit to keep the working tree green across the wave boundary. No scope creep — the build script's corpus-engine rewrite remains 25-03's responsibility.

## Issues Encountered

None. The P2 cut applied cleanly; verification behaved exactly as the plan predicted.

## Verification

- **`pnpm exec astro check`:** 0 errors / 0 warnings / 0 hints (139 files).
- **Em dashes (U+2014):** 0 in `about-chat.ts`; the P2 cut removed content only, introduced none. (The 46 em dashes in `build-chat-context.mjs` are pre-existing comment content, untouched.)
- **First-person leak:** none introduced — removal-only edit; the third-person INTRO/P1/P3 are byte-identical.
- **Test suite — no NEW failures beyond 25-01's known RED-until-25-03 set.** The 9 failures across the three chat suites are all RED-by-design pending 25-03's corpus regen / 25-04's green pass:
  - `chat-context-integrity`: 7 expected slugs, exactly 7 entries, education wired to education.ts SSoT (D-07), reverse-chron experience array (D-09), #7 untruncated (D-04), corpus skills include the 4 additive D-08 skills.
  - `chat-knowledge-voice`: regex self-test catches "I interned"/"I coordinated" (25-03 extends the regex), and `ctx.experience` should be an array (25-03 emits it).
  - The `about.toHaveProperty("p2")` integrity assertion still PASSES — both voice/integrity suites read the UNCHANGED generated `portfolio-context.json` (which still carries `about.p2`); no test pins `ABOUT_CHAT_P2` in source, so the P2 cut required no test update.

## Next Phase Readiness

- All six 25-02 source files carry locked, copy-reviewed third-person content; the chat about block is now three paragraphs (INTRO/P1/P3), consistent with the Phase 24 site /about.
- **25-03 (corpus regen)** reads these locked sources to rebuild `portfolio-context.json` — and must (a) emit the corpus WITHOUT `about.p2`, updating the `chat-context-integrity` p2-property assertion accordingly, and (b) turn the enumerated RED set green (7 projects + #7 untruncated + structured experience array + education from education.ts + additive skills + extended first-person-leak regex).
- No gated D-14 chat-surface file touched (BaseLayout.astro / global.css / chat.ts / api/chat.ts untouched). No packages installed (QA-02 holds).

## Self-Check: PASSED

- Modified files exist: `src/data/about-chat.ts`, `scripts/build-chat-context.mjs` (P2 cut), plus the six Task 1-2 source files.
- Commits verified present: `b2b35b7` (Task 1), `5a7fd89` (Task 2), `e874728` (Task 3 / P2 cut), `05a0f79` (SUMMARY).
- `pnpm exec astro check` 0/0/0; no NEW test failures beyond 25-01's known RED-until-25-03 set.

---
*Phase: 25-chat-knowledge-refresh-milestone-verification*
*Completed: 2026-07-14*
