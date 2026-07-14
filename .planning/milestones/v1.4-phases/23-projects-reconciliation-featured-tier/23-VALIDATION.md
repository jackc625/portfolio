---
phase: 23
slug: projects-reconciliation-featured-tier
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-10
validated: 2026-07-10
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 23-RESEARCH.md § Validation Architecture. This phase is test-rich: the
> existing content-gate suite already encodes most success criteria as invariants; the
> D-16 updates extend those gates to cover the 7th project (multi-chain-evm).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 (`package.json`) |
| **Config file** | repo vitest config (tests under `tests/`) |
| **Quick run command** | `pnpm exec vitest run tests/content` |
| **Full suite command** | `pnpm test` |
| **Type/schema gate** | `pnpm exec astro check` (must stay 0/0/0 — D-17/SC5) |
| **Sync gate** | `pnpm sync:check` (exit 0) |
| **Chat-context gate** | `pnpm build:chat-context:check` (exit 0 — proves chat JSON stayed at 6) |
| **Estimated runtime** | ~30 seconds (content gates) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec astro check` + `pnpm exec vitest run tests/content` (add `tests/build/chat-context-integrity.test.ts` when the D-15 skip is touched)
- **After every plan wave:** Run `pnpm test` + `pnpm sync:check` + `pnpm build:chat-context:check`
- **Before `/gsd-verify-work`:** `pnpm build` (runs `build:chat-context` → `astro check` → `astro build`; validates the D-15 skip end-to-end and produces `dist/` for the no-MDX-in-worker gate) + full `pnpm test` green + UI checker sign-off
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

> Mapped from the 4 finalized PLAN.md files (10 tasks). Executor updates Status as tasks go green.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 1 | PROJ-01 | D-15 | chat corpus stays 6 (#7 excluded) | integration | `pnpm build:chat-context:check` + `vitest run tests/build/chat-context-integrity.test.ts` | ✅ | ✅ green |
| 23-01-02 | 01 | 1 | PROJ-01 | — | N/A | integration | `pnpm sync:check` + `pnpm exec astro check` + `vitest run tests/content/source-files-exist.test.ts` | ✅ | ✅ green |
| 23-01-03 | 01 | 1 | PROJ-03, PROJ-04 | — | N/A | property | `vitest run tests/content` (projects-collection 7 / exactly-3-featured + projects-ordering {1..7} unique) | ✅ | ✅ green |
| 23-02-01 | 02 | 2 | PROJ-01 | — | N/A | unit | `vitest run tests/content/case-studies-{have-content,shape,wordcount}.test.ts` | ✅ | ✅ green |
| 23-02-02 | 02 | 2 | PROJ-01 | — | N/A | unit | `vitest run tests/content/voice-banlist.test.ts tests/content/voice-em-dash.test.ts` | ✅ | ✅ green |
| 23-03-01 | 03 | 2 | PROJ-02 | — | N/A | unit | `pnpm exec astro check` + `vitest run tests/build/work-arrow-motion.test.ts tests/build/motion-css-rules.test.ts tests/client/focus-visible.test.ts` (WorkRow byte-identical sans tagline) | ✅ | ✅ green |
| 23-03-02 | 03 | 2 | PROJ-02, PROJ-04 | — | N/A | build-output | `pnpm exec astro check` + `vitest run tests/build/featured-tier-render.test.ts` (against fresh `dist/`) | ✅ | ✅ green |
| 23-03-03 | 03 | 2 | PROJ-03 | — | N/A | unit | `pnpm exec astro check` + `vitest run tests/content` | ✅ | ✅ green |
| 23-04-01 | 04 | 3 | PROJ-01..04 | D-15 | full build validates skip; chat 6 | build/integration | `pnpm build` + `pnpm test` + `pnpm sync:check` + `pnpm build:chat-context:check` | ✅ | ✅ green |
| 23-04-02 | 04 | 3 | PROJ-01, PROJ-02 | — | content honesty (D-03, no P&L) | manual | human sign-off: content review (D-02/D-03) + 6-pillar UI (UI-SPEC § Checker Sign-Off) | — | 🔵 manual (approved) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · 🔵 manual · File Exists: ✅ existing gate · ❌ W0 net-new test authored this phase*

> **Frontmatter note:** `nyquist_compliant` and `wave_0_complete` were `false` at plan time by design and flipped `true` at this validation audit (2026-07-10) once the map above went all-green and the two Wave 0 tests were confirmed to exist and pass. Both W0 File-Exists cells flipped ❌ → ✅.

---

## Wave 0 Requirements

- [x] `tests/content/projects-ordering.test.ts` — **authored by Task 23-01-03 (commit 9280c81).** Property test: `order` values across all 7 project MDX are exactly `{1..7}` (contiguous, unique) and `featured: true` ⟺ slug ∈ {seatwatch, multi-chain-evm, nfl-predict}. Directly proves SC4 / PROJ-04 (the "single distinction") independent of page rendering. **Exists + green** (in `tests/content`, 67 pass / 2 skip).
- [x] `tests/build/featured-tier-render.test.ts` — **authored by Task 23-03-02 (commit a046206), validated at the Plan 04 `pnpm build`.** Build-output check: `/projects` HTML (`dist/client/projects/index.html`) renders `work-tagline` exactly 3× on the featured group and 7 rows numbered 01–07. Proves SC2 rendering. **Exists + green** (4/4 against fresh `dist/`).
- [x] Framework install: **none** — Vitest already present.

*Both Wave 0 tests are planned (not optional) — the planner promoted them into concrete tasks. They run against a fresh `dist/` at the single Plan 04 `pnpm build`, avoiding a shared-`dist/` race between the two parallel Wave 2 plans.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Featured-tier visual distinctness, divider styling, type ladder | SC5 | Visual/subjective; routed through frontend-design | 6-pillar UI checker sign-off against 23-UI-SPEC.md § Checker Sign-Off + design-system/MASTER.md |
| #7 tagline (≤80 chars) + 600–900w case-study prose quality | PROJ-01 / D-02 | Editorial judgment, real-capital honesty framing (D-03) | Jack reviews drafted copy before ship; no P&L/returns claims |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (9/10 automated; 23-04-02 legitimately manual)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (both W0 tests authored, exist, green)
- [x] No watch-mode flags (`vitest run` / `--check` throughout)
- [x] Feedback latency < 30s (content gates ~0.7s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-07-10 — Nyquist-compliant. All four requirements (PROJ-01..04) have green automated verification; the sole manual item (content honesty + 6-pillar visual) was approved by Jack at the 23-04 capstone.

---

## Validation Audit 2026-07-10

State A audit of the plan-time VALIDATION.md against execution reality (4 SUMMARY files, all `status: complete`).

| Metric | Count |
|--------|-------|
| Requirements | 4 (PROJ-01..04) |
| Tasks mapped | 10 |
| Automated (green) | 9 |
| Manual-only (approved) | 1 (23-04-02) |
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Wave 0 tests:** both authored and green — `tests/content/projects-ordering.test.ts` (SC4 property gate) and `tests/build/featured-tier-render.test.ts` (SC2 render gate).

**Re-run evidence (this audit):**
- `pnpm exec vitest run tests/content` → 67 pass / 2 skip (14 files)
- `pnpm exec vitest run` over build-output + motion/focus + chat-pin gates → 60 pass (7 files)
- Capstone (23-04) full suite of record: `pnpm test` 637 pass / 2 skip / 0 fail; `pnpm build` astro check 0/0/0.

**Outcome:** no gaps → no auditor spawned, no new tests generated. Frontmatter flipped `nyquist_compliant: true`, `wave_0_complete: true`, `status: validated`.
