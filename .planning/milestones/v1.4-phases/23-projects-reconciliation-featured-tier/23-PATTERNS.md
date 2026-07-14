# Phase 23: Projects Reconciliation & Featured Tier - Pattern Map

**Mapped:** 2026-07-10
**Files analyzed:** 15 (1 new, 14 modified)
**Analogs found:** 15 / 15 (every changed file has an in-repo analog — this is a reconciliation phase, no net-new machinery)

> All excerpts are quoted from the live tree this session. This is a read-only mapping pass; the planner copies these patterns into PLAN action steps. Pixels for the featured tier are owned by the frontend-design skill (SC5) against `design-system/MASTER.md` — the excerpts below fix STRUCTURE, not final styling.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/content/projects/multi-chain-evm.mdx` (NEW) | model (content entry) | build-time content | `src/content/projects/seatwatch.mdx` | exact (same collection) |
| `Projects/7 - MULTI-DEX CRYPTO TRADER.md` (MODIFY) | content source | file-I/O (fence source) | `Projects/1 - SEATWATCH.md` | exact (fence + extended-ref structure) |
| `src/pages/projects.astro` (MODIFY) | route/page | transform (partition+sort→render) | itself (current flat list) + `index.astro` filter | self / sibling |
| `src/pages/index.astro` (MODIFY) | route/page | transform (filter→render) | itself (current featured filter + `.read-more`) | self |
| `src/components/primitives/WorkRow.astro` (MODIFY) | component (primitive) | request-response (props→markup) | itself (5-prop editorial row) | self (extend) |
| `scripts/build-chat-context.mjs` (MODIFY) | utility (build script) | batch/transform | itself (top-of-loop guards) | self (add skip) |
| `src/content/projects/solsniper.mdx` (MODIFY) | model (frontmatter) | build-time content | sibling MDX frontmatter | exact |
| `src/content/projects/nfl-predict.mdx` (MODIFY) | model (frontmatter) | build-time content | sibling MDX frontmatter | exact |
| `src/content/projects/optimize-ai.mdx` (MODIFY) | model (frontmatter) | build-time content | sibling MDX frontmatter | exact |
| `src/content/projects/clipify.mdx` (MODIFY) | model (frontmatter) | build-time content | sibling MDX frontmatter | exact |
| `src/content/projects/daytrade.mdx` (MODIFY) | model (frontmatter) | build-time content | sibling MDX frontmatter | exact |
| `tests/content/projects-collection.test.ts` (MODIFY) | test | assertion | itself (`EXPECTED_SLUGS`) | self |
| `tests/content/case-studies-{have-content,shape,wordcount}.test.ts` (MODIFY) | test | assertion | `projects-collection.test.ts` array idiom | sibling |
| `tests/content/voice-{banlist,em-dash}.test.ts` (MODIFY) | test | assertion | `projects-collection.test.ts` array idiom | sibling |
| `tests/build/no-mdx-in-worker-bundle.test.ts` (MODIFY) | test | assertion | `projects-collection.test.ts` array idiom | sibling |

## Pattern Assignments

### `src/content/projects/multi-chain-evm.mdx` (NEW — model, build-time content)

**Analog:** `src/content/projects/seatwatch.mdx` (lines 1-24)

**Frontmatter pattern to copy** — hand-author ONLY the frontmatter; the body below is machine-synced by `pnpm sync:projects`. SeatWatch's full field set (`seatwatch.mdx:1-24`):

```yaml
---
title: "SeatWatch"
tagline: "Automated restaurant reservations with dual-strategy booking"
description: "A multi-service SaaS platform that monitors restaurant availability..."
chatSummary: "Jack designed SeatWatch as a Turborepo monorepo..."   # <-- #7 OMITS this (D-05/D-15)
techStack:
  [
    "TypeScript",
    "React",
    ...
  ]
featured: true
status: "completed"
category: "web-app"                # <-- #7 uses "other" (D-05)
order: 1                           # <-- #7 uses 2 (D-11)
year: "2025"                       # <-- #7 authoring-set (A1: "2026")
demoUrl: "https://seat.watch"      # <-- #7 OMITS githubUrl/demoUrl (D-05/D-14)
source: "Projects/1 - SEATWATCH.md" # <-- #7: "Projects/7 - MULTI-DEX CRYPTO TRADER.md"
---
```

**#7-specific deltas from the SeatWatch analog (D-05):**
- `title: "Multi-Chain EVM Trader"`, slug from filename = `multi-chain-evm`
- `tagline`: ≤80-char capability line (draft: "Automated multi-chain DEX sniping with volatility-adaptive exits" — 54 chars)
- `category: "other"` (mirrors sibling bots solsniper/daytrade), `featured: true`, `status: "completed"`, `order: 2`
- **OMIT** `chatSummary` (not in Zod schema; consumed only by `build-chat-context.mjs` — the D-15 skip means it is never read this phase)
- **OMIT** `githubUrl`/`demoUrl` (private live-capital bot)
- `source: "Projects/7 - MULTI-DEX CRYPTO TRADER.md"`
- `techStack`: min 1 string, from the README stack section

**Sequencing constraint:** the MDX file must be created (frontmatter only) BEFORE `pnpm sync:projects` runs — the sync script never creates files, it only globs and rewrites bodies of existing MDX. See Shared Pattern "Create-MDX-then-sync".

**Body shape (synced, do NOT hand-edit):** 5-H2 case study — `## Problem` → `## Approach & Architecture` → `## Tradeoffs` → `## Outcome` → `## Learnings`, 600-900 words, zero em dashes. Authored in the SOURCE fence, not here (see next file).

---

### `Projects/7 - MULTI-DEX CRYPTO TRADER.md` (MODIFY — content source, file-I/O)

**Analog:** `Projects/1 - SEATWATCH.md`

**Structure to mirror** (D-04 — prepend, do not rewrite the ~400-line README):

```
# Multi-Chain EVM Trader            ← H1 display title (ABOVE the fence)
<!-- CASE-STUDY-START -->
## Problem
## Approach & Architecture
## Tradeoffs
## Outcome
## Learnings                         ← the 600-900w, 5-H2, em-dash-free case study
<!-- CASE-STUDY-END -->
# Crypto Snipe Bot                   ← existing ~400-line README stays VERBATIM below
... (extended reference — chat-only, surfaces Phase 25) ...
```

SeatWatch analog: fence wraps the 5-H2 case study; `## Architecture (FULL TECHNICAL REFERENCE)` and below is the below-fence extended reference. `Projects/7` is currently unfenced (titled `# Crypto Snipe Bot`, ~400 lines, untracked `??`).

**Fence contract (hard rules from `sync-projects.mjs`):** each marker string appears EXACTLY once; START before END; missing/duplicate markers = hard-fail exit 2. H2 shape + word count are soft-warns in sync but HARD-asserted by tests. Zero em dashes (author here, use en dashes if needed — the site-wide ban applies to the SOURCE since the MDX body is synced from it).

---

### `src/pages/projects.astro` (MODIFY — route, partition+sort transform)

**Analog:** itself (current flat list) + `index.astro`'s featured filter.

**Current code** (`projects.astro:8-11`, flat list sorted by order):
```js
// IDENTICAL sort as index.astro -- deterministic order across pages
const projects = (await getCollection("projects")).sort(
  (a, b) => a.data.order - b.data.order
);
```

**Current render loop** (`projects.astro:20-33`) — note numbering is `String(i + 1)` today; post-reassignment prefer `String(p.data.order).padStart(2,"0")` to keep continuous 01→07 across the two tiers:
```jsx
<SectionHeader number="01" title="WORK" id="section-work"
  count={`${projects.length} / ${projects.length}`} />
<div class="work-list">
  {projects.map((p, i) => (
    <WorkRow
      number={String(i + 1).padStart(2, "0")}
      title={p.data.title}
      stack={p.data.techStack.join(" · ").toUpperCase()}
      year={p.data.year}
      href={`/projects/${p.id}`}
    />
  ))}
</div>
```

**Target partition pattern (D-07/D-08/D-09 — structure; frontend-design finalizes markup):**
```js
const all = (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
const featured = all.filter((p) => p.data.featured);   // 01,02,03 — richer, WITH tagline
const rest = all.filter((p) => !p.data.featured);      // 04..07 — compact, no tagline
```
- Keep ONE `01 WORK` `SectionHeader`; `count` becomes `${all.length} / ${all.length}` → `7 / 7`.
- Render Featured group (WorkRow with `tagline`) then a light "More work" divider/sub-label then rest group (WorkRow without `tagline`).
- Number by `String(p.data.order).padStart(2, "0")` so the two tiers read 01-07 continuously.
- Stack join idiom (` · ` middot, `.toUpperCase()`) is unchanged — reuse verbatim.

---

### `src/pages/index.astro` (MODIFY — route, filter transform)

**Analog:** itself.

**Current featured filter** (`index.astro:14-18`) — already yields the correct 3 after the featured reassignment; no logic change needed, but the comment is STALE:
```js
const allProjects = (await getCollection("projects")).sort(
  (a, b) => a.data.order - b.data.order
);
// D-02: Homepage shows exactly 3 featured:true projects (SeatWatch, NFL Prediction, SolSniper)
const featured = allProjects.filter((p) => p.data.featured);
```
- **Update the line-17 comment** to "(SeatWatch, Multi-Chain EVM Trader, NFL Prediction)".
- WORK section render (`index.astro:62-70`) mirrors `projects.astro` — add `tagline={p.data.tagline}` to give Home featured rows the same richer treatment (D-14).

**"See all work →" link idiom** — mirror the ABOUT `.read-more` pattern (D-13). Current markup (`index.astro:81`) and scoped style (`index.astro:106-107`):
```jsx
<a class="label-mono read-more" href="/about">READ MORE &rarr;</a>
```
```css
.read-more { display: inline-block; margin-top: 24px; color: var(--ink-muted); text-decoration: none; }
.read-more:hover { color: var(--accent); }
```
Copy this idiom for a `See all work &rarr;` link (href `/projects`) at the end of the WORK `.work-list`. The WORK section currently has NO such link — this is the one small new addition.

---

### `src/components/primitives/WorkRow.astro` (MODIFY — primitive, props→markup)

**Analog:** itself (extend, do not fork). Reuse-over-invention beats a sibling `FeaturedRow` (which would duplicate the hover/focus/reduced-motion CSS).

**Current prop shape** (`WorkRow.astro:20-28`):
```ts
interface Props {
  number: string;
  title: string;
  stack: string;
  year: string;
  href: string;
}
const { number, title, stack, year, href } = Astro.props;
```

**Current markup** (`WorkRow.astro:31-41`) — insert the tagline between `.work-title` and `.work-stack`:
```jsx
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
```

**Extension pattern:** add `tagline?: string;` to `Props`, destructure it, render `{tagline && <p class="body work-tagline">{tagline}</p>}` between `.work-title` and `.work-stack`. When `tagline` is absent the row is byte-identical to today (preserves the 4 rest rows + `work-arrow-motion.test.ts`/`motion-css-rules.test.ts` invariants).

**Scoped-style constraint (MASTER §5.5):** scoped `<style>` only, NO Tailwind utilities. Current `.work-title { margin-bottom: 12px }` (line 62-65). Add `.work-tagline { color: var(--ink-muted); margin-bottom: 12px; }` and (tagline-present only) `.work-title { margin-bottom: 8px }` via a modifier or `:has(.work-tagline)` — exact selector is the frontend-design skill's call. Stay inside the six-token palette; no card/shadow/border-radius (MASTER §8 forbids).

---

### `scripts/build-chat-context.mjs` (MODIFY — build utility, D-15 landmine)

**Analog:** itself (top-of-loop guards).

**Two hard-fails #7 would trip** (both must be sidestepped — softening only the regex is INSUFFICIENT):
1. `chatSummary` mandatory check — `buildProjectBlock` throws at **line 389** when `chatSummary` absent (#7 has none per D-05).
2. Defensive MULTI-DEX guard — **line 457**, exit 2:
```js
if (/MULTI[- ]?DEX|multi[- ]?dex/i.test(sourceRel)) {
  throw new Error(`${basename(mdxPath)}: Projects/7 excluded per D-04 — remove MDX or change source:`);
}
```
Both caught → `errorCount += 1` → `process.exit(2)` at line 504. `build:chat-context` runs FIRST in the `pnpm build` chain (`package.json:13`), so either failure breaks the entire build.

**Fix pattern (recommended):** a one-line slug `continue` at the TOP of the main loop (after `for (const mdxPath of mdxFiles) {` ~line 438), BEFORE both the `chatSummary` check (476) and the regex (457):
```js
for (const mdxPath of mdxFiles) {
  // Phase 23 / D-15 (CHAT-10 lifts this in Phase 25): Multi-Chain EVM (#7) is synced
  // to the SITE but stays OUT of chat until Phase 25. Skip its slug so chat context
  // stays at exactly 6 projects and #7 needs no chatSummary yet.
  if (basename(mdxPath, ".mdx") === "multi-chain-evm") continue;
  try {
    // ...unchanged...
```
- `basename` is already imported (line 29) — no new import.
- Keep the MULTI-DEX regex as dormant defense-in-depth (guards a different future slug).
- **Post-condition:** `pnpm build:chat-context` re-emits `src/data/portfolio-context.json` byte-identical (still 6 projects). `build:chat-context:check` and `chat-context-integrity.test.ts` stay green and double as validation anchors.
- **Sequencing:** land this skip in the SAME wave as (or before) `multi-chain-evm.mdx` — every intermediate state with the MDX but no skip has a red build.

---

### `src/content/projects/{solsniper,nfl-predict,optimize-ai,clipify,daytrade}.mdx` (MODIFY — frontmatter only)

**Analog:** each other's frontmatter (edit only `featured:` / `order:` lines; leave body + all other fields byte-identical).

Exact diff (verified in RESEARCH §Priority 5):

| File | `featured` change | `order` change |
|------|-------------------|----------------|
| `seatwatch.mdx` | none (true) | none (1) |
| `nfl-predict.mdx` | none (true) | 2 → 3 |
| `solsniper.mdx` | **true → false** | 3 → 4 |
| `optimize-ai.mdx` | none (false) | 4 → 5 |
| `clipify.mdx` | none (false) | 5 → 6 |
| `daytrade.mdx` | none (false) | 6 → 7 |

Post-change: featured = {seatwatch(1), multi-chain-evm(2), nfl-predict(3)} = exactly 3; `order` = contiguous unique {1..7}.

**Do NOT** "fix" the frontmatter `title` values to match the roadmap mock — actual titles are "NFL Prediction System", "Optimize AI", "Daytrade"; rewriting titles is out of scope.

---

### Test arrays (MODIFY — D-16, add `multi-chain-evm` in alphabetical position)

**Analog:** `tests/content/projects-collection.test.ts` — the canonical array idiom all siblings mirror.

**Pattern to copy** (`projects-collection.test.ts:7-14`) — `multi-chain-evm` sorts between `daytrade` and `nfl-predict`:
```ts
const EXPECTED_SLUGS = [
  "clipify",
  "daytrade",
  "multi-chain-evm",   // <-- ADD here
  "nfl-predict",
  "optimize-ai",
  "seatwatch",
  "solsniper",
];
```
Also in this file: change test title "exactly 6 MDX entries" → 7 (line 17). The "exactly 3 featured" assertion (line 25-35, regex-counts `^featured:\s*true`) STAYS 3 — no edit (still 3 after solsniper flips false).

**Sibling arrays needing the same one-line insertion** (const name / line):
| File | Const | Line |
|------|-------|------|
| `tests/content/case-studies-have-content.test.ts` | `PROJECTS` | 5 |
| `tests/content/case-studies-shape.test.ts` | `PROJECTS` | 5 |
| `tests/content/case-studies-wordcount.test.ts` | `PROJECTS` | 5 |
| `tests/content/voice-banlist.test.ts` | `PROJECTS` | 5 |
| `tests/content/voice-em-dash.test.ts` | `PROJECTS` | 5 |
| `tests/build/no-mdx-in-worker-bundle.test.ts` | `mdxStems` | 48 |

**Leave UNCHANGED (chat-side pins — chat stays 6 until Phase 25):** `tests/build/chat-context-integrity.test.ts`, `tests/build/chat-knowledge-voice.test.ts`, `tests/fixtures/chat-eval-dataset.ts`, `tests/api/prompt-injection.test.ts`. These verify the D-15 exclusion works — if one goes red, the skip is wrong, not the test. `tests/content/source-files-exist.test.ts` auto-covers #7 (dynamic readdir, no array).

## Shared Patterns

### Create-MDX-then-sync (build-time content pipeline)
**Source:** `scripts/sync-projects.mjs` (globs existing MDX at 202-204; body-only replace at line 182)
**Apply to:** `multi-chain-evm.mdx` creation
The sync script NEVER creates MDX and preserves frontmatter byte-for-byte — it only rewrites the body from the fenced source. Order of operations: (1) hand-author `multi-chain-evm.mdx` frontmatter, (2) fence the case study in `Projects/7 …md`, (3) `pnpm sync:projects` to fill the body. Never author prose directly in the MDX (next sync overwrites it).

### Partition-by-featured, sort-by-order (single distinction — D-12)
**Source:** `index.astro:14-18` (filter) + `projects.astro:9-11` (sort)
**Apply to:** both `projects.astro` (two tiers) and `index.astro` (featured teaser)
One `getCollection("projects")` → `.sort((a,b) => a.data.order - b.data.order)` → `.filter((p) => p.data.featured)` / `!p.data.featured`. No schema change; `featured` + `order` already in `src/content.config.ts:13,19`.

### Scoped-CSS editorial primitive, six-token palette (MASTER §5.5, §8)
**Source:** `WorkRow.astro:43-125`
**Apply to:** the featured-row tagline treatment + any tier divider
Scoped `<style>`, no Tailwind in primitives, six hex tokens only (`--bg/--ink/--ink-muted/--ink-faint/--rule/--accent`), focus ring `outline: 2px solid var(--accent); outline-offset: 2px`, restrained motion with paired `prefers-reduced-motion` override. No cards/shadows/radius. Prefer page-scoped CSS over `global.css` (avoids the D-26 chat-surface battery).

### `.read-more` link idiom (D-13)
**Source:** `index.astro:81` markup + `:106-107` style
**Apply to:** the new Home "See all work →" link (href `/projects`)

### Hard-coded-slug-array content gates (D-16)
**Source:** `projects-collection.test.ts:7-14` `EXPECTED_SLUGS`
**Apply to:** all 7 site-side arrays; grep `"solsniper"` across `tests/` post-edit to confirm each gained `multi-chain-evm`. Adding #7 to these arrays is what pulls it under the shape/wordcount/voice/em-dash/no-worker-MDX gates.

## No Analog Found

None. Every changed file has an exact in-repo analog (this is a reconciliation + editorial-extension phase — zero new machinery, zero new deps, zero schema changes).

Optional NET-NEW test files (Wave 0, from RESEARCH Validation Architecture — no analog needed, small vitest property tests):
| File | Role | Purpose |
|------|------|---------|
| `tests/content/projects-ordering.test.ts` (recommended) | test | assert `order` == {1..7} unique + featured membership exact (SC4) |
| `tests/build/featured-tier-render.test.ts` (optional) | test | assert `work-tagline` ×3 + 7 rows numbered 01-07 (SC2) |

## Metadata

**Analog search scope:** `src/content/projects/`, `src/pages/`, `src/components/primitives/`, `scripts/`, `tests/content/`, `tests/build/`, `Projects/`
**Files scanned:** WorkRow.astro, projects.astro, index.astro, seatwatch.mdx, projects-collection.test.ts (read directly this session); RESEARCH.md verified excerpts for build-chat-context.mjs, sync-projects.mjs, content.config.ts, sibling MDX frontmatter, remaining test arrays
**Pattern extraction date:** 2026-07-10
