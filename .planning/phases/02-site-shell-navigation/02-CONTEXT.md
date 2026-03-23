# Phase 2: Site Shell & Navigation - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the site-wide layout shell: header with navigation, mobile hamburger menu, footer with contact links, SEO meta infrastructure, and accessibility features (skip-to-content, focus indicators, semantic HTML). Every page will be wrapped in this shell. No page content beyond the shell itself — content pages are Phase 3+.

</domain>

<decisions>
## Implementation Decisions

### Navigation style
- **D-01:** Transparent overlay nav with no background — blends into the dark theme. Background fades in on scroll for contrast/readability.
- **D-02:** Sticky with scroll reveal — nav hides when scrolling down, reappears when scrolling up. Saves vertical space while keeping nav accessible.
- **D-03:** Minimal text links in body font with subtle hover effect (underline slide-in or color shift to accent). Clean, matches the restrained editorial aesthetic from Phase 1.
- **D-04:** Five nav links: Home, About, Projects, Resume, Contact.

### Mobile menu
- **D-05:** Full-screen overlay menu — takes over entire screen with dark background, links displayed large and centered. Dramatic, immersive, matches editorial aesthetic.
- **D-06:** Nav links only in the mobile menu — just the 5 page links, no social icons or tagline.
- **D-07:** Mobile breakpoint at Tailwind `md` (768px) — desktop nav at 768px+, hamburger menu below.

### Footer design
- **D-08:** Minimal footer with contact links — name, copyright, and social/contact icons (GitHub, LinkedIn, email). Satisfies CNTC-02 (contact accessible from every page).

### Identity display
- **D-09:** Text namemark "Jack Cutrara" in display/heading font in the nav bar, links to home page. No logo or initials.
- **D-10:** Role title is "Software Engineer" — direct, professional, no "aspiring" qualifier.
- **D-11:** Role/value proposition ("Software Engineer") displayed on home hero only — nav shows just the name across all pages. The home hero is built in Phase 3, but the layout structure must accommodate it.

### SEO meta infrastructure
- **D-12:** Use `astro-seo` component for meta tags, OG tags, and Twitter cards. Extend BaseLayout to accept SEO props per page.

### Claude's Discretion
- Active page indication style in nav (accent color, underline, or other)
- Hamburger menu icon style and animation (animated hamburger-to-X or simple toggle)
- Footer visual separator treatment (border line, background shift, or other)
- All specific visual decisions routed through frontend-design skill

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project definition
- `.planning/PROJECT.md` — Core value proposition, constraints, out-of-scope items
- `.planning/REQUIREMENTS.md` — Phase 2 requirements: IDNV-01, IDNV-02, IDNV-03, CNTC-02, SEOA-01, SEOA-02, SEOA-04, SEOA-05, SEOA-06, SEOA-07
- `.planning/ROADMAP.md` — Phase 2 success criteria and dependencies

### Tech stack
- `CLAUDE.md` §Technology Stack — Complete stack spec (Astro 6, Tailwind CSS v4, astro-seo, @astrojs/sitemap). Includes "What NOT to Use" guardrails.

### Prior phase context
- `.planning/phases/01-foundation-design-system/01-CONTEXT.md` — Phase 1 design decisions: dark editorial minimal aesthetic, spacious whitespace, restrained palette (1-2 accent colors), 3-font system, reference inspiration sites

### Reference inspiration (from Phase 1)
- https://andrewreff.com/ — Dark editorial, transparent nav over content
- https://artemshcherban.com/ — Full-screen menu overlay, minimal nav

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/layouts/BaseLayout.astro` — Base HTML structure with font loading (Astro Fonts API), title/description props. Phase 2 extends this with nav header, footer, and SEO component integration.
- `src/styles/global.css` — Design tokens (colors via oklch, typography with fluid clamp(), spacing) and Tailwind @theme bridge. Nav/footer must use these tokens for consistency.

### Established Patterns
- Dark-first token architecture: `:root` = dark theme, `[data-theme="light"]` placeholder for Phase 5
- All colors use `var(--token-*)` references through the Tailwind `@theme` bridge — nav/footer should follow this pattern
- Font loading via `<Font cssVariable="--font-*" />` components in `<head>`
- Tailwind v4 CSS-first config via `@theme` directives (no `tailwind.config.js`)

### Integration Points
- `BaseLayout.astro` body currently has `<slot />` only — Phase 2 wraps this with `<Header />`, `<main>`, and `<Footer />` components
- `src/pages/index.astro` uses BaseLayout — all future pages will too
- SEO props flow: page frontmatter → layout props → astro-seo component in `<head>`
- Skip-to-content link targets `<main id="main-content">`

</code_context>

<specifics>
## Specific Ideas

- Nav should feel like reference sites andrewreff.com and artemshcherban.com — transparent over dark content, not a separate visual element
- Full-screen mobile menu matches the dramatic editorial feel of the reference sites (artemshcherban.com specifically)
- Footer should be understated — the portfolio content is the star, not the chrome
- Note: IDNV-01 requires "name, role, and value proposition above the fold within 3 seconds of any page loading." User chose role on home hero only (Phase 3). For non-home pages, the nav namemark ("Jack Cutrara") provides identity. The planner should verify this interpretation satisfies the success criteria or flag if a nav subtitle is needed.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-site-shell-navigation*
*Context gathered: 2026-03-23*
