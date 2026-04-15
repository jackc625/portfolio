# Phase 10: Page Port - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `10-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 10-page-port
**Areas discussed:** Work list + content map, Project detail layout, Chat widget (CHAT-01 + CHAT-02), Real content & contact policy

---

## Work list + content map

### Composition pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Inline `map()` in each page (Recommended) | `index.astro` and `projects.astro` each write their own `getCollection('projects')` + `.map()` loop. Two call sites, no wrapper. | ✓ |
| Shared `WorkList.astro` composite | New composite wrapping `SectionHeader`+`.work-list`+map. DRYer, more drift surface. | |
| You decide | Let Claude pick at planning time. | |

**User's choice:** Inline `map()` in each page

### Homepage vs `/projects` content

| Option | Description | Selected |
|--------|-------------|----------|
| All 6 on both pages | Identical lists. Simplest, no 'see all' affordance. | |
| Homepage=featured (3), /projects=all 6 (Recommended) | 3 featured projects (SeatWatch/NFL Prediction/SolSniper) numbered 01–03 with `3 / 6` count on homepage; all 6 numbered 01–06 on /projects. | ✓ |
| Homepage=top 4 by order, /projects=all 6 | First 4 by `order` ascending, ignoring `featured`. | |

**User's choice:** Homepage=featured (3), /projects=all 6

### Year column resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Add `year` to schema & backfill all 6 (Recommended) | Required field `year: z.string().regex(/^\d{4}$/)`, Jack supplies values per project at backfill task. | ✓ |
| Drop the year column entirely | Edit WorkRow to remove year slot; requires MASTER §5.5 amendment. | |
| Show status instead of year | Reuse `status` field — flat signal since all 6 are 'completed'. | |

**User's choice:** Add `year` to schema & backfill all 6

### Numbering format

| Option | Description | Selected |
|--------|-------------|----------|
| Zero-padded 01–06 (Recommended) | Matches mockup.html §390–433 with `.tabular`. | ✓ |
| Plain 1–6 | No leading zero; breaks tabular alignment past row 9. | |

**User's choice:** Zero-padded 01–06

---

## Project detail layout

### Mono metadata header contents

| Option | Description | Selected |
|--------|-------------|----------|
| Year · uppercase techStack · status (Recommended) | Single label-mono line with all three. | |
| `§ CASE STUDY — YEAR` label only | Minimal header; stack moves into body. | |
| Year + techStack, drop status | `2025 · NEXT.JS · TYPESCRIPT · ...`. Status implicit (all completed). | ✓ |

**User's choice:** Year + techStack, drop status
**Notes:** Status is implicit since all 6 projects are `completed`.

### Title typography role

| Option | Description | Selected |
|--------|-------------|----------|
| .h1-section (Recommended) | Geist 600, clamp(2.5rem, 5vw, 3.5rem). Distinct from .display (homepage only). | ✓ |
| .display | Massive clamp(4–8rem); risks stealing the homepage's exclusive treatment. | |
| .h2-project | Same as work-row title; hierarchy collapse. | |

**User's choice:** .h1-section

### MDX body rendering strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Keep h2s, style inside .body column (Recommended) | Render MDX as-is in `.body`; scoped styles transform `h2` to mono labels. | ✓ |
| Strip h2s, flat prose | Hide h2 sections; loses scannability. Requires MDX rewrite. | |
| Wrap each section in SectionHeader primitive | Heavy rhythm; reads like document outline. Over-committed. | |

**User's choice:** Keep h2s, style inside .body column

### Tagline rendering

| Option | Description | Selected |
|--------|-------------|----------|
| As `.lead` line under the title (Recommended) | `.lead` role class; description ignored on detail page. | ✓ |
| Drop tagline, use description in `.lead` | Longer paragraph as lead; reads like blog post intro. | |
| Drop both; title stands alone | Severe minimalism; loses elevator pitch hook. | |

**User's choice:** As `.lead` line under the title

### MDX section header style

| Option | Description | Selected |
|--------|-------------|----------|
| `§ PROBLEM` unnumbered mono label (Recommended) | Scoped `h2 { .label-mono }` + `::before { content: "§ "; }`. | ✓ |
| `§ 01 — PROBLEM` numbered | Body sections numbered 01–05; clashes with top-level numbering. | |
| Plain sans h2, no mono prefix | Drops editorial mono-label grammar. | |

**User's choice:** `§ PROBLEM` unnumbered mono label

### Next project ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Next by `order` ascending, wrap at end (Recommended) | Deterministic; uses existing schema; wrap closes the loop. | ✓ |
| Next by file-sort order | Alphabetical; arbitrary; exposes filename leakage. | |
| Explicit `nextProject` frontmatter field | Most maintenance burden; not needed when `order` exists. | |

**User's choice:** Next by `order` ascending, wrap at end

### External links rendering (githubUrl, demoUrl)

| Option | Description | Selected |
|--------|-------------|----------|
| Inline mono link row under tagline (Recommended) | `GITHUB →` / `LIVE DEMO →` mono links; missing skipped. | ✓ |
| Inside the meta header line | Append to top mono line; risks line overflow. | |
| Drop them, don't render | Costs recruiter click path. | |

**User's choice:** Inline mono link row under tagline

### ArticleImage wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Wire via MDX components map (Recommended) | Add `components={{ img: ArticleImage }}` to `<Content />`. Zero-cost when unused. | ✓ |
| Wire AND add one image to each project mdx | Scope creep — sourcing 6 screenshots is its own task. | |
| Leave dormant (don't wire) | SC#4 'optional inline images' stays unchecked. | |

**User's choice:** Wire via MDX components map

### Code block styling

| Option | Description | Selected |
|--------|-------------|----------|
| Astro default Shiki + minimal box (Recommended) | Build-time Shiki; scoped `.body pre` with `var(--bg)`, 1px rule, no shadow. | ✓ |
| No Shiki, mono-only flat text | Loses syntax color entirely. | |
| Drop code block styling, accept Shiki defaults | Risks tinted theme contradicting editorial system. | |

**User's choice:** Astro default Shiki + minimal box

### `description` field usage

| Option | Description | Selected |
|--------|-------------|----------|
| SEO/OG only — not rendered on page (Recommended) | Goes to `<BaseLayout description={...}>`. Tagline owns the lead slot. | ✓ |
| Render as second lead below tagline | Visually duplicates case-study intent. | |
| Replace tagline with description in `.lead` | Reverses prior decision. | |

**User's choice:** SEO/OG only — not rendered on page

---

## Chat widget (CHAT-01 + CHAT-02)

### Chrome grammar (bubble + panel)

| Option | Description | Selected |
|--------|-------------|----------|
| Flat rectangle, accent bubble stays round (Recommended) | Bubble keeps 48px round shape; panel becomes flat rectangle (no radius, no shadow, 1px rule). | ✓ |
| Flat rectangle bubble + flat rectangle panel | Total editorial purity; loses bubble beacon. | |
| Keep some roundness (12px radius) | Soften corners; not strictly compliant with 'no cards'. | |

**User's choice:** Flat rectangle, accent bubble stays round

### Secondary surfaces (chips, textarea, send button)

| Option | Description | Selected |
|--------|-------------|----------|
| Mono labels + flat rule borders (Recommended) | Chips become mono labels in 1px rule rectangles; textarea flat; send button square. | ✓ |
| Keep chips as pills, restyle only bg | Pills read as cards; inconsistent with chrome. | |
| Drop starter chips entirely | Removes a proven engagement hook. | |

**User's choice:** Mono labels + flat rule borders

### Chat motion

| Option | Description | Selected |
|--------|-------------|----------|
| All dead — static `...` typing (Recommended) | Honors MASTER §6.1 strictly; no animation anywhere. | |
| Restore typing dot bounce only | Scoped `@keyframes` indicator; bubble/panel stay dead. Requires narrow MASTER §6 amendment. | ✓ |
| Restore all three (bubble pulse + panel scale + dot bounce) | Substantial MASTER §6 amendment; contradicts editorial restraint. | |

**User's choice:** Restore typing dot bounce only
**Notes:** Requires narrow MASTER §6.1 carve-out for "state indicators may animate".

### Cross-page persistence (CHAT-01)

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage, last 50 msgs, 24h TTL (Recommended) | `chat-history` key; replays through DOMPurify; survives navigation. | ✓ |
| sessionStorage, no limit, no TTL | Wiped on tab close; loses recruiter loop-back use case. | |
| Accept the regression, no persistence | Pushes deferral to v1.2+; not recommended. | |

**User's choice:** localStorage, last 50 msgs, 24h TTL

### MASTER amendment scope

| Option | Description | Selected |
|--------|-------------|----------|
| Narrow carve-out: 'state indicators' (Recommended) | Single bullet on §6.1 plus round-bubble exception in §9/§10. | ✓ |
| Broad amendment: 'pragmatic motion' line moves | Opens door for future creep. | |
| Don't amend MASTER, ship static dots | Reverses prior motion answer. | |

**User's choice:** Narrow carve-out: 'state indicators'

### Copy button rendering

| Option | Description | Selected |
|--------|-------------|----------|
| Mono `COPY` label, opacity hover-reveal (Recommended) | Replaces SVG icon; flashes `COPIED` in accent for 1s on click. | ✓ |
| Keep SVG clipboard icon, restyle color | Inconsistent with no-icons stance. | |
| Drop copy button entirely | Loses recruiter-grab convenience. | |

**User's choice:** Mono `COPY` label, opacity hover-reveal

### Mobile full-screen overlay

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen flat rectangle, no chrome (Recommended) | Inherits new flat-rectangle grammar; same media query, same code path. | ✓ |
| Mobile slides in from bottom 80% | iOS modal grammar; not editorial. | |
| Keep mobile exactly as Phase 7 shipped | Risks rule collision with new flat styles. | |

**User's choice:** Full-screen flat rectangle, no chrome

### Bot message markdown styling

| Option | Description | Selected |
|--------|-------------|----------|
| Strip backgrounds, keep accent links (Recommended) | Drop inline `code` background; fenced blocks match case-study Shiki box. | ✓ |
| Disable Shiki in chat, use plain mono | Inconsistent with case-study body. | |
| Drop all bot markdown styling, render flat | Loses Phase 7 polish for no editorial gain. | |

**User's choice:** Strip backgrounds, keep accent links

---

## Real content & contact policy

### Contact info source of truth

| Option | Description | Selected |
|--------|-------------|----------|
| New `src/data/contact.ts` constants file (Recommended) | TypeScript constants; type-safe; one place to update. | ✓ |
| Reuse `portfolio-context.json` directly | Couples site display to chatbot training context. | |
| Hard-code in each render site | Worst maintenance. | |

**User's choice:** New `src/data/contact.ts` constants file

### X/Twitter link

| Option | Description | Selected |
|--------|-------------|----------|
| Drop X from the link row (Recommended) | Render `GITHUB · LINKEDIN · RÉSUMÉ`; amend CONTACT-01. | ✓ |
| Add a placeholder X URL | Risks 404 or squatted handle. | |
| Keep X as greyed-out 'soon' | Visual debt for no benefit. | |

**User's choice:** Drop X from the link row

### Contact section reuse

| Option | Description | Selected |
|--------|-------------|----------|
| Shared `ContactSection.astro` composite (Recommended) | One source of truth; rendered by both homepage `§ 03` and `/contact`. | ✓ |
| Inline markup in both pages | Drift risk. | |
| Drop `§ 03 — CONTACT` from homepage | Reverses HOME-04. | |

**User's choice:** Shared `ContactSection.astro` composite

### About page copy

| Option | Description | Selected |
|--------|-------------|----------|
| Ship mockup text as-is for v1.1 (Recommended) | Covers SC#2; Jack edits in future content pass. | ✓ |
| Block Phase 10 until Jack writes final copy | Slows milestone. | |
| Mockup base + 1 personalization edit | Mid-friction compromise. | |

**User's choice:** Ship mockup text as-is for v1.1

### ContactChannel.astro deletion

| Option | Description | Selected |
|--------|-------------|----------|
| Delete in Phase 10 (Recommended) | Pairs with new `ContactSection.astro` creation. | ✓ |
| Defer deletion to Phase 11 | Adds polish-phase clutter. | |
| Keep as v1.0 archive | Dead-code clutter. | |

**User's choice:** Delete in Phase 10

### REQUIREMENTS.md amendment scope

| Option | Description | Selected |
|--------|-------------|----------|
| Amend CONTACT-01 + CONTACT-02 in one docs commit (Recommended) | Drop X + reconcile PDF wording in single head-of-phase commit. | ✓ |
| Amend only CONTACT-01 (X drop), defer CONTACT-02 | Carries wording-vs-reality gap longer. | |
| Don't amend, ship as-is | Bad. | |

**User's choice:** Amend CONTACT-01 + CONTACT-02 in one docs commit

### Homepage about preview content

| Option | Description | Selected |
|--------|-------------|----------|
| Intro line + first paragraph + `READ MORE →` (Recommended) | Two strings + link; gives elevator pitch + deeper-read affordance. | ✓ |
| Just the intro line + `READ MORE →` | Single sentence; weakest hook. | |
| All 3 paragraphs + no link | Defeats point of separate /about. | |

**User's choice:** Intro line + first paragraph + `READ MORE →`

### MobileMenu/Footer social rows after X drop

| Option | Description | Selected |
|--------|-------------|----------|
| Update both to `GITHUB · LINKEDIN · EMAIL` (Recommended) | Both primitives import `contact.ts`; render only non-null entries. | ✓ |
| Keep X in MobileMenu/Footer, drop only from contact section | Inconsistent across surfaces. | |
| Drop social rows entirely | Reverses Phase 9 D-07/D-10. | |

**User's choice:** Update both to `GITHUB · LINKEDIN · EMAIL`

---

## Claude's Discretion

Captured in CONTEXT.md `<decisions>` section. Ten items left to planner judgment:
- Exact `year` value Jack writes for each project
- Homepage hero `JACK<br>CUTRARA·` line break behavior
- `WORK` vs `WORKS` SectionHeader title
- Storage shape for shared about strings (D-27)
- MDX components map syntax variant
- `/contact` page section header copy
- Shiki theme name for minimal-light treatment
- `→` glyph vs entity in `READ MORE →`
- Typing dot keyframe transform property
- `ContactSection.astro` `header?: boolean` prop vs two inner components

## Deferred Ideas

Captured in CONTEXT.md `<deferred>` section. 14 items pushed forward (mostly to Phase 11 polish or future content passes).
