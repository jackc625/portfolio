# Phase 22: Experience Page & Holloway Case Study - Pattern Map

**Mapped:** 2026-07-09
**Files analyzed:** 5 (3 new pages/routes, 2 nav edits, 1 content edit) + 4 Wave-0 test analogs
**Analogs found:** 8 / 8 (every new file has an exact in-repo analog)

This is a **pure pattern-mirroring phase**. Every new file copies a shipped Projects-surface file almost verbatim, then applies the D-01..D-11 field/structure adaptations. No invention. All pixel/layout finalization is routed to the frontend-design skill (SC5); the excerpts below fix structure, data plumbing, and the code to copy.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/pages/experience.astro` (NEW) | route (listing page) | request-response (build-time SSG, `getCollection`) | `src/pages/projects.astro` | exact |
| `src/pages/experience/[id].astro` (NEW) | route (dynamic detail) | request-response (build-time `getStaticPaths` + `render`) | `src/pages/projects/[id].astro` | exact |
| `src/components/primitives/Header.astro` (EDIT) | component (nav primitive) | request-response | (self — `navLinks` array edit) | exact |
| `src/components/primitives/MobileMenu.astro` (EDIT) | component (nav primitive) | request-response | (self — parallel `navLinks` array edit) | exact |
| `src/content/experience/holloway.mdx` (EDIT) | content (frontmatter) | file-I/O (build-time content) | (self — `company:` field) | exact |
| `tests/build/experience-nav.test.ts` (NEW, Wave 0) | test (source-shape) | batch/transform | `tests/content/case-studies-shape.test.ts` | role-match |
| `tests/content/experience-summary.test.ts` (NEW, Wave 0) | test (content assertion) | batch/transform | `tests/content/case-studies-shape.test.ts` | role-match |
| `tests/content/experience-detail.test.ts` (NEW, Wave 0) | test (getStaticPaths filter) | batch/transform | `tests/scripts/sync-experience-check.test.ts` (test scaffolding idiom) | role-match |

---

## Pattern Assignments

### `src/pages/experience/[id].astro` (route, dynamic detail — the deep-dive)

**Analog:** `src/pages/projects/[id].astro` (read in full, 200 lines — copy near-verbatim)

**Imports pattern** (analog lines 2-6) — drop `NextProject`, add `sortExperienceEntries`:
```astro
import { getCollection, render, type CollectionEntry } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";
import Container from "../../components/primitives/Container.astro";
import ArticleImage from "../../components/ArticleImage.astro";
import { sortExperienceEntries } from "../../lib/experience";
// NOTE: do NOT import NextProject (D-02 drops it)
```

**getStaticPaths pattern** (analog lines 8-21) — swap collection, add `hasCaseStudy` filter (D-01/EXP-05), drop the `nextProject` prop:
```astro
export async function getStaticPaths() {
  const withCaseStudy = sortExperienceEntries(
    await getCollection("experience"),
  ).filter((e) => e.data.hasCaseStudy);   // Balfour (false) → no path; EXP-05 enforced structurally
  return withCaseStudy.map((entry) => ({
    params: { id: entry.id },              // "holloway" → /experience/holloway
    props: { entry },
  }));
}
interface Props { entry: CollectionEntry<"experience">; }
const { entry } = Astro.props;
const { Content } = await render(entry);
```

**Header markup pattern** (analog lines 32-63) — key field adaptations (Pitfall 2): `year` → `dateRange`; `title` → `company`; `tagline` → `summary`; **omit** the external-links row (D-07); **add** D-02 top back link:
```astro
<BaseLayout title={entry.data.company} description={entry.data.summary}>
  <article>
    <section class="section project-header">
      <Container>
        <a class="label-mono back-link" href="/experience">&larr; Back to experience</a>   {/* D-02 top */}
        <div class="label-mono project-meta">
          {entry.data.dateRange} &middot; {entry.data.techStack.join(" · ").toUpperCase()}
        </div>
        <h1 class="h1-section project-title">{entry.data.company}</h1>   {/* "Holloway Company" per D-08 */}
        <p class="lead project-tagline">{entry.data.summary}</p>
        {/* D-07: NO external-links row — confidential contract, no githubUrl/demoUrl fields exist */}
      </Container>
    </section>
```

**MDX body pattern** (analog lines 65-73) — copy verbatim. Pitfall 5: keep BOTH `ArticleImage` import and the `components={{ img: ArticleImage }}` mapping together (Holloway body has no images, so it is inert but forward-compatible):
```astro
    <section class="section project-body-section">
      <Container>
        <div class="prose-editorial">
          <Content components={{ img: ArticleImage }} />
        </div>
      </Container>
    </section>
```

**Displaced `NextProject` slot** (analog lines 75-79) — replace with D-02 bottom back link (occupies the same 48px `.section` slot):
```astro
    <section class="section">
      <Container>
        <a class="label-mono back-link" href="/experience">&larr; Back to experience</a>   {/* D-02 bottom */}
      </Container>
    </section>
```

**Scroll-depth sentinels** (analog lines 81-88) — copy verbatim (D-11). `scroll-depth.ts` auto-attaches to these `.scroll-sentinel` divs; no JS wiring:
```astro
    <div class="scroll-sentinel" data-percent="25" aria-hidden="true"></div>
    <div class="scroll-sentinel" data-percent="50" aria-hidden="true"></div>
    <div class="scroll-sentinel" data-percent="75" aria-hidden="true"></div>
    <div class="scroll-sentinel" data-percent="100" aria-hidden="true"></div>
```

**Page-scoped `<style>` block** (analog lines 91-200) — **copy the ENTIRE block verbatim**. Critical (Pattern 3 / Pitfall 3 / Pitfall 4): this includes (a) `article { position: relative }` + the four `.scroll-sentinel[data-percent]` rules — without `position: relative` the sentinels fire against the viewport and all trigger on load; and (b) the whole `.prose-editorial` + `:global(h2/p/ul/li/a/code/pre)` block, which is **page-scoped here, NOT in `global.css`**. The `:global(h2)::before { content: "\00A7\00A0" }` `§`-prefix already matches Holloway's `## Overview` / `## Highlights` / `## Themes` headings. Do NOT relocate any of this to `global.css` (Pitfall 4 — triggers the D-26 battery). Drop only the `.project-links` rules (lines 124-140) since the links row is omitted.

---

### `src/pages/experience.astro` (route, listing page)

**Analog:** `src/pages/projects.astro` (read in full, 36 lines)

**Imports + data selection pattern** (analog lines 2-11) — swap to the `experience` collection and use `sortExperienceEntries` (Don't-Hand-Roll: do NOT inline `.sort()` — experience sorts by `startDate` desc, not `order`):
```astro
import { getCollection } from "astro:content";
import BaseLayout from "../layouts/BaseLayout.astro";
import Container from "../components/primitives/Container.astro";
import { sortExperienceEntries } from "../lib/experience";
// SectionHeader / WorkRow available for reuse — frontend-design decides which fit the two-tier layout

const entries = sortExperienceEntries(await getCollection("experience"));
const holloway = entries.find((e) => e.data.hasCaseStudy);      // rich featured summary (D-05)
const earlier = entries.filter((e) => !e.data.hasCaseStudy);    // Balfour "Earlier" lightweight (D-06)
```

**Shell pattern** (analog lines 14-36) — `BaseLayout` (D-10 basic title/description) → `.section` → `Container`. The analog maps a uniform `WorkRow` list; **this phase does NOT** — it renders the D-04 asymmetric two-tier (Holloway rich: meta · summary · all 5 highlights · "Read the full case study →" link to `/experience/${holloway.id}`; Balfour light + non-linked "EARLIER" cue). Exact card/block form → frontend-design (SC5):
```astro
<BaseLayout
  title="Experience"
  description="Production engineering experience – the Holloway Connect contract and earlier work."
>
  <section class="section" aria-labelledby="section-experience">
    <Container>
      {/* D-05 Holloway rich summary + D-06 Balfour "Earlier" non-linked — form is frontend-design's */}
    </Container>
  </section>
</BaseLayout>
```
Meta description uses an en dash (`–`), zero em dashes (Pitfall 6). `WorkRow`/`SectionHeader` reference for the row idiom: analog lines 17-32.

---

### `src/components/primitives/Header.astro` (component, nav — EDIT)

**Analog:** self, lines 23-35. Two edits, both minimal (D-03):

**navLinks array** (lines 23-27) — add `experience` **FIRST**:
```ts
const navLinks = [
  { href: "/experience", label: "experience" },   // D-03: FIRST
  { href: "/projects", label: "works" },
  { href: "/about", label: "about" },
  { href: "/contact", label: "contact" },
];
```

**isActive** (lines 29-35) — add the `/experience` startsWith branch (covers `/experience/[id]` exactly as `/projects` covers `/projects/[id]`):
```ts
function isActive(href: string): boolean {
  if (href === "/experience") return currentPath.startsWith("/experience");
  if (href === "/projects") return currentPath.startsWith("/projects");
  if (href === "/about") return currentPath.startsWith("/about");
  if (href === "/contact") return currentPath.startsWith("/contact");
  return false;
}
```
The `.nav-link.is-active` accent-underline styling (lines 120-126) already applies — no CSS change. Do not touch the markup loop (lines 42-54) or `<style>`.

---

### `src/components/primitives/MobileMenu.astro` (component, nav — EDIT)

**Analog:** self, lines 38-57 (parallel to Header). Make the **identical** `navLinks` (lines 38-42) + `isActive` (lines 52-57) edit. **Critical (Pitfall / anti-pattern):** do NOT touch the `<script>` focus-trap / `inert` block below (the `setupFocusTrap` re-query, Escape/backdrop close, `.chat-widget` inert handling) — that block is under the D-26 chat-surface battery. `socialLinks` (lines 45-50) is unrelated; leave it.

---

### `src/content/experience/holloway.mdx` (content, frontmatter — EDIT)

**Analog:** self, line 3. Single-field normalization (D-08):
```yaml
company: "The Holloway Company"   →   company: "Holloway Company"
```
**Drift-gate safe (Pitfall 1):** `scripts/sync-experience.mjs` reassembles `frontmatter (read verbatim from the .mdx) + body (from the fenced source)` and diffs — only the **body** is effectively compared, so a frontmatter edit cannot produce drift. Do NOT route this through `Experience/HOLLOWAY_EXPERIENCE.md`. Do NOT hand-edit the MDX body (Pitfall 2 / D-09) — body changes go through the source + `pnpm sync:experience`. Leave the body's intro blockquote "the Holloway Company" verbatim unless the planner elects a source-side edit + re-sync.

---

## Wave 0 Test Analogs (mirror these for the new tests)

### `tests/content/case-studies-shape.test.ts` — the content-shape idiom

Read in full (37 lines). Pattern to copy for `experience-summary.test.ts` and `experience-nav.test.ts`: a hardcoded slug/const list + `readFile` of the source file + normalize `\r\n` + regex/string assertions. Reusable skeleton:
```ts
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
// read src/content/experience/holloway.mdx frontmatter → assert company === "Holloway Company",
//   role/dateRange/techStack present, highlights.length === 5 (SC2 + D-08)
// read Header.astro + MobileMenu.astro source → assert "/experience" appears FIRST in navLinks
//   and isActive has a startsWith("/experience") branch (SC1)
```
Note the frontmatter/body split idiom at analog lines 29-32 (`indexOf("\n---\n", 4)` then slice) — reuse to read Holloway frontmatter or count body H2s.

### `tests/scripts/sync-experience-check.test.ts` (+ `sync-experience.test.ts`, `sync-experience-idempotency.test.ts`) — the script/behavioral idiom

For `experience-detail.test.ts` (SC3/SC4 — assert `getStaticPaths` id set === `["holloway"]`, excludes `balfour-beatty`), the cleanest mirror is to import `sortExperienceEntries` and replicate the filter over a fixture, OR assert against the collection. The sync tests (lines 1-45 read) show the vitest + `node:fs` + tmpdir scaffolding idiom already established in this repo (`mkdtemp`, `execFileSync`, `afterEach` cleanup) if a build-artifact-level assertion is preferred. The filter under test is `entries.filter((e) => e.data.hasCaseStudy)` → only `holloway.mdx` (hasCaseStudy:true) yields a path; `balfour-beatty.mdx` (hasCaseStudy:false) yields none.

---

## Shared Patterns

### Reverse-chron ordering
**Source:** `src/lib/experience.ts` (`sortExperienceEntries<T>`, lines 12-18)
**Apply to:** both new pages (listing + `getStaticPaths`). Drop-in; sorts by `data.startDate` descending, returns a new array. **Never reimplement** — inline `.sort()` by `order` (the projects idiom) is wrong for experience.

### Page-scoped `.prose-editorial` + scroll-sentinel CSS
**Source:** `src/pages/projects/[id].astro` `<style>` (lines 91-200)
**Apply to:** `experience/[id].astro` only. Copy verbatim; keep it page-scoped (NOT `global.css`). Includes `article { position: relative }` (required for sentinel positioning) and the `§`-prefixed `:global(h2)` matching Holloway's headings.

### Nav route+active pairing
**Source:** `Header.astro` lines 23-35 (mirrored in `MobileMenu.astro` lines 38-57)
**Apply to:** both nav primitives. `startsWith` matching gives `/experience/[id]` coverage for free.

### Type-role classes (global, apply directly — no import)
**Source:** `src/styles/global.css` — `.h1-section`, `.h2-project`, `.lead`, `.label-mono`, `.meta-mono`, `.section`
**Apply to:** all new markup. These ARE global (unlike `.prose-editorial`); reference directly. Six design tokens (`--bg`, `--ink`, `--ink-muted`, `--ink-faint`, `--rule`, `--accent`) are global CSS custom properties — use `var(--…)` without adding global rules.

### Back-link idiom (displaced NextProject)
**Source:** `src/components/NextProject.astro` (lines 30-38) — reference for the link grammar, NOT reused as a component
**Apply to:** the D-02 top+bottom back links on the deep-dive. Mono text link, hover→accent + arrow (`←`) opacity reveal 0→1 over 120ms, no translate. Final styling → frontend-design (SC5).

---

## No Analog Found

None. Every new file has an exact or near-exact in-repo analog. The only genuinely new authored artifacts are the two `BaseLayout` meta-description strings (D-10) and the three Wave-0 test files (which mirror existing test idioms).

---

## Metadata

**Analog search scope:** `src/pages/`, `src/pages/projects/`, `src/components/primitives/`, `src/components/`, `src/lib/`, `src/content/experience/`, `tests/content/`, `tests/scripts/`
**Files read for excerpts:** `projects/[id].astro` (full), `projects.astro` (full), `Header.astro` (full), `MobileMenu.astro` (nav section), `experience.ts` (full), `holloway.mdx` (frontmatter), `balfour-beatty.mdx` (full), `NextProject.astro` (link markup), `case-studies-shape.test.ts` (full), `sync-experience-check.test.ts` (scaffold)
**Pattern extraction date:** 2026-07-09
</content>
</invoke>
