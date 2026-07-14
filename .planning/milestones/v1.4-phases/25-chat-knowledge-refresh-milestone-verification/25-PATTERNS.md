# Phase 25: Chat Knowledge Refresh & Milestone Verification - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 12 (1 build script, 2 data sources, 3 MDX frontmatter, 2 prompt/type, 4 tests) + 1 regenerated artifact
**Analogs found:** 12 / 12 (every change site has an in-repo analog — this is an extend-existing-patterns phase, no greenfield files)

> This phase creates **no new files**. Every edit extends an existing pattern already present in the same file or a sibling. The planner should lift the analog excerpts below directly into `<read_first>` and `<action>` targets. Line numbers are from the source read this session and match RESEARCH.md's citations.

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `scripts/build-chat-context.mjs` | build script (Node .mjs) | transform / file-I/O → JSON emit | itself (existing `buildProjectBlock` + `parseAboutChatExports` + `checkFirstPersonLeaks` patterns) | exact (self-analog) |
| `src/data/about-chat.ts` | data / copy module | static export | itself (existing `ABOUT_CHAT_*` constants) | exact (self-analog) |
| `src/data/portfolio-context.static.json` | config / hand-curated identity | static merge input | itself (existing `personal`/`education`/`skills` keys) | exact (self-analog) |
| `src/content/projects/multi-chain-evm.mdx` | content frontmatter | ingestion source | `src/content/projects/solsniper.mdx` (or any of 6 siblings with `chatSummary`) | exact |
| `src/content/experience/holloway.mdx` | content frontmatter | ingestion source | `src/content/projects/*.mdx` `chatSummary` (voice) + its own `summary`/`highlights` (content) | role-match |
| `src/content/experience/balfour-beatty.mdx` | content frontmatter | ingestion source | `holloway.mdx` chatSummary (one-liner variant) | role-match |
| `src/prompts/portfolio-context-types.ts` | type contract | interface | itself (existing `experience: string` + `education` sub-type) | exact (self-analog) |
| `src/prompts/system-prompt.ts` | prompt template | string template | itself (existing ban line 56 + audience line 5) | exact (self-analog) |
| `tests/build/chat-context-integrity.test.ts` | test | assertion | itself (6→7 slug/count + #7-ban invert) | exact (self-analog) |
| `tests/build/chat-knowledge-voice.test.ts` | test | assertion | its own experience-string assertion → array walk | exact (self-analog) |
| `tests/api/prompt-injection.test.ts` | test | assertion | its own multi-dex-ban + count assertions | exact (self-analog) |
| `tests/fixtures/chat-eval-dataset.ts` | test fixture | data | its own `groundedQA` anchors | exact (self-analog) |

---

## Pattern Assignments

### `scripts/build-chat-context.mjs` — experience-collection reader (NEW code, D-01/D-09)

**Analog for the reader:** the existing projects glob + per-block read loop.

**Glob + loop pattern** (`scripts/build-chat-context.mjs:43`, `:442-513`):
```js
const MDX_GLOB = "src/content/projects/*.mdx";
// ...
for (const mdxPath of mdxFiles) {
  const mdxRaw = normalize(await readFile(mdxPath, "utf8"));
  const { frontmatterBlock } = sliceFrontmatter(mdxRaw);   // from sync-projects.mjs
  const title = readStringField(frontmatterBlock, "title");
  // ...
}
```
**Field reader analog** (`buildProjectBlock`, `:381-390`):
```js
const title = readStringField(frontmatterBlock, "title");
const tech  = readArrayField(frontmatterBlock, "techStack");
const chatSummary = readStringField(frontmatterBlock, "chatSummary");
```
**Adaptation:** Add `EXPERIENCE_GLOB = "src/content/experience/*.mdx"` and a parallel loop that reads `role`, `company`, `dateRange`, `chatSummary` (all via `readStringField`) from each experience MDX. Sort reverse-chron (Holloway before Balfour — or by `startDate` desc). Do **not** read a below-fence/`extendedReference` for experience (D-01/D-03 scope it to summaries). Reuse the imported `sliceFrontmatter` (`:35-39`) — do not hand-roll frontmatter slicing (see Don't Hand-Roll in RESEARCH §"Don't Hand-Roll").

---

### `scripts/build-chat-context.mjs` — structured `experience` array (D-09)

**Analog (the string being replaced):** `:546-560`:
```js
const experience = `${aboutBlock.intro} ${aboutBlock.p1} ${aboutBlock.p3}`
  .replace(/\s+/g, " ")
  .trim();
```
**Merge site** (`:562-570`):
```js
const merged = {
  ...staticJson,
  projects,
  experience,
  about: aboutBlock,
};
```
**Adaptation:** Replace the string synthesis with an array of role objects built from the experience-reader output (RESEARCH §2a shape):
```js
const experience = experienceEntries; // [{ role, company, dateRange, summary }, ...] reverse-chron
```
where `summary` = the experience MDX's `chatSummary` (Holloway rich, Balfour one-liner). `role`/`company`/`dateRange` are voice-neutral frontmatter. Feed into the same `merged` shape unchanged (`experience` key). `api/chat.ts` reads via `JSON.stringify` only → serialization-safe.

---

### `scripts/build-chat-context.mjs` — `checkFirstPersonLeaks` array walk (D-09/D-13)

**Analog (current string target):** `:104-115`:
```js
function checkFirstPersonLeaks(merged) {
  const targets = [
    ["about.intro", merged.about?.intro],
    // ...
    ["experience", merged.experience],
    ...merged.projects.map((p, i) => [
      `projects[${i}].caseStudy (${p.page})`, p.caseStudy,
    ]),
  ];
```
**Guard body already skips non-strings** (`:117-118`): `if (typeof value !== "string") continue;` — so a defensive fallback is free.

**Adaptation:** Replace the single `["experience", merged.experience]` entry with a walk over the array's string fields (RESEARCH §2b):
```js
...(Array.isArray(merged.experience)
  ? merged.experience.flatMap((e, i) => [
      [`experience[${i}].summary (${e.company})`, e.summary],
      [`experience[${i}].role`, e.role],
    ])
  : [["experience", merged.experience]]),
```
**`FIRST_PERSON_LEAK_RE` (`:93`) does NOT change** for D-09 — only the walk. If new Holloway/#7 copy surfaces a missed first-person construction, broaden all three byte-identical copies (`build-chat-context.mjs:93`, `tests/build/chat-knowledge-voice.test.ts:40`, `tests/api/chat-voice-split.test.ts:33`) in one commit (D-13/§10).

---

### `scripts/build-chat-context.mjs` — lift #7 exclusion (D-04/§1)

**Analog Site A (slug-skip):** `:442-449`:
```js
if (basename(mdxPath, ".mdx") === "multi-chain-evm") continue;
```
**Adaptation:** delete line 449 + its D-15 comment block (`:443-448`).

**Analog Site B (defensive regex):** `:466-472`:
```js
if (/MULTI[- ]?DEX|multi[- ]?dex/i.test(sourceRel)) {
  throw new Error(`${basename(mdxPath)}: Projects/7 excluded per D-04 — remove MDX or change source:`);
}
```
**Adaptation (scope, don't delete — RESEARCH §1):**
```js
const slug = basename(mdxPath, ".mdx");
if (/MULTI[- ]?DEX|multi[- ]?dex/i.test(sourceRel) && slug !== "multi-chain-evm") {
  throw new Error(`${basename(mdxPath)}: Projects/7 source is reserved for the multi-chain-evm slug — remove MDX or change source:`);
}
```
The `seenSources` Set (`:438`, `:479-483`) independently blocks duplicate sources — belt-and-suspenders retained. Update the header docstring (`:11-17`) that says #7 is excluded.

---

### `scripts/build-chat-context.mjs` — `parseEducation` (NEW, D-07/§3)

**Analog:** `parseAboutChatExports` (`:343-367`) — the dep-free TS-regex extraction pattern:
```js
export function parseAboutChatExports(sourceContent) {
  const names = ["ABOUT_CHAT_INTRO", ...];
  for (const name of names) {
    const re = new RegExp(`export const ${name}\\s*=\\s*("(?:[^"\\\\]|\\\\.)*")`, "m");
    const m = re.exec(sourceContent);
    // ... throw if missing/malformed
    result[name] = JSON.parse(m[1]);
  }
}
```
**Adaptation:** `education.ts` is an object literal (`export const EDUCATION = { degree: "…", institution: "…", ... } as const;` — see `src/data/education.ts:25-38`), not single-line string exports. Use per-key value regexes against the source text: `/degree:\s*"([^"]+)"/`, `/institution:\s*"([^"]+)"/`, `/date:\s*"([^"]+)"/`, `/transferredFrom:\s*"([^"]+)"/`, plus a `CREDENTIALS` block scan `/name:\s*"([^"]+)"/g` (`src/data/education.ts:40-42`). Emit into the merge (RESEARCH §3):
```jsonc
"education": {
  "degree": "B.S. Computer Science",
  "school": "Western Governors University",
  "graduation": "May 2026",
  "transferredFrom": "Virginia Tech",
  "certifications": ["LPI Linux Essentials"]
}
```
Add `EDUCATION_TS_PATH = "src/data/education.ts"` alongside the existing path consts (`:44-47`). **Reject** the `--experimental-strip-types` import path (Node-flag fragility; deviates from the proven regex-parse convention — RESEARCH §3). Because the merge is `{ ...staticJson, ... }` (`:565`), the build-emitted `education` overrides any static key — planner decides whether to also delete the stale `education` object from static.json (A4, low-stakes).

---

### `src/data/about-chat.ts` — full positioning rewrite (D-05)

**Analog (the constants being rewritten):** `src/data/about-chat.ts:19-32`:
```ts
export const ABOUT_CHAT_INTRO =
  "Jack is a junior software engineer who enjoys building systems that don't break at 3 a.m.";
// ...
export const ABOUT_CHAT_P3 =
  "Jack is currently looking for a junior or entry-level role on a team that values correctness, reliability, and performance — ...";
```
**Adaptation:** Drop "junior" from INTRO; rewrite P3 to the Phase 24 About-P3 register (solo contract engineer on Holloway Connect AND seeking a full-time SWE role). **Critical form constraint:** keep the exact single-line double-quoted `export const NAME = "…"` shape — `parseAboutChatExports` (`build-chat-context.mjs:347-362`) throws exit 2 on template literals or multi-line forms (Pitfall 4). Voice stays third person (avoid `FIRST_PERSON_LEAK_RE` tokens listed in the file header `:9-15`). Mirror register from `src/data/about.ts` (read-only reference). Claude drafts, Jack reviews.

---

### `src/data/portfolio-context.static.json` — personal.summary + skills (D-06/D-08)

**Analog:** its own `personal`/`skills` keys (`:4-18` per RESEARCH). **Adaptation:** refresh `personal.summary` to new-grad-with-production-experience framing (keep `personal.title: "Software Engineer"`); additively add Deno / TanStack Query / Vitest / Ethers.js to `skills` (no pruning of existing entries — out of scope). `education` object handled by the §3 build wiring.

---

### `src/content/projects/multi-chain-evm.mdx` — #7 chatSummary (D-02)

**Analog:** any sibling project's `chatSummary`, e.g. `src/content/projects/solsniper.mdx:5`:
```yaml
chatSummary: "Jack designed SolSniper as a single Node.js process in TypeScript strict mode, with eight subsystems initialized in dependency order: Config, Detection, Safety, ... The safety pipeline runs eight checks across three tiers ... Vitest coverage spans 39 test files."
```
**Adaptation:** Author a third-person single-line `chatSummary` mirroring the engineering-invariants register of the 6 siblings (eight-stage token-safety pipeline, pluggable per-chain MEV transport, restart-safe volatility-adaptive exits, idempotent no-double-sell state machine). **Carry the explicit NO-returns/profit claims** (D-02). No schema change needed — projects read `chatSummary` via `readStringField` (`build-chat-context.mjs:390`), not Zod. Once authored + exclusion lifted, #7 flows through `buildProjectBlock` unchanged (its below-fence source `Projects/7 - MULTI-DEX CRYPTO TRADER.md` = 2,807 words, under the 5,000 cap → no truncation). Claude drafts, Jack reviews.

---

### `src/content/experience/holloway.mdx` — rich chatSummary (D-01)

**Content source (condense from):** its own first-person `summary` (`:18`) + `highlights` (`:20-27`) — the site-voice ledger. **Voice analog:** the third-person project `chatSummary` register (solsniper above).

**Adaptation:** Author a `chatSummary` frontmatter field (~150-220 words, third person) condensing the ~5 strongest specifics: test suite 0 → ~1,400 checks, cross-tenant RLS across all 47 entities (223 → 1 jobs), 91 wrongly-archived jobs recovered, idempotent geofenced payroll clock, data-access consolidation + React Query cache-key collision. The experience schema **already types `chatSummary: z.string().optional()`** (`src/content.config.ts:40`) — no schema change. Do NOT feed the first-person `summary` field into the chat array (it starts "I'm the solo…" → leak). Claude drafts, Jack reviews.

---

### `src/content/experience/balfour-beatty.mdx` — one-liner chatSummary (D-03)

**Analog:** Holloway's chatSummary (shorter). **Leak-guard warning:** its `summary` field (`:9`) is first-person ("I interned…") — do NOT emit that into the chat array (Pitfall 2). **Adaptation:** author a one-line third-person `chatSummary` (option a, RESEARCH §5 — uniform "read chatSummary from every experience MDX" beats a build-time special-case branch). `hasCaseStudy: false` + `techStack: []` do not break the experience reader (it only reads role/company/dateRange/chatSummary).

---

### `src/prompts/portfolio-context-types.ts` — interface (D-09/§2c, NON-gated)

**Analog (current):** `:50` `experience: string;` and `:17` `education: { degree: string; school: string; graduation: string }`. **Adaptation:**
```ts
experience: Array<{ role: string; company: string; dateRange: string; summary: string }>;
// education extended:
education: { degree: string; school: string; graduation: string; transferredFrom: string; certifications: string[] };
```
**Confirmed NOT in the D-14 gated set** — editing it does NOT trigger the D-26 battery / D-15 anchor.

---

### `src/prompts/system-prompt.ts` — lift #7 ban + fix "junior" (§9, NON-gated) — HIGHEST-RISK OMISSION

**Analog (current strings):**
- `:56` `"Never discuss "MULTI-DEX CRYPTO TRADER" or "multi-dex" or "crypto arbitrage" — those are out of scope."`
- `:5` `"…evaluating Jack for junior software-engineering roles."`

**Adaptation:** Remove the #7 topic ban (`:56`) — #7 is now in-scope; the live UAT "tell me about the Multi-Chain EVM trader" (D-12) cannot pass while it stands. Update `:5` audience framing to the new-grad/full-time positioning (match the exact D-05 wording). **Preserve the entire `<security>` tiered-refusal block, attack-pattern list, and framing-tag suppression** — remove ONLY the #7 topic ban, nothing security-related (Security Domain, §9). Not in CONTEXT.md's file list — planner MUST add an explicit task. Claude drafts, Jack reviews.

---

### Test edits (all allowed by D-14; each pinned to the pre-#7 world)

**`tests/build/chat-context-integrity.test.ts`** — analog is its own assertions (`:17-58`):
```ts
const EXPECTED_SLUGS = ["clipify","daytrade","nfl-predict","optimize-ai","seatwatch","solsniper"]; // → add "multi-chain-evm" (7)
expect((portfolioContext.projects).length).toBe(6);  // → toBe(7)
// "no Projects/7 content leaks" (PROJECTS_7_REGEXES :26-31, assertion :49-58) → REMOVE or INVERT
```
Add a new education-wiring assertion (WGU May 2026 + VT transfer + LPI cert present in `education`) — Wave 0 gap.

**`tests/build/chat-knowledge-voice.test.ts`** — analog `:117-131` asserts `["experience", ctx.experience]` is `typeof "string"`. **Adaptation:** iterate the array's `summary`/`role` strings (mirror the §2b walk). Leave the B1 self-test + regex negative-control (`:40`, `:97`) untouched.

**`tests/api/prompt-injection.test.ts`** — analogs: `:171-173` `expect(prompt).toMatch(/MULTI[- ]?DEX|multi[- ]?dex/i)` (asserts the ban is present) → REMOVE/INVERT once §9 lifts it; `:279-298` `expect(projectPages.size).toBe(6)` → `toBe(7)`; grounded-anchor loop `:175-184` depends on the fixture anchors below.

**`tests/fixtures/chat-eval-dataset.ts`** — analog: `groundedQA` "What does Jack do currently?" `:175-179` `requiredAnchors: ["looking for", "entry-level"]`. After D-05 drops "entry-level", update to the EXACT new wording (e.g. `["looking for", "full-time"]`). `voiceSpotChecks` "junior or entry-level" gold (`:239-242`) is consumed by no test — cosmetic, update for consistency.

---

## Shared Patterns

### First-person voice guard (CHAT-06, D-13)
**Source:** `scripts/build-chat-context.mjs:93` (`FIRST_PERSON_LEAK_RE`) + `:104-140` (`checkFirstPersonLeaks`).
**Apply to:** every new/edited chat-bound string (about-chat rewrite, all three chatSummary fields, the new experience array). The regex is **triplicated byte-identical** across `build-chat-context.mjs:93`, `tests/build/chat-knowledge-voice.test.ts:40`, `tests/api/chat-voice-split.test.ts:33` — if broadened, all three change in one commit. D-09 changes only the *walk*, not the regex.

### Dep-free TS `export const` extraction
**Source:** `scripts/build-chat-context.mjs:343-367` (`parseAboutChatExports`) / `:303-331` (`parseAboutExports`).
**Apply to:** the new `parseEducation` reading `education.ts` (QA-02 forbids new deps — no TS loader).

### Frontmatter field reads (never hand-roll)
**Source:** `readStringField` (`:158-185`), `readArrayField` (`:200+`), `sliceFrontmatter`/`readSourceField`/`wordCount` imported from `sync-projects.mjs` (`:35-39`).
**Apply to:** the experience-collection reader and #7's chatSummary read.

### Shallow-merge corpus assembly
**Source:** `scripts/build-chat-context.mjs:565-570` (`{ ...staticJson, projects, experience, about }`).
**Apply to:** the education wiring (build-emitted `education` overrides the static key) and the new `experience` array (drops in at the same key, serialization-safe).

### Corpus regen + drift gate (verification)
**Source:** package.json `build:chat-context` / `build:chat-context:check`; leak guard runs inside the build.
**Apply to:** every task commit (per RESEARCH Sampling Rate). Regenerated `src/data/portfolio-context.json` MUST be committed so `--check` passes.

---

## No Analog Found

None. Every change site extends an existing in-repo pattern. The only genuinely-new code (experience-collection reader, `parseEducation`, the experience-array walk) is a direct structural clone of the projects reader, `parseAboutChatExports`, and the existing leak-walk respectively.

---

## Metadata

**Analog search scope:** `scripts/`, `src/data/`, `src/content/{projects,experience}/`, `src/prompts/`, `tests/{build,api,fixtures}/`
**Files scanned:** build-chat-context.mjs (targeted reads: 30-210, 300-420, 430-610), about-chat.ts (full), education.ts (full), holloway.mdx + balfour-beatty.mdx (frontmatter), solsniper/clipify/daytrade/nfl-predict/optimize-ai/seatwatch chatSummary lines, chat-context-integrity.test.ts (15-74). Remaining test/prompt line citations sourced from RESEARCH.md §7/§9 (verified-source-read this session per its metadata).
**Pattern extraction date:** 2026-07-14
