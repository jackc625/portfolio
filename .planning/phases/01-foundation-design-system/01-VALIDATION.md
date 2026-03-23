---
phase: 1
slug: foundation-design-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (bundled with Astro 6 via Vite 7) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx astro check && npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx astro check && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | DSGN-01 | build | `npx astro build` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | DSGN-01 | build | `npx astro dev` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | DSGN-01 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | IDNV-04 | build | `npx astro check` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 2 | IDNV-04 | integration | `npx astro build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `@vitest/coverage-v8` — install test framework
- [ ] `vitest.config.ts` — test configuration
- [ ] `tests/setup.ts` — shared test setup
- [ ] Astro check configured — TypeScript validation via `npx astro check`

*Note: Exact task-to-test mappings will be refined once PLAN.md files are created.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dev server renders blank page without errors | DSGN-01 | Requires visual browser check | Run `npx astro dev`, open localhost, verify blank page with no console errors |
| Cloudflare Pages deploy succeeds | IDNV-04 | Requires external service | Push to GitHub, verify Cloudflare Pages build passes and site is accessible |
| CSS custom properties render correctly | DSGN-01 | Visual verification of token values | Inspect element in browser, verify CSS variables resolve to correct values |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
