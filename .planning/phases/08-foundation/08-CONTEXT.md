# Phase 8: Foundation - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 8 delivers two coupled outcomes:

1. **A written design contract** — `design-system/MASTER.md` is authored as task 1 and becomes the single source of truth for tokens, typography, layout, components, motion, accent usage, and anti-patterns. Phase 9-11 read it; Phase 9 builds primitives to its specs.
2. **A scorched-earth removal of every v1.0 visual assumption** that contradicts the editorial system: oklch tokens, dark mode (toggle, FOUC script, theme transitions, `[data-theme="light"]` block, `prefers-color-scheme` handling, `localStorage.theme`), motion (CanvasHero, GSAP, scroll-trigger animations, view transitions, `[data-animate]` machinery), 8 named dead components, and the standalone `/resume` route.

After Phase 8, the codebase is a stripped shell on the new hex token palette and Geist/Geist Mono fonts, with the chat widget still functioning as the regression gate. **No new components are built here** — that's Phase 9. **No pages are restyled here** — that's Phase 10. Existing pages survive as bare placeholder stubs.

Production stays frozen on the v1.0 build at jackcutrara.com throughout Phases 8-10. Work happens on `feat/ui-redesign`; merge to `main` only after Phase 10 (or Phase 11) achieves visual parity.

</domain>

<decisions>
## Implementation Decisions

### MASTER.md — the design contract (task 1)

- **D-01:** MASTER.md is **comprehensive** (~6-10 pages), not minimal. Sections required: token table (colors + spacing + type ramp), typography rules (weights, sizes, line-heights, letter-spacing per role), layout grid (container max-width, padding tiers, section rhythm), motion rules, accent usage rules, anti-patterns ("do not" list with rationale), worked examples for each section.
- **D-02:** MASTER.md location: **`design-system/MASTER.md` at repo root** — visible to anyone browsing the GitHub repo, alongside `src/` and `public/`. Sends a clear "this is a real design system" signal to recruiters who clone the repo. The roadmap and PROJECT.md both reference this exact path.
- **D-03:** MASTER.md is **locked at Phase 8 sign-off**. After Phase 8 ends, the file is read-only — Phases 9-11 quote and follow it but cannot revise it. If a primitive in Phase 9 surfaces a rule conflict, Phase 9 must file it as a deviation back to Phase 8 scope rather than silently editing the spec.
- **D-04:** MASTER.md **documents Phase 9 primitives up front** — ships with a `Components` section that names every Phase 9 primitive (Header, Footer, Container, SectionHeader, WorkRow, MetaLabel, StatusDot) and specifies their props, sizing, colors, hover/focus states, mobile behavior, and a tiny ASCII or HTML sketch. Phase 9 implements to spec. This is what makes "Phase 9 has no requirement mappings because it's a sequencing scaffold" workable.
- **D-05:** MASTER.md's motion section must explicitly document the **pragmatic motion line** (see D-13) so Phase 9 doesn't strip out the surviving Tailwind state transitions thinking they're leftover v1.0.
- **D-06:** MASTER.md must include the **chat widget token mapping table** (see D-19) as part of its `Components` section so Phase 10 inherits a clean restyle target.

### Token migration

- **D-07:** **Rebrand color token names** — replace `--token-bg-primary`, `--token-text-primary`, `--token-text-secondary`, `--token-text-muted`, `--token-accent`, `--token-accent-hover`, `--token-border`, `--token-border-hover`, `--token-destructive`, `--token-success`, `--token-warning` with the six mockup.html names: `--bg`, `--ink`, `--ink-muted`, `--ink-faint`, `--rule`, `--accent`. Every consumer (chat widget, Tailwind bridge, every component, every inline style) updates to the new names in this phase.
- **D-08:** **Flatten everything**, not just colors — also replace `--token-space-xs/sm/md/lg/xl/2xl/3xl/section` and `--token-text-sm/base/heading/display` with mockup.html values: `--container-max: 1200px`, `--pad-desktop: 48px`, `--pad-tablet: 32px`, `--pad-mobile: 24px`, plus the type ramp from `.display`/`.h1-section`/`.h2-project`/`.lead`/`.body`/`.label-mono`/`.meta-mono` baked into MASTER.md. No fluid `clamp()` tokens survive — mockup uses `clamp()` directly inside the type role classes, not via CSS variables.
- **D-09:** **Source of truth: `:root` in `src/styles/global.css` + Tailwind `@theme` bridge** — hex values declared once in `:root { --bg: #FAFAF7; ... }`, then mapped into Tailwind utilities via `@theme { --color-bg: var(--bg); }`. Components use either raw vars or Tailwind classes. Matches the v1.0 architecture so Phase 9 doesn't have to learn a new pattern.
- **D-10:** **Delete every vestige of dark mode** in this phase: the `[data-theme="light"]` override block in `global.css`, the `.theme-transitioning` rules and their `prefers-reduced-motion` overrides, the entire `<script is:inline>` in `BaseLayout.astro` that reads `localStorage.theme` and sets `data-theme`, the `astro:after-swap` listener that re-applies the theme. No explicit `localStorage.removeItem('theme')` shim is needed — stale localStorage values are read by no code after the cleanup, so they're harmless.

### Font swap

- **D-11:** **Geist + Geist Mono via Astro 6 Fonts API, Google provider** — same `fontProviders.google()` pattern as the v1.0 Inter/IBM Plex Mono setup. Geist is on Google Fonts, no reason to introduce a new provider. Astro 6's Fonts API self-hosts automatically.
- **D-12:** **CSS variable rename** — rebrand `--font-heading` / `--font-sans` / `--font-code` to `--font-display` / `--font-body` / `--font-mono` so the typography vocabulary matches mockup.html and the rest of the rebrand. Update every consumer (`global.css` `@theme` bridge, BaseLayout `<Font />` component cssVariable props, any inline `font-family` reference). Weights to load: Geist `400/500/600/700` (display, h1-section, h2-project, body, lead) and Geist Mono `400/500` (label-mono, meta-mono) — exactly what `mockup.html` uses.

### Motion kill scope

- **D-13:** **Pragmatic motion line** — Phase 8 kills GSAP, scroll-trigger animations, the canvas hero, view transitions (`<ClientRouter />`, `::view-transition-*` `@keyframes`), the `[data-animate]` opacity stub, and the `.theme-transitioning` rules. **Tailwind state transitions are allowed to survive**: `transition-colors`, `hover:bg-*`, `Footer.astro`'s `hover:-translate-y-0.5` icon hover, `Header.astro`'s nav-link transitions, the chat widget's `.chat-copy-btn` opacity transition, the `.nav-link-hover` underline animation. **Important caveat**: this is intentionally more lenient than mockup.html's strict monk-mode posture — MASTER.md's motion section (D-05) must document this explicitly so Phase 9 doesn't strip them out.
- **D-14:** Files to delete in this phase as part of motion kill: `src/scripts/animations.ts` (entire GSAP entry point), `src/components/CanvasHero.astro`. Files to edit: `src/styles/global.css` (remove `[data-animate]` block, `::view-transition-*` keyframes, `.theme-transitioning` block, `prefers-reduced-motion` overrides for theme transitions and animate stubs), `src/layouts/BaseLayout.astro` (remove `<ClientRouter />` import + usage, remove `astro:page-load` / `astro:before-preparation` listeners, remove the GSAP fallback `setTimeout`).

### Dead component + route deletion

- **D-15:** **Files to delete in this phase** (per success criterion #6 and #7): `src/components/CTAButton.astro`, `src/components/FeaturedProjectItem.astro`, `src/components/ProjectCard.astro`, `src/components/SkillGroup.astro`, `src/components/CanvasHero.astro`, `src/components/ResumeEntry.astro`, `src/components/CaseStudySection.astro`, `src/components/ThemeToggle.astro`, `src/scripts/animations.ts`, `src/pages/resume.astro`. Plus: `gsap` is removed from `package.json` dependencies (and any related types).
- **D-16:** **`MobileMenu.astro` is left fully wired and functional** — not in the deletion list, not unwired from BaseLayout. Phase 9 makes the keep/delete call on a blank slate. Mobile users keep working nav through the gap.
- **D-17:** **`Header.astro` keeps its v1.0 markup** but with `ThemeToggle` imports/usages removed (both desktop list and mobile slot) and `/resume` removed from `navLinks`. Phase 9 rewrites Header.astro entirely from blank. This minimum surgery keeps the site usable with minimum risk.
- **D-18:** **Page placeholder strategy** — `src/pages/index.astro`, `about.astro`, `projects.astro`, `contact.astro`, and `src/pages/projects/[id].astro` are each replaced with a bare ~10-line stub: `<BaseLayout>...<h1>Page name — redesigning</h1>...</BaseLayout>` plus a one-line "check back soon" note. They render against the new tokens but contain no v1.0 component imports. Phase 10 rewrites them entirely.

### Chat widget treatment (regression gate)

- **D-19:** **Chat is visually unchanged in Phase 8** (token-pinned). CHAT-02 (full restyle) remains in Phase 10 scope. But chat **code is refactored** to reference the new mockup token names so there's one naming system in the codebase. Token mapping for chat orphans (tokens that don't have a 1:1 mockup twin):
  - `--token-bg-primary` → `--bg`
  - `--token-bg-secondary` → `--rule` (the divider hex `#E4E4E7` is the closest "subtle surface tint" on the warm palette)
  - `--token-text-primary` → `--ink`
  - `--token-text-secondary` → `--ink-muted`
  - `--token-text-muted` → `--ink-faint`
  - `--token-accent` → `--accent`
  - `--token-accent-hover` → `--accent` (no separate hover variant; chat hover state uses the same accent)
  - `--token-border` → `--rule`
  - `--token-border-hover` → `--ink-muted` (stronger borders on hover)
  - `--token-success` → `--accent` (chat copy-success icon uses accent red, since "successfully copied" is signal-positive in this palette)
  - `--token-destructive` / `--token-warning` → not used by chat; deleted with the rest
- **D-20:** Files touched for chat refactor: `src/components/chat/ChatWidget.astro` (inline `style="background: var(--token-accent)"` on the floating bubble updates to `var(--accent)`), `src/styles/global.css` `.chat-*` rules (~100 lines, find-replace token names to mockup names).
- **D-21:** **Geist Mono rendering inside chat is verified in the Phase 8 build gate** — see D-26.

### Chat data file (`portfolio-context.json`)

- **D-22:** **Audit the whole `src/data/portfolio-context.json` file** (the chat widget's system-prompt context) and update every reference to v1.0 design that no longer applies. Known changes: `siteStack` array drops `"GSAP"`. Other fields to audit: any mention of canvas hero, dark theme, project card grid, theme toggle, scroll animations, IBM Plex Mono. The chat widget should tell visitors about the new editorial site, not the old one.

### Resume route + PDF

- **D-23:** **`src/pages/resume.astro` is deleted** (success criterion #7, CONTACT-03). The route 404s.
- **D-24:** **`public/resume.pdf` is renamed in place to `public/jack-cutrara-resume.pdf`** in this phase. Phase 10's CONTACT-02 will wire the `<a download>` link to a file that already exists and resolves. **Caveat to flag for Phase 10 / REQUIREMENTS reconciliation**: CONTACT-02's literal text says "placeholder PDF shipped initially, real PDF replaces it later" — the renamed file is the existing real résumé, not a placeholder. The "placeholder" language in REQUIREMENTS.md should be reconciled either by updating the requirement text or by Phase 10 acknowledging that CONTACT-02 was already partially satisfied in Phase 8.

### Execution ordering within the phase

- **D-25:** **Ordering**: (1) Write `design-system/MASTER.md` first — no code changes before the contract is captured. (2) Swap tokens (rebrand to mockup names + flatten spacing/typography) and swap fonts (Geist + Geist Mono in `astro.config.mjs`, rename CSS vars). (3) Kill motion (delete `animations.ts`, `CanvasHero.astro`, `ClientRouter`, view transitions, `[data-animate]` machinery) and dark mode (delete `[data-theme="light"]`, `.theme-transitioning`, BaseLayout FOUC script, `astro:after-swap` listener). (4) Delete dead components (the 8 named files), refactor chat to new token names, audit `portfolio-context.json`, replace pages with placeholder stubs, strip `ThemeToggle` + `/resume` from `Header.astro`. (5) Delete `src/pages/resume.astro` and rename `public/resume.pdf` → `public/jack-cutrara-resume.pdf`. (6) Run the Phase 8 verification gate (D-26). This ordering minimizes the window where the build is red because the new foundation (tokens, fonts) is in place before the old machinery (dark mode, motion, dead components) is removed.

### Verification gate

- **D-26:** **Phase 8 ships only when ALL FOUR pass**: (1) `npm run build` succeeds with zero errors, (2) `npm run lint` (eslint) clean, (3) `tsc --noEmit` (typecheck) clean, (4) **manual chat smoke test** — start `npm run dev`, open the floating chat bubble on at least one stub page, send a message that triggers the Anthropic API (e.g., "show me a TypeScript snippet"), confirm SSE streaming response renders with Geist Mono in any `<code>` blocks, confirm focus trap works on Tab, confirm the bubble closes cleanly. The chat smoke test is the regression fingerprint that proves Phase 8 didn't break Phase 7 — every Phase 7 carry-over decision in STATE.md hinges on chat surviving. Plus: `npm run test` (vitest) — Phase 7's `it.todo()` stubs still pass trivially, and any non-stub tests should remain green.

### Claude's Discretion

- Exact wording and formatting style of MASTER.md (the spec is what's locked, not the prose voice)
- Specific Tailwind v4 `@theme` syntax for the rebrand (Tailwind v4 supports both `--color-bg` and shorthand)
- Exact ASCII/HTML sketch fidelity for the Phase 9 primitive specs in MASTER.md
- The exact wording of stub-page placeholder text ("Redesigning", "Page coming soon", etc.)
- Whether to delete `gsap` from `package.json` via `npm uninstall gsap` or by hand-editing — same outcome
- Whether `prefers-reduced-motion` media queries are kept as no-op stubs in `global.css` (they cost nothing) or deleted entirely

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Core value, milestone v1.1 goal, key decisions table including the v1.1 roadmap decisions
- `.planning/REQUIREMENTS.md` — Phase 8 covers DSGN-01..05 + CONTACT-03; full traceability table
- `.planning/ROADMAP.md` §"Phase 8: Foundation" — Goal, depends-on, requirements, all 8 success criteria
- `.planning/STATE.md` — Phase 7 chat carry-over decisions (the regression-gate constraints)

### Visual Contract (the source of truth for tokens, typography, layout, motion)
- `mockup.html` (repo root) — The locked editorial system. Token table at lines 14-25, type ramp at lines 55-99, header CSS at 103-143, hero at 147-184, work row at 207-254, footer at 313-326, responsive at 330-348. **Phase 8 transcribes this into `design-system/MASTER.md` and into `src/styles/global.css`** — no decisions are re-made. (Preserved through Phase 10; deleted in Phase 11 polish per roadmap.)

### Phase 1 Context (the v1.0 foundation being torn down)
- `.planning/milestones/v1.0-phases/01-foundation-design-system/01-CONTEXT.md` — Captures D-01 through D-13 of v1.0 (dark editorial minimal, oklch tokens, 3-font system, GSAP rationale). Phase 8 is invalidating most of these; useful for understanding what's in the codebase and why.
- `.planning/milestones/v1.0-phases/05-dark-mode-animations-polish/05-CONTEXT.md` — The dark/light theme decisions Phase 8 is reversing. Useful for finding every theme-aware code path.

### Tech Stack
- `CLAUDE.md` §"Technology Stack" — Astro 6 + Tailwind v4 + GSAP context. Phase 8 removes GSAP from this story; the stack section may need a milestone-end update.

### Files Phase 8 Touches (read before editing)
- `src/styles/global.css` — Token definitions, `@theme` bridge, theme overrides, view transitions, `[data-animate]` stubs, all `.chat-*` styles
- `src/layouts/BaseLayout.astro` — FOUC inline script, ClientRouter, animations.ts listeners
- `src/components/Header.astro` — ThemeToggle imports, `/resume` nav link
- `src/components/chat/ChatWidget.astro` — inline `var(--token-accent)` style on the bubble
- `src/data/portfolio-context.json` — chat system-prompt context, currently lists GSAP
- `src/scripts/animations.ts` — entire GSAP entry point (deleted)
- `astro.config.mjs` — `fonts:` block (Inter + IBM Plex Mono → Geist + Geist Mono)
- `package.json` — `gsap` dependency (removed)
- `src/pages/resume.astro` (deleted), `src/pages/index.astro`, `about.astro`, `projects.astro`, `contact.astro`, `projects/[id].astro` (replaced with stubs)

### Files Phase 8 Creates
- `design-system/MASTER.md` — the comprehensive design contract (D-01 through D-06)
- `public/jack-cutrara-resume.pdf` — renamed from `public/resume.pdf` (D-24)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`mockup.html` at repo root** — full visual system already worked out (tokens, type ramp, header/footer/work-row/section CSS, responsive breakpoints). Source of truth for everything Phase 8 transcribes into `design-system/MASTER.md` and `src/styles/global.css`.
- **Astro 6 Fonts API `<Font />` component** — already wired in `BaseLayout.astro` for three font CSS variables. Phase 8 just changes the `name` and `cssVariable` props in `astro.config.mjs` and `BaseLayout.astro`.
- **Tailwind v4 `@theme` bridge pattern** — already established in `global.css`. Phase 8 keeps the architecture, only changes the token names and values it bridges.
- **`ChatWidget.astro` `transition:persist` pattern** — survives the demolition untouched. Phase 7's regression-gate behavior depends on this.

### Established Patterns
- **CSS-vars-then-Tailwind-bridge architecture** — `:root { --token-* }` → `@theme { --color-*: var(--token-*) }` → utility classes consume Tailwind. D-09 keeps this pattern with renamed tokens.
- **Single-file Astro components with inline `<style>` and `<script>`** — Phase 7 uses this; Phase 8 leaves it alone. MASTER.md should document it as the convention Phase 9 follows.
- **`prefers-reduced-motion` respect throughout** — already wired in `global.css`, `Footer.astro`, `animations.ts`. With motion mostly gone (D-13), the remaining state transitions still respect it.
- **`feat/ui-redesign` branch isolation** — current working branch; D-04 (production freeze) extends this to Phase 10.

### Integration Points
- **Chat widget ↔ tokens** — chat references tokens by name; the rebrand (D-07, D-19) is the tightest coupling in the phase. Test: chat smoke test in D-26.
- **Tailwind utilities ↔ `@theme` bridge** — every Tailwind color class in every file consumes the bridge. The rebrand cascades; the planner should grep for `bg-bg-primary`, `text-text-primary`, `text-text-muted`, `text-accent`, `border-border` and the like to find every usage.
- **`BaseLayout.astro` ↔ everything** — the layout is the only shared shell. Removing `<ClientRouter />` removes view transitions site-wide. Removing the FOUC inline script removes theme initialization site-wide. Removing the `astro:page-load` listener removes GSAP init site-wide.
- **`portfolio-context.json` ↔ chat system prompt** — the chat widget reads this file to tell visitors about the site. D-22 keeps this honest after the demolition.
- **Phase 8 ↔ Phase 9 (MASTER.md)** — Phase 9 reads `design-system/MASTER.md` and implements primitives to spec. D-04 makes this contract explicit; D-03 locks it.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly chose the **pragmatic motion line** (D-13) over mockup.html's strict monk-mode interpretation. This is a deliberate, surprising-on-its-own decision: it means Footer's icon hover translate, Tailwind `transition-colors`, and chat opacity transitions all survive into the new editorial system. **MASTER.md must document this explicitly** (D-05) so Phase 9 doesn't second-guess and strip them out.
- **The user explicitly chose to rename `public/resume.pdf` → `public/jack-cutrara-resume.pdf` in Phase 8** even though I noted that CONTACT-02's text says "placeholder PDF." This is a deliberate decision: there's no real placeholder, the existing résumé becomes the canonical file. Phase 10 inherits a partially-satisfied CONTACT-02. (D-24)
- **`design-system/MASTER.md` is intentionally placed at repo root as a portfolio asset**, not under `docs/` or `.planning/`. The rationale is that recruiters who clone the GitHub repo see "this person ships a real design system" alongside `src/` and `public/`. (D-02)
- **Comprehensive MASTER.md including up-front primitive specs** is what makes Phase 9's "no requirement mappings, sequencing scaffold" claim workable (PROJECT.md). Without spec-first discipline, Phase 9 ends up re-deciding component contracts and drifting from mockup.html. (D-04)
- **The chat widget `--token-success` mapping to `--accent`** (D-19) is a deliberate choice: in this palette, accent red (#E63946) is the "signal" color, and "successfully copied" is a signal-positive event. There is no separate green in the palette, and adding one would break the six-token rule. The alternative is to use `--ink` (black checkmark on neutral) — Claude's discretion at implementation time, both work; the planner can pick whichever reads better visually.

</specifics>

<deferred>
## Deferred Ideas

- **Chat widget visual restyle** — CHAT-02 in Phase 10. Phase 8 deliberately leaves chat looking "cosmetically off" (red bubble against warm off-white, shadows, gradients still present) to keep Phase 8 focused and minimize regression risk on the Phase 7 gate.
- **MobileMenu.astro keep-or-delete** — Phase 9 makes this call (per ROADMAP Phase 9 success criterion #4). Phase 8 leaves it untouched.
- **Header.astro full rewrite** — Phase 9 success criterion #1. Phase 8 only strips `ThemeToggle` + `/resume`.
- **Page rewrites (homepage display hero, work list, about, projects index, project detail, contact)** — Phase 10. Phase 8 only ships placeholder stubs.
- **`mockup.html` deletion** — Phase 11 polish, after homepage parity is signed off.
- **REQUIREMENTS.md reconciliation for CONTACT-02 "placeholder PDF" wording** — surface to user when Phase 10 plans CONTACT-02. Either update the requirement text to reflect that the real résumé was renamed in Phase 8, or have Phase 10 acknowledge CONTACT-02 was partially satisfied early.
- **`CLAUDE.md` §Technology Stack milestone-end update** — at end of v1.1, GSAP gets removed from the stack story and Geist replaces Inter/IBM Plex Mono. Track for milestone-complete cleanup.

</deferred>

---

*Phase: 08-foundation*
*Context gathered: 2026-04-07*
