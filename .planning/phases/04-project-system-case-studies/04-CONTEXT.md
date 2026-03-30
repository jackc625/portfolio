# Phase 4: Project System & Case Studies - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the projects page with a hybrid layout (featured cards + editorial list), individual case study pages with structured templates following the Phase 3 inner page pattern, placeholder content for all projects, and at least 2 fully written case studies. Visitors can browse projects in a scan-friendly layout and drill into structured case studies that demonstrate technical depth.

</domain>

<decisions>
## Implementation Decisions

### Project Card Presentation
- **D-01:** **Hybrid layout** on the projects page — top 3 projects displayed as large featured cards with thumbnails, remaining projects in an editorial list below (extending the existing `FeaturedProjectItem.astro` pattern).
- **D-02:** Total project count is Claude's discretion (5-6 range per requirements).
- **D-03:** **No category labels** on project cards — just title, tagline, tech tags, and thumbnail (for featured cards).
- **D-04:** **No status badges** (completed/in-progress) displayed on cards — hide status from visitors to avoid signaling unfinished work.
- **D-05:** **Links only on case study pages** — editorial list items link to the case study page only, no inline GitHub/demo icon links.
- **D-06:** **No filtering or sorting controls** — projects display in fixed manual order via the `order` schema field. ENHP-01 (filtering) is deferred to v2.

### Case Study Page Layout
- **D-07:** **Hero summary + scroll sections** — top section shows project title, tagline, tech tags, GitHub/demo links, and a large hero image (16:9 landscape). Structured sections scroll below.
- **D-08:** **Case study sections:** Problem, Solution & Approach, Tech Stack Detail, Challenges & Lessons. A Results/Outcome section is included at Claude's discretion per project (only when meaningful metrics exist).
- **D-09:** **Match Phase 3 inner page pattern** — each section uses mono uppercase label with content in asymmetric grid layout, consistent with About, Resume, and Contact pages.
- **D-10:** **Next project navigation** at the bottom of each case study, linking to the next project to keep readers flowing through the portfolio.

### Thumbnails & Visual Media
- **D-11:** **Real screenshots** as project thumbnails when available. For projects without screenshots, use **solid color + project title** as placeholder (dark card with centered title text).
- **D-12:** **Thumbnail field made optional** in content collection schema — projects without thumbnails gracefully fall back to the solid-color placeholder treatment.
- **D-13:** **16:9 landscape aspect ratio** for case study hero images.
- **D-14:** **Image captions supported** — small muted text below images in case study content for annotations and context.
- **D-15:** Media treatment within case study sections is Claude's discretion (full-width vs inline placement based on content).

### Case Study Content
- **D-16:** **Placeholder content for all projects** — Claude has full discretion on placeholder project themes, types, depth, and length. These are purely structural and will be replaced with real content later.
- **D-17:** **First-person conversational tone** for case study writing — matches the About page tone from Phase 3 ("I built this because...").
- **D-18:** **No code snippets** in case studies — prose only. Engineers can check GitHub repos for code.
- **D-19:** Case study length is Claude's discretion per project.

### URL Structure & Routing
- **D-20:** **URLs: /projects/[slug]** — e.g., /projects/portfolio-site. Clean, readable, SEO-friendly.
- **D-21:** **Slug derived from MDX filename** — Astro's content collections default behavior. No extra slug frontmatter field needed.

### Projects Page Structure
- **D-22:** Projects page header/intro content is Claude's discretion (matching the inner page pattern from Phase 3).

### Mobile Responsiveness
- **D-23:** Featured cards **stack to single column** on mobile — full-width, vertically stacked. Standard responsive pattern.

### Content Schema Updates
- **D-24:** Schema changes are Claude's discretion — at minimum, make `thumbnail` optional. Additional fields may be added if needed for the case study template to work well.

### Claude's Discretion
- Total project count (5-6 range)
- Projects page intro text and layout
- Placeholder project themes, types, content, and length
- Media placement within case study sections (full-width vs inline)
- Results/Outcome section inclusion per project
- Schema field additions beyond making thumbnail optional
- Featured card visual treatment within shiyunlu.com design system

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project definition
- `.planning/PROJECT.md` — Core value proposition, constraints, out-of-scope items
- `.planning/REQUIREMENTS.md` — Phase 4 requirements: PROJ-01, PROJ-02, PROJ-03, PROJ-04, CASE-01, CASE-02, CASE-03, CASE-04, CASE-05
- `.planning/ROADMAP.md` — Phase 4 success criteria and dependencies

### Prior phase context
- `.planning/phases/01-foundation-design-system/01-CONTEXT.md` — Original design decisions: dark editorial minimal, spacious whitespace, restrained palette, 3-font system, content collection schema definition (D-07 through D-10)
- `.planning/phases/03-core-pages/03-CONTEXT.md` — shiyunlu.com clone as global design language. Inner page pattern: mono uppercase label + asymmetric grid sections. Requirements flexible to layout.

### Tech stack
- `CLAUDE.md` §Technology Stack — Complete stack spec (Astro 6, Tailwind CSS v4, Content Collections, MDX, Astro Image)

### Content schema
- `src/content.config.ts` — Current project collection schema (11 fields). Thumbnail field to be made optional per D-12.

### Existing components
- `src/components/FeaturedProjectItem.astro` — Editorial list item component (title, tagline, tech stack). Pattern to extend for the editorial list section.

### Design system
- `src/styles/global.css` — Design tokens (colors, typography, spacing) and Tailwind @theme bridge. All new components must use these tokens.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FeaturedProjectItem.astro` — Editorial list item with title, tagline, tech stack. Directly reusable for the editorial list section of the hybrid layout. May need minor adjustments.
- `src/content.config.ts` — Content collection schema with Zod validation. Already has most fields needed; thumbnail made optional.
- `src/content/projects/` — 3 existing MDX files (_sample.mdx, placeholder-api.mdx, placeholder-devtools.mdx). Will be replaced/expanded with case study content.
- `BaseLayout.astro` — Layout shell with SEO, fonts, ClientRouter. Case study pages wrap in this.
- Design tokens in `global.css` — All color, typography, and spacing tokens ready for use.

### Established Patterns
- Inner page pattern: mono uppercase label + content in asymmetric 1fr/2fr grid sections (from Phase 3)
- Dark-first token architecture: `:root` = dark, `[data-theme="light"]` placeholder for Phase 5
- All colors use `var(--token-*)` → Tailwind `@theme` bridge
- Font system: `--font-display`, `--font-body`, `--font-mono` CSS variables
- Navigation scripts re-initialize on `astro:page-load` for View Transitions
- Shell components use `max-w-[90rem]` with generous px for wide layout

### Integration Points
- `src/pages/projects.astro` — Stub page exists, needs full implementation with hybrid layout
- No dynamic route file yet — need to create `src/pages/projects/[...slug].astro` (or similar) for case study pages
- Content collection query: `getCollection('projects')` to fetch project data, sorted by `order` field
- `featured` boolean in schema maps directly to the hybrid layout: `featured: true` = card section, `featured: false` = editorial list
- Astro `<Image />` and `<Picture />` for optimized image handling (WebP/AVIF, srcset, lazy loading)

</code_context>

<specifics>
## Specific Ideas

- The hybrid layout uses the existing `featured` boolean field to split projects: `featured: true` projects get the large card treatment, rest go in the editorial list
- shiyunlu.com's design language remains THE north star — featured cards and case study pages must feel like natural extensions of the existing pages
- Placeholder content is purely structural — will be fully replaced with real projects later. No need to make it realistic or domain-specific.
- The "next project" navigation at the bottom of case studies creates a browsing flow similar to how shiyunlu.com handles project navigation
- Image captions use the existing `--token-text-muted` color and mono font for consistency

</specifics>

<deferred>
## Deferred Ideas

- **Project filtering by category/tech** — ENHP-01, deferred to v2 requirements
- **Interactive embedded demos** — ENHP-02, deferred to v2 requirements
- **Code snippets in case studies** — User explicitly chose prose-only for v1

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-project-system-case-studies*
*Context gathered: 2026-03-30*
