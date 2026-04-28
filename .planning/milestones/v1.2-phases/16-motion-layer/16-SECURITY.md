---
phase: 16
slug: motion-layer
gate: phase-16-security
status: SECURED
asvs_level: L1
threats_total: 47
threats_closed: 47
threats_open: 0
unregistered_flags: 0
phase_start_sha: 721f844
auditor: gsd-security-auditor
audited_at: 2026-04-27
---

# Phase 16 — Security Audit Record

**Phase:** 16 — motion-layer (v1.2 milestone)
**ASVS Level:** L1 (single-light-theme static portfolio + one SSR endpoint)
**Block on:** high (any unverifiable mitigate-disposition treated as blocker)
**Total threats:** 47 across 7 plans
**Closed:** 47 / 47 (24 mitigate verified by code/tests; 23 accept verified by SUMMARY/VERIFICATION corpus consistent)
**Open:** 0
**Unregistered flags:** 0

Verification methodology: every `mitigate` threat verified by locating the asserted control in source or test files (file:line or test name cited). Every `accept` threat cross-checked against SUMMARY-tier "Threat Surface Scan" entries and 16-VERIFICATION.md to confirm no contradicting evidence. D-15 (api/chat.ts byte-identical to phase-start SHA `721f844`) and D-19 (scroll-depth.test.ts + analytics.test.ts byte-identical) verified by running `git diff 721f844 -- <path>` — both returned 0 lines. All 9 Phase 16 verification test files run GREEN (104/104).

---

## Plan 16-01 — RED-stub authoring (test-only writes)

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-16-01-01 | Tampering (test files) | mitigate | All Phase 16 test files use `readFileSync` against committed source only; no IO/network. Verified across `tests/build/{motion-css-rules,motion-doc,work-arrow-motion}.test.ts` and `tests/client/{motion,observer-factory,chat-pulse-coordination,reduced-motion}.test.ts`. |
| T-16-01-02 | InfoDisclosure | accept | n/a — no secrets in test files. SUMMARY confirms. |
| T-16-01-03 | DoS (vitest runner) | accept | Full Phase 16 suite (9 files, 104 tests) runs in ~4s — well under 2s/file budget. Verified via `pnpm vitest run`. |
| T-16-01-04 | Repudiation (git history) | mitigate | Wave 0 commits visible in `git log 721f844..HEAD` — Plan 02..07 commit messages reference plan IDs (`feat(16-02)`, `feat(16-04)`, etc.). |
| T-16-01-05 | EoP | accept | n/a — pure assertion harness. |

---

## Plan 16-02 — observer factory + scroll-depth refactor

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-16-02-01 | Tampering (D-19 byte-equiv) | mitigate | `git diff 721f844 -- tests/client/scroll-depth.test.ts tests/client/analytics.test.ts` returns 0 lines. Both files unmodified; tests pass GREEN against the refactored `scroll-depth.ts` that consumes `makeRevealObserver`. |
| T-16-02-02 | InfoDisclosure (umami payload) | accept | `src/scripts/scroll-depth.ts:38` — `handleScrollEntry` payload `{percent, slug}` preserved verbatim from Phase 15. No payload edits. |
| T-16-02-03 | DoS (IO observation count) | accept | Same 4 sentinels per /projects/[id] page; factory adds zero observation overhead. Lighthouse TBT=0 confirms (16-VERIFICATION.md §1). |
| T-16-02-04 | Repudiation | mitigate | Two atomic commits: `d7ed781 feat(16-02): add shared IntersectionObserver factory (D-17)` + `dc36742 refactor(16-02): scroll-depth consumes makeRevealObserver factory (D-19)`. |
| T-16-02-05 | Spoofing | accept | n/a — no auth surface. |
| T-16-02-06 | EoP | accept | n/a — no privilege boundaries. |

---

## Plan 16-03 — design-system documentation (MOTION.md + MASTER.md)

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-16-03-01 | Tampering (MOTION.md drift) | mitigate | `tests/build/motion-doc.test.ts:36-54` asserts all 7 duration markers + 3 properties (transform/opacity/box-shadow) + easing names + 7 motion IDs (MOTN-01..07) present. 15/15 GREEN. |
| T-16-03-02 | Tampering (MASTER.md §8 ban removal) | mitigate | `tests/build/motion-doc.test.ts:87-105` asserts §8 still contains `No GSAP` AND `ClientRouter`. Both GREEN. |
| T-16-03-03 | InfoDisclosure | accept | Public design-system content; no PII. |
| T-16-03-04 | Repudiation | mitigate | Two atomic commits: `f9a1f82 docs(16-03): author design-system/MOTION.md (v1.2 motion canonical doc)` + `031cf36 docs(16-03): MASTER.md §6 stub + §8 view-transition carve-out + §11 v1.2 entry`. |
| T-16-03-05 | Spoofing | accept | n/a. |
| T-16-03-06 | EoP | accept | n/a — documentation surface. |

---

## Plan 16-04 — motion.ts + global.css + BaseLayout (entrance animations)

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-16-04-01 | Tampering (XSS via wrapWordsInPlace) | mitigate | `src/scripts/motion.ts:53-63` — uses `el.textContent = ""` then `createElement("span")` + `span.textContent = word`; no `innerHTML` anywhere in module. `tests/client/motion.test.ts:190-200` asserts `<script>` injection via textContent yields no `<script>` child element. |
| T-16-04-02 | InfoDisclosure (cross-origin view-transition) | accept | Browser-enforced same-origin per MDN @view-transition spec. |
| T-16-04-03 | Tampering (data-stagger-split spoofed) | accept | Cosmetic — at worst the heading skips word-stagger; no security boundary. |
| T-16-04-04 | DoS (IO target count) | mitigate | `REVEAL_SELECTOR` at `src/scripts/motion.ts:18-19` constrained to `.h1-section, .work-row, .prose-editorial p, .about-body p`. Lighthouse TBT=0 / CLS=0.0016 confirms (16-VERIFICATION.md §1). |
| T-16-04-05 | Repudiation (build artifact) | accept | `pnpm build` deterministic; no external network during build. |
| T-16-04-06 | Spoofing | accept | n/a. |
| T-16-04-07 | EoP | accept | n/a. |
| T-16-04-08 | D-26 chat regression | mitigate | Zero edits to chat rules/selectors/tests in Plan 04 commits (`1020ffd`, `995f5b2`, `a6f326a`). Full chat sweep 117/117 GREEN per 16-VERIFICATION.md §2. |

---

## Plan 16-05 — chat.ts D-15 ordering + chat-pulse + chat-panel scale-in

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-16-05-01 | Tampering / DoA (focus-trap race) | mitigate | `src/scripts/chat.ts:540` `stopPulse($bubble)` (sets `data-pulse-paused`) executes BEFORE `src/scripts/chat.ts:599` `setupFocusTrap($panel, closePanel)` within `openPanel()`. Locked by call-order assertion at `tests/client/chat-pulse-coordination.test.ts:77-105` (`pulseIdx < keydownIdx` GREEN). Note: line numbers shifted from threat-doc (527/585) to (540/599) due to comment additions; ordering invariant intact. |
| T-16-05-02 | Tampering (data-pulse-paused spoofed) | accept | Cosmetic — bubble stops pulsing at worst. |
| T-16-05-03 | InfoDisclosure | accept | n/a — visual only. |
| T-16-05-04 | DoS (CSS animation perf) | mitigate | Lighthouse TBT=0 / CLS≤0.0016 (16-VERIFICATION.md §1). 2500ms loop on single 48px bubble; pulse pauses on hover/focus/panel-open via paired CSS rules in `src/styles/global.css:638-679`. |
| T-16-05-05 | D-26 chat regression | mitigate | `git diff 721f844 -- src/pages/api/chat.ts` returns 0 lines (D-15 server gate). Full Phase 7 battery 117/117 GREEN per 16-VERIFICATION.md §2. |
| T-16-05-06 | Repudiation | mitigate | Two atomic commits: `09284d3 feat(16-05): wire chat.ts D-15 pulse coordination + .is-open class hooks` + `c98a87d feat(16-05): extend global.css with chat-pulse + chat-panel scale-in (MOTN-04/05/06)`. |
| T-16-05-07 | Spoofing | accept | n/a. |
| T-16-05-08 | EoP | accept | n/a. |

---

## Plan 16-06 — WorkRow.astro CSS-only

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-16-06-01 | Tampering (arrow affordance regression) | mitigate | `tests/build/work-arrow-motion.test.ts:33-36` asserts hover/focus rule has both `opacity: 1` AND `transform: translateX(4px)`. Confirmed at `src/components/primitives/WorkRow.astro:98-102`. GREEN. |
| T-16-06-02 | Tampering (title underline removed) | mitigate | `tests/build/work-arrow-motion.test.ts:43-46` asserts `text-decoration: underline` + `text-decoration-color: var(--accent)`. Confirmed at `src/components/primitives/WorkRow.astro:90-96`. GREEN. |
| T-16-06-03 | InfoDisclosure | accept | n/a — pure CSS. |
| T-16-06-04 | DoA (focus ring under reduce) | mitigate | `src/components/primitives/WorkRow.astro:104-107` `.work-row:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` is OUTSIDE the `@media (prefers-reduced-motion: reduce)` block (113-124). Reduce only neutralizes the arrow translation/opacity; focus ring shows unconditionally. |
| T-16-06-05 | Repudiation | mitigate | Single atomic commit: `cfe24ba feat(16-06): upgrade WorkRow arrow with translateX hover/focus + paired reduce override (MOTN-03)`. |
| T-16-06-06 | Spoofing/EoP | accept | n/a. |

---

## Plan 16-07 — Lighthouse + UAT phase gate

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-16-07-01 | Tampering (faked Lighthouse JSON) | accept | Local execution; `lighthouse-home.json` + `lighthouse-project.json` committed for audit; gate is repeatable. |
| T-16-07-02 | Tampering (UAT signoff faked) | mitigate | 13-row granular UAT table preserved in 16-VERIFICATION.md (frontmatter `uat_signoff` documents specific behavior observed). Each row independently verifiable. |
| T-16-07-03 | InfoDisclosure (Lighthouse paths) | accept | All URLs are localhost or public production paths; no secrets in committed JSON. |
| T-16-07-04 | DoS (dev server fails) | mitigate | 16-VERIFICATION.md §1 documents server returned 200 before Lighthouse run; localhost http-server preview ran cleanly. |
| T-16-07-05 | Repudiation | mitigate | Two atomic Plan-07 commits in log; commit messages reference MOTN-10 phase gate. |
| T-16-07-06 | Spoofing | accept | n/a. |
| T-16-07-07 | EoP | accept | n/a. |
| T-16-07-08 | D-26 chat regression at phase close | mitigate | 16-VERIFICATION.md §2: explicit 8-file D-26 battery 117/117 GREEN. |

---

## D-15 / D-19 Byte-Identical Gates

| Gate | Path | Phase-start SHA | Diff lines | Status |
|------|------|-----------------|------------|--------|
| D-15 server | `src/pages/api/chat.ts` | `721f844` | 0 | PASS |
| D-19 scroll-depth | `tests/client/scroll-depth.test.ts` | `721f844` | 0 | PASS |
| D-19 analytics | `tests/client/analytics.test.ts` | `721f844` | 0 | PASS |

Verified by `git diff 721f844 -- <path>` returning empty output.

---

## Test Suite Verification

`pnpm vitest run` against the 9 Phase 16 verification files:

| Test File | Result |
|-----------|--------|
| tests/build/work-arrow-motion.test.ts | PASS |
| tests/build/motion-doc.test.ts | PASS |
| tests/build/motion-css-rules.test.ts | PASS |
| tests/client/motion.test.ts | PASS |
| tests/client/observer-factory.test.ts | PASS |
| tests/client/chat-pulse-coordination.test.ts | PASS |
| tests/client/reduced-motion.test.ts | PASS |
| tests/client/scroll-depth.test.ts | PASS |
| tests/client/analytics.test.ts | PASS |
| **TOTAL** | **104/104 GREEN** |

---

## Unregistered Flags

None. SUMMARY files (16-03-SUMMARY.md §"Threat Surface Scan", 16-07-SUMMARY.md §"Threat Surface Scan") explicitly confirm no new security-relevant surface beyond the registered threat models. All 7 plan-level threat registers cover the full Phase 16 attack surface; the 16-VERIFICATION.md §"D-26 Chat Regression Battery" + §"D-15 Byte-Identical" gates confirm the high-risk Phase 7 boundary remained intact.

---

## Accepted Risks Log

| Threat ID | Acceptance Rationale |
|-----------|----------------------|
| T-16-01-02, T-16-01-05 | Test files have no secrets / no privilege surface. |
| T-16-01-03 | Vitest runner DoS bounded by <2s/file budget; 9 Phase 16 files run in ~4s total. |
| T-16-02-02 | Umami payload (`{percent, slug}`) unchanged from Phase 15 D-12 content-free policy. |
| T-16-02-03, T-16-02-05, T-16-02-06 | No observation overhead delta; no auth/privilege boundaries crossed. |
| T-16-03-03, T-16-03-05, T-16-03-06 | Documentation surface — no runtime/auth/privilege paths. |
| T-16-04-02 | Browser-enforced same-origin guarantee (MDN @view-transition spec) — no app-layer mitigation possible or required. |
| T-16-04-03 | data-stagger-split spoofing is cosmetic only — at worst skips word-stagger animation. |
| T-16-04-05, T-16-04-06, T-16-04-07 | Deterministic build (no network); no auth/privilege surface. |
| T-16-05-02 | data-pulse-paused spoofing pauses pulse animation only — no security impact. |
| T-16-05-03, T-16-05-07, T-16-05-08 | Visual-only / no auth / no privilege surface. |
| T-16-06-03, T-16-06-06 | Pure CSS — no data flows, no auth/privilege surface. |
| T-16-07-01 | Lighthouse JSON tampering risk accepted; output committed for audit; gate is repeatable on demand. |
| T-16-07-03 | Localhost / public production paths only — no secrets in artifacts. |
| T-16-07-06, T-16-07-07 | n/a — verification gate, no auth/privilege surface. |

---

## ASVS L1 Posture

Phase 7 ASVS L1 controls (CSP via DOMPurify, exact-origin CORS allow-list, 5/60s rate limit, input validation, 30s AbortController timeout, focus-trap re-query) are PRESERVED — confirmed by:
- D-15 byte-identical `src/pages/api/chat.ts` (0-line diff vs phase-start SHA `721f844`)
- D-26 chat regression battery 117/117 GREEN (`tests/api/{chat,security,prompt-injection}.test.ts` + `tests/client/{markdown,chat-copy-button,sse-truncation,focus-visible,chat-widget-header}.test.ts`)

Phase 16's new surface (motion.ts DOM mutation) is bounded by the V5 input-validation pattern: `textContent` + `createElement` only, never `innerHTML`. Verified by code inspection (`src/scripts/motion.ts:45-65`) and assertion test (`tests/client/motion.test.ts:190-200`).

---

## Audit Trail

### Security Audit 2026-04-27

| Metric | Count |
|--------|-------|
| Threats found | 47 |
| Closed | 47 |
| Open | 0 |
| Unregistered flags | 0 |

Auditor: `gsd-security-auditor` (read-only verification; no implementation files modified).
Method: per-threat evidence lookup against source files, test assertions, and `git diff` byte-identical gates against phase-start SHA `721f844`.
Outcome: **SECURED** — all 24 `mitigate` threats have controls verified in code/tests; all 23 `accept` threats have rationale consistent with SUMMARY/VERIFICATION corpus.
