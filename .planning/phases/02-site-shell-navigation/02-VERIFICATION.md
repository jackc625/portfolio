---
phase: 02-site-shell-navigation
verified: 2026-03-23T20:30:00Z
status: gaps_found
score: 11/14 must-haves verified
gaps:
  - truth: "Every page has Open Graph meta tags (og:title, og:type, og:image, og:url) in page source"
    status: partial
    reason: "Home page emits og:title with empty content attribute because title='' passes an empty string through to the OG basic.title prop. astro-seo renders <meta property=\"og:title\" content> instead of falling back to titleDefault. twitter:title is also absent on the home page."
    artifacts:
      - path: "src/pages/index.astro"
        issue: "title=\"\" causes og:title content to be blank; needs a dedicated ogTitle prop or a fallback in BaseLayout that substitutes titleDefault when title is empty"
    missing:
      - "Add ogTitle fallback logic in BaseLayout.astro: when title is empty string, pass the titleDefault value ('Jack Cutrara | Software Engineer') to openGraph.basic.title and twitter.title"
  - truth: "All interactive elements have visible focus-visible ring indicators"
    status: failed
    reason: "Footer social links (GitHub, LinkedIn, email) have no focus-visible CSS classes. The links use class=\"p-2 text-text-secondary hover:text-accent transition-colors duration-200\" with no focus-visible:ring-2 or focus-visible:outline-none, making them invisible to keyboard users during tab navigation."
    artifacts:
      - path: "src/components/Footer.astro"
        issue: "Three <a> elements for GitHub, LinkedIn, and email are missing focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:rounded classes"
    missing:
      - "Add focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:rounded to each of the three footer social link <a> elements"
  - truth: "Visitor sees Jack's name, role, and value proposition above the fold within 3 seconds of any page loading"
    status: partial
    reason: "Name ('Jack Cutrara') is visible on the home page h1 and on every page via the header namemark. Role ('Software Engineer') and value proposition are intentionally deferred to Phase 3 (home hero section). Both plans explicitly document this as partial satisfaction — IDNV-01 is a shared requirement between Phase 2 (name/nav) and Phase 3 (role + value prop). The gap is structural, not a bug."
    artifacts: []
    missing:
      - "Role and value proposition text on the home page — deferred to Phase 3 home hero build"
human_verification:
  - test: "Scroll behavior — header hides on scroll down and reappears on scroll up"
    expected: "Header slides up after scrolling 100px down; slides back in when scrolling up"
    why_human: "Requires browser interaction with scroll events; cannot verify with static file inspection"
  - test: "Mobile hamburger menu opens, focus traps, and closes correctly"
    expected: "Hamburger appears below 768px, click opens full-screen overlay, Tab cycles within menu, Escape closes menu, X button closes menu"
    why_human: "Requires browser at mobile viewport width and keyboard interaction"
  - test: "Header transitions from transparent to semi-transparent blur after 50px scroll"
    expected: "header-scrolled class applied adding dark background with backdrop-filter: blur(12px)"
    why_human: "Visual state change only verifiable in live browser"
  - test: "Active nav link highlights in accent color with aria-current=page"
    expected: "Current page link shows accent color; other links show text-secondary"
    why_human: "Active-link logic is Astro-rendered at build time but per-page verification requires browser navigation"
---

# Phase 2: Site Shell & Navigation Verification Report

**Phase Goal:** Every page on the site is wrapped in a consistent layout with working navigation, semantic HTML structure, and SEO meta tags so that visitors can move between pages and search engines can index them
**Verified:** 2026-03-23T20:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every page has a unique `<title>` tag in the format '{PageName} \| Jack Cutrara' (Home: 'Jack Cutrara \| Software Engineer') | VERIFIED | Built dist/ confirms: index.html → "Jack Cutrara \| Software Engineer"; about/index.html → "About \| Jack Cutrara"; all 5 pages have distinct titles |
| 2 | Every page has Open Graph meta tags (og:title, og:type, og:image, og:url) in page source | PARTIAL | About/Projects/Resume/Contact all have correct og:title. Home page emits `<meta property="og:title" content>` — empty content — because title="" passes through to OG props unchanged, not falling back to titleDefault. twitter:title is also absent on home. |
| 3 | Every page has a `<footer>` with GitHub, LinkedIn, and email links | VERIFIED | Footer.astro confirmed: `href="https://github.com/jackc625"`, `href="https://linkedin.com/in/jackcutrara"`, `href="mailto:jack@jackcutrara.com"`. Footer wired in BaseLayout.astro. |
| 4 | Pressing Tab on any page focuses the skip-to-content link first | VERIFIED | SkipToContent.astro is first child of `<body>` in BaseLayout. Link has `href="#main-content"`, text "Skip to content", `sr-only focus:not-sr-only focus:fixed` classes. Confirmed in built HTML. |
| 5 | HTML uses semantic landmarks: `<header>`, `<nav>`, `<main id="main-content">`, `<footer>` | VERIFIED | Header.astro: `<header id="site-header">` + `<nav aria-label="Main navigation">`. BaseLayout: `<main id="main-content">`. Footer.astro: `<footer>` + `<nav aria-label="Footer links">`. MobileMenu: `<nav aria-label="Mobile navigation">`. Built HTML confirms id="main-content" present. |
| 6 | All five nav target pages (/, /about, /projects, /resume, /contact) return 200 after build | VERIFIED | dist/ contains: index.html, about/index.html, projects/index.html, resume/index.html, contact/index.html — all 5 routes generated. |
| 7 | Jack Cutrara namemark is visible in the header on every page, linking to home | VERIFIED | Header.astro: `<a href="/">Jack Cutrara</a>` inside `<header>`. Wired in BaseLayout with `<Header />`. |
| 8 | Five nav links (Home, About, Projects, Resume, Contact) are visible at desktop widths and functional | VERIFIED | Header.astro: navLinks array with all 5 hrefs, rendered in `<ul class="hidden md:flex">`. aria-current logic confirmed. |
| 9 | Header hides when scrolling down past 100px and reappears when scrolling up | HUMAN NEEDED | JS scroll listener with rAF throttling and .header-hidden CSS class are present in Header.astro. Cannot verify dynamic behavior without browser. |
| 10 | Header background transitions from transparent to semi-transparent dark with blur after 50px | HUMAN NEEDED | .header-scrolled CSS class with oklch background + backdrop-filter:blur(12px) defined. JS threshold of 50px confirmed. Cannot verify visual without browser. |
| 11 | Hamburger button appears below 768px and opens full-screen overlay menu | HUMAN NEEDED | `md:hidden` on hamburger, `hidden md:flex` on desktop nav. MobileMenu.astro: `role="dialog" aria-modal="true" class="fixed inset-0 z-40 hidden"`. Cannot verify at breakpoint without browser. |
| 12 | Mobile menu traps keyboard focus, closes on Escape, and closes when a nav link is clicked | HUMAN NEEDED | MobileMenu.astro script has handleKeyDown with Tab cycling, `e.key === "Escape"` handler, and click listener on all nav links calling closeMenu(false). Cannot verify interactive behavior without browser. |
| 13 | Active page link is highlighted in accent color with aria-current='page' | VERIFIED | Both Header.astro and MobileMenu.astro compute isActive and apply `text-accent` class + `aria-current="page"` conditionally. Pattern is server-rendered at build time. |
| 14 | All interactive elements have visible focus-visible ring indicators | FAILED | Header namemark, nav links, hamburger button, MobileMenu close button, and mobile nav links all have `focus-visible:ring-2 focus-visible:ring-accent`. SkipToContent has `focus:ring-2`. Footer social links (GitHub, LinkedIn, email) are MISSING focus-visible classes entirely. |

**Score:** 11/14 truths verified (2 failed/partial, 4 need human)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/layouts/BaseLayout.astro` | Layout shell composing SEO, SkipToContent, Header, MobileMenu, main, Footer with ClientRouter | VERIFIED | All imports present. SEO with titleTemplate, ClientRouter, SkipToContent, Header, MobileMenu, main#main-content, Footer all wired. |
| `src/components/SkipToContent.astro` | Visually hidden skip link targeting #main-content | VERIFIED | Contains `href="#main-content"`, "Skip to content" text, `sr-only focus:not-sr-only` classes. |
| `src/components/Footer.astro` | Footer with contact links (GitHub, LinkedIn, email) | VERIFIED (partial gap) | Exists, substantive, wired. Three aria-hidden SVG icons with aria-label on parent links. Missing focus-visible classes on social link anchors — SEOA-05 gap. |
| `src/components/Header.astro` | Fixed header with namemark, desktop nav, hamburger trigger, scroll-reveal behavior | VERIFIED | id="site-header", aria-label="Main navigation", namemark link, 5 nav links, aria-current logic, menu-trigger with aria-expanded/aria-controls, scroll JS with astro:page-load, header-scrolled/header-hidden CSS. |
| `src/components/MobileMenu.astro` | Full-screen overlay menu with focus trap and keyboard accessibility | VERIFIED | id="mobile-menu", role="dialog", aria-label="Navigation menu", aria-modal="true", focus trap via handleKeyDown, Escape handler, body scroll lock, astro:page-load re-init, staggered animation CSS. |
| `src/pages/about.astro` | Stub about page with SEO props | VERIFIED | title="About", correct description, imports BaseLayout, single h1. |
| `src/pages/projects.astro` | Stub projects page with SEO props | VERIFIED | title="Projects", correct description, imports BaseLayout, single h1. |
| `src/pages/resume.astro` | Stub resume page with SEO props | VERIFIED | title="Resume", correct description, imports BaseLayout, single h1. |
| `src/pages/contact.astro` | Stub contact page with SEO props | VERIFIED | title="Contact", correct description, imports BaseLayout, single h1. |
| `src/pages/index.astro` | Home page with empty title for titleDefault | VERIFIED (partial gap) | title="" triggers titleDefault "Jack Cutrara \| Software Engineer" correctly. OG title is empty — separate gap. |
| `public/og-default.png` | Default Open Graph image for social previews | VERIFIED | File exists, 3631 bytes, valid PNG at 1200x630. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/pages/*.astro` | `src/layouts/BaseLayout.astro` | import BaseLayout, pass title + description props | WIRED | All 5 pages import BaseLayout and pass title + description. Confirmed in source. |
| `src/layouts/BaseLayout.astro` | `astro-seo` | SEO component in `<head>` | WIRED | `import { SEO } from "astro-seo"` + `<SEO title={title} titleTemplate="%s | Jack Cutrara" titleDefault="..." .../>` present. |
| `src/layouts/BaseLayout.astro` | `src/components/Footer.astro` | import and render after `<main>` | WIRED | `import Footer from "../components/Footer.astro"` + `<Footer />` after `</main>`. |
| `src/layouts/BaseLayout.astro` | `src/components/Header.astro` | import and render before `<main>` | WIRED | `import Header from "../components/Header.astro"` + `<Header />` before `<main>`. |
| `src/layouts/BaseLayout.astro` | `src/components/MobileMenu.astro` | import and render between Header and main | WIRED | `import MobileMenu from "../components/MobileMenu.astro"` + `<MobileMenu />` confirmed. |
| `src/components/Header.astro` | `src/components/MobileMenu.astro` | hamburger button aria-controls targeting mobile-menu ID | WIRED | `aria-controls="mobile-menu"` on button in Header; `id="mobile-menu"` in MobileMenu. |
| `src/components/Header.astro` | scroll event listener | vanilla JS with astro:page-load re-init | WIRED | `document.addEventListener("astro:page-load", initHeader)` confirmed. `window.addEventListener("scroll", onScroll, { passive: true })` confirmed. |
| `src/components/MobileMenu.astro` | focus trap | vanilla JS keydown listener with Tab key cycling | WIRED | `handleKeyDown` function with `e.key === "Escape"` and Tab/Shift+Tab cycling between first/last focusable elements confirmed. |

### Data-Flow Trace (Level 4)

Not applicable — phase 2 produces static HTML shell with no dynamic data sources. All content is build-time rendered by Astro from props and template literals.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 5 route HTML files generated | `ls dist/index.html dist/about/index.html dist/projects/index.html dist/resume/index.html dist/contact/index.html` | All 5 present | PASS |
| Home page title correct | `grep "<title>" dist/index.html` | "Jack Cutrara \| Software Engineer" | PASS |
| About page title correct | `grep "<title>" dist/about/index.html` | "About \| Jack Cutrara" | PASS |
| About page og:title correct | `grep "og:title" dist/about/index.html` | content="About" | PASS |
| Home page og:title | `grep "og:title" dist/index.html` | `<meta property="og:title" content>` — empty | FAIL |
| Skip link in built HTML | `grep "Skip to content" dist/index.html` | Found | PASS |
| main#main-content in built HTML | `grep 'id="main-content"' dist/index.html` | Found | PASS |
| OG image file | `ls public/og-default.png` | 3631 bytes | PASS |
| All 4 commit hashes valid | `git log --oneline a03777d 78c0903 8e229af 442ab35` | All 4 found | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| IDNV-01 | 02-02, 02-03 | Name, role, and value prop above the fold within 3 seconds | PARTIAL | Name visible via header namemark ("Jack Cutrara") on every page + home h1. Role and value prop deferred to Phase 3 per plan design. Plans explicitly note this as partial satisfaction. |
| IDNV-02 | 02-02, 02-03 | Sticky/fixed navigation with clear labels on all pages | SATISFIED | Header.astro: fixed top, h-16, z-50. 5 labeled nav links (Home, About, Projects, Resume, Contact). All 5 pages use BaseLayout which includes Header. |
| IDNV-03 | 02-02, 02-03 | Mobile hamburger menu, accessible, smooth on all breakpoints | SATISFIED (human pending) | MobileMenu.astro: role="dialog", aria-modal="true", focus trap, Escape handler, body scroll lock, staggered animation. Hamburger: md:hidden, aria-expanded, aria-controls. Interactive verification required. |
| CNTC-02 | 02-01, 02-03 | Contact links accessible from every page (footer) | SATISFIED | Footer.astro with GitHub, LinkedIn, email links wired in BaseLayout. Rendered on all pages. |
| SEOA-01 | 02-01, 02-03 | Unique title tag and meta description per page | SATISFIED | 5 distinct title + description combinations confirmed in built output. |
| SEOA-02 | 02-01, 02-03 | Open Graph tags for link previews | PARTIAL | All pages have og:type, og:image, og:url, og:description. Home page og:title is empty content attribute. Other 4 pages fully satisfied. |
| SEOA-04 | 02-01, 02-02, 02-03 | Semantic HTML (heading hierarchy, landmarks, labels) | SATISFIED | `<header>`, `<nav aria-label="Main navigation">`, `<nav aria-label="Mobile navigation">`, `<nav aria-label="Footer links">`, `<main id="main-content">`, `<footer>`. Each page has exactly one `<h1>`. |
| SEOA-05 | 02-02, 02-03 | Full keyboard navigation with visible focus indicators | PARTIAL | Header/MobileMenu/SkipToContent interactive elements all have focus-visible:ring-2. Footer social links (3 anchor elements) are missing focus-visible classes — keyboard users tabbing to footer links see no focus ring. |
| SEOA-06 | 02-01, 02-03 | Skip-to-content link for screen reader users | SATISFIED | SkipToContent.astro: `href="#main-content"`, sr-only until focused, first child of `<body>`. Confirmed in built HTML. |
| SEOA-07 | 02-01, 02-03 | Alt text on all images | SATISFIED (vacuous) | No `<img>` elements exist in Phase 2 source files. SVG icons use aria-hidden="true" with aria-label on parent anchor — correct pattern. No actual image alt text gaps exist in this phase's scope. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/Footer.astro` | 17, 36, 56 | Social link `<a>` elements have no `focus-visible:*` classes | Warning | Footer links are keyboard-navigable but show no visible focus ring — violates WCAG 2.4.7 (Focus Visible) and SEOA-05 |
| `src/pages/index.astro` | 5 | `title=""` causes astro-seo to render empty `og:title content` and omit `twitter:title` | Warning | Home page social share previews on LinkedIn/Slack/social show blank title — reduces social sharing quality for the most-shared page |

No TODO/FIXME/placeholder comments found in phase 2 source files. No empty return() or stub implementations. All components render substantive, functional markup.

### Human Verification Required

#### 1. Scroll-Reveal Header Behavior

**Test:** Open `http://localhost:4321` in a browser. Scroll down slowly on any page.
**Expected:** After ~50px of scroll, header background changes from transparent to dark semi-transparent with a visible blur effect. After scrolling past ~100px while still scrolling down, the header slides up out of view. When scrolling up, the header slides back down.
**Why human:** Requires live browser with JavaScript executing; CSS class toggling and scroll events cannot be verified via static file inspection.

#### 2. Mobile Hamburger Menu — Open/Close/Navigate

**Test:** Resize browser below 768px (or use DevTools mobile emulation). Click the hamburger icon (three lines) in the header.
**Expected:** Full-screen overlay appears with 5 centered nav links. Hamburger icon animates to an X. Clicking a nav link closes the menu and navigates. Clicking the X button closes the menu.
**Why human:** Requires browser at mobile viewport width and click interaction to trigger JS event handlers.

#### 3. Mobile Menu Keyboard Accessibility — Focus Trap and Escape

**Test:** With mobile menu open, press Tab repeatedly.
**Expected:** Focus cycles only between the close button (X) and the 5 nav links — it does not escape the modal. Pressing Escape closes the menu and returns focus to the hamburger button.
**Why human:** Focus trap behavior requires keyboard interaction in a live browser with the dialog open.

#### 4. Focus Rings on All Interactive Elements

**Test:** From any page, press Tab repeatedly through all interactive elements.
**Expected:** Every focused element — skip link, namemark, nav links, hamburger, and footer social links — shows a visible teal ring outline.
**Why human:** Current gap identified in Footer (no focus-visible classes), but overall keyboard flow visibility requires browser inspection. Also note: this check will fail until the Footer focus-visible gap (above) is fixed.

### Gaps Summary

Two automated gaps and one structural gap were found:

**Gap 1 — Home page OG/Twitter meta empty (SEOA-02 partial):** The design decision to use `title=""` on the home page to trigger `titleDefault` works correctly for the `<title>` element but astro-seo passes the empty string directly to `og:title` and `twitter:title`, rendering `<meta property="og:title" content>` with no value. When the home page URL is shared on LinkedIn or Slack, the social preview card will have a blank title. Fix: in BaseLayout.astro, compute an effective OG title that substitutes the titleDefault value when title is empty.

**Gap 2 — Footer social links missing focus-visible rings (SEOA-05 partial):** The three anchor elements in Footer.astro (GitHub, LinkedIn, email) have no focus-visible CSS classes. Keyboard users who navigate to the footer by tabbing will see no visual indicator when these links are focused. This is a WCAG 2.4.7 (Focus Visible) issue. Fix: add `focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:rounded` to each footer social link class list.

**Gap 3 — IDNV-01 partial (by design, deferred):** Success Criterion 1 requires role and value proposition visible above the fold. Phase 2 delivers name visibility (header namemark + home h1). Role ("Software Engineer") and value proposition text are explicitly deferred to Phase 3 home hero section per plan documentation. This is not a Phase 2 execution failure — it is a planned phase boundary.

---

_Verified: 2026-03-23T20:30:00Z_
_Verifier: Claude (gsd-verifier)_
