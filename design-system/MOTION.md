# Jack Cutrara Portfolio — Motion System (MOTION.md)

> **Milestone:** v1.2 Motion Layer
> **Phase:** 16 (Motion)
> **Status:** Locked at Phase 16 sign-off — supersedes MASTER.md §6 (v1.1 motion lock)
> **Authoritative for:** all v1.2+ motion decisions. MASTER.md §2-§5, §7-§10 still bind for non-motion concerns.

---

## 1. Overview

This document is the canonical contract for motion in the Jack Cutrara portfolio site. It supersedes the v1.1 motion stance in MASTER.md §6, which has been replaced with a stub pointer to this file.

The site's motion philosophy is **tasteful and quiet**. The editorial design system locked in v1.1 favors restraint over spectacle; motion in v1.2 layers on top of that locked surface to add cadence and hierarchy without compromising performance, accessibility, or the editorial aesthetic.

Three principles bind every animation in this document:

1. **Native platform only.** Cross-document `@view-transition`, IntersectionObserver, CSS `@keyframes`, CSS transitions. Zero `package.json` runtime dependencies for motion. GSAP is prohibited (MASTER.md §8). `<ClientRouter />` is prohibited (MASTER.md §8). The `motion` npm package and Lenis smooth-scroll are documented anti-patterns.
2. **Reduced-motion is a first-class concern.** Every entrance animation lives inside `@media (prefers-reduced-motion: no-preference)`; every looped animation is paired with an explicit `@media (prefers-reduced-motion: reduce)` neutralizer. The first test in every motion feature is the reduced-motion negative case.
3. **Lighthouse holds.** Performance ≥ 99, Accessibility ≥ 95, Best Practices = 100, SEO = 100, TBT ≤ 150 ms, CLS ≤ 0.01. Motion that risks any of these gates does not ship.

This document is technical specification — third-person spec voice, no marketing prose.

---

## 2. Property Whitelist

Animations may move only the following CSS properties. Every other property is prohibited unless an amendment to this document is committed first.

| Property | Allowed | Why |
|----------|---------|-----|
| `transform` (translate, scale) | YES | GPU-composited; no layout / paint cost |
| `opacity` | YES | GPU-composited; no layout / paint cost |
| `box-shadow` | YES (chat bubble pulse only) | Paint-only; no layout shift; one declared use site (MOTN-04) |
| `color`, `background-color`, `text-decoration-color` | YES (existing hover/focus state transitions only — sub-200ms) | Inherited from MASTER.md §6.2; not new |
| `width`, `height`, `margin`, `padding`, `top` / `left` / `right` / `bottom`, `border-width`, `font-size` | PROHIBITED | Layout-triggering; banned to protect Lighthouse Performance ≥ 99 and CLS ≤ 0.01 |
| `filter`, `backdrop-filter` | PROHIBITED | Expensive paint; not needed for the editorial cadence |

The `box-shadow` allowance is scoped narrowly to the chat bubble pulse ring (MOTN-04). No other component may animate `box-shadow`.

---

## 3. Duration Bands

| Band | Duration | Used by |
|------|----------|---------|
| Snap | 120ms | Legacy hover transitions (MASTER.md §6.2 — already on the floor) |
| Tap | 180ms | WorkRow arrow (MOTN-03), chat panel scale-in (MOTN-05) |
| Reveal | 250–350ms (default 300ms for section reveals; 250ms for word-stagger per word) | Scroll-reveal (MOTN-02), word-stagger (MOTN-07) |
| View-transition | 200ms | Cross-document fade (MOTN-01) |
| Loop-fast | 600ms | Typing-dot bounce (MOTN-06 — already live) |
| Loop-slow | 2500ms | Chat bubble pulse (MOTN-04) |

**Tolerance:** ±20ms is acceptable rounding; outside that band, file an amendment to this document.

---

## 4. Easing Defaults

| Use | Easing | Why |
|-----|--------|-----|
| Entrances (reveal, stagger, scale-in, view-transition) | `ease-out` | Decelerating curve — feels "settling into place" |
| Loops (pulse, typing-dot bounce) | `ease-in-out` | Symmetric breathing rhythm |
| Hover / focus state changes | `ease` (browser default) | Inherited from MASTER.md §6.2 |

Custom curves via the `cubic-bezier` CSS function are prohibited in v1.2. The named easings above cover every animation specified in this document. Adding a custom curve later requires an amendment.

---

## 5. Animation Specs

Each row below is the locked specification for one animation. Every value originates in `.planning/phases/16-motion-layer/16-UI-SPEC.md` and must remain consistent if either document is amended.

| ID | Name | Trigger | From → To | Duration | Easing | Reduced-motion |
|----|------|---------|-----------|----------|--------|----------------|
| MOTN-01 | Page-enter fade | Cross-document navigation (`@view-transition { navigation: auto; }`) | `::view-transition-old(root)` opacity 1→0; `::view-transition-new(root)` opacity 0→1 | 200ms | `ease-out` | `@media (prefers-reduced-motion: reduce)` neutralizes via `animation: none` on both pseudo-elements |
| MOTN-02 | Scroll-reveal | IntersectionObserver `rootMargin: "0px 0px -10% 0px"`, `threshold: 0`; one-shot via `unobserve()` after first intersect | opacity 0→1 + translateY 12px→0 | 300ms | `ease-out` | Wrapped in `@media (prefers-reduced-motion: no-preference) { ... }`. Under `reduce`, elements render at resting state immediately. |
| MOTN-03 | WorkRow arrow slide-in | `.work-row:hover` / `.work-row:focus-visible` | `.work-arrow` opacity 0→1 + translateX 0→4px | 180ms | `ease-out` | Inside `no-preference`. Under `reduce`, arrow remains opacity 0; accent title underline still appears as the affordance. |
| MOTN-04 | Chat bubble pulse | Idle (no hover, no focus, panel closed) | Combined: box-shadow ring `0 0 0 0 rgba(230, 57, 70, 0.4)` → `0 0 0 16px rgba(230, 57, 70, 0)`; transform scale(1.0) → scale(1.02) at 50% → scale(1.0) at 100% | 2500ms | `ease-in-out` (loop) | Paused on `:hover`, `:focus-visible`, and `[data-pulse-paused]` (set by `chat.ts` `openPanel()`). Paired `@media (prefers-reduced-motion: reduce) { #chat-bubble { animation: none; } }` neutralizer. |
| MOTN-05 | Chat panel scale-in | Panel open (`chat.ts openPanel()` adds `.is-open` class) | transform scale(0.96) → scale(1.0) + opacity 0→1; `transform-origin: bottom right` | 180ms | `ease-out` | Inside `no-preference`. Under `reduce`, panel renders at scale(1) opacity 1 immediately. |
| MOTN-06 | Typing-dot bounce | Chat SSE streaming active (`#chat-typing` becomes `display: flex`) | translateY 0 → -4px → 0 (3 dots, 150ms phase-shift each) | 600ms | `ease-in-out` (loop) | Already live at `src/styles/global.css:260-280`. v1.2 extends with paired `reduce` override for parity (`.typing-dot { animation: none; }`). |
| MOTN-07 | `.h1-section` word-stagger | Same IntersectionObserver trigger as MOTN-02 | Per-word: opacity 0→1 + translateY 8px→0; 60ms delay between words via `--i` CSS custom property and `animation-delay: calc(var(--i) * 60ms)` | 250ms per word | `ease-out` | Inside `no-preference`. Under `reduce`, `motion.ts` skips the span-wrap entirely; heading renders as plain text in resting state. **Never applied to `.display`.** |

**`.display` exclusion (MOTN-07):** the homepage `.display` wordmark is excluded from word-stagger AND scroll-reveal. The hero remains untouched, satisfying Phase 16 success criterion #1.

---

## 6. Reduced-Motion Contract (MOTN-08)

Two patterns coexist in the codebase:

1. **Wrap-in-no-preference** — used for entrance animations (MOTN-01, MOTN-02, MOTN-05, MOTN-07):

   ```css
   @media (prefers-reduced-motion: no-preference) {
     /* entrance animation only fires when user hasn't requested reduce */
   }
   ```

2. **Unconditional + paired-reduce-override** — used for loops (MOTN-04 chat pulse, MOTN-06 typing-dot bounce):

   ```css
   /* unconditional rule */
   #chat-bubble { animation: chat-pulse 2500ms ease-in-out infinite; }
   /* paired override neutralizes the rule under reduce */
   @media (prefers-reduced-motion: reduce) {
     #chat-bubble { animation: none; }
   }
   ```

**Pattern selection:** entrance animations should default to OFF for reduce users (no-preference wrap). Loops with state-signaling side effects (the bubble pulse signals "active state") follow the paired-override pattern so the animation declaration is co-located with its neutralizer for reviewability.

`motion.ts` reads `matchMedia('(prefers-reduced-motion: reduce)').matches` once at init time. When `reduce` matches, `motion.ts` returns immediately — no IntersectionObserver is constructed, no `splitWords` runs, no DOM mutation occurs. Heading text renders as plain text (no `<span class="word">` children). The `change` event on the media query is intentionally NOT listened to — cross-document navigation re-reads the media query on the next page load, which is acceptable for the editorial cadence.

**The first test in every motion feature is the reduced-motion negative case** (ROADMAP "Reduced-Motion Contract" gate).

---

## 7. File Ownership

| File | Role | Status |
|------|------|--------|
| `design-system/MOTION.md` (this file) | v1.2 motion canonical doc | NEW (Phase 16 Plan 03) |
| `design-system/MASTER.md` §6 | 3-line stub pointing to MOTION.md | REPLACED (Phase 16 Plan 03) |
| `design-system/MASTER.md` §8 | Anti-pattern list — `::view-transition-*` ban amended to permit MOTION.md authorization | AMENDED (Phase 16 Plan 03) |
| `src/scripts/lib/observer.ts` | Shared IntersectionObserver factory | NEW (Phase 16 Plan 02) |
| `src/scripts/motion.ts` | Scroll-reveal + word-stagger + reduced-motion gate | NEW (Phase 16 Plan 04) |
| `src/scripts/scroll-depth.ts` | Refactored to consume `makeRevealObserver` factory | MODIFIED (Phase 16 Plan 02) |
| `src/scripts/chat.ts:451-457` | `startPulse` / `stopPulse` replaced with `data-pulse-paused` attribute toggling | MODIFIED (Phase 16 Plan 05; D-26 chat regression gate applies) |
| `src/styles/global.css` | View-transition rule + chat-pulse keyframes + reveal classes + word-stagger + chat-panel scale-in | MODIFIED (Phase 16 Plan 04 + Plan 05) |
| `src/styles/global.css:260-280` | Already-live `@keyframes typing-bounce` | DO NOT TOUCH (MOTN-06 zero-cost; optional `reduce` extension at Plan 05's discretion) |
| `src/components/primitives/WorkRow.astro:81-98` | Arrow upgrade (opacity 120ms + transform 180ms ease-out, hover translateX 4px, paired `reduce` override) | MODIFIED (Phase 16 Plan 06) |
| `src/layouts/BaseLayout.astro:118-121` | Adds `import "../scripts/motion.ts";` to existing processed script block | MODIFIED (Phase 16 Plan 04) |

---

## 8. Lighthouse Gate (MOTN-10)

After every motion change, Lighthouse CI runs on the homepage plus one project detail page. Acceptable thresholds:

- Performance ≥ 99
- Accessibility ≥ 95
- Best Practices = 100
- SEO = 100
- Total Blocking Time ≤ 150ms
- Cumulative Layout Shift ≤ 0.01

Stress conditions verified by automated tests:

- `grep -c "will-change" src/styles/global.css` returns 0 — `will-change` declarations risk sticky GPU promotion that compounds over a session
- The custom-easing CSS function count in `src/styles/global.css` returns 0 — named easings only
- IntersectionObserver target count stays under 30 per page (the largest count is `/projects/[id]` with the 4 scroll-depth sentinels + reveal targets — measured well under cap)
- No new `package.json` runtime dependency

If any threshold drops below the bar after a motion-related change, the change does not merge.

---

## 9. Anti-Patterns

These do not ship under any circumstance in v1.2+:

- **Custom CSS easing curves** — named easings only (§4); the `cubic-bezier` CSS function is prohibited
- **`will-change` declarations** — transform and opacity are GPU-composited natively; sticky promotion compounds across navigations
- **Layout-triggering property animations** (width / height / padding / margin / top / left / etc.) — banned by §2 property whitelist
- **`<ClientRouter />`** — Phase 8 removed it; `@view-transition` cross-document is the v1.2 path (MOTN-01)
- **`transition:persist` on Astro elements** — collides with chat localStorage persistence (Phase 7 D-29)
- **GSAP** — uninstalled in Phase 8; reintroduction requires reverting v1.1 sign-off
- **Lenis smooth-scroll** — known Astro compatibility issues; native CSS `scroll-behavior: smooth` covers v1.2 needs
- **`motion` npm package** — listed in REQUIREMENTS.md Future as optional; not on the v1.2 path
- **Scroll-driven animations beyond the MOTN-02 reveal** — no parallax, no pin-to-viewport, no scroll-progress bars
- **Canvas / WebGL / Three.js for decorative motion** — banned in MASTER.md §8; not reintroduced

---

## 10. Changelog

- **v1.2 — Phase 16 (2026-04-27):** Initial authoring. MASTER.md §6 superseded by this document. Property whitelist, duration bands, easing defaults, MOTN-01..MOTN-07 specs, reduced-motion contract, Lighthouse gate, anti-patterns locked at Phase 16 sign-off.
