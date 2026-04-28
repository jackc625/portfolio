---
phase: 16
slug: motion-layer
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-27
audited: 2026-04-27
---

# Phase 16 — Validation Strategy

> Per-phase validation contract. Phase 16 closed 2026-04-27 with 338/338 GREEN; all MOTN requirements have automated coverage or documented manual-only rationale.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + jsdom 29.0.1 |
| **Config file** | none — default discovery; tests under `tests/**/*.test.ts` |
| **Quick run command** | `pnpm vitest run --reporter=dot <touched-file>` |
| **Full suite command** | `pnpm build && pnpm test` (build runs `astro check` + chat-context generator + sync; tests run after) |
| **Estimated runtime** | ~7–10s full suite (338 tests, 37 files); <2s per touched file |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --reporter=dot <touched-test-file>`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** `pnpm build && pnpm test` full suite green PLUS Lighthouse CI on `localhost:4321/` and one `/projects/[id]` page
- **Max feedback latency:** ~10 seconds (full suite); <2 seconds (per-task)

---

## Per-Task Verification Map

> Each MOTN requirement maps to one or more automated tests under `tests/build/` (source-text invariants) or `tests/client/` (jsdom behavior). Manual-only items are listed in the next section with explicit rationale.

| Req | Plan | Wave | Test Files | Test Type | Automated Command | Status |
|-----|------|------|------------|-----------|-------------------|--------|
| MOTN-01 | 16-04 | 2 | `tests/build/motion-css-rules.test.ts` (`Phase 16 motion CSS rules — view-transition`), `tests/client/reduced-motion.test.ts` (MOTN-01 ::view-transition-old/new gating) | build / client | `pnpm vitest run tests/build/motion-css-rules.test.ts tests/client/reduced-motion.test.ts --reporter=dot` | ✅ green |
| MOTN-02 | 16-04 | 2 | `tests/build/motion-css-rules.test.ts` (scroll-reveal), `tests/client/motion.test.ts` (handleRevealEntry, initMotion bootstrap), `tests/client/observer-factory.test.ts`, `tests/client/reduced-motion.test.ts` (reveal-rise gating) | build / client | `pnpm vitest run tests/build/motion-css-rules.test.ts tests/client/motion.test.ts tests/client/observer-factory.test.ts tests/client/reduced-motion.test.ts --reporter=dot` | ✅ green |
| MOTN-03 | 16-06 | 3 | `tests/build/work-arrow-motion.test.ts` | build | `pnpm vitest run tests/build/work-arrow-motion.test.ts --reporter=dot` | ✅ green |
| MOTN-04 | 16-05 | 3 | `tests/build/motion-css-rules.test.ts` (chat-bubble pulse), `tests/client/chat-pulse-coordination.test.ts` (D-15 ordering), `tests/client/reduced-motion.test.ts` (chat-pulse paired with reduce) | build / client | `pnpm vitest run tests/build/motion-css-rules.test.ts tests/client/chat-pulse-coordination.test.ts tests/client/reduced-motion.test.ts --reporter=dot` | ✅ green |
| MOTN-05 | 16-05 | 3 | `tests/build/motion-css-rules.test.ts` (chat panel scale-in), `tests/client/chat-pulse-coordination.test.ts` (.is-open), `tests/client/reduced-motion.test.ts` (#chat-panel.is-open gating) | build / client | `pnpm vitest run tests/build/motion-css-rules.test.ts tests/client/chat-pulse-coordination.test.ts tests/client/reduced-motion.test.ts --reporter=dot` | ✅ green |
| MOTN-06 | 16-05 | 3 | `tests/build/motion-css-rules.test.ts` (typing-bounce byte-equivalence) | build | `pnpm vitest run tests/build/motion-css-rules.test.ts --reporter=dot` | ✅ green |
| MOTN-07 | 16-04 | 2 | `tests/build/motion-css-rules.test.ts` (word-stagger), `tests/client/motion.test.ts` (splitWords skips `.display`), `tests/client/reduced-motion.test.ts` (.word gating) | build / client | `pnpm vitest run tests/build/motion-css-rules.test.ts tests/client/motion.test.ts tests/client/reduced-motion.test.ts --reporter=dot` | ✅ green |
| MOTN-08 | 16-04 / 16-05 | 2 / 3 | `tests/client/motion.test.ts` (matchMedia reduce read first, reduce bails), `tests/client/reduced-motion.test.ts` (5 Phase 16 keyframe-gating assertions + 5 baseline regression guards) | client | `pnpm vitest run tests/client/motion.test.ts tests/client/reduced-motion.test.ts --reporter=dot` | ✅ green |
| MOTN-09 | 16-03 | 1 | `tests/build/motion-doc.test.ts` (MOTION.md exists + property whitelist + duration bands; MASTER.md §6 stub + §8 anti-pattern byte-equivalence) | build | `pnpm vitest run tests/build/motion-doc.test.ts --reporter=dot` | ✅ green |
| MOTN-10 | 16-07 | 4 | `tests/build/motion-css-rules.test.ts` (Lighthouse stress guards: no `will-change`, no `cubic-bezier`) | build (proxy) | `pnpm vitest run tests/build/motion-css-rules.test.ts --reporter=dot` | ✅ green (proxy); manual-only canonical |
| D-15 | 16-05 | 3 | `tests/client/chat-pulse-coordination.test.ts` (pulse pause-on-open BEFORE setupFocusTrap + resume-on-close AFTER focus restoration) | client | `pnpm vitest run tests/client/chat-pulse-coordination.test.ts --reporter=dot` | ✅ green |
| D-19 | 16-02 | 1 | `tests/client/observer-factory.test.ts` (oneShot=false default preserves scroll-depth behavior), `tests/client/scroll-depth.test.ts` + `tests/client/analytics.test.ts` (byte-equivalence canary — `git diff` 0 lines vs phase-start) | client | `pnpm vitest run tests/client/observer-factory.test.ts tests/client/scroll-depth.test.ts tests/client/analytics.test.ts --reporter=dot` | ✅ green |
| D-26 | 16-05 / 16-07 | 3 / 4 | `tests/client/chat-pulse-coordination.test.ts` (D-26 regression-adjacent: display toggle preserved); 8-file chat regression battery (`chat.test.ts` + `security.test.ts` + `prompt-injection.test.ts` + `markdown.test.ts` + `chat-copy-button.test.ts` + `sse-truncation.test.ts` + `focus-visible.test.ts` + `chat-widget-header.test.ts` — 117/117 GREEN) | client / api | `pnpm vitest run tests/client/chat-pulse-coordination.test.ts tests/api/chat.test.ts tests/api/security.test.ts tests/api/prompt-injection.test.ts tests/client/markdown.test.ts tests/client/chat-copy-button.test.ts tests/client/sse-truncation.test.ts tests/client/focus-visible.test.ts tests/client/chat-widget-header.test.ts --reporter=dot` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All 7 Wave 0 test files exist and the 76-test target landed GREEN by Phase 16 close (verified `pnpm vitest run --reporter=dot`: 7 files, 81 tests, all GREEN, 3.71s):

- [x] `tests/build/motion-css-rules.test.ts` — Source-text invariants for `src/styles/global.css` motion rules (view-transition rule + keyframes, chat-bubble pulse, chat-panel scale-in, word-stagger, typing-bounce byte-equivalence, no `will-change`, no `cubic-bezier`)
- [x] `tests/build/work-arrow-motion.test.ts` — `src/components/primitives/WorkRow.astro` arrow transitions (opacity 120ms + transform 180ms ease-out, hover/focus translateX(4px), reduce override keeps opacity 0)
- [x] `tests/build/motion-doc.test.ts` — `design-system/MOTION.md` exists with property whitelist + duration bands; `MASTER.md` §6 stub points to MOTION.md; `MASTER.md` §8 anti-pattern list byte-equivalent
- [x] `tests/client/observer-factory.test.ts` — IO factory contract (null on empty selector, rootMargin/threshold pass-through, `oneShot` parameter behavior preserves D-19 scroll-depth byte-equivalence)
- [x] `tests/client/motion.test.ts` — `motion.ts` behavior (matchMedia reduce read first, reduce bails with no observer/no DOM mutation, no-preference instantiates observer, intersect adds `.reveal-on`, `splitWords` wraps + idempotent + skips `.display`)
- [x] `tests/client/chat-pulse-coordination.test.ts` — `chat.ts` D-15 + MOTN-05 ordering (pause BEFORE `setupFocusTrap` in openPanel, resume AFTER focus restoration in closePanel, `.is-open` class add/remove)
- [x] `tests/client/reduced-motion.test.ts` — extended with assertions that Phase 16 keyframes (`chat-pulse`, `chat-panel-in`, `vt-fade-out`, `vt-fade-in`, `word-stagger-in`) live inside `no-preference` blocks OR have paired `reduce` overrides

**Framework install:** None — Vitest 4.1.0 + jsdom 29.0.1 already present. No new test infra needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Lighthouse CI scores hold (Performance ≥99 / A11y ≥95 / BP 100 / SEO 100 / TBT ≤150ms / CLS ≤0.01) | MOTN-10 | Lighthouse runs against real headless Chrome — cannot be jsdom-mocked | `npx lighthouse http://localhost:4321 --only-categories=performance,accessibility,best-practices,seo --output=json` PLUS one `/projects/[id]` URL; before merge. Phase 16 close-out evidence: `lighthouse-home.json` + `lighthouse-project.json` committed alongside `16-VERIFICATION.md` §1 (TBT 0 ms / CLS ≈ 0 PASS; localhost Performance 80/81 accepted per Phase 15 §9 precedent) |
| SSE streaming visual parity (typing-dot bounce, panel scale-in, pulse pause-on-open) | MOTN-04, MOTN-05, MOTN-06 | Visual cadence requires human eyes; jsdom does not animate | UAT: open chat, send message, observe pulse pauses on open, dots bounce during stream, panel scales in on open. Phase 16 evidence: 16-VERIFICATION.md §6 rows 6, 9, 10 PASS approved 2026-04-27 |
| Cross-document `@view-transition` fade with default motion preferences | MOTN-01 | Fade requires real browser navigation animation; jsdom cannot simulate | UAT: home → /projects → /about navigation in Chrome 126+ / Safari 18.2+ — observe fade. Phase 16 evidence: 16-VERIFICATION.md §6 row 1 PASS approved 2026-04-27 |
| Cross-document `@view-transition` neutralized with `prefers-reduced-motion: reduce` | MOTN-08 | Same as above + DevTools emulation flag toggle | UAT: DevTools → Rendering → emulate `reduce` → repeat navigation; verify no fade. Phase 16 evidence: 16-VERIFICATION.md §6 rows 11, 12, 13 PASS approved 2026-04-27 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (7 source files; see Wave 0 Requirements above — all exist + GREEN)
- [x] No watch-mode flags (vitest invocations all use `run`)
- [x] Feedback latency < 20s (~7s full suite, <2s per file)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** passed — Phase 16 closed 2026-04-27; 338/338 full-suite GREEN; all MOTN-01..MOTN-10 + D-15 + D-19 + D-26 covered automated or via documented manual-only rationale.

---

## Validation Audit 2026-04-27

| Metric | Count |
|--------|-------|
| Requirements audited | 13 (MOTN-01..MOTN-10 + D-15 + D-19 + D-26) |
| COVERED (automated) | 12 |
| Manual-only (documented rationale) | 1 (MOTN-10 Lighthouse — automated proxy via stress guards in motion-css-rules.test.ts; canonical run in real Chrome) |
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Wave 0 test files present | 7 / 7 |
| Wave 0 test files GREEN | 81 / 81 |
| Full suite | 338 / 338 GREEN |

**Methodology:** State A audit. Read all 7 PLAN/SUMMARY artifacts; cross-referenced 7 Wave-0 test files against filesystem; ran `pnpm vitest run` on motion files (81/81 GREEN, 3.71s) and full suite (338/338 GREEN, 7.37s); mapped each requirement to its automated test(s); confirmed manual-only items in `## Manual-Only Verifications` carry explicit rationale plus 16-VERIFICATION.md evidence pointer.
