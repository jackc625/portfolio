# Phase 3: Core Pages - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Home, About, Resume, and Contact pages with real content structure. Visitors get a complete picture of who Jack is — his identity, background, skills, resume, and how to reach him — before they even see projects. All four pages must be responsive and render correctly on mobile, tablet, and desktop.

</domain>

<decisions>
## Implementation Decisions

### Home Page
- **D-01:** Bold typographic hero — large display-font headline with name, role ("Software Engineer"), tagline, and primary CTA to view projects. Typography does the heavy lifting, matching the dark editorial aesthetic of reference sites (artemshcherban.com, bettinasosa.com).
- **D-02:** **NON-GENERIC EDITORIAL DESIGN** — the home page must NOT follow a conventional section-stacked portfolio layout (hero > about teaser > featured projects > CTA). The frontend-design skill has full creative freedom to design an editorial, unexpected composition inspired by the reference sites. The requirements (HOME-01 through HOME-04) define WHAT information must be present, but HOW it's composed is the design skill's call.
- **D-03:** Featured projects creatively integrated into the home page design — not as a separate card grid section. Projects woven into the design in an unexpected way (typographic elements, interactive list, editorial composition). Uses `featured: true` from the content schema.
- **D-04:** Claude drafts hero tagline and intro copy based on PRD positioning (builds real projects, strong initiative, capable of backend and full-stack work). User can revise later.

### About Page
- **D-05:** Professional but human tone — first person ("I build things because..."), conversational but not casual. Shows personality without being unprofessional. Satisfies ABUT-02.
- **D-06:** Content covers education, journey into engineering, and interests — full narrative per ABUT-01.
- **D-07:** Editorial design treatment — same creative energy as the home page. Typography-driven, intentional layout, not a plain text wall. Consistent with overall site aesthetic.

### Skills Presentation
- **D-08:** Skills format is Claude's discretion — grouped by domain, by project, or another creative approach. Must NOT use progress bars (explicit requirement ABUT-03). The frontend-design skill determines the best presentation within the editorial aesthetic.

### Resume Page
- **D-09:** Hybrid approach — styled summary of key highlights (recent role, education, key skills) rendered in the site's design system, with a prominent "Download full resume" PDF button above the fold. Not a full HTML recreation of the resume, not just an embedded PDF viewer.
- **D-10:** PDF is ready — user has a resume PDF to include in the project. Place in `public/` directory for direct download.
- **D-11:** Resume page design treatment is Claude's discretion — can be editorial or clean functional, whichever best serves the content.

### Contact Page
- **D-12:** Full dedicated page at /contact — not just a section on another page. Even though the footer covers the same links, /contact is expected and standard.
- **D-13:** Availability status message — include a brief "currently open to opportunities" or similar status indicator. Signals to recruiters that Jack is actively looking.
- **D-14:** Contact info: email, LinkedIn, GitHub only — same three channels as the footer, but presented with more context and prominence on the dedicated page.

### Claude's Discretion
- Home page layout, depth (single viewport vs scroll), and section composition — frontend-design skill decides
- Featured projects preview format and creative integration approach
- Skills presentation format (grouped by domain, project, or other creative approach)
- Resume page design treatment (editorial vs clean functional)
- Contact page design treatment
- All copy/content drafting (user will revise later)
- All specific visual decisions routed through frontend-design skill

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project definition
- `.planning/PROJECT.md` — Core value proposition, constraints, out-of-scope items
- `.planning/REQUIREMENTS.md` — Phase 3 requirements: HOME-01, HOME-02, HOME-03, HOME-04, ABUT-01, ABUT-02, ABUT-03, RESM-01, RESM-02, CNTC-01
- `.planning/ROADMAP.md` — Phase 3 success criteria and dependencies
- `PRD.md` — Original product requirements document with candidate positioning and product vision

### Prior phase context
- `.planning/phases/01-foundation-design-system/01-CONTEXT.md` — Design decisions: dark editorial minimal aesthetic, spacious whitespace, restrained palette (1-2 accent colors), 3-font system (display + body + mono), reference inspiration sites
- `.planning/phases/02-site-shell-navigation/02-CONTEXT.md` — Shell decisions: transparent overlay nav, scroll reveal, text namemark "Jack Cutrara", role "Software Engineer" on home hero only, full-screen mobile menu, minimal footer with contact icons

### Tech stack
- `CLAUDE.md` §Technology Stack — Complete stack spec (Astro 6, Tailwind CSS v4, GSAP, Content Collections, MDX)

### Reference inspiration (from Phase 1 — CRITICAL for non-generic design)
- https://andrewreff.com/ — Dark editorial, film grain, design-tool transitions
- https://artemshcherban.com/ — B&W serif/mono, GSAP text reveals, full-screen impact
- https://shiyunlu.com/ — Muted gradient accents, asymmetric grid, canvas hero
- https://bettinasosa.com/ — Dark high-contrast, dramatic tagline typography
- https://aither.co/ — Warm neutrals, horizontal scroll, blend-mode interactions
- https://wam.global/ — Corporate clean, strong hierarchy, whitespace rhythm

### Content schema
- `src/content.config.ts` — Project collection schema with `featured` boolean field used for home page integration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/layouts/BaseLayout.astro` — Full layout shell with SEO (astro-seo), Font loading, Header, MobileMenu, Footer, ClientRouter (View Transitions). All pages extend this.
- `src/components/Header.astro` — Scroll-reveal sticky nav with transparent overlay, namemark link
- `src/components/Footer.astro` — Minimal footer with GitHub, LinkedIn, email SVG icon links
- `src/styles/global.css` — Design tokens (colors via oklch, fluid type scale with clamp(), spacing tokens), Tailwind @theme bridge

### Established Patterns
- Dark-first token architecture: `:root` = dark theme, `[data-theme="light"]` placeholder for Phase 5
- All colors use `var(--token-*)` → Tailwind `@theme` bridge — pages must follow this pattern
- Font system: `font-display` (heading serif), `font-body` (sans), `font-mono` (monospace)
- Fluid typography: `--token-text-display` for hero headings, `--token-text-heading` for section headings, `--token-text-base` for body
- Section spacing: `py-[var(--token-space-section)]` pattern used in current stub pages
- SEO props flow: page frontmatter → BaseLayout props → astro-seo component in `<head>`

### Integration Points
- All 5 page stubs exist (`index.astro`, `about.astro`, `resume.astro`, `contact.astro`, `projects.astro`) — Phase 3 replaces stub content on 4 of these
- `<main id="main-content" class="flex-1 pt-16">` in BaseLayout wraps all page content
- Content collection at `src/content/projects/` with Zod schema — home page queries `featured: true` entries
- Nav links already point to `/about`, `/projects`, `/resume`, `/contact`

</code_context>

<specifics>
## Specific Ideas

- **"NOT a generic vibecoded homescreen"** — User explicitly rejected conventional section-stacked portfolio layouts. The reference inspiration sites are the north star. Every page should feel editorially designed, not template-generated.
- The home page hero is bold typographic, but everything beyond that is creative territory for the frontend-design skill
- Featured projects should be "woven in" to the home design, not a separate section — think project names as typographic elements, subtle interactive lists, or editorial composition
- About page gets the same editorial energy as home — not a plain bio page
- Resume is more pragmatic (hybrid summary + PDF download) but design treatment is flexible
- Contact page includes an availability/status indicator — a differentiator for active job seekers

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-core-pages*
*Context gathered: 2026-03-23*
