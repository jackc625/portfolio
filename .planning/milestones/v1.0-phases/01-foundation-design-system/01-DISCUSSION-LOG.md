# Phase 1: Foundation & Design System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 01-foundation-design-system
**Areas discussed:** Visual direction & brand feel, Typography personality, Project content schema, Deployment & domain setup

---

## Visual Direction & Brand Feel

### Aesthetic Direction

| Option | Description | Selected |
|--------|-------------|----------|
| Clean & minimal | Whitespace, restrained color, typography-driven. Think Linear, Stripe docs. | (initial pick) |
| Bold & striking | Strong colors, dramatic contrasts, attention-grabbing heroes. Think Vercel, Railway. | |
| Warm & approachable | Soft colors, rounded elements, friendly typography. Think Notion, Cal.com. | |
| Dark & technical | Dark-first, code-inspired, terminal aesthetics. Think GitHub, Warp. | |

**User's choice:** Clean & minimal (initial selection)
**Notes:** After analyzing 6 reference sites, a pattern mismatch was identified — references lean dark editorial, not bright/white minimal.

### Refined Direction (after reference analysis)

| Option | Description | Selected |
|--------|-------------|----------|
| Dark editorial minimal | Dark backgrounds, elegant typography, restrained accents, generous whitespace. | |
| Light clean minimal | White/light backgrounds, neutral tones. More Stripe/Linear. | |
| Both via dark mode | Dark editorial PRIMARY, clean light mode as alternate. Best of both worlds. | ✓ |

**User's choice:** Both via dark mode
**Notes:** Dark editorial minimal as primary experience, light mode as alternate for Phase 5's dark/light toggle.

### Brand Colors

| Option | Description | Selected |
|--------|-------------|----------|
| You decide | Let frontend-design skill select palette from scratch. | ✓ |
| Blue-based accents | Accent color family in the blue range. | |
| I have specific colors | Existing logo, brand colors, or hex values. | |

**User's choice:** You decide
**Notes:** No existing brand assets. Frontend-design skill has full creative freedom within the dark editorial direction.

### Whitespace Density

| Option | Description | Selected |
|--------|-------------|----------|
| Spacious | Generous padding/margins, content breathes, premium feel. | ✓ |
| Balanced | Moderate spacing, clean without excessive scrolling. | |
| Compact | Dense layout, more content visible, less scrolling. | |

**User's choice:** Spacious

### Visual Inspiration

| Option | Description | Selected |
|--------|-------------|----------|
| No specific references | Trust the frontend-design skill. | |
| I have examples | 1-3 portfolio or product sites as references. | ✓ |

**User's choice:** I have examples
**Notes:** Provided 6 reference sites: andrewreff.com, wam.global, aither.co, artemshcherban.com, shiyunlu.com, bettinasosa.com. All share dark editorial minimal aesthetic with sophisticated typography and animation.

---

## Typography Personality

### Font Count

| Option | Description | Selected |
|--------|-------------|----------|
| 3-font system | Display/heading + body + monospace accent. Matches references. | ✓ |
| 2-font system | One sans-serif + monospace for code/labels. Simpler. | |
| You decide | Let frontend-design skill pick optimal number. | |

**User's choice:** 3-font system

### Heading Personality

| Option | Description | Selected |
|--------|-------------|----------|
| Geometric sans-serif | Clean, modern, confident. Space Grotesk, Graphik, Inter Display. | |
| Humanist serif | Warm, editorial, literary. Hedvig Letters Serif, Playfair Display. | |
| You decide | Let frontend-design skill select heading font. | ✓ |

**User's choice:** You decide

### Heading Scale

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, dramatic | Large display headings (4-10rem hero), tight letter-spacing, uppercase. | |
| Moderate sizing | Clean hierarchy but not dramatically oversized. | |
| You decide | Let frontend-design skill calibrate heading sizes. | ✓ |

**User's choice:** You decide

### Monospace Usage

| Option | Description | Selected |
|--------|-------------|----------|
| Design accent too | Monospace for code blocks AND UI labels, metadata, dates. | |
| Code blocks only | Monospace restricted to code snippets. | |
| You decide | Let frontend-design skill determine where monospace works. | ✓ |

**User's choice:** You decide

---

## Project Content Schema

### Additional Metadata Fields (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| Featured flag | Boolean for homepage featured section (HOME-02). | ✓ |
| Project role & context | Role, team size, duration fields. | |
| Status & links | Status, GitHub URL, demo URL, thumbnail. | ✓ |
| Category / type | Web app, CLI tool, library, etc. for future filtering. | ✓ |

**User's choice:** Featured flag, Status & links, Category / type
**Notes:** Project role/team context fields explicitly not selected — not needed for v1.

### Sort Order

| Option | Description | Selected |
|--------|-------------|----------|
| Manual sort order | Numeric 'order' field for curated display. | ✓ |
| Date-based sorting | Sort by completion date, newest first. | |
| Both | Order and date fields, sort by order. | |

**User's choice:** Manual sort order

### Tagline vs Description

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, separate tagline | Short tagline (~10 words) for cards + longer description for case studies. | ✓ |
| Single description field | One description used everywhere. | |
| You decide | Let Claude determine content field structure. | |

**User's choice:** Yes, separate tagline

---

## Deployment & Domain Setup

### Domain Status

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, I have a domain | Domain purchased and can point to Cloudflare. | ✓ |
| Not yet, will buy later | Will purchase before Phase 6. | |
| You decide | Set up to work with either. | |

**User's choice:** Yes, I have a domain

### Registrar

| Option | Description | Selected |
|--------|-------------|----------|
| Cloudflare Registrar | Already on Cloudflare, seamless DNS. | |
| Another registrar | GoDaddy, Namecheap, etc. Needs CNAME/nameserver update. | ✓ |
| Not sure / later | Domain details not important now. | |

**User's choice:** Another registrar

### CI/CD Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Set up now | Connect repo to Cloudflare Pages in Phase 1 for preview deploys. | ✓ |
| Defer to Phase 6 | Phase 1 local only, deployment in Phase 6. | |
| You decide | Let Claude determine timing. | |

**User's choice:** Set up now

### Repo Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Public | Source visible to hiring managers, demonstrates code quality. | ✓ |
| Private | Only deployed site visible. | |
| You decide | Let Claude pick. | |

**User's choice:** Public

---

## Claude's Discretion

- Color palette and accent color selection
- Heading font family choice
- Type scale calibration
- Monospace usage scope
- All specific visual decisions via frontend-design skill

## Deferred Ideas

None — discussion stayed within phase scope
