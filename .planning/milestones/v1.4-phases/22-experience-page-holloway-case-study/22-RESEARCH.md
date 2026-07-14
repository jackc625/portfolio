# Phase 22: Experience Page & Holloway Case Study - Research

**Researched:** 2026-07-09
**Domain:** Astro 6 static-site content rendering (Content Collections + `getStaticPaths` + editorial primitives)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Holloway deep-dive on a **dedicated dynamic route `/experience/[id]`**, mirroring `src/pages/projects/[id].astro` exactly (`getStaticPaths` + `render()`). `getStaticPaths` **filters `hasCaseStudy === true`** — only Holloway builds a detail page; Balfour generates none. Forward-compatible for future case-study engagements. Rejected: hardcoded `/experience/holloway`; inline accordion on `/experience`.
- **D-02:** Back-to-summary affordance (EXP-04) is a **mono text link at BOTH top (under header) and bottom** (the slot `NextProject` occupies). `NextProject` card is **dropped** (Holloway is the only case study).
- **D-03:** New nav entry, label **`experience`**, positioned **FIRST**: `experience · works · about · contact`. Update BOTH `Header.astro` and `MobileMenu.astro` (parallel `navLinks` + `isActive`). `isActive` = `currentPath.startsWith("/experience")` (covers `/experience/[id]`).
- **D-04:** **Asymmetric two-tier layout** on `/experience`. Holloway = rich featured summary; Balfour = visibly lighter earlier-work entry. Split driven by the `hasCaseStudy` flag. Exact visual form (card vs bordered block vs section) → frontend-design skill.
- **D-05:** Holloway scannable summary surfaces: **meta line (role · company · dates · stack) + first-person `summary` sentence + ALL 5 `highlights` + a "Read the full case study →" link.**
- **D-06:** Balfour framed with a subtle **"Earlier" cue** (light mono label/divider), **non-linked** (no detail route). Reverse-chron already places it second. Exact divider/label styling → frontend-design.
- **D-07:** Detail-page header mirrors the project header: mono eyebrow = `dateRange · techStack`, **H1 = "Holloway Company"**, tagline (`.lead`) = first-person `summary`, and **NO external-links row** (confidential contract). 
- **D-08:** **Normalize `company` to "Holloway Company" (drop "The")** by editing the `company:` frontmatter in `src/content/experience/holloway.mdx`. Safe from the CI drift gate (which compares BODY only; frontmatter is authored in the `.mdx`).
- **D-09:** Deep-dive body renders **verbatim** through `.prose-editorial` (Overview + 9 numbered highlights + Themes). Any content change is a source-side edit (`Experience/HOLLOWAY_EXPERIENCE.md` + `pnpm sync:experience`), never a hand-edit of the rendered `.mdx` body. The 5 frontmatter highlights vs 9 body highlights is the intended scannable→deep-dive gradient.
- **D-10:** Phase 22 adds **basic per-page `BaseLayout` title + description only**. All JSON-LD / positioning metadata **deferred to Phase 24**. No OG-image work.
- **D-11:** Deep-dive mirrors the project detail page's Phase 15 instrumentation: add the **4 scroll-depth sentinels** (`data-percent` 25/50/75/100) + `article { position: relative }`. No new event types. `/experience` summary page gets NO sentinels.

### Claude's Discretion

- **Visual execution (SC5):** all final layout, card/block form, spacing, type-scale, divider styling, and the "Earlier" cue treatment → **frontend-design skill** against `design-system/MASTER.md`. Decisions above fix structure/content/routing, not appearance.
- **Detail-page slug:** the experience id is `holloway` (from `holloway.mdx`), yielding `/experience/holloway`. Planner confirms param wiring.
- **Whether the deep-dive intro blockquote is de-duplicated against the D-07 tagline** — low-stakes; frontend-design's call.
- **Reuse depth of `Container` / `SectionHeader` primitives** — builder discretion within reuse-over-invention.

### Deferred Ideas (OUT OF SCOPE)

- **Home Holloway teaser** → Phase 24 (HOME-01).
- **Positioning-shift copy + JSON-LD Person / positioning metadata** → Phase 24 (POS-01..04).
- **Experience content into chat knowledge + third-person `chatSummary`** → Phase 25 (CHAT-10/11).
- **Metrics/impact visualizations** for highlights → EXP-FUT-02.
- **Balfour full case study** → EXP-FUT-01.
- Editing the `experience` schema — the Phase 21 contract is complete, no change here.
- **Reviewed todos NOT folded:** mobile-menu breakpoint 380→768px change; real `og-default.png`; chat cache-hit-rate observability; `CHAT_RATE_LIMITER` binding. All orthogonal / other-phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXP-02 | Visitor can reach a dedicated Experience page from the primary navigation | New `src/pages/experience.astro` route + nav entry in `Header.astro`/`MobileMenu.astro` (both mirror the existing `/projects` pattern). §Architecture Patterns, §Code Examples. |
| EXP-03 | Visitor sees Holloway as a scannable summary (headline highlights) | `getCollection("experience")` → `sortExperienceEntries()` → render Holloway meta + summary + 5 highlights + deep-dive link. §Code Examples "Experience listing page". |
| EXP-04 | Visitor can open a full Holloway deep-dive (own detail view) with a way back | New `src/pages/experience/[id].astro` mirroring `projects/[id].astro`; `getStaticPaths` filters `hasCaseStudy===true`; back link replaces `NextProject`. §Code Examples "Experience detail route". |
| EXP-05 | Balfour Beatty as a lightweight earlier-work entry, no case study | Second entry from the collection, `hasCaseStudy:false` → non-linked "Earlier" treatment; the `getStaticPaths` filter structurally prevents a detail route. §Pitfalls, §Validation. |
</phase_requirements>

## Summary

Phase 22 is a **pure rendering phase over already-shipped data**. Phase 21 delivered the `experience` content collection (Zod schema in `src/content.config.ts`), two real MDX entries (`holloway.mdx`, `balfour-beatty.mdx`), the `sortExperienceEntries()` reverse-chron helper (`src/lib/experience.ts`), and the machine-sync + drift-gate pipeline (`scripts/sync-experience.mjs`). This phase renders that collection into two new pages and one nav entry — reusing the existing Projects surface (`src/pages/projects.astro`, `src/pages/projects/[id].astro`, `NextProject.astro`, the `Header`/`MobileMenu` nav primitives) as near-verbatim templates.

**There are zero new runtime dependencies, zero external packages, and zero schema changes.** Everything needed is already installed (Astro 6.0.8, MDX loader, sitemap integration) and every pattern already exists in the codebase. The dominant risk is not "how to build it" but "do not diverge from the established Projects pattern" and "do not trip the D-26 chat-surface battery or the em-dash / voice guards." The one content mutation is D-08's `company` normalization, which is provably safe against the CI drift gate because that gate compares only the MDX **body** against the fenced source, never the frontmatter.

**Primary recommendation:** Copy `src/pages/projects/[id].astro` to `src/pages/experience/[id].astro` and `src/pages/projects.astro` to `src/pages/experience.astro`, then adapt each per the locked decisions (D-01..D-11): swap the collection, add the `hasCaseStudy` filter to `getStaticPaths`, change the meta line to `dateRange · techStack`, drop the external-links row and `NextProject`, add the D-02 back links and the D-11 scroll sentinels. Add `experience` first in both `navLinks` arrays. Route all pixel/layout decisions through the frontend-design skill (SC5). Keep all new CSS page-scoped to avoid touching `global.css`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Experience listing (`/experience`) | Build-time static (Astro SSG) | — | `getCollection` runs at build; page ships as pure HTML, zero JS. |
| Holloway deep-dive (`/experience/[id]`) | Build-time static (`getStaticPaths`) | — | Static path generated at build from the collection; MDX rendered to HTML by Shiki/MDX at build. |
| Primary nav entry | Layout (BaseLayout children: `Header`/`MobileMenu`) | Client (MobileMenu focus-trap JS, already built) | Nav is a shared layout primitive; the only client JS is the pre-existing MobileMenu wiring — untouched. |
| Reverse-chron ordering | Build-time pure function (`src/lib/experience.ts`) | — | `sortExperienceEntries()` already unit-tested; call it, do not reimplement. |
| Scroll-depth analytics on deep-dive | Client (`scroll-depth.ts`, already built) | — | Observer auto-attaches when `.scroll-sentinel` elements exist in the DOM; adding sentinels is the entire integration. |
| Company-name normalization (D-08) | Content (MDX frontmatter) | — | Single-field edit; no runtime consumer exists yet (Phase 24/25 consume later). |

## Standard Stack

Everything is already present. No `npm install` is required or permitted (QA-02: zero new runtime deps).

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 6.0.8 | SSG + Content Collections + `getStaticPaths` + `render()` | Already the project framework; `getCollection`/`render` are the canonical content-rendering API. `[VERIFIED: package.json]` |
| `@astrojs/mdx` | 5.0.2 | Renders the Holloway MDX body to static HTML | Already installed; the `.prose-editorial` wrapper + `Content` component pattern is proven on `projects/[id].astro`. `[VERIFIED: package.json]` |
| `@astrojs/sitemap` | 3.7.1 | Auto-discovers the two new static routes | Zero manual sitemap edits — it enumerates all static routes at build. `[VERIFIED: package.json]` |
| Zod (`astro/zod`) | 4.3.6 | Validates the `experience` frontmatter at build | Schema already defined in `src/content.config.ts`; **do not modify**. `[VERIFIED: src/content.config.ts]` |

### Supporting (all first-party, already in-repo)
| Asset | Path | Purpose | When to Use |
|-------|------|---------|-------------|
| `sortExperienceEntries()` | `src/lib/experience.ts` | Reverse-chron ordering | Call on `/experience` listing (drop-in). `[VERIFIED: file read]` |
| `BaseLayout` | `src/layouts/BaseLayout.astro` | Page shell (SEO title/description, Header, MobileMenu, Footer, ChatWidget) | Wrap both new pages; pass `title`/`description` props (D-10). `[VERIFIED: file read]` |
| `Container` | `src/components/primitives/Container.astro` | Max-width + responsive padding | Wrap page content (as projects pages do). `[CITED: 22-CONTEXT.md canonical refs]` |
| `SectionHeader` | `src/components/primitives/SectionHeader.astro` | Numbered `§`-mono section heading | Optional on `/experience` (frontend-design's call). `[CITED: CONTEXT]` |
| `scroll-depth.ts` | `src/scripts/scroll-depth.ts` | Fires `scroll_depth` umami events | No edit needed — observer auto-attaches to any `.scroll-sentinel` in the DOM. `[VERIFIED: file read]` |
| Type-role classes | `src/styles/global.css` (`.h1-section`, `.h2-project`, `.lead`, `.label-mono`, `.meta-mono`, `.tabular`, `.section`) | Typography ramp | Global — apply directly, no import. `[VERIFIED: grep global.css]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate `experience.astro` + `experience/[id].astro` | Single page with client-side accordion | **Rejected by D-01.** Accordion bloats the 30-sec scan and ships JS against the zero-JS-by-default posture. |
| `hasCaseStudy` filter in `getStaticPaths` | Hardcoded `/experience/holloway` | **Rejected by D-01.** Diverges from the Projects pattern and is not forward-compatible. |
| New shared "case study" abstraction across projects+experience | — | **Rejected (scope creep).** Copy-adapt the projects templates; do not refactor the projects surface. |

**Installation:** None. Confirm with `pnpm list astro @astrojs/mdx @astrojs/sitemap` that versions are unchanged before and after (QA-02 lock).

## Package Legitimacy Audit

**N/A — this phase installs no external packages.** All rendering uses already-installed, already-verified dependencies (Astro 6.0.8, `@astrojs/mdx` 5.0.2, `@astrojs/sitemap` 3.7.1, Zod 4.3.6 — all present in `package.json` at v1.3 close). The QA-02 invariant requires `package.json dependencies` stay byte-identical phase-wide; adding a package would violate the milestone gate. No legitimacy check required.

## Architecture Patterns

### System Architecture Diagram

```
BUILD TIME (Astro SSG)
──────────────────────
Experience/HOLLOWAY_EXPERIENCE.md ──(pnpm sync:experience, already run)──▶ src/content/experience/holloway.mdx
Experience/BALFOUR_BEATTY.md ──────(sync)──────────────────────────────▶ src/content/experience/balfour-beatty.mdx
                                                                                   │
                                                                                   ▼
                                              src/content.config.ts  (Zod-validate `experience` collection)
                                                                                   │
                        ┌──────────────────────────────────────────────────────────┴───────────────┐
                        ▼                                                                            ▼
        src/pages/experience.astro (NEW)                                    src/pages/experience/[id].astro (NEW)
        getCollection("experience")                                        getStaticPaths():
          → sortExperienceEntries()  (reverse-chron)                         getCollection("experience")
          → Holloway rich summary (D-05: meta+summary+5 highlights+link)       .filter(e => e.data.hasCaseStudy)   ◀── EXP-05 gate
          → Balfour "Earlier" lightweight entry (D-06, non-linked)             → only "holloway" yields a path
          → wraps in Container + .section                                    render(entry) → <Content/> in .prose-editorial
                        │                                                     + D-11 scroll sentinels, + D-02 back links
                        │                                                                            │
                        ▼                                                                            ▼
             /experience/index.html                                             /experience/holloway/index.html
              (NO /experience/balfour-beatty  ◀── structurally enforced by the filter)
                        │                                                                            │
                        └──────────────────────── BaseLayout shell ─────────────────────────────────┘
                              Header + MobileMenu nav: `experience` FIRST (D-03), isActive startsWith("/experience")
                              @astrojs/sitemap auto-enumerates both new routes

REQUEST TIME (browser)
──────────────────────
Static HTML served from Cloudflare edge (zero JS on /experience;
  on /experience/holloway the pre-existing scroll-depth.ts observer
  auto-attaches to the 4 .scroll-sentinel divs → umami scroll_depth events)
```

### Recommended Project Structure (new + touched files)
```
src/
├── pages/
│   ├── experience.astro            # NEW — listing (mirrors projects.astro)
│   └── experience/
│       └── [id].astro              # NEW — deep-dive (mirrors projects/[id].astro)
├── components/primitives/
│   ├── Header.astro                # EDIT — add `experience` first in navLinks + isActive
│   └── MobileMenu.astro            # EDIT — same nav change (parallel array); DO NOT touch focus-trap JS
└── content/experience/
    └── holloway.mdx                # EDIT — company: "The Holloway Company" → "Holloway Company" (D-08, frontmatter only)
```

### Pattern 1: Collection listing page (mirror `projects.astro`)
**What:** `getCollection` → sort → map to rows/blocks inside `Container`.
**When to use:** the `/experience` page.
**Key adaptation:** replace the uniform `WorkRow` map with the **asymmetric two-tier** layout (D-04) — Holloway rich, Balfour light — driven by `hasCaseStudy`. Exact form is frontend-design's; the data plumbing is identical.

### Pattern 2: Dynamic detail route (mirror `projects/[id].astro`)
**What:** `getStaticPaths()` enumerates `params.id` from the collection; the page `render()`s the entry's MDX body into a `.prose-editorial` wrapper with scoped `:global()` overrides.
**When to use:** the `/experience/[id].astro` deep-dive.
**Key adaptations:** (1) add `.filter(e => e.data.hasCaseStudy)` in `getStaticPaths`; (2) meta line = `dateRange · techStack` (not `year · techStack`); (3) H1 = `company` = "Holloway Company"; (4) tagline = `summary`; (5) **omit** the external-links row; (6) **replace** `NextProject` with D-02 back links; (7) keep the 4 D-11 scroll sentinels + `article { position: relative }`.

### Pattern 3: The `.prose-editorial` style block is PAGE-SCOPED, not global
**What:** the entire `.prose-editorial` + `:global(h2/p/ul/li/a/pre/code)` style block lives inside the `<style>` of `projects/[id].astro` — it is **not** in `global.css`.
**Implication:** `experience/[id].astro` must **copy that `<style>` block verbatim** (including the `§`-prefixed `:global(h2)` and the scroll-sentinel CSS). The Holloway body uses `## Overview` / `## Highlights` / `## Themes` — the exact heading shape that block already styles.

### Anti-Patterns to Avoid
- **Editing `global.css` for page-specific styling.** Any change to `global.css` triggers the full D-26 chat-surface battery. Keep new CSS in page-scoped `<style>` blocks.
- **Hand-editing the Holloway MDX body.** `sync:experience:check` fails CI on any body drift (D-09). Body changes go through `Experience/HOLLOWAY_EXPERIENCE.md` + `pnpm sync:experience`. Frontmatter (D-08) is exempt.
- **Reimplementing reverse-chron sort.** `sortExperienceEntries()` exists and is unit-tested; sorting inline (as projects do by `order`) would be wrong — experience sorts by `startDate` descending.
- **Touching MobileMenu's focus-trap / `inert` script.** The nav change is a one-line array edit; the JS block (including `.chat-widget` inert handling) must stay untouched or the D-26 battery is at risk.
- **Building a `/experience/balfour-beatty` route.** The `hasCaseStudy` filter must exclude it; a stray path would violate EXP-05.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reverse-chron ordering | Inline `.sort()` in the page | `sortExperienceEntries()` (`src/lib/experience.ts`) | Already unit-tested; sorts by `startDate` desc, not `order`. |
| MDX-body prose styling | New CSS from scratch | Copy the `.prose-editorial` `<style>` block from `projects/[id].astro` | Exact `§`-mono h2 treatment already matches the Holloway headings. |
| Scroll-depth tracking | New IntersectionObserver | Add 4 `.scroll-sentinel` divs; `scroll-depth.ts` auto-attaches | The observer is DOM-presence-gated — no JS wiring needed (D-11). |
| Nav active-state logic | New matcher | Copy the `isActive` `startsWith` pattern; add `/experience` branch | Covers `/experience/[id]` for free, exactly as `/projects` covers `/projects/[id]`. |
| Sitemap entries | Manual sitemap edit | `@astrojs/sitemap` (installed) | Auto-enumerates all static routes at build. |
| Detail-route path generation | Manual slug map | `getStaticPaths` + `entry.id` | `holloway.mdx` → id `holloway` → `/experience/holloway`. |

**Key insight:** Nearly every "how do I…" for this phase has an already-shipped, already-tested answer 10 lines away in the Projects surface. The engineering value is disciplined mirroring, not invention.

## Runtime State Inventory

> Included for the D-08 `company` normalization (a string rename with named downstream consumers).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — the `experience` collection is built from MDX at build time; no database, KV, or datastore holds the company string. (KV holds chat transcripts only.) | None. |
| Live service config | None — no external service references "The Holloway Company". | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | None reference the company name. | None. |
| Build artifacts | The rendered `holloway.mdx` frontmatter is the only source; the two pages this phase builds derive `company` from it. `scripts/build-chat-context.mjs` does **not** reference Holloway yet (verified: 0 matches) — Phase 25 ingests it. | Edit `company:` in `holloway.mdx` (D-08). No re-sync needed (frontmatter is not sync-managed). Body prose in `Experience/HOLLOWAY_EXPERIENCE.md` intro blockquote says "the Holloway Company" — **leave verbatim** per D-09 unless the planner deems the intro line worth a source-side edit + re-sync. |

**Verified:** The only runtime consumer of the string `Holloway Company` in `src/` is `holloway.mdx` itself (grep confirmed). No other code, script, or datastore reads it. The normalization is fully self-contained.

## Common Pitfalls

### Pitfall 1: Assuming the drift gate will reject the D-08 frontmatter edit
**What goes wrong:** Fear that editing `company:` will make `sync:experience:check` fail CI.
**Why it happens:** Misreading the sync model.
**How to avoid:** `sync-experience.mjs` reassembles `frontmatterBlock (read verbatim from the .mdx) + "\n" + newBody (from the fenced source) + "\n"` and compares to the current file. Since the frontmatter is taken from the file itself, only the **body** is effectively diffed. Editing frontmatter cannot produce drift. `[VERIFIED: scripts/sync-experience.mjs lines 127-184]`
**Warning sign:** A plan task that routes the company change through `Experience/*.md` — that would be wrong; company lives only in the `.mdx` frontmatter.

### Pitfall 2: Copying the `year` meta idiom instead of `dateRange`
**What goes wrong:** `projects/[id].astro` renders `project.data.year` in the meta line; experience has no `year` field.
**Why it happens:** Verbatim copy without adapting the field.
**How to avoid:** Use `entry.data.dateRange` (already formatted as "May 2026 – Present", en dash) `·` `entry.data.techStack.join(" · ").toUpperCase()`. `[VERIFIED: holloway.mdx + content.config.ts]`
**Warning sign:** `astro check` error "Property 'year' does not exist on type ... experience".

### Pitfall 3: Forgetting `article { position: relative }` with the scroll sentinels
**What goes wrong:** Sentinels position against the viewport instead of the article, firing all four immediately.
**Why it happens:** The sentinel CSS uses `top: 25%/50%/75%/100%` which is percent-of-nearest-positioned-ancestor.
**How to avoid:** Copy both the sentinel divs AND the `article { position: relative }` + `.scroll-sentinel` rules from `projects/[id].astro` (D-11). `[VERIFIED: projects/[id].astro lines 91-108]`
**Warning sign:** `scroll_depth` events all fire at 100% on page load in dev (the `[scroll-depth] observer attached to 4 sentinels` log appears but percentages are wrong).

### Pitfall 4: Touching `global.css` for the "Earlier" cue or two-tier styling
**What goes wrong:** A `global.css` edit pulls the entire D-26 chat-surface battery + astro-check into the blast radius.
**Why it happens:** Reaching for a global utility instead of page-scoped styles.
**How to avoid:** Keep all new styles in the page's `<style>` block. The six design tokens are already global CSS custom properties — reference them (`var(--ink-faint)` etc.) without adding global rules. If `global.css` is unavoidable, run `pnpm test` (the full 560-test suite, which includes the D-26 battery) + `pnpm exec astro check`.
**Warning sign:** A diff hunk in `src/styles/global.css`.

### Pitfall 5: The `Content` component's `img` mapping
**What goes wrong:** `projects/[id].astro` passes `<Content components={{ img: ArticleImage }} />`. The Holloway body has **no images**, so the mapping is inert — but omitting `ArticleImage` import while keeping the mapping breaks the build.
**Why it happens:** Partial copy.
**How to avoid:** Either keep the full `import ArticleImage` + `components={{ img: ArticleImage }}` (recommended for parity / forward-compat) or drop both together. Do not keep one without the other. `[VERIFIED: projects/[id].astro lines 6, 71]`

### Pitfall 6: Em dashes in new copy
**What goes wrong:** Any new prose string with `—` violates the site-wide zero-em-dash rule.
**Why it happens:** AI-default cadence.
**How to avoid:** The only new copy this phase authors is the two `BaseLayout` meta descriptions (D-10). Use en dashes (`–`) / commas / periods. The UI-SPEC already specifies compliant strings. All rendered content is verbatim from the collection (which uses arrows/en dashes/hyphens, no em dashes — verified in `holloway.mdx`).
**Warning sign:** N/A automated for experience yet — see Validation "Wave 0 Gaps".

## Code Examples

Verified patterns transcribed from the in-repo templates this phase mirrors.

### Experience detail route (mirror of `projects/[id].astro`)
```astro
---
// Source: adapted from src/pages/projects/[id].astro (VERIFIED file read)
import { getCollection, render, type CollectionEntry } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";
import Container from "../../components/primitives/Container.astro";
import ArticleImage from "../../components/ArticleImage.astro";
import { sortExperienceEntries } from "../../lib/experience";

export async function getStaticPaths() {
  // D-01: only entries with a case study generate a detail page.
  // Balfour (hasCaseStudy:false) is structurally excluded → EXP-05.
  const withCaseStudy = sortExperienceEntries(
    await getCollection("experience"),
  ).filter((e) => e.data.hasCaseStudy);
  return withCaseStudy.map((entry) => ({
    params: { id: entry.id },      // "holloway" → /experience/holloway
    props: { entry },
  }));
}

interface Props { entry: CollectionEntry<"experience">; }
const { entry } = Astro.props;
const { Content } = await render(entry);
const stack = entry.data.techStack.join(" · ").toUpperCase();
---

<BaseLayout title={entry.data.company} description={entry.data.summary}>
  <article>
    <section class="section experience-header">
      <Container>
        <!-- D-02: back link at TOP -->
        <a class="label-mono back-link" href="/experience">&larr; Back to experience</a>
        <!-- D-07: meta = dateRange · techStack (NOT year) -->
        <div class="label-mono experience-meta">
          {entry.data.dateRange} &middot; {stack}
        </div>
        <h1 class="h1-section">{entry.data.company}</h1>   {/* "Holloway Company" (D-08) */}
        <p class="lead">{entry.data.summary}</p>
        {/* D-07: NO external-links row (confidential contract) */}
      </Container>
    </section>

    <section class="section">
      <Container>
        <div class="prose-editorial">
          <Content components={{ img: ArticleImage }} />
        </div>
      </Container>
    </section>

    <section class="section">
      <Container>
        <!-- D-02: back link at BOTTOM (the slot NextProject occupied; NextProject dropped) -->
        <a class="label-mono back-link" href="/experience">&larr; Back to experience</a>
      </Container>
    </section>

    {/* D-11: Phase-15 scroll-depth sentinels — scroll-depth.ts auto-attaches */}
    <div class="scroll-sentinel" data-percent="25" aria-hidden="true"></div>
    <div class="scroll-sentinel" data-percent="50" aria-hidden="true"></div>
    <div class="scroll-sentinel" data-percent="75" aria-hidden="true"></div>
    <div class="scroll-sentinel" data-percent="100" aria-hidden="true"></div>
  </article>
</BaseLayout>

<style>
  /* D-11: copy verbatim from projects/[id].astro */
  article { position: relative; }
  .scroll-sentinel { position: absolute; left: 0; right: 0; height: 1px; pointer-events: none; }
  .scroll-sentinel[data-percent="25"]  { top: 25%; }
  .scroll-sentinel[data-percent="50"]  { top: 50%; }
  .scroll-sentinel[data-percent="75"]  { top: 75%; }
  .scroll-sentinel[data-percent="100"] { top: 100%; }

  /* Copy the ENTIRE .prose-editorial + :global(...) block verbatim from
     projects/[id].astro (it is page-scoped there, NOT in global.css). */
  /* ...prose-editorial styles... */
</style>
```
*(Final visual details — spacing, back-link hover/arrow-reveal, exact type roles — are the frontend-design skill's call per SC5. The structure above is what the decisions lock.)*

### Experience listing page (mirror of `projects.astro`)
```astro
---
// Source: adapted from src/pages/projects.astro (VERIFIED file read)
import { getCollection } from "astro:content";
import BaseLayout from "../layouts/BaseLayout.astro";
import Container from "../components/primitives/Container.astro";
import { sortExperienceEntries } from "../lib/experience";

// D-04/EXP-06: reverse-chron via the Phase-21 helper (Holloway first, Balfour second)
const entries = sortExperienceEntries(await getCollection("experience"));
const holloway = entries.find((e) => e.data.hasCaseStudy);
const earlier = entries.filter((e) => !e.data.hasCaseStudy);
---
<BaseLayout
  title="Experience"
  description="Production engineering experience – the Holloway Connect contract and earlier work."
>
  <section class="section" aria-labelledby="section-experience">
    <Container>
      {/* D-05: Holloway rich summary — meta · summary · ALL 5 highlights · "Read the full case study →" link to /experience/{holloway.id} */}
      {/* D-06: Balfour lightweight "Earlier" entry, NON-linked */}
      {/* Asymmetric two-tier form (card vs bordered block) → frontend-design (SC5) */}
    </Container>
  </section>
</BaseLayout>
```
*(The two-tier visual treatment is intentionally left to frontend-design; the data selection above is what the decisions fix.)*

### Nav entry (Header.astro AND MobileMenu.astro — parallel edit)
```ts
// Source: src/components/primitives/Header.astro / MobileMenu.astro (VERIFIED)
// D-03: `experience` FIRST
const navLinks = [
  { href: "/experience", label: "experience" },
  { href: "/projects", label: "works" },
  { href: "/about", label: "about" },
  { href: "/contact", label: "contact" },
];

function isActive(href: string): boolean {
  if (href === "/experience") return currentPath.startsWith("/experience"); // covers /experience/[id]
  if (href === "/projects") return currentPath.startsWith("/projects");
  if (href === "/about") return currentPath.startsWith("/about");
  if (href === "/contact") return currentPath.startsWith("/contact");
  return false;
}
```
*(In MobileMenu.astro make the identical `navLinks` + `isActive` change. Do NOT touch the `<script>` focus-trap/inert block.)*

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@astrojs/tailwind` integration | `@tailwindcss/vite` v4 | v1.2 | Not relevant here — new styles are page-scoped `<style>`, not utilities. |
| Legacy content collections | Content Layer API (`glob` loader) | Astro 6 / Phase 21 | Already adopted; `experience` uses `glob({ pattern: "**/*.mdx" })`. Nothing to change. |
| Manual slug maps | `getStaticPaths` + `entry.id` | established (projects) | Mirror it; `entry.id` = filename stem. |

**Deprecated/outdated for this phase:** none in play. No motion library, no client framework, no external CDN.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Holloway MDX body currently matches its fenced source exactly (no pending drift), so `sync:experience:check` is green before this phase's edits. | Pitfall 1 | Low — if drift already exists it is a pre-existing Phase-21 defect surfaced by CI, not introduced here; the planner can add a `pnpm sync:experience:check` gate task to confirm. |
| A2 | The Holloway deep-dive body contains no markdown images, so the `ArticleImage` `img` mapping is inert. | Pitfall 5 | Low — verified by reading `holloway.mdx` (no `![...]`); if a future source edit adds an image, the mapping already handles it. |
| A3 | Adding `.scroll-sentinel` elements to `/experience/holloway` is sufficient to activate `scroll-depth.ts` there, and firing `scroll_depth` events on this route is desired (D-11 intent). | Architecture / Pitfall 3 | Low — verified the observer is DOM-presence-gated (`makeRevealObserver` returns null when no sentinels); the `slug` in the event will be `holloway`. Matches D-11 explicitly. |
| A4 | The frontend-design skill will finalize the two-tier / "Earlier" cue visuals without requiring new design tokens or global CSS. | Discretion | Low — MASTER.md's six tokens + scale cover it per the UI-SPEC; flagged as the one place pixel decisions are deferred (SC5). |

## Open Questions

1. **Does `/experience/holloway` need the `Content` `img` mapping at all?**
   - What we know: the current body has no images; the mapping is inert.
   - What's unclear: whether to keep it for parity/forward-compat or drop it for minimalism.
   - Recommendation: keep it (import `ArticleImage` + `components={{ img: ArticleImage }}`) — zero cost, matches the mirror, future-proof. Builder discretion.

2. **Should the em-dash / voice guards be extended to cover the `experience` collection now?**
   - What we know: `tests/content/voice-em-dash.test.ts` hardcodes the 6 project slugs only; experience entries are unguarded. This phase authors no new body prose (verbatim render), so risk this phase is near-zero.
   - What's unclear: whether extending coverage belongs here or in Phase 25 (chat/voice consolidation).
   - Recommendation: add it as a low-cost Wave 0 test extension (see Validation) so the guard tracks the experience surface going forward; if descoped, note it for Phase 24/25.

## Environment Availability

> Minimal — no external services. Confirmed present at v1.3 close.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build + sync scripts | ✓ | ≥22 (engines pin) | — |
| pnpm | scripts (`sync:experience`, `test`, `build`) | ✓ | project standard | — |
| Astro / `@astrojs/mdx` / `@astrojs/sitemap` / Zod | rendering + validation | ✓ | 6.0.8 / 5.0.2 / 3.7.1 / 4.3.6 | — |

**Missing dependencies with no fallback:** none. **Missing with fallback:** none. This phase adds no external dependency (QA-02 lock).

## Validation Architecture

> Nyquist validation ENABLED. Each success criterion mapped to an observable signal + sampling rate/test type.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (`vitest run`) |
| Config file | present (project runs `pnpm test` = 560 tests at v1.3 close) |
| Quick run command | `pnpm exec astro check` (type gate, ~seconds) |
| Full suite command | `pnpm test` (includes the D-26 chat-surface battery) |
| Build gate | `pnpm build` (runs `build:chat-context` → `wrangler types` → `astro check` → `astro build`; proves routes generate) |
| Content gate | `pnpm sync:experience:check` (drift guard; must stay green after D-08) |

### Success Criteria → Observable Signal → Test Map
| SC | Behavior | Observable signal | Test type | Automated command | Exists? |
|----|----------|-------------------|-----------|-------------------|---------|
| SC1 / EXP-02 | Experience page reachable from site-wide nav | `/experience/index.html` emitted by build; both `navLinks` arrays contain `/experience` as first entry with `isActive` startsWith | build gate + source-shape unit | `pnpm build` (route exists) + a `tests/build/experience-nav.test.ts` asserting `Header.astro` & `MobileMenu.astro` source contain `/experience` first | ❌ Wave 0 (nav-shape test) |
| SC2 / EXP-03 | Holloway scannable summary shows role · company · dates · stack + 5 highlights | Rendered `/experience/index.html` contains the meta line fields and all 5 `highlights` strings | build/content assertion | `tests/content/experience-summary.test.ts` reading the collection + asserting Holloway exposes role/company/dateRange/techStack and `highlights.length === 5` | ❌ Wave 0 |
| SC3 / EXP-04 | Deep-dive detail view exists with a way back | `/experience/holloway/index.html` emitted; page contains a `href="/experience"` back link (top+bottom) and the `.prose-editorial` body | build gate + content assertion | `pnpm build` + `tests/content/experience-detail.test.ts` asserting `getStaticPaths` yields exactly the `hasCaseStudy` ids | ❌ Wave 0 |
| SC4 / EXP-05 | Balfour lightweight, non-linked, NO case study route | `getStaticPaths` excludes `balfour-beatty`; no `/experience/balfour-beatty` route built; listing renders Balfour as non-linked "Earlier" entry | unit (filter) + build gate | `tests/content/experience-detail.test.ts` asserting `balfour-beatty` NOT in generated ids; `pnpm build` confirms no such route | ❌ Wave 0 |
| SC5a | `astro check` 0/0/0 | Type-check clean across new pages | build gate | `pnpm exec astro check` | ✅ (command exists) |
| SC5b | D-26 chat-surface battery holds | Full suite green (chat regression subset unchanged) | regression gate | `pnpm test` | ✅ (suite exists; ~560 tests) |
| SC5c | D-08 introduces no content drift | sync check green | content gate | `pnpm sync:experience:check` | ✅ (command exists) |
| SC5d | frontend-design routed all visual decisions | UI-SPEC checker sign-off + frontend-design skill invoked | process checkpoint (manual) | `checkpoint:human-verify` | manual |
| SC5e | Zero em dashes in new copy | No `—` in the two new meta-description strings (and any new prose) | content assertion | extend `tests/content/voice-em-dash.test.ts` to cover `experience/*.mdx` (optional) | ❌ Wave 0 (optional) |

### Sampling Rate
- **Per task commit:** `pnpm exec astro check` (type gate; catches field-name and prop errors immediately, e.g. Pitfall 2).
- **Per wave merge:** `pnpm test` + `pnpm sync:experience:check` (regression + drift).
- **Phase gate:** `pnpm build` (full route generation) + `pnpm test` green + frontend-design checkpoint signed before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `tests/build/experience-nav.test.ts` — asserts `experience` is first in both `Header.astro` and `MobileMenu.astro` `navLinks`, and `isActive` has a `/experience` startsWith branch (covers SC1).
- [ ] `tests/content/experience-summary.test.ts` — asserts Holloway summary surfaces role/company/dateRange/techStack and exactly 5 `highlights`; company === "Holloway Company" (covers SC2 + D-08).
- [ ] `tests/content/experience-detail.test.ts` — asserts `getStaticPaths` id set === entries where `hasCaseStudy`, i.e. `["holloway"]`, and excludes `balfour-beatty` (covers SC3 + SC4 — the EXP-05 structural guarantee).
- [ ] (optional) extend `tests/content/voice-em-dash.test.ts` to include `src/content/experience/*.mdx` bodies (covers SC5e; guards future source edits).
- No framework install needed — Vitest + the content/build test patterns already exist (`tests/content/case-studies-shape.test.ts`, `tests/scripts/sync-experience*.test.ts` are direct analogs to copy).

## Security Domain

> `security_enforcement` treated as enabled (not set to false). This is a static, read-only content surface — the threat surface is minimal.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth on the site. |
| V3 Session Management | no | No sessions on these pages (chat session is untouched). |
| V4 Access Control | no | All content is public by design. |
| V5 Input Validation | partial | No user input on this surface. Build-time input = MDX frontmatter, validated by the Zod schema (`content.config.ts`) + the sync script's path-traversal guard (already in `sync-experience.mjs`). |
| V6 Cryptography | no | None. |
| V14 Configuration | yes | Zero new runtime deps (QA-02); no new secrets/env vars; sitemap auto-config only. |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| MDX rendering arbitrary HTML/script | Tampering / EoP | Content is authored/synced from trusted in-repo sources only (no user-supplied MDX); `@astrojs/mdx` renders at build, not runtime. No mitigation gap. |
| Source-path traversal via `source:` frontmatter | Tampering | Already mitigated in `sync-experience.mjs` (path-escape guard, exit 2). Not touched this phase. |
| Nav/BaseLayout edit regressing the chat surface (XSS sanitization, focus trap, SSE) | Tampering / DoS | The D-26 battery + D-15 SSE anchor guard this; keep nav edits in `Header`/`MobileMenu` and CSS page-scoped; run `pnpm test` if `global.css`/`BaseLayout.astro` is touched. |
| Confidential-contract data exposure | Info Disclosure | D-07 omits external links; no GitHub/demo URLs exist for Holloway. Content is owner-approved case-study prose. No credentials, client PII, or internal URLs in the rendered body (verify at content-review). |

## Sources

### Primary (HIGH confidence — in-repo, verified by file read)
- `src/pages/projects.astro`, `src/pages/projects/[id].astro` — the templates to mirror.
- `src/components/primitives/Header.astro`, `MobileMenu.astro` — nav pattern + focus-trap.
- `src/components/NextProject.astro` — the displaced back-link idiom.
- `src/lib/experience.ts` — `sortExperienceEntries()`.
- `src/content.config.ts` — `experience` Zod schema (do not modify).
- `src/content/experience/holloway.mdx`, `balfour-beatty.mdx` — the data.
- `scripts/sync-experience.mjs` — confirms the drift gate compares body only (D-08 safety).
- `src/scripts/scroll-depth.ts` — confirms DOM-presence-gated observer (D-11 zero-wiring).
- `src/layouts/BaseLayout.astro` — SEO title/description props (D-10).
- `src/styles/global.css` — confirms type-role classes are global; `.prose-editorial` is NOT.
- `package.json` — dependency versions; QA-02 zero-new-dep lock.

### Secondary (HIGH — planning artifacts)
- `22-CONTEXT.md` (D-01..D-11 + canonical refs), `22-UI-SPEC.md` (tokens/typography/copy contract), `.planning/REQUIREMENTS.md` (EXP-02..05, QA-01/02), `.planning/ROADMAP.md` (SC1..SC5), `.planning/STATE.md` (D-26/D-15 invariants, voice split).

### Tertiary (LOW confidence)
- none — no external/web sources were needed; this is an internal-pattern-reuse phase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — everything present and version-verified in `package.json`; no installs.
- Architecture: HIGH — direct mirrors of two existing, shipped pages read in full.
- Pitfalls: HIGH — each derived from a specific line-verified behavior (drift gate, sentinel positioning, page-scoped prose CSS).
- Validation: HIGH — analog test files already exist to copy; commands verified in `package.json`.

**Research date:** 2026-07-09
**Valid until:** 2026-08-09 (stable internal surface; only invalidated if the Projects pattern or the experience schema changes).
