---
status: investigating
trigger: "Canvas hero particles don't respond to cursor — previous fix (395c456) moved listener to section but user reports particles still don't respond"
created: 2026-03-30T00:00:00Z
updated: 2026-03-30T00:00:00Z
---

## Current Focus

hypothesis: The mousemove listener now fires correctly (post-395c456 fix), but the influence formula `angle += Math.atan2(dy, dx) * influence` is mathematically incorrect — it adds a scaled raw atan2 value to the flow angle instead of properly blending the flow direction toward the mouse direction, producing inconsistent and often imperceptible effects
test: Trace the math for representative particle-mouse configurations and identify cases where the formula produces zero or near-zero visual effect
expecting: If the formula is the root cause, there will be common configurations where the angular perturbation is too small to produce visible particle displacement despite the listener firing
next_action: Apply corrected influence formula and verify particles visibly respond to cursor

## Symptoms

expected: Particles within 150px of cursor should receive angular offset toward cursor position (max 0.3 radians influence, linear falloff) — visible "flow toward cursor" effect
actual: Particles don't flow/bend toward the cursor at all. Parallax depth effect works but mouse influence does not. Previous fix (395c456) moved listener from canvas to section, user reports still no visible response.
errors: None (silent failure — no errors, just no visual response)
reproduction: Move cursor over the canvas hero area on the home page
started: May have never worked — the mouse influence code was written but the original listener target (canvas) was blocked by the z-10 overlay div

## Eliminated

- hypothesis: Mousemove listener is attached to the canvas element, but the overlay div at z-10 intercepts all pointer events so the canvas never receives events
  evidence: Commit 395c456 moved listener from canvas to section. The section is the parent of both the canvas and the overlay div, so mousemove events from the overlay bubble up to the section. Verified in current code (line 64): `section.addEventListener('mousemove', onMouseMove)`. This fix was correct but did not resolve the user-visible issue.
  timestamp: 2026-03-30T00:00:00Z

- hypothesis: pointer-events CSS blocks interaction somewhere
  evidence: Searched entire src/ directory and all CSS files for "pointer-events" — zero results. No pointer-events rules exist anywhere in the project.
  timestamp: 2026-03-30T00:01:00Z

- hypothesis: stopPropagation or preventDefault on mousemove prevents events from reaching the section listener
  evidence: Searched entire src/ directory for stopPropagation and preventDefault — zero results related to mouse events. No event propagation blocking exists.
  timestamp: 2026-03-30T00:01:00Z

- hypothesis: The astro:page-load event doesn't fire on initial load, so initCanvas() never runs
  evidence: Astro docs confirm astro:page-load fires both on initial navigation and subsequent view transitions when ClientRouter is present. ClientRouter is included in BaseLayout.astro (line 88).
  timestamp: 2026-03-30T00:02:00Z

- hypothesis: The header (fixed z-50, h-14) blocks mouse events across the entire hero
  evidence: Header is fixed at top, 56px tall (h-14). The hero section is h-screen. The header only covers the top 56px — the remaining ~90% of the hero receives mouse events normally.
  timestamp: 2026-03-30T00:02:00Z

## Evidence

- timestamp: 2026-03-30T00:01:00Z
  checked: Commit 395c456 diff — what the previous fix changed
  found: Changed `canvas.addEventListener('mousemove', onMouseMove)` to `section.addEventListener('mousemove', onMouseMove)`. Also added `canvas.closest('section')` lookup and null check. Cleanup also updated to remove from section.
  implication: The event target fix was correct. Events should now bubble from the overlay div up to the section listener. The issue is downstream of event delivery.

- timestamp: 2026-03-30T00:02:00Z
  checked: onMouseMove handler (lines 55-59)
  found: Handler uses `canvas.getBoundingClientRect()` to convert clientX/clientY to canvas-local coordinates. Canvas is absolute inset-0 within the section. Coordinates should be correct since both clientX/clientY and getBoundingClientRect are viewport-relative.
  implication: Mouse coordinate conversion appears correct. mouseX/mouseY should contain valid canvas-local positions when the handler fires.

- timestamp: 2026-03-30T00:03:00Z
  checked: Mouse influence calculation in draw loop (lines 131-138)
  found: |
    Formula: `angle += Math.atan2(dy, dx) * influence`
    where influence = (1 - dist/mouseRadius) * mouseInfluenceMax
    
    This formula is INCORRECT. It multiplies the raw atan2 angle (the direction from particle to mouse) by the influence factor and ADDS it to the flow angle. This is not the same as "blend the particle's heading toward the mouse."
    
    Problem: atan2(dy, dx) returns the DIRECTION to the mouse as an angle in [-PI, PI]. When the mouse is directly to the right of a particle, atan2 ~ 0, so the adjustment is ~0 regardless of proximity. When the mouse is to the left, atan2 ~ +/-PI, giving a large adjustment. The effect strength depends on the DIRECTION to the mouse, not just the distance.
    
    Correct approach: Compute the angular DIFFERENCE between current heading and mouse direction, then apply a fraction of that difference:
    ```
    const mouseAngle = Math.atan2(dy, dx);
    let angleDiff = mouseAngle - angle;
    // Normalize to [-PI, PI] for shortest-path rotation
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    angle += angleDiff * influence;
    ```
  implication: The influence formula produces directionally inconsistent and often near-zero effects. For many common cursor positions, the visual effect is imperceptible even though the listener fires correctly.

- timestamp: 2026-03-30T00:04:00Z
  checked: Influence parameters (lines 52-53)
  found: mouseRadius = 150px, mouseInfluenceMax = 0.3. With 1000 particles spread across a 1920x1080 viewport, only ~34 particles fall within the 150px radius at any time. Combined with ultra-faint rendering (0.3-0.6px line width, 0.09-0.18 opacity strokes, 0.03 alpha trail fade), even correctly-calculated influence may need stronger parameters to be clearly visible.
  implication: Parameters may need tuning even after fixing the formula, but the formula fix is the primary issue.

- timestamp: 2026-03-30T00:05:00Z
  checked: Mathematical analysis of current formula vs corrected formula
  found: |
    Current formula for particle at (500, 400), mouse at (510, 400) — mouse directly right:
    - dx=10, dy=0, dist=10, influence=0.28
    - atan2(0, 10) = 0
    - angle += 0 * 0.28 = 0  <-- ZERO EFFECT despite being 10px away
    
    Current formula for particle at (500, 400), mouse at (500, 410) — mouse directly below:
    - dx=0, dy=10, dist=10, influence=0.28
    - atan2(10, 0) = PI/2 = 1.57
    - angle += 1.57 * 0.28 = 0.44  <-- STRONG EFFECT
    
    Corrected formula for mouse directly right (same scenario):
    - mouseAngle = atan2(0, 10) = 0
    - If flow angle = 2.0, angleDiff = 0 - 2.0 = -2.0
    - angle += -2.0 * 0.28 = -0.56  <-- CONSISTENT EFFECT, rotates toward mouse
    
    The current formula gives zero effect when mouse is on the x-axis relative to particle, regardless of distance. The corrected formula always produces an effect proportional to how far the current heading deviates from the mouse direction.
  implication: The current formula has a fundamental directional bias making it produce zero effect for ~25% of particle-mouse configurations and weak effects for many more. This explains why the effect appears completely absent to users.

- timestamp: 2026-03-30T00:06:00Z
  checked: Whether (hover: hover) media query could fail on the user's machine
  found: User is on Windows 11 desktop. The (hover: hover) media query returns true for devices with a fine pointer (mouse/trackpad). Desktop browsers on Windows universally report hover capability. This check should pass.
  implication: The hover capability check is not preventing listener attachment on the user's machine.

- timestamp: 2026-03-30T00:07:00Z
  checked: Event bubbling path from overlay div to section
  found: HTML structure is section > canvas + div.z-10. Mouse events on the div or its children (h1, p elements) bubble up through the DOM to the section. No stopPropagation calls exist. The section listener using addEventListener will capture these bubbled events.
  implication: Events DO reach the section listener. The onMouseMove handler fires and updates mouseX/mouseY. The problem is in how those values are used in the draw loop.

## Resolution

root_cause: The mouse influence formula in the draw loop (line 137) is mathematically incorrect. The formula `angle += Math.atan2(dy, dx) * influence` multiplies the raw direction angle to the mouse by the influence factor and adds it to the flow angle. This produces directionally biased effects: zero influence when the mouse is on the particle's x-axis (atan2 returns ~0), and strong influence when the mouse is on the y-axis (atan2 returns ~PI/2). For roughly 25% of particle-mouse geometric configurations, the effect is zero or near-zero, and for many more it's too small to perceive. The correct approach is to compute the angular difference between the current flow heading and the mouse direction, then apply a fraction of that difference. The previous fix (395c456) correctly resolved the event delivery issue (listener on section instead of canvas), but the underlying math bug means the influence is imperceptible even when events fire correctly.
fix: 
verification: 
files_changed: []
