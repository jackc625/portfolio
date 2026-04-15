# Phase 10: Page Port - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 10 delivers the **5 real pages** (homepage, about, projects index, project detail, contact) by composing the Phase 9 primitives, wires real content collection data into the new layouts, restyles the chat widget visually to the editorial system without losing any Phase 7 functionality, and restores cross-page chat persistence via localStorage. Closes 12 of the 13 v1.1 user-facing requirements (HOME-01..04, ABOUT-01..02, WORK-01..03, CONTACT-01..02, CHAT-01..02). Quality requirements (QUAL-01..06) are reserved for Phase 11.

**In scope:**
- Rewrite 5 stub pages from inline-style placeholders to editorial composition over Phase 9 primitives:
  - `src/pages/index.astro` — display hero, `§ 01 — WORK` (3 featured), `§ 02 — ABOUT` preview, `§ 03 — CONTACT` section
  - `src/pages/about.astro` — `.about-intro` + 3 paragraphs (mockup text shipped as v1.1 final)
  - `src/pages/projects.astro` — same numbered work list pattern, all 6 projects
  - `src/pages/projects/[id].astro` — editorial case study layout (mono metadata header → `.h1-section` title → `.lead` tagline → external link row → `.body` MDX render → NextProject footer)
  - `src/pages/contact.astro` — standalone contact page rendering the same shared `ContactSection.astro` composite
- Add a required `year: z.string().regex(/^\d{4}$/)` field to `src/content.config.ts` and backfill all 6 .mdx files (Jack supplies year values during the backfill task)
- Create `src/components/ContactSection.astro` composite (shared between homepage `§ 03` and `/contact` page)
- Create `src/data/contact.ts` constants file as the single source of truth for email, github, linkedin, x (null), resume path
- Wire `ArticleImage.astro` into the project detail MDX components map (zero-cost when unused)
- Restyle `ChatWidget.astro` and `src/styles/global.css` `.chat-*` block to the editorial flat-rectangle grammar
- Restore chat conversation persistence via localStorage (last 50 messages, 24h TTL, replays through DOMPurify)
- Restore typing-dot bounce animation via a narrow MASTER §6.1 amendment ("state indicators" carve-out)
- Update REQUIREMENTS.md (CONTACT-01 X drop, CONTACT-02 PDF wording reconciliation), MASTER.md (§6.1 typing-dot carve-out, §5.2/§5.8 X drop from social rows), and JsonLd Person schema with new contact info — single docs commit at the head of the phase
- Update Phase 9 `MobileMenu.astro` and `Footer.astro` social rows to import from `contact.ts` and drop X
- Delete dead `src/components/ContactChannel.astro` (v1.0 SVG-icon component, zero imports)

**Out of scope (Phase 11 or later):**
- Lighthouse / a11y / contrast / responsive sweep (QUAL-01..06)
- `mockup.html` deletion
- `/dev/primitives` preview page deletion
- `CLAUDE.md` Technology Stack milestone-end update
- Sourcing/producing project screenshots for `ArticleImage` (the wiring is done; the content pass is its own task)
- Adding new project mdx files
- Real X/Twitter URL when one exists (one-line edit to `contact.ts`)
- Production deploy (still gated on Phase 11 sign-off)

**Regression gate:** `pnpm run build` succeeds AND chat widget passes a manual smoke test on at least one page (open, send a message, SSE streams response, focus trap works, copy works) AND the chat persistence restore works across page navigation (send → navigate → reopen → see history). Same shape as Phase 8/9 gates plus the new persistence check.

</domain>

<decisions>
## Implementation Decisions

### Work list composition (Phase 9 deferred decision)

- **D-01: Inline `getCollection('projects')` + `.map()` in each page.** `index.astro` and `projects.astro` each write their own collection query and map over `<WorkRow>`. No shared `WorkList.astro` composite. Two call sites at this scale do not justify a wrapper. Phase 10 D-03 from Phase 9 (no Tailwind in primitives) does not apply because pages aren't primitives — pages can use any markup they need. Aligns with Phase 9 D-04 "primitive props are fixed" — pages are the consumers, not the primitive.
- **D-02: Homepage shows 3 `featured: true` projects, `/projects` shows all 6.** Homepage `§ 01 — WORK` filters to `.featured === true` (currently SeatWatch order:1, NFL Prediction order:2, SolSniper order:3) sorted ascending by `order`, numbered 01–03, with a `3 / 6` count indicator on the SectionHeader. `/projects` renders all 6 sorted ascending by `order`, numbered 01–06, with a `6 / 6` count indicator. The featured flag earns its place in the schema this phase.
- **D-03: Add `year: z.string().regex(/^\d{4}$/)` required field to `src/content.config.ts`.** Schema becomes `year: z.string().regex(/^\d{4}$/)` (string not number to keep template-literal output clean and tabular-aligned). Backfilled into all 6 .mdx files in the same plan that adds the field. **Jack supplies the 6 year values** at the backfill task — planner surfaces the file list, Jack types in 4-digit years (2024–2026 likely range). Build fails if any .mdx is missing the field, enforcing the contract.
- **D-04: Row numbers are zero-padded `01`–`06` rendered with `.tabular`.** Matches mockup.html §390–433 verbatim. The `.tabular` class (font-variant-numeric: tabular-nums) ensures column alignment when projects exceed row 9 in the future. Honors Phase 9 D-04 (WorkRow props fixed as MASTER §5.5 specifies — `number: string`).

### Project detail editorial layout

- **D-05: Mono metadata header is `YEAR · UPPERCASE_TECHSTACK` only — no status, no category.** Single `.label-mono` line above the title, e.g. `2025 · NEXT.JS · TYPESCRIPT · OPENAI · POSTGRES · BULLMQ`. The techStack array joined with ` · ` separator, all uppercase via CSS `text-transform`. Status is dropped (all 6 projects are `completed` so it carries no information). Category is dropped (it's a content-organization concern, not a reader concern).
- **D-06: Project title uses `.h1-section`** (Geist 600, clamp(2.5rem, 5vw, 3.5rem), line-height 1.05, letter-spacing -0.02em). Establishes the **page-level type ramp**: `.display` is reserved for the homepage hero only (`JACK CUTRARA·`), `.h1-section` is the case-study title surface, `.h2-project` is the work-row title surface and the body section header surface inside MDX. No collision.
- **D-07: MDX body renders inside a `.body` column wrapper, h2 sections preserved and styled scoped.** `<Content />` from astro:content renders inside a `<div class="body">`. Scoped styles in `projects/[id].astro` override `.body h2` to look like `.label-mono` with a `§ ` prefix injected via `::before`. Paragraphs, lists, and inline elements inherit `.body` defaults (Geist 400, 1.125rem, 1.6 line-height, max-width 68ch). MDX files are NOT edited — the visual transform happens entirely in the page's scoped styles. Every project has the same 5 sections (Problem / Solution & Approach / Tech Stack Detail / Challenges & Lessons / Results), so this transform is universal.
- **D-08: Tagline renders as a `.lead` line under the title.** `.lead` role class (Geist 400, clamp(1.25rem, 2vw, 1.625rem), line-height 1.4) — case-study elevator pitch. `description` field is NOT rendered on the page; it goes to `BaseLayout description={project.data.description}` for SEO and Open Graph only. Clean separation: tagline = human-facing, description = machine-facing.
- **D-09: MDX h2 section labels render as `§ NAME` unnumbered mono labels.** Scoped style: `.body h2 { @extend .label-mono }` plus `.body h2::before { content: "§ "; }`. Reads `§ PROBLEM`, `§ SOLUTION & APPROACH`, `§ TECH STACK DETAIL`, `§ CHALLENGES & LESSONS`, `§ RESULTS`. No numbering — the `§ 01` numbered slot is reserved for top-level page sections (`§ 01 — WORK`). The mdx files' h2 text stays exactly as the .mdx authors them; CSS handles all visual treatment.
- **D-10: Next-project link is determined by `order` ascending with wrap-around.** SeatWatch (01) → NFL Prediction (02) → SolSniper (03) → Optimize AI (04) → Clipify (05) → Crypto Breakout Trader (06) → SeatWatch (01). Deterministic, uses existing schema, wrap keeps the loop closed. The current `NextProject.astro` API (`{ project: CollectionEntry<'projects'> }`) is unchanged — the page computes the next entry in `getStaticPaths` or in the page frontmatter and passes it.
- **D-11: External links (`githubUrl`, `demoUrl`) render as a mono link row under `.lead`, missing entries skipped silently.** Format: `GITHUB →` and/or `LIVE DEMO →` as uppercase `.label-mono` text with `→` glyph, color `--ink-muted`, hover `--accent`. Reuses the mockup.html `.contact-link` hover grammar (already established). Currently only SeatWatch has `demoUrl`; the row simply doesn't render when both fields are absent. No icons (consistent with CONTACT-01 anti-icon stance).
- **D-12: Wire `ArticleImage.astro` into the MDX components map for the detail page.** `projects/[id].astro` renders `<Content components={{ img: ArticleImage }} />` so any `![alt](src)` in MDX uses `ArticleImage` (Geist Mono caption, Astro image service for width/height, no shadow). Zero-cost when unused — none of the current 6 mdx files use images. This makes SC#4 ("optional inline images") capability-real for future content passes without scope creep into screenshot production.
- **D-13: Code blocks in MDX bodies use Astro 6's bundled Shiki + scoped minimal box.** Astro 6 ships Shiki as the default markdown highlighter. Scoped style: `.body pre { background: var(--bg); border: 1px solid var(--rule); padding: 16px 20px; overflow-x: auto; font-family: var(--font-mono); font-size: 0.875rem; }`. No syntax-theme chrome (use Shiki's "github-light" or equivalent minimal). No shadow, no accent border — only 1px rule. Same code-block grammar applies inside the chat panel (D-23) so the site has one code-block treatment everywhere.
- **D-14: `description` field is SEO/OG only — never rendered on the detail page.** Passed to `BaseLayout description={project.data.description}` for `<meta name="description">` and Open Graph. Tagline owns the human-facing lead slot. Avoids duplication between the lead and the `§ PROBLEM` section.

### Chat widget visual restyle (CHAT-02)

- **D-15: Editorial chrome grammar — flat rectangle panel, accent-round bubble survives.**
  - **Bubble:** keeps 48×48px round shape, `background: var(--accent)`, white message-bubble icon. **The only round surface in the editorial system** — serves as the accent-red beacon that the chatbot exists. This is a deliberate exception to the flat-rectangle grammar; documented in MASTER §6 carve-out (D-19).
  - **Panel:** `border-radius: 0`, no `box-shadow`, `1px solid var(--rule)` border on all four sides, `background: var(--bg)`, fixed 400×500px on desktop, full-screen on mobile (D-22).
  - **Panel header:** loses its gray `background: var(--rule)` strip. Becomes a 1px rule bottom under a `.label-mono` text `ASK JACK'S AI` and a close `×` button at top-right. Height 48px preserved.
- **D-16: Secondary surfaces (chips, textarea, send button) use mono labels + flat rule borders.**
  - **Starter chips:** `border-radius: 0`, `border: 1px solid var(--rule)`, `padding: 10px 14px`, `background: transparent`, `.label-mono` text in `--ink-muted`, hover `color: var(--accent)` (no bg change). Same 4 starter prompts retained from Phase 7 (D-27) but rendered as flat editorial buttons.
  - **Textarea:** `border-radius: 0`, `background: var(--bg)`, `border: 1px solid var(--rule)`, accent focus ring (`outline: 2px solid var(--accent); outline-offset: 0`), Geist 400 1rem, `--ink` color, `min-height: 36px; max-height: 120px` JS auto-grow preserved.
  - **Send button:** 36×36px square (no rounded-full), `background: transparent`, color `--ink-faint`, hover/enabled `--accent`, SVG send-arrow glyph. Disabled state: opacity 0.4. No bg fill.
- **D-17: Typing dot bounce restored via narrow MASTER §6.1 amendment.** Three bouncing dots animate via scoped `@keyframes` (250ms duration, 0/150/300ms staggered delays) only while the bot is actively replying. Bubble pulse and panel scale-in stay dead. Requires a single-bullet amendment to MASTER §6.1: **"Status indicators (typing dots, loading spinners) may use looped CSS @keyframes when actively signaling state — these are functional indicators, not entrance animations."** This is the only motion exception in v1.1 beyond color/hover transitions.
- **D-18: Per-message copy button is a `COPY` mono label, not an SVG icon.** Replaces the existing SVG clipboard. `.label-mono` button text, `opacity: 0` default, `opacity: 1` on `.chat-message-wrapper:hover`, transition 200ms ease (functional state transition, MASTER §6 allowed). On click, swaps to `COPIED` text in `--accent` color for 1s then resets. Editorial, accessible (real text label), consistent with the no-icons stance from CONTACT-01.
- **D-19: MASTER.md must be amended once for two related carve-outs.** Single docs commit at the head of Phase 10 amends:
  - **§6.1** — Add the "state indicators" bullet (D-17).
  - **§9 (Chat Widget Token Map) or new §10** — Document that the round accent bubble is the only round surface in the system, named exception to the flat-rectangle grammar (D-15). Without this, the bubble looks like an unfenced violation.
  - Modeled on Phase 9's MASTER §5.8/§5.2 amendment commit shape (Phase 9 D-17). After this commit, MASTER stays locked for the rest of Phase 10.
- **D-20: Mobile full-screen overlay (<768px) inherits the new flat-rectangle chrome.** The existing `@media (max-width: 767px) .chat-panel-mobile` rule stays — `position: fixed; inset: 0; width: 100%; height: 100%; border-radius: 0; padding-bottom: env(safe-area-inset-bottom)`. Header becomes the same `.label-mono` + 1px rule bottom + `×`. No half-sheet, no slide-up animation. Same code path as desktop, just full-viewport.
- **D-21: Bot message markdown elements restyle with backgrounds stripped, accent links preserved.**
  - **Inline `code`:** drop `background: var(--rule)` and `border-radius: 3px`. Keep `font-family: var(--font-mono)`, `font-size: 0.875rem`. Code reads as code via font alone — no chip styling.
  - **Fenced code blocks:** match the case-study Shiki minimal-box treatment from D-13. One code-block grammar across the whole site.
  - **Links:** keep `color: var(--accent)`, hover underline (already correct in Phase 7 styles).
  - **Lists:** keep current spacing (margin 0.25em 0, padding-left 16px, list-item margin-bottom 4px) — already editorial.

### Chat persistence (CHAT-01)

- **D-22: Cross-page chat persistence restored via `localStorage` with last-50 cap and 24h TTL.**
  - **Storage key:** `chat-history`
  - **Format:** `{ messages: [{ role: "user" | "bot", content: string, timestamp: string }], lastActive: string }` where timestamps are ISO 8601 strings
  - **Write trigger:** every send (user message) and every receive-complete (bot message after SSE stream finishes). Append to messages array, update lastActive.
  - **Cap:** keep only the last 50 messages on every write — slice off the head if longer.
  - **TTL:** on chat-panel open, parse storage. If `lastActive` is more than 24h ago, clear the history and start fresh. Otherwise replay stored messages into the DOM.
  - **Render path:** stored messages flow through the same DOMPurify sanitization that live messages use — XSS-safe by construction. No new sanitizer surface.
  - **Privacy note ("Conversations are not stored.") update:** the current footer text becomes false. Replace with `Conversations stored locally for 24h.` to honor user truthfulness without alarming recruiters. This is a single-line edit in `ChatWidget.astro` line 210.
  - **No server-side storage.** The Phase 7 SSE → Anthropic API flow is unchanged. Persistence is purely browser-local.
  - **Cleared on:** 24h TTL expiry, manual user close→reopen with TTL pass, full localStorage clear via browser dev tools.

### Real content & contact policy

- **D-23: Single source of truth at `src/data/contact.ts`.** New TypeScript constants file:
  ```ts
  export const CONTACT = {
    email: "jack@jackcutrara.com",
    github: "https://github.com/jackc625",
    linkedin: "https://linkedin.com/in/jackcutrara",
    x: null,
    resume: "/jack-cutrara-resume.pdf",
  } as const;
  ```
  Imported by `ContactSection.astro` (D-24), `MobileMenu.astro` social row, `Footer.astro` mobile social row (Phase 9 D-10), `JsonLd.astro` Person schema. `null` entries are skipped silently by every consumer. When Jack creates an X account, it's a one-line edit and all 4 surfaces update simultaneously.
- **D-24: Shared `ContactSection.astro` composite, rendered by both homepage `§ 03 — CONTACT` and standalone `/contact`.** New file at `src/components/ContactSection.astro` (NOT inside `primitives/` because it's a composite, not a Phase 9 primitive). Wraps:
  - Optional `<SectionHeader number="03" title="CONTACT" />` (rendered by homepage, omitted by `/contact` page which has its own page-level title treatment)
  - `.contact-body` containing: `.label-mono` `GET IN TOUCH` label, `.h2-project`-sized `.contact-email` link to `mailto:CONTACT.email`, mono `.contact-links` row with `GITHUB · LINKEDIN · RÉSUMÉ` links from CONTACT constants
  - `<a download href={CONTACT.resume}>` for the résumé link (CONTACT-02 wiring)
  - Imports `CONTACT` constants from `src/data/contact.ts`
  - Skips null entries (currently X)
- **D-25: X dropped from CONTACT-01 spec via REQUIREMENTS.md amendment.** Single docs commit early in Phase 10 amends `.planning/REQUIREMENTS.md`:
  - **CONTACT-01:** social row becomes `GITHUB · LINKEDIN · RÉSUMÉ` (drop X). The "no icons, no contact form, no CTA buttons" wording is preserved. Reason: no real X account exists; linking to a stub is dishonest, leaving a gray "soon" badge is editorial debt.
  - **CONTACT-02:** "placeholder PDF" wording updated to reflect that `jack-cutrara-resume.pdf` is the shipped real-or-placeholder file. Phase 8 already shipped the rename (Phase 8 carry-over flagged in STATE.md). Phase 10 closes the wording-vs-reality gap.
  - **MASTER.md §5.2 (mobile footer social row)** and **§5.8 (MobileMenu social row)** are also amended in the same commit to drop X, since both Phase 9 sections still document the four-link form. Honors the Phase 9 "MASTER amendment is the only sanctioned mutation path" discipline.
  - All three reconciliations land in **one** docs commit at the head of Phase 10, before any contact code is written.
- **D-26: About page copy is the mockup text shipped as v1.1 final.** mockup.html §445–448 verbatim:
  - Intro: "I'm Jack — a junior software engineer who likes building systems that don't break at 3 a.m."
  - P1: "I build small, production-grade services and the plumbing around them: caches, compilers, sync engines, APIs. Most of my projects start as 'I wonder how that actually works' and end as something I'd be comfortable handing off to a team."
  - P2: "I reach for the boring tool first. I read the spec before I read the blog post. I like tests that fail loudly and code review comments that start with 'why.' My favorite bug reports are the ones that come with a reproduction."
  - P3: "Right now I'm looking for a junior or entry-level role on a team that cares about correctness, reliability, and performance — ideally one that will push me to get better at the parts of the stack I haven't touched yet."
  - Covers SC#2 (≤80 words/paragraph, real engineer voice, no progress bars/icons/graphics). Jack edits in a future content pass without blocking Phase 10.
- **D-27: Homepage `§ 02 — ABOUT` preview = intro line + first body paragraph + `READ MORE →` mono link.** The about preview on the homepage shows two strings from the about copy (intro + P1) followed by a `READ MORE →` `.label-mono` link to `/about`. The about strings live in a single source — likely a tiny `src/data/about.ts` constants file (or inline in `about.astro` and re-imported by `index.astro`). Planner picks the storage shape; the requirement is "one source for both surfaces."
- **D-28: Delete `src/components/ContactChannel.astro` in Phase 10.** Confirmed dead via grep (zero imports across `src/`). Has SVG icons that contradict CONTACT-01. Deletion lands in the same plan that creates `ContactSection.astro` — the editorial replacement. One-line removal commit, paired with the new composite for atomicity.
- **D-29: Update `MobileMenu.astro` and `Footer.astro` to import from `src/data/contact.ts` and drop X.** Phase 9 left these primitives with hard-coded `GITHUB · LINKEDIN · X · EMAIL` social rows. Phase 10 refactors both to import the CONTACT constants and render only non-null entries. Order on the mobile rows becomes `GITHUB · LINKEDIN · EMAIL`. This is technically a primitive edit (Phase 9 D-04 says "primitive props are fixed") — but the change is **content-only**, not API or markup-shape, and is the unblocker for D-25's X drop reaching every surface. Treated as a Phase 10-allowed amendment because the source-of-truth shift to `contact.ts` requires it.

### MASTER.md amendments (one docs commit at head of Phase 10)

- **D-30: Phase 10 amends MASTER.md once.** Single docs commit pairs three changes (analogous to Phase 9 D-17's two-section amendment):
  - **§6.1** — Add the "state indicators may animate" carve-out (D-17).
  - **§5.2** — Drop X from the mobile footer social row documentation (D-29).
  - **§5.8** — Drop X from the MobileMenu social row documentation (D-29).
  - **§9 or §10** — Document the round-bubble exception (D-15) so the chat bubble's circle isn't an unmarked editorial violation.
  - Pairs in the same commit as the REQUIREMENTS.md CONTACT-01/CONTACT-02 amendment (D-25). One head-of-phase docs commit, four file edits.
  - After this commit, MASTER.md and REQUIREMENTS.md stay byte-locked for the rest of Phase 10.

### Execution ordering (suggested wave shape)

- **D-31: Plan ordering (wave shape suggested, not locked).** Phase 10 has natural sequencing the planner should preserve:
  1. **Single docs commit** — REQUIREMENTS.md (CONTACT-01, CONTACT-02) + MASTER.md (§6.1, §5.2, §5.8, §9/§10) amendments. Unblocks every downstream surface.
  2. **Schema + content backfill** — `src/content.config.ts` adds `year` field, all 6 .mdx files get year values (Jack supplies). Build gate verifies schema.
  3. **Source-of-truth shifts** — Create `src/data/contact.ts`. Refactor `MobileMenu.astro` and `Footer.astro` to import from it. Delete `src/components/ContactChannel.astro`.
  4. **Composite creation** — `src/components/ContactSection.astro`.
  5. **Page rewrites in dependency order** —
     - `index.astro` (homepage hero, work list with featured filter, about preview, contact section)
     - `about.astro` (full about copy)
     - `projects.astro` (work list with all 6)
     - `projects/[id].astro` (case study editorial layout, MDX components map, NextProject)
     - `contact.astro` (renders ContactSection)
  6. **Chat visual restyle** — `ChatWidget.astro` markup + `global.css` `.chat-*` block flat-rectangle conversion + privacy note edit + `COPY` button.
  7. **Chat persistence** — `src/scripts/chat.ts` localStorage save/restore with TTL and DOMPurify replay.
  8. **JsonLd update** — Person schema imports CONTACT constants.
  9. **Verification gate** — pnpm build/lint/check/test, manual chat smoke test (open/send/SSE/copy), manual persistence test (send → navigate → reopen → see history), manual visual eyeball at 1440px / 768px / 375px against mockup.html.
  - Planner may merge/split waves, but the docs commit MUST be wave 1 and the verification gate MUST be the final wave. Pages may parallelize within wave 5 since they don't import each other.

### Verification gate

- **D-32: Phase 10 ships only when ALL pass:**
  1. `pnpm run build` succeeds with zero errors
  2. `pnpm run lint` clean
  3. `pnpm run check` (astro check) clean
  4. `pnpm run test` (vitest) all green
  5. **Manual chat smoke test** — open chat on at least one page, send a message, confirm SSE streams, focus trap works, copy button copies to clipboard, close cleanly
  6. **Manual chat persistence test** — send a message, navigate to a different page, re-open chat, confirm history replays. Hard-refresh after >24h confirms TTL clears.
  7. **Manual visual parity check** — homepage and project detail page eyeballed against mockup.html at 1440px (desktop) and 375px (mobile). This is sanity, not Lighthouse — Phase 11 owns the audit.

### Claude's Discretion

- The exact `year` value Jack writes for each project (planner surfaces the file list at the backfill task, Jack types the years)
- Whether the homepage hero `.display` wordmark renders as `JACK<br>CUTRARA·` (mockup) or `JACK CUTRARA·` on one line — depends on viewport math, planner picks
- Whether the homepage `§ 01 — WORK` SectionHeader title is `WORK` or `WORKS` (mockup uses `WORK`; nav link uses `works`)
- Whether the storage of about copy strings for D-27 is `src/data/about.ts`, an exported const at the top of `about.astro`, or inlined into both pages with a comment marker
- The exact MDX components map syntax (`<Content components={{ img: ArticleImage }} />` vs the slot-based approach) — Astro 6 supports both, planner picks
- The exact section header copy on `/contact` (whether it inherits the `§ 03 — CONTACT` shape or uses `§ — CONTACT` since /contact has no `§ 01` or `§ 02` to anchor against)
- The exact Shiki theme name (`github-light`, `min-light`, etc.) as long as it produces a minimal, light-background result that fits inside the editorial box treatment
- Whether the `READ MORE →` link in the about preview uses an `→` glyph or the `&#8594;` entity
- Whether the chat persistence storage is encrypted/obfuscated (it doesn't need to be — content is benign, XSS is handled at render time)
- Whether the typing dot keyframes use `transform: scale()`, `transform: translateY()`, or `opacity` for the bounce animation — all functional, planner picks
- Whether `ContactSection.astro` accepts a `header?: boolean` prop or uses two separate inner components for the with-header and without-header cases

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Contract (the source of truth)
- `design-system/MASTER.md` — Single source of truth for tokens, typography, layout, components, motion, accent usage, anti-patterns. **Phase 10 amends §6.1, §5.2, §5.8, and §9/§10 once at head of phase per D-30.**
  - §3.1 (Type roles) — `.display`, `.h1-section`, `.h2-project`, `.lead`, `.body`, `.label-mono`, `.meta-mono` — used in D-06, D-07, D-08, D-15, D-16
  - §4 (Layout) — `.container`, `.section` rhythm, hero grid, section header pattern
  - §5.1 (Header) — Active link computation already handled
  - §5.2 (Footer) — Phase 10 amends to drop X from mobile social row (D-30)
  - §5.4 (SectionHeader) — Used by every page section
  - §5.5 (WorkRow) — Composed by D-01, D-02, D-04
  - §5.8 (MobileMenu) — Phase 10 amends to drop X from social row (D-30)
  - §6 (Motion) — Phase 10 amends §6.1 to allow state-indicator animations (D-17, D-30)
  - §7 (Accent usage) — Defines where accent IS allowed; chat bubble is the named exception (D-15, D-30)
  - §8 (Anti-patterns) — 16 anti-patterns Phase 10 must not reintroduce
  - §9 (Chat Widget Token Map) — Phase 10 amends to document the round-bubble exception (D-15, D-30)

### Visual Contract (the pixel-accurate reference)
- `mockup.html` (repo root) — Hand-built HTML/CSS reference. Phase 10 transcribes its page-level layouts (which Phase 9 deferred). Survives Phase 10, deleted in Phase 11.
  - Lines 147–184 — Hero + status line + status dot (Phase 10 transcribes for `index.astro`)
  - Lines 188–203 — `.section`, `.section-header`, `.section-rule` (already global per Phase 9 D-13, Phase 10 consumes)
  - Lines 207–254 — `.work-row` and friends (already scoped inside `WorkRow.astro`, Phase 10 composes)
  - Lines 259–277 — `.about-body`, `.about-intro` (Phase 10 transcribes for `about.astro` and the homepage about preview per D-27)
  - Lines 282–309 — `.contact-*` (Phase 10 transcribes into `ContactSection.astro` per D-24)
  - Lines 313–326 — `.site-footer` (already scoped inside `Footer.astro`, Phase 10 amends content per D-29)
  - Lines 330–348 — Responsive breakpoints (already global per Phase 9 D-13)
  - Lines 445–448 — About copy (Phase 10 ships verbatim per D-26)
  - Lines 462–464 — Contact link row (Phase 10 references but drops X per D-25)

### Project Definition
- `.planning/PROJECT.md` — v1.1 milestone goal, key decisions; "Design process: all visual/UI/UX decisions routed through frontend-design skill" constraint still applies
- `.planning/REQUIREMENTS.md` — 12 of 13 user-facing requirements live here (HOME-01..04, ABOUT-01..02, WORK-01..03, CONTACT-01..02, CHAT-01..02). **Phase 10 amends CONTACT-01 (drop X) and CONTACT-02 (PDF wording) per D-25.**
- `.planning/ROADMAP.md` §"Phase 10: Page Port" — Goal, depends-on, 8 success criteria (SC#1 through SC#8)
- `.planning/STATE.md` — Phase 8/9 carry-over decisions: cross-page chat persistence regression (Phase 8 D-29 → D-22), chat motion restoration (Phase 8 D-27 → D-17), CONTACT-02 wording reconciliation (D-25), pnpm-not-npm, Tailwind v4 @source scoping, ESLint argsIgnorePattern, primitives auto-scoping conventions

### Phase 8 + Phase 9 Context (what Phase 10 inherits)
- `.planning/phases/08-foundation/08-CONTEXT.md` — Phase 8 D-01..D-30, especially:
  - D-03 (MASTER.md locked at Phase 8 sign-off; §6.1/§5.2/§5.8/§9 are sanctioned amendment paths via Phase 10 D-30)
  - D-19–D-21 (Chat token mapping — Phase 10 may now restyle and adjust within these tokens)
  - D-26 (Phase 8 verification gate shape — Phase 10 reuses)
  - D-27 (Chat motion restoration deferred to Phase 10 — D-17 honors)
  - D-29 (Cross-page chat persistence regression — D-22 closes)
- `.planning/phases/09-primitives/09-CONTEXT.md` — Phase 9 D-01..D-30, especially:
  - D-02 (`src/components/primitives/` import paths)
  - D-03 (No Tailwind utilities **inside primitive markup** — pages can use any markup they need)
  - D-04 (Primitive props fixed as MASTER §5 specifies — Phase 10 cannot modify props, only content/imports per D-29)
  - D-07 + D-10 (MobileMenu and Footer social rows — Phase 10 refactors content to import from `contact.ts` per D-29)
  - D-17 (Phase 9's MASTER amendment commit shape — Phase 10 mirrors per D-30)
  - D-22 (NextProject already restyled — Phase 10 just consumes per D-10)
  - D-26 (Phase 9 hands-off chat — Phase 10 OWNS chat now)
  - D-27 (Header active-link reads `Astro.url.pathname` — Phase 10 routes already covered)
  - D-29 (Phase 9 verification gate shape — Phase 10 extends with persistence test)
- `.planning/phases/09-primitives/09-VERIFICATION.md` (if exists) — Phase 9 ship record

### Files Phase 10 Touches (read before editing)
- `src/pages/index.astro` — REWRITE (currently inline-style placeholder)
- `src/pages/about.astro` — REWRITE (currently inline-style placeholder)
- `src/pages/projects.astro` — REWRITE (currently inline-style placeholder)
- `src/pages/contact.astro` — REWRITE (currently inline-style placeholder)
- `src/pages/projects/[id].astro` — REWRITE (currently inline-style placeholder; keep `getStaticPaths` shape)
- `src/content.config.ts` — ADD required `year` field per D-03
- `src/content/projects/clipify.mdx` — ADD `year` frontmatter (Jack supplies value)
- `src/content/projects/crypto-breakout-trader.mdx` — ADD `year` frontmatter (Jack supplies value)
- `src/content/projects/nfl-predict.mdx` — ADD `year` frontmatter (Jack supplies value)
- `src/content/projects/optimize-ai.mdx` — ADD `year` frontmatter (Jack supplies value)
- `src/content/projects/seatwatch.mdx` — ADD `year` frontmatter (Jack supplies value)
- `src/content/projects/solsniper.mdx` — ADD `year` frontmatter (Jack supplies value)
- `src/components/chat/ChatWidget.astro` — REWRITE chrome per D-15, D-16, D-18, D-20; update privacy note per D-22
- `src/scripts/chat.ts` — ADD localStorage persistence per D-22 (writes on send/receive, replays on open with TTL)
- `src/styles/global.css` — REWRITE the `.chat-*` block (~200 lines from line 229) per D-15, D-16, D-21; add typing-dot keyframes per D-17
- `src/components/primitives/MobileMenu.astro` — IMPORT `contact.ts`, drop X, render only non-null entries per D-29
- `src/components/primitives/Footer.astro` — IMPORT `contact.ts`, drop X, render only non-null entries per D-29
- `src/components/JsonLd.astro` — UPDATE Person schema to import CONTACT constants
- `src/components/NextProject.astro` — DO NOT TOUCH (Phase 9 D-22 already editorial; Phase 10 just consumes)
- `src/components/ArticleImage.astro` — DO NOT TOUCH (verified by Phase 9 D-25; Phase 10 wires it via MDX components map per D-12)
- `src/components/SkipToContent.astro` — DO NOT TOUCH (Phase 9 D-24)
- `src/components/primitives/{Header, Container, SectionHeader, WorkRow, MetaLabel, StatusDot}.astro` — DO NOT TOUCH (Phase 9 D-04; Phase 10 composes)
- `design-system/MASTER.md` — AMEND §6.1, §5.2, §5.8, §9/§10 per D-30 (head-of-phase docs commit, byte-locked otherwise)
- `.planning/REQUIREMENTS.md` — AMEND CONTACT-01 (drop X), CONTACT-02 (PDF wording) per D-25 (same docs commit as MASTER)

### Files Phase 10 Creates
- `src/components/ContactSection.astro` — Shared composite for homepage `§ 03` and `/contact` page (D-24)
- `src/data/contact.ts` — Contact constants single source of truth (D-23)

### Files Phase 10 Deletes
- `src/components/ContactChannel.astro` — Dead v1.0 SVG-icon component, zero imports (D-28)

### External Specs
- [MDX Components Map (Astro docs)](https://docs.astro.build/en/guides/integrations-guide/mdx/#components-prop) — for D-12 wiring
- [Astro 6 Shiki](https://docs.astro.build/en/guides/syntax-highlighting/) — for D-13 minimal theme choice
- [DOMPurify configuration (current)](src/scripts/chat.ts) — Phase 7 D-19 sanitizer config; D-22 replay path runs through this unchanged

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **All 8 Phase 9 primitives** in `src/components/primitives/` — Header, Footer, Container, SectionHeader, WorkRow, MetaLabel, StatusDot, MobileMenu — composed by every Phase 10 page. Props are fixed (Phase 9 D-04).
- **`NextProject.astro`** — already editorial-restyled in Phase 9 D-22, public API stable, just consume on `projects/[id].astro`
- **`ArticleImage.astro`** — already on the new tokens (Phase 9 D-25), just needs MDX components map wiring (D-12)
- **`SkipToContent.astro`** — verified Phase 9 D-24, no change
- **`JsonLd.astro`** — verified Phase 9 D-23, gets a content update to import `CONTACT` constants
- **`/dev/primitives` preview route** — survives Phase 10 (Phase 9 D-20), useful as a "canonical render vs. live use" comparison surface during page rewrites
- **`mockup.html`** — visual target for every page, transcribed by D-15…D-21 (chat) and D-23…D-28 (contact/about) and the homepage hero
- **6 real projects in `src/content/projects/*.mdx`** — every project has the same 5 `##` sections (Problem / Solution & Approach / Tech Stack Detail / Challenges & Lessons / Results) which makes the D-09 section-header transform universal
- **Phase 7 chat infrastructure (`src/scripts/chat.ts`, 743 lines)** — focus trap, SSE streaming, rate limiting, DOMPurify sanitization, auto-grow textarea, idempotency. All preserved by D-15..D-22, restyle is purely visual + persistence add.
- **`portfolio-context.json`** — has the real contact info (`jack@jackcutrara.com`, `github.com/jackc625`, `linkedin.com/in/jackcutrara`) but should NOT be the contact source; bot context is a different concern from site display (D-23). Used as the data source for D-23's `contact.ts` initial values.

### Established Patterns
- **Single-file `.astro` with inline `<style>` and `<script>`** — Phase 7/8/9 convention. Phase 10 page rewrites follow.
- **Editorial typography role classes** — `.display`, `.h1-section`, `.h2-project`, `.lead`, `.body`, `.label-mono`, `.meta-mono` — global per Phase 9 D-12, applied directly in page markup
- **`.container` and `.section`** — global structurals per Phase 9 D-13, used by every page section
- **`pnpm`, not `npm`** — Phase 8 carry-over, all gate commands use `pnpm`
- **Tailwind v4 `@source` scoping** in `src/styles/global.css` — Phase 8 carry-over, must not break
- **ESLint `argsIgnorePattern: ^_`** — Phase 8 carry-over for no-op stub parameters
- **Astro auto-scopes `<style>` blocks** — used by D-07 to override `.body h2` inside `projects/[id].astro` without leaking
- **Container queries on Header** — Phase 9 D-06 hamburger threshold, untouched by Phase 10
- **MASTER amendment via single docs commit at head of phase** — Phase 9 D-17 pattern, Phase 10 mirrors per D-30
- **REQUIREMENTS.md amendment via single docs commit at head of phase** — Phase 8 carry-overs flagged for Phase 10 reconciliation, batched per D-25
- **Phase 7 ChatWidget focus-trap pattern** — `aria-modal`, re-query focusable elements on every Tab keypress, Escape closes, focus return — must survive D-15..D-21 restyle untouched

### Integration Points
- **`BaseLayout.astro` ↔ pages** — Already wired with all Phase 9 primitives (Phase 9 D-11). Phase 10 pages just provide `<slot />` content; chrome inherits.
- **Pages ↔ content collection** — `getCollection('projects')` in each page; `getStaticPaths` in `projects/[id].astro` produces 6 static routes
- **`ContactSection.astro` ↔ `contact.ts`** — D-24 composite imports D-23 constants; null entries are filtered at render time
- **`MobileMenu.astro` + `Footer.astro` ↔ `contact.ts`** — D-29 refactors both primitives to import from the constants file
- **`projects/[id].astro` ↔ `ArticleImage.astro`** — D-12 wires via `<Content components={{ img: ArticleImage }} />`
- **`projects/[id].astro` ↔ `NextProject.astro`** — D-10 computes "next" by `order` ascending with wrap, passes the next entry's `project` prop
- **`ChatWidget.astro` ↔ `chat.ts`** — D-22 adds localStorage save/restore in `chat.ts` paired with the D-15..D-21 visual restyle in `ChatWidget.astro` and `global.css`
- **`global.css` `.chat-*` block ↔ chat panel markup** — D-15..D-21 rewrite ~200 lines starting at global.css line 229, must not collide with Phase 9 editorial classes (D-26 from Phase 9 noted this risk; planner greps for collisions)
- **`JsonLd.astro` ↔ `contact.ts`** — Person schema imports CONTACT constants for sameAs URLs and email
- **REQUIREMENTS.md ↔ MASTER.md** — Both amended in the same head-of-phase docs commit (D-25 + D-30) for atomicity
- **Header active-link state ↔ `/projects/[id]` routes** — Already covered by Phase 9 D-27 `Astro.url.pathname.startsWith('/projects')`

</code_context>

<specifics>
## Specific Ideas

- **The user explicitly chose `featured` as the homepage filter** (D-02), not "top N by order". This earns the schema's `featured` field its place — currently 3 of 6 projects are flagged. The flag is the editorial signal; recruiters see the headline 3 on the homepage scan, depth on `/projects`.
- **The user explicitly chose to add a `year` field rather than drop the year column** (D-03). This commits the project content collection to a richer shape and matches the mockup pixel-for-pixel rather than diverging from it. Jack supplies the values during the backfill task.
- **The user explicitly chose `.h1-section` for the project detail title** (D-06), not `.display`. The role-ramp commits to a clean hierarchy: `.display` is the homepage hero only, `.h1-section` is the case study, `.h2-project` is everywhere else. No collision, no temptation to grow the display surface.
- **The user explicitly chose to keep MDX h2 sections and style them as `§ NAME` mono labels** (D-07, D-09), not strip them. This keeps the case-study scannability without forcing a 6-file MDX rewrite. The `§ ` prefix injected via `::before` is editorial grammar that ties case studies to the rest of the site.
- **The user explicitly chose to wire `ArticleImage.astro` via the MDX components map even though no current MDX uses it** (D-12). This makes SC#4's "optional inline images" capability-real for future content passes without scope creep into producing screenshots now.
- **The user explicitly chose the round accent bubble as the only round surface in the editorial system** (D-15). This is a deliberate exception, documented via MASTER §9/§10 amendment (D-30) so it isn't an unmarked editorial violation. The bubble is a beacon — recruiters need to see "ask the bot" without scrolling.
- **The user explicitly chose to restore the typing dot bounce via a narrow MASTER amendment** (D-17, D-30), accepting the precedent that "state indicators may animate" is now a documented exception. Bubble pulse and panel scale-in stay dead — the carve-out is intentionally narrow.
- **The user explicitly chose `localStorage` with a 24h TTL and last-50 cap** (D-22) over sessionStorage or accepting the regression. The 24h window is the recruiter loop-back use case — "I saw something earlier today, let me re-open and ask".
- **The user explicitly chose to drop X from CONTACT-01** (D-25) rather than ship a stub link. This is an honesty principle — never link to a profile that doesn't exist. When Jack creates an X account, it's a one-line edit in `contact.ts` and all 4 surfaces update.
- **The user explicitly chose to ship the mockup about copy as v1.1 final** (D-26). The text already covers SC#2 (real engineer voice, ≤80 words/paragraph). Editing later in a content pass is fine; blocking Phase 10 on copywriting is not.
- **The user explicitly chose a single source of truth for contact info at `src/data/contact.ts`** (D-23) rather than coupling to `portfolio-context.json` or hard-coding. Type-safe, grep-friendly, one place to update — and decoupled from chatbot context (a different concern).
- **The user explicitly chose to delete `ContactChannel.astro` in Phase 10** (D-28), not Phase 11. Dead component with SVG icons that contradict CONTACT-01 — pairs naturally with the new `ContactSection.astro` creation.
- **The user explicitly chose a shared `ContactSection.astro` composite over inline duplication** (D-24). One visual truth across homepage `§ 03 — CONTACT` and `/contact`. Composite, not primitive (it's not in the Phase 9 lock).
- **The user explicitly chose to amend MASTER.md and REQUIREMENTS.md in a single head-of-phase docs commit** (D-25, D-30), mirroring the Phase 9 D-17 pattern. Three reconciliations land before any code is written.

</specifics>

<deferred>
## Deferred Ideas

- **`/dev/primitives` preview page deletion** — Phase 11 polish, deleted alongside `mockup.html` after homepage parity is signed off (Phase 9 D-20)
- **`mockup.html` deletion** — Phase 11 polish (carried from Phase 8 and Phase 9 deferred lists)
- **`CLAUDE.md` Technology Stack milestone-end update** — End of v1.1, drop GSAP + Inter/IBM Plex Mono references (carried from Phase 8)
- **Lighthouse / a11y / contrast / responsive QA** — Phase 11 (QUAL-01 through QUAL-06)
- **Real X/Twitter URL** — Whenever Jack creates an account; one-line edit in `src/data/contact.ts`
- **About copy edits / personalization** — Future content pass. v1.1 ships the mockup text per D-26
- **Project screenshots / inline images for `ArticleImage`** — Future content pass. Phase 10 wires the components map per D-12; sourcing screenshots is its own task
- **Chat widget UX experiments (typing speed indicator, message timestamps display, message-level reactions)** — Out of v1.1 scope; revisit in v1.2+
- **Real-time chat / WebSocket transport** — Listed in REQUIREMENTS.md "out of scope"; not Phase 10
- **Blog / writing section** — Listed in REQUIREMENTS.md "out of scope"
- **Testimonials section** — Listed in REQUIREMENTS.md "out of scope"
- **Production deploy / merge `feat/ui-redesign` to main** — Phase 11 sign-off task
- **Replacing the placeholder résumé PDF with the real one** — Future content pass; the link is wired and works regardless
- **Encrypting localStorage chat history** — Not needed; content is benign and XSS is handled at render
- **Server-side chat conversation storage** — Out of scope; D-22 is purely browser-local

</deferred>

---

*Phase: 10-page-port*
*Context gathered: 2026-04-08*
