---
created: 2026-04-15T21:49:58.277Z
title: Change mobile menu breakpoint from 380px to 768px
area: ui
files:
  - src/components/primitives/Header.astro:128-172
  - design-system/MASTER.md (D-06 design decision)
---

## Problem

D-06 currently scopes the hamburger trigger to header container width ≤380px (implemented as an `@container` query in `Header.astro:165-172`). Below 768px but above 380px — the standard "mobile" viewport range (phones in portrait, most tablets in portrait) — the site keeps showing the inline desktop nav, which is not the industry-standard mobile UX and doesn't match user expectation.

Surfaced during Phase 12 UAT Test 2 (MobileMenu inert/focus-trap verification): the tester expected the hamburger at <768px and couldn't trigger the mobile menu at a normal mobile width. Jack confirmed this is an intentional design-decision change — mobile menu should appear at the standard <768px breakpoint, not ≤380px.

## Solution

Scope (approximate, needs proper design review):

1. Change `@container (max-width: 380px)` in `Header.astro:165` to a media query or container query at 768px (confirm whether container queries still work at that scale with Header's containment context, or swap to `@media (max-width: 767px)` for reliability).
2. Audit the rest of the site for assumptions that the desktop nav is visible down to 380px:
   - `src/pages/index.astro:110` (`@media (max-width: 1023px)`) and `:116` (`@media (max-width: 767px)`) — confirm no collision.
   - `src/styles/global.css:401, 506, 516` — review mobile breakpoints for layout inconsistency once hamburger appears earlier.
   - `Footer.astro` — already responsive at 767px, should be consistent.
3. Update `design-system/MASTER.md` D-06 to record the amendment (new breakpoint + rationale + changelog bullet under §11).
4. Re-run Phase 12 UAT Test 2 (MobileMenu chat-widget inert focus-trap) at <768px to confirm WR-01 closure still holds after breakpoint move.
5. Route visual decisions through frontend-design skill per project convention.

## Context

- Phase 12 tech-debt sweep left breakpoint at 380px intact (only scope was adding `.chat-widget` to the inert set).
- Changing D-06 should land in v1.2 as its own phase or quick task, not inline during UAT.
- Consider re-verifying Lighthouse mobile scores after change (the v1.1 gate was Performance ≥99 / A11y ≥95 on homepage + /projects/seatwatch).
