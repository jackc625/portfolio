---
phase: 24
slug: positioning-shift-home-teaser
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-11
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `24-RESEARCH.md` §Validation Architecture (Gates A–E). This phase's headline Nyquist win: converting the D-18 em-dash/register manual guardrail into an automated source-scan gate over the files the existing voice gates do NOT scan (`src/data/*.ts`, `index.astro`, `about.astro`).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 (`globals: true`, `environment: "node"`, `include: ["tests/**/*.test.ts"]`; jsdom opted-in per file via `// @vitest-environment jsdom`) |
| **Config file** | `vitest.config.ts` (present — no framework install needed; jsdom present) |
| **Quick run command** | `pnpm exec vitest run tests/content/site-copy-em-dash.test.ts tests/content/education-module.test.ts tests/client/about-data.test.ts` |
| **Full suite command** | `pnpm build && pnpm test && pnpm exec astro check` |
| **Estimated runtime** | ~10 s (source/unit gates) · +build (~60–120 s) for the jsdom render gates B/C |

---

## Sampling Rate

- **After every task commit:** Run the quick command (source/unit gates — catch em-dash / register / word-count / module regressions immediately).
- **After every plan wave (or any page edit):** `pnpm build` then `pnpm test` (runs the jsdom render gates B/C against fresh `dist/`) + `pnpm exec astro check`.
- **Before `/gsd-verify-work`:** Full suite green (incl. the untouched D-26 chat battery + `sse-snapshot.test.ts`), `astro check` 0/0/0, `pnpm build` succeeds, and `node scripts/verify-phase24-invariants.mjs` exits 0 -- the authoritative phase-wide check that every D-19/D-17 protected file hash + the `package.json` dependencies object match the 24-01 phase-start baseline (review fix #4: this replaces the working-tree `git diff`/`git status` checks, which read clean after per-task commits). If a protected file legitimately changed, the D-19 fallback battery must have run.
- **Max feedback latency:** ~10 s (source/unit tier); render gates gated on a build.

---

## Per-Task Verification Map

> `Authored In` records the FINAL gate-to-plan/task assignment after the cross-AI review restructuring (WARNING 2). Every gate is authored in the plan whose implementation makes it GREEN at its own task boundary (review fix #1), so no gate is left intentionally RED. `File Exists`/`Status` remain pending until the phase is executed.

| Gate | Requirement / Guardrail | Behavior to prove | Test Type | Automated Command | Authored In | File Exists | Status |
|------|-------------------------|-------------------|-----------|-------------------|-------------|-------------|--------|
| A | POS-01/02, D-18 | Zero `—` em dash + no `junior`/`senior`/`5+ years` in `about.ts`, `education.ts`, `index.astro`, `about.astro`, `ContactSection.astro` | source-scan (node) | `pnpm exec vitest run tests/content/site-copy-em-dash.test.ts` | **24-04 · Task 2** | ❌ Wave 0 | ⬜ pending |
| — | POS-02 | `ABOUT_P1/P2/P3` ≤ 80 words; all four exports truthy | unit | `tests/client/about-data.test.ts` (EXISTING — re-run vs revised copy) | **24-03 · Task 1** (existing) | ✅ | ⬜ pending |
| B | HOME-01, D-01, D-08 | Home renders `§ 01 EXPERIENCE / 02 WORK / 03 ABOUT / 04 CONTACT` in order; teaser `<a href="/experience">` contains metric `1,400`; hero `.hero-lead` string unchanged (D-08 invariant, WARNING 1) | render (jsdom) | `tests/build/home-teaser-render.test.ts` | **24-02 · Task 3** | ❌ Wave 0 | ⬜ pending |
| C | POS-04 | Rendered `ld+json` parses; `@type=Person`, `jobTitle`, `alumniOf` (WGU+VT), `hasCredential` (LPI + WGU degree, VT excluded) | render (jsdom) | Gate B's file (`home-teaser-render.test.ts`) | **24-02 · Task 3** | ❌ Wave 0 | ⬜ pending |
| D | POS-03, POS-04 | `education.ts` exports facts + schema fragments; VT NOT in `hasCredential`; VT IS in `alumniOf` | unit (node) | `tests/content/education-module.test.ts` | **24-01 · Task 1** | ❌ Wave 0 | ⬜ pending |
| E | D-19 | `BaseLayout.astro` canonical-anchor tripwire (SEO anchors + ChatWidget import/render + pageswap handler + 3 client-script imports), strengthened; `portfolio-context.json` byte-identical via the baseline verifier | source/regression | `tests/build/chat-surface-untouched.test.ts` (authored + strengthened) + `scripts/verify-phase24-invariants.mjs` + existing `sse-snapshot.test.ts` / `chat-context-integrity.test.ts` | **24-01 · Task 2** | ❌ Wave 0 | ⬜ pending |
| — | QA | `astro check` 0/0/0 | typecheck | `pnpm exec astro check` | **all plans** (each build/verify) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/data/education.ts` — the module itself (facts + `alumniOfSchema` / `hasCredentialSchema` fragments) must exist before Gate D can pass (RED until built)
- [ ] `tests/content/site-copy-em-dash.test.ts` — Gate A (em-dash + register on the gate-UNSCANNED files) — covers D-18, POS-01/02
- [ ] `tests/build/home-teaser-render.test.ts` — Gates B + C (section-number sequence + teaser link + JSON-LD parse) — covers HOME-01, D-01, POS-04
- [ ] `tests/content/education-module.test.ts` — Gate D (education module + schema fragments) — covers POS-03, POS-04
- [ ] `tests/build/chat-surface-untouched.test.ts` — Gate E (D-19 tripwire, strengthened) — authored in 24-01 Task 2 (no longer optional after the review restructuring)
- Framework install: **none needed** (vitest + jsdom already present).

*Existing infra reused as-is: `about-data.test.ts` (word-count/truthy), `sse-snapshot.test.ts` (D-15 byte-identical), `chat-context-integrity.test.ts` + `chat-knowledge-voice.test.ts` (chat regression), the full D-26 battery.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| JSON-LD schema.org validity (beyond JSON.parse + shape) | POS-04 / D-14 | Full schema.org conformance is not automatable offline | Run the built Home page through the Schema Markup Validator (validator.schema.org), NOT the Google Rich Results Test -- Rich Results checks rich-result *eligibility* and Google's profile feature expects `ProfilePage` with `Person` as `mainEntity`, whereas this site emits a standalone `Person` (review fix #6); confirm the Person entity parses with no errors (human checkpoint) |
| OG card visual content (`public/og-default.png`) | POS-04 / D-16 | Aesthetic/editorial judgment, not assertable | frontend-design designs the 1200×630 card against MASTER.md; confirm dims + on-palette + Geist type; Jack reviews |
| Final copy wording (`ABOUT_INTRO/P1/P3`, teaser sentence + metric, SEO description, education labels) | POS-01/02/03 | Voice/tone is subjective (Claude drafts, Jack reviews) | Jack reviews the drafted strings for accuracy and register before merge |
| frontend-design 6-pillar sign-off | D-20 | Visual quality gate is an aesthetic review | Route teaser form, education block, `/about` layout, OG card through the frontend-design skill; record PASS on all six pillars |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (the sole human checkpoint, 24-04 Task 3, uses `<human-check>` per `human_verify_mode`)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Gates A, B/C, D + `education.ts`) — every gate assigned to an owning plan·task (see map)
- [x] No watch-mode flags (all suites use `vitest run`)
- [x] Feedback latency < 15s (source/unit tier)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** Validation strategy reconciled with the revised plan set — cross-AI review incorporated (0 blockers) and the WARNING-2 restructuring is complete (gate-to-plan map + frontmatter/sign-off current). `wave_0_complete` stays `false` until the phase is executed (test files are authored during execution, not yet built).
