---
phase: 09-primitives
plan: 04
type: execute
wave: 4
depends_on: [09-02, 09-03]
files_modified:
  - src/components/primitives/Header.astro
  - src/components/primitives/Footer.astro
  - src/components/primitives/WorkRow.astro
  - src/components/primitives/MobileMenu.astro
autonomous: true
requirements: []

must_haves:
  truths:
    - "Header.astro renders the sticky 72px editorial header with JACK CUTRARA mono wordmark + 3-link mono nav (works/about/contact) + active-link accent underline, and switches to a hamburger at container width ≤380px"
    - "Footer.astro renders the 64px single-row footer at ≥768px and a 3-row vertical stack (copyright + social row + BUILT WITH caption) at <768px"
    - "WorkRow.astro renders the 56px / 1fr / auto grid row with number + title + stack + year + hover-reveal accent arrow"
    - "MobileMenu.astro renders the full-screen overlay with close button + 3 stacked mono nav links + social link row, with dialog a11y + focus trap re-queried on every Tab + Escape/backdrop close + focus return"
    - "All four primitives use ONLY editorial classes + scoped styles + Phase 8 tokens — no Tailwind utility classes in markup, no new color tokens, no GSAP imports, no staggered entrance animation"
    - "Header computes active nav link via Astro.url.pathname internally (D-27 — no currentPath prop)"
    - "MobileMenu focus trap matches src/scripts/chat.ts setupFocusTrap shape — focusable elements re-queried on every Tab keypress"
    - "MobileMenu init lifecycle mirrors Phase 7 ChatWidget exactly: BOTH DOMContentLoaded and astro:page-load listeners, state reset runs unconditionally on every init invocation BEFORE the event-listener double-bind guard (BLOCKER 2 fix)"
  artifacts:
    - path: src/components/primitives/Header.astro
      provides: Sticky editorial header with inline nav + container-query hamburger trigger
      min_lines: 80
    - path: src/components/primitives/Footer.astro
      provides: Editorial footer with desktop single-row + mobile 3-row vertical stack
      min_lines: 60
    - path: src/components/primitives/WorkRow.astro
      provides: Numbered work-list row with hover-reveal accent arrow
      min_lines: 60
    - path: src/components/primitives/MobileMenu.astro
      provides: Full-screen dialog overlay with focus trap + Escape/backdrop close + social link row
      min_lines: 150
  key_links:
    - from: src/components/primitives/Header.astro
      to: src/components/primitives/MobileMenu.astro
      via: Shared button#menu-trigger element and menu#mobile-menu element; Header renders the trigger, MobileMenu renders the dialog, both sit in BaseLayout as sibling elements per plan 09-05
      pattern: "menu-trigger"
    - from: src/components/primitives/Header.astro .header-inner
      to: @container rule inside Header.astro scoped styles
      via: container-type inline-size on .header-inner + @container (max-width 380px) that hides .site-nav and shows #menu-trigger
      pattern: "@container \\(max-width: 380px\\)"
    - from: src/components/primitives/MobileMenu.astro script
      to: src/scripts/chat.ts lines 318–350 setupFocusTrap pattern
      via: Tab keypress re-queries focusable elements every time (not cached at open time)
      pattern: "querySelectorAll.*focusable|focusable.*querySelectorAll"
    - from: src/components/primitives/MobileMenu.astro script init lifecycle
      to: src/scripts/chat.ts lines 733–742 astro:page-load + DOMContentLoaded init pair
      via: Both listeners registered so View Transitions (Phase 10) re-init works alongside the initial-load path
      pattern: "astro:page-load.*initMobileMenu|initMobileMenu.*astro:page-load"
---

<objective>
Create the four composite primitives that depend on the globals from plan 02 and the stateless primitives from plan 03. These four together cover all of mockup.html's visible chrome (Header, Footer, WorkRow, MobileMenu overlay) and are the final new file creations in the primitive library.

**Purpose:** Complete the editorial primitive library. After this plan lands, plan 05 can swap BaseLayout imports to consume these new primitives and delete the old v1.0 chrome.

**Output:** Four new `.astro` files under `src/components/primitives/`, each a self-contained single-file component with scoped styles for component-local layout, one client `<script>` block only inside MobileMenu.astro (for the dialog behavior), and zero Tailwind utility classes or inline hex colors.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/09-primitives/09-CONTEXT.md
@design-system/MASTER.md
@mockup.html
@src/styles/global.css
@src/scripts/chat.ts

<interfaces>
<!-- Prop contracts per MASTER §5.1 (with D-27 deviation), §5.2, §5.5, §5.8 -->

Header.astro (MASTER §5.1, D-27 deviation — NO currentPath prop):
```ts
// no external props — reads Astro.url.pathname internally
interface Props {}
```

Footer.astro (MASTER §5.2):
```ts
// no external props — copyright year computed at build time
interface Props {}
```

WorkRow.astro (MASTER §5.5):
```ts
interface Props {
  number: string;   // e.g., "01"
  title: string;    // e.g., "Portfolio System"
  stack: string;    // e.g., "ASTRO · TAILWIND · GEIST" — already uppercase
  year: string;     // e.g., "2026"
  href: string;     // link target
}
```

MobileMenu.astro (MASTER §5.8 amended, D-27 pattern):
```ts
// no external props — reads Astro.url.pathname internally for active state
interface Props {}
```

Existing reference implementations (read before writing):
- src/scripts/chat.ts lines 318–350 — setupFocusTrap pattern (querySelectorAll on every Tab); also lines 733–742 — the astro:page-load + DOMContentLoaded init pair that MobileMenu mirrors per BLOCKER 2
- src/components/MobileMenu.astro lines 150–233 — v1.0 open/close/body-lock/page-load reset pattern (DO NOT COPY the @keyframes menuLinkIn block — D-09 kills that)
- src/styles/global.css .nav-link-hover — existing hover underline utility that nav links MAY reuse

Constants / literal strings the new primitives must use verbatim:
- Header wordmark text: `JACK CUTRARA`
- Header nav links (href, label): `/projects` → `works`, `/about` → `about`, `/contact` → `contact` (href maps because stub pages live at /projects, /about, /contact — /projects is the "works" surface per HOME-02 / WORK-01)
- Footer desktop right span: `BUILT WITH ASTRO · TAILWIND · GEIST` (uppercase via CSS on .footer-built)
- Footer desktop left span: `© {year} JACK CUTRARA` where year = new Date().getFullYear() at build
- Footer mobile social row links (href, label): `https://github.com/jackc625` → `GITHUB`, `https://linkedin.com/in/jackcutrara` → `LINKEDIN`, `https://x.com/jackcutrara` → `X`, `mailto:jackcutrara@gmail.com` → `EMAIL` — use the same URLs the v1.0 Footer.astro used for GitHub and LinkedIn; X and email from project convention
- MobileMenu social row: same four links as footer mobile social row
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Header.astro (MASTER §5.1 + D-06 container query)</name>
  <files>src/components/primitives/Header.astro</files>
  <read_first>
    - design-system/MASTER.md lines 268–327 (§5.1 Header spec)
    - design-system/MASTER.md §5.8 (post-amendment from plan 01 — for the container-query 380px threshold specifics)
    - mockup.html lines 103–143 (.site-header, .header-inner, .wordmark, .site-nav, .nav-link, .nav-link.is-active — the verbatim source)
    - src/components/Header.astro (v1.0 implementation — for the Astro.url.pathname active-link pattern to port over)
    - src/styles/global.css (confirm .container, .label-mono global classes exist from plan 02; confirm .nav-link-hover exists from Phase 8)
    - .planning/phases/09-primitives/09-CONTEXT.md D-06 (container query), D-07 (trigger location), D-27 (no currentPath prop), D-14 (scoped styles)
  </read_first>
  <action>
CREATE a new file at `src/components/primitives/Header.astro` with the following content:

**Astro frontmatter script (write between `---` fences at top of the .astro file):**

```ts
/**
 * Header — MASTER §5.1 (+ D-06 container-query hamburger + D-27 internal pathname)
 *
 * Sticky 72px-tall editorial header: JACK CUTRARA mono wordmark on the left,
 * 3-link mono nav (works/about/contact) on the right. Active link gets the
 * accent-red underline from mockup.html §137–143.
 *
 * Below a 380px container width (not viewport width) the inline nav is hidden
 * and a hamburger trigger is shown. This uses @container queries, not @media,
 * so the behavior reacts to the header's actual rendered width.
 *
 * Per D-02: primitive lives in src/components/primitives/
 * Per D-03: no Tailwind utilities inside primitive markup
 * Per D-04 + D-27: no props — reads Astro.url.pathname internally
 * Per D-06: container-query threshold is 380px on .header-inner
 * Per D-14: layout classes scoped here
 * Per D-16: only --bg, --ink, --ink-muted, --rule, --accent color tokens
 */

const currentPath = Astro.url.pathname;

const navLinks = [
  { href: "/projects", label: "works" },
  { href: "/about", label: "about" },
  { href: "/contact", label: "contact" },
];

function isActive(href: string): boolean {
  // /projects covers the "works" nav label and any /projects/[id] sub-route
  if (href === "/projects") return currentPath.startsWith("/projects");
  if (href === "/about") return currentPath.startsWith("/about");
  if (href === "/contact") return currentPath.startsWith("/contact");
  return false;
}
```

**Astro template markup (write BELOW the closing `---` frontmatter fence):**

```astro

<header class="site-header">
  <div class="container header-inner">
    <a href="/" class="wordmark" aria-label="Jack Cutrara — Home">JACK CUTRARA</a>

    <nav class="site-nav" aria-label="Main navigation">
      {
        navLinks.map((link) => (
          <a
            href={link.href}
            class:list={["nav-link", { "is-active": isActive(link.href) }]}
            aria-current={isActive(link.href) ? "page" : undefined}
          >
            {link.label}
          </a>
        ))
      }
    </nav>

    <button
      id="menu-trigger"
      type="button"
      class="menu-trigger"
      aria-label="Open menu"
      aria-expanded="false"
      aria-controls="mobile-menu"
    >
      <span class="menu-trigger-bars" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>
  </div>
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 50;
    height: 72px;
    background: var(--bg);
    border-bottom: 1px solid var(--rule);
  }

  .header-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    /* D-06: container-query context for the hamburger trigger */
    container-type: inline-size;
  }

  .wordmark {
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink);
  }

  .site-nav {
    display: flex;
    gap: 32px;
  }

  .nav-link {
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-muted);
    transition: color 200ms ease;
  }

  .nav-link:hover {
    color: var(--ink);
  }

  .nav-link.is-active {
    color: var(--ink);
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-decoration-thickness: 1.5px;
    text-underline-offset: 6px;
  }

  /* D-06: hamburger trigger — hidden by default, shown at container width ≤380px */
  .menu-trigger {
    display: none;
    background: transparent;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: var(--ink);
  }

  .menu-trigger-bars {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 20px;
    height: 14px;
  }

  .menu-trigger-bars span {
    display: block;
    height: 1.5px;
    width: 100%;
    background: currentColor;
  }

  /* D-06: container query swaps inline nav ↔ hamburger at 380px */
  @container (max-width: 380px) {
    .site-nav {
      display: none;
    }
    .menu-trigger {
      display: block;
    }
  }
</style>
```

Notes on implementation:

- NO `<script>` block in Header.astro — the hamburger open/close wiring lives inside MobileMenu.astro (task 4), which queries `#menu-trigger` by ID to attach its click handler
- The `aria-controls="mobile-menu"` attribute points at the dialog ID, which MobileMenu.astro task renders
- `aria-expanded="false"` starts false; MobileMenu's script toggles it on open/close
- The `nav-link` hover color transition is the Phase 8 §6.2 "functional hover/focus state" allowance — a simple color change, NOT an animation
- The `container-type: inline-size` on `.header-inner` is the D-06 mechanism; the `@container (max-width: 380px)` rule reacts to `.header-inner`'s rendered width, not the viewport
- The 3 nav links map to `/projects`, `/about`, `/contact` — `/projects` is the works surface per HOME-02 / WORK-01 from REQUIREMENTS.md
- Active state computation uses `currentPath.startsWith(href)` so `/projects/clipify` still highlights "works" — matches the v1.0 Header pattern
  </action>
  <verify>
    <automated>rtk pnpm run check</automated>
  </verify>
  <acceptance_criteria>
    - File `src/components/primitives/Header.astro` exists
    - File contains the literal string `const currentPath = Astro.url.pathname`
    - File does NOT contain `currentPath: string` in an `interface Props` block (D-27 — no prop)
    - File contains the literal string `JACK CUTRARA`
    - File contains the literal string `"/projects"` AND the literal string `"works"` within 40 characters of each other (navLinks entry — relaxed per WARNING 1 to tolerate minor formatting variation)
    - File contains the literal string `"/about"` AND the literal string `"about"` within 40 characters of each other
    - File contains the literal string `"/contact"` AND the literal string `"contact"` within 40 characters of each other
    - File contains the literal string `id="menu-trigger"`
    - File contains the literal string `aria-controls="mobile-menu"`
    - File contains the literal string `aria-expanded="false"`
    - File contains a `<style>` block
    - File contains the literal string `position: sticky`
    - File contains the literal string `height: 72px`
    - File contains the literal string `container-type: inline-size`
    - File contains the literal string `@container (max-width: 380px)`
    - File contains the literal string `text-decoration-color: var(--accent)`
    - File contains the literal string `text-decoration-thickness: 1.5px`
    - File contains the literal string `text-underline-offset: 6px`
    - File contains the literal string `letter-spacing: 0.12em` (both wordmark and nav-link)
    - File contains the literal string `font-size: 0.875rem` (wordmark)
    - File contains the literal string `font-size: 0.75rem` (nav-link)
    - File does NOT contain any Tailwind utility class like `bg-`, `text-ink`, `flex`, `grid`, `px-`, `py-`, `md:`, `lg:` in the markup (D-03)
    - File does NOT contain any inline hex color value (only `var(--bg)`, `var(--ink)`, `var(--ink-muted)`, `var(--rule)`, `var(--accent)` are allowed)
    - File does NOT contain any `<script>` block (wiring lives in MobileMenu.astro)
    - File does NOT contain the literal string `import gsap` (D-16 + MASTER §6.1)
    - `rtk pnpm run check` passes
  </acceptance_criteria>
  <done>Header.astro exists with container-query hamburger, internal pathname, and active-link underline</done>
</task>

<task type="auto">
  <name>Task 2: Create Footer.astro (MASTER §5.2 + D-10 mobile stack)</name>
  <files>src/components/primitives/Footer.astro</files>
  <read_first>
    - design-system/MASTER.md lines 329–367 (§5.2 Footer — original spec)
    - design-system/MASTER.md §5.2 post-amendment "Mobile stack — Phase 9 D-10 amendment" subsection added by plan 01
    - mockup.html lines 313–326 (.site-footer, .footer-inner, .footer-copy, .footer-built — verbatim source for desktop)
    - src/components/Footer.astro (v1.0 implementation — for the GitHub/LinkedIn/email URL strings to reuse)
    - .planning/phases/09-primitives/09-CONTEXT.md D-10 (mobile 3-row stack), D-14 (scoped), D-16 (tokens only)
  </read_first>
  <action>
CREATE a new file at `src/components/primitives/Footer.astro` with the following content:

**Astro frontmatter script (write between `---` fences at top of the .astro file):**

```ts
/**
 * Footer — MASTER §5.2 (+ D-10 mobile 3-row stack amendment)
 *
 * Desktop (≥768px): single-row flex with copyright on the left and
 * BUILT WITH ASTRO · TAILWIND · GEIST mono caption on the right.
 *
 * Mobile (<768px): 3-row vertical stack:
 *   1. © {year} JACK CUTRARA
 *   2. GITHUB · LINKEDIN · X · EMAIL mono link row
 *   3. BUILT WITH ASTRO · TAILWIND · GEIST
 *
 * Per D-02: primitive lives in src/components/primitives/
 * Per D-03: no Tailwind utilities inside primitive markup
 * Per D-10: mobile footer inserts the social row between copyright and built
 * Per D-14: layout scoped here
 * Per D-16: only --ink-muted, --ink-faint, --rule, --accent color tokens used
 */

const year = new Date().getFullYear();

const socialLinks = [
  { href: "https://github.com/jackc625", label: "GITHUB" },
  { href: "https://linkedin.com/in/jackcutrara", label: "LINKEDIN" },
  { href: "https://x.com/jackcutrara", label: "X" },
  { href: "mailto:jackcutrara@gmail.com", label: "EMAIL" },
];
```

**Astro template markup (write BELOW the closing `---` frontmatter fence):**

```astro

<footer class="site-footer">
  <div class="container footer-inner">
    <span class="meta-mono footer-copy tabular">© {year} JACK CUTRARA</span>

    <nav class="footer-social" aria-label="Social links">
      {
        socialLinks.map((link, i) => (
          <>
            {i > 0 && <span class="footer-social-sep" aria-hidden="true">·</span>}
            <a
              href={link.href}
              class="label-mono footer-social-link"
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {link.label}
            </a>
          </>
        ))
      }
    </nav>

    <span class="meta-mono footer-built">BUILT WITH ASTRO · TAILWIND · GEIST</span>
  </div>
</footer>

<style>
  .site-footer {
    margin-top: 96px;
    border-top: 1px solid var(--rule);
    height: 64px;
  }

  .footer-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
  }

  .footer-copy,
  .footer-built {
    color: var(--ink-faint);
  }

  .footer-built {
    text-transform: uppercase;
  }

  /* Desktop (≥768px): social row hidden — contact section presents them */
  .footer-social {
    display: none;
  }

  .footer-social-link {
    color: var(--ink-muted);
    transition: color 200ms ease;
  }

  .footer-social-link:hover {
    color: var(--accent);
  }

  .footer-social-sep {
    color: var(--ink-faint);
    margin: 0 6px;
  }

  /* Mobile (<768px): 3-row vertical stack per D-10 + §5.2 amendment */
  @media (max-width: 767px) {
    .site-footer {
      height: auto;
      padding-top: 20px;
      padding-bottom: 20px;
    }
    .footer-inner {
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .footer-social {
      display: inline-flex;
      align-items: center;
      font-family: var(--font-mono);
    }
  }
</style>
```

Notes on implementation:

- `.footer-social` is `display: none` on desktop (≥768px) because the contact section already presents social links; on mobile (<768px) it switches to `inline-flex` inside a `flex-direction: column` stack
- The mobile media query also changes `.site-footer` from fixed `height: 64px` to auto + vertical padding, so the 3-row stack has breathing room
- `.footer-social-link` uses the global `.label-mono` class for typography (Geist Mono 500, 0.75rem, uppercase, 0.12em), matching the `.contact-links` shape
- The separator `·` is a span (not a `::before`) so keyboard users can't focus into the separator; `aria-hidden="true"` on each sep
- External social links get `target="_blank"` + `rel="noopener noreferrer"`; `mailto:` does not
- NO SVG icons anywhere in the footer (D-10 + MASTER §8 anti-icon stance)
- NO `hover:-translate-y-0.5` transform (the old Phase 8 Footer had one; the new editorial footer does not)
- Year is computed at Astro build time via `new Date().getFullYear()` — matches MASTER §5.2 "copyright year is computed at build time"
- **Footer + BaseLayout flex interaction (WARNING 4 documentation):** BaseLayout uses `<main class="flex-1">` which fills available vertical space. Footer's `margin-top: 96px` adds to the flex layout height per MASTER §5.2's "96px below the last section" requirement. This works correctly because `flex-1` provides the baseline height and `margin-top` is additive — margin does NOT collapse through the main/footer boundary because footer is a flex item, not a block-in-flow child of main. Consider `padding-top: 96px` as an alternative if any margin-collapse issues surface in QA — both are MASTER-compliant, but `margin-top` matches mockup.html verbatim.
  </action>
  <verify>
    <automated>rtk pnpm run check</automated>
  </verify>
  <acceptance_criteria>
    - File `src/components/primitives/Footer.astro` exists
    - File contains the literal string `const year = new Date().getFullYear()`
    - File contains the literal string `BUILT WITH ASTRO · TAILWIND · GEIST`
    - File contains the literal string `© {year} JACK CUTRARA`
    - File contains the literal string `"https://github.com/jackc625"` AND the literal string `"GITHUB"` (relaxed per WARNING 1 — tolerate formatting variation in the socialLinks array entry)
    - File contains the literal string `"https://linkedin.com/in/jackcutrara"` AND the literal string `"LINKEDIN"`
    - File contains the literal string `"https://x.com/jackcutrara"` AND the literal string `"X"` (as a label value — the X entry in the socialLinks array)
    - File contains the literal string `mailto:jackcutrara@gmail.com` AND the literal string `"EMAIL"`
    - File contains `class="site-footer"`
    - File contains `class="container footer-inner"`
    - File contains `class="meta-mono footer-copy tabular"`
    - File contains `class="meta-mono footer-built"`
    - File contains a `<style>` block
    - File contains the literal string `margin-top: 96px`
    - File contains the literal string `height: 64px`
    - File contains the literal string `border-top: 1px solid var(--rule)`
    - File contains the literal string `@media (max-width: 767px)`
    - File contains the literal string `flex-direction: column` inside the mobile media query
    - File contains the literal string `color: var(--ink-faint)` for footer-copy/built
    - File contains the literal string `color: var(--ink-muted)` for footer-social-link
    - File contains the literal string `color: var(--accent)` for footer-social-link hover
    - File does NOT contain any SVG element (no `<svg>`, no `<path>`) — D-10 / MASTER §8 anti-icon
    - File does NOT contain any Tailwind utility class in markup (D-03)
    - File does NOT contain any inline hex color value
    - File does NOT contain `hover:-translate-y-0.5` or equivalent translate hover
    - File does NOT contain any `<script>` block
    - `rtk pnpm run check` passes
  </acceptance_criteria>
  <done>Footer.astro exists with desktop single-row + mobile 3-row stack, no icons, no translate hover</done>
</task>

<task type="auto">
  <name>Task 3: Create WorkRow.astro (MASTER §5.5)</name>
  <files>src/components/primitives/WorkRow.astro</files>
  <read_first>
    - design-system/MASTER.md lines 451–521 (§5.5 WorkRow spec)
    - mockup.html lines 207–254 (.work-row, .work-list, .work-num, .work-title, .work-stack, .work-meta, .work-arrow — verbatim source)
    - mockup.html lines 390–434 (the 4 sample work rows — for markup shape reference)
    - .planning/phases/09-primitives/09-CONTEXT.md D-02, D-03, D-04, D-14
  </read_first>
  <action>
CREATE a new file at `src/components/primitives/WorkRow.astro` with the following content:

**Astro frontmatter script (write between `---` fences at top of the .astro file):**

```ts
/**
 * WorkRow — MASTER §5.5
 *
 * Single numbered row in the editorial work list. Three-column grid:
 *   - 56px: number column (meta-mono, var(--ink-muted), 1rem/500)
 *   - 1fr:  body column (title in .h2-project, stack in uppercase mono)
 *   - auto: meta column (year + hover-reveal accent arrow)
 *
 * Hover: title gets accent underline, arrow transitions opacity 0 → 1 over 120ms.
 * Arrow is opacity-only — NO translate-x (editorial grammar per §5.5).
 *
 * Per D-02: primitive lives in src/components/primitives/
 * Per D-03: no Tailwind utilities inside primitive markup
 * Per D-04: props stay as MASTER §5.5 specifies (number/title/stack/year/href)
 * Per D-14: layout scoped here
 */
interface Props {
  number: string;
  title: string;
  stack: string;
  year: string;
  href: string;
}

const { number, title, stack, year, href } = Astro.props;
```

**Astro template markup (write BELOW the closing `---` frontmatter fence):**

```astro

<a class="work-row" href={href}>
  <span class="work-num meta-mono tabular">{number}</span>
  <div class="work-body">
    <h2 class="h2-project work-title">{title}</h2>
    <div class="work-stack">{stack}</div>
  </div>
  <div class="work-meta">
    <span class="meta-mono tabular work-year">{year}</span>
    <span class="work-arrow" aria-hidden="true">→</span>
  </div>
</a>

<style>
  .work-row {
    display: grid;
    grid-template-columns: 56px 1fr auto;
    gap: 24px;
    padding: 28px 0;
    border-bottom: 1px solid var(--rule);
    color: inherit;
    text-decoration: none;
    cursor: pointer;
    align-items: start;
  }

  .work-num {
    color: var(--ink-muted);
    font-size: 1rem;
    font-weight: 500;
  }

  .work-title {
    color: var(--ink);
    margin-bottom: 12px;
  }

  .work-stack {
    font-family: var(--font-mono);
    font-weight: 400;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-faint);
  }

  .work-meta {
    display: flex;
    align-items: baseline;
    gap: 8px;
    color: var(--ink-faint);
  }

  .work-arrow {
    color: var(--accent);
    opacity: 0;
    transition: opacity 120ms ease;
  }

  .work-row:hover .work-title,
  .work-row:focus-visible .work-title {
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-decoration-thickness: 1.5px;
    text-underline-offset: 4px;
  }

  .work-row:hover .work-arrow,
  .work-row:focus-visible .work-arrow {
    opacity: 1;
  }
</style>
```

Notes on implementation:

- `.work-num` has `font-size: 1rem; font-weight: 500;` — this is a deliberate MASTER §5.5 override of the standard `.meta-mono` 0.8125rem/400 (documented in MASTER lines 488 and in mockup.html lines 220–224)
- `.work-stack` redeclares its own font-family/size/letter-spacing rather than using `.meta-mono` because the mockup `.work-stack` selector uses `letter-spacing: 0.12em` (uppercase like `.label-mono`) — NOT the standard `.meta-mono` 0.02em (documented in MASTER §5.5 note and mockup.html lines 230–235)
- Hover AND `:focus-visible` both trigger the arrow reveal and title underline — satisfies keyboard accessibility
- The arrow animation is OPACITY ONLY — no `translate-x`, no `margin-left`, no width change (D-22 reuses this pattern for NextProject)
- No `.work-list` selector defined here; Phase 10 / the `/dev/primitives` preview wraps multiple `<WorkRow />` in a container and adds the `:last-child { border-bottom: none }` rule OUTSIDE this primitive (since it's a list-level concern, not a row-level concern)
- Title uses the `.h2-project` global class from plan 02 — that class already brings Geist 500, 1.75rem, line-height 1.2, letter-spacing -0.01em from mockup.html lines 69–74
  </action>
  <verify>
    <automated>rtk pnpm run check</automated>
  </verify>
  <acceptance_criteria>
    - File `src/components/primitives/WorkRow.astro` exists
    - File contains the literal string `interface Props`
    - File contains the literal string `number: string`
    - File contains the literal string `title: string`
    - File contains the literal string `stack: string`
    - File contains the literal string `year: string`
    - File contains the literal string `href: string`
    - File contains the literal string `class="work-row"`
    - File contains the literal string `class="work-num meta-mono tabular"`
    - File contains the literal string `class="h2-project work-title"`
    - File contains the literal string `class="work-stack"`
    - File contains the literal string `class="meta-mono tabular work-year"`
    - File contains the literal string `class="work-arrow"`
    - File contains the literal string `aria-hidden="true"` on the arrow
    - File contains the literal string `grid-template-columns: 56px 1fr auto`
    - File contains the literal string `gap: 24px`
    - File contains the literal string `padding: 28px 0`
    - File contains the literal string `border-bottom: 1px solid var(--rule)`
    - File contains the literal string `opacity: 0` on .work-arrow
    - File contains the literal string `transition: opacity 120ms ease`
    - File contains the literal string `text-decoration-color: var(--accent)`
    - File contains the literal string `text-decoration-thickness: 1.5px`
    - File contains the literal string `text-underline-offset: 4px`
    - File contains `:focus-visible` (keyboard a11y parity with hover)
    - File contains the literal string `font-size: 1rem` (work-num override)
    - File contains the literal string `font-size: 0.8125rem` (work-stack)
    - File contains the literal string `letter-spacing: 0.12em` (work-stack)
    - File does NOT contain any Tailwind utility class in markup (D-03)
    - File does NOT contain `translate-x-` or `transform:.*translate` (D-22 pattern — opacity only)
    - File does NOT contain any inline hex color value
    - File does NOT contain any `<script>` block
    - `rtk pnpm run check` passes
  </acceptance_criteria>
  <done>WorkRow.astro exists with 56px/1fr/auto grid, opacity-only arrow reveal, title underline on hover+focus</done>
</task>

<task type="auto">
  <name>Task 4: Create MobileMenu.astro (MASTER §5.8 amended + focus trap parity with chat.ts)</name>
  <files>src/components/primitives/MobileMenu.astro</files>
  <read_first>
    - design-system/MASTER.md §5.8 (post-amendment from plan 01 — the authoritative spec for this primitive)
    - mockup.html lines 103–143 (Header nav-link shape the overlay links mirror)
    - src/scripts/chat.ts lines 318–350 (setupFocusTrap — re-query focusable on every Tab keypress; the overlay MUST mirror this shape exactly) AND src/scripts/chat.ts lines 733–742 (Phase 7 pattern registers BOTH `astro:page-load` AND `DOMContentLoaded` init listeners — MobileMenu MUST mirror this exactly per BLOCKER 2 fix; the `astro:page-load` listener is required for forward-compat with Phase 10 if it reintroduces `<ClientRouter />`)
    - src/components/MobileMenu.astro lines 150–233 (v1.0 open/close/body-lock/page-load reset pattern — port the structure MINUS the staggered @keyframes menuLinkIn reveal; D-09 kills that)
    - src/components/primitives/Header.astro (from task 1 in this plan — the #menu-trigger button the overlay script binds to)
    - .planning/phases/09-primitives/09-CONTEXT.md D-05 (rebuild), D-07 (overlay contents), D-08 (a11y shape), D-09 (no stagger animation), D-27 (internal pathname)
  </read_first>
  <action>
CREATE a new file at `src/components/primitives/MobileMenu.astro` with the following content:

**Astro frontmatter script (write between `---` fences at top of the .astro file):**

```ts
/**
 * MobileMenu — MASTER §5.8 (amended in plan 09-01)
 *
 * Full-screen dialog overlay triggered by the #menu-trigger button inside
 * Header.astro. Visibility is controlled by a container query on Header's
 * .header-inner (container-type: inline-size, threshold 380px — D-06). The
 * overlay itself is always in the DOM; hidden via display:none by default,
 * toggled to display:flex when open.
 *
 * Contents:
 *   1. Close button (top-right ×)
 *   2. Three stacked mono nav links (works / about / contact) — active link
 *      gets accent underline matching Header.astro .nav-link.is-active
 *   3. GITHUB · LINKEDIN · X · EMAIL mono link row at the bottom
 *
 * A11y: role="dialog" + aria-modal="true" + focus trap with per-Tab re-query
 * (matches src/scripts/chat.ts setupFocusTrap), Escape closes, backdrop
 * closes, body{overflow:hidden} while open, focus returns to #menu-trigger
 * on close. Nav-link click also closes the menu before navigation.
 *
 * Motion: NO staggered entrance animation (D-09 kills @keyframes menuLinkIn).
 * Display toggle only.
 *
 * Per D-02: primitive lives in src/components/primitives/
 * Per D-03: no Tailwind utilities inside primitive markup
 * Per D-08: focus trap re-queries focusable on every Tab keypress
 * Per D-09: no orchestrated entrance animation
 * Per D-14: layout scoped here
 * Per D-16: only --bg, --ink, --ink-muted, --accent color tokens
 * Per D-27: no props — reads Astro.url.pathname internally
 */

const currentPath = Astro.url.pathname;

const navLinks = [
  { href: "/projects", label: "works" },
  { href: "/about", label: "about" },
  { href: "/contact", label: "contact" },
];

const socialLinks = [
  { href: "https://github.com/jackc625", label: "GITHUB" },
  { href: "https://linkedin.com/in/jackcutrara", label: "LINKEDIN" },
  { href: "https://x.com/jackcutrara", label: "X" },
  { href: "mailto:jackcutrara@gmail.com", label: "EMAIL" },
];

function isActive(href: string): boolean {
  if (href === "/projects") return currentPath.startsWith("/projects");
  if (href === "/about") return currentPath.startsWith("/about");
  if (href === "/contact") return currentPath.startsWith("/contact");
  return false;
}
```

**Astro template markup (write BELOW the closing `---` frontmatter fence):**

```astro

<div
  id="mobile-menu"
  class="mobile-menu"
  role="dialog"
  aria-modal="true"
  aria-label="Navigation menu"
  aria-hidden="true"
>
  <div class="mobile-menu-backdrop" data-menu-close aria-hidden="true"></div>

  <div class="mobile-menu-panel">
    <div class="mobile-menu-top">
      <button
        id="menu-close"
        type="button"
        class="mobile-menu-close"
        aria-label="Close menu"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>

    <nav class="mobile-menu-nav" aria-label="Mobile navigation">
      {
        navLinks.map((link) => (
          <a
            href={link.href}
            class:list={["mobile-menu-link", { "is-active": isActive(link.href) }]}
            aria-current={isActive(link.href) ? "page" : undefined}
          >
            {link.label}
          </a>
        ))
      }
    </nav>

    <div class="mobile-menu-social" aria-label="Social links">
      {
        socialLinks.map((link, i) => (
          <>
            {i > 0 && <span class="mobile-menu-social-sep" aria-hidden="true">·</span>}
            <a
              href={link.href}
              class="label-mono mobile-menu-social-link"
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {link.label}
            </a>
          </>
        ))
      }
    </div>
  </div>
</div>

<style>
  .mobile-menu {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 60;
  }

  .mobile-menu.is-open {
    display: flex;
  }

  .mobile-menu-backdrop {
    position: absolute;
    inset: 0;
    background: var(--bg);
  }

  .mobile-menu-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 24px;
  }

  .mobile-menu-top {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 48px;
  }

  .mobile-menu-close {
    background: transparent;
    border: none;
    color: var(--ink);
    font-size: 2rem;
    line-height: 1;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .mobile-menu-close:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .mobile-menu-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 32px;
    padding-left: 16px;
  }

  .mobile-menu-link {
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 1.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-muted);
    transition: color 200ms ease;
  }

  .mobile-menu-link:hover,
  .mobile-menu-link:focus-visible {
    color: var(--ink);
  }

  .mobile-menu-link.is-active {
    color: var(--ink);
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-decoration-thickness: 1.5px;
    text-underline-offset: 6px;
  }

  .mobile-menu-social {
    display: inline-flex;
    align-items: center;
    padding-bottom: 16px;
    font-family: var(--font-mono);
  }

  .mobile-menu-social-link {
    color: var(--ink-muted);
    transition: color 200ms ease;
  }

  .mobile-menu-social-link:hover,
  .mobile-menu-social-link:focus-visible {
    color: var(--accent);
  }

  .mobile-menu-social-sep {
    color: var(--ink-muted);
    margin: 0 6px;
  }
</style>

<script>
  // MobileMenu wiring — D-08 focus trap parity with src/scripts/chat.ts setupFocusTrap.
  // Re-queries focusable elements on EVERY Tab keypress so dynamically-added
  // descendants are included. No stagger animation (D-09).
  //
  // BLOCKER 2 fix — Init lifecycle mirrors src/scripts/chat.ts lines 733–742:
  //   1. State reset ALWAYS runs (must precede the double-bind guard so View
  //      Transitions re-init correctly resets overlay state on navigation).
  //   2. Listener binding is guarded separately — bind once per element.
  //   3. Both `DOMContentLoaded` AND `astro:page-load` trigger init — forward
  //      compat with Phase 10 if it reintroduces `<ClientRouter />`. Without
  //      the `astro:page-load` listener, View Transitions re-evaluates the
  //      script but the guarded binding block early-returns, leaving the new
  //      page without listeners.

  function resetMobileMenuState(menu: HTMLElement) {
    // Unconditional reset — safe to call on every init/navigation. Does NOT
    // touch event listeners (those are bound separately by
    // bindMobileMenuListeners and guarded by the menuInitialized flag).
    const trigger = document.getElementById("menu-trigger");
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-label", "Open menu");
    }
    document.body.style.overflow = "";
  }

  function bindMobileMenuListeners(menu: HTMLElement) {
    const trigger = document.getElementById("menu-trigger");
    const closeBtn = document.getElementById("menu-close");
    if (!trigger || !closeBtn) return;

    const backdropEls = menu.querySelectorAll<HTMLElement>("[data-menu-close]");

    function openMenu() {
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      trigger!.setAttribute("aria-expanded", "true");
      trigger!.setAttribute("aria-label", "Close menu");
      document.body.style.overflow = "hidden";
      // Focus the close button first so keyboard users land inside the dialog
      closeBtn!.focus();
      document.addEventListener("keydown", handleKeyDown);
    }

    function closeMenu(returnFocus = true) {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      trigger!.setAttribute("aria-expanded", "false");
      trigger!.setAttribute("aria-label", "Open menu");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      if (returnFocus) trigger!.focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }
      if (e.key !== "Tab") return;

      // D-08: re-query focusable elements on EVERY Tab keypress — matches
      // src/scripts/chat.ts setupFocusTrap so dynamically-rendered descendants
      // (if any are added in later phases) are always included.
      const focusable = menu.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
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

    // Trigger open/close
    trigger.addEventListener("click", () => {
      const isOpen = trigger!.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close button
    closeBtn.addEventListener("click", () => closeMenu());

    // Backdrop click closes
    backdropEls.forEach((el) => {
      el.addEventListener("click", () => closeMenu());
    });

    // Close on nav-link click (before navigation)
    menu.querySelectorAll<HTMLAnchorElement>(".mobile-menu-link").forEach((link) => {
      link.addEventListener("click", () => closeMenu(false));
    });
  }

  function initMobileMenu() {
    const menu = document.querySelector<HTMLElement>(".mobile-menu");
    if (!menu) return;

    // Always reset state on init/navigation. This MUST run BEFORE the
    // guarded event-listener binding so View Transitions re-init correctly
    // clears overlay state on every page navigation.
    resetMobileMenuState(menu);

    // Event listener binding is guarded — only bind once per element. This
    // guard sits AFTER the reset so the reset always runs, per BLOCKER 2.
    if (menu.dataset.menuInitialized === "true") return;
    menu.dataset.menuInitialized = "true";

    bindMobileMenuListeners(menu);
  }

  // Initial load.
  if (document.readyState !== "loading") {
    initMobileMenu();
  } else {
    document.addEventListener("DOMContentLoaded", initMobileMenu);
  }

  // Forward-compat: re-init on Astro View Transitions navigation. Phase 10
  // may reintroduce <ClientRouter />; the listener is a no-op until then.
  // Mirrors src/scripts/chat.ts lines 733–742.
  document.addEventListener("astro:page-load", initMobileMenu);
</script>
```

Notes on implementation:

- The `.mobile-menu-link` font-size is `1.75rem` to match `.h2-project` — this is the planner's choice from the discretion range `{1.75rem | clamp(1.25rem, 2vw, 1.625rem)}`; 1.75rem is more editorially prominent and matches the mockup's body-text h2 cadence
- The `is-open` class controls display (toggle only, no keyframes per D-09)
- `[data-menu-close]` is applied to the backdrop div so backdrop clicks close the menu. The panel itself does NOT have the data attribute so clicks inside the panel don't close the menu
- The focus trap selector `'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'` is copied verbatim from src/scripts/chat.ts line 335 for cross-component parity
- `menu.dataset.menuInitialized` guard prevents double-binding event listeners if the script runs twice (matches Phase 7 ChatWidget idempotency pattern). The guard sits AFTER the state reset call, so every init invocation still runs `resetMobileMenuState` unconditionally — this matters for View Transitions where `astro:page-load` fires on every navigation (BLOCKER 2 fix)
- BOTH `DOMContentLoaded` AND `astro:page-load` listeners are registered — mirrors src/scripts/chat.ts lines 733–742. The `astro:page-load` listener is a no-op until Phase 10 potentially reintroduces `<ClientRouter />`; registering it NOW is free forward-compat insurance
- Init is decomposed into three functions: `resetMobileMenuState()` (unconditional, idempotent state cleanup), `bindMobileMenuListeners()` (event wiring, called once per element), and `initMobileMenu()` (the orchestrator that runs reset then guard-checks before binding). This separation is what makes the reset-before-guard invariant visible at the code level
- `initMobileMenu()` uses `querySelector<HTMLElement>(".mobile-menu")` as the single entry-point — once that handle is in hand, `bindMobileMenuListeners` re-queries the trigger/close button internally. This shape is cheaper than re-running `getElementById` three times inside `initMobileMenu`
- INFO 1 — **Mobile menu link font-size chosen: `1.75rem`** (matches `.h2-project` role class — D-07's allowed range was `{1.75rem | clamp(1.25rem, 2vw, 1.625rem)}`). Picked 1.75rem for tighter visual rhythm with the 3-link stack and cadence parity with the sans-serif body `.h2-project` title size. The `clamp(1.25rem, 2vw, 1.625rem)` alternative was lead-text-sized and felt anemic in the full-screen dialog context
- NO `@keyframes menuLinkIn` — explicitly excluded per D-09
  </action>
  <verify>
    <automated>rtk pnpm run check</automated>
  </verify>
  <acceptance_criteria>
    - File `src/components/primitives/MobileMenu.astro` exists
    - File contains the literal string `const currentPath = Astro.url.pathname`
    - File contains `id="mobile-menu"`
    - File contains `role="dialog"`
    - File contains `aria-modal="true"`
    - File contains `aria-label="Navigation menu"`
    - File contains `id="menu-close"`
    - File contains the literal string `data-menu-close` (backdrop click close hook)
    - File contains the literal string `class="mobile-menu-link"` or `class:list={["mobile-menu-link"` (either is acceptable)
    - File contains the literal string `GITHUB` in the socialLinks array
    - File contains the literal string `LINKEDIN` in the socialLinks array
    - File contains `label: "X"` in the socialLinks array
    - File contains the literal string `mailto:jackcutrara@gmail.com`
    - File contains a `<style>` block
    - File contains the literal string `z-index: 60`
    - File contains the literal string `position: fixed`
    - File contains the literal string `.mobile-menu.is-open`
    - File contains the literal string `font-size: 1.75rem` on .mobile-menu-link
    - File contains the literal string `text-decoration-color: var(--accent)` on .mobile-menu-link.is-active
    - File contains a `<script>` block
    - File contains the literal string `function initMobileMenu`
    - File contains the literal string `function resetMobileMenuState` (BLOCKER 2 — reset MUST run unconditionally on every init call, decoupled from event-listener binding)
    - File contains the literal string `function bindMobileMenuListeners` (BLOCKER 2 — event-binding code sits in a separately-gated block from the reset code)
    - File contains the literal string `astro:page-load` (BLOCKER 2 — forward-compat listener mirroring src/scripts/chat.ts line 736; required for Phase 10 View Transitions compatibility)
    - In `initMobileMenu()`, the call to `resetMobileMenuState(menu)` MUST precede the `menu.dataset.menuInitialized === "true"` early-return check. Verify by line-order: the file line number of the `resetMobileMenuState(menu)` call inside `initMobileMenu` is LESS THAN the file line number of the `menuInitialized === "true"` check inside the same function. This invariant ensures the reset runs on every init invocation (critical for View Transitions re-init on navigation)
    - File contains the literal string `document.getElementById("menu-trigger")`
    - File contains the literal string `document.getElementById("menu-close")`
    - File contains the literal string `document.querySelector<HTMLElement>(".mobile-menu")` (init entry-point uses the class selector rather than `getElementById("mobile-menu")`)
    - File contains the literal string `addEventListener("keydown"` (keyboard handler)
    - File contains the literal string `if (e.key === "Escape")` (Escape close)
    - File contains the literal string `if (e.key !== "Tab") return` (focus trap Tab filter)
    - File contains the literal string `querySelectorAll<HTMLElement>(` inside handleKeyDown (per-Tab re-query — must be inside the Tab branch, NOT hoisted above it)
    - File contains the literal string `document.body.style.overflow = "hidden"` (scroll lock on open, inside `openMenu`)
    - File contains the literal string `document.body.style.overflow = ""` (scroll unlock — appears in BOTH `closeMenu` and `resetMobileMenuState`; grep count ≥2)
    - File contains the literal string `trigger!.focus()` inside closeMenu (focus return)
    - File contains the literal string `menuInitialized` (double-bind guard on the event-listener binding only)
    - File contains the literal string `DOMContentLoaded` (initial-load init path alongside `astro:page-load`)
    - File does NOT contain `@keyframes menuLinkIn` (D-09)
    - File does NOT contain `animation:` or `animation-delay:` (D-09)
    - File does NOT contain `translateY` on any mobile-menu-link (D-09)
    - File does NOT contain any Tailwind utility class in markup (D-03)
    - File does NOT contain any inline hex color value
    - File does NOT contain any `<svg>` element (social row is pure mono text, D-07/D-10)
    - File does NOT contain any `import gsap` or `import.*motion` (MASTER §6.1)
    - `rtk pnpm run check` passes
    - `rtk pnpm run build` passes with the file in place
  </acceptance_criteria>
  <done>MobileMenu.astro exists with dialog a11y, per-Tab focus trap, backdrop close, no entrance animation, no SVG icons</done>
</task>

</tasks>

<verification>
- All 4 composite primitive files exist under src/components/primitives/
- `rtk pnpm run build` passes
- `rtk pnpm run check` passes
- `rtk pnpm run lint` passes
- Negative regression (D-03): `rtk grep -nP "class=\"[^\"]*\\b(bg-|text-ink|flex |grid |px-|py-|mx-|my-|md:|lg:)" src/components/primitives/*.astro` returns no matches
- Negative regression (D-16): `rtk grep -nP "#(FAFAF7|0A0A0A|52525B|A1A1AA|E4E4E7|E63946)" src/components/primitives/*.astro` returns no matches
- Negative regression (MASTER §6.1): `rtk grep -n "import gsap\\|from \"gsap\"" src/components/primitives/*.astro` returns no matches
- Negative regression (D-26 chat hands-off): `rtk git diff --stat src/components/chat/ src/scripts/chat.ts src/data/portfolio-context.json` shows no changes
- MobileMenu focus-trap parity: the querySelectorAll line in MobileMenu.astro uses the SAME selector string as src/scripts/chat.ts line 335
</verification>

<success_criteria>
- Header.astro sticky 72px with container-query hamburger at 380px, active underline, internal pathname
- Footer.astro 64px single-row desktop, 3-row vertical stack at <768px with social link row between copy and built
- WorkRow.astro 56px/1fr/auto grid, opacity-only arrow reveal, underline on hover+focus
- MobileMenu.astro dialog overlay with per-Tab focus trap, Escape/backdrop close, scroll lock, focus return, no stagger animation, no SVG icons
- build, check, lint all pass
- Zero Tailwind utilities in primitive markup, zero inline hex colors, zero GSAP imports
</success_criteria>

<output>
After completion, create `.planning/phases/09-primitives/09-04-SUMMARY.md` recording:
- 4 files created with their line counts
- Any choices made in discretion areas (mobile menu font-size chosen, close button style chosen, etc.)
- Confirmation that focus-trap selector matches src/scripts/chat.ts verbatim
- Confirmation that D-09 (no stagger) and D-10 (social row) are honored
- Commit SHA
</output>
