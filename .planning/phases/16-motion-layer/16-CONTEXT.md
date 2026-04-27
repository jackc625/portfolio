# Phase 16: Motion Layer - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Tasteful motion layer added on top of the editorial system: native cross-document `@view-transition` page-enter fade, IntersectionObserver-driven scroll-reveal, WorkRow arrow upgrade, chat bubble idle pulse restoration (CSS @keyframes), chat panel scale-in, typing-dot bounce (already live, MOTN-06 is zero-cost), and `.h1-section` word-stagger. All motion is reduced-motion-gated. Zero new `package.json` runtime dependencies. Lighthouse 99/95/100/100 holds.

This phase also authors the v1.2 motion canonical doc: a new `design-system/MOTION.md`. `design-system/MASTER.md` is treated as the v1.1 lock — its §6 ("the pragmatic motion line") is replaced with a 3-line stub pointing to `MOTION.md`. Future v1.2+ motion decisions are governed by `MOTION.md`, not by the v1.1 anti-pattern lists.

Out of scope (deferred to v1.3+ per `REQUIREMENTS.md` Future): hero animation / signature hero moment, project↔project view-transition-name named-element morphs, chat keyword routing, RAG/vector DB for chat, function-calling chat tools.

</domain>

<decisions>
## Implementation Decisions

### Motion documentation (MOTN-09)

- **D-01:** Author new `design-system/MOTION.md` as the v1.2 motion canonical doc. Contains property whitelist (transform, opacity, box-shadow), duration bands (120/180/250–350/600/2500ms), easing defaults (ease-out for entrances, ease-in-out for loops), reduced-motion contract, and the per-animation specs from D-04..D-22 below.
- **D-02:** Rewrite `design-system/MASTER.md` §6 to a short stub: "v1.1 motion lock superseded by v1.2 — see `design-system/MOTION.md`." MASTER.md as a whole remains the v1.1 design lock; non-motion sections (color tokens, type roles, layout grammar, primitive contracts) still bind. Only §6 is replaced.
- **D-03:** MOTN-09 in REQUIREMENTS.md is satisfied by D-01 + D-02 — §6 IS amended (replaced with stub), and the carve-outs land in MOTION.md.

### Scroll-reveal scope (MOTN-02)

- **D-04:** `motion.ts` auto-applies the reveal to common roles by default — no per-element opt-in attribute. Selector list:
  - `.h1-section` section headers (SectionHeader.astro instances; `.display` homepage hero excluded)
  - `.work-row` rows on the home `/` page
  - Project detail prose blocks on `/projects/[id]` pages
  - About page paragraphs on `/about`
- **D-05:** IntersectionObserver options: `rootMargin: "0px 0px -10% 0px"`, `threshold: 0`. Fires when element top crosses 90% of viewport height — reads as "reveals as user arrives", standard editorial cadence.
- **D-06:** Reveal motion: opacity 0→1 + translateY 12→0px, **300ms ease-out** (within the 250–350ms band MOTN-02 specifies).
- **D-07:** One-shot per element — observer calls `unobserve(target)` after first intersection. Cross-document view-transitions reload the page, so re-entry is a fresh observation pass (acceptable; consistent with MOTN-02).
- **D-08:** Homepage `.display` wordmark is excluded from reveal AND stagger — it must remain untouched per Phase 16 success criterion #1.

### Word-stagger (MOTN-07)

- **D-09:** JS span-wrap implementation in `src/scripts/motion.ts`. On the same IO trigger that fires the section reveal: query each `.h1-section` once, split textContent on whitespace, replace with `<span class="word" style="--i: N">word</span>` per word. CSS handles `animation-delay: calc(var(--i) * 60ms)`.
- **D-10:** Per-word motion: opacity 0→1 + translateY 8→0px, **250ms ease-out**, 60ms stagger between words.
- **D-11:** Word-stagger runs in parallel with the parent section reveal (not sequenced after) — both gated by the same IO trigger; the words simply have staggered animation-delays while the section's own reveal fires immediately.
- **D-12:** Word-stagger never touches `.display` (excluded by D-08).
- **D-13:** Span-wrap is idempotent — guarded by a `data-stagger-split` attribute on the heading after first run, so re-entry to a page (Astro's `astro:page-load`) doesn't re-wrap.

### Chat bubble pulse (MOTN-04)

- **D-14:** Pure CSS `@keyframes` pulse on `#chat-bubble` — combined effect: box-shadow ring expand + 1.02 scale, synced to the same 2.5s loop.
  - Ring keyframe: `box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.4)` → `0 0 0 16px rgba(230, 57, 70, 0)` — alpha-fading expand
  - Scale keyframe: `transform: scale(1.0)` → `scale(1.02)` at 50% → `scale(1.0)` at 100%
  - Animation: `2.5s ease-out infinite`
- **D-15:** Pulse pauses (`animation-play-state: paused`) on:
  - `:hover` on the bubble
  - `:focus-visible` on the bubble
  - When the chat panel is open — chat.ts toggles a `data-pulse-paused` attribute on the bubble, replacing the no-op `startPulse`/`stopPulse` stubs currently at `chat.ts:451–457` (see Phase 8 D-27 carryover note in MASTER.md §6.1 — that carryover is now released)
  - `prefers-reduced-motion: reduce` — CSS-level override sets `animation: none`
- **D-16:** Pulse uses transform + box-shadow only (paint-only properties from a hover-boundary perspective: `box-shadow` doesn't shift hit-area; `scale(1.02)` does shift hit-area by ~1px which is acceptable for a 48×48 round bubble).

### Observer architecture

- **D-17:** Extract `src/scripts/lib/observer.ts` — small factory exporting `makeRevealObserver({ selector, rootMargin, threshold, onIntersect })` (or similar shape; final naming is Claude's discretion). Target ~20–30 LOC.
- **D-18:** New `src/scripts/motion.ts` consumes the factory for scroll-reveal, with word-stagger as a side effect of the reveal callback for any matched `.h1-section`.
- **D-19:** Refactor existing `src/scripts/scroll-depth.ts` to consume the same factory. Behavior must remain byte-equivalent for the analytics observer — Phase 15 analytics tests must stay green; D-26 chat regression gate path is not affected by this refactor (analytics observer touches different DOM).

### View transitions (MOTN-01)

- **D-20:** Native cross-document `@view-transition { navigation: auto; }` CSS at-rule lives in `src/styles/global.css`. No `<ClientRouter />`, no Astro view-transitions JS integration, no JS router.
- **D-21:** Page-enter fade via `::view-transition-old(root)` and `::view-transition-new(root)` keyframes — opacity-only, 200ms ease-out. No translate (per-element scroll-reveal handles the translate cadence on the new page; stacking translate at view-transition level would compound).
- **D-22:** Cross-document only (Astro 6 native default). Project↔project named-element morphs are deferred to v1.3 per REQUIREMENTS Future.

### Reduced-motion contract (MOTN-08)

- **D-23:** All entrance animations (scroll-reveal, word-stagger, view-transition fade, chat panel scale-in) wrapped in `@media (prefers-reduced-motion: no-preference) { ... }`.
- **D-24:** Chat bubble pulse is paired with explicit `@media (prefers-reduced-motion: reduce) { #chat-bubble { animation: none; } }` override (the pulse rule itself is unconditional CSS; the reduce block neutralizes it — this is the "paired with `reduce` override" pattern MOTN-08 describes).
- **D-25:** Reduced-motion final state: elements render in their resting visual state immediately (opacity: 1, translateY: 0, no fade, no stagger, no scale-in, no view-transition fade). No motion stub — just the post-animation state.

### Already locked (no decisions needed; restated for the planner)

- **WorkRow arrow upgrade (MOTN-03):** opacity 0→1 + 4px translateX, 180ms ease — replaces current `opacity 0; transition: opacity 120ms ease;` at `WorkRow.astro:81–99`.
- **Chat panel scale-in (MOTN-05):** transform 96%→100% + opacity 0→1, 180ms ease-out, transform-origin bottom-right (panel anchor). Lives in `global.css` chat panel rules.
- **Typing-dot bounce (MOTN-06):** **already live** at `global.css:260–280` (`@keyframes typing-bounce`, 600ms infinite, ink-faint). Phase 16 does NOT touch it. Do not re-author.

### Claude's Discretion

- Exact animation-name strings, CSS class naming for word spans (`.word` is suggested; planner may rename if clearer)
- Whether motion.ts memoizes word-split result per heading (perf vs simplicity tradeoff)
- Final form of MOTION.md — length, table layout, examples — within the property/duration/easing whitelist captured above
- Whether the existing `@media (prefers-reduced-motion: reduce)` block at `global.css:126` is repurposed in place or replaced
- Final naming of the observer factory (`makeRevealObserver`, `createIOFactory`, etc.)
- Whether the chat bubble's `data-pulse-paused` attribute lives on the bubble element or as a class — chat.ts authoring style decision

</decisions>

<specifics>
## Specific Ideas

- Pulse should feel **"alive but quiet"** — the box-shadow ring is the primary signal, the 1.02 scale is the breathing reinforcement. Not demanding, not flashy.
- Reveal cadence inspired by Linear, Vercel, Stripe — fires as user "arrives" at a section, not the moment a pixel is visible. The `-10%` rootMargin is the editorial-site standard.
- Word-stagger reads as deliberate phrase-by-phrase delivery, not character-by-character flicker. 60ms is the cadence between words; total run for a 4-word heading is ~430ms.
- v1.2 is a **motion-positive milestone** — the discussion intentionally left v1.1's MASTER.md §6 anti-pattern framing behind. MOTION.md should read as a forward doc, not a "what's allowed to survive" checklist.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Requirements & roadmap

- `.planning/REQUIREMENTS.md` MOTN-01..MOTN-10 — locked motion requirements; reduced-motion gate (MOTN-08); Lighthouse gate (MOTN-10)
- `.planning/ROADMAP.md` Phase 16 entry — phase goal, success criteria, **D-26 Chat Regression Gate** (any phase touching chat.ts / global.css / BaseLayout.astro / api/chat.ts must run the Phase 7 regression battery), Lighthouse CI Gate, Zero New Runtime Dependencies preferred path

### Prior phase context

- `.planning/phases/15-analytics-instrumentation/15-CONTEXT.md` — see L51–53, L178, L369–375, L459–462 for Phase 15's explicit punt to Phase 16 on observer consolidation; D-15 server byte-identical context still binds the analytics observer behavior
- `.planning/phases/14-chat-knowledge-upgrade/14-CONTEXT.md` — chat surface contract that pulse pause-on-panel-open must coexist with

### Existing code surface (informational, not a spec)

- `src/scripts/chat.ts:451–457` — current `startPulse`/`stopPulse` no-op stubs that get replaced with `data-pulse-paused` attribute toggling
- `src/styles/global.css:260–280` — already-live `@keyframes typing-bounce` — **DO NOT touch** (MOTN-06 satisfied)
- `src/styles/global.css:74–77, 126` — existing `prefers-reduced-motion` blocks — extend rather than redefine
- `src/components/primitives/WorkRow.astro:81–99` — current arrow `opacity 0; transition: opacity 120ms ease;` rules that MOTN-03 upgrades to opacity + 4px translateX, 180ms
- `src/scripts/scroll-depth.ts` (76 LOC) — analytics IO module that gets refactored to consume the new shared observer factory; behavior must remain byte-equivalent

### Design system (note: v1.1 lock; v1.2 motion authority lives in MOTION.md)

- `design-system/MASTER.md` §6 — **v1.1 motion lock; not authoritative for Phase 16 motion decisions.** §6 gets rewritten in this phase to a stub pointing to `MOTION.md`. Non-motion sections (§2 colors, §3 type, §4 layout, §5 primitives, §7 accent, §8 anti-patterns excluding motion entries, §9 chat token map, §10 chat bubble exception) still bind.

### v1.2 motion canonical doc (created in this phase)

- `design-system/MOTION.md` — to be authored. Property whitelist (transform, opacity, box-shadow), duration bands (120/180/250–350/600/2500ms), easing defaults (ease-out for entrances, ease-in-out for loops), reduced-motion contract, per-animation specs. Becomes authoritative motion reference for v1.2+.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/scripts/scroll-depth.ts` (76 LOC, IO-based analytics) — refactored to consume the new shared observer factory; behavior preserved byte-equivalent
- `src/scripts/chat.ts:451–457` — `startPulse`/`stopPulse` no-op stubs are the natural hook points for pause-on-panel-open (D-15)
- `global.css:260–280` typing-dot bounce — already live, MOTN-06 ships zero-cost
- `global.css:74–77, 126` `prefers-reduced-motion` media blocks — pre-existing infrastructure to extend
- `WorkRow.astro:81–99` arrow CSS — receives MOTN-03 upgrade in-place

### Established Patterns

- Astro `astro:page-load` lifecycle is the init hook (chat.ts pattern at the bottom of the file)
- Component-scoped `<style>` in `.astro` primitives (Container, Footer, Header, WorkRow, etc.) — keep motion CSS local where component-specific
- Global animation keyframes go in `global.css` (mirrors the existing typing-bounce pattern)
- `is:inline` script tags only when sequenced before fonts (analytics injection at BaseLayout.astro:94 pattern); motion.ts can be a deferred Astro module import — no `is:inline` needed
- TDD per Phase 15 pattern (RED + GREEN tasks per plan; tests at `tests/build/*` for source-text assertions, `tests/client/*` for DOM-mock assertions)

### Integration Points

- `BaseLayout.astro` — adds `<script>` import for motion.ts and the `@view-transition` CSS rule via `global.css`
- `WorkRow.astro:81–99` — arrow CSS amendment lives in scoped style (`.work-arrow` rule)
- `global.css` — bubble pulse `@keyframes`, view-transition `::view-transition-old(root)` / `::view-transition-new(root)` keyframes, reduced-motion overrides, word-span styles
- `chat.ts` — replace no-op `startPulse`/`stopPulse` with `data-pulse-paused` attribute toggling on the bubble; integrates with existing `openPanel`/`closePanel` lifecycle
- `MASTER.md` §6 → 3-line stub pointer
- `design-system/MOTION.md` — new file (v1.2 motion canonical doc)
- `src/scripts/lib/observer.ts` — new file (shared IO factory)
- `src/scripts/motion.ts` — new file (scroll-reveal + word-stagger)

</code_context>

<deferred>
## Deferred Ideas

- **Hero animation / signature hero moment** — Future Requirements (v1.3+). Phase 16 success criterion #1 explicitly leaves the homepage `.display` hero untouched.
- **Project ↔ project view-transition-name named-element morph** — Future Requirements (v1.3+). Cross-document named-element morphs require additional CSS surface and per-card `view-transition-name` markup.
- **Optional `motion` package fallback (~5 kB)** — Future Requirements. Only if native `@view-transition` proves insufficient; not on the table for v1.2.
- **MASTER.md v1.2 wholesale rewrite** — out of scope. This phase only rewrites §6 to a stub pointer. The remaining MASTER.md sections continue to bind for non-motion concerns until a v1.2 design-system phase formally retires them.
- **Single-document IntersectionObserver consolidation** (merging scroll-depth + motion into one file) — discussed and rejected in favor of factory extraction (D-17). If future phases add a third IO consumer, revisit.

</deferred>

---

*Phase: 16-motion-layer*
*Context gathered: 2026-04-26*
