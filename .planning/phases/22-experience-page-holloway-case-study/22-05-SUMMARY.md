---
phase: 22-experience-page-holloway-case-study
plan: 05
subsystem: experience-surface
tags: [verification, gate, capstone, chat-regression, frontend-design, human-verify]
requires:
  - "22-02 (nav: experience-first four-item primary nav)"
  - "22-03 (/experience listing — asymmetric two-tier)"
  - "22-04 (/experience/holloway deep-dive detail route)"
provides:
  - "SC1-SC5 proven together: the phase capstone gate result (astro check 0/0, full suite incl. D-26 battery, drift, build route set, QA-02 dep lock)"
  - "SC5d human visual sign-off (APPROVED) — the Experience surface is ready for /gsd-verify-work"
affects:
  - "phase 22 verification (this is the last gate before /gsd-verify-work)"
tech-stack:
  added: []
  patterns:
    - "verification-only plan — zero source files modified; the gate suite is the deliverable"
    - "build-output HTML assertions target dist/client (wrangler.jsonc assets.directory=./dist/client), NOT dist"
    - "QA-02 hard lock: git diff --exit-code -- package.json pnpm-lock.yaml (exit 0), replacing the weaker --stat check"
key-files:
  created:
    - .planning/phases/22-experience-page-holloway-case-study/22-05-SUMMARY.md
  modified: []
decisions:
  - "Blocking human-verify checkpoint (SC5d) was NOT self-approved; the human confirmed the frontend-design composition and the orchestrator browser-verified all 9 how-to-verify steps"
metrics:
  duration: "~9 min"
  completed: 2026-07-09
  tasks: 2
  files_changed: 0
status: complete
---

# Phase 22 Plan 05: Capstone Gate + SC5d Visual Sign-Off Summary

Verification-only phase capstone. Ran the full milestone-cross-cutting gate suite against the complete Wave 1+2 diff (nav + listing + detail) in one place — the astro-check type gate, the full Vitest suite including the D-26 chat-surface regression battery (QA-01), the D-08 drift gate, the route-generation build, the built-HTML source-shape assertions, and the QA-02 byte-identical dependency lock — then obtained the SC5d human visual sign-off that cannot be automated. All 6 gate items green; the human APPROVED. No source files modified.

## Task 1 — Gate Suite Results (6/6 GREEN)

| # | Gate | Result | Evidence |
|---|------|--------|----------|
| 1 | `pnpm exec astro check` (SC5a) | PASS | 127 files: **0 errors, 0 warnings**, 1 hint. The sole hint is the pre-existing `src/scripts/chat.ts:384` unused-param (`button`) — out of scope, untouched by phase 22, acceptable. |
| 2 | `pnpm test` full Vitest incl. D-26 chat battery (SC5b / QA-01 / T-22-04) | PASS | **623 passed / 2 skipped** across **70 files passed / 1 skipped**. Fully green — the experience-nav / experience-summary / experience-detail / experience-voice-em-dash tests AND the D-26 chat-surface regression battery all pass against the merged diff. |
| 3 | `pnpm sync:experience:check` (SC5c) | PASS | exit **0** — `balfour-beatty.mdx: unchanged`, `holloway.mdx: unchanged`. The D-08 frontmatter normalization introduced zero body drift (the sync script diffs body only). |
| 4 | `pnpm build` + route structure under `dist/client` (EXP-05) | PASS | build exit **0**. Prerendered `/experience/index.html` + `/experience/holloway/index.html`. Asserted against the Cloudflare assets dir (`wrangler.jsonc assets.directory: "./dist/client"`): `dist/client/experience/index.html` EXISTS, `dist/client/experience/holloway/index.html` EXISTS, `dist/client/experience/balfour-beatty` dir **ABSENT**, `dist/client/experience/balfour-beatty/index.html` **ABSENT** (EXP-05 structural proof). `build:chat-context` ran idempotent — `src/data/portfolio-context.json` **unchanged** (experience content does not enter chat until Phase 25). |
| 5 | Build-output HTML backs the 22-01 source tests | PASS | `dist/client/experience/index.html`: all **5/5** Holloway highlight phrases present — `payroll math to the penny`, `cross-tenant data leak`, `wrongly-archived production jobs`, `idempotent geofenced payroll time-clock`, `query-factory` — and the string `experience/balfour-beatty` is **absent** (Balfour non-linked, EXP-05). `dist/client/experience/holloway/index.html`: the `Back to experience` label text appears **exactly 2×** (top + bottom back links, counted by label text not `href="/experience"`). |
| 6 | QA-02 hard dependency lock (T-22-07) | PASS | `git diff --exit-code -- package.json pnpm-lock.yaml` → exit **0**. Zero dependency drift; zero new runtime deps. Working-tree source untouched. |

All Task 1 acceptance criteria satisfied; every gate result recorded above.

## Task 2 — SC5d Human Visual Sign-Off: APPROVED

The blocking `checkpoint:human-verify` was **not self-approved**. A human walked the 9 how-to-verify steps against `pnpm dev` (http://localhost:4321/experience) and **typed "approved"**. The orchestrator additionally browser-verified the objective checks; all pass:

- **Nav (step 2):** `experience` shows FIRST with the `aria-current` accent active state on `/experience`; the four-item nav does **NOT** wrap/crowd/overflow at **1024px** or **768px** (463px wordmark clearance measured) — closing the REVIEWS 22-02 concern that the MASTER.md nav contract was authored for three links.
- **Listing (steps 3-4):** company reads "Holloway Company" (no leading "The"); Balfour renders as a visibly lighter, **non-linked** "Earlier" entry.
- **Deep-dive (steps 5-6):** H1 "Holloway Company", full Overview + 9 highlights + Themes body, **no external-links row**, exactly **2** "Back to experience" links.
- **Structure (step 7):** `/experience/balfour-beatty` returns **404** (EXP-05).
- **Content/voice (steps 8-9):** overall look conforms to MASTER.md (six tokens, Geist fonts, restrained motion, visible focus rings); **zero em dashes** on both pages (en dashes in date ranges are fine). No confidential-contract data / credentials / PII / internal URLs in rendered copy (T-22-03 content check held).

## Frontend-Design Attribution Confirmation (SC5d)

The SC5d sign-off confirms the frontend-design decisions recorded in the Wave 2 summaries were upheld in the rendered pages:

- **22-03 (listing):** tier differentiation by TYPE REGISTER (not borders/shadows) — Holloway on the display/`.lead` ramp with the accent CTA, Balfour entirely mono/muted; highlights as a hairline `1px --rule` "ledger" (parallel, not numbered); the "EARLIER" label-on-rule divider; accent reserved solely for the deep-dive link + its focus ring.
- **22-04 (detail):** the D-02 back link with a **persistent** leading `←` (color-only `--ink-muted → --accent`, no reveal, no translate), identical top+bottom affordance differing only by container closure; the three page-scoped prose rules (h3 weight/margin-asymmetry subheads, quiet blockquote, hairline `hr`) staying inside `.prose-editorial` with six tokens only; external-links row omitted (D-07).

Both attributions confirmed against the running pages by the human + orchestrator browser verification.

## must_haves Truths — All Satisfied

- [x] `pnpm build` emits `dist/client/experience/index.html` + `dist/client/experience/holloway/index.html` and NO `dist/client/experience/balfour-beatty` (verified against `wrangler.jsonc assets.directory=./dist/client`).
- [x] Built HTML backs the 22-01 source tests: listing shows all 5 Holloway highlights and no Balfour case-study link; deep-dive shows `Back to experience` twice.
- [x] `pnpm exec astro check` exits 0/0 (1 acceptable pre-existing hint); `pnpm test` fully green incl. the D-26 chat-surface battery; `pnpm sync:experience:check` exits 0.
- [x] `package.json` + `pnpm-lock.yaml` byte-identical to phase start (QA-02: `git diff --exit-code` exits 0, zero new runtime deps).
- [x] A human confirms both pages render per the frontend-design skill's decisions against MASTER.md + 22-UI-SPEC.md (SC5), including the four-item nav at 768px and 1024px.

## Deviations from Plan

None. Verification-only plan executed exactly as written — all gates run, all results recorded, the blocking checkpoint honored (no self-approval), the human approved. No Rule 1-3 auto-fixes were needed (no source touched); no Rule 4 architectural decisions arose; no authentication gates.

## Known Stubs

None. No source produced; the phase renders live collection data (confirmed in 22-03/22-04, re-verified here through the built HTML).

## Threat Flags

None new. This gate is where the merged nav + page + styling diff was verified against the D-26 chat-surface battery (T-22-04 mitigated — battery green, no self-approval), the QA-02 dependency lock (T-22-07 mitigated — exit 0), and the human content check for confidential-contract data in the rendered deep-dive (T-22-03 mitigated — none found). T-22-SC (npm/pip/cargo installs) confirmed accept: no installs anywhere in the phase; QA-02 byte-identical lock verified.

## Verification Results

- astro check → 0 errors / 0 warnings / 1 acceptable pre-existing hint.
- pnpm test → 623 passed / 2 skipped (70 files passed / 1 skipped) — incl. D-26 battery.
- sync:experience:check → exit 0.
- pnpm build → success; `dist/client/experience/{index,holloway/index}.html` present, `balfour-beatty` absent.
- Built-HTML → 5/5 highlight phrases, no balfour link, 2× "Back to experience".
- QA-02 → `git diff --exit-code -- package.json pnpm-lock.yaml` exit 0.
- SC5d → human APPROVED; orchestrator browser-verified all 9 how-to-verify steps.

## Requirements Satisfied

- **EXP-02** — `/experience` route reachable and rendering the collection (built-HTML confirmed).
- **EXP-03** — Holloway 30-second payload (meta + summary + 5 highlights + deep-dive link) confirmed in built HTML + human sign-off.
- **EXP-04** — Holloway deep-dive at `/experience/holloway` with top+bottom back links confirmed.
- **EXP-05** — Balfour structurally excluded: no `/experience/balfour-beatty` route (404), no case-study link in listing.

## Self-Check: PASSED

- FOUND: .planning/phases/22-experience-page-holloway-case-study/22-05-SUMMARY.md
- FOUND: dist/client/experience/index.html (build output)
- FOUND: dist/client/experience/holloway/index.html (build output)
- CONFIRMED ABSENT: dist/client/experience/balfour-beatty
- Verification-only plan — no per-task source commits (files_modified: []); the docs commit below records the gate result.
