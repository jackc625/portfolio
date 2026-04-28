# Phase 16: Motion Layer - Research

**Researched:** 2026-04-27
**Domain:** Native-platform motion (CSS @view-transition + IntersectionObserver + CSS @keyframes) on Astro 6 / Tailwind v4 / TypeScript 5.9
**Confidence:** HIGH

---

## Summary

Phase 16 layers motion onto a locked editorial system using the 2026 native-platform stack only — no JS animation library, no Astro `<ClientRouter />`, no new runtime dependencies. The eight design decisions that drive this phase (D-01..D-25) are all locked in CONTEXT.md and UI-SPEC.md; this research validates the platform foundations those decisions assume and surfaces failure modes the planner must guard against.

Three findings dominate: (1) cross-document `@view-transition` is supported in Chrome 126+, Safari 18.2+, and Firefox 144 (partial; 143 disabled by default) — global coverage 87.82% [VERIFIED: caniuse.com], with silent fallback to instant nav in unsupported browsers, no JS required; (2) `astro:page-load` fires ONLY when `<ClientRouter />` is present — without it (the case here, since `<ClientRouter />` is prohibited), `DOMContentLoaded` is the actual init hook and full document reload is the actual navigation model [VERIFIED: docs.astro.build]; (3) `box-shadow` animation is paint-only (zero CLS impact), but is NOT GPU-composited automatically — `will-change: box-shadow` would help, yet the explicit guidance in this phase is to AVOID `will-change` (UI-SPEC §Lighthouse stress conditions) — the small 48×48 round bubble keeps repaint area trivial, so the tradeoff is acceptable as-spec'd.

**Primary recommendation:** Wave 0 ships RED tests for source-text invariants (CSS rules present in `global.css`, view-transition keyframes shape, paired reduced-motion overrides) and DOM-mock invariants (motion.ts behavior, span-wrap idempotency, observer factory contract). Wave 1 ships the observer factory + scroll-depth refactor (byte-equivalence guarded by Phase 15's existing analytics tests). Wave 2 ships motion.ts + global.css motion rules + WorkRow.astro arrow + chat.ts pulse coordination. Wave 3 ships MOTION.md + MASTER.md §6 stub. Phase gate: D-26 chat regression battery + Lighthouse CI on home + one project page.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Motion documentation (MOTN-09)**

- **D-01:** Author new `design-system/MOTION.md` as the v1.2 motion canonical doc. Contains property whitelist (transform, opacity, box-shadow), duration bands (120/180/250–350/600/2500ms), easing defaults (ease-out for entrances, ease-in-out for loops), reduced-motion contract, and the per-animation specs from D-04..D-22 below.
- **D-02:** Rewrite `design-system/MASTER.md` §6 to a short stub: "v1.1 motion lock superseded by v1.2 — see `design-system/MOTION.md`." MASTER.md as a whole remains the v1.1 design lock; non-motion sections (color tokens, type roles, layout grammar, primitive contracts) still bind. Only §6 is replaced.
- **D-03:** MOTN-09 in REQUIREMENTS.md is satisfied by D-01 + D-02 — §6 IS amended (replaced with stub), and the carve-outs land in MOTION.md.

**Scroll-reveal scope (MOTN-02)**

- **D-04:** `motion.ts` auto-applies the reveal to common roles by default — no per-element opt-in attribute. Selector list:
  - `.h1-section` section headers (SectionHeader.astro instances; `.display` homepage hero excluded)
  - `.work-row` rows on the home `/` page
  - Project detail prose blocks on `/projects/[id]` pages
  - About page paragraphs on `/about`
- **D-05:** IntersectionObserver options: `rootMargin: "0px 0px -10% 0px"`, `threshold: 0`. Fires when element top crosses 90% of viewport height.
- **D-06:** Reveal motion: opacity 0→1 + translateY 12→0px, 300ms ease-out.
- **D-07:** One-shot per element — observer calls `unobserve(target)` after first intersection.
- **D-08:** Homepage `.display` wordmark is excluded from reveal AND stagger.

**Word-stagger (MOTN-07)**

- **D-09:** JS span-wrap implementation in `src/scripts/motion.ts`. On the same IO trigger that fires the section reveal: query each `.h1-section` once, split textContent on whitespace, replace with `<span class="word" style="--i: N">word</span>` per word. CSS handles `animation-delay: calc(var(--i) * 60ms)`.
- **D-10:** Per-word motion: opacity 0→1 + translateY 8→0px, 250ms ease-out, 60ms stagger between words.
- **D-11:** Word-stagger runs in parallel with the parent section reveal — both gated by the same IO trigger.
- **D-12:** Word-stagger never touches `.display` (excluded by D-08).
- **D-13:** Span-wrap is idempotent — guarded by a `data-stagger-split` attribute on the heading after first run.

**Chat bubble pulse (MOTN-04)**

- **D-14:** Pure CSS `@keyframes` pulse on `#chat-bubble` — combined effect: box-shadow ring expand + 1.02 scale, synced to the same 2.5s loop.
  - Ring: `box-shadow: 0 0 0 0 rgba(230,57,70,0.4)` → `0 0 0 16px rgba(230,57,70,0)`
  - Scale: `transform: scale(1.0)` → `scale(1.02)` at 50% → `scale(1.0)` at 100%
  - Animation: `2.5s ease-in-out infinite`
- **D-15:** Pulse pauses on `:hover`, `:focus-visible`, when chat panel is open (via `data-pulse-paused` attribute set by chat.ts), and `prefers-reduced-motion: reduce`.
- **D-16:** Pulse uses transform + box-shadow only.

**Observer architecture**

- **D-17:** Extract `src/scripts/lib/observer.ts` — small factory exporting `makeRevealObserver({ selector, rootMargin, threshold, onIntersect })`. Target ~20–30 LOC.
- **D-18:** New `src/scripts/motion.ts` consumes the factory for scroll-reveal, with word-stagger as a side effect of the reveal callback for any matched `.h1-section`.
- **D-19:** Refactor existing `src/scripts/scroll-depth.ts` to consume the same factory. Behavior must remain byte-equivalent for the analytics observer.

**View transitions (MOTN-01)**

- **D-20:** Native cross-document `@view-transition { navigation: auto; }` CSS at-rule lives in `src/styles/global.css`. No `<ClientRouter />`, no Astro view-transitions JS integration, no JS router.
- **D-21:** Page-enter fade via `::view-transition-old(root)` and `::view-transition-new(root)` keyframes — opacity-only, 200ms ease-out. No translate.
- **D-22:** Cross-document only. Project↔project named-element morphs deferred to v1.3.

**Reduced-motion contract (MOTN-08)**

- **D-23:** All entrance animations wrapped in `@media (prefers-reduced-motion: no-preference) { ... }`.
- **D-24:** Chat bubble pulse paired with explicit `@media (prefers-reduced-motion: reduce) { #chat-bubble { animation: none; } }` override.
- **D-25:** Reduced-motion final state: elements render at resting state immediately (opacity: 1, translateY: 0).

**Already locked (no decisions needed)**

- WorkRow arrow upgrade (MOTN-03): opacity 0→1 + 4px translateX, 180ms ease.
- Chat panel scale-in (MOTN-05): transform 96%→100% + opacity 0→1, 180ms ease-out, transform-origin bottom-right.
- Typing-dot bounce (MOTN-06): already live at `global.css:260–280`. **DO NOT touch.**

### Claude's Discretion

- Exact animation-name strings, CSS class naming for word spans (`.word` suggested)
- Whether motion.ts memoizes word-split result per heading
- Final form of MOTION.md
- Whether existing `prefers-reduced-motion: reduce` block at `global.css:126` is repurposed in place or replaced
- Final naming of the observer factory
- Whether `data-pulse-paused` lives as attribute or class

### Deferred Ideas (OUT OF SCOPE)

- Hero animation / signature hero moment — v1.3+
- Project ↔ project view-transition-name named-element morph — v1.3+
- Optional `motion` package (~5 kB) fallback — Future Requirements
- MASTER.md v1.2 wholesale rewrite — only §6 stubbed
- IO consolidation into single file — rejected; factory chosen
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOTN-01 | Page-enter fade via native cross-document `@view-transition` CSS at-rule | §1 (browser support 87.82%, no JS required, silent fallback); §3 Pattern 4; Code Example 4 |
| MOTN-02 | Scroll-reveal utility module via IntersectionObserver, fade + ≤12px translateY, 250–350ms, one-shot | §3 Pattern 1 (observer factory); Code Examples 1–2; Pitfall 6 (memory leak prevention via unobserve) |
| MOTN-03 | WorkRow arrow slide-in on hover/focus (opacity 0→1 + 4px translateX, 180ms) | §3 Pattern 5; existing CSS at WorkRow.astro:81–99 to upgrade in place |
| MOTN-04 | Chat bubble idle pulse via CSS — paused on hover/focus/reduced-motion/panel-open | §3 Pattern 6; Pitfall 4 (box-shadow paint-only, zero CLS); Code Example 5 |
| MOTN-05 | Chat panel open scale-in (96%→100%, 180ms) | §3 Pattern 7; Code Example 6 |
| MOTN-06 | Typing-dot bounce during SSE streaming | Already live at global.css:260–280 — NO research needed; recommendation: add `reduce` override extension for parity |
| MOTN-07 | Section heading word-stagger on `.h1-section` only (never `.display`) | §3 Pattern 2 (span-wrap with `data-stagger-split` idempotency guard); Code Example 3; Pitfall 3 (reduced-motion check before split) |
| MOTN-08 | All motion wrapped in `@media (prefers-reduced-motion: no-preference)` or paired with `reduce` override | §1 (95.92% global support); §3 Pattern 8; Pitfall 1 (reduced-motion ordering) |
| MOTN-09 | MASTER.md §5/§6 amended with motion carve-outs (satisfied by D-01 + D-02 — MOTION.md authored, §6 stubbed) | §6 State of the Art (v1.1 lock → v1.2 motion authority split); not a coding task — doc authoring |
| MOTN-10 | Lighthouse gate passes — Performance ≥99 / A11y ≥95 / BP 100 / SEO 100 after motion lands | §5 (Lighthouse impact analysis); Pitfall 2 (will-change sticking); Pitfall 5 (TBT from infinite animations); §Validation Architecture |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

The planner MUST honor these directives:

- **Six-token color palette only** — no new color tokens; rgba in `box-shadow: 0 0 0 0 rgba(230,57,70,0.4)` is conversion-at-keyframe-site-only (UI-SPEC §Color), `--accent` token unchanged.
- **Tailwind v4 with CSS-first config** — no `tailwind.config.js`; motion CSS lives in `src/styles/global.css` (not utility classes) for `@keyframes`, `@media`, `@view-transition`, and pseudo-element selectors that have no Tailwind utility equivalent.
- **Component-scoped `<style>`** in `.astro` primitives — `WorkRow.astro` arrow CSS already lives in scoped `<style>` and stays there (only `transition` and `transform` declarations updated in place).
- **Astro 6 Fonts API** — irrelevant to motion (no font-loading interaction).
- **Single light theme — no dark mode, no theme switching** — motion never reads color-scheme.
- **GSAP, `<ClientRouter />`, `transition:persist`, Lenis prohibited** (MASTER.md §8) — no library, no JS router. Native platform only.
- **GSD workflow enforcement** — research consumed by `/gsd-plan-phase 16`. No direct edits outside GSD workflow.
- **Voice rule** — site copy first-person, chat widget third-person; `MOTION.md` is technical docs, third-person spec voice.

## Architectural Responsibility Map

Phase 16 lives entirely in two tiers — **Browser/Client** and **Frontend Server (Astro static build)**. Database, API, and CDN tiers are untouched.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Cross-document page fade (`@view-transition`) | Browser/Client | Frontend Server (ships CSS at-rule in pre-built global.css) | Native browser CSS at-rule; zero JS; runs at navigation time inside the browser's view-transition pipeline. Astro 6 builds the static CSS that opts in. |
| Scroll-reveal (IntersectionObserver) | Browser/Client | — | Pure runtime DOM API; observer instantiated post-DOMContentLoaded; no SSR, no API contract, no static assets beyond the JS module. |
| Word-stagger DOM mutation (`.h1-section` span-wrap) | Browser/Client | — | Runtime mutation only — never touches Astro-rendered HTML; span-wrap deferred until IO trigger fires; idempotent across re-evaluation. |
| WorkRow arrow hover/focus motion | Browser/Client | Frontend Server (ships CSS in WorkRow.astro scoped `<style>`) | Pure CSS state-driven; no JS at the call site. Astro builds the scoped style block. |
| Chat bubble idle pulse | Browser/Client | Frontend Server (ships `@keyframes` in global.css) | Pure CSS `@keyframes` infinite loop; chat.ts toggles `data-pulse-paused` attribute on the bubble for runtime coordination only. |
| Chat panel scale-in | Browser/Client | Frontend Server (ships CSS in global.css) | CSS transition + transform on existing `.open` / `[hidden]` state class authored by chat.ts. |
| Typing-dot bounce | Browser/Client | — | Already live at global.css:260–280; no work this phase. |
| Reduced-motion gating (CSS `@media`) | Browser/Client | Frontend Server (ships gates in global.css) | Browser evaluates `(prefers-reduced-motion: reduce)` natively; CSS handles the no-preference / reduce branching with zero JS. |
| Reduced-motion runtime check (motion.ts span-wrap guard) | Browser/Client | — | `matchMedia('(prefers-reduced-motion: reduce)').matches` read at script-init; D-25 demands no DOM mutation occurs when reduce. |
| MOTION.md / MASTER.md §6 documentation | Frontend Server (repository docs) | — | Static markdown in `design-system/`; no runtime impact. |
| Observer factory module | Browser/Client | — | Small TypeScript module compiled by Vite/Astro at build time, executed in browser. |

**Why this matters:** Misassigning the chat bubble pulse to "needs JS animation library" would have led to GSAP reintroduction. Misassigning view transitions to "needs ClientRouter" would have led to violating MASTER.md §8. The map above pre-empts both — every motion capability is browser-native CSS or trivial DOM mutation, and the only frontend-server responsibility is building static assets that ship the CSS rules.

---

## Standard Stack

### Core (already installed, no changes)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 6.0.8 [VERIFIED: package.json] | Static site framework + per-route SSR | Builds the static HTML/CSS where `@view-transition` and `@keyframes` rules ship; no Astro JS plumbing for motion (no `<ClientRouter />`, no `astro:transitions/client`). |
| Tailwind CSS | 4.2.2 [VERIFIED: package.json] | Utility-first CSS | Tailwind utilities don't generate `@view-transition` or `@keyframes` — those go in `global.css` via `@theme inline` adjacent layers. Tailwind v4 Oxide engine doesn't re-emit unchanged motion CSS, so file-size impact is the rule definition only. |
| TypeScript | 5.9.3 [VERIFIED: package.json] | Type safety for motion.ts + observer.ts + scroll-depth.ts | `strict` mode (CLAUDE.md). `IntersectionObserver`, `IntersectionObserverEntry`, `MediaQueryList` types are in lib.dom.d.ts — no @types/ install needed. |
| Vite | 7.x (bundled with Astro 6) | Module bundler for client TS | Bundles motion.ts + observer.ts via the `<script>` import in BaseLayout.astro body, same path scroll-depth.ts and analytics.ts already use (BaseLayout.astro:118-121). |
| Vitest | 4.1.0 [VERIFIED: package.json] | Test runner | jsdom 29 environment for DOM-mock tests; node environment for source-text tests. Existing 262 tests use both modes per Phase 15 patterns. |

### Supporting (already installed)

| Library | Version | Purpose | Note |
|---------|---------|---------|------|
| jsdom | 29.0.1 [VERIFIED: package.json] | DOM mock for client tests | Does NOT implement IntersectionObserver — must stub via `class { observe = vi.fn(); ... }` per `tests/client/scroll-depth.test.ts:19-28` precedent. Same stub pattern needed for motion.ts tests. |
| @astrojs/cloudflare | 13.1.7 [VERIFIED: package.json] | Cloudflare Pages adapter | No motion-relevant interaction; static pages ship pure CSS. |

### Alternatives Considered (NOT adopted — locked out)

| Instead of | Could Use | Why Excluded |
|------------|-----------|---------------|
| Native `@view-transition` | Astro `<ClientRouter />` | MASTER.md §8 anti-pattern (collides with Phase 7 localStorage chat persistence; D-29 historical decision restated in CONTEXT.md) |
| CSS `@keyframes` | GSAP / motion package | MASTER.md §8 anti-pattern (removed in v1.1 for a reason); Webflow's free GSAP not relevant — the prohibition is architectural, not licensing |
| IntersectionObserver | Lenis smooth scroll | MASTER.md §8 anti-pattern; native CSS `scroll-behavior: smooth` already wraps in `@media (no-preference)` block (global.css:74-77, MOTN-08-aligned) |
| `transform` + `opacity` | `width`/`height`/`margin` for layout reveals | UI-SPEC property whitelist — layout-triggering properties prohibited to protect Performance ≥99 + CLS ≤0.01 |

**Installation:** None. Phase 16 ships zero new `package.json` dependencies on the preferred path (UI-SPEC §Registry Safety; ROADMAP "Zero New Runtime Dependencies").

**Version verification (run before plan write):**
```bash
node -p "require('./package.json').dependencies['astro']"          # ^6.0.8 confirmed
node -p "require('./package.json').dependencies['tailwindcss']"    # ^4.2.2 confirmed
node -p "require('./package.json').devDependencies['typescript']"  # ^5.9.3 confirmed
node -p "require('./package.json').devDependencies['vitest']"      # ^4.1.0 confirmed
node -p "require('./package.json').devDependencies['jsdom']"       # ^29.0.1 confirmed
```

All versions stable as of 2026-04-27. No version churn risk for this phase.

---

## Architecture Patterns

### System Architecture Diagram

```
                    ┌────────────────────────────────────┐
                    │ User opens jackcutrara.com         │
                    └─────────────────┬──────────────────┘
                                      │
                                      ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │  Astro 6 build (static)                                          │
   │  ┌────────────────────────────────────────────────────────────┐  │
   │  │ BaseLayout.astro renders <head> + <body>                   │  │
   │  │  - <link> ships global.css (motion CSS rules)              │  │
   │  │  - <script> bundles analytics.ts + scroll-depth.ts +       │  │
   │  │    motion.ts (NEW) via Vite                                │  │
   │  └────────────────────────────────────────────────────────────┘  │
   │  ┌────────────────────────────────────────────────────────────┐  │
   │  │ Page templates render WorkRow.astro / SectionHeader.astro  │  │
   │  │  - .work-arrow CSS (scoped style — MOTN-03 upgrade)        │  │
   │  └────────────────────────────────────────────────────────────┘  │
   └─────────────────────────────────┬────────────────────────────────┘
                                      │ HTTP response (HTML+CSS+JS)
                                      ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │  Browser receives initial document                               │
   │                                                                  │
   │  CSS layer (immediate, no JS)                                    │
   │   ├─ @view-transition { navigation: auto } — primed for next nav │
   │   ├─ @keyframes pulse (chat bubble) — running infinite loop      │
   │   ├─ @keyframes typing-bounce (already live, MOTN-06)            │
   │   ├─ .work-arrow transition (MOTN-03)                            │
   │   ├─ .chat-panel.open transform (MOTN-05)                        │
   │   └─ @media (prefers-reduced-motion: reduce) overrides           │
   │                                                                  │
   │  DOMContentLoaded fires (NOT astro:page-load — no ClientRouter)  │
   │                                                                  │
   │  JS layer init (DOMContentLoaded + astro:page-load both wired    │
   │   for forward-compat; only DOMContentLoaded actually fires today)│
   │   ├─ motion.ts                                                   │
   │   │   ├─ Read matchMedia('(prefers-reduced-motion: reduce)')     │
   │   │   ├─ If reduce: bail. Headings render plain. No DOM mutation │
   │   │   └─ Else: instantiate observer via lib/observer.ts factory  │
   │   │       ├─ observe(.h1-section, .work-row, prose, About p)    │
   │   │       └─ on intersect: add .reveal-on class + (if .h1-section│
   │   │           AND not data-stagger-split) span-wrap textContent  │
   │   ├─ scroll-depth.ts (REFACTORED)                                │
   │   │   └─ uses lib/observer.ts factory; analytics behavior        │
   │   │     byte-equivalent to Phase 15                              │
   │   ├─ analytics.ts (UNCHANGED)                                    │
   │   └─ chat.ts (MODIFIED — D-15 only)                              │
   │       └─ openPanel: bubble.dataset.pulsePaused = "" BEFORE       │
   │         focus-trap activation; closePanel: removeAttribute       │
   │         AFTER focus restoration (mirrors DEBT-02 inert pattern)  │
   └─────────────────────────────────┬────────────────────────────────┘
                                      │
                                      ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │  User clicks WorkRow link → cross-document navigation            │
   │                                                                  │
   │  Browser checks @view-transition CSS opt-in                      │
   │    - Chrome 126+/Safari 18.2+/Firefox 144 partial: cross-fade    │
   │    - Older browsers: silent — instant nav, no fade               │
   │                                                                  │
   │  ::view-transition-old(root) opacity 1→0  (200ms ease-out)       │
   │  ::view-transition-new(root) opacity 0→1  (200ms ease-out)       │
   │                                                                  │
   │  Full document reload happens; new doc fires DOMContentLoaded;   │
   │  motion.ts re-init runs (clean slate; no stale span-wrap state)  │
   └──────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── scripts/
│   ├── lib/
│   │   └── observer.ts          # NEW (D-17) — IO factory, ~20-30 LOC
│   ├── motion.ts                # NEW (D-18) — scroll-reveal + word-stagger
│   ├── scroll-depth.ts          # MODIFIED (D-19) — refactor to consume factory
│   ├── analytics.ts             # UNCHANGED
│   └── chat.ts                  # MODIFIED (D-15) — startPulse/stopPulse stubs
│                                #   replaced with data-pulse-paused toggle
├── styles/
│   └── global.css               # MODIFIED — adds:
│                                #   - @view-transition rule (MOTN-01)
│                                #   - ::view-transition-old/new(root) keyframes
│                                #   - #chat-bubble pulse @keyframes (MOTN-04)
│                                #   - reduce override for pulse (D-24)
│                                #   - .reveal-init / .reveal-on classes (MOTN-02)
│                                #   - .word span animation (MOTN-07)
│                                #   - chat panel scale-in (MOTN-05)
│                                #   - reduce extension on typing-bounce (MOTN-06 opt'l)
├── components/
│   └── primitives/
│       └── WorkRow.astro        # MODIFIED — scoped <style> updates .work-arrow
│                                #   (transition: opacity 120ms, transform 180ms;
│                                #    add transform: translateX(4px) on hover/focus)
│
└── layouts/
    └── BaseLayout.astro         # MODIFIED — adds motion.ts import to body <script>:
                                 #   import "../scripts/motion.ts";

design-system/
├── MASTER.md                    # MODIFIED — §6 replaced with 3-line stub
└── MOTION.md                    # NEW (D-01) — v1.2 motion canonical doc

tests/
├── build/
│   ├── motion-css-rules.test.ts          # NEW — source-text invariants for
│   │                                       global.css motion rules
│   └── (existing tests unchanged)
└── client/
    ├── motion.test.ts                     # NEW — DOM-mock tests for motion.ts:
    │                                        reduced-motion bail, span-wrap idempotency,
    │                                        observer factory contract
    ├── scroll-depth.test.ts               # MODIFIED — assert byte-equivalent
    │                                        analytics behavior post-refactor
    └── reduced-motion.test.ts             # MODIFIED — extend with new motion rule
                                             coverage (don't redefine the file)
```

### Pattern 1: IntersectionObserver Factory (D-17)

**What:** A small TypeScript factory that constructs an observer with provided options and a callback, observes a NodeList, and returns the observer instance for later cleanup. The factory is the single point where `new IntersectionObserver(...)` is called — both motion.ts (reveal) and scroll-depth.ts (analytics) consume it.

**When to use:** Anywhere multiple modules need IntersectionObserver with similar shapes (one observer per module, watching a query selector, one-shot via `unobserve` after intersect). [VERIFIED: existing scroll-depth.ts pattern + Phase 15 D-19 explicit punt to Phase 16]

**Example:**
```typescript
// src/scripts/lib/observer.ts — NEW (D-17)
// Source: existing scroll-depth.ts:47-56 pattern + standard MDN IntersectionObserver
//   constructor signature [VERIFIED: developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver]

export interface RevealObserverOptions {
  selector: string;
  rootMargin?: string;
  threshold?: number;
  /** Called once per matching target on first intersect. Factory handles unobserve. */
  onIntersect: (target: Element, observer: IntersectionObserver) => void;
}

export function makeRevealObserver(opts: RevealObserverOptions): IntersectionObserver | null {
  const { selector, rootMargin = "0px", threshold = 0, onIntersect } = opts;
  const targets = document.querySelectorAll<HTMLElement>(selector);
  if (targets.length === 0) return null; // No-op gate (mirrors scroll-depth.ts:42)

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        onIntersect(entry.target, observer);
        observer.unobserve(entry.target); // D-07 one-shot
      }
    },
    { rootMargin, threshold }
  );
  targets.forEach((el) => observer.observe(el));
  return observer;
}
```

**Why this shape:** Existing scroll-depth.ts diverges in two ways from this factory: (1) it does NOT auto-unobserve in the factory — the caller (`handleScrollEntry`) calls `observer.unobserve(entry.target)` itself. Decision needed at plan time: either (a) factory does NOT auto-unobserve and caller-managed (preserves byte-equivalence for scroll-depth — RECOMMENDED), with an `oneShot: true` opt-in flag, OR (b) factory always auto-unobserves and scroll-depth's `handleScrollEntry` drops its `observer.unobserve(entry.target)` line (changes scroll-depth's behavior at the per-line level, threatens byte-equivalence guarantee D-19).

**RECOMMENDATION:** Use option (a) — `oneShot?: boolean = false` parameter; scroll-depth passes `false` (preserves caller-managed unobserve), motion.ts passes `true`. This keeps scroll-depth's source diff minimal: only the `new IntersectionObserver(...)` constructor call moves to the factory; the `handleScrollEntry`-with-observer-arg pattern stays. The 8 existing scroll-depth tests at `tests/client/scroll-depth.test.ts:36-130` continue to pass without modification.

### Pattern 2: Word-Stagger Span-Wrap with Idempotency (D-09, D-13)

**What:** Split a heading's textContent on whitespace, replace with `<span class="word" style="--i: N">` per word, mark with `data-stagger-split="true"`. The CSS handles the per-word `animation-delay: calc(var(--i) * 60ms)` so JS only mutates DOM once.

**When to use:** Inside the IO `onIntersect` callback in motion.ts, ONLY when target matches `.h1-section` (D-12: never `.display`).

**Example:**
```typescript
// src/scripts/motion.ts — split a heading once
// Source: standard DOM API; no library required [VERIFIED: developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model]

function splitWords(heading: HTMLElement): void {
  if (heading.dataset.staggerSplit === "true") return; // D-13 idempotency guard
  const words = heading.textContent?.trim().split(/\s+/) ?? [];
  if (words.length === 0) return;
  // Build via DocumentFragment to avoid layout thrash
  const frag = document.createDocumentFragment();
  words.forEach((w, i) => {
    const span = document.createElement("span");
    span.className = "word";
    span.style.setProperty("--i", String(i));
    span.textContent = w;
    frag.appendChild(span);
    if (i < words.length - 1) frag.appendChild(document.createTextNode(" "));
  });
  heading.replaceChildren(frag);
  heading.dataset.staggerSplit = "true";
}
```

**Why this shape:** `replaceChildren(frag)` is one DOM mutation, not N. `data-staggerSplit` (`heading.dataset.staggerSplit`) is the explicit idempotency guard CONTEXT.md D-13 mandates. Whitespace text nodes between words preserve text selection / copy behavior. `style.setProperty("--i", String(i))` sets CSS custom property — preferred over `style.cssText` for safety.

### Pattern 3: Reduced-Motion Bail in motion.ts

**What:** Read `matchMedia('(prefers-reduced-motion: reduce)').matches` at script init. If true, exit early — no observer, no span-wrap, no DOM mutation. The CSS `@media (prefers-reduced-motion: no-preference)` gates handle the rendering side; the JS gate prevents the DOM-mutation side-effects D-25 explicitly forbids.

**Example:**
```typescript
// src/scripts/motion.ts — entry point
function initMotion(): void {
  // D-25 / MOTN-08 gate: when reduce is requested, no JS-driven motion happens
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  makeRevealObserver({
    selector: ".h1-section, .work-row, .project-prose p, .about-prose p",
    rootMargin: "0px 0px -10% 0px",  // D-05
    threshold: 0,
    oneShot: true,
    onIntersect: (target) => {
      target.classList.add("reveal-on");
      if (target.classList.contains("h1-section")) splitWords(target as HTMLElement);
    },
  });
}
```

**Why this shape:** `matchMedia` is reliable on the same tick at DOMContentLoaded (CSS-Tricks, gomakethings.com — established pattern). [VERIFIED: web.dev/articles/prefers-reduced-motion]. The `?.` optional-chaining on `matchMedia` is defensive against test environments / older WebKit bugs that throw on `(prefers-reduced-motion: reduce)` parse — jsdom 29 implements `matchMedia` returning `{matches: false}` by default which is fine; tests can override it. **No change-event listener** is needed for this site — Phase 16 motion is one-shot at page load; if a user toggles their OS preference mid-session, the next nav fires DOMContentLoaded again and re-reads matchMedia (cross-document `@view-transition` causes a full reload — confirmed below).

### Pattern 4: Native Cross-Document `@view-transition` (MOTN-01, D-20–D-22)

**What:** Two CSS at-rules in `global.css`. The first opts in via `@view-transition { navigation: auto; }`. The second overrides the browser default cross-fade with a 200ms keyframe pair on `::view-transition-old(root)` and `::view-transition-new(root)`. Wrapped in `@media (prefers-reduced-motion: no-preference)` per D-23.

**Example:**
```css
/* src/styles/global.css — MOTN-01, D-20 / D-21 / D-23 */
/* Source: developer.mozilla.org/en-US/docs/Web/CSS/@view-transition */

@media (prefers-reduced-motion: no-preference) {
  @view-transition {
    navigation: auto;
  }

  @keyframes vt-fade-out {
    to { opacity: 0; }
  }
  @keyframes vt-fade-in {
    from { opacity: 0; }
  }

  ::view-transition-old(root) {
    animation: 200ms ease-out both vt-fade-out;
  }
  ::view-transition-new(root) {
    animation: 200ms ease-out both vt-fade-in;
  }
}
```

**Browser behavior:**
- Chrome 126+ / Safari 18.2+ / Firefox 144 (partial; 143 disabled by default) cross-fade [VERIFIED: caniuse.com/cross-document-view-transitions — 87.82% global usage as of April 2026]
- Older browsers: silent fallback — `@view-transition` rule ignored at parse, navigation is a normal full-document load, no fade [VERIFIED: developer.chrome.com/blog/view-transitions-misconceptions: "Browsers that don't support them will ignore the CSS opt-in when parsing stylesheets"]
- No JS required; no `<ClientRouter />` integration; Astro 6 ships the static CSS verbatim

**Why opt-in inside the no-preference gate (instead of the `@view-transition` rule unconditional + `reduce` override on keyframes):** Wrapping the entire opt-in inside `no-preference` means a `reduce` user gets ZERO view-transition machinery — the browser doesn't even attempt a transition. This is cleaner than letting the transition fire and then forcing `animation-duration: 0` on the pseudo-elements (which still incurs the snapshot/swap overhead). [VERIFIED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion + piccalil.li/blog]. **But:** if the entire opt-in is inside `no-preference`, the reduce user still sees the OLD cross-fade default (instant white flash on swap?) — no. Without the `@view-transition` rule, the browser performs a normal cross-document load with no transition machinery at all (this is the same as Firefox 142 behavior). Confirmed safe.

### Pattern 5: Compound Hover Transition (MOTN-03)

**What:** Replace WorkRow's existing `.work-arrow { opacity: 0; transition: opacity 120ms ease; }` with a compound transition for opacity + transform, paired with a `transform: translateX(4px)` declaration on the hover/focus state.

**Example:**
```astro
<!-- src/components/primitives/WorkRow.astro — scoped <style> upgrade -->
<style>
  .work-arrow {
    color: var(--accent);
    opacity: 0;
    transform: translateX(0);
    transition: opacity 120ms ease, transform 180ms ease-out;
  }

  .work-row:hover .work-arrow,
  .work-row:focus-visible .work-arrow {
    opacity: 1;
    transform: translateX(4px);
  }

  /* MOTN-08 / D-23 paired-override pattern */
  @media (prefers-reduced-motion: reduce) {
    .work-arrow {
      transition: opacity 120ms ease;
    }
    .work-row:hover .work-arrow,
    .work-row:focus-visible .work-arrow {
      transform: translateX(0); /* keep arrow static; opacity-only state change is allowed per UI-SPEC §Motion Contract */
    }
  }
</style>
```

**Note:** UI-SPEC §Motion Contract / Animation specs MOTN-03 row says: "With reduce, the arrow remains opacity 0 (hidden) — accent underline on title still appears for affordance." That's stricter than my paired-override above (which still shows the arrow at translateX(0)). **RECOMMENDATION:** Honor UI-SPEC verbatim — keep the arrow at `opacity: 0` under reduce; the title's `text-decoration: underline` (MASTER.md §6.2 color-only state change) is the affordance. Final shape:

```css
@media (prefers-reduced-motion: reduce) {
  .work-row:hover .work-arrow,
  .work-row:focus-visible .work-arrow {
    opacity: 0;       /* hidden per UI-SPEC */
    transform: translateX(0);
  }
}
```

### Pattern 6: Pulse Coordination with Focus Trap (D-15, D-26 gate)

**What:** Replace the no-op stubs at `chat.ts:451-457` with attribute toggling. Critical: `data-pulse-paused` must be set on the bubble BEFORE focus-trap activation in `openPanel`, and removed AFTER focus restoration in `closePanel`. This mirrors the Phase 12 DEBT-02 `inert` pattern.

**Example:**
```typescript
// src/scripts/chat.ts — replace lines 451-457 [MODIFIED, subject to D-26 gate]
// Source: Phase 12 DEBT-02 inert pattern in MobileMenu.astro:235-377
//   (existing inert toggle precedent established for ARIA/attribute coordination)

// REMOVE:
// async function startPulse(_bubble: HTMLElement): Promise<void> { ... }
// function stopPulse(): void { ... }

// REPLACE WITH:
function pausePulse(bubble: HTMLElement): void {
  bubble.dataset.pulsePaused = "";  // attribute presence is the trigger; CSS uses [data-pulse-paused]
}
function resumePulse(bubble: HTMLElement): void {
  delete bubble.dataset.pulsePaused;
}

// Call sites — wherever startPulse/stopPulse were invoked, now:
//   In openPanel(panel, bubble):
//     pausePulse(bubble);          // BEFORE setupFocusTrap(panel)  ← D-15 ordering
//     setupFocusTrap(panel);
//     panel.style.display = "flex";
//   In closePanel(panel, bubble):
//     panel.style.display = "none";
//     ... focus restoration ...
//     resumePulse(bubble);          // AFTER focus restoration       ← D-15 ordering
```

**CSS side (in global.css):**
```css
@media (prefers-reduced-motion: no-preference) {
  @keyframes chat-pulse {
    0%   { box-shadow: 0 0 0 0    rgba(230, 57, 70, 0.4); transform: scale(1.0); }
    50%  { transform: scale(1.02); }
    100% { box-shadow: 0 0 0 16px rgba(230, 57, 70, 0);   transform: scale(1.0); }
  }
  #chat-bubble {
    animation: chat-pulse 2.5s ease-in-out infinite;
  }
  #chat-bubble:hover,
  #chat-bubble:focus-visible,
  #chat-bubble[data-pulse-paused] {
    animation-play-state: paused;
  }
}

/* D-24 paired-override pattern */
@media (prefers-reduced-motion: reduce) {
  #chat-bubble {
    animation: none;
  }
}
```

**Why CSS pseudo-class + attribute composability:** Three pause sources (hover, focus, attribute) coalesce in a single selector list — no JS for hover/focus pause needed. The attribute is the ONLY runtime-controlled signal; chat.ts toggles it.

### Pattern 7: Chat Panel Scale-In (MOTN-05)

**What:** CSS-only transition on the `.chat-panel` — when the open state is applied (chat.ts toggles via `panel.style.display = "flex"` + the CSS already shows the panel), animate `transform: scale(0.96) → scale(1)` and `opacity: 0 → 1` over 180ms ease-out, transform-origin bottom-right.

**Recommendation:** Since chat.ts uses `style.display = "none" / "flex"` (not a class toggle), CSS transitions on `display`-driven state changes don't fire. Two options:

1. **Add a class** — chat.ts toggles `.chat-panel.open`; CSS targets `.chat-panel.open` for the `transform: scale(1)` end state. Class-driven scale-in works with CSS `transition`.
2. **Use CSS animation on display-block** — declare `animation: chat-panel-open 180ms ease-out both;` on `.chat-panel` itself, scoped to a class that's added when opening (same as #1).

Both options require chat.ts to add a class (e.g., `.chat-panel-opening` or `.is-open`) before/during the open. **RECOMMENDATION:** Add a `is-open` class to chat.ts's `openPanel` (parallel to `data-pulse-paused` on the bubble); CSS uses `@keyframes` declared on the class.

```css
@media (prefers-reduced-motion: no-preference) {
  @keyframes chat-panel-in {
    from { transform: scale(0.96); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }
  .chat-panel.is-open {
    animation: chat-panel-in 180ms ease-out both;
    transform-origin: bottom right;
  }
}
```

This requires a chat.ts modification beyond just the pulse stubs. **Confirm at plan time** whether chat.ts already toggles a class on open or only `style.display`. If only `style.display`, the plan must add the class — that's a chat.ts edit subject to the D-26 chat regression gate.

### Pattern 8: Reduced-Motion Gating — When to use `no-preference` wrap vs `reduce` paired override

| Pattern | When to use | Examples in this phase |
|---------|-------------|------------------------|
| Wrap entire rule in `@media (prefers-reduced-motion: no-preference) { ... }` | Entrance animations, view-transitions, keyframe animations whose existence implies motion | MOTN-01 (view-transition + keyframes), MOTN-02 (`.reveal-on` class + transition), MOTN-04 keyframes block, MOTN-05 (chat panel scale-in keyframes), MOTN-07 (`.word` per-word animation) |
| Unconditional rule + paired `@media (prefers-reduced-motion: reduce)` override | When the unconditional CSS is needed (e.g., a transition that can run for hover-color but not transform), or when the cleanest neutralization is `animation: none` | MOTN-03 (`.work-arrow` transition is unconditional; reduce zeros translateX), MOTN-04 explicit `#chat-bubble { animation: none }` override (D-24, paired with the gated keyframe declaration above) |

**Why these are NOT mutually exclusive:** D-23 says all entrance animations live inside `no-preference`. D-24 specifies the chat bubble pulse pairs with a `reduce` neutralizer. The reason for the doubling: the pulse rule is GATED by `no-preference` (Pattern 6 above) AND has a paired `reduce` neutralizer. This is belt-and-suspenders — if a future browser bug or specificity collision causes the no-preference gate to fire when reduce is true, the explicit `animation: none` is the second line of defense. UI-SPEC §Reduced-motion contract row 2 codifies this.

### Anti-Patterns to Avoid

- **`will-change: box-shadow` / `will-change: transform`** — Triggers permanent layer promotion if the property is set in CSS without ever being removed. UI-SPEC §Lighthouse stress conditions explicitly says: "No `will-change` declarations stick (apply only during animation, remove on `animationend` if used at all — researcher recommendation: avoid `will-change` entirely for the listed property whitelist; transform/opacity are GPU-composited without it)." Modern Chromium/Safari/Firefox auto-promote layers for `transform` and `opacity` on animated elements. The 48×48 chat bubble's `box-shadow` repaint area is small enough that the missing GPU layer is not a perf issue. [VERIFIED: tobiasahlin.com/blog/how-to-animate-box-shadow + sitepoint.com/css-box-shadow-animation-performance]
- **Animating layout-triggering properties** (width, height, margin, padding, top/left/right/bottom, border-width, font-size) — UI-SPEC property whitelist forbids; would tank Performance + CLS.
- **`cubic-bezier()` custom curves** — UI-SPEC §Easing defaults: prohibited in Phase 16; use `ease`, `ease-out`, `ease-in-out` only.
- **Building word-stagger via build-time SectionHeader.astro change** — DISCUSSION-LOG explicitly considered and rejected (D-09 chose JS span-wrap).
- **Reading `prefers-reduced-motion` ONCE at module load (without optional-chaining defense)** — `window.matchMedia` is undefined in some test environments; use `window.matchMedia?.("(prefers-reduced-motion: reduce)").matches` (jsdom 29 implements it; old WebKit nightly may not).
- **Toggling `data-pulse-paused` AFTER focus-trap activation** — would race with the focus event firing into the pulse-running bubble; UI-SPEC §D-26 chat regression gate row mandates the BEFORE-activation ordering.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-document page transition | JS-driven swap with manual cross-fade | Native `@view-transition { navigation: auto }` (D-20) | 87.82% browser coverage, zero JS, zero bundle, silent fallback. Building this in JS is forbidden by MASTER.md §8 (`<ClientRouter />` ban) and unnecessary by 2026. |
| Scroll position detection (visible-in-viewport) | `getBoundingClientRect()` polling on scroll/resize | IntersectionObserver | Polling burns main thread on every scroll; IO is a single off-main-thread observer the browser optimizes natively. Phase 15 already established this for analytics. |
| Reduced-motion preference detection | Storage flag, settings UI, or framework prop | `matchMedia('(prefers-reduced-motion: reduce)').matches` (JS) + `@media (prefers-reduced-motion: reduce)` (CSS) | OS-level preference is the spec-correct source; 95.92% browser support [VERIFIED: caniuse.com/prefers-reduced-motion]. |
| Chat bubble idle animation | requestAnimationFrame loop | CSS `@keyframes ... infinite` | Browser-controlled, pauseable via `animation-play-state`, declarative, zero main-thread cost beyond initial paint. |
| Word-stagger CSS animation | Pre-baked HTML with per-word spans authored in templates | Runtime span-wrap in motion.ts (D-09) | Build-time approach was considered and rejected (DISCUSSION-LOG); preserves semantic HTML in `.astro` source, no per-call-site changes when content updates. |
| WorkRow arrow hover slide | JS event listeners + manual style mutation | CSS `:hover .work-arrow { transform: translateX(4px) }` (D-existing) | Native CSS pseudo-class state-driven; no JS, no event handler memory. |
| IntersectionObserver per-target wrappers | One observer per element | One observer with `targets.forEach(el => observer.observe(el))` (D-17) | The IntersectionObserver spec batches notifications when multiple targets cross thresholds in the same frame; one observer is the spec-recommended shape [VERIFIED: developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API + bennadel.com performance benchmark]. |
| Cleanup of view-transition listeners across navigation | Manual lifecycle wiring | None — full document reload on cross-document nav drops everything | Confirmed: cross-document `@view-transition` triggers a full reload (no SPA preservation); script state is intentionally clean per-page. [VERIFIED: events-3bg.pages.dev/jotter/feature-comparison: "Browser-native cross-document view transitions clear all script state during navigation"] |

**Key insight:** All seven items above are 2026-native-platform problems whose hand-rolled equivalents would each have introduced a bug class (animation jank, scroll listener pile-up, OS-preference drift, focus race, content-staleness, hover-event leaks, observer pile-up, navigation state corruption). The native-platform stack here is not a compromise — it is the strict best practice.

---

## Common Pitfalls

### Pitfall 1: `data-pulse-paused` race with focus trap on `openPanel` (D-15 ordering)

**What goes wrong:** If chat.ts sets `data-pulse-paused` AFTER calling `setupFocusTrap(panel)`, the focus event fires while the bubble is still pulsing — visible jitter as the focus ring appears on a scaling element. Worse, focus-trap re-query (Phase 7 mechanism: re-queries focusable elements on every Tab) might capture the bubble's `:focus-visible` state mid-animation, producing an inconsistent `animation-play-state` between the `:focus-visible` selector match and the attribute selector.

**Why it happens:** chat.ts's `openPanel()` historically called `startPulse()` (no-op) before focus-trap setup. The new attribute-toggle pattern must follow the same ordering — pause first, focus-trap second.

**How to avoid:** Plan must make the call site ordering explicit:
```typescript
function openPanel(panel: HTMLElement, bubble: HTMLElement) {
  pausePulse(bubble);          // 1. attribute set
  setupFocusTrap(panel);       // 2. focus-trap activates after pulse paused
  panel.style.display = "flex";
  // ... rest
}
```

**Warning signs:** D-26 chat regression battery test "focus trap re-query on every Tab keypress" should be re-run with bubble in viewport; visual UAT should observe the bubble at the moment of panel-open and confirm the pulse stops cleanly.

### Pitfall 2: `will-change` sticking after `animationend`

**What goes wrong:** `will-change: transform` declared in CSS forces permanent layer promotion. Browser allocates GPU memory for that element forever. On a small page this is fine; on a portfolio with multiple animated elements (4 reveal targets per page × N pages, plus the chat bubble's permanent infinite pulse), the GPU memory cost compounds and shows up as a Lighthouse Best Practices flag ("Avoid forcing high-resource layer promotion").

**Why it happens:** Authors copy-paste `will-change` from animation tutorials without realizing the spec contract is "apply only when about to change, remove after."

**How to avoid:** **Don't use `will-change` at all in this phase.** UI-SPEC §Lighthouse stress conditions row 1 codifies this. `transform` and `opacity` are GPU-composited automatically in Chrome 60+/Safari 11+/Firefox 60+ when the browser detects an active animation [VERIFIED: tobiasahlin.com/blog]. The 48×48 chat bubble's `box-shadow` repaint area is ~64×64 px (16px ring × 4 sides) — trivially small. **Test guard:** add a source-text test asserting `grep -c "will-change" src/styles/global.css` returns 0.

**Warning signs:** Lighthouse "Avoid composite layers thrashing" warnings, `chrome://flags` Layer Borders showing permanent GPU layers on motion targets.

### Pitfall 3: Reading `prefers-reduced-motion` AFTER span-wrap mutation

**What goes wrong:** If motion.ts performs span-wrap and THEN checks reduced-motion, a reduce user gets a mutated DOM (heading split into spans) that is forbidden by D-25 ("no DOM mutation occurs"). Even though the CSS gate stops the visible animation, the DOM is still wrong — screen readers may read the heading word-by-word, accessibility tooling may flag the structure.

**Why it happens:** Authors think "the CSS handles reduce, JS can be lazy." D-25 explicitly forbids the mutation.

**How to avoid:** Pattern 3 above — `matchMedia` check is the FIRST line of `initMotion()`, before any DOM mutation, observer creation, or selector query. Test guard: a DOM-mock test that sets `matchMedia` to return `{matches: true}` for reduce, runs `initMotion()`, and asserts the heading's `innerHTML` is unchanged AND `data-stagger-split` is absent.

**Warning signs:** Screen reader user reports stuttering heading reads; accessibility tree inspection in DevTools shows individual spans.

### Pitfall 4: `box-shadow` animation triggering Lighthouse CLS warnings

**What goes wrong:** Older performance audit tooling occasionally flagged `box-shadow` animation as a layout-shift candidate due to its visual extent change. Modern Chrome's Lighthouse correctly classifies `box-shadow` as paint-only (zero CLS contribution) [VERIFIED: web.dev/articles/optimize-cls + corewebvitals.io: "box-shadow is classified as a safe property for paint-only animations that doesn't cause layout shift"].

**Why it happens:** `box-shadow` extends visually outside the element's box but does NOT participate in layout. Layout-shift detection checks `getBoundingClientRect()` deltas, which `box-shadow` doesn't affect.

**How to avoid:** No prevention needed — the spec'd implementation is safe. **Validation:** Run Lighthouse CI in the Phase 16 gate; assert CLS ≤ 0.01 holds (UI-SPEC §Lighthouse gate).

**Warning signs:** None expected. If Lighthouse flags this, root cause is elsewhere (probably an unrelated layout change misattributed).

### Pitfall 5: Infinite chat bubble pulse driving up TBT

**What goes wrong:** A 2.5s infinite animation on the page could theoretically increase Total Blocking Time if the browser must repaint the box-shadow continuously on the main thread. UI-SPEC requires TBT ≤ 150ms; pre-existing baseline is well within that.

**Why it happens:** `box-shadow` repaint is on the compositor thread for elements with `transform` or `opacity` animations also active (the bubble has both). Even on the compositor, very large repaint regions can spill back to the main thread.

**How to avoid:** Bubble is 48×48 px; the largest repaint region (max ring extent) is 16px outset on all sides → 80×80 px. This is trivial — modern Chrome processes a region this size in <1ms per frame. No mitigation needed beyond confirming Lighthouse gate holds. [VERIFIED: web.dev/articles/tbt: "tasks > 50ms count toward TBT"; one repaint frame here is <1ms]

**Warning signs:** Lighthouse "Avoid long main-thread tasks" warning; performance profiler showing `Paint` task >16ms (one frame) with the chat bubble in scope. If this fires, planner files an amendment to reduce ring extent or duration.

### Pitfall 6: scroll-depth.ts behavior drift after observer factory refactor (D-19 byte-equivalence violation)

**What goes wrong:** Refactoring scroll-depth.ts to consume `lib/observer.ts` could subtly change the order of `observer.unobserve(target)` vs `umami.track(...)` calls, or change which entries trigger which side effects, breaking the analytics tests at `tests/client/scroll-depth.test.ts`.

**Why it happens:** Factory abstraction often "tidies up" small behavioral details. Phase 15 D-15 byte-equivalence guarantees were paid for in test surface — must not be regressed.

**How to avoid:** Plan must include a "Pre-refactor: capture scroll-depth current behavior" step that:
1. Confirms all 8 existing scroll-depth tests pass on `main` baseline
2. Refactors scroll-depth to import `makeRevealObserver({ oneShot: false, ... })` — the `oneShot: false` means caller still calls `observer.unobserve(entry.target)` in `handleScrollEntry`
3. Re-runs the same 8 tests; they MUST pass without modification
4. Diff inspection: `git diff -U0 src/scripts/scroll-depth.ts` should show only the constructor delegation change, NOT a behavioral rewrite

**Warning signs:** Any of the 8 existing scroll-depth tests fails; visual test of dist/client/projects/seatwatch/index.html shows different umami `track()` invocation count.

### Pitfall 7: Astro `astro:page-load` does NOT fire — only `DOMContentLoaded` fires

**What goes wrong:** Author writes motion.ts assuming `astro:page-load` fires on every navigation (because chat.ts and scroll-depth.ts both register that listener). It doesn't fire — `<ClientRouter />` is absent and prohibited.

**Why it happens:** The codebase has a forward-compat pattern (register both listeners) that suggests `astro:page-load` is in use. It's not — only `DOMContentLoaded` actually triggers init today. [VERIFIED: docs.astro.build/en/guides/view-transitions: "The `<ClientRouter />` component fires this event"; events-3bg.pages.dev/jotter/feature-comparison: "Browser-native cross-document view transitions clear all script state during navigation"]

**How to avoid:** motion.ts replicates the existing pattern (register both for forward-compat; idempotency guard prevents double-init). Document explicitly in motion.ts header comment: "DOMContentLoaded is the actual trigger today; astro:page-load is registered for forward-compat if `<ClientRouter />` is ever reintroduced (currently prohibited)."

**Warning signs:** Tests pass but live site sees motion.ts not running on subsequent page loads — only on initial. Cause: someone removed the DOMContentLoaded fallback assuming `astro:page-load` is enough. Prevention: source-text test asserts BOTH listener registrations exist.

### Pitfall 8: View transitions disabled by `<base>` tag or non-same-origin links

**What goes wrong:** `@view-transition { navigation: auto }` requires same-origin navigation. A `<base href>` tag or links to subdomains skip the transition.

**Why it happens:** Native API constraint. Same-origin requirement [VERIFIED: developer.mozilla.org/en-US/docs/Web/CSS/@view-transition + developer.chrome.com].

**How to avoid:** Audit BaseLayout.astro for any `<base>` tag (none currently — confirmed). Internal navigation uses relative or root-absolute paths (`/about`, `/projects/...`). All current and planned routes are same-origin.

**Warning signs:** Page-enter fade fails on specific links; verify those links don't go to subdomains or external hosts.

### Pitfall 9: Cross-document scripts re-execute fresh per page (no SPA persistence)

**What goes wrong:** Because cross-document `@view-transition` does a full document reload, motion.ts module state is reset each page. A `data-stagger-split` heading on /about will not retain its split when navigating to /projects/[id] and back — the new /about render has plain headings again.

**Why it happens:** Native cross-document model [VERIFIED: events-3bg.pages.dev/jotter/feature-comparison].

**How to avoid:** No mitigation needed — this is the intended model. `data-stagger-split` idempotency is a per-page-load guard (preventing double-wrap if motion.ts somehow re-evaluates within the same document, e.g., if `<ClientRouter />` is re-introduced in v1.3+). The "fresh observation pass per page" is consistent with editorial cadence — D-07 explicitly approves it.

---

## Code Examples

### Example 1: Observer Factory (lib/observer.ts)

```typescript
// src/scripts/lib/observer.ts — NEW (D-17), ~30 LOC including JSDoc
// Source: standard IntersectionObserver API [VERIFIED: developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver]
//   + existing scroll-depth.ts:47-56 pattern + Phase 15 D-19 explicit punt

export interface RevealObserverOptions {
  /** CSS selector — observer watches every matching node */
  selector: string;
  /** Default "0px"; pass "0px 0px -10% 0px" for editorial reveal cadence */
  rootMargin?: string;
  /** Default 0; rarely overridden */
  threshold?: number;
  /** Default false. true = factory calls observer.unobserve(target) after first intersect.
      false = caller calls observer.unobserve(entry.target) themselves
      (preserves scroll-depth.ts's existing per-handler unobserve pattern). */
  oneShot?: boolean;
  /** Called once per intersecting target. Receives target + observer. */
  onIntersect: (target: Element, observer: IntersectionObserver) => void;
}

/**
 * Construct an IntersectionObserver against `selector`. No-op (returns null)
 * if no elements match. Caller manages observer lifetime — for one-shot reveals,
 * pass oneShot: true and the factory unobserves after intersect.
 */
export function makeRevealObserver(opts: RevealObserverOptions): IntersectionObserver | null {
  const { selector, rootMargin = "0px", threshold = 0, oneShot = false, onIntersect } = opts;
  const targets = document.querySelectorAll<HTMLElement>(selector);
  if (targets.length === 0) return null;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        onIntersect(entry.target, observer);
        if (oneShot) observer.unobserve(entry.target);
      }
    },
    { rootMargin, threshold }
  );
  targets.forEach((el) => observer.observe(el));
  return observer;
}
```

### Example 2: motion.ts (consumes factory; runs reveal + word-stagger)

```typescript
// src/scripts/motion.ts — NEW (D-18)
// Source: D-04..D-13 from CONTEXT.md + UI-SPEC.md §Animation specs MOTN-02 / MOTN-07
//
// Init hook: DOMContentLoaded is the trigger today (no <ClientRouter /> per MASTER.md §8);
// astro:page-load is also registered for forward-compat with the existing client-script pattern
// established in chat.ts:874-885 / scroll-depth.ts:67-75 / analytics.ts:144-152.

import { makeRevealObserver } from "./lib/observer";

const REVEAL_SELECTOR =
  ".h1-section, .work-row, .project-prose p, .about-prose p";
//   ^^^^^^^^^^^ D-04 — `.display` is excluded (D-08); selector is class-based,
//   so the homepage display hero (which uses `.display`, not `.h1-section`) is naturally outside.

let motionInitialized = false;

export function initMotion(): void {
  if (motionInitialized) return;
  // D-25 / MOTN-08 reduced-motion JS gate — must be first. matchMedia is reliable
  // on the same tick at DOMContentLoaded [VERIFIED: web.dev/articles/prefers-reduced-motion].
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    motionInitialized = true;
    return;
  }
  motionInitialized = true;

  makeRevealObserver({
    selector: REVEAL_SELECTOR,
    rootMargin: "0px 0px -10% 0px", // D-05
    threshold: 0,
    oneShot: true, // D-07
    onIntersect: (target) => {
      target.classList.add("reveal-on"); // CSS handles fade + translateY (MOTN-02)
      if (target.classList.contains("h1-section")) {
        splitWords(target as HTMLElement); // D-09 / D-11
      }
    },
  });
}

/** D-09 / D-13 — wrap each word in a span with --i custom property; idempotent. */
export function splitWords(heading: HTMLElement): void {
  if (heading.dataset.staggerSplit === "true") return;
  const words = heading.textContent?.trim().split(/\s+/) ?? [];
  if (words.length === 0) return;
  const frag = document.createDocumentFragment();
  words.forEach((w, i) => {
    const span = document.createElement("span");
    span.className = "word";
    span.style.setProperty("--i", String(i));
    span.textContent = w;
    frag.appendChild(span);
    if (i < words.length - 1) frag.appendChild(document.createTextNode(" "));
  });
  heading.replaceChildren(frag);
  heading.dataset.staggerSplit = "true";
}

// WR-01 pattern (slow-GC hygiene; mirrors scroll-depth.ts:67-75 + chat.ts:874-885)
let motionBootstrapped = false;
if (typeof document !== "undefined" && !motionBootstrapped) {
  motionBootstrapped = true;
  document.addEventListener("astro:page-load", initMotion); // forward-compat (no ClientRouter today)
  if (document.readyState !== "loading") {
    initMotion();
  } else {
    document.addEventListener("DOMContentLoaded", initMotion);
  }
}
```

### Example 3: Word-stagger CSS (global.css)

```css
/* src/styles/global.css — MOTN-07, paired with motion.ts span-wrap above */

@media (prefers-reduced-motion: no-preference) {
  /* D-13: spans are added by JS only. Default state pre-IO trigger:
     opacity 0 + translateY 8px. After .h1-section gets .reveal-on,
     each word animates in with its --i delay. */
  .h1-section[data-stagger-split="true"] .word {
    display: inline-block;
    opacity: 0;
    transform: translateY(8px);
  }
  .h1-section[data-stagger-split="true"].reveal-on .word {
    animation: word-stagger-in 250ms ease-out forwards;
    animation-delay: calc(var(--i, 0) * 60ms);
  }
  @keyframes word-stagger-in {
    to { opacity: 1; transform: translateY(0); }
  }
}
```

### Example 4: View-transition CSS (global.css)

```css
/* src/styles/global.css — MOTN-01, D-20 / D-21 / D-23
   Source: developer.mozilla.org/en-US/docs/Web/CSS/@view-transition
           developer.chrome.com/docs/web-platform/view-transitions/cross-document */

@media (prefers-reduced-motion: no-preference) {
  @view-transition {
    navigation: auto;
  }
  ::view-transition-old(root) {
    animation: 200ms ease-out both vt-fade-out;
  }
  ::view-transition-new(root) {
    animation: 200ms ease-out both vt-fade-in;
  }
  @keyframes vt-fade-out { to { opacity: 0; } }
  @keyframes vt-fade-in  { from { opacity: 0; } }
}
/* No reduce override needed — the @view-transition opt-in itself is gated by
   no-preference. Reduce users perform a normal cross-document load with no
   transition machinery. */
```

### Example 5: Chat bubble pulse CSS (global.css)

```css
/* src/styles/global.css — MOTN-04, D-14 / D-15 / D-16 / D-24
   Source: UI-SPEC.md §Animation specs MOTN-04 row */

@media (prefers-reduced-motion: no-preference) {
  @keyframes chat-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.4);
      transform: scale(1.0);
    }
    50% {
      transform: scale(1.02);
    }
    100% {
      box-shadow: 0 0 0 16px rgba(230, 57, 70, 0);
      transform: scale(1.0);
    }
  }
  #chat-bubble {
    animation: chat-pulse 2.5s ease-in-out infinite;
  }
  /* D-15 pause sources — three pseudo-classes/attributes coalesce into one selector list */
  #chat-bubble:hover,
  #chat-bubble:focus-visible,
  #chat-bubble[data-pulse-paused] {
    animation-play-state: paused;
  }
}

/* D-24 paired-override pattern — explicit neutralizer */
@media (prefers-reduced-motion: reduce) {
  #chat-bubble {
    animation: none;
  }
}
```

### Example 6: Chat panel scale-in CSS (global.css)

```css
/* src/styles/global.css — MOTN-05, UI-SPEC §Animation specs MOTN-05 row
   Requires chat.ts to add .is-open class on openPanel
   (in addition to existing panel.style.display = "flex"). */

@media (prefers-reduced-motion: no-preference) {
  @keyframes chat-panel-in {
    from { transform: scale(0.96); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }
  .chat-panel.is-open {
    animation: chat-panel-in 180ms ease-out both;
    transform-origin: bottom right;
  }
}
```

### Example 7: WorkRow arrow upgrade (WorkRow.astro scoped style)

```astro
<!-- src/components/primitives/WorkRow.astro — MODIFY scoped <style> at lines 81-99 -->
<style>
  /* ... existing rules unchanged ... */

  .work-arrow {
    color: var(--accent);
    opacity: 0;
    transform: translateX(0);
    transition: opacity 120ms ease, transform 180ms ease-out;
  }

  .work-row:hover .work-arrow,
  .work-row:focus-visible .work-arrow {
    opacity: 1;
    transform: translateX(4px);
  }

  /* MOTN-08 paired-override — UI-SPEC says arrow stays opacity 0 under reduce */
  @media (prefers-reduced-motion: reduce) {
    .work-row:hover .work-arrow,
    .work-row:focus-visible .work-arrow {
      opacity: 0;
      transform: translateX(0);
    }
  }
</style>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GSAP + ScrollTrigger for scroll-reveal | IntersectionObserver + CSS `@keyframes` | Native IO universal in browsers since 2019; sufficient for editorial cadence | Zero bundle, zero main-thread cost beyond initial observer registration. |
| `<ClientRouter />` in Astro for SPA-style transitions | Native `@view-transition { navigation: auto }` | Chrome 126 (June 2024), Safari 18.2 (Dec 2024), Firefox 144 partial (March 2026) | 87.82% global coverage [VERIFIED: caniuse.com]. Zero JS, zero bundle, silent fallback. Phase 16 chooses this path because (a) native is now well-supported and (b) `<ClientRouter />` is forbidden by MASTER.md §8. |
| `framer-motion` / `motion` package for React-island animations | CSS `@keyframes` for non-React Astro components; vanilla CSS transitions for hover/focus | Astro ecosystem is 95% static — motion doesn't need a JS framework | Zero new dep on this phase's preferred path. |
| Hand-rolled smooth scroll (Lenis, etc.) | Native CSS `scroll-behavior: smooth` (already in global.css:74-77, gated by `no-preference`) | Universal browser support since 2018 | Already in place. |
| `will-change` declared in CSS | Omit `will-change`; rely on browser's automatic layer promotion for animated `transform` / `opacity` | Modern Chromium/Safari/Firefox auto-promote since ~2019 [VERIFIED: jakub.kr/components/will-change-in-css] | Prevents permanent layer pile-up; reduces GPU memory; passes Lighthouse "Avoid layer thrashing" audit. |
| MASTER.md §6 motion lock (v1.1) — restrained, "essentially no decorative motion" | MASTER.md §6 stub → MOTION.md v1.2 canonical doc with property whitelist + duration bands + per-animation specs | This phase | Forward-positive doc replaces lock-list framing; `MOTION.md` becomes authoritative for all v1.2+ motion decisions. |

**Deprecated/outdated:**
- **GSAP, framer-motion, Lenis, `<ClientRouter />`, `transition:persist`** — all forbidden by MASTER.md §8 anti-patterns. Not reconsidered in Phase 16.
- **MASTER.md §6 v1.1 prose** — replaced by 3-line stub + MOTION.md (D-02). Anti-pattern callouts in §6 referencing GSAP/keyframe-bans are superseded; the §8 anti-pattern list (which restates the GSAP/ClientRouter/Lenis bans) remains binding.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The browser's default cross-fade duration for `::view-transition-old(root)` / `::view-transition-new(root)` is 250ms ease — Phase 16 overrides to 200ms ease-out per D-21 | Pattern 4 / Code Example 4 | If the default is materially shorter, the 200ms override may feel slower than the unstyled fallback. Low risk — D-21 is the locked decision; whether it matches or differs from the default doesn't break the spec. |
| A2 | jsdom 29 implements `matchMedia` with `{matches: false}` default for unknown queries (so motion.ts under reduce mock requires explicit override) | Pattern 3 / Validation Architecture | Low risk — Phase 15 tests already mock `matchMedia` patterns and pass; jsdom 29 is in package.json. Verify at Wave 0 by running a smoke test that reads `matchMedia('(prefers-reduced-motion: reduce)').matches` in jsdom 29 and asserts false unless mocked. |
| A3 | Cross-document `@view-transition` triggers a full DOMContentLoaded fire on the new page | §1, Pattern 4, Pitfall 7 | High risk if wrong — would mean motion.ts doesn't re-init per-page. **Mitigation: confirmed via two independent sources** [VERIFIED: events-3bg.pages.dev/jotter/feature-comparison "clear all script state during navigation"; docs.astro.build/en/guides/view-transitions implies full reload absent ClientRouter]. |
| A4 | Adding `is-open` class to chat.ts's `openPanel` does not race with focus-trap setup if added BEFORE `setupFocusTrap()` | Pattern 7 (chat panel scale-in) | Medium risk — must be confirmed by D-26 chat regression battery (focus-trap test suite). Plan must include the test re-run as a phase gate item. |
| A5 | The four selectors in D-04 (`.h1-section, .work-row, .project-prose p, .about-prose p`) match the actual class names in shipped templates without stale-class drift | §3 Recommended Project Structure | Medium risk — `.project-prose` and `.about-prose` MAY not exist as class wrappers today. Plan task #1 must `grep -r "project-prose\|about-prose" src/` and confirm. If missing, plan adds the class wrapper to the relevant `.astro` template before motion.ts ships. |
| A6 | `<base>` tag is absent from BaseLayout.astro (required for cross-document @view-transition same-origin behavior) | Pitfall 8 | Confirmed via Read of BaseLayout.astro — no `<base>` tag present. Risk closed. |

**Of these:** A3 (most critical) is verified. A5 (selector existence) is the highest live risk and must be confirmed at Wave 0. A4 requires Wave 2 D-26 re-run.

---

## Open Questions

1. **Does `chat.ts` already toggle a class on the panel for open/close, or only `style.display`?**
   - What we know: `chat.ts:439-444` sets `panel.style.display = "flex" / "none"` directly via `animatePanelOpen` / `animatePanelClose` (Phase 8 GSAP-removal stubs).
   - What's unclear: Whether any `.is-open` or similar class is also toggled. CSS animations don't fire on `display` changes alone — they need a class trigger. **MOTN-05 (chat panel scale-in) requires a class-based trigger** to work via CSS keyframes.
   - Recommendation: Plan Wave 2 task for MOTN-05 must include a chat.ts edit to add/remove `.is-open` class on the panel inside `animatePanelOpen` / `animatePanelClose` (preserving existing `style.display` for compatibility). This counts as a chat.ts edit and triggers the D-26 chat regression gate. Plan must batch with D-15 attribute-toggle edit so the D-26 battery runs once for both edits.

2. **Does `.project-prose` / `.about-prose` exist as a wrapper class on shipped templates?**
   - What we know: D-04 selector list assumes these classes exist.
   - What's unclear: Whether the templates use these specific class names or other patterns (e.g., `prose` Tailwind utility, raw `<p>` inside `<article>`).
   - Recommendation: Plan task #1 (Wave 0 / RED-test phase) must `grep -rn "class=" src/pages/projects/[id].astro src/pages/about.astro` and document actual class structure. If `.project-prose` / `.about-prose` are absent, the plan must either (a) add the class wrapper to the templates OR (b) update D-04 selectors to match real classes. Option (b) needs CONTEXT amendment; option (a) is preferred (D-04 authority + minimal CONTEXT churn).

3. **Should `motion.ts` listen for `change` events on the reduced-motion media query?**
   - What we know: D-25 mandates no DOM mutation under reduce. Reading `matchMedia(...).matches` once at init is sufficient for first-page-load semantics.
   - What's unclear: If a user toggles their OS preference mid-session WITHOUT navigating, the page they're on retains the JS span-wrap from before.
   - Recommendation: **Don't add change-event listening.** Cross-document `@view-transition` triggers a full reload on every navigation; the next page picks up the new preference. The ergonomic gap (mid-session toggle staying on a single page) is acceptable for a portfolio with editorial cadence. Documenting this in MOTION.md as the explicit choice prevents future "why don't we listen" questions.

---

## Environment Availability

> Phase 16 introduces no new external dependencies. All capabilities are native-platform CSS or runtime DOM APIs.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Astro 6 dev server | Local development | ✓ | 6.0.8 | — |
| Vitest | Test runner | ✓ | 4.1.0 | — |
| jsdom | Client test environment | ✓ | 29.0.1 | — (jsdom is the test env; no fallback) |
| Cloudflare Pages (production) | Static deploy | Existing | — | Existing rollback per Phase 11 |
| Lighthouse CI | Phase gate | (run manually or via CI) | — | Manual `npx lighthouse <url>` if no CI |
| Chrome 126+ | Cross-document view-transition support | ✓ (developer browser) | — | (silent fallback to instant nav in older browsers) |
| `IntersectionObserver` browser API | Scroll-reveal + analytics | ✓ (universal since 2019) | — | (none — feature is required for the reveal pattern) |
| `prefers-reduced-motion` media query support | Reduced-motion gate | ✓ (95.92% global) | — | Default no-preference behavior in browsers without support |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

All capabilities are present in the existing dev environment. No `pnpm install` runs are needed for Phase 16 (consistent with the "Zero New Runtime Dependencies" preferred path in ROADMAP).

---

## Validation Architecture

> Required: workflow.nyquist_validation is `true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` (not present — uses default discovery; tests under `tests/**/*.test.ts`) |
| Quick run command | `pnpm test --run --reporter=dot` (or `pnpm test`) |
| Full suite command | `pnpm build && pnpm test` (build runs `astro check` + chat-context generator + sync; tests run after) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOTN-01 | `@view-transition { navigation: auto }` rule shipped in global.css inside `no-preference` gate | build (source-text) | `pnpm vitest run tests/build/motion-css-rules.test.ts -t "view-transition opt-in"` | ❌ Wave 0 |
| MOTN-01 | `::view-transition-old(root)` and `::view-transition-new(root)` keyframes shipped, 200ms ease-out | build (source-text) | `pnpm vitest run tests/build/motion-css-rules.test.ts -t "view-transition keyframes"` | ❌ Wave 0 |
| MOTN-02 | motion.ts attaches `IntersectionObserver` with rootMargin `-10%` and threshold 0 | client (jsdom + IO stub) | `pnpm vitest run tests/client/motion.test.ts -t "observer construction"` | ❌ Wave 0 |
| MOTN-02 | motion.ts adds `.reveal-on` class to target on intersect | client (jsdom) | `pnpm vitest run tests/client/motion.test.ts -t "reveal-on class on intersect"` | ❌ Wave 0 |
| MOTN-02 | `.reveal-on` CSS rule applies opacity 0→1 + translateY 12→0px, 300ms ease-out | build (source-text) | `pnpm vitest run tests/build/motion-css-rules.test.ts -t "reveal-on transition"` | ❌ Wave 0 |
| MOTN-02 | One-shot via `unobserve` after first intersect | client (jsdom + observer stub) | `pnpm vitest run tests/client/motion.test.ts -t "one-shot unobserve"` | ❌ Wave 0 |
| MOTN-02 | observer factory returns null when no targets match (no-op gate) | client (jsdom) | `pnpm vitest run tests/client/observer-factory.test.ts -t "returns null when empty"` | ❌ Wave 0 |
| MOTN-03 | WorkRow `.work-arrow` transitions opacity 120ms + transform 180ms ease-out | build (source-text on .astro) | `pnpm vitest run tests/build/work-arrow-motion.test.ts -t "transition declaration"` | ❌ Wave 0 |
| MOTN-03 | WorkRow `:hover` / `:focus-visible` adds translateX(4px) | build (source-text) | `pnpm vitest run tests/build/work-arrow-motion.test.ts -t "hover translateX"` | ❌ Wave 0 |
| MOTN-03 | WorkRow reduce override keeps arrow opacity 0 + translateX(0) | build (source-text) | `pnpm vitest run tests/build/work-arrow-motion.test.ts -t "reduce override"` | ❌ Wave 0 |
| MOTN-04 | `#chat-bubble` `@keyframes chat-pulse` with rgba 0.4 → 0 alpha, scale 1→1.02→1 | build (source-text) | `pnpm vitest run tests/build/motion-css-rules.test.ts -t "chat-bubble pulse keyframes"` | ❌ Wave 0 |
| MOTN-04 | Pulse paused on `:hover, :focus-visible, [data-pulse-paused]` selector list | build (source-text) | `pnpm vitest run tests/build/motion-css-rules.test.ts -t "pulse pause selectors"` | ❌ Wave 0 |
| MOTN-04 | Paired `@media (prefers-reduced-motion: reduce) { #chat-bubble { animation: none } }` neutralizer | build (source-text) | `pnpm vitest run tests/build/motion-css-rules.test.ts -t "pulse reduce override"` | ❌ Wave 0 |
| MOTN-04 | chat.ts `pausePulse(bubble)` is called BEFORE `setupFocusTrap` in openPanel | client (DOM-mock with order assertion) | `pnpm vitest run tests/client/chat-pulse-coordination.test.ts -t "pause before focus trap"` | ❌ Wave 0 |
| MOTN-04 | chat.ts `resumePulse(bubble)` is called AFTER focus restoration in closePanel | client (DOM-mock with order assertion) | `pnpm vitest run tests/client/chat-pulse-coordination.test.ts -t "resume after focus restoration"` | ❌ Wave 0 |
| MOTN-05 | `.chat-panel.is-open` keyframe scale 0.96→1 + opacity 0→1, 180ms ease-out | build (source-text) | `pnpm vitest run tests/build/motion-css-rules.test.ts -t "chat-panel scale-in"` | ❌ Wave 0 |
| MOTN-05 | chat.ts adds `.is-open` class on panel during openPanel | client (DOM-mock) | `pnpm vitest run tests/client/chat-pulse-coordination.test.ts -t "is-open class on open"` | ❌ Wave 0 |
| MOTN-05 | chat.ts removes `.is-open` class on panel during closePanel | client (DOM-mock) | `pnpm vitest run tests/client/chat-pulse-coordination.test.ts -t "is-open class on close"` | ❌ Wave 0 |
| MOTN-06 | Existing `@keyframes typing-bounce` at global.css:260-280 unchanged | build (source-text byte-equivalence) | `pnpm vitest run tests/build/motion-css-rules.test.ts -t "typing-bounce untouched"` | ❌ Wave 0 |
| MOTN-06 | (Optional) `@media (prefers-reduced-motion: reduce)` extension for typing-dot parity | build (source-text) | `pnpm vitest run tests/build/motion-css-rules.test.ts -t "typing-dot reduce extension"` | ❌ Wave 0 (optional) |
| MOTN-07 | motion.ts `splitWords` wraps each word in `<span class="word" style="--i:N">` | client (jsdom) | `pnpm vitest run tests/client/motion.test.ts -t "splitWords wraps words"` | ❌ Wave 0 |
| MOTN-07 | `splitWords` is idempotent — second call does not re-wrap (data-stagger-split guard) | client (jsdom) | `pnpm vitest run tests/client/motion.test.ts -t "splitWords idempotent"` | ❌ Wave 0 |
| MOTN-07 | `splitWords` skipped on `.display` selector — never called | client (jsdom + selector inspection) | `pnpm vitest run tests/client/motion.test.ts -t "display untouched"` | ❌ Wave 0 |
| MOTN-07 | `.h1-section .word` CSS animation 250ms ease-out, animation-delay calc(var(--i) * 60ms) | build (source-text) | `pnpm vitest run tests/build/motion-css-rules.test.ts -t "word-stagger animation"` | ❌ Wave 0 |
| MOTN-08 | motion.ts bails (no observer, no DOM mutation) when matchMedia reduce returns true | client (jsdom + matchMedia mock) | `pnpm vitest run tests/client/motion.test.ts -t "reduce bails — no observer"` | ❌ Wave 0 |
| MOTN-08 | motion.ts under reduce: heading innerHTML unchanged, no data-stagger-split | client (jsdom + matchMedia mock) | `pnpm vitest run tests/client/motion.test.ts -t "reduce bails — no DOM mutation"` | ❌ Wave 0 |
| MOTN-08 | Every new motion CSS rule lives inside `no-preference` OR has paired `reduce` override | build (source-text — extends tests/client/reduced-motion.test.ts) | `pnpm vitest run tests/client/reduced-motion.test.ts -t "phase 16 rules respect reduced-motion"` | ❌ Wave 0 |
| MOTN-08 | `grep -c "will-change" src/styles/global.css` returns 0 (Pitfall 2 guard) | build (text count) | `pnpm vitest run tests/build/motion-css-rules.test.ts -t "no will-change drift"` | ❌ Wave 0 |
| MOTN-09 | `design-system/MOTION.md` exists and contains property whitelist + duration bands | build (file existence + content) | `pnpm vitest run tests/build/motion-doc.test.ts -t "MOTION.md exists with whitelist"` | ❌ Wave 0 |
| MOTN-09 | `design-system/MASTER.md` §6 is replaced with stub pointer to MOTION.md | build (file content) | `pnpm vitest run tests/build/motion-doc.test.ts -t "MASTER.md §6 stubbed"` | ❌ Wave 0 |
| MOTN-09 | `design-system/MASTER.md` §8 anti-pattern list (GSAP/ClientRouter/Lenis ban) unchanged | build (file content byte-equivalence on §8) | `pnpm vitest run tests/build/motion-doc.test.ts -t "§8 unchanged"` | ❌ Wave 0 |
| MOTN-10 | Lighthouse CI on home + one project page: Performance ≥99, A11y ≥95, BP 100, SEO 100, TBT ≤150ms, CLS ≤0.01 | manual / CI (Lighthouse) | `npx lighthouse http://localhost:4321 --only-categories=performance,accessibility,best-practices,seo --output=json` | manual-only (CI integration optional) |
| D-19 | scroll-depth.ts behavior byte-equivalent post-refactor — all 8 existing scroll-depth tests still pass | client (existing tests) | `pnpm vitest run tests/client/scroll-depth.test.ts` | ✅ exists; no edits |
| D-26 chat regression battery | XSS, CORS, rate limit, AbortController, focus trap, localStorage, SSE async:false, DOMPurify, clipboard | full battery | `pnpm test --run` (covers all chat tests) + manual UAT for SSE streaming visual | ✅ exists; runs as phase gate |

### Sampling Rate

- **Per task commit:** `pnpm vitest run --reporter=dot` for the touched test file(s) only — should complete in <2s.
- **Per wave merge:** `pnpm test` full suite — completes in ~10–20s on this codebase (262 tests today; ~290 expected post-Phase-16).
- **Phase gate (before `/gsd-verify-work`):** Full `pnpm build && pnpm test` (ensures `astro check` clean + all tests green) PLUS Lighthouse CI run on `localhost:4321/` and `localhost:4321/projects/seatwatch` (or any project detail page).

### Wave 0 Gaps

The following test files do NOT exist and must be authored at Wave 0 (RED phase) before any motion code lands:

- [ ] `tests/build/motion-css-rules.test.ts` — Source-text invariants for global.css motion rules:
  - `@view-transition { navigation: auto }` exists inside `no-preference` block
  - `::view-transition-old(root)` and `::view-transition-new(root)` keyframes with 200ms ease-out
  - `#chat-bubble` `@keyframes chat-pulse` with rgba(230,57,70,0.4) → rgba(230,57,70,0) and scale 1→1.02→1
  - Pulse pause selectors include `:hover, :focus-visible, [data-pulse-paused]`
  - Paired `@media (prefers-reduced-motion: reduce) { #chat-bubble { animation: none } }`
  - `.chat-panel.is-open` keyframe + properties for scale-in
  - `.h1-section[data-stagger-split="true"] .word` rule with animation 250ms + delay calc
  - Existing `@keyframes typing-bounce` byte-equivalent
  - `grep -c "will-change" src/styles/global.css` === 0
  - `grep -c "cubic-bezier" src/styles/global.css` === 0 (UI-SPEC easing prohibition)
- [ ] `tests/build/work-arrow-motion.test.ts` — Source-text for WorkRow.astro arrow updates:
  - `transition: opacity 120ms ease, transform 180ms ease-out` declaration
  - Hover/focus rule adds `transform: translateX(4px)` and `opacity: 1`
  - `@media (prefers-reduced-motion: reduce)` keeps arrow opacity 0 + translateX 0
- [ ] `tests/build/motion-doc.test.ts` — File-existence + content invariants:
  - `design-system/MOTION.md` exists
  - MOTION.md contains "transform", "opacity", "box-shadow" property whitelist mentions
  - MOTION.md contains "120ms", "180ms", "200ms", "250", "350", "600ms", "2500ms" duration band markers
  - `design-system/MASTER.md` §6 is ≤5 lines AND points to MOTION.md
  - `design-system/MASTER.md` §8 GSAP/ClientRouter/Lenis ban text byte-equivalent to baseline
- [ ] `tests/client/observer-factory.test.ts` — IO factory contract:
  - Returns null when no elements match selector
  - Constructs IntersectionObserver with provided rootMargin + threshold
  - Calls `onIntersect` for each intersecting target
  - When `oneShot: true`, calls `observer.unobserve(target)` after intersect
  - When `oneShot: false`, does NOT auto-unobserve (caller-managed)
- [ ] `tests/client/motion.test.ts` — motion.ts behavior:
  - `initMotion()` reads `matchMedia('(prefers-reduced-motion: reduce)')` first
  - Under reduce mock: returns early, no observer, no DOM mutation
  - Under no-preference mock: instantiates observer with REVEAL_SELECTOR
  - On intersect: target gets `.reveal-on` class
  - On `.h1-section` intersect: words get split into `<span class="word" style="--i:N">`
  - `splitWords` is idempotent — second call no-op (data-stagger-split guard)
  - `splitWords` does not split `.display` headings (selector excludes)
- [ ] `tests/client/chat-pulse-coordination.test.ts` — chat.ts D-15 + MOTN-05 wiring:
  - `openPanel` sets `data-pulse-paused` on bubble BEFORE calling `setupFocusTrap`
  - `closePanel` removes `data-pulse-paused` AFTER focus restoration
  - `openPanel` adds `.is-open` class to panel
  - `closePanel` removes `.is-open` class from panel
  - Strict order assertions (use vi.fn() spies on a fake setupFocusTrap)
- [ ] `tests/client/reduced-motion.test.ts` — MODIFY existing file (do not redefine):
  - Extend with assertions for Phase 16 rules: `chat-pulse`, `chat-panel-in`, `vt-fade-out`, `vt-fade-in`, `word-stagger-in` all live inside `no-preference` blocks OR have paired reduce overrides

**Framework install:** None — Vitest 4.1.0 + jsdom 29.0.1 already present.

**Sampling justification:** Every MOTN-XX requirement maps to ≥1 automated test. The only manual sample is the Lighthouse CI score check (which runs Lighthouse on a real headless Chrome; cannot be jsdom-mocked) — this is the "phase gate" sample, run once per phase before `/gsd-verify-work`.

---

## Security Domain

> security_enforcement is not explicitly disabled in `.planning/config.json` — including this section. Phase 16 has minimal security surface (CSS + DOM mutation only, no API changes), but the D-26 chat regression gate carries the full Phase 7 security battery for any chat.ts edit.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 16 doesn't touch auth (no auth on this site) |
| V3 Session Management | no | No session changes |
| V4 Access Control | no | No access control changes |
| V5 Input Validation | yes (indirect — D-26 gate covers chat.ts SSE input parsing byte-equivalence) | Existing parsing in chat.ts unchanged; only `data-pulse-paused` attribute toggling and `.is-open` class added |
| V6 Cryptography | no | No crypto changes |
| V7 Error Handling | yes (indirect — chat.ts AbortController behavior must remain) | D-26 gate verifies 30s AbortController timeout still fires |
| V14 Configuration | no | No config changes |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via `splitWords` injecting unsanitized DOM | Tampering | `splitWords` reads `textContent` (browser-decoded plain text, no markup), creates spans via `createElement`, sets `textContent` (not `innerHTML`). DOM-mock test asserts no `<` characters appear in resulting span textContent when input contains HTML-looking strings. |
| `data-pulse-paused` attribute spoofed by extension/userscript | Tampering | Low risk — pulse pause is cosmetic (no security boundary). Even if spoofed, all that happens is the bubble stops pulsing. No data exposure. |
| View-transition snapshot includes sensitive data leaking cross-origin | Information Disclosure | Browser's view-transition API enforces same-origin for cross-document transitions [VERIFIED: developer.mozilla.org/en-US/docs/Web/CSS/@view-transition]; cannot transition to a different origin. No cross-origin snapshot risk. |
| Focus-trap race during pulse pause causing focus to escape | Tampering / Denial-of-Access | Pitfall 1 mitigation — `pausePulse` BEFORE `setupFocusTrap` ordering. D-26 focus-trap test verifies focus stays within panel during open. |
| D-26 chat regression: XSS in markdown rendering, CORS bypass, rate-limit bypass, etc. | (full battery) | Phase 7 mitigations unchanged; D-26 battery re-runs verifies. |

**Phase-16-specific security risk:** Negligible. The motion layer is paint-only state changes + a single attribute toggle on the chat bubble + a class toggle on the chat panel. No API surface, no input validation surface, no auth surface. The D-26 chat regression gate covers any incidental security regression from chat.ts edits.

---

## Sources

### Primary (HIGH confidence)

- [MDN: @view-transition CSS at-rule](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition) — official spec, syntax, navigation:auto descriptor
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — media query reference
- [MDN: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) — observer construction, threshold, rootMargin semantics
- [Chrome for Developers: Cross-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document) — cross-document specifics, navigation: auto, same-origin requirement
- [Chrome for Developers: View Transitions misconceptions](https://developer.chrome.com/blog/view-transitions-misconceptions) — fallback behavior in unsupported browsers (silent ignore at parse)
- [caniuse.com: Cross-document view transitions](https://caniuse.com/cross-document-view-transitions) — global usage 87.82%, Chrome 126+, Safari 18.2+, Firefox 144 partial / 143 disabled
- [caniuse.com: prefers-reduced-motion](https://caniuse.com/prefers-reduced-motion) — global usage 95.92%, Chrome 74, Safari 10.1, Firefox 63
- [Astro Docs: View transitions](https://docs.astro.build/en/guides/view-transitions/) — astro:page-load tied to ClientRouter; native @view-transition is hands-off
- [web.dev: Total Blocking Time](https://web.dev/articles/tbt) — TBT scoring for Lighthouse
- [web.dev: Optimize CLS](https://web.dev/articles/optimize-cls) — paint-only properties (box-shadow safe)
- [web.dev: prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion) — change-event listener pattern, JS detection

### Secondary (MEDIUM confidence — verified via cross-reference)

- [Tobias Ahlin: How to animate box-shadow with silky smooth performance](https://tobiasahlin.com/blog/how-to-animate-box-shadow/) — pseudo-element opacity-fade alternative pattern; principle that transform + opacity are the only fully-composited properties (cross-verified with web.dev)
- [SitePoint: CSS Box Shadow Animation Performance](https://www.sitepoint.com/css-box-shadow-animation-performance/) — paint-only classification, will-change tradeoff
- [Bag of Tricks: ClientRouter or @view-transition Feature Comparison](https://events-3bg.pages.dev/jotter/feature-comparison/) — Astro lifecycle clarification (browser-native cross-document clears all script state)
- [Piccalil.li: Practical examples of view transitions](https://piccalil.li/blog/some-practical-examples-of-view-transitions-to-elevate-your-ui/) — keyframe override pattern + reduced-motion examples
- [CSS-Tricks: @view-transition almanac](https://css-tricks.com/almanac/rules/v/view-transition/) — at-rule syntax, custom keyframes
- [CSS-Tricks: prefers-reduced-motion](https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/) — media query usage patterns
- [Ben Nadel: IntersectionObserver shared vs many performance](https://www.bennadel.com/blog/3954-intersectionobserver-api-performance-many-vs-shared-in-angular-11-0-5.htm) — single-observer-many-targets is the spec-recommended shape

### Tertiary (LOW confidence — informational only)

- Various community posts confirming `astro:page-load` is ClientRouter-only — already confirmed in primary sources above; not load-bearing

---

## Metadata

**Confidence breakdown:**

- **Standard stack:** HIGH — all packages verified via package.json read
- **Architecture patterns:** HIGH — patterns verified against existing codebase (chat.ts:874, scroll-depth.ts:67-75, BaseLayout.astro:118) AND against MDN/Chrome official sources
- **Browser support data:** HIGH — caniuse.com cross-referenced with MDN, version-specific
- **Pitfalls:** HIGH — Pitfalls 1, 2, 3, 6, 7 trace to explicit Phase 16 spec / Phase 15 history; Pitfalls 4, 5, 8, 9 verified via web research with multiple sources
- **Reduced-motion contract:** HIGH — codebase already has the pattern at global.css:74-77 / 126; tests at tests/client/reduced-motion.test.ts establish the precedent
- **Astro lifecycle (cross-document)** HIGH — verified via Astro docs + Bag of Tricks comparison + existing codebase pattern (chat.ts uses both listeners, idempotency-guarded)
- **TBT/CLS impact projections:** MEDIUM — projections are based on web.dev guidance + small element size; final numbers must come from Lighthouse CI in the phase gate, not from research
- **D-19 byte-equivalence approach:** HIGH — proposed `oneShot?: boolean` factory parameter preserves scroll-depth.ts caller-managed unobserve pattern; existing 8 tests will pass without modification

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (30 days — stable native-platform research; no fast-moving deps)
**Researcher:** gsd-researcher (Phase 16 Motion Layer)

---

*Phase: 16-motion-layer*
*Research file: 16-RESEARCH.md*
*Consumed by: gsd-planner (next), gsd-executor (downstream)*
