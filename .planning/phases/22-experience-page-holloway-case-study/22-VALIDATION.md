---
phase: 22
slug: experience-page-holloway-case-study
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-09
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 (`vitest run`) |
| **Config file** | present (repo runs `pnpm test` — 560 tests / 2 skip at v1.3 close) |
| **Quick run command** | `pnpm exec astro check` (type gate, ~seconds) |
| **Full suite command** | `pnpm test` (includes the D-26 chat-surface battery) |
| **Estimated runtime** | ~30-60 seconds full suite; astro check ~seconds |

Additional gates:
- **Build gate:** `pnpm build` (runs `build:chat-context` → `wrangler types` → `astro check` → `astro build`; proves routes generate).
- **Content/drift gate:** `pnpm sync:experience:check` (must stay 0 after the D-08 frontmatter edit).

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec astro check` (catches field-name/prop errors immediately, e.g. Pitfall 2 `year` vs `dateRange`).
- **After every plan wave:** Run `pnpm test` + `pnpm sync:experience:check` (regression + drift).
- **Before `/gsd-verify-work`:** Full suite + `pnpm build` green (Wave 3 / plan 22-05).
- **Max feedback latency:** ~60 seconds (full suite).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | EXP-02 | T-22-01 | Nav-shape test discriminates (RED pre-impl) | unit (source-shape) | `pnpm exec vitest run tests/build/experience-nav.test.ts` | ❌ W0 (this task creates it) | ⬜ pending |
| 22-01-02 | 01 | 1 | EXP-03 | T-22-01 | Summary/D-08 contract encoded | unit (content+source) | `pnpm exec vitest run tests/content/experience-summary.test.ts` | ❌ W0 (this task creates it) | ⬜ pending |
| 22-01-03 | 01 | 1 | EXP-04, EXP-05 | T-22-01 | hasCaseStudy filter contract + Balfour exclusion | unit (content+source) | `pnpm exec vitest run tests/content/experience-detail.test.ts` | ❌ W0 (this task creates it) | ⬜ pending |
| 22-01-04 | 01 | 1 | EXP-03 | T-22-01 | Em-dash guard on experience mdx + new page copy | unit (content) | `pnpm exec vitest run tests/content/experience-voice-em-dash.test.ts` | ❌ W0 (this task creates it) | ⬜ pending |
| 22-02-01 | 02 | 2 | EXP-02 | T-22-04 | Header nav experience-first; chat script untouched | source-shape + type | `pnpm exec astro check` | ✅ (22-01) | ⬜ pending |
| 22-02-02 | 02 | 2 | EXP-02 | T-22-04 | MobileMenu nav mirrored; focus-trap/inert `<script>` byte-identical | source-shape | `pnpm exec vitest run tests/build/experience-nav.test.ts` | ✅ (22-01) | ⬜ pending |
| 22-03-01 | 03 | 2 | EXP-03 | T-22-01 | D-08 company normalized; no body drift | content/drift | `pnpm sync:experience:check` | ✅ (command) | ⬜ pending |
| 22-03-02 | 03 | 2 | EXP-02, EXP-03, EXP-05 | T-22-05 | Listing two-tier; page-scoped CSS; zero em dashes | content+source | `pnpm exec vitest run tests/content/experience-summary.test.ts tests/content/experience-voice-em-dash.test.ts` | ✅ (22-01) | ⬜ pending |
| 22-04-01 | 04 | 2 | EXP-04, EXP-05 | T-22-06 | getStaticPaths filters hasCaseStudy; dateRange/company/summary header, no links row | type + source | `pnpm exec astro check` | ✅ (22-01) | ⬜ pending |
| 22-04-02 | 04 | 2 | EXP-04, EXP-05 | T-22-05 | MDX body + top/bottom back links + scroll sentinels; global.css untouched | content+source | `pnpm exec vitest run tests/content/experience-detail.test.ts` | ✅ (22-01) | ⬜ pending |
| 22-05-01 | 05 | 3 | EXP-02, EXP-03, EXP-04, EXP-05 | T-22-04, T-22-07 | Full suite (D-26 battery) + build route set + drift + dep lock | build + regression gate | `pnpm exec astro check && pnpm test && pnpm sync:experience:check && pnpm build` | ✅ (commands) | ⬜ pending |
| 22-05-02 | 05 | 3 | EXP-02..05 | T-22-03 | Visual sign-off (frontend-design / MASTER) | manual (human-verify) | `checkpoint:human-verify` | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Created by plan 22-01 (Wave 1, tests-first). No framework install needed — Vitest + the content/build test patterns already exist; each new file mirrors a named analog.

- [ ] `tests/build/experience-nav.test.ts` — asserts `/experience` is FIRST in both `Header.astro` and `MobileMenu.astro` `navLinks`, and each has a `startsWith("/experience")` `isActive` branch (SC1 / EXP-02). Analog: `tests/content/case-studies-shape.test.ts`.
- [ ] `tests/content/experience-summary.test.ts` — asserts `holloway.mdx` company === `"Holloway Company"` (D-08), role/dateRange/non-empty techStack present, `highlights.length === 5`; and `experience.astro` uses `sortExperienceEntries` + links to `/experience/` (SC2 / EXP-03). Analog: `case-studies-shape.test.ts`.
- [ ] `tests/content/experience-detail.test.ts` — asserts the `hasCaseStudy` id set === `["holloway"]` (excludes `balfour-beatty`), and `experience/[id].astro` filters on `hasCaseStudy` + carries a `href="/experience"` back link (SC3 + SC4 / EXP-04, EXP-05). Analog: `tests/content/projects-collection.test.ts` frontmatter-regex idiom.
- [ ] `tests/content/experience-voice-em-dash.test.ts` — NEW file (does not edit the locked `voice-em-dash.test.ts`); asserts zero `—` in both experience mdx bodies and in the two new page files' source once they exist (SC5e). Analog: `tests/content/voice-em-dash.test.ts`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual/layout composition routed through the frontend-design skill against MASTER.md + 22-UI-SPEC.md (asymmetric two-tier, Balfour "Earlier" cue, back-link hover/arrow, focus-ring reconciliation) | SC5d | Aesthetic conformance and "reads as career context, not a second case study" are judgment calls no automated assertion covers | Plan 22-05 Task 2 `checkpoint:human-verify` — steps 1-9 (nav order/active state, Holloway summary payload, Balfour lightweight non-linked, deep-dive header + body + back links, no Balfour route, MASTER conformance, zero em dashes) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (the only manual task, 22-05-02, is preceded and bounded by automated gates)
- [x] Wave 0 covers all MISSING references (4 test files created in plan 22-01)
- [x] No watch-mode flags (all commands use `vitest run` / `astro check` / `pnpm build`)
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-09
