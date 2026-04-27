---
phase: 16-motion-layer
fixed_at: 2026-04-27T18:17:00Z
review_path: .planning/phases/16-motion-layer/16-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 16: Code Review Fix Report

**Fixed at:** 2026-04-27 18:17 UTC
**Source review:** `.planning/phases/16-motion-layer/16-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (2 critical + 6 warning; info skipped per default scope)
- Fixed: 8
- Skipped: 0

**Verification gates (all GREEN after fix sequence):**
- `pnpm test` -- 338/338 passing across 37 test files
- `pnpm check` -- 0 errors / 0 warnings / 0 hints
- D-26 chat regression battery -- 16/16 passing (3 chat test files)
- D-15 `src/pages/api/chat.ts` byte-identical to phase-start commit `721f844`
- Zero new package.json / lockfile dependencies introduced

## Fixed Issues

### CR-01: MOTN-02 scroll-reveal flickers already-visible elements

**Files modified:** `src/styles/global.css`, `src/scripts/motion.ts`
**Commit:** `3fa666a`
**Applied fix:** Adopted the `.reveal-init` resting-state pattern (option A from
the REVIEW.md recommendation):

1. `global.css` now declares `.reveal-init { opacity: 0; transform: translateY(12px); }`
   inside the existing `@media (prefers-reduced-motion: no-preference)` block,
   matching the `@keyframes reveal-rise` `from` state. The shared
   `.reveal-init, .reveal-on { animation: reveal-rise 300ms ease-out forwards }`
   declaration is preserved.
2. `motion.ts` `initMotion()` now applies `.reveal-init` to every reveal target
   immediately AFTER the `shouldReduceMotion()` early-return (MOTN-08
   contract preserved -- no DOM mutation under reduce) and BEFORE the
   IntersectionObserver is constructed.
3. Result: targets render at the keyframe `from` state from the first paint;
   the IO callback adds `.reveal-on` and the same animation declaration
   completes the entrance. No visible snap-to-opacity-0 flicker.

This also resolves WR-01 (`.reveal-init` no longer dead code) per the
reviewer's own recommendation tying that resolution to CR-01.

### CR-02: MOTN-07 word-stagger flashes "empty heading" on first reveal

**Files modified:** `src/scripts/motion.ts`
**Commit:** `aaa71d4`
**Applied fix:** Pre-wrap `.h1-section` headings (excluding `.display`) at JS
init time, after the `shouldReduceMotion()` reduce-bail check and before the
IntersectionObserver is constructed. The pre-existing `.display` exclusion
contract is honored via both the selector check and the `matches(".display")`
defensive guard. Combined with the CR-01 `.reveal-init` resting state, the
heading renders with opacity-0 word spans from the first paint instead of
flashing as plain text and then "going blank" while the IO callback clears
textContent and rebuilds with opacity-0 spans. The
`handleRevealEntry` `wrapWordsInPlace` call remains in place as a defensive
no-op (idempotent via `data-stagger-split` guard) so any reveal target
introduced after init still gets wrapped.

### WR-01: `.reveal-init` rule is dead code on the screen

**Files modified:** (resolved as side-effect of CR-01)
**Commit:** `3fa666a` (same as CR-01)
**Applied fix:** Per the REVIEW.md recommendation ("If CR-01 is fixed by
adopting the `.reveal-init` resting-state pattern, this finding is
resolved"), the CR-01 fix promotes `.reveal-init` from dead code to a
load-bearing class applied by `motion.ts` to every reveal target at init.
The CSS rule now declares its own resting state (opacity 0 / translateY(12px))
in addition to sharing the animation declaration with `.reveal-on`.

### WR-02: Cross-document navigation makes `panel.dataset.chatBound` re-init branch unreachable

**Files modified:** `src/scripts/chat.ts`
**Commit:** `7610fa8`
**Applied fix:** Removed the dead re-attach branch inside the
`chatInitialized && panel.dataset.chatBound === "true"` guard. The branch was
correct under Phase 7's `<ClientRouter />` regime where `transition:persist`
preserved the panel DOM across navigations; Phase 8 removed `<ClientRouter />`
and every navigation is now a full document reload, so module state, dataset,
and inline styles all reset and the condition cannot be true on a fresh page
load. The branch also leaned on the wrong source of truth
(`panel.style.display !== "none"` vs the canonical `.is-open` class). Deletion
is safe -- the bootstrap-level `chatBootstrapped` guard at `chat.ts:894-897`
already prevents document listener pile-up across HMR / test reset cycles.
The replacement comment documents why the re-attach was removed and points
to the canonical signal. D-26 chat regression battery (XSS / CORS / focus-trap
setup-on-open / rate-limit / SSE) untouched.

### WR-03: bootstrap-guard comments mislead about cross-document navigation

**Files modified:** `src/scripts/motion.ts`, `src/scripts/scroll-depth.ts`
**Commit:** `4f4b450`
**Applied fix:** Reworded both bootstrap-level guard comments to match
production reality. The guards previously claimed to prevent "document
listener pile-up if this module is re-evaluated across cross-document
navigations" / "across Astro view transitions". With `<ClientRouter />`
prohibited (MOTION.md §9), every production navigation is a full document
reload -- module-level state resets naturally, so the guard is functionally
a no-op at runtime. The new wording frames the guard as an HMR / test-reset
concern (where `vi.resetModules()` cycles within a single jsdom session DO
re-import the module). The motion.ts "why both listeners" follow-up comment
is preserved verbatim. Comment-only change; zero behavioral impact.

### WR-04: `wrapWordsInPlace` silently strips inline markup from headings

**Files modified:** `src/scripts/motion.ts`, `design-system/MOTION.md`
**Commit:** `e2b68a6`
**Applied fix:** Added a pre-flight guard in `wrapWordsInPlace`:
`if (el.children.length > 0) return`. The function bails before any
destructive `el.textContent = ""` operation when the heading already
contains element children (`<em>`, `<strong>`, `<a>`, `<br>`, etc.).
Inline-marked-up headings still receive the standard `.reveal-on`
entrance animation; only the per-word stagger is skipped, preserving
authored markup. The XSS-safe textContent-only contract is preserved
(the existing test at `tests/client/motion.test.ts:190-200` still
passes -- inline `<` characters in plain text don't create element
children when assigned via `textContent`). Documented the fallback in
MOTION.md §5 MOTN-07.

### WR-05: `MOTION.md` Lighthouse stress guard count is brittle

**Files modified:** `tests/build/motion-css-rules.test.ts`
**Commit:** `d3ce994`
**Applied fix:** Added a docblock above the MOTN-10 Lighthouse stress-guard
describe block documenting the heuristic limitation: the regex
`/\/\*[\s\S]*?\*\//g` strips CSS block comments but does not handle string
content (e.g., a `content: "cubic-bezier("` declaration would trip a false
positive) or unbalanced delimiters. For v1.2 the heuristic is sufficient
(global.css contains no `content:` strings with banned tokens). The
docblock instructs future contributors to upgrade to a postcss / lightningcss
parser if a false positive arises. Test logic unchanged; zero behavioral
impact.

### WR-06: Chat panel scale-in rests `transform-origin` only inside no-preference

**Files modified:** `src/styles/global.css`
**Commit:** `995f3b1`
**Applied fix:** Moved `#chat-panel { transform-origin: bottom right; }`
above the `@media (prefers-reduced-motion: no-preference)` block. The
declaration is positional configuration of the element, not part of the
MOTN-05 scale-in animation, so it now applies to reduce and no-preference
users alike. The `#chat-panel.is-open { animation: chat-panel-scale-in 180ms
ease-out forwards }` rule remains inside no-preference, preserving the
build/motion-css-rules.test.ts assertion that the entrance animation lives
inside no-preference. The `transform-origin` presence assertion at
`motion-css-rules.test.ts:87-89` remains GREEN (the assertion only requires
the declaration exist somewhere in global.css).

---

_Fixed: 2026-04-27 18:17 UTC_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
