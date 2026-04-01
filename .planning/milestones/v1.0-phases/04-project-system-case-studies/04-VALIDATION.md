---
phase: 4
slug: project-system-case-studies
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Astro build + manual browser verification |
| **Config file** | `astro.config.mjs` |
| **Quick run command** | `pnpm build` |
| **Full suite command** | `pnpm build && pnpm preview` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build`
- **After every plan wave:** Run `pnpm build && pnpm preview`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | PROJ-03, PROJ-04 | build | `pnpm build` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 1 | PROJ-01, PROJ-02 | build | `pnpm build` | ✅ | ⬜ pending |
| 04-03-01 | 03 | 2 | CASE-01, CASE-02, CASE-03, CASE-04 | build | `pnpm build` | ✅ | ⬜ pending |
| 04-04-01 | 04 | 2 | CASE-05 | build + manual | `pnpm build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

No new test frameworks needed — Astro build validates schema compliance, routing, content collections, and image optimization at build time.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Card grid visual layout | PROJ-01 | Visual layout quality requires human judgment | Open /projects, verify 3 featured cards + editorial list render correctly at desktop and mobile |
| Progressive disclosure on scroll | CASE-04 | Scroll behavior requires browser interaction | Open a case study, verify hero summary visible first, sections revealed on scroll |
| Case study content quality | CASE-05 | Written content quality requires human review | Read 2 fully written case studies, verify first-person tone, structured sections, no placeholder text |
| Thumbnail fallback treatment | PROJ-01 | Visual appearance of solid-color placeholder | Verify projects without screenshots show dark card with centered title |
| Next project navigation | CONTEXT D-10 | Navigation flow requires interaction | Click "next project" at bottom, verify it links to correct next project |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
