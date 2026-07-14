# Phase 22: Experience Page & Holloway Case Study - Context

**Gathered:** 2026-07-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the **Experience surface** that renders the Phase 21 `experience` collection: a dedicated `/experience` page reachable from the primary nav, presenting Holloway as a scannable summary that opens into a full deep-dive case study on its own detail route, alongside a lightweight Balfour Beatty earlier-work entry.

**In scope (EXP-02, EXP-03, EXP-04, EXP-05):**
- A new `/experience` page (route + site-wide nav entry) rendering the two `experience` entries via `sortExperienceEntries()` (reverse-chron, already built in Phase 21).
- Holloway scannable summary (role · company · dates · stack visible at a glance + headline highlights).
- A full Holloway deep-dive on its own dynamic detail route with a way back to the summary.
- Balfour Beatty as a lightweight, non-linked earlier-work entry (role, dates, 1–2 lines, no case study).
- All visual/layout decisions routed through the **frontend-design skill** against `design-system/MASTER.md` (SC5).

**Explicitly NOT in scope (belongs to later phases):**
- Home page Holloway teaser → **Phase 24** (HOME-01).
- Positioning-shift copy (Core Value / About / education status) and the JSON-LD Person / positioning-laden metadata → **Phase 24** (POS-01..04).
- Wiring experience content into chat / `portfolio-context.json`, and third-person `chatSummary` content → **Phase 25** (CHAT-10/11).
- Editing the `experience` schema — the Phase 21 contract is complete and requires no change here.
- No new runtime dependencies; `astro check` stays 0/0/0; the D-26 chat-surface battery holds (standing constraints, restated as SC5).

</domain>

<decisions>
## Implementation Decisions

### Deep-dive routing & navigation
- **D-01:** The Holloway deep-dive is delivered on a **dedicated dynamic route `/experience/[id]`**, mirroring `src/pages/projects/[id].astro` exactly (`getStaticPaths` + `render()`). `getStaticPaths` **filters to `hasCaseStudy === true`**, so only Holloway builds a detail page and Balfour correctly generates none. Forward-compatible: a future engagement with `hasCaseStudy: true` produces a page automatically. Rejected: hardcoded `/experience/holloway` (diverges from the projects pattern) and inline expand on `/experience` (bloats the 30-sec scan; "navigate back to the summary" reads awkwardly without a page change).
- **D-02:** The deep-dive's **"navigate back to the summary" affordance (EXP-04) is a mono text link at BOTH ends** — near the top (under the header) and at the bottom, occupying the slot where `NextProject` sits on project pages. The `NextProject` card is **dropped** (Holloway is the only case study, so a "next" card is meaningless). Link idiom matches the site's existing editorial links.

### Primary navigation
- **D-03:** A new nav entry, label **`experience`**, sits **FIRST**: `experience · works · about · contact`. Experience leads because the v1.4 thesis (POS-01) repositions Jack around shipped production experience — the credibility signal should be the first thing a recruiter scan hits. Update BOTH `src/components/primitives/Header.astro` and `src/components/primitives/MobileMenu.astro` (they carry parallel `navLinks` arrays + `isActive` logic). `isActive` uses `currentPath.startsWith("/experience")`, which covers the `/experience/[id]` detail route (same pattern `/projects` uses for `/projects/[id]`).

### Experience page composition (`/experience`)
- **D-04:** **Asymmetric two-tier layout.** Holloway renders as a rich featured summary (D-05); Balfour renders as a visibly lighter earlier-work entry below. The treatment split is driven by the `hasCaseStudy` flag — honest to the content model, not a uniform card shell with an under-filled second entry. Rejected: uniform treatment (makes the lightweight entry read as a weak case study) and a flat `WorkRow` list (can't carry Holloway's summary line + 5 highlights inline). **Exact visual form (card vs bordered block vs section) is finalized by the frontend-design skill** — this decision fixes the structure, not the pixels.
- **D-05:** The **Holloway scannable summary surfaces: meta line (role · company · dates · stack) + the first-person `summary` sentence + ALL 5 `highlights` + a "Read the full case study →" link.** Maximizes the 30-sec recruiter payload (the highlights carry the metrics: 0→1,400 tests, 223→1 scoping, 91 jobs recovered); the link rewards the engineer who wants the 10-min deep dive. SC2's required at-a-glance fields (role, company, dates, stack) are all present.
- **D-06:** **Balfour is framed with a subtle "Earlier" cue** (a light mono label / divider) so a recruiter reads it as career context, not a headline or a second weak case study. It is **non-linked** (no case study → no detail route, consistent with D-01's filter). Reverse-chron ordering already places it second. Rejected: a full numbered `SectionHeader` ("heavy scaffolding for one 2-line entry") and pure continuous flow with no cue. **Exact divider/label styling → frontend-design.**

### Holloway deep-dive detail page (`/experience/holloway`)
- **D-07:** The detail-page **header mirrors the project header** (`projects/[id].astro`): mono eyebrow/meta line = `MAY 2026 – PRESENT · <STACK>` (from `dateRange` · `techStack`), **H1 = "Holloway Company"** (company as headline — see D-08), tagline (`.lead`) = the first-person `summary` line, and **NO external-links row** (confidential contract — no GitHub/demo URLs exist). Rejected H1 alternatives: role-as-title ("Software Engineer, Contract") and product-as-title ("Holloway Connect", unrecognizable cold).
- **D-08:** **Normalize the `company` field to "Holloway Company" (drop the leading "The") everywhere** — the summary card meta, the deep-dive H1, and all downstream consumers (Phase 24 JSON-LD, Phase 25 chat). Implement by editing the `company:` frontmatter in `src/content/experience/holloway.mdx`. **This is safe from the CI drift gate**, which compares the fenced BODY against `Experience/HOLLOWAY_EXPERIENCE.md` — the MDX frontmatter is authored directly in the `.mdx` and is not sync-managed. (Note for the executor: also update `Experience/HOLLOWAY_EXPERIENCE.md` prose only if a body string says "the Holloway Company"; the current body uses "the Holloway Company" in the intro blockquote — leave body prose verbatim per D-09 unless the planner deems the intro line worth a source-side edit + re-sync.)
- **D-09:** The **full deep-dive body renders verbatim** (Overview + 9 numbered highlights + Themes) through the existing `.prose-editorial` wrapper, exactly as synced from the source. Any content change is a **content task** (edit `Experience/HOLLOWAY_EXPERIENCE.md` + re-run `pnpm sync:experience`), never a hand-edit of the rendered `.mdx` (which `sync:experience:check` would fail in CI). The summary's 5 frontmatter highlights vs the body's 9 detailed highlights is the intended scannable→deep-dive gradient, not duplication to resolve.

### SEO / metadata boundary
- **D-10:** Phase 22 adds **basic per-page `BaseLayout` title + description only** for `/experience` and `/experience/[id]`. **All JSON-LD (Person schema, positioning-laden metadata) is DEFERRED to Phase 24 (POS-04)** to keep the positioning shift in one place and avoid rework. No OG-image work here (the site-wide `og-default.png` todo stays out of scope — see Reviewed Todos).

### Analytics instrumentation
- **D-11:** The Holloway deep-dive **mirrors the project detail page's Phase 15 instrumentation**: add the **4 scroll-depth sentinels** (`data-percent` 25/50/75/100 + `position: relative` article) so `src/scripts/scroll-depth.ts` fires `scroll_depth` events on the headline case study. **No new event types** (internal summary→deep-dive navigation stays untracked, same as project links); outbound-click tracking is moot (no external links on Holloway). The `/experience` summary page needs no scroll-depth sentinels (short page).

### Claude's / planner's / frontend-design's discretion
- **Visual execution (SC5):** all final layout, card/block form, spacing, type-scale, divider styling, and the "Earlier" cue treatment are the **frontend-design skill's** decisions against `design-system/MASTER.md`. The decisions above fix structure, content, and routing — not appearance.
- **Detail-page slug:** `getStaticPaths` uses `project.id` for projects; the experience collection id will be `holloway` (from `holloway.mdx`), yielding `/experience/holloway`. Planner confirms the exact param wiring.
- **Whether the deep-dive intro blockquote is de-duplicated against the D-07 tagline** — both draw on the engagement framing; planner/frontend-design may choose to let the tagline carry it and rely on the body blockquote, or vice-versa. Low-stakes.
- **Reuse depth of `Container` / `SectionHeader` primitives** on the new pages — builder discretion within the reuse-over-invention pattern.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & scope
- `.planning/ROADMAP.md` — Phase 22 goal + Success Criteria SC1–SC5; v1.4 sequencing (22 precedes the Phase 24 Home teaser and Phase 25 chat refresh that depend on this surface).
- `.planning/REQUIREMENTS.md` — EXP-02, EXP-03, EXP-04, EXP-05 (this phase); the Out-of-Scope table (no senior framing, no `/resume` route, no new design system, no new runtime deps); note POS-04/HOME-01/CHAT-10..11 are downstream, not here.
- `.planning/phases/21-experience-content-pipeline-collection/21-CONTEXT.md` — the upstream contract this phase renders against (schema fields D-01, ordering D-04/D-05, the Phase 21→22 handoff notes).
- `.planning/STATE.md` §Accumulated Context — v1.4 roadmap notes, voice-split (CHAT-06) reminder, D-26/D-15 chat-surface invariants.

### The patterns to mirror (reuse over invention)
- `src/pages/projects.astro` — the collection-listing page pattern (`getCollection` + sort + `Container` + `SectionHeader` + row list) the `/experience` page parallels.
- `src/pages/projects/[id].astro` — the case-study detail route to mirror for `/experience/[id]`: `getStaticPaths`, `render()`, the `.prose-editorial` wrapper + scoped MDX overrides, the mono meta header, the tagline (`.lead`), the external-links row (omit for Holloway), and the scroll-depth sentinels (D-11). **Replace its `NextProject` card with the D-02 back link.**
- `src/components/primitives/Header.astro` — primary nav to extend (D-03); `navLinks` array + `isActive` startsWith logic.
- `src/components/primitives/MobileMenu.astro` — mirror the same nav change; parallel `navLinks` + `isActive`; preserve the focus-trap / `inert` behavior untouched.
- `src/components/primitives/WorkRow.astro`, `SectionHeader.astro`, `Container.astro`, `MetaLabel.astro` — editorial primitives available for reuse (frontend-design decides which fit the asymmetric two-tier layout).
- `src/components/NextProject.astro` — the component being **displaced** on the detail page (reference for the link idiom, not reused as-is).

### Content & data (Phase 21 outputs)
- `src/content.config.ts` — the `experience` Zod schema (fields available to render: `role`, `company`, `location`, `startDate`, `endDate?`, `dateRange`, `techStack`, `summary`, `highlights`, `engagementType`, `hasCaseStudy`, `chatSummary?`, `source`). **Do not modify.**
- `src/lib/experience.ts` — `sortExperienceEntries()` reverse-chron helper; call as `sortExperienceEntries(await getCollection("experience"))`.
- `src/content/experience/holloway.mdx` — Holloway entry: 5 frontmatter highlights + full deep-dive body. **D-08 edits the `company:` frontmatter here.**
- `src/content/experience/balfour-beatty.mdx` — Balfour lightweight entry (`hasCaseStudy: false`, `techStack: []`, 2 highlights).
- `Experience/HOLLOWAY_EXPERIENCE.md` — the fenced source of Holloway's synced body (source of truth for any body content change per D-09).

### Design contract & quality gates
- `design-system/MASTER.md` — the LOCKED editorial visual contract; SC5 routes ALL visual decisions here via the frontend-design skill (six-token palette, Geist fonts, type-role classes, restrained motion, focus-ring rule).
- `docs/CONTENT-SCHEMA.md` — experience pipeline + schema documentation (update only if a rendering note is warranted; primarily a Phase 21 artifact).
- `src/scripts/scroll-depth.ts` — the Phase 15 scroll-depth observer the D-11 sentinels feed.
- The **frontend-design skill** (`frontend-design:frontend-design`) — MANDATORY per SC5 for the page composition, summary treatment, Balfour "Earlier" cue, and detail-page layout.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/projects/[id].astro`: near-complete template for the deep-dive — `getStaticPaths` (add `hasCaseStudy` filter), `render()`, `.prose-editorial` + scoped `:global()` MDX overrides, mono meta header, `.lead` tagline, scroll-depth sentinels. Adapt meta to `dateRange · techStack`, drop the external-links row and `NextProject`.
- `src/pages/projects.astro`: template for the `/experience` listing shell (`getCollection` → sort → `Container`/`SectionHeader` → entries).
- `sortExperienceEntries()` (`src/lib/experience.ts`): drop-in reverse-chron ordering — no re-implementation.
- `Header.astro` / `MobileMenu.astro`: parallel `navLinks` arrays + `isActive` — a one-line entry addition in each, plus reordering to put `experience` first.

### Established Patterns
- **Route + nav pairing:** every top-level page has a `navLinks` entry with `isActive` startsWith matching; `/experience` follows this, covering `/experience/[id]` automatically.
- **`.prose-editorial` wrapper for MDX bodies:** scoped Astro styles + `:global()` for MDX-rendered elements; the H2 `§`-prefixed mono treatment already matches the Holloway body's `## Overview` / `## Highlights` / `## Themes` headings.
- **`hasCaseStudy` gates the detail route:** the Phase 21 schema flag becomes the `getStaticPaths` filter — Balfour (`false`) never generates a page, so its non-linked treatment is structurally enforced, not just visually.
- **Manual-sync + drift-gate content model:** rendered `.mdx` bodies are machine-synced from `Experience/*.md`; content edits go through the source + `pnpm sync:experience`, never the `.mdx` body (D-09). Frontmatter is exempt (authored in the `.mdx`) — hence D-08 is safe.
- **Chat-surface invariants (SC5):** any edit touching `BaseLayout.astro` / `global.css` must hold the D-26 battery and D-15 SSE byte-identical anchor. Nav changes live in `Header.astro`/`MobileMenu.astro` (BaseLayout children), and any new page-scoped CSS should avoid `global.css` where possible; if `global.css` is touched, run the D-26 battery.

### Integration Points
- `src/pages/experience.astro` (new) — the listing page; `getCollection("experience")` + `sortExperienceEntries`.
- `src/pages/experience/[id].astro` (new) — the deep-dive detail route.
- `src/components/primitives/Header.astro` + `MobileMenu.astro` — nav entry (D-03).
- `src/content/experience/holloway.mdx` — `company:` frontmatter normalization (D-08).
- `@astrojs/sitemap` auto-discovers the new static routes — no manual sitemap edit.

</code_context>

<specifics>
## Specific Ideas

- **Holloway H1 wording:** "Holloway Company" — explicitly WITHOUT the leading "The" (user-specified), normalized across summary meta + H1 + downstream (D-08).
- **Nav order (user-specified):** `experience · works · about · contact` — experience first.
- **Summary metrics that must survive the scan:** the 5 highlights already encode the punch (0→1,400 tests, 223→1 portal scoping, 91 jobs recovered, idempotent time-clock, query-factory consolidation). Show all 5 (D-05).
- **Balfour:** lightweight, non-linked, framed as "Earlier" career context (role + `May 2023 – Aug 2023` + 2 lines).

</specifics>

<deferred>
## Deferred Ideas

- **Home Holloway teaser** — Phase 24 (HOME-01); the Home surface links through to this Experience page.
- **Positioning-shift copy + JSON-LD Person / positioning metadata** — Phase 24 (POS-01..04). Phase 22 ships basic per-page title/description only (D-10).
- **Experience content into chat knowledge + third-person `chatSummary`** — Phase 25 (CHAT-10/11).
- **Metrics/impact visualizations** for experience highlights (0→1,400, 223→1) — EXP-FUT-02, deferred until the text format proves out.
- **Balfour full case study** — EXP-FUT-01, explicitly out of scope; lightweight entry only.

### Reviewed Todos (not folded)
Four pending todos keyword-matched Phase 22; all reviewed and **not folded** (each is standalone or belongs to another phase):
- *"Change mobile menu breakpoint from 380px to 768px"* — Phase 22 edits `MobileMenu.astro` to add the nav entry, but changing the hamburger breakpoint is an orthogonal behavior change unrelated to the Experience surface. Folding it would be scope creep. Standalone `/gsd-quick`.
- *"Design and ship a real og-default.png"* — site-wide OG asset; belongs with the Phase 24 metadata pass or a dedicated task, not this phase (D-10 defers OG/structured-data).
- *"Chat cache-hit-rate observability"* — chat instrumentation; Phase 25-adjacent or standalone.
- *"Configure CHAT_RATE_LIMITER Cloudflare binding"* — infra; unrelated to the Experience surface.

</deferred>

---

*Phase: 22-experience-page-holloway-case-study*
*Context gathered: 2026-07-09*
