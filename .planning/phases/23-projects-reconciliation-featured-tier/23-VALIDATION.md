---
phase: 23
slug: projects-reconciliation-featured-tier
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-10
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
| 23-01-01 | 01 | 1 | PROJ-01 | D-15 | chat corpus stays 6 (#7 excluded) | integration | `pnpm build:chat-context:check` + `vitest run tests/build/chat-context-integrity.test.ts` | ✅ | ⬜ pending |
| 23-01-02 | 01 | 1 | PROJ-01 | — | N/A | integration | `pnpm sync:check` + `pnpm exec astro check` + `vitest run tests/content/source-files-exist.test.ts` | ✅ | ⬜ pending |
| 23-01-03 | 01 | 1 | PROJ-03, PROJ-04 | — | N/A | property | `vitest run tests/content` (projects-collection 7 / exactly-3-featured + projects-ordering {1..7} unique) | ❌ W0 | ⬜ pending |
| 23-02-01 | 02 | 2 | PROJ-01 | — | N/A | unit | `vitest run tests/content/case-studies-{have-content,shape,wordcount}.test.ts` | ✅ | ⬜ pending |
| 23-02-02 | 02 | 2 | PROJ-01 | — | N/A | unit | `vitest run tests/content/voice-banlist.test.ts tests/content/voice-em-dash.test.ts` | ✅ | ⬜ pending |
| 23-03-01 | 03 | 2 | PROJ-02 | — | N/A | unit | `pnpm exec astro check` + `vitest run tests/motion` (WorkRow byte-identical sans tagline) | ✅ | ⬜ pending |
| 23-03-02 | 03 | 2 | PROJ-02, PROJ-04 | — | N/A | build-output | `pnpm exec astro check` (+ `featured-tier-render` at Plan 04 `pnpm build`) | ❌ W0 | ⬜ pending |
| 23-03-03 | 03 | 2 | PROJ-03 | — | N/A | unit | `pnpm exec astro check` + `vitest run tests/content` | ✅ | ⬜ pending |
| 23-04-01 | 04 | 3 | PROJ-01..04 | D-15 | full build validates skip; chat 6 | build/integration | `pnpm build` + `pnpm test` + `pnpm sync:check` + `pnpm build:chat-context:check` | ✅ | ⬜ pending |
| 23-04-02 | 04 | 3 | PROJ-01, PROJ-02 | — | content honesty (D-03, no P&L) | manual | human sign-off: content review (D-02/D-03) + 6-pillar UI (UI-SPEC § Checker Sign-Off) | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · File Exists: ✅ existing gate · ❌ W0 net-new test authored this phase*

> **Frontmatter note:** `nyquist_compliant` and `wave_0_complete` stay `false` at plan time by design — they flip `true` at execution sign-off once the map above is all-green and the two Wave 0 tests exist. Not a plan-time staleness defect.

---

## Wave 0 Requirements

- [ ] `tests/content/projects-ordering.test.ts` — **authored by Task 23-01-03.** Property test: `order` values across all 7 project MDX are exactly `{1..7}` (contiguous, unique) and `featured: true` ⟺ slug ∈ {seatwatch, multi-chain-evm, nfl-predict}. Directly proves SC4 / PROJ-04 (the "single distinction") independent of page rendering.
- [ ] `tests/build/featured-tier-render.test.ts` — **authored by Task 23-03-02, validated at the Plan 04 `pnpm build`.** Build-output check: `/projects` HTML renders `work-tagline` exactly 3× on the featured group and 7 rows numbered 01–07. Proves SC2 rendering.
- [ ] Framework install: **none** — Vitest already present.

*Both Wave 0 tests are planned (not optional) — the planner promoted them into concrete tasks. They run against a fresh `dist/` at the single Plan 04 `pnpm build`, avoiding a shared-`dist/` race between the two parallel Wave 2 plans.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Featured-tier visual distinctness, divider styling, type ladder | SC5 | Visual/subjective; routed through frontend-design | 6-pillar UI checker sign-off against 23-UI-SPEC.md § Checker Sign-Off + design-system/MASTER.md |
| #7 tagline (≤80 chars) + 600–900w case-study prose quality | PROJ-01 / D-02 | Editorial judgment, real-capital honesty framing (D-03) | Jack reviews drafted copy before ship; no P&L/returns claims |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
