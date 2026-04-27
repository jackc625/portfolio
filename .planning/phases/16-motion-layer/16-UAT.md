---
status: complete
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
result: issue
reported: "Kind of. There's almost a sort of flicker in between"
severity: major

### 2. Scroll-reveal on Sections
expected: Scroll down on home, about, or a project detail page. Section headings (.h1-section), work rows, and prose paragraphs fade and slide up <=12px when they enter the viewport. Each element animates once (one-shot per element). (MOTN-02)
result: issue
reported: "No. I don't notice any fading in or scroll reveal at all"
severity: major

### 3. Word-stagger on Section Headings
expected: When an .h1-section heading scrolls into view, individual words animate in with a slight stagger (each word fades + rises in sequence rather than all at once). (MOTN-07)
result: issue
reported: "No. No fade in"
severity: major

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
passed: 10
issues: 3
pending: 0
skipped: 0

## Gaps

- truth: "Page-enter view-transition fade is smooth with no content jump or flash"
  status: failed
  reason: "User reported: Kind of. There's almost a sort of flicker in between"
  severity: major
  test: 1
  artifacts: []
  missing: []

- truth: "Section headings, work rows, and prose paragraphs fade and slide up <=12px on scroll into viewport"
  status: failed
  reason: "User reported: No. I don't notice any fading in or scroll reveal at all"
  severity: major
  test: 2
  artifacts: []
  missing: []

- truth: ".h1-section words fade + rise in sequence (word-stagger) when heading scrolls into view"
  status: failed
  reason: "User reported: No. No fade in"
  severity: major
  test: 3
  artifacts: []
  missing: []
