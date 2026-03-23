---
phase: 3
slug: core-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx astro build`
- **After every plan wave:** Run `npx astro build && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | HOME-01 | smoke | `npx astro build` | N/A — build-time | ⬜ pending |
| 03-01-02 | 01 | 1 | HOME-02 | smoke | `npx astro build` | N/A — build-time | ⬜ pending |
| 03-01-03 | 01 | 1 | HOME-03 | smoke | `npx astro build` | N/A — build-time | ⬜ pending |
| 03-01-04 | 01 | 1 | HOME-04 | smoke | `npx astro build` | N/A — build-time | ⬜ pending |
| 03-02-01 | 02 | 1 | ABUT-01 | manual-only | Visual review | N/A | ⬜ pending |
| 03-02-02 | 02 | 1 | ABUT-02 | manual-only | Copywriting review | N/A | ⬜ pending |
| 03-02-03 | 02 | 1 | ABUT-03 | manual-only | Visual review | N/A | ⬜ pending |
| 03-03-01 | 03 | 2 | RESM-01 | smoke | `npx astro build` | N/A — build-time | ⬜ pending |
| 03-03-02 | 03 | 2 | RESM-02 | manual-only | Visual review | N/A | ⬜ pending |
| 03-04-01 | 04 | 2 | CNTC-01 | smoke | `npx astro build` | N/A — build-time | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — basic Vitest configuration
- [ ] Additional sample MDX files in `src/content/projects/` with `featured: true` (need 2-3 total for home page)
- [ ] `public/resume.pdf` — placeholder PDF for development

*Note: Most Phase 3 requirements are visual/content composition verified by build success + manual visual review. Automated unit tests have limited value for static page content. The primary automated gate is `astro build` which runs TypeScript checks and Zod validation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Background narrative covers education, journey, interests | ABUT-01 | Content quality is subjective | Read about page, verify all three topics present |
| Professional but human tone | ABUT-02 | Tone assessment requires human judgment | Read about page copy, confirm first-person conversational tone |
| Skills grouped by context, no progress bars | ABUT-03 | Visual layout review | View about page, confirm skill grouping and no progress bars |
| PDF download button above the fold | RESM-02 | Viewport-dependent visual check | Load resume page on desktop and mobile, verify button visible without scrolling |
| All pages responsive on mobile/tablet/desktop | ALL | Visual layout across breakpoints | Test all 4 pages at 375px, 768px, 1280px widths |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
