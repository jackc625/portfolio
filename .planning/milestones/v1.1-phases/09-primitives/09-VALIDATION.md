---
phase: 09
slug: primitives
status: validated
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-08
audit_mode: retroactive-state-b
---

# Phase 9 — Validation Strategy

> Per-phase validation contract. **Reconstructed retroactively (State B)** after the phase shipped — no VALIDATION.md existed at plan time. All 22 automated gaps were reviewed on 2026-04-08 and explicitly marked **manual-only** by the developer based on the phase's character (pure Astro/CSS component library; regressions surface as visual breakage, not logic errors).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.ts` (node env, globals, includes `tests/**/*.test.ts`) |
| **jsdom mode** | Available per-file via `// @vitest-environment jsdom` directive |
| **Quick run command** | `pnpm run test` |
| **Full suite command** | `pnpm run test` (single mode — vitest `run`) |
| **Full build gate** | `pnpm run build` (runs `wrangler types && astro check && astro build && node scripts/pages-compat.mjs`) |
| **Existing test files** | 4 (`tests/api/chat.test.ts`, `tests/api/security.test.ts`, `tests/api/validation.test.ts`, `tests/client/markdown.test.ts`) |
| **Existing test count** | 52 tests — all Phase 7/8 chat API + markdown; **zero Phase 9 coverage** |
| **Estimated runtime** | ~3 seconds (52 tests in 2.77s at HEAD `372ef48`) |

---

## Sampling Rate

- **After every task commit:** Not applicable (retroactive — phase already shipped)
- **After every plan wave:** `pnpm run build` + `pnpm run check` + `pnpm run lint` + `pnpm run test` (the Phase 9 D-29 gate, re-runnable as a CI guardrail)
- **Before `/gsd-verify-work`:** Full gate must be green (was green at HEAD `372ef48` on 2026-04-08)
- **Max feedback latency:** ~15 seconds (build + check + lint + test combined)

---

## Per-Task Verification Map

Phase 9 has 8 plans × multiple tasks. Requirement column shows "none" because Phase 9 is a sequencing/foundation phase with no direct `REQUIREMENTS.md` entries (per ROADMAP §Phase 9 — satisfies HOME/ABOUT/WORK/CONTACT/CHAT requirements **indirectly** as the Phase 10 substrate).

| Task ID | Plan | Wave | Truth | Test Type | Automated Command | Status |
|---------|------|------|-------|-----------|-------------------|--------|
| 09-01-01 | 01 | 1 | MASTER §5.8 rebuild decision recorded (container-query 380px, overlay contents, a11y, no-animation) | grep | `rtk grep -c "### 5.8 Mobile nav" design-system/MASTER.md` | ✅ verified at commit |
| 09-01-02 | 01 | 1 | MASTER §5.2 mobile footer stack recorded | grep | `rtk grep -c "Mobile stack — Phase 9 D-10 amendment" design-system/MASTER.md` | ✅ verified at commit |
| 09-02-01 | 02 | 2 | 7 typography role classes (`.display`, `.h1-section`, `.h2-project`, `.lead`, `.body`, `.label-mono`, `.meta-mono`) + `.tabular` exist in `src/styles/global.css` with exact mockup.html values | build | `rtk pnpm run build` | ⚠️ manual-only (see below) |
| 09-02-02 | 02 | 2 | `.container`, `.section`, `.section-rule` with responsive breakpoints (1023px, 767px) | build | `rtk pnpm run build` | ⚠️ manual-only |
| 09-02-03 | 02 | 2 | Phase 8 token layer, @theme bridge, `.nav-link-hover`, print block, chat block untouched (D-26 hands-off) | git diff | `git diff HEAD~N -- src/styles/global.css` | ✅ verified at commit |
| 09-02-04 | 02 | 2 | No new color tokens, no oklch | grep | `rtk grep -c oklch src/styles/global.css` → 0 | ✅ verified at commit |
| 09-03-01 | 03 | 3 | `Container.astro` renders `as=`-polymorphic wrapper applying global `.container` | astro check | `rtk pnpm run check` | ⚠️ manual-only |
| 09-03-02 | 03 | 3 | `MetaLabel.astro` renders mono caption with 3 color variants | astro check | `rtk pnpm run check` | ⚠️ manual-only |
| 09-03-03 | 03 | 3 | `StatusDot.astro` renders 6px accent dot composing MetaLabel | astro check | `rtk pnpm run check` | ⚠️ manual-only |
| 09-03-04 | 03 | 3 | `SectionHeader.astro` renders `§ NN — TITLE` + optional count + `.section-rule` | astro check | `rtk pnpm run check` | ⚠️ manual-only |
| 09-03-05 | 03 | 3 | No Tailwind utilities, no inline hex, 6-token palette locked | grep | `rtk grep -cE "oklch|#[0-9a-fA-F]{3,6}" src/components/primitives/*.astro` → 0 | ✅ verified at commit |
| 09-04-01 | 04 | 4 | `Header.astro` sticky 72px + wordmark + 3-link nav + container-query hamburger 380px | astro check | `rtk pnpm run check` | ⚠️ manual-only |
| 09-04-02 | 04 | 4 | `Footer.astro` 64px desktop + 3-row mobile stack at <768px | astro check | `rtk pnpm run check` | ⚠️ manual-only |
| 09-04-03 | 04 | 4 | `WorkRow.astro` 56px/1fr/auto grid + hover-reveal arrow | astro check | `rtk pnpm run check` | ⚠️ manual-only |
| 09-04-04 | 04 | 4 | `MobileMenu.astro` full-screen dialog + focus trap + Escape/backdrop close | astro check | `rtk pnpm run check` | ⚠️ manual-only |
| 09-04-05 | 04 | 4 | Header computes active link via `Astro.url.pathname` (D-27, no `currentPath` prop) | grep | `rtk grep -c "Astro.url.pathname" src/components/primitives/Header.astro` | ✅ verified at commit |
| 09-04-06 | 04 | 4 | MobileMenu focus trap re-queries focusable elements on every Tab keypress | **jsdom DOM** | _none — logic lives in inline `<script>` block, no extracted module_ | ⚠️ manual-only |
| 09-04-07 | 04 | 4 | MobileMenu init lifecycle registers BOTH `DOMContentLoaded` AND `astro:page-load` listeners | grep | `rtk grep -c "astro:page-load" src/components/primitives/MobileMenu.astro` | ✅ verified at commit |
| 09-04-08 | 04 | 4 | No GSAP, no staggered entrance animation | grep | `rtk grep -ci "gsap\|keyframes menuLinkIn" src/components/primitives/*.astro` → 0 | ✅ verified at commit |
| 09-05-01 | 05 | 5 | BaseLayout imports from `primitives/` path | grep | `rtk grep -c "components/primitives/Header" src/layouts/BaseLayout.astro` | ✅ verified at commit |
| 09-05-02 | 05 | 5 | Old v1.0 `Header`/`Footer`/`MobileMenu` deleted from `src/components/` | ls | `ls src/components/{Header,Footer,MobileMenu}.astro 2>/dev/null` → 3 missing | ✅ verified at commit |
| 09-05-03 | 05 | 5 | Stub pages render new editorial chrome | build | `rtk pnpm run build` → 11 pages prerendered | ✅ gate PASS |
| 09-05-04 | 05 | 5 | ChatWidget import/render untouched (D-26 regression) | grep | `rtk grep -c "ChatWidget" src/layouts/BaseLayout.astro` ≥ 2 | ✅ verified at commit |
| 09-05-05 | 05 | 5 | `pnpm run build` succeeds with new primitives | build | `rtk pnpm run build` | ✅ gate PASS |
| 09-06-01 | 06 | 3 | `NextProject.astro` restyled (no `bg-rule`, no `py-24`, no `translate-x`) | grep negative | `rtk grep -cE "bg-rule\|py-24\|translate-x" src/components/NextProject.astro` → 0 | ✅ verified at commit |
| 09-06-02 | 06 | 3 | `NextProject.astro` public API `{ project: CollectionEntry<'projects'> }` unchanged | astro check | `rtk pnpm run check` | ✅ gate PASS |
| 09-06-03 | 06 | 3 | `NextProject.astro` uses `.h2-project` + opacity-only arrow + `.section` rhythm | grep | `rtk grep -c "h2-project" src/components/NextProject.astro` | ✅ verified at commit |
| 09-06-04 | 06 | 3 | `JsonLd`/`SkipToContent`/`ArticleImage` verify-only, no edits | git diff | `git diff HEAD~N -- src/components/{JsonLd,SkipToContent,ArticleImage}.astro` → empty | ✅ verified at commit |
| 09-06-05 | 06 | 3 | No new tokens, no oklch, no GSAP in kept components | grep | `rtk grep -cE "oklch\|gsap" src/components/{JsonLd,SkipToContent,ArticleImage,NextProject}.astro` → 0 | ✅ verified at commit |
| 09-07-01 | 07 | 6 | `BaseLayout.astro` exposes named `<slot name="head" />` (BLOCKER 1 fix) | grep | `rtk grep -c "slot name=\"head\"" src/layouts/BaseLayout.astro` | ✅ verified at commit |
| 09-07-02 | 07 | 6 | `/dev/primitives` route renders every primitive with sample data + SectionHeader labels | build | `rtk pnpm run build` generates `dist/dev/primitives/index.html` | ✅ gate PASS |
| 09-07-03 | 07 | 6 | MobileMenu previewable at any viewport (planner trigger or 375px wrapper) | n/a | _visual only_ | ⚠️ manual-only |
| 09-07-04 | 07 | 6 | `/dev/primitives` excluded from sitemap-index.xml | sitemap inspect | `rtk grep -c "dev/primitives" dist/sitemap-0.xml` → 0 | ⚠️ manual-only (post-build) |
| 09-07-05 | 07 | 6 | `/dev/primitives` disallowed in `public/robots.txt` | grep | `rtk grep -c "Disallow: /dev/" public/robots.txt` | ✅ verified at commit |
| 09-07-06 | 07 | 6 | `/dev/primitives` emits noindex meta in built HTML | build output | `rtk grep -c "noindex" dist/dev/primitives/index.html` | ⚠️ manual-only (post-build) |
| 09-08-01 | 08 | 7 | `pnpm run build` exit 0 | build | `rtk pnpm run build` | ✅ gate PASS |
| 09-08-02 | 08 | 7 | `pnpm run lint` exit 0 | lint | `rtk pnpm run lint` | ✅ gate PASS |
| 09-08-03 | 08 | 7 | `pnpm run check` exit 0 | check | `rtk pnpm run check` | ✅ gate PASS |
| 09-08-04 | 08 | 7 | `pnpm run test` exit 0 (52 tests) | test | `rtk pnpm run test` | ✅ gate PASS |
| 09-08-05 | 08 | 7 | Manual chat smoke test (D-26) | manual | n/a | ⚠️ manual-only (D-29 item 5) |
| 09-08-06 | 08 | 7 | `/dev/primitives` visual parity vs mockup.html at 1440px + 375px (D-30) | manual | n/a | ⚠️ manual-only (D-30) |
| 09-08-07 | 08 | 7 | VERIFICATION.md written | file exists | `ls .planning/phases/09-primitives/VERIFICATION.md` | ✅ verified |

*Status legend: ✅ green · ⚠️ manual-only · ❌ red · ⬜ pending · 🔲 flaky*

**Coverage summary:**
- Total truths: 44
- ✅ Verified by existing build gate + git + grep: 21
- ⚠️ Manual-only (visual parity, chat smoke test, post-build inspection, untestable-without-refactor focus trap): 14 + the 9 primitive markup contracts the user elected not to codify = 23
- ❌ Uncovered: 0

---

## Wave 0 Requirements

*Retroactive audit — Wave 0 not applicable (phase shipped 2026-04-08).*

Existing infrastructure (Vitest 4.1.0 + jsdom + 4 test files) covers the Phase 7/8 surface. Phase 9 added zero new automated tests; the developer elected to accept manual-only coverage on 2026-04-08 during the State B retroactive audit.

---

## Manual-Only Verifications

| Behavior | Truth / Plan | Why Manual | Test Instructions |
|----------|--------------|------------|-------------------|
| `/dev/primitives` visual parity vs `mockup.html` at desktop + mobile | 09-08-06 (D-30) | Visual regression requires human eye; no screenshot infra in repo | `pnpm run dev`, open `/dev/primitives`, compare to `mockup.html` at 1440px + 375px viewport. Check: Header 72px sticky, wordmark Geist Mono 0.875rem, container-query hamburger at 375px, WorkRow 56px num column, Footer 64px with 3-row stack at <768px, StatusDot 6px accent |
| Chat widget smoke test (D-26 regression gate) | 09-08-05 (D-29 item 5) | End-to-end SSE streaming + Anthropic API + focus trap + DOM state; not feasible in vitest without mocking the whole runtime | `pnpm run dev`, open any stub page, click chat bubble, send "hello", confirm: SSE streaming response in Geist Mono, focus trap on Tab, Escape closes, × closes, no console errors, bubble re-opens cleanly |
| MobileMenu focus trap re-queries on every Tab | 09-04-06 (D-08) | Logic lives inside inline `<script>` in `MobileMenu.astro` (not an extracted module); testing would require jsdom HTML load + script execution OR a refactor to extract `setupFocusTrap` to `src/scripts/focus-trap.ts` | Manual: open mobile menu at 375px viewport, Tab through all 8 focusable elements, Shift+Tab reverse. Confirm focus stays trapped. Developer verified on 2026-04-08 (09-08 manual gate) |
| MobileMenu container query hamburger swap at 380px | 09-04-01 / D-06 | Container query behavior depends on layout engine; jsdom does not implement container queries | Manual: resize dev-tools viewport slowly across 380px threshold, confirm inline nav hides and hamburger appears when `.header-inner` crosses 380px wide |
| Global CSS role class typography values (clamp sizes, line-heights, letter-spacing) | 09-02-01 / 09-02-02 | Static grep on values is possible but brittle; no behavioral impact if values drift by small amounts | Manual: compare `src/styles/global.css` LAYER 3 block against `mockup.html` lines 55-99 + 188-203 + 329-344. Any drift is a regression |
| Primitive markup contract (Container `as=` polymorphic, MetaLabel color variants, StatusDot composition, SectionHeader conditional count, Header container query, Footer 3-row stack, WorkRow grid template, MobileMenu dialog a11y) | 09-03-01..04, 09-04-01..04 | Astro experimental Container API would be required for unit render tests; phase-level decision to skip test generation on 2026-04-08 | Manual: read each primitive against its PLAN acceptance_criteria block; re-run `pnpm run check` + `pnpm run build` after any edit |
| `/dev/primitives` sitemap exclusion | 09-07-04 | Requires running `pnpm run build` then parsing `dist/sitemap-0.xml`; not currently automated in CI | Manual after any astro.config.mjs change: `pnpm run build`, then `rtk grep -c "dev/primitives" dist/sitemap-0.xml` → must be 0 |
| `/dev/primitives` noindex meta in built HTML | 09-07-06 | Requires build step + HTML parse; not currently automated | Manual after any BaseLayout.astro or `/dev/primitives.astro` change: `pnpm run build`, then `rtk grep -c 'name="robots" content="noindex"' dist/dev/primitives/index.html` → must be ≥ 1 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify OR are documented as manual-only with rationale
- [x] Sampling continuity: the full-gate (`build` + `lint` + `check` + `test`) runs on every phase commit, satisfying the "no 3 consecutive tasks without automated verify" rule
- [x] Wave 0 N/A (retroactive State B)
- [x] No watch-mode flags (vitest runs in `run` mode via `pnpm run test`)
- [x] Feedback latency ≤ 15s (build+lint+check+test combined)
- [ ] `nyquist_compliant: true` — **NOT SET** (9 primitive markup contracts + MobileMenu focus trap are manual-only by deliberate developer decision)

**Developer decision (2026-04-08):** Phase 9 is a pure Astro/CSS component library. Regressions primarily surface as visual breakage, not logic errors. The manual gate (09-08 + VERIFICATION.md) + full build gate already cover 21/44 truths automatically, and the remaining 23 are either visual (requires human eye), post-build (requires running `pnpm run build`), or inline-script (requires refactor). The developer accepted manual-only status for the 23 uncovered truths rather than adding brittle static-source grep tests or refactoring impl code post-hoc. Future Phase 10 page work may warrant a test strategy reassessment if the primitive library sees heavy reuse.

**Approval:** validated 2026-04-08 (State B retroactive audit)

---

## Validation Audit 2026-04-08

| Metric | Count |
|--------|-------|
| Gaps found | 22 |
| Resolved (tests added) | 0 |
| Escalated / marked manual-only | 22 |
| Already covered by build gate + git | 21 |
| Already manual-only by design (D-29/D-30) | 2 |

**Audit trail:** This VALIDATION.md was reconstructed on 2026-04-08 by `/gsd-validate-phase 9` after the phase shipped (State B). No automated tests were generated. Developer elected manual-only coverage for all 22 Phase 9 automation gaps based on the component-library character of the phase.
