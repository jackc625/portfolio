# Phase 4: Project System & Case Studies - Research

**Researched:** 2026-03-30
**Domain:** Astro content collections, MDX rendering, dynamic routing, responsive image handling, editorial layout patterns
**Confidence:** HIGH

## Summary

Phase 4 builds the projects page (hybrid featured cards + editorial list layout) and individual case study pages using Astro's content collections with MDX. The technical foundation is already solid: Astro 6's Content Layer API with glob loader, Zod schema validation, and the `render()` function for MDX compilation are all in place. The existing `content.config.ts` schema needs only one change (making `thumbnail` optional) to support the decisions from CONTEXT.md.

The main implementation work falls into three areas: (1) the projects page with its hybrid layout splitting `featured: true` projects into cards and the rest into the editorial list using the existing `FeaturedProjectItem.astro` pattern, (2) a dynamic route at `src/pages/projects/[id].astro` that uses `getStaticPaths()` to generate individual case study pages from MDX content, and (3) 5-6 MDX content files with structured case study sections matching the Phase 3 inner page pattern (mono uppercase label + asymmetric 1fr/2fr grid).

**Primary recommendation:** Use Astro's built-in content collection routing pattern (`getCollection()` + `getStaticPaths()` + `render()`) for everything. Create a reusable case study layout component that renders the structured sections (Problem, Solution & Approach, Tech Stack Detail, Challenges & Lessons) in the established asymmetric grid pattern. Pass a custom `img` component to `<Content />` for image captions with `<figure>`/`<figcaption>`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Hybrid layout on projects page -- top 3 featured cards + editorial list below
- **D-02:** Total project count is Claude's discretion (5-6 range)
- **D-03:** No category labels on project cards -- just title, tagline, tech tags, thumbnail (for featured)
- **D-04:** No status badges on cards
- **D-05:** Links only on case study pages, not on editorial list items
- **D-06:** No filtering or sorting controls -- fixed manual order via `order` field
- **D-07:** Hero summary + scroll sections on case study pages
- **D-08:** Case study sections: Problem, Solution & Approach, Tech Stack Detail, Challenges & Lessons. Results/Outcome at Claude's discretion per project.
- **D-09:** Match Phase 3 inner page pattern -- mono uppercase label + asymmetric grid
- **D-10:** Next project navigation at bottom of each case study
- **D-11:** Real screenshots when available, solid color + title fallback
- **D-12:** Thumbnail field made optional in schema
- **D-13:** 16:9 landscape aspect ratio for case study hero images
- **D-14:** Image captions supported (small muted text below images)
- **D-15:** Media treatment within case study sections is Claude's discretion
- **D-16:** Placeholder content for all projects -- Claude has full discretion on themes, types, depth, length
- **D-17:** First-person conversational tone
- **D-18:** No code snippets in case studies -- prose only
- **D-19:** Case study length is Claude's discretion
- **D-20:** URLs: /projects/[slug]
- **D-21:** Slug derived from MDX filename (Astro default behavior)
- **D-22:** Projects page header/intro content is Claude's discretion
- **D-23:** Featured cards stack to single column on mobile
- **D-24:** Schema changes are Claude's discretion -- at minimum make thumbnail optional

### Claude's Discretion
- Total project count (5-6 range)
- Projects page intro text and layout
- Placeholder project themes, types, content, and length
- Media placement within case study sections (full-width vs inline)
- Results/Outcome section inclusion per project
- Schema field additions beyond making thumbnail optional
- Featured card visual treatment within shiyunlu.com design system

### Deferred Ideas (OUT OF SCOPE)
- **ENHP-01:** Project filtering by category/tech -- v2
- **ENHP-02:** Interactive embedded demos -- v2
- Code snippets in case studies -- user explicitly chose prose-only
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROJ-01 | Projects page with scan-friendly card grid (title, one-line description, tech tags, thumbnail per card) | Hybrid layout: `getCollection('projects')` sorted by `order`, split by `featured` boolean. Featured cards with thumbnails + editorial list for rest. Uses existing design token system and `FeaturedProjectItem.astro` pattern. |
| PROJ-02 | Cards link to individual project detail/case study pages | Dynamic route `src/pages/projects/[id].astro` with `getStaticPaths()`. Links use `/projects/${entry.id}` pattern. |
| PROJ-03 | 5-6 project slots with placeholder content structure | MDX files in `src/content/projects/` with structured frontmatter. Replace existing 3 placeholders, add 2-3 more. |
| PROJ-04 | Each project card shows tech stack tags for quick scanning | Already in schema (`techStack: z.array(z.string())`). Render as pill/tag chips matching `SkillGroup` component pattern. |
| CASE-01 | Structured case study template: Problem > Solution > Tech Stack > Challenges > Results > Lessons Learned | Case study layout component with sections rendered in asymmetric grid. MDX `<Content />` renders the body. Sections defined in MDX with H2 headings. |
| CASE-02 | Each case study includes links to GitHub repo and/or live demo where available | Schema already has `githubUrl` and `demoUrl` as optional fields. Render in hero summary section of case study page. |
| CASE-03 | Case study pages support embedded screenshots and visual media | Custom `ArticleImage.astro` component passed via `<Content components={{ img: ArticleImage }} />`. Supports local images via Astro `<Image />` and external URLs. Figcaption for captions. |
| CASE-04 | Progressive disclosure -- overview/summary visible first, technical depth on scroll | Hero section with title, tagline, tech tags, hero image visible above fold. Detailed sections (Problem, Solution, etc.) scroll below. |
| CASE-05 | At least 2 fully written case studies before production deployment | Write 2 MDX files with complete non-placeholder prose content. Remaining 3-4 get structural placeholder content. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Design process**: All visual/UI/UX decisions routed through frontend-design skill (BUT Phase 3 D-04 bypasses this -- shiyunlu.com IS the design spec)
- **Tech stack**: Astro 6, Tailwind CSS v4, TypeScript, Content Collections with MDX, Astro Image
- **Content**: Project details are placeholder for v1 -- structure must support easy content replacement
- **Audience**: Must serve both 30-second recruiter scans (projects page grid) and 10-minute engineer deep dives (case study pages)
- **RTK prefix**: All bash commands must use `rtk` prefix per CLAUDE.md

## Standard Stack

### Core (already installed, no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro Content Collections | built-in (6.0.8) | Typed content management with Zod schemas | Already configured with glob loader and project schema. Content Layer API required in Astro 6. |
| `@astrojs/mdx` | 5.0.2 | MDX rendering in content collections | Already installed. Renders MDX to static HTML at build time. Zero client JS. |
| Astro `<Image />` / `<Picture />` | built-in | Responsive image optimization | Sharp-based. Auto-generates WebP/AVIF, srcset, lazy loading, width/height for zero CLS. |
| Zod | 4.x (bundled) | Schema validation | Bundled with Astro 6. Used in `content.config.ts` for frontmatter validation at build time. |
| Tailwind CSS | 4.2.2 | Styling | Already configured via `@tailwindcss/vite`. All styling uses design tokens. |

### No New Dependencies Required

This phase requires zero new npm packages. Everything needed is already installed:
- Content collections + MDX: `astro` + `@astrojs/mdx`
- Image optimization: `astro:assets` (built-in)
- Schema validation: `astro/zod` (bundled)
- Styling: `tailwindcss` + design tokens in `global.css`

## Architecture Patterns

### Recommended Project Structure
```
src/
├── content/
│   └── projects/
│       ├── project-alpha.mdx          # Full case study (1 of 2)
│       ├── project-beta.mdx           # Full case study (2 of 2)
│       ├── project-gamma.mdx          # Placeholder
│       ├── project-delta.mdx          # Placeholder
│       ├── project-epsilon.mdx        # Placeholder
│       └── project-zeta.mdx           # Placeholder (if 6 total)
├── assets/
│   └── images/
│       └── projects/                  # Project screenshots/thumbnails
│           ├── project-alpha-hero.png
│           ├── project-alpha-thumb.png
│           └── ...
├── components/
│   ├── FeaturedProjectItem.astro      # EXISTING - editorial list item
│   ├── ProjectCard.astro              # NEW - featured project card with thumbnail
│   ├── ArticleImage.astro             # NEW - MDX image wrapper with figcaption
│   ├── CaseStudySection.astro         # NEW - asymmetric grid section wrapper
│   └── NextProject.astro              # NEW - next project navigation
├── layouts/
│   └── BaseLayout.astro               # EXISTING - reuse as-is
├── pages/
│   ├── projects.astro                 # EXISTING stub - rebuild with hybrid layout
│   └── projects/
│       └── [id].astro                 # NEW - dynamic case study route
└── styles/
    └── global.css                     # EXISTING - no changes needed
```

### Pattern 1: Content Collection Query + Sort + Split
**What:** Query all projects, sort by `order`, split into featured and non-featured groups.
**When to use:** Projects page rendering.
**Example:**
```astro
---
// src/pages/projects.astro
import { getCollection } from "astro:content";

const allProjects = await getCollection("projects");
const sorted = allProjects.sort((a, b) => a.data.order - b.data.order);
const featured = sorted.filter((p) => p.data.featured);
const editorial = sorted.filter((p) => !p.data.featured);
---
```
Source: [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/)

### Pattern 2: Dynamic Route from Content Collection
**What:** Generate static pages for each project using `getStaticPaths()`.
**When to use:** Individual case study pages.
**Example:**
```astro
---
// src/pages/projects/[id].astro
import { getCollection, render } from "astro:content";
import ArticleImage from "../../components/ArticleImage.astro";

export async function getStaticPaths() {
  const projects = await getCollection("projects");
  return projects.map((project) => ({
    params: { id: project.id },
    props: { project },
  }));
}

const { project } = Astro.props;
const { Content } = await render(project);
---

<Content components={{ img: ArticleImage }} />
```
Source: [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/)

### Pattern 3: MDX Custom Image Component with Figcaption
**What:** Replace default `<img>` in rendered MDX with a `<figure>` + `<figcaption>` wrapper using Astro's `<Image />` for optimization.
**When to use:** Case study pages where images need captions (D-14).
**Example:**
```astro
---
// src/components/ArticleImage.astro
import type { ImageMetadata } from "astro";
import { Image } from "astro:assets";

interface Props {
  src: string | ImageMetadata;
  alt: string;
}

const { src, alt } = Astro.props;
---

<figure class="my-[var(--token-space-xl)]">
  {typeof src === "string" ? (
    <img src={src} alt={alt} class="w-full rounded aspect-video object-cover" loading="lazy" />
  ) : (
    <Image src={src} alt={alt} class="w-full rounded aspect-video object-cover" />
  )}
  {alt && (
    <figcaption class="font-mono text-[length:var(--token-text-sm)] text-text-muted mt-[var(--token-space-sm)]">
      {alt}
    </figcaption>
  )}
</figure>
```
Source: [Custom image component pattern for Astro collections](https://www.kozhuhds.com/blog/assigning-custom-components-to-html-elements-in-astro-collections-image-with-figcaption-example/)

### Pattern 4: Asymmetric Grid Section (Phase 3 Inner Page Pattern)
**What:** Reusable section component matching the established pattern: mono uppercase label on the left, content in the right 2fr column.
**When to use:** Every case study section (Problem, Solution, Challenges, etc.) and the projects page header.
**Example:**
```astro
---
// src/components/CaseStudySection.astro
interface Props {
  label: string;
}
const { label } = Astro.props;
---

<section aria-label={label} class="pb-[var(--token-space-section)] px-6 md:px-10 lg:px-16">
  <div class="max-w-[90rem] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-[var(--token-space-3xl)]">
    <div>
      <p class="font-mono text-[length:var(--token-text-sm)] text-text-muted uppercase tracking-[0.08em]">
        {label}
      </p>
    </div>
    <div class="max-w-2xl">
      <slot />
    </div>
  </div>
</section>
```
Source: Established pattern from `src/pages/about.astro` (Phase 3)

### Pattern 5: Next Project Navigation
**What:** At the bottom of each case study, link to the next project in order (wrapping from last to first).
**When to use:** Bottom of every case study page (D-10).
**Example:**
```astro
---
// In [id].astro getStaticPaths
const projects = await getCollection("projects");
const sorted = projects.sort((a, b) => a.data.order - b.data.order);

return sorted.map((project, index) => {
  const nextProject = sorted[(index + 1) % sorted.length];
  return {
    params: { id: project.id },
    props: { project, nextProject },
  };
});
---
```

### Pattern 6: Optional Thumbnail Fallback
**What:** When `thumbnail` is undefined, render a solid-color placeholder card with the project title centered.
**When to use:** Featured project cards on the projects page (D-11, D-12).
**Example:**
```astro
{project.data.thumbnail ? (
  <Image
    src={project.data.thumbnail}
    alt={`${project.data.title} thumbnail`}
    class="w-full aspect-video object-cover"
  />
) : (
  <div class="w-full aspect-video bg-bg-secondary flex items-center justify-center">
    <span class="font-display text-[length:var(--token-text-heading)] text-text-muted">
      {project.data.title}
    </span>
  </div>
)}
```

### Anti-Patterns to Avoid
- **Custom routing logic:** Do NOT build a custom routing system. Astro's `getStaticPaths()` handles everything.
- **Client-side filtering/sorting:** Do NOT add JS-based project filtering. All projects render at build time in fixed order (D-06).
- **Separate layout for case studies:** Do NOT create a separate layout. Use `BaseLayout.astro` and compose case study sections inside it, matching other inner pages.
- **Inline styles for design tokens:** Always use `var(--token-*)` CSS custom properties or Tailwind utility classes that reference them. Never hardcode colors/spacing.
- **React/Vue islands for project cards:** Everything is static HTML. No framework islands needed.
- **Importing images in MDX frontmatter as strings:** Use the `image()` Zod helper in the schema for thumbnail. It validates and processes the image at build time. MDX body images use standard markdown syntax `![alt](./path.png)`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dynamic routing | Custom file router or client-side routing | `getStaticPaths()` + `[id].astro` | Astro handles static path generation, 404s, and build-time validation |
| Image optimization | Custom Sharp pipeline or image processing | Astro `<Image />` / `<Picture />` | Built-in: WebP/AVIF, srcset, lazy loading, CLS prevention |
| Content validation | Custom frontmatter parser or validation | Zod schema in `content.config.ts` | Build-time validation with TypeScript inference |
| MDX rendering | Custom markdown parser | `render()` from `astro:content` | Returns `<Content />` component with heading extraction |
| Image captions | Custom markdown plugin | `ArticleImage.astro` passed via `components` prop | Simple Astro component, no plugin configuration needed |
| Sitemap for new routes | Manual sitemap updates | `@astrojs/sitemap` integration | Already installed -- auto-discovers new `/projects/*` routes at build time |

**Key insight:** Astro 6's content collection system handles the entire content pipeline: schema validation, type safety, MDX compilation, image optimization, and static route generation. The only custom code needed is layout components and the page templates.

## Common Pitfalls

### Pitfall 1: Content Collection ID vs Slug Confusion
**What goes wrong:** Using `entry.slug` instead of `entry.id` in Astro 6. The Content Layer API uses `id` not `slug`.
**Why it happens:** Astro 4/5 legacy collections used `slug`. Astro 6's glob loader uses `id` (slugified from filename).
**How to avoid:** Always use `entry.id` for routing params and links. For a file `project-alpha.mdx`, the id is `project-alpha`.
**Warning signs:** Build errors about undefined `slug` property.

### Pitfall 2: Image Path Resolution in MDX
**What goes wrong:** Images referenced in MDX body content fail to resolve.
**Why it happens:** Relative paths in MDX are relative to the MDX file location. If images are in `src/assets/images/projects/`, the MDX file in `src/content/projects/` needs `../../assets/images/projects/filename.png`.
**How to avoid:** Keep a consistent path convention. Use `../../assets/images/projects/` prefix from any MDX file in the projects collection.
**Warning signs:** Build warnings about unresolved image imports.

### Pitfall 3: Missing getStaticPaths Export
**What goes wrong:** Dynamic route page builds but returns 404 for all routes.
**Why it happens:** Forgetting to export `getStaticPaths()` from the `[id].astro` file.
**How to avoid:** Always include `export async function getStaticPaths()` as the first function in the frontmatter.
**Warning signs:** Astro build warning about missing `getStaticPaths`.

### Pitfall 4: Thumbnail Schema Change Breaking Existing MDX Files
**What goes wrong:** Making `thumbnail` optional in the schema but existing MDX files still reference the old required `thumbnail` field with a path to the tiny 70-byte placeholder image.
**Why it happens:** Schema change without updating content files.
**How to avoid:** Update all MDX files simultaneously when changing the schema. Either provide real thumbnails or remove the `thumbnail` field from frontmatter (letting it be `undefined`).
**Warning signs:** Build-time Zod validation errors.

### Pitfall 5: View Transitions Breaking Page State
**What goes wrong:** Navigating between case study pages via "next project" doesn't re-render the page properly.
**Why it happens:** `ClientRouter` (View Transitions) persists page state. Scripts need to re-initialize on `astro:page-load`.
**How to avoid:** Any client-side scripts on case study pages must listen for `astro:page-load` (not `DOMContentLoaded`). For this phase (no GSAP yet), this is mostly a non-issue since pages are fully static.
**Warning signs:** Stale content or scroll position when navigating between projects.

### Pitfall 6: Large Placeholder Images Bloating Build
**What goes wrong:** Using high-resolution screenshots as placeholder thumbnails increases build time and output size.
**Why it happens:** Astro processes every image through Sharp at build time.
**How to avoid:** For placeholder projects, either omit thumbnails entirely (using the solid-color fallback from D-11) or use small optimized images. Real screenshots only needed for the 2 fully-written case studies.
**Warning signs:** Build taking significantly longer than before.

## Code Examples

### Content Schema Update (make thumbnail optional)
```typescript
// src/content.config.ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string().max(80),
      description: z.string(),
      techStack: z.array(z.string()).min(1),
      featured: z.boolean().default(false),
      status: z.enum(["completed", "in-progress"]),
      githubUrl: z.string().url().optional(),
      demoUrl: z.string().url().optional(),
      thumbnail: image().optional(),  // CHANGED: was image() (required)
      category: z.enum(["web-app", "cli-tool", "library", "api", "other"]),
      order: z.number().int().min(1),
    }),
});

export const collections = { projects };
```
Source: Current `src/content.config.ts` + [Astro docs on optional image schema](https://docs.astro.build/en/guides/content-collections/)

### MDX Frontmatter Structure (Full Case Study)
```mdx
---
title: "Project Alpha"
tagline: "One-line description for card display"
description: "Longer description for case study intro and SEO."
techStack: ["TypeScript", "React", "Node.js", "PostgreSQL"]
featured: true
status: "completed"
githubUrl: "https://github.com/jackc625/project-alpha"
demoUrl: "https://project-alpha.example.com"
thumbnail: "../../assets/images/projects/project-alpha-thumb.png"
category: "web-app"
order: 1
---

## Problem

[First-person narrative about the problem this project solves]

## Solution & Approach

[How the problem was solved, architectural decisions]

## Tech Stack Detail

[Why specific technologies were chosen, how they fit together]

## Challenges & Lessons

[Honest account of difficulties and what was learned]

## Results

[Metrics or outcomes, if meaningful for this project]
```

### Projects Page Hybrid Layout
```astro
---
// src/pages/projects.astro
import BaseLayout from "../layouts/BaseLayout.astro";
import ProjectCard from "../components/ProjectCard.astro";
import FeaturedProjectItem from "../components/FeaturedProjectItem.astro";
import { getCollection } from "astro:content";

const allProjects = await getCollection("projects");
const sorted = allProjects.sort((a, b) => a.data.order - b.data.order);
const featured = sorted.filter((p) => p.data.featured);
const editorial = sorted.filter((p) => !p.data.featured);
---

<BaseLayout title="Projects" description="...">
  <!-- Page Header -->
  <section class="pt-[var(--token-space-section)] pb-[var(--token-space-3xl)] px-6 md:px-10 lg:px-16">
    <div class="max-w-[90rem] mx-auto">
      <p class="font-mono text-[length:var(--token-text-sm)] text-text-muted uppercase tracking-[0.1em] mb-[var(--token-space-lg)]">
        Projects
      </p>
      <h1 class="font-display text-[length:var(--token-text-display)] tracking-[-0.03em] leading-[0.95] max-w-4xl">
        Things I've built.
      </h1>
    </div>
  </section>

  <!-- Featured Cards Grid -->
  <section aria-label="Featured projects" class="pb-[var(--token-space-section)] px-6 md:px-10 lg:px-16">
    <div class="max-w-[90rem] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--token-space-xl)]">
      {featured.map((project) => (
        <ProjectCard project={project} />
      ))}
    </div>
  </section>

  <!-- Editorial List -->
  {editorial.length > 0 && (
    <section aria-label="More projects" class="pb-[var(--token-space-section)] px-6 md:px-10 lg:px-16">
      <div class="max-w-[90rem] mx-auto">
        {editorial.map((project) => (
          <FeaturedProjectItem
            title={project.data.title}
            tagline={project.data.tagline}
            techStack={project.data.techStack}
            slug={project.id}
          />
        ))}
      </div>
    </section>
  )}
</BaseLayout>
```

### Case Study Dynamic Route
```astro
---
// src/pages/projects/[id].astro
import BaseLayout from "../../layouts/BaseLayout.astro";
import ArticleImage from "../../components/ArticleImage.astro";
import CaseStudySection from "../../components/CaseStudySection.astro";
import NextProject from "../../components/NextProject.astro";
import { getCollection, render } from "astro:content";
import { Image } from "astro:assets";

export async function getStaticPaths() {
  const projects = await getCollection("projects");
  const sorted = projects.sort((a, b) => a.data.order - b.data.order);
  return sorted.map((project, index) => {
    const nextProject = sorted[(index + 1) % sorted.length];
    return {
      params: { id: project.id },
      props: { project, nextProject },
    };
  });
}

const { project, nextProject } = Astro.props;
const { Content } = await render(project);
---

<BaseLayout
  title={project.data.title}
  description={project.data.description}
>
  <!-- Hero Summary -->
  <section class="pt-[var(--token-space-section)] pb-[var(--token-space-3xl)] px-6 md:px-10 lg:px-16">
    <div class="max-w-[90rem] mx-auto">
      <!-- Title + meta -->
      <!-- Hero image (16:9) -->
      <!-- GitHub/Demo links -->
    </div>
  </section>

  <!-- MDX Body Content -->
  <article class="pb-[var(--token-space-section)] px-6 md:px-10 lg:px-16">
    <div class="max-w-[90rem] mx-auto">
      <Content components={{ img: ArticleImage }} />
    </div>
  </article>

  <!-- Next Project -->
  <NextProject project={nextProject} />
</BaseLayout>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `entry.slug` for routing | `entry.id` for routing | Astro 6 (March 2026) | Content Layer API replaced legacy collections. `id` is now the canonical identifier. |
| Legacy content collections | Content Layer API with `glob()` loader | Astro 5+ (required in 6) | Must use `glob()` loader in `defineCollection()`. Already configured correctly in this project. |
| `entry.render()` method | `render(entry)` function import | Astro 6 | Import `render` from `astro:content`. No longer a method on the entry object. |
| `@astrojs/image` integration | Built-in `astro:assets` | Astro 3+ | `<Image />` and `<Picture />` from `astro:assets`. No separate integration needed. |

## Open Questions

1. **Placeholder project screenshots**
   - What we know: D-11 says solid color + title fallback for projects without screenshots. D-12 makes thumbnail optional.
   - What's unclear: For the 2 fully-written case studies, should we generate actual placeholder screenshots (e.g., styled divs captured as PNGs) or use the solid-color fallback for now?
   - Recommendation: Use solid-color fallback for ALL projects in v1. Real screenshots will come when placeholder content is replaced with real projects. Keeps the build simple and avoids bloating with fake images.

2. **MDX body structure: H2 headings as section dividers vs component-based sections**
   - What we know: Case study content needs structured sections (Problem, Solution, etc.) rendered in asymmetric grid.
   - What's unclear: Should sections be defined in MDX as `## Problem` H2 headings (and the template wraps each section in the grid), or should MDX import `<CaseStudySection>` components directly?
   - Recommendation: Use H2 headings in MDX for simplicity and content portability. The `[id].astro` template can either (a) render the full `<Content />` with prose styling inside a single grid, or (b) parse headings from the `render()` result to split content into sections. Option (a) is simpler and recommended for v1. The asymmetric grid pattern can apply to the hero section, with the MDX body rendered in a constrained-width prose container.

3. **Hero image source for case studies**
   - What we know: D-13 requires 16:9 landscape hero images. D-07 describes the hero section.
   - What's unclear: Should the hero image come from the `thumbnail` frontmatter field (reused at larger size) or from a separate `heroImage` schema field?
   - Recommendation: Reuse the `thumbnail` field for the hero image at full width. A single image source is simpler. If a project needs different hero vs thumbnail images in the future, a `heroImage` field can be added later. For v1 with placeholder/fallback images, one field is sufficient.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | none -- see Wave 0 |
| Quick run command | `rtk vitest run` |
| Full suite command | `rtk vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROJ-01 | Projects page renders featured cards + editorial list | smoke (build) | `rtk npm run build` | n/a (build verification) |
| PROJ-02 | Project cards link to /projects/[id] | smoke (build) | `rtk npm run build` (generates routes) | n/a |
| PROJ-03 | 5-6 project MDX files exist with valid frontmatter | unit | `rtk vitest run tests/content-schema.test.ts -x` | Wave 0 |
| PROJ-04 | Tech stack tags rendered on project cards | smoke (build) | `rtk npm run build` | n/a |
| CASE-01 | Case study pages have structured sections | smoke (build) | `rtk npm run build` | n/a |
| CASE-02 | GitHub/demo links render when present | unit | `rtk vitest run tests/content-schema.test.ts -x` | Wave 0 |
| CASE-03 | Image component handles both local and string src | unit | `rtk vitest run tests/article-image.test.ts -x` | Wave 0 |
| CASE-04 | Progressive disclosure (hero above fold, detail below) | manual-only | Visual inspection | n/a |
| CASE-05 | 2+ case studies with non-placeholder content | manual-only | Content review | n/a |

### Sampling Rate
- **Per task commit:** `rtk npm run build` (ensures no build breaks)
- **Per wave merge:** `rtk vitest run` (full suite) + `rtk npm run build`
- **Phase gate:** Full suite green + successful build before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration file (framework installed but unconfigured)
- [ ] `tests/content-schema.test.ts` -- Validates project collection schema, MDX frontmatter, file count
- [ ] `tests/article-image.test.ts` -- Tests ArticleImage component prop handling (optional, can skip if build-only verification is sufficient)

Note: Most requirements are best verified by a successful `astro build` (which validates content schemas, generates all routes, and processes all images) rather than unit tests. The build IS the test for content-driven static sites.

## Sources

### Primary (HIGH confidence)
- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/) -- `getCollection()`, `render()`, filtering, dynamic route generation
- [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/) -- `getEntry()`, `getCollection()`, entry structure, `id` property
- [Astro Images docs](https://docs.astro.build/en/guides/images/) -- `<Image />`, `<Picture />`, content collection image schema, layout prop
- [Astro MDX Integration docs](https://docs.astro.build/en/guides/integrations-guide/mdx/) -- Component passing, MDX rendering in collections
- [Astro Routing docs](https://docs.astro.build/en/guides/routing/) -- `getStaticPaths()`, dynamic route file naming

### Secondary (MEDIUM confidence)
- [Custom image components for Astro collections](https://www.kozhuhds.com/blog/assigning-custom-components-to-html-elements-in-astro-collections-image-with-figcaption-example/) -- ArticleImage pattern with figcaption
- [Astro content collection optional image schema](https://github.com/withastro/roadmap/discussions/831) -- `image().optional()` pattern confirmation

### Tertiary (LOW confidence)
- None -- all findings verified against official Astro documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and configured, no new dependencies
- Architecture: HIGH -- patterns derived from existing codebase (Phase 3 pages) + official Astro docs
- Pitfalls: HIGH -- based on Astro 6 API changes (id vs slug) and verified against docs
- Content structure: MEDIUM -- MDX body organization (H2 sections vs components) has tradeoffs; recommended simpler approach

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable -- no fast-moving dependencies)
