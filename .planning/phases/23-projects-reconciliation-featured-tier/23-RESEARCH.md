# Phase 23: Projects Reconciliation & Featured Tier - Research

**Researched:** 2026-07-10
**Domain:** Astro 6 content collections, build-time content pipeline, editorial primitive extension, pinned-test maintenance
**Confidence:** HIGH (every claim verified against live code this session)

> This is a **verification-focused** research pass. `23-CONTEXT.md` (17 locked decisions) and `23-UI-SPEC.md` are already deeply detailed. My job was to confirm their technical claims against the current codebase, quote the exact code the plan will touch, and flag any discrepancy. Every finding below is `[VERIFIED: <file>:<line>]` against the working tree unless marked `[ASSUMED]`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01 … D-17 — verbatim intent)
- **D-01:** Display title = "Multi-Chain EVM Trader"; slug = `multi-chain-evm` → `src/content/projects/multi-chain-evm.mdx`; detail route `/projects/multi-chain-evm` handled by existing `[id].astro`.
- **D-02:** Claude drafts a 600–900 word case study; Jack reviews. First-person site voice, fenced 5-H2 shape (`## Problem` → `## Approach & Architecture` → `## Tradeoffs` → `## Outcome` → `## Learnings`).
- **D-03:** Outcome framed around honest live real-capital operation — **no P&L / returns claims**; lean on engineering rigor (8-stage safety pipeline, restart-safe exit state, pluggable per-chain MEV, volatility-adaptive exits, structural test invariants).
- **D-04:** Source handling = **prepend, do not rewrite**. Fence the new case study at the TOP of `Projects/7 - MULTI-DEX CRYPTO TRADER.md`; leave the ~400-line README verbatim below the fence as the Phase-25 chat extended reference.
- **D-05:** #7 frontmatter: `category: "other"`, no `githubUrl`/`demoUrl`, `featured: true`, `status: "completed"`, `order: 2`, `source: "Projects/7 - MULTI-DEX CRYPTO TRADER.md"`, `techStack` from README, `tagline` ≤80 chars, **no `chatSummary`**, `year` set during authoring.
- **D-06:** Tagline capability angle. Draft: "Automated multi-chain DEX sniping with volatility-adaptive exits" (≤80 chars, final drafted by Claude, reviewed by Jack).
- **D-07:** Asymmetric two-tier `/projects` layout — `Featured` group (3, richer) above `More work` group (4, compact). Structure fixed; pixels → frontend-design.
- **D-08:** Featured entries surface the `tagline` line (title · tagline · stack · year); rest stay compact (title · stack · year). Reused on Home (D-12/D-14).
- **D-09:** One `01 WORK` section; Featured / More-work split marked with light sub-labels / labeled divider, NOT renumbered sub-sections.
- **D-10:** Featured = SeatWatch · Multi-Chain EVM · NFL Prediction. **SolSniper flips `featured: false`** (kept accessible). Featured count stays exactly 3.
- **D-11:** `order`: seatwatch=1, multi-chain-evm=2, nfl-predict=3, solsniper=4, optimize-ai=5, clipify=6, daytrade=7.
- **D-12:** Single distinction = partition by `featured` boolean, sort within each tier by `order`. Both pages derive from the same `getCollection("projects")`. No schema change.
- **D-13:** Home keeps the 3-featured teaser (NOT featured-then-rest) + adds a "See all work →" link to `/projects`.
- **D-14:** Home featured rows use the same richer tagline treatment as `/projects`.
- **D-15:** #7 stays OUT of chat until Phase 25. Re-plumb `build-chat-context.mjs` to an explicit `multi-chain-evm` slug skip so the build passes and chat context stays at exactly 6 projects.
- **D-16:** Update the site-side pinned tests (7 files) to cover #7; **leave chat-side pins unchanged** (chat stays 6).
- **D-17:** No schema change; no new runtime deps; `astro check` stays 0/0/0; zero em dashes in #7 copy (author in the fenced SOURCE, not the synced `.mdx`); prefer page-scoped CSS; run D-26 chat battery only if a shared file is touched.

### Claude's / frontend-design's / planner's Discretion
- Visual execution (SC5, mandatory frontend-design): final layout of both tiers, Featured/More-work label copy + form, tier divider styling, richer featured-row form, spacing, type scale — decided by frontend-design against `design-system/MASTER.md`.
- Component shape: extend `WorkRow` with an optional `tagline` prop **vs.** a new `FeaturedRow` primitive — builder discretion (reuse-over-invention). Lives in `src/components/primitives/`, scoped `<style>`, no Tailwind.
- Content drafting: exact ≤80-char tagline, the 600–900w prose, `year`, and `techStack` for #7.
- "See all work →" link idiom — builder discretion (likely mirrors ABOUT `.read-more`).

### Deferred Ideas (OUT OF SCOPE)
- #7 into chat knowledge + third-person `chatSummary` → Phase 25 (CHAT-10/11). Phase 23 keeps chat at exactly 6 projects.
- Positioning-shift copy, Home Holloway teaser, JSON-LD → Phase 24.
- Rewriting the existing 6 case studies; deleting off-résumé projects; schema changes; new runtime deps; new design system.
- Per-project OG images; EXP-FUT-02 metrics viz.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROJ-01 | Multi-Chain EVM (#7) synced onto the site as a case study through the existing pipeline | Sync contract verified (§Priority 2); frontmatter field set verified (§Priority 3); D-15 build landmine verified + exact fix shape (§Priority 1); #7 source is currently unfenced (§Priority 2) |
| PROJ-02 | SeatWatch, Multi-Chain EVM, NFL Prediction render in a featured tier at top of listing(s) | Current featured/order diff verified (§Priority 5); two-tier render approach verified against `projects.astro`/`index.astro`; UI-SPEC contract read and not contradicted |
| PROJ-03 | Remaining 4 (SolSniper, Optimize-AI, Clipify, DayTrade) stay accessible below — nothing deleted | Partition keeps solsniper in the collection (featured=false, order=4); `EXPECTED_SLUGS`→7 keeps all present |
| PROJ-04 | Data model supports the featured/ordering distinction, applied consistently across Projects + Home | `featured` + `order` already in Zod schema (verified `content.config.ts:13,19`); single partition-then-sort pattern reused on both pages |
</phase_requirements>

## Summary

Phase 23 is a **reconciliation + editorial-extension** phase with zero new dependencies and zero schema changes. Every mechanism it needs already exists and was verified this session: the `featured` boolean and `order` int are already in the Zod schema; the `sync-projects.mjs` pipeline already reads `source:`, extracts a fenced block, and replaces the MDX body byte-preserving frontmatter; the `WorkRow` primitive is a clean 5-prop editorial row that extends trivially with an optional `tagline`; and both pages already do `getCollection("projects").sort(order)`, so partitioning by `featured` is a small, local change.

The one genuine landmine is **D-15**, and it is sharper than CONTEXT.md states: creating `multi-chain-evm.mdx` with `source: "Projects/7 - MULTI-DEX CRYPTO TRADER.md"` trips **two** independent hard-fails in `build-chat-context.mjs`, not one — the `/MULTI[- ]?DEX/i` guard at line 457 **and** the mandatory `chatSummary` requirement at line 389 (which #7 will not have per D-05). Because `build:chat-context` is the first link in the `pnpm build` chain (verified `package.json:13`), either failure breaks the entire build. The clean fix is a single-line explicit **slug skip at the top of the main loop** — this sidesteps both hard-fails and keeps chat context byte-identical at 6 projects.

The plan is otherwise a precise, well-bounded diff: author + fence the #7 source, hand-author `multi-chain-evm.mdx` frontmatter, run `pnpm sync:projects`, reassign `featured`/`order` across 6 files, rework two pages into the two-tier layout, extend one primitive, and update **7 site-side pinned test arrays** while leaving **the chat-side pins untouched**.

**Primary recommendation:** Sequence the work so the D-15 slug-skip lands in the SAME commit/wave as `multi-chain-evm.mdx` (or before it) — the build is red for every intermediate state where #7's MDX exists but the skip does not. Use the top-of-loop slug skip; keep the defensive MULTI-DEX regex as dormant defense-in-depth.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Project data + featured/order distinction | Content collection (build-time, `src/content/projects/*.mdx` + Zod schema) | — | Data model is git-tracked frontmatter validated at build time; no runtime store |
| Case-study body generation | Build-time sync script (`sync-projects.mjs`) | Source `.md` fence | Machine-synced body from hand-authored fenced source; MDX loader consumes at build |
| Chat-context exclusion of #7 | Build-time generator (`build-chat-context.mjs`) | Pinned tests | The slug skip is the exclusion mechanism; chat JSON is a committed build artifact |
| Two-tier listing render | Astro static page (`projects.astro`, `index.astro`) | `WorkRow` primitive | Partition + sort in page frontmatter; row visual owned by the primitive |
| Featured-row visual treatment | Primitive (`WorkRow.astro` scoped `<style>`) | frontend-design skill (SC5) | Scoped CSS per MASTER; pixels routed through frontend-design |

## Verification Findings (Research Priorities)

### Priority 1 — D-15 build landmine `[VERIFIED]`

**Confirmed exactly as described, plus a second hard-fail CONTEXT.md under-states.**

1. **The `/MULTI[- ]?DEX/i` guard exists and is exit-2.** `scripts/build-chat-context.mjs:457` `[VERIFIED]`:
   ```js
   // lines 455-461
   // Defensive regex — D-04 reinforcement. Even if a contributor adds
   // a multi-dex-trader.mdx with source: "Projects/7 ...", refuse.
   if (/MULTI[- ]?DEX|multi[- ]?dex/i.test(sourceRel)) {
     throw new Error(
       `${basename(mdxPath)}: Projects/7 excluded per D-04 — remove MDX or change source:`
     );
   }
   ```
   The throw is caught in the loop (`catch` at line 498 → `errorCount += 1`), and `if (errorCount > 0) process.exit(2)` at **line 504**. So it is a hard exit-2, confirmed.

2. **SECOND hard-fail — the mandatory `chatSummary`.** Even if the MULTI-DEX regex were removed, `buildProjectBlock` throws at **line 389** when `chatSummary` is absent (verified lines 386-393):
   ```js
   const chatSummary = readStringField(frontmatterBlock, "chatSummary");
   ...
   if (!chatSummary) {
     throw new Error(`${basename(mdxPath)}: missing chatSummary: frontmatter field — required for chat-voice-split (CHAT-06)...`);
   }
   ```
   Per D-05/D-13, #7 will NOT have `chatSummary` until Phase 25. **Therefore bypassing only the regex is insufficient** — #7 must be skipped *before* `buildProjectBlock` runs (line 476). This is the key subtlety: the fix cannot be "soften the regex"; it must be "skip the slug entirely."

3. **`build:chat-context` runs FIRST in the build chain.** `package.json:13` `[VERIFIED]`:
   ```
   "build": "pnpm build:chat-context && wrangler types && astro check && astro build"
   ```
   So a chat-context exit-2 aborts the whole build before `astro check`/`astro build`. Confirmed.

4. **Cleanest re-plumb (RECOMMENDED):** add a one-line slug skip at the **top of the main loop** (right after `for (const mdxPath of mdxFiles) {` at line 438), before both the regex (457) and `buildProjectBlock` (476):
   ```js
   for (const mdxPath of mdxFiles) {
     // Phase 23 / D-15 (CHAT-10 lifts this in Phase 25): Multi-Chain EVM (#7)
     // is synced to the SITE but stays OUT of chat until Phase 25. Skip its
     // slug so chat context stays at exactly 6 projects and #7 needs no
     // chatSummary yet. Runs before the chatSummary check AND the MULTI-DEX guard.
     if (basename(mdxPath, ".mdx") === "multi-chain-evm") continue;
     try {
   ```
   - Keep the defensive `/MULTI[- ]?DEX/i` regex as **dormant defense-in-depth** — it never fires now (the only MULTI-DEX source is `multi-chain-evm.mdx`, skipped first) but still guards against a future contributor mistake with a *different* slug.
   - `basename` is already imported (`scripts/build-chat-context.mjs:29`), so no new import.
   - **Post-condition (verifiable):** after this edit, `pnpm build:chat-context` re-emits `src/data/portfolio-context.json` **byte-identical** (still exactly the 6 existing projects, sorted by `page.localeCompare` at line 553). `build:chat-context:check` (exit-1 on drift) and `chat-context-integrity.test.ts` both stay green — they double as validation anchors for the skip.

5. **Stale header comment (optional hygiene).** Lines 6-16 state the source `allow-list` is the exclusion mechanism. Once #7 has an MDX, the allow-list no longer excludes it — the explicit slug skip does. Update the doc comment for accuracy (non-blocking).

### Priority 2 — Sync pipeline contract `[VERIFIED]`

`scripts/sync-projects.mjs` confirmed on every point:
- **Reads existing MDX `source:` field** — `readSourceField()` line 63; called in `syncOne` at line 151. Accepts quoted or unquoted single-line value.
- **Extracts the fenced case-study block** — `extractFence()` line 98, between `<!-- CASE-STUDY-START -->` (line 33) and `<!-- CASE-STUDY-END -->` (line 34).
- **Replaces ONLY the body, frontmatter byte-preserved** — line 182: `const newMdx = frontmatterBlock + "\n" + newBody + "\n";` (frontmatterBlock is sliced verbatim, `sliceFrontmatter` line 75).
- **Does NOT create MDX files** — `main()` globs existing `src/content/projects/*.mdx` (lines 202-204) and syncs each; a missing MDX is simply never visited. **So `multi-chain-evm.mdx` MUST be hand-created (with frontmatter) BEFORE running `pnpm sync:projects`.**
- **Required fence markers** — the exact two comment strings above; each must appear **exactly once** in the source file (`extractFence` lines 100-112 hard-fail on 0 or >1).
- **Missing fence = HARD FAIL (exit 2)** — `extractFence` throws → `errorCount++` → `process.exit(2)` (line 233). CONTEXT.md's "soft-warns / hard-fails on missing fence" resolves to: **missing fence markers hard-fail; H2 shape and word-count only soft-warn.**
- **5-H2 shape enforced as a SOFT WARN only** — `checkH2Shape()` line 133 writes a stderr warning but "never fails the run" (line 131 comment). Expected H2s (line 35-41): `Problem`, `Approach & Architecture`, `Tradeoffs`, `Outcome`, `Learnings` — exact order matters for the warning to stay silent. **Note:** the *test* `case-studies-shape.test.ts` DOES hard-assert this shape (see Priority 4), so the soft warn in sync + hard assert in tests together enforce it.
- **Word count 600–900 = SOFT WARN** — lines 42-43, 212-217.

**Reference structure `Projects/1 - SEATWATCH.md`** `[VERIFIED]` (grep):
```
# SeatWatch                         ← H1 title, ABOVE the fence
<!-- CASE-STUDY-START -->           (line 7)
## Problem ... ## Learnings         (lines 9-31, the 5-H2 case study)
<!-- CASE-STUDY-END -->             (line 33)
## Architecture (FULL TECHNICAL REFERENCE)   (line 35+, extended reference — chat only)
```
**#7 source current state** `[VERIFIED]`: `Projects/7 - MULTI-DEX CRYPTO TRADER.md` is currently **unfenced**, titled `# Crypto Snipe Bot` (line 1), ~400 lines, **untracked in git** (`??`). D-04 prepends `# Multi-Chain EVM Trader` + the fenced 5-H2 case study, leaving the existing `# Crypto Snipe Bot` README verbatim below `<!-- CASE-STUDY-END -->`. Because #7 is chat-skipped in Phase 23, the below-fence content is not consumed by any build step this phase (relevant only in Phase 25).

### Priority 3 — Frontmatter field set + Zod constraints `[VERIFIED]`

`src/content.config.ts:5-23` — `projects` schema (do NOT modify):

| Field | Zod constraint (line) | #7 value (D-05) |
|-------|----------------------|-----------------|
| `title` | `z.string()` (9) | "Multi-Chain EVM Trader" |
| `tagline` | `z.string().max(80)` (10) | ≤80-char capability line (D-06) |
| `description` | `z.string()` (11) | authored (recruiter/OG meta) |
| `techStack` | `z.array(z.string()).min(1)` (12) | from README stack (≥1) |
| `featured` | `z.boolean().default(false)` (13) | `true` |
| `status` | `z.enum(["completed","in-progress"])` (14) | `"completed"` |
| `githubUrl` | `z.url().optional()` (15) | **omit** (D-14 links) |
| `demoUrl` | `z.url().optional()` (16) | **omit** |
| `thumbnail` | `image().optional()` (17) | omit |
| `category` | `z.enum(["web-app","cli-tool","library","api","other"])` (18) | `"other"` |
| `order` | `z.number().int().min(1)` (19) | `2` |
| `year` | `z.string().regex(/^\d{4}$/)` (20) | e.g. `"2026"` (confirm) |
| `source` | `z.string()` (21) | `"Projects/7 - MULTI-DEX CRYPTO TRADER.md"` |

**`chatSummary` is NOT in the Zod schema** `[VERIFIED]` — it does not appear in the `projects` object (lines 9-21). It is consumed only by `build-chat-context.mjs` (`readStringField(frontmatterBlock, "chatSummary")`, line 386). So omitting it on #7 is Zod-valid; it is *required* by the chat builder — which is exactly why #7 must be **skipped** there (Priority 1). (Note: `experience` schema DOES declare `chatSummary: z.string().optional()` at line 40 — do not confuse the two collections.)

**Reference frontmatter shape** `[VERIFIED]` `src/content/projects/seatwatch.mdx:1-24`. Note `techStack` uses the multi-line flow-array form:
```yaml
techStack:
  [
    "TypeScript",
    "React",
    ...
  ]
```
`readArrayField` handles this form (build-chat-context lines 199-226) — but #7 is skipped so that path is moot this phase. Zod validates `techStack` fine in any YAML array form.

### Priority 4 — Every hard-coded 6-slug array (D-16) `[VERIFIED — exhaustive]`

**Site-side arrays that MUST gain `multi-chain-evm`** (add in alphabetical position — all current arrays are sorted `clipify, daytrade, nfl-predict, optimize-ai, seatwatch, solsniper`; `multi-chain-evm` sorts between `daytrade` and `nfl-predict`):

| File | Const name | Line | Also change |
|------|-----------|------|-------------|
| `tests/content/projects-collection.test.ts` | `EXPECTED_SLUGS` | 7 | Test title "exactly 6 MDX entries" → 7 (line 17); **"exactly 3 featured" stays 3** (lines 25-34 count `featured: true` across files — still 3 after solsniper flips false) |
| `tests/content/case-studies-have-content.test.ts` | `PROJECTS` | 5 | — |
| `tests/content/case-studies-shape.test.ts` | `PROJECTS` | 5 | (hard-asserts the 5-H2 shape via `EXPECTED_H2S` line 14) |
| `tests/content/case-studies-wordcount.test.ts` | `PROJECTS` | 5 | (`MIN_WORDS = 600`, so #7 must be ≥600w) |
| `tests/content/voice-banlist.test.ts` | `PROJECTS` | 5 | (#7 case study must avoid banned words: revolutionary, seamless, leverage, robust, …) |
| `tests/content/voice-em-dash.test.ts` | `PROJECTS` | 5 | (`MAX_EM_DASHES_PER_PARAGRAPH = 0` — the synced MDX body must be em-dash-free) |
| `tests/build/no-mdx-in-worker-bundle.test.ts` | `mdxStems` | 48 | (requires `dist/` from `pnpm build`) |

**Chat-side pins to LEAVE UNCHANGED (chat stays 6 until Phase 25):**
| File | What it pins | Why untouched |
|------|-------------|---------------|
| `tests/build/chat-context-integrity.test.ts` | `EXPECTED_SLUGS` (6, line 17) + `/MULTI[- ]?DEX/i` NOT-present assertions (lines 27-28) | Chat JSON still 6; these actively *verify the D-15 skip works* — keep green, do not extend |
| `tests/build/chat-knowledge-voice.test.ts` | "6 projects" + first-person leak self-test | Chat unchanged |
| `tests/fixtures/chat-eval-dataset.ts` | MULTI-DEX fabrication banlist (lines 41-42, 163) | Chat must still refuse #7 |
| `tests/api/prompt-injection.test.ts` | **(not in D-16's list — flagged here)** asserts the system prompt contains the `/MULTI[- ]?DEX/i` banlist reinforcement (line 172) and the 6-project set `["SeatWatch","NFL","SolSniper","Optimize AI","Clipify","Daytrade"]` (line 288) | Chat-side; #7 stays excluded from the persona prompt in Phase 23 — **leave unchanged** |

**Auto-covered, no edit needed** `[VERIFIED]`:
- `tests/content/source-files-exist.test.ts` iterates `readdir` dynamically (no hard-coded array) — auto-covers #7 once its MDX has a valid `source:` pointing to the (existing) `Projects/7 …` file.

### Priority 5 — Current featured/order values → precise diff `[VERIFIED]`

Grepped `src/content/projects/*.mdx`:

| File (title in frontmatter) | Current `featured` | Current `order` | Target `featured` | Target `order` | Change |
|------|:--:|:--:|:--:|:--:|--------|
| `seatwatch.mdx` ("SeatWatch") | true | 1 | true | 1 | **none** |
| `multi-chain-evm.mdx` (NEW, "Multi-Chain EVM Trader") | — | — | true | 2 | **create** |
| `nfl-predict.mdx` ("NFL Prediction System") | true | 2 | true | 3 | order 2→3 |
| `solsniper.mdx` ("SolSniper") | **true** | 3 | **false** | 4 | featured true→false, order 3→4 |
| `optimize-ai.mdx` ("Optimize AI") | false | 4 | false | 5 | order 4→5 |
| `clipify.mdx` ("Clipify") | false | 5 | false | 6 | order 5→6 |
| `daytrade.mdx` ("Daytrade") | false | 6 | false | 7 | order 6→7 |

Post-change: featured set = {seatwatch(1), multi-chain-evm(2), nfl-predict(3)} = exactly 3; `order` values are the contiguous set {1..7}, unique.

**⚠ Cosmetic title discrepancy (flag for planner — NOT a change to make):** the roadmap/UI-SPEC ascii mock uses "NFL Prediction", "Optimize-AI", "DayTrade", but the actual frontmatter titles are **"NFL Prediction System"**, **"Optimize AI"**, **"Daytrade"**. The rendered UI uses the frontmatter title verbatim. Rewriting titles is OUT of scope (reconciliation = featuring + ordering, not content edits). The plan must NOT "fix" these to match the mock.

**`projects.astro` current code** `[VERIFIED]` (flat list, sorted by order):
```js
// src/pages/projects.astro:9-11
const projects = (await getCollection("projects")).sort(
  (a, b) => a.data.order - b.data.order
);
```
Renders one `WorkRow` per project, `number={String(i + 1).padStart(2, "0")}` (line 26). Phase 23 splits into the D-07 two-tier layout — partition `projects` by `featured`, render Featured group then More-work group. Because post-reassignment `order` is contiguous 1-7 with featured=1,2,3, numbering by `String(p.data.order).padStart(2,"0")` yields the continuous 01→07 the UI-SPEC requires (§Interaction contract).

**`index.astro` current code** `[VERIFIED]`:
```js
// src/pages/index.astro:14-18
const allProjects = (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
// D-02: Homepage shows exactly 3 featured:true projects (SeatWatch, NFL Prediction, SolSniper)
const featured = allProjects.filter((p) => p.data.featured);
```
- **Stale comment at line 17 CONFIRMED** — says "(SeatWatch, NFL Prediction, SolSniper)"; must become "(SeatWatch, Multi-Chain EVM Trader, NFL Prediction)". Comment only.
- `filter((p) => p.data.featured)` already yields the featured partition — after reassignment it yields the new 3 automatically. No logic change needed for correctness; the additions are: richer row treatment (tagline) + the "See all work →" link.
- The `.read-more` idiom to mirror for "See all work →" is at `index.astro:81` (`<a class="label-mono read-more" href="/about">READ MORE &rarr;</a>`) with scoped styles at lines 106-107 (`color: var(--ink-muted)` → `:hover { color: var(--accent) }`).

### Priority 6 — WorkRow shape + reuse path `[VERIFIED]`

`src/components/primitives/WorkRow.astro` — props are exactly `{ number, title, stack, year, href }` (interface lines 20-26). Three-column grid `56px 1fr auto`, `padding: 28px 0`, scoped `<style>`, no Tailwind. Title `margin-bottom: 12px` to stack (line 63-65).

**RECOMMENDATION: extend `WorkRow` with an optional `tagline?: string` prop** (lower-risk than a new `FeaturedRow`, matches UI-SPEC's recommendation and D-12/D-14 "one row treatment everywhere"):
- Add `tagline?: string;` to the `Props` interface; destructure it.
- Render `{tagline && <p class="body work-tagline">{tagline}</p>}` between `.work-title` and `.work-stack`.
- Scoped style per UI-SPEC: `.work-tagline { color: var(--ink-muted); margin-bottom: 12px; }` and set `.work-title { margin-bottom: 8px }` **only when tagline present** (UI-SPEC §Featured-row form: title→tagline 8px, tagline→stack 12px). Simplest: keep `.work-title { margin-bottom: 12px }` for the no-tagline case and override to 8px via a modifier class or `:has()`; the frontend-design skill finalizes the exact selector.
- When `tagline` is absent the row is **byte-identical to today** (no visual regression on the 4 rest rows). This preserves the existing `work-arrow-motion.test.ts` / `motion-css-rules.test.ts` invariants.
- A sibling `FeaturedRow.astro` is an allowed alternative (discretion) but duplicates the hover/focus/reduced-motion CSS — higher maintenance, not recommended.

## Standard Stack

**No new dependencies (D-17 / QA-02).** Everything reuses the installed stack verified in `package.json`:

| Library | Version (installed) | Role in this phase |
|---------|--------------------|--------------------|
| astro | ^6.0.8 | Content collections, static pages, `[id].astro` dynamic route |
| @astrojs/mdx | ^5.0.2 | Renders synced MDX bodies |
| zod (astro/zod) | ^4.3.6 | `projects` schema — used as-is, not modified |
| @astrojs/sitemap | ^3.7.1 | Auto-discovers `/projects/multi-chain-evm` — no manual edit |
| vitest | ^4.1.0 | Pinned-test suite (D-16 updates) |
| node | >=22 | Runs `sync-projects.mjs`, `build-chat-context.mjs` |

**Installation:** none. Adding any package violates D-17/QA-02.

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.** No `npm install` / `pnpm add`. QA-02 forbids new runtime deps. (No SLOP/SUS surface.)

## Architecture Patterns

### Data flow (both pages)
```
src/content/projects/*.mdx (7 files, git-tracked frontmatter + synced body)
        │  getCollection("projects")
        ▼
  [ partition by p.data.featured ]
        ├── featured[]  → sort by order → 01,02,03  ──►  /projects Featured group  +  Home work-list (D-13)
        └── rest[]      → sort by order → 04..07     ──►  /projects More-work group only
        │
        ▼ (render)  WorkRow (tagline present on featured rows only — D-08)
```

### Build-time content pipeline (unchanged mechanism, one skip added)
```
Projects/7 …md  ──(fence)──►  sync-projects.mjs  ──►  multi-chain-evm.mdx body
                                                             │
  build:chat-context.mjs  ──(SKIP multi-chain-evm)──►  portfolio-context.json (stays 6)  ── chat API
```

### Recommended change surface (files)
```
src/content/projects/
├── multi-chain-evm.mdx     # NEW — hand-authored frontmatter, synced body
├── nfl-predict.mdx         # order 2→3
├── solsniper.mdx           # featured true→false, order 3→4
├── optimize-ai.mdx         # order 4→5
├── clipify.mdx             # order 5→6
└── daytrade.mdx            # order 6→7
Projects/7 - MULTI-DEX CRYPTO TRADER.md   # prepend fenced case study (D-04)
src/pages/projects.astro    # two-tier layout (D-07/08/09)
src/pages/index.astro       # richer featured rows + "See all work →" + stale comment (D-13/14)
src/components/primitives/WorkRow.astro   # optional tagline prop
scripts/build-chat-context.mjs            # slug skip (D-15)
tests/… (7 site-side files)               # D-16 array updates
```

### Anti-Patterns to Avoid
- **Softening only the MULTI-DEX regex** — insufficient; the `chatSummary` hard-fail (line 389) still breaks the build. Must skip the slug entirely.
- **Creating `multi-chain-evm.mdx` before/without the D-15 skip in the same wave** — every intermediate state where the MDX exists but the skip does not has a red build. Land them together.
- **Rewriting the #7 README or the 6 existing case studies** — OUT of scope; D-04 prepends only.
- **Authoring the #7 case study directly into the `.mdx`** — the sync script overwrites the MDX body from the fenced source; author in `Projects/7 …md` between the fence markers, then `pnpm sync:projects`.
- **Em dashes in the #7 case study** — `voice-em-dash.test.ts` (0 per paragraph) will fail; use en dashes / middots.
- **Adding a card/shadow/border-radius featured treatment** — MASTER §8 forbids; the tier is an editorial numbered list with a tagline line + light divider labels.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Extract case study from source | A new parser | `sync-projects.mjs` fence extraction | Handles fence-count validation, CRLF normalization, path-escape guard, idempotent diff-then-write |
| Exclude #7 from chat | A new filter file / allow-list edit | One-line slug `continue` in the existing loop | Sidesteps both hard-fails; keeps JSON byte-identical; verified by existing tests |
| Featured/order data model | A new schema field or JSON index | Existing `featured` boolean + `order` int | Already in `content.config.ts`; D-17 forbids schema change |
| Featured row visual | A new component library / card | Extend `WorkRow` with optional `tagline` | Reuse-over-invention; one primitive; preserves motion/focus tests |
| Sitemap entry for #7 | Manual sitemap edit | `@astrojs/sitemap` auto-discovery | Static route auto-included |

**Key insight:** Phase 23 adds no new machinery. Its risk is entirely in *sequencing* (the D-15 red-build window) and *exhaustiveness* (updating all 7 site-side test arrays while leaving the 4 chat-side pins alone).

## Runtime State Inventory

> This is a data-model reconciliation phase (adds a project, reassigns `featured`/`order`). No runtime datastore is involved, but build artifacts and a committed JSON are.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None external.** Project data lives in git-tracked MDX frontmatter; there is no DB/KV/vector store holding project slugs or order. | None |
| Live service config | **None.** Static site on Cloudflare Pages + a Worker for the chat API; no UI-stored or DB-stored project config. The Worker reads `portfolio-context.json` (a committed build artifact), not a live store. | None |
| OS-registered state | **None** — no scheduled tasks/services embed project slugs. | None |
| Secrets/env vars | **None** — no secret/env references a project slug or `order`. | None |
| Build artifacts | (1) `src/data/portfolio-context.json` — committed build artifact regenerated by `build:chat-context`; **after the D-15 skip it must re-emit byte-identical (still 6 projects)** — verify with `build:chat-context:check` (exit 0). (2) `src/content/projects/multi-chain-evm.mdx` **body** — generated by `sync:projects` from the fenced source (do not hand-edit the body). (3) `dist/` — `no-mdx-in-worker-bundle.test.ts` needs a fresh `pnpm build` with `multi-chain-evm` added to `mdxStems`. | Re-run `pnpm sync:projects`, `pnpm build:chat-context`, `pnpm build`; verify drift-check gates pass |

## Common Pitfalls

### Pitfall 1: Red-build window during authoring
**What goes wrong:** `multi-chain-evm.mdx` is committed before the D-15 slug skip → `pnpm build` exits 2 on `build:chat-context` (line 457 or 389).
**Why:** chat-context runs first in the build chain.
**Avoid:** land the slug skip in the same wave as (or before) the MDX; treat them as one atomic change. CI `build:chat-context:check` catches drift.
**Warning sign:** `ERROR multi-chain-evm.mdx: Projects/7 excluded per D-04` or `missing chatSummary` on stderr.

### Pitfall 2: Sync overwrites hand-authored MDX body
**What goes wrong:** author prose directly in `multi-chain-evm.mdx`; next `pnpm sync:projects` replaces it from the (empty/mismatched) fenced source.
**Why:** sync is source-of-truth from the fence, body is machine-generated.
**Avoid:** author the case study inside `Projects/7 …md` between `<!-- CASE-STUDY-START -->` / `<!-- CASE-STUDY-END -->`; only hand-author frontmatter in the MDX.
**Warning sign:** `sync:check` reports drift, or the MDX body doesn't match the source.

### Pitfall 3: Fence markers duplicated or missing
**What goes wrong:** the ~400-line README or a copy-paste introduces a second `CASE-STUDY-START/END`, or the fence is forgotten.
**Why:** `extractFence` hard-fails (exit 2) if either marker count ≠ 1.
**Avoid:** exactly one START and one END, START before END, wrapping only the 5-H2 case study.
**Warning sign:** `fence markers must each appear exactly once` on stderr.

### Pitfall 4: Missing a test array → false green or CI red
**What goes wrong:** update 6 of the 7 site-side arrays; the 7th (e.g. `no-mdx-in-worker-bundle` `mdxStems`) still lists 6 and either misses coverage or fails after build.
**Why:** each gate iterates its own hard-coded list.
**Avoid:** use the exhaustive table in Priority 4; grep `"solsniper"` across `tests/` to confirm all 7 site-side sites gained `multi-chain-evm`.
**Warning sign:** `case-studies-shape`/`wordcount` don't cover #7, or `projects-collection` "6 MDX entries" fails.

### Pitfall 5: Accidentally touching a chat-side pin
**What goes wrong:** adding `multi-chain-evm` to `chat-context-integrity.test.ts` `EXPECTED_SLUGS` or the eval banlist "to be consistent."
**Why:** chat stays 6 until Phase 25; those pins verify the exclusion.
**Avoid:** the "leave unchanged" table in Priority 4 is authoritative; if a chat-side test goes red, the D-15 skip is wrong, not the test.
**Warning sign:** `chat-context-integrity` expecting 7 slugs, or a MULTI-DEX-present assertion.

## Code Examples

### D-15 slug skip (recommended)
```js
// scripts/build-chat-context.mjs — top of the main() for-loop (after line 438)
for (const mdxPath of mdxFiles) {
  // Phase 23 / D-15: #7 synced to the site, excluded from chat until Phase 25 (CHAT-10).
  if (basename(mdxPath, ".mdx") === "multi-chain-evm") continue;
  try {
    // ...unchanged...
```

### WorkRow optional tagline (recommended)
```astro
---
// src/components/primitives/WorkRow.astro
interface Props { number: string; title: string; stack: string; year: string; href: string; tagline?: string; }
const { number, title, stack, year, href, tagline } = Astro.props;
---
<a class="work-row" href={href}>
  <span class="work-num meta-mono tabular">{number}</span>
  <div class="work-body">
    <h2 class="h2-project work-title">{title}</h2>
    {tagline && <p class="body work-tagline">{tagline}</p>}
    <div class="work-stack">{stack}</div>
  </div>
  <div class="work-meta">
    <span class="meta-mono tabular work-year">{year}</span>
    <span class="work-arrow" aria-hidden="true">→</span>
  </div>
</a>
<!-- scoped style adds: .work-tagline { color: var(--ink-muted); margin-bottom: 12px; }
     and (tagline present) .work-title { margin-bottom: 8px } — exact selector per frontend-design -->
```

### projects.astro two-tier partition (structure; frontend-design finalizes markup)
```js
// src/pages/projects.astro frontmatter
const all = (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
const featured = all.filter((p) => p.data.featured);   // 01,02,03
const rest = all.filter((p) => !p.data.featured);      // 04..07
// render: SectionHeader count `${all.length} / ${all.length}` → 7 / 7
// Featured group (WorkRow with tagline), then MORE WORK divider, then rest (WorkRow no tagline)
// number = String(p.data.order).padStart(2, "0")
```

## State of the Art

| Old (current) | New (Phase 23) | Impact |
|---------------|----------------|--------|
| 6 projects, 3 featured (SeatWatch/NFL/SolSniper) | 7 projects, 3 featured (SeatWatch/Multi-Chain EVM/NFL); SolSniper demoted | Featured set matches résumé framing |
| Flat `/projects` list sorted by order | Two-tier Featured / More-work | Richer 30-second scan payload |
| `WorkRow` 5 props | +optional `tagline` | One row primitive drives both tiers |
| `build-chat-context` hard-fails on any `Projects/7` MDX | Explicit `multi-chain-evm` slug skip | #7 on site, out of chat until Phase 25 |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `year: "2026"` for #7 (D-05 says "confirm with Jack") | Priority 3 | Wrong year in a 4-digit-validated field; cosmetic, caught in review |
| A2 | Draft tagline "Automated multi-chain DEX sniping with volatility-adaptive exits" (54 chars, ≤80) | Priority 3 / User Constraints | Final wording is Jack's call; length verified safe |
| A3 | The #7 case study will meet the 600-word floor (`MIN_WORDS = 600`) once authored | Priority 4 | If under 600, `case-studies-wordcount` fails — mitigated by D-02's 600–900 target |
| A4 | `techStack` derived from the README stack section satisfies `.min(1)` | Priority 3 | Trivially satisfied; content is Jack-reviewed |

**All structural/pipeline claims are `[VERIFIED]` against live code — the only assumptions are unauthored content values (year, tagline, prose), which D-02/D-05 explicitly route through Jack's review.**

## Open Questions

1. **Exact tier-divider selector for the 8px title→tagline override.** UI-SPEC specifies 8px (with tagline) vs 12px (without). Recommendation: a modifier or `:has(.work-tagline)` on `.work-body`; frontend-design finalizes. Not a blocker.
2. **Whether to also remove the now-dormant MULTI-DEX regex.** Recommendation: keep it (defense-in-depth); it never fires post-skip. Planner/reviewer discretion.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | sync + chat-context scripts | ✓ (engines `>=22`) | ≥22 | — |
| pnpm | `sync:projects`, `build`, `test` | ✓ (repo uses pnpm) | — | — |

No external services, tools, or network dependencies. Purely local content/code changes.

## Validation Architecture

> Nyquist validation ENABLED. This phase is unusually test-rich: the existing content-gate suite already encodes most success criteria as invariants; the D-16 updates *extend those gates to cover #7*. Little net-new test authoring is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 (`package.json:53`) |
| Config file | `vitest` config in repo (tests under `tests/`) |
| Quick run command | `pnpm exec vitest run tests/content` (content gates, sub-30s) |
| Full suite command | `pnpm test` (`vitest run`) |
| Type/schema gate | `pnpm exec astro check` (must stay 0/0/0 — D-17/QA-02) |
| Sync gate | `pnpm sync:check` (exit 0) |
| Chat-context gate | `pnpm build:chat-context:check` (exit 0 — proves JSON stayed at 6) |

### Phase Requirements → Test Map
| Req / SC | Behavior | Test Type | Automated Command / Invariant | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC1 / PROJ-01 | #7 synced as full case study through pipeline | integration | `pnpm sync:check` exit 0 + `case-studies-have-content/shape/wordcount` cover `multi-chain-evm` | ✅ (extend arrays — D-16) |
| SC1 | #7 frontmatter Zod-valid | schema | `pnpm exec astro check` → 0/0/0 | ✅ |
| SC1 | #7 source `source:` resolves | integration | `source-files-exist.test.ts` (dynamic) | ✅ (auto-covers) |
| SC2 / PROJ-02 | Exactly 3 featured (SeatWatch/Multi-Chain/NFL) | unit | `projects-collection.test.ts` "exactly 3 featured" stays green | ✅ (unchanged assertion) |
| SC2 | Featured rows carry a tagline, rest do not | build-output (property) | `/projects` HTML contains `work-tagline` exactly 3× | ❌ Wave 0 (optional) |
| SC3 / PROJ-03 | All 7 present incl. demoted SolSniper | unit | `projects-collection.test.ts` `EXPECTED_SLUGS` = 7 | ✅ (extend — D-16) |
| SC4 / PROJ-04 | Single distinction drives both pages; order contiguous 1-7, featured set exact | property | order values across 7 MDX == {1..7} unique; featured == {seatwatch, multi-chain-evm, nfl-predict} | ❌ Wave 0 (recommended) |
| SC5 | astro check 0/0/0; no new deps | build/dep | `astro check` + `package.json` dependencies unchanged | ✅ |
| SC5 / D-15 | Chat stays exactly 6; #7 excluded | build/integration | `chat-context-integrity.test.ts` (6 slugs, MULTI-DEX absent) + `build:chat-context:check` exit 0 | ✅ (unchanged — verifies skip) |
| SC5 / D-16 | #7 under shape/voice/em-dash/no-worker-MDX gates | unit/build | 7 site-side arrays include `multi-chain-evm` | ✅ (extend) |

### Directly assertable vs. held-out
- **Directly assertable (existing gates):** slug count (7), featured count (3), 5-H2 shape, ≥600 words, voice banlist, zero em dashes, no-MDX-in-worker, chat-still-6, astro-check 0/0/0, sync/chat-context drift. These are the backbone — Phase 23 mostly *extends the arrays* so #7 rides them.
- **Recommended net-new property test (Wave 0):** an ordering/partition invariant — assert across `src/content/projects/*.mdx` that `order` values are exactly `{1,2,3,4,5,6,7}` (contiguous, unique) and `featured: true` ⟺ slug ∈ {seatwatch, multi-chain-evm, nfl-predict}. This directly proves SC4 (the "single distinction") independent of page rendering.
- **Optional build-output check (Wave 0):** parse built `/projects` HTML — Featured group renders `work-tagline` exactly 3× and 7 rows total numbered 01–07. Proves SC2/SC4 rendering.
- **Manual / frontend-design (SC5):** visual tier distinctness, divider styling, type ladder — 6-pillar UI checker sign-off (UI-SPEC §Checker Sign-Off) + Jack's review of the tagline/prose. Not automatable.

### Sampling Rate
- **Per task commit:** `pnpm exec astro check` + `pnpm exec vitest run tests/content` (+ `tests/build/chat-context-integrity.test.ts` when the D-15 skip is touched).
- **Per wave merge:** `pnpm test` (full vitest) + `pnpm sync:check` + `pnpm build:chat-context:check`.
- **Phase gate:** `pnpm build` (runs `build:chat-context` → `astro check` → `astro build`; validates the D-15 skip end-to-end and produces `dist/` for `no-mdx-in-worker-bundle`) + full `pnpm test` green + UI checker sign-off.

### Wave 0 Gaps
- [ ] (recommended) `tests/content/projects-ordering.test.ts` — property test: `order` == {1..7} unique; featured membership exact. Covers SC4/PROJ-04.
- [ ] (optional) `tests/build/featured-tier-render.test.ts` — build-output: `work-tagline` ×3 on featured, 7 rows numbered 01–07. Covers SC2.
- [ ] Framework install: **none** — Vitest already present.

*If the optional tests are skipped, SC2/SC4 rely on the existing featured-count gate + manual UI sign-off, which is acceptable given the visual nature of SC2 and the small deterministic data set.*

## Security Domain

**No material change to the security surface.** No new input handling, auth, crypto, or network calls. The existing path-escape guards in both scripts (`sync-projects.mjs:163-170`, `build-chat-context.mjs:446-454) remain intact and are not modified. The #7 `source:` path is author-controlled and validated by the same guard. ASVS V5 (input validation) is satisfied by the existing Zod schema + fence-count validation; no other ASVS category is newly engaged by this phase. `[VERIFIED: no new attack surface]`

## Sources

### Primary (HIGH confidence — live code, this session)
- `scripts/build-chat-context.mjs` (lines 6-16, 386-393, 438-504, 553) — D-15 landmine, chatSummary hard-fail, skip site, sort
- `scripts/sync-projects.mjs` (lines 33-43, 63-119, 133-199, 202-235) — fence contract, hard/soft fail semantics
- `src/content.config.ts` (lines 5-23) — projects Zod schema
- `src/content/projects/seatwatch.mdx` (lines 1-24) — reference frontmatter
- `src/content/projects/{clipify,daytrade,nfl-predict,optimize-ai,seatwatch,solsniper}.mdx` — featured/order/title values (grep)
- `src/pages/projects.astro`, `src/pages/index.astro` — partition/sort + stale comment
- `src/components/primitives/WorkRow.astro` — prop shape + scoped style
- `package.json` (lines 13, 29-55) — build chain, no-new-dep baseline
- `tests/content/{projects-collection,case-studies-have-content,case-studies-shape,case-studies-wordcount,voice-banlist,voice-em-dash}.test.ts`, `tests/build/no-mdx-in-worker-bundle.test.ts` — site-side slug arrays + const names
- `tests/build/chat-context-integrity.test.ts`, `tests/build/chat-knowledge-voice.test.ts`, `tests/fixtures/chat-eval-dataset.ts`, `tests/api/prompt-injection.test.ts`, `tests/content/source-files-exist.test.ts` — chat-side pins / dynamic gate
- `Projects/7 - MULTI-DEX CRYPTO TRADER.md` (lines 1-60) — unfenced current state
- `Projects/1 - SEATWATCH.md` (grep) — reference fence structure
- `.planning/STATE.md` (Accumulated Context, lines 43-103) — sequencing + chat-surface invariants
- `.planning/phases/23-projects-reconciliation-featured-tier/23-CONTEXT.md`, `23-UI-SPEC.md` — locked decisions + UI contract

### Secondary / Tertiary
- None — no web research needed; the phase is entirely codebase-internal.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; installed versions read from `package.json`.
- D-15 build landmine + fix: HIGH — both hard-fail sites quoted from live code; fix shape verified against loop control flow.
- Sync/frontmatter/schema contract: HIGH — every field and fence rule quoted.
- Test-array enumeration: HIGH — grepped the full `tests/` tree; all const names read directly (exhaustive).
- featured/order diff: HIGH — grepped all 6 MDX files.
- Content values (year/tagline/prose): LOW by nature — deferred to Jack's review (see Assumptions Log); this is expected, not a research gap.

**Research date:** 2026-07-10
**Valid until:** ~2026-08-10 (stable; codebase-internal — invalidated only by edits to the named files before planning)
