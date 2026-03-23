# Stack Research

**Domain:** High-performance personal portfolio website (static, content-driven, multi-page)
**Researched:** 2026-03-22
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro | 6.0.x | Framework / static site generator | Zero-JS-by-default architecture delivers the best Core Web Vitals scores of any JS meta-framework. Ships pure HTML for static pages and only hydrates interactive islands. #1 in satisfaction, interest, and positivity in State of JS 2025. Acquired by Cloudflare (Jan 2026) — long-term backing secured. Built-in Fonts API, Content Layer, View Transitions, and image optimization eliminate the need for half a dozen add-on libraries. Astro 6 stable released March 10, 2026. |
| Tailwind CSS | 4.2.x | Utility-first CSS framework | v4 is a ground-up Rust rewrite (Oxide engine): full builds 5x faster, incremental builds 100x faster. CSS-first configuration via `@theme` replaces `tailwind.config.js`. Auto-detects template files. Uses modern CSS features (cascade layers, `@property`, `color-mix()`, oklch color space). Integrates with Astro via `@tailwindcss/vite` plugin — the old `@astrojs/tailwind` integration is deprecated. |
| TypeScript | 5.9.x | Type safety | Astro has first-class TypeScript support with built-in type checking for content collections, frontmatter schemas, and component props. TS 5.9 is the latest stable. Use `strict` mode. |
| Node.js | 22.x LTS | Runtime | Astro 6 requires Node 22+ (dropped 18 and 20). Node 22.22.1 is current LTS. |

### Animation & Interaction

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| GSAP | 3.x (latest) | Scroll animations, timeline sequences, complex motion | Now 100% free (Webflow acquisition, April 2025) including all previously-paid plugins (ScrollTrigger, SplitText, MorphSVG). The gold standard for scroll-triggered animations and precise timeline control. 2M+ weekly npm downloads. For a portfolio that needs to impress, GSAP's ScrollTrigger provides pixel-perfect scroll-driven animations that Motion.dev cannot match. Vanilla JS — no framework dependency. |
| Astro View Transitions | built-in | Page-to-page transitions | Built into Astro — zero additional JS. Uses the browser's native View Transitions API (85%+ browser support in 2025). Two lines of code for smooth cross-page navigation with fade/morph animations. Works without client-side routing. |

**Animation strategy:** Use Astro View Transitions for page-level transitions (free, zero-JS). Use GSAP + ScrollTrigger for scroll-driven entrance animations and hero effects within pages. This avoids the documented compatibility issues between GSAP ScrollTrigger and Astro View Transitions by keeping their scopes separate — View Transitions handles navigation, GSAP handles on-page scroll effects.

**GSAP + View Transitions caveat:** There are documented issues with ScrollTrigger breaking after View Transition navigation. The mitigation is to reinitialize GSAP/ScrollTrigger on Astro's `astro:page-load` lifecycle event and properly kill instances on `astro:before-preparation`. This is a known pattern with working solutions in the GSAP community forums.

### Content & Data

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro Content Collections | built-in (v6) | Typed content management | Define Zod schemas for project frontmatter (title, description, tech stack, dates, links). Get full TypeScript type-safety and validation at build time. Content Layer API (required in v6 — legacy collections removed) supports Markdown/MDX files in `src/content/`. Perfect for the placeholder-then-fill-in workflow. |
| MDX | via `@astrojs/mdx` | Rich project write-ups | Markdown with component support. Project case study pages can mix prose with interactive code demos or custom components. Astro renders MDX to static HTML at build time — zero runtime JS. |
| Zod | 4.x | Schema validation | Required by Astro 6 for content collection schemas. Validates frontmatter at build time so broken content never deploys. |

### Image Optimization

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro `<Image />` / `<Picture />` | built-in | Responsive image optimization | Uses Sharp under the hood. Automatically generates WebP/AVIF formats, multiple srcset sizes, lazy loading, and proper width/height attributes for zero CLS. No external image CDN needed for a portfolio's scale. |
| Sharp | (bundled) | Image processing | Astro's default image service. Fast, reliable, handles format conversion and resizing at build time. |

### Fonts

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro Fonts API | built-in (v6) | Font loading & optimization | New in Astro 6. Handles downloading, caching, self-hosting, fallback generation, and preload link injection automatically. Supports Google Fonts, Fontsource, Adobe, local files. Eliminates third-party font CDN requests — better performance and privacy. No need for separate Fontsource packages. |

### SEO & Meta

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `astro-seo` | latest | Meta tags, Open Graph, Twitter cards | Drop-in component for `<head>` metadata. 136k+ weekly downloads. Handles title, description, canonical URL, OG images, Twitter cards in one component. |
| `@astrojs/sitemap` | latest | Sitemap generation | Official Astro integration. Auto-generates `sitemap-index.xml` from all static routes. Required for SEO. |
| Hand-written `robots.txt` | n/a | Search engine directives | Simple static file — no library needed. |
| JSON-LD structured data | n/a | Rich search results | Hand-written `<script type="application/ld+json">` in layouts for Person and WebSite schemas. Helps Google display rich snippets. |

### Deployment

| Platform | Purpose | Why Recommended |
|----------|---------|-----------------|
| Cloudflare Pages | Static hosting + CDN | Unlimited bandwidth at every tier (free included). 300+ global edge locations. Fastest edge performance of the big three (Vercel/Netlify/Cloudflare) — every location under 50ms. Astro is now owned by Cloudflare — first-class adapter support. Free tier is the most generous: unlimited bandwidth, 500 builds/month, unlimited sites. Perfect for a portfolio that might get traffic spikes from job applications. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite | 7.x | Dev server + bundler. Bundled with Astro 6. Astro 6's redesigned dev server uses Vite's Environment API for production-parity development. |
| Shiki | 4.x | Syntax highlighting in code blocks. Bundled with Astro 6. Renders at build time — zero client JS. Use for project case study code snippets. |
| Prettier | latest | Code formatting. Use `prettier-plugin-astro` for `.astro` file support. |
| ESLint | latest | Linting. Use `eslint-plugin-astro` for Astro-specific rules. |

## Installation

```bash
# Create project
npm create astro@latest portfolio -- --template minimal

# Core framework dependencies (Astro 6 includes Vite 7, Shiki 4, Zod 4)
npm install astro@latest

# Tailwind CSS v4 (Vite plugin — NOT the deprecated @astrojs/tailwind)
npm install tailwindcss @tailwindcss/vite

# Content authoring
npx astro add mdx

# Animation
npm install gsap

# SEO
npm install astro-seo
npx astro add sitemap

# Dev dependencies
npm install -D prettier prettier-plugin-astro eslint eslint-plugin-astro typescript
```

**Tailwind v4 setup in `astro.config.mjs`:**
```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  }
});
```

**Tailwind v4 CSS entry (`src/styles/global.css`):**
```css
@import "tailwindcss";
```

No `tailwind.config.js` needed — Tailwind v4 uses CSS-first configuration via `@theme` directives.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Astro 6 | Next.js 15/16 | If the portfolio needed dynamic features (auth, database, real-time). Next.js ships 40-50KB+ of JS runtime even for static pages. Overkill for a content-focused portfolio. |
| Astro 6 | Astro 5.18 | If Astro 6 proves too bleeding-edge (released 12 days ago). Astro 5.18 is battle-tested. You'd lose the Fonts API (use Fontsource instead) and need Node 18+. Fall back only if encountering bugs. |
| Tailwind CSS v4 | Vanilla CSS / CSS Modules | If the developer strongly prefers writing semantic CSS. Tailwind's utility-first approach is faster for iteration and produces smaller bundles via automatic purging. |
| GSAP | Motion.dev (v12) | If bundle size is the top priority (8KB core vs ~80KB for GSAP). Motion's vanilla JS API is smaller and MIT-licensed. However, GSAP's ScrollTrigger, SplitText, and timeline API are significantly more powerful for the kind of scroll-driven portfolio animations that impress hiring managers. GSAP is now free. |
| GSAP | CSS-only animations | For simple fade-in/slide-in effects. Use `@keyframes` + Tailwind's `animate-*` utilities. Resort to GSAP only for scroll-triggered sequences and complex timelines. |
| Cloudflare Pages | Vercel | If deploying a Next.js app (Vercel's DX is unmatched for Next.js). For Astro, Cloudflare Pages is better: unlimited bandwidth, Astro is Cloudflare-owned. |
| Cloudflare Pages | Netlify | Netlify reduced its free tier (100 build minutes, down from 300) and added credit-based billing. Cloudflare's free tier is more generous and performant. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@astrojs/tailwind` integration | Deprecated for Tailwind v4. Only works with Tailwind v3. | `@tailwindcss/vite` plugin configured in `astro.config.mjs` |
| `tailwind.config.js` | Tailwind v4 uses CSS-first configuration. JS config files are legacy v3 pattern. | `@theme` directives in your CSS file |
| Create React App | Dead project, no longer maintained. | Astro (or Vite for pure SPA) |
| Gatsby | Effectively abandoned. Acquired by Netlify, development stalled. Slow builds, heavy runtime. | Astro |
| WordPress / CMS | Massive overkill for a personal portfolio with 5-6 projects. Adds hosting complexity, security surface, and maintenance burden. | Astro Content Collections with Markdown/MDX files |
| Google Fonts CDN (direct) | Extra DNS lookup + TCP connection adds 100-300ms latency. Sends user data to Google. | Astro 6 Fonts API (self-hosts automatically) |
| framer-motion (npm package) | Renamed/deprecated in favor of `motion` package. React-only — doesn't work with Astro's `.astro` components. | GSAP (vanilla JS) for Astro components; `motion` package only if adding React islands |
| Heavy React/Vue islands | A portfolio is 95%+ static content. Adding React islands for simple interactions means shipping unnecessary framework JS. | Vanilla JS `<script>` tags in Astro components, GSAP for animations |
| Lenis smooth scroll | Known compatibility issues with Astro (GitHub issue #7758). Adds unnecessary JS for a feature most users don't want. | Native CSS `scroll-behavior: smooth` + GSAP ScrollTrigger |

## Stack Patterns by Variant

**If staying on Astro 5 (fallback):**
- Use Fontsource npm packages instead of Astro Fonts API
- Use Node 18+ or 20+ (both still supported)
- Content collections use legacy or Content Layer API (both available in v5)
- Everything else stays the same

**If adding a blog later (v2):**
- Already supported — add a `blog/` content collection alongside `projects/`
- MDX integration already installed
- Sitemap integration auto-discovers new routes
- No stack changes needed

**If adding contact form later:**
- Use Cloudflare Pages Functions (serverless) or a third-party service (Formspree/Resend)
- Astro SSR can be enabled per-route without affecting static pages
- Currently out of scope per PROJECT.md

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Astro 6.0.x | Node 22+ | Node 18/20 dropped. Use Node 22 LTS (22.22.x). |
| Astro 6.0.x | Vite 7.x | Vite 7 is bundled with Astro 6. Do not install separately. |
| Astro 6.0.x | Zod 4.x | Zod 4 required for content collection schemas. Bundled with Astro 6. |
| Astro 6.0.x | Shiki 4.x | Bundled with Astro 6 for syntax highlighting. |
| Tailwind CSS 4.2.x | `@tailwindcss/vite` 4.2.x | Must use matching versions. Install together. |
| GSAP 3.x | Astro View Transitions | Requires lifecycle cleanup — reinitialize on `astro:page-load`, kill on `astro:before-preparation`. |
| `@astrojs/mdx` | Astro 6.x | Use latest version compatible with Astro 6. Run `npx astro add mdx` for auto-compatibility. |

## Confidence Assessment

| Decision | Confidence | Rationale |
|----------|------------|-----------|
| Astro as framework | HIGH | Dominant in content-site benchmarks, #1 satisfaction/interest in State of JS, Cloudflare-backed, zero-JS architecture is ideal for portfolio |
| Astro 6 specifically | MEDIUM | Released 12 days ago (March 10, 2026). Stable release, but very fresh. Fonts API and dev server redesign are compelling. Fallback to 5.18 is trivial. |
| Tailwind CSS v4 | HIGH | Stable since January 2025, 14 months of patches. Astro integration documented by Tailwind team. |
| GSAP for animation | HIGH | Industry standard, now free, vanilla JS works perfectly in Astro components. ScrollTrigger is unmatched for scroll-driven portfolio animations. |
| Cloudflare Pages | HIGH | Unlimited bandwidth on free tier, fastest edge network, Astro's parent company. No-brainer for a portfolio. |
| TypeScript 5.9 | HIGH | Latest stable, well-supported by Astro tooling. |
| Content Collections + MDX | HIGH | Built into Astro, well-documented pattern for portfolios, type-safe with Zod schemas. |

## Sources

- [Astro 6.0 Release Announcement](https://astro.build/blog/astro-6/) -- Verified features, breaking changes, Node 22 requirement (HIGH confidence)
- [Astro Docs: View Transitions](https://docs.astro.build/en/guides/view-transitions/) -- View Transitions API, lifecycle events (HIGH confidence)
- [Astro Docs: Fonts](https://docs.astro.build/en/guides/fonts/) -- Built-in Fonts API configuration (HIGH confidence)
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) -- Oxide engine, CSS-first config, performance gains (HIGH confidence)
- [Tailwind CSS + Astro Installation Guide](https://tailwindcss.com/docs/installation/framework-guides/astro) -- Official integration instructions (HIGH confidence)
- [GSAP License Change (free)](https://gsap.com/community/standard-license/) -- Webflow acquisition, all plugins free (HIGH confidence)
- [GSAP + Astro View Transitions Forum](https://gsap.com/community/forums/topic/40950-compatibility-with-gsap-scrolltrigger-astro-view-transitiosn-api/) -- Known issues and mitigations (MEDIUM confidence)
- [Motion.dev vs GSAP Comparison](https://motion.dev/docs/gsap-vs-motion) -- Bundle size, API comparison (MEDIUM confidence -- source is Motion's own docs)
- [Vercel vs Netlify vs Cloudflare Pages 2026](https://www.codebrand.us/blog/vercel-vs-netlify-vs-cloudflare-2026/) -- Deployment platform comparison (MEDIUM confidence)
- [Cloudflare Edge Performance 2026](https://dev.to/dataformathub/cloudflare-vs-vercel-vs-netlify-the-truth-about-edge-performance-2026-50h0) -- Edge latency benchmarks (MEDIUM confidence)
- [Astro 2025 Year in Review](https://astro.build/blog/year-in-review-2025/) -- State of JS rankings, adoption stats (HIGH confidence)
- [npm: astro versions](https://www.npmjs.com/package/astro?activeTab=versions) -- Version 5.18.0 latest on v5 line (MEDIUM confidence)
- [npm: tailwindcss](https://www.npmjs.com/package/tailwindcss) -- v4.2.2 latest (MEDIUM confidence)
- [npm: motion](https://www.npmjs.com/package/motion) -- v12.38.0 latest (MEDIUM confidence)
- [Fontsource](https://fontsource.org/) -- Self-hosted font packages (HIGH confidence)
- [TypeScript 5.9 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html) -- Latest TS features (HIGH confidence)

---
*Stack research for: Jack Cutrara Portfolio Website*
*Researched: 2026-03-22*
