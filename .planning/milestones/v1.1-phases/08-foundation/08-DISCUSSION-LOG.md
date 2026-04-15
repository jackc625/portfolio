# Phase 8: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 08-foundation
**Areas discussed:** Token migration strategy, Broken-page + chrome survival, Chat widget treatment, MASTER.md authoring approach, Motion kill scope, Font loading, Resume PDF handling, Execution ordering, Chat token orphan mapping, portfolio-context.json audit, Verification gate

---

## Gray Area Selection (multiSelect)

| Option | Description | Selected |
|--------|-------------|----------|
| Token migration strategy | Keep --token-* names vs rebrand to mockup names vs hybrid | ✓ |
| Broken-page + chrome survival | What renders during Phase 8→10 gap + Header/MobileMenu fate | ✓ |
| Chat widget treatment | Token-pinned vs minimal touch-up vs pre-restyle | ✓ |
| MASTER.md authoring approach | Depth, location, mutability, component spec ownership | ✓ |

**User's choice:** All four areas selected.

---

## Area 1: Token Migration Strategy

### Token names

| Option | Description | Selected |
|--------|-------------|----------|
| Rebrand to mockup names | Replace --token-* with --bg, --ink, --ink-muted, --ink-faint, --rule, --accent (Recommended) | ✓ |
| Keep --token-* names | Leave names in place, only change values to hex | |
| Hybrid | Rename color tokens but leave --token-space-* / --token-text-* alone | |

**User's choice:** Rebrand to mockup names. Clean break, single naming system.

### Token scope

| Option | Description | Selected |
|--------|-------------|----------|
| Colors only | Phase 8 success criteria #2 only mentions colors (Recommended) | |
| Flatten everything | Colors + spacing + typography tokens all replaced in Phase 8 | ✓ |

**User's choice:** Flatten everything. More thorough sweep now, no Phase 9 cleanup needed.

### Token home

| Option | Description | Selected |
|--------|-------------|----------|
| :root in global.css + Tailwind @theme bridge | Two-layer pattern, matches v1.0 architecture (Recommended) | ✓ |
| Tailwind v4 @theme only | Single layer, native Tailwind v4 | |
| Raw hex literals everywhere | No CSS vars at all | |

**User's choice:** :root + @theme bridge. Keeps v1.0 architecture pattern.

### Theme cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Delete all of it in Phase 8 | CSS, inline script, .theme-transitioning all deleted (Recommended) | ✓ |
| Delete CSS but leave script harmless | Leave FOUC script as no-op | |
| Delete everything except localStorage cleanup | Ship one-time localStorage.removeItem shim | |

**User's choice:** Delete all of it. Full dark mode exorcism.

---

## Area 2: Broken-Page + Chrome Survival

### Page stub strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Bare 'redesign in progress' placeholder | 10-line stubs per page (Recommended) | ✓ |
| Inline raw HTML port of v1.0 content | Ugly but content-preserving | |
| Skip pages entirely — delete them | Maximum scorched earth | |
| Keep v1.0 pages, cherry-pick deletions | Contradicts success criteria | |

**User's choice:** Bare placeholder stubs.

### Header

| Option | Description | Selected |
|--------|-------------|----------|
| Strip ThemeToggle + /resume nav, leave the rest | Minimum surgery, Phase 9 rewrites (Recommended) | ✓ |
| Replace with bare wordmark stub | 10-line stub | |
| Delete Header.astro entirely | Unwire from BaseLayout | |

**User's choice:** Strip ThemeToggle + /resume, leave the rest.

### MobileMenu

| Option | Description | Selected |
|--------|-------------|----------|
| Leave fully wired and functional | Phase 9 decides its fate on a blank slate (Recommended) | ✓ |
| Unwire from BaseLayout but keep the file | | |
| Delete MobileMenu.astro outright | | |

**User's choice:** Leave fully wired.

### Deploy posture

| Option | Description | Selected |
|--------|-------------|----------|
| Freeze production on v1.0 | feat/ui-redesign branch isolation (Recommended) | ✓ |
| Deploy stubs to production after every phase | | |
| Ship to a preview URL only | | |

**User's choice:** Freeze production on v1.0 until Phase 10 parity.

---

## Area 3: Chat Widget Treatment

### Visual treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Token-pinned, no visual changes | Phase 10 owns full restyle (Recommended) | ✓ |
| Minimal cosmetic touch-up | Halfway house | |
| Pre-restyle in Phase 8 | Absorb CHAT-02 early | |

**User's choice:** Token-pinned. Defends Phase 7 regression gate.

### Chat token references

| Option | Description | Selected |
|--------|-------------|----------|
| Refactor chat to use new mockup token names | One naming system (Recommended) | ✓ |
| Keep --token-* aliases for chat only | Compatibility shim | |
| Inline hex literals in chat | | |

**User's choice:** Refactor chat to mockup names.

### Geist Mono rendering inside chat

| Option | Description | Selected |
|--------|-------------|----------|
| Verify in Phase 8 as part of build gate | 30-second manual check (Recommended) | ✓ |
| Defer to Phase 10 | | |

**User's choice:** Verify in Phase 8.

---

## Area 4: MASTER.md Authoring Approach

### Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Comprehensive contract | ~6-10 pages, all sections, worked examples (Recommended) | ✓ |
| Minimal lock-doc | ~2 pages | |
| Skeleton now, fill as Phase 9 goes | | |

**User's choice:** Comprehensive contract.

### Location

| Option | Description | Selected |
|--------|-------------|----------|
| design-system/MASTER.md (repo root) | Portfolio asset, visible to recruiters (Recommended) | ✓ |
| docs/design-system/MASTER.md | | |
| .planning/design-system/MASTER.md | | |

**User's choice:** design-system/MASTER.md at repo root.

### Mutability

| Option | Description | Selected |
|--------|-------------|----------|
| Locked at Phase 8 sign-off | Maximum spec discipline (Recommended) | ✓ |
| Editable through Phase 9 | | |
| Living document | | |

**User's choice:** Locked at Phase 8 sign-off.

### Component specs

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 8 writes the component specs | Spec-first discipline (Recommended) | ✓ |
| Phase 8 lists, Phase 9 specs | | |
| Phase 9 back-fills after building | | |

**User's choice:** Phase 8 writes the component specs up front.

---

## Additional Gray Areas (second round)

### Motion kill line

| Option | Description | Selected |
|--------|-------------|----------|
| Strict — color/border/text-decoration only | Matches mockup.html's monk-mode posture (Recommended) | |
| Pragmatic — no GSAP/scroll/view-transitions, but allow Tailwind state transitions | Keeps existing polish | ✓ |
| Surgical — kill only specifically named animations | | |

**User's choice:** Pragmatic. Explicit override of the recommendation.
**Notes:** Surviving motion: Tailwind `transition-colors`, `hover:bg-*`, Footer `hover:-translate-y-0.5`, Header nav-link transitions, chat `.chat-copy-btn` opacity transition, `.nav-link-hover` underline animation. MASTER.md's motion section must document this explicitly so Phase 9 doesn't strip them out.

### Font loading

| Option | Description | Selected |
|--------|-------------|----------|
| Google provider — same pattern as v1.0 | Swap Inter→Geist, IBM Plex Mono→Geist Mono; rebrand CSS vars to --font-display/--font-body/--font-mono (Recommended) | ✓ |
| Fontsource provider | | |
| Vercel @vercel/geist package | | |

**User's choice:** Google provider. CSS var rename is part of the recommended option's package (--font-heading/--font-sans/--font-code → --font-display/--font-body/--font-mono).

### Resume PDF

| Option | Description | Selected |
|--------|-------------|----------|
| Ship placeholder PDF in Phase 8 | Copy existing resume.pdf to jack-cutrara-resume.pdf (Recommended) | |
| Phase 8 only kills /resume, PDF ships in Phase 10 | | |
| Phase 8 also renames public/resume.pdf to public/jack-cutrara-resume.pdf | Real résumé becomes canonical | ✓ |

**User's choice:** Rename in place. Caveat noted — contradicts CONTACT-02's "placeholder PDF" wording; reconcile with REQUIREMENTS.md when Phase 10 plans CONTACT-02.

### Execution ordering

| Option | Description | Selected |
|--------|-------------|----------|
| MASTER.md → tokens/fonts → kill motion+dark → delete components+routes → verify | Build stays compilable throughout (Recommended) | ✓ |
| MASTER.md → delete everything first → rebuild foundation → verify | Scorched earth | |
| MASTER.md → parallel waves | | |

**User's choice:** Sequential ordering with build-stability priority.

---

## Additional Gray Areas (third round)

### Chat token orphan mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Map to closest mockup token | --token-bg-secondary → --rule, --token-accent-hover → --accent, --token-border-hover → --ink-muted, --token-success → --accent/--ink (Recommended) | ✓ |
| Add chat-specific extension tokens | --chat-surface, --chat-success, etc. | |
| Defer mapping to Phase 10 | | |

**User's choice:** Map to closest mockup token. Six-token rule preserved.

### portfolio-context.json cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Remove GSAP, leave list unchanged otherwise | Minimum touch (Recommended) | |
| Remove GSAP, add 'Geist + Geist Mono' | | |
| Audit the whole portfolio-context.json | Update every v1.0 design reference | ✓ |

**User's choice:** Full audit. Chat should tell visitors about the new site, not the old one.

### Verification gate

| Option | Description | Selected |
|--------|-------------|----------|
| Build + lint + typecheck + manual chat smoke test | Chat is the regression fingerprint (Recommended) | |
| Build + lint + typecheck only | | |
| Build + automated test suite (vitest) | | |
| All four — build + lint + typecheck + tests + manual chat | Maximum verification | ✓ |

**User's choice:** All four. Highest confidence bar.

---

## Claude's Discretion

- Exact wording and formatting style of MASTER.md
- Specific Tailwind v4 `@theme` syntax for the rebrand
- Exact ASCII/HTML sketch fidelity for Phase 9 primitive specs in MASTER.md
- Stub-page placeholder text wording
- Whether `gsap` removal uses `npm uninstall` or manual `package.json` edit
- Whether `prefers-reduced-motion` media queries are kept as no-op stubs or deleted

## Deferred Ideas

- Chat widget visual restyle → Phase 10 (CHAT-02)
- MobileMenu keep-or-delete → Phase 9 (success criterion #4)
- Header.astro full rewrite → Phase 9 (success criterion #1)
- Page rewrites → Phase 10
- mockup.html deletion → Phase 11 (polish)
- REQUIREMENTS.md reconciliation for CONTACT-02 "placeholder PDF" wording → Phase 10 planning
- CLAUDE.md §Technology Stack milestone-end update → milestone v1.1 completion
