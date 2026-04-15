# Phase 9: Primitives - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 09-primitives
**Areas discussed:** Mobile nav resolution, CSS class architecture, Folder layout + isolation preview, Kept-component audit scope

---

## Mobile nav resolution

### Q1 — What's the call on the mobile nav?

| Option | Description | Selected |
|--------|-------------|----------|
| Delete MobileMenu entirely (Recommended) | Drop MobileMenu.astro + hamburger. 3 inline mono links at every breakpoint. | |
| Rebuild as editorial overlay | Rewrite MobileMenu.astro from scratch in editorial style with mono links, no SVG icons, no animated reveals. | |
| Hybrid: inline by default, overflow-only | Inline nav at mobile by default, hamburger fallback only if it overflows. | ✓ |

**User's choice:** Hybrid: inline by default, overflow-only
**Notes:** The hamburger becomes a conditional fallback driven by container width, not a default.

### Q2 — If we delete MobileMenu, where do GitHub/LinkedIn/email go on mobile?

| Option | Description | Selected |
|--------|-------------|----------|
| Only in the contact section (Recommended) | Per HOME-04 / CONTACT-01, social links live only in the contact section. | |
| Contact section + footer (mobile-only) | Add a small inline mono link list in the footer at <768px. | ✓ |
| Contact section only + mobile header shortcut | Contact link in header always reachable at mobile. | |

**User's choice:** Contact section + footer (mobile-only)
**Notes:** Mobile users without the contact section in view still have social links one scroll away.

### Q3 — How should the 'overflow' fallback for the hamburger be detected?

| Option | Description | Selected |
|--------|-------------|----------|
| Pure-CSS breakpoint at 380px (Recommended) | Viewport media query below 380px. | |
| JS width measurement | Runtime measurement + resize handler. | |
| Container query at component level | CSS container query on Header inner. | ✓ |
| Smallest-breakpoint hamburger at 320px | Only fall back below 320px viewport. | |

**User's choice:** Container query at component level
**Notes:** Component-level responsive design — Header reacts to its own rendered width, not the viewport.

### Q4 — What does the mobile-only footer social row look like?

| Option | Description | Selected |
|--------|-------------|----------|
| Mono text links, full row replacement (Recommended) | 3-row stack at <768px: copy / social / built-with. Pure mono text, no SVGs. | ✓ |
| Mono text links, replace built-with caption | Swap built-with for social at mobile; stay single-row. | |
| Keep SVG icons from current Footer | Reuse v1.0 SVG icons at mobile-only. | |

**User's choice:** Mono text links, full row replacement (Recommended)
**Notes:** Extends MASTER §5.2 "flex-column stack" latitude by inserting a social row in the middle.

### Q5 — What does the hamburger trigger reveal?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline expansion below header (Recommended) | Static expand/collapse inside the sticky header. No separate primitive. | |
| Rebuilt fullscreen overlay primitive | New editorial MobileMenu.astro primitive — 8th primitive. Amend MASTER §5. | ✓ |
| Dropdown panel anchored to header | Mid-weight absolute-positioned panel. | |

**User's choice:** Rebuilt fullscreen overlay primitive
**Notes:** Library goes from 7 → 8 primitives. MASTER §5.8 amendment required.

### Q6 — Container-query threshold?

| Option | Description | Selected |
|--------|-------------|----------|
| 380px container width (Recommended) | Below 380px of Header inner width → hamburger. Standard mobile (~327px inner) sees hamburger. | ✓ |
| 320px container width | Hamburger only below 320px inner. Inline nav at all modern phones. | |
| Claude's discretion at implementation time | Planner picks after measuring rendered widths. | |

**User's choice:** 380px container width (Recommended)
**Notes:** User picked knowing that standard 375px viewport phones will see the hamburger. Accepts that wordmark + 3 mono links cramps at ~330px.

### Q7 — What's inside the rebuilt MobileMenu overlay?

| Option | Description | Selected |
|--------|-------------|----------|
| 3 nav links only (Recommended) | Pure nav, no contact duplication. | |
| 3 nav links + small mono social row at bottom | Nav + duplicate social row so contact is one tap away. | ✓ |
| 3 nav links + display wordmark | Adds visual anchor with wordmark at top-left of overlay. | |

**User's choice:** 3 nav links + small mono social row at bottom
**Notes:** Duplicates the mobile footer social row on purpose; users shouldn't have to close the menu to reach contact.

### Q8 — Focus + close behavior?

| Option | Description | Selected |
|--------|-------------|----------|
| Full a11y treatment (Recommended) | Focus trap, Escape, click-outside, close button, body scroll lock, focus return. | ✓ |
| Minimal: Escape + close button only | Lighter (~20 lines) but loses standard overlay UX. | |
| No animation, but full a11y | Same as full + explicit drop of staggered link reveal. | |

**User's choice:** Full a11y treatment (Recommended)
**Notes:** Option 1 didn't address the staggered link reveal, which surfaced as a conflict with MASTER §6.1. Resolved in Q9.

### Q9 — Does the new MobileMenu keep the staggered link reveal animation?

| Option | Description | Selected |
|--------|-------------|----------|
| Drop it — overlay opens instantly (Recommended) | Per MASTER §6.1 orchestrated entrance animations are dead. | ✓ |
| Keep the cascade | Requires amending MASTER §6.2 to add an exception. | |

**User's choice:** Drop it — overlay opens instantly (Recommended)
**Notes:** No MASTER §6 deviation needed. The cascade dies with the old MobileMenu file.

---

## CSS class architecture

### Q10 — Where do the editorial CSS classes live?

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid: typography globals + scoped layout (Recommended) | Typography roles + shared structurals in global.css; component-local layout in scoped `<style>` blocks. | ✓ |
| All globals in global.css | Every class in global.css verbatim from mockup. | |
| All scoped per-primitive | Every class scoped inside its primitive. Typography gets duplicated. | |
| Pure Tailwind utilities | No named classes; translate to raw Tailwind. Breaks MASTER §3.1 role-class spec. | |

**User's choice:** Hybrid: typography globals + scoped layout (Recommended)
**Notes:** Typography is shared across every primitive + Phase 10 page. Layout is component-local.

### Q11 — Inside primitive markup, do you mix editorial classes with raw Tailwind utilities?

| Option | Description | Selected |
|--------|-------------|----------|
| Editorial classes only (Recommended) | Primitives use only editorial named classes + class:list for variants. No Tailwind utilities. | ✓ |
| Mix freely | Editorial classes + Tailwind utilities for fine-tuning. | |
| Editorial classes + Tailwind only for token utilities | Editorial for layout/role, Tailwind only for tokens (text-ink, etc.). | |

**User's choice:** Editorial classes only (Recommended)
**Notes:** Primitive markup reads verbatim against mockup.html. Phase 10 consumers may still use Tailwind utilities outside primitives.

### Q12 — What happens to the font-display / font-body / font-mono Tailwind utilities in @theme?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep them (Recommended) | Already consumed by chat widget + kept components. | ✓ |
| Keep + add text-display / text-h1-section / etc. | Also add Tailwind text-role utilities. | |
| Drop them | Remove + update chat + kept components. | |

**User's choice:** Keep them (Recommended)
**Notes:** Backward compat with chat and kept components. No new Tailwind text-role utilities added.

---

## Folder layout + isolation preview

### Q13 — Where do the new primitive .astro files live?

| Option | Description | Selected |
|--------|-------------|----------|
| Subfolder src/components/primitives/ (Recommended) | 8 primitives in new subfolder. Kept components stay flat in src/components/. | ✓ |
| Flat in src/components/ | All primitives + kept components flat. Overwrite existing files in place. | |
| Subfolder src/components/editorial/ | Same as primitives/ but named 'editorial/'. | |

**User's choice:** Subfolder src/components/primitives/ (Recommended)
**Notes:** Clear visual separation — editorial library vs app-shell components.

### Q14 — How do we satisfy SC#3 'render correctly in isolation'?

| Option | Description | Selected |
|--------|-------------|----------|
| Temporary /dev/primitives preview route (Recommended) | Astro page imports every primitive, renders each with sample data. | ✓ |
| Inline in placeholder stub pages | Repurpose stub pages to render primitives. | |
| No isolation page — verify via Phase 10 page port | Manual code review + Phase 10 real use. | |
| Vitest snapshot tests per primitive | HTML snapshots per primitive. | |

**User's choice:** Temporary /dev/primitives preview route (Recommended)
**Notes:** Single-screen live catalog of the whole library.

### Q15 — What happens to the current src/components/Header.astro, Footer.astro, MobileMenu.astro?

| Option | Description | Selected |
|--------|-------------|----------|
| Swap BaseLayout to new primitives + delete old in Phase 9 (Recommended) | BaseLayout imports from primitives/; old files deleted same plan. | ✓ |
| Leave BaseLayout pointing at old chrome until Phase 10 | Phase 9 only adds new primitives; Phase 10 swaps imports. | |
| Swap BaseLayout but keep old files as backups | Rename old to .v1.astro. | |

**User's choice:** Swap BaseLayout to new primitives + delete old in Phase 9 (Recommended)
**Notes:** Front-loads integration risk. Stub pages immediately show editorial chrome.

### Q16 — Lifecycle of /dev/primitives preview page?

| Option | Description | Selected |
|--------|-------------|----------|
| Delete in Phase 11 cleanup with mockup.html (Recommended) | Survives Phase 9 → 10 → 11 as living catalog. | ✓ |
| Delete at end of Phase 9 | Throwaway, one phase lifetime. | |
| Keep permanently as design-system reference | Storybook-lite permanent fixture. | |

**User's choice:** Delete in Phase 11 cleanup with mockup.html (Recommended)
**Notes:** Lets Phase 10 compare canonical render against real-use render.

---

## Kept-component audit scope

### Q17 — How should NextProject.astro be treated in Phase 9?

| Option | Description | Selected |
|--------|-------------|----------|
| Restyle to a WorkRow-shaped 'NEXT →' row in Phase 9 (Recommended) | Drop bg-rule full-bleed section + translate-x arrow. Single editorial row. | ✓ |
| Verify tokens only, defer visual rewrite to Phase 10 | Phase 9 scope stays tight. | |
| Delete NextProject; inline pattern into Phase 10 rewrite | Phase 9 deletes; Phase 10 reimplements. | |

**User's choice:** Restyle to a WorkRow-shaped 'NEXT →' row in Phase 9 (Recommended)
**Notes:** Phase 9 owns the primitive grammar; NextProject fits that theme.

### Q18 — Are JsonLd, SkipToContent, ArticleImage truly verify-only?

| Option | Description | Selected |
|--------|-------------|----------|
| Verify-only — read each, confirm tokens, no edits unless broken (Recommended) | Each file probably needs zero edits. | ✓ |
| Token sweep + small consistency edits | Normalize to editorial conventions. | |
| Full review including a11y pass | Audit tokens AND a11y per file. | |

**User's choice:** Verify-only — read each, confirm tokens, no edits unless broken (Recommended)
**Notes:** All three already use current editorial tokens. Phase 11 owns the global a11y sweep.

---

## Claude's Discretion

- Exact pixel/em values for editorial role classes inside scoped styles (must match mockup §55–99 numbers, but whitespace/order is up to the planner)
- Whether Container.astro uses an `<Element>` dynamic-tag pattern or a single `<div>` + class:list composition
- The exact font size choice for mobile menu nav links (between .h2-project 1.75rem and .lead clamp)
- Whether the mobile-menu close button uses an SVG × icon or a mono × character
- Whether /dev/primitives uses an iframe trick or a scoped container-query wrapper to demo MobileMenu
- How NextProject's "NEXT" label is spelled (`§ NEXT —` vs `NEXT →` vs `§ NEXT — [title]`)
- Whether /dev/primitives gets its own minimal meta tags or inherits BaseLayout defaults with noindex
- Whether the container-query syntax uses anonymous `@container` or a named container
- Whether `.chat-*` class name audit surfaces accidental collisions with new editorial classes

## Deferred Ideas

- /dev/primitives preview page deletion — Phase 11 polish
- mockup.html deletion — Phase 11 polish
- Chat widget visual restyle (CHAT-02) — Phase 10
- Chat motion restoration via CSS @keyframes — Phase 10 CHAT-02
- Cross-page chat persistence regression — Phase 10 CHAT-02 (carried from Phase 8 D-29)
- Homepage/About/Contact layout transcription — Phase 10 page port
- REQUIREMENTS.md CHAT-01 reconciliation — Phase 10 (carried from Phase 8)
- REQUIREMENTS.md CONTACT-02 "placeholder PDF" wording — Phase 10 (carried from Phase 8)
- CLAUDE.md Technology Stack milestone-end update — End of v1.1 (carried from Phase 8)
- Phase 10 WorkRow data wiring (WorkList wrapper decision) — Phase 10's call
- Lighthouse / a11y / contrast / responsive QA of new primitives — Phase 11
