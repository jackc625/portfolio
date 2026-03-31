---
status: diagnosed
phase: 05-dark-mode-animations-polish
source: [05-VERIFICATION.md]
started: 2026-03-31T03:00:00Z
updated: 2026-03-31T03:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Theme crossfade visual quality
expected: Theme toggle animates smoothly between dark/light with CSS transition (no jarring snap)
result: pass

### 2. No-flash on initial page load
expected: Correct theme renders on first paint — no flash of wrong theme (inline script in head prevents FOUC)
result: pass

### 3. No-flash on View Transition navigation
expected: After switching to light mode and navigating via View Transitions, theme persists without flash (astro:after-swap fix)
result: pass

### 4. WCAG AA contrast ratios
expected: Both dark and light themes pass 4.5:1+ contrast on all body text and 3:1+ on large text (test with axe or Lighthouse)
result: pass

### 5. Scroll animation feel
expected: Page sections fade/slide in on scroll with GSAP ScrollTrigger — subtle, not distracting, respects reduced-motion
result: pass

### 6. Page transition crossfade
expected: Route changes use Astro View Transitions with smooth crossfade between pages
result: pass

### 7. Hover micro-interactions
expected: Buttons, cards, and links have visible hover states (scale, color shift, underline) that feel responsive
result: pass

### 8. Canvas mouse influence
expected: Canvas hero particles visually flow/bend toward cursor position on mouse move
result: issue
reported: "No. Fail. It is not responsive to cursor at all"
severity: major

### 9. Reduced motion compliance
expected: With prefers-reduced-motion enabled, scroll animations and transitions are disabled or simplified
result: pass

### 10. Print output quality
expected: Resume page prints cleanly via Ctrl+P — no nav/footer, readable layout, no cut-off content
result: pass

## Summary

total: 10
passed: 9
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Canvas hero particles visually flow/bend toward cursor position on mouse move"
  status: failed
  reason: "User reported: No. Fail. It is not responsive to cursor at all"
  severity: major
  test: 8
  root_cause: "Mouse influence formula `angle += Math.atan2(dy, dx) * influence` is mathematically incorrect. atan2 returns direction to mouse, not a correction amount — produces zero effect when mouse is on particle's x-axis. Also mouseInfluenceMax (0.3) and mouseRadius (150) are too small for the ultra-faint particle rendering."
  artifacts:
    - path: "src/components/CanvasHero.astro"
      issue: "Line 137: broken influence formula using raw atan2 instead of angular difference"
  missing:
    - "Replace with proper angular difference blending: compute shortest rotation from flow angle toward mouse angle, apply fraction proportional to influence"
    - "Increase mouseInfluenceMax to 0.5-0.7 and mouseRadius to 200-250 for perceptible effect"
  debug_session: ".planning/debug/canvas-mouse-influence-human-uat.md"
