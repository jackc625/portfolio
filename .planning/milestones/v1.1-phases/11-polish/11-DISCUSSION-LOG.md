# Phase 11: Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 11-polish
**Areas discussed:** Audit artifacts, Deferred tech debt, Fix depth, Milestone closeout, Keyboard a11y scope, mockup.html parity sign-off, Chat widget regression test

---

## Audit Artifacts

### Lighthouse capture format

| Option | Description | Selected |
|--------|-------------|----------|
| Markdown checklist | Single markdown file with scores, pass/fail per requirement, notes | |
| Lighthouse JSON + markdown | CLI JSON reports + markdown summary | ✓ |
| Screenshots only | DevTools screenshots committed as images | |

**User's choice:** Lighthouse JSON + markdown
**Notes:** JSON for data, markdown for human-readable summary.

### Responsive QA documentation

| Option | Description | Selected |
|--------|-------------|----------|
| Markdown checklist | Table with breakpoints as columns, pages as rows | ✓ |
| Screenshots per breakpoint | Screenshots at each breakpoint per page | |
| You decide | Claude picks format | |

**User's choice:** Markdown checklist

### Contrast verification

| Option | Description | Selected |
|--------|-------------|----------|
| Contrast table in audit file | Table listing text/bg combos, hex, ratio, pass/fail | ✓ |
| External tool report | Online checker with linked results | |
| You decide | Claude picks approach | |

**User's choice:** Contrast table in audit file

### Pages for Lighthouse audit

| Option | Description | Selected |
|--------|-------------|----------|
| Homepage + 1 project detail | Matches SC#1 exactly | ✓ |
| All 5 pages | Every page gets full audit | |
| Homepage + project detail + about | Three most content-heavy pages | |

**User's choice:** Homepage + 1 project detail

---

## Deferred Tech Debt

### lightning-css warnings

| Option | Description | Selected |
|--------|-------------|----------|
| Fix — grep and scrub | Find and remove var(--token-*) literals | ✓ |
| Accept as-is | Document as known, leave warnings | |
| You decide | Claude determines if fix is trivial | |

**User's choice:** Fix — grep and scrub

### BaseLayout noindex pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Fix — add noindex prop | Optional prop to BaseLayout for robots meta | ✓ |
| Leave slot pattern | Triple-defense works, just less elegant | |
| Delete /dev/primitives instead | Noindex concern goes away with page deletion | |

**User's choice:** Fix — add noindex prop to BaseLayout

### Phase 9 TS hints

| Option | Description | Selected |
|--------|-------------|----------|
| Investigate and fix if trivial | Check and fix one-liners, skip architectural changes | ✓ |
| Skip entirely | Advisory notes, not blocking | |
| You decide | Claude triages based on findings | |

**User's choice:** Investigate and fix if trivial

---

## Fix Depth

### Lighthouse fix aggressiveness

| Option | Description | Selected |
|--------|-------------|----------|
| Hit the bar, move on | Target ≥90, stop. Diminishing returns past 90 | ✓ |
| Pursue 95+ | Near-perfect scores, more effort | |
| Fix only blockers | Only fix issues that drop below 90 | |

**User's choice:** Hit the bar, move on

### Responsive issue fix depth

| Option | Description | Selected |
|--------|-------------|----------|
| Fix all visible issues | If it looks broken or janky, fix it | ✓ |
| Fix only horizontal scroll + broken layouts | Strict SC interpretation only | |
| You decide | Claude uses judgment on recruiter impact | |

**User's choice:** Fix all visible issues

---

## Keyboard A11y Scope

### Tab-through coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Every page, full tab order | All 5 pages + chat widget, document every element | ✓ |
| Representative pages only | Homepage + 1 project detail + chat | |
| You decide | Claude determines minimum coverage | |

**User's choice:** Every page, full tab order

### Focus ring styling

| Option | Description | Selected |
|--------|-------------|----------|
| Match editorial system | Use --ink or --accent tokens, restyle if needed | ✓ |
| Default browser outline | Functional, zero work | |
| You decide | Claude evaluates against editorial palette | |

**User's choice:** Match editorial system

---

## mockup.html Parity Sign-off

| Option | Description | Selected |
|--------|-------------|----------|
| Trust Phase 10 + quick eyeball | Phase 10 already verified, sanity check during responsive QA | ✓ |
| Formal side-by-side comparison | Open mockup.html and live site side by side | |
| Just delete it | Phase 10 signed off, delete without re-verifying | |

**User's choice:** Trust Phase 10 + quick eyeball

---

## Chat Widget Regression Test

| Option | Description | Selected |
|--------|-------------|----------|
| Same as Phase 9/10 gate | Open, send, verify streaming, focus trap, copy, persistence | ✓ |
| Extended test | Phase 9/10 gate + rate limit, markdown, mobile overlay, TTL | |
| You decide | Claude determines depth based on changes | |

**User's choice:** Same as Phase 9/10 gate

---

## Claude's Discretion

- `prefers-reduced-motion` verification approach
- Lighthouse CLI flags and configuration
- Order of operations within the audit sweep
- Plan structure (separate vs combined plans)

## Deferred Ideas

None — discussion stayed within phase scope.
