# Phase 24: Positioning Shift & Home Teaser - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Shift the site's register from "junior/student building side projects" to an **honest new-grad engineer with shipped production experience** (never senior), across four site surfaces plus a Home teaser:

- **Home teaser (HOME-01):** a concise Holloway experience teaser for the 30-second recruiter scan, linking through to `/experience`.
- **Positioning copy (POS-01, POS-02):** first-person site copy (`src/data/about.ts`, Home hero preview, `/about`) presents Jack as a software engineer with production experience, no longer side-project framing.
- **Education status (POS-03):** surface the completed WGU B.S. Computer Science (May 2026), the Virginia Tech transfer, and the LPI Linux Essentials certification on the visible site (today they live only in the chat JSON).
- **Metadata (POS-04):** SEO title/description + JSON-LD Person schema reflect the updated positioning and job title.

All visual/layout decisions route through the **frontend-design skill** against `design-system/MASTER.md` (UI phase).

**In scope:**
- New `EXPERIENCE` section on Home (placed first), with the compact Holloway teaser + link to `/experience`.
- Targeted rewrite of `src/data/about.ts` copy (intro + P1 + P3), keeping the working-style paragraph verbatim.
- A dedicated compact Education/credentials block on the `/about` page, fed by a new shared `src/data/education.ts` module.
- JSON-LD Person schema enrichment (jobTitle + alumniOf + hasCredential) on Home; sharpened SEO description.
- A real `public/og-default.png` 1200x630 social card (folded todo) replacing the placeholder.

**Explicitly NOT in scope (belongs to later phases / out of scope):**
- **All chat-side changes** (`src/data/about-chat.ts`, `src/data/portfolio-context.json`/`.static.json`, `scripts/build-chat-context.mjs`) -> **Phase 25** (CHAT-10/11). Phase 24 creates the education module and wires the SITE only; Phase 25 wires chat to it and refreshes the third-person positioning.
- Senior / lead / "5+ years" framing (Out of Scope - honest new-grad only).
- New design system, dark mode, theme toggle, or new runtime dependencies.
- Rewriting the experience/project case studies (content is authored; this is positioning + surfacing).

</domain>

<decisions>
## Implementation Decisions

### Home teaser (HOME-01)
- **D-01: Dedicated `EXPERIENCE` section, placed FIRST.** Home renumbers to `01 EXPERIENCE / 02 WORK / 03 ABOUT / 04 CONTACT` (matches the nav's experience-first order from Phase 22 D-03; puts the strongest new-grad credibility signal at the top of the 30-second scan). The planner must renumber every Home `SectionHeader number=` (WORK `01`->`02`, ABOUT `02`->`03`) and the CONTACT section header (`03`->`04`). frontend-design finalizes the section's visual form.
- **D-02: Teaser content = headline + one metric.** Role / company / dates + a one-line summary + exactly ONE metric-bearing highlight + a link. Not the full 5-highlight ledger (that lives on `/experience`).
- **D-03: Lead metric = the test-suite growth.** "Grew the test suite from 0 to ~1,400 passing checks" (holloway.mdx highlight #1). Chosen for universal legibility and because it echoes the About copy's "tests that fail loudly" through-line. Final metric wording drafted by Claude, reviewed by Jack.
- **D-04: Link target = `/experience`** (the listing page), per HOME-01 ("links through to the Experience page"). The deep-dive (`/experience/holloway`) is one more click via the listing's existing "Read the full case study ->".
- **D-05: Teaser component = compact reuse of the `/experience` featured treatment.** Mirror `experience.astro`'s `.featured` structure (eyebrow role/dates, company title, summary, one highlight, `.deep-link` arrow-reveal), trimmed to teaser size, **page-scoped CSS in `index.astro`**. Likely OMIT the tech-stack line for leanness (stack lives on `/experience`). Reuse the collection query (`getCollection("experience")` + `sortExperienceEntries` + the `hasCaseStudy` Holloway entry) rather than duplicating data. Builder + frontend-design finalize.

### About + hero copy (POS-01, POS-02)
- **D-06: Targeted revision of `src/data/about.ts`** (first-person site voice). Rework `ABOUT_INTRO` + `ABOUT_P1` to carry the production-experience positioning; keep `ABOUT_P2` (working style) VERBATIM (already on-message); update `ABOUT_P3` (availability, see D-13); weave in a light "recently graduated" nod (full education detail lives in the block, D-09/D-10). Claude drafts, Jack reviews. **Note `about.ts` is shared:** `ABOUT_INTRO` + `ABOUT_P1` also render in the Home ABOUT preview (`index.astro`), so the revision propagates to both surfaces.
- **D-07: Self-label = "Software engineer"** (drop the self-applied "junior"/"new-grad" qualifier). The honest new-grad level is conveyed through content (recent grad, contract experience, seeking an entry-level/full-time role), not a self-diminishing label. Reused as the JSON-LD jobTitle (D-14). Consistent with the existing SEO title default "Jack Cutrara | Software Engineer" (unchanged).
- **D-08: Home hero lead stays AS-IS** ("Software engineer building reliable, production-grade systems."). It already carries production framing with no student register, and the new `01 EXPERIENCE` section directly below supplies the proof. Refine only at copy-review if a specific word improves it. (This line is also the Home meta description - see D-15.)

### Education surfacing (POS-03)
- **D-09: Dedicated compact Education/credentials block on the `/about` page** (mono labels + hairline rule, editorial register matching the site). Home stays lean - no education block on Home; education reaches Home only via the JSON-LD alumniOf/credential (D-14). frontend-design finalizes the block's form (label grouping, spacing, type scale).
- **D-10: Education fields (WGU primary + VT sub-note).** Lead with the completed degree: `B.S. Computer Science - Western Governors University - May 2026`, a light "transferred from Virginia Tech" sub-note, and the cert on its own line: `LPI Linux Essentials`. Honest (WGU is where he finished, VT where he started - do not imply a VT credential). No GPA/honors; keep it minimal. Update the stale "2026" grad value to "May 2026", completed/past register.
- **D-11: Shared `src/data/education.ts` module = single source of truth.** The `/about` block reads it now; **Phase 25** points the chat-context build at it. Prevents drift between the site and the chat's education object. The facts are voice-neutral (identical in first/third person), so a single module serves both surfaces. Phase 24 creates + wires it to the SITE only.

### Copy register / framing
- **D-12: Present-tense / current Holloway framing** (teaser + About): "Currently the solo contract engineer on Holloway Connect, a live production operations platform..." Strongest active-shipping signal; matches "May 2026 - Present" and the existing first-person present summary in `holloway.mdx`.
- **D-13: Availability close (`ABOUT_P3`) = currently contracting + seeking full-time.** P3 transparently notes he is currently the solo contract engineer on Holloway Connect AND looking for a full-time software engineering role (a team that cares about correctness, reliability, and performance). Resolves the "currently contracting yet available" tension honestly and signals active shipping. The hero `StatusDot "AVAILABLE FOR WORK"` + `"EST. 2026 - NORTHERN VA"` stay unchanged.

### Metadata & JSON-LD (POS-04)
- **D-14: Enrich the Home Person schema** (`personSchema` in `index.astro`, rendered via `JsonLd.astro`): add `jobTitle: "Software Engineer"` + `alumniOf` (Western Governors University, Virginia Tech) + `hasCredential` (LPI Linux Essentials), sourced from `education.ts` (D-11). SEO **title** default unchanged (already "Software Engineer").
- **D-15: Sharpen the SEO description** to signal production/contract experience (the Home/default description, currently "Software engineer building reliable, production-grade systems."). Final wording drafted + reviewed; zero em dashes. Applies to the Home `<BaseLayout description=...>` (and the `/about` description if it reinforces positioning).
- **D-16: og-default.png (FOLDED todo)** - ship a real 1200x630 editorial social card replacing the placeholder. Concept deferred to frontend-design against MASTER.md (D-20); direction = name + "Software Engineer" + a short tagline on the six-token palette (bg/ink + single accent dot), Geist type. Written to `public/og-default.png`; already referenced by `BaseLayout.astro` (`ogImage = "/og-default.png"`), so no wiring change - asset swap only.

### Scope boundary & guardrails
- **D-17: Phase 24 = SITE surfaces only.** Do NOT touch `src/data/about-chat.ts`, `src/data/portfolio-context.json`/`.static.json`, or `scripts/build-chat-context.mjs`. The education module is created + wired to the SITE; Phase 25 wires chat (CHAT-10/11) and refreshes the third-person positioning. Preserves the CHAT-06 voice split and keeps the chat-surface gates untouched this phase.
- **D-18: EM-DASH LANDMINE.** `src/data/about.ts` and other `src/data/*` copy are NOT scanned by the voice em-dash/banlist gates (those only scan project/experience MDX). Every new About / education / teaser / metadata string must be manually verified em-dash-free (use en dashes, hyphens, or restructure). Site-wide zero-em-dash ban holds (chat pipeline exempt). The existing `about.ts` uses curly quotes + ` ` and no em dashes - match that.
- **D-19: Chat-surface invariants (QA-01).** Keep changes OUT of `BaseLayout.astro` / `global.css` where possible - Home teaser + About + education styles are page-scoped (`index.astro` / `about.astro`), and the JSON-LD change is in `index.astro` (not BaseLayout). If any change does touch `BaseLayout.astro` / `global.css`, run the D-26 chat-surface regression battery + the D-15 SSE byte-identical anchor. `pnpm exec astro check` stays 0/0/0; no new runtime deps; Lighthouse holds (QA-02).
- **D-20: frontend-design routing MANDATORY** (UI phase). The new EXPERIENCE teaser form, the education block form, the OG card concept, and any `/about` layout change all route through the frontend-design skill against `design-system/MASTER.md` (six-token palette, Geist, type-role classes, page-scoped CSS, restrained motion, focus-ring rule).

### Claude's / frontend-design's Discretion
- **OG card concept** (D-16) - deferred entirely to the frontend-design pass.
- **Teaser component shape** (D-05) - whether to extend an existing primitive or add a page-scoped block in `index.astro`; whether to show/omit the stack line (recommend omit).
- **Education block form** (D-09) - exact label grouping ("Education" vs "Education & Credentials"), the VT sub-note styling, spacing, type scale.
- **Copy drafting** (Claude drafts, Jack reviews): the revised `ABOUT_INTRO` / `ABOUT_P1` / `ABOUT_P3`, the teaser sentence + metric wording, the sharpened SEO description, and the education-block label strings.

### Folded Todos
- **"Design and ship a real og-default.png"** (`.planning/todos/2026-04-15-design-and-ship-og-default-image.md`) - the 1200x630 social-share card is currently a placeholder. Folded into the POS-04 metadata pass (D-16); frontend-design designs the real editorial card. Adjacent to the schema/description work and the positioning refresh (the card should reflect the new positioning).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & scope
- `.planning/ROADMAP.md` - Phase 24 goal + Success Criteria SC1-SC5; v1.4 sequencing (24 precedes the Phase 25 chat refresh that ingests the new positioning/education).
- `.planning/REQUIREMENTS.md` - POS-01..04, HOME-01 (this phase); CHAT-10/CHAT-11 (Phase 25 - chat refresh, the site/chat boundary); the Out-of-Scope table (no senior framing, no new design system, no new runtime deps, no `/resume` route).
- `.planning/STATE.md` Accumulated Context - v1.4 notes: voice split (CHAT-06) site=first-person / chat=third-person, `checkFirstPersonLeaks` build guard, D-26/D-15 chat-surface invariants.

### Site copy & data (what changes)
- `src/data/about.ts` - the first-person About copy (single source of truth for `/about` + the Home ABOUT preview). Targeted revision (D-06); keep `ABOUT_P2` verbatim. EM-DASH LANDMINE (D-18) - not gate-scanned.
- `src/data/education.ts` - **new** shared education module (D-11), single source of truth for the block + the JSON-LD + Phase 25 chat.
- `src/data/about-chat.ts` - the third-person chat variant. **Do NOT edit this phase** (D-17) - Phase 25 owns it. Read only to understand the voice split.
- `src/data/portfolio-context.json` / `.static.json` - current education object (`degree`/`school`/`graduation: "2026"`). **Do NOT edit this phase** (D-17); Phase 25 refreshes via the education module.

### Pages & layout (what changes)
- `src/pages/index.astro` - Home. Add the `01 EXPERIENCE` teaser section (D-01..D-05), renumber WORK/ABOUT section headers, enrich `personSchema` (D-14), sharpen the `description` (D-15). Existing reuse idioms: `.read-more` / `.see-all-work` deep-link arrow-reveal, `getCollection`, `SectionHeader`.
- `src/pages/about.astro` - `/about`. Add the dedicated Education block (D-09/D-10); renders the revised `about.ts` copy.
- `src/pages/experience.astro` - **reference** for the teaser treatment to mirror (`.featured` eyebrow/title/summary/highlights + `.deep-link` arrow-reveal, reduced-motion contract); reuses `sortExperienceEntries` + the `hasCaseStudy` Holloway entry.
- `src/layouts/BaseLayout.astro` - `SEO` component (title default already "Software Engineer"), `ogImage="/og-default.png"` default, `titleTemplate "%s | Jack Cutrara"`. Prefer NOT to edit (D-19); description is a per-page prop. Any edit here triggers the D-26 battery.
- `src/components/JsonLd.astro` - renders the Person schema; enriched in `index.astro`, not here.
- `src/components/ContactSection.astro` - the CONTACT section header; verify/renumber to `04` (D-01).

### Content source (teaser facts)
- `src/content/experience/holloway.mdx` - Holloway frontmatter + highlights the teaser draws from: role "Software Engineer, Contract", company "Holloway Company", dateRange "May 2026 - Present", summary (first-person present), highlight #1 "0 -> ~1,400 passing checks" (D-03). Source: `Experience/HOLLOWAY_EXPERIENCE.md`.

### Assets
- `public/og-default.png` - the placeholder social card to replace (D-16).
- `public/jack-cutrara-resume.pdf` - the resume (education ground-truth: WGU B.S. CS May 2026, VT transfer, LPI Linux Essentials). Keep the site's education facts consistent with it.

### Design contract & quality gates
- `design-system/MASTER.md` - the LOCKED editorial visual contract; D-20 routes ALL visual decisions here via the frontend-design skill.
- The **frontend-design skill** (`frontend-design:frontend-design`) - MANDATORY (D-20) for the teaser form, education block, OG card, and any `/about` layout change.
- Prior phase context for the pattern lineage: `.planning/phases/22-experience-page-holloway-case-study/22-CONTEXT.md` (experience-first nav + featured treatment), `.planning/phases/23-projects-reconciliation-featured-tier/23-CONTEXT.md` (D-15/D-16/D-17 chat-surface + em-dash guardrails, "See all work ->" idiom).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`experience.astro` featured treatment** (`.featured`, `.deep-link` arrow-reveal, reduced-motion contract): the Home teaser mirrors this in a compact, page-scoped form (D-05).
- **`sortExperienceEntries` + `getCollection("experience")` + the `hasCaseStudy` Holloway entry**: the teaser reuses the same query the `/experience` page uses (no data duplication).
- **`.read-more` / `.see-all-work` deep-link idiom** in `index.astro` (label-mono, inline-block, muted->accent, arrow opacity reveal, reduced-motion drop): the pattern for the teaser's "See the experience ->" link.
- **`SectionHeader` primitive** (`number` / `title` / `id` / `count` props): reused for the new `01 EXPERIENCE` header; all Home section numbers shift (D-01).
- **`personSchema` + `JsonLd.astro`** in `index.astro`: extend with jobTitle/alumniOf/hasCredential (D-14).

### Established Patterns
- **Voice split (CHAT-06):** site copy first-person (`about.ts`), chat third-person (`about-chat.ts` + `portfolio-context.json`). New positioning lands on the site this phase; chat mirror is Phase 25 (D-17).
- **Data-module single-source-of-truth:** `about.ts`/`contact.ts` centralize copy consumed by multiple pages; `education.ts` follows the same shape (D-11).
- **Page-scoped CSS, no Tailwind in primitives, six-token palette** (MASTER.md): teaser + education styles stay page-scoped; avoid `global.css`/`BaseLayout.astro` to keep chat-surface risk low (D-19).
- **Content gates scan MDX, not `src/data`:** the voice em-dash/banlist tests enumerate MDX slugs and do not cover `about.ts`/`education.ts` (D-18) - manual em-dash discipline required.

### Integration Points
- `src/pages/index.astro` - new EXPERIENCE section + renumber + schema + description (multiple edits in one file).
- `src/pages/about.astro` - education block + revised copy render.
- `src/data/about.ts` - targeted copy revision (propagates to Home preview).
- `src/data/education.ts` (new) - consumed by `about.astro` + `index.astro` (schema); Phase 25 consumer deferred.
- `src/components/ContactSection.astro` - CONTACT header renumber to `04`.
- `public/og-default.png` - asset swap (already referenced by BaseLayout default).
- `@astrojs/sitemap` - no new routes, no sitemap impact.

</code_context>

<specifics>
## Specific Ideas

- **Section order (user-specified):** Experience FIRST on Home -> `01 EXPERIENCE / 02 WORK / 03 ABOUT / 04 CONTACT`.
- **Teaser (user-specified):** headline + ONE metric (the 0 -> ~1,400 test-suite growth), present-tense/current framing, link to `/experience`, compact reuse of the featured treatment, likely no stack line.
- **Self-label (user-specified):** "Software engineer" - drop "junior"; honest new-grad level via content, never senior.
- **About rewrite (user-specified):** targeted - keep the working-style paragraph (P2) verbatim; rework intro + P1 + P3.
- **Education (user-specified):** dedicated compact block on `/about`; WGU B.S. CS - May 2026 (completed) as primary, "transferred from Virginia Tech" sub-note, "LPI Linux Essentials" line; no GPA/honors; a shared `education.ts` module.
- **Availability (user-specified):** transparently "currently contracting on Holloway Connect AND looking for a full-time software engineering role"; hero "AVAILABLE FOR WORK" stays.
- **Metadata (user-specified):** Person schema gains jobTitle + alumniOf + hasCredential; SEO description sharpened for production experience; og-default.png shipped as a real editorial card (folded todo).

</specifics>

<deferred>
## Deferred Ideas

- **Chat-side positioning refresh** - updating `about-chat.ts` (third-person), the `portfolio-context.json` education object, and wiring the chat-context build to `education.ts` -> **Phase 25** (CHAT-10/CHAT-11). Phase 24 deliberately leaves the entire chat pipeline untouched (D-17).
- **OG per-project/per-page images** (e.g. `/og/multi-chain-evm.png`) - only the site-wide `og-default.png` is in scope this phase.

### Reviewed Todos (not folded)
Three pending todos keyword-matched Phase 24 but were reviewed and NOT folded (same false-positives Phase 23 reviewed; none touch positioning/metadata/education):
- *"Chat cache-hit-rate observability"* (`2026-04-23-chat-cache-hit-rate-observability.md`) - chat instrumentation; Phase 25-adjacent / v1.3+ deferred, not a site surface.
- *"Configure CHAT_RATE_LIMITER Cloudflare binding"* (`2026-04-23-configure-chat-rate-limiter-binding.md`) - infra/security; unrelated to this phase.
- *"Change mobile menu breakpoint from 380px to 768px"* (`2026-04-15-change-mobile-menu-breakpoint-from-380px-to-768px.md`) - orthogonal nav-behavior change; standalone `/gsd-quick`.

</deferred>

---

*Phase: 24-positioning-shift-home-teaser*
*Context gathered: 2026-07-10*
