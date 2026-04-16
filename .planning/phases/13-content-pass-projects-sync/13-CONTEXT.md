# Phase 13: Content Pass + Projects/ Sync - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase ships six real 600–900-word case studies in `src/content/projects/*.mdx`, an audited About / homepage / resume copy stack verified as of the milestone date, and a diff-reviewable sync pipeline (`scripts/sync-projects.mjs`) that treats `Projects/*.md` as the authoritative source for MDX case-study bodies. Two reference docs published: `docs/CONTENT-SCHEMA.md` (Zod + sync contract) and `docs/VOICE-GUIDE.md` (locked site voice).

**In scope:**
- Per-file audit and rewrite of all 6 MDX bodies to the locked 5-H2 structure
- Fenced case-study blocks embedded in each `Projects/*.md`
- `scripts/sync-projects.mjs` with write mode + `--check` CI mode
- Zod schema extension (`source` field + existence check)
- `crypto-breakout-trader.mdx` → `daytrade.mdx` rename
- `docs/CONTENT-SCHEMA.md` + `docs/VOICE-GUIDE.md` authored
- About / homepage / resume copy audit with dated annotation + UAT checklist
- ROADMAP.md success-criterion #1 amendment (6 H2s → 5 H2s)

**Out of scope (handled by other phases):**
- Chat consumption of the new MDX bodies — Phase 14 (CHAT-03 builds `portfolio-context.json` from these)
- Third-person persona tuning in chat — Phase 14 (CHAT-06)
- Analytics on project-page scroll depth — Phase 15
- Motion / scroll-reveal on case-study pages — Phase 16

</domain>

<decisions>
## Implementation Decisions

### Section Taxonomy & Structure

- **D-01:** Case studies use a 5-H2 hybrid structure — **Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings** — merging the spec's separate "Approach" and "Architecture" sections into one. Rationale: the two overlap in practice; 5 H2s keeps density high within the 600–900 word budget.
- **D-02:** ROADMAP.md success criterion #1 for Phase 13 must be amended from "Problem → Approach → Architecture → Tradeoffs → Outcome → Learnings" (6 H2s) to the locked 5-H2 shape. This amendment is an explicit deliverable of Phase 13 (not a drive-by edit).

### Existing MDX Trust & Project Set

- **D-03:** Existing MDX bodies in `src/content/projects/*.mdx` are **mixed trust** — some reflect Jack's real work, some were AI-drafted with thin source info. Per-file audit required. For each of the 6 files, Claude produces a draft from `Projects/<n>-<NAME>.md`; Jack redlines; lock.
- **D-04:** `Projects/` (6 files: SEATWATCH, NFL_PREDICT, SOLSNIPER, OPTIMIZE_AI, CLIPIFY, DAYTRADE) is the **authoritative project set for v1.2**. Rename `src/content/projects/crypto-breakout-trader.mdx` → `daytrade.mdx`. Update nav / homepage work list / any internal link referencing the old slug.
- **D-05:** No URL redirect added for the old `/projects/crypto-breakout-trader` path — verified during planning that nothing in the repo (sitemap, JSON-LD, resume PDF, external content) references it. If any external reference surfaces, add a `public/_redirects` entry at that time (Cloudflare Pages supports this natively).

### Source-of-Truth & Sync Transformation

- **D-06:** The 600–900-word case-study body lives **inside** each `Projects/<n>-<NAME>.md` between fenced HTML comments:
  ```
  <!-- CASE-STUDY-START -->
  ## Problem
  ...
  ## Approach & Architecture
  ...
  ## Tradeoffs
  ...
  ## Outcome
  ...
  ## Learnings
  ...
  <!-- CASE-STUDY-END -->
  ```
  Sync extracts only the fenced block. The full technical README stays below the fence in the same file as extended reference material (and may feed Phase 14 chat context in a later phase if needed — not committed in 13).
- **D-07:** Case studies are **written by Claude from the existing `Projects/*.md` READMEs, then Jack redlines.** This is the accepted tradeoff: faster than hand-drafting 4–6 case studies from scratch, with human editing as the quality gate.
- **D-08:** Case-study audience is **recruiters / engineers reading the site directly** — NOT the Phase 14 chat retrieval. Single-audience principle. Phase 14 adapts to whatever shape ships.

### Voice & Persona (VOICE-GUIDE.md Deliverable)

- **D-09:** Site-wide voice = **first person** ("I built X") — About, homepage hero, MDX case studies, resume PDF. **Chat widget voice = third person** ("Jack built X") per Phase 14 CHAT-06. Rationale: the site IS Jack speaking; the chat is a third-party assistant about Jack.
- **D-10:** Case-study tone = **engineering-journal** — direct, specific, load-bearing nouns. Concrete systems named, tradeoffs visible, lessons surfaced. Matches current `seatwatch.mdx` voice.
- **D-11:** VOICE-GUIDE.md codifies four hard rules:
  1. **No hype / AI-tells banlist** — ban "revolutionary", "seamless", "leverage", "robust", "scalable" (unless quantified), em-dash abuse, "dive deeper", emoji.
  2. **Numbers or don't claim it** — every performance/scale claim requires a number. "Fast" → "sub-second" or dropped.
  3. **Past tense for shipped work** — "I built" not "I build"; "handled" not "handles". Present tense reserved for active work.
  4. **Named systems over abstractions** — "the dual-strategy booking engine" not "an advanced booking system". Every non-trivial subsystem gets a proper noun.

### Sync Script (scripts/sync-projects.mjs)

- **D-12:** Sync maps `Projects/*.md` ↔ `src/content/projects/*.mdx` via a **frontmatter `source:` field on each MDX** (e.g., `source: "Projects/1 - SEATWATCH.md"`). Script reads MDX frontmatter, finds its source file, extracts the fenced case-study block, replaces only the MDX body (frontmatter + delimiter preserved byte-for-byte).
- **D-13:** Default run mode = **write + leave diff for human review**. Script writes each MDX, exits 0. Jack runs `git diff` to review, stages, commits. No dry-run default.
- **D-14:** **CI drift gate** — GitHub Actions runs `node scripts/sync-projects.mjs --check` (no writes, exit 1 if a diff would be produced). Forces `Projects/` + MDX to stay in lockstep. Hand-edited MDX bodies will fail CI — intentional; next sync run overwrites and re-syncs.
- **D-15:** **Zod schema extension** — `src/content.config.ts` adds `source: z.string()` (required). Sync script additionally verifies the referenced file exists on disk; throws with a clear error if missing. Every case study must have an authoritative source file.
- **D-16:** Sync script performs a **soft word-count check** — after writing each body, prints `seatwatch.mdx: 847 words (OK)` or `daytrade.mdx: 1120 words (exceeds 900)`. Warning only; does not fail. Human tightens if flagged.

### Content Schema Doc (docs/CONTENT-SCHEMA.md Deliverable)

- **D-17:** `docs/CONTENT-SCHEMA.md` contains **four sections**:
  1. **Zod schema reference** — every frontmatter field documented with example + constraint (title, tagline ≤80, description, techStack ≥1, featured, status, order ≥1, year YYYY, category enum, optional githubUrl/demoUrl/thumbnail, required `source`).
  2. **Sync contract** — fenced-block convention, `source:` field mechanics, what sync writes vs. leaves alone, the 5-H2 body structure, the 600–900 word target.
  3. **Author workflow** — step-by-step: edit `Projects/<n>-<NAME>.md` inside the fence → `pnpm sync:projects` → review `git diff` → commit both files.
  4. **Failure-mode matrix** — every error the sync + build pipeline can emit with the fix (unknown `source`, malformed frontmatter, missing fence, Zod failure, source file not found on disk).

### About / Homepage / Resume Verification (CONT-03, CONT-04)

- **D-18:** Verification mechanism = **dated annotation in `src/data/about.ts` + UAT checklist**. Each exported string in `src/data/about.ts` gets a `/* Verified: 2026-MM-DD */` comment alongside its declaration. `13-UAT.md` enumerates every surface (homepage display hero, homepage about strip, about.astro full narrative, each of the 6 work-list entries by title+tagline, each of the 6 project detail pages, resume PDF page-by-page) for explicit Jack sign-off. Evidence of verification = git blame on the annotation + signed UAT.
- **D-19:** Resume PDF (`public/jack-cutrara-resume.pdf`) source doc lives **outside this repo** (Google Docs / LaTeX / external). Resume audit workflow = re-export from source, overwrite `public/jack-cutrara-resume.pdf`, commit. The external source location is documented in `CONTENT-SCHEMA.md` (sync contract section) so future-Jack doesn't forget where to edit.

### Claude's Discretion

- Exact fence-marker HTML comment format (`<!-- CASE-STUDY-START -->` vs `<!-- sync:start -->` etc.) — choose during planning for readability/grep-ability.
- Script's internal parsing library choice for frontmatter (`gray-matter` vs hand-rolled regex) — **prefer hand-rolled** per v1.2 "zero new runtime deps" gate. Devdep acceptable if parsing complexity warrants.
- CI check command exact invocation (`pnpm sync:check` vs direct node) and failure message copy — planner decides.
- Specific redline workflow for the 6 MDX files (inline review, separate file, branch-per-project) — decide at execute time when Claude produces first draft.

### Folded Todos

*None folded — no pending todos matched Phase 13 scope.*

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Scope
- `.planning/ROADMAP.md` — Phase 13 entry, success criteria, Depends-on chain (NOTE: success criterion #1 amendment is a D-02 deliverable — planner must plan the amendment)
- `.planning/REQUIREMENTS.md` — CONT-01 through CONT-07 (Phase 13 requirement block)
- `.planning/PROJECT.md` — audience (recruiter scan + engineer deep-dive), v1.2 milestone context

### Source-of-Truth Content
- `Projects/1 - SEATWATCH.md` — source for `seatwatch.mdx`
- `Projects/2 - NFL_PREDICT.md` — source for `nfl-predict.mdx`
- `Projects/3 - SOLSNIPER.md` — source for `solsniper.mdx`
- `Projects/4 - OPTIMIZE_AI.md` — source for `optimize-ai.mdx`
- `Projects/5 - CLIPIFY.md` — source for `clipify.mdx`
- `Projects/6 - DAYTRADE.md` — source for `daytrade.mdx` (after rename)

### Existing Surface (to audit / modify)
- `src/content.config.ts` — Zod schema (extended with `source` field per D-15)
- `src/content/projects/*.mdx` — 6 MDX files (5 existing + 1 rename)
- `src/data/about.ts` — About copy exports (dated annotations per D-18)
- `src/pages/about.astro` — About page consumer
- `src/pages/index.astro` — homepage display hero + about strip + work list consumer
- `src/pages/projects/` — project detail page template
- `public/jack-cutrara-resume.pdf` — resume artifact (re-export workflow per D-19)

### Design & Cross-Phase Constraints
- `design-system/MASTER.md` — typography / type-role classes used by MDX (`.h2-project`, `.body`, `.lead`, etc.); additive only, no amendments in Phase 13
- `milestones/v1.1-MILESTONE-AUDIT.md` — baseline Lighthouse targets (Performance ≥99 / A11y ≥95 / BP 100 / SEO 100) that Phase 13 must hold
- `.planning/phases/12-tech-debt-sweep/12-CONTEXT.md` — carry-forward decisions (chat regression gate D-26 does NOT apply in Phase 13 unless MDX body change ripples into chat.ts — unlikely)

### Deliverables (new files to author)
- `docs/CONTENT-SCHEMA.md` — new, four sections per D-17
- `docs/VOICE-GUIDE.md` — new, voice + tone + hard rules per D-09 / D-10 / D-11
- `scripts/sync-projects.mjs` — new, behavior per D-12 / D-13 / D-14 / D-16

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/content.config.ts`** (Zod schema): already defines `title`, `tagline`, `description`, `techStack`, `featured`, `status`, `category`, `order`, `year`, optional `githubUrl` / `demoUrl` / `thumbnail`. D-15 adds exactly one field (`source`). Low-risk amendment.
- **Type-role classes** in `src/styles/global.css` (`.h2-project`, `.body`, `.lead`, `.label-mono`) — case-study prose already uses these via MDX default heading/paragraph slots. No new CSS needed.
- **Astro Content Collections** already loaded via `glob({ pattern: "**/*.mdx", base: "./src/content/projects" })` — rename handled by Astro automatically; just update anything that hardcoded the old slug.
- **`src/data/about.ts`** — single source of truth for About copy (`ABOUT_INTRO`, `ABOUT_P1`, `ABOUT_P2`, `ABOUT_P3`). Dated annotations land here (D-18).

### Established Patterns
- **Content collection bodies** render through Astro's default MDX pipeline — no custom slot wiring. Means swapping body content is transparent to the rendering layer.
- **Frontmatter is human-authored, body is machine-sync-safe** (D-06, D-12). Clean separation of concerns.
- **`pnpm astro check`** is the canonical schema validator — already run in Phase 12 audit-closeout. Re-use as the post-sync validation step.
- **`public/_redirects`** (Cloudflare Pages native) is the redirect mechanism if D-05 reverses.

### Integration Points
- **Homepage work list** (`src/pages/index.astro`) reads from content collection via `getCollection("projects")` — updates automatically on rename + frontmatter edits.
- **Project detail routes** (`src/pages/projects/[slug].astro`) are file-based — slug changes with filename automatically. Rename is a one-line (filename) change from the router's perspective.
- **Phase 14 chat context generator** (not yet built, CHAT-03) will glob `src/content/projects/**/*.mdx` — honoring the new `source` frontmatter field is a Phase 14 concern, not Phase 13.
- **JSON-LD structured data** in `BaseLayout.astro` / project detail template — audit for hardcoded slug references during rename plan.

### Creative Options
- The fenced case-study convention (D-06) means `Projects/*.md` continues to serve dual purposes: full technical reference below the fence (potentially useful for Phase 14 chat "extended context" knob later) + 600–900 word case study above. One file, two consumers.

</code_context>

<specifics>
## Specific Ideas

- **SeatWatch exemplar:** the current `seatwatch.mdx` is the reference style — first-person, engineering-journal tone, named systems ("dual-strategy booking engine", "distributed booking lock", "circuit breaker"), concrete numbers ("48,000 lines of TypeScript across 329 files", "50 parallel user sessions", "under 500ms"). Other case studies should match this density and voice.
- **ROADMAP amendment as a plan:** the roadmap edit (success criterion #1: 6 H2s → 5 H2s) is a deliverable with its own plan, not a drive-by change. Plan it explicitly so verification can audit the amendment.
- **No optimization for chat retrieval:** explicitly rejected writing with Phase 14 in mind (D-08). Keep case studies human-first; Phase 14 owns adaptation.
- **"daytrade" not "crypto-breakout-trader":** the project's real name is DAYTRADE. The old slug was a misrepresentation during v1.0 placeholder scaffolding. Rename is non-optional for accuracy.

</specifics>

<deferred>
## Deferred Ideas

- **Full `Projects/*.md` technical README as Phase 14 extended chat context** — the full text below the case-study fence is potentially rich material for chat answering deep technical questions. Not committed in Phase 13; Phase 14 CHAT-03 decides whether `portfolio-context.json` includes just the fenced case study or the full Projects/*.md body. Logged for Phase 14 planning.
- **Signature hero moment / animation on case-study pages** — out of scope per PROJECT.md; Phase 16 Motion owns any motion additions.
- **Writing a repo-native resume source** (markdown + pandoc, LaTeX template) — D-19 chose external-source workflow. If external doc ownership becomes a pain point in v1.3+, reconsider.
- **Word-count hard enforcement** — D-16 chose soft warning. If drift becomes a recurring issue, tighten to hard-fail in v1.3+.
- **Precommit hook for sync drift** — D-14 chose CI-only. If PRs start accumulating drift pre-CI, add a precommit hook in v1.3+.

### Reviewed Todos (not folded)
*No todos surfaced during cross-reference — nothing to note.*

</deferred>

---

*Phase: 13-content-pass-projects-sync*
*Context gathered: 2026-04-15*
