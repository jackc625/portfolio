# Phase 3: Core Pages - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Full visual rebuild of the entire site to clone shiyunlu.com's design language. This includes updating design tokens (colors, fonts), reworking the site shell (header, footer, mobile menu, navigation), and rebuilding all four core pages (Home, About, Resume, Contact) within the cloned design system. Visitors get a complete, cohesive site that looks and feels like shiyunlu.com with Jack's content. Animations deferred to Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Site-Wide Design Direction
- **D-01:** **Near-exact clone of shiyunlu.com** as the global design language for the entire portfolio — not just this phase. Every current and future page follows this design system.
- **D-02:** Clone scope includes: spatial layout/grid system, color treatment (muted gradient accents), font stack (or closest free equivalents to shiyunlu.com's typography), and navigation patterns.
- **D-03:** Animations are **deferred to Phase 5**. This phase builds the static layout clone. Basic CSS transitions/hovers for interactivity are acceptable, but no GSAP scroll-triggered animations yet.
- **D-04:** **Bypass the frontend-design skill** — the reference site IS the design spec. Analyze shiyunlu.com directly and implement. No separate UI-SPEC or design interpretation layer.

### Design Token Updates
- **D-05:** Update color tokens to match shiyunlu.com's color treatment — muted gradient accents, near-black backgrounds. Replace existing oklch palette.
- **D-06:** Update font stack to match shiyunlu.com's typography (or closest freely available equivalents). Replace Instrument Serif / Instrument Sans / JetBrains Mono.
- **D-07:** Existing design token architecture (CSS custom properties → Tailwind @theme bridge) remains — only the values change, not the system.

### Navigation & Site Shell
- **D-08:** **Rework header/nav/footer** to match shiyunlu.com's navigation pattern (asymmetric grid nav, etc.). The Phase 2 scroll-reveal sticky nav is replaced.
- **D-09:** Mobile menu also reworked to match shiyunlu.com's mobile navigation pattern.

### Home Page
- **D-10:** Clone shiyunlu.com's home page spatial structure as closely as possible.
- **D-11:** **Canvas hero with abstract/generative art** — procedural visuals (particles, gradients, geometric shapes) similar to shiyunlu.com. Unique on every page load.
- **D-12:** **No featured projects on the home page.** Projects are accessed via the projects page through navigation. HOME-02 requirement is relaxed.
- **D-13:** **Requirements are flexible** — HOME-01 through HOME-04 describe WHAT info should be accessible, not WHERE it must live. If the cloned layout doesn't naturally have room for something (e.g., resume link, about teaser), visitors find it through nav. Update requirements to match what the layout actually delivers.

### About Page
- **D-14:** Follow shiyunlu.com's **design system rules** (fonts, colors, grid, spacing) but compose the about page layout **freely** within those rules. Not a direct clone of a specific shiyunlu.com inner page.
- **D-15:** Same content flexibility as home — requirements (ABUT-01 through ABUT-03) are flexible. If the skills grid or narrative doesn't fit naturally, reshape or relocate.
- **D-16:** **Keep the current first-person conversational tone** for copy. Visual design changes but writing style stays ("I got into programming because I wanted to build things...").

### Resume & Contact Pages
- **D-17:** Resume and Contact pages get the **full design system treatment** — rebuilt to follow shiyunlu.com's design system (grid, spacing, composition), not just a color/font swap.
- **D-18:** Resume hybrid approach (styled summary + PDF download) still valid — just rebuilt within the new design system.
- **D-19:** Contact page (email, LinkedIn, GitHub + availability status) still valid — rebuilt within the new design system.

### Claude's Discretion
- Specific canvas/generative art implementation details (algorithm, visual style within "abstract/generative")
- How to adapt shiyunlu.com's specific sections for a SWE portfolio context
- About page layout composition within the design system rules
- Resume and Contact page layout composition within the design system
- All copy/content drafting (user will revise later)
- Exact font selections (closest free equivalents to shiyunlu.com's type)
- Navigation rework details within shiyunlu.com's pattern

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary design reference (CRITICAL)
- https://shiyunlu.com/ — **THE design spec.** Near-exact clone of this site's spatial layout, color treatment, font system, and navigation patterns. Study every page thoroughly before implementing.

### Project definition
- `.planning/PROJECT.md` — Core value proposition, constraints, out-of-scope items
- `.planning/REQUIREMENTS.md` — Phase 3 requirements: HOME-01, HOME-02, HOME-03, HOME-04, ABUT-01, ABUT-02, ABUT-03, RESM-01, RESM-02, CNTC-01 (NOTE: requirements are flexible — layout takes priority)
- `.planning/ROADMAP.md` — Phase 3 success criteria and dependencies
- `PRD.md` — Original product requirements document with candidate positioning and product vision

### Prior phase context
- `.planning/phases/01-foundation-design-system/01-CONTEXT.md` — Original design decisions being superseded by this overhaul. Token architecture (CSS custom properties → @theme bridge) is preserved, values are changing.
- `.planning/phases/02-site-shell-navigation/02-CONTEXT.md` — Original shell decisions being superseded. Nav, header, footer, mobile menu all reworked.

### Tech stack
- `CLAUDE.md` §Technology Stack — Complete stack spec (Astro 6, Tailwind CSS v4, GSAP, Content Collections, MDX)

### Content schema
- `src/content.config.ts` — Project collection schema (unchanged — still used for projects page in Phase 4)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/layouts/BaseLayout.astro` — Layout shell with SEO, font loading, ClientRouter. Will be updated (new fonts, possibly new shell structure) but remains the central layout.
- `src/styles/global.css` — Design token system (CSS custom properties → Tailwind @theme bridge). Architecture stays, values updated to match shiyunlu.com.
- `src/content.config.ts` — Content collection schema. Unchanged.

### Assets to Rework
- `src/components/Header.astro` — Current scroll-reveal sticky nav. Will be rebuilt to match shiyunlu.com's navigation pattern.
- `src/components/Footer.astro` — Current minimal footer. Will be rebuilt.
- `src/components/MobileMenu.astro` — Current full-screen overlay. Will be rebuilt.
- `src/components/CTAButton.astro` — May need restyling or removal depending on cloned layout.
- `src/components/FeaturedProjectItem.astro` — No longer needed on home page (D-12). May be removed or repurposed for Phase 4.
- `src/components/SkillGroup.astro` — May need restyling or relocation depending on about page composition.
- `src/components/ResumeEntry.astro` — Will be restyled within new design system.
- `src/components/ContactChannel.astro` — Will be restyled within new design system.

### Established Patterns
- Dark-first token architecture: `:root` = dark theme, `[data-theme="light"]` placeholder for Phase 5 — **preserved**
- All colors use `var(--token-*)` → Tailwind `@theme` bridge — **preserved, values change**
- Font system uses CSS variables (`--font-display`, `--font-body`, `--font-mono`) — **preserved, fonts change**
- Navigation scripts re-initialize on `astro:page-load` for View Transitions — **pattern preserved in reworked nav**
- SEO props flow: page frontmatter → BaseLayout → astro-seo — **unchanged**

### Integration Points
- All 5 page stubs exist — Phase 3 rebuilds 4 of them (index, about, resume, contact)
- `<main id="main-content">` in BaseLayout wraps page content — structure may change with nav rework
- Content collection at `src/content/projects/` — not used on home page anymore, still used in Phase 4

</code_context>

<specifics>
## Specific Ideas

- **shiyunlu.com is THE north star** — not "inspired by" but "clone the spatial system." Study the reference site exhaustively before writing any code.
- The canvas hero should use abstract/generative procedural visuals — unique on every page load
- No featured projects on the home page — this is a deliberate simplification, not an oversight
- The first-person conversational writing tone is preserved across the visual overhaul — the site's personality stays even though the clothes change
- Requirements are flexible to the layout — if the cloned design doesn't have room for something, it's OK. The nav provides discovery. Don't force-fit content.
- Previous redesign attempts failed because Claude wrote CSS descriptions of "asymmetry" and "editorial" but rendered the same generic stacked layout every time. The solution: clone a specific reference site's actual structure, not an abstract concept.

</specifics>

<deferred>
## Deferred Ideas

- **GSAP scroll-triggered animations** — Phase 5 (D-03 explicitly defers)
- **Dark/light mode toggle** — Phase 5 (token architecture preserved for this)
- **Featured projects on home page** — Revisit in Phase 4 if the projects page design suggests it. Currently dropped (D-12).

</deferred>

---

*Phase: 03-core-pages*
*Context gathered: 2026-03-25*
