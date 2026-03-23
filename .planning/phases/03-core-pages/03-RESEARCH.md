# Phase 3: Core Pages - Research

**Researched:** 2026-03-23
**Domain:** Astro 6 static page composition, content collections, editorial portfolio design
**Confidence:** HIGH

## Summary

Phase 3 replaces the four stub pages (Home, About, Resume, Contact) with fully composed, editorially designed pages. The technical surface is straightforward -- all pages are static Astro components using existing design tokens, Tailwind utilities, and the BaseLayout shell from Phase 2. The primary complexity is compositional: the UI-SPEC defines detailed layouts, component structures, typography rules, and copywriting for each page, plus several reusable components (CTAButton, FeaturedProjectItem, SkillGroup, ContactChannel, ResumeEntry).

The Home page requires querying the content collection for featured projects using `getCollection('projects', ({ data }) => data.featured === true)` and sorting by `order`. All other pages are pure static content with no data fetching. A resume PDF must be placed in `public/resume.pdf` for the download button (user-provided, flagged as pending dependency in UI-SPEC).

**Primary recommendation:** Build page-by-page with reusable components extracted first (CTAButton, then page-specific components), following the UI-SPEC as a pixel-level contract. No new dependencies needed -- everything uses existing Astro 6, Tailwind v4, and design tokens from Phase 1/2.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Bold typographic hero -- large display-font headline with name, role, tagline, and primary CTA. Typography does the heavy lifting.
- D-02: NON-GENERIC EDITORIAL DESIGN -- home page must NOT follow conventional section-stacked portfolio layout. Frontend-design skill has creative freedom.
- D-03: Featured projects creatively integrated into home design -- not a separate card grid. Uses `featured: true` from content schema.
- D-04: Claude drafts hero tagline and intro copy based on PRD positioning. User can revise later.
- D-05: Professional but human tone -- first person, conversational but not casual.
- D-06: Content covers education, journey into engineering, and interests.
- D-07: Editorial design treatment on About page -- typography-driven, not a plain text wall.
- D-08: Skills format is Claude's discretion -- grouped by domain, project, or another creative approach. Must NOT use progress bars.
- D-09: Hybrid resume approach -- styled summary of key highlights + prominent PDF download button above the fold. Not a full HTML resume recreation, not just an embedded PDF viewer.
- D-10: PDF is ready -- user has a resume PDF. Place in `public/` directory.
- D-11: Resume page design treatment is Claude's discretion.
- D-12: Full dedicated page at /contact -- not just a section.
- D-13: Availability status message -- "currently open to opportunities" indicator.
- D-14: Contact info: email, LinkedIn, GitHub only.

### Claude's Discretion
- Home page layout, depth (single viewport vs scroll), and section composition
- Featured projects preview format and creative integration approach
- Skills presentation format (grouped by domain, project, or other creative approach)
- Resume page design treatment (editorial vs clean functional)
- Contact page design treatment
- All copy/content drafting (user will revise later)
- All specific visual decisions routed through frontend-design skill

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-01 | Hero section with name, role positioning, brief intro, and primary CTA (view projects) | UI-SPEC Hero Section spec + CTAButton component. Existing stub has h1 with name -- expand to full hero composition. |
| HOME-02 | Featured projects preview section highlighting 2-3 top projects with links to detail pages | Content collection query with `featured: true` filter + FeaturedProjectItem component. _sample.mdx already has `featured: true`. |
| HOME-03 | Brief intro/about teaser that drives visitors to the About page | UI-SPEC About Teaser Section spec. Static content with link to /about. |
| HOME-04 | Prominent links to resume and contact information | UI-SPEC Resume/Contact Links Section spec. Text links at heading size. |
| ABUT-01 | Background narrative covering education, path into engineering, and interests | UI-SPEC Narrative Section spec. Placeholder copy provided in Copywriting Contract. |
| ABUT-02 | Professional but human tone -- shows personality without being unprofessional | Copy tone defined in D-05. First person, conversational but not casual. |
| ABUT-03 | Technology/skills presentation grouped by context (not progress bars) | SkillGroup component spec. Skills grouped by domain in 2-col grid. |
| RESM-01 | Resume page with viewable content rendered on-page | UI-SPEC Styled Summary spec. ResumeEntry component for experience/education entries. |
| RESM-02 | PDF download button above the fold | CTAButton reused with download icon. `<a href="/resume.pdf" download>`. Requires user-provided PDF in `public/`. |
| CNTC-01 | Contact section with direct email, LinkedIn, and GitHub links | ContactChannel component spec. Three cards with icons reused from Footer SVGs. |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 6.0.8 | Framework / static pages | Already installed. Pages are `.astro` files in `src/pages/`. |
| Tailwind CSS | 4.2.2 | Styling via utilities + design tokens | Already installed via `@tailwindcss/vite`. All styling uses `var(--token-*)` bridge. |
| TypeScript | 5.9.3 | Type safety in frontmatter scripts | Already installed. Content collection queries are type-safe. |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| astro-seo | 1.1.0 | Per-page meta tags | Already wired in BaseLayout. Pages pass `title` and `description` props. |
| @astrojs/mdx | 5.0.2 | MDX content rendering | Content collection uses MDX. Home page queries collection data (not rendering MDX bodies). |

### New Dependencies

**None required.** Phase 3 is pure composition using existing tooling. No GSAP yet (animations are Phase 5). No new packages needed.

## Architecture Patterns

### Project Structure for Phase 3

```
src/
├── components/
│   ├── CTAButton.astro          # NEW: Reusable CTA (home hero + resume download)
│   ├── FeaturedProjectItem.astro # NEW: Editorial project row (home page)
│   ├── SkillGroup.astro         # NEW: Grouped skill card (about page)
│   ├── ContactChannel.astro     # NEW: Contact card with icon (contact page)
│   ├── ResumeEntry.astro        # NEW: Experience/education entry (resume page)
│   ├── Header.astro             # EXISTING (Phase 2)
│   ├── Footer.astro             # EXISTING (Phase 2)
│   ├── MobileMenu.astro         # EXISTING (Phase 2)
│   └── SkipToContent.astro      # EXISTING (Phase 2)
├── pages/
│   ├── index.astro              # REPLACE stub with full home page
│   ├── about.astro              # REPLACE stub with full about page
│   ├── resume.astro             # REPLACE stub with full resume page
│   ├── contact.astro            # REPLACE stub with full contact page
│   └── projects.astro           # EXISTING stub (Phase 4)
├── content/
│   └── projects/
│       └── _sample.mdx          # EXISTING: has featured: true for home page query
├── layouts/
│   └── BaseLayout.astro         # EXISTING (Phase 2) -- no changes needed
├── styles/
│   └── global.css               # EXISTING (Phase 1) -- add pulse keyframes for availability badge
└── content.config.ts            # EXISTING (Phase 1) -- no changes needed
public/
└── resume.pdf                   # NEW: User-provided PDF for download
```

### Pattern 1: Astro Content Collection Query (Featured Projects)

**What:** Query the projects collection for featured items to display on the home page.
**When to use:** Home page needs to show 2-3 featured projects from the content collection.
**Example:**

```typescript
// In index.astro frontmatter
import { getCollection } from "astro:content";

const featuredProjects = (
  await getCollection("projects", ({ data }) => data.featured === true)
).sort((a, b) => a.data.order - b.data.order);
```

Source: [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/)

**Key detail:** The `_sample.mdx` file has `featured: true` and `order: 1`. The query will return it. Additional sample projects with `featured: true` should be added so the home page displays 2-3 items as intended. The underscore prefix does NOT prevent it from being included in the collection -- Astro's glob loader matches `**/*.mdx`.

### Pattern 2: Astro Component Props (Typed)

**What:** Pass typed props to reusable components.
**When to use:** CTAButton, FeaturedProjectItem, SkillGroup, ContactChannel, ResumeEntry all need typed props.
**Example:**

```typescript
// In CTAButton.astro
interface Props {
  href: string;
  label: string;
  download?: boolean;
  icon?: "download" | "arrow";
}
const { href, label, download = false, icon } = Astro.props;
```

### Pattern 3: Reusing SVG Icons from Footer

**What:** The Footer already has GitHub, LinkedIn, and email SVG icons inline. Contact page needs the same icons at 24x24 size.
**When to use:** ContactChannel component needs icons.
**Approach:** Extract SVG icons to standalone components or inline them directly in ContactChannel. Since there are only 3 icons and they are simple SVGs, inline duplication in the component is acceptable. Alternatively, extract to a shared `icons/` directory with named SVG components. Either approach works -- the UI-SPEC says "reuse GitHub/LinkedIn/email SVGs from Footer."

### Pattern 4: Empty State Handling

**What:** Handle case where no featured projects exist.
**When to use:** Home page featured projects section.
**Example:**

```astro
{featuredProjects.length > 0 ? (
  <section aria-label="Selected work">
    {/* render projects */}
  </section>
) : (
  <section aria-label="Selected work">
    <p class="text-text-secondary">Projects coming soon. Check back for updates on what I'm building.</p>
  </section>
)}
```

### Pattern 5: CSS Pulse Animation for Availability Badge

**What:** The availability badge on Contact page needs a pulsing dot animation.
**When to use:** Contact page availability indicator per D-13.
**Example:**

```css
/* In global.css or scoped <style> in contact.astro */
@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .pulse-ring { animation: none !important; }
}
```

### Anti-Patterns to Avoid

- **Hardcoding colors instead of using tokens:** Every color must use `text-{token}`, `bg-{token}`, `border-{token}` Tailwind utilities that reference `var(--token-*)`. Never use literal Tailwind colors like `text-gray-500`.
- **Using `text-text-secondary` for body text on `bg-bg-secondary`:** The UI-SPEC accessibility contract warns this combination is borderline AA contrast (approximately 4.2:1). Use `text-text-primary` for body-sized text on secondary backgrounds.
- **Creating React/Vue islands for static content:** All four pages are 100% static. No client-side JS needed (except Phase 5 animations). Use `.astro` components only.
- **Using `<button>` for navigation:** The CTAButton is a navigation element -- use `<a>` not `<button>`. The "View Projects" CTA navigates to /projects. The "Download PDF" CTA triggers a download link.
- **Breaking heading hierarchy:** Each page has exactly one `<h1>`. Sub-sections use `<h2>`. Do not skip levels.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Meta tags / SEO | Custom `<head>` meta management | `astro-seo` via BaseLayout props | Already wired. Pass `title` and `description` props. |
| Responsive images | Manual srcset/sizes | Astro `<Image />` / `<Picture />` | Automatic WebP/AVIF, proper dimensions. (Not needed in Phase 3 -- no images on these pages except resume PDF.) |
| Content querying | Manual file reading | `getCollection()` from `astro:content` | Type-safe, Zod-validated, built-in to Astro. |
| PDF embedding | Custom PDF viewer / iframe | Simple `<a download>` link | Per D-09, the resume is a styled summary + download button. Not a PDF viewer. |

## Common Pitfalls

### Pitfall 1: Forgetting View Transitions Lifecycle for Client Scripts
**What goes wrong:** If any page adds a `<script>` tag (e.g., for the pulse animation or future interactivity), it may not re-execute on client-side navigation via View Transitions.
**Why it happens:** Astro's ClientRouter (View Transitions) does a client-side page swap. Scripts in `<head>` or `<body>` don't re-run automatically.
**How to avoid:** Phase 3 has no client scripts (pulse animation is pure CSS). But if any scripts are added, use the `astro:page-load` event pattern established in Phase 2.
**Warning signs:** Animation or behavior works on first load but breaks when navigating between pages.

### Pitfall 2: Content Collection Query Returns Empty Array
**What goes wrong:** Home page shows empty state even though _sample.mdx exists with `featured: true`.
**Why it happens:** The `_sample.mdx` references `thumbnail: "../../assets/images/sample-thumbnail.png"` -- if the image file is missing or path is wrong, the Zod schema validation fails at build time and the entire build breaks. The 70-byte `sample-thumbnail.png` is a placeholder that exists.
**How to avoid:** Ensure any new sample project MDX files also have valid thumbnail references. Use the existing `sample-thumbnail.png` or add new placeholder images.
**Warning signs:** `astro build` fails with Zod validation errors about image paths.

### Pitfall 3: Missing resume.pdf Breaks Download Button
**What goes wrong:** "Download PDF" button links to a 404.
**Why it happens:** The user has not yet placed `resume.pdf` in `public/`. The UI-SPEC explicitly lists this as a "Pending" dependency.
**How to avoid:** Implement the empty state: if `resume.pdf` does not exist, hide the download button and show "Full resume available on request." Alternatively, add a placeholder PDF during development and document that the user must replace it.
**Warning signs:** 404 on `/resume.pdf` in dev or production.

### Pitfall 4: Contrast Violation on Secondary Backgrounds
**What goes wrong:** Text is hard to read on `bg-bg-secondary` areas (skill groups, resume card, contact cards).
**Why it happens:** `text-text-secondary` on `bg-bg-secondary` is approximately 4.2:1 contrast -- borderline AA for body text (requires 4.5:1).
**How to avoid:** Use `text-text-primary` for all body-sized (16px) text on secondary backgrounds. Reserve `text-text-secondary` for large text (18px+) or labels/captions on secondary backgrounds, where AA large text threshold (3:1) applies.
**Warning signs:** Lighthouse accessibility audit flags contrast issues.

### Pitfall 5: Fluid Typography Not Applied Correctly
**What goes wrong:** Headings appear at fixed sizes instead of fluid.
**Why it happens:** Using `text-xl` or `text-5xl` Tailwind defaults instead of the custom fluid tokens.
**How to avoid:** Always use `text-[length:var(--token-text-display)]`, `text-[length:var(--token-text-heading)]`, `text-[length:var(--token-text-base)]`, `text-[length:var(--token-text-sm)]`. The `[length:]` prefix is required in Tailwind v4 for CSS custom properties that resolve to length values.
**Warning signs:** Typography does not scale between mobile and desktop.

### Pitfall 6: Home Page Hero Height on Short Viewports
**What goes wrong:** Hero content overflows or gets clipped on small mobile screens.
**Why it happens:** `min-h-[calc(100vh-4rem)]` forces minimum viewport height, but content (name + role + tagline + CTA) may not fit on very short viewports (e.g., landscape phones).
**How to avoid:** Use `min-h-[calc(100vh-4rem)]` with flex centering, which naturally allows the content to exceed the viewport and scroll. Do not use `h-[calc(100vh-4rem)]` (fixed height) which would clip content.
**Warning signs:** Content cut off on landscape mobile or short browser windows.

## Code Examples

### Querying Featured Projects

```typescript
// src/pages/index.astro (frontmatter)
import { getCollection } from "astro:content";
import BaseLayout from "../layouts/BaseLayout.astro";
import CTAButton from "../components/CTAButton.astro";
import FeaturedProjectItem from "../components/FeaturedProjectItem.astro";

const featuredProjects = (
  await getCollection("projects", ({ data }) => data.featured === true)
).sort((a, b) => a.data.order - b.data.order);
```

Source: [Astro Content Collections API](https://docs.astro.build/en/reference/modules/astro-content/)

### CTAButton Component Pattern

```astro
---
// src/components/CTAButton.astro
interface Props {
  href: string;
  label: string;
  download?: boolean;
  showDownloadIcon?: boolean;
}
const { href, label, download = false, showDownloadIcon = false } = Astro.props;
---
<a
  href={href}
  download={download || undefined}
  aria-label={download ? `Download ${label}` : undefined}
  class="inline-flex items-center gap-[var(--token-space-sm)] border border-accent text-accent
         px-[var(--token-space-lg)] py-[var(--token-space-sm)]
         font-body text-[length:var(--token-text-base)] font-semibold uppercase tracking-[0.05em]
         rounded transition-colors duration-200
         hover:bg-accent hover:text-bg-primary
         focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
>
  {label}
  {showDownloadIcon && (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )}
</a>
```

### Availability Badge Pulse CSS

```css
/* Add to global.css or scoped <style> in contact.astro */
.availability-dot {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--token-accent);
  flex-shrink: 0;
}

.availability-dot::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-color: var(--token-accent);
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .availability-dot::before {
    animation: none;
    display: none;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Astro legacy content collections | Content Layer API with `glob()` loader | Astro 5.0+ (required in 6.0) | `defineCollection` + `glob` loader already used in `content.config.ts`. Legacy API removed in Astro 6. |
| `@astrojs/tailwind` integration | `@tailwindcss/vite` plugin | Tailwind v4 (Jan 2025) | Already configured in `astro.config.mjs`. |
| Fontsource packages | Astro 6 Fonts API | Astro 6.0 (March 2026) | Already configured with `fontProviders.google()`. |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | none -- needs creation (Wave 0) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-01 | Hero has name, role, tagline, CTA link to /projects | smoke (build check) | `npx astro build` (Zod validates content) | N/A -- build-time |
| HOME-02 | Featured projects section renders from content collection | unit | Check `getCollection` query returns featured items | No -- Wave 0 |
| HOME-03 | About teaser with link to /about exists | smoke | Build + manual check | N/A |
| HOME-04 | Links to /resume and /contact exist | smoke | Build + manual check | N/A |
| ABUT-01 | Narrative with education, journey, interests | manual-only | Visual review of content | N/A |
| ABUT-02 | Professional but human tone | manual-only | Copywriting review | N/A |
| ABUT-03 | Skills grouped by context, no progress bars | manual-only | Visual review | N/A |
| RESM-01 | Resume content rendered on-page | smoke | Build succeeds + manual check | N/A |
| RESM-02 | PDF download button above fold | manual-only | Visual review | N/A |
| CNTC-01 | Email, LinkedIn, GitHub links present and correct | smoke | Build + check link targets | N/A |

### Sampling Rate

- **Per task commit:** `npx astro build` (catches Zod schema errors, broken imports, TypeScript errors)
- **Per wave merge:** `npx astro build && npx astro preview` (visual check all 4 pages)
- **Phase gate:** Full build green + visual audit of all 4 pages across mobile/desktop

### Wave 0 Gaps

- [ ] `vitest.config.ts` -- basic Vitest configuration (Vitest is installed but has no config)
- [ ] Additional sample MDX files in `src/content/projects/` with `featured: true` so home page shows 2-3 featured projects (currently only 1)
- [ ] `public/resume.pdf` -- placeholder PDF for development (user replaces later)

Note: Most Phase 3 requirements are visual/content composition verified by build success + manual visual review. Automated unit tests have limited value for static page content. The primary automated gate is `astro build` which runs TypeScript checks and Zod validation.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro 6 runtime | Yes | 22.16.0 | -- |
| Astro | Framework | Yes | 6.0.8 | -- |
| Tailwind CSS | Styling | Yes | 4.2.2 | -- |
| Vitest | Testing | Yes | 4.1.0 | -- |
| pnpm | Package management | Yes | (in use) | npm |

**Missing dependencies with no fallback:**
- `public/resume.pdf` -- user must provide this file. Can use a placeholder during development.

**Missing dependencies with fallback:**
- None

## Open Questions

1. **How many featured projects should exist for a good home page?**
   - What we know: UI-SPEC says 2-3 projects. Currently only `_sample.mdx` exists with `featured: true`.
   - What's unclear: Whether to add more placeholder MDX files in Phase 3 or wait for Phase 4.
   - Recommendation: Add 2-3 sample MDX files with `featured: true` and different `order` values so the home page displays a realistic featured projects section. They use the same placeholder thumbnail. Phase 4 replaces them with real content.

2. **Resume PDF availability timing**
   - What we know: D-10 says "PDF is ready -- user has a resume PDF to include." UI-SPEC lists it as "Pending."
   - What's unclear: Whether to block on this or use a placeholder.
   - Recommendation: Create a minimal placeholder PDF and document that user must replace it. Implement the "no PDF" fallback as well for robustness.

3. **Pulse animation placement -- global.css vs scoped style**
   - What we know: The availability badge uses a CSS `@keyframes` animation.
   - What's unclear: Whether to add to `global.css` (accessible everywhere) or scope to `contact.astro`.
   - Recommendation: Use a `<style>` block in `contact.astro` since the animation is page-specific. Astro scopes `<style>` tags by default, but `@keyframes` defined within work correctly. Alternatively, use `<style is:global>` if scoping causes issues with pseudo-elements.

## Sources

### Primary (HIGH confidence)
- [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/) -- `getCollection()` filter API, sorting
- [Astro Content Collections Guide](https://docs.astro.build/en/guides/content-collections/) -- Collection setup, querying patterns
- Project codebase: `src/content.config.ts`, `src/layouts/BaseLayout.astro`, `src/pages/*.astro`, `src/styles/global.css`, `src/components/Footer.astro` -- existing patterns and tokens
- Phase 3 UI-SPEC: `.planning/phases/03-core-pages/03-UI-SPEC.md` -- detailed component specs, layouts, copy, accessibility
- Phase 3 CONTEXT.md: `.planning/phases/03-core-pages/03-CONTEXT.md` -- 14 locked design decisions

### Secondary (MEDIUM confidence)
- Tailwind CSS v4 arbitrary value syntax: `text-[length:var(--token-*)]` pattern verified in existing codebase (Phase 1/2 established this)

### Tertiary (LOW confidence)
- None

## Project Constraints (from CLAUDE.md)

- **Design process:** All visual/UI/UX decisions routed through frontend-design skill -- the UI-SPEC is the design authority
- **Tech stack:** Astro 6 + Tailwind CSS v4 + GSAP (GSAP not used in Phase 3 -- animations are Phase 5)
- **Content:** Project details are placeholder for v1 -- structure must support easy content replacement
- **Audience:** Must serve both 30-second recruiter scans and 10-minute engineer deep dives
- **Token architecture:** All colors via `var(--token-*)` through Tailwind `@theme` bridge -- never use literal colors
- **Font system:** `font-display` (Instrument Serif), `font-body` (Instrument Sans), `font-mono` (JetBrains Mono)
- **Fluid typography:** Use `--token-text-*` custom properties with `[length:]` Tailwind prefix
- **Dark-first:** `:root` = dark theme. No light theme until Phase 5.
- **View Transitions:** ClientRouter active. Scripts must handle `astro:page-load` lifecycle.
- **RTK prefix:** All shell commands must use `rtk` prefix per global CLAUDE.md.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, everything already installed and proven in Phase 1/2
- Architecture: HIGH -- straightforward static page composition using established patterns
- Pitfalls: HIGH -- identified from direct codebase analysis and UI-SPEC accessibility notes

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (30 days -- stable domain, no moving parts)
