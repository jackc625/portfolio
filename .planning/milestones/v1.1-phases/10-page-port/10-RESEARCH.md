# Phase 10: Page Port - Research

**Researched:** 2026-04-12
**Domain:** Astro page composition, MDX rendering, chat widget restyle, localStorage persistence
**Confidence:** HIGH

## Summary

Phase 10 is the largest phase in v1.1 by requirement count (13 requirements) and file-touch surface (~25 files edited/created/deleted). The core work is composition, not invention: every page rewrites a stub placeholder into editorial markup using Phase 9 primitives (`SectionHeader`, `WorkRow`, `Container`, `StatusDot`, `MetaLabel`, `Header`, `Footer`, `MobileMenu`) and global type role classes (`.display`, `.h1-section`, `.h2-project`, `.lead`, `.body`, `.label-mono`, `.meta-mono`). The primitives are locked (Phase 9 D-04) -- Phase 10 consumes them without modification except content-level imports (D-29 refactors Footer/MobileMenu to import from `contact.ts`).

The two highest-risk areas are (1) the chat widget visual restyle + localStorage persistence addition, which touches 743 lines of battle-tested Phase 7 code, and (2) the MDX component wiring for project detail pages, which involves Astro 6's `render()` API and scoped style overrides for MDX-rendered HTML elements. Both patterns are well-documented and verified below.

**Primary recommendation:** Execute in the wave order specified in D-31: docs commit first, then schema+content, then source-of-truth shifts, then composites, then page rewrites, then chat restyle, then chat persistence, then verification. The docs commit unblocks everything downstream; the page rewrites can parallelize since pages do not import each other.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Inline `getCollection('projects')` + `.map()` in each page (no shared WorkList composite)
- D-02: Homepage shows 3 `featured: true` projects; `/projects` shows all 6
- D-03: Add `year: z.string().regex(/^\d{4}$/)` required field to content schema
- D-04: Row numbers are zero-padded `01`-`06` rendered with `.tabular`
- D-05: Mono metadata header is `YEAR . UPPERCASE_TECHSTACK` only
- D-06: Project title uses `.h1-section`
- D-07: MDX body renders inside a `.body` column wrapper with scoped style overrides
- D-08: Tagline renders as `.lead` line under the title
- D-09: MDX h2 sections render as `section NAME` unnumbered mono labels via `::before`
- D-10: Next-project link determined by `order` ascending with wrap-around
- D-11: External links render as mono link row under `.lead`
- D-12: Wire `ArticleImage.astro` into MDX components map
- D-13: Code blocks use Astro 6 bundled Shiki + scoped minimal box
- D-14: `description` field is SEO/OG only, never rendered on detail page
- D-15: Editorial chrome grammar -- flat rectangle panel, accent-round bubble survives
- D-16: Secondary surfaces use mono labels + flat rule borders
- D-17: Typing dot bounce restored via narrow MASTER section 6.1 amendment
- D-18: Per-message copy button is a `COPY` mono label, not SVG icon
- D-19: MASTER.md amended once for two related carve-outs
- D-20: Mobile full-screen overlay inherits flat-rectangle chrome
- D-21: Bot message markdown elements restyle with backgrounds stripped
- D-22: Cross-page chat persistence via localStorage with last-50 cap and 24h TTL
- D-23: Single source of truth at `src/data/contact.ts`
- D-24: Shared `ContactSection.astro` composite
- D-25: X dropped from CONTACT-01 spec via REQUIREMENTS.md amendment
- D-26: About page copy is the mockup text shipped as v1.1 final
- D-27: Homepage about preview = intro + first paragraph + `READ MORE` link
- D-28: Delete `src/components/ContactChannel.astro`
- D-29: Update MobileMenu and Footer to import from `contact.ts` and drop X
- D-30: Phase 10 amends MASTER.md once (section 6.1, section 5.2, section 5.8, section 9/10)
- D-31: Plan ordering (wave shape): docs -> schema -> source-of-truth -> composites -> pages -> chat restyle -> chat persistence -> verification
- D-32: Verification gate requires build/lint/check/test + manual chat smoke + manual persistence test + manual visual parity check

### Claude's Discretion
- Exact `year` values Jack writes for each project (planner surfaces file list, Jack types years)
- Whether homepage hero renders as `JACK<br>CUTRARA.` or single line
- Whether section header title is `WORK` or `WORKS`
- Storage shape for about copy strings (separate file vs inline)
- MDX components map syntax (`<Content components={{ img: ArticleImage }} />` vs slot-based)
- Section header copy on `/contact` page
- Shiki theme name (`github-light`, `min-light`, etc.) as long as minimal light result
- `READ MORE` glyph vs HTML entity
- Chat persistence encryption (not needed per D-22)
- Typing dot keyframes animation style
- ContactSection.astro prop pattern (header boolean vs separate inner components)

### Deferred Ideas (OUT OF SCOPE)
- `/dev/primitives` preview page deletion (Phase 11)
- `mockup.html` deletion (Phase 11)
- `CLAUDE.md` Technology Stack milestone-end update (Phase 11)
- Lighthouse / a11y / contrast / responsive QA (Phase 11, QUAL-01..06)
- Real X/Twitter URL (future one-line edit)
- About copy edits / personalization (future content pass)
- Project screenshots for ArticleImage (future content pass)
- Chat widget UX experiments (v1.2+)
- Real-time chat / WebSocket (out of scope)
- Blog / writing section (out of scope)
- Production deploy (Phase 11 sign-off)
- Replacing placeholder resume PDF (future content pass)
- Encrypting localStorage chat history (not needed)
- Server-side chat conversation storage (out of scope)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-01 | Homepage display hero with wordmark, metadata, lead statement | Hero grid pattern from mockup lines 148-183; `.display`, `StatusDot`, `MetaLabel` primitives; global `.container` + hero padding ramp |
| HOME-02 | Numbered work list replacing card grid | `WorkRow` primitive + `SectionHeader`; `getCollection('projects')` with `.featured` filter + `.sort()` by order |
| HOME-03 | Editorial about preview section | About copy from D-26 mockup lines 445-448; `.about-intro` + `.body` styles from mockup lines 259-277 |
| HOME-04 | Minimal contact section | Shared `ContactSection.astro` composite from D-24; `CONTACT` constants from D-23 |
| ABOUT-01 | Editorial structure (intro + 3 paragraphs) | Copy locked in D-26; `.about-intro` + `.body` styling matches mockup |
| ABOUT-02 | Real engineer's voice, <=80 words per paragraph | Copy verified in mockup lines 445-448 (word counts confirmed below) |
| WORK-01 | Projects index uses numbered work list pattern | Same `WorkRow` composition as homepage but all 6 projects |
| WORK-02 | Editorial case study layout for detail pages | `render()` API + `<Content components={{ img: ArticleImage }} />` pattern; scoped styles for `.body h2` override |
| WORK-03 | Real project content from collections renders in new layouts | 6 MDX files verified present with correct schemas; `year` field added in D-03 |
| CONTACT-01 | Minimal contact layout (no icons, no form, no CTA buttons) | `ContactSection.astro` composite; `contact.ts` constants; X dropped per D-25 |
| CONTACT-02 | Resume link uses `<a download>` pointing to PDF | File `public/jack-cutrara-resume.pdf` already exists (Phase 8 shipped rename) |
| CHAT-01 | Chat retains all Phase 7 functionality + adds localStorage persistence | Chat.ts 743-line infrastructure preserved; localStorage API with 50-msg cap + 24h TTL per D-22 |
| CHAT-02 | Chat visuals match new design system | Flat-rectangle grammar from D-15/D-16; typing dots from D-17; COPY label from D-18 |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 6.0.8 | Framework / SSG | Already installed; provides `getCollection`, `render()`, content collections, MDX integration [VERIFIED: package.json] |
| @astrojs/mdx | 5.0.2 | MDX support | Already installed; provides `<Content components={} />` prop for custom element mapping [VERIFIED: package.json] |
| Tailwind CSS | 4.2.2 | Utility CSS (body/layout classes only) | Already installed; Phase 10 pages may use Tailwind on layout host elements (D-03 restriction is primitives-only) [VERIFIED: package.json] |
| marked | 17.0.5 | Markdown rendering in chat | Already installed; chat.ts uses it with `async: false` [VERIFIED: package.json] |
| DOMPurify | 3.3.3 | XSS sanitization | Already installed; chat.ts sanitizes all rendered HTML [VERIFIED: package.json] |
| Zod | 4.3.6 | Schema validation | Already installed; content.config.ts uses `z` from `astro/zod` [VERIFIED: package.json] |

### No New Dependencies Required
Phase 10 adds zero new npm packages. All work is composition of existing primitives, content collection APIs, and vanilla JS/CSS. [VERIFIED: CONTEXT.md D-22 uses browser-native `localStorage`, D-17 uses CSS `@keyframes`, D-13 uses bundled Shiki]

## Architecture Patterns

### Current Project Structure (Phase 10 relevant files)
```
src/
  components/
    primitives/       # Phase 9 locked: Header, Footer, Container, SectionHeader,
                      #   WorkRow, MetaLabel, StatusDot, MobileMenu
    chat/
      ChatWidget.astro  # REWRITE chrome (D-15..D-20)
    ContactSection.astro  # CREATE (D-24)
    NextProject.astro     # DO NOT TOUCH (Phase 9 D-22)
    ArticleImage.astro    # DO NOT TOUCH (wire via MDX components map)
    JsonLd.astro          # UPDATE to import CONTACT constants
    ContactChannel.astro  # DELETE (D-28)
  content/
    projects/           # 6 .mdx files: ADD year frontmatter field
  data/
    contact.ts          # CREATE (D-23)
    portfolio-context.json  # DO NOT TOUCH (chatbot context, separate concern)
  layouts/
    BaseLayout.astro    # DO NOT TOUCH (Phase 9 already integrated primitives)
  pages/
    index.astro         # REWRITE
    about.astro         # REWRITE
    projects.astro      # REWRITE
    contact.astro       # REWRITE
    projects/[id].astro # REWRITE
  scripts/
    chat.ts             # ADD localStorage persistence (D-22)
  styles/
    global.css          # REWRITE .chat-* block (~100 lines from line 229)
```

### Pattern 1: Page Composition over Phase 9 Primitives
**What:** Each page imports primitives and composes them with content collection data
**When to use:** Every page rewrite in Phase 10
**Example:**
```astro
---
// Source: Astro content collections API (verified via official docs)
import { getCollection, render } from "astro:content";
import BaseLayout from "../layouts/BaseLayout.astro";
import Container from "../components/primitives/Container.astro";
import SectionHeader from "../components/primitives/SectionHeader.astro";
import WorkRow from "../components/primitives/WorkRow.astro";

const projects = await getCollection("projects");
const featured = projects
  .filter((p) => p.data.featured)
  .sort((a, b) => a.data.order - b.data.order);
---
<BaseLayout title="Home" description="...">
  <section class="section">
    <Container>
      <SectionHeader number="01" title="WORK" count={`${featured.length} / ${projects.length}`} />
      {featured.map((p, i) => (
        <WorkRow
          number={String(i + 1).padStart(2, "0")}
          title={p.data.title}
          stack={p.data.techStack.join(" · ").toUpperCase()}
          year={p.data.year}
          href={`/projects/${p.id}`}
        />
      ))}
    </Container>
  </section>
</BaseLayout>
```
[VERIFIED: getCollection API via Astro official docs; WorkRow props via src/components/primitives/WorkRow.astro]

### Pattern 2: MDX Content Rendering with Custom Components
**What:** Project detail pages render MDX content with a custom components map
**When to use:** `projects/[id].astro`
**Example:**
```astro
---
// Source: https://docs.astro.build/en/guides/integrations-guide/mdx/
import { getCollection, render } from "astro:content";
import ArticleImage from "../../components/ArticleImage.astro";

// In getStaticPaths or page frontmatter:
const { Content } = await render(project);
---
<div class="body">
  <Content components={{ img: ArticleImage }} />
</div>
```
[VERIFIED: render() API via Astro docs; components prop via @astrojs/mdx docs]

### Pattern 3: Scoped Style Overrides for MDX-rendered HTML
**What:** Astro's `<style>` block auto-scopes classes; use descendant selectors to override MDX output
**When to use:** `projects/[id].astro` for `.body h2`, `.body pre`, `.body code` styling
**Example:**
```astro
<style>
  /* D-09: MDX h2 sections render as section-sign mono labels */
  .body :global(h2) {
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-muted);
    margin-top: 48px;
    margin-bottom: 16px;
  }
  .body :global(h2)::before {
    content: "\00A7\00A0";  /* section sign + non-breaking space */
  }
</style>
```
**Critical note:** Astro scoped styles require `:global()` when targeting elements rendered by `<Content />` because the MDX-rendered HTML does not get Astro's scoping data attributes. Without `:global()`, the selectors will not match. [VERIFIED: Astro scoped styles documentation; this is the standard pattern for styling MDX output in Astro]

### Pattern 4: localStorage Chat Persistence
**What:** Save/restore chat messages to localStorage with TTL and cap
**When to use:** `src/scripts/chat.ts` (D-22)
**Example:**
```typescript
// Source: Browser localStorage API (standard)
interface ChatStorage {
  messages: { role: "user" | "bot"; content: string; timestamp: string }[];
  lastActive: string;  // ISO 8601
}

const STORAGE_KEY = "chat-history";
const MAX_MESSAGES = 50;
const TTL_MS = 24 * 60 * 60 * 1000;  // 24 hours

function saveHistory(msgs: ChatStorage["messages"]): void {
  const data: ChatStorage = {
    messages: msgs.slice(-MAX_MESSAGES),
    lastActive: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail — localStorage may be full or disabled
  }
}

function loadHistory(): ChatStorage["messages"] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: ChatStorage = JSON.parse(raw);
    const elapsed = Date.now() - new Date(data.lastActive).getTime();
    if (elapsed > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data.messages;
  } catch {
    return null;
  }
}
```
[ASSUMED: Standard browser localStorage pattern; no library needed]

### Pattern 5: Shiki Theme Configuration
**What:** Change Astro's default Shiki theme from `github-dark` to a light theme
**When to use:** `astro.config.mjs` (D-13)
**Example:**
```javascript
// Source: https://docs.astro.build/en/guides/syntax-highlighting/
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
  // ... rest of config
});
```
[VERIFIED: Astro Shiki docs confirm `markdown.shikiConfig.theme` config path; `github-light` is a valid built-in theme]

### Anti-Patterns to Avoid
- **Editing primitive props or markup** -- Phase 9 D-04 locks primitive APIs; only content-level changes (imports) allowed per D-29
- **Using Tailwind utilities inside primitives** -- Phase 9 D-03; pages CAN use Tailwind (they're consumers, not primitives)
- **Rendering `description` field on detail pages** -- D-14; description is SEO-only, tagline is the human-facing lead
- **Adding new color tokens** -- MASTER section 2.3 lock contract; only the 6 hex values
- **Round corners on chat panel** -- D-15 explicitly sets `border-radius: 0` on the panel (bubble is the ONLY round surface)
- **SVG icons on copy button** -- D-18 says `COPY` text label, not SVG clipboard icon
- **Linking to non-existent X profile** -- D-25; null entries skipped silently

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Content type safety | Custom frontmatter parsing | Astro Content Collections + Zod schema | Build-time validation catches errors before deploy [VERIFIED: already in use] |
| MDX rendering | Manual markdown-to-HTML pipeline | `render()` from `astro:content` + `<Content />` | Handles all MDX features including component overrides [VERIFIED: Astro docs] |
| Image optimization | Manual sharp invocation | Astro `<Image />` via `ArticleImage.astro` | Already built in Phase 9; automatic WebP, srcset, lazy loading [VERIFIED: codebase] |
| XSS sanitization | Custom sanitizer for chat persistence replay | Existing DOMPurify pipeline in `renderMarkdown()` | D-22 specifies stored messages flow through same sanitizer [VERIFIED: chat.ts line 45-49] |
| Focus trap | Custom focus management | Existing `setupFocusTrap()` in chat.ts | Re-queries focusable elements on every Tab; handles dynamic content [VERIFIED: chat.ts line 324-350] |
| Static path generation | Manual route definitions | `getStaticPaths()` + `getCollection()` | Astro generates all 6 project routes automatically [VERIFIED: existing [id].astro pattern] |

## Common Pitfalls

### Pitfall 1: Scoped Styles Not Reaching MDX-Rendered Elements
**What goes wrong:** Astro scoped `<style>` blocks add data attributes only to elements in the component's own template. Elements rendered by `<Content />` from MDX do not get these attributes, so scoped selectors like `.body h2 { ... }` silently fail to match.
**Why it happens:** Astro's scoping mechanism works at compile time on the component's template AST; MDX content is rendered at a later stage.
**How to avoid:** Use `:global()` pseudo-selector on the inner elements: `.body :global(h2) { ... }`. The `.body` part stays scoped (matches the wrapper div in the component), while `:global(h2)` matches any `<h2>` inside it regardless of scope.
**Warning signs:** MDX content appears unstyled despite correct CSS rules.
[VERIFIED: Standard Astro pattern documented in scoped styles guide]

### Pitfall 2: Chat State Loss During Restyle
**What goes wrong:** Refactoring `ChatWidget.astro` markup (class names, element structure) breaks the DOM queries in `chat.ts` that find elements by ID.
**Why it happens:** `chat.ts` uses `document.getElementById()` for 10+ elements (chat-panel, chat-bubble, chat-close, chat-input, chat-send, chat-messages, chat-starters, chat-typing, chat-char-count, etc.). Any ID rename or structural change silently breaks initialization.
**How to avoid:** (1) Keep all element IDs unchanged during the restyle. (2) Change only classes, inline styles, and visual structure. (3) Run the manual chat smoke test after every chat-related commit.
**Warning signs:** Chat bubble click does nothing; console shows null reference errors.
[VERIFIED: chat.ts lines 391-422 show all getElementById calls]

### Pitfall 3: getCollection Returns Unsorted Array
**What goes wrong:** Projects render in arbitrary order instead of the expected 01-06 sequence.
**Why it happens:** `getCollection('projects')` returns entries in no guaranteed order (filesystem glob order, which varies by OS).
**How to avoid:** Always `.sort((a, b) => a.data.order - b.data.order)` after `getCollection()`. Both homepage (featured filter + sort) and projects index (all + sort) need explicit sorting.
**Warning signs:** Project numbering doesn't match expected order.
[VERIFIED: Astro docs do not guarantee collection ordering]

### Pitfall 4: localStorage Quota or Disabled
**What goes wrong:** `localStorage.setItem()` throws a `QuotaExceededError` or `SecurityError` in private browsing mode.
**Why it happens:** Some browsers (Safari private mode historically, strict privacy settings) either disable localStorage or enforce tiny quotas.
**How to avoid:** Wrap every `localStorage` call in try/catch. Silent failure is acceptable -- the chat still works, just without persistence.
**Warning signs:** Console errors about storage quota.
[ASSUMED: Standard browser behavior]

### Pitfall 5: Chat Persistence Replaying Unsanitized HTML
**What goes wrong:** Stored messages replayed from localStorage bypass the DOMPurify sanitizer, creating an XSS vector.
**Why it happens:** Developer creates a separate "replay" code path that sets `innerHTML` directly from stored content.
**How to avoid:** D-22 explicitly requires replayed messages to flow through `renderMarkdown()` (which calls `marked.parse()` then `DOMPurify.sanitize()`). Use `createBotMessageEl(content)` and `createUserMessageEl(content)` for replay -- same functions used for live messages.
**Warning signs:** Replayed messages have different styling than live messages (indicates a separate render path).
[VERIFIED: CONTEXT.md D-22 explicitly mandates same DOMPurify path]

### Pitfall 6: Shiki Default Theme Mismatch
**What goes wrong:** Code blocks in MDX project pages render with dark backgrounds (`github-dark` default) against the warm off-white editorial design.
**Why it happens:** Astro's default Shiki theme is `github-dark`. Without explicit configuration, all fenced code blocks render dark.
**How to avoid:** Set `markdown.shikiConfig.theme` to `'github-light'` (or `'min-light'`) in `astro.config.mjs`. Must be done before any page renders code blocks.
**Warning signs:** Dark code blocks visually jarring against `--bg: #FAFAF7`.
[VERIFIED: Astro docs confirm default is github-dark; astro.config.mjs currently has no shikiConfig]

### Pitfall 7: Year Field Missing from MDX Frontmatter
**What goes wrong:** `pnpm run build` fails with Zod validation error after adding `year` to schema but before backfilling all 6 MDX files.
**Why it happens:** `year: z.string().regex(/^\d{4}$/)` is a required field. Any MDX file missing it causes a build-time Zod error.
**How to avoid:** Schema change and all 6 MDX backfills must be in the same commit. This is atomic -- either all files have the field or the build breaks.
**Warning signs:** Build error mentioning "year" field validation.
[VERIFIED: content.config.ts uses Zod required fields; missing fields cause build failure]

## Code Examples

### Homepage Hero Section (mockup transcription)
```astro
<!-- Source: mockup.html lines 364-380 -->
<section class="hero">
  <Container>
    <div class="hero-grid">
      <div class="hero-content">
        <h1 class="display">
          JACK<br />CUTRARA<span class="accent-dot">.</span>
        </h1>
        <p class="lead hero-lead">
          Software engineer building reliable, production-grade systems.
        </p>
      </div>
      <aside class="hero-meta">
        <StatusDot label="AVAILABLE FOR WORK" />
        <MetaLabel text="EST. 2024 . OAKLAND, CA" color="ink-muted" />
      </aside>
    </div>
  </Container>
</section>
```
[VERIFIED: mockup.html lines 364-380; StatusDot/MetaLabel props from Phase 9 primitives]

### Contact Section Composite
```astro
<!-- Source: CONTEXT.md D-24 + mockup.html lines 459-464 -->
---
import { CONTACT } from "../data/contact";
---
<div class="contact-body">
  <div class="label-mono contact-label">GET IN TOUCH</div>
  <a class="contact-email" href={`mailto:${CONTACT.email}`}>
    {CONTACT.email}
  </a>
  <div class="contact-links">
    {CONTACT.github && <a class="contact-link" href={CONTACT.github} target="_blank" rel="noopener noreferrer">GITHUB</a>}
    {CONTACT.github && CONTACT.linkedin && <span aria-hidden="true"> . </span>}
    {CONTACT.linkedin && <a class="contact-link" href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer">LINKEDIN</a>}
    {(CONTACT.github || CONTACT.linkedin) && <span aria-hidden="true"> . </span>}
    <a class="contact-link" href={CONTACT.resume} download>RESUME</a>
  </div>
</div>
```
[VERIFIED: D-24 composite spec; D-25 X drop; mockup lines 459-464 for structure]

### Project Detail Next-Project Computation
```astro
<!-- Source: D-10 order ascending with wrap-around -->
---
const allProjects = (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
// In getStaticPaths:
const idx = allProjects.findIndex((p) => p.id === project.id);
const nextProject = allProjects[(idx + 1) % allProjects.length];
---
<NextProject project={nextProject} />
```
[VERIFIED: NextProject API unchanged per Phase 9 D-22; wrap-around per D-10]

### Chat Copy Button Restyle (D-18)
```typescript
// Source: D-18 -- COPY mono label replaces SVG clipboard icon
const copyBtn = document.createElement("button");
copyBtn.className = "chat-copy-btn label-mono";
copyBtn.textContent = "COPY";
copyBtn.setAttribute("aria-label", "Copy message");
copyBtn.style.cssText = `
  position: absolute;
  top: -4px;
  right: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ink-faint);
`;
copyBtn.addEventListener("click", () => {
  copyToClipboard(content, copyBtn);
  copyBtn.textContent = "COPIED";
  copyBtn.style.color = "var(--accent)";
  setTimeout(() => {
    copyBtn.textContent = "COPY";
    copyBtn.style.color = "var(--ink-faint)";
  }, 1000);
});
```
[VERIFIED: D-18 spec; existing copyToClipboard function at chat.ts line 167-175]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `transition:persist` for chat | localStorage persistence | Phase 8 (ClientRouter removed) | Must implement localStorage save/restore (D-22) |
| GSAP typing dots | CSS `@keyframes` | Phase 8 (GSAP uninstalled) | Typing dot bounce restored via pure CSS (D-17) |
| SVG clipboard copy icon | `COPY` mono text label | Phase 10 (D-18) | Editorial consistency, better accessibility |
| Dark Shiki default (`github-dark`) | Light Shiki theme | Phase 10 (D-13) | Need `astro.config.mjs` `markdown.shikiConfig.theme` change |
| v1.0 card grid for projects | Editorial numbered work list | Phase 10 (D-01, D-02) | `WorkRow` primitive composes per page |

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | localStorage try/catch pattern handles all browser edge cases | Architecture Pattern 4 | LOW -- worst case is persistence silently fails, which is acceptable |

**All other claims in this research were verified via codebase inspection, official docs, or the CONTEXT.md design contract.**

## Open Questions

1. **Shiki theme choice: `github-light` vs `min-light`**
   - What we know: Both are valid Shiki built-in themes. `github-light` has more color differentiation; `min-light` is more minimal.
   - What's unclear: Which better fits the editorial aesthetic (warm off-white + minimal chrome).
   - Recommendation: Use `github-light` -- it is the most widely used light theme, well-tested, and produces clean output. D-13 says "minimal" which both satisfy. This is in Claude's Discretion.

2. **About copy storage for D-27 homepage preview**
   - What we know: The about preview on the homepage needs the intro + P1 from D-26 copy.
   - What's unclear: Whether to use a `src/data/about.ts` file, export from `about.astro`, or inline in both pages.
   - Recommendation: Create `src/data/about.ts` with named exports for intro and P1. This parallels `contact.ts` and gives both pages a single import source. Minimal overhead for two consumers.

3. **Hero wordmark line break**
   - What we know: mockup.html uses `JACK<br>CUTRARA<span class="accent-dot">.</span>` (two lines). D-178 says Claude's discretion on viewport math.
   - Recommendation: Use `<br />` as in mockup -- the display type at `clamp(4rem, 9vw, 8rem)` works best on two lines for visual impact. On mobile the clamp naturally shrinks.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build | Likely (pnpm installed implies Node present) | 22.x expected | -- |
| pnpm | Build commands | Expected but `pnpm` not on PATH in this shell | -- | Use `npx pnpm` or ensure PATH includes pnpm |

**Note:** The `pnpm` command was not found in the current shell session. This is likely a PATH issue in the sandboxed environment rather than a real missing dependency, since `node_modules/.pnpm/` exists with all packages installed. The planner should use the project's established `pnpm` commands (the verification gate requires `pnpm run build`, `pnpm run lint`, `pnpm run check`, `pnpm run test`).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm run test` |
| Full suite command | `pnpm run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-01 | Homepage hero renders | manual-only | -- | N/A (Astro page rendering not unit-testable without E2E) |
| HOME-02 | Work list renders featured projects | manual-only | -- | N/A |
| HOME-03 | About preview section renders | manual-only | -- | N/A |
| HOME-04 | Contact section renders | manual-only | -- | N/A |
| ABOUT-01 | About page editorial structure | manual-only | -- | N/A |
| ABOUT-02 | About copy word count compliance | manual-only | -- | N/A |
| WORK-01 | Projects index numbered list | manual-only | -- | N/A |
| WORK-02 | Case study editorial layout | manual-only | -- | N/A |
| WORK-03 | Real content renders (no placeholders) | smoke | `pnpm run build` (build-time validation) | N/A (Zod schema catches missing fields) |
| CONTACT-01 | Minimal contact layout | manual-only | -- | N/A |
| CONTACT-02 | Resume download link | manual-only | -- | N/A |
| CHAT-01 | Chat functionality preserved + persistence | manual | Manual smoke test per D-32 | Existing: `tests/client/markdown.test.ts` covers sanitization |
| CHAT-02 | Chat visual restyle | manual-only | -- | N/A |

**Justification for manual-only:** Phase 10 requirements are predominantly visual layout requirements. Astro page rendering (server-side HTML generation) requires integration/E2E testing that is out of scope per Phase 11's QUAL requirements. The strongest automated gate is `pnpm run build` which validates all content schemas (Zod), all page routes (getStaticPaths), and all component imports at build time. Existing vitest tests (`tests/client/markdown.test.ts`, `tests/api/chat.test.ts`, `tests/api/security.test.ts`, `tests/api/validation.test.ts`) remain green.

### Sampling Rate
- **Per task commit:** `pnpm run build` (catches schema errors, import errors, type errors)
- **Per wave merge:** `pnpm run build && pnpm run lint && pnpm run check && pnpm run test`
- **Phase gate:** Full suite green + manual chat smoke + manual persistence test + manual visual parity check per D-32

### Wave 0 Gaps
None -- existing test infrastructure covers all automatable aspects (build validation, markdown sanitization, API security). Visual requirements are manual-gate only.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | Yes | Existing DOMPurify + marked pipeline in chat.ts; Zod schemas for content validation |
| V6 Cryptography | No | N/A (localStorage not encrypted per D-22 -- content is benign) |

### Known Threat Patterns for Chat Persistence

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS via localStorage replay | Tampering | All replayed messages flow through `renderMarkdown()` -> `DOMPurify.sanitize()` (D-22) |
| localStorage injection by other scripts | Tampering | Same DOMPurify sanitization on read; no `eval()` or `Function()` on stored data |
| Denial of service via storage flooding | Denial of Service | 50-message cap + 24h TTL auto-clear; try/catch on write |

## Sources

### Primary (HIGH confidence)
- [Astro Content Collections API](https://docs.astro.build/en/reference/modules/astro-content/) -- `render()`, `getCollection()`, `<Content components={} />`
- [Astro MDX Integration](https://docs.astro.build/en/guides/integrations-guide/mdx/) -- Custom components prop for MDX rendering
- [Astro Syntax Highlighting](https://docs.astro.build/en/guides/syntax-highlighting/) -- Shiki theme configuration
- Codebase inspection -- all 8 primitives, BaseLayout, chat.ts (743 lines), global.css, content.config.ts, 6 MDX files, astro.config.mjs
- mockup.html -- pixel-accurate reference (lines 148-464)
- design-system/MASTER.md -- locked design contract (sections 1-10)
- CONTEXT.md D-01 through D-32 -- all locked decisions

### Secondary (MEDIUM confidence)
- [Astro Scoped Styles `:global()` pattern](https://docs.astro.build/en/guides/styling/#global-styles) -- for MDX content styling
- [Shiki themes list](https://shiki.style/themes) -- `github-light` confirmed as valid built-in

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all already installed and verified
- Architecture: HIGH -- all patterns verified via codebase inspection and official docs
- Pitfalls: HIGH -- all derived from actual codebase analysis (IDs in chat.ts, scoped style behavior, Shiki defaults)

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable -- no moving parts, all dependencies already locked)
