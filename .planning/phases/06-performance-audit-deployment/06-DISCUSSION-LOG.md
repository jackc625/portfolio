# Phase 6: Performance Audit & Deployment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 06-performance-audit-deployment
**Areas discussed:** Canvas & GSAP performance budget, Image optimization scope, Accessibility audit depth, Pending requirements cleanup, Responsive testing approach, Font loading strategy, Build output verification

---

## Canvas & GSAP Performance Budget

### Q1: Performance vs visual quality tradeoff

| Option | Description | Selected |
|--------|-------------|----------|
| Scores win — cut what's needed | Lighthouse 90+ is the hard requirement. Reduce animations if needed. | |
| Visual quality wins — accept lower scores | Accept Lighthouse in the 80s to keep full animation experience. | |
| Optimize first, then decide | Try optimizations first. Only make the tradeoff if optimization alone can't hit 90+. | ✓ |

**User's choice:** Optimize first, then decide
**Notes:** None

### Q2: GSAP lazy-loading

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — lazy-load GSAP | Defer GSAP until after LCP. Animations kick in slightly later. | ✓ |
| No — keep current loading | GSAP loads with the page. Simpler but adds to initial bundle. | |
| You decide | Claude picks based on audit results. | |

**User's choice:** Yes — lazy-load GSAP
**Notes:** None

### Q3: Canvas hero on mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Reduce particles on mobile | Keep canvas but with fewer particles on smaller screens. | ✓ |
| Disable canvas on mobile | Replace with static gradient on mobile. | |
| Keep current behavior | Canvas already adjusts. Don't change unless audit flags it. | |
| You decide | Claude assesses and picks. | |

**User's choice:** Reduce particles on mobile
**Notes:** None

### Q4: JavaScript budget

| Option | Description | Selected |
|--------|-------------|----------|
| Lighthouse 90+ is the guardrail | No explicit KB limit. If scores pass, budget is fine. | ✓ |
| Set explicit JS budget | Define hard limit (e.g., <100KB total JS). | |
| You decide | Claude picks based on audit. | |

**User's choice:** Lighthouse 90+ is the guardrail
**Notes:** None

### Q5: Reduced motion behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Completely disabled | All GSAP and canvas fully off. Content shows statically. | ✓ |
| Simplified to fades only | Replace animations with opacity fades. Canvas shows static particles. | |
| Keep current behavior | Check and fix as needed. | |

**User's choice:** Completely disabled
**Notes:** None

---

## Image Optimization Scope

### Q1: Image optimization goal

| Option | Description | Selected |
|--------|-------------|----------|
| Infrastructure only | Ensure components configured for WebP/AVIF, srcset, lazy loading. No real images to add. | ✓ |
| Add real screenshots now | Source actual screenshots before deployment. | |
| Optimize existing assets only | Focus on og-default.png, favicons, resume.pdf. | |

**User's choice:** Infrastructure only
**Notes:** None

### Q2: OG image

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current og-default.png | Use what's there. Improve later. | ✓ |
| Generate a polished OG image | Create 1200x630 social preview with branding. | |
| You decide | Claude checks and decides. | |

**User's choice:** Keep current og-default.png
**Notes:** None

---

## Accessibility Audit Depth

### Q1: Audit depth

| Option | Description | Selected |
|--------|-------------|----------|
| Lighthouse 90+ is sufficient | Run Lighthouse, fix below 90. Good enough for v1. | ✓ |
| Lighthouse + axe-core | Both tools for more thorough automated coverage. | |
| Full manual audit | Lighthouse + axe-core + keyboard + screen reader. | |
| You decide | Claude picks based on initial audit. | |

**User's choice:** Lighthouse 90+ is sufficient
**Notes:** None

### Q2: Theme contrast verification

| Option | Description | Selected |
|--------|-------------|----------|
| Verify both themes | Run Lighthouse in both dark and light mode for AA compliance. | ✓ |
| Trust Phase 5 implementation | Skip unless Lighthouse flags something. | |
| You decide | Claude checks if Lighthouse covers both. | |

**User's choice:** Verify both themes
**Notes:** None

---

## Pending Requirements Cleanup

### Q1: Verify and close pending Phase 2 requirements

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — verify and close them | Audit all 5, fix gaps, mark complete. Clean slate. | ✓ |
| Close only what Lighthouse catches | Don't specifically target. Fix if flagged. | |
| Leave for separate pass | Phase 6 focuses only on PERF-01 through PERF-05. | |

**User's choice:** Yes — verify and close them
**Notes:** None

### Q2: Final deploy verification

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — full deploy verification | Push, confirm CI/CD, verify live site on HTTPS, spot-check. | ✓ |
| Just push and trust CI/CD | Push and consider it deployed. | |
| You decide | Claude picks based on state. | |

**User's choice:** Yes — full deploy verification
**Notes:** None

---

## Responsive Testing Approach

### Q1: Responsive verification method

| Option | Description | Selected |
|--------|-------------|----------|
| Lighthouse mobile + specific breakpoints | Lighthouse mobile + verify at 375px, 768px, 1440px. | ✓ |
| Lighthouse mobile only | Lighthouse mobile audit only. | |
| You decide | Claude picks approach. | |

**User's choice:** Lighthouse mobile + specific breakpoints
**Notes:** None

---

## Font Loading Strategy

### Q1: Font loading audit and strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Audit and use font-display: swap | Verify self-hosting, no CDN requests, font-display: swap. | ✓ |
| Audit and use font-display: optional | More aggressive — fallback stays if fonts not cached. Zero CLS. | |
| Trust Astro Fonts API defaults | Don't override unless Lighthouse flags. | |

**User's choice:** Audit and use font-display: swap
**Notes:** None

---

## Build Output Verification

### Q1: Inspect production build

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — inspect dist/ output | Check JS shipped, verify zero-JS pages, confirm GSAP scope, check sizes. | ✓ |
| Skip — trust the framework | If Lighthouse passes, build is fine. | |
| You decide | Claude runs build and checks. | |

**User's choice:** Yes — inspect dist/ output
**Notes:** None

---

## Claude's Discretion

- Specific Lighthouse optimization techniques beyond decided areas
- Exact mobile particle count reduction
- GSAP lazy-loading implementation approach
- Order of audit passes
- Fix priority when multiple issues found
- Font fallback sizing details

## Deferred Ideas

None — discussion stayed within phase scope
