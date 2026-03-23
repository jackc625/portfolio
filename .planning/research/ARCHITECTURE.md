# Architecture Research

**Domain:** Personal developer portfolio website (multi-page, content-driven, static-first)
**Researched:** 2026-03-22
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Layouts  │  │  Pages   │  │Sections  │  │  Islands  │       │
│  │ (shells)  │  │ (routes) │  │ (blocks) │  │(interact)│       │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘       │
│        │             │             │             │              │
├────────┴─────────────┴─────────────┴─────────────┴──────────────┤
│                     Component Layer                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Reusable UI Components (buttons, cards, tags, etc.)     │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     Content Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Projects    │  │    Site      │  │   Resume     │          │
│  │  Collection   │  │   Metadata   │  │    Data      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                         │
│  ┌────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐      │
│  │  Build  │  │   SEO    │  │  View   │  │   Static     │      │
│  │ (Vite)  │  │ (meta/OG)│  │ Trans.  │  │  Hosting     │      │
│  └────────┘  └──────────┘  └─────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

This is an **Islands Architecture** -- the entire site renders as static HTML at build time, with small "islands" of JavaScript hydrated only where interactivity is explicitly needed. This means near-zero JavaScript shipped by default, with progressive enhancement for interactive elements.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Layouts** | Page shells providing consistent chrome (header, footer, meta tags, transitions) | Astro layout components wrapping `<slot />` |
| **Pages** | Route definitions, data fetching, section composition | Astro `.astro` files in `src/pages/` |
| **Sections** | Full-width page blocks (Hero, ProjectGrid, SkillsList, Timeline) | Astro components receiving data as props |
| **Islands** | Interactive UI elements that require client-side JavaScript | Framework components (React/Preact) with `client:*` directives |
| **UI Components** | Atomic, reusable building blocks (Button, Card, Tag, Badge) | Astro components or framework components depending on interactivity |
| **Content Collections** | Typed, schema-validated project data, resume data, site metadata | Markdown/MDX files + Zod schemas in `src/content/` |
| **SEO Layer** | Meta tags, Open Graph, JSON-LD structured data, sitemap, robots.txt | Head component + Astro integrations (`@astrojs/sitemap`) |
| **View Transitions** | Smooth animated page navigation without full page reloads | Astro `<ClientRouter />` + `transition:animate` directives |

## Recommended Project Structure

```
src/
├── pages/                    # Route definitions (file-based routing)
│   ├── index.astro           # Home page
│   ├── about.astro           # About page
│   ├── projects/
│   │   ├── index.astro       # Projects listing page
│   │   └── [slug].astro      # Dynamic project detail/case study pages
│   ├── resume.astro          # Resume page
│   └── contact.astro         # Contact page
├── layouts/                  # Page shell templates
│   ├── BaseLayout.astro      # Root layout (html, head, body, meta, transitions)
│   └── ProjectLayout.astro   # Layout for project case study pages
├── components/               # Reusable UI components
│   ├── sections/             # Full-width page sections
│   │   ├── Hero.astro        # Home hero section
│   │   ├── ProjectGrid.astro # Projects listing grid
│   │   ├── SkillsList.astro  # Technical skills display
│   │   ├── Timeline.astro    # Experience/education timeline
│   │   └── ContactLinks.astro# Contact info section
│   ├── ui/                   # Atomic UI elements
│   │   ├── Button.astro
│   │   ├── Card.astro
│   │   ├── Tag.astro
│   │   ├── Badge.astro
│   │   └── SectionHeading.astro
│   ├── navigation/           # Navigation components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── NavLinks.astro
│   │   └── MobileMenu.tsx    # Island: requires JS for toggle
│   └── seo/                  # SEO-related components
│       ├── Head.astro        # Meta tags, OG tags, JSON-LD
│       └── Schema.astro      # Structured data generation
├── content/                  # Content collections (Markdown/MDX/JSON)
│   └── projects/             # Project case studies
│       ├── project-one.mdx
│       ├── project-two.mdx
│       └── ...
├── data/                     # Static data files (not collections)
│   ├── site.ts               # Site metadata (name, description, links)
│   ├── resume.ts             # Resume/CV structured data
│   ├── skills.ts             # Skills/technologies list
│   └── navigation.ts         # Navigation links config
├── styles/                   # Global styles
│   └── global.css            # Base styles, CSS custom properties, Tailwind directives
├── assets/                   # Optimized images and static assets
│   ├── images/               # Project screenshots, headshot, etc.
│   └── icons/                # Custom SVG icons
├── lib/                      # Utility functions
│   └── utils.ts              # Date formatting, slug generation, etc.
└── content.config.ts         # Content collection schemas
public/
├── favicon.svg
├── resume.pdf                # Downloadable resume PDF
├── robots.txt
└── og-image.png              # Default Open Graph image
```

### Structure Rationale

- **`pages/`:** Astro's file-based routing. Each `.astro` file becomes a route. Dynamic `[slug].astro` generates one page per project from the content collection -- this is the mechanism that turns 5-6 Markdown files into 5-6 detail pages automatically.
- **`layouts/`:** Separated from components because layouts define page-level shells. `BaseLayout` handles the HTML document structure, meta tags, header/footer, and View Transitions. `ProjectLayout` extends it with case-study-specific chrome (back navigation, project metadata sidebar).
- **`components/sections/`:** These are the big building blocks that compose pages. Each section is a self-contained, full-width block. Pages import and arrange sections -- a page is essentially a list of sections in order.
- **`components/ui/`:** Small, reusable atoms. Sections compose these. The design system lives here.
- **`components/navigation/`:** Separated because nav is structurally special -- it lives in layouts, not in page sections, and the mobile menu is one of the few interactive islands.
- **`content/`:** Astro Content Collections. Project data lives as MDX files with typed frontmatter schemas. Placeholder content goes here initially and gets swapped for real content later without touching any component code.
- **`data/`:** TypeScript data files for structured, non-collection data. Resume entries, skills lists, navigation config. These are imported directly (not queried like collections) and provide type safety through TypeScript interfaces.

## Architectural Patterns

### Pattern 1: Islands Architecture (Zero-JS Default)

**What:** The entire site renders as static HTML at build time. JavaScript is only loaded for components explicitly marked with `client:*` directives. Each interactive "island" hydrates independently.

**When to use:** Every component by default. Only opt into JavaScript when a component genuinely needs client-side interactivity (e.g., mobile menu toggle, image lightbox, theme switcher).

**Trade-offs:**
- Pro: Near-perfect Lighthouse scores, minimal bundle size, fastest possible page loads
- Pro: Each island hydrates independently -- one slow island does not block others
- Con: Cannot share state between islands without external coordination
- Con: Requires deliberate thought about what needs interactivity vs. what does not

**Example:**
```astro
---
// Static by default -- no JavaScript shipped
import ProjectCard from '../components/ui/Card.astro';
import MobileMenu from '../components/navigation/MobileMenu.tsx';
---

<!-- This renders as pure HTML, zero JS -->
<ProjectCard title="My App" description="A cool project" />

<!-- This becomes an interactive island, JS loaded only when visible -->
<MobileMenu client:media="(max-width: 768px)" />
```

**Likely islands in this portfolio:**
- Mobile menu (hamburger toggle) -- `client:media="(max-width: 768px)"`
- Theme toggle (if dark mode) -- `client:load`
- Project filter/sort (if interactive filtering on projects page) -- `client:visible`
- Everything else: pure static HTML

### Pattern 2: Content-Driven Pages via Collections

**What:** Project case studies and other structured content are defined as Markdown/MDX files with Zod-validated frontmatter schemas. Pages query collections at build time and render typed data.

**When to use:** Any content that follows a repeating structure (projects, blog posts, testimonials). The project case studies are the primary use case here.

**Trade-offs:**
- Pro: Type-safe content -- build fails if frontmatter is invalid, catching errors early
- Pro: Content authors (or future-Jack) edit Markdown files, never touch components
- Pro: Adding a new project means adding one `.mdx` file -- no code changes
- Con: Schema changes require updating all existing content files

**Example:**
```typescript
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    thumbnail: z.string(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
    order: z.number(),            // Controls display order
    status: z.enum(['placeholder', 'draft', 'published']),
    overview: z.string(),         // One-line for fast-scan mode
    techStack: z.array(z.string()),
    challenges: z.string().optional(),
    lessons: z.string().optional(),
    liveUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
  }),
});

export const collections = { projects };
```

```astro
---
// src/pages/projects/[slug].astro
import { getCollection } from 'astro:content';
import ProjectLayout from '../../layouts/ProjectLayout.astro';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map((project) => ({
    params: { slug: project.id },
    props: { project },
  }));
}

const { project } = Astro.props;
const { Content } = await project.render();
---

<ProjectLayout project={project.data}>
  <Content />
</ProjectLayout>
```

### Pattern 3: Section Composition

**What:** Pages are composed by arranging section components in order, passing data as props. Sections are self-contained, full-width blocks. This creates a clear, scannable page composition.

**When to use:** All pages. Each page is a "stack of sections."

**Trade-offs:**
- Pro: Pages are extremely readable -- you see the structure at a glance
- Pro: Sections are independently testable and reusable across pages
- Pro: Reordering page content means reordering component imports
- Con: Deep nesting if sections contain sub-sections (keep it flat)

**Example:**
```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/sections/Hero.astro';
import FeaturedProjects from '../components/sections/FeaturedProjects.astro';
import SkillsOverview from '../components/sections/SkillsOverview.astro';
import CallToAction from '../components/sections/CallToAction.astro';
import { getCollection } from 'astro:content';

const featuredProjects = await getCollection('projects',
  ({ data }) => data.featured === true
);
---

<BaseLayout title="Jack Cutrara | Software Engineer">
  <Hero />
  <FeaturedProjects projects={featuredProjects} />
  <SkillsOverview />
  <CallToAction />
</BaseLayout>
```

### Pattern 4: Dual Reading Mode via Content Structure

**What:** Support both 30-second recruiter scans and 10-minute engineer deep dives through content structure, not toggle switches. Use progressive disclosure: scannable headlines and summaries at the top, technical depth below.

**When to use:** Project detail pages and the projects listing page.

**Trade-offs:**
- Pro: No JavaScript needed -- it is a content/layout strategy, not an interactive feature
- Pro: Works perfectly for both audiences without making either feel unwelcome
- Con: Requires thoughtful content writing (structure in the Markdown, not the component)

**Implementation approach:**
- **Projects listing page:** Each card shows title, one-line description, tech tags. This is the fast-scan surface.
- **Project detail page:** Structured in sections: Overview (scan-friendly) -> Tech Stack -> Challenges -> Architecture -> Lessons (deep-dive). Bold headers and short paragraphs serve scanners. Full paragraphs serve engineers.
- The frontmatter `overview` field provides the scan-friendly summary. The MDX body contains the deep dive.

### Pattern 5: View Transitions for App-Like Navigation

**What:** Astro's View Transitions API enables smooth animated navigation between pages without a full page reload, giving a single-page app feel to a multi-page static site.

**When to use:** Globally, via `<ClientRouter />` in the base layout.

**Trade-offs:**
- Pro: Professional, polished feel -- pages slide/fade between each other
- Pro: Browser-native (85%+ support in 2025), progressively enhanced
- Pro: Zero JavaScript in non-supporting browsers -- falls back to normal navigation
- Con: Requires `transition:name` attributes for matched element animations

**Example:**
```astro
---
// src/layouts/BaseLayout.astro
import { ClientRouter } from 'astro:transitions';
---
<html>
  <head>
    <ClientRouter />
  </head>
  <body>
    <Header transition:persist />
    <main transition:animate="fade">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

## Data Flow

### Build-Time Content Flow (Primary)

```
Content Files (MDX/MD)        TypeScript Data Files
  src/content/projects/         src/data/site.ts
  src/content/...               src/data/resume.ts
         │                            │
         ▼                            ▼
  Zod Schema Validation        Direct TypeScript Import
  (content.config.ts)          (type-safe by default)
         │                            │
         ▼                            ▼
  getCollection() / getEntry()   import { siteData }
         │                            │
         ├────────────┬───────────────┘
         ▼            ▼
       Page Components
       (src/pages/*.astro)
              │
              ▼
       Section Components
       (receive data as props)
              │
              ▼
       UI Components
       (render atoms)
              │
              ▼
       Static HTML Output
       (deployed to CDN)
```

### Runtime Flow (Islands Only)

```
Page Load (static HTML renders instantly)
         │
         ▼
  Browser evaluates client:* directives
         │
         ├── client:load → Hydrate immediately (theme toggle)
         ├── client:media → Hydrate when media query matches (mobile menu)
         ├── client:visible → Hydrate when scrolled into view (project filter)
         └── client:idle → Hydrate when browser is idle
         │
         ▼
  Island JavaScript downloads + executes
  (independently, does not block other islands or static content)
```

### Key Data Flows

1. **Project listing:** `getCollection('projects')` in `projects/index.astro` -> filters/sorts -> passes array to `ProjectGrid` section -> each project renders as a `Card` component.
2. **Project detail:** `getStaticPaths()` generates one route per project -> `getEntry()` provides typed data -> `ProjectLayout` renders metadata sidebar + MDX body.
3. **Home page featured projects:** `getCollection('projects', filter)` in `index.astro` -> passes filtered subset to `FeaturedProjects` section.
4. **Resume data:** Direct import from `src/data/resume.ts` -> passed to timeline and skills sections on the resume page.
5. **SEO metadata:** Each page passes title/description to `BaseLayout` -> `Head` component renders meta tags, OG tags, and JSON-LD.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (personal site, <1K visitors/month) | Pure static. Deploy to any CDN (Vercel, Netlify, Cloudflare Pages). Zero server costs. This is the target. |
| Growth (shared widely, 10K+ visitors/month) | Still pure static. CDN handles any traffic volume. No changes needed. |
| Feature expansion (blog, CMS, analytics) | Add content collections for blog posts. Consider Astro's server mode only if dynamic features emerge (unlikely for a portfolio). |

### Scaling Priorities

1. **First bottleneck: Content management, not traffic.** A static site on a CDN handles virtually unlimited traffic. The real scaling challenge is content maintenance -- as projects grow, keeping Markdown files organized matters. The content collection schema prevents drift.
2. **Second bottleneck: Build time.** With 5-6 projects, builds take seconds. If the site grows to include dozens of blog posts, Astro's incremental builds and content caching keep this fast.

## Anti-Patterns

### Anti-Pattern 1: Over-Hydration

**What people do:** Mark every component as `client:load` "just in case" or use a React-heavy approach where everything is an interactive component.
**Why it's wrong:** Defeats the purpose of Islands Architecture. You end up shipping as much JavaScript as a Next.js site but with more complexity. Performance degrades from sub-1s to 2-3s page loads.
**Do this instead:** Start with zero islands. Ask "does this component NEED JavaScript?" for each one. Most portfolio components (cards, grids, text sections, hero) do not need interactivity.

### Anti-Pattern 2: Content in Components

**What people do:** Hardcode project titles, descriptions, and details directly in `.astro` component files.
**Why it's wrong:** Makes content updates require editing code. Violates the requirement for "placeholder content that's easy to swap." Prevents non-developers from ever updating content.
**Do this instead:** All project content lives in `src/content/` as Markdown/MDX files. Components receive data through props. Updating content means editing a Markdown file, never a component.

### Anti-Pattern 3: Page-Level Data Fetching in Sections

**What people do:** Have section components directly call `getCollection()` internally.
**Why it's wrong:** Hides data dependencies, makes sections non-reusable (tied to specific collections), and makes the page composition opaque.
**Do this instead:** Pages fetch data and pass it to sections as props. Sections are pure rendering components that take data in and produce HTML out.

### Anti-Pattern 4: Monolithic Pages

**What people do:** Write entire pages as single files with all HTML inline -- 500+ line `.astro` files with embedded styles.
**Why it's wrong:** Impossible to maintain, test, or reuse. When the design changes, you are editing a giant monolith.
**Do this instead:** Compose pages from sections. Each section is its own component file. A page file should be short -- imports, data fetching, and section arrangement.

### Anti-Pattern 5: CSS-in-JS for Static Content

**What people do:** Use styled-components, Emotion, or other CSS-in-JS libraries that require JavaScript runtime.
**Why it's wrong:** Adds unnecessary JavaScript to a static site. Tailwind CSS utility classes and Astro's built-in scoped `<style>` tags produce zero-JS styling.
**Do this instead:** Use Tailwind CSS for utility-first styling. Use Astro's scoped `<style>` blocks for component-specific styles. Both compile to static CSS at build time.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| CDN hosting (Vercel/Netlify/CF Pages) | Git push triggers build + deploy | Zero-config with Astro adapters. Static output means no server runtime. |
| Google Fonts / Font hosting | `<link>` in `Head.astro` or self-hosted in `public/fonts/` | Self-hosting preferred for performance (eliminates external request). |
| Google Search Console | Sitemap submission + meta verification tag | `@astrojs/sitemap` generates sitemap automatically. |
| Analytics (optional, post-launch) | Script tag in `BaseLayout.astro` | Plausible or Fathom for privacy-respecting, lightweight analytics. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Pages <-> Content Collections | `getCollection()` / `getEntry()` at build time | Type-safe. Schema validation catches errors at build. |
| Pages <-> Sections | Props (data down) | One-directional. Sections never fetch their own data. |
| Sections <-> UI Components | Props (data down) | Sections compose UI atoms. Pure rendering. |
| Layouts <-> Pages | `<slot />` composition | Layout wraps page content. Page content fills the slot. |
| Static HTML <-> Islands | `client:*` directives | Islands hydrate independently. No shared state needed for this portfolio. |

## Build Order (Dependencies Between Components)

This ordering reflects what must exist before other things can be built:

```
Phase 1: Foundation (no dependencies)
  ├── Project scaffolding (Astro + Tailwind + TypeScript config)
  ├── Content collection schema (content.config.ts)
  ├── Global styles / CSS custom properties
  └── Data files skeleton (src/data/site.ts, navigation.ts)

Phase 2: Shell (depends on Phase 1)
  ├── BaseLayout (html, head, meta, slot)
  ├── Head/SEO component
  ├── Header + NavLinks
  ├── Footer
  └── View Transitions setup

Phase 3: UI Components (depends on Phase 1 styles)
  ├── Button, Card, Tag, Badge, SectionHeading
  └── Any other atomic components identified during design

Phase 4: Sections + Pages (depends on Phases 2 + 3)
  ├── Home page sections (Hero, FeaturedProjects, SkillsOverview, CTA)
  ├── About page sections (Bio, Timeline, Interests)
  ├── Projects listing page + ProjectGrid section
  ├── Resume page sections
  ├── Contact page sections
  └── Mobile menu island

Phase 5: Project Detail System (depends on Phase 4 + content schema)
  ├── ProjectLayout (extends BaseLayout)
  ├── Dynamic [slug].astro route
  ├── Placeholder project MDX content (5-6 files)
  └── Project detail sections (overview, tech, challenges, etc.)

Phase 6: Polish (depends on all above)
  ├── View Transition animations fine-tuning
  ├── SEO audit (all meta tags, OG images, JSON-LD)
  ├── Responsive QA across breakpoints
  ├── Accessibility audit
  ├── Performance optimization (image optimization, font loading)
  └── Deployment configuration
```

## Sources

- [Astro Project Structure - Official Docs](https://docs.astro.build/en/basics/project-structure/)
- [Astro Content Collections - Official Docs](https://docs.astro.build/en/guides/content-collections/)
- [Astro Islands Architecture - Official Docs](https://docs.astro.build/en/concepts/islands/)
- [Astro View Transitions - Official Docs](https://docs.astro.build/en/guides/view-transitions/)
- [Astro View Transitions - Chrome for Developers](https://developer.chrome.com/blog/astro-view-transitions)
- [Astro vs Next.js: Real Benchmarks, SEO & Costs (2026)](https://senorit.de/en/blog/astro-vs-nextjs-2025)
- [Astro vs Next.js: The Technical Truth Behind 40% Faster Static Site Performance](https://eastondev.com/blog/en/posts/dev/20251202-astro-vs-nextjs-comparison/)
- [Tailwind CSS with Astro - Official Guide](https://tailwindcss.com/docs/guides/astro)
- [Complete Guide to Astro Website SEO](https://eastondev.com/blog/en/posts/dev/20251202-astro-seo-complete-guide/)
- [Astro View Transitions: App-Like Experience](https://eastondev.com/blog/en/posts/dev/20251202-astro-view-transitions-guide/)
- [Building a Modern Portfolio with Next.js 15](https://richardporter.dev/blog/building-modern-portfolio-nextjs-15)
- [Portfolio Design Trends 2026](https://colorlib.com/wp/portfolio-design-trends/)

---
*Architecture research for: Personal developer portfolio website*
*Researched: 2026-03-22*
