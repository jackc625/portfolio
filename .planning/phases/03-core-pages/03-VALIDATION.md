---
phase: 3
slug: core-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Astro build (smoke) |
| **Config file** | astro.config.mjs |
| **Quick run command** | `npx astro build` |
| **Full suite command** | `npx astro build && npx astro preview` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx astro build`
- **After every plan wave:** Run `npx astro build && npx astro preview` + visual comparison to shiyunlu.com
- **Before `/gsd:verify-work`:** Full suite must be green + visual audit comparing output to shiyunlu.com in split screen
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | D-05, D-06, D-07 | smoke | `npx astro build` | N/A | ⬜ pending |
| 03-02-01 | 02 | 1 | D-08, D-09 | smoke | `npx astro build` | N/A | ⬜ pending |
| 03-03-01 | 03 | 2 | HOME-01, D-10, D-11 | smoke | `npx astro build` | N/A | ⬜ pending |
| 03-04-01 | 04 | 2 | ABUT-01, ABUT-02, ABUT-03 | manual | visual review | N/A | ⬜ pending |
| 03-05-01 | 05 | 2 | RESM-01, RESM-02, CNTC-01 | smoke | `npx astro build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Browser DevTools inspection of shiyunlu.com — extract exact colors, fonts, grid measurements, spacing, nav structure, footer structure
- [ ] `pnpm add simplex-noise` — canvas generative art dependency (4.0.3)
- [ ] `public/resume.pdf` — placeholder PDF (already exists from prior execution)
- [ ] Clear font cache after font swap: `rm -rf .astro/fonts/ node_modules/.astro/fonts/`

*Note: Most Phase 3 requirements are visual/content composition verified by build success + manual visual review. The primary automated gate is `npx astro build` which catches TypeScript errors, broken imports, and Zod schema validation. The critical human gate is visual fidelity comparison to shiyunlu.com.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Canvas hero renders generative art | HOME-01 (D-11) | Canvas rendering requires browser | Open /, verify canvas has animated procedural visuals, unique on reload |
| Visual fidelity to shiyunlu.com | D-01, D-10 | Design comparison requires human judgment | Split-screen comparison in browser at 1280px |
| About page tone is professional but human | ABUT-02 | Subjective copywriting quality | Read about page content for first-person conversational tone |
| Skills grouped by context, no progress bars | ABUT-03 | Visual layout review | View about page, confirm skill grouping format |
| PDF download works | RESM-02 | Browser download behavior | Click Download PDF on /resume, verify file downloads |
| External links open in new tab | CNTC-01 | Browser link behavior | Click LinkedIn/GitHub on /contact |
| Responsive layout at 375px/768px/1280px | All pages | CSS rendering requires browser | DevTools responsive mode on all 4 pages |
| Navigation rework matches shiyunlu.com | D-08, D-09 | Visual comparison | Compare nav/mobile menu to reference site |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
