# Phase 1: Foundation & Design System - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the Astro 6 project with Tailwind v4, TypeScript, design tokens (colors, typography, spacing), content collection schemas for projects, and deployment infrastructure (Cloudflare Pages CI/CD). This is the base everything else builds on — no pages, no components, no content beyond schema validation.

</domain>

<decisions>
## Implementation Decisions

### Visual Direction & Brand Feel
- **D-01:** Dark editorial minimal as the PRIMARY experience, with a clean light mode as the alternate theme. Dark mode is the default; light mode added in Phase 5 (DSGN-02/DSGN-03).
- **D-02:** Spacious whitespace density — generous padding/margins, content breathes, premium gallery-like feel. Optimized for recruiter scanning.
- **D-03:** Restrained palette — 1-2 accent colors max against dark backgrounds. No vivid rainbow palettes.
- **D-04:** Reference inspiration sites (all share dark editorial minimal with sophisticated typography and animation):
  - andrewreff.com — Dark palette, Space Grotesk/DM Sans/DM Mono, film grain texture, design-tool page transitions
  - wam.global — Clean corporate, generous whitespace, strong typographic hierarchy
  - aither.co — Warm neutrals, Apercu/TWK Lausanne/Inter/IBM Plex Mono, horizontal scroll mechanic, mix-blend-mode text
  - artemshcherban.com — Black-and-white, Amiri/Hedvig Letters Serif/Fragment Mono, GSAP orchestrated text reveals, custom cursor
  - shiyunlu.com — Near-black with muted gradient accents, Graphik/Wotfard/IBM Plex Mono, asymmetric grid nav, canvas hero
  - bettinasosa.com — Dark high-contrast, Inter throughout, full-screen hero, grid project showcase

### Typography
- **D-05:** 3-font system — display/heading font + body text font + monospace accent font
- **D-06:** Specific font families, heading personality (geometric sans vs humanist serif), heading scale (dramatic vs moderate), and monospace usage scope (code-only vs design accent) are all Claude's discretion — the frontend-design skill will make these calls within the dark editorial minimal direction

### Project Content Schema
- **D-07:** Schema fields: `title`, `tagline` (short one-liner for card display), `description` (longer intro for case study pages), `techStack` (array), `featured` (boolean for homepage featured section), `status` (completed/in-progress), `githubUrl` (optional), `demoUrl` (optional), `thumbnail` (image path), `category` (web app, CLI tool, library, etc.), `order` (numeric for manual sort control)
- **D-08:** Separate `tagline` vs `description` fields — tagline optimized for card scanning (~10 words), description for case study intros
- **D-09:** Manual sort order via `order` field — strongest projects appear first regardless of date
- **D-10:** No project role/team context fields (role, team size, duration) — not needed for v1

### Deployment & Domain Setup
- **D-11:** Custom domain available, registered at an external registrar (not Cloudflare). DNS will need CNAME records or nameserver update.
- **D-12:** CI/CD set up in Phase 1 — connect GitHub repo to Cloudflare Pages so every push deploys a preview. Useful for checking work throughout all phases.
- **D-13:** Public GitHub repository — source code visible to hiring managers, demonstrates code quality and modern tooling choices.

### Claude's Discretion
- Color palette and accent color selection (within the dark editorial minimal direction and reference site patterns)
- Heading font family choice (geometric sans-serif or humanist serif or similar)
- Type scale calibration (dramatic oversized headings vs moderate hierarchy)
- Monospace usage scope (code blocks only vs design accent for labels/metadata/dates)
- All specific visual decisions routed through the frontend-design skill

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Core value proposition, constraints, out-of-scope items
- `.planning/REQUIREMENTS.md` — Full v1 requirements with traceability. Phase 1 covers DSGN-01 and IDNV-04.
- `.planning/ROADMAP.md` — Phase 1 success criteria and dependencies

### Tech Stack
- `CLAUDE.md` §Technology Stack — Complete stack specification (Astro 6, Tailwind CSS v4, TypeScript 5.9, GSAP, Cloudflare Pages). Includes version compatibility matrix, installation instructions, and "What NOT to Use" guardrails.

### Reference Inspiration
- https://andrewreff.com/ — Dark editorial, multi-font system, film grain, design-tool transitions
- https://aither.co/ — Warm neutrals, horizontal scroll, blend-mode interactions
- https://artemshcherban.com/ — B&W serif/mono pairing, GSAP text reveals
- https://shiyunlu.com/ — Muted gradient accents, asymmetric grid, canvas hero
- https://bettinasosa.com/ — Dark high-contrast, Inter, dramatic tagline typography
- https://wam.global/ — Corporate clean, strong hierarchy, whitespace rhythm

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None — Phase 1 ESTABLISHES the patterns all subsequent phases follow

### Integration Points
- Content collection schemas defined here will be consumed by Phase 4 (project cards + case studies)
- Design tokens defined here will be used by every subsequent phase
- Deployment pipeline set up here will be used by all phases for preview deployments
- Dark-mode-first color tokens must be structured to support Phase 5's light mode toggle (CSS custom properties with theme-aware values)

</code_context>

<specifics>
## Specific Ideas

- User provided 6 reference sites that all share a dark editorial minimal aesthetic — this is a strong signal that the visual direction should lean into typography-driven design with restrained color, not typical bright/white "clean minimal"
- Design tokens for Phase 1 should be structured to support dark-first with future light mode — use CSS custom properties that can be swapped per theme
- The 3-font system pattern (display + body + mono) appears in 4 of 6 reference sites — this is a validated approach for this aesthetic

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-design-system*
*Context gathered: 2026-03-22*
