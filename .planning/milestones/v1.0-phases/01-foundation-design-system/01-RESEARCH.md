# Phase 1: Foundation & Design System - Research

**Researched:** 2026-03-22
**Domain:** Astro 6 scaffolding, Tailwind CSS v4, design tokens, content collections, Cloudflare Pages deployment
**Confidence:** HIGH

## Summary

Phase 1 scaffolds the entire project foundation: Astro 6 with Tailwind CSS v4, TypeScript in strict mode, a dark-first design token system using CSS custom properties, content collection schemas with Zod validation for projects, and CI/CD via Cloudflare Pages. This is a greenfield setup with no existing code. Every technology in the stack is verified as current and stable (Astro 6.0.8 released, Tailwind 4.2.2 mature, all tools installed on the dev machine).

The critical architectural decision is structuring design tokens as CSS custom properties that are dark-first but theme-switchable -- Phase 5 adds light mode, so the token architecture must support that from day one without refactoring. Tailwind v4's `@theme` directive combined with CSS custom properties on `[data-theme]` selectors provides the cleanest path. The frontend-design skill must drive all specific color, typography, and spacing value choices.

**Primary recommendation:** Scaffold with `pnpm create astro@latest`, configure Tailwind v4 via `@tailwindcss/vite`, define semantic design tokens as CSS custom properties organized by purpose (color, typography, spacing), create the projects content collection with full Zod schema, and connect GitHub repo to Cloudflare Pages dashboard for automatic deploys.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dark editorial minimal as the PRIMARY experience, with a clean light mode as the alternate theme. Dark mode is the default; light mode added in Phase 5 (DSGN-02/DSGN-03).
- **D-02:** Spacious whitespace density -- generous padding/margins, content breathes, premium gallery-like feel. Optimized for recruiter scanning.
- **D-03:** Restrained palette -- 1-2 accent colors max against dark backgrounds. No vivid rainbow palettes.
- **D-04:** Reference inspiration sites (all share dark editorial minimal with sophisticated typography and animation):
  - andrewreff.com, wam.global, aither.co, artemshcherban.com, shiyunlu.com, bettinasosa.com
- **D-05:** 3-font system -- display/heading font + body text font + monospace accent font
- **D-06:** Specific font families, heading personality, heading scale, and monospace usage scope are all Claude's discretion -- the frontend-design skill will make these calls within the dark editorial minimal direction
- **D-07:** Schema fields: `title`, `tagline`, `description`, `techStack` (array), `featured` (boolean), `status` (completed/in-progress), `githubUrl` (optional), `demoUrl` (optional), `thumbnail` (image path), `category`, `order` (numeric)
- **D-08:** Separate `tagline` vs `description` fields -- tagline optimized for card scanning (~10 words), description for case study intros
- **D-09:** Manual sort order via `order` field -- strongest projects appear first
- **D-10:** No project role/team context fields (role, team size, duration) -- not needed for v1
- **D-11:** Custom domain available, registered at an external registrar (not Cloudflare). DNS will need CNAME records or nameserver update.
- **D-12:** CI/CD set up in Phase 1 -- connect GitHub repo to Cloudflare Pages so every push deploys a preview.
- **D-13:** Public GitHub repository -- source code visible to hiring managers.

### Claude's Discretion
- Color palette and accent color selection (within the dark editorial minimal direction and reference site patterns)
- Heading font family choice (geometric sans-serif or humanist serif or similar)
- Type scale calibration (dramatic oversized headings vs moderate hierarchy)
- Monospace usage scope (code blocks only vs design accent for labels/metadata/dates)
- All specific visual decisions routed through the frontend-design skill

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DSGN-01 | CSS custom properties for color tokens, typography scale, and spacing | Tailwind v4 `@theme` directive + CSS custom properties on semantic token layer; dark-first with `[data-theme]` selector architecture for future light mode |
| IDNV-04 | Site served over HTTPS on a custom domain | Cloudflare Pages provides HTTPS by default on `*.pages.dev` domains; custom domain requires DNS CNAME record pointing to Pages project |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Design process**: All visual/UI/UX decisions routed through frontend-design skill -- no ad-hoc design choices
- **Tech stack**: Astro 6 + Tailwind CSS v4 + TypeScript 5.9 + GSAP + Cloudflare Pages (locked in CLAUDE.md Technology Stack)
- **Content**: Project details are placeholder for v1 -- structure must support easy content replacement
- **Audience**: Must serve both 30-second recruiter scans and 10-minute engineer deep dives
- **Avoid**: `@astrojs/tailwind` (deprecated), `tailwind.config.js` (legacy v3), Google Fonts CDN (use Astro Fonts API), framer-motion, heavy React/Vue islands, Lenis smooth scroll
- **RTK prefix**: All bash commands must be prefixed with `rtk`
- **GSD workflow**: Do not make direct repo edits outside a GSD workflow unless user explicitly asks

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 6.0.8 | Framework / static site generator | Zero-JS-by-default, Content Layer API, Fonts API, View Transitions built in. Latest stable. |
| Tailwind CSS | 4.2.2 | Utility-first CSS | CSS-first config via `@theme`, Oxide engine (5x faster builds), auto-detects templates |
| `@tailwindcss/vite` | 4.2.2 | Vite plugin for Tailwind | Required integration method for Astro 6 + Tailwind v4. NOT `@astrojs/tailwind`. |
| TypeScript | 5.9.3 | Type safety | Astro first-class support. Use `strict` tsconfig preset. |
| `@astrojs/check` | 0.9.8 | Type checking `.astro` files | Run as `astro check` before builds to validate `.astro` file types |
| Zod | 4.3.6 | Schema validation | Bundled with Astro 6. Required for content collection schemas. Import from `astro/zod`. |

### Content & SEO (install in Phase 1 for schema work)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@astrojs/mdx` | 5.0.2 | MDX support in content collections | Required for project case study pages with component embedding |
| `astro-seo` | 1.1.0 | Meta tags, OG, Twitter cards | Install now, configure in Phase 2 |
| `@astrojs/sitemap` | 3.7.1 | Sitemap generation | Install now, configure in Phase 2 |

### Dev Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| Prettier | 3.8.1 | Code formatting | Use with `prettier-plugin-astro` (0.14.1) and `prettier-plugin-tailwindcss` (0.7.2) |
| ESLint | 10.1.0 | Linting | Use with `eslint-plugin-astro` (1.6.0). Flat config format (`eslint.config.mjs`). |
| pnpm | 10.14.0 | Package manager | Already installed globally. Faster than npm, strict dependency resolution. |

### NOT installed in Phase 1

| Library | Version | Phase | Reason |
|---------|---------|-------|--------|
| GSAP | 3.14.2 | Phase 5 | Animations not needed until Phase 5 |
| `@astrojs/cloudflare` | 13.1.3 | NOT needed | Only for SSR. Static site deploys `dist/` directly to Cloudflare Pages. |

### Alternatives Considered

| Recommended | Alternative | Tradeoff |
|-------------|-------------|----------|
| Astro 6.0.8 | Astro 5.18.0 | Fallback if Astro 6 bugs appear. Loses Fonts API, requires Node 18+. 5.18 is battle-tested. |
| pnpm | npm 9.9.4 | npm is available but slower. pnpm already installed and preferred for strict deps. |
| `@theme` in CSS | JS config file | Tailwind v4 is CSS-first. JS config is legacy v3 pattern. Do not use. |

**Installation:**
```bash
# Scaffold project
pnpm create astro@latest

# Tailwind CSS v4 (Vite plugin, NOT @astrojs/tailwind)
pnpm add tailwindcss @tailwindcss/vite

# Content/SEO integrations
pnpm astro add mdx sitemap
pnpm add astro-seo

# Dev tools
pnpm add -D prettier prettier-plugin-astro prettier-plugin-tailwindcss eslint eslint-plugin-astro @astrojs/check typescript
```

**Version verification:** All versions confirmed against npm registry on 2026-03-22.

## Architecture Patterns

### Recommended Project Structure

```
portfolio/
├── public/
│   ├── robots.txt
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   ├── fonts/           # Local font files (if not using provider)
│   │   └── images/          # Optimizable images (processed by Astro)
│   ├── components/          # Reusable .astro components (Phase 2+)
│   ├── content/
│   │   └── projects/        # MDX files for project content
│   │       └── _sample.mdx  # Schema validation sample
│   ├── layouts/
│   │   └── BaseLayout.astro # Root layout with <html>, <head>, <Font />
│   ├── pages/
│   │   └── index.astro      # Blank page for Phase 1 validation
│   ├── styles/
│   │   └── global.css       # Tailwind import + @theme + design tokens
│   └── content.config.ts    # Content collection definitions + Zod schemas
├── astro.config.mjs         # Astro config with Tailwind vite plugin
├── tsconfig.json            # Extends astro/tsconfigs/strict
├── .prettierrc.mjs          # Prettier config with astro + tailwind plugins
├── eslint.config.mjs        # Flat config ESLint
├── wrangler.jsonc            # Cloudflare Pages config (static assets)
└── package.json
```

### Pattern 1: Tailwind v4 CSS-First Configuration

**What:** All theme customization lives in CSS, not JavaScript.
**When to use:** Always with Tailwind v4.

```css
/* src/styles/global.css */
@import "tailwindcss";

/* Design tokens as @theme — generates Tailwind utility classes */
@theme {
  /* Clear defaults and define custom palette */
  --color-*: initial;
  --font-*: initial;

  /* Semantic color tokens — reference CSS custom properties */
  --color-bg-primary: var(--token-bg-primary);
  --color-bg-secondary: var(--token-bg-secondary);
  --color-text-primary: var(--token-text-primary);
  --color-text-secondary: var(--token-text-secondary);
  --color-accent: var(--token-accent);
  --color-accent-hover: var(--token-accent-hover);
  --color-border: var(--token-border);

  /* Font families — populated by Astro Fonts API vars */
  --font-display: var(--font-heading);
  --font-body: var(--font-sans);
  --font-mono: var(--font-code);

  /* Spacing base unit */
  --spacing: 0.25rem;
}

/* Inline theme references for Astro Font CSS vars */
@theme inline {
  --font-display: var(--font-heading);
  --font-body: var(--font-sans);
  --font-mono: var(--font-code);
}
```

### Pattern 2: Dark-First Design Token Architecture

**What:** CSS custom properties defined on `:root` for dark theme (default), with `[data-theme="light"]` overrides for future light mode.
**When to use:** This project -- dark is primary, light is Phase 5 addition.

```css
/* Design token layer -- separate from @theme */
:root {
  /* Dark theme (DEFAULT) */
  --token-bg-primary: oklch(0.13 0.01 260);     /* near-black */
  --token-bg-secondary: oklch(0.18 0.01 260);   /* dark gray */
  --token-text-primary: oklch(0.93 0.01 260);   /* off-white */
  --token-text-secondary: oklch(0.65 0.02 260); /* muted gray */
  --token-accent: oklch(0.72 0.11 178);         /* accent color */
  --token-accent-hover: oklch(0.78 0.13 178);   /* accent hover */
  --token-border: oklch(0.25 0.01 260);         /* subtle border */

  /* Typography scale (fluid, clamp-based) */
  --token-text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.8125rem);
  --token-text-sm: clamp(0.8125rem, 0.75rem + 0.3vw, 0.875rem);
  --token-text-base: clamp(0.9375rem, 0.875rem + 0.3vw, 1rem);
  --token-text-lg: clamp(1.0625rem, 0.95rem + 0.55vw, 1.25rem);
  --token-text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --token-text-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);
  --token-text-3xl: clamp(1.875rem, 1.5rem + 1.85vw, 2.75rem);
  --token-text-4xl: clamp(2.25rem, 1.75rem + 2.5vw, 3.5rem);
  --token-text-5xl: clamp(3rem, 2.25rem + 3.75vw, 5rem);

  /* Spacing tokens (multiples of 4px base) */
  --token-space-xs: 0.25rem;   /* 4px */
  --token-space-sm: 0.5rem;    /* 8px */
  --token-space-md: 1rem;      /* 16px */
  --token-space-lg: 1.5rem;    /* 24px */
  --token-space-xl: 2rem;      /* 32px */
  --token-space-2xl: 3rem;     /* 48px */
  --token-space-3xl: 4rem;     /* 64px */
  --token-space-4xl: 6rem;     /* 96px */
  --token-space-5xl: 8rem;     /* 128px */
  --token-space-section: clamp(4rem, 3rem + 5vw, 8rem);  /* section padding */
}

/* Phase 5: Light theme override */
[data-theme="light"] {
  --token-bg-primary: oklch(0.98 0.005 260);
  --token-bg-secondary: oklch(0.94 0.005 260);
  --token-text-primary: oklch(0.15 0.01 260);
  --token-text-secondary: oklch(0.40 0.02 260);
  /* ...accent and border tokens remapped... */
}
```

**Why this pattern:**
- `:root` = dark (default). No class needed to activate dark mode.
- `[data-theme="light"]` override is additive. Phase 5 adds the toggle and `data-theme` attribute.
- Tailwind's `@theme` references these via `var()`, so utility classes automatically respect the active theme.
- `oklch` color space gives perceptually uniform lightness manipulation.

### Pattern 3: Astro 6 Content Collection with Zod Schema

**What:** Type-safe content collection for projects using Content Layer API.
**When to use:** Required for project content management.

```typescript
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    tagline: z.string().max(80),       // ~10 words for card display
    description: z.string(),            // Longer intro for case study pages
    techStack: z.array(z.string()),
    featured: z.boolean().default(false),
    status: z.enum(["completed", "in-progress"]),
    githubUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    thumbnail: image(),                  // Astro image optimization
    category: z.enum(["web-app", "cli-tool", "library", "api", "other"]),
    order: z.number().int(),            // Manual sort control
  }),
});

export const collections = { projects };
```

### Pattern 4: Astro 6 Fonts API Configuration

**What:** Self-hosted fonts via Astro's built-in Fonts API.
**When to use:** Always -- avoids third-party font CDN requests.

```javascript
// astro.config.mjs
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://jackcutrara.com",  // Replace with actual domain
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.google(),  // or fontsource()
      name: "HEADING_FONT_NAME",        // Chosen by frontend-design skill
      cssVariable: "--font-heading",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
    },
    {
      provider: fontProviders.google(),
      name: "BODY_FONT_NAME",
      cssVariable: "--font-sans",
      weights: [400, 500],
      styles: ["normal", "italic"],
    },
    {
      provider: fontProviders.google(),
      name: "MONO_FONT_NAME",
      cssVariable: "--font-code",
      weights: [400, 500],
      styles: ["normal"],
    },
  ],
});
```

Then in the base layout:

```astro
---
import { Font } from "astro:assets";
import "../styles/global.css";
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <Font cssVariable="--font-heading" />
    <Font cssVariable="--font-sans" />
    <Font cssVariable="--font-code" />
  </head>
  <body class="bg-bg-primary text-text-primary font-body">
    <slot />
  </body>
</html>
```

### Pattern 5: Cloudflare Pages Static Deployment

**What:** Connect GitHub repo to Cloudflare Pages for automatic builds on push.
**When to use:** Phase 1 setup, used by all subsequent phases.

Configuration in Cloudflare Dashboard:
- **Build command:** `pnpm run build`
- **Build output directory:** `dist`
- **Environment variable:** `NODE_VERSION` = `22`

No `@astrojs/cloudflare` adapter needed -- this is a fully static site. The `dist/` directory contains pure HTML/CSS/JS.

Optional `wrangler.jsonc` for local preview:
```jsonc
{
  "name": "jack-cutrara-portfolio",
  "compatibility_date": "2026-03-22",
  "assets": {
    "directory": "./dist"
  }
}
```

### Anti-Patterns to Avoid

- **`@astrojs/tailwind` integration:** Deprecated. Only works with Tailwind v3. Use `@tailwindcss/vite` in the Astro config's `vite.plugins` array.
- **`tailwind.config.js`:** Legacy v3 pattern. Tailwind v4 uses CSS-first configuration via `@theme` directives in your CSS file.
- **`@astrojs/cloudflare` adapter for static sites:** Only needed for SSR/on-demand rendering. Static sites deploy `dist/` directly.
- **`src/content/config.ts`:** Legacy path. Astro 6 uses `src/content.config.ts` (note: at the `src/` root, not inside `src/content/`).
- **Importing Zod from `zod`:** Import from `astro/zod` to use the version bundled with Astro 6.
- **Google Fonts CDN direct links:** Adds 100-300ms latency. Use Astro 6 Fonts API which self-hosts automatically.
- **Hardcoded color values in components:** Use CSS custom property tokens everywhere. Never put raw hex/oklch values in component styles.
- **Dark mode via `prefers-color-scheme` media query alone:** Must use `[data-theme]` attribute approach to support manual toggle in Phase 5. Tailwind's default dark variant uses `prefers-color-scheme` -- override with `@custom-variant` when light mode is added.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading/optimization | Custom @font-face declarations, preload links, fallback generation | Astro 6 Fonts API | Handles downloading, caching, self-hosting, fallback generation, preload injection automatically |
| Image optimization | Custom Sharp pipelines, manual srcset generation | Astro `<Image />` / `<Picture />` | Built-in WebP/AVIF generation, srcset, lazy loading, CLS prevention |
| Content type safety | Manual TypeScript interfaces for frontmatter | Astro Content Collections + Zod | Auto-generates types, validates at build time, catches schema violations |
| CSS purging | Manual CSS tree-shaking | Tailwind v4 Oxide engine | Automatic, 5x faster than v3, zero config |
| Sitemap generation | Manual XML sitemap | `@astrojs/sitemap` | Auto-discovers all static routes, generates index |
| Deployment pipeline | Custom CI/CD scripts | Cloudflare Pages Git integration | Auto-builds on push, preview deploys on PRs, zero config |

**Key insight:** Astro 6 bundles solutions for most infrastructure problems (fonts, images, content validation, syntax highlighting). The stack research in CLAUDE.md is accurate and current. Use built-in features before reaching for external libraries.

## Common Pitfalls

### Pitfall 1: Wrong Tailwind Integration
**What goes wrong:** Using `@astrojs/tailwind` (v3 integration) instead of `@tailwindcss/vite` (v4 plugin). Build fails or Tailwind v3 gets installed.
**Why it happens:** Many tutorials and AI training data reference the old integration.
**How to avoid:** Configure Tailwind exclusively via `vite.plugins` in `astro.config.mjs`. Never install `@astrojs/tailwind`.
**Warning signs:** Seeing `tailwind.config.js` in the project, or Tailwind v3 in `node_modules`.

### Pitfall 2: Content Config File Location
**What goes wrong:** Placing content config at `src/content/config.ts` (legacy path) instead of `src/content.config.ts`.
**Why it happens:** Astro 5 supported both; Astro 6 Content Layer requires the new path.
**How to avoid:** Always use `src/content.config.ts` at the `src/` root.
**Warning signs:** Content collections not being detected, build warnings about missing config.

### Pitfall 3: Zod Import Source
**What goes wrong:** Installing `zod` as a separate dependency and importing from `'zod'`.
**Why it happens:** Habit from non-Astro projects.
**How to avoid:** Always `import { z } from 'astro/zod'`. Zod 4 is bundled with Astro 6.
**Warning signs:** Version conflicts, duplicate Zod in bundle.

### Pitfall 4: Design Tokens Not Theme-Switchable
**What goes wrong:** Defining colors as static values in `@theme` instead of referencing CSS custom properties. When Phase 5 adds light mode, every color must be refactored.
**Why it happens:** Simpler to put literal values directly in `@theme`.
**How to avoid:** Use two layers: (1) CSS custom properties on `:root` / `[data-theme]` for raw values, (2) `@theme` references those via `var()`. Use `@theme inline` for variable references.
**Warning signs:** Any literal color value in `@theme` that should change per theme.

### Pitfall 5: Node Version Mismatch on Cloudflare
**What goes wrong:** Cloudflare Pages build fails because it defaults to an older Node.js version.
**Why it happens:** Astro 6 requires Node 22+. Cloudflare's default Node version may be older.
**How to avoid:** Set `NODE_VERSION=22` environment variable in Cloudflare Pages build settings. Also add `"engines": { "node": ">=22" }` to `package.json`.
**Warning signs:** Build errors about unsupported syntax or missing APIs.

### Pitfall 6: Astro Fonts API `<Font />` Component Missing
**What goes wrong:** Fonts don't load because `<Font cssVariable="..." />` is not included in `<head>`.
**Why it happens:** Configuring fonts in `astro.config.mjs` is necessary but not sufficient. The `<Font />` component must also be rendered in the layout.
**How to avoid:** Import `{ Font } from "astro:assets"` in the base layout and render one `<Font />` per font family in `<head>`.
**Warning signs:** CSS variables for fonts are undefined, text renders in fallback fonts.

### Pitfall 7: MDX Not Recognized in Content Collections
**What goes wrong:** `.mdx` files in content collections are not processed.
**Why it happens:** The `@astrojs/mdx` integration is not installed.
**How to avoid:** Run `pnpm astro add mdx` or manually install and add to integrations array.
**Warning signs:** MDX files treated as plain text, components in MDX not rendering.

## Code Examples

### Complete `astro.config.mjs`

```javascript
// Source: Astro official docs + Tailwind CSS framework guide for Astro
// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://jackcutrara.com", // Replace with actual domain
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.google(), // or fontsource()
      name: "HEADING_FONT",            // Frontend-design skill decides
      cssVariable: "--font-heading",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
    },
    {
      provider: fontProviders.google(),
      name: "BODY_FONT",
      cssVariable: "--font-sans",
      weights: [400, 500],
      styles: ["normal", "italic"],
    },
    {
      provider: fontProviders.google(),
      name: "MONO_FONT",
      cssVariable: "--font-code",
      weights: [400, 500],
      styles: ["normal"],
    },
  ],
});
```

### Complete `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

### Complete `src/content.config.ts`

```typescript
// Source: Astro Content Collections docs
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    tagline: z.string().max(80),
    description: z.string(),
    techStack: z.array(z.string()).min(1),
    featured: z.boolean().default(false),
    status: z.enum(["completed", "in-progress"]),
    githubUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    thumbnail: image(),
    category: z.enum(["web-app", "cli-tool", "library", "api", "other"]),
    order: z.number().int().min(1),
  }),
});

export const collections = { projects };
```

### Sample MDX Content File

```mdx
---
title: "Sample Project"
tagline: "A brief one-liner for the card"
description: "A longer description for the case study intro paragraph."
techStack: ["Astro", "TypeScript", "Tailwind CSS"]
featured: true
status: "completed"
thumbnail: "../../assets/images/sample-thumbnail.jpg"
category: "web-app"
order: 1
---

# Sample Project

This is placeholder content for schema validation.
```

### Prettier Configuration

```javascript
// .prettierrc.mjs
// Source: prettier-plugin-astro README + prettier-plugin-tailwindcss docs
/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  plugins: [
    "prettier-plugin-astro",
    "prettier-plugin-tailwindcss", // Must be last
  ],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
};
```

### ESLint Flat Config

```javascript
// eslint.config.mjs
import eslintPluginAstro from "eslint-plugin-astro";

export default [
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      // Project-specific rule overrides
    },
  },
];
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "check": "astro check",
    "format": "prettier --write .",
    "lint": "eslint ."
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@astrojs/tailwind` integration | `@tailwindcss/vite` plugin | Tailwind v4 (Jan 2025) | Old integration deprecated, does not work with Tailwind v4 |
| `tailwind.config.js` | `@theme` in CSS file | Tailwind v4 (Jan 2025) | CSS-first configuration, no JS config needed |
| `src/content/config.ts` | `src/content.config.ts` | Astro 5.0 (Dec 2024) | Legacy path removed in Astro 6 |
| Legacy content collections | Content Layer API with loaders | Astro 5.0 (Dec 2024) | Must use `glob()` / `file()` loaders. Legacy collections removed in Astro 6. |
| Fontsource npm packages | Astro Fonts API | Astro 6.0 (Mar 2026) | Built-in font management. Fontsource still works as fallback. |
| `darkMode: 'class'` in JS config | `@custom-variant dark` in CSS | Tailwind v4 (Jan 2025) | Dark mode configuration is CSS-only |
| Cloudflare Pages (legacy) | Cloudflare Workers / Pages with wrangler | 2025-2026 | Cloudflare recommends Workers for new projects, but Pages Git integration still works for static sites |
| `ViewTransitions` component | `ClientRouter` component | Astro 4.x | Import from `astro:transitions`, not the old name |

**Deprecated/outdated:**
- `@astrojs/tailwind`: Deprecated. Only supports Tailwind v3.
- `src/content/config.ts`: Legacy path. Astro 6 requires `src/content.config.ts`.
- Legacy content collections (without loaders): Removed in Astro 6. Must use Content Layer API.
- `framer-motion`: Renamed to `motion`. React-only. Use GSAP for Astro components.
- `ViewTransitions` import name: Now `ClientRouter` from `astro:transitions`.

## Open Questions

1. **Exact font families for the 3-font system**
   - What we know: 3-font system confirmed (display + body + mono). Dark editorial minimal direction established. Reference sites use combinations like Space Grotesk/DM Sans/DM Mono, Apercu/TWK Lausanne/Inter/IBM Plex Mono, Amiri/Hedvig Letters Serif/Fragment Mono, Graphik/Wotfard/IBM Plex Mono.
   - What's unclear: Exact font selection for this project.
   - Recommendation: Frontend-design skill decides during implementation. The planner should create a task that invokes the frontend-design skill for font selection, then configures the Astro Fonts API with the chosen fonts.

2. **Exact color palette values**
   - What we know: Dark editorial minimal, 1-2 accent colors, restrained palette. oklch color space is modern best practice.
   - What's unclear: Specific hue, saturation, and lightness values.
   - Recommendation: Frontend-design skill decides during implementation. The planner should create a task for design token definition that routes through the skill.

3. **Custom domain name**
   - What we know: Domain is available, registered at external registrar.
   - What's unclear: The exact domain name (assumed `jackcutrara.com` or similar).
   - Recommendation: Planner should include a task for domain DNS configuration. The Cloudflare Pages `*.pages.dev` subdomain works immediately for preview purposes.

4. **GitHub repository creation**
   - What we know: Public repo required (D-13). `gh` CLI is NOT installed.
   - What's unclear: Whether repo already exists on GitHub.
   - Recommendation: Planner should include a task for `git init`, creating the repo on GitHub (manually via web UI since `gh` CLI is unavailable), and connecting it to Cloudflare Pages.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro 6 (requires 22+) | Yes | 22.16.0 | -- |
| pnpm | Package management | Yes | 10.14.0 | npm 9.9.4 (available) |
| Git | Version control | Yes | 2.48.1 | -- |
| GitHub CLI (gh) | Repo creation from CLI | No | -- | Create repo via GitHub web UI |
| Cloudflare account | Deployment | Unknown | -- | Manual setup via Cloudflare dashboard |

**Missing dependencies with no fallback:**
- None -- all critical tools are available.

**Missing dependencies with fallback:**
- GitHub CLI (`gh`): Not installed. Create repository via https://github.com/new instead. All git operations work via standard `git` CLI.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (compatible with Astro 6 / Vite 7) |
| Config file | None -- Wave 0 must create `vitest.config.ts` |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DSGN-01 | CSS custom properties for color tokens, typography scale, and spacing are defined and usable | smoke (build validation) | `pnpm run build` (exits non-zero if CSS/config broken) | N/A -- build script |
| DSGN-01 | Design tokens are present in built CSS output | unit | `pnpm vitest run tests/tokens.test.ts -x` | Wave 0 |
| IDNV-04 | Site builds successfully and produces dist/ with index.html | smoke (build validation) | `pnpm run build && test -f dist/index.html` | N/A -- shell check |
| IDNV-04 | Site served over HTTPS on custom domain | manual-only | Verify in browser after Cloudflare Pages deploy | N/A |

### Sampling Rate

- **Per task commit:** `pnpm run build` (confirms no build errors)
- **Per wave merge:** `pnpm vitest run` (full suite)
- **Phase gate:** Full suite green + successful Cloudflare Pages deploy preview

### Wave 0 Gaps

- [ ] `vitest.config.ts` -- Vitest configuration using Astro's `getViteConfig()`
- [ ] `tests/tokens.test.ts` -- Verify design token CSS custom properties exist in build output
- [ ] `tests/schema.test.ts` -- Verify content collection schema validates sample MDX
- [ ] Framework install: `pnpm add -D vitest` -- Vitest not yet in project

## Sources

### Primary (HIGH confidence)
- [Astro Install & Setup docs](https://docs.astro.build/en/install-and-setup/) -- Scaffolding, Node 22 requirement, TypeScript presets
- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/) -- Content Layer API, glob loader, Zod schemas, MDX support
- [Astro Fonts docs](https://docs.astro.build/en/guides/fonts/) -- Fonts API configuration, providers, `<Font />` component, Tailwind integration
- [Astro TypeScript docs](https://docs.astro.build/en/guides/typescript/) -- tsconfig presets (base/strict/strictest), `astro check` command
- [Astro View Transitions docs](https://docs.astro.build/en/guides/view-transitions/) -- `ClientRouter` component, lifecycle events
- [Astro Deploy to Cloudflare docs](https://docs.astro.build/en/guides/deploy/cloudflare/) -- Wrangler config, static vs SSR, build settings
- [Tailwind CSS v4 Astro installation guide](https://tailwindcss.com/docs/installation/framework-guides/astro) -- `@tailwindcss/vite` setup
- [Tailwind CSS v4 Theme Variables docs](https://tailwindcss.com/docs/theme) -- `@theme` directive, namespaces, `@theme inline`
- [Tailwind CSS v4 Dark Mode docs](https://tailwindcss.com/docs/dark-mode) -- `@custom-variant`, class/attribute selector override
- [Cloudflare Pages Astro framework guide](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/) -- Build config, Git integration
- npm registry -- All package versions verified 2026-03-22

### Secondary (MEDIUM confidence)
- [Astro v6 + Cloudflare static deployment fix (GitHub #15650)](https://github.com/withastro/astro/issues/15650) -- Bug fixed before stable release, confirmed in 6.0.x
- [prettier-plugin-astro README](https://github.com/withastro/prettier-plugin-astro) -- Plugin configuration
- [eslint-plugin-astro User Guide](https://ota-meshi.github.io/eslint-plugin-astro/user-guide/) -- Flat config setup

### Tertiary (LOW confidence)
- WebSearch results for CSS design token patterns -- General best practices cross-verified with official Tailwind v4 docs
- WebSearch results for dark-first token architecture -- Pattern validated against Tailwind v4 `@theme` + CSS custom properties docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All versions verified against npm registry, official docs confirm APIs and patterns
- Architecture: HIGH -- Patterns derived from official Astro + Tailwind documentation, cross-verified
- Pitfalls: HIGH -- Each pitfall sourced from official migration guides and known issues
- Design tokens: MEDIUM -- Token architecture pattern is sound but specific values (colors, fonts) require frontend-design skill input
- Cloudflare deployment: HIGH -- Static site deployment is the simplest path, well-documented

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (Astro 6 is new; check for patch releases if issues arise)
