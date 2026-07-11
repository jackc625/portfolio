---
phase: 24
slug: positioning-shift-home-teaser
status: draft
nyquist_compliant: false
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
- **Before `/gsd-verify-work`:** Full suite green (incl. the untouched D-26 chat battery + `sse-snapshot.test.ts`), `astro check` 0/0/0, `pnpm build` succeeds, `git diff` shows no `BaseLayout.astro`/`global.css` change (or the D-19 fallback battery ran), `package.json` dependencies byte-identical.
- **Max feedback latency:** ~10 s (source/unit tier); render gates gated on a build.

---

## Per-Task Verification Map

> The planner assigns concrete `{N}-PP-TT` task IDs; populate this table from the Requirement → Gate pre-map below. Every gate is Wave 0 RED until its target file is authored, then drives the task GREEN.

| Gate | Requirement / Guardrail | Behavior to prove | Test Type | Automated Command | File Exists | Status |
|------|-------------------------|-------------------|-----------|-------------------|-------------|--------|
| A | POS-01/02, D-18 | Zero `—` em dash + no `junior`/`senior`/`5+ years` in `about.ts`, `education.ts`, `index.astro`, `about.astro` | source-scan (node) | `pnpm exec vitest run tests/content/site-copy-em-dash.test.ts` | ❌ Wave 0 | ⬜ pending |
| — | POS-02 | `ABOUT_P1/P2/P3` ≤ 80 words; all four exports truthy | unit | `tests/client/about-data.test.ts` (EXISTING — re-run vs revised copy) | ✅ | ⬜ pending |
| B | HOME-01, D-01 | Home renders `§ 01 EXPERIENCE / 02 WORK / 03 ABOUT / 04 CONTACT` in order; teaser `<a href="/experience">` contains metric `1,400` | render (jsdom) | `tests/build/home-teaser-render.test.ts` | ❌ Wave 0 | ⬜ pending |
| C | POS-04 | Rendered `ld+json` parses; `@type=Person`, `jobTitle`, `alumniOf` (WGU+VT), `hasCredential` (LPI + WGU degree, VT excluded) | render (jsdom) | Gate B's file (or own) | ❌ Wave 0 | ⬜ pending |
| D | POS-03, POS-04 | `education.ts` exports facts + schema fragments; VT NOT in `hasCredential`; VT IS in `alumniOf` | unit (node) | `tests/content/education-module.test.ts` | ❌ Wave 0 | ⬜ pending |
| E | D-19 | `BaseLayout.astro` / `global.css` untouched (canonical-anchor tripwire); `portfolio-context.json` byte-identical | source/regression | `tests/build/chat-surface-untouched.test.ts` (optional) + existing `sse-snapshot.test.ts` / `chat-context-integrity.test.ts` | partial ✅ / ❌ | ⬜ pending |
| — | QA | `astro check` 0/0/0 | typecheck | `pnpm exec astro check` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/data/education.ts` — the module itself (facts + `alumniOfSchema` / `hasCredentialSchema` fragments) must exist before Gate D can pass (RED until built)
- [ ] `tests/content/site-copy-em-dash.test.ts` — Gate A (em-dash + register on the gate-UNSCANNED files) — covers D-18, POS-01/02
- [ ] `tests/build/home-teaser-render.test.ts` — Gates B + C (section-number sequence + teaser link + JSON-LD parse) — covers HOME-01, D-01, POS-04
- [ ] `tests/content/education-module.test.ts` — Gate D (education module + schema fragments) — covers POS-03, POS-04
- [ ] *(Optional)* `tests/build/chat-surface-untouched.test.ts` — Gate E (D-19 tripwire)
- Framework install: **none needed** (vitest + jsdom already present).

*Existing infra reused as-is: `about-data.test.ts` (word-count/truthy), `sse-snapshot.test.ts` (D-15 byte-identical), `chat-context-integrity.test.ts` + `chat-knowledge-voice.test.ts` (chat regression), the full D-26 battery.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| JSON-LD schema.org validity (beyond JSON.parse + shape) | POS-04 / D-14 | Full schema.org conformance is not automatable offline | Run the built Home page through the Google Rich Results Test once; confirm Person entity parses with no errors (human checkpoint) |
| OG card visual content (`public/og-default.png`) | POS-04 / D-16 | Aesthetic/editorial judgment, not assertable | frontend-design designs the 1200×630 card against MASTER.md; confirm dims + on-palette + Geist type; Jack reviews |
| Final copy wording (`ABOUT_INTRO/P1/P3`, teaser sentence + metric, SEO description, education labels) | POS-01/02/03 | Voice/tone is subjective (Claude drafts, Jack reviews) | Jack reviews the drafted strings for accuracy and register before merge |
| frontend-design 6-pillar sign-off | D-20 | Visual quality gate is an aesthetic review | Route teaser form, education block, `/about` layout, OG card through the frontend-design skill; record PASS on all six pillars |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (Gates A, B/C, D + `education.ts`)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s (source/unit tier)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
