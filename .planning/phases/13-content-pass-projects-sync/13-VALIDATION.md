---
phase: 13
slug: content-pass-projects-sync
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
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
| CONT-01 | All 6 MDX bodies have non-empty content; no placeholder prose | unit | `pnpm vitest tests/content/case-studies-have-content.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| CONT-02 | All 6 MDX bodies have 5 H2s in locked D-01 order (Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings) | unit | `pnpm vitest tests/content/case-studies-shape.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| CONT-02 | All 6 MDX bodies fall in 600–900 word band (warn-not-fail per D-16) | unit | `pnpm vitest tests/content/case-studies-wordcount.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| CONT-02 | None of the D-11 Rule 1 banlist words appear in MDX bodies | unit | `pnpm vitest tests/content/voice-banlist.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| CONT-03 | About copy exports remain non-empty strings; dated `/* Verified: YYYY-MM-DD */` annotations present | unit | `pnpm vitest tests/client/about-data.test.ts -x` | ✅ exists; extend with annotation check | ⬜ pending |
| CONT-04 | Homepage WorkRow count matches `featured: true` count (3); detail pages exist for all 6 | integration | `pnpm vitest tests/content/projects-collection.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| CONT-04 | Resume PDF exists at `public/jack-cutrara-resume.pdf` and is < 1 MB | unit | `pnpm vitest tests/content/resume-asset.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| CONT-05 | Every MDX `source:` value points to an existing file in `Projects/` | unit | `pnpm vitest tests/content/source-files-exist.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| CONT-06 | `scripts/sync-projects.mjs` parses MDX frontmatter without re-serializing | unit | `pnpm vitest tests/scripts/sync-projects.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| CONT-06 | `scripts/sync-projects.mjs` extracts fenced case-study block (happy path + edge cases) | unit | `pnpm vitest tests/scripts/sync-projects.test.ts -x` | ❌ Wave 0 (same file) | ⬜ pending |
| CONT-06 | Sync is idempotent — second run with no source changes produces zero writes | unit | `pnpm vitest tests/scripts/sync-projects-idempotency.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| CONT-06 | `--check` mode exits 1 when drift exists, 0 otherwise | unit | `pnpm vitest tests/scripts/sync-projects-check.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| CONT-06 | Path-traversal guard rejects `source:` paths outside project root | unit | `pnpm vitest tests/scripts/sync-projects.test.ts -x` | ❌ Wave 0 (same file) | ⬜ pending |
| CONT-06 | Zod schema accepts `source` field; rejects MDX without it | integration | `pnpm check` | ✅ existing build step | ⬜ pending |
| CONT-06 | After rename, `dist/client/projects/daytrade/` exists; `dist/client/projects/crypto-breakout-trader/` does not | smoke (build) | `pnpm build && test -d dist/client/projects/daytrade && test ! -d dist/client/projects/crypto-breakout-trader` | ❌ one-time manual at phase gate | ⬜ pending |
| CONT-07 | `docs/CONTENT-SCHEMA.md` exists and contains all four sections from D-17 | unit | `pnpm vitest tests/content/docs-content-schema.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| CONT-07 | `docs/VOICE-GUIDE.md` exists and contains all four hard rules from D-11 | unit | `pnpm vitest tests/content/docs-voice-guide.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| D-02 (cross-cutting) | `.planning/ROADMAP.md` Phase 13 success criterion #1 reflects 5-H2 shape (not 6) | unit | `pnpm vitest tests/content/roadmap-amendment.test.ts -x` | ❌ Wave 0 | ⬜ pending |
| D-26 (cross-cutting) | Chat widget answers "Daytrade" project question correctly after `portfolio-context.json` patch | manual UAT | n/a — Phase 7 regression battery | ✅ existing manual procedure | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Test infrastructure exists (Vitest 4.1.0 installed; `tests/api/` and `tests/client/` patterns established). New test files this phase must create before Wave 1 can verify:

- [ ] `tests/scripts/sync-projects.test.ts` — frontmatter parser + fence extractor + path-traversal guard (CONT-06)
- [ ] `tests/scripts/sync-projects-idempotency.test.ts` — second-run zero-write invariant (CONT-06)
- [ ] `tests/scripts/sync-projects-check.test.ts` — `--check` exit-code semantics (CONT-06)
- [ ] `tests/content/case-studies-have-content.test.ts` — body non-emptiness (CONT-01)
- [ ] `tests/content/case-studies-shape.test.ts` — 5-H2 order check (CONT-02)
- [ ] `tests/content/case-studies-wordcount.test.ts` — 600–900 word soft band (CONT-02; warn-not-fail)
- [ ] `tests/content/voice-banlist.test.ts` — D-11 Rule 1 banlist enforcement (CONT-02)
- [ ] `tests/content/projects-collection.test.ts` — `featured` count + detail-page existence via `getCollection` (CONT-04)
- [ ] `tests/content/resume-asset.test.ts` — `public/jack-cutrara-resume.pdf` exists + size sanity (CONT-04)
- [ ] `tests/content/source-files-exist.test.ts` — `source:` ↔ `Projects/*.md` integrity (CONT-05)
- [ ] `tests/content/docs-content-schema.test.ts` — `docs/CONTENT-SCHEMA.md` four-section presence (CONT-07)
- [ ] `tests/content/docs-voice-guide.test.ts` — `docs/VOICE-GUIDE.md` four-rule presence (CONT-07)
- [ ] `tests/content/roadmap-amendment.test.ts` — `.planning/ROADMAP.md` 5-H2 amendment regex (D-02)

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (planner enforces in PLAN.md)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (plan-checker enforces)
- [ ] Wave 0 covers all MISSING references (13 new test files enumerated above)
- [ ] No watch-mode flags (all commands use `vitest run` semantics via `pnpm test` or `-x` flag)
- [ ] Feedback latency < 10s per-commit (Vitest unit suite)
- [ ] D-26 chat regression battery scheduled in phase-gate task (mandatory for `portfolio-context.json` edit)
- [ ] `nyquist_compliant: true` set in frontmatter after planner verifies every task references a row above

**Approval:** pending
