---
status: complete
phase: 05-dark-mode-animations-polish
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md]
started: 2026-03-30T23:55:00Z
updated: 2026-03-31T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Theme Toggle Switching
expected: Click the sun/moon toggle in the header. The entire page switches between dark and light themes with a smooth crossfade transition. The toggle icon morphs between sun and moon with a rotation + scale animation.
result: issue
reported: "Yes, it works, however minor issue: navigating to a new page switches light/dark mode... the one you select doesn't persist across pages."
severity: minor

### 2. Theme Persistence (No Flash)
expected: Switch to light theme, then reload the page. The page loads directly in light theme with no flash of dark theme. Close and reopen the browser tab — light theme still active.
result: pass

### 3. Theme Toggle on Mobile
expected: On mobile viewport, the theme toggle is visible in the header bar without needing to open the hamburger menu. Tapping it switches themes just like desktop.
result: pass

### 4. Canvas Hero Theme Awareness
expected: On the home page, switch themes. The canvas particle trail colors change to match the new theme (warmer/different tones for light vs dark). The canvas reinitializes smoothly without glitching.
result: pass

### 5. Scroll-Triggered Section Reveals
expected: Scroll down any page (e.g., home, about). Sections that were below the fold fade in and slide up as they enter the viewport. Already-visible sections at page top appear immediately.
result: pass

### 6. SplitText Heading Animations
expected: Navigate to any page. The main H1 heading animates in line-by-line (each line clips/reveals sequentially). Visible on home, about, projects, resume, contact pages.
result: pass

### 7. Staggered Card/Item Reveals
expected: On the projects page, project cards animate in with staggered timing (each card appears slightly after the previous one). Similar stagger on about page skill groups and contact page channels.
result: pass

### 8. View Transition Crossfade
expected: Click a navigation link to go to another page. The page transition shows a smooth crossfade (old page fades out, new page fades in) rather than a hard cut.
result: pass

### 9. Project Card Hover Effects
expected: Hover over a project card on the projects page. The card lifts slightly (-0.5 translate) and gains a subtle shadow. Effect reverses on mouse leave.
result: pass

### 10. Nav Link Hover Underline
expected: Hover over a non-active navigation link in the header. An underline animates in from left to right. The underline disappears on mouse leave.
result: pass

### 11. Footer Icon Hover Lift
expected: Hover over a social icon in the footer. The icon lifts slightly upward. Effect reverses on mouse leave.
result: pass

### 12. Canvas Mouse Influence
expected: On the home page, move your cursor over the canvas hero area. Nearby particles subtly flow/bend toward the cursor position. Effect only active on devices with a mouse (not touch).
result: issue
reported: "Fail, canvas hero doesn't respond to cursor"
severity: major

### 13. Canvas Parallax Depth
expected: On the home page canvas, particles appear at different visual depths — some are fainter and slower (background), others are brighter and faster (foreground). Creates a layered depth effect.
result: pass

### 14. Resume Print Output
expected: Open the resume page and use browser Print Preview (Ctrl+P). The output shows clean black text on white background. Navigation, footer, download button, and other chrome are hidden. Skill tags appear as comma-separated text rather than chips.
result: pass

### 15. Print Contact Header
expected: In resume Print Preview, a contact header appears at the top showing: Jack Cutrara's name, email, GitHub URL, and LinkedIn URL. This header is not visible on screen — only in print.
result: pass

### 16. JSON-LD Structured Data
expected: View page source on the home page (or about page). A script tag with type="application/ld+json" contains a Person schema with name, jobTitle, url, and sameAs fields. On any project case study page, a CreativeWork schema appears with the project title and keywords.
result: pass

## Summary

total: 16
passed: 14
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Theme selection persists when navigating between pages"
  status: failed
  reason: "User reported: navigating to a new page switches light/dark mode... the one you select doesn't persist across pages."
  severity: minor
  test: 1
  artifacts: []
  missing: []
- truth: "Canvas hero particles flow/bend toward cursor on mouse move"
  status: failed
  reason: "User reported: canvas hero doesn't respond to cursor"
  severity: major
  test: 12
  artifacts: []
  missing: []
