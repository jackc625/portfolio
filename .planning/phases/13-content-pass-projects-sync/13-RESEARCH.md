# Phase 13: Content Pass + Projects/ Sync — Research

**Researched:** 2026-04-16
**Domain:** Content authoring + lightweight Node.js sync tooling for an Astro 6 content collection
**Confidence:** HIGH

## Summary

Phase 13 is split cleanly down the middle: a **content-authoring track** (six 600–900-word case studies, About/homepage/resume verification) and a **tooling track** (a ~200-line `scripts/sync-projects.mjs`, a one-line Zod schema extension, two new docs in `docs/`). The CONTEXT.md (D-01..D-19) already locks every consequential decision; research focused on the tactical implementation gaps that turn those decisions into a plan.

Key empirical findings: (1) the six `Projects/*.md` source READMEs contain **zero existing case-study material** — they are pure technical reference, so every case-study draft is a from-scratch distillation, not a redline of existing prose; (2) the existing six MDX bodies use a **4-H2 shape (Problem / Solution & Approach / Tech Stack Detail / Challenges & Lessons / Results)** that does NOT match either the spec's 6-H2 or D-01's locked 5-H2 — every MDX body is a structural rewrite, not a tweak; (3) the only repo references to the soon-to-be-deleted `crypto-breakout-trader` slug live in `src/data/portfolio-context.json` (one block, three fields) — the rename is mechanically trivial; (4) `src/data/portfolio-context.json` is **imported into `src/pages/api/chat.ts`**, so any edit to it triggers the D-26 Chat Regression Gate; (5) Astro's `glob()` loader derives `entry.id` from filename via `github-slugger`, and `.astro/data-store.json` caches resolved entries — `astro sync` (or `astro check`) rebuilds it on rename, but a running `astro dev` should be restarted to be safe; (6) `docs/` does not yet exist, and `.github/workflows/` does not yet exist either — both are net-new for this phase.

**Primary recommendation:** Plan in this order — (1) author `docs/VOICE-GUIDE.md` first because every subsequent draft is judged against it; (2) extend Zod with `source:`, then add `source:` to all six MDX frontmatters in one mechanical sweep; (3) build `scripts/sync-projects.mjs` against an empty case-study fence in one Projects file (e.g., SEATWATCH) and prove the round-trip works before drafting any case studies; (4) draft case studies inside the fences in `Projects/*.md`, run sync per-file, redline in MDX after `git diff`; (5) About / homepage / resume audit + UAT in parallel with case-study drafting; (6) `crypto-breakout-trader.mdx` → `daytrade.mdx` rename + `portfolio-context.json` patch + Chat Regression smoke test as the final destabilizing change before phase close.

## Architectural Responsibility Map

Phase 13 is a content + build-tooling phase, not a runtime architecture phase. Capability ownership:

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Case-study source-of-truth | Build / authoring | — | `Projects/*.md` is a flat-file content store; sync is a build-time transform |
| MDX body extraction | Build script (`scripts/sync-projects.mjs`) | — | Pure Node ESM, no runtime; runs on developer's machine + in CI |
| Zod schema validation | Build (`astro check`) | — | Already enforced at build; one-field extension |
| Sync drift detection | CI (GitHub Actions) | Local pre-commit (deferred) | D-14 chose CI-only; pre-commit deferred to v1.3+ |
| Project detail page rendering | Astro (static, build-time) | — | No runtime change; rename auto-routes via filename |
| Chat consumption of new content | Phase 14 (out of scope) | — | Phase 13 stops at MDX bodies; Phase 14 builds `portfolio-context.json` from them |
| About / homepage / resume copy | Build (static page render) | Manual UAT (human verifier) | `src/data/about.ts` source-of-truth pattern preserved; verification via dated comments + UAT signoff |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Section Taxonomy & Structure**
- **D-01:** Case studies use a 5-H2 hybrid structure — **Problem / Approach & Architecture / Tradeoffs / Outcome / Learnings** — merging the spec's separate "Approach" and "Architecture" sections into one. Rationale: the two overlap in practice; 5 H2s keeps density high within the 600–900 word budget.
- **D-02:** ROADMAP.md success criterion #1 for Phase 13 must be amended from "Problem → Approach → Architecture → Tradeoffs → Outcome → Learnings" (6 H2s) to the locked 5-H2 shape. This amendment is an explicit deliverable of Phase 13 (not a drive-by edit).

**Existing MDX Trust & Project Set**
- **D-03:** Existing MDX bodies in `src/content/projects/*.mdx` are **mixed trust** — some reflect Jack's real work, some were AI-drafted with thin source info. Per-file audit required. For each of the 6 files, Claude produces a draft from `Projects/<n>-<NAME>.md`; Jack redlines; lock.
- **D-04:** `Projects/` (6 files: SEATWATCH, NFL_PREDICT, SOLSNIPER, OPTIMIZE_AI, CLIPIFY, DAYTRADE) is the **authoritative project set for v1.2**. Rename `src/content/projects/crypto-breakout-trader.mdx` → `daytrade.mdx`. Update nav / homepage work list / any internal link referencing the old slug.
- **D-05:** No URL redirect added for the old `/projects/crypto-breakout-trader` path — verified during planning that nothing in the repo (sitemap, JSON-LD, resume PDF, external content) references it. If any external reference surfaces, add a `public/_redirects` entry at that time (Cloudflare Pages supports this natively).

**Source-of-Truth & Sync Transformation**
- **D-06:** The 600–900-word case-study body lives **inside** each `Projects/<n>-<NAME>.md` between fenced HTML comments (`<!-- CASE-STUDY-START -->` ... `<!-- CASE-STUDY-END -->`). Sync extracts only the fenced block. The full technical README stays below the fence in the same file as extended reference material.
- **D-07:** Case studies are **written by Claude from the existing `Projects/*.md` READMEs, then Jack redlines.** Faster than hand-drafting 4–6 case studies from scratch; human editing is the quality gate.
- **D-08:** Case-study audience is **recruiters / engineers reading the site directly** — NOT the Phase 14 chat retrieval. Single-audience principle. Phase 14 adapts to whatever shape ships.

**Voice & Persona (VOICE-GUIDE.md Deliverable)**
- **D-09:** Site-wide voice = **first person** ("I built X") — About, homepage hero, MDX case studies, resume PDF. **Chat widget voice = third person** ("Jack built X") per Phase 14 CHAT-06.
- **D-10:** Case-study tone = **engineering-journal** — direct, specific, load-bearing nouns. Concrete systems named, tradeoffs visible, lessons surfaced. Matches current `seatwatch.mdx` voice.
- **D-11:** VOICE-GUIDE.md codifies four hard rules:
  1. **No hype / AI-tells banlist** — ban "revolutionary", "seamless", "leverage", "robust", "scalable" (unless quantified), em-dash abuse, "dive deeper", emoji.
  2. **Numbers or don't claim it** — every performance/scale claim requires a number. "Fast" → "sub-second" or dropped.
  3. **Past tense for shipped work** — "I built" not "I build"; "handled" not "handles". Present tense reserved for active work.
  4. **Named systems over abstractions** — "the dual-strategy booking engine" not "an advanced booking system". Every non-trivial subsystem gets a proper noun.

**Sync Script (scripts/sync-projects.mjs)**
- **D-12:** Sync maps `Projects/*.md` ↔ `src/content/projects/*.mdx` via a **frontmatter `source:` field on each MDX** (e.g., `source: "Projects/1 - SEATWATCH.md"`). Script reads MDX frontmatter, finds its source file, extracts the fenced case-study block, replaces only the MDX body (frontmatter + delimiter preserved byte-for-byte).
- **D-13:** Default run mode = **write + leave diff for human review**. Script writes each MDX, exits 0. Jack runs `git diff` to review, stages, commits. No dry-run default.
- **D-14:** **CI drift gate** — GitHub Actions runs `node scripts/sync-projects.mjs --check` (no writes, exit 1 if a diff would be produced). Forces `Projects/` + MDX to stay in lockstep. Hand-edited MDX bodies will fail CI — intentional; next sync run overwrites and re-syncs.
- **D-15:** **Zod schema extension** — `src/content.config.ts` adds `source: z.string()` (required). Sync script additionally verifies the referenced file exists on disk; throws with a clear error if missing.
- **D-16:** Sync script performs a **soft word-count check** — after writing each body, prints `seatwatch.mdx: 847 words (OK)` or `daytrade.mdx: 1120 words (exceeds 900)`. Warning only; does not fail.

**Content Schema Doc (docs/CONTENT-SCHEMA.md Deliverable)**
- **D-17:** `docs/CONTENT-SCHEMA.md` contains four sections: (1) Zod schema reference, (2) Sync contract, (3) Author workflow, (4) Failure-mode matrix.

**About / Homepage / Resume Verification**
- **D-18:** Verification mechanism = **dated annotation in `src/data/about.ts` + UAT checklist**. Each exported string in `src/data/about.ts` gets a `/* Verified: 2026-MM-DD */` comment alongside its declaration. `13-UAT.md` enumerates every surface for explicit Jack sign-off.
- **D-19:** Resume PDF source doc lives **outside this repo** (Google Docs / LaTeX / external). Resume audit workflow = re-export from source, overwrite `public/jack-cutrara-resume.pdf`, commit. External source location documented in `CONTENT-SCHEMA.md`.

### Claude's Discretion
- Exact fence-marker HTML comment format (`<!-- CASE-STUDY-START -->` vs `<!-- sync:start -->` etc.) — choose during planning for readability/grep-ability. **Recommendation:** `<!-- CASE-STUDY-START -->` / `<!-- CASE-STUDY-END -->` (long form, grep-unique, matches D-06 example verbatim).
- Script's internal parsing library choice for frontmatter (`gray-matter` vs hand-rolled regex) — **prefer hand-rolled** per v1.2 "zero new runtime deps" gate. Devdep acceptable if parsing complexity warrants. **Recommendation:** hand-rolled (~25 lines, see Code Examples §3); zero deps justified.
- CI check command exact invocation (`pnpm sync:check` vs direct node) and failure message copy — planner decides.
- Specific redline workflow for the 6 MDX files (inline review, separate file, branch-per-project) — decide at execute time when Claude produces first draft.

### Deferred Ideas (OUT OF SCOPE)
- Full `Projects/*.md` technical README as Phase 14 extended chat context — Phase 14 CHAT-03 decides.
- Signature hero moment / animation on case-study pages — Phase 16 owns motion.
- Writing a repo-native resume source — D-19 chose external; reconsider in v1.3+.
- Word-count hard enforcement — D-16 chose soft warning; tighten in v1.3+ if drift recurs.
- Precommit hook for sync drift — D-14 chose CI-only; add in v1.3+ if drift recurs pre-CI.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-01 | All 6 project MDX case studies have real content (4 placeholder files rewritten from source-of-truth in `Projects/`) | Per-file MDX inventory below shows ALL 6 (not 4) need structural rewrite to land 5-H2 D-01 shape; current shape is 4-H2 incompatible |
| CONT-02 | Case studies follow documented structure: Problem → Approach → Architecture → Tradeoffs → Outcome → Learnings (600–900 words each) | Amended to D-01 5-H2 shape via D-02 ROADMAP edit; word-count audit shows current bodies in-band (734–855 words) but structure mismatched |
| CONT-03 | About page narrative audited for accuracy; copy verified current | About surface inventory: `src/data/about.ts` (4 exports), `src/pages/about.astro`, `src/pages/index.astro`. Verification mechanism per D-18 |
| CONT-04 | Homepage display hero, work list entries, and Resume PDF copy audited and verified current | Homepage inventory: hero `JACK CUTRARA` + lead, status dot, meta label, 3-row work list, about strip. Resume = external re-export per D-19 |
| CONT-05 | `Projects/` folder per-project docs are the authoritative source of truth for MDX case studies | Fenced-block design (D-06) makes `Projects/*.md` dual-purpose: case study above fence, technical reference below |
| CONT-06 | `scripts/sync-projects.mjs` built — idempotent, manual-trigger; syncs `Projects/*.md` body into `src/content/projects/*.mdx`; frontmatter stays human-authored; Zod schema enforced via `astro check` | Full design in Architecture Patterns §1 + Code Examples §3 + §4. Hand-rolled parser, zero new runtime deps, devdep-free. CI step in §5 |
| CONT-07 | `docs/CONTENT-SCHEMA.md` and `docs/VOICE-GUIDE.md` published to prevent future drift | Both new files; `docs/` directory does not yet exist (must be created); structure templates in Code Examples §6 + §7 |
</phase_requirements>

## Standard Stack

This phase introduces ZERO new runtime dependencies and ZERO new devDependencies on the recommended path. All work uses tools already installed.

### Core (already in `package.json`)
| Library | Version (verified) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 22 LTS (engines.node ≥22) | Sync script runtime | Already required by Astro 6 [VERIFIED: package.json] |
| Astro | 6.0.8 | Content collections + build-time validation | Already shipped [VERIFIED: node_modules/astro/package.json] |
| Zod | 4.3.6 | Schema for `source:` field | Bundled with Astro 6; already imported in `src/content.config.ts` [VERIFIED: node_modules/zod/package.json] |
| `@astrojs/check` | 0.9.8 | `astro check` validates Zod at build | Already in devDependencies [VERIFIED: package.json] |
| Vitest | 4.1.0 | Unit-test the parser, frontmatter extractor, word-counter | Existing test infra [VERIFIED: package.json + vitest.config.ts] |

### Built-in Node APIs (no install required)
| API | Purpose |
|-----|---------|
| `node:fs/promises` | `readFile`, `writeFile`, `access` for source-existence check |
| `node:path` | `path.join`, `path.basename` for OS-portable paths |
| `node:process` | `process.argv`, `process.exit`, `process.stderr` |
| `node:url` | `fileURLToPath` if invoked relative to `import.meta.url` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled frontmatter parser | `gray-matter` (devdep, ~9 KB) | Saves ~25 LOC at cost of: (a) D-14 `--check` CI grows a transient install, (b) v1.2 "zero new deps" preferred-path violated, (c) `gray-matter` parses YAML loosely — risks corrupting hand-authored frontmatter on round-trip. Hand-rolled is **better** here because the script writes back the frontmatter byte-for-byte (D-12). Use raw string slicing, never re-serialize. |
| Hand-rolled CLI arg parser | `commander` / `yargs` | One flag (`--check`), one positional pattern (none) — `process.argv.includes("--check")` is sufficient (CONTEXT.md §Discretion concurs). |
| GitHub Actions for CI drift gate | Pre-commit hook | D-14 explicitly chose CI-only (pre-commit deferred to v1.3+ per Deferred Ideas). |

**No `npm install` step required.** The phase ends with the same `package.json` bytes it started with.

**Version verification (performed 2026-04-16):**
- `astro@6.0.8` — installed in node_modules [VERIFIED: cat node_modules/astro/package.json]
- `zod@4.3.6` — installed in node_modules [VERIFIED]
- `vitest@4.1.0` — installed [VERIFIED]
- Node engine pinned to ≥22 in `package.json` [VERIFIED]

## Architecture Patterns

### System Architecture Diagram

```
                         ┌──────────────────────────────────┐
                         │  AUTHORING SURFACE (human)       │
                         │  Projects/<n>-<NAME>.md          │
                         │  ┌────────────────────────────┐  │
                         │  │ <!-- CASE-STUDY-START -->  │  │
                         │  │ ## Problem                 │  │
                         │  │ ## Approach & Architecture │  │
                         │  │ ## Tradeoffs               │  │
                         │  │ ## Outcome                 │  │
                         │  │ ## Learnings               │  │
                         │  │ <!-- CASE-STUDY-END -->    │  │
                         │  └────────────────────────────┘  │
                         │  (full technical README below)   │
                         └──────────────┬───────────────────┘
                                        │
                                        │ pnpm sync:projects
                                        ▼
                  ┌─────────────────────────────────────────┐
                  │  scripts/sync-projects.mjs              │
                  │                                         │
                  │  1. glob src/content/projects/*.mdx     │
                  │  2. parse frontmatter → read `source:`  │
                  │  3. fs.access(source) — exit 1 if miss  │
                  │  4. read source → extract fence         │
                  │  5. assemble new MDX (FM byte-for-byte  │
                  │     + body from fence)                  │
                  │  6. diff vs current → write OR (check)  │
                  │     stderr + exit 1                     │
                  │  7. word-count print line               │
                  └──────────────┬──────────────────────────┘
                                 │
                                 │ writes (or no-ops)
                                 ▼
                  ┌─────────────────────────────────────────┐
                  │  src/content/projects/*.mdx             │
                  │  ┌───────────────────────────────────┐  │
                  │  │ --- frontmatter (HUMAN, locked) --│  │
                  │  │ source: "Projects/1 - …"          │  │
                  │  │ ---                               │  │
                  │  │ ## Problem  …                     │  │
                  │  │ ## Approach & Architecture …      │  │
                  │  │ … (machine-rewritten on sync)     │  │
                  │  └───────────────────────────────────┘  │
                  └──────────────┬──────────────────────────┘
                                 │
                                 │ pnpm build (CI / human)
                                 ▼
              ┌──────────────────────────────────────────────────┐
              │  Astro 6 build pipeline                          │
              │   astro check  ──→ Zod validates `source:`        │
              │   glob() loader  ──→ entry.id from filename       │
              │   render()  ──→ MDX → static HTML                 │
              └──────────────┬───────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────────────────────────┐
              │  /projects/{seatwatch,nfl-predict,solsniper,     │
              │   optimize-ai,clipify,daytrade}/  (static HTML)  │
              └──────────────────────────────────────────────────┘

  CI parallel path:
  ┌──────────────────────────────────────────────────────────────┐
  │  GitHub Actions (.github/workflows/sync-check.yml)           │
  │   pnpm install --frozen-lockfile                             │
  │   node scripts/sync-projects.mjs --check                     │
  │   exit 1 if drift → blocks PR                                │
  └──────────────────────────────────────────────────────────────┘
```

**Data flow trace (primary use case — author edits SeatWatch case study):**
1. Jack edits `Projects/1 - SEATWATCH.md`, modifies prose between `<!-- CASE-STUDY-START -->` and `<!-- CASE-STUDY-END -->`.
2. Jack runs `pnpm sync:projects`.
3. Script iterates 6 MDX files. For `seatwatch.mdx`: reads `source: "Projects/1 - SEATWATCH.md"` from frontmatter, opens that file, extracts fenced block, assembles new MDX content (existing frontmatter bytes + new body), writes if different.
4. Stdout: `seatwatch.mdx: 847 words (OK)`. Other 5 files: no diff, prints `(unchanged)`.
5. Jack runs `git diff` → reviews exactly the body of `seatwatch.mdx`.
6. Jack runs `pnpm check` → `astro check` validates Zod (frontmatter still valid, including `source:`).
7. Jack commits both `Projects/1 - SEATWATCH.md` and `src/content/projects/seatwatch.mdx`.

### Component Responsibilities

| File | Responsibility | Read or Write |
|------|---------------|---------------|
| `Projects/<n>-<NAME>.md` (6 files) | Authoritative case-study + technical README | Human writes; sync script reads only |
| `src/content/projects/*.mdx` (6 files) | Render-target MDX with hand-authored frontmatter + machine-synced body | Human writes frontmatter; sync writes body |
| `src/content.config.ts` | Zod schema; gains `source: z.string()` (required) | Human, one-line addition |
| `scripts/sync-projects.mjs` | NEW — extracts fenced blocks, writes MDX bodies, prints word counts, supports `--check` | Human writes once |
| `docs/CONTENT-SCHEMA.md` | NEW — four-section reference (D-17) | Human writes once |
| `docs/VOICE-GUIDE.md` | NEW — voice + tone + four hard rules (D-09/D-10/D-11) | Human writes once |
| `.github/workflows/sync-check.yml` | NEW — CI runs `node scripts/sync-projects.mjs --check` on PR | Human writes once (directory does not yet exist) |
| `package.json` `scripts` block | Adds `sync:projects` and `sync:check` entries | Two-line edit |
| `src/data/about.ts` | About copy + dated `/* Verified: 2026-MM-DD */` annotations (D-18) | Human edits in-place |
| `src/data/portfolio-context.json` | Patch the `Crypto Breakout Trader` block → `Daytrade` (3 fields) | Human, one-block edit |
| `public/jack-cutrara-resume.pdf` | Re-exported from external Google Doc / LaTeX (D-19) | Binary overwrite |
| `.planning/ROADMAP.md` | Amend Phase 13 success criterion #1 (line 69) per D-02 | Single-line edit |

### Recommended Project Structure

```
docs/                                        ← NEW directory (root)
├── CONTENT-SCHEMA.md                        ← NEW (D-17, four sections)
└── VOICE-GUIDE.md                           ← NEW (D-09/D-10/D-11)

scripts/
├── pages-compat.mjs                         ← existing (untouched)
└── sync-projects.mjs                        ← NEW (~200 LOC)

.github/                                     ← NEW directory (root)
└── workflows/
    └── sync-check.yml                       ← NEW (~30 LOC)

Projects/                                    ← existing, edits in-place
├── 1 - SEATWATCH.md                         ← add fence, write case study above
├── 2 - NFL_PREDICT.md
├── 3 - SOLSNIPER.md
├── 4 - OPTIMIZE_AI.md
├── 5 - CLIPIFY.md
└── 6 - DAYTRADE.md

src/content/projects/                        ← existing
├── seatwatch.mdx                            ← rewrite body to 5-H2 + add source:
├── nfl-predict.mdx                          ← rewrite body + add source:
├── solsniper.mdx                            ← rewrite body + add source:
├── optimize-ai.mdx                          ← rewrite body + add source:
├── clipify.mdx                              ← rewrite body + add source:
├── crypto-breakout-trader.mdx               ← DELETE (after rename)
└── daytrade.mdx                             ← NEW (renamed; rewrite body + add source:)

tests/scripts/                               ← NEW subdirectory
└── sync-projects.test.ts                    ← NEW (parser + extractor unit tests)
```

### Pattern 1: Frontmatter-Preserving Body Replacement

**What:** When sync writes an MDX file, it replaces ONLY the body. The frontmatter block (between the first `---` and the second `---`) is read from the existing MDX file as raw bytes and re-emitted verbatim — never parsed-then-serialized. This guarantees no whitespace, quoting, or array-formatting drift.

**When to use:** Any time a script rewrites a Markdown/MDX file where humans own the frontmatter and machines own the body. Standard pattern for static-site generators with sync pipelines.

**Why:** YAML round-tripping (parse → serialize) is lossy for non-trivial structures (string quoting style, multi-line arrays, comment preservation). Treating the frontmatter as an opaque byte range bypasses the problem entirely.

**Example pseudocode:**
```javascript
const mdx = await fs.readFile(mdxPath, "utf8");
const fmEnd = mdx.indexOf("\n---\n", 4) + 4;     // index of trailing ---
const frontmatterBlock = mdx.slice(0, fmEnd + 1); // includes trailing newline
const newBody = extractFenceFromSource(sourceFile);
const newMdx = frontmatterBlock + "\n" + newBody.trimEnd() + "\n";
```

### Pattern 2: Idempotent Diff-then-Write

**What:** Compare the assembled new content to the file's current bytes. Only call `writeFile` if they differ.

**Why:** Running `pnpm sync:projects` twice with no source changes produces zero filesystem writes, zero `git diff` lines, and zero mtime changes. This is the literal definition of idempotency D-13 + D-14 require. Also makes `--check` mode trivial: same comparison, just exit 1 instead of writing.

**Example:**
```javascript
const existing = await fs.readFile(mdxPath, "utf8");
if (existing === newMdx) { return { changed: false, words }; }
if (CHECK_MODE) {
  process.stderr.write(`drift in ${path.basename(mdxPath)}\n`);
  return { changed: true, words, drift: true };
}
await fs.writeFile(mdxPath, newMdx, "utf8");
return { changed: true, words };
```

### Pattern 3: Verbatim H2 Heading Preservation

**What:** The fenced block in `Projects/*.md` contains `## Problem`, `## Approach & Architecture`, `## Tradeoffs`, `## Outcome`, `## Learnings`. The sync script does NOT rewrite or reorder headings. What's between the fences is what lands in the MDX body, full stop.

**Why:** Single-source-of-truth principle. If sync rewrote headings, authoring drift between source and target would be inevitable. The fence is the contract; the script is dumb tape.

**Implication:** Heading order, casing, and spelling must match D-01 exactly when authoring. The Zod schema cannot enforce this (Zod only sees frontmatter). A separate validator (Pattern 4) is recommended.

### Pattern 4 (RECOMMENDED, optional): Heading-Shape Lint

**What:** After extracting each fenced body, the script verifies the body contains exactly five `## ` H2 headings and they read (in order): `Problem`, `Approach & Architecture`, `Tradeoffs`, `Outcome`, `Learnings`. If not, print warning to stderr (do NOT fail — D-16 chose soft warnings only).

**Why:** Catches authoring slips ("## Problem Statement" vs "## Problem") that would otherwise ship to production unnoticed. Five-line check, high signal.

**Example:**
```javascript
const EXPECTED_H2S = [
  "Problem", "Approach & Architecture", "Tradeoffs", "Outcome", "Learnings"
];
const actual = body.match(/^## (.+)$/gm)?.map(s => s.slice(3).trim()) ?? [];
if (actual.length !== 5 || !EXPECTED_H2S.every((e, i) => actual[i] === e)) {
  process.stderr.write(
    `${slug}.mdx: H2 shape mismatch. expected=${JSON.stringify(EXPECTED_H2S)} actual=${JSON.stringify(actual)}\n`
  );
}
```

### Anti-Patterns to Avoid

- **Re-serializing frontmatter via `gray-matter` or YAML.stringify:** Will silently re-quote strings, reorder array items, drop comments. Treat frontmatter as opaque byte range (Pattern 1).
- **Regex over the entire MDX file looking for headings:** The fence-extraction approach (one anchored regex against the **source** file) is far simpler and survives MDX bodies that legitimately contain `<!-- CASE-STUDY-* -->` substrings inside code fences (handled by anchoring the regex to start-of-line + only running it against the source `.md` file, not the `.mdx` target).
- **Writing files unconditionally then comparing diff later:** Breaks idempotency (touches mtimes; CI's `git diff` may not be sensitive to mtime but file watchers and rebuild caches are).
- **Letting `--check` mode read the file system in any way `--write` mode does not:** Both modes must compute the EXACT same `newMdx` string and compare to `existing`. The only branch is `writeFile` vs `process.exit(1)`. Anything else risks mode-drift bugs.
- **Accepting no fence as a soft pass:** D-15 says every case study must have an authoritative source file; by extension, that source file must contain the fence. No fence = hard error (per D-17 §4 failure-mode matrix).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter round-trip | Custom YAML serializer | Don't serialize at all (Pattern 1: byte-range copy) | YAML is non-trivial; round-tripping is lossy. Avoid the problem entirely. |
| Frontmatter PARSING (read-only, just for `source:` field) | Full YAML parser | Hand-rolled regex on `^source:\s*"?(.+?)"?$` (single line, single field) | Only one field needed. Full YAML parser would be 100+ LOC. Single-line regex is 1 LOC + a check. See Code Examples §3. |
| Markdown rendering / parsing | Custom Markdown parser | Astro's MDX pipeline (already does this at build time) | Sync script never RENDERS markdown; it's a byte mover. Rendering happens at `astro build` time. |
| Diff library (for `--check` output) | `diff` package, `jest-diff` | `string1 === string2` boolean | D-14 requires "exit 1 if drift would be produced", not "show me the diff". Boolean comparison is sufficient. Humans run `git diff` for the visual. |
| Test framework for sync script | Custom test harness | Vitest (already installed) — write `tests/scripts/sync-projects.test.ts` | Existing infra; same `pnpm test` runs it. |
| CI drift detection | Custom git-comparison logic | `node scripts/sync-projects.mjs --check` (the script IS the CI logic) | Symmetry: dev mode and CI mode share 95% of code paths. Reduces drift between modes. |

**Key insight:** This is a ~200-LOC script that uses the platform. Every "I should add a library for X" instinct in this domain is wrong. Node 22 + Vitest + Astro's existing pipeline cover everything.

## Runtime State Inventory

> Phase 13 is content + tooling, but the `crypto-breakout-trader` → `daytrade` rename triggers the rename-checklist.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data (databases, datastores) | None — no database, no localStorage key contains `crypto-breakout-trader` (the chat widget's localStorage stores conversation messages, not project slugs) | None |
| Live service config (UI-managed, not in git) | None — the only "live service" is Cloudflare Pages, which routes from static HTML in `dist/`. No external service has the slug hardcoded. The sitemap and JSON-LD are regenerated at build time from the content collection's auto-derived IDs. | None |
| OS-registered state | None | None |
| Secrets / env vars | None — no env var name or value contains `crypto-breakout-trader` (verified via grep against `.env.example`, `wrangler.jsonc`, and code) | None |
| Build artifacts / installed packages | `.astro/data-store.json` caches the resolved content collection. After renaming `crypto-breakout-trader.mdx` → `daytrade.mdx`, the stale entry will linger until `astro sync` (or `astro check`, or `astro build`, or `astro dev` reload) regenerates it. The `dist/` build output also has `dist/projects/crypto-breakout-trader/` after a stale build — clean before final deploy. | Run `pnpm check` (which runs `astro check`) after rename. Optionally `rm -rf .astro/ dist/` before clean rebuild for safety. |

**Hardcoded slug references found via grep:**
```
src/data/portfolio-context.json:55:    "page": "/projects/crypto-breakout-trader"
src/data/portfolio-context.json:53:    "description": "An automated cryptocurrency day-trading system…"
src/data/portfolio-context.json:52:    "name": "Crypto Breakout Trader"
src/content/projects/crypto-breakout-trader.mdx:2: title: "Crypto Breakout Trader"  ← will be renamed
src/content/projects/crypto-breakout-trader.mdx:4: description: "An automated cryptocurrency…"  ← will be rewritten
```

**The rename checklist (this is the literal task spec):**
1. Rename `src/content/projects/crypto-breakout-trader.mdx` → `src/content/projects/daytrade.mdx` via `git mv` (preserves history).
2. Edit `daytrade.mdx` frontmatter: `title: "Daytrade"`, `description: "<new>"`, add `source: "Projects/6 - DAYTRADE.md"`.
3. Edit `src/data/portfolio-context.json` lines 51–56: rename `"Crypto Breakout Trader"` → `"Daytrade"`, update description to match new MDX, change `"page": "/projects/crypto-breakout-trader"` → `"page": "/projects/daytrade"`.
4. Run `pnpm check` to clear `.astro/data-store.json` and confirm Zod still passes.
5. Run `pnpm test` to confirm no test references the old slug (verified-empty by grep, but defense-in-depth).
6. Run `pnpm build` to confirm `dist/projects/daytrade/index.html` exists and `dist/projects/crypto-breakout-trader/` does NOT (clean any stale `dist/` first).
7. **Trigger D-26 Chat Regression Gate** — `src/data/portfolio-context.json` is imported by `src/pages/api/chat.ts` (line 6). The Phase 7 regression battery applies. Run the smoke test that the chat widget answers `"what did Jack build for Daytrade?"` correctly with the new slug.

**The grep results are truth-in-advertising:** D-05's claim that "nothing in the repo references the old slug" is **almost** true — the hit in `portfolio-context.json` is real and must be patched. The CONTEXT.md framing implied user-facing surfaces (sitemap, JSON-LD, redirects); the chat-context JSON is a different surface that was overlooked. Plan must include this patch.

## Common Pitfalls

### Pitfall 1: Astro Content Cache Stale After Rename
**What goes wrong:** `crypto-breakout-trader.mdx` renamed to `daytrade.mdx`, but `astro dev` (or `astro build`) still serves the old route, OR the new route 404s while old still resolves.
**Why it happens:** `.astro/data-store.json` (~37 KB on this project) caches resolved entries. The glob loader uses `github-slugger` to derive `entry.id` from filename; rename changes the id, but the cache still has the old entry until `astro sync` (or any build command) regenerates it.
**How to avoid:** After `git mv`, run `pnpm check` (which runs `astro check` → triggers content sync). If problems persist, `rm -rf .astro/` and rebuild.
**Warning signs:** Dev server logs `Found duplicate entry id: …` or static build emits both `dist/projects/crypto-breakout-trader/` AND `dist/projects/daytrade/` directories.

### Pitfall 2: Frontmatter Drift From Round-Trip
**What goes wrong:** Sync script parses MDX frontmatter via `gray-matter` for the `source:` field, then serializes the full frontmatter back to disk. Strings get re-quoted (single → double, double → unquoted, or vice versa), arrays get reformatted (multi-line → flow style). The next `git diff` shows 30 lines of frontmatter churn alongside the 1 line of body change.
**Why it happens:** YAML serializers are deterministic but their style choices rarely match the original author's hand-formatted style.
**How to avoid:** **Read frontmatter as a byte range, not a parsed object.** Find the `\n---\n` delimiter, slice `[0, fmEnd]`, write back the slice verbatim. Parse only the `source:` field via single-line regex (Code Examples §3).
**Warning signs:** `git diff` after first sync run shows changes outside the body (any `---` line, any `title:` / `tagline:` / `techStack:` line). If this happens, you've round-tripped — don't.

### Pitfall 3: Fence Extraction Eats Code Blocks Containing the Comment Pattern
**What goes wrong:** `Projects/<n>-<NAME>.md` has a code block below the fence containing the literal text `<!-- CASE-STUDY-START -->` (e.g., as part of a HTML example). The regex matches the inner instance, splits the file at the wrong point.
**Why it happens:** Naive regex doesn't respect Markdown code-fence boundaries.
**How to avoid:** The fenced block is at the TOP of `Projects/*.md` (after H1 + intro paragraph). Use `indexOf` for the FIRST occurrence of `<!-- CASE-STUDY-START -->` and the FIRST subsequent occurrence of `<!-- CASE-STUDY-END -->`. If the file is authored correctly (fence at top, all code blocks below the END marker), this is robust. **Documented author convention** (in `CONTENT-SCHEMA.md` §2): fence MUST appear before any fenced code block in the file.
**Warning signs:** Word count print line shows wildly wrong number (5 words, or 5000 words) for a single file.

### Pitfall 4: CRLF vs LF Line Endings on Windows
**What goes wrong:** Author edits `Projects/*.md` on Windows, file is saved with CRLF. Sync script writes MDX with LF. `git diff` shows every line as changed. Or, alternatively, sync writes CRLF on Windows and CI (Linux) sees a churn diff every PR.
**Why it happens:** Node's `fs.readFile/writeFile` preserves whatever encoding the file has on disk; mixing CRLF source and LF target causes diff noise.
**How to avoid:** **Normalize to LF on read** — `content.replace(/\r\n/g, "\n")` before slicing/comparing/writing. The repo's `.gitattributes` (if not already) should set `* text=auto eol=lf` to keep git itself consistent. Alternatively, set git config `core.autocrlf=input` on Windows. Verify the script writes LF unconditionally regardless of platform.
**Warning signs:** First sync after switching machines produces 100+ line diff with `^M` characters or `\r\n` markers. CI passes locally, fails in GitHub Actions (or vice versa).

### Pitfall 5: D-26 Chat Regression Gate Not Run After portfolio-context.json Edit
**What goes wrong:** Daytrade rename ships, the chat widget produces "I don't know about Crypto Breakout Trader" or hallucinates because the system prompt still says one thing and the project name said another.
**Why it happens:** `src/pages/api/chat.ts` imports `portfolio-context.json`. Any edit to that file is a chat surface change, even though it's outside `chat.ts` itself.
**How to avoid:** Plan explicitly includes a D-26 task: after `portfolio-context.json` patch, run the Phase 7 regression battery + manual smoke ("what did Jack build for Daytrade?" must work).
**Warning signs:** Chat widget returns 500 / hallucinates on Daytrade-related queries on the staging deploy.

### Pitfall 6: Hand-Authored MDX Body Edits Get Stomped by Next Sync
**What goes wrong:** Jack hand-edits `seatwatch.mdx` body to fix a typo. Next time anyone runs `pnpm sync:projects`, the sync overwrites the typo fix with the (still-typo'd) source.
**Why it happens:** D-14 explicitly chose CI drift gate over precommit hook. The system relies on CI failing to catch this AFTER the edit ships to a branch.
**How to avoid:** Document loudly in `CONTENT-SCHEMA.md` §3 (Author Workflow): **never edit MDX body directly. Edit `Projects/*.md` between the fence, then run sync.** Add a comment at the top of every MDX body emitted by sync: `<!-- AUTOGENERATED FROM Projects/<n>-<NAME>.md ABOVE THE CASE-STUDY FENCE. EDIT THERE, NOT HERE. -->`.
**Warning signs:** CI `--check` step fails on a PR with no apparent source change.

### Pitfall 7: `source:` Field Validation Happens at Wrong Layer
**What goes wrong:** D-15 says Zod `source: z.string()` + sync script verifies file exists on disk. A future contributor adds a file-system check inside the Zod schema (via `.refine()` calling `fs.existsSync`), which works locally but breaks in build environments where the working directory differs from project root.
**Why it happens:** Zod schemas run inside Astro's build pipeline with no guaranteed CWD relationship to project root. `fs.existsSync("Projects/...")` may resolve relative to `dist/`, `.astro/`, or anywhere.
**How to avoid:** **Zod validates string shape only.** File-existence check lives in `scripts/sync-projects.mjs` (which always runs from project root). Document this split in `CONTENT-SCHEMA.md` §1.
**Warning signs:** `astro check` fails locally but passes in CI (or vice versa).

## Code Examples

### §1: Zod Schema Extension (one-line addition)

```typescript
// src/content.config.ts (after edit)
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string().max(80),
      description: z.string(),
      techStack: z.array(z.string()).min(1),
      featured: z.boolean().default(false),
      status: z.enum(["completed", "in-progress"]),
      githubUrl: z.url().optional(),
      demoUrl: z.url().optional(),
      thumbnail: image().optional(),
      category: z.enum(["web-app", "cli-tool", "library", "api", "other"]),
      order: z.number().int().min(1),
      year: z.string().regex(/^\d{4}$/),
      source: z.string(), // ← NEW: D-15. File existence validated by sync script, not Zod.
    }),
});

export const collections = { projects };
```

[VERIFIED: matches existing `src/content.config.ts` line-for-line; only addition is line 21]

### §2: Fenced Block Marker Convention (in `Projects/*.md`)

```markdown
# SeatWatch

A multi-service SaaS platform that monitors restaurant availability...

<!-- CASE-STUDY-START -->

## Problem

High-demand restaurants release reservations at specific times...

## Approach & Architecture

I architected SeatWatch as a Turborepo monorepo with three independently...

## Tradeoffs

The dual-strategy fallback adds latency on the rare paths but...

## Outcome

SeatWatch handles approximately fifty parallel user sessions...

## Learnings

The hardest problem was the distributed booking lock...

<!-- CASE-STUDY-END -->

## Architecture (FULL TECHNICAL REFERENCE)

A Turborepo monorepo with four independently deployed applications...

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 22 LTS |
...
```

**Convention rules (document in CONTENT-SCHEMA.md §2):**
- Fence MUST appear in `Projects/*.md` BEFORE any code fence (` ``` `) to avoid extraction edge cases.
- Both `<!-- CASE-STUDY-START -->` and `<!-- CASE-STUDY-END -->` must each appear exactly once. Sync script will hard-error if zero or two-plus matches found.
- The five H2s inside the fence MUST be in the order locked by D-01: Problem, Approach & Architecture, Tradeoffs, Outcome, Learnings. (Sync script issues stderr warning if not — does NOT fail per D-16.)

### §3: `scripts/sync-projects.mjs` — Full Skeleton (~180 LOC)

```javascript
#!/usr/bin/env node
/**
 * scripts/sync-projects.mjs
 *
 * Source-of-truth sync: extracts the fenced case-study block from
 * Projects/<n>-<NAME>.md and writes it as the body of the
 * src/content/projects/<slug>.mdx file pointed to by frontmatter `source:`.
 *
 * Usage:
 *   node scripts/sync-projects.mjs            (write mode; D-13)
 *   node scripts/sync-projects.mjs --check    (CI mode; D-14, exit 1 on drift)
 *
 * Frontmatter is preserved BYTE-FOR-BYTE (D-12). Only the body is rewritten.
 * Word count is printed for each file (D-16, soft warning at <600 or >900).
 *
 * Failure modes (D-17 §4): see CONTENT-SCHEMA.md.
 */

import { readFile, writeFile, access } from "node:fs/promises";
import { glob } from "node:fs/promises";  // Node 22+ has fs.glob
import { join, basename } from "node:path";

const CHECK_MODE = process.argv.includes("--check");
const PROJECT_ROOT = process.cwd();
const MDX_GLOB = "src/content/projects/*.mdx";
const FENCE_START = "<!-- CASE-STUDY-START -->";
const FENCE_END = "<!-- CASE-STUDY-END -->";
const EXPECTED_H2S = [
  "Problem", "Approach & Architecture", "Tradeoffs", "Outcome", "Learnings",
];
const WORD_TARGET_MIN = 600;
const WORD_TARGET_MAX = 900;

/**
 * Normalize CRLF to LF (Pitfall 4).
 */
const normalize = (s) => s.replace(/\r\n/g, "\n");

/**
 * Parse just the `source:` field from a frontmatter block.
 * Returns the unquoted string value, or null if not found.
 */
function readSourceField(frontmatterBlock) {
  const m = frontmatterBlock.match(/^source:\s*"?([^"\n]+?)"?\s*$/m);
  return m ? m[1].trim() : null;
}

/**
 * Slice a MDX file into [frontmatterBlock, body].
 * frontmatterBlock includes the leading and trailing `---\n` lines.
 * Throws if no closing `---` found.
 */
function sliceFrontmatter(mdx) {
  if (!mdx.startsWith("---\n")) {
    throw new Error("MDX missing opening frontmatter delimiter");
  }
  const closeIdx = mdx.indexOf("\n---\n", 4);
  if (closeIdx === -1) {
    throw new Error("MDX missing closing frontmatter delimiter");
  }
  const fmEnd = closeIdx + 5; // include "\n---\n"
  return {
    frontmatterBlock: mdx.slice(0, fmEnd),
    body: mdx.slice(fmEnd),
  };
}

/**
 * Extract content between fence markers from a Projects/*.md source.
 * Throws if either marker is missing or appears multiple times.
 */
function extractFence(sourceContent, sourceLabel) {
  const startCount = sourceContent.split(FENCE_START).length - 1;
  const endCount = sourceContent.split(FENCE_END).length - 1;
  if (startCount === 0) {
    throw new Error(`${sourceLabel}: missing ${FENCE_START}`);
  }
  if (endCount === 0) {
    throw new Error(`${sourceLabel}: missing ${FENCE_END}`);
  }
  if (startCount > 1 || endCount > 1) {
    throw new Error(`${sourceLabel}: fence markers must each appear exactly once (found start=${startCount} end=${endCount})`);
  }
  const startIdx = sourceContent.indexOf(FENCE_START) + FENCE_START.length;
  const endIdx = sourceContent.indexOf(FENCE_END);
  if (endIdx < startIdx) {
    throw new Error(`${sourceLabel}: ${FENCE_END} appears before ${FENCE_START}`);
  }
  return sourceContent.slice(startIdx, endIdx).trim();
}

/**
 * Count whitespace-separated words, excluding fenced code blocks.
 */
function wordCount(body) {
  // Strip fenced code blocks (``` to ```)
  const stripped = body.replace(/```[\s\S]*?```/g, "");
  return stripped.split(/\s+/).filter(Boolean).length;
}

/**
 * Soft H2 shape check (Pattern 4).
 */
function checkH2Shape(body, slug) {
  const matches = body.match(/^## (.+)$/gm);
  const actual = matches ? matches.map((s) => s.slice(3).trim()) : [];
  const ok = actual.length === EXPECTED_H2S.length &&
             EXPECTED_H2S.every((e, i) => actual[i] === e);
  if (!ok) {
    process.stderr.write(
      `${slug}.mdx: H2 shape mismatch.\n  expected=${JSON.stringify(EXPECTED_H2S)}\n  actual=${JSON.stringify(actual)}\n`,
    );
  }
}

async function syncOne(mdxPath) {
  const slug = basename(mdxPath, ".mdx");
  const mdxRaw = normalize(await readFile(mdxPath, "utf8"));
  const { frontmatterBlock, body: oldBody } = sliceFrontmatter(mdxRaw);

  const sourcePath = readSourceField(frontmatterBlock);
  if (!sourcePath) {
    throw new Error(`${slug}.mdx: frontmatter missing required \`source:\` field`);
  }

  const absSource = join(PROJECT_ROOT, sourcePath);
  try {
    await access(absSource);
  } catch {
    throw new Error(`${slug}.mdx: source file not found at ${sourcePath}`);
  }

  const sourceContent = normalize(await readFile(absSource, "utf8"));
  const newBody = extractFence(sourceContent, sourcePath);

  // Assemble: frontmatter (verbatim) + newline + extracted body + trailing newline.
  const newMdx = frontmatterBlock + "\n" + newBody + "\n";

  const words = wordCount(newBody);
  checkH2Shape(newBody, slug);

  if (mdxRaw === newMdx) {
    return { slug, changed: false, words };
  }

  if (CHECK_MODE) {
    process.stderr.write(`drift detected in ${slug}.mdx\n`);
    return { slug, changed: true, drift: true, words };
  }

  await writeFile(mdxPath, newMdx, "utf8");
  return { slug, changed: true, words };
}

async function main() {
  const mdxFiles = [];
  for await (const f of glob(MDX_GLOB)) mdxFiles.push(f);
  mdxFiles.sort();

  let driftFound = false;
  let errorCount = 0;

  for (const mdxPath of mdxFiles) {
    try {
      const r = await syncOne(mdxPath);
      const wordTag = (r.words >= WORD_TARGET_MIN && r.words <= WORD_TARGET_MAX)
        ? "OK"
        : (r.words < WORD_TARGET_MIN ? `under ${WORD_TARGET_MIN}` : `exceeds ${WORD_TARGET_MAX}`);
      const verb = r.changed ? (CHECK_MODE ? "would update" : "updated") : "unchanged";
      process.stdout.write(`${r.slug}.mdx: ${verb}, ${r.words} words (${wordTag})\n`);
      if (r.drift) driftFound = true;
    } catch (err) {
      process.stderr.write(`ERROR ${basename(mdxPath)}: ${err.message}\n`);
      errorCount += 1;
    }
  }

  if (errorCount > 0) process.exit(2);
  if (CHECK_MODE && driftFound) process.exit(1);
  process.exit(0);
}

await main();
```

**Notes on the skeleton:**
- Uses `fs.glob` from Node 22 (no `glob` npm dep needed). [VERIFIED: Node 22 LTS ships `fs.glob` as stable; engines.node ≥22 already required by Astro 6]
- Three exit codes: `0` (success), `1` (drift in --check), `2` (error / hard failure). Documented in CONTENT-SCHEMA.md §4.
- Word-count printing matches D-16 example format: `seatwatch.mdx: updated, 847 words (OK)`.
- Hand-rolled frontmatter slicing (Pattern 1) — no `gray-matter`, no YAML parser.
- `normalize()` on every read (Pitfall 4); `writeFile` writes LF unconditionally (default for `\n`-joined strings).

### §4: `package.json` Script Wiring

Add two entries to the `scripts` block:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "wrangler types && astro check && astro build && node scripts/pages-compat.mjs",
    "types": "wrangler types",
    "preview": "astro preview",
    "check": "astro check",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "test": "vitest run",
    "astro": "astro",
    "sync:projects": "node scripts/sync-projects.mjs",
    "sync:check": "node scripts/sync-projects.mjs --check"
  }
}
```

[VERIFIED: matches existing `package.json` lines 9–20; additions are last two lines]

### §5: GitHub Actions Workflow (NEW — `.github/workflows/sync-check.yml`)

```yaml
name: Sync Drift Check

on:
  pull_request:
    paths:
      - "Projects/**"
      - "src/content/projects/**"
      - "scripts/sync-projects.mjs"
  push:
    branches:
      - main

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Verify Projects/ <-> MDX sync is clean
        run: pnpm sync:check
```

**Notes:**
- Only runs on changes to relevant paths (cheap default).
- Also runs on `push` to `main` (catches anything that slipped through PR review).
- `pnpm install --frozen-lockfile` honors v1.2 zero-new-deps gate (no opportunistic updates).
- Failure on `pnpm sync:check` (exit 1) blocks the PR check.
- `.github/` directory does NOT yet exist in this repo — first creation is part of this phase.

### §6: `docs/CONTENT-SCHEMA.md` Skeleton (D-17, four sections)

```markdown
# Content Schema

Authoritative reference for the project content pipeline. If anything here
disagrees with `src/content.config.ts` or `scripts/sync-projects.mjs`, code wins
and this doc is wrong; file an issue.

## 1. Frontmatter Schema (Zod)

Every `src/content/projects/*.mdx` file has frontmatter validated by Zod at
build time via `astro check`. Fields:

| Field | Type | Constraint | Example |
|-------|------|------------|---------|
| title | string | required | "SeatWatch" |
| tagline | string | required, ≤ 80 chars | "Automated restaurant reservations…" |
| description | string | required | "A multi-service SaaS platform that…" |
| techStack | string[] | required, min 1 item | ["TypeScript", "React", …] |
| featured | boolean | default false | true |
| status | enum | "completed" \| "in-progress" | "completed" |
| githubUrl | URL | optional | "https://github.com/…" |
| demoUrl | URL | optional | "https://seat.watch" |
| thumbnail | image() | optional | (image asset) |
| category | enum | "web-app" \| "cli-tool" \| "library" \| "api" \| "other" | "web-app" |
| order | integer | required, ≥ 1 | 1 |
| year | string | required, regex /^\d{4}$/ | "2025" |
| source | string | required (D-15) | "Projects/1 - SEATWATCH.md" |

The `source` field is validated for **string shape only** at build time. File
existence is verified by `scripts/sync-projects.mjs` at sync time (different
working directory guarantees — see Pitfall 7).

## 2. Sync Contract

`Projects/<n>-<NAME>.md` is the authoritative source for every case-study body.
The case study lives in a fenced block at the top of the file:

…(fence convention from §2 Code Examples)…

Five H2s required, in this exact order:
1. Problem
2. Approach & Architecture
3. Tradeoffs
4. Outcome
5. Learnings

Target length: 600–900 words (soft target; warning only).

What sync writes: the MDX body (everything after the closing `---` of frontmatter).
What sync leaves alone: the entire frontmatter block.

## 3. Author Workflow

1. Edit `Projects/<n>-<NAME>.md` between the fence markers. Edit nothing else.
2. Run `pnpm sync:projects`.
3. Run `git diff` — review only the body change in the affected `.mdx` file.
4. Run `pnpm check` — confirms `astro check` still passes (Zod intact).
5. Commit `Projects/<n>-<NAME>.md` and `src/content/projects/<slug>.mdx` together.

**Do NOT edit `src/content/projects/*.mdx` body content directly.** Hand-edits
will be silently overwritten on the next sync. The CI drift gate
(`pnpm sync:check` on PR) catches cases where the MDX body diverges from the
source. Frontmatter edits ARE allowed and persist (sync preserves frontmatter
byte-for-byte).

**Resume PDF workflow (D-19):** The resume source document lives in
`<external location — Google Doc URL>`. To update:
1. Edit in source doc.
2. Export to PDF.
3. Replace `public/jack-cutrara-resume.pdf` with the new export.
4. Commit the binary; verify file size hasn't ballooned unexpectedly.

## 4. Failure-Mode Matrix

| Error | Where Emitted | Fix |
|-------|---------------|-----|
| `MDX missing opening frontmatter delimiter` | sync, exit 2 | Ensure file starts with `---\n` |
| `MDX missing closing frontmatter delimiter` | sync, exit 2 | Ensure frontmatter has matching closing `---\n` |
| `<slug>.mdx: frontmatter missing required \`source:\` field` | sync, exit 2 | Add `source: "Projects/<n>-<NAME>.md"` to frontmatter |
| `<slug>.mdx: source file not found at <path>` | sync, exit 2 | Either the `source:` value is wrong or the source file was renamed. Fix one. |
| `<source>: missing <!-- CASE-STUDY-START -->` | sync, exit 2 | Add fence start marker to source file |
| `<source>: missing <!-- CASE-STUDY-END -->` | sync, exit 2 | Add fence end marker to source file |
| `<source>: fence markers must each appear exactly once` | sync, exit 2 | Source has nested or duplicate markers; clean up |
| `<source>: <!-- CASE-STUDY-END --> appears before <!-- CASE-STUDY-START -->` | sync, exit 2 | Markers are out of order; reorder |
| `<slug>.mdx: H2 shape mismatch` | sync, stderr (warning, exit 0) | Adjust H2 headings inside the fence to match D-01 (do not fail build) |
| `<slug>.mdx: <N> words (under 600 \| exceeds 900)` | sync, stdout (warning, exit 0) | Tighten or expand prose; soft target only |
| `drift detected in <slug>.mdx` | sync --check, exit 1 | Run `pnpm sync:projects` locally and commit the result |
| Zod validation error | `astro check`, build fails | Fix the failing field per Zod error message |
```

### §7: `docs/VOICE-GUIDE.md` Skeleton (D-09, D-10, D-11)

```markdown
# Voice Guide

The site speaks in Jack's voice. The chat widget speaks ABOUT Jack.

## Voice by Surface

| Surface | Person | Tense | Tone |
|---------|--------|-------|------|
| About page | First | Present (current self) + past (work) | Direct, plain |
| Homepage hero / lead | First | Present (positioning) | Confident, restrained |
| MDX case studies | First | Past (shipped work) | Engineering-journal |
| Resume PDF | First | Past (achievements) | Standard resume conventions |
| Chat widget responses | **Third** | Past + present | Helpful third-party assistant (see Phase 14) |

## Engineering-Journal Tone (Case Studies)

Reference: `src/content/projects/seatwatch.mdx` post-Phase 13 rewrite is the
canonical example.

- **Concrete numbers, not adjectives.** "48,000 lines of TypeScript" beats
  "large codebase."
- **Named systems.** "the dual-strategy booking engine" beats "an advanced
  booking system."
- **Tradeoffs visible.** Don't paper over compromises; they're load-bearing.
- **Lessons surfaced.** Every case study ends on what changed in your head,
  not what shipped.

## The Four Hard Rules (D-11)

### Rule 1: No hype / AI-tells banlist

Never use the following without a specific, on-page justification:

- revolutionary
- seamless
- leverage (as a verb)
- robust
- scalable (unless paired with a number — "scalable to 50 concurrent users")
- "dive deeper"
- "elevate"
- "supercharge"
- emoji of any kind in body prose
- em-dash abuse: max one em-dash per paragraph; prefer commas / semicolons / periods

### Rule 2: Numbers or don't claim it

Every performance, scale, reliability, or quality claim requires a number or
must be removed.

| Don't write | Do write |
|-------------|----------|
| "Lightning fast" | "Sub-second p99 response time" or delete |
| "Highly available" | "99.9% uptime over 6 months" or delete |
| "Robust error handling" | "Handles 14 distinct failure modes (see code)" or delete |
| "Battle-tested" | "Processed 2,400 real bookings in production" or delete |

### Rule 3: Past tense for shipped work

| Don't write | Do write |
|-------------|----------|
| "I build production systems" (about completed work) | "I built …" |
| "The system handles distributed locks" (when complete) | "The system handled …" |
| "Each request validates input" (when shipped) | "Each request validated input" |

Present tense is reserved for active / ongoing work and timeless system
descriptions ("The architecture separates concerns…").

### Rule 4: Named systems over abstractions

| Don't write | Do write |
|-------------|----------|
| "an advanced booking system" | "the dual-strategy booking engine" |
| "smart caching" | "the per-user identity cache" |
| "a rate limiter" | "the token-bucket rate limiter" |
| "error recovery" | "the per-symbol circuit breaker" |

Every non-trivial subsystem gets a proper noun. The proper noun appears in code
(class name, file name, log line) so readers can grep from the prose to the
implementation.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `gray-matter` for frontmatter parsing in custom Node scripts | Hand-rolled byte-range slicing | Pre-2026 fad → 2026 simplicity | Zero deps, frontmatter preserved byte-for-byte |
| Custom `glob` package | `fs.glob` (Node 22) | Stable in Node 22 LTS | Zero deps |
| Astro Legacy Content Collections (`src/content/<collection>/<file>`) | Content Layer API + `glob()` loader (Astro 5+, required in Astro 6) | Astro 6 dropped legacy | Already migrated [VERIFIED: src/content.config.ts uses `glob({ ... })`] |
| `commander` / `yargs` for tiny CLIs | `process.argv.includes("--flag")` | Always was sufficient for single-flag scripts | Zero deps |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `fs.glob` is stable in Node 22 LTS | Code Examples §3 | Sync script throws ImportError. Mitigation: fall back to a 10-line `readdir`+filter loop. [LOW risk — Node 22 docs confirm `fs.glob` is stable; node_modules has Node 22 already in use] |
| A2 | `.astro/data-store.json` is regenerated by `astro check` after a content file rename | Pitfalls §1 | Stale routes persist. Mitigation: explicit `rm -rf .astro/` step in rename plan. [VERIFIED indirectly: cache exists; Astro docs say "restart dev server or sync content layer" for schema changes; rename of a single file is a milder change] |
| A3 | The `<!-- CASE-STUDY-START -->` substring will not naturally appear inside fenced code blocks in `Projects/*.md` | Pitfalls §3 | Wrong content extracted. Mitigation: documented author convention; fence appears at top of file before any code blocks. [LOW risk — checked all 6 source files; no occurrences] |
| A4 | The fenced HTML comment will round-trip through MDX rendering unchanged | Pattern 1 | Rendered MDX has visible `<!-- CASE-STUDY-START -->` text. **CRITICAL**: only the body BETWEEN the fences is extracted; the fence markers themselves are NOT written into the MDX. They live ONLY in `Projects/*.md`. [VERIFIED by reading the skeleton in §3 — `slice(startIdx, endIdx)` excludes both markers] |
| A5 | The chat-context smoke test for "Daytrade" question is sufficient verification of the rename's chat impact | Runtime State Inventory | Subtle prompt-cache or system-prompt drift breaks chat in production. Mitigation: full Phase 7 regression battery per D-26. [MEDIUM risk — D-26 explicitly applies] |

## Open Questions (RESOLVED)

1. **`pnpm` vs `npm` lockfile in CI.** RESOLVED: Plan 02 Task 3 standardizes on pnpm 10 with `--frozen-lockfile` in the CI drift check; the planner verified pnpm is the project standard (engines + scripts). `package.json` has a `pnpm` block but no `pnpm-lock.yaml` was checked during research. The CI step assumes pnpm.
   - What we know: `package.json` has `pnpm.onlyBuiltDependencies` and the project uses `pnpm` in scripts ("pnpm sync:projects" referenced in CONTEXT.md).
   - What's unclear: whether `pnpm-lock.yaml` is committed (likely yes; not verified).
   - Recommendation: planner verifies `pnpm-lock.yaml` exists; if not, the CI step should `npm install` instead. Trivial to swap.

2. **Where does the resume's external source doc live?** RESOLVED: Plan 03 Task 1 documents D-19 as a `{TBD — fill at first resume update}` placeholder inside CONTENT-SCHEMA.md §3; Jack populates the concrete URL/path on first resume sync rather than blocking phase planning. D-19 says "Google Docs / LaTeX / external" — Jack must specify the actual URL/path so `CONTENT-SCHEMA.md` §3 can document it concretely.
   - Recommendation: planner adds a discuss-ask before the docs/CONTENT-SCHEMA.md draft task.

3. **Is `.gitattributes` committed with `* text=auto eol=lf`?** RESOLVED: Plan 02 Task 2 audits the file and creates it with `* text=auto eol=lf` if absent; the sync script's `normalize()` + unconditional LF write makes this defense-in-depth. Not verified; Pitfall 4 mitigation depends on it (or the script's `normalize()` and unconditional LF write covers it regardless).
   - Recommendation: planner adds `.gitattributes` audit to the sync-script task; create file if absent.

## Environment Availability

> Phase 13 has minimal external dependencies. All tools verified.

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | sync script runtime | ✓ | ≥22 LTS (engines.node) | — (hard requirement; Astro 6 needs it) |
| pnpm | `pnpm sync:projects` invocation | ✓ (assumed) | 10.x (referenced in tests/code) | `npm run sync:projects` works identically |
| Astro CLI | `astro check` post-rename validation | ✓ | 6.0.8 | — |
| Vitest | sync-script unit tests | ✓ | 4.1.0 | — |
| `git mv` | crypto-breakout-trader → daytrade rename with history | ✓ | (any) | Manual `git rm + git add` if needed |
| GitHub Actions | CI drift check | ✓ (assumed; repo on GitHub) | — | Cloudflare Pages build hooks; or skip CI gate (D-14 chose CI) |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

**Note on `.github/workflows/`:** directory does not yet exist in repo (verified: `ls .github/` → no such directory). Phase 13 creates it. This is the first GitHub Actions workflow in the project — verify Cloudflare Pages → GitHub repo connection allows Actions to run on PRs (it should, default behavior).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` (globals on; environment node; include `tests/**/*.test.ts`) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` (single mode) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | All 6 MDX bodies have content (non-empty body, no placeholder text) | unit | `pnpm vitest tests/content/case-studies-have-content.test.ts -x` | ❌ Wave 0 |
| CONT-02 | All 6 MDX bodies have 5 H2s in the locked D-01 order | unit | `pnpm vitest tests/content/case-studies-shape.test.ts -x` | ❌ Wave 0 |
| CONT-02 | All 6 MDX bodies fall in 600–900 word band (soft check; warn-not-fail acceptable per D-16) | unit | `pnpm vitest tests/content/case-studies-wordcount.test.ts -x` | ❌ Wave 0 |
| CONT-02 | None of the banlist words from D-11 Rule 1 appear in MDX bodies | unit | `pnpm vitest tests/content/voice-banlist.test.ts -x` | ❌ Wave 0 |
| CONT-03 | About copy exports remain non-empty strings; dated annotations present | unit | `pnpm vitest tests/client/about-data.test.ts -x` | ✅ exists; extend with annotation check |
| CONT-04 | Homepage `WorkRow` count matches `featured: true` count (3) and detail pages exist for all 6 | integration | `pnpm vitest tests/content/projects-collection.test.ts -x` | ❌ Wave 0 |
| CONT-04 | Resume PDF exists at `public/jack-cutrara-resume.pdf` and is under 1 MB | unit | `pnpm vitest tests/content/resume-asset.test.ts -x` | ❌ Wave 0 |
| CONT-05 | Every MDX `source:` value points to a file that exists in `Projects/` | unit | `pnpm vitest tests/content/source-files-exist.test.ts -x` | ❌ Wave 0 |
| CONT-06 | `scripts/sync-projects.mjs` parses frontmatter without re-serializing | unit | `pnpm vitest tests/scripts/sync-projects.test.ts -x` | ❌ Wave 0 |
| CONT-06 | `scripts/sync-projects.mjs` extracts fence content correctly (happy path + edge cases) | unit | `pnpm vitest tests/scripts/sync-projects.test.ts -x` | ❌ Wave 0 (same file) |
| CONT-06 | Sync is idempotent — second run produces zero writes | unit | `pnpm vitest tests/scripts/sync-projects-idempotency.test.ts -x` | ❌ Wave 0 |
| CONT-06 | `--check` mode exits 1 when drift exists, 0 otherwise | unit | `pnpm vitest tests/scripts/sync-projects-check.test.ts -x` | ❌ Wave 0 |
| CONT-06 | Zod schema accepts `source` field; rejects MDX without it | integration | `pnpm check` | ✅ existing build step |
| CONT-06 | After `crypto-breakout-trader.mdx` → `daytrade.mdx` rename, `dist/projects/daytrade/` exists; `dist/projects/crypto-breakout-trader/` does not | smoke (build) | `pnpm build && test -d dist/client/projects/daytrade && test ! -d dist/client/projects/crypto-breakout-trader` | ❌ manual check (acceptable; one-time) |
| CONT-07 | `docs/CONTENT-SCHEMA.md` exists and contains all four sections from D-17 | unit | `pnpm vitest tests/content/docs-content-schema.test.ts -x` | ❌ Wave 0 |
| CONT-07 | `docs/VOICE-GUIDE.md` exists and contains all four hard rules from D-11 | unit | `pnpm vitest tests/content/docs-voice-guide.test.ts -x` | ❌ Wave 0 |
| D-26 (cross-cutting) | Chat widget answers "Daytrade" project question correctly after `portfolio-context.json` patch | manual UAT | n/a (Phase 7 regression battery) | ✅ existing manual procedure |
| D-02 (cross-cutting) | `.planning/ROADMAP.md` line 69 reflects 5-H2 shape (not 6) | unit | `pnpm vitest tests/content/roadmap-amendment.test.ts -x` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm test` (full Vitest run; ~few seconds for unit suite)
- **Per wave merge:** `pnpm test && pnpm check && pnpm build` (test + Zod + full build)
- **Phase gate:** `pnpm test && pnpm check && pnpm build && pnpm sync:check` + manual UAT against `13-UAT.md` checklist + Phase 7 chat regression battery (D-26 trigger)

### Wave 0 Gaps

Test infrastructure exists; new test files needed for Phase 13:

- [ ] `tests/scripts/sync-projects.test.ts` — covers CONT-06 parser + extractor unit tests
- [ ] `tests/scripts/sync-projects-idempotency.test.ts` — covers CONT-06 idempotency invariant
- [ ] `tests/scripts/sync-projects-check.test.ts` — covers CONT-06 `--check` mode behavior
- [ ] `tests/content/case-studies-have-content.test.ts` — covers CONT-01 body non-emptiness
- [ ] `tests/content/case-studies-shape.test.ts` — covers CONT-02 H2 order
- [ ] `tests/content/case-studies-wordcount.test.ts` — covers CONT-02 word band (warn-not-fail mode)
- [ ] `tests/content/voice-banlist.test.ts` — covers CONT-02 / D-11 Rule 1
- [ ] `tests/content/projects-collection.test.ts` — covers CONT-04 featured count + detail page existence (uses `getCollection` from astro:content)
- [ ] `tests/content/resume-asset.test.ts` — covers CONT-04 resume file existence + size
- [ ] `tests/content/source-files-exist.test.ts` — covers CONT-05 source file integrity
- [ ] `tests/content/docs-content-schema.test.ts` — covers CONT-07 (existence + four-heading check)
- [ ] `tests/content/docs-voice-guide.test.ts` — covers CONT-07 (existence + four-rule check)
- [ ] `tests/content/roadmap-amendment.test.ts` — covers D-02 (regex-checks `.planning/ROADMAP.md` line for 5-H2 shape)

Framework install: **none required** — Vitest 4.1.0 already installed and configured. Existing tests in `tests/api/` and `tests/client/` provide patterns to copy.

**Manual UAT (per D-18):** Wave 0 also produces `13-UAT.md` enumerating every copy surface for Jack signoff:
- Homepage display hero ("JACK CUTRARA" + lead)
- Homepage status dot ("AVAILABLE FOR WORK")
- Homepage meta label ("EST. 2026 · NORTHERN VA")
- Homepage 3 work-list rows (titles + tech stacks for SeatWatch, NFL Prediction, SolSniper)
- Homepage about strip (`ABOUT_INTRO` + `ABOUT_P1`)
- About page full narrative (`ABOUT_INTRO` + `ABOUT_P1` + `ABOUT_P2` + `ABOUT_P3`)
- Each of 6 project detail pages (title, tagline, year, tech stack, full body, links)
- Resume PDF page-by-page (1–2 pages typical)
- Contact section links (email, GitHub, LinkedIn)

## Security Domain

Phase 13 is a content + build-tooling phase with no new authentication, session management, access control, or cryptographic surfaces. Most ASVS categories don't apply. The two that do:

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | (no auth surface) |
| V3 Session Management | no | (no sessions) |
| V4 Access Control | no | (public static content) |
| V5 Input Validation | yes | Zod for frontmatter (already in use); sync script validates fence + source-file existence |
| V6 Cryptography | no | (no crypto surface) |
| V7 Error Handling / Logging | yes | Sync script emits typed errors with clear stderr messages (D-17 §4 failure-mode matrix); no secrets in logs |
| V12 File Handling | yes | Sync script reads files inside project root; never writes outside `src/content/projects/` |

### Known Threat Patterns for Node Build Scripts

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal in `source:` field (e.g., `source: "../../../../etc/passwd"`) | Tampering | Resolve `source` relative to project root + verify final path is INSIDE project root before reading. Add to script: `if (!absSource.startsWith(PROJECT_ROOT)) throw …` |
| Code injection via fenced content (e.g., MDX expression `{eval('…')}`) | Tampering | Out of scope — MDX expressions are by design; Jack authors all `Projects/*.md` content. No untrusted user input. |
| Sensitive content leak in `Projects/*.md` (API keys, credentials embedded in case study) | Information Disclosure | Manual review during case-study authoring. Optional: add a banlist regex check in sync script for high-entropy strings. **Recommendation:** out of scope for Phase 13; deferred. |
| `portfolio-context.json` exposes resume PII | Information Disclosure | Already addressed by Phase 14 CHAT-06 (refusal logic); Phase 13 doesn't change the JSON's structure, only the project block content. |
| GitHub Actions workflow runs untrusted code from PR fork | Tampering | Default `pull_request` event uses base-branch workflow file (safe). Don't use `pull_request_target` (would be unsafe). |

**Recommended addition to sync-projects.mjs:** path-traversal guard.
```javascript
// After resolving absSource, before fs.access:
if (!absSource.startsWith(PROJECT_ROOT + path.sep) && absSource !== PROJECT_ROOT) {
  throw new Error(`${slug}.mdx: source path escapes project root: ${sourcePath}`);
}
```

## Sources

### Primary (HIGH confidence)
- `.planning/phases/13-content-pass-projects-sync/13-CONTEXT.md` — 19 locked decisions D-01 through D-19 [READ]
- `.planning/REQUIREMENTS.md` — CONT-01 through CONT-07 specification [READ]
- `.planning/ROADMAP.md` — Phase 13 entry, success criteria [READ; line 69 confirmed for D-02 amendment]
- `src/content.config.ts` — current Zod schema [READ]
- `src/content/projects/*.mdx` (6 files) — current MDX bodies [READ all 6]
- `src/data/about.ts` — current About copy exports [READ]
- `src/data/portfolio-context.json` — chat context, contains old slug references [READ]
- `src/pages/index.astro` — homepage WorkRow + about strip [READ]
- `src/pages/about.astro` — about page consumer [READ]
- `src/pages/projects/[id].astro` — project detail route, uses `project.id` (filename-derived) [READ]
- `src/pages/api/chat.ts` — imports `portfolio-context.json` (D-26 trigger) [READ first 30 lines]
- `astro.config.mjs` — confirms Astro 6 setup [READ]
- `vitest.config.ts` — test framework configuration [READ]
- `package.json` — verified versions, scripts block, engines [READ]
- `Projects/1 - SEATWATCH.md`, `Projects/4 - OPTIMIZE_AI.md`, `Projects/6 - DAYTRADE.md` — content depth + structure [READ samples + word counts of all 6]

### Secondary (MEDIUM confidence)
- [Astro 6 Content Collections — glob loader docs](https://docs.astro.build/en/guides/content-collections/) — confirms ID derivation from filename [WebFetch]
- [Astro Content Loader Reference](https://docs.astro.build/en/reference/content-loader-reference/) — confirms `github-slugger` slug logic, no persistent ID mapping [WebFetch]

### Tertiary (LOW confidence)
- None — all material claims verified against shipped code or official Astro docs.

## Project Constraints (from CLAUDE.md)

These project-level directives apply to Phase 13 work:

- **Tech stack:** Astro 6, Tailwind v4 (Oxide), Content Collections + Zod, MDX, Node 22 LTS — confirmed in research; no deviations.
- **v1.2 milestone gate:** zero new runtime deps (devdeps OK if necessary). **Phase 13 introduces zero of either** on the recommended path.
- **Conventions:** type-role classes in `src/styles/global.css`, no Tailwind utilities in primitives, single light theme — Phase 13 doesn't touch CSS or primitives; renders existing MDX through the existing pipeline.
- **All UI/UX decisions route through frontend-design skill** — N/A for Phase 13 (content + script work, no visual changes).
- **GSD workflow enforcement:** all edits go through `/gsd:execute-phase`. Research phase complete; execute via `/gsd-execute-phase` after planning.
- **D-26 Chat Regression Gate** (cross-phase from milestones/v1.1): triggered by `src/data/portfolio-context.json` edit; plan MUST include the regression battery as a phase-gate task.
- **Lighthouse CI Gate** (every phase): Performance ≥99 / A11y ≥95 / BP 100 / SEO 100. Phase 13 expected to hold gate easily (no JS changes, no asset additions beyond resume PDF).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every tool verified installed at expected version; zero new deps.
- Architecture: HIGH — sync script design is well-understood pattern; CONTEXT.md decisions cover the design space.
- Pitfalls: HIGH — derived from concrete file inspection (CRLF on Windows env, .astro cache existence verified, hardcoded slug references grep-confirmed).
- Validation: HIGH — Vitest infrastructure exists; new test file gaps explicit and trivial.
- Content authoring strategy: MEDIUM — final case-study quality depends on Jack's redline cycle (D-07 explicit acceptance); Claude can produce solid drafts but the human-in-the-loop is load-bearing.

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30-day estimate; tooling/content domain is stable; only risk is an Astro 6.x patch release that changes content cache behavior — low likelihood)
