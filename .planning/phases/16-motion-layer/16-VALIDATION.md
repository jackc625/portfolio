---
phase: 16
slug: motion-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + jsdom 29.0.1 |
| **Config file** | none — default discovery; tests under `tests/**/*.test.ts` |
| **Quick run command** | `pnpm vitest run --reporter=dot <touched-file>` |
| **Full suite command** | `pnpm build && pnpm test` (build runs `astro check` + chat-context generator + sync; tests run after) |
| **Estimated runtime** | ~10–20s full suite (262 tests today; ~290 expected post-Phase-16); <2s per touched file |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --reporter=dot <touched-test-file>`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** `pnpm build && pnpm test` full suite green PLUS Lighthouse CI on `localhost:4321/` and one `/projects/[id]` page
- **Max feedback latency:** ~20 seconds (full suite); <2 seconds (per-task)

---

## Per-Task Verification Map

> Populated by gsd-planner from `16-RESEARCH.md` Validation Architecture (lines 1082–1119). Each PLAN.md task carries an `<automated>` tag pointing at one row below; rows missing from any plan must land in Wave 0.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD     | TBD  | TBD  | MOTN-01..MOTN-10, D-19, D-26 | T-D-26 (chat regression) / — | see RESEARCH.md §Validation Architecture | unit / build / client / manual | see RESEARCH.md §Validation Architecture | ❌ W0 (most) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Per `16-RESEARCH.md` lines 1129–1175 — these test files do NOT exist and must be authored at Wave 0 (RED phase) before any motion code lands:

- [ ] `tests/build/motion-css-rules.test.ts` — Source-text invariants for `src/styles/global.css` motion rules (view-transition rule + keyframes, chat-bubble pulse, chat-panel scale-in, word-stagger, typing-bounce byte-equivalence, no `will-change`, no `cubic-bezier`)
- [ ] `tests/build/work-arrow-motion.test.ts` — `src/components/primitives/WorkRow.astro` arrow transitions (opacity 120ms + transform 180ms ease-out, hover/focus translateX(4px), reduce override keeps opacity 0)
- [ ] `tests/build/motion-doc.test.ts` — `design-system/MOTION.md` exists with property whitelist + duration bands; `MASTER.md` §6 stub points to MOTION.md; `MASTER.md` §8 anti-pattern list byte-equivalent
- [ ] `tests/client/observer-factory.test.ts` — IO factory contract (null on empty selector, rootMargin/threshold pass-through, `oneShot` parameter behavior preserves D-19 scroll-depth byte-equivalence)
- [ ] `tests/client/motion.test.ts` — `motion.ts` behavior (matchMedia reduce read first, reduce bails with no observer/no DOM mutation, no-preference instantiates observer, intersect adds `.reveal-on`, `splitWords` wraps + idempotent + skips `.display`)
- [ ] `tests/client/chat-pulse-coordination.test.ts` — `chat.ts` D-15 + MOTN-05 ordering (pause BEFORE `setupFocusTrap` in openPanel, resume AFTER focus restoration in closePanel, `.is-open` class add/remove)
- [ ] `tests/client/reduced-motion.test.ts` — **MODIFY existing file**, do not redefine — extend with assertions that Phase 16 keyframes (`chat-pulse`, `chat-panel-in`, `vt-fade-out`, `vt-fade-in`, `word-stagger-in`) live inside `no-preference` blocks OR have paired `reduce` overrides

**Framework install:** None — Vitest 4.1.0 + jsdom 29.0.1 already present. No new test infra needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Lighthouse CI scores hold (Performance ≥99 / A11y ≥95 / BP 100 / SEO 100 / TBT ≤150ms / CLS ≤0.01) | MOTN-10 | Lighthouse runs against real headless Chrome — cannot be jsdom-mocked | `npx lighthouse http://localhost:4321 --only-categories=performance,accessibility,best-practices,seo --output=json` PLUS one `/projects/[id]` URL; before merge |
| SSE streaming visual parity (typing-dot bounce, panel scale-in, pulse pause-on-open) | MOTN-04, MOTN-05, MOTN-06 | Visual cadence requires human eyes; jsdom does not animate | UAT: open chat, send message, observe pulse pauses on open, dots bounce during stream, panel scales in on open |
| Cross-document `@view-transition` fade with default motion preferences | MOTN-01 | Fade requires real browser navigation animation; jsdom cannot simulate | UAT: home → /projects → /about navigation in Chrome 126+ / Safari 18.2+ — observe fade |
| Cross-document `@view-transition` neutralized with `prefers-reduced-motion: reduce` | MOTN-08 | Same as above + DevTools emulation flag toggle | UAT: DevTools → Rendering → emulate `reduce` → repeat navigation; verify no fade |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (8 source files; see Wave 0 Requirements above)
- [ ] No watch-mode flags (vitest invocations all use `--run`)
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
