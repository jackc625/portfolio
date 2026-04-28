---
phase: 16-motion-layer
reviewed: 2026-04-27T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - design-system/MASTER.md
  - design-system/MOTION.md
  - src/components/primitives/WorkRow.astro
  - src/layouts/BaseLayout.astro
  - src/scripts/chat.ts
  - src/scripts/lib/observer.ts
  - src/scripts/motion.ts
  - src/scripts/scroll-depth.ts
  - src/styles/global.css
  - tests/build/motion-css-rules.test.ts
  - tests/build/motion-doc.test.ts
  - tests/build/work-arrow-motion.test.ts
  - tests/client/chat-pulse-coordination.test.ts
  - tests/client/motion.test.ts
  - tests/client/observer-factory.test.ts
  - tests/client/reduced-motion.test.ts
findings:
  critical: 2
  warning: 6
  info: 5
  total: 13
status: issues_found
---

# Phase 16: Code Review Report

**Reviewed:** 2026-04-27
**Depth:** standard
**Files Reviewed:** 17 (10 source + 7 test)
**Status:** issues_found

## Summary

Phase 16 ships the v1.2 motion layer cleanly against most of its declared
constraints: GSAP remains absent, the IntersectionObserver factory is
sensibly shaped, the chat-pulse coordination correctly orders
`data-pulse-paused` before focus-trap setup (and after focus restoration on
close), `motion.ts` bails on `prefers-reduced-motion: reduce` before any DOM
mutation, and `.display` is excluded from word-stagger by both selector and
defensive guard. The MOTION.md spec is well-structured, MASTER.md is
coherently amended, and `scroll-depth.ts` preserves Phase 15 D-19
byte-equivalent behavior through the factory refactor.

Two correctness defects do warrant fixing before this is considered shipped:

1. **MOTN-02 scroll-reveal causes a visible "snap-to-opacity-0" flicker on
   already-visible elements** because the resting state of reveal targets is
   `opacity: 1` (no `.reveal-init` applied) while the keyframe `from`
   declares `opacity: 0`. The CSS comment claiming "this avoids the FOUC" has
   the causality inverted — the implementation produces the very flicker the
   comment promises to prevent.
2. **MOTN-07 word-stagger has the same shape**: `.h1-section` headings render
   as plain text at full opacity, get cleared and re-wrapped on intersect,
   then the new word spans (declared `opacity: 0` in CSS) animate in — the
   user sees a momentary "blank gap" where the heading text was. This is
   the same defect class as BLOCKER-01.

Other findings center on dead code (the `.reveal-init` selector that no
JS path ever applies), comment-vs-code drift (bootstrapped guards
described as preventing a problem that cross-document navigation already
handles by full reload), and minor robustness gaps (focus-trap re-attach
branch is unreachable in the no-`<ClientRouter />` world).

The chat regression battery (D-26) and `src/pages/api/chat.ts` byte-identity
(D-15) are not directly assessable from the reviewed file list, but no
chat.ts edit touches the SSE path, the AbortController timeout, the
DOMPurify config, or the focus-trap re-query semantics — D-26 surface area
appears preserved.

---

## Blocker Issues (Critical)

### CR-01: MOTN-02 scroll-reveal flickers already-visible elements (visual regression)

**File:** `src/styles/global.css:582-585` (and the comment block at 575-581)

**Issue:**

The reveal-target rule reads:

```css
.reveal-init,
.reveal-on {
  animation: reveal-rise 300ms ease-out forwards;
}
```

`@keyframes reveal-rise` defines `from { opacity: 0; transform: translateY(12px); }`. `motion.ts` never applies `.reveal-init` (confirmed by grep and by the comment at lines 578-581), so reveal targets render at their default styles — `opacity: 1; transform: none;` — until the IntersectionObserver fires.

When the observer callback fires for an already-intersecting target (any element above the fold on initial paint, plus everything the user scrolls into view), `motion.ts` adds `.reveal-on`. The animation immediately jumps the element from `opacity: 1` to the keyframe's `from` state (`opacity: 0; translateY(12px)`), then animates back to opacity 1. Result: a one-frame "snap to invisible" followed by a 300ms fade-in — the exact FOUC the inline comment claims is avoided.

This affects every `.h1-section`, `.work-row`, `.prose-editorial p`, and `.about-body p` on the site. On the homepage, the entire work list flickers; on `/about`, every paragraph flickers; on project detail pages, every prose paragraph flickers.

The IntersectionObserver fires asynchronously (microtask) after construction, so even targets above the fold race the first paint and produce the flicker.

**Fix:**

Choose one of two patterns. Either apply `.reveal-init` to targets at SSR/markup time so they render at opacity 0 from the first frame:

```css
@media (prefers-reduced-motion: no-preference) {
  .reveal-init { opacity: 0; transform: translateY(12px); }
  .reveal-on  { animation: reveal-rise 300ms ease-out forwards; }
}
```

…and have `motion.ts` either inject `.reveal-init` programmatically before the first IO callback (write the class at the same querySelectorAll loop where `observer.observe()` is called) or have the consuming Astro components emit `class="reveal-init"` directly in markup.

OR — simpler — make the reveal a transition rather than an animation, with the resting state set by `.reveal-init` and the active state set by `.reveal-on`:

```css
.reveal-init { opacity: 0; transform: translateY(12px); transition: opacity 300ms ease-out, transform 300ms ease-out; }
.reveal-on { opacity: 1; transform: translateY(0); }
```

Under this pattern, `motion.ts` flips the class on intersect and the transition fires once.

Note: under reduce, the `.reveal-init` rule must not apply (already gated by `no-preference`), and JS still bails before adding either class. Verify the new behavior against `tests/client/motion.test.ts` and `tests/build/motion-css-rules.test.ts:104-107` — those tests will continue to pass for the `.reveal-init,.reveal-on` selector but should be tightened to assert the resting state of `.reveal-init` (currently they only assert the animation declaration).

---

### CR-02: MOTN-07 word-stagger flashes "empty heading" on first reveal

**File:** `src/scripts/motion.ts:43-54` and `src/styles/global.css:590-596`

**Issue:**

`wrapWordsInPlace` clears `el.textContent` and rebuilds the heading as a sequence of `<span class="word">` children. The CSS rule for `.word` is:

```css
.word {
  display: inline-block;
  opacity: 0;
  transform: translateY(8px);
  animation: word-rise 250ms ease-out forwards;
  animation-delay: calc(var(--i) * 60ms);
}
```

Sequence on first intersect of an `.h1-section` heading:

1. Heading paints as plain text at `opacity: 1` (HTML default, browser layout).
2. IntersectionObserver fires — `motion.ts` calls `target.textContent = ""` (clears all text).
3. Words are appended as `<span class="word">` elements; CSS gives them `opacity: 0`.
4. Animation begins; words fade in over 250ms with 60ms stagger.

Between steps 2 and 4, the heading region becomes a blank gap with no visible text. For a 4-word heading this gap lasts ~310ms, easily perceptible as a "the heading disappeared and reappeared word-by-word" flicker on initial scroll.

Same defect class as CR-01: the resting state of the heading does not match the keyframe `from` state, so the JS-driven swap produces a visible discontinuity.

This also has an a11y dimension: a screen reader iterating the live region during step 2 may emit nothing where the heading was, depending on timing; assistive tech users may experience the heading as transiently missing rather than as a styled appearance change.

**Fix:**

Pre-wrap the words at JS init time (before the IO callback) so the heading already renders as `<span class="word">` children at opacity 0, then add `.reveal-on` on intersect to trigger the animation. The change to `motion.ts`:

```ts
// inside initMotion(), before constructing the observer:
document
  .querySelectorAll<HTMLElement>(".h1-section")
  .forEach((el) => {
    if (!el.matches(".display")) wrapWordsInPlace(el);
  });
```

…and let the IntersectionObserver only handle `.reveal-on` triggering. The `.word` rule's resting opacity 0 then matches the rendered DOM from the first paint; the heading does not flash blank.

If pre-wrapping at JS init introduces its own FOUC (heading invisible until JS hydrates), apply `.reveal-init` to the heading in markup (or via Astro component) so it renders at opacity 0 at SSR time and only becomes visible once `.reveal-on` triggers.

Either resolution must continue to honor:
- `.display` exclusion (already covered by both selector and `target.matches(".display")` guard)
- Reduce-bails-without-DOM-mutation contract (MOTN-08) — wrapping at init still requires `shouldReduceMotion()` early-return ordering
- The XSS textContent-only invariant (`tests/client/motion.test.ts:190-200` already locks this)

---

## Warnings

### WR-01: `.reveal-init` rule is dead code on the screen

**File:** `src/styles/global.css:582-585`

**Issue:** No code path in `src/scripts/motion.ts` (or anywhere else under `src/`) applies the `.reveal-init` class. The CSS rule exists in `global.css` only because `tests/build/motion-css-rules.test.ts:104-107` asserts both selectors are present. The CSS comment at line 581 says "The .reveal-init class is reserved for future progressive-enhancement opt-in (out of scope for Plan 04)" — this is exactly the shape of dead code that future maintainers either delete (breaking the test) or accidentally double-pair with new logic.

If CR-01 is fixed by adopting the `.reveal-init` resting-state pattern, this finding is resolved. If CR-01 is fixed by another route, delete the `.reveal-init` half of the selector and tighten the test to assert `.reveal-on` alone.

**Fix:** Tie this resolution to CR-01.

---

### WR-02: Cross-document navigation makes `panel.dataset.chatBound` re-init branch unreachable

**File:** `src/scripts/chat.ts:486-497`

**Issue:** The early-return branch checks `chatInitialized && panel.dataset.chatBound === "true"` and re-attaches the focus trap if `panel.style.display !== "none"`. This branch was correct under Phase 7's `<ClientRouter />` regime where `transition:persist` preserved the panel DOM across navigations. After `<ClientRouter />` removal in Phase 8 (and re-confirmed by MOTION.md §1 "GSAP is prohibited; `<ClientRouter />` is prohibited"), every navigation is a full reload — module state, dataset, and inline styles are all reset. The condition `panel.dataset.chatBound === "true"` therefore cannot be true on the first invocation of a fresh page, so this branch is unreachable on production navigations.

The dead branch is harmless functionally, but it carries a risk: if a future contributor restores any form of persistent navigation (Astro 6 cross-document `@view-transition` does not preserve DOM, but a contributor could mistakenly conclude it does and lean on this dead branch), the re-attach logic relies on `panel.style.display !== "none"` as a proxy for "is open" — but the actual open-state flag is the closure-local `panelOpen`, which would be false after a fresh init. The branch could re-attach a focus trap to a panel that the new closure considers closed.

**Fix:** Either delete this branch (the simplest path; the bootstrap-level guard at line 894-897 already prevents document listener pile-up), or rewrite it to derive open-state from the same source of truth as `openPanel`/`closePanel` (the `.is-open` class is now the canonical signal — `panel.classList.contains("is-open")`).

---

### WR-03: `motion.ts` and `scroll-depth.ts` bootstrap comments mislead about cross-document navigation

**File:** `src/scripts/motion.ts:107-117` and `src/scripts/scroll-depth.ts:69-77`

**Issue:** Both modules carry comments stating the bootstrap-level guard prevents "document listener pile-up if this module is re-evaluated across cross-document navigations" or "across Astro view transitions". With `<ClientRouter />` prohibited (MOTION.md §9 anti-patterns) and only cross-document `@view-transition` in play (MOTN-01), every navigation is a full document load — modules are freshly evaluated from scratch and module-level `let motionBootstrapped = false` resets. The guard is functionally a no-op in production.

The guard does provide value in test environments (multiple `vi.resetModules()` cycles within a single jsdom session) and in dev with HMR, but the comment wording implies a runtime concern that does not exist in production.

`motion.ts:111-113` then says "Why both listeners: `<ClientRouter />` is prohibited (MASTER.md §8), so `astro:page-load` does not fire on its own — DOMContentLoaded is the actual init hook today." This is correct, but combined with the immediately-preceding comment makes the intent muddy.

**Fix:** Rewrite both comment blocks as: "Module-evaluation guard — protects against re-import during HMR / test reset cycles. Production cross-document navigation reloads the module fresh, so this is not a runtime hot path." Then keep the "why both listeners" comment as-is.

---

### WR-04: `wrapWordsInPlace` silently strips inline markup from headings

**File:** `src/scripts/motion.ts:37-54`

**Issue:** `el.textContent` flattens all descendant text, discarding any inline elements (`<em>`, `<strong>`, `<a>`, `<br>`, etc.) inside the heading. After clearing `el.textContent = ""` and appending `<span class="word">` children, the heading has lost all original markup. If a content author writes:

```mdx
## Built for <em>quiet</em> impact
```

…the rendered `<h2 class="h1-section">` becomes plain text after first reveal. The italics are gone permanently for the rest of the page life (plus the next visit, since this is destructive on the live DOM).

The textContent-only contract is correct for XSS safety (`tests/client/motion.test.ts:190-200` validates this). The bug is that the function makes no attempt to detect "this heading has child elements I should not flatten" before destructively clearing.

**Fix:** Add a pre-flight check that bails if the heading has any element children (only flatten pure text nodes):

```ts
export function wrapWordsInPlace(el: HTMLElement): void {
  if (el.dataset.staggerSplit === "true") return;
  // If heading contains inline markup, skip word-stagger to preserve it.
  // textContent-only word splitting destructively flattens descendants.
  if (el.children.length > 0) return;
  // ...rest unchanged
}
```

The reveal animation still fires (via `.reveal-on`); only the per-word stagger is skipped for marked-up headings. Document this fallback in MOTION.md §5 MOTN-07.

---

### WR-05: `MOTION.md` Lighthouse stress guard count is brittle

**File:** `design-system/MOTION.md:152` (and `tests/build/motion-css-rules.test.ts:139-152`)

**Issue:** MOTION.md §8 states: "The custom-easing CSS function count in `src/styles/global.css` returns 0". The corresponding test strips comments first then asserts `cubic-bezier\s*\(` count is 0. This is correct today, but the comment stripping uses a single regex `/\/\*[\s\S]*?\*\//g` which does not handle `//` line comments (CSS does not have them) and does not handle nested or unbalanced comment markers. If a contributor adds CSS-in-JS or a `content: "/*..."` declaration containing the literal text `cubic-bezier(`, the stress guard will fail spuriously.

The stronger contract is "no `cubic-bezier(` outside of comments and string content," which would require a CSS parser. As-is, the test is a regex heuristic — robust enough for now but worth flagging.

**Fix:** Document the heuristic limitation in the test file's docblock, or upgrade to a CSS parser-based check (overkill for v1.2). Lower-priority finding.

---

### WR-06: Chat panel scale-in rests `transform-origin` only inside no-preference

**File:** `src/styles/global.css:679-688`

**Issue:** The `transform-origin: bottom right` declaration on `#chat-panel` is wrapped inside `@media (prefers-reduced-motion: no-preference)`. Under reduce, the rule is dropped and the panel falls back to `transform-origin: 50% 50%` (CSS default). This does not affect the reduce-mode user (no animation runs), but if any future code applies a transform to `#chat-panel` outside the scale-in animation (e.g., a positional offset, a CSS-only mobile slide-in), the origin would silently differ between reduce and no-preference users.

Low likelihood of exploitation today, but the `transform-origin` declaration is a positional configuration of the element, not part of the animation — it should sit at the `#chat-panel` resting selector outside the media query.

**Fix:** Move `#chat-panel { transform-origin: bottom right; }` above the no-preference block and keep only the `.is-open` animation rule inside the gate. Verify that `tests/build/motion-css-rules.test.ts:87-90` (which asserts `transform-origin: bottom right` exists) still passes — it does not require the declaration be inside no-preference, only that it be present.

---

## Info

### IN-01: Comment in `motion.ts` describes opacity contradicting the CSS resting state

**File:** `src/scripts/motion.ts:82-85`

**Issue:** The comment says "The CSS `@media (prefers-reduced-motion: no-preference)` gate around `.reveal-init` / `.reveal-on` / `.word` rules ensures elements render at their resting state (opacity: 1, transform: none) under reduce." This is true under reduce (the gates do not apply, so no animation runs). But under no-preference, the `.word` rule sets `opacity: 0` as a resting state — making this comment's "(opacity: 1, transform: none)" claim only correct for non-`.word` elements. Same for `.reveal-init` if it were applied.

Reword to: "Under reduce, the no-preference gate keeps every reveal/stagger rule from applying, so elements render at the browser default (opacity 1, transform none)." This is a documentation accuracy issue, not a correctness bug.

**Fix:** Reword the comment.

---

### IN-02: Duplicate `querySelectorAll(".scroll-sentinel")` in dev branch

**File:** `src/scripts/scroll-depth.ts:64`

**Issue:** `makeRevealObserver` already calls `document.querySelectorAll<HTMLElement>(selector)` to determine whether to construct an observer. The dev-only console log then calls `document.querySelectorAll(".scroll-sentinel").length` again, paying the DOM walk cost twice. Production builds remove the `import.meta.env.DEV` block at compile time, so this is dev-mode only — but it is mildly wasteful and easily fixed by passing the count out of the factory or by reading `observer`'s root targets via the closure.

**Fix:** Either accept the dev-only cost (lowest-effort), or have `makeRevealObserver` return `{ observer, count }` and consume both. Lowest-priority finding.

---

### IN-03: `chat.ts` line 451 comment block header is stale

**File:** `src/scripts/chat.ts:434-437`

**Issue:** The header comment reads "Animation Helpers (Phase 8: GSAP removed — no-op stubs)". After Phase 16, `startPulse` and `stopPulse` are no longer no-op stubs — they manipulate `data-pulse-paused`. The header label is misleading.

**Fix:** Update to "Animation Helpers (Phase 16: pulse + scale-in re-engaged via CSS @keyframes; panel display + message-appear remain no-op stubs)".

---

### IN-04: Bootstrap-level `chatBootstrapped` guard comment claim mismatch

**File:** `src/scripts/chat.ts:890-905`

**Issue:** The comment block describes the same "across Astro view transitions" framing as `motion.ts` and `scroll-depth.ts`. With `<ClientRouter />` prohibited, the practical effect is identical (HMR / test isolation only). Same fix recommendation as WR-03.

**Fix:** Reword the bootstrap-guard comment to match the production reality of full reloads on navigation. Lower-priority because it is duplicative with WR-03.

---

### IN-05: `.work-arrow` resting `transform: translateX(0)` declaration is structurally redundant

**File:** `src/components/primitives/WorkRow.astro:86`

**Issue:** Adding `transform: translateX(0)` to the resting state of `.work-arrow` is functionally a no-op (the default `transform` is `none`, which already renders at zero translation). The declaration was likely added defensively to ensure the transition applies cleanly from a known origin state — and that is fine. However, declaring `transform: translateX(0)` does promote the arrow to its own composite layer (browser may treat any non-default transform as a hint to composite), which slightly increases per-page memory at the scale of "many work rows × always-on layer." For a four-work-row homepage this is negligible.

The reduce-override block at line 116 then redundantly declares `transform: translateX(0)` again on the same element, which is correct (it overrides the unconditional rule from line 86), but the test at `tests/build/work-arrow-motion.test.ts:38-41` already asserts this; the redundancy is semantically meaningful.

**Fix:** No change required; flagged for awareness only. If a future Lighthouse regression points at composite-layer churn, revisit.

---

_Reviewed: 2026-04-27_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
