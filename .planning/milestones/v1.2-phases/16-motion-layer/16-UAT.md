---
status: resolved
phase: 16-motion-layer
source: [16-01-SUMMARY.md, 16-02-SUMMARY.md, 16-03-SUMMARY.md, 16-04-SUMMARY.md, 16-05-SUMMARY.md, 16-06-SUMMARY.md, 16-07-SUMMARY.md]
started: 2026-04-27T21:45:00Z
updated: 2026-04-27T22:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Page-enter View Transition Fade
expected: Navigate between any two pages. Outgoing page fades out, incoming fades in via native View Transitions. No content jump or flash. (MOTN-01)
result: pass
notes: "Initially issue (severity: major) - 'Kind of. There's almost a sort of flicker in between'. Resolved by fix commit 1a3e154 (CSS shared-rule fix removed simultaneous reveal-rise animations during view-transition). User re-verified PASS."

### 2. Scroll-reveal on Sections
expected: Scroll down on home, about, or a project detail page. Section headings (.h1-section), work rows, and prose paragraphs fade and slide up <=12px when they enter the viewport. Each element animates once (one-shot per element). (MOTN-02)
result: pass
notes: "Initially issue (severity: major) - 'No. I don't notice any fading in or scroll reveal at all'. Resolved by fix commit 1a3e154 (removed .reveal-init from shared animation rule so animation now fires only when IntersectionObserver adds .reveal-on). User re-verified PASS."

### 3. Word-stagger on Section Headings
expected: When an .h1-section heading scrolls into view, individual words animate in with a slight stagger (each word fades + rises in sequence rather than all at once). (MOTN-07)
result: pass
notes: "Initially issue (severity: major) - 'No. No fade in'. Resolved by fix commit 1a3e154 (gated .word animation behind .reveal-on .word + added .h1-section class to SectionHeader.astro section-label span so word-stagger now has matching DOM targets on home/about/contact). User re-verified PASS."

### 4. Homepage Hero (.display) Untouched
expected: The homepage hero text (the large .display heading at the top of the page) does NOT word-stagger and does NOT scroll-reveal. It is rendered immediately on page load with no entrance animation. (D-08 / MOTN-07 exclusion)
result: pass

### 5. WorkRow Arrow Hover Slide
expected: Hover or keyboard-focus a project row on the homepage Selected Work section. The arrow at the right end fades from opacity 0 to 1 (120ms) AND slides 4px to the right (180ms ease-out). Title also gets accent underline. (MOTN-03)
result: pass

### 6. Chat Bubble Pulse (Idle)
expected: With chat closed and not hovered, the chat bubble in the bottom-right shows a quiet, slow pulsing accent ring + tiny scale (0.4 alpha -> 0 alpha, scale 1.0 -> 1.02 -> 1.0, 2500ms ease-in-out, infinite). Should feel "alive but quiet" not aggressive. (MOTN-04)
result: pass

### 7. Chat Bubble Pulse Pauses on Hover/Focus
expected: Hover the chat bubble OR keyboard-focus it (Tab to it). The pulse animation freezes at its current frame. Move away and it resumes. (D-15)
result: pass

### 8. Chat Bubble Pulse Pauses While Panel Open
expected: Click the chat bubble to open the panel. Pulse freezes (paused while panel open). Close the panel. Pulse resumes. (D-15)
result: pass

### 9. Chat Panel Scale-in on Open
expected: Click the chat bubble. Panel scales in from 96% to 100% with opacity 0 -> 1, 180ms ease-out, transform-origin bottom-right (so it appears to pop out from the bubble). (MOTN-05)
result: pass

### 10. Typing-dot Bounce During Streaming
expected: Send a chat message. While Claude is streaming the response, the three typing dots (...) bounce in sequence. Bounce stops when streaming completes. (MOTN-06)
result: pass

### 11. Reduced-motion: Entrance Animations OFF
expected: With OS-level "Reduce motion" enabled (System Settings > Accessibility on macOS, or Chrome DevTools > Rendering > Emulate CSS prefers-reduced-motion: reduce), reload the site. Page-enter fade, scroll-reveal, word-stagger, WorkRow arrow translateX, and chat panel scale-in are all suppressed. Content appears immediately/at rest with no entrance motion. (MOTN-08)
result: pass

### 12. Reduced-motion: Chat Bubble Pulse OFF
expected: With reduced-motion enabled, chat bubble pulse is fully off (no ring, no scale). Bubble is just static. (MOTN-08 / D-24)
result: pass

### 13. Reduced-motion: Typing-dot Bounce OFF
expected: With reduced-motion enabled, typing-dots during streaming do NOT bounce. They render statically. (MOTN-06 reduce parity)
result: pass

## Summary

total: 13
passed: 13
issues: 0
pending: 0
skipped: 0
issues_resolved: 3
resolution_commit: 1a3e154

## Gaps

- truth: "Page-enter view-transition fade is smooth with no content jump or flash"
  status: resolved
  reason: "User reported: Kind of. There's almost a sort of flicker in between"
  severity: major
  test: 1
  root_cause: "Likely a downstream symptom of the .reveal-init self-triggering bug. While view-transition cross-fade runs (200ms), the new page's above-the-fold .reveal-init elements simultaneously run reveal-rise 300ms (forwards), creating overlapping fade animations that composite as a flicker."
  artifacts:
    - path: "src/styles/global.css"
      issue: "Lines 568-573 view-transition pseudo-elements + lines 589-592 shared .reveal-init/.reveal-on animation rule cause overlapping fades during navigation."
  missing:
    - "Apply the .reveal-init self-triggering fix (gap 2) and re-test; if flicker persists, add view-transition-name on body or animation-fill-mode: backwards to the ::view-transition-* pseudo-elements."

- truth: "Section headings, work rows, and prose paragraphs fade and slide up <=12px on scroll into viewport"
  status: resolved
  reason: "User reported: No. I don't notice any fading in or scroll reveal at all"
  severity: major
  test: 2
  root_cause: "src/styles/global.css:589-592 declares the reveal-rise animation on the SHARED .reveal-init, .reveal-on rule. motion.ts adds .reveal-init to all reveal targets at init time (lines 111-117); the moment that class lands, the 300ms forwards animation runs immediately at page load, fading every reveal target from opacity 0 to 1 before the user has a chance to scroll. By the time IntersectionObserver adds .reveal-on, the animation has already completed and animation property is identical so no restart fires. End state: all targets stuck at opacity 1, no visible reveal-on-scroll anywhere on the site. Confirmed by user diagnostic: page=/, .reveal-init=0, .reveal-on=0, .work-row=3, .about-body p=2, reduce=false, console showed [motion] observer attached so initMotion ran."
  artifacts:
    - path: "src/styles/global.css"
      issue: "Lines 589-590: shared selector `.reveal-init, .reveal-on { animation: reveal-rise 300ms ease-out forwards; }` causes init-time self-trigger."
  missing:
    - "Remove `.reveal-init,` from the shared animation rule — keep `.reveal-init` only as the rest-state declaration (opacity:0 + translateY(12px)); apply the animation only to `.reveal-on`."

- truth: ".h1-section words fade + rise in sequence (word-stagger) when heading scrolls into view"
  status: resolved
  reason: "User reported: No. No fade in"
  severity: major
  test: 3
  root_cause: "Two compounding bugs: (a) src/styles/global.css:597-603 declares the word-rise animation directly on `.word`, so spans animate the moment wrapWordsInPlace creates them at init time (same self-trigger pattern as .reveal-init); (b) more fundamentally: src/scripts/motion.ts:13 comment claims SectionHeader.astro outputs <h2 class='h1-section'>, but src/components/primitives/SectionHeader.astro:24-28 actually outputs <div class='section-header'><span class='label-mono section-label'> — the .h1-section class never appears on home/about/contact. It only exists on src/pages/projects/[id].astro:41 (project detail title). User's diagnostic confirmed .h1_section count = 0 on the home page. So word-stagger has nothing to attach to anywhere except project detail pages."
  artifacts:
    - path: "src/styles/global.css"
      issue: "Lines 597-603: `.word` self-triggers word-rise animation at span creation time."
    - path: "src/scripts/motion.ts"
      issue: "Line 13 comment lies: claims SectionHeader outputs .h1-section. Line 18 REVEAL_SELECTOR includes .h1-section but no SectionHeader instance ever emits it."
    - path: "src/components/primitives/SectionHeader.astro"
      issue: "Lines 24-28: outputs .section-header / .section-label, not .h1-section. Either add .h1-section to the section-label span or widen REVEAL_SELECTOR to match what's actually emitted."
  missing:
    - "Gate .word animation behind the parent's .reveal-on class: `.reveal-on .word { animation: ... }` instead of `.word { animation: ... }`."
    - "Decide spec intent: add `h1-section` to SectionHeader.astro's `<span class=\"label-mono section-label\">` OR widen motion.ts REVEAL_SELECTOR to include `.section-label`. SectionHeader is the most natural target for word-stagger (it's the section header pattern across the site)."
