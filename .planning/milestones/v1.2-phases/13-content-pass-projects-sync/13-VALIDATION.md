---
phase: 13
slug: content-pass-projects-sync
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-16
validated: 2026-04-19
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 (already installed; node environment) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test && pnpm check` |
| **Estimated runtime** | ~5–10 seconds (unit suite); ~25–35 seconds with `astro check`; ~50–70 seconds with `pnpm build` |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test` (full Vitest run; few-second feedback loop)
- **After every plan wave:** Run `pnpm test && pnpm check`
- **Before `/gsd-verify-work`:** `pnpm test && pnpm check && pnpm build && pnpm sync:check` all green; manual UAT against `13-UAT.md` complete; Phase 7 chat regression battery green (D-26 trigger)
- **Max feedback latency:** 10 seconds per-commit; 70 seconds per-wave

---

## Per-Task Verification Map

> Task IDs are filled by the planner. Every plan task referencing a CONT-XX requirement MUST link to one of the validators below or be a Wave 0 dependency that creates the validator first.

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| CONT-01 | All 6 MDX bodies have non-empty content; no placeholder prose | unit | `pnpm vitest tests/content/case-studies-have-content.test.ts -x` | ✅ exists | ✅ green |
| CONT-02 | All 6 MDX bodies have 5 H2s in locked D-01 order (Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings) | unit | `pnpm vitest tests/content/case-studies-shape.test.ts -x` | ✅ exists | ✅ green |
| CONT-02 | All 6 MDX bodies fall in 600–900 word band (warn-not-fail per D-16) | unit | `pnpm vitest tests/content/case-studies-wordcount.test.ts -x` | ✅ exists | ✅ green |
| CONT-02 | None of the D-11 Rule 1 banlist words appear in MDX bodies | unit | `pnpm vitest tests/content/voice-banlist.test.ts -x` | ✅ exists | ✅ green |
| CONT-03 | About copy exports remain non-empty strings; dated `/* Verified: YYYY-MM-DD */` annotations present | unit | `pnpm vitest tests/client/about-data.test.ts -x` | ✅ exists (annotation check extended) | ✅ green |
| CONT-04 | Homepage WorkRow count matches `featured: true` count (3); detail pages exist for all 6 | integration | `pnpm vitest tests/content/projects-collection.test.ts -x` | ✅ exists | ✅ green |
| CONT-04 | Resume PDF exists at `public/jack-cutrara-resume.pdf` and is < 1 MB | unit | `pnpm vitest tests/content/resume-asset.test.ts -x` | ✅ exists | ✅ green |
| CONT-05 | Every MDX `source:` value points to an existing file in `Projects/` | unit | `pnpm vitest tests/content/source-files-exist.test.ts -x` | ✅ exists | ✅ green |
| CONT-06 | `scripts/sync-projects.mjs` parses MDX frontmatter without re-serializing | unit | `pnpm vitest tests/scripts/sync-projects.test.ts -x` | ✅ exists | ✅ green |
| CONT-06 | `scripts/sync-projects.mjs` extracts fenced case-study block (happy path + edge cases) | unit | `pnpm vitest tests/scripts/sync-projects.test.ts -x` | ✅ exists (same file) | ✅ green |
| CONT-06 | Sync is idempotent — second run with no source changes produces zero writes | unit | `pnpm vitest tests/scripts/sync-projects-idempotency.test.ts -x` | ✅ exists | ✅ green |
| CONT-06 | `--check` mode exits 1 when drift exists, 0 otherwise | unit | `pnpm vitest tests/scripts/sync-projects-check.test.ts -x` | ✅ exists | ✅ green |
| CONT-06 | Path-traversal guard rejects `source:` paths outside project root | unit | `pnpm vitest tests/scripts/sync-projects.test.ts -x` | ✅ exists (same file) | ✅ green |
| CONT-06 | Zod schema accepts `source` field; rejects MDX without it | integration | `pnpm check` | ✅ existing build step | ✅ green |
| CONT-06 | After rename, `dist/client/projects/daytrade/` exists; `dist/client/projects/crypto-breakout-trader/` does not | smoke (build) | `pnpm build && test -d dist/client/projects/daytrade && test ! -d dist/client/projects/crypto-breakout-trader` | ✅ one-time at phase gate | ✅ green (phase-gate build) |
| CONT-07 | `docs/CONTENT-SCHEMA.md` exists and contains all four sections from D-17 | unit | `pnpm vitest tests/content/docs-content-schema.test.ts -x` | ✅ exists | ✅ green |
| CONT-07 | `docs/VOICE-GUIDE.md` exists and contains all four hard rules from D-11 | unit | `pnpm vitest tests/content/docs-voice-guide.test.ts -x` | ✅ exists | ✅ green |
| D-02 (cross-cutting) | `.planning/ROADMAP.md` Phase 13 success criterion #1 reflects 5-H2 shape (not 6) | unit | `pnpm vitest tests/content/roadmap-amendment.test.ts -x` | ✅ exists | ✅ green |
| D-26 (cross-cutting) | Chat widget answers "Daytrade" project question correctly after `portfolio-context.json` patch | manual UAT | n/a — Phase 7 regression battery | ✅ existing manual procedure | ✅ signed off (13-09 SUMMARY) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Test infrastructure exists (Vitest 4.1.0 installed; `tests/api/` and `tests/client/` patterns established). New test files this phase must create before Wave 1 can verify:

- [x] `tests/scripts/sync-projects.test.ts` — frontmatter parser + fence extractor + path-traversal guard (CONT-06)
- [x] `tests/scripts/sync-projects-idempotency.test.ts` — second-run zero-write invariant (CONT-06)
- [x] `tests/scripts/sync-projects-check.test.ts` — `--check` exit-code semantics (CONT-06)
- [x] `tests/content/case-studies-have-content.test.ts` — body non-emptiness (CONT-01)
- [x] `tests/content/case-studies-shape.test.ts` — 5-H2 order check (CONT-02)
- [x] `tests/content/case-studies-wordcount.test.ts` — 600–900 word soft band (CONT-02; warn-not-fail)
- [x] `tests/content/voice-banlist.test.ts` — D-11 Rule 1 banlist enforcement (CONT-02)
- [x] `tests/content/projects-collection.test.ts` — `featured` count + detail-page existence via `getCollection` (CONT-04)
- [x] `tests/content/resume-asset.test.ts` — `public/jack-cutrara-resume.pdf` exists + size sanity (CONT-04)
- [x] `tests/content/source-files-exist.test.ts` — `source:` ↔ `Projects/*.md` integrity (CONT-05)
- [x] `tests/content/docs-content-schema.test.ts` — `docs/CONTENT-SCHEMA.md` four-section presence (CONT-07)
- [x] `tests/content/docs-voice-guide.test.ts` — `docs/VOICE-GUIDE.md` four-rule presence (CONT-07)
- [x] `tests/content/roadmap-amendment.test.ts` — `.planning/ROADMAP.md` 5-H2 amendment regex (D-02)
- [x] `tests/content/voice-em-dash.test.ts` — em-dash paragraph cap added post-review (WR-01, Plan 13 code-review fix)

Framework install: **none required** — Vitest 4.1.0 + tests directory + config already in place. Existing tests in `tests/api/` and `tests/client/` are the patterns to copy.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Resume PDF page-by-page copy reflects current status | CONT-03 | PDF body text not grep-able from a Vitest test (binary asset) | Open `public/jack-cutrara-resume.pdf` in viewer; verify name, role, dates, projects, tech list, contact match `13-UAT.md` checklist as of 2026-04-16; sign off in `13-UAT.md` |
| About narrative reads as Jack's voice (not AI-generated) | CONT-03 | Voice quality is a human judgment | Open `/about`, read full narrative; confirm first-person past-tense, no banlist words, named systems present; sign off in `13-UAT.md` |
| Each of 6 case studies reads as Jack's voice and is technically accurate | CONT-01, CONT-02 | Technical accuracy + voice are human judgments; redline cycle is the quality gate per D-07 | For each MDX body: Jack reads draft, redlines on first pass; final acceptance = sign-off line in `13-UAT.md` per project |
| Homepage display hero + status dot + meta label + 3 work-list rows + about strip reflect current state | CONT-03, CONT-04 | Composite UI surface; visual + copy correctness | Open `/`; verify each surface against `13-UAT.md` enumerated items; sign off |
| Chat widget regression — "Tell me about Jack's Daytrade project" answers correctly | D-26 (Phase 12 gate) | Live LLM response; not deterministic enough for automated equality check | Run Phase 7 manual chat regression battery from `.planning/phases/07-*/07-VERIFICATION.md`; verify Daytrade answers reference correct slug + project description |
| `pnpm build` produces `dist/client/projects/daytrade/` (and not `crypto-breakout-trader/`) | CONT-04 (rename) | Build artifact check; expensive to run on every commit | One-time at phase gate: `pnpm build && ls dist/client/projects/` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (planner enforces in PLAN.md)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (plan-checker enforces)
- [x] Wave 0 covers all MISSING references (13 new test files delivered + 1 follow-on for WR-01)
- [x] No watch-mode flags (all commands use `vitest run` semantics via `pnpm test` or `-x` flag)
- [x] Feedback latency < 10s per-commit (Vitest unit suite: 3.23s for 163 tests on 2026-04-19)
- [x] D-26 chat regression battery run at phase gate (3-question smoke captured in 13-09 SUMMARY)
- [x] `nyquist_compliant: true` set in frontmatter — every requirement row maps to a green test or closed manual-only row

**Approval:** validated — 2026-04-19

---

## Validation Audit 2026-04-19

| Metric | Count |
|--------|-------|
| Requirements audited | 19 |
| Automated + green | 17 |
| Manual-only (sign-off captured) | 2 (CONT-03 resume PDF copy; D-26 chat smoke) |
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Evidence snapshot (2026-04-19 21:21 local):**
- `pnpm test` → 24 files / 163 tests / 0 failed / 3.23s
- `pnpm check` → 0 errors / 0 warnings / 0 hints (per 13-VERIFICATION.md)
- `pnpm sync:check` → exit 0, all 6 MDX "unchanged"
- `pnpm build` → success, 11 routes prerendered, `dist/client/projects/daytrade/` present, `crypto-breakout-trader/` absent
- Jack's 14/14 batch UAT (13-UAT.md, 2026-04-19) + D-26 chat smoke transcripts (13-09 SUMMARY) sign off every manual-only row

No gaps to fill — every Wave-0 test file exists and passes. Statuses flipped from ⬜ pending to ✅ green; Wave 0 checklist flipped to [x]; frontmatter `nyquist_compliant: true`.
