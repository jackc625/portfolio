---
phase: 12
slug: tech-debt-sweep
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1 + jsdom (already installed) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test -- --run --reporter=dot` |
| **Full suite command** | `pnpm test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- --run --reporter=dot`
- **After every plan wave:** Run `pnpm test -- --run` + `pnpm build`
- **Before `/gsd-verify-work`:** Full suite + build + lint all green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| *Populated by planner* | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/client/chat-copy-button.test.ts` — snapshot + behavior test for `createCopyButton()` helper (DEBT-04)
- [ ] Existing `vitest.config.ts` + jsdom environment covers new test — no framework install needed

*OG curl verification script is embedded in this doc below (manual-only for DEBT-03).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile menu keyboard-cycle inert check | DEBT-02 | Requires interactive Tab presses against live DOM; focus-cycle assertions against `document.activeElement` are simpler with human driver than synthetic events | Open menu on `/projects`, press Tab 30+ times with `document.activeElement` logged in DevTools; assert focus never leaves `.mobile-menu` subtree. Repeat with Shift+Tab. |
| OG URL production verification | DEBT-03 | Requires deployed production origin (dev preview URLs would resolve to localhost) | Run `curl -A "facebookexternalhit/1.1" https://jackcutrara.com/<path> \| grep -E "og:url\|og:image"` against 5 URLs: `/`, `/about`, `/projects`, `/projects/<slug>`, `/contact`. Record URL captured + verdict in 5-row table. |
| Zero-warning build check | DEBT-01 | Warnings surface only in live wrangler/astro/eslint output streams | `pnpm build` then `pnpm lint` — both exit 0 with zero warning lines in stdout/stderr |
| D-26 Chat Regression Gate | DEBT-02, DEBT-04 | Full battery covers XSS, CORS, rate limit, SSE, focus trap, localStorage, clipboard, abort — mix of automated + manual smoke | Follow `12-RESEARCH.md §D-26 Chat Regression Gate Checklist` end-to-end |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
