---
phase: 24
slug: positioning-shift-home-teaser
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-11
validated: 2026-07-14
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

> `Authored In` records the FINAL gate-to-plan/task assignment after the cross-AI review restructuring (WARNING 2). Every gate is authored in the plan whose implementation makes it GREEN at its own task boundary (review fix #1), so no gate is left intentionally RED. `File Exists`/`Status` reconciled to the executed state by the 2026-07-14 validation audit (all files present on disk, all gates re-run GREEN — see Validation Audit below). Gates F and G were added during execution and were not in the plan-time map.

| Gate | Requirement / Guardrail | Behavior to prove | Test Type | Automated Command | Authored In | File Exists | Status |
|------|-------------------------|-------------------|-----------|-------------------|-------------|-------------|--------|
| A | POS-01/02, D-18 | Zero `—` em dash + no `junior`/`senior`/`5+ years` in `about.ts`, `education.ts`, `index.astro`, `about.astro`, `ContactSection.astro` | source-scan (node) | `pnpm exec vitest run tests/content/site-copy-em-dash.test.ts` | **24-04 · Task 2** | ✅ | ✅ green |
| — | POS-02 | `ABOUT_P1/P2/P3` ≤ 80 words; all four exports truthy | unit | `tests/client/about-data.test.ts` (EXISTING — re-run vs revised copy) | **24-03 · Task 1** (existing) | ✅ | ✅ green |
| B | HOME-01, D-01, D-08 | Home renders `§ 01 EXPERIENCE / 02 WORK / 03 ABOUT / 04 CONTACT` in order; teaser `<a href="/experience">` contains metric `1,400`; hero `.hero-lead` string unchanged (D-08 invariant, WARNING 1) | render (jsdom) | `tests/build/home-teaser-render.test.ts` | **24-02 · Task 3** | ✅ | ✅ green |
| C | POS-04 | Rendered `ld+json` parses; `@type=Person`, `jobTitle`, `alumniOf` (WGU+VT), `hasCredential` (LPI + WGU degree, VT excluded) | render (jsdom) | Gate B's file (`home-teaser-render.test.ts`) | **24-02 · Task 3** | ✅ | ✅ green |
| D | POS-03, POS-04 | `education.ts` exports facts + schema fragments; VT NOT in `hasCredential`; VT IS in `alumniOf` | unit (node) | `tests/content/education-module.test.ts` | **24-01 · Task 1** | ✅ | ✅ green |
| E | D-19 | `BaseLayout.astro` canonical-anchor tripwire (SEO anchors + ChatWidget import/render + pageswap handler + 3 client-script imports), strengthened; `portfolio-context.json` byte-identical via the baseline verifier | source/regression | `tests/build/chat-surface-untouched.test.ts` (authored + strengthened) + `scripts/verify-phase24-invariants.mjs` + existing `sse-snapshot.test.ts` / `chat-context-integrity.test.ts` | **24-01 · Task 2** | ✅ | ✅ green |
| F | POS-03 | Rendered `/about` Education block shows all four visible facts (WGU B.S. CS · May 2026 · VT transfer sub-note · LPI Linux Essentials); block is non-interactive (no accent affordance) | render (jsdom) | `tests/build/about-education-render.test.ts` | **24-03 · Task 2** | ✅ | ✅ green |
| G | POS-04, D-16 | `public/og-default.png` is a real, distinct 1200×630 PNG: valid signature + IHDR dims + ≤512KB + SHA-256 differs from the phase-start placeholder hash | asset regression (node) | `node scripts/verify-phase24-og.mjs` | **24-04 · Task 1** | ✅ | ✅ green |
| — | QA | `astro check` 0/0/0 | typecheck | `pnpm exec astro check` | **all plans** (each build/verify) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/data/education.ts` — the module itself (facts + `alumniOfSchema` / `hasCredentialSchema` fragments) must exist before Gate D can pass — **built (24-01)**
- [x] `tests/content/site-copy-em-dash.test.ts` — Gate A (em-dash + register on the gate-UNSCANNED files) — covers D-18, POS-01/02 — **GREEN**
- [x] `tests/build/home-teaser-render.test.ts` — Gates B + C (section-number sequence + teaser link + JSON-LD parse) — covers HOME-01, D-01, POS-04 — **GREEN**
- [x] `tests/content/education-module.test.ts` — Gate D (education module + schema fragments) — covers POS-03, POS-04 — **GREEN**
- [x] `tests/build/chat-surface-untouched.test.ts` — Gate E (D-19 tripwire, strengthened) — authored in 24-01 Task 2 — **GREEN**
- Framework install: **none needed** (vitest + jsdom already present).

*Added during execution (not in the plan-time Wave 0 list): `tests/build/about-education-render.test.ts` (Gate F, POS-03 render regression, 24-03) and `scripts/verify-phase24-og.mjs` (Gate G, POS-04/D-16 OG asset regression, 24-04). Both GREEN.*

*Existing infra reused as-is: `about-data.test.ts` (word-count/truthy), `sse-snapshot.test.ts` (D-15 byte-identical), `chat-context-integrity.test.ts` + `chat-knowledge-voice.test.ts` (chat regression), the full D-26 battery.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| JSON-LD schema.org validity (beyond JSON.parse + shape) | POS-04 / D-14 | Full schema.org conformance is not automatable offline | Run the built Home page through the Schema Markup Validator (validator.schema.org), NOT the Google Rich Results Test -- Rich Results checks rich-result *eligibility* and Google's profile feature expects `ProfilePage` with `Person` as `mainEntity`, whereas this site emits a standalone `Person` (review fix #6); confirm the Person entity parses with no errors (human checkpoint) |
| OG card visual content (`public/og-default.png`) | POS-04 / D-16 | Aesthetic/editorial judgment, not assertable (structural properties — real distinct 1200×630 PNG within size cap — are now automated by Gate G / `verify-phase24-og.mjs`; only visual fidelity remains manual) | frontend-design designs the 1200×630 card against MASTER.md; confirm on-palette + true Geist type + accent-red period; Jack reviews (recorded APPROVED in 24-04 Task 3 sign-off #4) |
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

**Approval:** Validation strategy reconciled with the revised plan set — cross-AI review incorporated (0 blockers) and the WARNING-2 restructuring is complete (gate-to-plan map + frontmatter/sign-off current). Phase executed and validated: `wave_0_complete: true`, all seven gates (A–G) + QA GREEN as of the 2026-07-14 validation audit.

---

## Validation Audit 2026-07-14

State A audit of the executed phase. The plan-time map recorded every gate as `❌ Wave 0 / ⬜ pending`; all referenced test files and verifier scripts were confirmed present on disk and re-run independently (not trusting SUMMARY narrative). No coverage gaps found — the phase is fully automated-covered, and in fact carries two automated gates (F, G) beyond the plan-time map.

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Tests generated | 0 |
| Map rows reconciled (pending → green) | 6 |
| Gates recorded that were missing from the plan-time map | 2 (F: `about-education-render.test.ts`; G: `verify-phase24-og.mjs`) |

**Audit re-run evidence (2026-07-14):**
- `pnpm exec vitest run` over the 6 phase-24 gate files → **6 files / 43 tests passed**
- `node scripts/verify-phase24-invariants.mjs` → exit 0 ("8 protected files + dependencies match the phase-start baseline")
- `node scripts/verify-phase24-og.mjs` → exit 0 ("real 1200×630 PNG, size within cap, distinct from the phase-start placeholder")
- `pnpm exec astro check` → 138 files, 0 errors / 0 warnings / 0 hints

**Verdict:** Phase 24 is Nyquist-compliant. Every requirement (POS-01/02/03/04, HOME-01) and guardrail (D-18, D-19, D-16, D-01, D-08, QA) has automated verification that is GREEN at audit time. The four Manual-Only items remain genuinely subjective (copy tone, OG visual fidelity, frontend-design 6-pillar) and were signed off during 24-04 Task 3.
