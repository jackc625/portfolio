---
phase: 6
slug: performance-audit-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | none — vitest.config.* not found. package.json has `"test": "vitest run"` |
| **Quick run command** | `pnpm build` |
| **Full suite command** | `pnpm build && pnpm preview` + Lighthouse audit |
| **Estimated runtime** | ~15 seconds (build), ~60 seconds (Lighthouse per page) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build`
- **After every plan wave:** Run `pnpm build && pnpm preview` + Lighthouse on key pages
- **Before `/gsd:verify-work`:** Full Lighthouse audit on all pages in both themes
- **Max feedback latency:** 15 seconds (build), 60 seconds (Lighthouse)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | PERF-03 | lighthouse | `npx lighthouse URL --chrome-flags="--headless"` | N/A | ⬜ pending |
| 06-01-02 | 01 | 1 | PERF-02 | lighthouse | `npx lighthouse URL --only-categories=performance` | N/A | ⬜ pending |
| 06-01-03 | 01 | 1 | PERF-05 | lighthouse | `npx lighthouse URL --only-categories=performance` | N/A | ⬜ pending |
| 06-02-01 | 02 | 1 | PERF-04 | build | `pnpm build` + grep dist for Image components | N/A | ⬜ pending |
| 06-03-01 | 03 | 2 | PERF-01 | manual | Visual inspection at 375/768/1440px | N/A | ⬜ pending |
| 06-04-01 | 04 | 2 | SEOA-01 | build | Grep dist HTML for unique titles | N/A | ⬜ pending |
| 06-04-02 | 04 | 2 | SEOA-02 | build | Grep dist HTML for og: tags | N/A | ⬜ pending |
| 06-04-03 | 04 | 2 | SEOA-06 | manual | Tab key test on live site | N/A | ⬜ pending |
| 06-04-04 | 04 | 2 | SEOA-07 | lighthouse | Lighthouse accessibility audit | N/A | ⬜ pending |
| 06-04-05 | 04 | 2 | CNTC-02 | build | Grep dist HTML for footer contact links | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No vitest.config.* file exists — framework installed but not configured
- [ ] No project-level test files exist

Note: For this phase, Lighthouse audits serve as the primary validation mechanism rather than unit tests. The build itself (`pnpm build`) is the most important automated check — it validates content collections, TypeScript types, image processing, and static page generation.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive layout at 375/768/1440px | PERF-01 | Visual inspection of layout, no programmatic check for "no layout issues" | Open site at each breakpoint, verify no overflow, broken grids, or truncated text |
| Skip-to-content link | SEOA-06 | Requires keyboard interaction flow testing | Tab into page, verify first focusable element is skip link, press Enter, verify focus moves to main content |
| Theme-specific contrast | PERF-03 (a11y) | Lighthouse must run separately in each theme mode | Run Lighthouse with dark theme, then manually switch to light and re-run |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
