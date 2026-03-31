---
phase: 05-dark-mode-animations-polish
plan: 06
subsystem: ui
tags: [canvas, mouse-influence, animation, bug-fix, gap-closure]

# Dependency graph
requires:
  - phase: 05-05
    provides: "Section-level mousemove listener for canvas hero"
provides:
  - "Visible mouse-responsive particle repulsion effect in canvas hero"

status: complete
gap_closure: true
duration_minutes: ~15
---

# Summary — 05-06: Fix Canvas Mouse Influence

## What was built
Fixed the canvas hero mouse influence so particles visibly respond to cursor movement. Changed from attraction (particles chase cursor — looked unnatural with faint strokes) to **repulsion** (particles push away from cursor, creating a wake effect). Also increased particle visibility from near-invisible to clearly visible.

## Key changes

### Formula fix
- Replaced broken `angle += Math.atan2(dy, dx) * influence` with angular-difference formula using `angleDiff = awayAngle - angle` normalized to [-PI, PI]
- Switched from attraction (`atan2(dy, dx)`) to repulsion (`atan2(-dy, -dx)`)

### Parameter tuning (user-approved)
| Parameter | Before | After |
|-----------|--------|-------|
| mouseRadius | 150 | 400 |
| mouseInfluenceMax | 0.3 | 1.2 |
| speedMult near cursor | 1x | up to 3x |
| strokeOpacity | 0.09-0.18 | 0.15-0.30 |
| lineWidth | 0.3-0.6px | 0.5-1.2px |

## Key files

### Modified
- `src/components/CanvasHero.astro` — Mouse influence formula + particle rendering params

## Deviations from plan
- Plan specified attraction; switched to repulsion after user feedback that attraction looked "weird" with particles chasing cursor
- Increased particle opacity/width beyond plan scope — original values were too faint to see any mouse effect
- Parameters tuned interactively with user rather than using plan's suggested values

## Self-Check: PASSED
- [x] Particles visibly respond to cursor movement (user confirmed)
- [x] Repulsion effect creates natural wake as cursor moves through field
- [x] Build passes
- [x] No regressions to flow field, depth parallax, trail fade, theme awareness
