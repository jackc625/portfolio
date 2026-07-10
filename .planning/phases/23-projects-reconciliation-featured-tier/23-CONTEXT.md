# Phase 23: Projects Reconciliation & Featured Tier - Context

**Gathered:** 2026-07-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Reconcile the résumé-aligned project set. Sync the Multi-Chain EVM / DEX trading bot (`Projects/7 - MULTI-DEX CRYPTO TRADER.md`, project #7) onto the site as a full case study through the existing `sync-projects.mjs` pipeline; introduce a visually distinct **featured tier** (SeatWatch · Multi-Chain EVM · NFL Prediction) driven by ONE data-model distinction (`featured` boolean + `order`, already in the schema) that produces the same featured-then-rest ordering on both `/projects` and the Home work list; keep the other four projects (SolSniper, Optimize-AI, Clipify, DayTrade) accessible below the featured tier — nothing deleted. All visual/layout work routed through the **frontend-design skill** against `design-system/MASTER.md`.

**In scope (PROJ-01, PROJ-02, PROJ-03, PROJ-04):**
- Author + fence a 600–900 word case study for #7 and sync it into a new `src/content/projects/multi-chain-evm.mdx` (hand-authored frontmatter + machine-synced body).
- A featured tier on `/projects` (labeled `Featured` / `More work`) with the three featured entries rendered richer than the four rest entries.
- Home work list: keep the 3-featured teaser + a "See all work →" link to `/projects`; Home featured rows share the `/projects` featured treatment.
- Reassign `featured`/`order` so featured = SeatWatch · Multi-Chain EVM · NFL Prediction (SolSniper demoted to the rest tier, kept accessible).
- Re-plumb `build-chat-context.mjs` so the build passes while #7 stays OUT of chat until Phase 25; update the pinned content/collection tests to cover the new 7th project.

**Explicitly NOT in scope (belongs to later phases / out of scope):**
- Ingesting #7 (or any experience content) into chat / `portfolio-context.json`, and #7's third-person `chatSummary` → **Phase 25** (CHAT-10/11). Phase 23 keeps chat at exactly 6 projects.
- Positioning-shift copy, Home Holloway teaser, JSON-LD → **Phase 24** (POS-*, HOME-01).
- Rewriting the existing 6 case studies (Out of Scope — reconciliation is featuring + ordering, not content rewrites).
- Deleting off-résumé projects (Out of Scope — SolSniper/Optimize-AI/Clipify/DayTrade stay).
- Schema changes (`featured`/`order` already exist), new runtime deps, new design system.

</domain>

<decisions>
## Implementation Decisions

### Project #7 sync & case study
- **D-01:** **Display title = "Multi-Chain EVM Trader"** (matches the roadmap's featured name + résumé framing; reads as serious systems work to a cold recruiter, over "Crypto Snipe Bot" / "Multi-Dex Crypto Trader"). **Slug = `multi-chain-evm`** → new file `src/content/projects/multi-chain-evm.mdx`, detail route `/projects/multi-chain-evm` (handled generically by the existing `src/pages/projects/[id].astro`).
- **D-02:** **Claude drafts the 600–900 word case study; Jack reviews before ship.** First-person site voice, in the fenced 5-H2 shape the pipeline requires (`## Problem` → `## Approach & Architecture` → `## Tradeoffs` → `## Outcome` → `## Learnings`), distilled from the README + D-03 framing. Same path as the other 6 case studies + Holloway.
- **D-03:** **Outcome framed around honest live real-capital operation** — the bot has run live with real funds. Reference live operation truthfully, **no P&L / returns claims** (site Out-of-Scope bans overclaiming). Outcome/Learnings lean on engineering rigor the README already documents: eight-stage safety pipeline, restart-safe persisted exit state, pluggable per-chain MEV transport, volatility-adaptive exits, structural test invariants (ethers-v6 negative test, 70% coverage floor).
- **D-04:** **Source-file handling — prepend, do not rewrite.** Add `<!-- CASE-STUDY-START -->` / `<!-- CASE-STUDY-END -->` around the new 600–900w case study at the **TOP** of `Projects/7 - MULTI-DEX CRYPTO TRADER.md`; leave the existing ~400-line README **verbatim below the fence** as the chat-only "extended reference" (which `build-chat-context.mjs` slices below the fence — surfaces in Phase 25). Mirrors the structure of all 6 existing sources (see `Projects/1 - SEATWATCH.md`: fence wraps the case study, `## Architecture (FULL TECHNICAL REFERENCE)` and below is the extended reference). Then run `pnpm sync:projects` to fill the MDX body.
- **D-05:** **#7 frontmatter:** `category: "other"` (mirrors the sibling trading bots SolSniper/DayTrade), **no `githubUrl`/`demoUrl`** (private live-capital bot — D-14 links decision), `featured: true`, `status: "completed"`, `order: 2` (D-10), `source: "Projects/7 - MULTI-DEX CRYPTO TRADER.md"`, `techStack` from the README's stack section, `tagline` ≤80 chars capability-angle (D-06). **No `chatSummary`** yet (chat deferred to Phase 25 — D-13). `year` set during authoring (draft; confirm with Jack).
- **D-06:** **Tagline — capability angle**, matching the sibling voice ("[capability] with [distinctive technique]", e.g. SolSniper's "Real-time Solana token sniping with multi-tier safety analysis"). Draft direction: "Automated multi-chain DEX sniping with volatility-adaptive exits" (final ≤80-char wording drafted by Claude, reviewed by Jack).

### Featured-tier visual structure (`/projects`) — frontend-design finalizes pixels (SC5)
- **D-07:** **Asymmetric two-tier layout.** `/projects` renders a **`Featured` group** (the 3 featured entries, rendered richer) above a **`More work` group** (the other 4 as today's compact WorkRows). Honest to the featured/rest split; gives the top tier more 30-second scan payload. Mirrors Phase 22's D-04 asymmetric two-tier. This decision fixes STRUCTURE — exact visual form is the frontend-design skill's call.
- **D-08:** **Featured entries surface the `tagline` line** in addition to title · stack · year; the four rest entries stay compact (title · stack · year). This is the one distinguishing content field between tiers. The same richer treatment is reused on Home (D-12).
- **D-09:** **Tier labeling — one `01 WORK` section, light tier labels.** `/projects` stays a single numbered `01 WORK` section (preserving the site's page-level numbering semantic — 01 WORK / 02 ABOUT / 03 CONTACT); the Featured / More-work split is marked with **light sub-labels or a labeled divider**, NOT renumbered sub-sections. Exact label copy + form → frontend-design.

### Data model & ordering (PROJ-04)
- **D-10:** **Featured membership** = SeatWatch, Multi-Chain EVM, NFL Prediction. **SolSniper flips `featured: false`** (demoted to the rest tier — kept accessible, not deleted). Featured count stays exactly **3** (SolSniper −1, #7 +1).
- **D-11:** **`order` values:** featured tier `seatwatch=1`, `multi-chain-evm=2`, `nfl-predict=3`; rest tier `solsniper=4`, `optimize-ai=5`, `clipify=6`, `daytrade=7`. (Featured display order SeatWatch → Multi-Chain EVM → NFL per roadmap; rest order per PROJ-03 listing.)
- **D-12:** **Single-distinction mechanism:** partition by the `featured` boolean into the two tiers, sort within each tier by `order`. Both `/projects` and Home derive from the same `getCollection("projects")` → featured-partition → order-sort — extends the existing `index.astro` `filter((p) => p.data.featured)` pattern. No schema change (both fields already in `src/content.config.ts`).

### Home work list
- **D-13:** **Home keeps the 3-featured teaser** (NOT featured-then-rest — preserves the punchy 30-second scan; `/projects` carries the full set) and **adds a "See all work →" link** to `/projects` at the end of the WORK list. `index.astro`'s WORK section currently has NO such link — this is a small new addition (idiom may follow the ABOUT section's existing "READ MORE →" pattern).
- **D-14:** **Home featured rows use the same richer tagline treatment** as the `/projects` featured tier — one row treatment everywhere (avoids two divergent row variants).

### Chat-context exclusion (build-time landmine — planner-owned)
- **D-15:** **#7 stays OUT of chat until Phase 25.** Creating `multi-chain-evm.mdx` with `source: "Projects/7 - MULTI-DEX CRYPTO TRADER.md"` trips `build-chat-context.mjs`'s defensive `/MULTI[- ]?DEX|multi[- ]?dex/i` guard (`scripts/build-chat-context.mjs:457`, **exit 2 hard-fail**) — and `build:chat-context` runs FIRST in `pnpm build` (`build` = `pnpm build:chat-context && wrangler types && astro check && astro build`), so this breaks the entire build. Phase 23 **re-plumbs that guard to an explicit skip of the `multi-chain-evm` slug** so the build passes and chat context stays at exactly 6 projects (no `chatSummary` needed on #7 yet). Phase 25 removes the skip, adds the third-person `chatSummary`, and lifts the exclusion for chat ingestion (CHAT-10). Keeps CHAT-06 voice split intact.

### Pinned-test updates (invariants that will break on the 7th project)
- **D-16:** Update `tests/content/projects-collection.test.ts`: `EXPECTED_SLUGS` 6→7 (add `multi-chain-evm`), "exactly 6 MDX entries" → 7; the "exactly 3 featured" assertion **stays 3**. Add `multi-chain-evm` to the hard-coded 6-slug arrays in `case-studies-have-content.test.ts`, `case-studies-shape.test.ts`, `case-studies-wordcount.test.ts`, `voice-banlist.test.ts`, `voice-em-dash.test.ts`, and `no-mdx-in-worker-bundle.test.ts` so #7 is covered by the shape / word-count / voice / em-dash / no-MDX-in-worker gates. **Do NOT touch** the chat-side pins (`chat-context-integrity.test.ts` "#7 NOT present", `chat-knowledge-voice.test.ts` "6 projects", `chat-eval-dataset` MULTI-DEX fabrication banlist) — chat stays 6 projects until Phase 25 (D-15).

### Guardrails (standing constraints, restated)
- **D-17:** No schema change; no new runtime deps; `pnpm exec astro check` stays 0/0/0. **Zero em dashes** in all #7 copy (site-wide ban — author in the fenced SOURCE, `Projects/7 …`, not the synced `.mdx`; use en dashes if needed). If tier styling touches `global.css`, run the D-26 chat-surface battery; prefer page-scoped CSS. Nav is untouched this phase, so the D-26/D-15 chat-surface risk is low unless a shared file is edited.

### Claude's / frontend-design's / planner's Discretion
- **Visual execution (SC5, mandatory frontend-design):** final layout of both tiers, the Featured/More-work label copy + form, tier divider styling, the richer featured-row form, spacing, and type scale — all decided by the frontend-design skill against `design-system/MASTER.md`. D-07/D-08/D-09 fix structure and content, not pixels.
- **Component shape:** whether featured rows reuse an extended `WorkRow` (add optional `tagline` prop) or a new `FeaturedRow` primitive — builder discretion within the reuse-over-invention pattern; the primitive lives in `src/components/primitives/` with scoped `<style>` (no Tailwind utilities) per MASTER conventions.
- **Content drafting:** the exact ≤80-char tagline (D-06), the 600–900w case-study prose (D-02), the `year` value, and the `techStack` list for #7 — drafted by Claude, reviewed by Jack.
- **"See all work →" link idiom** (D-13) — builder discretion (likely mirrors the ABOUT `.read-more` "READ MORE →" pattern).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & scope
- `.planning/ROADMAP.md` — Phase 23 goal + Success Criteria SC1–SC5; v1.4 sequencing (23 precedes the Phase 25 chat refresh that ingests #7).
- `.planning/REQUIREMENTS.md` — PROJ-01..04 (this phase); CHAT-10/CHAT-11 (Phase 25, chat ingestion of #7); the Out-of-Scope table (no deleting off-résumé projects, no rewriting existing case studies, no new design system, no new runtime deps).
- `.planning/STATE.md` §Accumulated Context — v1.4 roadmap notes: "Projects schema already supports featuring (PROJ-04)", "Chat #7 exclusion must be lifted (CHAT-10/PROJ-01)", voice-split (CHAT-06), D-26/D-15 chat-surface invariants.

### The content pipeline & data model (reuse over invention)
- `scripts/sync-projects.mjs` — the sync mechanism. **Reads existing MDX `source:` fields, extracts the fenced case-study block, replaces the MDX body only (frontmatter preserved byte-for-byte); it does NOT create MDX files.** So #7's `multi-chain-evm.mdx` (with hand-authored frontmatter) must be created BEFORE syncing. Requires fence markers + the 5-H2 shape (else soft-warns / hard-fails on missing fence).
- `src/content.config.ts` — the `projects` Zod schema. **Do not modify.** Fields for #7 frontmatter: `title`, `tagline` (max 80), `description`, `techStack` (min 1), `featured` (default false), `status`, `githubUrl?`, `demoUrl?`, `thumbnail?`, `category` enum, `order` (int min 1), `year` (4-digit), `source`. (`chatSummary` is consumed by `build-chat-context.mjs`, not the Zod schema — omit on #7 until Phase 25.)
- `Projects/7 - MULTI-DEX CRYPTO TRADER.md` — the #7 source (currently an un-fenced ~400-line README titled "Crypto Snipe Bot"). D-04 prepends the fenced case study; the README stays below the fence.
- `Projects/1 - SEATWATCH.md` — reference for the fence + extended-reference structure to mirror (fence around the 5-H2 case study, `## …(FULL TECHNICAL REFERENCE)` below).
- `src/content/projects/seatwatch.mdx` — reference frontmatter shape (full field set, incl. `chatSummary` that #7 omits this phase).

### The pages & primitives to change
- `src/pages/projects.astro` — the listing page. Currently a flat `WorkRow` list sorted by `order`; Phase 23 splits it into the D-07 two-tier layout.
- `src/pages/index.astro` — Home. Currently `filter((p) => p.data.featured)` → 3 rows; Phase 23 keeps 3 featured (D-13), adds the "See all work →" link, applies the richer featured treatment (D-14). Comment at line 17 ("SeatWatch, NFL Prediction, SolSniper") becomes stale — update to reflect the new featured set.
- `src/pages/projects/[id].astro` — the case-study detail route; handles `/projects/multi-chain-evm` generically (no change needed beyond #7 existing in the collection).
- `src/components/primitives/WorkRow.astro` — the row primitive (props `number/title/stack/year/href`); featured tier either extends this (optional `tagline`) or a sibling `FeaturedRow` is added (discretion).
- `src/components/primitives/SectionHeader.astro`, `Container.astro` — reused for the page shell / tier labels (D-09).

### Chat-context build (the landmine — D-15)
- `scripts/build-chat-context.mjs` §main (lines ~430–461) — the `/MULTI[- ]?DEX/i` hard-fail (line 457) to re-plumb into an explicit slug skip; the allow-list + duplicate-slug/source detection.
- `package.json` scripts — `build` = `pnpm build:chat-context && wrangler types && astro check && astro build` (chat-context runs first, so it gates the whole build).

### Tests to update (D-16)
- `tests/content/projects-collection.test.ts` (6→7 MDX, featured stays 3), `tests/content/case-studies-have-content.test.ts`, `case-studies-shape.test.ts`, `case-studies-wordcount.test.ts`, `voice-banlist.test.ts`, `voice-em-dash.test.ts`, `tests/build/no-mdx-in-worker-bundle.test.ts` — hard-coded 6-slug arrays that gain `multi-chain-evm`.
- Leave unchanged (chat stays 6 until P25): `tests/build/chat-context-integrity.test.ts`, `tests/build/chat-knowledge-voice.test.ts`, `tests/fixtures/chat-eval-dataset.ts`.

### Design contract & quality gates
- `design-system/MASTER.md` — the LOCKED editorial visual contract; SC5 routes ALL visual decisions here via the frontend-design skill (six-token palette, Geist fonts, type-role classes, restrained motion, focus-ring rule).
- The **frontend-design skill** (`frontend-design:frontend-design`) — MANDATORY per SC5 for the featured-tier composition, tier labels/divider, and richer featured-row form.
- `docs/CONTENT-SCHEMA.md` — projects pipeline + fence/word-count documentation (update only if a #7-specific note is warranted).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sync-projects.mjs`: the whole sync mechanism reused as-is — #7 rides it once its MDX exists and its source is fenced. No script change for sync (build-chat-context.mjs is a separate change, D-15).
- `WorkRow.astro`: the numbered editorial row; featured tier extends it (optional `tagline`) or a `FeaturedRow` sibling is added. Compact rest tier uses it unchanged.
- `src/pages/index.astro` featured filter + `src/pages/projects.astro` order sort: the existing partition/sort primitives — Phase 23 unifies them into "partition by featured, sort by order" (D-12).
- `.read-more` idiom in `index.astro` (ABOUT section "READ MORE →"): the pattern for the new Home "See all work →" link (D-13).

### Established Patterns
- **Create-MDX-then-sync:** the sync script never creates MDX; frontmatter is hand-authored, body is machine-synced from the fenced source. #7 follows this: create `multi-chain-evm.mdx` frontmatter → fence the source → `pnpm sync:projects`.
- **Fence + extended reference:** sources carry a fenced 600–900w case study (site body) plus below-fence extended reference (chat only). D-04 keeps the #7 README as that below-fence reference for Phase 25.
- **`featured` boolean already drives Home:** `index.astro` filters on it today; Phase 23 generalizes the same field to drive both tiers on both pages (the "single distinction").
- **Content gates iterate a hard-coded slug list:** shape / word-count / voice / em-dash tests enumerate the 6 slugs — adding #7 requires updating each array (D-16), which is also what pulls #7 under those quality gates.
- **`build:chat-context` gates `pnpm build`:** any MDX referencing `Projects/7` hard-fails the build until the D-15 re-plumb lands — this must ship in the same phase as the #7 MDX, not after.
- **Six-token editorial system, page-scoped CSS, no Tailwind in primitives** (MASTER.md): the tier treatment stays within the palette + numbered-section idiom; prefer page-scoped styles over `global.css`.

### Integration Points
- `src/content/projects/multi-chain-evm.mdx` (new) — hand-authored frontmatter + synced body.
- `Projects/7 - MULTI-DEX CRYPTO TRADER.md` — fenced case study prepended (D-04).
- `src/pages/projects.astro` — two-tier layout (D-07/D-08/D-09).
- `src/pages/index.astro` — featured teaser + "See all work →" link + richer rows (D-13/D-14); stale featured-comment update.
- `src/content/projects/solsniper.mdx` — `featured: true → false`, `order: 3 → 4` (D-10/D-11).
- `src/content/projects/nfl-predict.mdx` (`order 2→3`), `optimize-ai.mdx` (`4→5`), `clipify.mdx` (`5→6`), `daytrade.mdx` (`6→7`) — order reassignment (D-11).
- `scripts/build-chat-context.mjs` — explicit slug-skip re-plumb (D-15).
- `@astrojs/sitemap` auto-discovers `/projects/multi-chain-evm` — no manual sitemap edit.

</code_context>

<specifics>
## Specific Ideas

- **#7 title (user-specified):** "Multi-Chain EVM Trader" — chosen over "Crypto Snipe Bot" / "Multi-Dex Crypto Trader" for recruiter legibility.
- **#7 status (user-specified):** run **live with real capital** — case study frames live operation honestly, no P&L claims.
- **#7 links (user-specified):** none — private live-capital bot, `category: "other"` like SolSniper/DayTrade.
- **Featured order (user-specified):** SeatWatch → Multi-Chain EVM → NFL Prediction; SolSniper demoted to the rest tier but kept.
- **Home (user-specified):** stays the 3-featured 30-second teaser + a "See all work →" link; rows match the `/projects` featured (tagline) treatment.
- **Tier labels (user-specified intent):** one `01 WORK` section with light Featured / More-work labels, not renumbered sub-sections (final form → frontend-design).
- **Source handling (user-specified):** don't rewrite the 400-line README — prepend the fenced case study, keep the README below as the Phase-25 chat extended reference.

</specifics>

<deferred>
## Deferred Ideas

- **#7 into chat knowledge + third-person `chatSummary`** — Phase 25 (CHAT-10/11); Phase 23 keeps chat at 6 projects and only neutralizes the build hard-fail (D-15).
- **EXP-FUT-02 metrics/impact visualizations** — not this phase (unrelated surface).
- **Per-project OG images** (e.g. `/og/multi-chain-evm.png`) — belongs with the Phase 24 metadata pass / the standalone og-default todo, not here.

### Reviewed Todos (not folded)
Four pending todos keyword-matched Phase 23 (same UI/chat false-positives Phase 22 reviewed); all **not folded** — none touch project reconciliation:
- *"Change mobile menu breakpoint from 380px to 768px"* — orthogonal nav-behavior change; standalone `/gsd-quick`.
- *"Design and ship a real og-default.png"* — site-wide OG asset; Phase 24 metadata / standalone.
- *"Chat cache-hit-rate observability"* — chat instrumentation; v1.3+ deferred, Phase 25-adjacent.
- *"Configure CHAT_RATE_LIMITER Cloudflare binding"* — infra/security; unrelated to projects.

</deferred>

---

*Phase: 23-projects-reconciliation-featured-tier*
*Context gathered: 2026-07-09*
