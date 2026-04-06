---
status: diagnosed
trigger: "Investigate why the canvas hero particles don't respond to mouse cursor movement"
created: 2026-03-30T00:00:00Z
updated: 2026-03-30T00:00:00Z
---

## Current Focus

hypothesis: The mousemove listener is attached to the canvas element, but the overlay div (z-10) intercepts all pointer events, so the canvas never receives mousemove events
test: Check the HTML structure — is there a higher z-index element covering the canvas that would capture pointer events?
expecting: If overlay div sits above canvas and has no pointer-events:none, the canvas mousemove listener will never fire
next_action: Examine the HTML structure and CSS of CanvasHero.astro to confirm pointer event blocking

## Symptoms

expected: Particles within 150px of cursor should receive angular offset toward cursor position (max 0.3 radians, linear falloff)
actual: Particles don't flow/bend toward the cursor. Parallax depth effect works but mouse influence does not.
errors: None (silent failure — no errors, just no visual response)
reproduction: Move cursor over the canvas hero area on the home page
started: Unknown — may have never worked

## Eliminated

## Evidence

- timestamp: 2026-03-30T00:01:00Z
  checked: CanvasHero.astro HTML structure (lines 6-12)
  found: Canvas is at `absolute inset-0` (z-index auto/0). Content overlay div is at `relative z-10` with `h-full` covering entire section area. The overlay div sits above the canvas in the stacking order and covers it completely.
  implication: The overlay div intercepts all pointer events. The canvas underneath never receives mousemove events.

- timestamp: 2026-03-30T00:02:00Z
  checked: pointer-events CSS across entire src/ directory
  found: No pointer-events rules exist anywhere in the project
  implication: Nothing overrides default pointer-events behavior. The overlay div captures all mouse events by default.

- timestamp: 2026-03-30T00:03:00Z
  checked: mousemove listener attachment (line 62)
  found: Listener is attached to `canvas` element, not to the section or overlay div
  implication: Listener is on the wrong element — or the overlay needs pointer-events:none

- timestamp: 2026-03-30T00:04:00Z
  checked: Mouse influence math (lines 127-136)
  found: Calculation is correct — linear falloff within 150px radius, max 0.3 radian offset, atan2 direction toward cursor
  implication: Math is not the issue. If events were delivered, the effect would work.

## Resolution

root_cause: The mousemove listener is attached to the canvas element (line 62), but the content overlay div at z-10 (line 9) covers the entire canvas and intercepts all pointer events. The canvas never receives mousemove events because the higher-z-index div captures them first. No pointer-events CSS exists anywhere to let events pass through.
fix:
verification:
files_changed: []
