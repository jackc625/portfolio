---
phase: 5
slug: dark-mode-animations-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 (installed as devDependency) |
| **Config file** | none — see Wave 0 |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx astro build` (verifies no build errors)
- **After every plan wave:** Full build + manual visual verification in both themes
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | DSGN-02 | manual (DOM) | Manual: toggle in browser, verify `data-theme` attribute | N/A | ⬜ pending |
| 05-01-02 | 01 | 1 | DSGN-03 | manual (visual) | Manual: set theme, reload, verify no flash | N/A | ⬜ pending |
| 05-01-03 | 01 | 1 | DSGN-04 | manual (tool) | Manual: OddContrast / DevTools contrast check | N/A | ⬜ pending |
| 05-02-01 | 02 | 2 | ANIM-01 | manual (visual) | Manual: scroll down, observe animations | N/A | ⬜ pending |
| 05-02-02 | 02 | 2 | ANIM-02 | manual (visual) | Manual: click nav links, observe crossfade | N/A | ⬜ pending |
| 05-02-03 | 02 | 2 | ANIM-03 | manual (visual) | Manual: hover cards/links/toggle | N/A | ⬜ pending |
| 05-02-04 | 02 | 2 | ANIM-04 | manual | Manual: enable reduced-motion in OS, reload | N/A | ⬜ pending |
| 05-03-01 | 03 | 3 | RESM-03 | manual | Manual: Ctrl+P on resume page, check preview | N/A | ⬜ pending |
| 05-03-02 | 03 | 3 | SEOA-03 | smoke | `npx astro build && grep -l "application/ld+json" dist/**/*.html` | No | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- This phase is primarily visual/interactive — most requirements require manual verification
- A smoke test for JSON-LD presence in built HTML is achievable with grep
- No vitest config exists; if adding build verification tests, create `vitest.config.ts` first

*Existing infrastructure covers build verification via `npx astro build`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Theme toggle sets data-theme and respects OS preference | DSGN-02 | Requires DOM interaction in browser | Toggle theme, verify `data-theme` attribute on `<html>` |
| Theme persists in localStorage, no FOWT | DSGN-03 | Requires page reload and visual inspection | Set theme, reload page, verify no flash |
| Both themes pass WCAG AA contrast | DSGN-04 | Requires contrast ratio tool measurement | Use OddContrast/DevTools on all text-background pairs |
| Scroll-triggered reveals on sections | ANIM-01 | Requires visual observation of scroll behavior | Scroll down, verify sections fade in |
| Smooth page transitions | ANIM-02 | Requires visual observation of navigation | Click nav links, observe crossfade |
| Hover micro-interactions | ANIM-03 | Requires mouse interaction | Hover over cards, links, toggle |
| Animations respect prefers-reduced-motion | ANIM-04 | Requires OS accessibility setting change | Enable reduced-motion, reload, verify no animations |
| Resume prints cleanly | RESM-03 | Requires print preview inspection | Ctrl+P on resume page, check print preview |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
