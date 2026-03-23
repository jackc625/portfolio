# Phase 2: Site Shell & Navigation - Research

**Researched:** 2026-03-23
**Domain:** Astro 6 layouts, responsive navigation, SEO meta, accessibility
**Confidence:** HIGH

## Summary

Phase 2 wraps every page in a consistent shell: a transparent-overlay sticky header with scroll-reveal behavior, a full-screen mobile menu overlay, a minimal footer with contact links, SEO meta infrastructure via `astro-seo`, and accessibility features (skip-to-content, focus trap, keyboard navigation, semantic landmarks). The existing `BaseLayout.astro` is extended to compose `<Header />`, `<main id="main-content">`, and `<Footer />` around the page `<slot />`. The `astro-seo` package (already installed at v1.1.0) handles all meta/OG/Twitter tags with per-page props flowing from each page through the layout.

All client-side interactivity (hamburger toggle, scroll-direction detection, focus trapping) is implemented in vanilla JS `<script>` tags inside Astro components -- no React islands or framework JS needed. The View Transitions `<ClientRouter />` component is added to `BaseLayout` for smooth page-to-page transitions, with `astro:page-load` event listeners to re-initialize scripts after navigation. The header uses `transition:persist` to avoid re-mounting across page transitions.

**Primary recommendation:** Build the shell as three Astro components (`Header.astro`, `MobileMenu.astro`, `Footer.astro`) composed inside an updated `BaseLayout.astro` that also integrates `<SEO />` and `<ClientRouter />`. Use vanilla JS for all interactivity. Create stub pages for all 5 nav targets so navigation is testable end-to-end.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Transparent overlay nav with no background -- blends into the dark theme. Background fades in on scroll for contrast/readability.
- **D-02:** Sticky with scroll reveal -- nav hides when scrolling down, reappears when scrolling up. Saves vertical space while keeping nav accessible.
- **D-03:** Minimal text links in body font with subtle hover effect (underline slide-in or color shift to accent). Clean, matches the restrained editorial aesthetic from Phase 1.
- **D-04:** Five nav links: Home, About, Projects, Resume, Contact.
- **D-05:** Full-screen overlay menu -- takes over entire screen with dark background, links displayed large and centered. Dramatic, immersive, matches editorial aesthetic.
- **D-06:** Nav links only in the mobile menu -- just the 5 page links, no social icons or tagline.
- **D-07:** Mobile breakpoint at Tailwind `md` (768px) -- desktop nav at 768px+, hamburger menu below.
- **D-08:** Minimal footer with contact links -- name, copyright, and social/contact icons (GitHub, LinkedIn, email). Satisfies CNTC-02 (contact accessible from every page).
- **D-09:** Text namemark "Jack Cutrara" in display/heading font in the nav bar, links to home page. No logo or initials.
- **D-10:** Role title is "Software Engineer" -- direct, professional, no "aspiring" qualifier.
- **D-11:** Role/value proposition ("Software Engineer") displayed on home hero only -- nav shows just the name across all pages. The home hero is built in Phase 3, but the layout structure must accommodate it.
- **D-12:** Use `astro-seo` component for meta tags, OG tags, and Twitter cards. Extend BaseLayout to accept SEO props per page.

### Claude's Discretion
- Active page indication style in nav (accent color, underline, or other)
- Hamburger menu icon style and animation (animated hamburger-to-X or simple toggle)
- Footer visual separator treatment (border line, background shift, or other)
- All specific visual decisions routed through frontend-design skill

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IDNV-01 | Site displays Jack's name, role, and one-liner value proposition above the fold within 3 seconds of page load | Header namemark "Jack Cutrara" in display font visible on all pages. Per D-11 role is home hero only (Phase 3). For non-home pages, the namemark satisfies identity. Planner should note IDNV-01 is partially addressed -- full satisfaction requires Phase 3 hero. |
| IDNV-02 | Sticky/fixed navigation with clear labels (Home, About, Projects, Resume, Contact) on all pages | Scroll-reveal sticky header pattern with 5 labeled links. Uses `position: fixed` + vanilla JS scroll direction detection. |
| IDNV-03 | Mobile hamburger menu that is accessible and smooth on all breakpoints | Full-screen overlay at `<md` breakpoint. Focus trap, `aria-expanded`, Escape key close, `astro:page-load` re-init. |
| CNTC-02 | Contact links accessible from every page (footer and/or dedicated page) | Footer component with GitHub, LinkedIn, email icons on every page via BaseLayout. |
| SEOA-01 | Unique title tag and meta description per page | `astro-seo` `<SEO>` component with `title`, `titleTemplate`, `description` props flowing from each page. |
| SEOA-02 | Open Graph tags for link previews on LinkedIn, Slack, and social platforms | `astro-seo` `openGraph` prop with basic (title, type, image, url) and image (width, height, alt) config. |
| SEOA-04 | Semantic HTML throughout (proper heading hierarchy, landmarks, labels) | `<header>`, `<nav>`, `<main>`, `<footer>` landmark elements. Single `<h1>` per page. `aria-label` on nav regions. |
| SEOA-05 | Full keyboard navigation with visible focus indicators | Custom focus-visible styles on all interactive elements. Tab order flows logically through skip-link, nav, content, footer. |
| SEOA-06 | Skip-to-content link for screen reader users | Visually hidden link as first focusable element targeting `<main id="main-content">`. Becomes visible on focus. |
| SEOA-07 | Alt text on all images | Phase 2 has minimal images (icons only). SVG icons use `aria-hidden="true"` with visible text labels, or `aria-label` for icon-only buttons. Pattern established for future phases. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 6.0.8 | Framework | Already installed. Zero-JS-by-default. Layout composition via `<slot />`. |
| Tailwind CSS | 4.2.2 | Styling | Already installed. `md:` breakpoint prefix for responsive nav. CSS-first config via `@theme`. |
| astro-seo | 1.1.0 | SEO meta tags | Already installed. Drop-in `<SEO>` component for title, description, OG, Twitter cards. |
| @astrojs/sitemap | 3.7.1 | Sitemap generation | Already installed. Auto-generates sitemap from static routes. |
| TypeScript | 5.9.3 | Type safety | Already installed. Strict mode. Props interfaces for layout/components. |

### Supporting (no new installs needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Astro View Transitions (`<ClientRouter />`) | built-in | Page transitions | Add to BaseLayout `<head>` for smooth cross-page navigation. Zero additional JS. |
| Astro Fonts API | built-in | Font loading | Already configured in `astro.config.mjs`. Display font for namemark. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla JS scroll detection | `astro-scroll-observer` package | Extra dependency for a simple scroll direction check. Not worth it -- 15 lines of vanilla JS. |
| Vanilla JS focus trap | `focus-trap` npm package (v8.0.1) | The package handles edge cases (Shadow DOM, iframes) we don't need. Our menu has 5-7 focusable elements -- hand-written trap is fine. |
| Hand-coded meta tags | `astro-seo` | Already decided (D-12). `astro-seo` handles OG/Twitter/canonical in one component. |

**Installation:** No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  layouts/
    BaseLayout.astro        # Extended: adds Header, Footer, SEO, ClientRouter
  components/
    Header.astro            # Desktop nav + hamburger trigger
    MobileMenu.astro        # Full-screen overlay menu
    Footer.astro            # Contact links, copyright
    SkipToContent.astro     # Visually hidden skip link
    SEOHead.astro           # Wrapper around astro-seo <SEO> with defaults
  pages/
    index.astro             # Home (existing, updated with SEO props)
    about.astro             # Stub page
    projects.astro          # Stub page
    resume.astro            # Stub page
    contact.astro           # Stub page
  styles/
    global.css              # Existing tokens (no changes needed)
```

### Pattern 1: Layout Composition with SEO Props
**What:** BaseLayout accepts SEO-specific props and passes them to the `<SEO>` component. Each page provides its own title, description, and optional OG overrides.
**When to use:** Every page in the site.
**Example:**
```astro
---
// BaseLayout.astro
import { SEO } from "astro-seo";
import { ClientRouter } from "astro:transitions";
import Font from "astro/components/Font.astro";
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
import SkipToContent from "../components/SkipToContent.astro";
import "../styles/global.css";

interface Props {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
}

const {
  title,
  description,
  ogImage = "/og-default.png",
  ogType = "website",
  canonicalUrl,
} = Astro.props;

const siteUrl = Astro.site?.toString().replace(/\/$/, "") ?? "https://jackcutrara.com";
const currentUrl = canonicalUrl ?? `${siteUrl}${Astro.url.pathname}`;
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <Font cssVariable="--font-heading" />
    <Font cssVariable="--font-sans" />
    <Font cssVariable="--font-code" />
    <SEO
      title={title}
      titleTemplate="%s | Jack Cutrara"
      titleDefault="Jack Cutrara"
      description={description}
      canonical={currentUrl}
      openGraph={{
        basic: {
          title: title,
          type: ogType,
          image: `${siteUrl}${ogImage}`,
          url: currentUrl,
        },
        image: {
          alt: `${title} - Jack Cutrara Portfolio`,
        },
      }}
      twitter={{
        card: "summary_large_image",
        title: title,
        description: description,
        image: `${siteUrl}${ogImage}`,
        imageAlt: `${title} - Jack Cutrara Portfolio`,
      }}
    />
    <ClientRouter />
  </head>
  <body class="bg-bg-primary text-text-primary font-body min-h-screen antialiased">
    <SkipToContent />
    <Header />
    <main id="main-content">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

**Page usage:**
```astro
---
// pages/about.astro
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout
  title="About"
  description="Learn about Jack Cutrara's background, education, and path into software engineering."
>
  <!-- Phase 3 content goes here -->
  <section class="py-section px-space-lg">
    <h1 class="font-display text-display">About</h1>
  </section>
</BaseLayout>
```

### Pattern 2: Scroll-Reveal Sticky Header (Vanilla JS)
**What:** Header is `position: fixed` at top. Transparent by default, gains a background after scrolling past a threshold. Hides on scroll-down, reveals on scroll-up.
**When to use:** The single Header component.
**Example:**
```astro
<!-- Header.astro (script section) -->
<script>
  function initHeader() {
    const header = document.getElementById("site-header");
    if (!header) return;

    let lastScrollY = 0;
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Add/remove background based on scroll position
          if (currentScrollY > 50) {
            header.classList.add("header-scrolled");
          } else {
            header.classList.remove("header-scrolled");
          }

          // Hide on scroll down, show on scroll up
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.classList.add("header-hidden");
          } else {
            header.classList.remove("header-hidden");
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Initialize on first load and after view transitions
  document.addEventListener("astro:page-load", initHeader);
</script>
```

### Pattern 3: Full-Screen Mobile Menu with Focus Trap
**What:** Overlay menu that takes full viewport, traps keyboard focus, closes on Escape.
**When to use:** Mobile menu below `md` breakpoint.
**Example:**
```astro
<!-- MobileMenu.astro (script section) -->
<script>
  function initMobileMenu() {
    const trigger = document.getElementById("menu-trigger");
    const menu = document.getElementById("mobile-menu");
    const closeBtn = document.getElementById("menu-close");
    if (!trigger || !menu || !closeBtn) return;

    function openMenu() {
      menu.classList.remove("hidden");
      menu.classList.add("flex");
      trigger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
      document.addEventListener("keydown", trapFocus);
    }

    function closeMenu() {
      menu.classList.add("hidden");
      menu.classList.remove("flex");
      trigger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", trapFocus);
      trigger.focus();
    }

    function trapFocus(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = menu.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    trigger.addEventListener("click", openMenu);
    closeBtn.addEventListener("click", closeMenu);

    // Close menu links on navigation
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }

  document.addEventListener("astro:page-load", initMobileMenu);
</script>
```

### Pattern 4: Skip-to-Content Link
**What:** Visually hidden link that appears on focus, jumps to `<main>`.
**When to use:** First focusable element in the body.
**Example:**
```astro
<!-- SkipToContent.astro -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-bg-primary focus:text-accent focus:px-4 focus:py-2 focus:rounded focus:ring-2 focus:ring-accent focus:outline-none"
>
  Skip to content
</a>
```

### Pattern 5: Active Page Indication
**What:** Highlight the current page's nav link using `Astro.url.pathname`.
**When to use:** Desktop and mobile nav link rendering.
**Example:**
```astro
---
// Inside Header.astro
const currentPath = Astro.url.pathname;
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/resume", label: "Resume" },
  { href: "/contact", label: "Contact" },
];
---

<nav aria-label="Main navigation">
  <ul>
    {navLinks.map(({ href, label }) => {
      const isActive = href === "/"
        ? currentPath === "/"
        : currentPath.startsWith(href);
      return (
        <li>
          <a
            href={href}
            class:list={[
              "transition-colors duration-200",
              isActive ? "text-accent" : "text-text-secondary hover:text-text-primary",
            ]}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </a>
        </li>
      );
    })}
  </ul>
</nav>
```

### Anti-Patterns to Avoid
- **React islands for nav interactivity:** The hamburger menu and scroll detection are trivial vanilla JS. Adding React would ship unnecessary framework JS for a static site.
- **Lenis smooth scroll:** Known Astro compatibility issues (GitHub #7758). Use native `scroll-behavior: smooth` from global.css (already set).
- **`@astrojs/tailwind` integration:** Deprecated for Tailwind v4. Project already uses `@tailwindcss/vite` correctly.
- **`tailwind.config.js`:** Tailwind v4 uses CSS-first config. Project already uses `@theme` directives correctly.
- **Multiple `<h1>` tags per page:** Each page gets exactly one `<h1>`. The nav namemark is NOT an `<h1>` -- it's an `<a>` in display font.
- **`role="navigation"` on `<nav>`:** Redundant. HTML5 `<nav>` already has implicit navigation role. Use `aria-label` instead to distinguish multiple nav regions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SEO meta tags | Custom `<meta>` tag generation | `astro-seo` `<SEO>` component | Handles title templates, OG, Twitter cards, canonical URLs, robots directives in one component. Already installed (D-12). |
| Sitemap generation | Manual sitemap XML | `@astrojs/sitemap` integration | Automatically discovers all static routes. Already configured in `astro.config.mjs`. |
| Page transitions | Custom client-side router | Astro `<ClientRouter />` | Built-in, zero-JS, uses native View Transitions API. Two lines to enable. |
| Font loading/optimization | Manual preload tags | Astro Fonts API | Already configured. Self-hosts fonts, generates fallbacks, injects preload links. |

**Key insight:** Phase 2 requires zero new npm dependencies. Everything needed is either built into Astro 6 or already installed from Phase 1.

## Common Pitfalls

### Pitfall 1: View Transitions Break Script Event Listeners
**What goes wrong:** Scripts set up `addEventListener` calls that stop working after page navigation because the DOM is swapped.
**Why it happens:** Astro's `<ClientRouter />` replaces the page DOM on navigation. Module `<script>` tags only execute once.
**How to avoid:** Wrap ALL event listener setup in `document.addEventListener("astro:page-load", initFunction)`. The `astro:page-load` event fires both on initial load and after every view transition navigation.
**Warning signs:** Hamburger menu or scroll reveal stops working after clicking a nav link.

### Pitfall 2: Mobile Menu State Leaks Across Navigation
**What goes wrong:** User opens mobile menu, clicks a link, new page loads with menu still "open" (body overflow hidden, menu visible).
**Why it happens:** View Transitions swap content but JS state may persist if `transition:persist` is used on the header, or the menu close handler wasn't called.
**How to avoid:** Always close the mobile menu in the nav link click handler (before navigation occurs). Also reset menu state in `astro:page-load`.
**Warning signs:** Page loads with `overflow: hidden` on body, or the menu overlay is visible on the new page.

### Pitfall 3: Transparent Header Unreadable Over Light Content
**What goes wrong:** Transparent nav text becomes invisible when scrolled over a light-colored section.
**Why it happens:** D-01 specifies transparent overlay nav -- if future content has light backgrounds, text disappears.
**How to avoid:** The scroll-triggered background fade-in (D-01) resolves this for scrolled state. At page top, the dark theme guarantees adequate contrast. The `header-scrolled` class adds a semi-transparent dark background.
**Warning signs:** White or light text on a bright section with no header background.

### Pitfall 4: Focus Indicator Invisible on Dark Background
**What goes wrong:** Browser default focus outlines (blue or dotted) are invisible or ugly on the dark background.
**Why it happens:** Default focus styles assume light backgrounds.
**How to avoid:** Use `focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none` on all interactive elements. The accent color token (oklch 0.72 0.12 178 -- a teal/cyan) provides sufficient contrast against dark backgrounds.
**Warning signs:** Tab through the page and you can't see where focus is.

### Pitfall 5: Hamburger Menu Not Accessible to Screen Readers
**What goes wrong:** Screen readers announce the hamburger button as just "button" with no context.
**Why it happens:** Icon-only button without text label or aria attributes.
**How to avoid:** Use `aria-label="Open menu"` on the hamburger button, `aria-expanded="false"` toggled by JS, and `aria-controls="mobile-menu"` pointing to the menu's ID.
**Warning signs:** VoiceOver or NVDA announces "button" without context.

### Pitfall 6: SEO titleTemplate Double-Wraps Home Page
**What goes wrong:** Home page title renders as "Jack Cutrara | Jack Cutrara" instead of just "Jack Cutrara".
**Why it happens:** `titleTemplate="%s | Jack Cutrara"` applies to all pages including home.
**How to avoid:** On the home page, pass the full title directly and either skip `titleTemplate` or use `titleDefault` for the home page case. The `astro-seo` component's `titleDefault` prop is used as fallback when `title` is not provided.
**Warning signs:** Check `<title>` tag in page source for the home page.

### Pitfall 7: IDNV-01 Partial Satisfaction
**What goes wrong:** Reviewer flags IDNV-01 ("name, role, and value proposition above the fold") as incomplete because role is only on home hero (Phase 3).
**Why it happens:** D-11 explicitly puts role/value prop on home hero only. The nav namemark provides identity but not role on non-home pages.
**How to avoid:** Document that IDNV-01 is PARTIALLY addressed in Phase 2 (name via nav namemark on all pages) and FULLY addressed in Phase 3 (hero with role + value proposition on home). The planner should explicitly note this dependency.
**Warning signs:** Success criteria #1 verification fails for non-home pages.

## Code Examples

### astro-seo Full Integration
```astro
---
// Source: https://github.com/jonasmerlin/astro-seo
import { SEO } from "astro-seo";

// Props flow from page -> layout -> SEO component
const { title, description } = Astro.props;
const siteUrl = "https://jackcutrara.com";
---

<SEO
  title={title}
  titleTemplate="%s | Jack Cutrara"
  titleDefault="Jack Cutrara | Software Engineer"
  description={description}
  canonical={`${siteUrl}${Astro.url.pathname}`}
  openGraph={{
    basic: {
      title: title,
      type: "website",
      image: `${siteUrl}/og-default.png`,
      url: `${siteUrl}${Astro.url.pathname}`,
    },
    optional: {
      siteName: "Jack Cutrara",
      description: description,
    },
    image: {
      width: 1200,
      height: 630,
      alt: `${title} - Jack Cutrara Portfolio`,
      type: "image/png",
    },
  }}
  twitter={{
    card: "summary_large_image",
    title: title,
    description: description,
    image: `${siteUrl}/og-default.png`,
    imageAlt: `${title} - Jack Cutrara Portfolio`,
  }}
/>
```

### Semantic HTML Landmark Structure
```html
<!-- Source: https://www.w3.org/WAI/WCAG21/Techniques/html/H101 -->
<body>
  <a href="#main-content" class="skip-link">Skip to content</a>

  <header id="site-header">
    <nav aria-label="Main navigation">
      <!-- Namemark + desktop links + hamburger trigger -->
    </nav>
  </header>

  <!-- Mobile menu overlay (outside header, sibling to main) -->
  <div id="mobile-menu" role="dialog" aria-label="Navigation menu" aria-modal="true" hidden>
    <nav aria-label="Mobile navigation">
      <!-- Full-screen overlay links -->
    </nav>
  </div>

  <main id="main-content">
    <slot /> <!-- Page content -->
  </main>

  <footer>
    <nav aria-label="Footer links">
      <!-- Contact/social links -->
    </nav>
    <p>&copy; 2026 Jack Cutrara</p>
  </footer>
</body>
```

### View Transitions Setup
```astro
---
// Source: https://docs.astro.build/en/guides/view-transitions/
import { ClientRouter } from "astro:transitions";
---

<head>
  <!-- Add to BaseLayout <head> for site-wide transitions -->
  <ClientRouter />
</head>
```

### Responsive Nav with Tailwind md Breakpoint
```astro
<!-- Desktop nav: hidden below md, flex at md+ -->
<ul class="hidden md:flex items-center gap-8">
  {navLinks.map(({ href, label }) => (
    <li><a href={href}>{label}</a></li>
  ))}
</ul>

<!-- Hamburger trigger: visible below md, hidden at md+ -->
<button
  id="menu-trigger"
  class="md:hidden"
  aria-label="Open menu"
  aria-expanded="false"
  aria-controls="mobile-menu"
>
  <!-- Hamburger icon -->
</button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<ViewTransitions />` import | `<ClientRouter />` import from `astro:transitions` | Astro 5.x+ (renamed) | Import path changed. Use `ClientRouter` not `ViewTransitions`. |
| `@astrojs/tailwind` integration | `@tailwindcss/vite` plugin | Tailwind v4 (Jan 2025) | Old integration deprecated. Project already uses correct approach. |
| `tailwind.config.js` | CSS `@theme` directives | Tailwind v4 (Jan 2025) | JS config is legacy. Project already uses `@theme` in global.css. |
| Separate font packages (Fontsource) | Astro Fonts API built-in | Astro 6 (Mar 2026) | No npm packages needed for fonts. Project already configured. |
| `framer-motion` | GSAP (vanilla JS) | N/A (Astro context) | framer-motion is React-only. GSAP works in Astro components. Not needed in Phase 2, but established for Phase 5. |

**Deprecated/outdated:**
- `<ViewTransitions />`: Renamed to `<ClientRouter />` in Astro 5.x+. The old name may still work as alias but use the current name.
- `role="navigation"` on `<nav>`: Redundant per HTML5 spec. Use `aria-label` to distinguish multiple `<nav>` elements.

## Open Questions

1. **OG Image Default**
   - What we know: `astro-seo` requires an OG image URL for social previews (SEOA-02). A default OG image is needed.
   - What's unclear: No OG image asset exists yet in the project.
   - Recommendation: Create a placeholder `public/og-default.png` (1200x630px) with Jack's name and "Software Engineer" text. Can be replaced with a designed version later. The planner should include a task for this.

2. **transition:persist on Header**
   - What we know: `transition:persist` can keep elements across page transitions. It works on Astro islands with `client:` directives. Its behavior on plain HTML elements/Astro components is less clear.
   - What's unclear: Whether `transition:persist` on a plain Astro component (Header) preserves scroll-listener state or just prevents visual re-mount.
   - Recommendation: Start WITHOUT `transition:persist` on the header. Use `transition:name="site-header"` for smooth visual transition + `astro:page-load` for re-initializing scroll listeners. This is the safer, well-documented path. Add `transition:persist` later only if transition flicker is noticeable.

3. **IDNV-01 Partial Coverage**
   - What we know: D-11 puts role/value proposition on home hero only. Nav namemark provides name on all pages.
   - What's unclear: Whether the success criteria reviewer will accept "name only" for non-home pages.
   - Recommendation: Document this explicitly in the plan. Phase 2 delivers the name everywhere (nav namemark). Phase 3 completes IDNV-01 with the home hero. The plan should note IDNV-01 as "partial" for Phase 2.

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
| IDNV-01 | Namemark visible in header | manual | Visual inspection in browser | N/A |
| IDNV-02 | Sticky nav with 5 links on all pages | manual + smoke | Build succeeds, pages render with header | Wave 0 |
| IDNV-03 | Mobile hamburger menu accessible | manual | Keyboard + screen reader testing | N/A |
| CNTC-02 | Contact links in footer on every page | smoke | Build succeeds, check footer in output HTML | Wave 0 |
| SEOA-01 | Unique title + description per page | unit | Check rendered HTML for meta tags | Wave 0 |
| SEOA-02 | OG tags present | unit | Check rendered HTML for OG meta tags | Wave 0 |
| SEOA-04 | Semantic HTML landmarks | unit | Check rendered HTML for landmark elements | Wave 0 |
| SEOA-05 | Keyboard navigation | manual | Tab through in browser | N/A |
| SEOA-06 | Skip-to-content link | unit | Check rendered HTML for skip link | Wave 0 |
| SEOA-07 | Alt text / aria on images/icons | manual | Inspect rendered HTML | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run` + `npx astro build` (build must succeed)
- **Phase gate:** Full suite green + manual keyboard/accessibility review before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration file (none exists yet)
- [ ] `tests/smoke/build.test.ts` -- Verify build succeeds and all pages are generated
- [ ] `tests/unit/seo-meta.test.ts` -- Verify rendered HTML contains expected meta/OG tags per page
- [ ] `tests/unit/landmarks.test.ts` -- Verify semantic landmark structure in rendered HTML

Note: Most Phase 2 requirements (navigation behavior, keyboard interaction, visual appearance) require manual browser testing. Automated tests cover structural correctness (HTML output contains expected elements, meta tags, landmarks). The `astro build` command serves as the primary smoke test -- it will fail if any page has Astro component errors.

## Project Constraints (from CLAUDE.md)

- **Design process:** All visual/UI/UX decisions routed through frontend-design skill -- no ad-hoc design choices. Phase 2 discretion items (active page indication, hamburger animation, footer separator) must go through this skill.
- **Tech stack:** Astro 6 + Tailwind CSS v4 + `astro-seo`. No `@astrojs/tailwind`, no `tailwind.config.js`, no React islands for nav.
- **Content:** Project details are placeholder for v1. Stub pages have minimal content -- structure supports easy replacement.
- **Audience:** Must serve both 30-second recruiter scans (clear nav, professional identity) and 10-minute engineer deep dives (keyboard accessible, semantic HTML).
- **RTK prefix:** All shell commands must use `rtk` prefix per global CLAUDE.md.
- **GSD workflow:** Do not make direct repo edits outside a GSD workflow.
- **Token architecture:** All colors via `var(--token-*)` through `@theme` bridge. Nav/footer components must use Tailwind utility classes that reference these tokens (e.g., `text-text-primary`, `bg-bg-primary`).
- **Font references:** Display font via `font-display` Tailwind class (maps to `var(--font-heading)`). Body font via `font-body`. Monospace via `font-mono`.
- **Dark-first default:** `:root` is dark theme. No light mode until Phase 5.

## Sources

### Primary (HIGH confidence)
- [Astro Docs: View Transitions](https://docs.astro.build/en/guides/view-transitions/) -- ClientRouter setup, lifecycle events, transition directives
- [Astro Docs: Scripts and Event Handling](https://docs.astro.build/en/guides/client-side-scripts/) -- Script behavior in components, module vs inline, deduplication
- [Astro Docs: Layouts](https://docs.astro.build/en/basics/layouts/) -- Layout composition, slot pattern, shared components
- [GitHub: jonasmerlin/astro-seo](https://github.com/jonasmerlin/astro-seo) -- Full API: title, titleTemplate, description, openGraph, twitter, extend props
- [Tailwind CSS: Responsive Design](https://tailwindcss.com/docs/responsive-design) -- Mobile-first breakpoints, `md:` prefix at 768px
- [W3C WCAG: Semantic HTML Landmark Regions (H101)](https://www.w3.org/WAI/WCAG21/Techniques/html/H101) -- header, nav, main, footer landmark usage

### Secondary (MEDIUM confidence)
- [Bram.us: CSS Scroll-Driven Header Hide/Show](https://www.bram.us/2024/09/29/solved-by-css-scroll-driven-animations-hide-a-header-when-scrolling-up-show-it-again-when-scrolling-down/) -- CSS-only approach (Chromium-only, not used; vanilla JS preferred for cross-browser)
- [Accessible Mobile Navigation Patterns](https://a11ymatters.com/pattern/mobile-nav/) -- ARIA attributes, focus management, Escape key handling
- [Level Access: Accessible Navigation Menus](https://www.levelaccess.com/blog/accessible-navigation-menus-pitfalls-and-best-practices/) -- aria-expanded, aria-controls, keyboard interaction
- [MDN: ARIA Landmark Roles](https://developer.mozilla.org/en-US/blog/aria-accessibility-html-landmark-roles/) -- When to use implicit vs explicit roles

### Tertiary (LOW confidence)
- None -- all findings verified against official docs or multiple sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages already installed and verified working (build succeeds)
- Architecture: HIGH -- Astro layout/component patterns well-documented, astro-seo API verified from GitHub README
- Pitfalls: HIGH -- View Transitions script re-init is well-documented; a11y patterns are established WCAG techniques
- SEO meta: HIGH -- astro-seo props verified against official repo

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable -- no fast-moving dependencies)
