# Phase 16: Motion Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `16-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 16-motion-layer
**Areas discussed:** Scroll-reveal scope, Word-stagger approach, Chat bubble pulse design, Observer file shape, MOTN-09 documentation shape

---

## Pre-discussion framing — MASTER.md scope

User clarified up front that `design-system/MASTER.md` was authored as the v1.1 lock, and its §6 ("the pragmatic motion line") and §8 motion-related anti-patterns should NOT be treated as binding constraints for Phase 16 (or v1.2+ motion phases generally). Saved as feedback memory. The discussion was reframed accordingly — recommendations were not biased toward v1.1's minimal-by-default posture.

---

## Scroll-reveal scope — opt-in mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Auto on common roles | motion.ts queries .h1-section, .work-row, project prose blocks, About paragraphs by class. New sections inherit motion automatically. (Recommended) | ✓ |
| `data-reveal` opt-in attribute | Author-driven. Only `[data-reveal]` elements observed. | |
| Auto on every `<section>` | Simplest selector; risks "everything moves" feel. | |
| Two-tier: roles auto + `data-reveal-skip` opt-out | Most generous default; opt-out beats opt-in. | |

**User's choice:** Auto on common roles (Recommended)

---

## Scroll-reveal scope — concrete role selectors

| Option | Selected |
|--------|----------|
| `.h1-section` section headers | ✓ |
| `.work-row` rows on home | ✓ |
| Project detail prose blocks | ✓ |
| About page paragraphs | ✓ |

**User's choice:** All four (multi-select).

---

## Scroll-reveal scope — IntersectionObserver threshold

| Option | Description | Selected |
|--------|-------------|----------|
| `rootMargin: -10% bottom`, `threshold: 0` | Fires at 90% viewport — standard editorial cadence (Linear/Vercel/Stripe). (Recommended) | ✓ |
| `rootMargin: 0`, `threshold: 0.1` | Fires once 10% of element area is on-screen. Slightly more conservative. | |
| `rootMargin: 0`, `threshold: 0` | Most eager — fires on first pixel. | |
| `rootMargin: -25% bottom`, `threshold: 0` | Slowest, most lazy. | |

**User's choice:** `-10%` bottom, threshold `0` (Recommended)

---

## Word-stagger approach — split mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| JS span-wrap in motion.ts | ~15 LOC, runtime split on `astro:page-load`, reduced-motion-gated, zero new deps. (Recommended) | ✓ |
| Build-time pre-split via SectionHeader.astro | Zero runtime cost; per-call-site change to title prop. | |
| Native CSS only | Effectively still requires per-word elements — not actually a third path. | |
| Drop word-stagger from Phase 16 | Punt MOTN-07 to v1.3 via REQUIREMENTS amendment. | |

**User's choice:** JS span-wrap in motion.ts (Recommended)

---

## Word-stagger approach — cadence and motion shape

| Option | Description | Selected |
|--------|-------------|----------|
| 60ms delay, fade + 8px translateY, 250ms ease-out | Deliberate phrase-by-phrase; calibrates with section reveal. (Recommended) | ✓ |
| 40ms delay, fade only | Tighter, "flicker on", no compete with section translateY. | |
| 100ms delay, fade + 12px translateY | More dramatic; risks heavy on long headings. | |
| 30ms delay, fade only | Near-simultaneous, subtle. | |

**User's choice:** 60ms delay, fade + 8px translateY (Recommended)

---

## Chat bubble pulse — design

| Option | Description | Selected |
|--------|-------------|----------|
| Box-shadow ring expand | Subtle accent halo 0→16px alpha-fading, 2.5s loop. No layout impact. (Recommended) | |
| Scale pulse 1.0→1.03→1.0 | Subtle "breathing" via transform. ~1.5px hover boundary shift. | |
| Both: ring + 1.02 scale, synced | Combined for stronger signal. | ✓ |
| Slow opacity breathe 1.0→0.85→1.0 | Softest, "alive but quiet"; risks reading as "loading". | |

**User's choice:** Both: ring + 1.02 scale, synced. User went bigger than the recommendation, aligned with v1.2 motion-positive posture.

---

## Chat bubble pulse — pause behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Hover, focus, reduced-motion, AND when panel is open | Pulse stops once chat in active use; chat.ts uses existing startPulse/stopPulse hooks. (Recommended) | ✓ |
| Hover, focus, reduced-motion only | Pulse continues during conversation. | |
| Hover, focus, reduced-motion, AND after first interaction (sticky) | Pulse permanently disabled after first chat-open via localStorage flag. | |

**User's choice:** Pause when panel is open (Recommended)

---

## Observer file shape

| Option | Description | Selected |
|--------|-------------|----------|
| Keep separate, no shared lib | motion.ts new, scroll-depth.ts unchanged. ~150 LOC total. (Recommended) | |
| Extract shared `lib/observer.ts` factory | Both consume `makeObserver(...)` helper; ~20 LOC saved net; future-friendly. | ✓ |
| Merge scroll-depth into motion.ts | Single IO module; mixes analytics + visual concerns. | |

**User's choice:** Extract shared `lib/observer.ts` factory. Phase 16 includes a refactor of `scroll-depth.ts` to consume the new factory; analytics behavior must remain byte-equivalent.

---

## MOTN-09 documentation shape

| Option | Description | Selected |
|--------|-------------|----------|
| Author new `design-system/MOTION.md` (v1.2 doc) | Standalone v1.2 doc; MASTER.md gets a one-liner pointer. (Recommended) | |
| Amend MASTER.md §6 as written | Honor the requirement literally; re-engages MASTER.md as authoritative. | |
| No new doc — lean on CONTEXT.md + inline code comments | Cheapest; future phases have nothing to grep. | |
| MOTION.md AND deprecate MASTER.md §6 | Author MOTION.md, rewrite MASTER.md §6 to a 3-line stub. Cleanest historical separation. | ✓ |

**User's choice:** MOTION.md AND deprecate MASTER.md §6.

---

## Claude's Discretion

- Exact animation-name strings, CSS class naming for word spans
- Whether motion.ts memoizes word-split result per heading
- Final form of MOTION.md within the property/duration/easing whitelist
- Whether existing `prefers-reduced-motion: reduce` block at `global.css:126` is repurposed or replaced
- Final naming of the observer factory
- Whether `data-pulse-paused` lives on the bubble as attribute or class

---

## Deferred Ideas

- Hero animation / signature hero moment — v1.3+ (Future Requirements)
- Project ↔ project named-element morph — v1.3+ (Future Requirements)
- `motion` package (~5 kB) fallback — Future Requirements
- MASTER.md v1.2 wholesale rewrite — out of scope; only §6 stubbed in Phase 16
- IO consolidation into single file (rejected; factory extraction chosen instead)
