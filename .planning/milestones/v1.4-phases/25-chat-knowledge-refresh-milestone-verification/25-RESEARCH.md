# Phase 25: Chat Knowledge Refresh & Milestone Verification - Research

**Researched:** 2026-07-14
**Domain:** Build-time chat-corpus generation (Node `.mjs`) + Astro/TS content pipeline + Vitest milestone gates
**Confidence:** HIGH (every claim below is grounded in the actual source read this session; file:line cited)

## Summary

This phase is almost entirely a **build-script + data-file + test-fixture** edit. The corpus generator `scripts/build-chat-context.mjs` reads MDX/data sources and emits `src/data/portfolio-context.json`, which `src/pages/api/chat.ts` serializes wholesale into the system prompt via `JSON.stringify`. Because the API consumer never reads individual corpus fields by name, the D-09 structured-experience change is serialization-safe — the only type surface is the interface in `src/prompts/portfolio-context-types.ts` (which is **NOT** one of the four D-14 gated files — good news).

The single largest de-risking finding: **CONTEXT.md's file scope is incomplete.** Two required source edits and four required test edits fall outside the file list in CONTEXT.md's `<code_context>`. Most critical: `src/prompts/system-prompt.ts` contains a hard-coded instruction — *"Never discuss 'MULTI-DEX CRYPTO TRADER' or 'multi-dex' or 'crypto arbitrage' — those are out of scope"* (line 56) — that directly forbids the chat from answering about project #7, the very project this phase adds. It also still frames the audience as *"junior software-engineering roles"* (line 5), contradicting D-05. Neither file is gated (D-15/D-26 hold), but both must change for CHAT-10/CHAT-11 to actually work, and their tests (`prompt-injection.test.ts`, `chat-eval-dataset.ts`) pin the old behavior.

**Primary recommendation:** Treat this as six coordinated edit clusters: (1) build-script (lift #7 exclusion, add experience collection reader, restructure `experience`, wire education, extend leak guard); (2) chat data sources (`about-chat.ts`, `portfolio-context.static.json`); (3) new `chatSummary` frontmatter (holloway, multi-chain-evm, balfour); (4) the TS interface + system-prompt ban/positioning fix in `src/prompts/`; (5) the four chat-side test/fixture updates that are currently pinned to "exactly 6 projects / never mention multi-dex / entry-level positioning"; (6) the verification gate pass. Draft all third-person copy for Jack's human review (Phase 24 pattern).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Corpus generation (read sources → emit JSON) | Build script (`scripts/*.mjs`, Node) | — | Runs at `pnpm build`; dep-free Node, no Astro runtime |
| Chat knowledge content (identity/positioning/education/skills) | Data files (`src/data/*`) | Content collections (`src/content/**`) | Hand-curated identity in static.json; voice copy in about-chat.ts; per-item chatSummary in MDX frontmatter |
| Voice contract enforcement | Build script leak guard + Vitest | — | `checkFirstPersonLeaks` hard-fails build (exit 2); tests re-assert on artifact |
| Prompt assembly / voice translation instruction | `src/prompts/*` (system-prompt.ts, chat-request-shape.ts) | — | Wraps corpus into `<knowledge>`; carries the #7 ban + audience framing that must change |
| Runtime SSE serving | `src/pages/api/chat.ts` (Cloudflare Worker SSR) | — | GATED (D-14); consumes corpus by value only — no change expected |
| Milestone verification | Vitest suite + `astro check` + drift gates | — | `pnpm test`, `pnpm exec astro check`, `build:chat-context:check`, dep-lock |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHAT-10 | Build-time `portfolio-context.json` ingests Experience content + project #7 | §1 (lift exclusion), §2 (experience block), §4 (#7 path), §5 (Balfour) — all confirmed against source |
| CHAT-11 | Chat answers Holloway + #7 + updated positioning in 3rd person, CHAT-06 held | §2 (leak guard walk), §5/§6 (about-chat rewrite), **§9 (system-prompt ban MUST lift)** |
| QA-01 | D-26 chat-surface battery + D-15 SSE anchor hold across gated-file changes | §7 (gates enumerated); interface + system-prompt are NON-gated → D-15/D-26 hold trivially |
| QA-02 | `astro check` 0/0/0, Lighthouse (deferred to ship), zero new runtime deps | §7 (dep-lock verification), §8 (token budget) |

## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01 … D-14 — do not re-litigate)

- **D-01 Holloway** = rich third-person `chatSummary` (~150-220 words) on `holloway.mdx`; ~5 strongest specifics. Claude drafts, Jack reviews.
- **D-02 #7** = engineering-invariants `chatSummary` on `multi-chain-evm.mdx`, carrying the explicit NO-returns-claims discipline. Claude drafts, Jack reviews.
- **D-03 Balfour** = one-liner in the corpus; `hasCaseStudy:false` + `techStack:[]` must not break ingestion.
- **D-04 #7 full sibling treatment** = `chatSummary` + full below-fence `extendedReference`; no tighter cap.
- **D-05 Full positioning sync of `about-chat.ts`** — drop "junior", new-grad-with-production-experience, "contracting on Holloway AND seeking full-time SWE". Third person. Claude drafts, Jack reviews.
- **D-06 Refresh `personal.summary`** to new-grad-with-production-experience framing; keep `personal.title: "Software Engineer"`.
- **D-07 Wire chat education to `education.ts` SSoT** — WGU B.S. CS completed May 2026, VT transfer, LPI cert; kill `graduation:"2026"`. Dep-free mechanism (planner's choice).
- **D-08 Light additive skills refresh** — add Deno, TanStack Query, Vitest, Ethers.js; no audit/prune of existing entries.
- **D-09 Replace `experience` one-liner with a structured block** from the experience collection; extend `checkFirstPersonLeaks`; update the TS interface. Planner finalizes JSON shape.
- **D-10 Accept corpus growth (~47-48k tokens); rely on existing INFO/WARN/CAP thresholds.** Stay ≥ 4,096 Haiku cache floor.
- **D-11 Local gates in-phase; production Lighthouse + `/gsd-complete-milestone` at `/gsd-ship`.**
- **D-12 Chat accuracy = automated leak guard + live UAT ask** ("what did Jack do at Holloway?", "tell me about the Multi-Chain EVM trader").
- **D-13 CHAT-06 voice split LOCKED**; leak guard hard-fails (exit 2). Chat pipeline **exempt** from the site-wide em-dash ban (en dashes fine).
- **D-14 Chat-surface gates (QA-01)** — touch only build script, `src/data/*`, MDX chatSummary frontmatter, test files; NOT `BaseLayout.astro`/`global.css`/`chat.ts`/`api/chat.ts`. If a change touches the four gated files, run the full D-26 battery + D-15 anchor.

### Claude's Discretion (this research resolves each below)
- Mechanism to read `education.ts` from `.mjs` (dep-free) — **resolved §3**.
- JSON shape of the structured experience block + leak-guard walk + TS interface update — **resolved §2**.
- Whether Balfour needs `chatSummary` frontmatter vs emitted from `summary`/`highlights` — **resolved §5**.
- How to lift the #7 exclusion cleanly (both hard-fail sites) — **resolved §1**.
- Final wording of all third-person copy — Claude drafts, **Jack reviews** (human checkpoint).

### Deferred Ideas (OUT OF SCOPE)
- Production-edge Lighthouse gate + `/gsd-complete-milestone` → `/gsd-ship`.
- Auditing/pruning the pre-existing curated chat skills list.
- Per-project/per-page OG images.
- The four keyword-matched todos (og-default already shipped; menu breakpoint; cache-hit observability; rate-limiter binding) — all declined false-positives.

## Project Constraints (from CLAUDE.md)
- All UI/UX/visual decisions route through frontend-design — **N/A this phase (no site UI)**.
- Zero em dashes site-wide **EXCEPT the chat pipeline** (D-13): en dashes fine in chat copy; site MDX/data em-dash gates do not scan chat sources (verified §7).
- GSD workflow enforced; atomic commits.
- Do NOT prefix commands with `rtk` in this project (MEMORY: passthrough errors "program not found").
- Use the Bash tool (POSIX) by default despite Windows env.

---

## §1 — Lifting the #7 exclusion (D-04 / D-15): both hard-fail sites mapped

`scripts/build-chat-context.mjs` blocks `multi-chain-evm` at **two** sites. CONTEXT.md's cited line numbers are accurate.

**Site A — the slug-skip (`continue`), line 449** `[VERIFIED: source read]`:
```js
// line 442-449 (inside the `for (const mdxPath of mdxFiles)` loop, BEFORE the try)
if (basename(mdxPath, ".mdx") === "multi-chain-evm") continue;
```
This is the active exclusion. **Action: delete line 449** (and its D-15 comment block, lines 443-448). Once removed, `multi-chain-evm.mdx` flows through the normal `buildProjectBlock` pipeline — but only if it has a `chatSummary` (authored per D-02) and passes the Site-B regex.

**Site B — the defensive `MULTI-DEX` source regex, lines 466-472** `[VERIFIED: source read]`:
```js
// Defensive regex — D-04 reinforcement. Even if a contributor adds
// a multi-dex-trader.mdx with source: "Projects/7 ...", refuse.
if (/MULTI[- ]?DEX|multi[- ]?dex/i.test(sourceRel)) {
  throw new Error(
    `${basename(mdxPath)}: Projects/7 excluded per D-04 — remove MDX or change source:`
  );
}
```
`multi-chain-evm.mdx` has `source: "Projects/7 - MULTI-DEX CRYPTO TRADER.md"` (verified in frontmatter), which **matches this regex** → it would throw exit 2 even after Site A is removed.

**Recommended scoping (do NOT delete outright).** Replace the blanket regex with a slug-aware allow: the regex should still block *any other* MDX whose `source:` points at Projects/7, but permit the one legitimate `multi-chain-evm` slug. Concretely:
```js
const slug = basename(mdxPath, ".mdx");
if (/MULTI[- ]?DEX|multi[- ]?dex/i.test(sourceRel) && slug !== "multi-chain-evm") {
  throw new Error(
    `${basename(mdxPath)}: Projects/7 source is reserved for the multi-chain-evm slug — remove MDX or change source:`
  );
}
```
This keeps the anti-duplicate-source guard (a second MDX re-pointing at Projects/7 still hard-fails via this regex OR the existing `seenSources` duplicate check at lines 479-483) while admitting #7. **Recommendation: MEDIUM-HIGH confidence** — the `seenSources` Set at line 437/479-483 already independently blocks duplicate `source:` values, so the scoped regex is belt-and-suspenders, exactly as CONTEXT.md D-04 intends.

Note: the header docstring (lines 11-17) describing the exclusion must be updated to reflect that #7 is now ingested (documentation hygiene, not functional).

## §2 — Structured experience block (D-09): highest-risk item, fully mapped

**Current synthesis site — lines 546-560** `[VERIFIED: source read]`. Today `merged.experience` is a string:
```js
const experience = `${aboutBlock.intro} ${aboutBlock.p1} ${aboutBlock.p3}`
  .replace(/\s+/g, " ")
  .trim();
```
This is redundant with the `about` block (D-09) and contains nothing about Holloway. **Replace it** with a block built from the `experience` collection.

### (a) Recommended JSON shape — array of role objects (reverse-chronological)
`api/chat.ts` consumes the corpus **only** via `buildChatRequestArgs(portfolioContext, …)` → `buildSystemPrompt(context)` → `JSON.stringify(context, null, 2)` (verified: `src/pages/api/chat.ts:195`, `src/prompts/system-prompt.ts:60`). It never reads `context.experience` by field. **Therefore any JSON-serializable shape is safe.** Recommend an **array** (ordered, mirrors the collection's reverse-chron sort, trivial to walk):
```jsonc
"experience": [
  {
    "role": "Software Engineer, Contract",
    "company": "Holloway Company",
    "dateRange": "May 2026 – Present",
    "summary": "<Holloway third-person chatSummary — D-01>"
  },
  {
    "role": "Project Management Intern",
    "company": "Balfour Beatty",
    "dateRange": "May 2023 – Aug 2023",
    "summary": "<Balfour one-liner — D-03>"
  }
]
```
Holloway first (reverse-chron). `role`/`company`/`dateRange` come straight from experience-MDX frontmatter (voice-neutral); `summary` is the voice-bearing field the leak guard must scan. Array beats a keyed object: it preserves order for the biographer and the walk is a simple index loop.

### (b) `checkFirstPersonLeaks` walk extension (lines 104-140)
Current targets array (lines 105-115) has a single `["experience", merged.experience]` entry that assumes a string. Replace with a walk over the array's string fields:
```js
...(Array.isArray(merged.experience)
  ? merged.experience.flatMap((e, i) => [
      [`experience[${i}].summary (${e.company})`, e.summary],
      // role/company/dateRange are voice-neutral frontmatter; scanning summary is
      // the load-bearing check, but scanning all string fields is cheap and safe:
      [`experience[${i}].role`, e.role],
    ])
  : [["experience", merged.experience]]),
```
The guard body (lines 117-127) already `continue`s on non-strings, so a defensive fallback costs nothing. `FIRST_PERSON_LEAK_RE` (line 93) **already catches first-person** — no regex broadening is strictly required for D-09; only the *walk* changes. (If the Holloway summary needs new tokens the regex misses, broaden all three copies byte-identical — see §10.)

### (c) TS interface location — CONFIRMED **NOT a gated file**
The `PortfolioContext` interface lives in **`src/prompts/portfolio-context-types.ts`** (verified: file header names itself the producer/consumer contract; `experience: string` at **line 50**). This file is **NOT** in the D-14 gated set (`BaseLayout.astro` / `global.css` / `chat.ts` / `api/chat.ts`). **Updating it does NOT trigger the full D-26 battery / D-15 anchor.** Change line 50 from:
```ts
experience: string;
```
to:
```ts
experience: Array<{ role: string; company: string; dateRange: string; summary: string }>;
```
Update the doc comment above it (lines 46-49) accordingly.

> **Flag vs CONTEXT.md:** D-14 says *"confirm the TS interface location before assuming it's out of the gated set."* Confirmed: it is `src/prompts/portfolio-context-types.ts`, **out of the gated set.** No gated-file trigger from D-09.

### Build-script reader for the experience collection
The build script currently globs only `src/content/projects/*.mdx` (`MDX_GLOB`, line 43). Add a parallel read of `src/content/experience/*.mdx`. Reuse the already-imported helpers (`sliceFrontmatter` from `sync-projects.mjs`, line 35-39) + the local `readStringField` (line 158). For each experience MDX: `sliceFrontmatter` → `readStringField(fm, "chatSummary")`, `"role"`, `"company"`, `"dateRange"`. Holloway supplies `chatSummary` (authored, D-01); Balfour's `summary` field of the array = the one-liner (see §5). No below-fence/`extendedReference` reading needed for experience (D-01/D-03 scope it to summaries).

## §3 — Dep-free education wiring (D-07)

**`education.ts` shape** (`src/data/education.ts`) `[VERIFIED: source read]` — `export const EDUCATION = { degree, institution, date, transferredFrom, degreeSchemaName, dateISO } as const;` and `export const CREDENTIALS: Credential[] = [{ name: "LPI Linux Essentials", issuer: "Linux Professional Institute" }];`

**Current stale static.json education object** (`src/data/portfolio-context.static.json` lines 8-12) `[VERIFIED]`:
```json
"education": {
  "degree": "Bachelor of Science in Computer Science",
  "school": "Western Governors University",
  "graduation": "2026"
}
```

**Mechanism recommendation — mirror `parseAboutChatExports` regex-parse (dep-free).** The build script already uses TS-regex extraction twice (`parseAboutExports` line 303, `parseAboutChatExports` line 343). Add a `parseEducation(sourceContent)` that pulls the needed fields from `education.ts` with the same `export const … = { … } as const` pattern. Because `EDUCATION` is an object literal (not single-line string exports), the cleanest dep-free extraction is per-key value regexes, e.g. `/degree:\s*"([^"]+)"/`, `/institution:\s*"([^"]+)"/`, `/date:\s*"([^"]+)"/`, `/transferredFrom:\s*"([^"]+)"/`, plus a `CREDENTIALS` array scan (`/name:\s*"([^"]+)"/g` within the `CREDENTIALS` block). Emit into the corpus a richer education object, e.g.:
```jsonc
"education": {
  "degree": "B.S. Computer Science",
  "school": "Western Governors University",
  "graduation": "May 2026",
  "transferredFrom": "Virginia Tech",
  "certifications": ["LPI Linux Essentials"]
}
```
**Important:** this changes the `education` sub-shape in `portfolio-context-types.ts` (line 17: `education: { degree: string; school: string; graduation: string }`). Extend that type too (still non-gated). Also update the `groundedQA` "Where did Jack study?" anchors in the fixture only if they drift (current anchors `["Western Governors","Computer Science"]` still hold — see §7).

Alternative dep-free path considered: a Node `--experimental-strip-types` import of `education.ts`. **Rejected** — adds Node-version/flag fragility and deviates from the established regex-parse convention; the regex-parse is the proven pattern in this exact script.

## §4 — #7 chatSummary + fenced extendedReference path (D-02 / D-04)

- `multi-chain-evm.mdx` is the **only project missing `chatSummary`** — confirmed: its frontmatter (lines 1-20) has no `chatSummary` field; `buildProjectBlock` throws exit 2 without one (lines 393-397). Author it (D-02, engineering-invariants framing, explicit no-returns discipline).
- **Projects schema reads `chatSummary` via string-field read, NOT Zod** — confirmed: `src/content.config.ts` projects schema (lines 5-23) has no `chatSummary` key; the build script reads it via `readStringField` (line 390). **No schema change needed for #7's chatSummary.** (The experience schema DOES type it optional — line 40.)
- **Fence + word count — DISCREPANCY WITH CONTEXT.md.** `Projects/7 - MULTI-DEX CRYPTO TRADER.md` has exactly one `<!-- CASE-STUDY-START -->` and one `<!-- CASE-STUDY-END -->` (verified programmatically). Below-fence content is **2,807 words / 27,316 chars / ~6,829 est-tokens** — **NOT the 3,378 words CONTEXT.md D-04 claims.** Still well under the 5,000-word `README_WORD_CAP` (line 49) → `truncateReadme` returns `truncated:false`, no truncation marker. Conclusion unchanged (no truncation); the word figure in D-04 is stale.
- The existing pipeline (`buildProjectBlock` 377-422, `sliceReadmeBelowFence` 250-261, `truncateReadme` 268-292, `readStringField`/`readArrayField`) handles #7 unchanged once §1 lifts the exclusion and the `chatSummary` exists.

## §5 — Balfour ingestion robustness (D-03)

- `balfour-beatty.mdx` (verified): `hasCaseStudy: false`, `techStack: []`, `endDate: "2023-08"`, has `summary` + 2 `highlights`, **no `chatSummary`**.
- **Empty/false values won't break the experience reader you build in §2** because that reader only reads `role`/`company`/`dateRange` + a summary string — it does NOT require `techStack`, `hasCaseStudy`, or a fence. (Contrast: the *projects* pipeline requires a fenced source; the experience path deliberately does not.)
- The experience Zod schema **already has `chatSummary: z.string().optional()`** — confirmed `src/content.config.ts:40`. And `techStack: z.array(z.string())` with **no `.min(1)`** (line 37, comment "Balfour is []") — Balfour validates.
- **Recommendation:** Balfour does NOT need a `chatSummary` frontmatter field. Emit its array-entry `summary` from a short, third-person one-liner. Two clean options: (a) author a one-line `chatSummary` on `balfour-beatty.mdx` for symmetry with Holloway (build reads `chatSummary` uniformly); or (b) synthesize the one-liner in the build script from `role`+`company`+`dateRange`. **Prefer (a)** — uniform "read `chatSummary` from every experience MDX" logic is simpler and keeps the one-liner human-reviewable in-source (D-03 says Balfour's copy is tiny; authoring it as `chatSummary` avoids a special-case branch and a first-person leak from `summary` which is first-person site voice, e.g. "I interned…").

> **Leak-guard note:** Balfour's frontmatter `summary` (line 9) is first-person ("I interned…"). Do NOT feed `summary` into the chat array — it would trip `checkFirstPersonLeaks`. Author a third-person `chatSummary` instead (option a).

## §6 — Positioning sync sources (D-05 / D-06 / D-08)

**`about-chat.ts` current state** (verified) — full rewrite target:
- `ABOUT_CHAT_INTRO` (line 19-20): *"Jack is a **junior** software engineer who enjoys building systems that don't break at 3 a.m."* → drop "junior".
- `ABOUT_CHAT_P3` (line 31-32): *"Jack is currently looking for a **junior or entry-level** role…"* → mirror Phase 24 About P3: solo contract engineer on Holloway Connect AND seeking a full-time SWE role that values correctness/reliability/performance.
- `ABOUT_CHAT_P1` (line 23-24) and `ABOUT_CHAT_P2` (line 27-28) may stay largely as-is (voice-neutral craft framing) but review for the new-grad register.
- **Voice rule + banned-token list is documented in the file header (lines 1-16)** — the rewrite must avoid the `FIRST_PERSON_LEAK_RE` tokens. Note P2 uses "His favourite" (British, already third person) — safe.
- These four constants are parsed by `parseAboutChatExports` (line 343) which requires **single-line double-quoted** `export const NAME = "…"` form (line 347-348). Keep that exact form or the build throws exit 2 (lines 359-362).

**`portfolio-context.static.json`:**
- `personal.summary` (line 6) — refresh to new-grad-with-production-experience (D-06); keep `personal.title: "Software Engineer"` (line 4).
- `education` (lines 8-12) — replaced by the §3 wiring (D-07).
- `skills` (lines 13-18) — additive: add **Deno** (languages or a runtime slot), **TanStack Query** (frameworks), **Vitest** (tools), **Ethers.js** (frameworks/libraries) per D-08. Do NOT prune existing entries (out of scope).

**`about.ts` is read-only reference** for the register to third-person-mirror (D-05). Note ABOUT_P2 was removed in Phase 24 24-UAT (commit c1c2022); `parseAboutExports` in the build script still lists `ABOUT_P2` (line 304) but that function is **dead** — the chat about block is sourced from `about-chat.ts` (lines 526-544), not `about.ts`. Do not resurrect `parseAboutExports`.

## §7 — Milestone verification gates (QA-01 / QA-02 / D-11): exact commands & the tests that BREAK

### Commands that run pre-deploy in Phase 25 (D-11)
| Gate | Command | Expectation |
|------|---------|-------------|
| Corpus regeneration (write) | `pnpm build:chat-context` (`node scripts/build-chat-context.mjs`, package.json:14) | writes `portfolio-context.json`; exit 0 |
| Corpus drift gate (CI) | `pnpm build:chat-context:check` (`--check`, package.json:15) | exit 1 on drift → must regen + commit |
| Full build | `pnpm build` = `build:chat-context && wrangler types && astro check && astro build` (package.json:13) | all stages pass |
| Type check | `pnpm exec astro check` | **0 errors / 0 warnings / 0 hints** |
| Full test suite | `pnpm test` (`vitest run`, package.json:22) | all pass (was 676 pass / 2 skip at Phase 24 close) |
| Zero-new-runtime-dep lock (QA-02) | `git diff` on `package.json` `dependencies` block — must be **byte-identical** phase-wide | no additions (Phase 24 precedent: "package.json dependencies byte-identical") |
| First-person leak guard | built into `pnpm build:chat-context` (`checkFirstPersonLeaks`, exit 2) | no leak |

**QA-02 dep-lock — how it's verified:** Phase 23/24 used a "dep-lock exit 0" check + a phase-start baseline (`24-BASELINE.json` recorded 8 protected-file hashes **+ deps**, verified by `scripts/verify-phase24-invariants.mjs`, Node built-ins only). There is **no dedicated `deps` npm script**; the lock is asserted by (a) the invariant-verifier baseline diff and (b) manual `git diff package.json`. **Recommendation:** capture a phase-25 baseline of `package.json` dependencies at plan start and assert byte-identity at the capstone; this phase adds zero new deps (all work is dep-free `.mjs` + existing Vitest).

### D-26 chat-surface battery + D-15 SSE anchor (the "gated" gates)
- **`tests/build/chat-surface-untouched.test.ts`** (Gate E) — source-scans `src/layouts/BaseLayout.astro` for 12 anchors (ChatWidget import/render, pageswap handler, client-script imports). Phase 25 touches none of BaseLayout → **passes untouched**.
- **`tests/api/sse-snapshot.test.ts`** (D-15) — mocks Anthropic (single "Hello" token) and asserts byte-identical SSE frames + headers from `api/chat.ts`, plus a source-text anti-regression on `api/chat.ts`. **The system prompt is an INPUT to `client.messages.create`, not part of the SSE output bytes** — so §9's `system-prompt.ts` edits do NOT affect this snapshot. Phase 25 does not touch `api/chat.ts` → **passes trivially.**

### CRITICAL — chat-side tests that are HARD-PINNED to the pre-#7 world (MUST update)
These are **test files** (allowed by D-14) but CONTEXT.md's canonical-refs list them incompletely. Each will FAIL when #7 lands unless updated:

1. **`tests/build/chat-context-integrity.test.ts`** `[VERIFIED]`:
   - `EXPECTED_SLUGS` (lines 17-24) = exactly 6 slugs; `expect(slugs).toEqual(EXPECTED_SLUGS)` (line 42) → **add `"multi-chain-evm"`** (7 slugs).
   - `expect(projects.length).toBe(6)` (line 46) → **`toBe(7)`**.
   - "no Projects/7 content leaks" (lines 26-58): `PROJECTS_7_REGEXES` bans `/MULTI[- ]?DEX/i`, `/multi[- ]?dex/i`, `/crypto trader/i`, `/crypto arbitrage/i` in the serialized JSON. #7's name/description/chatSummary/extendedReference WILL contain these → **this test must be removed or inverted** (the exclusion it guards is deliberately lifted).
   - "Daytrade truncated" (line 123-135) unaffected.

2. **`tests/api/prompt-injection.test.ts`** `[VERIFIED]`:
   - "contains the Projects/7 (D-04) banlist reinforcement" (lines 171-173): `expect(prompt).toMatch(/MULTI[- ]?DEX|multi[- ]?dex/i)` — asserts the **system prompt still bans multi-dex**. When §9 lifts the ban, this **fails** → remove/invert.
   - "exactly 6 generated-context projects" (lines 279-298): `expect(projectPages.size).toBe(6)` → **7** (and the project-name list at line 288 may add "Multi-Chain EVM" if groundedQA coverage extends).
   - grounded-QA anchor loop (lines 175-184) asserts `prompt.toContain(anchor)` for every `requiredAnchors` — see fixture item below.

3. **`tests/fixtures/chat-eval-dataset.ts`** `[VERIFIED]`:
   - `groundedQA` "What does Jack do currently?" (lines 175-179): `requiredAnchors: ["looking for", "entry-level"]`. After D-05 drops "entry-level" framing, the knowledge block no longer contains "entry-level" → prompt-injection line 175-184 **fails**. **Update these anchors** to the new positioning (e.g. `["looking for", "full-time"]` — match the exact D-05 wording chosen).
   - `voiceSpotChecks` "Is Jack currently looking…" gold (lines 239-242) says "junior or entry-level" — **consumed by NO test** (grep confirms `voiceSpotChecks` appears only at its definition). Cosmetic; update for consistency but it won't break a gate.
   - `GLOBAL_BANNED_REGEXES` multi-dex/crypto entries (lines 41-44) are applied only to attack-vector **refusal responses** in `assertAttackVector` — refusals don't mention #7, so these still pass. Leave unless you add a #7 groundedQA entry.

4. **`tests/build/chat-knowledge-voice.test.ts`** `[VERIFIED]`:
   - "no first-person leak in … or experience" (lines 117-131) includes `["experience", ctx.experience]` and asserts `toBeTypeOf("string")`. After D-09, `experience` is an **array** → **this assertion breaks**. Update to iterate the array's `summary`/`role` strings (mirror the §2b guard walk).
   - The B1 self-test (lines 42-108) and `FIRST_PERSON_LEAK` regex (line 40) are fine; the "Jack is a junior software engineer" SAFE sample (line 97) is a regex negative-control, unrelated to positioning — leave it.

**Not affected (already 7 / site-side):** `projects-collection.test.ts`, `projects-ordering.test.ts`, `voice-em-dash.test.ts` (already list `multi-chain-evm`, lines verified), `featured-tier-render.test.ts` (`toBe(7)`). These were updated in Phase 23 for the site side.

### Deferred to `/gsd-ship` (D-11)
- Production-on-Cloudflare-edge canonical Lighthouse gate (SC4) — requires the production deploy.
- `/gsd-complete-milestone` — archives v1.4.

## §8 — Token budget (D-10)

Multi-threshold observability confirmed in the build script: `TOKEN_BUDGET_INFO = 40000` (line 52), `WARN = 60000` (line 53), `CAP = 80000` (line 54), `MIN_TOKEN_FLOOR = 4096` (line 50), plus per-project breakdown (lines 582-592) and tiered warnings (lines 594-610).

**Recomputed projection (measured, not estimated):**
- Current 6-project corpus: **41,053 est-tokens** (already crossed the 40k INFO line).
- #7 block: extendedReference.content ≈ **6,829 tokens** (2,807 words, §4) + chatSummary (~200-250 words ≈ ~300 tokens) + JSON field overhead ≈ **~7,300 tokens**.
- Structured experience block replacing the ~140-token one-liner: net **~+250 tokens**.
- Education/personal/skills refresh: **~+50 tokens**.
- **Projected total ≈ 48,600 est-tokens.** Crosses INFO (40k), **under WARN (60k)**, far under CAP (80k), far above the 4,096 Haiku cache floor.

> **Flag vs CONTEXT.md:** D-10 estimated #7 at ~4.5k tokens and the total at ~47-48k. The #7 extended-ref is actually ~7.3k (the 2,807-word below-fence body). The **conclusion is unchanged** (INFO crossed, WARN not), but the per-item figure is higher than D-10 assumed. Still comfortably below WARN.

## §9 — SCOPE DISCOVERY: `src/prompts/system-prompt.ts` must change (NOT in CONTEXT.md's file list)

`src/prompts/system-prompt.ts` (the prompt template consumed by `api/chat.ts` via `chat-request-shape.ts`) contains two hard-coded strings that contradict this phase:

1. **The #7 ban — line 56** `[VERIFIED]`:
   > *"Never pivot to projects not listed in the knowledge block. Never discuss "MULTI-DEX CRYPTO TRADER" or "multi-dex" or "crypto arbitrage" — those are out of scope."*
   This directly instructs Haiku to **refuse** questions about project #7 — the project this phase adds to the knowledge block. **CHAT-11 SC + D-12's live UAT ("tell me about the Multi-Chain EVM trader") cannot pass while this line stands.** Must be removed (or narrowed to only ban the raw `Projects/7` filename framing, but cleanest is deletion — #7 is now in-scope).

2. **The "junior" audience framing — line 5** `[VERIFIED]`:
   > *"…evaluating Jack for **junior** software-engineering roles."*
   Contradicts D-05 (drop "junior"). Update to match the new-grad/full-time SWE positioning.

**Gating analysis:** `system-prompt.ts` is in `src/prompts/`, which is **NOT** in the D-14 gated four-file set. Editing it:
- does NOT affect `portfolio-context.json` (separate file) → `build:chat-context:check` unaffected;
- does NOT affect SSE response bytes → D-15 snapshot passes (§7);
- does NOT touch `BaseLayout.astro` → D-26 Gate E passes;
- DOES register in `prompt-injection.test.ts` (lines 171-173 asserts the multi-dex ban is present; line 175-184 asserts grounded anchors) → those assertions must be updated in lockstep (§7).

**Recommendation (HIGH confidence this is required):** Include `system-prompt.ts` edits in the phase, gated behind Jack's copy review (the security `<security>` block and audience framing are sensitive). The planner should add an explicit task for it and NOT rely on CONTEXT.md's incomplete file list. This is the single highest-risk omission in the upstream context.

## §10 — First-person leak regex triplication (D-13)

The canonical `FIRST_PERSON_LEAK` regex is triplicated and **must stay byte-identical** across three sites `[VERIFIED — all three read and confirmed identical]`:
1. `scripts/build-chat-context.mjs:93` (`FIRST_PERSON_LEAK_RE`)
2. `tests/build/chat-knowledge-voice.test.ts:40` (`FIRST_PERSON_LEAK`)
3. `tests/api/chat-voice-split.test.ts:33` (`FIRST_PERSON_LEAK`)

The regex (current, byte-identical in all three):
```
/\b(I(?:['’]|\s)(?:m\b|d\b|ll\b|ve\b|re\b|am\b)|I\s+(?:build|built|like|liked|wonder|wanted|reach|reached|read|architected|chose|haven|wrote|run|set|shipped|added|prefer|care|watch|track|love|hate|made|created|developed|implemented|designed|think|learned|noticed|tried|tested)|My\s+(?:approach|favorite|favourite|projects|code|work|background|stack|version|first|implementation|solution|design|team|experience))\b/i
```
**D-09 does NOT require broadening this regex** — it already catches first-person leading clauses; only the *walk* (§2b) changes to reach the new experience array. **If** authoring the Holloway/#7/Balfour summaries surfaces a first-person construction the regex misses (unlikely — draft in third person), broaden **all three copies identically** in the same commit. There is no shared-module extraction (deferred per 17-REVIEW-GAPS.md WR-02).

## Files to Create / Modify

**Modify — build script (1):**
- `scripts/build-chat-context.mjs` — lift #7 exclusion (§1: delete line 449, scope regex 466-472); add experience-collection reader (§2); replace `experience` synthesis (lines 546-560) with the structured array; add `parseEducation` + wire education into the merge (§3); extend `checkFirstPersonLeaks` walk (§2b); update header docstring.

**Modify — chat data sources (2):**
- `src/data/about-chat.ts` — full third-person positioning rewrite (§6, D-05); keep single-line double-quoted export form.
- `src/data/portfolio-context.static.json` — refresh `personal.summary` (D-06); education replaced by §3 wiring (values now derived, so the static `education` object may be dropped/overridden by the build merge — planner decides whether to delete it from static.json and emit from the build, given the build merge is `{ ...staticJson, … }` at line 565); additive `skills` (D-08).

**Modify — content frontmatter (3):**
- `src/content/projects/multi-chain-evm.mdx` — add `chatSummary` (D-02).
- `src/content/experience/holloway.mdx` — add `chatSummary` (D-01).
- `src/content/experience/balfour-beatty.mdx` — add one-line `chatSummary` (D-03, §5 option a).

**Modify — prompt/type layer (2, both NON-gated):**
- `src/prompts/portfolio-context-types.ts` — `experience` → array type (§2c); extend `education` sub-type (§3).
- `src/prompts/system-prompt.ts` — remove #7 ban (line 56); fix "junior" framing (line 5) (§9).

**Modify — tests/fixtures (4):**
- `tests/build/chat-context-integrity.test.ts` — slugs 6→7; count 6→7; remove/invert the #7-leak assertions (§7.1).
- `tests/api/prompt-injection.test.ts` — remove/invert the multi-dex-banlist assertion; project count 6→7 (§7.2).
- `tests/fixtures/chat-eval-dataset.ts` — update "current" groundedQA anchors to new positioning; optional voiceSpotChecks refresh (§7.3).
- `tests/build/chat-knowledge-voice.test.ts` — walk `experience` as an array, not a string (§7.4).

**Regenerated artifact (do not hand-edit):**
- `src/data/portfolio-context.json` — regenerated by `pnpm build:chat-context`; must be committed so `build:chat-context:check` passes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Read `source:`/frontmatter from MDX | New parser | `readSourceField`/`sliceFrontmatter`/`wordCount` from `sync-projects.mjs` (already imported line 35-39) | Battle-tested, path-escape-guarded, CRLF-normalized |
| Read a scalar frontmatter field | New regex each time | `readStringField` (line 158) | Handles quoted/unquoted, rejects escaped quotes |
| Parse a TS `export const` from `.mjs` | TS loader / new dep | `parseAbout*Exports` regex pattern (lines 303/343) | Established dep-free convention; QA-02 forbids new deps |
| Enforce third-person voice | New checker | Extend `checkFirstPersonLeaks` walk (line 104) | Regex is canonical + triplicated; only the walk changes |
| Truncate/slice below-fence | New logic | `sliceReadmeBelowFence`/`truncateReadme` (lines 250/268) | #7 flows through unchanged (no truncation at 2,807w) |

## Common Pitfalls

### Pitfall 1: Lifting only the slug-skip, forgetting the defensive regex
Removing line 449 alone leaves the `/MULTI[- ]?DEX/i` throw at 468 → build exits 2 on #7's `source:`. **Both** sites must be handled together (§1).

### Pitfall 2: Feeding Balfour's first-person `summary` into the chat array
`balfour-beatty.mdx` `summary` starts "I interned…" (first person). Piping it into `experience[].summary` trips `checkFirstPersonLeaks` (exit 2). Author a third-person `chatSummary` instead (§5).

### Pitfall 3: Assuming CONTEXT.md's file list is complete
`system-prompt.ts` (the #7 ban + "junior") and four test/fixture files are required edits not enumerated in CONTEXT.md's `<code_context>`. Missing the system-prompt ban means the chat silently refuses to discuss #7 despite the corpus containing it — the live UAT (D-12) would catch it late (§9).

### Pitfall 4: Breaking `parseAboutChatExports` form
The `about-chat.ts` rewrite must keep single-line double-quoted `export const ABOUT_CHAT_* = "…"` — a template literal or multi-line form throws exit 2 (lines 359-362).

### Pitfall 5: Trusting D-04's 3,378-word figure
Actual below-fence is 2,807 words / ~6,829 tokens. Still no truncation (<5,000 cap), but the token budget is ~7.3k for #7, not ~4.5k — the corpus lands ~48.6k, not ~47-48k. Under WARN either way (§8).

### Pitfall 6: Regenerating the SSE snapshot fixture
`tests/fixtures/sse-snapshot-*.{bin,json}` are frozen (D-15). This phase gives zero reason to touch them — system-prompt changes don't affect SSE bytes (§7). If the SSE snapshot ever fails here, something touched `api/chat.ts` (it should not).

## State of the Art / Prior-phase lineage
- Phase 23-01 re-plumbed the #7 chat exclusion as the explicit `multi-chain-evm` slug-continue (line 449) with the defensive regex retained dormant — "Phase 25 lifts it" (STATE.md). §1 executes that.
- Phase 24 created `education.ts` as SSoT and removed ABOUT_P2 (commit c1c2022); the chat about block reads `about-chat.ts`, so Phase 24's site edits kept `portfolio-context.json` byte-identical. §3/§6 now propagate education + positioning into chat.

## Validation Architecture

> Nyquist validation ENABLED for this phase.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (`vitest run`) |
| Config file | `vitest.config.*` at repo root (test scripts in package.json:22) |
| Quick run command | `pnpm exec vitest run tests/build/chat-context-integrity.test.ts tests/build/chat-knowledge-voice.test.ts tests/api/chat-voice-split.test.ts tests/api/prompt-injection.test.ts` |
| Full suite command | `pnpm test` (`vitest run`) |
| Corpus regen + drift | `pnpm build:chat-context` then `pnpm build:chat-context:check` |

### Phase Requirements → Test Map
| Req | Behavior | Test Type | Automated Command | Exists? |
|-----|----------|-----------|-------------------|---------|
| CHAT-10 | #7 present in corpus (7 slugs, non-empty caseStudy + extendedReference) | build/integration | `vitest run tests/build/chat-context-integrity.test.ts` | ✅ (must edit 6→7 + drop #7-ban) |
| CHAT-10 | Structured `experience` array (Holloway + Balfour) present, third person | build | `vitest run tests/build/chat-knowledge-voice.test.ts` | ✅ (must edit string→array walk) |
| CHAT-10 | Education wired from `education.ts` (WGU May 2026 + VT + LPI) | build | new assertion in chat-context-integrity or a new `tests/build/chat-education-wiring.test.ts` | ❌ Wave 0 |
| CHAT-11 | No first-person leak in any chat-bound field incl. new experience block | build guard | `checkFirstPersonLeaks` (exit 2) via `pnpm build:chat-context` | ✅ (walk extended) |
| CHAT-11 | System prompt no longer bans #7; grounded anchors match new positioning | api | `vitest run tests/api/prompt-injection.test.ts` | ✅ (must edit ban + count + anchors) |
| CHAT-11 | Corpus asserts #7 + Holloway presence (floor, not substitute for live UAT) | build | new assertion: `experience[].company` includes "Holloway"; a project slug `multi-chain-evm` present | ❌ Wave 0 |
| CHAT-11 | Live chat answers "Holloway" + "Multi-Chain EVM" accurately in 3rd person | manual UAT | `/gsd-verify-work`-style ask against running dev chat (D-12) | manual-only |
| QA-01 | D-26 BaseLayout anchors intact | build | `vitest run tests/build/chat-surface-untouched.test.ts` | ✅ passes untouched |
| QA-01 | D-15 SSE bytes/headers byte-identical | api | `vitest run tests/api/sse-snapshot.test.ts` | ✅ passes untouched |
| QA-02 | `astro check` 0/0/0 | typecheck | `pnpm exec astro check` | ✅ |
| QA-02 | Zero new runtime deps | invariant | `git diff package.json` dependencies block byte-identical | manual/baseline |
| QA-02 | Corpus no-drift after regen | CI gate | `pnpm build:chat-context:check` (exit 1 on drift) | ✅ |

### Sampling Rate
- **Per task commit:** the quick 4-file chat test set + `pnpm build:chat-context` (leak guard runs here).
- **Per wave merge:** `pnpm test` full suite + `pnpm exec astro check`.
- **Phase gate (capstone):** `pnpm build` end-to-end (build:chat-context → wrangler types → astro check → astro build) green + full suite green + `build:chat-context:check` clean + dep-lock byte-identical + **live chat UAT ask (D-12)** before `/gsd-verify-work`.

### Un-observable-without-a-test behaviors (why these need explicit tests)
- **First-person leak in the new experience array** — only caught by the extended `checkFirstPersonLeaks` walk; a string-only walk silently skips array entries (the #1 regression risk of D-09).
- **#7 discussability** — the corpus can contain #7 while the system prompt still refuses it (§9). A prompt-injection assertion that the ban is GONE + the live UAT are the only observers; a corpus-presence test alone gives a false green.
- **Education drift** — nothing today asserts the chat education matches `education.ts`; add a Wave 0 assertion so the SSoT link can't silently rot.

### Wave 0 Gaps
- [ ] `tests/build/chat-context-integrity.test.ts` — retarget to 7 slugs (incl `multi-chain-evm`) and remove/invert the #7-leak block.
- [ ] `tests/build/chat-knowledge-voice.test.ts` — walk `experience` as an array.
- [ ] `tests/api/prompt-injection.test.ts` — drop the multi-dex-ban assertion; project count 6→7.
- [ ] `tests/fixtures/chat-eval-dataset.ts` — update "current" groundedQA anchors to new positioning.
- [ ] New: education-wiring assertion (WGU May 2026 + VT transfer + LPI cert present in `education`).
- [ ] New (optional but recommended): experience-block presence assertion (Holloway company + Balfour present, reverse-chron).

## Security Domain

> `security_enforcement` default (absent = enabled). This phase changes CHAT KNOWLEDGE + the prompt template — the prompt-injection defenses are directly in scope.

### Applicable ASVS Categories
| ASVS | Applies | Standard Control (existing, do not weaken) |
|------|---------|--------------------------------------------|
| V5 Input Validation | yes | `src/lib/validation.ts` `validateRequest`/`sanitizeMessages` (untouched this phase) |
| V5 / LLM prompt-injection | yes | `system-prompt.ts` `<security>` block + `prompt-injection.test.ts` 10-vector battery |
| V6 Cryptography | no | — |
| V4 Access Control | no (corpus is public content) | — |

### Threat patterns for this change
| Pattern | STRIDE | Mitigation (must preserve while editing system-prompt.ts §9) |
|---------|--------|-------------------------------------------------------------|
| Prompt-exfiltration / jailbreak | Info disclosure | Keep the `<security>` tiered-refusal block, the attack-pattern list, and the "never output framing tags" rule — only remove the #7-topic ban, nothing else (§9) |
| Corpus-injected first-person / voice break | Tampering | `checkFirstPersonLeaks` exit 2 + triplicated regex (§10) |
| Widening the multi-dex ban removal too far | Info disclosure | Remove ONLY the #7-topic ban; do NOT relax the resume/PII refusal tiers or the framing-tag suppression |

**Note:** removing the #7 ban is a *reduction* of an over-broad content restriction, not a security weakening — #7 is public portfolio content. The PII/resume tiers and injection defenses stay byte-intact. `prompt-injection.test.ts`'s injection/PII vectors are unaffected; only its multi-dex-banlist assertion and project-count change.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `system-prompt.ts` #7 ban will cause Haiku to refuse/waffle on #7 even with #7 in the knowledge block | §9 | LOW — the instruction is explicit ("Never discuss…"); even if Haiku sometimes complies, leaving a self-contradicting prompt is unacceptable. Live UAT (D-12) is the backstop. |
| A2 | Array-of-roles is the preferred `experience` shape | §2a | LOW — any JSON shape serializes; array chosen for order + simple walk. Planner may pick an object; both pass. |
| A3 | Balfour authored as `chatSummary` (option a) beats build-time synthesis (option b) | §5 | LOW — both work; option a avoids a special-case branch and keeps copy human-reviewable. |
| A4 | Dropping the static `education` object and emitting it from the build merge is acceptable | §3 / Files | LOW — the merge is `{...staticJson, …}`; planner decides whether education stays a static key (overwritten) or is fully build-emitted. Either is dep-free. |

**All other claims are `[VERIFIED: source read]` this session** (file:line cited inline). No `[ASSUMED]` package/API facts — this phase installs nothing (QA-02).

## Package Legitimacy Audit

**Not applicable — this phase installs ZERO external packages (QA-02 zero-new-runtime-dependency lock).** All work uses existing deps (Vitest, Astro, the Node built-ins the `.mjs` scripts already use). No `npm install` occurs. The dep-lock gate (§7) verifies `package.json` `dependencies` stays byte-identical.

## Open Questions (both RESOLVED by the plans)

1. **Exact new positioning wording for `ABOUT_CHAT_P3` + `personal.summary` + `system-prompt.ts` line 5** — Claude drafts, Jack reviews (D-05/D-06 human checkpoint). The groundedQA anchor update (§7.3) must use the EXACT chosen words (e.g. if the copy says "full-time software engineering role", the anchor should be `"full-time"`, not a guess).
   - Recommendation: draft all four surfaces (about-chat P3, personal.summary, system-prompt audience line, groundedQA anchor) in one review pass so they stay mutually consistent.
   - **(RESOLVED IN PLANS: the 25-02 human copy-review checkpoint owns final wording; 25-01 sets the groundedQA anchor to the chosen words in the same pass.)**
2. **Keep or delete `static.json` `education` object** — see A4; low-stakes, planner's call. **(RESOLVED IN PLANS: decided in 25-02 Task 2B.)**

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node ≥ 22 | build `.mjs` scripts | ✓ (engines pin, package.json:7) | ≥22 | — |
| pnpm | all scripts | ✓ | — | — |
| Vitest | test suite | ✓ (devDep 4.1.0) | 4.1.0 | — |
| Astro CLI (`astro check`) | QA-02 typecheck | ✓ (dep 6.0.8 + @astrojs/check) | 6.x | — |

No external services/tools beyond the existing toolchain. (Live UAT D-12 needs `astro dev` running locally — no new dependency.)

## Sources

### Primary (HIGH confidence — direct source read this session)
- `scripts/build-chat-context.mjs` (exclusion sites 449/466-472, leak guard 104-140, regex 93, experience synthesis 546-560, education/static merge 517-570, token thresholds 50-54)
- `scripts/sync-projects.mjs` (reused helpers 63-127) · `scripts/sync-experience.mjs` (header/glob)
- `src/content.config.ts` (projects schema no chatSummary; experience schema chatSummary optional line 40, techStack no-min line 37)
- `src/data/about-chat.ts`, `src/data/education.ts`, `src/data/portfolio-context.static.json`
- `src/content/experience/{holloway,balfour-beatty}.mdx`, `src/content/projects/multi-chain-evm.mdx`
- `src/prompts/{portfolio-context-types.ts, system-prompt.ts, chat-request-shape.ts}` · `src/pages/api/chat.ts`
- Tests: `chat-context-integrity`, `chat-knowledge-voice`, `chat-voice-split`, `prompt-injection`, `sse-snapshot`, `chat-surface-untouched`, `site-copy-em-dash`, `voice-em-dash`, `experience-voice-em-dash`; fixture `chat-eval-dataset.ts`
- Measured: Projects/7 below-fence = 2,807 words / ~6,829 tokens; current corpus = 41,053 tokens (Node one-liners)
- `.planning/phases/25-.../25-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`

## Metadata

**Confidence breakdown:**
- File/line evidence for every discretion item: HIGH — all source read directly.
- Test-breakage enumeration: HIGH — each pinned assertion located and quoted.
- system-prompt scope discovery (§9): HIGH — the ban text is verbatim in source.
- Token projection (§8): HIGH — measured, not estimated.
- Exact final copy wording: LOW by design — human-review checkpoint (D-05/D-06).

**Research date:** 2026-07-14
**Valid until:** ~2026-08-14 (stable domain; only churns if the build script or chat tests are refactored before planning)
