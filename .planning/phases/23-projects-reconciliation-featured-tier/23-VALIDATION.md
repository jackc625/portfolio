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

> Populated by the planner/executor once PLAN.md tasks exist. Each task maps to an
> automated command below or a Wave 0 dependency.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 1 | PROJ-01 | — | N/A | integration | `pnpm sync:check` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] (recommended) `tests/content/projects-ordering.test.ts` — property test: `order` values across all 7 project MDX are exactly `{1..7}` (contiguous, unique) and `featured: true` ⟺ slug ∈ {seatwatch, multi-chain-evm, nfl-predict}. Directly proves SC4 / PROJ-04 (the "single distinction") independent of page rendering.
- [ ] (optional) `tests/build/featured-tier-render.test.ts` — build-output check: `/projects` HTML renders `work-tagline` exactly 3× on the featured group and 7 rows numbered 01–07. Proves SC2 rendering.
- [ ] Framework install: **none** — Vitest already present.

*If the optional tests are skipped, SC2/SC4 fall back on the existing "exactly 3 featured" gate + manual UI sign-off, which is acceptable given the visual nature of SC2 and the small deterministic data set.*

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
